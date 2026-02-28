import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, StatusBar, Modal, Alert, ActivityIndicator, RefreshControl, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; 
import { useFocusEffect } from '@react-navigation/native';

/* 🔥 IMPORTAÇÃO DO TEMA */
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const TIPS = [
    "A consistência vence a intensidade no longo prazo.",
    "Controle a descida (excêntrica). É lá que o músculo cresce.",
    "Hidratação é anabólica. Bebeu água hoje?",
    "Não pule o aquecimento. Sua longevidade agradece.",
    "O descanso faz parte do treino. Durma bem."
];

const CARDIO_OPTIONS = [
    { id: 'bike', name: 'Bike Ergométrica', icon: 'bike' },
    { id: 'stairs', name: 'Escada', icon: 'stairs' }, 
    { id: 'treadmill_incline', name: 'Esteira Inclinada', icon: 'slope-uphill' },
    { id: 'run_treadmill', name: 'Corrida (Esteira)', icon: 'run-fast' },
    { id: 'run_park', name: 'Corrida (Rua)', icon: 'run' },
    { id: 'elliptical', name: 'Elíptico', icon: 'shoe-sneaker' },
];

export default function TrainingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // DADOS DO TREINO
  const [activeProgram, setActiveProgram] = useState(null);
  const [workoutTabs, setWorkoutTabs] = useState([]); // Array com os nomes customizados
  const [selectedTab, setSelectedTab] = useState(null); // Aba atualmente selecionada
  
  const { theme } = useTheme();
  
  // ESTADO PARA SABER SE TREINOU HOJE
  const [isTodayDone, setIsTodayDone] = useState(false);

  const [energyLevel, setEnergyLevel] = useState(null);
  const [dailyTip, setDailyTip] = useState("");
  
  const [cardioModalOpen, setCardioModalOpen] = useState(false);
  const [selectedCardio, setSelectedCardio] = useState(CARDIO_OPTIONS[2]); 
  const [cardioPhoto, setCardioPhoto] = useState(null);
  const [cardioDone, setCardioDone] = useState(false);

  const fetchWorkouts = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);

      // 1. BUSCA O TREINO ATIVO
      const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&t=${Date.now()}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data) && data.length > 0) {
        const program = data[0];
        setActiveProgram(program);
        
        // 🔥 LÓGICA DINÂMICA: EXTRAI AS ABAS/DIAS DOS EXERCÍCIOS
        if (program.exercises && program.exercises.length > 0) {
            const tabs = [...new Set(program.exercises.map(ex => ex.day))];
            setWorkoutTabs(tabs);
            if (tabs.length > 0 && !selectedTab) {
                // Inicia na primeira aba ou tenta adivinhar o dia (mais complexo, por enquanto foca na primeira)
                setSelectedTab(tabs[0]);
            }
        }
      } else {
        setActiveProgram(null);
        setWorkoutTabs([]);
      }

      // 2. BUSCA O HISTÓRICO PARA VERIFICAR O CHECK DE HOJE
      const historyRes = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${user.id}&t=${Date.now()}`);
      const historyData = await historyRes.json();

      if (Array.isArray(historyData)) {
          const todayStr = new Date().toDateString(); 
          const foundToday = historyData.some(log => new Date(log.date).toDateString() === todayStr);
          setIsTodayDone(foundToday);
      }

    } catch (error) {
      console.log("Erro fetchWorkouts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  useEffect(() => {
    setDailyTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkouts(); 
  }, []);

  const handleEnergySelect = (level) => {
      setEnergyLevel(level);

      let title = "";
      let msg = "";

      if (level === 'low') {
           title = "Dia de Cautela 🛡️";
           msg = "Seu corpo está pedindo recuperação. Reduza as cargas em 20% hoje e foque totalmente na técnica. O importante é manter o hábito sem se machucar.";
      } else if (level === 'medium') {
           title = "Disciplina é Tudo ⚔️";
           msg = "Excelente. Nem sempre estamos motivados, mas a disciplina gera resultados. Siga o plano à risca hoje.";
      } else {
           title = "Modo Besta Ativado 🔥";
           msg = "Aproveite essa energia extra! Hoje é um bom dia para tentar aumentar a carga ou melhorar a execução naqueles exercícios difíceis.";
      }

      Alert.alert(title, msg);
  };

  const handleCamera = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.granted === false) {
          Alert.alert("Permissão", "É necessário acesso à câmera para validar o cardio.");
          return;
      }
      const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.5,
      });
      if (!result.canceled) {
          setCardioPhoto(result.assets[0].uri);
      }
  };

  const submitCardio = () => {
      if (!cardioPhoto) {
          Alert.alert("Sem foto?", "O PA TEAM exige a foto. Enviar mesmo assim?", [
              { text: "Voltar", style: "cancel" },
              { text: "Enviar", onPress: () => finalizeCardio(), style: "destructive" }
          ]);
      } else {
          finalizeCardio();
      }
  };

  const finalizeCardio = () => {
      setCardioDone(true);
      setCardioModalOpen(false);
      Alert.alert("Sucesso", "Cardio registrado!");
  };

  const getCardioMeta = () => {
      const isEmagrecimento = activeProgram?.goal?.toLowerCase().includes('emagrecimento');
      const baseTime = isEmagrecimento ? 45 : 20;
      let intensity = "Moderada";
      if (selectedCardio.id === 'stairs') intensity = "Passada contínua";
      if (selectedCardio.id.includes('run')) intensity = "Trote (Zona 2)";
      return { time: `${baseTime} min`, intensity, cals: isEmagrecimento ? '400+' : '200' };
  };

  const meta = getCardioMeta();

  if (loading && !refreshing) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator color={theme.accent} /></View>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent}/>}
        bounces={false}
        overScrollMode="never"
      >
        <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>PAINEL DO <Text style={{color: theme.accent}}>ALUNO</Text></Text>
        </View>

        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>COMO VOCÊ ESTÁ SE SENTINDO HOJE?</Text>
            <View style={styles.readinessRow}>
                {['low', 'medium', 'high'].map((level) => (
                    <TouchableOpacity 
                        key={level} 
                        style={[
                            styles.energyBtn, 
                            { backgroundColor: theme.surface, borderColor: theme.border },
                            energyLevel === level && level === 'low' && { borderColor: '#FF3B30', backgroundColor: theme.isDark ? '#331111' : '#FFE5E5' },
                            energyLevel === level && level === 'medium' && { borderColor: '#32ADE6', backgroundColor: theme.isDark ? '#112233' : '#E5F6FF' },
                            energyLevel === level && level === 'high' && { borderColor: theme.accent, backgroundColor: theme.isDark ? '#1A2200' : theme.accent + '22' }
                        ]}
                        onPress={() => handleEnergySelect(level)} 
                    >
                        <Text style={{fontSize:22}}>{level === 'low' ? '😫' : level === 'medium' ? '😐' : '😤'}</Text>
                        <Text style={[styles.energyLabel, { color: theme.text }]}>{level === 'low' ? 'Cansado(a)' : level === 'medium' ? 'Disciplinado' : 'Motivado(a)'}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* 🔥 NOVA BARRA DE ROLAGEM DE DIAS/TREINOS */}
        {workoutTabs.length > 0 && (
            <View style={{ marginBottom: 20 }}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                >
                    {workoutTabs.map(tab => (
                        <TouchableOpacity 
                            key={tab} 
                            style={[
                                styles.pillTab, 
                                { backgroundColor: theme.surface, borderColor: theme.border },
                                selectedTab === tab && { backgroundColor: theme.accent, borderColor: theme.accent }
                            ]}
                            onPress={() => setSelectedTab(tab)}
                        >
                            <Text style={[
                                styles.pillTabText, 
                                { color: theme.textSecondary },
                                selectedTab === tab && { color: theme.isDark ? '#000' : '#FFF' }
                            ]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        )}

        {activeProgram ? (
            <View style={[
                styles.heroCard, 
                { backgroundColor: theme.surface, borderColor: theme.border }, 
                isTodayDone && {borderColor: theme.accent, backgroundColor: theme.isDark ? '#161810' : theme.bg}
            ]}>
                <View style={styles.heroHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.heroLabel, { color: theme.accent }]}>
                            {isTodayDone ? 'MISSÃO CUMPRIDA' : 'PROGRAMAÇÃO DE HOJE'}
                        </Text>
                        <Text style={[styles.heroTitle, { color: theme.text }]} numberOfLines={1}>
                            {selectedTab ? selectedTab.toUpperCase() : "TREINO"}
                        </Text>
                        <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                            {activeProgram.name} • {activeProgram.goal || 'Geral'}
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.viewCycleBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} 
                        onPress={() => navigation.navigate('RoutineDetails', { workoutId: activeProgram.id, workoutName: activeProgram.name, initialTab: selectedTab })}
                    >
                        <Text style={[styles.viewCycleText, { color: theme.accent }]}>VER DETALHES</Text>
                        <MaterialCommunityIcons name="eye-outline" size={14} color={theme.accent} />
                    </TouchableOpacity>
                </View>

                <View style={styles.anatomyBox}>
                    <View style={styles.anatomyInfo}>
                        <Text style={[styles.focusTitle, { color: theme.text }]}>{isTodayDone ? "STATUS: CONCLUÍDO" : "STATUS DO DIA"}</Text>
                        <Text style={[styles.focusDesc, { color: theme.textSecondary }]}>
                            {isTodayDone 
                                ? "Excelente trabalho! Descanse para amanhã." 
                                : "Foco total na execução e controle. Bom treino!"
                            }
                        </Text>
                        
                        {isTodayDone ? (
                            <View style={[styles.doneBtn, { backgroundColor: theme.accent }]}>
                                <MaterialCommunityIcons name="check-all" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                                <Text style={[styles.doneBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>TREINO CONCLUÍDO</Text>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.startBtn, { backgroundColor: theme.accent }]} 
                                onPress={() => navigation.navigate('RoutineDetails', { workoutId: activeProgram.id, workoutName: activeProgram.name, initialTab: selectedTab })}
                            >
                                <Text style={[styles.startBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>INICIAR TREINO</Text>
                                <MaterialCommunityIcons name="arrow-right" size={16} color={theme.isDark ? '#000' : '#FFF'} />
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <View style={styles.iconContainerWrapper}>
                        <View style={[
                            styles.iconCircle, 
                            { borderColor: theme.accent, backgroundColor: theme.accent + '11' },
                            isTodayDone && {backgroundColor: theme.accent}
                        ]}>
                            <MaterialCommunityIcons 
                                name={isTodayDone ? "check-bold" : "dumbbell"} 
                                size={40} 
                                color={isTodayDone ? (theme.isDark ? "#000" : "#FFF") : theme.accent} 
                            />
                        </View>
                    </View>
                </View>
            </View>
        ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="dumbbell-off" size={40} color={theme.textSecondary} />
                <Text style={{color: theme.textSecondary, marginTop:10}}>Nenhum programa ativo.</Text>
            </View>
        )}

        <View style={[styles.tipBox, { backgroundColor: theme.surface, borderLeftColor: theme.accent }]}>
            <View style={{flexDirection:'row', alignItems:'center', gap:8, marginBottom:5}}>
                <MaterialCommunityIcons name="comment-quote" size={18} color={theme.accent} />
                <Text style={[styles.tipTitle, { color: theme.text }]}>Dica do Paulo</Text>
            </View>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>"{dailyTip}"</Text>
        </View>

        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CARDIO & PERFORMANCE</Text>
            <View style={[styles.cardioCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TouchableOpacity style={[styles.cardioHeader, { borderBottomColor: theme.border }]} onPress={() => setCardioModalOpen(true)}>
                    <View style={[styles.cardioIcon, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name={selectedCardio.icon} size={24} color={theme.isDark ? '#000' : '#FFF'} /></View>
                    <View style={{flex:1}}>
                        <Text style={[styles.cardioLabel, { color: theme.textSecondary }]}>PROTOCOLO</Text>
                        <Text style={[styles.cardioValue, { color: theme.text }]}>{selectedCardio.name} <MaterialCommunityIcons name="chevron-down" size={14} color={theme.accent}/></Text>
                    </View>
                </TouchableOpacity>
                <View style={[styles.metaRow, { borderBottomColor: theme.border }]}>
                    <View style={styles.metaItem}><Text style={[styles.metaLabel, { color: theme.textSecondary }]}>TEMPO</Text><Text style={[styles.metaValue, { color: theme.accent }]}>{meta.time}</Text></View>
                    <View style={styles.metaItem}><Text style={[styles.metaLabel, { color: theme.textSecondary }]}>INTENSIDADE</Text><Text style={[styles.metaValue, { color: theme.accent }]}>{meta.intensity}</Text></View>
                    <View style={styles.metaItem}><Text style={[styles.metaLabel, { color: theme.textSecondary }]}>KCAL</Text><Text style={[styles.metaValue, { color: theme.accent }]}>{meta.cals}</Text></View>
                </View>
                {!cardioDone ? (
                    <View style={styles.cardioActions}>
                        <TouchableOpacity style={[styles.cameraBtn, { borderColor: theme.border }, cardioPhoto && {borderColor: theme.accent, backgroundColor: theme.isDark ? '#1a2200' : theme.bg}]} onPress={handleCamera}>
                            <MaterialCommunityIcons name="camera" size={20} color={cardioPhoto ? theme.accent : theme.text} />
                            <Text style={[styles.cameraText, { color: theme.text }, cardioPhoto && {color: theme.accent}]}>{cardioPhoto ? "FOTO ANEXADA" : "FOTO DO PAINEL"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.finishCardioBtn, { backgroundColor: theme.accent }]} onPress={submitCardio}><Text style={[styles.finishCardioText, { color: theme.isDark ? '#000' : '#FFF' }]}>CONCLUIR CARDIO</Text></TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.cardioDone}>
                        <MaterialCommunityIcons name="check-circle" size={40} color={theme.accent} />
                        <Text style={[styles.cardioDoneText, { color: theme.accent }]}>CARDIO REGISTRADO</Text>
                        <TouchableOpacity onPress={() => setCardioDone(false)} style={{marginTop:10}}><Text style={{color: theme.textSecondary, fontSize:10, textDecorationLine:'underline'}}>Refazer registro</Text></TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>

      {/* MODAL CARDIO */}
      <Modal visible={cardioModalOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCardioModalOpen(false)}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>ESCOLHA O EQUIPAMENTO</Text>
                {CARDIO_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt.id} style={[styles.modalItem, { borderBottomColor: theme.border }]} onPress={()=>{setSelectedCardio(opt); setCardioModalOpen(false);}}>
                        <MaterialCommunityIcons name={opt.icon} size={24} color={selectedCardio.id===opt.id ? theme.accent : theme.text} />
                        <Text style={[styles.modalItemText, { color: theme.text }, selectedCardio.id===opt.id && {color: theme.accent}]}>{opt.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  center: { flex: 1, justifyContent:'center', alignItems:'center' },
  header: { padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  sectionContainer: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  readinessRow: { flexDirection: 'row', gap: 10 },
  energyBtn: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1 },
  energyLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },

  // 🔥 ESTILO DAS PÍLULAS DE TREINO
  pillTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  pillTabText: { fontSize: 12, fontWeight: '800' },

  heroCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 20 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  heroLabel: { fontSize: 10, fontWeight: 'bold' },
  heroTitle: { fontSize: 22, fontWeight: '900', marginTop: 2, marginBottom: 2 },
  heroSubtitle: { fontSize: 11 },
  
  viewCycleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, gap: 6, alignSelf: 'flex-start' },
  viewCycleText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  
  anatomyBox: { flexDirection: 'row', gap: 15 },
  anatomyInfo: { flex: 1 },
  focusTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  focusDesc: { fontSize: 10, marginBottom: 15 },
  
  startBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  startBtnText: { fontWeight: '900', fontSize: 12 },
  
  doneBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', opacity: 0.8 },
  doneBtnText: { fontWeight: '900', fontSize: 12 },

  iconContainerWrapper: { width: 80, height: 100, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  
  emptyCard: { marginHorizontal: 20, padding: 30, borderRadius: 16, alignItems: 'center', borderWidth: 1, marginBottom: 20 },
  tipBox: { marginHorizontal: 20, padding: 15, borderRadius: 12, marginBottom: 25, borderLeftWidth: 3 },
  tipTitle: { fontSize: 12, fontWeight: 'bold' },
  tipText: { fontSize: 12, fontStyle: 'italic' },
  
  cardioCard: { borderRadius: 15, borderWidth: 1, marginBottom: 15, overflow: 'hidden' },
  cardioHeader: { flexDirection: 'row', padding: 15, alignItems: 'center', gap: 10, borderBottomWidth: 1 },
  cardioIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  cardioLabel: { fontSize: 9, fontWeight: 'bold' },
  cardioValue: { fontSize: 14, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1 },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 8, fontWeight: 'bold' },
  metaValue: { fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  cardioActions: { padding: 15 },
  cameraBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 8, marginBottom: 10 },
  cameraText: { fontSize: 11, fontWeight: 'bold' },
  finishCardioBtn: { padding: 15, borderRadius: 8, alignItems: 'center' },
  finishCardioText: { fontWeight: '900', fontSize: 12 },
  cardioDone: { padding: 30, alignItems: 'center', gap: 10 },
  cardioDoneText: { fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 15, borderBottomWidth: 1 },
  modalItemText: { fontWeight: 'bold' }
});