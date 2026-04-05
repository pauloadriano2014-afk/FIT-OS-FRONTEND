// src/screens/AdminDashboard.js
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, 
  TextInput, StatusBar, RefreshControl, Modal, ScrollView, Image, Alert, 
  Platform, Switch, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../contexts/ThemeContext';
import SendNoticeModal from '../components/SendNoticeModal';

const getExpirationStatus = (workout) => {
    if (!workout) return null;
    if (!workout.endDate) return { text: 'SEM PRAZO', bg: '#E5E5EA', color: '#888', cat: 'OK' }; 

    const today = new Date();
    today.setHours(0,0,0,0);
    const end = new Date(workout.endDate);
    end.setHours(0,0,0,0);
    
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `ATRASADO ${Math.abs(diffDays)}D`, bg: '#000', color: '#FFF', cat: 'ATRASADOS' };
    if (diffDays <= 3) return { text: `VENCE EM ${diffDays}D`, bg: '#FF3B30', color: '#FFF', cat: 'ALERTA' };
    if (diffDays <= 7) return { text: `VENCE EM ${diffDays}D`, bg: '#FFCC00', color: '#000', cat: 'ALERTA' };
    return { text: `VENCE EM ${diffDays}D`, bg: 'rgba(52, 199, 89, 0.15)', color: '#34C759', cat: 'OK' };
};

