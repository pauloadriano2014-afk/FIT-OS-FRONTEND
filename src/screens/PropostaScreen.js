// src/screens/PropostaScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Linking, Platform, SafeAreaView, Animated, Image, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;
const { width } = Dimensions.get('window');

// =========================================================================
// 🔥 CENTRAL DE LINKS DO COACH 🔥
// =========================================================================
const linksAlunos = {
    background: 'https://i.imgur.com/vHq0L5K.jpg', 

    // Mentor
    paulo_antes: 'https://i.imgur.com/lDEL5tU.jpeg',
    paulo_depois: 'https://i.imgur.com/xbkfQ1x.png',

    // Prova Social
    pedro_antes: 'https://i.imgur.com/mYfONm5.png',
    pedro_depois: 'https://i.imgur.com/ykG2kEj.jpeg',
    bernard_antes: 'https://i.imgur.com/Ot3Kjug.png',
    bernard_depois: 'https://i.imgur.com/bZrUwPo.jpeg',
    ana_antes: 'https://i.imgur.com/xDJxQ1X.jpeg',
    ana_depois: 'https://i.imgur.com/798EhiW.jpeg',
    allan_antes: 'https://i.imgur.com/EjKQnQd.jpeg',
    allan_depois: 'https://i.imgur.com/DxJWWTp.jpeg',
    evelyn_antes: 'https://i.imgur.com/WhdS7tT.png',
    evelyn_depois: 'https://i.imgur.com/ls3A63Z.png',
    yasmin_antes: 'https://i.imgur.com/xE1CqaN.png',
    yasmin_depois: 'https://i.imgur.com/QD9YN6l.png',
    jean_antes: 'https://i.imgur.com/5TirPox.png',
    jean_depois: 'https://i.imgur.com/7EkbNmQ.png',
    vane_antes: 'https://i.imgur.com/BCAuUwE.jpeg',
    vane_depois: 'https://i.imgur.com/6kKnthc.jpeg',
    bruno_antes: 'https://i.imgur.com/BsHU25K.jpeg',
    bruno_depois: 'https://i.imgur.com/PMbz7ox.jpeg',

    // Padrão Elite
    equipe_adri: 'https://i.imgur.com/Yz5Nnvc.jpeg',
    aluna_medalha: 'https://i.imgur.com/k2IKLUv.png',
    felipe_podio: 'https://i.imgur.com/KVzvCp7.png',
    atleta_fem: 'https://i.imgur.com/U1IHoQZ.jpeg',
    trio_fem: 'https://i.imgur.com/yXl6vd7.jpeg'
};
// =========================================================================

