// src/components/MontarTreino/TemplateSettingsCard.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function TemplateSettingsCard({ theme, customWorkoutName, setCustomWorkoutName, templateGoalInput, setTemplateGoalInput, templateLevelInput, setTemplateLevelInput }) {
    return (
        <View style={[S.box, { backgroundColor: theme.surface }]}>
            <Text style={[S.label, { color: theme.textSecondary }]}>NOME DO MODELO</Text>
            <TextInput
                style={[S.input, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: theme.accent, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
                placeholder="Ex: Hipertrofia Elite A/B/C"
                placeholderTextColor={theme.textSecondary}
                value={customWorkoutName}
                onChangeText={setCustomWorkoutName}
            />
            <Text style={[S.label, { color: theme.textSecondary, marginTop: 14 }]}>CATEGORIA E NÍVEL</Text>
            <View style={S.tagRow}>
                {['Hipertrofia', 'Emagrecimento', 'Força'].map(g => (
                    <TouchableOpacity key={g} style={[S.tag, { backgroundColor: templateGoalInput === g ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: templateGoalInput === g ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} onPress={() => setTemplateGoalInput(g)}>
                        <Text style={[S.tagText, { color: templateGoalInput === g ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{g}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={[S.tagRow, { marginTop: 8 }]}>
                {['Iniciante', 'Intermediário', 'Avançado'].map(l => (
                    <TouchableOpacity key={l} style={[S.tag, { backgroundColor: templateLevelInput === l ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: templateLevelInput === l ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} onPress={() => setTemplateLevelInput(l)}>
                        <Text style={[S.tagText, { color: templateLevelInput === l ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{l}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const S = StyleSheet.create({
    box:    { borderRadius: 18, padding: 16, marginBottom: 16 },
    label:  { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 },
    input:  { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 16, fontWeight: '700', outlineStyle: 'none' },
    tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    tag:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    tagText:{ fontSize: 12, fontWeight: '700' },
});