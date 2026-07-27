// src/screens/DesafioInscricaoScreen.js
//
// Página pública de inscrição no Desafio (ex: "Desafio 90 Dias"). Fluxo:
// 1. Busca os dados do desafio pelo slug (?desafio=slug na URL)
// 2. Explica o processo, o que a aluna recebe, tira dúvidas (FAQ)
// 3. Formulário: nome, data de nascimento, email, telefone, CPF
// 4. Gera cobrança PIX via backend (Asaas)
// 5. Fica consultando o status a cada 5s
// 6. Assim que o pagamento é confirmado, a tela detecta e libera o link
//    do grupo automaticamente — sem nenhuma ação manual do coach.

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Platform, SafeAreaView, ActivityIndicator, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import FaqAccordion from '../components/FaqAccordion';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

const API_BASE = 'https://fitos-final.onrender.com';

// 🟣 Paleta Roxo/Lilás
const MAIN_COLOR = '#8B5CF6';   // violeta principal
const LIGHT_COLOR = '#C4B5FD';  // lilás claro (acentos)
const DARK_COLOR = '#6D28D9';   // roxo escuro (gradiente)

// ── FAQ genérico — aplica a qualquer desafio por WhatsApp ────────────────
const faqList = [
    { q: 'Como eu recebo o conteúdo do desafio?', a: 'Direto no grupo do WhatsApp. Assim que a gente confirma o seu pagamento, o link é liberado automaticamente nesta página — você entra e já começa a receber o conteúdo.' },
    { q: 'É acompanhamento individual ou em grupo?', a: 'É uma experiência em grupo: todo mundo recebe o mesmo conteúdo, na mesma comunidade, se motivando e trocando experiências junto.' },
    { q: 'Preciso de equipamento específico?', a: 'Não necessariamente. O conteúdo é pensado pra funcionar com o que você já tem disponível no seu dia a dia.' },
    { q: 'Quando o desafio começa pra mim?', a: 'Assim que você entra no grupo. A partir daí, você acompanha tudo que for postado dali em diante.' },
    { q: 'O pagamento é seguro?', a: 'Sim. O PIX é processado por um parceiro de pagamentos homologado — seus dados não ficam expostos nem armazenados na página.' },
];

