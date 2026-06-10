// src/components/MontarTreino/ExerciseCard/ExerciseCardActions.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ExerciseCardActions({ item, index, theme, isGhost, onSwap, onDelete }) {
    if (isGhost) {
        return (
            <View style={S.ghostHeader}>
                <View style={S.ghostLeft}>
                    <Text style={[S.ghostName, { color: '#FF3B30' }]}>{index + 1}. {item.title}</Text>
                    <View style={S.ghostBadge}>
                        <Text style={S.ghostBadgeText}>⚠️ NÃO VINCULADO</Text>
                    </View>
                </View>
                <View style={S.row}>
                    <TouchableOpacity onPress={onSwap} style={[S.actionBtn, { backgroundColor: '#FF3B30' }]}>
                        <MaterialCommunityIcons name="link-variant-plus" size={18} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} style={S.deleteBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={S.actionsRow}>
            <TouchableOpacity onPress={onSwap} style={[S.swapBtn, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40' }]}>
                <MaterialCommunityIcons name="sync" size={15} color={theme.accent} />
                <Text style={[S.swapText, { color: theme.accent }]}>Trocar exercício</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={S.deleteBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
        </View>
    );
}

const S = StyleSheet.create({
    actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    swapBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
    swapText:   { fontSize: 12, fontWeight: '700' },
    deleteBtn:  { padding: 6 },
    ghostHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    ghostLeft:  { flex: 1, gap: 6 },
    ghostName:  { fontSize: 14, fontWeight: '800' },
    ghostBadge: { backgroundColor: '#FF3B3020', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
    ghostBadgeText: { color: '#FF3B30', fontSize: 9, fontWeight: '900' },
    row:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionBtn:  { padding: 8, borderRadius: 10 },
});