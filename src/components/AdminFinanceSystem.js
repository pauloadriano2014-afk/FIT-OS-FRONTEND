// src/components/AdminFinanceSystem.js — v2
// v2: aba COACHES para masters — MRR, status de billing, acesso ao CoachBillingModal
import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, Modal, Switch, Platform, Alert, ActivityIndicator,
    Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CoachBillingModal from './Admin/CoachBillingModal'; // ← v2

const BASE_URL = 'https://fitos-final.onrender.com';

const MASTER_IDS = [
    '3c82f763-66b4-48da-836e-16817d4f57c0',
    'b7c0c181-41fd-4156-b8fe-963a267759a3',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const daysUntil = (iso) => {
    if (!iso) return null;
    return Math.round((new Date(iso).getTime() - Date.now()) / (1000 * 3600 * 24));
};

// ─── BILLING STATUS ──────────────────────────────────────────────────────────
const BILLING_STATUS_COLORS = {
    ACTIVE:    '#34C759',
    PENDING:   '#FF9500',
    OVERDUE:   '#FF3B30',
    CANCELLED: '#8E8E93',
};
const BILLING_STATUS_LABELS = {
    ACTIVE:    'ATIVO',
    PENDING:   'PENDENTE',
    OVERDUE:   'INADIMPLENTE',
    CANCELLED: 'CANCELADO',
};

// ─── ABA COACHES — v2 ────────────────────────────────────────────────────────
function CoachesFinanceTab({ coaches, loading, theme, onBilling }) {
    const active      = coaches.filter(c => c.coachBillingStatus === 'ACTIVE');
    const pending     = coaches.filter(c => c.coachBillingStatus === 'PENDING' || !c.coachBillingStatus);
    const overdue     = coaches.filter(c => c.coachBillingStatus === 'OVERDUE');
    const cancelled   = coaches.filter(c => c.coachBillingStatus === 'CANCELLED');

    // MRR estimado — soma dos planos ativos
    const PLAN_MONTHLY: Record<string, number> = {
        PERSONAL_MONTHLY:97,    PERSONAL_QUARTERLY:91,  PERSONAL_SEMIANNUAL:85, PERSONAL_ANNUAL:79,    PERSONAL_LAUNCH:69.9,
        NUTRI_MONTHLY:97,       NUTRI_QUARTERLY:91,     NUTRI_SEMIANNUAL:85,    NUTRI_ANNUAL:79,       NUTRI_LAUNCH:69.9,
        ELITE_MONTHLY:147,      ELITE_QUARTERLY:138,    ELITE_SEMIANNUAL:129,   ELITE_ANNUAL:119,      ELITE_LAUNCH:109.9,
    };
    const mrr = active.reduce((sum, c) => sum + (PLAN_MONTHLY[c.coachBillingPlan] ?? 0), 0);

    if (loading) {
        return (
            <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

            {/* Cards de resumo */}
            <View style={[styles.summaryRow]}>
                {[
                    { label:'MRR',         value:`R$${mrr.toFixed(0)}`,      color: theme.accent,  icon:'cash-multiple'          },
                    { label:'ATIVOS',      value:String(active.length),       color:'#34C759',      icon:'check-circle-outline'   },
                    { label:'INADIMPL.',   value:String(overdue.length),      color:'#FF3B30',      icon:'alert-circle-outline'   },
                    { label:'PENDENTES',   value:String(pending.length),      color:'#FF9500',      icon:'clock-outline'          },
                ].map(({ label, value, color, icon }) => (
                    <View key={label} style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: color + '40' }]}>
                        <MaterialCommunityIcons name={icon} size={18} color={color} />
                        <Text style={{ color, fontWeight:'900', fontSize:18, marginTop:4 }}>{value}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize:9, fontWeight:'800', letterSpacing:0.5 }}>{label}</Text>
                    </View>
                ))}
            </View>

            {/* Lista de coaches */}
            {[
                { list: overdue,   title:'🔴 INADIMPLENTES',  color:'#FF3B30' },
                { list: pending,   title:'🟡 PENDENTES',      color:'#FF9500' },
                { list: active,    title:'🟢 ATIVOS',         color:'#34C759' },
                { list: cancelled, title:'⚫ CANCELADOS',     color:'#8E8E93' },
            ].map(({ list, title, color }) => list.length === 0 ? null : (
                <View key={title} style={{ marginTop: 16 }}>
                    <Text style={{ color: theme.textSecondary, fontSize:11, fontWeight:'900', letterSpacing:0.5, marginBottom:8 }}>
                        {title}
                    </Text>
                    {list.map(coach => {
                        const days      = daysUntil(coach.coachBillingEnd);
                        const statusClr = BILLING_STATUS_COLORS[coach.coachBillingStatus] ?? '#8E8E93';
                        const planLabel = (coach.coachBillingPlan ?? '—').replace(/_/g,' ');
                        return (
                            <View key={coach.id} style={[styles.coachCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                {/* Linha superior */}
                                <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 }}>
                                    <View style={[styles.coachAvatar, { backgroundColor: statusClr + '20' }]}>
                                        <MaterialCommunityIcons name="account-tie" size={18} color={statusClr} />
                                    </View>
                                    <View style={{ flex:1 }}>
                                        <Text style={{ color: theme.text, fontWeight:'900', fontSize:14 }} numberOfLines={1}>
                                            {coach.name}
                                        </Text>
                                        <Text style={{ color: theme.textSecondary, fontSize:11 }} numberOfLines={1}>
                                            {coach.email}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusPill, { backgroundColor: statusClr + '20', borderColor: statusClr + '50' }]}>
                                        <Text style={{ fontSize:9, fontWeight:'900', color: statusClr }}>
                                            {BILLING_STATUS_LABELS[coach.coachBillingStatus] ?? 'SEM PLANO'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Detalhes */}
                                <View style={{ flexDirection:'row', gap:16, marginBottom:10 }}>
                                    <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                                        <MaterialCommunityIcons name="tag-outline" size:12 color={theme.textSecondary} />
                                        <Text style={{ color: theme.textSecondary, fontSize:11 }}>{planLabel}</Text>
                                    </View>
                                    {coach.coachBillingEnd && (
                                        <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                                            <MaterialCommunityIcons name="calendar-outline" size={12} color={theme.textSecondary} />
                                            <Text style={{
                                                color:      days !== null && days < 7 ? '#FF3B30' : theme.textSecondary,
                                                fontSize:   11,
                                                fontWeight: days !== null && days < 7 ? '900' : '400',
                                            }}>
                                                {days !== null && days < 0
                                                    ? `Venceu há ${Math.abs(days)}d`
                                                    : days !== null && days === 0
                                                        ? 'Vence hoje'
                                                        : `Vence em ${days}d (${formatDate(coach.coachBillingEnd)})`
                                                }
                                            </Text>
                                        </View>
                                    )}
                                    <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                                        <MaterialCommunityIcons name="account-group" size={12} color={theme.textSecondary} />
                                        <Text style={{ color: theme.textSecondary, fontSize:11 }}>
                                            {coach._count?.students ?? 0} alunos
                                        </Text>
                                    </View>
                                </View>

                                {/* Ações */}
                                <View style={{ flexDirection:'row', gap:8 }}>
                                    <TouchableOpacity
                                        style={[styles.coachActionBtn, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40' }]}
                                        onPress={() => onBilling(coach)}
                                    >
                                        <MaterialCommunityIcons name="cash-multiple" size={13} color={theme.accent} />
                                        <Text style={{ fontSize:11, fontWeight:'900', color: theme.accent }}>BILLING</Text>
                                    </TouchableOpacity>

                                    {coach.phone && (
                                        <TouchableOpacity
                                            style={[styles.coachActionBtn, { backgroundColor:'#25D36620', borderColor:'#25D36640' }]}
                                            onPress={() => {
                                                const msg = `Fala, ${coach.name.split(' ')[0]}! Tudo certo com seu plano ELITE FIT?`;
                                                Linking.openURL(`whatsapp://send?phone=+55${coach.phone.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`).catch(() => {});
                                            }}
                                        >
                                            <MaterialCommunityIcons name="whatsapp" size={13} color="#25D366" />
                                            <Text style={{ fontSize:11, fontWeight:'900', color:'#25D366' }}>ZAPP</Text>
                                        </TouchableOpacity>
                                    )}

                                    {coach.coachBillingStatus === 'OVERDUE' && (
                                        <View style={[styles.coachActionBtn, { backgroundColor:'#FF3B3015', borderColor:'#FF3B3040' }]}>
                                            <MaterialCommunityIcons name="alert" size={13} color="#FF3B30" />
                                            <Text style={{ fontSize:11, fontWeight:'900', color:'#FF3B30' }}>INADIMPLENTE</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            ))}

            {coaches.length === 0 && (
                <View style={{ alignItems:'center', padding:48 }}>
                    <MaterialCommunityIcons name="account-tie-outline" size={48} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, marginTop:16, fontSize:14, textAlign:'center' }}>
                        Nenhum coach ativo ainda.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function AdminFinanceSystem({ theme, alunos = [], coachFilter, getLogCoach, isWeb, adminId }) {
    const isMaster = MASTER_IDS.includes(adminId);

    const [activeTab, setActiveTab] = useState('ATIVOS');
    const [search,    setSearch]    = useState('');

    const [editingUser,   setEditingUser]   = useState(null);
    const [modalVisible,  setModalVisible]  = useState(false);
    const [contractType,  setContractType]  = useState('Mensal');
    const [contractValue, setContractValue] = useState('');
    const [paymentDue,    setPaymentDue]    = useState('');
    const [startDate,     setStartDate]     = useState('');
    const [financeCategory, setFinanceCategory] = useState('Consultoria Online');
    const [isFinanceActive, setIsFinanceActive] = useState(true);
    const [saving,        setSaving]        = useState(false);

    // ← v2: coaches
    const [coaches,        setCoaches]        = useState([]);
    const [loadingCoaches, setLoadingCoaches] = useState(false);
    const [billingCoach,   setBillingCoach]   = useState(null);

    // Busca coaches quando aba COACHES é selecionada
    useEffect(() => {
        if (activeTab === 'COACHES' && isMaster) {
            setLoadingCoaches(true);
            fetch(`${BASE_URL}/api/admin/coaches?t=${Date.now()}`)
                .then(r => r.json())
                .then(data => setCoaches(Array.isArray(data) ? data : []))
                .catch(() => {})
                .finally(() => setLoadingCoaches(false));
        }
    }, [activeTab, isMaster]);

    // Filtra alunos
    const filteredAlunos = useMemo(() => {
        let list = alunos;
        if (coachFilter && getLogCoach) list = list.filter(a => getLogCoach(a) === coachFilter);
        if (search) list = list.filter(a => (a.name || '').toLowerCase().includes(search.toLowerCase()));
        return list;
    }, [alunos, coachFilter, getLogCoach, search]);

    const today = new Date(); today.setHours(0,0,0,0);

    const ativos    = filteredAlunos.filter(a => a.isFinanceActive && a.contractValue > 0);
    const vencendo  = ativos.filter(a => {
        if (!a.paymentDueDate) return false;
        const due = new Date(a.paymentDueDate); due.setHours(0,0,0,0);
        const diff = Math.round((due - today) / (1000*3600*24));
        return diff >= 0 && diff <= 7;
    });
    const inativos  = filteredAlunos.filter(a => !a.isFinanceActive || !a.contractValue);
    const offline   = filteredAlunos.filter(a => a.id?.startsWith('offline_'));

    const totalMRR = ativos.reduce((s, a) => s + (Number(a.contractValue) || 0), 0);

    const openEdit = (user) => {
        setEditingUser(user);
        setContractType(user.contractType     || 'Mensal');
        setContractValue(String(user.contractValue || ''));
        setPaymentDue(user.paymentDueDate ? formatDate(user.paymentDueDate) : '');
        setStartDate(user.startDate       ? formatDate(user.startDate)       : '');
        setFinanceCategory(user.financeCategory || 'Consultoria Online');
        setIsFinanceActive(user.isFinanceActive !== false);
        setModalVisible(true);
    };

    const saveContract = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            const parseDate = (str) => {
                if (!str || str.length < 10) return null;
                const [d, m, y] = str.split('/');
                return new Date(`${y}-${m}-${d}T12:00:00Z`).toISOString();
            };
            const res = await fetch(`${BASE_URL}/api/admin/update-contract`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    userId:          editingUser.id,
                    adminId,
                    contractType,
                    contractValue:   parseFloat(contractValue.replace(',','.')),
                    paymentDueDate:  parseDate(paymentDue),
                    startDate:       parseDate(startDate),
                    financeCategory,
                    isFinanceActive,
                }),
            });
            if (!res.ok) throw new Error();
            setModalVisible(false);
            const msg = 'Contrato atualizado!';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sucesso', msg);
        } catch {
            const msg = 'Erro ao salvar contrato.';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
        } finally { setSaving(false); }
    };

    // Abas — COACHES só para masters
    const TABS = [
        { id:'ATIVOS',   label:`Ativos (${ativos.length})`   },
        { id:'VENCENDO', label:`Vencendo (${vencendo.length})` },
        { id:'INATIVOS', label:`Inativos (${inativos.length})` },
        { id:'OFFLINE',  label:`Offline (${offline.length})`  },
        ...(isMaster ? [{ id:'COACHES', label:'Coaches' }] : []),
    ];

    const listForTab = activeTab === 'ATIVOS'   ? ativos
                     : activeTab === 'VENCENDO' ? vencendo
                     : activeTab === 'INATIVOS' ? inativos
                     : activeTab === 'OFFLINE'  ? offline
                     : [];

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>

            {/* Header MRR */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <View>
                    <Text style={{ color: theme.textSecondary, fontSize:11, fontWeight:'800', letterSpacing:0.5 }}>MRR ESTIMADO</Text>
                    <Text style={{ color: theme.accent, fontSize:26, fontWeight:'900', marginTop:2 }}>{fmt(totalMRR)}</Text>
                </View>
                <View style={[styles.searchBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="magnify" size={16} color={theme.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Buscar aluno..."
                        placeholderTextColor={theme.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Abas */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={[styles.tabsRow, { borderBottomColor: theme.border }]}
                contentContainerStyle={{ gap:4, paddingHorizontal:16, paddingVertical:8 }}
            >
                {TABS.map(tab => {
                    const active = activeTab === tab.id;
                    const isCoachTab = tab.id === 'COACHES';
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, {
                                backgroundColor: active ? theme.accent : theme.surface,
                                borderColor:     active ? theme.accent : (isCoachTab ? theme.accent + '50' : theme.border),
                                borderWidth:     isCoachTab ? 1.5 : 1,
                            }]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            {isCoachTab && (
                                <MaterialCommunityIcons name="account-tie" size={12} color={active ? '#000' : theme.accent} />
                            )}
                            <Text style={{
                                color:      active ? '#000' : (isCoachTab ? theme.accent : theme.text),
                                fontWeight: '800',
                                fontSize:   11,
                            }}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Conteúdo */}
            <View style={{ flex:1, paddingHorizontal:16, paddingTop:12 }}>

                {/* ABA COACHES */}
                {activeTab === 'COACHES' && isMaster && (
                    <CoachesFinanceTab
                        coaches={coaches}
                        loading={loadingCoaches}
                        theme={theme}
                        onBilling={(coach) => setBillingCoach(coach)}
                    />
                )}

                {/* ABAS DE ALUNOS */}
                {activeTab !== 'COACHES' && (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>
                        {listForTab.length === 0 ? (
                            <View style={{ alignItems:'center', padding:48 }}>
                                <MaterialCommunityIcons name="cash-remove" size={48} color={theme.textSecondary} />
                                <Text style={{ color: theme.textSecondary, marginTop:16, fontSize:14, textAlign:'center' }}>
                                    Nenhum aluno nesta categoria.
                                </Text>
                            </View>
                        ) : listForTab.map(user => {
                            const due  = user.paymentDueDate ? new Date(user.paymentDueDate) : null;
                            const days = due ? Math.round((due.setHours(0,0,0,0) - today) / (1000*3600*24)) : null;
                            const isOverdue = days !== null && days < 0;
                            const isWarning = days !== null && days >= 0 && days <= 7;

                            return (
                                <TouchableOpacity
                                    key={user.id}
                                    style={[styles.userCard, {
                                        backgroundColor: theme.surface,
                                        borderColor:     isOverdue ? '#FF3B3040' : isWarning ? '#FF950040' : theme.border,
                                    }]}
                                    onPress={() => openEdit(user)}
                                    activeOpacity={0.75}
                                >
                                    <View style={{ flex:1 }}>
                                        <Text style={{ color: theme.text, fontWeight:'800', fontSize:14 }} numberOfLines={1}>
                                            {user.name}
                                        </Text>
                                        <Text style={{ color: theme.textSecondary, fontSize:11, marginTop:2 }}>
                                            {user.financeCategory || 'Consultoria'} · {user.contractType || 'Mensal'}
                                        </Text>
                                        {due && (
                                            <Text style={{
                                                fontSize:   11,
                                                fontWeight: isOverdue || isWarning ? '900' : '400',
                                                color:      isOverdue ? '#FF3B30' : isWarning ? '#FF9500' : theme.textSecondary,
                                                marginTop:  2,
                                            }}>
                                                {isOverdue
                                                    ? `⚠️ Venceu há ${Math.abs(days)}d`
                                                    : days === 0
                                                        ? '⚡ Vence hoje'
                                                        : `Vence em ${days}d (${formatDate(user.paymentDueDate)})`
                                                }
                                            </Text>
                                        )}
                                    </View>
                                    <View style={{ alignItems:'flex-end' }}>
                                        <Text style={{ color: theme.accent, fontWeight:'900', fontSize:16 }}>
                                            {fmt(user.contractValue)}
                                        </Text>
                                        <View style={[styles.statusPill, {
                                            backgroundColor: user.isFinanceActive ? '#34C75920' : '#FF3B3020',
                                            borderColor:     user.isFinanceActive ? '#34C75950' : '#FF3B3050',
                                            marginTop:4,
                                        }]}>
                                            <Text style={{
                                                fontSize:9, fontWeight:'900',
                                                color: user.isFinanceActive ? '#34C759' : '#FF3B30',
                                            }}>
                                                {user.isFinanceActive ? 'ATIVO' : 'INATIVO'}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </View>

            {/* Modal de edição de contrato */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={{ color: theme.text, fontWeight:'900', fontSize:15 }}>
                                {editingUser?.name}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding:20, gap:14 }}>
                            {/* Status */}
                            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                                <Text style={{ color: theme.text, fontWeight:'700' }}>Contrato ativo</Text>
                                <Switch
                                    value={isFinanceActive}
                                    onValueChange={setIsFinanceActive}
                                    trackColor={{ false: theme.border, true: theme.accent + '60' }}
                                    thumbColor={isFinanceActive ? theme.accent : theme.textSecondary}
                                />
                            </View>

                            {[
                                { label:'TIPO DE CONTRATO', value:contractType, setter:setContractType, placeholder:'Mensal, Trimestral...' },
                                { label:'VALOR (R$)',        value:contractValue, setter:setContractValue, placeholder:'0,00', keyboard:'decimal-pad' },
                                { label:'VENCIMENTO',        value:paymentDue,   setter:setPaymentDue,   placeholder:'DD/MM/AAAA', keyboard:'numeric' },
                                { label:'INÍCIO',            value:startDate,    setter:setStartDate,    placeholder:'DD/MM/AAAA', keyboard:'numeric' },
                                { label:'CATEGORIA',         value:financeCategory, setter:setFinanceCategory, placeholder:'Consultoria Online' },
                            ].map(({ label, value, setter, placeholder, keyboard }) => (
                                <View key={label}>
                                    <Text style={{ color: theme.textSecondary, fontSize:10, fontWeight:'800', letterSpacing:0.5, marginBottom:6 }}>
                                        {label}
                                    </Text>
                                    <TextInput
                                        style={[styles.modalInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                        value={value}
                                        onChangeText={setter}
                                        placeholder={placeholder}
                                        placeholderTextColor={theme.textSecondary}
                                        keyboardType={keyboard}
                                    />
                                </View>
                            ))}

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                                onPress={saveContract}
                                disabled={saving}
                            >
                                {saving
                                    ? <ActivityIndicator color="#000" />
                                    : <Text style={{ color:'#000', fontWeight:'900', fontSize:14 }}>SALVAR</Text>
                                }
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* CoachBillingModal — v2 */}
            <CoachBillingModal
                visible={!!billingCoach}
                onClose={() => setBillingCoach(null)}
                coach={billingCoach}
                theme={theme}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:     { flex:1 },
    header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderBottomWidth:1 },
    searchBox:     { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:12, borderWidth:1, flex:1, marginLeft:16, maxWidth:220 },
    searchInput:   { flex:1, fontSize:13, outlineStyle:'none' },
    tabsRow:       { flexGrow:0, borderBottomWidth:1 },
    tab:           { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:8, borderRadius:20, borderWidth:1 },
    userCard:      { flexDirection:'row', alignItems:'center', padding:14, borderRadius:16, borderWidth:1, marginBottom:10 },
    statusPill:    { paddingHorizontal:8, paddingVertical:3, borderRadius:8, borderWidth:1 },
    // coaches
    summaryRow:    { flexDirection:'row', gap:8, marginBottom:16 },
    summaryCard:   { flex:1, alignItems:'center', padding:12, borderRadius:14, borderWidth:1 },
    coachCard:     { borderRadius:16, borderWidth:1, padding:14, marginBottom:10 },
    coachAvatar:   { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
    coachActionBtn:{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:7, borderRadius:10, borderWidth:1 },
    // modal
    modalBackdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end', alignItems:'center' },
    modalBox:      { width:'100%', maxWidth:480, borderTopLeftRadius:24, borderTopRightRadius:24, borderWidth:1, borderBottomWidth:0, maxHeight:'85%', overflow:'hidden' },
    modalHeader:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:18, borderBottomWidth:1 },
    modalInput:    { borderWidth:1, borderRadius:12, padding:13, fontSize:14 },
    saveBtn:       { padding:16, borderRadius:14, alignItems:'center', marginTop:8 },
});
