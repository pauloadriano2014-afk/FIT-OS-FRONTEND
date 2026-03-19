// src/screens/EvolutionScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";
import { useFocusEffect } from '@react-navigation/native';

/* 🔥 IMPORTAÇÃO DO TEMA */
import { useTheme } from '../contexts/ThemeContext';

// INSIRA ESTE BLOCO NO TOPO DOS ARQUIVOS, LOGO APÓS OS IMPORTS

// 🔥 CURA MÁGICA DO PWA: Impede o navegador de dar zoom e mover a tela ao abrir o teclado
if (Platform.OS === 'web' && typeof window !== 'undefined' && window.visualViewport) {
  const handler = () => {
    // Detecta a altura visível do viewport (o espaço que sobrou acima do teclado)
    const viewportHeight = window.visualViewport.height;
    // Força o contêiner principal a usar essa altura, sem se mover
    document.documentElement.style.height = `${viewportHeight}px`;
    document.body.style.height = `${viewportHeight}px`;
    // Garante que o input focado permaneça visível, mas sem zoom
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      document.activeElement.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  };
  // Escuta os eventos de mudança de redimensionamento e de rolagem do viewport
  window.visualViewport.addEventListener('resize', handler);
  window.visualViewport.addEventListener('scroll', handler);
}

const { width } = Dimensions.get('window');

