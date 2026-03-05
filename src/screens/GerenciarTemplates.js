import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, 
  Modal, TextInput, Alert, ActivityIndicator, StatusBar, Platform, ScrollView
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; 

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';

export default function GerenciarTemplates({ navigation }) {
  const { theme } = useTheme(); 

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isImportingAI, setIsImportingAI] = useState(false); 
  
  const [newTempName, setNewTempName] = useState('');
  const [newTempGoal, setNewTempGoal] = useState('Hipertrofia');
  const [newTempLevel, setNewTempLevel] = useState('Intermediário');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchTemplates(); });
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

  // 🔥 MOTOR DE IA: IMPORTAÇÃO COMPLETA OU ÚNICA
  const handleImportPDF = async (mode = 'FULL') => {
      try {
          const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
          if (result.canceled) return;

          setIsImportingAI(true);
          const fileToUpload = result.assets[0];
          const formData = new FormData();

          // 🔥 AQUI ESTAVA O ERRO: AVISAR O BACKEND SOBRE O MODO!
          formData.append('mode', mode);

          if (Platform.OS === 'web') {
              const res = await fetch(fileToUpload.uri);
              const blob = await res.blob();
              formData.append('file', blob, fileToUpload.name);
          } else {
              formData.append('file', {
                  uri: fileToUpload.uri,
                  name: fileToUpload.name,
                  type: fileToUpload.mimeType || 'application/pdf'
              });
          }

          const response = await fetch('https://fitos-final.onrender.com/api/admin/import-pdf', {
              method: 'POST',
              body: formData,
              headers: { 'Accept': 'application/json' }
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Erro na IA');

          setModalVisible(false);

          // 🔥 Navega mandando a rotina separada certinha
          navigation.navigate('MontarTreinoAdmin', { 
              isTemplateMode: true, 
              templateData: { 
                  name: data.workoutName || (mode === 'FULL' ? "Nova Rotina Semanal" : "Novo Treino Avulso"), 
                  goal: newTempGoal, 
                  level: newTempLevel,
                  data: JSON.stringify(data.exercisesByDay || { 'A': [] }) 
              } 
          });

      } catch (error) {
          console.error(error);
          Alert.alert("Erro", "Não foi possível processar o PDF.");
      } finally {
          setIsImportingAI(false);
      }
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

  const goToEditor = (template = null) => {
      setModalVisible(false);
      if (template) {
          navigation.navigate('MontarTreinoAdmin', { isTemplateMode: true, templateData: template });
      } else {
          if(!newTempName) return Alert.alert("Nome", "Digite um nome para o template.");
          navigation.navigate('MontarTreinoAdmin', { 
              isTemplateMode: true, 
              templateData: { name: newTempName, goal: newTempGoal, level: newTempLevel, data: JSON.stringify({ 'A': [] }) } 
          });
      }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.text}/>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>BIBLIOTECA DE TEMPLATES</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addIcon}>
                  <Ionicons name="add-circle" size={28} color={theme.accent}/>
            </TouchableOpacity>
          </View>

          {loading ? <ActivityIndicator color={theme.accent} style={{marginTop:50}} /> : (
            <FlatList 
                data={templates}
                keyExtractor={item => item.id}
                style={isWeb ? { overflowY: 'auto' } : {}} 
                contentContainerStyle={{padding: 20, paddingBottom: 100, flexGrow: 1}}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyText}>Crie seu primeiro template clicando no +</Text>}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TouchableOpacity style={{flex:1}} onPress={() => goToEditor(item)}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
                            <View style={styles.badges}>
                                <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                                    <Text style={[styles.badgeText, {color: theme.textSecondary}]}>{item.goal}</Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                                    <Text style={[styles.badgeText, {color: theme.textSecondary}]}>{item.level}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        
                        <View style={[styles.cardActions, { borderLeftColor: theme.border }]}>
                            <TouchableOpacity onPress={() => goToEditor(item)} style={styles.actionBtn}>
                                <Ionicons name="create-outline" size={22} color={theme.accent} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteTemplate(item.id)} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
          )}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.accent }]}>NOVO TEMPLATE PA TEAM</Text>
                    <TouchableOpacity onPress={()=>setModalVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.text}/>
                    </TouchableOpacity>
                </View>

                {isImportingAI ? (
                    <View style={{padding: 20, alignItems: 'center'}}>
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text style={{color: theme.text, marginTop: 10, fontWeight: 'bold'}}>IA PROCESSANDO PDF...</Text>
                    </View>
                ) : (
                    <View style={{gap: 12}}>
                        {/* OPÇÃO 1: ROTINA COMPLETA */}
                        <TouchableOpacity 
                            style={[styles.aiButton, { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                            onPress={() => handleImportPDF('FULL')}
                        >
                            <MaterialCommunityIcons name="lightning-bolt" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.aiButtonText, { color: theme.isDark ? '#000' : '#FFF' }]}>IMPORTAR ROTINA SEMANAL (PDF)</Text>
                        </TouchableOpacity>

                        {/* OPÇÃO 2: TREINO ÚNICO */}
                        <TouchableOpacity 
                            style={[styles.aiButtonSingle, { borderColor: theme.accent }]} 
                            onPress={() => handleImportPDF('SINGLE')}
                        >
                            <MaterialCommunityIcons name="magic-staff" size={20} color={theme.accent} />
                            <Text style={[styles.aiButtonTextSingle, { color: theme.accent }]}>IMPORTAR 1 TREINO AVULSO (PDF)</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.divider, {backgroundColor: theme.border}]} />
                
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>NOME DO MODELO</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]} 
                        value={newTempName} 
                        onChangeText={setNewTempName} 
                        placeholder="Ex: Iniciante 1º Mês - Emagrecimento" 
                        placeholderTextColor={theme.textSecondary}
                    />
                    
                    <Text style={styles.label}>OBJETIVO PRINCIPAL</Text>
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

                    <Text style={styles.label}>NÍVEL DO ALUNO</Text>
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

                    <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]} onPress={() => goToEditor(null)}>
                        <Text style={[styles.createBtnText, { color: theme.text }]}>MONTAR MANUALMENTE</Text>
                    </TouchableOpacity>
                </ScrollView>
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
  title: { fontWeight:'900', fontSize: 14, letterSpacing: 0.5 },
  backBtn: { padding: 5 },
  addIcon: { padding: 5 },
  
  emptyText: { color:'#888', textAlign:'center', marginTop:50, fontStyle:'italic' },

  card: { padding: 18, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 15, borderLeftWidth: 1, paddingLeft: 15 },
  actionBtn: { padding: 5 },
  
  badges: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 25, borderRadius: 24, borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

  // Estilos IA
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, gap: 8 },
  aiButtonText: { fontWeight: '900', fontSize: 13 },
  
  aiButtonSingle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  aiButtonTextSingle: { fontWeight: 'bold', fontSize: 12 },

  divider: { height: 1, width: '100%', marginVertical: 20 },
  
  label: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
  rowWrap: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: 'bold' },
  
  createBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25 },
  createBtnText: { fontWeight: '900', fontSize: 13 }
});