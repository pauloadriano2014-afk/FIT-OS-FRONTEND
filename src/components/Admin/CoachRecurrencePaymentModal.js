// src/components/Admin/CoachRecurrencePaymentModal.js
// 💳 Ativa pagamento automático (cartão salvo) da mensalidade do COACH pra
// Paulo. Mesmo padrão visual/de passos do RecurrencePaymentModal.js (que faz
// isso pro aluno pagar o coach), mas falando com /api/payments/coach-recurrence/create.
import React, { useState, useEffect } from 'react';
import {
    View, Text, Modal, TouchableOpacity, TextInput,
    ActivityIndicator, ScrollView, Platform, Alert, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'https://fitos-final.onrender.com';

export default function CoachRecurrencePaymentModal({ visible, onClose, theme, coachId, billingPlan, onActivated }) {
    // LOADING | CPF | ADDRESS | REDIRECT | ALREADY_ACTIVE | ERROR
    const [step, setStep] = useState('LOADING');
    const [checkoutUrl, setCheckoutUrl] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [cpf, setCpf] = useState('');

    const [addrCep, setAddrCep] = useState('');
    const [addrRua, setAddrRua] = useState('');
    const [addrBairro, setAddrBairro] = useState('');
    const [addrNumero, setAddrNumero] = useState('');
    const [addrComplemento, setAddrComplemento] = useState('');
    const [addrLoadingCep, setAddrLoadingCep] = useState(false);

    const notify = (msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('', msg);
    };

    const openCheckoutUrl = (url) => {
        if (Platform.OS === 'web') window.open(url, '_blank');
        else Linking.openURL(url).catch(() => notify('Não foi possível abrir a página de pagamento.'));
    };

    const fetchRecurrence = async (overrides = {}) => {
        try {
            const res = await fetch(`${API_URL}/api/payments/coach-recurrence/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachId, billingPlan, ...overrides }),
            });
            const data = await res.json();

            if (data.needsCpf) { setStep('CPF'); return; }
            if (data.needsAddress) { setStep('ADDRESS'); return; }
            if (data.alreadyActive) { setStep('ALREADY_ACTIVE'); return; }
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Não foi possível preparar o pagamento automático.');
            }

            setCheckoutUrl(data.checkoutUrl);
            openCheckoutUrl(data.checkoutUrl);
            setStep('REDIRECT');
            if (onActivated) onActivated();
        } catch (err) {
            console.error('[CoachRecurrencePaymentModal] Erro:', err);
            setErrorMsg(err.message || 'Erro de conexão. Tente novamente.');
            setStep('ERROR');
        }
    };

    useEffect(() => {
        if (visible && coachId) {
            setStep('LOADING');
            setErrorMsg('');
            setCheckoutUrl(null);
            fetchRecurrence();
        }
    }, [visible, coachId]);

    const handleSubmitCpf = async () => {
        const digits = cpf.replace(/\D/g, '');
        if (digits.length !== 11 && digits.length !== 14) {
            notify('CPF inválido. Verifique os números.');
            return;
        }
        setIsSubmitting(true);
        setStep('LOADING');
        await fetchRecurrence({ cpf: digits });
        setIsSubmitting(false);
    };

    // Busca rua/bairro pelo CEP (ViaCEP, gratuito, sem chave)
    const lookupCep = async (rawValue) => {
        const digits = rawValue.replace(/\D/g, '').slice(0, 8);
        setAddrCep(digits);
        if (digits.length !== 8) return;
        setAddrLoadingCep(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
            const data = await res.json();
            if (!data.erro) {
                if (data.logradouro) setAddrRua(data.logradouro);
                if (data.bairro) setAddrBairro(data.bairro);
            }
        } catch (e) {
            // silencioso — coach preenche manualmente se a busca falhar
        } finally {
            setAddrLoadingCep(false);
        }
    };

    const handleSubmitAddress = async () => {
        const cepDigits = addrCep.replace(/\D/g, '');
        if (cepDigits.length !== 8) { notify('CEP inválido. Verifique os números.'); return; }
        if (!addrRua.trim() || !addrNumero.trim() || !addrBairro.trim()) {
            notify('Preencha rua, número e bairro.');
            return;
        }
        setIsSubmitting(true);
        setStep('LOADING');
        await fetchRecurrence({
            postalCode: cepDigits,
            address: addrRua.trim(),
            addressNumber: addrNumero.trim(),
            province: addrBairro.trim(),
            ...(addrComplemento.trim() ? { complement: addrComplemento.trim() } : {}),
        });
        setIsSubmitting(false);
    };

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
                                    Preparando pagamento automático...
                                </Text>
                            </View>
                        )}

                        {/* ─── CPF (uma vez só) ─── */}
                        {step === 'CPF' && (
                            <View style={{ alignItems: 'center' }}>
                                <View style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.accent + '22', marginBottom: 15 }}>
                                    <MaterialCommunityIcons name="card-account-details-outline" size={36} color={theme.accent} />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 10 }}>
                                    CONFIRME SEU CPF
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                                    Pra ativar o cartão salvo com segurança, precisamos do seu CPF.
                                    Você só faz isso <Text style={{ fontWeight: 'bold', color: theme.text }}>uma vez</Text>.
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

                        {/* ─── ENDEREÇO (uma vez só, exigido pela Asaas) ─── */}
                        {step === 'ADDRESS' && (
                            <View style={{ alignItems: 'center' }}>
                                <View style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.accent + '22', marginBottom: 15 }}>
                                    <MaterialCommunityIcons name="map-marker-outline" size={36} color={theme.accent} />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 10 }}>
                                    ENDEREÇO DE COBRANÇA
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                                    Exigido pra validar o pagamento recorrente com cartão. Só uma vez.
                                </Text>

                                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bg, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14, marginBottom: 12, height: 52 }}>
                                    <TextInput
                                        style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: '600' }}
                                        value={addrCep}
                                        onChangeText={lookupCep}
                                        keyboardType="numeric"
                                        maxLength={8}
                                        placeholder="CEP (somente números)"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                    {addrLoadingCep && <ActivityIndicator size="small" color={theme.accent} />}
                                </View>

                                <TextInput
                                    style={{ width: '100%', backgroundColor: theme.bg, color: theme.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, fontSize: 15, fontWeight: '600', marginBottom: 12 }}
                                    value={addrRua}
                                    onChangeText={setAddrRua}
                                    placeholder="Rua/Avenida"
                                    placeholderTextColor={theme.textSecondary}
                                />

                                <View style={{ width: '100%', flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                                    <TextInput
                                        style={{ flex: 1, backgroundColor: theme.bg, color: theme.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, fontSize: 15, fontWeight: '600' }}
                                        value={addrNumero}
                                        onChangeText={setAddrNumero}
                                        keyboardType="numeric"
                                        placeholder="Número"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                    <TextInput
                                        style={{ flex: 1, backgroundColor: theme.bg, color: theme.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, fontSize: 15, fontWeight: '600' }}
                                        value={addrComplemento}
                                        onChangeText={setAddrComplemento}
                                        placeholder="Complemento (opc.)"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>

                                <TextInput
                                    style={{ width: '100%', backgroundColor: theme.bg, color: theme.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, fontSize: 15, fontWeight: '600', marginBottom: 20 }}
                                    value={addrBairro}
                                    onChangeText={setAddrBairro}
                                    placeholder="Bairro"
                                    placeholderTextColor={theme.textSecondary}
                                />

                                <TouchableOpacity
                                    style={{ width: '100%', padding: 18, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}
                                    onPress={handleSubmitAddress}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? <ActivityIndicator color="#000" />
                                        : (<>
                                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>CONFIRMAR ENDEREÇO</Text>
                                            <MaterialCommunityIcons name="arrow-right" size={20} color="#000" style={{ marginLeft: 8 }} />
                                        </>)
                                    }
                                </TouchableOpacity>
                                <TouchableOpacity style={{ padding: 10 }} onPress={onClose}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ─── REDIRECIONADO PRA ASAAS ─── */}
                        {step === 'REDIRECT' && (
                            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                                <View style={{ width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.accent + '22', marginBottom: 15 }}>
                                    <MaterialCommunityIcons name="credit-card-check-outline" size={40} color={theme.accent} />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>
                                    QUASE LÁ!
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                                    Abrimos a página segura da Asaas pra você cadastrar o cartão.
                                    Depois de confirmar lá, sua mensalidade libera automaticamente.
                                </Text>
                                {checkoutUrl && (
                                    <TouchableOpacity
                                        style={{ width: '100%', padding: 16, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}
                                        onPress={() => openCheckoutUrl(checkoutUrl)}
                                    >
                                        <MaterialCommunityIcons name="open-in-new" size={18} color="#000" />
                                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5, marginLeft: 8 }}>
                                            ABRIR PÁGINA DE NOVO
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={{ padding: 10 }} onPress={onClose}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>Fechar</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ─── JÁ ATIVO ─── */}
                        {step === 'ALREADY_ACTIVE' && (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View style={{ width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: '#34C75922', marginBottom: 15 }}>
                                    <MaterialCommunityIcons name="check-circle" size={44} color="#34C759" />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>
                                    JÁ ESTÁ ATIVO!
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                                    Seu pagamento automático já está ativado. Se algo parecer errado, fale com o suporte.
                                </Text>
                                <TouchableOpacity
                                    style={{ width: '100%', padding: 18, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center' }}
                                    onPress={onClose}
                                >
                                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>FECHAR</Text>
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
                                    onPress={() => { setStep('LOADING'); fetchRecurrence(); }}
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
