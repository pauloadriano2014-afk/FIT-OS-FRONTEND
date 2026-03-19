// src/screens/EvolutionScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from "react-native-chart-kit";
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/* 🔥 IMPORTAÇÃO DO TEMA */
import { useTheme } from '../contexts/ThemeContext';

if (Platform.OS === 'web' && typeof window !== 'undefined' && window.visualViewport) {
  const handler = () => {
    const viewportHeight = window.visualViewport.height;
    document.documentElement.style.height = `${viewportHeight}px`;
    document.body.style.height = `${viewportHeight}px`;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      document.activeElement.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  };
  window.visualViewport.addEventListener('resize', handler);
  window.visualViewport.addEventListener('scroll', handler);
}

if (Platform.OS === 'web' && typeof document !== 'undefined') {
    let meta = document.querySelector("meta[name=viewport]");
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
    }
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
}

const { width } = Dimensions.get('window');

const calculateBodyFat = (gender, age, rawFolds) => {
    const cleanVal = (v) => Number(String(v).replace(',', '.') || 0);
    const sum = cleanVal(rawFolds.foldChest) + cleanVal(rawFolds.foldAxillary) + cleanVal(rawFolds.foldTriceps) + 
                cleanVal(rawFolds.foldSubscapular) + cleanVal(rawFolds.foldAbdominal) + cleanVal(rawFolds.foldSuprailiac) + 
                cleanVal(rawFolds.foldThigh);
    if (sum === 0) return 0;
    let density = 0;
    const ageVal = Number(age);
    if (gender === 'MASCULINO') density = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * ageVal);
    else density = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * ageVal);
    const bf = ((4.95 / density) - 4.50) * 100;
    return bf > 0 ? bf.toFixed(1) : 0;
};

