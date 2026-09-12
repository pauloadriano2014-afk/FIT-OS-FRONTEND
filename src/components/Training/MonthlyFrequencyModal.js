// src/components/Training/MonthlyFrequencyModal.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getRpeInfo } from '../../utils/calculations';

export default function MonthlyFrequencyModal({ visible, onClose, theme, history = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    // 🔥 NOVO: dia selecionado no calendário -- quando definido, mostra o
    // detalhe do(s) treino(s) daquele dia (nome, exercícios, séries feitas
    // e observação do aluno) em vez da grade do mês.
    const [selectedDay, setSelectedDay] = useState(null);

    const { daysArray, monthName, year, stats } = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        
        const firstDay = new Date(y, m, 1).getDay();
        const startDay = firstDay === 0 ? 6 : firstDay - 1; 

        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        let arr = [];
        let currentMonthWorkouts = 0;
        let currentMonthPRs = 0;
        let currentMonthXP = 0;

        const monthHistory = history.filter(log => {
            const logDate = new Date(log.date);
            return logDate.getMonth() === m && logDate.getFullYear() === y;
        });

        for (let i = 0; i < startDay; i++) {
            arr.push(null);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(y, m, i);
            const logsOfDay = monthHistory.filter(log => new Date(log.date).toDateString() === d.toDateString());
            
            const isDone = logsOfDay.length > 0;
            if (isDone) {
                currentMonthWorkouts++;
                logsOfDay.forEach(log => {
                    currentMonthPRs += (log.progressions || 0);
                    currentMonthXP += (log.xpEarned || 0);
                });
            }

            arr.push({ day: i, date: d, isDone, logs: logsOfDay });
        }

        const consistency = Math.round((currentMonthWorkouts / daysInMonth) * 100);

        return { 
            daysArray: arr, 
            monthName: months[m], 
            year: y,
            stats: {
                workouts: currentMonthWorkouts,
                prs: currentMonthPRs,
                xp: currentMonthXP,
                consistency: consistency
            }
        };
    }, [currentDate, history]);

    const nextMonth = () => { setSelectedDay(null); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); };
    const prevMonth = () => { setSelectedDay(null); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); };

    const handleClose = () => {
        setSelectedDay(null);
        onClose();
    };

    // Agrupa os exercícios de um log por exerciseId, juntando as séries e
    // pegando a primeira observação não-vazia do aluno (se houver).
    const groupExercises = (details = []) => {
        const order = [];
        const map = {};
        details.forEach(d => {
            if (!map[d.exerciseId]) {
                map[d.exerciseId] = { exerciseId: d.exerciseId, exerciseName: d.exerciseName, note: '', sets: [] };
                order.push(d.exerciseId);
            }
            map[d.exerciseId].sets.push({ setNumber: d.setNumber, weight: d.weight, reps: d.reps });
            if (!map[d.exerciseId].note && d.note && d.note.trim() !== '') map[d.exerciseId].note = d.note;
        });
        order.forEach(id => map[id].sets.sort((a, b) => a.setNumber - b.setNumber));
        return order.map(id => map[id]);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        {selectedDay ? (
                            <TouchableOpacity onPress={() => setSelectedDay(null)} style={styles.closeBtn}>
                                <MaterialCommunityIcons name="chevron-left" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={{width: 24}} />
                        )}
                        <Text style={[styles.title, { color: theme.text }]}>
                            {selectedDay ? selectedDay.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase() : 'PERFORMANCE MENSAL'}
                        </Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {selectedDay ? (
                            <View style={{ padding: 15 }}>
                                {selectedDay.logs.map((log, logIdx) => {
                                    const logRpeInfo = log.rpe ? getRpeInfo(log.rpe) : null;
                                    const exercises = groupExercises(log.details);
                                    return (
                                        <View key={log.id || logIdx} style={[styles.dayLogCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                            <View style={styles.dayLogHeader}>
                                                <Text style={[styles.dayLogTitle, { color: theme.text }]}>{log.name || log.workoutName || 'Treino'}</Text>
                                                {logRpeInfo && (
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <View style={[styles.rpeBadge, { backgroundColor: logRpeInfo.color }]}>
                                                            <Text style={styles.rpeVal}>{log.rpe}</Text>
                                                        </View>
                                                        <Text style={[styles.rpeLabelName, { color: logRpeInfo.color }]}>{logRpeInfo.label}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {log.feedback ? (
                                                <View style={[styles.feedbackContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                    <Text style={[styles.feedbackLabel, { color: theme.textSecondary }]}>OBSERVAÇÃO DO ALUNO:</Text>
                                                    <Text style={[styles.feedbackText, { color: theme.text }]}>{log.feedback}</Text>
                                                </View>
                                            ) : null}

                                            {exercises.map(ex => (
                                                <View key={ex.exerciseId} style={[styles.exerciseBlock, { borderTopColor: theme.border }]}>
                                                    <Text style={[styles.exerciseName, { color: theme.text }]}>{ex.exerciseName}</Text>
                                                    <View style={styles.setsWrap}>
                                                        {ex.sets.map((s, si) => (
                                                            <View key={si} style={[styles.setChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                                <Text style={[styles.setChipText, { color: theme.textSecondary }]}>
                                                                    {s.setNumber}ª: {s.reps}x {s.weight ? `${s.weight}kg` : ''}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                    {ex.note ? (
                                                        <View style={[styles.exerciseNoteContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                                                <MaterialCommunityIcons name="comment-alert-outline" size={13} color="#FF9500" />
                                                                <Text style={styles.exerciseNoteLabel}>OBSERVAÇÃO</Text>
                                                            </View>
                                                            <Text style={[styles.feedbackText, { color: theme.text }]}>{ex.note}</Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            ))}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <>
                                <View style={styles.monthSelector}>
                                    <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                                        <MaterialCommunityIcons name="chevron-left" size={20} color={theme.accent} />
                                    </TouchableOpacity>
                                    <View style={{alignItems: 'center'}}>
                                        <Text style={[styles.monthText, { color: theme.textSecondary }]}>{monthName} {year}</Text>
                                    </View>
                                    <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.accent} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.weekRow}>
                                    {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
                                        <Text key={i} style={[styles.weekDayText, { color: theme.textSecondary }]}>{d}</Text>
                                    ))}
                                </View>

                                <View style={styles.grid}>
                                    {daysArray.map((item, index) => {
                                        if (!item) return <View key={index} style={styles.dayCell} />;
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.dayCell}
                                                disabled={!item.isDone}
                                                onPress={() => item.isDone && setSelectedDay(item)}
                                                activeOpacity={item.isDone ? 0.6 : 1}
                                            >
                                                <View style={[
                                                    styles.dayCircle,
                                                    item.isDone
                                                        ? { backgroundColor: theme.accent, borderColor: theme.accent }
                                                        : { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }
                                                ]}>
                                                    <Text style={[
                                                        styles.dayText,
                                                        item.isDone ? { color: '#000' } : { color: theme.textSecondary }
                                                    ]}>
                                                        {item.day}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={styles.statsContainer}>
                                    <View style={[styles.statsRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <View style={styles.statItem}>
                                            <View style={styles.statIconRow}>
                                                <MaterialCommunityIcons name="dumbbell" size={14} color={theme.accent} />
                                                <Text style={[styles.statValue, { color: theme.text }]}>{stats.workouts}</Text>
                                            </View>
                                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TREINOS</Text>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.statItem}>
                                            <View style={styles.statIconRow}>
                                                <MaterialCommunityIcons name="fire" size={14} color="#FF9500" />
                                                <Text style={[styles.statValue, { color: theme.text }]}>{stats.prs}</Text>
                                            </View>
                                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>RECORDES</Text>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.statItem}>
                                            <View style={styles.statIconRow}>
                                                <MaterialCommunityIcons name="trophy" size={14} color="#FFCC00" />
                                                <Text style={[styles.statValue, { color: theme.text }]}>{stats.xp}</Text>
                                            </View>
                                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>XP GANHO</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.consistencyBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <View style={styles.consHeader}>
                                            <Text style={[styles.consLabel, { color: theme.text }]}>TAXA DE CONSISTÊNCIA</Text>
                                            <Text style={[styles.consValue, { color: theme.accent }]}>{stats.consistency}%</Text>
                                        </View>
                                        <View style={[styles.consBarBg, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={[styles.consBarFill, { width: `${stats.consistency}%`, backgroundColor: theme.accent }]} />
                                        </View>
                                        <Text style={[styles.motivText, {color: theme.textSecondary}]}>
                                            {stats.consistency >= 80 ? "🎯 Nível Elite! Disciplina impecável." :
                                             stats.consistency >= 50 ? "🚀 Bom ritmo! Foco total." :
                                             stats.consistency > 0   ? "⚠️ Atenção! Exige mais constância." :
                                             "Nenhum treino."}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    box: { width: '100%', maxWidth: 360, alignSelf: 'center', borderRadius: 24, borderWidth: 1, maxHeight: '85%', overflow: 'hidden' },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    closeBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
    title: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
    
    monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, paddingBottom: 10 },
    navBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8 },
    monthText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    
    weekRow: { flexDirection: 'row', paddingHorizontal: 10, marginBottom: 5 },
    weekDayText: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '900' },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
    dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 4 },
    dayCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    dayText: { fontSize: 11, fontWeight: 'bold' },

    statsContainer: { padding: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 10 },
    
    statsRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, paddingVertical: 12 },
    statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statValue: { fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
    statLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
    divider: { width: 1, height: '60%', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },

    consistencyBox: { padding: 15, borderRadius: 16, borderWidth: 1, marginTop: 10 },
    consHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    consLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    consValue: { fontSize: 14, fontWeight: '900', fontStyle: 'italic' },
    consBarBg: { height: 6, borderRadius: 3, borderWidth: 1, overflow: 'hidden' },
    consBarFill: { height: '100%', borderRadius: 3 },
    motivText: { fontSize: 10, marginTop: 10, fontStyle: 'italic', textAlign: 'center' },

    // 🔥 NOVO: detalhe do dia selecionado (treino específico feito naquele dia)
    dayLogCard: { padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    dayLogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    dayLogTitle: { fontSize: 14, fontWeight: '900', flex: 1, paddingRight: 10 },
    rpeBadge: { alignItems: 'center', justifyContent: 'center', borderRadius: 6, width: 24, height: 24, alignSelf: 'flex-end' },
    rpeVal: { fontWeight: '900', fontSize: 12, color: '#000' },
    rpeLabelName: { fontSize: 8, fontWeight: 'bold', marginTop: 2, textAlign: 'right' },
    feedbackContainer: { padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1 },
    feedbackLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
    feedbackText: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
    exerciseBlock: { paddingTop: 10, marginTop: 10, borderTopWidth: 1 },
    exerciseName: { fontSize: 12, fontWeight: '900', marginBottom: 6 },
    setsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    setChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    setChipText: { fontSize: 10, fontWeight: '700' },
    exerciseNoteContainer: { padding: 10, borderRadius: 8, borderWidth: 1, borderLeftWidth: 3, borderLeftColor: '#FF9500', marginTop: 8 },
    exerciseNoteLabel: { color: '#FF9500', fontSize: 10, fontWeight: '900' },
});