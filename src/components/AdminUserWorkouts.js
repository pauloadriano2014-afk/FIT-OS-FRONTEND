// src/components/AdminUserWorkouts.js
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear().toString().slice(-2)}`;
};

const getExpirationStatus = (endDateString, isArchived) => {
    if (isArchived) return { text: 'ARQUIVADO', bg: '#E5E5EA', color: '#888', icon: 'archive-clock' };
    if (!endDateString) return { text: 'SEM PRAZO', bg: '#E5E5EA', color: '#888', icon: 'calendar-blank' };
    const today = new Date(); today.setHours(0,0,0,0);
    const end = new Date(endDateString); end.setHours(0,0,0,0);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `ATRASADO ${Math.abs(diffDays)}D`, bg: '#000', color: '#FFF', icon: 'alert-circle' };
    if (diffDays <= 3) return { text: `VENCE EM ${diffDays}D`, bg: '#FF3B30', color: '#FFF', icon: 'clock-alert' };
    if (diffDays <= 7) return { text: `VENCE EM ${diffDays}D`, bg: '#FFCC00', color: '#000', icon: 'clock-fast' };
    return { text: `VENCE EM ${diffDays}D`, bg: 'rgba(52, 199, 89, 0.15)', color: '#34C759', icon: 'check-circle' };
};

export default function AdminUserWorkouts({
    theme, userPlan, viewMode, loading, activeWorkouts, archivedWorkouts,
    handleNewWorkout, handleEditWorkout, handleToggleArchiveWorkout, handleDeleteWorkout,
    hasActiveFicha, fichaDaysElapsed, isFichaExpired, fichaDaysLeft
}) {
    const listToShow = viewMode === 'active' ? activeWorkouts : archivedWorkouts;

    // 🔥 RAIO-X EXCLUSIVO PARA FICHA 8S 🔥
    if (userPlan === 'FICHA_8S') {
        return (
            <View style={{marginTop: 10, marginBottom: 20}}>
                <Text style={[styles.sectionLabel, {color: theme.accent}]}>STATUS DA FICHA (RAIO-X)</Text>
                
                {!hasActiveFicha ? (
                    <View style={[styles.emptyBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                        <MaterialCommunityIcons name="clock-alert-outline" size={40} color={theme.textSecondary} />
                        <Text style={styles.emptyText}>O aluno ainda não gerou a ficha no aplicativo.</Text>
                    </View>
                ) : (
                    <View style={[styles.fichaAdminCard, { backgroundColor: theme.surface, borderColor: isFichaExpired ? '#FF3B30' : theme.border }]}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:12}}>
                            <Text style={{color: theme.text, fontWeight: 'bold', fontSize: 13}}>
                                {isFichaExpired ? 'FICHA EXPIRADA E BLOQUEADA' : 'PROGRESSO DO ALUNO'}
                            </Text>
                            <Text style={{color: theme.textSecondary, fontWeight: 'bold', fontSize: 11}}>
                                SEMANA {Math.min(8, Math.ceil((fichaDaysElapsed === 0 ? 1 : fichaDaysElapsed) / 7))} DE 8
                            </Text>
                        </View>
                        
                        <View style={{height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: theme.bg, marginBottom: 12}}>
                            <View style={{ height: '100%', borderRadius: 4, width: `${Math.min(100, (fichaDaysElapsed / 56) * 100)}%`, backgroundColor: isFichaExpired ? '#FF3B30' : (fichaDaysLeft <= 14 ? '#FF9500' : theme.accent) }} />
                        </View>
                        
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <Text style={{color: theme.textSecondary, fontSize: 11}}>Dias Corridos: {fichaDaysElapsed}</Text>
                            <Text style={{color: isFichaExpired ? '#FF3B30' : (fichaDaysLeft <= 14 ? '#FF9500' : theme.accent), fontSize: 11, fontWeight: 'bold'}}>
                                {isFichaExpired ? '0 Dias Restantes' : `${fichaDaysLeft} Dias Restantes`}
                            </Text>
                        </View>

                        {activeWorkouts.length > 0 && (
                            <TouchableOpacity 
                                style={{marginTop: 15, padding: 12, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center'}}
                                onPress={() => handleEditWorkout(activeWorkouts[0])}
                            >
                                <Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}}>VER EXERCÍCIOS DA FICHA</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    }

    // LISTAGEM ORIGINAL (Premium e Low Cost)
    return (
        <>
            {viewMode === 'active' && (
                <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.accent, marginTop: 15 }]} onPress={handleNewWorkout}>
                    <MaterialCommunityIcons name="plus-circle" size={28} color={theme.isDark ? '#000' : '#FFF'} />
                    <Text style={[styles.createBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>CRIAR NOVA ROTINA</Text>
                </TouchableOpacity>
            )}
            
            <Text style={[styles.sectionLabel, {marginTop: 15}]}>
                {viewMode === 'active' ? 'ROTINAS VIGENTES' : 'HISTÓRICO DE TREINOS'}
            </Text>

            {loading ? <ActivityIndicator color={theme.accent} style={{marginTop:20}} /> : (
                <>
                    {listToShow.length === 0 ? (
                        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                            <MaterialCommunityIcons name={viewMode === 'active' ? "dumbbell" : "archive-off-outline"} size={40} color={theme.textSecondary} />
                            <Text style={styles.emptyText}>
                                {viewMode === 'active' ? "Nenhuma rotina ativa." : "Nenhum histórico arquivado."}
                            </Text>
                        </View>
                    ) : (
                        listToShow.map((w) => {
                            const isArchived = viewMode === 'archived';
                            const status = getExpirationStatus(w.endDate, isArchived);

                            return (
                                <View key={w.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: isArchived ? theme.border : status.bg, opacity: isArchived ? 0.8 : 1}]}>
                                    <View style={styles.cardHeader}>
                                        <View style={{flexDirection:'row', gap:8, alignItems:'center'}}>
                                            <MaterialCommunityIcons name={status.icon} size={16} color={status.bg === '#E5E5EA' ? '#888' : status.bg} />
                                            <View style={{ backgroundColor: status.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                                <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 1, color: status.color }}>
                                                    {status.text}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{flexDirection: 'row', gap: 10}}>
                                            <TouchableOpacity onPress={() => handleToggleArchiveWorkout(w)} style={{padding:5}}>
                                                <MaterialCommunityIcons name={isArchived ? "package-up" : "archive-arrow-down"} size={20} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteWorkout(w.id)} style={{padding:5}}>
                                                <MaterialCommunityIcons name="trash-can-outline" size={20} color={isArchived ? theme.textSecondary : '#FF3B30'} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    
                                    <Text style={[styles.cardTitle, { color: theme.text }, isArchived && {color: theme.textSecondary}]}>{w.name}</Text>
                                    <View style={styles.dateRow}>
                                        <Text style={styles.cardDates}>Vigência: {formatDate(w.startDate)} até {formatDate(w.endDate)}</Text>
                                    </View>

                                    <TouchableOpacity style={[styles.editBtn, {backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1}]} onPress={() => handleEditWorkout(w)}>
                                        <Text style={{color: theme.text, fontWeight:'bold', fontSize:12}}>ABRIR / VER</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={16} color={theme.text} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    sectionLabel: { color:'#888', fontWeight:'900', marginBottom:5, fontSize:12, letterSpacing:1 },
    createBtn: { padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 15 },
    createBtnText: { fontWeight: '900', fontSize: 14, letterSpacing:0.5 },
    emptyBox: { alignItems:'center', padding: 30, borderStyle:'dashed', borderWidth:1, borderRadius:10, marginVertical: 10 },
    emptyText: { color: '#888', textAlign: 'center', fontStyle: 'italic', marginTop: 10 },
    card: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 5 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
    cardDates: { color: '#888', fontSize: 12, fontWeight:'bold' },
    editBtn: { padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fichaAdminCard: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 15 }
});