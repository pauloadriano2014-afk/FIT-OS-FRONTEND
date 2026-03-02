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
  FlatList,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

/* 🔥 IMPORTAÇÃO DO TEMA */
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// 🔥 PERGUNTAS RÁPIDAS PARA O CHAT
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
  const [xp, setXp] = useState(0); 
  const [streak, setStreak] = useState(0);

  // STATES DO CHATBOT
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

  useFocusEffect(
    useCallback(() => { loadHomeData(); }, [])
  );

  const loadHomeData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserData(user);
        
        const firstName = user.name?.split(' ')[0] || 'Atleta';
        setUserName(firstName);
        
        if (messages.length === 0) {
            setMessages([{ 
                id: 1, 
                text: `Fala, ${firstName}! 👊 Sou o PA Coach AI. Use os botões abaixo se tiver alguma dúvida sobre o app ou treino.`, 
                sender: 'ai' 
            }]);
        }

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
            console.log("Erro ao carregar dados críticos:", err);
        }
      }
    } catch (e) { 
        console.log("Erro geral loadHome:", e); 
    } finally { 
        setLoading(false); 
        setRefreshing(false); 
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

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  
  // 🔥 SCROLL BLINDADO: Copiado EXATAMENTE da sua ProfileScreen que funciona. Sem overflow escondido, sem 100vh.
  const RootComponent = isWeb ? View : SafeAreaView;

  if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator color={theme.accent} size="large" /></View>;

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
                activeOpacity={0.9}
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
                <Text style={[styles.footerText, { color: theme.text }]}>PA TEAM</Text>
                <Text style={[styles.footerSubText, { color: theme.textSecondary }]}>CONSULTORIA DE PERFORMANCE</Text>
            </View>
          </ScrollView>

          {/* FAB DO CHATBOT */}
          <TouchableOpacity 
            style={[styles.fabChat, { shadowColor: theme.accent }]} 
            onPress={() => setChatVisible(true)}
          >
            <LinearGradient colors={[theme.accent, theme.accent]} style={styles.fabGradient}>
                <MaterialCommunityIcons name="robot" size={32} color={theme.isDark ? '#000' : '#FFF'} />
            </LinearGradient>
          </TouchableOpacity>
      </View>

      {/* MODAL DO CHATBOT */}
      <Modal visible={chatVisible} animationType="slide" transparent>
        <View style={styles.chatModalOverlay}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={[styles.chatModalContainer, isWeb && { width: '100%', maxWidth: 480, alignSelf: 'center' }]}
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
                        contentContainerStyle={{padding: 20}}
                        style={{flex: 1}}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* BOTÕES RÁPIDOS */}
                    <View style={{ borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.surface, paddingTop: 10 }}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={{ paddingHorizontal: 15, gap: 10 }}
                            style={{ maxHeight: 50 }}
                        >
                            {QUICK_QUESTIONS.map((question, index) => (
                                <TouchableOpacity 
                                    key={index}
                                    style={[styles.quickActionBtn, { borderColor: theme.accent, backgroundColor: theme.bg }]}
                                    onPress={() => handleSendChat(question)}
                                    disabled={isTyping}
                                >
                                    <Text style={[styles.quickActionText, { color: theme.text }]}>{question}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.chatInputArea}>
                            <TextInput 
                                style={[styles.chatInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                placeholder="Ou digite sua dúvida..."
                                placeholderTextColor={theme.textSecondary}
                                value={chatInput}
                                onChangeText={setChatInput}
                                onSubmitEditing={() => handleSendChat()}
                                outlineStyle="none"
                            />
                            <TouchableOpacity style={[styles.chatSendBtn, { backgroundColor: theme.accent }]} onPress={() => handleSendChat()} disabled={isTyping}>
                                {isTyping ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" /> : <MaterialCommunityIcons name="send" size={20} color={theme.isDark ? '#000' : '#FFF'} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </KeyboardAvoidingView>
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
  
  xpCard: { padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1 },
  levelText: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  xpText: { fontSize: 11, fontWeight: 'bold' },
  xpBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 4 },
  
  mainActionBtn: { padding: 25, borderRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  actionLabel: { fontSize: 11, fontWeight: '900', opacity: 0.8, marginBottom: 4, letterSpacing: 0.5 },
  actionTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  iconCircle: { width: 54, height: 54, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  gridItem: { width: '31%', padding: 18, borderRadius: 24, alignItems: 'center', borderWidth: 1 },
  gridIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridText: { fontSize: 11, fontWeight: 'bold' },
  
  footerContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  footerText: { fontWeight: '900', fontSize: 16, letterSpacing: 1.5 },
  footerSubText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },

  fabChat: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, zIndex: 999, elevation: 10, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  
  chatModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  chatModalContainer: { flex: 1, justifyContent: 'flex-end' },
  chatContent: { height: '85%', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', borderWidth: 1, borderBottomWidth: 0 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  chatAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  chatTitle: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  chatStatus: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  
  quickActionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, height: 40, justifyContent: 'center' },
  quickActionText: { fontSize: 12, fontWeight: '600' },

  chatInputArea: { flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'android' ? 40 : 25, alignItems: 'center' },
  chatInput: { flex: 1, borderRadius: 25, paddingHorizontal: 20, paddingVertical: 14, marginRight: 10, borderWidth: 1, fontSize: 15 },
  chatSendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },

  chatBubble: { padding: 16, borderRadius: 20, marginBottom: 12, maxWidth: '85%' },
  chatBubbleAi: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
  chatBubbleUser: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  chatSenderName: { fontSize: 11, fontWeight: '900', marginBottom: 6, letterSpacing: 0.5 },
  chatText: { fontSize: 15, lineHeight: 22, fontWeight: '500' }
});