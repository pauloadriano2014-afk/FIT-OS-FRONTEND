// src/components/ExerciseCard.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, Keyboard, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { identifyTechnique, getCategoryType } from '../utils/workoutUtils';

export const ExerciseCard = ({ 
  item, totalSets, lastWeights, historyWeights, 
  handleSaveWeight, handleOpenVideo, setModalVisible, 
  setSelectedTech, setTechModalVisible, TECH_GUIDE,
  isLastExercise, biSetType, onSwap, onOpenCalc, isTimerRunning,
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

  // 🔥 ESTADO DE CHECAGEM: Controla se a bolinha foi de fato clicada/confirmada
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
    } else if (seconds === 0) {
      setIsResting(false); clearInterval(interval); 
      if (activeSetIndex === calculateTotalSets() && isLastExercise && biSetType !== 'start') {
          if (Platform.OS === 'web') window.alert("🔥 TREINO FINALIZADO!\nParabéns!");
          else Alert.alert("🔥 TREINO FINALIZADO!", "Parabéns!");
      }
    }
    return () => clearInterval(interval);
  }, [isResting, seconds]);

  const calculateTotalSets = () => {
    return blocks.reduce((acc, block) => acc + (parseInt(block.sets) || 1), 0);
  };

  const handleSmartCheck = (setKey, currentVal, blockRestTime, blockTechKey) => {
    if (!isTimerRunning) {
        if (Platform.OS === 'web') window.alert("Atenção: Aperte o PLAY lá em cima para começar a registrar!");
        else Alert.alert("Atenção", "Aperte o PLAY lá em cima para começar a registrar!");
        return;
    }
    Keyboard.dismiss();
    if (currentVal === undefined || currentVal === '' || currentVal === null) {
        handleSaveWeight(item.id, '0', setKey); 
    }
    
    // 🔥 Pinta a bolinha de verde assim que confirmar!
    setCheckedSets(prev => ({ ...prev, [setKey]: true }));

    const totalSets = calculateTotalSets();
    const isLastSet = (typeof setKey === 'number' ? setKey : parseInt(setKey)) === totalSets;

    if (categoryType === 'STRENGTH') {
        startRestTimer(typeof setKey === 'number' ? setKey : parseInt(setKey), 'NORMAL', blockRestTime, blockTechKey, isLastSet);
    }
  };

  const startRestTimer = (setNum, type = 'NORMAL', blockRestTime, blockTechKey, isLastSet = false) => {
    // 🔥 MAGIA DO BI-SET: Usa o seu Modal Próprio Implacável no lugar do Alerta do Safari
    if (biSetType === 'start') {
        setTimerMessage({ title: '🔥 SEM DESCANSO!', desc: 'Vá direto para o exercício de baixo agora!' });
        setSeconds(3); // Brilha por 3 segundinhos e some
        setActiveSetIndex(setNum); 
        setIsResting(true);
        return;
    }

    let timeToRest = parseInt(blockRestTime) || standardRestTime;
    let message = { title: 'RECUPERANDO', desc: 'Relaxe e recupere o fôlego.' };

    if (type === 'CLUSTER_INTRA') {
        timeToRest = 15;
        message = { title: 'PAUSA CLUSTER', desc: '15s de respiro. Mantenha o peso!' };
    } else if (blockTechKey === 'RESTPAUSE') {
        timeToRest = 20; 
        message = { title: 'REST-PAUSE (20s)', desc: 'Respire rápido! Falhe de novo com a mesma carga.' };
    } else if (blockTechKey === 'DROPSET') {
        message = { title: 'SÉRIE FINALIZADA', desc: 'Recupere-se para a próxima.' };
    } else if (blockTechKey === 'GVT') {
        timeToRest = 60;
        message = { title: 'GVT: TEMPO RÍGIDO', desc: 'Respeite os 60s exatos.' };
    }

    if (isLastSet && biSetType !== 'start') {
        message = { title: 'EXERCÍCIO CONCLUÍDO', desc: isLastExercise ? 'Você finalizou o treino!' : 'Prepare-se para o próximo exercício da lista.' };
    }

    setTimerMessage(message);
    setSeconds(timeToRest);
    setActiveSetIndex(setNum);
    setIsResting(true);
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
        const isCompleted = lastWeights[item.id]?.[currentSetNum];
        return (
            <View style={{flex: 1.5, alignItems:'center'}}>
                <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3}}>TEMPO / KM</Text>
                <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                    <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                        <TextInput 
                            style={[{backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold'}, isCompleted && {color: colors.primary, borderColor: colors.primary}, !isTimerRunning && {opacity: 0.5}]}
                            placeholder="Min/Km" placeholderTextColor={colors.textMuted} keyboardType="default"
                            onEndEditing={(e) => { 
                                handleSaveWeight(item.id, e.nativeEvent.text, currentSetNum); 
                                handleSmartCheck(currentSetNum, e.nativeEvent.text, block.restTime, techInfo.key);
                            }}
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
                    // O cluster preenche o input, mas a bolinha mestre lá fora que manda na linha
                    const isDone = val !== undefined && val !== '';
                    return (
                        <View key={idx} style={{flex:1, paddingHorizontal:2}}>
                            <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3, textAlign: 'center'}}>{label}</Text>
                            <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                                <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                                    <TextInput 
                                        style={[{backgroundColor: colors.inputBg, color: colors.text, height: 36, width: '100%', borderRadius: 6, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 13, fontWeight: 'bold'}, isDone && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                        placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                                        onEndEditing={(e) => { 
                                            handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_${suffix}`); 
                                            startRestTimer(currentSetNum, idx < 2 ? 'CLUSTER_INTRA' : 'NORMAL', block.restTime, techInfo.key);
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
                                        placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                                        onEndEditing={(e) => { 
                                            handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_${suffix}`); 
                                            if (idx === 2) {
                                                setCheckedSets(prev => ({ ...prev, [currentSetNum]: true }));
                                                startRestTimer(currentSetNum, 'NORMAL', block.restTime, techInfo.key, currentSetNum === calculateTotalSets()); 
                                            }
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
                                placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                                onEndEditing={(e) => handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_MAIN`)}
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
                                placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                                onEndEditing={(e) => { 
                                    handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_DROP`);
                                    setCheckedSets(prev => ({ ...prev, [currentSetNum]: true }));
                                    startRestTimer(currentSetNum, 'NORMAL', block.restTime, techInfo.key, currentSetNum === calculateTotalSets());
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
      // const isCompleted = val !== undefined && val !== ''; <- Removido para a borda não ficar colorida só de digitar
      const isConfirmed = checkedSets[currentSetNum] === true; // Nova checagem do input
      
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
                        placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                        value={val !== undefined ? String(val) : ''}
                        onChangeText={(text) => handleSaveWeight(item.id, text, currentSetNum)}
                        onSubmitEditing={(e) => {
                            handleSaveWeight(item.id, e.nativeEvent.text, currentSetNum);
                            handleSmartCheck(currentSetNum, e.nativeEvent.text, block.restTime, techInfo.key);
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

      if (blockIndex > 0 && techInfo.key) {
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
          
          // 🔥 A bolinha agora só fica verde depois de receber a "Confirmação"
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

                {/* 🔥 BOTÃO DE CHECK GIGANTE */}
                <View style={{width: 44, alignItems:'flex-end', marginLeft: 5, justifyContent:'center'}}>
                    <TouchableOpacity 
                        style={{padding: 8}} 
                        onPress={() => {
                            if (categoryType === 'MOBILITY' || categoryType === 'CARDIO') {
                                setActiveSetIndex(currentSetNum + 1); 
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
                <Video ref={videoRef} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, width: '100%', height: '100%', opacity: 0.7 }} source={{ uri: videoLink }} resizeMode={ResizeMode.COVER} isMuted={true} shouldPlay={true} isLooping={true} />
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
                    
                    {/* O Modal do Bi-Set não precisa do reloginho rodando */}
                    {biSetType !== 'start' && <Text style={{ color: colors.text, fontSize: 90, fontWeight: '900', marginVertical: 10 }}>{seconds}s</Text>}
                    
                    <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', lineHeight: 22 }}>{timerMessage.desc}</Text>
                    
                    <TouchableOpacity style={{ marginTop: 10, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, flexDirection:'row', gap: 8, alignItems:'center' }} onPress={() => setSeconds(0)}>
                        <Text style={{ color: colors.primaryText, fontWeight: '900', fontSize: 14 }}>{biSetType === 'start' ? 'FECHAR' : 'PULAR'}</Text>
                        <MaterialCommunityIcons name={biSetType === 'start' ? 'close' : 'skip-next'} size={16} color={colors.primaryText}/>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </View>
      
      {/* 🔥 O Elo de Corrente Conectando os Cards */}
      {biSetType === 'start' && 
        <View style={{ alignSelf:'center', height: 34, width: 54, backgroundColor: colors.primary, justifyContent:'center', alignItems:'center', borderRadius: 17, marginTop: -17, marginBottom: -17, zIndex: 10, borderWidth: 4, borderColor: colors.bg }}>
            <MaterialCommunityIcons name="link-variant" size={20} color={colors.primaryText}/>
        </View>
      }
    </View>
  );
};