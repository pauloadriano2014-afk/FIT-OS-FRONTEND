// src/screens/SaaSPropostaScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform, Dimensions, Modal, Linking, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVAILABLE_FEATURES = {
    'treinos': { label: 'Treinos Personalizados', icon: 'dumbbell' },
    'videos': { label: 'Vídeos de Execução', icon: 'play-circle' },
    'cronometro': { label: 'Cronômetro Integrado', icon: 'timer-outline' },
    'dieta': { label: 'Sugestão Alimentar', icon: 'food-apple' },
    'checkin': { label: 'Avaliações e Check-ins', icon: 'camera-timer' },
    'graficos': { label: 'Gráficos de Progresso', icon: 'chart-line' },
    'gamificacao': { label: 'Ranking de Alunos', icon: 'trophy' },
    'historico': { label: 'Histórico de Treinos', icon: 'calendar-check' },
    'flix': { label: 'Área de Membros', icon: 'play-box-multiple' },
    'substituicao': { label: 'Troca de Exercícios', icon: 'swap-horizontal' },
    'suporte': { label: 'Suporte no WhatsApp', icon: 'whatsapp' },
};

// 🔥 FUNÇÃO DE SIMULAÇÃO DINÂMICA DE PARCELAS
const calcularParcela = (valorAVista, parcelas) => {
    if (parcelas === 1) return valorAVista;
    const jurosMes = 0.0299; // 2.99% a.m.
    if (valorAVista <= 0) return 0;
    const pmt = valorAVista * (jurosMes * Math.pow(1 + jurosMes, parcelas)) / (Math.pow(1 + jurosMes, parcelas) - 1);
    return pmt;
};

