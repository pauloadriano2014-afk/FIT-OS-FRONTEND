// src/components/MontarTreino/MainAreaHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MainAreaHeader({
    theme,
    selectedWorkoutTab,
    onCollapse, onClear,
}) {
    return (
        <View style={[S.header, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
            {/* Título */}
            <Text style={[S.title, { color: theme.text }]} numberOfLines={1}>
                Editando: <Text style={{ color: theme.accent }}>{selectedWorkoutTab}</Text>
            </Text>

            {/* Apenas Minimizar e Limpar */}
            <View style={S.actions}>
                <TouchableOpacity
                    style={[S.btn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={onCollapse}
                >
                    <MaterialCommunityIcons name="format-list-bulleted" size={14} color={theme.textSecondary} />
                    <Text style={[S.btnText, { color: theme.textSecondary }]}>Minimizar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[S.btn, { backgroundColor: 'rgba(255,59,48,0.1)' }]}
                    onPress={onClear}
                >
                    <MaterialCommunityIcons name="delete-sweep" size={14} color="#FF3B30" />
                    <Text style={[S.btnText, { color: '#FF3B30' }]}>Limpar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const S = StyleSheet.create({
    header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, zIndex: 5 },
    title:   { flex: 1, fontSize: 18, fontWeight: '900', marginRight: 12 },
    actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    btn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    btnText: { fontSize: 11, fontWeight: 'bold' },
});