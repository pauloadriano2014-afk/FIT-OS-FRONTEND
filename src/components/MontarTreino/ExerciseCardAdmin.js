import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SmartThumbnail from './SmartThumbnail'; 

export default function ExerciseCardAdmin({ 
    item, index, theme, isReordering, moveExercise, removeExercicio, 
    setIsSelectingSubstitute, setTargetIndexForSubstitute, setModalBuscaVisible, 
    removeSubstitute, atualizarBloco, adicionarBloco, removerBloco, 
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible, 
    atualizarObservacao, openPreview, currentExercisesLength,
    setIsSwapping, setSwapIndex
}) {
    const videoUrl = item.exercise?.videoUrl || item.videoUrl || "";
    const isCardio = item.category?.toUpperCase() === 'CARDIO';
    
    // 🔥 DETETIVE DE FANTASMAS (Verifica se a IA não encontrou o exercício)
    const isGhost = String(item.exerciseId || '').startsWith('custom_');

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
        <View style={[styles.manualCard, { backgroundColor: isGhost ? (theme.isDark ? '#330000' : '#FFF0F0') : theme.surface, borderColor: isGhost ? '#FF3B30' : theme.border }]}>
            
            <View style={styles.cardTop}>
                <View style={{flexDirection:'row', alignItems:'center', flex:1, gap:10}}>
                    {!isGhost && (
                        <SmartThumbnail 
                            url={videoUrl} 
                            style={styles.thumbMini} 
                            theme={theme} 
                            onPress={() => openPreview({ ...item, name: item.title, isAdded: true })} 
                        />
                    )}
                    <View style={{flex: 1}}>
                        <Text style={[styles.manualExName, { color: isGhost ? '#FF3B30' : theme.text }]}>{index + 1}. {item.title}</Text>
                        
                        {/* 🔥 TAG VERMELHA DE ALERTA SE FOR FANTASMA */}
                        {isGhost && (
                            <View style={{backgroundColor: '#FF3B30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4}}>
                                <Text style={{color: '#FFF', fontSize: 9, fontWeight: 'bold'}}>⚠️ NÃO VINCULADO</Text>
                            </View>
                        )}
                        {isCardio && !isGhost && <View style={[styles.catTag, { backgroundColor: theme.bg, borderColor: theme.accent }]}><Text style={{fontSize: 9, color: theme.accent, fontWeight: 'bold'}}>CARDIO</Text></View>}
                    </View>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    {/* 🔥 BOTÃO DE VINCULAR FANTASMA (Fica Vermelho/Destaque se for fantasma) */}
                    <TouchableOpacity 
                        onPress={() => { setIsSwapping(true); setSwapIndex(index); setModalBuscaVisible(true); }} 
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
                <TouchableOpacity style={styles.addSubBtn} onPress={() => { setIsSelectingSubstitute(true); setTargetIndexForSubstitute(index); setModalBuscaVisible(true); }}>
                    <Text style={[styles.addSubText, { color: theme.textSecondary }]}>+ Adicionar opção de troca</Text>
                </TouchableOpacity>
            )}

            <View style={{ gap: 8, marginTop: 10 }}>
              {item.blocks && item.blocks.map((bloco, bIndex) => (
                  <View key={bIndex} style={{ flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: theme.bg, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                      <View style={styles.inputBox}>
                          <Text style={[styles.miniLabel, { color: isCardio ? theme.accent : theme.textSecondary }]}>{isCardio ? "MINUTOS" : "SÉRIES"}</Text>
                          <TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={String(bloco.sets)} keyboardType="numeric" onChangeText={(v) => atualizarBloco(index, bIndex, 'sets', v)} />
                      </View>
                      <View style={styles.inputBox}>
                          <Text style={[styles.miniLabel, { color: isCardio ? theme.accent : theme.textSecondary }]}>{isCardio ? "KCAL ALVO" : "REPS"}</Text>
                          <TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={bloco.reps} keyboardType={isCardio ? "numeric" : "default"} onChangeText={(v) => atualizarBloco(index, bIndex, 'reps', v)} />
                      </View>
                      {!isCardio && (
                          <View style={styles.inputBox}>
                              <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>DESC(s)</Text>
                              <TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={String(bloco.restTime)} keyboardType="numeric" onChangeText={(v) => atualizarBloco(index, bIndex, 'restTime', v)} />
                          </View>
                      )}
                      <TouchableOpacity style={[styles.techBox, { backgroundColor: theme.surface, borderColor: theme.border, flex: isCardio ? 2 : 1.5 }]} onPress={() => { setIndexExercicioAtual(index); setIndexBlocoAtual(bIndex); setModalTecnicaVisible(true); }}>
                          <Text style={[styles.miniLabel, { color: isCardio ? theme.accent : theme.textSecondary }]}>{isCardio ? "INTENSIDADE" : "TÉCNICA"}</Text>
                          <Text style={{color: bloco.technique ? theme.accent : theme.textSecondary, fontSize:10, fontWeight:'bold'}}>{bloco.technique || (isCardio ? 'Moderada' : 'NORMAL')}</Text>
                      </TouchableOpacity>
                      {item.blocks.length > 1 && (
                          <TouchableOpacity onPress={() => removerBloco(index, bIndex)} style={{ padding: 5 }}>
                              <MaterialCommunityIcons name="close" size={18} color="#FF3B30" />
                          </TouchableOpacity>
                      )}
                  </View>
              ))}
              {!isCardio && (
                  <TouchableOpacity style={{ alignSelf: 'flex-start', paddingVertical: 5 }} onPress={() => adicionarBloco(index)}>
                      <Text style={{ color: theme.accent, fontSize: 11, fontWeight: 'bold' }}>+ Adicionar Variação de Série</Text>
                  </TouchableOpacity>
              )}
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
  techBox: { alignItems:'center', justifyContent:'center', borderRadius:8, borderWidth:1 },
  miniLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, textAlign:'center' },
  miniInput: { padding: 8, borderRadius: 8, fontSize: 14, textAlign: 'center', borderWidth: 1, fontWeight: 'bold', outlineStyle: 'none' },
});