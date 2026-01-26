import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, 
  ActivityIndicator, StatusBar, Alert, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear().toString().slice(-2)}`;
};

export default function AdminUserOptions({ route, navigation }) {
  const { aluno } = route.params;
  const [loading, setLoading] = useState(true);
  
  // Listas separadas
  const [activeWorkouts, setActiveWorkouts] = useState([]);
  const [archivedWorkouts, setArchivedWorkouts] = useState([]);
  
  // Controle de Visualização (Abas)
  const [viewMode, setViewMode] = useState('active'); // 'active' ou 'archived'
  const [isActiveUser, setIsActiveUser] = useState(aluno.active); 

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchStudentData(); });
    return unsubscribe;
  }, [navigation]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
        const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${aluno.id}&t=${Date.now()}`);
        const data = await response.json();

        if (Array.isArray(data)) {
            const today = new Date();
            // Separa o joio do trigo
            const active = [];
            const archived = [];

            data.forEach(w => {
                const end = new Date(w.endDate);
                // Se a data final é menor que hoje (ontem ou antes), é arquivo.
                // Se é hoje ou futuro, é ativo.
                if (end < today) {
                    archived.push(w);
                } else {
                    active.push(w);
                }
            });

            // Ordena
            setActiveWorkouts(active.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setArchivedWorkouts(archived.sort((a,b) => new Date(b.endDate) - new Date(a.endDate)));
        }
        setIsActiveUser(aluno.active); 
    } catch (error) { console.log("Erro dados:", error); } 
    finally { setLoading(false); }
  };

  const handleToggleStatus = async () => {
      const newStatus = !isActiveUser;
      const actionText = newStatus ? "ATIVAR" : "INATIVAR";
      Alert.alert(actionText, `Deseja ${actionText.toLowerCase()} o acesso deste aluno?`, [
          { text: "Cancelar" },
          { text: "Confirmar", onPress: async () => {
              try {
                  await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                      method: 'PATCH',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ active: newStatus })
                  });
                  setIsActiveUser(newStatus);
                  Alert.alert("Sucesso", `Aluno ${newStatus ? 'ativado' : 'inativado'}!`);
              } catch (e) { Alert.alert("Erro", "Falha ao atualizar status."); }
          }}
      ]);
  };

  const handleDeleteUser = async () => {
      Alert.alert("EXCLUIR ALUNO", "ATENÇÃO: Isso apagará TODOS os treinos, histórico e check-ins deste aluno permanentemente.\n\nTem certeza?", [
          { text: "Cancelar" },
          { text: "EXCLUIR TUDO", style: 'destructive', onPress: async () => {
              try {
                  const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'DELETE' });
                  if (res.ok) {
                      Alert.alert("Excluído", "Aluno removido.");
                      navigation.goBack();
                  } else { Alert.alert("Erro", "Não foi possível excluir."); }
              } catch (e) { Alert.alert("Erro", "Falha na conexão."); }
          }}
      ]);
  };

  const handleDeleteWorkout = (workoutId) => {
      Alert.alert("Excluir Rotina", "Tem certeza?", [
          { text: "Cancelar" },
          { text: "Sim, Excluir", style:'destructive', onPress: async () => {
              try {
                  await fetch(`https://fitos-final.onrender.com/api/workout/${workoutId}`, { method: 'DELETE' });
                  fetchStudentData();
              } catch(e) { Alert.alert("Erro ao excluir"); }
          }}
      ]);
  };

  const handleEditWorkout = (workout) => {
      navigation.navigate('MontarTreinoAdmin', { aluno, workoutToEdit: workout, isEditing: true });
  };

  const handleNewWorkout = () => {
      navigation.navigate('MontarTreinoAdmin', { aluno, isEditing: false });
  };

  const listToShow = viewMode === 'active' ? activeWorkouts : archivedWorkouts;

  return (
    <View style={styles.mainWrapper}>
        <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF"/>
            </TouchableOpacity>
            <View>
                <Text style={styles.headerTitle}>{aluno.name.toUpperCase()}</Text>
                <Text style={styles.headerSubtitle}>GERENCIAR ROTINAS</Text>
            </View>
            <TouchableOpacity onPress={fetchStudentData}>
                <MaterialCommunityIcons name="refresh" size={24} color="#CCFF00"/>
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 150, flexGrow: 1}} showsVerticalScrollIndicator={false}>
            
            {/* BOTÃO PRINCIPAL */}
            <TouchableOpacity style={styles.createBtn} onPress={handleNewWorkout}>
                <MaterialCommunityIcons name="plus-circle" size={28} color="#000" />
                <Text style={styles.createBtnText}>CRIAR NOVA ROTINA</Text>
            </TouchableOpacity>

            {/* ABAS ESTILO MFIT (ATIVAS | ARQUIVADAS) */}
            <View style={styles.tabsRow}>
                <TouchableOpacity 
                    style={[styles.tabBtn, viewMode === 'active' && styles.tabBtnActive]} 
                    onPress={() => setViewMode('active')}
                >
                    <Text style={[styles.tabText, viewMode === 'active' && styles.tabTextActive]}>ATIVAS ({activeWorkouts.length})</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tabBtn, viewMode === 'archived' && styles.tabBtnActive]} 
                    onPress={() => setViewMode('archived')}
                >
                    <Text style={[styles.tabText, viewMode === 'archived' && styles.tabTextActive]}>ARQUIVADAS ({archivedWorkouts.length})</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>
                {viewMode === 'active' ? 'ROTINAS VIGENTES' : 'HISTÓRICO DE TREINOS'}
            </Text>

            {loading ? <ActivityIndicator color="#CCFF00" style={{marginTop:20}} /> : (
                <>
                    {listToShow.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name={viewMode === 'active' ? "dumbbell" : "archive-off-outline"} size={40} color="#333" />
                            <Text style={styles.emptyText}>
                                {viewMode === 'active' ? "Nenhuma rotina ativa." : "Nenhum histórico arquivado."}
                            </Text>
                        </View>
                    ) : (
                        listToShow.map((w) => {
                            const isArchived = viewMode === 'archived';
                            return (
                                <View key={w.id} style={[styles.card, {borderColor: isArchived ? '#444' : '#CCFF00', opacity: isArchived ? 0.8 : 1}]}>
                                    <View style={styles.cardHeader}>
                                        <View style={{flexDirection:'row', gap:8, alignItems:'center'}}>
                                            <MaterialCommunityIcons name={isArchived ? "archive-clock" : "lightning-bolt"} size={16} color={isArchived ? '#888' : '#CCFF00'} />
                                            <Text style={[styles.statusText, {color: isArchived ? '#888' : '#CCFF00'}]}>
                                                {isArchived ? 'FINALIZADO' : 'EM ANDAMENTO'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteWorkout(w.id)} style={{padding:5}}>
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color={isArchived ? '#666' : '#FF3B30'} />
                                        </TouchableOpacity>
                                    </View>
                                    
                                    <Text style={[styles.cardTitle, isArchived && {color:'#AAA'}]}>{w.name}</Text>
                                    <View style={styles.dateRow}>
                                        <Text style={styles.cardDates}>Vigência: {formatDate(w.startDate)} até {formatDate(w.endDate)}</Text>
                                    </View>

                                    <TouchableOpacity style={[styles.editBtn, {backgroundColor: '#222'}]} onPress={() => handleEditWorkout(w)}>
                                        <Text style={{color:'#FFF', fontWeight:'bold', fontSize:12}}>ABRIR / VER</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </>
            )}

            {/* OPÇÕES ADICIONAIS */}
            <Text style={[styles.sectionLabel, {marginTop: 40}]}>DADOS E SISTEMA</Text>
            
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('AdminEvolution', { aluno })}>
                <View style={[styles.iconBox, {backgroundColor:'#112233'}]}>
                    <MaterialCommunityIcons name="chart-line" size={20} color="#32ADE6" />
                </View>
                <Text style={styles.actionText}>Ver Gráficos de Evolução</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleToggleStatus}>
                <View style={[styles.iconBox, {backgroundColor: isActiveUser ? 'rgba(204,255,0,0.1)' : 'rgba(255,59,48,0.1)'}]}>
                    <MaterialCommunityIcons name={isActiveUser ? "lock-open" : "lock"} size={20} color={isActiveUser ? "#CCFF00" : "#FF3B30"} />
                </View>
                <Text style={[styles.actionText, {color: isActiveUser ? '#FFF' : '#FF3B30'}]}>
                    {isActiveUser ? "Aluno Ativo (Toque para Bloquear)" : "Aluno Bloqueado (Toque para Ativar)"}
                </Text>
            </TouchableOpacity>

            {/* BOTÃO EXCLUIR */}
            <TouchableOpacity style={styles.deleteUserRow} onPress={handleDeleteUser}>
                <MaterialCommunityIcons name="account-remove" size={20} color="#FFF" />
                <Text style={styles.deleteUserText}>EXCLUIR ALUNO PERMANENTEMENTE</Text>
            </TouchableOpacity>

        </ScrollView>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#000', height: Platform.OS === 'web' ? '100vh' : '100%', overflow: 'hidden' },
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection:'row', justifyContent:'space-between', padding:20, paddingTop: Platform.OS === 'web' ? 20 : 60, alignItems:'center', borderBottomWidth:1, borderBottomColor:'#1A1A1A' },
  headerTitle: { color: '#FFF', fontWeight:'900', fontSize:16 },
  headerSubtitle: { color: '#666', fontSize:10, fontWeight:'bold', letterSpacing:1 },
  
  createBtn: { backgroundColor: '#CCFF00', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 15 },
  createBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing:0.5 },
  
  // ESTILO DAS ABAS (Active vs Archived)
  tabsRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#222' },
  tabBtnActive: { borderBottomColor: '#CCFF00' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#CCFF00' },

  divider: { height:1, backgroundColor:'#1A1A1A', marginVertical:20 },
  sectionLabel: { color:'#666', fontWeight:'900', marginBottom:15, fontSize:12, letterSpacing:1 },
  
  card: { backgroundColor: '#111', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  cardDates: { color: '#888', fontSize: 12, fontWeight:'bold' },
  editBtn: { padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  emptyBox: { alignItems:'center', padding: 20, borderStyle:'dashed', borderWidth:1, borderColor:'#333', borderRadius:10 },
  emptyText: { color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: 10 },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: 12, marginBottom: 10, gap: 15, borderWidth:1, borderColor:'#222' },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent:'center', alignItems:'center' },
  actionText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, flex:1 },

  deleteUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent:'center', backgroundColor: '#FF3B30', padding: 15, borderRadius: 12, marginTop: 20, gap: 10 },
  deleteUserText: { color: '#FFF', fontWeight: '900', fontSize: 12 }
});