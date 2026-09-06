// src/screens/PropostaScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Linking, Platform, SafeAreaView, Animated, Image, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { linksAlunos } from '../utils/linksAlunos';
import AthleteCard from '../components/AthleteCard';
import FaqAccordion from '../components/FaqAccordion';
import PlanCard from '../components/PlanCard';
import ExpandableBeforeAfterGrid from '../components/ExpandableBeforeAfterGrid';
import ExpandableWhatsAppGrid from '../components/ExpandableWhatsAppGrid';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

const API_BASE = 'https://fitos-final.onrender.com';

const faqList = [
    { q: "Para quem é a Consultoria Elite?", a: "Funciona tanto pra quem está começando e não sabe por onde ir… quanto pra quem já treina mas não vê mais resultado. No nosso app exclusivo, você tem a direção exata do que fazer, sem treinos genéricos de papel." },
    { q: "E se eu não tiver tempo para treinar todos os dias?", a: "A culpa de não ter resultados não é a falta de tempo, é a falta de estratégia. Se você só tem 3 dias na semana ou 45 minutos por dia, seu treino será cirurgicamente montado para hipertrofiar ou secar dentro dessa janela de tempo. O plano se adapta à sua rotina, não o contrário." },
    { q: "Como funciona a análise de vídeo por IA?", a: "É simples: você grava 10 segundos da sua execução direto no App. O sistema avalia seus ângulos e te dá o feedback na hora. É o fim da dúvida se você está fazendo o movimento certo para o músculo crescer." },
    { q: "Vou ter que fazer dietas malucas e restritivas?", a: "De jeito nenhum. No plano Elite VIP, sua estratégia será calculada para a sua realidade. Você vai comer o que gosta, mas com as quantidades perfeitas para destravar a queima de gordura e ganho de massa." },
    { q: "Em quanto tempo eu vejo resultados no meu corpo?", a: "A ciência não falha. Nossos alunos, quando seguem a direção certa que entregamos, costumam relatar mudanças visíveis no espelho e na balança logo nas primeiras semanas." },
    { q: "O suporte é com um robô ou diretamente com você?", a: "Os dois! Você tem o bot PA Coach AI 24h para dúvidas rápidas, e no plano Elite VIP, você tem acesso ao meu WhatsApp pessoal para ajustes, garantindo que você nunca fique travado no processo." }
];

const DEFAULT_CARDS = [
    {
        id: 'default-performance',
        nome: 'PERFORMANCE',
        descricao: "",
        destaque: false,
        badgeTexto: '',
        itensInclusos: [],
        itensExcluidos: [],
        itemDestaque: '',
        bonusTitulo: '',
        bonusItens: [],
        precos: { mensal: { valor: 197, descontoPerc: 0 }, trimestral: { valor: 397, descontoPerc: 0 }, semestral: { valor: 697, descontoPerc: 0 }, anual: { valor: 1197, descontoPerc: 0 } },
        ctaTexto: 'QUERO O PLANO PERFORMANCE',
    },
    {
        id: 'default-elite',
        nome: 'ELITE VIP',
        descricao: '',
        destaque: true,
        badgeTexto: '',
        itensInclusos: [],
        itensExcluidos: [],
        itemDestaque: '',
        bonusTitulo: '',
        bonusItens: [],
        precos: { mensal: { valor: 297, descontoPerc: 0 }, trimestral: { valor: 597, descontoPerc: 0 }, semestral: { valor: 1097, descontoPerc: 0 }, anual: { valor: 1890, descontoPerc: 0 } },
        ctaTexto: 'QUERO O PLANO ELITE VIP',
    },
];

