// src/screens/EvolutionScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { calculateBodyFat } from '../utils/EvolutionCalculators';
import { generateSinglePDF } from '../utils/PdfSingleReport';
import { generateComparePDF } from '../utils/PdfCompareReport';
import { useEvolutionData } from '../hooks/useEvolutionData';
import PerformanceTab from '../components/PerformanceTab';
import BodyTab from '../components/BodyTab';
import AssessmentFormModal from '../components/AssessmentFormModal';
import { authHeaders } from '../utils/authToken';

const { width } = Dimensions.get('window');

export default function EvolutionScreen({ navigation }) {
    const { theme } = useTheme();
    const { loading, setLoading, userData, workoutHistory, assessmentHistory, checkinHistory, currentAge, setCurrentAge, currentGender, setCurrentGender, loadData } = useEvolutionData();

    const [activeTab, setActiveTab] = useState('PERFORMANCE'); 
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [method, setMethod] = useState('BASICO');
    const [customDate, setCustomDate] = useState('');
    const [weight, setWeight] = useState('');
    
    const [measures, setMeasures] = useState({ 
        waist: '', abdomen: '', chestMeasure: '', shoulders: '', hips: '', 
        armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', 
        legRight: '', legLeft: '', calfRight: '', calfLeft: '' 
    });
    
    const [folds, setFolds] = useState({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });

    useFocusEffect( React.useCallback(() => { loadData(); }, [loadData]) );

    const handleDateChange = (text) => {
        let cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
        if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
        setCustomDate(cleaned);
    };

    const resetForm = () => {
        setEditingId(null); setWeight(''); setCustomDate(''); setMethod('BASICO');
        setMeasures({
            waist:'', abdomen:'', chestMeasure: '', shoulders: '', hips: '', 
            armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', 
            legRight: '', legLeft: '', calfRight: '', calfLeft: ''
        });
        setFolds({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setMethod(item.method || 'BASICO');
        setWeight(String(item.weight));
        const d = new Date(item.date);
        setCustomDate(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`);

        if (item.method === 'POLLOCK') {
            setFolds({
                foldChest: item.foldChest ? String(item.foldChest) : '', foldAxillary: item.foldAxillary ? String(item.foldAxillary) : '',
                foldTriceps: item.foldTriceps ? String(item.foldTriceps) : '', foldSubscapular: item.foldSubscapular ? String(item.foldSubscapular) : '',
                foldAbdominal: item.foldAbdominal ? String(item.foldAbdominal) : '', foldSuprailiac: item.foldSuprailiac ? String(item.foldSuprailiac) : '', foldThigh: item.foldThigh ? String(item.foldThigh) : ''
            });
            setMeasures({ 
                waist: item.waist ? String(item.waist) : '', abdomen: item.abdomen ? String(item.abdomen) : '',
                chestMeasure: item.chest ? String(item.chest) : '', shoulders: item.shoulders ? String(item.shoulders) : '', hips: item.hips ? String(item.hips) : '',
                armRight: item.arms ? String(item.arms) : '', armLeft: item.armLeft ? String(item.armLeft) : '',
                forearmRight: item.forearms ? String(item.forearms) : '', forearmLeft: item.forearmLeft ? String(item.forearmLeft) : '',
                legRight: item.thighs ? String(item.thighs) : '', legLeft: item.thighLeft ? String(item.thighLeft) : '',
                calfRight: item.calves ? String(item.calves) : '', calfLeft: item.calfLeft ? String(item.calfLeft) : ''
            });
        } else {
            setMeasures({ waist: item.waist ? String(item.waist) : '', abdomen: item.abdomen ? String(item.abdomen) : '', chestMeasure: '', shoulders: '', hips: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', legRight: '', legLeft: '', calfRight: '', calfLeft: '' });
        }
        setModalVisible(true);
    };

    const handleDelete = (id) => {
        const execDelete = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
                if (res.ok) { loadData(); } else Alert.alert("Erro", "Falha ao excluir.");
            } catch (e) { Alert.alert("Erro", "Erro de conexão."); } 
            finally { setLoading(false); }
        };
        if (Platform.OS === 'web') { if (window.confirm("Tem certeza que deseja excluir esta avaliação?")) execDelete(); } 
        else { Alert.alert("Excluir", "Apagar permanentemente?", [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: execDelete }]); }
    };

    const handleSaveAssessment = async () => {
        if (!weight) return Alert.alert("Erro", "O campo Peso é obrigatório.");
        if (customDate && customDate.length !== 10) return Alert.alert("Erro", "Data inválida (DD/MM/AAAA).");

        let isoDate = new Date().toISOString();
        if (customDate) { const [day, month, year] = customDate.split('/'); isoDate = new Date(`${year}-${month}-${day}T12:00:00`).toISOString(); }
        
        let calculatedBF = null; let cleanFolds = {}; let cleanMeasures = {};

        if (method === 'POLLOCK') {
            if (!currentAge) return Alert.alert("Atenção", "Informe a IDADE para calcular o % de Gordura.");
            Object.keys(folds).forEach(k => cleanFolds[k] = folds[k].replace(',', '.'));
            calculatedBF = calculateBodyFat(currentGender, currentAge, cleanFolds);
            Object.keys(measures).forEach(k => cleanMeasures[k] = measures[k] ? measures[k].replace(',', '.') : null);
        } else {
            cleanMeasures.waist = measures.waist ? measures.waist.replace(',', '.') : null;
            cleanMeasures.abdomen = measures.abdomen ? measures.abdomen.replace(',', '.') : null;
        }

        const payload = {
            userId: userData.id, date: isoDate, weight: weight.replace(',', '.'), method, bodyFat: calculatedBF,
            waist: cleanMeasures.waist, abdomen: cleanMeasures.abdomen, chestMeasure: method === 'POLLOCK' ? cleanMeasures.chestMeasure : null, shoulders: method === 'POLLOCK' ? cleanMeasures.shoulders : null, hips: method === 'POLLOCK' ? cleanMeasures.hips : null, armRight: method === 'POLLOCK' ? cleanMeasures.armRight : null, armLeft: method === 'POLLOCK' ? cleanMeasures.armLeft : null, forearmRight: method === 'POLLOCK' ? cleanMeasures.forearmRight : null, forearmLeft: method === 'POLLOCK' ? cleanMeasures.forearmLeft : null, legRight: method === 'POLLOCK' ? cleanMeasures.legRight : null, legLeft: method === 'POLLOCK' ? cleanMeasures.legLeft : null, calfRight: method === 'POLLOCK' ? cleanMeasures.calfRight : null, calfLeft: method === 'POLLOCK' ? cleanMeasures.calfLeft : null, foldChest: method === 'POLLOCK' ? cleanFolds.foldChest : null, foldAxillary: method === 'POLLOCK' ? cleanFolds.foldAxillary : null, foldTriceps: method === 'POLLOCK' ? cleanFolds.foldTriceps : null, foldSubscapular: method === 'POLLOCK' ? cleanFolds.foldSubscapular : null, foldAbdominal: method === 'POLLOCK' ? cleanFolds.foldAbdominal : null, foldSuprailiac: method === 'POLLOCK' ? cleanFolds.foldSuprailiac : null, foldThigh: method === 'POLLOCK' ? cleanFolds.foldThigh : null,
        };
        if (editingId) payload.id = editingId;

        try {
            const res = await fetch('https://fitos-final.onrender.com/api/assessment', { method: editingId ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json', ...(await authHeaders())}, body: JSON.stringify(payload) });
            const json = await res.json(); 
            if (res.ok) {
                const msg = method === 'POLLOCK' ? `Salvo!\nBF Estimado: ${calculatedBF}%` : `Peso registrado!`;
                if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Sucesso", msg);
                setModalVisible(false); resetForm(); loadData(); 
            } else { Alert.alert("Erro ao Salvar", json.error || "Verifique os dados."); }
        } catch (e) { Alert.alert("Erro de Conexão", e.message); }
    };

    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const RootComponent = isWeb ? View : SafeAreaView;
    const chartWidth = isWeb ? (width > 480 ? 440 : width - 40) : width - 40;
    
    const baseChartConfig = {
        backgroundGradientFrom: theme.surface, backgroundGradientTo: theme.surface, decimalPlaces: 1, 
        labelColor: (opacity = 1) => theme.textSecondary, style: { borderRadius: 16 }, 
        propsForDots: { r: "5", strokeWidth: "3", stroke: theme.surface }, 
        propsForBackgroundLines: { stroke: theme.border, strokeDasharray: "", strokeWidth: 0.5 }, 
        fillShadowGradientOpacity: 0.1, barPercentage: 0.6,
    };

    return (
        <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            
            <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15}}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}><MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} /></TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>PAINEL EVOLUTIVO</Text>
                    </View>
                    <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
                        <TouchableOpacity style={[styles.tabBtn, activeTab === 'PERFORMANCE' && { backgroundColor: theme.accent }]} onPress={() => setActiveTab('PERFORMANCE')}><Text style={[styles.tabText, activeTab === 'PERFORMANCE' ? {color: theme.isDark ? '#000' : '#FFF'} : {color: theme.textSecondary}]}>PERFORMANCE</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.tabBtn, activeTab === 'CORPO' && { backgroundColor: '#32ADE6' }]} onPress={() => setActiveTab('CORPO')}><Text style={[styles.tabText, activeTab === 'CORPO' ? {color: '#FFF'} : {color: theme.textSecondary}]}>CORPO</Text></TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={[styles.scrollArea, isWeb && { overflowY: 'auto' }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                    {loading ? <ActivityIndicator color={theme.accent} style={{marginTop:50}} size="large"/> : 
                        activeTab === 'PERFORMANCE' ? (
                            <PerformanceTab theme={theme} workoutHistory={workoutHistory} chartWidth={chartWidth} baseChartConfig={baseChartConfig} />
                        ) : (
                            <BodyTab theme={theme} userData={userData} checkinHistory={checkinHistory} assessmentHistory={assessmentHistory} 
                                onOpenAssessmentForm={() => { resetForm(); setModalVisible(true); }}
                                onEditAssessment={handleEdit} onDeleteAssessment={handleDelete}
                                onGenerateSinglePDF={generateSinglePDF} onGenerateComparePDF={generateComparePDF}
                                chartWidth={chartWidth} baseChartConfig={baseChartConfig} 
                            />
                        )
                    }
                </ScrollView>
            </View>

            <AssessmentFormModal visible={modalVisible} onClose={() => { setModalVisible(false); resetForm(); }} editingId={editingId} customDate={customDate} handleDateChange={handleDateChange} method={method} setMethod={setMethod} weight={weight} setWeight={setWeight} currentAge={currentAge} setCurrentAge={setCurrentAge} currentGender={currentGender} setCurrentGender={setCurrentGender} folds={folds} setFolds={setFolds} measures={measures} setMeasures={setMeasures} onSave={handleSaveAssessment} theme={theme} isWeb={isWeb} webOuterBg={webOuterBg} />
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
    scrollArea: { flex: 1, width: '100%' },
    header: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    tabContainer: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    tabText: { fontWeight: '900', fontSize: 12 },
    scrollContent: { padding: 20 }
});