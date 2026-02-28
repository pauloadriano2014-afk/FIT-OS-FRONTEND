import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  RefreshControl, 
  ActivityIndicator, 
  Alert, 
  Platform, 
  Modal,
  TextInput,
  KeyboardAvoidingView,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

/* 🔥 IMPORTAÇÃO DO TEMA */
import { useTheme } from '../contexts/ThemeContext';

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 🔥 PUXA O TEMA GLOBAL
  const { theme } = useTheme();

  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null);
  const [xp, setXp] = useState(0); 
  const [streak, setStreak] = useState(0);
  const [notice, setNotice] = useState(null); 

  // STATES DO CHATBOT
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Fala, monstro! 👊 Sou o PA Coach AI. Precisa de ajuda com o treino ou dieta hoje?", sender: 'ai' }
  ]);
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

  useFocusEffect(
    useCallback(() => { loadHomeData(); }, [])
  );

  const loadHomeData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setUserName(user.name?.split(' ')[0] || 'Atleta');
        if (user.currentXP) setXp(user.currentXP);

        try {
            const [homeRes, historyRes] = await Promise.all([
                fetch(`https://fitos-final.onrender.com/api/user/home?userId=${user.id}&t=${Date.now()}`),
                fetch(`https://fitos-final.onrender.com/api/workout/history?userId=${user.id}`)
            ]);

            if (homeRes.ok) {
                const homeData = await homeRes.json();
                if (homeData.user) {
                    const serverXP = homeData.user.currentXP || 0;
                    setXp(serverXP);
                    const updatedUser = { ...user, currentXP: serverXP, ...homeData.user };
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                if (Array.isArray(historyData)) {
                    const uniqueDates = [...new Set(historyData.map(h => new Date(h.date).toISOString().split('T')[0]))];
                    uniqueDates.sort((a, b) => new Date(b) - new Date(a));
                    
                    const todayStr = new Date().toISOString().split('T')[0];
                    let count = 0;
                    let checkDate = new Date();
                    if (!uniqueDates.includes(todayStr)) checkDate.setDate(checkDate.getDate() - 1);

                    while (true) {
                        const str = checkDate.toISOString().split('T')[0];
                        if (uniqueDates.includes(str)) { 
                            count++; 
                            checkDate.setDate(checkDate.getDate() - 1); 
                        } else { 
                            break; 
                        }
                    }
                    setStreak(count);
                }
            }
        } catch (err) {
            console.log("Erro ao carregar dados críticos (mantendo cache local):", err);
        }

        try {
            const noticeRes = await fetch(`https://fitos-final.onrender.com/api/notices?t=${Date.now()}`);
            if (noticeRes.ok) {
                const noticeData = await noticeRes.json();
                if (noticeData && noticeData.title) {
                    const dismissedId = await AsyncStorage.getItem('dismissedNoticeId');
                    if (dismissedId !== String(noticeData.id)) {
                        setNotice(noticeData);
                    } else {
                        setNotice(null);
                    }
                } else {
                    setNotice(null);
                }
            }
        } catch (noticeErr) {
            setNotice(null); 
        }

      }
    } catch (e) { 
        console.log("Erro geral loadHome:", e); 
    } finally { 
        setLoading(false); 
        setRefreshing(false); 
    }
  };

  const handleDismissNotice = async () => {
    if (!notice) return;
    setNotice(null);
    try {
        await AsyncStorage.setItem('dismissedNoticeId', String(notice.id));
    } catch (e) {
        console.log("Erro ao salvar leitura do aviso");
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now(), text: chatInput, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

    try {
        const gender = userData?.anamneses?.[0]?.genero || userData?.gender || 'Não informado';
        const goal = userData?.anamneses?.[0]?.objetivo || userData?.goal || 'Melhorar o shape';
        const userLevelTitle = levelData.title; 

        const res = await fetch('https://fitos-final.onrender.com/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMsg.text,
                userId: userData.id,
                userName: userName,
                userGender: gender,
                userGoal: goal,
                userLevel: userLevelTitle
            })
        });

        const data = await res.json();
        
        if (data.reply) {
             const aiMsg = { id: Date.now() + 1, text: data.reply, sender: 'ai' };
             setMessages(prev => [...prev, aiMsg]);
        } else {
            throw new Error("Sem resposta da IA");
        }

    } catch (error) {
        console.log("Erro Chat:", error);
        const errorMsg = { id: Date.now() + 1, text: "Falha na comunicação com a base, atleta. Tente novamente.", sender: 'ai' };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsTyping(false);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const renderChatMessage = ({ item }) => {
    const isAi = item.sender === 'ai';
    return (
        <View style={[
            styles.chatBubble, 
            isAi ? [styles.chatBubbleAi, { backgroundColor: theme.surface, borderColor: theme.border }] 
                 : [styles.chatBubbleUser, { backgroundColor: theme.accent }]
        ]}>
            {isAi && <Text style={[styles.chatSenderName, { color: theme.accent }]}>PA COACH</Text>}
            <Text style={[styles.chatText, isAi ? {color: theme.text} : {color: theme.isDark ? '#000' : '#FFF'}]}>
                {item.text}
            </Text>
        </View>
    );
  };

  if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator color={theme.accent} /></View>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      {/* 🔥 TRAVA DO PWA (bounces={false} e overScrollMode="never") */}
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); loadHomeData();}} tintColor={theme.accent}/>}
        bounces={false}
        overScrollMode="never"
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>BEM-VINDO AO FOCO,</Text>
            <Text style={[styles.name, { color: theme.text }]}>{userName.toUpperCase()} ⚡</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.statusBadge, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => Alert.alert(levelData.title, levelData.desc)}
          >
            <Text style={[styles.statusText, { color: theme.accent }]}>{levelData.title}</Text>
          </TouchableOpacity>
        </View>

        {notice && (
            <View style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                    <View style={{flexDirection:'row', alignItems:'center', gap:8, flex:1}}>
                        <MaterialCommunityIcons name="bullhorn" size={20} color="#000" />
                        <Text style={styles.noticeTitle}>{notice.title}</Text>
                    </View>
                    <TouchableOpacity onPress={handleDismissNotice} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                        <MaterialCommunityIcons name="close" size={20} color="#000" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.noticeText}>{notice.content}</Text>
            </View>
        )}

        <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                <Text style={[styles.levelText, { color: theme.accent }]}>NÍVEL {currentLevel}</Text>
                <Text style={[styles.xpText, { color: theme.textSecondary }]}>{currentLevelProgress} / {nextLevelXP} XP</Text>
            </View>
            <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                <View style={[styles.xpBarFill, { width: `${(currentLevelProgress/nextLevelXP)*100}%`, backgroundColor: theme.accent }]} />
            </View>
        </View>

        <TouchableOpacity 
            style={[styles.mainActionBtn, { backgroundColor: theme.accent, shadowColor: theme.accent }]} 
            onPress={() => navigation.navigate('Treinos')}
        >
            <View>
                <Text style={[styles.actionLabel, { color: theme.isDark ? '#000' : '#FFF' }]}>SEU OBJETIVO DE HOJE</Text>
                <Text style={[styles.actionTitle, { color: theme.isDark ? '#000' : '#FFF' }]}>INICIAR TREINO</Text>
            </View>
            <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="dumbbell" size={28} color={theme.isDark ? '#000' : '#FFF'} />
            </View>
        </TouchableOpacity>

        <View style={styles.gridContainer}>
            <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('CheckIn')}>
                <View style={[styles.gridIcon, { backgroundColor: theme.accent + '33' }]}>
                    <MaterialCommunityIcons name="camera-plus" size={24} color={theme.accent} />
                </View>
                <Text style={[styles.gridText, { color: theme.text }]}>Check-in</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('Evolução')}>
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(50, 173, 230, 0.2)' }]}>
                    <MaterialCommunityIcons name="chart-line" size={24} color="#32ADE6" />
                </View>
                <Text style={[styles.gridText, { color: theme.text }]}>Evolução</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('UserHistory')}>
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}>
                    <MaterialCommunityIcons name="history" size={24} color="#FF3B30" />
                </View>
                <Text style={[styles.gridText, { color: theme.text }]}>Histórico</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
            {/* 🔥 CORREÇÃO DE COR: O PA TEAM agora acompanha a cor do texto, e o subtítulo fica com a secundária */}
            <Text style={[styles.footerText, { color: theme.text }]}>PA TEAM</Text>
            <Text style={[styles.footerSubText, { color: theme.textSecondary }]}>CONSULTORIA DE PERFORMANCE</Text>
        </View>

      </ScrollView>

      {/* 🔥 FAB DO CHATBOT */}
      <TouchableOpacity 
        style={[styles.fabChat, { shadowColor: theme.accent }]} 
        onPress={() => setChatVisible(true)}
      >
        <LinearGradient
            colors={[theme.accent, theme.accent]}
            style={styles.fabGradient}
        >
            <MaterialCommunityIcons name="robot" size={32} color={theme.isDark ? '#000' : '#FFF'} />
        </LinearGradient>
      </TouchableOpacity>

      {/* 🔥 MODAL DO CHATBOT */}
      <Modal visible={chatVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.chatModalContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={[styles.chatContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={[styles.chatHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <View style={[styles.chatAvatar, { backgroundColor: theme.accent }]}>
                            <MaterialCommunityIcons name="robot" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                        </View>
                        <View>
                            <Text style={[styles.chatTitle, { color: theme.text }]}>PA COACH AI</Text>
                            <Text style={[styles.chatStatus, { color: theme.accent }]}>Online agora</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => setChatVisible(false)} style={{padding:5}}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderChatMessage}
                    contentContainerStyle={{padding: 15}}
                    style={{flex: 1}}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    bounces={false}
                    overScrollMode="never"
                />

                <View style={[styles.chatInputArea, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                    <TextInput 
                        style={[styles.chatInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        placeholder="Pergunte sobre treinos..."
                        placeholderTextColor={theme.textSecondary}
                        value={chatInput}
                        onChangeText={setChatInput}
                        onSubmitEditing={handleSendChat}
                    />
                    <TouchableOpacity style={[styles.chatSendBtn, { backgroundColor: theme.accent }]} onPress={handleSendChat} disabled={isTyping}>
                        {isTyping ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" /> : <MaterialCommunityIcons name="send" size={20} color={theme.isDark ? '#000' : '#FFF'} />}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0, 
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  greeting: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  name: { fontSize: 24, fontWeight: '900' },
  
  statusBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  statusText: { fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  
  noticeCard: { backgroundColor:'#32ADE6', padding:15, borderRadius:16, marginBottom:20, shadowColor: "#32ADE6", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  noticeHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 },
  noticeTitle: { color:'#000', fontWeight:'900', fontSize:14, textTransform:'uppercase' },
  noticeText: { color:'#000', fontSize:13, fontWeight:'600', lineHeight: 18 },

  xpCard: { padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  levelText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  xpText: { fontSize: 10, fontWeight: 'bold' },
  xpBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%' },
  
  mainActionBtn: { padding: 25, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 5 },
  actionLabel: { fontSize: 10, fontWeight: '900', opacity: 0.6, marginBottom: 4 },
  actionTitle: { fontSize: 22, fontWeight: '900' },
  iconCircle: { width: 50, height: 50, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  gridItem: { width: '31%', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1 },
  gridIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { fontSize: 10, fontWeight: 'bold' },
  
  footerContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  footerText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  footerSubText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },

  fabChat: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, zIndex: 999, elevation: 10, shadowOpacity: 0.3, shadowRadius: 10 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  
  chatModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  chatContent: { height: '80%', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden', borderWidth: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  chatTitle: { fontWeight: 'bold', fontSize: 16 },
  chatStatus: { fontSize: 10 },
  
  chatInputArea: { 
    flexDirection: 'row', 
    padding: 15, 
    paddingBottom: Platform.OS === 'android' ? 50 : 25, 
    alignItems: 'center', 
    borderTopWidth: 1 
  },
  chatInput: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, borderWidth: 1 },
  chatSendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  chatBubble: { padding: 12, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
  chatBubbleAi: { alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1 },
  chatBubbleUser: { alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  chatSenderName: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  chatText: { fontSize: 14 }
});