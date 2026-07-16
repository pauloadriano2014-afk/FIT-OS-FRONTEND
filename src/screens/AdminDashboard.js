// src/screens/AdminDashboard.js

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar, RefreshControl, ScrollView, Alert, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Contextos e Hooks
import { useTheme } from '../contexts/ThemeContext';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

// Utilitários
import { getExpirationStatus, getCheckinStatus } from '../utils/adminHelpers';

// Componentes Modulares
import AdminHeader from '../components/Admin/AdminHeader';
import AdminNavigation from '../components/Admin/AdminNavigation';
import TabAlunos from '../components/Admin/TabAlunos';
import TabCheckins from '../components/Admin/TabCheckins';
import TabFeed from '../components/Admin/TabFeed';
import TabGestao from '../components/Admin/TabGestao';
import AdminFilterWizard from '../components/Admin/AdminFilterWizard';
import PendingCoachesPanel from '../components/Admin/PendingCoachesPanel';

// Outros Componentes e Modais
import SendNoticeModal from '../components/SendNoticeModal';
import AdminInviteModal from '../components/AdminInviteModal'; 
import AdminCheckinModal from '../components/Admin/AdminCheckinModal';
import DisparoNPSModal from '../components/Admin/DisparoNPSModal';
import AdminFinanceSystem from '../components/AdminFinanceSystem'; 

const MENU_TABS = [
    { id: 'ALUNOS', label: 'GERENCIAR ALUNOS', shortLabel: 'ALUNOS', icon: 'account-group' },
    { id: 'FINANCAS', label: 'GESTÃO FINANCEIRA', shortLabel: 'FINANÇAS', icon: 'cash-multiple' },
    { id: 'CHECKINS', label: 'AVALIAÇÕES E FOTOS', shortLabel: 'AVALIAÇÕES', icon: 'camera-timer' },
    { id: 'FEED', label: 'FEED DE ATIVIDADES', shortLabel: 'FEED', icon: 'history' },
    { id: 'GESTAO', label: 'SISTEMA E CONFIGURAÇÕES', shortLabel: 'SISTEMA', icon: 'cog' }
];

const OPT_STATUS = [
    { id: 'TODOS', label: 'Todos' }, { id: 'PENDENTES', label: 'Avaliação Pendente' },
    { id: 'ATRASADOS', label: 'Atrasados (Treino/Foto)' }, { id: 'ALERTA', label: 'Alerta (Vence 7D)' },
    { id: 'OK', label: 'No Prazo' }, { id: 'SEM_TREINO', label: 'Sem Treino' }
];

const OPT_INTENSIDADE = [
    { id: 'TODOS', label: 'Todas' }, { id: 'CHOQUE', label: 'Semana de Choque' }, { id: 'DELOAD', label: 'Deload Ativo / Menstrual' }
];

const OPT_PLANOS = [
    { id: 'TODOS', label: 'Todos' }, { id: 'PLAN_ELITE', label: 'Elite' }, { id: 'PLAN_PERFORMANCE', label: 'Performance' },
    { id: 'PLAN_FICHA_8S', label: 'Ficha 8S' }, { id: 'PLAN_LOW_COST', label: 'Low Cost' }, { id: 'PLAN_CHALLENGE_21', label: 'Desafio 21D' }
];

