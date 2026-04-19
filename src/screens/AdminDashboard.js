// src/screens/AdminDashboard.js
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, 
  TextInput, StatusBar, RefreshControl, Modal, ScrollView, Alert, Platform, Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import SendNoticeModal from '../components/SendNoticeModal';
import AdminInviteModal from '../components/AdminInviteModal'; 

import { getExpirationStatus, getCheckinStatus } from '../utils/adminHelpers';
import AdminStudentCard from '../components/Admin/AdminStudentCard';
import AdminCheckinModal from '../components/Admin/AdminCheckinModal';
import DisparoNPSModal from '../components/Admin/DisparoNPSModal';
import AdminSurveyCard from '../components/Admin/AdminSurveyCard'; 

// 🔥 CONSTANTE PARA O ID DA ADRI
const ADRI_COACH_ID = 'adri_coach_id_placeholder'; 

export default function AdminDashboard({ navigation }) {
  const { theme, changeTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('ALUNOS'); 
  const [alunosAtivos, setAlunosAtivos] = useState([]);
  const [alunosInativos, setAlunosInativos] = useState([]);
  const [subTabAlunos, setSubTabAlunos] = useState('ATIVOS'); 
  
  // 🔥 FILTRO DE EQUIPE
  const [coachFilter, setCoachFilter] = useState('PAULO'); 

  const [subTabCheckins, setSubTabCheckins] = useState('AVALIACOES'); 
  const [dietFeedbacks, setDietFeedbacks] = useState([]);
  const [surveys, setSurveys] = useState([]); 
  const [subTabGestao, setSubTabGestao] = useState('FERRAMENTAS'); 

  const [statusFilter, setStatusFilter] = useState('TODOS'); 
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [feed, setFeed] = useState([]); 
  const [checkins, setCheckins] = useState([]);
  const [visibleCount, setVisibleCount] = useState(15); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  const [adminEmail, setAdminEmail] = useState('');
  const [adminId, setAdminId] = useState('');

  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [isResolving, setIsResolving] = useState(false); 

  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isNpsModalOpen, setIsNpsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('verde');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  const isFirstLoadRef = useRef(true); // Ref para controlar a aba padrão na hora do login

  const filterOptions = [
    { id: 'TODOS', label: 'TODOS OS ALUNOS', icon: 'account-group', color: theme.text },
    { id: 'PENDENTES', label: 'AVALIAÇÃO PENDENTE', icon: 'alert-circle', color: '#FF3B30' },
    { id: 'ATRASADOS', label: 'ATRASADOS (TREINO/FOTO)', icon: 'alert-circle', color: '#FF3B30' },
    { id: 'ALERTA', label: 'ALERTA (VENCE EM 7D)', icon: 'clock-fast', color: '#FFCC00' },
    { id: 'OK', label: 'NO PRAZO', icon: 'check-circle', color: '#34C759' },
    { id: 'SEM_TREINO', label: 'SEM TREINO', icon: 'calendar-blank', color: theme.textSecondary },
    { id: 'PLAN_PREMIUM', label: 'SÓ PREMIUM', icon: 'crown', color: '#FFCC00' },
    { id: 'PLAN_FICHA_8S', label: 'SÓ FICHA 8 SEMANAS', icon: 'lightning-bolt', color: '#AF52DE' },
    { id: 'PLAN_LOW_COST', label: 'SÓ LOW COST', icon: 'rocket-launch', color: '#32ADE6' },
    { id: 'PLAN_CHALLENGE_21', label: 'SÓ DESAFIO 21D', icon: 'fire', color: '#FF9500' }
  ];

  useFocusEffect(useCallback(() => { fetchData(false); }, []));
  useEffect(() => { setVisibleCount(15); }, [subTabAlunos, search, statusFilter, coachFilter]);

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else {
          const cachedData = await AsyncStorage.getItem('@dashboard_cache');
          if (cachedData) {
              const { cacheAtivos, cacheInativos, cacheFeed, cacheCheckins, cacheFeedbacks } = JSON.parse(cachedData);
              if (cacheAtivos) setAlunosAtivos(cacheAtivos);
              if (cacheInativos) setAlunosInativos(cacheInativos);
              if (cacheFeed) setFeed(cacheFeed);
              if (cacheCheckins) setCheckins(cacheCheckins);
              if (cacheFeedbacks) setDietFeedbacks(cacheFeedbacks);
              setLoading(false); 
          } else setLoading(true);
      }
      
      const t = Date.now();
      const userJson = await AsyncStorage.getItem('user');
      const savedThemeObj = await AsyncStorage.getItem('app_theme');
      
      let localAdminId = '';
      if (userJson) {
          const userObj = JSON.parse(userJson);
          const email = userObj.email.toLowerCase();
          setAdminEmail(email); 
          setAdminId(userObj.id); 
          localAdminId = userObj.id; 

          // 🔥 DEFINE A ABA PADRÃO NA ENTRADA COM BASE EM QUEM LOGOU
          if (isFirstLoadRef.current) {
              setCoachFilter(email === 'adri.personal@hotmail.com' ? 'ADRI' : 'PAULO');
              isFirstLoadRef.current = false;
          }
      }

      if (savedThemeObj) {
          const parsedTheme = JSON.parse(savedThemeObj);
          if (parsedTheme.accent === '#FF2D55') setSelectedColor('rosa');
          else if (parsedTheme.accent === '#AF52DE') setSelectedColor('roxo');
          else if (parsedTheme.accent === '#007AFF') setSelectedColor('azul');
          else if (parsedTheme.accent === '#FF3B30') setSelectedColor('vermelho');
          else setSelectedColor('verde');
      }

      fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${localAdminId}&t=${t}`)
        .then(res => res.json())
        .then(async data => {
            const rawAtivos = data.activeUsers || data.users || [];
            const rawInativos = data.inactiveUsers || [];
            
            const processadosAtivos = rawAtivos.map(u => ({ ...u, isMyNutritionClient: u.nutritionistId === localAdminId }));
            const processadosInativos = rawInativos.map(u => ({ ...u, isMyNutritionClient: u.nutritionistId === localAdminId }));

            setAlunosAtivos(processadosAtivos); 
            setAlunosInativos(processadosInativos);
            if (data.recentLogs) setFeed(data.recentLogs);

            const currentCache = JSON.parse(await AsyncStorage.getItem('@dashboard_cache') || '{}');
            await AsyncStorage.setItem('@dashboard_cache', JSON.stringify({
                ...currentCache, cacheAtivos: processadosAtivos, cacheInativos: processadosInativos, cacheFeed: data.recentLogs || []
            }));
            if (data.exercises) await AsyncStorage.setItem('@global_exercises', JSON.stringify(data.exercises));
        })
        .catch(e => console.log(e))
        .finally(() => { setLoading(false); setRefreshing(false); });

      fetch(`https://fitos-final.onrender.com/api/checkin?adminId=${localAdminId}&t=${t}`)
        .then(res => res.json())
        .then(async dataCheckins => {
            if (Array.isArray(dataCheckins)) {
                setCheckins(dataCheckins);
                const currentCache = JSON.parse(await AsyncStorage.getItem('@dashboard_cache') || '{}');
                await AsyncStorage.setItem('@dashboard_cache', JSON.stringify({ ...currentCache, cacheCheckins: dataCheckins }));
            }
        }).catch(e => console.log(e));

      fetch(`https://fitos-final.onrender.com/api/admin/diet-feedbacks?t=${t}`)
        .then(res => res.json())
        .then(async dataFeedbacks => {
            if (Array.isArray(dataFeedbacks)) {
                setDietFeedbacks(dataFeedbacks);
                const currentCache = JSON.parse(await AsyncStorage.getItem('@dashboard_cache') || '{}');
                await AsyncStorage.setItem('@dashboard_cache', JSON.stringify({ ...currentCache, cacheFeedbacks: dataFeedbacks }));
            }
        }).catch(e => console.log(e));

      fetch(`https://fitos-final.onrender.com/api/admin/surveys?t=${t}`)
        .then(res => res.json())
        .then(async dataSurveys => {
            if (Array.isArray(dataSurveys)) setSurveys(dataSurveys);
        }).catch(e => console.log("Erro NPS:", e));

    } catch (e) { setLoading(false); setRefreshing(false); }
  };

  const handleMarkFeedbackRead = async (id) => {
      try {
          await fetch('https://fitos-final.onrender.com/api/admin/diet-feedbacks', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, read: true })
          });
          setDietFeedbacks(prev => prev.map(f => f.id === id ? { ...f, read: true } : f));
      } catch (e) { console.log(e); }
  };

  const handleMarkSurveyRead = async (id) => {
      try {
          await fetch('https://fitos-final.onrender.com/api/admin/surveys', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
          });
          setSurveys(prev => prev.map(s => s.id === id ? { ...s, readByAdmin: true } : s));
      } catch (e) { console.log(e); }
  };

  const handleDeleteFeedback = (id) => {
      Alert.alert("Excluir", "Deseja remover este aviso permanentemente?", [
          { text: "Cancelar" },
          { text: "Sim", style: 'destructive', onPress: async () => {
              try {
                  await fetch(`https://fitos-final.onrender.com/api/admin/diet-feedbacks?id=${id}`, { method: 'DELETE' });
                  setDietFeedbacks(prev => prev.filter(f => f.id !== id));
              } catch (e) { console.log(e); }
          }}
      ]);
  };

  // 🔥 LÓGICA DE IDENTIFICAÇÃO E HIERARQUIA VISUAL (Quem é o dono da conta logada?)
  const isAdriLogged = adminEmail.toLowerCase() === 'adri.personal@hotmail.com';
  
  const ownerKey = isAdriLogged ? 'ADRI' : 'PAULO';
  const partnerKey = isAdriLogged ? 'PAULO' : 'ADRI';
  const ownerColor = isAdriLogged ? '#AF52DE' : theme.accent;
  const partnerColor = isAdriLogged ? theme.accent : '#AF52DE';
  const ownerTextColor = isAdriLogged ? '#FFF' : '#000';
  const partnerTextColor = isAdriLogged ? '#000' : '#FFF';

  const userCoachMap = useMemo(() => {
      const map = {};
      [...alunosAtivos, ...alunosInativos].forEach(u => {
          map[u.id] = u.coachId;
      });
      return map;
  }, [alunosAtivos, alunosInativos]);

  const getLogCoach = useCallback((item) => {
      let uId = item.id; 
      if (item.userId) uId = item.userId;
      else if (item.user && item.user.id) uId = item.user.id;

      const cIdMapped = userCoachMap[uId] !== undefined ? userCoachMap[uId] : item.coachId;

      if (isAdriLogged) {
          return cIdMapped === adminId ? 'ADRI' : 'PAULO';
      } else {
          return (!cIdMapped || cIdMapped === adminId) ? 'PAULO' : 'ADRI';
      }
  }, [userCoachMap, adminId, isAdriLogged]);

  // 1. FILTRANDO LISTA DE ALUNOS
  const displayList = useMemo(() => {
      let list = subTabAlunos === 'ATIVOS' ? alunosAtivos : alunosInativos;
      if (search) list = list.filter(a => (a.name || '').toLowerCase().includes(search.toLowerCase()));
      
      list = list.filter(a => getLogCoach(a) === coachFilter); 
      
      if (statusFilter !== 'TODOS') {
          list = list.filter(a => {
              if (statusFilter.startsWith('PLAN_')) {
                  const targetPlan = statusFilter.replace('PLAN_', '');
                  const currentPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(a.plan) ? a.plan : 'PREMIUM';
                  return currentPlan === targetPlan;
              }
              if (statusFilter === 'PENDENTES') return (a._count?.checkIns || 0) > 0;
              const activeWorkout = (a.workouts && a.workouts.length > 0) ? a.workouts[0] : null;
              
              if (statusFilter === 'ATRASADOS') return getCheckinStatus(a) || (getExpirationStatus(activeWorkout)?.cat === 'ATRASADOS');
              if (!activeWorkout) return statusFilter === 'SEM_TREINO';
              
              return getExpirationStatus(activeWorkout)?.cat === statusFilter;
          });
      }
      return list;
  }, [alunosAtivos, alunosInativos, subTabAlunos, search, statusFilter, coachFilter, getLogCoach]);

  // 2. FILTRANDO FEED, DIETAS E NPS
  const filteredFeed = useMemo(() => feed.filter(item => getLogCoach(item) === coachFilter), [feed, coachFilter, getLogCoach]);
  const filteredDiet = useMemo(() => dietFeedbacks.filter(item => getLogCoach(item) === coachFilter), [dietFeedbacks, coachFilter, getLogCoach]);
  const filteredSurveys = useMemo(() => surveys.filter(item => getLogCoach(item) === coachFilter), [surveys, coachFilter, getLogCoach]);

  // 3. FILTRANDO CHECKINS COM TRAVA DE PRIVACIDADE MÁXIMA
  const filteredCheckins = useMemo(() => checkins.filter(item => {
      const coach = getLogCoach(item);
      if (coach !== coachFilter) return false;
      if (coach === 'ADRI' && !isAdriLogged) return false; 
      if (coach === 'PAULO' && isAdriLogged) return false; 
      return true;
  }), [checkins, coachFilter, getLogCoach, isAdriLogged]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['user', 'role', '@dashboard_cache', '@global_exercises']);
    if (Platform.OS === 'web') window.location.replace('/');
    else navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleDeleteLog = (logId) => {
      Alert.alert("Remover", "Deseja ocultar este item do feed?", [
          { text: "Cancelar" }, { text: "Sim", style: 'destructive', onPress: () => setFeed(current => current.filter(item => item.id !== logId)) }
      ]);
  };

  const toggleDarkMode = (newValue) => {
      if (newValue) { setSelectedColor('verde'); changeTheme(true, 'verde'); } 
      else changeTheme(false, selectedColor);
  };

  const selectThemeColor = (colorKey) => {
      setSelectedColor(colorKey); changeTheme(theme.isDark, colorKey);
  };

  const switchSubTab = (tab) => { setSubTabAlunos(tab); setSearch(''); setVisibleCount(15); };

  const handleResolveCheckin = () => {
      const confirmAction = async () => {
          setIsResolving(true);
          try {
              const res = await fetch('https://fitos-final.onrender.com/api/checkin/evaluate', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      checkinId: selectedCheckin.id,
                      coachFeedback: "*Avaliação Finalizada!* 🎯\n\nSeu laudo completo foi gerado com sucesso. Vá até a sua tela de **Evolução** no aplicativo para conferir a análise e o seu planejamento.",
                      silent: true
                  })
              });
              if (res.ok) {
                  setCheckinModalVisible(false); fetchData(true); 
                  if (Platform.OS === 'web') window.alert("Baixa realizada com sucesso!");
              } else {
                  if (Platform.OS === 'web') window.alert("Erro ao dar baixa."); else Alert.alert("Erro", "Não foi possível atualizar o check-in.");
              }
          } catch (e) {
              if (Platform.OS === 'web') window.alert("Erro de conexão."); else Alert.alert("Erro", "Erro de conexão.");
          } finally { setIsResolving(false); }
      };

      if (Platform.OS === 'web') {
          if (window.confirm("Marcar como 'Avaliado' para remover o aviso vermelho?")) confirmAction();
      } else {
          Alert.alert("Remover Alerta", "Marcar como 'Avaliado' para remover o aviso vermelho?", [ { text: "Cancelar", style: "cancel" }, { text: "Sim", onPress: confirmAction } ]);
      }
  };

  const renderDietFeedbackItem = ({ item }) => (
      <View style={[styles.feedCard, { backgroundColor: theme.surface, borderColor: item.read ? theme.border : theme.accent, opacity: item.read ? 0.6 : 1, flexDirection: 'column', alignItems: 'stretch' }]}>
          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems: 'center', width: '100%', marginBottom: 12}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <View style={[styles.iconBox, { backgroundColor: item.read ? theme.bg : theme.accent + '22', marginRight: 0 }]}><MaterialCommunityIcons name="food-apple" size={20} color={item.read ? theme.textSecondary : theme.accent} /></View>
                  <View>
                      <Text style={[styles.feedUser, { color: theme.text }]}>{item.user?.name || "Aluno"}</Text>
                      <Text style={styles.feedTime}>{new Date(item.createdAt).toLocaleDateString('pt-BR')} às {new Date(item.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</Text>
                  </View>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  {!item.read && ( <TouchableOpacity onPress={() => handleMarkFeedbackRead(item.id)} style={{padding: 8, backgroundColor: theme.accent, borderRadius: 8}}><MaterialCommunityIcons name="check-bold" size={16} color="#000" /></TouchableOpacity> )}
                  <TouchableOpacity onPress={() => handleDeleteFeedback(item.id)} style={{padding: 8, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border}}><MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.textSecondary} /></TouchableOpacity>
              </View>
          </View>

          <View style={{backgroundColor: theme.bg, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border, gap: 12}}>
              <View><Text style={{color: theme.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 2}}>1. SACIEDADE</Text><Text style={{color: theme.text, fontSize: 13, fontWeight: 'bold'}}>{item.satiety || 'Não informou'}</Text></View>
              {item.difficulty ? <View><Text style={{color: theme.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 2}}>2. DIFICULDADE NA ROTINA</Text><Text style={{color: theme.text, fontSize: 13, fontStyle: 'italic'}}>"{item.difficulty}"</Text></View> : null}
              {item.requestedChanges ? <View><Text style={{color: theme.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 2}}>3. O QUE QUER MUDAR</Text><Text style={{color: theme.text, fontSize: 13, fontStyle: 'italic'}}>"{item.requestedChanges}"</Text></View> : null}
          </View>
      </View>
  );

  const renderCheckinItem = ({ item }) => (
      <TouchableOpacity style={[styles.feedCard, { backgroundColor: theme.surface, borderColor: item.coachFeedback ? theme.border : '#FF3B30' }]} onPress={() => { setSelectedCheckin(item); setCheckinModalVisible(true); }}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 173, 230, 0.15)' }]}><MaterialCommunityIcons name="camera-account" size={20} color="#32ADE6" /></View>
          <View style={{flex: 1}}>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}><Text style={[styles.feedUser, { color: theme.text }]}>{item.user?.name || "Aluno"}</Text><Text style={styles.feedTime}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text></View>
              <Text style={styles.feedAction}>Check-in: <Text style={{color: theme.text, fontWeight:'bold'}}>{item.weight ? `${item.weight}kg` : 'Fotos'}</Text></Text>
              {item.feedback ? <Text numberOfLines={1} style={styles.checkinFeedback}>"{item.feedback}"</Text> : null}
              {!item.coachFeedback && <View style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#FF3B3022', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}><Text style={{ color: '#FF3B30', fontSize: 9, fontWeight: 'bold' }}>AGUARDANDO AVALIAÇÃO</Text></View>}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
  );

  const renderFeedItem = ({ item }) => {
      const date = new Date(item.date);
      const dayString = date.getDate() === new Date().getDate() ? `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : date.toLocaleDateString('pt-BR');
      return (
        <View style={[styles.feedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="check-bold" size={20} color={theme.accent} /></View>
            <View style={{flex: 1}}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}><Text style={[styles.feedUser, { color: theme.text }]}>{item.user?.name || "Aluno"}</Text><Text style={styles.feedTime}>{dayString}</Text></View>
                <Text style={styles.feedAction}>Concluiu <Text style={{color: theme.accent, fontWeight:'bold'}}>{item.workoutName ? item.workoutName.toUpperCase() : "TREINO"}</Text></Text>
                {item.progressions > 0 && <View style={[styles.progBadge, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="fire" size={12} color={theme.isDark ? '#000' : '#FFF'} /><Text style={[styles.progText, { color: theme.isDark ? '#000' : '#FFF' }]}>{item.progressions} PRs!</Text></View>}
            </View>
            <TouchableOpacity onPress={() => handleDeleteLog(item.id)} style={{padding:5, marginLeft:5}}><MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} /></TouchableOpacity>
        </View>
      );
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg };
  
  const unreadFeedbacksCount = filteredDiet.filter(f => !f.read).length;
  const unreadSurveysCount = filteredSurveys.filter(s => !s.readByAdmin).length;
  const totalAlerts = filteredCheckins.length + unreadFeedbacksCount + unreadSurveysCount;

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          <View style={styles.header}>
            <View>
                <Text style={[styles.title, { color: theme.text }]}>PAULO ADRIANO <Text style={{color: theme.accent}}>TEAM</Text></Text>
                <Text style={styles.subtitle}>PAINEL ADMINISTRATIVO</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => fetchData(true)} style={[styles.logoutBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}><MaterialCommunityIcons name="refresh" size={20} color={theme.accent} /></TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}><MaterialCommunityIcons name="logout" size={20} color="#FF4444" /></TouchableOpacity>
            </View>
          </View>

          <View style={styles.tabs}>
            {['ALUNOS', 'CHECKINS', 'FEED', 'GESTAO'].map(tab => (
                <TouchableOpacity key={tab} style={[styles.tab, activeTab===tab && { borderBottomWidth: 3, borderBottomColor: theme.accent }]} onPress={()=>setActiveTab(tab)}>
                    <Text style={[styles.tabText, activeTab===tab && { color: theme.text }]}>{tab === 'GESTAO' ? 'SISTEMA' : tab === 'CHECKINS' ? 'AVALIAÇÕES' : tab}</Text>
                    {tab === 'CHECKINS' && totalAlerts > 0 && <View style={styles.badgeCount}><Text style={styles.badgeText}>{totalAlerts}</Text></View>}
                </TouchableOpacity>
            ))}
          </View>

          {/* 🔥 NOVO FILTRO GLOBAL: DINÂMICO E HIERÁRQUICO 🔥 */}
          {activeTab !== 'GESTAO' && (
              <View style={styles.coachFilterContainer}>
                  {/* Botão Principal: Quem está logado */}
                  <TouchableOpacity 
                      style={[styles.coachFilterBtn, coachFilter === ownerKey ? { backgroundColor: ownerColor, borderColor: ownerColor } : { backgroundColor: theme.surface, borderColor: theme.border }]} 
                      onPress={() => setCoachFilter(ownerKey)}
                  >
                      <Text style={[styles.coachFilterText, coachFilter === ownerKey ? { color: ownerTextColor } : { color: theme.textSecondary }]}>MEUS ALUNOS</Text>
                  </TouchableOpacity>

                  {/* Botão Secundário: O Parceiro da Equipe */}
                  <TouchableOpacity 
                      style={[styles.coachFilterBtn, coachFilter === partnerKey ? { backgroundColor: partnerColor, borderColor: partnerColor } : { backgroundColor: theme.surface, borderColor: theme.border }]} 
                      onPress={() => setCoachFilter(partnerKey)}
                  >
                      <Text style={[styles.coachFilterText, coachFilter === partnerKey ? { color: partnerTextColor } : { color: theme.textSecondary }]}>ALUNOS {partnerKey}</Text>
                  </TouchableOpacity>
              </View>
          )}

          <View style={{ flex: 1 }}>
            {activeTab === 'ALUNOS' && (
                <>
                    <TouchableOpacity style={[styles.inviteBtn, { backgroundColor: theme.accent }]} onPress={() => setInviteModalVisible(true)}>
                        <MaterialCommunityIcons name="star-shooting" size={22} color={theme.isDark ? '#000' : '#FFF'} />
                        <Text style={[styles.inviteBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>GERAR LINK (CADASTRO E PROPOSTA)</Text>
                    </TouchableOpacity>

                    <TextInput style={[styles.searchBar, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, borderWidth: 1 }]} placeholder="Buscar aluno..." placeholderTextColor={theme.textSecondary} value={search} onChangeText={setSearch} />

                    <TouchableOpacity style={[styles.filterSelector, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setFilterModalVisible(true)}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}><MaterialCommunityIcons name="filter-variant" size={20} color={theme.accent} /><Text style={[styles.filterSelectorVal, { color: theme.text }]}>FILTRAR STATUS: {filterOptions.find(f => f.id === statusFilter)?.label}</Text></View>
                        <MaterialCommunityIcons name="chevron-down" size={22} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.subTabsContainer}>
                        <TouchableOpacity style={[styles.subTab, subTabAlunos === 'ATIVOS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => switchSubTab('ATIVOS')}><Text style={[styles.subTabText, { color: subTabAlunos === 'ATIVOS' ? theme.text : theme.textSecondary }]}>ATIVOS ({displayList.length})</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.subTab, subTabAlunos === 'INATIVOS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => switchSubTab('INATIVOS')}><Text style={[styles.subTabText, { color: subTabAlunos === 'INATIVOS' ? '#FF4444' : theme.textSecondary }]}>INATIVOS</Text></TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={{marginTop: 50}}><ActivityIndicator size="large" color={theme.accent} /></View>
                    ) : (
                        <FlatList 
                            data={displayList.slice(0, visibleCount)} keyExtractor={item => item.id}
                            contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.accent} />}
                            renderItem={({item}) => <AdminStudentCard item={item} theme={theme} navigation={navigation} isHeadCoach={true} />}
                            ListEmptyComponent={<Text style={styles.empty}>Nenhum aluno encontrado neste filtro.</Text>}
                            onEndReached={() => setVisibleCount(prev => prev + 15)} onEndReachedThreshold={0.5} initialNumToRender={15}
                        />
                    )}
                </>
            )}

            {activeTab === 'CHECKINS' && (
                <View style={{ flex: 1 }}>
                    <View style={styles.subTabsContainer}>
                        <TouchableOpacity style={[styles.subTab, subTabCheckins === 'AVALIACOES' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabCheckins('AVALIACOES')}><Text style={[styles.subTabText, { color: subTabCheckins === 'AVALIACOES' ? theme.text : theme.textSecondary }]}>FOTOS ({filteredCheckins.length})</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.subTab, subTabCheckins === 'AJUSTES' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabCheckins('AJUSTES')}><Text style={[styles.subTabText, { color: subTabCheckins === 'AJUSTES' ? theme.text : theme.textSecondary }]}>DIETA ({unreadFeedbacksCount})</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.subTab, subTabCheckins === 'NPS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabCheckins('NPS')}><Text style={[styles.subTabText, { color: subTabCheckins === 'NPS' ? theme.text : theme.textSecondary }]}>NPS ({unreadSurveysCount})</Text></TouchableOpacity>
                    </View>

                    {subTabCheckins === 'AVALIACOES' && (
                        (coachFilter === 'ADRI' && !isAdriLogged) || (coachFilter === 'PAULO' && isAdriLogged) ? (
                            <View style={{ marginTop: 50, alignItems: 'center', paddingHorizontal: 40 }}>
                                <MaterialCommunityIcons name="lock" size={48} color={theme.border} />
                                <Text style={[styles.empty, { marginTop: 15 }]}>Fotos restritas apenas para a Coach responsável pelo plano.</Text>
                            </View>
                        ) : (
                            <FlatList data={filteredCheckins} keyExtractor={item => item.id} contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.accent} />} renderItem={renderCheckinItem} ListEmptyComponent={<Text style={styles.empty}>Nenhum check-in de avaliação pendente.</Text>} />
                        )
                    )}
                    {subTabCheckins === 'AJUSTES' && (
                        <FlatList data={filteredDiet} keyExtractor={item => item.id} contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.accent} />} renderItem={renderDietFeedbackItem} ListEmptyComponent={<Text style={styles.empty}>Nenhuma solicitação de ajuste de dieta.</Text>} />
                    )}
                    {subTabCheckins === 'NPS' && (
                        <FlatList 
                            data={filteredSurveys} keyExtractor={item => item.id} 
                            contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} 
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.accent} />} 
                            renderItem={({item}) => <AdminSurveyCard item={item} theme={theme} onMarkRead={handleMarkSurveyRead} />} 
                            ListEmptyComponent={<Text style={styles.empty}>Nenhuma pesquisa recebida.</Text>} 
                        />
                    )}
                </View>
            )}

            {activeTab === 'FEED' && (
                <FlatList data={filteredFeed} keyExtractor={item => item.id} contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.accent} />} renderItem={renderFeedItem} ListEmptyComponent={<Text style={styles.empty}>Nada recente.</Text>} />
            )}

            {activeTab === 'GESTAO' && (
                <View style={{ flex: 1 }}>
                    <View style={styles.subTabsContainer}>
                        <TouchableOpacity style={[styles.subTab, subTabGestao === 'FERRAMENTAS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabGestao('FERRAMENTAS')}><Text style={[styles.subTabText, { color: subTabGestao === 'FERRAMENTAS' ? theme.text : theme.textSecondary }]}>TREINO E DIETA</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.subTab, subTabGestao === 'CONFIG' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabGestao('CONFIG')}><Text style={[styles.subTabText, { color: subTabGestao === 'CONFIG' ? theme.text : theme.textSecondary }]}>SISTEMA E AVISOS</Text></TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 150, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
                        <View style={styles.gridGestao}>
                            {subTabGestao === 'FERRAMENTAS' && (
                                <>
                                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('BibliotecaAdmin')}><View style={[styles.iconCircle, {backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border}]}><MaterialCommunityIcons name="database-edit" size={32} color={theme.accent} /></View><Text style={[styles.bigCardTitle, { color: theme.text }]}>EXERCÍCIOS</Text><Text style={styles.bigCardDesc}>Gerencie a biblioteca.</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('GerenciarTemplates')}><View style={[styles.iconCircle, {backgroundColor: theme.accent}]}><MaterialCommunityIcons name="folder-multiple" size={32} color={theme.isDark ? '#000' : '#FFF'} /></View><Text style={[styles.bigCardTitle, { color: theme.text }]}>MEUS TEMPLATES</Text><Text style={styles.bigCardDesc}>Crie fichas de treino padrão.</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminDietLibraryScreen')}><View style={[styles.iconCircle, {backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border}]}><MaterialCommunityIcons name="food-apple" size={32} color={theme.accent} /></View><Text style={[styles.bigCardTitle, { color: theme.text }]}>COFRE DE DIETAS</Text><Text style={styles.bigCardDesc}>Gerencie templates alimentares.</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#4DE38F', borderWidth: 2 }]} onPress={() => navigation.navigate('AdminIALabScreen')}><View style={[styles.iconCircle, {backgroundColor: '#4DE38F22'}]}><MaterialCommunityIcons name="brain" size={32} color="#4DE38F" /></View><Text style={[styles.bigCardTitle, { color: '#4DE38F' }]}>LABORATÓRIO IA</Text><Text style={styles.bigCardDesc}>Análise avulsa de fotos e shape.</Text></TouchableOpacity>
                                    <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:15}}><Text style={styles.cardHeaderSmall}>RANKING DE XP</Text><MaterialCommunityIcons name="trophy" size={20} color="#FFD700" /></View>
                                        {[...alunosAtivos].sort((a,b) => (b.currentXP||0) - (a.currentXP||0)).slice(0, 3).map((a, i) => (
                                            <View key={a.id} style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:8, borderBottomWidth:1, borderBottomColor: theme.border, paddingBottom:5}}><Text style={{color: theme.text, fontWeight:'bold'}}>{i+1}. {a.name || 'Aluno'}</Text><Text style={{color: theme.accent, fontWeight:'900'}}>{a.currentXP || 0} XP</Text></View>
                                        ))}
                                    </View>
                                </>
                            )}
                            {subTabGestao === 'CONFIG' && (
                                <>
                                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#BF5AF2' }]} onPress={() => navigation.navigate('AdminAddContent')}><View style={[styles.iconCircle, {backgroundColor: '#BF5AF2'}]}><MaterialCommunityIcons name="video-plus" size={32} color="#FFF" /></View><Text style={[styles.bigCardTitle, {color: '#BF5AF2'}]}>PA FLIX ADMIN</Text><Text style={styles.bigCardDesc}>Adicionar novos conteúdos e vídeos.</Text></TouchableOpacity>
                                    
                                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#4DE38F', borderWidth: 2 }]} onPress={() => setIsNpsModalOpen(true)}>
                                        <View style={{flexDirection:'row', alignItems:'center', gap:10}}><MaterialCommunityIcons name="star-face" size={24} color="#4DE38F" /><Text style={[styles.bigCardTitle, {marginBottom:0, color:'#4DE38F'}]}>PESQUISA NPS</Text></View>
                                        <Text style={[styles.bigCardDesc, {marginTop:5}]}>Selecione alunos e dispare a pesquisa de satisfação no aplicativo deles.</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#32ADE6' }]} onPress={() => setIsNoticeModalOpen(true)}><View style={{flexDirection:'row', alignItems:'center', gap:10}}><MaterialCommunityIcons name="bullhorn" size={24} color="#32ADE6" /><Text style={[styles.bigCardTitle, {marginBottom:0, color:'#32ADE6'}]}>ENVIAR AVISO</Text></View><Text style={[styles.bigCardDesc, {marginTop:5}]}>Notifique todos ou um aluno específico.</Text></TouchableOpacity>
                                    <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: 20 }]}>
                                        <Text style={styles.cardHeaderSmall}>APARÊNCIA DO PAINEL</Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, width: '100%' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name={theme.isDark ? "moon-waning-crescent" : "white-balance-sunny"} size={24} color={theme.text} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Modo Escuro</Text></View><Switch value={theme.isDark} onValueChange={toggleDarkMode} trackColor={{ false: '#ccc', true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (theme.isDark ? '#FFF' : '#f4f3f4')} /></View>
                                        {!theme.isDark && (
                                            <View style={{ width: '100%' }}><Text style={[styles.cardHeaderSmall, { marginBottom: 10, marginTop: 5 }]}>COR DE DESTAQUE</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}><TouchableOpacity onPress={() => selectThemeColor('verde')} style={[styles.colorCircle, { backgroundColor: '#99CC00', borderColor: selectedColor === 'verde' ? theme.text : 'transparent' }]} /><TouchableOpacity onPress={() => selectThemeColor('rosa')} style={[styles.colorCircle, { backgroundColor: '#FF2D55', borderColor: selectedColor === 'rosa' ? theme.text : 'transparent' }]} /><TouchableOpacity onPress={() => selectThemeColor('roxo')} style={[styles.colorCircle, { backgroundColor: '#AF52DE', borderColor: selectedColor === 'roxo' ? theme.text : 'transparent' }]} /><TouchableOpacity onPress={() => selectThemeColor('azul')} style={[styles.colorCircle, { backgroundColor: '#007AFF', borderColor: selectedColor === 'azul' ? theme.text : 'transparent' }]} /><TouchableOpacity onPress={() => selectThemeColor('vermelho')} style={[styles.colorCircle, { backgroundColor: '#FF3B30', borderColor: selectedColor === 'vermelho' ? theme.text : 'transparent' }]} /></View></View>
                                        )}
                                    </View>
                                </>
                            )}
                        </View>
                    </ScrollView>
                </View>
            )}
          </View>
      </View>

      <Modal visible={filterModalVisible} transparent animationType="fade" onRequestClose={() => setFilterModalVisible(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setFilterModalVisible(false)}>
              <View style={[styles.catModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 20, textAlign: 'center' }]}>FILTRAR STATUS</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {filterOptions.map(opt => (
                          <TouchableOpacity key={opt.id} style={[styles.catOption, statusFilter === opt.id && { backgroundColor: theme.accent + '22' }]} onPress={() => { setStatusFilter(opt.id); setFilterModalVisible(false); }}>
                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}><MaterialCommunityIcons name={opt.icon} size={20} color={opt.color} /><Text style={[styles.catOptionText, { color: theme.text }, statusFilter === opt.id && { color: theme.accent, fontWeight: '800' }]}>{opt.label}</Text></View>
                              {statusFilter === opt.id && <MaterialCommunityIcons name="check-decagram" size={20} color={theme.accent} />}
                          </TouchableOpacity>
                      ))}
                  </ScrollView>
              </View>
          </TouchableOpacity>
      </Modal>

      <AdminCheckinModal 
          visible={checkinModalVisible} 
          onClose={() => setCheckinModalVisible(false)} 
          selectedCheckin={selectedCheckin} 
          theme={theme} 
          isResolving={isResolving} 
          onResolve={handleResolveCheckin} 
      />

      <DisparoNPSModal 
          visible={isNpsModalOpen} 
          onClose={() => setIsNpsModalOpen(false)} 
          alunos={alunosAtivos} 
          theme={theme} 
      />

      <AdminInviteModal visible={inviteModalVisible} onClose={() => setInviteModalVisible(false)} adminEmail={adminEmail} theme={theme} />
      <SendNoticeModal visible={isNoticeModalOpen} onClose={() => setIsNoticeModalOpen(false)} alunos={alunosAtivos} adminId={adminId} theme={theme} />
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'android' ? 30 : 20, paddingHorizontal: 20, paddingBottom: 20, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  title: { fontSize: 22, fontWeight: '900' }, subtitle: { color: '#888', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' },
  logoutBtn: { padding: 10, borderRadius: 8, cursor: 'pointer' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  tab: { marginRight: 20, paddingBottom: 10, flexDirection:'row', alignItems:'center', gap:5, cursor: 'pointer' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  badgeCount: { backgroundColor:'#FF3B30', paddingHorizontal:6, borderRadius:10, height:16, justifyContent:'center', marginLeft:5 }, badgeText: { color:'#FFF', fontSize:9, fontWeight:'bold' },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 12, gap: 8 },
  inviteBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  
  // 🔥 ESTILOS NOVOS DO FILTRO DE EQUIPE
  coachFilterContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, gap: 10, backgroundColor: 'transparent' },
  coachFilterBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  coachFilterText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  searchBar: { padding: 15, borderRadius: 12, marginBottom: 15, marginHorizontal: 20, outlineStyle: 'none' },
  filterSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 20, paddingVertical: 15, borderRadius: 16, borderWidth: 1, marginBottom: 15 },
  filterSelectorVal: { fontSize: 13, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  catModalContent: { width: '100%', maxWidth: 360, borderRadius: 24, padding: 20, borderWidth: 1, maxHeight: '80%' },
  catOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10 }, catOptionText: { fontSize: 14, fontWeight: '600' }, modalTitle: { fontWeight: 'bold', fontSize: 16 },
  subTabsContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, gap: 10 },
  subTab: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' }, subTabText: { fontSize: 12, fontWeight: 'bold' },
  feedCard: { padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  feedUser: { fontWeight: 'bold', fontSize: 14 }, feedTime: { color: '#888', fontSize: 10, fontWeight:'bold' }, feedAction: { color: '#888', fontSize: 13, marginTop: 2 }, checkinFeedback: { color: '#888', fontSize: 12, fontStyle:'italic', marginTop: 4 },
  progBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 6, borderRadius: 4, marginTop: 6, gap: 4 }, progText: { fontSize: 9, fontWeight: 'bold' },
  empty: { color: '#888', textAlign: 'center', marginTop: 50 },
  gridGestao: { gap: 15 },
  bigCard: { padding: 25, borderRadius: 20, borderWidth: 1, alignItems: 'center', cursor: 'pointer' }, iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  bigCardTitle: { fontSize: 18, fontWeight: '900', marginBottom: 5 }, bigCardDesc: { color: '#888', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  cardHeaderSmall: { color:'#888', fontWeight:'bold', fontSize:12 }, colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 }
});