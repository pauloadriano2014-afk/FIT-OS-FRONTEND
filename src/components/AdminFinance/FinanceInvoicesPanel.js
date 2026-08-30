// src/components/AdminFinance/FinanceInvoicesPanel.js
// 🧾 NOTAS FISCAIS -- lista os recebimentos do mês (Asaas + manuais, mesma
// fonte do Relatório Financeiro) e deixa emitir a nota de cada um por um
// botão manual ("Emitir Nota"), um de cada vez -- nunca automático (decisão
// do Paulo). Fase 1: só funciona pra conta dele (PA ELITE TEAM LTDA) -- ver
// app/api/finance/invoice no backend pro porquê (rotas de cobrança ainda não
// distinguem Asaas por coach parceiro).
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    Platform, Alert, Linking, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchFinanceReport } from '../../utils/financeReportPdfUtils';
import { emitInvoice } from '../../utils/financeInvoiceUtils';
import FinanceFiscalConfigModal from './FinanceFiscalConfigModal';

const INVOICE_STATUS_META = {
    SCHEDULED: { label: 'AGENDADA', color: '#FF9500' },
    SYNCHRONIZED: { label: 'ENVIADA', color: '#32ADE6' },
    AUTHORIZED: { label: 'EMITIDA', color: '#8BC34A' },
    ERROR: { label: 'ERRO', color: '#F44336' },
    CANCELED: { label: 'CANCELADA', color: '#888' },
    PROCESSING_CANCELLATION: { label: 'CANCELANDO', color: '#FF9500' },
    CANCELLATION_DENIED: { label: 'CANCEL. NEGADA', color: '#F44336' },
};

