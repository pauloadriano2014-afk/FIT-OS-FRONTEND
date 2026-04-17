// src/components/Training/WorkoutFolder.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const getIconByMuscle = (muscleString = "") => {
    const m = muscleString.toLowerCase();
    if (m.includes('perna') || m.includes('agacha') || m.includes('quad')) return 'weight-lifter';
    if (m.includes('costas')) return 'rowing';
    if (m.includes('peito')) return 'dumbbell';
    if (m.includes('braço') || m.includes('biceps')) return 'arm-flex';
    if (m.includes('ombro')) return 'arrow-up-bold-hexagon-outline';
    return 'flash';
};

export default function WorkoutFolder({ program, theme, handleDayPress, handleResetCycle }) {
    const allDone = program.routineDays.length > 0 && program.routineDays.every(d => d.isDone || d.day.toUpperCase() === 'OFF' || d.day.toUpperCase().includes('DESCANSO'));

    return (
        <View style={[styles.folderContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            {/* CABEÇALHO DA PASTINHA */}
            <View style={[styles.folderHeader, { borderBottomColor: theme.border }]}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
                    <View style={[styles.folderIconBox, { backgroundColor: theme.accent + '22' }]}>
                        <MaterialCommunityIcons name="folder-star" size={22} color={theme.accent} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={[styles.folderLabel, { color: theme.textSecondary }]}>PROGRAMA VIGENTE</Text>
                        <Text style={[styles.folderTitle, { color: theme.text }]} numberOfLines={1}>{program.name}</Text>
                    </View>
                </View>
                
                {/* Botão sutil para reiniciar a semana */}
                <TouchableOpacity onPress={() => handleResetCycle(program.id)} style={[styles.resetBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="refresh" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* CONTEÚDO: OS DIAS DA ROTINA (A, B, C...) */}
            <View style={styles.folderBody}>
                {program.routineDays.map((item, index) => {
                    const isDescanso = item.day.toUpperCase() === 'OFF' || item.day.toUpperCase().includes('DESCANSO');
                    const muscleGroupsStr = Array.from(item.muscleGroups).join(', ');
                    const iconName = getIconByMuscle(muscleGroupsStr);

                    // Renderização de um Dia de Descanso
                    if (isDescanso) {
                        return (
                            <View key={index} style={[styles.cardDescanso, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={[styles.descansoIconBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="bed-empty" size={20} color={theme.textSecondary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{color: theme.text, fontWeight:'900', fontSize: 13, letterSpacing: 0.5}}>DIA DE DESCANSO</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>Recupere suas energias.</Text>
                                </View>
                            </View>
                        );
                    }

                    // Renderização de um Dia de Treino Normal
                    const isDestacado = item.isNext && !item.isDone;
                    const isCompleted = item.isDone;
                    const borderColor = isDestacado ? theme.accent : (isCompleted ? theme.border : theme.border);
                    const bgColor = isCompleted ? (theme.isDark ? '#111' : '#f5f5f5') : theme.bg;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.card,
                                { backgroundColor: bgColor, borderColor: borderColor, opacity: isCompleted ? 0.6 : 1 },
                                isDestacado && { backgroundColor: theme.isDark ? '#1a2200' : theme.accent + '0A', borderWidth: 2 }
                            ]}
                            onPress={() => handleDayPress(program.id, item.day, program.name)}
                            activeOpacity={0.8}
                        >
                            {isDestacado && (
                                <View style={[styles.destaqueBadge, { backgroundColor: theme.accent }]}>
                                    <Text style={[styles.destaqueText, { color: theme.isDark ? '#000' : '#FFF' }]}>SUA MISSÃO HOJE</Text>
                                </View>
                            )}
                            
                            <View style={styles.cardHeaderRow}>
                                <View style={[ styles.iconCircle, { backgroundColor: isCompleted ? theme.surface : theme.accent + '15', borderColor: isCompleted ? theme.border : theme.accent + '40', borderWidth: 1 } ]}>
                                    <MaterialCommunityIcons name={isCompleted ? "check-all" : iconName} size={20} color={isCompleted ? theme.accent : theme.accent} />
                                </View>
                                
                                <View style={styles.headerInfo}>
                                    <Text style={[styles.dayText, { color: isCompleted ? theme.textSecondary : theme.text }]} numberOfLines={1}>{item.day.toUpperCase()}</Text>
                                    <Text style={[styles.muscleText, { color: theme.textSecondary }]}>{muscleGroupsStr || 'Geral'}</Text>
                                </View>
                                
                                <View style={[styles.actionBtn, { backgroundColor: isCompleted ? theme.surface : theme.accent, borderColor: isCompleted ? theme.border : theme.accent, borderWidth: 1 }]}>
                                    <Text style={[styles.actionBtnText, { color: isCompleted ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF') }]}>
                                        {isCompleted ? 'REVISAR' : 'TREINAR'}
                                    </Text>
                                    <MaterialCommunityIcons name={isCompleted ? "eye-outline" : "play"} size={14} color={isCompleted ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF')} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
            
            {allDone && (
                <View style={[styles.successBanner, { backgroundColor: theme.accent + '15', borderTopColor: theme.accent + '40' }]}>
                    <MaterialCommunityIcons name="trophy" size={16} color={theme.accent} />
                    <Text style={{color: theme.accent, fontWeight: '900', fontSize: 11, letterSpacing: 0.5}}>SEMANA CONCLUÍDA COM SUCESSO!</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    folderContainer: { width: '100%', borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginBottom: 25 },
    folderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    folderIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    folderLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    folderTitle: { fontSize: 18, fontWeight: '900' },
    resetBtn: { padding: 10, borderRadius: 12, borderWidth: 1 },
    
    folderBody: { padding: 15, paddingBottom: 5 },
    
    cardDescanso: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderStyle: 'dashed' },
    descansoIconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    
    card: { borderRadius: 16, padding: 15, borderWidth: 1, position: 'relative', marginBottom: 10 },
    destaqueBadge: { position: 'absolute', top: -10, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 8, zIndex: 10 },
    destaqueText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    headerInfo: { flex: 1 },
    dayText: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    muscleText: { fontSize: 10, textTransform: 'uppercase', fontWeight: '800', marginTop: 2 },
    
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    actionBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    
    successBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, borderTopWidth: 1 }
});