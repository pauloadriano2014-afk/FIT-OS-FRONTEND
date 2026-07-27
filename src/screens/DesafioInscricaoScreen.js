// src/screens/DesafioInscricaoScreen.js
// Página pública de inscrição no Desafio (Layout Compacto, Moderno e Responsivo)

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Platform, SafeAreaView, ActivityIndicator, Linking, useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import FaqAccordion from '../components/FaqAccordion';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

const API_BASE = 'https://fitos-final.onrender.com';

const MAIN_COLOR = '#8B5CF6';   
const LIGHT_COLOR = '#C4B5FD';  
const DARK_COLOR = '#6D28D9';   

const faqList = [
    { q: 'Como eu recebo o conteúdo do desafio?', a: 'Direto no grupo do WhatsApp. Assim que a gente confirma o seu pagamento, o link é liberado automaticamente nesta página — você entra e já começa a receber o conteúdo.' },
    { q: 'É acompanhamento individual ou em grupo?', a: 'É uma experiência em grupo: todo mundo recebe o mesmo conteúdo, na mesma comunidade, se motivando e trocando experiências junto.' },
    { q: 'Preciso de equipamento específico?', a: 'Não necessariamente. O conteúdo é pensado pra funcionar com o que você já tem disponível no seu dia a dia.' },
    { q: 'Quando o desafio começa pra mim?', a: 'Assim que você entra no grupo. A partir daí, você acompanha tudo que for postado dali em diante.' },
    { q: 'O pagamento é seguro?', a: 'Sim. O PIX é processado por um parceiro de pagamentos homologado — seus dados não ficam expostos nem armazenados na página.' },
];

