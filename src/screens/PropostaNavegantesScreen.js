// src/screens/PropostaNavegantesScreen.js
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Linking, Platform, SafeAreaView, Animated, Image, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { linksAlunos } from '../utils/linksAlunos';
import ModernResultCard from '../components/ModernResultCard';
import AthleteCard from '../components/AthleteCard';
import FeedbackCard from '../components/FeedbackCard';
import FaqAccordion from '../components/FaqAccordion';
import BonusCard from '../components/BonusCard';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;
const { width } = Dimensions.get('window');

// 🔥 PALETA DIA DOS NAMORADOS: Vermelho paixão + dourado
const MAIN_COLOR = '#E8003D';      // Vermelho paixão
const ACCENT_COLOR = '#FFB800';    // Dourado
const MAIN_DARK = '#9E0029';       // Vermelho escuro (degradê)

// ─── DATA DE EXPIRAÇÃO DA OFERTA ───────────────────────────────────────────
// Ajuste aqui: oferta válida até 12/06/2026 às 23:59:59 (BRT)
const EXPIRE_DATE = new Date('2026-06-12T23:59:59-03:00').getTime();

// ─── TOTAL DE VAGAS (altere conforme quiser) ────────────────────────────────
const TOTAL_VAGAS = 3;

const faqList = [
    {
        q: "Os dois têm que treinar juntos na academia?",
        a: "Não precisa! Cada um recebe o seu plano individual, montado de acordo com os objetivos e horários de cada um. Podem treinar juntos ou separados — o que importa é que os dois evoluam com direção certa."
    },
    {
        q: "E se eu e meu parceiro(a) tiverem objetivos diferentes?",
        a: "É exatamente por isso que a oferta de casal funciona: cada um tem o seu plano personalizado. Um pode estar secando, o outro ganhando massa — nós gerenciamos os dois ao mesmo tempo."
    },
    {
        q: "Para quem é a Consultoria Elite?",
        a: "Funciona tanto pra quem está começando e não sabe por onde ir… quanto pra quem já treina mas não vê mais resultado. No nosso app exclusivo, você tem a direção exata do que fazer, sem treinos genéricos de papel."
    },
    {
        q: "E se eu não tiver tempo para treinar todos os dias?",
        a: "A culpa de não ter resultados não é a falta de tempo, é a falta de estratégia. Se você só tem 3 dias na semana ou 45 minutos por dia, seu treino será cirurgicamente montado para hipertrofiar ou secar dentro dessa janela de tempo."
    },
    {
        q: "Como funciona a análise de vídeo por IA?",
        a: "É simples: você grava 10 segundos da sua execução direto no App. O sistema avalia seus ângulos e te dá o feedback na hora. É o fim da dúvida se você está fazendo o movimento certo para o músculo crescer."
    },
    {
        q: "Em quanto tempo eu vejo resultados no meu corpo?",
        a: "A ciência não falha. Nossos alunos, quando seguem a direção certa que entregamos, costumam relatar mudanças visíveis no espelho e na balança logo nas primeiras semanas."
    },
    {
        q: "O suporte é com um robô ou diretamente com vocês?",
        a: "Os dois! Você tem o bot PA Coach AI 24h para dúvidas rápidas, e no plano Elite VIP, você tem acesso ao meu WhatsApp pessoal para ajustes, garantindo que você nunca fique travado no processo."
    }
];

// ─── PLANOS DE CASAL ────────────────────────────────────────────────────────
// Valores base = PropostaScreen (originais). Desconto aplicado em cima.
// Performance base: 197 / 397 / 697 / 1.197
// Elite VIP base:   297 / 597 / 1.097 / 1.890
// Regra de desconto casal: mensal 10%, trimestral 20%, semestral 25%, anual 30%

