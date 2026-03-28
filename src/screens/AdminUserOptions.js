// src/screens/AdminUserOptions.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, 
  ActivityIndicator, StatusBar, Alert, Platform, Image, Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear().toString().slice(-2)}`;
};

export default function AdminUserOptions({ route, navigation }) {
  const { aluno } = route.params;
  const { theme } = useTheme(); 

  const [loading, setLoading] = useState(true);
  
  const [activeWorkouts, setActiveWorkouts] = useState([]);
  const [archivedWorkouts, setArchivedWorkouts] = useState([]);
  
  const [viewMode, setViewMode] = useState('active'); // 'active', 'archived', 'paflix'
  const [isActiveUser, setIsActiveUser] = useState(aluno.active); 

  // 🔥 STATES DA FOTO DO PERFIL
  const [photoUrl, setPhotoUrl] = useState(aluno.photoUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // 🔥 STATES DE ACESSO AO PA FLIX
  const [vipContents, setVipContents] = useState([]);
  const [userAccess, setUserAccess] = useState([]);
  const [loadingPaflix, setLoadingPaflix] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { 
        fetchStudentData(); 
        fetchPaflixData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
        const responseWorkouts = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${aluno.id}&t=${Date.now()}`);
        const dataWorkouts = await responseWorkouts.json();

        if (Array.isArray(dataWorkouts)) {
            const today = new Date();
            const active = [];
            const archived = [];

            dataWorkouts.forEach(w => {
                const end = new Date(w.endDate);
                if (end < today) {
                    archived.push(w);
                } else {
                    active.push(w);
                }
            });

            setActiveWorkouts(active.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setArchivedWorkouts(archived.sort((a,b) => new Date(b.endDate) - new Date(a.endDate)));
        }

        setIsActiveUser(aluno.active); 

    } catch (error) { 
        console.log("Erro geral:", error); 
    } finally { 
        setLoading(false); 
    }
  };

  // 🔥 BUSCA OS CONTEÚDOS VIP E OS ACESSOS DO ALUNO
  const fetchPaflixData = async () => {
      setLoadingPaflix(true);
      try {
          const [resContents, resAccess] = await Promise.all([
              fetch('https://fitos-final.onrender.com/api/contents'),
              fetch(`https://fitos-final.onrender.com/api/admin/access?userId=${aluno.id}`)
          ]);
          
          if (resContents.ok) {
              const contents = await resContents.json();
              if (Array.isArray(contents)) {
                  setVipContents(contents.filter(c => c.isVIP));
              }
          }

          if (resAccess.ok) {
              const accessData = await resAccess.json();
              // accessData deve ser uma array de IDs de conteúdos liberados para este aluno
              if (Array.isArray(accessData)) {
                  setUserAccess(accessData);
              }
          }
      } catch (e) {
          console.log("Erro ao buscar PAFLIX", e);
      } finally {
          setLoadingPaflix(false);
      }
  };

  // 🔥 FUNÇÃO DE UPLOAD DA FOTO DA GALERIA
  const handlePickImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1], // Corta quadrado perfeito
          quality: 0.3, // Comprime a imagem para não pesar no banco
          base64: true // 🔥 Transforma em texto para salvar direto no Prisma
      });

      if (!result.canceled && result.assets[0].base64) {
          const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
          setUploadingPhoto(true);
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                  method: 'PATCH',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ photoUrl: base64Img })
              });
              if (res.ok) {
                  setPhotoUrl(base64Img);
                  Alert.alert("Sucesso", "Foto de perfil atualizada!");
              } else {
                  Alert.alert("Erro", "Falha ao salvar a foto no servidor.");
              }
          } catch(e) {
              Alert.alert("Erro", "Falha de conexão ao enviar a foto.");
          } finally {
              setUploadingPhoto(false);
          }
      }
  };

  // 🔥 LIGA/DESLIGA ACESSO VIP DO ALUNO
  const handleToggleAccess = async (contentId, currentStatus) => {
      const newStatus = !currentStatus;
      
      // Atualiza a tela instantaneamente (Optimistic Update)
      if (newStatus) setUserAccess(prev => [...prev, contentId]);
      else setUserAccess(prev => prev.filter(id => id !== contentId));

      try {
          const res = await fetch('https://fitos-final.onrender.com/api/admin/access', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ userId: aluno.id, contentId, grant: newStatus })
          });
          
          if (!res.ok) throw new Error("Falha na API");
      } catch(e) {
          // Desfaz a animação se a internet falhar
          if (!newStatus) setUserAccess(prev => [...prev, contentId]);
          else setUserAccess(prev => prev.filter(id => id !== contentId));
          Alert.alert("Erro", "Falha ao atualizar a permissão do aluno.");
      }
  };

  const handleToggleStatus = async () => {
      const newStatus = !isActiveUser;
      const actionText = newStatus ? "ATIVAR" : "INATIVAR";
      
      const confirmAction = async () => {
          try {
              await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                  method: 'PATCH',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ active: newStatus })
              });
              setIsActiveUser(newStatus);
              if (Platform.OS === 'web') window.alert(`Sucesso\n\nAluno ${newStatus ? 'ativado' : 'inativado'}!`);
              else Alert.alert("Sucesso", `Aluno ${newStatus ? 'ativado' : 'inativado'}!`);
          } catch (e) { 
              if (Platform.OS === 'web') window.alert("Erro\n\nFalha ao atualizar status.");
              else Alert.alert("Erro", "Falha ao atualizar status."); 
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm(`Deseja ${actionText.toLowerCase()} o acesso deste aluno?`)) confirmAction();
      } else {
          Alert.alert(actionText, `Deseja ${actionText.toLowerCase()} o acesso deste aluno?`, [
              { text: "Cancelar", style: "cancel" },
              { text: "Confirmar", onPress: confirmAction }
          ]);
      }
  };

  const handleDeleteUser = async () => {
      const confirmDelete = async () => {
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'DELETE' });
              if (res.ok) {
                  if (Platform.OS === 'web') window.alert("Excluído\n\nAluno removido permanentemente.");
                  else Alert.alert("Excluído", "Aluno removido.");
                  navigation.goBack();
              } else { 
                  if (Platform.OS === 'web') window.alert("Erro\n\nNão foi possível excluir.");
                  else Alert.alert("Erro", "Não foi possível excluir."); 
              }
          } catch (e) { 
              if (Platform.OS === 'web') window.alert("Erro\n\nFalha na conexão.");
              else Alert.alert("Erro", "Falha na conexão."); 
          }
      };

      const msg = "ATENÇÃO: Isso apagará TODOS os treinos, histórico e check-ins deste aluno permanentemente.\n\nTem certeza?";
      if (Platform.OS === 'web') {
          if (window.confirm(msg)) confirmDelete();
      } else {
          Alert.alert("EXCLUIR ALUNO", msg, [
              { text: "Cancelar", style: "cancel" },
              { text: "EXCLUIR TUDO", style: 'destructive', onPress: confirmDelete }
          ]);
      }
  };

  const handleDeleteWorkout = (workoutId) => {
      const deleteAction = async () => {
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/workout/${workoutId}`, { 
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' }
              });
              
              if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(`[Status ${res.status}] ${errText}`);
              }
              
              fetchStudentData(); 
          } catch(e) { 
              console.error(e);
              if (Platform.OS === 'web') window.alert(`Erro ao excluir\n\n${e.message}`);
              else Alert.alert("Erro ao excluir", e.message); 
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm("Deseja realmente apagar esta rotina?")) deleteAction();
      } else {
          Alert.alert("Excluir Rotina", "Tem certeza?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Sim, Excluir", style:'destructive', onPress: deleteAction }
          ]);
      }
  };

  const handleEditWorkout = (workout) => {
      navigation.navigate('MontarTreinoAdmin', { aluno, workoutToEdit: workout, isEditing: true });
  };

  const handleNewWorkout = () => {
      navigation.navigate('MontarTreinoAdmin', { aluno, isEditing: false });
  };

  const listToShow = viewMode === 'active' ? activeWorkouts : archivedWorkouts;

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg };

  return (
    <RootComponent style={rootStyle}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
            
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>GERENCIAR ALUNO</Text>
                </View>
                <TouchableOpacity onPress={fetchStudentData} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name="refresh" size={24} color={theme.accent}/>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 150, flexGrow: 1}} showsVerticalScrollIndicator={false}>
                
                {/* 🔥 NOVO: PERFIL VIP COM FOTO CLICÁVEL */}
                <View style={[styles.profileHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer} activeOpacity={0.8}>
                        {uploadingPhoto ? (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <ActivityIndicator color={theme.accent} />
                            </View>
                        ) : photoUrl ? (
                            <Image source={{uri: photoUrl}} style={[styles.avatarImage, { borderColor: theme.border }]} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <Text style={[styles.avatarText, { color: theme.accent }]}>{aluno.name.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        <View style={[styles.editBadge, { backgroundColor: theme.accent }]}>
                            <MaterialCommunityIcons name="camera-plus" size={14} color="#000" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: theme.text }]}>{aluno.name}</Text>
                        <Text style={styles.profileEmail}>{aluno.email}</Text>
                    </View>
                </View>

                {/* 🔥 ABAS REFORMULADAS (COM PA FLIX) */}
                <View style={styles.tabsRow}>
                    <TouchableOpacity 
                        style={[styles.tabBtn, { borderBottomColor: theme.border }, viewMode === 'active' && { borderBottomColor: theme.accent }]} 
                        onPress={() => setViewMode('active')}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'active' && { color: theme.accent }]}>ATIVAS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.tabBtn, { borderBottomColor: theme.border }, viewMode === 'archived' && { borderBottomColor: theme.accent }]} 
                        onPress={() => setViewMode('archived')}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'archived' && { color: theme.accent }]}>ARQUIVADAS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.tabBtn, { borderBottomColor: theme.border }, viewMode === 'paflix' && { borderBottomColor: theme.accent }]} 
                        onPress={() => setViewMode('paflix')}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'paflix' && { color: theme.accent }]}>PA FLIX VIP</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                
                {/* 🔥 ABA DE TREINOS (Ativos e Arquivados) */}
                {(viewMode === 'active' || viewMode === 'archived') && (
                    <>
                        {viewMode === 'active' && (
                            <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.accent }]} onPress={handleNewWorkout}>
                                <MaterialCommunityIcons name="plus-circle" size={28} color={theme.isDark ? '#000' : '#FFF'} />
                                <Text style={[styles.createBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>CRIAR NOVA ROTINA</Text>
                            </TouchableOpacity>
                        )}
                        
                        <Text style={styles.sectionLabel}>
                            {viewMode === 'active' ? 'ROTINAS VIGENTES' : 'HISTÓRICO DE TREINOS'}
                        </Text>

                        {loading ? <ActivityIndicator color={theme.accent} style={{marginTop:20}} /> : (
                            <>
                                {listToShow.length === 0 ? (
                                    <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                        <MaterialCommunityIcons name={viewMode === 'active' ? "dumbbell" : "archive-off-outline"} size={40} color={theme.textSecondary} />
                                        <Text style={styles.emptyText}>
                                            {viewMode === 'active' ? "Nenhuma rotina ativa." : "Nenhum histórico arquivado."}
                                        </Text>
                                    </View>
                                ) : (
                                    listToShow.map((w) => {
                                        const isArchived = viewMode === 'archived';
                                        return (
                                            <View key={w.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: isArchived ? theme.border : theme.accent, opacity: isArchived ? 0.8 : 1}]}>
                                                <View style={styles.cardHeader}>
                                                    <View style={{flexDirection:'row', gap:8, alignItems:'center'}}>
                                                        <MaterialCommunityIcons name={isArchived ? "archive-clock" : "lightning-bolt"} size={16} color={isArchived ? theme.textSecondary : theme.accent} />
                                                        <Text style={[styles.statusText, {color: isArchived ? theme.textSecondary : theme.accent}]}>
                                                            {isArchived ? 'FINALIZADO' : 'EM ANDAMENTO'}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => handleDeleteWorkout(w.id)} style={{padding:5}}>
                                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={isArchived ? theme.textSecondary : '#FF3B30'} />
                                                    </TouchableOpacity>
                                                </View>
                                                
                                                <Text style={[styles.cardTitle, { color: theme.text }, isArchived && {color: theme.textSecondary}]}>{w.name}</Text>
                                                <View style={styles.dateRow}>
                                                    <Text style={styles.cardDates}>Vigência: {formatDate(w.startDate)} até {formatDate(w.endDate)}</Text>
                                                </View>

                                                <TouchableOpacity style={[styles.editBtn, {backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1}]} onPress={() => handleEditWorkout(w)}>
                                                    <Text style={{color: theme.text, fontWeight:'bold', fontSize:12}}>ABRIR / VER</Text>
                                                    <MaterialCommunityIcons name="chevron-right" size={16} color={theme.text} />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </>
                )}

                {/* 🔥 NOVA ABA: PA FLIX VIP */}
                {viewMode === 'paflix' && (
                    <View>
                        <Text style={styles.sectionLabel}>PERMISSÕES DE CONTEÚDO VIP</Text>
                        <Text style={styles.sectionSubDesc}>Ligue a chave para dar acesso manual a este aluno.</Text>

                        {loadingPaflix ? <ActivityIndicator color={theme.accent} style={{marginTop:20}} /> : (
                            vipContents.length === 0 ? (
                                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="lock-outline" size={40} color={theme.textSecondary} />
                                    <Text style={styles.emptyText}>Nenhum conteúdo VIP cadastrado no sistema ainda.</Text>
                                </View>
                            ) : (
                                vipContents.map(content => {
                                    const hasAccess = userAccess.includes(content.id);
                                    const iconName = content.type === 'ebook' ? 'book-open-variant' : (content.type === 'audio' ? 'headphones' : 'video');
                                    
                                    return (
                                        <View key={content.id} style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={[styles.accessIconBox, { backgroundColor: theme.bg }]}>
                                                <MaterialCommunityIcons name={iconName} size={24} color={hasAccess ? theme.accent : theme.textSecondary} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 15, paddingRight: 10 }}>
                                                <Text style={[styles.accessTitle, { color: theme.text }]}>{content.title}</Text>
                                                <Text style={styles.accessCategory}>{content.category}</Text>
                                            </View>
                                            <Switch 
                                                value={hasAccess}
                                                onValueChange={() => handleToggleAccess(content.id, hasAccess)}
                                                trackColor={{ false: '#333', true: theme.accent }}
                                                thumbColor={Platform.OS === 'ios' ? '#FFF' : (hasAccess ? '#000' : '#888')}
                                            />
                                        </View>
                                    )
                                })
                            )
                        )}
                    </View>
                )}

                {/* DADOS E SISTEMA - SEMPRE VISÍVEL NO FINAL */}
                <Text style={[styles.sectionLabel, {marginTop: 40}]}>DADOS E SISTEMA</Text>
                
                <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminEvolution', { aluno })}>
                    <View style={[styles.iconBox, {backgroundColor: 'rgba(50, 173, 230, 0.15)'}]}>
                        <MaterialCommunityIcons name="chart-line" size={20} color="#32ADE6" />
                    </View>
                    <Text style={[styles.actionText, { color: theme.text }]}>Ver Gráficos de Evolução</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleToggleStatus}>
                    <View style={[styles.iconBox, {backgroundColor: isActiveUser ? theme.accent + '22' : 'rgba(255,59,48,0.15)'}]}>
                        <MaterialCommunityIcons name={isActiveUser ? "lock-open" : "lock"} size={20} color={isActiveUser ? theme.accent : "#FF3B30"} />
                    </View>
                    <Text style={[styles.actionText, {color: isActiveUser ? theme.text : '#FF3B30'}]}>
                        {isActiveUser ? "Aluno Ativo (Toque para Bloquear)" : "Aluno Bloqueado (Toque para Ativar)"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteUserRow} onPress={handleDeleteUser}>
                    <MaterialCommunityIcons name="account-remove" size={20} color="#FFF" />
                    <Text style={styles.deleteUserText}>EXCLUIR ALUNO PERMANENTEMENTE</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems:'center', borderBottomWidth:1 },
  headerTitle: { fontWeight:'900', fontSize:16 },
  headerSubtitle: { color: '#888', fontSize:10, fontWeight:'bold', letterSpacing:1 },
  
  // 🔥 ESTILOS DA FOTO E PERFIL
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  avatarImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 1 },
  avatarText: { fontWeight: '900', fontSize: 28 },
  editBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '900' },
  profileEmail: { color: '#888', fontSize: 12, marginTop: 2 },

  createBtn: { padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 15 },
  createBtnText: { fontWeight: '900', fontSize: 14, letterSpacing:0.5 },
  tabsRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
  tabText: { fontWeight: 'bold', fontSize: 11 },
  divider: { height:1, marginVertical:20 },
  sectionLabel: { color:'#888', fontWeight:'900', marginBottom:5, fontSize:12, letterSpacing:1 },
  sectionSubDesc: { color: '#888', fontSize: 11, marginBottom: 15 },
  
  card: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  cardDates: { color: '#888', fontSize: 12, fontWeight:'bold' },
  editBtn: { padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyBox: { alignItems:'center', padding: 30, borderStyle:'dashed', borderWidth:1, borderRadius:10, marginVertical: 10 },
  emptyText: { color: '#888', textAlign: 'center', fontStyle: 'italic', marginTop: 10 },
  
  // 🔥 ESTILOS DOS CARDS DO PAFLIX
  accessCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  accessIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  accessTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  accessCategory: { fontSize: 10, color: '#888', fontWeight: 'bold' },

  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10, gap: 15, borderWidth:1 },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent:'center', alignItems:'center' },
  actionText: { fontWeight: 'bold', fontSize: 13, flex:1 },
  deleteUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent:'center', backgroundColor: '#FF3B30', padding: 15, borderRadius: 12, marginTop: 20, gap: 10 },
  deleteUserText: { color: '#FFF', fontWeight: '900', fontSize: 12 }
});