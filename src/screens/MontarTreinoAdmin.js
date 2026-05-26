// src/screens/MontarTreinoAdmin.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    TextInput, Modal, KeyboardAvoidingView, Platform, StatusBar,
    ScrollView, Dimensions, Alert
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';

import { useTheme } from '../contexts/ThemeContext';
import { useMontarTreino } from '../hooks/useMontarTreino';
import ExerciseCardAdmin from '../components/MontarTreino/ExerciseCardAdmin';
import CustomCalendar from '../components/CustomCalendar';
import LibraryModals from '../components/MontarTreino/Modals/LibraryModals';
import TemplateAndCloneModals from '../components/MontarTreino/Modals/TemplateAndCloneModals';
import WorkoutSettingsCard from '../components/MontarTreino/WorkoutSettingsCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenstrualAlertCard from '../components/MontarTreino/MenstrualAlertCard'; 

const { width } = Dimensions.get('window');

export default function MontarTreinoAdmin({ route, navigation }) {
    const { theme } = useTheme();
    const previewVideoRef = useRef(null);

    const { width: windowWidth } = Dimensions.get('window');
    const isWebPC = Platform.OS === 'web' && windowWidth > 768;
    const isWeb = Platform.OS === 'web';
    const containerMaxWidth = isWebPC ? 1200 : '100%'; 
    const containerBorders = isWebPC ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {};
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    let aluno = null;
    let templateData = null;
    let isRouteCorrupted = false;
    
    try {
        const alunoParam = route.params?.aluno;
        if (typeof alunoParam === 'string') {
            if (alunoParam.includes('[object Object]')) {
                isRouteCorrupted = true;
            } else {
                aluno = JSON.parse(alunoParam);
            }
        } else if (alunoParam) {
            aluno = alunoParam;
        }

        const templateParam = route.params?.templateData;
        if (typeof templateParam === 'string') {
            if (templateParam.includes('[object Object]')) {
                isRouteCorrupted = true;
            } else {
                templateData = JSON.parse(templateParam);
            }
        } else if (templateParam) {
            templateData = templateParam;
        }
    } catch (e) {
        console.error('Erro ao decodificar params da rota:', e);
    }

    const patchedRoute = { ...route, params: { ...route.params, aluno, templateData } };
    const controller = useMontarTreino(patchedRoute, navigation);
    const { state, setters, actions } = controller;

    const [anamneseData, setAnamneseData] = useState(null);
    const [isRaioxExpanded, setIsRaioxExpanded] = useState(false);
    
    const [alunoIsMenstruating, setAlunoIsMenstruating] = useState(!!aluno?.isMenstruating);
    const [dbDeloadSynced, setDbDeloadSynced] = useState(false);
    const [isCancelingDeload, setIsCancelingDeload] = useState(false);
    const hasForcedDeload = useRef(false);
    
    const [dayDropdownOpen, setDayDropdownOpen] = useState(false);
    const [editingTabName, setEditingTabName] = useState(null);
    const [editingTabValue, setEditingTabValue] = useState('');

    const [isSyncingCargas, setIsSyncingCargas] = useState(false);
    const [forceCollapse, setForceCollapse] = useState(0); 

    useEffect(() => {
        if (Platform.OS === 'web') {
            const style = document.createElement('style');
            style.id = 'hidden-scrollbar';
            style.innerHTML = `
                ::-webkit-scrollbar { width: 0px; background: transparent; }
                * { scrollbar-width: none; }
            `;
            document.head.appendChild(style);
            return () => {
                const el = document.getElementById('hidden-scrollbar');
                if (el) el.remove();
            };
        }
    }, []);
    
    useEffect(() => {
        if (aluno && aluno.id && !state.isTemplateMode && !isRouteCorrupted) {
            const fetchDadosRaioX = async () => {
                try {
                    const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}?t=${Date.now()}`);
                    const freshUser = resUser.ok ? await resUser.json() : aluno;
                    
                    const taMenstruada = !!freshUser?.isMenstruating;
                    setAlunoIsMenstruating(taMenstruada);

                    const activeWorkout = freshUser?.workouts?.[0];
                    const hasDeloadInDb = activeWorkout && activeWorkout.intensityMultiplier < 1;

                    if (hasDeloadInDb || taMenstruada) {
                        setDbDeloadSynced(true); 
                    }

                    let foundAnamnese = null;
                    if (freshUser.goal || freshUser.level) {
                        let rawGoal = freshUser.goal || '';
                        foundAnamnese = {
                            objetivo: rawGoal.split('(Foco:')[0].trim() || 'Não informado',
                            nivel: freshUser.level || 'Não informado',
                            foco: rawGoal.includes('(Foco:') ? rawGoal.split('(Foco:')[1].replace(')', '').trim() : 'Geral',
                            isSetupTreino: true,
                        };
                    }
                    if (!foundAnamnese) {
                        const resAnamnese = await fetch(`https://fitos-final.onrender.com/api/anamnese?userId=${aluno.id}&t=${Date.now()}`);
                        if (resAnamnese.ok) {
                            const data = await resAnamnese.json();
                            const ana = Array.isArray(data) ? data[0] : data;
                            if (ana && ana.id) foundAnamnese = { ...ana, isSetupTreino: false };
                        }
                    }
                    setAnamneseData(foundAnamnese || { objetivo: 'Sem dados no DB', nivel: 'Sem dados', foco: 'Sem dados', isSetupTreino: true });
                } catch (e) {
                    setAnamneseData({ objetivo: 'Erro de conexão', nivel: 'Erro', foco: 'Erro', isSetupTreino: true });
                }
            };
            fetchDadosRaioX();
        }
    }, [aluno?.id, state.isTemplateMode, isRouteCorrupted]);

    useEffect(() => {
        if (!state.loading && dbDeloadSynced && !hasForcedDeload.current) {
            hasForcedDeload.current = true;
            try {
                if (setters.setIntensityMultiplier) setters.setIntensityMultiplier(0.8);
                const deloadEnd = new Date();
                deloadEnd.setDate(deloadEnd.getDate() + 5);
                if (setters.setIntensityEndDate) setters.setIntensityEndDate(deloadEnd);
            } catch (e) {}
        }
    }, [state.loading, dbDeloadSynced]);

    const handleCancelDeload = async () => {
        setIsCancelingDeload(true);
        try {
            if (setters.setIntensityMultiplier) setters.setIntensityMultiplier(1.0);
            if (setters.setIntensityEndDate) setters.setIntensityEndDate(null);

            let res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isMenstruating: false, menstruationStartDate: null })
            });

            if (!res.ok) {
                res = await fetch('https://fitos-final.onrender.com/api/admin/user', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: aluno.id, isMenstruating: false, menstruationStartDate: null })
                });
            }

            setAlunoIsMenstruating(false);
            setDbDeloadSynced(false);
            hasForcedDeload.current = false;
            
        } catch (error) {
            console.log("Erro ao cancelar deload:", error);
            if(Platform.OS === 'web') window.alert("Erro de conexão. Tente novamente.");
            else Alert.alert("Erro", "Falha de conexão. Tente novamente.");
        } finally {
            setIsCancelingDeload(false);
        }
    };

    const forceDeload = () => {
    try {
        if (setters.setIntensityMultiplier) setters.setIntensityMultiplier(0.8);
        const deloadEnd = new Date();
        deloadEnd.setDate(deloadEnd.getDate() + 5);
        if (setters.setIntensityEndDate) setters.setIntensityEndDate(deloadEnd);
    } catch (e) {}
    setDbDeloadSynced(true);
};

    const moveTab = useCallback((tabName, direction) => {
        const tabs = [...state.workoutTabs];
        const idx = tabs.indexOf(tabName);
        if (direction === 'up' && idx > 0) {
            [tabs[idx - 1], tabs[idx]] = [tabs[idx], tabs[idx - 1]];
        } else if (direction === 'down' && idx < tabs.length - 1) {
            [tabs[idx], tabs[idx + 1]] = [tabs[idx + 1], tabs[idx]];
        }
        setters.setWorkoutTabs(tabs);
    }, [state.workoutTabs, setters]);

    const handleDragEnd = useCallback(({ data }) => {
        const updated = { ...state.exercisesByDay, [state.selectedWorkoutTab]: data };
        setters.setExercisesByDay(updated);
    }, [state.exercisesByDay, state.selectedWorkoutTab]);

    const moveExerciseWeb = useCallback((itemTempId, direction) => {
    const currentIndex = state.currentExercises.findIndex(ex => ex.tempId === itemTempId);
    
    if (currentIndex === -1) return; 

    const exercises = [...state.currentExercises];
    
    if (direction === 'up' && currentIndex > 0) {
        const temp = exercises[currentIndex];
        exercises[currentIndex] = exercises[currentIndex - 1];
        exercises[currentIndex - 1] = temp;
    } else if (direction === 'down' && currentIndex < exercises.length - 1) {
        const temp = exercises[currentIndex];
        exercises[currentIndex] = exercises[currentIndex + 1];
        exercises[currentIndex + 1] = temp;
    } else {
        return; 
    }
    
    const updated = { ...state.exercisesByDay, [state.selectedWorkoutTab]: exercises };
    setters.setExercisesByDay(updated);

        if (Platform.OS === 'web') {
            if (window.confirm(direction === 'up' ? "Mover exercício para CIMA?" : "Mover exercício para BAIXO?")) confirmAndMove();
        } else {
            Alert.alert(
                "Trocar Ordem",
                direction === 'up' ? "Deseja mover este exercício para cima na lista?" : "Deseja mover este exercício para baixo na lista?",
                [ { text: "Cancelar", style: "cancel" }, { text: "Sim, mover", onPress: confirmAndMove } ]
            );
        }
    }, [state.currentExercises, state.exercisesByDay, state.selectedWorkoutTab, setters]);

    const confirmRenameTab = useCallback((oldName) => {
        const newName = editingTabValue.trim();
        if (!newName || newName === oldName) {
            setEditingTabName(null);
            return;
        }
        if (state.workoutTabs.includes(newName)) {
            alert("Já existe um dia com esse nome!");
            return;
        }
        const tabs = state.workoutTabs.map(t => t === oldName ? newName : t);
        const newExercises = {};
        Object.keys(state.exercisesByDay).forEach(k => {
            newExercises[k === oldName ? newName : k] = state.exercisesByDay[k];
        });
        setters.setWorkoutTabs(tabs);
        setters.setExercisesByDay(newExercises);
        if (state.selectedWorkoutTab === oldName) setters.setSelectedWorkoutTab(newName);
        setEditingTabName(null);
    }, [editingTabValue, state.workoutTabs, state.exercisesByDay, state.selectedWorkoutTab, setters]);

    const deleteTabInline = useCallback((tabName) => {
        if (state.workoutTabs.length <= 1) return;
        const executaExclusao = () => {
            const tabs = state.workoutTabs.filter(t => t !== tabName);
            const newExercises = { ...state.exercisesByDay };
            delete newExercises[tabName];
            setters.setWorkoutTabs(tabs);
            setters.setExercisesByDay(newExercises);
            if (state.selectedWorkoutTab === tabName) setters.setSelectedWorkoutTab(tabs[0]);
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Tem certeza que deseja excluir o dia "${tabName}"?\nTodos os exercícios dele serão perdidos.`)) executaExclusao();
        } else {
            Alert.alert(
                "Atenção!",
                `Tem certeza que deseja excluir o dia "${tabName}"?\nTodos os exercícios dele serão perdidos.`,
                [ { text: "Cancelar", style: "cancel" }, { text: "Sim, excluir", style: "destructive", onPress: executaExclusao } ]
            );
        }
    }, [state.workoutTabs, state.exercisesByDay, state.selectedWorkoutTab, setters]);

    const safeSetInitialCategoryFilter = (catName, subCatName) => {
        try {
            if (catName && setters.setSelectedCategory) {
                const normalizedCat = String(catName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                const foundCat = state.categories.find(c => String(c).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === normalizedCat);
                if (foundCat) setters.setSelectedCategory(foundCat);
            }
            if (subCatName && String(subCatName).trim() !== '' && String(subCatName) !== 'Geral') {
                if (setters.setSelectedSubCat && typeof setters.setSelectedSubCat === 'function') {
                    setters.setSelectedSubCat(String(subCatName));
                }
            }
        } catch (err) {}
    };

    const handleMagicSync = async () => {
        if (!aluno || !aluno.id) return;
        setIsSyncingCargas(true);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${aluno.id}&t=${Date.now()}`);
            if (!res.ok) throw new Error("Erro na API");
            const historyList = await res.json();
            
            if (!Array.isArray(historyList) || historyList.length === 0) {
                alert("Nenhum histórico finalizado. O aluno precisa clicar em 'FINALIZAR TREINO' no app para enviar as cargas ao sistema.");
                setIsSyncingCargas(false);
                return;
            }

            const historicoDePesos = {};
            [...historyList].reverse().forEach(hist => {
                if (hist.details && Array.isArray(hist.details)) {
                    hist.details.forEach(detail => {
                        if (!historicoDePesos[detail.exerciseId]) historicoDePesos[detail.exerciseId] = {};
                        historicoDePesos[detail.exerciseId][detail.setNumber] = detail.weight;
                    });
                }
            });

            if (Object.keys(historicoDePesos).length === 0) {
                alert("Nenhuma carga foi encontrada no histórico deste aluno.");
                setIsSyncingCargas(false);
                return;
            }

            const newExercisesByDay = { ...state.exercisesByDay };
            const todayExercises = [...state.currentExercises];
            let cargasPuxadas = 0;

            const updatedTodayExercises = todayExercises.map(ex => {
                if (ex.exerciseId && historicoDePesos[ex.exerciseId]) {
                    const pesosDoAluno = historicoDePesos[ex.exerciseId]; 
                    if (ex.blocks && ex.blocks.length > 0) {
                        const newBlocks = ex.blocks.map((block, index) => {
                            const peso = pesosDoAluno[index] !== undefined ? pesosDoAluno[index] : pesosDoAluno[index + 1];
                            if (peso !== undefined) {
                                cargasPuxadas++;
                                return { ...block, load: String(peso) };
                            }
                            return block;
                        });
                        return { ...ex, blocks: newBlocks };
                    }
                }
                return ex;
            });

            newExercisesByDay[state.selectedWorkoutTab] = updatedTodayExercises;
            setters.setExercisesByDay(newExercisesByDay);

            if (cargasPuxadas > 0) {
                if (Platform.OS === 'web') window.alert(`MAGIC SYNC:\n${cargasPuxadas} blocos preenchidos com o histórico do aluno!`);
                else Alert.alert("MAGIC SYNC 🪄", `${cargasPuxadas} blocos preenchidos!`);
            } else {
                alert("O aluno ainda não preencheu cargas para os exercícios específicos DESTA ABA.");
            }
        } catch (e) { alert("Erro ao buscar histórico. Verifique a conexão."); } 
        finally { setIsSyncingCargas(false); }
    };

    const renderExercise = useCallback(({ item, drag, isActive, getIndex }) => {
        const index = getIndex ? getIndex() : state.currentExercises.findIndex(ex => ex.tempId === item.tempId);
        return (
            <View style={{ width: '100%', paddingHorizontal: 16 }}>
                <ExerciseCardAdmin
                    key={item.tempId}
                    item={item} index={index} theme={theme} drag={drag} isActive={isActive} moveExercise={moveExerciseWeb}
                    removeExercicio={actions.removeExercicio} setIsSelectingSubstitute={setters.setIsSelectingSubstitute} 
                    setTargetIndexForSubstitute={setters.setTargetIndexForSubstitute} setModalBuscaVisible={setters.setModalBuscaVisible} 
                    removeSubstitute={actions.removeSubstitute} atualizarBloco={actions.atualizarBloco}
                    adicionarBloco={actions.adicionarBloco} removerBloco={actions.removerBloco} setIndexExercicioAtual={setters.setIndexExercicioAtual}
                    setIndexBlocoAtual={setters.setIndexBlocoAtual} setModalTecnicaVisible={setters.setModalTecnicaVisible} atualizarObservacao={actions.atualizarObservacao}
                    openPreview={actions.openPreview} currentExercisesLength={state.currentExercises.length} setIsSwapping={setters.setIsSwapping}
                    setSwapIndex={setters.setSwapIndex} workoutModel={state.workoutModel}
                    setInitialCategoryFilter={safeSetInitialCategoryFilter} forceCollapse={forceCollapse}
                />
            </View>
        );
    }, [theme, state, setters, actions, moveExerciseWeb, forceCollapse]);

    // ─────────────────────────────────────────────────────────────────────────────
    // COMPONENTES INLINE REUTILIZÁVEIS PARA SIDEBAR (PC) E HEADER (MOBILE)
    // ─────────────────────────────────────────────────────────────────────────────
    
    const renderRaioX = () => {
        if (state.isTemplateMode || !anamneseData) return null;
        return (
            <View style={[styles.raioxCard, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                    style={[styles.raioxHeader, { backgroundColor: isRaioxExpanded ? theme.accent + '12' : 'transparent', borderRadius: isRaioxExpanded ? 10 : 0 }]}
                    onPress={() => setIsRaioxExpanded(!isRaioxExpanded)}
                >
                    <View style={styles.raioxHeaderLeft}>
                        <View style={[styles.raioxIconBox, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="clipboard-pulse-outline" size={16} color={theme.isDark ? '#000' : '#FFF'} /></View>
                        <View>
                            <Text style={[styles.raioxTitle, { color: theme.text }]}>Raio-X do Aluno</Text>
                            {anamneseData.isSetupTreino && <Text style={[styles.raioxSubtitle, { color: theme.textSecondary }]}>Dados básicos</Text>}
                        </View>
                    </View>
                    <View style={[styles.chevronBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}><MaterialCommunityIcons name={isRaioxExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} /></View>
                </TouchableOpacity>
                {isRaioxExpanded && (
                    <View style={styles.raioxBody}>
                        <View style={styles.raioxRow}>
                            <View style={styles.raioxCol}><Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>OBJETIVO</Text><Text style={[styles.raioxValue, { color: theme.text }]}>{anamneseData.objetivo}</Text></View>
                            <View style={styles.raioxCol}><Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>NÍVEL</Text><Text style={[styles.raioxValue, { color: theme.text }]}>{anamneseData.nivel}</Text></View>
                        </View>
                        {anamneseData.isSetupTreino && anamneseData.foco && (
                            <View style={[styles.raioxRow, { marginBottom: 0 }]}><View style={styles.raioxCol}><Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>FOCO PRINCIPAL</Text><Text style={[styles.raioxValue, { color: theme.accent }]}>{anamneseData.foco}</Text></View></View>
                        )}
                        {!anamneseData.isSetupTreino && (
                            <>
                                <View style={styles.raioxRow}>
                                    <View style={styles.raioxCol}><Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>ROTINA</Text><Text style={[styles.raioxValue, { color: theme.text }]}>{anamneseData.frequencia ? `${anamneseData.frequencia}x sem` : '-'} | {anamneseData.tempoDisponivel ? `${anamneseData.tempoDisponivel}min` : '-'}</Text></View>
                                    <View style={styles.raioxCol}><Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>CORPO</Text><Text style={[styles.raioxValue, { color: theme.text }]}>{anamneseData.peso ? `${anamneseData.peso}kg` : '-'} | {anamneseData.altura ? `${anamneseData.altura}cm` : '-'}</Text></View>
                                </View>
                                {anamneseData.limitacoes?.length > 0 && !anamneseData.limitacoes.includes('Nenhuma') && (
                                    <View style={styles.alertBox}><Text style={styles.alertBoxTitle}>⚠️ LIMITAÇÕES / DORES</Text><Text style={[styles.alertBoxText, { color: theme.text }]}>{anamneseData.limitacoes.join(', ')}</Text></View>
                                )}
                                {anamneseData.cirurgias?.length > 0 && !anamneseData.cirurgias.includes('Nenhuma') && (
                                    <View style={[styles.alertBox, { backgroundColor: 'rgba(255,149,0,0.1)', borderColor: '#FF9500', marginTop: 8 }]}><Text style={[styles.alertBoxTitle, { color: '#FF9500' }]}>⚠️ CIRURGIAS</Text><Text style={[styles.alertBoxText, { color: theme.text }]}>{anamneseData.cirurgias.join(', ')}</Text></View>
                                )}
                            </>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderSettings = () => {
        if (!state.isTemplateMode) return <WorkoutSettingsCard state={state} setters={setters} actions={actions} theme={theme} />;
        return (
            <View style={[styles.templateBox, { backgroundColor: theme.surface }]}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>NOME DO MODELO</Text>
                <TextInput style={[styles.templateNameInput, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: theme.accent, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} placeholder="Ex: Hipertrofia Elite A/B/C" placeholderTextColor={theme.textSecondary} value={state.customWorkoutName} onChangeText={setters.setCustomWorkoutName} />
                <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 14 }]}>CATEGORIA E NÍVEL</Text>
                <View style={styles.tagRow}>
                    {['Hipertrofia', 'Emagrecimento', 'Força'].map(g => (
                        <TouchableOpacity key={g} style={[styles.tag, { backgroundColor: state.templateGoalInput === g ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: state.templateGoalInput === g ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} onPress={() => setters.setTemplateGoalInput(g)}><Text style={[styles.tagText, { color: state.templateGoalInput === g ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{g}</Text></TouchableOpacity>
                    ))}
                </View>
                <View style={[styles.tagRow, { marginTop: 8 }]}>
                    {['Iniciante', 'Intermediário', 'Avançado'].map(l => (
                        <TouchableOpacity key={l} style={[styles.tag, { backgroundColor: state.templateLevelInput === l ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: state.templateLevelInput === l ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} onPress={() => setters.setTemplateLevelInput(l)}><Text style={[styles.tagText, { color: state.templateLevelInput === l ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{l}</Text></TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderDaySelectorMobile = () => (
        <View style={styles.daySelectorWrapper}>
            <TouchableOpacity style={[styles.daySelectorBtn, { backgroundColor: theme.surface, borderColor: dayDropdownOpen ? theme.accent + '60' : theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} onPress={() => setDayDropdownOpen(!dayDropdownOpen)} activeOpacity={0.8}>
                <View style={[styles.dayIconBox, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="calendar-today" size={16} color={theme.isDark ? '#000' : '#FFF'} /></View>
                <View style={styles.daySelectorInfo}>
                    <Text style={[styles.daySelectorLabel, { color: theme.textSecondary }]}>DIA ATIVO</Text>
                    <Text style={[styles.daySelectorValue, { color: theme.text }]}>{state.selectedWorkoutTab}<Text style={[styles.daySelectorCount, { color: theme.textSecondary }]}> · {state.currentExercises.length} ex.</Text></Text>
                </View>
                <View style={[styles.chevronBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}><MaterialCommunityIcons name={dayDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} /></View>
            </TouchableOpacity>

            {dayDropdownOpen && (
                <View style={[styles.dayDropdown, { backgroundColor: theme.surface, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                    {state.workoutTabs.map((tab, tabIndex) => {
                        const isSelected = tab === state.selectedWorkoutTab;
                        const isEditing = editingTabName === tab;
                        const exCount = (state.exercisesByDay[tab] || []).length;
                        return (
                            <View key={tab} style={[styles.dayRow, { backgroundColor: isSelected ? theme.accent + '12' : 'transparent', borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderBottomWidth: tabIndex < state.workoutTabs.length - 1 ? 1 : 0 }]}>
                                <View style={[styles.dayActiveBar, { backgroundColor: isSelected ? theme.accent : 'transparent' }]} />
                                <View style={styles.dayContentWrapper}>
                                    {isEditing ? (
                                        <TextInput style={[styles.dayRenameInput, { color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.accent + '60' }]} value={editingTabValue} onChangeText={setEditingTabValue} autoFocus onSubmitEditing={() => confirmRenameTab(tab)} onBlur={() => confirmRenameTab(tab)} />
                                    ) : (
                                        <TouchableOpacity style={styles.dayNameBtn} onPress={() => { setters.setSelectedWorkoutTab(tab); setDayDropdownOpen(false); }}>
                                            <Text style={[styles.dayName, { color: isSelected ? theme.accent : theme.text, fontWeight: isSelected ? '900' : '600' }]}>{tab}</Text>
                                            <Text style={[styles.dayCount, { color: theme.textSecondary }]}>{exCount} ex.</Text>
                                        </TouchableOpacity>
                                    )}
                                    <View style={styles.dayRowActions}>
                                        <View style={{ flexDirection: 'row', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 10, overflow: 'hidden' }}>
                                            <TouchableOpacity style={styles.actionPillIcon} onPress={() => moveTab(tab, 'up')} disabled={tabIndex === 0}><MaterialCommunityIcons name="arrow-up" size={16} color={tabIndex === 0 ? theme.textSecondary + '40' : theme.textSecondary} /></TouchableOpacity>
                                            <View style={{ width: 1, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                            <TouchableOpacity style={styles.actionPillIcon} onPress={() => moveTab(tab, 'down')} disabled={tabIndex === state.workoutTabs.length - 1}><MaterialCommunityIcons name="arrow-down" size={16} color={tabIndex === state.workoutTabs.length - 1 ? theme.textSecondary + '40' : theme.textSecondary} /></TouchableOpacity>
                                        </View>
                                        <TouchableOpacity style={[styles.actionPillBtn, { backgroundColor: isEditing ? theme.accent + '25' : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => { if (isEditing) confirmRenameTab(tab); else { setEditingTabName(tab); setEditingTabValue(tab); } }}>
                                            <MaterialCommunityIcons name={isEditing ? 'check-circle' : 'pencil'} size={14} color={isEditing ? theme.accent : theme.textSecondary} /><Text style={[styles.actionPillText, { color: isEditing ? theme.accent : theme.textSecondary }]}>{isEditing ? 'SALVAR' : 'EDITAR'}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionPillBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => actions.duplicateTabInline(tab)}><MaterialCommunityIcons name="content-copy" size={14} color={theme.textSecondary} /><Text style={[styles.actionPillText, { color: theme.textSecondary }]}>DUPLICAR</Text></TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionPillBtn, { backgroundColor: 'rgba(255,59,48,0.1)', opacity: state.workoutTabs.length <= 1 ? 0.3 : 1 }]} onPress={() => deleteTabInline(tab)} disabled={state.workoutTabs.length <= 1}><MaterialCommunityIcons name="trash-can" size={14} color="#FF3B30" /><Text style={[styles.actionPillText, { color: '#FF3B30' }]}>EXCLUIR</Text></TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ); 
                    })}
                    <TouchableOpacity style={[styles.addDayBtn, { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]} onPress={() => { actions.addNewTab(); setDayDropdownOpen(false); }}>
                        <View style={[styles.addDayIconBox, { backgroundColor: theme.accent + '20' }]}><MaterialCommunityIcons name="plus" size={16} color={theme.accent} /></View>
                        <Text style={[styles.addDayText, { color: theme.accent }]}>Adicionar dia de treino</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const SharedFooter = () => (
        <View style={styles.listFooter}>
            {state.currentExercises.length > 0 && (
                <>
                    <TouchableOpacity style={[styles.addMoreBtn, { borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} onPress={() => { setters.setIsSelectingSubstitute(false); setters.setIsSwapping(false); setters.setModalBuscaVisible(true); }}>
                        <MaterialCommunityIcons name="plus" size={16} color={theme.textSecondary} />
                        <Text style={[styles.addMoreBtnText, { color: theme.textSecondary }]}>Adicionar mais exercícios</Text>
                    </TouchableOpacity>
                    {!state.isTemplateMode && (
                        <TouchableOpacity style={[styles.saveTemplateBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.accent + '40' }]} onPress={() => setters.setModalSaveTemplateVisible(true)}>
                            <MaterialCommunityIcons name="content-save-all" size={17} color={theme.accent} />
                            <Text style={[styles.saveTemplateBtnText, { color: theme.accent }]}>Salvar como template</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
            <View style={{ height: 120 }} />
        </View>
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // LAYOUT PRINCIPAL: SIDEBAR (PC) & MAIN AREA (DRAGGABLE)
    // ─────────────────────────────────────────────────────────────────────────────

    const renderSidebar = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {renderRaioX()}

        {!state.isTemplateMode && (
            <MenstrualAlertCard
                theme={theme}
                state={state}
                setters={setters}
                alunoIsMenstruating={alunoIsMenstruating}
                dbDeloadSynced={dbDeloadSynced}
                intensityMultiplier={state.intensityMultiplier}
                isCancelingDeload={isCancelingDeload}
                handleCancelDeload={handleCancelDeload}
                forceDeload={forceDeload}
            />
        )}

        {renderSettings()}

        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginBottom: 10, marginTop: 10 }]}>DIAS DE TREINO</Text>
        <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            {state.workoutTabs.map((tab) => {
                const isSelected = state.selectedWorkoutTab === tab;
                const exCount = (state.exercisesByDay[tab] || []).length;
                return (
                    <TouchableOpacity key={tab} style={[styles.verticalTab, { backgroundColor: isSelected ? (theme.isDark ? 'rgba(255,255,255,0.08)' : '#FFF') : 'transparent', borderLeftColor: isSelected ? theme.accent : 'transparent' }]} onPress={() => setters.setSelectedWorkoutTab(tab)}>
                        <Text style={{ fontWeight: isSelected ? '900' : '600', color: isSelected ? theme.accent : theme.text, fontSize: 14 }}>{tab}</Text>
                        <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>{exCount} ex.</Text>
                    </TouchableOpacity>
                );
            })}
            <TouchableOpacity style={[styles.addVerticalTab, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} onPress={actions.addNewTab}>
                <MaterialCommunityIcons name="plus" size={16} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700' }}>Adicionar Dia</Text>
            </TouchableOpacity>
        </View>

        {!state.isTemplateMode && state.currentExercises.length > 0 && (
            <TouchableOpacity style={[styles.magicSyncBtn, { backgroundColor: theme.surface, borderColor: theme.accent }]} onPress={handleMagicSync} disabled={isSyncingCargas}>
                {isSyncingCargas ? <ActivityIndicator size="small" color={theme.accent} /> : (
                    <>
                        <MaterialCommunityIcons name="magic-staff" size={20} color={theme.accent} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={[styles.magicSyncTitle, { color: theme.accent }]}>PUXAR CARGAS DO ALUNO</Text>
                            <Text style={styles.magicSyncDesc}>Preenche o peso de todos os exercícios deste dia.</Text>
                        </View>
                    </>
                )}
            </TouchableOpacity>
        )}

        {!state.isTemplateMode && aluno?.id && (
            <TouchableOpacity style={[styles.viewWorkoutBtn, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '10' }]} onPress={() => navigation.navigate('DayWorkoutScreen', { workoutId: route.params?.workoutToEdit?.id, day: state.selectedWorkoutTab, workoutName: state.customWorkoutName, isPreview: true })}>
                <MaterialCommunityIcons name="eye" size={16} color={theme.accent} />
                <Text style={[styles.viewWorkoutText, { color: theme.accent }]}>VER TREINO DO ALUNO</Text>
            </TouchableOpacity>
        )}
    </ScrollView>
);

const renderMainArea = () => (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* 🔥 CABEÇALHO RESTAURADO COM OS BOTÕES DE RENOMEAR, DUPLICAR E EXCLUIR 🔥 */}
        <View style={[styles.mainAreaHeader, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                {editingTabName === state.selectedWorkoutTab ? (
                    <TextInput
                        style={[styles.dayRenameInput, { color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.accent, flex: 1, marginRight: 10 }]}
                        value={editingTabValue}
                        onChangeText={setEditingTabValue}
                        autoFocus
                        onSubmitEditing={() => confirmRenameTab(state.selectedWorkoutTab)}
                        onBlur={() => confirmRenameTab(state.selectedWorkoutTab)}
                    />
                ) : (
                    <Text style={[styles.mainAreaTitle, { color: theme.text }]} numberOfLines={1}>
                        Editando: <Text style={{ color: theme.accent }}>{state.selectedWorkoutTab}</Text>
                    </Text>
                )}
            </View>

            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {!editingTabName && (
                    <TouchableOpacity style={[styles.clearDayBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => { setEditingTabName(state.selectedWorkoutTab); setEditingTabValue(state.selectedWorkoutTab); }}>
                        <MaterialCommunityIcons name="pencil" size={14} color={theme.textSecondary} />
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>Renomear</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.clearDayBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => actions.duplicateTabInline(state.selectedWorkoutTab)}>
                    <MaterialCommunityIcons name="content-copy" size={14} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>Duplicar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.clearDayBtn, { backgroundColor: 'rgba(255,59,48,0.1)' }]} onPress={() => deleteTabInline(state.selectedWorkoutTab)} disabled={state.workoutTabs.length <= 1}>
                    <MaterialCommunityIcons name="trash-can" size={14} color={state.workoutTabs.length <= 1 ? theme.textSecondary : "#FF3B30"} />
                    <Text style={{ color: state.workoutTabs.length <= 1 ? theme.textSecondary : '#FF3B30', fontSize: 11, fontWeight: 'bold' }}>Excluir</Text>
                </TouchableOpacity>

                {/* Separador */}
                <View style={{ width: 1, height: 20, backgroundColor: theme.border, marginHorizontal: 4 }} />

                <TouchableOpacity style={[styles.clearDayBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => setForceCollapse(prev => prev + 1)}>
                    <MaterialCommunityIcons name="format-list-bulleted" size={14} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>Minimizar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.clearDayBtn, { backgroundColor: 'rgba(255,59,48,0.1)' }]} onPress={actions.handleClearWorkout}>
                    <MaterialCommunityIcons name="delete-sweep" size={14} color="#FF3B30" />
                    <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: 'bold' }}>Limpar</Text>
                </TouchableOpacity>
            </View>
        </View>

        <DraggableFlatList
            data={state.currentExercises}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.tempId}
            renderItem={renderExercise}
            contentContainerStyle={{ paddingVertical: 20, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={!isWebPC ? (
                <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
                    {renderRaioX()}
                    {!state.isTemplateMode && (
                        <MenstrualAlertCard
                            theme={theme}
                            state={state}
                            setters={setters}
                            alunoIsMenstruating={alunoIsMenstruating}
                            dbDeloadSynced={dbDeloadSynced}
                            intensityMultiplier={state.intensityMultiplier}
                            isCancelingDeload={isCancelingDeload}
                            handleCancelDeload={handleCancelDeload}
                            forceDeload={forceDeload}
                        />
                    )}
                    {renderSettings()}
                    {renderDaySelectorMobile()}
                    {!state.isTemplateMode && state.currentExercises.length > 0 && (
                        <TouchableOpacity style={[styles.magicSyncBtn, { backgroundColor: theme.surface, borderColor: theme.accent }]} onPress={handleMagicSync} disabled={isSyncingCargas}>
                            {isSyncingCargas ? <ActivityIndicator size="small" color={theme.accent} /> : (
                                <>
                                    <MaterialCommunityIcons name="magic-staff" size={20} color={theme.accent} />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={[styles.magicSyncTitle, { color: theme.accent }]}>PUXAR CARGAS DO ALUNO</Text>
                                        <Text style={styles.magicSyncDesc}>Preenche o peso de todos os exercícios deste dia.</Text>
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    {state.currentExercises.length === 0 && (
                        <View style={[styles.emptyState, { borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                            <View style={[styles.emptyIconBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                                <MaterialCommunityIcons name="dumbbell" size={36} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Dia sem exercícios</Text>
                            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Adicione exercícios usando o menu flutuante.</Text>
                        </View>
                    )}
                </View>
            ) : (
                state.currentExercises.length === 0 ? (
                    <View style={[styles.emptyState, { borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', marginHorizontal: 24 }]}>
                        <View style={[styles.emptyIconBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                            <MaterialCommunityIcons name="dumbbell" size={36} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Dia sem exercícios</Text>
                        <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Use o menu flutuante abaixo para adicionar.</Text>
                    </View>
                ) : null
            )}
            ListFooterComponent={SharedFooter()}
        />

            {/* 🔥 MENU FLUTUANTE (VISÍVEL NO PC E NO MOBILE) 🔥 */}
            <View style={[styles.floatingMenuContainer, { backgroundColor: theme.surface }]}>
                <TouchableOpacity style={styles.floatingMenuItem} onPress={() => { setters.setIsSelectingSubstitute(false); setters.setIsSwapping(false); setters.setModalBuscaVisible(true); }}>
                    <MaterialCommunityIcons name="plus-box-multiple" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>Exercício</Text>
                </TouchableOpacity>
                <View style={[styles.floatingMenuDivider, { backgroundColor: theme.border }]} />
                <TouchableOpacity style={styles.floatingMenuItem} onPress={actions?.handleImportPDF}>
                    <MaterialCommunityIcons name="file-pdf-box" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>MFIT</Text>
                </TouchableOpacity>
                <View style={[styles.floatingMenuDivider, { backgroundColor: theme.border }]} />
                <TouchableOpacity style={styles.floatingMenuItem} onPress={() => { actions?.fetchTemplates(); setters?.setModalTemplatesVisible(true); }}>
                    <MaterialCommunityIcons name="folder-download" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>Bases</Text>
                </TouchableOpacity>
                <View style={[styles.floatingMenuDivider, { backgroundColor: theme.border }]} />
                <TouchableOpacity style={styles.floatingMenuItem} onPress={() => { actions?.fetchStudentsForClone(); setters?.setModalCloneVisible(true); }}>
                    <MaterialCommunityIcons name="account-switch" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>Clonar</Text>
                </TouchableOpacity>
                <View style={[styles.floatingMenuDivider, { backgroundColor: theme.border }]} />
                <TouchableOpacity style={styles.floatingMenuItem} onPress={() => setters?.setModalSaveTemplateVisible(true)}>
                    <MaterialCommunityIcons name="content-save-cog" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>Salvar Base</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const Modais = () => {
        const currentExOpened = state.currentExercises[state.indexExercicioAtual];
        const isCurrentCardio = currentExOpened?.category?.toUpperCase() === 'CARDIO';
        const modalOptionsToShow = isCurrentCardio ? state.intensidadesCardio : state.tecnicasDisponiveis;
        const modalTitleToShow = isCurrentCardio ? 'Intensidade' : 'Técnica';
        return (
            <>
                <LibraryModals theme={theme} isWeb={isWeb} webOuterBg={webOuterBg} modalBuscaVisible={state.modalBuscaVisible} setModalBuscaVisible={setters.setModalBuscaVisible} searchText={state.searchText} setSearchText={setters.setSearchText} selectedCategory={state.selectedCategory} setSelectedCategory={setters.setSelectedCategory} selectedSubCat={state.selectedSubCat} setSelectedSubCat={setters.setSelectedSubCat} showCatDropdown={state.showCatDropdown} setShowCatDropdown={setters.setShowCatDropdown} categories={state.categories} exerciciosFiltrados={state.exerciciosFiltrados} addExercicioManual={actions.addExercicioManual} isSwapping={state.isSwapping} openPreview={actions.openPreview} previewModalVisible={state.previewModalVisible} setPreviewModalVisible={setters.setPreviewModalVisible} previewExercise={state.previewExercise} setPreviewExercise={setters.setPreviewExercise} previewVideoRef={previewVideoRef} currentExercises={state.currentExercises} />
                <TemplateAndCloneModals theme={theme} isWeb={isWeb} webOuterBg={webOuterBg} modalCloneVisible={state.modalCloneVisible} setModalCloneVisible={setters.setModalCloneVisible} cloneStudentsList={state.cloneStudentsList} selectedCloneStudent={state.selectedCloneStudent} setSelectedCloneStudent={setters.setSelectedCloneStudent} cloneWorkoutsList={state.cloneWorkoutsList} applyClone={actions.applyClone} fetchWorkoutsOfStudent={actions.fetchWorkoutsOfStudent} modalTemplatesVisible={state.modalTemplatesVisible} setModalTemplatesVisible={setters.setModalTemplatesVisible} templatesList={state.templatesList} goals={state.goals} levels={state.levels} templateGoal={state.templateGoal} setTemplateGoal={setters.setTemplateGoal} templateLevel={state.templateLevel} setTemplateLevel={setters.setTemplateLevel} fetchTemplates={actions.fetchTemplates} applyTemplate={actions.applyTemplate} modalSaveTemplateVisible={state.modalSaveTemplateVisible} setModalSaveTemplateVisible={setters.setModalSaveTemplateVisible} saveTemplateName={state.saveTemplateName} setSaveTemplateName={setters.setSaveTemplateName} templateGoalInput={state.templateGoalInput} setTemplateGoalInput={setters.setTemplateGoalInput} templateLevelInput={state.templateLevelInput} setTemplateLevelInput={setters.setTemplateLevelInput} saveAsTemplate={actions.saveAsTemplate} collections={state.collections} saveTemplateCollectionId={state.saveTemplateCollectionId} setSaveTemplateCollectionId={setters.setSaveTemplateCollectionId} selectedLibraryCollection={state.selectedLibraryCollection} setSelectedLibraryCollection={setters.setSelectedLibraryCollection} selectedPillar={state.selectedPillar} setSelectedPillar={setters.setSelectedPillar} selectedLevelTab={state.selectedLevelTab} setSelectedLevelTab={setters.setSelectedLevelTab} />
                <Modal visible={state.showCalendarStart} transparent animationType="fade"><View style={styles.modalOverlay}><CustomCalendar selectedDate={state.startDate} onSelect={actions.onSelectStartDate} onClose={() => setters.setShowCalendarStart(false)} theme={theme} /></View></Modal>
                <Modal visible={state.showCalendarEnd} transparent animationType="fade"><View style={styles.modalOverlay}><CustomCalendar selectedDate={state.endDate} onSelect={actions.onSelectEndDate} onClose={() => setters.setShowCalendarEnd(false)} theme={theme} /></View></Modal>
                <Modal visible={state.showCalendarIntensity} transparent animationType="fade"><View style={styles.modalOverlay}><CustomCalendar selectedDate={state.intensityEndDate || new Date()} onSelect={actions.onSelectIntensityEndDate} onClose={() => setters.setShowCalendarIntensity(false)} theme={theme} /></View></Modal>
                <Modal visible={state.modalTecnicaVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{modalTitleToShow}</Text>
                            {modalOptionsToShow.map((t) => (
                                <TouchableOpacity key={t.id} style={[styles.techOption, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} onPress={() => { actions.atualizarBloco(state.indexExercicioAtual, state.indexBlocoAtual, 'technique', t.id); setters.setModalTecnicaVisible(false); }}>
                                    <Text style={[styles.techOptionText, { color: theme.text }, state.exercisesByDay[state.selectedWorkoutTab]?.[state.indexExercicioAtual]?.blocks?.[state.indexBlocoAtual]?.technique === t.id && { color: theme.accent, fontWeight: '900' }]}>{t.title}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={[styles.modalCancelBtn, { marginTop: 10 }]} onPress={() => setters.setModalTecnicaVisible(false)}><Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancelar</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </>
        );
    };

    const rootStyle = isWeb ? { height: '100dvh', width: '100%', backgroundColor: webOuterBg, overflowX: 'hidden' } : { flex: 1, backgroundColor: theme.bg };

    if (isRouteCorrupted) {
        return (
            <View style={[styles.center, rootStyle]}>
                <View style={[styles.errorBox, { backgroundColor: theme.surface }]}>
                    <MaterialCommunityIcons name="alert-decagram" size={48} color="#FF3B30" style={{ marginBottom: 16 }} />
                    <Text style={[styles.errorTitle, { color: theme.text }]}>Erro de rota</Text>
                    <Text style={[styles.errorDesc, { color: theme.textSecondary }]}>Os dados do treino foram corrompidos pelo navegador para <Text style={{ fontWeight: '800', color: '#FF3B30' }}>[object Object]</Text>. Volte e tente novamente.</Text>
                    <TouchableOpacity style={[styles.errorBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.goBack()}><Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }}>Voltar</Text></TouchableOpacity>
                </View>
            </View>
        );
    }

    if (state.loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.accent} /></View>;

    if (isWebPC) {
        return (
            <View style={rootStyle}>
                <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
                <View style={{ width: '100%', alignItems: 'center', backgroundColor: theme.bg, borderBottomWidth: 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', zIndex: 10 }}>
                    <View style={[styles.headerInner, { paddingTop: 20, width: '100%', maxWidth: containerMaxWidth }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface }]}><MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} /></TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{route.params?.isEditing ? 'Editar Rotina' : 'Nova Rotina'}</Text>
                        <TouchableOpacity onPress={actions.salvarTreinoFinal} disabled={state.sending} style={[styles.saveBtn, { backgroundColor: state.sending ? theme.border : theme.accent }]}>
                            {state.sending ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" /> : <Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', width: '100%', maxWidth: containerMaxWidth, alignSelf: 'center', ...containerBorders }}>
                    <View style={[styles.sidebar, { backgroundColor: theme.surface, borderRightColor: theme.border }]}>
                        {renderSidebar()}
                    </View>
                    <View style={{ flex: 1 }}>
                        {renderMainArea()}
                    </View>
                </View>
                {Modais()}
            </View>
        );
    }

    return (
        <SafeAreaViewContext style={rootStyle}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
            <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg }}>
                <View style={[styles.headerInner, { paddingTop: 10, borderBottomWidth: 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface }]}><MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} /></TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{route.params?.isEditing ? 'Editar Rotina' : 'Nova Rotina'}</Text>
                    <TouchableOpacity onPress={actions.salvarTreinoFinal} disabled={state.sending} style={[styles.saveBtn, { backgroundColor: state.sending ? theme.border : theme.accent }]}>
                        {state.sending ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" /> : <Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR</Text>}
                    </TouchableOpacity>
                </View>
                <KeyboardAvoidingView behavior="padding" style={{ flex: 1, width: '100%' }} enabled>
                    {renderMainArea()}
                </KeyboardAvoidingView>
            </View>
            {Modais()}
        </SafeAreaViewContext>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorBox: { margin: 30, padding: 30, borderRadius: 20, alignItems: 'center' },
    errorTitle: { fontSize: 20, fontWeight: '900', marginBottom: 10 },
    errorDesc: { textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    errorBtn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },

    headerInner: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, minWidth: 80, alignItems: 'center' },
    saveBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

    sidebar: { width: 340, minWidth: 340, borderRightWidth: 1, height: '100%' },
    scrollContent: { width: '100%', paddingHorizontal: 16, paddingTop: 16 },
    listFooter: { width: '100%', paddingHorizontal: 16 },

    raioxCard: { borderRadius: 18, marginBottom: 16, overflow: 'hidden', padding: 14 },
    raioxHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 4 },
    raioxHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    raioxIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    raioxTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    raioxSubtitle: { fontSize: 11 },
    chevronBox: { borderRadius: 8, padding: 4 },
    raioxBody: { marginTop: 16 },
    raioxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    raioxCol: { flex: 1 },
    raioxLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 3 },
    raioxValue: { fontSize: 14, fontWeight: '700' },
    alertBox: { marginTop: 10, padding: 12, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 10, borderWidth: 1, borderColor: '#FF3B3050' },
    alertBoxTitle: { color: '#FF3B30', fontSize: 10, fontWeight: '900', marginBottom: 4 },
    alertBoxText: { fontSize: 13, fontWeight: '700' },

    templateBox: { borderRadius: 18, padding: 16, marginBottom: 16 },
    sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 },
    templateNameInput: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 16, fontWeight: '700', outlineStyle: 'none' },
    tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    tagText: { fontSize: 12, fontWeight: '700' },

    verticalTab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderLeftWidth: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
    addVerticalTab: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
    viewWorkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 8, marginTop: 10 },
    viewWorkoutText: { fontWeight: 'bold', fontSize: 12 },

    mainAreaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, zIndex: 5 },
    mainAreaTitle: { fontSize: 18, fontWeight: '900' },
    clearDayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 8 },

    daySelectorWrapper: { marginBottom: 20 },
    daySelectorBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
    dayIconBox: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    daySelectorInfo: { flex: 1 },
    daySelectorLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
    daySelectorValue: { fontSize: 15, fontWeight: '800' },
    daySelectorCount: { fontSize: 13, fontWeight: '500' },
    dayDropdown: { marginTop: 8, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    dayRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 16, gap: 12 },
    dayActiveBar: { width: 3, height: 22, borderRadius: 2, marginTop: 2 },
    dayContentWrapper: { flex: 1, gap: 12 },
    dayNameBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dayName: { fontSize: 16 },
    dayCount: { fontSize: 11, fontWeight: '600' },
    dayRenameInput: { padding: 10, borderRadius: 8, borderWidth: 1, fontSize: 16, fontWeight: '700', outlineStyle: 'none' },
    dayRowActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    actionPillBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
    actionPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    actionPillIcon: { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
    addDayBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, gap: 12 },
    addDayIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    addDayText: { fontSize: 13, fontWeight: '700' },

    emptyState: { alignItems: 'center', marginTop: 24, marginBottom: 24, padding: 36, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20 },
    emptyIconBox: { borderRadius: 50, padding: 20, marginBottom: 16 },
    emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
    emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

    addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, marginBottom: 12, gap: 6 },
    addMoreBtnText: { fontWeight: '700', fontSize: 13 },
    saveTemplateBtn: { padding: 15, borderRadius: 14, borderWidth: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
    saveTemplateBtnText: { fontWeight: '700', fontSize: 13 },

    magicSyncBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 10, marginBottom: 10 },
    magicSyncTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    magicSyncDesc: { fontSize: 10, color: '#888', marginTop: 2 },

    floatingMenuContainer: { 
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: Platform.OS === 'web' ? 30 : 20, 
    alignSelf: 'center', 
    flexDirection: 'row', 
    borderRadius: 30, 
    paddingHorizontal: Platform.OS === 'web' ? 15 : 8, 
    paddingVertical: 10, 
    width: Platform.OS === 'web' ? 'auto' : '95%', 
    justifyContent: 'space-evenly', 
    zIndex: 9999,
    alignItems: 'center', 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12,
    backgroundColor: '#1C1C1E',
},
    floatingMenuItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Platform.OS === 'web' ? 12 : 4, paddingVertical: 4 },
    floatingMenuText: { fontSize: 10, fontWeight: '800', marginTop: 4 },
    floatingMenuDivider: { width: 1, height: 24, marginHorizontal: 5 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    modalBox: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignSelf: 'center' },
    modalTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
    modalCancelBtn: { padding: 12, alignItems: 'center' },
    modalCancelText: { fontWeight: '600' },
    techOption: { paddingVertical: 14, borderBottomWidth: 1 },
    techOptionText: { fontWeight: '600', textAlign: 'center', fontSize: 14 },
});