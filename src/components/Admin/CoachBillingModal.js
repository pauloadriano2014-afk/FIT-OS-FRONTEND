// src/components/Admin/CoachBillingModal.js
// Modal de billing do coach — Paulo escolhe plano, gera cobrança, vê crédito de upgrade
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, ActivityIndicator, Platform, Alert, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://fitos-final.onrender.com';

// ─── PLANOS (espelho do backend) ──────────────────────────────────────────────
const PLANS_BY_TYPE = {
    PERSONAL: [
        { key:'PERSONAL_LAUNCH',     label:'🔥 Lançamento (3 meses)', monthlyPrice:'R$69,90/mês', totalPrice:'R$209,70', isPromo:true  },
        { key:'PERSONAL_MONTHLY',    label:'Mensal',                  monthlyPrice:'R$97/mês',    totalPrice:'R$97',     isPromo:false },
        { key:'PERSONAL_QUARTERLY',  label:'Trimestral',              monthlyPrice:'R$91/mês',    totalPrice:'R$273',    isPromo:false },
        { key:'PERSONAL_SEMIANNUAL', label:'Semestral',               monthlyPrice:'R$85/mês',    totalPrice:'R$510',    isPromo:false },
        { key:'PERSONAL_ANNUAL',     label:'Anual',                   monthlyPrice:'R$79/mês',    totalPrice:'R$948',    isPromo:false },
    ],
    NUTRICIONISTA: [
        { key:'NUTRI_LAUNCH',        label:'🔥 Lançamento (3 meses)', monthlyPrice:'R$69,90/mês', totalPrice:'R$209,70', isPromo:true  },
        { key:'NUTRI_MONTHLY',       label:'Mensal',                  monthlyPrice:'R$97/mês',    totalPrice:'R$97',     isPromo:false },
        { key:'NUTRI_QUARTERLY',     label:'Trimestral',              monthlyPrice:'R$91/mês',    totalPrice:'R$273',    isPromo:false },
        { key:'NUTRI_SEMIANNUAL',    label:'Semestral',               monthlyPrice:'R$85/mês',    totalPrice:'R$510',    isPromo:false },
        { key:'NUTRI_ANNUAL',        label:'Anual',                   monthlyPrice:'R$79/mês',    totalPrice:'R$948',    isPromo:false },
    ],
    ELITE: [
        { key:'ELITE_LAUNCH',        label:'🔥 Lançamento (3 meses)', monthlyPrice:'R$109,90/mês',totalPrice:'R$329,70', isPromo:true  },
        { key:'ELITE_MONTHLY',       label:'Mensal',                  monthlyPrice:'R$147/mês',   totalPrice:'R$147',    isPromo:false },
        { key:'ELITE_QUARTERLY',     label:'Trimestral',              monthlyPrice:'R$138/mês',   totalPrice:'R$414',    isPromo:false },
        { key:'ELITE_SEMIANNUAL',    label:'Semestral',               monthlyPrice:'R$129/mês',   totalPrice:'R$774',    isPromo:false },
        { key:'ELITE_ANNUAL',        label:'Anual',                   monthlyPrice:'R$119/mês',   totalPrice:'R$1.428',  isPromo:false },
    ],
};

const STATUS_COLORS = {
    ACTIVE:    '#34C759',
    PENDING:   '#FF9500',
    OVERDUE:   '#FF3B30',
    CANCELLED: '#8E8E93',
};

