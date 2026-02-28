// src/components/ExerciseCard.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet, Keyboard, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av'; 
import { identifyTechnique, getCategoryType } from '../utils/workoutUtils';

export const ExerciseCard = ({ 
  item, totalSets, lastWeights, historyWeights, 
  handleSaveWeight, handleOpenVideo, setModalVisible, 
  setSelectedTech, setTechModalVisible, TECH_GUIDE,
  isLastExercise, biSetType, onSwap, onOpenCalc, isTimerRunning, colors
}) => {
  
  const exerciseTitle = item.exercise?.name || item.name || "Exercício";
  const videoLink = item.exercise?.videoUrl || item.videoUrl;
  const standardRestTime = item.restTime || 60;
  
  const rawTech = item.notes || item.technique || "";
  const techInfo = identifyTechnique(rawTech);
  if (techInfo.color === '#CCFF00' && colors.bg !== '#000000') techInfo.color = colors.primary;

  const categoryType = getCategoryType(item); 
  const showTools = categoryType === 'STRENGTH';

  const [seconds, setSeconds] = useState(standardRestTime);
  const [isResting, setIsResting] = useState(false);
  const [activeSetIndex, setActiveSetIndex] = useState(null);
  const [timerMessage, setTimerMessage] = useState({ title: 'RECUPERANDO', desc: 'Respire e prepare-se.' });
  const videoRef = useRef(null);

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
    }
    return () => clearInterval(interval);
  }, [isResting, seconds]);

  const startRestTimer = (setNum, type = 'NORMAL') => {
    if (biSetType === 'start') {
        Alert.alert("BI-SET ATIVO ⚡", "Sem descanso! Vá para o próximo.", [{ text: "VAMOS!", style: "default" }]);
        setActiveSetIndex(setNum); 
        return;
    }

    let timeToRest = standardRestTime;
    let message = { title: 'RECUPERANDO', desc: 'Relaxe e recupere o fôlego.' };

    if (type === 'CLUSTER_INTRA') {
        timeToRest = 15;
        message = { title: 'PAUSA CLUSTER', desc: '15s de respiro. Mantenha o peso!' };
    } else if (techInfo.key === 'RESTPAUSE') {
        timeToRest = 20; 
        message = { title: 'REST-PAUSE (20s)', desc: 'Respire rápido! Falhe de novo com a mesma carga.' };
    } else if (techInfo.key === 'DROPSET') {
        message = { title: 'SÉRIE FINALIZADA', desc: 'Recupere-se para a próxima.' };
    } else if (techInfo.key === 'GVT') {
        timeToRest = 60;
        message = { title: 'GVT: TEMPO RÍGIDO', desc: 'Respeite os 60s exatos.' };
    }

    setTimerMessage(message);
    setSeconds(timeToRest);
    setActiveSetIndex(setNum);
    setIsResting(true);
  };

  const handleSmartCheck = (setKey, currentVal) => {
    if (!isTimerRunning) {
        Alert.alert("Atenção", "Aperte o PLAY lá em cima para começar a registrar!");
        return;
    }
    Keyboard.dismiss();
    if (currentVal === undefined || currentVal === '' || currentVal === null) {
        handleSaveWeight(item.id, '0', setKey); 
    }
    if(categoryType === 'STRENGTH') startRestTimer(typeof setKey === 'number' ? setKey : parseInt(setKey));
  };

  const handleInputFocus = () => {
      if (!isTimerRunning) {
          Keyboard.dismiss();
          Alert.alert("Treino Pausado", "Clique em INICIAR TREINO no topo da tela para liberar os campos.");
      }
  };

  const renderInputArea = (i, currentSetNum, isActive) => {
      if (categoryType === 'MOBILITY') {
          return (
            <View style={{flex: 1.5, alignItems:'center', justifyContent:'center'}}>
                <Text style={{color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1}}>EXECUÇÃO</Text>
                <Text style={{color: colors.text, fontSize: 14, fontWeight: 'bold'}}>{item.reps || "Fazer"} Reps</Text>
            </View>
          );
      }

      if (categoryType === 'CARDIO') {
        const isCompleted = lastWeights[item.id]?.[currentSetNum];
        return (
            <View style={{flex: 1.5, alignItems:'center'}}>
                <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3}}>TEMPO / KM</Text>
                <TouchableOpacity onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                    <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                        <TextInput 
                            style={[{backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold'}, isCompleted && {color: colors.primary, borderColor: colors.primary}, !isTimerRunning && {opacity: 0.5}]}
                            placeholder="Min/Km" placeholderTextColor={colors.textMuted} keyboardType="default"
                            onEndEditing={(e) => { handleSaveWeight(item.id, e.nativeEvent.text, currentSetNum); }}
                            editable={isTimerRunning} returnKeyType="done"
                        />
                    </View>
                </TouchableOpacity>
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
                            <TouchableOpacity onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                                <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                                    <TextInput 
                                        style={[{backgroundColor: colors.inputBg, color: colors.text, height: 36, width: '100%', borderRadius: 6, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 13, fontWeight: 'bold'}, isDone && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                        placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                                        onEndEditing={(e) => { 
                                            handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_${suffix}`); 
                                            startRestTimer(currentSetNum, idx < 2 ? 'CLUSTER_INTRA' : 'NORMAL');
                                        }}
                                        editable={isTimerRunning} returnKeyType="done"
                                    />
                                </View>
                            </TouchableOpacity>
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
                            <TouchableOpacity onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                                <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                                    <TextInput 
                                        style={[{backgroundColor: colors.inputBg, color: colors.text, height: 36, width: '100%', borderRadius: 6, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 13, fontWeight: 'bold'}, isDone && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                        placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                                        onEndEditing={(e) => { 
                                            handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_${suffix}`); 
                                            if (idx === 2) startRestTimer(currentSetNum); 
                                        }}
                                        editable={isTimerRunning} returnKeyType="done"
                                    />
                                </View>
                            </TouchableOpacity>
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
                    <TouchableOpacity onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                        <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                            <TextInput 
                                style={[{backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold'}, lastWeights[item.id]?.[`${currentSetNum}_MAIN`] && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                                onEndEditing={(e) => handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_MAIN`)}
                                editable={isTimerRunning} returnKeyType="done"
                            />
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{justifyContent:'center', paddingBottom:15}}><MaterialCommunityIcons name="arrow-right" size={16} color={colors.textMuted}/></View>
                <View style={{flex:1, paddingLeft:5}}>
                    <Text style={{color: techInfo.color, fontSize: 8, fontWeight: 'bold', marginBottom: 3, textAlign: 'center'}}>DROP</Text>
                    <TouchableOpacity onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                        <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                            <TextInput 
                                style={[{backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold'}, lastWeights[item.id]?.[`${currentSetNum}_DROP`] && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                                onEndEditing={(e) => { 
                                    handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_DROP`);
                                    startRestTimer(currentSetNum);
                                }}
                                editable={isTimerRunning} returnKeyType="done"
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
          );
      }

      const val = lastWeights[item.id]?.[currentSetNum];
      const isCompleted = val !== undefined && val !== '';
      
      return (
        <View style={{flex: 1.5, alignItems:'center'}}>
            <Text style={{color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3}}>CARGA (KG)</Text>
            <TouchableOpacity onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                <View 
                    pointerEvents={isTimerRunning ? 'auto' : 'none'} 
                    style={[{backgroundColor: colors.inputBg, height: 40, width: '100%', borderRadius: 8, borderWidth: 1, borderColor: colors.border, justifyContent:'center'}, isCompleted && {borderColor: colors.primary}, !isTimerRunning && {opacity: 0.5}]}
                >
                    <TextInput 
                        style={[{color: colors.text, width: '100%', height: '100%', textAlign: 'center', fontSize: 16, fontWeight: 'bold'}, isCompleted && {color: colors.primary}]}
                        placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric"
                        value={val !== undefined ? String(val) : ''}
                        onChangeText={(text) => handleSaveWeight(item.id, text, currentSetNum)}
                        onSubmitEditing={() => {
                            Keyboard.dismiss();
                            handleSmartCheck(currentSetNum, val);
                        }}
                        editable={isTimerRunning} returnKeyType="done"
                    />
                </View>
            </TouchableOpacity>
            <Text style={{color: colors.textMuted, fontSize: 9, marginTop:2}}>Ant: {getPreviousWeight(currentSetNum)}</Text>
        </View>
      );
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={[
          {backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border},
          biSetType === 'start' && { borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderBottomWidth: 0, marginBottom: 0 },
          biSetType === 'end' && { borderTopLeftRadius: 4, borderTopRightRadius: 4, borderTopWidth: 0, marginTop: 2 },
          biSetType && { borderColor: colors.primary, borderWidth: 1 }
      ]}>
        
        {/* VÍDEO HEADER */}
        <View style={{ height: 180, width: '100%', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
            {videoLink ? (
                <Video ref={videoRef} style={[StyleSheet.absoluteFillObject, { opacity: 0.7 }]} source={{ uri: videoLink }} resizeMode={ResizeMode.COVER} isMuted={true} shouldPlay={true} isLooping={true} />
            ) : (
                <View style={[StyleSheet.absoluteFillObject, { opacity: 0.7, backgroundColor: '#222', justifyContent:'center', alignItems:'center'}]}><MaterialCommunityIcons name="dumbbell" size={40} color="#444" /></View>
            )}

            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'space-between', padding: 15 }}>
                <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', alignItems:'flex-start'}}>
                    <View>
                        {techInfo.key && (
                            <TouchableOpacity style={{ backgroundColor: techInfo.color, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6}} onPress={() => { if(setSelectedTech && setTechModalVisible) { setSelectedTech(techInfo.key); setTechModalVisible(true); }}}>
                                <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                                    <MaterialCommunityIcons name="information-outline" size={12} color={colors.bg === '#000000' && (techInfo.key === 'BISET' || techInfo.key === '21') ? '#000' : '#FFF'} />
                                    <Text style={{ color: colors.bg === '#000000' && (techInfo.key === 'BISET' || techInfo.key === '21') ? '#000' : '#FFF', fontSize: 10, fontWeight: '900' }}>{techInfo.label}</Text>
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
                            <Text style={{ color: '#DDD', fontSize: 12, fontWeight: 'bold' }}>{item.sets} séries x {item.reps} reps</Text>
                        </View>
                        <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }} onPress={() => handleOpenVideo(videoLink)}><MaterialCommunityIcons name="play" size={24} color={colors.primaryText} /></TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>

        {/* INPUTS BODY */}
        <View style={{ padding: 15 }}>
            {[...Array(totalSets)].map((_, i) => {
                const currentSetNum = i + 1;
                const isActive = activeSetIndex === currentSetNum && isResting;
                
                const val = lastWeights[item.id]?.[currentSetNum];
                const isFilled = val !== undefined && val !== '';
                const mainFilled = lastWeights[item.id]?.[`${currentSetNum}_MAIN`];

                const checkColor = isFilled || mainFilled ? colors.primary : colors.textMuted;
                const checkIcon = isFilled || mainFilled ? "check-circle" : "circle-outline";

                return (
                    <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 5, paddingHorizontal: 5, borderRadius: 8 }, isActive && {backgroundColor: `${colors.primary}1A`, borderColor: techInfo.color || colors.primary, borderWidth:1}]}>
                        <View style={{width: 30, alignItems:'center', marginRight: 10}}>
                            <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: 'bold' }}>{currentSetNum}</Text>
                            </View>
                        </View>

                        <View style={{flex: 1}}>
                            {renderInputArea(i, currentSetNum, isActive)}
                        </View>

                         <View style={{width: 36, alignItems:'flex-end', marginLeft: 5, justifyContent:'center'}}>
                             <TouchableOpacity 
                                style={{padding: 5}} 
                                onPress={() => {
                                    if (categoryType === 'MOBILITY') {
                                        setActiveSetIndex(currentSetNum + 1); 
                                    } else {
                                        handleSmartCheck(currentSetNum, val);
                                    }
                                }}
                             >
                                 <MaterialCommunityIcons name={checkIcon} size={28} color={checkColor} />
                             </TouchableOpacity>
                        </View>
                    </View>
                );
            })}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                     <MaterialCommunityIcons name="timer-sand" size={14} color={colors.textMuted} />
                     <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: 'bold' }}>
                        {categoryType === 'MOBILITY' ? 'Execução contínua' :
                         techInfo.key === 'RESTPAUSE' ? '20s (Rest-Pause)' : 
                         techInfo.key === 'GVT' ? '60s (Rígido)' :
                         biSetType === 'start' ? 'Sem descanso' : 
                         `${standardRestTime}s intervalo`}
                     </Text>
                </View>
            </View>

            {onSwap && (
                <TouchableOpacity onPress={onSwap} style={{ backgroundColor: '#FF9500', marginTop: 15, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="swap-horizontal" size={16} color="#000" />
                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }}>TROCAR EXERCÍCIO</Text>
                </TouchableOpacity>
            )}
        </View>

        {/* MODAL TIMER */}
        <Modal visible={isResting} animationType="fade" transparent>
            <View style={{ flex: 1, backgroundColor: colors.glass, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '85%', padding: 40, backgroundColor: colors.surface, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: techInfo.color || colors.textMuted, fontSize: 16, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textAlign:'center' }}>{timerMessage.title}</Text>
                    <Text style={{ fontSize: 90, fontWeight: '900', marginVertical: 10, color: colors.text }}>{seconds}s</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', lineHeight: 22 }}>{timerMessage.desc}</Text>
                    <TouchableOpacity style={{ marginTop: 10, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, flexDirection:'row', gap: 8, alignItems:'center' }} onPress={() => setSeconds(0)}>
                        <Text style={{ color: colors.primaryText, fontWeight: '900', fontSize: 14 }}>PULAR</Text>
                        <MaterialCommunityIcons name="skip-next" size={16} color={colors.primaryText}/>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </View>
      {biSetType === 'start' && <View style={{ alignSelf:'center', height: 20, width: 40, backgroundColor: colors.primary, justifyContent:'center', alignItems:'center', borderRadius: 10, marginTop: -10, marginBottom: -10, zIndex: 10 }}><MaterialCommunityIcons name="link-variant" size={16} color={colors.primaryText}/></View>}
    </View>
  );
};