const PLANS = {
    performance: {
        label: 'PERFORMANCE',
        color: '#FFFFFF',
        badgeColor: '#333',
        badgeText: 'DIA DOS NAMORADOS',
        desc: 'Apenas Treinos Personalizados para os Dois',
        items: [
            'Cada um sabe exatamente o que fazer em cada treino — sem improviso',
            'Correção biomecânica e direção de repetições para ambos',
            'Suporte no app para ajustes e estagnação',
            'Acesso ao PA Flix Básico',
        ],
        strikeItem: 'Estratégia Alimentar Específica',
        tiers: [
            { period: 'Mensal',     discount: 10, original: 197,   promo: 177.30 },
            { period: 'Trimestral', discount: 20, original: 397,   promo: 317.60 },
            { period: 'Semestral',  discount: 25, original: 697,   promo: 522.75 },
            { period: 'Anual',      discount: 30, original: 1197,  promo: 837.90 },
        ],
        ctaText: 'QUERO O PERFORMANCE CASAL',
        ctaKey: 'Performance Casal',
    },
    elite: {
        label: 'ELITE VIP',
        color: MAIN_COLOR,
        badgeColor: MAIN_COLOR,
        badgeText: 'MELHOR CUSTO-BENEFÍCIO',
        desc: 'Acompanhamento Absoluto: Treino + Dieta para os Dois',
        items: [
            'A direção exata do que fazer no treino — sem improviso, para cada um',
            'Ajustes rápidos antes do corpo de qualquer um dos dois estagnar',
            'Suporte de Elite no WhatsApp para tirar dúvidas',
            'Acesso livre ao PA Flix VIP (Todo o Arsenal) para o casal',
        ],
        highlightItem: '🔥 Estratégia de Dieta Alinhada ao Treino — os dois mudam juntos',
        tiers: [
            { period: 'Mensal',     discount: 10, original: 297,   promo: 267.30 },
            { period: 'Trimestral', discount: 20, original: 597,   promo: 477.60 },
            { period: 'Semestral',  discount: 25, original: 1097,  promo: 822.75 },
            { period: 'Anual',      discount: 30, original: 1890,  promo: 1323.00 },
        ],
        ctaText: 'QUERO GARANTIR MINHA VAGA ELITE CASAL',
        ctaKey: 'Elite VIP Casal',
    },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
function formatBRL(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PropostaNavegantesScreen({ route }) {
    const rawName = route?.params?.nome?.trim() || '';
    const genericNames = ['novo aluno', 'nova aluna', 'aluno', 'aluna', 'teste', 'atleta', 'lead', 'cliente', 'casal'];
    const isGeneric = !rawName || genericNames.includes(rawName.toLowerCase());
    const displayName = isGeneric ? 'CASAL' : rawName.toUpperCase();

    // Roteamento de WhatsApp (mesmo padrão do PropostaMaes)
    const coachParam = route?.params?.coach?.trim()?.toLowerCase() || '';
    const telefoneParam = route?.params?.telefone?.trim() || '';
    let waNumber = '5541997991346'; // padrão Paulo
    if (telefoneParam) {
        waNumber = telefoneParam.replace(/\D/g, '');
    } else if (['adri', 'adriele', 'japinha'].includes(coachParam)) {
        waNumber = '5541998465582';
    }

    const [timeLeft, setTimeLeft] = useState(null);
    const [vagasLeft, setVagasLeft] = useState(TOTAL_VAGAS);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const heartAnim = React.useRef(new Animated.Value(1)).current;

    // Timer até a data fixa de expiração
    useEffect(() => {
        const calc = () => {
            const diff = Math.floor((EXPIRE_DATE - Date.now()) / 1000);
            return diff > 0 ? diff : 0;
        };
        setTimeLeft(calc());
        const interval = setInterval(() => {
            const t = calc();
            setTimeLeft(t);
            if (t <= 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Pulso no card Elite
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Batimento do coração no badge de vagas
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(heartAnim, { toValue: 1.3, duration: 400, useNativeDriver: true }),
                Animated.timing(heartAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(heartAnim, { toValue: 1.3, duration: 400, useNativeDriver: true }),
                Animated.timing(heartAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const formatTime = (seconds) => {
        if (seconds === null) return 'Calculando...';
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (d > 0) return `${d}D ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleWhatsAppCTA = (plan) => {
        const text = `Oi! Quero aproveitar a oferta de Dia dos Namorados e garantir nossa vaga no plano ${plan}. Bora começar juntos! ❤️🔥`;
        Linking.openURL(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`);
    };

    const renderYouTubeVideo = (videoId, isAutoPlay = false) => {
        const autoPlayParams = isAutoPlay ? `&autoplay=1&mute=1&loop=1&playlist=${videoId}` : '';
        if (isWeb) {
            return React.createElement('iframe', {
                src: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${autoPlayParams}`,
                style: { width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 },
                allowFullScreen: true,
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            });
        }
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="youtube" size={40} color="#FF0000" />
                <Text style={{ color: '#FFF', marginTop: 10 }}>Vídeo disponível na versão Web</Text>
            </View>
        );
    };

    // ── Tela de oferta expirada ──────────────────────────────────────────────
    if (timeLeft === 0) {
        return (
            <RootComponent style={styles.container}>
                <View style={styles.expiredBox}>
                    <MaterialCommunityIcons name="heart-broken" size={64} color={MAIN_COLOR} />
                    <Text style={styles.expiredTitle}>OFERTA ENCERRADA</Text>
                    <Text style={styles.expiredDesc}>
                        A condição especial de Dia dos Namorados já encerrou. Fale com o suporte para verificar os valores atuais.
                    </Text>
                    <TouchableOpacity style={styles.expiredBtn} onPress={() => handleWhatsAppCTA('Lista de Espera')}>
                        <Text style={styles.expiredBtnText}>FALAR COM O COACH</Text>
                    </TouchableOpacity>
                </View>
            </RootComponent>
        );
    }

    // ── Render de um card de plano ───────────────────────────────────────────
    const renderPlanCard = (planKey, animated = false) => {
        const plan = PLANS[planKey];
        const isElite = planKey === 'elite';
        const CardWrapper = animated ? Animated.View : View;
        const cardStyle = [
            styles.planCard,
            isElite
                ? { borderColor: MAIN_COLOR, borderWidth: 2 }
                : { borderColor: '#333' },
            animated ? { transform: [{ scale: pulseAnim }] } : {},
        ];

        return (
            <CardWrapper style={cardStyle} key={planKey}>
                {/* Badge de destaque */}
                <View style={[styles.recommendedBadge, { backgroundColor: plan.badgeColor }]}>
                    <Text style={[styles.recommendedText, { color: isElite ? '#FFF' : '#FFF' }]}>
                        {plan.badgeText}
                    </Text>
                </View>

                <Text style={[styles.planName, { color: plan.color, marginTop: 10 }]}>{plan.label}</Text>
                <Text style={[styles.planDesc, { color: isElite ? '#CCC' : '#888' }]}>{plan.desc}</Text>

                {/* Itens do plano */}
                <View style={styles.planItems}>
                    {plan.items.map((item, i) => (
                        <Text key={i} style={[styles.planItem, { color: isElite ? '#FFF' : '#AAA' }]}>✓ {item}</Text>
                    ))}
                    {plan.strikeItem && (
                        <Text style={[styles.planItem, { color: '#666', textDecorationLine: 'line-through' }]}>✗ {plan.strikeItem}</Text>
                    )}
                    {plan.highlightItem && (
                        <Text style={[styles.planItem, { color: MAIN_COLOR, fontWeight: 'bold' }]}>{plan.highlightItem}</Text>
                    )}
                </View>

                {/* Grade de preços */}
                <View style={[
                    styles.pricingGrid,
                    isElite ? { borderColor: `${MAIN_COLOR}30`, borderWidth: 1 } : {}
                ]}>
                    {plan.tiers.map((tier, i) => {
                        const isLast = i === plan.tiers.length - 1;
                        return (
                            <View key={tier.period} style={[styles.priceRowPromo, isLast && { borderBottomWidth: 0 }]}>
                                <View>
                                    <Text style={[styles.pricePeriod, isLast && { color: '#FFF' }]}>{tier.period}</Text>
                                    <View style={[
                                        styles.discountBadge,
                                        isElite
                                            ? { backgroundColor: `${MAIN_COLOR}20`, borderColor: MAIN_COLOR }
                                            : {}
                                    ]}>
                                        <Text style={[styles.discountText, isElite && { color: MAIN_COLOR }]}>
                                            {tier.discount}% OFF
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.priceDe}>De: R$ {formatBRL(tier.original)}</Text>
                                    <Text style={[styles.pricePor, isElite && { color: MAIN_COLOR }, isLast && { color: isElite ? MAIN_COLOR : '#FFF' }]}>
                                        Por: <Text style={{ fontSize: 22 }}>R$ {formatBRL(tier.promo)}</Text>
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* CTA */}
                {isElite ? (
                    <TouchableOpacity onPress={() => handleWhatsAppCTA(plan.ctaKey)}>
                        <LinearGradient colors={[MAIN_COLOR, MAIN_DARK]} style={styles.buyBtnGradient}>
                            <MaterialCommunityIcons name="heart" size={16} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={[styles.buyBtnText, { color: '#FFF' }]}>{plan.ctaText}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.buyBtn, { backgroundColor: '#222', borderColor: '#444', borderWidth: 1 }]}
                        onPress={() => handleWhatsAppCTA(plan.ctaKey)}
                    >
                        <Text style={[styles.buyBtnText, { color: '#FFF' }]}>{plan.ctaText}</Text>
                    </TouchableOpacity>
                )}
            </CardWrapper>
        );
    };

    // ────────────────────────────────────────────────────────────────────────
    return (
        <RootComponent style={styles.container}>
            <Image source={{ uri: linksAlunos.background }} style={styles.backgroundImage} blurRadius={2} />

            <View style={styles.webWrapper}>
                <ScrollView
                    style={{ flex: 1, width: '100%' }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── HERO ──────────────────────────────────────────────────────── */}
                    <View style={styles.heroSection}>
                        {/* Timer */}
                        <View style={styles.timerBadge}>
                            <MaterialCommunityIcons name="timer-sand" size={16} color={MAIN_COLOR} />
                            <Text style={styles.timerText}>OFERTA DE DIA DOS NAMORADOS EXPIRA EM: {formatTime(timeLeft)}</Text>
                        </View>

                        {/* Badge de vagas com coração pulsando */}
                        <View style={styles.vagasBadgeRow}>
                            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                                <MaterialCommunityIcons name="heart" size={18} color={MAIN_COLOR} />
                            </Animated.View>
                            <Text style={styles.vagasText}>
                                ATENÇÃO: APENAS <Text style={{ color: MAIN_COLOR, fontWeight: '900' }}>{vagasLeft} VAGAS</Text> DE CASAL DISPONÍVEIS
                            </Text>
                        </View>

                        <Text style={styles.heroGreeting}>FALA, {displayName}! ❤️‍🔥</Text>
                        <Text style={styles.heroTitle}>
                            CASAL QUE TREINA JUNTO,{' '}
                            <Text style={{ color: MAIN_COLOR }}>TRANSFORMA JUNTO</Text>
                        </Text>
                        <Text style={styles.heroSub}>
                            No Dia dos Namorados, resolvi abrir uma condição inédita: uma vaga para os{' '}
                            <Text style={{ color: MAIN_COLOR, fontWeight: 'bold' }}>DOIS</Text> com desconto exclusivo.
                            Porque o melhor presente que um casal pode se dar é cuidar do próprio corpo — juntos, com método, com resultado real.
                        </Text>

                        {/* Separador visual */}
                        <View style={styles.heroDivider}>
                            <View style={styles.heroDividerLine} />
                            <MaterialCommunityIcons name="cards-heart" size={20} color={MAIN_COLOR} />
                            <View style={styles.heroDividerLine} />
                        </View>

                        <Text style={styles.heroSubSmall}>
                            Se você já treina e não vê resultado, o problema não é a falta de esforço — é a falta de direção.
                            E continuar assim só vai te fazer perder mais tempo. <Text style={{ color: MAIN_COLOR }}>Vamos mudar isso hoje.</Text>
                        </Text>
                    </View>

                    {/* ── PLANOS — preços no topo, antes do vídeo ───────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 10 }]}>ESCOLHA O ARSENAL DO CASAL</Text>
                    <Text style={styles.sectionSub}>
                        Desconto especial de Dia dos Namorados. Cada um com o seu plano individual, pagando menos pelos dois.
                    </Text>

                    {/* Caixa de urgência de vagas */}
                    <View style={styles.vagasUrgencyBox}>
                        <MaterialCommunityIcons name="lock-clock" size={22} color={ACCENT_COLOR} />
                        <Text style={styles.vagasUrgencyText}>
                            Esta oferta é exclusiva para <Text style={{ color: ACCENT_COLOR, fontWeight: '900' }}>{vagasLeft} casais</Text>.
                            Quando as vagas acabarem, o preço volta ao normal — sem exceção.
                        </Text>
                    </View>

                    <View style={styles.plansContainer}>
                        {renderPlanCard('performance', false)}
                        {renderPlanCard('elite', true)}
                    </View>

                    {/* ── VÍDEO PRINCIPAL ───────────────────────────────────────────── */}
                    <View style={styles.videoSection}>
                        <Text style={styles.sectionTitle}>NÃO ACREDITE SÓ EM NÓS</Text>
                        <Text style={styles.sectionSub}>
                            Veja quem já transformou o corpo e a rotina porque decidiu parar de tentar sozinho.
                        </Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo('tvYMAVQpt8I', false)}
                        </View>
                    </View>

                    {/* ── ARSENAL DE SOLUÇÕES ───────────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 40 }]}>A RESPOSTA PARA OS PROBLEMAS DOS DOIS</Text>
                    <Text style={styles.sectionSub}>
                        Nós eliminamos as falhas ocultas que impedem cada um de vocês de chegar ao shape dos sonhos.
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}>
                                <MaterialCommunityIcons name="trending-up" size={32} color={MAIN_COLOR} />
                            </View>
                            <Text style={styles.arsenalTitle}>O Fim da Estagnação</Text>
                            <Text style={styles.arsenalDesc}>Toda vez que o peso ou os músculos pararem de responder, ajustamos a estratégia antes que qualquer um dos dois desanime.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}>
                                <MaterialCommunityIcons name="shield-check" size={32} color={MAIN_COLOR} />
                            </View>
                            <Text style={styles.arsenalTitle}>Treino Seguro e Sem Dor</Text>
                            <Text style={styles.arsenalDesc}>Os dois finalmente vão sentir o músculo trabalhando — sem dor nas articulações e sem improviso na academia.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}>
                                <MaterialCommunityIcons name="heart-pulse" size={32} color={MAIN_COLOR} />
                            </View>
                            <Text style={styles.arsenalTitle}>Motivação de Casal</Text>
                            <Text style={styles.arsenalDesc}>Casais que treinam com o mesmo método têm adesão muito maior. A evolução de um motiva o outro — e nós turbinamos isso.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}>
                                <MaterialCommunityIcons name="account-group" size={32} color={MAIN_COLOR} />
                            </View>
                            <Text style={styles.arsenalTitle}>Vocês Nunca Estarão Sozinhos</Text>
                            <Text style={styles.arsenalDesc}>Têm uma dúvida? O suporte garante que os dois sempre saibam qual é o próximo passo — nenhum dos dois fica preso.</Text>
                        </View>
                    </ScrollView>

                    {/* ── MENTOR ────────────────────────────────────────────────────── */}
                    <View style={styles.mentorSection}>
                        <LinearGradient colors={['rgba(26,26,26,0)', 'rgba(26,26,26,1)']} style={styles.mentorGradientBg} />
                        <View style={styles.mentorContent}>
                            <View style={styles.mentorBadgeRow}>
                                <View style={styles.featureIconBox}>
                                    <MaterialCommunityIcons name="card-account-details-star-outline" size={28} color={MAIN_COLOR} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mentorSub}>EU JÁ ESTIVE DO OUTRO LADO</Text>
                                    <Text style={styles.mentorLabelHeader}>CONHEÇA SEU MENTOR:</Text>
                                    <Text style={styles.mentorNameStrong}>PAULO ADRIANO</Text>
                                </View>
                            </View>

                            <Text style={styles.mentorDesc}>
                                "Eu sei exatamente o que é carregar o peso extra, a frustração de não ver resultados e a dúvida se o esforço vale a pena. Eu já fui um 'ex-gordo' com 97kg. Mas eu descobri o caminho. Usei a ciência e a disciplina para me transformar em um Campeão Natural com 77kg.{"\n\n"}
                                Hoje, eu e a Adri treinamos juntos, subimos juntos nos palcos e guiamos casais e atletas para os mesmos resultados. <Text style={{ color: MAIN_COLOR, fontWeight: 'bold' }}>Vivemos o que ensinamos.</Text>"
                            </Text>

                            <View style={[styles.swipeHintContainer, { backgroundColor: `${MAIN_COLOR}15`, borderColor: `${MAIN_COLOR}30` }]}>
                                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={24} color={MAIN_COLOR} />
                                <Text style={[styles.swipeHintText, { color: MAIN_COLOR }]}>ARRASTE PARA O LADO E VEJA A TRANSFORMAÇÃO</Text>
                            </View>

                            <ScrollView
                                horizontal
                                snapToInterval={340}
                                snapToAlignment="center"
                                decelerationRate="fast"
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.carouselContainerMentor}
                            >
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

                    {/* ── IA HIGHLIGHT ──────────────────────────────────────────────── */}
                    <View style={[styles.aiHighlightSection, { borderColor: `${MAIN_COLOR}30` }]}>
                        <Text style={styles.sectionTitle}>NUNCA MAIS DESPERDICEM TEMPO FAZENDO ERRADO</Text>
                        <Text style={styles.sectionSub}>
                            A maioria das pessoas treina errado e nem percebe. Aqui, cada repetição é ajustada para realmente gerar resultado — sem desperdiçar tempo nem se machucar.
                        </Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo(linksAlunos.ai_video_id, true)}
                        </View>
                    </View>

                    {/* ── PERGUNTA DE FECHAMENTO SPIN ───────────────────────────────── */}
                    <View style={styles.spinQuestionBox}>
                        <MaterialCommunityIcons name="heart-flash" size={24} color={MAIN_COLOR} />
                        <Text style={[styles.spinQuestionText, { color: MAIN_COLOR }]}>
                            E se eu te entregar a direção exata, a dieta mastigada e o treino corrigido — para os dois — vocês estão dispostos a seguir o plano e serem o nosso próximo "Antes e Depois" de casal?
                        </Text>
                    </View>

                    {/* ── PROVA SOCIAL ──────────────────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 10 }]}>NÃO SOMOS TREINADORES DE TEORIA</Text>
                    <Text style={styles.sectionSub}>
                        Eu e a Adri vivemos a transformação na pele. Validamos esse método em dezenas de alunos — homens e mulheres — com resultados absurdos. Estes são apenas alguns deles.
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <ModernResultCard goal="🔥 QUASE 20KG ELIMINADOS: DE 97KG PARA 77KG COM SAÚDE E CURVAS RECUPERADAS (Letícia - Aluna da Adri)" montageUri={linksAlunos.leticia_montagem} />
                        <ModernResultCard goal="🔥 O FIM DA FLACIDEZ: DE UM CORPO SEM FORMA À DEFINIÇÃO ESCULPIDA (Bernard)" montageUri={linksAlunos.bernard_montagem} />
                        <ModernResultCard goal="🍑 CORPO DESENHADO E GLÚTEO NA NUCA: HIPERTROFIA E DEFINIÇÃO REAL (Jéssica - Aluna da Adri)" montageUri={linksAlunos.jessica_montagem} />
                        <ModernResultCard goal="🏆 VENCENDO O SOBREPESO: A VIRADA DE CHAVE QUE DERRETEU A GORDURA (Paulo)" montageUri={linksAlunos.paulo_montagem} />
                        <ModernResultCard goal="⏳ O FIM DA GORDURINHA NAS COSTAS: CINTURA FINA E CONFIANÇA PARA VESTIR QUALQUER ROUPA (Evelyn)" montageUri={linksAlunos.evelyn_montagem} />
                        <ModernResultCard goal="🔥 DESTRUINDO A GORDURA VISCERAL: O FIM DA BARRIGA TEIMOSA (Allan)" montageUri={linksAlunos.allan_montagem} />
                        <ModernResultCard goal="⚡️ O FIM DA INSEGURANÇA: UM FÍSICO TOTALMENTE RECONSTRUÍDO (Ana)" montageUri={linksAlunos.ana_montagem} />
                        <ModernResultCard goal="💪 DA OBESIDADE À PERFORMANCE: O CORPO QUE ELE ACHOU QUE NUNCA TERIA (Pedro)" montageUri={linksAlunos.pedro_montagem} />
                        <ModernResultCard goal="⏱️ A PROVA DE QUE NÃO PRECISA DEMORAR: CHOQUE VISUAL EM 11 DIAS (Yasmin)" montageUri={linksAlunos.yasmin_montagem} />
                        <ModernResultCard goal="🏆 QUEBRANDO PLATÔS: DO TREINO COMUM AO PADRÃO DE PALCO (Adri)" montageUri={linksAlunos.adri_montagem} />
                    </ScrollView>

                    {/* ── BÔNUS ─────────────────────────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 40 }]}>ARSENAL DE BÔNUS</Text>
                    <Text style={styles.sectionSub}>Material extra desbloqueado de acordo com o plano de assinatura de cada um.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_5dicas} title="E-book: 5 Dicas de Emagrecimento" subtitle="O pontapé inicial para a queima." isAudio={false} price="14,90" unlockText="A PARTIR DO MENSAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_receitas_whey} title="Receitas Fit com Whey" subtitle="Sobremesas anabólicas." isAudio={false} price="19,90" unlockText="A PARTIR DO MENSAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_receitas_salgadas} title="Receitas Fit Salgadas" subtitle="Almoço e janta no plano." isAudio={false} price="19,90" unlockText="A PARTIR DO MENSAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_shape} title="E-book: Shape Natural" subtitle="Guia completo de hipertrofia." isAudio={false} price="34,90" unlockText="A PARTIR DO TRIMESTRAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_pernas} title="E-book: Pernas Grandes" subtitle="Foco em membros inferiores." isAudio={false} price="29,90" unlockText="A PARTIR DO TRIMESTRAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_5dicas} title="Audiobook: 5 Dicas de Emagrecimento" subtitle="Ouça em qualquer lugar." isAudio={true} price="14,90" unlockText="A PARTIR DO SEMESTRAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.audio_shape} title="Audiobook: Shape Natural" subtitle="Para ouvir a caminho do treino." isAudio={true} price="34,90" unlockText="A PARTIR DO SEMESTRAL" />
                    </ScrollView>

                    {/* ── CTA FINAL REPETIDO ────────────────────────────────────────── */}
                    <View style={styles.finalCtaBox}>
                        <Text style={styles.finalCtaTitle}>AINDA ESTÃO NA DÚVIDA?</Text>
                        <Text style={styles.finalCtaSub}>
                            Cada dia sem método é um dia que os dois perdem em resultado. As vagas são limitadas e a oferta acaba em breve.
                        </Text>
                        <TouchableOpacity onPress={() => handleWhatsAppCTA('Elite VIP Casal')}>
                            <LinearGradient colors={[MAIN_COLOR, MAIN_DARK]} style={styles.buyBtnGradient}>
                                <MaterialCommunityIcons name="heart" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={[styles.buyBtnText, { color: '#FFF' }]}>GARANTIR NOSSA VAGA AGORA</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* ── FAQ ───────────────────────────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 40, marginBottom: 20 }]}>AINDA TEM DÚVIDAS?</Text>
                    <FaqAccordion faqs={faqList} />

                    {/* ── FECHAMENTO ────────────────────────────────────────────────── */}
                    <Text style={[styles.finalClosingText, { color: MAIN_COLOR }]}>
                        "A única diferença entre um casal que muda o corpo... e um casal que continua no mesmo lugar... é a decisão de começar juntos."
                    </Text>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>ELITE FIT © 2026</Text>
                        <Text style={styles.footerSubText}>Página segura. Oferta exclusiva de Dia dos Namorados. Apenas {TOTAL_VAGAS} vagas de casal.</Text>
                    </View>
                </ScrollView>
            </View>
        </RootComponent>
    );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { height: isWeb ? '100vh' : '100%', backgroundColor: '#0a0a0a', position: 'relative' },
    backgroundImage: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute', top: 0, left: 0, opacity: 0.15 },
    webWrapper: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#2A0010', backgroundColor: 'rgba(17,17,17,0.92)' },
    scrollContent: { flexGrow: 1, padding: 25, paddingBottom: 120 },

    // ── Hero
    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${MAIN_COLOR}15`, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: MAIN_COLOR, marginBottom: 14 },
    timerText: { color: MAIN_COLOR, fontWeight: '900', fontSize: 12, marginLeft: 8, letterSpacing: 1 },
    vagasBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${ACCENT_COLOR}15`, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: `${ACCENT_COLOR}50`, marginBottom: 20 },
    vagasText: { color: '#CCC', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
    heroGreeting: { color: '#888', fontWeight: '900', fontSize: 14, letterSpacing: 2, marginBottom: 10 },
    heroTitle: { color: '#FFF', fontSize: 30, fontWeight: '900', textAlign: 'center', lineHeight: 36, letterSpacing: -1, marginBottom: 15 },
    heroSub: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10, marginBottom: 20 },
    heroDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 15, width: '80%' },
    heroDividerLine: { flex: 1, height: 1, backgroundColor: `${MAIN_COLOR}30` },
    heroSubSmall: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },

    // ── Vagas urgência
    vagasUrgencyBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: `${ACCENT_COLOR}10`, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: `${ACCENT_COLOR}30`, marginBottom: 20 },
    vagasUrgencyText: { flex: 1, color: '#AAA', fontSize: 13, lineHeight: 20 },

    // ── Vídeo
    videoSection: { marginTop: 40, marginBottom: 50 },
    videoContainer9x16: { width: '100%', maxWidth: 280, aspectRatio: 9 / 16, backgroundColor: '#222', borderRadius: 16, overflow: 'hidden', alignSelf: 'center', marginTop: 20, borderWidth: 1, borderColor: '#333', position: 'relative' },

    // ── Seções genéricas
    sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, marginBottom: 5 },
    sectionSub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
    carouselContainer: { paddingLeft: 0, paddingRight: 20, paddingBottom: 20 },

    // ── Arsenal cards
    arsenalCard: { width: width > 600 ? 250 : width * 0.7, backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A', marginRight: 15, alignItems: 'flex-start' },
    featureIconBox: { width: 54, height: 54, borderRadius: 27, backgroundColor: `${MAIN_COLOR}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: `${MAIN_COLOR}30` },
    arsenalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    arsenalDesc: { color: '#888', fontSize: 13, lineHeight: 20 },

    // ── IA Highlight
    aiHighlightSection: { marginTop: 20, marginBottom: 40, paddingHorizontal: 15, paddingVertical: 30, backgroundColor: '#111', borderRadius: 24, borderWidth: 1 },

    // ── SPIN question
    spinQuestionBox: { backgroundColor: `${MAIN_COLOR}15`, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: `${MAIN_COLOR}30`, marginBottom: 30, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 10, marginTop: 40 },
    spinQuestionText: { flex: 1, fontSize: 13, fontWeight: 'bold', lineHeight: 20 },

    // ── Mentor
    mentorSection: { marginBottom: 40, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', marginTop: 40 },
    mentorGradientBg: { ...StyleSheet.absoluteFillObject },
    mentorContent: { padding: 20, flexDirection: 'column' },
    mentorBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 5, width: '100%' },
    mentorSub: { color: '#888', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
    mentorLabelHeader: { color: MAIN_COLOR, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    mentorNameStrong: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 2 },
    mentorDesc: { color: '#BBB', fontSize: 15, lineHeight: 24, fontStyle: 'italic', textAlign: 'left', marginTop: 15, marginBottom: 20, paddingHorizontal: 5, width: '100%' },
    swipeHintContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, alignSelf: 'center', borderWidth: 1 },
    swipeHintText: { fontSize: 12, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
    carouselContainerMentor: { paddingHorizontal: 10, paddingBottom: 20 },
    imageColMentor: { width: 330, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    imagePlaceholderMentor: { width: '100%', aspectRatio: 9 / 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'transparent' },
    resultImageMentorContain: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 14 },

    // ── Planos
    plansContainer: { gap: 25, marginTop: 10 },
    planCard: { backgroundColor: '#161616', padding: 25, borderRadius: 24, borderWidth: 1, position: 'relative' },
    planName: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 5, textAlign: 'center' },
    planDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 25 },
    planItems: { gap: 12, marginBottom: 25 },
    planItem: { fontSize: 14, color: '#AAA', fontWeight: '500' },
    recommendedBadge: { position: 'absolute', top: -12, alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 12 },
    recommendedText: { color: '#FFF', fontWeight: '900', fontSize: 10, letterSpacing: 1 },

    // ── Grade de preços
    pricingGrid: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 15, marginBottom: 25 },
    priceRowPromo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222', paddingVertical: 12 },
    pricePeriod: { color: '#888', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
    discountBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#444' },
    discountText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    priceDe: { color: '#666', fontSize: 12, textDecorationLine: 'line-through', fontWeight: 'bold' },
    pricePor: { color: '#AAA', fontSize: 14, fontWeight: '900' },

    // ── Botões
    buyBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
    buyBtnGradient: { padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    buyBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },

    // ── CTA Final
    finalCtaBox: { marginTop: 40, backgroundColor: `${MAIN_COLOR}10`, padding: 25, borderRadius: 24, borderWidth: 1, borderColor: `${MAIN_COLOR}30` },
    finalCtaTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    finalCtaSub: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 22, marginBottom: 20 },

    // ── Expirado
    expiredBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#0a0a0a' },
    expiredTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
    expiredDesc: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    expiredBtn: { backgroundColor: '#222', padding: 18, borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
    expiredBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    // ── Fechamento e rodapé
    finalClosingText: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginTop: 40, marginBottom: 10, paddingHorizontal: 20, lineHeight: 26, fontStyle: 'italic' },
    footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
    footerText: { color: '#666', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    footerSubText: { color: '#444', fontSize: 10, marginTop: 5 },
});