export default function FinanceInvoicesPanel({ theme, isWebPC, selectedMonth, currentYear }) {
    const isDark = theme === 'dark';
    const c = {
        bg: isDark ? '#1E1E1E' : '#F9F9F9',
        bg2: isDark ? '#2A2A2A' : '#FFF',
        text: isDark ? '#FFF' : '#333',
        sub: '#888',
        border: isDark ? '#444' : '#DDD',
        primary: '#8B5CF6',
    };

    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null); // { items, invoiceSupported, monthName, year }
    const [emittingId, setEmittingId] = useState(null);
    const [cpfPromptId, setCpfPromptId] = useState(null);
    const [cpfDraft, setCpfDraft] = useState('');
    const [configVisible, setConfigVisible] = useState(false);

    const notify = (msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('', msg);
    };

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const userStr = await AsyncStorage.getItem('user');
            const coachId = userStr ? JSON.parse(userStr).id : null;
            const year = currentYear || new Date().getFullYear();
            const month = (selectedMonth !== undefined && selectedMonth !== null) ? selectedMonth + 1 : (new Date().getMonth() + 1);
            const data = await fetchFinanceReport({ mode: 'monthly', year, month, coachId });
            setReport(data);
        } catch (e) {
            console.error('Erro ao buscar notas fiscais:', e);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, currentYear]);

    useEffect(() => { if (expanded) load(); }, [expanded, load]);

    const money = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
    const dateBR = (iso) => {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        } catch { return '—'; }
    };

    const runEmit = async (item, cpfCnpj) => {
        try {
            setEmittingId(item.id);
            const params = item.source === 'ASAAS' ? { paymentId: item.id } : { manualReceiptId: item.id, cpfCnpj };
            const { invoice } = await emitInvoice(params);
            setReport((prev) => prev ? {
                ...prev,
                items: prev.items.map((it) => it.id === item.id ? { ...it, invoice: { id: invoice.id, status: invoice.status, pdfUrl: invoice.pdfUrl } } : it),
            } : prev);
            setCpfPromptId(null);
            setCpfDraft('');
            notify('Nota fiscal agendada! O status atualiza automaticamente conforme a Asaas processa.');
        } catch (e) {
            if (e.needsCpf) {
                setCpfPromptId(item.id);
            } else if (e.needsServiceConfig) {
                notify('Configure o serviço padrão de nota fiscal antes de emitir.');
                setConfigVisible(true);
            } else {
                notify(e.message || 'Erro ao emitir nota fiscal.');
            }
        } finally {
            setEmittingId(null);
        }
    };

    const items = report?.items || [];

    return (
        <View style={{ backgroundColor: c.bg, borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: c.border }}>

            <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <View style={{ backgroundColor: 'rgba(139,92,246,0.15)', padding: 8, borderRadius: 20, marginRight: 10 }}>
                    <Ionicons name="document-text-outline" size={20} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text }}>Notas Fiscais</Text>
                    <Text style={{ fontSize: 12, color: c.sub }}>Emita a nota de cada recebimento (Asaas ou manual)</Text>
                </View>
                {expanded && (
                    <TouchableOpacity onPress={() => setConfigVisible(true)} style={{ padding: 5, marginRight: 5 }}>
                        <Ionicons name="settings-outline" size={20} color={c.sub} />
                    </TouchableOpacity>
                )}
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={c.sub} />
            </TouchableOpacity>

            {expanded && (
                loading ? (
                    <ActivityIndicator color={c.primary} style={{ paddingVertical: 25 }} />
                ) : report && !report.invoiceSupported ? (
                    <View style={{ marginTop: 15, backgroundColor: c.bg2, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: c.border }}>
                        <Text style={{ color: c.sub, fontSize: 12, lineHeight: 17 }}>
                            Emissão de nota fiscal disponível só pra sua conta (PA ELITE TEAM) por enquanto — coach parceiro ainda não tem isso liberado.
                        </Text>
                    </View>
                ) : items.length === 0 ? (
                    <Text style={{ color: c.sub, fontSize: 13, textAlign: 'center', paddingVertical: 25 }}>
                        Nenhum recebimento neste mês ainda.
                    </Text>
                ) : (
                    <ScrollView style={{ maxHeight: isWebPC ? 420 : 340, marginTop: 12 }} showsVerticalScrollIndicator={false}>
                        {items.map((item) => {
                            const inv = item.invoice;
                            const stMeta = inv ? (INVOICE_STATUS_META[inv.status] || INVOICE_STATUS_META.SCHEDULED) : null;
                            const canEmit = !inv || inv.status === 'ERROR' || inv.status === 'CANCELED';
                            return (
                                <View key={`${item.source}-${item.id}`} style={{ backgroundColor: c.bg2, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: c.border }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: c.text, fontWeight: 'bold', fontSize: 13 }} numberOfLines={1}>{item.studentName}</Text>
                                            <Text style={{ color: c.sub, fontSize: 11, marginTop: 2 }}>
                                                {dateBR(item.paymentDate)} • {item.source === 'ASAAS' ? 'Asaas' : 'Manual'} • {money(item.value)}
                                            </Text>
                                        </View>
                                        {inv ? (
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stMeta.color }} />
                                                    <Text style={{ color: stMeta.color, fontWeight: 'bold', fontSize: 10 }}>{stMeta.label}</Text>
                                                </View>
                                                {inv.pdfUrl && (
                                                    <TouchableOpacity onPress={() => Linking.openURL(inv.pdfUrl)} style={{ marginTop: 4 }}>
                                                        <Text style={{ color: c.primary, fontSize: 11, fontWeight: 'bold' }}>Ver PDF</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {canEmit && (
                                                    <TouchableOpacity onPress={() => runEmit(item)} style={{ marginTop: 4 }} disabled={emittingId === item.id}>
                                                        <Text style={{ color: c.sub, fontSize: 10.5 }}>tentar de novo</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={{ backgroundColor: c.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}
                                                onPress={() => runEmit(item)}
                                                disabled={emittingId === item.id}
                                            >
                                                {emittingId === item.id
                                                    ? <ActivityIndicator size="small" color="#FFF" />
                                                    : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>EMITIR NOTA</Text>
                                                }
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {cpfPromptId === item.id && (
                                        <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
                                            <TextInput
                                                style={{ flex: 1, backgroundColor: c.bg, color: c.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: c.border, fontSize: 13 }}
                                                value={cpfDraft}
                                                onChangeText={setCpfDraft}
                                                placeholder="CPF ou CNPJ do aluno"
                                                placeholderTextColor={c.sub}
                                                keyboardType="numeric"
                                            />
                                            <TouchableOpacity
                                                style={{ backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' }}
                                                onPress={() => runEmit(item, cpfDraft)}
                                                disabled={emittingId === item.id}
                                            >
                                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>OK</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                )
            )}

            <FinanceFiscalConfigModal
                theme={theme} isWebPC={isWebPC}
                visible={configVisible}
                onClose={() => setConfigVisible(false)}
            />
        </View>
    );
}