export default function AdminDashboard({ navigation }) {
  const { theme, changeTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('ALUNOS'); 
  
  const [alunosAtivos, setAlunosAtivos] = useState([]);
  const [alunosInativos, setAlunosInativos] = useState([]);
  const [subTabAlunos, setSubTabAlunos] = useState('ATIVOS'); 
  
  const [statusFilter, setStatusFilter] = useState('TODOS'); 
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [feed, setFeed] = useState([]); 
  const [checkins, setCheckins] = useState([]);
  const [visibleCount, setVisibleCount] = useState(15); 
  
  // 🔥 ESTADO DE INTELIGÊNCIA DE CACHE AQUI 🔥
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminId, setAdminId] = useState('');

  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('verde');

  const filterOptions = [
    { id: 'TODOS', label: 'TODOS OS ALUNOS', icon: 'account-group', color: theme.text },
    { id: 'ATRASADOS', label: 'TREINOS ATRASADOS', icon: 'alert-circle', color: '#FF3B30' },
    { id: 'ALERTA', label: 'ALERTA (VENCE EM 7D)', icon: 'clock-fast', color: '#FFCC00' },
    { id: 'OK', label: 'NO PRAZO', icon: 'check-circle', color: '#34C759' },
    { id: 'SEM_TREINO', label: 'SEM TREINO', icon: 'calendar-blank', color: theme.textSecondary }
  ];

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  useEffect(() => { setVisibleCount(15); }, [subTabAlunos, search, statusFilter]);

  // 🔥 BUSCA SILENCIOSA: O Loading só trava a tela na primeira vez
  const fetchData = async () => {
    try {
      if (isFirstLoad && !refreshing) {
          setLoading(true); // Trava a tela só se for a primeira vez
      }
      
      const t = Date.now();
      const userJson = await AsyncStorage.getItem('user');
      const savedThemeObj = await AsyncStorage.getItem('app_theme');
      
      let localAdminId = '';
      if (userJson) {
          const userObj = JSON.parse(userJson);
          setAdminEmail(userObj.email);
          setAdminId(userObj.id);
          localAdminId = userObj.id; 
      }

      if (savedThemeObj) {
          const parsedTheme = JSON.parse(savedThemeObj);
          if (parsedTheme.accent === '#FF2D55') setSelectedColor('rosa');
          else if (parsedTheme.accent === '#AF52DE') setSelectedColor('roxo');
          else if (parsedTheme.accent === '#007AFF') setSelectedColor('azul');
          else if (parsedTheme.accent === '#FF3B30') setSelectedColor('vermelho');
          else setSelectedColor('verde');
      }

      // Disparo 1: Busca os alunos silenciosamente
      fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${localAdminId}&t=${t}`)
        .then(res => res.json())
        .then(data => {
            if (data.activeUsers || data.inactiveUsers) {
                setAlunosAtivos(data.activeUsers || []);
                setAlunosInativos(data.inactiveUsers || []);
            } else if (data.users) {
                setAlunosAtivos(data.users || []);
            }
            if (data.recentLogs) setFeed(data.recentLogs);
        })
        .catch(e => console.log("Erro Busca Alunos:", e))
        .finally(() => {
            setLoading(false); 
            setIsFirstLoad(false); // Diz pro App que a primeira carga já foi feita
            setRefreshing(false);
        });

      // Disparo 2: Busca checkins silenciosamente
      fetch(`https://fitos-final.onrender.com/api/checkin?adminId=${localAdminId}&t=${t}`)
        .then(res => res.json())
        .then(dataCheckins => {
            if (Array.isArray(dataCheckins)) setCheckins(dataCheckins);
        })
        .catch(e => console.log("Erro Busca Checkins:", e));

    } catch (e) { 
        console.log("Erro geral fetchData", e); 
        setLoading(false);
        setIsFirstLoad(false);
        setRefreshing(false);
    }
  };

  const displayList = useMemo(() => {
      let list = subTabAlunos === 'ATIVOS' ? alunosAtivos : alunosInativos;
      
      if (search) list = list.filter(a => (a.name || '').toLowerCase().includes(search.toLowerCase()));
      
      if (statusFilter !== 'TODOS') {
          list = list.filter(a => {
              const activeWorkout = (a.workouts && a.workouts.length > 0) ? a.workouts[0] : null;
              if (!activeWorkout) return statusFilter === 'SEM_TREINO';
              const status = getExpirationStatus(activeWorkout);
              return status && status.cat === statusFilter;
          });
      }
      return list;
  }, [alunosAtivos, alunosInativos, subTabAlunos, search, statusFilter]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['user', 'role']);
    if (Platform.OS === 'web') window.location.replace('/');
    else navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleDeleteLog = (logId) => {
      Alert.alert("Remover", "Deseja ocultar este item do feed?", [
          { text: "Cancelar" },
          { text: "Sim", style: 'destructive', onPress: () => setFeed(current => current.filter(item => item.id !== logId)) }
      ]);
  };

  const handleInviteStudent = () => {
      let code = 'PATEAM'; 
      if (adminEmail === 'adri.personal@hotmail.com') code = 'CURVAS';
      const inviteLink = `https://www.pauloadrianoteam.com.br/registro?coach=${code}`; 
      const message = `Seja bem-vindo(a) à nossa equipe! Para darmos o start no seu projeto, faça o cadastro no app oficial por aqui:\n\n${inviteLink}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      Linking.canOpenURL(whatsappUrl).then(supported => {
          if (supported) Linking.openURL(whatsappUrl);
          else {
              if (Platform.OS === 'web') window.open(whatsappUrl, '_blank');
              else Alert.alert("Aviso", "Não foi possível abrir o WhatsApp neste dispositivo.");
          }
      }).catch(err => console.error('An error occurred', err));
  };

  const toggleDarkMode = (newValue) => {
      if (newValue) { setSelectedColor('verde'); changeTheme(true, 'verde'); } 
      else changeTheme(false, selectedColor);
  };

  const selectThemeColor = (colorKey) => {
      setSelectedColor(colorKey);
      changeTheme(theme.isDark, colorKey);
  };

  const handleDownloadPhoto = async (url, photoType) => {
      if (!url) return;
      const alunoNome = selectedCheckin?.user?.name ? selectedCheckin.user.name.replace(/\s+/g, '_') : 'aluno';
      const fileName = `Checkin_${alunoNome}_${photoType}.jpg`;
      if (Platform.OS === 'web') {
          try {
              const response = await fetch(url);
              const blob = await response.blob();
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          } catch (e) { window.open(url, '_blank'); }
      } else Linking.openURL(url); 
  };

  const switchSubTab = (tab) => {
      setSubTabAlunos(tab);
      setSearch('');
      setVisibleCount(15);
  };

  const renderCheckinItem = ({ item }) => (
      <TouchableOpacity style={[styles.feedCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { setSelectedCheckin(item); setCheckinModalVisible(true); }}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 173, 230, 0.15)' }]}><MaterialCommunityIcons name="camera-account" size={20} color="#32ADE6" /></View>
          <View style={{flex: 1}}>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                  <Text style={[styles.feedUser, { color: theme.text }]}>{item.user?.name || "Aluno"}</Text>
                  <Text style={styles.feedTime}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
              </View>
              <Text style={styles.feedAction}>Check-in: <Text style={{color: theme.text, fontWeight:'bold'}}>{item.weight ? `${item.weight}kg` : 'Fotos'}</Text></Text>
              {item.feedback ? <Text numberOfLines={1} style={styles.checkinFeedback}>"{item.feedback}"</Text> : null}
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
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <Text style={[styles.feedUser, { color: theme.text }]}>{item.user?.name || "Aluno"}</Text>
                    <Text style={styles.feedTime}>{dayString}</Text>
                </View>
                <Text style={styles.feedAction}>Concluiu <Text style={{color: theme.accent, fontWeight:'bold'}}>{item.workoutName ? item.workoutName.toUpperCase() : "TREINO"}</Text></Text>
                {item.progressions > 0 && (
                    <View style={[styles.progBadge, { backgroundColor: theme.accent }]}>
                        <MaterialCommunityIcons name="fire" size={12} color={theme.isDark ? '#000' : '#FFF'} />
                        <Text style={[styles.progText, { color: theme.isDark ? '#000' : '#FFF' }]}>{item.progressions} PRs!</Text>
                    </View>
                )}
            </View>
            <TouchableOpacity onPress={() => handleDeleteLog(item.id)} style={{padding:5, marginLeft:5}}>
                <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
        </View>
      );
  };

  const renderAluno = ({ item }) => {
      const activeWorkout = (item.workouts && item.workouts.length > 0) ? item.workouts[0] : null;
      const farol = getExpirationStatus(activeWorkout);
      const primeiraLetra = item.name ? item.name.charAt(0).toUpperCase() : 'A';

      return (
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 16, alignItems: 'center' }]} onPress={() => navigation.navigate('AdminAlunoOptions', { aluno: item })}> 
          {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={[styles.avatarPlaceholder, { borderWidth: 0 }]} />
          ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                <Text style={[styles.avatarText, { color: theme.accent }]}>{primeiraLetra}</Text>
              </View>
          )}
          
          <View style={{ flex: 1, marginLeft: 15, justifyContent: 'center' }}>
            <Text style={[styles.alunoName, { color: theme.text, fontSize: 16, marginBottom: 2 }]} numberOfLines={1}>{item.name || 'Aluno Sem Nome'}</Text>
            <Text style={[styles.alunoEmail, { color: theme.textSecondary, fontSize: 12 }]} numberOfLines={1}>{item.email || 'Sem E-mail'}</Text>
          </View>

          <View style={{ alignItems: 'flex-end', justifyContent: 'center', marginLeft: 10 }}>
              {item.plan === 'ELITE' && (
                  <View style={[styles.tagElite, { backgroundColor: theme.accent, marginBottom: farol ? 6 : 0, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }]}>
                      <Text style={[styles.tagText, { color: theme.isDark ? '#000' : '#FFF', fontSize: 8 }]}>ELITE</Text>
                  </View>
              )}
              {farol && (
                  <View style={{ backgroundColor: farol.bg === 'rgba(52, 199, 89, 0.15)' ? '#34C759' : farol.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: farol.bg === 'rgba(52, 199, 89, 0.15)' ? '#FFF' : farol.color, letterSpacing: 0.5 }}>{farol.text}</Text>
                  </View>
              )}
          </View>
        </TouchableOpacity>
      );
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg };

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          <View style={styles.header}>
            <View>
                <Text style={[styles.title, { color: theme.text }]}>FIT OS <Text style={{color: theme.accent}}>COMMAND</Text></Text>
                <Text style={styles.subtitle}>PAINEL ADMINISTRATIVO</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                <MaterialCommunityIcons name="logout" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {['ALUNOS', 'CHECKINS', 'FEED', 'GESTAO'].map(tab => (
                <TouchableOpacity key={tab} style={[styles.tab, activeTab===tab && { borderBottomWidth: 3, borderBottomColor: theme.accent }]} onPress={()=>setActiveTab(tab)}>
                    <Text style={[styles.tabText, activeTab===tab && { color: theme.text }]}>{tab === 'GESTAO' ? 'SISTEMA' : tab}</Text>
                    {tab === 'CHECKINS' && checkins.length > 0 && <View style={styles.badgeCount}><Text style={styles.badgeText}>{checkins.length}</Text></View>}
                </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }}>
            {activeTab === 'ALUNOS' && (
                <>
                    <TouchableOpacity style={[styles.inviteBtn, { backgroundColor: '#FFCC00' }]} onPress={handleInviteStudent}>
                        <MaterialCommunityIcons name="whatsapp" size={22} color="#000" />
                        <Text style={styles.inviteBtnText}>CONVIDAR ALUNO</Text>
                    </TouchableOpacity>

                    <TextInput 
                        style={[styles.searchBar, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, borderWidth: 1 }]} 
                        placeholder="Buscar aluno..." placeholderTextColor={theme.textSecondary}
                        value={search} onChangeText={setSearch} 
                    />

                    <TouchableOpacity 
                        style={[styles.filterSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => setFilterModalVisible(true)}
                    >
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <MaterialCommunityIcons name="filter-variant" size={20} color={theme.accent} />
                            <Text style={[styles.filterSelectorVal, { color: theme.text }]}>
                                FILTRAR: {filterOptions.find(f => f.id === statusFilter)?.label}
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-down" size={22} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.subTabsContainer}>
                        <TouchableOpacity style={[styles.subTab, subTabAlunos === 'ATIVOS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => switchSubTab('ATIVOS')}>
                            <Text style={[styles.subTabText, { color: subTabAlunos === 'ATIVOS' ? theme.text : theme.textSecondary }]}>ATIVOS ({alunosAtivos.length})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.subTab, subTabAlunos === 'INATIVOS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => switchSubTab('INATIVOS')}>
                            <Text style={[styles.subTabText, { color: subTabAlunos === 'INATIVOS' ? '#FF4444' : theme.textSecondary }]}>INATIVOS ({alunosInativos.length})</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={{marginTop: 50}}><ActivityIndicator size="large" color={theme.accent} /></View>
                    ) : (
                        <FlatList 
                            data={displayList.slice(0, visibleCount)} 
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }} 
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor={theme.accent} />}
                            renderItem={renderAluno}
                            ListEmptyComponent={<Text style={styles.empty}>Nenhum aluno neste filtro.</Text>}
                            onEndReached={() => setVisibleCount(prev => prev + 15)} 
                            onEndReachedThreshold={0.5} 
                            initialNumToRender={15}
                        />
                    )}
                </>
            )}

            {activeTab === 'CHECKINS' && (
                <FlatList 
                    data={checkins} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor={theme.accent} />}
                    renderItem={renderCheckinItem}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum check-in.</Text>}
                />
            )}

            {activeTab === 'FEED' && (
                <FlatList 
                    data={feed} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor={theme.accent} />}
                    renderItem={renderFeedItem}
                    ListEmptyComponent={<Text style={styles.empty}>Nada recente.</Text>}
                />
            )}

            {activeTab === 'GESTAO' && (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 150, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.gridGestao}>
                        <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: 20 }]}>
                            <Text style={styles.cardHeaderSmall}>APARÊNCIA DO PAINEL</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, width: '100%' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <MaterialCommunityIcons name={theme.isDark ? "moon-waning-crescent" : "white-balance-sunny"} size={24} color={theme.text} />
                                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Modo Escuro</Text>
                                </View>
                                <Switch value={theme.isDark} onValueChange={toggleDarkMode} trackColor={{ false: '#ccc', true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (theme.isDark ? '#FFF' : '#f4f3f4')} />
                            </View>
                            {!theme.isDark && (
                                <View style={{ width: '100%' }}>
                                    <Text style={[styles.cardHeaderSmall, { marginBottom: 10, marginTop: 5 }]}>COR DE DESTAQUE</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                                        <TouchableOpacity onPress={() => selectThemeColor('verde')} style={[styles.colorCircle, { backgroundColor: '#99CC00', borderColor: selectedColor === 'verde' ? theme.text : 'transparent' }]} />
                                        <TouchableOpacity onPress={() => selectThemeColor('rosa')} style={[styles.colorCircle, { backgroundColor: '#FF2D55', borderColor: selectedColor === 'rosa' ? theme.text : 'transparent' }]} />
                                        <TouchableOpacity onPress={() => selectThemeColor('roxo')} style={[styles.colorCircle, { backgroundColor: '#AF52DE', borderColor: selectedColor === 'roxo' ? theme.text : 'transparent' }]} />
                                        <TouchableOpacity onPress={() => selectThemeColor('azul')} style={[styles.colorCircle, { backgroundColor: '#007AFF', borderColor: selectedColor === 'azul' ? theme.text : 'transparent' }]} />
                                        <TouchableOpacity onPress={() => selectThemeColor('vermelho')} style={[styles.colorCircle, { backgroundColor: '#FF3B30', borderColor: selectedColor === 'vermelho' ? theme.text : 'transparent' }]} />
                                    </View>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('GerenciarTemplates')}>
                            <View style={[styles.iconCircle, {backgroundColor: theme.accent}]}><MaterialCommunityIcons name="folder-multiple" size={32} color={theme.isDark ? '#000' : '#FFF'} /></View>
                            <Text style={[styles.bigCardTitle, { color: theme.text }]}>MEUS TEMPLATES</Text>
                            <Text style={styles.bigCardDesc}>Crie fichas padrão.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('BibliotecaAdmin')}>
                            <View style={[styles.iconCircle, {backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border}]}><MaterialCommunityIcons name="database-edit" size={32} color={theme.accent} /></View>
                            <Text style={[styles.bigCardTitle, { color: theme.text }]}>EXERCÍCIOS</Text>
                            <Text style={styles.bigCardDesc}>Gerencie a biblioteca.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#BF5AF2' }]} onPress={() => navigation.navigate('AdminAddContent')}>
                            <View style={[styles.iconCircle, {backgroundColor: '#BF5AF2'}]}><MaterialCommunityIcons name="video-plus" size={32} color="#FFF" /></View>
                            <Text style={[styles.bigCardTitle, {color: '#BF5AF2'}]}>PA FLIX ADMIN</Text>
                            <Text style={styles.bigCardDesc}>Adicionar novos vídeos.</Text>
                        </TouchableOpacity>
                        <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:15}}>
                                <Text style={styles.cardHeaderSmall}>RANKING DE XP</Text>
                                <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                            </View>
                            {[...alunosAtivos].sort((a,b) => (b.currentXP||0) - (a.currentXP||0)).slice(0, 3).map((a, i) => (
                                <View key={a.id} style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:8, borderBottomWidth:1, borderBottomColor: theme.border, paddingBottom:5}}>
                                    <Text style={{color: theme.text, fontWeight:'bold'}}>{i+1}. {a.name || 'Aluno'}</Text>
                                    <Text style={{color: theme.accent, fontWeight:'900'}}>{a.currentXP || 0} XP</Text>
                                </View>
                            ))}
                        </View>
                        
                        <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#32ADE6' }]} onPress={() => setIsNoticeModalOpen(true)}>
                            <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                                <MaterialCommunityIcons name="bullhorn" size={24} color="#32ADE6" />
                                <Text style={[styles.bigCardTitle, {marginBottom:0, color:'#32ADE6'}]}>ENVIAR AVISO</Text>
                            </View>
                            <Text style={[styles.bigCardDesc, {marginTop:5}]}>Notifique todos ou um aluno.</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

          </View>
      </View>

      <Modal visible={filterModalVisible} transparent animationType="fade" onRequestClose={() => setFilterModalVisible(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setFilterModalVisible(false)}>
              <View style={[styles.catModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 20, textAlign: 'center' }]}>FILTRAR STATUS</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {filterOptions.map(opt => (
                          <TouchableOpacity 
                              key={opt.id} 
                              style={[styles.catOption, statusFilter === opt.id && { backgroundColor: theme.accent + '22' }]}
                              onPress={() => { setStatusFilter(opt.id); setFilterModalVisible(false); }}
                          >
                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                  <MaterialCommunityIcons name={opt.icon} size={20} color={opt.color} />
                                  <Text style={[styles.catOptionText, { color: theme.text }, statusFilter === opt.id && { color: theme.accent, fontWeight: '800' }]}>{opt.label}</Text>
                              </View>
                              {statusFilter === opt.id && <MaterialCommunityIcons name="check-decagram" size={20} color={theme.accent} />}
                          </TouchableOpacity>
                      ))}
                  </ScrollView>
              </View>
          </TouchableOpacity>
      </Modal>

      <Modal visible={checkinModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>CHECK-IN: <Text style={{ color: theme.accent }}>{selectedCheckin?.user?.name || 'Aluno'}</Text></Text>
                    <TouchableOpacity onPress={() => setCheckinModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.text}/></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{padding: 20}}>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.infoLabel}>DATA</Text><Text style={[styles.infoValue, { color: theme.text }]}>{new Date(selectedCheckin?.date).toLocaleDateString()}</Text></View>
                        <View style={[styles.infoBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.infoLabel}>PESO</Text><Text style={[styles.infoValue, { color: theme.text }]}>{selectedCheckin?.weight} kg</Text></View>
                    </View>
                    {selectedCheckin?.feedback && (
                        <View style={[styles.feedbackBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                            <Text style={styles.infoLabel}>FEEDBACK</Text>
                            <Text style={[styles.feedbackText, { color: theme.text }]}>"{selectedCheckin.feedback}"</Text>
                        </View>
                    )}
                    <Text style={[styles.infoLabel, {marginTop:20, marginBottom:10}]}>FOTOS</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {selectedCheckin?.photoFront && (
                            <View style={styles.photoContainer}>
                                <Image source={{uri: selectedCheckin.photoFront}} style={[styles.photo, { borderColor: theme.border }]} />
                                <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => handleDownloadPhoto(selectedCheckin.photoFront, 'FRENTE')}>
                                    <MaterialCommunityIcons name="download" size={16} color={theme.text} />
                                    <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {selectedCheckin?.photoSide && (
                            <View style={styles.photoContainer}>
                                <Image source={{uri: selectedCheckin.photoSide}} style={[styles.photo, { borderColor: theme.border }]} />
                                <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => handleDownloadPhoto(selectedCheckin.photoSide, 'LADO')}>
                                    <MaterialCommunityIcons name="download" size={16} color={theme.text} />
                                    <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {selectedCheckin?.photoBack && (
                            <View style={styles.photoContainer}>
                                <Image source={{uri: selectedCheckin.photoBack}} style={[styles.photo, { borderColor: theme.border }]} />
                                <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => handleDownloadPhoto(selectedCheckin.photoBack, 'COSTAS')}>
                                    <MaterialCommunityIcons name="download" size={16} color={theme.text} />
                                    <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </ScrollView>
            </View>
        </View>
      </Modal>

      <SendNoticeModal 
          visible={isNoticeModalOpen}
          onClose={() => setIsNoticeModalOpen(false)}
          alunos={alunosAtivos}
          adminId={adminId}
          theme={theme}
      />

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'android' ? 10 : 0, paddingHorizontal: 20, paddingBottom: 20, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#888', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' },
  logoutBtn: { padding: 10, borderRadius: 8, cursor: 'pointer' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  tab: { marginRight: 20, paddingBottom: 10, flexDirection:'row', alignItems:'center', gap:5, cursor: 'pointer' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  badgeCount: { backgroundColor:'#FF3B30', paddingHorizontal:6, borderRadius:10, height:16, justifyContent:'center', marginLeft:5 },
  badgeText: { color:'#FFF', fontSize:9, fontWeight:'bold' },
  
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 12, gap: 8 },
  inviteBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  searchBar: { padding: 15, borderRadius: 12, marginBottom: 15, marginHorizontal: 20, outlineStyle: 'none' },
  
  filterSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 20, paddingVertical: 15, borderRadius: 16, borderWidth: 1, marginBottom: 15 },
  filterSelectorVal: { fontSize: 13, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  catModalContent: { width: '100%', maxWidth: 360, borderRadius: 24, padding: 20, borderWidth: 1, maxHeight: '80%' },
  catOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12 },
  catOptionText: { fontSize: 14, fontWeight: '600' },

  subTabsContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, gap: 10 },
  subTab: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  subTabText: { fontSize: 12, fontWeight: 'bold' },

  feedCard: { padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  feedUser: { fontWeight: 'bold', fontSize: 14 },
  feedTime: { color: '#888', fontSize: 10, fontWeight:'bold' },
  feedAction: { color: '#888', fontSize: 13, marginTop: 2 },
  checkinFeedback: { color: '#888', fontSize: 12, fontStyle:'italic', marginTop: 4 },
  progBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 6, borderRadius: 4, marginTop: 6, gap: 4 },
  progText: { fontSize: 9, fontWeight: 'bold' },
  
  card: { padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, cursor: 'pointer' },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { fontWeight: 'bold', fontSize: 18 },
  alunoName: { fontWeight: 'bold', fontSize: 16 },
  alunoEmail: { color: '#888', fontSize: 12 },
  tagElite: { paddingHorizontal: 5, borderRadius: 4 },
  tagText: { fontSize: 8, fontWeight: '900' },
  empty: { color: '#888', textAlign: 'center', marginTop: 50 },
  
  gridGestao: { gap: 15 },
  bigCard: { padding: 25, borderRadius: 20, borderWidth: 1, alignItems: 'center', cursor: 'pointer' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  bigCardTitle: { fontSize: 18, fontWeight: '900', marginBottom: 5 },
  bigCardDesc: { color: '#888', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  cardHeaderSmall: { color:'#888', fontWeight:'bold', fontSize:12 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, maxHeight: '80%', borderWidth:1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth:1 },
  modalTitle: { fontWeight: 'bold', fontSize: 16 },
  infoRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  infoBox: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  infoLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  infoValue: { fontSize: 16, fontWeight: 'bold' },
  feedbackBox: { padding: 15, borderRadius: 8 },
  feedbackText: { fontStyle: 'italic', marginTop: 5 },
  
  photoContainer: { marginRight: 15, alignItems: 'center' },
  photo: { width: 120, height: 180, borderRadius: 8, borderWidth: 1 },
  photoLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, gap: 5, width: '100%' },
  downloadText: { fontSize: 10, fontWeight: '900' }
});