// ── Fallback caso o desafio não tenha benefícios customizados cadastrados ─
const BENEFICIOS_PADRAO = [
    'Mensagens diárias de motivação direto no seu WhatsApp',
    'Dicas práticas de rotina, alimentação e mentalidade',
    'Comunidade de apoio — você não passa por isso sozinha',
    'Conteúdo pensado pra caber na sua vida real, sem complicação',
];

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
    return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

    const scrollToFormRef = useRef(null);
    const scrollToForm = () => {
        // No RN Web isso desce a página até o formulário; em nativo o botão
        // já leva pro final da ScrollView de forma suave o bastante.
        scrollToFormRef.current?.scrollIntoView?.({ behavior: 'smooth' });
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

    const beneficios = desafio.beneficios?.length ? desafio.beneficios : BENEFICIOS_PADRAO;

    // Reconstrói os pares antes/depois a partir dos arrays flat (mesmo
    // formato salvo pelo admin). Só considera pares com as DUAS fotos.
    const galleryPhotos = desafio.galleryPhotos || [];
    const galleryTexts = desafio.galleryTexts || [];
    const galleryPairs = [0, 1, 2, 3]
        .map(i => ({
            before: galleryPhotos[i * 2] || '',
            after: galleryPhotos[i * 2 + 1] || '',
            text: galleryTexts[i] || '',
        }))
        .filter(p => p.before && p.after);

    const duracaoDias = desafio.duracaoDias || 90;
    const precoPorDia = desafio.valor / duracaoDias;

    return (
        <RootComponent style={styles.container}>
            {previewBackButton}
            <View style={styles.webWrapper}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {step === 'form' && (
                        <>
                            {/* ── HERO ──────────────────────────────────────────── */}
                            <View style={styles.heroSection}>
                                {desafio.logoUrl ? (
                                    <Image source={{ uri: desafio.logoUrl }} style={styles.heroLogoImg} resizeMode="contain" />
                                ) : (
                                    <View style={styles.heroIconBox}>
                                        <MaterialCommunityIcons name="whatsapp" size={32} color={MAIN_COLOR} />
                                    </View>
                                )}
                                <Text style={styles.heroTitle}>{desafio.nome}</Text>
                                {desafio.descricao ? <Text style={styles.heroDesc}>{desafio.descricao}</Text> : null}
                                <View style={styles.valorBadge}>
                                    <Text style={styles.valorBadgeText}>R$ {formatBRL(desafio.valor)}</Text>
                                </View>

                                <TouchableOpacity onPress={scrollToForm} activeOpacity={0.85} style={{ width: '100%' }}>
                                    <LinearGradient colors={[MAIN_COLOR, DARK_COLOR]} style={styles.heroCta}>
                                        <Text style={styles.heroCtaText}>QUERO GARANTIR MINHA VAGA</Text>
                                        <MaterialCommunityIcons name="arrow-down" size={16} color="#FFF" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* ── MENTOR / AUTORIDADE (dinâmico — só aparece se preenchido no admin) ── */}
                            {desafio.mentorNome ? (
                                <View style={styles.mentorBox}>
                                    <View style={styles.mentorIconRow}>
                                        <MaterialCommunityIcons name="card-account-details-star-outline" size={22} color={MAIN_COLOR} />
                                        <Text style={styles.mentorLabel}>QUEM CONDUZ ESSE DESAFIO</Text>
                                    </View>
                                    <View style={styles.mentorHeaderRow}>
                                        <View style={styles.mentorPhotoBox}>
                                            {desafio.mentorFotoUrl
                                                ? <Image source={{ uri: desafio.mentorFotoUrl }} style={styles.mentorPhoto} />
                                                : <MaterialCommunityIcons name="account" size={28} color={MAIN_COLOR} />
                                            }
                                        </View>
                                        <Text style={styles.mentorName}>{desafio.mentorNome}</Text>
                                    </View>
                                    {desafio.mentorTexto ? (
                                        <Text style={styles.mentorDesc}>{desafio.mentorTexto}</Text>
                                    ) : null}
                                </View>
                            ) : null}

                            {/* ── 💜 O QUE VOCÊ TERÁ ACESSO ─────────────────────── */}
                            <Text style={[styles.sectionTitle, { marginTop: 40 }]}>💜 O QUE VOCÊ TERÁ ACESSO</Text>
                            <View style={styles.beneficiosBox}>
                                {beneficios.map((item, i) => (
                                    <View key={i} style={styles.beneficioRow}>
                                        <MaterialCommunityIcons name="check-circle" size={18} color={MAIN_COLOR} style={{ marginTop: 2 }} />
                                        <Text style={styles.beneficioText}>{item}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* ── 🎯 PARA QUEM É (opcional) ─────────────────────── */}
                            {desafio.paraQuemE?.length > 0 && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: 40 }]}>🎯 ESSE PROJETO É PARA VOCÊ QUE...</Text>
                                    <View style={styles.beneficiosBox}>
                                        {desafio.paraQuemE.map((item, i) => (
                                            <View key={i} style={styles.beneficioRow}>
                                                <MaterialCommunityIcons name="arrow-right-circle" size={18} color={MAIN_COLOR} style={{ marginTop: 2 }} />
                                                <Text style={styles.beneficioText}>{item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* ── ⚠️ IMPORTANTE (opcional — visual de aviso, destacado) ── */}
                            {desafio.importante ? (
                                <View style={styles.importanteBox}>
                                    <View style={styles.importanteHeaderRow}>
                                        <MaterialCommunityIcons name="alert-outline" size={20} color="#FFB800" />
                                        <Text style={styles.importanteLabel}>IMPORTANTE</Text>
                                    </View>
                                    <Text style={styles.importanteText}>{desafio.importante}</Text>
                                </View>
                            ) : null}

                            {/* ── 💬 MEU COMPROMISSO (opcional) ─────────────────── */}
                            {desafio.compromissoTexto ? (
                                <View style={styles.compromissoBox}>
                                    <Text style={styles.compromissoLabel}>💬 MEU COMPROMISSO</Text>
                                    <Text style={styles.compromissoText}>{desafio.compromissoTexto}</Text>
                                </View>
                            ) : null}

                            {/* ── ANTES E DEPOIS (só aparece se houver pelo menos 1 par completo) ──
                                Layout idêntico ao usado na SaaSPropostaScreen (página pública dos
                                coaches parceiros): pilha vertical de cards, rótulo ANTES/DEPOIS
                                acima da foto, legenda entre aspas. */}
                            {galleryPairs.length > 0 && (
                                <View style={styles.galleryOuterCard}>
                                    <Text style={styles.gallerySectionTitle}>RESULTADOS DOS ALUNOS</Text>
                                    <View style={{ gap: 25 }}>
                                        {galleryPairs.map((pair, i) => (
                                            <View key={i} style={styles.galleryPairCardPublic}>
                                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: pair.text ? 15 : 0 }}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.galleryLabelAntes}>ANTES</Text>
                                                        <View style={styles.galleryImgBoxPlain}>
                                                            <Image source={{ uri: pair.before }} style={styles.galleryImgPlain} />
                                                        </View>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.galleryLabelDepois}>DEPOIS</Text>
                                                        <View style={[styles.galleryImgBoxPlain, { borderWidth: 2, borderColor: MAIN_COLOR }]}>
                                                            <Image source={{ uri: pair.after }} style={styles.galleryImgPlain} />
                                                        </View>
                                                    </View>
                                                </View>
                                                {pair.text ? <Text style={styles.galleryCaptionQuote}>"{pair.text}"</Text> : null}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* ── COMO FUNCIONA (perto do form, reforça a mecânica antes de pagar) ── */}
                            <Text style={[styles.sectionTitle, { marginTop: 40 }]}>COMO FUNCIONA</Text>
                            <Text style={styles.sectionSub}>Do pagamento até o primeiro conteúdo no seu WhatsApp — sem espera, sem burocracia.</Text>

                            <View style={styles.stepsContainer}>
                                <View style={styles.stepRow}>
                                    <View style={styles.stepIconBox}><Text style={styles.stepNumber}>1</Text></View>
                                    <View style={styles.stepTextBox}>
                                        <Text style={styles.stepTitle}>Você se inscreve e paga com PIX</Text>
                                        <Text style={styles.stepDesc}>Preenche seus dados aqui embaixo e paga na hora — rápido e seguro.</Text>
                                    </View>
                                </View>
                                <View style={styles.stepRow}>
                                    <View style={styles.stepIconBox}><Text style={styles.stepNumber}>2</Text></View>
                                    <View style={styles.stepTextBox}>
                                        <Text style={styles.stepTitle}>O pagamento é confirmado automaticamente</Text>
                                        <Text style={styles.stepDesc}>Assim que o PIX cai, esta mesma página já detecta a confirmação — sem você precisar avisar ninguém.</Text>
                                    </View>
                                </View>
                                <View style={styles.stepRow}>
                                    <View style={styles.stepIconBox}><Text style={styles.stepNumber}>3</Text></View>
                                    <View style={styles.stepTextBox}>
                                        <Text style={styles.stepTitle}>O link do grupo é liberado na hora</Text>
                                        <Text style={styles.stepDesc}>Aparece um botão pra você entrar direto no grupo do WhatsApp, sem esperar resposta de ninguém.</Text>
                                    </View>
                                </View>
                                <View style={[styles.stepRow, { marginBottom: 0 }]}>
                                    <View style={styles.stepIconBox}><Text style={styles.stepNumber}>4</Text></View>
                                    <View style={styles.stepTextBox}>
                                        <Text style={styles.stepTitle}>Você começa a receber o conteúdo</Text>
                                        <Text style={styles.stepDesc}>Motivação, dicas e rotina direto no grupo, junto com quem está na mesma jornada.</Text>
                                    </View>
                                </View>
                            </View>

                            {/* ── FAQ ────────────────────────────────────────────── */}
                            <Text style={[styles.sectionTitle, { marginTop: 40, marginBottom: 20 }]}>AINDA TEM DÚVIDAS?</Text>
                            <FaqAccordion faqs={faqList} accentColor={MAIN_COLOR} />

                            {/* ── 🎁 BÔNUS EXCLUSIVO (opcional, perto do fim) ────── */}
                            {desafio.bonusTexto ? (
                                <View style={styles.bonusBox}>
                                    <Text style={styles.bonusLabel}>🎁 BÔNUS EXCLUSIVO</Text>
                                    <Text style={styles.bonusText}>{desafio.bonusTexto}</Text>
                                </View>
                            ) : null}
                        </>
                    )}

                    {/* ── 💰 INVESTIMENTO + STEP: FORM (dados) ───────────────── */}
                    {step === 'form' && (
                        <View
                            style={{ marginTop: 40 }}
                            ref={(r) => { scrollToFormRef.current = r; }}
                        >
                            <Text style={styles.sectionTitle}>💰 INVESTIMENTO</Text>
                            <View style={styles.investimentoBox}>
                                <Text style={styles.investimentoValor}>R$ {formatBRL(desafio.valor)}</Text>
                                <Text style={styles.investimentoSub}>para participar dos {duracaoDias} dias</Text>
                                <Text style={styles.investimentoPorDia}>
                                    Menos de R$ {formatBRL(precoPorDia)} por dia pra viver essa experiência.
                                </Text>
                            </View>

                            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>GARANTA SUA VAGA</Text>
                            <Text style={styles.sectionSub}>Preencha seus dados abaixo pra gerar o PIX e começar.</Text>

                            <View style={styles.formCard}>
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

                                <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                                    <LinearGradient colors={[MAIN_COLOR, DARK_COLOR]} style={[styles.submitBtn, submitting && { opacity: 0.6 }]}>
                                        {submitting
                                            ? <ActivityIndicator color="#FFF" size="small" />
                                            : <Text style={styles.submitBtnText}>GERAR PIX E GARANTIR MINHA VAGA</Text>
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>

                                <Text style={styles.urgencyNote}>
                                    ⚠️ As inscrições serão encerradas assim que o grupo atingir o limite de participantes.
                                </Text>

                                <View style={styles.securityRow}>
                                    <MaterialCommunityIcons name="lock-outline" size={13} color="#666" />
                                    <Text style={styles.securityText}>Pagamento processado com segurança via PIX</Text>
                                </View>
                            </View>
                        </View>
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

                            <TouchableOpacity onPress={handleEntrarGrupo} activeOpacity={0.85}>
                                <LinearGradient colors={[MAIN_COLOR, DARK_COLOR]} style={styles.entrarGrupoBtn}>
                                    <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
                                    <Text style={styles.submitBtnText}>ENTRAR NO GRUPO DO WHATSAPP</Text>
                                </LinearGradient>
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

    webWrapper: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
    scrollContent: { flexGrow: 1, padding: 25, paddingBottom: 60 },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    notFoundTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 16, letterSpacing: 0.5 },
    notFoundDesc: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8 },

    // ── Hero
    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    heroIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${MAIN_COLOR}15`, borderWidth: 1, borderColor: `${MAIN_COLOR}40`, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    heroLogoImg: { width: '100%', height: 110, marginBottom: 16 },
    heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    heroDesc: { color: '#AAA', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 18, paddingHorizontal: 6 },
    valorBadge: { backgroundColor: `${MAIN_COLOR}15`, borderWidth: 1, borderColor: MAIN_COLOR, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, marginBottom: 24 },
    valorBadgeText: { color: LIGHT_COLOR, fontSize: 18, fontWeight: '900' },
    heroCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
    heroCtaText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

    // ── Seções
    sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3, marginBottom: 6 },
    sectionSub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10, lineHeight: 19 },

    // ── Como funciona
    stepsContainer: { backgroundColor: '#141118', borderRadius: 20, borderWidth: 1, borderColor: `${MAIN_COLOR}25`, padding: 20 },
    stepRow: { flexDirection: 'row', gap: 14, marginBottom: 22 },
    stepIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${MAIN_COLOR}20`, borderWidth: 1, borderColor: MAIN_COLOR, justifyContent: 'center', alignItems: 'center' },
    stepNumber: { color: LIGHT_COLOR, fontWeight: '900', fontSize: 13 },
    stepTextBox: { flex: 1 },
    stepTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', marginBottom: 4 },
    stepDesc: { color: '#999', fontSize: 12, lineHeight: 18 },

    // ── Benefícios
    beneficiosBox: { backgroundColor: '#141118', borderRadius: 20, borderWidth: 1, borderColor: `${MAIN_COLOR}25`, padding: 20, gap: 14 },
    beneficioRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    beneficioText: { flex: 1, color: '#CCC', fontSize: 14, lineHeight: 20 },

    // ── Mentor
    mentorBox: { backgroundColor: '#141118', borderRadius: 20, borderWidth: 1, borderColor: `${MAIN_COLOR}25`, padding: 22, marginTop: 40 },
    mentorIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    mentorLabel: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    mentorHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    mentorPhotoBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: `${MAIN_COLOR}15`, borderWidth: 1, borderColor: `${MAIN_COLOR}40`, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    mentorPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
    mentorName: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    mentorDesc: { color: '#BBB', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

    // ── Importante (aviso, tom âmbar mesmo na página roxa — chama atenção de verdade)
    importanteBox: { backgroundColor: '#FFB80012', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: '#FFB800', padding: 18, marginTop: 30 },
    importanteHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    importanteLabel: { color: '#FFB800', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    importanteText: { color: '#DDD', fontSize: 13, lineHeight: 20 },

    // ── Meu compromisso
    compromissoBox: { backgroundColor: '#141118', borderRadius: 16, borderWidth: 1, borderColor: `${MAIN_COLOR}25`, padding: 18, marginTop: 30 },
    compromissoLabel: { color: MAIN_COLOR, fontSize: 12, fontWeight: '900', letterSpacing: 0.5, marginBottom: 8 },
    compromissoText: { color: '#CCC', fontSize: 14, lineHeight: 21 },

    // ── Bônus exclusivo
    bonusBox: { backgroundColor: `${MAIN_COLOR}12`, borderRadius: 16, borderWidth: 1, borderColor: `${MAIN_COLOR}40`, padding: 18, marginTop: 30 },
    bonusLabel: { color: LIGHT_COLOR, fontSize: 12, fontWeight: '900', letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' },
    bonusText: { color: '#EEE', fontSize: 14, lineHeight: 21, textAlign: 'center' },

    // ── Investimento (reforço de preço logo antes do form)
    investimentoBox: { backgroundColor: '#141118', borderRadius: 20, borderWidth: 1, borderColor: `${MAIN_COLOR}30`, padding: 24, alignItems: 'center', marginBottom: 30 },
    investimentoValor: { color: '#FFF', fontSize: 34, fontWeight: '900' },
    investimentoSub: { color: '#999', fontSize: 13, marginTop: 4 },
    investimentoPorDia: { color: LIGHT_COLOR, fontSize: 13, fontWeight: '700', marginTop: 14, textAlign: 'center' },

    urgencyNote: { color: '#FFB800', fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 16 },

    // ── Galeria de antes/depois
    galleryOuterCard: { backgroundColor: '#141118', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: `${MAIN_COLOR}25`, marginTop: 40 },
    gallerySectionTitle: { color: MAIN_COLOR, fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 18, textAlign: 'center' },
    galleryPairCardPublic: { backgroundColor: '#161616', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#222' },
    galleryLabelAntes: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
    galleryLabelDepois: { color: MAIN_COLOR, fontSize: 10, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
    galleryImgBoxPlain: { width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
    galleryImgPlain: { width: '100%', height: '100%', resizeMode: 'cover' },
    galleryCaptionQuote: { color: '#CCC', fontSize: 14, fontStyle: 'italic', textAlign: 'center' },

    // ── Formulário
    formCard: { backgroundColor: '#161616', borderRadius: 24, borderWidth: 1, borderColor: '#2A2A2A', padding: 24 },
    formTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', marginBottom: 20 },

    inputLabel: { color: '#888', fontSize: 11, fontWeight: '900', letterSpacing: 0.3, marginBottom: 6, marginTop: 14 },
    input: { backgroundColor: '#0a0a0a', color: '#FFF', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 14, fontSize: 14 },
    cpfHelper: { color: '#666', fontSize: 10, fontStyle: 'italic', marginTop: 4 },

    formErrorText: { color: '#FF3B30', fontSize: 12, fontWeight: '700', marginTop: 16, textAlign: 'center' },

    submitBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

    securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
    securityText: { color: '#666', fontSize: 10 },

    pixHelper: { color: '#AAA', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    pixImage: { width: 220, height: 220, alignSelf: 'center', borderRadius: 12, backgroundColor: '#FFF', marginBottom: 20 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: MAIN_COLOR, borderRadius: 14, paddingVertical: 14, marginBottom: 20 },
    copyBtnText: { color: LIGHT_COLOR, fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },

    waitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    waitingText: { color: '#888', fontSize: 12, fontStyle: 'italic' },

    entrarGrupoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 16 },

    footer: { marginTop: 40, alignItems: 'center' },
    footerText: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});