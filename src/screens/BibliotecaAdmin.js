// src/screens/BibliotecaAdmin.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, 
  Modal, Image, ActivityIndicator, Alert, KeyboardAvoidingView, 
  Platform, ScrollView, useWindowDimensions, StatusBar, ImageBackground 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker'; 

import { useTheme } from '../contexts/ThemeContext';

const categoryCovers = {
  "Peito": "https://i.imgur.com/lQBvvJ9.jpeg",
  "Costas": "https://i.imgur.com/pZKX9Iw.png",
  "Pernas": "https://i.imgur.com/Mr6YnIv.jpeg",
  "Ombros": "https://i.imgur.com/029r6Tt.jpeg",
  "Bíceps": "https://i.imgur.com/JFOWsVj.jpeg",
  "Tríceps": "https://i.imgur.com/fw0yC9n.jpeg",
  "Abdômen": "https://i.imgur.com/U0yGzvA.jpeg",
  "Cardio": "https://i.imgur.com/7j0z7bT.jpeg",
  "Antebraço": "https://i.imgur.com/HzigSSQ.jpeg",
  "Mobilidade": "https://i.imgur.com/t30EizZ.png",
  "TODOS": "https://i.imgur.com/uL3pTeW.png"
};

const SPACING = 15; 
const HORIZONTAL_PADDING = 20; 
const categories = [
    'TODOS', 'Peito', 'Costas', 'Pernas', 'Ombros', 
    'Bíceps', 'Antebraço', 'Tríceps', 'Abdômen', 'Mobilidade', 'Cardio'
];

