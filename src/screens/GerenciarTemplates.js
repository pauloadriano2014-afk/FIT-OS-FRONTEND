// src/screens/GerenciarTemplates.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, 
  Modal, TextInput, Alert, ActivityIndicator, StatusBar, Platform, ScrollView,
  useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../contexts/ThemeContext';

const FOLDER_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#f97316', '#ec4899', '#06b6d4', '#eab308', '#6366f1', '#888888'];

export default function GerenciarTemplates({ navigation }) {
  const { theme } = useTheme(); 
  const { width } = useWindowDimensions();

  const [templates, setTemplates] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCollection, setSelectedCollection] = useState(null);

  const [modalColVisible, setModalColVisible] = useState(false);
  const [modalTempVisible, setModalTempVisible] = useState(false);
  const [modalMoveVisible, setModalMoveVisible] = useState(false); 
  const [templateToMove, setTemplateToMove] = useState(null);

  const [modalPreviewVisible, setModalPreviewVisible] = useState(false);
  const [templateToPreview, setTemplateToPreview] = useState(null);
  const [isCloning, setIsCloning] = useState(false);

  const [isImportingAI, setIsImportingAI] = useState(false); 
  
  const [colName, setColName] = useState('');
  const [colColor, setColColor] = useState(FOLDER_COLORS[0]);
  const [editingCollectionId, setEditingCollectionId] = useState(null);

  const [newTempName, setNewTempName] = useState('');
  const [newTempGoal, setNewTempGoal] = useState('Hipertrofia');
  const [newTempLevel, setNewTempLevel] = useState('Intermediário');

  const [adminId, setAdminId] = useState(null);
  const [isAdriLogged, setIsAdriLogged] = useState(false);
  const [libFilter, setLibFilter] = useState('MEUS'); 

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchData(); });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const userJson = await AsyncStorage.getItem('user');
        if (!userJson) return;
        const userObj = JSON.parse(userJson);
        const currentAdminId = userObj.id;
        const email = userObj.email.toLowerCase();
        
        setAdminId(currentAdminId);
        setIsAdriLogged(email === 'adri.personal@hotmail.com');

        const [resCol, resTemp] = await Promise.all([
            fetch(`https://fitos-final.onrender.com/api/admin/collections?adminId=${currentAdminId}&t=${Date.now()}`),
            fetch(`https://fitos-final.onrender.com/api/admin/templates?adminId=${currentAdminId}&t=${Date.now()}`)
        ]);

        if (resCol.ok) setCollections(await resCol.json());
        if (resTemp.ok) setTemplates(await resTemp.json());
        
    } catch(e) { 
        if (Platform.OS === 'web') window.alert("Falha ao carregar a biblioteca.");
        else Alert.alert("Erro", "Falha ao carregar a biblioteca."); 
    } finally { setLoading(false); }
  };

  const isOwner = (item) => {
      const itemAdminId = item.adminId || item.coachId;
      if (isAdriLogged) {
          return itemAdminId === adminId;
      } else {
          return itemAdminId === adminId || !itemAdminId;
      }
  };

  const handleCreateOrEditCollection = async () => {
      if (!colName.trim()) {
          if (Platform.OS === 'web') window.alert("Dê um nome para a pasta.");
          else Alert.alert("Nome Inválido", "Dê um nome para a pasta.");
          return;
      }
      setLoading(true);
      try {
          const method = editingCollectionId ? 'PUT' : 'POST';
          const body = editingCollectionId 
              ? { id: editingCollectionId, name: colName, color: colColor }
              : { name: colName, color: colColor, adminId };

          const res = await fetch(`https://fitos-final.onrender.com/api/admin/collections`, {
              method: method, headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });
          
          if (res.ok) {
              setModalColVisible(false); 
              setColName(''); 
              setColColor(FOLDER_COLORS[0]); 
              
              if (editingCollectionId && selectedCollection) {
                  setSelectedCollection({ ...selectedCollection, name: colName, color: colColor });
              }
              setEditingCollectionId(null);
              fetchData();
          } else { throw new Error("Falha na API"); }
      } catch(e) {
          if (Platform.OS === 'web') window.alert("Não foi possível salvar a pasta.");
          else Alert.alert("Erro", "Não foi possível salvar a pasta.");
          setLoading(false);
      }
  };

  const handleDeleteCollection = async (id) => {
      const doDelete = async () => {
          setLoading(true);
          try {
              await fetch(`https://fitos-final.onrender.com/api/admin/collections?id=${id}`, { method: 'DELETE' });
              setSelectedCollection(null);
              fetchData();
          } catch(e) {
              if (Platform.OS === 'web') window.alert("Erro ao excluir");
              setLoading(false);
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm("Isso apagará a pasta e removerá os treinos de dentro dela (eles ficarão avulsos). Continuar?")) doDelete();
      } else {
          Alert.alert("Excluir Pasta", "Isso apagará a pasta e os treinos ficarão avulsos. Continuar?", [
              { text: "Cancelar" }, { text: "Excluir", style: 'destructive', onPress: doDelete }
          ]);
      }
  };

  const handleImportPDF = async (mode = 'FULL') => {
      try {
          const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
          if (result.canceled) return;

          setIsImportingAI(true);
          const fileToUpload = result.assets[0];
          const formData = new FormData();
          formData.append('mode', mode);

          if (Platform.OS === 'web') {
              const res = await fetch(fileToUpload.uri);
              const blob = await res.blob();
              formData.append('file', blob, fileToUpload.name);
          } else {
              formData.append('file', { uri: fileToUpload.uri, name: fileToUpload.name, type: fileToUpload.mimeType || 'application/pdf' });
          }

          const response = await fetch('https://fitos-final.onrender.com/api/admin/import-pdf', {
              method: 'POST', body: formData, headers: { 'Accept': 'application/json' }
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Erro na IA');

          setModalTempVisible(false);
          
          // 🔥 CORREÇÃO: EMPACOTANDO O DADO EM STRING ANTES DE MANDAR NA ROTA 🔥
          navigation.navigate('MontarTreinoAdmin', { 
              isTemplateMode: true, 
              templateData: JSON.stringify({ 
                  name: data.workoutName || (mode === 'FULL' ? "Nova Rotina Semanal" : "Novo Treino Avulso"), 
                  goal: newTempGoal, level: newTempLevel,
                  collectionId: selectedCollection?.id || null, 
                  data: JSON.stringify(data.exercisesByDay || { 'A': [] }) 
              }) 
          });
      } catch (error) {
          if (Platform.OS === 'web') window.alert("Não foi possível processar o PDF.");
          else Alert.alert("Erro", "Não foi possível processar o PDF.");
      } finally { setIsImportingAI(false); }
  };

  const deleteTemplate = async (id) => {
      const doDelete = async () => {
          setLoading(true);
          try {
              await fetch(`https://fitos-final.onrender.com/api/admin/templates?id=${id}`, { method: 'DELETE' });
              fetchData();
          } catch (e) { 
              if (Platform.OS === 'web') window.alert("Erro ao excluir");
              setLoading(false); 
          }
      };
      if (Platform.OS === 'web') {
          if (window.confirm("Apagar este modelo permanentemente?")) doDelete();
      } else {
          Alert.alert("Excluir", "Apagar este modelo permanentemente?", [{ text: "Cancelar" }, { text: "Excluir", style: 'destructive', onPress: doDelete }]);
      }
  };

  const openMoveModal = (template) => {
      setTemplateToMove(template);
      setModalMoveVisible(true);
  };

  const handleMoveTemplate = async (collectionId) => {
      setLoading(true);
      try {
          const res = await fetch('https://fitos-final.onrender.com/api/admin/templates', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  id: templateToMove.id, name: templateToMove.name, goal: templateToMove.goal, 
                  level: templateToMove.level, data: templateToMove.data,
                  adminId: adminId,
                  collectionId: collectionId 
              })
          });
          if (res.ok) { setModalMoveVisible(false); setTemplateToMove(null); fetchData(); } 
          else { throw new Error("Erro na API"); }
      } catch(e) {
          if (Platform.OS === 'web') window.alert("Erro ao mover treino.");
          else Alert.alert("Erro", "Não foi possível mover o treino.");
          setLoading(false);
      }
  };

  const goToEditor = (template = null) => {
      if (template && !isOwner(template)) {
          setTemplateToPreview(template);
          setModalPreviewVisible(true);
          return;
      }

      setModalTempVisible(false);
      if (template) {
          // 🔥 CORREÇÃO: EMPACOTANDO O DADO EM STRING ANTES DE MANDAR NA ROTA 🔥
          navigation.navigate('MontarTreinoAdmin', { isTemplateMode: true, templateData: JSON.stringify(template) });
      } else {
          const finalName = newTempName.trim() ? newTempName : "Novo Template";
          const newObj = { name: finalName, goal: newTempGoal, level: newTempLevel, collectionId: selectedCollection?.id || null, data: JSON.stringify({ 'A': [] }) };
          
          // 🔥 CORREÇÃO: EMPACOTANDO O DADO EM STRING ANTES DE MANDAR NA ROTA 🔥
          navigation.navigate('MontarTreinoAdmin', { 
              isTemplateMode: true, 
              templateData: JSON.stringify(newObj) 
          });
          setNewTempName('');
      }
  };

  const handleCloneTemplate = async () => {
      setIsCloning(true);
      try {
          const res = await fetch('https://fitos-final.onrender.com/api/admin/templates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: `${templateToPreview.name} (Cópia)`,
                  goal: templateToPreview.goal,
                  level: templateToPreview.level,
                  data: templateToPreview.data,
                  adminId: adminId,
                  collectionId: null
              })
          });
          
          if (res.ok) {
              setModalPreviewVisible(false);
              setLibFilter('MEUS'); 
              setSelectedCollection(null); 
              fetchData();
              if (Platform.OS === 'web') window.alert("Treino importado com sucesso para seus Treinos Avulsos!");
              else Alert.alert("Sucesso", "Treino importado para a sua biblioteca avulsa.");
          } else {
              throw new Error("Erro ao salvar.");
          }
      } catch (e) {
          if (Platform.OS === 'web') window.alert("Erro ao clonar treino.");
          else Alert.alert("Erro", "Falha ao clonar o treino.");
      } finally {
          setIsCloning(false);
      }
  };

  const openEditCollectionModal = () => {
      setColName(selectedCollection.name);
      setColColor(selectedCollection.color);
      setEditingCollectionId(selectedCollection.id);
      setModalColVisible(true);
  };

  const openCreateCollectionModal = () => {
      setColName('');
      setColColor(FOLDER_COLORS[0]);
      setEditingCollectionId(null);
      setModalColVisible(true);
  };

  const renderPreviewRoutine = () => {
      if (!templateToPreview || !templateToPreview.data) return null;
      try {
          const parsedData = typeof templateToPreview.data === 'string' ? JSON.parse(templateToPreview.data) : templateToPreview.data;
          const days = Object.keys(parsedData);
          
          return days.map(day => (
              <View key={day} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                      <MaterialCommunityIcons name="dumbbell" size={16} color={theme.accent} />
                      <Text style={{ fontSize: 16, fontWeight: '900', color: theme.accent }}>TREINO {day}</Text>
                  </View>
                  {(!parsedData[day] || parsedData[day].length === 0) ? (
                      <Text style={{ color: theme.textSecondary, fontSize: 12, fontStyle: 'italic', marginLeft: 24 }}>Nenhum exercício cadastrado.</Text>
                  ) : (
                      parsedData[day].map((exercise, idx) => {
                          const exName = exercise.name || exercise.title || exercise.exerciseName || 'Exercício sem nome';
                          const isCardio = (exercise.category || '').toUpperCase() === 'CARDIO';
                          
                          let renderBlocks = [];
                          if (exercise.blocks && exercise.blocks.length > 0) {
                              renderBlocks = exercise.blocks;
                          } else if (exercise.series) {
                              const [sets, reps] = exercise.series.split('/');
                              renderBlocks = [{ sets: sets || '-', reps: reps || '-', technique: exercise.technique && exercise.technique !== 'NORMAL' ? exercise.technique : '' }];
                          } else if (exercise.sets && exercise.reps) {
                              renderBlocks = [{ sets: exercise.sets, reps: exercise.reps, technique: exercise.technique || '' }];
                          } else {
                              renderBlocks = [{ sets: '-', reps: '-', technique: '' }];
                          }

                          return (
                              <View key={idx} style={{ backgroundColor: theme.surface, padding: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: theme.border, marginLeft: 10 }}>
                                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13, marginBottom: 6 }} numberOfLines={2}>
                                      {exName}
                                  </Text>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                      {renderBlocks.map((blk, bIdx) => (
                                          <View key={bIdx} style={{ backgroundColor: theme.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '900' }}>
                                                  {isCardio ? `${blk.sets}min / ${blk.reps}kcal` : `${blk.sets} x ${blk.reps}`}
                                              </Text>
                                              {blk.technique ? (
                                                  <Text style={{ color: theme.accent, fontSize: 9, fontWeight: 'bold', marginLeft: 4 }}>
                                                      ({blk.technique})
                                                  </Text>
                                              ) : null}
                                          </View>
                                      ))}
                                  </View>
                              </View>
                          );
                      })
                  )}
              </View>
          ));
      } catch (e) {
          return <Text style={{color: '#FF3B30'}}>Erro ao ler a estrutura do treino.</Text>;
      }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  const filteredCollections = collections.filter(c => libFilter === 'MEUS' ? isOwner(c) : !isOwner(c));
  const filteredTemplatesTotal = templates.filter(t => libFilter === 'MEUS' ? isOwner(t) : !isOwner(t));

  const displayedTemplates = selectedCollection 
      ? filteredTemplatesTotal.filter(t => t.collectionId === selectedCollection.id)
      : filteredTemplatesTotal.filter(t => t.collectionId === null || t.collectionId === undefined || t.collectionId === ''); 

  return (
    <RootComponent style={isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => selectedCollection ? setSelectedCollection(null) : navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.text}/>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
                <Text style={[styles.title, { color: theme.text }]}>
                    {selectedCollection ? selectedCollection.name.toUpperCase() : "BIBLIOTECA VIP"}
                </Text>
                {selectedCollection && <Text style={{ color: selectedCollection.color, fontSize: 10, fontWeight: 'bold' }}>COLEÇÃO DE TREINOS</Text>}
            </View>
            
            {(!selectedCollection && libFilter === 'MEUS') || (selectedCollection && isOwner(selectedCollection)) ? (
                <TouchableOpacity onPress={() => selectedCollection ? setModalTempVisible(true) : openCreateCollectionModal()} style={styles.addIcon}>
                    <Ionicons name={selectedCollection ? "add-circle" : "folder-open"} size={28} color={selectedCollection ? selectedCollection.color : theme.accent}/>
                </TouchableOpacity>
            ) : (
                <View style={{ width: 38 }} />
            )}
          </View>

          {!selectedCollection && (
              <View style={styles.coachFilterContainer}>
                  <TouchableOpacity style={[styles.coachFilterBtn, libFilter === 'MEUS' ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setLibFilter('MEUS')}>
                      <Text style={[styles.coachFilterText, libFilter === 'MEUS' ? { color: '#000' } : { color: theme.textSecondary }]}>MINHA BIBLIOTECA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.coachFilterBtn, libFilter === 'EQUIPE' ? { backgroundColor: '#AF52DE', borderColor: '#AF52DE' } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setLibFilter('EQUIPE')}>
                      <Text style={[styles.coachFilterText, libFilter === 'EQUIPE' ? { color: '#FFF' } : { color: theme.textSecondary }]}>EQUIPE</Text>
                  </TouchableOpacity>
              </View>
          )}

          {loading ? <ActivityIndicator color={theme.accent} style={{marginTop:50}} /> : (
            <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100, flexGrow: 1}} showsVerticalScrollIndicator={false}>
                
                {selectedCollection && isOwner(selectedCollection) && (
                    <View style={{flexDirection: 'row', gap: 10, marginBottom: 25}}>
                        <TouchableOpacity style={{flex: 1, flexDirection:'row', alignItems:'center', justifyContent:'center', padding: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12}} onPress={openEditCollectionModal}>
                            <MaterialCommunityIcons name="pencil" size={18} color={theme.text} />
                            <Text style={{color: theme.text, fontWeight: 'bold', marginLeft: 8, fontSize: 12}}>EDITAR PASTA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{flex: 1, flexDirection:'row', alignItems:'center', justifyContent:'center', padding: 12, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 12}} onPress={() => handleDeleteCollection(selectedCollection.id)}>
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                            <Text style={{color: '#FF3B30', fontWeight: 'bold', marginLeft: 8, fontSize: 12}}>APAGAR</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {selectedCollection && !isOwner(selectedCollection) && (
                    <View style={{backgroundColor: theme.surface, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 25, alignItems: 'center', flexDirection: 'row', gap: 10}}>
                        <MaterialCommunityIcons name="shield-lock" size={24} color={theme.textSecondary} />
                        <Text style={{color: theme.textSecondary, flex: 1, fontSize: 12, fontWeight: 'bold'}}>Pasta Protegida. Você só pode visualizar e importar os treinos contidos nela.</Text>
                    </View>
                )}

                {!selectedCollection && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PROGRAMAS E PASTAS</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 }}>
                            {filteredCollections.length === 0 ? (
                                <Text style={styles.emptyText}>Nenhuma coleção encontrada nesta aba.</Text>
                            ) : (
                                filteredCollections.map(col => (
                                    <TouchableOpacity key={col.id} style={[styles.collectionCard, { backgroundColor: col.color + '15', borderColor: col.color }]} onPress={() => setSelectedCollection(col)}>
                                        <MaterialCommunityIcons name="folder-star" size={32} color={col.color} style={{ marginBottom: 10 }} />
                                        <Text style={[styles.collectionTitle, { color: col.color }]} numberOfLines={2}>{col.name}</Text>
                                        <Text style={[styles.collectionCount, { color: col.color, opacity: 0.8 }]}>{col._count?.templates || 0} treinos</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                        
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TREINOS AVULSOS</Text>
                    </>
                )}

                {displayedTemplates.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <MaterialCommunityIcons name="file-document-outline" size={40} color={theme.border} />
                        <Text style={styles.emptyText}>Nenhum treino encontrado aqui.</Text>
                    </View>
                ) : (
                    displayedTemplates.map(item => (
                        <View key={item.id} style={[styles.premiumCard, { backgroundColor: theme.surface, borderLeftColor: selectedCollection ? selectedCollection.color : theme.border }]}>
                            <TouchableOpacity style={{flex:1, paddingVertical: 5}} onPress={() => goToEditor(item)}>
                                <Text style={[styles.premiumCardTitle, { color: theme.text }]}>{item.name}</Text>
                                <Text style={{fontSize: 11, color: theme.textSecondary, fontWeight: 'bold', marginTop: 4}}>{item.goal} • {item.level}</Text>
                            </TouchableOpacity>
                            
                            {isOwner(item) ? (
                                <View style={styles.premiumCardActions}>
                                    <TouchableOpacity onPress={() => openMoveModal(item)} style={styles.actionBtn}>
                                        <MaterialCommunityIcons name="folder-move-outline" size={22} color={theme.accent} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => goToEditor(item)} style={styles.actionBtn}>
                                        <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => deleteTemplate(item.id)} style={styles.actionBtn}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.premiumCardActions} onPress={() => goToEditor(item)}>
                                    <View style={{backgroundColor: theme.bg, padding: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 5}}>
                                        <MaterialCommunityIcons name="eye-outline" size={16} color={theme.textSecondary} />
                                        <Text style={{fontSize: 10, fontWeight: 'bold', color: theme.textSecondary}}>VER</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
          )}
      </View>

      <Modal visible={modalPreviewVisible} transparent animationType="slide">
          <View style={styles.modalOverlayPreview}>
              <View style={[styles.modalContentPreview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.modalHeader, { padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 0 }]}>
                      <View style={{flex: 1}}>
                          <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>{templateToPreview?.name}</Text>
                          <Text style={{color: theme.textSecondary, fontSize: 12, fontWeight: 'bold', marginTop: 4}}>{templateToPreview?.goal} • {templateToPreview?.level}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setModalPreviewVisible(false)} style={{padding: 5}}>
                          <Ionicons name="close" size={24} color={theme.text}/>
                      </TouchableOpacity>
                  </View>

                  <ScrollView style={{ padding: 20, flex: 1 }} showsVerticalScrollIndicator={false}>
                      {renderPreviewRoutine()}
                  </ScrollView>

                  <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
                      <TouchableOpacity 
                          style={[styles.createBtn, { backgroundColor: '#4DE38F', marginTop: 0, flexDirection: 'row', gap: 10 }]} 
                          onPress={handleCloneTemplate} 
                          disabled={isCloning}
                      >
                          {isCloning ? <ActivityIndicator color="#000" /> : (
                              <>
                                  <MaterialCommunityIcons name="content-copy" size={20} color="#000" />
                                  <Text style={[styles.createBtnText, { color: '#000' }]}>IMPORTAR PARA MINHA BIBLIOTECA</Text>
                              </>
                          )}
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      <Modal visible={modalMoveVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>MOVER PARA...</Text>
                    <TouchableOpacity onPress={() => setModalMoveVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.text}/>
                    </TouchableOpacity>
                </View>
                <ScrollView style={{maxHeight: 300}}>
                    <TouchableOpacity style={[styles.moveOption, { borderBottomColor: theme.border }]} onPress={() => handleMoveTemplate(null)}>
                        <MaterialCommunityIcons name="folder-outline" size={20} color={theme.textSecondary} />
                        <Text style={{color: theme.text, fontWeight: 'bold'}}>Remover da pasta (Avulso)</Text>
                    </TouchableOpacity>
                    {collections.filter(c => isOwner(c)).map(col => (
                        <TouchableOpacity key={col.id} style={[styles.moveOption, { borderBottomColor: theme.border }]} onPress={() => handleMoveTemplate(col.id)}>
                            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: col.color }} />
                            <Text style={{color: col.color, fontWeight: 'bold'}}>{col.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
      </Modal>

      <Modal visible={modalColVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colColor }]}>{editingCollectionId ? "EDITAR COLEÇÃO" : "NOVA COLEÇÃO"}</Text>
                    <TouchableOpacity onPress={() => setModalColVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.text}/>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.label}>NOME DO PROGRAMA OU PASTA</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: colColor, color: theme.text, marginBottom: 25 }]} value={colName} onChangeText={setColName} placeholder="Ex: Seca Rápido 30 Dias" placeholderTextColor={theme.textSecondary} />

                <Text style={styles.label}>COR DE DESTAQUE</Text>
                <View style={styles.colorGrid}>
                    {FOLDER_COLORS.map(color => (
                        <TouchableOpacity key={color} style={[styles.colorCircle, { backgroundColor: color }, colColor === color && styles.colorSelected]} onPress={() => setColColor(color)}>
                            {colColor === color && <MaterialCommunityIcons name="check" size={20} color="#FFF" />}
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={[styles.createBtn, { backgroundColor: colColor }]} onPress={handleCreateOrEditCollection}>
                    <Text style={[styles.createBtnText, { color: '#FFF' }]}>{editingCollectionId ? "SALVAR ALTERAÇÕES" : "CRIAR COLEÇÃO"}</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      <Modal visible={modalTempVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: selectedCollection ? selectedCollection.color : theme.accent }]}>NOVO TREINO {selectedCollection ? `EM ${selectedCollection.name.toUpperCase()}` : ''}</Text>
                    <TouchableOpacity onPress={()=>setModalTempVisible(false)}>
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
                        <TouchableOpacity style={[styles.aiButton, { backgroundColor: selectedCollection ? selectedCollection.color : theme.accent }]} onPress={() => handleImportPDF('FULL')}>
                            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFF" />
                            <Text style={[styles.aiButtonText, { color: '#FFF' }]}>IMPORTAR ROTINA INTEIRA (PDF)</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.aiButtonSingle, { borderColor: selectedCollection ? selectedCollection.color : theme.accent }]} onPress={() => handleImportPDF('SINGLE')}>
                            <MaterialCommunityIcons name="magic-staff" size={20} color={selectedCollection ? selectedCollection.color : theme.accent} />
                            <Text style={[styles.aiButtonTextSingle, { color: selectedCollection ? selectedCollection.color : theme.accent }]}>IMPORTAR 1 TREINO AVULSO (PDF)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.aiButtonSingle, { borderColor: selectedCollection ? selectedCollection.color : theme.accent, backgroundColor: (selectedCollection ? selectedCollection.color : theme.accent) + '15' }]} onPress={() => {
                            setModalTempVisible(false);
                            navigation.navigate('LaboratoryScreen'); // Manda pro laboratório
                        }}>
                            <MaterialCommunityIcons name="flask" size={20} color={selectedCollection ? selectedCollection.color : theme.accent} />
                            <Text style={[styles.aiButtonTextSingle, { color: selectedCollection ? selectedCollection.color : theme.accent }]}>GERAR MATRIZ NO LABORATÓRIO</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.divider, {backgroundColor: theme.border}]} />
                
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>NOME DO MODELO (OPCIONAL)</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]} value={newTempName} onChangeText={setNewTempName} placeholder="Ex: Treino A - Quadríceps" placeholderTextColor={theme.textSecondary} />
                    
                    <Text style={styles.label}>OBJETIVO PRINCIPAL</Text>
                    <View style={styles.rowWrap}>
                        {['Hipertrofia','Emagrecimento','Força'].map(g => (
                            <TouchableOpacity key={g} onPress={()=>setNewTempGoal(g)} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, newTempGoal===g && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                                <Text style={[styles.chipText, { color: theme.textSecondary }, newTempGoal===g && {color: theme.isDark ? '#000' : '#FFF'}]}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>NÍVEL DO ALUNO</Text>
                    <View style={styles.rowWrap}>
                        {['Iniciante','Intermediário','Avançado'].map(l => (
                            <TouchableOpacity key={l} onPress={()=>setNewTempLevel(l)} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, newTempLevel===l && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
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
  header: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal: 20, paddingVertical: 15, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems:'center', borderBottomWidth: 1 },
  title: { fontWeight:'900', fontSize: 14, letterSpacing: 0.5 },
  backBtn: { padding: 5 },
  addIcon: { padding: 5 },

  coachFilterContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 15, gap: 10, backgroundColor: 'transparent' },
  coachFilterBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  coachFilterText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 15, marginTop: 10 },
  
  collectionCard: { width: '48%', padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 15, alignItems: 'flex-start' },
  collectionTitle: { fontWeight: '900', fontSize: 15, marginBottom: 5 },
  collectionCount: { fontSize: 11, fontWeight: 'bold' },

  emptyBox: { alignItems:'center', marginTop: 40, padding: 30 },
  emptyText: { color:'#888', textAlign:'center', marginTop:10, fontStyle:'italic' },

  premiumCard: { padding: 18, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  premiumCardTitle: { fontWeight: '900', fontSize: 15 },
  premiumCardActions: { flexDirection: 'row', gap: 15, paddingLeft: 10 },
  actionBtn: { padding: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 25, borderRadius: 24, borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center', maxHeight: '90%' },
  
  modalOverlayPreview: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContentPreview: { borderRadius: 24, borderWidth: 1, width: '100%', maxWidth: 480, alignSelf: 'center', height: '80%', padding: 0, overflow: 'hidden' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },

  moveOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18, borderBottomWidth: 1 },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  colorCircle: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#FFF', elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3 },

  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, gap: 8 },
  aiButtonText: { fontWeight: '900', fontSize: 13 },
  aiButtonSingle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  aiButtonTextSingle: { fontWeight: 'bold', fontSize: 12 },

  divider: { height: 1, width: '100%', marginVertical: 20 },
  label: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, fontWeight: 'bold', outlineStyle: 'none' },
  rowWrap: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: 'bold' },
  createBtn: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10, justifyContent: 'center' },
  createBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});