// src/components/MontarTreino/ExerciseCard/ObservationSection.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QUICK_OBS } from './_constants';

export default function ObservationSection({
    item, index, theme, atualizarObservacao,
    // 🔥 NOVO: observações rápidas personalizadas salvas pelo coach
    observationPresetsList = [], salvarObservationPreset, apagarObservationPreset,
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [isCreatingObs, setIsCreatingObs] = useState(false);
    const [newObsText, setNewObsText] = useState('');
    const [isSavingObs, setIsSavingObs] = useState(false);

    // 🔥 NOVO: salva o texto digitado como uma observação rápida reutilizável
    const handleSaveNewObs = async () => {
        const trimmed = newObsText.trim();
        if (!trimmed) return;
        const alreadyExists = [...QUICK_OBS, ...observationPresetsList.map(p => p.text)].includes(trimmed);
        if (alreadyExists) {
            const msg = 'Essa observação já existe na lista.';
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Já existe', msg);
            return;
        }
        setIsSavingObs(true);
        const ok = await salvarObservationPreset(trimmed);
        setIsSavingObs(false);
        if (ok) {
            setIsCreatingObs(false);
            setNewObsText('');
        }
    };

    const confirmDeleteObs = (preset) => {
        const doDelete = () => apagarObservationPreset(preset.id);
        if (Platform.OS === 'web') {
            if (window.confirm(`Apagar a observação "${preset.text}"?`)) doDelete();
        } else {
            Alert.alert('Apagar Observação', `Apagar "${preset.text}"?`, [
                { text: 'Cancelar' },
                { text: 'Apagar', style: 'destructive', onPress: doDelete },
            ]);
        }
    };

    return (
        <View style={S.section}>
            <View style={S.header}>
                <Text style={[S.label, { color: theme.textSecondary }]}>OBSERVAÇÃO</Text>
                <TouchableOpacity
                    style={[S.quickBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]}
                    onPress={() => setShowDropdown(!showDropdown)}
                >
                    <MaterialCommunityIcons name="lightbulb-on" size={13} color={theme.accent} />
                    <Text style={[S.quickBtnText, { color: theme.accent }]}>{showDropdown ? 'Fechar' : 'Inserir rápido'}</Text>
                </TouchableOpacity>
            </View>

            {showDropdown && (
                <View style={[S.dropdown, { backgroundColor: theme.surface, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }} keyboardShouldPersistTaps="handled">
                        {QUICK_OBS.map((text, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[S.option, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                                onPress={() => {
                                    const cur = item.observation || '';
                                    const sep = cur.length > 0 && !cur.endsWith(' ') ? ' - ' : '';
                                    atualizarObservacao(index, cur + sep + text);
                                    setShowDropdown(false);
                                }}
                            >
                                <Text style={[S.optionText, { color: theme.text }]}>+ {text}</Text>
                            </TouchableOpacity>
                        ))}

                        {/* 🔥 NOVO: observações criadas e salvas pelo coach, com "x" pra apagar */}
                        {observationPresetsList.map((p) => (
                            <View
                                key={p.id}
                                style={[S.option, S.optionCustom, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                            >
                                <TouchableOpacity
                                    style={{ flex: 1 }}
                                    onPress={() => {
                                        const cur = item.observation || '';
                                        const sep = cur.length > 0 && !cur.endsWith(' ') ? ' - ' : '';
                                        atualizarObservacao(index, cur + sep + p.text);
                                        setShowDropdown(false);
                                    }}
                                >
                                    <Text style={[S.optionText, { color: theme.accent }]}>+ {p.text}</Text>
                                </TouchableOpacity>
                                {apagarObservationPreset && (
                                    <TouchableOpacity onPress={() => confirmDeleteObs(p)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }} style={{ marginLeft: 8 }}>
                                        <MaterialCommunityIcons name="close" size={15} color={theme.accent} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    {/* 🔥 NOVO: criar e salvar uma observação nova, pra virar atalho pra sempre */}
                    {salvarObservationPreset && (
                        <View style={[S.createArea, { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                            {!isCreatingObs ? (
                                <TouchableOpacity style={S.createToggle} onPress={() => setIsCreatingObs(true)}>
                                    <MaterialCommunityIcons name="plus" size={13} color={theme.accent} />
                                    <Text style={[S.createToggleText, { color: theme.accent }]}>Criar Nova</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={S.pyramidCreateRow}>
                                    <TextInput
                                        style={[S.pyramidInput, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#fff', color: theme.text, borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
                                        placeholder="Ex: Cuidado com o ombro"
                                        placeholderTextColor={theme.textSecondary}
                                        value={newObsText}
                                        onChangeText={setNewObsText}
                                        autoFocus
                                    />
                                    <TouchableOpacity style={[S.pyramidCreateBtn, { backgroundColor: theme.accent }]} onPress={handleSaveNewObs} disabled={isSavingObs}>
                                        <MaterialCommunityIcons name="check" size={18} color="#000" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[S.pyramidCreateBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} onPress={() => { setIsCreatingObs(false); setNewObsText(''); }}>
                                        <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            )}

            <TextInput
                style={[S.input, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: theme.text, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                placeholder="Adicionar observação ao aluno..."
                placeholderTextColor={theme.textSecondary}
                value={item.observation || ''}
                onChangeText={(text) => atualizarObservacao(index, text)}
                multiline
            />
        </View>
    );
}

const S = StyleSheet.create({
    section:    { marginTop: 4 },
    header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    label:      { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    quickBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1 },
    quickBtnText:{ fontSize: 11, fontWeight: '700' },
    dropdown:   { borderWidth: 1, borderRadius: 10, marginBottom: 10, overflow: 'hidden' },
    option:     { padding: 12, borderBottomWidth: 1 },
    optionText: { fontSize: 13 },
    optionCustom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    createArea: { borderTopWidth: 1, padding: 8 },
    createToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 4 },
    createToggleText: { fontSize: 12, fontWeight: '700' },
    pyramidCreateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pyramidInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    pyramidCreateBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    input:      { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 16, minHeight: 42, textAlignVertical: 'top', outlineStyle: 'none' },
});