const BENEFICIOS_PADRAO = [
    'Mensagens diárias de motivação direto no seu WhatsApp',
    'Dicas práticas de rotina, alimentação e mentalidade',
    'Comunidade de apoio — você não passa por isso sozinha',
    'Conteúdo pensado pra caber na sua vida real, sem complicação',
];

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
    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = isWeb && windowWidth > 850;

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
    const scrollViewRef = useRef(null);

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
                    if (isWeb) window.scrollTo({ top: 0, behavior: 'smooth' });
                    else scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                }
            } catch (e) {
                console.log('Erro ao consultar status', e);
            }
        }, 5000);

        return () => clearInterval(pollingRef.current);
    }, [step, inscricaoId]);

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
            if (isWeb) window.scrollTo({ top: 0, behavior: 'smooth' });
            else scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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

    const formRef = useRef(null);
    const scrollToForm = () => {
        if (isWeb) {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }
    };

    const previewBackButton = isPreview ? (
        <TouchableOpacity style={styles.previewBackBtn} onPress={handlePreviewBack} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#FFF" />
            <Text style={styles.previewBackBtnText}>VOLTAR AO ADMIN</Text>
        </TouchableOpacity>
    ) : null;

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
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
                    
                    {/* COLUNA DA ESQUERDA: CONTEÚDO INFORMATIVO */}
                    <View style={[styles.infoColumn, isDesktop && { flex: 1.2 }]}>
                        {/* HERO COMPACTO */}
                        <View style={styles.heroCompact}>
                            {desafio.logoUrl ? (
                                <Image source={{ uri: desafio.logoUrl }} style={styles.heroLogoImg} resizeMode="cover" />
                            ) : (
                                <View style={styles.heroIconBox}>
                                    <MaterialCommunityIcons name="whatsapp" size={26} color={MAIN_COLOR} />
                                </View>
                            )}
                            <Text style={styles.heroTitle}>{desafio.nome}</Text>
                            {desafio.descricao ? <Text style={styles.heroDesc}>{desafio.descricao}</Text> : null}
                            
                            {!isDesktop && step === 'form' && (
                                <TouchableOpacity onPress={scrollToForm} activeOpacity={0.85} style={styles.heroCtaCompact}>
                                    <LinearGradient colors={[MAIN_COLOR, DARK_COLOR]} style={styles.gradientCta}>
                                        <Text style={styles.heroCtaText}>QUERO MINHA VAGA • R$ {formatBRL(desafio.valor)}</Text>
                                        <MaterialCommunityIcons name="arrow-down" size={14} color="#FFF" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* MENTOR COMPACTO */}
                        {desafio.mentorNome ? (
                            <View style={styles.compactRowCard}>
                                <View style={styles.mentorPhotoBox}>
                                    {desafio.mentorFotoUrl ? (
                                        <Image source={{ uri: desafio.mentorFotoUrl }} style={styles.mentorPhoto} />
                                    ) : (
                                        <MaterialCommunityIcons name="account" size={22} color={MAIN_COLOR} />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mentorLabel}>CONDUZIDO POR</Text>
                                    <Text style={styles.mentorName}>{desafio.mentorNome}</Text>
                                    {desafio.mentorTexto ? <Text style={styles.mentorDesc} numberOfLines={2}>{desafio.mentorTexto}</Text> : null}
                                </View>
                            </View>
                        ) : null}

                        {/* IMPORTANTE / AVISO */}
                        {desafio.importante ? (
                            <View style={styles.importanteBox}>
                                <View style={styles.importanteHeaderRow}>
                                    <MaterialCommunityIcons name="alert-outline" size={16} color="#FFB800" />
                                    <Text style={styles.importanteLabel}>ATENÇÃO</Text>
                                </View>
                                <Text style={styles.importanteText}>{desafio.importante}</Text>
                            </View>
                        ) : null}

                        {/* BENEFÍCIOS COMPACTOS (GRID 2 COLUNAS NA WEB) */}
                        <Text style={styles.sectionTitleLeft}>💜 O QUE ESTÁ INCLUSO</Text>
                        <View style={styles.compactGrid}>
                            {beneficios.map((item, i) => (
                                <View key={i} style={[styles.gridItem, isDesktop && { width: '48%' }]}>
                                    <MaterialCommunityIcons name="check-circle" size={16} color={MAIN_COLOR} style={{ marginTop: 2 }} />
                                    <Text style={styles.beneficioText}>{item}</Text>
                                </View>
                            ))}
                        </View>

                        {/* PARA QUEM É */}
                        {desafio.paraQuemE?.length > 0 && (
                            <>
                                <Text style={styles.sectionTitleLeft}>🎯 PRA QUEM É</Text>
                                <View style={styles.compactGrid}>
                                    {desafio.paraQuemE.map((item, i) => (
                                        <View key={i} style={[styles.gridItem, isDesktop && { width: '48%' }]}>
                                            <MaterialCommunityIcons name="arrow-right-circle" size={16} color={MAIN_COLOR} style={{ marginTop: 2 }} />
                                            <Text style={styles.beneficioText}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* COMPROMISSO */}
                        {desafio.compromissoTexto ? (
                            <View style={styles.compromissoBox}>
                                <Text style={styles.compromissoLabel}>💬 COMPROMISSO DO TREINADOR</Text>
                                <Text style={styles.compromissoText}>{desafio.compromissoTexto}</Text>
                            </View>
                        ) : null}

                        {/* ANTES E DEPOIS HORIZONTAL */}
                        {galleryPairs.length > 0 && (
                            <View style={styles.gallerySectionContainer}>
                                <Text style={styles.sectionTitleLeft}>📸 EVOLUÇÃO DE ALUNOS</Text>
                                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingRight: 20 }}>
                                    {galleryPairs.map((pair, i) => (
                                        <View key={i} style={styles.galleryHorizontalCard}>
                                            <View style={styles.photoContainerRow}>
                                                <View style={styles.halfPhoto}>
                                                    <Text style={styles.photoTag}>ANTES</Text>
                                                    <Image source={{ uri: pair.before }} style={styles.galleryImgPlain} />
                                                </View>
                                                <View style={[styles.halfPhoto, { borderWidth: 1.5, borderColor: MAIN_COLOR }]}>
                                                    <Text style={[styles.photoTag, { color: MAIN_COLOR }]}>DEPOIS</Text>
                                                    <Image source={{ uri: pair.after }} style={styles.galleryImgPlain} />
                                                </View>
                                            </View>
                                            {pair.text ? <Text style={styles.galleryCaptionQuote} numberOfLines={2}>"{pair.text}"</Text> : null}
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* COMO FUNCIONA MIGRADO PARA TIMELINE COMPACTA */}
                        <Text style={styles.sectionTitleLeft}>⚡ COMO FUNCIONA</Text>
                        <View style={styles.timelineContainer}>
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineBadge}><Text style={styles.timelineNumber}>1</Text></View>
                                <Text style={styles.timelineText}>Inscrição via PIX</Text>
                            </View>
                            <View style={styles.timelineLine} />
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineBadge}><Text style={styles.timelineNumber}>2</Text></View>
                                <Text style={styles.timelineText}>Confirmação Direta</Text>
                            </View>
                            <View style={styles.timelineLine} />
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineBadge}><Text style={styles.timelineNumber}>3</Text></View>
                                <Text style={styles.timelineText}>Acesso Automático</Text>
                            </View>
                        </View>

                        {/* FAQ ACCORDION COMPACTO */}
                        <Text style={styles.sectionTitleLeft}>❓ DÚVIDAS FREQUENTES</Text>
                        <FaqAccordion faqs={faqList} accentColor={MAIN_COLOR} />

                        {/* BÔNUS */}
                        {desafio.bonusTexto ? (
                            <View style={styles.bonusBox}>
                                <Text style={styles.bonusLabel}>🎁 BÔNUS EXCLUSIVO INCLUSO</Text>
                                <Text style={styles.bonusText}>{desafio.bonusTexto}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* COLUNA DA DIREITA: FORMULÁRIO / PREÇO / STATUS FIXO */}
                    <View style={[styles.formColumn, isDesktop && styles.desktopStickyColumn]} ref={formRef}>
                        
                        {/* BOX DE PREÇO INTEGRADA AO CARD */}
                        <View style={styles.modernFormCard}>
                            {step === 'form' && (
                                <>
                                    <View style={styles.investimentoHeader}>
                                        <Text style={styles.investimentoLabel}>INVESTIMENTO ÚNICO</Text>
                                        <Text style={styles.investimentoValor}>R$ {formatBRL(desafio.valor)}</Text>
                                        <Text style={styles.investimentoPorDia}>Apenas R$ {formatBRL(precoPorDia)} por dia</Text>
                                    </View>
                                    
                                    <Text style={styles.formSectionSubtitle}>Preencha seus dados para gerar o PIX:</Text>

                                    <Text style={styles.inputLabel}>Nome completo</Text>
                                    <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome completo" placeholderTextColor="#555" />

                                    <Text style={styles.inputLabel}>Data de nascimento</Text>
                                    <TextInput style={styles.input} value={dataNascimento} onChangeText={(v) => setDataNascimento(formatDataNascimento(v))} placeholder="DD/MM/AAAA" placeholderTextColor="#555" keyboardType="numeric" maxLength={10} />

                                    <Text style={styles.inputLabel}>E-mail</Text>
                                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" />

                                    <Text style={styles.inputLabel}>Telefone (WhatsApp)</Text>
                                    <TextInput style={styles.input} value={telefone} onChangeText={(v) => setTelefone(formatTelefone(v))} placeholder="(41) 99999-9999" placeholderTextColor="#555" keyboardType="phone-pad" maxLength={15} />

                                    <Text style={styles.inputLabel}>CPF</Text>
                                    <TextInput style={styles.input} value={cpf} onChangeText={(v) => setCpf(formatCPF(v))} placeholder="000.000.000-00" placeholderTextColor="#555" keyboardType="numeric" maxLength={14} />
                                    <Text style={styles.cpfHelper}>Necessário para emissão segura do PIX.</Text>

                                    {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

                                    <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                                        <LinearGradient colors={[MAIN_COLOR, DARK_COLOR]} style={[styles.submitBtn, submitting && { opacity: 0.6 }]}>
                                            {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.submitBtnText}>GERAR COBRANÇA PIX</Text>}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    
                                    <Text style={styles.urgencyNote}>⚠️ Vagas limitadas pelo tamanho do grupo do WhatsApp.</Text>
                                </>
                            )}

                            {/* STEP: PAGAMENTO */}
                            {step === 'pagamento' && (
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.modernFormTitle}>COPIE O CÓDIGO PIX</Text>
                                    <Text style={styles.modernPixHelper}>Escaneie ou copie o código. O link do grupo abre sozinho assim que o banco confirmar.</Text>

                                    {pixQrCode ? (
                                        <Image source={{ uri: pixQrCode.startsWith('data:') ? pixQrCode : `data:image/png;base64,${pixQrCode}` }} style={styles.pixImage} />
                                    ) : null}

                                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopyPix}>
                                        <MaterialCommunityIcons name={copiado ? 'check' : 'content-copy'} size={16} color={MAIN_COLOR} />
                                        <Text style={styles.copyBtnText}>{copiado ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}</Text>
                                    </TouchableOpacity>

                                    <View style={styles.waitingRow}>
                                        <ActivityIndicator size="small" color={MAIN_COLOR} />
                                        <Text style={styles.waitingText}>Confirmando pagamento com o banco...</Text>
                                    </View>
                                </View>
                            )}

                            {/* STEP: SUCESSO */}
                            {step === 'sucesso' && (
                                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                                    <MaterialCommunityIcons name="check-circle" size={48} color={MAIN_COLOR} style={{ marginBottom: 12 }} />
                                    <Text style={styles.modernFormTitle}>INSCRIÇÃO CONFIRMADA! 🎉</Text>
                                    <Text style={styles.modernPixHelper}>Sua vaga está 100% garantida. Clique abaixo para entrar agora mesmo no grupo oficial.</Text>

                                    <TouchableOpacity onPress={handleEntrarGrupo} activeOpacity={0.85} style={{ width: '100%', marginTop: 10 }}>
                                        <LinearGradient colors={['#25D366', '#128C7E']} style={styles.entrarGrupoBtn}>
                                            <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
                                            <Text style={styles.submitBtnText}>ENTRAR NO GRUPO OFICIAL</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.securityRow}>
                                <MaterialCommunityIcons name="lock-outline" size={12} color="#555" />
                                <Text style={styles.securityText}>Ambiente de pagamento criptografado SSL</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>PAULO ADRIANO TEAM © 2026</Text>
                </View>
            </ScrollView>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { height: isWeb ? '100vh' : '100%', backgroundColor: '#060608' },
    previewBackBtn: {
        position: 'absolute', top: isWeb ? 16 : 55, left: 16, zIndex: 999,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: 10, paddingHorizontal: 16,
        borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    previewBackBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    mainLayout: { width: '100%', maxWidth: 1100, alignSelf: 'center', padding: 20, gap: 25 },
    desktopLayout: { flexDirection: 'row', paddingTop: 40 },
    
    infoColumn: { gap: 20 },
    formColumn: { width: '100%', maxWidth: 440, alignSelf: 'flex-start' },
    desktopStickyColumn: { position: 'sticky', top: 40, zIndex: 90 },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
    notFoundTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 16, letterSpacing: 0.5 },
    notFoundDesc: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 8 },

    // ── Hero Compacto
    heroCompact: { backgroundColor: '#111015', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#1c1922' },
    heroIconBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(139,92,246,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    heroLogoImg: { width: '100%', aspectRatio: 3.5, marginBottom: 16, borderRadius: 12 },
    heroTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 8 },
    heroDesc: { color: '#999', fontSize: 13, lineHeight: 20, marginBottom: 0 },
    heroCtaCampact: { width: '100%', marginTop: 20 },
    gradientCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
    heroCtaText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

    // ── Cards Horizontais/Compactos
    compactRowCard: { flexDirection: 'row', backgroundColor: '#111015', borderRadius: 20, padding: 16, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#1c1922' },
    mentorPhotoBox: { width: 48, height: 52, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    mentorPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
    mentorLabel: { color: MAIN_COLOR, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    mentorName: { color: '#FFF', fontSize: 15, fontWeight: '900' },
    mentorDesc: { color: '#777', fontSize: 12, lineHeight: 17, fontStyle: 'italic', marginTop: 2 },

    sectionTitleLeft: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginTop: 15, marginBottom: 5, textTransform: 'uppercase' },
    compactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
    gridItem: { width: '100%', backgroundColor: '#111015', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: '#1c1922' },
    beneficioText: { flex: 1, color: '#AAA', fontSize: 13, lineHeight: 19 },

    importanteBox: { backgroundColor: 'rgba(255,184,0,0.06)', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: '#FFB800', padding: 16, borderWidth: 1, borderColor: 'rgba(255,184,0,0.1)' },
    importanteHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    importanteLabel: { color: '#FFB800', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    importanteText: { color: '#999', fontSize: 12, lineHeight: 18 },

    compromissoBox: { backgroundColor: '#111015', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1c1922' },
    compromissoLabel: { color: MAIN_COLOR, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
    compromissoText: { color: '#999', fontSize: 12, lineHeight: 18 },

    bonusBox: { backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: MAIN_COLOR, padding: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.1)' },
    bonusLabel: { color: LIGHT_COLOR, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
    bonusText: { color: '#AAA', fontSize: 12, lineHeight: 18 },

    // ── Timeline Compacta Horizontal
    timelineContainer: { flexDirection: 'row', backgroundColor: '#111015', borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#1c1922' },
    timelineItem: { alignItems: 'center', gap: 6, flex: 1 },
    timelineBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: MAIN_COLOR, justifyContent: 'center', alignItems: 'center' },
    timelineNumber: { color: LIGHT_COLOR, fontWeight: '900', fontSize: 11 },
    timelineText: { color: '#888', fontSize: 10, fontWeight: '700', textAlign: 'center' },
    timelineLine: { width: 20, height: 1, backgroundColor: '#222', flexShrink: 0 },

    // ── Galeria Horizontal
    gallerySectionContainer: { width: '100%', overflow: 'hidden' },
    galleryHorizontalCard: { backgroundColor: '#111015', padding: 12, borderRadius: 18, width: 260, borderWidth: 1, borderColor: '#1c1922' },
    photoContainerRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    halfPhoto: { flex: 1, aspectRatio: 0.9, borderRadius: 10, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
    photoTag: { position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: '#888', fontSize: 8, fontWeight: '900', zIndex: 10 },
    galleryImgPlain: { width: '100%', height: '100%', resizeMode: 'cover' },

    // ── Card de Formulário Moderno
    modernFormCard: { backgroundColor: '#111015', borderRadius: 24, borderWidth: 1, borderColor: '#1c1922', padding: 22 },
    investimentoHeader: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1c1922', paddingBottom: 16, marginBottom: 16 },
    investimentoLabel: { color: '#666', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    investimentoValor: { color: '#FFF', fontSize: 32, fontWeight: '900', marginTop: 2 },
    investimentoPorDia: { color: MAIN_COLOR, fontSize: 12, fontWeight: '800', marginTop: 4 },
    formSectionSubtitle: { color: '#AAA', fontSize: 13, fontWeight: '700', marginBottom: 5 },

    modernFormTitle: { color: '#FFF', fontSize: 15, fontWeight: '900', textAlign: 'center', marginBottom: 10, letterSpacing: 0.5 },
    modernPixHelper: { color: '#777', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16, paddingHorizontal: 4 },

    inputLabel: { color: '#666', fontSize: 11, fontWeight: '900', marginBottom: 5, marginTop: 12 },
    // 🔥 FIX: fontSize forçado para 16 nos inputs para evitar zoom fantasma do iOS na Web
    input: { backgroundColor: '#060608', color: '#FFF', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, fontSize: 16 },
    cpfHelper: { color: '#444', fontSize: 10, fontStyle: 'italic', marginTop: 4 },
    formErrorText: { color: '#FF3B30', fontSize: 12, fontWeight: '700', marginTop: 14, textAlign: 'center' },
    urgencyNote: { color: '#FFB800', fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 16, opacity: 0.8 },

    submitBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
    submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

    securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 15, borderTopWidth: 1, borderTopColor: '#1c1922', paddingTop: 14 },
    securityText: { color: '#444', fontSize: 10 },

    pixImage: { width: 180, height: 180, alignSelf: 'center', borderRadius: 12, backgroundColor: '#FFF', marginBottom: 16 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: MAIN_COLOR, borderRadius: 12, paddingVertical: 12, width: '100%', marginBottom: 16 },
    copyBtnText: { color: LIGHT_COLOR, fontWeight: '900', fontSize: 12 },
    waitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    waitingText: { color: '#666', fontSize: 12, fontStyle: 'italic' },

    entrarGrupoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },

    footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#111', paddingTop: 20 },
    footerText: { color: '#333', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});