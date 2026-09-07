// src/screens/CoachPropostaScreen.js
// Landing page de captação de coaches (Artes dinâmicas sem bordas + Título em Imagem)
import React, { useState, useRef, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Linking, Platform, SafeAreaView, Image, StatusBar,
    useWindowDimensions 
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

const FAQ = [
    { q:'Posso testar antes de pagar?', a:'Sim! Após a aprovação, você tem 7 dias para explorar a plataforma gratuitamente.' },
    { q:'Posso mudar de plano depois?', a:'Claro. Você pode fazer upgrade a qualquer momento e pagamos apenas a diferença.' },
    { q:'Quantos alunos posso ter?', a:'Ilimitados. Não cobramos por aluno — seu crescimento não tem teto.' },
    { q:'Os alunos pagam alguma coisa?', a:'Não para usar o app. O que você cobra dos seus alunos é 100% seu e gerenciado por você.' },
    { q:'Posso usar minha própria logo?', a:'Sim. O app ganha a sua identidade e a sua logo aparece para os seus alunos (White-label).' },
];

// ─── COMPONENTE DE IMAGEM INTELIGENTE ─────────────────────────────────────────
const AutoImage = ({ source, children, style }) => {
    const [aspect, setAspect] = useState(1);
    
    useEffect(() => {
        let isMounted = true;
        if (typeof source === 'number') {
            const resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');
            const asset = resolveAssetSource(source);
            if (asset && isMounted) {
                setAspect(asset.width / asset.height);
            }
        } else if (source && source.uri) {
            Image.getSize(source.uri, (width, height) => {
                if (isMounted) setAspect(width / height);
            }, () => {});
        }
        return () => { isMounted = false; };
    }, [source]);

    return (
        <View style={[style, { aspectRatio: aspect, position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden' }]}>
            <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            {children && (<View style={[StyleSheet.absoluteFill, { zIndex: 10, pointerEvents: 'box-none' }]}>{children}</View>)}
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
            
            <View style={styles.webWrapper}>
                <ScrollView 
                    ref={scrollRef} 
                    style={{ flex: 1, width: '100%' }} 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* ── HEADER ───────────────────────── */}
                    <View style={[styles.headerRow, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* ─── ZONA DAS IMAGENS ─── */}
                    <View style={styles.imagesContainer}>
                        
                        <AutoImage source={require('../../assets/hero-coach-app.png')} style={{ marginBottom: 10 }}>
                            <TouchableOpacity activeOpacity={0.5} onPress={scrollToPlans} style={styles.invisibleCtaArea} />
                        </AutoImage>

                        <AutoImage source={require('../../assets/mockup-coach-app.png')} style={{ marginBottom: 10 }} />

                        <AutoImage source={require('../../assets/comparativo-coach-app.png')} style={{ marginBottom: 10 }} />

                        <AutoImage source={require('../../assets/recorrencia-coach-app.png')} style={{ marginBottom: 40 }} />

                    </View>

                    {/* ─── ZONA DOS PLANOS (Carrossel Horizontal) ─── */}
                    <View style={styles.wideContainer} onLayout={(e) => { plansSectionY.current = e.nativeEvent.layout.y; }}>
                        
                        <View style={styles.sectionSpacing}>
                            
                            {/* Título e Texto Promocional Substituídos pela Arte Fornecida */}
                            <View style={styles.promoImageWrapper}>
                                <AutoImage source={require('../../assets/titulo-planos.png')} />
                            </View>

                            <View style={styles.swipeHintRow}>
                                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={20} color={TEXT_MUTED} />
                                <Text style={styles.swipeHintText}>Deslize para ver os planos</Text>
                            </View>

                            {/* O CARROSSEL */}
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false} 
                                contentContainerStyle={styles.carouselContainer}
                                decelerationRate="fast"
                                snapToInterval={360}
                            >
                                <TouchableOpacity activeOpacity={0.8} onPress={() => handlePlanChoice('PERSONAL')} style={styles.planImageWrap}>
                                    <AutoImage source={require('../../assets/plano-personal.png')} />
                                </TouchableOpacity>

                                <TouchableOpacity activeOpacity={0.9} onPress={() => handlePlanChoice('ELITE')} style={styles.planImageWrap}>
                                    <AutoImage source={require('../../assets/plano-elite.png')} />
                                </TouchableOpacity>

                                <TouchableOpacity activeOpacity={0.8} onPress={() => handlePlanChoice('NUTRICIONISTA')} style={styles.planImageWrap}>
                                    <AutoImage source={require('../../assets/plano-nutri.png')} />
                                </TouchableOpacity>
                            </ScrollView>

                        </View>

                        {/* ── FAQ ── */}
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

                    </View>

                    {/* ── CTA FINAL ── */}
                    <View style={{ marginTop: 80, width: '100%', alignItems: 'center', maxWidth: 650, alignSelf: 'center' }}>
                        <AutoImage source={require('../../assets/cta-final-coach-app.png')}>
                            <TouchableOpacity activeOpacity={0.5} onPress={scrollToPlans} style={styles.invisibleCtaAreaCTA} />
                        </AutoImage>
                        
                        <TouchableOpacity style={[styles.btnSecondary, { borderColor: '#25D366', marginTop: 24 }]} onPress={handleWhatsApp} activeOpacity={0.8}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                                <Text style={[styles.btnSecondaryText, { color: '#25D366' }]}>Falar com a equipe</Text>
                            </View>
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
    webWrapper: { flex: 1, width: '100%', maxWidth: 1000, alignSelf: 'center', backgroundColor: DARK_BG },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 120 },

    headerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    
    imagesContainer: { width: '100%', maxWidth: 650, alignSelf: 'center' },
    wideContainer: { width: '100%', maxWidth: 1000, alignSelf: 'center' },

    promoImageWrapper: { width: '100%', maxWidth: 850, alignSelf: 'center', marginBottom: 20 },

    swipeHintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
    swipeHintText: { color: TEXT_MUTED, fontSize: 13, fontWeight: 'bold' },
    carouselContainer: { paddingHorizontal: 10, gap: 20, alignItems: 'center', paddingBottom: 20 },
    
    planImageWrap: {
        width: 340,
        backgroundColor: 'transparent'
    },

    invisibleCtaArea: {
        position: 'absolute',
        bottom: '5%',
        left: '10%',
        right: '10%',
        height: '22%',
        zIndex: 20
    },
    invisibleCtaAreaCTA: {
        position: 'absolute',
        bottom: '10%',
        left: '10%',
        right: '10%',
        height: '35%',
        zIndex: 20
    },

    sectionSpacing: { marginTop: 60, width: '100%' },
    sectionMiniTitle: { color: TEXT_MUTED, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center', marginBottom: 12 },
    sectionTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 },

    faqCard: { backgroundColor: SURFACE, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
    faqQ: { color: '#FFF', fontSize: 15, fontWeight: 'bold', flex: 1, paddingRight: 10 },
    faqA: { color: TEXT_MUTED, fontSize: 14, lineHeight: 22, marginTop: 12 },

    btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    btnSecondaryText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});