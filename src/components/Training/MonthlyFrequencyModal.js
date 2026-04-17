// src/components/Training/MonthlyFrequencyModal.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MonthlyFrequencyModal({ visible, onClose, theme, history = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());

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
            
            arr.push({ day: i, date: d, isDone });
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

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={{width: 24}} /> 
                        <Text style={[styles.title, { color: theme.text }]}>PERFORMANCE MENSAL</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
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
                                    <View key={index} style={styles.dayCell}>
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
                                    </View>
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
    motivText: { fontSize: 10, marginTop: 10, fontStyle: 'italic', textAlign: 'center' }
});