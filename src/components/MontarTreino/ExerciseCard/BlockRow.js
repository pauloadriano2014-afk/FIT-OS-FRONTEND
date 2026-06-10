// src/components/MontarTreino/ExerciseCard/BlockRow.js
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HybridInput from './HybridInput';

export default function BlockRow({
    bloco, bIndex, index, isCardio, theme, workoutModel,
    OPTIONS_SETS, OPTIONS_REPS, OPTIONS_REST, OPTIONS_LOAD,
    saveCustomLoad, removeCustomLoad,
    atualizarBloco, removerBloco,
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible,
    canRemove, blocksLength,
}) {
    const refSets = useRef(null);
    const refReps = useRef(null);
    const refRest = useRef(null);
    const refLoad = useRef(null);

    return (
        <View style={[S.row, {
            backgroundColor: isCardio ? `${theme.accent}12` : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
            borderLeftColor: isCardio ? theme.accent : (theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
            zIndex: blocksLength - bIndex,
            position: 'relative',
        }]}>
            <HybridInput
                inputRef={refSets}
                label={isCardio ? 'MINUTOS' : 'SÉRIES'}
                value={bloco.sets}
                onChangeText={(v) => atualizarBloco(index, bIndex, 'sets', v)}
                options={OPTIONS_SETS}
                theme={theme} isCardio={isCardio} keyboardType="numeric"
                nextFocusRef={refReps}
                flex={isCardio ? 1.2 : 0.8}
            />
            <HybridInput
                inputRef={refReps}
                label={isCardio ? 'KCAL ALVO' : 'REPS'}
                value={bloco.reps}
                onChangeText={(v) => atualizarBloco(index, bIndex, 'reps', v)}
                options={OPTIONS_REPS}
                theme={theme} isCardio={isCardio}
                keyboardType={isCardio ? 'numeric' : 'default'}
                nextFocusRef={workoutModel === 'CARGA' && !isCardio ? refLoad : (!isCardio ? refRest : null)}
                flex={isCardio ? 1.4 : 1.2}
            />
            {workoutModel === 'CARGA' && !isCardio && (
                <HybridInput
                    inputRef={refLoad}
                    label="ALVO / CARGA"
                    value={bloco.load || ''}
                    onChangeText={(v) => atualizarBloco(index, bIndex, 'load', v)}
                    options={OPTIONS_LOAD}
                    theme={theme} isCardio={false} keyboardType="default"
                    nextFocusRef={refRest}
                    onBlurAction={() => saveCustomLoad(bloco.load)}
                    onDeleteOption={removeCustomLoad}
                    onSubmitEditing={() => saveCustomLoad(bloco.load)}
                    flex={1.4}
                />
            )}
            {!isCardio && (
                <HybridInput
                    inputRef={refRest}
                    label="PAUSA"
                    value={bloco.restTime}
                    onChangeText={(v) => atualizarBloco(index, bIndex, 'restTime', v)}
                    options={OPTIONS_REST}
                    theme={theme} isCardio={false} keyboardType="numeric"
                    flex={1}
                />
            )}
            {!isCardio && (
                <View style={[S.techBox, { flex: 1.2 }]}>
                    <Text style={[S.techLabel, { color: theme.textSecondary }]}>TÉCNICA</Text>
                    <TouchableOpacity
                        style={[S.techBtn, {
                            backgroundColor: bloco.technique ? theme.accent + '20' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                            borderColor: bloco.technique ? theme.accent : (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                        }]}
                        onPress={() => { setIndexExercicioAtual(index); setIndexBlocoAtual(bIndex); setModalTecnicaVisible(true); }}
                    >
                        <Text style={[S.techValue, { color: bloco.technique ? theme.accent : theme.text }]} numberOfLines={1}>
                            {bloco.technique || 'Normal'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            {canRemove && (
                <TouchableOpacity onPress={() => removerBloco(index, bIndex)} style={S.removeBtn}>
                    <MaterialCommunityIcons name="close" size={16} color="#FF3B30" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const S = StyleSheet.create({
    row:       { flexDirection: 'row', gap: 5, alignItems: 'center', padding: 10, borderRadius: 10, borderLeftWidth: 3 },
    techBox:   { flex: 1.2 },
    techLabel: { fontSize: 9, fontWeight: '800', marginBottom: 5, textAlign: 'center', letterSpacing: 0.5 },
    techBtn:   { alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 6 },
    techValue: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
    removeBtn: { padding: 6, borderRadius: 8 },
});