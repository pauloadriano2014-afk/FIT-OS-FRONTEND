// src/components/MontarTreino/ExerciseCardAdmin.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SmartThumbnail from './SmartThumbnail'; 

const HybridInput = ({ label, value, onChangeText, options, theme, isCardio, widthWeight = 1, keyboardType = 'default', onSubmitEditing, nextFocusRef, inputRef }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    
    return (
        <View style={[styles.inputBox, { flex: widthWeight, position: 'relative', zIndex: showDropdown ? 100 : 1 }]}>
            <Text style={[styles.miniLabel, { color: isCardio ? theme.accent : theme.textSecondary }]}>{label}</Text>
            <TextInput 
                ref={inputRef}
                style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                value={String(value)} 
                keyboardType={keyboardType} 
                onChangeText={(v) => {
                    onChangeText(v);
                    setShowDropdown(true);
                }} 
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                onSubmitEditing={() => {
                    setShowDropdown(false);
                    if (onSubmitEditing) onSubmitEditing();
                    else if (nextFocusRef?.current) nextFocusRef.current.focus();
                }}
                blurOnSubmit={!nextFocusRef}
            />
            {showDropdown && options && options.length > 0 && (
                <View style={[styles.hybridDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {options.map((opt, i) => {
                            if (opt.isTitle) {
                                return (
                                    <View key={`title-${i}`} style={{ backgroundColor: theme.bg, paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.accent, textAlign: 'center' }}>{opt.label}</Text>
                                    </View>
                                );
                            }
                            return (
                                <TouchableOpacity 
                                    key={`opt-${i}`} 
                                    style={styles.hybridOption} 
                                    onPress={() => {
                                        onChangeText(String(opt.val));
                                        setShowDropdown(false);
                                        if (nextFocusRef?.current) nextFocusRef.current.focus();
                                    }}
                                >
                                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold', textAlign: 'center' }} numberOfLines={1}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const BlockRow = ({ 
    bloco, bIndex, index, isCardio, theme, atualizarBloco, removerBloco, adicionarBloco, 
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible, workoutModel, OPTIONS_SETS, OPTIONS_REPS, OPTIONS_REST, canRemove 
}) => {
    const refSets = useRef(null);
    const refReps = useRef(null);
    const refRest = useRef(null);
    const refLoad = useRef(null);

    return (
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: theme.bg, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border, zIndex: 100 - bIndex }}>
            
            <HybridInput 
                inputRef={refSets}
                label={isCardio ? "MINUTOS" : "SÉRIES"}
                value={bloco.sets}
                onChangeText={(v) => atualizarBloco(index, bIndex, 'sets', v)}
                options={OPTIONS_SETS}
                theme={theme} isCardio={isCardio}
                keyboardType="numeric"
                nextFocusRef={refReps}
            />

            <HybridInput 
                inputRef={refReps}
                label={isCardio ? "KCAL ALVO" : "REPS"}
                value={bloco.reps}
                onChangeText={(v) => atualizarBloco(index, bIndex, 'reps', v)}
                options={OPTIONS_REPS}
                theme={theme} isCardio={isCardio}
                keyboardType={isCardio ? "numeric" : "default"}
                nextFocusRef={workoutModel === 'CARGA' && !isCardio ? refLoad : (!isCardio ? refRest : null)}
            />
            
            {workoutModel === 'CARGA' && !isCardio && (
                <View style={styles.inputBox}>
                    <Text style={[styles.miniLabel, { color: theme.accent }]}>ALVO / CARGA</Text>
                    <TextInput 
                        ref={refLoad}
                        style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.accent, borderColor: theme.accent }]} 
                        value={bloco.load || ''} 
                        keyboardType="default" 
                        placeholder="Ex: 15kg lado" 
                        placeholderTextColor={theme.textSecondary} 
                        onChangeText={(v) => atualizarBloco(index, bIndex, 'load', v)}
                        onSubmitEditing={() => refRest.current?.focus()} 
                    />
                </View>
            )}

            {!isCardio && (
                <HybridInput 
                    inputRef={refRest}
                    label="DESC(s)"
                    value={bloco.restTime}
                    onChangeText={(v) => atualizarBloco(index, bIndex, 'restTime', v)}
                    options={OPTIONS_REST}
                    theme={theme} isCardio={false}
                    keyboardType="numeric"
                    onSubmitEditing={() => adicionarBloco(index)}
                />
            )}

            <TouchableOpacity style={[styles.techBox, { backgroundColor: theme.surface, borderColor: theme.border, flex: isCardio ? 1.5 : 1 }]} onPress={() => { setIndexExercicioAtual(index); setIndexBlocoAtual(bIndex); setModalTecnicaVisible(true); }}>
                <Text style={[styles.miniLabel, { color: isCardio ? theme.accent : theme.textSecondary }]}>{isCardio ? "INTENSIDADE" : "TÉCNICA"}</Text>
                <Text style={{color: bloco.technique ? theme.accent : theme.textSecondary, fontSize:10, fontWeight:'bold', textAlign: 'center'}} numberOfLines={1}>{bloco.technique || (isCardio ? 'Moderada' : 'NORMAL')}</Text>
            </TouchableOpacity>
            
            {canRemove && (
                <TouchableOpacity onPress={() => removerBloco(index, bIndex)} style={{ padding: 5 }}>
                    <MaterialCommunityIcons name="close" size={18} color="#FF3B30" />
                </TouchableOpacity>
            )}
        </View>
    );
};

export default function ExerciseCardAdmin({ 
    item, index, theme, isReordering, moveExercise, removeExercicio, 
    setIsSelectingSubstitute, setTargetIndexForSubstitute, setModalBuscaVisible, 
    removeSubstitute, atualizarBloco, adicionarBloco, removerBloco, 
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible, 
    atualizarObservacao, openPreview, currentExercisesLength,
    setIsSwapping, setSwapIndex, setInitialCategoryFilter,
    workoutModel 
}) {
    const videoUrl = item.exercise?.videoUrl || item.videoUrl || "";
    const isCardio = item.category?.toUpperCase() === 'CARDIO';
    const isGhost = String(item.exerciseId || '').startsWith('custom_');

    const [showObsDropdown, setShowObsDropdown] = useState(false);
    const [showPyramidDropdown, setShowPyramidDropdown] = useState(false);

    const QUICK_OBS = [
        "Faça até a falha",
        "Descanse apenas após executar com os 2 braços",
        "Descansar apenas após executar com as 2 pernas",
        "Pode mesclar os cardios, respeite as calorias",
        "30 a 60 segundos mantendo a posição",
        "Foque na fase excêntrica (descida controlada)",
        "Use carga máxima para a meta de reps"
    ];

    const OPTIONS_SETS = isCardio 
        ? [{val: 10, label: '10'}, {val: 15, label: '15'}, {val: 20, label: '20'}, {val: 30, label: '30'}, {val: 45, label: '45'}, {val: 60, label: '60'}]
        : [1,2,3,4,5,6,7,8,9,10].map(n => ({val: n, label: String(n)}));

    // 🔥 LISTA LIMPA, APENAS REPS NORMAIS 🔥
    const OPTIONS_REPS = isCardio
        ? [{val: 150, label: '150'}, {val: 200, label: '200'}, {val: 250, label: '250'}, {val: 300, label: '300'}, {val: 400, label: '400'}]
        : [
            {val: 'FALHA', label: 'FALHA'}, {val: '6', label: '6'}, {val: '8', label: '8'}, {val: '10', label: '10'}, {val: '12', label: '12'}, {val: '15', label: '15'}, {val: '20', label: '20'}, {val: '30', label: '30'}
        ];

    const OPTIONS_REST = [5,10,15,30,45,60,90,120].map(n => ({val: n, label: String(n)}));

    if (isReordering) {
        return (
            <View style={[styles.reorderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{flex:1}}>
                    <Text style={[styles.manualExName, { color: theme.text }]}>{index + 1}. {item.title}</Text>
                </View>
                <View style={{flexDirection:'row', gap:10}}>
                    <TouchableOpacity onPress={() => moveExercise(index, 'up')} style={[styles.arrowBtn, { backgroundColor: theme.accent }, index === 0 && {opacity:0.3}]} disabled={index === 0}>
                        <MaterialCommunityIcons name="arrow-up-bold" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveExercise(index, 'down')} style={[styles.arrowBtn, { backgroundColor: theme.accent }, index === currentExercisesLength - 1 && {opacity:0.3}]} disabled={index === currentExercisesLength - 1}>
                        <MaterialCommunityIcons name="arrow-down-bold" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.manualCard, { backgroundColor: isGhost ? (theme.isDark ? '#330000' : '#FFF0F0') : theme.surface, borderColor: isGhost ? '#FF3B30' : theme.border, zIndex: 1000 - index }]}>
            
            <View style={styles.cardTop}>
                <View style={{flexDirection:'row', alignItems:'center', flex:1, gap:10}}>
                    {!isGhost && (
                        <SmartThumbnail url={videoUrl} style={styles.thumbMini} theme={theme} onPress={() => openPreview({ ...item, name: item.title, isAdded: true })} />
                    )}
                    <View style={{flex: 1}}>
                        <Text style={[styles.manualExName, { color: isGhost ? '#FF3B30' : theme.text }]}>{index + 1}. {item.title}</Text>
                        {isGhost && (
                            <View style={{backgroundColor: '#FF3B30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4}}>
                                <Text style={{color: '#FFF', fontSize: 9, fontWeight: 'bold'}}>⚠️ NÃO VINCULADO</Text>
                            </View>
                        )}
                        {isCardio && !isGhost && <View style={[styles.catTag, { backgroundColor: theme.bg, borderColor: theme.accent }]}><Text style={{fontSize: 9, color: theme.accent, fontWeight: 'bold'}}>CARDIO</Text></View>}
                    </View>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <TouchableOpacity 
                        onPress={() => { 
                            setIsSwapping(true); setSwapIndex(index); 
                            if (item.category && setInitialCategoryFilter) setInitialCategoryFilter(item.category);
                            setModalBuscaVisible(true); 
                        }} 
                        style={{ padding: 8, backgroundColor: isGhost ? '#FF3B30' : theme.accent + '22', borderRadius: 8, marginRight: 5 }}
                    >
                        <MaterialCommunityIcons name={isGhost ? "link-variant-plus" : "sync"} size={20} color={isGhost ? '#FFF' : theme.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeExercicio(item.tempId)} style={{ padding: 8 }}>
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>

            {item.substitute ? (
                <View style={[styles.substituteRow, { backgroundColor: theme.bg, borderColor: theme.accent + '55' }]}>
                    <MaterialCommunityIcons name="swap-horizontal" size={16} color={theme.accent} />
                    <Text style={[styles.subLabel, { color: theme.accent }]}>Ou:</Text>
                    <Text style={[styles.subName, { color: theme.text }]}>{item.substitute.name}</Text>
                    <TouchableOpacity onPress={() => removeSubstitute(index)}><MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} /></TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.addSubBtn} onPress={() => { setIsSelectingSubstitute(true); setTargetIndexForSubstitute(index); if (item.category && setInitialCategoryFilter) setInitialCategoryFilter(item.category); setModalBuscaVisible(true); }}>
                    <Text style={[styles.addSubText, { color: theme.textSecondary }]}>+ Adicionar opção de troca</Text>
                </TouchableOpacity>
            )}

            <View style={{ gap: 8, marginTop: 10, zIndex: 999 }}>
              {item.blocks && item.blocks.map((bloco, bIndex) => (
                  <BlockRow 
                      key={bIndex}
                      bloco={bloco} bIndex={bIndex} index={index} 
                      isCardio={isCardio} theme={theme} workoutModel={workoutModel}
                      OPTIONS_SETS={OPTIONS_SETS} OPTIONS_REPS={OPTIONS_REPS} OPTIONS_REST={OPTIONS_REST}
                      atualizarBloco={atualizarBloco} removerBloco={removerBloco} adicionarBloco={adicionarBloco}
                      setIndexExercicioAtual={setIndexExercicioAtual} setIndexBlocoAtual={setIndexBlocoAtual} 
                      setModalTecnicaVisible={setModalTecnicaVisible} canRemove={item.blocks.length > 1}
                  />
              ))}
              
              {/* 🔥 NOVOS BOTÕES INTELIGENTES (MANUAL VS BLOCO) 🔥 */}
              {!isCardio && (
                  <View style={{ marginTop: 6 }}>
                      <View style={{ flexDirection: 'row', gap: 10, marginBottom: showPyramidDropdown ? 8 : 0 }}>
                          <TouchableOpacity style={styles.actionAddBtn} onPress={() => adicionarBloco(index)}>
                              <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: 'bold' }}>Adição Manual</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity style={styles.actionAddBtn} onPress={() => setShowPyramidDropdown(!showPyramidDropdown)}>
                              <MaterialCommunityIcons name="layers-triple" size={16} color={theme.accent} />
                              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: 'bold' }}>Bloco de Séries</Text>
                          </TouchableOpacity>
                      </View>

                      {showPyramidDropdown && (
                          <View style={[styles.pyramidContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                              <Text style={[styles.miniLabel, { color: theme.textSecondary, marginBottom: 8, textAlign: 'left' }]}>ESCOLHA A ESTRUTURA (PIRÂMIDE):</Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                  {['12-10-8-8', '15-12-10-10', '15-12-12-10', '15-12-10-8', '12-12-10', '12-10-8'].map(p => (
                                      <TouchableOpacity 
                                          key={p} 
                                          style={[styles.pyramidBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                          onPress={() => {
                                              adicionarBloco(index, p); // Injeta a pirâmide
                                              setShowPyramidDropdown(false);
                                          }}
                                      >
                                          <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>{p}</Text>
                                      </TouchableOpacity>
                                  ))}
                              </View>
                          </View>
                      )}
                  </View>
              )}
            </View>

            <View style={{ marginTop: 20, zIndex: 50 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.miniLabel, { color: theme.textSecondary, marginBottom: 0 }]}>OBSERVAÇÃO (OPCIONAL)</Text>
                    <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.accent + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }} 
                        onPress={() => setShowObsDropdown(!showObsDropdown)}
                    >
                        <MaterialCommunityIcons name="lightbulb-on" size={14} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>
                            {showObsDropdown ? 'FECHAR' : 'INSERIR RÁPIDO ▾'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showObsDropdown && (
                    <View style={[styles.obsDropdownContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }} keyboardShouldPersistTaps="handled">
                            {QUICK_OBS.map((obsText, i) => (
                                <TouchableOpacity 
                                    key={i} 
                                    style={[styles.obsOption, { borderBottomColor: theme.border }]} 
                                    onPress={() => {
                                        const currentObs = item.observation || '';
                                        const separator = currentObs.length > 0 && !currentObs.endsWith(' ') ? ' - ' : '';
                                        atualizarObservacao(index, currentObs + separator + obsText);
                                        setShowObsDropdown(false);
                                    }}
                                >
                                    <Text style={{ color: theme.text, fontSize: 12 }}>+ {obsText}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <TextInput 
                    style={[styles.obsInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    placeholder="Adicionar observação manual..."
                    placeholderTextColor={theme.textSecondary}
                    value={item.observation || ''}
                    onChangeText={(text) => atualizarObservacao(index, text)}
                    multiline
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  reorderCard: { padding:15, borderRadius:12, marginBottom:10, flexDirection:'row', alignItems:'center', borderWidth:1 },
  arrowBtn: { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center' },
  manualCard: { padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', marginBottom: 15 },
  thumbMini: { width: 50, height: 50, borderRadius: 12 },
  manualExName: { fontWeight: '800', fontSize: 15 },
  catTag: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 4 },
  substituteRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 10, marginTop: 5, borderWidth: 1 },
  subLabel: { fontSize: 11, fontWeight: 'bold', marginHorizontal: 5 },
  subName: { fontSize: 13, flex: 1, fontWeight: '600' },
  addSubBtn: { paddingVertical: 5, marginBottom: 10 },
  addSubText: { fontSize: 11, fontStyle: 'italic', textDecorationLine: 'underline' },
  inputBox: { flex: 1 },
  techBox: { alignItems:'center', justifyContent:'center', borderRadius:8, borderWidth:1, paddingHorizontal: 4 },
  miniLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, textAlign:'center' },
  miniInput: { padding: 8, borderRadius: 8, fontSize: 16, textAlign: 'center', borderWidth: 1, fontWeight: 'bold', outlineStyle: 'none' },
  obsInput: { padding: 10, borderRadius: 8, borderWidth: 1, fontSize: 16, minHeight: 40, textAlignVertical: 'top', outlineStyle: 'none' },
  
  hybridDropdown: { position: 'absolute', top: 55, width: 140, left: -20, maxHeight: 200, borderWidth: 1, borderRadius: 8, zIndex: 100, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2 },
  hybridOption: { padding: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },

  obsDropdownContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 8, overflow: 'hidden' },
  obsOption: { padding: 12, borderBottomWidth: 1 },

  // 🔥 Estilos dos Novos Botões 🔥
  actionAddBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#4DE38F55', backgroundColor: '#4DE38F11', gap: 6 },
  pyramidContainer: { padding: 12, borderRadius: 8, borderWidth: 1 },
  pyramidBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1 }
});