export default function AdminDashboard({ navigation }) {
  const { theme, changeTheme } = useTheme();
  const { width: windowWidth } = Dimensions.get('window');
  const isWebPC = Platform.OS === 'web' && windowWidth > 768;
  const containerMaxWidth = isWebPC ? 960 : '100%'; 
  const containerBorders = isWebPC ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {};

  // 🔥 HOOK DE DADOS 🔥
  const {
      alunosAtivos, alunosInativos, feed, checkins, dietFeedbacks, surveys,
      loading, refreshing, adminEmail, adminId, coachFilter, setCoachFilter,
      isAdriLogged, isMaster, fetchData, handleMarkFeedbackRead, handleMarkSurveyRead, 
      handleDeleteFeedback, handleDeleteLog, getLogCoach
  } = useAdminDashboard();

  // 🔥 ESTADOS DE INTERFACE 🔥
  const [activeTab, setActiveTab] = useState('ALUNOS'); 
  const [isMenuVisible, setIsMenuVisible] = useState(false); 
  const [subTabAlunos, setSubTabAlunos] = useState('ATIVOS'); 
  const [subTabCheckins, setSubTabCheckins] = useState('AVALIACOES'); 
  const [subTabGestao, setSubTabGestao] = useState('FERRAMENTAS'); 

  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [filterIntensidade, setFilterIntensidade] = useState('TODOS');
  const [filterPlano, setFilterPlano] = useState('TODOS');
  const [filterStep, setFilterStep] = useState(1);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [visibleCount, setVisibleCount] = useState(15); 
  const [visibleCountCheckins, setVisibleCountCheckins] = useState(5); 
  const [visibleCountDiet, setVisibleCountDiet] = useState(5); 
  const [visibleCountSurveys, setVisibleCountSurveys] = useState(5); 
  const [visibleCountFeed, setVisibleCountFeed] = useState(10); 
  const [search, setSearch] = useState('');

  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [isResolving, setIsResolving] = useState(false); 

  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isNpsModalOpen, setIsNpsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('verde');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  // 🎂 ESTADOS DE ANIVERSARIANTES 🎂
  const [birthdays, setBirthdays] = useState([]);
  const [birthdayDismissed, setBirthdayDismissed] = useState(false);
  const [isBirthdaysExpanded, setIsBirthdaysExpanded] = useState(false); // 🔥 ESTADO NOVO PARA EXPANDIR

  // 🧑‍🏫 GATILHO DE RECARREGAMENTO DO PAINEL DE COACHES PENDENTES 🔥
  // Só sobe quando o botão de recarregar do header é clicado. O painel também
  // já refaz o check sozinho ao montar (ou seja, toda vez que você entra na aba ALUNOS).
  const [coachCheckTrigger, setCoachCheckTrigger] = useState(0);

  useFocusEffect(useCallback(() => { fetchData(false); }, []));

  useEffect(() => { 
      setVisibleCount(15); setVisibleCountCheckins(5); setVisibleCountDiet(5); setVisibleCountSurveys(5); setVisibleCountFeed(10);
  }, [subTabAlunos, subTabCheckins, activeTab, search, filterStatus, filterIntensidade, filterPlano, coachFilter]);

  // 🎂 Busca aniversariantes assim que o adminId estiver disponível
  useEffect(() => {
      if (adminId) fetchBirthdays();
  }, [adminId]);

  // 🎂 Busca aniversariantes dos próximos 7 dias com cache diário (1x por dia)
  const fetchBirthdays = async () => {
      if (!adminId) return;
      try {
          const CACHE_KEY  = `@birthdays_cache_${adminId}`;
          const CACHE_DATE = `@birthdays_date_${adminId}`;
          const today      = new Date().toISOString().split('T')[0];

          const lastDate = await AsyncStorage.getItem(CACHE_DATE);
          if (lastDate === today) {
              const cached = await AsyncStorage.getItem(CACHE_KEY);
              if (cached) { setBirthdays(JSON.parse(cached)); return; }
          }

          const res = await fetch(`https://fitos-final.onrender.com/api/admin/birthdays?adminId=${adminId}&days=7`);
          if (!res.ok) return;
          const data = await res.json();

          setBirthdays(data);
          setBirthdayDismissed(false);

          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
          await AsyncStorage.setItem(CACHE_DATE, today);

          const todayBirthdays = data.filter(b => b.daysUntil === 0);
          if (todayBirthdays.length > 0) {
              const pushKey  = `@birthday_push_${adminId}_${today}`;
              const pushSent = await AsyncStorage.getItem(pushKey);
              if (!pushSent) {
                  const names = todayBirthdays.map(b => b.name?.split(' ')[0]).join(', ');
                  const userJson = await AsyncStorage.getItem('user');
                  if (userJson) {
                      const user = JSON.parse(userJson);
                      if (user.pushToken) {
                          await fetch('https://exp.host/--/api/v2/push/send', {
                              method:  'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                  to:    user.pushToken,
                                  sound: 'default',
                                  title: '🎂 Aniversário hoje!',
                                  body:  `${names} ${todayBirthdays.length > 1 ? 'fazem' : 'faz'} aniversário hoje. Que tal parabenizar?`,
                              }),
                          }).catch(() => {});
                      }
                  }
                  await AsyncStorage.setItem(pushKey, 'sent');
              }
          }
      } catch (e) {
          console.log('Erro ao buscar aniversários:', e);
      }
  };

  const ownerKey = isAdriLogged ? 'ADRI' : 'PAULO';
  const partnerKey = isAdriLogged ? 'PAULO' : 'ADRI';

  let activeFiltersCount = 0;
  if (filterStatus !== 'TODOS') activeFiltersCount++;
  if (filterIntensidade !== 'TODOS') activeFiltersCount++;
  if (filterPlano !== 'TODOS') activeFiltersCount++;

  // 🔥 LÓGICA DE FILTRAGEM
  const displayList = useMemo(() => {
      let list = subTabAlunos === 'ATIVOS' ? alunosAtivos : alunosInativos;
      if (search) list = list.filter(a => (a.name || '').toLowerCase().includes(search.toLowerCase()));
      list = list.filter(a => getLogCoach(a) === coachFilter); 

      if (filterPlano !== 'TODOS') {
          const targetPlan = filterPlano.replace('PLAN_', '');
          list = list.filter(a => {
              let currentPlan = String(a.plan || 'ELITE').toUpperCase();
              if (['VIP', 'PREMIUM'].includes(currentPlan)) currentPlan = 'ELITE';
              return currentPlan === targetPlan;
          });
      }

      if (filterIntensidade !== 'TODOS') {
          list = list.filter(a => {
              const activeWorkout = (a.workouts && a.workouts.length > 0) ? a.workouts[0] : null;
              if (filterIntensidade === 'DELOAD') return (activeWorkout?.intensityMultiplier || 1) < 1 || a.isMenstruating;
              if (filterIntensidade === 'CHOQUE') return (activeWorkout?.intensityMultiplier || 1) > 1;
              return true;
          });
      }

      if (filterStatus !== 'TODOS') {
          list = list.filter(a => {
              if (filterStatus === 'PENDENTES') return (a._count?.checkIns || 0) > 0;
              const activeWorkout = (a.workouts && a.workouts.length > 0) ? a.workouts[0] : null;
              if (filterStatus === 'ATRASADOS') return getCheckinStatus(a) || (getExpirationStatus(activeWorkout)?.cat === 'ATRASADOS');
              if (!activeWorkout) return filterStatus === 'SEM_TREINO';
              return getExpirationStatus(activeWorkout)?.cat === filterStatus;
          });
      }
      return list;
  }, [alunosAtivos, alunosInativos, subTabAlunos, search, filterStatus, filterIntensidade, filterPlano, coachFilter, getLogCoach]);

  const filteredFeed = useMemo(() => feed.filter(item => getLogCoach(item) === coachFilter), [feed, coachFilter, getLogCoach]);
  const filteredDiet = useMemo(() => dietFeedbacks.filter(item => getLogCoach(item) === coachFilter), [dietFeedbacks, coachFilter, getLogCoach]);
  const filteredSurveys = useMemo(() => surveys.filter(item => getLogCoach(item) === coachFilter), [surveys, coachFilter, getLogCoach]);
  const filteredCheckins = useMemo(() => checkins.filter(item => {
      const coach = getLogCoach(item);
      if (coach !== coachFilter) return false;
      if (coach === 'ADRI' && !isAdriLogged) return false; 
      if (coach === 'PAULO' && isAdriLogged) return false; 
      return true;
  }), [checkins, coachFilter, getLogCoach, isAdriLogged]);

  const unreadFeedbacksCount = filteredDiet.filter(f => !f.read).length;
  const unreadSurveysCount = filteredSurveys.filter(s => !s.readByAdmin).length;
  const totalAlerts = filteredCheckins.length + unreadFeedbacksCount + unreadSurveysCount;

  // 🔥 FUNÇÕES GLOBAIS DA TELA 🔥
  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['user', 'role', '@dashboard_cache', '@global_exercises']);
    if (Platform.OS === 'web') window.location.replace('/');
    else navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const toggleDarkMode = () => changeTheme(!theme.isDark, selectedColor);
  const selectThemeColor = (colorKey) => { setSelectedColor(colorKey); changeTheme(theme.isDark, colorKey); };
  const switchSubTab = (tab) => { setSubTabAlunos(tab); setSearch(''); setVisibleCount(15); };

  // 🔥 RECARREGAMENTO DO HEADER: mantém o fetchData normal e, além disso, avisa o
  // painel de coaches pendentes pra refazer o check (via coachCheckTrigger).
  // Funciona em qualquer args que o AdminHeader passe pro fetchData original.
  const handleHeaderReload = (...args) => {
      fetchData(...args);
      setCoachCheckTrigger(t => t + 1);
  };

  const handleResolveCheckin = () => {
      const confirmAction = async () => {
          setIsResolving(true);
          try {
              const res = await fetch('https://fitos-final.onrender.com/api/checkin/evaluate', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ checkinId: selectedCheckin.id, coachFeedback: "*Avaliação Finalizada!* 🎯\n\nSeu laudo completo foi gerado com sucesso. Vá até a sua tela de **Evolução** no aplicativo para conferir a análise e o seu planejamento.", silent: true })
              });
              if (res.ok) { setCheckinModalVisible(false); fetchData(true); if (Platform.OS === 'web') window.alert("Baixa realizada com sucesso!"); } 
              else { if (Platform.OS === 'web') window.alert("Erro ao dar baixa."); else Alert.alert("Erro", "Não foi possível atualizar o check-in."); }
          } catch (e) { if (Platform.OS === 'web') window.alert("Erro de conexão."); else Alert.alert("Erro", "Erro de conexão."); } 
          finally { setIsResolving(false); }
      };
      if (Platform.OS === 'web') { if (window.confirm("Marcar como 'Avaliado' para remover o aviso vermelho?")) confirmAction(); } 
      else { Alert.alert("Remover Alerta", "Marcar como 'Avaliado' para remover o aviso vermelho?", [ { text: "Cancelar", style: "cancel" }, { text: "Sim", onPress: confirmAction } ]); }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg };

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <ScrollView 
          style={{ flex: 1, width: '100%', backgroundColor: isWeb ? 'transparent' : theme.bg }} 
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 150 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={activeTab !== 'FINANCAS' ? <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.accent} /> : undefined}
      >
          <View style={{ width: '100%', maxWidth: containerMaxWidth, backgroundColor: theme.bg, ...containerBorders, paddingHorizontal: 20, minHeight: '100%' }}>

              <AdminHeader theme={theme} toggleDarkMode={toggleDarkMode} fetchData={handleHeaderReload} handleLogout={handleLogout} adminId={adminId} />

              {/* 🎂 ANIVERSARIANTES EXPANSÍVEL 🎂 */}
              {!birthdayDismissed && birthdays.length > 0 && (
                  <View style={[styles.miniBirthdayPill, { backgroundColor: theme.accent + '20' }]}>
                      <TouchableOpacity 
                          style={{ flexDirection: 'row', alignItems: 'center' }} 
                          activeOpacity={0.8}
                          onPress={() => setIsBirthdaysExpanded(!isBirthdaysExpanded)}
                      >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                              <MaterialCommunityIcons name="cake-variant" size={16} color={theme.accent} />
                              <Text style={[styles.miniBirthdayText, { color: theme.text, fontSize: 13 }]}>
                                  {birthdays.length} {birthdays.length > 1 ? 'aniversariantes' : 'aniversariante'} nos próximos dias
                              </Text>
                          </View>
                          <MaterialCommunityIcons name={isBirthdaysExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                          <TouchableOpacity onPress={() => setBirthdayDismissed(true)} style={{ padding: 4, marginLeft: 10, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 8 }}>
                              <MaterialCommunityIcons name="close" size={14} color={theme.textSecondary} />
                          </TouchableOpacity>
                      </TouchableOpacity>

                      {isBirthdaysExpanded && (
                          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', gap: 8 }}>
                              {birthdays.map((b, index) => (
                                  <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>{b.name}</Text>
                                      <Text style={{ 
                                          color: b.daysUntil === 0 ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary, 
                                          fontSize: 11, 
                                          fontWeight: '900', 
                                          backgroundColor: b.daysUntil === 0 ? theme.accent : 'transparent', 
                                          paddingHorizontal: b.daysUntil === 0 ? 8 : 0, 
                                          paddingVertical: b.daysUntil === 0 ? 4 : 0, 
                                          borderRadius: 6, 
                                          overflow: 'hidden' 
                                      }}>
                                          {b.daysUntil === 0 ? 'HOJE 🎉' : `Em ${b.daysUntil} dias`}
                                      </Text>
                                  </View>
                              ))}
                          </View>
                      )}
                  </View>
              )}

              {/* 🔥 PAINEL DE COACHES PENDENTES (SÓ PARA MASTER, SÓ NA ABA ALUNOS) 🔥
                  Antes ficava sempre montado e checava coach novo em qualquer aba.
                  Agora: só monta (e portanto só faz o fetch) quando activeTab === 'ALUNOS',
                  e refaz o check quando o botão de recarregar do header é clicado
                  (via coachCheckTrigger), não importa a aba em que você estiver. */}
              {isMaster && activeTab === 'ALUNOS' && (
                  <PendingCoachesPanel theme={theme} refreshTrigger={coachCheckTrigger} />
              )}

              <AdminNavigation 
                  theme={theme} isWebPC={isWebPC} activeTab={activeTab} setActiveTab={setActiveTab} 
                  totalAlerts={totalAlerts} MENU_TABS={MENU_TABS} isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} 
              />

              {/* 🔥 CONTROLE DE ABA: SÓ RENDERIZA SE FOR MASTER (PAULO OU ADRI) E NÃO ESTIVER NA GESTÃO 🔥 */}
              {isMaster && activeTab !== 'GESTAO' && (
                  <View style={[styles.segmentedControl, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                      <TouchableOpacity style={[styles.segmentBtn, coachFilter === ownerKey && { backgroundColor: theme.surface, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: theme.isDark ? theme.border : 'transparent'}]} onPress={() => setCoachFilter(ownerKey)}>
                          <Text style={[styles.segmentText, { color: coachFilter === ownerKey ? theme.text : theme.textSecondary }]}>MEUS ALUNOS</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.segmentBtn, coachFilter === partnerKey && { backgroundColor: theme.surface, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: theme.isDark ? theme.border : 'transparent'}]} onPress={() => setCoachFilter(partnerKey)}>
                          <Text style={[styles.segmentText, { color: coachFilter === partnerKey ? theme.text : theme.textSecondary }]}>ALUNOS {partnerKey}</Text>
                      </TouchableOpacity>
                  </View>
              )}

              {loading ? (
                  <View style={{marginTop: 50}}><ActivityIndicator size="large" color={theme.accent} /></View>
              ) : (
                  <View style={{ width: '100%' }}>

                      {activeTab === 'ALUNOS' && (
                          <TabAlunos 
                              theme={theme} navigation={navigation} search={search} setSearch={setSearch}
                              setFilterModalVisible={setFilterModalVisible} activeFiltersCount={activeFiltersCount}
                              subTabAlunos={subTabAlunos} switchSubTab={switchSubTab} displayList={displayList}
                              visibleCount={visibleCount} setVisibleCount={setVisibleCount} setInviteModalVisible={setInviteModalVisible}
                          />
                      )}

                      {activeTab === 'CHECKINS' && (
                          <TabCheckins 
                              theme={theme} subTabCheckins={subTabCheckins} setSubTabCheckins={setSubTabCheckins}
                              filteredCheckins={filteredCheckins} filteredDiet={filteredDiet} filteredSurveys={filteredSurveys}
                              visibleCountCheckins={visibleCountCheckins} setVisibleCountCheckins={setVisibleCountCheckins}
                              visibleCountDiet={visibleCountDiet} setVisibleCountDiet={setVisibleCountDiet}
                              visibleCountSurveys={visibleCountSurveys} setVisibleCountSurveys={setVisibleCountSurveys}
                              coachFilter={coachFilter} isAdriLogged={isAdriLogged} setSelectedCheckin={setSelectedCheckin}
                              setCheckinModalVisible={setCheckinModalVisible} handleMarkFeedbackRead={handleMarkFeedbackRead}
                              handleDeleteFeedback={handleDeleteFeedback} handleMarkSurveyRead={handleMarkSurveyRead}
                          />
                      )}

                      {activeTab === 'FEED' && (
                          <TabFeed theme={theme} filteredFeed={filteredFeed} visibleCountFeed={visibleCountFeed} setVisibleCountFeed={setVisibleCountFeed} handleDeleteLog={handleDeleteLog} />
                      )}

                      {activeTab === 'FINANCAS' && (
                          <View style={{ marginHorizontal: -20, marginTop: -10 }}>
                              <AdminFinanceSystem theme={theme} alunos={alunosAtivos} coachFilter={coachFilter} getLogCoach={getLogCoach} isWeb={isWebPC} />
                          </View>
                      )}

                      {activeTab === 'GESTAO' && (
                          <TabGestao 
                              theme={theme} subTabGestao={subTabGestao} setSubTabGestao={setSubTabGestao}
                              navigation={navigation} alunosAtivos={alunosAtivos} setIsNpsModalOpen={setIsNpsModalOpen}
                              setIsNoticeModalOpen={setIsNoticeModalOpen} toggleDarkMode={toggleDarkMode}
                              selectThemeColor={selectThemeColor} selectedColor={selectedColor}
                          />
                      )}

                  </View>
              )}
          </View>
      </ScrollView>

      <AdminFilterWizard 
          theme={theme} filterModalVisible={filterModalVisible} setFilterModalVisible={setFilterModalVisible}
          filterStep={filterStep} setFilterStep={setFilterStep} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          filterIntensidade={filterIntensidade} setFilterIntensidade={setFilterIntensidade} filterPlano={filterPlano} setFilterPlano={setFilterPlano}
          OPT_STATUS={OPT_STATUS} OPT_INTENSIDADE={OPT_INTENSIDADE} OPT_PLANOS={OPT_PLANOS}
      />

      <AdminCheckinModal visible={checkinModalVisible} onClose={() => setCheckinModalVisible(false)} selectedCheckin={selectedCheckin} theme={theme} isResolving={isResolving} onResolve={handleResolveCheckin} />
      <DisparoNPSModal visible={isNpsModalOpen} onClose={() => setIsNpsModalOpen(false)} alunos={alunosAtivos} theme={theme} />
      <AdminInviteModal visible={inviteModalVisible} onClose={() => setInviteModalVisible(false)} adminEmail={adminEmail} theme={theme} />
      <SendNoticeModal visible={isNoticeModalOpen} onClose={() => setIsNoticeModalOpen(false)} alunos={alunosAtivos} adminId={adminId} theme={theme} />
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  segmentedControl: { flexDirection: 'row', marginBottom: 20, padding: 4, borderRadius: 12 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  miniBirthdayPill: { flexDirection: 'column', alignItems: 'stretch', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, marginBottom: 16 },
  miniBirthdayText: { fontSize: 11, fontWeight: '700' }
});