// src/components/DayWorkout/useDayWorkoutData.js
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getInitialTechGuide } from './techGuideData';
import { applyMaskToString, applyIntensityMaskToBlocks } from './workoutMaskUtils';

// Hook responsável por:
// - buscar o treino do dia (com cache + draft, exceto no modo espião)
// - montar o techGuide dinâmico (técnicas estáticas + customizadas do laboratório)
// - processar os exercícios (resolver blocos, traduzir customTechniqueId, aplicar
//   máscara de intensidade quando deload/choque estiver ativo)
// - expor handlers de interação: trocar exercício, salvar peso, marcar set, finalizar treino
export default function useDayWorkoutData({ workoutId, day, isPreviewMode, theme, navigation, workoutName, focus, onBeforeNavigateAway }) {
  const [techGuide, setTechGuide] = useState(getInitialTechGuide(theme));
  const [loading, setLoading] = useState(true);
  const [exercisesToShow, setExercisesToShow] = useState([]);
  const [userData, setUserData] = useState(null);
  const [userPlan, setUserPlan] = useState('PREMIUM');
  const [lastWeights, setLastWeights] = useState({});
  const [checkedSets, setCheckedSets] = useState({});
  const [historyWeights, setHistoryWeights] = useState({});
  const [workoutModel, setWorkoutModel] = useState('CARGA');
  const [activeIntensityMultiplier, setActiveIntensityMultiplier] = useState(1.0);
  const [isIntensityMaskActive, setIsIntensityMaskActive] = useState(false);
  const [hasSentInitialPhotos, setHasSentInitialPhotos] = useState(true);

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

      // 🔥 PUXA AS TÉCNICAS DO LABORATÓRIO E FUNDE COM AS GLOBAIS 🔥
      const coachIdToUse = user.coachId || user.id;
      let currentTechGuide = getInitialTechGuide(theme);

      // 🔥 NOVO: busca os overrides de vídeo das 9 técnicas FIXAS do sistema
      // (GVT, DROPSET, RESTPAUSE, etc — globais, não filtradas por coach).
      // Feita em paralelo conceitualmente com o resto, mas aqui de forma simples
      // e com fallback silencioso: se falhar, as técnicas fixas simplesmente
      // não ganham `videoUrl` nesta sessão (modal continua funcionando normal,
      // só sem a aba de vídeo).
      try {
        const sysVideosRes = await fetch('https://fitos-final.onrender.com/api/admin/system-technique-videos');
        if (sysVideosRes.ok) {
          const sysVideos = await sysVideosRes.json();
          if (Array.isArray(sysVideos)) {
            sysVideos.forEach(v => {
              if (currentTechGuide[v.key]) {
                currentTechGuide[v.key] = { ...currentTechGuide[v.key], videoUrl: v.videoUrl };
              }
            });
            if (!isPreviewMode) await AsyncStorage.setItem('@cached_system_tech_videos', JSON.stringify(sysVideos));
          }
        } else {
          throw new Error("Failed to fetch system videos");
        }
      } catch (e) {
        try {
          const cachedSysVideosStr = await AsyncStorage.getItem('@cached_system_tech_videos');
          if (cachedSysVideosStr) {
            const sysVideos = JSON.parse(cachedSysVideosStr);
            sysVideos.forEach(v => {
              if (currentTechGuide[v.key]) {
                currentTechGuide[v.key] = { ...currentTechGuide[v.key], videoUrl: v.videoUrl };
              }
            });
          }
        } catch (e2) {}
      }

      try {
        let customTechs = [];
        const techRes = await fetch(`https://fitos-final.onrender.com/api/admin/techniques?coachId=${coachIdToUse}`);
        if (techRes.ok) {
          customTechs = await techRes.json();
          if (!isPreviewMode) await AsyncStorage.setItem(`@cached_techs_${coachIdToUse}`, JSON.stringify(customTechs));
        } else {
          throw new Error("Failed to fetch");
        }

        customTechs.forEach(t => {
          currentTechGuide[t.id] = {
            id: t.id,
            title: t.name,
            color: theme.accent, // Verde Neon Profissional
            icon: 'flask-outline', // Ícone de laboratório
            desc: t.description || 'Técnica avançada personalizada pelo seu treinador. Siga o passo a passo da linha do tempo.',
            steps: t.steps,
            videoUrl: t.videoUrl || null, // 🔥 NOVO: vídeo demonstrativo cadastrado no Laboratório
            isCustom: true
          };
        });
      } catch (e) {
        const cachedTechsStr = await AsyncStorage.getItem(`@cached_techs_${coachIdToUse}`);
        if (cachedTechsStr) {
          const customTechs = JSON.parse(cachedTechsStr);
          customTechs.forEach(t => {
            currentTechGuide[t.id] = {
              id: t.id,
              title: t.name,
              color: theme.accent,
              icon: 'flask-outline',
              desc: t.description || 'Técnica avançada personalizada pelo seu treinador. Siga o passo a passo da linha do tempo.',
              steps: t.steps,
              videoUrl: t.videoUrl || null, // 🔥 NOVO (também no fallback de cache)
              isCustom: true
            };
          });
        }
      }
      // Salva o dicionário completo e atualizado no estado!
      setTechGuide(currentTechGuide);

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
        } catch (e) {}
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
            } catch (e) {}

            if (!realBlocks || !Array.isArray(realBlocks) || realBlocks.length === 0) {
              realBlocks = [{ sets: String(item.sets || '3'), reps: String(item.reps || '12'), restTime: String(item.restTime || '60'), technique: realTech || '' }];
            }

            // 🔥 CIRURGIA 1 CORRIGIDA: Traduz o ID da técnica para o NOME VISUAL
            realBlocks = realBlocks.map(block => {
              let newBlock = { ...block };
              if (newBlock.customTechniqueId) {
                // Busca o nome lá no dicionário que acabamos de montar e entrega mastigado pra interface
                const nomeDaTecnica = currentTechGuide[newBlock.customTechniqueId]?.title || 'Técnica Customizada';
                newBlock.technique = nomeDaTecnica;
              }
              return newBlock;
            });

            // Atualiza a técnica raiz do exercício com base no bloco 1
            if (realBlocks[0]?.technique) {
              realTech = realBlocks[0].technique;
            }

            if (isMaskActive && data.workoutModel === 'CARGA') {
              const masked = applyIntensityMaskToBlocks(realBlocks, multiplier, realObs);
              realBlocks = masked.blocks;
              realObs = masked.observation;
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
          if (!isPreviewMode) await AsyncStorage.setItem(`@cached_history_${workoutId}_${day}`, JSON.stringify(maskedWeights));
        }
        if (!isPreviewMode) await AsyncStorage.setItem(cacheKey, JSON.stringify(filteredExercises));
      }
    } catch (error) {
      if (!isPreviewMode) {
        const histCache = await AsyncStorage.getItem(`@cached_history_${workoutId}_${day}`);
        if (histCache) setHistoryWeights(JSON.parse(histCache));
      }
    } finally { setLoading(false); }
  };

  // Auto-save do rascunho (peso + checks) — 500ms de debounce, igual ao original
  useEffect(() => {
    if (isPreviewMode) return; // 🔥 MODO ESPIÃO NÃO SALVA RASCUNHO 🔥

    const saveProgress = async () => {
      if (Object.keys(lastWeights).length > 0 || Object.keys(checkedSets).length > 0) {
        const key = `draft_workout_${workoutId}_${day}`;
        await AsyncStorage.setItem(key, JSON.stringify({ weights: lastWeights, checks: checkedSets }));
      }
    };
    const timerId = setTimeout(saveProgress, 500);
    return () => clearTimeout(timerId);
  }, [lastWeights, checkedSets, workoutId, day, isPreviewMode]);

  const handleSaveWeight = async (itemId, weight, setIndex) => {
    if (isPreviewMode) return;
    setLastWeights({ ...lastWeights, [itemId]: { ...(lastWeights[itemId] || {}), [setIndex]: weight } });
  };

  const handleCheckSet = (itemId, setIndex) => {
    setCheckedSets(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), [setIndex]: true } }));
  };

  const handleSwap = (index, selectedSub = null) => {
    const list = [...exercisesToShow];
    const current = list[index];

    const subsList = [];
    if (current.substitutes && Array.isArray(current.substitutes)) subsList.push(...current.substitutes);
    else if (current.substitute) subsList.push(current.substitute);

    if (subsList.length === 0) return;

    const subTarget = selectedSub || subsList[0];

    const exName = current.exercise?.name || current.title || "Exercício";
    const subName = subTarget.name || subTarget.title;

    const doSwap = () => {
      const newMain = {
        ...current,
        exerciseId: subTarget.id || subTarget.exerciseId,
        exercise: subTarget,
        title: subName,
        videoUrl: subTarget.videoUrl || subTarget.exercise?.videoUrl,
        substitute: null,
        substitutes: [{ id: current.exerciseId, name: exName, videoUrl: current.videoUrl || current.exercise?.videoUrl }]
      };
      list[index] = newMain;
      setExercisesToShow(list);
    };

    if (Platform.OS === 'web') { if (window.confirm(`Trocar ${exName} por ${subName}?`)) doSwap(); }
    else { Alert.alert("Trocar Exercício", `Trocar ${exName} por ${subName}?`, [{ text: "Cancelar", style: "cancel" }, { text: "Trocar", onPress: doSwap }]); }
  };

  const submitFinish = async ({ rpe, feedbackText, rpeLabel, elapsedSeconds }) => {
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id, workoutId: workoutId, day: day, workoutName: (workoutName || 'TREINO').toUpperCase(), exercisesData: exercisesDone, duration: durationInMinutes, rpe: rpe, feedback: feedbackText })
      });

      const json = await res.json();

      if (res.ok) {
        // 🔒 Marca o guard de saída como "liberado" ANTES de navegar — replica a ordem
        // exata do original, onde isFinishingRef.current = true vinha primeiro no bloco
        // res.ok, evitando que o beforeRemove dispare o alerta de "treino em andamento"
        // durante a navegação de sucesso pro FinishScreen.
        onBeforeNavigateAway?.();

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

        navigation.navigate('FinishScreen', {
          workoutName: workoutName || "TREINO DO DIA",
          day: day,
          xp: json.xpGained || 150,
          duration: durationInMinutes,
          rpeLabel: rpeLabel,
          focus: focus
        });

        return { success: true };
      } else {
        if (Platform.OS === 'web') window.alert("Falha ao salvar no servidor.");
        else Alert.alert("Erro", "Falha ao salvar no servidor.");
        return { success: false };
      }
    } catch (e) {
      if (Platform.OS === 'web') window.alert("Sem conexão. Tente novamente quando a internet voltar.");
      else Alert.alert("Sem Conexão", "Sua internet caiu. O treino está salvo no rascunho, tente finalizar quando a conexão voltar.");
      return { success: false };
    } finally { setLoading(false); }
  };

  return {
    techGuide,
    loading,
    exercisesToShow,
    userData,
    userPlan,
    lastWeights,
    checkedSets,
    historyWeights,
    workoutModel,
    activeIntensityMultiplier,
    isIntensityMaskActive,
    hasSentInitialPhotos,
    fetchWorkoutData,
    handleSaveWeight,
    handleCheckSet,
    handleSwap,
    submitFinish,
  };
}