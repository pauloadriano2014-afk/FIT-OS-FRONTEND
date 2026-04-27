// src/screens/PropostaStartScreen.js
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

// FAQ adaptado para o Downsell com Fila Standard - MANTIDO
const faqList = [
    { q: "Para quem são os planos Start e Fichas?", a: "Para quem tem disciplina para treinar sozinho, mas cansou de seguir treinos genéricos entregues em papéis de academia. No nosso app, você tem a direção exata com a metodologia de um Campeão Natural." },
    { q: "Eu vou ter acompanhamento no WhatsApp?", a: "Sim! Você terá acesso ao nosso PA Coach AI 24h direto no app para tirar dúvidas sobre a metodologia instantaneamente. Além disso, o nosso suporte via WhatsApp fica disponível no formato 'Fila Standard' (onde a prioridade de resposta imediata é exclusiva dos alunos Elite VIP)." },
    { q: "Em quanto tempo eu vejo resultados no meu corpo?", a: "A ciência não falha. Seguindo a metodologia e os treinos em vídeo do aplicativo, nossos alunos relatam mudanças visíveis logo nas primeiras semanas de execução." },
    { q: "Como funciona a Ficha de 8 Semanas?", a: "É um protocolo de 56 dias focado num objetivo específico (como pernas, hipertrofia ou emagrecimento). Você faz uma avaliação no dia 1 e outra no dia 56 para medirmos sua evolução." }
];

