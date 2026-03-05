import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, 
  SafeAreaView, Alert, TextInput, Modal, FlatList, KeyboardAvoidingView, 
  Platform, Switch, StatusBar, Dimensions 
} from 'react-native'; 
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker'; 

import { useTheme } from '../contexts/ThemeContext';
import SmartThumbnail from '../components/MontarTreino/SmartThumbnail';
import ExerciseCardAdmin from '../components/MontarTreino/ExerciseCardAdmin';

const { width } = Dimensions.get('window');

const CustomCalendar = ({ selectedDate, onSelect, onClose, theme }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
    const firstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();
    const generateDays = () => {
        const total = daysInMonth(month, year);
        const start = firstDayOfMonth(month, year);
        const days = Array(start).fill(null);
        for (let i = 1; i <= total; i++) days.push(i);
        return days;
    };
    return (
        <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 20, width: 320, alignSelf:'center', borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month - 1, 1))}><MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} /></TouchableOpacity>
                <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 16 }}>{monthNames[month].toUpperCase()} {year}</Text>
                <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month + 1, 1))}><MaterialCommunityIcons name="chevron-right" size={28} color={theme.text} /></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>{['D','S','T','Q','Q','S','S'].map((d,i) => <Text key={i} style={{ color: theme.textSecondary, fontWeight: 'bold', width: 30, textAlign: 'center' }}>{d}</Text>)}</View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {generateDays().map((day, i) => (
                    <TouchableOpacity key={i} style={[{ width: '14.2%', height: 40, justifyContent: 'center', alignItems: 'center' }, day === currentDate.getDate() && { backgroundColor: theme.accent, borderRadius: 20 }]} onPress={() => day && onSelect(new Date(year, month, day))} disabled={!day}>
                        <Text style={[{ color: theme.text }, day === currentDate.getDate() && { color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }]}>{day || ''}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center', padding: 15, backgroundColor: theme.bg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }} onPress={onClose}><Text style={{ color: theme.text, fontWeight: 'bold' }}>FECHAR</Text></TouchableOpacity>
        </View>
    );
};

const formatDateToString = (date) => { if (!date) return ''; const d = new Date(date); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };

export default function MontarTreinoAdmin({ route, navigation }) {
  const { aluno, isTemplateMode, templateData, workoutToEdit, isEditing } = route.params || {};
  const { theme } = useTheme(); 

  const [detalhes, setDetalhes] = useState({ anamnese: {} });
  const [biblioteca, setBiblioteca] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isImportingAI, setIsImportingAI] = useState(false); 
  
  const [workoutTabs, setWorkoutTabs] = useState(['A']);
  const [selectedWorkoutTab, setSelectedWorkoutTab] = useState('A');
  const [exercisesByDay, setExercisesByDay] = useState({ 'A': [] });
  const [renameTabModalVisible, setRenameTabModalVisible] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  
  const [customWorkoutName, setCustomWorkoutName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)));
  const [isArchived, setIsArchived] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const [showCalendarStart, setShowCalendarStart] = useState(false);
  const [showCalendarEnd, setShowCalendarEnd] = useState(false);
  
  const [templateGoalInput, setTemplateGoalInput] = useState('Hipertrofia');
  const [templateLevelInput, setTemplateLevelInput] = useState('Intermediário');

  const [modalTecnicaVisible, setModalTecnicaVisible] = useState(false);
  const [modalBuscaVisible, setModalBuscaVisible] = useState(false);
  const [modalTemplatesVisible, setModalTemplatesVisible] = useState(false); 
  const [modalSaveTemplateVisible, setModalSaveTemplateVisible] = useState(false); 
  const [anamneseModal, setAnamneseModal] = useState(false); 
  
  const [modalCloneVisible, setModalCloneVisible] = useState(false);
  const [cloneStudentsList, setCloneStudentsList] = useState([]);
  const [selectedCloneStudent, setSelectedCloneStudent] = useState(null);
  const [cloneWorkoutsList, setCloneWorkoutsList] = useState([]);
  
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewExercise, setPreviewExercise] = useState(null);
  const previewVideoRef = useRef(null);
  
  const [isSelectingSubstitute, setIsSelectingSubstitute] = useState(false);
  const [targetIndexForSubstitute, setTargetIndexForSubstitute] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [showCatDropdown, setShowCatDropdown] = useState(false); 
  
  const [indexExercicioAtual, setIndexExercicioAtual] = useState(null);
  const [indexBlocoAtual, setIndexBlocoAtual] = useState(null);

  const [isSwapping, setIsSwapping] = useState(false);
  const [swapIndex, setSwapIndex] = useState(null);

  const [templateGoal, setTemplateGoal] = useState('TODOS');
  const [templateLevel, setTemplateLevel] = useState('TODOS');
  const [templatesList, setTemplatesList] = useState([]);
  const [saveTemplateName, setSaveTemplateName] = useState('');

  const categories = ['TODOS', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Mobilidade', 'Cardio'];
  const goals = ['TODOS', 'Emagrecimento', 'Hipertrofia', 'Definição', 'Qualidade de Vida', 'Condicionamento', 'Recuperação'];
  const levels = ['TODOS', 'Iniciante', 'Intermediário', 'Avançado'];
  
  const tecnicasDisponiveis = [{ id: '', title: 'NORMAL' }, { id: 'GVT', title: 'GVT (10x10)' }, { id: 'DROPSET', title: 'DROP-SET' }, { id: 'RESTPAUSE', title: 'REST-PAUSE' }, { id: 'BISET', title: 'BI-SET' }, { id: '21', title: 'MÉTODO 21' }, { id: 'CLUSTERSET', title: 'CLUSTER' }];
  const intensidadesCardio = [{ id: 'Leve', title: 'Leve / Aquecimento' }, { id: 'Moderada', title: 'Moderada' }, { id: 'Zona 2', title: 'Trote (Zona 2)' }, { id: 'Forte', title: 'Forte' }, { id: 'HIIT', title: 'HIIT (Tiros)' }];

  useEffect(() => { 
      if (!isEditing && !isTemplateMode) {
          setExercisesByDay({ 'A': [] });
          setWorkoutTabs(['A']);
          setSelectedWorkoutTab('A');
          setCustomWorkoutName('');
          setStartDate(new Date());
          setEndDate(new Date(new Date().setDate(new Date().getDate() + 30)));
          setIsArchived(false);
      }
      fetchDados(); 
  }, [isEditing, isTemplateMode]);

  const fetchDados = async () => {
    setLoading(true);
    const t = new Date().getTime();
    try {
      try {
          const resLib = await fetch(`https://fitos-final.onrender.com/api/admin/data?t=${t}`);
          if(resLib.ok) { const libData = await resLib.json(); setBiblioteca(libData.exercises || []); }
      } catch(e) {}

      if (aluno?.id) {
          try {
              const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}?t=${t}`);
              if (resUser.ok) {
                  const text = await resUser.text(); 
                  if (text) {
                      const u = JSON.parse(text); 
                      let anam = u.anamnese || u.user?.anamnese || {};
                      if (!anam.limitacoes && u.anamneses?.length > 0) anam = u.anamneses[0];
                      setDetalhes({ ...u, anamnese: anam });
                  }
              }
          } catch(errUser) {}
      }

      if (isEditing && workoutToEdit) {
          setCustomWorkoutName(workoutToEdit.name);
          if (workoutToEdit.startDate) setStartDate(new Date(workoutToEdit.startDate));
          if (workoutToEdit.endDate) {
              const end = new Date(workoutToEdit.endDate);
              setEndDate(end);
              if (end < new Date()) setIsArchived(true);
          }
          processWorkoutDataToState(workoutToEdit.exercises);
      } 
      else if (isTemplateMode && templateData) {
          setCustomWorkoutName(templateData.name || '');
          setTemplateGoalInput(templateData.goal || 'Hipertrofia');
          setTemplateLevelInput(templateData.level || 'Intermediário');
          try {
              const parsed = typeof templateData.data === 'string' ? JSON.parse(templateData.data) : templateData.data;
              const extractedTabs = Object.keys(parsed);
              if(extractedTabs.length > 0) {
                  setWorkoutTabs(extractedTabs);
                  setSelectedWorkoutTab(extractedTabs[0]);
              }
              setExercisesByDay(parsed || {'A': []});
          } catch (e) { setExercisesByDay({'A': []}); }
      }
    } catch (err) { } finally { setLoading(false); }
  };

  const processWorkoutDataToState = (exercisesArray) => {
      if (!exercisesArray) return;
      const groups = exercisesArray.reduce((acc, item) => {
          const key = item.day || 'A';
          if (!acc[key]) acc[key] = [];
          
          let realBlocks = item.blocks;
          let realTech = item.technique;
          let realObs = item.observation;

          try {
              if (item.technique && typeof item.technique === 'string' && item.technique.trim().startsWith('{')) {
                  const parsed = JSON.parse(item.technique);
                  if (parsed && parsed.b) {
                      realBlocks = parsed.b;
                      realTech = parsed.t;
                      realObs = parsed.o || realObs;
                  }
              }
          } catch(e) {}

          if (!realBlocks || !Array.isArray(realBlocks) || realBlocks.length === 0) {
              realBlocks = [{ sets: String(item.sets || '3'), reps: String(item.reps || '12'), restTime: String(item.restTime || '60'), technique: realTech || '' }];
          }

          acc[key].push({
              exerciseId: item.exerciseId,
              title: item.exercise?.name || "Exercício",
              videoUrl: item.exercise?.videoUrl,
              observation: realObs || '',
              category: item.exercise?.category || '',
              tempId: Math.random().toString(),
              substitute: (item.substituteId && item.substitute) ? { id: item.substituteId, name: item.substitute.name, videoUrl: item.substitute.videoUrl } : null,
              blocks: realBlocks 
          });
          return acc;
      }, {});
      
      const extractedTabs = Object.keys(groups);
      if(extractedTabs.length > 0) {
          setWorkoutTabs(extractedTabs);
          setSelectedWorkoutTab(extractedTabs[0]);
      }
      setExercisesByDay(groups);
  };

  const handleImportPDF = async () => {
      try {
          const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
          if (result.canceled) return;

          setIsImportingAI(true);
          const fileToUpload = result.assets[0];
          const formData = new FormData();

          if (Platform.OS === 'web') {
              const res = await fetch(fileToUpload.uri);
              const blob = await res.blob();
              formData.append('file', blob, fileToUpload.name);
          } else {
              formData.append('file', {
                  uri: fileToUpload.uri,
                  name: fileToUpload.name,
                  type: fileToUpload.mimeType || 'application/pdf'
              });
          }

          const response = await fetch('https://fitos-final.onrender.com/api/admin/import-pdf', {
              method: 'POST',
              body: formData,
              headers: { 'Accept': 'application/json' }
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Erro na importação da IA');

          if (data.workoutName) setCustomWorkoutName(data.workoutName);

          if (data.exercisesByDay) {
              const newExercisesByDay = {};
              Object.keys(data.exercisesByDay).forEach(day => {
                  newExercisesByDay[day] = data.exercisesByDay[day].map((aiEx) => {
                      const normalizeStr = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
                      const match = biblioteca.find(b => {
                          const bName = normalizeStr(b.name);
                          const aiName = normalizeStr(aiEx.title);
                          return bName.includes(aiName) || aiName.includes(bName);
                      });

                      return {
                          exerciseId: match ? match.id : `custom_${Math.random()}`, 
                          title: match ? match.name : aiEx.title,
                          videoUrl: match ? match.videoUrl : '',
                          category: aiEx.category || (match ? match.category : ''),
                          observation: aiEx.observation || '',
                          tempId: Math.random().toString(),
                          substitute: null,
                          blocks: aiEx.blocks && aiEx.blocks.length > 0 ? aiEx.blocks : [{
                              sets: String(aiEx.sets || '3'),
                              reps: String(aiEx.reps || '12'),
                              restTime: String(aiEx.restTime || '60'),
                              technique: aiEx.technique || ''
                          }]
                      };
                  });
              });

              setExercisesByDay(newExercisesByDay);
              const extractedTabs = Object.keys(newExercisesByDay);
              if (extractedTabs.length > 0) {
                  setWorkoutTabs(extractedTabs);
                  setSelectedWorkoutTab(extractedTabs[0]);
              }
              Alert.alert("🔥 IA Finalizada!", "Treino importado! Atenção aos exercícios em VERMELHO (Fantasmas). Sincronize-os com sua biblioteca.");
          }
      } catch (error) {
          Alert.alert("Erro", "Não foi possível processar o PDF.");
      } finally {
          setIsImportingAI(false);
      }
  };

  const handleDeleteTab = () => {
      if (workoutTabs.length === 1) { Alert.alert('Atenção', 'Você precisa ter pelo menos um dia de treino.'); return; }
      Alert.alert('Excluir', `Apagar o treino "${selectedWorkoutTab}" e todos os seus exercícios?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Apagar', style: 'destructive', onPress: () => {
              setWorkoutTabs(prevTabs => {
                  const updatedTabs = prevTabs.filter(t => t !== selectedWorkoutTab);
                  setSelectedWorkoutTab(updatedTabs[0]);
                  return updatedTabs;
              });
              setExercisesByDay(prevEx => {
                  const newEx = { ...prevEx };
                  delete newEx[selectedWorkoutTab];
                  return newEx;
              });
              setRenameTabModalVisible(false);
          }}
      ]);
  };

  const addNewTab = () => {
      let baseName = "Novo Treino";
      let count = 1;
      while(workoutTabs.includes(`${baseName} ${count}`)) { count++; }
      const newName = `${baseName} ${count}`;
      setWorkoutTabs([...workoutTabs, newName]);
      setExercisesByDay({ ...exercisesByDay, [newName]: [] });
      setSelectedWorkoutTab(newName);
  };

  const handleRenameTab = () => {
      if (!newTabName.trim()) { Alert.alert('Erro', 'O nome não pode ser vazio.'); return; }
      if (workoutTabs.includes(newTabName) && newTabName !== selectedWorkoutTab) { Alert.alert('Erro', 'Já existe um treino com este nome.'); return; }

      const updatedTabs = workoutTabs.map(t => t === selectedWorkoutTab ? newTabName : t);
      setWorkoutTabs(updatedTabs);

      const updatedExercises = { ...exercisesByDay };
      updatedExercises[newTabName] = updatedExercises[selectedWorkoutTab] || [];
      if (newTabName !== selectedWorkoutTab) { delete updatedExercises[selectedWorkoutTab]; }
      setExercisesByDay(updatedExercises);
      setSelectedWorkoutTab(newTabName);
      setRenameTabModalVisible(false);
  };

  const handleClearWorkout = () => {
      Alert.alert("Limpar", `Apagar todos os exercícios do treino "${selectedWorkoutTab}"?`, [
          { text: "Cancelar", style: "cancel" },
          { text: "Limpar", onPress: () => setExercisesByDay({ ...exercisesByDay, [selectedWorkoutTab]: [] }) }
      ]);
  };

  const onSelectStartDate = (date) => { setStartDate(date); setShowCalendarStart(false); };
  const onSelectEndDate = (date) => { setEndDate(date); setShowCalendarEnd(false); setIsArchived(false); };

  const fetchTemplates = async () => {
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/templates?goal=${templateGoal}&level=${templateLevel}`);
          const data = await res.json();
          setTemplatesList(data);
      } catch (e) {}
  };

  const applyTemplate = (template) => {
      try {
          const parsed = JSON.parse(template.data);
          const newTabs = Object.keys(parsed);
          setWorkoutTabs(newTabs.length > 0 ? newTabs : ['A']);
          setSelectedWorkoutTab(newTabs.length > 0 ? newTabs[0] : 'A');
          setExercisesByDay(parsed);
          if(!customWorkoutName) setCustomWorkoutName(template.name);
          setModalTemplatesVisible(false);
      } catch (e) { Alert.alert("Erro ao importar"); }
  };

  const fetchStudentsForClone = async () => {
      try {
          // 🔥 CIRURGIA: Tiramos o 's' do final. Agora ele bate certinho na sua rota /api/admin/user
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user?t=${Date.now()}`);
          if (res.ok) {
              const data = await res.json();
              setCloneStudentsList(data.filter(u => u.role !== 'ADMIN'));
          }
      } catch(e) {
          console.log("Erro ao buscar alunos:", e);
      }
  };

  const fetchWorkoutsOfStudent = async (studentId) => {
      setSelectedCloneStudent(studentId);
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${studentId}&t=${Date.now()}`);
          if(res.ok) {
              const data = await res.json();
              setCloneWorkoutsList(data);
          }
      } catch(e) {}
  };

  const applyClone = (workout) => {
      processWorkoutDataToState(workout.exercises);
      setCustomWorkoutName(`${workout.name} (Clone)`);
      setModalCloneVisible(false);
      setSelectedCloneStudent(null);
      setCloneWorkoutsList([]);
      Alert.alert("Sucesso", "Rotina clonada e pronta para edição!");
  };

  // 🔥 CORREÇÃO DE ERRO SILENCIOSO NO SALVAMENTO COMO TEMPLATE
  const saveAsTemplate = async () => {
      if (!saveTemplateName) return Alert.alert("Erro", "Dê um nome ao template.");
      try {
          const res = await fetch('https://fitos-final.onrender.com/api/admin/templates', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ name: saveTemplateName, goal: templateGoalInput, level: templateLevelInput, data: JSON.stringify(exercisesByDay) })
          });
          
          if (!res.ok) {
              const errText = await res.text();
              throw new Error(`[Status ${res.status}] ${errText}`);
          }

          setModalSaveTemplateVisible(false);
          Alert.alert("Sucesso", "Modelo salvo!");
      } catch (e) { 
          console.error(e);
          Alert.alert("Erro Fatal", `Falha ao salvar modelo:\n${e.message}`); 
      }
  };

  const addExercicioManual = (ex) => {
    const currentList = [...(exercisesByDay[selectedWorkoutTab] || [])];
    const isCardio = ex.category?.toUpperCase() === 'CARDIO';
    const initialBlocks = isCardio 
        ? [{ sets: '20', reps: '200', restTime: '0', technique: 'Moderada' }] 
        : [{ sets: '3', reps: '12', restTime: '60', technique: '' }];

    if (isSwapping && swapIndex !== null) {
        currentList[swapIndex].exerciseId = ex.id;
        currentList[swapIndex].title = ex.name;
        currentList[swapIndex].videoUrl = ex.videoUrl;
        currentList[swapIndex].category = ex.category;
        setIsSwapping(false); 
        setSwapIndex(null);
    } else if (isSelectingSubstitute && targetIndexForSubstitute !== null) {
        currentList[targetIndexForSubstitute].substitute = { id: ex.id, name: ex.name, videoUrl: ex.videoUrl };
        setIsSelectingSubstitute(false); 
        setTargetIndexForSubstitute(null);
    } else {
        currentList.push({ 
            exerciseId: ex.id, title: ex.name, videoUrl: ex.videoUrl, observation: '', tempId: Math.random().toString(), substitute: null, category: ex.category,
            blocks: initialBlocks 
        });
    }
    setExercisesByDay({ ...exercisesByDay, [selectedWorkoutTab]: currentList });
    setPreviewModalVisible(false);
    setModalBuscaVisible(false); 
    setSearchText('');
    setSelectedCategory('TODOS'); 
  };

  const removeSubstitute = (i) => { const l=[...exercisesByDay[selectedWorkoutTab]]; l[i].substitute=null; setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]:l}); };
  const removeExercicio = (id) => { setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: exercisesByDay[selectedWorkoutTab].filter(x => x.tempId !== id)}); };
  const moveExercise = (i, dir) => { 
      const l = [...(exercisesByDay[selectedWorkoutTab] || [])]; 
      if(dir==='up' && i>0) { [l[i-1], l[i]] = [l[i], l[i-1]]; } 
      else if(dir==='down' && i < l.length-1) { [l[i+1], l[i]] = [l[i], l[i+1]]; }
      setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); 
  };

  const atualizarObservacao = (i, v) => { const l=[...exercisesByDay[selectedWorkoutTab]]; l[i].observation=v; setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]:l}); };

  const adicionarBloco = (exIndex) => {
      const l = [...exercisesByDay[selectedWorkoutTab]];
      const lastBlock = l[exIndex].blocks[l[exIndex].blocks.length - 1];
      l[exIndex].blocks.push({ sets: '1', reps: lastBlock.reps, restTime: lastBlock.restTime, technique: '' });
      setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l});
  };

  const removerBloco = (exIndex, blockIndex) => {
      const l = [...exercisesByDay[selectedWorkoutTab]];
      l[exIndex].blocks.splice(blockIndex, 1);
      setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l});
  };

  const atualizarBloco = (exIndex, blockIndex, field, value) => {
      const l = [...exercisesByDay[selectedWorkoutTab]];
      l[exIndex].blocks[blockIndex][field] = value;
      setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l});
  };

  // 🔥 CORREÇÃO DE ERRO SILENCIOSO AO SALVAR TREINO OU TEMPLATE
  const salvarTreinoFinal = async () => {
    const alertMsg = (title, msg) => {
        if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
        else Alert.alert(title, msg);
    };

    if (!customWorkoutName) return alertMsg("Erro", "Defina um nome para a rotina.");
    setSending(true);

    if (isTemplateMode) {
        try {
            const res = await fetch('https://fitos-final.onrender.com/api/admin/templates', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id: templateData?.id, name: customWorkoutName, goal: templateGoalInput, level: templateLevelInput, data: JSON.stringify(exercisesByDay) })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`[Status ${res.status}] ${errText}`);
            }

            alertMsg("Sucesso", "Template salvo!"); navigation.goBack();
        } catch(e) { 
            console.error(e);
            alertMsg("Erro Fatal", `Falha ao salvar template:\n\n${e.message}`); 
        } finally { setSending(false); }
        return;
    }

    let flatExercises = [];
    let temFantasma = false; 

    Object.keys(exercisesByDay).forEach(day => {
        exercisesByDay[day].forEach((ex, index) => {
            if (ex.exerciseId && String(ex.exerciseId).startsWith('custom_')) { temFantasma = true; }

            const isCardio = ex.category?.toUpperCase() === 'CARDIO';
            const safeBlocks = (ex.blocks && ex.blocks.length > 0) ? ex.blocks : [{ sets: '3', reps: '10', technique: '', restTime: '60' }];
            const hiddenPayload = JSON.stringify({ t: safeBlocks[0].technique || "", b: safeBlocks, o: ex.observation || "" });

            flatExercises.push({
                exerciseId: String(ex.exerciseId), 
                day: String(day).trim(), 
                sets: parseInt(safeBlocks[0].sets) || (isCardio ? 20 : 3),
                reps: String(safeBlocks[0].reps), 
                technique: hiddenPayload,
                restTime: parseInt(safeBlocks[0].restTime) || 0,
                order: index,
                observation: ex.observation || "", 
                substituteId: ex.substitute ? String(ex.substitute.id) : null
            });
        });
    });

    if (temFantasma) {
        setSending(false);
        return alertMsg("⚠️ EXERCÍCIOS FANTASMAS ENCONTRADOS!", "Existem exercícios na lista destacados em VERMELHO. Sincronize-os com sua biblioteca oficial antes de salvar.");
    }

    let finalEndDate = endDate;
    if (isArchived) { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); finalEndDate = yesterday; }

    try {
      const isUpdate = isEditing && workoutToEdit?.id;
      const endpoint = isUpdate 
          ? `https://fitos-final.onrender.com/api/workout/${workoutToEdit.id}` 
          : `https://fitos-final.onrender.com/api/workout`; 
      
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(endpoint, { 
        method: method, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: aluno?.id, name: customWorkoutName, exercises: flatExercises, startDate: startDate.toISOString(), endDate: finalEndDate.toISOString(), archiveCurrent: false })
      });

      if (!response.ok) {
          const errText = await response.text(); 
          throw new Error(`[Status ${response.status}] ${errText}`);
      }

      alertMsg("Sucesso", isArchived ? "Rotina arquivada com sucesso!" : "Rotina salva com sucesso!"); 
      navigation.goBack(); 
    } catch (e) { 
        console.error(e);
        alertMsg("Erro Fatal do Servidor", `Tire um print disso e me mande:\n\n${e.message}`); 
    } 
    finally { setSending(false); }
  };

  const openPreview = (ex) => {
      setPreviewExercise(ex);
      setPreviewModalVisible(true);
  };

  if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.accent} /></View>;

  const currentExercises = exercisesByDay[selectedWorkoutTab] || [];
  const exerciciosFiltrados = biblioteca.filter(e => e.name.toLowerCase().includes(searchText.toLowerCase()) && (selectedCategory === 'TODOS' || e.category === selectedCategory));
  const hasInjury = detalhes?.anamnese && ((detalhes.anamnese.limitacoes && detalhes.anamnese.limitacoes.length > 0) || (detalhes.anamnese.cirurgias && detalhes.anamnese.cirurgias.length > 0));

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  const RootComponent = isWeb ? View : SafeAreaViewContext;

  const currentExOpened = currentExercises[indexExercicioAtual];
  const isCurrentCardio = currentExOpened?.category?.toUpperCase() === 'CARDIO';
  const modalOptionsToShow = isCurrentCardio ? intensidadesCardio : tecnicasDisponiveis;
  const modalTitleToShow = isCurrentCardio ? 'INTENSIDADE' : 'TÉCNICA';

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 10, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
          <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: isWeb ? 20 : 10, paddingBottom: 15 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border, width: 45, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900', letterSpacing: 1, flex: 1, textAlign: 'center' }} numberOfLines={1}>
                  {isEditing ? "EDITAR ROTINA" : "NOVA ROTINA"}
              </Text>
              <TouchableOpacity onPress={salvarTreinoFinal} disabled={sending} style={{ width: 45, alignItems: 'center' }}>
                  {sending ? <ActivityIndicator color={theme.accent}/> : <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 12 }}>SALVAR</Text>}
              </TouchableOpacity>
          </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={isWeb ? { height: '100vh', width: '100%' } : { flex: 1 }} enabled={Platform.OS !== 'web'}>
          <ScrollView 
              style={isWeb ? { flex: 1, width: '100%', overflowY: 'auto' } : { flex: 1, width: '100%' }} 
              contentContainerStyle={{ flexGrow: 1, alignItems: 'center', width: '100%' }} 
              showsVerticalScrollIndicator={true}
              bounces={false} 
              overScrollMode="never" 
          >
              <View style={{ width: '100%', maxWidth: isWeb ? 480 : '100%', backgroundColor: theme.bg, flex: 1, padding: 20, paddingBottom: 150, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border, minHeight: '100vh' } : {}) }}>
                    
                      {!isTemplateMode && (
                          <TouchableOpacity style={[styles.healthBar, { backgroundColor: hasInjury ? (theme.isDark ? '#330000' : '#FFE5E5') : theme.surface, borderColor: hasInjury ? '#FF3B30' : theme.border }]} onPress={() => setAnamneseModal(true)}>
                              <MaterialCommunityIcons name={hasInjury ? "alert-circle" : "check-circle"} size={24} color={hasInjury ? '#FF3B30' : theme.textSecondary} />
                              <View style={{flex:1}}>
                                  <Text style={[styles.healthTitle, { color: hasInjury ? '#FF3B30' : theme.textSecondary }]}>
                                      {hasInjury ? "ALUNO COM RESTRIÇÕES" : "FICHA MÉDICA OK"}
                                  </Text>
                                  {hasInjury && <Text style={styles.healthSubtitle}>Toque para ver detalhes da anamnese</Text>}
                              </View>
                              <MaterialCommunityIcons name="chevron-right" size={20} color={hasInjury ? '#FF3B30' : theme.textSecondary} />
                          </TouchableOpacity>
                      )}

                      {!isTemplateMode && (
                          <View style={[styles.planningContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                              <TextInput style={[styles.nameInput, { backgroundColor: theme.bg, color: theme.accent, borderColor: theme.border }]} placeholder="NOME DA ROTINA (EX: HIPERTROFIA A)" placeholderTextColor={theme.textSecondary} value={customWorkoutName} onChangeText={setCustomWorkoutName} />
                              
                              <View style={styles.dateRow}>
                                  <TouchableOpacity style={styles.dateInputGroup} onPress={() => setShowCalendarStart(true)}>
                                      <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>INÍCIO</Text>
                                      <View style={[styles.dateDisplay, { backgroundColor: theme.bg, borderColor: theme.border }]}><MaterialCommunityIcons name="calendar" size={16} color={theme.accent} /><Text style={[styles.dateText, { color: theme.text }]}>{formatDateToString(startDate)}</Text></View>
                                  </TouchableOpacity>

                                  <TouchableOpacity style={styles.dateInputGroup} onPress={() => setShowCalendarEnd(true)}>
                                      <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>FIM</Text>
                                      <View style={[styles.dateDisplay, { backgroundColor: theme.bg, borderColor: theme.border }, isArchived && {opacity: 0.5}]}>
                                          <MaterialCommunityIcons name="calendar-check" size={16} color="#32ADE6" /><Text style={[styles.dateText, { color: theme.text }]}>{formatDateToString(endDate)}</Text></View>
                                  </TouchableOpacity>
                              </View>

                              <View style={[styles.archiveRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                  <Text style={[styles.archiveLabel, isArchived ? {color:'#FF3B30'} : {color: theme.accent}]}>STATUS: {isArchived ? "ARQUIVADO" : "ATIVO"}</Text>
                                  
                                  <Switch 
                                      value={isArchived} 
                                      onValueChange={(val) => {
                                          setIsArchived(val);
                                          if (!val && endDate < new Date()) {
                                              const futureDate = new Date();
                                              futureDate.setDate(futureDate.getDate() + 30);
                                              setEndDate(futureDate);
                                          }
                                      }} 
                                      trackColor={{false: theme.border, true: theme.isDark ? '#330000' : '#FFE5E5'}} 
                                      thumbColor={isArchived ? '#FF3B30' : theme.accent} 
                                  />
                              </View>
                          </View>
                      )}

                      <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
                            {isReordering ? (
                                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#28a745', flex:1}]} onPress={() => setIsReordering(false)}>
                                    <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                                    <Text style={[styles.actionBtnText, {color:'#FFF'}]}>FINALIZAR ORDENAÇÃO</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity style={[styles.actionBtn, {borderColor:'#32ADE6', borderWidth:1, flex:1}]} onPress={() => setIsReordering(true)}>
                                        <MaterialCommunityIcons name="sort" size={20} color="#32ADE6" />
                                        <Text style={[styles.actionBtnText, {color:'#32ADE6'}]}>REORDENAR</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor:'#32ADE6', flex:1}]} onPress={() => { setIsSelectingSubstitute(false); setIsSwapping(false); setModalBuscaVisible(true); }}>
                                        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                                        <Text style={[styles.actionBtnText, {color:'#FFF'}]}>ADICIONAR</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                       </View>

                      {/* 🔥 PAINEL DO TEMPLATE - COM PASTAS/TAGS CLARAS */}
                      {isTemplateMode && (
                          <View style={[styles.configBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                              <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>NOME DO MODELO</Text>
                              <TextInput style={[styles.nameInput, { backgroundColor: theme.bg, color: theme.accent, borderColor: theme.border, marginTop: 10 }]} placeholder="Ex: Hipertrofia Elite A/B/C" placeholderTextColor={theme.textSecondary} value={customWorkoutName} onChangeText={setCustomWorkoutName} />
                              
                              <Text style={[styles.miniLabel, { color: theme.textSecondary, marginTop: 10 }]}>CATEGORIA / PASTA</Text>
                              <View style={{flexDirection:'row', gap:8, marginTop:10, flexWrap:'wrap'}}>
                                  {['Hipertrofia','Emagrecimento','Força'].map(g => (
                                      <TouchableOpacity key={g} style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.bg }, templateGoalInput===g && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>setTemplateGoalInput(g)}>
                                          <Text style={[styles.tagText, { color: theme.textSecondary }, templateGoalInput===g && {color: theme.isDark ? '#000' : '#FFF'}]}>{g}</Text>
                                      </TouchableOpacity>
                                  ))}
                              </View>
                              <View style={{flexDirection:'row', gap:8, marginTop:10, flexWrap:'wrap'}}>
                                      {['Iniciante','Intermediário','Avançado'].map(l => (
                                          <TouchableOpacity key={l} style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.bg }, templateLevelInput===l && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>setTemplateLevelInput(l)}>
                                              <Text style={[styles.tagText, { color: theme.textSecondary }, templateLevelInput===l && {color: theme.isDark ? '#000' : '#FFF'}]}>{l}</Text>
                                          </TouchableOpacity>
                                      ))}
                              </View>
                          </View>
                      )}

                      <View style={styles.toolsRow}>
                          <TouchableOpacity style={[styles.toolBtnHighlight, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.accent }]} onPress={handleClearWorkout}>
                              <MaterialCommunityIcons name="delete-sweep" size={18} color={theme.text} />
                              <Text style={[styles.toolBtnTextDark, { color: theme.text }]}>LIMPAR DIA</Text>
                          </TouchableOpacity>

                          {/* 🔥 NOVO BOTÃO DE CLONAR ALUNO */}
                          {!isTemplateMode && (
                              <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { fetchStudentsForClone(); setModalCloneVisible(true); }}>
                                  <MaterialCommunityIcons name="account-switch" size={18} color={theme.text} />
                                  <Text style={[styles.toolBtnText, { color: theme.text }]}>CLONAR ALUNO</Text>
                              </TouchableOpacity>
                          )}

                          <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { fetchTemplates(); setModalTemplatesVisible(true); }}>
                              <MaterialCommunityIcons name="folder-download" size={18} color={theme.text} />
                              <Text style={[styles.toolBtnText, { color: theme.text }]}>BIBLIOTECA</Text>
                          </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity 
                          style={[{ backgroundColor: theme.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 20, gap: 10, elevation: 2 }]} 
                          onPress={handleImportPDF}
                          disabled={isImportingAI}
                      >
                          {isImportingAI ? (
                              <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} />
                          ) : (
                              <>
                                  <MaterialCommunityIcons name="magic-staff" size={22} color={theme.isDark ? "#000" : "#FFF"} />
                                  <Text style={[{ color: theme.isDark ? "#000" : "#FFF", fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }]}>IMPORTAR TREINO DA MFIT (PDF)</Text>
                              </>
                          )}
                      </TouchableOpacity>

                      {/* ABAS DO TREINO */}
                      <View style={{ marginBottom: 15 }}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={isWeb} style={isWeb ? { overflowX: 'auto' } : {}} contentContainerStyle={{ gap: 10, paddingBottom: 5 }}>
                              {workoutTabs.map(tab => (
                                  <TouchableOpacity 
                                      key={tab} 
                                      style={[
                                          styles.tabBtnDynamic, 
                                          { backgroundColor: theme.surface, borderColor: theme.border }, 
                                          selectedWorkoutTab === tab && { borderColor: theme.accent, backgroundColor: theme.accent + '11' }
                                      ]} 
                                      onPress={() => { 
                                          if(selectedWorkoutTab === tab) {
                                              setNewTabName(tab);
                                              setRenameTabModalVisible(true);
                                          } else {
                                              setSelectedWorkoutTab(tab); 
                                              if(!exercisesByDay[tab]) setExercisesByDay({...exercisesByDay, [tab]: []}); 
                                          }
                                      }}
                                  >
                                      <Text style={[styles.tabBtnTextDynamic, { color: theme.textSecondary }, selectedWorkoutTab === tab && { color: theme.accent }]}>{tab}</Text>
                                      {selectedWorkoutTab === tab && <MaterialCommunityIcons name="pencil" size={12} color={theme.accent} style={{marginLeft: 5}} />}
                                  </TouchableOpacity>
                              ))}
                              
                              <TouchableOpacity style={[styles.tabBtnDynamic, { backgroundColor: theme.surface, borderColor: theme.border, borderStyle: 'dashed' }]} onPress={addNewTab}>
                                  <MaterialCommunityIcons name="plus" size={18} color={theme.textSecondary} />
                              </TouchableOpacity>
                          </ScrollView>
                      </View>

                      {isReordering && <Text style={{color: theme.textSecondary, textAlign:'center', fontStyle:'italic', marginBottom:10}}>Use as setas para mover os itens</Text>}

                      {currentExercises.length === 0 ? (
                          <View style={{alignItems:'center', marginTop:30}}>
                              <MaterialCommunityIcons name="dumbbell" size={40} color={theme.border} />
                              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Dia vazio.</Text>
                          </View>
                      ) : (
                          <>
                          {currentExercises.map((item, index) => (
                              <ExerciseCardAdmin 
                                  key={item.tempId}
                                  item={item}
                                  index={index}
                                  theme={theme}
                                  isReordering={isReordering}
                                  moveExercise={moveExercise}
                                  removeExercicio={removeExercicio}
                                  setIsSelectingSubstitute={setIsSelectingSubstitute}
                                  setTargetIndexForSubstitute={setTargetIndexForSubstitute}
                                  setModalBuscaVisible={setModalBuscaVisible}
                                  removeSubstitute={removeSubstitute}
                                  atualizarBloco={atualizarBloco}
                                  adicionarBloco={adicionarBloco}
                                  removerBloco={removerBloco}
                                  setIndexExercicioAtual={setIndexExercicioAtual}
                                  setIndexBlocoAtual={setIndexBlocoAtual}
                                  setModalTecnicaVisible={setModalTecnicaVisible}
                                  atualizarObservacao={atualizarObservacao}
                                  openPreview={openPreview}
                                  currentExercisesLength={currentExercises.length}
                                  setIsSwapping={setIsSwapping}
                                  setSwapIndex={setSwapIndex}
                                  setInitialCategoryFilter={(catName) => {
                                      const normalizedCat = catName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                                      const foundCat = categories.find(c => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === normalizedCat);
                                      if (foundCat) setSelectedCategory(foundCat);
                                  }}
                              />
                          ))}
                          
                          {!isReordering && (
                              <TouchableOpacity style={[styles.addBtnSmall, { borderColor: theme.border }]} onPress={() => { setIsSelectingSubstitute(false); setIsSwapping(false); setModalBuscaVisible(true); }}>
                                  <Text style={[styles.addBtnText, { color: theme.textSecondary }]}>+ ADICIONAR EXERCÍCIO</Text>
                              </TouchableOpacity>
                          )}
                          
                          {!isTemplateMode && (
                              <TouchableOpacity style={{ marginTop: 25, padding: 15, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={() => setModalSaveTemplateVisible(true)}>
                                  <MaterialCommunityIcons name="content-save-all" size={18} color={theme.accent} />
                                  <Text style={{color: theme.accent, fontWeight: 'bold', fontSize: 12}}>SALVAR ROTINA COMO TEMPLATE</Text>
                              </TouchableOpacity>
                          )}
                          </>
                      )}
              </View>
          </ScrollView>
      </KeyboardAvoidingView>

      {/* 🔥 MODAL PARA RENOMEAR/EXCLUIR ABA DE TREINO */}
      <Modal visible={renameTabModalVisible} transparent animationType="fade" onRequestClose={() => setRenameTabModalVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.accent }]}>GERENCIAR DIA</Text>
                  
                  <Text style={[styles.miniLabelLeft, { color: theme.textSecondary, marginTop: 10 }]}>NOME DO DIA/TREINO:</Text>
                  <TextInput 
                      style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginBottom: 20 }]} 
                      value={newTabName} 
                      onChangeText={setNewTabName}
                      autoFocus
                  />
                  
                  <View style={{flexDirection: 'row', gap: 10}}>
                      <TouchableOpacity style={[styles.saveBtnModal, { backgroundColor: theme.accent, flex: 1 }]} onPress={handleRenameTab}>
                          <Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight:'900'}}>SALVAR NOME</Text>
                      </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, gap: 5}} onPress={handleDeleteTab}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                      <Text style={{color: '#FF3B30', fontWeight: 'bold'}}>Excluir este dia inteiro</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={{marginTop:20, padding: 10}} onPress={() => setRenameTabModalVisible(false)}>
                      <Text style={{color: theme.textSecondary, textAlign:'center'}}>Cancelar</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* MODAIS DE CALENDÁRIO */}
      <Modal visible={showCalendarStart} transparent animationType="fade">
          <View style={styles.modalOverlay}><CustomCalendar selectedDate={startDate} onSelect={onSelectStartDate} onClose={() => setShowCalendarStart(false)} theme={theme} /></View>
      </Modal>

      <Modal visible={showCalendarEnd} transparent animationType="fade">
          <View style={styles.modalOverlay}><CustomCalendar selectedDate={endDate} onSelect={onSelectEndDate} onClose={() => setShowCalendarEnd(false)} theme={theme} /></View>
      </Modal>
      
      {/* 🔥 MODAL DE BUSCAR EXERCÍCIO (BIBLIOTECA) */}
      <Modal visible={modalBuscaVisible} animationType="slide">
          <View style={{ flex: 1, backgroundColor: webOuterBg }}>
              <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 10, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
                  <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: isWeb ? 20 : 10, paddingHorizontal: 20, paddingBottom: 15 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                          <Text style={[styles.headerTitle, { color: theme.text }]}>BIBLIOTECA</Text>
                          <TouchableOpacity onPress={() => { setModalBuscaVisible(false); setSelectedCategory('TODOS'); }}>
                              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                          </TouchableOpacity>
                      </View>
                      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                          <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Buscar exercício..." placeholderTextColor={theme.textSecondary} value={searchText} onChangeText={setSearchText} />
                      </View>
                      <TouchableOpacity style={[styles.catSelector, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setShowCatDropdown(!showCatDropdown)}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                              <MaterialCommunityIcons name="filter-variant" size={20} color={theme.textSecondary} />
                              <Text style={[styles.catSelectorVal, { color: theme.text }]}>{selectedCategory.toUpperCase()}</Text>
                          </View>
                          <MaterialCommunityIcons name={showCatDropdown ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                      </TouchableOpacity>
                  </View>
              </View>

              <FlatList 
                  style={[{ flex: 1, width: '100%' }, isWeb && { overflowY: 'auto' }]}
                  contentContainerStyle={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, paddingBottom: 100, flexGrow: 1, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
                  data={exerciciosFiltrados} 
                  keyExtractor={item => item.id} 
                  showsVerticalScrollIndicator={true}
                  ListHeaderComponent={showCatDropdown ? (
                      <View style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, marginBottom: 20, padding: 10, maxHeight: 200 }}>
                          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                              {categories.map(cat => (
                                  <TouchableOpacity key={cat} style={{ padding: 14, borderRadius: 10, backgroundColor: selectedCategory === cat ? theme.accent + '22' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => { setSelectedCategory(cat); setShowCatDropdown(false); }}>
                                      <Text style={{ color: selectedCategory === cat ? theme.accent : theme.text, fontWeight: selectedCategory === cat ? 'bold' : '500' }}>{cat}</Text>
                                      {selectedCategory === cat && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                  </TouchableOpacity>
                              ))}
                          </ScrollView>
                      </View>
                  ) : null}
                  renderItem={({ item }) => (
                      <View style={[styles.libItem, { borderBottomColor: theme.border }]}>
                          <SmartThumbnail url={item.videoUrl} style={styles.thumbList} theme={theme} onPress={() => openPreview(item)} />
                          <View style={{flex:1, marginLeft: 15}}>
                              <Text style={[styles.libName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                              <View style={[styles.catTag, { backgroundColor: theme.surface, marginTop: 5, alignSelf: 'flex-start' }]}><Text style={[styles.libCat, { color: theme.textSecondary }]}>{item.category}</Text></View>
                          </View>
                          <TouchableOpacity onPress={() => addExercicioManual(item)} style={{ padding: 8, backgroundColor: theme.accent + '22', borderRadius: 12 }}>
                              <MaterialCommunityIcons name={isSwapping ? "sync" : "plus"} size={24} color={theme.accent} />
                          </TouchableOpacity>
                      </View>
                  )} 
              />
          </View>
      </Modal>

      {/* 🔥 MODAL PREVIEW DO EXERCÍCIO */}
      <Modal visible={previewModalVisible} transparent animationType="fade" onRequestClose={() => { setPreviewModalVisible(false); setPreviewExercise(null); }}>
          <View style={styles.previewBackdrop}>
              <View style={[styles.previewContainer, { backgroundColor: theme.surface }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 15 }}>
                      <View style={{ flex: 1, marginRight: 15 }}>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text }} numberOfLines={2}>{previewExercise?.name}</Text>
                          <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>{previewExercise?.category}</Text>
                          </View>
                      </View>
                      <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: theme.border, justifyContent: 'center', alignItems: 'center' }} onPress={() => { setPreviewModalVisible(false); setPreviewExercise(null); }}>
                          <MaterialCommunityIcons name="close" size={18} color={theme.text} />
                      </TouchableOpacity>
                  </View>

                  <View style={{ flex: 1, marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.surface }}>
                      {previewModalVisible && previewExercise?.videoUrl ? (
                          Platform.OS === 'web' ? (
                              <video src={previewExercise.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px', outline: 'none' }} controls autoPlay loop muted />
                          ) : (
                              <Video ref={previewVideoRef} style={{ width: '100%', height: '100%' }} source={{ uri: previewExercise.videoUrl }} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted />
                          )
                      ) : (
                          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                              <MaterialCommunityIcons name="video-off-outline" size={40} color={theme.textSecondary} />
                          </View>
                      )}
                  </View>

                  <View style={{ padding: 20, paddingTop: 0 }}>
                      <TouchableOpacity style={{ backgroundColor: '#99CC00', padding: 18, borderRadius: 12, alignItems: 'center' }} onPress={() => addExercicioManual(previewExercise)}>
                          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>Adicionar ao treino</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      {/* 🔥 MODAL DE CLONAR ALUNO */}
      <Modal visible={modalCloneVisible} animationType="slide">
          <View style={{ flex: 1, backgroundColor: webOuterBg }}>
              <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 10, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
                  <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: isWeb ? 20 : 10, paddingHorizontal: 20, paddingBottom: 15 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <TouchableOpacity onPress={() => { if (selectedCloneStudent) setSelectedCloneStudent(null); else setModalCloneVisible(false); }}>
                              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                          </TouchableOpacity>
                          <Text style={[styles.headerTitle, { color: theme.text }]}>{selectedCloneStudent ? "ESCOLHA O TREINO" : "ESCOLHA O ALUNO"}</Text>
                          <View style={{width: 24}}/>
                      </View>
                  </View>
              </View>
              <FlatList 
                  style={[{ flex: 1, width: '100%' }, isWeb && { overflowY: 'auto' }]}
                  contentContainerStyle={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, paddingBottom: 100, flexGrow: 1, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
                  data={selectedCloneStudent ? cloneWorkoutsList : cloneStudentsList} 
                  keyExtractor={item => item.id} 
                  renderItem={({ item }) => (
                      <TouchableOpacity 
                          style={[styles.templateCard, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                          onPress={() => selectedCloneStudent ? applyClone(item) : fetchWorkoutsOfStudent(item.id)}
                      >
                          <View>
                              <Text style={[styles.templateName, { color: theme.text }]}>{item.name}</Text>
                              {item.email && <Text style={[styles.templateTags, { color: theme.textSecondary }]}>{item.email}</Text>}
                              {item.goal && <Text style={[styles.templateTags, { color: theme.textSecondary }]}>{item.goal} • {item.level}</Text>}
                          </View>
                          <MaterialCommunityIcons name={selectedCloneStudent ? "content-copy" : "chevron-right"} size={24} color={theme.accent} />
                      </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={{textAlign:'center', color: theme.textSecondary, marginTop: 20}}>{selectedCloneStudent ? "Este aluno não tem treinos montados." : "Nenhum aluno encontrado."}</Text>}
              />
          </View>
      </Modal>

      {/* 🔥 MODAL DE TEMPLATES VISUAIS COM PASTAS */}
      <Modal visible={modalTemplatesVisible} animationType="slide">
          <View style={{ flex: 1, backgroundColor: webOuterBg }}>
              <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 10, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
                  <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: isWeb ? 20 : 10, paddingHorizontal: 20, paddingBottom: 15 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.headerTitle, { color: theme.text }]}>BIBLIOTECA DE MODELOS</Text>
                          <TouchableOpacity onPress={() => setModalTemplatesVisible(false)}>
                              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                          </TouchableOpacity>
                      </View>
                  </View>
              </View>
              <FlatList 
                  style={[{ flex: 1, width: '100%' }, isWeb && { overflowY: 'auto' }]}
                  contentContainerStyle={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, paddingBottom: 100, flexGrow: 1, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
                  data={templatesList} 
                  keyExtractor={item => item.id} 
                  ListHeaderComponent={
                      <View style={{marginBottom: 20}}>
                          <Text style={{color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 10}}>FILTRAR POR OBJETIVO</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                              {goals.map(g => (
                                  <TouchableOpacity key={g} style={[styles.catChip, { backgroundColor: theme.surface, borderColor: theme.border }, templateGoal===g && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>{setTemplateGoal(g); fetchTemplates();}}>
                                      <Text style={[styles.catText, { color: theme.textSecondary }, templateGoal===g && {color: theme.isDark ? '#000' : '#FFF'}]}>{g}</Text>
                                  </TouchableOpacity>
                              ))}
                          </ScrollView>
                          <Text style={{color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 10}}>FILTRAR POR NÍVEL</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {levels.map(l => (
                                  <TouchableOpacity key={l} style={[styles.catChip, { backgroundColor: theme.surface, borderColor: theme.border }, templateLevel===l && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>{setTemplateLevel(l); fetchTemplates();}}>
                                      <Text style={[styles.catText, { color: theme.textSecondary }, templateLevel===l && {color: theme.isDark ? '#000' : '#FFF'}]}>{l}</Text>
                                  </TouchableOpacity>
                              ))}
                          </ScrollView>
                      </View>
                  }
                  renderItem={({ item }) => (
                      <TouchableOpacity style={[styles.templateCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => applyTemplate(item)}>
                          <View>
                              <Text style={[styles.templateName, { color: theme.text }]}>{item.name}</Text>
                              <Text style={[styles.templateTags, { color: theme.textSecondary }]}>{item.goal} • {item.level}</Text>
                          </View>
                          <MaterialCommunityIcons name="download" size={24} color={theme.accent} />
                      </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={{textAlign:'center', color: theme.textSecondary, marginTop: 20}}>Nenhum modelo encontrado nesta pasta.</Text>}
              />
          </View>
      </Modal>

      {/* 🔥 MODAL DE SALVAR TEMPLATE (MODELO NOVO) */}
      <Modal visible={modalSaveTemplateVisible} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.accent }]}>SALVAR COMO MODELO</Text>
                  <Text style={{color: theme.textSecondary, fontSize: 12, marginBottom: 15, textAlign: 'center'}}>Salve esta rotina para aplicar em outros alunos futuramente.</Text>
                  
                  <TextInput style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Nome do Template" placeholderTextColor={theme.textSecondary} value={saveTemplateName} onChangeText={setSaveTemplateName} />
                  
                  <Text style={[styles.miniLabelLeft, { color: theme.textSecondary }]}>OBJETIVO (PASTA)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15, maxHeight: 40}}>
                      {goals.filter(g => g !== 'TODOS').map(g => (
                          <TouchableOpacity key={g} style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.bg }, templateGoalInput===g && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>setTemplateGoalInput(g)}>
                              <Text style={[styles.tagText, { color: theme.textSecondary }, templateGoalInput===g && {color: theme.isDark ? '#000' : '#FFF'}]}>{g}</Text>
                          </TouchableOpacity>
                      ))}
                  </ScrollView>

                  <Text style={[styles.miniLabelLeft, { color: theme.textSecondary }]}>NÍVEL (PASTA)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20, maxHeight: 40}}>
                          {['Iniciante','Intermediário','Avançado'].map(l => (
                              <TouchableOpacity key={l} style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.bg }, templateLevelInput===l && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>setTemplateLevelInput(l)}>
                                  <Text style={[styles.tagText, { color: theme.textSecondary }, templateLevelInput===l && {color: theme.isDark ? '#000' : '#FFF'}]}>{l}</Text>
                              </TouchableOpacity>
                          ))}
                  </ScrollView>

                  <TouchableOpacity style={[styles.saveBtnModal, { backgroundColor: theme.accent }]} onPress={saveAsTemplate}>
                      <Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight:'900'}}>SALVAR NA BIBLIOTECA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{marginTop:15}} onPress={() => setModalSaveTemplateVisible(false)}>
                      <Text style={{color: theme.textSecondary, textAlign:'center'}}>Cancelar</Text>
                  </TouchableOpacity>
              </View>
          </KeyboardAvoidingView>
      </Modal>

      {/* OUTROS MODAIS (Técnica, Anamnese) */}
      <Modal visible={modalTecnicaVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.accent }]}>{modalTitleToShow}</Text>
                  {modalOptionsToShow.map((t) => (
                      <TouchableOpacity key={t.id} style={[styles.techOption, { borderBottomColor: theme.border }]} onPress={() => { atualizarBloco(indexExercicioAtual, indexBlocoAtual, 'technique', t.id); setModalTecnicaVisible(false); }}>
                          <Text style={[styles.techOptionText, { color: theme.text }, (exercisesByDay[selectedWorkoutTab]?.[indexExercicioAtual]?.blocks?.[indexBlocoAtual]?.technique === t.id) && {color: theme.accent}]}>
                              {t.title}
                          </Text>
                      </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={{marginTop:20, padding: 15, backgroundColor: theme.bg, borderRadius: 10, alignItems: 'center'}} onPress={() => setModalTecnicaVisible(false)}>
                      <Text style={{color: theme.text, fontWeight: 'bold'}}>Cancelar</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={anamneseModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.accent }]}>PRONTUÁRIO</Text>
                  <ScrollView style={{maxHeight: 400}}>
                      {detalhes?.anamnese ? (
                          <>
                          <View style={[styles.infoBlock, { borderBottomColor: theme.border }]}>
                              <Text style={[styles.infoLabel, { color: theme.accent }]}>OBJETIVO:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{detalhes.anamnese.objetivo || "-"}</Text>
                          </View>
                          <View style={[styles.infoBlock, { borderBottomColor: theme.border }]}>
                              <Text style={[styles.infoLabel, {color:'#FF3B30'}]}>LIMITAÇÕES:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{detalhes.anamnese.limitacoes?.join(', ') || "Nenhuma"}</Text>
                          </View>
                          <View style={[styles.infoBlock, { borderBottomColor: theme.border }]}>
                              <Text style={[styles.infoLabel, {color:'#FF3B30'}]}>CIRURGIAS:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{detalhes.anamnese.cirurgias?.join(', ') || "Nenhuma"}</Text>
                          </View>
                          </>
                      ) : <Text style={{color: theme.textSecondary}}>Sem dados.</Text>}
                  </ScrollView>
                  <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]} onPress={() => setAnamneseModal(false)}>
                      <Text style={{color: theme.text, fontWeight:'bold'}}>FECHAR</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent:'center', alignItems:'center' },
  healthBar: { flexDirection:'row', alignItems:'center', padding:15, borderRadius:12, marginBottom:20, gap:12, borderWidth:1 },
  healthTitle: { fontSize: 13, fontWeight: '900', letterSpacing:0.5 },
  healthSubtitle: { fontSize: 10, color: '#AAA', marginTop: 2 },
  planningContainer: { padding:15, borderRadius:15, borderWidth:1, marginBottom:20 },
  nameInput: { padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, fontSize: 16, fontWeight: 'bold', textAlign: 'center', outlineStyle: 'none' },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom:15 },
  dateInputGroup: { flex: 1 },
  dateLabel: { fontSize: 10, fontWeight: '900', marginBottom: 5 },
  dateDisplay: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, padding:12, borderRadius:8, borderWidth:1 },
  dateText: { fontWeight:'bold', fontSize:14 },
  archiveRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:10, borderRadius:10, borderWidth:1 },
  archiveLabel: { fontWeight:'900', fontSize:12 },
  configBox: { borderRadius:15, padding:15, marginBottom:15, borderWidth:1 },
  actionBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', padding:15, borderRadius:10, gap:8 },
  actionBtnText: { fontWeight:'900', fontSize:12 },
  toolsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  toolBtn: { flex: 1, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth:1 },
  toolBtnHighlight: { flex: 1, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  toolBtnText: { fontWeight: 'bold', fontSize: 11 },
  toolBtnTextDark: { fontWeight: '900', fontSize: 11 },
  
  tabBtnDynamic: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, flexDirection: 'row' },
  tabBtnTextDynamic: { fontWeight: 'bold', fontSize: 13 },
  
  addBtnSmall: { padding: 18, alignItems:'center', borderWidth:1, borderRadius:12, marginTop:10, borderStyle: 'dashed' },
  addBtnText: { fontWeight: 'bold', fontSize:13 },
  emptyText: { textAlign: 'center', marginVertical: 20 },
  
  headerTitle: { fontSize: 18, fontWeight: '900' },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500', outlineStyle: 'none' },
  
  catSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, borderWidth: 1 },
  catSelectorVal: { fontSize: 15, fontWeight: '800' },
  
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, height:32, justifyContent:'center', borderWidth:1 },
  catText: { fontSize: 11, fontWeight: 'bold' },
  
  libItem: { paddingVertical: 15, borderBottomWidth: 1, flexDirection:'row', alignItems:'center' },
  thumbList: { width: 60, height: 60, borderRadius: 14 },
  libName: { fontSize: 15, fontWeight: 'bold' },
  catTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  libCat: { fontSize: 10, fontWeight: '700' },
  
  templateCard: { padding:15, borderRadius:12, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1 },
  templateName: { fontWeight:'bold', fontSize:16 },
  templateTags: { fontSize:12, marginTop:4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 30 },
  modalContent: { borderRadius: 15, padding: 20, borderWidth: 1, width: '100%', maxWidth: 400, alignSelf: 'center' },
  modalTitle: { fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  modalInput: { padding:12, borderRadius:8, borderWidth:1, marginBottom:15, fontSize: 16, outlineStyle: 'none' },
  saveBtnModal: { padding:15, borderRadius:10, alignItems:'center', width:'100%' },
  techOption: { paddingVertical: 12, borderBottomWidth: 1 },
  techOptionText: { fontWeight: 'bold', textAlign: 'center' },
  closeBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', width: '100%', marginTop: 15 },
  infoBlock: { marginBottom: 15, borderBottomWidth:1, paddingBottom:5 },
  infoLabel: { fontSize:10, fontWeight:'900', marginBottom:2 },
  infoValue: { fontSize:14 },
  tag: { paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, marginRight:5, height: 30, justifyContent: 'center' },
  tagText: { fontSize:10, fontWeight:'bold' },
  miniLabelLeft: { fontSize:10, fontWeight:'bold', marginBottom:8 },

  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  previewContainer: { width: '100%', maxWidth: 420, height: '85%', maxHeight: 800, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
});