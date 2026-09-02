// src/components/DayWorkout/useDayWorkoutData.js
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getInitialTechGuide } from './techGuideData';
import { applyMaskToString, applyIntensityMaskToBlocks } from './workoutMaskUtils';
import { authHeaders, clearAuthToken } from '../../utils/authToken';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

const wrapWithTimestamp = (value) => ({ value, cachedAt: Date.now() });

// 🔥 Modificado: agora aceita ignorar o vencimento (TTL) se estivermos offline!
// Se a internet cair, a gente prefere mostrar um cache "vencido" do que uma tela em branco.
const readCache = (rawJson, ignoreTTL = false) => {
  if (!rawJson) return null;
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') return null;
    if ('cachedAt' in parsed) {
      const age = Date.now() - parsed.cachedAt;
      if (!ignoreTTL && age > CACHE_TTL_MS) return null;
      return parsed.value;
    }
    return ignoreTTL ? parsed : null; // Se for offline, aceita até cache antigo
  } catch (e) {
    return null;
  }
};

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
      if (!workoutId) return;

      const stored = await AsyncStorage.getItem('user');
      if (!stored) return;
      const user = JSON.parse(stored);
      setUserData(user);

      const dbPlan = user.plan || 'PREMIUM';
      setUserPlan(['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(dbPlan) ? dbPlan : 'PREMIUM');

      const coachIdToUse = user.coachId || user.id;
      let currentTechGuide = getInitialTechGuide(theme);

      // Chaves de Cache
      const sysVideoCacheKey = `@cached_system_tech_videos_${coachIdToUse}`;
      const customTechCacheKey = `@cached_techs_${coachIdToUse}`;
      const workoutCacheKey = `@cached_workout_full_${workoutId}_${day}`; // NOVO CACHE COMPLETO
      const historyCacheKey = `@cached_history_${workoutId}_${day}`;
      const draftKey = `draft_workout_${workoutId}_${day}`;

      // ==================================================================
      // 1. TENTA CARREGAR TUDO DO CACHE PRIMEIRO (MODO OFFLINE GARANTIDO)
      // ==================================================================
      if (!isPreviewMode) {
        try {
          // Técnicas fixas
          const cachedSysVideos = readCache(await AsyncStorage.getItem(sysVideoCacheKey), true);
          if (cachedSysVideos) {
            cachedSysVideos.forEach(v => {
              if (currentTechGuide[v.key]) currentTechGuide[v.key].videoUrl = v.videoUrl;
            });
          }

          // Técnicas customizadas
          const cachedCustomTechs = readCache(await AsyncStorage.getItem(customTechCacheKey), true);
          if (cachedCustomTechs) {
            cachedCustomTechs.forEach(t => {
              currentTechGuide[t.id] = {
                id: t.id, title: t.name, color: theme.accent, icon: 'flask-outline',
                desc: t.description || '', steps: t.steps, videoUrl: t.videoUrl || null, isCustom: true
              };
            });
          }
          setTechGuide(currentTechGuide);

          // Dados do Treino (Textos, Séries, Máscaras)
          const cachedWorkout = readCache(await AsyncStorage.getItem(workoutCacheKey), true);
          if (cachedWorkout && cachedWorkout.exercises) {
            setExercisesToShow(cachedWorkout.exercises);
            setWorkoutModel(cachedWorkout.workoutModel || 'CARGA');
            setActiveIntensityMultiplier(cachedWorkout.multiplier || 1.0);
            setIsIntensityMaskActive(cachedWorkout.isMaskActive || false);
            setHasSentInitialPhotos(cachedWorkout.hasSentInitialPhotos ?? true);
          } else {
            // Fallback para o cache antigo caso o aluno ainda não tenha salvo no novo formato
            const oldWorkoutCache = readCache(await AsyncStorage.getItem(`@cached_workout_${workoutId}_${day}`), true);
            if (oldWorkoutCache) setExercisesToShow(oldWorkoutCache);
          }

          // Histórico e Rascunho
          const histCache = await AsyncStorage.getItem(historyCacheKey);
          if (histCache) setHistoryWeights(JSON.parse(histCache));

          const draft = await AsyncStorage.getItem(draftKey);
          if (draft) {
            const parsedDraft = JSON.parse(draft);
            if (parsedDraft.weights) {
              setLastWeights(parsedDraft.weights);
              setCheckedSets(parsedDraft.checks || {});
            } else {
              setLastWeights(parsedDraft);
            }
          }
        } catch (e) {
          console.log('Erro ao carregar cache offline', e);
        }
      }

      // ==================================================================
      // 2. TENTA BUSCAR DADOS FRESCOS DA INTERNET (ATUALIZA O CACHE)
      // ==================================================================
      try {
        // 🔒 As rotas abaixo (system-technique-videos, techniques, workout,
        // checkin, workout/finish) passaram a exigir login verificado (JWT) e
        // esse arquivo nunca tinha sido atualizado pra mandar o token — por
        // isso vinham 401 em silêncio (o treino caía pro cache antigo) e o
        // "FIM DE TREINO" dava "Falha ao salvar no servidor".
        const authHdrs = await authHeaders();
        const sysVideosRes = await fetch(`https://fitos-final.onrender.com/api/admin/system-technique-videos?coachId=${coachIdToUse}`, { headers: { ...authHdrs } });
        if (sysVideosRes.ok) {
          const sysVideos = await sysVideosRes.json();
          sysVideos.forEach(v => {
            if (currentTechGuide[v.key]) currentTechGuide[v.key] = { ...currentTechGuide[v.key], videoUrl: v.videoUrl };
          });
          if (!isPreviewMode) await AsyncStorage.setItem(sysVideoCacheKey, JSON.stringify(wrapWithTimestamp(sysVideos)));
        }

        const techRes = await fetch(`https://fitos-final.onrender.com/api/admin/techniques?coachId=${coachIdToUse}`, { headers: { ...authHdrs } });
        if (techRes.ok) {
          const customTechs = await techRes.json();
          customTechs.forEach(t => {
            currentTechGuide[t.id] = {
              id: t.id, title: t.name, color: theme.accent, icon: 'flask-outline',
              desc: t.description || '', steps: t.steps, videoUrl: t.videoUrl || null, isCustom: true
            };
          });
          if (!isPreviewMode) await AsyncStorage.setItem(customTechCacheKey, JSON.stringify(wrapWithTimestamp(customTechs)));
        }
        setTechGuide({ ...currentTechGuide });

        const [resWorkout, resCheckin] = await Promise.all([
          fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&workoutId=${workoutId}&t=${Date.now()}`, { headers: { ...authHdrs } }),
          isPreviewMode ? Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 'mock' }]) }) : fetch(`https://fitos-final.onrender.com/api/checkin?userId=${user.id}`, { headers: { ...authHdrs } })
        ]);

        if (resWorkout.ok) {
          const data = await resWorkout.json();
          
          let hasPhotos = true;
          if (resCheckin.ok) {
            const checkinsData = await resCheckin.json();
            hasPhotos = Array.isArray(checkinsData) && checkinsData.length > 0;
            setHasSentInitialPhotos(hasPhotos);
          }

          if (data && data.exercises) {
            const wModel = data.workoutModel || 'CARGA';
            setWorkoutModel(wModel);

            let multiplier = data.intensityMultiplier || 1.0;
            let isMaskActive = false;

            if (multiplier !== 1.0 && data.intensityEndDate) {
              const expirationDate = new Date(data.intensityEndDate);
              if (new Date() <= expirationDate) isMaskActive = true;
              else multiplier = 1.0;
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

                realBlocks = realBlocks.map(block => {
                  let newBlock = { ...block };
                  if (newBlock.customTechniqueId) {
                    const nomeDaTecnica = currentTechGuide[newBlock.customTechniqueId]?.title || 'Técnica Customizada';
                    newBlock.technique = nomeDaTecnica;
                  }
                  return newBlock;
                });

                if (realBlocks[0]?.technique) realTech = realBlocks[0].technique;

                if (isMaskActive && wModel === 'CARGA') {
                  const masked = applyIntensityMaskToBlocks(realBlocks, multiplier, realObs);
                  realBlocks = masked.blocks;
                  realObs = masked.observation;
                }

                return { ...item, blocks: realBlocks, technique: realTech, observation: realObs };
              });

            setExercisesToShow(filteredExercises);

            if (data.lastWeights) {
              let maskedWeights = { ...data.lastWeights };
              if (isMaskActive && wModel === 'CARGA') {
                Object.keys(maskedWeights).forEach(exId => {
                  Object.keys(maskedWeights[exId]).forEach(setIdx => {
                    let originalWeight = maskedWeights[exId][setIdx];
                    maskedWeights[exId][setIdx] = applyMaskToString(originalWeight, multiplier);
                  });
                });
              }
              setHistoryWeights(maskedWeights);
              if (!isPreviewMode) await AsyncStorage.setItem(historyCacheKey, JSON.stringify(maskedWeights));
            }

            if (!isPreviewMode) {
              const fullCacheData = {
                exercises: filteredExercises,
                workoutModel: wModel,
                multiplier,
                isMaskActive,
                hasSentInitialPhotos: hasPhotos
              };
              await AsyncStorage.setItem(workoutCacheKey, JSON.stringify(wrapWithTimestamp(fullCacheData)));
            }
          }
        }
      } catch (e) {
        // Fetch falhou (SEM INTERNET). Como já carregamos do cache na Etapa 1, a tela não ficará em branco.
        console.log('Sem internet. Mantendo os textos do treino que foram carregados no cache offline.');
      }

    } catch (error) {
      console.error("Erro fatal no carregamento do treino:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPreviewMode) return;

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
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ userId: userData.id, workoutId: workoutId, day: day, workoutName: (workoutName || 'TREINO').toUpperCase(), exercisesData: exercisesDone, duration: durationInMinutes, rpe: rpe, feedback: feedbackText })
      });

      const json = await res.json();

      if (res.ok) {
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
      } else if (res.status === 401) {
        // 🔥 CORRIGIDO: alunos que fizeram login ANTES da rota exigir token
        // (JWT) nunca tinham um authToken salvo -- ficavam presos aqui pra
        // sempre em "Falha ao salvar no servidor", sem saber que precisavam
        // logar de novo (o app nunca pedia, achava que já estavam logados
        // por causa do 'user' salvo). O rascunho do treino (pesos/reps já
        // preenchidos) fica salvo em draftKey e não depende de login, então
        // ao logar de novo o aluno volta pro mesmo dia e finaliza sem perder
        // nada.
        const msg = "Sua sessão expirou. Faça login novamente pra continuar -- os pesos e séries que você já preencheu neste treino não serão perdidos.";
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert("Sessão expirada", msg);
        await AsyncStorage.multiRemove(['user', 'token', 'role', 'original_admin_user', 'original_admin_role']);
        await clearAuthToken();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return { success: false };
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