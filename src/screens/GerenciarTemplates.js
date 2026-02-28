import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, 
  Modal, TextInput, Alert, ActivityIndicator, StatusBar, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';

export default function GerenciarTemplates({ navigation }) {
  const { theme } = useTheme(); // 🔥 TEMA INJETADO

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

  // 🔥 LÓGICA DE CONTENÇÃO DO PWA (Gaiola Central)
  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg };

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      {/* GAIOLA CENTRALIZADA PARA PWA */}
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          {/* HEADER */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>MEUS TEMPLATES</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addIcon}>
                  <MaterialCommunityIcons name="plus" size={24} color={theme.accent}/>
            </TouchableOpacity>
          </View>

          {loading ? <ActivityIndicator color={theme.accent} style={{marginTop:50}} /> : (
            <FlatList 
                data={templates}
                keyExtractor={item => item.id}
                // 🔥 CORREÇÃO DE SCROLL PWA: Garante que o scroll cubra toda a área, não só os itens
                style={isWeb ? { overflowY: 'auto' } : {}} 
                contentContainerStyle={{padding: 20, paddingBottom: 100, flexGrow: 1}}
                showsVerticalScrollIndicator={true} // Força a barra de rolagem a aparecer
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum template encontrado.</Text>}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TouchableOpacity style={{flex:1}} onPress={() => goToEditor(item)}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
                            <View style={styles.badges}>
                                <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.badgeText}>{item.goal}</Text></View>
                                <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.badgeText}>{item.level}</Text></View>
                            </View>
                        </TouchableOpacity>
                        
                        <View style={[styles.cardActions, { borderLeftColor: theme.border }]}>
                            <TouchableOpacity onPress={() => goToEditor(item)} style={styles.actionBtn}>
                                <MaterialCommunityIcons name="pencil" size={20} color={theme.accent} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteTemplate(item.id)} style={styles.actionBtn}>
                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
          )}
      </View>

      {/* MODAL CRIAR */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.accent }]}>NOVO MODELO</Text>
                    <TouchableOpacity onPress={()=>setModalVisible(false)}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.text}/>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.label}>NOME (Ex: Fullbody A)</Text>
                <TextInput 
                    style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]} 
                    value={newTempName} 
                    onChangeText={setNewTempName} 
                    placeholder="Nome do Treino" 
                    placeholderTextColor={theme.textSecondary}
                />
                
                <Text style={styles.label}>OBJETIVO</Text>
                <View style={styles.rowWrap}>
                    {['Hipertrofia','Emagrecimento','Força'].map(g => (
                        <TouchableOpacity 
                            key={g} 
                            onPress={()=>setNewTempGoal(g)} 
                            style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, newTempGoal===g && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                        >
                            <Text style={[styles.chipText, { color: theme.textSecondary }, newTempGoal===g && {color: theme.isDark ? '#000' : '#FFF'}]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>NÍVEL</Text>
                <View style={styles.rowWrap}>
                    {['Iniciante','Intermediário','Avançado'].map(l => (
                        <TouchableOpacity 
                            key={l} 
                            onPress={()=>setNewTempLevel(l)} 
                            style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, newTempLevel===l && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                        >
                            <Text style={[styles.chipText, { color: theme.textSecondary }, newTempLevel===l && {color: theme.isDark ? '#000' : '#FFF'}]}>{l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.accent }]} onPress={() => goToEditor(null)}>
                    <Text style={[styles.createBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>COMEÇAR A MONTAR</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection:'row', 
    justifyContent:'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 10 : 20,
    alignItems:'center',
    borderBottomWidth: 1
  },
  title: { fontWeight:'900', fontSize: 16, letterSpacing: 1 },
  backBtn: { padding: 5 },
  addIcon: { padding: 5 },
  
  emptyText: { color:'#888', textAlign:'center', marginTop:50, fontStyle:'italic' },

  card: { padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  cardActions: { flexDirection: 'row', gap: 15, borderLeftWidth: 1, paddingLeft: 15 },
  actionBtn: { padding: 5 },
  
  badges: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 25, borderRadius: 20, borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontWeight: '900', fontSize: 18 },
  
  label: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  input: { padding: 15, borderRadius: 10, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
  rowWrap: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 10, fontWeight: 'bold' },
  
  createBtn: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  createBtnText: { fontWeight: '900', fontSize: 14 }
});