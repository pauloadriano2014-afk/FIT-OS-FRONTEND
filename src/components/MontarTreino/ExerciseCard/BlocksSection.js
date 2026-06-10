// src/components/MontarTreino/ExerciseCard/BlocksSection.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BlockRow from './BlockRow';
import { PYRAMID_PRESETS } from './_constants';

export default function BlocksSection({
    blocks, index, isCardio, theme, workoutModel,
    OPTIONS_SETS, OPTIONS_REPS, OPTIONS_REST, OPTIONS_LOAD,
    saveCustomLoad, removeCustomLoad,
    atualizarBloco, removerBloco, adicionarBloco,
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible,
}) {
    const [showPyramid, setShowPyramid] = useState(false);

    return (
        <View style={[S.container, { zIndex: 999 }]}>
            {blocks && blocks.map((bloco, bIndex) => (
                <BlockRow
                    key={bIndex}
                    bloco={bloco} bIndex={bIndex} index={index}
                    isCardio={isCardio} theme={theme} workoutModel={workoutModel}
                    OPTIONS_SETS={OPTIONS_SETS} OPTIONS_REPS={OPTIONS_REPS}
                    OPTIONS_REST={OPTIONS_REST} OPTIONS_LOAD={OPTIONS_LOAD}
                    saveCustomLoad={saveCustomLoad} removeCustomLoad={removeCustomLoad}
                    atualizarBloco={atualizarBloco} removerBloco={removerBloco}
                    setIndexExercicioAtual={setIndexExercicioAtual}
                    setIndexBlocoAtual={setIndexBlocoAtual}
                    setModalTecnicaVisible={setModalTecnicaVisible}
                    canRemove={blocks.length > 1}
                    blocksLength={blocks.length}
                />
            ))}

            {!isCardio && (
                <View style={S.addRow}>
                    <TouchableOpacity style={[S.addBtn, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '40' }]} onPress={() => adicionarBloco(index)}>
                        <MaterialCommunityIcons name="plus" size={15} color={theme.accent} />
                        <Text style={[S.addBtnText, { color: theme.accent }]}>Manual</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[S.addBtn, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '40' }]} onPress={() => setShowPyramid(!showPyramid)}>
                        <MaterialCommunityIcons name="layers-triple" size={15} color={theme.accent} />
                        <Text style={[S.addBtnText, { color: theme.accent }]}>Pirâmide</Text>
                    </TouchableOpacity>
                </View>
            )}

            {showPyramid && (
                <View style={[S.pyramidBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <Text style={[S.pyramidLabel, { color: theme.textSecondary }]}>ESCOLHA A ESTRUTURA:</Text>
                    <View style={S.pyramidBtns}>
                        {PYRAMID_PRESETS.map(p => (
                            <TouchableOpacity key={p} style={[S.pyramidBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} onPress={() => { adicionarBloco(index, p); setShowPyramid(false); }}>
                                <Text style={[S.pyramidBtnText, { color: theme.text }]}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const S = StyleSheet.create({
    container:   { gap: 8, marginBottom: 16 },
    addRow:      { flexDirection: 'row', gap: 8, marginTop: 4 },
    addBtn:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, gap: 5 },
    addBtnText:  { fontSize: 12, fontWeight: '700' },
    pyramidBox:  { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
    pyramidLabel:{ fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    pyramidBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pyramidBtn:  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
    pyramidBtnText: { fontSize: 12, fontWeight: '700' },
});