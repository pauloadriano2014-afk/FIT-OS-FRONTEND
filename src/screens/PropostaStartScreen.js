import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Linking, Platform, SafeAreaView, Animated, Image, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { linksAlunos } from '../utils/linksAlunos';
import ModernResultCard from '../components/ModernResultCard';
import AthleteCard from '../components/AthleteCard';
import FeedbackCard from '../components/FeedbackCard';
import FaqAccordion from '../components/FaqAccordion';
import BonusCard from '../components/BonusCard';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;
const { width } = Dimensions.get('window');

// FAQ adaptado para o Downsell com Fila Standard
const faqList = [
    { q: "Para quem são os planos Start e Fichas?", a: "Para quem tem disciplina para treinar sozinho, mas cansou de seguir treinos genéricos entregues em papéis de academia. No nosso app, você tem a direção exata com a metodologia de um Campeão Natural." },
    { q: "Eu vou ter acompanhamento no WhatsApp?", a: "Sim! Você terá acesso ao nosso PA Coach AI 24h direto no app para tirar dúvidas sobre a metodologia instantaneamente. Além disso, o nosso suporte via WhatsApp fica disponível no formato 'Fila Standard' (onde a prioridade de resposta imediata é exclusiva dos alunos Elite VIP)." },
    { q: "Em quanto tempo eu vejo resultados no meu corpo?", a: "A ciência não falha. Seguindo a metodologia e os treinos em vídeo do aplicativo, nossos alunos relatam mudanças visíveis logo nas primeiras semanas de execução." },
    { q: "Como funciona a Ficha de 8 Semanas?", a: "É um protocolo de 56 dias focado num objetivo específico (como pernas, hipertrofia ou emagrecimento). Você faz uma avaliação no dia 1 e outra no dia 56 para medirmos sua evolução." }
];

