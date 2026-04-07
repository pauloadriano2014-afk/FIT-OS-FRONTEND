// src/screens/HomeScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  StatusBar, RefreshControl, ActivityIndicator, Alert, Platform, Modal,
  Animated, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../contexts/ThemeContext';

// 🔥 IMPORT DOS NOSSOS MODAIS MODULARIZADOS
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

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { theme } = useTheme();

  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null);
  const [userPlan, setUserPlan] = useState('PREMIUM'); 
  
  const [xp, setXp] = useState(0); 
  const [streak, setStreak] = useState(0);

  // Estados da Ficha 8S
  const [fichaDaysElapsed, setFichaDaysElapsed] = useState(0);
  const [fichaExpiredModalVisible, setFichaExpiredModalVisible] = useState(false);
  const [isFichaPlaceholder, setIsFichaPlaceholder] = useState(false);

  // Estados de Check-in
  const [isCheckinPending, setIsCheckinPending] = useState(false);
  const [isCheckinLate, setIsCheckinLate] = useState(false);
  const [scheduledCheckInDate, setScheduledCheckInDate] = useState(null);
  const [showScheduledBanner, setShowScheduledBanner] = useState(true);
  const [hasAlerted, setHasAlerted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Estados de Modais
  const [activeNotice, setActiveNotice] = useState(null);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [upsellModalVisible, setUpsellModalVisible] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState('');

  // Estados do Chat IA
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]); 
  const flatListRef = useRef(null);

  // Lógica de Nível
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
      if (isCheckinPending && userPlan === 'PREMIUM') {
          Animated.loop(
              Animated.sequence([
                  Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                  Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
              ])
          ).start();
      } else {
          pulseAnim.setValue(1);
      }
  }, [isCheckinPending, userPlan]);

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
            const [homeRes, historyRes, checkinRes, noticeRes] = await Promise.all([
                fetch(`https://fitos-final.onrender.com/api/user/home?userId=${user.id}&t=${Date.now()}`),
                fetch(`https://fitos-final.onrender.com/api/workout/history?userId=${user.id}`),
                fetch(`https://fitos-final.onrender.com/api/checkin?userId=${user.id}`),
                fetch(`https://fitos-final.onrender.com/api/notices?userId=${user.id}`)
            ]);

            let fetchedUser = { ...user };

            if (homeRes.ok) {
                const homeData = await homeRes.json();
                if (homeData.user) {
                    const serverXP = homeData.user.currentXP || 0;
                    setXp(serverXP);
                    fetchedUser = { ...user, currentXP: serverXP, ...homeData.user };
                    
                    const serverPlan = fetchedUser.plan || 'PREMIUM';
                    const finalPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(serverPlan) ? serverPlan : 'PREMIUM';
                    setUserPlan(finalPlan); 
                    
                    if (finalPlan === 'FICHA_8S') {
                        let startD = new Date(fetchedUser.createdAt || new Date());
                        
                        const activeWorkouts = (fetchedUser.workouts || []).filter(w => !w.archived).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                        
                        if (activeWorkouts.length > 0) {
                            const currentWorkout = activeWorkouts[0];
                            startD = new Date(currentWorkout.startDate); 

                            if (currentWorkout.name.includes("CONSTRUÇÃO") || !currentWorkout.routine || currentWorkout.routine.length === 0) {
                                setIsFichaPlaceholder(true);
                            } else {
                                setIsFichaPlaceholder(false);
                            }
                        } else {
                            setIsFichaPlaceholder(true);
                        }
                        
                        startD.setHours(0,0,0,0);
                        const todayD = new Date(); 
                        todayD.setHours(0,0,0,0);
                        const diffD = Math.max(0, Math.floor((todayD - startD) / (1000 * 3600 * 24)));
                        setFichaDaysElapsed(diffD);
                        
                        if (diffD > 56 && !isFichaPlaceholder) {
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

            if (!fetchedUser.disableCheckIn && ['PREMIUM'].includes(resolvedPlan)) {
                const today = new Date();
                today.setHours(0,0,0,0);
                if (fetchedUser.nextCheckInDate) {
                    const targetDate = new Date(fetchedUser.nextCheckInDate);
                    targetDate.setHours(0,0,0,0);
                    if (today.getTime() >= targetDate.getTime()) {
                        checkinPending = true;
                        if (Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 3600 * 24)) >= 3) checkinLate = true; 
                    } else {
                        futureDateStr = `${String(targetDate.getDate()).padStart(2,'0')}/${String(targetDate.getMonth()+1).padStart(2,'0')}`;
                    }
                } else if (checkinRes.ok) {
                    const checkins = await checkinRes.json();
                    if (Array.isArray(checkins) && checkins.length > 0) {
                        checkins.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                        const lastDate = new Date(checkins[0].date || checkins[0].createdAt);
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
                    } else {
                        checkinPending = true; checkinLate = true;
                    }
                }
            }
            setIsCheckinPending(checkinPending);
            setIsCheckinLate(checkinLate);
            setScheduledCheckInDate(futureDateStr);

            if (futureDateStr) {
                const dismissedDate = await AsyncStorage.getItem(`dismissedBannerDate_${user.id}`);
                setShowScheduledBanner(dismissedDate !== futureDateStr);
            }
        } catch (err) { console.log("Erro ao carregar dados críticos:", err); }
      }
    } catch (e) { console.log("Erro geral loadHome:", e); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleReadNotice = async () => {
      if (activeNotice) { try { await AsyncStorage.setItem(`read_notice_${activeNotice.id}`, 'true'); } catch(e) {} }
      setNoticeModalVisible(false);
  };

  const handleDismissBanner = async () => { setShowScheduledBanner(false); };

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

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator color={theme.accent} size="large" /></View>;

  const isFichaExpired = userPlan === 'FICHA_8S' && fichaDaysElapsed > 56 && !isFichaPlaceholder;
  const fichaDaysLeft = Math.max(0, 56 - fichaDaysElapsed);

  return (
    <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
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

            {userPlan === 'FICHA_8S' && !isFichaExpired && (
                <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                        <Text style={[styles.levelText, { color: theme.accent }]}>FICHA 8 SEMANAS</Text>
                        <Text style={[styles.xpText, { color: theme.textSecondary }]}>
                            {isFichaPlaceholder ? 'PREPARANDO TREINO' : `SEMANA ${Math.min(8, Math.max(1, Math.ceil(fichaDaysElapsed / 7)))} DE 8`}
                        </Text>
                    </View>
                    <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                        <View style={[styles.xpBarFill, { width: `${Math.min(100, (fichaDaysElapsed / 56) * 100)}%`, backgroundColor: (fichaDaysLeft <= 14 && !isFichaPlaceholder) ? '#FF9500' : theme.accent }]} />
                    </View>
                    {fichaDaysLeft <= 14 && !isFichaPlaceholder && (
                        <TouchableOpacity
                            style={{marginTop: 15, padding: 12, backgroundColor: '#FF950022', borderRadius: 12, borderWidth: 1, borderColor: '#FF9500', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}
                            onPress={() => Linking.openURL("https://wa.me/5541997991346?text=Coach, minha Ficha 8S está acabando! Quero renovar.")}
                        >
                            <MaterialCommunityIcons name="alert-circle" size={16} color="#FF9500" />
                            <Text style={{color: '#FF9500', fontSize: 11, fontWeight: 'bold', marginLeft: 6}}>FALTAM {fichaDaysLeft} DIAS! RENOVE AGORA.</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {userPlan !== 'FICHA_8S' && (
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

            {userPlan === 'PREMIUM' && isCheckinPending && (
                <TouchableOpacity style={[styles.pendingBanner, isCheckinLate ? { backgroundColor: '#FF3B30' } : { backgroundColor: '#FF9500' }]} onPress={() => navigation.navigate('CheckIn')}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#FFF" />
                    <View style={{flex: 1, marginLeft: 12}}>
                        <Text style={styles.pendingBannerTitle}>{isCheckinLate ? "⚠️ CHECK-IN ATRASADO!" : "⚠️ DIA DE CHECK-IN!"}</Text>
                        <Text style={styles.pendingBannerText}>{isCheckinLate ? "Você passou do prazo! Envie agora." : "Sua atualização quinzenal está pendente."}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
                </TouchableOpacity>
            )}

            <TouchableOpacity 
                style={[styles.mainActionBtn, { backgroundColor: isFichaExpired ? '#FF3B30' : theme.accent, shadowColor: isFichaExpired ? '#FF3B30' : theme.accent }]} 
                onPress={() => { isFichaExpired ? setFichaExpiredModalVisible(true) : navigation.navigate('Treinos') }} 
                activeOpacity={0.9}
            >
                <View>
                    <Text style={[styles.actionLabel, { color: theme.isDark ? '#000' : '#FFF' }]}>{isFichaExpired ? 'TREINO BLOQUEADO' : 'SEU OBJETIVO DE HOJE'}</Text>
                    <Text style={[styles.actionTitle, { color: theme.isDark ? '#000' : '#FFF' }]}>{isFichaExpired ? 'RENOVAR FICHA' : 'INICIAR TREINO'}</Text>
                </View>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name={isFichaExpired ? "lock" : "dumbbell"} size={28} color={theme.isDark ? '#000' : '#FFF'} />
                </View>
            </TouchableOpacity>

            <View style={styles.gridContainer}>
                {/* 🔥 AQUI ESTÁ A CORREÇÃO QUE BLINDA O LAYOUT DO CHROME: pulseAnim SEMPRE COMO ARRAY */}
                <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '48%', marginBottom: 15 }}>
                    <TouchableOpacity style={[styles.gridItem, { width: '100%', marginBottom: 0, backgroundColor: theme.surface, borderColor: (isCheckinPending && userPlan === 'PREMIUM') ? (isCheckinLate ? '#FF3B30' : '#FF9500') : theme.border }]} onPress={() => userPlan === 'PREMIUM' ? navigation.navigate('CheckIn') : openUpsell('Check-in e Análise Quinzenal')}>
                        {(isCheckinPending && userPlan === 'PREMIUM') && <View style={[styles.notificationDot, { borderColor: theme.bg }]} />}
                        <View style={[styles.gridIcon, { backgroundColor: userPlan === 'PREMIUM' ? theme.accent + '33' : theme.textSecondary + '22' }]}>
                            {userPlan === 'PREMIUM' ? <MaterialCommunityIcons name="camera-plus" size={24} color={theme.accent} /> : <MaterialCommunityIcons name="lock" size={22} color={theme.textSecondary} />}
                        </View>
                        <Text style={[styles.gridText, { color: theme.text }]}>Check-in</Text>
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

      <LevelUpModal visible={levelModalVisible} onClose={() => setLevelModalVisible(false)} theme={theme} levelData={levelData} currentLevel={currentLevel} currentLevelProgress={currentLevelProgress} nextLevelXP={nextLevelXP} />
      <HomeNoticeModal visible={noticeModalVisible} onClose={handleReadNotice} theme={theme} activeNotice={activeNotice} />
      <ChatAIAssistantModal visible={chatVisible} onClose={() => setChatVisible(false)} theme={theme} isWeb={isWeb} messages={messages} flatListRef={flatListRef} chatInput={chatInput} setChatInput={setChatInput} handleSendChat={handleSendChat} isTyping={isTyping} QUICK_QUESTIONS={QUICK_QUESTIONS} />

      <Modal visible={fichaExpiredModalVisible} transparent animationType="fade">
          <View style={styles.chatModalOverlay}>
              <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: '#FF3B30' }]}>
                  <TouchableOpacity style={styles.upsellClose} onPress={() => setFichaExpiredModalVisible(false)}>
                      <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                  <View style={[styles.levelIconBox, { backgroundColor: '#FF3B3022', marginBottom: 20 }]}>
                      <MaterialCommunityIcons name="trophy-variant" size={36} color="#FF3B30" />
                  </View>
                  <Text style={[styles.upsellTitle, { color: theme.text }]}>DESAFIO CONCLUÍDO! 🎉</Text>
                  <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>As suas 8 semanas da Ficha acabaram. Você evoluiu muito até aqui! Garanta seu próximo treino ou faça o upgrade para a Consultoria Premium.</Text>
                  <TouchableOpacity style={[styles.upsellBtn, { backgroundColor: '#25D366', shadowColor: '#25D366' }]} onPress={() => { setFichaExpiredModalVisible(false); Linking.openURL("https://wa.me/5541997991346?text=Coach, acabei minhas 8 semanas da Ficha! Quero renovar o projeto."); }}>
                      <Text style={[styles.upsellBtnText, {color: '#FFF'}]}>FALAR COM O COACH</Text>
                      <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" style={{marginLeft: 8}}/>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={upsellModalVisible} transparent animationType="fade">
          <View style={styles.chatModalOverlay}>
              <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                  <TouchableOpacity style={styles.upsellClose} onPress={() => setUpsellModalVisible(false)}>
                      <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                  <View style={[styles.levelIconBox, { backgroundColor: theme.accent + '22', marginBottom: 20 }]}>
                      <MaterialCommunityIcons name="crown" size={36} color={theme.accent} />
                  </View>
                  <Text style={[styles.upsellTitle, { color: theme.text }]}>FUNCIONALIDADE VIP</Text>
                  <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>O recurso de <Text style={{color: theme.accent, fontWeight: 'bold'}}>{upsellFeature}</Text> é exclusivo para atletas da Consultoria Premium.</Text>
                  <View style={[styles.upsellBenefits, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                      <View style={styles.upsellBenefitRow}><MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} /><Text style={[styles.upsellBenefitText, { color: theme.text }]}>Ajuste de Treino Sob Medida</Text></View>
                      <View style={styles.upsellBenefitRow}><MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} /><Text style={[styles.upsellBenefitText, { color: theme.text }]}>Avaliação Quinzenal do Shape</Text></View>
                      <View style={styles.upsellBenefitRow}><MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} /><Text style={[styles.upsellBenefitText, { color: theme.text }]}>Acesso direto ao Coach</Text></View>
                  </View>
                  <TouchableOpacity style={styles.upsellBtn} onPress={() => { setUpsellModalVisible(false); Linking.openURL("https://wa.me/5541997991346?text=Coach, quero fazer o upgrade para a Consultoria Premium!"); }}>
                      <Text style={styles.upsellBtnText}>FAZER UPGRADE AGORA</Text>
                      <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" style={{marginLeft: 8}}/>
                  </TouchableOpacity>
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
  pendingBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 20, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  pendingBannerTitle: { color: '#FFF', fontWeight: '900', fontSize: 14, marginBottom: 3, letterSpacing: 0.5 },
  pendingBannerText: { color: '#FFF', fontSize: 11, fontWeight: '600', opacity: 0.95 },
  notificationDot: { position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FF3B30', borderWidth: 2, zIndex: 10 },
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
  footerContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  footerText: { fontWeight: '900', fontSize: 16, letterSpacing: 1.5 },
  footerSubText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },
  fabChat: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, zIndex: 999, elevation: 10, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  
  // Estilos Modais Locais (Upsell / Expirado)
  chatModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
  levelIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  upsellCard: { width: '90%', maxWidth: 420, alignSelf: 'center', padding: 25, borderRadius: 24, borderWidth: 2, alignItems: 'center' },
  upsellClose: { position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 10 },
  upsellTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, letterSpacing: 1, textAlign: 'center' },
  upsellDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  upsellBenefits: { width: '100%', padding: 15, borderRadius: 16, borderWidth: 1, gap: 12, marginBottom: 25 },
  upsellBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  upsellBenefitText: { fontSize: 13, fontWeight: 'bold' },
  upsellBtn: { width: '100%', backgroundColor: '#25D366', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#25D366', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  upsellBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});