// src/hooks/useMontarTreino.js
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

export const useMontarTreino = (route, navigation) => {
    const { aluno, isTemplateMode, templateData, workoutToEdit, isEditing } = route.params || {};

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
                formData.append('file', { uri: fileToUpload.uri, name: fileToUpload.name, type: fileToUpload.mimeType || 'application/pdf' });
            }

            const response = await fetch('https://fitos-final.onrender.com/api/admin/import-pdf', {
                method: 'POST', body: formData, headers: { 'Accept': 'application/json' }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro na importação da IA');

            if (data.workoutName) setCustomWorkoutName(data.workoutName);

            if (data.exercisesByDay) {
                const newExercisesByDay = {};
                const normalizeForSearch = (str) => {
                    if (!str) return "";
                    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(no|na|com|de|da|do|em|c\/)\b/g, " ").replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim(); 
                };

                Object.keys(data.exercisesByDay).forEach(day => {
                    newExercisesByDay[day] = data.exercisesByDay[day].map((aiEx) => {
                        const aiNameNorm = normalizeForSearch(aiEx.title);
                        const aiWords = aiNameNorm.split(" ").filter(w => w.length > 2);

                        const match = biblioteca.find(b => {
                            const bNameNorm = normalizeForSearch(b.name);
                            if (bNameNorm === aiNameNorm || bNameNorm.includes(aiNameNorm) || aiNameNorm.includes(bNameNorm)) return true;
                            const bWords = bNameNorm.split(" ");
                            const aInB = aiWords.length > 0 && aiWords.every(w => bWords.includes(w));
                            return aInB;
                        });

                        return {
                            exerciseId: match ? match.id : `custom_${Math.random()}`, 
                            title: match ? match.name : aiEx.title,
                            videoUrl: match ? match.videoUrl : '',
                            category: aiEx.category || (match ? match.category : ''),
                            observation: aiEx.observation || '',
                            tempId: Math.random().toString(),
                            substitute: null,
                            blocks: aiEx.blocks && aiEx.blocks.length > 0 ? aiEx.blocks : [{ sets: String(aiEx.sets || '3'), reps: String(aiEx.reps || '12'), restTime: String(aiEx.restTime || '60'), technique: aiEx.technique || '' }]
                        };
                    });
                });

                setExercisesByDay(newExercisesByDay);
                const extractedTabs = Object.keys(newExercisesByDay);
                if (extractedTabs.length > 0) {
                    setWorkoutTabs(extractedTabs);
                    setSelectedWorkoutTab(extractedTabs[0]);
                }
                
                if (Platform.OS === 'web') window.alert("🔥 IA Finalizada!\n\nTreino importado com precisão brutal.");
                else Alert.alert("🔥 IA Finalizada!", "Treino importado com precisão brutal.");
            }
        } catch (error) {
            if (Platform.OS === 'web') window.alert("Erro: Não foi possível processar o PDF.");
            else Alert.alert("Erro", "Não foi possível processar o PDF.");
        } finally { setIsImportingAI(false); }
    };

    const moveTab = (direction) => {
        const currentIndex = workoutTabs.indexOf(selectedWorkoutTab);
        if (direction === 'left' && currentIndex > 0) {
            const newTabs = [...workoutTabs];
            [newTabs[currentIndex - 1], newTabs[currentIndex]] = [newTabs[currentIndex], newTabs[currentIndex - 1]];
            setWorkoutTabs(newTabs);
        } else if (direction === 'right' && currentIndex < workoutTabs.length - 1) {
            const newTabs = [...workoutTabs];
            [newTabs[currentIndex + 1], newTabs[currentIndex]] = [newTabs[currentIndex], newTabs[currentIndex + 1]];
            setWorkoutTabs(newTabs);
        }
    };

    const handleDeleteTab = () => {
        if (workoutTabs.length === 1) { 
            if (Platform.OS === 'web') window.alert('Você precisa ter pelo menos um dia de treino.');
            else Alert.alert('Atenção', 'Você precisa ter pelo menos um dia de treino.'); 
            return; 
        }
        const doDelete = () => {
            const updatedTabs = workoutTabs.filter(t => t !== selectedWorkoutTab);
            const nextTab = updatedTabs[0];
            const updatedExercises = { ...exercisesByDay };
            delete updatedExercises[selectedWorkoutTab];

            setWorkoutTabs(updatedTabs);
            setExercisesByDay(updatedExercises);
            setSelectedWorkoutTab(nextTab);
            setRenameTabModalVisible(false);
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Apagar o treino "${selectedWorkoutTab}" e todos os seus exercícios?`)) doDelete();
        } else {
            Alert.alert('Excluir', `Apagar o treino "${selectedWorkoutTab}"?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: doDelete }]);
        }
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
        const doClear = () => setExercisesByDay({ ...exercisesByDay, [selectedWorkoutTab]: [] });
        if (Platform.OS === 'web') {
            if (window.confirm(`Apagar todos os exercícios do treino "${selectedWorkoutTab}"?`)) doClear();
        } else {
            Alert.alert("Limpar", `Apagar todos os exercícios do treino "${selectedWorkoutTab}"?`, [{ text: "Cancelar", style: "cancel" }, { text: "Limpar", onPress: doClear }]);
        }
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
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setCloneStudentsList(data.filter(u => u.role !== 'ADMIN'));
            }
        } catch(e) {}
    };

    const fetchWorkoutsOfStudent = async (studentId) => {
        setSelectedCloneStudent(studentId);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${studentId}&t=${Date.now()}`);
            if(res.ok) { const data = await res.json(); setCloneWorkoutsList(data); }
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

    const saveAsTemplate = async () => {
        if (!saveTemplateName) return Alert.alert("Erro", "Dê um nome ao template.");
        try {
            const orderedExercisesByDay = {};
            workoutTabs.forEach(tab => {
                if (exercisesByDay[tab]) orderedExercisesByDay[tab] = exercisesByDay[tab];
            });

            const res = await fetch('https://fitos-final.onrender.com/api/admin/templates', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name: saveTemplateName, goal: templateGoalInput, level: templateLevelInput, data: JSON.stringify(orderedExercisesByDay) })
            });
            if (!res.ok) throw new Error("Erro");
            setModalSaveTemplateVisible(false);
            Alert.alert("Sucesso", "Modelo salvo!");
        } catch (e) { Alert.alert("Erro", "Falha ao salvar modelo."); }
    };

    // 🔥 CIRURGIA AQUI: O MODAL NÃO FECHA MAIS SOZINHO (A NÃO SER QUE SEJA SUBSTITUIÇÃO/TROCA)
    const addExercicioManual = (ex) => {
      const currentList = [...(exercisesByDay[selectedWorkoutTab] || [])];
      const isCardio = ex.category?.toUpperCase() === 'CARDIO';
      const initialBlocks = isCardio ? [{ sets: '20', reps: '200', restTime: '0', technique: 'Moderada' }] : [{ sets: '3', reps: '12', restTime: '60', technique: '' }];

      if (isSwapping && swapIndex !== null) {
          currentList[swapIndex] = { ...currentList[swapIndex], exerciseId: ex.id, title: ex.name, videoUrl: ex.videoUrl, category: ex.category };
          setIsSwapping(false); setSwapIndex(null);
          setModalBuscaVisible(false); // Fecha na troca
          setSearchText(''); setSelectedCategory('TODOS');
      } else if (isSelectingSubstitute && targetIndexForSubstitute !== null) {
          currentList[targetIndexForSubstitute].substitute = { id: ex.id, name: ex.name, videoUrl: ex.videoUrl };
          setIsSelectingSubstitute(false); setTargetIndexForSubstitute(null);
          setModalBuscaVisible(false); // Fecha na substituição
          setSearchText(''); setSelectedCategory('TODOS');
      } else {
          currentList.push({ exerciseId: ex.id, title: ex.name, videoUrl: ex.videoUrl, observation: '', tempId: Math.random().toString(), substitute: null, category: ex.category, blocks: initialBlocks });
          // 🔥 O SEGREDO DO CARRINHO DE COMPRAS: ELE NÃO FECHA, NÃO LIMPA A BUSCA E NÃO MUDA A CATEGORIA!
      }
      setExercisesByDay({ ...exercisesByDay, [selectedWorkoutTab]: currentList });
      setPreviewModalVisible(false); 
    };

    const removeSubstitute = (i) => { const l=[...exercisesByDay[selectedWorkoutTab]]; l[i].substitute=null; setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]:l}); };
    const removeExercicio = (id) => { setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: exercisesByDay[selectedWorkoutTab].filter(x => x.tempId !== id)}); };
    const moveExercise = (i, dir) => { 
        const l = [...(exercisesByDay[selectedWorkoutTab] || [])]; 
        if(dir==='up' && i>0) { [l[i-1], l[i]] = [l[i], l[i-1]]; } else if(dir==='down' && i < l.length-1) { [l[i+1], l[i]] = [l[i], l[i+1]]; }
        setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); 
    };
    const atualizarObservacao = (i, v) => { const l=[...exercisesByDay[selectedWorkoutTab]]; l[i].observation=v; setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]:l}); };
    const adicionarBloco = (exIndex) => { const l = [...exercisesByDay[selectedWorkoutTab]]; const lastBlock = l[exIndex].blocks[l[exIndex].blocks.length - 1]; l[exIndex].blocks.push({ sets: '1', reps: lastBlock.reps, restTime: lastBlock.restTime, technique: '' }); setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); };
    const removerBloco = (exIndex, blockIndex) => { const l = [...exercisesByDay[selectedWorkoutTab]]; l[exIndex].blocks.splice(blockIndex, 1); setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); };
    const atualizarBloco = (exIndex, blockIndex, field, value) => { const l = [...exercisesByDay[selectedWorkoutTab]]; l[exIndex].blocks[blockIndex][field] = value; setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); };

    const salvarTreinoFinal = async () => {
      const alertMsg = (title, msg) => { if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`); else Alert.alert(title, msg); };
      if (!customWorkoutName) return alertMsg("Erro", "Defina um nome para a rotina.");
      setSending(true);

      const orderedExercisesByDay = {};
      workoutTabs.forEach(tab => {
          if (exercisesByDay[tab]) orderedExercisesByDay[tab] = exercisesByDay[tab];
      });

      if (isTemplateMode) {
          try {
              const res = await fetch('https://fitos-final.onrender.com/api/admin/templates', { 
                  method: 'POST', headers: {'Content-Type': 'application/json'}, 
                  body: JSON.stringify({ id: templateData?.id, name: customWorkoutName, goal: templateGoalInput, level: templateLevelInput, data: JSON.stringify(orderedExercisesByDay) }) 
              });
              if (!res.ok) throw new Error("Erro");
              alertMsg("Sucesso", "Template salvo!"); navigation.goBack();
          } catch(e) { alertMsg("Erro", "Falha ao salvar template."); } finally { setSending(false); }
          return;
      }

      let flatExercises = [];
      let temFantasma = false; 
      let globalOrder = 0; 

      workoutTabs.forEach(day => {
          if (!exercisesByDay[day]) return;
          exercisesByDay[day].forEach((ex) => {
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
                  order: globalOrder++, 
                  observation: ex.observation || "", 
                  substituteId: ex.substitute ? String(ex.substitute.id) : null 
              });
          });
      });

      if (temFantasma) { setSending(false); return alertMsg("⚠️ EXERCÍCIOS FANTASMAS ENCONTRADOS!", "Existem exercícios na lista destacados em VERMELHO. Sincronize-os com sua biblioteca oficial antes de salvar."); }

      let finalEndDate = endDate;
      if (isArchived) { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); finalEndDate = yesterday; }

      try {
        const isUpdate = isEditing && workoutToEdit?.id;
        const endpoint = isUpdate ? `https://fitos-final.onrender.com/api/workout/${workoutToEdit.id}` : `https://fitos-final.onrender.com/api/workout`; 
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(endpoint, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: aluno?.id, name: customWorkoutName, exercises: flatExercises, startDate: startDate.toISOString(), endDate: finalEndDate.toISOString(), archiveCurrent: false }) });
        if (!response.ok) throw new Error("Erro");

        alertMsg("Sucesso", isArchived ? "Rotina arquivada com sucesso!" : "Rotina salva com sucesso!"); navigation.goBack(); 
      } catch (e) { alertMsg("Erro", "Falha de conexão."); } finally { setSending(false); }
    };

    const openPreview = (ex) => { setPreviewExercise(ex); setPreviewModalVisible(true); };

    const currentExercises = exercisesByDay[selectedWorkoutTab] || [];
    const exerciciosFiltrados = biblioteca.filter(e => e.name.toLowerCase().includes(searchText.toLowerCase()) && (selectedCategory === 'TODOS' || e.category === selectedCategory));
    const hasInjury = detalhes?.anamnese && ((detalhes.anamnese.limitacoes && detalhes.anamnese.limitacoes.length > 0) || (detalhes.anamnese.cirurgias && detalhes.anamnese.cirurgias.length > 0));

    return {
        state: {
            detalhes, biblioteca, loading, sending, isImportingAI, workoutTabs, selectedWorkoutTab, exercisesByDay, renameTabModalVisible, newTabName, customWorkoutName, startDate, endDate, isArchived, isReordering, showCalendarStart, showCalendarEnd, templateGoalInput, templateLevelInput, modalTecnicaVisible, modalBuscaVisible, modalTemplatesVisible, modalSaveTemplateVisible, anamneseModal, modalCloneVisible, cloneStudentsList, selectedCloneStudent, cloneWorkoutsList, previewModalVisible, previewExercise, isSelectingSubstitute, targetIndexForSubstitute, searchText, selectedCategory, showCatDropdown, indexExercicioAtual, indexBlocoAtual, isSwapping, swapIndex, templateGoal, templateLevel, templatesList, saveTemplateName, categories, goals, levels, tecnicasDisponiveis, intensidadesCardio, currentExercises, exerciciosFiltrados, hasInjury, isTemplateMode
        },
        setters: {
            setNewTabName, setRenameTabModalVisible, setSelectedWorkoutTab, setCustomWorkoutName, setShowCalendarStart, setShowCalendarEnd, setIsArchived, setIsReordering, setTemplateGoalInput, setTemplateLevelInput, setModalTecnicaVisible, setModalBuscaVisible, setModalTemplatesVisible, setModalSaveTemplateVisible, setAnamneseModal, setModalCloneVisible, setSelectedCloneStudent, setPreviewModalVisible, setPreviewExercise, setIsSelectingSubstitute, setTargetIndexForSubstitute, setSearchText, setSelectedCategory, setShowCatDropdown, setIndexExercicioAtual, setIndexBlocoAtual, setIsSwapping, setSwapIndex, setTemplateGoal, setTemplateLevel, setSaveTemplateName
        },
        actions: {
            handleImportPDF, handleDeleteTab, addNewTab, handleRenameTab, handleClearWorkout, onSelectStartDate, onSelectEndDate, fetchTemplates, applyTemplate, fetchStudentsForClone, fetchWorkoutsOfStudent, applyClone, saveAsTemplate, addExercicioManual, removeSubstitute, removeExercicio, moveExercise, atualizarObservacao, adicionarBloco, removerBloco, atualizarBloco, salvarTreinoFinal, openPreview, moveTab 
        }
    };
};