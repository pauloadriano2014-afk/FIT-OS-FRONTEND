// src/components/MontarTreino/SharedFooter.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SharedFooter({ theme, isTemplateMode, hasExercises, onAddMore, onSaveTemplate }) {
    return (
        <View style={S.footer}>
            {hasExercises && (
                <>
                    <TouchableOpacity style={[S.addMoreBtn, { borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} onPress={onAddMore}>
                        <MaterialCommunityIcons name="plus" size={16} color={theme.textSecondary} />
                        <Text style={[S.addMoreText, { color: theme.textSecondary }]}>Adicionar mais exercícios</Text>
                    </TouchableOpacity>
                    {!isTemplateMode && (
                        <TouchableOpacity style={[S.saveBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.accent + '40' }]} onPress={onSaveTemplate}>
                            <MaterialCommunityIcons name="content-save-all" size={17} color={theme.accent} />
                            <Text style={[S.saveBtnText, { color: theme.accent }]}>Salvar como template</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
            <View style={{ height: 120 }} />
        </View>
    );
}

const S = StyleSheet.create({
    footer:     { width: '100%', paddingHorizontal: 16 },
    addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, marginBottom: 12, gap: 6 },
    addMoreText:{ fontWeight: '700', fontSize: 13 },
    saveBtn:    { padding: 15, borderRadius: 14, borderWidth: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
    saveBtnText:{ fontWeight: '700', fontSize: 13 },
});
