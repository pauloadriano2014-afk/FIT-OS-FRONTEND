import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DaySelector({
    theme, state, setters, actions,
    dayDropdownOpen, setDayDropdownOpen,
    editingTabName, setEditingTabName,
    editingTabValue, setEditingTabValue,
    confirmRenameTab, deleteTabInline, moveTab
}) {
    return (
        <View style={styles.daySelectorWrapper}>
            <TouchableOpacity
                style={[styles.daySelectorBtn, {
                    backgroundColor: theme.surface,
                    borderColor: dayDropdownOpen ? theme.accent + '60' : theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    ...Platform.select({
                        ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
                        android: { elevation: 2 },
                        web: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
                    }),
                }]}
                onPress={() => setDayDropdownOpen(!dayDropdownOpen)}
                activeOpacity={0.8}
            >
                <View style={[styles.dayIconBox, { backgroundColor: theme.accent }]}>
                    <MaterialCommunityIcons name="calendar-today" size={16} color={theme.isDark ? '#000' : '#FFF'} />
                </View>
                <View style={styles.daySelectorInfo}>
                    <Text style={[styles.daySelectorLabel, { color: theme.textSecondary }]}>DIA ATIVO</Text>
                    <Text style={[styles.daySelectorValue, { color: theme.text }]}>
                        {state.selectedWorkoutTab}
                        <Text style={[styles.daySelectorCount, { color: theme.textSecondary }]}>
                            {' '}· {state.currentExercises.length} exercício{state.currentExercises.length !== 1 ? 's' : ''}
                        </Text>
                    </Text>
                </View>
                <View style={[styles.chevronBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                    <MaterialCommunityIcons name={dayDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
                </View>
            </TouchableOpacity>

            {dayDropdownOpen && (
                <View style={[styles.dayDropdown, {
                    backgroundColor: theme.surface,
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    ...Platform.select({
                        ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
                        android: { elevation: 6 },
                        web: { boxShadow: '0 6px 24px rgba(0,0,0,0.12)' },
                    }),
                }]}>
                    {state.workoutTabs.map((tab, tabIndex) => {
                        const isSelected = tab === state.selectedWorkoutTab;
                        const isEditing = editingTabName === tab;
                        const exCount = (state.exercisesByDay[tab] || []).length;

                        return (
                            <View
                                key={tab}
                                style={[styles.dayRow, {
                                    backgroundColor: isSelected ? theme.accent + '12' : 'transparent',
                                    borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    borderBottomWidth: tabIndex < state.workoutTabs.length - 1 ? 1 : 0,
                                }]}
                            >
                                <View style={[styles.dayActiveBar, { backgroundColor: isSelected ? theme.accent : 'transparent' }]} />

                                <View style={styles.dayContentWrapper}>
                                    {isEditing ? (
                                        <TextInput
                                            style={[styles.dayRenameInput, {
                                                color: theme.text,
                                                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                borderColor: theme.accent + '60',
                                            }]}
                                            value={editingTabValue}
                                            onChangeText={setEditingTabValue}
                                            autoFocus
                                            onSubmitEditing={() => confirmRenameTab(tab)}
                                            onBlur={() => confirmRenameTab(tab)}
                                        />
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.dayNameBtn}
                                            onPress={() => {
                                                setters.setSelectedWorkoutTab(tab);
                                                setDayDropdownOpen(false);
                                            }}
                                        >
                                            <Text style={[styles.dayName, {
                                                color: isSelected ? theme.accent : theme.text,
                                                fontWeight: isSelected ? '900' : '600',
                                            }]}>{tab}</Text>
                                            <Text style={[styles.dayCount, { color: theme.textSecondary }]}>
                                                {exCount} ex.
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    <View style={styles.dayRowActions}>
                                        <View style={{ flexDirection: 'row', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 10, overflow: 'hidden' }}>
                                            <TouchableOpacity style={styles.actionPillIcon} onPress={() => moveTab(tab, 'up')} disabled={tabIndex === 0}>
                                                <MaterialCommunityIcons name="arrow-up" size={16} color={tabIndex === 0 ? theme.textSecondary + '40' : theme.textSecondary} />
                                            </TouchableOpacity>
                                            <View style={{ width: 1, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                            <TouchableOpacity style={styles.actionPillIcon} onPress={() => moveTab(tab, 'down')} disabled={tabIndex === state.workoutTabs.length - 1}>
                                                <MaterialCommunityIcons name="arrow-down" size={16} color={tabIndex === state.workoutTabs.length - 1 ? theme.textSecondary + '40' : theme.textSecondary} />
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.actionPillBtn, { backgroundColor: isEditing ? theme.accent + '25' : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
                                            onPress={() => {
                                                if (isEditing) confirmRenameTab(tab);
                                                else { setEditingTabName(tab); setEditingTabValue(tab); }
                                            }}
                                        >
                                            <MaterialCommunityIcons name={isEditing ? 'check-circle' : 'pencil'} size={14} color={isEditing ? theme.accent : theme.textSecondary} />
                                            <Text style={[styles.actionPillText, { color: isEditing ? theme.accent : theme.textSecondary }]}>
                                                {isEditing ? 'SALVAR' : 'EDITAR'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionPillBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
                                            onPress={() => actions.duplicateTabInline(tab)}
                                        >
                                            <MaterialCommunityIcons name="content-copy" size={14} color={theme.textSecondary} />
                                            <Text style={[styles.actionPillText, { color: theme.textSecondary }]}>DUPLICAR</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionPillBtn, { backgroundColor: 'rgba(255,59,48,0.1)', opacity: state.workoutTabs.length <= 1 ? 0.3 : 1 }]}
                                            onPress={() => deleteTabInline(tab)}
                                            disabled={state.workoutTabs.length <= 1}
                                        >
                                            <MaterialCommunityIcons name="trash-can" size={14} color="#FF3B30" />
                                            <Text style={[styles.actionPillText, { color: '#FF3B30' }]}>EXCLUIR</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    <TouchableOpacity
                        style={[styles.addDayBtn, { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}
                        onPress={() => {
                            actions.addNewTab();
                            setDayDropdownOpen(false);
                        }}
                    >
                        <View style={[styles.addDayIconBox, { backgroundColor: theme.accent + '20' }]}>
                            <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                        </View>
                        <Text style={[styles.addDayText, { color: theme.accent }]}>Adicionar dia de treino</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    daySelectorWrapper: { marginBottom: 20 },
    daySelectorBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
    dayIconBox: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    daySelectorInfo: { flex: 1 },
    daySelectorLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
    daySelectorValue: { fontSize: 15, fontWeight: '800' },
    daySelectorCount: { fontSize: 13, fontWeight: '500' },
    chevronBox: { borderRadius: 8, padding: 4 },
    dayDropdown: { marginTop: 8, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    dayRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 16, gap: 12 },
    dayActiveBar: { width: 3, height: 22, borderRadius: 2, marginTop: 2 },
    dayContentWrapper: { flex: 1, gap: 12 },
    dayNameBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dayName: { fontSize: 16 },
    dayCount: { fontSize: 11, fontWeight: '600' },
    dayRenameInput: { padding: 10, borderRadius: 8, borderWidth: 1, fontSize: 16, fontWeight: '700', outlineStyle: 'none' },
    dayRowActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    actionPillBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
    actionPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    actionPillIcon: { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
    addDayBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, gap: 12 },
    addDayIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    addDayText: { fontSize: 13, fontWeight: '700' },
});