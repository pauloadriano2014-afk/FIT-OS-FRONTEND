// src/components/ExerciseCard/useRestTimer.js
import { useState, useEffect, useRef } from 'react';
import { Alert, Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

// Handler de notificação precisa ser registrado uma vez, fora do componente —
// preserva o comportamento original (estava no topo do módulo ExerciseCard.js).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Hook responsável pelo cronômetro de descanso entre séries:
// - decide tempo/mensagem/voz a tocar por tipo de técnica (DROPSET, RESTPAUSE, GVT, etc)
// - conta os segundos, recalculando corretamente se o app for para background
// - dispara notificação push local quando o app não está em foco (mobile only)
// - finaliza o descanso tocando o alerta de voz ou o aviso de treino finalizado
//
// Recebe playVoiceAlert/safeStopVoice do useVoiceAlert (chamado antes deste no
// componente) como argumentos simples — não há necessidade de refs/pontes porque
// são funções normais passadas no momento da criação do hook, sem dependência
// circular: useRestTimer não precisa que useVoiceAlert "já exista" de forma especial,
// só recebe duas funções como qualquer outro parâmetro.
export default function useRestTimer({
  standardRestTime,
  biSetType,
  isLastExercise,
  isVoiceEnabled,
  calculateTotalSets,
  playVoiceAlert,
  safeStopVoice,
}) {
  const [seconds, setSeconds] = useState(standardRestTime);
  const [isResting, setIsResting] = useState(false);
  const [activeSetIndex, setActiveSetIndex] = useState(null);
  const [timerMessage, setTimerMessage] = useState({ title: 'RECUPERANDO', desc: 'Respire e prepare-se.' });

  const notifIdRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const backgroundTimestamp = useRef(null);
  const backgroundSeconds = useRef(null);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
    };
    if (Platform.OS !== 'web') requestPermissions();
  }, []);

  // Recalcula o tempo restante corretamente quando o app volta do background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isResting && backgroundTimestamp.current !== null) {
          const elapsed = Math.floor((Date.now() - backgroundTimestamp.current) / 1000);
          const newSeconds = backgroundSeconds.current - elapsed;
          if (newSeconds <= 0) setSeconds(0);
          else setSeconds(newSeconds);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        if (isResting) {
          backgroundTimestamp.current = Date.now();
          backgroundSeconds.current = seconds;
        }
      }
      appState.current = nextAppState;
    });
    return () => { subscription.remove(); };
  }, [isResting, seconds]);

  async function cancelNotification() {
    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      notifIdRef.current = null;
    }
  }

  // Contagem regressiva + finalização do descanso
  useEffect(() => {
    let interval = null;
    if (isResting && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && isResting) {
      setIsResting(false);
      clearInterval(interval);
      cancelNotification();
      const isLastOfAll = (activeSetIndex === calculateTotalSets() && isLastExercise);
      if (isLastOfAll && biSetType !== 'start') {
        if (Platform.OS === 'web') window.alert("🔥 TREINO FINALIZADO!\nParabéns!");
        else Alert.alert("🔥 TREINO FINALIZADO!", "Parabéns!");
      } else if (biSetType !== 'start') {
        playVoiceAlert('alerta_fim_descanso');
      }
    }
    return () => clearInterval(interval);
  }, [isResting, seconds, activeSetIndex, isLastExercise, biSetType, isVoiceEnabled]);

  const startRestTimer = async (setNum, type = 'NORMAL', blockRestTime, blockTechKey, isLastSet = false) => {
    await safeStopVoice();
    await cancelNotification();
    if (biSetType === 'start') {
      setTimerMessage({ title: '🔥 SEM DESCANSO!', desc: 'Vá direto para o exercício de baixo agora!' });
      setSeconds(3); setActiveSetIndex(setNum); setIsResting(true);
      playVoiceAlert('alerta_biset');
      return;
    }
    let timeToRest = parseInt(blockRestTime) || standardRestTime;
    let message = { title: 'RECUPERANDO', desc: 'Relaxe e recupere o fôlego.' };
    let voiceToPlay = 'alerta_descanso';
    let isTechniqueForced = false;
    if (blockTechKey === '1_5_REPS' || blockTechKey === 'TUT') voiceToPlay = null;
    if (type === 'CLUSTER_INTRA') {
      timeToRest = 15; message = { title: 'PAUSA CLUSTER', desc: '15s de respiro. Mantenha o peso!' }; voiceToPlay = 'alerta_cluster'; isTechniqueForced = true;
    } else if (blockTechKey === 'RESTPAUSE') {
      timeToRest = 20; message = { title: 'REST-PAUSE (20s)', desc: 'Respire rápido! Falhe de novo com a mesma carga.' }; voiceToPlay = 'alerta_restpause'; isTechniqueForced = true;
    } else if (blockTechKey === 'DROPSET') {
      message = { title: 'SÉRIE FINALIZADA', desc: 'Recupere-se para a próxima.' }; voiceToPlay = 'alerta_dropset';
    } else if (blockTechKey === 'GVT') {
      timeToRest = 60; message = { title: 'GVT: TEMPO RÍGIDO', desc: 'Respeite os 60s exatos.' }; voiceToPlay = 'alerta_descanso';
    }
    if (isLastSet && !isTechniqueForced) {
      message = { title: 'EXERCÍCIO CONCLUÍDO', desc: isLastExercise ? 'Você finalizou o treino!' : 'Prepare-se para o próximo exercício da lista.' };
      voiceToPlay = isLastExercise ? 'alerta_treino_finalizado' : 'alerta_fim_exercicio';
    }
    setTimerMessage(message); setSeconds(timeToRest); setActiveSetIndex(setNum); setIsResting(true);
    if (voiceToPlay) playVoiceAlert(voiceToPlay);
    if (timeToRest > 0 && Platform.OS !== 'web') {
      try {
        notifIdRef.current = await Notifications.scheduleNotificationAsync({
          content: { title: "🔥 Fim do Descanso!", body: "Acabou a moleza. Volte para o app e faça acontecer!", sound: true },
          trigger: { seconds: timeToRest },
        });
      } catch (e) {}
    }
  };

  // Usado pelo botão "PULAR"/"FECHAR" do modal de descanso
  const skipRest = async () => {
    setSeconds(0);
    await safeStopVoice();
    await cancelNotification();
  };

  return {
    seconds,
    isResting,
    activeSetIndex,
    timerMessage,
    startRestTimer,
    skipRest,
  };
}