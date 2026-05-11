// src/screens/AdminUserOptions.js

import React, { useState, useEffect, createElement } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, 
    ActivityIndicator, StatusBar, Alert, Platform, Image, Switch, Dimensions, TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

import AdminUserWorkouts from '../components/AdminUserWorkouts';
import AdminUserSystem from '../components/AdminUserSystem';

import RaioxCargasModal from '../components/RaioxCargasModal';
import { fetchAndProcessRaioxData } from '../utils/raioxUtils';

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

// 🔥 AS 6 ABAS DE ELITE (FINANCEIRO REMOVIDO) 🔥
const TABS = ['RESUMO', 'TREINOS', 'AVALIACOES', 'DIETA_IA', 'ACESSOS', 'SISTEMA'];

export default function AdminUserOptions({ route, navigation }) {
  const { aluno } = route.params;
  const { theme } = useTheme(); 

  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isWebPC = Platform.OS === 'web' && windowWidth > 768; 

  const [loading, setLoading] = useState(true);
  const [freshAluno, setFreshAluno] = useState(aluno); 
  
  const [activeWorkouts, setActiveWorkouts] = useState([]);
  const [archivedWorkouts, setArchivedWorkouts] = useState([]);
  
  const [activeTab, setActiveTab] = useState('RESUMO'); 
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

  const [isCargasModalVisible, setIsCargasModalVisible] = useState(false);
  const [historicoDeCargasList, setHistoricoDeCargasList] = useState([]);

  const [studentAlerts, setStudentAlerts] = useState([]);
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(Dimensions.get('window').width);
    const subscription = Dimensions.addEventListener('change', handleResize);
    return () => subscription?.remove();
  }, []);

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
    if (!aluno || !aluno.id) { setLoading(false); return; }
    const t = Date.now();
    try {
        const [resWorkouts, resUser, resPaflix, resAccess, resAlerts] = await Promise.all([
            fetch(`https://fitos-final.onrender.com/api/workout?userId=${aluno.id}&t=${t}`),
            fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}?t=${t}`),
            fetch(`https://fitos-final.onrender.com/api/contents`),
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
                        const start = new Date(w.startDate); start.setHours(0, 0, 0, 0);
                        if (now < start) { archivedWk.push(w); return; }
                    }
                    if (w.endDate) {
                        const end = new Date(w.endDate); end.setHours(23, 59, 59, 999);
                        if (now > end) { archivedWk.push(w); return; }
                    }
                    activeWk.push(w);
                });
                activeWk.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                archivedWk.sort((a,b) => new Date(b.endDate || b.createdAt) - new Date(a.endDate || a.createdAt));
                setActiveWorkouts(activeWk); setArchivedWorkouts(archivedWk);
                AsyncStorage.setItem(`@user_options_cache_${aluno.id}`, JSON.stringify({ workouts: { active: activeWk, archived: archivedWk }, freshness: aluno }));
            }
        }

        if (resUser.ok) {
            const fresh = await resUser.json();
            setFreshAluno(fresh); setEvaluationUrl(fresh.evaluationUrl || '');
            if (fresh.nextCheckInDate) setNextCheckInDate(formatToBRDate(fresh.nextCheckInDate));
            setDisableCheckIn(!!fresh.disableCheckIn); setPhotoUrl(fresh.photoUrl);
            setIsActiveUser(fresh.active); setDietGoal(fresh.dietGoal || 'NONE');
            setIsDietTabVisible(!!fresh.dietModule); 
            
            const finalPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S', 'ELITE', 'PERFORMANCE', 'PREMIUM'].includes(fresh.plan) ? fresh.plan : 'PREMIUM';
            setUserPlan(finalPlan);
            if (finalPlan === 'FICHA_8S') {
                let startD = new Date(fresh.createdAt || new Date());
                if (activeWk.length > 0) {
                    const currentWorkout = activeWk[0];
                    if (currentWorkout.startDate) startD = new Date(currentWorkout.startDate);
                    setHasActiveFicha(true);
                } else setHasActiveFicha(false);
                startD.setHours(0,0,0,0); const todayD = new Date(); todayD.setHours(0,0,0,0);
                const diffD = Math.floor((todayD.getTime() - startD.getTime()) / (1000 * 3600 * 24));
                setFichaDaysElapsed(Math.max(0, diffD));
            }
        }

        if (resPaflix.ok) { const contents = await resPaflix.json(); if (Array.isArray(contents)) setVipContents(contents.filter(c => c.isVIP)); }
        if (resAccess.ok) { const access = await resAccess.json(); if (Array.isArray(access)) setUserAccess(access); }
        if (resAlerts && resAlerts.ok) { const alerts = await resAlerts.json(); if (Array.isArray(alerts)) setStudentAlerts(alerts); }

    } catch (error) { console.log("Erro no Motor:", error); } finally { setLoading(false); setLoadingPaflix(false); }
  };

  const confirmChangePlan = (newPlan) => {
      if (userPlan === newPlan) return;
      const planNames = { 'ELITE': 'Consultoria Elite', 'PERFORMANCE': 'Performance (Só Treino)', 'PREMIUM': 'Premium (Antiga)', 'FICHA_8S': 'Ficha 8 Semanas', 'LOW_COST': 'Plano Básico', 'CHALLENGE_21': 'Desafio 21 Dias' };
      const msg = `Tem certeza que deseja alterar para o plano ${planNames[newPlan]}?`;
      if (Platform.OS === 'web') { if (window.confirm(msg)) handleChangePlan(newPlan); } 
      else { Alert.alert("Alterar Plano", msg, [ { text: "Cancelar", style: "cancel" }, { text: "Sim, Alterar", onPress: () => handleChangePlan(newPlan) } ]); }
  };

  const handleChangePlan = async (newPlan) => {
      setUserPlan(newPlan); 
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ plan: newPlan }) });
          if (!res.ok) throw new Error();
          if (Platform.OS === 'web') window.alert("Sucesso! Esteira atualizada.");
          fetchAllData(); 
      } catch(e) { Platform.OS === 'web' ? window.alert("Erro.") : Alert.alert("Erro", "Falha ao atualizar."); fetchAllData(); }
  };

  const handleToggleDietTab = async () => {
      const newValue = !isDietTabVisible;
      setIsDietTabVisible(newValue);
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ dietModule: newValue }) });
          if (!res.ok) throw new Error();
      } catch(e) { setIsDietTabVisible(!newValue); Alert.alert("Erro", "Não foi possível alterar a visibilidade."); }
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
              try { uploadData = await uploadRes.json(); } catch (e) { throw new Error(); }
              if (!uploadRes.ok) throw new Error();
              const finalUrl = uploadData.imageUrl || uploadData.url;
              if (finalUrl) {
                  const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ photoUrl: finalUrl }) });
                  if (res.ok) {
                      setPhotoUrl(finalUrl);
                      Platform.OS === 'web' ? window.alert("Foto atualizada!") : Alert.alert("Sucesso", "Foto atualizada!");
                  }
              }
          }
      } catch(e) {} finally { setUploadingPhoto(false); }
  };

  const handleToggleAccess = async (contentId, currentStatus) => {
      const newStatus = !currentStatus;
      if (newStatus) setUserAccess(prev => [...prev, contentId]); else setUserAccess(prev => prev.filter(id => id !== contentId));
      try {
          const res = await fetch('https://fitos-final.onrender.com/api/admin/access', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ userId: aluno.id, contentId, grant: newStatus }) });
          if (!res.ok) throw new Error();
      } catch(e) {
          if (!newStatus) setUserAccess(prev => [...prev, contentId]); else setUserAccess(prev => prev.filter(id => id !== contentId));
          Alert.alert("Erro", "Falha ao atualizar.");
      }
  };

  const handleToggleStatus = async () => {
      const newStatus = !isActiveUser;
      try {
          await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ active: newStatus }) });
          setIsActiveUser(newStatus);
          Platform.OS === 'web' ? window.alert(`Aluno ${newStatus ? 'ativado' : 'inativado'}!`) : Alert.alert("Sucesso", `Aluno ${newStatus ? 'ativado' : 'inativado'}!`);
      } catch (e) {}
  };

  const handleDeleteUser = async () => {
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'DELETE' });
          if (res.ok) {
              Platform.OS === 'web' ? window.alert("Aluno removido permanentemente.") : Alert.alert("Excluído", "Aluno removido.");
              navigation.goBack();
          }
      } catch (e) {}
  };

  const handleSaveEvaluation = async () => {
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ evaluationUrl: evaluationUrl }) });
          if (res.ok) { Platform.OS === 'web' ? window.alert("Dados atualizados.") : Alert.alert("Sucesso", "Dados atualizados!"); } 
      } catch(e) {}
  };

  const handleDeleteWorkout = async (workoutId) => {
      try {
          await fetch(`https://fitos-final.onrender.com/api/workout/${workoutId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }});
          fetchAllData(); 
      } catch(e) {}
  };

  const handleToggleArchiveWorkout = async (workout) => {
      const newStatus = !workout.archived;
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/workout/${workout.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: newStatus }) });
          if (!res.ok) await fetch(`https://fitos-final.onrender.com/api/workout`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: workout.id, archived: newStatus }) });
          fetchAllData(); 
      } catch(e) {}
  };

  const handleEditWorkout = (workout) => { navigation.navigate('MontarTreinoAdmin', { aluno: JSON.stringify(aluno), workoutToEdit: workout, isEditing: true }); };
  const handleNewWorkout = () => { navigation.navigate('MontarTreinoAdmin', { aluno: JSON.stringify(aluno), isEditing: false }); };

  const handleToggleDisableCheckIn = async () => {
      const newValue = !disableCheckIn;
      setDisableCheckIn(newValue); 
      try { await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ disableCheckIn: newValue }) }); } catch(e) { setDisableCheckIn(!newValue); }
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
          if (res.ok) { Platform.OS === 'web' ? window.alert(`Sucesso!`) : Alert.alert("Sucesso", "Data de check-in atualizada!"); }
      } catch(e) {}
  };

  const handleSaveDietGoal = async () => {
      setSavingDiet(true);
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dietGoal }) });
          if (res.ok) { Platform.OS === 'web' ? window.alert("Estratégia Alimentar salva!") : Alert.alert("Sucesso", "Estratégia salva!"); } 
      } catch (e) {} finally { setSavingDiet(false); }
  };

  const handleDismissAlert = async (alertId) => {
      setStudentAlerts(prev => prev.filter(a => a.id !== alertId));
      try { await fetch(`https://fitos-final.onrender.com/api/admin/alerts/${alertId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) }); } catch (e) {}
  };

  const handleAbrirRaioxCargas = async () => {
      setIsCargasModalVisible(true);
      const data = await fetchAndProcessRaioxData(aluno.id, activeWorkouts, archivedWorkouts);
      setHistoricoDeCargasList(data);
  };

  // 🔥 RENDERIZAÇÃO INTELIGENTE POR ABA 🔥
  const renderContent = () => {
    switch (activeTab) {
        case 'RESUMO':
            return (
                <View style={styles.tabContent}>
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
                            <View style={{flexDirection: 'row', gap: 10, marginTop: 8}}>
                                <View style={[styles.miniBadge, { backgroundColor: isActiveUser ? '#34C75922' : '#FF3B3022', borderColor: isActiveUser ? '#34C759' : '#FF3B30' }]}>
                                    <Text style={{color: isActiveUser ? '#34C759' : '#FF3B30', fontSize: 10, fontWeight: 'bold'}}>{isActiveUser ? 'ATIVO' : 'BLOQUEADO'}</Text>
                                </View>
                                <View style={[styles.miniBadge, { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}>
                                    <Text style={{color: theme.accent, fontSize: 10, fontWeight: 'bold'}}>{freshAluno.currentXP || 0} XP</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ALERTAS DA IA */}
                    {studentAlerts.length > 0 && (
                        <View style={{ marginBottom: 25 }}>
                            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: isAlertsExpanded ? '#FF9500' : theme.border, borderRadius: 12, padding: 15, marginBottom: isAlertsExpanded ? 10 : 0 }} onPress={() => setIsAlertsExpanded(!isAlertsExpanded)} activeOpacity={0.8}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ backgroundColor: '#FF9500' + '20', padding: 8, borderRadius: 8 }}><MaterialCommunityIcons name="brain" size={20} color="#FF9500" /></View>
                                    <View>
                                        <Text style={{ color: '#FF9500', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>LABORATÓRIO DE IA</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{studentAlerts.length} aviso(s) de estagnação pendente(s)</Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons name={isAlertsExpanded ? "chevron-up" : "chevron-down"} size={24} color={theme.textSecondary} />
                            </TouchableOpacity>

                            {isAlertsExpanded && (
                                <View style={{ gap: 10 }}>
                                    {studentAlerts.map(alert => (
                                        <View key={alert.id} style={{ backgroundColor: theme.isDark ? '#2c1e0a' : '#fff5e6', borderWidth: 1, borderColor: '#FF9500', borderRadius: 12, padding: 15 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}><MaterialCommunityIcons name="alert-circle" size={16} color="#FF9500" /><Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>{alert.title}</Text></View>
                                                <TouchableOpacity onPress={() => handleDismissAlert(alert.id)} style={{ padding: 4, backgroundColor: theme.surface, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}><MaterialCommunityIcons name="check-bold" size={16} color={theme.accent} /></TouchableOpacity>
                                            </View>
                                            <Text style={{ color: theme.text, fontSize: 13, marginBottom: 12 }}>Foi detectada estagnação no exercício <Text style={{fontWeight: 'bold'}}>{alert.exerciseName}</Text>.</Text>
                                            <View style={{ backgroundColor: theme.surface, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>SUGESTÃO DA IA:</Text>
                                                <Text style={{ color: theme.text, fontSize: 12, fontStyle: 'italic' }}>"{alert.message}"</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* 🔥 O DASHBOARD DO ALUNO 🔥 */}
                    <Text style={[styles.sectionLabel, { marginTop: 10 }]}>DASHBOARD DO ALUNO</Text>
                    <View style={{ flexDirection: isWebPC ? 'row' : 'column', flexWrap: 'wrap', gap: 15 }}>
                        
                        {/* TREINO ATUAL */}
                        <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={styles.dashCardHeader}>
                                <View style={[styles.iconBoxSmall, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="weight-lifter" size={16} color={theme.accent}/></View>
                                <Text style={[styles.dashCardTitle, { color: theme.text }]}>TREINO ATUAL</Text>
                            </View>
                            {activeWorkouts.length > 0 ? (
                                <View>
                                    <Text style={[styles.dashCardValue, { color: theme.accent }]} numberOfLines={1}>{activeWorkouts[0].name}</Text>
                                    <Text style={styles.dashCardSub}>Início: {activeWorkouts[0].startDate ? formatToBRDate(activeWorkouts[0].startDate) : 'Não definido'}</Text>
                                </View>
                            ) : (
                                <Text style={styles.dashCardSub}>Nenhum treino ativo no momento.</Text>
                            )}
                            <TouchableOpacity style={[styles.dashBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setActiveTab('TREINOS')}>
                                <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>ACESSAR TREINOS</Text>
                            </TouchableOpacity>
                        </View>

                        {/* AVALIAÇÕES E RAIO-X */}
                        <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={styles.dashCardHeader}>
                                <View style={[styles.iconBoxSmall, { backgroundColor: '#34C75922' }]}><MaterialCommunityIcons name="camera-front-variant" size={16} color="#34C759"/></View>
                                <Text style={[styles.dashCardTitle, { color: theme.text }]}>AVALIAÇÕES</Text>
                            </View>
                            <View style={{ gap: 10 }}>
                                <TouchableOpacity style={[styles.dashActionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminStudentCheckins', { alunoId: String(aluno.id), alunoName: String(aluno.name) })}>
                                    <MaterialCommunityIcons name="camera-account" size={16} color="#34C759" />
                                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>Ver Check-ins</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.dashActionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={handleAbrirRaioxCargas}>
                                    <MaterialCommunityIcons name="weight-lifter" size={16} color={theme.accent} />
                                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>Raio-X de Cargas</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* NUTRIÇÃO */}
                        <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={styles.dashCardHeader}>
                                <View style={[styles.iconBoxSmall, { backgroundColor: '#FF3B3022' }]}><MaterialCommunityIcons name="food-apple" size={16} color="#FF3B30"/></View>
                                <Text style={[styles.dashCardTitle, { color: theme.text }]}>NUTRIÇÃO</Text>
                            </View>
                            <Text style={[styles.dashCardValue, { color: theme.text }]}>{isDietTabVisible ? 'Aba Liberada' : 'Aba Oculta'}</Text>
                            <Text style={styles.dashCardSub} numberOfLines={1}>Base: {DIET_OPTIONS.find(o => o.id === dietGoal)?.label || 'Personalizada'}</Text>
                            <TouchableOpacity style={[styles.dashBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setActiveTab('DIETA_IA')}>
                                <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>GERENCIAR DIETA</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );

        case 'TREINOS':
            return (
                <View style={styles.tabContent}>
                    <TouchableOpacity style={[styles.cargasBtn, { backgroundColor: theme.surface, borderColor: theme.accent }]} onPress={handleAbrirRaioxCargas}>
                        <View style={[styles.iconBox, {backgroundColor: theme.accent + '22'}]}><MaterialCommunityIcons name="weight-lifter" size={20} color={theme.accent} /></View>
                        <View style={{flex: 1, marginLeft: 12}}>
                            <Text style={{color: theme.accent, fontWeight: '900', fontSize: 13, letterSpacing: 0.5}}>HISTÓRICO DE CARGAS</Text>
                            <Text style={{color: theme.textSecondary, fontSize: 10, marginTop: 2}}>Veja os pesos salvos pelo aluno nos treinos.</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
                    </TouchableOpacity>

                    <View style={styles.subTabsRow}>
                        <TouchableOpacity style={[styles.subTabBtn, { borderBottomColor: theme.border }, workoutTab === 'active' && { borderBottomColor: theme.accent }]} onPress={() => setWorkoutTab('active')}>
                            <Text style={[styles.subTabText, { color: theme.textSecondary }, workoutTab === 'active' && { color: theme.accent }]}>FICHAS ATIVAS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.subTabBtn, { borderBottomColor: theme.border }, workoutTab === 'archived' && { borderBottomColor: theme.accent }]} onPress={() => setWorkoutTab('archived')}>
                            <Text style={[styles.subTabText, { color: theme.textSecondary }, workoutTab === 'archived' && { color: theme.accent }]}>ARQUIVADAS</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <AdminUserWorkouts theme={theme} userPlan={userPlan} viewMode={workoutTab} loading={loading} activeWorkouts={activeWorkouts} archivedWorkouts={archivedWorkouts} handleNewWorkout={handleNewWorkout} handleEditWorkout={handleEditWorkout} handleToggleArchiveWorkout={handleToggleArchiveWorkout} handleDeleteWorkout={handleDeleteWorkout} hasActiveFicha={hasActiveFicha} fichaDaysElapsed={fichaDaysElapsed} isFichaExpired={userPlan === 'FICHA_8S' && fichaDaysElapsed > 56} fichaDaysLeft={Math.max(0, 56 - fichaDaysElapsed)}/>
                </View>
            );
        
        case 'AVALIACOES':
            return (
                <View style={styles.tabContent}>
                    <AdminUserSystem currentTab="AVALIACOES" theme={theme} navigation={navigation} aluno={freshAluno || aluno} userPlan={userPlan} isActiveUser={isActiveUser} handleToggleStatus={handleToggleStatus} disableCheckIn={disableCheckIn} handleToggleDisableCheckIn={handleToggleDisableCheckIn} nextCheckInDate={nextCheckInDate} handleCheckInDateChange={handleCheckInDateChange} handleSaveCheckInDate={handleSaveCheckInDate} evaluationUrl={evaluationUrl} setEvaluationUrl={setEvaluationUrl} handleSaveEvaluation={handleSaveEvaluation} handleDeleteUser={handleDeleteUser} />
                </View>
            );

        case 'DIETA_IA':
            return (
                <View style={styles.tabContent}>
                    <Text style={[styles.sectionLabel, {color: theme.accent}]}>LABORATÓRIO NUTRICIONAL (IA)</Text>
                    <Text style={[styles.sectionSubDesc, {marginBottom: 15}]}>Gerencie a visibilidade e a montagem do plano alimentar deste aluno.</Text>

                    <View style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 15 }]}>
                        <View style={[styles.iconBox, { backgroundColor: theme.bg }]}><MaterialCommunityIcons name="food-apple" size={24} color={isDietTabVisible ? theme.accent : theme.textSecondary} /></View>
                        <View style={{ flex: 1, marginLeft: 15, paddingRight: 10 }}>
                            <Text style={[styles.accessTitle, { color: theme.text }]}>Liberar Aba "Dieta" no App</Text>
                            <Text style={styles.accessCategory}>Se ativado, a maçã ficará visível no celular do aluno.</Text>
                        </View>
                        <Switch value={isDietTabVisible} onValueChange={handleToggleDietTab} trackColor={{ false: '#333', true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (isDietTabVisible ? '#000' : '#888')} />
                    </View>

                    <TouchableOpacity style={[styles.aiDietBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]} onPress={() => navigation.navigate('AdminDietScreen', { aluno: freshAluno || aluno, alunoId: aluno.id })}>
                        <View style={[styles.iconBox, {backgroundColor: theme.accent + '22'}]}><MaterialCommunityIcons name="view-dashboard-edit-outline" size={22} color={theme.accent} /></View>
                        <View style={{flex: 1, marginLeft: 15}}>
                            <Text style={{color: theme.accent, fontWeight: '900', fontSize: 14, letterSpacing: 0.5}}>ABRIR MESA DE OPERAÇÕES</Text>
                            <Text style={{color: theme.textSecondary, fontSize: 11, marginTop: 2}}>Montar dieta com Tabela TACO e Macros</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
                    </TouchableOpacity>

                    <View style={[styles.premiumCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 15 }]}>
                        <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                            <View style={[styles.iconBox, {backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, width: 36, height: 36, borderRadius: 18}]}><MaterialCommunityIcons name="clipboard-text-outline" size={18} color={theme.textSecondary} /></View>
                            <View style={{flex: 1}}>
                                <Text style={[styles.cardTitle, {color: theme.text}]}>Estratégia Básica (Fallback)</Text>
                                <Text style={{color: theme.textSecondary, fontSize: 11}}>Sugestão genérica em PDF para alunos que não possuem a dieta prescrita na Mesa de Operações.</Text>
                            </View>
                        </View>
                        <View style={{ padding: 20 }}>
                            {DIET_OPTIONS.map(opt => (
                                <TouchableOpacity key={opt.id} style={{flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: dietGoal === opt.id ? theme.accent : theme.border, backgroundColor: dietGoal === opt.id ? theme.accent + '15' : theme.bg, marginBottom: 10}} onPress={() => setDietGoal(opt.id)} disabled={userPlan === 'CHALLENGE_21'} >
                                    <MaterialCommunityIcons name={dietGoal === opt.id ? "radiobox-marked" : "radiobox-blank"} size={20} color={dietGoal === opt.id ? theme.accent : theme.textSecondary} />
                                    <View style={{flex: 1, marginLeft: 10}}>
                                        <Text style={{color: dietGoal === opt.id ? theme.accent : theme.text, fontWeight: 'bold', fontSize: 13}}>{opt.label}</Text>
                                        <Text style={{color: theme.textSecondary, fontSize: 11, marginTop: 2}}>{opt.desc}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {userPlan !== 'CHALLENGE_21' && (
                                <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, width: '100%', marginTop: 10, flexDirection: 'row', gap: 8, height: 48 }]} onPress={handleSaveDietGoal} disabled={savingDiet}>
                                    {savingDiet ? <ActivityIndicator color={theme.text} /> : (<><MaterialCommunityIcons name="content-save" size={18} color={theme.text} /><Text style={{color: theme.text, fontWeight: '900', fontSize: 12, letterSpacing: 0.5}}>SALVAR ESTRATÉGIA BÁSICA</Text></>)}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            );

        case 'ACESSOS':
            return (
                <View style={styles.tabContent}>
                    <Text style={styles.sectionLabel}>ESTEIRA DE PRODUTOS E ACESSOS</Text>
                    <Text style={[styles.sectionSubDesc, {marginBottom: 15}]}>Defina qual plano e quais bônus do PA Flix este aluno comprou.</Text>
                    
                    <View style={styles.plansContainer}>
                        <TouchableOpacity style={[styles.planCard, userPlan === 'ELITE' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('ELITE')}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}><MaterialCommunityIcons name="crown" size={18} color={userPlan === 'ELITE' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'ELITE' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>ELITE (TREINO E DIETA)</Text></View>
                            {userPlan === 'ELITE' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.planCard, userPlan === 'PERFORMANCE' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('PERFORMANCE')}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}><MaterialCommunityIcons name="weight-lifter" size={18} color={userPlan === 'PERFORMANCE' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'PERFORMANCE' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>PERFORMANCE (SÓ TREINO)</Text></View>
                            {userPlan === 'PERFORMANCE' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.planCard, userPlan === 'PREMIUM' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('PREMIUM')}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}><MaterialCommunityIcons name="star-circle" size={18} color={userPlan === 'PREMIUM' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'PREMIUM' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>PREMIUM (ANTIGO)</Text></View>
                            {userPlan === 'PREMIUM' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.planCard, userPlan === 'FICHA_8S' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('FICHA_8S')}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}><MaterialCommunityIcons name="lightning-bolt" size={18} color={userPlan === 'FICHA_8S' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'FICHA_8S' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>FICHA 8 SEMANAS</Text></View>
                            {userPlan === 'FICHA_8S' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.planCard, userPlan === 'LOW_COST' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('LOW_COST')}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}><MaterialCommunityIcons name="rocket-launch" size={18} color={userPlan === 'LOW_COST' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'LOW_COST' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>PLANO BÁSICO</Text></View>
                            {userPlan === 'LOW_COST' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.planCard, userPlan === 'CHALLENGE_21' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('CHALLENGE_21')}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1}}><MaterialCommunityIcons name="fire" size={18} color={userPlan === 'CHALLENGE_21' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'CHALLENGE_21' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>DESAFIO 21 DIAS</Text></View>
                            {userPlan === 'CHALLENGE_21' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{marginLeft: 4}} />}
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PERMISSÕES DE BÔNUS (PA FLIX)</Text>
                    {loadingPaflix ? <ActivityIndicator color={theme.accent} style={{marginTop:20}} /> : (
                        vipContents.length === 0 ? (
                            <View style={[styles.emptyBox, { borderColor: theme.border }]}><MaterialCommunityIcons name="lock-outline" size={40} color={theme.textSecondary} /><Text style={styles.emptyText}>Nenhum conteúdo VIP cadastrado.</Text></View>
                        ) : (
                            vipContents.map(content => {
                                const hasAccess = userAccess.includes(content.id);
                                const iconName = content.type === 'ebook' ? 'book-open-variant' : (content.type === 'audio' ? 'headphones' : 'video');
                                return (
                                    <View key={content.id} style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <View style={[styles.iconBox, { backgroundColor: theme.bg }]}><MaterialCommunityIcons name={iconName} size={24} color={hasAccess ? theme.accent : theme.textSecondary} /></View>
                                        <View style={{ flex: 1, marginLeft: 15, paddingRight: 10 }}><Text style={[styles.accessTitle, { color: theme.text }]}>{content.title}</Text><Text style={styles.accessCategory}>{content.category}</Text></View>
                                        <Switch value={hasAccess} onValueChange={() => handleToggleAccess(content.id, hasAccess)} trackColor={{ false: '#333', true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (hasAccess ? '#000' : '#888')} />
                                    </View>
                                )
                            })
                        )
                    )}
                </View>
            );

        case 'SISTEMA':
            return (
                <View style={styles.tabContent}>
                    <AdminUserSystem currentTab="SISTEMA" theme={theme} navigation={navigation} aluno={freshAluno || aluno} userPlan={userPlan} isActiveUser={isActiveUser} handleToggleStatus={handleToggleStatus} disableCheckIn={disableCheckIn} handleToggleDisableCheckIn={handleToggleDisableCheckIn} nextCheckInDate={nextCheckInDate} handleCheckInDateChange={handleCheckInDateChange} handleSaveCheckInDate={handleSaveCheckInDate} evaluationUrl={evaluationUrl} setEvaluationUrl={setEvaluationUrl} handleSaveEvaluation={handleSaveEvaluation} handleDeleteUser={handleDeleteUser} />
                </View>
            );
        default: return null;
    }
  };

  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  if (isWebPC) {
      return (
          <View style={{ flex: 1, flexDirection: 'row', backgroundColor: webOuterBg, width: '100%', height: '100vh', overflow: 'hidden' }}>
              
              <View style={{ width: 280, backgroundColor: theme.surface, borderRightWidth: 1, borderColor: theme.border, padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40, marginTop: 10 }}>
                      <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.text}/>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text }}>ALUNO ELITE</Text>
                  </View>

                  <View style={{ gap: 10 }}>
                      {TABS.map(tab => {
                          const isActive = activeTab === tab;
                          const icon = tab === 'RESUMO' ? 'view-dashboard' : tab === 'TREINOS' ? 'weight-lifter' : tab === 'AVALIACOES' ? 'camera-front-variant' : tab === 'DIETA_IA' ? 'food-apple' : tab === 'ACESSOS' ? 'key-star' : 'cog';
                          const label = tab === 'RESUMO' ? 'Visão Geral' : tab === 'TREINOS' ? 'Treinos' : tab === 'AVALIACOES' ? 'Avaliações' : tab === 'DIETA_IA' ? 'Nutrição & IA' : tab === 'ACESSOS' ? 'Planos e Bônus' : 'Sistema & Risco';
                          
                          return (
                              <TouchableOpacity 
                                  key={tab} 
                                  style={[styles.sidebarBtn, isActive && { backgroundColor: theme.accent + '22', borderColor: theme.accent, borderWidth: 1 }]} 
                                  onPress={() => setActiveTab(tab)}
                              >
                                  <MaterialCommunityIcons name={icon} size={20} color={isActive ? theme.accent : theme.textSecondary} />
                                  <Text style={[styles.sidebarBtnText, { color: isActive ? theme.accent : theme.textSecondary }]}>{label}</Text>
                              </TouchableOpacity>
                          );
                      })}
                  </View>
              </View>

              <View style={{ flex: 1, backgroundColor: theme.bg }}>
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 40, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                      <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center' }}>
                          {renderContent()}
                      </View>
                  </ScrollView>
              </View>

              <RaioxCargasModal visible={isCargasModalVisible} onClose={() => setIsCargasModalVisible(false)} historicoDeCargasList={historicoDeCargasList} theme={theme} />
          </View>
      );
  }

  const RootComponent = Platform.OS === 'web' ? View : SafeAreaView;
  
  return (
    <RootComponent style={{ height: Platform.OS === 'web' ? '100vh' : '100%', width: '100%', backgroundColor: theme.bg }}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}><Text style={[styles.headerTitle, { color: theme.text }]}>GERENCIAR ALUNO</Text></View>
            <TouchableOpacity onPress={fetchAllData} style={{ padding: 8 }}><MaterialCommunityIcons name="refresh" size={24} color={theme.accent}/></TouchableOpacity>
        </View>

        <View style={{ borderBottomWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 15, gap: 15 }}>
                {TABS.map(tab => {
                    const isActive = activeTab === tab;
                    const label = tab === 'RESUMO' ? 'VISÃO GERAL' : tab === 'TREINOS' ? 'TREINOS' : tab === 'AVALIACOES' ? 'AVALIAÇÕES' : tab === 'DIETA_IA' ? 'NUTRIÇÃO & IA' : tab === 'ACESSOS' ? 'PLANOS E BÔNUS' : 'SISTEMA & RISCO';
                    return (
                        <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ paddingBottom: 5, borderBottomWidth: isActive ? 2 : 0, borderBottomColor: theme.accent }}>
                            <Text style={{ color: isActive ? theme.accent : theme.textSecondary, fontWeight: 'bold', fontSize: 12 }}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{padding: 20, paddingBottom: 150}} showsVerticalScrollIndicator={false}>
            {renderContent()}
        </ScrollView>
        <RaioxCargasModal visible={isCargasModalVisible} onClose={() => setIsCargasModalVisible(false)} historicoDeCargasList={historicoDeCargasList} theme={theme} />
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
  profileInfo: { flex: 1 }, profileName: { fontSize: 20, fontWeight: '900' }, profileEmail: { color: '#888', fontSize: 12, marginTop: 2 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },

  tabContent: { width: '100%', paddingBottom: 20 },
  subTabsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  subTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
  subTabText: { fontWeight: 'bold', fontSize: 11 },

  sectionLabel: { color:'#888', fontWeight:'900', marginBottom:15, fontSize:12, letterSpacing:1 },
  sectionSubDesc: { color: '#888', fontSize: 11, marginBottom: 15 },
  
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  iconBoxSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  aiDietBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 15 },
  cargasBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },

  dashCard: { flexGrow: 1, flexBasis: '48%', minWidth: 280, padding: 20, borderRadius: 16, borderWidth: 1, justifyContent: 'space-between' },
  dashCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  dashCardTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  dashCardValue: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  dashCardSub: { color: '#888', fontSize: 11, fontWeight: 'bold', marginBottom: 15 },
  dashBtn: { padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', marginTop: 'auto' },
  dashActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 10 },

  plansContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  planCard: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontWeight: '900', fontSize: 10, letterSpacing: 0.5, flexShrink: 1 },
  
  accessCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  accessTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  accessCategory: { fontSize: 10, color: '#888', fontWeight: 'bold' },

  premiumCard: { borderRadius: 20, marginBottom: 20, borderWidth: 1, overflow: 'hidden', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15, borderBottomWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
  saveBtnLg: { borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  sidebarBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  sidebarBtnText: { fontSize: 14, fontWeight: 'bold' }
});