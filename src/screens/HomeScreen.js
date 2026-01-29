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
  Image,
  Modal,                // Novo
  TextInput,            // Novo
  KeyboardAvoidingView, // Novo
  FlatList,             // Novo
  Keyboard              // Novo
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Para o botão do Chat ficar Premium

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null);
  const [xp, setXp] = useState(0); 
  const [streak, setStreak] = useState(0);
  const [notice, setNotice] = useState(null); 
  const [latestVideo, setLatestVideo] = useState(null); 
  
  const [waterDrank, setWaterDrank] = useState(0);
  const [waterGoal, setWaterGoal] = useState(3000); 

  // 🔥 STATES DO CHATBOT (NOVO)
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

  // 🔥 FUNÇÃO ATUALIZADA: RETORNA TÍTULO E LEGENDA
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

        // Lógica de Água
        let metaCalculada = 3000;
        if (user.anamneses && user.anamneses.length > 0) {
            if (user.anamneses[0].aguaIdeal) metaCalculada = user.anamneses[0].aguaIdeal;
            else if (user.anamneses[0].peso) metaCalculada = user.anamneses[0].peso * 35;
        }
        setWaterGoal(Math.round(metaCalculada));

        const today = new Date().toISOString().split('T')[0];
        const savedWater = await AsyncStorage.getItem(`water_${user.id}_${today}`);
        if (savedWater) setWaterDrank(parseInt(savedWater));
        else setWaterDrank(0);

        // BUSCA DADOS CRÍTICOS
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
                    if (homeData.anamnese && homeData.anamnese.aguaIdeal) setWaterGoal(homeData.anamnese.aguaIdeal);
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

        // BUSCA AVISOS
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

        // BUSCA ÚLTIMO VÍDEO PA FLIX
        try {
            const videoRes = await fetch(`https://fitos-final.onrender.com/api/contents?t=${Date.now()}`);
            if (videoRes.ok) {
                const videoData = await videoRes.json();
                if (Array.isArray(videoData)) {
                    let allVideos = [];
                    videoData.forEach(cat => {
                        if(cat.videos) allVideos = [...allVideos, ...cat.videos];
                    });
                    if (allVideos.length > 0) setLatestVideo(allVideos[0]);
                }
            }
        } catch (vErr) { console.log("Erro video home"); }

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

  const addWater = async () => {
    const newAmount = waterDrank + 250;
    setWaterDrank(newAmount);
    if (userData) {
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(`water_${userData.id}_${today}`, newAmount.toString());
        
        if (newAmount >= waterGoal) {
            const xpKey = `water_xp_awarded_${userData.id}_${today}`;
            const alreadyAwarded = await AsyncStorage.getItem(xpKey);
            if (!alreadyAwarded) {
                try {
                    const res = await fetch('https://fitos-final.onrender.com/api/user/xp', {
                        method: 'POST', headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ userId: userData.id, amount: 50 }) 
                    });
                    const json = await res.json();
                    if (res.ok) {
                        setXp(json.newXP); 
                        Alert.alert("META BATIDA! 💧", "Você ganhou +50 XP pela hidratação!");
                        await AsyncStorage.setItem(xpKey, 'true');
                        
                        const currentUserStr = await AsyncStorage.getItem('user');
                        if (currentUserStr) {
                            const u = JSON.parse(currentUserStr);
                            u.currentXP = json.newXP;
                            await AsyncStorage.setItem('user', JSON.stringify(u));
                        }
                    }
                } catch (e) {}
            }
        }
    }
  };

  // 🔥 LÓGICA DO CHATBOT
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now(), text: chatInput, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Rolar para baixo
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

    try {
        // 2. Prepara os dados do aluno para a IA saber com quem fala
        // Tenta pegar da anamnese, se não tiver usa padrão
        const gender = userData?.anamneses?.[0]?.genero || userData?.gender || 'Não informado';
        const goal = userData?.anamneses?.[0]?.objetivo || userData?.goal || 'Melhorar o shape';
        const userLevelTitle = levelData.title; // Ex: "Projeto Mutante"

        // 3. Chama o seu Backend (que chama o Gemini)
        // ATENÇÃO: Verifique se a URL base está correta
        const res = await fetch('https://fitos-final.onrender.com/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMsg.text,
                userName: userName,
                userGender: gender,
                userGoal: goal,
                userLevel: userLevelTitle
            })
        });

        const data = await res.json();
        
        // 4. Recebe a resposta e mostra
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

    // LÓGICA FAKE INTELIGENTE (Substituir por API depois)
    setTimeout(() => {
        let replyText = "Entendido! Vamos focar nisso. O que mais você precisa?";
        const lowerInput = userMsg.text.toLowerCase();

        if (lowerInput.includes('oi') || lowerInput.includes('olá')) {
            replyText = `Fala ${userName}! Bora esmagar hoje? Qual é o treino?`;
        } else if (lowerInput.includes('treino') || lowerInput.includes('fazer')) {
            replyText = "Se for treino de força, capricha na execução. Se for cardio, mantém a intensidade. Quer que eu sugira algo?";
        } else if (lowerInput.includes('dieta') || lowerInput.includes('fome')) {
            replyText = "Fome é sinal que o metabolismo tá girando! Mas segura a onda, bebe água e foca na proteína.";
        } else if (lowerInput.includes('dor') || lowerInput.includes('machuquei')) {
            replyText = "Opa, cuidado. Dor de lesão é sinal de PARE. Dor de treino é sinal de CONTINUE. Sabe diferenciar?";
        }

        const aiMsg = { id: Date.now() + 1, text: replyText, sender: 'ai' };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }, 1500); 
  };

  const renderChatMessage = ({ item }) => {
    const isAi = item.sender === 'ai';
    return (
        <View style={[
            styles.chatBubble, 
            isAi ? styles.chatBubbleAi : styles.chatBubbleUser
        ]}>
            {isAi && <Text style={styles.chatSenderName}>PA COACH</Text>}
            <Text style={[styles.chatText, isAi ? {color:'#FFF'} : {color:'#000'}]}>
                {item.text}
            </Text>
        </View>
    );
  };

  const progressPercent = Math.min((waterDrank / waterGoal) * 100, 100);
  const isWaterLow = waterDrank < (waterGoal * 0.3); 

  if (loading) return <View style={styles.center}><ActivityIndicator color="#CCFF00" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }} // Aumentei paddingBottom pra não cobrir conteudo com FAB
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); loadHomeData();}} tintColor="#CCFF00"/>}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>BEM-VINDO AO FOCO,</Text>
            <Text style={styles.name}>{userName.toUpperCase()} ⚡</Text>
          </View>
          
          {/* 🔥 AGORA O BADGE É CLICÁVEL E MOSTRA A LEGENDA */}
          <TouchableOpacity 
            style={styles.statusBadge} 
            onPress={() => Alert.alert(levelData.title, levelData.desc)}
          >
            <Text style={styles.statusText}>{levelData.title}</Text>
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

        {/* CARD DESTAQUE PA FLIX */}
        {latestVideo && (
            <TouchableOpacity 
                style={styles.flixCard} 
                onPress={() => navigation.navigate('PA FLIX')}
            >
                <Image 
                    source={{ uri: latestVideo.thumbUrl || 'https://via.placeholder.com/150' }} 
                    style={styles.flixThumb} 
                />
                <View style={styles.flixContent}>
                    <View style={styles.flixTagContainer}>
                        <View style={styles.flixTag}><Text style={styles.flixTagText}>NOVO</Text></View>
                        <Text style={styles.flixCategory}>{latestVideo.category}</Text>
                    </View>
                    <Text style={styles.flixTitle} numberOfLines={2}>{latestVideo.title}</Text>
                    <View style={styles.flixCta}>
                        <MaterialCommunityIcons name="play-circle" size={16} color="#CCFF00" />
                        <Text style={styles.flixCtaText}>Assistir Agora</Text>
                    </View>
                </View>
                <View style={styles.flixBgIcon}>
                    <MaterialCommunityIcons name="play" size={100} color="rgba(255,255,255,0.05)" />
                </View>
            </TouchableOpacity>
        )}

        <View style={styles.xpCard}>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                <Text style={styles.levelText}>NÍVEL {currentLevel}</Text>
                <Text style={styles.xpText}>{currentLevelProgress} / {nextLevelXP} XP</Text>
            </View>
            <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, {width: `${(currentLevelProgress/nextLevelXP)*100}%`}]} />
            </View>
        </View>

        <TouchableOpacity style={styles.mainActionBtn} onPress={() => navigation.navigate('Treinos')}>
            <View>
                <Text style={styles.actionLabel}>SEU OBJETIVO DE HOJE</Text>
                <Text style={styles.actionTitle}>INICIAR TREINO</Text>
            </View>
            <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="dumbbell" size={28} color="#000" />
            </View>
        </TouchableOpacity>

        <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CheckIn')}>
                <View style={[styles.gridIcon, {backgroundColor: 'rgba(204, 255, 0, 0.1)'}]}>
                    <MaterialCommunityIcons name="camera-plus" size={24} color="#CCFF00" />
                </View>
                <Text style={styles.gridText}>Check-in</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Evolução')}>
                <View style={[styles.gridIcon, {backgroundColor: 'rgba(50, 173, 230, 0.1)'}]}>
                    <MaterialCommunityIcons name="chart-line" size={24} color="#32ADE6" />
                </View>
                <Text style={styles.gridText}>Evolução</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('UserHistory')}>
                <View style={[styles.gridIcon, {backgroundColor: 'rgba(255, 59, 48, 0.1)'}]}>
                    <MaterialCommunityIcons name="history" size={24} color="#FF3B30" />
                </View>
                <Text style={styles.gridText}>Histórico</Text>
            </TouchableOpacity>
        </View>

        <View style={[styles.waterCard, isWaterLow && {borderColor: '#FF3B30', borderWidth:1}]}>
            <View style={styles.waterHeader}>
                <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                    <MaterialCommunityIcons name="water" size={20} color="#32ADE6" />
                    <Text style={styles.waterTitle}>HIDRATAÇÃO DIÁRIA</Text>
                </View>
                {isWaterLow && <Text style={{color:'#FF3B30', fontSize:10, fontWeight:'bold'}}>BEBA MAIS!</Text>}
            </View>
            <View style={styles.waterRow}>
                <Text style={styles.waterValue}>{waterDrank}</Text>
                <Text style={styles.waterUnit}>ml</Text>
                <Text style={styles.waterGoal}> / {waterGoal}ml</Text>
            </View>
            <View style={styles.waterBarBg}>
                <View style={[styles.waterBarFill, {width: `${progressPercent}%`}]} />
            </View>
            <TouchableOpacity style={styles.addWaterBtn} onPress={addWater}>
                <Text style={styles.addWaterText}>+ 250ML</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
            <Text style={styles.footerText}>PA TEAM</Text>
            <Text style={styles.footerSubText}>CONSULTORIA DE PERFORMANCE</Text>
        </View>

      </ScrollView>

      {/* 🔥 FAB DO CHATBOT */}
      <TouchableOpacity 
        style={styles.fabChat} 
        onPress={() => setChatVisible(true)}
      >
        <LinearGradient
            colors={['#CCFF00', '#99CC00']}
            style={styles.fabGradient}
        >
            <MaterialCommunityIcons name="robot" size={32} color="#000" />
        </LinearGradient>
      </TouchableOpacity>

      {/* 🔥 MODAL DO CHATBOT */}
      <Modal visible={chatVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.chatModalContainer}
        >
            <View style={styles.chatContent}>
                {/* Header Chat */}
                <View style={styles.chatHeader}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <View style={styles.chatAvatar}>
                            <MaterialCommunityIcons name="robot" size={24} color="#000" />
                        </View>
                        <View>
                            <Text style={styles.chatTitle}>PA COACH AI</Text>
                            <Text style={styles.chatStatus}>Online agora</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => setChatVisible(false)} style={{padding:5}}>
                        <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Lista de Mensagens */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderChatMessage}
                    contentContainerStyle={{padding: 15}}
                    style={{flex: 1}}
                />

                {/* Input Area */}
                <View style={styles.chatInputArea}>
                    <TextInput 
                        style={styles.chatInput}
                        placeholder="Pergunte sobre treinos..."
                        placeholderTextColor="#666"
                        value={chatInput}
                        onChangeText={setChatInput}
                        onSubmitEditing={handleSendChat}
                    />
                    <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChat} disabled={isTyping}>
                        {isTyping ? <ActivityIndicator color="#000" size="small" /> : <MaterialCommunityIcons name="send" size={20} color="#000" />}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  greeting: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  name: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  
  // 🔥 ESTILO DO BADGE (CLICÁVEL)
  statusBadge: { backgroundColor: '#111', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statusText: { color: '#CCFF00', fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  
  noticeCard: { backgroundColor:'#32ADE6', padding:15, borderRadius:16, marginBottom:20, shadowColor: "#32ADE6", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  noticeHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 },
  noticeTitle: { color:'#000', fontWeight:'900', fontSize:14, textTransform:'uppercase' },
  noticeText: { color:'#000', fontSize:13, fontWeight:'600', lineHeight: 18 },

  xpCard: { backgroundColor: '#111', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  levelText: { color: '#CCFF00', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  xpText: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  xpBarBg: { height: 8, backgroundColor: '#000', borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#CCFF00' },
  mainActionBtn: { backgroundColor: '#CCFF00', padding: 25, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, shadowColor: "#CCFF00", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 5 },
  actionLabel: { color: '#000', fontSize: 10, fontWeight: '900', opacity: 0.6, marginBottom: 4 },
  actionTitle: { color: '#000', fontSize: 22, fontWeight: '900' },
  iconCircle: { width: 50, height: 50, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  gridItem: { backgroundColor: '#111', width: '31%', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  gridIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  waterCard: { backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222', marginBottom: 20 },
  waterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', marginBottom: 10 },
  waterTitle: { color: '#666', fontSize: 12, fontWeight: '900' },
  waterRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  waterValue: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  waterUnit: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginLeft: 2 },
  waterGoal: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  waterBarBg: { height: 8, backgroundColor: '#000', borderRadius: 4, overflow: 'hidden', marginBottom: 15 },
  waterBarFill: { height: '100%', backgroundColor: '#32ADE6' },
  addWaterBtn: { backgroundColor: '#32ADE6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  addWaterText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  footerContainer: { alignItems: 'center', marginTop: 10, marginBottom: 10 },
  footerText: { color: '#666', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  footerSubText: { color: '#444', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },

  flixCard: { backgroundColor: '#1A1A1A', borderRadius: 16, flexDirection: 'row', padding: 10, marginBottom: 20, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  flixThumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#333' },
  flixContent: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  flixTagContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  flixTag: { backgroundColor: '#CCFF00', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  flixTagText: { color: '#000', fontSize: 8, fontWeight: '900' },
  flixCategory: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  flixTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', lineHeight: 18, marginBottom: 6 },
  flixCta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flixCtaText: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold' },
  flixBgIcon: { position: 'absolute', right: -20, bottom: -20, opacity: 0.5 },

  // 🔥 ESTILOS DO CHATBOT (NOVO)
  fabChat: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, zIndex: 999, elevation: 10, shadowColor: '#CCFF00', shadowOpacity: 0.3, shadowRadius: 10 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  
  chatModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  chatContent: { backgroundColor: '#111', height: '80%', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#333' },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CCFF00', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  chatTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  chatStatus: { color: '#CCFF00', fontSize: 10 },
  
  chatInputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#1A1A1A', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#333' },
  chatInput: { flex: 1, backgroundColor: '#000', color: '#FFF', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, borderWidth: 1, borderColor: '#333' },
  chatSendBtn: { backgroundColor: '#CCFF00', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  chatBubble: { padding: 12, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
  chatBubbleAi: { backgroundColor: '#222', alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#333' },
  chatBubbleUser: { backgroundColor: '#CCFF00', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  chatSenderName: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  chatText: { fontSize: 14 }
});