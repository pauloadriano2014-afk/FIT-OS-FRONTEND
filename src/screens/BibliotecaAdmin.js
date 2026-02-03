import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  TextInput, Modal, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, StatusBar, ImageBackground 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- CONFIG DAS CAPAS ---
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
const categories = ['TODOS', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Antebraço', 'Tríceps', 'Abdômen', 'Mobilidade', 'Cardio'];

// --- HELPERS ORIGINAIS ---
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
    return (
        <View style={[styles.exerciseCard, { width: width }]}>
          <View style={styles.cardInfo}>
            <TouchableOpacity 
              style={styles.iconBox} 
              onPress={() => onPress(item.videoUrl)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="dumbbell" size={20} color="#CCFF00" />
            </TouchableOpacity>
            
            <View style={{ flex: 1 }}>
              <Text style={styles.exerciseName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.exerciseSub}>{item.category.toUpperCase()}</Text>
            </View>

            {item.videoUrl && (
              <TouchableOpacity 
                onPress={() => onPress(item.videoUrl)} 
                style={styles.videoPlayBtn}
              >
                <MaterialCommunityIcons name="play" size={20} color="#000" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onDelete(item.id)} 
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
    );
}, (prev, next) => prev.item.id === next.item.id && prev.item.videoUrl === next.item.videoUrl && prev.width === next.width);

export default function BibliotecaAdmin({ navigation }) {
  const { width } = useWindowDimensions();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedCat, setSelectedCat] = useState('TODOS');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [formExercise, setFormExercise] = useState({ id: null, name: '', category: 'Peito', videoUrl: '' });
  const [saving, setSaving] = useState(false);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  // Responsividade
  const getNumColumns = () => {
      if (width > 1000) return 3; 
      if (width > 700) return 2;  
      return 1; 
  };
  
  const numColumns = getNumColumns();
  const itemWidth = numColumns > 1 
      ? (width - (HORIZONTAL_PADDING * 2) - (SPACING * (numColumns - 1))) / numColumns
      : (width - (HORIZONTAL_PADDING * 2));

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

  // 🔥🔥🔥 AQUI ESTÁ A CORREÇÃO DO CADASTRO 🔥🔥🔥
  const handleSaveOrUpdate = async () => {
      if (!formExercise.name) return Alert.alert("Erro", "Nome obrigatório");
      
      setSaving(true);
      try {
          const res = await fetch('https://fitos-final.onrender.com/api/exercise', {
              method: !!formExercise.id ? 'PUT' : 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(formExercise)
          });

          const jsonResponse = await res.json(); // Lemos a resposta JSON

          if (res.ok) {
              setModalVisible(false);
              fetchLibrary();
              Alert.alert("Sucesso", "Operação realizada com sucesso!");
          } else {
              // 🔥 AGORA VAMOS VER O ERRO REAL
              Alert.alert("Erro ao Salvar", jsonResponse.error || "Ocorreu um erro no servidor.");
          }
      } catch (e) { 
          Alert.alert("Erro de Conexão", e.message); 
      } 
      finally { 
          setSaving(false); 
      }
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

  const RootComponent = Platform.OS === 'web' ? View : SafeAreaView;
  const rootStyle = { flex: 1, backgroundColor: '#000' };

  return (
    <RootComponent style={rootStyle}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BIBLIOTECA</Text>
          <TouchableOpacity onPress={fetchLibrary} style={styles.backBtn}>
              <MaterialCommunityIcons name="refresh" size={24} color="#CCFF00" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput 
              style={styles.searchInput} placeholder="Buscar exercício..." placeholderTextColor="#666"
              value={filterText} onChangeText={setFilterText} 
            />
        </View>

        <View style={{ height: 45, marginBottom: 15 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                {categories.map(cat => (
                    <TouchableOpacity 
                        key={cat} 
                        style={[styles.catTab, selectedCat === cat && styles.catTabActive]}
                        onPress={() => setSelectedCat(cat)}
                    >
                        <Text style={[styles.catTabText, selectedCat === cat && styles.catTabTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        <View style={{ flex: 1 }}>
            {loading ? <ActivityIndicator color="#CCFF00" style={{ marginTop: 50 }} /> : (
                <FlatList
                  key={`grid-${numColumns}`} 
                  data={filteredList}
                  keyExtractor={item => item.id.toString()}
                  numColumns={numColumns}
                  // 🔥 CORREÇÃO PARA EVITAR TELA VERMELHA
                  columnWrapperStyle={numColumns > 1 ? { gap: SPACING } : undefined} 
                  contentContainerStyle={{ 
                      paddingBottom: 150, 
                      paddingHorizontal: HORIZONTAL_PADDING 
                  }}
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={
                    <View style={{ marginBottom: 20 }}>
                        <ImageBackground 
                            source={{ uri: categoryCovers[selectedCat] || categoryCovers["TODOS"] }} 
                            style={styles.categoryCover}
                            imageStyle={{ borderRadius: 20 }}
                        >
                            <View style={styles.coverOverlay}>
                                <Text style={styles.coverTitle}>{selectedCat.toUpperCase()}</Text>
                                <Text style={styles.coverCount}>{filteredList.length} EXERCÍCIOS</Text>
                            </View>
                        </ImageBackground>
                    </View>
                  }
                  renderItem={({ item }) => (
                      <ExerciseCard 
                          item={item} width={itemWidth} 
                          onPress={openVideoPreview}
                          onEdit={(ex) => { setFormExercise(ex); setModalVisible(true); }}
                          onDelete={handleDelete}
                      />
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>Nada encontrado.</Text>}
                />
            )}
        </View>

        <TouchableOpacity style={styles.fab} onPress={() => { setFormExercise({ id: null, name: '', category: 'Peito', videoUrl: '' }); setModalVisible(true); }}>
            <MaterialCommunityIcons name="plus" size={32} color="#000" />
        </TouchableOpacity>

        {/* MODAL CRIAR/EDITAR */}
        <Modal visible={modalVisible} animationType="slide">
          <View style={styles.modalContent}>
            <SafeAreaView style={{flex:1}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{formExercise.id ? 'EDITAR' : 'NOVO EXERCÍCIO'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color="#FFF" /></TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>NOME DO EXERCÍCIO</Text>
                <TextInput style={styles.input} value={formExercise.name} onChangeText={t => setFormExercise({...formExercise, name: t})} placeholder="Ex: Supino Reto" placeholderTextColor="#444" />
                
                <Text style={styles.label}>GRUPO MUSCULAR</Text>
                <View style={styles.chipRow}>
                  {categories.filter(c => c !== 'TODOS').map(c => (
                    <TouchableOpacity key={c} style={[styles.chip, formExercise.category === c && styles.chipActive]} onPress={() => setFormExercise({...formExercise, category: c})}>
                      <Text style={[styles.chipText, formExercise.category === c && { color: '#000' }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>URL DO VÍDEO</Text>
                <TextInput style={styles.input} value={formExercise.videoUrl} onChangeText={t => setFormExercise({...formExercise, videoUrl: t})} placeholder="Link do vídeo..." placeholderTextColor="#444" autoCapitalize="none" />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveOrUpdate} disabled={saving}>
                  {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>SALVAR NA BIBLIOTECA</Text>}
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>

        {/* VIDEO PREVIEW */}
        <Modal visible={videoModalVisible} transparent animationType="fade">
          <View style={styles.videoBackdrop}>
             <TouchableOpacity style={styles.closeFullVideo} onPress={() => setVideoModalVisible(false)}>
               <MaterialCommunityIcons name="close" size={30} color="#FFF" />
             </TouchableOpacity>
             <Video source={{ uri: currentVideo }} style={styles.fullVideo} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay />
          </View>
        </Modal>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'web' ? 20 : 10 },
  backBtn: { width: 40, height: 40, backgroundColor: '#111', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', marginHorizontal: 20, marginBottom: 20, paddingHorizontal: 15, height: 50, borderRadius: 15, borderWidth: 1, borderColor: '#222' },
  searchInput: { flex: 1, color: '#FFF', marginLeft: 10, fontWeight: 'bold', outlineStyle: 'none' },

  catTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  catTabActive: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  catTabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  catTabTextActive: { color: '#000' },

  categoryCover: { height: 120, width: '100%', justifyContent: 'flex-end', overflow: 'hidden' },
  coverOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, height: '100%', justifyContent: 'flex-end', borderRadius: 20 },
  coverTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  coverCount: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold', marginTop: 2 },

  exerciseCard: { backgroundColor: '#111', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#1a1a1a' },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, backgroundColor: '#000', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  exerciseName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  exerciseSub: { color: '#444', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  videoPlayBtn: { width: 35, height: 35, backgroundColor: '#CCFF00', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 10, borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 10 },
  actionBtn: { padding: 5 },

  fab: { position: 'absolute', bottom: 30, right: 20, width: 65, height: 65, borderRadius: 33, backgroundColor: '#CCFF00', justifyContent: 'center', alignItems: 'center', elevation: 8, zIndex: 999 },
  
  emptyText: { color:'#666', textAlign:'center', marginTop:50, fontStyle:'italic' },

  modalContent: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#111' },
  modalTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  label: { color: '#444', fontSize: 10, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  input: { backgroundColor: '#111', borderRadius: 12, padding: 15, color: '#FFF', fontWeight: 'bold', borderWidth: 1, borderColor: '#222' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  chipActive: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  chipText: { color: '#666', fontSize: 11, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 14 },

  videoBackdrop: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  fullVideo: { width: '100%', height: '80%' },
  closeFullVideo: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
});