// src/screens/PropostaMaesScreen.js
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

// 🔥 COR TEMÁTICA DIA DAS MÃES (Rosa/Magenta) 🔥
const MAIN_COLOR = '#FF2A7A';

const faqList = [
    { q: "Para quem é a Consultoria Elite?", a: "Funciona tanto pra quem está começando e não sabe por onde ir… quanto pra quem já treina mas não vê mais resultado. No nosso app exclusivo, você tem a direção exata do que fazer, sem treinos genéricos de papel." },
    { q: "E se eu não tiver tempo para treinar todos os dias?", a: "A culpa de não ter resultados não é a falta de tempo, é a falta de estratégia. Se você só tem 3 dias na semana ou 45 minutos por dia, seu treino será cirurgicamente montado para hipertrofiar ou secar dentro dessa janela de tempo. O plano se adapta à sua rotina, não o contrário." },
    { q: "Como funciona a análise de vídeo por IA?", a: "É simples: você grava 10 segundos da sua execução direto no App. O sistema avalia seus ângulos e te dá o feedback na hora. É o fim da dúvida se você está fazendo o movimento certo para o músculo crescer." },
    { q: "Vou ter que fazer dietas malucas e restritivas?", a: "De jeito nenhum. No plano Elite VIP, sua estratégia será calculada para a sua realidade. Você vai comer o que gosta, mas com as quantidades perfeitas para destravar a queima de gordura e ganho de massa." },
    { q: "Em quanto tempo eu vejo resultados no meu corpo?", a: "A ciência não falha. Nossos alunos, quando seguem a direção certa que entregamos, costumam relatar mudanças visíveis no espelho e na balança logo nas primeiras semanas." },
    { q: "O suporte é com um robô ou diretamente com você?", a: "Os dois! Você tem o bot PA Coach AI 24h para dúvidas rápidas, e no plano Elite VIP, você tem acesso ao meu WhatsApp pessoal para ajustes, garantindo que você nunca fique travado no processo." }
];

