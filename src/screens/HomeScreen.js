// src/screens/HomeScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
    StatusBar, RefreshControl, ActivityIndicator, Platform, Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

// ── Hook de dados ──────────────────────────────────────────────────────────
import { useHomeData } from '../hooks/useHomeData';

// ── Sub-componentes ────────────────────────────────────────────────────────
import HomeBanners    from '../components/HomeBanners';
import HomeMainAction from '../components/HomeMainAction';
import HomeGrid       from '../components/HomeGrid';
import ImpersonateExitButton from '../components/ImpersonateExitButton';
import HomeFloatingChat      from '../components/HomeFloatingChat';
import HomeModalsManager     from '../components/HomeModalsManager';

export default function HomeScreen({ navigation }) {
    const { theme } = useTheme();
    const home = useHomeData();

    // ── Estados de UI (Modais) ───────────────
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
    const [paymentModalVisible,      setPaymentModalVisible]      = useState(false);
    const [recurrenceModalVisible,   setRecurrenceModalVisible]   = useState(false);
    const [anamnesePendingModalVisible, setAnamnesePendingModalVisible] = useState(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => { if (home.activeNotice) setNoticeModalVisible(true); }, [home.activeNotice]);
    useEffect(() => { if (home.pendingFeedback) setFeedbackModalVisible(true); }, [home.pendingFeedback]);

    useEffect(() => {
        setAnamnesePendingModalVisible(home.userData?.anamnesePendente === true);
    }, [home.userData?.anamnesePendente]);

    useEffect(() => {
        const shouldPulse = home.isCheckinPending || home.pendingFeedback
            || home.showVideoAlert || (home.daysToPay !== null && home.daysToPay <= 3)
            || home.userData?.anamnesePendente; 

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
    }, [home.isCheckinPending, home.pendingFeedback, home.showVideoAlert, home.daysToPay, home.userData?.anamnesePendente]);

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

    const handleHardReload = () => {
        home.setLoading(true);
        if (Platform.OS === 'web') window.location.reload(true);
        else home.loadHomeData();
    };

    // ── Helpers derivados ─────────────────────────────────────────────────
    const helpers = {
        coachNameLabel: home.getCoachInfo(home.userData).coachNameLabel,
        coachWhatsappNumber: home.getCoachInfo(home.userData).coachWhatsappNumber,
        photoModal: home.getPhotoModalContent(home.userPlan),
    };

    const isFemale    = home.detectIsFemale(home.userData);
    const limitDays      = home.userPlan === 'CHALLENGE_21' ? 21 : 56;
    const isFichaExpired = ['FICHA_8S', 'CHALLENGE_21'].includes(home.userPlan) && home.fichaDaysElapsed >= limitDays && !home.isFichaPlaceholder;
    const isWaitingStart = ['FICHA_8S', 'CHALLENGE_21', 'LOW_COST'].includes(home.userPlan) && home.daysToStart > 0;
    const needsInitialPhoto = !home.hasSentInitialPhotos;
    const isBlockedTotal    = isFichaExpired || isWaitingStart || needsInitialPhoto || home.isFinanceLocked;

    const openUpsell = (featureName) => { setUpsellFeature(featureName); setUpsellModalVisible(true); };

    const isWeb         = Platform.OS === 'web';
    const webOuterBg    = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const RootComponent = isWeb ? View : SafeAreaView;

    const states = {
        fichaExpiredModalVisible, setFichaExpiredModalVisible,
        dietModalVisible, setDietModalVisible,
        initialPhotosModalVisible, setInitialPhotosModalVisible,
        financeModalVisible, setFinanceModalVisible,
        feedbackModalVisible, setFeedbackModalVisible,
        noticeModalVisible, setNoticeModalVisible,
        levelModalVisible, setLevelModalVisible,
        chatVisible, setChatVisible,
        upsellModalVisible, setUpsellModalVisible,
        upsellFeature, setUpsellFeature,
        paymentModalVisible, setPaymentModalVisible,
        recurrenceModalVisible, setRecurrenceModalVisible,
        anamnesePendingModalVisible, setAnamnesePendingModalVisible,
    };

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
                    refreshControl={ <RefreshControl refreshing={home.refreshing} onRefresh={() => { home.setRefreshing(true); home.loadHomeData(); }} tintColor={theme.accent} /> }
                    showsVerticalScrollIndicator={false}
                >
                    <ImpersonateExitButton navigation={navigation} />

                    <View style={styles.header}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={[styles.greeting, { color: theme.textSecondary }]} numberOfLines={1}>
                                BEM-VINDO AO {
                                    home.userPlan === 'LOW_COST'      ? 'PLANO BÁSICO'       :
                                    home.userPlan === 'FICHA_8S'      ? 'PROJETO DE FICHAS'  :
                                    home.userPlan === 'CHALLENGE_21'  ? 'DESAFIO 21 DIAS'    :
                                    'ELITE'
                                }
                            </Text>
                            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                                {home.userName.toUpperCase()} ⚡
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity style={[styles.reloadBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleHardReload}>
                                <MaterialCommunityIcons name="refresh" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.statusBadge, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setLevelModalVisible(true)}>
                                <Text style={[styles.statusText, { color: theme.accent }]}>{home.levelData.title}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <HomeBanners
                        theme={theme} navigation={navigation}
                        daysToPay={home.daysToPay} isFinanceLocked={home.isFinanceLocked}
                        isPaymentClaimActive={home.isPaymentClaimActive} disableCheckIn={home.disableCheckIn}
                        onOpenFinanceModal={() => setFinanceModalVisible(true)}
                        showVideoAlert={home.showVideoAlert} newVideoContent={home.newVideoContent}
                        pulseAnim={pulseAnim} onDismissVideo={home.handleDismissVideoAlert}
                        isFemale={isFemale} isMenstruating={home.isMenstruating}
                        togglingMenstrual={home.togglingMenstrual} onToggleMenstrual={home.toggleMenstrualCycle}
                        needsInitialPhoto={needsInitialPhoto} pendingFeedback={home.pendingFeedback}
                        onOpenInitialPhotos={() => setInitialPhotosModalVisible(true)}
                        isCheckinPending={home.isCheckinPending} isCheckinLate={home.isCheckinLate}
                        isEliteAwaitingCoach={home.isEliteAwaitingCoach} scheduledCheckInDate={home.scheduledCheckInDate}
                        userPlan={home.userPlan} hasSentInitialPhotos={home.hasSentInitialPhotos}
                    />

                    {home.isPaymentClaimActive && (
                        <View style={[styles.claimReviewBanner, { backgroundColor: '#32ADE622', borderColor: '#32ADE6' }]}>
                            <MaterialCommunityIcons name="clock-check-outline" size={22} color="#32ADE6" />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={{ color: '#32ADE6', fontWeight: '900', fontSize: 12, letterSpacing: 0.3 }}>PAGAMENTO EM ANÁLISE</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                    Seu treino está liberado enquanto seu coach confirma{home.paymentClaimDaysLeft != null ? ` (até ${home.paymentClaimDaysLeft} dia${home.paymentClaimDaysLeft === 1 ? '' : 's'})` : ''}.
                                </Text>
                            </View>
                        </View>
                    )}

                    {home.userData?.anamnesePendente === true && (
                        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 15 }}>
                            <TouchableOpacity style={[styles.urgentBanner, { backgroundColor: '#FF9500' }]} onPress={() => navigation.navigate('Anamnese')} activeOpacity={0.8}>
                                <MaterialCommunityIcons name="alert-octagon" size={28} color="#000" />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>FICHA DESATUALIZADA!</Text>
                                    <Text style={{ color: '#000', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Toque aqui para preencher seus dados.</Text>
                                </View>
                                <MaterialCommunityIcons name="arrow-right" size={24} color="#000" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {['FICHA_8S', 'CHALLENGE_21'].includes(home.userPlan) && !isFichaExpired ? (
                        <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={[styles.levelText, { color: theme.accent }]}>{home.userPlan === 'CHALLENGE_21' ? 'CRONOGRAMA DO DESAFIO' : 'FICHA 8 SEMANAS'}</Text>
                                <Text style={[styles.xpText, { color: theme.textSecondary }]}>
                                    {isWaitingStart ? `INICIA EM ${home.daysToStart} DIAS` : home.isFichaPlaceholder ? 'PREPARANDO TREINO' : home.userPlan === 'CHALLENGE_21' ? `DIA ${home.fichaDaysElapsed + 1} DE 21` : `SEMANA ${Math.min(8, Math.max(1, Math.ceil(home.fichaDaysElapsed / 7)))} DE 8`}
                                </Text>
                            </View>
                            <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                                {home.fichaDaysElapsed > 0 && <View style={[styles.xpBarFill, { width: `${Math.min(100, (home.fichaDaysElapsed / limitDays) * 100)}%`, backgroundColor: theme.accent }]} />}
                            </View>
                        </View>
                    ) : !['FICHA_8S', 'CHALLENGE_21'].includes(home.userPlan) ? (
                        <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={[styles.levelText, { color: theme.accent }]}>NÍVEL {home.currentLevel}</Text>
                                <Text style={[styles.xpText, { color: theme.textSecondary }]}>{home.currentLevelProgress} / {home.nextLevelXP} XP</Text>
                            </View>
                            <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                                {home.currentLevelProgress > 0 && <View style={[styles.xpBarFill, { width: `${(home.currentLevelProgress / home.nextLevelXP) * 100}%`, backgroundColor: theme.accent }]} />}
                            </View>
                        </View>
                    ) : null}

                    <HomeMainAction
                        theme={theme} navigation={navigation} isBlockedTotal={isBlockedTotal}
                        isFinanceLocked={home.isFinanceLocked} isFichaExpired={isFichaExpired}
                        isWaitingStart={isWaitingStart} needsInitialPhoto={needsInitialPhoto}
                        daysToStart={home.daysToStart} pendingFeedback={home.pendingFeedback}
                        pulseAnim={pulseAnim} onOpenFeedback={() => setFeedbackModalVisible(true)}
                        onOpenFinanceModal={() => setFinanceModalVisible(true)}
                        onOpenFichaExpiredModal={() => setFichaExpiredModalVisible(true)}
                        onOpenInitialPhotos={() => setInitialPhotosModalVisible(true)}
                        userPlan={home.userPlan} userData={home.userData}
                        onOpenDiet={() => setDietModalVisible(true)}
                    />

                    <HomeGrid
                        theme={theme} navigation={navigation} pulseAnim={pulseAnim} userPlan={home.userPlan}
                        disableCheckIn={home.disableCheckIn} needsInitialPhoto={needsInitialPhoto}
                        isCheckinPending={home.isCheckinPending} pendingFeedback={home.pendingFeedback}
                        brandLogoUrl={home.brandLogoUrl} brandLogoSize={home.brandLogoSize}
                    />
                </ScrollView>

                <HomeFloatingChat 
                    theme={theme} userPlan={home.userPlan} 
                    onOpenChat={() => setChatVisible(true)} 
                    onOpenUpsell={openUpsell} 
                />
            </View>

            <HomeModalsManager 
                theme={theme} navigation={navigation} isWeb={isWeb} 
                home={home} states={states} helpers={helpers} 
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
    urgentBanner:{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, elevation: 4, shadowColor: '#FF9500', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    claimReviewBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 15 },
    xpCard:     { padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1 },
    levelText:  { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    xpText:     { fontSize: 11, fontWeight: 'bold' },
    xpBarBg:    { height: 8, borderRadius: 4, overflow: 'hidden' },
    xpBarFill:  { height: '100%', borderRadius: 4 },
});