// src/screens/DayWorkoutScreen.js
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, StatusBar, Platform, AppState, StyleSheet, Dimensions,
  LayoutAnimation, UIManager, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode, Audio } from 'expo-av'; 

import { formatTime, calculate1RM } from '../utils/workoutUtils'; 
import { useTheme } from '../contexts/ThemeContext';

import ExpandableExerciseBlock from '../components/Training/ExpandableExerciseBlock';
import InitialPhotosModal from '../components/InitialPhotosModal'; 
import UpsellModal from '../components/Training/UpsellModal';
import TechGuideModal from '../components/Training/TechGuideModal';
import FinishWorkoutModal from '../components/Training/FinishWorkoutModal';
import CalculatorModal from '../components/Training/CalculatorModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// 🔥 MATEMÁTICA INTELIGENTE DE TEXTOS 🔥
// Pega qualquer texto ("20kgs de cada lado", "10 a 12") e multiplica APENAS os números.
const applyMaskToString = (str, multiplier) => {
    if (!str) return str;
    return String(str).replace(/(\d+([.,]\d+)?)/g, (match) => {
        const num = parseFloat(match.replace(',', '.'));
        // Multiplica e arredonda para 1 casa decimal
        let calc = Math.round(num * multiplier * 10) / 10;
        return calc.toString().replace('.', ',');
    });
};

