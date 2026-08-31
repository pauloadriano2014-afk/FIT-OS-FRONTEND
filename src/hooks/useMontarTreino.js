// src/hooks/useMontarTreino.js
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { PAULO_ID, ADRI_ID, MASTER_IDS } from '../constants/masterIds';
import { authHeaders } from '../utils/authToken';

export function useMontarTreino(route, navigation) {
    const { aluno, isTemplateMode, templateData, workoutToEdit, isEditing, laboratoryStructure, laboratoryConfig } = route.params || {};

    let parsedTemplate = null;
    let draftId = '';

    if (isTemplateMode && templateData) {
        try {
            parsedTemplate = typeof templateData === 'string' ? JSON.parse(templateData) : templateData;
            draftId = parsedTemplate.id ? parsedTemplate.id : 'novo_template';
        } catch (e) {
            draftId = 'novo_template_corrompido';
        }
    }

    const draftKey = workoutToEdit?.id 
        ? `@draft_edit_${workoutToEdit.id}` 
        : isTemplateMode 
            ? `@draft_template_${draftId}` 
            : `@draft_new_${aluno?.id || 'avulso'}`;

    const [detalhes, setDetalhes] = useState({ anamnese: {} });
    const [biblioteca, setBiblioteca] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isImportingAI, setIsImportingAI] = useState(false);
    const [adminId, setAdminId] = useState(null);
    const [lastAutoSaved, setLastAutoSaved] = useState(null); // 🔥 Timestamp do último rascunho salvo no aparelho
    
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

    const [workoutModel, setWorkoutModel] = useState('CARGA');
    const [workoutEnvironment, setWorkoutEnvironment] = useState('UNIVERSAL'); // 🔥 NOVO

    // 🔥 ALTERNÂNCIA SEMANAL: null = sempre visível pro aluno (comportamento de
    // sempre). 1 ou 2 = só aparece nas semanas "1 e 3" ou "2 e 4" da dupla,
    // contando em blocos de 7 dias a partir do início da rotina mais antiga
    // entre as que estiverem marcadas (ver TrainingScreen.js).
    const [alternateSlot, setAlternateSlot] = useState(null);

    const [intensityMultiplier, setIntensityMultiplier] = useState(1.0);
    const [intensityEndDate, setIntensityEndDate] = useState(null);
    const [showCalendarIntensity, setShowCalendarIntensity] = useState(false);

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
    const [cloneSearchText, setCloneSearchText] = useState('');
    // 🔥 Filtro por coach no modal de clonar — só é usado quando o admin logado é master (Paulo/Adri).
    // Começa mostrando só os próprios alunos ('OWN'); dá pra trocar pra ver os do outro master ou todos.
    const [cloneCoachFilter, setCloneCoachFilter] = useState('OWN');
    
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [previewExercise, setPreviewExercise] = useState(null);
    
    const [isSelectingSubstitute, setIsSelectingSubstitute] = useState(false);
    const [targetIndexForSubstitute, setTargetIndexForSubstitute] = useState(null);
    const [searchText, setSearchText] = useState('');
    
    const [selectedCategory, setSelectedCategory] = useState('TODOS');
    const [selectedSubCat, setSelectedSubCat] = useState('Todos');
    const [showCatDropdown, setShowCatDropdown] = useState(false); 
    
    const [indexExercicioAtual, setIndexExercicioAtual] = useState(null);
    const [indexBlocoAtual, setIndexBlocoAtual] = useState(null);

    const [isSwapping, setIsSwapping] = useState(false);
    const [swapIndex, setSwapIndex] = useState(null);

    const [smartSubstitutesModal, setSmartSubstitutesModal] = useState(false);
    const [smartSubstitutesList, setSmartSubstitutesList] = useState([]);

    const [templateGoal, setTemplateGoal] = useState('TODOS');
    const [templateLevel, setTemplateLevel] = useState('TODOS');
    const [templatesList, setTemplatesList] = useState([]);
    const [saveTemplateName, setSaveTemplateName] = useState('');
    
    const [collections, setCollections] = useState([]);
    const [saveTemplateCollectionId, setSaveTemplateCollectionId] = useState(null);
    
    const [selectedLibraryCollection, setSelectedLibraryCollection] = useState(null);
    const [selectedPillar, setSelectedPillar] = useState(null);
    const [selectedLevelTab, setSelectedLevelTab] = useState('Iniciante');

    const categories = ['TODOS', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Mobilidade', 'Cardio'];
    const goals = ['Hipertrofia', 'Emagrecimento', 'Definição', 'Fortalecimento', 'Qualidade de Vida', 'Competição'];
    const levels = ['Iniciante', 'Intermediário', 'Avançado'];
    
    const tecnicasDisponiveis = [
        { id: '', title: 'NORMAL' }, 
        { id: 'GVT', title: 'GVT (10x10)' }, 
        { id: 'DROPSET', title: 'DROP-SET' }, 
        { id: 'RESTPAUSE', title: 'REST-PAUSE' }, 
        { id: 'BISET', title: 'BI-SET' },
        { id: 'TRISET', title: 'TRI-SET' },
        { id: '21', title: 'MÉTODO 21' },
        { id: 'CLUSTERSET', title: 'CLUSTER' },
        { id: '1_5_REPS', title: '1 E MEIO (1.5 REPS)' },
        { id: 'TUT', title: 'T.U.T. (TEMPO SOB TENSÃO)' }
    ];
    
    const intensidadesCardio = [
        { id: 'Leve', title: 'Leve / Aquecimento' }, 
        { id: 'Moderada', title: 'Moderada' }, 
        { id: 'Zona 2', title: 'Trote (Zona 2)' }, 
        { id: 'Forte', title: 'Forte' }, 
        { id: 'HIIT', title: 'HIIT (Tiros)' }
    ];

    useEffect(() => {
        const autoSave = async () => {
            if (loading) return;
            const now = new Date().getTime();
            const dataToSave = {
                exercisesByDay, workoutTabs, customWorkoutName, workoutModel, workoutEnvironment,
                intensityMultiplier, intensityEndDate: intensityEndDate ? intensityEndDate.toISOString() : null,
                lastUpdated: now
            };
            await AsyncStorage.setItem(draftKey, JSON.stringify(dataToSave));
            setLastAutoSaved(now); // 🔥 Confirma no state que o rascunho foi gravado no aparelho, pra UI poder mostrar
        };
        autoSave();
    }, [exercisesByDay, workoutTabs, customWorkoutName, workoutModel, workoutEnvironment, intensityMultiplier, intensityEndDate, loading]);

    useEffect(() => { 
        if (!isEditing && !isTemplateMode && !laboratoryStructure) {
            setExercisesByDay({ 'A': [] }); setWorkoutTabs(['A']); setSelectedWorkoutTab('A');
            setCustomWorkoutName(''); setStartDate(new Date()); setEndDate(new Date(new Date().setDate(new Date().getDate() + 30)));
            setIsArchived(false); setWorkoutModel('CARGA'); setWorkoutEnvironment('UNIVERSAL');
            setIntensityMultiplier(1.0); setIntensityEndDate(null);
        }
        fetchDados(); 
    }, [isEditing, isTemplateMode, laboratoryStructure]);

    const fetchDados = async () => {
        setLoading(true);
        const t = Date.now();
        try {
            const userJson = await AsyncStorage.getItem('user');
            let currentAdminId = '';
            if (userJson) {
                const userObj = JSON.parse(userJson);
                currentAdminId = userObj.id;
                setAdminId(currentAdminId);
            }

            try {
                const authHdrs = await authHeaders();
                const [resCol, resTemp] = await Promise.all([
                    fetch(`https://fitos-final.onrender.com/api/admin/collections?adminId=${currentAdminId}&t=${t}`, { headers: { ...authHdrs } }),
                    fetch(`https://fitos-final.onrender.com/api/admin/templates?adminId=${currentAdminId}&t=${t}`, { headers: { ...authHdrs } })
                ]);
                if (resCol.ok) setCollections(await resCol.json());
                if (resTemp.ok) setTemplatesList(await resTemp.json());
            } catch(e) {}

            let fetchedBib = [];
            const cachedEx = await AsyncStorage.getItem('@global_exercises');
            if (cachedEx) {
                fetchedBib = JSON.parse(cachedEx);
                setBiblioteca(fetchedBib);
            }

            try {
                const resEx = await fetch(`https://fitos-final.onrender.com/api/exercise?adminId=${currentAdminId}&t=${t}`, {
                    headers: { ...(await authHeaders()) },
                });
                if (resEx.ok) {
                    const dataEx = await resEx.json();
                    if (Array.isArray(dataEx)) {
                        fetchedBib = dataEx;
                        setBiblioteca(dataEx);
                        AsyncStorage.setItem('@global_exercises', JSON.stringify(dataEx));
                    }
                }
            } catch(e) {}

            if (aluno?.id) {
                const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}?t=${t}`, {
                    headers: { ...(await authHeaders()) },
                });
                if (resUser.ok) {
                    const u = await resUser.json();
                    let anam = u.anamneses?.[0] || u.anamnese || {};
                    setDetalhes({ ...u, anamnese: anam });
                }
            }

            let draftLoaded = false;

            const savedDraft = await AsyncStorage.getItem(draftKey);
            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    // 🔥 Janela de validade do rascunho aumentada de 24h pra 7 dias — se a internet cair
                    // e o coach só voltar pro app dias depois, o trabalho continua ali esperando.
                    if (parsedDraft && parsedDraft.exercisesByDay && (new Date().getTime() - parsedDraft.lastUpdated < 7 * 86400000)) {
                        setExercisesByDay(parsedDraft.exercisesByDay);
                        if (parsedDraft.workoutTabs && parsedDraft.workoutTabs.length > 0) {
                            setWorkoutTabs(parsedDraft.workoutTabs);
                            setSelectedWorkoutTab(parsedDraft.workoutTabs[0]); 
                        }
                        if (parsedDraft.customWorkoutName) setCustomWorkoutName(parsedDraft.customWorkoutName);
                        if (parsedDraft.workoutModel) setWorkoutModel(parsedDraft.workoutModel);
                        if (parsedDraft.workoutEnvironment) setWorkoutEnvironment(parsedDraft.workoutEnvironment);
                        if (parsedDraft.intensityMultiplier) setIntensityMultiplier(parsedDraft.intensityMultiplier);
                        if (parsedDraft.intensityEndDate) setIntensityEndDate(new Date(parsedDraft.intensityEndDate));
                        draftLoaded = true;
                    } else {
                        await AsyncStorage.removeItem(draftKey);
                    }
                } catch (e) {}
            }

            if (!draftLoaded) {
                const { prefillData } = route.params || {};
                if (!draftLoaded && prefillData?.exercisesByDay) {
                    const tabs = prefillData.workoutTabs || Object.keys(prefillData.exercisesByDay);
                    const hydratedExercises = {};
                    tabs.forEach(tab => {
                        hydratedExercises[tab] = (prefillData.exercisesByDay[tab] || []).map(ex => {
                            const subs = [];
                            if (ex.substitutes) subs.push(...ex.substitutes);
                            else if (ex.substitute) subs.push(ex.substitute);
                            return {
                                ...ex,
                                tempId: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
                                substitutes: subs,
                                blocks: (ex.blocks || []).map(b => ({
                                    sets: String(b.sets || '1'),
                                    reps: String(b.reps || '12'),
                                    load: b.load || '',
                                    restTime: String(b.restTime || '60'),
                                    technique: b.technique || '',
                                })),
                            };
                        });
                    });
                    setExercisesByDay(hydratedExercises);
                    setWorkoutTabs(tabs);
                    setSelectedWorkoutTab(tabs[0]);
                    setCustomWorkoutName(prefillData.workoutName || '');
                    if (prefillData.workoutModel) setWorkoutModel(prefillData.workoutModel);
                    if (prefillData.trainingEnvironment) setWorkoutEnvironment(prefillData.trainingEnvironment);
                    draftLoaded = true;
                }

                if (laboratoryStructure && Object.keys(laboratoryStructure).length > 0) {
                    const newExercisesByDay = {};
                    const tabs = Object.keys(laboratoryStructure);

                    const generateSmartBlocks = (muscle, level, isCardio) => {
                        if (isCardio) return [{ sets: '20', reps: '200', restTime: '0', technique: 'Moderada', load: '' }];
                        if (level === 'INICIANTE') return [{ sets: '3', reps: '15', restTime: '60', technique: '', load: '' }];
                        let repsArray = level === 'AVANÇADO' ? ['15', '12', '10', '8'] : ['12', '12', '10', '10'];
                        return repsArray.map((rep) => ({ sets: '1', reps: rep, restTime: '60', technique: '', load: '' }));
                    };

                    tabs.forEach(day => {
                        newExercisesByDay[day] = laboratoryStructure[day].map(exItem => {
                            const exactName = exItem.name;
                            const muscleId = exItem.muscle;
                            const normalizedSuggested = exactName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                            const match = fetchedBib.find(b => b.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === normalizedSuggested);
                            const isCardio = muscleId.toUpperCase() === 'CARDIO PÓS';
                            const smartBlocks = generateSmartBlocks(muscleId, laboratoryConfig?.level, isCardio);
                            return {
                                exerciseId: match ? match.id : `custom_${Math.random()}`,
                                title: match ? match.name : exactName,
                                videoUrl: match ? match.videoUrl : '',
                                category: match ? match.category : (isCardio ? 'Cardio' : ''),
                                subCategory: match ? match.subCategory : '',
                                observation: '',
                                tempId: Math.random().toString(),
                                substitutes: [],
                                blocks: smartBlocks
                            };
                        });
                    });

                    setExercisesByDay(newExercisesByDay);
                    setWorkoutTabs(tabs);
                    setSelectedWorkoutTab(tabs[0]);
                    setCustomWorkoutName(`${laboratoryConfig?.gender === 'FEMININO' ? 'Treino Feminino' : 'Treino Masculino'} - ${laboratoryConfig?.objective || 'Personalizado'}`);
                }
                else if (isEditing && workoutToEdit) {
                    setCustomWorkoutName(workoutToEdit.name);
                    setWorkoutModel(workoutToEdit.workoutModel || 'CARGA');
                    setAlternateSlot(workoutToEdit.alternateSlot ?? null);
                    setIntensityMultiplier(workoutToEdit.intensityMultiplier || 1.0);
                    if (workoutToEdit.intensityEndDate) setIntensityEndDate(new Date(workoutToEdit.intensityEndDate));
                    if (workoutToEdit.startDate) setStartDate(new Date(workoutToEdit.startDate));
                    if (workoutToEdit.endDate) {
                        const end = new Date(workoutToEdit.endDate);
                        setEndDate(end);
                        if (end < new Date()) setIsArchived(true);
                    }
                    processWorkoutDataToState(workoutToEdit.exercises);

                    try {
                        const resFresh = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${aluno?.id}&workoutId=${workoutToEdit.id}&t=${t}`, {
                            headers: { ...(await authHeaders()) },
                        });
                        if (resFresh.ok) {
                            const freshWorkout = await resFresh.json();
                            if (freshWorkout && freshWorkout.id) {
                                setIntensityMultiplier(freshWorkout.intensityMultiplier || 1.0);
                                if (freshWorkout.intensityEndDate) setIntensityEndDate(new Date(freshWorkout.intensityEndDate));
                                else setIntensityEndDate(null);
                                if (freshWorkout.workoutModel) setWorkoutModel(freshWorkout.workoutModel);
                                setAlternateSlot(freshWorkout.alternateSlot ?? null);
                            }
                        }
                    } catch(e) {}
                } 
                else if (isTemplateMode && parsedTemplate) {
                    setCustomWorkoutName(parsedTemplate.name || '');
                    setTemplateGoalInput(parsedTemplate.goal || 'Hipertrofia');
                    setTemplateLevelInput(parsedTemplate.level || 'Intermediário');
                    if (parsedTemplate.workoutModel) setWorkoutModel(parsedTemplate.workoutModel);

                    try {
                        const parsedDataStructure = typeof parsedTemplate.data === 'string' ? JSON.parse(parsedTemplate.data) : parsedTemplate.data;
                        const extractedTabs = Object.keys(parsedDataStructure);
                        if(extractedTabs.length > 0) {
                            setWorkoutTabs(extractedTabs);
                            setSelectedWorkoutTab(extractedTabs[0]);
                        }
                        const normalData = {};
                        extractedTabs.forEach(t => {
                            normalData[t] = parsedDataStructure[t].map(x => {
                                const s = [];
                                if (x.substitutes) s.push(...x.substitutes);
                                else if (x.substitute) s.push(x.substitute);
                                return {...x, substitutes: s};
                            });
                        });
                        setExercisesByDay(normalData || {'A': []});
                    } catch (e) { setExercisesByDay({'A': []}); }
                }
            }

        } catch (err) { 
            console.log("Erro ao carregar dados do treino:", err);
        } finally { 
            setLoading(false); 
        }
    };

    const fetchTemplates = async () => {
        try {
            const currentAdminId = adminId || JSON.parse(await AsyncStorage.getItem('user')).id;
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/templates?adminId=${currentAdminId}&t=${Date.now()}`, {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) setTemplatesList(await res.json());
        } catch (e) {}
    };

    const processWorkoutDataToState = (exercisesArray) => {
        if (!exercisesArray) return;
        const sortedArray = [...exercisesArray].sort((a, b) => (a.order || 0) - (b.order || 0));
        const groups = sortedArray.reduce((acc, item) => {
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

            const arrSubs = [];
            if (item.substitutes) arrSubs.push(...item.substitutes);
            else if (item.substituteId && item.substitute) arrSubs.push({ id: item.substituteId, name: item.substitute.name, videoUrl: item.substitute.videoUrl });

            acc[key].push({
                exerciseId: item.exerciseId,
                title: item.exercise?.name || "Exercício",
                videoUrl: item.exercise?.videoUrl,
                observation: realObs || '',
                category: item.exercise?.category || '',
                subCategory: item.exercise?.subCategory || '', 
                tempId: Math.random().toString(),
                substitutes: arrSubs,
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
                method: 'POST', body: formData, headers: { 'Accept': 'application/json', ...(await authHeaders()) }
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

                        let rawBlocks = aiEx.blocks && aiEx.blocks.length > 0 ? aiEx.blocks : [{ sets: String(aiEx.sets || '3'), reps: String(aiEx.reps || '12'), restTime: String(aiEx.restTime || '60'), technique: aiEx.technique || '' }];
                        let expandedBlocks = [];
                        
                        rawBlocks.forEach(b => {
                            const repStr = String(b.reps || '').trim();
                            const parts = repStr.split(/[-/,]/).map(x => x.trim()).filter(x => x);
                            const setsNum = parseInt(b.sets) || 1;

                            if (parts.length > 1 && (parts.length === setsNum || parts.length > 2)) {
                                parts.forEach((p) => {
                                    expandedBlocks.push({ sets: '1', reps: p, load: b.load || '', restTime: String(b.restTime || '60'), technique: b.technique || '' });
                                });
                            } else {
                                expandedBlocks.push(b);
                            }
                        });

                        return {
                            exerciseId: match ? match.id : `custom_${Math.random()}`, 
                            title: match ? match.name : aiEx.title,
                            videoUrl: match ? match.videoUrl : '',
                            category: aiEx.category || (match ? match.category : ''),
                            observation: aiEx.observation || '',
                            tempId: Math.random().toString(),
                            substitutes: aiEx.substitute ? [{ id: `custom_${Math.random()}`, name: aiEx.substitute, videoUrl: '' }] : [],
                            blocks: expandedBlocks 
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

    const duplicateTabInline = (tabName) => {
        let baseNewName = `${tabName} (Cópia)`;
        let newName = baseNewName;
        let counter = 1;
        while (workoutTabs.includes(newName)) { newName = `${baseNewName} ${counter}`; counter++; }

        const originalExercises = exercisesByDay[tabName] || [];
        const duplicatedExercises = originalExercises.map(ex => ({
            ...ex,
            tempId: Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
        }));

        setWorkoutTabs([...workoutTabs, newName]);
        setExercisesByDay({ ...exercisesByDay, [newName]: duplicatedExercises });
        setSelectedWorkoutTab(newName);
        
        if (Platform.OS === 'web') window.alert(`Dia duplicado com sucesso para "${newName}"!`);
        else Alert.alert("Sucesso", `Dia duplicado para "${newName}"!`);
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
    const onSelectIntensityEndDate = (date) => { setIntensityEndDate(date); setShowCalendarIntensity(false); };

    const applyTemplate = (template) => {
        try {
            const parsed = JSON.parse(template.data);
            const templateTabs = Object.keys(parsed);
            if (templateTabs.length === 0) return;

            const injectLegoBlock = () => {
                const exercisesToInject = parsed[templateTabs[0]] || [];
                const currentExercises = exercisesByDay[selectedWorkoutTab] || [];
                const clonedExercises = exercisesToInject.map(ex => ({ ...ex, tempId: Math.random().toString() }));
                setExercisesByDay({ ...exercisesByDay, [selectedWorkoutTab]: [...currentExercises, ...clonedExercises] });
                setModalTemplatesVisible(false);
            };

            const replaceEntireRoutine = () => {
                setWorkoutTabs(templateTabs);
                setSelectedWorkoutTab(templateTabs[0]);
                setExercisesByDay(parsed);
                if(!customWorkoutName) setCustomWorkoutName(template.name);
                if (template.workoutModel) setWorkoutModel(template.workoutModel);
                setModalTemplatesVisible(false);
            };

            if (Platform.OS === 'web') {
                const isLego = window.confirm(
                    `TREINO: ${template.name}\n\nVocê quer injetar este treino na aba atual (${selectedWorkoutTab}) sem apagar o resto?\n\n[ OK ] = Sim, injetar como Bloco.\n[ CANCELAR ] = Não, quero SUBSTITUIR A ROTINA INTEIRA.`
                );
                if (isLego) injectLegoBlock();
                else if (window.confirm("Isso vai apagar a rotina atual. Tem certeza?")) replaceEntireRoutine();
            } else {
                Alert.alert("Como deseja importar?", `Treino selecionado: ${template.name}`, [
                    { text: "Substituir a Rotina Inteira", style: 'destructive', onPress: replaceEntireRoutine },
                    { text: `Injetar na aba ${selectedWorkoutTab} (Bloco)`, onPress: injectLegoBlock },
                    { text: "Cancelar", style: "cancel" }
                ]);
            }
        } catch (e) { 
            if (Platform.OS === 'web') window.alert("Erro ao importar");
            else Alert.alert("Erro ao importar"); 
        }
    };

    const fetchStudentsForClone = async () => {
        setCloneSearchText('');
        setCloneCoachFilter('OWN');
        try {
            // 🔥 Resolve o adminId direto do AsyncStorage se o state ainda não carregou —
            // evita a corrida em que o primeiro clique (antes do fetchDados terminar) mandava
            // adminId vazio/nulo pro backend e voltava uma lista incompleta/errada.
            let currentAdminId = adminId;
            if (!currentAdminId) {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) currentAdminId = JSON.parse(userJson).id;
            }
            // 🔥 INJETANDO O ADMIN ID NA REQUISIÇÃO (Ativa a Muralha do Admin User Route) 🔥
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user?adminId=${currentAdminId}&t=${Date.now()}`, {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) setCloneStudentsList((await res.json()).filter(u => u.role !== 'ADMIN'));
        } catch(e) {}
    };

    const fetchWorkoutsOfStudent = async (studentId) => {
        setSelectedCloneStudent(studentId);
        try {
            // 🔥 INJETANDO O ADMIN ID NA REQUISIÇÃO (Para passar pela muralha do Workout) 🔥
            const res = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${studentId}&adminId=${adminId}&t=${Date.now()}`, {
                headers: { ...(await authHeaders()) },
            });
            if(res.ok) setCloneWorkoutsList(await res.json());
        } catch(e) {}
    };

    const applyClone = (workout) => {
        processWorkoutDataToState(workout.exercises);
        setCustomWorkoutName(`${workout.name} (Clone)`);
        setWorkoutModel(workout.workoutModel || 'CARGA'); 
        setIntensityMultiplier(workout.intensityMultiplier || 1.0);
        if (workout.intensityEndDate) setIntensityEndDate(new Date(workout.intensityEndDate));
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
                if (exercisesByDay[tab]) {
                    orderedExercisesByDay[tab] = exercisesByDay[tab].map(ex => ({ ...ex, name: ex.title || ex.name || 'Exercício' }));
                }
            });

            const res = await fetch('https://fitos-final.onrender.com/api/admin/templates', {
                method: 'POST', headers: {'Content-Type': 'application/json', ...(await authHeaders())},
                body: JSON.stringify({
                    name: saveTemplateName, goal: templateGoalInput, level: templateLevelInput,
                    collectionId: saveTemplateCollectionId, adminId: adminId, workoutModel: workoutModel,
                    data: JSON.stringify(orderedExercisesByDay) 
                })
            });
            if (!res.ok) throw new Error("Erro");
            setModalSaveTemplateVisible(false);
            Alert.alert("Sucesso", "Modelo salvo na biblioteca!");
            fetchTemplates(); 
        } catch (e) { Alert.alert("Erro", "Falha ao salvar modelo."); }
    };

    // ─── HELPER: filtra substitutos pelo ambiente selecionado ───
    const filterSubsByEnvironment = (subs) => {
        if (!workoutEnvironment || workoutEnvironment === 'UNIVERSAL') return subs;
        return subs.filter(sub => {
            const dbEx = biblioteca.find(b => b.id === sub.id);
            if (!dbEx) return true; // se não achar na biblioteca, deixa passar
            const envs = dbEx.environments || [];
            return envs.length === 0 || envs.includes('UNIVERSAL') || envs.includes(workoutEnvironment);
        });
    };

    // ─── SMART SUBSTITUTE ───
    const triggerSmartSubstitute = (index) => {
        const currentList = exercisesByDay[selectedWorkoutTab] || [];
        const currentExercise = currentList[index];
        const currentSubsCount = currentExercise.substitutes?.length || 0;
        
        if (currentSubsCount >= 3) {
            if (Platform.OS === 'web') window.alert("Este exercício já tem 3 substitutos vinculados (limite máximo).");
            else Alert.alert("Aviso", "Este exercício já tem 3 substitutos vinculados (limite máximo).");
            return;
        }

        const exDbMatch = biblioteca.find(e => e.id === currentExercise.exerciseId);
        
        if (exDbMatch && exDbMatch.defaultSubstitutes && exDbMatch.defaultSubstitutes.length > 0) {
            const alreadyLinkedIds = (currentExercise.substitutes || []).map(s => s.id);
            const rawSubIds = exDbMatch.defaultSubstitutes;
            const subObjects = rawSubIds.map(subId => biblioteca.find(b => b.id === subId)).filter(Boolean);
            const availableSubs = subObjects.filter(sub => !alreadyLinkedIds.includes(sub.id));

            // 🔥 Filtra pelo ambiente do treino
            const filteredByEnv = filterSubsByEnvironment(
                availableSubs.map(s => ({ id: s.id, name: s.name, videoUrl: s.videoUrl }))
            ).map(s => availableSubs.find(a => a.id === s.id)).filter(Boolean);

            if (filteredByEnv.length > 0) {
                setIsSelectingSubstitute(true);
                setTargetIndexForSubstitute(index);
                setSmartSubstitutesList(filteredByEnv);
                setSmartSubstitutesModal(true);
                return;
            }
        }

        setIsSelectingSubstitute(true);
        setTargetIndexForSubstitute(index);
        if (currentExercise.category) safeSetInitialCategoryFilter(currentExercise.category, currentExercise.subCategory);
        setModalBuscaVisible(true);
    };

    const confirmSmartSubstitute = (subObj) => {
        const currentList = [...(exercisesByDay[selectedWorkoutTab] || [])];
        let currentSubs = currentList[targetIndexForSubstitute].substitutes || [];
        
        if (currentList[targetIndexForSubstitute].substitute) {
            currentSubs.push(currentList[targetIndexForSubstitute].substitute);
            currentList[targetIndexForSubstitute].substitute = null; 
        }
        
        if (currentSubs.length < 3) {
            currentSubs.push({ id: subObj.id, name: subObj.name, videoUrl: subObj.videoUrl });
        }
        
        currentList[targetIndexForSubstitute].substitutes = currentSubs;
        setExercisesByDay({ ...exercisesByDay, [selectedWorkoutTab]: currentList });
        setIsSelectingSubstitute(false); 
        setTargetIndexForSubstitute(null);
        setSmartSubstitutesModal(false);
    };

    // ─── AUTO-PREENCHER SUBSTITUTOS ───
    const autoFillSubstitutes = (dayTab = null) => {
        const targetTab = dayTab || selectedWorkoutTab;
        const currentList = [...(exercisesByDay[targetTab] || [])];
        let filled = 0;
        let alreadyFull = 0;
        let filteredOut = 0;

        const updatedList = currentList.map(ex => {
            if ((ex.substitutes || []).length >= 3) { alreadyFull++; return ex; }

            const dbEx = biblioteca.find(b => b.id === ex.exerciseId);
            if (!dbEx || !dbEx.defaultSubstitutes || dbEx.defaultSubstitutes.length === 0) return ex;

            const alreadyLinkedIds = new Set((ex.substitutes || []).map(s => s.id));

            // Busca objetos completos dos substitutos
            let candidatos = dbEx.defaultSubstitutes
                .map(subId => biblioteca.find(b => b.id === subId))
                .filter(Boolean)
                .filter(sub => !alreadyLinkedIds.has(sub.id));

            // 🔥 Filtra pelo ambiente do treino
            if (workoutEnvironment && workoutEnvironment !== 'UNIVERSAL') {
                const antes = candidatos.length;
                candidatos = candidatos.filter(sub => {
                    const envs = sub.environments || [];
                    return envs.length === 0 || envs.includes('UNIVERSAL') || envs.includes(workoutEnvironment);
                });
                filteredOut += antes - candidatos.length;
            }

            const newSubs = candidatos
                .slice(0, 3 - (ex.substitutes || []).length)
                .map(sub => ({ id: sub.id, name: sub.name, videoUrl: sub.videoUrl || '' }));

            if (newSubs.length === 0) return ex;
            filled++;
            return { ...ex, substitutes: [...(ex.substitutes || []), ...newSubs] };
        });

        setExercisesByDay({ ...exercisesByDay, [targetTab]: updatedList });

        const envMsg = filteredOut > 0 ? `\n${filteredOut} substituto(s) removido(s) por não serem compatíveis com o ambiente selecionado.` : '';
        const msg = filled > 0
            ? `✅ ${filled} exercício(s) preenchido(s) com substitutos!${alreadyFull > 0 ? `\n${alreadyFull} já estavam completos.` : ''}${envMsg}`
            : `Nenhum exercício para preencher. Configure os substitutos na biblioteca primeiro.${envMsg}`;

        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Auto-preencher Substitutos', msg);
    };

    // ─── LIMPAR SUBSTITUTOS (um dia ou todos de uma vez) ───
    const clearSubstitutes = (dayTab = null) => {
        const targetTab = dayTab || selectedWorkoutTab;
        const currentList = [...(exercisesByDay[targetTab] || [])];
        let cleared = 0;

        const updatedList = currentList.map(ex => {
            const hasSubs = (ex.substitutes || []).length > 0 || ex.substitute;
            if (!hasSubs) return ex;
            cleared++;
            return { ...ex, substitutes: [], substitute: null };
        });

        setExercisesByDay({ ...exercisesByDay, [targetTab]: updatedList });

        const msg = cleared > 0
            ? `🗑 ${cleared} exercício(s) tiveram substitutos removidos!`
            : 'Nenhum exercício tinha substitutos vinculados.';

        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Limpar Substitutos', msg);
    };

    // ─── LIMPAR SUBSTITUTOS DE TODOS OS DIAS DE UMA VEZ ───
    const clearSubstitutesAllDays = () => {
        const newExercisesByDay = { ...exercisesByDay };
        let totalCleared = 0;

        workoutTabs.forEach(tab => {
            const currentList = [...(newExercisesByDay[tab] || [])];
            newExercisesByDay[tab] = currentList.map(ex => {
                const hasSubs = (ex.substitutes || []).length > 0 || ex.substitute;
                if (!hasSubs) return ex;
                totalCleared++;
                return { ...ex, substitutes: [], substitute: null };
            });
        });

        setExercisesByDay(newExercisesByDay);

        const msg = totalCleared > 0
            ? `🗑 ${totalCleared} exercício(s) tiveram substitutos removidos em todos os dias!`
            : 'Nenhum exercício tinha substitutos vinculados.';

        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Limpar Substitutos', msg);
    };

    // ─── PREENCHER SUBSTITUTOS DE TODOS OS DIAS DE UMA VEZ ───
    const autoFillSubstitutesAllDays = () => {
        const newExercisesByDay = { ...exercisesByDay };
        let totalFilled = 0;
        let totalAlreadyFull = 0;
        let totalFilteredOut = 0;

        workoutTabs.forEach(tab => {
            const currentList = [...(newExercisesByDay[tab] || [])];

            newExercisesByDay[tab] = currentList.map(ex => {
                if ((ex.substitutes || []).length >= 3) { totalAlreadyFull++; return ex; }

                const dbEx = biblioteca.find(b => b.id === ex.exerciseId);
                if (!dbEx || !dbEx.defaultSubstitutes || dbEx.defaultSubstitutes.length === 0) return ex;

                const alreadyLinkedIds = new Set((ex.substitutes || []).map(s => s.id));

                let candidatos = dbEx.defaultSubstitutes
                    .map(subId => biblioteca.find(b => b.id === subId))
                    .filter(Boolean)
                    .filter(sub => !alreadyLinkedIds.has(sub.id));

                if (workoutEnvironment && workoutEnvironment !== 'UNIVERSAL') {
                    const antes = candidatos.length;
                    candidatos = candidatos.filter(sub => {
                        const envs = sub.environments || [];
                        return envs.length === 0 || envs.includes('UNIVERSAL') || envs.includes(workoutEnvironment);
                    });
                    totalFilteredOut += antes - candidatos.length;
                }

                const newSubs = candidatos
                    .slice(0, 3 - (ex.substitutes || []).length)
                    .map(sub => ({ id: sub.id, name: sub.name, videoUrl: sub.videoUrl || '' }));

                if (newSubs.length === 0) return ex;
                totalFilled++;
                return { ...ex, substitutes: [...(ex.substitutes || []), ...newSubs] };
            });
        });

        setExercisesByDay(newExercisesByDay);

        const envMsg = totalFilteredOut > 0 ? `\n${totalFilteredOut} removido(s) por incompatibilidade com o ambiente.` : '';
        const msg = totalFilled > 0
            ? `✅ ${totalFilled} exercício(s) preenchidos em todos os dias!${totalAlreadyFull > 0 ? `\n${totalAlreadyFull} já estavam completos.` : ''}${envMsg}`
            : `Nenhum exercício para preencher.${envMsg}`;

        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Auto-preencher Substitutos', msg);
    };

    const addExercicioManual = (ex) => {
        const currentList = [...(exercisesByDay[selectedWorkoutTab] || [])];
        const isCardio = ex.category?.toUpperCase() === 'CARDIO';
        const initialBlocks = isCardio ? [{ sets: '20', reps: '200', restTime: '0', technique: 'Moderada' }] : [{ sets: '3', reps: '12', restTime: '60', technique: '' }];

        if (isSwapping && swapIndex !== null) {
            currentList[swapIndex] = { ...currentList[swapIndex], exerciseId: ex.id, title: ex.name, videoUrl: ex.videoUrl, category: ex.category, subCategory: ex.subCategory }; 
            setIsSwapping(false); setSwapIndex(null);
            setModalBuscaVisible(false); 
            setSearchText(''); setSelectedCategory('TODOS'); setSelectedSubCat('Todos'); 
        } else if (isSelectingSubstitute && targetIndexForSubstitute !== null) {
            let currentSubs = currentList[targetIndexForSubstitute].substitutes || [];
            if (currentList[targetIndexForSubstitute].substitute) {
                currentSubs.push(currentList[targetIndexForSubstitute].substitute);
                currentList[targetIndexForSubstitute].substitute = null; 
            }
            if (currentSubs.length < 3) {
                currentSubs.push({ id: ex.id, name: ex.name, videoUrl: ex.videoUrl });
            }
            currentList[targetIndexForSubstitute].substitutes = currentSubs;
            setIsSelectingSubstitute(false); setTargetIndexForSubstitute(null);
            setModalBuscaVisible(false); 
            setSearchText(''); setSelectedCategory('TODOS'); setSelectedSubCat('Todos'); 
        } else {
            currentList.push({ exerciseId: ex.id, title: ex.name, videoUrl: ex.videoUrl, observation: '', tempId: Math.random().toString(), substitutes: [], category: ex.category, subCategory: ex.subCategory, blocks: initialBlocks });
        }
        setExercisesByDay({ ...exercisesByDay, [selectedWorkoutTab]: currentList });
        setPreviewModalVisible(false); 
    };

    const removeSubstitute = (exIndex, subIndex) => { 
        const l = [...exercisesByDay[selectedWorkoutTab]]; 
        if (l[exIndex].substitutes && l[exIndex].substitutes.length > 0) {
            l[exIndex].substitutes.splice(subIndex, 1);
        } else {
            l[exIndex].substitute = null;
        }
        setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); 
    };
    
    const removeExercicio = (id) => { 
        setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: exercisesByDay[selectedWorkoutTab].filter(x => x.tempId !== id)}); 
    };
    
    const moveExercise = (i, dir) => { 
        const l = [...(exercisesByDay[selectedWorkoutTab] || [])]; 
        if(dir==='up' && i>0) { [l[i-1], l[i]] = [l[i], l[i-1]]; } 
        else if(dir==='down' && i < l.length-1) { [l[i+1], l[i]] = [l[i], l[i+1]]; }
        setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]: l}); 
    };
    
    const atualizarObservacao = (i, v) => { 
        const l=[...exercisesByDay[selectedWorkoutTab]]; 
        l[i].observation=v; 
        setExercisesByDay({...exercisesByDay, [selectedWorkoutTab]:l}); 
    };
    
    const adicionarBloco = (exIndex, piramideString = null) => { 
        const l = [...exercisesByDay[selectedWorkoutTab]]; 
        const lastBlock = l[exIndex].blocks[l[exIndex].blocks.length - 1] || {}; 

        if (piramideString) {
            const parts = piramideString.split(/[-/,]/).map(x => x.trim()).filter(x => x);
            const newBlocks = parts.map(rep => ({ sets: '1', reps: rep, load: lastBlock.load || '', restTime: '60', technique: '' }));
            if (l[exIndex].blocks.length === 1 && l[exIndex].blocks[0].sets === '3' && l[exIndex].blocks[0].reps === '12') {
                l[exIndex].blocks = newBlocks;
            } else {
                l[exIndex].blocks.push(...newBlocks);
            }
        } else {
            l[exIndex].blocks.push({ sets: '1', reps: lastBlock.reps || '10', load: lastBlock.load || '', restTime: lastBlock.restTime || '60', technique: lastBlock.technique || '' }); 
        }
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

    const salvarTreinoFinal = async () => {
        const alertMsg = (title, msg) => { if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`); else Alert.alert(title, msg); };
        if (!customWorkoutName) return alertMsg("Erro", "Defina um nome para a rotina.");
        setSending(true);

        const orderedExercisesByDay = {};
        workoutTabs.forEach(tab => {
            if (exercisesByDay[tab]) {
                orderedExercisesByDay[tab] = exercisesByDay[tab].map(ex => ({ ...ex, name: ex.title || ex.name || 'Exercício' }));
            }
        });

        if (isTemplateMode) {
            try {
                const templateRealId = parsedTemplate?.id?.startsWith('temp_') ? undefined : parsedTemplate?.id;
                const res = await fetch('https://fitos-final.onrender.com/api/admin/templates', {
                    method: 'POST', headers: {'Content-Type': 'application/json', ...(await authHeaders())},
                    body: JSON.stringify({ 
                        id: templateRealId, name: customWorkoutName, goal: templateGoalInput, level: templateLevelInput, 
                        collectionId: parsedTemplate?.collectionId || null, adminId: adminId, workoutModel: workoutModel, 
                        data: JSON.stringify(orderedExercisesByDay) 
                    }) 
                });
                if (!res.ok) throw new Error("Erro");
                await AsyncStorage.removeItem(draftKey);
                alertMsg("Sucesso", "Template atualizado na biblioteca!"); 
                navigation.goBack();
            } catch(e) { alertMsg("Erro", "Falha ao salvar template."); } 
            finally { setSending(false); }
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

                const subsIds = (ex.substitutes || []).map(s => String(s.id || s.exerciseId));
                if (ex.substitute && !subsIds.includes(String(ex.substitute.id))) {
                    subsIds.push(String(ex.substitute.id));
                }

                flatExercises.push({ 
                    exerciseId: String(ex.exerciseId), day: String(day).trim(), 
                    sets: parseInt(safeBlocks[0].sets) || (isCardio ? 20 : 3), 
                    reps: String(safeBlocks[0].reps), technique: hiddenPayload, 
                    restTime: parseInt(safeBlocks[0].restTime) || 0, order: globalOrder++, 
                    observation: ex.observation || "", 
                    substitutes: subsIds
                });
            });
        });

        if (temFantasma) { 
            setSending(false); 
            return alertMsg("⚠️ EXERCÍCIOS FANTASMAS ENCONTRADOS!", "Existem exercícios na lista destacados em VERMELHO. Sincronize-os antes de salvar."); 
        }

        let finalEndDate = endDate;
        if (isArchived) { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); finalEndDate = yesterday; }
        let finalIntensityEndDate = intensityEndDate;
        if (intensityMultiplier === 1.0) { finalIntensityEndDate = null; } 

        try {
            const isUpdate = isEditing && workoutToEdit?.id;
            const endpoint = isUpdate ? `https://fitos-final.onrender.com/api/workout/${workoutToEdit.id}` : `https://fitos-final.onrender.com/api/workout`; 
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method, headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({
                    userId: aluno?.id, name: customWorkoutName, workoutModel,
                    intensityMultiplier, intensityEndDate: finalIntensityEndDate ? finalIntensityEndDate.toISOString() : null,
                    exercises: flatExercises, startDate: startDate.toISOString(), endDate: finalEndDate.toISOString(), archiveCurrent: false,
                    alternateSlot: alternateSlot || null,
                    // 🔥 ADICIONANDO ADMIN ID AQUI PARA PASSAR PELA MURALHA DO BACKEND 🔥
                    adminId: adminId
                })
            });
            if (!response.ok) throw new Error("Erro");
            await AsyncStorage.removeItem(draftKey);
            alertMsg("Sucesso", isArchived ? "Rotina arquivada com sucesso!" : "Rotina salva com sucesso!"); 
            navigation.goBack(); 
        } catch (e) { alertMsg("Erro", "Falha de conexão."); } 
        finally { setSending(false); }
    };

    const openPreview = (ex) => { setPreviewExercise(ex); setPreviewModalVisible(true); };

    const currentExercises = exercisesByDay[selectedWorkoutTab] || [];
    
    const exerciciosFiltrados = biblioteca.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = selectedCategory === 'TODOS' || e.category === selectedCategory;
        const matchesSubCategory = selectedSubCat === 'Todos' || e.subCategory === selectedSubCat;
        return matchesSearch && matchesCategory && matchesSubCategory;
    });
    
    const safeSetInitialCategoryFilter = (catName, subCatName) => {
        try {
            if (catName) {
                const normalizedCat = String(catName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                const foundCat = categories.find(c => String(c).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === normalizedCat);
                if (foundCat) setSelectedCategory(foundCat);
            }
            if (subCatName && String(subCatName).trim() !== '' && String(subCatName) !== 'Geral') {
                setSelectedSubCat(String(subCatName));
            }
        } catch (err) {}
    };

    const hasInjury = detalhes?.anamnese && (
        (detalhes.anamnese.limitacoes && detalhes.anamnese.limitacoes.length > 0) ||
        (detalhes.anamnese.cirurgias && detalhes.anamnese.cirurgias.length > 0)
    );

    // 🔥 Modal de clonar: filtro por coach (só relevante pros 2 masters, que veem os
    // alunos um do outro) + busca por nome, aplicados por cima da lista já carregada.
    const isMasterAdmin = MASTER_IDS.includes(adminId);
    const otherMasterId = adminId === PAULO_ID ? ADRI_ID : PAULO_ID;
    const otherMasterLabel = adminId === PAULO_ID ? 'Alunos da Adri' : 'Alunos do Paulo';
    const cloneCoachTabs = isMasterAdmin ? [
        { key: 'OWN', label: 'Meus alunos' },
        { key: otherMasterId, label: otherMasterLabel },
        { key: 'ALL', label: 'Todos' },
    ] : [];

    const filteredCloneStudentsList = cloneStudentsList.filter(u => {
        if (isMasterAdmin && cloneCoachFilter !== 'ALL') {
            const targetCoachId = cloneCoachFilter === 'OWN' ? adminId : cloneCoachFilter;
            if (u.coachId !== targetCoachId) return false;
        }
        if (cloneSearchText.trim()) {
            const q = cloneSearchText.trim().toLowerCase();
            const matchesName = u.name?.toLowerCase().includes(q);
            const matchesEmail = u.email?.toLowerCase().includes(q);
            if (!matchesName && !matchesEmail) return false;
        }
        return true;
    });

    return {
        state: {
            detalhes, biblioteca, loading, sending, isImportingAI, lastAutoSaved, workoutTabs, selectedWorkoutTab, 
            exercisesByDay, renameTabModalVisible, newTabName, customWorkoutName, startDate, endDate, 
            isArchived, isReordering, showCalendarStart, showCalendarEnd, templateGoalInput, templateLevelInput, 
            modalTecnicaVisible, modalBuscaVisible, modalTemplatesVisible, modalSaveTemplateVisible, anamneseModal, 
            modalCloneVisible, cloneStudentsList, selectedCloneStudent, cloneWorkoutsList,
            cloneSearchText, cloneCoachFilter, cloneCoachTabs, filteredCloneStudentsList, isMasterAdmin,
            previewModalVisible,
            previewExercise, isSelectingSubstitute, targetIndexForSubstitute, searchText, selectedCategory, 
            selectedSubCat, showCatDropdown, indexExercicioAtual, indexBlocoAtual, isSwapping, swapIndex, 
            templateGoal, templateLevel, templatesList, saveTemplateName, categories, goals, levels, 
            tecnicasDisponiveis, intensidadesCardio, currentExercises, exerciciosFiltrados, hasInjury, 
            isTemplateMode, collections, saveTemplateCollectionId, selectedLibraryCollection, selectedPillar, 
            selectedLevelTab, workoutModel, workoutEnvironment, alternateSlot, intensityMultiplier, intensityEndDate, showCalendarIntensity,
            smartSubstitutesModal, smartSubstitutesList,
        },
        setters: {
            setNewTabName, setRenameTabModalVisible, setSelectedWorkoutTab, setCustomWorkoutName, 
            setShowCalendarStart, setShowCalendarEnd, setIsArchived, setIsReordering, setTemplateGoalInput, 
            setTemplateLevelInput, setModalTecnicaVisible, setModalBuscaVisible, setModalTemplatesVisible, 
            setModalSaveTemplateVisible, setAnamneseModal, setModalCloneVisible, setSelectedCloneStudent,
            setCloneSearchText, setCloneCoachFilter,
            setPreviewModalVisible, setPreviewExercise, setIsSelectingSubstitute, setTargetIndexForSubstitute, 
            setSearchText, setSelectedCategory, setSelectedSubCat, setShowCatDropdown, setIndexExercicioAtual, 
            setIndexBlocoAtual, setIsSwapping, setSwapIndex, setTemplateGoal, setTemplateLevel, setSaveTemplateName, 
            setSaveTemplateCollectionId, setSelectedLibraryCollection, setSelectedPillar, setSelectedLevelTab,
            setWorkoutModel, setWorkoutEnvironment, setAlternateSlot, setIntensityMultiplier, setIntensityEndDate, setShowCalendarIntensity,
            setWorkoutTabs, setExercisesByDay, setSmartSubstitutesModal,
        },
        actions: {
            handleImportPDF, handleDeleteTab, addNewTab, handleRenameTab, handleClearWorkout, 
            onSelectStartDate, onSelectEndDate, onSelectIntensityEndDate, fetchTemplates, applyTemplate, 
            fetchStudentsForClone, fetchWorkoutsOfStudent, applyClone, saveAsTemplate, addExercicioManual, 
            removeSubstitute, removeExercicio, moveExercise, atualizarObservacao, adicionarBloco, removerBloco, 
            atualizarBloco, salvarTreinoFinal, openPreview, moveTab, duplicateTabInline,
            triggerSmartSubstitute, confirmSmartSubstitute, safeSetInitialCategoryFilter,
            autoFillSubstitutes, autoFillSubstitutesAllDays, clearSubstitutes, clearSubstitutesAllDays,
        }
    };
}