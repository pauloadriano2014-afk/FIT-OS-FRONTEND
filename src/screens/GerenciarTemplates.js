import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, 
  Modal, TextInput, Alert, ActivityIndicator, StatusBar, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function GerenciarTemplates({ navigation }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estado para Novo Template
  const [newTempName, setNewTempName] = useState('');
  const [newTempGoal, setNewTempGoal] = useState('Hipertrofia');
  const [newTempLevel, setNewTempLevel] = useState('Intermediário');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTemplates();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
        const res = await fetch(`https://fitos-final.onrender.com/api/admin/templates?t=${Date.now()}`);
        const data = await res.json();
        setTemplates(data || []);
    } catch(e) { Alert.alert("Erro", "Falha ao carregar"); }
    finally { setLoading(false); }
  };

  const deleteTemplate = async (id) => {
      Alert.alert("Excluir", "Apagar este modelo?", [
          { text: "Cancelar" },
          { text: "Excluir", style: 'destructive', onPress: async () => {
              try {
                  await fetch(`https://fitos-final.onrender.com/api/admin/templates?id=${id}`, { method: 'DELETE' });
                  fetchTemplates();
              } catch (e) { Alert.alert("Erro ao excluir"); }
          }}
      ]);
  };

  // NAVEGAÇÃO: CRIAÇÃO OU EDIÇÃO
  const goToEditor = (template = null) => {
      setModalVisible(false);
      
      if (template) {
          // MODO EDIÇÃO
          navigation.navigate('MontarTreinoAdmin', { 
              isTemplateMode: true, 
              templateData: template 
          });
      } else {
          // MODO CRIAÇÃO (Novo)
          if(!newTempName) return Alert.alert("Nome", "Digite um nome para o template.");
          
          navigation.navigate('MontarTreinoAdmin', { 
              isTemplateMode: true, 
              templateData: { 
                  name: newTempName, 
                  goal: newTempGoal, 
                  level: newTempLevel,
                  data: JSON.stringify({ 'A': [] }) // Começa vazio
              } 
          });
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF"/>
        </TouchableOpacity>
        <Text style={styles.title}>MEUS TEMPLATES</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addIcon}>
             <MaterialCommunityIcons name="plus" size={24} color="#CCFF00"/>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#CCFF00" style={{marginTop:50}} /> : (
        <FlatList 
            data={templates}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding: 20, paddingBottom: 100}}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum template encontrado.</Text>}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <TouchableOpacity style={{flex:1}} onPress={() => goToEditor(item)}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <View style={styles.badges}>
                            <View style={styles.badge}><Text style={styles.badgeText}>{item.goal}</Text></View>
                            <View style={styles.badge}><Text style={styles.badgeText}>{item.level}</Text></View>
                        </View>
                    </TouchableOpacity>
                    
                    <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => goToEditor(item)} style={styles.actionBtn}>
                            <MaterialCommunityIcons name="pencil" size={20} color="#CCFF00" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteTemplate(item.id)} style={styles.actionBtn}>
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        />
      )}

      {/* MODAL CRIAR */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>NOVO MODELO</Text>
                    <TouchableOpacity onPress={()=>setModalVisible(false)}>
                        <MaterialCommunityIcons name="close" size={24} color="#FFF"/>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.label}>NOME (Ex: Fullbody A)</Text>
                <TextInput style={styles.input} value={newTempName} onChangeText={setNewTempName} placeholder="Nome do Treino" placeholderTextColor="#666"/>
                
                <Text style={styles.label}>OBJETIVO</Text>
                <View style={styles.rowWrap}>
                    {['Hipertrofia','Emagrecimento','Força'].map(g => (
                        <TouchableOpacity key={g} onPress={()=>setNewTempGoal(g)} style={[styles.chip, newTempGoal===g && styles.chipActive]}><Text style={[styles.chipText, newTempGoal===g && {color:'#000'}]}>{g}</Text></TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>NÍVEL</Text>
                <View style={styles.rowWrap}>
                    {['Iniciante','Intermediário','Avançado'].map(l => (
                        <TouchableOpacity key={l} onPress={()=>setNewTempLevel(l)} style={[styles.chip, newTempLevel===l && styles.chipActive]}><Text style={[styles.chipText, newTempLevel===l && {color:'#000'}]}>{l}</Text></TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.createBtn} onPress={() => goToEditor(null)}>
                    <Text style={styles.createBtnText}>COMEÇAR A MONTAR</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    // 🔥 CORREÇÃO TOPO
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  header: { 
    flexDirection:'row', 
    justifyContent:'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    alignItems:'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222'
  },
  title: { color: '#FFF', fontWeight:'900', fontSize: 16, letterSpacing: 1 },
  backBtn: { padding: 5 },
  addIcon: { padding: 5 },
  
  emptyText: { color:'#666', textAlign:'center', marginTop:50, fontStyle:'italic' },

  card: { backgroundColor: '#111', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#222' },
  cardTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  cardActions: { flexDirection: 'row', gap: 15, borderLeftWidth: 1, borderLeftColor: '#222', paddingLeft: 15 },
  actionBtn: { padding: 5 },
  
  badges: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#111', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#CCFF00', fontWeight: '900', fontSize: 18 },
  
  label: { color: '#AAA', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#000', color: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', fontSize: 14 },
  rowWrap: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#000', borderWidth: 1, borderColor: '#333' },
  chipActive: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  chipText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  createBtn: { backgroundColor: '#CCFF00', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  createBtnText: { fontWeight: '900', color: '#000', fontSize: 14 }
});