import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, 
  ActivityIndicator, Modal, StatusBar, FlatList, Dimensions, Alert, Platform
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
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [archivedWorkouts, setArchivedWorkouts] = useState([]);
  const [isActiveUser, setIsActiveUser] = useState(aluno.active); 
  
  // Lógica Unificada do Modal
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStudentData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
        const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${aluno.id}&t=${Date.now()}`);
        const data = await response.json();

        if (Array.isArray(data)) {
            const active = data.find(w => w.isActive === true); 
            const history = data.filter(w => w.id !== active?.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            setActiveWorkout(active);
            setArchivedWorkouts(history);
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
                  const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                      method: 'DELETE'
                  });
                  if (res.ok) {
                      Alert.alert("Excluído", "Aluno removido do sistema.");
                      navigation.goBack();
                  } else {
                      Alert.alert("Erro", "Não foi possível excluir.");
                  }
              } catch (e) { Alert.alert("Erro", "Falha na conexão."); }
          }}
      ]);
  };

  return (
    // 🔥 WRAPPER WEB 100VH + SCROLL ESCONDIDO
    <View style={styles.mainWrapper}>
        <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF"/>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>PAINEL DO ALUNO</Text>
            <TouchableOpacity onPress={fetchStudentData}>
                <MaterialCommunityIcons name="refresh" size={24} color="#CCFF00"/>
            </TouchableOpacity>
        </View>

        <ScrollView 
            contentContainerStyle={{padding: 20, paddingBottom: 150, flexGrow: 1}} // FlexGrow garante scroll
            showsVerticalScrollIndicator={false} // 🔥 ADEUS BARRA CINZA
        >
            
            {/* PERFIL */}
            <View style={[styles.profileCard, !isActiveUser && {opacity: 0.5}]}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{aluno.name ? aluno.name.charAt(0).toUpperCase() : 'A'}</Text>
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.name}>{aluno.name} {!isActiveUser && "(INATIVO)"}</Text>
                    <Text style={styles.email}>{aluno.email}</Text>
                    <View style={styles.tagRow}>
                        <View style={[styles.tag, isActiveUser ? {borderColor:'#CCFF00'} : {borderColor:'#FF3B30'}]}>
                            <Text style={[styles.tagText, isActiveUser ? {color:'#CCFF00'} : {color:'#FF3B30'}]}>
                                {isActiveUser ? "ACESSO LIBERADO" : "BLOQUEADO"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            {/* 1. CICLO ATUAL */}
            <Text style={styles.sectionLabel}>CICLO VIGENTE</Text>
            {loading ? (
                <ActivityIndicator color="#CCFF00" style={{marginVertical: 20}} />
            ) : activeWorkout ? (
                <View style={styles.activeCard}>
                    <View style={styles.activeHeader}>
                        <MaterialCommunityIcons name="lightning-bolt" size={20} color="#000" />
                        <Text style={styles.activeStatus}>EM ANDAMENTO</Text>
                    </View>
                    <Text style={styles.activeTitle}>{activeWorkout.name}</Text>
                    <Text style={styles.activeDates}>
                        {formatDate(activeWorkout.startDate)} até {formatDate(activeWorkout.endDate)}
                    </Text>
                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('MontarTreinoAdmin', { aluno })}>
                        <Text style={styles.editBtnText}>EDITAR / NOVO CICLO</Text>
                        <MaterialCommunityIcons name="pencil" size={16} color="#000" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Sem treino ativo.</Text>
                    <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('MontarTreinoAdmin', { aluno })}>
                        <Text style={styles.createBtnText}>CRIAR NOVO TREINO</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 2. PASTA DE HISTÓRICO */}
            <Text style={[styles.sectionLabel, {marginTop: 30}]}>ARQUIVO</Text>
            <TouchableOpacity 
                style={styles.folderCard} 
                onPress={() => { setSelectedHistory(null); setFolderModalVisible(true); }}
            >
                <View style={styles.folderIconBox}>
                    <MaterialCommunityIcons name="folder-multiple" size={28} color="#CCFF00" />
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.folderTitle}>PASTA DE HISTÓRICO</Text>
                    <Text style={styles.folderSubtitle}>{archivedWorkouts.length} arquivos salvos</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>

            {/* 3. AVALIAÇÃO */}
            <Text style={[styles.sectionLabel, {marginTop: 30}]}>AVALIAÇÃO</Text>
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('AdminEvolution', { aluno })}>
                <View style={[styles.historyIcon, {backgroundColor:'#112233'}]}>
                    <MaterialCommunityIcons name="chart-line" size={20} color="#32ADE6" />
                </View>
                <Text style={styles.actionText}>Ver Gráficos de Evolução</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#333" />
            </TouchableOpacity>

            {/* 4. ZONA DE PERIGO */}
            <Text style={[styles.sectionLabel, {marginTop: 40, color:'#FF3B30'}]}>GERENCIAR ACESSO</Text>
            <View style={styles.dangerZone}>
                <TouchableOpacity style={styles.dangerBtnOutline} onPress={handleToggleStatus}>
                    <MaterialCommunityIcons name={isActiveUser ? "lock" : "lock-open"} size={20} color="#FFF" />
                    <Text style={styles.dangerBtnText}>{isActiveUser ? "BLOQUEAR ACESSO" : "DESBLOQUEAR ALUNO"}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.dangerBtnSolid} onPress={handleDeleteUser}>
                    <MaterialCommunityIcons name="trash-can" size={20} color="#FFF" />
                    <Text style={styles.dangerBtnText}>EXCLUIR ALUNO</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>

        {/* --- MODAL DE HISTÓRICO --- */}
        <Modal visible={folderModalVisible} animationType="slide">
            <SafeAreaView style={styles.modalContainerFull}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => {
                        if (selectedHistory) setSelectedHistory(null); 
                        else setFolderModalVisible(false); 
                    }}>
                        <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                            <Text style={{color:'#FFF', fontWeight:'bold'}}>{selectedHistory ? "VOLTAR" : "FECHAR"}</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{selectedHistory ? "DETALHES" : "HISTÓRICO"}</Text>
                    <View style={{width: 60}} />
                </View>

                {selectedHistory ? (
                    <ScrollView contentContainerStyle={{padding: 20}}>
                        <View style={styles.detailHeader}>
                            <Text style={styles.detailName}>{selectedHistory.name}</Text>
                            <Text style={styles.detailDate}>Realizado de {formatDate(selectedHistory.startDate)} até {formatDate(selectedHistory.endDate)}</Text>
                        </View>
                        
                        {selectedHistory.exercises && selectedHistory.exercises.map((ex, index) => (
                            <View key={index} style={styles.exRow}>
                                <View style={styles.exIndexBadge}><Text style={styles.exIndex}>{index + 1}</Text></View>
                                <View style={{flex:1}}>
                                    <Text style={styles.exName}>{ex.exercise?.name || ex.title || "Exercício"}</Text>
                                    <View style={{flexDirection:'row', alignItems:'center', gap:10, marginTop:4}}>
                                        <View style={styles.pill}><Text style={styles.pillText}>{ex.sets} x {ex.reps}</Text></View>
                                        {ex.technique && <View style={[styles.pill, {backgroundColor:'#333', borderColor:'#CCFF00'}]}><Text style={[styles.pillText, {color:'#CCFF00'}]}>{ex.technique}</Text></View>}
                                        <Text style={styles.dayLabel}>DIA {ex.day}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <FlatList 
                        data={archivedWorkouts}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{padding: 20}}
                        showsVerticalScrollIndicator={false} // 🔥 ESCONDE A BARRA NO MODAL TBM
                        ListEmptyComponent={<Text style={{color:'#666', textAlign:'center', marginTop:50}}>Pasta vazia.</Text>}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.historyItem} onPress={() => setSelectedHistory(item)}>
                                <View style={{flexDirection:'row', alignItems:'center', gap: 15}}>
                                    <View style={styles.historyIcon}>
                                        <MaterialCommunityIcons name="file-document-outline" size={24} color="#888" />
                                    </View>
                                    <View>
                                        <Text style={styles.historyName}>{item.name}</Text>
                                        <Text style={styles.historyDate}>Encerrado em: {formatDate(item.updatedAt || item.endDate)}</Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons name="eye" size={20} color="#CCFF00" />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        </Modal>

        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 🔥 WRAPPER WEB 100VH
  mainWrapper: {
      flex: 1,
      backgroundColor: '#000',
      height: Platform.OS === 'web' ? '100vh' : '100%',
      overflow: 'hidden' 
  },
  
  container: { flex: 1, backgroundColor: '#000' },
  // Ajuste Header
  header: { flexDirection:'row', justifyContent:'space-between', padding:20, paddingTop: Platform.OS === 'web' ? 20 : 60, alignItems:'center', borderBottomWidth:1, borderBottomColor:'#1A1A1A' },
  headerTitle: { color: '#FFF', fontWeight:'900', fontSize:14, letterSpacing:1 },
  
  profileCard: { flexDirection:'row', alignItems:'center', marginBottom:20, gap:15 },
  avatar: { width:60, height:60, borderRadius:30, backgroundColor:'#111', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#333' },
  avatarText: { color:'#CCFF00', fontSize:24, fontWeight:'900' },
  name: { color:'#FFF', fontSize:18, fontWeight:'bold' },
  email: { color:'#666', fontSize:12 },
  tagRow: { flexDirection:'row', gap:8, marginTop:5 },
  tag: { backgroundColor:'#1A1A1A', paddingHorizontal:8, paddingVertical:2, borderRadius:4, borderWidth:1 },
  tagText: { fontSize:10, fontWeight:'bold' },

  divider: { height:1, backgroundColor:'#1A1A1A', marginBottom:25 },
  sectionLabel: { color:'#CCFF00', fontWeight:'900', marginBottom:15, fontSize:12, letterSpacing:1 },

  activeCard: { backgroundColor: '#CCFF00', borderRadius: 15, padding: 20 },
  activeHeader: { flexDirection:'row', alignItems:'center', gap:5, marginBottom:5 },
  activeStatus: { color:'#000', fontWeight:'900', fontSize:10 },
  activeTitle: { color:'#000', fontSize:20, fontWeight:'900', marginBottom:5 },
  activeDates: { color:'#333', fontSize:12, fontWeight:'bold', marginBottom:15 },
  editBtn: { backgroundColor:'#000', padding:12, borderRadius:10, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:10 },
  editBtnText: { color:'#FFF', fontWeight:'bold', fontSize:12 },

  emptyCard: { backgroundColor: '#111', borderRadius: 15, padding: 30, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#333' },
  emptyText: { color: '#666', marginBottom: 15 },
  createBtn: { backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  createBtnText: { color: '#FFF', fontWeight: 'bold', fontSize:12 },

  folderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#222', gap: 15 },
  folderIconBox: { width: 50, height: 50, borderRadius: 10, backgroundColor: 'rgba(204,255,0,0.1)', justifyContent:'center', alignItems:'center' },
  folderTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  folderSubtitle: { color: '#666', fontSize: 12, marginTop: 2 },

  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 12, marginBottom: 10, gap: 15 },
  actionText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, flex:1 },
  historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },

  dangerZone: { gap: 15 },
  dangerBtnOutline: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, padding:15, borderRadius:12, borderWidth:1, borderColor:'#666', backgroundColor:'#111' },
  dangerBtnSolid: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, padding:15, borderRadius:12, backgroundColor:'#FF3B30' },
  dangerBtnText: { color:'#FFF', fontWeight:'900', fontSize:14 },

  modalContainerFull: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', padding: 20, borderRadius: 12, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  historyName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  historyDate: { color: '#666', fontSize: 12, marginTop: 4 },
  detailHeader: { marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  detailName: { color: '#CCFF00', fontSize: 28, fontWeight: '900', marginBottom: 5 },
  detailDate: { color: '#888', fontSize: 14 },
  exRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start', backgroundColor: '#111', padding: 15, borderRadius: 12 },
  exIndexBadge: { backgroundColor: '#222', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  exIndex: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  exName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  pill: { backgroundColor: '#222', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#333' },
  pillText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  dayLabel: { color: '#32ADE6', fontWeight: '900', fontSize: 12, marginLeft: 'auto' }
});