// --- FÓRMULA DE JACKSON & POLLOCK 7 DOBRAS ---
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

      // 🔥 TRADUTOR: Mandando os dados EXATAMENTE como o Prisma e a API esperam
      const payload = {
          userId: userData.id,
          date: isoDate,
          weight: weight.replace(',', '.'), 
          method,
          bodyFat: calculatedBF,
          // Mandando as medidas soltas para o Prisma engolir
          waist: method === 'BASICO' ? measures.waist.replace(',', '.') : null,
          abdomen: method === 'BASICO' ? measures.abdomen.replace(',', '.') : null,
          // Mandando as dobras soltas para o Prisma engolir
          foldChest: method === 'POLLOCK' ? cleanFolds.foldChest : null,
          foldAxillary: method === 'POLLOCK' ? cleanFolds.foldAxillary : null,
          foldTriceps: method === 'POLLOCK' ? cleanFolds.foldTriceps : null,
          foldSubscapular: method === 'POLLOCK' ? cleanFolds.foldSubscapular : null,
          foldAbdominal: method === 'POLLOCK' ? cleanFolds.foldAbdominal : null,
          foldSuprailiac: method === 'POLLOCK' ? cleanFolds.foldSuprailiac : null,
          foldThigh: method === 'POLLOCK' ? cleanFolds.foldThigh : null,
      };

      try {
          const res = await fetch('https://fitos-final.onrender.com/api/assessment', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(payload)
          });
          
          const json = await res.json(); 

          if (res.ok) {
              const msg = method === 'POLLOCK' ? `Salvo!\nBF Estimado: ${calculatedBF}%` : `Peso registrado!`;
              if (Platform.OS === 'web') window.alert(msg);
              else Alert.alert("Sucesso", msg);
              setModalVisible(false);
              setWeight(''); setCustomDate(''); setMeasures({waist:'', abdomen:''});
              setFolds({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });
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
  const bodyChartData = {
      labels: lastAssessments.map(a => { const d = new Date(a.date); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; }),
      datasets: [{ data: lastAssessments.length > 0 ? lastAssessments.map(a => a.weight) : [0], color: (opacity = 1) => `rgba(50, 173, 230, ${opacity})`, strokeWidth: 3 }]
  };

  const baseChartConfig = {
      backgroundGradientFrom: theme.bg, 
      backgroundGradientTo: theme.bg, 
      labelColor: (opacity = 1) => `rgba(${theme.isDark ? '255,255,255' : '0,0,0'}, ${opacity})`, 
      strokeWidth: 2, 
      propsForDots: { r: "4", strokeWidth: "2", stroke: theme.accent } 
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;
  const chartWidth = isWeb ? (width > 480 ? 440 : width - 40) : width - 40;

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
                          chartConfig={{...baseChartConfig, color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`}} 
                          bezier 
                          style={styles.chart} 
                          yAxisSuffix="t"
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
                  <TouchableOpacity style={[styles.newAssessmentBtn, { backgroundColor: '#32ADE6' }]} onPress={() => setModalVisible(true)}>
                      <MaterialCommunityIcons name="plus-circle" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                      <Text style={[styles.newAssessmentText, { color: theme.isDark ? '#000' : '#FFF' }]}>REGISTRAR MEDIDAS / POLLOCK</Text>
                  </TouchableOpacity>

                  <View style={styles.statsRow}>
                      <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor:'#32ADE6' }]}><MaterialCommunityIcons name="scale-bathroom" size={24} color="#32ADE6" /><Text style={[styles.statValue, { color: theme.text }]}>{assessmentHistory[assessmentHistory.length-1]?.weight || '--'}kg</Text><Text style={[styles.statLabel, {color:'#32ADE6'}]}>PESO ATUAL</Text></View>
                      <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor:'#32ADE6' }]}><MaterialCommunityIcons name="percent" size={24} color="#32ADE6" /><Text style={[styles.statValue, { color: theme.text }]}>{assessmentHistory[assessmentHistory.length-1]?.bodyFat || '--'}%</Text><Text style={[styles.statLabel, {color:'#32ADE6'}]}>GORDURA (BF)</Text></View>
                  </View>

                  <Text style={[styles.sectionTitle, {color:'#32ADE6'}]}>EVOLUÇÃO DO PESO CORPORAL</Text>
                  {assessmentHistory.length > 1 ? (
                      <LineChart data={bodyChartData} width={chartWidth} height={220} chartConfig={{...baseChartConfig, color: (opacity=1)=> `rgba(50, 173, 230, ${opacity})`}} bezier style={styles.chart} />
                  ) : (
                      <View style={[styles.emptyChart, { backgroundColor: theme.surface, borderColor:'#32ADE6' }]}><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Registre 2 avaliações para ver o gráfico.</Text></View>
                  )}

                  <Text style={[styles.sectionTitle, {color:'#32ADE6'}]}>HISTÓRICO (Toque para Detalhes)</Text>
                  {sortedAssessments.slice().reverse().map((item) => (
                      <TouchableOpacity key={item.id} style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => openDetails(item)}>
                          <View style={styles.historyHeader}>
                              <View>
                                  <Text style={[styles.historyDate, { color: theme.text }]}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                                  <Text style={{color: theme.textSecondary, fontSize:10, fontWeight:'bold', marginTop: 2}}>{item.method === 'POLLOCK' ? 'POLLOCK 7' : 'BÁSICO'}</Text>
                              </View>
                              <MaterialCommunityIcons name="eye-outline" size={20} color="#32ADE6" />
                          </View>
                          <View style={{flexDirection:'row', gap:15, marginTop:5}}>
                              <Text style={{color: theme.text, fontWeight:'bold'}}>Peso: {item.weight}kg</Text>
                              {item.bodyFat && <Text style={{color:'#32ADE6', fontWeight:'bold'}}>BF: {item.bodyFat}%</Text>}
                          </View>
                      </TouchableOpacity>
                  ))}
              </>
          )}
        </ScrollView>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalFull, { width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }]}>
                <SafeAreaView style={{flex:1}}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>NOVA AVALIAÇÃO</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.text} /></TouchableOpacity>
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
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#32ADE6' }]} onPress={handleSaveAssessment}><Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR RESULTADOS</Text></TouchableOpacity>
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
                    <Text style={[styles.detailsTitle, { color: '#32ADE6' }]}>DETALHES DA AVALIAÇÃO</Text>
                    <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
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
                        
                        {/* 🔥 RENDERIZAÇÃO DIRETA LENDO AS COLUNAS DO BANCO DE DADOS */}
                        {(selectedAssessment.method === 'POLLOCK') && (
                            <>
                                <Text style={[styles.detailSection, { color: '#32ADE6' }]}>DOBRAS POLOCK 7 (mm)</Text>
                                <View style={styles.foldsGrid}>
                                    <View style={styles.foldItem}><Text style={[styles.foldName, {color: theme.textSecondary}]}>Peitoral:</Text><Text style={[styles.foldVal, {color: theme.text}]}>{selectedAssessment.foldChest || '-'}</Text></View>
                                    <View style={styles.foldItem}><Text style={[styles.foldName, {color: theme.textSecondary}]}>Axilar:</Text><Text style={[styles.foldVal, {color: theme.text}]}>{selectedAssessment.foldAxillary || '-'}</Text></View>
                                    <View style={styles.foldItem}><Text style={[styles.foldName, {color: theme.textSecondary}]}>Tríceps:</Text><Text style={[styles.foldVal, {color: theme.text}]}>{selectedAssessment.foldTriceps || '-'}</Text></View>
                                    <View style={styles.foldItem}><Text style={[styles.foldName, {color: theme.textSecondary}]}>Subescapular:</Text><Text style={[styles.foldVal, {color: theme.text}]}>{selectedAssessment.foldSubscapular || '-'}</Text></View>
                                    <View style={styles.foldItem}><Text style={[styles.foldName, {color: theme.textSecondary}]}>Abdominal:</Text><Text style={[styles.foldVal, {color: theme.text}]}>{selectedAssessment.foldAbdominal || '-'}</Text></View>
                                    <View style={styles.foldItem}><Text style={[styles.foldName, {color: theme.textSecondary}]}>Supra-ilíaca:</Text><Text style={[styles.foldVal, {color: theme.text}]}>{selectedAssessment.foldSuprailiac || '-'}</Text></View>
                                    <View style={styles.foldItem}><Text style={[styles.foldName, {color: theme.textSecondary}]}>Coxa:</Text><Text style={[styles.foldVal, {color: theme.text}]}>{selectedAssessment.foldThigh || '-'}</Text></View>
                                </View>
                            </>
                        )}

                        {/* Imprime Básicas se tiver preenchido cintura ou abdomen */}
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

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0, 
  },
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
  chart: { marginVertical: 8, borderRadius: 16, alignSelf: 'center' },
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
  input: { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 15 },
  configRow: { flexDirection:'row', marginBottom:15, marginTop: 10 },
  sectionHeader: { fontWeight: 'bold', marginTop: 25, marginBottom: 15, borderBottomWidth: 1, paddingBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '31%', marginBottom: 15 },
  miniLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  miniInput: { padding: 12, borderRadius: 12, borderWidth: 1, textAlign: 'center', fontSize: 15 },
  hint: { fontSize: 11, fontStyle: 'italic', marginTop: 15, textAlign: 'center' },
  saveBtn: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 35, marginBottom: 50 },
  saveBtnText: { fontWeight: '900', fontSize: 16 },

  detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  detailsCard: { borderRadius: 24, padding: 25, maxHeight: '80%', borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 15 },
  detailsTitle: { fontSize: 16, fontWeight: '900' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 8 },
  detailLabel: { fontWeight: 'bold', fontSize: 13 },
  detailValue: { fontWeight: '900', fontSize: 15 },
  resultBox: { flexDirection: 'row', borderRadius: 16, padding: 20, justifyContent: 'space-around', marginVertical: 20 },
  resultLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
  resultValue: { fontSize: 22, fontWeight: '900' },
  detailSection: { fontWeight: 'bold', fontSize: 13, marginTop: 15, marginBottom: 15 },
  
  foldsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  foldItem: { width: '48%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 4 },
  foldName: { fontSize: 12, fontWeight: 'bold' },
  foldVal: { fontSize: 13, fontWeight: '900' }
});