export default function PropostaStartScreen({ route }) {
    // 🔥 FILTRO INTELIGENTE DE NOME (ANTI-ROBÔ)
    const rawName = route?.params?.nome?.trim() || '';
    const genericNames = ['novo aluno', 'nova aluna', 'aluno', 'aluna', 'teste', 'atleta', 'lead', 'cliente'];
    const isGeneric = !rawName || genericNames.includes(rawName.toLowerCase());
    
    // Se for genérico, chama de ATLETA (unissex e forte). Se não, usa o nome real.
    const displayName = isGeneric ? 'ATLETA' : rawName.toUpperCase();
    const storageKeyName = isGeneric ? 'default_lead' : rawName.toLowerCase();

    const [timeLeft, setTimeLeft] = useState(null);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const initTimer = async () => {
            try {
                const storedTime = await AsyncStorage.getItem(`@expire_time_start_${storageKeyName}`);
                const now = Date.now();
                let expireTime;

                if (storedTime) {
                    expireTime = parseInt(storedTime, 10);
                } else {
                    expireTime = now + (24 * 60 * 60 * 1000); 
                    await AsyncStorage.setItem(`@expire_time_start_${storageKeyName}`, expireTime.toString());
                }

                const diff = Math.floor((expireTime - now) / 1000);
                setTimeLeft(diff > 0 ? diff : 0);
            } catch (e) {
                setTimeLeft(24 * 60 * 60); 
            }
        };
        initTimer();
    }, [storageKeyName]);

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
                    
                    {/* HERO - SPIN SELLING 🔥 */}
                    <View style={styles.heroSection}>
                        <View style={styles.timerBadge}>
                            <MaterialCommunityIcons name="timer-sand" size={16} color="#FF3B30" />
                            <Text style={styles.timerText}>ESTE LINK EXPIRA EM: {formatTime(timeLeft)}</Text>
                        </View>
                        <Text style={styles.heroGreeting}>FALA, {displayName}! ⚡</Text>
                        <Text style={styles.heroTitle}>VOCÊ NÃO PRECISA DE MAIS UM TREINO... VOCÊ PRECISA DE <Text style={{color: '#4DE38F'}}>UM MÉTODO QUE FAÇA SEU CORPO RESPONDER</Text></Text>
                        <Text style={styles.heroSub}>Se você já treina e mesmo assim não vê resultado, o problema não é a sua falta de esforço — é a falta de direção. E continuar assim só vai te fazer perder mais tempo e continuar sem resultado.</Text>
                    </View>

                    {/* VÍDEO PRINCIPAL */}
                    <View style={styles.videoSection}>
                        <Text style={styles.sectionTitle}>NÃO ACREDITE SÓ EM MIM</Text>
                        <Text style={styles.sectionSub}>Veja quem já transformou o corpo e a rotina porque decidiu parar de tentar sozinho.</Text>
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

                    {/* ARSENAL - SPIN SELLING 🔥 */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>A RESPOSTA PARA SEUS PROBLEMAS</Text>
                    <Text style={styles.sectionSub}>Nós eliminamos as falhas ocultas que te impedem de chegar ao shape dos sonhos.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="shield-check" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Treino Seguro e Sem Dor</Text>
                            <Text style={styles.arsenalDesc}>Você finalmente vai sentir o músculo trabalhando — sem dor nas articulações e sem ficar perdido tentando lembrar como executar a série.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="trending-up" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>O Fim da Estagnação</Text>
                            <Text style={styles.arsenalDesc}>Seu corpo não trava — toda vez que o peso ou os músculos pararem de responder, nós ajustamos a estratégia antes que você desanime.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="chat-processing-outline" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Você Nunca Estará Sozinho</Text>
                            <Text style={styles.arsenalDesc}>Você nunca mais fica perdido na academia. Tem uma dúvida? O suporte garante que você sempre saiba qual é o próximo passo.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="chart-areaspline" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Progresso Incontestável</Text>
                            <Text style={styles.arsenalDesc}>Acompanhe cada quilo perdido e cada centímetro ganho no seu Painel Evolutivo. O seu histórico visual nunca mais será esquecido.</Text>
                        </View>
                    </ScrollView>

                    {/* IA HIGHLIGHT - SPIN SELLING 🔥 */}
                    <View style={styles.aiHighlightSection}>
                        <Text style={styles.sectionTitle}>NUNCA MAIS DESPERDICE TEMPO FAZENDO ERRADO</Text>
                        <Text style={styles.sectionSub}>A maioria das pessoas treina errado e nem percebe — por isso o corpo não muda. Aqui, cada repetição sua é ajustada para realmente gerar resultado — sem desperdiçar tempo e sem se machucar.</Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo(linksAlunos.ai_video_id, true)}
                        </View>
                    </View>

                    {/* PROVA SOCIAL COMPLETA (12 CARDS) - SPIN SELLING 🔥 */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>A SUA DOR TEM SOLUÇÃO</Text>
                    <Text style={styles.sectionSub}>Essas pessoas não tinham genética melhor... elas só pararam de tentar sozinhas. Arraste e veja quem superou a estagnação e o sobrepeso com o nosso método.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <ModernResultCard goal="🔥 O FIM DA FLACIDEZ: DE UM CORPO SEM FORMA À DEFINIÇÃO ESCULPIDA (Bernard)" montageUri={linksAlunos.bernard_montagem} />
                        <ModernResultCard goal="🏆 VENCENDO O SOBREPESO: A VIRADA DE CHAVE QUE DERRETEU A GORDURA (Paulo)" montageUri={linksAlunos.paulo_montagem} />
                        <ModernResultCard goal="🔥 DESTRUINDO A GORDURA VISCERAL: O FIM DA BARRIGA TEIMOSA (Allan)" montageUri={linksAlunos.allan_montagem} />
                        <ModernResultCard goal="⏳ O FIM DA GORDURINHA NAS COSTAS: CINTURA FINA E CONFIANÇA PARA VESTIR QUALQUER ROUPA (Evelyn)" montageUri={linksAlunos.evelyn_montagem} />
                        <ModernResultCard goal="💪 DA OBESIDADE À PERFORMANCE: O CORPO QUE ELE ACHOU QUE NUNCA TERIA (Pedro)" montageUri={linksAlunos.pedro_montagem} />
                        <ModernResultCard goal="⚡️ O FIM DA INSEGURANÇA: UM FÍSICO TOTALMENTE RECONSTRUÍDO (Ana)" montageUri={linksAlunos.ana_montagem} />
                        <ModernResultCard goal="💣 VENCENDO A GENÉTICA: DE UM CORPO MAGRO A UMA DENSIDADE REAL (Jean)" montageUri={linksAlunos.jean_montagem} />
                        <ModernResultCard goal="⏱️ A PROVA DE QUE NÃO PRECISA DEMORAR: CHOQUE VISUAL EM 11 DIAS (Yasmin)" montageUri={linksAlunos.yasmin_montagem} />
                        <ModernResultCard goal="⚖️ VENCENDO A LUTA CONTRA A BALANÇA: UM EMAGRECIMENTO REAL, VISÍVEL E DEFINITIVO (Vane)" montageUri={linksAlunos.vane_montagem} />
                        <ModernResultCard goal="🥊 MUITO MAIS QUE QUILOS ELIMINADOS: O RESGATE ABSOLUTO DA AUTOESTIMA E QUALIDADE DE VIDA (Bruno)" montageUri={linksAlunos.bruno_montagem} />
                        <ModernResultCard goal="🔥 O RESGATE DA AUTOESTIMA: SILHUETA NOVA E BARRIGA CHAPADA (Bruna)" montageUri={linksAlunos.bruna_montagem} />
                        <ModernResultCard goal="🏆 QUEBRANDO PLATÔS: DO TREINO COMUM AO PADRÃO DE PALCO (Adri)" montageUri={linksAlunos.adri_montagem} />
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

                    {/* MOMENTO DE COLAPSO ESPECÍFICO PARA O DOWNSELL 🔥 10/10 */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>SEU PONTO DE PARTIDA</Text>
                    <Text style={styles.sectionSub}>
                        Talvez agora não seja o momento de ir para o plano completo… mas isso não significa que você precisa continuar sem resultado.{"\n\n"}
                        Você pode continuar treinando sem direção… ou pode começar agora, mesmo que não seja no plano completo. Você não precisa fazer perfeito... só precisa começar certo.
                    </Text>
                    
                    <View style={styles.plansContainer}>
                        
                        {/* FICHAS 8 SEMANAS */}
                        <View style={[styles.planCard, { borderColor: '#333' }]}>
                            <Text style={[styles.planName, { color: '#FFF' }]}>FICHA 8 SEMANAS</Text>
                            <Text style={styles.planDesc}>Um plano direto ao ponto para você parar de treinar sem direção e começar a ver evolução em poucas semanas. Ideal pra quem quer resultado rápido sem complicação.</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={styles.planItem}>✓ A direção exata do que fazer em cada treino — sem dúvida, sem improviso</Text>
                                <Text style={styles.planItem}>✓ Cada repetição passa a ter correção com nossos vídeos focados em hipertrofia</Text>
                                <Text style={styles.planItem}>✓ Seu corpo será avaliado na largada (Dia 1) e na linha de chegada (Dia 56)</Text>
                                <Text style={styles.planItem}>✓ O suporte tira as dúvidas rápidas, para você não ficar perdido no processo</Text>
                                <Text style={styles.planItem}>✓ Acesso liberado ao E-book: 5 Dicas Infalíveis de Emagrecimento</Text>
                                
                                <Text style={[styles.planItem, { color: '#FF3B30', marginTop: 10 }]}>🔒 Recursos Premium Bloqueados:</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Análise Biomecânica de Vídeo</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Calculadora de Cargas (1RM)</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Catálogo de Audiobooks/Bônus</Text>
                            </View>

                            <View style={styles.pricingGrid}>
                                <View style={styles.priceRow}><Text style={[styles.pricePeriod, {color: '#FFF'}]}>Pagamento Único</Text><Text style={[styles.priceValue, {color: '#FFF'}]}>R$ 97,00</Text></View>
                            </View>
                            <Text style={styles.urgencyText}>⏳ Depois que o tempo acabar, essa condição não volta.</Text>
                            <TouchableOpacity style={[styles.buyBtn, { backgroundColor: '#222', borderColor: '#444', borderWidth: 1 }]} onPress={() => handleWhatsAppCTA('Ficha de 8 Semanas')}>
                                <Text style={[styles.buyBtnText, { color: '#FFF' }]}>QUERO PARAR DE TREINAR SEM DIREÇÃO</Text>
                            </TouchableOpacity>
                        </View>

                        {/* PLANO START - COPY LAPIDADA 🔥 */}
                        <Animated.View style={[styles.planCard, { borderColor: '#4DE38F', borderWidth: 2, transform: [{ scale: pulseAnim }] }]}>
                            <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>MAIS VENDIDO</Text></View>
                            <Text style={[styles.planName, { color: '#4DE38F' }]}>PLANO START</Text>
                            <Text style={[styles.planDesc, { color: '#CCC' }]}>A porta de entrada ideal para você sair da estagnação e ver resultado de verdade. Aplique a metodologia hoje e evolua para a consultoria completa no seu próprio ritmo.</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ A direção exata do que fazer em cada treino — sem dúvida, sem improviso</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ O resultado não para — avaliamos o seu físico a cada 30 dias para ajustar a rota</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ O suporte (Fila Standard) garante que você nunca mais se sinta sozinho no processo</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ A intensidade certa para mudar o corpo usando nossos vídeos detalhados</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Acesso liberado ao E-book: 5 Dicas Infalíveis de Emagrecimento</Text>
                                
                                <Text style={[styles.planItem, { color: '#FF3B30', marginTop: 10 }]}>🔒 Recursos Premium Bloqueados:</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Análise Biomecânica de Vídeo</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Calculadora de Cargas (1RM)</Text>
                                <Text style={[styles.planItem, { color: '#666' }]}>✗ Sem Catálogo de Audiobooks/Bônus</Text>
                            </View>

                            <View style={styles.pricingGrid}>
                                <View style={styles.priceRow}><Text style={[styles.pricePeriod, {color: '#4DE38F'}]}>Mensal</Text><Text style={[styles.priceValue, {color: '#4DE38F'}]}>R$ 69,90</Text></View>
                            </View>
                            <Text style={styles.urgencyText}>⏳ Depois que o tempo acabar, essa condição não volta.</Text>
                            <TouchableOpacity onPress={() => handleWhatsAppCTA('Plano Start')}>
                                <LinearGradient colors={['#4DE38F', '#2bb368']} style={styles.buyBtnGradient}>
                                    <Text style={[styles.buyBtnText, { color: '#000' }]}>QUERO COMEÇAR DO JEITO CERTO</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    <FaqAccordion faqs={faqList} />

                    {/* 🔥 FECHAMENTO MATADOR 🔥 */}
                    <Text style={styles.finalClosingText}>
                        "A única diferença entre quem muda o corpo... e quem continua no mesmo lugar... é começar."
                    </Text>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>PAULO ADRIANO TEAM © 2026</Text>
                        <Text style={styles.footerSubText}>Página segura. Oferta com tempo limitado.</Text>
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
    
    urgencyText: { color: '#FF3B30', fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },

    buyBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
    buyBtnGradient: { padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    buyBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
    recommendedBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#4DE38F', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 12 },
    recommendedText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },

    expiredBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#0a0a0a' },
    expiredTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
    expiredDesc: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    expiredBtn: { backgroundColor: '#222', padding: 18, borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
    expiredBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    // 🔥 ESTILO MATADOR PARA A FRASE DE FECHAMENTO 🔥
    finalClosingText: { color: '#4DE38F', fontSize: 16, fontWeight: '900', textAlign: 'center', marginTop: 40, marginBottom: 10, paddingHorizontal: 20, lineHeight: 26, fontStyle: 'italic' },

    footer: { marginTop: 30, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
    footerText: { color: '#666', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    footerSubText: { color: '#444', fontSize: 10, marginTop: 5 }
});