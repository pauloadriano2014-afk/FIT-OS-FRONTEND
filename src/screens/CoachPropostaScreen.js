// src/screens/CoachPropostaScreen.js
// Landing page de captação de coaches (Versão VIVA com Animações Contínuas e Floating)
import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Platform, useWindowDimensions, Linking, Image,
    StatusBar, Easing
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ─── CORES PREMIUM SAAS ───────────────────────────────────────────────────────
const DARK_BG = '#040405';
const SURFACE = '#0A0A0C';
const BORDER  = '#1A1A24';
const ACCENT  = '#8BC34A';
const ACCENT_GLOW = 'rgba(139, 195, 74, 0.15)';
const TEXT_MUTED = '#7A7A8C';

// ─── PLANOS E DADOS (Mantidos idênticos) ───────────────────────────────────────
const PLANS = [
    {
        key: 'PERSONAL', icon: 'dumbbell', color: '#32ADE6', title: 'Personal Trainer', subtitle: 'O fim das planilhas de treino', price: 'R$ 97', period: '/mês', highlight: false,
        features: ['Construtor de treinos ilimitado', 'Biblioteca em vídeo de exercícios', 'Check-in de fotos organizado', 'Avaliação corporal com IA', 'Gestão financeira de alunos', 'Sua página de vendas própria'],
    },
    {
        key: 'ELITE', icon: 'rocket-launch', color: ACCENT, title: 'Elite (Mais Popular)', subtitle: 'O motor completo da sua consultoria', price: 'R$ 147', period: '/mês', highlight: true, 
        features: ['Tudo do plano Personal Trainer', 'Construtor de dietas completo', 'Grupos de substituição inteligente', 'Avaliação nutricional com IA', 'Cofre de templates (Dietas prontas)', 'Notificações push automáticas', 'Suporte prioritário'],
    },
    {
        key: 'NUTRICIONISTA', icon: 'food-apple', color: '#BF5AF2', title: 'Nutricionista', subtitle: 'Prescrição moderna e rápida', price: 'R$ 97', period: '/mês', highlight: false,
        features: ['Construtor de dietas ilimitado', 'Base TACO + Alimentos custom', 'Grupos de substituição alimentar', 'Avaliação nutricional com IA', 'Gestão de retornos e check-ins', 'Sua página de vendas própria'],
    },
];

const METRICS = [
    { value: '+10h', label: 'LIVRES POR SEMANA' },
    { value: 'ZERO', label: 'CALOTES DE ALUNOS' },
    { value: '100%', label: 'CONTROLE NO APP' },
];

const COMPARISON = [
    { bad: 'Anamnese perdida no WhatsApp', good: 'Anamnese automatizada no app' },
    { bad: 'Dieta em PDF pelo e-mail', good: 'Dieta interativa na palma da mão' },
    { bad: 'Planilha de treino confusa', good: 'Treino com vídeos de execução' },
    { bad: 'Cobrança manual e atrasada', good: 'Cobrança recorrente e automática' },
    { bad: 'Vários apps (Drive, Excel)', good: 'Tudo centralizado no ELITE FIT' },
    { bad: 'Decisões no achismo', good: 'Métricas e dashboard financeiro' },
];

const FAQ = [
    { q:'Posso testar antes de pagar?', a:'Sim! Após a aprovação, você tem 7 dias para explorar a plataforma gratuitamente.' },
    { q:'Posso mudar de plano depois?', a:'Claro. Você pode fazer upgrade a qualquer momento e pagamos apenas a diferença.' },
    { q:'Quantos alunos posso ter?', a:'Ilimitados. Não cobramos por aluno — seu crescimento não tem teto.' },
    { q:'Os alunos pagam alguma coisa?', a:'Não para usar o app. O que você cobra dos seus alunos é 100% seu e gerenciado por você.' },
    { q:'Posso usar minha própria logo?', a:'Sim. O app ganha a sua identidade e a sua logo aparece para os seus alunos (White-label).' },
];

// ─── EFEITOS DE "VIDA" (ANIMAÇÕES) ────────────────────────────────────────────

// Efeito 1: Entrada Suave (Já tínhamos, deixa a página macia ao carregar)
function FadeIn({ delay = 0, style, children }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;
    
    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 800, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.timing(translateY, { toValue: 0, duration: 800, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        ]).start();
    }, [delay, opacity, translateY]);
    
    return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