const SmartBanner = ({ source, children, style }) => {
    const [imageHeight, setImageHeight] = useState(200); 
    
    const screenWidth = Dimensions.get('window').width;
    const maxWidth = 600;
    const availableWidth = screenWidth > maxWidth ? maxWidth : screenWidth;
    const paddingHorizontal = 40; 
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

const MentorCarousel = () => {
    const screenWidth = Dimensions.get('window').width;
    const maxWidth = 600;
    const availableWidth = screenWidth > maxWidth ? maxWidth : screenWidth;
    const containerWidth = availableWidth - 40; 

    return (
        <View style={styles.smartBannerContainer}>
            <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                bounces={true}
                nestedScrollEnabled={true}
            >
                <View style={{ width: containerWidth }}>
                    <SmartBanner 
                        source={require('../../assets/mentor-app.png')} 
                        style={{ marginBottom: 0, borderWidth: 0, borderRadius: 0 }} 
                    />
                </View>
                <View style={{ width: containerWidth }}>
                    <SmartBanner 
                        source={require('../../assets/mentor-transformacao.jpg')} 
                        style={{ marginBottom: 0, borderWidth: 0, borderRadius: 0 }} 
                    />
                </View>
            </ScrollView>
        </View>
    );
};

export default function PropostaScreen({ route, navigation }) {
    const rawName = route?.params?.nome?.trim() || '';
    const genericNames = ['novo aluno', 'nova aluna', 'aluno', 'aluna', 'teste', 'atleta', 'lead', 'cliente'];
    const isGeneric = !rawName || genericNames.includes(rawName.toLowerCase());
    
    const displayName = isGeneric ? 'ATLETA' : rawName.toUpperCase();
    const linkId = route?.params?.id?.trim() || '';
    const storageKeyName = linkId || (isGeneric ? 'default_lead' : rawName.toLowerCase());
    const isPreview = ['true', true].includes(route?.params?.preview);

    const [showVideo, setShowVideo] = useState(false);

    const handlePreviewBack = () => {
        if (navigation?.canGoBack?.()) {
            navigation.goBack();
        } else if (navigation?.navigate) {
            navigation.navigate('AdminDashboard');
        }
    };

    const coachParam = route?.params?.coach?.trim()?.toLowerCase() || '';
    const telefoneParam = route?.params?.telefone?.trim() || '';
    let waNumber = '5541997991346'; 
    if (telefoneParam) { waNumber = telefoneParam.replace(/\D/g, ''); } 
    else if (['adri', 'adriele', 'japinha'].includes(coachParam)) { waNumber = '5541998465582'; }

    const ofertaSlug = route?.params?.oferta?.trim() || '';
    const [cards, setCards] = useState(DEFAULT_CARDS);

    useEffect(() => {
        if (!ofertaSlug) return;
        let cancelado = false;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/proposta-ofertas?slug=${encodeURIComponent(ofertaSlug)}`);
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelado && data?.oferta?.cards?.length) {
                    setCards(data.oferta.cards);
                }
            } catch (e) {
                console.log('Erro ao buscar oferta, usando preços padrão', e);
            }
        })();
        return () => { cancelado = true; };
    }, [ofertaSlug]);

    const [timeLeft, setTimeLeft] = useState(null);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const initTimer = async () => {
            try {
                const storedTime = await AsyncStorage.getItem(`@expire_time_${storageKeyName}`);
                const now = Date.now();
                let expireTime = storedTime ? parseInt(storedTime, 10) : now + (24 * 60 * 60 * 1000);
                if (!storedTime) await AsyncStorage.setItem(`@expire_time_${storageKeyName}`, expireTime.toString());
                const diff = Math.floor((expireTime - now) / 1000);
                setTimeLeft(diff > 0 ? diff : 0);
            } catch (e) { setTimeLeft(24 * 60 * 60); }
        };
        initTimer();
    }, [storageKeyName]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const formatTime = (seconds) => {
        if (seconds === null) return "Calculando...";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleWhatsAppCTA = (plan) => {
        const text = `Fala, Coach! Quero destravar meu acesso ao plano ${plan}. Bora começar! 👊`;
        Linking.openURL(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`);
    };

    const renderYouTubeVideo = (videoId, isAutoPlay = false) => {
        const autoPlayParams = isAutoPlay ? `&autoplay=1&mute=1&loop=1&playlist=${videoId}` : '';
        if (isWeb) {
            return React.createElement('iframe', {
                src: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${autoPlayParams}`,
                style: { width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 },
                allowFullScreen: true,
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            });
        }
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <MaterialCommunityIcons name="youtube" size={40} color="#FF0000" />
                <Text style={{color: '#FFF', marginTop: 10}}>Vídeo disponível na versão Web</Text>
            </View>
        );
    };

    if (timeLeft === 0) {
        return (
            <RootComponent style={styles.container}>
                {isPreview && (
                    <TouchableOpacity style={styles.previewBackBtn} onPress={handlePreviewBack} activeOpacity={0.8}>
                        <MaterialCommunityIcons name="arrow-left" size={18} color="#FFF" />
                        <Text style={styles.previewBackBtnText}>VOLTAR AO ADMIN</Text>
                    </TouchableOpacity>
                )}
                <View style={styles.expiredBox}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={64} color="#FF3B30" />
                    <Text style={styles.expiredTitle}>OFERTA EXPIRADA</Text>
                    <Text style={styles.expiredDesc}>O seu convite perdeu a validade. Fale com o suporte.</Text>
                    <TouchableOpacity style={styles.expiredBtn} onPress={() => handleWhatsAppCTA('Lista de Espera')}>
                        <Text style={styles.expiredBtnText}>FALAR COM O COACH</Text>
                    </TouchableOpacity>
                </View>
            </RootComponent>
        );
    }

    return (
        <RootComponent style={styles.container}>
            {isPreview && (
                <TouchableOpacity style={styles.previewBackBtn} onPress={handlePreviewBack} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color="#FFF" />
                    <Text style={styles.previewBackBtnText}>VOLTAR AO ADMIN</Text>
                </TouchableOpacity>
            )}

            <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.topbar}>
                    <Text style={styles.topbarText}>
                        <MaterialCommunityIcons name="timer-sand" size={14} color="#FF3B30" />
                        {' '}ESTE LINK EXPIRA EM: {formatTime(timeLeft)}
                    </Text>
                </View>

                <View style={styles.wrap}>
                    
                    <Text style={styles.heroGreeting}>FALA, {displayName}! ⚡</Text>
                    
                    <SmartBanner source={require('../../assets/hero-app.png')} />
                    
                    <View style={styles.videoContainer}>
                        {renderYouTubeVideo('tvYMAVQpt8I', false)}
                    </View>

                    <SmartBanner source={require('../../assets/resposta-problemas-app.png')} />

                    <View style={styles.connectedSection}>
                        <SmartBanner source={require('../../assets/comparativo-planos-mobile.png')} style={styles.flushBottom} />
                        <View style={styles.plansContainer}>
                            {cards.map((card) => (
                                <PlanCard key={card.id} card={card} pulseAnim={pulseAnim} onBuy={handleWhatsAppCTA} />
                            ))}
                        </View>
                    </View>

                    <MentorCarousel />

                    {!showVideo ? (
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowVideo(true)} style={{ width: '100%' }}>
                            <SmartBanner source={require('../../assets/ia-app.png')}>
                                <View style={styles.iaDemoContainer}>
                                    <View style={styles.playButtonOverlay}>
                                        <MaterialCommunityIcons name="play" size={50} color="#000" style={{ marginLeft: 4 }} />
                                    </View>
                                    <View style={styles.iaDemoTextContainer}>
                                        <Text style={styles.iaDemoText}>TOCAR PARA VER DEMONSTRAÇÃO</Text>
                                    </View>
                                </View>
                            </SmartBanner>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.videoContainer}>
                            {renderYouTubeVideo(linksAlunos.ai_video_id, true)}
                        </View>
                    )}

                    <SmartBanner source={require('../../assets/dor-tem-solucao-app.png')} style={{ marginBottom: 5 }} />
                    <SmartBanner source={require('../../assets/subtitulo-resultados-app.png')} style={{ marginBottom: 25, borderWidth: 0, backgroundColor: 'transparent' }} />
                    
                    <View style={styles.listPadding}>
                        <ExpandableBeforeAfterGrid />
                    </View>

                    <SmartBanner source={require('../../assets/feedbacks-app.png')} style={{ marginBottom: 5 }} />
                    <SmartBanner source={require('../../assets/subtitulo-feedbacks-app.png')} style={{ marginBottom: 25, borderWidth: 0, backgroundColor: 'transparent' }} />
                    
                    <View style={styles.listPadding}>
                        <ExpandableWhatsAppGrid />
                    </View>

                    <SmartBanner source={require('../../assets/padrao-elite-app.png')} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <AthleteCard uri={linksAlunos.equipe_adri} title="LIDERANDO PELO EXEMPLO" desc="Eu e minha esposa Adri dividindo os palcos." />
                        <AthleteCard uri={linksAlunos.aluna_medalha} title="O RESULTADO DO TRABALHO" desc="Aluna de 39 anos de idade, shape competitivo." />
                        <AthleteCard uri={linksAlunos.felipe_podio} title="MÉTODO VALIDADO" desc="A ciência não falha." />
                    </ScrollView>

                    <SmartBanner source={require('../../assets/bonus-app.png')} />
                    
                    <View style={styles.faqSection}>
                        <Text style={styles.sectionTitle}>AINDA TEM DÚVIDAS?</Text>
                        <FaqAccordion faqs={faqList} />
                    </View>

                    {/* BOTÃO RESTAURADO: O texto é gerado pelo código sobre a imagem */}
                    <SmartBanner source={require('../../assets/cta-final-app.png')} style={{ marginBottom: 20 }}>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => handleWhatsAppCTA('Elite VIP')} style={styles.absoluteCtaBox}>
                            <Animated.Text adjustsFontSizeToFit numberOfLines={1} style={[styles.absoluteCtaText, { transform: [{ scale: pulseAnim }] }]}>
                                QUERO COMEÇAR AGORA
                            </Animated.Text>
                        </TouchableOpacity>
                    </SmartBanner>

                </View>

                <View style={styles.footer}>
                    <Text style={styles.brand}>☆ PA ELITE TEAM ☆</Text>
                    <Text style={styles.footerSubText}>Página segura. Oferta com tempo limitado.</Text>
                </View>

            </ScrollView>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { height: isWeb ? '100vh' : '100%', backgroundColor: '#000000', position: 'relative' },
    previewBackBtn: { position: 'absolute', top: isWeb ? 16 : 55, left: 16, zIndex: 999, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    previewBackBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    
    scrollContent: { flexGrow: 1, backgroundColor: '#000000', paddingBottom: 100 },
    
    wrap: { width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: '#000000', paddingHorizontal: 20 }, 
    
    topbar: { paddingVertical: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a', backgroundColor: '#050505', width: '100%', marginBottom: 15 },
    topbarText: { color: '#FF3B30', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    
    heroGreeting: { color: '#888', fontWeight: '900', fontSize: 14, letterSpacing: 2, marginBottom: 15, alignSelf: 'center' },
    
    smartBannerContainer: { 
        width: '100%', 
        borderRadius: 12, 
        overflow: 'hidden', 
        marginBottom: 25, 
        backgroundColor: '#111', 
        borderWidth: 1, 
        borderColor: '#1a1a1a',
        alignSelf: 'center'
    },
    
    videoContainer: { width: '100%', aspectRatio: 9/16, backgroundColor: '#111', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(155, 93, 229, 0.3)', marginBottom: 25 },
    
    iaDemoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
    playButtonOverlay: { backgroundColor: 'rgba(77, 227, 143, 0.9)', borderRadius: 60, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', shadowColor: '#4DE38F', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
    iaDemoTextContainer: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' },
    iaDemoText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1, textAlign: 'center' },

    connectedSection: { marginBottom: 25 },
    flushBottom: { marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
    plansContainer: { width: '100%', padding: 20, backgroundColor: '#0a0a0a', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', borderTopWidth: 0 },
    
    listPadding: { width: '100%', marginBottom: 30 },
    carouselContainer: { paddingBottom: 30, gap: 15 },
    
    faqSection: { width: '100%', paddingVertical: 20, marginBottom: 25 },
    sectionTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, marginBottom: 20, textTransform: 'uppercase' },

    // BOTÃO FINAL: Fica posicionado em relação ao fundo da imagem (12% acima da base)
    absoluteCtaBox: { 
        position: 'absolute', 
        bottom: isWeb ? '10%' : '12%', // Pode afinar aqui pra subir/descer
        left: '5%', 
        right: '5%', 
        height: '18%', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 20 
    },
    // O pulo do gato horizontal: Reduz a fonte e tira o espaçamento só no celular pra caber
    absoluteCtaText: { 
        color: '#FFFFFF', 
        fontWeight: '900', 
        fontSize: isWeb ? 22 : 16, 
        textShadowColor: 'rgba(77, 227, 143, 0.8)', 
        textShadowOffset: { width: 0, height: 0 }, 
        textShadowRadius: 15, 
        letterSpacing: isWeb ? 1 : 0 
    },

    expiredBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#000000' },
    expiredTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
    expiredDesc: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    expiredBtn: { backgroundColor: '#1a1a1a', padding: 18, borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    expiredBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    footer: { alignItems: 'center', paddingVertical: 40, borderTopWidth: 1, borderTopColor: '#161616', backgroundColor: '#000000' },
    brand: { color: '#4DE38F', fontWeight: '900', fontSize: 16, letterSpacing: 2, marginBottom: 8 },
    footerSubText: { color: '#666', fontSize: 12 }
});