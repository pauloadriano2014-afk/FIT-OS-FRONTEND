// src/components/AdminFinance/FinanceChargeModal.js
// 💰 Modal de geração de cobrança via Asaas (PIX / Cartão / Boleto)

import React, { useState, useEffect } from 'react';
import {
    View, Text, Modal, TouchableOpacity, TextInput,
    ActivityIndicator, ScrollView, Platform, Alert, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authHeaders } from '../../utils/authToken';

const API_URL = 'https://fitos-final.onrender.com';

// Mapeia o tipo de contrato existente para o ciclo do Asaas
const CONTRACT_TO_CYCLE = {
    'Mensal': 'MONTHLY',
    'Trimestral': 'QUARTERLY',
    'Semestral': 'SEMIANNUALLY',
    'Anual': 'YEARLY',
};

const CYCLE_LABELS = {
    'MONTHLY': 'Mensal',
    'QUARTERLY': 'Trimestral',
    'SEMIANNUALLY': 'Semestral',
    'YEARLY': 'Anual',
};

export default function FinanceChargeModal({ theme, isWebPC, aluno, visible, onClose }) {
    const isDark = theme === 'dark';

    // 🎨 Paleta seguindo o padrão do FinanceEditModal
    const c = {
        bg: isDark ? '#1E1E1E' : '#F9F9F9',
        bg2: isDark ? '#2A2A2A' : '#FFF',
        text: isDark ? '#FFF' : '#333',
        sub: '#888',
        border: isDark ? '#444' : '#DDD',
        primary: '#8BC34A',
        primaryDark: '#4CAF50',
        danger: '#F44336',
    };

    // Form
    const [chargeType, setChargeType] = useState('SINGLE'); // SINGLE | SUBSCRIPTION
    const [value, setValue] = useState('');
    const [cycle, setCycle] = useState('MONTHLY');
    const [dueDate, setDueDate] = useState('');
    const [cpf, setCpf] = useState('');

    // Fluxo
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Pré-preenche com os dados do contrato da aluna quando o modal abre
    useEffect(() => {
        if (visible && aluno) {
            setValue(aluno.contractValue ? String(aluno.contractValue) : '');
            setCycle(CONTRACT_TO_CYCLE[aluno.contractType] || 'MONTHLY');
            setCpf(aluno.cpf || '');
            setChargeType('SINGLE');
            setResult(null);
            setErrorMsg('');

            // Vencimento padrão: hoje + 3 dias
            const d = new Date();
            d.setDate(d.getDate() + 3);
            setDueDate(d.toISOString().split('T')[0]);
        }
    }, [visible, aluno]);

    const notify = (msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('', msg);
    };

    const validateCpf = (raw) => {
        const digits = (raw || '').replace(/\D/g, '');
        return digits.length === 11 || digits.length === 14; // CPF ou CNPJ
    };

    const handleGenerate = async () => {
        setErrorMsg('');

        const parsedValue = parseFloat(String(value).replace(',', '.'));
        if (!parsedValue || parsedValue <= 0) { setErrorMsg('Informe um valor válido.'); return; }
        if (!validateCpf(cpf)) { setErrorMsg('Informe o CPF da aluna (11 dígitos).'); return; }
        if (!dueDate) { setErrorMsg('Informe a data de vencimento.'); return; }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/payments/create-charge`, {
                method: 'POST',
                // 🔐 precisa do token de login -- sem ele o servidor devolve 401 (requireAuth)
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({
                    userId: aluno.id,
                    value: parsedValue,
                    planName: CYCLE_LABELS[cycle] || 'Mensal',
                    type: chargeType,
                    cycle,
                    billingType: 'UNDEFINED', // aluna escolhe PIX/cartão/boleto na fatura
                    dueDate,
                    cpfCnpj: cpf.replace(/\D/g, ''),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Erro ao gerar cobrança.');
            }

            setResult(data);
        } catch (err) {
            console.error('[FinanceChargeModal] Erro:', err);
            setErrorMsg(err.message || 'Erro ao gerar cobrança. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            if (Platform.OS === 'web' && navigator?.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // expo-clipboard, se instalado no projeto
                const Clipboard = require('expo-clipboard');
                await Clipboard.setStringAsync(text);
            }
            notify('Link copiado!');
        } catch {
            notify('Não foi possível copiar. Segure o link para copiar manualmente.');
        }
    };

    const sendWhatsApp = () => {
        if (!aluno?.phone || !result?.payment?.invoiceUrl) return;
        const msg = `Olá ${aluno.name}! 💪 Sua cobrança da consultoria foi gerada.\n\n💰 Valor: R$ ${result.payment.value.toFixed(2).replace('.', ',')}\n📅 Vencimento: ${result.payment.dueDate.split('-').reverse().join('/')}\n\nPague por PIX, cartão ou boleto no link:\n${result.payment.invoiceUrl}`;
        const url = `whatsapp://send?phone=+55${aluno.phone.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`;
        Linking.openURL(url).catch(() => notify('Não foi possível abrir o WhatsApp.'));
    };

    if (!aluno) return null;

    const labelStyle = { fontSize: 12, fontWeight: 'bold', color: c.sub, marginBottom: 5, marginTop: 15, textTransform: 'uppercase' };
    const inputStyle = { backgroundColor: c.bg2, color: c.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: c.border, fontSize: 14, fontWeight: 'bold' };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{
                    width: isWebPC ? 500 : '90%',
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
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.text }}>
                                    {result ? 'Cobrança Gerada!' : 'Gerar Cobrança'}
                                </Text>
                                <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{aluno.name}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {!result ? (
                            <>
                                {/* TIPO DE COBRANÇA */}
                                <Text style={labelStyle}>Tipo de Cobrança</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {[
                                        { key: 'SINGLE', label: 'Avulsa' },
                                        { key: 'SUBSCRIPTION', label: 'Assinatura 🔄' },
                                    ].map(opt => (
                                        <TouchableOpacity
                                            key={opt.key}
                                            style={{
                                                flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center',
                                                backgroundColor: chargeType === opt.key ? c.primary : c.bg2,
                                                borderWidth: 1, borderColor: chargeType === opt.key ? c.primary : c.border
                                            }}
                                            onPress={() => setChargeType(opt.key)}
                                        >
                                            <Text style={{ color: chargeType === opt.key ? '#FFF' : c.sub, fontWeight: 'bold', fontSize: 13 }}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {chargeType === 'SUBSCRIPTION' && (
                                    <Text style={{ fontSize: 11, color: c.sub, marginTop: 6 }}>
                                        A assinatura gera cobranças automáticas a cada ciclo. O Asaas envia os lembretes sozinho.
                                    </Text>
                                )}

                                {/* CICLO */}
                                <Text style={labelStyle}>Plano / Ciclo</Text>
                                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                                    {['MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'].map(cy => (
                                        <TouchableOpacity
                                            key={cy}
                                            style={{
                                                paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8,
                                                backgroundColor: cycle === cy ? c.primary : c.bg2,
                                                borderWidth: 1, borderColor: cycle === cy ? c.primary : c.border
                                            }}
                                            onPress={() => setCycle(cy)}
                                        >
                                            <Text style={{ color: cycle === cy ? '#FFF' : c.sub, fontWeight: 'bold', fontSize: 12 }}>
                                                {CYCLE_LABELS[cy]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* VALOR E VENCIMENTO */}
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
                                        <Text style={labelStyle}>Vencimento</Text>
                                        {Platform.OS === 'web' ? (
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: `1px solid ${c.border}`, backgroundColor: c.bg2, color: c.text, outline: 'none', fontSize: '14px', fontWeight: 'bold', boxSizing: 'border-box' }}
                                            />
                                        ) : (
                                            <TextInput
                                                style={inputStyle}
                                                value={dueDate}
                                                onChangeText={setDueDate}
                                                placeholder="AAAA-MM-DD"
                                                placeholderTextColor={c.sub}
                                            />
                                        )}
                                    </View>
                                </View>

                                {/* CPF */}
                                <Text style={labelStyle}>
                                    CPF da Aluna {aluno.cpf ? '✓ (já cadastrado)' : '(obrigatório p/ o Asaas)'}
                                </Text>
                                <TextInput
                                    style={inputStyle}
                                    value={cpf}
                                    onChangeText={setCpf}
                                    keyboardType="number-pad"
                                    placeholder="Somente números"
                                    placeholderTextColor={c.sub}
                                    maxLength={14}
                                />

                                {errorMsg ? (
                                    <Text style={{ color: c.danger, fontSize: 13, marginTop: 12, textAlign: 'center', fontWeight: 'bold' }}>
                                        {errorMsg}
                                    </Text>
                                ) : null}

                                {/* BOTÕES */}
                                <TouchableOpacity
                                    style={{ backgroundColor: c.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 10 }}
                                    onPress={handleGenerate}
                                    disabled={isLoading}
                                >
                                    {isLoading
                                        ? <ActivityIndicator color="#FFF" />
                                        : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                                            {chargeType === 'SUBSCRIPTION' ? '🔄 CRIAR ASSINATURA' : '💰 GERAR COBRANÇA'}
                                          </Text>
                                    }
                                </TouchableOpacity>
                                <TouchableOpacity style={{ padding: 12, alignItems: 'center' }} onPress={onClose}>
                                    <Text style={{ color: c.sub, fontSize: 14 }}>Cancelar</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* SUCESSO */}
                                <View style={{ backgroundColor: c.bg2, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: c.primary, marginTop: 5 }}>
                                    <Text style={{ color: c.primary, fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 6 }}>
                                        {chargeType === 'SUBSCRIPTION' ? '🔄 Assinatura ativa' : '✅ Aguardando pagamento'}
                                    </Text>
                                    <Text style={{ color: c.text, fontSize: 13, textAlign: 'center', marginBottom: 4 }}>
                                        R$ {String(value).replace('.', ',')} — vence {dueDate.split('-').reverse().join('/')}
                                    </Text>
                                    <Text style={{ color: c.sub, fontSize: 11, textAlign: 'center', marginBottom: 14 }} numberOfLines={2}>
                                        {result.payment?.invoiceUrl}
                                    </Text>

                                    <TouchableOpacity
                                        style={{ backgroundColor: c.bg, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'center' }}
                                        onPress={() => copyToClipboard(result.payment?.invoiceUrl)}
                                    >
                                        <Ionicons name="copy-outline" size={16} color={c.text} style={{ marginRight: 8 }} />
                                        <Text style={{ color: c.text, fontWeight: 'bold', fontSize: 13 }}>COPIAR LINK DA FATURA</Text>
                                    </TouchableOpacity>

                                    {aluno.phone ? (
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#25D366', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8, flexDirection: 'row', justifyContent: 'center' }}
                                            onPress={sendWhatsApp}
                                        >
                                            <Ionicons name="logo-whatsapp" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>ENVIAR NO WHATSAPP</Text>
                                        </TouchableOpacity>
                                    ) : null}

                                    <TouchableOpacity
                                        style={{ backgroundColor: c.bg, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'center' }}
                                        onPress={() => Linking.openURL(result.payment?.invoiceUrl)}
                                    >
                                        <Ionicons name="open-outline" size={16} color={c.text} style={{ marginRight: 8 }} />
                                        <Text style={{ color: c.text, fontWeight: 'bold', fontSize: 13 }}>ABRIR FATURA</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={{ fontSize: 12, color: c.sub, textAlign: 'center', marginTop: 14, lineHeight: 18 }}>
                                    Quando o pagamento cair, o acesso libera automaticamente e o vencimento avança sozinho. 🚀
                                </Text>

                                <TouchableOpacity
                                    style={{ backgroundColor: c.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 }}
                                    onPress={onClose}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>CONCLUIR</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}