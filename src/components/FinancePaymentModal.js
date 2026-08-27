// src/components/FinancePaymentModal.js
import React, { useState, useEffect } from 'react';
import {
    View, Text, Modal, TouchableOpacity, TextInput, Image,
    ActivityIndicator, ScrollView, Platform, Alert, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authHeaders } from '../utils/authToken';

const API_URL = 'https://fitos-final.onrender.com';

export default function FinancePaymentModal({ visible, onClose, theme, userId, onPaid }) {
    const [step, setStep] = useState('LOADING'); // LOADING | CPF | CHARGE | PAID | ERROR
    const [payment, setPayment] = useState(null);
    const [cpf, setCpf] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const notify = (msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('', msg);
    };

    // Usamos isSilent para as buscas automáticas de fundo não mostrarem telas de erro
    const fetchCheckout = async (cpfToSend = null, isSilent = false) => {
        try {
            const res = await fetch(`${API_URL}/api/payments/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ userId, ...(cpfToSend ? { cpf: cpfToSend } : {}) }),
            });
            const data = await res.json();

            if (data.needsCpf) {
                setStep('CPF');
                return;
            }
            if (data.paid) {
                setStep('PAID');
                // O onPaid() foi removido daqui para não causar bugs de renderização. 
                // Será disparado apenas quando o aluno clicar no botão "Continuar".
                return;
            }
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Não foi possível preparar seu pagamento.');
            }

            setPayment(data.payment);
            setStep('CHARGE');
        } catch (err) {
            console.error('[FinancePaymentModal] Erro:', err);
            if (!isSilent) {
                setErrorMsg(err.message || 'Erro de conexão. Tente novamente.');
                setStep('ERROR');
            }
        }
    };

    // 1. CARREGA AO ABRIR O MODAL
    // Dependências limitadas para matar o bug do loop infinito de loading
    useEffect(() => {
        if (visible && userId) {
            setStep('LOADING');
            setErrorMsg('');
            setPayment(null);
            fetchCheckout();
        }
    }, [visible, userId]);

    // 2. SMART POLLING (O Pulo do Gato pro PIX)
    // Como o Asaas leva alguns segundos para gerar o QR Code, se chegar na tela e não tiver PIX,
    // o app busca silenciosamente de novo 3 segundos depois.
    useEffect(() => {
        let timeout;
        if (visible && step === 'CHARGE' && payment && !payment.pixCopyPaste) {
            timeout = setTimeout(() => {
                fetchCheckout(null, true);
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [visible, step, payment]);

    const handleSubmitCpf = async () => {
        const digits = cpf.replace(/\D/g, '');
        if (digits.length !== 11) {
            notify('CPF inválido. Digite os 11 números.');
            return;
        }
        setIsSubmitting(true);
        setStep('LOADING');
        await fetchCheckout(digits);
        setIsSubmitting(false);
    };

    const handleRefreshStatus = async () => {
        setIsRefreshing(true);
        await fetchCheckout();
        setIsRefreshing(false);
    };

    const copyPix = async () => {
        if (!payment?.pixCopyPaste) return;
        try {
            if (Platform.OS === 'web' && navigator?.clipboard) {
                await navigator.clipboard.writeText(payment.pixCopyPaste);
            } else {
                const Clipboard = require('expo-clipboard');
                await Clipboard.setStringAsync(payment.pixCopyPaste);
            }
            notify('Código PIX copiado! Cole no app do seu banco. 🏦');
        } catch {
            notify('Não foi possível copiar automaticamente.');
        }
    };

    const formatBR = (iso) => iso ? iso.split('-').reverse().join('/') : '';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{
                    width: '90%', maxWidth: 420, maxHeight: '90%',
                    backgroundColor: theme.surface, borderRadius: 24,
                    borderWidth: 2, borderColor: theme.accent, padding: 25
                }}>
                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* ─── LOADING ─── */}
                        {step === 'LOADING' && (
                            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                <ActivityIndicator size="large" color={theme.accent} />
                                <Text style={{ color: theme.textSecondary, marginTop: 15, fontSize: 13 }}>
                                    Preparando seu pagamento...
                                </Text>
                            </View>
                        )}

                        {/* ─── COLETA DE CPF (uma vez só) ─── */}
                        {step === 'CPF' && (
                            <View style={{ alignItems: 'center' }}>
                                <View style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.accent + '22', marginBottom: 15 }}>
                                    <MaterialCommunityIcons name="card-account-details-outline" size={36} color={theme.accent} />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 10 }}>
                                    CONFIRME SEU CPF
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                                    Para gerar sua cobrança com segurança, precisamos do seu CPF.
                                    Você só faz isso <Text style={{ fontWeight: 'bold', color: theme.text }}>uma vez</Text> — fica salvo para os próximos pagamentos.
                                </Text>
                                <TextInput
                                    style={{
                                        width: '100%', backgroundColor: theme.bg, color: theme.text,
                                        padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border,
                                        fontSize: 18, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2, marginBottom: 20
                                    }}
                                    value={cpf}
                                    onChangeText={setCpf}
                                    keyboardType="number-pad"
                                    placeholder="000.000.000-00"
                                    placeholderTextColor={theme.textSecondary}
                                    maxLength={14}
                                />
                                <TouchableOpacity
                                    style={{ width: '100%', padding: 18, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}
                                    onPress={handleSubmitCpf}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? <ActivityIndicator color="#000" />
                                        : (<>
                                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>CONTINUAR</Text>
                                            <MaterialCommunityIcons name="arrow-right" size={20} color="#000" style={{ marginLeft: 8 }} />
                                        </>)
                                    }
                                </TouchableOpacity>
                                <TouchableOpacity style={{ padding: 10 }} onPress={onClose}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ─── COBRANÇA (QR PIX + opções) ─── */}
                        {step === 'CHARGE' && payment && (
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', letterSpacing: 1, textAlign: 'center' }}>
                                    PAGAR MENSALIDADE
                                </Text>
                                <Text style={{ color: theme.accent, fontSize: 32, fontWeight: '900', marginTop: 8 }}>
                                    R$ {Number(payment.value).toFixed(2).replace('.', ',')}
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 18 }}>
                                    Vencimento: {formatBR(payment.dueDate)}
                                </Text>

                                {/* QR CODE PIX */}
                                {payment.pixQrCode ? (
                                    <View style={{ backgroundColor: '#FFF', padding: 12, borderRadius: 16, marginBottom: 14 }}>
                                        <Image
                                            source={{ uri: `data:image/png;base64,${payment.pixQrCode}` }}
                                            style={{ width: 190, height: 190 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : null}

                                {/* COPIA E COLA */}
                                {payment.pixCopyPaste ? (
                                    <TouchableOpacity
                                        style={{ width: '100%', padding: 16, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}
                                        onPress={copyPix}
                                    >
                                        <MaterialCommunityIcons name="content-copy" size={18} color="#000" />
                                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5, marginLeft: 8 }}>
                                            COPIAR CÓDIGO PIX
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    /* MENSAGEM TEMPORÁRIA ENQUANTO O PIX GERA */
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, opacity: 0.7 }}>
                                        <ActivityIndicator size="small" color={theme.accent} style={{ marginRight: 8 }} />
                                        <Text style={{ color: theme.text, fontSize: 11 }}>Gerando código PIX...</Text>
                                    </View>
                                )}

                                {/* FATURA (cartão / boleto / pix) */}
                                {payment.invoiceUrl ? (
                                    <TouchableOpacity
                                        style={{ width: '100%', padding: 16, borderRadius: 12, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}
                                        onPress={() => Linking.openURL(payment.invoiceUrl)}
                                    >
                                        <MaterialCommunityIcons name="credit-card-outline" size={18} color={theme.text} />
                                        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13, letterSpacing: 0.5, marginLeft: 8 }}>
                                            PAGAR COM CARTÃO OU BOLETO
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}

                                {/* ATUALIZAR STATUS */}
                                <TouchableOpacity
                                    style={{ width: '100%', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#32ADE6', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}
                                    onPress={handleRefreshStatus}
                                    disabled={isRefreshing}
                                >
                                    {isRefreshing
                                        ? <ActivityIndicator color="#32ADE6" />
                                        : (<>
                                            <MaterialCommunityIcons name="refresh" size={18} color="#32ADE6" />
                                            <Text style={{ color: '#32ADE6', fontWeight: '900', fontSize: 13, letterSpacing: 0.5, marginLeft: 8 }}>
                                                JÁ PAGUEI — ATUALIZAR
                                            </Text>
                                        </>)
                                    }
                                </TouchableOpacity>

                                <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 10 }}>
                                    Pagando por PIX, seu acesso libera em segundos, automaticamente. 🚀
                                </Text>

                                <TouchableOpacity style={{ padding: 10 }} onPress={onClose}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>Fechar</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ─── PAGO ─── */}
                        {step === 'PAID' && (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View style={{ width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: '#34C75922', marginBottom: 15 }}>
                                    <MaterialCommunityIcons name="check-circle" size={44} color="#34C759" />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>
                                    PAGAMENTO CONFIRMADO!
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                                    Seu acesso está liberado. Bora treinar! 💪
                                </Text>
                                <TouchableOpacity
                                    style={{ width: '100%', padding: 18, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center' }}
                                    onPress={() => { if (onPaid) onPaid(); onClose(); }}
                                >
                                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>CONTINUAR</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ─── ERRO ─── */}
                        {step === 'ERROR' && (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#FF9500" style={{ marginBottom: 12 }} />
                                <Text style={{ color: theme.text, fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
                                    Ops, algo deu errado
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                                    {errorMsg}
                                </Text>
                                <TouchableOpacity
                                    style={{ width: '100%', padding: 16, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', marginBottom: 10 }}
                                    onPress={() => { setStep('LOADING'); fetchCheckout(); }}
                                >
                                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>TENTAR NOVAMENTE</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ padding: 10 }} onPress={onClose}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>Fechar</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
