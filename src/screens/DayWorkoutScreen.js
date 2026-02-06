import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Modal, StatusBar, Dimensions, TextInput, 
  KeyboardAvoidingView, Platform, ImageBackground, Image, AppState 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av'; 
import { ExerciseCard } from '../components/ExerciseCard'; 

import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

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

  // Referência para monitorar o estado do app (Background/Active)
  const appState = useRef(AppState.currentState);

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
  const [sessionStats, setSessionStats] = useState({ xp: 0, time: '0m', count: 0, volume: 0 });
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
  'DROPSET': { 
    id: 'DROPSET', 
    title: 'DROP-SET (SÉRIE DESCENDENTE)', 
    color: '#FF3B30', 
    icon: 'arrow-down-bold', 
    desc: 'O objetivo aqui é o estresse metabólico máximo. \n\nCOMO FAZER: Realize o exercício até a falha técnica. Sem descansar, reduza a carga em 20-30% e continue até falhar novamente. \n\nPOR QUE: Isso recruta fibras musculares que sobraram da série principal e aumenta o pump, sinalizando mais hipertrofia.' 
  },
  'RESTPAUSE': { 
    id: 'RESTPAUSE', 
    title: 'REST-PAUSE (PAUSA-DESCANSO)', 
    color: '#FF9500', 
    icon: 'timer-sand', 
    desc: 'Técnica para alta intensidade com cargas pesadas. \n\nCOMO FAZER: Vá até a falha. Descanse exatamente 15 a 20 segundos (apenas 3-5 respirações fundas) e volte a fazer o máximo de reps que conseguir com a mesma carga. \n\nPOR QUE: Permite que você realize mais repetições totais com uma carga que normalmente você falharia cedo.' 
  },
  'BISET': { 
    id: 'BISET', 
    title: 'BI-SET (SÉRIE COMPOSTA)', 
    color: '#CCFF00', 
    icon: 'link-variant', 
    desc: 'Eficiência e densidade de treino. \n\nCOMO FAZER: Execute os dois exercícios marcados em sequência, sem nenhum descanso entre eles. Só descanse após terminar o segundo. \n\nPOR QUE: Aumenta o gasto calórico e mantém a musculatura sob tensão por mais tempo, otimizando seu tempo na academia.' 
  },
  '21': { 
    id: '21', 
    title: 'MÉTODO 21 (EXAUSTÃO PARCIAL)', 
    color: '#32ADE6', 
    icon: 'numeric-7-box-multiple-outline', 
    desc: 'Foco total em tempo sob tensão. \n\nCOMO FAZER: 7 reps apenas na metade inferior do movimento, 7 reps apenas na metade superior e, por fim, 7 reps completas. \n\nPOR QUE: Explora diferentes pontos de força da musculatura e gera um acúmulo severo de lactato, essencial para o crescimento.' 
  },
  'CLUSTERSET': { 
    id: 'CLUSTERSET', 
    title: 'CLUSTER SET', 
    color: '#BF5AF2', 
    icon: 'chart-bar', 
    desc: 'Quebrando a barreira da força. \n\nCOMO FAZER: Em vez de uma série direta, faça pequenos blocos de 2-4 reps com descansos de 10-15s entre eles até completar o total. \n\nPOR QUE: Mantém a velocidade da execução e a qualidade técnica lá no alto, mesmo usando cargas próximas do seu limite máximo.' 
  },
  'GVT': { 
    id: 'GVT', 
    title: 'GVT (GERMAN VOLUME TRAINING)', 
    color: '#00FF7F', 
    icon: 'numeric-10-box-multiple', 
    desc: 'O clássico de 10x10. \n\nCOMO FAZER: 10 séries de 10 repetições com a mesma carga e descanso rigoroso de 60s. \n\nPOR QUE: Hipertrofia por volume acumulado. O corpo é forçado a se adaptar a uma carga de trabalho massiva em um único músculo.' 
  },
  'NORMAL': { 
    id: 'NORMAL', 
    title: 'EXECUÇÃO PADRÃO', 
    color: '#333333', 
    icon: 'dumbbell', 
    desc: 'Foco na cadência e controle. \n\nCOMO FAZER: Realize as séries e repetições prescritas com foco total na fase excêntrica (descida) do movimento. \n\nPOR QUE: Construção de base sólida e consciência corporal.' 
  }
};

  useFocusEffect( useCallback(() => { fetchWorkoutData(); }, []) );

  // 🔥 1. SINCRONIZAÇÃO INICIAL E RESTAURAÇÃO
  useEffect(() => {
    const syncTimer = async () => {
        const savedStart = await AsyncStorage.getItem(`@workout_start_${workoutId}`);
        if (savedStart) {
          const now = Date.now();
          const diff = Math.floor((now - parseInt(savedStart)) / 1000);
          setElapsedSeconds(diff > 0 ? diff : 0); 
          setIsTimerRunning(true); 
        }
      };
      syncTimer();
  }, [workoutId]);

  // 🔥 2. DETECTOR DE BACKGROUND (SOLUÇÃO DO CONGELAMENTO)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      // Se o app voltar para Ativo (Active) e o treino estiver rodando
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const savedStart = await AsyncStorage.getItem(`@workout_start_${workoutId}`);
        if (savedStart) {
            const now = Date.now();
            const diff = Math.floor((now - parseInt(savedStart)) / 1000);
            console.log("App voltou do background! Atualizando tempo para:", diff);
            setElapsedSeconds(diff > 0 ? diff : 0);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [workoutId]);

  // 🔥 3. O RELÓGIO (TICK TACK)
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) { 
        interval = setInterval(() => { 
            setElapsedSeconds(prev => prev + 1); 
        }, 1000); 
    } 
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // 🔥 AUTO-SAVE: Salva o progresso localmente
  useEffect(() => {
    const saveProgress = async () => {
        if (Object.keys(lastWeights).length > 0) {
            const key = `draft_workout_${workoutId}_${day}`;
            await AsyncStorage.setItem(key, JSON.stringify(lastWeights));
        }
    };
    const timer = setTimeout(saveProgress, 500); 
    return () => clearTimeout(timer);
  }, [lastWeights, workoutId, day]);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);
      setUserData(user);

      const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&workoutId=${workoutId}&t=${Date.now()}`);
      const data = await response.json();
      
      if (response.ok && data && data.exercises) {
        const filteredExercises = data.exercises.filter(item => item.day === day);
        setExercisesToShow(filteredExercises);
        if (data.lastWeights) setHistoryWeights(data.lastWeights);

        const draftKey = `draft_workout_${workoutId}_${day}`;
        const draft = await AsyncStorage.getItem(draftKey);
        
        if (draft) {
            const parsedDraft = JSON.parse(draft);
            setLastWeights(parsedDraft);
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
        let totalVolume = 0; 
        
        exercisesToShow.forEach(ex => {
            const userInputs = lastWeights[ex.id]; 
            if (userInputs) {
                const setsData = [];
                Object.keys(userInputs).forEach(setKey => {
                    const val = userInputs[setKey];
                    if (val !== undefined && val !== null && val !== '') {
                        const cleanIndex = parseInt(setKey); 
                        const weightVal = parseFloat(val) || 0;
                        const repsVal = ex.reps || 10;
                        
                        totalVolume += (weightVal * repsVal);

                        setsData.push({ 
                            index: isNaN(cleanIndex) ? 1 : cleanIndex, 
                            weight: val, 
                            reps: repsVal
                        });
                    }
                });
                if (setsData.length > 0) exercisesDone.push({ exerciseId: ex.exerciseId, name: ex.exercise?.name || ex.name, sets: setsData });
            }
        });

        const finalWorkoutName = workoutName || FOCUS_NAMES[day] || `Treino ${day}`;
        const durationInMinutes = Math.ceil(elapsedSeconds / 60);

        const res = await fetch('https://fitos-final.onrender.com/api/workout/finish', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                userId: userData.id, 
                workoutId: workoutId, 
                day: day, 
                workoutName: finalWorkoutName.toUpperCase(), 
                exercisesData: exercisesDone, 
                duration: durationInMinutes, 
                rpe: rpe, 
                feedback: feedbackText 
            })
        });

        const json = await res.json();

        if (res.ok) {
            // 🔥 1. PARA O CRONÔMETRO
            setIsTimerRunning(false); 
            await AsyncStorage.setItem('@last_completed_day', day.toUpperCase());
            setElapsedSeconds(0);
            
            // 🔥 2. LIMPA TUDO DO DISCO (Rascunho e Tempo de Início)
            await AsyncStorage.removeItem(`draft_workout_${workoutId}_${day}`);
            await AsyncStorage.removeItem(`@workout_start_${workoutId}`);

            if (json.newTotalXP) {
                const updatedUser = { ...userData, currentXP: json.newTotalXP };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
            const rpeObj = RPE_OPTIONS.find(o => o.val === rpe);
            const statsParaOModal = { 
                xp: json.xpGained || 150, 
                time: `${durationInMinutes}m`, 
                count: exercisesDone.length,
                rpeLabel: rpeObj ? rpeObj.label : "CONCLUÍDO",
                focus: workoutName || FOCUS_NAMES[day] || "GERAL"
            };

            setSessionStats(statsParaOModal);
            setFinishModalVisible(false);
            setShareModalVisible(true);
        } else { 
            Alert.alert("Erro", "Falha ao salvar no servidor."); 
        }
    } catch (e) { 
        Alert.alert("Erro", "Falha de conexão. Tente novamente."); 
    } finally { 
        setLoading(false); 
    }
  };

  // 🔥 FUNÇÃO DE INÍCIO COM TIMESTAMP
  const handleStartTimer = async () => {
    const startTime = Date.now().toString();
    await AsyncStorage.setItem(`@workout_start_${workoutId}`, startTime);
    setIsTimerRunning(true);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#CCFF00" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.header}>
            {!isTimerRunning ? (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
            ) : (
                <View style={styles.activeWorkoutBadge}>
                     <MaterialCommunityIcons name="fire" size={16} color="#000" />
                     <Text style={styles.activeWorkoutText}>EM TREINO</Text>
                </View>
            )}

            <View style={{flex:1, alignItems: 'center'}}>
                <Text style={styles.headerLabel}>{workoutName?.toUpperCase()}</Text>
                <Text style={styles.headerTitle}>TREINO {day}</Text>
            </View>
            
            <View style={{width: 40}} />
          </View>

          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.timerContainer}>
                {!isTimerRunning && elapsedSeconds === 0 ? (
                    <TouchableOpacity style={styles.startBtn} onPress={handleStartTimer}><MaterialCommunityIcons name="play" size={30} color="#000" /><Text style={styles.startBtnText}>INICIAR TREINO</Text></TouchableOpacity>
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

      <Modal 
        visible={techModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setTechModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent, 
            { borderColor: selectedTech ? TECH_GUIDE[selectedTech]?.color : '#444', maxHeight: '80%' }
          ]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15}}>
                 <MaterialCommunityIcons 
                   name={selectedTech ? TECH_GUIDE[selectedTech]?.icon : 'dumbbell'} 
                   size={28} 
                   color={selectedTech ? TECH_GUIDE[selectedTech]?.color : '#FFF'} 
                 />
                 <Text style={[styles.modalTitle, { color: selectedTech ? TECH_GUIDE[selectedTech]?.color : '#FFF', marginBottom: 0, flex: 1, flexWrap: 'wrap' }]}>
                   {selectedTech ? TECH_GUIDE[selectedTech]?.title : ''}
                 </Text>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={[styles.modalExplanation, { color: '#EEE', fontSize: 14, lineHeight: 22 }]}>
                {selectedTech ? TECH_GUIDE[selectedTech]?.desc : ''}
              </Text>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.finishConfirmBtn, { backgroundColor: selectedTech ? TECH_GUIDE[selectedTech]?.color : '#CCFF00' }]} 
              onPress={() => setTechModalVisible(false)}
            >
              <Text style={[styles.finishConfirmText, { color: '#000' }]}>ENTENDI, BORA MOER!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
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
                <View style={styles.shareHeader}>
                    <Text style={styles.shareBrand}>COACH PAULO TEAM</Text>
                    <Text style={styles.shareDate}>{new Date().toLocaleDateString('pt-BR')}</Text>
                </View>
                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
                    <View style={styles.shareCardVisual}>
                        <Image source={require('../../assets/icon.png')} style={{width: 80, height: 80, marginBottom: 15}} resizeMode="contain" />
                        <Text style={styles.shareTitle}>TREINO{'\n'}CONCLUÍDO</Text>
                        <Text style={styles.shareSubtitle}>{(workoutName || FOCUS_NAMES[day])?.toUpperCase()} • DIA {day}</Text>
                        
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>+{sessionStats.xp}</Text>
                                <Text style={styles.statLabel}>XP GANHO</Text>
                            </View>
                            <View style={[styles.statBox, {borderLeftWidth:1, borderRightWidth:1, borderColor:'#222'}]}>
                                <Text style={styles.statValue}>{sessionStats.time}</Text>
                                <Text style={styles.statLabel}>TEMPO</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { fontSize: 13, color: '#CCFF00' }]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.5}>
                                    {sessionStats.rpeLabel || 'MÁXIMO'}
                                </Text>
                                <Text style={styles.statLabel}>ESFORÇO</Text>
                            </View>
                        </View>
                    </View>
                </ViewShot>
                <View style={styles.shareFooter}>
                    <TouchableOpacity style={styles.shareBtnReal} onPress={handleShareCard}>
                        <MaterialCommunityIcons name="instagram" size={24} color="#000" />
                        <Text style={styles.shareBtnText}>COMPARTILHAR NO INSTA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeShareBtn} onPress={() => { setShareModalVisible(false); navigation.navigate('Main'); }}>
                        <Text style={styles.closeShareText}>FECHAR E SAIR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
      </Modal>

      <Modal visible={calcModalVisible} transparent animationType="slide"><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}><View style={styles.modalContent}><View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:15, alignItems:'center'}}><Text style={styles.modalTitle}>ESTIMATIVA DE CARGA (1RM)</Text><TouchableOpacity onPress={()=>setCalcModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color="#FFF"/></TouchableOpacity></View><Text style={{color:'#888', marginBottom:20, fontSize:13}}>Insira um peso e repetições que você já fez para descobrir a carga ideal.</Text><View style={{flexDirection:'row', gap:15, marginBottom:20}}><View style={{flex:1}}><Text style={styles.label}>CARGA JÁ FEITA (KG)</Text><TextInput style={styles.inputCalc} keyboardType="numeric" value={calcWeight} onChangeText={setCalcWeight} placeholder="Ex: 50" placeholderTextColor="#333"/></View><View style={{flex:1}}><Text style={styles.label}>REPS FEITAS</Text><TextInput style={styles.inputCalc} keyboardType="numeric" value={calcReps} onChangeText={setCalcReps} placeholder="Ex: 10" placeholderTextColor="#333"/></View></View>{oneRM > 0 && <View style={styles.resultBox}><Text style={styles.rmLabel}>{oneRM} KG <Text style={{fontSize:12, color:'#666'}}>MÁXIMO TEÓRICO</Text></Text><View style={{width:'100%', gap:12, marginTop:10}}><View style={styles.resRow}><Text style={styles.pLabel}>Para Hipertrofia (8-12 reps)</Text><Text style={styles.pValue}>{Math.round(oneRM*0.75)} kg</Text></View><View style={styles.resRow}><Text style={styles.pLabel}>Para Força (1-5 reps)</Text><Text style={styles.pValue}>{Math.round(oneRM*0.90)} kg</Text></View></View></View>}</View></KeyboardAvoidingView></Modal>
      
      <Modal 
        visible={videoModalVisible} 
        animationType="fade" 
        transparent
        onRequestClose={() => {
            setVideoModalVisible(false);
            setCurrentVideoUrl(null);
        }}
      >
        <View style={styles.videoOverlayModern}>
            <TouchableOpacity 
                style={styles.closeVideoBtnModern} 
                onPress={() => {
                    setVideoModalVisible(false);
                    setCurrentVideoUrl(null);
                }}
            >
                <MaterialCommunityIcons name="close" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.videoWrapperModern}>
                {videoModalVisible && currentVideoUrl ? (
                    <>
                        {videoLoading && <ActivityIndicator color="#CCFF00" size="large" style={styles.videoAbsoluteLoader} />}
                        <Video 
                            ref={videoRef} 
                            style={styles.videoPlayerModern} 
                            source={{ uri: currentVideoUrl }} 
                            useNativeControls 
                            resizeMode={ResizeMode.CONTAIN} 
                            shouldPlay 
                            isLooping 
                            onLoadStart={() => setVideoLoading(true)}
                            onLoad={() => setVideoLoading(false)} 
                            onError={(e) => {
                                setVideoLoading(false);
                                Alert.alert("Aviso", "Não foi possível carregar o vídeo. Verifique sua conexão.");
                            }}
                        />
                    </>
                ) : null}
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0, 
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10, justifyContent:'space-between' },
  backBtn: { padding: 8, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  activeWorkoutBadge: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#CCFF00', paddingVertical:5, paddingHorizontal:10, borderRadius:8 },
  activeWorkoutText: { color: '#000', fontWeight: 'bold', fontSize: 10 },
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
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#111', 
    padding: 25, 
    borderRadius: 25, 
    borderColor: '#222', 
    borderWidth: 1, 
    maxHeight: '80%', 
    width: '100%' 
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color:'#FFF', marginBottom: 5, letterSpacing: 1 },
  modalExplanation: { color:'#EEE', fontSize:14, marginBottom:15, lineHeight: 22 },
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
  
  videoOverlayModern: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  videoWrapperModern: { width: '100%', height: '80%', backgroundColor: '#000', overflow: 'hidden' }, 
  videoPlayerModern: { width: '100%', height: '100%' },
  videoAbsoluteLoader: { position: 'absolute', top: '45%', left: '45%', zIndex: 10 },
  closeVideoBtnModern: { position: 'absolute', top: 50, right: 20, zIndex: 99, backgroundColor: '#CCFF00', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.8, shadowRadius: 2, elevation: 5 },

  shareContainer: { flex: 1, width: '100%', height: '100%' },
  shareOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 30 },
  shareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shareBrand: { color: '#CCFF00', fontWeight: '900', fontSize: 20, fontStyle: 'italic', letterSpacing: 1 },
  shareDate: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  shareCardVisual: { backgroundColor: '#111', padding: 25, borderRadius: 30, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#333', shadowColor: '#CCFF00', shadowOpacity: 0.2, shadowRadius: 20 },
  shareTitle: { color: '#FFF', fontSize: 42, fontWeight: '900', textAlign: 'center', lineHeight: 42, marginBottom: 10 },
  shareSubtitle: { color: '#AAA', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 40 },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', backgroundColor: '#000', paddingVertical: 20, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginTop: 20 },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  statValue: { color: '#FFF', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  statLabel: { color: '#666', fontSize: 8, fontWeight: 'bold', marginTop: 5, textTransform: 'uppercase' },
  shareFooter: { alignItems: 'center', gap: 15 },
  shareBtnReal: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center', gap: 10 },
  shareBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },
  closeShareBtn: { padding: 10 },
  closeShareText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
});