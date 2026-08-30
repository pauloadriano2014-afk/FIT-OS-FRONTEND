// src/screens/TrainingScreen.js
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  StatusBar, Alert, ActivityIndicator, RefreshControl, Platform, Modal, Linking
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Shadow } from 'react-native-shadow-2';

import { useTheme } from '../contexts/ThemeContext';
import WorkoutFolder from '../components/Training/WorkoutFolder';
import CycleInfoModal from '../components/Training/CycleInfoModal';
import MindsetModal from '../components/Training/MindsetModal';
import MonthlyFrequencyModal from '../components/Training/MonthlyFrequencyModal';

// 🏃 MÓDULO DE CORRIDA
import RunningTab from '../components/Training/RunningTab';
import useRunning from '../hooks/useRunning';

// 🔥 LÓGICA FINANCEIRA CENTRALIZADA
import { useFinanceLock } from '../hooks/useFinanceLock';
import { authHeaders } from '../utils/authToken';

export default function TrainingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activePrograms, setActivePrograms] = useState([]);
  const [userPlan, setUserPlan] = useState('PREMIUM');
  const { theme } = useTheme();

  const [hasSentInitialPhotos, setHasSentInitialPhotos] = useState(true);
  const [initialPhotosModalVisible, setInitialPhotosModalVisible] = useState(false);
  const [pendingWorkoutNav, setPendingWorkoutNav] = useState(null);

  // 🔥 FINANCEIRO + CLAIM DE PAGAMENTO
  const finance = useFinanceLock();

  // 🏃 ABA ATIVA — musculação ou corrida
  const [activeTab, setActiveTab] = useState('MUSCULACAO');
  const runningHook = useRunning();

  // Estados dos Modais
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [mindsetModalVisible, setMindsetModalVisible] = useState(false);
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);

  const [fullHistory, setFullHistory] = useState([]);
  const coachWhatsappNumber = '5541997991346';

  const generateWeeklyView = (history = []) => {
    const today = new Date();
    const dayOfWeekReal = today.getDay();
    const todayIndexNormalized = dayOfWeekReal === 0 ? 6 : dayOfWeekReal - 1;
    const daysShort = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const data = [];
    const monday = new Date(today);
    monday.setDate(today.getDate() - todayIndexNormalized);

    for (let i = 0; i < 7; i++) {
      const currentDayDate = new Date(monday);
      currentDayDate.setDate(monday.getDate() + i);
      const isDone = history.some(log => new Date(log.date).toDateString() === currentDayDate.toDateString());
      data.push({ dayName: daysShort[i], isToday: i === todayIndexNormalized, isDone: isDone });
    }
    return data;
  };

  const [weeklyHistoryData, setWeeklyHistoryData] = useState(generateWeeklyView([]));

  const fetchWorkouts = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);

      const dbPlan = user.plan || 'PREMIUM';
      const resolvedPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(dbPlan) ? dbPlan : 'PREMIUM';
      setUserPlan(resolvedPlan);

      // Chaves de Cache
      const cacheWorkoutsKey = `@cached_training_workouts_${user.id}`;
      const cacheHistoryKey = `@cached_training_history_${user.id}`;
      const cachePhotosKey = `@cached_training_photos_${user.id}`;

      // 🔥 FUNÇÃO DE PROCESSAMENTO CENTRALIZADA
      const processProgramsLogic = async (data, planToUse, hasPhotos) => {
        const now = new Date();
        const activeList = data.filter(w => {
          if (w.archived) return false;
          if (w.startDate) {
            const start = new Date(w.startDate); start.setHours(0, 0, 0, 0);
            if (now < start) return false;
          }
          if (w.endDate) {
            const end = new Date(w.endDate); end.setHours(23, 59, 59, 999);
            if (now > end) return false;
          }
          return true;
        });

        // 🔥 ALTERNÂNCIA SEMANAL: entre os treinos que já passaram no filtro
        // acima, os marcados com "alternateSlot" (1, 2...) revezam por semana
        // em vez de aparecerem todos juntos pro aluno -- só o slot da semana
        // atual fica visível. A "semana 1" da dupla começa no startDate mais
        // antigo entre os marcados (não depende de cair numa segunda-feira).
        // Quem não usa essa marcação (alternateSlot null/undefined) continua
        // aparecendo sempre, como já era antes dessa funcionalidade existir.
        const alwaysVisible = activeList.filter(w => w.alternateSlot === null || w.alternateSlot === undefined);
        const alternatingGroup = activeList.filter(w => w.alternateSlot !== null && w.alternateSlot !== undefined);

        let visibleAlternating = alternatingGroup;
        if (alternatingGroup.length > 0) {
          const anchor = alternatingGroup.reduce((min, w) => {
            const d = new Date(w.startDate); d.setHours(0, 0, 0, 0);
            return (!min || d < min) ? d : min;
          }, null);
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const daysSince = Math.floor((today - anchor) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.floor(daysSince / 7);
          const slots = [...new Set(alternatingGroup.map(w => w.alternateSlot))].sort((a, b) => a - b);
          const activeSlot = slots[((weekIndex % slots.length) + slots.length) % slots.length];
          visibleAlternating = alternatingGroup.filter(w => w.alternateSlot === activeSlot);
        }

        const finalActiveList = [...alwaysVisible, ...visibleAlternating];

        const processedPrograms = await Promise.all(finalActiveList.map(async (workout) => {
          let localCompleted = null;
          try { localCompleted = await AsyncStorage.getItem(`@completed_days_${workout.id}`); } catch(e){}
          let completedDays = localCompleted ? JSON.parse(localCompleted) : [];
          completedDays = completedDays.map(d => String(d).trim().toUpperCase());

          const groups = (workout.exercises || []).reduce((acc, item) => {
            const day = item.day || 'Treino';
            if (!acc[day]) acc[day] = { day: day, muscleGroups: new Set(), exerciseCount: 0 };
            acc[day].exerciseCount++;
            if (item.exercise?.category) acc[day].muscleGroups.add(item.exercise.category);
            return acc;
          }, {});

          const daysArray = Object.values(groups);
          const daysWithStatus = daysArray.map((d) => {
            const normDay = String(d.day).trim().toUpperCase();
            const isDone = completedDays.includes(normDay);
            return { ...d, isDone, isNext: false, normDay };
          });

          let nextIndex = daysWithStatus.findIndex(x => !x.isDone && !(x.day.toUpperCase() === 'OFF' || x.day.toUpperCase().includes('DESCANSO')));
          if (nextIndex !== -1) daysWithStatus[nextIndex].isNext = true;

          return { ...workout, routineDays: daysWithStatus };
        }));

        setActivePrograms(processedPrograms);

        if (processedPrograms.length > 0 && planToUse !== 'PREMIUM') {
          let startD = new Date(processedPrograms[0].startDate);
          startD.setHours(0, 0, 0, 0);
          const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
          const diffTime = todayD.getTime() - startD.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
          const isPlaceholder = processedPrograms[0].name.includes("CONSTRUÇÃO") || processedPrograms[0].routineDays.length === 0;
          if (!hasPhotos && diffDays >= 0 && !isPlaceholder) setHasSentInitialPhotos(false);
          else setHasSentInitialPhotos(true);
        } else {
          setHasSentInitialPhotos(true);
        }
      };

      // ==========================================
      // 1. CARREGAMENTO OFFLINE (CACHE PRIMEIRO)
      // ==========================================
      let currentHasPhotos = true;
      try {
        const cachedPhotos = await AsyncStorage.getItem(cachePhotosKey);
        if (cachedPhotos !== null) currentHasPhotos = JSON.parse(cachedPhotos);

        const cachedHistory = await AsyncStorage.getItem(cacheHistoryKey);
        if (cachedHistory) {
          const parsedHistory = JSON.parse(cachedHistory);
          setWeeklyHistoryData(generateWeeklyView(parsedHistory));
          setFullHistory(parsedHistory);
        }

        const cachedWorkouts = await AsyncStorage.getItem(cacheWorkoutsKey);
        if (cachedWorkouts) {
          const parsedWorkouts = JSON.parse(cachedWorkouts);
          await processProgramsLogic(parsedWorkouts, resolvedPlan, currentHasPhotos);
        }
      } catch (e) {
        console.log("Erro ao carregar cache da TrainingScreen", e);
      }

      // ==========================================
      // 2. BUSCA NA INTERNET (ATUALIZA A TELA E O CACHE)
      // ==========================================
      try {
        const financeResult = await finance.fetchFinanceStatus(user.id);
        if (financeResult?.isFinanceLocked) {
          setLoading(false);
          return;
        }

        // 🔒 As 3 rotas abaixo passaram a exigir login verificado (JWT) e essa
        // tela (a aba "Treinos" do aluno) nunca tinha sido atualizada pra
        // mandar o token — por isso vinham 401 e o treino/checkin pareciam
        // ter sumido (a tela só mostrava o que já estava salvo em cache).
        const authHdrs = await authHeaders();
        const [response, historyRes, checkinRes] = await Promise.all([
          fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&t=${Date.now()}`, { headers: { ...authHdrs } }),
          fetch(`https://fitos-final.onrender.com/api/user/history?userId=${user.id}&t=${Date.now()}`, { headers: { ...authHdrs } }),
          fetch(`https://fitos-final.onrender.com/api/checkin?userId=${user.id}`, { headers: { ...authHdrs } })
        ]);

        if (checkinRes.ok) {
          const checkinsData = await checkinRes.json();
          const hasPhotosInDb = Array.isArray(checkinsData) && checkinsData.length > 0;
          currentHasPhotos = hasPhotosInDb;
          // 🔥 Tenta salvar no cache, mas se estiver lotado engole o erro!
          try { await AsyncStorage.setItem(cachePhotosKey, JSON.stringify(hasPhotosInDb)); } catch (e) {}
        }

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            // 🔥 1º PASSO: ATUALIZA A TELA IMEDIATAMENTE (Garante que os treinos apareçam)
            await processProgramsLogic(data, resolvedPlan, currentHasPhotos);
            // 🔥 2º PASSO: TENTA SALVAR O CACHE (Se a memória estiver cheia e dar erro, a tela não quebra!)
            try { await AsyncStorage.setItem(cacheWorkoutsKey, JSON.stringify(data)); } catch (e) {}
          } else {
            setActivePrograms([]);
          }
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (Array.isArray(historyData)) {
            // 🔥 1º PASSO: ATUALIZA A TELA IMEDIATAMENTE
            setWeeklyHistoryData(generateWeeklyView(historyData));
            setFullHistory(historyData);
            // 🔥 2º PASSO: TENTA SALVAR O CACHE
            try { await AsyncStorage.setItem(cacheHistoryKey, JSON.stringify(historyData)); } catch (e) {}
          }
        }
      } catch (e) {
        console.log("Modo offline: Falha ao buscar dados novos, mantendo tela carregada pelo cache.");
      }

    } catch (error) {
      console.log("Erro fatal fetchWorkouts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchWorkouts();
    runningHook.fetchRunning(); 
  }, []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    runningHook.setRefreshing(true);
    fetchWorkouts();
    runningHook.fetchRunning();
  }, []);

  const handleResetCycle = async (workoutId) => {
    const execReset = async () => {
      try { await AsyncStorage.removeItem(`@completed_days_${workoutId}`); } catch(e){}
      fetchWorkouts();
    };
    if (Platform.OS === 'web') {
      if (window.confirm("Deseja limpar os checks e iniciar um novo ciclo nesta semana?")) execReset();
    } else {
      Alert.alert("Reiniciar Ciclo", "Deseja limpar os checks e iniciar um novo ciclo nesta semana?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Reiniciar", style: "destructive", onPress: execReset }
      ]);
    }
  };

  const handleDayPress = (workoutId, day, workoutName) => {
    if (!hasSentInitialPhotos && userPlan !== 'PREMIUM') {
      setPendingWorkoutNav({ workoutId, day, workoutName });
      setInitialPhotosModalVisible(true);
    } else {
      navigation.navigate('DayWorkout', { workoutId, day, workoutName });
    }
  };

  const handlePressClaimPayment = async () => {
    const ok = await finance.confirmAndClaimPayment();
    if (ok) {
      setLoading(true);
      fetchWorkouts();
    }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  if (!loading && finance.isFinanceLocked) {
    return (
      <RootComponent style={[styles.centeredFinanceBlock, { backgroundColor: theme.bg }]}>
        <MaterialCommunityIcons name="lock-alert" size={70} color="#FF3B30" style={{ marginBottom: 20 }} />
        <Text style={[styles.stateTitleFinance, { color: theme.text }]}>ACESSO BLOQUEADO</Text>
        <Text style={[styles.stateDescFinance, { color: theme.textSecondary, marginBottom: 20 }]}>
          O seu plano venceu e o acesso à rotina de treinos foi suspenso temporariamente.
          {"\n\n"}Fale com o Coach para realizar a renovação e liberar o sistema.
        </Text>

        {finance.paymentClaimExpired && (
          <View style={[styles.claimExpiredBox, { backgroundColor: '#FF950022', borderColor: '#FF9500' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF9500" />
            <Text style={{ color: theme.text, fontSize: 12, marginLeft: 8, flex: 1, lineHeight: 17 }}>
              O prazo para confirmação automática acabou. Fale direto com seu coach para liberar seu acesso.
            </Text>
          </View>
        )}

        {finance.canClaimPayment && (
          <TouchableOpacity
            style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: '#32ADE6', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, width: '100%', justifyContent: 'center', maxWidth: 320 }}
            onPress={handlePressClaimPayment}
            disabled={finance.isClaimingPayment}
          >
            {finance.isClaimingPayment ? <ActivityIndicator color="#32ADE6" /> : (
              <>
                <Text style={{ color: '#32ADE6', fontWeight: '900', fontSize: 14 }}>JÁ PAGUEI, REGISTRAR</Text>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#32ADE6" />
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{ backgroundColor: '#25D366', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          onPress={() => Linking.openURL(`https://wa.me/${coachWhatsappNumber}?text=Coach, preciso falar sobre a renovação do meu plano!`)}
        >
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>FALAR COM O COACH</Text>
          <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
        </TouchableOpacity>
      </RootComponent>
    );
  }

  if (loading && !refreshing) return (
    <View style={[styles.center, { backgroundColor: theme.bg }]}>
      <ActivityIndicator color={theme.accent} size="large" />
    </View>
  );

  const shadowOpt = { distance: 12, startColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.04)', offset: [0, 6] };

  return (
    <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}>

        <ScrollView
          style={[styles.scrollArea, isWeb && { overflowY: 'auto' }]}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.headerLimpado}>
            <Text style={[styles.headerTitleLimpado, { color: theme.text }]}>
              PAINEL DO <Text style={{ color: theme.accent, fontWeight: '900' }}>ALUNO</Text>
            </Text>
          </View>

          {/* 🔥 BANNER: PAGAMENTO EM ANÁLISE */}
          {finance.isPaymentClaimActive && (
            <View style={[styles.claimReviewBanner, { backgroundColor: '#32ADE622', borderColor: '#32ADE6', marginHorizontal: 20 }]}>
              <MaterialCommunityIcons name="clock-check-outline" size={22} color="#32ADE6" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: '#32ADE6', fontWeight: '900', fontSize: 12, letterSpacing: 0.3 }}>
                  PAGAMENTO EM ANÁLISE
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                  Seu acesso está liberado enquanto seu coach confirma{finance.paymentClaimDaysLeft != null ? ` (até ${finance.paymentClaimDaysLeft} dia${finance.paymentClaimDaysLeft === 1 ? '' : 's'})` : ''}.
                </Text>
              </View>
            </View>
          )}

          {/* 🏃 ABAS GLOBAIS */}
          <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'MUSCULACAO' && { borderBottomColor: theme.accent }]}
              onPress={() => setActiveTab('MUSCULACAO')}
            >
              <MaterialCommunityIcons name="dumbbell" size={16} color={activeTab === 'MUSCULACAO' ? theme.accent : theme.textSecondary} />
              <Text style={[styles.tabBtnText, { color: activeTab === 'MUSCULACAO' ? theme.accent : theme.textSecondary }]}>
                MUSCULAÇÃO
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'CORRIDA' && { borderBottomColor: '#22c55e' }]}
              onPress={() => setActiveTab('CORRIDA')}
            >
              <MaterialCommunityIcons name="run-fast" size={16} color={activeTab === 'CORRIDA' ? '#22c55e' : theme.textSecondary} />
              <Text style={[styles.tabBtnText, { color: activeTab === 'CORRIDA' ? '#22c55e' : theme.textSecondary }]}>
                CORRIDA
              </Text>
            </TouchableOpacity>
          </View>

          {/* ABA: CORRIDA */}
          {activeTab === 'CORRIDA' && (
            <RunningTab theme={theme} useRunningHook={runningHook} />
          )}

          {/* ABA: MUSCULAÇÃO */}
          {activeTab === 'MUSCULACAO' && (
            <>
              {/* Calendário semanal */}
              <View style={styles.sectionContainerMod}>
                <Shadow {...shadowOpt} containerStyle={{ width: '100%' }} style={{ width: '100%' }}>
                  <View style={[styles.calendarCardMod, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.calendarHeaderRow}>
                      <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                      <Text style={[styles.miniLabelMod, { color: theme.textSecondary }]}>SUA CONSISTÊNCIA NESTA SEMANA</Text>
                    </View>
                    <View style={styles.calendarRowMod}>
                      {weeklyHistoryData.map((day, index) => (
                        <View key={index} style={styles.calendarDayItemMod}>
                          <Text style={[styles.calendarDayTextMod, { color: theme.text }, day.isToday && { color: theme.accent, fontWeight: 'bold' }]}>{day.dayName}</Text>
                          {day.isDone ? (
                            <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />
                          ) : (
                            <View style={[styles.calendarDotMod, { borderColor: theme.border }, day.isToday && { backgroundColor: theme.accent, borderColor: theme.accent }]} />
                          )}
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[styles.monthlyBtn, { borderTopColor: theme.border }]}
                      onPress={() => setMonthlyModalVisible(true)}
                    >
                      <Text style={[styles.monthlyBtnText, { color: theme.textSecondary }]}>VER ANO COMPLETO</Text>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </Shadow>
              </View>

              {/* Programas ativos */}
              {activePrograms.length > 0 ? (
                <View style={styles.sectionContainerMod}>
                  {activePrograms.map(program => (
                    <WorkoutFolder
                      key={program.id}
                      program={program}
                      theme={theme}
                      handleDayPress={handleDayPress}
                      handleResetCycle={handleResetCycle}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.sectionContainerMod}>
                  <View style={[styles.emptyCardMod, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="dumbbell" size={48} color={theme.border} />
                    <Text style={[styles.emptyCardTextMod, { color: theme.textSecondary }]}>Aguardando seu próximo programa.</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Entre em contato com o Coach Paulo.</Text>
                  </View>
                </View>
              )}

              {/* Botões de guia */}
              <View style={[styles.sectionContainerMod, { marginTop: -5 }]}>
                <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                  <TouchableOpacity
                    style={[styles.guideBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => setInfoModalVisible(true)}
                  >
                    <View style={[styles.guideIconBox, { backgroundColor: theme.accent + '20' }]}>
                      <MaterialCommunityIcons name="information-outline" size={20} color={theme.accent} />
                    </View>
                    <Text style={[styles.guideBtnText, { color: theme.text }]}>INFORMAÇÕES{"\n"}DO TREINO</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.guideBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => setMindsetModalVisible(true)}
                  >
                    <View style={[styles.guideIconBox, { backgroundColor: '#AF52DE20' }]}>
                      <MaterialCommunityIcons name="brain" size={20} color="#AF52DE" />
                    </View>
                    <Text style={[styles.guideBtnText, { color: theme.text }]}>MINDSET &{"\n"}REGRAS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

        </ScrollView>
      </View>

      {/* Modal fotos pendentes */}
      <Modal visible={initialPhotosModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', padding: 25, borderRadius: 24, borderWidth: 2, alignItems: 'center', backgroundColor: theme.surface, borderColor: theme.accent }}>
            <TouchableOpacity style={{ position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 10 }} onPress={() => setInitialPhotosModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <View style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.accent + '22', marginBottom: 20 }}>
              <MaterialCommunityIcons name="camera-timer" size={36} color={theme.accent} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', marginBottom: 10, letterSpacing: 1, textAlign: 'center', color: theme.text }}>FOTOS PENDENTES 📸</Text>
            <Text style={{ fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20, color: theme.textSecondary }}>
              Para mapearmos a sua evolução real, precisamos do seu Ponto de Partida. Sabemos que pode não ser o momento ideal agora, mas envie assim que possível!
            </Text>
            <TouchableOpacity
              style={{ width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5, backgroundColor: theme.accent, marginBottom: 10 }}
              onPress={() => { setInitialPhotosModalVisible(false); navigation.navigate('CheckIn'); }}
            >
              <MaterialCommunityIcons name="camera" size={20} color={theme.isDark ? '#000' : '#FFF'} style={{ marginRight: 8 }} />
              <Text style={{ fontWeight: '900', fontSize: 14, letterSpacing: 1, color: theme.isDark ? '#000' : '#FFF' }}>TIRAR FOTOS AGORA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 15, alignItems: 'center' }}
              onPress={() => {
                setInitialPhotosModalVisible(false);
                if (pendingWorkoutNav) {
                  navigation.navigate('DayWorkout', pendingWorkoutNav);
                  setPendingWorkoutNav(null);
                }
              }}
            >
              <Text style={{ color: theme.textSecondary, fontWeight: 'bold', fontSize: 12, textDecorationLine: 'underline' }}>
                TREINAR MESMO ASSIM (Lembrar Depois)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modais de musculação */}
      <CycleInfoModal visible={infoModalVisible} onClose={() => setInfoModalVisible(false)} theme={theme} />
      <MindsetModal visible={mindsetModalVisible} onClose={() => setMindsetModalVisible(false)} theme={theme} />
      <MonthlyFrequencyModal visible={monthlyModalVisible} onClose={() => setMonthlyModalVisible(false)} theme={theme} history={fullHistory} />

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 0 },
  scrollArea: { flex: 1, width: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerLimpado: { padding: 20, paddingTop: 15, marginBottom: 10 },
  headerTitleLimpado: { fontSize: 28, fontWeight: '800' },
  sectionContainerMod: { marginHorizontal: 20, marginBottom: 30, alignItems: 'center' },

  claimReviewBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  claimExpiredBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 15, width: '100%', maxWidth: 320 },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  calendarCardMod: { width: '100%', padding: 20, borderRadius: 24, borderWidth: 1 },
  calendarHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15, alignSelf: 'center' },
  miniLabelMod: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  calendarRowMod: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  calendarDayItemMod: { alignItems: 'center', flex: 1 },
  calendarDayTextMod: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  calendarDotMod: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  monthlyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 20, paddingTop: 15, borderTopWidth: 1 },
  monthlyBtnText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  emptyCardMod: { width: '100%', padding: 50, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  emptyCardTextMod: { fontWeight: 'bold', fontSize: 16, marginTop: 20, marginBottom: 8 },

  guideBtn: { flex: 1, padding: 15, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  guideIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  guideBtnText: { fontSize: 11, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, lineHeight: 16 },

  centeredFinanceBlock: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateTitleFinance: { fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  stateDescFinance: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
});
