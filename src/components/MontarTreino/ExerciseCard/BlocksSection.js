// src/components/MontarTreino/ExerciseCard/BlocksSection.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BlockRow from './BlockRow';
import { PYRAMID_PRESETS } from './_constants';

export default function BlocksSection({
    blocks, index, isCardio, theme, workoutModel,
    OPTIONS_SETS, OPTIONS_REPS, OPTIONS_REST, OPTIONS_LOAD,
    saveCustomLoad, removeCustomLoad,
    atualizarBloco, removerBloco, adicionarBloco,
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible,
    listaTecnicas = [], // 🔥 RECEBE A LISTA AQUI
    // 🔥 NOVO: estruturas de pirâmide personalizadas salvas pelo coach
    pyramidPresetsList = [], salvarPyramidPreset, apagarPyramidPreset,
}) {
    const [showPyramid, setShowPyramid] = useState(false);
    const [isCreatingPyramid, setIsCreatingPyramid] = useState(false);
    const [newPyramidStructure, setNewPyramidStructure] = useState('');
    const [isSavingPyramid, setIsSavingPyramid] = useState(false);

    // 🔥 NOVO: valida e salva uma estrutura de pirâmide digitada pelo coach
    // (ex: "20-15-12-10"), pra virar um botão de toque rápido pra sempre.
    const handleSaveNewPyramid = async () => {
        const parts = newPyramidStructure.split(/[-/,]/).map(x => x.trim()).filter(x => x);
        if (parts.length < 2 || !parts.every(p => /^\d{1,3}$/.test(p))) {
            const msg = 'Digite pelo menos 2 números separados por traço, ex: 20-15-12-10.';
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Estrutura inválida', msg);
            return;
        }
        const normalized = parts.join('-');
        const alreadyExists = [...PYRAMID_PRESETS, ...pyramidPresetsList.map(p => p.structure)].includes(normalized);
        if (alreadyExists) {
            const msg = 'Essa estrutura já existe na lista.';
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Já existe', msg);
            return;
        }
        setIsSavingPyramid(true);
        const ok = await salvarPyramidPreset(normalized);
        setIsSavingPyramid(false);
        if (ok) {
            setIsCreatingPyramid(false);
            setNewPyramidStructure('');
        }
    };

    const confirmDeletePyramid = (preset) => {
        const doDelete = () => apagarPyramidPreset(preset.id);
        if (Platform.OS === 'web') {
            if (window.confirm(`Apagar a estrutura "${preset.structure}"?`)) doDelete();
        } else {
            Alert.alert('Apagar Estrutura', `Apagar "${preset.structure}"?`, [
                { text: 'Cancelar' },
                { text: 'Apagar', style: 'destructive', onPress: doDelete },
            ]);
        }
    };

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
                    listaTecnicas={listaTecnicas} // 🔥 REPASSA PARA A LINHA
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

                        {/* 🔥 NOVO: estruturas criadas e salvas pelo coach, com "x" pra apagar */}
                        {pyramidPresetsList.map(p => (
                            <View key={p.id} style={[S.pyramidBtn, S.pyramidBtnCustom, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: theme.accent + '50' }]}>
                                <TouchableOpacity onPress={() => { adicionarBloco(index, p.structure); setShowPyramid(false); }}>
                                    <Text style={[S.pyramidBtnText, { color: theme.accent }]}>{p.structure}</Text>
                                </TouchableOpacity>
                                {apagarPyramidPreset && (
                                    <TouchableOpacity onPress={() => confirmDeletePyramid(p)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }} style={{ marginLeft: 6 }}>
                                        <MaterialCommunityIcons name="close" size={13} color={theme.accent} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {/* 🔥 NOVO: criar e salvar uma estrutura nova, pra virar atalho pra sempre */}
                        {salvarPyramidPreset && !isCreatingPyramid && (
                            <TouchableOpacity
                                style={[S.pyramidBtn, { flexDirection: 'row', alignItems: 'center', gap: 4, borderStyle: 'dashed', backgroundColor: theme.accent + '10', borderColor: theme.accent + '50' }]}
                                onPress={() => setIsCreatingPyramid(true)}
                            >
                                <MaterialCommunityIcons name="plus" size={13} color={theme.accent} />
                                <Text style={[S.pyramidBtnText, { color: theme.accent }]}>Criar Nova</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isCreatingPyramid && (
                        <View style={S.pyramidCreateRow}>
                            <TextInput
                                style={[S.pyramidInput, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#fff', color: theme.text, borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
                                placeholder="Ex: 20-15-12-10"
                                placeholderTextColor={theme.textSecondary}
                                value={newPyramidStructure}
                                onChangeText={setNewPyramidStructure}
                                autoFocus
                            />
                            <TouchableOpacity style={[S.pyramidCreateBtn, { backgroundColor: theme.accent }]} onPress={handleSaveNewPyramid} disabled={isSavingPyramid}>
                                <MaterialCommunityIcons name="check" size={18} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[S.pyramidCreateBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} onPress={() => { setIsCreatingPyramid(false); setNewPyramidStructure(''); }}>
                                <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}
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
    pyramidBtnCustom: { flexDirection: 'row', alignItems: 'center' },
    pyramidCreateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    pyramidInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    pyramidCreateBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});