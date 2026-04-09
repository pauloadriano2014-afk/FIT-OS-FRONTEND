import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, FlatList, Image, StatusBar 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// --- FÓRMULAS E UTILITÁRIOS ---
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

const getRpeInfo = (val) => {
    if (val >= 9) return { label: 'FALHA', color: '#BF5AF2' };
    if (val >= 8) return { label: 'INTENSO', color: '#FF3B30' };
    if (val >= 6) return { label: 'MÉDIO', color: '#FF9500' };
    if (val >= 4) return { label: 'MODERADO', color: '#FFCC00' };
    return { label: 'LEVE', color: '#32ADE6' };
};

export default function AdminEvolutionScreen({ route, navigation }) {
const rawId = route.params?.alunoId || route.params?.aluno?.id || '';
const rawName = route.params?.alunoName || route.params?.aluno?.name || 'ALUNO';
const rawBirthDate = route.params?.alunoBirthDate || route.params?.aluno?.birthDate || '';
const rawGender = route.params?.alunoGender || route.params?.aluno?.gender || '';
const aluno = { id: rawId, name: rawName, birthDate: rawBirthDate, gender: rawGender };
 
  const { theme } = useTheme(); // 🔥 PUXA O TEMA AQUI

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

  const [method, setMethod] = useState('BASICO');
  const [customDate, setCustomDate] = useState('');
  const [weight, setWeight] = useState('');
  
  const [currentAge, setCurrentAge] = useState(aluno.birthDate ? getAgeFromDate(aluno.birthDate) : '');
  const [currentGender, setCurrentGender] = useState(aluno.gender ? aluno.gender.toUpperCase() : 'MASCULINO');
  
  const [measures, setMeasures] = useState({ waist: '', abdomen: '' });
  const [folds, setFolds] = useState({ chest:'', axillary:'', triceps:'', subscapular:'', abdominal:'', suprailiac:'', thigh:'' });

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

  const handleDelete = (id) => {
      Alert.alert("Excluir", "Apagar esta avaliação?", [
          { text: "Cancelar" },
          { text: "Apagar", style: 'destructive', onPress: async () => {
              await fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE' });
              loadData();
          }}
      ]);
  };

  const handleSave = async () => {
      if (!weight) return Alert.alert("Erro", "Peso é obrigatório.");
      
      let isoDate = new Date().toISOString();
      if (customDate) {
          if(customDate.length !== 10) return Alert.alert("Erro", "Data inválida");
          const [d, m, y] = customDate.split('/');
          isoDate = new Date(`${y}-${m}-${d}T12:00:00`).toISOString();
      }

      let calculatedBF = null;
      if (method === 'POLLOCK') {
          if (!currentAge) return Alert.alert("Erro", "Idade necessária.");
          const cleanFolds = {};
          Object.keys(folds).forEach(k => cleanFolds[k] = String(folds[k]).replace(',', '.'));
          calculatedBF = calculateBodyFat(currentGender, currentAge, cleanFolds);
      }

      const payload = {
          userId: aluno.id,
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
          if (res.ok) {
              Alert.alert("Sucesso", "Avaliação registrada!");
              setModalVisible(false);
              setWeight('');
              setCustomDate('');
              setFolds({});
              loadData();
          } else {
              Alert.alert("Erro", "Falha ao salvar.");
          }
      } catch (e) { Alert.alert("Erro", e.message); }
  };

  const openDetails = (item) => {
      setSelectedAssessment(item);
      setDetailsVisible(true);
  };

  // 🔥 LÓGICA DO GRÁFICO (Cores adaptativas)
  const isWeb = Platform.OS === 'web';
  const chartWidth = isWeb ? 440 : width - 40; 
  const chartData = {
      labels: assessmentHistory.slice(-6).map(a => `${new Date(a.date).getDate()}/${new Date(a.date).getMonth()+1}`),
      datasets: [{ data: assessmentHistory.length > 0 ? assessmentHistory.slice(-6).map(a => a.weight) : [0] }]
  };

  const renderWorkoutLogItem = ({ item }) => {
      const rpeInfo = item.rpe ? getRpeInfo(item.rpe) : null;
      return (
        <View style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.logHeader}>
                <View>
                    <Text style={[styles.logTitle, { color: theme.text }]}>{item.name}</Text>
                    <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()} • {item.duration || 60} min</Text>
                </View>
                {rpeInfo && (
                    <View style={{alignItems:'flex-end'}}>
                        <View style={[styles.rpeBadge, {backgroundColor: rpeInfo.color}]}>
                            <Text style={styles.rpeVal}>{item.rpe}</Text>
                        </View>
                        <Text style={[styles.rpeLabelName, {color: rpeInfo.color}]}>{rpeInfo.label}</Text>
                    </View>
                )}
            </View>
            
            {item.feedback ? (
                <View style={[styles.feedbackContainer, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <View style={{flexDirection:'row', alignItems:'center', gap:5, marginBottom:5}}>
                        <MaterialCommunityIcons name="text-box-outline" size={14} color={theme.textSecondary} />
                        <Text style={styles.feedbackLabel}>OBSERVAÇÃO DO ALUNO:</Text>
                    </View>
                    <Text style={[styles.feedbackText, { color: theme.text }]}>{item.feedback}</Text>
                </View>
            ) : (
                <View style={[styles.feedbackContainer, { opacity:0.5, backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={styles.noFeedback}>Sem observações.</Text>
                </View>
            )}
        </View>
      );
  };

  const renderCheckinItem = ({ item }) => (
      <TouchableOpacity 
        style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]} 
        onPress={() => { setSelectedCheckin(item); setCheckinModalVisible(true); }}
      >
          <View style={styles.logHeader}>
              <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                  <View style={[styles.rpeBadge, {backgroundColor: 'rgba(50, 173, 230, 0.2)', width:36, height:36}]}>
                      <MaterialCommunityIcons name="camera-outline" size={20} color="#32ADE6" />
                  </View>
                  <View>
                      <Text style={[styles.logTitle, {color:'#32ADE6'}]}>CHECK-IN SEMANAL</Text>
                      <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                  </View>
              </View>
              <Text style={{color: theme.text, fontWeight:'bold', fontSize:16}}>{item.weight ? `${item.weight} kg` : ''}</Text>
          </View>
          
          {item.feedback && (
              <View style={[styles.feedbackContainer, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                  <Text style={[styles.feedbackText, { color: theme.text }]} numberOfLines={2}>"{item.feedback}"</Text>
              </View>
          )}
          <View style={{alignItems:'center', marginTop:10}}>
              <Text style={{color: theme.textSecondary, fontSize:10, fontWeight:'bold'}}>TOQUE PARA VER FOTOS &gt;</Text>
          </View>
      </TouchableOpacity>
  );

  // 🔥 LÓGICA DE CONTENÇÃO DO PWA (Gaiola Central)
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg };

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      {/* GAIOLA CENTRALIZADA PARA PWA */}
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{padding:5}}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>PRONTUÁRIO: <Text style={{ color: theme.accent }}>{aluno.name?.split(' ')[0].toUpperCase()}</Text></Text>
            <View style={{width:24}} />
          </View>

          {/* ABAS DE NAVEGAÇÃO */}
          <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'AVALIACAO' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} 
                onPress={() => setActiveTab('AVALIACAO')}
              >
                  <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'AVALIACAO' && { color: theme.text }]}>AVALIAÇÃO</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'CHECKINS' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} 
                onPress={() => setActiveTab('CHECKINS')}
              >
                  <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'CHECKINS' && { color: theme.text }]}>CHECK-INS</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'FEEDBACK' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} 
                onPress={() => setActiveTab('FEEDBACK')}
              >
                  <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'FEEDBACK' && { color: theme.text }]}>TREINOS</Text>
              </TouchableOpacity>
          </View>

          {loading ? (
              <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                <ActivityIndicator color={theme.accent} size="large"/>
              </View>
          ) : (
              <View style={{ flex: 1 }}>
                
                {/* ABA AVALIAÇÃO FÍSICA */}
                {activeTab === 'AVALIACAO' && (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={styles.infoText}>IDADE: {currentAge || '--'} anos</Text>
                            <Text style={styles.infoText}>SEXO: {currentGender}</Text>
                        </View>

                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.accent }]} onPress={() => setModalVisible(true)}>
                            <MaterialCommunityIcons name="plus" size={22} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.addBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>NOVA AVALIAÇÃO</Text>
                        </TouchableOpacity>

                        {assessmentHistory.length > 1 && (
                            <View style={{alignItems:'center', marginVertical:20}}>
                                <Text style={[styles.chartTitle, { color: theme.text }]}>EVOLUÇÃO DE PESO</Text>
                                <LineChart
                                    data={chartData}
                                    width={chartWidth}
                                    height={200}
                                    chartConfig={{
                                        backgroundGradientFrom: theme.surface, 
                                        backgroundGradientTo: theme.surface,
                                        color: (opacity = 1) => theme.isDark ? `rgba(204, 255, 0, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                                        labelColor: (opacity = 1) => theme.text,
                                        propsForDots: { r: "4", strokeWidth: "2", stroke: theme.accent }
                                    }}
                                    bezier
                                    style={{borderRadius: 16, borderWidth: 1, borderColor: theme.border}}
                                />
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>HISTÓRICO COMPLETO</Text>
                        {assessmentHistory.slice().reverse().map(item => (
                            <TouchableOpacity key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => openDetails(item)}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.date, { color: theme.text }]}>{new Date(item.date).toLocaleDateString()}</Text>
                                    <View style={{flexDirection:'row', gap:10}}>
                                        <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.badgeText}>{item.method === 'POLLOCK' ? 'POLLOCK' : 'BÁSICO'}</Text></View>
                                        <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.cardBody}>
                                    <View style={styles.stat}><Text style={styles.label}>PESO</Text><Text style={[styles.val, { color: theme.text }]}>{item.weight}kg</Text></View>
                                    {item.bodyFat && <View style={styles.stat}><Text style={styles.label}>GORDURA</Text><Text style={[styles.val, {color: theme.accent}]}>{item.bodyFat}%</Text></View>}
                                    {item.waist && <View style={styles.stat}><Text style={styles.label}>CINTURA</Text><Text style={[styles.val, { color: theme.text }]}>{item.waist}cm</Text></View>}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* ABA CHECK-INS */}
                {activeTab === 'CHECKINS' && (
                    <FlatList 
                        data={checkinHistory}
                        keyExtractor={item => item.id}
                        renderItem={renderCheckinItem}
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.empty}>Nenhum check-in enviado.</Text>}
                    />
                )}

                {/* ABA FEEDBACKS DE TREINOS */}
                {activeTab === 'FEEDBACK' && (
                    <FlatList 
                        data={workoutLogs}
                        keyExtractor={item => item.id}
                        renderItem={renderWorkoutLogItem}
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.empty}>Nenhum treino finalizado.</Text>}
                    />
                )}

              </View>
          )}
      </View>

      {/* MODAL DETALHES CHECK-IN */}
      <Modal visible={checkinModalVisible} animationType="slide" transparent>
        <View style={styles.detailsOverlay}>
            <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.detailsTitle, { color: theme.accent }]}>CHECK-IN DETALHES</Text>
                    <TouchableOpacity onPress={() => setCheckinModalVisible(false)}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
                
                {selectedCheckin && (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>DATA:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{new Date(selectedCheckin.date).toLocaleDateString('pt-BR')}</Text></View>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>PESO:</Text><Text style={[styles.detailValue, {color:'#32ADE6', fontSize:20}]}>{selectedCheckin.weight} kg</Text></View>
                        
                        {selectedCheckin.feedback && (
                            <View style={[styles.feedbackContainer, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                                <Text style={[styles.feedbackText, { color: theme.text }]}>"{selectedCheckin.feedback}"</Text>
                            </View>
                        )}

                        <Text style={{color: theme.textSecondary, marginTop:15, marginBottom:10, fontWeight:'bold', fontSize:12}}>FOTOS ENVIADAS:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10, paddingBottom:10}}>
                            {selectedCheckin.photoFront && (
                                <View style={{alignItems:'center'}}>
                                    <Image source={{uri: selectedCheckin.photoFront}} style={[styles.photo, { borderColor: theme.border }]} />
                                    <Text style={{color: theme.textSecondary, fontSize:10, marginTop:5, fontWeight:'bold'}}>FRENTE</Text>
                                </View>
                            )}
                            {selectedCheckin.photoSide && (
                                <View style={{alignItems:'center'}}>
                                    <Image source={{uri: selectedCheckin.photoSide}} style={[styles.photo, { borderColor: theme.border }]} />
                                    <Text style={{color: theme.textSecondary, fontSize:10, marginTop:5, fontWeight:'bold'}}>LADO</Text>
                                </View>
                            )}
                            {selectedCheckin.photoBack && (
                                <View style={{alignItems:'center'}}>
                                    <Image source={{uri: selectedCheckin.photoBack}} style={[styles.photo, { borderColor: theme.border }]} />
                                    <Text style={{color: theme.textSecondary, fontSize:10, marginTop:5, fontWeight:'bold'}}>COSTAS</Text>
                                </View>
                            )}
                        </ScrollView>
                    </ScrollView>
                )}
            </View>
        </View>
      </Modal>

      {/* MODAL DE CADASTRO AVALIAÇÃO */}
      <Modal visible={modalVisible} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center' }}>
            <SafeAreaView style={{ flex:1, width: '100%', maxWidth: isWeb ? 480 : '100%', ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>REGISTRAR DADOS</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.text} /></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{padding:20}}>
                    <Text style={[styles.inputLabel, { color: theme.accent }]}>DATA (Opcional)</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="DD/MM/AAAA" placeholderTextColor={theme.textSecondary} value={customDate} onChangeText={(t) => {
                        let v = t.replace(/[^0-9]/g, '');
                        if(v.length>2) v = v.slice(0,2)+'/'+v.slice(2);
                        if(v.length>5) v = v.slice(0,5)+'/'+v.slice(5);
                        if(v.length>10) v = v.slice(0,10);
                        setCustomDate(v);
                    }} keyboardType="numeric" maxLength={10}/>

                    <View style={[styles.switchRow, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                        <TouchableOpacity style={[styles.switchBtn, method==='BASICO' && {backgroundColor: theme.accent}]} onPress={()=>setMethod('BASICO')}><Text style={[styles.switchText, method==='BASICO' && {color: theme.isDark ? '#000' : '#FFF'}]}>BÁSICO</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.switchBtn, method==='POLLOCK' && {backgroundColor: theme.accent}]} onPress={()=>setMethod('POLLOCK')}><Text style={[styles.switchText, method==='POLLOCK' && {color: theme.isDark ? '#000' : '#FFF'}]}>POLLOCK 7</Text></TouchableOpacity>
                    </View>

                    <Text style={[styles.inputLabel, { color: theme.accent }]}>PESO (KG)</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={weight} onChangeText={setWeight} />

                    {method === 'BASICO' ? (
                        <>
                            <Text style={[styles.inputLabel, { color: theme.accent }]}>CINTURA (CM)</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" onChangeText={t=>setMeasures({...measures, waist:t})} />
                            <Text style={[styles.inputLabel, { color: theme.accent }]}>ABDÔMEN (CM)</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" onChangeText={t=>setMeasures({...measures, abdomen:t})} />
                        </>
                    ) : (
                        <>
                            <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
                                <View style={{flex:1}}><Text style={[styles.inputLabel, { color: theme.accent }]}>IDADE</Text><TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={currentAge} onChangeText={setCurrentAge} /></View>
                                <View style={{flex:1}}><Text style={[styles.inputLabel, { color: theme.accent }]}>SEXO</Text><TouchableOpacity style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent:'center' }]} onPress={()=>setCurrentGender(currentGender==='MASCULINO'?'FEMININO':'MASCULINO')}><Text style={{color: theme.text}}>{currentGender}</Text></TouchableOpacity></View>
                            </View>
                            <Text style={{color: theme.accent, fontWeight:'bold', marginBottom:10}}>DOBRAS (MM)</Text>
                            <View style={{flexDirection:'row', flexWrap:'wrap', gap:10}}>
                                {['chest','axillary','triceps','subscapular','abdominal','suprailiac','thigh'].map(key => (
                                    <View key={key} style={{width:'30%'}}>
                                        <Text style={{color: theme.textSecondary, fontSize:10, marginBottom:2}}>{key.toUpperCase().slice(0,8)}</Text>
                                        <TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" onChangeText={t => setFolds(prev => ({...prev, [key]: t}))} />
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
                        <Text style={{fontWeight:'900', fontSize:16, color: theme.isDark ? '#000' : '#FFF'}}>SALVAR NO PERFIL</Text>
                    </TouchableOpacity>
                    <View style={{height:50}}/>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DETALHES AVALIACAO */}
      <Modal visible={detailsVisible} transparent animationType="fade">
        <View style={styles.detailsOverlay}>
            <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.detailsTitle, { color: theme.accent }]}>DETALHES</Text>
                    <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
                
                {selectedAssessment && (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>DATA:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{new Date(selectedAssessment.date).toLocaleDateString('pt-BR')}</Text></View>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>PESO:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{selectedAssessment.weight} kg</Text></View>
                        
                        {selectedAssessment.bodyFat && (
                            <View style={[styles.resultBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                                <View style={{alignItems:'center'}}><Text style={styles.resultLabel}>GORDURA</Text><Text style={[styles.resultValue, { color: theme.accent }]}>{selectedAssessment.bodyFat}%</Text></View>
                                <View style={{height:30, width:1, backgroundColor: theme.border}}/>
                                <View style={{alignItems:'center'}}><Text style={styles.resultLabel}>MASSA MAGRA</Text><Text style={[styles.resultValue, { color: theme.text }]}>{(selectedAssessment.weight * (1 - selectedAssessment.bodyFat/100)).toFixed(1)} kg</Text></View>
                            </View>
                        )}

                        {selectedAssessment.method === 'POLLOCK' && (
                            <>
                                <Text style={[styles.detailSection, { color: theme.accent }]}>DOBRAS (mm)</Text>
                                <View style={styles.detailGrid}>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Peitoral</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldChest || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Axilar</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldAxillary || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Tríceps</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldTriceps || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Subescap.</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldSubscapular || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Abdom.</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldAbdominal || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Supra-il.</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldSuprailiac || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Coxa</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldThigh || '-'}</Text></View>
                                </View>
                            </>
                        )}
                        {(selectedAssessment.waist || selectedAssessment.abdomen) && (
                            <>
                                <Text style={[styles.detailSection, { color: theme.accent }]}>MEDIDAS (cm)</Text>
                                <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>Cintura:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{selectedAssessment.waist || '-'} cm</Text></View>
                                <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>Abdômen:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{selectedAssessment.abdomen || '-'} cm</Text></View>
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
  header: { flexDirection:'row', alignItems:'center', padding:20, paddingTop: Platform.OS === 'android' ? 10 : 20, justifyContent:'space-between', borderBottomWidth: 1 },
  headerTitle: { fontWeight:'bold', fontSize:16 },
  
  // TABS
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
  
  // CARDS GERAIS
  card: { padding:15, borderRadius:12, marginBottom:10, borderWidth:1 },
  cardHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  date: { fontWeight:'bold' },
  badge: { paddingHorizontal:6, borderRadius:4, marginRight:10 },
  badgeText: { color:'#888', fontSize:10, fontWeight:'bold' },
  cardBody: { flexDirection:'row', gap:20 },
  stat: { alignItems:'flex-start' },
  label: { color:'#888', fontSize:10, fontWeight:'bold' },
  val: { fontSize:16, fontWeight:'bold' },

  // LOGS (FEEDBACK CARD)
  logCard: { padding:15, borderRadius:12, marginBottom:15, borderWidth:1 },
  logHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  logTitle: { fontSize:14, fontWeight:'bold', marginBottom:4 },
  logDate: { color:'#888', fontSize:10 },
  
  rpeBadge: { alignItems:'center', justifyContent:'center', borderRadius:6, width:24, height:24, alignSelf:'flex-end' },
  rpeVal: { fontWeight:'900', fontSize:12, color:'#000' }, 
  rpeLabelName: { fontSize:8, fontWeight:'bold', marginTop:2, textAlign:'right' },

  feedbackContainer: { padding:12, borderRadius:8, marginTop:5 },
  feedbackLabel: { color:'#888', fontSize:9, fontWeight:'bold' },
  feedbackText: { fontSize:13, fontStyle:'italic', lineHeight: 18 },
  noFeedback: { color:'#888', fontSize:12, fontStyle:'italic' },
  empty: { color:'#888', textAlign:'center', marginTop:50 },

  // MODAL CADASTRO 
  modalHeader: { padding:20, flexDirection:'row', justifyContent:'space-between', borderBottomWidth:1, marginTop: Platform.OS === 'android' ? 20 : 0 },
  modalTitle: { fontWeight:'bold', fontSize:18 },
  inputLabel: { fontSize:12, fontWeight:'bold', marginBottom:5, marginTop:10 },
  input: { padding:12, borderRadius:8, borderWidth:1 },
  switchRow: { flexDirection:'row', borderRadius:8, padding:4, marginTop:10 },
  switchBtn: { flex:1, padding:10, alignItems:'center', borderRadius:6 },
  switchText: { fontWeight:'bold', fontSize:12 },
  miniInput: { padding:8, borderRadius:6, borderWidth:1, textAlign:'center' },
  saveBtn: { padding:15, borderRadius:10, alignItems:'center', marginTop:30 },

  // MODAL DETALHES
  detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  detailsCard: { borderRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 15 },
  detailsTitle: { fontSize: 16, fontWeight: '900' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 5 },
  detailLabel: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  detailValue: { fontWeight: 'bold', fontSize: 14 },
  resultBox: { flexDirection: 'row', borderRadius: 10, padding: 15, justifyContent: 'space-around', marginVertical: 15 },
  resultLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  resultValue: { fontSize: 18, fontWeight: '900' },
  detailSection: { fontWeight: 'bold', fontSize: 12, marginTop: 10, marginBottom: 10 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridBox: { width: '30%', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 5 },
  gridLabel: { color: '#888', fontSize: 10, marginBottom: 2 },
  gridVal: { fontWeight: 'bold' },
  
  photoContainer: { marginRight: 15, alignItems: 'center' },
  photo: { width: 120, height: 180, borderRadius: 8, borderWidth: 1 },
  photoLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginTop: 5 }
});