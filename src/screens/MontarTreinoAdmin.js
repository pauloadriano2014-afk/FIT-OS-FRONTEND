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

import MontarTreinoHeader from '../components/MontarTreino/MontarTreinoHeader';
import RaioXCard from '../components/MontarTreino/RaioXCard';
import MenstrualAlertCard from '../components/MontarTreino/MenstrualAlertCard';
import DaySelector from '../components/MontarTreino/DaySelector';
import MagicSyncButton from '../components/MontarTreino/MagicSyncButton';
import MontarTreinoFooter from '../components/MontarTreino/MontarTreinoFooter';

export default function MontarTreinoAdmin({ route, navigation }) {
    const { theme } = useTheme();
    const previewVideoRef = useRef(null);

    const { width: windowWidth } = Dimensions.get('window');
    const isWebPC = Platform.OS === 'web' && windowWidth > 850;
    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    const RootComponent = isWeb ? View : SafeAreaViewContext;
    const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg };

    const containerMaxWidth = isWebPC ? 960 : '100%'; 
    const containerBorders = isWebPC ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {};

    let aluno = null;
    let templateData = null;
    let isRouteCorrupted = false;

    try {
        const alunoParam = route.params?.aluno;
        if (typeof alunoParam === 'string') {
            if (alunoParam.includes('[object Object]')) isRouteCorrupted = true;
            else aluno = JSON.parse(alunoParam);
        } else if (alunoParam) aluno = alunoParam;

        const templateParam = route.params?.templateData;
        if (typeof templateParam === 'string') {
            if (templateParam.includes('[object Object]')) isRouteCorrupted = true;
            else templateData = JSON.parse(templateParam);
        } else if (templateParam) templateData = templateParam;
    } catch (e) { console.error('Erro ao decodificar params:', e); }

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

    // 🔥 ESTADO PARA FORÇAR A MINIMIZAÇÃO DOS CARDS 🔥
    const [forceCollapse, setForceCollapse] = useState(0);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const style = document.createElement('style');
            style.id = 'hidden-scrollbar';
            style.innerHTML = `::-webkit-scrollbar { width: 0px; background: transparent; } * { scrollbar-width: none; }`;
            document.head.appendChild(style);
            return () => document.getElementById('hidden-scrollbar')?.remove();
        }
    }, []);

    useEffect(() => {
        if (aluno && aluno.id && !state.isTemplateMode && !isRouteCorrupted) {
            const fetchDadosRaioX = async () => {
                try {
                    const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}?t=${Date.now()}`);
                    const freshUser = resUser.ok ? await resUser.json() : aluno;
                    setAlunoIsMenstruating(!!freshUser?.isMenstruating);
                    if (freshUser?.workouts?.[0]?.intensityMultiplier < 1 || !!freshUser?.isMenstruating) setDbDeloadSynced(true); 

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
                            if (data && data.id) foundAnamnese = { ...data, isSetupTreino: false };
                        }
                    }
                    setAnamneseData(foundAnamnese || { objetivo: 'Sem dados', nivel: 'Sem dados', foco: 'Sem dados', isSetupTreino: true });
                } catch (e) { setAnamneseData({ objetivo: 'Erro', nivel: 'Erro', foco: 'Erro', isSetupTreino: true }); }
            };
            fetchDadosRaioX();
        }
    }, [aluno?.id, state.isTemplateMode, isRouteCorrupted]);

    useEffect(() => {
        if (!state.loading && dbDeloadSynced && !hasForcedDeload.current) {
            hasForcedDeload.current = true;
            try {
                if (setters.setIntensityMultiplier) setters.setIntensityMultiplier(0.8);
                const deloadEnd = new Date(); deloadEnd.setDate(deloadEnd.getDate() + 5);
                if (setters.setIntensityEndDate) setters.setIntensityEndDate(deloadEnd);
            } catch (e) {}
        }
    }, [state.loading, dbDeloadSynced]);

    const handleCancelDeload = async () => {
        setIsCancelingDeload(true);
        try {
            if (setters.setIntensityMultiplier) setters.setIntensityMultiplier(1.0);
            if (setters.setIntensityEndDate) setters.setIntensityEndDate(null);
            await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isMenstruating: false, menstruationStartDate: null })
            });
            setAlunoIsMenstruating(false); setDbDeloadSynced(false); hasForcedDeload.current = false;
        } catch (error) { alert("Erro ao cancelar deload."); } 
        finally { setIsCancelingDeload(false); }
    };

    const forceDeload = () => {
        try {
            if (setters.setIntensityMultiplier) setters.setIntensityMultiplier(0.8);
            const deloadEnd = new Date(); deloadEnd.setDate(deloadEnd.getDate() + 5);
            if (setters.setIntensityEndDate) setters.setIntensityEndDate(deloadEnd);
        } catch (e) {}
        setDbDeloadSynced(true);
    };

    const moveTab = useCallback((tabName, direction) => {
        const tabs = [...state.workoutTabs];
        const idx = tabs.indexOf(tabName);
        if (direction === 'up' && idx > 0) [tabs[idx - 1], tabs[idx]] = [tabs[idx], tabs[idx - 1]];
        else if (direction === 'down' && idx < tabs.length - 1) [tabs[idx], tabs[idx + 1]] = [tabs[idx + 1], tabs[idx]];
        setters.setWorkoutTabs(tabs);
    }, [state.workoutTabs, setters]);

    const handleDragEnd = useCallback(({ data }) => {
        setters.setExercisesByDay({ ...state.exercisesByDay, [state.selectedWorkoutTab]: data });
    }, [state.exercisesByDay, state.selectedWorkoutTab]);

    const moveExerciseWeb = useCallback((index, direction) => {
    const exercises = [...state.currentExercises];
    const newIndex = index + direction; // direction é -1 ou 1
    if (newIndex < 0 || newIndex >= exercises.length) return;
    [exercises[index], exercises[newIndex]] = [exercises[newIndex], exercises[index]];
    setters.setExercisesByDay({ 
        ...state.exercisesByDay, 
        [state.selectedWorkoutTab]: exercises 
    });
}, [state.currentExercises, state.exercisesByDay, state.selectedWorkoutTab, setters]);

    const confirmRenameTab = () => {
        if (!editingTabValue.trim()) return;
        const newTabs = [...state.workoutTabs];
        const idx = newTabs.indexOf(editingTabName);
        if (idx !== -1) {
            newTabs[idx] = editingTabValue.trim();
            const newExercises = { ...state.exercisesByDay };
            newExercises[editingTabValue.trim()] = newExercises[editingTabName];
            delete newExercises[editingTabName];
            setters.setWorkoutTabs(newTabs);
            setters.setExercisesByDay(newExercises);
            if (state.selectedWorkoutTab === editingTabName) setters.setSelectedWorkoutTab(editingTabValue.trim());
        }
        setEditingTabName(null);
    };

    const deleteTabInline = (tabName) => {
        Alert.alert("Excluir Dia", `Tem certeza que deseja excluir o dia "${tabName}" e todos os seus exercícios?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: () => {
                const newTabs = state.workoutTabs.filter(t => t !== tabName);
                const newExercises = { ...state.exercisesByDay };
                delete newExercises[tabName];
                setters.setWorkoutTabs(newTabs);
                setters.setExercisesByDay(newExercises);
                if (state.selectedWorkoutTab === tabName) setters.setSelectedWorkoutTab(newTabs[0] || '');
            }}
        ]);
    };

    const handleMagicSync = async () => {
        if (!aluno?.id) return alert("Erro: Aluno não identificado.");
        setIsSyncingCargas(true);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}/history`);
            if (!res.ok) throw new Error("Falha ao buscar histórico");
            const history = await res.json();
            if (!history || history.length === 0) {
                alert("Nenhum histórico de cargas encontrado para este aluno.");
                setIsSyncingCargas(false);
                return;
            }

            const historyMap = {};
            history.forEach(h => {
                if (h.exerciseId && h.load) {
                    if (!historyMap[h.exerciseId] || new Date(h.date) > new Date(historyMap[h.exerciseId].date)) {
                        historyMap[h.exerciseId] = { load: h.load, date: h.date };
                    }
                }
            });

            const newExercisesByDay = { ...state.exercisesByDay };
            let updatedCount = 0;

            Object.keys(newExercisesByDay).forEach(day => {
                newExercisesByDay[day] = newExercisesByDay[day].map(ex => {
                    const exId = ex.exerciseId || ex.exercise?.id;
                    if (exId && historyMap[exId]) {
                        const updatedBlocks = ex.blocks.map(b => ({ ...b, load: historyMap[exId].load }));
                        updatedCount++;
                        return { ...ex, blocks: updatedBlocks };
                    }
                    return ex;
                });
            });

            if (updatedCount > 0) {
                setters.setExercisesByDay(newExercisesByDay);
                alert(`Sucesso! ${updatedCount} exercícios foram atualizados com as últimas cargas do aluno.`);
            } else {
                alert("Nenhuma carga correspondente encontrada para os exercícios atuais.");
            }
        } catch (error) {
            alert("Erro ao sincronizar cargas.");
        } finally {
            setIsSyncingCargas(false);
        }
    };

    
    const renderExercise = ({ item, drag, isActive, getIndex }) => {
        const index = getIndex();
        return (
            <ExerciseCardAdmin
                key={`ex-${index}-${item.exerciseId || item.id}`}
                item={item} index={index} drag={drag} isActive={isActive} theme={theme}
                atualizarBloco={actions.atualizarBloco} removerBloco={actions.removerBloco} adicionarBloco={actions.adicionarBloco}
                removeExercicio={actions.removeExercicio} removeSubstitute={actions.removeSubstitute} atualizarObservacao={actions.atualizarObservacao}
                setIndexExercicioAtual={setters.setIndexExercicioAtual} setIndexBlocoAtual={setters.setIndexBlocoAtual} setModalTecnicaVisible={setters.setModalTecnicaVisible}
                setIsSelectingSubstitute={setters.setIsSelectingSubstitute} setTargetIndexForSubstitute={setters.setTargetIndexForSubstitute} setModalBuscaVisible={setters.setModalBuscaVisible}
                setIsSwapping={setters.setIsSwapping} setSwapIndex={setters.setSwapIndex} openPreview={actions.openPreview}
                workoutModel={state.workoutModel} moveExerciseWeb={moveExerciseWeb}
                forceCollapse={forceCollapse} // 🔥 PASSANDO A PROP PARA MINIMIZAR 🔥
            />
        );
    };

    const renderSidebar = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

            {/* RAIO-X E ALERTA MENSTRUAL */}
            {!state.isTemplateMode && (
                <View style={{ marginBottom: 10 }}>
                    <RaioXCard theme={theme} anamneseData={anamneseData} isRaioxExpanded={isRaioxExpanded} setIsRaioxExpanded={setIsRaioxExpanded} />

                    {/* 🔥 NOVO MODAL DE PERIODIZAÇÃO E DELOAD 🔥 */}
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
                </View>
            )}

            {/* CONFIGURAÇÕES */}
            {!state.isTemplateMode && (
                <WorkoutSettingsCard state={state} setters={setters} actions={actions} theme={theme} />
            )}

            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginBottom: 10, marginTop: 10 }]}>DIAS DE TREINO</Text>
            <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                {state.workoutTabs.map((tab, index) => {
                    const isSelected = state.selectedWorkoutTab === tab;
                    const exCount = state.exercisesByDay[tab]?.length || 0;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.verticalTab, {
                                backgroundColor: isSelected ? (theme.isDark ? 'rgba(255,255,255,0.08)' : '#FFF') : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                                borderLeftColor: isSelected ? theme.accent : 'transparent',
                            }]}
                            onPress={() => setters.setSelectedWorkoutTab(tab)}
                        >
                            <Text style={{ fontWeight: isSelected ? '800' : '600', color: isSelected ? theme.accent : theme.text, fontSize: 14 }}>
                                {tab}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>{exCount} ex.</Text>
                        </TouchableOpacity>
                    );
                })}
                <TouchableOpacity style={[styles.addVerticalTab, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} onPress={actions.addNewTab}>
                    <MaterialCommunityIcons name="plus" size={16} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700' }}>Adicionar Dia</Text>
                </TouchableOpacity>
            </View>

            {!state.isTemplateMode && (
                <MagicSyncButton theme={theme} isTemplateMode={state.isTemplateMode} currentExercisesLength={state.currentExercises.length} handleMagicSync={handleMagicSync} isSyncingCargas={isSyncingCargas} />
            )}

            {!state.isTemplateMode && aluno?.id && (
                <TouchableOpacity style={[styles.viewWorkoutBtn, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '10' }]} onPress={() => navigation.navigate('WorkoutViewAdmin', { aluno })}>
                    <MaterialCommunityIcons name="eye" size={16} color={theme.accent} />
                    <Text style={[styles.viewWorkoutText, { color: theme.accent }]}>VER TREINO DO ALUNO</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );

    const renderMainArea = () => (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={[styles.mainAreaHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.mainAreaTitle, { color: theme.text }]}>Editando: <Text style={{ color: theme.accent }}>{state.selectedWorkoutTab}</Text></Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {/* 🔥 NOVO BOTÃO DE REORDENAR 🔥 */}
                    <TouchableOpacity 
                        style={[styles.clearDayBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
                        onPress={() => setForceCollapse(prev => prev + 1)}
                    >
                        <MaterialCommunityIcons name="format-list-bulleted" size={18} color={theme.textSecondary} />
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>Reordenar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.clearDayBtn} onPress={actions.handleClearWorkout}>
                        <MaterialCommunityIcons name="delete-sweep" size={18} color="#FF3B30" />
                        <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: 'bold' }}>Limpar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                {!isWebPC && (
                    <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
                        <RaioXCard theme={theme} anamneseData={anamneseData} isRaioxExpanded={isRaioxExpanded} setIsRaioxExpanded={setIsRaioxExpanded} />

                        {/* 🔥 NOVO MODAL DE PERIODIZAÇÃO E DELOAD NO MOBILE 🔥 */}
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

                        {!state.isTemplateMode && <WorkoutSettingsCard state={state} setters={setters} actions={actions} theme={theme} />}
                        <DaySelector theme={theme} state={state} setters={setters} actions={actions} dayDropdownOpen={dayDropdownOpen} setDayDropdownOpen={setDayDropdownOpen} editingTabName={editingTabName} setEditingTabName={setEditingTabName} editingTabValue={editingTabValue} setEditingTabValue={setEditingTabValue} confirmRenameTab={confirmRenameTab} deleteTabInline={deleteTabInline} moveTab={moveTab} />
                        <MagicSyncButton theme={theme} isTemplateMode={state.isTemplateMode} currentExercisesLength={state.currentExercises.length} handleMagicSync={handleMagicSync} isSyncingCargas={isSyncingCargas} />
                    </View>
                )}

                {state.currentExercises.length === 0 ? (
                    <View style={[styles.emptyState, { borderColor: theme.border, marginHorizontal: isWebPC ? 24 : 16 }]}>
                        <MaterialCommunityIcons name="dumbbell" size={36} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 10 }} />
                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: 'bold' }}>Dia sem exercícios</Text>
                        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 5 }}>Use o menu flutuante para adicionar.</Text>
                    </View>
                ) : (
                    state.currentExercises.map((item, index) => renderExercise({ item, drag: null, isActive: false, getIndex: () => index }))
                )}

                <MontarTreinoFooter theme={theme} currentExercisesLength={state.currentExercises.length} isTemplateMode={state.isTemplateMode} setters={setters} />
            </ScrollView>

            {/* 🔥 MENU FLUTUANTE AJUSTADO PARA MOBILE 🔥 */}
            <View style={[styles.floatingMenuContainer, { backgroundColor: theme.surface }]}>

                {/* 1. Exercício */}
                <TouchableOpacity style={styles.floatingMenuItem} onPress={() => { setters.setIsSelectingSubstitute(false); setters.setIsSwapping(false); setters.setModalBuscaVisible(true); }}>
                    <MaterialCommunityIcons name="plus-box-multiple" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>Exercício</Text>
                </TouchableOpacity>

                <View style={[styles.floatingMenuDivider, { backgroundColor: theme.border }]} />

                {/* 2. MFIT (Importar PDF) */}
                <TouchableOpacity style={styles.floatingMenuItem} onPress={actions?.handleImportPDF}>
                    <MaterialCommunityIcons name="file-pdf-box" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>MFIT</Text>
                </TouchableOpacity>

                <View style={[styles.floatingMenuDivider, { backgroundColor: theme.border }]} />

                {/* 3. Importar Template (Bases) */}
                <TouchableOpacity style={styles.floatingMenuItem} onPress={() => { actions?.fetchTemplates(); setters?.setModalTemplatesVisible(true); }}>
                    <MaterialCommunityIcons name="folder-download" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>Bases</Text>
                </TouchableOpacity>

                <View style={[styles.floatingMenuDivider, { backgroundColor: theme.border }]} />

                {/* 4. Clonar */}
                <TouchableOpacity style={styles.floatingMenuItem} onPress={() => { actions?.fetchStudentsForClone(); setters?.setModalCloneVisible(true); }}>
                    <MaterialCommunityIcons name="account-switch" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>Clonar</Text>
                </TouchableOpacity>

                <View style={[styles.floatingMenuDivider, { backgroundColor: theme.border }]} />

                {/* 5. Salvar Template */}
                <TouchableOpacity style={styles.floatingMenuItem} onPress={() => setters?.setModalSaveTemplateVisible(true)}>
                    <MaterialCommunityIcons name="content-save-cog" size={22} color={theme.text} />
                    <Text style={[styles.floatingMenuText, { color: theme.text }]}>Salvar Base</Text>
                </TouchableOpacity>

            </View>
        </View>
    );

    return (
        <RootComponent style={rootStyle}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

            <View style={{ flex: 1, alignItems: 'center', width: '100%' }}>
                <View style={[{ flex: 1, width: '100%', maxWidth: containerMaxWidth, backgroundColor: theme.bg }, containerBorders]}>

                    <MontarTreinoHeader navigation={navigation} theme={theme} isEditing={route.params?.isEditing} salvarTreinoFinal={actions.salvarTreinoFinal} sending={state.sending} containerMaxWidth="100%" />

                    {isWebPC ? (
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <View style={[styles.sidebar, { backgroundColor: theme.surface, borderRightColor: theme.border }]}>
                                {renderSidebar()}
                            </View>
                            <View style={{ flex: 1 }}>
                                {renderMainArea()}
                            </View>
                        </View>
                    ) : (
                        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, width: '100%' }} enabled>
                            {renderMainArea()}
                        </KeyboardAvoidingView>
                    )}

                </View>
            </View>

            {/* Modais */}
            <LibraryModals theme={theme} isWeb={isWeb} webOuterBg={webOuterBg} modalBuscaVisible={state.modalBuscaVisible} setModalBuscaVisible={setters.setModalBuscaVisible} searchText={state.searchText} setSearchText={setters.setSearchText} selectedCategory={state.selectedCategory} setSelectedCategory={setters.setSelectedCategory} selectedSubCat={state.selectedSubCat} setSelectedSubCat={setters.setSelectedSubCat} showCatDropdown={state.showCatDropdown} setShowCatDropdown={setters.setShowCatDropdown} categories={state.categories} exerciciosFiltrados={state.exerciciosFiltrados} addExercicioManual={actions.addExercicioManual} isSwapping={state.isSwapping} openPreview={actions.openPreview} previewModalVisible={state.previewModalVisible} setPreviewModalVisible={setters.setPreviewModalVisible} previewExercise={state.previewExercise} setPreviewExercise={setters.setPreviewExercise} previewVideoRef={previewVideoRef} currentExercises={state.currentExercises} />
            <TemplateAndCloneModals theme={theme} isWeb={isWeb} webOuterBg={webOuterBg} modalCloneVisible={state.modalCloneVisible} setModalCloneVisible={setters.setModalCloneVisible} cloneStudentsList={state.cloneStudentsList} selectedCloneStudent={state.selectedCloneStudent} setSelectedCloneStudent={setters.setSelectedCloneStudent} cloneWorkoutsList={state.cloneWorkoutsList} applyClone={actions.applyClone} fetchWorkoutsOfStudent={actions.fetchWorkoutsOfStudent} modalTemplatesVisible={state.modalTemplatesVisible} setModalTemplatesVisible={setters.setModalTemplatesVisible} templatesList={state.templatesList} goals={state.goals} levels={state.levels} templateGoal={state.templateGoal} setTemplateGoal={setters.setTemplateGoal} templateLevel={state.templateLevel} setTemplateLevel={setters.setTemplateLevel} fetchTemplates={actions.fetchTemplates} applyTemplate={actions.applyTemplate} modalSaveTemplateVisible={state.modalSaveTemplateVisible} setModalSaveTemplateVisible={setters.setModalSaveTemplateVisible} saveTemplateName={state.saveTemplateName} setSaveTemplateName={setters.setSaveTemplateName} templateGoalInput={state.templateGoalInput} setTemplateGoalInput={setters.setTemplateGoalInput} templateLevelInput={state.templateLevelInput} setTemplateLevelInput={setters.setTemplateLevelInput} saveAsTemplate={actions.saveAsTemplate} collections={state.collections} saveTemplateCollectionId={state.saveTemplateCollectionId} setSaveTemplateCollectionId={setters.setSaveTemplateCollectionId} selectedLibraryCollection={state.selectedLibraryCollection} setSelectedLibraryCollection={setters.setSelectedLibraryCollection} selectedPillar={state.selectedPillar} setSelectedPillar={setters.setSelectedPillar} selectedLevelTab={state.selectedLevelTab} setSelectedLevelTab={setters.setSelectedLevelTab} />
            <Modal visible={state.showCalendarStart} transparent animationType="fade"><View style={styles.modalOverlay}><CustomCalendar selectedDate={state.startDate} onSelect={actions.onSelectStartDate} onClose={() => setters.setShowCalendarStart(false)} theme={theme} /></View></Modal>
            <Modal visible={state.showCalendarEnd} transparent animationType="fade"><View style={styles.modalOverlay}><CustomCalendar selectedDate={state.endDate} onSelect={actions.onSelectEndDate} onClose={() => setters.setShowCalendarEnd(false)} theme={theme} /></View></Modal>
            <Modal visible={state.showCalendarIntensity} transparent animationType="fade"><View style={styles.modalOverlay}><CustomCalendar selectedDate={state.intensityEndDate || new Date()} onSelect={actions.onSelectIntensityEndDate} onClose={() => setters.setShowCalendarIntensity(false)} theme={theme} /></View></Modal>
            <Modal visible={state.modalTecnicaVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Técnica</Text>
                        {state.tecnicasDisponiveis.map((t) => (
                            <TouchableOpacity key={t.id} style={[styles.techOption, { borderBottomColor: theme.border }]} onPress={() => { actions.atualizarBloco(state.indexExercicioAtual, state.indexBlocoAtual, 'technique', t.id); setters.setModalTecnicaVisible(false); }}>
                                <Text style={[styles.techOptionText, { color: theme.text }]}>{t.title}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={{ marginTop: 15, alignItems: 'center' }} onPress={() => setters.setModalTecnicaVisible(false)}><Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Cancelar</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },

    sidebar: { 
        width: 340, 
        minWidth: 340,
        borderRightWidth: 1,
        height: '100%',
    },

    sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    verticalTab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderLeftWidth: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
    addVerticalTab: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
    viewWorkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 8, marginTop: 10 },
    viewWorkoutText: { fontWeight: 'bold', fontSize: 12 },

    mainAreaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, zIndex: 5 },
    mainAreaTitle: { fontSize: 18, fontWeight: '900' },
    clearDayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 8 },
    emptyState: { alignItems: 'center', padding: 40, borderWidth: 2, borderStyle: 'dashed', borderRadius: 20, marginTop: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    modalBox: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignSelf: 'center' },
    modalTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
    techOption: { paddingVertical: 14, borderBottomWidth: 1 },
    techOptionText: { fontWeight: '600', textAlign: 'center', fontSize: 14 },

    // 🔥 ESTILOS DO NOVO MENU FLUTUANTE 🔥
    floatingMenuContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'web' ? 30 : 20,
        alignSelf: 'center',
        flexDirection: 'row',
        borderRadius: 30,
        paddingHorizontal: Platform.OS === 'web' ? 15 : 8,
        paddingVertical: 10,
        width: Platform.OS === 'web' ? 'auto' : '95%',
        justifyContent: 'space-evenly',
        ...Platform.select({
            web: { boxShadow: '0 8px 30px rgba(0,0,0,0.15)' },
            default: { elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }
        }),
        zIndex: 100,
        alignItems: 'center',
    },
    floatingMenuItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Platform.OS === 'web' ? 12 : 4,
        paddingVertical: 4,
    },
    floatingMenuText: {
        fontSize: 10,
        fontWeight: '800',
        marginTop: 4,
    },
    floatingMenuDivider: {
        width: 1,
        height: 24,
        marginHorizontal: 5,
    },
});