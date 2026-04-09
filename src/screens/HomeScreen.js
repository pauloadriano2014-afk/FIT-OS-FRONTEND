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

const QUICK_QUESTIONS = [
  "🤖 Como funciona a IA de Vídeo?",
  "🏋️‍♂️ Como marco as séries no treino?",
  "📈 Onde vejo minha Evolução?",
  "📸 Como fazer o Check-in?",
  "🚨 Estou com dor na articulação!"
];

const DIET_21D = {
    instructions: [
        "A constância é o que separa o resultado da frustração. Siga o plano 100%.",
        "A ingestão proteica é sagrada para manter sua massa magra enquanto secamos.",
        "Beba no mínimo 3L a 4L de água por dia. Metabolismo hidratado queima mais.",
        "Use as opções de troca apenas se necessário para não enjoar do plano.",
        "O foco aqui é o déficit calórico estratégico para perda de 3 a 5kg."
    ],
    trainingDays: [
        { time: "05:00 - PRÉ-TREINO (ENERGIA)", base: "70g Banana + 30g Whey Protein + 50g Iogurte Grego + 20g Aveia.", subs: "Trocas: Mamão (146g), Morango (201g) ou Abacaxi (124g)." },
        { time: "08:00 - PÓS-TREINO (RECUPERAÇÃO)", base: "2 Ovos Inteiros + 2 Fatias de Pão Integral.", subs: "Trocas: Carne Moída/Patinho (45g) ou Frango Desfiado (40g)." },
        { time: "12:00 - ALMOÇO (SACIEDADE)", base: "70g Arroz Branco + 50g Feijão + 120g Frango Grelhado + 150g Abobrinha.", subs: "Trocas: Macarrão (65g), Batata Inglesa (200g) ou Patinho (133g)." },
        { time: "17:00 - LANCHE DA TARDE", base: "Crepioca (40g Tapioca + 1 Ovo) + 80g Frango Desfiado.", subs: "Trocas: Patinho (89g) ou Omelete (2 ovos)." },
        { time: "21:00 - JANTAR (LIMPO)", base: "70g Arroz Branco + 120g Frango Grelhado + 150g Abobrinha.", subs: "Trocas: Vegetais Verdes (Brócolis/Couve) à vontade." }
    ],
    cardioDays: [
        { time: "08:00 - CAFÉ DA MANHÃ", base: "1 Pão Francês + 3 Ovos Inteiros + 1 Colher de Requeijão Light.", subs: "Trocas: Pão Integral (2 fatias) ou Cream Cheese Light (23g)." },
        { time: "12:00 - ALMOÇO", base: "100g Macarrão Cozido + 120g Carne Moída (Patinho) + 100g Brócolis.", subs: "Trocas: Mandioca (70g) ou Frango Grelhado (108g)." },
        { time: "16:00 - LANCHE DA TARDE", base: "60g Tapioca + 70g Frango Desfiado.", subs: "Trocas: Ovos Cozidos (3 unidades)." },
        { time: "20:00 - JANTAR", base: "100g Arroz Integral + 50g Feijão + 100g Carne Moída + 100g Abobrinha.", subs: "Trocas: Beterraba ou Couve-Flor (100g)." }
    ]
};

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { theme } = useTheme();

  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null);
  const [userPlan, setUserPlan] = useState('PREMIUM'); 
  
  const [xp, setXp] = useState(0); 

  // Ficha / Desafio
  const [fichaDaysElapsed, setFichaDaysElapsed] = useState(0);
  const [daysToStart, setDaysToStart] = useState(0); 
  const [fichaExpiredModalVisible, setFichaExpiredModalVisible] = useState(false);
  const [isFichaPlaceholder, setIsFichaPlaceholder] = useState(false);
  const [dietModalVisible, setDietModalVisible] = useState(false); 

  // Pedágio de Fotos
  const [hasSentInitialPhotos, setHasSentInitialPhotos] = useState(true); 
  const [initialPhotosModalVisible, setInitialPhotosModalVisible] = useState(false);
  const [photoBannerDismissed, setPhotoBannerDismissed] = useState(false);

  // Check-in
  const [isCheckinPending, setIsCheckinPending] = useState(false);
  const [isCheckinLate, setIsCheckinLate] = useState(false);
  const [scheduledCheckInDate, setScheduledCheckInDate] = useState(null);
  const [daysToFinalCheckin, setDaysToFinalCheckin] = useState(null); 
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 🔥 ESTADOS DO FEEDBACK DO COACH
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  // Modais
  const [activeNotice, setActiveNotice] = useState(null);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [upsellModalVisible, setUpsellModalVisible] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState('');

  // Chat IA
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
            const headers = { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' };
            const [homeRes, historyRes, checkinRes, noticeRes] = await Promise.all([
                fetch(`https://fitos-final.onrender.com/api/user/home?userId=${user.id}&t=${Date.now()}`, { headers }),
                fetch(`https://fitos-final.onrender.com/api/workout/history?userId=${user.id}&t=${Date.now()}`, { headers }),
                fetch(`https://fitos-final.onrender.com/api/checkin?userId=${user.id}&t=${Date.now()}`, { headers }),
                fetch(`https://fitos-final.onrender.com/api/notices?userId=${user.id}&t=${Date.now()}`, { headers })
            ]);

            let fetchedUser = { ...user };
            let hasPhotosInDb = false;
            let checkinsData = [];

            if (checkinRes.ok) {
                checkinsData = await checkinRes.json();
                if (Array.isArray(checkinsData) && checkinsData.length > 0) {
                    hasPhotosInDb = true;
                    
                    // 🔥 BUSCA DE FEEDBACK COM MEMÓRIA LOCAL 🔥
                    const evaluated = checkinsData.filter(c => c.coachFeedback);
                    let unread = null;
                    for (let c of evaluated) {
                        const isRead = await AsyncStorage.getItem(`read_feedback_${c.id}`);
                        if (!isRead) {
                            unread = c;
                            break;
                        }
                    }
                    
                    if (unread) {
                        setPendingFeedback(unread);
                        setFeedbackModalVisible(true);
                    } else {
                        setPendingFeedback(null);
                    }
                }
            }

            if (homeRes.ok) {
                const homeData = await homeRes.json();
                if (homeData.user) {
                    const serverXP = homeData.user.currentXP || 0;
                    setXp(serverXP);
                    fetchedUser = { ...user, currentXP: serverXP, ...homeData.user };
                    
                    const serverPlan = fetchedUser.plan || 'PREMIUM';
                    const finalPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(serverPlan) ? serverPlan : 'PREMIUM';
                    setUserPlan(finalPlan); 
                    
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

                        if (!hasPhotosInDb && diffDays >= 0) {
                            setHasSentInitialPhotos(false);
                        } else {
                            setHasSentInitialPhotos(true);
                        }
                        
                        const limit = finalPlan === 'CHALLENGE_21' ? 21 : 56;
                        
                        if (hasPhotosInDb && diffDays >= 0 && !isFichaPlaceholder && finalPlan !== 'LOW_COST') {
                            const remaining = limit - diffDays;
                            if (remaining > 0 && remaining <= 5) {
                                setDaysToFinalCheckin(remaining);
                            } else {
                                setDaysToFinalCheckin(null);
                            }
                        }
                        
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

            if (!fetchedUser.disableCheckIn) {
                const today = new Date();
                today.setHours(0,0,0,0);

                if (fetchedUser.nextCheckInDate) {
                    const targetDate = new Date(fetchedUser.nextCheckInDate);
                    targetDate.setHours(0,0,0,0);
                    
                    if (today.getTime() >= targetDate.getTime()) {
                        checkinPending = true;
                        const daysPast = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 3600 * 24));
                        if (daysPast >= 3) checkinLate = true; 
                    } else {
                        const dd = String(targetDate.getDate()).padStart(2,'0');
                        const mm = String(targetDate.getMonth()+1).padStart(2,'0');
                        futureDateStr = `${dd}/${mm}`;
                    }
                } else if (resolvedPlan === 'PREMIUM' && hasPhotosInDb) {
                    checkinsData.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                    const lastDate = new Date(checkinsData[0].date || checkinsData[0].createdAt);
                    lastDate.setHours(0,0,0,0);
                    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
                    if (diffDays >= 14) {
                        checkinPending = true;
                        if (diffDays >= 17) checkinLate = true;
                    } else {
                        const futureDate = new Date(lastDate.getTime());
                        futureDate.setDate(futureDate.getDate() + 14);
                        futureDateStr = `${String(futureDate.getDate()).padStart(2,'0')}/${String(futureDate.getMonth()+1).padStart(2,'0')}`;
                    }
                } else if (resolvedPlan === 'PREMIUM' && !hasPhotosInDb) {
                    checkinPending = true; 
                    checkinLate = true;
                }
            }
            setIsCheckinPending(checkinPending);
            setIsCheckinLate(checkinLate);
            setScheduledCheckInDate(futureDateStr);
        } catch (err) { console.log("Erro ao carregar dados críticos:", err); }
      }
    } catch (e) { console.log("Erro geral loadHome:", e); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleReadNotice = async () => {
      if (activeNotice) { try { await AsyncStorage.setItem(`read_notice_${activeNotice.id}`, 'true'); } catch(e) {} }
      setNoticeModalVisible(false);
  };

  // 🔥 MARCAR FEEDBACK COMO LIDO NA MEMÓRIA DO CELULAR 🔥
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
          case 'PREMIUM': return { title: 'REGISTRE SEU PONTO DE PARTIDA 📸', desc: 'Quando puder, envie suas 3 fotos iniciais para que possamos mapear sua evolução juntos. Sem pressa — envie quando estiver pronto!', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'TREINAR PRIMEIRO (Envio Depois)', showEscape: true };
          case 'LOW_COST': return { title: 'FOTOS DE EVOLUÇÃO PENDENTES 📸', desc: 'Para acompanharmos sua progressão mensal, precisamos do seu registro inicial. Envie suas 3 fotos (frente, lado e costas) o quanto antes!', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'IR PARA O TREINO', showEscape: true };
          case 'FICHA_8S': return { title: 'FOTOS DO DIA 1 PENDENTES ⚠️', desc: 'Suas fotos de ponto de partida são essenciais para a avaliação que o Coach fará no final das 8 semanas. Sem elas, não conseguimos medir sua evolução real. Envie agora!', btnText: 'ENVIAR FOTOS DO DIA 1', escapeText: 'TREINAR MESMO ASSIM', showEscape: true };
          case 'CHALLENGE_21': return { title: 'FOTOS DO DIA 1 — OBRIGATÓRIAS ⚠️', desc: 'O Desafio de 21 Dias depende das fotos iniciais para medir o seu resultado final. Sem o "antes", não existe "depois". Envie agora para começar oficialmente!', btnText: 'ENVIAR FOTOS E COMEÇAR', escapeText: 'TREINAR MESMO ASSIM', showEscape: true };
          default: return { title: 'FOTOS PENDENTES 📸', desc: 'Envie suas fotos iniciais para mapearmos sua evolução.', btnText: 'ENVIAR FOTOS', escapeText: 'TREINAR MESMO ASSIM', showEscape: true };
      }
  };

  const getPhotoBanner = () => {
      if (hasSentInitialPhotos || photoBannerDismissed) return null;
      const isWaiting = daysToStart > 0;
      if (isWaiting) return null;

      switch (userPlan) {
          case 'PREMIUM': return { icon: 'camera-outline', text: 'Envie seu check-in inicial quando puder 📸', color: theme.accent, dismissable: true, urgency: 'low' };
          case 'LOW_COST': return { icon: 'camera-timer', text: 'Suas fotos de evolução estão pendentes!', color: '#FF9500', dismissable: false, urgency: 'medium' };
          case 'FICHA_8S': return { icon: 'camera-timer', text: 'Envie suas fotos do Dia 1 para começar!', color: '#FF9500', dismissable: false, urgency: 'high' };
          case 'CHALLENGE_21': return { icon: 'alert-circle', text: '⚠️ Fotos do Dia 1 pendentes — envie agora!', color: '#FF3B30', dismissable: false, urgency: 'high' };
          default: return null;
      }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator color={theme.accent} size="large" /></View>;

  const limitDays = userPlan === 'CHALLENGE_21' ? 21 : 56;
  const isFichaExpired = (userPlan === 'FICHA_8S' || userPlan === 'CHALLENGE_21') && fichaDaysElapsed >= limitDays && !isFichaPlaceholder;
  const isWaitingStart = (userPlan === 'FICHA_8S' || userPlan === 'CHALLENGE_21' || userPlan === 'LOW_COST') && daysToStart > 0;
  
  const needsInitialPhoto = !hasSentInitialPhotos && !isWaitingStart && userPlan !== 'PREMIUM';
  const photoBanner = getPhotoBanner();
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
              <View>
                <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                    BEM-VINDO AO {userPlan === 'LOW_COST' ? 'PLANO BÁSICO' : (userPlan === 'FICHA_8S' ? 'PROJETO DE FICHAS' : (userPlan === 'CHALLENGE_21' ? 'DESAFIO 21 DIAS' : 'ELITE'))},
                </Text>
                <Text style={[styles.name, { color: theme.text }]}>{userName.toUpperCase()} ⚡</Text>
              </View>
              <TouchableOpacity style={[styles.statusBadge, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setLevelModalVisible(true)}>
                <Text style={[styles.statusText, { color: theme.accent }]}>{levelData.title}</Text>
              </TouchableOpacity>
            </View>

            {photoBanner && (
                <TouchableOpacity 
                    style={[styles.photoBanner, { backgroundColor: photoBanner.color + '15', borderColor: photoBanner.color }]}
                    onPress={() => { setInitialPhotosModalVisible(true); }}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name={photoBanner.icon} size={20} color={photoBanner.color} />
                    <Text style={[styles.photoBannerText, { color: photoBanner.color }]}>{photoBanner.text}</Text>
                    {photoBanner.dismissable && (
                        <TouchableOpacity onPress={() => setPhotoBannerDismissed(true)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                            <MaterialCommunityIcons name="close" size={16} color={photoBanner.color} />
                        </TouchableOpacity>
                    )}
                    {!photoBanner.dismissable && (
                        <MaterialCommunityIcons name="chevron-right" size={18} color={photoBanner.color} />
                    )}
                </TouchableOpacity>
            )}

            {isCheckinPending && !needsInitialPhoto && !pendingFeedback && (
                <TouchableOpacity 
                    style={[styles.photoBanner, { backgroundColor: isCheckinLate ? '#FF3B3015' : '#FF950015', borderColor: isCheckinLate ? '#FF3B30' : '#FF9500' }]}
                    onPress={() => navigation.navigate('CheckIn')}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name={isCheckinLate ? "alert" : "camera-plus"} size={20} color={isCheckinLate ? '#FF3B30' : '#FF9500'} />
                    <Text style={[styles.photoBannerText, { color: isCheckinLate ? '#FF3B30' : '#FF9500' }]}>
                        {isCheckinLate ? 'Check-in ATRASADO — envie suas fotos!' : 'Seu check-in está liberado! Envie suas fotos 📸'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={isCheckinLate ? '#FF3B30' : '#FF9500'} />
                </TouchableOpacity>
            )}

            {/* 🔥 MODO SEMÁFORO (STATUS DO ALUNO) 🔥 */}
            {scheduledCheckInDate && !isCheckinPending && !needsInitialPhoto && !pendingFeedback && (
                (() => {
                    const parts = scheduledCheckInDate.split('/');
                    const tDate = new Date(new Date().getFullYear(), parts[1] - 1, parts[0]);
                    const today = new Date(); today.setHours(0,0,0,0);
                    const diff = Math.ceil((tDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    
                    let bg = 'rgba(50, 173, 230, 0.15)', border = '#32ADE6', icon = 'shield-check', text = `Avaliação em ${diff} dias`;
                    if (diff <= 3) { bg = 'rgba(255, 59, 48, 0.15)'; border = '#FF3B30'; icon = 'timer-sand'; text = `Atenção: Faltam apenas ${diff} dias!`; }
                    else if (diff <= 7) { bg = 'rgba(255, 149, 0, 0.15)'; border = '#FF9500'; icon = 'calendar-clock'; text = `Faltam ${diff} dias para o envio`; }

                    return (
                        <View style={[styles.photoBanner, { backgroundColor: bg, borderColor: border, padding: 16 }]}>
                            <MaterialCommunityIcons name={icon} size={22} color={border} />
                            <View style={{flex: 1, marginLeft: 5}}>
                                <Text style={{color: border, fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>STATUS DO PLANO:</Text>
                                <Text style={{color: border, fontSize: 13, fontWeight: 'bold'}}>{text}</Text>
                            </View>
                        </View>
                    );
                })()
            )}

            {daysToFinalCheckin && daysToFinalCheckin <= 5 && !pendingFeedback && (
                <View style={[styles.photoBanner, { backgroundColor: '#BF5AF215', borderColor: '#BF5AF2' }]}>
                    <MaterialCommunityIcons name="timer-sand" size={18} color="#BF5AF2" />
                    <Text style={[styles.photoBannerText, { color: '#BF5AF2' }]}>
                        📸 {daysToFinalCheckin === 1 ? 'AMANHÃ' : `Faltam ${daysToFinalCheckin} dias`} para suas fotos de resultado!
                    </Text>
                </View>
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
                        <View style={[styles.xpBarFill, { width: `${Math.min(100, (fichaDaysElapsed / limitDays) * 100)}%`, backgroundColor: theme.accent }]} />
                    </View>
                    
                    {userPlan === 'CHALLENGE_21' && (
                        <TouchableOpacity 
                            style={{marginTop: 15, padding: 15, backgroundColor: theme.accent, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10}}
                            onPress={() => setDietModalVisible(true)}
                        >
                            <MaterialCommunityIcons name="food-apple" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13}}>GUIA DE SUGESTÃO ALIMENTAR 🍏</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {userPlan !== 'FICHA_8S' && userPlan !== 'CHALLENGE_21' && (
                <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                        <Text style={[styles.levelText, { color: theme.accent }]}>NÍVEL {currentLevel}</Text>
                        <Text style={[styles.xpText, { color: theme.textSecondary }]}>{currentLevelProgress} / {nextLevelXP} XP</Text>
                    </View>
                    <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                        <View style={[styles.xpBarFill, { width: `${(currentLevelProgress/nextLevelXP)*100}%`, backgroundColor: theme.accent }]} />
                    </View>
                </View>
            )}

            {pendingFeedback ? (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity 
                        style={[styles.mainActionBtn, { backgroundColor: '#FFD700', shadowColor: '#FFD700', borderWidth: 0 }]} 
                        onPress={() => setFeedbackModalVisible(true)} 
                        activeOpacity={0.9}
                    >
                        <View style={{flex: 1}}>
                            <Text style={[styles.actionLabel, { color: '#000' }]}>O COACH ANALISOU SUAS FOTOS</Text>
                            <Text style={[styles.actionTitle, { color: '#000', fontSize: 20 }]}>FEEDBACK DISPONÍVEL</Text>
                        </View>
                        <View style={[styles.iconCircle, {backgroundColor: 'rgba(0,0,0,0.15)'}]}>
                            <MaterialCommunityIcons name="email-open" size={28} color="#000" />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <TouchableOpacity 
                    style={[
                        styles.mainActionBtn, 
                        { 
                            backgroundColor: (isFichaExpired || isWaitingStart) ? theme.surface : (needsInitialPhoto ? theme.surface : theme.accent), 
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
                            {isFichaExpired ? 'CICLO ENCERRADO' : (isWaitingStart ? 'STATUS ATUAL' : (needsInitialPhoto ? 'LEMBRETE IMPORTANTE' : 'SEU OBJETIVO DE HOJE'))}
                        </Text>
                        <Text style={[styles.actionTitle, { color: (isFichaExpired || isWaitingStart || needsInitialPhoto) ? theme.text : (theme.isDark ? '#000' : '#FFF') }]}>
                            {isFichaExpired ? 'PRÓXIMOS PASSOS' : (isWaitingStart ? 'AGUARDANDO DATA' : (needsInitialPhoto ? 'FOTOS PENDENTES' : 'INICIAR TREINO'))}
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

            <View style={styles.gridContainer}>
                <Animated.View style={{ transform: [{ scale: pendingFeedback ? 1 : pulseAnim }], width: '48%', marginBottom: 15 }}>
                    <TouchableOpacity style={[styles.gridItem, { width: '100%', marginBottom: 0, backgroundColor: theme.surface, borderColor: isCheckinPending ? (isCheckinLate ? '#FF3B30' : '#FF9500') : theme.border }]} onPress={() => navigation.navigate('CheckIn')}>
                        {isCheckinPending && <View style={[styles.notificationDot, { borderColor: theme.bg }]} />}
                        <View style={[styles.gridIcon, { backgroundColor: theme.accent + '33' }]}>
                            <MaterialCommunityIcons name="camera-plus" size={24} color={theme.accent} />
                        </View>
                        <Text style={[styles.gridText, { color: theme.text }]}>
                            {userPlan === 'PREMIUM' ? 'Check-in' : 'Fotos do Shape'}
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

      <Modal visible={feedbackModalVisible} transparent animationType="fade">
          <View style={styles.chatModalOverlay}>
              <View style={[styles.feedbackModalContent, { backgroundColor: theme.bg }]}>
                  <View style={styles.feedbackHeader}>
                      <View style={[styles.levelIconBox, { backgroundColor: theme.accent + '22', marginBottom: 0, width: 40, height: 40 }]}>
                          <MaterialCommunityIcons name="bullseye-arrow" size={24} color={theme.accent} />
                      </View>
                      <Text style={[styles.feedbackTitle, { color: theme.text }]}>ANÁLISE DO COACH</Text>
                  </View>

                  <ScrollView style={{flex: 1, padding: 20}} showsVerticalScrollIndicator={false}>
                      
                      {pendingFeedback?.photoFront && (
                          <View style={styles.feedbackPhotosRow}>
                              <View style={styles.feedbackPhotoBox}>
                                  <Image source={{uri: pendingFeedback.photoFront}} style={[styles.feedbackPhotoImg, {borderColor: theme.border}]} />
                                  <Text style={[styles.feedbackPhotoLabel, {color: theme.textSecondary}]}>SUA FOTO ATUAL</Text>
                              </View>
                          </View>
                      )}

                      <View style={[styles.feedbackTextBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <MaterialCommunityIcons name="format-quote-open" size={24} color={theme.accent} style={{marginBottom: 10}} />
                          <Text style={[styles.feedbackText, { color: theme.text }]}>{pendingFeedback?.coachFeedback}</Text>
                      </View>

                      <TouchableOpacity 
                          style={[styles.upsellBtn, {backgroundColor: theme.accent, marginTop: 25, elevation: 5}]} 
                          onPress={markFeedbackAsRead}
                          disabled={isMarkingAsRead}
                      >
                          {isMarkingAsRead ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : (
                              <>
                                  <Text style={[styles.upsellBtnText, {color: theme.isDark ? '#000' : '#FFF'}]}>COMPREENDIDO, COACH! 👊</Text>
                              </>
                          )}
                      </TouchableOpacity>
                      <View style={{height: 40}} />
                  </ScrollView>
              </View>
          </View>
      </Modal>

      <Modal visible={initialPhotosModalVisible} transparent animationType="fade">
          <View style={styles.chatModalOverlay}>
              <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: (userPlan === 'CHALLENGE_21' || userPlan === 'FICHA_8S') ? '#FF9500' : theme.accent }]}>
                  <TouchableOpacity style={styles.upsellClose} onPress={() => setInitialPhotosModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
                  <View style={[styles.levelIconBox, { backgroundColor: (userPlan === 'CHALLENGE_21' || userPlan === 'FICHA_8S') ? '#FF950022' : theme.accent + '22', marginBottom: 20 }]}><MaterialCommunityIcons name="camera-timer" size={36} color={(userPlan === 'CHALLENGE_21' || userPlan === 'FICHA_8S') ? '#FF9500' : theme.accent} /></View>
                  <Text style={[styles.upsellTitle, { color: theme.text }]}>{photoModal.title}</Text>
                  <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>{photoModal.desc}</Text>
                  <TouchableOpacity style={[styles.upsellBtn, {backgroundColor: theme.accent, marginBottom: 10}]} onPress={() => { setInitialPhotosModalVisible(false); navigation.navigate('CheckIn'); }}>
                      <MaterialCommunityIcons name="camera" size={20} color={theme.isDark ? '#000' : '#FFF'} style={{marginRight: 8}}/>
                      <Text style={[styles.upsellBtnText, {color: theme.isDark ? '#000' : '#FFF'}]}>{photoModal.btnText}</Text>
                  </TouchableOpacity>
                  {photoModal.showEscape && (
                      <TouchableOpacity style={{padding: 15, alignItems: 'center'}} onPress={() => { setInitialPhotosModalVisible(false); navigation.navigate('Treinos'); }}>
                          <Text style={{color: theme.textSecondary, fontWeight: 'bold', fontSize: 12, textDecorationLine: 'underline'}}>{photoModal.escapeText}</Text>
                      </TouchableOpacity>
                  )}
              </View>
          </View>
      </Modal>

      <Modal visible={dietModalVisible} animationType="slide" transparent>
          <View style={styles.chatModalOverlay}>
              <View style={[styles.dietCard, { backgroundColor: theme.bg }]}>
                  <View style={styles.dietHeader}>
                      <Text style={[styles.dietTitle, { color: theme.text }]}>SUGESTÃO ALIMENTAR 21D 🥗</Text>
                      <TouchableOpacity onPress={() => setDietModalVisible(false)}><MaterialCommunityIcons name="close" size={28} color={theme.text} /></TouchableOpacity>
                  </View>
                  <ScrollView style={{padding: 20}} showsVerticalScrollIndicator={false}>
                      <View style={[styles.instructionBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                          <Text style={[styles.dietSectionTitle, { color: theme.accent, marginBottom: 10 }]}>REGRAS DO COACH 👊</Text>
                          {DIET_21D.instructions.map((text, i) => (
                              <View key={i} style={{flexDirection: 'row', marginBottom: 6, gap: 8}}><MaterialCommunityIcons name="check-circle-outline" size={16} color={theme.accent} /><Text style={{color: theme.text, fontSize: 13, flex: 1, fontWeight: '600'}}>{text}</Text></View>
                          ))}
                      </View>
                      <Text style={[styles.dietSectionTitle, {color: theme.text, marginTop: 20}]}>DIAS DE MUSCULAÇÃO 💪</Text>
                      {DIET_21D.trainingDays.map((meal, i) => (
                          <View key={i} style={[styles.mealCard, {backgroundColor: theme.surface, borderColor: theme.border}]}><Text style={[styles.mealTime, {color: theme.accent}]}>{meal.time}</Text><Text style={[styles.mealDesc, {color: theme.text}]}>{meal.base}</Text><Text style={[styles.mealSubs, {color: theme.textSecondary}]}>{meal.subs}</Text></View>
                      ))}
                      <Text style={[styles.dietSectionTitle, {color: theme.text, marginTop: 25}]}>DIAS DE CARDIO (SEM MUSCULAÇÃO) 🏃‍♂️</Text>
                      {DIET_21D.cardioDays.map((meal, i) => (
                          <View key={i} style={[styles.mealCard, {backgroundColor: theme.surface, borderColor: theme.border}]}><Text style={[styles.mealTime, {color: theme.accent}]}>{meal.time}</Text><Text style={[styles.mealDesc, {color: theme.text}]}>{meal.base}</Text><Text style={[styles.mealSubs, {color: theme.textSecondary}]}>{meal.subs}</Text></View>
                      ))}
                      <View style={{height: 100}} />
                  </ScrollView>
              </View>
          </View>
      </Modal>

      <LevelUpModal visible={levelModalVisible} onClose={() => setLevelModalVisible(false)} theme={theme} levelData={levelData} currentLevel={currentLevel} currentLevelProgress={currentLevelProgress} nextLevelXP={nextLevelXP} />
      <HomeNoticeModal visible={noticeModalVisible} onClose={handleReadNotice} theme={theme} activeNotice={activeNotice} />
      <ChatAIAssistantModal visible={chatVisible} onClose={() => setChatVisible(false)} theme={theme} isWeb={isWeb} messages={messages} flatListRef={flatListRef} chatInput={chatInput} setChatInput={setChatInput} handleSendChat={handleSendChat} isTyping={isTyping} QUICK_QUESTIONS={QUICK_QUESTIONS} />

      <Modal visible={fichaExpiredModalVisible} transparent animationType="fade">
          <View style={styles.chatModalOverlay}>
              <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: '#FF3B30' }]}>
                  <TouchableOpacity style={styles.upsellClose} onPress={() => setFichaExpiredModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
                  <View style={[styles.levelIconBox, { backgroundColor: '#FF3B3022', marginBottom: 20 }]}><MaterialCommunityIcons name="trophy-variant" size={36} color="#FF3B30" /></View>
                  <Text style={[styles.upsellTitle, { color: theme.text }]}>MISSÃO CUMPRIDA! 🎉</Text>
                  <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>Você finalizou seu projeto atual. Para resgatar sua avaliação final do Coach e os seus bônus, envie suas fotos de resultado (Hoje).</Text>
                  <TouchableOpacity style={[styles.upsellBtn, { backgroundColor: '#FF3B30', marginBottom: 10 }]} onPress={() => { setFichaExpiredModalVisible(false); navigation.navigate('CheckIn'); }}><MaterialCommunityIcons name="camera" size={20} color="#FFF" style={{marginRight: 8}}/><Text style={[styles.upsellBtnText, {color: '#FFF'}]}>ENVIAR FOTO FINAL</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.upsellBtn, { backgroundColor: '#25D366' }]} onPress={() => { setFichaExpiredModalVisible(false); Linking.openURL("https://wa.me/5541997991346?text=Coach, finalizei meu plano! Quero saber os próximos passos."); }}><MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" style={{marginRight: 8}}/><Text style={[styles.upsellBtnText, {color: '#FFF'}]}>FALAR COM O COACH</Text></TouchableOpacity>
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
  photoBannerText: { flex: 1, fontSize: 12, fontWeight: '700' },
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
  feedbackModalContent: { width: '100%', height: '100%', maxWidth: 500, alignSelf: 'center', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', marginTop: 40 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 25, borderBottomWidth: 1, borderColor: 'rgba(128,128,128,0.2)' },
  feedbackTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  feedbackPhotosRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  feedbackPhotoBox: { flex: 1, alignItems: 'center' },
  feedbackPhotoImg: { width: '100%', height: 250, borderRadius: 20, borderWidth: 2, backgroundColor: '#000' },
  feedbackPhotoLabel: { fontSize: 11, fontWeight: '900', marginTop: 10, letterSpacing: 1 },
  feedbackTextBox: { padding: 20, borderRadius: 20, borderWidth: 1 },
  feedbackText: { fontSize: 16, lineHeight: 26, fontWeight: '500' },
  dietCard: { flex: 1, marginTop: 60, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  dietHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderColor: '#333' },
  dietTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  dietSectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 15, letterSpacing: 1, textDecorationLine: 'underline' },
  instructionBox: { padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderStyle: 'dashed' },
  mealCard: { padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1 },
  mealTime: { fontSize: 13, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  mealDesc: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  mealSubs: { fontSize: 12, fontStyle: 'italic', marginTop: 10, opacity: 0.8 }
});
