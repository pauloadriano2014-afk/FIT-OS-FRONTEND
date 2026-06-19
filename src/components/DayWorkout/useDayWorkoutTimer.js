// src/components/DayWorkout/useDayWorkoutTimer.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform, Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hook responsável por todo o ciclo de vida do cronômetro do treino:
// - sincroniza com o horário salvo no AsyncStorage ao montar/focar
// - escuta AppState (background -> active) pra recalcular o tempo decorrido
// - conta os segundos enquanto isTimerRunning estiver true
// - bloqueia a saída da tela (beforeRemove) se o cronômetro estiver rodando
//
// 🔥 MODO ESPIÃO: quando isPreviewMode é true, o cronômetro roda só em memória
// (sem AsyncStorage, sem listener de AppState, sem bloqueio de saída) — exatamente
// como no comportamento original.
export default function useDayWorkoutTimer({
  workoutId,
  day,
  isPreviewMode,
  navigation,
}) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const appState = useRef(AppState.currentState);
  const isFinishingRef = useRef(false);

  // Guard de saída: avisa o aluno se ele tentar saltar fora com o treino rodando
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

  // Sincroniza o cronômetro com o horário salvo (ou inicia automático no modo espião).
  // Chamado pela screen via useEffect, depois que data.loading/data.exercisesToShow
  // já existem — não é um efeito interno do hook porque depende de dados que vêm
  // de outro hook (useDayWorkoutData), e não devem ser parâmetros de criação aqui.
  const syncWithWorkoutData = useCallback((loading, exercisesToShow) => {
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
  }, [workoutId, day, isPreviewMode]);

  // Recalcula o tempo decorrido quando o app volta do background
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

  // Contagem em si
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => { setElapsedSeconds(prev => prev + 1); }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const executeStartTimer = async () => {
    if (!isPreviewMode) await AsyncStorage.setItem(`@workout_start_${workoutId}_${day}`, Date.now().toString());
    setIsTimerRunning(true);
  };

  // Marca o guard de saída como "liberado" — usado ANTES de navigation.navigate
  // dentro do submitFinish, replicando a ordem exata do código original onde
  // isFinishingRef.current = true vinha primeiro, evitando que o beforeRemove
  // dispare o alerta de "treino em andamento" durante a navegação de sucesso.
  const markFinishing = () => {
    isFinishingRef.current = true;
  };

  // Usado pelo submitFinish pra parar o cronômetro de fato (zerar o visual),
  // chamado depois que a navegação de sucesso já foi disparada.
  const stopTimerAfterFinish = () => {
    isFinishingRef.current = true;
    setIsTimerRunning(false);
    setElapsedSeconds(0);
  };

  return {
    isTimerRunning,
    elapsedSeconds,
    executeStartTimer,
    stopTimerAfterFinish,
    markFinishing,
    syncWithWorkoutData,
  };
}