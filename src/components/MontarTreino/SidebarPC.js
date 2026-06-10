// src/components/MontarTreino/SidebarPC.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RaioXCard from './RaioXCard';
import MenstrualAlertCard from './MenstrualAlertCard';

export default function SidebarPC({
    theme, isTemplateMode,
    // RaioxCard
    anamneseData, isRaioxExpanded, onToggleRaiox,
    // MenstrualAlertCard
    state, setters, alunoIsMenstruating, dbDeloadSynced,
    isCancelingDeload, handleCancelDeload, forceDeload,
    // Settings
    renderSettings,
    // Tabs
    workoutTabs, selectedWorkoutTab, exercisesByDay,
    onSelectTab, onMoveTab, onAddTab,
    // MagicSync
    isTemplateEnabled, currentExercisesLength,
    isSyncingCargas, onMagicSync,
    // Ver treino
    alunoId, onViewWorkout,
}) {
    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {!isTemplateMode && (
                <RaioXCard anamneseData={anamneseData} isRaioxExpanded={isRaioxExpanded} setIsRaioxExpanded={onToggleRaiox} theme={theme} />
            )}

            {!isTemplateMode && (
                <MenstrualAlertCard theme={theme} state={state} setters={setters} alunoIsMenstruating={alunoIsMenstruating} dbDeloadSynced={dbDeloadSynced} intensityMultiplier={state.intensityMultiplier} isCancelingDeload={isCancelingDeload} handleCancelDeload={handleCancelDeload} forceDeload={forceDeload} />
            )}

            {renderSettings()}

            <Text style={[S.sectionLabel, { color: theme.textSecondary }]}>DIAS DE TREINO</Text>
            <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                {workoutTabs.map((tab, tabIndex) => {
                    const isSelected = selectedWorkoutTab === tab;
                    const exCount = (exercisesByDay[tab] || []).length;
                    return (
                        <View key={tab} style={[S.verticalTab, { backgroundColor: isSelected ? (theme.isDark ? 'rgba(255,255,255,0.08)' : '#FFF') : 'transparent', borderLeftColor: isSelected ? theme.accent : 'transparent' }]}>
                            <TouchableOpacity style={{ flex: 1, paddingVertical: 4 }} onPress={() => onSelectTab(tab)}>
                                <Text style={{ fontWeight: isSelected ? '900' : '600', color: isSelected ? theme.accent : theme.text, fontSize: 14 }}>{tab}</Text>
                                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>{exCount} ex.</Text>
                            </TouchableOpacity>
                            {/* Setinhas */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 8, overflow: 'hidden' }}>
                                <TouchableOpacity style={{ padding: 8 }} onPress={() => onMoveTab(tab, 'up')} disabled={tabIndex === 0}>
                                    <MaterialCommunityIcons name="arrow-up" size={14} color={tabIndex === 0 ? theme.textSecondary + '40' : theme.textSecondary} />
                                </TouchableOpacity>
                                <View style={{ width: 1, height: 16, backgroundColor: theme.border }} />
                                <TouchableOpacity style={{ padding: 8 }} onPress={() => onMoveTab(tab, 'down')} disabled={tabIndex === workoutTabs.length - 1}>
                                    <MaterialCommunityIcons name="arrow-down" size={14} color={tabIndex === workoutTabs.length - 1 ? theme.textSecondary + '40' : theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
                <TouchableOpacity style={[S.addTab, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} onPress={onAddTab}>
                    <MaterialCommunityIcons name="plus" size={16} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700' }}>Adicionar Dia</Text>
                </TouchableOpacity>
            </View>

            {!isTemplateMode && currentExercisesLength > 0 && (
                <TouchableOpacity style={[S.magicSync, { backgroundColor: theme.surface, borderColor: theme.accent }]} onPress={onMagicSync} disabled={isSyncingCargas}>
                    {isSyncingCargas ? <ActivityIndicator size="small" color={theme.accent} /> : (
                        <>
                            <MaterialCommunityIcons name="magic-staff" size={20} color={theme.accent} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={[S.magicTitle, { color: theme.accent }]}>PUXAR CARGAS DO ALUNO</Text>
                                <Text style={S.magicDesc}>Preenche o peso de todos os exercícios deste dia.</Text>
                            </View>
                        </>
                    )}
                </TouchableOpacity>
            )}

            {!isTemplateMode && alunoId && (
                <TouchableOpacity style={[S.viewWorkout, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '10' }]} onPress={onViewWorkout}>
                    <MaterialCommunityIcons name="eye" size={16} color={theme.accent} />
                    <Text style={[S.viewWorkoutText, { color: theme.accent }]}>VER TREINO DO ALUNO</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const S = StyleSheet.create({
    sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10, marginTop: 10 },
    verticalTab:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderLeftWidth: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
    addTab:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
    magicSync:    { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 10, marginBottom: 10 },
    magicTitle:   { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    magicDesc:    { fontSize: 10, color: '#888', marginTop: 2 },
    viewWorkout:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 8, marginTop: 10 },
    viewWorkoutText: { fontWeight: 'bold', fontSize: 12 },
});
