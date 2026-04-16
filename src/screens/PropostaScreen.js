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

const faqList = [
    { q: "Para quem é a Consultoria Elite?", a: "Para quem cansou daqueles treinos genéricos entregues em papéis de academia e quer um acompanhamento real e tecnológico. No nosso app exclusivo, você tem vídeos demonstrativos de cada exercício e a direção exata do que fazer. Funciona perfeitamente para iniciantes que precisam do passo a passo desde o dia 1, e para avançados que estagnaram e precisam quebrar o platô." },
    { q: "Como funciona a análise de vídeo por IA?", a: "É simples: você grava 10 segundos da sua execução de um exercício direto no nosso App. Nossa Inteligência Artificial mapeia os seus ângulos biomecânicos e te dá o feedback na hora, corrigindo sua postura para evitar lesões e maximizar seus ganhos." },
    { q: "Vou ter que fazer dietas malucas e restritivas?", a: "De jeito nenhum. Se você escolher o plano Elite VIP, sua estratégia alimentar será 100% calculada para a sua rotina e preferências. Sem terrorismo nutricional. Você vai comer o que gosta, mas com as quantidades e os macros perfeitamente alinhados para o seu objetivo." },
    { q: "Em quanto tempo eu vejo resultados no meu corpo?", a: "A ciência não falha. Seguindo o arsenal que preparamos para você, nossos alunos costumam relatar mudanças visíveis no espelho e na balança logo nos primeiros 15 a 30 dias." },
    { q: "O suporte é com um robô ou diretamente com você?", a: "Os dois! Você terá o nosso bot (PA Coach AI) disponível 24h por dia para dúvidas rápidas dentro do App. Mas no plano Elite VIP, você tem acesso direto ao meu WhatsApp pessoal para ajustes finos, avaliações e acompanhamento lado a lado. Você nunca estará sozinho." }
];

