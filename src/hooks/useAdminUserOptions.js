// src/hooks/useAdminUserOptions.js — v2
// v2: studentModules — define o que o aluno acessa no app do coach parceiro
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { fetchAndProcessRaioxData } from '../utils/raioxUtils';

const formatToBRDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function useAdminUserOptions(aluno, navigation) {
    const [loading, setLoading] = useState(true);
    const [freshAluno, setFreshAluno] = useState(aluno);

    const [activeWorkouts, setActiveWorkouts] = useState([]);
    const [archivedWorkouts, setArchivedWorkouts] = useState([]);

    const [activeTab, setActiveTab] = useState('RESUMO');
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [workoutTab, setWorkoutTab] = useState('active');

    const [isActiveUser, setIsActiveUser] = useState(aluno?.active);
    const [userPlan, setUserPlan] = useState('PREMIUM');

    const [fichaDaysElapsed, setFichaDaysElapsed] = useState(0);
    const [hasActiveFicha, setHasActiveFicha] = useState(false);

    const [photoUrl, setPhotoUrl] = useState(aluno?.photoUrl || null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [evaluationUrl, setEvaluationUrl] = useState(aluno?.evaluationUrl || '');

    const [nextCheckInDate, setNextCheckInDate] = useState('');
    const [disableCheckIn, setDisableCheckIn] = useState(aluno?.disableCheckIn || false);

    const [dietGoal, setDietGoal] = useState(aluno?.dietGoal || 'NONE');
    const [savingDiet, setSavingDiet] = useState(false);
    const [isDietTabVisible, setIsDietTabVisible] = useState(false);

    // 🏃 MÓDULO DE CORRIDA
    const [isRunningModule, setIsRunningModule] = useState(!!aluno?.runningModule);

    // ← v2: módulos do aluno (coach parceiro)
    const [studentModules, setStudentModules]   = useState(aluno?.studentModules || 'TREINO');
    const [savingModules,  setSavingModules]    = useState(false);
    // coachPlan do coach logado (carregado do AsyncStorage)
    const [coachPlan, setCoachPlan]             = useState('PERSONAL');

    const [vipContents, setVipContents] = useState([]);
    const [userAccess, setUserAccess] = useState([]);
    const [loadingPaflix, setLoadingPaflix] = useState(false);

    const [isCargasModalVisible, setIsCargasModalVisible] = useState(false);
    const [historicoDeCargasList, setHistoricoDeCargasList] = useState([]);

    const [isRunningModalVisible, setIsRunningModalVisible] = useState(false);

    const [studentAlerts, setStudentAlerts] = useState([]);
    const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

    const [strategyNotes, setStrategyNotes] = useState(aluno?.strategyNotes || '');
    const [lastContactDate, setLastContactDate] = useState(aluno?.lastContactDate || null);
    const [savingNotes, setSavingNotes] = useState(false);

    const [weeklyChecks, setWeeklyChecks] = useState(aluno?.weeklyChecks || []);
    const [newCheckText, setNewCheckText] = useState('');

    const daysSinceContact = lastContactDate
        ? Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 3600 * 24))
        : 999;
    const isContactDelayed = daysSinceContact >= 7;

    useEffect(() => {
        // ← v2: carrega coachPlan do admin logado
        const loadCoachPlan = async () => {
            try {
                const str = await AsyncStorage.getItem('user');
                if (str) {
                    const u = JSON.parse(str);
                    setCoachPlan(u.coachPlan ?? 'PERSONAL');
                }
            } catch {}
        };
        loadCoachPlan();

        const loadCache = async () => {
            try {
                const cached = await AsyncStorage.getItem(`@useroptionscache_${aluno.id}`);
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
                        setIsRunningModule(!!freshness.runningModule);
                        setStudentModules(freshness.studentModules || 'TREINO'); // ← v2
                        setWeeklyChecks(freshness.weeklyChecks || []);
                        setStrategyNotes(freshness.strategyNotes || '');
                        setLastContactDate(freshness.lastContactDate || null);
                        const dbPlan = freshness.plan || 'PREMIUM';
                        setUserPlan(['LOWCOST','CHALLENGE21','FICHA_8S','ELITE','PERFORMANCE','PREMIUM'].includes(dbPlan) ? dbPlan : 'PREMIUM');
                    }
                    setLoading(false);
                }
            } catch {}
        };

        if (aluno?.id) loadCache();
        const unsubscribe = navigation.addListener('focus', () => { fetchAllData(); });
        return unsubscribe;
    }, [navigation, aluno?.id]);

    const fetchAllData = async () => {
        if (!aluno || !aluno.id) { setLoading(false); return; }
        const t = Date.now();
        setLoadingPaflix(true);
        try {
            const [resWorkouts, resUser, resPaflix, resAccess, resAlerts] = await Promise.all([
                fetch(`https://fitos-final.onrender.com/api/workout?userId=${aluno.id}&t=${t}`),
                fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}?t=${t}`),
                fetch(`https://fitos-final.onrender.com/api/contents?t=${t}`),
                fetch(`https://fitos-final.onrender.com/api/admin/access?userId=${aluno.id}`),
                fetch(`https://fitos-final.onrender.com/api/admin/alerts?userId=${aluno.id}&t=${t}`)
            ]);

            let activeWk = []; let archivedWk = [];
            if (resWorkouts.ok) {
                const dataW = await resWorkouts.json();
                if (Array.isArray(dataW)) {
                    const now = new Date();
                    dataW.forEach(w => {
                        if (w.archived) { archivedWk.push(w); return; }
                        if (!w.startDate && !w.endDate) { activeWk.push(w); return; }
                        if (w.startDate) {
                            const start = new Date(w.startDate); start.setHours(0,0,0,0);
                            if (now < start) { archivedWk.push(w); return; }
                        }
                        if (w.endDate) {
                            const end = new Date(w.endDate); end.setHours(23,59,59,999);
                            if (now > end) { archivedWk.push(w); return; }
                        }
                        activeWk.push(w);
                    });
                    activeWk.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                    archivedWk.sort((a,b) => new Date(b.endDate||b.createdAt) - new Date(a.endDate||a.createdAt));
                    setActiveWorkouts(activeWk); setArchivedWorkouts(archivedWk);
                    AsyncStorage.setItem(`@useroptionscache_${aluno.id}`, JSON.stringify({ workouts: { active: activeWk, archived: archivedWk }, freshness: aluno }));
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
                setIsRunningModule(!!fresh.runningModule);
                setStudentModules(fresh.studentModules || 'TREINO'); // ← v2
                setWeeklyChecks(fresh.weeklyChecks || []);
                setStrategyNotes(fresh.strategyNotes || '');
                setLastContactDate(fresh.lastContactDate || null);

                const finalPlan = ['LOWCOST','CHALLENGE21','FICHA_8S','ELITE','PERFORMANCE','PREMIUM'].includes(fresh.plan) ? fresh.plan : 'PREMIUM';
                setUserPlan(finalPlan);
                if (finalPlan === 'FICHA_8S') {
                    let startD = new Date(fresh.createdAt || new Date());
                    if (activeWk.length > 0) {
                        const currentWorkout = activeWk[0];
                        if (currentWorkout.startDate) startD = new Date(currentWorkout.startDate);
                        setHasActiveFicha(true);
                    } else setHasActiveFicha(false);
                    startD.setHours(0,0,0,0);
                    const todayD = new Date(); todayD.setHours(0,0,0,0);
                    const diffD = Math.floor((todayD.getTime() - startD.getTime()) / (1000*3600*24));
                    setFichaDaysElapsed(Math.max(0, diffD));
                }
            }

            if (resPaflix.ok) {
                const contents = await resPaflix.json();
                if (Array.isArray(contents)) setVipContents(contents.filter(c => c.isVIP));
            }
            if (resAccess.ok) { const access = await resAccess.json(); if (Array.isArray(access)) setUserAccess(access); }
            if (resAlerts?.ok) { const alerts = await resAlerts.json(); if (Array.isArray(alerts)) setStudentAlerts(alerts); }

        } catch (error) { console.log('Erro no Motor:', error); }
        finally { setLoading(false); setLoadingPaflix(false); }
    };

    // ← v2: salva studentModules no banco
    const handleSaveStudentModules = async (newModules) => {
        setSavingModules(true);
        const prev = studentModules;
        setStudentModules(newModules);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ studentModules: newModules }),
            });
            if (!res.ok) throw new Error();
            const msg = 'Módulos do aluno atualizados!';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Sucesso', msg);
        } catch {
            setStudentModules(prev);
            const msg = 'Erro ao salvar módulos.';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Erro', msg);
        } finally { setSavingModules(false); }
    };

    const handleRequestAnamneseUpdate = (formType) => {
        const shouldEnableDiet = formType === 'FULL';
        const typeLabel = shouldEnableDiet ? 'Treino + Dieta (Completo)' : 'Apenas Treino';
        const msg = `O aluno será obrigado a preencher o formulário [${typeLabel}] no próximo acesso.\n\nDeseja confirmar?`;
        if (Platform.OS === 'web') {
            if (window.confirm(msg)) executeAnamneseRequest(shouldEnableDiet);
        } else {
            Alert.alert('Solicitar Anamnese', msg, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sim, Enviar', onPress: () => executeAnamneseRequest(shouldEnableDiet) },
            ]);
        }
    };

    const executeAnamneseRequest = async (shouldEnableDiet) => {
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ anamnesePendente: true, dietModule: shouldEnableDiet }),
            });
            if (!res.ok) throw new Error();
            if (Platform.OS === 'web') window.alert('Sucesso! Anamnese solicitada.');
            else Alert.alert('Sucesso', 'O formulário foi disparado para o aluno.');
            fetchAllData();
        } catch {
            if (Platform.OS === 'web') window.alert('Erro ao solicitar anamnese.');
            else Alert.alert('Erro', 'Não foi possível enviar a solicitação.');
        }
    };

    const handleSaveStrategy = async (newDate = null) => {
        setSavingNotes(true);
        const payload = { strategyNotes, weeklyChecks };
        if (newDate) payload.lastContactDate = newDate;
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error();
            if (newDate) setLastContactDate(newDate);
            if (Platform.OS === 'web') window.alert('Acompanhamento atualizado!');
            else Alert.alert('Sucesso', 'Acompanhamento atualizado!');
        } catch {
            if (Platform.OS === 'web') window.alert('Erro ao salvar.');
            else Alert.alert('Erro', 'Falha ao salvar.');
        } finally { setSavingNotes(false); }
    };

    const handleRegisterContactToday = () => handleSaveStrategy(new Date().toISOString());

    const confirmChangePlan = (newPlan) => {
        if (userPlan === newPlan) return;
        const planNames = { ELITE:'Consultoria Elite', PERFORMANCE:'Performance (Só Treino)', PREMIUM:'Premium (Antiga)', FICHA8S:'Ficha 8 Semanas', LOWCOST:'Plano Básico', CHALLENGE21:'Desafio 21 Dias' };
        const msg = `Tem certeza que deseja alterar para o plano ${planNames[newPlan]}?`;
        if (Platform.OS === 'web') { if (window.confirm(msg)) handleChangePlan(newPlan); }
        else Alert.alert('Alterar Plano', msg, [{ text:'Cancelar', style:'cancel' }, { text:'Sim, Alterar', onPress: () => handleChangePlan(newPlan) }]);
    };

    const handleChangePlan = async (newPlan) => {
        setUserPlan(newPlan);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ plan: newPlan }) });
            if (!res.ok) throw new Error();
            if (Platform.OS === 'web') window.alert('Sucesso! Esteira atualizada.');
            fetchAllData();
        } catch { Platform.OS === 'web' ? window.alert('Erro.') : Alert.alert('Erro','Falha ao atualizar.'); fetchAllData(); }
    };

    const handleToggleDietTab = async () => {
        const newValue = !isDietTabVisible;
        setIsDietTabVisible(newValue);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ dietModule: newValue }) });
            if (!res.ok) throw new Error();
        } catch { setIsDietTabVisible(!newValue); Alert.alert('Erro','Não foi possível alterar.'); }
    };

    const handleToggleRunningModule = async () => {
        const newValue = !isRunningModule;
        setIsRunningModule(newValue);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ runningModule: newValue }) });
            if (!res.ok) throw new Error();
        } catch { setIsRunningModule(!newValue); Alert.alert('Erro','Não foi possível alterar.'); }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing:true, aspect:[1,1], quality:0.6 });
            if (!result.canceled) {
                const fileToUpload = result.assets[0];
                setUploadingPhoto(true);
                const formData = new FormData();
                if (Platform.OS === 'web') {
                    const res = await fetch(fileToUpload.uri);
                    const blob = await res.blob();
                    formData.append('file', blob, 'profile.jpg');
                } else {
                    const imageUri = Platform.OS === 'ios' ? fileToUpload.uri.replace('file://','') : fileToUpload.uri;
                    formData.append('file', { uri:imageUri, name:'profile.jpg', type:'image/jpeg' });
                }
                const uploadRes = await fetch('https://fitos-final.onrender.com/api/upload-image', { method:'POST', body:formData, headers:{'Accept':'application/json'} });
                let uploadData;
                try { uploadData = await uploadRes.json(); } catch { throw new Error(); }
                if (!uploadRes.ok) throw new Error();
                const finalUrl = uploadData.imageUrl || uploadData.url;
                if (finalUrl) {
                    const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ photoUrl: finalUrl }) });
                    if (res.ok) { setPhotoUrl(finalUrl); Platform.OS === 'web' ? window.alert('Foto atualizada!') : Alert.alert('Sucesso','Foto atualizada!'); }
                }
            }
        } catch {} finally { setUploadingPhoto(false); }
    };

    const handleToggleAccess = async (contentId, currentStatus) => {
        const newStatus = !currentStatus;
        if (newStatus) setUserAccess(prev => [...prev, contentId]); else setUserAccess(prev => prev.filter(id => id !== contentId));
        try {
            const res = await fetch('https://fitos-final.onrender.com/api/admin/access', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:aluno.id, contentId, grant:newStatus }) });
            if (!res.ok) throw new Error();
        } catch {
            if (!newStatus) setUserAccess(prev => [...prev, contentId]); else setUserAccess(prev => prev.filter(id => id !== contentId));
            Alert.alert('Erro','Falha ao atualizar.');
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = !isActiveUser;
        try {
            await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ active: newStatus }) });
            setIsActiveUser(newStatus);
            Platform.OS === 'web' ? window.alert(`Aluno ${newStatus ? 'ativado' : 'inativado'}!`) : Alert.alert('Sucesso',`Aluno ${newStatus ? 'ativado' : 'inativado'}!`);
        } catch {}
    };

    const handleDeleteUser = async () => {
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'DELETE' });
            if (res.ok) {
                Platform.OS === 'web' ? window.alert('Aluno removido permanentemente.') : Alert.alert('Excluído','Aluno removido.');
                navigation.goBack();
            }
        } catch {}
    };

    const handleSaveEvaluation = async () => {
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ evaluationUrl }) });
            if (res.ok) { Platform.OS === 'web' ? window.alert('Dados atualizados.') : Alert.alert('Sucesso','Dados atualizados!'); }
        } catch {}
    };

    const handleDeleteWorkout = async (workoutId) => {
        try { await fetch(`https://fitos-final.onrender.com/api/workout/${workoutId}`, { method:'DELETE', headers:{'Content-Type':'application/json'} }); fetchAllData(); } catch {}
    };

    const handleToggleArchiveWorkout = async (workout) => {
        const newStatus = !workout.archived;
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/workout/${workout.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ archived: newStatus }) });
            if (!res.ok) await fetch(`https://fitos-final.onrender.com/api/workout`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:workout.id, archived:newStatus }) });
            fetchAllData();
        } catch {}
    };

    const handleEditWorkout = (workout) => navigation.navigate('MontarTreinoAdmin', { aluno: JSON.stringify(freshAluno||aluno), workoutToEdit:workout, isEditing:true });
    const handleNewWorkout  = () => navigation.navigate('MontarTreinoAdmin', { aluno: JSON.stringify(freshAluno||aluno), isEditing:false });

    const handleToggleDisableCheckIn = async () => {
        const newValue = !disableCheckIn;
        setDisableCheckIn(newValue);
        try { await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ disableCheckIn: newValue }) }); } catch { setDisableCheckIn(!newValue); }
    };

    const handleCheckInDateChange = (text) => setNextCheckInDate(text);

    const handleSaveCheckInDate = async () => {
        let isoDate = null;
        if (nextCheckInDate && nextCheckInDate.length === 10) {
            const [day, month, year] = nextCheckInDate.split('/');
            isoDate = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();
        }
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ nextCheckInDate: isoDate }) });
            if (res.ok) { Platform.OS === 'web' ? window.alert('Sucesso!') : Alert.alert('Sucesso','Data atualizada!'); }
        } catch {}
    };

    const handleSaveDietGoal = async () => {
        setSavingDiet(true);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ dietGoal }) });
            if (res.ok) { Platform.OS === 'web' ? window.alert('Estratégia salva!') : Alert.alert('Sucesso','Estratégia salva!'); }
        } catch {} finally { setSavingDiet(false); }
    };

    const handleDismissAlert = async (alertId) => {
        setStudentAlerts(prev => prev.filter(a => a.id !== alertId));
        try { await fetch(`https://fitos-final.onrender.com/api/admin/alerts/${alertId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ isRead: true }) }); } catch {}
    };

    const handleAbrirRaioxCargas = async () => {
        setIsCargasModalVisible(true);
        const data = await fetchAndProcessRaioxData(aluno.id, activeWorkouts, archivedWorkouts);
        setHistoricoDeCargasList(data);
    };

    const handleAddCheck = () => {
        if (newCheckText.trim()) { setWeeklyChecks(prev => [...prev, { text:newCheckText.trim(), resolved:false }]); setNewCheckText(''); }
    };
    const handleToggleCheck  = (index) => setWeeklyChecks(prev => prev.map((item,i) => i===index ? {...item, resolved:!item.resolved} : item));
    const handleRemoveCheck  = (index) => setWeeklyChecks(prev => prev.filter((_,i) => i!==index));

    return {
        loading, freshAluno, activeWorkouts, archivedWorkouts,
        activeTab, setActiveTab, isMenuVisible, setIsMenuVisible, workoutTab, setWorkoutTab,
        isActiveUser, userPlan, fichaDaysElapsed, hasActiveFicha, photoUrl, uploadingPhoto,
        evaluationUrl, setEvaluationUrl, nextCheckInDate, disableCheckIn, dietGoal, setDietGoal,
        savingDiet, isDietTabVisible, isRunningModule,
        studentModules, savingModules, coachPlan, handleSaveStudentModules, // ← v2
        vipContents, userAccess, loadingPaflix,
        isCargasModalVisible, setIsCargasModalVisible, historicoDeCargasList,
        isRunningModalVisible, setIsRunningModalVisible,
        studentAlerts, isAlertsExpanded, setIsAlertsExpanded,
        strategyNotes, setStrategyNotes, lastContactDate, savingNotes,
        weeklyChecks, newCheckText, setNewCheckText, daysSinceContact, isContactDelayed,
        fetchAllData, handleSaveStrategy, handleRegisterContactToday, confirmChangePlan,
        handleChangePlan, handleToggleDietTab, handleToggleRunningModule,
        handlePickImage, handleToggleAccess, handleToggleStatus, handleDeleteUser,
        handleSaveEvaluation, handleDeleteWorkout, handleToggleArchiveWorkout,
        handleEditWorkout, handleNewWorkout, handleToggleDisableCheckIn,
        handleCheckInDateChange, handleSaveCheckInDate, handleSaveDietGoal,
        handleDismissAlert, handleAbrirRaioxCargas, handleAddCheck, handleToggleCheck, handleRemoveCheck,
        handleRequestAnamneseUpdate,
    };
}