export default function PropostaMaesScreen({ route }) {
    const rawName = route?.params?.nome?.trim() || '';
    const genericNames = ['novo aluno', 'nova aluna', 'aluno', 'aluna', 'teste', 'atleta', 'lead', 'cliente'];
    const isGeneric = !rawName || genericNames.includes(rawName.toLowerCase());
    
    const displayName = isGeneric ? 'ATLETA' : rawName.toUpperCase();

    // 🔥 ROTEAMENTO INTELIGENTE DE WHATSAPP (PAULO OU ADRI) 🔥
    const coachParam = route?.params?.coach?.trim()?.toLowerCase() || '';
    const telefoneParam = route?.params?.telefone?.trim() || '';
    
    let waNumber = '5541997991346'; // Padrão: Paulo
    if (telefoneParam) {
        waNumber = telefoneParam.replace(/\D/g, ''); // Limpa qualquer traço/espaço
    } else if (['adri', 'adriele', 'japinha'].includes(coachParam)) {
        waNumber = '5541998465582'; // Redireciona para a Adri
    }

    const [timeLeft, setTimeLeft] = useState(null);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    
    const [genderFilter, setGenderFilter] = useState('F'); 

    useEffect(() => {
        const calculateTimeLeft = () => {
            const expireDate = new Date('2026-05-10T23:59:59-03:00').getTime();
            const now = new Date().getTime();
            const diff = Math.floor((expireDate - now) / 1000);
            return diff > 0 ? diff : 0;
        };

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            const newTime = calculateTimeLeft();
            setTimeLeft(newTime);
            if (newTime <= 0) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        if (d > 0) return `${d}D ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleWhatsAppCTA = (plan) => {
        const text = `Oi, Quero aproveitar a oferta do mês das mães e destravar meu acesso ao plano ${plan}. Bora começar!`;
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
                <View style={styles.expiredBox}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={64} color="#FF3B30" />
                    <Text style={styles.expiredTitle}>OFERTA EXPIRADA</Text>
                    <Text style={styles.expiredDesc}>A condição especial de Dia das Mães já encerrou. Fale com o suporte para verificar os valores atuais.</Text>
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
                    
                    {/* HERO - FOCO DIA DAS MÃES E "CARONA" PARA HOMENS 🔥 */}
                    <View style={styles.heroSection}>
                        <View style={styles.timerBadge}>
                            <MaterialCommunityIcons name="timer-sand" size={16} color={MAIN_COLOR} />
                            <Text style={styles.timerText}>OFERTA DE MÊS DAS MÃES EXPIRA EM: {formatTime(timeLeft)}</Text>
                        </View>
                        <Text style={styles.heroGreeting}>FALA, {displayName}! 🎯</Text>
                        <Text style={styles.heroTitle}>O MELHOR PRESENTE É A <Text style={{color: MAIN_COLOR}}>SUA MELHOR VERSÃO</Text></Text>
                        <Text style={styles.heroSub}>
                            Neste mês das mães, resolvi liberar uma condição inédita. Seja para você dar esse presente a si mesma, presentear a mulher da sua vida, <Text style={{color: MAIN_COLOR, fontWeight: 'bold'}}>ou até mesmo para VOCÊ (homem) pegar carona nessa oportunidade</Text> e mudar o seu próprio corpo de vez.
                        </Text>
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
                                <View style={styles.featureIconBox}><MaterialCommunityIcons name="card-account-details-star-outline" size={28} color={MAIN_COLOR} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mentorSub}>EU JÁ ESTIVE DO OUTRO LADO</Text>
                                    <Text style={styles.mentorLabelHeader}>CONHEÇA SEU MENTOR:</Text>
                                    <Text style={styles.mentorNameStrong}>PAULO ADRIANO</Text>
                                </View>
                            </View>

                            <Text style={styles.mentorDesc}>
                                "Eu sei exatamente o que é carregar o peso extra, a frustração de não ver resultados e a dúvida se o esforço vale a pena. Eu já fui um 'ex-gordo' com 97kg. Mas eu descobri o caminho. Usei a ciência e a disciplina para me transformar em um Campeão Natural com 77kg. Eu não vendo planos; eu guio transformações reais."
                            </Text>

                            <View style={[styles.swipeHintContainer, {backgroundColor: `${MAIN_COLOR}15`, borderColor: `${MAIN_COLOR}30`}]}>
                                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={24} color={MAIN_COLOR} />
                                <Text style={[styles.swipeHintText, {color: MAIN_COLOR}]}>ARRASTE PARA O LADO E VEJA A TRANSFORMAÇÃO</Text>
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
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>A RESPOSTA PARA SEUS PROBLEMAS</Text>
                    <Text style={styles.sectionSub}>Nós eliminamos as falhas ocultas que te impedem de chegar ao shape dos sonhos.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="trending-up" size={32} color={MAIN_COLOR} /></View>
                            <Text style={styles.arsenalTitle}>O Fim da Estagnação</Text>
                            <Text style={styles.arsenalDesc}>Seu corpo não trava — toda vez que o peso ou os músculos pararem de responder, nós ajustamos a estratégia antes que você desanime.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="shield-check" size={32} color={MAIN_COLOR} /></View>
                            <Text style={styles.arsenalTitle}>Treino Seguro e Sem Dor</Text>
                            <Text style={styles.arsenalDesc}>Você finalmente vai sentir o músculo trabalhando — sem dor nas articulações e sem ficar perdido tentando lembrar como executar a série.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="weight-lifter" size={32} color={MAIN_COLOR} /></View>
                            <Text style={styles.arsenalTitle}>Adeus "Treino Fofo"</Text>
                            <Text style={styles.arsenalDesc}>Você para de treinar leve demais e começa a treinar com a intensidade calculada que realmente obriga o seu corpo a mudar.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="account-group" size={32} color={MAIN_COLOR} /></View>
                            <Text style={styles.arsenalTitle}>Você Nunca Estará Sozinho</Text>
                            <Text style={styles.arsenalDesc}>Você nunca mais fica perdido na academia. Tem uma dúvida? O suporte garante que você sempre saiba qual é o próximo passo.</Text>
                        </View>
                    </ScrollView>

                    {/* IA HIGHLIGHT */}
                    <View style={[styles.aiHighlightSection, {borderColor: `${MAIN_COLOR}30`}]}>
                        <Text style={styles.sectionTitle}>NUNCA MAIS DESPERDICE TEMPO FAZENDO ERRADO</Text>
                        <Text style={styles.sectionSub}>A maioria das pessoas treina errado e nem percebe — por isso o corpo não muda. Aqui, cada repetição sua é ajustada para realmente gerar resultado — sem desperdiçar tempo e sem se machucar.</Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo(linksAlunos.ai_video_id, true)}
                        </View>
                    </View>

                    {/* PROVA SOCIAL COM FILTRO INTELIGENTE E SPIN MATADOR 🔥 */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>NÃO SOMOS TREINADORES DE TEORIA</Text>
                    <Text style={styles.sectionSub}>
                        Eu e a Adri vivemos a transformação na pele. Nós transformamos nossos próprios corpos, subimos nos palcos de fisiculturismo natural e validamos esse exato método em dezenas de alunos com resultados absurdos. Estes abaixo são <Text style={{fontWeight: 'bold', color: '#FFF'}}>apenas alguns</Text> deles.
                    </Text>
                    
                    {/* A PERGUNTA DE FECHAMENTO SPIN */}
                    <View style={styles.spinQuestionBox}>
                        <MaterialCommunityIcons name="lightning-bolt" size={24} color={MAIN_COLOR} />
                        <Text style={[styles.spinQuestionText, {color: MAIN_COLOR}]}>
                            A pergunta é: se eu te entregar a direção exata, a dieta mastigada e o treino corrigido... você está disposto(a) a seguir o plano para ser o nosso próximo "Antes e Depois"?
                        </Text>
                    </View>
                    
                    {/* ABAS DO FILTRO */}
                    <View style={{flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 10, paddingHorizontal: 20}}>
                        <TouchableOpacity 
                            style={[styles.genderTab, genderFilter === 'F' && {backgroundColor: MAIN_COLOR, borderColor: MAIN_COLOR}]}
                            onPress={() => setGenderFilter('F')}
                        >
                            <Text style={[styles.genderTabText, genderFilter === 'F' && {color: '#FFF'}]}>👩 MULHERES</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.genderTab, genderFilter === 'M' && {backgroundColor: '#32ADE6', borderColor: '#32ADE6'}]}
                            onPress={() => setGenderFilter('M')}
                        >
                            <Text style={[styles.genderTabText, genderFilter === 'M' && {color: '#FFF'}]}>👨 HOMENS</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        {genderFilter === 'F' ? (
                            <>
                                <ModernResultCard goal="🔥 QUASE 20KG ELIMINADOS: DE 97KG PARA 77KG COM SAÚDE E CURVAS RECUPERADAS (Letícia - Aluna da Adri)" montageUri={linksAlunos.leticia_montagem} />
                                <ModernResultCard goal="🍑 CORPO DESENHADO E GLÚTEO NA NUCA: HIPERTROFIA E DEFINIÇÃO REAL (Jéssica - Aluna da Adri)" montageUri={linksAlunos.jessica_montagem} />
                                <ModernResultCard goal="⏳ O FIM DA GORDURINHA NAS COSTAS: CINTURA FINA E CONFIANÇA PARA VESTIR QUALQUER ROUPA (Evelyn)" montageUri={linksAlunos.evelyn_montagem} />
                                <ModernResultCard goal="⚡️ O FIM DA INSEGURANÇA: UM FÍSICO TOTALMENTE RECONSTRUÍDO (Ana)" montageUri={linksAlunos.ana_montagem} />
                                <ModernResultCard goal="⏱️ A PROVA DE QUE NÃO PRECISA DEMORAR: CHOQUE VISUAL EM 11 DIAS (Yasmin)" montageUri={linksAlunos.yasmin_montagem} />
                                <ModernResultCard goal="⚖️ VENCENDO A LUTA CONTRA A BALANÇA: UM EMAGRECIMENTO REAL, VISÍVEL E DEFINITIVO (Vane)" montageUri={linksAlunos.vane_montagem} />
                                <ModernResultCard goal="🔥 O RESGATE DA AUTOESTIMA: SILHUETA NOVA E BARRIGA CHAPADA (Bruna)" montageUri={linksAlunos.bruna_montagem} />
                                <ModernResultCard goal="🏆 QUEBRANDO PLATÔS: DO TREINO COMUM AO PADRÃO DE PALCO (Adri)" montageUri={linksAlunos.adri_montagem} />
                            </>
                        ) : (
                            <>
                                <ModernResultCard goal="🔥 O FIM DA FLACIDEZ: DE UM CORPO SEM FORMA À DEFINIÇÃO ESCULPIDA (Bernard)" montageUri={linksAlunos.bernard_montagem} />
                                <ModernResultCard goal="🏆 VENCENDO O SOBREPESO: A VIRADA DE CHAVE QUE DERRETEU A GORDURA (Paulo)" montageUri={linksAlunos.paulo_montagem} />
                                <ModernResultCard goal="🔥 DESTRUINDO A GORDURA VISCERAL: O FIM DA BARRIGA TEIMOSA (Allan)" montageUri={linksAlunos.allan_montagem} />
                                <ModernResultCard goal="💪 DA OBESIDADE À PERFORMANCE: O CORPO QUE ELE ACHOU QUE NUNCA TERIA (Pedro)" montageUri={linksAlunos.pedro_montagem} />
                                <ModernResultCard goal="💣 VENCENDO A GENÉTICA: DE UM CORPO MAGRO A UMA DENSIDADE REAL (Jean)" montageUri={linksAlunos.jean_montagem} />
                                <ModernResultCard goal="🥊 MUITO MAIS QUE QUILOS ELIMINADOS: O RESGATE ABSOLUTO DA AUTOESTIMA E QUALIDADE DE VIDA (Bruno)" montageUri={linksAlunos.bruno_montagem} />
                            </>
                        )}
                    </ScrollView>

                    {/* BÔNUS EXCLUSIVOS COM COR DINÂMICA 🔥 */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>ARSENAL DE BÔNUS</Text>
                    <Text style={styles.sectionSub}>Material extra desbloqueado de acordo com o seu plano de assinatura.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_5dicas} title="E-book: 5 Dicas de Emagrecimento" subtitle="O pontapé inicial para a queima." isAudio={false} price="14,90" unlockText="A PARTIR DO MENSAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_receitas_whey} title="Receitas Fit com Whey" subtitle="Sobremesas anabólicas." isAudio={false} price="19,90" unlockText="A PARTIR DO MENSAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_receitas_salgadas} title="Receitas Fit Salgadas" subtitle="Almoço e janta no plano." isAudio={false} price="19,90" unlockText="A PARTIR DO MENSAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_shape} title="E-book: Shape Natural" subtitle="Guia completo de hipertrofia." isAudio={false} price="34,90" unlockText="A PARTIR DO TRIMESTRAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_pernas} title="E-book: Pernas Grandes" subtitle="Foco em membros inferiores." isAudio={false} price="29,90" unlockText="A PARTIR DO TRIMESTRAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.ebook_5dicas} title="Audiobook: 5 Dicas de Emagrecimento" subtitle="Ouça em qualquer lugar." isAudio={true} price="14,90" unlockText="A PARTIR DO SEMESTRAL" />
                        <BonusCard themeColor={MAIN_COLOR} uri={linksAlunos.audio_shape} title="Audiobook: Shape Natural" subtitle="Para ouvir a caminho do treino." isAudio={true} price="34,90" unlockText="A PARTIR DO SEMESTRAL" />
                    </ScrollView>

                    {/* MOMENTO DE COLAPSO E ESCOLHA DE PLANOS */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>ESCOLHA SEU ARSENAL COM DESCONTO</Text>
                    <Text style={styles.sectionSub}>A condição especial de Mês das Mães para você decidir mudar hoje.</Text>
                    
                    <View style={styles.plansContainer}>
                        
                        {/* PERFORMANCE */}
                        <View style={[styles.planCard, { borderColor: '#333' }]}>
                            <View style={[styles.recommendedBadge, {backgroundColor: '#333'}]}><Text style={[styles.recommendedText, {color: '#FFF'}]}>ESPECIAL MÊS DAS MÃES</Text></View>
                            <Text style={[styles.planName, { color: '#FFF', marginTop: 10 }]}>PERFORMANCE</Text>
                            <Text style={styles.planDesc}>Apenas Treinos Personalizados</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={styles.planItem}>✓ Você sabe exatamente o que fazer em cada treino</Text>
                                <Text style={styles.planItem}>✓ Correção biomecânica e direção de repetições</Text>
                                <Text style={styles.planItem}>✓ Suporte no app para ajustes e estagnação</Text>
                                <Text style={styles.planItem}>✓ Acesso ao PA Flix Básico</Text>
                                <Text style={[styles.planItem, { color: '#666', textDecorationLine: 'line-through' }]}>✗ Estratégia Alimentar Específica</Text>
                            </View>
                            
                            <View style={styles.pricingGrid}>
                                <View style={styles.priceRowPromo}>
                                    <View>
                                        <Text style={styles.pricePeriod}>Mensal</Text>
                                        <View style={styles.discountBadge}><Text style={styles.discountText}>50% OFF</Text></View>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.priceDe}>De: R$ 197</Text>
                                        <Text style={styles.pricePor}>Por: <Text style={{fontSize: 22}}>R$ 98,50</Text></Text>
                                    </View>
                                </View>
                                <View style={styles.priceRowPromo}>
                                    <View>
                                        <Text style={styles.pricePeriod}>Trimestral</Text>
                                        <View style={styles.discountBadge}><Text style={styles.discountText}>20% OFF</Text></View>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.priceDe}>De: R$ 397</Text>
                                        <Text style={styles.pricePor}>Por: <Text style={{fontSize: 22}}>R$ 317,60</Text></Text>
                                    </View>
                                </View>
                                <View style={styles.priceRowPromo}>
                                    <View>
                                        <Text style={styles.pricePeriod}>Semestral</Text>
                                        <View style={styles.discountBadge}><Text style={styles.discountText}>25% OFF</Text></View>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.priceDe}>De: R$ 697</Text>
                                        <Text style={styles.pricePor}>Por: <Text style={{fontSize: 22}}>R$ 522,75</Text></Text>
                                    </View>
                                </View>
                                <View style={[styles.priceRowPromo, {borderBottomWidth: 0}]}>
                                    <View>
                                        <Text style={[styles.pricePeriod, {color: '#FFF'}]}>Anual</Text>
                                        <View style={styles.discountBadge}><Text style={styles.discountText}>30% OFF</Text></View>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.priceDe}>De: R$ 1.197</Text>
                                        <Text style={[styles.pricePor, {color: '#FFF'}]}>Por: <Text style={{fontSize: 22}}>R$ 837,90</Text></Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.buyBtn, { backgroundColor: '#222', borderColor: '#444', borderWidth: 1 }]} onPress={() => handleWhatsAppCTA('Performance')}>
                                <Text style={[styles.buyBtnText, { color: '#FFF' }]}>QUERO O PERFORMANCE</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ELITE VIP */}
                        <Animated.View style={[styles.planCard, { borderColor: MAIN_COLOR, borderWidth: 2, transform: [{ scale: pulseAnim }] }]}>
                            <View style={[styles.recommendedBadge, {backgroundColor: MAIN_COLOR}]}><Text style={styles.recommendedText}>MELHOR CUSTO-BENEFÍCIO</Text></View>
                            <Text style={[styles.planName, { color: MAIN_COLOR, marginTop: 10 }]}>ELITE VIP</Text>
                            <Text style={[styles.planDesc, { color: '#CCC' }]}>Acompanhamento Absoluto: Treino + Dieta</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ A direção exata do que fazer no treino — sem improviso</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Ajustes rápidos antes do seu corpo estagnar</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Suporte de Elite no WhatsApp para tirar dúvidas</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Acesso livre ao PA Flix VIP (Todo o Arsenal)</Text>
                                <Text style={[styles.planItem, { color: MAIN_COLOR, fontWeight: 'bold' }]}>🔥 Estratégia de Dieta Alinhada ao Treino para mudança visível</Text>
                            </View>

                            <View style={[styles.pricingGrid, {borderColor: `${MAIN_COLOR}30`, borderWidth: 1}]}>
                                <View style={styles.priceRowPromo}>
                                    <View>
                                        <Text style={styles.pricePeriod}>Mensal</Text>
                                        <View style={[styles.discountBadge, {backgroundColor: `${MAIN_COLOR}20`, borderColor: MAIN_COLOR}]}><Text style={[styles.discountText, {color: MAIN_COLOR}]}>50% OFF</Text></View>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.priceDe}>De: R$ 297</Text>
                                        <Text style={[styles.pricePor, {color: MAIN_COLOR}]}>Por: <Text style={{fontSize: 22}}>R$ 148,50</Text></Text>
                                    </View>
                                </View>
                                <View style={styles.priceRowPromo}>
                                    <View>
                                        <Text style={styles.pricePeriod}>Trimestral</Text>
                                        <View style={[styles.discountBadge, {backgroundColor: `${MAIN_COLOR}20`, borderColor: MAIN_COLOR}]}><Text style={[styles.discountText, {color: MAIN_COLOR}]}>20% OFF</Text></View>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.priceDe}>De: R$ 597</Text>
                                        <Text style={[styles.pricePor, {color: MAIN_COLOR}]}>Por: <Text style={{fontSize: 22}}>R$ 477,60</Text></Text>
                                    </View>
                                </View>
                                <View style={styles.priceRowPromo}>
                                    <View>
                                        <Text style={styles.pricePeriod}>Semestral</Text>
                                        <View style={[styles.discountBadge, {backgroundColor: `${MAIN_COLOR}20`, borderColor: MAIN_COLOR}]}><Text style={[styles.discountText, {color: MAIN_COLOR}]}>30% OFF</Text></View>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.priceDe}>De: R$ 1.097</Text>
                                        <Text style={[styles.pricePor, {color: MAIN_COLOR}]}>Por: <Text style={{fontSize: 22}}>R$ 767,90</Text></Text>
                                    </View>
                                </View>
                                <View style={[styles.priceRowPromo, {borderBottomWidth: 0}]}>
                                    <View>
                                        <Text style={[styles.pricePeriod, {color: '#FFF'}]}>Anual</Text>
                                        <View style={[styles.discountBadge, {backgroundColor: `${MAIN_COLOR}20`, borderColor: MAIN_COLOR}]}><Text style={[styles.discountText, {color: MAIN_COLOR}]}>40% OFF</Text></View>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.priceDe}>De: R$ 1.890</Text>
                                        <Text style={[styles.pricePor, {color: MAIN_COLOR}]}>Por: <Text style={{fontSize: 22}}>R$ 1.134,00</Text></Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity onPress={() => handleWhatsAppCTA('Elite VIP')}>
                                <LinearGradient colors={[MAIN_COLOR, '#D81B60']} style={styles.buyBtnGradient}>
                                    <Text style={[styles.buyBtnText, { color: '#FFF' }]}>QUERO GARANTIR MINHA VAGA ELITE</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* FAQ */}
                    <Text style={[styles.sectionTitle, {marginTop: 40, marginBottom: 20}]}>AINDA TEM DÚVIDAS?</Text>
                    <FaqAccordion faqs={faqList} />

                    <Text style={[styles.finalClosingText, {color: MAIN_COLOR}]}>
                        "Não deixe para cuidar de você depois. A única diferença entre quem muda o corpo... e quem continua no mesmo lugar... é começar hoje."
                    </Text>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>PAULO ADRIANO TEAM © 2026</Text>
                        <Text style={styles.footerSubText}>Página segura. Oferta exclusiva de Mês das Mães.</Text>
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
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${MAIN_COLOR}15`, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: MAIN_COLOR, marginBottom: 25 },
    timerText: { color: MAIN_COLOR, fontWeight: '900', fontSize: 12, marginLeft: 8, letterSpacing: 1 },
    heroGreeting: { color: '#888', fontWeight: '900', fontSize: 14, letterSpacing: 2, marginBottom: 10 },
    heroTitle: { color: '#FFF', fontSize: 30, fontWeight: '900', textAlign: 'center', lineHeight: 36, letterSpacing: -1, marginBottom: 15 },
    heroSub: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },

    videoSection: { marginBottom: 50 },
    videoContainer9x16: { width: '100%', maxWidth: 280, aspectRatio: 9/16, backgroundColor: '#222', borderRadius: 16, overflow: 'hidden', alignSelf: 'center', marginTop: 20, borderWidth: 1, borderColor: '#333', position: 'relative' },

    mentorSection: { marginBottom: 40, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
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
    imagePlaceholderMentor: { width: '100%', aspectRatio: 9/16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'transparent' }, 
    resultImageMentorContain: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 14 }, 

    sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, marginBottom: 5 },
    sectionSub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
    
    spinQuestionBox: { backgroundColor: `${MAIN_COLOR}15`, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: `${MAIN_COLOR}30`, marginBottom: 30, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 10 },
    spinQuestionText: { flex: 1, fontSize: 13, fontWeight: 'bold', lineHeight: 20 },

    // 🔥 ESTILOS DAS ABAS DE GÊNERO 🔥
    genderTab: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#333', backgroundColor: '#111', alignItems: 'center' },
    genderTabText: { color: '#888', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

    arsenalCard: { width: width > 600 ? 250 : width * 0.7, backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A', marginRight: 15, alignItems: 'flex-start' },
    featureIconBox: { width: 54, height: 54, borderRadius: 27, backgroundColor: `${MAIN_COLOR}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: `${MAIN_COLOR}30` },
    arsenalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    arsenalDesc: { color: '#888', fontSize: 13, lineHeight: 20 },
    carouselContainer: { paddingLeft: 0, paddingRight: 20, paddingBottom: 20 },
    aiHighlightSection: { marginTop: 20, marginBottom: 40, paddingHorizontal: 15, paddingVertical: 30, backgroundColor: '#111', borderRadius: 24, borderWidth: 1 },

    plansContainer: { gap: 25, marginTop: 10 },
    planCard: { backgroundColor: '#161616', padding: 25, borderRadius: 24, borderWidth: 1, position: 'relative' },
    planName: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 5, textAlign: 'center' },
    planDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 25 },
    planItems: { gap: 12, marginBottom: 25 },
    planItem: { fontSize: 14, color: '#AAA', fontWeight: '500' },
    
    pricingGrid: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 15, marginBottom: 25 },
    priceRowPromo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222', paddingVertical: 12 },
    pricePeriod: { color: '#888', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
    discountBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#444' },
    discountText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    priceDe: { color: '#666', fontSize: 12, textDecorationLine: 'line-through', fontWeight: 'bold' },
    pricePor: { color: '#AAA', fontSize: 14, fontWeight: '900' },
    
    buyBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
    buyBtnGradient: { padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    buyBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
    recommendedBadge: { position: 'absolute', top: -12, alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 12 },
    recommendedText: { color: '#FFF', fontWeight: '900', fontSize: 10, letterSpacing: 1 },

    expiredBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#0a0a0a' },
    expiredTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
    expiredDesc: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    expiredBtn: { backgroundColor: '#222', padding: 18, borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
    expiredBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    finalClosingText: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginTop: 40, marginBottom: 10, paddingHorizontal: 20, lineHeight: 26, fontStyle: 'italic' },

    footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
    footerText: { color: '#666', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    footerSubText: { color: '#444', fontSize: 10, marginTop: 5 }
});