const getAgeFromDate = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age.toString();
};

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
    React.useCallback(() => {
        loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
          
          if (user.birthDate) setCurrentAge(getAgeFromDate(user.birthDate));
          if (user.gender) setCurrentGender(user.gender.toUpperCase());
          
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
                          const w = parseFloat(ex.weight) || 0;
                          const r = parseFloat(ex.reps) || 0;
                          totalVol += (w * r);
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
    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  const handleDateChange = (text) => {
      let cleaned = text.replace(/[^0-9]/g, '');
      if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
      if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
      if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
      setCustomDate(cleaned);
  };

  const resetForm = () => {
      setEditingId(null);
      setWeight(''); 
      setCustomDate(''); 
      setMethod('BASICO');
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
              if (res.ok) {
                  setDetailsVisible(false);
                  loadData();
              } else {
                  Alert.alert("Erro", "Falha ao excluir.");
              }
          } catch (e) {
              Alert.alert("Erro", "Erro de conexão.");
          } finally {
              setLoading(false);
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm("Tem certeza que deseja excluir esta avaliação?")) execDelete();
      } else {
          Alert.alert("Excluir", "Tem certeza que deseja apagar permanentemente?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Excluir", style: "destructive", onPress: execDelete }
          ]);
      }
  };

  const handleSaveAssessment = async () => {
      if (!weight) return Alert.alert("Erro", "O campo Peso é obrigatório.");
      if (customDate && customDate.length !== 10 && customDate.length > 0) return Alert.alert("Erro", "Data inválida (DD/MM/AAAA).");

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
          userId: userData.id,
          date: isoDate,
          weight: weight.replace(',', '.'), 
          method,
          bodyFat: calculatedBF,
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
      const methodHttp = editingId ? 'PUT' : 'POST';

      try {
          const res = await fetch('https://fitos-final.onrender.com/api/assessment', {
              method: methodHttp,
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(payload)
          });
          
          const json = await res.json(); 

          if (res.ok) {
              const msg = method === 'POLLOCK' ? `Salvo!\nBF Estimado: ${calculatedBF}%` : `Peso registrado!`;
              if (Platform.OS === 'web') window.alert(msg);
              else Alert.alert("Sucesso", msg);
              
              setModalVisible(false);
              resetForm();
              loadData(); 
          } else {
              if (Platform.OS === 'web') window.alert(json.error || "Verifique os dados.");
              else Alert.alert("Erro ao Salvar", json.error || "Verifique os dados.");
          }
      } catch (e) {
          if (Platform.OS === 'web') window.alert(e.message);
          else Alert.alert("Erro de Conexão", e.message);
      }
  };

  const openDetails = (item) => {
      setSelectedAssessment(item);
      setDetailsVisible(true);
  };

  // 🔥 O NOVO GERADOR DE PDF BLINDADO E DIAGRAMADO PARA LAUDO (ÚNICO E COMPARAÇÃO)
  const processAndSharePDF = async (htmlContent, title) => {
      try {
          const finalHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                      body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; background-color: #fff; margin: 0; }
                      .header { border-bottom: 4px solid #32ADE6; padding-bottom: 20px; margin-bottom: 30px; }
                      .title { font-size: 32px; font-weight: 900; color: #32ADE6; text-transform: uppercase; }
                      .subtitle { font-size: 16px; color: #666; margin-top: 5px; }
                      .card-container { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 30px; }
                      .card { background: #f8f9fa; border: 1px solid #e5e5ea; padding: 20px; border-radius: 12px; flex: 1; min-width: 150px; text-align: center; }
                      .card-title { font-size: 12px; color: #888; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
                      .card-val { font-size: 28px; font-weight: 900; color: #111; }
                      .highlight { color: #32ADE6; }
                      .table-wrap { margin-top: 30px; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5ea; }
                      table { width: 100%; border-collapse: collapse; }
                      th, td { padding: 15px; text-align: center; border-bottom: 1px solid #eee; }
                      th { background-color: #f4f5f7; color: #555; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                      td { font-size: 15px; font-weight: 700; color: #333; }
                      .label-left { text-align: left; }
                      .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #aaa; padding-top: 20px; border-top: 1px solid #eee; }
                      .text-green { color: #34C759; font-weight: 900; }
                      .text-red { color: #FF3B30; font-weight: 900; }
                      .text-neutral { color: #888; font-weight: 700; }
                  </style>
              </head>
              <body>
                  ${htmlContent}
                  <div class="footer">Laudo gerado via Aplicativo Oficial do Treinador</div>
              </body>
              </html>
          `;

          if (Platform.OS === 'web') {
              await Print.printAsync({ html: finalHtml });
          } else {
              const { uri } = await Print.printToFileAsync({ html: finalHtml });
              const isAvailable = await Sharing.isAvailableAsync();
              if (isAvailable) {
                  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: title });
              } else {
                  Alert.alert("Erro", "Compartilhamento não disponível neste dispositivo.");
              }
          }
      } catch (e) {
          if (Platform.OS !== 'web') Alert.alert("Erro", "Não foi possível gerar o PDF.");
      }
  };

  const generateSinglePDF = (assessment) => {
      const d = new Date(assessment.date).toLocaleDateString('pt-BR');
      const leanMass = assessment.bodyFat ? (assessment.weight * (1 - assessment.bodyFat / 100)).toFixed(1) : '--';
      const bfStr = assessment.bodyFat ? `${assessment.bodyFat}%` : '--';
      const sum = (assessment.foldChest||0) + (assessment.foldAxillary||0) + (assessment.foldTriceps||0) + (assessment.foldSubscapular||0) + (assessment.foldAbdominal||0) + (assessment.foldSuprailiac||0) + (assessment.foldThigh||0);

      let html = `
          <div class="header">
              <div class="title">Avaliação Física</div>
              <div class="subtitle">Aluno(a): <strong>${userData?.name || 'Aluno'}</strong> &nbsp;|&nbsp; Data: <strong>${d}</strong></div>
          </div>
          
          <div class="card-container">
              <div class="card"><div class="card-title">Peso Atual</div><div class="card-val">${assessment.weight}kg</div></div>
              <div class="card"><div class="card-title">Gordura (BF)</div><div class="card-val highlight">${bfStr}</div></div>
              <div class="card"><div class="card-title">Massa Magra</div><div class="card-val">${leanMass}kg</div></div>
          </div>
      `;

      if (assessment.method === 'POLLOCK') {
          html += `
              <h3 style="color: #32ADE6; font-size: 16px; margin-bottom: 10px;">DOBRAS CUTÂNEAS (mm)</h3>
              <div class="table-wrap">
                  <table>
                      <tr><th>Peitoral</th><th>Axilar</th><th>Tríceps</th><th>Subescapular</th></tr>
                      <tr>
                          <td>${assessment.foldChest || '-'}</td>
                          <td>${assessment.foldAxillary || '-'}</td>
                          <td>${assessment.foldTriceps || '-'}</td>
                          <td>${assessment.foldSubscapular || '-'}</td>
                      </tr>
                      <tr><th>Abdominal</th><th>Supra-ilíaca</th><th>Coxa</th><th style="color:#32ADE6">SOMA TOTAL</th></tr>
                      <tr>
                          <td>${assessment.foldAbdominal || '-'}</td>
                          <td>${assessment.foldSuprailiac || '-'}</td>
                          <td>${assessment.foldThigh || '-'}</td>
                          <td style="color:#32ADE6">${sum > 0 ? sum.toFixed(1) : '-'}</td>
                      </tr>
                  </table>
              </div>
          `;
      }

      if (assessment.waist || assessment.abdomen) {
          html += `
              <h3 style="color: #32ADE6; font-size: 16px; margin-top: 30px; margin-bottom: 10px;">MEDIDAS (cm)</h3>
              <div class="table-wrap">
                  <table>
                      <tr>${assessment.waist ? '<th>Cintura</th>' : ''}${assessment.abdomen ? '<th>Abdômen</th>' : ''}</tr>
                      <tr>${assessment.waist ? `<td>${assessment.waist}</td>` : ''}${assessment.abdomen ? `<td>${assessment.abdomen}</td>` : ''}</tr>
                  </table>
              </div>
          `;
      }

      processAndSharePDF(html, 'Avaliacao_Fisica');
  };

  const generateComparePDF = () => {
      const selectedData = assessmentHistory
          .filter(a => selectedForCompare.includes(a.id))
          .sort((a, b) => new Date(a.date) - new Date(b.date)); 
      
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
              if (diff > 0) {
                  const c = isInvertedLogic ? 'text-green' : 'text-red';
                  deltaHtml = `<td class="${c}">+${diff}</td>`;
              } else if (diff < 0) {
                  const c = isInvertedLogic ? 'text-red' : 'text-green';
                  deltaHtml = `<td class="${c}">${diff}</td>`;
              } else {
                  deltaHtml = `<td class="text-neutral">0</td>`;
              }
          }

          let cols = selectedData.map(ass => {
              const v = getVal(ass, key);
              return `<td>${v != null ? `${v}${isPercentage?'%':''}` : '-'}</td>`;
          }).join('');

          return `<tr><td class="label-left">${label}</td>${cols}${deltaHtml}</tr>`;
      };

      const headerCols = selectedData.map(ass => `<th>${new Date(ass.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</th>`).join('');

      let html = `
          <div class="header">
              <div class="title">Relatório de Evolução</div>
              <div class="subtitle">Comparativo de Progresso &nbsp;|&nbsp; Aluno(a): <strong>${userData?.name || 'Aluno'}</strong></div>
          </div>
          
          <div class="table-wrap">
              <table>
                  <tr><th class="label-left">MÉTRICA</th>${headerCols}<th style="color:#32ADE6">DELTA</th></tr>
                  ${renderTableRow('Peso (kg)', 'weight')}
                  ${renderTableRow('Gordura (BF)', 'bodyFat', true, false)}
                  ${renderTableRow('Massa Magra', 'leanMass', false, true)}
                  ${renderTableRow('Soma Dobras (mm)', 'foldSum')}
                  ${renderTableRow('Peitoral', 'foldChest')}
                  ${renderTableRow('Axilar', 'foldAxillary')}
                  ${renderTableRow('Tríceps', 'foldTriceps')}
                  ${renderTableRow('Subescapular', 'foldSubscapular')}
                  ${renderTableRow('Abdominal', 'foldAbdominal')}
                  ${renderTableRow('Supra-ilíaca', 'foldSuprailiac')}
                  ${renderTableRow('Coxa', 'foldThigh')}
              </table>
          </div>
      `;

      processAndSharePDF(html, 'Comparativo_Evolucao');
  };

  const toggleCompare = (id) => {
      if (selectedForCompare.includes(id)) {
          setSelectedForCompare(prev => prev.filter(itemId => itemId !== id));
      } else {
          if (selectedForCompare.length >= 3) {
              if (Platform.OS === 'web') window.alert("Selecione no máximo 3 avaliações.");
              else Alert.alert("Limite", "Selecione no máximo 3 avaliações.");
              return;
          }
          setSelectedForCompare(prev => [...prev, id]);
      }
  };

  const renderCompareRow = (label, key, isInvertedLogic = false, isPercentage = false) => {
      const selectedData = assessmentHistory
          .filter(a => selectedForCompare.includes(a.id))
          .sort((a, b) => new Date(a.date) - new Date(b.date)); 

      const getVal = (ass) => {
          if (key === 'leanMass') return ass.weight && ass.bodyFat ? (ass.weight * (1 - ass.bodyFat/100)).toFixed(1) : null;
          if (key === 'foldSum') return ass.foldChest ? (ass.foldChest + ass.foldAxillary + ass.foldTriceps + ass.foldSubscapular + ass.foldAbdominal + ass.foldSuprailiac + ass.foldThigh).toFixed(1) : null;
          return ass[key];
      };

      const hasAnyData = selectedData.some(ass => getVal(ass) != null);
      if (!hasAnyData) return null;

      const oldestVal = parseFloat(getVal(selectedData[0]));
      const newestVal = parseFloat(getVal(selectedData[selectedData.length - 1]));
      let deltaStr = '-';
      let deltaColor = theme.textSecondary;
      let iconName = 'minus';

      if (!isNaN(oldestVal) && !isNaN(newestVal) && selectedData.length > 1) {
          const diff = (newestVal - oldestVal).toFixed(1);
          if (diff > 0) {
              deltaStr = `+${diff}`;
              deltaColor = isInvertedLogic ? '#34C759' : '#FF3B30'; 
              iconName = 'arrow-up';
          } else if (diff < 0) {
              deltaStr = `${diff}`;
              deltaColor = isInvertedLogic ? '#FF3B30' : '#34C759'; 
              iconName = 'arrow-down';
          }
      }

      return (
          <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 12, alignItems: 'center'}}>
              <Text style={{flex: 2, color: theme.text, fontSize: 11, fontWeight: 'bold'}}>{label}</Text>
              {selectedData.map((ass, i) => (
                  <Text key={i} style={{flex: 1.5, color: theme.textSecondary, fontSize: 12, textAlign: 'center', fontWeight: '600'}}>
                      {getVal(ass) != null ? `${getVal(ass)}${isPercentage ? '%' : ''}` : '-'}
                  </Text>
              ))}
              <View style={{flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2}}>
                  {deltaStr !== '-' && <MaterialCommunityIcons name={iconName} size={12} color={deltaColor} />}
                  <Text style={{color: deltaColor, fontSize: 12, fontWeight: '900'}}>{deltaStr}</Text>
              </View>
          </View>
      );
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;
  const chartWidth = isWeb ? (width > 480 ? 440 : width - 40) : width - 40;
  
  const totalTonnage = workoutHistory.reduce((acc, curr) => acc + (curr.tonnage || 0), 0);
  const chartWorkouts = [...workoutHistory].reverse().slice(-6); 
  
  const performanceChartData = {
    labels: chartWorkouts.map(h => h.dateFormatted || '?'),
    datasets: [{ 
        data: chartWorkouts.length > 0 ? chartWorkouts.map(h => h.tonnage / 1000) : [0],
        color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`, 
        strokeWidth: 3 
    }]
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
          bodyChartData.datasets = [{ 
              data: lastAssessments.map(a => (a.weight && a.bodyFat) ? parseFloat((a.weight * (1 - a.bodyFat/100)).toFixed(1)) : 0), 
              color: (opacity=1)=> `rgba(255, 149, 0, ${opacity})`, strokeWidth: 3 
          }];
          chartSuffix = "kg";
      } else if (chartMode === 'FOLDS') {
          isBarChart = true;
          activeChartColor = `rgba(52, 199, 89, 1)`;
          bodyChartData.datasets = [{ data: lastAssessments.map(a => (a.foldChest ? (a.foldChest + a.foldAxillary + a.foldTriceps + a.foldSubscapular + a.foldAbdominal + a.foldSuprailiac + a.foldThigh) : 0)) }];
          chartSuffix = "mm";
      }
  }

  const baseChartConfig = {
      backgroundGradientFrom: theme.surface, 
      backgroundGradientFromOpacity: 1,
      backgroundGradientTo: theme.surface, 
      backgroundGradientToOpacity: 1,
      decimalPlaces: 1, 
      color: (opacity = 1) => activeChartColor, 
      labelColor: (opacity = 1) => theme.textSecondary, 
      style: { borderRadius: 16 },
      propsForDots: { r: "5", strokeWidth: "3", stroke: theme.surface }, 
      propsForBackgroundLines: { stroke: theme.border, strokeDasharray: "", strokeWidth: 0.5 }, 
      fillShadowGradientOpacity: 0.1, 
      barPercentage: 0.6,
  };

  return (
    <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
        
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15}}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.text }]}>PAINEL EVOLUTIVO</Text>
          </View>

          <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'PERFORMANCE' && { backgroundColor: theme.accent }]} onPress={() => setActiveTab('PERFORMANCE')}>
                  <Text style={[styles.tabText, activeTab === 'PERFORMANCE' ? {color: theme.isDark ? '#000' : '#FFF'} : {color: theme.textSecondary}]}>PERFORMANCE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'CORPO' && { backgroundColor: '#32ADE6' }]} onPress={() => setActiveTab('CORPO')}>
                  <Text style={[styles.tabText, activeTab === 'CORPO' ? {color: '#FFF'} : {color: theme.textSecondary}]}>CORPO</Text>
              </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={[styles.scrollArea, isWeb && { overflowY: 'auto' }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false} 
          overScrollMode="never" 
        >
          {loading ? <ActivityIndicator color={theme.accent} style={{marginTop:50}} size="large"/> : 
            activeTab === 'PERFORMANCE' ? (
              <>
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
                      <LineChart 
                          data={performanceChartData} 
                          width={chartWidth} 
                          height={220} 
                          chartConfig={{...baseChartConfig, color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`, fillShadowGradientOpacity: 0.1}} 
                          bezier 
                          style={styles.chart} 
                          yAxisSuffix="t"
                          withVerticalLines={false} 
                      />
                  ) : (
                      <View style={[styles.emptyChart, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Realize pelo menos 2 treinos.</Text></View>
                  )}
                  
                  <Text style={[styles.sectionTitle, { color: theme.accent }]}>HISTÓRICO RECENTE</Text>
                  {workoutHistory.slice(0,5).map((item, i) => (
                      <View key={i} style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <View style={styles.historyHeader}>
                              <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{new Date(item.date).toLocaleDateString()}</Text>
                              {item.rpe && (
                                  <View style={[styles.rpeBadge, {backgroundColor: item.rpe >= 8 ? '#FF3B30' : theme.accent}]}>
                                      <Text style={[styles.rpeText, { color: theme.isDark ? '#000' : '#FFF' }]}>RPE {item.rpe}</Text>
                                  </View>
                              )}
                          </View>
                          <Text style={[styles.historyWorkout, { color: theme.text }]}>{item.name || 'Treino'}</Text>
                          <Text style={[styles.historyTonnage, { color: theme.accent }]}>{item.tonnage}kg totais movidos</Text>
                      </View>
                  ))}
              </>
          ) : (
              <>
                  <TouchableOpacity style={[styles.newAssessmentBtn, { backgroundColor: '#32ADE6' }]} onPress={() => { resetForm(); setModalVisible(true); }}>
                      <MaterialCommunityIcons name="plus-circle" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                      <Text style={[styles.newAssessmentText, { color: theme.isDark ? '#000' : '#FFF' }]}>REGISTRAR MEDIDAS / POLLOCK</Text>
                  </TouchableOpacity>

                  <View style={styles.statsRow}>
                      <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor:'#32ADE6' }]}><MaterialCommunityIcons name="scale-bathroom" size={24} color="#32ADE6" /><Text style={[styles.statValue, { color: theme.text }]}>{assessmentHistory[assessmentHistory.length-1]?.weight || '--'}kg</Text><Text style={[styles.statLabel, {color:'#32ADE6'}]}>PESO ATUAL</Text></View>
                      <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor:'#32ADE6' }]}><MaterialCommunityIcons name="percent" size={24} color="#32ADE6" /><Text style={[styles.statValue, { color: theme.text }]}>{assessmentHistory[assessmentHistory.length-1]?.bodyFat || '--'}%</Text><Text style={[styles.statLabel, {color:'#32ADE6'}]}>GORDURA (BF)</Text></View>
                  </View>

                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                      <Text style={[styles.sectionTitle, {color:'#32ADE6', marginBottom: 0, marginTop: 0}]}>GRÁFICO</Text>
                  </View>
                  
                  <View style={{flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: theme.border, marginBottom: 15}}>
                      <TouchableOpacity onPress={() => setChartMode('WEIGHT')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'WEIGHT' ? '#32ADE6' : 'transparent'}}>
                          <Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'WEIGHT' ? '#FFF' : theme.textSecondary}}>PESO</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setChartMode('BF')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'BF' ? '#FF3B30' : 'transparent'}}>
                          <Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'BF' ? '#FFF' : theme.textSecondary}}>GORDURA</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setChartMode('LEAN_MASS')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'LEAN_MASS' ? '#FF9500' : 'transparent'}}>
                          <Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'LEAN_MASS' ? '#FFF' : theme.textSecondary}}>M. MAGRA</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setChartMode('FOLDS')} style={{flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, backgroundColor: chartMode === 'FOLDS' ? '#34C759' : 'transparent'}}>
                          <Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'FOLDS' ? '#FFF' : theme.textSecondary}}>DOBRAS</Text>
                      </TouchableOpacity>
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
                              <TouchableOpacity onPress={() => setCompareMode(false)} style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border}}>
                                  <Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>CANCELAR</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                  onPress={() => {
                                      if(selectedForCompare.length < 2) return Platform.OS === 'web' ? window.alert("Selecione de 2 a 3 avaliações.") : Alert.alert("Atenção", "Selecione de 2 a 3 avaliações.");
                                      setCompareModalVisible(true);
                                  }} 
                                  style={{backgroundColor: selectedForCompare.length >= 2 ? '#32ADE6' : theme.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8}}
                              >
                                  <Text style={{color: selectedForCompare.length >= 2 ? '#FFF' : theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>GERAR ({selectedForCompare.length}/3)</Text>
                              </TouchableOpacity>
                          </View>
                      )}
                  </View>

                  {sortedAssessments.slice().reverse().map((item) => {
                      const isSelected = selectedForCompare.includes(item.id);
                      return (
                          <TouchableOpacity 
                              key={item.id} 
                              style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: compareMode && isSelected ? '#32ADE6' : theme.border }]} 
                              onPress={() => {
                                  if(compareMode) toggleCompare(item.id);
                                  else openDetails(item);
                              }}
                          >
                              <View style={styles.historyHeader}>
                                  <View>
                                      <Text style={[styles.historyDate, { color: theme.text }]}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                                      <Text style={{color: theme.textSecondary, fontSize:10, fontWeight:'bold', marginTop: 2}}>{item.method === 'POLLOCK' ? 'POLLOCK 7' : 'BÁSICO'}</Text>
                                  </View>
                                  {compareMode ? (
                                      <MaterialCommunityIcons name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={24} color={isSelected ? "#32ADE6" : theme.textSecondary} />
                                  ) : (
                                      <MaterialCommunityIcons name="eye-outline" size={20} color="#32ADE6" />
                                  )}
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

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalFull, { width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }]}>
                <SafeAreaView style={{flex:1}}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{editingId ? "EDITAR AVALIAÇÃO" : "NOVA AVALIAÇÃO"}</Text>
                        <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}><MaterialCommunityIcons name="close" size={24} color={theme.text} /></TouchableOpacity>
                    </View>
                    
                    <ScrollView 
                        style={[styles.scrollArea, isWeb && { overflowY: 'auto' }]} 
                        contentContainerStyle={{padding: 20}} 
                        showsVerticalScrollIndicator={false}
                        bounces={false} 
                        overScrollMode="never"
                    >
                        <Text style={[styles.label, { color: '#32ADE6' }]}>DATA (Opcional - Para Backdate)</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={customDate} onChangeText={handleDateChange} placeholder="DD/MM/AAAA (Deixe vazio para Hoje)" placeholderTextColor={theme.textSecondary} maxLength={10} outlineStyle="none" />
                        
                        <View style={[styles.switchRow, { backgroundColor: theme.surface }]}>
                            <TouchableOpacity style={[styles.switchBtn, method==='BASICO' && { backgroundColor: '#32ADE6' }]} onPress={()=>setMethod('BASICO')}><Text style={[styles.switchText, method==='BASICO' ? {color: theme.isDark ? '#000' : '#FFF'} : {color: theme.textSecondary}]}>BÁSICO</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.switchBtn, method==='POLLOCK' && { backgroundColor: '#32ADE6' }]} onPress={()=>setMethod('POLLOCK')}><Text style={[styles.switchText, method==='POLLOCK' ? {color: theme.isDark ? '#000' : '#FFF'} : {color: theme.textSecondary}]}>POLLOCK 7</Text></TouchableOpacity>
                        </View>
                        
                        <Text style={[styles.label, { color: '#32ADE6' }]}>PESO (KG)</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder="Ex: 80.5" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                        
                        {method === 'POLLOCK' ? (
                            <>
                            <View style={styles.configRow}>
                                <View style={{flex:1}}><Text style={[styles.label, { color: '#32ADE6' }]}>IDADE</Text><TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={currentAge} onChangeText={setCurrentAge} placeholder="Anos" placeholderTextColor={theme.textSecondary} outlineStyle="none" /></View>
                                <View style={{flex:1, marginLeft:10}}><Text style={[styles.label, { color: '#32ADE6' }]}>SEXO</Text><TouchableOpacity style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: 'center' }]} onPress={() => setCurrentGender(currentGender==='MASCULINO'?'FEMININO':'MASCULINO')}><Text style={{color: theme.text}}>{currentGender}</Text></TouchableOpacity></View>
                            </View>
                            <Text style={[styles.sectionHeader, { color: theme.text, borderBottomColor: theme.border }]}>DOBRAS CUTÂNEAS (MM)</Text>
                            <View style={styles.grid}>
                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PEITORAL</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldChest} onChangeText={t=>setFolds({...folds, foldChest:t})} outlineStyle="none"/></View>
                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>AXILAR</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldAxillary} onChangeText={t=>setFolds({...folds, foldAxillary:t})} outlineStyle="none"/></View>
                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>TRÍCEPS</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldTriceps} onChangeText={t=>setFolds({...folds, foldTriceps:t})} outlineStyle="none"/></View>
                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>SUBESCAP.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldSubscapular} onChangeText={t=>setFolds({...folds, foldSubscapular:t})} outlineStyle="none"/></View>
                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ABDOMINAL</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldAbdominal} onChangeText={t=>setFolds({...folds, foldAbdominal:t})} outlineStyle="none"/></View>
                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>SUPRA-IL.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldSuprailiac} onChangeText={t=>setFolds({...folds, foldSuprailiac:t})} outlineStyle="none"/></View>
                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>COXA</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldThigh} onChangeText={t=>setFolds({...folds, foldThigh:t})} outlineStyle="none"/></View>
                            </View>
                            <Text style={[styles.hint, { color: theme.textSecondary }]}>O app usará idade e sexo para calcular o BF.</Text>
                            </>
                        ) : (
                            <>
                            <Text style={[styles.label, { color: '#32ADE6' }]}>CINTURA (CM) - Opcional</Text><TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.waist} onChangeText={t=>setMeasures({...measures, waist:t})} outlineStyle="none" />
                            <Text style={[styles.label, { color: '#32ADE6' }]}>ABDÔMEN (CM) - Opcional</Text><TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.abdomen} onChangeText={t=>setMeasures({...measures, abdomen:t})} outlineStyle="none" />
                            </>
                        )}
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#32ADE6' }]} onPress={handleSaveAssessment}><Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>{editingId ? "ATUALIZAR DADOS" : "SALVAR RESULTADOS"}</Text></TouchableOpacity>
                        <View style={{height: 100}} /> 
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={detailsVisible} transparent animationType="fade">
        <View style={styles.detailsOverlay}>
            <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                
                <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.detailsTitle, { color: '#32ADE6' }]}>DETALHES</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                        <TouchableOpacity onPress={() => generateSinglePDF(selectedAssessment)}>
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#32ADE6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleEdit(selectedAssessment)}>
                            <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(selectedAssessment?.id)}>
                            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF3B30" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {selectedAssessment && (
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>DATA:</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{new Date(selectedAssessment.date).toLocaleDateString('pt-BR')}</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>PESO:</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{selectedAssessment.weight} kg</Text>
                        </View>
                        {selectedAssessment.bodyFat && (
                            <View style={[styles.resultBox, { backgroundColor: theme.bg }]}>
                                <View style={{alignItems:'center'}}>
                                    <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>GORDURA</Text>
                                    <Text style={[styles.resultValue, { color: '#32ADE6' }]}>{selectedAssessment.bodyFat}%</Text>
                                </View>
                                <View style={{height:30, width:1, backgroundColor: theme.border}}/>
                                <View style={{alignItems:'center'}}>
                                    <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>MASSA MAGRA</Text>
                                    <Text style={[styles.resultValue, { color: theme.text }]}>{(selectedAssessment.weight * (1 - selectedAssessment.bodyFat/100)).toFixed(1)} kg</Text>
                                </View>
                            </View>
                        )}
                        
                        {(selectedAssessment.method === 'POLLOCK') && (
                            <>
                                <Text style={[styles.detailSection, { color: '#32ADE6' }]}>DOBRAS POLOCK 7 (mm)</Text>
                                <View style={styles.foldsCardGrid}>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>PEITORAL</Text>
                                        <Text style={[styles.foldCardValue, {color: theme.text}]}>{selectedAssessment.foldChest || '-'}</Text>
                                    </View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>AXILAR</Text>
                                        <Text style={[styles.foldCardValue, {color: theme.text}]}>{selectedAssessment.foldAxillary || '-'}</Text>
                                    </View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>TRÍCEPS</Text>
                                        <Text style={[styles.foldCardValue, {color: theme.text}]}>{selectedAssessment.foldTriceps || '-'}</Text>
                                    </View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>SUBESCAP.</Text>
                                        <Text style={[styles.foldCardValue, {color: theme.text}]}>{selectedAssessment.foldSubscapular || '-'}</Text>
                                    </View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>ABDOMINAL</Text>
                                        <Text style={[styles.foldCardValue, {color: theme.text}]}>{selectedAssessment.foldAbdominal || '-'}</Text>
                                    </View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>SUPRA-IL.</Text>
                                        <Text style={[styles.foldCardValue, {color: theme.text}]}>{selectedAssessment.foldSuprailiac || '-'}</Text>
                                    </View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>COXA</Text>
                                        <Text style={[styles.foldCardValue, {color: theme.text}]}>{selectedAssessment.foldThigh || '-'}</Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {(selectedAssessment.waist || selectedAssessment.abdomen) && (
                            <>
                                <Text style={[styles.detailSection, { color: theme.accent }]}>MEDIDAS (cm)</Text>
                                { selectedAssessment.waist && <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Cintura:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{selectedAssessment.waist} cm</Text></View> }
                                { selectedAssessment.abdomen && <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Abdômen:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{selectedAssessment.abdomen} cm</Text></View> }
                            </>
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
      </Modal>

      <Modal visible={compareModalVisible} transparent animationType="slide">
        <View style={styles.detailsOverlay}>
            <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border, width: '100%', maxWidth: 500, paddingHorizontal: 15 }]}>
                
                <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.detailsTitle, { color: '#32ADE6' }]}>RELATÓRIO DE PROGRESSO</Text>
                    <View style={{flexDirection: 'row', gap: 15, alignItems: 'center'}}>
                        {/* 🔥 BOTÃO DE PDF DE COMPARAÇÃO */}
                        <TouchableOpacity onPress={generateComparePDF}>
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#32ADE6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCompareModalVisible(false)}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                    
                    <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10, marginBottom: 5}}>
                        <Text style={{flex: 2, color: theme.textSecondary, fontSize: 10, fontWeight: 'bold'}}></Text>
                        {assessmentHistory.filter(a => selectedForCompare.includes(a.id)).sort((a, b) => new Date(a.date) - new Date(b.date)).map((ass, i) => (
                            <Text key={i} style={{flex: 1.5, color: theme.textSecondary, fontSize: 10, fontWeight: '900', textAlign: 'center'}}>
                                {new Date(ass.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}
                            </Text>
                        ))}
                        <Text style={{flex: 1.5, color: theme.textSecondary, fontSize: 10, fontWeight: '900', textAlign: 'center'}}>EVOLUÇÃO</Text>
                    </View>

                    {renderCompareRow('PESO', 'weight')}
                    {renderCompareRow('GORDURA BF', 'bodyFat', false, true)}
                    {renderCompareRow('MASSA MAGRA', 'leanMass', true)}
                    
                    <Text style={[styles.detailSection, { color: '#32ADE6', marginTop: 25 }]}>DOBRAS (mm)</Text>
                    {renderCompareRow('SOMA (7)', 'foldSum')}
                    {renderCompareRow('Peitoral', 'foldChest')}
                    {renderCompareRow('Axilar', 'foldAxillary')}
                    {renderCompareRow('Tríceps', 'foldTriceps')}
                    {renderCompareRow('Subescapular', 'foldSubscapular')}
                    {renderCompareRow('Abdominal', 'foldAbdominal')}
                    {renderCompareRow('Supra-ilíaca', 'foldSuprailiac')}
                    {renderCompareRow('Coxa', 'foldThigh')}

                </ScrollView>
            </View>
        </View>
      </Modal>

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0, },
  scrollArea: { flex: 1, width: '100%' },
  header: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  tabContainer: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tabText: { fontWeight: '900', fontSize: 12 },
  scrollContent: { padding: 20 },
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
  newAssessmentText: { fontWeight: '900', fontSize: 14 },
  modalFull: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, marginTop: Platform.OS === 'android' ? 20 : 0 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  switchRow: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  switchBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  switchText: { fontWeight: 'bold', fontSize: 12 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 16 }, 
  configRow: { flexDirection:'row', marginBottom:15, marginTop: 10 },
  sectionHeader: { fontWeight: 'bold', marginTop: 25, marginBottom: 15, borderBottomWidth: 1, paddingBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '31%', marginBottom: 15 },
  miniLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  miniInput: { padding: 12, borderRadius: 12, borderWidth: 1, textAlign: 'center', fontSize: 16 }, 
  hint: { fontSize: 11, fontStyle: 'italic', marginTop: 15, textAlign: 'center' },
  saveBtn: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 35, marginBottom: 50 },
  saveBtnText: { fontWeight: '900', fontSize: 16 },
  detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  detailsCard: { borderRadius: 24, padding: 25, maxHeight: '80%', borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 15 },
  detailsTitle: { fontSize: 16, fontWeight: '900' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 8 },
  detailLabel: { fontWeight: 'bold', fontSize: 13 },
  detailValue: { fontWeight: '900', fontSize: 15 },
  resultBox: { flexDirection: 'row', borderRadius: 16, padding: 20, justifyContent: 'space-around', marginVertical: 20 },
  resultLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
  resultValue: { fontSize: 22, fontWeight: '900' },
  detailSection: { fontWeight: 'bold', fontSize: 13, marginTop: 15, marginBottom: 15 },
  foldsCardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  foldCard: { width: '31%', paddingVertical: 15, paddingHorizontal: 5, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 15 },
  foldCardTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  foldCardValue: { fontSize: 16, fontWeight: '900' }
});