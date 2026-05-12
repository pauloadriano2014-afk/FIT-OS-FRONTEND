// src/screens/HomeScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
    StatusBar, RefreshControl, ActivityIndicator, Alert, Platform, Modal,
    Animated, Linking, Image, AppState
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../contexts/ThemeContext';

import LevelUpModal from '../components/LevelUpModal';
import HomeNoticeModal from '../components/HomeNoticeModal';
import ChatAIAssistantModal from '../components/ChatAIAssistantModal';
import DietGuideModal from '../components/DietGuideModal'; 
import StudentReportModal from '../components/StudentReportModal';
import InitialPhotosModal from '../components/InitialPhotosModal';
import SatisfactionSurveyModal from '../components/SatisfactionSurveyModal';

const QUICK_QUESTIONS = [
    "🤖 Como funciona a IA de Vídeo?",
    "🏋️‍♂️ Como marco as séries no treino?",
    "📈 Onde vejo minha Evolução?",
    "📸 Como fazer o Check-in?",
    "🚨 Estou com dor na articulação!"
];

export default function HomeScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const { theme } = useTheme();

    const [userName, setUserName] = useState('');
    const [userData, setUserData] = useState(null);
    const [userPlan, setUserPlan] = useState('PREMIUM'); 
    
    const [xp, setXp] = useState(0); 

    const [fichaDaysElapsed, setFichaDaysElapsed] = useState(0);
    const [daysToStart, setDaysToStart] = useState(0); 
    const [fichaExpiredModalVisible, setFichaExpiredModalVisible] = useState(false);
    const [isFichaPlaceholder, setIsFichaPlaceholder] = useState(false);
    const [dietModalVisible, setDietModalVisible] = useState(false); 

    const [hasSentInitialPhotos, setHasSentInitialPhotos] = useState(true); 
    const [initialPhotosModalVisible, setInitialPhotosModalVisible] = useState(false);
    
    const [isSurveyVisible, setIsSurveyVisible] = useState(false);

    const [isMenstruating, setIsMenstruating] = useState(false);
    const [togglingMenstrual, setTogglingMenstrual] = useState(false);

    const [isCheckinPending, setIsCheckinPending] = useState(false);
    const [isCheckinLate, setIsCheckinLate] = useState(false);
    const [scheduledCheckInDate, setScheduledCheckInDate] = useState(null);
    const [isEliteAwaitingCoach, setIsEliteAwaitingCoach] = useState(false); 
    const [disableCheckIn, setDisableCheckIn] = useState(false); 
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const appState = useRef(AppState.currentState);

    const [pendingFeedback, setPendingFeedback] = useState(null);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

    const [activeNotice, setActiveNotice] = useState(null);
    const [noticeModalVisible, setNoticeModalVisible] = useState(false);
    
    // 🔥 ESTADOS DA NOTIFICAÇÃO DE VÍDEO NOVO 🔥
    const [newVideoContent, setNewVideoContent] = useState(null);
    const [showVideoAlert, setShowVideoAlert] = useState(false);

    const [levelModalVisible, setLevelModalVisible] = useState(false);
    const [upsellModalVisible, setUpsellModalVisible] = useState(false);
    const [upsellFeature, setUpsellFeature] = useState('');

    const [chatVisible, setChatVisible] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([]); 
    const flatListRef = useRef(null);

    const currentLevel = Math.floor(xp / 1000) + 1;
    const nextLevelXP = 1000;
    const currentLevelProgress = xp % 1000;

    const getLevelData = (level) => {
        if (level <= 5) return { title: "Inimigo do Sofá 🛋️", desc: "Saiu da inércia. O começo é o mais difícil!" };
        if (level <= 10) return { title: "Em Obras 🚧", desc: "Está construindo o shape, tijolo por tijolo." };
        if (level <= 20) return { title: "Shape Carregando... ⏳", desc: "Já tem resultado visível. O download tá vindo!" };
        if (level <= 40) return { title: "Projeto Mutante 🧬", desc: "Ficou sério. Você já não é mais o mesmo." };
        return { title: "Dono da Academia 🔑", desc: "Você praticamente mora lá. Cadê sua chave?" };
    };
    const levelData = getLevelData(currentLevel);

    useFocusEffect(useCallback(() => { loadHomeData(); }, []));

    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                loadHomeData(); 
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (isCheckinPending || pendingFeedback || showVideoAlert) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isCheckinPending, pendingFeedback, showVideoAlert]);

    const handleHardReload = () => {
        setLoading(true);
        if (Platform.OS === 'web') {
            window.location.reload(true);
        } else {
            loadHomeData();
        }
    };

    const handleDismissVideoAlert = async () => {
        if (newVideoContent) {
            try {
                await AsyncStorage.setItem(`read_video_${newVideoContent.id}`, 'true');
                setShowVideoAlert(false);
            } catch (e) {
                console.log("Erro ao esconder banner de vídeo", e);
            }
        }
    };

    const loadHomeData = async () => {
      try {
        setLoading(true);
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
          
          const dbPlan = user.plan || 'PREMIUM';
          const resolvedPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(dbPlan) ? dbPlan : 'PREMIUM';
          setUserPlan(resolvedPlan);

          const firstName = user.name?.split(' ')[0] || 'Atleta';
          setUserName(firstName);
          
          if (messages.length === 0) {
              setMessages([{ id: 1, text: `Fala, ${firstName}! 👊 Sou o PA Coach AI. Use os botões abaixo se tiver alguma dúvida sobre o app ou treino.`, sender: 'ai' }]);
          }
          if (user.currentXP) setXp(user.currentXP);

          try {
              const t = Date.now();
              const [homeRes, checkinRes, noticeRes, resUserDirect, resContents] = await Promise.all([
                  fetch(`https://fitos-final.onrender.com/api/user/home?userId=${user.id}&t=${t}`),
                  fetch(`https://fitos-final.onrender.com/api/checkin?userId=${user.id}&t=${t}`),
                  fetch(`https://fitos-final.onrender.com/api/notices?userId=${user.id}&t=${t}`),
                  fetch(`https://fitos-final.onrender.com/api/admin/user/${user.id}?t=${t}`),
                  fetch(`https://fitos-final.onrender.com/api/contents?adminId=${user.adminId || 'master'}&t=${t}`) // 🔥 BUSCA CONTEÚDOS RECENTES
              ]);

              let fetchedUser = { ...user };
              let hasPhotosInDb = false;
              let checkinsData = [];
              let unreadFeedback = null;

              // 🔥 LÓGICA DO VÍDEO NOVO 🔥
              if (resContents.ok) {
                  const dataContents = await resContents.json();
                  if (Array.isArray(dataContents) && dataContents.length > 0) {
                      const latestContent = dataContents.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                      // Verifica se o vídeo tem menos de 7 dias
                      const createdDate = new Date(latestContent.createdAt);
                      const diffTime = Math.abs(new Date() - createdDate);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays <= 7) {
                          const hasReadVideo = await AsyncStorage.getItem(`read_video_${latestContent.id}`);
                          if (!hasReadVideo) {
                              setNewVideoContent(latestContent);
                              setShowVideoAlert(true);
                          }
                      }
                  }
              }

              if (checkinRes.ok) {
                  checkinsData = await checkinRes.json();
                  if (Array.isArray(checkinsData) && checkinsData.length > 0) {
                      hasPhotosInDb = true;
                      
                      const evaluated = checkinsData.filter(c => c.coachFeedback);
                      for (let c of evaluated) {
                          const isRead = await AsyncStorage.getItem(`read_feedback_${c.id}`);
                          if (!isRead) {
                              unreadFeedback = c;
                              break;
                          }
                      }
                      
                      if (unreadFeedback) {
                          setPendingFeedback(unreadFeedback);
                          setFeedbackModalVisible(true);
                      } else {
                          setPendingFeedback(null);
                      }
                  }
              }

              if (homeRes.ok) {
                  const homeData = await homeRes.json();
                  let directUserData = {};
                  if (resUserDirect.ok) directUserData = await resUserDirect.json();

                  if (homeData.user) {
                      const serverXP = homeData.user.currentXP || 0;
                      setXp(serverXP);
                      
                      fetchedUser = { ...user, currentXP: serverXP, ...homeData.user, ...directUserData };

                      const isAtiva = directUserData.isMenstruating !== undefined ? directUserData.isMenstruating : homeData.user?.isMenstruating;
                      setIsMenstruating(!!isAtiva);
                      
                      const serverPlan = fetchedUser.plan || 'PREMIUM';
                      const finalPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(serverPlan) ? serverPlan : 'PREMIUM';
                      setUserPlan(finalPlan); 
                      setDisableCheckIn(!!fetchedUser.disableCheckIn); 

                      const snoozedDate = await AsyncStorage.getItem(`@nps_snooze_${fetchedUser.id}`);
                      const todayStr = new Date().toISOString().split('T')[0];

                      if (fetchedUser.npsRequested && !unreadFeedback && snoozedDate !== todayStr) {
                          setTimeout(() => setIsSurveyVisible(true), 1000);
                      }
                      
                      if (finalPlan === 'FICHA_8S' || finalPlan === 'CHALLENGE_21' || finalPlan === 'LOW_COST') {
                          let startD = new Date(fetchedUser.createdAt || new Date());
                          const activeWorkouts = (fetchedUser.workouts || []).filter(w => !w.archived).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                          
                          if (activeWorkouts.length > 0) {
                              const currentWorkout = activeWorkouts[0];
                              startD = new Date(currentWorkout.startDate); 
                              setIsFichaPlaceholder(currentWorkout.name.includes("CONSTRUÇÃO") || !currentWorkout.routine || currentWorkout.routine.length === 0);
                          } else {
                              setIsFichaPlaceholder(true);
                          }
                          
                          startD.setHours(0,0,0,0);
                          const todayD = new Date(); todayD.setHours(0,0,0,0);
                          
                          const diffTime = todayD.getTime() - startD.getTime();
                          const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
                          
                          if (diffDays < 0) {
                              setDaysToStart(Math.abs(diffDays));
                              setFichaDaysElapsed(0);
                          } else {
                              setDaysToStart(0);
                              setFichaDaysElapsed(diffDays);
                          }
                          
                          const limit = finalPlan === 'CHALLENGE_21' ? 21 : 56;
                          if (diffDays >= limit && !isFichaPlaceholder && finalPlan !== 'LOW_COST') {
                              setFichaExpiredModalVisible(true);
                          }
                      }
                      
                      await AsyncStorage.setItem('user', JSON.stringify(fetchedUser));
                      setUserData(fetchedUser); 
                  }
              }

              if (noticeRes.ok) {
                  const notices = await noticeRes.json();
                  if (Array.isArray(notices) && notices.length > 0) {
                      const latestNotice = notices[0]; 
                      const hasRead = await AsyncStorage.getItem(`read_notice_${latestNotice.id}`);
                      if (!hasRead) { setActiveNotice(latestNotice); setNoticeModalVisible(true); }
                  }
              }

              let checkinPending = false;
              let checkinLate = false;
              let futureDateStr = null;
              let eliteAwaiting = false;

              setHasSentInitialPhotos(hasPhotosInDb);

              if (!fetchedUser.disableCheckIn && !unreadFeedback) { 
                  const today = new Date();
                  today.setHours(0,0,0,0);

                  if (!hasPhotosInDb) {
                      checkinPending = true; 
                  } else if (fetchedUser.nextCheckInDate) {
                      const targetDate = new Date(fetchedUser.nextCheckInDate);
                      targetDate.setHours(0,0,0,0);
                      
                      if (today.getTime() >= targetDate.getTime()) {
                          checkinPending = true;
                          const daysPast = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 3600 * 24));
                          if (daysPast >= 3) checkinLate = true; 
                      } else {
                          const dd = String(targetDate.getDate()).padStart(2,'0');
                          const mm = String(targetDate.getMonth()+1).padStart(2,'0');
                          const yyyy = targetDate.getFullYear();
                          futureDateStr = `${dd}/${mm}/${yyyy}`; 
                      }
                  } else {
                      if (resolvedPlan === 'PREMIUM') {
                          eliteAwaiting = true;
                      } else {
                          futureDateStr = null; 
                      }
                  }
              }

              setIsCheckinPending(checkinPending);
              setIsCheckinLate(checkinLate);
              setScheduledCheckInDate(futureDateStr);
              setIsEliteAwaitingCoach(eliteAwaiting);

          } catch (err) { console.log("Erro ao carregar dados críticos:", err); }
        } else {
            console.error("Usuário não encontrado no AsyncStorage na Home.");
        }
      } catch (e) { console.log("Erro geral loadHome:", e); } 
      finally { setLoading(false); setRefreshing(false); }
    };

    const toggleMenstrualCycle = async () => {
        if (!userData?.id || togglingMenstrual) return;
        setTogglingMenstrual(true);
        
        const newValue = !isMenstruating;
        setIsMenstruating(newValue); 

        const cachedUser = { ...userData, isMenstruating: newValue, menstruationStartDate: newValue ? new Date().toISOString() : null };
        await AsyncStorage.setItem('user', JSON.stringify(cachedUser));
        setUserData(cachedUser);

        try {
            let res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${userData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    isMenstruating: newValue,
                    menstruationStartDate: newValue ? new Date().toISOString() : null
                })
            });

            if (!res.ok) {
                res = await fetch('https://fitos-final.onrender.com/api/admin/user', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id: userData.id, 
                        isMenstruating: newValue,
                        menstruationStartDate: newValue ? new Date().toISOString() : null
                    })
                });
            }

            if (newValue && res.ok) {
                const title = "Sinalização Ativa 🩸";
                const msg = "Seu Coach foi notificado. Pegue leve, beba água e se cuide nesses dias!";
                if (Platform.OS === 'web') window.alert(title + "\n\n" + msg);
                else Alert.alert(title, msg);
            }
        } catch (e) {
            console.log("Erro de rede ao salvar:", e);
        } finally {
            setTogglingMenstrual(false);
        }
    };

    const handleReadNotice = async () => {
        if (activeNotice) { try { await AsyncStorage.setItem(`read_notice_${activeNotice.id}`, 'true'); } catch(e) {} }
        setNoticeModalVisible(false);
    };

    const markFeedbackAsRead = async () => {
        if (!pendingFeedback) return;
        setIsMarkingAsRead(true);
        try {
            await AsyncStorage.setItem(`read_feedback_${pendingFeedback.id}`, 'true');
            setFeedbackModalVisible(false);
            setPendingFeedback(null);
            loadHomeData(); 
        } catch (error) {
            console.error("Erro ao salvar leitura:", error);
            setFeedbackModalVisible(false); 
        } finally {
            setIsMarkingAsRead(false);
        }
    };

    const handleSendChat = async (quickMessage = null) => {
      const textToSend = typeof quickMessage === 'string' ? quickMessage : chatInput;
      if (!textToSend.trim()) return;

      const userMsg = { id: Date.now(), text: textToSend, sender: 'user' };
      setMessages(prev => [...prev, userMsg]);
      setChatInput('');
      setIsTyping(true);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

      try {
          const gender = userData?.anamneses?.[0]?.genero || userData?.gender || 'Não informado';
          const goal = userData?.anamneses?.[0]?.objetivo || userData?.goal || 'Melhorar o shape';

          const res = await fetch('https://fitos-final.onrender.com/api/ai/chat', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: userMsg.text, userId: userData.id, userName: userName, userGender: gender, userGoal: goal, userLevel: levelData.title })
          });
          const data = await res.json();
          
          if (data.reply) setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply, sender: 'ai' }]);
          else throw new Error("Sem resposta");
      } catch (error) {
          setMessages(prev => [...prev, { id: Date.now() + 1, text: "Falha na comunicação com a base, atleta.", sender: 'ai' }]);
      } finally {
          setIsTyping(false);
          setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      }
    };

    const openUpsell = (featureName) => { setUpsellFeature(featureName); setUpsellModalVisible(true); };

    const getPhotoModalContent = () => {
        switch (userPlan) {
            case 'PREMIUM': return { title: 'REGISTRE SEU PONTO DE PARTIDA 📸', desc: 'Para mapear sua evolução na Consultoria Elite, faça o seu primeiro registro. É rápido e 100% sigiloso.', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'FAZER DEPOIS', showEscape: true };
            case 'LOW_COST': return { title: 'FOTOS DE EVOLUÇÃO PENDENTES 📸', desc: 'Para acompanharmos sua progressão no plano, precisamos do seu registro inicial. Sem ele, a evolução não existe!', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'IR PARA O TREINO', showEscape: false };
            case 'FICHA_8S': return { title: 'FOTOS DO DIA 1 PENDENTES ⚠️', desc: 'Suas fotos de ponto de partida são essenciais para a avaliação de encerramento do Projeto. O envio é obrigatório para começar!', btnText: 'ENVIAR FOTOS DO DIA 1', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
            case 'CHALLENGE_21': return { title: 'FOTOS DO DIA 1 — OBRIGATÓRIAS ⚠️', desc: 'O Desafio de 21 Dias depende das fotos iniciais para medir o seu resultado final. Sem o "antes", não existe "depois".', btnText: 'ENVIAR FOTOS E COMEÇAR', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
            default: return { title: 'FOTOS PENDENTES 📸', desc: 'Envie suas fotos iniciais para mapearmos sua evolução.', btnText: 'ENVIAR FOTOS', escapeText: 'TREINAR MESMO ASSIM', showEscape: true };
        }
    };

    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const RootComponent = isWeb ? View : SafeAreaView;

    if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator color={theme.accent} size="large" /></View>;

    const limitDays = userPlan === 'CHALLENGE_21' ? 21 : 56;
    const isFichaExpired = (userPlan === 'FICHA_8S' || userPlan === 'CHALLENGE_21') && fichaDaysElapsed >= limitDays && !isFichaPlaceholder;
    const isWaitingStart = (userPlan === 'FICHA_8S' || userPlan === 'CHALLENGE_21' || userPlan === 'LOW_COST') && daysToStart > 0;
    
    const needsInitialPhoto = !hasSentInitialPhotos; 
    const photoModal = getPhotoModalContent();

    const g1 = String(userData?.gender).toUpperCase().trim();
    const g2 = String(userData?.anamneses?.[0]?.genero).toUpperCase().trim();
    const g3 = String(userData?.anamneses?.[0]?.gender).toUpperCase().trim();
    const g4 = String(userData?.anamneses?.[0]?.sexo).toUpperCase().trim();

    const femaleKeywords = ['FEMININO', 'F', 'FEMALE', 'MULHER'];
    const isFemale = femaleKeywords.includes(g1) || femaleKeywords.includes(g2) || femaleKeywords.includes(g3) || femaleKeywords.includes(g4);

    return (
      <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
            
            <ScrollView 
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); loadHomeData();}} tintColor={theme.accent}/>}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.greeting, { color: theme.textSecondary }]} numberOfLines={1}>
                      BEM-VINDO AO {userPlan === 'LOW_COST' ? 'PLANO BÁSICO' : (userPlan === 'FICHA_8S' ? 'PROJETO DE FICHAS' : (userPlan === 'CHALLENGE_21' ? 'DESAFIO 21 DIAS' : 'ELITE'))},
                  </Text>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                      {userName.toUpperCase()} ⚡
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity 
                        style={[styles.reloadBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                        onPress={handleHardReload}
                    >
                        <MaterialCommunityIcons name="refresh" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.statusBadge, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setLevelModalVisible(true)}>
                      <Text style={[styles.statusText, { color: theme.accent }]}>{levelData.title}</Text>
                    </TouchableOpacity>
                </View>
              </View>

              {/* 🔥 BANNER RADAR DE VÍDEO NOVO 🔥 */}
              {showVideoAlert && newVideoContent && (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%', marginBottom: 15 }}>
                      <TouchableOpacity 
                          style={[styles.photoBanner, { backgroundColor: theme.accent + '22', borderColor: theme.accent, padding: 16 }]} 
                          onPress={() => {
                              handleDismissVideoAlert();
                              navigation.navigate('Biblioteca'); // Manda para PA Flix
                          }} 
                          activeOpacity={0.8}
                      >
                          <MaterialCommunityIcons name="play-box-multiple" size={26} color={theme.accent} />
                          <View style={{flex: 1, marginLeft: 10}}>
                              <Text style={{color: theme.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>NOVA AULA NO PA FLIX</Text>
                              <Text style={{color: theme.accent, fontSize: 14, fontWeight: 'bold'}} numberOfLines={2}>{newVideoContent.title}</Text>
                          </View>
                          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.accent} />
                      </TouchableOpacity>
                  </Animated.View>
              )}

              {isFemale && (
                  <View style={[styles.photoBanner, { backgroundColor: isMenstruating ? '#FF3B3015' : theme.surface, borderColor: isMenstruating ? '#FF3B30' : theme.border, padding: 16, marginTop: -10, marginBottom: 20, alignItems: 'center' }]}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isMenstruating ? '#FF3B3033' : theme.accent + '15', justifyContent: 'center', alignItems: 'center' }}>
                          <MaterialCommunityIcons name={isMenstruating ? "water" : "water-outline"} size={24} color={isMenstruating ? '#FF3B30' : theme.accent} />
                      </View>
                      
                      <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                          <Text style={{ color: isMenstruating ? '#FF3B30' : theme.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>
                              {isMenstruating ? 'DELOAD MENSTRUAL' : 'PROTOCOLO MENSTRUAL'}
                          </Text>
                          <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold', marginTop: 2, lineHeight: 14 }}>
                              {isMenstruating ? 'Treino adaptado para proteção.' : 'Adapte a intensidade nestes dias.'}
                          </Text>
                          <TouchableOpacity 
                              style={{ marginTop: 6 }}
                              onPress={() => {
                                  const title = "A Ciência do Deload 🩸";
                                  const msg = "Durante o período menstrual, a queda hormonal afeta drasticamente sua força e recuperação muscular.\n\nAo sinalizar, o Coach recebe um alerta imediato e ajusta as cargas e o volume do seu treino (Deload).\n\nIsso protege suas articulações, evita frustrações e mantém seu progresso contínuo de forma inteligente!";
                                  if (Platform.OS === 'web') window.alert(title + "\n\n" + msg);
                                  else Alert.alert(title, msg);
                              }}
                          >
                              <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textDecorationLine: 'underline' }}>
                                  COMO FUNCIONA?
                              </Text>
                          </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity onPress={toggleMenstrualCycle} disabled={togglingMenstrual} style={{ marginLeft: 5 }}>
                          {togglingMenstrual ? (
                              <ActivityIndicator size="small" color={isMenstruating ? '#FF3B30' : theme.textSecondary} />
                          ) : (
                              <MaterialCommunityIcons name={isMenstruating ? "toggle-switch" : "toggle-switch-off-outline"} size={48} color={isMenstruating ? '#FF3B30' : theme.textSecondary} />
                          )}
                      </TouchableOpacity>
                  </View>
              )}

              {needsInitialPhoto && !pendingFeedback && !disableCheckIn && (
                  <TouchableOpacity style={[styles.photoBanner, { backgroundColor: '#FF3B3015', borderColor: '#FF3B30', padding: 16 }]} onPress={() => setInitialPhotosModalVisible(true)} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="alert" size={22} color="#FF3B30" />
                      <View style={{flex: 1, marginLeft: 5}}>
                          <Text style={{color: '#FF3B30', fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>AÇÃO OBRIGATÓRIA:</Text>
                          <Text style={{color: '#FF3B30', fontSize: 13, fontWeight: 'bold'}}>Envie sua foto de ponto de partida.</Text>
                      </View>
                      <MaterialCommunityIcons name="camera" size={20} color="#FF3B30" />
                  </TouchableOpacity>
              )}

              {isCheckinPending && !needsInitialPhoto && !pendingFeedback && !disableCheckIn && (
                  <TouchableOpacity style={[styles.photoBanner, { backgroundColor: isCheckinLate ? '#FF3B3015' : '#FF950015', borderColor: isCheckinLate ? '#FF3B30' : '#FF9500', padding: 16 }]} onPress={() => navigation.navigate('CheckIn')} activeOpacity={0.8}>
                      <MaterialCommunityIcons name={isCheckinLate ? "alert" : "camera-timer"} size={22} color={isCheckinLate ? '#FF3B30' : '#FF9500'} />
                      <View style={{flex: 1, marginLeft: 5}}>
                          <Text style={{color: isCheckinLate ? '#FF3B30' : '#FF9500', fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>O COACH ESTÁ TE ESPERANDO:</Text>
                          <Text style={{color: isCheckinLate ? '#FF3B30' : '#FF9500', fontSize: 13, fontWeight: 'bold'}}>{isCheckinLate ? 'Seu check-in está atrasado!' : 'Seu check-in foi liberado!'}</Text>
                      </View>
                      <MaterialCommunityIcons name="camera" size={20} color={isCheckinLate ? '#FF3B30' : '#FF9500'} />
                  </TouchableOpacity>
              )}

              {isEliteAwaitingCoach && !needsInitialPhoto && !pendingFeedback && !disableCheckIn && (
                  <View style={[styles.photoBanner, { backgroundColor: theme.accent + '15', borderColor: theme.accent, padding: 16 }]}>
                      <MaterialCommunityIcons name="check-circle" size={22} color={theme.accent} />
                      <View style={{flex: 1, marginLeft: 5}}>
                          <Text style={{color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>TUDO EM ORDEM:</Text>
                          <Text style={{color: theme.accent, fontSize: 13, fontWeight: 'bold'}}>Avaliação recebida! O Coach programará seu próximo check-in.</Text>
                      </View>
                  </View>
              )}

              {userPlan !== 'PREMIUM' && !scheduledCheckInDate && hasSentInitialPhotos && !pendingFeedback && !disableCheckIn && (
                  <View style={[styles.photoBanner, { backgroundColor: theme.textSecondary + '15', borderColor: theme.border, padding: 16 }]}>
                      <MaterialCommunityIcons name="calendar-lock" size={22} color={theme.textSecondary} />
                      <View style={{flex: 1, marginLeft: 5}}>
                          <Text style={{color: theme.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>STATUS DO PLANO:</Text>
                          <Text style={{color: theme.textSecondary, fontSize: 13, fontWeight: 'bold'}}>As próximas avaliações serão liberadas na data agendada.</Text>
                      </View>
                  </View>
              )}

              {scheduledCheckInDate && !isCheckinPending && !needsInitialPhoto && !pendingFeedback && !disableCheckIn && (
                  (() => {
                      const parts = scheduledCheckInDate.split('/');
                      const tDate = new Date(parts[2], parts[1] - 1, parts[0]);
                      const today = new Date(); today.setHours(0,0,0,0);
                      const diff = Math.ceil((tDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                      
                      let bg = 'rgba(50, 173, 230, 0.15)', border = '#32ADE6', icon = 'shield-check', text = `Seu próximo check-in será em ${diff} dias.`;
                      if (diff <= 3) { bg = 'rgba(255, 59, 48, 0.15)'; border = '#FF3B30'; icon = 'timer-sand'; text = `Atenção: Faltam apenas ${diff} dias para a avaliação!`; }
                      else if (diff <= 7) { bg = 'rgba(255, 149, 0, 0.15)'; border = '#FF9500'; icon = 'calendar-clock'; text = `Faltam ${diff} dias para enviar fotos.`; }

                      return (
                          <View style={[styles.photoBanner, { backgroundColor: bg, borderColor: border, padding: 16 }]}>
                              <MaterialCommunityIcons name={icon} size={22} color={border} />
                              <View style={{flex: 1, marginLeft: 5}}>
                                  <Text style={{color: border, fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>STATUS DA AVALIAÇÃO:</Text>
                                  <Text style={{color: border, fontSize: 13, fontWeight: 'bold'}}>{text}</Text>
                              </View>
                          </View>
                      );
                  })()
              )}

              {(userPlan === 'FICHA_8S' || userPlan === 'CHALLENGE_21') && !isFichaExpired && (
                  <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                          <Text style={[styles.levelText, { color: theme.accent }]}>{userPlan === 'CHALLENGE_21' ? 'CRONOGRAMA DO DESAFIO' : 'FICHA 8 SEMANAS'}</Text>
                          <Text style={[styles.xpText, { color: theme.textSecondary }]}>
                              {isWaitingStart ? `INICIA EM ${daysToStart} DIAS` : (isFichaPlaceholder ? 'PREPARANDO TREINO' : (userPlan === 'CHALLENGE_21' ? `DIA ${fichaDaysElapsed + 1} DE 21` : `SEMANA ${Math.min(8, Math.max(1, Math.ceil(fichaDaysElapsed / 7)))} DE 8`))}
                          </Text>
                      </View>
                      <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                          {fichaDaysElapsed > 0 && <View style={[styles.xpBarFill, { width: `${Math.min(100, (fichaDaysElapsed / limitDays) * 100)}%`, backgroundColor: theme.accent }]} />}
                      </View>
                  </View>
              )}

              {userPlan !== 'FICHA_8S' && userPlan !== 'CHALLENGE_21' && (
                  <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                          <Text style={[styles.levelText, { color: theme.accent }]}>NÍVEL {currentLevel}</Text>
                          <Text style={[styles.xpText, { color: theme.textSecondary }]}>{currentLevelProgress} / {nextLevelXP} XP</Text>
                      </View>
                      <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                          {currentLevelProgress > 0 && <View style={[styles.xpBarFill, { width: `${(currentLevelProgress/nextLevelXP)*100}%`, backgroundColor: theme.accent }]} />}
                      </View>
                  </View>
              )}

              {pendingFeedback ? (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <TouchableOpacity style={[styles.mainActionBtn, { backgroundColor: theme.accent, shadowColor: theme.accent, borderWidth: 0 }]} onPress={() => setFeedbackModalVisible(true)} activeOpacity={0.9}>
                          <View style={{flex: 1}}>
                              <Text style={[styles.actionLabel, { color: '#000' }]}>O COACH ANALISOU SUAS FOTOS</Text>
                              <Text style={[styles.actionTitle, { color: '#000', fontSize: 20 }]}>VER RELATÓRIO TÉCNICO</Text>
                          </View>
                          <View style={[styles.iconCircle, {backgroundColor: 'rgba(0,0,0,0.15)'}]}><MaterialCommunityIcons name="clipboard-text-search" size={28} color="#000" /></View>
                      </TouchableOpacity>
                  </Animated.View>
              ) : (
                  <TouchableOpacity 
                      style={[
                          styles.mainActionBtn, 
                          { 
                              backgroundColor: (isFichaExpired || isWaitingStart || needsInitialPhoto) ? theme.surface : theme.accent, 
                              shadowColor: (isFichaExpired || isWaitingStart || needsInitialPhoto) ? '#000' : theme.accent,
                              borderWidth: (isFichaExpired || isWaitingStart || needsInitialPhoto) ? 1 : 0,
                              borderColor: (isFichaExpired || isWaitingStart || needsInitialPhoto) ? theme.border : 'transparent'
                          }
                      ]} 
                      onPress={() => { 
                          if (isFichaExpired) setFichaExpiredModalVisible(true);
                          else if (isWaitingStart) Alert.alert("Aguarde", `Seu treino será liberado em ${daysToStart} dias.`);
                          else if (needsInitialPhoto) setInitialPhotosModalVisible(true);
                          else navigation.navigate('Treinos'); 
                      }} 
                      activeOpacity={0.9}
                  >
                      <View>
                          <Text style={[styles.actionLabel, { color: (isFichaExpired || isWaitingStart || needsInitialPhoto) ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF') }]}>
                              {isFichaExpired ? 'CICLO ENCERRADO' : (isWaitingStart ? 'STATUS ATUAL' : (needsInitialPhoto ? 'FOTOS PENDENTES' : 'SEU OBJETIVO DE HOJE'))}
                          </Text>
                          <Text style={[styles.actionTitle, { color: (isFichaExpired || isWaitingStart || needsInitialPhoto) ? theme.text : (theme.isDark ? '#000' : '#FFF') }]}>
                              {isFichaExpired ? 'PRÓXIMOS PASSOS' : (isWaitingStart ? 'AGUARDANDO DATA' : (needsInitialPhoto ? 'ENVIO OBRIGATÓRIO' : 'INICIAR TREINO'))}
                          </Text>
                      </View>
                      <View style={[styles.iconCircle, (isFichaExpired || isWaitingStart || needsInitialPhoto) && {backgroundColor: theme.bg}]}>
                          <MaterialCommunityIcons name={isWaitingStart ? "clock-outline" : (isFichaExpired ? "whatsapp" : (needsInitialPhoto ? "camera-timer" : "dumbbell"))} size={28} color={(isFichaExpired || isWaitingStart || needsInitialPhoto) ? theme.accent : (theme.isDark ? '#000' : '#FFF')} />
                      </View>
                  </TouchableOpacity>
              )}

              {(userPlan === 'CHALLENGE_21' || (userData?.dietGoal && userData.dietGoal !== 'NONE')) && (
                  <TouchableOpacity style={[styles.mainActionBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, padding: 20, marginBottom: 15, elevation: 0 }]} onPress={() => setDietModalVisible(true)} activeOpacity={0.9}>
                      <View style={{flex: 1}}>
                          <Text style={[styles.actionLabel, { color: theme.accent }]}>ESTRATÉGIA DO COACH</Text>
                          <Text style={[styles.actionTitle, { color: theme.text, fontSize: 18 }]}>SUGESTÃO ALIMENTAR 🥗</Text>
                      </View>
                      <View style={[styles.iconCircle, {backgroundColor: theme.accent + '22'}]}><MaterialCommunityIcons name="food-apple" size={28} color={theme.accent} /></View>
                  </TouchableOpacity>
              )}

              <View style={styles.gridContainer}>
                  <Animated.View style={{ transform: [{ scale: pendingFeedback ? 1 : pulseAnim }], width: '48%', marginBottom: 15 }}>
                      <TouchableOpacity 
                          style={[styles.gridItem, { width: '100%', marginBottom: 0, backgroundColor: theme.surface, borderColor: (isCheckinPending && !disableCheckIn) ? (isCheckinLate ? '#FF3B30' : '#FF9500') : theme.border }]} 
                          onPress={() => {
                              if (disableCheckIn) return navigation.navigate('CheckIn');
                              if (userPlan === 'PREMIUM' || needsInitialPhoto || isCheckinPending) navigation.navigate('CheckIn');
                              else Alert.alert("Acesso Bloqueado", "O Coach precisa liberar o seu próximo check-in no sistema.");
                          }}
                      >
                          {(isCheckinPending && !disableCheckIn) && <View style={[styles.notificationDot, { borderColor: theme.bg }]} />}
                          <View style={[styles.gridIcon, { backgroundColor: theme.accent + '33' }]}><MaterialCommunityIcons name={(userPlan === 'PREMIUM' || disableCheckIn || needsInitialPhoto || isCheckinPending) ? "camera-plus" : "camera-off"} size={24} color={theme.accent} /></View>
                          <Text style={[styles.gridText, { color: theme.text }]}>{(userPlan === 'PREMIUM' || disableCheckIn) ? 'Check-in Livre' : 'Fotos do Shape'}</Text>
                      </TouchableOpacity>
                  </Animated.View>
                  <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('Evolução')}>
                      <View style={[styles.gridIcon, { backgroundColor: 'rgba(50, 173, 230, 0.2)' }]}><MaterialCommunityIcons name="chart-line" size={24} color="#32ADE6" /></View>
                      <Text style={[styles.gridText, { color: theme.text }]}>Evolução</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('UserHistory')}>
                      <View style={[styles.gridIcon, { backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}><MaterialCommunityIcons name="history" size={24} color="#FF3B30" /></View>
                      <Text style={[styles.gridText, { color: theme.text }]}>Histórico</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('Biblioteca')}>
                      <View style={[styles.gridIcon, { backgroundColor: 'rgba(255, 149, 0, 0.2)' }]}><MaterialCommunityIcons name="play-box-multiple" size={24} color="#FF9500" /></View>
                      <Text style={[styles.gridText, { color: theme.text }]}>PA Flix</Text>
                  </TouchableOpacity>
              </View>

              <View style={styles.footerContainer}>
                  <Text style={[styles.footerText, { color: theme.text }]}>PA TEAM</Text>
                  <Text style={[styles.footerSubText, { color: theme.textSecondary }]}>CONSULTORIA DE PERFORMANCE</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.fabChat, { shadowColor: userPlan === 'PREMIUM' ? theme.accent : '#000' }]} onPress={() => userPlan === 'PREMIUM' ? setChatVisible(true) : openUpsell('Chat Direto com o Coach')}>
              <LinearGradient colors={userPlan === 'PREMIUM' ? [theme.accent, theme.accent] : [theme.surface, theme.surface]} style={[styles.fabGradient, userPlan !== 'PREMIUM' && {borderWidth: 1, borderColor: theme.border}]}>
                  {userPlan === 'PREMIUM' ? <MaterialCommunityIcons name="robot" size={32} color={theme.isDark ? '#000' : '#FFF'} /> : <MaterialCommunityIcons name="lock" size={28} color={theme.textSecondary} />}
              </LinearGradient>
            </TouchableOpacity>
        </View>

        <StudentReportModal 
            visible={feedbackModalVisible} 
            onClose={() => setFeedbackModalVisible(false)}
            pendingFeedback={pendingFeedback}
            userName={userName}
            markFeedbackAsRead={markFeedbackAsRead}
            isMarkingAsRead={isMarkingAsRead}
        />

        <InitialPhotosModal 
            visible={initialPhotosModalVisible}
            onClose={() => setInitialPhotosModalVisible(false)}
            theme={theme}
            photoModal={photoModal}
            userPlan={userPlan}
            onNavigate={() => { setInitialPhotosModalVisible(false); navigation.navigate('CheckIn'); }}
        />

        <SatisfactionSurveyModal 
            visible={isSurveyVisible} 
            onClose={() => setIsSurveyVisible(false)} 
            userId={userData?.id} 
            theme={theme}
            isPremium={userPlan === 'PREMIUM' || userPlan === 'ELITE'} 
        />

        <Modal visible={upsellModalVisible} transparent animationType="fade">
            <View style={styles.chatModalOverlay}>
                <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                    <TouchableOpacity style={styles.upsellClose} onPress={() => setUpsellModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
                    <View style={[styles.levelIconBox, { backgroundColor: theme.accent + '22', marginBottom: 20 }]}><MaterialCommunityIcons name="crown" size={36} color={theme.accent} /></View>
                    <Text style={[styles.upsellTitle, { color: theme.text }]}>FUNCIONALIDADE ELITE</Text>
                    <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>O recurso de <Text style={{color: theme.accent, fontWeight: 'bold'}}>{upsellFeature}</Text> é exclusivo para atletas da Consultoria Elite.</Text>
                    <View style={[styles.upsellBenefits, { backgroundColor: theme.bg, borderColor: theme.border }]}><View style={styles.upsellBenefitRow}><MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} /><Text style={[styles.upsellBenefitText, { color: theme.text }]}>Ajuste de Treino Sob Medida</Text></View><View style={styles.upsellBenefitRow}><MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} /><Text style={[styles.upsellBenefitText, { color: theme.text }]}>Avaliação Quinzenal do Shape</Text></View><View style={styles.upsellBenefitRow}><MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} /><Text style={[styles.upsellBenefitText, { color: theme.text }]}>Acesso direto ao Coach</Text></View></View>
                    <TouchableOpacity style={styles.upsellBtn} onPress={() => { setUpsellModalVisible(false); Linking.openURL("https://wa.me/5541997991346?text=Coach, quero ser Elite!"); }}><Text style={styles.upsellBtnText}>SER ELITE AGORA</Text><MaterialCommunityIcons name="whatsapp" size={20} color="#000" style={{marginLeft: 8}}/></TouchableOpacity>
                </View>
            </View>
        </Modal>

        <DietGuideModal visible={dietModalVisible} onClose={() => setDietModalVisible(false)} theme={theme} dietGoal={userPlan === 'CHALLENGE_21' ? 'WEIGHT_LOSS' : userData?.dietGoal} />
        <LevelUpModal visible={levelModalVisible} onClose={() => setLevelModalVisible(false)} theme={theme} levelData={levelData} currentLevel={currentLevel} currentLevelProgress={currentLevelProgress} nextLevelXP={nextLevelXP} />
        <HomeNoticeModal visible={noticeModalVisible} onClose={handleReadNotice} theme={theme} activeNotice={activeNotice} />
        <ChatAIAssistantModal visible={chatVisible} onClose={() => setChatVisible(false)} theme={theme} isWeb={isWeb} messages={messages} flatListRef={flatListRef} chatInput={chatInput} setChatInput={setChatInput} handleSendChat={handleSendChat} isTyping={isTyping} QUICK_QUESTIONS={QUICK_QUESTIONS} />
      </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
    greeting: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    
    reloadBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    
    statusBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
    statusText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
    photoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
    xpCard: { padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1 },
    levelText: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    xpText: { fontSize: 11, fontWeight: 'bold' },
    xpBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    xpBarFill: { height: '100%', borderRadius: 4 },
    mainActionBtn: { padding: 25, borderRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
    actionLabel: { fontSize: 11, fontWeight: '900', opacity: 0.8, marginBottom: 4, letterSpacing: 0.5 },
    actionTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    iconCircle: { width: 54, height: 54, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 15 },
    gridItem: { width: '48%', padding: 18, borderRadius: 24, alignItems: 'center', borderWidth: 1, marginBottom: 15 },
    gridIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    gridText: { fontSize: 11, fontWeight: 'bold' },
    notificationDot: { position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF3B30', borderWidth: 2, zIndex: 10 },
    footerContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
    footerText: { fontWeight: '900', fontSize: 16, letterSpacing: 1.5 },
    footerSubText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },
    fabChat: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, zIndex: 999, elevation: 10, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
    fabGradient: { width: '100%', height: '100%', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    chatModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    levelIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    upsellCard: { width: '90%', maxWidth: 420, alignSelf: 'center', padding: 25, borderRadius: 24, borderWidth: 2, alignItems: 'center' },
    upsellClose: { position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 10 },
    upsellTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, letterSpacing: 1, textAlign: 'center' },
    upsellDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    upsellBenefits: { width: '100%', padding: 15, borderRadius: 16, borderWidth: 1, gap: 12, marginBottom: 25 },
    upsellBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    upsellBenefitText: { fontSize: 13, fontWeight: 'bold' },
    upsellBtn: { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    upsellBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});