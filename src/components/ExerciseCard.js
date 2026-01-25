import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, Keyboard, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const identifyTechnique = (rawName) => {
  const defaultInfo = { key: null, color: '#333', label: null };
  if (!rawName) return defaultInfo;
  
  const clean = rawName.toUpperCase(); 
  
  if (clean.includes('CLUSTER')) return { key: 'CLUSTERSET', color: '#BF5AF2', label: 'CLUSTER' };
  if (clean.includes('DROP')) return { key: 'DROPSET', color: '#FF3B30', label: 'DROP-SET' };
  if (clean.includes('REST')) return { key: 'RESTPAUSE', color: '#FF9500', label: 'REST-PAUSE' }; 
  if (clean.includes('GVT')) return { key: 'GVT', color: '#00FF7F', label: 'GVT' };
  if (clean.includes('21')) return { key: '21', color: '#32ADE6', label: 'MÉTODO 21' };
  if (clean.includes('BI') || clean.includes('BI-SET') || clean.includes('BISET')) return { key: 'BISET', color: '#CCFF00', label: 'BI-SET' };
  
  return defaultInfo;
};

const getCategoryType = (item) => {
    const name = (item.exercise?.name || item.name || "").toLowerCase();
    const category = (item.exercise?.category || "").toLowerCase();
    
    if (name.includes('mobilidade') || name.includes('alongamento') || category.includes('mobilidade') || category.includes('alongamento')) {
        return 'MOBILITY';
    }
    if (name.includes('esteira') || name.includes('bike') || name.includes('elíptico') || name.includes('corrida') || category.includes('cardio')) {
        return 'CARDIO';
    }
    return 'STRENGTH';
};