export default function PropostaScreen({ route }) {
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
                const storedTime = await AsyncStorage.getItem(`@expire_time_${storageKeyName}`);
                const now = Date.now();
                let expireTime;

                if (storedTime) {
                    expireTime = parseInt(storedTime, 10);
                } else {
                    expireTime = now + (24 * 60 * 60 * 1000); 
                    await AsyncStorage.setItem(`@expire_time_${storageKeyName}`, expireTime.toString());
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
        const text = `Fala, Coach! Quero destravar meu acesso ao plano ${plan}. Bora começar! 👊`;
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
                        <Text style={styles.expiredBtnText}>FALAR COM O COACH</Text>
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
                        <Text style={styles.heroGreeting}>FALA, {displayName}! ⚡</Text>
                        <Text style={styles.heroTitle}>O SEU CONVITE EXCLUSIVO PARA A <Text style={{color: '#4DE38F'}}>CONSULTORIA ELITE</Text></Text>
                        <Text style={styles.heroSub}>Você não está comprando uma "planilha de treino". Você está prestes a destravar uma experiência tecnológica de alta performance focada no seu resultado.</Text>
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
                                    <Text style={styles.mentorLabelHeader}>CONHEÇA SEU MENTOR:</Text>
                                    <Text style={styles.mentorNameStrong}>PAULO ADRIANO</Text>
                                </View>
                            </View>

                            <Text style={styles.mentorDesc}>
                                "Eu sei exatamente o que é carregar o peso extra, a frustração de não ver resultados e a dúvida se o esforço vale a pena. Eu já fui um 'ex-gordo' com 97kg. Mas eu descobri o caminho. Usei a ciência e a disciplina para me transformar em um Campeão Natural com 77kg. Eu não vendo planos; eu guio transformações reais."
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
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>O FIM DO TREINO ERRADO</Text>
                    <Text style={styles.sectionSub}>Conheça o seu aplicativo exclusivo.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="camera-front-variant" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Avaliações Quinzenais</Text>
                            <Text style={styles.arsenalDesc}>Análise detalhada do seu físico a cada 15 dias com feedbacks e ajustes de rota diretos no App.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="dumbbell" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Execução Impecável</Text>
                            <Text style={styles.arsenalDesc}>Vídeos de todos os exercícios, explicação da técnica e métodos avançados para hipertrofia ou emagrecimento.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="weight-lifter" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Calculadora de Carga (1RM)</Text>
                            <Text style={styles.arsenalDesc}>O app calcula a carga exata que você deve levantar para garantir resultados e evitar platôs.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="chat-processing-outline" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>PA Coach AI & Suporte</Text>
                            <Text style={styles.arsenalDesc}>Tire dúvidas com o nosso bot 24h por dia ou chame direto no meu WhatsApp pelo App.</Text>
                        </View>
                    </ScrollView>

                    {/* IA HIGHLIGHT */}
                    <View style={styles.aiHighlightSection}>
                        <Text style={styles.sectionTitle}>A CIÊNCIA CORRIGINDO SEU MOVIMENTO</Text>
                        <Text style={styles.sectionSub}>Análise Biomecânica Proprietária treinada pelo Paulo Adriano com a visão de 10 anos de experiência para avaliar sua execução em tempo real.</Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo(linksAlunos.ai_video_id, true)}
                        </View>
                    </View>

                    {/* PROVA SOCIAL */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>RESULTADOS DOS ALUNOS</Text>
                    <Text style={styles.sectionSub}>Deslize para ver o que a disciplina somada à ciência pode fazer.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <ModernResultCard goal="🔥 DA FALTA DE TÔNUS À DEFINIÇÃO ESCULPIDA (Bernard)" montageUri={linksAlunos.bernard_montagem} />
                        <ModernResultCard goal="🏆 RECOMPOSIÇÃO CORPORAL E MUITA PERDA DE PESO E GORDURA (Paulo)" montageUri={linksAlunos.paulo_montagem} />
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

                    {/* FEEDBACKS WHATSAPP */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>O QUE ELES DIZEM NO WHATSAPP</Text>
                    <Text style={styles.sectionSub}>A realidade nua e crua de quem vive o método todos os dias.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <FeedbackCard uri={linksAlunos.feedback_paloma} legend="🤫 10KG ELIMINADOS: CONTRA FATOS NÃO HÁ ARGUMENTOS (Paloma)" />
                        <FeedbackCard uri={linksAlunos.feedback_eduardo} legend="🚀 A CHAVE VIROU: 5KG ELIMINADOS EM APENAS 42 DIAS (Eduardo)" />
                        <FeedbackCard uri={linksAlunos.feedback_anne} legend="👖 MEDIDAS DESPENCANDO: A FELICIDADE DA CALÇA LARGONA (Anne)" />
                        <FeedbackCard uri={linksAlunos.feedback_juliana} legend="🥗 DIETA SEM SOFRIMENTO E RESULTADOS RÁPIDOS (Juliana)" />
                        <FeedbackCard uri={linksAlunos.feedback_thiago} legend="🎯 DISCIPLINA QUE GERA RESULTADO: QUASE 4KG OFF (Thiago)" />
                        <FeedbackCard uri={linksAlunos.feedback_yasmin} legend="🔥 DERRETENDO GORDURA E RECUPERANDO O GUARDA-ROUPA (Yasmin)" />
                        <FeedbackCard uri={linksAlunos.feedback_gleiber} legend="⚡ SHAPE RESPONDENDO E ABDÔMEN SECANDO (Gleiber)" />
                    </ScrollView>

                    {/* PADRÃO ELITE */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>PADRÃO ELITE</Text>
                    <Text style={styles.sectionSub}>Vivendo a alta performance e guiando o time aos pódios.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <AthleteCard uri={linksAlunos.equipe_adri} title="LIDERANDO PELO EXEMPLO" desc="Eu e minha esposa Adri dividindo os palcos. Ela garante suporte e motivação constante para que ninguém fique para trás no processo." />
                        <AthleteCard uri={linksAlunos.aluna_medalha} title="O RESULTADO DO TRABALHO" desc="Aluna de 39 anos de idade, que conseguimos colocar um shape competitivo ao perder 32kgs." />
                        <AthleteCard uri={linksAlunos.felipe_podio} title="MÉTODO VALIDADO" desc="Nosso atleta Felipe comemorando sua vitória após um trabalho impecável de preparação. A ciência não falha." />
                        <AthleteCard uri={linksAlunos.atleta_fem} title="A VITÓRIA" desc="O sorriso de quem entregou tudo e buscou a medalha. O método funciona para quem faz o que tem que ser feito." />
                        <AthleteCard uri={linksAlunos.trio_fem} title="NOSSO TIME EM PESO" desc="Nossas atletas brilhando no campeonato. Estética, saúde e alta performance totalmente alinhadas." />
                    </ScrollView>

                    {/* BÔNUS EXCLUSIVOS */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>ARSENAL DE BÔNUS</Text>
                    <Text style={styles.sectionSub}>Material extra desbloqueado de acordo com o seu plano de assinatura.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <BonusCard uri={linksAlunos.ebook_5dicas} title="E-book: 5 Dicas de Emagrecimento" subtitle="O pontapé inicial para a queima." isAudio={false} price="14,90" unlockText="A PARTIR DO MENSAL" />
                        <BonusCard uri={linksAlunos.ebook_receitas_whey} title="Receitas Fit com Whey" subtitle="Sobremesas anabólicas." isAudio={false} price="19,90" unlockText="A PARTIR DO MENSAL" />
                        <BonusCard uri={linksAlunos.ebook_receitas_salgadas} title="Receitas Fit Salgadas" subtitle="Almoço e janta no plano." isAudio={false} price="19,90" unlockText="A PARTIR DO MENSAL" />
                        <BonusCard uri={linksAlunos.ebook_shape} title="E-book: Shape Natural" subtitle="Guia completo de hipertrofia." isAudio={false} price="34,90" unlockText="A PARTIR DO TRIMESTRAL" />
                        <BonusCard uri={linksAlunos.ebook_pernas} title="E-book: Pernas Grandes" subtitle="Foco em membros inferiores." isAudio={false} price="29,90" unlockText="A PARTIR DO TRIMESTRAL" />
                        <BonusCard uri={linksAlunos.ebook_5dicas} title="Audiobook: 5 Dicas de Emagrecimento" subtitle="Ouça em qualquer lugar." isAudio={true} price="14,90" unlockText="A PARTIR DO SEMESTRAL" />
                        <BonusCard uri={linksAlunos.audio_shape} title="Audiobook: Shape Natural" subtitle="Para ouvir a caminho do treino." isAudio={true} price="34,90" unlockText="A PARTIR DO SEMESTRAL" />
                    </ScrollView>

                    {/* FAQ */}
                    <Text style={[styles.sectionTitle, {marginTop: 40, marginBottom: 20}]}>AINDA TEM DÚVIDAS?</Text>
                    <FaqAccordion faqs={faqList} />

                    {/* ESCOLHA SEU PLANO */}
                    <Text style={styles.sectionTitle}>ESCOLHA SEU ARSENAL</Text>
                    <View style={styles.plansContainer}>
                        {/* PERFORMANCE */}
                        <View style={[styles.planCard, { borderColor: '#333' }]}>
                            <Text style={[styles.planName, { color: '#FFF' }]}>PERFORMANCE</Text>
                            <Text style={styles.planDesc}>O motor de arranque para o seu shape.</Text>
                            <View style={styles.planItems}>
                                <Text style={styles.planItem}>✓ Treinos em App com Vídeos e Técnicas</Text>
                                <Text style={styles.planItem}>✓ Análise de Execução Biomecânica</Text>
                                <Text style={styles.planItem}>✓ Avaliações Quinzenais via App</Text>
                                <Text style={styles.planItem}>✓ Assistente PA Coach AI + Suporte Whats</Text>
                                <Text style={styles.planItem}>✓ Calculadora de RM, Descanso e RPE</Text>
                                <Text style={styles.planItem}>✓ PA Flix Básico</Text>
                                <Text style={[styles.planItem, { color: '#666', textDecorationLine: 'line-through' }]}>✗ Estratégia Alimentar Personalizada</Text>
                            </View>
                            
                            <View style={styles.bonusSection}>
                                <Text style={styles.bonusTitle}>🎁 BÔNUS DE ACORDO COM O PLANO:</Text>
                                <Text style={styles.bonusItem}>• Mensal: E-books 5 Dicas + Receitas (Whey e Salgadas)</Text>
                                <Text style={styles.bonusItem}>• Trimestral: Tudo acima + Shape Natural + Pernas</Text>
                                <Text style={styles.bonusItem}>• Semestral/Anual: Tudo acima + Todos os Audiobooks</Text>
                            </View>

                            <View style={styles.pricingGrid}>
                                <View style={styles.priceRow}><Text style={styles.pricePeriod}>Mensal</Text><Text style={styles.priceValue}>R$ 197</Text></View>
                                <View style={styles.priceRow}><Text style={styles.pricePeriod}>Trimestral</Text><Text style={styles.priceValue}>R$ 397</Text></View>
                                <View style={styles.priceRow}><Text style={styles.pricePeriod}>Semestral</Text><Text style={styles.priceValue}>R$ 697</Text></View>
                                <View style={styles.priceRow}><Text style={[styles.pricePeriod, {color: '#FFF'}]}>Anual</Text><Text style={[styles.priceValue, {color: '#FFF'}]}>R$ 1.197</Text></View>
                            </View>
                            <TouchableOpacity style={[styles.buyBtn, { backgroundColor: '#222', borderColor: '#444', borderWidth: 1 }]} onPress={() => handleWhatsAppCTA('Performance')}>
                                <Text style={[styles.buyBtnText, { color: '#FFF' }]}>ESCOLHER PERFORMANCE</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ELITE VIP */}
                        <Animated.View style={[styles.planCard, { borderColor: '#4DE38F', borderWidth: 2, transform: [{ scale: pulseAnim }] }]}>
                            <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>EXPERIÊNCIA COMPLETA</Text></View>
                            <Text style={[styles.planName, { color: '#4DE38F' }]}>ELITE VIP</Text>
                            <Text style={[styles.planDesc, { color: '#CCC' }]}>Treino, dieta e suporte lado a lado.</Text>
                            <View style={styles.planItems}>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Treinos em App com Vídeos e Técnicas</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Análise de Execução Biomecânica</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Avaliações Visuais Quinzenais</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Assistente PA Coach AI + Suporte Whats</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Calculadora de RM, Descanso e RPE</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ PA Flix Completo (Bônus Vip)</Text>
                                <Text style={[styles.planItem, { color: '#4DE38F', fontWeight: 'bold' }]}>🔥 Estratégia Alimentar Específica</Text>
                            </View>

                            <View style={[styles.bonusSection, { borderColor: 'rgba(77, 227, 143, 0.2)' }]}>
                                <Text style={[styles.bonusTitle, { color: '#4DE38F' }]}>🎁 BÔNUS DE ACORDO COM O PLANO:</Text>
                                <Text style={[styles.bonusItem, { color: '#CCC' }]}>• Mensal: E-books 5 Dicas + Receitas (Whey e Salgadas)</Text>
                                <Text style={[styles.bonusItem, { color: '#CCC' }]}>• Trimestral: Tudo acima + Shape Natural + Pernas</Text>
                                <Text style={[styles.bonusItem, { color: '#CCC' }]}>• Semestral/Anual: Tudo acima + Todos os Audiobooks</Text>
                            </View>

                            <View style={styles.pricingGrid}>
                                <View style={styles.priceRow}><Text style={styles.pricePeriod}>Mensal</Text><Text style={styles.priceValue}>R$ 297</Text></View>
                                <View style={styles.priceRow}><Text style={styles.pricePeriod}>Trimestral</Text><Text style={styles.priceValue}>R$ 597</Text></View>
                                <View style={styles.priceRow}><Text style={styles.pricePeriod}>Semestral</Text><Text style={styles.priceValue}>R$ 1.097</Text></View>
                                <View style={styles.priceRow}><Text style={[styles.pricePeriod, {color: '#4DE38F'}]}>Anual</Text><Text style={[styles.priceValue, {color: '#4DE38F'}]}>R$ 1.890</Text></View>
                            </View>
                            <TouchableOpacity onPress={() => handleWhatsAppCTA('Elite VIP')}>
                                <LinearGradient colors={['#4DE38F', '#2bb368']} style={styles.buyBtnGradient}>
                                    <Text style={[styles.buyBtnText, { color: '#000' }]}>EU QUERO SER ELITE</Text>
                                    <MaterialCommunityIcons name="whatsapp" size={20} color="#000" style={{marginLeft: 8}} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

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
    arsenalCard: { width: width > 600 ? 250 : width * 0.7, backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A', marginRight: 15, alignItems: 'flex-start' },
    featureIconBox: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#4DE38F15', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#4DE38F30' },
    arsenalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    arsenalDesc: { color: '#888', fontSize: 13, lineHeight: 20 },
    carouselContainer: { paddingLeft: 0, paddingRight: 20, paddingBottom: 20 },
    aiHighlightSection: { marginTop: 20, marginBottom: 40, paddingHorizontal: 15, paddingVertical: 30, backgroundColor: '#111', borderRadius: 24, borderWidth: 1, borderColor: '#4DE38F30' },

    plansContainer: { gap: 25, marginTop: 10 },
    planCard: { backgroundColor: '#161616', padding: 25, borderRadius: 24, borderWidth: 1, position: 'relative' },
    planName: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 5, textAlign: 'center' },
    planDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 25 },
    planItems: { gap: 12, marginBottom: 25 },
    planItem: { fontSize: 14, color: '#AAA', fontWeight: '500' },
    bonusSection: { backgroundColor: '#222', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 25 },
    bonusTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 0.5, marginBottom: 10 },
    bonusItem: { fontSize: 12, color: '#888', marginBottom: 4, fontStyle: 'italic' },
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
    footerSubText: { color: '#444', fontSize: 10, marginTop: 5 }
});