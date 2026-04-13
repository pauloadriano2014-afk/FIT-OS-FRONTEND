// src/screens/HomeScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  StatusBar, RefreshControl, ActivityIndicator, Alert, Platform, Modal,
  Animated, Linking, Image
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

  const [isCheckinPending, setIsCheckinPending] = useState(false);
  const [isCheckinLate, setIsCheckinLate] = useState(false);
  const [scheduledCheckInDate, setScheduledCheckInDate] = useState(null);
  const [isEliteAwaitingCoach, setIsEliteAwaitingCoach] = useState(false); 
  const [disableCheckIn, setDisableCheckIn] = useState(false); 
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const [activeNotice, setActiveNotice] = useState(null);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
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
      if (isCheckinPending || pendingFeedback) {
          Animated.loop(
              Animated.sequence([
                  Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                  Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
              ])
          ).start();
      } else {
          pulseAnim.setValue(1);
      }
  }, [isCheckinPending, pendingFeedback]);

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
            const [homeRes, checkinRes, noticeRes, resUserDirect] = await Promise.all([
                fetch(`https://fitos-final.onrender.com/api/user/home?userId=${user.id}&t=${t}`),
                fetch(`https://fitos-final.onrender.com/api/checkin?userId=${user.id}&t=${t}`),
                fetch(`https://fitos-final.onrender.com/api/notices?userId=${user.id}&t=${t}`),
                fetch(`https://fitos-final.onrender.com/api/admin/user/${user.id}?t=${t}`)
            ]);

            let fetchedUser = { ...user };
            let hasPhotosInDb = false;
            let checkinsData = [];
            let unreadFeedback = null;

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
                    
                    const serverPlan = fetchedUser.plan || 'PREMIUM';
                    const finalPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(serverPlan) ? serverPlan : 'PREMIUM';
                    setUserPlan(finalPlan); 
                    setDisableCheckIn(!!fetchedUser.disableCheckIn); 
                    
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

  // 🔥 DECODIFICADOR DO CÓDIGO OCULTO DE COMPARAÇÃO 🔥
  let rawFeedbackText = pendingFeedback?.coachFeedback || '';
  let displayFeedbackText = rawFeedbackText;
  let compareOldPhotos = [];
  
  if (rawFeedbackText.includes('[COMPARE:')) {
      const match = rawFeedbackText.match(/\[COMPARE:(.*?)\]/);
      if (match) {
          compareOldPhotos = match[1].split('|');
          displayFeedbackText = rawFeedbackText.replace(match[0], '').trim();
      }
  }
  const currentPhotosKeys = ['photoFront', 'photoSide', 'photoBack'];

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator color={theme.accent} size="large" /></View>;

  const limitDays = userPlan === 'CHALLENGE_21' ? 21 : 56;
  const isFichaExpired = (userPlan === 'FICHA_8S' || userPlan === 'CHALLENGE_21') && fichaDaysElapsed >= limitDays && !isFichaPlaceholder;
  const isWaitingStart = (userPlan === 'FICHA_8S' || userPlan === 'CHALLENGE_21' || userPlan === 'LOW_COST') && daysToStart > 0;
  
  const needsInitialPhoto = !hasSentInitialPhotos; 
  const photoModal = getPhotoModalContent();

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
              
              <TouchableOpacity style={[styles.statusBadge, { backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }]} onPress={() => setLevelModalVisible(true)}>
                <Text style={[styles.statusText, { color: theme.accent }]}>{levelData.title}</Text>
              </TouchableOpacity>
            </View>

            {needsInitialPhoto && !pendingFeedback && !disableCheckIn && (
                <TouchableOpacity 
                    style={[styles.photoBanner, { backgroundColor: '#FF3B3015', borderColor: '#FF3B30', padding: 16 }]}
                    onPress={() => setInitialPhotosModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="alert" size={22} color="#FF3B30" />
                    <View style={{flex: 1, marginLeft: 5}}>
                        <Text style={{color: '#FF3B30', fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>AÇÃO OBRIGATÓRIA:</Text>
                        <Text style={{color: '#FF3B30', fontSize: 13, fontWeight: 'bold'}}>Envie sua foto de ponto de partida.</Text>
                    </View>
                    <MaterialCommunityIcons name="camera" size={20} color="#FF3B30" />
                </TouchableOpacity>
            )}

            {isCheckinPending && !needsInitialPhoto && !pendingFeedback && !disableCheckIn && (
                <TouchableOpacity 
                    style={[styles.photoBanner, { backgroundColor: isCheckinLate ? '#FF3B3015' : '#FF950015', borderColor: isCheckinLate ? '#FF3B30' : '#FF9500', padding: 16 }]}
                    onPress={() => navigation.navigate('CheckIn')}
                    activeOpacity={0.8}
                >
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
                        {fichaDaysElapsed > 0 && (
                            <View style={[styles.xpBarFill, { width: `${Math.min(100, (fichaDaysElapsed / limitDays) * 100)}%`, backgroundColor: theme.accent }]} />
                        )}
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
                        {currentLevelProgress > 0 && (
                            <View style={[styles.xpBarFill, { width: `${(currentLevelProgress/nextLevelXP)*100}%`, backgroundColor: theme.accent }]} />
                        )}
                    </View>
                </View>
            )}

            {pendingFeedback ? (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity 
                        style={[styles.mainActionBtn, { backgroundColor: theme.accent, shadowColor: theme.accent, borderWidth: 0 }]} 
                        onPress={() => setFeedbackModalVisible(true)} 
                        activeOpacity={0.9}
                    >
                        <View style={{flex: 1}}>
                            <Text style={[styles.actionLabel, { color: '#000' }]}>O COACH ANALISOU SUAS FOTOS</Text>
                            <Text style={[styles.actionTitle, { color: '#000', fontSize: 20 }]}>VER RELATÓRIO TÉCNICO</Text>
                        </View>
                        <View style={[styles.iconCircle, {backgroundColor: 'rgba(0,0,0,0.15)'}]}>
                            <MaterialCommunityIcons name="clipboard-text-search" size={28} color="#000" />
                        </View>
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
                        <MaterialCommunityIcons 
                            name={isWaitingStart ? "clock-outline" : (isFichaExpired ? "whatsapp" : (needsInitialPhoto ? "camera-timer" : "dumbbell"))} 
                            size={28} 
                            color={(isFichaExpired || isWaitingStart || needsInitialPhoto) ? theme.accent : (theme.isDark ? '#000' : '#FFF')} 
                        />
                    </View>
                </TouchableOpacity>
            )}

            {(userPlan === 'CHALLENGE_21' || (userData?.dietGoal && userData.dietGoal !== 'NONE')) && (
                <TouchableOpacity 
                    style={[styles.mainActionBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, padding: 20, marginBottom: 15, elevation: 0 }]} 
                    onPress={() => setDietModalVisible(true)}
                    activeOpacity={0.9}
                >
                    <View style={{flex: 1}}>
                        <Text style={[styles.actionLabel, { color: theme.accent }]}>ESTRATÉGIA DO COACH</Text>
                        <Text style={[styles.actionTitle, { color: theme.text, fontSize: 18 }]}>SUGESTÃO ALIMENTAR 🥗</Text>
                    </View>
                    <View style={[styles.iconCircle, {backgroundColor: theme.accent + '22'}]}>
                        <MaterialCommunityIcons name="food-apple" size={28} color={theme.accent} />
                    </View>
                </TouchableOpacity>
            )}

            <View style={styles.gridContainer}>
                <Animated.View style={{ transform: [{ scale: pendingFeedback ? 1 : pulseAnim }], width: '48%', marginBottom: 15 }}>
                    <TouchableOpacity 
                        style={[styles.gridItem, { width: '100%', marginBottom: 0, backgroundColor: theme.surface, borderColor: (isCheckinPending && !disableCheckIn) ? (isCheckinLate ? '#FF3B30' : '#FF9500') : theme.border }]} 
                        onPress={() => {
                            if (disableCheckIn) {
                                navigation.navigate('CheckIn');
                                return;
                            }
                            if (userPlan === 'PREMIUM' || needsInitialPhoto || isCheckinPending) {
                                navigation.navigate('CheckIn');
                            } else {
                                Alert.alert("Acesso Bloqueado", "O Coach precisa liberar o seu próximo check-in no sistema.");
                            }
                        }}
                    >
                        {(isCheckinPending && !disableCheckIn) && <View style={[styles.notificationDot, { borderColor: theme.bg }]} />}
                        <View style={[styles.gridIcon, { backgroundColor: theme.accent + '33' }]}>
                            <MaterialCommunityIcons name={(userPlan === 'PREMIUM' || disableCheckIn || needsInitialPhoto || isCheckinPending) ? "camera-plus" : "camera-off"} size={24} color={theme.accent} />
                        </View>
                        <Text style={[styles.gridText, { color: theme.text }]}>
                            {(userPlan === 'PREMIUM' || disableCheckIn) ? 'Check-in Livre' : 'Fotos do Shape'}
                        </Text>
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

      {/* 🔥 MODAL DE RELATÓRIO TÉCNICO (RENDERIZADOR INTELIGENTE: ANTES E DEPOIS) 🔥 */}
      <Modal visible={feedbackModalVisible} transparent animationType="slide">
          <View style={styles.chatModalOverlay}>
              <View style={[styles.reportModalContent, { backgroundColor: '#111' }]}>
                  <View style={[styles.reportHeader, { flexDirection: 'column', alignItems: 'center', paddingBottom: 25, position: 'relative', borderBottomColor: '#333' }]}>
                      <TouchableOpacity style={{position: 'absolute', right: 20, top: 20, zIndex: 10}} onPress={() => setFeedbackModalVisible(false)}>
                          <MaterialCommunityIcons name="close" size={28} color="#AAA" />
                      </TouchableOpacity>
                      <View style={{ alignItems: 'center', marginTop: 10 }}>
                          <Text style={[styles.reportTitle, { color: '#FFF', fontSize: 22, textAlign: 'center' }]}>RELATÓRIO TÉCNICO</Text>
                          <Text style={[styles.reportSubtitle, { color: '#4DE38F', fontWeight: 'bold', letterSpacing: 1, textAlign: 'center', marginTop: 4 }]}>ALUNO(A): {userName.toUpperCase()}</Text>
                      </View>
                      <View style={{ marginTop: 15, backgroundColor: '#4DE38F22', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 10 }}>
                          <Text style={{ color: '#4DE38F', fontSize: 11, fontWeight: '900' }}>
                              DATA: {pendingFeedback?.date ? new Date(pendingFeedback.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase() : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                          </Text>
                      </View>
                  </View>

                  <ScrollView style={{flex: 1}} contentContainerStyle={{ padding: 25, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
                      
                      {/* 🔥 SISTEMA DE RENDERIZAÇÃO DE FOTOS 🔥 */}
                      {compareOldPhotos.length > 0 ? (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20, marginBottom: 30 }}>
                              {currentPhotosKeys.map((key, i) => {
                                  const currentPic = pendingFeedback?.[key];
                                  const oldPic = compareOldPhotos[i];
                                  if (!currentPic && (!oldPic || oldPic === 'null' || oldPic === '')) return null;

                                  const label = i === 0 ? 'FRONTAL' : (i === 1 ? 'LATERAL' : 'POSTERIOR');

                                  return (
                                      <View key={i} style={{ flexDirection: 'row', gap: 2, backgroundColor: '#1A1A1A', padding: 8, borderRadius: 16, borderWidth: 1, borderColor: '#333' }}>
                                          {oldPic && oldPic !== 'null' && oldPic !== '' && (
                                              <View style={{ width: 130, height: 200, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                                                  <Image source={{ uri: oldPic }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                                  <View style={{ position: 'absolute', bottom: 8, alignSelf: 'center', backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                      <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>ANTES ({label})</Text>
                                                  </View>
                                              </View>
                                          )}
                                          {currentPic && (
                                              <View style={{ width: 130, height: 200, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                                                  <Image source={{ uri: currentPic }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                                  <View style={{ position: 'absolute', bottom: 8, alignSelf: 'center', backgroundColor: '#4DE38F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                      <Text style={{ color: '#000', fontSize: 8, fontWeight: '900' }}>DEPOIS ({label})</Text>
                                                  </View>
                                              </View>
                                          )}
                                      </View>
                                  );
                              })}
                          </ScrollView>
                      ) : (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, marginBottom: 30 }}>
                              {currentPhotosKeys.map((key, i) => (
                                  pendingFeedback?.[key] && (
                                      <View key={i} style={styles.reportPhotoContainer}>
                                          <Image source={{ uri: pendingFeedback[key] }} style={styles.reportPhotoImg} resizeMode="cover" />
                                          <View style={[styles.reportPhotoBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.reportPhotoBadgeText, {color:'#000'}]}>{key === 'photoFront' ? 'VISTA FRONTAL' : key === 'photoSide' ? 'VISTA LATERAL' : 'VISTA POSTERIOR'}</Text></View>
                                      </View>
                                  )
                              ))}
                          </ScrollView>
                      )}

                      <View style={styles.reportDivider} />
                      <Text style={[styles.reportSectionTitle, { color: '#4DE38F' }]}>ANÁLISE DETALHADA</Text>
                      <View style={{ marginTop: 10, marginBottom: 10 }}>
                          {displayFeedbackText.split('\n').map((paragraph, index) => {
                              const parts = paragraph.split(/(\*[^*]+\*)/g);
                              return (
                                  <Text key={index} style={[styles.reportText, { color: '#DDD' }]}>{parts.map((part, i) => {
                                          if (part.startsWith('*') && part.endsWith('*')) return <Text key={i} style={{ fontWeight: '900', color: '#FFF' }}>{part.slice(1, -1)}</Text>;
                                          return part;
                                      })}
                                  </Text>
                              );
                          })}
                      </View>
                      
                      <View style={[styles.reportFooter, { backgroundColor: '#1A1A1A', borderColor: '#333', marginTop: 30, padding: 20, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}>
                          <Image source={require('../../assets/paulo-foto-perfil.png')} style={{ width: 60, height: 60, borderRadius: 30, marginRight: 15, borderWidth: 2, borderColor: '#4DE38F' }} />
                          <View style={{ flex: 1 }}>
                              <Text style={[styles.coachName, { color: '#FFF', fontWeight: '900', fontSize: 16 }]}>PAULO ADRIANO</Text>
                              <Text style={[styles.coachTitle, { color: '#AAA', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }]}>COACH & TREINADOR ELITE</Text>
                          </View>
                          <Image source={require('../../assets/logo-pa.png')} style={{ width: 45, height: 45 }} resizeMode="contain" />
                      </View>

                      <TouchableOpacity style={[styles.upsellBtn, {backgroundColor: '#4DE38F', marginTop: 30, marginBottom: 20}]} onPress={markFeedbackAsRead} disabled={isMarkingAsRead}>
                          {isMarkingAsRead ? <ActivityIndicator color="#000" /> : <Text style={[styles.upsellBtnText, {color: '#000'}]}>COMPREENDIDO, COACH! 👊</Text>}
                      </TouchableOpacity>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      <Modal visible={initialPhotosModalVisible} transparent animationType="fade">
          <View style={styles.chatModalOverlay}>
              <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: (userPlan === 'CHALLENGE_21' || userPlan === 'FICHA_8S') ? '#FF9500' : theme.accent }]}>
                  {photoModal.showEscape && (
                      <TouchableOpacity style={styles.upsellClose} onPress={() => setInitialPhotosModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
                  )}
                  <View style={[styles.levelIconBox, { backgroundColor: (userPlan === 'CHALLENGE_21' || userPlan === 'FICHA_8S') ? '#FF950022' : theme.accent + '22', marginBottom: 20 }]}><MaterialCommunityIcons name="camera-timer" size={36} color={(userPlan === 'CHALLENGE_21' || userPlan === 'FICHA_8S') ? '#FF9500' : theme.accent} /></View>
                  <Text style={[styles.upsellTitle, { color: theme.text }]}>{photoModal.title}</Text>
                  <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>{photoModal.desc}</Text>
                  <TouchableOpacity style={[styles.upsellBtn, {backgroundColor: theme.accent, marginBottom: 10}]} onPress={() => { setInitialPhotosModalVisible(false); navigation.navigate('CheckIn'); }}>
                      <MaterialCommunityIcons name="camera" size={20} color={theme.isDark ? '#000' : '#FFF'} style={{marginRight: 8}}/>
                      <Text style={[styles.upsellBtnText, {color: theme.isDark ? '#000' : '#FFF'}]}>{photoModal.btnText}</Text>
                  </TouchableOpacity>
                  {photoModal.showEscape && (
                      <TouchableOpacity style={{padding: 15, alignItems: 'center'}} onPress={() => { setInitialPhotosModalVisible(false); }}>
                          <Text style={{color: theme.textSecondary, fontWeight: 'bold', fontSize: 12, textDecorationLine: 'underline'}}>{photoModal.escapeText}</Text>
                      </TouchableOpacity>
                  )}
              </View>
          </View>
      </Modal>

      <Modal visible={upsellModalVisible} transparent animationType="fade">
          <View style={styles.chatModalOverlay}>
              <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                  <TouchableOpacity style={styles.upsellClose} onPress={() => setUpsellModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
                  <View style={[styles.levelIconBox, { backgroundColor: theme.accent + '22', marginBottom: 20 }]}><MaterialCommunityIcons name="crown" size={36} color={theme.accent} /></View>
                  <Text style={[styles.upsellTitle, { color: theme.text }]}>FUNCIONALIDADE ELITE</Text>
                  <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>O recurso de <Text style={{color: theme.accent, fontWeight: 'bold'}}>{upsellFeature}</Text> é exclusivo para atletas da Consultoria Elite.</Text>
                  <View style={[styles.upsellBenefits, { backgroundColor: theme.bg, borderColor: theme.border }]}><View style={styles.upsellBenefitRow}><MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} /><Text style={[styles.upsellBenefitText, { color: theme.text }]}>Ajuste de Treino Sob Medida</Text></View><View style={styles.upsellBenefitRow}><MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} /><Text style={[styles.upsellBenefitText, { color: theme.text }]}>Avaliação Quinzenal do Shape</Text></View><View style={styles.upsellBenefitRow}><MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} /><Text style={[styles.upsellBenefitText, { color: theme.text }]}>Acesso direto ao Coach</Text></View></View>
                  <TouchableOpacity style={styles.upsellBtn} onPress={() => { setUpsellModalVisible(false); Linking.openURL("https://wa.me/5541997991346?text=Coach, quero ser Elite!"); }}><Text style={styles.upsellBtnText}>SER ELITE AGORA</Text><MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" style={{marginLeft: 8}}/></TouchableOpacity>
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
  upsellBtn: { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  upsellBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  reportModalContent: { width: '100%', height: '100%', maxWidth: 500, alignSelf: 'center', overflow: 'hidden' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 40, borderBottomWidth: 1 },
  reportTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  reportSubtitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  reportPhotoContainer: { width: 220, height: 320, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', position: 'relative' },
  reportPhotoImg: { width: '100%', height: '100%' },
  reportPhotoBadge: { position: 'absolute', bottom: 15, alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  reportPhotoBadgeText: { fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  reportDivider: { height: 1, backgroundColor: '#333', width: '100%', marginBottom: 30 },
  reportSectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  reportText: { fontSize: 16, lineHeight: 28, marginBottom: 15, opacity: 0.9 },
  reportFooter: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1, marginTop: 10 },
  coachName: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  coachTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
});
