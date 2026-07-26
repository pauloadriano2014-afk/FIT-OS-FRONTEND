// src/screens/PropostaScreen.js
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

const API_BASE = 'https://fitos-final.onrender.com';

const faqList = [
    { q: "Para quem é a Consultoria Elite?", a: "Funciona tanto pra quem está começando e não sabe por onde ir… quanto pra quem já treina mas não vê mais resultado. No nosso app exclusivo, você tem a direção exata do que fazer, sem treinos genéricos de papel." },
    { q: "E se eu não tiver tempo para treinar todos os dias?", a: "A culpa de não ter resultados não é a falta de tempo, é a falta de estratégia. Se você só tem 3 dias na semana ou 45 minutos por dia, seu treino será cirurgicamente montado para hipertrofiar ou secar dentro dessa janela de tempo. O plano se adapta à sua rotina, não o contrário." },
    { q: "Como funciona a análise de vídeo por IA?", a: "É simples: você grava 10 segundos da sua execução direto no App. O sistema avalia seus ângulos e te dá o feedback na hora. É o fim da dúvida se você está fazendo o movimento certo para o músculo crescer." },
    { q: "Vou ter que fazer dietas malucas e restritivas?", a: "De jeito nenhum. No plano Elite VIP, sua estratégia será calculada para a sua realidade. Você vai comer o que gosta, mas com as quantidades perfeitas para destravar a queima de gordura e ganho de massa." },
    { q: "Em quanto tempo eu vejo resultados no meu corpo?", a: "A ciência não falha. Nossos alunos, quando seguem a direção certa que entregamos, costumam relatar mudanças visíveis no espelho e na balança logo nas primeiras semanas." },
    { q: "O suporte é com um robô ou diretamente com você?", a: "Os dois! Você tem o bot PA Coach AI 24h para dúvidas rápidas, e no plano Elite VIP, você tem acesso ao meu WhatsApp pessoal para ajustes, garantindo que você nunca fique travado no processo." }
];

// ─── CARDS PADRÃO (fallback) ─────────────────────────────────────────────
// Exatamente os mesmos planos/preços/textos que a página sempre teve.
// Usado quando nenhuma ?oferta= é passada na URL, ou quando a busca falha.
// Isso garante que TODOS os links já em circulação continuam funcionando
// exatamente como sempre funcionaram, sem nenhum risco.
const DEFAULT_CARDS = [
    {
        id: 'default-performance',
        nome: 'PERFORMANCE',
        descricao: "O motor de arranque para mudar o seu shape.\n\nSe você já treina, mas sente que está fazendo tudo 'meio no escuro', esse é o ponto de virada.",
        destaque: false,
        badgeTexto: '',
        itensInclusos: [
            'Você sabe exatamente o que fazer em cada treino — sem dúvida, sem improviso',
            'Cada repetição passa a ter direção, corrigindo falhas e extraindo resultado real',
            'O resultado não para — toda vez que estagnar, ajustamos a rota antes',
            'O acompanhamento garante o seu próximo passo, para você nunca mais ficar perdido',
            'A carga certa destrava a hipertrofia, obrigando o seu músculo a crescer (sem achismos)',
            'Acesso ao PA Flix Básico (Dicas Ocultas)',
        ],
        itensExcluidos: ['Estratégia Alimentar Específica'],
        itemDestaque: '',
        bonusTitulo: '🎁 BÔNUS DE ACORDO COM O PLANO:',
        bonusItens: [
            'Mensal: E-books 5 Dicas + Receitas (Whey e Salgadas)',
            'Trimestral: Tudo acima + Shape Natural + Pernas',
            'Semestral/Anual: Tudo acima + Todos os Audiobooks',
        ],
        precos: { mensal: { valor: 197, descontoPerc: 0 }, trimestral: { valor: 397, descontoPerc: 0 }, semestral: { valor: 697, descontoPerc: 0 }, anual: { valor: 1197, descontoPerc: 0 } },
        ctaTexto: 'QUERO PARAR DE TREINAR NO ESCURO',
    },
    {
        id: 'default-elite',
        nome: 'ELITE VIP',
        descricao: 'Para quem cansou de tentar, errar e continuar no mesmo corpo.\n\nO acompanhamento definitivo para você parar de perder tempo e acelerar o seu resultado.',
        destaque: true,
        badgeTexto: 'EXPERIÊNCIA COMPLETA',
        itensInclusos: [
            'A direção exata do que fazer em cada treino — sem dúvida, sem improviso',
            'Cada repetição passa a ter correção biomecânica, extraindo o máximo do músculo',
            'Seu corpo não trava — toda vez que estagnar, ajustamos a rota antes',
            'O suporte lado a lado garante que você nunca mais se sinta sozinho no processo',
            'A intensidade certa para mudar o corpo, usando a ciência ao invés de adivinhar a carga',
            'Acesso livre ao PA Flix VIP (Todo o Arsenal)',
        ],
        itensExcluidos: [],
        itemDestaque: '🔥 O espelho começa a refletir a mudança, porque a alimentação e o treino finalmente estão alinhados',
        bonusTitulo: '🎁 BÔNUS DE ACORDO COM O PLANO:',
        bonusItens: [
            'Mensal: E-books 5 Dicas + Receitas (Whey e Salgadas)',
            'Trimestral: Tudo acima + Shape Natural + Pernas',
            'Semestral/Anual: Tudo acima + Todos os Audiobooks',
        ],
        precos: { mensal: { valor: 297, descontoPerc: 0 }, trimestral: { valor: 597, descontoPerc: 0 }, semestral: { valor: 1097, descontoPerc: 0 }, anual: { valor: 1890, descontoPerc: 0 } },
        ctaTexto: 'QUERO VER RESULTADO DE VERDADE',
    },
];

