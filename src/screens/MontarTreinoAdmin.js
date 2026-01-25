import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, 
  SafeAreaView, Alert, TextInput, Modal, FlatList, Image, KeyboardAvoidingView, 
  Platform, Switch, Dimensions 
} from 'react-native'; 
// 🔥 IMPORT CRÍTICO: SAFE AREA CONTEXT
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- HELPER FUNCTIONS ---
const getThumbnail = (url) => {
    if (!url) return null;
    try {
        if (url.includes('shorts/')) return `https://img.youtube.com/vi/${url.split('shorts/')[1].split('?')[0]}/mqdefault.jpg`;
        if (url.includes('v=')) return `https://img.youtube.com/vi/${url.split('v=')[1].split('&')[0]}/mqdefault.jpg`;
        if (url.includes('youtu.be/')) return `https://img.youtube.com/vi/${url.split('youtu.be/')[1].split('?')[0]}/mqdefault.jpg`;
    } catch (e) {}
    return null;
};

const formatDateToString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const parseStringToDate = (str) => {
    if (!str || str.length !== 10) return new Date(); 
    const [day, month, year] = str.split('/');
    return new Date(`${year}-${month}-${day}T12:00:00`); 
};

export default function MontarTreinoAdmin({ route, navigation }) {
  const { aluno, isTemplateMode, templateData } = route.params || {};
  
  const [detalhes, setDetalhes] = useState({ anamnese: {} });
  const [biblioteca, setBiblioteca] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [exercisesByDay, setExercisesByDay] = useState({ 'A': [] });
  const [selectedWorkoutTab, setSelectedWorkoutTab] = useState('A');
  const [customWorkoutName, setCustomWorkoutName] = useState('');
  
  const [originalData, setOriginalData] = useState(null);
  const [startDateStr, setStartDateStr] = useState(formatDateToString(new Date()));
  const [endDateStr, setEndDateStr] = useState(formatDateToString(new Date(new Date().setDate(new Date().getDate() + 45))));
  const [archiveCurrent, setArchiveCurrent] = useState(false);

  const [templateGoalInput, setTemplateGoalInput] = useState('Hipertrofia');
  const [templateLevelInput, setTemplateLevelInput] = useState('Intermediário');

  const [modalTecnicaVisible, setModalTecnicaVisible] = useState(false);
  const [modalBuscaVisible, setModalBuscaVisible] = useState(false);
  const [modalTemplatesVisible, setModalTemplatesVisible] = useState(false); 
  const [modalSaveTemplateVisible, setModalSaveTemplateVisible] = useState(false); 
  const [anamneseModal, setAnamneseModal] = useState(false); 

  const [isSelectingSubstitute, setIsSelectingSubstitute] = useState(false);
  const [targetIndexForSubstitute, setTargetIndexForSubstitute] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [indexExercicioAtual, setIndexExercicioAtual] = useState(null);

  const [templateGoal, setTemplateGoal] = useState('TODOS');
  const [templateLevel, setTemplateLevel] = useState('TODOS');
  const [templatesList, setTemplatesList] = useState([]);
  const [saveTemplateName, setSaveTemplateName] = useState('');

  const categories = ['TODOS', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Mobilidade', 'Cardio'];
  const goals = ['TODOS', 'Emagrecimento', 'Hipertrofia', 'Definição', 'Qualidade de Vida', 'Condicionamento', 'Recuperação'];
  const levels = ['TODOS', 'Iniciante', 'Intermediário', 'Avançado'];
  
  const tecnicasDisponiveis = [
    { id: '', title: 'NORMAL' }, { id: 'GVT', title: 'GVT (10x10)' }, { id: 'DROPSET', title: 'DROP-SET' }, 
    { id: 'RESTPAUSE', title: 'REST-PAUSE' }, { id: 'BISET', title: 'BI-SET' }, { id: '21', title: 'MÉTODO 21' }, { id: 'CLUSTERSET', title: 'CLUSTER' }
  ];

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    setLoading(true);
    const t = new Date().getTime();

    try {
      try {
          const resLib = await fetch(`https://fitos-final.onrender.com/api/admin/data?t=${t}`);
          if(resLib.ok) {
              const libData = await resLib.json();
              setBiblioteca(libData.exercises || []);
          }
      } catch(e) { console.log("Erro lib", e); }

      if (isTemplateMode) {
          if (templateData) {
              setCustomWorkoutName(templateData.name || '');
              setTemplateGoalInput(templateData.goal || 'Hipertrofia');
              setTemplateLevelInput(templateData.level || 'Intermediário');
              try {
                  const parsed = typeof templateData.data === 'string' ? JSON.parse(templateData.data) : templateData.data;
                  setExercisesByDay(parsed || {'A': []});
              } catch (e) { setExercisesByDay({'A': []}); }
          }
      } else if (aluno?.id) {
          try {
              const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}?t=${t}`);
              if (resUser.ok) {
                  const text = await resUser.text(); 
                  if (text) {
                      const userDataFull = JSON.parse(text); 
                      let anamneseFinal = userDataFull.anamnese || userDataFull.user?.anamnese || (userDataFull.anamneses?.[0]) || {};
                      setDetalhes({ ...userDataFull, anamnese: anamneseFinal });
                  }
              }
          } catch(errUser) { console.log("Erro user", errUser); }

          try {
              const resWorkout = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${aluno.id}&t=${t}`);
              if (resWorkout.ok) {
                  const workoutData = await resWorkout.json();
                  const activeWorkout = Array.isArray(workoutData) ? workoutData.find(w => w.isActive) || workoutData[0] : workoutData;

                  if (activeWorkout && activeWorkout.exercises) {
                      const loadedGroups = activeWorkout.exercises.reduce((acc, item) => {
                        const key = item.day || 'A';
                        if (!acc[key]) acc[key] = [];
                        acc[key].push({
                            exerciseId: item.exerciseId,
                            title: item.exercise?.name || "Exercício",
                            videoUrl: item.exercise?.videoUrl,
                            sets: String(item.sets),
                            reps: item.reps,
                            restTime: String(item.restTime),
                            technique: item.technique,
                            tempId: Math.random().toString(),
                            substitute: (item.substituteId && item.substitute) ? {
                                id: item.substituteId, name: item.substitute.name, videoUrl: item.substitute.videoUrl
                            } : null
                        });
                        return acc;
                      }, {});
                      setExercisesByDay(loadedGroups);
                      setCustomWorkoutName(activeWorkout.name);
                      setOriginalData({ exercises: loadedGroups, name: activeWorkout.name });
                      if(activeWorkout.startDate) setStartDateStr(formatDateToString(new Date(activeWorkout.startDate)));
                      if(activeWorkout.endDate) setEndDateStr(formatDateToString(new Date(activeWorkout.endDate)));
                  } else {
                      setArchiveCurrent(true);
                      setOriginalData(null); 
                  }
              }
          } catch (errWorkout) { console.log("Erro workout", errWorkout); }
      }
    } catch (err) { 
        Alert.alert("Aviso", "Alguns dados podem não ter carregado."); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleNewCycleToggle = (value) => {
      setArchiveCurrent(value);
      if (value === true) {
          setExercisesByDay({ 'A': [] });
          setCustomWorkoutName('');
          setSelectedWorkoutTab('A');
      } else {
          if (originalData) {
              setExercisesByDay(originalData.exercises);
              setCustomWorkoutName(originalData.name);
          }
      }
  };

  const handleClearWorkout = () => {
      Alert.alert("Novo", "Limpar a tela?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Limpar", onPress: () => {
              setExercisesByDay({ 'A': [] });
              if(!isTemplateMode) setArchiveCurrent(true); 
              setCustomWorkoutName('');
              setSelectedWorkoutTab('A');
          }}
      ]);
  };

  const handleDateChange = (text, type) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
    if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
    if (type === 'start') setStartDateStr(cleaned); else setEndDateStr(cleaned);
  };

  const fetchTemplates = async () => {
      try {
          const url = `https://fitos-final.onrender.com/api/admin/templates?goal=${templateGoal}&level=${templateLevel}`;
          const res = await fetch(url);
          const data = await res.json();
          setTemplatesList(data);
      } catch (e) { Alert.alert("Erro", "Falha ao buscar templates"); }
  };

  const applyTemplate = (template) => {
      try {
          const parsed = JSON.parse(template.data);
          setExercisesByDay(parsed);
          if(!customWorkoutName) setCustomWorkoutName(template.name);
          setModalTemplatesVisible(false);
          Alert.alert("Carregado", "Template aplicado!");
      } catch (e) { Alert.alert("Erro", "Dados corrompidos."); }
  };

  const saveAsTemplate = async () => {
      if (!saveTemplateName) return Alert.alert("Erro", "Dê um nome ao template.");
      try {
          await fetch('https://fitos-final.onrender.com/api/admin/templates', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  name: saveTemplateName,
                  goal: templateGoal === 'TODOS' ? 'Geral' : templateGoal,
                  level: templateLevel === 'TODOS' ? 'Geral' : templateLevel,
                  data: JSON.stringify(exercisesByDay) 
              })
          });
          setModalSaveTemplateVisible(false);
          Alert.alert("Sucesso", "Modelo salvo!");
      } catch (e) { Alert.alert("Erro", "Falha ao salvar modelo."); }
  };

  const addExercicioManual = (ex) => {
    const currentList = [...(exercisesByDay[selectedWorkoutTab] || [])];
    if (isSelectingSubstitute && targetIndexForSubstitute !== null) {
        currentList[targetIndexForSubstitute].substitute = { id: ex.id, name: ex.name, videoUrl: ex.videoUrl };
        setIsSelectingSubstitute(false); setTargetIndexForSubstitute(null);
    } else {
        currentList.push({ exerciseId: ex.id, title: ex.name, videoUrl: ex.videoUrl, sets: '3', reps: '12', technique: '', restTime: '60', tempId: Date.now().toString() + Math.random(), substitute: null });
    }
    setExercisesByDay({ ...exercisesByDay, [selectedWorkoutTab]: currentList });
    setModalBuscaVisible(false); setSearchText('');
  };

  const removeSubstitute = (i) => { const l = [...exercisesByDay[selectedWorkoutTab]]; l[i].substitute = null; setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); };
  const removeExercicio = (id) => { setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: exercisesByDay[selectedWorkoutTab].filter(x => x.tempId !== id)}); };
  const moveExercise = (i, dir) => { const l = [...exercisesByDay[selectedWorkoutTab]]; if(dir==='up' && i>0) [l[i-1],l[i]]=[l[i],l[i-1]]; else if(dir==='down' && i<l.length-1) [l[i+1],l[i]]=[l[i],l[i+1]]; setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); };
  const atualizarExercicio = (i, f, v) => { const l = [...exercisesByDay[selectedWorkoutTab]]; l[i][f] = v; setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); };

  const salvarTreinoFinal = async () => {
    if (!customWorkoutName) return Alert.alert("Atenção", "Dê um nome ao treino.");
    
    let hasEx = false;
    Object.keys(exercisesByDay).forEach(k => { if(exercisesByDay[k].length>0) hasEx=true; });
    if(!hasEx) return Alert.alert("Atenção", "O treino está vazio.");

    setSending(true);

    if (isTemplateMode) {
        try {
            await fetch('https://fitos-final.onrender.com/api/admin/templates', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    id: templateData?.id,
                    name: customWorkoutName,
                    goal: templateGoalInput,
                    level: templateLevelInput,
                    data: JSON.stringify(exercisesByDay)
                })
            });
            Alert.alert("Sucesso", "Template salvo!");
            navigation.goBack();
        } catch(e) { Alert.alert("Erro", "Falha ao salvar."); }
        finally { setSending(false); }
        return;
    }

    let flatExercises = [];
    Object.keys(exercisesByDay).forEach(day => {
        exercisesByDay[day].forEach((ex, index) => {
            flatExercises.push({
                exerciseId: ex.exerciseId, day, sets: parseInt(ex.sets)||3, 
                reps: String(ex.reps), technique: ex.technique||"", 
                restTime: parseInt(ex.restTime)||60, order: index,
                substituteId: ex.substitute ? ex.substitute.id : null 
            });
        });
    });

    try {
      await fetch(`https://fitos-final.onrender.com/api/workout`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: aluno.id, name: customWorkoutName, exercises: flatExercises, startDate: parseStringToDate(startDateStr).toISOString(), endDate: parseStringToDate(endDateStr).toISOString(), archiveCurrent })
      });
      navigation.goBack(); 
    } catch (e) { Alert.alert("Erro", "Falha ao enviar."); } 
    finally { setSending(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#CCFF00" /></View>;

  const currentExercises = exercisesByDay[selectedWorkoutTab] || [];
  const exerciciosFiltrados = biblioteca.filter(e => e.name.toLowerCase().includes(searchText.toLowerCase()) && (selectedCategory === 'TODOS' || e.category === selectedCategory));
  
  const hasInjury = detalhes?.anamnese && (
      (detalhes.anamnese.limitacoes && detalhes.anamnese.limitacoes.length > 0) || 
      (detalhes.anamnese.cirurgias && detalhes.anamnese.cirurgias.length > 0)
  );

  // 🔥 LÓGICA DA BIBLIOTECA (Raiz Dinâmica)
  const RootComponent = Platform.OS === 'web' ? View : SafeAreaViewContext;
  const rootStyle = Platform.OS === 'web' ? { height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#000' } : { flex: 1, backgroundColor: '#000' };

  return (
    <RootComponent style={rootStyle}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.container}>
              
              <View style={styles.header}>
                  <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" /></TouchableOpacity>
                  <Text style={styles.headerTitle}>{isTemplateMode ? "EDITOR DE MODELO" : aluno?.name?.toUpperCase()}</Text>
                  <TouchableOpacity onPress={salvarTreinoFinal} disabled={sending}>
                      {sending ? <ActivityIndicator color="#CCFF00"/> : <Text style={styles.saveBtn}>SALVAR</Text>}
                  </TouchableOpacity>
              </View>

              {/* 🔥 SCROLLVIEW COM BARRA INVISÍVEL */}
              <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }} 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false} // 🔥 ESCONDE A BARRA
              >
                  {!isTemplateMode && (
                      <>
                          <TouchableOpacity style={[styles.healthBar, hasInjury ? styles.healthDanger : styles.healthSafe]} onPress={() => setAnamneseModal(true)}>
                              <MaterialCommunityIcons name={hasInjury ? "alert-circle" : "check-circle"} size={20} color={hasInjury ? '#FFF' : '#666'} />
                              <Text style={[styles.healthText, hasInjury ? {color:'#FFF'} : {color:'#666'}]}>{hasInjury ? "RESTRIÇÕES (VER FICHA)" : "Ficha Limpa"}</Text>
                          </TouchableOpacity>

                          <View style={styles.planningContainer}>
                              <View style={styles.dateRow}>
                                  <View style={styles.dateInputGroup}>
                                      <Text style={styles.dateLabel}>INÍCIO</Text>
                                      <TextInput style={styles.dateInput} value={startDateStr} onChangeText={(t) => handleDateChange(t, 'start')} keyboardType="numeric" />
                                  </View>
                                  <View style={styles.dateInputGroup}>
                                      <Text style={styles.dateLabel}>FIM</Text>
                                      <TextInput style={styles.dateInput} value={endDateStr} onChangeText={(t) => handleDateChange(t, 'end')} keyboardType="numeric" />
                                  </View>
                              </View>
                              <View style={[styles.archiveBox, archiveCurrent && {borderColor: '#CCFF00'}]}>
                                  <View style={{flex:1}}>
                                      <Text style={[styles.archiveTitle, archiveCurrent && {color:'#CCFF00'}]}>NOVO CICLO?</Text>
                                      <Text style={styles.archiveDesc}>{archiveCurrent ? "Tela limpa para novo treino." : "Editando atual."}</Text>
                                  </View>
                                  <Switch value={archiveCurrent} onValueChange={handleNewCycleToggle} trackColor={{false: '#333', true: '#CCFF00'}} thumbColor={'#FFF'} />
                              </View>
                          </View>
                      </>
                  )}

                  {isTemplateMode && (
                      <View style={styles.configBox}>
                          <Text style={styles.miniLabel}>CONFIGURAÇÕES DO MODELO</Text>
                          <View style={{flexDirection:'row', gap:8, marginTop:5, flexWrap:'wrap'}}>
                              {['Hipertrofia','Emagrecimento','Força'].map(g => (
                                  <TouchableOpacity key={g} style={[styles.tag, templateGoalInput===g && styles.tagActive]} onPress={()=>setTemplateGoalInput(g)}>
                                      <Text style={[styles.tagText, templateGoalInput===g && {color:'#000'}]}>{g}</Text>
                                  </TouchableOpacity>
                              ))}
                          </View>
                          <View style={{flexDirection:'row', gap:8, marginTop:10, flexWrap:'wrap'}}>
                                  {['Iniciante','Intermediário','Avançado'].map(l => (
                                      <TouchableOpacity key={l} style={[styles.tag, templateLevelInput===l && styles.tagActive]} onPress={()=>setTemplateLevelInput(l)}>
                                          <Text style={[styles.tagText, templateLevelInput===l && {color:'#000'}]}>{l}</Text>
                                      </TouchableOpacity>
                                  ))}
                          </View>
                      </View>
                  )}

                  <View style={styles.toolsRow}>
                      <TouchableOpacity style={styles.toolBtnHighlight} onPress={handleClearWorkout}>
                          <MaterialCommunityIcons name="delete-sweep" size={18} color="#000" />
                          <Text style={styles.toolBtnTextDark}>LIMPAR</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolBtn} onPress={() => { fetchTemplates(); setModalTemplatesVisible(true); }}>
                          <MaterialCommunityIcons name="folder-download" size={18} color="#FFF" />
                          <Text style={styles.toolBtnText}>IMPORTAR</Text>
                      </TouchableOpacity>
                  </View>

                  <TextInput style={styles.nameInput} placeholder="NOME DO TREINO (EX: FULLBODY A)" placeholderTextColor="#444" value={customWorkoutName} onChangeText={setCustomWorkoutName} />

                  <View style={styles.tabSelector}>
                      {['A', 'B', 'C', 'D', 'E', 'F'].map(tab => (
                          <TouchableOpacity key={tab} style={[styles.tabBtn, selectedWorkoutTab === tab && styles.tabBtnActive]} onPress={() => { setSelectedWorkoutTab(tab); if(!exercisesByDay[tab]) setExercisesByDay({...exercisesByDay, [tab]: []}); }}>
                              <Text style={[styles.tabBtnText, selectedWorkoutTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>

                  {currentExercises.length === 0 ? (
                      <View style={{alignItems:'center', marginTop:30}}>
                          <MaterialCommunityIcons name="dumbbell" size={40} color="#222" />
                          <Text style={styles.emptyText}>Dia {selectedWorkoutTab} vazio.</Text>
                          <TouchableOpacity style={styles.addBtnLarge} onPress={() => { setIsSelectingSubstitute(false); setModalBuscaVisible(true); }}>
                              <Text style={styles.addBtnLargeText}>+ ADICIONAR EXERCÍCIO</Text>
                          </TouchableOpacity>
                      </View>
                  ) : (
                      <>
                      {currentExercises.map((item, index) => {
                          const thumb = getThumbnail(item.videoUrl);
                          return (
                              <View key={item.tempId} style={styles.manualCard}>
                                  <View style={styles.cardTop}>
                                      <View style={{flexDirection:'row', alignItems:'center', flex:1, gap:10}}>
                                          {thumb ? <Image source={{uri: thumb}} style={styles.thumbMini} /> : <View style={[styles.thumbMini, {justifyContent:'center', alignItems:'center', backgroundColor: '#222'}]}><MaterialCommunityIcons name="video" size={18} color="#666" /></View>}
                                          <Text style={styles.manualExName}>{index + 1}. {item.title}</Text>
                                      </View>
                                      <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                                          <TouchableOpacity onPress={() => moveExercise(index, 'up')} disabled={index === 0}><MaterialCommunityIcons name="arrow-up-bold" size={24} color={index === 0 ? '#333' : '#CCFF00'} /></TouchableOpacity>
                                          <TouchableOpacity onPress={() => moveExercise(index, 'down')} disabled={index === currentExercises.length - 1}><MaterialCommunityIcons name="arrow-down-bold" size={24} color={index === currentExercises.length - 1 ? '#333' : '#CCFF00'} /></TouchableOpacity>
                                          <TouchableOpacity onPress={() => removeExercicio(item.tempId)} style={{marginLeft:5}}><MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" /></TouchableOpacity>
                                      </View>
                                  </View>

                                  {item.substitute ? (
                                      <View style={styles.substituteRow}>
                                          <MaterialCommunityIcons name="swap-horizontal" size={16} color="#CCFF00" />
                                          <Text style={styles.subLabel}>Ou:</Text>
                                          <Text style={styles.subName}>{item.substitute.name}</Text>
                                          <TouchableOpacity onPress={() => removeSubstitute(index)}><MaterialCommunityIcons name="close-circle" size={18} color="#666" /></TouchableOpacity>
                                      </View>
                                  ) : (
                                      <TouchableOpacity style={styles.addSubBtn} onPress={() => { setIsSelectingSubstitute(true); setTargetIndexForSubstitute(index); setModalBuscaVisible(true); }}>
                                          <Text style={styles.addSubText}>+ Adicionar opção de troca</Text>
                                      </TouchableOpacity>
                                  )}

                                  <View style={styles.manualInputs}>
                                      <View style={styles.inputBox}><Text style={styles.miniLabel}>SÉRIES</Text><TextInput style={styles.miniInput} value={String(item.sets)} keyboardType="numeric" onChangeText={(v) => atualizarExercicio(index, 'sets', v)} /></View>
                                      <View style={styles.inputBox}><Text style={styles.miniLabel}>REPS</Text><TextInput style={styles.miniInput} value={item.reps} onChangeText={(v) => atualizarExercicio(index, 'reps', v)} /></View>
                                      <View style={styles.inputBox}><Text style={styles.miniLabel}>DESC(s)</Text><TextInput style={styles.miniInput} value={String(item.restTime)} keyboardType="numeric" onChangeText={(v) => atualizarExercicio(index, 'restTime', v)} /></View>
                                      <TouchableOpacity style={styles.techBox} onPress={() => { setIndexExercicioAtual(index); setModalTecnicaVisible(true); }}>
                                          <Text style={styles.miniLabel}>TÉCNICA</Text>
                                          <Text style={{color: item.technique ? '#CCFF00' : '#555', fontSize:10, fontWeight:'bold'}}>{item.technique || 'NORMAL'}</Text>
                                      </TouchableOpacity>
                                  </View>
                              </View>
                          );
                      })}
                      <TouchableOpacity style={styles.addBtnSmall} onPress={() => { setIsSelectingSubstitute(false); setModalBuscaVisible(true); }}>
                          <Text style={styles.addBtnText}>+ ADICIONAR OUTRO</Text>
                      </TouchableOpacity>
                      </>
                  )}
              </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* MODAIS */}
        <Modal visible={modalBuscaVisible} animationType="slide"><SafeAreaView style={styles.modalFull}><View style={styles.modalHeader}><TouchableOpacity onPress={() => setModalBuscaVisible(false)}><Text style={styles.closeText}>FECHAR</Text></TouchableOpacity><TextInput style={styles.searchBar} placeholder="Buscar..." placeholderTextColor="#666" autoFocus value={searchText} onChangeText={setSearchText} /></View><View style={{height: 50}}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 10}}>{categories.map(cat => (<TouchableOpacity key={cat} style={[styles.catChip, selectedCategory === cat && styles.catChipActive]} onPress={() => setSelectedCategory(cat)}><Text style={[styles.catText, selectedCategory === cat && {color:'#000'}]}>{cat}</Text></TouchableOpacity>))}</ScrollView></View><FlatList data={exerciciosFiltrados} keyExtractor={item => item.id} contentContainerStyle={{padding: 10}} renderItem={({ item }) => { const thumb = getThumbnail(item.videoUrl); return (<TouchableOpacity style={styles.libItem} onPress={() => addExercicioManual(item)}>{thumb ? <Image source={{uri: thumb}} style={styles.thumbList} /> : <View style={[styles.thumbList, {justifyContent:'center', alignItems:'center', backgroundColor: '#222'}]}><MaterialCommunityIcons name="video" size={24} color="#666" /></View>}<View style={{flex:1}}><Text style={styles.libName}>{item.name}</Text><Text style={styles.libCat}>{item.category}</Text></View><MaterialCommunityIcons name="plus-circle" size={24} color="#CCFF00" /></TouchableOpacity>); }} /></SafeAreaView></Modal>
        <Modal visible={modalTecnicaVisible} transparent animationType="fade"><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>TÉCNICA</Text>{tecnicasDisponiveis.map((t) => (<TouchableOpacity key={t.id} style={styles.techOption} onPress={() => { atualizarExercicio(indexExercicioAtual, 'technique', t.id); setModalTecnicaVisible(false); }}><Text style={[styles.techOptionText, (exercisesByDay[selectedWorkoutTab]?.[indexExercicioAtual]?.technique === t.id) && {color: '#CCFF00'}]}>{t.title}</Text></TouchableOpacity>))}<TouchableOpacity style={{marginTop:15}} onPress={() => setModalTecnicaVisible(false)}><Text style={{color:'#666', textAlign:'center'}}>Cancelar</Text></TouchableOpacity></View></View></Modal>
        <Modal visible={anamneseModal} transparent animationType="fade"><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>PRONTUÁRIO</Text><ScrollView style={{maxHeight: 400}}>{detalhes?.anamnese ? (<><View style={styles.infoBlock}><Text style={styles.infoLabel}>OBJETIVO:</Text><Text style={styles.infoValue}>{detalhes.anamnese.objetivo || "-"}</Text></View><View style={styles.infoBlock}><Text style={[styles.infoLabel, {color:'#FF3B30'}]}>LIMITAÇÕES:</Text><Text style={styles.infoValue}>{detalhes.anamnese.limitacoes?.join(', ') || "Nenhuma"}</Text></View><View style={styles.infoBlock}><Text style={[styles.infoLabel, {color:'#FF3B30'}]}>CIRURGIAS:</Text><Text style={styles.infoValue}>{detalhes.anamnese.cirurgias?.join(', ') || "Nenhuma"}</Text></View></>) : <Text style={{color:'#666'}}>Sem dados.</Text>}</ScrollView><TouchableOpacity style={styles.closeBtn} onPress={() => setAnamneseModal(false)}><Text style={{color:'#FFF', fontWeight:'bold'}}>FECHAR</Text></TouchableOpacity></View></View></Modal>
        <Modal visible={modalTemplatesVisible} animationType="slide"><SafeAreaView style={styles.modalFull}><View style={styles.modalHeader}><Text style={styles.headerTitle}>BIBLIOTECA</Text><TouchableOpacity onPress={() => setModalTemplatesVisible(false)}><Text style={styles.closeText}>FECHAR</Text></TouchableOpacity></View><View style={{padding:10, gap:10}}><ScrollView horizontal showsHorizontalScrollIndicator={false}>{goals.map(g => <TouchableOpacity key={g} style={[styles.catChip, templateGoal===g && styles.catChipActive]} onPress={()=>{setTemplateGoal(g); fetchTemplates();}}><Text style={[styles.catText, templateGoal===g && {color:'#000'}]}>{g}</Text></TouchableOpacity>)}</ScrollView></View><FlatList data={templatesList} keyExtractor={item => item.id} contentContainerStyle={{padding: 15}} renderItem={({ item }) => (<TouchableOpacity style={styles.templateCard} onPress={() => applyTemplate(item)}><View><Text style={styles.templateName}>{item.name}</Text><Text style={styles.templateTags}>{item.goal} • {item.level}</Text></View><MaterialCommunityIcons name="download" size={24} color="#CCFF00" /></TouchableOpacity>)}/></SafeAreaView></Modal>
        <Modal visible={modalSaveTemplateVisible} transparent animationType="fade"><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>SALVAR MODELO</Text><TextInput style={styles.modalInput} placeholder="Nome" placeholderTextColor="#555" value={saveTemplateName} onChangeText={setSaveTemplateName} /><TouchableOpacity style={styles.saveBtnModal} onPress={saveAsTemplate}><Text style={{color:'#000', fontWeight:'900'}}>SALVAR</Text></TouchableOpacity><TouchableOpacity style={{marginTop:15}} onPress={() => setModalSaveTemplateVisible(false)}><Text style={{color:'#666', textAlign:'center'}}>Cancelar</Text></TouchableOpacity></View></KeyboardAvoidingView></Modal>

      </SafeAreaView>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  // 🔥 WRAPPER SEGURO: 100VH PARA WEB
  // Na Web: height 100vh para permitir scroll do navegador
  // No Mobile: flex 1 para comportamento padrão nativo
  webWrapper: {
      flex: 1,
      backgroundColor: '#000',
      height: Platform.OS === 'web' ? '100vh' : '100%',
      overflow: 'hidden' 
  },
  mobileWrapper: {
      flex: 1,
      backgroundColor: '#000',
  },
  
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, padding: 15 },
  center: { flex: 1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' },
  header: { flexDirection: 'row', justifyContent:'space-between', alignItems: 'center', marginBottom: 15, paddingTop: Platform.OS === 'web' ? 20 : 0 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  saveBtn: { color: '#CCFF00', fontWeight: '900' },
  
  healthBar: { flexDirection:'row', alignItems:'center', justifyContent:'center', padding:10, borderRadius:8, marginBottom:15, gap:8, borderWidth:1 },
  healthDanger: { backgroundColor: '#330000', borderColor: '#FF3B30' },
  healthSafe: { backgroundColor: '#111', borderColor: '#222' },
  healthText: { fontSize: 11, fontWeight: 'bold' },
  
  configBox: { backgroundColor:'#111', borderRadius:15, padding:15, marginBottom:15, borderWidth:1, borderColor:'#222' },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dateInputGroup: { flex: 1 },
  dateLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 5 },
  dateInput: { backgroundColor: '#111', color: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#222', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  
  archiveBox: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#222', justifyContent:'space-between' },
  archiveTitle: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  archiveDesc: { color: '#666', fontSize: 10, maxWidth: '80%' },

  toolsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  toolBtn: { flex: 1, backgroundColor: '#1A1A1A', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth:1, borderColor:'#333' },
  toolBtnHighlight: { flex: 1, backgroundColor: '#CCFF00', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  toolBtnText: { fontWeight: 'bold', fontSize: 11, color: '#FFF' },
  toolBtnTextDark: { fontWeight: '900', fontSize: 11, color: '#000' },

  nameInput: { backgroundColor: '#111', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#222' },

  tabSelector: { flexDirection: 'row', justifyContent:'space-between', marginBottom: 15 },
  tabBtn: { width: 45, height: 45, backgroundColor: '#111', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  tabBtnActive: { borderColor: '#CCFF00', backgroundColor: 'rgba(204,255,0,0.1)' },
  tabBtnText: { color: '#666', fontWeight: 'bold' },
  tabBtnTextActive: { color: '#CCFF00' },
  
  manualCard: { backgroundColor: '#111', padding: 10, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', marginBottom: 10 },
  thumbMini: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#222' },
  manualExName: { color: '#fff', fontWeight: 'bold', fontSize: 13, flex: 1 },
  
  substituteRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A00', padding: 8, borderRadius: 6, marginBottom: 10, marginTop: 5, borderWidth: 1, borderColor: 'rgba(204, 255, 0, 0.3)' },
  subLabel: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold', marginHorizontal: 5 },
  subName: { color: '#FFF', fontSize: 12, flex: 1 },
  addSubBtn: { paddingVertical: 5, marginBottom: 10 },
  addSubText: { color: '#666', fontSize: 10, fontStyle: 'italic', textDecorationLine: 'underline' },

  manualInputs: { flexDirection: 'row', gap: 5 },
  inputBox: { flex: 1 },
  techBox: { flex: 1.5, alignItems:'center', justifyContent:'center', backgroundColor:'#000', borderRadius:5, borderWidth:1, borderColor:'#222' },
  miniLabel: { color: '#555', fontSize: 8, fontWeight: 'bold', marginBottom: 2, textAlign:'center' },
  miniInput: { backgroundColor: '#000', color: '#fff', padding: 5, borderRadius: 5, fontSize: 12, textAlign: 'center', borderWidth: 1, borderColor: '#222' },
  
  addBtnLarge: { backgroundColor: '#CCFF00', padding: 15, borderRadius: 10, width:'100%', alignItems:'center' },
  addBtnLargeText: { fontWeight: '900', color:'#000' },
  addBtnSmall: { padding: 15, alignItems:'center', borderWidth:1, borderColor:'#222', borderRadius:10, marginTop:10 },
  addBtnText: { color: '#888', fontWeight: 'bold', fontSize:12 },
  emptyText: { color: '#666', marginBottom: 15 },

  modalFull: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', padding: 15, alignItems: 'center', justifyContent:'space-between', borderBottomWidth: 1, borderBottomColor: '#222' },
  searchBar: { flex: 1, backgroundColor: '#111', color: '#FFF', padding: 10, borderRadius: 8, marginLeft: 10 },
  closeText: { color: '#FF3B30', fontWeight: 'bold' },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#111', marginRight: 8, height:32, justifyContent:'center', borderWidth:1, borderColor:'#222' },
  catChipActive: { backgroundColor: '#CCFF00', borderColor:'#CCFF00' },
  catText: { color: '#888', fontSize: 11, fontWeight: 'bold' },
  libItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', flexDirection:'row', alignItems:'center', gap:10 },
  thumbList: { width: 60, height: 40, borderRadius: 6, backgroundColor:'#222' },
  libName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  libCat: { color: '#666', fontSize: 10 },

  templateCard: { backgroundColor:'#111', padding:15, borderRadius:12, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:'#222' },
  templateName: { color:'#FFF', fontWeight:'bold', fontSize:16 },
  templateTags: { color:'#888', fontSize:12, marginTop:4 },
  refreshBtn: { alignItems:'center', padding:10, borderBottomWidth:1, borderBottomColor:'#222', marginBottom:10 },
  refreshText: { color:'#CCFF00', fontSize:10, fontWeight:'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: '#111', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#222' },
  modalTitle: { color: '#CCFF00', fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  modalInput: { backgroundColor:'#000', color:'#FFF', padding:12, borderRadius:8, borderWidth:1, borderColor:'#333', marginBottom:15 },
  miniLabelLeft: { color:'#666', fontSize:10, fontWeight:'bold', marginBottom:5 },
  saveBtnModal: { backgroundColor:'#CCFF00', padding:15, borderRadius:10, alignItems:'center', width:'100%' },
  
  techOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  techOptionText: { color: '#FFF', fontWeight: 'bold', textAlign: 'center' },
  closeBtn: { backgroundColor: '#333', paddingVertical: 12, borderRadius: 12, alignItems: 'center', width: '100%', marginTop: 15 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  infoBlock: { marginBottom: 15, borderBottomWidth:1, borderBottomColor:'#222', paddingBottom:5 },
  infoLabel: { color:'#CCFF00', fontSize:10, fontWeight:'900', marginBottom:2 },
  infoValue: { color:'#FFF', fontSize:14 },
  
  tag: { paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:'#333', backgroundColor:'#000', marginRight:5 },
  tagActive: { backgroundColor:'#CCFF00', borderColor:'#CCFF00' },
  tagText: { color:'#888', fontSize:10, fontWeight:'bold' }
});