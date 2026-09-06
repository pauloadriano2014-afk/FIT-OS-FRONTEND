// src/screens/CoachPropostaScreen.js
// Landing page de captação de coaches (Versão Otimizada com SmartBanners)
import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, useWindowDimensions, Linking, Image,
    StatusBar, Dimensions, SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── CORES PREMIUM SAAS ───────────────────────────────────────────────────────
const DARK_BG = '#040405';
const SURFACE = '#0A0A0C';
const BORDER  = '#1A1A24';
const ACCENT  = '#8BC34A';
const TEXT_MUTED = '#7A7A8C';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

// ─── PLANOS E DADOS (Mantidos em código para interação) ────────────────────────
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

const FAQ = [
    { q:'Posso testar antes de pagar?', a:'Sim! Após a aprovação, você tem 7 dias para explorar a plataforma gratuitamente.' },
    { q:'Posso mudar de plano depois?', a:'Claro. Você pode fazer upgrade a qualquer momento e pagamos apenas a diferença.' },
    { q:'Quantos alunos posso ter?', a:'Ilimitados. Não cobramos por aluno — seu crescimento não tem teto.' },
    { q:'Os alunos pagam alguma coisa?', a:'Não para usar o app. O que você cobra dos seus alunos é 100% seu e gerenciado por você.' },
    { q:'Posso usar minha própria logo?', a:'Sim. O app ganha a sua identidade e a sua logo aparece para os seus alunos (White-label).' },
];

