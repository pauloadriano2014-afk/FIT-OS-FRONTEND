import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Modal, StatusBar, Dimensions, TextInput, 
  KeyboardAvoidingView, Platform, ImageBackground 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av'; 
import { ExerciseCard } from '../components/ExerciseCard'; 

import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const FOCUS_NAMES = {
    'A': 'Superiores', 'B': 'Costas & Bíceps', 'C': 'Pernas Completo',
    'D': 'Ombros & Trapézio', 'E': 'Braços', 'F': 'Fullbody'
};

const calculate1RM = (weight, reps) => {
    if(!weight || !reps) return 0;
    return Math.round(weight * (1 + reps / 30));
};

const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function DayWorkoutScreen({ route, navigation }) {
  const { workoutId, day, workoutName } = route.params;

  const [loading, setLoading] = useState(true);
  const [exercisesToShow, setExercisesToShow] = useState([]);
  const [userData, setUserData] = useState(null);
  
  const [lastWeights, setLastWeights] = useState({});
  const [historyWeights, setHistoryWeights] = useState({});

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [techModalVisible, setTechModalVisible] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const videoRef = useRef(null);

  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const oneRM = calculate1RM(parseFloat(calcWeight), parseFloat(calcReps));

  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [sessionStats, setSessionStats] = useState({ xp: 0, time: '0m', count: 0 });
  const [rpe, setRpe] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const viewShotRef = useRef();

  const RPE_OPTIONS = [
      { val: 10, label: 'FALHA TOTAL', desc: 'Não subia mais nada', color: '#BF5AF2' },
      { val: 9,  label: 'MUITO INTENSO', desc: 'Sobrou 1 repetição', color: '#FF3B30' },
      { val: 8,  label: 'DIFÍCIL', desc: 'Sobraram 2 repetições', color: '#FF9500' },
      { val: 6,  label: 'MODERADO', desc: 'Sobraram 3 a 4 repetições', color: '#FFCC00' },
      { val: 4,  label: 'LEVE', desc: 'Aquecimento', color: '#32ADE6' },
  ];

  const TECH_GUIDE = {
    'DROPSET': { id: 'DROPSET', title: 'DROP-SET', color: '#FF3B30', icon: 'arrow-down-bold', desc: 'Realize até a falha, reduza carga e repita.' },
    'RESTPAUSE': { id: 'RESTPAUSE', title: 'REST-PAUSE', color: '#FF9500', icon: 'timer-sand', desc: 'Falhe, descanse 20s, falhe de novo.' },
    'BISET': { id: 'BISET', title: 'BI-SET', color: '#CCFF00', icon: 'link-variant', desc: 'Execute dois exercícios diferentes em sequência.' },
    '21': { id: '21', title: 'MÉTODO 21', color: '#32ADE6', icon: 'numeric-7-box-multiple-outline', desc: '7 baixas, 7 altas, 7 completas.' },
    'CLUSTERSET': { id: 'CLUSTERSET', title: 'CLUSTER SET', color: '#BF5AF2', icon: 'chart-bar', desc: 'Blocos de reps com descanso curto.' },
    'GVT': { id: 'GVT', title: 'GVT', color: '#00FF7F', icon: 'numeric-10-box-multiple', desc: '10 séries de 10 repetições.' },
    'NORMAL': { id: 'NORMAL', title: 'SÉRIE NORMAL', color: '#333333', icon: 'dumbbell', desc: 'Execução padrão.' }
  };

  useFocusEffect( useCallback(() => { fetchWorkoutData(); }, []) );

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) { interval = setInterval(() => { setElapsedSeconds(prev => prev + 1); }, 1000); } 
    else { clearInterval(interval); }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // 🔥 AUTO-SAVE: Salva o progresso localmente sempre que lastWeights muda
  useEffect(() => {
    const saveProgress = async () => {
        if (Object.keys(lastWeights).length > 0) {
            const key = `draft_workout_${workoutId}_${day}`;
            await AsyncStorage.setItem(key, JSON.stringify(lastWeights));
        }
    };
    const timer = setTimeout(saveProgress, 500); // Debounce de 500ms
    return () => clearTimeout(timer);
  }, [lastWeights, workoutId, day]);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);
      setUserData(user);

      // 1. Busca dados do servidor
      const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&workoutId=${workoutId}&t=${Date.now()}`);
      const data = await response.json();
      
      if (response.ok && data && data.exercises) {
        const filteredExercises = data.exercises.filter(item => item.day === day);
        setExercisesToShow(filteredExercises);
        if (data.lastWeights) setHistoryWeights(data.lastWeights);

        // 2. 🔥 RECUPERAÇÃO DE RASCUNHO (AUTO-SAVE)
        // Se o aluno saiu e voltou (YouTube Music crash), recuperamos aqui
        const draftKey = `draft_workout_${workoutId}_${day}`;
        const draft = await AsyncStorage.getItem(draftKey);
        
        if (draft) {
            const parsedDraft = JSON.parse(draft);
            setLastWeights(parsedDraft);
            console.log("Rascunho recuperado com sucesso!");
            // Opcional: Avisar o usuário
            // Alert.alert("Bem-vindo de volta", "Seu progresso foi restaurado.");
        }
      }
    } catch (error) { console.log("Erro fetch:", error); } 
    finally { setLoading(false); }
  };

  const handleOpenVideo = (url) => {
    if (url && url.length > 5) { setCurrentVideoUrl(url); setVideoModalVisible(true); setVideoLoading(true); } 
    else { Alert.alert("Indisponível", "Sem vídeo cadastrado."); }
  };

  const handleSaveWeight = async (itemId, weight, setIndex) => {
    const newWeights = { ...lastWeights, [itemId]: { ...(lastWeights[itemId] || {}), [setIndex]: weight } };
    setLastWeights(newWeights);
  };

  const handleSwap = (index) => {
      const list = [...exercisesToShow];
      const current = list[index];
      if (!current.substitute) return; 
      Alert.alert("Trocar Exercício", `Trocar ${current.exercise?.name} por ${current.substitute.name}?`, [
          { text: "Cancelar", style: "cancel" },
          { text: "Trocar", onPress: () => {
              const newMain = { ...current, exerciseId: current.substitute.id, exercise: current.substitute, substitute: { id: current.exerciseId, name: current.exercise?.name, videoUrl: current.exercise?.videoUrl } };
              list[index] = newMain; setExercisesToShow(list);
          }}
      ]);
  };

  const handleShareCard = async () => {
      try { if (!(await Sharing.isAvailableAsync())) return; const uri = await viewShotRef.current.capture(); await Sharing.shareAsync(uri); } catch (e) { Alert.alert("Erro", "Erro ao gerar imagem."); }
  };

  const validateAndFinish = () => {
      if (!isTimerRunning && elapsedSeconds === 0) {
          Alert.alert("Atenção", "Para registrar cargas, clique primeiro em INICIAR TREINO.");
          return;
      }

      let missingData = false;
      let firstMissingName = "";

      exercisesToShow.forEach(ex => {
          const category = (ex.exercise?.category || "").toLowerCase();
          if (category.includes('mobilidade') || category.includes('alongamento') || category.includes('cardio')) return;

          const inputs = lastWeights[ex.id] || {};
          const requiredSets = ex.sets || 3;

          for (let i = 1; i <= requiredSets; i++) {
              const keys = Object.keys(inputs);
              const hasData = keys.some(k => String(k) === String(i) || String(k).startsWith(`${i}_`));

              if (!hasData) {
                  const directVal = inputs[i];
                  if (directVal === undefined || directVal === null || String(directVal).trim() === '') {
                      missingData = true;
                      if (!firstMissingName) firstMissingName = ex.exercise?.name || ex.name;
                  }
              }
          }
      });

      if (missingData) {
          Alert.alert("Cargas Incompletas", `Você não registrou todas as cargas para: "${firstMissingName}".\n\nDeseja revisar ou finalizar assim mesmo?`, [
              { text: "Vou Revisar", style: "cancel" },
              { text: "Finalizar", style: "destructive", onPress: () => proceedToFinish() }
          ]);
      } else { proceedToFinish(); }
  };

  const proceedToFinish = () => { setIsTimerRunning(false); setFinishModalVisible(true); };

  const submitFinish = async () => {
    if (!rpe) { Alert.alert("Atenção", "Selecione o RPE."); return; }
    try {
        setLoading(true);
        const exercisesDone = [];
        
        exercisesToShow.forEach(ex => {
            const userInputs = lastWeights[ex.id]; 
            if (userInputs) {
                const setsData = [];
                Object.keys(userInputs).forEach(setKey => {
                    const val = userInputs[setKey];
                    if (val !== undefined && val !== null && val !== '') {
                        const cleanIndex = parseInt(setKey); 
                        setsData.push({ 
                            index: isNaN(cleanIndex) ? 1 : cleanIndex, 
                            weight: val, 
                            reps: ex.reps 
                        });
                    }
                });
                if (setsData.length > 0) exercisesDone.push({ exerciseId: ex.exerciseId, name: ex.exercise?.name || ex.name, sets: setsData });
            }
        });

        const finalWorkoutName = FOCUS_NAMES[day] || `Treino ${day}`;
        const durationInMinutes = Math.ceil(elapsedSeconds / 60);

        const res = await fetch('https://fitos-final.onrender.com/api/workout/finish', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: userData.id, workoutId: workoutId, day: day, workoutName: finalWorkoutName.toUpperCase(), exercisesData: exercisesDone, duration: durationInMinutes, rpe: rpe, feedback: feedbackText })
        });
        const json = await res.json();
        if (res.ok) {
            setFinishModalVisible(false);
            
            // 🔥 LIMPA O RASCUNHO AO FINALIZAR COM SUCESSO
            const draftKey = `draft_workout_${workoutId}_${day}`;
            await AsyncStorage.removeItem(draftKey);

            if (json.newTotalXP) {
                const updatedUser = { ...userData, currentXP: json.newTotalXP };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
            setSessionStats({ xp: json.xpGained || 150, time: `${durationInMinutes}m`, count: exercisesDone.length });
            setShareModalVisible(true);
        } else { Alert.alert("Erro", "Falha ao salvar. Tente novamente."); }
    } catch (e) { Alert.alert("Erro", "Falha de conexão."); } 
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#CCFF00" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" /></TouchableOpacity>
            <View style={{flex:1, alignItems: 'center'}}><Text style={styles.headerLabel}>{workoutName?.toUpperCase()}</Text><Text style={styles.headerTitle}>TREINO {day}</Text></View><View style={{width: 40}} />
          </View>

          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.timerContainer}>
                {!isTimerRunning && elapsedSeconds === 0 ? (
                    <TouchableOpacity style={styles.startBtn} onPress={() => setIsTimerRunning(true)}><MaterialCommunityIcons name="play" size={30} color="#000" /><Text style={styles.startBtnText}>INICIAR TREINO</Text></TouchableOpacity>
                ) : (
                    <View style={[styles.timerDisplay, {borderColor: '#CCFF00'}]}><Text style={styles.timerLabel}>TEMPO DECORRIDO</Text><Text style={styles.timerValue}>{formatTime(elapsedSeconds)}</Text></View>
                )}
            </View>

            {exercisesToShow.map((item, index) => {
                let safeTechnique = item.technique || 'NORMAL';
                if (!TECH_GUIDE[safeTechnique]) safeTechnique = 'NORMAL';
                let biSetType = null;
                if (safeTechnique === 'BISET') {
                    const next = exercisesToShow[index+1]; const prev = exercisesToShow[index-1];
                    if (next && next.technique === 'BISET') biSetType = 'start';
                    else if (prev && prev.technique === 'BISET') biSetType = 'end';
                }
                return (
                  <ExerciseCard 
                    key={item.id} item={{ ...item, technique: safeTechnique }} totalSets={item.sets}
                    lastWeights={lastWeights} historyWeights={historyWeights} handleSaveWeight={handleSaveWeight}
                    handleOpenVideo={() => handleOpenVideo(item.exercise?.videoUrl)} 
                    setModalVisible={() => { try { navigation.navigate('ScannerIA', { exName: item.exercise?.name }); } catch (e) {} }} 
                    onOpenCalc={() => setCalcModalVisible(true)}
                    TECH_GUIDE={TECH_GUIDE} setTechModalVisible={setTechModalVisible} setSelectedTech={setSelectedTech}
                    biSetType={biSetType} isLastExercise={index === exercisesToShow.length - 1} 
                    onSwap={item.substitute ? () => handleSwap(index) : null}
                    isTimerRunning={isTimerRunning}
                  />
                );
            })}

            <TouchableOpacity style={styles.finishBtn} onPress={validateAndFinish}><Text style={styles.finishBtnText}>FINALIZAR TREINO</Text><MaterialCommunityIcons name="check-all" size={24} color="#000" /></TouchableOpacity>
            <View style={{height: 100}} />
          </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={techModalVisible} transparent animationType="fade" onRequestClose={() => setTechModalVisible(false)}><View style={styles.modalOverlay}><View style={[styles.modalContent, { borderColor: selectedTech ? TECH_GUIDE[selectedTech]?.color : '#444' }]}><Text style={[styles.modalTitle, { color: selectedTech ? TECH_GUIDE[selectedTech]?.color : '#FFF' }]}>{selectedTech ? TECH_GUIDE[selectedTech]?.title : ''}</Text><View style={styles.divider} /><Text style={styles.modalExplanation}>{selectedTech ? TECH_GUIDE[selectedTech]?.desc : ''}</Text><TouchableOpacity style={styles.finishConfirmBtn} onPress={() => setTechModalVisible(false)}><Text style={styles.finishConfirmText}>ENTENDI</Text></TouchableOpacity></View></View></Modal>
      
      <Modal visible={finishModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalTitle}>FIM DE TREINO</Text>
                    <Text style={styles.feedbackLabel}>INTENSIDADE (RPE)</Text>
                    <View style={{marginBottom: 20}}>{RPE_OPTIONS.map((opt) => (<TouchableOpacity key={opt.val} style={[styles.rpeRow, rpe === opt.val && {borderColor: opt.color, backgroundColor: 'rgba(255,255,255,0.05)'}]} onPress={() => setRpe(opt.val)}><View style={[styles.rpeCircle, {backgroundColor: rpe === opt.val ? opt.color : '#222'}]}>{rpe === opt.val && <MaterialCommunityIcons name="check" size={14} color="#000" />}</View><View style={{flex:1}}><Text style={[styles.rpeTitle, {color: rpe === opt.val ? opt.color : '#CCC'}]}>{opt.label}</Text><Text style={styles.rpeDesc}>{opt.desc}</Text></View></TouchableOpacity>))}</View>
                    <Text style={styles.feedbackLabel}>OBSERVAÇÕES (OPCIONAL)</Text><TextInput style={styles.feedbackInput} multiline placeholder="Anotações..." placeholderTextColor="#555" value={feedbackText} onChangeText={setFeedbackText} />
                    <TouchableOpacity style={styles.finishConfirmBtn} onPress={submitFinish}><Text style={styles.finishConfirmText}>SALVAR E GERAR CARD</Text></TouchableOpacity>
                    <TouchableOpacity style={{marginTop:15, marginBottom:20}} onPress={() => { setFinishModalVisible(false); setIsTimerRunning(true); }}><Text style={{color:'#666', textAlign:'center', fontWeight:'bold'}}>CANCELAR (VOLTAR)</Text></TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={shareModalVisible} animationType="fade" transparent={false}>
        <ImageBackground source={{uri: 'https://img.freepik.com/free-photo/dark-gym-background_23-2150330606.jpg'}} style={styles.shareContainer} blurRadius={10}>
            <View style={styles.shareOverlay}>
                <View style={styles.shareHeader}><Text style={styles.shareBrand}>PA TEAM</Text><Text style={styles.shareDate}>{new Date().toLocaleDateString('pt-BR')}</Text></View>
                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
                    <View style={styles.shareCardVisual}><MaterialCommunityIcons name="check-decagram" size={80} color="#CCFF00" style={{marginBottom:10}} /><Text style={styles.shareTitle}>TREINO{'\n'}CONCLUÍDO</Text><Text style={styles.shareSubtitle}>{FOCUS_NAMES[day] || workoutName} • DIA {day}</Text>
                        <View style={styles.statsRow}><View style={styles.statBox}><Text style={styles.statValue}>+{sessionStats.xp}</Text><Text style={styles.statLabel}>XP</Text></View><View style={[styles.statBox, {borderLeftWidth:1, borderRightWidth:1, borderColor:'#333'}]}><Text style={styles.statValue}>{sessionStats.time}</Text><Text style={styles.statLabel}>TEMPO</Text></View><View style={styles.statBox}><Text style={styles.statValue}>{sessionStats.count}</Text><Text style={styles.statLabel}>EXERCÍCIOS</Text></View></View>
                    </View>
                </ViewShot>
                <View style={styles.shareFooter}><TouchableOpacity style={styles.shareBtnReal} onPress={handleShareCard}><MaterialCommunityIcons name="instagram" size={24} color="#000" /><Text style={styles.shareBtnText}>COMPARTILHAR NO INSTA</Text></TouchableOpacity><TouchableOpacity style={styles.closeShareBtn} onPress={() => { setShareModalVisible(false); navigation.navigate('Main'); }}><Text style={styles.closeShareText}>FECHAR E SAIR</Text></TouchableOpacity></View>
            </View>
        </ImageBackground>
      </Modal>

      <Modal visible={calcModalVisible} transparent animationType="slide"><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}><View style={styles.modalContent}><View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:15, alignItems:'center'}}><Text style={styles.modalTitle}>ESTIMATIVA DE CARGA (1RM)</Text><TouchableOpacity onPress={()=>setCalcModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color="#FFF"/></TouchableOpacity></View><Text style={{color:'#888', marginBottom:20, fontSize:13}}>Insira um peso e repetições que você já fez para descobrir a carga ideal.</Text><View style={{flexDirection:'row', gap:15, marginBottom:20}}><View style={{flex:1}}><Text style={styles.label}>CARGA JÁ FEITA (KG)</Text><TextInput style={styles.inputCalc} keyboardType="numeric" value={calcWeight} onChangeText={setCalcWeight} placeholder="Ex: 50" placeholderTextColor="#333"/></View><View style={{flex:1}}><Text style={styles.label}>REPS FEITAS</Text><TextInput style={styles.inputCalc} keyboardType="numeric" value={calcReps} onChangeText={setCalcReps} placeholder="Ex: 10" placeholderTextColor="#333"/></View></View>{oneRM > 0 && <View style={styles.resultBox}><Text style={styles.rmLabel}>{oneRM} KG <Text style={{fontSize:12, color:'#666'}}>MÁXIMO TEÓRICO</Text></Text><View style={{width:'100%', gap:12, marginTop:10}}><View style={styles.resRow}><Text style={styles.pLabel}>Para Hipertrofia (8-12 reps)</Text><Text style={styles.pValue}>{Math.round(oneRM*0.75)} kg</Text></View><View style={styles.resRow}><Text style={styles.pLabel}>Para Força (1-5 reps)</Text><Text style={styles.pValue}>{Math.round(oneRM*0.90)} kg</Text></View></View></View>}</View></KeyboardAvoidingView></Modal>
      <Modal visible={videoModalVisible} animationType="slide" transparent><View style={styles.videoOverlay}><SafeAreaView style={{flex:1}}><View style={styles.videoHeader}><Text style={styles.videoHeaderTitle}>VÍDEO TÉCNICO</Text><TouchableOpacity onPress={()=>setVideoModalVisible(false)}><MaterialCommunityIcons name="close" size={28} color="#FFF"/></TouchableOpacity></View><View style={styles.playerContainer}>{videoLoading && <ActivityIndicator color="#CCFF00" size="large" style={styles.videoAbsoluteLoader} />}<Video ref={videoRef} style={styles.videoPlayer} source={{ uri: currentVideoUrl }} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay isLooping onLoad={()=>setVideoLoading(false)} onError={()=>{setVideoLoading(false);Alert.alert("Erro","Vídeo indisponível");setVideoModalVisible(false)}}/></View></SafeAreaView></View></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10, justifyContent:'space-between' },
  backBtn: { padding: 8, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  headerLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  listContent: { paddingHorizontal: 20 },
  timerContainer: { marginBottom: 20, marginTop: 10 },
  startBtn: { backgroundColor: '#CCFF00', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 16, gap: 10, elevation: 5 },
  startBtnText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  timerDisplay: { backgroundColor: '#111', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#CCFF00', alignItems: 'center', justifyContent: 'center' },
  timerLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 },
  timerValue: { color: '#FFF', fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] },
  finishBtn: { backgroundColor: '#CCFF00', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 20, gap: 10 },
  finishBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderColor: '#222', borderWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '900', color:'#FFF', marginBottom: 5, letterSpacing: 1 },
  modalExplanation: { color:'#888', fontSize:12, marginBottom:15, lineHeight: 20 },
  label: { color:'#666', fontSize:10, fontWeight:'bold', marginBottom:8 },
  inputCalc: { backgroundColor: '#000', color: '#FFF', fontSize: 16, fontWeight: 'bold', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', textAlign: 'center' },
  resultBox: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#CCFF00' },
  rmLabel: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#333', width: '100%', marginBottom: 10 },
  resRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  pLabel: { color:'#AAA', fontSize:12 },
  pValue: { color: '#CCFF00', fontSize: 14, fontWeight: 'bold' },
  feedbackLabel: { color: '#888', fontSize:10, fontWeight:'bold', marginBottom:10, marginTop:10 },
  rpeRow: { flexDirection: 'row', alignItems:'center', padding: 12, borderRadius: 10, backgroundColor: '#080808', marginBottom: 6, borderWidth: 1, borderColor: '#222' },
  rpeCircle: { width: 20, height: 20, borderRadius: 10, marginRight: 15, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#333' },
  rpeTitle: { fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  rpeDesc: { color: '#555', fontSize: 10 },
  feedbackInput: { backgroundColor: '#050505', color: '#FFF', padding: 15, borderRadius: 10, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#222' },
  finishConfirmBtn: { backgroundColor: '#CCFF00', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  finishConfirmText: { color: '#000', fontWeight: '900', fontSize: 14 },
  videoOverlay: { flex: 1, backgroundColor: '#000' },
  videoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40 },
  videoHeaderTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  playerContainer: { flex: 1, justifyContent: 'center' },
  videoPlayer: { width: width, height: width * 1.77 },
  videoAbsoluteLoader: { position: 'absolute', zIndex: 1 },
  shareContainer: { flex: 1, width: '100%', height: '100%' },
  shareOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 30 },
  shareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shareBrand: { color: '#CCFF00', fontWeight: '900', fontSize: 20, fontStyle: 'italic', letterSpacing: 1 },
  shareDate: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  shareCardVisual: { backgroundColor: '#111', padding: 20, borderRadius: 20, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#333' },
  shareTitle: { color: '#FFF', fontSize: 42, fontWeight: '900', textAlign: 'center', lineHeight: 42, marginBottom: 10 },
  shareSubtitle: { color: '#AAA', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 40 },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', backgroundColor: '#000', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  shareFooter: { alignItems: 'center', gap: 15 },
  shareHint: { color: '#CCFF00', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  shareBtnReal: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center', gap: 10 },
  shareBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },
  closeShareBtn: { padding: 10 },
  closeShareText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
});