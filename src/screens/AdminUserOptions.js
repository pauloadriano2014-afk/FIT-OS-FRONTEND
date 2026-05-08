// src/screens/AdminUserOptions.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, 
    ActivityIndicator, StatusBar, Alert, Platform, Image, Switch, Modal, TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

import AdminUserWorkouts from '../components/AdminUserWorkouts';
import AdminUserSystem from '../components/AdminUserSystem';

const formatToBRDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const DIET_OPTIONS = [
    { id: 'NONE', label: '🚫 Ocultar Botão', desc: 'Aluno não verá a sugestão alimentar.' },
    { id: 'WEIGHT_LOSS', label: '📉 Definição / Emagrecimento', desc: 'Foco em secar (1200 a 1500 kcal)' },
    { id: 'HYPERTROPHY_M', label: '💪 Volume Muscular (Homem)', desc: 'Foco em crescer (2000 a 2500 kcal)' },
    { id: 'HYPERTROPHY_F', label: '🍑 Volume Muscular (Mulher)', desc: 'Foco em perna/glúteo (1500 a 2000 kcal)' }
];

export default function AdminUserOptions({ route, navigation }) {
  const { aluno } = route.params;
  const { theme } = useTheme(); 

  const [loading, setLoading] = useState(true);
  const [freshAluno, setFreshAluno] = useState(aluno); 
  
  const [activeWorkouts, setActiveWorkouts] = useState([]);
  const [archivedWorkouts, setArchivedWorkouts] = useState([]);
  
  const [superTab, setSuperTab] = useState('treinos'); 
  const [workoutTab, setWorkoutTab] = useState('active'); 
  
  const [isActiveUser, setIsActiveUser] = useState(aluno.active); 
  const [userPlan, setUserPlan] = useState('PREMIUM');

  const [fichaDaysElapsed, setFichaDaysElapsed] = useState(0);
  const [hasActiveFicha, setHasActiveFicha] = useState(false);

  const [photoUrl, setPhotoUrl] = useState(aluno.photoUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [evaluationUrl, setEvaluationUrl] = useState(aluno.evaluationUrl || ''); 

  const [nextCheckInDate, setNextCheckInDate] = useState(''); 
  const [disableCheckIn, setDisableCheckIn] = useState(aluno.disableCheckIn || false);

  const [dietGoal, setDietGoal] = useState(aluno.dietGoal || 'NONE');
  const [savingDiet, setSavingDiet] = useState(false);

  const [isDietTabVisible, setIsDietTabVisible] = useState(false);

  const [vipContents, setVipContents] = useState([]);
  const [userAccess, setUserAccess] = useState([]);
  const [loadingPaflix, setLoadingPaflix] = useState(false);

  // 🔥 ESTADOS PARA O MODAL DO RAIO-X DE CARGAS (ATUALIZADOS) 🔥
  const [isCargasModalVisible, setIsCargasModalVisible] = useState(false);
  const [historicoDeCargasList, setHistoricoDeCargasList] = useState([]);
  
  const [raioxSearch, setRaioxSearch] = useState('');
  const [raioxProgram, setRaioxProgram] = useState('TODOS');
  const [raioxDay, setRaioxDay] = useState('TODOS');
  const [showRaioxProgramDrop, setShowRaioxProgramDrop] = useState(false);
  const [showRaioxDayDrop, setShowRaioxDayDrop] = useState(false);

  // Controle de Dropdown dos exercícios (Acordeão)
  const [expandedExercises, setExpandedExercises] = useState({});
  const toggleAccordion = (exName) => {
      setExpandedExercises(prev => ({ ...prev, [exName]: !prev[exName] }));
  };

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(`@user_options_cache_${aluno.id}`);
        if (cached) {
          const { workouts, freshness } = JSON.parse(cached);
          setActiveWorkouts(workouts.active || []);
          setArchivedWorkouts(workouts.archived || []);
          if (freshness) {
              setFreshAluno(freshness);
              setEvaluationUrl(freshness.evaluationUrl || '');
              if (freshness.nextCheckInDate) setNextCheckInDate(formatToBRDate(freshness.nextCheckInDate));
              setDisableCheckIn(!!freshness.disableCheckIn);
              setPhotoUrl(freshness.photoUrl);
              setDietGoal(freshness.dietGoal || 'NONE'); 
              setIsDietTabVisible(!!freshness.dietModule); 
              
              const dbPlan = freshness.plan || 'PREMIUM';
              setUserPlan(['LOW_COST', 'CHALLENGE_21', 'FICHA_8S', 'ELITE', 'PERFORMANCE', 'PREMIUM'].includes(dbPlan) ? dbPlan : 'PREMIUM');
          }
          setLoading(false); 
        }
      } catch(e) {}
    };

    loadCache();
    const unsubscribe = navigation.addListener('focus', () => { fetchAllData(); });
    return unsubscribe;
  }, [navigation]);

  const fetchAllData = async () => {
    if (!aluno || !aluno.id) {
        setLoading(false);
        return; 
    }

    const t = Date.now();
    try {
        const [resWorkouts, resUser, resPaflix, resAccess] = await Promise.all([
            fetch(`https://fitos-final.onrender.com/api/workout?userId=${aluno.id}&t=${t}`),
            fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}?t=${t}`),
            fetch(`https://fitos-final.onrender.com/api/contents`),
            fetch(`https://fitos-final.onrender.com/api/admin/access?userId=${aluno.id}`)
        ]);

        let activeWk = [];
        let archivedWk = [];

        if (resWorkouts.ok) {
            const dataW = await resWorkouts.json();
            if (Array.isArray(dataW)) {
                const now = new Date();
                
                dataW.forEach(w => {
                    if (w.archived) {
                        archivedWk.push(w);
                        return;
                    }
                    if (!w.startDate && !w.endDate) {
                        activeWk.push(w);
                        return;
                    }
                    if (w.startDate) {
                        const start = new Date(w.startDate);
                        start.setHours(0, 0, 0, 0);
                        if (now < start) {
                            archivedWk.push(w);
                            return;
                        }
                    }
                    if (w.endDate) {
                        const end = new Date(w.endDate);
                        end.setHours(23, 59, 59, 999);
                        if (now > end) {
                            archivedWk.push(w);
                            return;
                        }
                    }
                    activeWk.push(w);
                });

                activeWk.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                archivedWk.sort((a,b) => new Date(b.endDate || b.createdAt) - new Date(a.endDate || a.createdAt));

                setActiveWorkouts(activeWk);
                setArchivedWorkouts(archivedWk);
                AsyncStorage.setItem(`@user_options_cache_${aluno.id}`, JSON.stringify({ workouts: { active: activeWk, archived: archivedWk }, freshness: aluno }));
            }
        }

        if (resUser.ok) {
            const fresh = await resUser.json();
            setFreshAluno(fresh);
            setEvaluationUrl(fresh.evaluationUrl || '');
            if (fresh.nextCheckInDate) setNextCheckInDate(formatToBRDate(fresh.nextCheckInDate));
            setDisableCheckIn(!!fresh.disableCheckIn);
            setPhotoUrl(fresh.photoUrl);
            setIsActiveUser(fresh.active);
            setDietGoal(fresh.dietGoal || 'NONE');
            setIsDietTabVisible(!!fresh.dietModule); 
            
            const finalPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S', 'ELITE', 'PERFORMANCE', 'PREMIUM'].includes(fresh.plan) ? fresh.plan : 'PREMIUM';
            setUserPlan(finalPlan);

            if (finalPlan === 'FICHA_8S') {
                let startD = new Date(fresh.createdAt || new Date());
                
                if (activeWk.length > 0) {
                    const currentWorkout = activeWk[0];
                    if (currentWorkout.startDate) {
                        startD = new Date(currentWorkout.startDate);
                    }
                    setHasActiveFicha(true);
                } else {
                    setHasActiveFicha(false);
                }
                
                startD.setHours(0,0,0,0);
                const todayD = new Date(); 
                todayD.setHours(0,0,0,0);
                
                const diffD = Math.floor((todayD.getTime() - startD.getTime()) / (1000 * 3600 * 24));
                setFichaDaysElapsed(Math.max(0, diffD));
            }
        }

        if (resPaflix.ok) {
            const contents = await resPaflix.json();
            if (Array.isArray(contents)) setVipContents(contents.filter(c => c.isVIP));
        }
        if (resAccess.ok) {
            const access = await resAccess.json();
            if (Array.isArray(access)) setUserAccess(access);
        }

    } catch (error) { 
        console.log("Erro no Motor Turbo:", error); 
    } finally { 
        setLoading(false); setLoadingPaflix(false);
    }
  };

  const confirmChangePlan = (newPlan) => {
      if (userPlan === newPlan) return;

      const planNames = {
          'ELITE': 'Consultoria Elite (Treino + Dieta)',
          'PERFORMANCE': 'Consultoria Performance (Só Treino)',
          'PREMIUM': 'Consultoria Premium (Antiga)',
          'FICHA_8S': 'Ficha 8 Semanas',
          'LOW_COST': 'Plano Básico',
          'CHALLENGE_21': 'Desafio 21 Dias'
      };

      const msg = `Tem certeza que deseja alterar o acesso deste aluno para o plano ${planNames[newPlan]}?`;

      if (Platform.OS === 'web') {
          if (window.confirm(msg)) handleChangePlan(newPlan);
      } else {
          Alert.alert("Alterar Plano", msg, [
              { text: "Cancelar", style: "cancel" },
              { text: "Sim, Alterar", onPress: () => handleChangePlan(newPlan) }
          ]);
      }
  };

  const handleChangePlan = async (newPlan) => {
      setUserPlan(newPlan); 
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
              method: 'PATCH', 
              headers: {'Content-Type': 'application/json'}, 
              body: JSON.stringify({ plan: newPlan })
          });
          
          if (!res.ok) throw new Error("Falha na API");
          
          if (Platform.OS === 'web') window.alert("Sucesso! Esteira do aluno atualizada.");
          fetchAllData(); 
      } catch(e) {
          if (Platform.OS === 'web') window.alert("Erro ao atualizar o plano.");
          else Alert.alert("Erro", "Falha ao atualizar o plano do aluno.");
          fetchAllData(); 
      }
  };

  const handleToggleDietTab = async () => {
      const newValue = !isDietTabVisible;
      setIsDietTabVisible(newValue);
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
              method: 'PATCH',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ dietModule: newValue })
          });
          if (!res.ok) throw new Error("Erro API");
      } catch(e) {
          setIsDietTabVisible(!newValue); 
          Alert.alert("Erro", "Não foi possível alterar a visibilidade da dieta.");
      }
  };

  const handlePickImage = async () => { 
      try {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
          if (!result.canceled) {
              const fileToUpload = result.assets[0];
              setUploadingPhoto(true);
              const formData = new FormData();
              if (Platform.OS === 'web') {
                  const res = await fetch(fileToUpload.uri);
                  const blob = await res.blob();
                  formData.append('file', blob, 'profile.jpg');
              } else {
                  const imageUri = Platform.OS === 'ios' ? fileToUpload.uri.replace('file://', '') : fileToUpload.uri;
                  formData.append('file', { uri: imageUri, name: 'profile.jpg', type: 'image/jpeg' });
              }
              const uploadRes = await fetch('https://fitos-final.onrender.com/api/upload-image', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' }});
              let uploadData;
              try { uploadData = await uploadRes.json(); } catch (e) { throw new Error(`Status: ${uploadRes.status}`); }
              if (!uploadRes.ok) throw new Error(uploadData.error || "Falha");
              const finalUrl = uploadData.imageUrl || uploadData.url;
              if (finalUrl) {
                  const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ photoUrl: finalUrl }) });
                  if (res.ok) {
                      setPhotoUrl(finalUrl);
                      if (Platform.OS === 'web') window.alert("Sucesso\n\nFoto atualizada!");
                      else Alert.alert("Sucesso", "Foto atualizada na nuvem!");
                  } else { Alert.alert("Erro", "A foto subiu, mas falhou."); }
              }
          }
      } catch(e) {
          if (Platform.OS === 'web') window.alert(`Erro: ${e.message}`);
          else Alert.alert("Erro", e.message);
      } finally { setUploadingPhoto(false); }
  };

  const handleToggleAccess = async (contentId, currentStatus) => {
      const newStatus = !currentStatus;
      if (newStatus) setUserAccess(prev => [...prev, contentId]);
      else setUserAccess(prev => prev.filter(id => id !== contentId));
      try {
          const res = await fetch('https://fitos-final.onrender.com/api/admin/access', {
              method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ userId: aluno.id, contentId, grant: newStatus })
          });
          if (!res.ok) throw new Error("Falha na API");
      } catch(e) {
          if (!newStatus) setUserAccess(prev => [...prev, contentId]);
          else setUserAccess(prev => prev.filter(id => id !== contentId));
          Alert.alert("Erro", "Falha ao atualizar a permissão do aluno.");
      }
  };

  const handleToggleStatus = async () => {
      const newStatus = !isActiveUser;
      const actionText = newStatus ? "ATIVAR" : "INATIVAR";
      const confirmAction = async () => {
          try {
              await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                  method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ active: newStatus })
              });
              setIsActiveUser(newStatus);
              if (Platform.OS === 'web') window.alert(`Sucesso\n\nAluno ${newStatus ? 'ativado' : 'inativado'}!`);
              else Alert.alert("Sucesso", `Aluno ${newStatus ? 'ativado' : 'inativado'}!`);
          } catch (e) { 
              if (Platform.OS === 'web') window.alert("Erro\n\nFalha ao atualizar status.");
              else Alert.alert("Erro", "Falha ao atualizar status."); 
          }
      };
      if (Platform.OS === 'web') {
          if (window.confirm(`Deseja ${actionText.toLowerCase()} o acesso deste aluno?`)) confirmAction();
      } else {
          Alert.alert(actionText, `Deseja ${actionText.toLowerCase()} o acesso deste aluno?`, [
              { text: "Cancelar", style: "cancel" }, { text: "Confirmar", onPress: confirmAction }
          ]);
      }
  };

  const handleDeleteUser = async () => {
      const confirmDelete = async () => {
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'DELETE' });
              if (res.ok) {
                  if (Platform.OS === 'web') window.alert("Excluído\n\nAluno removido permanentemente.");
                  else Alert.alert("Excluído", "Aluno removido.");
                  navigation.goBack();
              }
          } catch (e) {}
      };
      const msg = "ATENÇÃO: Isso apagará TODOS os treinos, histórico e check-ins deste aluno permanentemente.\n\nTem certeza?";
      if (Platform.OS === 'web') {
          if (window.confirm(msg)) confirmDelete();
      } else {
          Alert.alert("EXCLUIR ALUNO", msg, [{ text: "Cancelar", style: "cancel" }, { text: "EXCLUIR TUDO", style: 'destructive', onPress: confirmDelete }]);
      }
  };

  const handleSaveEvaluation = async () => {
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
              method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ evaluationUrl: evaluationUrl })
          });
          if (res.ok) {
              if (Platform.OS === 'web') window.alert("Sucesso!\n\nDados atualizados.");
              else Alert.alert("Sucesso", "Dados atualizados!");
          } else {
              if (Platform.OS === 'web') window.alert("Erro ao salvar.");
              else Alert.alert("Erro", "Erro ao salvar.");
          }
      } catch(e) { console.log(e); }
  };

  const handleDeleteWorkout = (workoutId) => {
      const deleteAction = async () => {
          try {
              await fetch(`https://fitos-final.onrender.com/api/workout/${workoutId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }});
              fetchAllData(); 
          } catch(e) {}
      };
      if (Platform.OS === 'web') { if (window.confirm("Deseja realmente apagar esta rotina?")) deleteAction(); } 
      else { Alert.alert("Excluir Rotina", "Tem certeza?", [{ text: "Cancelar", style: "cancel" }, { text: "Sim", style:'destructive', onPress: deleteAction }]); }
  };

  const handleToggleArchiveWorkout = async (workout) => {
      const newStatus = !workout.archived;
      const toggleAction = async () => {
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/workout/${workout.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: newStatus }) });
              if (!res.ok) {
                  await fetch(`https://fitos-final.onrender.com/api/workout`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: workout.id, archived: newStatus }) });
              }
              fetchAllData(); 
          } catch(e) {}
      };
      if (Platform.OS === 'web') { if (window.confirm(`Tem certeza?`)) toggleAction(); } 
      else { Alert.alert("Confirmar", "Tem certeza?", [{ text: "Cancelar", style: "cancel" }, { text: "Sim", onPress: toggleAction }]); }
  };

  const handleEditWorkout = (workout) => { 
      navigation.navigate('MontarTreinoAdmin', { aluno: JSON.stringify(aluno), workoutToEdit: workout, isEditing: true }); 
  };
  
  const handleNewWorkout = () => { 
      navigation.navigate('MontarTreinoAdmin', { aluno: JSON.stringify(aluno), isEditing: false }); 
  };

  const handleToggleDisableCheckIn = async () => {
      const newValue = !disableCheckIn;
      setDisableCheckIn(newValue); 
      try {
          await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ disableCheckIn: newValue }) });
      } catch(e) { setDisableCheckIn(!newValue); }
  };

  const handleCheckInDateChange = (text) => setNextCheckInDate(text);
  
  const handleSaveCheckInDate = async () => {
      let isoDate = null;
      if (nextCheckInDate && nextCheckInDate.length === 10) {
          const [day, month, year] = nextCheckInDate.split('/');
          isoDate = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();
      }
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ nextCheckInDate: isoDate }) });
          if (res.ok) {
              if (Platform.OS === 'web') window.alert(`Sucesso!`);
              else Alert.alert("Sucesso", "Data de check-in atualizada!");
          }
      } catch(e) {}
  };

  const handleSaveDietGoal = async () => {
      setSavingDiet(true);
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dietGoal })
          });
          if (res.ok) {
              if (Platform.OS === 'web') window.alert("Estratégia Alimentar salva e liberada no App do aluno!");
              else Alert.alert("Sucesso", "Sugestão Alimentar atualizada e liberada!");
          } else {
              throw new Error("Erro ao salvar dieta");
          }
      } catch (e) {
          if (Platform.OS === 'web') window.alert("Erro ao atualizar dieta.");
          else Alert.alert("Erro", "Falha de conexão ao salvar dieta.");
      } finally {
          setSavingDiet(false);
      }
  };

  // 🔥 LÓGICA DE EXTRAÇÃO E CRUZAMENTO (A CURA DO PASSADO E FUTURO) 🔥
  const abrirModalRaioxCargas = async () => {
      setIsCargasModalVisible(true);
      setRaioxSearch('');
      setRaioxProgram('TODOS');
      setRaioxDay('TODOS');
      setExpandedExercises({}); 
      
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${aluno.id}&t=${Date.now()}`);
          if (!res.ok) return;
          const historyList = await res.json();

          // 1. O MAPA DA MATRIZ: É ele quem salva a pátria dos treinos antigos!
          let mapaMatriz = {};
          let mapaExercicioDia = {};
          let mapaExercicioPrograma = {};

          const todosTreinos = [...activeWorkouts, ...archivedWorkouts];

          todosTreinos.forEach(w => {
              const programName = w.name;
              if (w.exercises && Array.isArray(w.exercises)) {
                  w.exercises.forEach(ex => {
                      if (ex.exerciseId) {
                          const exDay = ex.day || "Geral";
                          
                          // Salva a localização real do exercício na sua ficha (Ex: NPC? -> Quadz)
                          mapaExercicioPrograma[ex.exerciseId] = programName;
                          mapaExercicioDia[ex.exerciseId] = exDay;

                          // Extrai reps e técnicas bloco a bloco (12, 10, 8)
                          let blockIndex = 0;
                          
                          // Se você montou usando blocos novos
                          if (ex.blocks && Array.isArray(ex.blocks) && ex.blocks.length > 0) {
                              ex.blocks.forEach(blk => {
                                  mapaMatriz[`${ex.exerciseId}_${blockIndex}`] = {
                                      r: blk.reps || "12",
                                      t: blk.technique || null
                                  };
                                  blockIndex++;
                              });
                          } else {
                              // Se montou no formato antigo / JSON
                              let parsedFromTech = false;
                              if (typeof ex.technique === 'string' && ex.technique.includes('{')) {
                                  try {
                                      const parsed = JSON.parse(ex.technique);
                                      const blocks = parsed.b || parsed.B;
                                      if (blocks && Array.isArray(blocks)) {
                                          blocks.forEach(blk => {
                                              const sets = parseInt(blk.sets || blk.SETS) || 1;
                                              const rArr = String(blk.reps || blk.REPS || "12").split(/[-/]/);
                                              const tArr = String(blk.technique || blk.TECHNIQUE || "").split(/[-/]/);
                                              for (let i = 0; i < sets; i++) {
                                                  mapaMatriz[`${ex.exerciseId}_${blockIndex}`] = {
                                                      r: rArr[i] || rArr[0],
                                                      t: tArr[i] || tArr[0]
                                                  };
                                                  blockIndex++;
                                              }
                                          });
                                          parsedFromTech = true;
                                      }
                                  } catch(e) {}
                              }
                              
                              if (!parsedFromTech) {
                                  const numSets = parseInt(ex.sets) || 3;
                                  const rArr = String(ex.reps || "12").split(/[-/]/);
                                  const tArr = String(ex.technique || "").split(/[-/]/);
                                  for (let i = 0; i < numSets; i++) {
                                      mapaMatriz[`${ex.exerciseId}_${blockIndex}`] = {
                                          r: rArr[i] || rArr[0],
                                          t: tArr[i] || tArr[0]
                                      };
                                      blockIndex++;
                                  }
                              }
                          }
                      }
                  });
              }
          });

          let listaPlana = [];
          
          if (Array.isArray(historyList)) {
              historyList.forEach(hist => {
                  const dataFormatada = new Date(hist.date).toLocaleDateString('pt-BR');

                  if (hist.details && hist.details.length > 0) {
                      let exMap = {};
                      const detalhesOrdenados = [...hist.details].sort((a, b) => a.setNumber - b.setNumber);

                      detalhesOrdenados.forEach((detail) => {
                          const exId = detail.exerciseId;
                          const chaveUnica = `${exId}-${hist.id}`;

                          // 🔥 A MÁGICA: O Admin ignora o banco sujo e confia na Matriz!
                          let resolvedProgram = mapaExercicioPrograma[exId] || hist.workoutName || hist.name || "Sem Programa";
                          let resolvedDay = mapaExercicioDia[exId] || hist.name || "Treino Geral";

                          // Formata se for apenas letra ("A" vira "TREINO A", mas "Quadz" fica "Quadz")
                          if (resolvedDay.length === 1) resolvedDay = `TREINO ${resolvedDay.toUpperCase()}`;

                          if (!exMap[chaveUnica]) {
                              exMap[chaveUnica] = {
                                  exerciseName: detail.exerciseName || "Exercício",
                                  programName: resolvedProgram,
                                  dayName: resolvedDay,
                                  maxWeight: 0,
                                  setsData: [],
                                  contadorSeries: 0 
                              };
                          }
                          
                          const w = detail.weight || 0;
                          if (w > exMap[chaveUnica].maxWeight) exMap[chaveUnica].maxWeight = w;
                          
                          const sIndex = exMap[chaveUnica].contadorSeries;
                          exMap[chaveUnica].contadorSeries += 1; 

                          // 🔥 Busca reps exatas (12, 10, 8) e técnica da Matriz!
                          const infoMatriz = mapaMatriz[`${exId}_${sIndex}`] || {};
                          let repExata = infoMatriz.r || detail.reps || "12";
                          let techExata = infoMatriz.t || null;

                          // Limpeza de segurança final
                          if (typeof repExata === 'string' && repExata.includes('{')) repExata = "Falha";
                          if (typeof techExata === 'string' && techExata.includes('{')) techExata = null;

                          exMap[chaveUnica].setsData.push({
                              setLabel: `S${sIndex + 1}`,
                              weight: w,
                              reps: repExata, 
                              technique: techExata && techExata !== 'NORMAL' ? techExata : null
                          });
                      });

                      Object.keys(exMap).forEach(chave => {
                          const { contadorSeries, ...restoDoObjeto } = exMap[chave];
                          listaPlana.push({ ...restoDoObjeto, dateObj: new Date(hist.date), dateFormatted: dataFormatada });
                      });
                  }
              });
          }

          listaPlana.sort((a,b) => b.dateObj - a.dateObj);
          setHistoricoDeCargasList(listaPlana);
          
      } catch (e) {
          console.log("Erro", e);
      }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={{ height: isWeb ? '100vh' : '100%', width: '100%', backgroundColor: isWeb ? webOuterBg : theme.bg }}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
            
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>GERENCIAR ALUNO</Text>
                </View>
                <TouchableOpacity onPress={fetchAllData} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name="refresh" size={24} color={theme.accent}/>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 150, flexGrow: 1}} showsVerticalScrollIndicator={false}>
                
                {/* CABEÇALHO DO PERFIL */}
                <View style={[styles.profileHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer} activeOpacity={0.8}>
                        {uploadingPhoto ? (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border }]}><ActivityIndicator color={theme.accent} /></View>
                        ) : photoUrl ? (
                            <Image source={{uri: photoUrl}} style={[styles.avatarImage, { borderColor: theme.border }]} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <Text style={[styles.avatarText, { color: theme.accent }]}>{(aluno?.name || 'A').charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        <View style={[styles.editBadge, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="camera-plus" size={14} color="#000" /></View>
                    </TouchableOpacity>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: theme.text }]}>{aluno?.name || 'Aluno'}</Text>
                        <Text style={styles.profileEmail}>{aluno?.email || ''}</Text>
                    </View>
                </View>

                {/* CONTROLE DE SUPER-ABAS */}
                <View style={[styles.superTabsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity 
                        style={[styles.superTabBtn, superTab === 'treinos' && { backgroundColor: theme.accent }]}
                        onPress={() => setSuperTab('treinos')}
                    >
                        <Text style={[styles.superTabText, { color: superTab === 'treinos' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>TREINOS</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.superTabBtn, superTab === 'acessos' && { backgroundColor: theme.accent }]}
                        onPress={() => setSuperTab('acessos')}
                    >
                        <Text style={[styles.superTabText, { color: superTab === 'acessos' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>ACESSOS</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.superTabBtn, superTab === 'sistema' && { backgroundColor: theme.accent }]}
                        onPress={() => setSuperTab('sistema')}
                    >
                        <Text style={[styles.superTabText, { color: superTab === 'sistema' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>SISTEMA</Text>
                    </TouchableOpacity>
                </View>

                {/* =========================================
                    TAB 1: TREINOS 
                ========================================= */}
                {superTab === 'treinos' && (
                    <View style={styles.tabContent}>

                        {/* 🔥 BOTÃO RAIO-X DE CARGAS 🔥 */}
                        <TouchableOpacity 
                            style={[styles.cargasBtn, { backgroundColor: theme.surface, borderColor: theme.accent }]} 
                            onPress={abrirModalRaioxCargas}
                        >
                            <View style={[styles.accessIconBox, {backgroundColor: theme.accent + '22'}]}>
                                <MaterialCommunityIcons name="weight-lifter" size={20} color={theme.accent} />
                            </View>
                            <View style={{flex: 1, marginLeft: 12}}>
                                <Text style={{color: theme.accent, fontWeight: '900', fontSize: 13, letterSpacing: 0.5}}>HISTÓRICO DE CARGAS (RAIO-X)</Text>
                                <Text style={{color: theme.textSecondary, fontSize: 10, marginTop: 2}}>Veja os pesos salvos pelo aluno nos treinos.</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
                        </TouchableOpacity>

                        <View style={styles.subTabsRow}>
                            <TouchableOpacity style={[styles.subTabBtn, { borderBottomColor: theme.border }, workoutTab === 'active' && { borderBottomColor: theme.accent }]} onPress={() => setWorkoutTab('active')}>
                                <Text style={[styles.subTabText, { color: theme.textSecondary }, workoutTab === 'active' && { color: theme.accent }]}>ATIVAS</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.subTabBtn, { borderBottomColor: theme.border }, workoutTab === 'archived' && { borderBottomColor: theme.accent }]} onPress={() => setWorkoutTab('archived')}>
                                <Text style={[styles.subTabText, { color: theme.textSecondary }, workoutTab === 'archived' && { color: theme.accent }]}>ARQUIVADAS</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <AdminUserWorkouts 
                            theme={theme} userPlan={userPlan} viewMode={workoutTab} loading={loading}
                            activeWorkouts={activeWorkouts} archivedWorkouts={archivedWorkouts}
                            handleNewWorkout={handleNewWorkout} handleEditWorkout={handleEditWorkout}
                            handleToggleArchiveWorkout={handleToggleArchiveWorkout} handleDeleteWorkout={handleDeleteWorkout}
                            hasActiveFicha={hasActiveFicha} fichaDaysElapsed={fichaDaysElapsed} 
                            isFichaExpired={userPlan === 'FICHA_8S' && fichaDaysElapsed > 56} 
                            fichaDaysLeft={Math.max(0, 56 - fichaDaysElapsed)}
                        />
                    </View>
                )}

                {/* =========================================
                    TAB 2: ESTEIRA & ACESSOS VIP
                ========================================= */}
                {superTab === 'acessos' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionLabel}>ESTEIRA DE PRODUTOS</Text>
                        <Text style={[styles.sectionSubDesc, {marginBottom: 15}]}>Defina qual plano ou projeto este aluno comprou.</Text>
                        
                        <View style={styles.plansContainer}>
                            <TouchableOpacity style={[styles.planCard, userPlan === 'ELITE' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('ELITE')}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}>
                                    <MaterialCommunityIcons name="crown" size={18} color={userPlan === 'ELITE' ? theme.accent : theme.textSecondary} />
                                    <Text style={[styles.planTitle, { color: userPlan === 'ELITE' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>ELITE (TREINO+DIETA)</Text>
                                </View>
                                {userPlan === 'ELITE' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.planCard, userPlan === 'PERFORMANCE' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('PERFORMANCE')}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}>
                                    <MaterialCommunityIcons name="weight-lifter" size={18} color={userPlan === 'PERFORMANCE' ? theme.accent : theme.textSecondary} />
                                    <Text style={[styles.planTitle, { color: userPlan === 'PERFORMANCE' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>PERFORMANCE (SÓ TREINO)</Text>
                                </View>
                                {userPlan === 'PERFORMANCE' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.planCard, userPlan === 'PREMIUM' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('PREMIUM')}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}>
                                    <MaterialCommunityIcons name="star-circle" size={18} color={userPlan === 'PREMIUM' ? theme.accent : theme.textSecondary} />
                                    <Text style={[styles.planTitle, { color: userPlan === 'PREMIUM' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>PREMIUM (ANTIGO)</Text>
                                </View>
                                {userPlan === 'PREMIUM' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.planCard, userPlan === 'FICHA_8S' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('FICHA_8S')}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}>
                                    <MaterialCommunityIcons name="lightning-bolt" size={18} color={userPlan === 'FICHA_8S' ? theme.accent : theme.textSecondary} />
                                    <Text style={[styles.planTitle, { color: userPlan === 'FICHA_8S' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>FICHA 8 SEMANAS</Text>
                                </View>
                                {userPlan === 'FICHA_8S' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.planCard, userPlan === 'LOW_COST' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('LOW_COST')}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}>
                                    <MaterialCommunityIcons name="rocket-launch" size={18} color={userPlan === 'LOW_COST' ? theme.accent : theme.textSecondary} />
                                    <Text style={[styles.planTitle, { color: userPlan === 'LOW_COST' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>PLANO BÁSICO</Text>
                                </View>
                                {userPlan === 'LOW_COST' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.planCard, userPlan === 'CHALLENGE_21' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('CHALLENGE_21')}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}>
                                    <MaterialCommunityIcons name="fire" size={18} color={userPlan === 'CHALLENGE_21' ? theme.accent : theme.textSecondary} />
                                    <Text style={[styles.planTitle, { color: userPlan === 'CHALLENGE_21' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>DESAFIO 21 DIAS</Text>
                                </View>
                                {userPlan === 'CHALLENGE_21' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <Text style={styles.sectionLabel}>PERMISSÕES DE CONTEÚDO VIP (PA FLIX)</Text>
                        <Text style={styles.sectionSubDesc}>Ligue a chave para liberar o acesso manual aos bônus.</Text>

                        {loadingPaflix ? <ActivityIndicator color={theme.accent} style={{marginTop:20}} /> : (
                            vipContents.length === 0 ? (
                                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="lock-outline" size={40} color={theme.textSecondary} />
                                    <Text style={styles.emptyText}>Nenhum conteúdo VIP cadastrado no sistema ainda.</Text>
                                </View>
                            ) : (
                                vipContents.map(content => {
                                    const hasAccess = userAccess.includes(content.id);
                                    const iconName = content.type === 'ebook' ? 'book-open-variant' : (content.type === 'audio' ? 'headphones' : 'video');
                                    
                                    return (
                                        <View key={content.id} style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={[styles.accessIconBox, { backgroundColor: theme.bg }]}>
                                                <MaterialCommunityIcons name={iconName} size={24} color={hasAccess ? theme.accent : theme.textSecondary} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 15, paddingRight: 10 }}>
                                                <Text style={[styles.accessTitle, { color: theme.text }]}>{content.title}</Text>
                                                <Text style={styles.accessCategory}>{content.category}</Text>
                                            </View>
                                            <Switch 
                                                value={hasAccess}
                                                onValueChange={() => handleToggleAccess(content.id, hasAccess)}
                                                trackColor={{ false: '#333', true: theme.accent }}
                                                thumbColor={Platform.OS === 'ios' ? '#FFF' : (hasAccess ? '#000' : '#888')}
                                            />
                                        </View>
                                    )
                                })
                            )
                        )}
                    </View>
                )}

                {/* =========================================
                    TAB 3: SISTEMA E DIETA
                ========================================= */}
                {superTab === 'sistema' && (
                    <View style={styles.tabContent}>

                        <Text style={[styles.sectionLabel, {color: theme.accent}]}>LABORATÓRIO NUTRICIONAL (IA)</Text>
                        <Text style={[styles.sectionSubDesc, {marginBottom: 15}]}>Gerencie a visibilidade e a montagem do plano alimentar deste aluno.</Text>

                        {/* 🔥 BOTÃO MANUAL PARA MOSTRAR/ESCONDER A MAÇÃ NO APP DO ALUNO 🔥 */}
                        <View style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 15 }]}>
                            <View style={[styles.accessIconBox, { backgroundColor: theme.bg }]}>
                                <MaterialCommunityIcons name="food-apple" size={24} color={isDietTabVisible ? theme.accent : theme.textSecondary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 15, paddingRight: 10 }}>
                                <Text style={[styles.accessTitle, { color: theme.text }]}>Liberar Aba "Dieta" no App</Text>
                                <Text style={styles.accessCategory}>Se ativado, a maçã ficará visível no celular do aluno.</Text>
                            </View>
                            <Switch 
                                value={isDietTabVisible}
                                onValueChange={handleToggleDietTab}
                                trackColor={{ false: '#333', true: theme.accent }}
                                thumbColor={Platform.OS === 'ios' ? '#FFF' : (isDietTabVisible ? '#000' : '#888')}
                            />
                        </View>

                        {/* BOTÃO DA MESA DE OPERAÇÕES */}
                        <TouchableOpacity 
                            style={[styles.aiDietBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}
                            onPress={() => navigation.navigate('AdminDietScreen', { 
                                aluno: freshAluno || aluno,
                                alunoId: aluno.id 
                            })}
                        >
                            <View style={[styles.accessIconBox, {backgroundColor: theme.accent + '22'}]}>
                                <MaterialCommunityIcons name="view-dashboard-edit-outline" size={22} color={theme.accent} />
                            </View>
                            <View style={{flex: 1, marginLeft: 15}}>
                                <Text style={{color: theme.accent, fontWeight: '900', fontSize: 14, letterSpacing: 0.5}}>ABRIR MESA DE OPERAÇÕES</Text>
                                <Text style={{color: theme.textSecondary, fontSize: 11, marginTop: 2}}>Montar dieta com Tabela TACO e Macros</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
                        </TouchableOpacity>
                        
                        <View style={[styles.premiumCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 15 }]}>
                            <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                                <View style={[styles.iconBox, {backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, width: 36, height: 36, borderRadius: 18}]}>
                                    <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={theme.textSecondary} />
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={[styles.cardTitle, {color: theme.text}]}>Estratégia Básica (Fallback)</Text>
                                    <Text style={{color: theme.textSecondary, fontSize: 11}}>Sugestão genérica em PDF para alunos que não possuem a dieta prescrita na Mesa de Operações.</Text>
                                </View>
                            </View>
                            <View style={{ padding: 20 }}>
                                {DIET_OPTIONS.map(opt => (
                                    <TouchableOpacity 
                                        key={opt.id}
                                        style={{flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: dietGoal === opt.id ? theme.accent : theme.border, backgroundColor: dietGoal === opt.id ? theme.accent + '15' : theme.bg, marginBottom: 10}}
                                        onPress={() => setDietGoal(opt.id)}
                                        disabled={userPlan === 'CHALLENGE_21'} 
                                    >
                                        <MaterialCommunityIcons name={dietGoal === opt.id ? "radiobox-marked" : "radiobox-blank"} size={20} color={dietGoal === opt.id ? theme.accent : theme.textSecondary} />
                                        <View style={{flex: 1, marginLeft: 10}}>
                                            <Text style={{color: dietGoal === opt.id ? theme.accent : theme.text, fontWeight: 'bold', fontSize: 13}}>{opt.label}</Text>
                                            <Text style={{color: theme.textSecondary, fontSize: 11, marginTop: 2}}>{opt.desc}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                                {userPlan !== 'CHALLENGE_21' && (
                                    <TouchableOpacity 
                                        style={[styles.saveBtnLg, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, width: '100%', marginTop: 10, flexDirection: 'row', gap: 8, height: 48 }]} 
                                        onPress={handleSaveDietGoal}
                                        disabled={savingDiet}
                                    >
                                        {savingDiet ? <ActivityIndicator color={theme.text} /> : (
                                            <>
                                                <MaterialCommunityIcons name="content-save" size={18} color={theme.text} />
                                                <Text style={{color: theme.text, fontWeight: '900', fontSize: 12, letterSpacing: 0.5}}>SALVAR ESTRATÉGIA BÁSICA</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        {/* OUTROS CONTROLES DO SISTEMA */}
                        <AdminUserSystem 
                            theme={theme} navigation={navigation} aluno={aluno} userPlan={userPlan}
                            isActiveUser={isActiveUser} handleToggleStatus={handleToggleStatus}
                            disableCheckIn={disableCheckIn} handleToggleDisableCheckIn={handleToggleDisableCheckIn}
                            nextCheckInDate={nextCheckInDate} handleCheckInDateChange={handleCheckInDateChange} handleSaveCheckInDate={handleSaveCheckInDate}
                            evaluationUrl={evaluationUrl} setEvaluationUrl={setEvaluationUrl} handleSaveEvaluation={handleSaveEvaluation}
                            handleDeleteUser={handleDeleteUser}
                        />
                    </View>
                )}

            </ScrollView>
        </View>

        {/* 🔥 MODAL DO RAIO-X: DROPDOWNS EM CASCATA E COMPARAÇÃO DE EVOLUÇÃO 🔥 */}
        <Modal visible={isCargasModalVisible} transparent animationType="slide" onRequestClose={() => setIsCargasModalVisible(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
                <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', height: '85%', backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: theme.border }}>
                    
                    {/* CABEÇALHO */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <MaterialCommunityIcons name="weight-lifter" size={24} color={theme.accent} />
                            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text, letterSpacing: 0.5 }}>RAIO-X DE CARGAS</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsCargasModalVisible(false)} style={{padding: 5}}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.text}/>
                        </TouchableOpacity>
                    </View>

                    {/* FILTROS INTELIGENTES */}
                    <View style={{ padding: 20, borderBottomWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', zIndex: 10 }}>
                        
                        {/* BARRA DE PESQUISA */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bg, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, marginBottom: 15 }}>
                            <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                            <TextInput 
                                style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: theme.text, fontWeight: 'bold', outlineStyle: 'none' }}
                                placeholder="Buscar exercício (Ex: Puxada)"
                                placeholderTextColor={theme.textSecondary}
                                value={raioxSearch}
                                onChangeText={setRaioxSearch}
                            />
                            {raioxSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setRaioxSearch('')}>
                                    <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* DROPDOWNS EM CASCATA: PERIODIZAÇÃO E DIA */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {(() => {
                                // 🔥 LÓGICA DA CASCATA: Calcula os programas e os dias disponíveis
                                const programasDisponiveis = Array.from(new Set(historicoDeCargasList.map(i => i.programName))).sort();
                                const diasDisponiveis = Array.from(new Set(historicoDeCargasList.filter(i => raioxProgram === 'TODOS' || i.programName === raioxProgram).map(i => i.dayName))).sort();

                                return (
                                    <>
                                        {/* Dropdown 1: Periodização */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#888', marginBottom: 6 }}>PERIODIZAÇÃO</Text>
                                            <TouchableOpacity 
                                                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}
                                                onPress={() => { setShowRaioxProgramDrop(!showRaioxProgramDrop); setShowRaioxDayDrop(false); }}
                                            >
                                                <Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}} numberOfLines={1}>{raioxProgram}</Text>
                                                <MaterialCommunityIcons name={showRaioxProgramDrop ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                            
                                            {showRaioxProgramDrop && (
                                                <ScrollView style={{ position: 'absolute', top: 60, left: 0, right: 0, maxHeight: 200, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, zIndex: 20 }}>
                                                    <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }} onPress={() => { setRaioxProgram('TODOS'); setRaioxDay('TODOS'); setShowRaioxProgramDrop(false); }}>
                                                        <Text style={{color: raioxProgram === 'TODOS' ? theme.accent : theme.text, fontWeight: 'bold', fontSize: 11}}>TODOS</Text>
                                                    </TouchableOpacity>
                                                    {programasDisponiveis.map(prog => (
                                                        <TouchableOpacity key={prog} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }} onPress={() => { setRaioxProgram(prog); setRaioxDay('TODOS'); setShowRaioxProgramDrop(false); }}>
                                                            <Text style={{color: raioxProgram === prog ? theme.accent : theme.text, fontWeight: raioxProgram === prog ? 'bold' : 'normal', fontSize: 11}}>{prog}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            )}
                                        </View>

                                        {/* Dropdown 2: Dia (Só mostra os dias do programa selecionado) */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#888', marginBottom: 6 }}>DIA DE TREINO</Text>
                                            <TouchableOpacity 
                                                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}
                                                onPress={() => { setShowRaioxDayDrop(!showRaioxDayDrop); setShowRaioxProgramDrop(false); }}
                                            >
                                                <Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}} numberOfLines={1}>{raioxDay}</Text>
                                                <MaterialCommunityIcons name={showRaioxDayDrop ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                            
                                            {showRaioxDayDrop && (
                                                <ScrollView style={{ position: 'absolute', top: 60, left: 0, right: 0, maxHeight: 200, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, zIndex: 20 }}>
                                                    <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }} onPress={() => { setRaioxDay('TODOS'); setShowRaioxDayDrop(false); }}>
                                                        <Text style={{color: raioxDay === 'TODOS' ? theme.accent : theme.text, fontWeight: 'bold', fontSize: 11}}>TODOS</Text>
                                                    </TouchableOpacity>
                                                    {diasDisponiveis.map(dia => (
                                                        <TouchableOpacity key={dia} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }} onPress={() => { setRaioxDay(dia); setShowRaioxDayDrop(false); }}>
                                                            <Text style={{color: raioxDay === dia ? theme.accent : theme.text, fontWeight: raioxDay === dia ? 'bold' : 'normal', fontSize: 11}}>{dia}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            )}
                                        </View>
                                    </>
                                );
                            })()}
                        </View>
                    </View>
                    
                    {/* LISTA E COMPARAÇÃO DE EVOLUÇÃO */}
                    <ScrollView contentContainerStyle={{padding: 20}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {(() => {
                            let filtrados = historicoDeCargasList;
                            
                            if (raioxProgram !== 'TODOS') filtrados = filtrados.filter(i => i.programName === raioxProgram);
                            if (raioxDay !== 'TODOS') filtrados = filtrados.filter(i => i.dayName === raioxDay);
                            if (raioxSearch.trim() !== '') {
                                const searchLower = raioxSearch.toLowerCase();
                                filtrados = filtrados.filter(i => i.exerciseName.toLowerCase().includes(searchLower));
                            }

                            if (filtrados.length === 0) {
                                return (
                                    <View style={{ alignItems:'center', padding: 30, borderStyle:'dashed', borderWidth:1, borderColor: theme.border, borderRadius:10 }}>
                                        <MaterialCommunityIcons name="text-box-search-outline" size={40} color={theme.textSecondary} style={{opacity: 0.5}} />
                                        <Text style={{ color: '#888', textAlign: 'center', fontStyle: 'italic', marginTop: 10 }}>Nenhuma carga encontrada para estes filtros.</Text>
                                    </View>
                                );
                            }

                            // Agrupa os itens pelo Nome do Exercício
                            const agrupado = {};
                            filtrados.forEach(item => {
                                if (!agrupado[item.exerciseName]) agrupado[item.exerciseName] = [];
                                agrupado[item.exerciseName].push(item);
                            });

                            return Object.keys(agrupado).sort().map((exName, index) => {
                                const historyEntries = agrupado[exName];
                                const pr = Math.max(...historyEntries.map(i => i.maxWeight));
                                const isExpanded = !!expandedExercises[exName]; // Verifica se este exercício está aberto no acordeão!

                                return (
                                    <View key={index} style={{ marginBottom: 15, backgroundColor: theme.bg, borderRadius: 14, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                                        
                                        {/* 🔥 BOTÃO DO ACORDEÃO 🔥 */}
                                        <TouchableOpacity 
                                            style={{ padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isExpanded ? theme.surface : theme.bg }}
                                            onPress={() => toggleAccordion(exName)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={{ color: theme.accent, fontSize: 16, fontWeight: '900', flex: 1, paddingRight: 10 }}>{exName}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>PR: {pr}kg</Text>
                                                <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                                            </View>
                                        </TouchableOpacity>
                                        
                                        {/* 🔥 CONTEÚDO EXPANDIDO (SÓ MOSTRA SE CLICAR) 🔥 */}
                                        {isExpanded && (
                                            <View style={{ padding: 18, borderTopWidth: 1, borderColor: theme.border }}>
                                                {historyEntries.map((item, hIdx) => {
                                                    const barWidth = pr > 0 ? Math.max(10, (item.maxWeight / pr) * 100) : 10;
                                                    
                                                    return (
                                                        <View key={hIdx} style={{ marginBottom: hIdx === historyEntries.length - 1 ? 0 : 20 }}>
                                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                                                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>{item.dateFormatted} • {item.programName} ({item.dayName})</Text>
                                                                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '900' }}>Máx: {item.maxWeight}kg</Text>
                                                            </View>
                                                            
                                                            <View style={{ height: 6, backgroundColor: theme.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                                                                <View style={{ height: '100%', width: `${barWidth}%`, backgroundColor: theme.accent, borderRadius: 3 }} />
                                                            </View>

                                                            {/* BLOCOS DE SÉRIES COM TÉCNICAS E REPETIÇÕES EXATAS */}
                                                            <View style={{ backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                                                                {item.setsData.map((setInfo, sIdx) => (
                                                                    <View key={sIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: sIdx === item.setsData.length - 1 ? 0 : 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900', width: 22 }}>{setInfo.setLabel}</Text>
                                                                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>{setInfo.weight}kg <Text style={{color: theme.textSecondary, fontWeight: 'normal'}}>x {setInfo.reps}</Text></Text>
                                                                        </View>
                                                                        
                                                                        {/* BADGE DA TÉCNICA AVANÇADA! */}
                                                                        {setInfo.technique && (
                                                                            <View style={{ backgroundColor: theme.accent + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                                                <Text style={{ color: theme.accent, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}>{setInfo.technique.replace(/_/g, ' ')}</Text>
                                                                            </View>
                                                                        )}
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </View>
                                );
                            });
                        })()}
                    </ScrollView>
                </View>
            </View>
        </Modal>

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems:'center', borderBottomWidth:1 },
  headerTitle: { fontWeight:'900', fontSize:16 },
  
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  avatarImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 1 },
  avatarText: { fontWeight: '900', fontSize: 28 },
  editBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '900' },
  profileEmail: { color: '#888', fontSize: 12, marginTop: 2 },

  superTabsContainer: { flexDirection: 'row', borderRadius: 12, padding: 5, marginBottom: 25, borderWidth: 1 },
  superTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  superTabText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  tabContent: { flex: 1, animationDuration: '0.3s' },

  subTabsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  subTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
  subTabText: { fontWeight: 'bold', fontSize: 11 },

  plansContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  planCard: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontWeight: '900', fontSize: 10, letterSpacing: 0.5, flexShrink: 1 },
  accessCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  accessIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  accessTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  accessCategory: { fontSize: 10, color: '#888', fontWeight: 'bold' },

  premiumCard: { borderRadius: 20, marginBottom: 20, borderWidth: 1, overflow: 'hidden', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15, borderBottomWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
  iconBox: { justifyContent: 'center', alignItems: 'center' },
  saveBtnLg: { borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  aiDietBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1 },

  // 🔥 ESTILO DO BOTÃO DE CARGAS 🔥
  cargasBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },

  divider: { height:1, marginVertical:20 },
  sectionLabel: { color:'#888', fontWeight:'900', marginBottom:5, fontSize:12, letterSpacing:1 },
  sectionSubDesc: { color: '#888', fontSize: 11, marginBottom: 15 },
  
  emptyBox: { alignItems:'center', padding: 30, borderStyle:'dashed', borderWidth:1, borderRadius:10, marginVertical: 10 },
  emptyText: { color: '#888', textAlign: 'center', fontStyle: 'italic', marginTop: 10 },

  // 🔥 ESTILOS DO MODAL RAIO-X DE CARGAS 🔥
  modalOverlayCargas: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContentCargas: { width: '100%', maxWidth: 600, alignSelf: 'center', height: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0 },
  modalHeaderCargas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitleCargas: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  cargaItem: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  cargaExName: { fontSize: 15, fontWeight: '900', marginBottom: 2 },
  cargaWorkoutName: { fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
  cargaSeriesBox: { padding: 10, borderRadius: 8, borderWidth: 1 },
  cargaSeriesText: { fontSize: 13, fontWeight: 'bold', lineHeight: 20 },
});