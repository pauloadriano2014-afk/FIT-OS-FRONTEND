import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  TextInput, Modal, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context'; // Importando do pacote correto

// --- CONFIG ---
const SPACING = 10; 
const HORIZONTAL_PADDING = 15; 

const categories = ['TODOS', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Mobilidade', 'Cardio'];

// --- HELPERS ---
const isYoutubeUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};
const getCloudflareThumb = (url) => {
    if (url && url.includes('cloudflarestream.com')) {
        const videoId = url.split('cloudflarestream.com/')[1].split('/')[0];
        return `https://customer-2q2ev93325619920.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
    }
    return null;
};

// --- CARD COMPONENT ---
const ExerciseCard = React.memo(({ item, onPress, onEdit, onDelete, width }) => {
    const isYT = isYoutubeUrl(item.videoUrl);
    const ytId = isYT ? getYoutubeId(item.videoUrl) : null;
    const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : getCloudflareThumb(item.videoUrl);

    return (
        <TouchableOpacity 
            style={[styles.gridCard, { width: width }]} 
            onPress={() => onPress(item.videoUrl)}
            activeOpacity={0.9}
        >
            <View style={[styles.thumbnailBox, { height: width * 0.7 }]}> 
                {item.videoUrl && thumbUrl ? (
                    <>
                        <Image source={{ uri: thumbUrl }} style={styles.thumbContent} resizeMode="cover" />
                        <View style={styles.playOverlay}>
                            <MaterialCommunityIcons name="play-circle" size={32} color="rgba(255, 255, 255, 0.9)" />
                        </View>
                    </>
                ) : (
                    <View style={styles.placeholderBox}>
                        <MaterialCommunityIcons name="video-outline" size={28} color="#555" />
                        <Text style={styles.placeholderText}>SEM CAPA</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View style={{flex: 1, marginRight: 5}}>
                    <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.gridCat}>{item.category}</Text>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
                        <MaterialCommunityIcons name="pencil" size={16} color="#CCFF00" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.actionBtn, { borderColor: '#FF3B30' }]}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}, (prev, next) => prev.item.id === next.item.id && prev.item.videoUrl === next.item.videoUrl && prev.width === next.width);

export default function BibliotecaAdmin({ navigation }) {
  const { width } = useWindowDimensions();
  
  // Responsividade
  const getNumColumns = () => {
      if (width > 1200) return 5; 
      if (width > 900) return 4;  
      if (width > 600) return 3;  
      return 2; 
  };
  
  const numColumns = getNumColumns();
  const itemWidth = (width - (HORIZONTAL_PADDING * 2) - (SPACING * (numColumns - 1))) / numColumns;

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedCat, setSelectedCat] = useState('TODOS');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [formExercise, setFormExercise] = useState({ id: null, name: '', category: 'Peito', videoUrl: '' });
  const [saving, setSaving] = useState(false);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => { fetchLibrary(); }, []);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
        const res = await fetch('https://fitos-final.onrender.com/api/admin/data?t=' + Date.now());
        const data = await res.json();
        if (data.exercises) setExercises(data.exercises.reverse()); 
    } catch (error) { console.log(error); } 
    finally { setLoading(false); }
  };

  const handleDelete = useCallback((id) => {
      if(Platform.OS === 'web') {
          if(confirm("Deseja realmente apagar este exercício?")) deleteItem(id);
      } else {
          Alert.alert("Excluir", "Tem certeza?", [
              { text: "Cancelar" },
              { text: "Sim, apagar", style: 'destructive', onPress: () => deleteItem(id) }
          ]);
      }
  }, []);

  const deleteItem = async (id) => {
      try {
          await fetch(`https://fitos-final.onrender.com/api/exercise?id=${id}`, { method: 'DELETE' });
          fetchLibrary();
      } catch (e) { Alert.alert("Erro ao excluir"); }
  };

  const openCreateModal = () => {
      setFormExercise({ id: null, name: '', category: 'Peito', videoUrl: '' });
      setModalVisible(true);
  };

  const openEditModal = useCallback((item) => {
      setFormExercise({ id: item.id, name: item.name, category: item.category, videoUrl: item.videoUrl || '' });
      setModalVisible(true);
  }, []);

  const handleSaveOrUpdate = async () => {
      if (!formExercise.name) return Alert.alert("Erro", "Nome obrigatório");
      setSaving(true);
      
      const isEditing = !!formExercise.id;
      const url = 'https://fitos-final.onrender.com/api/exercise';
      const method = isEditing ? 'PUT' : 'POST';

      try {
          const res = await fetch(url, {
              method: method,
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(formExercise)
          });

          if (res.ok) {
              setModalVisible(false);
              fetchLibrary();
              Alert.alert("Sucesso", isEditing ? "Atualizado!" : "Criado!");
          } else { throw new Error("Erro"); }
      } catch (e) { Alert.alert("Erro", e.message); } 
      finally { setSaving(false); }
  };

  const openVideoPreview = useCallback((url) => {
      if (!url) return Alert.alert("Ops", "Sem vídeo.");
      setCurrentVideo(url);
      setVideoModalVisible(true);
  }, []);

  const filteredList = exercises.filter(e => {
      const matchText = e.name.toLowerCase().includes(filterText.toLowerCase());
      const matchCat = selectedCat === 'TODOS' || e.category === selectedCat;
      return matchText && matchCat;
  });

  // --- COMPONENTE ROOT DINÂMICO ---
  // Na web usamos View 100vh. No mobile usamos SafeAreaView flex:1.
  const RootComponent = Platform.OS === 'web' ? View : SafeAreaView;
  const rootStyle = Platform.OS === 'web' ? { height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#000' } : { flex: 1, backgroundColor: '#000' };

  return (
    <RootComponent style={rootStyle}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BIBLIOTECA</Text>
          <TouchableOpacity onPress={fetchLibrary}>
              <MaterialCommunityIcons name="refresh" size={24} color="#CCFF00" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput 
              style={styles.searchInput} placeholder="Buscar..." placeholderTextColor="#666"
              value={filterText} onChangeText={setFilterText} 
            />
        </View>

        <View style={{height: 50, borderBottomWidth:1, borderBottomColor:'#222', marginBottom: 10}}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 15}}>
                {categories.map(cat => (
                    <TouchableOpacity 
                        key={cat} 
                        style={[styles.tabItem, selectedCat === cat && styles.tabItemActive]}
                        onPress={() => setSelectedCat(cat)}
                    >
                        <Text style={[styles.tabText, selectedCat === cat && styles.tabTextActive]}>{cat.toUpperCase()}</Text>
                        {selectedCat === cat && <View style={styles.activeLine} />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* LISTA PRINCIPAL - FLEX 1 É O SEGREDO DO SCROLL */}
        <View style={{ flex: 1 }}>
            {loading ? <ActivityIndicator color="#CCFF00" style={{marginTop:50}} /> : (
                <FlatList
                  key={`grid-${numColumns}`} 
                  data={filteredList}
                  keyExtractor={item => item.id}
                  numColumns={numColumns}
                  columnWrapperStyle={{gap: SPACING}} 
                  contentContainerStyle={{paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 150, flexGrow: 1}}
                  renderItem={({ item }) => (
                      <ExerciseCard 
                          item={item} width={itemWidth} 
                          onPress={openVideoPreview}
                          onEdit={openEditModal}
                          onDelete={handleDelete}
                      />
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>Nada encontrado.</Text>}
                />
            )}
        </View>

        <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
            <MaterialCommunityIcons name="plus" size={30} color="#000" />
        </TouchableOpacity>

        {/* MODAL CRIAR/EDITAR */}
        <Modal visible={modalVisible} animationType="slide">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
                <SafeAreaView style={{flex:1}}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{formExercise.id ? 'EDITAR' : 'NOVO'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{padding: 20}}>
                        <Text style={styles.label}>NOME</Text>
                        <TextInput style={styles.input} placeholder="Ex: Supino" placeholderTextColor="#555" value={formExercise.name} onChangeText={t => setFormExercise({...formExercise, name: t})} />
                        
                        <Text style={styles.label}>CATEGORIA</Text>
                        <View style={{flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:20}}>
                            {categories.filter(c=>c!=='TODOS').map(cat => (
                                <TouchableOpacity key={cat} style={[styles.catChip, formExercise.category === cat && styles.catChipActive]} onPress={() => setFormExercise({...formExercise, category: cat})}>
                                    <Text style={[styles.catText, formExercise.category === cat && {color:'#000'}]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <Text style={styles.label}>LINK VÍDEO</Text>
                        <TextInput style={styles.input} placeholder="Link..." placeholderTextColor="#555" value={formExercise.videoUrl} onChangeText={t => setFormExercise({...formExercise, videoUrl: t})} autoCapitalize="none" />
                        
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveOrUpdate} disabled={saving}>
                            {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>SALVAR</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>

        {/* 🔥 MODAL VÍDEO (CORRIGIDO: CONTAIN + CENTRALIZADO) */}
        <Modal visible={videoModalVisible} animationType="fade" transparent>
          <View style={styles.videoOverlay}>
              <TouchableOpacity style={styles.backdropClose} onPress={() => { setVideoModalVisible(false); setCurrentVideo(null); }} />
              
              <View style={styles.videoContent}>
                  <TouchableOpacity style={styles.closeVideoBtn} onPress={() => { setVideoModalVisible(false); setCurrentVideo(null); }}>
                      <MaterialCommunityIcons name="close" size={26} color="#FFF" />
                  </TouchableOpacity>
                  
                  {currentVideo && (
                      <Video
                          ref={videoRef}
                          style={styles.videoPlayer}
                          source={{ uri: currentVideo }}
                          useNativeControls={true}
                          // 🔥 ISSO GARANTE QUE O VÍDEO APAREÇA INTEIRO (SEM CORTES)
                          resizeMode={ResizeMode.CONTAIN} 
                          isLooping
                          shouldPlay
                      />
                  )}
              </View>
          </View>
        </Modal>

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  header: { padding: 20, paddingTop: Platform.OS === 'web' ? 20 : 10, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  headerTitle: { color:'#FFF', fontWeight:'900', fontSize:16, letterSpacing:1 },
  
  searchContainer: { flexDirection:'row', backgroundColor:'#161616', marginHorizontal:15, marginBottom:10, padding:12, borderRadius:12, alignItems:'center', borderWidth:1, borderColor:'#222' },
  searchInput: { color:'#FFF', marginLeft:10, flex:1, fontWeight:'bold', outlineStyle: 'none' }, 

  tabItem: { paddingHorizontal: 15, justifyContent:'center', height: '100%', marginRight: 5 },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  tabTextActive: { color: '#FFF' },
  activeLine: { position: 'absolute', bottom: 0, left: 15, right: 15, height: 3, backgroundColor: '#CCFF00', borderRadius: 2 },

  gridCard: { backgroundColor: '#161616', borderRadius: 12, overflow: 'hidden', borderWidth:1, borderColor:'#222' },
  thumbnailBox: { width: '100%', backgroundColor: '#111', justifyContent:'center', alignItems:'center', position:'relative' },
  thumbContent: { width: '100%', height: '100%', opacity: 0.8 },
  placeholderBox: { flex:1, justifyContent:'center', alignItems:'center', gap:5 },
  placeholderText: { color:'#444', fontSize:9, fontWeight:'bold' },
  playOverlay: { position: 'absolute', bottom:10, right:10 },

  cardFooter: { padding: 10, paddingVertical: 12, flexDirection: 'row', justifyContent:'space-between', alignItems:'flex-end' },
  gridName: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 4, lineHeight: 16 },
  gridCat: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row', gap: 5 },
  actionBtn: { padding: 6, backgroundColor:'#222', borderRadius: 6, borderWidth:1, borderColor:'#333' },

  emptyText: { color:'#666', textAlign:'center', marginTop:50, fontStyle:'italic' },
  fab: { position:'absolute', bottom:30, right:20, width:60, height:60, borderRadius:30, backgroundColor:'#CCFF00', justifyContent:'center', alignItems:'center', elevation:10, cursor: 'pointer', zIndex: 999 },

  // 🔥 MODAL VÍDEO CENTRALIZADO
  videoOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.9)', justifyContent:'center', alignItems: 'center' },
  backdropClose: { position:'absolute', top:0, left:0, right:0, bottom:0 }, 
  videoContent: { 
      width: '100%', 
      height: '100%', 
      justifyContent:'center', 
      alignItems:'center',
  },
  videoPlayer: { width: '100%', height: '100%' }, // Flexível dentro do container
  closeVideoBtn: { 
      position: 'absolute', 
      top: 20, 
      right: 20, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      borderRadius: 20, 
      padding: 10,
      zIndex: 1000
  },

  catChip: { paddingHorizontal:14, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:'#333', backgroundColor:'#111', justifyContent:'center', height:32 },
  catChipActive: { backgroundColor:'#CCFF00', borderColor:'#CCFF00' },
  catText: { color:'#888', fontWeight:'bold', fontSize:10 },
  modalContainer: { flex:1, backgroundColor:'#000' },
  modalHeader: { padding:20, flexDirection:'row', justifyContent:'space-between', borderBottomWidth:1, borderBottomColor:'#222' },
  modalTitle: { color:'#FFF', fontWeight:'900', fontSize:16 },
  label: { color:'#CCFF00', fontWeight:'bold', marginBottom:8, marginTop:15, fontSize:12 },
  input: { backgroundColor:'#111', color:'#FFF', padding:15, borderRadius:12, borderWidth:1, borderColor:'#333' },
  saveBtn: { backgroundColor:'#CCFF00', padding:18, borderRadius:12, alignItems:'center', marginTop:30 },
  saveBtnText: { fontWeight:'900', color:'#000', fontSize:16 },
});