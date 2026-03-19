// src/screens/DayWorkoutScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Modal, StatusBar, TextInput, 
  KeyboardAvoidingView, Platform, AppState, StyleSheet, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode, Audio } from 'expo-av'; 

import { ExerciseCard } from '../components/ExerciseCard';
import { formatTime, calculate1RM } from '../utils/workoutUtils'; 

import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function DayWorkoutScreen({ route, navigation }) {
  const params = route?.params || {};
  const workoutId = params.workoutId || '';
  const day = params.day || 'A';
  const workoutName = params.workoutName || 'Treino';

  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [exercisesToShow, setExercisesToShow] = useState([]);
  const [userData, setUserData] = useState(null);
  const [lastWeights, setLastWeights] = useState({});
  const [historyWeights, setHistoryWeights] = useState({});

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const appState = useRef(AppState.currentState);
  const typingTimer = useRef(null);

  const [techModalVisible, setTechModalVisible] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  
  // 🔥 ESTADO DA VOZ GLOBAL
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Sistema de Voz do Coach para Aulas
  const [isPlayingTechVoice, setIsPlayingTechVoice] = useState(false);
  const [voiceSound, setVoiceSound] = useState(null);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const videoRef = useRef(null);

  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const oneRM = calculate1RM(parseFloat(calcWeight), parseFloat(calcReps));

  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [rpe, setRpe] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  // 🔥 DETECTOR DE IPHONE (WEB)
  const isIOSWeb = Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

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
        title: 'DROP-SET', 
        color: '#FF3B30', 
        icon: 'arrow-down-bold', 
        audio: require('../../assets/audio/exp_dropset.m4a'),
        desc: 'COMO EXECUTAR:\nFaça as repetições até a falha muscular. Imediatamente reduza a carga (cerca de 20 a 30%) e continue o exercício até falhar novamente, sem nenhum descanso.\n\nPOR QUE FAZER:\nAumenta o estresse metabólico e recruta fibras musculares mais profundas que não foram fadigadas inicialmente. Excelente para hipertrofia e "pump" máximo.' 
    },
    'RESTPAUSE': { 
        id: 'RESTPAUSE', 
        title: 'REST-PAUSE', 
        color: '#FF9500', 
        icon: 'timer-sand',
        audio: require('../../assets/audio/exp_restpause.m4a'), 
        desc: 'COMO EXECUTAR:\nRealize a série até a falha. Descanse apenas 10 a 15 segundos e volte a fazer o exercício com a MESMA carga até falhar de novo.\n\nPOR QUE FAZER:\nPermite realizar mais repetições totais com uma carga alta (tensão mecânica extrema), gerando um forte estímulo de hipertrofia na metade do tempo.' 
    },
    'BISET': { 
        id: 'BISET', 
        title: 'BI-SET', 
        color: theme.accent, 
        icon: 'link-variant', 
        audio: require('../../assets/audio/exp_biset.m4a'),
        desc: 'COMO EXECUTAR:\nRealize o primeiro exercício e, sem nenhum descanso, passe imediatamente para a execução do segundo exercício acoplado.\n\nPOR QUE FAZER:\nAumenta a densidade do treino, eleva a frequência cardíaca e gera um estresse absurdo na musculatura alvo, otimizando seu tempo na academia.' 
    },
    '21': { 
        id: '21', 
        title: 'MÉTODO 21', 
        color: '#32ADE6', 
        icon: 'numeric-7-box-multiple-outline', 
        audio: require('../../assets/audio/exp_21.m4a'),
        desc: 'COMO EXECUTAR:\nDivida o movimento em 3 partes. Faça 7 repetições só na metade inferior do movimento, 7 na metade superior e 7 repetições completas. Totalizando 21 reps.\n\nPOR QUE FAZER:\nAumenta drasticamente o tempo sob tensão e o fluxo sanguíneo no local. É uma ótima ferramenta para quebrar platôs de estagnação.' 
    },
    'CLUSTERSET': { 
        id: 'CLUSTERSET', 
        title: 'CLUSTER SET', 
        color: '#BF5AF2', 
        icon: 'chart-bar', 
        audio: require('../../assets/audio/exp_cluster.m4a'),
        desc: 'COMO EXECUTAR:\nDivida uma série pesada em pequenos blocos. (Ex: em vez de tentar 10 diretas, faça 3 reps, descanse 15s, faça mais 3 reps... até bater a meta).\n\nPOR QUE FAZER:\nPermite levantar mais carga total do que você aguentaria numa série contínua normal. Foca em força pura e hipertrofia miofibrilar sem perder a técnica.' 
    },
    'GVT': { 
        id: 'GVT', 
        title: 'GVT (10x10)', 
        color: '#00FF7F', 
        icon: 'numeric-10-box-multiple', 
        audio: require('../../assets/audio/exp_gvt.m4a'),
        desc: 'COMO EXECUTAR:\nRealize 10 séries de 10 repetições com a mesma carga (cerca de 60% da sua força máxima) e descanso cravado de 60 segundos entre as séries.\n\nPOR QUE FAZER:\nÉ um choque brutal no corpo. O volume de treino extremo força o seu músculo a hipertrofiar para "sobreviver" ao estresse imposto.' 
    },
    'NORMAL': { 
        id: 'NORMAL', 
        title: 'EXECUÇÃO PADRÃO', 
        color: theme.textSecondary, 
        icon: 'dumbbell', 
        desc: 'COMO EXECUTAR:\nSiga o número de séries e repetições estipulados, focando em manter a postura correta.\n\nPOR QUE FAZER:\nÉ a base da construção de força e hipertrofia. O foco aqui é na cadência (velocidade do movimento) e na progressão de carga treino a treino.' 
    }
  };

  useFocusEffect( useCallback(() => { fetchWorkoutData(); }, []) );

  useEffect(() => {
    const loadVoicePref = async () => {
        try {
            const pref = await AsyncStorage.getItem('@voice_coach_enabled');
            if (pref !== null) {
                setIsVoiceEnabled(pref === 'true');
            }
        } catch (e) {}
    };
    loadVoicePref();
  }, []);

  const toggleVoice = async () => {
      try {
          const newVal = !isVoiceEnabled;
          setIsVoiceEnabled(newVal);
          await AsyncStorage.setItem('@voice_coach_enabled', String(newVal));
      } catch (e) {}
  };

  useEffect(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
          if (!isTimerRunning) {
              return; 
          }
          
          e.preventDefault(); 
          
          if (Platform.OS === 'web') {
              if (window.confirm("⚠️ TREINO EM ANDAMENTO!\nVocê está com o cronômetro do treino rodando. Tem certeza que deseja sair? O tempo e os dados parciais poderão ser perdidos.")) {
                  navigation.dispatch(e.data.action);
              }
          } else {
              Alert.alert(
                  '⚠️ TREINO EM ANDAMENTO!',
                  'Você está com o cronômetro rodando. Tem certeza que deseja sair e interromper o treino?',
                  [
                      { text: "FICAR NO TREINO", style: 'cancel', onPress: () => {} },
                      {
                          text: 'SAIR MESMO ASSIM',
                          style: 'destructive',
                          onPress: () => navigation.dispatch(e.data.action),
                      },
                  ]
              );
          }
      });
      return unsubscribe;
  }, [navigation, isTimerRunning]);

  useEffect(() => {
    const syncTimer = async () => {
        const savedStart = await AsyncStorage.getItem(`@workout_start_${workoutId}_${day}`);
        if (savedStart) {
          const now = Date.now();
          const diff = Math.floor((now - parseInt(savedStart)) / 1000);
          setElapsedSeconds(diff > 0 ? diff : 0); 
          setIsTimerRunning(true); 
        }
      };
      syncTimer();
  }, [workoutId, day]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const savedStart = await AsyncStorage.getItem(`@workout_start_${workoutId}_${day}`);
        if (savedStart) {
            const now = Date.now();
            const diff = Math.floor((now - parseInt(savedStart)) / 1000);
            setElapsedSeconds(diff > 0 ? diff : 0);
        }
      }
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [workoutId, day]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) { interval = setInterval(() => { setElapsedSeconds(prev => prev + 1); }, 1000); } 
    return () => clearInterval(interval);
  }, [isTimerRunning]);

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

  const handlePlayTechVoice = async (techKey) => {
      try {
          if (voiceSound) {
              await voiceSound.unloadAsync();
              setVoiceSound(null);
          }
          if (isPlayingTechVoice) {
              setIsPlayingTechVoice(false);
              return;
          }
          const audioRes = TECH_GUIDE[techKey]?.audio;
          if (audioRes) {
              setIsPlayingTechVoice(true);
              const { sound } = await Audio.Sound.createAsync(audioRes);
              setVoiceSound(sound);
              sound.setOnPlaybackStatusUpdate((status) => {
                  if (status.didJustFinish) setIsPlayingTechVoice(false);
              });
              await sound.playAsync();
          }
      } catch (e) {
          console.log('Erro ao tocar aula:', e);
          setIsPlayingTechVoice(false);
      }
  };

  const closeTechModal = () => {
      if (voiceSound) {
          voiceSound.unloadAsync();
          setVoiceSound(null);
      }
      setIsPlayingTechVoice(false);
      setTechModalVisible(false);
  };

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      if (!workoutId) { setLoading(false); return; }
      
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);
      setUserData(user);

      const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&workoutId=${workoutId}&t=${Date.now()}`);
      const data = await response.json();
      
      if (response.ok && data && data.exercises) {
        
        const filteredExercises = data.exercises
            .filter(item => item.day === day)
            .map(item => {
                let realBlocks = item.blocks;
                let realTech = item.technique;
                let realObs = item.observation;

                try {
                    if (item.technique && typeof item.technique === 'string' && item.technique.trim().startsWith('{')) {
                        const parsed = JSON.parse(item.technique);
                        if (parsed && parsed.b) {
                            realBlocks = parsed.b;
                            realTech = parsed.t;
                            realObs = parsed.o || realObs;
                        }
                    }
                } catch(e) {}

                if (!realBlocks || !Array.isArray(realBlocks) || realBlocks.length === 0) {
                    realBlocks = [{ sets: String(item.sets || '3'), reps: String(item.reps || '12'), restTime: String(item.restTime || '60'), technique: realTech || '' }];
                }

                return { ...item, blocks: realBlocks, technique: realTech, observation: realObs };
            });

        setExercisesToShow(filteredExercises);
        if (data.lastWeights) setHistoryWeights(data.lastWeights);

        const draftKey = `draft_workout_${workoutId}_${day}`;
        const draft = await AsyncStorage.getItem(draftKey);
        if (draft) { setLastWeights(JSON.parse(draft)); }
      }
    } catch (error) { 
    } finally { setLoading(false); }
  };

  const handleOpenVideo = (url) => {
    if (url && url.length > 5) { setCurrentVideoUrl(url); setVideoModalVisible(true); setVideoLoading(true); } 
    else { 
        if (Platform.OS === 'web') window.alert("Sem vídeo cadastrado.");
        else Alert.alert("Indisponível", "Sem vídeo cadastrado."); 
    }
  };

  const handleSaveWeight = async (itemId, weight, setIndex) => {
    const newWeights = { ...lastWeights, [itemId]: { ...(lastWeights[itemId] || {}), [setIndex]: weight } };
    setLastWeights(newWeights);
  };

  const handleSwap = (index) => {
      const list = [...exercisesToShow];
      const current = list[index];
      if (!current.substitute) return; 

      const exName = current.exercise?.name || current.title || "Exercício";
      const subName = current.substitute.name;

      const doSwap = () => {
          const newMain = { ...current, exerciseId: current.substitute.id, exercise: current.substitute, substitute: { id: current.exerciseId, name: exName, videoUrl: current.videoUrl || current.exercise?.videoUrl } };
          list[index] = newMain; 
          setExercisesToShow(list);
      };

      if (Platform.OS === 'web') {
          if (window.confirm(`Trocar ${exName} por ${subName}?`)) doSwap();
      } else {
          Alert.alert("Trocar Exercício", `Trocar ${exName} por ${subName}?`, [
              { text: "Cancelar", style: "cancel" },
              { text: "Trocar", onPress: doSwap }
          ]);
      }
  };

  const validateAndFinish = () => {
      if (!isTimerRunning && elapsedSeconds === 0) { 
          if (Platform.OS === 'web') window.alert("Para registrar cargas, clique primeiro em INICIAR TREINO.");
          else Alert.alert("Atenção", "Para registrar cargas, clique primeiro em INICIAR TREINO."); 
          return; 
      }
      proceedToFinish();
  };

  const proceedToFinish = () => { setFinishModalVisible(true); }; 

  const submitFinish = async () => {
    if (!rpe) { 
        if (Platform.OS === 'web') window.alert("Selecione o RPE.");
        else Alert.alert("Atenção", "Selecione o RPE."); 
        return; 
    }
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
                        const repsVal = ex.blocks?.[0]?.reps || ex.reps || 10;
                        setsData.push({ index: isNaN(cleanIndex) ? 1 : cleanIndex, weight: val, reps: repsVal });
                    }
                });
                if (setsData.length > 0) exercisesDone.push({ exerciseId: ex.exerciseId, name: ex.exercise?.name || ex.name, sets: setsData });
            }
        });

        const finalWorkoutName = workoutName || 'TREINO GERAL';
        const durationInMinutes = Math.ceil(elapsedSeconds / 60);

        const res = await fetch('https://fitos-final.onrender.com/api/workout/finish', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: userData.id, workoutId: workoutId, day: day, workoutName: finalWorkoutName.toUpperCase(), exercisesData: exercisesDone, duration: durationInMinutes, rpe: rpe, feedback: feedbackText })
        });

        const json = await res.json();

        if (res.ok) {
            setIsTimerRunning(false); 
            setElapsedSeconds(0);
            await AsyncStorage.removeItem(`draft_workout_${workoutId}_${day}`);
            await AsyncStorage.removeItem(`@workout_start_${workoutId}_${day}`);

            const completedKey = `@completed_days_${workoutId}`;
            const storedCompleted = await AsyncStorage.getItem(completedKey);
            let completedDaysArray = storedCompleted ? JSON.parse(storedCompleted) : [];
            const normDay = String(day).trim().toUpperCase();
            
            if (!completedDaysArray.includes(normDay)) {
                completedDaysArray.push(normDay);
                await AsyncStorage.setItem(completedKey, JSON.stringify(completedDaysArray));
            }

            if (json.newTotalXP) {
                const updatedUser = { ...userData, currentXP: json.newTotalXP };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            setFinishModalVisible(false);
            
            const firstName = userData?.name ? userData.name.split(' ')[0] : 'atleta';
            
            if (Platform.OS === 'web') {
                window.alert(`🔥 TREINO CONCLUÍDO!\nBom trabalho, ${firstName}!\nXP Ganho: +${json.xpGained || 150}`);
            } else {
                Alert.alert("🔥 TREINO CONCLUÍDO!", `Bom trabalho, ${firstName}!\nXP Ganho: +${json.xpGained || 150}`);
            }
            
            navigation.goBack();
        } else { 
            if (Platform.OS === 'web') window.alert("Falha ao salvar no servidor.");
            else Alert.alert("Erro", "Falha ao salvar no servidor."); 
        }
    } catch (e) { 
        if (Platform.OS === 'web') window.alert("Falha de conexão.");
        else Alert.alert("Erro", "Falha de conexão."); 
    } finally { setLoading(false); }
  };

  const handleStartTimer = async () => {
    const startTime = Date.now().toString();
    await AsyncStorage.setItem(`@workout_start_${workoutId}_${day}`, startTime);
    setIsTimerRunning(true);
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 };

  if (!workoutId && !loading) {
      return (
          <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
             <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Ops! Ocorreu um erro ao carregar o treino.</Text>
             <TouchableOpacity onPress={() => navigation.navigate('Main')} style={{ marginTop: 30, padding: 15, backgroundColor: theme.accent, borderRadius: 10, width: '100%', alignItems: 'center' }}>
                 <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 16 }}>VOLTAR PARA O INÍCIO</Text>
             </TouchableOpacity>
          </View>
      );
  }

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <RootComponent style={rootStyle}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        {/* 🔥 HEADER FIXADO */}
        <View style={{ width: '100%', alignItems: 'center', backgroundColor: theme.bg, borderBottomWidth: isWeb ? 1 : 0, borderBottomColor: theme.border }}>
            <View style={{ width: '100%', maxWidth: isWeb ? 480 : '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, justifyContent: 'space-between' }}>
                
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>
                
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 }} numberOfLines={1}>
                        {workoutName?.toUpperCase()}
                    </Text>
                    <Text 
                        style={{ color: theme.text, fontSize: 17, fontWeight: '900', textAlign: 'center' }} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.7}
                    >
                        {day.length <= 2 ? `TREINO ${day}` : day.toUpperCase()}
                    </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={toggleVoice} style={{ padding: 6, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                        <MaterialCommunityIcons name={isVoiceEnabled ? "volume-high" : "volume-mute"} size={18} color={isVoiceEnabled ? theme.accent : theme.textSecondary} />
                    </TouchableOpacity>
                    
                    {isTimerRunning ? (
                        <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor: theme.accent, paddingVertical:6, paddingHorizontal:8, borderRadius:8 }}>
                            <MaterialCommunityIcons name="fire" size={14} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: 'bold', fontSize: 9 }}>EM TREINO</Text>
                        </View>
                    ) : (
                        <View style={{ width: 32 }} /> 
                    )}
                </View>

            </View>
        </View>

        <View style={{ flex: 1, position: 'relative' }}>
            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false} 
                overScrollMode="never" 
            >
                <View style={{ 
                    width: isWeb ? '100%' : width, 
                    maxWidth: isWeb ? 480 : width, 
                    flexGrow: 1, 
                    backgroundColor: theme.bg, 
                    paddingHorizontal: 20, 
                    paddingBottom: 150, 
                    paddingTop: 15,
                    ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {})
                }}>
                    <View style={{ marginBottom: 20 }}>
                        {!isTimerRunning && elapsedSeconds === 0 ? (
                            <TouchableOpacity style={{ backgroundColor: theme.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 16, gap: 10, elevation: 5 }} onPress={handleStartTimer}>
                                <MaterialCommunityIcons name="play" size={30} color={theme.isDark ? '#000' : '#FFF'} />
                                <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>INICIAR TREINO</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 }}>TEMPO DECORRIDO</Text>
                                <Text style={{ color: theme.text, fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatTime(elapsedSeconds)}</Text>
                            </View>
                        )}
                    </View>

                    {exercisesToShow.map((item, index) => {
                        let rawTech = item.blocks?.[0]?.technique || item.technique || 'NORMAL';
                        let safeTechnique = typeof rawTech === 'string' ? rawTech.trim().toUpperCase() : 'NORMAL';
                        if (!TECH_GUIDE[safeTechnique]) safeTechnique = 'NORMAL';
                        
                        let biSetType = null;
                        let isBiSet = safeTechnique.includes('BISET');

                        if (isBiSet) {
                            let chainLength = 0;
                            for (let i = index - 1; i >= 0; i--) {
                                const prevEx = exercisesToShow[i];
                                let pTech = prevEx?.blocks?.[0]?.technique || prevEx?.technique || 'NORMAL';
                                let prevTech = typeof pTech === 'string' ? pTech.trim().toUpperCase() : 'NORMAL';
                                if (prevTech.includes('BISET')) { chainLength++; } 
                                else { break; }
                            }

                            if (chainLength % 2 === 0) {
                                biSetType = 'start'; 
                            } else {
                                biSetType = 'end'; 
                            }
                        }

                        return (
                            <View key={item.id} style={{ width: '100%', zIndex: biSetType === 'start' ? 2 : 1 }}>
                                <ExerciseCard 
                                    item={{ ...item, technique: safeTechnique }} 
                                    totalSets={item.sets}
                                    lastWeights={lastWeights} historyWeights={historyWeights} handleSaveWeight={handleSaveWeight}
                                    handleOpenVideo={() => handleOpenVideo(item.exercise?.videoUrl)} 
                                    setModalVisible={() => { try { navigation.navigate('ScannerIA', { exName: item.exercise?.name }); } catch (e) {} }} 
                                    onOpenCalc={() => setCalcModalVisible(true)}
                                    TECH_GUIDE={TECH_GUIDE} setTechModalVisible={setTechModalVisible} setSelectedTech={setSelectedTech}
                                    biSetType={biSetType} isLastExercise={index === exercisesToShow.length - 1} 
                                    onSwap={item.substitute ? () => handleSwap(index) : null}
                                    isTimerRunning={isTimerRunning}
                                    isVoiceEnabled={isVoiceEnabled} 
                                    colors={{
                                        bg: theme.bg,
                                        surface: theme.surface,
                                        border: theme.border,
                                        text: theme.text,
                                        textMuted: theme.textSecondary,
                                        primary: theme.accent,
                                        primaryText: theme.isDark ? '#000' : '#FFF',
                                        inputBg: theme.isDark ? '#1C1C1E' : '#F5F5F5',
                                        glass: theme.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)'
                                    }}
                                />
                            </View>
                        );
                    })}

                    <TouchableOpacity style={{ backgroundColor: theme.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 20, gap: 10 }} onPress={validateAndFinish}>
                        <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>FINALIZAR TREINO</Text>
                        <MaterialCommunityIcons name="check-all" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>

        {/* MODAL DE TÉCNICA */}
        <Modal visible={techModalVisible} transparent animationType="fade" onRequestClose={closeTechModal}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
                <View style={[{ width: '100%', maxWidth: isWeb ? 440 : '100%', alignSelf: 'center', backgroundColor: theme.surface, padding: 25, borderRadius: 25, borderWidth: 1 }, { borderColor: selectedTech && TECH_GUIDE[selectedTech] ? (TECH_GUIDE[selectedTech].color === theme.accent && !theme.isDark ? theme.accent : TECH_GUIDE[selectedTech].color) : theme.border, maxHeight: '80%' }]}>
                    
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15}}>
                            <MaterialCommunityIcons 
                                name={selectedTech && TECH_GUIDE[selectedTech] ? TECH_GUIDE[selectedTech].icon : 'dumbbell'} 
                                size={28} 
                                color={selectedTech && TECH_GUIDE[selectedTech] ? (TECH_GUIDE[selectedTech].color === theme.accent && !theme.isDark ? theme.accent : TECH_GUIDE[selectedTech].color) : theme.text} 
                            />
                            <Text style={[{ fontSize: 16, fontWeight: '900', marginBottom: 0, flex: 1, flexWrap: 'wrap' }, { color: selectedTech && TECH_GUIDE[selectedTech] ? (TECH_GUIDE[selectedTech].color === theme.accent && !theme.isDark ? theme.accent : TECH_GUIDE[selectedTech].color) : theme.text }]}>
                                {selectedTech && TECH_GUIDE[selectedTech] ? TECH_GUIDE[selectedTech].title : ''}
                            </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: theme.border, width: '100%', marginBottom: 10 }} />
                        <Text style={{ color: theme.text, fontSize: 14, lineHeight: 22 }}>
                            {selectedTech && TECH_GUIDE[selectedTech] ? TECH_GUIDE[selectedTech].desc : ''}
                        </Text>
                        
                        {selectedTech && TECH_GUIDE[selectedTech]?.audio && (
                            <TouchableOpacity 
                                onPress={() => handlePlayTechVoice(selectedTech)}
                                style={{ marginTop: 15, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: isPlayingTechVoice ? '#FF3B30' : theme.textSecondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: isPlayingTechVoice ? 'rgba(255,59,48,0.1)' : 'transparent' }}
                            >
                                <MaterialCommunityIcons name={isPlayingTechVoice ? "stop-circle-outline" : "play-circle-outline"} size={20} color={isPlayingTechVoice ? '#FF3B30' : theme.text} />
                                <Text style={{ color: isPlayingTechVoice ? '#FF3B30' : theme.text, fontWeight: 'bold', fontSize: 12 }}>
                                    {isPlayingTechVoice ? 'PARAR AULA' : 'OUVIR O COACH'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                    </ScrollView>

                    <TouchableOpacity 
                        style={[{ padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 }, { backgroundColor: selectedTech && TECH_GUIDE[selectedTech] ? (TECH_GUIDE[selectedTech].color === theme.accent && !theme.isDark ? theme.accent : TECH_GUIDE[selectedTech].color) : theme.accent }]} 
                        onPress={closeTechModal}
                    >
                        <Text style={[{ fontWeight: '900', fontSize: 14 }, { color: selectedTech && TECH_GUIDE[selectedTech] && (TECH_GUIDE[selectedTech].color === theme.accent || TECH_GUIDE[selectedTech].color === '#00FF7F') ? '#000' : '#FFF' }]}>
                            ENTENDI, BORA MOER!
                        </Text>
                    </TouchableOpacity>

                </View>
            </KeyboardAvoidingView>
        </Modal>
        
        {/* MODAL DE FINALIZAR TREINO */}
        <Modal visible={finishModalVisible} animationType="fade" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
                <View style={{ width: '100%', maxWidth: isWeb ? 440 : '100%', alignSelf: 'center', backgroundColor: theme.surface, padding: 25, borderRadius: 25, borderColor: theme.border, borderWidth: 1, maxHeight: '80%' }}>
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                        
                        <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text, marginBottom: 5, letterSpacing: 1 }}>FIM DE TREINO</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight:'bold', marginBottom:10, marginTop:10 }}>INTENSIDADE (RPE)</Text>
                        
                        <View style={{marginBottom: 20}}>
                            {RPE_OPTIONS.map((opt) => (
                                <TouchableOpacity key={opt.val} style={[{ flexDirection: 'row', alignItems:'center', padding: 12, borderRadius: 10, backgroundColor: theme.bg, marginBottom: 6, borderWidth: 1, borderColor: theme.border }, rpe === opt.val && {borderColor: opt.color, backgroundColor: `${opt.color}1A`}]} onPress={() => setRpe(opt.val)}>
                                    <View style={[{ width: 20, height: 20, borderRadius: 10, marginRight: 15, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor: theme.border }, {backgroundColor: rpe === opt.val ? opt.color : theme.bg}]}>
                                        {rpe === opt.val && <MaterialCommunityIcons name="check" size={14} color="#000" />}
                                    </View>
                                    <View style={{flex:1}}>
                                        <Text style={[{ fontWeight: 'bold', fontSize: 13, marginBottom: 2 }, {color: rpe === opt.val ? opt.color : theme.text}]}>{opt.label}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{opt.desc}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight:'bold', marginBottom:10, marginTop:10 }}>OBSERVAÇÕES (OPCIONAL)</Text>
                        <TextInput style={{ backgroundColor: theme.bg, color: theme.text, padding: 15, borderRadius: 10, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: theme.border }} multiline placeholder="Anotações..." placeholderTextColor={theme.textSecondary} value={feedbackText} onChangeText={setFeedbackText} />
                        
                        <TouchableOpacity style={{ backgroundColor: theme.accent, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 }} onPress={submitFinish}>
                            <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 14 }}>SALVAR E FINALIZAR</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{marginTop:15, marginBottom:20}} onPress={() => { setFinishModalVisible(false); }}>
                            <Text style={{color: theme.textSecondary, textAlign:'center', fontWeight:'bold'}}>CANCELAR (VOLTAR)</Text>
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>

        {/* MODAL DA CALCULADORA DE 1RM */}
        <Modal visible={calcModalVisible} transparent animationType="fade">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
                <View style={{ width: '100%', maxWidth: isWeb ? 440 : '100%', alignSelf: 'center', backgroundColor: theme.surface, padding: 25, borderRadius: 25, borderColor: theme.border, borderWidth: 1, maxHeight: '80%' }}>
                    
                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:15, alignItems:'center'}}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text, marginBottom: 5, letterSpacing: 1 }}>ESTIMATIVA DE CARGA (1RM)</Text>
                        <TouchableOpacity onPress={()=>setCalcModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.text}/></TouchableOpacity>
                    </View>
                    
                    <Text style={{color: theme.textSecondary, marginBottom:20, fontSize:13}}>Insira um peso e repetições que você já fez para descobrir a carga ideal.</Text>
                    
                    <View style={{flexDirection:'row', gap:15, marginBottom:20}}>
                        <View style={{flex:1}}>
                            <Text style={{ color: theme.textSecondary, fontSize:10, fontWeight:'bold', marginBottom:8 }}>CARGA JÁ FEITA (KG)</Text>
                            <TextInput style={{ backgroundColor: theme.bg, color: theme.text, fontSize: 16, fontWeight: 'bold', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: theme.border, textAlign: 'center', outlineStyle: 'none' }} keyboardType="numeric" value={calcWeight} onChangeText={setCalcWeight} placeholder="Ex: 50" placeholderTextColor={theme.textSecondary}/>
                        </View>
                        <View style={{flex:1}}>
                            <Text style={{ color: theme.textSecondary, fontSize:10, fontWeight:'bold', marginBottom:8 }}>REPS FEITAS</Text>
                            <TextInput style={{ backgroundColor: theme.bg, color: theme.text, fontSize: 16, fontWeight: 'bold', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: theme.border, textAlign: 'center', outlineStyle: 'none' }} keyboardType="numeric" value={calcReps} onChangeText={setCalcReps} placeholder="Ex: 10" placeholderTextColor={theme.textSecondary}/>
                        </View>
                    </View>

                    {oneRM > 0 && 
                        <View style={{ backgroundColor: theme.bg, padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: theme.accent }}>
                            <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900', marginBottom: 10 }}>{oneRM} KG <Text style={{fontSize:12, color: theme.textSecondary}}>MÁXIMO TEÓRICO</Text></Text>
                            <View style={{width:'100%', gap:12, marginTop:10}}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                    <Text style={{ color: theme.textSecondary, fontSize:12 }}>Para Hipertrofia (8-12 reps)</Text>
                                    <Text style={{ color: theme.accent, fontSize: 14, fontWeight: 'bold' }}>{Math.round(oneRM*0.75)} kg</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                    <Text style={{ color: theme.textSecondary, fontSize:12 }}>Para Força (1-5 reps)</Text>
                                    <Text style={{ color: theme.accent, fontSize: 14, fontWeight: 'bold' }}>{Math.round(oneRM*0.90)} kg</Text>
                                </View>
                            </View>
                        </View>
                    }
                </View>
            </KeyboardAvoidingView>
        </Modal>
        
        {/* 🔥 MODAL DE VÍDEO ELITE (Corrigido Cirurgicamente para iPhone e Android Web) */}
        <Modal visible={videoModalVisible} animationType="fade" transparent onRequestClose={() => { setVideoModalVisible(false); setCurrentVideoUrl(null); }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 20 }}>
                
                <View style={{ width: '90%', maxWidth: 400, height: '75%', maxHeight: 700, backgroundColor: '#000', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#333', elevation: 20 }}>
                    
                    <TouchableOpacity 
                        onPress={() => { setVideoModalVisible(false); setCurrentVideoUrl(null); }} 
                        hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }} 
                        style={{ position: 'absolute', top: 15, right: 15, zIndex: 100, backgroundColor: 'rgba(255,59,48,0.9)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }}
                    >
                        <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={{ position: 'absolute', zIndex: 10, top: 15, left: 15, width: '100%', height: '100%' }} pointerEvents="box-none">
                        <TouchableOpacity 
                            onPress={() => {
                                if (isWeb && videoRef.current) {
                                    const videoEl = videoRef.current;
                                    // 🔥 O SEGREDO DO IPHONE: A Apple usa 'webkitEnterFullscreen'
                                    if (videoEl.requestFullscreen) {
                                        videoEl.requestFullscreen();
                                    } else if (videoEl.webkitEnterFullscreen) {
                                        videoEl.webkitEnterFullscreen();
                                    } else if (videoEl.webkitRequestFullscreen) {
                                        videoEl.webkitRequestFullscreen();
                                    }
                                } else if (videoRef.current) {
                                    videoRef.current.presentFullscreenPlayer();
                                }
                            }} 
                            style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', elevation: 5 }}
                        >
                            <MaterialCommunityIcons name="fullscreen" size={20} color="#FFF" />
                            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11 }}>TELA COMPLETA</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }} pointerEvents={isIOSWeb ? "none" : "auto"}>
                        {videoModalVisible && currentVideoUrl ? (
                            <>
                                {isWeb ? (
                                    <video 
                                        ref={videoRef} 
                                        src={currentVideoUrl} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', outline: 'none' }} 
                                        controls={!isIOSWeb} // 🔥 ARRANCA OS CONTROLES NATIVOS DO IPHONE (FIM DO ÍCONE DE SOM) MAS MANTÉM NO ANDROID
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline
                                    />
                                ) : (
                                    <Video 
                                        ref={videoRef} 
                                        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 1 }} 
                                        source={{ uri: currentVideoUrl }} 
                                        resizeMode={ResizeMode.COVER} 
                                        shouldPlay 
                                        isLooping 
                                        isMuted={true} 
                                        useNativeControls={true}
                                    />
                                )}
                            </>
                        ) : null}
                    </View>
                </View>
            </View>
        </Modal>
    </RootComponent>
  );
}