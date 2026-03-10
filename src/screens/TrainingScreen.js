// src/screens/TrainingScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, StatusBar, Alert, ActivityIndicator, RefreshControl, Platform 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Shadow } from 'react-native-shadow-2'; 
import { LinearGradient } from 'expo-linear-gradient'; 

import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const TIPS = [
    "A consistência vence a intensidade no longo prazo.",
    "Controle a descida (excêntrica). É lá que o músculo cresce.",
    "Hidratação é anabólica. Bebeu água hoje?",
    "Não pule o aquecimento. Sua longevidade agradece.",
    "O descanso faz parte do treino. Durma bem."
];

export default function TrainingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeProgram, setActiveProgram] = useState(null); 
  
  const { theme } = useTheme();
  
  const [isTodayDone, setIsTodayDone] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(null);
  const [dailyTip, setDailyTip] = useState("");

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

          data.push({
              dayName: daysShort[i],
              isToday: i === todayIndexNormalized,
              isDone: isDone
          });
      }
      return data;
  };

  const [weeklyHistoryData, setWeeklyHistoryData] = useState(generateWeeklyView([]));

  const fetchWorkouts = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);

      const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&t=${Date.now()}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data) && data.length > 0) {
        const today = new Date();
        const activeList = data.filter(w => new Date(w.endDate) >= today && !w.archived);

        if (activeList.length > 0) {
            setActiveProgram(activeList[0]);
        } else {
            setActiveProgram(null);
        }
      } else {
        setActiveProgram(null);
      }

      const historyRes = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${user.id}&t=${Date.now()}`);
      const historyData = await historyRes.json();

      if (Array.isArray(historyData)) {
          const todayStr = new Date().toDateString(); 
          const foundToday = historyData.some(log => new Date(log.date).toDateString() === todayStr);
          setIsTodayDone(foundToday);
          setWeeklyHistoryData(generateWeeklyView(historyData));
      }

    } catch (error) {
      console.log("Erro fetchWorkouts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchWorkouts(); }, []));
  useEffect(() => { setDailyTip(TIPS[Math.floor(Math.random() * TIPS.length)]); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchWorkouts(); }, []);

  const handleEnergySelect = (level) => {
      setEnergyLevel(level);
      let title = "", msg = "";
      if (level === 'low') {
           title = "Dia de Cautela 🛡️";
           msg = "Escute seu corpo. Reduza cargas em 20% e foque na técnica.";
      } else if (level === 'medium') {
           title = "Disciplina é Tudo ⚔️";
           msg = "Excelente. Mantenha o foco e siga o plano.";
      } else {
           title = "Modo Besta Ativado 🔥";
           msg = "Aproveite a energia! Dia de buscar o melhor rendimento.";
      }
      if (Platform.OS === 'web') { window.alert(`${title}\n\n${msg}`); } else { Alert.alert(title, msg); }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  if (loading && !refreshing) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator color={theme.accent} size="large" /></View>;

  const shadowOpt = { distance: 12, startColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.04)', offset: [0, 6] };

  return (
    <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          <ScrollView 
            style={[styles.scrollArea, isWeb && { overflowY: 'auto' }]}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent}/>}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerLimpado}>
                <Text style={[styles.headerTitleLimpado, { color: theme.text }]}>PAINEL DO <Text style={{color: theme.accent, fontWeight: '900'}}>ALUNO</Text></Text>
            </View>

            <View style={styles.sectionContainerMod}>
                <Shadow {...shadowOpt} containerStyle={{width:'100%'}} style={{width:'100%'}}>
                    <View style={[styles.calendarCardMod, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.calendarHeaderRow}>
                            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                            <Text style={[styles.miniLabelMod, { color: theme.textSecondary }]}>SUA CONSISTÊNCIA NESTA SEMANA</Text>
                        </View>
                        <View style={styles.calendarRowMod}>
                            {weeklyHistoryData.map((day, index) => (
                                <View key={index} style={styles.calendarDayItemMod}>
                                    <Text style={[styles.calendarDayTextMod, { color: theme.text }, day.isToday && {color: theme.accent, fontWeight: 'bold'}]}>{day.dayName}</Text>
                                    
                                    {day.isDone ? (
                                        <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />
                                    ) : (
                                        <View style={[styles.calendarDotMod, { borderColor: theme.border }, day.isToday && {backgroundColor: theme.accent, borderColor: theme.accent}]} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                </Shadow>
            </View>

            <View style={styles.sectionContainerMod}>
                <Text style={[styles.sectionTitleMod, { color: theme.textSecondary }]}>COMO VOCÊ ESTÁ SE SENTINDO HOJE?</Text>
                <View style={styles.readinessRowMod}>
                    {[
                        { level: 'low', emoji: '😫', label: 'Cansado', color: '#FF3B30', bg: theme.isDark ? '#331111' : '#FFE5E5' },
                        { level: 'medium', emoji: '😐', label: 'Disciplina', color: '#32ADE6', bg: theme.isDark ? '#112233' : '#E5F6FF' },
                        { level: 'high', emoji: '😤', label: 'Motivado', color: theme.accent, bg: theme.isDark ? '#1A2200' : theme.accent + '15' }
                    ].map((item) => (
                        <TouchableOpacity 
                            key={item.level} 
                            style={[
                                styles.energyCardMod, 
                                { backgroundColor: theme.surface, borderColor: theme.border },
                                energyLevel === item.level && { borderColor: item.color, backgroundColor: item.bg, elevation: 8 }
                            ]}
                            onPress={() => handleEnergySelect(item.level)} 
                        >
                            <Text style={styles.energyEmojiMod}>{item.emoji}</Text>
                            <Text style={[styles.energyLabelMod, { color: energyLevel === item.level ? item.color : theme.text }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {activeProgram ? (
                <View style={styles.sectionContainerMod}>
                  <Shadow {...shadowOpt} containerStyle={{width:'100%'}} style={{width:'100%'}}>
                    <TouchableOpacity 
                        style={[styles.heroCardMod, { borderColor: theme.border }, isTodayDone && {borderColor: theme.accent} ]}
                        onPress={() => navigation.navigate('RoutineDetails', { workoutId: activeProgram.id, workoutName: activeProgram.name })}
                        activeOpacity={0.9}
                    >
                        <LinearGradient 
                            colors={isTodayDone ? [theme.accent + '15', theme.surface] : [theme.surface, theme.surface]} 
                            style={StyleSheet.absoluteFillObject} 
                        />

                        <View style={styles.heroHeaderMod}>
                            <View style={{ flex: 1, marginRight: 15 }}>
                                <View style={styles.heroBadgeRowMod}>
                                    <View style={[styles.goalBadgeMod, {backgroundColor: theme.accent + '15', borderColor: theme.accent}]}>
                                        <Text style={[styles.goalBadgeTextMod, {color: theme.accent}]}>{activeProgram.goal?.toUpperCase() || 'GERAL'}</Text>
                                    </View>
                                    {isTodayDone && (
                                        <View style={[styles.goalBadgeMod, {backgroundColor: '#28A74515', borderColor: '#28A745'}]}>
                                            <Text style={[styles.goalBadgeTextMod, {color: '#28A745'}]}>CONCLUÍDO ✅</Text>
                                        </View>
                                    )}
                                </View>
                                
                                <Text style={[styles.heroTitleMod, { color: theme.text }]} numberOfLines={2}>
                                    {activeProgram.name}
                                </Text>
                            </View>
                            
                            <View style={[styles.iconCircleMod, { borderColor: isTodayDone ? theme.accent : theme.border, backgroundColor: isTodayDone ? theme.accent : theme.bg }]}>
                                <MaterialCommunityIcons 
                                    name={isTodayDone ? "trophy" : "calendar-check"} 
                                    size={36} 
                                    color={isTodayDone ? (theme.isDark ? "#000" : "#FFF") : theme.textSecondary} 
                                />
                            </View>
                        </View>

                        {/* 🔥 CIRURGIA AQUI: flexShrink e gap ajustados para o botão caber */}
                        <View style={[styles.heroFooterMod, {borderTopColor: theme.border}]}>
                            <View style={styles.heroInfoItemMod}>
                                <Ionicons name="calendar" size={14} color={theme.accent} />
                                <Text style={[styles.heroInfoTextMod, { color: theme.textSecondary, fontWeight:'bold', fontSize: 10 }]}>
                                    Ver cronograma
                                </Text>
                            </View>
                            
                            <View style={[styles.startBtnMod, { backgroundColor: isTodayDone ? theme.border : theme.accent, elevation: isTodayDone ? 0 : 4 }]}>
                                <Text style={[styles.startBtnTextMod, { color: isTodayDone ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF') }]}>
                                    {isTodayDone ? 'REVISAR' : 'TREINAR'}
                                </Text>
                                <Ionicons name={isTodayDone ? "book-outline" : "play-forward"} size={14} color={isTodayDone ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF')} />
                            </View>
                        </View>
                    </TouchableOpacity>
                  </Shadow>
                </View>
            ) : (
                <View style={styles.sectionContainerMod}>
                    <View style={[styles.emptyCardMod, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="dumbbell-off" size={48} color={theme.border} />
                        <Text style={[styles.emptyCardTextMod, {color: theme.textSecondary}]}>Aguardando seu próximo programa.</Text>
                        <Text style={{color: theme.textSecondary, fontSize: 12}}>Entre em contato com o Coach Paulo.</Text>
                    </View>
                </View>
            )}

            <View style={styles.sectionContainerMod}>
                <Shadow {...shadowOpt} containerStyle={{width:'100%'}} style={{width:'100%'}}>
                    <View style={[styles.tipCardMod, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.tipHeaderRow}>
                            <Ionicons name="bulb-outline" size={24} color={theme.accent} />
                            <Text style={[styles.tipTitleLimpadoMod, { color: theme.accent }]}>DICA DO <Text style={{fontWeight: '900'}}>PAULO ADRIANO TEAM</Text></Text>
                        </View>
                        <Text style={[styles.tipTextLimpadoMod, { color: theme.text }]}>"{dailyTip}"</Text>
                    </View>
                </Shadow>
            </View>

          </ScrollView>
      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 0 },
  scrollArea: { flex: 1, width: '100%' },
  center: { flex: 1, justifyContent:'center', alignItems:'center' },
  
  headerLimpado: { padding: 20, paddingTop: 15, marginBottom: 10 },
  headerTitleLimpado: { fontSize: 28, fontWeight: '800' },

  sectionContainerMod: { marginHorizontal: 20, marginBottom: 30, alignItems: 'center' },
  sectionTitleMod: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 15, alignSelf: 'flex-start' },

  calendarCardMod: { width: '100%', padding: 20, borderRadius: 24, borderWidth: 1 },
  calendarHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15, alignSelf: 'center' },
  miniLabelMod: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  calendarRowMod: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  calendarDayItemMod: { alignItems: 'center', flex: 1 },
  calendarDayTextMod: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  calendarDotMod: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },

  readinessRowMod: { flexDirection: 'row', gap: 12, width: '100%' },
  energyCardMod: { flex: 1, borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1 },
  energyEmojiMod: { fontSize: 36, marginBottom: 10 },
  energyLabelMod: { fontSize: 12, fontWeight: 'bold' },

  heroCardMod: { width: '100%', borderRadius: 30, padding: 25, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  heroHeaderMod: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, zIndex: 2 },
  heroBadgeRowMod: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  goalBadgeMod: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  goalBadgeTextMod: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  heroTitleMod: { fontSize: 22, fontWeight: '900', lineHeight: 28 },
  iconCircleMod: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  
  // 🔥 CIRURGIA AQUI: Gap e flexShrink
  heroFooterMod: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, zIndex: 2, gap: 5 },
  heroInfoItemMod: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  heroInfoTextMod: { flexShrink: 1 },
  
  startBtnMod: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  startBtnTextMod: { fontWeight: '900', fontSize: 12 },
  
  emptyCardMod: { width:'100%', padding: 50, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  emptyCardTextMod: { fontWeight: 'bold', fontSize: 16, marginTop: 20, marginBottom: 8 },

  tipCardMod: { width: '100%', padding: 20, borderRadius: 24, borderWidth: 1 },
  tipHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  tipTitleLimpadoMod: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  tipTextLimpadoMod: { fontSize: 14, fontStyle: 'italic', lineHeight: 20, paddingLeft: 36 },

});