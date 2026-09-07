// src/screens/CoachPropostaScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Platform, useWindowDimensions, Image,
    StatusBar, Easing, SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

// ─── CORES PREMIUM SAAS ───────────────────────────────────────────────────────
const DARK_BG = '#040405';
const SURFACE = '#0A0A0C';
const BORDER  = '#1A1A24';
const ACCENT  = '#8BC34A';
const TEXT_MUTED = '#7A7A8C';

// ─── DADOS DO FAQ ───────────────────────────
const FAQ = [
    { q:'Posso testar antes de pagar?', a:'Sim! Após a aprovação, você tem 7 dias para explorar a plataforma gratuitamente.' },
    { q:'Posso mudar de plano depois?', a:'Claro. Você pode fazer upgrade a qualquer momento e pagamos apenas a diferença.' },
    { q:'Quantos alunos posso ter?', a:'Ilimitados. Não cobramos por aluno — seu crescimento não tem teto.' },
    { q:'Os alunos pagam alguma coisa?', a:'Não para usar o app. O que você cobra dos seus alunos é 100% seu e gerenciado por você.' },
    { q:'Posso usar minha própria logo?', a:'Sim. O app ganha a sua identidade e a sua logo aparece para os seus alunos (White-label).' },
];

// ─── COMPONENTES AUXILIARES E ANIMAÇÕES ────────────────────────────