// 🔥 Efeito 2: Flutuação Contínua (O segredo da página parecer viva)
function FloatingView({ children, style, delay = 0 }) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const floatAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, { toValue: -15, duration: 3000, delay, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(translateY, { toValue: 0, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            ])
        );
        floatAnimation.start();
        return () => floatAnimation.stop();
    }, [translateY, delay]);

    return <Animated.View style={[{ transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

// 🔥 Efeito 3: Pulsação de Brilho (Neon respirando)
function PulseGlow({ style }) {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scale, { toValue: 1.1, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                    Animated.timing(scale, { toValue: 1, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                ]),
                Animated.sequence([
                    Animated.timing(opacity, { toValue: 0.7, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                    Animated.timing(opacity, { toValue: 0.4, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                ])
            ])
        ).start();
    }, [scale, opacity]);

    return <Animated.View style={[style, { transform: [{ scale }], opacity }]} />;
}


// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function CoachPropostaScreen({ navigation }) {
    const { width: W } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const isWide = W > 850;
    const [openFaq, setOpenFaq] = useState(null);
    
    const scrollRef = useRef(null);
    const [plansSectionY, setPlansSectionY] = useState(0);

    const scrollToPlans = () => {
        if (scrollRef.current && plansSectionY > 0) {
            scrollRef.current.scrollTo({ y: plansSectionY, animated: true });
        }
    };

    const handlePlanChoice = (planKey) => {
        navigation.navigate('Register', { accountType: 'COACH', type: 'COACH', role: 'COACH', coachPlan: planKey, plan: planKey });
    };

    const handleWhatsApp = () => {
        Linking.openURL(`whatsapp://send?phone=5541997991346&text=Olá! Tenho interesse em ser coach parceiro no ELITE FIT.`).catch(() => {});
    };

    return (
        <View style={{ flex: 1, backgroundColor: DARK_BG, height: isWeb ? '100vh' : '100%', overflow: 'hidden' }}>
            <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
            
            <ScrollView ref={scrollRef} style={{ flex: 1, width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
                <View style={{ maxWidth: 1000, width: '100%', paddingHorizontal: 24, paddingBottom: 100 }}>

                    {/* ── HEADER ───────────────────────── */}
                    <View style={[styles.headerRow, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.headerLogoWrapper}>
                            <Image source={require('../../assets/elitefit_banner_generic.png')} style={{ width: 140, height: 40 }} resizeMode="contain" />
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* ── HERO SAAS PREMIUM ──────────────────────────────────────── */}
                    <View style={styles.heroSection}>
                        <FadeIn delay={100}>
                            <View style={styles.heroBadgeBox}>
                                <Text style={styles.heroBadge}>DE PRESTADOR DE SERVIÇO A EMPRESÁRIO</Text>
                            </View>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <Text style={styles.heroTitle}>A forma mais simples de escalar sua <Text style={{ color: ACCENT }}>Consultoria Online.</Text></Text>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <Text style={styles.heroSubtitle}>
                                A plataforma que gerencia alunos, treino, dieta e financeiro no automático. Mais previsibilidade, menos caos. <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Bye bye Excel, PDF e Google Drive.</Text>
                            </Text>
                        </FadeIn>

                        <FadeIn delay={400} style={styles.heroButtonGroup}>
                            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: ACCENT }]} onPress={handlePlanChoice} activeOpacity={0.8}>
                                <Text style={styles.btnPrimaryText}>Começar grátis por 7 dias</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSecondary} onPress={scrollToPlans} activeOpacity={0.8}>
                                <Text style={styles.btnSecondaryText}>Ver planos</Text>
                            </TouchableOpacity>
                        </FadeIn>
                        
                        <FadeIn delay={500}>
                            <Text style={styles.heroMicrocopy}>
                                <MaterialCommunityIcons name="check" size={14} color={ACCENT} /> Grátis, sem cartão · Cancele quando quiser
                            </Text>
                        </FadeIn>
                    </View>

                    {/* ── MOCKUP FLUTUANTE (VIVO) ────── */}
                    <FadeIn delay={600} style={styles.mockupContainer}>
                        {/* Brilho neon animado */}
                        <PulseGlow style={[styles.mockupGlow, { backgroundColor: ACCENT }]} />
                        
                        {/* Container flutuante */}
                        <FloatingView>
                            <View style={styles.mockupInner}>
                                <View style={styles.mockupHeader}>
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        <View style={[styles.mockupDot, { backgroundColor: '#FF5F56' }]} />
                                        <View style={[styles.mockupDot, { backgroundColor: '#FFBD2E' }]} />
                                        <View style={[styles.mockupDot, { backgroundColor: '#27C93F' }]} />
                                    </View>
                                    <Text style={{ color: '#555', fontSize: 10, fontWeight: 'bold', marginLeft: 16 }}>elitefit.app/dashboard</Text>
                                </View>
                                <View style={styles.mockupContent}>
                                    <View style={{ flex: 1, gap: 16 }}>
                                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>Dashboard Financeiro</Text>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <View style={styles.mockupCard}>
                                                <Text style={styles.mockupLabel}>HOJE</Text>
                                                <Text style={styles.mockupValue}>R$ 1.240,00</Text>
                                                <Text style={styles.mockupTrend}>↗ 14% mais</Text>
                                            </View>
                                            <View style={styles.mockupCard}>
                                                <Text style={styles.mockupLabel}>ESTE MÊS</Text>
                                                <Text style={styles.mockupValue}>R$ 18.450,00</Text>
                                                <Text style={styles.mockupTrend}>↗ 8% mais</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </FloatingView>
                    </FadeIn>

                    {/* ── MÉTRICAS ───────────────────────────────────────────── */}
                    <View style={[styles.metricsRow, { flexDirection: isWide ? 'row' : 'column' }]}>
                        {METRICS.map((m, i) => (
                            <View key={i} style={styles.metricCard}>
                                <Text style={styles.metricValue}>{m.value}</Text>
                                <Text style={styles.metricLabel}>{m.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── VS CONCORRENTES ─────────────── */}
                    <View style={styles.sectionSpacing}>
                        <Text style={styles.sectionMiniTitle}>O CUSTO INVISÍVEL DO AMADORISMO</Text>
                        <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>
                            Sua consultoria não cabe mais em <Text style={{ color: '#4285F4' }}>Google Drive</Text>
                        </Text>

                        <View style={styles.vsContainer}>
                            <View style={styles.vsHeaderRow}>
                                <Text style={styles.vsHeaderBad}>O que os outros fazem</Text>
                                <Text style={styles.vsHeaderGood}>O que você faz aqui</Text>
                            </View>
                            
                            {COMPARISON.map((item, i) => (
                                <FadeIn key={i} delay={i * 100} style={styles.vsRow}>
                                    <View style={styles.vsCardBad}>
                                        <Text style={styles.vsTextBad}>{item.bad}</Text>
                                    </View>
                                    <View style={styles.vsCardGood}>
                                        <MaterialCommunityIcons name="check-circle" size={16} color={ACCENT} style={{ marginRight: 8 }} />
                                        <Text style={styles.vsTextGood}>{item.good}</Text>
                                    </View>
                                </FadeIn>
                            ))}
                        </View>
                    </View>

                    {/* ── FUNCIONALIDADES SAAS (CARDS FLUTUANTES NO HOVER/APARECIMENTO) ───────────────────────── */}
                    <View style={styles.sectionSpacing}>
                        <Text style={styles.sectionMiniTitle}>O MOTOR DE RECORRÊNCIA</Text>
                        <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>
                            Uma engrenagem de <Text style={{ color: ACCENT }}>receita recorrente</Text>
                        </Text>
                        <Text style={[styles.heroSubtitle, { maxWidth: 600, alignSelf: 'center', marginBottom: 40 }]}>
                            Não é só organização. É um sistema de IA que faz o seu faturamento crescer e parar de vazar.
                        </Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                            {[
                                { icon: 'robot', title: 'Avaliação com IA', desc: 'A IA lê as fotos, cruza com a anamnese e escreve o laudo pra você revisar.' },
                                { icon: 'layers', title: 'Centraliza', desc: 'Adeus PDF e links perdidos. Treino, dieta e boletos no app do aluno.' },
                                { icon: 'sync', title: 'Automatiza', desc: 'Fim da cobrança manual. O sistema bloqueia quem não paga.' },
                                { icon: 'heart-pulse', title: 'Retém', desc: 'Gamificação e notificações push mantêm o aluno motivado a renovar.' },
                            ].map((f, i) => (
                                <FadeIn key={i} delay={i * 150} style={[styles.featureCardWrap, isWide && { width: '48%' }]}>
                                    <View style={styles.featureCard}>
                                        <View style={styles.featureIconBox}>
                                            <MaterialCommunityIcons name={f.icon} size={24} color={ACCENT} />
                                        </View>
                                        <Text style={styles.featureTitle}>{f.title}</Text>
                                        <Text style={styles.featureDesc}>{f.desc}</Text>
                                    </View>
                                </FadeIn>
                            ))}
                        </View>
                    </View>

                    {/* ── PLANOS / PRICING ───────────────────────────────────── */}
                    <View style={styles.sectionSpacing} onLayout={(e) => setPlansSectionY(e.nativeEvent.layout.y)}>
                        <Text style={styles.sectionMiniTitle}>PLANOS E PREÇOS</Text>
                        <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Comece hoje. Escale no <Text style={{ color: ACCENT }}>seu ritmo.</Text></Text>

                        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 20, marginTop: 40, alignItems: isWide ? 'stretch' : 'center' }}>
                            {PLANS.map((plan, i) => (
                                <FadeIn key={plan.key} delay={i * 200} style={[isWide && { flex: 1 }]}>
                                    <View style={[styles.pricingCard, plan.highlight && styles.pricingCardHighlighted]}>
                                        {plan.highlight && (
                                            <View style={styles.pricingBadge}>
                                                <Text style={styles.pricingBadgeText}>O MAIS ESCOLHIDO</Text>
                                            </View>
                                        )}
                                        <Text style={styles.pricingTitle}>{plan.title}</Text>
                                        <Text style={styles.pricingSubtitle}>{plan.subtitle}</Text>
                                        
                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceValue}>{plan.price}</Text>
                                            <Text style={styles.pricePeriod}>{plan.period}</Text>
                                        </View>

                                        <View style={styles.featuresList}>
                                            {plan.features.map(f => (
                                                <View key={f} style={styles.featureLine}>
                                                    <MaterialCommunityIcons name="check" size={16} color={plan.highlight ? ACCENT : TEXT_MUTED} />
                                                    <Text style={styles.featureLineText}>{f}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        <TouchableOpacity 
                                            style={[styles.btnPrimary, { backgroundColor: plan.highlight ? ACCENT : '#1E1E28', marginTop: 'auto' }]} 
                                            onPress={() => handlePlanChoice(plan.key)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.btnPrimaryText, { color: plan.highlight ? '#000' : '#FFF' }]}>
                                                {plan.highlight ? 'Começar grátis agora' : 'Selecionar plano'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </FadeIn>
                            ))}
                        </View>
                    </View>

                    {/* ── FAQ ACCORDION ──────────────────────────────────────── */}
                    <View style={styles.sectionSpacing}>
                        <Text style={styles.sectionMiniTitle}>DÚVIDAS</Text>
                        <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 30 }]}>Perguntas frequentes</Text>
                        
                        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
                            {FAQ.map((item, i) => (
                                <TouchableOpacity key={i} style={[styles.faqCard, openFaq === i && { borderColor: ACCENT }]} onPress={() => setOpenFaq(openFaq === i ? null : i)} activeOpacity={0.8}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.faqQ}>{item.q}</Text>
                                        <MaterialCommunityIcons name={openFaq === i ? 'minus' : 'plus'} size={20} color={ACCENT} />
                                    </View>
                                    {openFaq === i && <Text style={styles.faqA}>{item.a}</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ── BOTTOM CTA ─────────────────────────────────────────── */}
                    <View style={styles.bottomCTA}>
                        <PulseGlow style={[StyleSheet.absoluteFill, { backgroundColor: ACCENT_GLOW, opacity: 0.2 }]} />
                        <Text style={[styles.heroTitle, { fontSize: 32 }]}>Menos caos.{'\n'}Mais <Text style={{ color: ACCENT }}>controle.</Text></Text>
                        <Text style={[styles.heroSubtitle, { marginBottom: 30 }]}>Junte-se a dezenas de profissionais que organizaram a consultoria com o ELITE FIT.</Text>
                        
                        <View style={{ width: '100%', maxWidth: 360, gap: 12 }}>
                            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: ACCENT }]} onPress={scrollToPlans} activeOpacity={0.8}>
                                <Text style={styles.btnPrimaryText}>Começar grátis agora</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btnSecondary, { borderColor: '#25D366' }]} onPress={handleWhatsApp} activeOpacity={0.8}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                                    <Text style={[styles.btnSecondaryText, { color: '#25D366' }]}>Falar com a equipe</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

