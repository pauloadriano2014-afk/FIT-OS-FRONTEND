import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, 
  TextInput, StatusBar, RefreshControl, Modal, ScrollView, Image, Alert, 
  KeyboardAvoidingView, Platform, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Padronizado com Biblioteca
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState('GESTAO'); 
  const [alunos, setAlunos] = useState([]);
  const [feed, setFeed] = useState([]); 
  const [checkins, setCheckins] = useState([]);
  const [filteredAlunos, setFilteredAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [sendingNotice, setSendingNotice] = useState(false);

  useFocusEffect(
    useCallback(() => { fetchData(); }, [])
  );

  const fetchData = async () => {
    try {
      if(!refreshing) setLoading(true);
      const t = Date.now();
      
      const [resData, resCheckins] = await Promise.all([
          fetch(`https://fitos-final.onrender.com/api/admin/data?t=${t}`),
          fetch(`https://fitos-final.onrender.com/api/checkin?t=${t}`)
      ]);

      const data = await resData.json();
      const dataCheckins = await resCheckins.json();
      
      if (data.users) {
        setAlunos(data.users);
        setFilteredAlunos(data.users);
      }
      if (data.recentLogs) setFeed(data.recentLogs);
      if (Array.isArray(dataCheckins)) setCheckins(dataCheckins);

    } catch (e) { console.log(e); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['user', 'token']);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleDeleteLog = (logId) => {
      Alert.alert("Remover", "Deseja ocultar este item do feed?", [
          { text: "Cancelar" },
          { text: "Sim", style: 'destructive', onPress: () => {
              setFeed(current => current.filter(item => item.id !== logId));
          }}
      ]);
  };

  const handleSendNotice = async () => {
      if (!noticeTitle || !noticeMessage) return Alert.alert("Erro", "Preencha título e mensagem.");
      setSendingNotice(true);
      try {
          await fetch('https://fitos-final.onrender.com/api/notices', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ title: noticeTitle, content: noticeMessage })
          });
          Alert.alert("Sucesso", "Aviso enviado!");
          setNoticeModalVisible(false);
          setNoticeTitle('');
          setNoticeMessage('');
      } catch (e) { Alert.alert("Erro", "Falha ao enviar."); } 
      finally { setSendingNotice(false); }
  };

  // --- RENDER ITEM FUNCTIONS ---
  const renderCheckinItem = ({ item }) => (
      <TouchableOpacity 
        style={styles.feedCard} 
        onPress={() => { setSelectedCheckin(item); setCheckinModalVisible(true); }}
      >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 173, 230, 0.15)' }]}>
              <MaterialCommunityIcons name="camera-account" size={20} color="#32ADE6" />
          </View>
          <View style={{flex: 1}}>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                  <Text style={styles.feedUser}>{item.user?.name || "Aluno"}</Text>
                  <Text style={styles.feedTime}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
              </View>
              <Text style={styles.feedAction}>
                  Check-in: <Text style={{color:'#FFF', fontWeight:'bold'}}>{item.weight ? `${item.weight}kg` : 'Fotos'}</Text>
              </Text>
              {item.feedback ? <Text numberOfLines={1} style={styles.checkinFeedback}>"{item.feedback}"</Text> : null}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
      </TouchableOpacity>
  );

  const renderFeedItem = ({ item }) => {
      const date = new Date(item.date);
      const isToday = date.getDate() === new Date().getDate();
      const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dayString = isToday ? `Hoje às ${time}` : date.toLocaleDateString('pt-BR');

      return (
        <View style={styles.feedCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(204, 255, 0, 0.15)' }]}>
                <MaterialCommunityIcons name="check-bold" size={20} color="#CCFF00" />
            </View>
            <View style={{flex: 1}}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <Text style={styles.feedUser}>{item.user?.name || "Aluno"}</Text>
                    <Text style={styles.feedTime}>{dayString}</Text>
                </View>
                <Text style={styles.feedAction}>
                    Concluiu <Text style={{color:'#CCFF00', fontWeight:'bold'}}>{item.workoutName ? item.workoutName.toUpperCase() : "TREINO"}</Text>
                </Text>
                {item.progressions > 0 && (
                    <View style={styles.progBadge}>
                        <MaterialCommunityIcons name="fire" size={12} color="#000" />
                        <Text style={styles.progText}>{item.progressions} PRs!</Text>
                    </View>
                )}
            </View>
            <TouchableOpacity onPress={() => handleDeleteLog(item.id)} style={{padding:5, marginLeft:5}}>
                <MaterialCommunityIcons name="close" size={16} color="#444" />
            </TouchableOpacity>
        </View>
      );
  };

  const renderAluno = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdminAlunoOptions', { aluno: item })}> 
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.alunoName}>{item.name}</Text>
        <View style={{flexDirection:'row', gap:5}}>
            <Text style={styles.alunoEmail}>{item.email}</Text>
            {item.plan === 'ELITE' && <View style={styles.tagElite}><Text style={styles.tagText}>ELITE</Text></View>}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  // 🔥 LÓGICA DA BIBLIOTECA (Raiz Dinâmica)
  const RootComponent = Platform.OS === 'web' ? View : SafeAreaView;
  const rootStyle = Platform.OS === 'web' ? { height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#000' } : { flex: 1, backgroundColor: '#000' };

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <View>
            <Text style={styles.title}>FIT OS <Text style={{color: '#CCFF00'}}>COMMAND</Text></Text>
            <Text style={styles.subtitle}>PAINEL ADMINISTRATIVO</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {['ALUNOS', 'CHECKINS', 'FEED', 'GESTAO'].map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab===tab && styles.tabActive]} onPress={()=>setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab===tab && styles.tabTextActive]}>
                    {tab === 'GESTAO' ? 'SISTEMA' : tab}
                </Text>
                {tab === 'CHECKINS' && checkins.length > 0 && (
                    <View style={styles.badgeCount}><Text style={styles.badgeText}>{checkins.length}</Text></View>
                )}
            </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        
        {activeTab === 'ALUNOS' && (
            <>
                <TextInput 
                    style={styles.searchBar} placeholder="Buscar aluno..." placeholderTextColor="#666"
                    value={search} onChangeText={(t) => { setSearch(t); setFilteredAlunos(alunos.filter(a => a.name.toLowerCase().includes(t.toLowerCase()))); }} 
                />
                <FlatList 
                    data={filteredAlunos} keyExtractor={item => item.id}
                    // 🔥 CORREÇÃO DE ENQUADRAMENTO
                    contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }} 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor="#CCFF00" />}
                    renderItem={renderAluno}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum aluno encontrado.</Text>}
                />
            </>
        )}

        {activeTab === 'CHECKINS' && (
            <FlatList 
                data={checkins} keyExtractor={item => item.id}
                // 🔥 CORREÇÃO DE ENQUADRAMENTO
                contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor="#CCFF00" />}
                renderItem={renderCheckinItem}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum check-in.</Text>}
            />
        )}

        {activeTab === 'FEED' && (
            <FlatList 
                data={feed} keyExtractor={item => item.id}
                // 🔥 CORREÇÃO DE ENQUADRAMENTO
                contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor="#CCFF00" />}
                renderItem={renderFeedItem}
                ListEmptyComponent={<Text style={styles.empty}>Nada recente.</Text>}
            />
        )}

        {activeTab === 'GESTAO' && (
            <ScrollView 
                style={{ flex: 1 }} 
                // 🔥 CORREÇÃO DE ENQUADRAMENTO
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 150, paddingHorizontal: 20 }} 
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.gridGestao}>
                    <TouchableOpacity style={styles.bigCard} onPress={() => navigation.navigate('GerenciarTemplates')}>
                        <View style={[styles.iconCircle, {backgroundColor: '#CCFF00'}]}><MaterialCommunityIcons name="folder-multiple" size={32} color="#000" /></View>
                        <Text style={styles.bigCardTitle}>MEUS TEMPLATES</Text>
                        <Text style={styles.bigCardDesc}>Crie fichas padrão.</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.bigCard} onPress={() => navigation.navigate('BibliotecaAdmin')}>
                        <View style={[styles.iconCircle, {backgroundColor: '#333'}]}><MaterialCommunityIcons name="database-edit" size={32} color="#CCFF00" /></View>
                        <Text style={styles.bigCardTitle}>EXERCÍCIOS</Text>
                        <Text style={styles.bigCardDesc}>Gerencie a biblioteca.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.bigCard, {borderColor: '#BF5AF2'}]} onPress={() => navigation.navigate('AdminAddContent')}>
                        <View style={[styles.iconCircle, {backgroundColor: '#BF5AF2'}]}><MaterialCommunityIcons name="video-plus" size={32} color="#FFF" /></View>
                        <Text style={[styles.bigCardTitle, {color: '#BF5AF2'}]}>PA FLIX ADMIN</Text>
                        <Text style={styles.bigCardDesc}>Adicionar novos vídeos.</Text>
                    </TouchableOpacity>

                    <View style={styles.bigCard}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:15}}>
                            <Text style={styles.cardHeaderSmall}>RANKING DE XP</Text>
                            <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                        </View>
                        {alunos.sort((a,b) => (b.currentXP||0) - (a.currentXP||0)).slice(0, 3).map((a, i) => (
                            <View key={a.id} style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:8, borderBottomWidth:1, borderBottomColor:'#222', paddingBottom:5}}>
                                <Text style={{color:'#FFF', fontWeight:'bold'}}>{i+1}. {a.name}</Text>
                                <Text style={{color:'#CCFF00', fontWeight:'900'}}>{a.currentXP || 0} XP</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={[styles.bigCard, {borderColor: '#32ADE6'}]} onPress={() => setNoticeModalVisible(true)}>
                        <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                            <MaterialCommunityIcons name="bullhorn" size={24} color="#32ADE6" />
                            <Text style={[styles.bigCardTitle, {marginBottom:0, color:'#32ADE6'}]}>ENVIAR AVISO</Text>
                        </View>
                        <Text style={[styles.bigCardDesc, {marginTop:5}]}>Notifique a todos.</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        )}

      </View>

      {/* MODAL CHECKIN */}
      <Modal visible={checkinModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>CHECK-IN: {selectedCheckin?.user?.name}</Text>
                    <TouchableOpacity onPress={() => setCheckinModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color="#FFF"/></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{padding: 20}}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoBox}><Text style={styles.infoLabel}>DATA</Text><Text style={styles.infoValue}>{new Date(selectedCheckin?.date).toLocaleDateString()}</Text></View>
                        <View style={styles.infoBox}><Text style={styles.infoLabel}>PESO</Text><Text style={styles.infoValue}>{selectedCheckin?.weight} kg</Text></View>
                    </View>
                    {selectedCheckin?.feedback && (
                        <View style={styles.feedbackBox}>
                            <Text style={styles.infoLabel}>FEEDBACK</Text>
                            <Text style={styles.feedbackText}>"{selectedCheckin.feedback}"</Text>
                        </View>
                    )}
                    <Text style={[styles.infoLabel, {marginTop:20, marginBottom:10}]}>FOTOS</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {selectedCheckin?.photoFront && <View style={styles.photoContainer}><Image source={{uri: selectedCheckin.photoFront}} style={styles.photo} /><Text style={styles.photoLabel}>FRENTE</Text></View>}
                        {selectedCheckin?.photoSide && <View style={styles.photoContainer}><Image source={{uri: selectedCheckin.photoSide}} style={styles.photo} /><Text style={styles.photoLabel}>LADO</Text></View>}
                        {selectedCheckin?.photoBack && <View style={styles.photoContainer}><Image source={{uri: selectedCheckin.photoBack}} style={styles.photo} /><Text style={styles.photoLabel}>COSTAS</Text></View>}
                    </ScrollView>
                </ScrollView>
            </View>
        </View>
      </Modal>

      {/* MODAL AVISO */}
      <Modal visible={noticeModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>NOVO AVISO</Text>
                    <TouchableOpacity onPress={() => setNoticeModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color="#FFF"/></TouchableOpacity>
                </View>
                <View style={{padding: 20}}>
                    <Text style={styles.infoLabel}>TÍTULO</Text>
                    <TextInput style={styles.input} placeholder="Ex: Feriado" placeholderTextColor="#555" value={noticeTitle} onChangeText={setNoticeTitle} />
                    <Text style={[styles.infoLabel, {marginTop:15}]}>MENSAGEM</Text>
                    <TextInput style={[styles.input, {height:100, textAlignVertical:'top'}]} multiline placeholder="Digite..." placeholderTextColor="#555" value={noticeMessage} onChangeText={setNoticeMessage} />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSendNotice} disabled={sendingNotice}>
                        {sendingNotice ? <ActivityIndicator color="#000" /> : <Text style={styles.sendBtnText}>ENVIAR</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: Platform.OS === 'web' ? 20 : 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  title: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#666', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' },
  logoutBtn: { padding: 10, backgroundColor: '#1A1A1A', borderRadius: 8, cursor: 'pointer' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  tab: { marginRight: 20, paddingBottom: 10, flexDirection:'row', alignItems:'center', gap:5, cursor: 'pointer' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#CCFF00' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#FFF' },
  badgeCount: { backgroundColor:'#FF3B30', paddingHorizontal:6, borderRadius:10, height:16, justifyContent:'center', marginLeft:5 },
  badgeText: { color:'#FFF', fontSize:9, fontWeight:'bold' },
  // 🔥 CORREÇÃO: Margem para alinhar a busca com o header
  searchBar: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, marginHorizontal: 20, outlineStyle: 'none' },
  feedCard: { backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#222' },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  feedUser: { color: '#CCFF00', fontWeight: 'bold', fontSize: 14 },
  feedTime: { color: '#666', fontSize: 10, fontWeight:'bold' },
  feedAction: { color: '#AAA', fontSize: 13, marginTop: 2 },
  checkinFeedback: { color: '#666', fontSize: 12, fontStyle:'italic', marginTop: 4 },
  progBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFF00', alignSelf: 'flex-start', paddingHorizontal: 6, borderRadius: 4, marginTop: 6, gap: 4 },
  progText: { color: '#000', fontSize: 9, fontWeight: 'bold' },
  card: { backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#222', cursor: 'pointer' },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#CCFF00', fontWeight: 'bold', fontSize: 18 },
  alunoName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  alunoEmail: { color: '#666', fontSize: 12 },
  tagElite: { backgroundColor: '#CCFF00', paddingHorizontal: 5, borderRadius: 4 },
  tagText: { color: '#000', fontSize: 8, fontWeight: '900' },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
  gridGestao: { gap: 15 },
  bigCard: { backgroundColor: '#111', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#222', alignItems: 'center', cursor: 'pointer' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  bigCardTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 5 },
  bigCardDesc: { color: '#666', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  cardHeaderSmall: { color:'#888', fontWeight:'bold', fontSize:12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#111', borderRadius: 20, maxHeight: '80%', borderWidth:1, borderColor:'#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth:1, borderBottomColor:'#222' },
  modalTitle: { color: '#CCFF00', fontWeight: 'bold', fontSize: 16 },
  infoRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  infoBox: { flex: 1, backgroundColor: '#222', padding: 10, borderRadius: 8, alignItems: 'center' },
  infoLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  infoValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  feedbackBox: { backgroundColor: '#222', padding: 15, borderRadius: 8 },
  feedbackText: { color: '#EEE', fontStyle: 'italic', marginTop: 5 },
  photoContainer: { marginRight: 15, alignItems: 'center' },
  photo: { width: 120, height: 180, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  photoLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  input: { backgroundColor: '#000', color: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', fontSize: 14, outlineStyle: 'none' },
  sendBtn: { backgroundColor: '#32ADE6', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  sendBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14 }
});