export default function CoachBillingModal({ visible, onClose, coach, theme }) {
    const [adminId,       setAdminId]       = useState('');
    const [selectedPlan,  setSelectedPlan]  = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [loading,       setLoading]       = useState(false);
    const [result,        setResult]        = useState(null); // cobrança gerada
    const [isUpgrade,     setIsUpgrade]     = useState(false);
    const [upgradePreview,setUpgradePreview]= useState(null); // crédito calculado

    const coachType = coach?.coachPlan ?? 'PERSONAL';
    const plans     = PLANS_BY_TYPE[coachType] ?? PLANS_BY_TYPE.PERSONAL;
    const hasActivePlan = !!coach?.coachBillingPlan && coach?.coachBillingStatus === 'ACTIVE';

    useEffect(() => {
        AsyncStorage.getItem('user').then(json => {
            if (json) setAdminId(JSON.parse(json).id ?? '');
        });
        if (visible) {
            setResult(null);
            setSelectedPlan('');
            setIsUpgrade(false);
            setUpgradePreview(null);
        }
    }, [visible]);

    // Calcula preview de upgrade quando seleciona plano
    useEffect(() => {
        if (!isUpgrade || !selectedPlan || !coach?.coachBillingEnd) {
            setUpgradePreview(null);
            return;
        }
        const end   = new Date(coach.coachBillingEnd);
        const now   = new Date();
        const daysR = Math.max(0, Math.round((end.getTime() - now.getTime()) / (1000 * 3600 * 24)));

        // Busca o valor total pago no plano atual
        const currentPlans = Object.values(PLANS_BY_TYPE).flat();
        const currentPlanInfo = currentPlans.find(p => p.key === coach.coachBillingPlan);
        const totalPaid = currentPlanInfo
            ? parseFloat(currentPlanInfo.totalPrice.replace('R$','').replace('.','').replace(',','.'))
            : 0;

        // Dias totais do plano atual
        const start = coach.coachBillingStart ? new Date(coach.coachBillingStart) : now;
        const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

        const credit = totalDays > 0 ? Math.round((totalPaid / totalDays) * daysR * 100) / 100 : 0;

        // Valor do novo plano
        const newPlanInfo = plans.find(p => p.key === selectedPlan);
        const newTotal = newPlanInfo
            ? parseFloat(newPlanInfo.totalPrice.replace('R$','').replace('.','').replace(',','.'))
            : 0;

        const chargeValue = Math.max(5, Math.round((newTotal - credit) * 100) / 100);

        setUpgradePreview({ daysR, credit, newTotal, chargeValue });
    }, [isUpgrade, selectedPlan, coach]);

    const handleGenerate = async () => {
        if (!selectedPlan) {
            const msg = 'Selecione um plano.';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Atenção', msg);
            return;
        }

        setLoading(true);
        try {
            const endpoint = isUpgrade
                ? `${BASE_URL}/api/admin/coach-billing/upgrade`
                : `${BASE_URL}/api/admin/coach-billing/create`;

            const body = isUpgrade
                ? { adminId, coachId: coach.id, newBillingPlan: selectedPlan, paymentMethod }
                : { adminId, coachId: coach.id, billingPlan: selectedPlan, paymentMethod };

            const res  = await fetch(endpoint, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                const msg = data.error || 'Erro ao gerar cobrança.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
                return;
            }

            setResult(data);
        } catch (e) {
            const msg = 'Erro de conexão.';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
        } finally {
            setLoading(false);
        }
    };

    const openLink = (url) => {
        if (!url) return;
        Linking.openURL(url).catch(() => {});
    };

    const copyPix = (text) => {
        if (!text) return;
        if (Platform.OS === 'web') {
            navigator.clipboard?.writeText(text);
            window.alert('PIX copiado!');
        } else {
            Alert.alert('PIX', text.substring(0, 60) + '...\n\n(Copie manualmente)');
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    };

    if (!coach) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={[styles.container, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, paddingLeft: 12 }}>
                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 14 }}>BILLING DO COACH</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 1 }}>{coach.name}</Text>
                        </View>
                        {coach.coachBillingStatus && (
                            <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[coach.coachBillingStatus] ?? '#8E8E93') + '20', borderColor: (STATUS_COLORS[coach.coachBillingStatus] ?? '#8E8E93') + '50' }]}>
                                <Text style={{ fontSize: 10, fontWeight: '900', color: STATUS_COLORS[coach.coachBillingStatus] ?? '#8E8E93' }}>
                                    {coach.coachBillingStatus}
                                </Text>
                            </View>
                        )}
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>

                        {/* Plano atual */}
                        {hasActivePlan && (
                            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: '#34C75940' }]}>
                                <Text style={[styles.cardTitle, { color: '#34C759' }]}>PLANO ATIVO</Text>
                                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14, marginTop: 6 }}>
                                    {coach.coachBillingPlan?.replace(/_/g,' ')}
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                                    Válido até {formatDate(coach.coachBillingEnd)}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.upgradeBtn, { borderColor: theme.accent, marginTop: 10 }]}
                                    onPress={() => { setIsUpgrade(true); setResult(null); setSelectedPlan(''); }}
                                >
                                    <MaterialCommunityIcons name="arrow-up-circle-outline" size={16} color={theme.accent} />
                                    <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 12 }}>FAZER UPGRADE</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Resultado da cobrança */}
                        {result && (
                            <View style={[styles.card, { backgroundColor: '#34C75910', borderColor: '#34C75940' }]}>
                                <Text style={[styles.cardTitle, { color: '#34C759' }]}>
                                    ✅ COBRANÇA GERADA
                                </Text>
                                {result.credit > 0 && (
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 6 }}>
                                        Crédito aplicado: <Text style={{ color: '#34C759', fontWeight: '900' }}>R${result.credit?.toFixed(2)}</Text>
                                    </Text>
                                )}
                                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18, marginTop: 4 }}>
                                    R${result.chargeValue?.toFixed(2) ?? result.value?.toFixed(2)}
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                    Vence em {formatDate(result.dueDate)}
                                </Text>

                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                    {result.pixCopyPaste && (
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34C75920', borderColor: '#34C75950' }]} onPress={() => copyPix(result.pixCopyPaste)}>
                                            <MaterialCommunityIcons name="content-copy" size={14} color="#34C759" />
                                            <Text style={{ color: '#34C759', fontWeight: '900', fontSize: 11 }}>COPIAR PIX</Text>
                                        </TouchableOpacity>
                                    )}
                                    {result.invoiceUrl && (
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]} onPress={() => openLink(result.invoiceUrl)}>
                                            <MaterialCommunityIcons name="open-in-new" size={14} color={theme.accent} />
                                            <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 11 }}>LINK FATURA</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Seletor de plano */}
                        {!result && (
                            <>
                                <Text style={[styles.cardTitle, { color: theme.text }]}>
                                    {isUpgrade ? 'SELECIONAR NOVO PLANO' : 'SELECIONAR PLANO'}
                                </Text>

                                {plans.map(plan => {
                                    const selected = selectedPlan === plan.key;
                                    const color    = plan.isPromo ? '#FF9500' : theme.accent;
                                    return (
                                        <TouchableOpacity
                                            key={plan.key}
                                            style={[styles.planCard, {
                                                backgroundColor: selected ? color + '15' : theme.surface,
                                                borderColor:     selected ? color : theme.border,
                                                borderWidth:     selected ? 2 : 1,
                                            }]}
                                            onPress={() => setSelectedPlan(plan.key)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: selected ? color : theme.text, fontWeight: '900', fontSize: 13 }}>
                                                    {plan.label}
                                                </Text>
                                                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                                    {plan.monthlyPrice} · à vista {plan.totalPrice}
                                                </Text>
                                                {/* Preview de upgrade */}
                                                {isUpgrade && selected && upgradePreview && (
                                                    <View style={{ marginTop: 6, padding: 8, backgroundColor: color + '10', borderRadius: 8 }}>
                                                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                                                            Crédito ({upgradePreview.daysR} dias): <Text style={{ color: '#34C759', fontWeight: '900' }}>R${upgradePreview.credit.toFixed(2)}</Text>
                                                        </Text>
                                                        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13, marginTop: 2 }}>
                                                            Você cobra: R${upgradePreview.chargeValue.toFixed(2)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <MaterialCommunityIcons
                                                name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                                                size={20}
                                                color={selected ? color : theme.textSecondary}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Método de pagamento */}
                                <Text style={[styles.cardTitle, { color: theme.text, marginTop: 4 }]}>FORMA DE PAGAMENTO</Text>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    {['PIX', 'BOLETO'].map(method => (
                                        <TouchableOpacity
                                            key={method}
                                            style={[styles.methodBtn, {
                                                backgroundColor: paymentMethod === method ? theme.accent + '20' : theme.surface,
                                                borderColor:     paymentMethod === method ? theme.accent : theme.border,
                                                borderWidth:     paymentMethod === method ? 2 : 1,
                                            }]}
                                            onPress={() => setPaymentMethod(method)}
                                        >
                                            <MaterialCommunityIcons
                                                name={method === 'PIX' ? 'qrcode' : 'barcode'}
                                                size={18}
                                                color={paymentMethod === method ? theme.accent : theme.textSecondary}
                                            />
                                            <Text style={{ color: paymentMethod === method ? theme.accent : theme.text, fontWeight: '900', fontSize: 12 }}>
                                                {method}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Botão gerar */}
                                <TouchableOpacity
                                    style={[styles.generateBtn, { backgroundColor: selectedPlan ? theme.accent : theme.border }]}
                                    onPress={handleGenerate}
                                    disabled={!selectedPlan || loading}
                                    activeOpacity={0.8}
                                >
                                    {loading
                                        ? <ActivityIndicator color="#000" />
                                        : <>
                                            <MaterialCommunityIcons name="cash-check" size={20} color="#000" />
                                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>
                                                {isUpgrade ? 'GERAR COBRANÇA DE UPGRADE' : 'GERAR COBRANÇA'}
                                            </Text>
                                          </>
                                    }
                                </TouchableOpacity>

                                {isUpgrade && (
                                    <TouchableOpacity onPress={() => { setIsUpgrade(false); setSelectedPlan(''); }} style={{ alignItems: 'center' }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Cancelar upgrade</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {result && (
                            <TouchableOpacity
                                style={[styles.generateBtn, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                                onPress={() => { setResult(null); setSelectedPlan(''); }}
                            >
                                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13 }}>NOVA COBRANÇA</Text>
                            </TouchableOpacity>
                        )}

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', alignItems: 'center' },
    container:    { width: '100%', maxWidth: 480, height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
    header:       { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
    closeBtn:     { padding: 8, borderRadius: 12, borderWidth: 1 },
    statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    card:         { borderRadius: 16, borderWidth: 1, padding: 14 },
    cardTitle:    { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
    planCard:     { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14 },
    methodBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12 },
    generateBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16 },
    actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    upgradeBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
});
