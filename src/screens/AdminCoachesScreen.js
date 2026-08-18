// src/screens/AdminCoachesScreen.js
// Gestão completa de coaches parceiros — visível só para Paulo (master, não Adri)
// Mostra: ativos, pendentes, bloqueados
// Ações: alterar plano, gerar cobrança (Asaas), perfil, bloquear/desbloquear, WhatsApp
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    ActivityIndicator, Alert, Platform, SafeAreaView,
    useWindowDimensions, Linking, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

import CoachBillingModal from '../components/Admin/CoachBillingModal'; 
import EditCoachProfileModal from '../components/Admin/EditCoachProfileModal'; // 🚀 NOVO MODAL IMPORTADO

const BASE_URL = 'https://fitos-final.onrender.com';

const PLAN_OPTIONS = [
    { value: 'PERSONAL',      label: 'PERSONAL TRAINER',       icon: 'dumbbell',   color: '#32ADE6', desc: 'Módulo de treinos' },
    { value: 'NUTRICIONISTA', label: 'NUTRICIONISTA',          icon: 'food-apple', color: '#34C759', desc: 'Módulo de dietas'  },
    { value: 'ELITE',         label: 'ELITE (PERSONAL + NUTRI)',icon: 'trophy',     color: '#FFCC00', desc: 'Treinos + dietas'  },
];

function PlanBadge({ plan }) {
    const opt = PLAN_OPTIONS.find(p => p.value === plan) ?? PLAN_OPTIONS[0];
    return (
        <View style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:8, backgroundColor: opt.color+'20', borderWidth:1, borderColor: opt.color+'50' }}>
            <MaterialCommunityIcons name={opt.icon} size={11} color={opt.color} />
            <Text style={{ fontSize:10, fontWeight:'900', color: opt.color }}>{opt.label}</Text>
        </View>
    );
}

const STATUS_TABS = [
    { id: 'ACTIVE',           label: 'ATIVOS'    },
    { id: 'PENDING_APPROVAL', label: 'PENDENTES' },
    { id: 'REJECTED',         label: 'BLOQUEADOS'},
];

