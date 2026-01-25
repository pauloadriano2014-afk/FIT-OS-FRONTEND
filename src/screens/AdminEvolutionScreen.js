import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, FlatList, Image 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get('window');

// --- FÓRMULAS E UTILITÁRIOS (MANTIDOS ORIGINAIS) ---
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
  const { aluno } = route.params; 

  const [activeTab, setActiveTab] = useState('AVALIACAO'); // AVALIACAO | CHECKINS | FEEDBACK
  const [loading, setLoading] = useState(true);
  
  // Dados
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]); 
  const [checkinHistory, setCheckinHistory] = useState([]); // 🔥 NOVO: Histórico de Check-ins

  // MODAIS AVALIAÇÃO
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false); 
  const [selectedAssessment, setSelectedAssessment] = useState(null); 

  // MODAL CHECK-IN (NOVO)
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState(null);

  // States do Formulário de Avaliação
  const [method, setMethod] = useState('BASICO');
  const [customDate, setCustomDate] = useState('');
  const [weight, setWeight] = useState('');
  
  const [currentAge, setCurrentAge] = useState(aluno.birthDate ? getAgeFromDate(aluno.birthDate) : '');
  const [currentGender, setCurrentGender] = useState(aluno.gender ? aluno.gender.toUpperCase() : 'MASCULINO');
  
  const [measures, setMeasures] = useState({ waist: '', abdomen: '' });
  const [folds, setFolds] = useState({ chest:'', axillary:'', triceps:'', subscapular:'', abdominal:'', suprailiac:'', thigh:'' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 🔥 BUSCA TRIPLA: Avaliações + Treinos + Check-ins
      const [resAssess, resLogs, resCheckins] = await Promise.all([
          fetch(`https://fitos-final.onrender.com/api/assessment?userId=${aluno.id}`),
          fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}/history`),
          fetch(`https://fitos-final.onrender.com/api/checkin?userId=${aluno.id}`) // Busca os check-ins
      ]);

      const dataAssess = await resAssess.json();
      const dataLogs = await resLogs.json();
      const dataCheckins = await resCheckins.json();

      if (Array.isArray(dataAssess)) setAssessmentHistory(dataAssess);
      if (dataLogs.workoutLogs) setWorkoutLogs(dataLogs.workoutLogs);
      if (Array.isArray(dataCheckins)) setCheckinHistory(dataCheckins); // Salva check-ins

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
      } catch (e) {
          Alert.alert("Erro", e.message);
      }
  };

  const openDetails = (item) => {
      setSelectedAssessment(item);
      setDetailsVisible(true);
  };

  const chartData = {
      labels: assessmentHistory.slice(-6).map(a => `${new Date(a.date).getDate()}/${new Date(a.date).getMonth()+1}`),
      datasets: [{ data: assessmentHistory.length > 0 ? assessmentHistory.slice(-6).map(a => a.weight) : [0] }]
  };

  // --- RENDERIZADORES ---

  const renderWorkoutLogItem = ({ item }) => {
      const rpeInfo = item.rpe ? getRpeInfo(item.rpe) : null;
      return (
        <View style={styles.logCard}>
            <View style={styles.logHeader}>
                <View>
                    <Text style={styles.logTitle}>{item.name}</Text>
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
                <View style={styles.feedbackContainer}>
                    <View style={{flexDirection:'row', alignItems:'center', gap:5, marginBottom:5}}>
                        <MaterialCommunityIcons name="text-box-outline" size={14} color="#888" />
                        <Text style={styles.feedbackLabel}>OBSERVAÇÃO DO ALUNO:</Text>
                    </View>
                    <Text style={styles.feedbackText}>{item.feedback}</Text>
                </View>
            ) : (
                <View style={[styles.feedbackContainer, {opacity:0.5}]}>
                    <Text style={styles.noFeedback}>Sem observações.</Text>
                </View>
            )}
        </View>
      );
  };

  const renderCheckinItem = ({ item }) => (
      <TouchableOpacity 
        style={styles.logCard} 
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
              <Text style={{color:'#FFF', fontWeight:'bold', fontSize:16}}>{item.weight ? `${item.weight} kg` : ''}</Text>
          </View>
          
          {item.feedback && (
              <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackText} numberOfLines={2}>"{item.feedback}"</Text>
              </View>
          )}
          <View style={{alignItems:'center', marginTop:10}}>
              <Text style={{color:'#666', fontSize:10, fontWeight:'bold'}}>TOQUE PARA VER FOTOS &gt;</Text>
          </View>
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>PRONTUÁRIO: {aluno.name?.toUpperCase()}</Text>
        <View style={{width:24}} />
      </View>

      {/* ABAS DE NAVEGAÇÃO */}
      <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'AVALIACAO' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('AVALIACAO')}
          >
              <Text style={[styles.tabText, activeTab === 'AVALIACAO' && styles.tabTextActive]}>AVALIAÇÃO</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'CHECKINS' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('CHECKINS')}
          >
              <Text style={[styles.tabText, activeTab === 'CHECKINS' && styles.tabTextActive]}>CHECK-INS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'FEEDBACK' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('FEEDBACK')}
          >
              <Text style={[styles.tabText, activeTab === 'FEEDBACK' && styles.tabTextActive]}>TREINOS</Text>
          </TouchableOpacity>
      </View>

      {loading ? (
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            <ActivityIndicator color="#CCFF00" size="large"/>
          </View>
      ) : (
          <>
            {/* ABA AVALIAÇÃO FÍSICA */}
            {activeTab === 'AVALIACAO' && (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>IDADE: {currentAge || '--'} anos</Text>
                        <Text style={styles.infoText}>SEXO: {currentGender}</Text>
                    </View>

                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <MaterialCommunityIcons name="plus" size={22} color="#000" />
                        <Text style={styles.addBtnText}>NOVA AVALIAÇÃO</Text>
                    </TouchableOpacity>

                    {assessmentHistory.length > 1 && (
                        <View style={{alignItems:'center', marginVertical:20}}>
                            <Text style={styles.chartTitle}>EVOLUÇÃO DE PESO</Text>
                            <LineChart
                                data={chartData}
                                width={width - 40}
                                height={200}
                                chartConfig={{
                                    backgroundGradientFrom: "#111", backgroundGradientTo: "#111",
                                    color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                    propsForDots: { r: "4", strokeWidth: "2", stroke: "#CCFF00" }
                                }}
                                bezier
                                style={{borderRadius: 16}}
                            />
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>HISTÓRICO COMPLETO</Text>
                    {assessmentHistory.slice().reverse().map(item => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.card}
                            onPress={() => openDetails(item)}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                                <View style={{flexDirection:'row', gap:10}}>
                                    <View style={styles.badge}><Text style={styles.badgeText}>{item.method === 'POLLOCK' ? 'POLLOCK' : 'BÁSICO'}</Text></View>
                                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.stat}><Text style={styles.label}>PESO</Text><Text style={styles.val}>{item.weight}kg</Text></View>
                                {item.bodyFat && <View style={styles.stat}><Text style={styles.label}>GORDURA</Text><Text style={[styles.val, {color:'#CCFF00'}]}>{item.bodyFat}%</Text></View>}
                                {item.waist && <View style={styles.stat}><Text style={styles.label}>CINTURA</Text><Text style={styles.val}>{item.waist}cm</Text></View>}
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* ABA CHECK-INS (NOVA) */}
            {activeTab === 'CHECKINS' && (
                <FlatList 
                    data={checkinHistory}
                    keyExtractor={item => item.id}
                    renderItem={renderCheckinItem}
                    contentContainerStyle={styles.content}
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
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum treino finalizado.</Text>}
                />
            )}
          </>
      )}

      {/* MODAL DETALHES CHECK-IN */}
      <Modal visible={checkinModalVisible} animationType="slide" transparent>
        <View style={styles.detailsOverlay}>
            <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                    <Text style={styles.detailsTitle}>CHECK-IN DETALHES</Text>
                    <TouchableOpacity onPress={() => setCheckinModalVisible(false)}>
                        <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                
                {selectedCheckin && (
                    <ScrollView>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>DATA:</Text><Text style={styles.detailValue}>{new Date(selectedCheckin.date).toLocaleDateString('pt-BR')}</Text></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>PESO:</Text><Text style={[styles.detailValue, {color:'#32ADE6', fontSize:20}]}>{selectedCheckin.weight} kg</Text></View>
                        
                        {selectedCheckin.feedback && (
                            <View style={styles.feedbackContainer}>
                                <Text style={styles.feedbackText}>"{selectedCheckin.feedback}"</Text>
                            </View>
                        )}

                        <Text style={{color:'#888', marginTop:15, marginBottom:10, fontWeight:'bold', fontSize:12}}>FOTOS ENVIADAS:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10, paddingBottom:10}}>
                            {selectedCheckin.photoFront && (
                                <View style={{alignItems:'center'}}>
                                    <Image source={{uri: selectedCheckin.photoFront}} style={{width:120, height:180, borderRadius:8, borderWidth:1, borderColor:'#333'}} />
                                    <Text style={{color:'#666', fontSize:10, marginTop:5, fontWeight:'bold'}}>FRENTE</Text>
                                </View>
                            )}
                            {selectedCheckin.photoSide && (
                                <View style={{alignItems:'center'}}>
                                    <Image source={{uri: selectedCheckin.photoSide}} style={{width:120, height:180, borderRadius:8, borderWidth:1, borderColor:'#333'}} />
                                    <Text style={{color:'#666', fontSize:10, marginTop:5, fontWeight:'bold'}}>LADO</Text>
                                </View>
                            )}
                            {selectedCheckin.photoBack && (
                                <View style={{alignItems:'center'}}>
                                    <Image source={{uri: selectedCheckin.photoBack}} style={{width:120, height:180, borderRadius:8, borderWidth:1, borderColor:'#333'}} />
                                    <Text style={{color:'#666', fontSize:10, marginTop:5, fontWeight:'bold'}}>COSTAS</Text>
                                </View>
                            )}
                        </ScrollView>
                    </ScrollView>
                )}
            </View>
        </View>
      </Modal>

      {/* MODAL DE CADASTRO AVALIAÇÃO (MANTIDO) */}
      <Modal visible={modalVisible} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <SafeAreaView style={{flex:1}}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>REGISTRAR DADOS</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color="#FFF" /></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{padding:20}}>
                    <Text style={styles.inputLabel}>DATA (Opcional)</Text>
                    <TextInput style={styles.input} placeholder="DD/MM/AAAA" placeholderTextColor="#555" value={customDate} onChangeText={(t) => {
                        let v = t.replace(/[^0-9]/g, '');
                        if(v.length>2) v = v.slice(0,2)+'/'+v.slice(2);
                        if(v.length>5) v = v.slice(0,5)+'/'+v.slice(5);
                        if(v.length>10) v = v.slice(0,10);
                        setCustomDate(v);
                    }} keyboardType="numeric" maxLength={10}/>

                    <View style={styles.switchRow}>
                        <TouchableOpacity style={[styles.switchBtn, method==='BASICO' && {backgroundColor:'#CCFF00'}]} onPress={()=>setMethod('BASICO')}><Text style={[styles.switchText, method==='BASICO' && {color:'#000'}]}>BÁSICO</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.switchBtn, method==='POLLOCK' && {backgroundColor:'#CCFF00'}]} onPress={()=>setMethod('POLLOCK')}><Text style={[styles.switchText, method==='POLLOCK' && {color:'#000'}]}>POLLOCK 7</Text></TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>PESO (KG)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} />

                    {method === 'BASICO' ? (
                        <>
                            <Text style={styles.inputLabel}>CINTURA (CM)</Text>
                            <TextInput style={styles.input} keyboardType="numeric" onChangeText={t=>setMeasures({...measures, waist:t})} />
                            <Text style={styles.inputLabel}>ABDÔMEN (CM)</Text>
                            <TextInput style={styles.input} keyboardType="numeric" onChangeText={t=>setMeasures({...measures, abdomen:t})} />
                        </>
                    ) : (
                        <>
                            <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
                                <View style={{flex:1}}><Text style={styles.inputLabel}>IDADE</Text><TextInput style={styles.input} value={currentAge} onChangeText={setCurrentAge} /></View>
                                <View style={{flex:1}}><Text style={styles.inputLabel}>SEXO</Text><TouchableOpacity style={styles.input} onPress={()=>setCurrentGender(currentGender==='MASCULINO'?'FEMININO':'MASCULINO')}><Text style={{color:'#FFF', marginTop:10}}>{currentGender}</Text></TouchableOpacity></View>
                            </View>
                            <Text style={{color:'#CCFF00', fontWeight:'bold', marginBottom:10}}>DOBRAS (MM)</Text>
                            <View style={{flexDirection:'row', flexWrap:'wrap', gap:10}}>
                                {['chest','axillary','triceps','subscapular','abdominal','suprailiac','thigh'].map(key => (
                                    <View key={key} style={{width:'30%'}}>
                                        <Text style={{color:'#888', fontSize:10, marginBottom:2}}>{key.toUpperCase().slice(0,8)}</Text>
                                        <TextInput style={styles.miniInput} keyboardType="numeric" onChangeText={t => setFolds(prev => ({...prev, [key]: t}))} />
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={{fontWeight:'900', fontSize:16}}>SALVAR NO PERFIL</Text>
                    </TouchableOpacity>
                    <View style={{height:50}}/>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DETALHES (MANTIDO) */}
      <Modal visible={detailsVisible} transparent animationType="fade">
        <View style={styles.detailsOverlay}>
            <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                    <Text style={styles.detailsTitle}>DETALHES</Text>
                    <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                        <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                
                {selectedAssessment && (
                    <ScrollView>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>DATA:</Text><Text style={styles.detailValue}>{new Date(selectedAssessment.date).toLocaleDateString('pt-BR')}</Text></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>PESO:</Text><Text style={styles.detailValue}>{selectedAssessment.weight} kg</Text></View>
                        
                        {selectedAssessment.bodyFat && (
                            <View style={styles.resultBox}>
                                <View style={{alignItems:'center'}}><Text style={styles.resultLabel}>GORDURA</Text><Text style={styles.resultValue}>{selectedAssessment.bodyFat}%</Text></View>
                                <View style={{height:30, width:1, backgroundColor:'#444'}}/>
                                <View style={{alignItems:'center'}}><Text style={styles.resultLabel}>MASSA MAGRA</Text><Text style={styles.resultValue}>{(selectedAssessment.weight * (1 - selectedAssessment.bodyFat/100)).toFixed(1)} kg</Text></View>
                            </View>
                        )}

                        {selectedAssessment.method === 'POLLOCK' && (
                            <>
                                <Text style={styles.detailSection}>DOBRAS (mm)</Text>
                                <View style={styles.detailGrid}>
                                    <View style={styles.gridBox}><Text style={styles.gridLabel}>Peitoral</Text><Text style={styles.gridVal}>{selectedAssessment.foldChest || '-'}</Text></View>
                                    <View style={styles.gridBox}><Text style={styles.gridLabel}>Axilar</Text><Text style={styles.gridVal}>{selectedAssessment.foldAxillary || '-'}</Text></View>
                                    <View style={styles.gridBox}><Text style={styles.gridLabel}>Tríceps</Text><Text style={styles.gridVal}>{selectedAssessment.foldTriceps || '-'}</Text></View>
                                    <View style={styles.gridBox}><Text style={styles.gridLabel}>Subescap.</Text><Text style={styles.gridVal}>{selectedAssessment.foldSubscapular || '-'}</Text></View>
                                    <View style={styles.gridBox}><Text style={styles.gridLabel}>Abdom.</Text><Text style={styles.gridVal}>{selectedAssessment.foldAbdominal || '-'}</Text></View>
                                    <View style={styles.gridBox}><Text style={styles.gridLabel}>Supra-il.</Text><Text style={styles.gridVal}>{selectedAssessment.foldSuprailiac || '-'}</Text></View>
                                    <View style={styles.gridBox}><Text style={styles.gridLabel}>Coxa</Text><Text style={styles.gridVal}>{selectedAssessment.foldThigh || '-'}</Text></View>
                                </View>
                            </>
                        )}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent:'center', alignItems:'center' },
  header: { flexDirection:'row', alignItems:'center', padding:20, justifyContent:'space-between' },
  headerTitle: { color:'#FFF', fontWeight:'bold', fontSize:16 },
  
  // TABS
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, borderBottomWidth:1, borderBottomColor:'#222' },
  tabBtn: { marginRight: 20, paddingBottom: 10 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#CCFF00' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#FFF' },

  content: { padding:20 },
  infoBox: { flexDirection:'row', justifyContent:'space-between', backgroundColor:'#111', padding:15, borderRadius:10, marginBottom:20, borderWidth:1, borderColor:'#222' },
  infoText: { color:'#888', fontSize:12, fontWeight:'bold' },
  addBtn: { backgroundColor:'#CCFF00', flexDirection:'row', alignItems:'center', justifyContent:'center', padding:15, borderRadius:10, gap:8, marginBottom:20 },
  addBtnText: { fontWeight:'900', color:'#000' },
  chartTitle: { color:'#FFF', fontSize:12, fontWeight:'bold', marginBottom:10 },
  sectionTitle: { color:'#666', fontSize:12, fontWeight:'bold', marginBottom:10, marginTop:10 },
  
  // CARDS GERAIS
  card: { backgroundColor:'#111', padding:15, borderRadius:12, marginBottom:10, borderWidth:1, borderColor:'#222' },
  cardHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  date: { color:'#FFF', fontWeight:'bold' },
  badge: { backgroundColor:'#333', paddingHorizontal:6, borderRadius:4, marginRight:10 },
  badgeText: { color:'#CCC', fontSize:10, fontWeight:'bold' },
  cardBody: { flexDirection:'row', gap:20 },
  stat: { alignItems:'flex-start' },
  label: { color:'#666', fontSize:10, fontWeight:'bold' },
  val: { color:'#FFF', fontSize:16, fontWeight:'bold' },

  // LOGS (FEEDBACK CARD)
  logCard: { backgroundColor:'#111', padding:15, borderRadius:12, marginBottom:15, borderWidth:1, borderColor:'#222' },
  logHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  logTitle: { color:'#FFF', fontSize:14, fontWeight:'bold', marginBottom:4 },
  logDate: { color:'#666', fontSize:10 },
  
  // RPE STYLES
  rpeBadge: { alignItems:'center', justifyContent:'center', borderRadius:6, width:24, height:24, alignSelf:'flex-end' },
  rpeVal: { fontWeight:'900', fontSize:12, color:'#000' }, 
  rpeLabelName: { fontSize:8, fontWeight:'bold', marginTop:2, textAlign:'right' },

  // FEEDBACK TEXT STYLES
  feedbackContainer: { backgroundColor:'#1A1A1A', padding:12, borderRadius:8, marginTop:5 },
  feedbackLabel: { color:'#888', fontSize:9, fontWeight:'bold' },
  feedbackText: { color:'#EEE', fontSize:13, fontStyle:'italic', lineHeight: 18 },
  noFeedback: { color:'#444', fontSize:12, fontStyle:'italic' },
  empty: { color:'#666', textAlign:'center', marginTop:50 },

  // MODAL CADASTRO (Mantido)
  modalContainer: { flex: 1, backgroundColor:'#000' },
  modalHeader: { padding:20, flexDirection:'row', justifyContent:'space-between', borderBottomWidth:1, borderBottomColor:'#222' },
  modalTitle: { color:'#FFF', fontWeight:'bold', fontSize:18 },
  inputLabel: { color:'#CCFF00', fontSize:12, fontWeight:'bold', marginBottom:5, marginTop:10 },
  input: { backgroundColor:'#111', color:'#FFF', padding:12, borderRadius:8, borderWidth:1, borderColor:'#333' },
  switchRow: { flexDirection:'row', backgroundColor:'#222', borderRadius:8, padding:4, marginTop:10 },
  switchBtn: { flex:1, padding:10, alignItems:'center', borderRadius:6 },
  switchText: { color:'#FFF', fontWeight:'bold', fontSize:12 },
  miniInput: { backgroundColor:'#111', color:'#FFF', padding:8, borderRadius:6, borderWidth:1, borderColor:'#333', textAlign:'center' },
  saveBtn: { backgroundColor:'#CCFF00', padding:15, borderRadius:10, alignItems:'center', marginTop:30 },

  // MODAL DETALHES
  detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  detailsCard: { backgroundColor: '#111', borderRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: '#333' },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 15 },
  detailsTitle: { color: '#CCFF00', fontSize: 16, fontWeight: '900' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', paddingBottom: 5 },
  detailLabel: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  detailValue: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  resultBox: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 15, justifyContent: 'space-around', marginVertical: 15 },
  resultLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  resultValue: { color: '#CCFF00', fontSize: 18, fontWeight: '900' },
  detailSection: { color: '#CCFF00', fontWeight: 'bold', fontSize: 12, marginTop: 10, marginBottom: 10 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridBox: { width: '30%', backgroundColor: '#000', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 5 },
  gridLabel: { color: '#666', fontSize: 10, marginBottom: 2 },
  gridVal: { color: '#FFF', fontWeight: 'bold' }
});