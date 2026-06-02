// src/components/AdminEvolutionChart.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LineChart } from "react-native-chart-kit";

export default function AdminEvolutionChart({ assessmentHistory, theme, chartWidth }) {
    const [chartMode, setChartMode] = useState('WEIGHT');
    const [selectedMeasureChart, setSelectedMeasureChart] = useState('waist');

    if (!assessmentHistory || assessmentHistory.length <= 1) return null;

    // 🔥 LÓGICA DE DADOS DO GRÁFICO (COM PERIMETRIA COMPLETA) 🔥
    const sortedAssessments = [...assessmentHistory].sort((a,b) => new Date(a.date) - new Date(b.date));
    const lastAssessments = sortedAssessments.slice(-6); 

    let bodyChartData = { labels: ['-'], datasets: [{ data: [0] }] };
    let chartSuffix = "";
    let activeChartColor = `rgba(77, 227, 143, 1)`;

    bodyChartData.labels = lastAssessments.map(a => { 
        const d = new Date(a.date); 
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; 
    });
    
    if (chartMode === 'WEIGHT') {
        activeChartColor = `rgba(77, 227, 143, 1)`;
        bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.weight) || 0), color: (opacity=1)=> `rgba(77, 227, 143, ${opacity})`, strokeWidth: 3 }];
        chartSuffix = "kg";
    } else if (chartMode === 'BF') {
        activeChartColor = `rgba(255, 59, 48, 1)`;
        bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.bodyFat) || 0), color: (opacity=1)=> `rgba(255, 59, 48, ${opacity})`, strokeWidth: 3 }];
        chartSuffix = "%";
    } else if (chartMode === 'MEASURES') {
        activeChartColor = `rgba(188, 82, 235, 1)`; // Roxo para perimetria
        chartSuffix = "cm";
        
        // Mapeado exatamente com os nomes do Prisma
        if (selectedMeasureChart === 'waist') bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.waist) || 0) }];
        else if (selectedMeasureChart === 'abdomen') bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.abdomen) || 0) }];
        else if (selectedMeasureChart === 'chest') bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.chest) || 0) }];
        else if (selectedMeasureChart === 'hips') bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.hips) || 0) }];
        else if (selectedMeasureChart === 'arms') bodyChartData.datasets = [
            { data: lastAssessments.map(a => Number(a.arms) || 0), color: (opacity=1)=> `rgba(188, 82, 235, ${opacity})` },
            { data: lastAssessments.map(a => Number(a.armLeft) || 0), color: (opacity=1)=> `rgba(255, 149, 0, ${opacity})` } 
        ];
        else if (selectedMeasureChart === 'thighs') bodyChartData.datasets = [
            { data: lastAssessments.map(a => Number(a.thighs) || 0), color: (opacity=1)=> `rgba(188, 82, 235, ${opacity})` },
            { data: lastAssessments.map(a => Number(a.thighLeft) || 0), color: (opacity=1)=> `rgba(255, 149, 0, ${opacity})` }
        ];
    }

    const baseChartConfig = {
        backgroundGradientFrom: theme.surface, backgroundGradientTo: theme.surface, decimalPlaces: 1, 
        color: (opacity = 1) => activeChartColor, labelColor: (opacity = 1) => theme.textSecondary, 
        style: { borderRadius: 16 }, propsForDots: { r: "5", strokeWidth: "3", stroke: theme.surface }, 
        propsForBackgroundLines: { stroke: theme.border, strokeDasharray: "", strokeWidth: 0.5 }, 
        fillShadowGradientOpacity: 0.1, barPercentage: 0.6,
    };

    return (
        <View style={{ marginVertical: 20 }}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                <Text style={[styles.sectionTitle, {color: theme.accent}]}>GRÁFICO EVOLUTIVO</Text>
            </View>
            
            <View style={[styles.chartSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TouchableOpacity onPress={() => setChartMode('WEIGHT')} style={[styles.chartBtn, chartMode === 'WEIGHT' && {backgroundColor: '#4DE38F'}]}>
                    <Text style={[styles.chartBtnText, {color: chartMode === 'WEIGHT' ? '#000' : theme.textSecondary}]}>PESO</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setChartMode('BF')} style={[styles.chartBtn, chartMode === 'BF' && {backgroundColor: '#FF3B30'}]}>
                    <Text style={[styles.chartBtnText, {color: chartMode === 'BF' ? '#FFF' : theme.textSecondary}]}>GORDURA</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setChartMode('MEASURES')} style={[styles.chartBtn, chartMode === 'MEASURES' && {backgroundColor: '#BF5AF2'}]}>
                    <Text style={[styles.chartBtnText, {color: chartMode === 'MEASURES' ? '#FFF' : theme.textSecondary}]}>MEDIDAS</Text>
                </TouchableOpacity>
            </View>

            {chartMode === 'MEASURES' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.measurePillContainer}>
                    {['waist', 'abdomen', 'chest', 'hips', 'arms', 'thighs'].map((measure) => {
                        const labels = { waist: 'Cintura', abdomen: 'Abdômen', chest: 'Tórax', hips: 'Glúteos', arms: 'Braços', thighs: 'Pernas' };
                        const isSelected = selectedMeasureChart === measure;
                        return (
                            <TouchableOpacity key={measure} onPress={() => setSelectedMeasureChart(measure)} style={[styles.measurePill, { borderColor: theme.border }, isSelected && {backgroundColor: '#BF5AF2', borderColor: '#BF5AF2'}]}>
                                <Text style={[styles.measurePillText, {color: isSelected ? '#FFF' : theme.textSecondary}]}>{labels[measure]}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            <View style={[styles.chartWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <LineChart data={bodyChartData} width={chartWidth} height={200} chartConfig={baseChartConfig} bezier style={{borderRadius: 16}} yAxisSuffix={chartSuffix} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 0, marginTop: 0 },
    chartSelector: { flexDirection: 'row', borderRadius: 8, padding: 4, borderWidth: 1, marginBottom: 15 },
    chartBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6, backgroundColor: 'transparent' },
    chartBtnText: { fontSize: 9, fontWeight: 'bold' },
    measurePillContainer: { gap: 10, paddingBottom: 15, marginTop: -5 },
    measurePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    measurePillText: { fontSize: 10, fontWeight: '800' },
    chartWrapper: { borderRadius: 16, paddingTop: 15, paddingRight: 10, borderWidth: 1 }
});