function FadeIn({ delay = 0, style, children }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;
    
    useEffect(() => {
        const anim = Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 800, delay, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
            Animated.timing(translateY, { toValue: 0, duration: 800, delay, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
        ]);
        anim.start();
        return () => anim.stop();
    }, [delay, opacity, translateY]);
    
    return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

function FloatingView({ children, style, delay = 0 }) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, { toValue: -15, duration: 3000, delay, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(translateY, { toValue: 0, duration: 3000, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [translateY, delay]);

    return <Animated.View style={[{ transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

// SmartBanner com suporte a largura customizada para o carrossel mobile
const SmartBanner = ({ source, children, style, columns = 1, gap = 0, customWidth }) => {
    const [imageHeight, setImageHeight] = useState(200); 
    const { width: screenWidth } = useWindowDimensions();
    
    const maxWidth = 1000;
    const availableWidth = screenWidth > maxWidth ? maxWidth : screenWidth;
    const paddingHorizontal = 48; 
    
    const totalGap = gap * (columns - 1);
    const containerWidth = customWidth || ((availableWidth - paddingHorizontal) - totalGap) / columns;

    useEffect(() => {
        let isMounted = true;
        const updateHeight = (width, height) => {
            if (isMounted && width && height && containerWidth > 0) {
                setImageHeight((containerWidth * height) / width);
            }
        };

        try {
            if (typeof source === 'number') {
                const sourceAsset = Image.resolveAssetSource(source);
                if (sourceAsset) { updateHeight(sourceAsset.width, sourceAsset.height); }
            } else if (source && source.uri) {
                 Image.getSize(source.uri, 
                    (width, height) => updateHeight(width, height), 
                    () => {}
                 );
            }
        } catch (e) {}

        return () => { isMounted = false; };
    }, [source, containerWidth]);

    return (
        <View style={[styles.smartBannerContainer, style, { height: imageHeight, width: customWidth || '100%' }]}>
            <Image source={source} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} resizeMode="contain" />
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
    const [plansSectionY, setPlansSectionY] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false })
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [pulseAnim]);

    const scrollToPlans = () => {
        if (scrollRef.current && plansSectionY > 0) {
            scrollRef.current.scrollTo({ y: plansSectionY, animated: true });
        }
    };

    const handlePlanChoice = (planKey) => {
        navigation.navigate('Register', { accountType: 'COACH', type: 'COACH', role: 'COACH', coachPlan: planKey, plan: planKey });
    };

    // Estrutura das artes dos planos para renderizar condicionalmente
    const plansContent = (
        <>
            <TouchableOpacity activeOpacity={0.8} onPress={() => handlePlanChoice('PERSONAL')} style={isWide ? { flex: 1 } : { width: 300 }}>
                <SmartBanner source={require('../../assets/plano-personal.png')} customWidth={isWide ? null : 300} columns={isWide ? 3 : 1} gap={isWide ? 20 : 0} />
            </TouchableOpacity>

            <Animated.View style={[isWide ? { flex: 1 } : { width: 300 }, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => handlePlanChoice('ELITE')} style={{ width: '100%' }}>
                    <SmartBanner source={require('../../assets/plano-elite.png')} customWidth={isWide ? null : 300} columns={isWide ? 3 : 1} gap={isWide ? 20 : 0} />
                </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity activeOpacity={0.8} onPress={() => handlePlanChoice('NUTRICIONISTA')} style={isWide ? { flex: 1 } : { width: 300 }}>
                <SmartBanner source={require('../../assets/plano-nutri.png')} customWidth={isWide ? null : 300} columns={isWide ? 3 : 1} gap={isWide ? 20 : 0} />
            </TouchableOpacity>
        </>
    );

    return (
        <RootComponent style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
            
            <Image 
                source={require('../../assets/fundo-conexoes-coach.png')} 
                style={styles.backgroundImage} 
                pointerEvents="none" 
            />
            
            <View style={styles.webWrapper}>
                <ScrollView 
                    ref={scrollRef} 
                    style={{ flex: 1, width: '100%' }} 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.contentWrap}>

                        {/* ── HEADER ───────────────────────── */}
                        <View style={styles.headerContainer}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                            </TouchableOpacity>
                            
                            <Image 
                                source={require('../../assets/logo-coach-transparente.png')} 
                                style={{ width: '100%', maxWidth: isWide ? 400 : 250, height: isWide ? 70 : 45 }} 
                                resizeMode="contain" 
                            />
                        </View>

                        {/* ── HERO RESPONSIVO ──────────────────────────────────────── */}
                        <FadeIn delay={100} style={{ marginTop: 0 }}>
                            <SmartBanner source={isWide ? require('../../assets/hero-coach-desktop.png') : require('../../assets/hero-coach-mobile.png')} />
                        </FadeIn>

                        {/* ── MOCKUP FLUTUANTE ─────────────────────────────────────── */}
                        <FloatingView delay={0}>
                            <FadeIn delay={300} style={{ marginTop: 20 }}>
                                <SmartBanner source={require('../../assets/mockup-coach-app.png')} />
                            </FadeIn>
                        </FloatingView>

                        {/* ── COMPARATIVO ──────────────────────────────────────────── */}
                        <FadeIn delay={400} style={{ marginTop: 40 }}>
                            <SmartBanner source={require('../../assets/comparativo-coach-app.png')} />
                        </FadeIn>

                        {/* ── MOTOR DE RECORRÊNCIA ─────────────────────────────────── */}
                        <FadeIn delay={500} style={{ marginTop: 40 }}>
                            <SmartBanner source={require('../../assets/recorrencia-coach-app.png')} />
                        </FadeIn>

                        {/* ── PLANOS E PREÇOS (CARROSSEL MOBILE OU GRADE DESKTOP) ──── */}
                        <View style={styles.sectionSpacing} onLayout={(e) => setPlansSectionY(e.nativeEvent.layout.y)}>
                            <FadeIn delay={100}>
                                <SmartBanner source={require('../../assets/titulo-planos.png')} />
                            </FadeIn>

                            {isWide ? (
                                <View style={{ flexDirection: 'row', gap: 20, marginTop: 30, alignItems: 'flex-start', width: '100%' }}>
                                    {plansContent}
                                </View>
                            ) : (
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false} 
                                    style={{ width: '100%', marginTop: 30 }}
                                    contentContainerStyle={{ gap: 15, paddingHorizontal: 10, alignItems: 'center' }}
                                    snapToInterval={315} // 300 width + 15 gap para deslizar plano a plano
                                    decelerationRate="fast"
                                >
                                    {plansContent}
                                </ScrollView>
                            )}
                        </View>

                        {/* ── FAQ ACCORDION (NOVO TÍTULO EM ARTE) ────────────────── */}
                        <View style={styles.sectionSpacing}>
                            <FadeIn delay={100} style={{ marginBottom: 30 }}>
                                <SmartBanner source={require('../../assets/titulo-faq.png')} />
                            </FadeIn>
                            
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

                        {/* ── CTA FINAL ────────────────────────────────────────────── */}
                        <TouchableOpacity activeOpacity={0.8} onPress={scrollToPlans} style={{ width: '100%', marginTop: 80, marginBottom: 20 }}>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <SmartBanner source={require('../../assets/cta-final-coach-app.png')} />
                            </Animated.View>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </View>
        </RootComponent>
    );
}

// ─── STYLES SAAS PREMIUM ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { height: isWeb ? '100vh' : '100%', backgroundColor: DARK_BG, position: 'relative' },
    backgroundImage: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute', top: 0, left: 0 },
    webWrapper: { flex: 1, width: '100%', alignSelf: 'center' },
    
    scrollContent: { flexGrow: 1, paddingBottom: 100 },
    contentWrap: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 24 },
    
    headerContainer: {
        width: '100%',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        marginBottom: 10 
    },
    backButton: { 
        position: 'absolute', 
        left: 0, 
        top: Platform.OS === 'ios' ? 40 : 20, 
        zIndex: 20, 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: 'rgba(255,255,255,0.08)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.1)' 
    },
    
    smartBannerContainer: { 
        overflow: 'hidden', 
        alignSelf: 'center', 
        backgroundColor: 'transparent',
        borderRadius: 24 
    },

    sectionSpacing: { marginTop: 60, width: '100%' },

    faqCard: { backgroundColor: SURFACE, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
    faqQ: { color: '#FFF', fontSize: 15, fontWeight: 'bold', flex: 1, paddingRight: 10 },
    faqA: { color: TEXT_MUTED, fontSize: 14, lineHeight: 22, marginTop: 12 },
});