// Normaliza o preço de um período — aceita tanto o formato novo
// ({valor, descontoPerc}) quanto um número solto (ofertas eventualmente
// criadas antes do desconto existir), sempre devolvendo o mesmo shape.
function getPeriodoPreco(card, periodo) {
    const raw = card?.precos?.[periodo];
    if (raw == null) return null;
    if (typeof raw === 'object') return { valor: raw.valor, descontoPerc: raw.descontoPerc || 0 };
    return { valor: raw, descontoPerc: 0 };
}

const PERIOD_LABELS = { mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual' };

function formatBRL(value) {
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function PropostaScreen({ route, navigation }) {
    const rawName = route?.params?.nome?.trim() || '';
    const genericNames = ['novo aluno', 'nova aluna', 'aluno', 'aluna', 'teste', 'atleta', 'lead', 'cliente'];
    const isGeneric = !rawName || genericNames.includes(rawName.toLowerCase());
    
    const displayName = isGeneric ? 'ATLETA' : rawName.toUpperCase();

    // 🔑 Chave do timer: usa o ID único do link (gerado pelo AdminInviteModal)
    // em vez do nome do lead. Isso evita que dois links diferentes com o
    // mesmo nome (ex: testes com "João") colidam e um pareça "expirado"
    // por causa do timer salvo de outro teste anterior no mesmo navegador.
    const linkId = route?.params?.id?.trim() || '';
    const storageKeyName = linkId || (isGeneric ? 'default_lead' : rawName.toLowerCase());

    // 👁️ Modo preview — só ativo quando aberto internamente pelo admin
    // (TabPropostaOfertas), nunca por um link real enviado a um lead.
    // Aceita tanto boolean (navegação em memória) quanto string "true"
    // (caso a URL seja recarregada e o param venha reparsed da query string).
    const isPreview = ['true', true].includes(route?.params?.preview);

    const handlePreviewBack = () => {
        if (navigation?.canGoBack?.()) {
            navigation.goBack();
        } else if (navigation?.navigate) {
            navigation.navigate('AdminDashboard');
        }
    };

    // 🔥 ROTEAMENTO INTELIGENTE DE WHATSAPP (PAULO OU ADRI) 🔥
    // Lê o parâmetro ?coach= embutido pelo AdminInviteModal na hora de gerar o link.
    const coachParam = route?.params?.coach?.trim()?.toLowerCase() || '';
    const telefoneParam = route?.params?.telefone?.trim() || '';

    let waNumber = '5541997991346'; // Padrão: Paulo
    if (telefoneParam) {
        waNumber = telefoneParam.replace(/\D/g, ''); // Limpa qualquer traço/espaço
    } else if (['adri', 'adriele', 'japinha'].includes(coachParam)) {
        waNumber = '5541998465582'; // Redireciona para a Adri
    }

    // 💎 OFERTA DINÂMICA (?oferta=slug) — busca cards/preços customizados.
    // Se não vier parâmetro, ou a busca falhar, usa DEFAULT_CARDS (igual sempre foi).
    const ofertaSlug = route?.params?.oferta?.trim() || '';
    const [cards, setCards] = useState(DEFAULT_CARDS);

    useEffect(() => {
        if (!ofertaSlug) return; // sem parâmetro → mantém os cards padrão

        let cancelado = false;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/proposta-ofertas?slug=${encodeURIComponent(ofertaSlug)}`);
                if (!res.ok) return; // 404 ou erro → mantém DEFAULT_CARDS
                const data = await res.json();
                if (!cancelado && data?.oferta?.cards?.length) {
                    setCards(data.oferta.cards);
                }
            } catch (e) {
                console.log('Erro ao buscar oferta, usando preços padrão', e);
                // silenciosamente mantém DEFAULT_CARDS — a página nunca quebra
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

    // ── Renderiza um card de plano dinâmico (Performance/Elite ou qualquer
    //    nome customizado vindo de uma Oferta) ────────────────────────────
    const renderPlanCard = (card) => {
        const periodosComPreco = Object.keys(PERIOD_LABELS).filter(p => getPeriodoPreco(card, p)?.valor);

        const cardContent = (
            <>
                {card.destaque && card.badgeTexto ? (
                    <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>{card.badgeTexto}</Text></View>
                ) : null}
                <Text style={[styles.planName, { color: card.destaque ? '#4DE38F' : '#FFF' }]}>{card.nome}</Text>
                <Text style={[styles.planDesc, card.destaque && { color: '#CCC' }]}>{card.descricao}</Text>

                <View style={styles.planItems}>
                    {card.itensInclusos.map((item, i) => (
                        <View key={`inc-${i}`} style={styles.planItemRow}>
                            <MaterialCommunityIcons name="check-circle" size={16} color="#4DE38F" style={styles.planItemIcon} />
                            <Text style={[styles.planItemText, card.destaque && { color: '#FFF' }]}>{item}</Text>
                        </View>
                    ))}
                    {card.itensExcluidos.map((item, i) => (
                        <View key={`exc-${i}`} style={styles.planItemRow}>
                            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#555" style={styles.planItemIcon} />
                            <Text style={[styles.planItemText, { color: '#666', textDecorationLine: 'line-through' }]}>{item}</Text>
                        </View>
                    ))}
                </View>

                {card.itemDestaque ? (
                    <View style={styles.itemDestaqueBox}>
                        <Text style={styles.itemDestaqueText}>{card.itemDestaque}</Text>
                    </View>
                ) : null}

                {card.bonusTitulo ? (
                    <View style={[styles.bonusSection, card.destaque && { borderColor: 'rgba(77, 227, 143, 0.2)' }]}>
                        <Text style={[styles.bonusTitle, card.destaque && { color: '#4DE38F' }]}>{card.bonusTitulo}</Text>
                        {card.bonusItens.map((item, i) => (
                            <Text key={i} style={[styles.bonusItem, card.destaque && { color: '#CCC' }]}>• {item}</Text>
                        ))}
                    </View>
                ) : null}

                <View style={styles.pricingGrid}>
                    {periodosComPreco.map((periodo) => {
                        const p = getPeriodoPreco(card, periodo);
                        const hasDiscount = p.descontoPerc > 0;
                        const precoFinal = hasDiscount ? p.valor * (1 - p.descontoPerc / 100) : p.valor;
                        return (
                            <View key={periodo} style={styles.priceRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.pricePeriod, periodo === 'anual' && { color: card.destaque ? '#4DE38F' : '#FFF' }]}>
                                        {PERIOD_LABELS[periodo]}
                                    </Text>
                                    {hasDiscount ? (
                                        <View style={styles.discountBadge}>
                                            <Text style={styles.discountBadgeText}>{p.descontoPerc}% OFF</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    {hasDiscount ? (
                                        <Text style={styles.priceStriked}>De: R$ {formatBRL(p.valor)}</Text>
                                    ) : null}
                                    <Text style={[styles.priceValue, periodo === 'anual' && { color: card.destaque ? '#4DE38F' : '#FFF' }]}>
                                        R$ {formatBRL(precoFinal)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <Text style={styles.urgencyText}>⏳ Depois que o tempo acabar, essa condição não volta.</Text>
            </>
        );

        if (card.destaque) {
            return (
                <Animated.View key={card.id} style={[styles.planCard, { borderColor: '#4DE38F', borderWidth: 2, transform: [{ scale: pulseAnim }] }]}>
                    {cardContent}
                    <TouchableOpacity onPress={() => handleWhatsAppCTA(card.nome)}>
                        <LinearGradient colors={['#4DE38F', '#2bb368']} style={styles.buyBtnGradient}>
                            <Text style={[styles.buyBtnText, { color: '#000' }]}>{card.ctaTexto}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            );
        }

        return (
            <View key={card.id} style={[styles.planCard, { borderColor: '#333' }]}>
                {cardContent}
                <TouchableOpacity style={[styles.buyBtn, { backgroundColor: '#222', borderColor: '#444', borderWidth: 1 }]} onPress={() => handleWhatsAppCTA(card.nome)}>
                    <Text style={[styles.buyBtnText, { color: '#FFF' }]}>{card.ctaTexto}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <RootComponent style={styles.container}>
            <Image source={{ uri: linksAlunos.background }} style={styles.backgroundImage} blurRadius={2} />

            {isPreview && (
                <TouchableOpacity style={styles.previewBackBtn} onPress={handlePreviewBack} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color="#FFF" />
                    <Text style={styles.previewBackBtnText}>VOLTAR AO ADMIN</Text>
                </TouchableOpacity>
            )}

            <View style={styles.webWrapper}>
                <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* HERO - SPIN SELLING 🔥 NÍVEL ELITE */}
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

                    {/* ARSENAL (Subido para mais perto do começo) */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>A RESPOSTA PARA SEUS PROBLEMAS</Text>
                    <Text style={styles.sectionSub}>Nós eliminamos as falhas ocultas que te impedem de chegar ao shape dos sonhos.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="trending-up" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>O Fim da Estagnação</Text>
                            <Text style={styles.arsenalDesc}>Seu corpo não trava — toda vez que o peso ou os músculos pararem de responder, nós ajustamos a estratégia antes que você desanime.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="shield-check" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Treino Seguro e Sem Dor</Text>
                            <Text style={styles.arsenalDesc}>Você finalmente vai sentir o músculo trabalhando — sem dor nas articulações e sem ficar perdido tentando lembrar como executar a série.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="weight-lifter" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Adeus "Treino Fofo"</Text>
                            <Text style={styles.arsenalDesc}>Você para de treinar leve demais e começa a treinar com a intensidade calculada que realmente obriga o seu corpo a mudar.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="account-group" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Você Nunca Estará Sozinho</Text>
                            <Text style={styles.arsenalDesc}>Você nunca mais fica perdido na academia. Tem uma dúvida? O suporte garante que você sempre saiba qual é o próximo passo.</Text>
                        </View>
                    </ScrollView>

                    {/* 🔥 PREÇOS — AGORA DINÂMICOS (cards da oferta ou padrão) 🔥 */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>ESCOLHA SEU ARSENAL</Text>
                    <Text style={styles.sectionSub}>Você pode continuar tentando sozinho, errando e perdendo tempo… ou pode finalmente seguir um método que faz seu corpo responder.</Text>
                    <View style={styles.plansContainer}>
                        {cards.map((card) => renderPlanCard(card))}
                    </View>

                    {/* MENTOR (Rebaixado e com a nova frase de autoridade) */}
                    <View style={[styles.mentorSection, {marginTop: 40}]}>
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
                                "Eu sei exatamente o que é carregar o peso extra, a frustração de não ver resultados e a dúvida se o esforço vale a pena. Eu já fui um 'ex-gordo' com 97kg e usei a ciência para me transformar em um Campeão Natural com 77kg.{"\n\n"}O mercado fitness está cheio de planilhas genéricas. Por isso, <Text style={{color: '#4DE38F', fontWeight: 'bold'}}>eu mesmo desenvolvi do zero e programei o aplicativo ELITE TEAM</Text> que você vai usar, porque nenhuma ferramenta existente era capaz de entregar o nível de precisão biomecânica, correção de movimentos e progresso de carga que eu exijo para os meus alunos."
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

                    {/* IA HIGHLIGHT */}
                    <View style={styles.aiHighlightSection}>
                        <Text style={styles.sectionTitle}>NUNCA MAIS DESPERDICE TEMPO FAZENDO ERRADO</Text>
                        <Text style={styles.sectionSub}>A maioria das pessoas treina errado e nem percebe — por isso o corpo não muda. Aqui, cada repetição sua é ajustada para realmente gerar resultado — sem desperdiçar tempo e sem se machucar.</Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo(linksAlunos.ai_video_id, true)}
                        </View>
                    </View>

                    {/* PROVA SOCIAL */}
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

                    {/* FECHAMENTO MATADOR */}
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
    previewBackBtn: {
        position: 'absolute',
        top: isWeb ? 16 : 55,
        left: 16,
        zIndex: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    previewBackBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
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
    planDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 22, marginTop: 6, marginBottom: 26, paddingHorizontal: 6 },
    planItems: { gap: 14, marginBottom: 20 },
    planItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    planItemIcon: { marginTop: 3 },
    planItemText: { flex: 1, fontSize: 14, color: '#AAA', fontWeight: '500', lineHeight: 21 },
    itemDestaqueBox: { backgroundColor: '#4DE38F15', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#4DE38F', padding: 14, marginBottom: 25 },
    itemDestaqueText: { color: '#4DE38F', fontSize: 13, fontWeight: 'bold', lineHeight: 20 },
    bonusSection: { backgroundColor: '#222', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 25 },
    bonusTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 0.5, marginBottom: 10 },
    bonusItem: { fontSize: 12, color: '#888', marginBottom: 4, fontStyle: 'italic' },
    pricingGrid: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 15, marginBottom: 25, gap: 10 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 8 },
    pricePeriod: { color: '#888', fontSize: 14, fontWeight: '600' },
    priceValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    discountBadge: { backgroundColor: '#4DE38F20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#4DE38F' },
    discountBadgeText: { color: '#4DE38F', fontSize: 9, fontWeight: '900' },
    priceStriked: { color: '#666', fontSize: 11, textDecorationLine: 'line-through', fontWeight: 'bold' },
    
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

    finalClosingText: { color: '#4DE38F', fontSize: 16, fontWeight: '900', textAlign: 'center', marginTop: 40, marginBottom: 10, paddingHorizontal: 20, lineHeight: 26, fontStyle: 'italic' },

    footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
    footerText: { color: '#666', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    footerSubText: { color: '#444', fontSize: 10, marginTop: 5 }
});