// ─── STYLES SAAS PREMIUM ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    headerLogoWrapper: { flex: 1, alignItems: 'center' },
    
    heroSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 60 },
    heroBadgeBox: { backgroundColor: 'rgba(139, 195, 74, 0.08)', borderWidth: 1, borderColor: 'rgba(139, 195, 74, 0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, marginBottom: 24 },
    heroBadge: { color: ACCENT, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    heroTitle: { color: '#FFF', fontSize: 48, fontWeight: '900', textAlign: 'center', lineHeight: 56, marginBottom: 24, letterSpacing: -1 },
    heroSubtitle: { color: TEXT_MUTED, fontSize: 18, textAlign: 'center', lineHeight: 28, maxWidth: 700, marginBottom: 40 },
    heroButtonGroup: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 },
    heroMicrocopy: { color: TEXT_MUTED, fontSize: 12, fontWeight: '600' },
    
    btnPrimary: { backgroundColor: ACCENT, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    btnPrimaryText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    btnSecondaryText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },

    mockupContainer: { width: '100%', maxWidth: 800, alignSelf: 'center', position: 'relative', marginTop: 20, marginBottom: 60 },
    mockupGlow: { position: 'absolute', top: -10, left: '5%', right: '5%', height: 180, borderRadius: 100, transform: [{ scaleY: 0.6 }], filter: 'blur(50px)' },
    mockupInner: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 10 },
    mockupHeader: { backgroundColor: '#111118', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BORDER },
    mockupDot: { width: 10, height: 10, borderRadius: 5 },
    mockupContent: { padding: 24, minHeight: 200 },
    mockupCard: { flex: 1, backgroundColor: '#16161E', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
    mockupLabel: { color: TEXT_MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    mockupValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
    mockupTrend: { color: ACCENT, fontSize: 11, fontWeight: 'bold' },

    metricsRow: { flexDirection: 'row', gap: 20, justifyContent: 'center', marginBottom: 60 },
    metricCard: { flex: 1, alignItems: 'center', padding: 24, backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
    metricValue: { color: '#FFF', fontSize: 36, fontWeight: '900', marginBottom: 8 },
    metricLabel: { color: ACCENT, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

    sectionSpacing: { marginTop: 80, width: '100%' },
    sectionMiniTitle: { color: TEXT_MUTED, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center', marginBottom: 12 },
    sectionTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 40 },

    vsContainer: { maxWidth: 700, width: '100%', alignSelf: 'center' },
    vsHeaderRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
    vsHeaderBad: { flex: 1, textAlign: 'center', color: TEXT_MUTED, fontSize: 12, fontWeight: 'bold', marginRight: 10 },
    vsHeaderGood: { flex: 1, textAlign: 'center', color: ACCENT, fontSize: 12, fontWeight: 'bold', marginLeft: 10 },
    vsRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
    vsCardBad: { flex: 1, backgroundColor: '#111', padding: 16, borderRadius: 12, marginRight: 10, opacity: 0.7 },
    vsCardGood: { flex: 1, backgroundColor: 'rgba(139, 195, 74, 0.08)', padding: 16, borderRadius: 12, marginLeft: 10, borderWidth: 1, borderColor: 'rgba(139, 195, 74, 0.2)', flexDirection: 'row', alignItems: 'center' },
    vsTextBad: { color: '#666', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    vsTextGood: { color: '#FFF', fontSize: 13, fontWeight: '800' },

    featureCardWrap: { width: '100%' },
    featureCard: { backgroundColor: SURFACE, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: BORDER, width: '100%', height: '100%' },
    featureIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#16161E', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#222' },
    featureTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    featureDesc: { color: TEXT_MUTED, fontSize: 14, lineHeight: 22 },

    pricingCard: { backgroundColor: SURFACE, padding: 32, borderRadius: 20, borderWidth: 1, borderColor: BORDER, width: '100%', maxWidth: 350 },
    pricingCardHighlighted: { borderColor: ACCENT, backgroundColor: '#0B1008', shadowColor: ACCENT, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    pricingBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
    pricingBadgeText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    pricingTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 4 },
    pricingSubtitle: { color: TEXT_MUTED, fontSize: 13, marginBottom: 24 },
    priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 24 },
    priceValue: { color: '#FFF', fontSize: 36, fontWeight: '900', lineHeight: 40 },
    pricePeriod: { color: TEXT_MUTED, fontSize: 14, fontWeight: 'bold', marginBottom: 6, marginLeft: 4 },
    featuresList: { gap: 12, marginBottom: 32, flex: 1 },
    featureLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureLineText: { color: '#CCC', fontSize: 13 },

    faqCard: { backgroundColor: SURFACE, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
    faqQ: { color: '#FFF', fontSize: 15, fontWeight: 'bold', flex: 1, paddingRight: 10 },
    faqA: { color: TEXT_MUTED, fontSize: 14, lineHeight: 22, marginTop: 12 },

    bottomCTA: { marginTop: 100, alignItems: 'center', backgroundColor: SURFACE, paddingVertical: 60, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: BORDER, position: 'relative', overflow: 'hidden' },
});