export default function AdminCoachesScreen({ navigation }) {
    const { theme } = useTheme();
    const { height: windowHeight } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';

    const [coaches,     setCoaches]     = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [activeTab,   setActiveTab]   = useState('ACTIVE');
    const [processing,  setProcessing]  = useState(null);
    const [sendingLink, setSendingLink] = useState(null);

    // Modal de edição de plano manual
    const [editingCoach, setEditingCoach] = useState(null);
    const [editPlan,     setEditPlan]     = useState('PERSONAL');
    const [savingPlan,   setSavingPlan]   = useState(false);

    // Controle do Modal de Billing do Asaas
    const [billingCoach, setBillingCoach] = useState(null);

    // 🚀 NOVO: Controle do Modal de Perfil
    const [editingProfileCoach, setEditingProfileCoach] = useState(null);

    const fetchCoaches = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${BASE_URL}/api/admin/coaches?t=${Date.now()}`);
            const data = await res.json();
            setCoaches(Array.isArray(data) ? data : []);
        } catch (e) { console.error('[AdminCoaches]', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCoaches(); }, [fetchCoaches]);

    const notify = (msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('', msg);
    };

    const handleToggleBlock = (coach) => {
        const isActive  = coach.accountStatus === 'ACTIVE';
        const action    = isActive ? 'BLOCK' : 'UNBLOCK';
        const label     = isActive ? 'bloquear' : 'desbloquear';
        const msg       = `Deseja ${label} o acesso de ${coach.name}?`;

        const run = async () => {
            setProcessing(coach.id);
            try {
                const res = await fetch(`${BASE_URL}/api/admin/coaches`, {
                    method:  'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ coachId: coach.id, action }),
                });
                if (res.ok) {
                    await fetchCoaches();
                    notify(isActive ? `${coach.name} bloqueado.` : `${coach.name} desbloqueado.`);
                } else {
                    notify('Erro ao atualizar.');
                }
            } catch { notify('Erro de conexão.'); }
            finally { setProcessing(null); }
        };

        if (Platform.OS === 'web') { if (window.confirm(msg)) run(); }
        else Alert.alert(label.charAt(0).toUpperCase() + label.slice(1), msg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: label.charAt(0).toUpperCase() + label.slice(1), style: isActive ? 'destructive' : 'default', onPress: run },
        ]);
    };

    const handleSavePlan = async () => {
        if (!editingCoach) return;
        setSavingPlan(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/coaches`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ coachId: editingCoach.id, action: 'SET_PLAN', coachPlan: editPlan }),
            });
            if (res.ok) {
                await fetchCoaches();
                setEditingCoach(null);
                notify(`Plano de ${editingCoach.name} atualizado para ${PLAN_OPTIONS.find(p => p.value === editPlan)?.label}.`);
            } else {
                notify('Erro ao salvar plano.');
            }
        } catch { notify('Erro de conexão.'); }
        finally { setSavingPlan(false); }
    };

    // 💳 Gera um link de Checkout de recorrência (cartão) pro coach e manda
    // direto no WhatsApp dele — o coach cadastra o cartão sozinho na página
    // segura da Asaas, sem o número passar pelo nosso backend. CPF/endereço
    // (exigidos pela Asaas) só podem ser preenchidos pelo próprio coach em
    // "Sua Assinatura" — se faltar algo, avisa aqui em vez de travar.
    const handleSendRecurrenceLink = async (coach) => {
        setSendingLink(coach.id);
        try {
            const res  = await fetch(`${BASE_URL}/api/payments/coach-recurrence/create`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ coachId: coach.id }),
            });
            const data = await res.json();

            if (data.needsCpf || data.needsAddress) {
                notify(`${coach.name} ainda não tem ${data.needsCpf ? 'CPF' : 'endereço'} cadastrado. Peça pra ele preencher em "Sua Assinatura" antes de ativar a recorrência.`);
                return;
            }
            if (data.alreadyActive) {
                notify(`${coach.name} já tem pagamento automático ativo.`);
                return;
            }
            if (!res.ok || !data.checkoutUrl) {
                notify(data.error || 'Não foi possível gerar o link de recorrência.');
                return;
            }

            if (coach.phone) {
                const msg = `Fala, ${coach.name}! Segue o link pra ativar o pagamento automático (cartão) da sua mensalidade ELITE FIT: ${data.checkoutUrl}`;
                const url = `whatsapp://send?phone=+55${coach.phone.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`;
                Linking.openURL(url).catch(() => notify('Link gerado, mas não foi possível abrir o WhatsApp.'));
            } else {
                notify('Link de recorrência gerado! (telefone não cadastrado pra enviar direto pelo WhatsApp)');
            }
        } catch {
            notify('Erro de conexão.');
        } finally {
            setSendingLink(null);
        }
    };

    const openWhatsApp = (phone, name) => {
        if (!phone) { notify('Telefone não cadastrado.'); return; }
        const url = `whatsapp://send?phone=+55${phone.replace(/\D/g,'')}&text=${encodeURIComponent(`Fala, ${name}! Tudo certo?`)}`;
        Linking.openURL(url).catch(() => notify('Não foi possível abrir o WhatsApp.'));
    };

    const filtered = coaches.filter(c => c.accountStatus === activeTab);

    const RootView  = isWeb ? View : SafeAreaView;
    const rootStyle = isWeb
        ? { height: windowHeight, backgroundColor: theme.bg, display:'flex', flexDirection:'column' }
        : { flex: 1, backgroundColor: theme.bg };

    const renderCoach = ({ item: coach }) => {
        const plan    = PLAN_OPTIONS.find(p => p.value === (coach.coachPlan ?? 'PERSONAL')) ?? PLAN_OPTIONS[0];
        const isActive = coach.accountStatus === 'ACTIVE';

        return (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {/* Linha superior */}
                <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 }}>
                    <View style={[styles.avatar, { backgroundColor: plan.color+'22' }]}>
                        <MaterialCommunityIcons name={plan.icon} size={20} color={plan.color} />
                    </View>
                    <View style={{ flex:1 }}>
                        <Text style={{ color: theme.text, fontWeight:'900', fontSize:14 }} numberOfLines={1}>{coach.name}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize:11, marginTop:1 }} numberOfLines={1}>{coach.email}</Text>
                    </View>
                    <PlanBadge plan={coach.coachPlan ?? 'PERSONAL'} />
                </View>

                {/* Metadados */}
                <View style={{ flexDirection:'row', gap:16, marginBottom:12 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                        <MaterialCommunityIcons name="account-group" size={13} color={theme.textSecondary} />
                        <Text style={{ color: theme.textSecondary, fontSize:11, fontWeight:'700' }}>
                            {coach._count?.students ?? 0} alunos
                        </Text>
                    </View>
                    {coach.inviteCode && (
                        <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                            <MaterialCommunityIcons name="key-outline" size={13} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary, fontSize:11, fontWeight:'700' }}>{coach.inviteCode}</Text>
                        </View>
                    )}
                    {coach.phone && (
                        <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                            <MaterialCommunityIcons name="phone" size={13} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary, fontSize:11 }}>{coach.phone}</Text>
                        </View>
                    )}
                </View>

                {/* Ações */}
                <View style={{ flexDirection:'row', gap:8, flexWrap: 'wrap' }}>
                    
                    {/* Botão de Perfil */}
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.border, borderColor: theme.border }]}
                        onPress={() => setEditingProfileCoach(coach)}
                    >
                        <MaterialCommunityIcons name="card-account-details-outline" size={14} color={theme.text} />
                        <Text style={{ fontSize:11, fontWeight:'800', color: theme.text }}>PERFIL</Text>
                    </TouchableOpacity>

                    {/* Gerar Cobrança Asaas */}
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#8BC34A20', borderColor: '#8BC34A50' }]}
                        onPress={() => setBillingCoach(coach)}
                    >
                        <MaterialCommunityIcons name="cash-check" size={14} color="#8BC34A" />
                        <Text style={{ fontSize:11, fontWeight:'800', color: '#8BC34A' }}>COBRAR</Text>
                    </TouchableOpacity>

                    {/* Enviar link de recorrência (cartão automático) */}
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#5AC8FA20', borderColor: '#5AC8FA50' }]}
                        onPress={() => handleSendRecurrenceLink(coach)}
                        disabled={sendingLink === coach.id}
                    >
                        {sendingLink === coach.id
                            ? <ActivityIndicator size="small" color="#5AC8FA" />
                            : (<>
                                <MaterialCommunityIcons name="credit-card-sync-outline" size={14} color="#5AC8FA" />
                                <Text style={{ fontSize:11, fontWeight:'800', color: '#5AC8FA' }}>RECORRÊNCIA</Text>
                              </>)
                        }
                    </TouchableOpacity>

                    {/* Alterar plano */}
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: plan.color+'18', borderColor: plan.color+'50' }]}
                        onPress={() => { setEditingCoach(coach); setEditPlan(coach.coachPlan ?? 'PERSONAL'); }}
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={14} color={plan.color} />
                        <Text style={{ fontSize:11, fontWeight:'800', color: plan.color }}>PLANO</Text>
                    </TouchableOpacity>

                    {/* WhatsApp */}
                    {coach.phone && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor:'#25D36620', borderColor:'#25D36640' }]}
                            onPress={() => openWhatsApp(coach.phone, coach.name)}
                        >
                            <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
                            <Text style={{ fontSize:11, fontWeight:'800', color:'#25D366' }}>ZAPP</Text>
                        </TouchableOpacity>
                    )}

                    {/* Bloquear / Desbloquear */}
                    {processing === coach.id ? (
                        <ActivityIndicator size="small" color={theme.accent} style={{ marginLeft:8 }} />
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionBtn, isActive
                                ? { backgroundColor:'#FF3B3018', borderColor:'#FF3B3040' }
                                : { backgroundColor:theme.accent+'18', borderColor: theme.accent+'40' }
                            ]}
                            onPress={() => handleToggleBlock(coach)}
                        >
                            <MaterialCommunityIcons
                                name={isActive ? 'lock-outline' : 'lock-open-outline'}
                                size={14}
                                color={isActive ? '#FF3B30' : theme.accent}
                            />
                            <Text style={{ fontSize:11, fontWeight:'800', color: isActive ? '#FF3B30' : theme.accent }}>
                                {isActive ? 'BLOQUEAR' : 'LIBERAR'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <RootView style={rootStyle}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.iconBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex:1, alignItems:'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>GESTÃO DE COACHES</Text>
                    <Text style={{ color: theme.textSecondary, fontSize:11, fontWeight:'700', marginTop:2 }}>
                        {coaches.filter(c => c.accountStatus === 'ACTIVE').length} ativos · {coaches.filter(c => c.accountStatus === 'PENDING_APPROVAL').length} pendentes
                    </Text>
                </View>
                <TouchableOpacity onPress={fetchCoaches} style={[styles.iconBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="refresh" size={22} color={theme.accent} />
                </TouchableOpacity>
            </View>

            {/* Abas de status */}
            <View style={[styles.tabRow, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
                {STATUS_TABS.map(tab => {
                    const count = coaches.filter(c => c.accountStatus === tab.id).length;
                    const active = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, active && { borderBottomWidth:2, borderBottomColor: theme.accent }]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={{ fontSize:11, fontWeight:'900', color: active ? theme.accent : theme.textSecondary }}>
                                {tab.label}
                            </Text>
                            {count > 0 && (
                                <View style={[styles.badge, { backgroundColor: active ? theme.accent : theme.textSecondary }]}>
                                    <Text style={{ fontSize:9, fontWeight:'900', color:'#000' }}>{count}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Lista */}
            {loading ? (
                <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={renderCoach}
                    contentContainerStyle={{ padding:16, paddingBottom:40 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={{ alignItems:'center', padding:48 }}>
                            <MaterialCommunityIcons name="account-off-outline" size={48} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary, marginTop:16, fontSize:14, textAlign:'center' }}>
                                {activeTab === 'ACTIVE'           ? 'Nenhum coach ativo ainda.'       : ''}
                                {activeTab === 'PENDING_APPROVAL' ? 'Nenhum coach aguardando aprovação.' : ''}
                                {activeTab === 'REJECTED'         ? 'Nenhum coach bloqueado.'         : ''}
                            </Text>
                        </View>
                    )}
                />
            )}

            {/* Modal de edição de plano manual */}
            <Modal visible={!!editingCoach} transparent animationType="fade" onRequestClose={() => setEditingCoach(null)}>
                <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center', padding:20 }}>
                    <View style={{ width:'100%', maxWidth:420, backgroundColor: theme.surface, borderRadius:20, padding:22, borderWidth:1, borderColor: theme.border, gap:14 }}>
                        <Text style={{ color: theme.text, fontWeight:'900', fontSize:16 }}>
                            Plano de {editingCoach?.name}
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize:12 }}>
                            Selecione o plano contratado com a PA ELITE TEAM. Isso define o que o coach pode usar e oferecer.
                        </Text>

                        {PLAN_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={{
                                    flexDirection:'row', alignItems:'center', gap:12, padding:14, borderRadius:14,
                                    borderWidth: 2,
                                    borderColor:     editPlan === opt.value ? opt.color : theme.border,
                                    backgroundColor: editPlan === opt.value ? opt.color+'15' : theme.bg,
                                }}
                                onPress={() => setEditPlan(opt.value)}
                            >
                                <View style={{ width:40, height:40, borderRadius:12, backgroundColor: opt.color+'20', alignItems:'center', justifyContent:'center' }}>
                                    <MaterialCommunityIcons name={opt.icon} size={20} color={opt.color} />
                                </View>
                                <View style={{ flex:1 }}>
                                    <Text style={{ color: editPlan === opt.value ? opt.color : theme.text, fontWeight:'900', fontSize:13 }}>{opt.label}</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize:11, marginTop:2 }}>{opt.desc}</Text>
                                </View>
                                <MaterialCommunityIcons
                                    name={editPlan === opt.value ? 'radiobox-marked' : 'radiobox-blank'}
                                    size={20}
                                    color={editPlan === opt.value ? opt.color : theme.textSecondary}
                                />
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={{ backgroundColor: theme.accent, padding:14, borderRadius:14, alignItems:'center' }}
                            onPress={handleSavePlan}
                            disabled={savingPlan}
                        >
                            {savingPlan
                                ? <ActivityIndicator color="#000" />
                                : <Text style={{ color:'#000', fontWeight:'900', fontSize:14 }}>SALVAR PLANO</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setEditingCoach(null)} style={{ alignItems:'center' }}>
                            <Text style={{ color: theme.textSecondary, fontSize:13 }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* O MODAL DO ASAAS */}
            <CoachBillingModal
                visible={!!billingCoach}
                onClose={() => {
                    setBillingCoach(null);
                    fetchCoaches();
                }}
                coach={billingCoach}
                theme={theme}
            />

            {/* 🚀 O NOVO MODAL DE PERFIL */}
            <EditCoachProfileModal
                visible={!!editingProfileCoach}
                onClose={() => setEditingProfileCoach(null)}
                coach={editingProfileCoach}
                theme={theme}
                onSuccess={fetchCoaches} // recarrega a lista para mostrar o nome/dados atualizados
            />

        </RootView>
    );
}

const styles = StyleSheet.create({
    header:      { flexDirection:'row', justifyContent:'space-between', padding:16, alignItems:'center', borderBottomWidth:1 },
    iconBtn:     { padding:9, borderRadius:14, borderWidth:1 },
    headerTitle: { fontWeight:'900', fontSize:13, letterSpacing:1.5 },
    tabRow:      { flexDirection:'row', borderBottomWidth:1 },
    tab:         { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:12 },
    badge:       { paddingHorizontal:5, paddingVertical:1, borderRadius:6, minWidth:16, alignItems:'center' },
    card:        { borderRadius:16, borderWidth:1, padding:14, marginBottom:12 },
    avatar:      { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
    actionBtn:   { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:7, borderRadius:10, borderWidth:1 },
});