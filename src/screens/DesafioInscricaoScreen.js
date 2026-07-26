// src/screens/DesafioInscricaoScreen.js
//
// Página pública de inscrição no Desafio (ex: "Desafio 90 Dias"). Fluxo:
// 1. Busca os dados do desafio pelo slug (?desafio=slug na URL)
// 2. Formulário simples: nome, data de nascimento, email, telefone, CPF
// 3. Gera cobrança PIX via backend (Asaas)
// 4. Fica consultando o status a cada 5s
// 5. Assim que o pagamento é confirmado (webhook da Asaas atualiza o
//    backend), a tela detecta e libera o link do grupo automaticamente —
//    sem nenhuma ação manual do coach.

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Platform, SafeAreaView, ActivityIndicator, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

const API_BASE = 'https://fitos-final.onrender.com';
const MAIN_COLOR = '#4DE38F';

// ── Helpers ──────────────────────────────────────────────────────────────
function onlyDigits(v) { return (v || '').replace(/\D/g, ''); }

function formatCPF(v) {
    const d = onlyDigits(v).slice(0, 11);
    return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatTelefone(v) {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 10) {
        return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

function formatDataNascimento(v) {
    const d = onlyDigits(v).slice(0, 8);
    return d
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2');
}

function dataNascimentoParaISO(ddmmaaaa) {
    const [dia, mes, ano] = ddmmaaaa.split('/');
    if (!dia || !mes || !ano || ano.length !== 4) return null;
    return `${ano}-${mes}-${dia}`;
}

function formatBRL(v) {
    return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export default function DesafioInscricaoScreen({ route, navigation }) {
    const slug = route?.params?.desafio?.trim() || '';
    const isPreview = ['true', true].includes(route?.params?.preview);

    const handlePreviewBack = () => {
        if (navigation?.canGoBack?.()) {
            navigation.goBack();
        } else if (navigation?.navigate) {
            navigation.navigate('AdminDashboard');
        }
    };

    const [desafio, setDesafio] = useState(null);
    const [loadingDesafio, setLoadingDesafio] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // step: 'form' | 'pagamento' | 'sucesso'
    const [step, setStep] = useState('form');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const [nome, setNome] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [cpf, setCpf] = useState('');

    const [inscricaoId, setInscricaoId] = useState(null);
    const [pixQrCode, setPixQrCode] = useState(null);
    const [pixCopyPaste, setPixCopyPaste] = useState(null);
    const [copiado, setCopiado] = useState(false);
    const [linkGrupo, setLinkGrupo] = useState(null);

    const pollingRef = useRef(null);

    // ── Busca os dados do desafio pelo slug ──────────────────────────────
    useEffect(() => {
        if (!slug) { setNotFound(true); setLoadingDesafio(false); return; }
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/desafios?slug=${encodeURIComponent(slug)}`);
                if (!res.ok) { setNotFound(true); return; }
                const data = await res.json();
                if (!data?.desafio) { setNotFound(true); return; }
                setDesafio(data.desafio);
            } catch (e) {
                console.log('Erro ao buscar desafio', e);
                setNotFound(true);
            } finally {
                setLoadingDesafio(false);
            }
        })();
    }, [slug]);

    // ── Polling de status enquanto aguarda pagamento ─────────────────────
    useEffect(() => {
        if (step !== 'pagamento' || !inscricaoId) return;

        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/api/desafios/inscricao/${inscricaoId}/status`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.status === 'PAGO') {
                    clearInterval(pollingRef.current);
                    setLinkGrupo(data.linkGrupoWhats);
                    setStep('sucesso');
                }
            } catch (e) {
                console.log('Erro ao consultar status', e);
            }
        }, 5000);

        return () => clearInterval(pollingRef.current);
    }, [step, inscricaoId]);

    // ── Envio do formulário → gera PIX ───────────────────────────────────
    const handleSubmit = async () => {
        setFormError('');

        if (!nome.trim()) return setFormError('Preencha seu nome completo.');
        if (dataNascimento.length !== 10) return setFormError('Preencha a data de nascimento (DD/MM/AAAA).');
        if (!email.includes('@') || !email.includes('.')) return setFormError('E-mail inválido.');
        if (onlyDigits(telefone).length < 10) return setFormError('Telefone inválido.');
        if (onlyDigits(cpf).length !== 11) return setFormError('CPF inválido.');

        const isoData = dataNascimentoParaISO(dataNascimento);
        if (!isoData) return setFormError('Data de nascimento inválida.');

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/desafios/inscrever`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    desafioId: desafio.id,
                    nome: nome.trim(),
                    dataNascimento: isoData,
                    email: email.trim(),
                    telefone: onlyDigits(telefone),
                    cpf: onlyDigits(cpf),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setFormError(data?.error || 'Não foi possível gerar o pagamento. Tente novamente.');
                return;
            }
            setInscricaoId(data.inscricaoId);
            setPixQrCode(data.pixQrCode);
            setPixCopyPaste(data.pixCopyPaste);
            setStep('pagamento');
        } catch (e) {
            console.log('Erro ao inscrever', e);
            setFormError('Erro de conexão. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyPix = async () => {
        if (!pixCopyPaste) return;
        await Clipboard.setStringAsync(pixCopyPaste);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
    };

    const handleEntrarGrupo = () => {
        if (linkGrupo) Linking.openURL(linkGrupo);
    };

    // ── Botão flutuante de voltar (só em modo preview, aberto pelo admin) ─
    const previewBackButton = isPreview ? (
        <TouchableOpacity style={styles.previewBackBtn} onPress={handlePreviewBack} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#FFF" />
            <Text style={styles.previewBackBtnText}>VOLTAR AO ADMIN</Text>
        </TouchableOpacity>
    ) : null;

    // ── Estados de carregamento / erro ───────────────────────────────────
    if (loadingDesafio) {
        return (
            <RootComponent style={styles.container}>
                {previewBackButton}
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={MAIN_COLOR} />
                </View>
            </RootComponent>
        );
    }

    if (notFound || !desafio) {
        return (
            <RootComponent style={styles.container}>
                {previewBackButton}
                <View style={styles.centerBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#FF3B30" />
                    <Text style={styles.notFoundTitle}>DESAFIO NÃO ENCONTRADO</Text>
                    <Text style={styles.notFoundDesc}>Esse link pode ter expirado ou não existe mais.</Text>
                </View>
            </RootComponent>
        );
    }

    return (
        <RootComponent style={styles.container}>
            {previewBackButton}
            <View style={styles.webWrapper}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* ── STEP: FORM ─────────────────────────────────────────── */}
                    {step === 'form' && (
                        <>
                            <View style={styles.heroSection}>
                                <MaterialCommunityIcons name="whatsapp" size={40} color={MAIN_COLOR} />
                                <Text style={styles.heroTitle}>{desafio.nome}</Text>
                                {desafio.descricao ? <Text style={styles.heroDesc}>{desafio.descricao}</Text> : null}
                                <View style={styles.valorBadge}>
                                    <Text style={styles.valorBadgeText}>R$ {formatBRL(desafio.valor)}</Text>
                                </View>
                            </View>

                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>SEUS DADOS</Text>

                                <Text style={styles.inputLabel}>Nome completo</Text>
                                <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome completo" placeholderTextColor="#666" />

                                <Text style={styles.inputLabel}>Data de nascimento</Text>
                                <TextInput style={styles.input} value={dataNascimento} onChangeText={(v) => setDataNascimento(formatDataNascimento(v))} placeholder="DD/MM/AAAA" placeholderTextColor="#666" keyboardType="numeric" maxLength={10} />

                                <Text style={styles.inputLabel}>E-mail</Text>
                                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" />

                                <Text style={styles.inputLabel}>Telefone (WhatsApp)</Text>
                                <TextInput style={styles.input} value={telefone} onChangeText={(v) => setTelefone(formatTelefone(v))} placeholder="(41) 99999-9999" placeholderTextColor="#666" keyboardType="phone-pad" maxLength={15} />

                                <Text style={styles.inputLabel}>CPF</Text>
                                <TextInput style={styles.input} value={cpf} onChangeText={(v) => setCpf(formatCPF(v))} placeholder="000.000.000-00" placeholderTextColor="#666" keyboardType="numeric" maxLength={14} />
                                <Text style={styles.cpfHelper}>Exigido pra emitir a cobrança PIX.</Text>

                                {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

                                <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
                                    {submitting
                                        ? <ActivityIndicator color="#000" size="small" />
                                        : <Text style={styles.submitBtnText}>GERAR PIX E GARANTIR MINHA VAGA</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* ── STEP: PAGAMENTO (PIX) ──────────────────────────────── */}
                    {step === 'pagamento' && (
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>PAGUE COM PIX PRA CONFIRMAR</Text>
                            <Text style={styles.pixHelper}>
                                Escaneie o QR Code ou copie o código abaixo no app do seu banco.
                                Assim que o pagamento cair, essa página libera o link do grupo automaticamente.
                            </Text>

                            {pixQrCode ? (
                                <Image
                                    source={{ uri: pixQrCode.startsWith('data:') ? pixQrCode : `data:image/png;base64,${pixQrCode}` }}
                                    style={styles.pixImage}
                                />
                            ) : null}

                            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyPix}>
                                <MaterialCommunityIcons name={copiado ? 'check' : 'content-copy'} size={16} color={MAIN_COLOR} />
                                <Text style={styles.copyBtnText}>{copiado ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}</Text>
                            </TouchableOpacity>

                            <View style={styles.waitingRow}>
                                <ActivityIndicator size="small" color={MAIN_COLOR} />
                                <Text style={styles.waitingText}>Aguardando confirmação do pagamento...</Text>
                            </View>
                        </View>
                    )}

                    {/* ── STEP: SUCESSO ──────────────────────────────────────── */}
                    {step === 'sucesso' && (
                        <View style={styles.formCard}>
                            <MaterialCommunityIcons name="check-circle" size={56} color={MAIN_COLOR} style={{ alignSelf: 'center', marginBottom: 16 }} />
                            <Text style={styles.formTitle}>PAGAMENTO CONFIRMADO! 🎉</Text>
                            <Text style={styles.pixHelper}>
                                Sua vaga no {desafio.nome} está garantida. Toque no botão abaixo pra entrar
                                no grupo do WhatsApp e começar.
                            </Text>

                            <TouchableOpacity style={styles.entrarGrupoBtn} onPress={handleEntrarGrupo}>
                                <MaterialCommunityIcons name="whatsapp" size={20} color="#000" />
                                <Text style={styles.submitBtnText}>ENTRAR NO GRUPO DO WHATSAPP</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>PAULO ADRIANO TEAM © 2026</Text>
                    </View>
                </ScrollView>
            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { height: isWeb ? '100vh' : '100%', backgroundColor: '#0a0a0a' },
    previewBackBtn: {
        position: 'absolute', top: isWeb ? 16 : 55, left: 16, zIndex: 999,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 10, paddingHorizontal: 16,
        borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    previewBackBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    webWrapper: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
    scrollContent: { flexGrow: 1, padding: 25, paddingBottom: 60 },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    notFoundTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 16, letterSpacing: 0.5 },
    notFoundDesc: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8 },

    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
    heroTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center', marginTop: 12, marginBottom: 10 },
    heroDesc: { color: '#AAA', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 16, paddingHorizontal: 6 },
    valorBadge: { backgroundColor: `${MAIN_COLOR}15`, borderWidth: 1, borderColor: MAIN_COLOR, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
    valorBadgeText: { color: MAIN_COLOR, fontSize: 18, fontWeight: '900' },

    formCard: { backgroundColor: '#161616', borderRadius: 24, borderWidth: 1, borderColor: '#2A2A2A', padding: 24 },
    formTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', marginBottom: 20 },

    inputLabel: { color: '#888', fontSize: 11, fontWeight: '900', letterSpacing: 0.3, marginBottom: 6, marginTop: 14 },
    input: { backgroundColor: '#0a0a0a', color: '#FFF', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 14, fontSize: 14 },
    cpfHelper: { color: '#666', fontSize: 10, fontStyle: 'italic', marginTop: 4 },

    formErrorText: { color: '#FF3B30', fontSize: 12, fontWeight: '700', marginTop: 16, textAlign: 'center' },

    submitBtn: { backgroundColor: MAIN_COLOR, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    submitBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

    pixHelper: { color: '#AAA', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    pixImage: { width: 220, height: 220, alignSelf: 'center', borderRadius: 12, backgroundColor: '#FFF', marginBottom: 20 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: MAIN_COLOR, borderRadius: 14, paddingVertical: 14, marginBottom: 20 },
    copyBtnText: { color: MAIN_COLOR, fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },

    waitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    waitingText: { color: '#888', fontSize: 12, fontStyle: 'italic' },

    entrarGrupoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: MAIN_COLOR, borderRadius: 16, paddingVertical: 16 },

    footer: { marginTop: 40, alignItems: 'center' },
    footerText: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});