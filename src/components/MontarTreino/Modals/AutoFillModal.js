// src/components/MontarTreino/Modals/AutoFillModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AutoFillModal({
    visible, onClose, theme,
    selectedWorkoutTab, workoutTabs, currentExercisesCount,
    onFillCurrentDay, onFillAllDays,
}) {
    const handleFillAll = () => {
        onClose();
        onFillAllDays();
        if (Platform.OS === 'web') window.alert(`✅ Auto-preenchimento concluído em todos os ${workoutTabs.length} dias!`);
        else Alert.alert('Auto-preencher', `✅ Concluído em todos os ${workoutTabs.length} dias!`);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={S.overlay}>
                <View style={[S.box, { backgroundColor: theme.surface }]}>
                    <View style={[S.iconWrap, { backgroundColor: theme.accent + '20' }]}>
                        <MaterialCommunityIcons name="swap-horizontal" size={26} color={theme.accent} />
                    </View>
                    <Text style={[S.title, { color: theme.text }]}>Auto-preencher Substitutos</Text>
                    <Text style={[S.subtitle, { color: theme.textSecondary }]}>
                        Preenche automaticamente os substitutos com base nos que você configurou na biblioteca.
                    </Text>

                    {/* Opção 1: Dia atual */}
                    <TouchableOpacity
                        style={[S.option, { backgroundColor: theme.accent + '12', borderColor: theme.accent + '30' }]}
                        onPress={() => { onClose(); onFillCurrentDay(); }}
                    >
                        <View style={[S.optionIcon, { backgroundColor: theme.accent + '20' }]}>
                            <MaterialCommunityIcons name="calendar-today" size={18} color={theme.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '800' }}>Dia {selectedWorkoutTab} apenas</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{currentExercisesCount} exercício(s) neste dia</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.accent} />
                    </TouchableOpacity>

                    {/* Opção 2: Todos os dias */}
                    <TouchableOpacity
                        style={[S.option, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.border, marginBottom: 20 }]}
                        onPress={handleFillAll}
                    >
                        <View style={[S.optionIcon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                            <MaterialCommunityIcons name="calendar-multiple" size={18} color={theme.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>Todos os dias</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{workoutTabs.join(', ')} — {workoutTabs.length} dia(s)</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={S.cancelBtn} onPress={onClose}>
                        <Text style={[S.cancelText, { color: theme.textSecondary }]}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const S = StyleSheet.create({
    overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    box:        { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignSelf: 'center' },
    iconWrap:   { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14 },
    title:      { fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
    subtitle:   { textAlign: 'center', fontSize: 13, lineHeight: 18, marginBottom: 20 },
    option:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 13, borderWidth: 1, marginBottom: 10 },
    optionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cancelBtn:  { padding: 12, alignItems: 'center' },
    cancelText: { fontWeight: '600' },
});