const ExerciseCard = React.memo(({ item, onPress, onEdit, onDelete, width, theme }) => {
    return (
        <View style={[styles.exerciseCard, { width: width, backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? '#000' : '#CCC' }]}>
          <View style={styles.cardInfo}>
            
            <TouchableOpacity 
              style={[styles.iconBox, { backgroundColor: theme.bg, borderColor: theme.border }]} 
              onPress={() => onPress(item.videoUrl)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="dumbbell" size={22} color={theme.accent} />
            </TouchableOpacity>
            
            <View style={{ flex: 1, marginLeft: 15, marginRight: 10 }}>
              <Text style={[styles.exerciseName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  <View style={[styles.catTag, { backgroundColor: theme.bg }]}>
                    <Text style={[styles.exerciseSub, { color: theme.textSecondary }]}>{item.category.toUpperCase()}</Text>
                  </View>
              </View>
            </View>

            {item.videoUrl ? (
              <TouchableOpacity 
                onPress={() => onPress(item.videoUrl)} 
                style={[styles.videoPlayBtn, { backgroundColor: theme.accent }]}
              >
                <MaterialCommunityIcons name="play" size={24} color={theme.isDark ? "#000" : "#FFF"} />
              </TouchableOpacity>
            ) : null}

          </View>

          <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
    );
}, (prev, next) => {
    return prev.item.id === next.item.id && 
           prev.item.videoUrl === next.item.videoUrl && 
           prev.item.name === next.item.name && 
           prev.item.category === next.item.category && 
           prev.width === next.width &&
           prev.theme === next.theme;
});

export default function BibliotecaAdmin({ navigation }) {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme(); 
  
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedCat, setSelectedCat] = useState('TODOS');
  
  const [modalVisible, setModalVisible] = useState(false); 
  const [catModalVisible, setCatModalVisible] = useState(false); 
  const [showFormDropdown, setShowFormDropdown] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false); 

  const [formExercise, setFormExercise] = useState({ 
      id: null, 
      name: '', 
      category: 'Peito', 
      videoUrl: '' 
  });
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false); 
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const videoRef = useRef(null);

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  const getNumColumns = () => {
      if (width > 800 && isWeb) return 2; 
      return 1; 
  };
  
  const numColumns = getNumColumns();
  const containerWidth = isWeb ? (width > 800 ? 800 : (width > 480 ? 480 : width)) : width;
  const itemWidth = numColumns > 1 
      ? (containerWidth - (HORIZONTAL_PADDING * 2) - (SPACING * (numColumns - 1))) / 2
      : (containerWidth - (HORIZONTAL_PADDING * 2));

  const lateralSpace = (width - containerWidth) / 2;

  useEffect(() => { fetchLibrary(); }, []);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
        const userJson = await AsyncStorage.getItem('user');
        let adminId = '';
        if (userJson) {
            const userObj = JSON.parse(userJson);
            adminId = userObj.id;
        }

        const res = await fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${adminId}&t=${Date.now()}`);
        const data = await res.json();
        
        if (data.exercises) {
            setExercises(data.exercises.reverse()); 
        }
    } catch (error) { console.log("Erro ao buscar biblioteca:", error); } 
    finally { setLoading(false); }
  };

  const handleDelete = useCallback((id) => {
      if(isWeb) {
          const confirmDelete = window.confirm("Deseja realmente apagar este exercício?");
          if (confirmDelete) { deleteItem(id); }
      } else {
          Alert.alert("Excluir Exercício", "Tem certeza que deseja remover este item permanentemente?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Sim, apagar", style: 'destructive', onPress: () => deleteItem(id) }
          ]);
      }
  }, [isWeb]);

  const deleteItem = async (id) => {
      try {
          const url = `https://fitos-final.onrender.com/api/exercise?id=${id}`;
          const res = await fetch(url, { method: 'DELETE' });
          
          if (res.ok) {
              setExercises(prev => prev.filter(item => item.id !== id));
          } else { 
              const errorData = await res.json();
              if (isWeb) window.alert(errorData.error || "Erro ao excluir.");
              else Alert.alert("Ação Bloqueada", errorData.error || "Erro ao excluir.");
          }
      } catch (e) { 
          if (isWeb) window.alert("Erro de Conexão. Verifique sua internet.");
          else Alert.alert("Erro de Conexão", "Verifique sua internet."); 
      }
  };

  const handleUploadVideo = async () => {
      try {
          const result = await DocumentPicker.getDocumentAsync({ 
              type: 'video/*', 
              copyToCacheDirectory: true 
          });
          
          if (result.canceled) return;

          const fileToUpload = result.assets[0];
          
          const fileName = fileToUpload.name.toLowerCase();
          const isValidFormat = fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi');

          if (!isValidFormat) {
              if(isWeb) window.alert("Formato Inválido. Por favor, envie apenas vídeos no formato MP4, MOV ou AVI.");
              else Alert.alert("Formato Inválido", "Por favor, envie apenas vídeos no formato MP4, MOV ou AVI.");
              return; 
          }

          setUploadingVideo(true);
          const formData = new FormData();

          if (Platform.OS === 'web') {
              const res = await fetch(fileToUpload.uri);
              const blob = await res.blob();
              formData.append('file', blob, fileToUpload.name);
          } else {
              formData.append('file', {
                  uri: fileToUpload.uri,
                  name: fileToUpload.name || 'video_exercicio.mp4',
                  type: fileToUpload.mimeType || 'video/mp4'
              });
          }
          
          formData.append('title', formExercise.name || 'Novo Exercicio PA TEAM');

          const response = await fetch('https://fitos-final.onrender.com/api/upload', {
              method: 'POST',
              body: formData,
              headers: { 'Accept': 'application/json' }
          });

          const data = await response.json();
          
          if (response.ok && data.videoUrl) {
              setFormExercise({ ...formExercise, videoUrl: data.videoUrl });
              if(isWeb) window.alert("Vídeo enviado para a Nuvem! A Bunny.net está processando as qualidades. Aguarde 1 a 3 minutos antes de testar o vídeo.");
              else Alert.alert("Sucesso", "Vídeo enviado para a Nuvem! A Bunny.net está processando as qualidades. Aguarde 1 a 3 minutos antes de testar o vídeo.");
          } else {
              throw new Error(data.error || 'Erro no envio do vídeo.');
          }

      } catch (error) {
          console.error("Erro Upload Bunny:", error);
          if(isWeb) window.alert("Falha ao subir vídeo: " + error.message);
          else Alert.alert("Erro de Upload", "Falha ao subir o vídeo: " + error.message);
      } finally {
          setUploadingVideo(false);
      }
  };

  const handleSaveOrUpdate = async () => {
      if (!formExercise.name) return Alert.alert("Campos Incompletos", "O nome do exercício é obrigatório.");
      setSaving(true);
      try {
          const userJson = await AsyncStorage.getItem('user');
          let adminId = '';
          if (userJson) {
              const userObj = JSON.parse(userJson);
              adminId = userObj.id;
          }

          const payload = {
              ...formExercise,
              adminId: adminId
          };

          const apiUrl = 'https://fitos-final.onrender.com/api/exercise'; 
          const res = await fetch(apiUrl, {
              method: !!formExercise.id ? 'PUT' : 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              setModalVisible(false);
              fetchLibrary();
              if(isWeb) window.alert("Exercício salvo com sucesso!");
              else Alert.alert("Sucesso", "Exercício salvo com sucesso!");
          } else { 
              const errorData = await res.json();
              if(isWeb) window.alert(errorData.error || "O servidor recusou os dados.");
              else Alert.alert("Atenção", errorData.error || "O servidor recusou os dados."); 
          }
      } catch (e) { 
          if(isWeb) window.alert(e.message);
          else Alert.alert("Erro de Conexão", e.message); 
      } 
      finally { setSaving(false); }
  };

  const openVideoPreview = useCallback((url) => {
      if (!url || url.length < 5) return Alert.alert("Vídeo Indisponível", "Este exercício não possui vídeo.");
      setCurrentVideoUrl(url);
      setVideoModalVisible(true);
  }, []);

  const filteredList = exercises.filter(e => {
      const matchText = e.name.toLowerCase().includes(filterText.toLowerCase());
      const matchCat = selectedCat === 'TODOS' || e.category === selectedCat;
      return matchText && matchCat;
  });

  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg };

  return (
    <RootComponent style={rootStyle}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        {isWeb && lateralSpace > 10 && (
            <View style={[StyleSheet.absoluteFill, { zIndex: -1, pointerEvents: 'none' }]}>
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: lateralSpace, justifyContent: 'center', alignItems: 'center' }}>
                    <Image 
                        source={require('../../assets/logo.png')} 
                        style={{ width: '85%', height: '60%', resizeMode: 'contain' }}
                    />
                </View>
                <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: lateralSpace, justifyContent: 'center', alignItems: 'center' }}>
                    <Image 
                        source={require('../../assets/logo.png')} 
                        style={{ width: '85%', height: '60%', resizeMode: 'contain' }}
                    />
                </View>
            </View>
        )}

        <View style={{ 
            flex: 1, 
            width: isWeb ? '100%' : '100%', 
            maxWidth: containerWidth, 
            alignSelf: 'center', 
            backgroundColor: theme.bg, 
            ...(isWeb ? {
                borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border, overflow: 'hidden' 
            } : {}) 
        }}>
            
            <FlatList
              key={`grid-${numColumns}`} 
              data={filteredList}
              keyExtractor={item => item.id.toString()}
              numColumns={numColumns}
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ width: '100%', paddingBottom: 150, paddingHorizontal: HORIZONTAL_PADDING, flexGrow: 1 }}
              columnWrapperStyle={numColumns > 1 ? { gap: SPACING } : undefined} 
              showsVerticalScrollIndicator={true} 
              
              ListHeaderComponent={
                <View style={{ marginBottom: 10 }}>
                    <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: isWeb ? 20 : 60 }]}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                            </TouchableOpacity>
                            <View>
                                <Text style={[styles.headerTitle, { color: theme.text }]}>BIBLIOTECA</Text>
                                <Text style={styles.headerSubtitle}>GERENCIAMENTO</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={fetchLibrary} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="refresh" size={24} color={theme.accent} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="magnify" size={22} color={theme.textSecondary} />
                        <TextInput 
                          style={[styles.searchInput, { color: theme.text }]} 
                          placeholder="Pesquisar exercício..." 
                          placeholderTextColor={theme.textSecondary}
                          value={filterText} onChangeText={setFilterText} 
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.catSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => setCatModalVisible(true)}
                    >
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <MaterialCommunityIcons name="filter-variant" size={20} color={theme.accent} />
                            <Text style={[styles.catSelectorVal, { color: theme.text }]}>{selectedCat.toUpperCase()}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-down" size={22} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View style={{ marginBottom: 20 }}>
                        <ImageBackground 
                            source={{ uri: categoryCovers[selectedCat] || categoryCovers["TODOS"] }} 
                            style={styles.categoryCover}
                            imageStyle={{ borderRadius: 24 }}
                        >
                            <View style={styles.coverOverlay}>
                                <Text style={styles.coverTitle}>{selectedCat.toUpperCase()}</Text>
                                <View style={[styles.coverBadge, { backgroundColor: theme.accent }]}>
                                    <Text style={[styles.coverCount, { color: theme.isDark ? '#000' : '#FFF' }]}>{filteredList.length} EXERCÍCIOS</Text>
                                </View>
                            </View>
                        </ImageBackground>
                    </View>
                    
                    {loading && <ActivityIndicator color={theme.accent} style={{ marginTop: 30 }} size="large" />}
                </View>
              }
              renderItem={({ item }) => (
                  <ExerciseCard 
                      item={item} width={itemWidth} theme={theme}
                      onPress={openVideoPreview}
                      onEdit={(ex) => { setFormExercise(ex); setShowFormDropdown(false); setModalVisible(true); }}
                      onDelete={handleDelete}
                  />
              )}
              ListEmptyComponent={!loading && <Text style={styles.emptyText}>Nenhum exercício encontrado.</Text>}
            />

            <TouchableOpacity 
                style={[
                    styles.fab, 
                    { backgroundColor: theme.accent }, 
                    isWeb ? { position: 'absolute', bottom: 30, right: 30 } : {} 
                ]} 
                onPress={() => { setFormExercise({ id: null, name: '', category: 'Peito', videoUrl: '' }); setShowFormDropdown(false); setModalVisible(true); }}
            >
                <MaterialCommunityIcons name="plus" size={32} color={theme.isDark ? '#000' : '#FFF'} />
            </TouchableOpacity>

        </View>

        <Modal visible={catModalVisible} transparent animationType="fade" onRequestClose={() => setCatModalVisible(false)}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setCatModalVisible(false)}>
                <View style={[styles.catModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 20, textAlign: 'center' }]}>FILTRAR CATEGORIA</Text>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {categories.map(cat => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[styles.catOption, selectedCat === cat && { backgroundColor: theme.accent + '22' }]}
                                onPress={() => { setSelectedCat(cat); setCatModalVisible(false); }}
                            >
                                <Text style={[styles.catOptionText, { color: theme.text }, selectedCat === cat && { color: theme.accent, fontWeight: '800' }]}>{cat}</Text>
                                {selectedCat === cat && <MaterialCommunityIcons name="check-decagram" size={20} color={theme.accent} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>

        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
              <SafeAreaView style={{ flex:1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border, borderRadius: 24, marginVertical: '2.5%', overflow: 'hidden'} : {}) }}>
                  <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.modalTitle, { color: theme.text }]}>{formExercise.id ? 'EDITAR EXERCÍCIO' : 'NOVO EXERCÍCIO'}</Text>
                      <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border, padding: 8 }]}><MaterialCommunityIcons name="close" size={20} color={theme.text} /></TouchableOpacity>
                  </View>
                  
                  <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
                      <Text style={[styles.inputLabelLabel, { color: theme.textSecondary }]}>NOME DO EXERCÍCIO</Text>
                      <TextInput 
                          style={[styles.modalInputPremium, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                          value={formExercise.name} 
                          onChangeText={t => setFormExercise({...formExercise, name: t})} 
                          placeholder="Ex: Supino Reto com Halteres" 
                          placeholderTextColor={theme.textSecondary} 
                      />
                      
                      <Text style={[styles.inputLabelLabel, { color: theme.textSecondary }]}>GRUPO MUSCULAR ALVO</Text>
                      <TouchableOpacity 
                          style={[styles.catSelector, { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: showFormDropdown ? 10 : 25 }]}
                          onPress={() => setShowFormDropdown(!showFormDropdown)}
                      >
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                              <MaterialCommunityIcons name="format-list-bulleted" size={20} color={theme.textSecondary} />
                              <Text style={[styles.catSelectorVal, { color: theme.text }]}>{formExercise.category.toUpperCase()}</Text>
                          </View>
                          <MaterialCommunityIcons name={showFormDropdown ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                      </TouchableOpacity>

                      {showFormDropdown && (
                          <View style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, marginBottom: 25, padding: 10, maxHeight: 200 }}>
                              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                  {categories.filter(c => c !== 'TODOS').map(cat => (
                                      <TouchableOpacity 
                                          key={cat} 
                                          style={{ padding: 14, borderRadius: 10, backgroundColor: formExercise.category === cat ? theme.accent + '22' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                          onPress={() => { setFormExercise({...formExercise, category: cat}); setShowFormDropdown(false); }}
                                      >
                                          <Text style={{ color: formExercise.category === cat ? theme.accent : theme.text, fontWeight: formExercise.category === cat ? 'bold' : '500' }}>{cat}</Text>
                                          {formExercise.category === cat && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                      </TouchableOpacity>
                                  ))}
                              </ScrollView>
                          </View>
                      )}
                      
                      <Text style={[styles.inputLabelLabel, { color: theme.textSecondary }]}>VÍDEO DO EXERCÍCIO</Text>
                      
                      <TouchableOpacity 
                          style={[styles.uploadBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} 
                          onPress={handleUploadVideo}
                          disabled={uploadingVideo}
                      >
                          {uploadingVideo ? (
                              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                  <ActivityIndicator color={theme.accent} size="small" />
                                  <Text style={{color: theme.accent, marginLeft: 10, fontWeight: '800'}}>ENVIANDO PARA A NUVEM...</Text>
                              </View>
                          ) : (
                              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                  <MaterialCommunityIcons name="cloud-upload" size={24} color={theme.accent} />
                                  <Text style={{color: theme.accent, marginLeft: 10, fontWeight: '800'}}>FAZER UPLOAD DE VÍDEO</Text>
                              </View>
                          )}
                      </TouchableOpacity>

                      <Text style={[styles.inputLabelLabel, { color: theme.textSecondary, marginTop: 15 }]}>OU COLE O LINK DO VÍDEO (URL)</Text>
                      <TextInput 
                          style={[styles.modalInputPremium, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                          value={formExercise.videoUrl} 
                          onChangeText={t => setFormExercise({...formExercise, videoUrl: t})} 
                          placeholder="https://..." 
                          placeholderTextColor={theme.textSecondary} 
                          autoCapitalize="none" 
                      />
                      
                      <TouchableOpacity style={[styles.btnPremium, { backgroundColor: theme.accent }]} onPress={handleSaveOrUpdate} disabled={saving || uploadingVideo}>
                          {saving ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <Text style={[styles.btnTextPremium, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR NA BIBLIOTECA</Text>}
                      </TouchableOpacity>
                  </ScrollView>
              </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>

        {/* MODAL DE VÍDEO CORRIGIDO E DEFINITIVO */}
        <Modal visible={videoModalVisible} animationType="fade" transparent onRequestClose={() => { setVideoModalVisible(false); setCurrentVideoUrl(''); }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                {/* CAIXA DO MODAL (Fixa: 400x700 no PC, 90%x70% no Celular) */}
                <View style={{ width: isWeb ? 400 : '90%', height: isWeb ? 700 : '70%', backgroundColor: '#000', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#333', elevation: 20 }}>
                    
                    <TouchableOpacity onPress={() => { setVideoModalVisible(false); setCurrentVideoUrl(''); }} style={{ position: 'absolute', top: 12, right: 12, zIndex: 100, backgroundColor: 'rgba(255,59,48,0.9)', borderRadius: 15, padding: 4 }}>
                        <MaterialCommunityIcons name="close" size={18} color="#FFF" />
                    </TouchableOpacity>
                    
                    {/* CONTAINER DO VÍDEO SEM O ABSOLUTE QUE CAUSAVA O BUG */}
                    <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#000' }}>
                        {videoModalVisible && currentVideoUrl ? (
                            <Video 
                                ref={videoRef} 
                                style={{ flex: 1, width: '100%', height: '100%' }} // Flex 1 obriga a respeitar a caixa
                                source={{ uri: currentVideoUrl }} 
                                resizeMode={ResizeMode.CONTAIN} // CONTAIN garante que não corta
                                shouldPlay={true} 
                                isLooping={true} 
                                isMuted={true}
                                onLoad={() => videoRef.current?.playAsync()} // Força o play no PC
                            />
                        ) : null}
                        
                        <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
                            <TouchableOpacity onPress={() => videoRef.current?.presentFullscreenPlayer()} style={{ backgroundColor: theme.accent, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 5 }}>
                                <MaterialCommunityIcons name="fullscreen" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                                <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13 }}>TELA CHEIA</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </View>
        </Modal>

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#888', fontSize: 11, letterSpacing: 1, fontWeight: 'bold' },
  backBtn: { padding: 12, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, height: 55, borderRadius: 30, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500', outlineStyle: 'none' },
  catSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  catSelectorVal: { fontSize: 15, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  catModalContent: { width: '100%', maxWidth: 360, borderRadius: 24, padding: 20, borderWidth: 1, maxHeight: '80%' },
  catOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12 },
  catOptionText: { fontSize: 16, fontWeight: '600' },
  categoryCover: { height: 160, width: '100%', justifyContent: 'flex-end', overflow: 'hidden', elevation: 4 },
  coverOverlay: { backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, height: '100%', justifyContent: 'flex-end', borderRadius: 24 },
  coverTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  coverBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  coverCount: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  exerciseCard: { borderRadius: 20, padding: 18, marginBottom: 15, borderWidth: 1, elevation: 2 },
  cardInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  exerciseName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  catTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  exerciseSub: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  videoPlayBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, borderTopWidth: 1, paddingTop: 15, gap: 15 },
  actionBtn: { padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', width: 65, height: 65, borderRadius: 33, justifyContent: 'center', alignItems: 'center', elevation: 8, zIndex: 999 },
  emptyText: { color:'#888', textAlign:'center', marginTop:50, fontStyle:'italic' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, alignItems: 'center', paddingTop: Platform.OS === 'android' ? 20 : 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  inputLabelLabel: { fontSize: 11, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  modalInputPremium: { borderRadius: 16, padding: 18, fontSize: 15, fontWeight: '500', borderWidth: 1, marginBottom: 25, outlineStyle: 'none' },
  uploadBtn: { padding: 18, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnPremium: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 3 },
  btnTextPremium: { fontWeight: '900', fontSize: 15, letterSpacing: 0.5 }
});