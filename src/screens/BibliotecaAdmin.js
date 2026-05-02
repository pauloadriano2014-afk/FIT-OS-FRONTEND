// src/screens/BibliotecaAdmin.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, 
    Modal, Image, ActivityIndicator, Alert, KeyboardAvoidingView, 
    Platform, ScrollView, useWindowDimensions, StatusBar, ImageBackground 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

import { useTheme } from '../contexts/ThemeContext';
import VideoPreviewModal from '../components/VideoPreviewModal';
import SmartThumbnail from '../components/MontarTreino/SmartThumbnail';

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

const subCategoriesMap = {
    "Peito": ["Todos", "Superior", "Medial", "Inferior"],
    "Costas": ["Todos", "Puxadas", "Remadas", "Lombar"],
    "Pernas": ["Todos", "Multiarticular", "Quadríceps e Adutores", "Posteriores", "Glúteos", "Panturrilha"],
    "Ombros": ["Todos", "Multiarticular", "Frontal", "Lateral", "Posterior", "Trapézio"],
    "Abdômen": ["Todos", "Supra", "Infra", "Core", "Completo"]
};

const ExerciseCard = React.memo(({ item, onPress, onEdit, onDelete, width, theme }) => {
    let displayCat = item.category.toUpperCase();
    if (item.subCategory && item.subCategory !== 'Geral') {
        displayCat += ` • ${item.subCategory.toUpperCase()}`;
    }

    const envTags = item.environments || ['ACADEMIA'];

    return (
        <TouchableOpacity 
            style={[styles.mfitCard, { width: width, backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? '#000' : '#CCC' }]}
            onPress={() => onPress(item.videoUrl)}
            activeOpacity={0.7}
        >
            <View style={[styles.mfitThumbBox, { borderColor: theme.border, backgroundColor: theme.bg, position: 'relative', overflow: 'hidden' }]}>
                
                <SmartThumbnail 
                    url={item.videoUrl} 
                    style={StyleSheet.absoluteFillObject} 
                    theme={theme} 
                />

                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                    <MaterialCommunityIcons name="play-circle-outline" size={24} color="#FFF" />
                </View>
            </View>

            <View style={styles.mfitInfo}>
                <Text style={[styles.mfitTitle, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.mfitCategory, { color: theme.textSecondary }]}>{displayCat}</Text>
                
                <View style={styles.tagsContainer}>
                    {envTags.map(env => (
                        <View key={env} style={[styles.envBadge, { backgroundColor: theme.isDark ? '#2A2A2A' : '#EFEFEF' }]}>
                            <Text style={[styles.envBadgeText, { color: theme.textSecondary }]}>{env}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.mfitActionGroup}>
                <TouchableOpacity onPress={() => onEdit(item)} style={styles.mfitActionBtn}>
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.mfitActionBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}, (prev, next) => {
    return prev.item.id === next.item.id && 
           prev.width === next.width &&
           prev.theme === next.theme &&
           JSON.stringify(prev.item.environments) === JSON.stringify(next.item.environments);
});

export default function BibliotecaAdmin({ navigation }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme(); 
  
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  const [selectedCat, setSelectedCat] = useState('TODOS');
  const [selectedSubCat, setSelectedSubCat] = useState('Todos'); 
  
  const [modalVisible, setModalVisible] = useState(false); 
  const [catModalVisible, setCatModalVisible] = useState(false); 
  const [showFormDropdown, setShowFormDropdown] = useState(false);
  const [showFormSubDropdown, setShowFormSubDropdown] = useState(false); 
  const [videoModalVisible, setVideoModalVisible] = useState(false); 
  
  const [showSubCatDropdown, setShowSubCatDropdown] = useState(false);

  const [formExercise, setFormExercise] = useState({ 
      id: null, 
      name: '', 
      category: 'Peito', 
      subCategory: 'Geral',
      videoUrl: '',
      environments: ['ACADEMIA'] 
  });
  
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false); 
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  useEffect(() => {
      if (Platform.OS === 'web') {
          const style = document.createElement('style');
          style.id = 'hidden-scrollbar';
          style.innerHTML = `
              ::-webkit-scrollbar {
                  width: 0px;
                  background: transparent;
              }
              * {
                  scrollbar-width: none; /* Firefox */
              }
          `;
          document.head.appendChild(style);
          
          return () => {
              const el = document.getElementById('hidden-scrollbar');
              if (el) el.remove();
          };
      }
  }, []);

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
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) return;
      const adminId = JSON.parse(userJson).id;

      const cachedExercises = await AsyncStorage.getItem('@global_exercises');
      if (cachedExercises) {
          const parsed = JSON.parse(cachedExercises);
          setExercises([...parsed].reverse());
          setLoading(false); 
      } else {
          setLoading(true);
      }

      const res = await fetch(`https://fitos-final.onrender.com/api/exercise?adminId=${adminId}&t=${Date.now()}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
          const reversed = [...data].reverse();
          setExercises(reversed);
          await AsyncStorage.setItem('@global_exercises', JSON.stringify(data));
      }
    } catch (error) { 
        console.log("Erro ao buscar biblioteca:", error); 
    } finally { 
        setLoading(false); 
    }
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
              setExercises(prev => {
                  const filtered = prev.filter(item => item.id !== id);
                  AsyncStorage.setItem('@global_exercises', JSON.stringify([...filtered].reverse()));
                  return filtered;
              });
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
          
          setUploadingVideo(true);
          const formData = new FormData();

          if (Platform.OS === 'web') {
              const res = await fetch(fileToUpload.uri);
              const blob = await res.blob();
              formData.append('file', blob, fileToUpload.name);
          } else {
              formData.append('file', {
                  uri: fileToUpload.uri,
                  name: fileToUpload.name || 'video.mp4',
                  type: fileToUpload.mimeType || 'video/mp4'
              });
          }
          
          const response = await fetch('https://fitos-final.onrender.com/api/upload', {
              method: 'POST',
              body: formData,
              headers: { 'Accept': 'application/json' }
          });

          const data = await response.json();
          
          if (response.ok && data.videoUrl) {
              setFormExercise({ ...formExercise, videoUrl: data.videoUrl });
              const msg = "Vídeo enviado para a Cloudflare! Pode salvar o exercício.";
              if(isWeb) window.alert(msg);
              else Alert.alert("Sucesso", msg);
          } else {
              throw new Error(data.error || 'Erro no envio do vídeo.');
          }

      } catch (error) {
          console.error("Erro Upload:", error);
          const errMsg = "Falha ao subir vídeo: " + error.message;
          if(isWeb) window.alert(errMsg);
          else Alert.alert("Erro de Upload", errMsg);
      } finally {
          setUploadingVideo(false);
      }
  };

  // 🔥 O SEGREDO DO SUCESSO: ATUALIZAÇÃO OTIMISTA 🔥
  const handleSaveOrUpdate = async () => {
      if (!formExercise.name) return Alert.alert("Campos Incompletos", "O nome do exercício é obrigatório.");
      if (formExercise.environments.length === 0) return Alert.alert("Atenção", "Selecione pelo menos um ambiente de treino (Academia, Condomínio ou Casa).");

      setSaving(true);
      try {
          const userJson = await AsyncStorage.getItem('user');
          if (!userJson) return;
          const adminId = JSON.parse(userJson).id;

          const payload = { ...formExercise, adminId: adminId };
          const isEditing = !!formExercise.id;

          const res = await fetch('https://fitos-final.onrender.com/api/exercise', {
              method: isEditing ? 'PUT' : 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              const savedExerciseFromServer = await res.json(); // Pega a resposta fresca com o ID gerado (se for novo)
              
              // ⚡️ INJETA NA TELA NA HORA ⚡️
              setExercises(prev => {
                  let newList;
                  if (isEditing) {
                      newList = prev.map(ex => ex.id === savedExerciseFromServer.id ? savedExerciseFromServer : ex);
                  } else {
                      newList = [savedExerciseFromServer, ...prev]; // Joga pro topo da lista
                  }
                  
                  // ⚡️ ATUALIZA O CACHE NA HORA PRA NÃO DAR "FLICKER" DE TELA ⚡️
                  AsyncStorage.setItem('@global_exercises', JSON.stringify([...newList].reverse()));
                  return newList;
              });

              setModalVisible(false);
              
              // Deixa o fetch rodando no fundo de forma invisível só pra garantir
              fetchLibrary(); 
              
              if(isWeb) window.alert("Exercício salvo com sucesso!");
              else Alert.alert("Sucesso", "Exercício salvo com sucesso!");
          } else { 
              const errorData = await res.json();
              if(isWeb) window.alert(errorData.error || "Erro ao salvar.");
              else Alert.alert("Atenção", errorData.error || "Erro ao salvar."); 
          }
      } catch (e) { 
          if(isWeb) window.alert(e.message);
          else Alert.alert("Erro de Conexão", e.message); 
      } finally { setSaving(false); }
  };

  const openVideoPreview = useCallback((url) => {
      if (!url || url.length < 5) return Alert.alert("Vídeo Indisponível", "Este exercício não possui vídeo.");
      setCurrentVideoUrl(url);
      setVideoModalVisible(true);
  }, []);

  const filteredList = useMemo(() => {
      return exercises.filter(e => {
          const matchText = e.name.toLowerCase().includes(filterText.toLowerCase());
          const matchCat = selectedCat === 'TODOS' || e.category === selectedCat;
          const matchSubCat = (selectedCat === 'TODOS') || 
                              (selectedSubCat === 'Todos') || 
                              (e.subCategory === selectedSubCat);
                              
          return matchText && matchCat && matchSubCat;
      });
  }, [exercises, filterText, selectedCat, selectedSubCat]);

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
                    <Image source={require('../../assets/logo.png')} style={{ width: '85%', height: '60%', resizeMode: 'contain' }} />
                </View>
                <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: lateralSpace, justifyContent: 'center', alignItems: 'center' }}>
                    <Image source={require('../../assets/logo.png')} style={{ width: '85%', height: '60%', resizeMode: 'contain' }} />
                </View>
            </View>
        )}

        <View style={{ 
            flex: 1, width: '100%', 
            alignSelf: 'center', backgroundColor: isWeb ? 'transparent' : theme.bg
        }}>
            
            <FlatList
              key={`grid-${numColumns}`} 
              data={filteredList}
              keyExtractor={item => String(item.id)}
              numColumns={numColumns}
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ width: '100%', maxWidth: containerWidth, alignSelf: 'center', backgroundColor: theme.bg, paddingBottom: 30, paddingHorizontal: HORIZONTAL_PADDING, flexGrow: 1, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border, overflow: 'hidden' } : {}) }}
              columnWrapperStyle={numColumns > 1 ? { gap: SPACING } : undefined} 
              showsVerticalScrollIndicator={false}
              
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews={Platform.OS !== 'web'}
              
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
                        style={[styles.catSelector, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: (selectedCat !== 'TODOS' && subCategoriesMap[selectedCat]) ? 10 : 20 }]}
                        onPress={() => setCatModalVisible(true)}
                    >
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <MaterialCommunityIcons name="filter-variant" size={20} color={theme.accent} />
                            <Text style={[styles.catSelectorVal, { color: theme.text }]}>{selectedCat.toUpperCase()}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-down" size={22} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {selectedCat !== 'TODOS' && subCategoriesMap[selectedCat] && (
                        <View style={{ marginBottom: 20 }}>
                            <TouchableOpacity 
                                style={[
                                    styles.catSelector, 
                                    { 
                                        backgroundColor: theme.surface, 
                                        borderColor: theme.border, 
                                        paddingVertical: 12,
                                        borderRadius: showSubCatDropdown ? 16 : 16,
                                        borderBottomWidth: showSubCatDropdown ? 0 : 1,
                                        borderBottomLeftRadius: showSubCatDropdown ? 0 : 16,
                                        borderBottomRightRadius: showSubCatDropdown ? 0 : 16
                                    }
                                ]}
                                onPress={() => setShowSubCatDropdown(!showSubCatDropdown)}
                            >
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                    <MaterialCommunityIcons name="filter-variant" size={18} color={theme.accent} />
                                    <Text style={[styles.catSelectorVal, { color: theme.text, fontSize: 13 }]}>
                                        {selectedSubCat === 'Todos' ? 'TODAS AS SUBCATEGORIAS' : selectedSubCat.toUpperCase()}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name={showSubCatDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                            </TouchableOpacity>

                            {showSubCatDropdown && (
                                <View style={{ 
                                    backgroundColor: theme.surface, borderWidth: 1, borderTopWidth: 0, 
                                    borderColor: theme.border, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, 
                                    padding: 8 
                                }}>
                                    {subCategoriesMap[selectedCat].map(sub => {
                                        const isSelected = selectedSubCat === sub;
                                        return (
                                            <TouchableOpacity 
                                                key={sub}
                                                style={{ 
                                                    padding: 12, borderRadius: 8, 
                                                    backgroundColor: isSelected ? theme.accent + '22' : 'transparent', 
                                                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
                                                }}
                                                onPress={() => { 
                                                    setSelectedSubCat(sub); 
                                                    setShowSubCatDropdown(false); 
                                                }}
                                            >
                                                <Text style={{ color: isSelected ? theme.accent : theme.text, fontWeight: isSelected ? 'bold' : '500', fontSize: 13 }}>
                                                    {sub}
                                                </Text>
                                                {isSelected && <MaterialCommunityIcons name="check" size={16} color={theme.accent} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    )}

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
                      onEdit={(ex) => { 
                          setFormExercise({
                              ...ex, 
                              subCategory: ex.subCategory || 'Geral',
                              environments: ex.environments || ['ACADEMIA'] 
                          }); 
                          setShowFormDropdown(false); 
                          setShowFormSubDropdown(false);
                          setModalVisible(true); 
                      }}
                      onDelete={handleDelete}
                  />
              )}
              ListEmptyComponent={!loading && <Text style={styles.emptyText}>Nenhum exercício encontrado.</Text>}
            />

            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={[styles.footerBar, { width: '100%', maxWidth: containerWidth, backgroundColor: theme.bg, borderTopColor: theme.border, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1 } : {}) }]}>
                    <TouchableOpacity 
                        style={[styles.btnPremium, { backgroundColor: theme.accent, marginTop: 0, width: '100%' }]} 
                        onPress={() => { 
                            setFormExercise({ id: null, name: '', category: 'Peito', subCategory: 'Geral', videoUrl: '', environments: ['ACADEMIA'] }); 
                            setShowFormDropdown(false); 
                            setShowFormSubDropdown(false); 
                            setModalVisible(true); 
                        }}
                    >
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10}}>
                            <MaterialCommunityIcons name="plus-circle" size={22} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.btnTextPremium, { color: theme.isDark ? '#000' : '#FFF' }]}>ADICIONAR EXERCÍCIO</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

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
                                onPress={() => { setSelectedCat(cat); setSelectedSubCat('Todos'); setCatModalVisible(false); }}
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
                                          onPress={() => { 
                                              const hasSubs = subCategoriesMap[cat] && subCategoriesMap[cat].length > 1;
                                              setFormExercise({...formExercise, category: cat, subCategory: hasSubs ? 'Geral' : 'Geral'}); 
                                              setShowFormDropdown(false); 
                                          }}
                                      >
                                          <Text style={{ color: formExercise.category === cat ? theme.accent : theme.text, fontWeight: formExercise.category === cat ? 'bold' : '500' }}>{cat}</Text>
                                          {formExercise.category === cat && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                      </TouchableOpacity>
                                  ))}
                              </ScrollView>
                          </View>
                      )}

                      {subCategoriesMap[formExercise.category] && (
                          <>
                              <Text style={[styles.inputLabelLabel, { color: theme.textSecondary }]}>SUBCATEGORIA (MÁQUINA/MOVIMENTO)</Text>
                              <TouchableOpacity 
                                  style={[styles.catSelector, { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: showFormSubDropdown ? 10 : 25 }]}
                                  onPress={() => setShowFormSubDropdown(!showFormSubDropdown)}
                              >
                                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                      <MaterialCommunityIcons name="tag-outline" size={20} color={theme.textSecondary} />
                                      <Text style={[styles.catSelectorVal, { color: theme.text }]}>{(formExercise.subCategory || 'Geral').toUpperCase()}</Text>
                                  </View>
                                  <MaterialCommunityIcons name={showFormSubDropdown ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                              </TouchableOpacity>

                              {showFormSubDropdown && (
                                  <View style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, marginBottom: 25, padding: 10 }}>
                                      {subCategoriesMap[formExercise.category].filter(c => c !== 'Todos').map(sub => (
                                          <TouchableOpacity 
                                              key={sub} 
                                              style={{ padding: 14, borderRadius: 10, backgroundColor: formExercise.subCategory === sub ? theme.accent + '22' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                              onPress={() => { setFormExercise({...formExercise, subCategory: sub}); setShowFormSubDropdown(false); }}
                                          >
                                              <Text style={{ color: formExercise.subCategory === sub ? theme.accent : theme.text, fontWeight: formExercise.subCategory === sub ? 'bold' : '500' }}>{sub}</Text>
                                              {formExercise.subCategory === sub && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                          </TouchableOpacity>
                                      ))}
                                      <TouchableOpacity 
                                          style={{ padding: 14, borderRadius: 10, backgroundColor: formExercise.subCategory === 'Geral' ? theme.accent + '22' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                          onPress={() => { setFormExercise({...formExercise, subCategory: 'Geral'}); setShowFormSubDropdown(false); }}
                                      >
                                          <Text style={{ color: formExercise.subCategory === 'Geral' ? theme.accent : theme.text, fontWeight: formExercise.subCategory === 'Geral' ? 'bold' : '500' }}>Geral</Text>
                                          {formExercise.subCategory === 'Geral' && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                      </TouchableOpacity>
                                  </View>
                              )}
                          </>
                      )}

                      <Text style={[styles.inputLabelLabel, { color: theme.textSecondary }]}>AMBIENTE DE TREINO (ONDE PODE SER FEITO?)</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 }}>
                          {['ACADEMIA', 'CONDOMÍNIO', 'CASA'].map(env => {
                              const isSelected = formExercise.environments.includes(env);
                              return (
                                  <TouchableOpacity
                                      key={env}
                                      style={[
                                          styles.envChip,
                                          { borderColor: theme.border, backgroundColor: theme.bg },
                                          isSelected && { backgroundColor: theme.accent + '20', borderColor: theme.accent }
                                      ]}
                                      onPress={() => {
                                          let newEnvs = [...formExercise.environments];
                                          if (isSelected) {
                                              newEnvs = newEnvs.filter(e => e !== env);
                                          } else {
                                              newEnvs.push(env);
                                          }
                                          setFormExercise({ ...formExercise, environments: newEnvs });
                                      }}
                                  >
                                      <MaterialCommunityIcons
                                          name={env === 'CASA' ? 'home-outline' : env === 'CONDOMÍNIO' ? 'office-building' : 'dumbbell'}
                                          size={14}
                                          color={isSelected ? theme.accent : theme.textSecondary}
                                      />
                                      <Text style={{ color: isSelected ? theme.accent : theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>
                                          {env}
                                      </Text>
                                  </TouchableOpacity>
                              );
                          })}
                      </View>
                      
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

        <VideoPreviewModal 
            visible={videoModalVisible} 
            videoUrl={currentVideoUrl} 
            onClose={() => { setVideoModalVisible(false); setCurrentVideoUrl(''); }} 
            theme={theme} 
        />

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#888', fontSize: 11, letterSpacing: 1, fontWeight: 'bold' },
  backBtn: { padding: 12, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, height: 55, borderRadius: 30, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500', outlineStyle: 'none' },
  
  catSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 16, borderWidth: 1 },
  catSelectorVal: { fontSize: 15, fontWeight: '800' },

  categoryCover: { height: 160, width: '100%', justifyContent: 'flex-end', overflow: 'hidden', elevation: 4 },
  coverOverlay: { backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, height: '100%', justifyContent: 'flex-end', borderRadius: 24 },
  coverTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  coverBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  coverCount: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  
  mfitCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 12, elevation: 2 },
  mfitThumbBox: { width: 65, height: 65, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 15 },
  mfitInfo: { flex: 1, justifyContent: 'center' },
  mfitTitle: { fontSize: 14, fontWeight: '900', flexWrap: 'wrap' },
  mfitCategory: { fontSize: 10, marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' },
  
  tagsContainer: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  envBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  envBadgeText: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  envChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },

  mfitActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 10 },
  mfitActionBtn: { padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  footerBar: { padding: 15, borderTopWidth: 1 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  catModalContent: { width: '100%', maxWidth: 360, borderRadius: 24, padding: 20, borderWidth: 1, maxHeight: '80%' },
  catOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12 },
  catOptionText: { fontSize: 16, fontWeight: '600' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, alignItems: 'center', paddingTop: Platform.OS === 'android' ? 20 : 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  inputLabelLabel: { fontSize: 11, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  
  modalInputPremium: { borderRadius: 16, padding: 18, fontSize: 16, fontWeight: '500', borderWidth: 1, marginBottom: 25, outlineStyle: 'none' },
  
  uploadBtn: { padding: 18, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnPremium: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 3 },
  btnTextPremium: { fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 14, color: '#888' }
});