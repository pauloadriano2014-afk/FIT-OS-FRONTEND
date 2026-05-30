// src/screens/AdminEvolutionScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Alert, Platform, FlatList, StatusBar 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';
import { getAgeFromDate } from '../utils/calculations';

/* 🔥 COMPONENTES E MODAIS */
import WorkoutLogCard from '../components/WorkoutLogCard';
import CheckinCard from '../components/CheckinCard';
import AssessmentFormModal from '../components/AssessmentFormModal';
import AssessmentDetailsModal from '../modals/AssessmentDetailsModal';
import CheckinDetailsModal from '../modals/CheckinDetailsModal';

const { width } = Dimensions.get('window');

const calculateBodyFat = (gender, age, rawFolds) => {
    const cleanVal = (v) => Number(String(v).replace(',', '.') || 0);
    const sum = cleanVal(rawFolds.foldChest) + cleanVal(rawFolds.foldAxillary) + cleanVal(rawFolds.foldTriceps) + 
                cleanVal(rawFolds.foldSubscapular) + cleanVal(rawFolds.foldAbdominal) + cleanVal(rawFolds.foldSuprailiac) + 
                cleanVal(rawFolds.foldThigh);
    if (sum === 0) return 0;
    let density = 0;
    const ageVal = Number(age);
    if (gender === 'FEMININO') density = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * ageVal);
    else density = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * ageVal);
    const bf = ((4.95 / density) - 4.50) * 100;
    return bf > 0 ? parseFloat(bf.toFixed(1)) : 0;
};

