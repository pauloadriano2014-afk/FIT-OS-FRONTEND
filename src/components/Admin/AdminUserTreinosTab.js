// src/components/Admin/AdminUserTreinosTab.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importa o componente que lista os treinos (ele fica uma pasta antes, por isso o '../')
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
    fichaDaysElapsed
}) {
    return (
        <View style={styles.tabContent}>
            <TouchableOpacity style={[styles.cargasBtn, { backgroundColor: theme.surface, borderColor: theme.accent }]} onPress={handleAbrirRaioxCargas}>
                <View style={[styles.iconBox, { backgroundColor: theme.accent + '22' }]}>
                    <MaterialCommunityIcons name="weight-lifter" size={20} color={theme.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>HISTÓRICO DE CARGAS</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 2 }}>Veja os pesos salvos pelo aluno nos treinos.</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
            </TouchableOpacity>

            <View style={styles.subTabsRow}>
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
    cargasBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    subTabsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    subTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
    subTabText: { fontWeight: 'bold', fontSize: 11 }
});