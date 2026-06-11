// src/components/Admin/AdminUserTreinosTab.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminUserWorkouts from '../AdminUserWorkouts';

export default function AdminUserTreinosTab({
    theme,
    handleAbrirRaioxCargas,
    workoutTab,
    setWorkoutTab,
    userPlan,
    loading,
    activeWorkouts,
    archivedWorkouts,
    handleNewWorkout,
    handleEditWorkout,
    handleToggleArchiveWorkout,
    handleDeleteWorkout,
    hasActiveFicha,
    fichaDaysElapsed,
    // 🏃 Props do módulo de corrida
    isRunningModule,
    handleToggleRunningModule,
    onOpenRunningModal,
}) {
    const [ferramentasOpen, setFerramentasOpen] = useState(false);

    return (
        <View style={styles.tabContent}>

            {/* ── Card Ferramentas colapsável ── */}
            <TouchableOpacity
                style={[styles.ferramentasHeader, {
                    backgroundColor: theme.surface,
                    borderColor: ferramentasOpen ? theme.accent + '66' : theme.border,
                    borderBottomLeftRadius: ferramentasOpen ? 0 : 16,
                    borderBottomRightRadius: ferramentasOpen ? 0 : 16,
                }]}
                onPress={() => setFerramentasOpen(o => !o)}
                activeOpacity={0.8}
            >
                <View style={[styles.ferramentasIconBox, { backgroundColor: theme.accent + '18' }]}>
                    <MaterialCommunityIcons name="tools" size={18} color={theme.accent} />
                </View>
                <Text style={[styles.ferramentasTitle, { color: theme.text }]}>FERRAMENTAS DO TREINADOR</Text>
                <MaterialCommunityIcons
                    name={ferramentasOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.textSecondary}
                />
            </TouchableOpacity>

            {ferramentasOpen && (
                <View style={[styles.ferramentasBody, {
                    backgroundColor: theme.surface,
                    borderColor: theme.accent + '66',
                }]}>

                    {/* Protocolo ELITE */}
                    <TouchableOpacity
                        style={[styles.ferramentaRow, { borderBottomColor: theme.border }]}
                        onPress={() => {/* navega para GerarTreinoIA — mantém comportamento original */}}
                    >
                        <View style={[styles.ferramentaIconBox, { backgroundColor: theme.accent + '18' }]}>
                            <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.ferramentaLabel, { color: theme.accent }]}>Protocolo ELITE</Text>
                            <Text style={[styles.ferramentaDesc, { color: theme.textSecondary }]}>Progressão automática baseada no histórico</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.accent} />
                    </TouchableOpacity>

                    {/* Protocolo de Corrida + toggle inline */}
                    <View style={[styles.ferramentaRow, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 0 }}
                            onPress={() => { if (isRunningModule && onOpenRunningModal) onOpenRunningModal(); }}
                            activeOpacity={isRunningModule ? 0.7 : 1}
                        >
                            <View style={[styles.ferramentaIconBox, { backgroundColor: '#22c55e18', marginRight: 12 }]}>
                                <MaterialCommunityIcons
                                    name="run-fast"
                                    size={18}
                                    color={isRunningModule ? '#22c55e' : theme.textSecondary}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.ferramentaLabel, { color: isRunningModule ? '#22c55e' : theme.textSecondary }]}>
                                    Protocolo de Corrida
                                </Text>
                                <Text style={[styles.ferramentaDesc, { color: theme.textSecondary }]}>
                                    {isRunningModule ? 'Anamnese, IA e acompanhamento' : 'Módulo desativado para este aluno'}
                                </Text>
                            </View>
                            {isRunningModule && (
                                <MaterialCommunityIcons name="chevron-right" size={18} color="#22c55e" style={{ marginRight: 8 }} />
                            )}
                        </TouchableOpacity>
                        <Switch
                            value={!!isRunningModule}
                            onValueChange={handleToggleRunningModule}
                            trackColor={{ false: theme.border, true: '#22c55e' }}
                            thumbColor={Platform.OS === 'ios' ? '#FFF' : (isRunningModule ? '#000' : '#888')}
                        />
                    </View>

                    {/* Histórico de Cargas */}
                    <TouchableOpacity
                        style={[styles.ferramentaRow, { borderBottomWidth: 0 }]}
                        onPress={handleAbrirRaioxCargas}
                    >
                        <View style={[styles.ferramentaIconBox, { backgroundColor: theme.accent + '18' }]}>
                            <MaterialCommunityIcons name="weight-lifter" size={18} color={theme.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.ferramentaLabel, { color: theme.accent }]}>Histórico de Cargas</Text>
                            <Text style={[styles.ferramentaDesc, { color: theme.textSecondary }]}>Veja os pesos salvos pelo aluno nos treinos</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.accent} />
                    </TouchableOpacity>

                </View>
            )}

            {/* ── Sub-abas Fichas ── */}
            <View style={[styles.subTabsRow, { marginTop: ferramentasOpen ? 0 : 20 }]}>
                <TouchableOpacity
                    style={[styles.subTabBtn, { borderBottomColor: theme.border }, workoutTab === 'active' && { borderBottomColor: theme.accent }]}
                    onPress={() => setWorkoutTab('active')}
                >
                    <Text style={[styles.subTabText, { color: theme.textSecondary }, workoutTab === 'active' && { color: theme.accent }]}>FICHAS ATIVAS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.subTabBtn, { borderBottomColor: theme.border }, workoutTab === 'archived' && { borderBottomColor: theme.accent }]}
                    onPress={() => setWorkoutTab('archived')}
                >
                    <Text style={[styles.subTabText, { color: theme.textSecondary }, workoutTab === 'archived' && { color: theme.accent }]}>ARQUIVADAS</Text>
                </TouchableOpacity>
            </View>

            {/* ── Lista de treinos ── */}
            <AdminUserWorkouts
                theme={theme}
                userPlan={userPlan}
                viewMode={workoutTab}
                loading={loading}
                activeWorkouts={activeWorkouts}
                archivedWorkouts={archivedWorkouts}
                handleNewWorkout={handleNewWorkout}
                handleEditWorkout={handleEditWorkout}
                handleToggleArchiveWorkout={handleToggleArchiveWorkout}
                handleDeleteWorkout={handleDeleteWorkout}
                hasActiveFicha={hasActiveFicha}
                fichaDaysElapsed={fichaDaysElapsed}
                isFichaExpired={userPlan === 'FICHA_8S' && fichaDaysElapsed > 56}
                fichaDaysLeft={Math.max(0, 56 - fichaDaysElapsed)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    tabContent: { width: '100%', paddingBottom: 20 },

    // Ferramentas colapsável
    ferramentasHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 0,
    },
    ferramentasIconBox: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    ferramentasTitle: { flex: 1, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

    ferramentasBody: {
        borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
        borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        marginBottom: 20, overflow: 'hidden',
    },
    ferramentaRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    ferramentaIconBox: {
        width: 34, height: 34, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    ferramentaLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
    ferramentaDesc: { fontSize: 11, marginTop: 1 },

    // Sub-abas
    subTabsRow: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 20 },
    subTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
    subTabText: { fontWeight: 'bold', fontSize: 11 },
});