// ─── COMPONENTE SMART BANNER ──────────────────────────────────────────────────
const SmartBanner = ({ source, children, style }) => {
    const [imageHeight, setImageHeight] = useState(200); 
    
    const screenWidth = Dimensions.get('window').width;
    const maxWidth = 1000; 
    const availableWidth = screenWidth > maxWidth ? maxWidth : screenWidth;
    const paddingHorizontal = 48; // 24 de cada lado
    const containerWidth = availableWidth - paddingHorizontal;

    useEffect(() => {
        let isMounted = true;
        const updateHeight = (width, height) => {
            if (isMounted && width && height) {
                const calculatedHeight = (containerWidth * height) / width;
                setImageHeight(calculatedHeight);
            }
        };

        if (typeof source === 'number') {
            const resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');
            const sourceAsset = resolveAssetSource(source);
            if (sourceAsset) { updateHeight(sourceAsset.width, sourceAsset.height); }
        } else if (source && source.uri) {
             Image.getSize(source.uri, (width, height) => { updateHeight(width, height); }, (error) => {});
        }
        return () => { isMounted = false; };
    }, [source, containerWidth]);

    return (
        <View style={[styles.smartBannerContainer, style, { height: imageHeight }]}>
            <Image source={source} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} resizeMode="cover" />
            {children && (<View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>{children}</View>)}
        </View>
    );
};

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function CoachPropostaScreen({ navigation }) {
    const { width: W } = useWindowDimensions();
    const isWide = W > 850;
    const [openFaq, setOpenFaq] = useState(null);
    
    const scrollRef = useRef(null);
    const plansSectionY = useRef(0);

    const scrollToPlans = () => {
        if (scrollRef.current && plansSectionY.current > 0) {
            scrollRef.current.scrollTo({ y: plansSectionY.current, animated: true });
        }
    };

    const handlePlanChoice = (planKey) => {
        navigation.navigate('Register', { accountType: 'COACH', type: 'COACH', role: 'COACH', coachPlan: planKey, plan: planKey });
    };

    const handleWhatsApp = () => {
        Linking.openURL(`whatsapp://send?phone=5541997991346&text=Olá! Tenho interesse em ser coach parceiro no ELITE FIT - Consultoria de alta performance.`).catch(() => {});
    };

    return (
        <RootComponent style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
            
            <ScrollView 
                ref={scrollRef} 
                style={{ flex: 1, width: '100%' }} 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.webWrapper}>

                    {/* ── HEADER ───────────────────────── */}
                    <View style={[styles.headerRow, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.headerLogoWrapper}>
                            <Image source={require('../../assets/elitefit_banner_generic.png')} style={{ width: 180, height: 50 }} resizeMode="contain" />
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* ── HERO BANNER ────────────────────────────────────────────── */}
                    <SmartBanner source={require('../../assets/hero-coach-app.png')} style={{ marginBottom: 20 }}>
                        <TouchableOpacity activeOpacity={0.8} onPress={scrollToPlans} style={styles.invisibleButtonHero} />
                    </SmartBanner>

                    {/* ── MOCKUP & MÉTRICAS ──────────────────────────────────────── */}
                    <SmartBanner source={require('../../assets/mockup-coach-app.png')} style={{ marginBottom: 20 }} />

                    {/* ── COMPARATIVO ────────────────────────────────────────────── */}
                    <SmartBanner source={require('../../assets/comparativo-coach-app.png')} style={{ marginBottom: 20 }} />

                    {/* ── MOTOR DE RECORRÊNCIA ─────────────────── */}
                    <SmartBanner source={require('../../assets/recorrencia-coach-app.png')} style={{ marginBottom: 60 }} />

                    {/* ── PLANOS / PRICING ───────────────────── */}
                    <View style={styles.sectionSpacing} onLayout={(e) => { plansSectionY.current = e.nativeEvent.layout.y; }}>
                        <Text style={styles.sectionMiniTitle}>PLANOS E PREÇOS</Text>
                        <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Comece hoje. Escale no <Text style={{ color: ACCENT }}>seu ritmo.</Text></Text>

                        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 20, marginTop: 40, alignItems: isWide ? 'stretch' : 'center' }}>
                            {PLANS.map((plan) => (
                                <View key={plan.key} style={[isWide && { flex: 1 }]}>
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
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── FAQ ACCORDION ──────────────────────── */}
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

                    {/* ── CTA FINAL BANNER ───────────────────────────────────────── */}
                    <View style={{ marginTop: 60, width: '100%', alignItems: 'center' }}>
                        <SmartBanner source={require('../../assets/cta-final-coach-app.png')} style={{ marginBottom: 0, width: '100%' }}>
                            <TouchableOpacity activeOpacity={0.8} onPress={scrollToPlans} style={styles.invisibleButtonCTA} />
                        </SmartBanner>
                        
                        <TouchableOpacity style={[styles.btnSecondary, { borderColor: '#25D366', marginTop: 20 }]} onPress={handleWhatsApp} activeOpacity={0.8}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                                <Text style={[styles.btnSecondaryText, { color: '#25D366' }]}>Falar com a equipe</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </RootComponent>
    );
}

// ─── STYLES SAAS PREMIUM OTIMIZADOS ───────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK_BG, height: isWeb ? '100vh' : '100%' },
    scrollContent: { flexGrow: 1 },
    webWrapper: { maxWidth: 1000, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 100 },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    headerLogoWrapper: { flex: 1, alignItems: 'center' },
    
    smartBannerContainer: { 
        width: '100%', 
        borderRadius: 16, 
        overflow: 'hidden', 
        backgroundColor: '#111', 
        borderWidth: 1, 
        borderColor: BORDER,
        alignSelf: 'center'
    },

    // Botões invisíveis aplicados diretamente onde você desenhou os CTAs nas imagens
    invisibleButtonHero: {
        position: 'absolute',
        bottom: '5%',
        left: '10%',
        right: '10%',
        height: '20%',
        zIndex: 20
    },
    invisibleButtonCTA: {
        position: 'absolute',
        bottom: '10%',
        left: '10%',
        right: '10%',
        height: '35%',
        zIndex: 20
    },

    sectionSpacing: { marginTop: 80, width: '100%' },
    sectionMiniTitle: { color: TEXT_MUTED, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center', marginBottom: 12 },
    sectionTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 40 },

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

    btnPrimary: { backgroundColor: ACCENT, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    btnPrimaryText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    btnSecondaryText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});