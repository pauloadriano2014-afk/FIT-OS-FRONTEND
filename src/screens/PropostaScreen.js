// src/screens/PropostaScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Linking, Platform, SafeAreaView, Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

export default function PropostaScreen({ route }) {
    const leadName = route?.params?.nome || 'Atleta';
    
    // Timer de Urgência (Fixo em 24h para simulação visual)
    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60 - 1);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleWhatsAppCTA = (plan) => {
        const text = `Fala, Coach! Quero destravar meu acesso ao plano ${plan}. Bora construir o shape! 👊`;
        Linking.openURL(`https://wa.me/5541997991346?text=${encodeURIComponent(text)}`);
    };

    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    if (timeLeft === 0) {
        return (
            <RootComponent style={styles.container}>
                <View style={styles.expiredBox}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={64} color="#FF3B30" />
                    <Text style={styles.expiredTitle}>OFERTA EXPIRADA</Text>
                    <Text style={styles.expiredDesc}>O seu convite para a Consultoria Elite perdeu a validade. Fale com o suporte no WhatsApp para verificar se ainda há vagas.</Text>
                    <TouchableOpacity style={styles.expiredBtn} onPress={() => handleWhatsAppCTA('Lista de Espera')}>
                        <Text style={styles.expiredBtnText}>FALAR COM O COACH</Text>
                    </TouchableOpacity>
                </View>
            </RootComponent>
        );
    }

    return (
        <RootComponent style={styles.container}>
            <View style={styles.webWrapper}>
                <ScrollView 
                    style={{ flex: 1, width: '100%' }}
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                >
                    
                    {/* 🔥 HERO SECTION 🔥 */}
                    <View style={styles.heroSection}>
                        <View style={styles.timerBadge}>
                            <MaterialCommunityIcons name="timer-sand" size={16} color="#FF3B30" />
                            <Text style={styles.timerText}>ESTE LINK EXPIRA EM: {formatTime(timeLeft)}</Text>
                        </View>
                        
                        <Text style={styles.heroGreeting}>FALA, {leadName.toUpperCase()}! ⚡</Text>
                        <Text style={styles.heroTitle}>O SEU CONVITE EXCLUSIVO PARA A <Text style={{color: '#4DE38F'}}>CONSULTORIA ELITE</Text></Text>
                        <Text style={styles.heroSub}>Você não está comprando uma "planilha de treino". Você está prestes a destravar uma experiência tecnológica de alta performance.</Text>
                    </View>

                    {/* 🔥 O ARSENAL TECNOLÓGICO 🔥 */}
                    <Text style={styles.sectionTitle}>O FIM DO TREINO FOFO</Text>
                    <Text style={styles.sectionSub}>Conheça a plataforma exclusiva que vai guiar o seu resultado.</Text>

                    <View style={styles.featuresContainer}>
                        <View style={styles.featureCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="robot-outline" size={28} color="#4DE38F" /></View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>IA de Análise de Movimento</Text>
                                <Text style={styles.featureDesc}>Gravou o exercício e bateu a dúvida? Nossa IA treinada por mim analisa seu movimento em 10 segundos e corrige sua postura instantaneamente.</Text>
                            </View>
                        </View>

                        <View style={styles.featureCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="weight-lifter" size={28} color="#4DE38F" /></View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>A Carga Exata (Calculadora 1RM)</Text>
                                <Text style={styles.featureDesc}>Chega de chutar peso. O app calcula matematicamente a carga exata que você deve levantar para garantir o máximo de hipertrofia e força.</Text>
                            </View>
                        </View>

                        <View style={styles.featureCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="swap-horizontal" size={28} color="#4DE38F" /></View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Flexibilidade Real</Text>
                                <Text style={styles.featureDesc}>A academia está cheia? Troque qualquer exercício na hora por uma variação anatômica equivalente sem perder a eficiência do seu treino.</Text>
                            </View>
                        </View>

                        <View style={styles.featureCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="chart-bell-curve-cumulative" size={28} color="#4DE38F" /></View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Métricas e Controle de RPE</Text>
                                <Text style={styles.featureDesc}>Cronômetro automático de descanso e sistema de RPE (percepção de esforço) para eu saber exatamente o quão pesado foi o seu treino.</Text>
                            </View>
                        </View>

                        <View style={styles.featureCard}>
                            <View style={styles.featureIconBox}><MaterialCommunityIcons name="play-box-multiple" size={28} color="#4DE38F" /></View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Acesso VIP ao PA Flix</Text>
                                <Text style={styles.featureDesc}>Muito mais que treino. Destrave minha biblioteca privada com e-books, áudios e conteúdos avançados sobre mentalidade e nutrição.</Text>
                            </View>
                        </View>
                    </View>

                    {/* 🔥 ESCOLHA SEU PLANO 🔥 */}
                    <Text style={[styles.sectionTitle, {marginTop: 40}]}>ESCOLHA SEU ARSENAL</Text>
                    
                    <View style={styles.plansContainer}>
                        
                        {/* PLANO PERFORMANCE (BASIC) */}
                        <View style={[styles.planCard, { borderColor: '#333' }]}>
                            <Text style={[styles.planName, { color: '#FFF' }]}>PERFORMANCE</Text>
                            <Text style={styles.planDesc}>O motor de arranque para o seu shape.</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={styles.planItem}>✓ Treinos Personalizados no App</Text>
                                <Text style={styles.planItem}>✓ Análise de Execução via IA</Text>
                                <Text style={styles.planItem}>✓ Calculadora de RM e RPE</Text>
                                <Text style={styles.planItem}>✓ PA Flix Básico</Text>
                                <Text style={[styles.planItem, { color: '#666', textDecorationLine: 'line-through' }]}>✗ Estratégia Alimentar Personalizada</Text>
                                <Text style={[styles.planItem, { color: '#666', textDecorationLine: 'line-through' }]}>✗ Avaliações Quinzenais e Suporte VIP</Text>
                            </View>

                            <TouchableOpacity style={[styles.buyBtn, { backgroundColor: '#222', borderColor: '#444', borderWidth: 1 }]} onPress={() => handleWhatsAppCTA('Performance')}>
                                <Text style={[styles.buyBtnText, { color: '#FFF' }]}>ESCOLHER PERFORMANCE</Text>
                            </TouchableOpacity>
                        </View>

                        {/* PLANO ELITE (PREMIUM) */}
                        <Animated.View style={[styles.planCard, { borderColor: '#4DE38F', borderWidth: 2, transform: [{ scale: pulseAnim }] }]}>
                            <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedText}>EXPERIÊNCIA COMPLETA</Text>
                            </View>
                            <Text style={[styles.planName, { color: '#4DE38F' }]}>ELITE VIP</Text>
                            <Text style={[styles.planDesc, { color: '#CCC' }]}>Treino, dieta e suporte lado a lado.</Text>
                            
                            <View style={styles.planItems}>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Treinos Personalizados no App</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Análise de Execução via IA</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ Calculadora de RM e RPE</Text>
                                <Text style={[styles.planItem, { color: '#FFF' }]}>✓ PA Flix Completo (Bônus Vip)</Text>
                                <Text style={[styles.planItem, { color: '#4DE38F', fontWeight: 'bold' }]}>🔥 Estratégia Alimentar Específica</Text>
                                <Text style={[styles.planItem, { color: '#4DE38F', fontWeight: 'bold' }]}>🔥 Avaliação Visual a cada 15 dias</Text>
                                <Text style={[styles.planItem, { color: '#4DE38F', fontWeight: 'bold' }]}>🔥 Suporte Direto e Ajustes</Text>
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
    // 🔥 A BLINDAGEM NUCLEAR PARA SCROLL NA WEB ESTÁ AQUI 🔥
    container: { 
        flex: 1, 
        backgroundColor: '#0a0a0a',
        ...(isWeb && { height: '100vh', overflow: 'hidden' }) 
    },
    webWrapper: { 
        flex: 1, 
        width: '100%', 
        maxWidth: 600, 
        alignSelf: 'center', 
        backgroundColor: '#111', 
        borderLeftWidth: 1, 
        borderRightWidth: 1, 
        borderColor: '#222',
        ...(isWeb && { overflow: 'hidden' })
    },
    scrollContent: { 
        flexGrow: 1, 
        padding: 25, 
        paddingBottom: 100 
    },
    
    // HERO
    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B3015', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FF3B30', marginBottom: 25 },
    timerText: { color: '#FF3B30', fontWeight: '900', fontSize: 12, marginLeft: 8, letterSpacing: 1 },
    heroGreeting: { color: '#888', fontWeight: '900', fontSize: 14, letterSpacing: 2, marginBottom: 10 },
    heroTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 38, letterSpacing: -1, marginBottom: 15 },
    heroSub: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },

    // ARSENAL
    sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, marginBottom: 5 },
    sectionSub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 30 },
    featuresContainer: { gap: 15, marginBottom: 30 },
    featureCard: { flexDirection: 'row', backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'flex-start' },
    featureIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4DE38F15', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    featureTextContainer: { flex: 1 },
    featureTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
    featureDesc: { color: '#888', fontSize: 13, lineHeight: 20 },

    // PLANS
    plansContainer: { gap: 25, marginTop: 10 },
    planCard: { backgroundColor: '#161616', padding: 25, borderRadius: 24, borderWidth: 1, position: 'relative' },
    planName: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 5, textAlign: 'center' },
    planDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 25 },
    planItems: { gap: 12, marginBottom: 30 },
    planItem: { fontSize: 14, color: '#AAA', fontWeight: '500' },
    
    buyBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
    buyBtnGradient: { padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    buyBtnText: { fontWeight: '900', fontSize: 15, letterSpacing: 1 },
    
    recommendedBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#4DE38F', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 12 },
    recommendedText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },

    // EXPIRED
    expiredBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#0a0a0a' },
    expiredTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
    expiredDesc: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    expiredBtn: { backgroundColor: '#222', padding: 18, borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
    expiredBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
    footerText: { color: '#666', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    footerSubText: { color: '#444', fontSize: 10, marginTop: 5 }
});