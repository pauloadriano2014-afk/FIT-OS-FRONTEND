import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";

export default function PerformanceTab({ theme, workoutHistory, chartWidth, baseChartConfig }) {
    const totalTonnage = workoutHistory.reduce((acc, curr) => acc + (curr.tonnage || 0), 0);
    const chartWorkouts = [...workoutHistory].reverse().slice(-6); 
    
    const performanceChartData = {
        labels: chartWorkouts.map(h => h.dateFormatted || '?'),
        datasets: [{ data: chartWorkouts.length > 0 ? chartWorkouts.map(h => h.tonnage / 1000) : [0], color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`, strokeWidth: 3 }]
    };

    return (
        <View>
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="weight-lifter" size={24} color={theme.accent} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{(totalTonnage / 1000).toFixed(1)}t</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>VOLUME TOTAL</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="fire" size={24} color="#FF3B30" />
                    <Text style={[styles.statValue, { color: theme.text }]}>{workoutHistory.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TREINOS</Text>
                </View>
            </View>
            
            <Text style={[styles.sectionTitle, { color: theme.accent }]}>VOLUME DE CARGA (TONELADAS)</Text>
            {chartWorkouts.length > 1 ? (
                <LineChart data={performanceChartData} width={chartWidth} height={220} chartConfig={{...baseChartConfig, color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`, fillShadowGradientOpacity: 0.1}} bezier style={styles.chart} yAxisSuffix="t" withVerticalLines={false} />
            ) : (
                <View style={[styles.emptyChart, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Realize pelo menos 2 treinos.</Text></View>
            )}
            
            <Text style={[styles.sectionTitle, { color: theme.accent }]}>HISTÓRICO RECENTE</Text>
            {workoutHistory.length === 0 ? (
                <View style={[styles.emptyChart, { backgroundColor: theme.surface, borderColor: theme.border, height: 100 }]}><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum treino concluído.</Text></View>
            ) : (
                workoutHistory.slice(0,5).map((item, i) => (
                    <View key={i} style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.historyHeader}>
                            <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{new Date(item.date).toLocaleDateString()}</Text>
                            {item.rpe && <View style={[styles.rpeBadge, {backgroundColor: item.rpe >= 8 ? '#FF3B30' : theme.accent}]}><Text style={[styles.rpeText, { color: theme.isDark ? '#000' : '#FFF' }]}>RPE {item.rpe}</Text></View>}
                        </View>
                        <Text style={[styles.historyWorkout, { color: theme.text }]}>{item.name || 'Treino'}</Text>
                        <Text style={[styles.historyTonnage, { color: theme.accent }]}>{item.tonnage}kg totais movidos</Text>
                    </View>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    statCard: { width: '48%', padding: 20, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '900', marginVertical: 5 },
    statLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    sectionTitle: { fontSize: 12, fontWeight: '900', marginBottom: 15, marginTop: 10, letterSpacing: 1 },
    chart: { marginVertical: 8, alignSelf: 'center', borderRadius: 16 },
    emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center', borderRadius: 20, borderWidth:1 },
    emptyText: { fontWeight: 'bold' },
    historyCard: { padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    historyDate: { fontSize: 11, fontWeight: '900' },
    rpeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    rpeText: { fontSize: 10, fontWeight: '900' },
    historyWorkout: { fontSize: 18, fontWeight: 'bold' },
    historyTonnage: { fontSize: 13, fontWeight: '900', marginTop: 4 },
});