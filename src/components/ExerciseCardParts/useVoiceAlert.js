// src/components/ExerciseCard/useVoiceAlert.js
import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

// Mapa de tipo de alerta -> arquivo de áudio. Mantido como função (não objeto
// estático no topo do módulo) porque require() de assets precisa ser resolvido
// em tempo de bundle, exatamente como estava no arquivo original.
const getAudioResource = (type) => {
  switch (type) {
    case 'alerta_descanso': return require('../../../assets/audio/alerta_descanso.m4a');
    case 'alerta_fim_descanso': return require('../../../assets/audio/alerta_fim_descanso.m4a');
    case 'alerta_fim_exercicio': return require('../../../assets/audio/alerta_fim_exercicio.m4a');
    case 'alerta_biset': return require('../../../assets/audio/alerta_biset.m4a');
    case 'alerta_restpause': return require('../../../assets/audio/alerta_restpause.m4a');
    case 'alerta_cluster': return require('../../../assets/audio/alerta_cluster.m4a');
    case 'alerta_dropset': return require('../../../assets/audio/alerta_dropset.m4a');
    case 'alerta_treino_finalizado': return require('../../../assets/audio/alerta_treino_finalizado.m4a');
    default: return undefined;
  }
};

// Hook responsável pelo áudio de alerta de voz (coach falando "descanso",
// "fim do exercício", etc). isVoiceEnabled é controlado fora (vem da tela
// DayWorkoutScreen via useTechVoice), aqui só tocamos/paramos o som.
export default function useVoiceAlert(isVoiceEnabled) {
  const [voiceSound, setVoiceSound] = useState(null);

  // Garante unload ao desmontar ou troca de som — preserva o comportamento
  // original onde o cleanup do useEffect cuidava disso.
  useEffect(() => {
    return voiceSound ? () => { try { voiceSound.unloadAsync(); } catch (e) {} } : undefined;
  }, [voiceSound]);

  useEffect(() => {
    const forceAudio = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true, shouldDuckAndroid: true });
      } catch (e) {}
    };
    forceAudio();
  }, []);

  async function safeStopVoice() {
    if (voiceSound) {
      try {
        const status = await voiceSound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) await voiceSound.stopAsync();
      } catch (e) {}
    }
  }

  async function playVoiceAlert(type) {
    if (!isVoiceEnabled) return;
    try {
      if (voiceSound) { try { await voiceSound.unloadAsync(); } catch (e) {} }
      const audioRes = getAudioResource(type);
      if (audioRes) {
        const { sound } = await Audio.Sound.createAsync(audioRes);
        setVoiceSound(sound);
        await sound.playAsync();
      }
    } catch (e) {}
  }

  return { safeStopVoice, playVoiceAlert };
}