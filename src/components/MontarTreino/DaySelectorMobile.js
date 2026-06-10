// src/components/MontarTreino/DaySelectorMobile.js
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DaySelectorMobile({
    theme, workoutTabs, selectedWorkoutTab, exercisesByDay,
    dayDropdownOpen, setDayDropdownOpen,
    editingTabName, setEditingTabName, editingTabValue, setEditingTabValue,
    onSelectTab, onConfirmRename, onMoveTab, onDuplicateTab, onDeleteTab, onAddTab,
}) {
    return (
        <View style={S.wrapper}>
            <TouchableOpacity
                style={[S.btn, { backgroundColor: theme.surface, borderColor: dayDropdownOpen ? theme.accent + '60' : theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
                onPress={() => setDayDropdownOpen(!dayDropdownOpen)}
                activeOpacity={0.8}
            >
                <View style={[S.iconBox, { backgroundColor: theme.accent }]}>
                    <MaterialCommunityIcons name="calendar-today" size={16} color={theme.isDark ? '#000' : '#FFF'} />
                </View>
                <View style={S.info}>
                    <Text style={[S.label, { color: theme.textSecondary }]}>DIA ATIVO</Text>
                    <Text style={[S.value, { color: theme.text }]}>
                        {selectedWorkoutTab}
                        <Text style={[S.count, { color: theme.textSecondary }]}> · {(exercisesByDay[selectedWorkoutTab] || []).length} ex.</Text>
                    </Text>
                </View>
                <View style={[S.chevron, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                    <MaterialCommunityIcons name={dayDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
                </View>
            </TouchableOpacity>

            {dayDropdownOpen && (
                <View style={[S.dropdown, { backgroundColor: theme.surface, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                    {workoutTabs.map((tab, tabIndex) => {
                        const isSelected = tab === selectedWorkoutTab;
                        const isEditing = editingTabName === tab;
                        const exCount = (exercisesByDay[tab] || []).length;
                        return (
                            <View key={tab} style={[S.dayRow, {
                                backgroundColor: isSelected ? theme.accent + '12' : 'transparent',
                                borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                borderBottomWidth: tabIndex < workoutTabs.length - 1 ? 1 : 0,
                            }]}>
                                <View style={[S.activeBar, { backgroundColor: isSelected ? theme.accent : 'transparent' }]} />
                                <View style={S.dayContent}>
                                    {isEditing ? (
                                        <TextInput
                                            style={[S.renameInput, { color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.accent + '60' }]}
                                            value={editingTabValue}
                                            onChangeText={setEditingTabValue}
                                            autoFocus
                                            onSubmitEditing={() => onConfirmRename(tab)}
                                            onBlur={() => onConfirmRename(tab)}
                                        />
                                    ) : (
                                        <TouchableOpacity style={S.nameBtn} onPress={() => { onSelectTab(tab); setDayDropdownOpen(false); }}>
                                            <Text style={[S.dayName, { color: isSelected ? theme.accent : theme.text, fontWeight: isSelected ? '900' : '600' }]}>{tab}</Text>
                                            <Text style={[S.dayCount, { color: theme.textSecondary }]}>{exCount} ex.</Text>
                                        </TouchableOpacity>
                                    )}
                                    <View style={S.actions}>
                                        <View style={{ flexDirection: 'row', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 10, overflow: 'hidden' }}>
                                            <TouchableOpacity style={S.pillIcon} onPress={() => onMoveTab(tab, 'up')} disabled={tabIndex === 0}>
                                                <MaterialCommunityIcons name="arrow-up" size={16} color={tabIndex === 0 ? theme.textSecondary + '40' : theme.textSecondary} />
                                            </TouchableOpacity>
                                            <View style={{ width: 1, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                            <TouchableOpacity style={S.pillIcon} onPress={() => onMoveTab(tab, 'down')} disabled={tabIndex === workoutTabs.length - 1}>
                                                <MaterialCommunityIcons name="arrow-down" size={16} color={tabIndex === workoutTabs.length - 1 ? theme.textSecondary + '40' : theme.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity style={[S.pillBtn, { backgroundColor: isEditing ? theme.accent + '25' : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
                                            onPress={() => { if (isEditing) onConfirmRename(tab); else { setEditingTabName(tab); setEditingTabValue(tab); } }}>
                                            <MaterialCommunityIcons name={isEditing ? 'check-circle' : 'pencil'} size={14} color={isEditing ? theme.accent : theme.textSecondary} />
                                            <Text style={[S.pillText, { color: isEditing ? theme.accent : theme.textSecondary }]}>{isEditing ? 'SALVAR' : 'EDITAR'}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[S.pillBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => onDuplicateTab(tab)}>
                                            <MaterialCommunityIcons name="content-copy" size={14} color={theme.textSecondary} />
                                            <Text style={[S.pillText, { color: theme.textSecondary }]}>DUPLICAR</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[S.pillBtn, { backgroundColor: 'rgba(255,59,48,0.1)', opacity: workoutTabs.length <= 1 ? 0.3 : 1 }]}
                                            onPress={() => onDeleteTab(tab)} disabled={workoutTabs.length <= 1}>
                                            <MaterialCommunityIcons name="trash-can" size={14} color="#FF3B30" />
                                            <Text style={[S.pillText, { color: '#FF3B30' }]}>EXCLUIR</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                    <TouchableOpacity style={[S.addDayBtn, { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}
                        onPress={() => { onAddTab(); setDayDropdownOpen(false); }}>
                        <View style={[S.addIcon, { backgroundColor: theme.accent + '20' }]}>
                            <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                        </View>
                        <Text style={[S.addText, { color: theme.accent }]}>Adicionar dia de treino</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const S = StyleSheet.create({
    wrapper:     { marginBottom: 20 },
    btn:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
    iconBox:     { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    info:        { flex: 1 },
    label:       { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
    value:       { fontSize: 15, fontWeight: '800' },
    count:       { fontSize: 13, fontWeight: '500' },
    chevron:     { borderRadius: 8, padding: 4 },
    dropdown:    { marginTop: 8, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    dayRow:      { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 16, gap: 12 },
    activeBar:   { width: 3, height: 22, borderRadius: 2, marginTop: 2 },
    dayContent:  { flex: 1, gap: 12 },
    nameBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dayName:     { fontSize: 16 },
    dayCount:    { fontSize: 11, fontWeight: '600' },
    renameInput: { padding: 10, borderRadius: 8, borderWidth: 1, fontSize: 16, fontWeight: '700', outlineStyle: 'none' },
    actions:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    pillBtn:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
    pillText:    { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    pillIcon:    { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
    addDayBtn:   { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, gap: 12 },
    addIcon:     { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    addText:     { fontSize: 13, fontWeight: '700' },
});