export default function SaaSPropostaScreen({ route, navigation }) {
    const { coachId, nome } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [pageConfig, setPageConfig] = useState(null);
    const [plans, setPlans] = useState([]);
    const [logoUrl, setLogoUrl] = useState(null);
    
    // 🔥 ESTADOS DO MODAL DE PAGAMENTO
    const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
    const [installmentCount, setInstallmentCount] = useState(12);

    const { width } = Dimensions.get('window');
    const isWebPC = Platform.OS === 'web' && width > 768;

    useEffect(() => {
        const fetchPropostaData = async () => {
            if (!coachId) return setLoading(false);
            try {
                const res = await fetch(`https://fitos-final.onrender.com/api/admin/saas-meta?coachId=${coachId}`);
                if (!res.ok) throw new Error("Erro ao buscar dados");
                const data = await res.json();
                
                setPageConfig(data.config || {});
                setPlans(data.plans || []);
                setLogoUrl(data.brandLogoUrl); 

                // 🔍 RASTREADOR DO PIX: Verifique no console se os dados estão a chegar
                console.log("=== DEBUG PIX ===");
                console.log("PIX Key carregada:", data.config?.pixKey);
                console.log("PIX Name carregado:", data.config?.pixName);
                console.log("=================");

            } catch (error) { console.error("Erro na página:", error); } 
            finally { setLoading(false); }
        };
        fetchPropostaData();
    }, [coachId]);

    const handleOpenPaymentModal = (plan) => {
        setSelectedPlanForPayment(plan);
        setInstallmentCount(12); // Padrão 12x ao abrir
    };

    const handleContinueToRegister = () => {
        const planId = selectedPlanForPayment?.id;
        setSelectedPlanForPayment(null);
        navigation.navigate('Register', { coach: coachId, plan: planId, nome: nome });
    };

    const handleOpenPaymentLink = (url) => {
        if (!url) return;
        Linking.openURL(url).catch(err => console.error("Falha ao abrir link de pagamento", err));
    };

    const rootStyle = Platform.OS === 'web' ? { height: '100vh', width: '100%', backgroundColor: '#0a0a0a' } : { flex: 1, backgroundColor: '#0a0a0a' };

    if (loading) {
        return (
            <SafeAreaView style={[rootStyle, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#4DE38F" />
                <Text style={{ color: '#FFF', marginTop: 10 }}>Preparando a sua proposta...</Text>
            </SafeAreaView>
        );
    }

    if (!pageConfig || plans.length === 0) {
        return (
            <SafeAreaView style={[rootStyle, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#FF3B30" />
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 15 }}>Proposta Indisponível</Text>
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 10 }}>O treinador ainda não configurou os planos.</Text>
            </SafeAreaView>
        );
    }

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|shorts\/|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    const embedUrl = getYouTubeEmbedUrl(pageConfig.videoUrl);
    const isShortVideo = pageConfig.videoUrl ? pageConfig.videoUrl.toLowerCase().includes('shorts') : false;
    
    const themeColor = pageConfig.themeColor || '#4DE38F';
    const features = pageConfig.appFeatures || [];
    
    const gallery = pageConfig.galleryPhotos || [];
    const texts = pageConfig.galleryTexts || [];
    const galleryPairs = [];
    for (let i = 0; i < gallery.length; i += 2) {
        if (gallery[i] && gallery[i+1]) {
            galleryPairs.push({ before: gallery[i], after: gallery[i+1], text: texts[i/2] || '' });
        }
    }

    const testNames = pageConfig.testimonialNames || [];
    const testTexts = pageConfig.testimonialTexts || [];
    const activeTestimonials = testTexts.map((text, idx) => ({ text, name: testNames[idx] })).filter(t => t.text.trim() !== '');

    // Constantes do Modal
    let selectedFinalPrice = 0;
    let selectedParcela = 0;
    if (selectedPlanForPayment) {
        const hasDiscount = selectedPlanForPayment.discountPerc > 0;
        selectedFinalPrice = hasDiscount 
            ? (selectedPlanForPayment.value - (selectedPlanForPayment.value * (selectedPlanForPayment.discountPerc / 100))) 
            : selectedPlanForPayment.value;
        selectedParcela = calcularParcela(selectedFinalPrice, installmentCount);
    }

    return (
        <SafeAreaView style={rootStyle}>
            <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    {logoUrl ? (
                        <View style={{ width: '80%', height: 120, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={{ uri: logoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        </View>
                    ) : (
                        <Text style={styles.brandTitle}>{pageConfig.pageTitle || 'Consultoria VIP'}</Text>
                    )}
                </View>

                <View style={[styles.mainContainer, isWebPC && styles.mainContainerWeb]}>
                    
                    <Text style={styles.greeting}>
                        Fala, <Text style={{ color: themeColor }}>{nome || 'Atleta'}</Text>! Preparado(a) para a mudança?
                    </Text>

                    {embedUrl && (
                        <View style={[styles.videoContainer, { 
                            borderColor: themeColor + '40',
                            aspectRatio: isShortVideo ? 9/16 : 16/9,
                            maxWidth: isShortVideo ? 360 : '100%', 
                            alignSelf: 'center'
                        }]}>
                            {Platform.OS === 'web' ? (
                                <iframe width="100%" height="100%" src={embedUrl} frameBorder="0" allowFullScreen style={{ borderRadius: 16 }} />
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
                                    <MaterialCommunityIcons name="play-circle-outline" size={50} color={themeColor} />
                                    <Text style={{ color: '#888', marginTop: 10 }}>Vídeo de Apresentação</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {(pageConfig.aboutText || pageConfig.coachPhotoUrl) && (
                        <View style={[styles.aboutCard, { borderColor: themeColor + '30' }]}>
                            <Text style={[styles.sectionTitle, { color: themeColor }]}>CONHEÇA O SEU TREINADOR</Text>
                            <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
                                {pageConfig.coachPhotoUrl && (
                                    <View style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 2, borderColor: themeColor }}>
                                        <Image source={{ uri: pageConfig.coachPhotoUrl }} style={{ width: '100%', height: '100%' }} />
                                    </View>
                                )}
                                <Text style={[styles.aboutText, { flex: 1 }]}>{pageConfig.aboutText}</Text>
                            </View>
                        </View>
                    )}

                    {features.length > 0 && (
                        <View style={[styles.aboutCard, { borderColor: themeColor + '30' }]}>
                            <Text style={[styles.sectionTitle, { color: themeColor }]}>O QUE VAI RECEBER</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {features.map(featId => {
                                    const feature = AVAILABLE_FEATURES[featId];
                                    if (!feature) return null;
                                    return (
                                        <View key={featId} style={{ width: '48%', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
                                            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: themeColor + '22', justifyContent: 'center', alignItems: 'center' }}>
                                                <MaterialCommunityIcons name={feature.icon} size={16} color={themeColor} />
                                            </View>
                                            <Text style={{ color: '#E0E0E0', fontSize: 12, fontWeight: 'bold', flex: 1 }}>{feature.label}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {galleryPairs.length > 0 && (
                        <View style={[styles.aboutCard, { borderColor: themeColor + '30' }]}>
                            <Text style={[styles.sectionTitle, { color: themeColor }]}>RESULTADOS DOS ALUNOS</Text>
                            <View style={{ gap: 25 }}>
                                {galleryPairs.map((pair, idx) => (
                                    <View key={idx} style={{ backgroundColor: '#161616', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#222' }}>
                                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: pair.text ? 15 : 0 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' }}>ANTES</Text>
                                                <View style={{ width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' }}><Image source={{ uri: pair.before }} style={{ width: '100%', height: '100%' }} /></View>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: themeColor, fontSize: 10, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' }}>DEPOIS</Text>
                                                <View style={{ width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: themeColor }}><Image source={{ uri: pair.after }} style={{ width: '100%', height: '100%' }} /></View>
                                            </View>
                                        </View>
                                        {pair.text ? <Text style={{ color: '#CCC', fontSize: 14, fontStyle: 'italic', textAlign: 'center' }}>"{pair.text}"</Text> : null}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {activeTestimonials.length > 0 && (
                        <View style={[styles.aboutCard, { borderColor: themeColor + '30' }]}>
                            <Text style={[styles.sectionTitle, { color: themeColor }]}>O QUE DIZEM SOBRE NÓS</Text>
                            <View style={{ gap: 15 }}>
                                {activeTestimonials.map((test, idx) => (
                                    <View key={idx} style={{ backgroundColor: themeColor + '11', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: themeColor + '40' }}>
                                        <MaterialCommunityIcons name="format-quote-open" size={24} color={themeColor} style={{ marginBottom: 10, opacity: 0.5 }} />
                                        <Text style={{ color: '#FFF', fontSize: 14, lineHeight: 22, marginBottom: 15 }}>"{test.text}"</Text>
                                        <Text style={{ color: themeColor, fontSize: 12, fontWeight: 'bold', textAlign: 'right' }}>— {test.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* 💰 VITRINE DE PLANOS COM ANCORAGEM BÁSICA */}
                    <Text style={[styles.sectionTitle, { color: '#FFF', textAlign: 'center', marginTop: 20, fontSize: 16 }]}>ESCOLHA O SEU PLANO</Text>
                    
                    <View style={{ gap: 20 }}>
                        {plans.map(plan => {
                            const hasDiscount = plan.discountPerc > 0;
                            const finalPrice = hasDiscount ? (plan.value - (plan.value * (plan.discountPerc / 100))) : plan.value;
                            const parcelaPadrao = calcularParcela(finalPrice, 12);

                            return (
                                <View key={plan.id} style={[styles.planCard, { borderColor: themeColor }]}>
                                    {hasDiscount && (
                                        <View style={[styles.planBadge, { backgroundColor: themeColor }]}>
                                            <Text style={styles.planBadgeText}>🔥 {plan.discountPerc}% OFF</Text>
                                        </View>
                                    )}

                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <Text style={styles.planDuration}>Acesso por <Text style={{fontWeight: 'bold', color: '#FFF'}}>{plan.durationInMonths} {plan.durationInMonths === 1 ? 'mês' : 'meses'}</Text></Text>
                                    
                                    <View style={{ backgroundColor: themeColor + '11', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginBottom: 15 }}>
                                        <Text style={{ color: themeColor, fontSize: 13, fontWeight: 'bold' }}>12x de R$ {parcelaPadrao.toFixed(2).replace('.', ',')}</Text>
                                    </View>

                                    <View style={styles.priceContainer}>
                                        {hasDiscount ? (
                                            <>
                                                <Text style={{color: '#888', fontSize: 16, textDecorationLine: 'line-through', marginBottom: 5}}>De R$ {plan.value.toFixed(2).replace('.', ',')}</Text>
                                                <Text style={[styles.priceValue, { color: themeColor }]}>Por R$ {finalPrice.toFixed(2).replace('.', ',')}</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Text style={styles.priceLabel}>À vista por</Text>
                                                <Text style={[styles.priceValue, { color: themeColor }]}>R$ {finalPrice.toFixed(2).replace('.', ',')}</Text>
                                            </>
                                        )}
                                    </View>

                                    <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: themeColor, shadowColor: themeColor }]} onPress={() => handleOpenPaymentModal(plan)} activeOpacity={0.8}>
                                        <Text style={styles.checkoutBtnText}>ASSINAR AGORA</Text>
                                        <MaterialCommunityIcons name="arrow-right-bold" size={20} color="#000" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.secureContainer}>
                        <MaterialCommunityIcons name="shield-check" size={16} color="#888" />
                        <Text style={styles.secureText}>Ambiente de Pagamento 100% Seguro</Text>
                    </View>

                </View>
            </ScrollView>

            {/* 🔥 MODAL DE PAGAMENTO E SIMULADOR 🔥 */}
            <Modal visible={!!selectedPlanForPayment} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: '#111', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: themeColor + '55', maxHeight: '90%' }}>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Detalhes do Pagamento</Text>
                            <TouchableOpacity onPress={() => setSelectedPlanForPayment(null)}>
                                <MaterialCommunityIcons name="close-circle" size={28} color="#888" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* SIMULADOR INTERATIVO DE PARCELAS */}
                            <View style={{ backgroundColor: '#1a1a1a', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 20 }}>
                                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>Simulador de Parcelas</Text>
                                
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 15 }}>
                                    <TouchableOpacity 
                                        onPress={() => setInstallmentCount(prev => Math.max(1, prev - 1))}
                                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}
                                    >
                                        <MaterialCommunityIcons name="minus" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                    
                                    <Text style={{ color: themeColor, fontSize: 22, fontWeight: '900', minWidth: 50, textAlign: 'center' }}>{installmentCount}x</Text>
                                    
                                    <TouchableOpacity 
                                        onPress={() => setInstallmentCount(prev => Math.min(12, prev + 1))}
                                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}
                                    >
                                        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={{ color: '#FFF', fontSize: 26, fontWeight: 'bold', textAlign: 'center' }}>
                                    {installmentCount === 1 ? 'R$ ' : 'de R$ '}
                                    {selectedParcela.toFixed(2).replace('.', ',')}
                                </Text>

                                {/* AVISO LEGAL ESPECÍFICO */}
                                <Text style={{ color: '#666', fontSize: 10, textAlign: 'center', marginTop: 15, lineHeight: 14 }}>
                                    * Simulação baseada na taxa média do mercado (2.99% a.m.). O valor exato das parcelas pode sofrer pequenas variações de acordo com as regras de juros do emissor do seu cartão (Nubank, Itaú, Banco do Brasil, Santander, etc).
                                </Text>
                            </View>

                            {/* LINK DE CHECKOUT (CARTÃO/BOLETO) */}
                            {selectedPlanForPayment?.paymentUrl && (
                                <View style={{ marginBottom: 25 }}>
                                    <Text style={{ color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>PAGAMENTO VIA CARTÃO / BOLETO</Text>
                                    <TouchableOpacity 
                                        style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: themeColor, padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                                        onPress={() => handleOpenPaymentLink(selectedPlanForPayment.paymentUrl)}
                                    >
                                        <MaterialCommunityIcons name="credit-card-outline" size={24} color={themeColor} />
                                        <Text style={{ color: themeColor, fontWeight: 'bold', fontSize: 14 }}>ACESSAR CHECKOUT SEGURO</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* PAGAMENTO VIA PIX */}
                            {pageConfig?.pixKey && (
                                <View style={{ marginBottom: 30 }}>
                                    <Text style={{ color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>PAGAMENTO VIA PIX (SEM TAXAS)</Text>
                                    <View style={{ backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333' }}>
                                        <Text style={{ color: '#CCC', fontSize: 13, marginBottom: 10 }}>Envie o valor exato para a chave abaixo:</Text>
                                        
                                        <TextInput 
                                            style={{ backgroundColor: '#000', color: themeColor, padding: 15, borderRadius: 8, fontSize: 14, fontWeight: 'bold', textAlign: 'center', borderWidth: 1, borderColor: themeColor + '40', marginBottom: 10 }}
                                            value={pageConfig.pixKey}
                                            editable={false}
                                            selectable={true}
                                        />
                                        
                                        {pageConfig.pixName && <Text style={{ color: '#888', fontSize: 11, textAlign: 'center' }}>Favorecido: {pageConfig.pixName}</Text>}
                                        <Text style={{ color: '#4DE38F', fontSize: 11, textAlign: 'center', marginTop: 5, fontWeight: 'bold' }}>Selecione o texto acima e copie a chave.</Text>
                                    </View>
                                </View>
                            )}

                            <View style={{ borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20, marginBottom: 20 }}>
                                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 }}>Já realizou o pagamento?</Text>
                                <TouchableOpacity 
                                    style={{ backgroundColor: themeColor, padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}
                                    onPress={handleContinueToRegister}
                                >
                                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 16 }}>CRIAR O MEU ACESSO AGORA</Text>
                                    <MaterialCommunityIcons name="check-decagram" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { width: '100%', paddingVertical: 25, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a', backgroundColor: '#000' },
    brandTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', paddingHorizontal: 20 },
    mainContainer: { width: '100%', padding: 20, gap: 25 },
    mainContainerWeb: { maxWidth: 600, alignSelf: 'center', marginTop: 10 },
    greeting: { color: '#FFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', lineHeight: 32 },
    
    videoContainer: { width: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    aboutCard: { backgroundColor: '#111', padding: 24, borderRadius: 16, borderWidth: 1 },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
    aboutText: { color: '#CCC', fontSize: 15, lineHeight: 24 },

    planCard: { backgroundColor: '#1a1a1a', padding: 35, borderRadius: 20, borderWidth: 2, alignItems: 'center', position: 'relative' },
    planBadge: { position: 'absolute', top: -14, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    planBadgeText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    planName: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 5 },
    planDuration: { color: '#888', fontSize: 13, marginBottom: 15 },
    priceContainer: { alignItems: 'center', marginBottom: 25, width: '100%', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
    priceLabel: { color: '#888', fontSize: 12, marginBottom: 5 },
    priceValue: { fontSize: 36, fontWeight: '900' },
    
    checkoutBtn: { width: '100%', paddingVertical: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    checkoutBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    
    secureContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 20 },
    secureText: { color: '#888', fontSize: 12 }
});