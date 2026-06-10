// src/components/MontarTreino/ExerciseCard/SubstitutesList.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SubstitutesList({ substitutesList, index, theme, onRemove, onAdd }) {
    return (
        <View style={S.container}>
            {substitutesList.map((subItem, subIndex) => (
                <View key={subItem.exerciseId || subIndex} style={[S.row, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '40' }]}>
                    <MaterialCommunityIcons name="swap-horizontal" size={15} color={theme.accent} />
                    <Text style={[S.label, { color: theme.accent }]}>Ou:</Text>
                    <Text style={[S.name, { color: theme.text }]} numberOfLines={1}>{subItem.name || subItem.title}</Text>
                    <TouchableOpacity onPress={() => onRemove(index, subIndex)}>
                        <MaterialCommunityIcons name="close-circle" size={17} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            ))}
            {substitutesList.length < 3 && (
                <TouchableOpacity style={S.addBtn} onPress={() => onAdd(index)}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={13} color={theme.textSecondary} />
                    <Text style={[S.addText, { color: theme.textSecondary }]}>Adicionar opção de troca ({substitutesList.length}/3)</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const S = StyleSheet.create({
    container: { marginBottom: 12 },
    row:       { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, gap: 6 },
    label:     { fontSize: 11, fontWeight: '700' },
    name:      { fontSize: 13, flex: 1, fontWeight: '600' },
    addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, marginTop: 4 },
    addText:   { fontSize: 12, fontStyle: 'italic' },
});