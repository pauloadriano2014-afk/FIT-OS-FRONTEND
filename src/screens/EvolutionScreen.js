import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- FÓRMULA DE JACKSON & POLLOCK 7 DOBRAS ---
const calculateBodyFat = (gender, age, rawFolds) => {
    const cleanVal = (v) => Number(String(v).replace(',', '.') || 0);
    const sum = cleanVal(rawFolds.chest) + cleanVal(rawFolds.axillary) + cleanVal(rawFolds.triceps) + 
                cleanVal(rawFolds.subscapular) + cleanVal(rawFolds.abdominal) + cleanVal(rawFolds.suprailiac) + 
                cleanVal(rawFolds.thigh);
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

  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  
  // MODAIS
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const [method, setMethod] = useState('BASICO');
  const [customDate, setCustomDate] = useState('');
  const [weight, setWeight] = useState('');
  const [currentAge, setCurrentAge] = useState('');
  const [currentGender, setCurrentGender] = useState('MASCULINO'); 
  const [measures, setMeasures] = useState({ waist: '', abdomen: '' });
  const [folds, setFolds] = useState({ chest:'', axillary:'', triceps:'', subscapular:'', abdominal:'', suprailiac:'', thigh:'' });

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
          
          // 1. Busca Avaliações
          const resAssess = await fetch(`https://fitos-final.onrender.com/api/assessment?userId=${user.id}`);
          const assessments = await resAssess.json();
          if (Array.isArray(assessments)) setAssessmentHistory(assessments);

          // 2. Busca Histórico de Treinos REAL (Nova Integração)
          const resHistory = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${user.id}&t=${Date.now()}`);
          const historyData = await resHistory.json();
          
          if (Array.isArray(historyData)) {
              // Processa os dados para calcular a Tonelagem (Volume)
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
      if (customDate && customDate.length !== 10) return Alert.alert("Erro", "Data inválida (DD/MM/AAAA).");

      let isoDate = new Date().toISOString();
      if (customDate) {
          const [day, month, year] = customDate.split('/');
          isoDate = new Date(`${year}-${month}-${day}T12:00:00`).toISOString();
      }
      
      let calculatedBF = null;
      if (method === 'POLLOCK') {
          if (!currentAge) return Alert.alert("Atenção", "Informe a IDADE para calcular o % de Gordura.");
          const cleanFolds = {};
          Object.keys(folds).forEach(k => cleanFolds[k] = folds[k].replace(',', '.'));
          calculatedBF = calculateBodyFat(currentGender, currentAge, cleanFolds);
      }

      const payload = {
          userId: userData.id,
          date: isoDate,
          weight: weight.replace(',', '.'), 
          method,
          measures: method === 'BASICO' ? measures : {},
          folds: method === 'POLLOCK' ? folds : {},
          bodyFat: calculatedBF
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
              Alert.alert("Sucesso", msg);
              setModalVisible(false);
              setWeight(''); setCustomDate(''); setFolds({});
              loadData(); 
          } else {
              Alert.alert("Erro ao Salvar", json.error || "Verifique os dados.");
          }
      } catch (e) {
          Alert.alert("Erro de Conexão", e.message);
      }
  };

  const openDetails = (item) => {
      setSelectedAssessment(item);
      setDetailsVisible(true);
  };

  // Cálculos para o Gráfico de Performance
  const totalTonnage = workoutHistory.reduce((acc, curr) => acc + (curr.tonnage || 0), 0);
  // Pega os últimos 6 treinos para o gráfico (do mais antigo pro mais novo)
  const chartWorkouts = [...workoutHistory].reverse().slice(-6); 
  
  const performanceChartData = {
    labels: chartWorkouts.map(h => h.dateFormatted || '?'),
    datasets: [{ 
        data: chartWorkouts.length > 0 ? chartWorkouts.map(h => h.tonnage / 1000) : [0], // Em Toneladas
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PAINEL EVOLUTIVO</Text>
        <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'PERFORMANCE' && styles.tabActive]} onPress={() => setActiveTab('PERFORMANCE')}><Text style={[styles.tabText, activeTab === 'PERFORMANCE' && {color:'#000'}]}>PERFORMANCE</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'CORPO' && styles.tabActive]} onPress={() => setActiveTab('CORPO')}><Text style={[styles.tabText, activeTab === 'CORPO' && {color:'#000'}]}>CORPO</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'PERFORMANCE' ? (
            <>
                <View style={styles.statsRow}>
                    <View style={styles.statCard}><MaterialCommunityIcons name="weight-lifter" size={24} color="#CCFF00" /><Text style={styles.statValue}>{(totalTonnage / 1000).toFixed(1)}t</Text><Text style={styles.statLabel}>VOLUME TOTAL</Text></View>
                    <View style={styles.statCard}><MaterialCommunityIcons name="fire" size={24} color="#FF3B30" /><Text style={styles.statValue}>{workoutHistory.length}</Text><Text style={styles.statLabel}>TREINOS</Text></View>
                </View>
                <Text style={styles.sectionTitle}>VOLUME DE CARGA (TONELADAS)</Text>
                {chartWorkouts.length > 1 ? (
                    <LineChart 
                        data={performanceChartData} 
                        width={width - 40} 
                        height={220} 
                        chartConfig={chartConfig} 
                        bezier 
                        style={styles.chart} 
                        yAxisSuffix="t"
                    />
                ) : (
                    <View style={styles.emptyChart}><Text style={styles.emptyText}>Realize pelo menos 2 treinos.</Text></View>
                )}
                <Text style={styles.sectionTitle}>HISTÓRICO RECENTE</Text>
                {workoutHistory.slice(0,5).map((item, i) => (
                    <View key={i} style={styles.historyCard}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                            {item.rpe && (
                                <View style={[styles.rpeBadge, {backgroundColor: item.rpe >= 8 ? '#FF3B30' : '#CCFF00'}]}>
                                    <Text style={styles.rpeText}>RPE {item.rpe}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.historyWorkout}>{item.name || 'Treino'}</Text>
                        <Text style={styles.historyTonnage}>{item.tonnage}kg totais movidos</Text>
                    </View>
                ))}
            </>
        ) : (
            <>
                <TouchableOpacity style={styles.newAssessmentBtn} onPress={() => setModalVisible(true)}>
                    <MaterialCommunityIcons name="plus-circle" size={24} color="#000" />
                    <Text style={styles.newAssessmentText}>REGISTRAR MEDIDAS / POLLOCK</Text>
                </TouchableOpacity>

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, {borderColor:'#32ADE6'}]}><MaterialCommunityIcons name="scale-bathroom" size={24} color="#32ADE6" /><Text style={styles.statValue}>{assessmentHistory[assessmentHistory.length-1]?.weight || '--'}kg</Text><Text style={[styles.statLabel, {color:'#32ADE6'}]}>PESO ATUAL</Text></View>
                    <View style={[styles.statCard, {borderColor:'#32ADE6'}]}><MaterialCommunityIcons name="percent" size={24} color="#32ADE6" /><Text style={styles.statValue}>{assessmentHistory[assessmentHistory.length-1]?.bodyFat || '--'}%</Text><Text style={[styles.statLabel, {color:'#32ADE6'}]}>GORDURA (BF)</Text></View>
                </View>

                <Text style={[styles.sectionTitle, {color:'#32ADE6'}]}>EVOLUÇÃO DO PESO CORPORAL</Text>
                {assessmentHistory.length > 1 ? (
                    <LineChart data={bodyChartData} width={width - 40} height={220} chartConfig={{...chartConfig, color: (opacity=1)=> `rgba(50, 173, 230, ${opacity})`}} bezier style={styles.chart} />
                ) : (
                    <View style={[styles.emptyChart, {borderColor:'#32ADE6'}]}><Text style={styles.emptyText}>Registre 2 avaliações para ver o gráfico.</Text></View>
                )}

                <Text style={[styles.sectionTitle, {color:'#32ADE6'}]}>HISTÓRICO (Toque para Detalhes)</Text>
                {sortedAssessments.slice().reverse().map((item) => (
                    <TouchableOpacity key={item.id} style={[styles.historyCard, {borderColor:'#222'}]} onPress={() => openDetails(item)}>
                        <View style={styles.historyHeader}>
                            <View>
                                <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                                <Text style={{color:'#666', fontSize:10, fontWeight:'bold'}}>{item.method === 'POLLOCK' ? 'POLLOCK 7' : 'BÁSICO'}</Text>
                            </View>
                            <MaterialCommunityIcons name="eye-outline" size={20} color="#32ADE6" />
                        </View>
                        <View style={{flexDirection:'row', gap:15, marginTop:5}}>
                            <Text style={{color:'#FFF', fontWeight:'bold'}}>Peso: {item.weight}kg</Text>
                            {item.bodyFat && <Text style={{color:'#32ADE6', fontWeight:'bold'}}>BF: {item.bodyFat}%</Text>}
                        </View>
                    </TouchableOpacity>
                ))}
            </>
        )}
      </ScrollView>

      {/* MODAL CADASTRO (MANTIDO IGUAL) */}
      <Modal visible={modalVisible} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalFull}>
            <SafeAreaView style={{flex:1}}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>NOVA AVALIAÇÃO</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color="#FFF" /></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{padding: 20}}>
                    <Text style={styles.label}>DATA (Opcional - Para Backdate)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={customDate} onChangeText={handleDateChange} placeholder="DD/MM/AAAA (Deixe vazio para Hoje)" placeholderTextColor="#555" maxLength={10} />
                    <View style={styles.switchRow}>
                        <TouchableOpacity style={[styles.switchBtn, method==='BASICO' && styles.switchActive]} onPress={()=>setMethod('BASICO')}><Text style={[styles.switchText, method==='BASICO' && {color:'#000'}]}>BÁSICO</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.switchBtn, method==='POLLOCK' && styles.switchActive]} onPress={()=>setMethod('POLLOCK')}><Text style={[styles.switchText, method==='POLLOCK' && {color:'#000'}]}>POLLOCK 7</Text></TouchableOpacity>
                    </View>
                    <Text style={styles.label}>PESO (KG)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} placeholder="Ex: 80.5" placeholderTextColor="#555" />
                    {method === 'POLLOCK' ? (
                        <>
                        <View style={styles.configRow}>
                            <View style={{flex:1}}><Text style={styles.label}>IDADE</Text><TextInput style={styles.input} keyboardType="numeric" value={currentAge} onChangeText={setCurrentAge} placeholder="Anos" placeholderTextColor="#555" /></View>
                            <View style={{flex:1, marginLeft:10}}><Text style={styles.label}>SEXO</Text><TouchableOpacity style={styles.input} onPress={() => setCurrentGender(currentGender==='MASCULINO'?'FEMININO':'MASCULINO')}><Text style={{color:'#FFF'}}>{currentGender}</Text></TouchableOpacity></View>
                        </View>
                        <Text style={styles.sectionHeader}>DOBRAS CUTÂNEAS (MM)</Text>
                        <View style={styles.grid}>
                            <View style={styles.gridItem}><Text style={styles.miniLabel}>PEITORAL</Text><TextInput style={styles.miniInput} keyboardType="numeric" onChangeText={t=>setFolds({...folds, chest:t})} /></View>
                            <View style={styles.gridItem}><Text style={styles.miniLabel}>AXILAR</Text><TextInput style={styles.miniInput} keyboardType="numeric" onChangeText={t=>setFolds({...folds, axillary:t})} /></View>
                            <View style={styles.gridItem}><Text style={styles.miniLabel}>TRÍCEPS</Text><TextInput style={styles.miniInput} keyboardType="numeric" onChangeText={t=>setFolds({...folds, triceps:t})} /></View>
                            <View style={styles.gridItem}><Text style={styles.miniLabel}>SUBESCAP.</Text><TextInput style={styles.miniInput} keyboardType="numeric" onChangeText={t=>setFolds({...folds, subscapular:t})} /></View>
                            <View style={styles.gridItem}><Text style={styles.miniLabel}>ABDOMINAL</Text><TextInput style={styles.miniInput} keyboardType="numeric" onChangeText={t=>setFolds({...folds, abdominal:t})} /></View>
                            <View style={styles.gridItem}><Text style={styles.miniLabel}>SUPRA-IL.</Text><TextInput style={styles.miniInput} keyboardType="numeric" onChangeText={t=>setFolds({...folds, suprailiac:t})} /></View>
                            <View style={styles.gridItem}><Text style={styles.miniLabel}>COXA</Text><TextInput style={styles.miniInput} keyboardType="numeric" onChangeText={t=>setFolds({...folds, thigh:t})} /></View>
                        </View>
                        <Text style={styles.hint}>O app usará idade e sexo para calcular o BF.</Text>
                        </>
                    ) : (
                        <>
                        <Text style={styles.label}>CINTURA (CM) - Opcional</Text><TextInput style={styles.input} keyboardType="numeric" onChangeText={t=>setMeasures({...measures, waist:t})} />
                        <Text style={styles.label}>ABDÔMEN (CM) - Opcional</Text><TextInput style={styles.input} keyboardType="numeric" onChangeText={t=>setMeasures({...measures, abdomen:t})} />
                        </>
                    )}
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAssessment}><Text style={styles.saveBtnText}>SALVAR RESULTADOS</Text></TouchableOpacity>
                    <View style={{height: 100}} /> 
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DETALHES (MANTIDO IGUAL) */}
      <Modal visible={detailsVisible} transparent animationType="fade">
        <View style={styles.detailsOverlay}>
            <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                    <Text style={styles.detailsTitle}>DETALHES DA AVALIAÇÃO</Text>
                    <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                        <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                
                {selectedAssessment && (
                    <ScrollView>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>DATA:</Text>
                            <Text style={styles.detailValue}>{new Date(selectedAssessment.date).toLocaleDateString('pt-BR')}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>PESO:</Text>
                            <Text style={styles.detailValue}>{selectedAssessment.weight} kg</Text>
                        </View>
                        {selectedAssessment.bodyFat && (
                            <View style={styles.resultBox}>
                                <View style={{alignItems:'center'}}>
                                    <Text style={styles.resultLabel}>GORDURA</Text>
                                    <Text style={styles.resultValue}>{selectedAssessment.bodyFat}%</Text>
                                </View>
                                <View style={{height:30, width:1, backgroundColor:'#444'}}/>
                                <View style={{alignItems:'center'}}>
                                    <Text style={styles.resultLabel}>MASSA MAGRA</Text>
                                    <Text style={styles.resultValue}>{(selectedAssessment.weight * (1 - selectedAssessment.bodyFat/100)).toFixed(1)} kg</Text>
                                </View>
                            </View>
                        )}
                        {/* ... Resto dos detalhes Pollock ... */}
                        {(selectedAssessment.waist || selectedAssessment.abdomen) && (
                            <>
                                <Text style={styles.detailSection}>MEDIDAS (cm)</Text>
                                <View style={styles.detailRow}><Text style={styles.detailLabel}>Cintura:</Text><Text style={styles.detailValue}>{selectedAssessment.waist || '-'} cm</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailLabel}>Abdômen:</Text><Text style={styles.detailValue}>{selectedAssessment.abdomen || '-'} cm</Text></View>
                            </>
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const chartConfig = { backgroundGradientFrom: "#0A0A0A", backgroundGradientTo: "#0A0A0A", color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`, labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, strokeWidth: 2, propsForDots: { r: "4", strokeWidth: "2", stroke: "#CCFF00" } };

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    // 🔥 CORREÇÃO: Topo seguro
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0, 
  },
  header: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 15, textAlign: 'center', letterSpacing: 1 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 10, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#CCFF00' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  scrollContent: { padding: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { backgroundColor: '#0A0A0A', width: '48%', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#1A1A1A', alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: '900', marginVertical: 5 },
  statLabel: { color: '#444', fontSize: 9, fontWeight: '900' },
  sectionTitle: { color: '#CCFF00', fontSize: 12, fontWeight: '900', marginBottom: 15, marginTop: 10, letterSpacing: 1 },
  chart: { marginVertical: 8, borderRadius: 16, alignSelf: 'center' },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 20, borderWidth:1, borderColor:'#222' },
  emptyText: { color: '#333', fontWeight: 'bold' },
  historyCard: { backgroundColor: '#0A0A0A', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1A' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDate: { color: '#555', fontSize: 10, fontWeight: '900' },
  rpeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rpeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  historyWorkout: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  historyTonnage: { color: '#CCFF00', fontSize: 12, fontWeight: '900', marginTop: 4 },
  newAssessmentBtn: { flexDirection: 'row', backgroundColor: '#32ADE6', padding: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 25 },
  newAssessmentText: { color: '#000', fontWeight: '900', fontSize: 14 },
  
  // MODAL STYLES
  modalFull: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222', marginTop: Platform.OS === 'android' ? 20 : 0 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  switchRow: { flexDirection: 'row', backgroundColor: '#222', borderRadius: 8, padding: 4, marginBottom: 20 },
  switchBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  switchActive: { backgroundColor: '#32ADE6' },
  switchText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  label: { color: '#32ADE6', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#111', color: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  configRow: { flexDirection:'row', marginBottom:10 },
  sectionHeader: { color: '#FFF', fontWeight: 'bold', marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '30%', marginBottom: 10 },
  miniLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  miniInput: { backgroundColor: '#111', color: '#FFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#333', textAlign: 'center' },
  hint: { color: '#666', fontSize: 10, fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  saveBtn: { backgroundColor: '#32ADE6', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  saveBtnText: { fontWeight: '900', fontSize: 16 },

  // ESTILOS DO MODAL DE DETALHES
  detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  detailsCard: { backgroundColor: '#111', borderRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: '#333' },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 15 },
  detailsTitle: { color: '#32ADE6', fontSize: 16, fontWeight: '900' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', paddingBottom: 5 },
  detailLabel: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  detailValue: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  resultBox: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 15, justifyContent: 'space-around', marginVertical: 15 },
  resultLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  resultValue: { color: '#32ADE6', fontSize: 18, fontWeight: '900' },
  detailSection: { color: '#CCFF00', fontWeight: 'bold', fontSize: 12, marginTop: 10, marginBottom: 10 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridBox: { width: '30%', backgroundColor: '#000', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 5 },
  gridLabel: { color: '#666', fontSize: 10, marginBottom: 2 },
  gridVal: { color: '#FFF', fontWeight: 'bold' }
});