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

  const [anamnese, setAnamnese] = useState(null);
  const [anamneseModalVisible, setAnamneseModalVisible] = useState(false);

  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [protocolModalVisible, setProtocolModalVisible] = useState(false);
  const [freeRunModalVisible, setFreeRunModalVisible] = useState(false);
  const [paceCalculatorModalVisible, setPaceCalculatorModalVisible] = useState(false);
  const [activeRunModalVisible, setActiveRunModalVisible] = useState(false);
  
  const [customRunPlannerModalVisible, setCustomRunPlannerModalVisible] = useState(false);
  const [customPhases, setCustomPhases] = useState([]);
  const [customWorkouts, setCustomWorkouts] = useState([]); 
  
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeRunMode, setActiveRunMode] = useState('free');
  const [saving, setSaving] = useState(false);
  const [submittingAnamnese, setSubmittingAnamnese] = useState(false);

  const [finishedRunDuration, setFinishedRunDuration] = useState(null);

  const fetchRunning = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { setLoading(false); return; }
      const user = JSON.parse(stored);
      setUserId(user.id);

      setHasRunningModule(!!user.runningModule);

      const storedCustoms = await AsyncStorage.getItem(`@custom_runs_${user.id}`);
      if (storedCustoms) {
        setCustomWorkouts(JSON.parse(storedCustoms));
      }

      const res = await fetch(`${API}/api/running/${user.id}?t=${Date.now()}`);
      if (!res.ok) { setLoading(false); setRefreshing(false); return; }

      const data = await res.json();

      if (data.anamnese) setAnamnese(data.anamnese);

      if (data.protocol) {
        setProtocol(data.protocol);
        setCurrentWeek(data.currentWeek || 1);
        setCurrentBlock(data.currentBlock || 1);
        setLogs(data.logs || data.protocol.logs || []);
      } else {
        setProtocol(null);
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.log('[useRunning] fetchRunning error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSaveCustomWorkout = async (workout) => {
    const updated = [workout, ...customWorkouts];
    setCustomWorkouts(updated);
    if (userId) {
      await AsyncStorage.setItem(`@custom_runs_${userId}`, JSON.stringify(updated));
    }
    if (Platform.OS === 'web') window.alert('Treino salvo na sua biblioteca!');
    else Alert.alert('Salvo!', 'Seu treino foi guardado e está pronto para uso.');
  };

  const handleDeleteCustomWorkout = async (id) => {
    const updated = customWorkouts.filter(w => w.id !== id);
    setCustomWorkouts(updated);
    if (userId) {
      await AsyncStorage.setItem(`@custom_runs_${userId}`, JSON.stringify(updated));
    }
  };

  // 🔥 NOVA FUNÇÃO: Excluir Histórico (Comunica com a API)
  const handleDeleteLog = async (logId) => {
    const execDelete = async () => {
      setSaving(true);
      try {
        const res = await fetch(`${API}/api/running/log/${logId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchRunning(); // Recarrega os dados pra atualizar gráficos e listas
        } else {
          if (Platform.OS === 'web') window.alert('Erro ao excluir treino.');
          else Alert.alert('Erro', 'Não foi possível excluir o treino.');
        }
      } catch (e) {
        console.log('[useRunning] handleDeleteLog error:', e);
      } finally {
        setSaving(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja excluir este treino do histórico? Essa ação afetará seus gráficos e recordes.')) {
        execDelete();
      }
    } else {
      Alert.alert('Excluir Treino', 'Deseja excluir este treino do histórico? Seus gráficos e recordes serão recalculados.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: execDelete }
      ]);
    }
  };

  const handleSubmitAnamnese = async (formData) => {
    if (!anamnese?.token) return;
    setSubmittingAnamnese(true);
    try {
      const res = await fetch(`${API}/api/running/anamnese/${anamnese.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setAnamneseModalVisible(false);
        setAnamnese(prev => ({ ...prev, filled: true }));
        if (Platform.OS === 'web') window.alert('✅ Anamnese enviada! O Coach Paulo vai montar o seu protocolo em breve.');
        else Alert.alert('✅ Enviado!', 'O Coach Paulo vai montar o seu protocolo de corrida em breve. 🏃');
      } else {
        if (Platform.OS === 'web') window.alert('Erro ao enviar. Tente novamente.');
        else Alert.alert('Erro', 'Não foi possível enviar. Tente novamente.');
      }
    } catch (e) {
      console.log('[useRunning] handleSubmitAnamnese error:', e);
    } finally {
      setSubmittingAnamnese(false);
    }
  };

  const handleOpenSession = (sessionDay) => {
    if (!protocol) return;
    setSelectedSession({ day: sessionDay, week: currentWeek, block: currentBlock });
    setFinishedRunDuration(null); 
    setSessionModalVisible(true);
  };

  const handleStartActiveRun = (sessionDay) => {
    if (!sessionDay) {
      setActiveRunMode('free');
      setSelectedSession(null);
    } else {
      setActiveRunMode('protocol');
      setSelectedSession({ day: sessionDay, week: currentWeek, block: currentBlock });
    }
    setActiveRunModalVisible(true);
  };

  const handleStartCustomRun = (workout) => {
    setCustomPhases(workout.phases);
    setActiveRunMode('custom');
    setSelectedSession(null);
    setActiveRunModalVisible(true);
  };

  const handleFinishActiveRun = (minutesAccumulated) => {
    setActiveRunModalVisible(false);
    setFinishedRunDuration(minutesAccumulated);
    
    setTimeout(() => {
      if (activeRunMode === 'free' || activeRunMode === 'custom') {
        setFreeRunModalVisible(true);
      } else {
        setSessionModalVisible(true);
      }
    }, 400);
  };

  const handleSaveLog = async (logData) => {
    const isFreeRun = logData.isFreeRun || activeRunMode === 'free' || activeRunMode === 'custom';
    
    if (!userId) return;
    if (!isFreeRun && (!protocol || !selectedSession)) return;

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/running/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          protocolId: protocol?.id || null, 
          week: isFreeRun ? null : selectedSession.week,
          block: isFreeRun ? null : selectedSession.block,
          sessionDay: isFreeRun ? 'AVULSO' : selectedSession.day,
          durationMinutes: logData.durationMinutes ? parseInt(logData.durationMinutes) : null,
          distanceKm: logData.distanceKm ? parseFloat(String(logData.distanceKm).replace(',', '.')) : null,
          avgPace: logData.avgPace || null,
          notes: logData.notes || null,
          rpe: logData.rpe ? parseInt(logData.rpe) : null,
        }),
      });

      if (res.ok) {
        setSessionModalVisible(false);
        setFreeRunModalVisible(false);
        setSelectedSession(null);
        setFinishedRunDuration(null); 
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

  const isSessionDone = (sessionDay) => {
    return logs.some(l => l.week === currentWeek && l.sessionDay === sessionDay);
  };

  const lastLog = logs.length > 0 ? logs[0] : null;
  const progressPct = Math.min(((currentWeek - 1) / 8) * 100, 100);

  const hasAnamnese = !!anamnese;
  const anamnesePending = hasAnamnese && !anamnese?.filled;

  return {
    loading, refreshing, setRefreshing, fetchRunning,
    hasRunningModule, protocol, currentWeek, currentBlock,
    logs, lastLog, progressPct,
    BLOCK_LABELS, SESSION_DAYS,
    
    anamnese, anamnesePending, hasAnamnese,
    anamneseModalVisible, setAnamneseModalVisible,
    submittingAnamnese, handleSubmitAnamnese,
    
    sessionModalVisible, setSessionModalVisible,
    protocolModalVisible, setProtocolModalVisible,
    freeRunModalVisible, setFreeRunModalVisible,
    paceCalculatorModalVisible, setPaceCalculatorModalVisible,
    activeRunModalVisible, setActiveRunModalVisible,
    
    customRunPlannerModalVisible, setCustomRunPlannerModalVisible,
    customPhases, customWorkouts,
    handleSaveCustomWorkout, handleDeleteCustomWorkout,
    
    selectedSession, setSelectedSession,
    saving, activeRunMode, finishedRunDuration, setFinishedRunDuration,
    
    handleOpenSession, handleSaveLog, handleDeleteLog, isSessionDone, // 🔥 handleDeleteLog exportado
    handleStartActiveRun, handleStartCustomRun, handleFinishActiveRun
  };
}