export default function AdminEvolutionScreen({ route, navigation }) {
  const rawId = route.params?.alunoId || route.params?.aluno?.id || '';
  const rawName = route.params?.alunoName || route.params?.aluno?.name || 'ALUNO';
  const rawBirthDate = route.params?.alunoBirthDate || route.params?.aluno?.birthDate || '';
  const rawGender = route.params?.alunoGender || route.params?.aluno?.gender || '';
  const aluno = { id: rawId, name: rawName, birthDate: rawBirthDate, gender: rawGender };
 
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState('AVALIACAO'); 
  const [loading, setLoading] = useState(true);
  
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]); 
  const [checkinHistory, setCheckinHistory] = useState([]); 

  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false); 
  const [selectedAssessment, setSelectedAssessment] = useState(null); 

  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [method, setMethod] = useState('BASICO');
  const [customDate, setCustomDate] = useState('');
  const [weight, setWeight] = useState('');
  const [currentAge, setCurrentAge] = useState(aluno.birthDate ? getAgeFromDate(aluno.birthDate) : '');
  const [currentGender, setCurrentGender] = useState(aluno.gender ? aluno.gender.toUpperCase() : 'MASCULINO');
  
  const [measures, setMeasures] = useState({ 
      waist: '', abdomen: '', chestMeasure: '', shoulders: '', hips: '', 
      armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', 
      legRight: '', legLeft: '', calfRight: '', calfLeft: '' 
  });
  const [folds, setFolds] = useState({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });

  // 🔥 CONTROLE DOS GRÁFICOS 🔥
  const [chartMode, setChartMode] = useState('WEIGHT');
  const [selectedMeasureChart, setSelectedMeasureChart] = useState('waist'); 

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resAssess, resLogs, resCheckins] = await Promise.all([
          fetch(`https://fitos-final.onrender.com/api/assessment?userId=${aluno.id}`),
          fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}/history`),
          fetch(`https://fitos-final.onrender.com/api/checkin?userId=${aluno.id}`) 
      ]);

      const dataAssess = await resAssess.json();
      const dataLogs = await resLogs.json();
      const dataCheckins = await resCheckins.json();

      if (Array.isArray(dataAssess)) setAssessmentHistory(dataAssess);
      if (dataLogs.workoutLogs) setWorkoutLogs(dataLogs.workoutLogs);
      if (Array.isArray(dataCheckins)) setCheckinHistory(dataCheckins); 

    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  const handleGoBack = () => {
      if (navigation.canGoBack()) navigation.goBack();
      else if (Platform.OS === 'web') window.history.back();
      else navigation.goBack();
  };

  const handleDelete = (id) => {
      if (Platform.OS === 'web') {
          if (window.confirm("Tem certeza que deseja apagar esta avaliação?")) {
              fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE' })
              .then(() => { setDetailsVisible(false); loadData(); })
              .catch(e => window.alert("Erro ao excluir: " + e.message));
          }
      } else {
          Alert.alert("Excluir", "Apagar esta avaliação?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Apagar", style: 'destructive', onPress: async () => {
                  try {
                      await fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE' });
                      setDetailsVisible(false); loadData();
                  } catch(e) { Alert.alert("Erro", "Não foi possível excluir."); }
              }}
          ]);
      }
  };

  const openDetails = (item) => {
      setSelectedAssessment(item);
      setDetailsVisible(true);
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
      setMeasures({ waist:'', abdomen:'', chestMeasure: '', shoulders: '', hips: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', legRight: '', legLeft: '', calfRight: '', calfLeft: '' });
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
          setMeasures({ 
              waist: item.waist ? String(item.waist) : '', 
              abdomen: item.abdomen ? String(item.abdomen) : '',
              chestMeasure: item.chest ? String(item.chest) : '',
              shoulders: item.shoulders ? String(item.shoulders) : '',
              hips: item.hips ? String(item.hips) : '',
              armRight: item.arms ? String(item.arms) : '',
              armLeft: item.armLeft ? String(item.armLeft) : '',
              forearmRight: item.forearms ? String(item.forearms) : '',
              forearmLeft: item.forearmLeft ? String(item.forearmLeft) : '',
              legRight: item.thighs ? String(item.thighs) : '',
              legLeft: item.thighLeft ? String(item.thighLeft) : '',
              calfRight: item.calves ? String(item.calves) : '',
              calfLeft: item.calfLeft ? String(item.calfLeft) : ''
          });
      } else {
          setMeasures({ waist: item.waist ? String(item.waist) : '', abdomen: item.abdomen ? String(item.abdomen) : '', chestMeasure: '', shoulders: '', hips: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', legRight: '', legLeft: '', calfRight: '', calfLeft: '' });
      }
      setModalVisible(true);
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
      let cleanMeasures = {};

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
          userId: aluno.id, date: isoDate, weight: weight.replace(',', '.'), method, bodyFat: calculatedBF,
          waist: cleanMeasures.waist, abdomen: cleanMeasures.abdomen,
          chestMeasure: method === 'POLLOCK' ? cleanMeasures.chestMeasure : null, shoulders: method === 'POLLOCK' ? cleanMeasures.shoulders : null, hips: method === 'POLLOCK' ? cleanMeasures.hips : null, armRight: method === 'POLLOCK' ? cleanMeasures.armRight : null, armLeft: method === 'POLLOCK' ? cleanMeasures.armLeft : null, forearmRight: method === 'POLLOCK' ? cleanMeasures.forearmRight : null, forearmLeft: method === 'POLLOCK' ? cleanMeasures.forearmLeft : null, legRight: method === 'POLLOCK' ? cleanMeasures.legRight : null, legLeft: method === 'POLLOCK' ? cleanMeasures.legLeft : null, calfRight: method === 'POLLOCK' ? cleanMeasures.calfRight : null, calfLeft: method === 'POLLOCK' ? cleanMeasures.calfLeft : null,
          foldChest: method === 'POLLOCK' ? cleanFolds.foldChest : null, foldAxillary: method === 'POLLOCK' ? cleanFolds.foldAxillary : null, foldTriceps: method === 'POLLOCK' ? cleanFolds.foldTriceps : null, foldSubscapular: method === 'POLLOCK' ? cleanFolds.foldSubscapular : null, foldAbdominal: method === 'POLLOCK' ? cleanFolds.foldAbdominal : null, foldSuprailiac: method === 'POLLOCK' ? cleanFolds.foldSuprailiac : null, foldThigh: method === 'POLLOCK' ? cleanFolds.foldThigh : null,
      };

      if (editingId) payload.id = editingId;

      try {
          const res = await fetch('https://fitos-final.onrender.com/api/assessment', { method: editingId ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
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

  const isWeb = Platform.OS === 'web';
  const { width: windowWidth } = Dimensions.get('window');
  // 🔥 CORREÇÃO DO LARGURA DO GRÁFICO (EVITA VAZAMENTO NO MOBILE) 🔥
  const chartWidth = isWeb && windowWidth > 768 ? 440 : windowWidth - 75; 

  // 🔥 LÓGICA DE DADOS DO GRÁFICO (COM PERIMETRIA COMPLETA) 🔥
  const sortedAssessments = [...assessmentHistory].sort((a,b) => new Date(a.date) - new Date(b.date));
  const lastAssessments = sortedAssessments.slice(-6); 

  let bodyChartData = { labels: ['-'], datasets: [{ data: [0] }] };
  let chartSuffix = "";
  let activeChartColor = `rgba(50, 173, 230, 1)`;

  if (lastAssessments.length > 1) {
      bodyChartData.labels = lastAssessments.map(a => { const d = new Date(a.date); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; });
      
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
          
          if (selectedMeasureChart === 'waist') bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.waist) || 0) }];
          else if (selectedMeasureChart === 'abdomen') bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.abdomen) || 0) }];
          else if (selectedMeasureChart === 'chest') bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.chest) || 0) }];
          else if (selectedMeasureChart === 'hips') bodyChartData.datasets = [{ data: lastAssessments.map(a => Number(a.hips) || 0) }];
          else if (selectedMeasureChart === 'arms') bodyChartData.datasets = [
              { data: lastAssessments.map(a => Number(a.arms) || 0), color: (opacity=1)=> `rgba(188, 82, 235, ${opacity})` }, // Braço Dir (Roxo)
              { data: lastAssessments.map(a => Number(a.armLeft) || 0), color: (opacity=1)=> `rgba(255, 149, 0, ${opacity})` }  // Braço Esq (Laranja)
          ];
          else if (selectedMeasureChart === 'thighs') bodyChartData.datasets = [
              { data: lastAssessments.map(a => Number(a.thighs) || 0), color: (opacity=1)=> `rgba(188, 82, 235, ${opacity})` },
              { data: lastAssessments.map(a => Number(a.thighLeft) || 0), color: (opacity=1)=> `rgba(255, 149, 0, ${opacity})` }
          ];
      }
  }

  const baseChartConfig = {
      backgroundGradientFrom: theme.surface, backgroundGradientTo: theme.surface, decimalPlaces: 1, 
      color: (opacity = 1) => activeChartColor, labelColor: (opacity = 1) => theme.textSecondary, 
      style: { borderRadius: 16 }, propsForDots: { r: "5", strokeWidth: "3", stroke: theme.surface }, 
      propsForBackgroundLines: { stroke: theme.border, strokeDasharray: "", strokeWidth: 0.5 }, 
      fillShadowGradientOpacity: 0.1, barPercentage: 0.6,
  };

  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg };

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={handleGoBack} style={{padding:5}}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>PRONTUÁRIO: <Text style={{ color: theme.accent }}>{aluno.name?.split(' ')[0].toUpperCase()}</Text></Text>
            <View style={{width:24}} />
          </View>

          <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'AVALIACAO' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setActiveTab('AVALIACAO')}>
                  <Text style={[styles.tabText, { color: activeTab === 'AVALIACAO' ? theme.text : theme.textSecondary }]}>AVALIAÇÃO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'CHECKINS' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setActiveTab('CHECKINS')}>
                  <Text style={[styles.tabText, { color: activeTab === 'CHECKINS' ? theme.text : theme.textSecondary }]}>CHECK-INS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'FEEDBACK' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setActiveTab('FEEDBACK')}>
                  <Text style={[styles.tabText, { color: activeTab === 'FEEDBACK' ? theme.text : theme.textSecondary }]}>TREINOS</Text>
              </TouchableOpacity>
          </View>

          {loading ? (
              <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator color={theme.accent} size="large"/></View>
          ) : (
              <View style={{ flex: 1 }}>
                
                {activeTab === 'AVALIACAO' ? (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={styles.infoText}>IDADE: {currentAge || '--'} anos</Text>
                            <Text style={styles.infoText}>SEXO: {currentGender}</Text>
                        </View>

                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.accent }]} onPress={() => { resetForm(); setModalVisible(true); }}>
                            <MaterialCommunityIcons name="plus" size={22} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.addBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>NOVA AVALIAÇÃO</Text>
                        </TouchableOpacity>

                        {/* 🔥 SELETOR DE GRÁFICOS 🔥 */}
                        {assessmentHistory.length > 1 ? (
                            <View style={{ marginVertical: 20 }}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                                    <Text style={[styles.sectionTitle, {color:theme.accent, marginBottom: 0, marginTop: 0}]}>GRÁFICO EVOLUTIVO</Text>
                                </View>
                                
                                <View style={{flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: theme.border, marginBottom: 15}}>
                                    <TouchableOpacity onPress={() => setChartMode('WEIGHT')} style={{flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6, backgroundColor: chartMode === 'WEIGHT' ? '#4DE38F' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'WEIGHT' ? '#000' : theme.textSecondary}}>PESO</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setChartMode('BF')} style={{flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6, backgroundColor: chartMode === 'BF' ? '#FF3B30' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'BF' ? '#FFF' : theme.textSecondary}}>GORDURA</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setChartMode('MEASURES')} style={{flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6, backgroundColor: chartMode === 'MEASURES' ? '#BF5AF2' : 'transparent'}}><Text style={{fontSize: 9, fontWeight: 'bold', color: chartMode === 'MEASURES' ? '#FFF' : theme.textSecondary}}>MEDIDAS</Text></TouchableOpacity>
                                </View>

                                {/* 🔥 SUB-FILTRO DE MEDIDAS (Só aparece se clicar em MEDIDAS) 🔥 */}
                                {chartMode === 'MEASURES' && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10, paddingBottom: 15, marginTop: -5}}>
                                        <TouchableOpacity onPress={() => setSelectedMeasureChart('waist')} style={[styles.measurePill, { borderColor: theme.border }, selectedMeasureChart === 'waist' && {backgroundColor: '#BF5AF2', borderColor: '#BF5AF2'}]}><Text style={[styles.measurePillText, {color: theme.textSecondary}, selectedMeasureChart === 'waist' && {color:'#FFF'}]}>Cintura</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setSelectedMeasureChart('abdomen')} style={[styles.measurePill, { borderColor: theme.border }, selectedMeasureChart === 'abdomen' && {backgroundColor: '#BF5AF2', borderColor: '#BF5AF2'}]}><Text style={[styles.measurePillText, {color: theme.textSecondary}, selectedMeasureChart === 'abdomen' && {color:'#FFF'}]}>Abdômen</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setSelectedMeasureChart('chest')} style={[styles.measurePill, { borderColor: theme.border }, selectedMeasureChart === 'chest' && {backgroundColor: '#BF5AF2', borderColor: '#BF5AF2'}]}><Text style={[styles.measurePillText, {color: theme.textSecondary}, selectedMeasureChart === 'chest' && {color:'#FFF'}]}>Tórax</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setSelectedMeasureChart('hips')} style={[styles.measurePill, { borderColor: theme.border }, selectedMeasureChart === 'hips' && {backgroundColor: '#BF5AF2', borderColor: '#BF5AF2'}]}><Text style={[styles.measurePillText, {color: theme.textSecondary}, selectedMeasureChart === 'hips' && {color:'#FFF'}]}>Glúteos</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setSelectedMeasureChart('arms')} style={[styles.measurePill, { borderColor: theme.border }, selectedMeasureChart === 'arms' && {backgroundColor: '#BF5AF2', borderColor: '#BF5AF2'}]}><Text style={[styles.measurePillText, {color: theme.textSecondary}, selectedMeasureChart === 'arms' && {color:'#FFF'}]}>Braços</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setSelectedMeasureChart('thighs')} style={[styles.measurePill, { borderColor: theme.border }, selectedMeasureChart === 'thighs' && {backgroundColor: '#BF5AF2', borderColor: '#BF5AF2'}]}><Text style={[styles.measurePillText, {color: theme.textSecondary}, selectedMeasureChart === 'thighs' && {color:'#FFF'}]}>Pernas</Text></TouchableOpacity>
                                    </ScrollView>
                                )}

                                <View style={{backgroundColor: theme.surface, borderRadius: 16, paddingTop: 15, paddingRight: 10, borderWidth: 1, borderColor: theme.border}}>
                                    <LineChart data={bodyChartData} width={chartWidth} height={200} chartConfig={baseChartConfig} bezier style={{borderRadius: 16}} yAxisSuffix={chartSuffix} />
                                </View>
                            </View>
                        ) : null}

                        <Text style={styles.sectionTitle}>HISTÓRICO COMPLETO</Text>
                        {assessmentHistory.slice().reverse().map(item => (
                            // 🔥 O container volta a ser uma View normal para não dar conflito 🔥
                            <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.date, { color: theme.text }]}>{new Date(item.date).toLocaleDateString()}</Text>
                                    <View style={{flexDirection:'row', gap:10}}>
                                        <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.badgeText}>{item.method === 'POLLOCK' ? 'POLLOCK' : 'BÁSICO'}</Text></View>
                                        
                                        {/* Botão de Excluir Isolado */}
                                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{paddingHorizontal: 8, zIndex: 10}}>
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                
                                {/* 🔥 A área de baixo inteira é o botão que abre os Detalhes 🔥 */}
                                <TouchableOpacity style={styles.cardBody} onPress={() => openDetails(item)} activeOpacity={0.5}>
                                    <View style={styles.stat}><Text style={styles.label}>PESO</Text><Text style={[styles.val, { color: theme.text }]}>{item.weight}kg</Text></View>
                                    {item.bodyFat ? <View style={styles.stat}><Text style={styles.label}>GORDURA</Text><Text style={[styles.val, {color: theme.accent}]}>{item.bodyFat}%</Text></View> : null}
                                    {item.waist ? <View style={styles.stat}><Text style={styles.label}>CINTURA</Text><Text style={[styles.val, { color: theme.text }]}>{item.waist}cm</Text></View> : null}
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                ) : null}

                {activeTab === 'CHECKINS' ? (
                    <FlatList 
                        data={checkinHistory}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => <CheckinCard item={item} theme={theme} onPress={() => { setSelectedCheckin(item); setCheckinModalVisible(true); }} />}
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.empty}>Nenhum check-in enviado.</Text>}
                    />
                ) : null}

                {activeTab === 'FEEDBACK' ? (
                    <FlatList 
                        data={workoutLogs}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => <WorkoutLogCard item={item} theme={theme} />}
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.empty}>Nenhum treino finalizado.</Text>}
                    />
                ) : null}

              </View>
          )}
      </View>

      <CheckinDetailsModal visible={checkinModalVisible} onClose={() => setCheckinModalVisible(false)} theme={theme} selectedCheckin={selectedCheckin} />

      <AssessmentFormModal 
          visible={modalVisible} 
          onClose={() => { setModalVisible(false); resetForm(); }} 
          editingId={editingId} customDate={customDate} handleDateChange={handleDateChange} method={method} setMethod={setMethod} weight={weight} setWeight={setWeight} currentAge={currentAge} setCurrentAge={setCurrentAge} currentGender={currentGender} setCurrentGender={setCurrentGender} folds={folds} setFolds={setFolds} measures={measures} setMeasures={setMeasures} onSave={handleSaveAssessment} theme={theme} isWeb={isWeb} webOuterBg={webOuterBg} 
      />

      {/* ⚠️ NOTA PARA VOCÊ TREINADOR: Se o Modal de Detalhes não exibir as novas perimetrias, o AssessmentDetailsModal.js também precisa ser atualizado! */}
      <AssessmentDetailsModal visible={detailsVisible} assessment={selectedAssessment} onClose={() => setDetailsVisible(false)} onEdit={() => handleEdit(selectedAssessment)} onDelete={() => handleDelete(selectedAssessment?.id)} theme={theme} />

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', padding:20, paddingTop: Platform.OS === 'android' ? 10 : 20, justifyContent:'space-between', borderBottomWidth: 1 },
  headerTitle: { fontWeight:'bold', fontSize:16 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, borderBottomWidth:1 },
  tabBtn: { marginRight: 20, paddingBottom: 10 },
  tabText: { fontWeight: 'bold', fontSize: 12 },
  content: { padding:20, paddingBottom: 50 },
  infoBox: { flexDirection:'row', justifyContent:'space-between', padding:15, borderRadius:10, marginBottom:20, borderWidth:1 },
  infoText: { color:'#888', fontSize:12, fontWeight:'bold' },
  addBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', padding:15, borderRadius:10, gap:8, marginBottom:20 },
  addBtnText: { fontWeight:'900' },
  sectionTitle: { color:'#888', fontSize:12, fontWeight:'bold', marginBottom:10, marginTop:10 },
  card: { padding:15, borderRadius:12, marginBottom:10, borderWidth:1 },
  cardHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  date: { fontWeight:'bold' },
  badge: { paddingHorizontal:6, borderRadius:4, marginRight:10 },
  badgeText: { color:'#888', fontSize:10, fontWeight:'bold' },
  cardBody: { flexDirection:'row', gap:20, marginTop: 5 },
  stat: { alignItems:'flex-start' },
  label: { color:'#888', fontSize:10, fontWeight:'bold' },
  val: { fontSize:16, fontWeight:'bold' },
  empty: { color:'#888', textAlign:'center', marginTop:50 },
  
  // Estilo pros novos botões do Gráfico de Perimetria
  measurePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  measurePillText: { fontSize: 10, fontWeight: '800' }
});