export default function DayWorkoutScreen({ route, navigation }) {
  const params = route?.params || {};
  const workoutId = params.workoutId || '';
  const day = params.day || 'A';
  const rawName = params.workoutName || 'Treino';
  const workoutName = rawName.replace(' |#BASE#', '');
  
  // 🔥 TRAVA DE SEGURANÇA (MODO ESPIÃO) 🔥
  const isPreviewMode = params.isPreview || false;

  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [exercisesToShow, setExercisesToShow] = useState([]);
  const [userData, setUserData] = useState(null);
  const [userPlan, setUserPlan] = useState('PREMIUM');
  const [lastWeights, setLastWeights] = useState({});
  const [checkedSets, setCheckedSets] = useState({}); 
  const [historyWeights, setHistoryWeights] = useState({});

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutModel, setWorkoutModel] = useState('CARGA'); 
  const [expandedBlockId, setExpandedBlockId] = useState(null);

  const [activeIntensityMultiplier, setActiveIntensityMultiplier] = useState(1.0);
  const [isIntensityMaskActive, setIsIntensityMaskActive] = useState(false);

  const appState = useRef(AppState.currentState);
  const isFinishingRef = useRef(false);

  const [techModalVisible, setTechModalVisible] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlayingTechVoice, setIsPlayingTechVoice] = useState(false);
  const [voiceSound, setVoiceSound] = useState(null);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const videoRef = useRef(null);

  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const oneRM = calculate1RM(parseFloat(calcWeight), parseFloat(calcReps));

  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [rpe, setRpe] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const [upsellModalVisible, setUpsellModalVisible] = useState(false);
  const [upsellType, setUpsellType] = useState('ia');
  const [hasSentInitialPhotos, setHasSentInitialPhotos] = useState(true); 
  const [initialPhotosModalVisible, setInitialPhotosModalVisible] = useState(false);

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const isIOSWeb = Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const RPE_OPTIONS = [
      { val: 10, label: 'FALHA TOTAL', desc: 'Não subia mais nada', color: '#BF5AF2' },
      { val: 9,  label: 'MUITO INTENSO', desc: 'Sobrou 1 repetição', color: '#FF3B30' },
      { val: 8,  label: 'DIFÍCIL', desc: 'Sobraram 2 repetições', color: '#FF9500' },
      { val: 6,  label: 'MODERADO', desc: 'Sobraram 3 a 4 repetições', color: '#FFCC00' },
      { val: 4,  label: 'LEVE', desc: 'Aquecimento', color: '#32ADE6' },
  ];

  const TECH_GUIDE = {
    'DROPSET': { id: 'DROPSET', title: 'DROP-SET', color: '#FF3B30', icon: 'arrow-down-bold', audio: require('../../assets/audio/exp_dropset.m4a'), desc: 'COMO EXECUTAR:\nFaça as repetições até a falha muscular. Imediatamente reduza a carga (cerca de 20 a 30%) e continue o exercício até falhar novamente, sem nenhum descanso.\n\nPOR QUE FAZER:\nAumenta o estresse metabólico e recruta fibras musculares mais profundas que não foram fadigadas inicialmente. Excelente para hipertrofia e "pump" máximo.' },
    'RESTPAUSE': { id: 'RESTPAUSE', title: 'REST-PAUSE', color: '#FF9500', icon: 'timer-sand', audio: require('../../assets/audio/exp_restpause.m4a'), desc: 'COMO EXECUTAR:\nRealize a série até a falha. Descanse apenas 10 a 15 segundos e volte a fazer o exercício com a MESMA carga até falhar de novo.\n\nPOR QUE FAZER:\nPermite realizar mais repetições totais com uma carga alta (tensão mecânica extrema), gerando um forte estímulo de hipertrofia na metade do tempo.' },
    'BISET': { id: 'BISET', title: 'BI-SET', color: theme.accent, icon: 'link-variant', audio: require('../../assets/audio/exp_biset.m4a'), desc: 'COMO EXECUTAR:\nRealize o primeiro exercício e, sem nenhum descanso, passe imediatamente para a execução do segundo exercício acoplado.\n\nPOR QUE FAZER:\nAumenta a densidade do treino, eleva a frequência cardíaca e gera um estresse absurdo na musculatura alvo, otimizando seu tempo na academia.' },
    '21': { id: '21', title: 'MÉTODO 21', color: '#32ADE6', icon: 'numeric-7-box-multiple-outline', audio: require('../../assets/audio/exp_21.m4a'), desc: 'COMO EXECUTAR:\nDivida o movimento em 3 partes. Faça 7 repetições só na metade inferior do movimento, 7 na metade superior e 7 repetições completas. Totalizando 21 reps.\n\nPOR QUE FAZER:\nAumenta drasticamente o tempo sob tensão e o fluxo sanguíneo no local. É uma ótima ferramenta para quebrar platôs de estagnação.' },
    'CLUSTERSET': { id: 'CLUSTERSET', title: 'CLUSTER SET', color: '#BF5AF2', icon: 'chart-bar', audio: require('../../assets/audio/exp_cluster.m4a'), desc: 'COMO EXECUTAR:\nDivida uma série pesada em pequenos blocos. (Ex: em vez de tentar 10 diretas, faça 3 reps, descanse 15s, faça mais 3 reps... até bater a meta).\n\nPOR QUE FAZER:\nPermite levantar mais carga total do que você aguentaria numa série contínua normal. Foca em força pura e hipertrofia miofibrilar sem perder a técnica.' },
    'GVT': { id: 'GVT', title: 'GVT (10x10)', color: '#00FF7F', icon: 'numeric-10-box-multiple', audio: require('../../assets/audio/exp_gvt.m4a'), desc: 'COMO EXECUTAR:\nRealize 10 séries de 10 repetições com a mesma carga (cerca de 60% da sua força máxima) e descanso cravado de 60 segundos entre as séries.\n\nPOR QUE FAZER:\nÉ um choque brutal no corpo. O volume de treino extremo força o seu músculo a hipertrofiar para "sobreviver" ao estresse imposto.' },
    '1_5_REPS': { id: '1_5_REPS', title: '1 E MEIO (1.5 REPS)', color: '#FF2D55', icon: 'debug-step-over', desc: 'COMO EXECUTAR:\nFaça o movimento completo, volte até a metade do caminho, suba novamente e então retorne à posição inicial. Isso conta como UMA repetição.\n\nPOR QUE FAZER:\nAumenta drasticamente o tempo sob tensão no ponto de maior dificuldade do exercício, maximizando o ganho de massa sem precisar colocar cargas extremas nas articulações.' },
    'TUT': { id: 'TUT', title: 'T.U.T. (TEMPO SOB TENSÃO)', color: '#00C7BE', icon: 'timer-outline', desc: 'COMO EXECUTAR:\nExecute as repetições de forma extremamente controlada, respeitando os segundos de cadência estipulados pelo Coach tanto na fase de descida (excêntrica) quanto na de subida (concêntrica). Sem jogar o peso.\n\nPOR QUE FAZER:\nImpede o uso de "impulso" para levantar o peso. Foca 100% da força no músculo alvo, gerando hipertrofia máxima com segurança.' },
    'NORMAL': { id: 'NORMAL', title: 'EXECUÇÃO PADRÃO', color: theme.textSecondary, icon: 'dumbbell', desc: 'COMO EXECUTAR:\nSiga o número de séries e repetições estipulados, focando em manter a postura correta.\n\nPOR QUE FAZER:\nÉ a base da construção de força e hipertrofia. O foco aqui é na cadência (velocidade do movimento) e na progressão de carga treino a treino.' }
  };

  useFocusEffect( useCallback(() => { fetchWorkoutData(); }, []) );

  useEffect(() => {
    const loadVoicePref = async () => {
        try {
            const pref = await AsyncStorage.getItem('@voice_coach_enabled');
            if (pref !== null) setIsVoiceEnabled(pref === 'true');
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
          if (!isTimerRunning || isFinishingRef.current || isPreviewMode) return; // 🔥 MODO ESPIÃO SAI SEM AVISO 🔥
          e.preventDefault(); 
          if (Platform.OS === 'web') {
              if (window.confirm("⚠️ TREINO EM ANDAMENTO!\nVocê está com o cronômetro rodando. Tem certeza que deseja sair? O tempo pode ser perdido.")) {
                  navigation.dispatch(e.data.action);
              }
          } else {
              Alert.alert('⚠️ TREINO EM ANDAMENTO!', 'Você está com o cronômetro rodando. Tem certeza que deseja sair e interromper o treino?', [
                  { text: "FICAR NO TREINO", style: 'cancel', onPress: () => {} },
                  { text: 'SAIR MESMO ASSIM', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
              ]);
          }
      });
      return unsubscribe;
  }, [navigation, isTimerRunning, isPreviewMode]);

  useEffect(() => {
    // 🔥 SE FOR MODO ESPIÃO, COMEÇA O CRONÔMETRO AUTOMÁTICO SEM SALVAR NO BANCO 🔥
    if (isPreviewMode && !loading && exercisesToShow.length > 0) {
        setIsTimerRunning(true);
        return;
    }

    const syncTimer = async () => {
        const savedStart = await AsyncStorage.getItem(`@workout_start_${workoutId}_${day}`);
        if (savedStart) {
          const now = Date.now();
          const diff = Math.floor((now - parseInt(savedStart)) / 1000);
          setElapsedSeconds(diff > 0 ? diff : 0); 
          setIsTimerRunning(true); 
        }
      };
      if (!isPreviewMode) syncTimer();
  }, [workoutId, day, isPreviewMode, loading, exercisesToShow]);

  useEffect(() => {
    if (isPreviewMode) return; // 🔥 MODO ESPIÃO IGNORA BACKGROUND 🔥

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
  }, [workoutId, day, isPreviewMode]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) { interval = setInterval(() => { setElapsedSeconds(prev => prev + 1); }, 1000); } 
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (isPreviewMode) return; // 🔥 MODO ESPIÃO NÃO SALVA RASCUNHO 🔥

    const saveProgress = async () => {
        if (Object.keys(lastWeights).length > 0 || Object.keys(checkedSets).length > 0) {
            const key = `draft_workout_${workoutId}_${day}`;
            await AsyncStorage.setItem(key, JSON.stringify({ weights: lastWeights, checks: checkedSets }));
        }
    };
    const timer = setTimeout(saveProgress, 500); 
    return () => clearTimeout(timer);
  }, [lastWeights, checkedSets, workoutId, day, isPreviewMode]);

  const handlePlayTechVoice = async (techKey) => {
      try {
          if (voiceSound) { await voiceSound.unloadAsync(); setVoiceSound(null); }
          if (isPlayingTechVoice) { setIsPlayingTechVoice(false); return; }
          const audioRes = TECH_GUIDE[techKey]?.audio;
          if (audioRes) {
              setIsPlayingTechVoice(true);
              const { sound } = await Audio.Sound.createAsync(audioRes);
              setVoiceSound(sound);
              sound.setOnPlaybackStatusUpdate((status) => { if (status.didJustFinish) setIsPlayingTechVoice(false); });
              await sound.playAsync();
          }
      } catch (e) {
          setIsPlayingTechVoice(false);
      }
  };

  const closeTechModal = () => {
      if (voiceSound) { voiceSound.unloadAsync(); setVoiceSound(null); }
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

      const dbPlan = user.plan || 'PREMIUM';
      setUserPlan(['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(dbPlan) ? dbPlan : 'PREMIUM');

      const cacheKey = `@cached_workout_${workoutId}_${day}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData && !isPreviewMode) setExercisesToShow(JSON.parse(cachedData)); // Modo espião sempre pega fresco

      const draftKey = `draft_workout_${workoutId}_${day}`;
      const draft = await AsyncStorage.getItem(draftKey);
      if (draft && !isPreviewMode) { 
          try {
              const parsed = JSON.parse(draft);
              if (parsed.weights) {
                  setLastWeights(parsed.weights);
                  setCheckedSets(parsed.checks || {});
              } else {
                  setLastWeights(parsed); 
              }
          } catch(e) {}
      }

      // 🔥 No Modo Espião, não precisa buscar checkin do aluno 🔥
      const [resWorkout, resCheckin] = await Promise.all([
          fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&workoutId=${workoutId}&t=${Date.now()}`),
          isPreviewMode ? Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 'mock' }]) }) : fetch(`https://fitos-final.onrender.com/api/checkin?userId=${user.id}`)
      ]);
      
      const data = await resWorkout.json();
      if (resCheckin.ok) {
          const checkinsData = await resCheckin.json();
          setHasSentInitialPhotos(Array.isArray(checkinsData) && checkinsData.length > 0);
      }
      
      if (resWorkout.ok && data && data.exercises) {
        setWorkoutModel(data.workoutModel || 'CARGA');

        let multiplier = data.intensityMultiplier || 1.0;
        let isMaskActive = false;
        
        if (multiplier !== 1.0 && data.intensityEndDate) {
            const expirationDate = new Date(data.intensityEndDate);
            if (new Date() <= expirationDate) {
                isMaskActive = true;
            } else {
                multiplier = 1.0; 
            }
        }
        
        setActiveIntensityMultiplier(multiplier);
        setIsIntensityMaskActive(isMaskActive);

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

                if (isMaskActive && data.workoutModel === 'CARGA') {
                    realBlocks = realBlocks.map(block => {
                        let newBlock = { ...block };
                        
                        if (newBlock.load) {
                            newBlock.load = applyMaskToString(newBlock.load, multiplier);
                        }

                        if (multiplier === 0.8) {
                            if (newBlock.technique && newBlock.technique !== 'NORMAL' && newBlock.technique !== 'TUT') {
                                newBlock.technique = 'NORMAL';
                                realObs = `⚠️ DELOAD: Técnica avançada suspensa. ${realObs}`;
                            }
                        }
                        
                        if (multiplier > 1.0) {
                            let currentRest = parseInt(newBlock.restTime) || 60;
                            newBlock.restTime = String(currentRest + 30);
                            if(!realObs.includes("CHOQUE")) {
                                realObs = `🔥 CHOQUE: Descanso prolongado para +carga. ${realObs}`;
                            }
                        }
                        return newBlock;
                    });
                }

                return { ...item, blocks: realBlocks, technique: realTech, observation: realObs };
            });

        setExercisesToShow(filteredExercises);
        
        if (data.lastWeights) {
            let maskedWeights = { ...data.lastWeights };
            if (isMaskActive && data.workoutModel === 'CARGA') {
                Object.keys(maskedWeights).forEach(exId => {
                    Object.keys(maskedWeights[exId]).forEach(setIdx => {
                        let originalWeight = maskedWeights[exId][setIdx];
                        maskedWeights[exId][setIdx] = applyMaskToString(originalWeight, multiplier);
                    });
                });
            }
            setHistoryWeights(maskedWeights);
            if(!isPreviewMode) await AsyncStorage.setItem(`@cached_history_${workoutId}_${day}`, JSON.stringify(maskedWeights));
        }
        if(!isPreviewMode) await AsyncStorage.setItem(cacheKey, JSON.stringify(filteredExercises));
      }
    } catch (error) { 
        if (!isPreviewMode) {
            const histCache = await AsyncStorage.getItem(`@cached_history_${workoutId}_${day}`);
            if (histCache) setHistoryWeights(JSON.parse(histCache));
        }
    } finally { setLoading(false); }
  };

  const groupedExercises = useMemo(() => {
      const groups = [];
      let tempGroup = [];

      exercisesToShow.forEach((item, index) => {
          let rawTech = item.blocks?.[0]?.technique || item.technique || 'NORMAL';
          let safeTechnique = typeof rawTech === 'string' ? rawTech.trim().toUpperCase() : 'NORMAL';
          if (!TECH_GUIDE[safeTechnique]) safeTechnique = 'NORMAL';

          let isBiSet = safeTechnique.includes('BISET');
          const itemWithMeta = { ...item, safeTechnique, originalIndex: index };

          if (isBiSet) {
              tempGroup.push(itemWithMeta);
              if (tempGroup.length === 2) {
                  groups.push({ id: `group_${index}`, type: 'BISET', items: tempGroup });
                  tempGroup = [];
              }
          } else {
              if (tempGroup.length > 0) {
                  groups.push({ id: `group_hanging_${index}`, type: 'BISET', items: tempGroup });
                  tempGroup = [];
              }
              groups.push({ id: `group_${index}`, type: 'NORMAL', items: [itemWithMeta] });
          }
      });
      if (tempGroup.length > 0) {
          groups.push({ id: `group_end`, type: 'BISET', items: tempGroup });
      }
      return groups;
  }, [exercisesToShow, TECH_GUIDE]);

  const toggleBlock = (blockId) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedBlockId(prev => prev === blockId ? null : blockId);
  };

  const handleOpenVideo = (url) => {
    if (url && url.length > 5) { setCurrentVideoUrl(url); setVideoModalVisible(true); } 
    else { 
        if (Platform.OS === 'web') window.alert("Sem vídeo cadastrado.");
        else Alert.alert("Indisponível", "Sem vídeo cadastrado."); 
    }
  };

  // 🔥 A CIRURGIA ESTÁ AQUI: ADICIONADO alunoName e videoUrl (GABARITO DA CLOUDFLARE) 🔥
  const handleOpenIA = (item) => {
      if (userPlan === 'PREMIUM') { 
          try { 
              // Puxa a URL do vídeo de onde quer que ela esteja salva no objeto
              const refVideo = item.exercise?.videoUrl || item.videoUrl || '';
              
              navigation.navigate('ScannerIA', { 
                  exName: item.exercise?.name || item.title || 'Exercício', 
                  alunoName: userData?.name,
                  videoUrl: refVideo // Mandando o seu vídeo de gabarito para a IA!
              }); 
          } catch (e) {} 
      } else { 
          openDynamicUpsell('ia'); 
      }
  };

  const handleOpenCalc = () => {
      if (userPlan === 'PREMIUM') setCalcModalVisible(true);
      else openDynamicUpsell('calc');
  };

  const handleSaveWeight = async (itemId, weight, setIndex) => {
    if (isPreviewMode) return; // 🔥 MODO ESPIÃO BLOQUEIA SALVAR CARGA 🔥
    setLastWeights({ ...lastWeights, [itemId]: { ...(lastWeights[itemId] || {}), [setIndex]: weight } });
  };

  const handleCheckSet = (itemId, setIndex) => {
    setCheckedSets(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), [setIndex]: true } }));
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

      if (Platform.OS === 'web') { if (window.confirm(`Trocar ${exName} por ${subName}?`)) doSwap(); } 
      else { Alert.alert("Trocar Exercício", `Trocar ${exName} por ${subName}?`, [{ text: "Cancelar", style: "cancel" }, { text: "Trocar", onPress: doSwap }]); }
  };

  const validateAndFinish = () => {
      if (!isTimerRunning && elapsedSeconds === 0) { 
          if (Platform.OS === 'web') window.alert("Para registrar cargas, clique primeiro em INICIAR TREINO.");
          else Alert.alert("Atenção", "Para registrar cargas, clique primeiro em INICIAR TREINO."); 
          return; 
      }
      setFinishModalVisible(true);
  };

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
                        
                        // 🔥 O ASSASSINO MORREU AQUI! Pega a repetição do bloco exato da série.
                        const repsVal = ex.blocks?.[cleanIndex]?.reps || ex.blocks?.[0]?.reps || ex.reps || 10;

                        let realWeightToSave = val;
                        if (isIntensityMaskActive && workoutModel === 'CARGA' && activeIntensityMultiplier !== 1.0) {
                             realWeightToSave = applyMaskToString(val, (1 / activeIntensityMultiplier));
                        }

                        setsData.push({ index: isNaN(cleanIndex) ? 1 : cleanIndex, weight: realWeightToSave, reps: String(repsVal) });
                    }
                });
                if (setsData.length > 0) exercisesDone.push({ exerciseId: ex.exerciseId, name: ex.exercise?.name || ex.name, sets: setsData });
            }
        });

        const durationInMinutes = Math.ceil(elapsedSeconds / 60);

        const res = await fetch('https://fitos-final.onrender.com/api/workout/finish', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: userData.id, workoutId: workoutId, day: day, workoutName: (workoutName || 'TREINO').toUpperCase(), exercisesData: exercisesDone, duration: durationInMinutes, rpe: rpe, feedback: feedbackText })
        });

        const json = await res.json();

        if (res.ok) {
            isFinishingRef.current = true;
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
                await AsyncStorage.setItem('user', JSON.stringify({ ...userData, currentXP: json.newTotalXP }));
            }
            
            setFinishModalVisible(false);
            const firstName = userData?.name ? userData.name.split(' ')[0] : 'atleta';
            
            if (Platform.OS === 'web') window.alert(`🔥 TREINO CONCLUÍDO!\nBom trabalho, ${firstName}!\nXP Ganho: +${json.xpGained || 150}`);
            else Alert.alert("🔥 TREINO CONCLUÍDO!", `Bom trabalho, ${firstName}!\nXP Ganho: +${json.xpGained || 150}`);
            navigation.goBack();
        } else { 
            if (Platform.OS === 'web') window.alert("Falha ao salvar no servidor.");
            else Alert.alert("Erro", "Falha ao salvar no servidor."); 
        }
    } catch (e) { 
        if (Platform.OS === 'web') window.alert("Sem conexão. Tente novamente quando a internet voltar.");
        else Alert.alert("Sem Conexão", "Sua internet caiu. O treino está salvo no rascunho, tente finalizar quando a conexão voltar."); 
    } finally { setLoading(false); }
  };

  const handleStartTimerRequest = () => {
      if (!hasSentInitialPhotos && userPlan !== 'PREMIUM') setInitialPhotosModalVisible(true);
      else executeStartTimer();
  };

  const executeStartTimer = async () => {
      if(!isPreviewMode) await AsyncStorage.setItem(`@workout_start_${workoutId}_${day}`, Date.now().toString());
      setIsTimerRunning(true);
  };

  const openDynamicUpsell = (type) => { setUpsellType(type); setUpsellModalVisible(true); };

  const getPhotoModalContent = () => {
      switch (userPlan) {
          case 'PREMIUM': return { title: 'REGISTRE SEU PONTO DE PARTIDA 📸', desc: 'Para mapear sua evolução na Consultoria Elite, faça o seu primeiro registro. É rápido e 100% sigiloso.', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'FAZER DEPOIS', showEscape: true };
          case 'LOW_COST': return { title: 'FOTOS DE EVOLUÇÃO PENDENTES 📸', desc: 'Para acompanharmos sua progressão no plano, precisamos do seu registro inicial. Sem ele, a evolução não existe!', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'IR PARA O TREINO', showEscape: false };
          case 'FICHA_8S': return { title: 'FOTOS DO DIA 1 PENDENTES ⚠️', desc: 'Suas fotos de ponto de partida são essenciais para a avaliação de encerramento do Projeto. O envio é obrigatório para começar!', btnText: 'ENVIAR FOTOS DO DIA 1', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
          case 'CHALLENGE_21': return { title: 'FOTOS DO DIA 1 — OBRIGATÓRIAS ⚠️', desc: 'O Desafio de 21 Dias depende das fotos iniciais para medir o seu resultado final. Sem o "antes", não existe "depois".', btnText: 'ENVIAR FOTOS E COMEÇAR', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
          default: return { title: 'FOTOS PENDENTES 📸', desc: 'Envie suas fotos iniciais para mapearmos sua evolução.', btnText: 'ENVIAR FOTOS', escapeText: 'TREINAR MESMO ASSIM', showEscape: true };
      }
  };
  const photoModal = getPhotoModalContent();

  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 };

  if (!workoutId && !loading && exercisesToShow.length === 0) {
      return (
          <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
             <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Você está sem internet para carregar o treino pela primeira vez.</Text>
             <TouchableOpacity onPress={() => navigation.navigate('Main')} style={{ marginTop: 30, padding: 15, backgroundColor: theme.accent, borderRadius: 10, width: '100%', alignItems: 'center' }}>
                 <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 16 }}>VOLTAR PARA O INÍCIO</Text>
             </TouchableOpacity>
          </View>
      );
  }

  if (loading && exercisesToShow.length === 0) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <RootComponent style={rootStyle}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        <View style={{ width: '100%', alignItems: 'center', backgroundColor: theme.bg, borderBottomWidth: isWeb ? 1 : 0, borderBottomColor: theme.border }}>
            {/* 🔥 AVISO DE MODO ESPIÃO 🔥 */}
            {isPreviewMode && (
                <View style={{ width: '100%', backgroundColor: '#FF9500', padding: 8, alignItems: 'center' }}>
                    <Text style={{ color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>🕵️ MODO ESPIÃO ATIVO (APENAS VISUALIZAÇÃO)</Text>
                </View>
            )}

            {isIntensityMaskActive && activeIntensityMultiplier === 0.8 && (
                <View style={{ width: '100%', backgroundColor: '#32ADE6', padding: 8, alignItems: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>🧊 SEMANA DE DELOAD ATIVADA (CARGAS REDUZIDAS)</Text>
                </View>
            )}
            {isIntensityMaskActive && activeIntensityMultiplier > 1.0 && (
                <View style={{ width: '100%', backgroundColor: '#FF3B30', padding: 8, alignItems: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>🔥 SEMANA DE CHOQUE (DESCANSO AUMENTADO E +CARGA)</Text>
                </View>
            )}

            <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}><MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} /></TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 }} numberOfLines={1}>{workoutName?.toUpperCase()}</Text>
                    <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{day.length <= 2 ? `TREINO ${day}` : day.toUpperCase()}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={toggleVoice} style={{ padding: 6, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}><MaterialCommunityIcons name={isVoiceEnabled ? "volume-high" : "volume-mute"} size={18} color={isVoiceEnabled ? theme.accent : theme.textSecondary} /></TouchableOpacity>
                    {isTimerRunning && !isPreviewMode ? (
                        <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor: theme.accent, paddingVertical:6, paddingHorizontal:8, borderRadius:8 }}><MaterialCommunityIcons name="fire" size={14} color={theme.isDark ? '#000' : '#FFF'} /><Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: 'bold', fontSize: 9 }}>EM TREINO</Text></View>
                    ) : <View style={{ width: 32 }} />}
                </View>
            </View>
        </View>

        <View style={{ flex: 1, position: 'relative' }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false} overScrollMode="never">
                <View style={{ width: isWeb ? '100%' : width, maxWidth: isWeb ? 480 : width, flexGrow: 1, backgroundColor: theme.bg, paddingHorizontal: 20, paddingBottom: 150, paddingTop: 15, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}>
                    
                    <View style={{ marginBottom: 20 }}>
                        {!isTimerRunning && elapsedSeconds === 0 && !isPreviewMode ? (
                            <TouchableOpacity style={{ backgroundColor: theme.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 16, gap: 10, elevation: 5 }} onPress={handleStartTimerRequest}>
                                <MaterialCommunityIcons name="play" size={30} color={theme.isDark ? '#000' : '#FFF'} />
                                <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>INICIAR TREINO</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 }}>{isPreviewMode ? "CRONÔMETRO (ESPIÃO)" : "TEMPO DECORRIDO"}</Text>
                                <Text style={{ color: theme.text, fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatTime(elapsedSeconds)}</Text>
                            </View>
                        )}
                    </View>

                    {groupedExercises.map((block) => (
                        <ExpandableExerciseBlock 
                            key={block.id} block={block} isExpanded={expandedBlockId === block.id} onToggle={() => toggleBlock(block.id)} theme={theme}
                            lastWeights={lastWeights} historyWeights={historyWeights} handleSaveWeight={handleSaveWeight} checkedSets={checkedSets} handleCheckSet={handleCheckSet}
                            handleOpenVideo={handleOpenVideo} handleOpenIA={handleOpenIA} handleOpenCalc={handleOpenCalc}
                            hasPremiumFeatures={userPlan === 'PREMIUM'} workoutModel={workoutModel} TECH_GUIDE={TECH_GUIDE} setTechModalVisible={setTechModalVisible} setSelectedTech={setSelectedTech}
                            handleSwap={handleSwap} isTimerRunning={isTimerRunning} isVoiceEnabled={isVoiceEnabled}
                            colors={{ bg: theme.bg, surface: theme.surface, border: theme.border, text: theme.text, textMuted: theme.textSecondary, primary: theme.accent, primaryText: theme.isDark ? '#000' : '#FFF', inputBg: theme.isDark ? '#1C1C1E' : '#F5F5F5', glass: theme.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)' }}
                        />
                    ))}

                    {/* 🔥 ESCONDE O BOTÃO DE FINALIZAR SE FOR MODO ESPIÃO 🔥 */}
                    {!isPreviewMode && (
                        <TouchableOpacity style={{ backgroundColor: theme.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 20, gap: 10 }} onPress={validateAndFinish}>
                            <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>FINALIZAR TREINO</Text><MaterialCommunityIcons name="check-all" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>

        <InitialPhotosModal 
            visible={initialPhotosModalVisible} 
            onClose={() => { setInitialPhotosModalVisible(false); executeStartTimer(); }} 
            theme={theme} 
            photoModal={photoModal} 
            userPlan={userPlan} 
            onNavigate={() => { setInitialPhotosModalVisible(false); navigation.navigate('CheckIn'); }} 
        />
        <UpsellModal visible={upsellModalVisible} onClose={() => setUpsellModalVisible(false)} theme={theme} upsellType={upsellType} />
        <TechGuideModal visible={techModalVisible} onClose={closeTechModal} theme={theme} selectedTech={selectedTech} TECH_GUIDE={TECH_GUIDE} isPlayingTechVoice={isPlayingTechVoice} handlePlayTechVoice={handlePlayTechVoice} isWeb={isWeb} />
        <FinishWorkoutModal visible={finishModalVisible} onClose={() => setFinishModalVisible(false)} theme={theme} RPE_OPTIONS={RPE_OPTIONS} rpe={rpe} setRpe={setRpe} feedbackText={feedbackText} setFeedbackText={setFeedbackText} submitFinish={submitFinish} isWeb={isWeb} />
        <CalculatorModal visible={calcModalVisible} onClose={() => setCalcModalVisible(false)} theme={theme} calcWeight={calcWeight} setCalcWeight={setCalcWeight} calcReps={calcReps} setCalcReps={setCalcReps} oneRM={oneRM} isWeb={isWeb} />
        
        <Modal visible={videoModalVisible} animationType="fade" transparent onRequestClose={() => { setVideoModalVisible(false); setCurrentVideoUrl(null); }}>
            <View style={styles.modalOverlay}>
                <View style={styles.videoCard}>
                    <TouchableOpacity onPress={() => { setVideoModalVisible(false); setCurrentVideoUrl(null); }} hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }} style={styles.closeVideoBtn}>
                        <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.fullScreenOverlay} pointerEvents="box-none">
                        <TouchableOpacity onPress={() => {
                                if (isWeb && videoRef.current) {
                                    const videoEl = videoRef.current;
                                    if (videoEl.requestFullscreen) videoEl.requestFullscreen();
                                    else if (videoEl.webkitEnterFullscreen) videoEl.webkitEnterFullscreen();
                                } else if (videoRef.current) videoRef.current.presentFullscreenPlayer();
                            }} 
                            style={styles.fullScreenBtn}
                        >
                            <MaterialCommunityIcons name="fullscreen" size={20} color="#FFF" />
                            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11 }}>TELA COMPLETA</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }} pointerEvents={isIOSWeb ? "none" : "auto"}>
                        {videoModalVisible && currentVideoUrl ? (
                            <>
                                {isWeb ? (
                                    <video ref={videoRef} src={currentVideoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', outline: 'none' }} controls={!isIOSWeb} autoPlay loop muted playsInline />
                                ) : (
                                    <Video ref={videoRef} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 1 }} source={{ uri: currentVideoUrl }} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={true} useNativeControls={true} />
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

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 20 },
    videoCard: { width: '90%', maxWidth: 400, height: '75%', maxHeight: 700, backgroundColor: '#000', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#333', elevation: 20 },
    closeVideoBtn: { position: 'absolute', top: 15, right: 15, zIndex: 100, backgroundColor: 'rgba(255,59,48,0.9)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    fullScreenOverlay: { position: 'absolute', zIndex: 10, top: 15, left: 15, width: '100%', height: '100%' },
    fullScreenBtn: { backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', elevation: 5 }
});