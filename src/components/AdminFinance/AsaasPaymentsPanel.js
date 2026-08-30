// src/components/AdminFinance/AsaasPaymentsPanel.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    Platform, Alert, Linking, Image, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authHeaders } from '../../utils/authToken';
import { generateFinanceReportPDF } from '../../utils/financeReportPdfUtils';

const API_URL = 'https://fitos-final.onrender.com';

const STATUS_META = {
    PENDING:   { label: 'PENDENTE',  color: '#FF9500', icon: 'time-outline' },
    CONFIRMED: { label: 'PAGO',      color: '#8BC34A', icon: 'checkmark-circle-outline' },
    RECEIVED:  { label: 'PAGO',      color: '#8BC34A', icon: 'checkmark-circle-outline' },
    OVERDUE:   { label: 'VENCIDO',   color: '#F44336', icon: 'alert-circle-outline' },
    REFUNDED:  { label: 'ESTORNADO', color: '#9C27B0', icon: 'return-down-back-outline' },
    CANCELED:  { label: 'CANCELADO', color: '#888',    icon: 'close-circle-outline' },
};

const BILLING_META = {
    PIX:         { label: 'PIX',    icon: 'qr-code-outline' },
    CREDIT_CARD: { label: 'Cartão', icon: 'card-outline' },
    BOLETO:      { label: 'Boleto', icon: 'barcode-outline' },
    UNDEFINED:   { label: 'A escolher', icon: 'help-circle-outline' },
};

const FILTERS = [
    { key: 'TODOS',     label: 'Todos' },
    { key: 'PENDING',   label: 'Pendentes' },
    { key: 'PAGOS',     label: 'Pagos' },
    { key: 'OVERDUE',   label: 'Vencidos' },
];

