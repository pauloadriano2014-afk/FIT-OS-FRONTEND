// src/components/AdminFinance/FinanceManualReceiptModal.js
// 💵 Confirmação rápida ao marcar um aluno como "pago" fora da Asaas (PIX
// direto, dinheiro, transferência...). Sem isso, marcar "pago" só empurrava
// a data de vencimento pra frente e não sobrava nenhum registro de quanto
// e quando o dinheiro entrou -- o que deixava esse recebimento de fora do
// Relatório Financeiro (Imposto de Renda). Esse valor/data/forma aqui vira
// um ManualReceipt no backend (ver financeReportPdfUtils.js / useAdminFinance.js).

import React, { useState, useEffect } from 'react';
import {
    View, Text, Modal, TouchableOpacity, TextInput,
    ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const METHODS = [
    { key: 'PIX', label: 'PIX' },
    { key: 'CARTAO', label: 'Cartão' },
    { key: 'DINHEIRO', label: 'Dinheiro' },
    { key: 'TRANSFERENCIA', label: 'Transferência' },
    { key: 'OUTRO', label: 'Outro' },
];

export default function FinanceManualReceiptModal({ theme, isWebPC, visible, aluno, defaultValue, onConfirm, onClose, isSaving }) {
    const isDark = theme === 'dark';
    const c = {
        bg: isDark ? '#1E1E1E' : '#F9F9F9',
        bg2: isDark ? '#2A2A2A' : '#FFF',
        text: isDark ? '#FFF' : '#333',
        sub: '#888',
        border: isDark ? '#444' : '#DDD',
        primary: '#8BC34A',
    };

    const [value, setValue] = useState('');
    const [receivedAt, setReceivedAt] = useState('');
    const [method, setMethod] = useState('PIX');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (visible) {
            setValue(defaultValue !== undefined && defaultValue !== null ? String(defaultValue) : '');
            setReceivedAt(new Date().toISOString().split('T')[0]);
            setMethod('PIX');
            setNote('');
        }
    }, [visible, aluno]);

    if (!aluno) return null;

    const labelStyle = { fontSize: 12, fontWeight: 'bold', color: c.sub, marginBottom: 5, marginTop: 15, textTransform: 'uppercase' };
    const inputStyle = { backgroundColor: c.bg2, color: c.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: c.border, fontSize: 14, fontWeight: 'bold' };

    const handleConfirm = () => {
        const parsedValue = parseFloat(String(value).replace(',', '.'));
        if (!parsedValue || parsedValue <= 0) return;
        onConfirm({ value: parsedValue, method, receivedAt, note: note.trim() || null });
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{
                    width: isWebPC ? 460 : '90%',
                    maxHeight: '90%',
                    backgroundColor: c.bg,
                    borderRadius: 15,
                    padding: 20,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8
                }}>

                    {/* CABEÇALHO */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#E0E0E0', paddingBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ backgroundColor: '#E8F5E9', padding: 8, borderRadius: 20, marginRight: 10 }}>
                                <Ionicons name="cash-outline" size={20} color="#4CAF50" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.text }}>Registrar Pagamento</Text>
                                <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{aluno.name}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={{ fontSize: 11.5, color: c.sub, lineHeight: 17 }}>
                            Esse aluno não paga pela Asaas — confirme quanto e quando o pagamento caiu.
                            Isso entra no seu Relatório Financeiro (Imposto de Renda).
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={labelStyle}>Valor (R$)</Text>
                                <TextInput
                                    style={[inputStyle, { color: c.primary, textAlign: 'center' }]}
                                    value={value}
                                    onChangeText={setValue}
                                    keyboardType="numeric"
                                    placeholder="250"
                                    placeholderTextColor={c.sub}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={labelStyle}>Data do Recebimento</Text>
                                {Platform.OS === 'web' ? (
                                    <input
                                        type="date"
                                        value={receivedAt}
                                        onChange={(e) => setReceivedAt(e.target.value)}
                                        style={{ width: '100%', padding: '11px', borderRadius: '8px', border: `1px solid ${c.border}`, backgroundColor: c.bg2, color: c.text, outline: 'none', fontSize: '14px', fontWeight: 'bold', boxSizing: 'border-box' }}
                                    />
                                ) : (
                                    <TextInput
                                        style={inputStyle}
                                        value={receivedAt}
                                        onChangeText={setReceivedAt}
                                        placeholder="AAAA-MM-DD"
                                        placeholderTextColor={c.sub}
                                    />
                                )}
                            </View>
                        </View>

                        <Text style={labelStyle}>Forma de Pagamento</Text>
                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                            {METHODS.map(m => (
                                <TouchableOpacity
                                    key={m.key}
                                    style={{
                                        paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8,
                                        backgroundColor: method === m.key ? c.primary : c.bg2,
                                        borderWidth: 1, borderColor: method === m.key ? c.primary : c.border
                                    }}
                                    onPress={() => setMethod(m.key)}
                                >
                                    <Text style={{ color: method === m.key ? '#FFF' : c.sub, fontWeight: 'bold', fontSize: 12 }}>
                                        {m.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={labelStyle}>Observação (opcional)</Text>
                        <TextInput
                            style={inputStyle}
                            value={note}
                            onChangeText={setNote}
                            placeholder="Ex: pagou metade agora, metade semana que vem"
                            placeholderTextColor={c.sub}
                        />

                        <TouchableOpacity
                            style={{ backgroundColor: c.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 10 }}
                            onPress={handleConfirm}
                            disabled={isSaving}
                        >
                            {isSaving
                                ? <ActivityIndicator color="#FFF" />
                                : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>REGISTRAR PAGAMENTO</Text>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity style={{ padding: 12, alignItems: 'center' }} onPress={onClose}>
                            <Text style={{ color: c.sub, fontSize: 14 }}>Cancelar</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