export const ExerciseCard = ({ 
  item, totalSets, lastWeights, historyWeights, 
  handleSaveWeight, handleOpenVideo, setModalVisible, 
  setSelectedTech, setTechModalVisible, TECH_GUIDE,
  isLastExercise, biSetType, onSwap, onOpenCalc, isTimerRunning
}) => {
  
  const exerciseTitle = item.exercise?.name || item.name || "Exercício";
  const videoLink = item.exercise?.videoUrl || item.videoUrl;
  const standardRestTime = item.restTime || 60;
  
  const rawTech = item.notes || item.technique || "";
  const techInfo = identifyTechnique(rawTech);
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
      if (activeSetIndex === totalSets && isLastExercise) Alert.alert("🔥 TREINO FINALIZADO!", "Parabéns!");
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

  const containerStyles = [
      styles.cardContainer,
      biSetType === 'start' && styles.biSetStart,
      biSetType === 'end' && styles.biSetEnd,
      (biSetType) && { borderColor: '#CCFF00', borderWidth: 1 }
  ];

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
          Keyboard.dismiss(); // Garante que o teclado não suba
          Alert.alert("Treino Pausado", "Clique em INICIAR TREINO no topo da tela para liberar os campos.");
      }
  };

  const renderInputArea = (i, currentSetNum, isActive) => {
      
      // 1. MOBILIDADE
      if (categoryType === 'MOBILITY') {
          return (
            <View style={{flex: 1.5, alignItems:'center', justifyContent:'center'}}>
                <Text style={styles.mobilityText}>EXECUÇÃO</Text>
                <Text style={styles.repsTextSmall}>{item.reps || "Fazer"} Reps</Text>
            </View>
          );
      }

      // 2. CARDIO
      if (categoryType === 'CARDIO') {
        const isCompleted = lastWeights[item.id]?.[currentSetNum];
        return (
            <View style={{flex: 1.5, alignItems:'center'}}>
                <Text style={styles.miniLabel}>TEMPO / KM</Text>
                <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                    <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                        <TextInput 
                            style={[styles.inputBox, isCompleted && {color:'#CCFF00', borderColor:'#CCFF00'}, !isTimerRunning && {opacity: 0.5}]}
                            placeholder="Min/Km" placeholderTextColor="#333" keyboardType="default"
                            onEndEditing={(e) => { handleSaveWeight(item.id, e.nativeEvent.text, currentSetNum); }}
                            editable={isTimerRunning}
                            returnKeyType="done"
                            returnKeyLabel="FEITO"
                        />
                    </View>
                </Pressable>
                <Text style={styles.prevTextSmall}>Ant: {getPreviousWeight(currentSetNum)}</Text>
            </View>
        );
      }

      // --- STRENGTH ---

      // 3. CLUSTER SET
      if (techInfo.key === 'CLUSTERSET') {
          return (
            <View style={styles.multiInputContainer}>
                {['BLOCO 1', 'BLOCO 2', 'BLOCO 3'].map((label, idx) => {
                    const suffix = `CL${idx+1}`;
                    const val = lastWeights[item.id]?.[`${currentSetNum}_${suffix}`];
                    const isDone = val !== undefined && val !== '';
                    return (
                        <View key={idx} style={{flex:1, paddingHorizontal:2}}>
                            <Text style={styles.miniLabel}>{label}</Text>
                            <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                                <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                                    <TextInput 
                                        style={[styles.inputBoxSmall, isDone && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                        placeholder="KG" placeholderTextColor="#333" keyboardType="numeric"
                                        onEndEditing={(e) => { 
                                            handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_${suffix}`); 
                                            startRestTimer(currentSetNum, idx < 2 ? 'CLUSTER_INTRA' : 'NORMAL');
                                        }}
                                        editable={isTimerRunning}
                                        returnKeyType="done"
                                        returnKeyLabel="FEITO"
                                    />
                                </View>
                            </Pressable>
                        </View>
                    )
                })}
            </View>
          );
      }

      // 4. MÉTODO 21
      if (techInfo.key === '21') {
          return (
            <View style={styles.multiInputContainer}>
                {['INF', 'SUP', 'FULL'].map((label, idx) => {
                    const suffix = label;
                    const val = lastWeights[item.id]?.[`${currentSetNum}_${suffix}`];
                    const isDone = val !== undefined && val !== '';
                    return (
                        <View key={idx} style={{flex:1, paddingHorizontal:2}}>
                            <Text style={styles.miniLabel}>{label}</Text>
                            <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                                <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                                    <TextInput 
                                        style={[styles.inputBoxSmall, isDone && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                        placeholder="KG" placeholderTextColor="#333" keyboardType="numeric"
                                        onEndEditing={(e) => { 
                                            handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_${suffix}`); 
                                            if (idx === 2) startRestTimer(currentSetNum); 
                                        }}
                                        editable={isTimerRunning}
                                        returnKeyType="done"
                                        returnKeyLabel="FEITO"
                                    />
                                </View>
                            </Pressable>
                        </View>
                    )
                })}
            </View>
          );
      }

      // 5. DROP-SET
      if (techInfo.key === 'DROPSET') {
          return (
            <View style={styles.multiInputContainer}>
                <View style={{flex:1, paddingRight:5}}>
                    <Text style={styles.miniLabel}>CARGA</Text>
                    <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                        <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                            <TextInput 
                                style={[styles.inputBox, lastWeights[item.id]?.[`${currentSetNum}_MAIN`] && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                placeholder="KG" placeholderTextColor="#333" keyboardType="numeric"
                                onEndEditing={(e) => handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_MAIN`)}
                                editable={isTimerRunning}
                                returnKeyType="done"
                                returnKeyLabel="FEITO"
                            />
                        </View>
                    </Pressable>
                </View>
                <View style={{justifyContent:'center', paddingBottom:15}}><MaterialCommunityIcons name="arrow-right" size={16} color="#444"/></View>
                <View style={{flex:1, paddingLeft:5}}>
                    <Text style={[styles.miniLabel, {color: techInfo.color}]}>DROP</Text>
                    <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                        <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                            <TextInput 
                                style={[styles.inputBox, lastWeights[item.id]?.[`${currentSetNum}_DROP`] && {borderColor: techInfo.color, color: techInfo.color}, !isTimerRunning && {opacity: 0.5}]}
                                placeholder="KG" placeholderTextColor="#333" keyboardType="numeric"
                                onEndEditing={(e) => { 
                                    handleSaveWeight(item.id, e.nativeEvent.text, `${currentSetNum}_DROP`);
                                    startRestTimer(currentSetNum);
                                }}
                                editable={isTimerRunning}
                                returnKeyType="done"
                                returnKeyLabel="FEITO"
                            />
                        </View>
                    </Pressable>
                </View>
            </View>
          );
      }

      // 6. FORÇA PADRÃO
      const val = lastWeights[item.id]?.[currentSetNum];
      const isCompleted = val !== undefined && val !== '';
      
      return (
        <View style={{flex: 1.5, alignItems:'center'}}>
            <Text style={styles.miniLabel}>CARGA (KG)</Text>
            
            <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{width:'100%'}}>
                <View 
                    pointerEvents={isTimerRunning ? 'auto' : 'none'} 
                    style={[styles.inputWrapper, isCompleted && {borderColor: '#CCFF00'}, !isTimerRunning && {opacity: 0.5, borderColor: '#333'}]}
                >
                    <TextInput 
                        style={[styles.input, isCompleted && {color: '#CCFF00'}]}
                        placeholder="0" 
                        placeholderTextColor="#444" 
                        keyboardType="numeric"
                        value={val !== undefined ? String(val) : ''}
                        onChangeText={(text) => handleSaveWeight(item.id, text, currentSetNum)}
                        onSubmitEditing={() => {
                            Keyboard.dismiss();
                            handleSmartCheck(currentSetNum, val);
                        }}
                        editable={isTimerRunning}
                        returnKeyType="done"
                        returnKeyLabel="FEITO"
                    />
                </View>
            </Pressable>
            
            <Text style={styles.prevTextSmall}>Ant: {getPreviousWeight(currentSetNum)}</Text>
        </View>
      );
  };

  const getWeightVal = (setNum, suffix = '') => {
      const key = suffix ? `${setNum}_${suffix}` : setNum;
      if (historyWeights && historyWeights[item.exerciseId]) {
          const val = historyWeights[item.exerciseId][key];
          if (val) return `${val}`;
      }
      return '-';
  };

  return (
    <View style={styles.wrapper}>
      <View style={containerStyles}>
        
        {/* VÍDEO HEADER */}
        <View style={styles.videoHeader}>
            {videoLink ? (
                <Video ref={videoRef} style={styles.videoPreview} source={{ uri: videoLink }} resizeMode={ResizeMode.COVER} isMuted={true} shouldPlay={true} isLooping={true} />
            ) : (
                <View style={[styles.videoPreview, {backgroundColor: '#222', justifyContent:'center', alignItems:'center'}]}><MaterialCommunityIcons name="dumbbell" size={40} color="#444" /></View>
            )}

            <View style={styles.videoOverlay}>
                <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', alignItems:'flex-start'}}>
                    <View>
                        {techInfo.key && (
                            <TouchableOpacity style={[styles.techBadge, {backgroundColor: techInfo.color}]} onPress={() => { if(setSelectedTech && setTechModalVisible) { setSelectedTech(techInfo.key); setTechModalVisible(true); }}}>
                                <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                                    <MaterialCommunityIcons name="information-outline" size={12} color={techInfo.key === 'BISET' || techInfo.key === '21' ? '#000' : '#FFF'} />
                                    <Text style={[styles.techText, (techInfo.key === 'BISET' || techInfo.key === '21') && {color:'#000'}]}>{techInfo.label}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                
                {/* BOTÕES DE FERRAMENTAS COM TEXTO EXPLÍCITO */}
                {showTools && (
                    <View style={styles.toolsRow}>
                        <TouchableOpacity style={styles.toolBtnText} onPress={onOpenCalc}>
                            <MaterialCommunityIcons name="calculator" size={14} color="#FFF" />
                            <Text style={styles.toolBtnLabel}>CALCULAR CARGA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtnText} onPress={setModalVisible}>
                            <MaterialCommunityIcons name="camera-metering-spot" size={14} color="#FFF" />
                            <Text style={styles.toolBtnLabel}>ANÁLISE DE MOVIMENTO</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.titleArea}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end'}}>
                        <View style={{flex:1}}>
                            <Text style={styles.exTitle}>{exerciseTitle}</Text>
                            <Text style={styles.exMeta}>{item.sets} séries x {item.reps} reps</Text>
                        </View>
                        <TouchableOpacity style={styles.playBtn} onPress={() => handleOpenVideo(videoLink)}><MaterialCommunityIcons name="play" size={24} color="#000" /></TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>

        {/* INPUTS BODY */}
        <View style={styles.inputsBody}>
            {[...Array(totalSets)].map((_, i) => {
                const currentSetNum = i + 1;
                const isActive = activeSetIndex === currentSetNum && isResting;
                
                const val = lastWeights[item.id]?.[currentSetNum];
                const isFilled = val !== undefined && val !== '';
                const mainFilled = lastWeights[item.id]?.[`${currentSetNum}_MAIN`];

                const checkColor = isFilled || mainFilled ? "#CCFF00" : "#333";
                const checkIcon = isFilled || mainFilled ? "check-circle" : "circle-outline";

                return (
                    <View key={i} style={[styles.setRow, isActive && {backgroundColor:'rgba(204,255,0,0.05)', borderColor: techInfo.color || '#CCFF00', borderWidth:1}]}>
                        {/* Nº Série */}
                        <View style={{width: 30, alignItems:'center', marginRight: 10}}>
                            <View style={[styles.setNumberBadge, {backgroundColor: '#222'}]}>
                                <Text style={[styles.setNumberText, {color:'#888'}]}>{currentSetNum}</Text>
                            </View>
                        </View>

                        {/* INPUT DINÂMICO */}
                        <View style={{flex: 1}}>
                            {renderInputArea(i, currentSetNum, isActive)}
                        </View>

                         {/* CHECK VISUAL + AÇÃO */}
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

            <View style={styles.cardFooter}>
                <View style={styles.restInfo}>
                     <MaterialCommunityIcons name="timer-sand" size={14} color="#666" />
                     <Text style={styles.footerText}>
                        {categoryType === 'MOBILITY' ? 'Execução contínua' :
                         techInfo.key === 'RESTPAUSE' ? '20s (Rest-Pause)' : 
                         techInfo.key === 'GVT' ? '60s (Rígido)' :
                         biSetType === 'start' ? 'Sem descanso' : 
                         `${standardRestTime}s intervalo`}
                     </Text>
                </View>
            </View>

            {onSwap && (
                <TouchableOpacity onPress={onSwap} style={styles.swapBtnBig}>
                    <MaterialCommunityIcons name="swap-horizontal" size={16} color="#000" />
                    <Text style={styles.swapBtnText}>TROCAR EXERCÍCIO</Text>
                </TouchableOpacity>
            )}
        </View>

        {/* MODAL TIMER */}
        <Modal visible={isResting} animationType="fade" transparent>
            <View style={styles.glassOverlay}>
                <View style={styles.timerBox}>
                    <Text style={[styles.timerLabel, {color: techInfo.color || '#888'}]}>{timerMessage.title}</Text>
                    <Text style={[styles.timerValue, {color: '#FFF'}]}>{seconds}s</Text>
                    <Text style={styles.timerHint}>{timerMessage.desc}</Text>
                    <TouchableOpacity style={styles.skipBtn} onPress={() => setSeconds(0)}>
                        <Text style={styles.skipText}>PULAR</Text>
                        <MaterialCommunityIcons name="skip-next" size={16} color="#000"/>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </View>
      {biSetType === 'start' && <View style={styles.biSetConnector}><MaterialCommunityIcons name="link-variant" size={16} color="#000"/></View>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  cardContainer: { backgroundColor: '#111', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  biSetStart: { borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderBottomWidth: 0, marginBottom: 0 },
  biSetEnd: { borderTopLeftRadius: 4, borderTopRightRadius: 4, borderTopWidth: 0, marginTop: 2 },
  biSetConnector: { alignSelf:'center', height: 20, width: 40, backgroundColor: '#CCFF00', justifyContent:'center', alignItems:'center', borderRadius: 10, marginTop: -10, marginBottom: -10, zIndex: 10 },

  videoHeader: { height: 180, width: '100%', backgroundColor: '#000', position: 'relative' },
  videoPreview: { width: '100%', height: '100%', opacity: 0.7 },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'space-between', padding: 15 },
  
  // ESTILOS NOVOS DOS BOTÕES NO HEADER
  toolsRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignSelf:'flex-start' },
  toolBtnText: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  toolBtnLabel: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  techBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, elevation: 3 },
  techText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  titleArea: { marginTop: 'auto' },
  exTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  exMeta: { color: '#DDD', fontSize: 12, fontWeight: 'bold' },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CCFF00', justifyContent: 'center', alignItems: 'center' },

  inputsBody: { padding: 15 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 5, paddingHorizontal: 5, borderRadius: 8 },
  multiInputContainer: { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
  setNumberBadge: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  setNumberText: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  miniLabel: { color: '#555', fontSize: 8, fontWeight: 'bold', marginBottom: 3, textAlign: 'center' },
  
  inputWrapper: { height: 40, width: '100%', borderRadius: 8, borderWidth: 1, borderColor: '#222', backgroundColor: '#080808', justifyContent:'center' },
  input: { color: '#FFF', width: '100%', height: '100%', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },

  inputBox: { backgroundColor: '#080808', color: '#FFF', height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: '#222', fontSize: 16, fontWeight: 'bold' },
  inputBoxSmall: { backgroundColor: '#080808', color: '#FFF', height: 36, width: '100%', borderRadius: 6, textAlign: 'center', borderWidth: 1, borderColor: '#222', fontSize: 13, fontWeight: 'bold' },
  prevTextSmall: { color: '#444', fontSize: 9, textAlign:'center', marginTop:2 },
  
  mobilityText: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  repsTextSmall: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 10 },
  restInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { color: '#666', fontSize: 11, fontWeight: 'bold' },
  swapBtnBig: { backgroundColor: '#FF9500', marginTop: 15, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  swapBtnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

  glassOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  timerBox: { width: '85%', padding: 40, backgroundColor: '#111', borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  timerLabel: { color: '#888', fontSize: 16, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textAlign:'center' },
  timerValue: { fontSize: 90, fontWeight: '900', marginVertical: 10 },
  timerHint: { color: '#AAA', fontSize: 14, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', lineHeight: 22 },
  skipBtn: { marginTop: 10, backgroundColor: '#CCFF00', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, flexDirection:'row', gap: 8, alignItems:'center' },
  skipText: { color: '#000', fontWeight: '900', fontSize: 14 }
});