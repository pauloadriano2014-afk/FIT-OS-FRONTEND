// src/screens/AdminUserOptions.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, 
  ActivityIndicator, StatusBar, Alert, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  
  const [viewMode, setViewMode] = useState('active'); 
  const [isActiveUser, setIsActiveUser] = useState(aluno.active); 

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchStudentData(); });
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
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{aluno.name.toUpperCase()}</Text>
                    <Text style={styles.headerSubtitle}>GERENCIAR ALUNO</Text>
                </View>
                <TouchableOpacity onPress={fetchStudentData} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name="refresh" size={24} color={theme.accent}/>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 150, flexGrow: 1}} showsVerticalScrollIndicator={false}>
                
                <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.accent }]} onPress={handleNewWorkout}>
                    <MaterialCommunityIcons name="plus-circle" size={28} color={theme.isDark ? '#000' : '#FFF'} />
                    <Text style={[styles.createBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>CRIAR NOVA ROTINA</Text>
                </TouchableOpacity>

                <View style={styles.tabsRow}>
                    <TouchableOpacity 
                        style={[styles.tabBtn, { borderBottomColor: theme.border }, viewMode === 'active' && { borderBottomColor: theme.accent }]} 
                        onPress={() => setViewMode('active')}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'active' && { color: theme.accent }]}>ATIVAS ({activeWorkouts.length})</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.tabBtn, { borderBottomColor: theme.border }, viewMode === 'archived' && { borderBottomColor: theme.accent }]} 
                        onPress={() => setViewMode('archived')}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'archived' && { color: theme.accent }]}>ARQUIVADAS ({archivedWorkouts.length})</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />
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
  header: { 
      flexDirection:'row', 
      justifyContent:'space-between', 
      paddingHorizontal:20, 
      paddingBottom: 20,
      paddingTop: Platform.OS === 'android' ? 10 : 20, 
      alignItems:'center', 
      borderBottomWidth:1 
  },
  headerTitle: { fontWeight:'900', fontSize:16 },
  headerSubtitle: { color: '#888', fontSize:10, fontWeight:'bold', letterSpacing:1 },
  createBtn: { padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 15 },
  createBtnText: { fontWeight: '900', fontSize: 14, letterSpacing:0.5 },
  tabsRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
  tabText: { fontWeight: 'bold', fontSize: 12 },
  divider: { height:1, marginVertical:20 },
  sectionLabel: { color:'#888', fontWeight:'900', marginBottom:15, fontSize:12, letterSpacing:1 },
  card: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  cardDates: { color: '#888', fontSize: 12, fontWeight:'bold' },
  editBtn: { padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyBox: { alignItems:'center', padding: 20, borderStyle:'dashed', borderWidth:1, borderRadius:10 },
  emptyText: { color: '#888', textAlign: 'center', fontStyle: 'italic', marginTop: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10, gap: 15, borderWidth:1 },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent:'center', alignItems:'center' },
  actionText: { fontWeight: 'bold', fontSize: 13, flex:1 },
  deleteUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent:'center', backgroundColor: '#FF3B30', padding: 15, borderRadius: 12, marginTop: 20, gap: 10 },
  deleteUserText: { color: '#FFF', fontWeight: '900', fontSize: 12 }
});