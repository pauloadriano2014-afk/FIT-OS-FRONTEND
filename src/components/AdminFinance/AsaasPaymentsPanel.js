// src/components/AdminFinance/AsaasPaymentsPanel.js
// 📊 PAINEL DE PAGAMENTOS ASAAS (dentro do Financeiro admin)
//
// Mostra as cobranças geradas via Asaas (app da aluna ou modal do admin),
// com status atualizado em tempo real pelo webhook: quem pagou, quem tá
// pendente, quem venceu. Métricas do mês no topo.
//
// Uso no AdminFinanceSystem:
//   <AsaasPaymentsPanel theme={theme} isWebPC={isWebPC} />

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    Platform, Alert, Linking, Image, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

export default function AsaasPaymentsPanel({ theme, isWebPC }) {
    const isDark = theme === 'dark';
    const c = {
        bg: isDark ? '#1E1E1E' : '#F9F9F9',
        bg2: isDark ? '#2A2A2A' : '#FFF',
        text: isDark ? '#FFF' : '#333',
        sub: '#888',
        border: isDark ? '#444' : '#DDD',
        primary: '#8BC34A',
        blue: '#32ADE6',
    };

    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [payments, setPayments] = useState([]);
    const [filter, setFilter] = useState('TODOS');
    const [expanded, setExpanded] = useState(true);

    const notify = (msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('', msg);
    };

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/admin/payments?t=${Date.now()}`);
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
    }, []);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    const money = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
    const dateBR = (iso) => {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
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