// 🔥 RECEBENDO selectedMonth E currentYear COMO PROPS
export default function AsaasPaymentsPanel({ theme, isWebPC, selectedMonth, currentYear }) {
    const isDark = theme === 'dark';
    const c = {
        bg: isDark ? '#1E1E1E' : '#F9F9F9',
        bg2: isDark ? '#2A2A2A' : '#FFF',
        text: isDark ? '#FFF' : '#333',
        sub: '#888',
        border: isDark ? '#444' : '#DDD',
        primary: '#8BC34A',
        blue: '#32ADE6',
        red: '#F44336' // Cor para o botão de deletar
    };

    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [payments, setPayments] = useState([]);
    const [filter, setFilter] = useState('TODOS');
    const [expanded, setExpanded] = useState(true);
    const [generatingReport, setGeneratingReport] = useState(null); // 'annual' | 'monthly' | null

    const notify = (msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('', msg);
    };

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const userStr = await AsyncStorage.getItem('user');
            const adminId = userStr ? JSON.parse(userStr).id : null;
            
            // 🔥 AGORA ENVIA O MÊS E O ANO SELECIONADOS PARA A API FILTRAR LÁ NO SERVIDOR
            let query = `t=${Date.now()}`;
            if (adminId) query += `&adminId=${adminId}`;
            
            // Corrige o bug do index do JS onde Janeiro = 0 e compensa o +1 para a API
            if (selectedMonth !== undefined && selectedMonth !== null) {
                query += `&month=${selectedMonth + 1}`;
            }
            if (currentYear) query += `&year=${currentYear}`;

            // 🔐 precisa do token de login -- sem ele o servidor devolve 401 (requireAuth)
            const res = await fetch(`${API_URL}/api/admin/payments?${query}`, {
                headers: { ...(await authHeaders()) }
            });
            if (res.ok) {
                const data = await res.json();
                setMetrics(data.metrics || null);
                setPayments(Array.isArray(data.payments) ? data.payments : []);
            }
        } catch (e) {
            console.error('Erro ao buscar pagamentos Asaas:', e);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, currentYear]); // 🔥 Recarrega sempre que o mês/ano mudar

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    // 🔥 NOVA FUNÇÃO: CANCELAR COBRANÇA
    const handleDeleteCharge = async (paymentId) => {
        const confirmMsg = "Deseja realmente cancelar esta cobrança no Asaas? O aluno não poderá mais pagá-la.";
        
        const runDelete = async () => {
            try {
                // Remove visualmente da tela na hora para dar velocidade pro usuário (Optimistic UI)
                setPayments(prev => prev.filter(p => p.id !== paymentId));

                const res = await fetch(`${API_URL}/api/admin/payments`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                    body: JSON.stringify({ paymentId })
                });

                if (!res.ok) {
                    notify("Erro ao cancelar a cobrança no Asaas.");
                    fetchPayments(); // Se deu erro, recarrega a lista original
                }
            } catch (e) {
                notify("Erro de conexão ao cancelar.");
                fetchPayments();
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) runDelete();
        } else {
            Alert.alert("Atenção", confirmMsg, [
                { text: "Não", style: "cancel" },
                { text: "Sim, Cancelar", style: "destructive", onPress: runDelete }
            ]);
        }
    };

    // 🔥 RELATÓRIO PARA O CONTADOR / IMPOSTO DE RENDA -- gera um PDF com só o
    // que foi efetivamente recebido (nada de pendente/vencido), no formato
    // anual (resumo mês a mês) ou mensal (pagamento por pagamento).
    const handleGenerateReport = async (mode) => {
        try {
            setGeneratingReport(mode);
            const userStr = await AsyncStorage.getItem('user');
            const coachId = userStr ? JSON.parse(userStr).id : null;
            const year = currentYear || new Date().getFullYear();
            const month = (selectedMonth !== undefined && selectedMonth !== null) ? selectedMonth + 1 : (new Date().getMonth() + 1);
            await generateFinanceReportPDF({ mode, year, month, coachId });
        } catch (e) {
            console.error('Erro ao gerar relatório financeiro:', e);
            notify(e.message || 'Erro ao gerar o relatório. Tente novamente.');
        } finally {
            setGeneratingReport(null);
        }
    };

    const money = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
    const dateBR = (iso) => {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            // Ajustando fuso horário brasileiro
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
        } catch { return '—'; }
    };

    const copyLink = async (url) => {
        if (!url) return;
        try {
            if (Platform.OS === 'web' && navigator?.clipboard) {
                await navigator.clipboard.writeText(url);
            } else {
                const Clipboard = require('expo-clipboard');
                await Clipboard.setStringAsync(url);
            }
            notify('Link da fatura copiado!');
        } catch {
            notify('Não foi possível copiar.');
        }
    };

    const filtered = payments.filter(p => {
        if (filter === 'TODOS') return true;
        if (filter === 'PAGOS') return p.status === 'CONFIRMED' || p.status === 'RECEIVED';
        return p.status === filter;
    });

    const monthNames = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

    return (
        <View style={{ backgroundColor: c.bg, borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: c.border }}>

            {/* CABEÇALHO */}
            <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <View style={{ backgroundColor: '#E8F5E9', padding: 8, borderRadius: 20, marginRight: 10 }}>
                    <Ionicons name="cash-outline" size={20} color="#4CAF50" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text }}>
                        Pagamentos Automáticos (Asaas)
                    </Text>
                    <Text style={{ fontSize: 12, color: c.sub }}>
                        {metrics ? `${monthNames[metrics.month - 1]}/${metrics.year} — ${metrics.receivedCount} recebido${metrics.receivedCount === 1 ? '' : 's'}` : 'Carregando...'}
                    </Text>
                </View>
                <TouchableOpacity onPress={fetchPayments} style={{ padding: 5, marginRight: 5 }}>
                    <Ionicons name="refresh" size={20} color={c.sub} />
                </TouchableOpacity>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={c.sub} />
            </TouchableOpacity>

            {expanded && (
                <>
                    {loading ? (
                        <ActivityIndicator color={c.primary} style={{ paddingVertical: 25 }} />
                    ) : (
                        <>
                            {/* MÉTRICAS DO MÊS */}
                            {metrics && (
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 15 }}>
                                    <View style={{ flex: 1, backgroundColor: c.bg2, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: c.primary }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: c.sub, textTransform: 'uppercase' }}>Recebido</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '900', color: c.primary, marginTop: 2 }}>{money(metrics.receivedGross)}</Text>
                                        {metrics.receivedNet > 0 && metrics.receivedNet !== metrics.receivedGross && (
                                            <Text style={{ fontSize: 9, color: c.sub, marginTop: 1 }}>líquido {money(metrics.receivedNet)}</Text>
                                        )}
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: c.bg2, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FF9500' }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: c.sub, textTransform: 'uppercase' }}>Pendente</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#FF9500', marginTop: 2 }}>{money(metrics.pendingValue)}</Text>
                                        <Text style={{ fontSize: 9, color: c.sub, marginTop: 1 }}>{metrics.pendingCount} cobrança{metrics.pendingCount === 1 ? '' : 's'}</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: c.bg2, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#F44336' }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: c.sub, textTransform: 'uppercase' }}>Vencido</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#F44336', marginTop: 2 }}>{money(metrics.overdueValue)}</Text>
                                        <Text style={{ fontSize: 9, color: c.sub, marginTop: 1 }}>{metrics.overdueCount} cobrança{metrics.overdueCount === 1 ? '' : 's'}</Text>
                                    </View>
                                </View>
                            )}

                            {/* 🔥 RELATÓRIO PARA O CONTADOR (IMPOSTO DE RENDA) */}
                            <View style={{ marginTop: 15, backgroundColor: c.bg2, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: c.border }}>
                                <Text style={{ fontSize: 11, fontWeight: '900', color: c.text, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                                    📄 Relatório para o Contador
                                </Text>
                                <Text style={{ fontSize: 10.5, color: c.sub, marginTop: 3, marginBottom: 10 }}>
                                    PDF com só os valores já recebidos — use pra declarar o Imposto de Renda.
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg, borderWidth: 1, borderColor: c.primary, borderRadius: 8, paddingVertical: 10, gap: 6 }}
                                        onPress={() => handleGenerateReport('monthly')}
                                        disabled={!!generatingReport}
                                    >
                                        {generatingReport === 'monthly'
                                            ? <ActivityIndicator size="small" color={c.primary} />
                                            : <><Ionicons name="document-text-outline" size={15} color={c.primary} /><Text style={{ color: c.primary, fontWeight: 'bold', fontSize: 11 }}>DO MÊS</Text></>
                                        }
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: c.primary, borderRadius: 8, paddingVertical: 10, gap: 6 }}
                                        onPress={() => handleGenerateReport('annual')}
                                        disabled={!!generatingReport}
                                    >
                                        {generatingReport === 'annual'
                                            ? <ActivityIndicator size="small" color="#FFF" />
                                            : <><Ionicons name="document-text-outline" size={15} color="#FFF" /><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>ANUAL ({currentYear || new Date().getFullYear()})</Text></>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* FILTROS */}
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 15, flexWrap: 'wrap' }}>
                                {FILTERS.map(f => (
                                    <TouchableOpacity
                                        key={f.key}
                                        style={{
                                            paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
                                            backgroundColor: filter === f.key ? c.primary : c.bg2,
                                            borderWidth: 1, borderColor: filter === f.key ? c.primary : c.border
                                        }}
                                        onPress={() => setFilter(f.key)}
                                    >
                                        <Text style={{ color: filter === f.key ? '#FFF' : c.sub, fontWeight: 'bold', fontSize: 11 }}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* LISTA */}
                            {filtered.length === 0 ? (
                                <Text style={{ color: c.sub, fontSize: 13, textAlign: 'center', paddingVertical: 25 }}>
                                    Nenhuma cobrança {filter !== 'TODOS' ? 'nesse filtro' : 'registrada ainda'}. 
                                    {filter === 'TODOS' ? ' As cobranças geradas pelo app aparecem aqui automaticamente.' : ''}
                                </Text>
                            ) : (
                                <ScrollView style={{ maxHeight: isWebPC ? 420 : 340, marginTop: 12 }} showsVerticalScrollIndicator={false}>
                                    {filtered.map(p => {
                                        const st = STATUS_META[p.status] || STATUS_META.PENDING;
                                        const bt = BILLING_META[p.billingType] || BILLING_META.UNDEFINED;
                                        const isPaid = p.status === 'CONFIRMED' || p.status === 'RECEIVED';
                                        return (
                                            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg2, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: c.border }}>
                                                
                                                {/* FOTO / INICIAL */}
                                                {p.user?.photoUrl ? (
                                                    <Image source={{ uri: p.user.photoUrl }} style={{ width: 38, height: 38, borderRadius: 19, marginRight: 10 }} />
                                                ) : (
                                                    <View style={{ width: 38, height: 38, borderRadius: 19, marginRight: 10, backgroundColor: c.border, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Text style={{ color: c.text, fontWeight: 'bold' }}>{(p.user?.name || '?')[0]?.toUpperCase()}</Text>
                                                    </View>
                                                )}

                                                {/* INFO */}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ color: c.text, fontWeight: 'bold', fontSize: 13 }} numberOfLines={1}>
                                                        {p.user?.name || 'Aluno'}
                                                        {p.isSubscription ? '  🔄' : ''}
                                                    </Text>
                                                    <Text style={{ color: c.sub, fontSize: 11, marginTop: 2 }}>
                                                        <Ionicons name={bt.icon} size={11} color={c.sub} /> {bt.label}
                                                        {'   '}
                                                        {isPaid
                                                            ? `Pago em ${dateBR(p.paymentDate)}`
                                                            : `Vence ${dateBR(p.dueDate)}`}
                                                    </Text>
                                                </View>

                                                {/* VALOR + STATUS */}
                                                <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                                                    <Text style={{ color: c.text, fontWeight: '900', fontSize: 14 }}>{money(p.value)}</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                                        <Ionicons name={st.icon} size={11} color={st.color} />
                                                        <Text style={{ color: st.color, fontWeight: 'bold', fontSize: 9, marginLeft: 3, letterSpacing: 0.5 }}>{st.label}</Text>
                                                    </View>
                                                </View>

                                                {/* AÇÕES */}
                                                {p.invoiceUrl ? (
                                                    <View style={{ gap: 6 }}>
                                                        <TouchableOpacity onPress={() => Linking.openURL(p.invoiceUrl)} style={{ padding: 4 }}>
                                                            <Ionicons name="open-outline" size={17} color={c.blue} />
                                                        </TouchableOpacity>
                                                        {!isPaid && (
                                                            <TouchableOpacity onPress={() => copyLink(p.invoiceUrl)} style={{ padding: 4 }}>
                                                                <Ionicons name="copy-outline" size={17} color={c.sub} />
                                                            </TouchableOpacity>
                                                        )}
                                                        {/* 🔥 BOTÃO DE EXCLUIR FATURA */}
                                                        {!isPaid && (
                                                            <TouchableOpacity onPress={() => handleDeleteCharge(p.id)} style={{ padding: 4 }}>
                                                                <Ionicons name="trash-outline" size={17} color={c.red} />
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                ) : null}
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </>
                    )}
                </>
            )}
        </View>
    );
}