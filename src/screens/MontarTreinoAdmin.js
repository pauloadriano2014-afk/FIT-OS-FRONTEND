// src/screens/MontarTreinoAdmin.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, StatusBar, Dimensions, Alert
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../contexts/ThemeContext';
import { useMontarTreino } from '../hooks/useMontarTreino';
import ExerciseCardAdmin from '../components/MontarTreino/ExerciseCardAdmin';
import CustomCalendar from '../components/CustomCalendar';
import LibraryModals from '../components/MontarTreino/Modals/LibraryModals';
import TemplateAndCloneModals from '../components/MontarTreino/Modals/TemplateAndCloneModals';
import WorkoutSettingsCard from '../components/MontarTreino/WorkoutSettingsCard';
import MenstrualAlertCard from '../components/MontarTreino/MenstrualAlertCard';
import { Modal } from 'react-native';
import { generateWorkoutPDF } from '../utils/pdfGenerator';

import RaioXCard from '../components/MontarTreino/RaioXCard';
import DaySelectorMobile from '../components/MontarTreino/DaySelectorMobile';
import FloatingMenu from '../components/MontarTreino/FloatingMenu';
import SharedFooter from '../components/MontarTreino/SharedFooter';
import MainAreaHeader from '../components/MontarTreino/MainAreaHeader';
import SidebarPC from '../components/MontarTreino/SidebarPC';
import TemplateSettingsCard from '../components/MontarTreino/TemplateSettingsCard';
import TecnicaModal from '../components/MontarTreino/Modals/TecnicaModal';
import SmartAddModal from '../components/MontarTreino/Modals/SmartAddModal';
import AutoFillModal from '../components/MontarTreino/Modals/AutoFillModal';

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

    // ─── PARSE PARAMS ───
    let aluno = null;
    let templateData = null;
    let isRouteCorrupted = false;
    try {
        const alunoParam = route.params?.aluno;
        if (typeof alunoParam === 'string') {
            if (alunoParam.includes('[object Object]')) isRouteCorrupted = true;
            else aluno = JSON.parse(alunoParam);
        } else if (alunoParam) { aluno = alunoParam; }
        const templateParam = route.params?.templateData;
        if (typeof templateParam === 'string') {
            if (templateParam.includes('[object Object]')) isRouteCorrupted = true;
            else templateData = JSON.parse(templateParam);
        } else if (templateParam) { templateData = templateParam; }
    } catch (e) { console.error('Erro ao decodificar params da rota:', e); }

    const patchedRoute = { ...route, params: { ...route.params, aluno, templateData } };
    const { state, setters, actions } = useMontarTreino(patchedRoute, navigation);

    // ─── ESTADOS LOCAIS ───
    const [tecnicasLaboratorio, setTecnicasLaboratorio] = useState([]);
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
    const [autoFillModalVisible, setAutoFillModalVisible] = useState(false);

    // 🔥 CARREGAR TÉCNICAS DO LABORATÓRIO 🔥
    const fetchTecnicas = useCallback(async () => {
        try {
            // Puxa o seu ID (Coach) direto da sessão logada no app, em vez de depender do objeto "aluno"
            const savedUser = await AsyncStorage.getItem('user');
            if (!savedUser) return;
            const admin = JSON.parse(savedUser);
            
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/techniques?coachId=${admin.id}`);
            if (res.ok) setTecnicasLaboratorio(await res.json());
        } catch (e) { console.error("Erro ao buscar técnicas:", e); }
    }, []);

    useEffect(() => { fetchTecnicas(); }, [fetchTecnicas]);

    const floatingMenuProps = {
        theme, windowWidth,
        onAddExercise: () => { setters.setIsSelectingSubstitute(false); setters.setIsSwapping(false); setters.setModalBuscaVisible(true); },
        onImportPDF: actions?.handleImportPDF,
        onOpenBases: () => { actions?.fetchTemplates(); setters?.setModalTemplatesVisible(true); },
        onClone: () => { actions?.fetchStudentsForClone(); setters?.setModalCloneVisible(true); },
        onSaveBase: () => setters?.setModalSaveTemplateVisible(true),
        onDownloadPDF: () => generateWorkoutPDF(aluno, state.workoutTabs, state.exercisesByDay, state.customWorkoutName),
    };

    const smartAddInterceptor = useRef({ isWaiting: false, index: null });
    const handleSetIsSelectingSubstitute = useCallback((val) => {
        if (val) smartAddInterceptor.current.isWaiting = true;
        setters.setIsSelectingSubstitute(val);
    }, [setters]);
    const handleSetTargetIndexForSubstitute = useCallback((idx) => {
        if (smartAddInterceptor.current.isWaiting && idx !== null) smartAddInterceptor.current.index = idx;
        setters.setTargetIndexForSubstitute(idx);
    }, [setters]);
    const handleSetModalBuscaVisible = useCallback((val) => {
        if (val && smartAddInterceptor.current.isWaiting && smartAddInterceptor.current.index !== null) {
            actions.triggerSmartSubstitute(smartAddInterceptor.current.index);
            smartAddInterceptor.current = { isWaiting: false, index: null };
            return;
        }
        smartAddInterceptor.current = { isWaiting: false, index: null };
        setters.setModalBuscaVisible(val);
    }, [actions, setters]);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const style = document.createElement('style');
            style.id = 'hidden-scrollbar';
            style.innerHTML = `::-webkit-scrollbar { width: 0px; background: transparent; } * { scrollbar-width: none; }`;
            document.head.appendChild(style);
            return () => { const el = document.getElementById('hidden-scrollbar'); if (el) el.remove(); };
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
                    const hasDeloadInDb = freshUser?.workouts?.[0]?.intensityMultiplier < 1;
                    if (hasDeloadInDb || taMenstruada) setDbDeloadSynced(true);
                    let foundAnamnese = null;
                    if (freshUser.goal || freshUser.level) {
                        const rawGoal = freshUser.goal || '';
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
                } catch (e) { setAnamneseData({ objetivo: 'Erro de conexão', nivel: 'Erro', foco: 'Erro', isSetupTreino: true }); }
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
            let res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isMenstruating: false, menstruationStartDate: null }) });
            if (!res.ok) res = await fetch('https://fitos-final.onrender.com/api/admin/user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: aluno.id, isMenstruating: false, menstruationStartDate: null }) });
            setAlunoIsMenstruating(false); setDbDeloadSynced(false); hasForcedDeload.current = false;
        } catch (error) {
            console.log("Erro ao cancelar deload:", error);
            if (Platform.OS === 'web') window.alert("Erro de conexão. Tente novamente.");
            else Alert.alert("Erro", "Falha de conexão. Tente novamente.");
        } finally { setIsCancelingDeload(false); }
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

    const moveExerciseWeb = useCallback((itemTempId, direction) => {
        const currentIndex = state.currentExercises.findIndex(ex => ex.tempId === itemTempId);
        if (currentIndex === -1) return;
        const exercises = [...state.currentExercises];
        if (direction === 'up' && currentIndex > 0) { const t = exercises[currentIndex]; exercises[currentIndex] = exercises[currentIndex - 1]; exercises[currentIndex - 1] = t; }
        else if (direction === 'down' && currentIndex < exercises.length - 1) { const t = exercises[currentIndex]; exercises[currentIndex] = exercises[currentIndex + 1]; exercises[currentIndex + 1] = t; }
        else return;
        setters.setExercisesByDay({ ...state.exercisesByDay, [state.selectedWorkoutTab]: exercises });
    }, [state.currentExercises, state.exercisesByDay, state.selectedWorkoutTab, setters]);

    const confirmRenameTab = useCallback((oldName) => {
        const newName = editingTabValue.trim();
        if (!newName || newName === oldName) { setEditingTabName(null); return; }
        if (state.workoutTabs.includes(newName)) { alert("Já existe um dia com esse nome!"); return; }
        const tabs = state.workoutTabs.map(t => t === oldName ? newName : t);
        const newExercises = {};
        Object.keys(state.exercisesByDay).forEach(k => { newExercises[k === oldName ? newName : k] = state.exercisesByDay[k]; });
        setters.setWorkoutTabs(tabs); setters.setExercisesByDay(newExercises);
        if (state.selectedWorkoutTab === oldName) setters.setSelectedWorkoutTab(newName);
        setEditingTabName(null);
    }, [editingTabValue, state.workoutTabs, state.exercisesByDay, state.selectedWorkoutTab, setters]);

    const deleteTabInline = useCallback((tabName) => {
        if (state.workoutTabs.length <= 1) return;
        const exec = () => {
            const tabs = state.workoutTabs.filter(t => t !== tabName);
            const newEx = { ...state.exercisesByDay }; delete newEx[tabName];
            setters.setWorkoutTabs(tabs); setters.setExercisesByDay(newEx);
            if (state.selectedWorkoutTab === tabName) setters.setSelectedWorkoutTab(tabs[0]);
        };
        if (Platform.OS === 'web') { if (window.confirm(`Excluir o dia "${tabName}"?\nTodos os exercícios serão perdidos.`)) exec(); }
        else Alert.alert("Atenção!", `Excluir o dia "${tabName}"?`, [{ text: "Cancelar", style: "cancel" }, { text: "Sim, excluir", style: "destructive", onPress: exec }]);
    }, [state.workoutTabs, state.exercisesByDay, state.selectedWorkoutTab, setters]);

    const safeSetInitialCategoryFilter = useCallback((catName, subCatName) => {
        try {
            if (catName && setters.setSelectedCategory) {
                const norm = String(catName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                const found = state.categories.find(c => String(c).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === norm);
                if (found) setters.setSelectedCategory(found);
            }
            if (subCatName && String(subCatName).trim() !== '' && String(subCatName) !== 'Geral') {
                if (setters.setSelectedSubCat) setters.setSelectedSubCat(String(subCatName));
            }
        } catch (err) {}
    }, [state.categories, setters]);

    const handleMagicSync = async () => {
        if (!aluno || !aluno.id) return;
        setIsSyncingCargas(true);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${aluno.id}&t=${Date.now()}`);
            if (!res.ok) throw new Error("Erro na API");
            const historyList = await res.json();
            if (!Array.isArray(historyList) || historyList.length === 0) { alert("Nenhum histórico finalizado."); setIsSyncingCargas(false); return; }
            const historicoDePesos = {};
            [...historyList].reverse().forEach(hist => {
                hist.details?.forEach(d => { if (!historicoDePesos[d.exerciseId]) historicoDePesos[d.exerciseId] = {}; historicoDePesos[d.exerciseId][d.setNumber] = d.weight; });
            });
            if (Object.keys(historicoDePesos).length === 0) { alert("Nenhuma carga encontrada."); setIsSyncingCargas(false); return; }
            let cargasPuxadas = 0;
            const updatedEx = [...state.currentExercises].map(ex => {
                if (ex.exerciseId && historicoDePesos[ex.exerciseId] && ex.blocks?.length > 0) {
                    const pesos = historicoDePesos[ex.exerciseId];
                    return { ...ex, blocks: ex.blocks.map((b, i) => { const p = pesos[i] !== undefined ? pesos[i] : pesos[i + 1]; if (p !== undefined) { cargasPuxadas++; return { ...b, load: String(p) }; } return b; }) };
                }
                return ex;
            });
            setters.setExercisesByDay({ ...state.exercisesByDay, [state.selectedWorkoutTab]: updatedEx });
            if (cargasPuxadas > 0) { if (Platform.OS === 'web') window.alert(`MAGIC SYNC:\n${cargasPuxadas} blocos preenchidos!`); else Alert.alert("MAGIC SYNC 🪄", `${cargasPuxadas} blocos preenchidos!`); }
            else alert("O aluno ainda não preencheu cargas para os exercícios desta aba.");
        } catch (e) { alert("Erro ao buscar histórico. Verifique a conexão."); }
        finally { setIsSyncingCargas(false); }
    };

    const renderExercise = useCallback(({ item, drag, isActive, getIndex }) => {
        const index = getIndex ? getIndex() : state.currentExercises.findIndex(ex => ex.tempId === item.tempId);
        return (
            <View style={{ width: '100%', paddingHorizontal: 16 }}>
                <ExerciseCardAdmin
                    key={item.tempId} item={item} index={index} theme={theme} drag={drag} isActive={isActive}
                    moveExercise={moveExerciseWeb} removeExercicio={actions.removeExercicio}
                    setIsSelectingSubstitute={handleSetIsSelectingSubstitute}
                    setTargetIndexForSubstitute={handleSetTargetIndexForSubstitute}
                    setModalBuscaVisible={handleSetModalBuscaVisible}
                    removeSubstitute={actions.removeSubstitute} atualizarBloco={actions.atualizarBloco}
                    adicionarBloco={actions.adicionarBloco} removerBloco={actions.removerBloco}
                    setIndexExercicioAtual={setters.setIndexExercicioAtual} setIndexBlocoAtual={setters.setIndexBlocoAtual}
                    setModalTecnicaVisible={setters.setModalTecnicaVisible} atualizarObservacao={actions.atualizarObservacao}
                    openPreview={actions.openPreview} currentExercisesLength={state.currentExercises.length}
                    setIsSwapping={setters.setIsSwapping} setSwapIndex={setters.setSwapIndex}
                    workoutModel={state.workoutModel} setInitialCategoryFilter={safeSetInitialCategoryFilter}
                    forceCollapse={forceCollapse}
                    // 🔥 PROP INJETADA PARA O SELECT DE TÉCNICAS
                    listaTecnicas={tecnicasLaboratorio} 
                />
            </View>
        );
    }, [theme, state, setters, actions, moveExerciseWeb, forceCollapse, handleSetIsSelectingSubstitute, handleSetTargetIndexForSubstitute, handleSetModalBuscaVisible, safeSetInitialCategoryFilter, tecnicasLaboratorio]);

    const renderSettings = () => {
        if (!state.isTemplateMode) return <WorkoutSettingsCard state={state} setters={setters} actions={actions} theme={theme} />;
        return (
            <TemplateSettingsCard
                theme={theme}
                customWorkoutName={state.customWorkoutName}
                setCustomWorkoutName={setters.setCustomWorkoutName}
                templateGoalInput={state.templateGoalInput}
                setTemplateGoalInput={setters.setTemplateGoalInput}
                templateLevelInput={state.templateLevelInput}
                setTemplateLevelInput={setters.setTemplateLevelInput}
            />
        );
    };

    const renderEmptyState = (marginHorizontal = 0) => (
        <View style={[S.emptyState, { borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', marginHorizontal }]}>
            <View style={[S.emptyIconBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                <MaterialCommunityIcons name="dumbbell" size={36} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            </View>
            <Text style={[S.emptyTitle, { color: theme.text }]}>Dia sem exercícios</Text>
            <Text style={[S.emptyDesc, { color: theme.textSecondary }]}>{marginHorizontal > 0 ? 'Use o menu flutuante abaixo para adicionar.' : 'Adicione exercícios usando o menu flutuante.'}</Text>
        </View>
    );

    const renderMainArea = () => (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <MainAreaHeader
                theme={theme}
                selectedWorkoutTab={state.selectedWorkoutTab}
                onCollapse={() => setForceCollapse(prev => prev + 1)}
                onClear={actions.handleClearWorkout}
            />
            <DraggableFlatList
                data={state.currentExercises}
                extraData={forceCollapse}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item.tempId}
                renderItem={renderExercise}
                contentContainerStyle={{ paddingVertical: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={!isWebPC ? (
                    <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
                        {!state.isTemplateMode && <RaioXCard anamneseData={anamneseData} isRaioxExpanded={isRaioxExpanded} setIsRaioxExpanded={setIsRaioxExpanded} theme={theme} />}
                        {!state.isTemplateMode && <MenstrualAlertCard theme={theme} state={state} setters={setters} alunoIsMenstruating={alunoIsMenstruating} dbDeloadSynced={dbDeloadSynced} intensityMultiplier={state.intensityMultiplier} isCancelingDeload={isCancelingDeload} handleCancelDeload={handleCancelDeload} forceDeload={forceDeload} />}
                        {renderSettings()}
                        <DaySelectorMobile
                            theme={theme}
                            workoutTabs={state.workoutTabs} selectedWorkoutTab={state.selectedWorkoutTab} exercisesByDay={state.exercisesByDay}
                            dayDropdownOpen={dayDropdownOpen} setDayDropdownOpen={setDayDropdownOpen}
                            editingTabName={editingTabName} setEditingTabName={setEditingTabName}
                            editingTabValue={editingTabValue} setEditingTabValue={setEditingTabValue}
                            onSelectTab={setters.setSelectedWorkoutTab} onConfirmRename={confirmRenameTab}
                            onMoveTab={moveTab} onDuplicateTab={actions.duplicateTabInline}
                            onDeleteTab={deleteTabInline} onAddTab={actions.addNewTab}
                        />
                        {!state.isTemplateMode && state.currentExercises.length > 0 && (
                            <TouchableOpacity style={[S.magicSync, { backgroundColor: theme.surface, borderColor: theme.accent }]} onPress={handleMagicSync} disabled={isSyncingCargas}>
                                {isSyncingCargas ? <ActivityIndicator size="small" color={theme.accent} /> : (<><MaterialCommunityIcons name="magic-staff" size={20} color={theme.accent} /><View style={{ flex: 1, marginLeft: 8 }}><Text style={[S.magicTitle, { color: theme.accent }]}>PUXAR CARGAS DO ALUNO</Text><Text style={S.magicDesc}>Preenche o peso de todos os exercícios deste dia.</Text></View></>)}
                            </TouchableOpacity>
                        )}
                        {state.currentExercises.length === 0 && renderEmptyState()}
                    </View>
                ) : (
                    state.currentExercises.length === 0 ? renderEmptyState(24) : null
                )}
                ListFooterComponent={
                    <SharedFooter
                        theme={theme}
                        isTemplateMode={state.isTemplateMode}
                        hasExercises={state.currentExercises.length > 0}
                        onAddMore={() => { setters.setIsSelectingSubstitute(false); setters.setIsSwapping(false); setters.setModalBuscaVisible(true); }}
                        onSaveTemplate={() => setters.setModalSaveTemplateVisible(true)}
                    />
                }
            />
            {!isWebPC && <FloatingMenu {...floatingMenuProps} />}
        </View>
    );

    const Modais = () => {
        const currentExOpened = state.currentExercises[state.indexExercicioAtual];
        const isCurrentCardio = currentExOpened?.category?.toUpperCase() === 'CARDIO';
        return (
            <>
                <LibraryModals theme={theme} isWeb={isWeb} webOuterBg={webOuterBg} modalBuscaVisible={state.modalBuscaVisible} setModalBuscaVisible={setters.setModalBuscaVisible} searchText={state.searchText} setSearchText={setters.setSearchText} selectedCategory={state.selectedCategory} setSelectedCategory={setters.setSelectedCategory} selectedSubCat={state.selectedSubCat} setSelectedSubCat={setters.setSelectedSubCat} showCatDropdown={state.showCatDropdown} setShowCatDropdown={setters.setShowCatDropdown} categories={state.categories} exerciciosFiltrados={state.exerciciosFiltrados} addExercicioManual={actions.addExercicioManual} isSwapping={state.isSwapping} openPreview={actions.openPreview} previewModalVisible={state.previewModalVisible} setPreviewModalVisible={setters.setPreviewModalVisible} previewExercise={state.previewExercise} setPreviewExercise={setters.setPreviewExercise} previewVideoRef={previewVideoRef} currentExercises={state.currentExercises} />
                <TemplateAndCloneModals theme={theme} isWeb={isWeb} webOuterBg={webOuterBg} modalCloneVisible={state.modalCloneVisible} setModalCloneVisible={setters.setModalCloneVisible} cloneStudentsList={state.cloneStudentsList} selectedCloneStudent={state.selectedCloneStudent} setSelectedCloneStudent={setters.setSelectedCloneStudent} cloneWorkoutsList={state.cloneWorkoutsList} applyClone={actions.applyClone} fetchWorkoutsOfStudent={actions.fetchWorkoutsOfStudent} cloneSearchText={state.cloneSearchText} setCloneSearchText={setters.setCloneSearchText} cloneCoachFilter={state.cloneCoachFilter} setCloneCoachFilter={setters.setCloneCoachFilter} cloneCoachTabs={state.cloneCoachTabs} filteredCloneStudentsList={state.filteredCloneStudentsList} modalTemplatesVisible={state.modalTemplatesVisible} setModalTemplatesVisible={setters.setModalTemplatesVisible} templatesList={state.templatesList} goals={state.goals} levels={state.levels} templateGoal={state.templateGoal} setTemplateGoal={setters.setTemplateGoal} templateLevel={state.templateLevel} setTemplateLevel={setters.setTemplateLevel} fetchTemplates={actions.fetchTemplates} applyTemplate={actions.applyTemplate} modalSaveTemplateVisible={state.modalSaveTemplateVisible} setModalSaveTemplateVisible={setters.setModalSaveTemplateVisible} saveTemplateName={state.saveTemplateName} setSaveTemplateName={setters.setSaveTemplateName} templateGoalInput={state.templateGoalInput} setTemplateGoalInput={setters.setTemplateGoalInput} templateLevelInput={state.templateLevelInput} setTemplateLevelInput={setters.setTemplateLevelInput} saveAsTemplate={actions.saveAsTemplate} collections={state.collections} saveTemplateCollectionId={state.saveTemplateCollectionId} setSaveTemplateCollectionId={setters.setSaveTemplateCollectionId} selectedLibraryCollection={state.selectedLibraryCollection} setSelectedLibraryCollection={setters.setSelectedLibraryCollection} selectedPillar={state.selectedPillar} setSelectedPillar={setters.setSelectedPillar} selectedLevelTab={state.selectedLevelTab} setSelectedLevelTab={setters.setSelectedLevelTab} />
                <Modal visible={state.showCalendarStart} transparent animationType="fade"><View style={S.overlay}><CustomCalendar selectedDate={state.startDate} onSelect={actions.onSelectStartDate} onClose={() => setters.setShowCalendarStart(false)} theme={theme} /></View></Modal>
                <Modal visible={state.showCalendarEnd} transparent animationType="fade"><View style={S.overlay}><CustomCalendar selectedDate={state.endDate} onSelect={actions.onSelectEndDate} onClose={() => setters.setShowCalendarEnd(false)} theme={theme} /></View></Modal>
                <Modal visible={state.showCalendarIntensity} transparent animationType="fade"><View style={S.overlay}><CustomCalendar selectedDate={state.intensityEndDate || new Date()} onSelect={actions.onSelectIntensityEndDate} onClose={() => setters.setShowCalendarIntensity(false)} theme={theme} /></View></Modal>
                <TecnicaModal
                    visible={state.modalTecnicaVisible} onClose={() => setters.setModalTecnicaVisible(false)} theme={theme}
                    modalTitle={isCurrentCardio ? 'Intensidade' : 'Técnica'}
                    options={isCurrentCardio ? state.intensidadesCardio : state.tecnicasDisponiveis}
                    listaTecnicas={tecnicasLaboratorio}
                    onSelectOption={(idOuValor, isCustomId = false) => {
                        if (isCustomId) {
                            actions.atualizarBloco(state.indexExercicioAtual, state.indexBlocoAtual, 'customTechniqueId', idOuValor);
                            actions.atualizarBloco(state.indexExercicioAtual, state.indexBlocoAtual, 'technique', null);
                        } else {
                            actions.atualizarBloco(state.indexExercicioAtual, state.indexBlocoAtual, 'technique', idOuValor);
                            actions.atualizarBloco(state.indexExercicioAtual, state.indexBlocoAtual, 'customTechniqueId', null);
                        }
                        setters.setModalTecnicaVisible(false);
                    }}
                    getCurrentTechnique={() => {
                        const bloco = state.exercisesByDay[state.selectedWorkoutTab]?.[state.indexExercicioAtual]?.blocks?.[state.indexBlocoAtual];
                        return bloco?.customTechniqueId || bloco?.technique;
                    }}
                />
                <SmartAddModal
                    visible={state.smartSubstitutesModal} theme={theme}
                    smartSubstitutesList={state.smartSubstitutesList}
                    onConfirm={actions.confirmSmartSubstitute}
                    onSearchLibrary={() => { setters.setSmartSubstitutesModal(false); setters.setModalBuscaVisible(true); }}
                    onClose={() => { setters.setSmartSubstitutesModal(false); setters.setIsSelectingSubstitute(false); setters.setTargetIndexForSubstitute(null); }}
                />
                <AutoFillModal
                    visible={autoFillModalVisible} onClose={() => setAutoFillModalVisible(false)} theme={theme}
                    selectedWorkoutTab={state.selectedWorkoutTab} workoutTabs={state.workoutTabs}
                    currentExercisesCount={state.currentExercises.length}
                    onFillCurrentDay={() => actions.autoFillSubstitutes(state.selectedWorkoutTab)}
                    onFillAllDays={() => actions.autoFillSubstitutesAllDays()}
                    onClearCurrentDay={() => actions.clearSubstitutes(state.selectedWorkoutTab)}
                    onClearAllDays={() => actions.clearSubstitutesAllDays()}
                />
            </>
        );
    };

    const rootStyle = isWeb ? { height: '100dvh', width: '100%', backgroundColor: theme.bg, overflowX: 'hidden' } : { flex: 1, backgroundColor: theme.bg };

    if (isRouteCorrupted) {
        return (
            <View style={[S.center, rootStyle]}>
                <View style={[S.errorBox, { backgroundColor: theme.surface }]}>
                    <MaterialCommunityIcons name="alert-decagram" size={48} color="#FF3B30" style={{ marginBottom: 16 }} />
                    <Text style={[S.errorTitle, { color: theme.text }]}>Erro de rota</Text>
                    <Text style={[S.errorDesc, { color: theme.textSecondary }]}>Os dados do treino foram corrompidos pelo navegador para <Text style={{ fontWeight: '800', color: '#FF3B30' }}>[object Object]</Text>. Volte e tente novamente.</Text>
                    <TouchableOpacity style={[S.errorBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.goBack()}><Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }}>Voltar</Text></TouchableOpacity>
                </View>
            </View>
        );
    }

    if (state.loading) return <View style={[S.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.accent} /></View>;

    const Header = () => (
        <View style={[S.headerInner, { paddingTop: isWebPC ? 20 : 10, borderBottomWidth: isWebPC ? 0 : 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[S.backBtn, { backgroundColor: theme.surface }]}><MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} /></TouchableOpacity>
            <Text style={[S.headerTitle, { color: theme.text }]} numberOfLines={1}>{route.params?.isEditing ? 'Editar Rotina' : 'Nova Rotina'}</Text>
            <TouchableOpacity onPress={actions.salvarTreinoFinal} disabled={state.sending} style={[S.saveBtn, { backgroundColor: state.sending ? theme.border : theme.accent }]}>
                {state.sending ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" /> : <Text style={[S.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR</Text>}
            </TouchableOpacity>
        </View>
    );

    if (isWebPC) {
        return (
            <View style={rootStyle}>
                <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
                <View style={{ width: '100%', alignItems: 'center', backgroundColor: theme.bg, borderBottomWidth: 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', zIndex: 10, ...(Platform.OS === 'web' ? { position: 'sticky', top: 0 } : {}) }}>
                    <View style={{ width: '100%', maxWidth: containerMaxWidth }}><Header /></View>
                </View>
                <View style={{ flexDirection: 'row', width: '100%', maxWidth: containerMaxWidth, alignSelf: 'center', minHeight: Platform.OS === 'web' ? '100%' : undefined, backgroundColor: webOuterBg, ...containerBorders }}>
                    <View style={[S.sidebar, { backgroundColor: theme.surface, borderRightColor: theme.border, ...(Platform.OS === 'web' ? { position: 'sticky', top: 61, height: 'calc(100dvh - 61px)', alignSelf: 'flex-start', overflowY: 'auto', flexShrink: 0 } : {}) }]}>
                        <SidebarPC
                            theme={theme} isTemplateMode={state.isTemplateMode}
                            anamneseData={anamneseData} isRaioxExpanded={isRaioxExpanded} onToggleRaiox={() => setIsRaioxExpanded(!isRaioxExpanded)}
                            state={state} setters={setters} alunoIsMenstruating={alunoIsMenstruating} dbDeloadSynced={dbDeloadSynced} isCancelingDeload={isCancelingDeload} handleCancelDeload={handleCancelDeload} forceDeload={forceDeload}
                            renderSettings={renderSettings}
                            workoutTabs={state.workoutTabs} selectedWorkoutTab={state.selectedWorkoutTab} exercisesByDay={state.exercisesByDay}
                            onSelectTab={setters.setSelectedWorkoutTab} onMoveTab={moveTab} onAddTab={actions.addNewTab}
                            onRenameTab={(oldName, newName) => {
                                if (!newName || newName === oldName) return;
                                if (state.workoutTabs.includes(newName)) { alert('Já existe um dia com esse nome!'); return; }
                                const tabs = state.workoutTabs.map(t => t === oldName ? newName : t);
                                const newEx = {};
                                Object.keys(state.exercisesByDay).forEach(k => { newEx[k === oldName ? newName : k] = state.exercisesByDay[k]; });
                                setters.setWorkoutTabs(tabs);
                                setters.setExercisesByDay(newEx);
                                if (state.selectedWorkoutTab === oldName) setters.setSelectedWorkoutTab(newName);
                            }}
                            onDuplicateTab={actions.duplicateTabInline}
                            onDeleteTab={deleteTabInline}
                            currentExercisesLength={state.currentExercises.length}
                            isSyncingCargas={isSyncingCargas} onMagicSync={handleMagicSync}
                            alunoId={aluno?.id}
                            onViewWorkout={() => navigation.navigate('DayWorkoutScreen', { workoutId: route.params?.workoutToEdit?.id, day: state.selectedWorkoutTab, workoutName: state.customWorkoutName, isPreview: true })}
                            onAutoFill={() => setAutoFillModalVisible(true)}
                        />
                    </View>
                    <View style={{ flex: 1, position: 'relative' }}>
                        {renderMainArea()}
                        <FloatingMenu {...floatingMenuProps} />
                    </View>
                </View>
                {Modais()}
            </View>
        );
    }

    return (
        <SafeAreaViewContext style={[rootStyle, { flexDirection: 'column' }]}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
            <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg }}>
                <Header />
                <KeyboardAvoidingView behavior="padding" style={{ flex: 1, width: '100%' }} enabled>
                    {renderMainArea()}
                </KeyboardAvoidingView>
            </View>
            {Modais()}
        </SafeAreaViewContext>
    );
}

const S = StyleSheet.create({
    center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorBox:    { margin: 30, padding: 30, borderRadius: 20, alignItems: 'center' },
    errorTitle:  { fontSize: 20, fontWeight: '900', marginBottom: 10 },
    errorDesc:   { textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    errorBtn:    { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
    headerInner: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    backBtn:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    saveBtn:     { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, minWidth: 80, alignItems: 'center' },
    saveBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
    sidebar:     { width: 340, minWidth: 340, borderRightWidth: 1 },
    overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    emptyState:  { alignItems: 'center', marginTop: 24, marginBottom: 24, padding: 36, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20 },
    emptyIconBox:{ borderRadius: 50, padding: 20, marginBottom: 16 },
    emptyTitle:  { fontSize: 15, fontWeight: '700', marginBottom: 8 },
    emptyDesc:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },
    magicSync:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 10, marginBottom: 10 },
    magicTitle:  { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    magicDesc:   { fontSize: 10, color: '#888', marginTop: 2 },
});