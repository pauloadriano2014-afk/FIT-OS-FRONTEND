// src/components/MontarTreino/ExerciseCard/ObservationSection.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QUICK_OBS } from './_constants';

export default function ObservationSection({ item, index, theme, atualizarObservacao }) {
    const [showDropdown, setShowDropdown] = useState(false);

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
                    </ScrollView>
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
    input:      { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 16, minHeight: 42, textAlignVertical: 'top', outlineStyle: 'none' },
});