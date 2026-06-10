// src/hooks/useRunning.js
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'https://fitos-final.onrender.com';

const BLOCK_LABELS = {
  1: 'Adaptação',
  2: 'Resistência Base',
  3: 'Sustentar Ritmo',
  4: 'Pré-Performance',
  5: 'O 5KM',
};

const SESSION_DAYS = ['QUARTA', 'SEXTA', 'DOMINGO'];

export default function useRunning() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userId, setUserId] = useState(null);
  const [hasRunningModule, setHasRunningModule] = useState(false);

  const [protocol, setProtocol] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentBlock, setCurrentBlock] = useState(1);
  const [logs, setLogs] = useState([]);

  // Modal de sessão
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null); // { day, week, block, sessionData }

  // Modal de protocolo completo (leitura)
  const [protocolModalVisible, setProtocolModalVisible] = useState(false);

  // Form de registro
  const [saving, setSaving] = useState(false);

  const fetchRunning = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);
      setUserId(user.id);

      // Checa se o módulo está ativo para este aluno
      if (!user.runningModule) {
        setHasRunningModule(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setHasRunningModule(true);

      const res = await fetch(`${API}/api/running/${user.id}&t=${Date.now()}`);
      if (!res.ok) { setLoading(false); setRefreshing(false); return; }

      const data = await res.json();

      if (data.protocol) {
        setProtocol(data.protocol);
        setCurrentWeek(data.currentWeek || 1);
        setCurrentBlock(data.currentBlock || 1);
        setLogs(data.protocol.logs || []);
      } else {
        setProtocol(null);
        setLogs([]);
      }
    } catch (e) {
      console.log('[useRunning] fetchRunning error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleOpenSession = (sessionDay) => {
    if (!protocol) return;
    setSelectedSession({
      day: sessionDay,
      week: currentWeek,
      block: currentBlock,
    });
    setSessionModalVisible(true);
  };

  const handleSaveLog = async ({ durationMinutes, distanceKm, avgPace, notes, rpe }) => {
    if (!userId || !protocol || !selectedSession) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/running/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          protocolId: protocol.id,
          week: selectedSession.week,
          block: selectedSession.block,
          sessionDay: selectedSession.day,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
          distanceKm: distanceKm ? parseFloat(distanceKm.replace(',', '.')) : null,
          avgPace: avgPace || null,
          notes: notes || null,
          rpe: rpe ? parseInt(rpe) : null,
        }),
      });

      if (res.ok) {
        setSessionModalVisible(false);
        setSelectedSession(null);
        fetchRunning();
        if (Platform.OS === 'web') window.alert('✅ Treino registrado!');
        else Alert.alert('✅ Treino registrado!', 'Continue assim, bora pro próximo! 💪');
      } else {
        if (Platform.OS === 'web') window.alert('Erro ao salvar. Tente novamente.');
        else Alert.alert('Erro', 'Não foi possível salvar o treino.');
      }
    } catch (e) {
      console.log('[useRunning] handleSaveLog error:', e);
    } finally {
      setSaving(false);
    }
  };

  // Verifica se uma sessão da semana atual já tem log
  const isSessionDone = (sessionDay) => {
    return logs.some(
      l => l.week === currentWeek && l.sessionDay === sessionDay
    );
  };

  // Último log registrado (para exibir pace médio etc.)
  const lastLog = logs.length > 0 ? logs[0] : null;

  // Progresso geral: semanas concluídas / 8
  const progressPct = Math.min(((currentWeek - 1) / 8) * 100, 100);

  return {
    loading, refreshing, setRefreshing, fetchRunning,
    hasRunningModule, protocol, currentWeek, currentBlock,
    logs, lastLog, progressPct,
    BLOCK_LABELS, SESSION_DAYS,
    sessionModalVisible, setSessionModalVisible,
    selectedSession, setSelectedSession,
    protocolModalVisible, setProtocolModalVisible,
    saving,
    handleOpenSession, handleSaveLog, isSessionDone,
  };
}