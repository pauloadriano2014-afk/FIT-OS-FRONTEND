import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, StatusBar, Modal, Alert, ActivityIndicator, RefreshControl 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; 
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- CONFIGURAÇÃO DA ESCALA ---
const USER_SCHEDULE = ['OFF', 'A', 'B', 'C', 'D', 'E', 'F']; 

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

const getWorkoutIcon = (dayLabel) => {
    switch (dayLabel) {
        case 'A': return { icon: 'arm-flex', label: 'SUPERIORES' }; 
        case 'B': return { icon: 'human-handsup', label: 'DORSAIS' }; 
        case 'C': return { icon: 'run', label: 'PERNAS' }; 
        case 'D': return { icon: 'weight-lifter', label: 'FORÇA' }; 
        case 'E': return { icon: 'flash', label: 'METABÓLICO' };
        case 'F': return { icon: 'timer', label: 'HIIT/CORE' };
        case 'OFF': return { icon: 'battery-charging', label: 'DESCANSO' };
        default: return { icon: 'dumbbell', label: 'GERAL' };
    }
};

export default function TrainingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeProgram, setActiveProgram] = useState(null);
  
  // ESTADO PARA SABER SE TREINOU HOJE
  const [isTodayDone, setIsTodayDone] = useState(false);

  const [energyLevel, setEnergyLevel] = useState(null);
  const [dailyTip, setDailyTip] = useState("");
  
  const [cardioModalOpen, setCardioModalOpen] = useState(false);
  const [selectedCardio, setSelectedCardio] = useState(CARDIO_OPTIONS[2]); 
  const [cardioPhoto, setCardioPhoto] = useState(null);
  const [rpe, setRpe] = useState(5); 
  const [cardioDone, setCardioDone] = useState(false);

  const fetchRoutines = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);

      // 1. BUSCA O TREINO ATIVO
      const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&t=${Date.now()}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data) && data.length > 0) {
        setActiveProgram(data[0]);
      } else {
        setActiveProgram(null);
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
      console.log("Erro fetchRoutines:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
    }, [])
  );

  useEffect(() => {
    setDailyTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRoutines();
  }, []);

  // 🔥 NOVA FUNÇÃO: GERENCIA O FEEDBACK AO CLICAR NA SENSAÇÃO
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
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const currentDayIndex = new Date().getDay(); 

  const todayLabel = USER_SCHEDULE[currentDayIndex];
  const todayIconData = getWorkoutIcon(todayLabel);

  if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator color="#CCFF00" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CCFF00"/>}
      >
        <View style={styles.header}>
            <Text style={styles.headerTitle}>PAINEL DO <Text style={{color:'#CCFF00'}}>ALUNO</Text></Text>
        </View>

        {/* 1. READINESS */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>COMO VOCÊ ESTÁ SE SENTINDO HOJE?</Text>
            <View style={styles.readinessRow}>
                {['low', 'medium', 'high'].map((level) => (
                    <TouchableOpacity 
                        key={level} 
                        style={[styles.energyBtn, energyLevel === level && styles[`energyBtn${level}`]]}
                        onPress={() => handleEnergySelect(level)} // 🔥 Chama a função com o alerta
                    >
                        <Text style={{fontSize:22}}>{level === 'low' ? '😫' : level === 'medium' ? '😐' : '😤'}</Text>
                        <Text style={styles.energyLabel}>{level === 'low' ? 'Cansado(a)' : level === 'medium' ? 'Disciplinado(a)' : 'Motivado(a)'}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* 2. TIMELINE SEMANAL INTELIGENTE */}
        <View style={styles.timelineBox}>
            <View style={styles.timelineLine} />
            <View style={styles.timelineRow}>
                {weekDays.map((d, i) => {
                    const isPast = i < currentDayIndex;
                    const isToday = i === currentDayIndex;
                    const dayType = USER_SCHEDULE[i];
                    const isOff = dayType === 'OFF';
                    const showCheck = (isPast && !isOff) || (isToday && isTodayDone);

                    return (
                        <View key={i} style={styles.dayCol}>
                            <View style={[
                                styles.dot, 
                                showCheck && styles.dotCheck, 
                                isPast && isOff && styles.dotRest, 
                                isToday && !isTodayDone && styles.dotToday 
                            ]}>
                                {showCheck && <MaterialCommunityIcons name="check" size={12} color="#000" />}
                                {isPast && isOff && <MaterialCommunityIcons name="bed" size={10} color="#666" />}
                            </View>
                            <Text style={[styles.dayText, isToday && {color:'#CCFF00'}]}>{d}</Text>
                        </View>
                    );
                })}
            </View>
        </View>

        {/* 3. HERO CARD (TREINO DO DIA) */}
        {activeProgram ? (
            <View style={[styles.heroCard, isTodayDone && {borderColor:'#CCFF00', backgroundColor:'#161810'}]}>
                <View style={styles.heroHeader}>
                    <View>
                        <Text style={styles.heroLabel}>
                            {todayLabel === 'OFF' ? 'RECUPERAÇÃO' : (isTodayDone ? 'MISSÃO CUMPRIDA' : 'TREINO SUGERIDO')}
                        </Text>
                        <Text style={styles.heroTitle}>
                            {todayLabel === 'OFF' ? 'DESCANSO' : `TREINO ${todayLabel}`}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {activeProgram.name} • {todayLabel === 'OFF' ? 'Regenerativo' : (activeProgram.goal || 'Geral')}
                        </Text>
                    </View>
                    
                    <TouchableOpacity onPress={() => navigation.navigate('RoutineDetails', { workoutId: activeProgram.id, workoutName: activeProgram.name })}>
                        <Text style={styles.viewCycleLink}>Ver Ciclo{'\n'}Completo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.anatomyBox}>
                    <View style={styles.anatomyInfo}>
                        <Text style={styles.focusTitle}>{isTodayDone ? "STATUS: CONCLUÍDO" : "STATUS DO DIA"}</Text>
                        <Text style={styles.focusDesc}>
                            {isTodayDone 
                                ? "Excelente trabalho! Descanse para amanhã." 
                                : todayLabel === 'OFF' 
                                    ? "Seu corpo cresce no descanso." 
                                    : "Foco total na execução e controle."
                            }
                        </Text>
                        
                        {todayLabel !== 'OFF' ? (
                            isTodayDone ? (
                                <View style={styles.doneBtn}>
                                    <MaterialCommunityIcons name="check-all" size={18} color="#000" />
                                    <Text style={styles.doneBtnText}>TREINO CONCLUÍDO</Text>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.startBtn} 
                                    onPress={() => navigation.navigate('RoutineDetails', { workoutId: activeProgram.id, workoutName: activeProgram.name })}
                                >
                                    <Text style={styles.startBtnText}>ACESSAR TREINO</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={16} color="#000" />
                                </TouchableOpacity>
                            )
                        ) : (
                            <View style={styles.restBadge}>
                                <Text style={styles.restText}>DESCANSO ATIVO</Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.iconContainerWrapper}>
                        <View style={[styles.iconCircle, todayLabel === 'OFF' && {borderColor:'#444', backgroundColor:'#111'}, isTodayDone && {backgroundColor:'#CCFF00'}]}>
                            <MaterialCommunityIcons 
                                name={isTodayDone ? "check-bold" : todayIconData.icon} 
                                size={40} 
                                color={todayLabel === 'OFF' ? "#666" : (isTodayDone ? "#000" : "#CCFF00")} 
                            />
                        </View>
                        <Text style={[styles.iconLabel, todayLabel==='OFF' && {color:'#666'}]}>{todayIconData.label}</Text>
                    </View>
                </View>
            </View>
        ) : (
            <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="dumbbell-off" size={40} color="#333" />
                <Text style={{color:'#666', marginTop:10}}>Nenhum programa ativo.</Text>
            </View>
        )}

        {/* 4. DICA */}
        <View style={styles.tipBox}>
            <View style={{flexDirection:'row', alignItems:'center', gap:8, marginBottom:5}}>
                <MaterialCommunityIcons name="comment-quote" size={18} color="#CCFF00" />
                <Text style={styles.tipTitle}>Dica do Paulo</Text>
            </View>
            <Text style={styles.tipText}>"{dailyTip}"</Text>
        </View>

        {/* 5. CARDIO */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>CARDIO & PERFORMANCE</Text>
            <View style={styles.cardioCard}>
                <TouchableOpacity style={styles.cardioHeader} onPress={() => setCardioModalOpen(true)}>
                    <View style={styles.cardioIcon}><MaterialCommunityIcons name={selectedCardio.icon} size={24} color="#000" /></View>
                    <View style={{flex:1}}>
                        <Text style={styles.cardioLabel}>PROTOCOLO</Text>
                        <Text style={styles.cardioValue}>{selectedCardio.name} <MaterialCommunityIcons name="chevron-down" size={14} color="#CCFF00"/></Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}><Text style={styles.metaLabel}>TEMPO</Text><Text style={styles.metaValue}>{meta.time}</Text></View>
                    <View style={styles.metaItem}><Text style={styles.metaLabel}>INTENSIDADE</Text><Text style={styles.metaValue}>{meta.intensity}</Text></View>
                    <View style={styles.metaItem}><Text style={styles.metaLabel}>KCAL</Text><Text style={styles.metaValue}>{meta.cals}</Text></View>
                </View>
                {!cardioDone ? (
                    <View style={styles.cardioActions}>
                        <TouchableOpacity style={[styles.cameraBtn, cardioPhoto && {borderColor:'#CCFF00', backgroundColor:'#1a2200'}]} onPress={handleCamera}>
                            <MaterialCommunityIcons name="camera" size={20} color={cardioPhoto ? "#CCFF00" : "#FFF"} />
                            <Text style={[styles.cameraText, cardioPhoto && {color:'#CCFF00'}]}>{cardioPhoto ? "FOTO ANEXADA" : "FOTO DO PAINEL"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.finishCardioBtn} onPress={submitCardio}><Text style={styles.finishCardioText}>CONCLUIR CARDIO</Text></TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.cardioDone}>
                        <MaterialCommunityIcons name="check-circle" size={40} color="#CCFF00" />
                        <Text style={styles.cardioDoneText}>CARDIO REGISTRADO</Text>
                        <TouchableOpacity onPress={() => setCardioDone(false)} style={{marginTop:10}}><Text style={{color:'#666', fontSize:10, textDecorationLine:'underline'}}>Refazer registro</Text></TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>

      {/* MODAL CARDIO */}
      <Modal visible={cardioModalOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCardioModalOpen(false)}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>ESCOLHA O EQUIPAMENTO</Text>
                {CARDIO_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt.id} style={styles.modalItem} onPress={()=>{setSelectedCardio(opt); setCardioModalOpen(false);}}>
                        <MaterialCommunityIcons name={opt.icon} size={24} color={selectedCardio.id===opt.id ? "#CCFF00" : "#FFF"} />
                        <Text style={[styles.modalItemText, selectedCardio.id===opt.id && {color:'#CCFF00'}]}>{opt.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' },
  header: { padding: 20, paddingTop: 40 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  sectionContainer: { marginHorizontal: 20, marginBottom: 25 },
  sectionTitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  readinessRow: { flexDirection: 'row', gap: 10 },
  energyBtn: { flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  energyBtnlow: { backgroundColor: '#331111', borderColor: '#FF3B30' },
  energyBtnmedium: { backgroundColor: '#112233', borderColor: '#32ADE6' },
  energyBtnhigh: { backgroundColor: '#1A2200', borderColor: '#CCFF00' },
  energyLabel: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginTop: 5 },

  timelineBox: { marginHorizontal: 20, height: 40, justifyContent: 'center', marginBottom: 25 },
  timelineLine: { position: 'absolute', top: 12, left: 10, right: 10, height: 2, backgroundColor: '#222' },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#111', borderWidth: 2, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  dotCheck: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' }, 
  dotRest: { backgroundColor: '#222', borderColor: '#333' }, 
  dotToday: { backgroundColor: '#000', borderColor: '#CCFF00', transform: [{scale: 1.2}] },
  dayText: { color: '#444', fontSize: 10, fontWeight: 'bold' },

  heroCard: { marginHorizontal: 20, backgroundColor: '#111', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#222', marginBottom: 20 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  heroLabel: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold' },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  heroSubtitle: { color: '#888', fontSize: 12 },
  viewCycleLink: { color: '#666', fontSize: 10, textAlign: 'right', textDecorationLine: 'underline' },
  anatomyBox: { flexDirection: 'row', gap: 15 },
  anatomyInfo: { flex: 1 },
  focusTitle: { color: '#FFF', fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  focusDesc: { color: '#666', fontSize: 10, marginBottom: 15 },
  
  startBtn: { backgroundColor: '#CCFF00', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  startBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },
  
  doneBtn: { backgroundColor: '#CCFF00', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', opacity: 0.8 },
  doneBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },

  restBadge: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#222', alignSelf: 'flex-start' },
  restText: { color: '#888', fontWeight: 'bold', fontSize: 12 },

  iconContainerWrapper: { width: 90, height: 110, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(204, 255, 0, 0.05)', borderWidth: 1, borderColor: '#CCFF00', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  iconLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  emptyCard: { marginHorizontal: 20, padding: 30, backgroundColor: '#111', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#222', marginBottom: 20 },
  tipBox: { marginHorizontal: 20, backgroundColor: '#1A1A1A', padding: 15, borderRadius: 12, marginBottom: 25, borderLeftWidth: 3, borderLeftColor: '#CCFF00' },
  tipTitle: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  tipText: { color: '#CCC', fontSize: 12, fontStyle: 'italic' },
  cardioCard: { backgroundColor: '#111', borderRadius: 15, borderWidth: 1, borderColor: '#222', marginBottom: 15, overflow: 'hidden' },
  cardioHeader: { flexDirection: 'row', padding: 15, alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  cardioIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#CCFF00', justifyContent: 'center', alignItems: 'center' },
  cardioLabel: { color: '#666', fontSize: 9, fontWeight: 'bold' },
  cardioValue: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { color: '#666', fontSize: 8, fontWeight: 'bold' },
  metaValue: { color: '#CCFF00', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  cardioActions: { padding: 15 },
  cameraBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#444', gap: 8, marginBottom: 10 },
  cameraText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  finishCardioBtn: { backgroundColor: '#CCFF00', padding: 15, borderRadius: 8, alignItems: 'center' },
  finishCardioText: { color: '#000', fontWeight: '900', fontSize: 12 },
  cardioDone: { padding: 30, alignItems: 'center', gap: 10 },
  cardioDoneText: { color: '#CCFF00', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1A1A1A', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { color: '#FFF', fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalItemText: { color: '#FFF', fontWeight: 'bold' }
});