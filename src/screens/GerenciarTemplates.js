import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert, ActivityIndicator, StatusBar } from 'react-native';
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
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={24} color="#FFF"/></TouchableOpacity>
        <Text style={styles.title}>MEUS TEMPLATES</Text>
        <View style={{width:24}}/>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => {
          setNewTempName(''); // Limpa o form
          setModalVisible(true);
      }}>
        <Text style={styles.addBtnText}>+ CRIAR NOVO TEMPLATE</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color="#CCFF00" style={{marginTop:50}} /> : (
        <FlatList 
            data={templates}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding: 20, paddingBottom: 100}}
            ListEmptyComponent={<Text style={{color:'#666', textAlign:'center', marginTop:50}}>Nenhum template encontrado.</Text>}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => goToEditor(item)}>
                    <View style={{flex:1}}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <View style={styles.badges}>
                            <View style={styles.badge}><Text style={styles.badgeText}>{item.goal}</Text></View>
                            <View style={styles.badge}><Text style={styles.badgeText}>{item.level}</Text></View>
                        </View>
                    </View>
                    <View style={{flexDirection:'row', gap:20, alignItems:'center'}}>
                        <MaterialCommunityIcons name="pencil" size={20} color="#CCFF00" />
                        <TouchableOpacity onPress={() => deleteTemplate(item.id)}>
                            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}
        />
      )}

      {/* MODAL CRIAR */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>NOVO MODELO</Text>
                
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
                <TouchableOpacity style={{marginTop:15, alignItems:'center'}} onPress={()=>setModalVisible(false)}><Text style={{color:'#666'}}>Cancelar</Text></TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection:'row', justifyContent:'space-between', padding: 20, alignItems:'center' },
  title: { color: '#FFF', fontWeight:'900', fontSize: 16, letterSpacing: 1 },
  
  addBtn: { backgroundColor: '#CCFF00', margin: 20, marginTop: 0, padding: 15, borderRadius: 10, alignItems: 'center' },
  addBtnText: { fontWeight: '900', color: '#000' },
  
  card: { backgroundColor: '#161616', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#222' },
  cardTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  
  badges: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1A1A1A', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#CCFF00', fontWeight: '900', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  label: { color: '#AAA', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#000', color: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  rowWrap: { flexDirection:'row', flexWrap:'wrap', gap:5 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#000', borderWidth: 1, borderColor: '#333' },
  chipActive: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  chipText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  createBtn: { backgroundColor: '#CCFF00', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 25 },
  createBtnText: { fontWeight: '900', color: '#000' }
});