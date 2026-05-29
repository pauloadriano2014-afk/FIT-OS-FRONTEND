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
import AddAssessmentModal from '../modals/AddAssessmentModal';
import AssessmentDetailsModal from '../modals/AssessmentDetailsModal';
import CheckinDetailsModal from '../modals/CheckinDetailsModal';

const { width } = Dimensions.get('window');

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

  const currentAge = aluno.birthDate ? getAgeFromDate(aluno.birthDate) : '';
  const currentGender = aluno.gender ? aluno.gender.toUpperCase() : 'MASCULINO';

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

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 SOLUÇÃO DEFINITIVA PARA O BOTÃO VOLTAR NA WEB 🔥
  const handleGoBack = () => {
      if (navigation.canGoBack()) {
          navigation.goBack();
      } else if (Platform.OS === 'web') {
          // Usa o histórico nativo do navegador caso o React Navigation perca a pilha no F5
          window.history.back();
      } else {
          navigation.goBack();
      }
  };

  // 🔥 SOLUÇÃO DEFINITIVA PARA O BOTÃO EXCLUIR 🔥
  const handleDelete = (id) => {
      if (Platform.OS === 'web') {
          if (window.confirm("Tem certeza que deseja apagar esta avaliação?")) {
              fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE' })
              .then(() => loadData())
              .catch(e => window.alert("Erro ao excluir: " + e.message));
          }
      } else {
          Alert.alert("Excluir", "Apagar esta avaliação?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Apagar", style: 'destructive', onPress: async () => {
                  try {
                      await fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE' });
                      loadData();
                  } catch(e) {
                      Alert.alert("Erro", "Não foi possível excluir.");
                  }
              }}
          ]);
      }
  };

  const openDetails = (item) => {
      setSelectedAssessment(item);
      setDetailsVisible(true);
  };

  const isWeb = Platform.OS === 'web';
  const chartWidth = isWeb ? 440 : width - 40; 
  const chartData = {
      labels: assessmentHistory.slice(-6).map(a => `${new Date(a.date).getDate()}/${new Date(a.date).getMonth()+1}`),
      datasets: [{ data: assessmentHistory.length > 0 ? assessmentHistory.slice(-6).map(a => a.weight) : [0] }]
  };

  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg };

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
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'AVALIACAO' ? { borderBottomColor: theme.accent, borderBottomWidth: 2 } : null]} 
                onPress={() => setActiveTab('AVALIACAO')}
              >
                  <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'AVALIACAO' ? { color: theme.text } : null]}>AVALIAÇÃO</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'CHECKINS' ? { borderBottomColor: theme.accent, borderBottomWidth: 2 } : null]} 
                onPress={() => setActiveTab('CHECKINS')}
              >
                  <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'CHECKINS' ? { color: theme.text } : null]}>CHECK-INS</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'FEEDBACK' ? { borderBottomColor: theme.accent, borderBottomWidth: 2 } : null]} 
                onPress={() => setActiveTab('FEEDBACK')}
              >
                  <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'FEEDBACK' ? { color: theme.text } : null]}>TREINOS</Text>
              </TouchableOpacity>
          </View>

          {loading ? (
              <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                <ActivityIndicator color={theme.accent} size="large"/>
              </View>
          ) : (
              <View style={{ flex: 1 }}>
                
                {activeTab === 'AVALIACAO' ? (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={styles.infoText}>IDADE: {currentAge || '--'} anos</Text>
                            <Text style={styles.infoText}>SEXO: {currentGender}</Text>
                        </View>

                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.accent }]} onPress={() => setModalVisible(true)}>
                            <MaterialCommunityIcons name="plus" size={22} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.addBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>NOVA AVALIAÇÃO</Text>
                        </TouchableOpacity>

                        {assessmentHistory.length > 1 ? (
                            <View style={{alignItems:'center', marginVertical:20}}>
                                <Text style={[styles.chartTitle, { color: theme.text }]}>EVOLUÇÃO DE PESO</Text>
                                <LineChart
                                    data={chartData}
                                    width={chartWidth}
                                    height={200}
                                    chartConfig={{
                                        backgroundGradientFrom: theme.surface, 
                                        backgroundGradientTo: theme.surface,
                                        color: (opacity = 1) => theme.isDark ? `rgba(77, 227, 143, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                                        labelColor: (opacity = 1) => theme.text,
                                        propsForDots: { r: "4", strokeWidth: "2", stroke: theme.accent }
                                    }}
                                    bezier
                                    style={{borderRadius: 16, borderWidth: 1, borderColor: theme.border}}
                                />
                            </View>
                        ) : null}

                        <Text style={styles.sectionTitle}>HISTÓRICO COMPLETO</Text>
                        {assessmentHistory.slice().reverse().map(item => (
                            // 🔥 CORREÇÃO DO CONFLITO DE CLIQUE (Bubbling): O container principal agora é uma View
                            <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.date, { color: theme.text }]}>{new Date(item.date).toLocaleDateString()}</Text>
                                    <View style={{flexDirection:'row', gap:10}}>
                                        <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.badgeText}>{item.method === 'POLLOCK' ? 'POLLOCK' : 'BÁSICO'}</Text></View>
                                        
                                        {/* Botão de excluir isolado */}
                                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{padding: 4}}>
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                
                                {/* Corpo do card clicável para abrir detalhes */}
                                <TouchableOpacity style={styles.cardBody} onPress={() => openDetails(item)}>
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

      <CheckinDetailsModal 
          visible={checkinModalVisible} 
          onClose={() => setCheckinModalVisible(false)} 
          theme={theme} 
          selectedCheckin={selectedCheckin} 
      />

      <AddAssessmentModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)} 
          onSuccess={() => { setModalVisible(false); loadData(); }} 
          theme={theme} 
          aluno={aluno} 
          isWeb={isWeb}
      />

      <AssessmentDetailsModal 
          visible={detailsVisible} 
          onClose={() => setDetailsVisible(false)} 
          theme={theme} 
          selectedAssessment={selectedAssessment} 
      />

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
  chartTitle: { fontSize:12, fontWeight:'bold', marginBottom:10 },
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
});