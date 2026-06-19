// src/components/DayWorkout/useTechVoice.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

// Hook responsável pela narração em áudio das técnicas (DROPSET, BISET, etc.):
// - lê/grava a preferência de voz ligada/desligada no AsyncStorage
// - toca o áudio da técnica selecionada, com unload correto ao trocar ou fechar
export default function useTechVoice(techGuide) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlayingTechVoice, setIsPlayingTechVoice] = useState(false);
  const [voiceSound, setVoiceSound] = useState(null);

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

  const handlePlayTechVoice = async (techKey) => {
    try {
      if (voiceSound) { await voiceSound.unloadAsync(); setVoiceSound(null); }
      if (isPlayingTechVoice) { setIsPlayingTechVoice(false); return; }
      // 🔥 Lê do techGuide dinâmico (estático + customizado do laboratório)
      const audioRes = techGuide[techKey]?.audio;
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

  const closeTechModalAudio = () => {
    if (voiceSound) { voiceSound.unloadAsync(); setVoiceSound(null); }
    setIsPlayingTechVoice(false);
  };

  return {
    isVoiceEnabled,
    toggleVoice,
    isPlayingTechVoice,
    handlePlayTechVoice,
    closeTechModalAudio,
  };
}