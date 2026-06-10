// src/screens/HomeScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
    StatusBar, RefreshControl, ActivityIndicator, Platform, Modal, Animated, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

// ── Hook de dados ──────────────────────────────────────────────────────────
import { useHomeData } from '../hooks/useHomeData';

// ── Sub-componentes ────────────────────────────────────────────────────────
import HomeBanners    from '../components/HomeBanners';
import HomeMainAction from '../components/HomeMainAction';
import HomeGrid       from '../components/HomeGrid';

// ── Modais externos (já existentes) ───────────────────────────────────────
import LevelUpModal           from '../components/LevelUpModal';
import HomeNoticeModal        from '../components/HomeNoticeModal';
import ChatAIAssistantModal   from '../components/ChatAIAssistantModal';
import DietGuideModal         from '../components/DietGuideModal';
import StudentReportModal     from '../components/StudentReportModal';
import InitialPhotosModal     from '../components/InitialPhotosModal';
import SatisfactionSurveyModal from '../components/SatisfactionSurveyModal';

export default function HomeScreen({ navigation }) {
    const { theme } = useTheme();

    // ── Todos os dados e lógica de negócio vêm do hook ────────────────────
    const home = useHomeData();

    // ── Estados de UI (só controlam visibilidade de modais) ───────────────
    const [fichaExpiredModalVisible, setFichaExpiredModalVisible] = useState(false);
    const [dietModalVisible,         setDietModalVisible]         = useState(false);
    const [initialPhotosModalVisible, setInitialPhotosModalVisible] = useState(false);
    const [financeModalVisible,      setFinanceModalVisible]      = useState(false);
    const [feedbackModalVisible,     setFeedbackModalVisible]     = useState(false);
    const [noticeModalVisible,       setNoticeModalVisible]       = useState(false);
    const [levelModalVisible,        setLevelModalVisible]        = useState(false);
    const [chatVisible,              setChatVisible]              = useState(false);
    const [upsellModalVisible,       setUpsellModalVisible]       = useState(false);
    const [upsellFeature,            setUpsellFeature]            = useState('');

    // ── Animação de pulso ─────────────────────────────────────────────────
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Abre modal de notice automaticamente quando activeNotice muda
    useEffect(() => {
        if (home.activeNotice) setNoticeModalVisible(true);
    }, [home.activeNotice]);

    // Abre modal de feedback automaticamente quando pendingFeedback chega
    useEffect(() => {
        if (home.pendingFeedback) setFeedbackModalVisible(true);
    }, [home.pendingFeedback]);

    useEffect(() => {
        const shouldPulse = home.isCheckinPending || home.pendingFeedback
            || home.showVideoAlert || (home.daysToPay !== null && home.daysToPay <= 3);

        if (shouldPulse) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [home.isCheckinPending, home.pendingFeedback, home.showVideoAlert, home.daysToPay]);

    // ── Carregar dados ao focar a tela e ao voltar do background ──────────
    useFocusEffect(useCallback(() => { home.loadHomeData(); }, []));

    useEffect(() => {
        const { AppState } = require('react-native');
        const appStateRef = { current: AppState.currentState };

        const sub = AppState.addEventListener('change', (nextState) => {
            if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
                home.loadHomeData();
            }
            appStateRef.current = nextState;
        });
        return () => sub.remove();
    }, []);

    // ── Hard reload ───────────────────────────────────────────────────────
    const handleHardReload = () => {
        home.setLoading(true);
        if (Platform.OS === 'web') window.location.reload(true);
        else home.loadHomeData();
    };

    // ── Helpers derivados ─────────────────────────────────────────────────
    const { coachNameLabel, coachWhatsappNumber } = home.getCoachInfo(home.userData);
    const isFemale    = home.detectIsFemale(home.userData);
    const photoModal  = home.getPhotoModalContent(home.userPlan);

    const limitDays      = home.userPlan === 'CHALLENGE_21' ? 21 : 56;
    const isFichaExpired = ['FICHA_8S', 'CHALLENGE_21'].includes(home.userPlan)
        && home.fichaDaysElapsed >= limitDays
        && !home.isFichaPlaceholder;
    const isWaitingStart = ['FICHA_8S', 'CHALLENGE_21', 'LOW_COST'].includes(home.userPlan)
        && home.daysToStart > 0;

    const needsInitialPhoto = !home.hasSentInitialPhotos;
    const isBlockedTotal    = isFichaExpired || isWaitingStart || needsInitialPhoto || home.isFinanceLocked;

    const openUpsell = (featureName) => { setUpsellFeature(featureName); setUpsellModalVisible(true); };

    // ── Layout ────────────────────────────────────────────────────────────
    const isWeb         = Platform.OS === 'web';
    const webOuterBg    = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const RootComponent = isWeb ? View : SafeAreaView;

    if (home.loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.bg }]}>
                <ActivityIndicator color={theme.accent} size="large" />
            </View>
        );
    }

    return (
        <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

            <View style={[styles.inner, {
                backgroundColor: theme.bg,
                ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {})
            }]}>
                <ScrollView
                    style={{ flex: 1, width: '100%' }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={home.refreshing}
                            onRefresh={() => { home.setRefreshing(true); home.loadHomeData(); }}
                            tintColor={theme.accent}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Header ─────────────────────────────────────────── */}
                    <View style={styles.header}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={[styles.greeting, { color: theme.textSecondary }]} numberOfLines={1}>
                                BEM-VINDO AO {
                                    home.userPlan === 'LOW_COST'     ? 'PLANO BÁSICO'       :
                                    home.userPlan === 'FICHA_8S'     ? 'PROJETO DE FICHAS'  :
                                    home.userPlan === 'CHALLENGE_21' ? 'DESAFIO 21 DIAS'    :
                                    'ELITE'
                                },
                            </Text>
                            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                                {home.userName.toUpperCase()} ⚡
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                                style={[styles.reloadBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={handleHardReload}
                            >
                                <MaterialCommunityIcons name="refresh" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.statusBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => setLevelModalVisible(true)}
                            >
                                <Text style={[styles.statusText, { color: theme.accent }]}>{home.levelData.title}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Banners de status ───────────────────────────────── */}
                    <HomeBanners
                        theme={theme}
                        navigation={navigation}
                        daysToPay={home.daysToPay}
                        isFinanceLocked={home.isFinanceLocked}
                        disableCheckIn={home.disableCheckIn}
                        onOpenFinanceModal={() => setFinanceModalVisible(true)}
                        showVideoAlert={home.showVideoAlert}
                        newVideoContent={home.newVideoContent}
                        pulseAnim={pulseAnim}
                        onDismissVideo={home.handleDismissVideoAlert}
                        isFemale={isFemale}
                        isMenstruating={home.isMenstruating}
                        togglingMenstrual={home.togglingMenstrual}
                        onToggleMenstrual={home.toggleMenstrualCycle}
                        needsInitialPhoto={needsInitialPhoto}
                        pendingFeedback={home.pendingFeedback}
                        onOpenInitialPhotos={() => setInitialPhotosModalVisible(true)}
                        isCheckinPending={home.isCheckinPending}
                        isCheckinLate={home.isCheckinLate}
                        isEliteAwaitingCoach={home.isEliteAwaitingCoach}
                        scheduledCheckInDate={home.scheduledCheckInDate}
                        userPlan={home.userPlan}
                        hasSentInitialPhotos={home.hasSentInitialPhotos}
                    />

                    {/* ── Card de XP / Ficha ──────────────────────────────── */}
                    {['FICHA_8S', 'CHALLENGE_21'].includes(home.userPlan) && !isFichaExpired ? (
                        <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={[styles.levelText, { color: theme.accent }]}>
                                    {home.userPlan === 'CHALLENGE_21' ? 'CRONOGRAMA DO DESAFIO' : 'FICHA 8 SEMANAS'}
                                </Text>
                                <Text style={[styles.xpText, { color: theme.textSecondary }]}>
                                    {isWaitingStart
                                        ? `INICIA EM ${home.daysToStart} DIAS`
                                        : home.isFichaPlaceholder
                                            ? 'PREPARANDO TREINO'
                                            : home.userPlan === 'CHALLENGE_21'
                                                ? `DIA ${home.fichaDaysElapsed + 1} DE 21`
                                                : `SEMANA ${Math.min(8, Math.max(1, Math.ceil(home.fichaDaysElapsed / 7)))} DE 8`}
                                </Text>
                            </View>
                            <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                                {home.fichaDaysElapsed > 0 && (
                                    <View style={[styles.xpBarFill, {
                                        width: `${Math.min(100, (home.fichaDaysElapsed / limitDays) * 100)}%`,
                                        backgroundColor: theme.accent,
                                    }]} />
                                )}
                            </View>
                        </View>
                    ) : !['FICHA_8S', 'CHALLENGE_21'].includes(home.userPlan) ? (
                        <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={[styles.levelText, { color: theme.accent }]}>NÍVEL {home.currentLevel}</Text>
                                <Text style={[styles.xpText, { color: theme.textSecondary }]}>{home.currentLevelProgress} / {home.nextLevelXP} XP</Text>
                            </View>
                            <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                                {home.currentLevelProgress > 0 && (
                                    <View style={[styles.xpBarFill, {
                                        width: `${(home.currentLevelProgress / home.nextLevelXP) * 100}%`,
                                        backgroundColor: theme.accent,
                                    }]} />
                                )}
                            </View>
                        </View>
                    ) : null}

                    {/* ── Ação principal + Dieta ──────────────────────────── */}
                    <HomeMainAction
                        theme={theme}
                        navigation={navigation}
                        isBlockedTotal={isBlockedTotal}
                        isFinanceLocked={home.isFinanceLocked}
                        isFichaExpired={isFichaExpired}
                        isWaitingStart={isWaitingStart}
                        needsInitialPhoto={needsInitialPhoto}
                        daysToStart={home.daysToStart}
                        pendingFeedback={home.pendingFeedback}
                        pulseAnim={pulseAnim}
                        onOpenFeedback={() => setFeedbackModalVisible(true)}
                        onOpenFinanceModal={() => setFinanceModalVisible(true)}
                        onOpenFichaExpiredModal={() => setFichaExpiredModalVisible(true)}
                        onOpenInitialPhotos={() => setInitialPhotosModalVisible(true)}
                        userPlan={home.userPlan}
                        userData={home.userData}
                        onOpenDiet={() => setDietModalVisible(true)}
                    />

                    {/* ── Grid de atalhos ────────────────────────────────── */}
                    <HomeGrid
                        theme={theme}
                        navigation={navigation}
                        pulseAnim={pulseAnim}
                        userPlan={home.userPlan}
                        disableCheckIn={home.disableCheckIn}
                        needsInitialPhoto={needsInitialPhoto}
                        isCheckinPending={home.isCheckinPending}
                        pendingFeedback={home.pendingFeedback}
                    />
                </ScrollView>

                {/* ── FAB Chat ───────────────────────────────────────────── */}
                <TouchableOpacity
                    style={[styles.fabChat, { shadowColor: home.userPlan === 'PREMIUM' ? theme.accent : '#000' }]}
                    onPress={() => home.userPlan === 'PREMIUM' ? setChatVisible(true) : openUpsell('Chat Direto com o Coach')}
                >
                    <LinearGradient
                        colors={home.userPlan === 'PREMIUM' ? [theme.accent, theme.accent] : [theme.surface, theme.surface]}
                        style={[styles.fabGradient, home.userPlan !== 'PREMIUM' && { borderWidth: 1, borderColor: theme.border }]}
                    >
                        {home.userPlan === 'PREMIUM'
                            ? <MaterialCommunityIcons name="robot" size={32} color={theme.isDark ? '#000' : '#FFF'} />
                            : <MaterialCommunityIcons name="lock"  size={28} color={theme.textSecondary} />}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* ════════════════════════════════════════════════════════════
                MODAIS
            ════════════════════════════════════════════════════════════ */}

            {/* Modal Financeiro */}
            {home.isFinanceLocked && (
                <Modal visible={financeModalVisible} transparent animationType="fade" onRequestClose={() => setFinanceModalVisible(false)}>
                    <View style={styles.overlay}>
                        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: '#FF3B30' }]}>
                            <View style={[styles.iconBox, { backgroundColor: '#FF3B3022', marginBottom: 20 }]}>
                                <MaterialCommunityIcons name="lock-alert" size={36} color="#FF3B30" />
                            </View>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>ACESSO SUSPENSO</Text>

                            <Text style={[styles.cardDesc, { color: theme.textSecondary, marginBottom: 15 }]}>
                                O seu plano venceu e o acesso à área de treinos foi suspenso temporariamente.
                                {'\n\n'}Se você já realizou a transferência, desconsidere este aviso enquanto o sistema computa a baixa automaticamente.
                            </Text>

                            <View style={[styles.pixBox, { backgroundColor: theme.isDark ? '#111' : '#F2F2F7', borderColor: theme.border }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                    <MaterialCommunityIcons name="qrcode" size={16} color={theme.accent} />
                                    <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }}>PAGAMENTO IMEDIATO VIA PIX</Text>
                                </View>
                                <Text selectable style={{ color: theme.text, fontSize: 14, fontWeight: '900', letterSpacing: 0.2 }}>42.942.651/000140</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 3 }}>PA ELITE TEAM LTDA</Text>
                            </View>

                            <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: 'center', marginBottom: 20, paddingHorizontal: 5, lineHeight: 16 }}>
                                *Caso prefira realizar o pagamento através de um{' '}
                                <Text style={{ fontWeight: 'bold', color: theme.text }}>Link de Pagamento</Text>
                                {' '}de cartão, entre em contato com seu responsável abaixo para receber uma fatura atualizada.
                            </Text>

                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: '#25D366', marginBottom: 10 }]}
                                onPress={() => Linking.openURL(`https://wa.me/${coachWhatsappNumber}?text=${encodeURIComponent("Acabei de verificar o painel e preciso falar sobre a renovação da minha assinatura!")}`)}
                            >
                                <Text style={[styles.btnText, { color: '#FFF' }]}>FALAR COM {coachNameLabel}</Text>
                                <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, shadowOpacity: 0, elevation: 0 }]}
                                onPress={() => setFinanceModalVisible(false)}
                            >
                                <Text style={[styles.btnText, { color: theme.text }]}>FECHAR PAINEL</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Modal Upsell */}
            <Modal visible={upsellModalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setUpsellModalVisible(false)}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <View style={[styles.iconBox, { backgroundColor: theme.accent + '22', marginBottom: 20 }]}>
                            <MaterialCommunityIcons name="crown" size={36} color={theme.accent} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>FUNCIONALIDADE ELITE</Text>
                        <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                            O recurso de <Text style={{ color: theme.accent, fontWeight: 'bold' }}>{upsellFeature}</Text> é exclusivo para atletas da Consultoria Elite.
                        </Text>
                        <View style={[styles.benefitsBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            {['Ajuste de Treino Sob Medida', 'Avaliação Quinzenal do Shape', 'Acesso direto ao Coach'].map(b => (
                                <View key={b} style={styles.benefitRow}>
                                    <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />
                                    <Text style={[styles.benefitText, { color: theme.text }]}>{b}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.btn}
                            onPress={() => {
                                setUpsellModalVisible(false);
                                Linking.openURL(`https://wa.me/${coachWhatsappNumber}?text=${encodeURIComponent("Coach, quero subir de nível e migrar meu plano para a Consultoria Elite!")}`);
                            }}
                        >
                            <Text style={styles.btnText}>SER ELITE AGORA</Text>
                            <MaterialCommunityIcons name="whatsapp" size={20} color="#000" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modais externos */}
            <StudentReportModal
                visible={feedbackModalVisible}
                onClose={() => setFeedbackModalVisible(false)}
                pendingFeedback={home.pendingFeedback}
                userName={home.userName}
                markFeedbackAsRead={() => home.markFeedbackAsRead(() => setFeedbackModalVisible(false))}
                isMarkingAsRead={home.isMarkingAsRead}
            />

            <InitialPhotosModal
                visible={initialPhotosModalVisible}
                onClose={() => setInitialPhotosModalVisible(false)}
                theme={theme}
                photoModal={photoModal}
                userPlan={home.userPlan}
                onNavigate={() => { setInitialPhotosModalVisible(false); navigation.navigate('CheckIn'); }}
            />

            <SatisfactionSurveyModal
                visible={home.isSurveyVisible}
                onClose={() => home.setIsSurveyVisible(false)}
                userId={home.userData?.id}
                theme={theme}
                isPremium={home.userPlan === 'PREMIUM' || home.userPlan === 'ELITE'}
            />

            <DietGuideModal
                visible={dietModalVisible}
                onClose={() => setDietModalVisible(false)}
                theme={theme}
                dietGoal={home.userPlan === 'CHALLENGE_21' ? 'WEIGHT_LOSS' : home.userData?.dietGoal}
            />

            <LevelUpModal
                visible={levelModalVisible}
                onClose={() => setLevelModalVisible(false)}
                theme={theme}
                levelData={home.levelData}
                currentLevel={home.currentLevel}
                currentLevelProgress={home.currentLevelProgress}
                nextLevelXP={home.nextLevelXP}
            />

            <HomeNoticeModal
                visible={noticeModalVisible}
                onClose={() => home.handleReadNotice(() => setNoticeModalVisible(false))}
                theme={theme}
                activeNotice={home.activeNotice}
            />

            <ChatAIAssistantModal
                visible={chatVisible}
                onClose={() => setChatVisible(false)}
                theme={theme}
                isWeb={isWeb}
                messages={home.messages}
                flatListRef={home.flatListRef}
                chatInput={home.chatInput}
                setChatInput={home.setChatInput}
                handleSendChat={home.handleSendChat}
                isTyping={home.isTyping}
                QUICK_QUESTIONS={home.QUICK_QUESTIONS}
            />
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, paddingTop: Platform.OS === 'android' ? require('react-native').StatusBar.currentHeight + 10 : 0 },
    center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
    inner:      { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
    header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
    greeting:   { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    name:       { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    reloadBtn:  { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    statusBadge:{ paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
    statusText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
    xpCard:     { padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1 },
    levelText:  { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    xpText:     { fontSize: 11, fontWeight: 'bold' },
    xpBarBg:    { height: 8, borderRadius: 4, overflow: 'hidden' },
    xpBarFill:  { height: '100%', borderRadius: 4 },
    fabChat:    { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, zIndex: 999, elevation: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    fabGradient:{ width: '100%', height: '100%', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    // Modais
    overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    card:       { width: '90%', maxWidth: 420, alignSelf: 'center', padding: 25, borderRadius: 24, borderWidth: 2, alignItems: 'center' },
    closeBtn:   { position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 10 },
    iconBox:    { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    cardTitle:  { fontSize: 22, fontWeight: '900', marginBottom: 10, letterSpacing: 1, textAlign: 'center' },
    cardDesc:   { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    pixBox:     { width: '100%', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 15, alignItems: 'center' },
    benefitsBox:{ width: '100%', padding: 15, borderRadius: 16, borderWidth: 1, gap: 12, marginBottom: 25 },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    benefitText:{ fontSize: 13, fontWeight: 'bold' },
    btn:        { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5, marginBottom: 0 },
    btnText:    { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});