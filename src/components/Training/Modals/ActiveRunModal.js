// src/components/Training/Modals/ActiveRunModal.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, AppState } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ActiveRunModal({ 
  visible, onClose, session, blockData, theme, 
  mode, // 'free' | 'protocol' | 'custom'
  customPhases, // Array de fases montadas pelo aluno
  onFinishRun 
}) {
  
  // 🔥 MODO TRÍPLICE: Identifica exatamente o que o motor precisa rodar
  const isFreeMode = mode === 'free';
  const isCustomMode = mode === 'custom';
  const isProtocolMode = mode === 'protocol' || (!isFreeMode && !isCustomMode);

  // Extrai as fases baseadas no modo atual
  let executablePhases = [];
  let sessionTitle = '';

  if (isProtocolMode) {
    const sessionData = blockData?.sessions?.[session?.day];
    executablePhases = sessionData?.phases?.filter(p => p.fase !== 'Total' && p.fase !== 'Repetir') || [];
    sessionTitle = sessionData?.title || 'Treino do Dia';
  } else if (isCustomMode) {
    executablePhases = customPhases || [];
    sessionTitle = 'Treino Personalizado';
  } else {
    sessionTitle = 'Treino Aberto (Livre)';
  }

  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [seconds, setSeconds] = useState(0); 
  const [isPaused, setIsPaused] = useState(false);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);

  const appState = useRef(AppState.currentState);
  const backgroundTimestamp = useRef(null);
  const backgroundSeconds = useRef(null);
  const timerRef = useRef(null);

  const currentPhase = isFreeMode ? null : executablePhases[currentPhaseIdx];

  // Helper para extrair segundos
  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return 60;
    const num = parseInt(timeStr.replace(/[^0-9]/g, ''));
    if (timeStr.toLowerCase().includes('min') || timeStr.toLowerCase().includes('m')) return num * 60;
    return num;
  };

  // Inicialização
  useEffect(() => {
    if (visible) {
      if (isFreeMode) {
        setSeconds(0);
        setTotalElapsedTime(0);
        setIsPaused(false);
      } else if (currentPhase) {
        setSeconds(parseTimeToSeconds(currentPhase.tempo));
      }
    }
  }, [currentPhaseIdx, visible, isFreeMode, mode]);

  // Cronômetro Ativo
  useEffect(() => {
    if (visible && !isPaused) {
      timerRef.current = setInterval(() => {
        if (isFreeMode) {
          setSeconds(s => s + 1);
        } else {
          setSeconds(s => {
            if (s <= 1) {
              setTimeout(handleNextPhase, 0); 
              return 0;
            }
            return s - 1;
          });
        }
        setTotalElapsedTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [visible, isPaused, isFreeMode, currentPhaseIdx]);

  // Proteção Background (App minimizado ou tela bloqueada)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (visible && !isPaused && backgroundTimestamp.current !== null) {
          const elapsed = Math.floor((Date.now() - backgroundTimestamp.current) / 1000);
          
          if (isFreeMode) {
            setSeconds(backgroundSeconds.current + elapsed);
          } else {
            const newSeconds = backgroundSeconds.current - elapsed;
            if (newSeconds <= 0) handleNextPhase();
            else setSeconds(newSeconds);
          }
          setTotalElapsedTime(t => t + elapsed);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        if (visible && !isPaused) {
          backgroundTimestamp.current = Date.now();
          backgroundSeconds.current = seconds;
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [visible, isPaused, seconds, currentPhaseIdx, isFreeMode]);

  const handleNextPhase = () => {
    if (isFreeMode) return;
    if (currentPhaseIdx < executablePhases.length - 1) {
      setCurrentPhaseIdx(c => c + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    clearInterval(timerRef.current);
    const finalMinutes = Math.round(totalElapsedTime / 60) || 1;
    onFinishRun(finalMinutes);
    resetStates();
  };

  const resetStates = () => {
    setCurrentPhaseIdx(0);
    setSeconds(0);
    setIsPaused(false);
    setTotalElapsedTime(0);
  };

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    if (h > 0 || isFreeMode) return `${h > 0 ? h + ':' : ''}${m}:${s}`;
    return `${m}:${s}`;
  };

  if (!visible) return null;
  if (!isFreeMode && !currentPhase) return null;

  // Cor principal dependendo do modo
  const colorMode = isFreeMode ? '#3b82f6' : isCustomMode ? '#AF52DE' : '#22c55e';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          
          <Text style={[styles.headerLabel, { color: colorMode }]}>
            {isFreeMode ? 'CRONÔMETRO LIVRE' : isCustomMode ? 'TREINO DO ALUNO' : 'TREINO DO COACH'}
          </Text>
          
          <Text style={[styles.sessionTitle, { color: theme.text }]}>
            {isFreeMode ? sessionTitle : `${sessionTitle} · Etapa ${currentPhaseIdx + 1}/${executablePhases.length}`}
          </Text>

          <View style={[styles.phaseFocusCard, { backgroundColor: theme.bg }]}>
            {!isFreeMode && <Text style={styles.phaseBadge}>FASE ATUAL</Text>}
            <Text style={[styles.phaseName, { color: colorMode }]}>
              {isFreeMode ? 'CORRENDO' : currentPhase.fase.toUpperCase()}
            </Text>
            <Text style={[styles.timerText, { color: theme.text }]}>{formatTimer(seconds)}</Text>
          </View>

          {/* Oculta os alvos de Esteira/Rua se for um treino montado pelo aluno (já que ele não cadastra pace alvo) */}
          {isProtocolMode && (
            <View style={styles.targetsRow}>
              <View style={[styles.targetBox, { backgroundColor: theme.bg }]}>
                <MaterialCommunityIcons name="speedometer" size={18} color="#f59e0b" />
                <Text style={styles.targetLabel}>ESTEIRA</Text>
                <Text style={[styles.targetValue, { color: theme.text }]}>{currentPhase.esteira}</Text>
              </View>
              <View style={[styles.targetBox, { backgroundColor: theme.bg }]}>
                <MaterialCommunityIcons name="map-marker-distance" size={18} color="#3b82f6" />
                <Text style={styles.targetLabel}>RUA (PACE)</Text>
                <Text style={[styles.targetValue, { color: theme.text }]}>{currentPhase.rua}</Text>
              </View>
            </View>
          )}

          <View style={styles.controlsRow}>
            <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.bg }]} onPress={() => setIsPaused(!isPaused)}>
              <MaterialCommunityIcons name={isPaused ? "play" : "pause"} size={28} color={theme.text} />
              <Text style={[styles.controlBtnText, { color: theme.textSecondary }]}>{isPaused ? "Retomar" : "Pausar"}</Text>
            </TouchableOpacity>

            {!isFreeMode && (
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.bg }]} onPress={handleNextPhase}>
                <MaterialCommunityIcons name="skip-next" size={28} color={theme.text} />
                <Text style={[styles.controlBtnText, { color: theme.textSecondary }]}>Pular Fase</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={[styles.finishBtn, { backgroundColor: colorMode }]} onPress={handleComplete}>
            <MaterialCommunityIcons name="stop-circle" size={22} color="#000" />
            <Text style={styles.finishBtnText}>FINALIZAR CORRIDA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelLink} onPress={() => { resetStates(); onClose(); }}>
            <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 13 }}>Abandonar Corrida</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  container: { borderRadius: 28, padding: 24, alignItems: 'center', width: '100%', maxWidth: 400, alignSelf: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  sessionTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  phaseFocusCard: { width: '100%', padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 16 },
  phaseBadge: { fontSize: 9, fontWeight: '900', opacity: 0.5, letterSpacing: 1, marginBottom: 6 },
  phaseName: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  timerText: { fontSize: 56, fontWeight: '900', marginTop: 10, fontVariant: ['tabular-nums'] },
  targetsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  targetBox: { flex: 1, padding: 14, borderRadius: 16, alignItems: 'center' },
  targetLabel: { fontSize: 9, fontWeight: '900', color: '#888', marginTop: 4, marginBottom: 2 },
  targetValue: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  controlsRow: { flexDirection: 'row', gap: 16, marginBottom: 24, width: '100%' },
  controlBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  controlBtnText: { fontSize: 13, fontWeight: '700' },
  finishBtn: { width: '100%', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  finishBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  cancelLink: { marginTop: 16, padding: 8 }
});