// src/screens/EvolutionScreen.js
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Alert, Platform, StatusBar, Linking 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from "react-native-chart-kit";
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/* 🔥 IMPORTAÇÃO DO TEMA E DOS NOVOS MÓDULOS */
import { useTheme } from '../contexts/ThemeContext';
import { calculateBodyFat, getAgeFromDate, getGoogleDrivePreviewUrl } from '../utils/EvolutionCalculators';
import AssessmentFormModal from '../components/AssessmentFormModal';
import AssessmentDetailsModal from '../components/AssessmentDetailsModal';
import CompareReportModal from '../components/CompareReportModal';

const { width } = Dimensions.get('window');

export default function EvolutionScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('PERFORMANCE'); 
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const { theme } = useTheme();

  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  const [chartMode, setChartMode] = useState('WEIGHT'); 

  const [method, setMethod] = useState('BASICO');
  const [customDate, setCustomDate] = useState('');
  const [weight, setWeight] = useState('');
  const [currentAge, setCurrentAge] = useState('');
  const [currentGender, setCurrentGender] = useState('MASCULINO'); 
  const [measures, setMeasures] = useState({ waist: '', abdomen: '' });
  const [folds, setFolds] = useState({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });

  useFocusEffect(
    React.useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedUser) {
          const user = JSON.parse(storedUser);
          
          const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user/${user.id}?t=${Date.now()}`);
          if (resUser.ok) {
              const freshUser = await resUser.json();
              const serverUrl = freshUser.evaluationUrl || freshUser.user?.evaluationUrl || null;
              const updatedUser = { ...user, evaluationUrl: serverUrl };
              setUserData(updatedUser);
              
              if (updatedUser.birthDate) setCurrentAge(getAgeFromDate(updatedUser.birthDate));
              if (updatedUser.gender) setCurrentGender(updatedUser.gender.toUpperCase());
          } else {
              setUserData(user);
              if (user.birthDate) setCurrentAge(getAgeFromDate(user.birthDate));
              if (user.gender) setCurrentGender(user.gender.toUpperCase());
          }
          
          const resAssess = await fetch(`https://fitos-final.onrender.com/api/assessment?userId=${user.id}`);
          const assessments = await resAssess.json();
          if (Array.isArray(assessments)) setAssessmentHistory(assessments);

          const resHistory = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${user.id}&t=${Date.now()}`);
          const historyData = await resHistory.json();
          
          if (Array.isArray(historyData)) {
              const processedHistory = historyData.map(treino => {
                  let totalVol = 0;
                  if (treino.details) {
                      treino.details.forEach(ex => {
                          totalVol += (parseFloat(ex.weight) || 0) * (parseFloat(ex.reps) || 0);
                      });
                  }
                  return {
                      ...treino,
                      tonnage: totalVol,
                      dateFormatted: new Date(treino.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})
                  };
              });
              setWorkoutHistory(processedHistory);
          }
      }
    } catch (e) { console.log(e); } 
    finally { setLoading(false); }
  };

  const handleDateChange = (text) => {
      let cleaned = text.replace(/[^0-9]/g, '');
      if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
      if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
      if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
      setCustomDate(cleaned);
  };

  const resetForm = () => {
      setEditingId(null); setWeight(''); setCustomDate(''); setMethod('BASICO');
      setMeasures({waist:'', abdomen:''});
      setFolds({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });
  };

  const handleEdit = (item) => {
      setDetailsVisible(false);
      setEditingId(item.id);
      setMethod(item.method || 'BASICO');
      setWeight(String(item.weight));
      
      const d = new Date(item.date);
      setCustomDate(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`);

      if (item.method === 'POLLOCK') {
          setFolds({
              foldChest: item.foldChest ? String(item.foldChest) : '',
              foldAxillary: item.foldAxillary ? String(item.foldAxillary) : '',
              foldTriceps: item.foldTriceps ? String(item.foldTriceps) : '',
              foldSubscapular: item.foldSubscapular ? String(item.foldSubscapular) : '',
              foldAbdominal: item.foldAbdominal ? String(item.foldAbdominal) : '',
              foldSuprailiac: item.foldSuprailiac ? String(item.foldSuprailiac) : '',
              foldThigh: item.foldThigh ? String(item.foldThigh) : ''
          });
      } else {
          setMeasures({
              waist: item.waist ? String(item.waist) : '',
              abdomen: item.abdomen ? String(item.abdomen) : ''
          });
      }
      setModalVisible(true);
  };

  const handleDelete = (id) => {
      const execDelete = async () => {
          setLoading(true);
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE' });
              if (res.ok) { setDetailsVisible(false); loadData(); } 
              else Alert.alert("Erro", "Falha ao excluir.");
          } catch (e) { Alert.alert("Erro", "Erro de conexão."); } 
          finally { setLoading(false); }
      };

      if (Platform.OS === 'web') {
          if (window.confirm("Tem certeza que deseja excluir esta avaliação?")) execDelete();
      } else {
          Alert.alert("Excluir", "Apagar permanentemente?", [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: execDelete }]);
      }
  };

  const handleSaveAssessment = async () => {
      if (!weight) return Alert.alert("Erro", "O campo Peso é obrigatório.");
      if (customDate && customDate.length !== 10) return Alert.alert("Erro", "Data inválida (DD/MM/AAAA).");

      let isoDate = new Date().toISOString();
      if (customDate) {
          const [day, month, year] = customDate.split('/');
          isoDate = new Date(`${year}-${month}-${day}T12:00:00`).toISOString();
      }
      
      let calculatedBF = null;
      let cleanFolds = {};

      if (method === 'POLLOCK') {
          if (!currentAge) return Alert.alert("Atenção", "Informe a IDADE para calcular o % de Gordura.");
          Object.keys(folds).forEach(k => cleanFolds[k] = folds[k].replace(',', '.'));
          calculatedBF = calculateBodyFat(currentGender, currentAge, cleanFolds);
      }

      const payload = {
          userId: userData.id, date: isoDate, weight: weight.replace(',', '.'), method, bodyFat: calculatedBF,
          waist: method === 'BASICO' ? measures.waist.replace(',', '.') : null,
          abdomen: method === 'BASICO' ? measures.abdomen.replace(',', '.') : null,
          foldChest: method === 'POLLOCK' ? cleanFolds.foldChest : null,
          foldAxillary: method === 'POLLOCK' ? cleanFolds.foldAxillary : null,
          foldTriceps: method === 'POLLOCK' ? cleanFolds.foldTriceps : null,
          foldSubscapular: method === 'POLLOCK' ? cleanFolds.foldSubscapular : null,
          foldAbdominal: method === 'POLLOCK' ? cleanFolds.foldAbdominal : null,
          foldSuprailiac: method === 'POLLOCK' ? cleanFolds.foldSuprailiac : null,
          foldThigh: method === 'POLLOCK' ? cleanFolds.foldThigh : null,
      };

      if (editingId) payload.id = editingId;

      try {
          const res = await fetch('https://fitos-final.onrender.com/api/assessment', {
              method: editingId ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
          });
          const json = await res.json(); 

          if (res.ok) {
              const msg = method === 'POLLOCK' ? `Salvo!\nBF Estimado: ${calculatedBF}%` : `Peso registrado!`;
              if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Sucesso", msg);
              setModalVisible(false); resetForm(); loadData(); 
          } else {
              Alert.alert("Erro ao Salvar", json.error || "Verifique os dados.");
          }
      } catch (e) { Alert.alert("Erro de Conexão", e.message); }
  };

  const openDetails = (item) => { setSelectedAssessment(item); setDetailsVisible(true); };

  const processAndSharePDF = async (htmlContent, title) => {
      try {
          const finalHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; background-color: #fff; margin: 0; }.header { border-bottom: 4px solid #32ADE6; padding-bottom: 20px; margin-bottom: 30px; }.title { font-size: 32px; font-weight: 900; color: #32ADE6; text-transform: uppercase; }.subtitle { font-size: 16px; color: #666; margin-top: 5px; }.card-container { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 30px; }.card { background: #f8f9fa; border: 1px solid #e5e5ea; padding: 20px; border-radius: 12px; flex: 1; min-width: 150px; text-align: center; }.card-title { font-size: 12px; color: #888; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }.card-val { font-size: 28px; font-weight: 900; color: #111; }.highlight { color: #32ADE6; }.table-wrap { margin-top: 30px; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5ea; }table { width: 100%; border-collapse: collapse; }th, td { padding: 15px; text-align: center; border-bottom: 1px solid #eee; }th { background-color: #f4f5f7; color: #555; font-size: 12px; font-weight: 700; text-transform: uppercase; }td { font-size: 15px; font-weight: 700; color: #333; }.label-left { text-align: left; }.footer { margin-top: 50px; text-align: center; font-size: 12px; color: #aaa; padding-top: 20px; border-top: 1px solid #eee; }.text-green { color: #34C759; font-weight: 900; }.text-red { color: #FF3B30; font-weight: 900; }.text-neutral { color: #888; font-weight: 700; }</style></head><body>${htmlContent}<div class="footer">Laudo gerado via Aplicativo Oficial do Treinador</div></body></html>`;
          if (Platform.OS === 'web') { await Print.printAsync({ html: finalHtml }); } 
          else {
              const { uri } = await Print.printToFileAsync({ html: finalHtml });
              if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: title }); }
          }
      } catch (e) { if (Platform.OS !== 'web') Alert.alert("Erro", "Não foi possível gerar o PDF."); }
  };

  const generateSinglePDF = (assessment) => {
      const d = new Date(assessment.date).toLocaleDateString('pt-BR');
      const leanMass = assessment.bodyFat ? (assessment.weight * (1 - assessment.bodyFat / 100)).toFixed(1) : '--';
      const sum = (assessment.foldChest||0) + (assessment.foldAxillary||0) + (assessment.foldTriceps||0) + (assessment.foldSubscapular||0) + (assessment.foldAbdominal||0) + (assessment.foldSuprailiac||0) + (assessment.foldThigh||0);
      let html = `<div class="header"><div class="title">Avaliação Física</div><div class="subtitle">Aluno(a): <strong>${userData?.name || 'Aluno'}</strong> &nbsp;|&nbsp; Data: <strong>${d}</strong></div></div><div class="card-container"><div class="card"><div class="card-title">Peso Atual</div><div class="card-val">${assessment.weight}kg</div></div><div class="card"><div class="card-title">Gordura (BF)</div><div class="card-val highlight">${assessment.bodyFat ? assessment.bodyFat+'%' : '--'}</div></div><div class="card"><div class="card-title">Massa Magra</div><div class="card-val">${leanMass}kg</div></div></div>`;
      if (assessment.method === 'POLLOCK') {
          html += `<h3 style="color: #32ADE6; font-size: 16px; margin-bottom: 10px;">DOBRAS CUTÂNEAS (mm)</h3><div class="table-wrap"><table><tr><th>Peitoral</th><th>Axilar</th><th>Tríceps</th><th>Subescapular</th></tr><tr><td>${assessment.foldChest || '-'}</td><td>${assessment.foldAxillary || '-'}</td><td>${assessment.foldTriceps || '-'}</td><td>${assessment.foldSubscapular || '-'}</td></tr><tr><th>Abdominal</th><th>Supra-ilíaca</th><th>Coxa</th><th style="color:#32ADE6">SOMA TOTAL</th></tr><tr><td>${assessment.foldAbdominal || '-'}</td><td>${assessment.foldSuprailiac || '-'}</td><td>${assessment.foldThigh || '-'}</td><td style="color:#32ADE6">${sum > 0 ? sum.toFixed(1) : '-'}</td></tr></table></div>`;
      }
      if (assessment.waist || assessment.abdomen) {
          html += `<h3 style="color: #32ADE6; font-size: 16px; margin-top: 30px; margin-bottom: 10px;">MEDIDAS (cm)</h3><div class="table-wrap"><table><tr>${assessment.waist ? '<th>Cintura</th>' : ''}${assessment.abdomen ? '<th>Abdômen</th>' : ''}</tr><tr>${assessment.waist ? `<td>${assessment.waist}</td>` : ''}${assessment.abdomen ? `<td>${assessment.abdomen}</td>` : ''}</tr></table></div>`;
      }
      processAndSharePDF(html, 'Avaliacao_Fisica');
  };

  const generateComparePDF = () => {
      const selectedData = assessmentHistory.filter(a => selectedForCompare.includes(a.id)).sort((a, b) => new Date(a.date) - new Date(b.date)); 
      if (selectedData.length < 2) return;

      const getVal = (ass, key) => {
          if (key === 'leanMass') return ass.weight && ass.bodyFat ? (ass.weight * (1 - ass.bodyFat/100)).toFixed(1) : null;
          if (key === 'foldSum') return ass.foldChest ? (ass.foldChest + ass.foldAxillary + ass.foldTriceps + ass.foldSubscapular + ass.foldAbdominal + ass.foldSuprailiac + ass.foldThigh).toFixed(1) : null;
          return ass[key];
      };

      const renderTableRow = (label, key, isPercentage = false, isInvertedLogic = false) => {
          const hasData = selectedData.some(ass => getVal(ass, key) != null);
          if (!hasData) return '';
          const oldestVal = parseFloat(getVal(selectedData[0], key));
          const newestVal = parseFloat(getVal(selectedData[selectedData.length - 1], key));
          let deltaHtml = '<td class="text-neutral">-</td>';
          if (!isNaN(oldestVal) && !isNaN(newestVal)) {
              const diff = (newestVal - oldestVal).toFixed(1);
              if (diff > 0) deltaHtml = `<td class="${isInvertedLogic ? 'text-green' : 'text-red'}">+${diff}</td>`;
              else if (diff < 0) deltaHtml = `<td class="${isInvertedLogic ? 'text-red' : 'text-green'}">${diff}</td>`;
              else deltaHtml = `<td class="text-neutral">0</td>`;
          }
          let cols = selectedData.map(ass => `<td>${getVal(ass, key) != null ? `${getVal(ass, key)}${isPercentage?'%':''}` : '-'}</td>`).join('');
          return `<tr><td class="label-left">${label}</td>${cols}${deltaHtml}</tr>`;
      };

      const headerCols = selectedData.map(ass => `<th>${new Date(ass.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</th>`).join('');
      let html = `<div class="header"><div class="title">Relatório de Evolução</div><div class="subtitle">Comparativo de Progresso &nbsp;|&nbsp; Aluno(a): <strong>${userData?.name || 'Aluno'}</strong></div></div><div class="table-wrap"><table><tr><th class="label-left">MÉTRICA</th>${headerCols}<th style="color:#32ADE6">DELTA</th></tr>${renderTableRow('Peso (kg)', 'weight')}${renderTableRow('Gordura (BF)', 'bodyFat', true, false)}${renderTableRow('Massa Magra', 'leanMass', false, true)}${renderTableRow('Soma Dobras (mm)', 'foldSum')}${renderTableRow('Peitoral', 'foldChest')}${renderTableRow('Axilar', 'foldAxillary')}${renderTableRow('Tríceps', 'foldTriceps')}${renderTableRow('Subescapular', 'foldSubscapular')}${renderTableRow('Abdominal', 'foldAbdominal')}${renderTableRow('Supra-ilíaca', 'foldSuprailiac')}${renderTableRow('Coxa', 'foldThigh')}</table></div>`;
      processAndSharePDF(html, 'Comparativo_Evolucao');
  };

  const toggleCompare = (id) => {
      if (selectedForCompare.includes(id)) { setSelectedForCompare(prev => prev.filter(itemId => itemId !== id)); } 
      else {
          if (selectedForCompare.length >= 3) { Alert.alert("Limite", "Selecione no máximo 3 avaliações."); return; }
          setSelectedForCompare(prev => [...prev, id]);
      }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;
  const chartWidth = isWeb ? (width > 480 ? 440 : width - 40) : width - 40;
  
  const totalTonnage = workoutHistory.reduce((acc, curr) => acc + (curr.tonnage || 0), 0);
  const chartWorkouts = [...workoutHistory].reverse().slice(-6); 
  
  const performanceChartData = {
    labels: chartWorkouts.map(h => h.dateFormatted || '?'),
    datasets: [{ data: chartWorkouts.length > 0 ? chartWorkouts.map(h => h.tonnage / 1000) : [0], color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`, strokeWidth: 3 }]
  };

  const sortedAssessments = [...assessmentHistory].sort((a,b) => new Date(a.date) - new Date(b.date));
  const lastAssessments = sortedAssessments.slice(-6); 
  
  let bodyChartData = { labels: ['-'], datasets: [{ data: [0] }] };
  let chartSuffix = "";
  let isBarChart = false;
  let activeChartColor = `rgba(50, 173, 230, 1)`;

  if (lastAssessments.length > 1) {
      bodyChartData.labels = lastAssessments.map(a => { const d = new Date(a.date); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; });
      if (chartMode === 'WEIGHT') {
          activeChartColor = `rgba(50, 173, 230, 1)`;
          bodyChartData.datasets = [{ data: lastAssessments.map(a => a.weight || 0), color: (opacity=1)=> `rgba(50, 173, 230, ${opacity})`, strokeWidth: 3 }];
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

  const baseChartConfig = {
      backgroundGradientFrom: theme.surface, backgroundGradientTo: theme.surface, decimalPlaces: 1, 
      color: (opacity = 1) => activeChartColor, labelColor: (opacity = 1) => theme.textSecondary, 
      style: { borderRadius: 16 }, propsForDots: { r: "5", strokeWidth: "3", stroke: theme.surface }, 
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
              <>
                  <View style={styles.statsRow}>
                      <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><MaterialCommunityIcons name="weight-lifter" size={24} color={theme.accent} /><Text style={[styles.statValue, { color: theme.text }]}>{(totalTonnage / 1000).toFixed(1)}t</Text><Text style={[styles.statLabel, { color: theme.textSecondary }]}>VOLUME TOTAL</Text></View>
                      <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><MaterialCommunityIcons name="fire" size={24} color="#FF3B30" /><Text style={[styles.statValue, { color: theme.text }]}>{workoutHistory.length}</Text><Text style={[styles.statLabel, { color: theme.textSecondary }]}>TREINOS</Text></View>
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
              </>
          ) : (
              <>
                  {userData?.evaluationUrl ? (
                      <TouchableOpacity style={[styles.pdfAssessmentBtn, { backgroundColor: theme.surface, borderColor: theme.accent, borderWidth: 1 }]} onPress={() => Linking.openURL(userData.evaluationUrl)}>
                          <MaterialCommunityIcons name="file-pdf-box" size={32} color={theme.accent} />
                          <View style={{flex: 1, marginLeft: 15}}><Text style={[styles.pdfAssessmentTitle, { color: theme.text }]}>MINHA AVALIAÇÃO FÍSICA</Text><Text style={[styles.pdfAssessmentSub, { color: theme.textSecondary }]}>Toque para visualizar ou baixar</Text></View>
                          <MaterialCommunityIcons name="download" size={24} color={theme.textSecondary} />
                      </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity style={[styles.newAssessmentBtn, { backgroundColor: '#32ADE6' }]} onPress={() => { resetForm(); setModalVisible(true); }}>
                      <MaterialCommunityIcons name="plus-circle" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                      <Text style={[styles.newAssessmentText, { color: theme.isDark ? '#000' : '#FFF' }]}>REGISTRAR MEDIDAS / POLLOCK</Text>
                  </TouchableOpacity>

                  <View style={styles.statsRow}>
                      <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor:'#32ADE6' }]}><MaterialCommunityIcons name="scale-bathroom" size={24} color="#32ADE6" /><Text style={[styles.statValue, { color: theme.text }]}>{assessmentHistory[assessmentHistory.length-1]?.weight || '--'}kg</Text><Text style={[styles.statLabel, {color:'#32ADE6'}]}>PESO ATUAL</Text></View>
                      <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor:'#32ADE6' }]}><MaterialCommunityIcons name="percent" size={24} color="#32ADE6" /><Text style={[styles.statValue, { color: theme.text }]}>{assessmentHistory[assessmentHistory.length-1]?.bodyFat || '--'}%</Text><Text style={[styles.statLabel, {color:'#32ADE6'}]}>GORDURA (BF)</Text></View>
                  </View>

                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}><Text style={[styles.sectionTitle, {color:'#32ADE6', marginBottom: 0, marginTop: 0}]}>GRÁFICO</Text></View>
                  <View style={{flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: theme.border, marginBottom: 15}}>
                      <TouchableOpacity onPress={() => setChartMode('WEIGHT')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'WEIGHT' ? '#32ADE6' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'WEIGHT' ? '#FFF' : theme.textSecondary}}>PESO</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => setChartMode('BF')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'BF' ? '#FF3B30' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'BF' ? '#FFF' : theme.textSecondary}}>GORDURA</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => setChartMode('LEAN_MASS')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'LEAN_MASS' ? '#FF9500' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'LEAN_MASS' ? '#FFF' : theme.textSecondary}}>M. MAGRA</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => setChartMode('FOLDS')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'FOLDS' ? '#34C759' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'FOLDS' ? '#FFF' : theme.textSecondary}}>DOBRAS</Text></TouchableOpacity>
                  </View>

                  {assessmentHistory.length > 1 ? (
                      <View style={{backgroundColor: theme.surface, borderRadius: 16, paddingTop: 15, paddingRight: 10, borderWidth: 1, borderColor: theme.border}}>
                          {isBarChart ? (
                              <BarChart data={bodyChartData} width={chartWidth} height={220} chartConfig={{...baseChartConfig, color: (opacity=1)=> `rgba(52, 199, 89, ${opacity})`}} style={styles.chart} yAxisSuffix={chartSuffix} showBarTops={true} withInnerLines={true} />
                          ) : (
                              <LineChart data={bodyChartData} width={chartWidth} height={220} chartConfig={baseChartConfig} bezier style={styles.chart} yAxisSuffix={chartSuffix} withVerticalLines={false} />
                          )}
                      </View>
                  ) : (
                      <View style={[styles.emptyChart, { backgroundColor: theme.surface, borderColor:'#32ADE6' }]}><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Registre 2 avaliações para ver o gráfico.</Text></View>
                  )}

                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 15}}>
                      <Text style={[styles.sectionTitle, {color:'#32ADE6', marginTop: 0, marginBottom: 0}]}>HISTÓRICO</Text>
                      {!compareMode ? (
                          <TouchableOpacity onPress={() => {setCompareMode(true); setSelectedForCompare([]);}} style={{flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#32ADE622', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8}}>
                              <MaterialCommunityIcons name="scale-balance" size={16} color="#32ADE6" />
                              <Text style={{color: '#32ADE6', fontSize: 11, fontWeight: 'bold'}}>COMPARAR</Text>
                          </TouchableOpacity>
                      ) : (
                          <View style={{flexDirection: 'row', gap: 10}}>
                              <TouchableOpacity onPress={() => setCompareMode(false)} style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border}}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>CANCELAR</Text></TouchableOpacity>
                              <TouchableOpacity onPress={() => { if(selectedForCompare.length < 2) return Alert.alert("Atenção", "Selecione de 2 a 3 avaliações."); setCompareModalVisible(true); }} style={{backgroundColor: selectedForCompare.length >= 2 ? '#32ADE6' : theme.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8}}>
                                  <Text style={{color: selectedForCompare.length >= 2 ? '#FFF' : theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>GERAR ({selectedForCompare.length}/3)</Text>
                              </TouchableOpacity>
                          </View>
                      )}
                  </View>

                  {sortedAssessments.slice().reverse().map((item) => {
                      const isSelected = selectedForCompare.includes(item.id);
                      return (
                          <TouchableOpacity key={item.id} style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: compareMode && isSelected ? '#32ADE6' : theme.border }]} onPress={() => { if(compareMode) toggleCompare(item.id); else openDetails(item); }}>
                              <View style={styles.historyHeader}>
                                  <View>
                                      <Text style={[styles.historyDate, { color: theme.text }]}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                                      <Text style={{color: theme.textSecondary, fontSize:10, fontWeight:'bold', marginTop: 2}}>{item.method === 'POLLOCK' ? 'POLLOCK 7' : 'BÁSICO'}</Text>
                                  </View>
                                  {compareMode ? <MaterialCommunityIcons name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={24} color={isSelected ? "#32ADE6" : theme.textSecondary} /> : <MaterialCommunityIcons name="eye-outline" size={20} color="#32ADE6" />}
                              </View>
                              <View style={{flexDirection:'row', gap:15, marginTop:5}}>
                                  <Text style={{color: theme.text, fontWeight:'bold'}}>Peso: {item.weight}kg</Text>
                                  {item.bodyFat && <Text style={{color:'#32ADE6', fontWeight:'bold'}}>BF: {item.bodyFat}%</Text>}
                              </View>
                          </TouchableOpacity>
                      )
                  })}
              </>
          )}
        </ScrollView>
      </View>

      {/* 🔥 OS MODAIS ESTÃO AGORA ISOLADOS NOS SEUS PRÓPRIOS FICHEIROS */}
      <AssessmentFormModal
          visible={modalVisible} onClose={() => { setModalVisible(false); resetForm(); }}
          editingId={editingId} customDate={customDate} handleDateChange={handleDateChange}
          method={method} setMethod={setMethod} weight={weight} setWeight={setWeight}
          currentAge={currentAge} setCurrentAge={setCurrentAge} currentGender={currentGender} setCurrentGender={setCurrentGender}
          folds={folds} setFolds={setFolds} measures={measures} setMeasures={setMeasures}
          onSave={handleSaveAssessment} theme={theme} isWeb={isWeb} webOuterBg={webOuterBg}
      />

      <AssessmentDetailsModal
          visible={detailsVisible} assessment={selectedAssessment}
          onClose={() => setDetailsVisible(false)} onGeneratePDF={() => generateSinglePDF(selectedAssessment)}
          onEdit={() => handleEdit(selectedAssessment)} onDelete={() => handleDelete(selectedAssessment?.id)} theme={theme}
      />

      <CompareReportModal
          visible={compareModalVisible} onClose={() => setCompareModalVisible(false)}
          selectedData={assessmentHistory.filter(a => selectedForCompare.includes(a.id))}
          onGeneratePDF={generateComparePDF} theme={theme}
      />

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
  scrollContent: { padding: 20 },
  pdfAssessmentBtn: { flexDirection: 'row', padding: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, elevation: 4 },
  pdfAssessmentTitle: { fontWeight: '900', fontSize: 15 },
  pdfAssessmentSub: { fontSize: 11, marginTop: 2 },
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
  newAssessmentBtn: { flexDirection: 'row', padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 25 },
  newAssessmentText: { fontWeight: '900', fontSize: 14 }
});