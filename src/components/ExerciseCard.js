// src/components/ExerciseCard.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, Keyboard, Pressable, Platform, AppState } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode, Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { identifyTechnique, getCategoryType } from '../utils/workoutUtils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'web' && typeof window !== 'undefined' && window.visualViewport) {
  const handler = () => {
    const viewportHeight = window.visualViewport.height;
    document.documentElement.style.height = `${viewportHeight}px`;
    document.body.style.height = `${viewportHeight}px`;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      document.activeElement.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  };
  window.visualViewport.addEventListener('resize', handler);
  window.visualViewport.addEventListener('scroll', handler);
}

export const ExerciseCard = ({ 
  item, totalSets, lastWeights, historyWeights, 
  handleSaveWeight, handleOpenVideo, setModalVisible, 
  setSelectedTech, setTechModalVisible, TECH_GUIDE,
  isLastExercise, biSetType, onSwap, onOpenCalc, isTimerRunning,
  isVoiceEnabled,
  colors
}) => {
  
  const exerciseTitle = item.exercise?.name || item.name || "Exercício";
  const videoLink = item.exercise?.videoUrl || item.videoUrl;
  const standardRestTime = item.restTime || 60;
  
  const blocks = item.blocks && item.blocks.length > 0 
    ? item.blocks 
    : [{ sets: item.sets || totalSets, reps: item.reps, restTime: item.restTime, technique: item.technique || item.notes }];

  const categoryType = getCategoryType(item); 
  const showTools = categoryType === 'STRENGTH';

  const [seconds, setSeconds] = useState(standardRestTime);
  const [isResting, setIsResting] = useState(false);
  const [activeSetIndex, setActiveSetIndex] = useState(null);
  const [timerMessage, setTimerMessage] = useState({ title: 'RECUPERANDO', desc: 'Respire e prepare-se.' });
  const videoRef = useRef(null);

  const [voiceSound, setVoiceSound] = useState(null);
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

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isResting && backgroundTimestamp.current !== null) {
          const elapsed = Math.floor((Date.now() - backgroundTimestamp.current) / 1000);
          const newSeconds = backgroundSeconds.current - elapsed;
          
          if (newSeconds <= 0) {
              setSeconds(0);
          } else {
              setSeconds(newSeconds);
          }
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

  async function safeStopVoice() {
      if (voiceSound) {
          try {
              const status = await voiceSound.getStatusAsync();
              if (status.isLoaded && status.isPlaying) {
                  await voiceSound.stopAsync();
              }
          } catch (e) {}
      }
  }

  async function cancelNotification() {
      if (notifIdRef.current) {
          await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
          notifIdRef.current = null;
      }
  }

  async function playVoiceAlert(type) {
      if (!isVoiceEnabled) return; 
      try {
          if (voiceSound) {
              try { await voiceSound.unloadAsync(); } catch (e) {}
          }
          let audioRes;
          switch (type) {
              case 'alerta_descanso': audioRes = require('../../assets/audio/alerta_descanso.m4a'); break;
              case 'alerta_fim_descanso': audioRes = require('../../assets/audio/alerta_fim_descanso.m4a'); break;
              case 'alerta_fim_exercicio': audioRes = require('../../assets/audio/alerta_fim_exercicio.m4a'); break;
              case 'alerta_biset': audioRes = require('../../assets/audio/alerta_biset.m4a'); break;
              case 'alerta_restpause': audioRes = require('../../assets/audio/alerta_restpause.m4a'); break;
              case 'alerta_cluster': audioRes = require('../../assets/audio/alerta_cluster.m4a'); break;
              case 'alerta_dropset': audioRes = require('../../assets/audio/alerta_dropset.m4a'); break;
              case 'alerta_treino_finalizado': audioRes = require('../../assets/audio/alerta_treino_finalizado.m4a'); break;
          }
          if (audioRes) {
              const { sound } = await Audio.Sound.createAsync(audioRes);
              setVoiceSound(sound);
              await sound.playAsync();
          }
      } catch (e) {}
  }

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

  const [checkedSets, setCheckedSets] = useState({});

  let realObservation = item.observation;
  if (!realObservation && item.technique && typeof item.technique === 'string' && item.technique.startsWith('{')) {
      try {
          const parsedTech = JSON.parse(item.technique);
          if (parsedTech.o) realObservation = parsedTech.o;
      } catch (e) {}
  }

  const getPreviousWeight = (key) => {
      if (historyWeights && historyWeights[item.exerciseId]) {
          const val = historyWeights[item.exerciseId][key];
          if (val) return `${val}`;
      }
      return '-';
  };

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

  const calculateTotalSets = () => blocks.reduce((acc, block) => acc + (parseInt(block.sets) || 1), 0);

  const handleSmartCheck = (setKey, currentVal, blockRestTime, blockTechKey) => {
    if (!isTimerRunning) {
        if (Platform.OS === 'web') window.alert("Atenção: Aperte o PLAY lá em cima para começar a registrar!");
        else Alert.alert("Atenção", "Aperte o PLAY lá em cima para começar a registrar!");
        return;
    }
    Keyboard.dismiss();
    
    if (categoryType !== 'CARDIO' && (currentVal === undefined || currentVal === '' || currentVal === null)) {
        handleSaveWeight(item.id, '0', setKey); 
    }
    setCheckedSets(prev => ({ ...prev, [setKey]: true }));
    if (categoryType === 'CARDIO') return;

    const totalSets = calculateTotalSets();
    const isLastSet = (typeof setKey === 'number' ? setKey : parseInt(setKey)) === totalSets;
    startRestTimer(typeof setKey === 'number' ? setKey : parseInt(setKey), 'NORMAL', blockRestTime, blockTechKey, isLastSet);
  };

  const startRestTimer = async (setNum, type = 'NORMAL', blockRestTime, blockTechKey, isLastSet = false) => {
    await safeStopVoice(); 
    await cancelNotification();

    if (biSetType === 'start') {
        setTimerMessage({ title: '🔥 SEM DESCANSO!', desc: 'Vá direto para o exercício de baixo agora!' });
        setSeconds(3); 
        setActiveSetIndex(setNum); 
        setIsResting(true);
        playVoiceAlert('alerta_biset');
        return;
    }

    let timeToRest = parseInt(blockRestTime) || standardRestTime;
    let message = { title: 'RECUPERANDO', desc: 'Relaxe e recupere o fôlego.' };
    let voiceToPlay = 'alerta_descanso';
    let isTechniqueForced = false;

    if (blockTechKey === '1_5_REPS' || blockTechKey === 'TUT') {
        voiceToPlay = null; 
    }

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

    setTimerMessage(message);
    setSeconds(timeToRest);
    setActiveSetIndex(setNum);
    setIsResting(true);
    
    if (voiceToPlay) playVoiceAlert(voiceToPlay);

    if (timeToRest > 0 && Platform.OS !== 'web') {
        try {
            notifIdRef.current = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "🔥 Fim do Descanso!",
                    body: "Acabou a moleza. Volte para o app e faça acontecer!",
                    sound: true,
                },
                trigger: { seconds: timeToRest },
            });
        } catch(e) { console.log('Erro na notificação:', e); }
    }
  };

  const handleInputFocus = () => {
      if (!isTimerRunning) {
          Keyboard.dismiss();
          if (Platform.OS === 'web') window.alert("Treino Pausado: Clique em INICIAR TREINO no topo da tela para liberar os campos.");
          else Alert.alert("Treino Pausado", "Clique em INICIAR TREINO no topo da tela para liberar os campos.");
      }
  };

  const renderInputArea = (currentSetNum, isActive, block) => {
      const rawTech = block.technique || "";
      const techInfo = identifyTechnique(rawTech);
      if (techInfo.color === '#CCFF00' && colors.bg !== '#000000') techInfo.color = colors.primary;

      if (categoryType === 'MOBILITY') {
          return (
            <View style={{flex: 1.5, alignItems:'center', justifyContent:'center'}}>
                <Text style={{color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1}}>EXECUÇÃO</Text>
                <Text style={{color: colors.text, fontSize: 14, fontWeight: 'bold'}}>{block.reps || "Fazer"} Reps</Text>
            </View>
          );
      }

      if (categoryType === 'CARDIO') {
        const val = lastWeights[item.id]?.[currentSetNum];
        const isConfirmed = checkedSets[currentSetNum] === true;
        return (
            <View style={{flex: 1.5, alignItems:'center'}}>
                <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3}}>TEMPO / KM</Text>
                <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                    <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                        <TextInput 
                            style={[{backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold'}, isConfirmed && {color: colors.primary, borderColor: colors.primary}, !isTimerRunning && {opacity: 0.5}]}
                            placeholder="Min/Km" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
                            value={val !== undefined ? String(val) : ''}
                            onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), currentSetNum)}
                            onSubmitEditing={(e) => { handleSaveWeight(item.id, e.nativeEvent.text.replace(',', '.'), currentSetNum); handleSmartCheck(currentSetNum, e.nativeEvent.text.replace(',', '.'), block.restTime, techInfo.key); }}
                            editable={isTimerRunning} returnKeyType="done"
                        />
                    </View>
                </Pressable>
                <Text style={{color: colors.textMuted, fontSize: 9, marginTop:2}}>Ant: {getPreviousWeight(currentSetNum)}</Text>
            </View>
        );
      }

      if (techInfo.key === 'CLUSTERSET') {
          return (
            <View style={{flexDirection: 'row', flex: 1, justifyContent: 'space-between'}}>
                {['BLOCO 1', 'BLOCO 2', 'BLOCO 3'].map((label, idx) => {
                    const suffix = `CL${idx+1}`;
                    const val = lastWeights[item.id]?.[`${currentSetNum}_${suffix}`];
                    const isDone = val !== undefined && val !== '';
                    return (
                        <View key={idx} style={{flex:1, paddingHorizontal:2}}>
                            <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3, textAlign: 'center'}}>{label}</Text>
                            <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                                <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                                    <TextInput 
                                        style={[{backgroundColor: colors.inputBg, color: colors.text, height: 36, width: '100%', borderRadius: 6, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 13, fontWeight: 'bold'}, isDone && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                        placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
                                        value={val !== undefined ? String(val) : ''}
                                        onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), `${currentSetNum}_${suffix}`)}
                                        onSubmitEditing={(e) => { 
                                            const finalVal = e.nativeEvent.text.replace(',', '.');
                                            handleSaveWeight(item.id, finalVal, `${currentSetNum}_${suffix}`); 
                                            if (idx === 2) handleSmartCheck(currentSetNum, finalVal, block.restTime, techInfo.key);
                                            else startRestTimer(currentSetNum, 'CLUSTER_INTRA', block.restTime, techInfo.key);
                                        }}
                                        editable={isTimerRunning} returnKeyType="done"
                                    />
                                </View>
                            </Pressable>
                        </View>
                    )
                })}
            </View>
          );
      }

      if (techInfo.key === '21') {
          return (
            <View style={{flexDirection: 'row', flex: 1, justifyContent: 'space-between'}}>
                {['INF', 'SUP', 'FULL'].map((label, idx) => {
                    const suffix = label;
                    const val = lastWeights[item.id]?.[`${currentSetNum}_${suffix}`];
                    const isDone = val !== undefined && val !== '';
                    return (
                        <View key={idx} style={{flex:1, paddingHorizontal:2}}>
                            <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3, textAlign: 'center'}}>{label}</Text>
                            <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                                <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                                    <TextInput 
                                        style={[{backgroundColor: colors.inputBg, color: colors.text, height: 36, width: '100%', borderRadius: 6, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 13, fontWeight: 'bold'}, isDone && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                        placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
                                        value={val !== undefined ? String(val) : ''}
                                        onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), `${currentSetNum}_${suffix}`)}
                                        onSubmitEditing={(e) => { 
                                            const finalVal = e.nativeEvent.text.replace(',', '.');
                                            handleSaveWeight(item.id, finalVal, `${currentSetNum}_${suffix}`); 
                                            if (idx === 2) handleSmartCheck(currentSetNum, finalVal, block.restTime, techInfo.key);
                                        }}
                                        editable={isTimerRunning} returnKeyType="done"
                                    />
                                </View>
                            </Pressable>
                        </View>
                    )
                })}
            </View>
          );
      }

      if (techInfo.key === 'DROPSET') {
          return (
            <View style={{flexDirection: 'row', flex: 1, justifyContent: 'space-between'}}>
                <View style={{flex:1, paddingRight:5}}>
                    <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3, textAlign: 'center'}}>CARGA</Text>
                    <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                        <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                            <TextInput 
                                style={[{backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold'}, lastWeights[item.id]?.[`${currentSetNum}_MAIN`] && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
                                value={lastWeights[item.id]?.[`${currentSetNum}_MAIN`] !== undefined ? String(lastWeights[item.id]?.[`${currentSetNum}_MAIN`]) : ''}
                                onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), `${currentSetNum}_MAIN`)}
                                editable={isTimerRunning} returnKeyType="done"
                            />
                        </View>
                    </Pressable>
                </View>
                <View style={{justifyContent:'center', paddingBottom:15}}><MaterialCommunityIcons name="arrow-right" size={16} color={colors.textMuted}/></View>
                <View style={{flex:1, paddingLeft:5}}>
                    <Text style={[{fontSize: 8, fontWeight: 'bold', marginBottom: 3, textAlign: 'center'}, {color: techInfo.color}]}>DROP</Text>
                    <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                        <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                            <TextInput 
                                style={[{backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold'}, lastWeights[item.id]?.[`${currentSetNum}_DROP`] && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
                                value={lastWeights[item.id]?.[`${currentSetNum}_DROP`] !== undefined ? String(lastWeights[item.id]?.[`${currentSetNum}_DROP`]) : ''}
                                onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), `${currentSetNum}_DROP`)}
                                onSubmitEditing={(e) => { 
                                    const finalVal = e.nativeEvent.text.replace(',', '.');
                                    handleSaveWeight(item.id, finalVal, `${currentSetNum}_DROP`);
                                    handleSmartCheck(currentSetNum, finalVal, block.restTime, techInfo.key);
                                }}
                                editable={isTimerRunning} returnKeyType="done"
                            />
                        </View>
                    </Pressable>
                </View>
            </View>
          );
      }

      const val = lastWeights[item.id]?.[currentSetNum];
      const isConfirmed = checkedSets[currentSetNum] === true; 
      
      return (
        <View style={{flex: 1.5, alignItems:'center'}}>
            <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3}}>CARGA (KG)</Text>
            
            <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                <View 
                    pointerEvents={isTimerRunning ? 'auto' : 'none'} 
                    style={[{backgroundColor: colors.inputBg, height: 40, width: '100%', borderRadius: 8, borderWidth: 1, borderColor: colors.border, justifyContent:'center'}, isConfirmed && {borderColor: colors.primary}, !isTimerRunning && {opacity: 0.5}]}
                >
                    <TextInput 
                        style={[{color: colors.text, width: '100%', height: '100%', textAlign: 'center', fontSize: 16, fontWeight: 'bold'}, isConfirmed && {color: colors.primary}]}
                        placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
                        value={val !== undefined ? String(val) : ''}
                        onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), currentSetNum)}
                        onSubmitEditing={(e) => {
                            const finalVal = e.nativeEvent.text.replace(',', '.');
                            handleSaveWeight(item.id, finalVal, currentSetNum);
                            handleSmartCheck(currentSetNum, finalVal, block.restTime, techInfo.key);
                        }}
                        editable={isTimerRunning} returnKeyType="done"
                    />
                </View>
            </Pressable>
            
            <Text style={{color: colors.textMuted, fontSize: 9, marginTop:2}}>Ant: {getPreviousWeight(currentSetNum)}</Text>
        </View>
      );
  };

  let currentSetGlobalTracker = 1;
  const renderedLines = [];

  blocks.forEach((block, blockIndex) => {
      const setsInBlock = parseInt(block.sets) || 1;
      const rawTech = block.technique || "";
      const techInfo = identifyTechnique(rawTech);
      if (techInfo.color === '#CCFF00' && colors.bg !== '#000000') techInfo.color = colors.primary;

      // 🔥 CORREÇÃO: O BOTÃO INTRUSO NÃO VAI MAIS APARECER PARA O BI-SET DENTRO DO MESMO EXERCÍCIO
      if (blockIndex > 0 && techInfo.key && techInfo.key !== 'BISET') {
          renderedLines.push(
              <View key={`divider_${blockIndex}`} style={{flexDirection: 'row', alignItems: 'center', marginVertical: 12}}>
                  <View style={{flex: 1, height: 1, backgroundColor: colors.border}} />
                  <TouchableOpacity 
                      style={{flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, gap: 6, backgroundColor: techInfo.color + '1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: techInfo.color}}
                      onPress={() => {
                          if (setSelectedTech && setTechModalVisible) {
                              setSelectedTech(techInfo.key);
                              setTechModalVisible(true);
                          }
                      }}
                  >
                      <MaterialCommunityIcons name="information-outline" size={16} color={techInfo.color} />
                      <Text style={{color: techInfo.color, fontSize: 11, fontWeight: '900', letterSpacing: 1}}>{techInfo.label}</Text>
                  </TouchableOpacity>
                  <View style={{flex: 1, height: 1, backgroundColor: colors.border}} />
              </View>
          );
      }

      const maxRenderSets = categoryType === 'CARDIO' ? 1 : setsInBlock;

      for (let i = 0; i < maxRenderSets; i++) {
          const currentSetNum = currentSetGlobalTracker;
          const isActive = activeSetIndex === currentSetNum && isResting;
          
          const val = lastWeights[item.id]?.[currentSetNum];
          const isConfirmed = checkedSets[currentSetNum] === true;

          const checkColor = isConfirmed ? colors.primary : colors.border;
          const checkIcon = isConfirmed ? "check-circle" : "checkbox-blank-circle-outline";

          renderedLines.push(
            <View key={`set_${currentSetNum}`} style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 5, paddingHorizontal: 5, borderRadius: 8 }, isActive && {backgroundColor:`${colors.primary}1A`, borderColor: techInfo.color || colors.primary, borderWidth:1}]}>
                <View style={{width: 30, alignItems:'center', marginRight: 10}}>
                    {categoryType === 'CARDIO' ? (
                        <MaterialCommunityIcons name="heart-pulse" size={24} color={colors.primary} />
                    ) : (
                        <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: 'bold' }}>{currentSetNum}</Text>
                        </View>
                    )}
                </View>

                {categoryType === 'CARDIO' ? (
                    <View style={{width: 60, alignItems:'center', marginRight: 10}}>
                        <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3}}>META</Text>
                        <View style={{ height: 40, justifyContent: 'center' }}>
                            <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold', textAlign:'center' }}>{block.sets}m / {block.reps}kcal</Text>
                        </View>
                    </View>
                ) : (
                    <View style={{width: 50, alignItems:'center', marginRight: 10}}>
                        <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3}}>REPS</Text>
                        <View style={{ height: 40, justifyContent: 'center' }}>
                            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{block.reps}</Text>
                        </View>
                    </View>
                )}

                <View style={{flex: 1}}>
                    {renderInputArea(currentSetNum, isActive, block)}
                </View>

                <View style={{width: 44, alignItems:'flex-end', marginLeft: 5, justifyContent:'center'}}>
                    <TouchableOpacity 
                        style={{padding: 8}} 
                        onPress={() => {
                            if (categoryType === 'MOBILITY' || categoryType === 'CARDIO') {
                                handleSmartCheck(currentSetNum, val, block.restTime, techInfo.key);
                            } else {
                                handleSmartCheck(currentSetNum, val, block.restTime, techInfo.key);
                            }
                        }}
                    >
                        <MaterialCommunityIcons name={checkIcon} size={34} color={checkColor} />
                    </TouchableOpacity>
                </View>
            </View>
          );
          currentSetGlobalTracker++;
      }
  });

  const rawTopTech = blocks[0]?.technique || item.technique || '';
  const exerciseTopTechnique = typeof rawTopTech === 'string' ? rawTopTech.trim().toUpperCase() : '';

  return (
    <View style={{ marginBottom: biSetType === 'start' ? 0 : 20 }}>
      <View style={[
          {backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border},
          biSetType === 'start' && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
          biSetType === 'end' && { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 },
          (biSetType) && { borderColor: colors.primary, borderWidth: 2 }
      ]}>
        
        <View style={{ height: 180, width: '100%', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
            {videoLink ? (
                Platform.OS === 'web' ? (
                    <video 
                        src={videoLink} 
                        style={{ 
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                            objectFit: 'cover', 
                            objectPosition: 'center 20%', 
                            opacity: 0.7, pointerEvents: 'none' 
                        }} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                    />
                ) : (
                    <Video 
                        ref={videoRef} 
                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, width: '100%', height: '100%', opacity: 0.7 }} 
                        source={{ uri: videoLink }} 
                        resizeMode={ResizeMode.COVER} 
                        isMuted={true} 
                        shouldPlay={false} 
                        isLooping={false} 
                    />
                )
            ) : (
                <View style={[StyleSheet.absoluteFillObject, { opacity: 0.7, backgroundColor: '#222', justifyContent:'center', alignItems:'center'}]}><MaterialCommunityIcons name="dumbbell" size={40} color="#444" /></View>
            )}

            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'space-between', padding: 15 }}>
                <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', alignItems:'flex-start'}}>
                    <View>
                        {identifyTechnique(exerciseTopTechnique).key && (
                            <TouchableOpacity style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, elevation: 3, backgroundColor: identifyTechnique(exerciseTopTechnique).color}} onPress={() => { if(setSelectedTech && setTechModalVisible) { setSelectedTech(identifyTechnique(exerciseTopTechnique).key); setTechModalVisible(true); }}}>
                                <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                                    <MaterialCommunityIcons name="information-outline" size={12} color={colors.bg === '#000000' && (identifyTechnique(exerciseTopTechnique).key === 'BISET' || identifyTechnique(exerciseTopTechnique).key === '21') ? '#000' : '#FFF'} />
                                    <Text style={{ fontSize: 10, fontWeight: '900', color: colors.bg === '#000000' && (identifyTechnique(exerciseTopTechnique).key === 'BISET' || identifyTechnique(exerciseTopTechnique).key === '21') ? '#000' : '#FFF' }}>{identifyTechnique(exerciseTopTechnique).label}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                
                {showTools && (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignSelf:'flex-start' }}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} onPress={onOpenCalc}>
                            <MaterialCommunityIcons name="calculator" size={14} color="#FFF" />
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>CALCULAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} onPress={setModalVisible}>
                            <MaterialCommunityIcons name="camera-metering-spot" size={14} color="#FFF" />
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>ANÁLISE IA</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ marginTop: 'auto' }}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end'}}>
                        <View style={{flex:1}}>
                            <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 }}>{exerciseTitle}</Text>
                            <Text style={{ color: '#DDD', fontSize: 12, fontWeight: 'bold' }}>{calculateTotalSets()} Séries Totais</Text>
                        </View>
                        <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }} onPress={() => handleOpenVideo(videoLink)}><MaterialCommunityIcons name="play" size={24} color={colors.primaryText} /></TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>

        <View style={{ padding: 15 }}>
            {renderedLines}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                     <MaterialCommunityIcons name="timer-sand" size={14} color={colors.textMuted} />
                     <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: 'bold' }}>
                        {categoryType === 'MOBILITY' ? 'Execução contínua' :
                         biSetType === 'start' ? 'Sem descanso' : 
                         `${blocks[0].restTime || standardRestTime}s intervalo`}
                     </Text>
                </View>
            </View>

            {realObservation && realObservation.trim() !== '' ? (
                <View style={{ backgroundColor: colors.inputBg, padding: 12, borderRadius: 8, marginTop: 15, borderWidth: 1, borderColor: colors.primary + '55', borderLeftWidth: 4, borderLeftColor: colors.primary }}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4}}>
                        <MaterialCommunityIcons name="bullhorn-outline" size={14} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>COACH AVISA:</Text>
                    </View>
                    <Text style={{ color: colors.text, fontSize: 13, fontStyle: 'italic', lineHeight: 18 }}>{realObservation}</Text>
                </View>
            ) : null}

            {onSwap && (
                <TouchableOpacity onPress={onSwap} style={{ backgroundColor: '#FF9500', marginTop: 15, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="swap-horizontal" size={16} color="#000" />
                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }}>TROCAR EXERCÍCIO</Text>
                </TouchableOpacity>
            )}
        </View>

        <Modal visible={isResting} animationType="fade" transparent>
            <View style={{ flex: 1, backgroundColor: colors.glass, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '85%', padding: 40, backgroundColor: colors.surface, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textAlign:'center' }}>{timerMessage.title}</Text>
                    
                    {biSetType !== 'start' && <Text style={{ color: colors.text, fontSize: 90, fontWeight: '900', marginVertical: 10 }}>{seconds}s</Text>}
                    
                    <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', lineHeight: 22 }}>{timerMessage.desc}</Text>
                    
                    <TouchableOpacity 
                        style={{ marginTop: 10, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, flexDirection:'row', gap: 8, alignItems:'center' }} 
                        onPress={async () => { 
                            setSeconds(0); 
                            await safeStopVoice();
                            await cancelNotification();
                        }}
                    >
                        <Text style={{ color: colors.primaryText, fontWeight: '900', fontSize: 14 }}>{biSetType === 'start' ? 'FECHAR' : 'PULAR'}</Text>
                        <MaterialCommunityIcons name={biSetType === 'start' ? 'close' : 'skip-next'} size={16} color={colors.primaryText}/>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </View>
      
      {biSetType === 'start' && 
        <View style={{ alignSelf:'center', height: 34, width: 54, backgroundColor: colors.primary, justifyContent:'center', alignItems:'center', borderRadius: 17, marginTop: -17, marginBottom: -17, zIndex: 10, borderWidth: 4, borderColor: colors.bg }}>
            <MaterialCommunityIcons name="link-variant" size={20} color={colors.primaryText}/>
        </View>
      }
    </View>
  );
};