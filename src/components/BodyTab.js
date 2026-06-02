// src/components/BodyTab.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from "react-native-chart-kit";
import { getGoogleDriveDirectDownloadUrl } from '../utils/EvolutionCalculators';

// 🔥 CAMINHO CORRIGIDO: Apontando para a pasta modals 🔥
import AssessmentDetailsModal from '../modals/AssessmentDetailsModal';
import CompareReportModal from './CompareReportModal'; 
import TechnicalReportModal from '../modals/TechnicalReportModal';

export default function BodyTab({ 
    theme, userData, checkinHistory, assessmentHistory, 
    onOpenAssessmentForm, onEditAssessment, onDeleteAssessment, 
    onGenerateSinglePDF, onGenerateComparePDF, chartWidth, baseChartConfig 
}) {
    const [chartMode, setChartMode] = useState('WEIGHT'); 
    const [compareMode, setCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState([]);
    const [compareModalVisible, setCompareModalVisible] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

    const toggleCompare = (id) => {
        if (selectedForCompare.includes(id)) { setSelectedForCompare(prev => prev.filter(itemId => itemId !== id)); } 
        else {
            if (selectedForCompare.length >= 3) { Alert.alert("Limite", "Selecione no máximo 3 avaliações."); return; }
            setSelectedForCompare(prev => [...prev, id]);
        }
    };

    const openDetails = (item) => { setSelectedAssessment(item); setDetailsVisible(true); };
    const openFeedbackModal = (checkin) => { setSelectedFeedback(checkin); setFeedbackModalVisible(true); };

    const sortedAssessments = [...assessmentHistory].sort((a,b) => new Date(a.date) - new Date(b.date));
    const lastAssessments = sortedAssessments.slice(-6); 
    
    let bodyChartData = { labels: ['-'], datasets: [{ data: [0] }] };
    let chartSuffix = "";
    let isBarChart = false;
    let activeChartColor = `rgba(77, 227, 143, 1)`;

    if (lastAssessments.length > 1) {
        bodyChartData.labels = lastAssessments.map(a => { const d = new Date(a.date); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; });
        if (chartMode === 'WEIGHT') {
            activeChartColor = `rgba(77, 227, 143, 1)`;
            bodyChartData.datasets = [{ data: lastAssessments.map(a => a.weight || 0), color: (opacity=1)=> `rgba(77, 227, 143, ${opacity})`, strokeWidth: 3 }];
            chartSuffix = "kg";
        } else if (chartMode === 'BF') {
            activeChartColor = `rgba(255, 59, 48, 1)`;
            bodyChartData.datasets = [{ data: lastAssessments.map(a => a.bodyFat || 0), color: (opacity=1)=> `rgba(255, 59, 48, ${opacity})`, strokeWidth: 3 }];
            chartSuffix = "%";
        } else if (chartMode === 'LEAN_MASS') {
            activeChartColor = `rgba(255, 149, 0, 1)`;
            bodyChartData.datasets = [{ data: lastAssessments.map(a => (a.weight && a.bodyFat) ? parseFloat((a.weight * (1 - a.bodyFat/100)).toFixed(1)) : 0), color: (opacity=1)=> `rgba(255, 149, 0, ${opacity})`, strokeWidth: 3 }];
            chartSuffix = "kg";
        } else if (chartMode === 'FOLDS') {
            isBarChart = true;
            activeChartColor = `rgba(52, 199, 89, 1)`;
            bodyChartData.datasets = [{ data: lastAssessments.map(a => (a.foldChest ? (a.foldChest + a.foldAxillary + a.foldTriceps + a.foldSubscapular + a.foldAbdominal + a.foldSuprailiac + a.foldThigh) : 0)) }];
            chartSuffix = "mm";
        }
    }

    const dynamicChartConfig = { ...baseChartConfig, color: (opacity = 1) => activeChartColor };

    return (
        <View>
            {userData?.evaluationUrl ? (
                <TouchableOpacity style={[styles.pdfAssessmentBtn, { backgroundColor: theme.surface, borderColor: theme.accent, borderWidth: 1 }]} onPress={() => Linking.openURL(getGoogleDriveDirectDownloadUrl(userData.evaluationUrl))}>
                    <MaterialCommunityIcons name="file-pdf-box" size={32} color={theme.accent} />
                    <View style={{flex: 1, marginLeft: 15}}><Text style={[styles.pdfAssessmentTitle, { color: theme.text }]}>MINHA AVALIAÇÃO FÍSICA</Text><Text style={[styles.pdfAssessmentSub, { color: theme.textSecondary }]}>Toque para visualizar ou baixar (PDF)</Text></View>
                    <MaterialCommunityIcons name="download" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
            ) : null}

            {checkinHistory.length > 0 && (
                <View style={{ marginBottom: 25 }}>
                    <Text style={[styles.sectionTitle, {color: theme.accent, marginBottom: 10, marginTop: 0}]}>AVALIAÇÕES DO COACH</Text>
                    {checkinHistory.map((checkin) => (
                            <TouchableOpacity 
                                key={checkin.id} 
                                style={[styles.feedbackListCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={async () => {
                                    await AsyncStorage.setItem(`read_feedback_${checkin.id}`, 'true');
                                    openFeedbackModal(checkin);
                                }}
                            >
                                <View style={[styles.feedbackListIcon, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="clipboard-text-search" size={20} color={theme.accent} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.feedbackListTitle, { color: theme.text }]}>Relatório Técnico</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>Enviado em {new Date(checkin.date || checkin.createdAt).toLocaleDateString('pt-BR')}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} style={{marginLeft: 10}} />
                            </TouchableOpacity>
                    ))}
                </View>
            )}

            <TouchableOpacity style={[styles.newAssessmentBtn, { backgroundColor: '#4DE38F' }]} onPress={onOpenAssessmentForm}>
                <MaterialCommunityIcons name="plus-circle" size={24} color={'#000'} />
                <Text style={[styles.newAssessmentText, { color: '#000' }]}>REGISTRAR MEDIDAS / POLLOCK</Text>
            </TouchableOpacity>

            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor:'#4DE38F' }]}><MaterialCommunityIcons name="scale-bathroom" size={24} color="#4DE38F" /><Text style={[styles.statValue, { color: theme.text }]}>{assessmentHistory[assessmentHistory.length-1]?.weight || '--'}kg</Text><Text style={[styles.statLabel, {color:'#4DE38F'}]}>PESO ATUAL</Text></View>
                <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor:'#4DE38F' }]}><MaterialCommunityIcons name="percent" size={24} color="#4DE38F" /><Text style={[styles.statValue, { color: theme.text }]}>{assessmentHistory[assessmentHistory.length-1]?.bodyFat || '--'}%</Text><Text style={[styles.statLabel, {color:'#4DE38F'}]}>GORDURA (BF)</Text></View>
            </View>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}><Text style={[styles.sectionTitle, {color:'#4DE38F', marginBottom: 0, marginTop: 0}]}>GRÁFICO</Text></View>
            <View style={{flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: theme.border, marginBottom: 15}}>
                <TouchableOpacity onPress={() => setChartMode('WEIGHT')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'WEIGHT' ? '#4DE38F' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'WEIGHT' ? '#000' : theme.textSecondary}}>PESO</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setChartMode('BF')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'BF' ? '#FF3B30' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'BF' ? '#FFF' : theme.textSecondary}}>GORDURA</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setChartMode('LEAN_MASS')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'LEAN_MASS' ? '#FF9500' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'LEAN_MASS' ? '#FFF' : theme.textSecondary}}>M. MAGRA</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setChartMode('FOLDS')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'FOLDS' ? '#34C759' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'FOLDS' ? '#FFF' : theme.textSecondary}}>DOBRAS</Text></TouchableOpacity>
            </View>

            {assessmentHistory.length > 1 ? (
                <View style={{backgroundColor: theme.surface, borderRadius: 16, paddingTop: 15, paddingRight: 10, borderWidth: 1, borderColor: theme.border}}>
                    {isBarChart ? (
                        <BarChart data={bodyChartData} width={chartWidth} height={220} chartConfig={{...dynamicChartConfig, color: (opacity=1)=> `rgba(52, 199, 89, ${opacity})`}} style={styles.chart} yAxisSuffix={chartSuffix} showBarTops={true} withInnerLines={true} />
                    ) : (
                        <LineChart data={bodyChartData} width={chartWidth} height={220} chartConfig={dynamicChartConfig} bezier style={styles.chart} yAxisSuffix={chartSuffix} withVerticalLines={false} />
                    )}
                </View>
            ) : (
                <View style={[styles.emptyChart, { backgroundColor: theme.surface, borderColor:'#4DE38F' }]}><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Registre 2 avaliações para ver o gráfico.</Text></View>
            )}

            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 15}}>
                <Text style={[styles.sectionTitle, {color:'#4DE38F', marginTop: 0, marginBottom: 0}]}>HISTÓRICO</Text>
                {!compareMode ? (
                    <TouchableOpacity onPress={() => {setCompareMode(true); setSelectedForCompare([]);}} style={{flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#4DE38F22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8}}>
                        <MaterialCommunityIcons name="scale-balance" size={16} color="#4DE38F" /><Text style={{color: '#4DE38F', fontSize: 11, fontWeight: 'bold'}}>COMPARAR</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{flexDirection: 'row', gap: 10}}>
                        <TouchableOpacity onPress={() => setCompareMode(false)} style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border}}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>CANCELAR</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => { if(selectedForCompare.length < 2) return Alert.alert("Atenção", "Selecione de 2 a 3 avaliações."); setCompareModalVisible(true); }} style={{backgroundColor: selectedForCompare.length >= 2 ? '#4DE38F' : theme.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8}}>
                            <Text style={{color: selectedForCompare.length >= 2 ? '#000' : theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>GERAR ({selectedForCompare.length}/3)</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {sortedAssessments.slice().reverse().map((item) => {
                const isSelected = selectedForCompare.includes(item.id);
                return (
                    <TouchableOpacity key={item.id} style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: compareMode && isSelected ? '#4DE38F' : theme.border }]} onPress={() => { if(compareMode) toggleCompare(item.id); else openDetails(item); }}>
                        <View style={styles.historyHeader}>
                            <View>
                                <Text style={[styles.historyDate, { color: theme.text }]}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                                <Text style={{color: theme.textSecondary, fontSize:10, fontWeight:'bold', marginTop: 2}}>{item.method === 'POLLOCK' ? 'POLLOCK 7' : 'BÁSICO'}</Text>
                            </View>
                            {compareMode ? <MaterialCommunityIcons name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={24} color={isSelected ? "#4DE38F" : theme.textSecondary} /> : <MaterialCommunityIcons name="eye-outline" size={20} color="#4DE38F" />}
                        </View>
                        <View style={{flexDirection:'row', gap:15, marginTop:5}}>
                            <Text style={{color: theme.text, fontWeight:'bold'}}>Peso: {item.weight}kg</Text>
                            {item.bodyFat && <Text style={{color:'#4DE38F', fontWeight:'bold'}}>BF: {item.bodyFat}%</Text>}
                        </View>
                    </TouchableOpacity>
                )
            })}

            <AssessmentDetailsModal visible={detailsVisible} assessment={selectedAssessment} onClose={() => setDetailsVisible(false)} onGeneratePDF={() => onGenerateSinglePDF(selectedAssessment, userData)} onEdit={() => { setDetailsVisible(false); onEditAssessment(selectedAssessment); }} onDelete={() => { setDetailsVisible(false); onDeleteAssessment(selectedAssessment?.id); }} theme={theme} />
            <CompareReportModal visible={compareModalVisible} onClose={() => setCompareModalVisible(false)} selectedData={assessmentHistory.filter(a => selectedForCompare.includes(a.id))} onGeneratePDF={() => onGenerateComparePDF(assessmentHistory.filter(a => selectedForCompare.includes(a.id)), userData)} theme={theme} isAdmin={false} />
            <TechnicalReportModal visible={feedbackModalVisible} onClose={() => setFeedbackModalVisible(false)} selectedFeedback={selectedFeedback} userData={userData} />
        </View>
    );
}

const styles = StyleSheet.create({
    pdfAssessmentBtn: { flexDirection: 'row', padding: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, elevation: 4 },
    pdfAssessmentTitle: { fontWeight: '900', fontSize: 15 },
    pdfAssessmentSub: { fontSize: 11, marginTop: 2 },
    feedbackListCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
    feedbackListIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    feedbackListTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
    newAssessmentBtn: { flexDirection: 'row', padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 25 },
    newAssessmentText: { fontWeight: '900', fontSize: 14 },
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
    historyDate: { fontSize: 11, fontWeight: '900' }
});