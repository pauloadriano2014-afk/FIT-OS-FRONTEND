// src/components/MontarTreino/Modals/AutoFillModal.js
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AutoFillModal({
    visible, onClose, theme,
    selectedWorkoutTab, workoutTabs, currentExercisesCount,
    onFillCurrentDay, onFillAllDays,
    onClearCurrentDay, onClearAllDays,
}) {
    const [mode, setMode] = useState('fill'); // 'fill' | 'clear'

    const isFill = mode === 'fill';

    const handleFillAll = () => {
        onClose();
        onFillAllDays();
        if (Platform.OS === 'web') window.alert(`✅ Auto-preenchimento concluído em todos os ${workoutTabs.length} dias!`);
        else Alert.alert('Auto-preencher', `✅ Concluído em todos os ${workoutTabs.length} dias!`);
    };

    const handleClearAll = () => {
        const exec = () => {
            onClose();
            onClearAllDays();
            if (Platform.OS === 'web') window.alert(`🗑 Substitutos removidos de todos os ${workoutTabs.length} dias!`);
            else Alert.alert('Limpar substitutos', `🗑 Removidos de todos os ${workoutTabs.length} dias!`);
        };
        if (Platform.OS === 'web') {
            if (window.confirm(`Remover TODOS os substitutos de todos os ${workoutTabs.length} dias?\nEsta ação não pode ser desfeita.`)) exec();
        } else {
            Alert.alert('Confirmar', `Remover todos os substitutos de todos os ${workoutTabs.length} dias?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Remover', style: 'destructive', onPress: exec },
            ]);
        }
    };

    const handleClearCurrentDay = () => {
        const exec = () => {
            onClose();
            onClearCurrentDay();
        };
        if (Platform.OS === 'web') {
            if (window.confirm(`Remover todos os substitutos do dia "${selectedWorkoutTab}"?`)) exec();
        } else {
            Alert.alert('Confirmar', `Remover todos os substitutos do dia "${selectedWorkoutTab}"?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Remover', style: 'destructive', onPress: exec },
            ]);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={S.overlay}>
                <View style={[S.box, { backgroundColor: theme.surface }]}>

                    {/* Header */}
                    <View style={[S.iconWrap, { backgroundColor: isFill ? theme.accent + '20' : 'rgba(255,59,48,0.12)' }]}>
                        <MaterialCommunityIcons
                            name={isFill ? 'swap-horizontal' : 'delete-sweep'}
                            size={26}
                            color={isFill ? theme.accent : '#FF3B30'}
                        />
                    </View>
                    <Text style={[S.title, { color: theme.text }]}>
                        {isFill ? 'Auto-preencher Substitutos' : 'Limpar Substitutos'}
                    </Text>
                    <Text style={[S.subtitle, { color: theme.textSecondary }]}>
                        {isFill
                            ? 'Preenche automaticamente com base nos substitutos configurados na biblioteca.'
                            : 'Remove todos os substitutos vinculados dos exercícios selecionados.'
                        }
                    </Text>

                    {/* Toggle Preencher / Limpar */}
                    <View style={[S.toggle, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                        <TouchableOpacity
                            style={[S.toggleBtn, isFill && { backgroundColor: theme.accent }]}
                            onPress={() => setMode('fill')}
                        >
                            <MaterialCommunityIcons name="swap-horizontal" size={14} color={isFill ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                            <Text style={[S.toggleText, { color: isFill ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>Preencher</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[S.toggleBtn, !isFill && { backgroundColor: '#FF3B30' }]}
                            onPress={() => setMode('clear')}
                        >
                            <MaterialCommunityIcons name="delete-sweep" size={14} color={!isFill ? '#FFF' : theme.textSecondary} />
                            <Text style={[S.toggleText, { color: !isFill ? '#FFF' : theme.textSecondary }]}>Limpar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Opção 1: Dia atual */}
                    <TouchableOpacity
                        style={[S.option, {
                            backgroundColor: isFill ? theme.accent + '12' : 'rgba(255,59,48,0.08)',
                            borderColor: isFill ? theme.accent + '30' : 'rgba(255,59,48,0.25)',
                        }]}
                        onPress={isFill ? () => { onClose(); onFillCurrentDay(); } : handleClearCurrentDay}
                    >
                        <View style={[S.optionIcon, {
                            backgroundColor: isFill ? theme.accent + '20' : 'rgba(255,59,48,0.15)',
                        }]}>
                            <MaterialCommunityIcons
                                name="calendar-today"
                                size={18}
                                color={isFill ? theme.accent : '#FF3B30'}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: isFill ? theme.accent : '#FF3B30', fontSize: 14, fontWeight: '800' }}>
                                Dia {selectedWorkoutTab} apenas
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                {currentExercisesCount} exercício(s) neste dia
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={isFill ? theme.accent : '#FF3B30'} />
                    </TouchableOpacity>

                    {/* Opção 2: Todos os dias */}
                    <TouchableOpacity
                        style={[S.option, {
                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            borderColor: theme.border,
                            marginBottom: 20,
                        }]}
                        onPress={isFill ? handleFillAll : handleClearAll}
                    >
                        <View style={[S.optionIcon, {
                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }]}>
                            <MaterialCommunityIcons name="calendar-multiple" size={18} color={theme.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>Todos os dias</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                {workoutTabs.join(', ')} — {workoutTabs.length} dia(s)
                            </Text>
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
    subtitle:   { textAlign: 'center', fontSize: 13, lineHeight: 18, marginBottom: 16 },
    toggle:     { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 },
    toggleBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
    toggleText: { fontSize: 12, fontWeight: '800' },
    option:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 13, borderWidth: 1, marginBottom: 10 },
    optionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cancelBtn:  { padding: 12, alignItems: 'center' },
    cancelText: { fontWeight: '600' },
});