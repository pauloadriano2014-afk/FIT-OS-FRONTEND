// src/components/AdminAssessmentTab.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminEvolutionChart from './AdminEvolutionChart';
import AssessmentHistoryCard from './AssessmentHistoryCard';

export default function AdminAssessmentTab({
    theme,
    currentAge,
    currentGender,
    assessmentHistory,
    chartWidth,
    onNewAssessment,
    onOpenDetails,
    onDelete
}) {
    return (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* INFORMAÇÕES BÁSICAS DO ALUNO */}
            <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={styles.infoText}>IDADE: {currentAge || '--'} anos</Text>
                <Text style={styles.infoText}>SEXO: {currentGender}</Text>
            </View>

            {/* BOTÃO DE NOVA AVALIAÇÃO */}
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#4DE38F' }]} onPress={onNewAssessment}>
                <MaterialCommunityIcons name="plus" size={22} color="#000" />
                <Text style={[styles.addBtnText, { color: '#000' }]}>NOVA AVALIAÇÃO</Text>
            </TouchableOpacity>

            {/* GRÁFICO EVOLUTIVO (Modularizado) */}
            <AdminEvolutionChart 
                assessmentHistory={assessmentHistory} 
                theme={theme} 
                chartWidth={chartWidth} 
            />

            {/* HISTÓRICO COMPLETO */}
            <Text style={[styles.sectionTitle, {color: theme.textSecondary}]}>HISTÓRICO COMPLETO</Text>
            {assessmentHistory.slice().reverse().map(item => (
                <AssessmentHistoryCard
                    key={item.id}
                    item={item}
                    theme={theme}
                    onOpenDetails={() => onOpenDetails(item)}
                    onDelete={() => onDelete(item.id)}
                />
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 50 },
    infoBox: { flexDirection:'row', justifyContent:'space-between', padding:15, borderRadius:10, marginBottom:20, borderWidth:1 },
    infoText: { color:'#888', fontSize:12, fontWeight:'bold' },
    addBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', padding:15, borderRadius:10, gap:8, marginBottom:20 },
    addBtnText: { fontWeight:'900', letterSpacing: 0.5 },
    sectionTitle: { fontSize:12, fontWeight:'bold', marginBottom:10, marginTop:10, letterSpacing: 1 },
});