export default function PropostaStartScreen({ route }) {
    const leadName = route?.params?.nome || 'Atleta';
    const [timeLeft, setTimeLeft] = useState(null);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const initTimer = async () => {
            try {
                const storedTime = await AsyncStorage.getItem(`@expire_time_start_${leadName}`);
                const now = Date.now();
                let expireTime;

                if (storedTime) {
                    expireTime = parseInt(storedTime, 10);
                } else {
                    expireTime = now + (24 * 60 * 60 * 1000); 
                    await AsyncStorage.setItem(`@expire_time_start_${leadName}`, expireTime.toString());
                }

                const diff = Math.floor((expireTime - now) / 1000);
                setTimeLeft(diff > 0 ? diff : 0);
            } catch (e) {
                setTimeLeft(24 * 60 * 60); 
            }
        };
        initTimer();
    }, [leadName]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
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
        const text = `Fala, Coach! Quero começar minha transformação com o ${plan}. Bora! 👊`;
        Linking.openURL(`https://wa.me/5541997991346?text=${encodeURIComponent(text)}`);
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
                <View style={styles.expiredBox}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={64} color="#FF3B30" />
                    <Text style={styles.expiredTitle}>OFERTA EXPIRADA</Text>
                    <Text style={styles.expiredDesc}>O seu convite perdeu a validade. Fale com o suporte.</Text>
                    <TouchableOpacity style={styles.expiredBtn} onPress={() => handleWhatsAppCTA('Lista de Espera')}>
                        <Text style={styles.expiredBtnText}>FALAR COM O SUPORTE</Text>
                    </TouchableOpacity>
                </View>
            </RootComponent>
        );
    }

    return (
        <RootComponent style={styles.container}>
            <Image source={{ uri: linksAlunos.background }} style={styles.backgroundImage} blurRadius={2} />

            <View style={styles.webWrapper}>
                <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* HERO */}
                    <View style={styles.heroSection}>
                        <View style={styles.timerBadge}>
                            <MaterialCommunityIcons name="timer-sand" size={16} color="#FF3B30" />
                            <Text style={styles.timerText}>ESTE LINK EXPIRA EM: {formatTime(timeLeft)}</Text>
                        </View>
                        <Text style={styles.heroGreeting}>FALA, {leadName.toUpperCase()}! ⚡</Text>
                        <Text style={styles.heroTitle}>SUA CHANCE DE TREINAR COM A <Text style={{color: '#4DE38F'}}>NOSSA METODOLOGIA</Text></Text>
                        <Text style={styles.heroSub}>O fim das fichas de papel da academia. Tenha acesso aos treinos, vídeos e o método que transforma corpos.</Text>
                    </View>

                    {/* VÍDEO PRINCIPAL */}
                    <View style={styles.videoSection}>
                        <Text style={styles.sectionTitle}>NÃO ACREDITE SÓ EM MIM</Text>
                        <Text style={styles.sectionSub}>Veja quem já transformou o corpo e a rotina com o nosso método.</Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo('tvYMAVQpt8I', false)}
                        </View>
                    </View>

                    {/* MENTOR */}
                    <View style={styles.mentorSection}>
                        <LinearGradient colors={['rgba(26,26,26,0)', 'rgba(26,26,26,1)']} style={styles.mentorGradientBg} />
                        <View style={styles.mentorContent}>
                            <View style={styles.mentorBadgeRow}>
                                <View style={styles.featureIconBox}><MaterialCommunityIcons name="card-account-details-star-outline" size={28} color="#4DE38F" /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mentorSub}>EU JÁ ESTIVE DO OUTRO LADO</Text>
                                    <Text style={styles.mentorLabelHeader}>O CRIADOR DO MÉTODO:</Text>
                                    <Text style={styles.mentorNameStrong}>PAULO ADRIANO</Text>
                                </View>
                            </View>
                            <Text style={styles.mentorDesc}>
                                "Eu sei o que é carregar peso extra e treinar errado. Eu já fui um 'ex-gordo' com 97kg e usei a ciência para me transformar em um Campeão Natural com 77kg. A metodologia que utilizei está toda detalhada no aplicativo."
                            </Text>
                            <View style={styles.swipeHintContainer}>
                                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={24} color="#4DE38F" />
                                <Text style={styles.swipeHintText}>ARRASTE PARA O LADO E VEJA A TRANSFORMAÇÃO</Text>
                            </View>
                            <ScrollView horizontal snapToInterval={340} snapToAlignment="center" decelerationRate="fast" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainerMentor}>
                                <View style={styles.imageColMentor}>
                                    <View style={[styles.imagePlaceholderMentor, { filter: 'grayscale(100%)' }]}>
                                        <Image source={{ uri: linksAlunos.mentor_desafio_9x16 }} style={styles.resultImageMentorContain} />
                                    </View>
                                </View>
                                <View style={styles.imageColMentor}>
                                    <View style={styles.imagePlaceholderMentor}>
                                        <Image source={{ uri: linksAlunos.mentor_vitoria_9x16 }} style={styles.resultImageMentorContain} />
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>

                    {/* ARSENAL */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>A TECNOLOGIA A SEU FAVOR</Text>
                    <Text style={styles.sectionSub}>Conheça o seu aplicativo exclusivo.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="dumbbell" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Execução Impecável</Text>
                            <Text style={styles.arsenalDesc}>Vídeos de todos os exercícios da sua série, explicação da técnica e métodos de alta intensidade.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="camera-front-variant" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Avaliações no App</Text>
                            <Text style={styles.arsenalDesc}>Envie suas fotos e medidas pelo sistema para registrarmos o seu ponto de partida e a sua evolução.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="chat-processing-outline" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>PA Coach AI 24h</Text>
                            <Text style={styles.arsenalDesc}>Tire dúvidas rápidas sobre a metodologia com o nosso assistente virtual treinado por mim, direto no app.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="chart-areaspline" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Painel Evolutivo</Text>
                            <Text style={styles.arsenalDesc}>Gráficos de peso, medidas e histórico visual de todas as suas fotos para você acompanhar seu progresso.</Text>
                        </View>
                    </ScrollView>

                    {/* PROVA SOCIAL COMPLETA (12 CARDS) */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>A METODOLOGIA FUNCIONA</Text>
                    <Text style={styles.sectionSub}>Deslize para ver o que a disciplina somada à ciência pode fazer.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <ModernResultCard goal="🔥 DA FALTA DE TÔNUS À DEFINIÇÃO ESCULPIDA (Bernard)" montageUri={linksAlunos.bernard_montagem} />
                        <ModernResultCard goal="🏆 RECOMPOSIÇÃO CORPORAL E PERDA DE GORDURA (Paulo)" montageUri={linksAlunos.paulo_montagem} />
                        <ModernResultCard goal="❤️ SAÚDE E ESTÉTICA: VENCENDO A GORDURA VISCERAL (Allan)" montageUri={linksAlunos.allan_montagem} />
                        <ModernResultCard goal="⏳ O FIM DO TREINO FOFO E A CINTURA FINA (Evelyn)" montageUri={linksAlunos.evelyn_montagem} />
                        <ModernResultCard goal="💪 TRANSFORMANDO OBESIDADE EM PERFORMANCE (Pedro)" montageUri={linksAlunos.pedro_montagem} />
                        <ModernResultCard goal="⚡️ CORPO TOTALMENTE RECONSTRUÍDO (Ana)" montageUri={linksAlunos.ana_montagem} />
                        <ModernResultCard goal="💣 MASSA MUSCULAR E DENSIDADE REAL (Jean)" montageUri={linksAlunos.jean_montagem} />
                        <ModernResultCard goal="⏱️ CHOQUE DE REALIDADE EM APENAS 11 DIAS (Yasmin)" montageUri={linksAlunos.yasmin_montagem} />
                        <ModernResultCard goal="⚖️ COMPOSIÇÃO CORPORAL TOTALMENTE NOVA (Vane)" montageUri={linksAlunos.vane_montagem} />
                        <ModernResultCard goal="🥊 ATACANDO A GORDURA ABDOMINAL (Bruno)" montageUri={linksAlunos.bruno_montagem} />
                        <ModernResultCard goal="🔥 SILHUETA RENOVADA E BARRIGA CHAPADA (Bruna)" montageUri={linksAlunos.bruna_montagem} />
                        <ModernResultCard goal="🏆 DA CONSTRUÇÃO AO PALCO COM SIMETRIA (Adri)" montageUri={linksAlunos.adri_montagem} />
                    </ScrollView>

                    {/* FEEDBACKS WHATSAPP COMPLETOS (7 CARDS) */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>O QUE ELES DIZEM NO WHATSAPP</Text>
                    <Text style={styles.sectionSub}>A realidade de quem vive o método todos os dias.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <FeedbackCard uri={linksAlunos.feedback_paloma} legend="🤫 10KG ELIMINADOS: CONTRA FATOS NÃO HÁ ARGUMENTOS (Paloma)" />
                        <FeedbackCard uri={linksAlunos.feedback_eduardo} legend="🚀 A CHAVE VIROU: 5KG ELIMINADOS EM APENAS 42 DIAS (Eduardo)" />
                        <FeedbackCard uri={linksAlunos.feedback_anne} legend="👖 MEDIDAS DESPENCANDO: A FELICIDADE DA CALÇA LARGONA (Anne)" />
                        <FeedbackCard uri={linksAlunos.feedback_juliana} legend="🥗 DIETA SEM SOFRIMENTO E RESULTADOS RÁPIDOS (Juliana)" />
                        <FeedbackCard uri={linksAlunos.feedback_thiago} legend="🎯 DISCIPLINA QUE GERA RESULTADO: QUASE 4KG OFF (Thiago)" />
                        <FeedbackCard uri={linksAlunos.feedback_yasmin} legend="🔥 DERRETENDO GORDURA E RECUPERANDO O GUARDA-ROUPA (Yasmin)" />
                        <FeedbackCard uri={linksAlunos.feedback_gleiber} legend="⚡ SHAPE RESPONDENDO E ABDÔMEN SECANDO (Gleiber)" />
                    </ScrollView>

                    {/* BÔNUS INCLUSO */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>BÔNUS INCLUSO</Text>
                    <Text style={styles.sectionSub}>Você ganha acesso gratuito a este material complementar.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <BonusCard uri={linksAlunos.ebook_5dicas} title="E-book: 5 Dicas de Emagrecimento" subtitle="O pontapé inicial para a queima." isAudio={false} price="14,90" unlockText="INCLUSO NOS PLANOS" />
                    </ScrollView>
                    <Text style={styles.bonusLockedText}>🔒 Os e-books de Receitas, Guias de Hipertrofia e Audiobooks são exclusivos para assinantes dos planos Elite VIP e Performance.</Text>

                    {/* ESCOLHA SEU PLANO */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>ESCOLHA SEU PLANO</Text>
                    <View style={styles.plansContainer}>
                        
                        {/* FICHAS 8 SEMANAS */}
                        <View style={[styles.planCard, { borderColor: '#333' }]}>
                            <Text style={[styles.planName, { color: '#FFF' }]}>FICHA 8 SEMANAS</Text>
                            <Text style={styles.planDesc}>Foco total. Um protocolo de 56 dias para o seu objetivo.</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={styles.planItem}>✓ Treinos no App com Vídeos e Técnicas</Text>
                                <Text style={styles.planItem}>✓ PA Coach AI 24h (Tira-Dúvidas)</Text>
                                <Text style={styles.planItem}>✓ Suporte Whats (Fila Standard)</Text>
                                <Text style={styles.planItem}>✓ 1 Avaliação Inicial e 1 Final (Dia 56)</Text>
                                <Text style={styles.planItem}>✓ Acesso ao E-book 5 Dicas</Text>
                                
                                <Text style={[styles.planItem, { color: '#FF3B30', marginTop: 10 }]}>🔒 Recursos Premium Bloqueados:</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Análise Biomecânica de Vídeo</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Calculadora de Cargas (1RM)</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Catálogo de Audiobooks/Bônus</Text>
                            </View>

                            <View style={styles.pricingGrid}>
                                <View style={styles.priceRow}><Text style={[styles.pricePeriod, {color: '#FFF'}]}>Pagamento Único</Text><Text style={[styles.priceValue, {color: '#FFF'}]}>R$ 97,00</Text></View>
                            </View>
                            <TouchableOpacity style={[styles.buyBtn, { backgroundColor: '#222', borderColor: '#444', borderWidth: 1 }]} onPress={() => handleWhatsAppCTA('Ficha de 8 Semanas')}>
                                <Text style={[styles.buyBtnText, { color: '#FFF' }]}>QUERO A FICHA</Text>
                            </TouchableOpacity>
                        </View>

                        {/* PLANO START */}
                        <Animated.View style={[styles.planCard, { borderColor: '#4DE38F', borderWidth: 2, transform: [{ scale: pulseAnim }] }]}>
                            <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>MAIS VENDIDO</Text></View>
                            <Text style={[styles.planName, { color: '#4DE38F' }]}>PLANO START</Text>
                            <Text style={[styles.planDesc, { color: '#CCC' }]}>Treine com a metodologia o ano todo.</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Treinos no App com Vídeos e Técnicas</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ PA Coach AI 24h (Tira-Dúvidas)</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Suporte Whats (Fila Standard)</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Avaliação Inicial + 1 a cada 30 dias</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Acesso ao E-book 5 Dicas</Text>
                                
                                <Text style={[styles.planItem, { color: '#FF3B30', marginTop: 10 }]}>🔒 Recursos Premium Bloqueados:</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Análise Biomecânica de Vídeo</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Calculadora de Cargas (1RM)</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Catálogo de Audiobooks/Bônus</Text>
                            </View>

                            <View style={styles.pricingGrid}>
                                <View style={styles.priceRow}><Text style={[styles.pricePeriod, {color: '#4DE38F'}]}>Mensal</Text><Text style={[styles.priceValue, {color: '#4DE38F'}]}>R$ 69,90</Text></View>
                            </View>
                            <TouchableOpacity onPress={() => handleWhatsAppCTA('Plano Start')}>
                                <LinearGradient colors={['#4DE38F', '#2bb368']} style={styles.buyBtnGradient}>
                                    <Text style={[styles.buyBtnText, { color: '#000' }]}>COMEÇAR START</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    <FaqAccordion faqs={faqList} />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>PAULO ADRIANO TEAM © 2026</Text>
                    </View>
                </ScrollView>
            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { height: isWeb ? '100vh' : '100%', backgroundColor: '#0a0a0a', position: 'relative' },
    backgroundImage: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute', top: 0, left: 0, opacity: 0.15 }, 
    webWrapper: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#222', backgroundColor: 'rgba(17,17,17,0.9)' }, 
    scrollContent: { flexGrow: 1, padding: 25, paddingBottom: 120 },
    
    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B3015', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FF3B30', marginBottom: 25 },
    timerText: { color: '#FF3B30', fontWeight: '900', fontSize: 12, marginLeft: 8, letterSpacing: 1 },
    heroGreeting: { color: '#888', fontWeight: '900', fontSize: 14, letterSpacing: 2, marginBottom: 10 },
    heroTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 38, letterSpacing: -1, marginBottom: 15 },
    heroSub: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },

    videoSection: { marginBottom: 50 },
    videoContainer9x16: { width: '100%', maxWidth: 280, aspectRatio: 9/16, backgroundColor: '#222', borderRadius: 16, overflow: 'hidden', alignSelf: 'center', marginTop: 20, borderWidth: 1, borderColor: '#333', position: 'relative' },

    mentorSection: { marginBottom: 40, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
    mentorGradientBg: { ...StyleSheet.absoluteFillObject },
    mentorContent: { padding: 20, flexDirection: 'column' }, 
    mentorBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 5, width: '100%' },
    mentorSub: { color: '#888', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
    mentorLabelHeader: { color: '#4DE38F', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    mentorNameStrong: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 2 },
    mentorDesc: { color: '#BBB', fontSize: 15, lineHeight: 24, fontStyle: 'italic', textAlign: 'left', marginTop: 15, marginBottom: 20, paddingHorizontal: 5, width: '100%' }, 
    
    swipeHintContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 8, backgroundColor: '#4DE38F15', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, alignSelf: 'center', borderWidth: 1, borderColor: '#4DE38F30' },
    swipeHintText: { color: '#4DE38F', fontSize: 12, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
    carouselContainerMentor: { paddingHorizontal: 10, paddingBottom: 20 },
    imageColMentor: { width: 330, alignItems: 'center', justifyContent: 'center', marginRight: 10 }, 
    imagePlaceholderMentor: { width: '100%', aspectRatio: 9/16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'transparent' }, 
    resultImageMentorContain: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 14 }, 

    sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, marginBottom: 5 },
    sectionSub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 30, paddingHorizontal: 10 },
    bonusLockedText: { color: '#888', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: -10, paddingHorizontal: 20 },
    
    arsenalCard: { width: width > 600 ? 250 : width * 0.7, backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A', marginRight: 15, alignItems: 'flex-start' },
    featureIconBox: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#4DE38F15', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#4DE38F30' },
    arsenalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    arsenalDesc: { color: '#888', fontSize: 13, lineHeight: 20 },
    carouselContainer: { paddingLeft: 0, paddingRight: 20, paddingBottom: 20 },

    plansContainer: { gap: 25, marginTop: 10, marginBottom: 40 },
    planCard: { backgroundColor: '#161616', padding: 25, borderRadius: 24, borderWidth: 1, position: 'relative' },
    planName: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 5, textAlign: 'center' },
    planDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 25 },
    planItems: { gap: 12, marginBottom: 25 },
    planItem: { fontSize: 14, color: '#AAA', fontWeight: '500' },
    pricingGrid: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 15, marginBottom: 25, gap: 10 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 8 },
    pricePeriod: { color: '#888', fontSize: 14, fontWeight: '600' },
    priceValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    buyBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
    buyBtnGradient: { padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    buyBtnText: { fontWeight: '900', fontSize: 15, letterSpacing: 1 },
    recommendedBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#4DE38F', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 12 },
    recommendedText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },

    expiredBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#0a0a0a' },
    expiredTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
    expiredDesc: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    expiredBtn: { backgroundColor: '#222', padding: 18, borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
    expiredBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
    footerText: { color: '#666', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});