export default function PropostaScreen({ route }) {
    const leadName = route?.params?.nome || 'Atleta';
    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60 - 1);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const interval = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
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
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleWhatsAppCTA = (plan) => {
        const text = `Fala, Coach! Quero destravar meu acesso ao plano ${plan}. Bora começar! 👊`;
        Linking.openURL(`https://wa.me/5541997991346?text=${encodeURIComponent(text)}`);
    };

    const renderYouTubeVideo = (videoId) => {
        if (isWeb) {
            return React.createElement('iframe', {
                src: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
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
                    
                    {/* HERO SECTION */}
                    <View style={styles.heroSection}>
                        <View style={styles.timerBadge}>
                            <MaterialCommunityIcons name="timer-sand" size={16} color="#FF3B30" />
                            <Text style={styles.timerText}>ESTE LINK EXPIRA EM: {formatTime(timeLeft)}</Text>
                        </View>
                        <Text style={styles.heroGreeting}>FALA, {leadName.toUpperCase()}! ⚡</Text>
                        <Text style={styles.heroTitle}>O SEU CONVITE EXCLUSIVO PARA A <Text style={{color: '#4DE38F'}}>CONSULTORIA ELITE</Text></Text>
                        <Text style={styles.heroSub}>Você não está comprando uma "planilha de treino". Você está prestes a destravar uma experiência tecnológica de alta performance focada no seu resultado.</Text>
                    </View>

                    {/* VÍDEO */}
                    <View style={styles.videoSection}>
                        <Text style={styles.sectionTitle}>NÃO ACREDITE SÓ EM MIM</Text>
                        <Text style={styles.sectionSub}>Veja quem já transformou o corpo e a rotina com o nosso método.</Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo('tvYMAVQpt8I')}
                        </View>
                    </View>

                    {/* MENTOR */}
                    <View style={styles.mentorSection}>
                        <LinearGradient colors={['rgba(20,20,20,0.6)', 'rgba(10,10,10,1)']} style={styles.mentorGradientBg} />
                        <View style={styles.mentorContent}>
                            <View style={styles.mentorBadgeRow}>
                                <View style={styles.featureIconBox}><MaterialCommunityIcons name="card-account-details-star-outline" size={28} color="#4DE38F" /></View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.mentorSub}>EU JÁ ESTIVE DO OUTRO LADO</Text>
                                    <Text style={styles.mentorTitle}>CONHEÇA SEU MENTOR: <Text style={{color: '#FFF'}}>PAULO ADRIANO</Text></Text>
                                </View>
                            </View>
                            <Text style={styles.mentorDesc}>"Eu sei exatamente o que é carregar o peso extra, a frustração de não ver resultados e a dúvida se o esforço vale a pena. Eu já fui um 'ex-gordo' com 97kg. Mas eu descobri o caminho. Usei a ciência e a disciplina para me transformar em um Campeão Natural com 77kg. Eu não vendo planos; eu guio transformações reais."</Text>
                            
                            <View style={styles.imagesRowMentor}>
                                <View style={[styles.imagePlaceholderMentor, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.paulo_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>O DESAFIO</Text></View>
                                </View>
                                <View style={styles.imagePlaceholderMentor}>
                                    <Image source={{ uri: linksAlunos.paulo_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>A VITÓRIA</Text></View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ARSENAL */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>O FIM DO TREINO FOFO</Text>
                    <Text style={styles.sectionSub}>Arraste para o lado e conheça o seu aplicativo exclusivo.</Text>
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
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="robot-outline" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>IA de Análise de Movimento</Text>
                            <Text style={styles.arsenalDesc}>Nossa IA analisa sua execução em vídeo de 10s e corrige sua postura na hora.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="weight-lifter" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Calculadora de Carga (1RM)</Text>
                            <Text style={styles.arsenalDesc}>O app calcula a carga exata que você deve levantar para garantir resultados e evitar platôs.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="chart-areaspline" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>Painel Evolutivo</Text>
                            <Text style={styles.arsenalDesc}>Gráficos de peso, medidas, dobras (Pollock) e histórico visual de todas as suas fotos.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="chat-processing-outline" size={32} color="#4DE38F" /></View>
                            <Text style={styles.arsenalTitle}>PA Coach AI & Suporte</Text>
                            <Text style={styles.arsenalDesc}>Tire dúvidas com o nosso bot 24h por dia ou chame direto no meu WhatsApp pelo App.</Text>
                        </View>
                    </ScrollView>

                    {/* 🔥 RESULTADOS MODERNOS (NOVO LAYOUT) 🔥 */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>RESULTADOS DOS ALUNOS</Text>
                    <Text style={styles.sectionSub}>Deslize para ver o que a disciplina somada à ciência pode fazer.</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        
                        {/* PEDRO */}
                        <View style={styles.modernResultCard}>
                            <View style={styles.modernImagesRow}>
                                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.pedro_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>ANTES</Text></View>
                                </View>
                                <View style={styles.modernImageContainer}>
                                    <Image source={{ uri: linksAlunos.pedro_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>DEPOIS</Text></View>
                                </View>
                            </View>
                            <View style={styles.modernResultFooter}>
                                <Text style={styles.modernResultGoal}>🔥 EMAGRECIMENTO (Pedro)</Text>
                                <Text style={styles.modernResultWeight}>112kg ➝ 97kg</Text>
                            </View>
                        </View>

                        {/* BERNARD */}
                        <View style={styles.modernResultCard}>
                            <View style={styles.modernImagesRow}>
                                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.bernard_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>ANTES</Text></View>
                                </View>
                                <View style={styles.modernImageContainer}>
                                    <Image source={{ uri: linksAlunos.bernard_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>DEPOIS</Text></View>
                                </View>
                            </View>
                            <View style={styles.modernResultFooter}>
                                <Text style={styles.modernResultGoal}>🔥 DEFINIÇÃO (Bernard)</Text>
                                <Text style={styles.modernResultWeight}>87kg ➝ 70kg</Text>
                            </View>
                        </View>

                        {/* ANA */}
                        <View style={styles.modernResultCard}>
                            <View style={styles.modernImagesRow}>
                                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.ana_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>ANTES</Text></View>
                                </View>
                                <View style={styles.modernImageContainer}>
                                    <Image source={{ uri: linksAlunos.ana_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>COMPETIÇÃO</Text></View>
                                </View>
                            </View>
                            <View style={styles.modernResultFooter}>
                                <Text style={styles.modernResultGoal}>🏆 DA INSATISFAÇÃO AO PALCO (Ana)</Text>
                            </View>
                        </View>

                        {/* ALLAN */}
                        <View style={styles.modernResultCard}>
                            <View style={styles.modernImagesRow}>
                                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.allan_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>ANTES</Text></View>
                                </View>
                                <View style={styles.modernImageContainer}>
                                    <Image source={{ uri: linksAlunos.allan_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>DEPOIS</Text></View>
                                </View>
                            </View>
                            <View style={styles.modernResultFooter}>
                                <Text style={styles.modernResultGoal}>🔥 SAÚDE E ESTÉTICA (Allan)</Text>
                                <Text style={styles.modernResultWeight}>Diabetes superada! 87kg ➝ 73kg</Text>
                            </View>
                        </View>

                        {/* EVELYN */}
                        <View style={styles.modernResultCard}>
                            <View style={styles.modernImagesRow}>
                                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.evelyn_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>ANTES</Text></View>
                                </View>
                                <View style={styles.modernImageContainer}>
                                    <Image source={{ uri: linksAlunos.evelyn_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>DEPOIS</Text></View>
                                </View>
                            </View>
                            <View style={styles.modernResultFooter}>
                                <Text style={styles.modernResultGoal}>🔥 COSTAS, CINTURA E GLÚTEOS (Evelyn)</Text>
                            </View>
                        </View>

                        {/* YASMIN */}
                        <View style={styles.modernResultCard}>
                            <View style={styles.modernImagesRow}>
                                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.yasmin_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>ANTES</Text></View>
                                </View>
                                <View style={styles.modernImageContainer}>
                                    <Image source={{ uri: linksAlunos.yasmin_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>11 DIAS</Text></View>
                                </View>
                            </View>
                            <View style={styles.modernResultFooter}>
                                <Text style={styles.modernResultGoal}>🔥 CHOQUE DE REALIDADE (Yasmin)</Text>
                                <Text style={styles.modernResultWeight}>Apenas 11 Dias</Text>
                            </View>
                        </View>

                        {/* JEAN */}
                        <View style={styles.modernResultCard}>
                            <View style={styles.modernImagesRow}>
                                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.jean_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>ANTES</Text></View>
                                </View>
                                <View style={styles.modernImageContainer}>
                                    <Image source={{ uri: linksAlunos.jean_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>DEPOIS</Text></View>
                                </View>
                            </View>
                            <View style={styles.modernResultFooter}>
                                <Text style={styles.modernResultGoal}>🔥 MASSA E DEFINIÇÃO (Jean)</Text>
                            </View>
                        </View>

                        {/* VANE */}
                        <View style={styles.modernResultCard}>
                            <View style={styles.modernImagesRow}>
                                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.vane_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>ANTES</Text></View>
                                </View>
                                <View style={styles.modernImageContainer}>
                                    <Image source={{ uri: linksAlunos.vane_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>DEPOIS</Text></View>
                                </View>
                            </View>
                            <View style={styles.modernResultFooter}>
                                <Text style={styles.modernResultGoal}>🔥 EMAGRECIMENTO (Vane)</Text>
                                <Text style={styles.modernResultWeight}>96kg ➝ 84kg</Text>
                            </View>
                        </View>

                        {/* BRUNO */}
                        <View style={styles.modernResultCard}>
                            <View style={styles.modernImagesRow}>
                                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                                    <Image source={{ uri: linksAlunos.bruno_antes }} style={styles.resultImage} />
                                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>ANTES</Text></View>
                                </View>
                                <View style={styles.modernImageContainer}>
                                    <Image source={{ uri: linksAlunos.bruno_depois }} style={styles.resultImage} />
                                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>DEPOIS</Text></View>
                                </View>
                            </View>
                            <View style={styles.modernResultFooter}>
                                <Text style={styles.modernResultGoal}>🔥 EMAGRECIMENTO (Bruno)</Text>
                                <Text style={styles.modernResultWeight}>101kg ➝ 82kg</Text>
                            </View>
                        </View>

                        {/* FINAL CTA DOS ALUNOS */}
                        <View style={[styles.modernResultCard, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', borderWidth: 0 }]}>
                            <MaterialCommunityIcons name="star-face" size={48} color="#4DE38F" style={{ marginBottom: 15 }} />
                            <Text style={[styles.modernResultGoal, { textAlign: 'center', fontSize: 16 }]}>E MUITOS OUTROS...</Text>
                            <Text style={[styles.sectionSub, { marginTop: 10 }]}>Esses são apenas alguns dos alunos reais que decidiram mudar de vida com a nossa ajuda. Chegou a sua vez.</Text>
                        </View>

                    </ScrollView>

                    {/* PADRÃO ELITE */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>PADRÃO ELITE</Text>
                    <Text style={styles.sectionSub}>Vivendo a alta performance e guiando o time aos pódios.</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <View style={styles.athleteCard}>
                            <View style={styles.athleteImageContainer}>
                                <Image source={{ uri: linksAlunos.equipe_adri }} style={styles.athleteImage} />
                            </View>
                            <Text style={styles.athleteTitle}>LIDERANDO PELO EXEMPLO</Text>
                            <Text style={styles.athleteDesc}>Eu e minha esposa Adri dividindo os palcos. Ela garante suporte e motivação constante para que ninguém fique para trás no processo.</Text>
                        </View>

                        <View style={styles.athleteCard}>
                            <View style={styles.athleteImageContainer}>
                                <Image source={{ uri: linksAlunos.aluna_medalha }} style={styles.athleteImage} />
                            </View>
                            <Text style={styles.athleteTitle}>O RESULTADO DO TRABALHO</Text>
                            <Text style={styles.athleteDesc}>Aluna de 39 anos de idade, que conseguimos colocar um shape competitivo ao perder 32kgs.</Text>
                        </View>

                        <View style={styles.athleteCard}>
                            <View style={styles.athleteImageContainer}>
                                <Image source={{ uri: linksAlunos.felipe_podio }} style={styles.athleteImage} />
                            </View>
                            <Text style={styles.athleteTitle}>MÉTODO VALIDADO</Text>
                            <Text style={styles.athleteDesc}>Nosso atleta Felipe comemorando sua vitória após um trabalho impecável de preparação. A ciência não falha.</Text>
                        </View>

                        <View style={styles.athleteCard}>
                            <View style={styles.athleteImageContainer}>
                                <Image source={{ uri: linksAlunos.atleta_fem }} style={styles.athleteImage} />
                            </View>
                            <Text style={styles.athleteTitle}>A VITÓRIA</Text>
                            <Text style={styles.athleteDesc}>O sorriso de quem entregou tudo e buscou a medalha. O método funciona para quem faz o que tem que ser feito.</Text>
                        </View>

                        <View style={styles.athleteCard}>
                            <View style={styles.athleteImageContainer}>
                                <Image source={{ uri: linksAlunos.trio_fem }} style={styles.athleteImage} />
                            </View>
                            <Text style={styles.athleteTitle}>NOSSO TIME EM PESO</Text>
                            <Text style={styles.athleteDesc}>Nossas atletas brilhando no campeonato. Estética, saúde e alta performance totalmente alinhadas.</Text>
                        </View>
                    </ScrollView>

                    {/* ESCOLHA SEU PLANO */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>ESCOLHA SEU ARSENAL</Text>
                    
                    <View style={styles.plansContainer}>
                        
                        {/* PERFORMANCE */}
                        <View style={[styles.planCard, { borderColor: '#333' }]}>
                            <Text style={[styles.planName, { color: '#FFF' }]}>PERFORMANCE</Text>
                            <Text style={styles.planDesc}>O motor de arranque para o seu shape.</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={styles.planItem}>✓ Treinos em App com Vídeos e Técnicas</Text>
                                <Text style={styles.planItem}>✓ Análise de Execução via IA Gemini</Text>
                                <Text style={styles.planItem}>✓ Avaliações Quinzenais via App</Text>
                                <Text style={styles.planItem}>✓ Assistente PA Coach AI + Suporte Whats</Text>
                                <Text style={styles.planItem}>✓ Calculadora de RM, Descanso e RPE</Text>
                                <Text style={styles.planItem}>✓ PA Flix Básico</Text>
                                <Text style={[styles.planItem, { color: '#666', textDecorationLine: 'line-through' }]}>✗ Estratégia Alimentar Personalizada</Text>
                            </View>

                            <View style={styles.bonusSection}>
                                <Text style={styles.bonusTitle}>🎁 BÔNUS INCLUSOS:</Text>
                                <Text style={styles.bonusItem}>• E-book/Áudio: 5 Dicas p/ Emagrecer (Todos)</Text>
                                <Text style={styles.bonusItem}>• E-books: Receitas Fit (A partir do Mensal)</Text>
                                <Text style={styles.bonusItem}>• E-books: Shape Natural + Pernas (Trimestral ou +)</Text>
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
                            <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedText}>EXPERIÊNCIA COMPLETA</Text>
                            </View>
                            <Text style={[styles.planName, { color: '#4DE38F' }]}>ELITE VIP</Text>
                            <Text style={[styles.planDesc, { color: '#CCC' }]}>Treino, dieta e suporte lado a lado.</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Treinos em App com Vídeos e Técnicas</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Análise de Execução via IA Gemini</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Avaliações Visuais Quinzenais</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Assistente PA Coach AI + Suporte Whats</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Calculadora de RM, Descanso e RPE</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ PA Flix Completo (Bônus Vip)</Text>
                                <Text style={[styles.planItem, { color: '#4DE38F', fontWeight: 'bold' }]}>🔥 Estratégia Alimentar Específica</Text>
                            </View>

                            <View style={[styles.bonusSection, { borderColor: 'rgba(77, 227, 143, 0.2)' }]}>
                                <Text style={[styles.bonusTitle, { color: '#4DE38F' }]}>🎁 BÔNUS INCLUSOS:</Text>
                                <Text style={[styles.bonusItem, { color: '#CCC' }]}>• E-book/Áudio: 5 Dicas p/ Emagrecer (Todos)</Text>
                                <Text style={[styles.bonusItem, { color: '#CCC' }]}>• E-books: Receitas Fit (A partir do Mensal)</Text>
                                <Text style={[styles.bonusItem, { color: '#CCC' }]}>• E-books: Shape Natural + Pernas (Trimestral ou +)</Text>
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
    
    // HERO
    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B3015', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FF3B30', marginBottom: 25 },
    timerText: { color: '#FF3B30', fontWeight: '900', fontSize: 12, marginLeft: 8, letterSpacing: 1 },
    heroGreeting: { color: '#888', fontWeight: '900', fontSize: 14, letterSpacing: 2, marginBottom: 10 },
    heroTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 38, letterSpacing: -1, marginBottom: 15 },
    heroSub: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },

    // VÍDEO
    videoSection: { marginBottom: 50 },
    videoContainer9x16: { width: '100%', maxWidth: 280, aspectRatio: 9/16, backgroundColor: '#222', borderRadius: 16, overflow: 'hidden', alignSelf: 'center', marginTop: 20, borderWidth: 1, borderColor: '#333', position: 'relative' },

    // MENTOR SEÇÃO
    mentorSection: { marginBottom: 40, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
    mentorGradientBg: { ...StyleSheet.absoluteFillObject },
    mentorContent: { padding: 20, flexDirection: 'column' }, 
    mentorBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
    mentorSub: { color: '#888', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
    mentorTitle: { color: '#4DE38F', fontSize: 16, fontWeight: '900' },
    mentorDesc: { color: '#BBB', fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: 25 }, 
    imagesRowMentor: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 }, 
    imageCol: { flex: 1, alignItems: 'center' },
    imagePlaceholderMentor: { width: '100%', aspectRatio: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },

    // ARSENAL CARROSSEL
    sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, marginBottom: 5 },
    sectionSub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 30 },
    arsenalCard: { width: width > 600 ? 250 : width * 0.7, backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A', marginRight: 15, alignItems: 'flex-start' },
    featureIconBox: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#4DE38F15', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#4DE38F30' },
    arsenalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    arsenalDesc: { color: '#888', fontSize: 13, lineHeight: 20 },

    // 🔥 NOVO: CARROSSEL RESULTADOS MODERNIZADO (QUADRADO 1:1, TEXTO ABAIXO) 🔥
    carouselContainer: { paddingBottom: 20 },
    modernResultCard: { width: 340, backgroundColor: '#111', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#333', marginRight: 15 },
    modernImagesRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, 
    modernImageContainer: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, overflow: 'hidden', position: 'relative', aspectRatio: 1 },
    
    // Badges no Bottom-Right
    floatingBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 10 },
    floatingBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    
    // Foto 1:1 com Cover e Arredondamento
    resultImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 14 }, 

    // Texto de Status Embaixo
    modernResultFooter: { marginTop: 15, alignItems: 'center' },
    modernResultGoal: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5, marginBottom: 4, textAlign: 'center' },
    modernResultWeight: { color: '#4DE38F', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },

    // ATLETAS
    athleteCard: { width: 280, backgroundColor: '#161616', borderRadius: 24, padding: 15, borderWidth: 1, borderColor: '#333', marginRight: 15 },
    athleteImageContainer: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#1A1A1A', borderRadius: 14, overflow: 'hidden', marginBottom: 15, justifyContent: 'center' },
    athleteImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 14 }, 
    athleteTitle: { color: '#4DE38F', fontWeight: '900', fontSize: 14, letterSpacing: 0.5, marginBottom: 5 },
    athleteDesc: { color: '#888', fontSize: 12, lineHeight: 18 },

    // PLANS
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

    // EXPIRED
    expiredBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#0a0a0a' },
    expiredTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
    expiredDesc: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    expiredBtn: { backgroundColor: '#222', padding: 18, borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
    expiredBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
    footerText: { color: '#666', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    footerSubText: { color: '#444', fontSize: 10, marginTop: 5 }
});