import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // 🔥 NOVO IMPORT

const { width } = Dimensions.get('window');
const PLACEHOLDER_IMAGE =
  'https://via.placeholder.com/400x225/000000/FFFFFF?text=PA+TEAM';

export default function PAFlixScreen() {
  const [categories, setCategories] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [heroVideo, setHeroVideo] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [nextVideo, setNextVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);

  // 🔥 NOVOS STATES PARA BUSCA
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Comentários
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  /* ================= FETCH ================= */

  const fetchContents = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      let userId = null;

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed);
        userId = parsed.id;
      }

      const res = await fetch(
        `https://fitos-final.onrender.com/api/contents?userId=${userId || ''}`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setCategories(data);

        // HERO: primeiro vídeo essencial
        const hero =
          data.flatMap(c => c.videos).find(v => v.isFeatured) ||
          data?.[0]?.videos?.[0];
        setHeroVideo(hero || null);

        // Jornadas (se existir)
        const j = data.filter(c => c.type === 'journey');
        setJourneys(j);
      }
    } catch (e) {
      console.log('Erro PA FLIX', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchContents(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchContents();
  };

  /* ================= VIDEO ================= */

  const openVideo = (video) => {
    setSelectedVideo(video);
    setNextVideo(findNextVideo(video));
    fetchComments(video.id);
  };

  const findNextVideo = (current) => {
    for (const cat of categories) {
      const idx = cat.videos.findIndex(v => v.id === current.id);
      if (idx >= 0 && cat.videos[idx + 1]) return cat.videos[idx + 1];
    }
    return null;
  };

  const handlePlaybackStatusUpdate = async (status) => {
    if (status.isLoaded && status.didJustFinish && userData && selectedVideo) {
      try {
        const res = await fetch(
          'https://fitos-final.onrender.com/api/contents/complete',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.id,
              contentId: selectedVideo.id
            })
          }
        );
        const json = await res.json();

        if (json.xpEarned > 0) {
          Alert.alert(
            '🎉 Aula concluída',
            `Você ganhou +${json.xpEarned} XP`
          );

          const updatedUser = {
            ...userData,
            currentXP: (userData.currentXP || 0) + json.xpEarned
          };
          setUserData(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.log('Erro XP vídeo');
      }
    }
  };

  /* ================= COMMENTS ================= */

  const fetchComments = async (videoId) => {
    setLoadingComments(true);
    try {
      const res = await fetch(
        `https://fitos-final.onrender.com/api/contents/${videoId}/comments`
      );
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch {
      console.log('Erro comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !userData) return;

    const temp = {
      id: Date.now().toString(),
      text: newComment,
      user: { name: userData.name || 'Eu' }
    };

    setComments([temp, ...comments]);
    setNewComment('');

    await fetch('https://fitos-final.onrender.com/api/contents/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        contentId: selectedVideo.id,
        text: temp.text
      })
    });
  };

  /* ================= LOGICA DE BUSCA ================= */
  
  const getFilteredContent = () => {
    if (!searchText) return categories;
    
    // Filtra categorias que contenham videos correspondentes
    return categories.map(cat => ({
      ...cat,
      videos: cat.videos.filter(v => 
        v.title.toLowerCase().includes(searchText.toLowerCase()) ||
        v.tags?.some(t => t.toLowerCase().includes(searchText.toLowerCase()))
      )
    })).filter(cat => cat.videos.length > 0);
  };

  const displayedCategories = getFilteredContent();

  /* ================= RENDER COMPONENTS ================= */

  const renderTags = (tags = []) => (
    <View style={styles.tagsRow}>
      {tags.map(tag => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );

  const renderVideoItem = (video) => (
    <TouchableOpacity
      key={video.id}
      style={styles.videoCard}
      onPress={() => openVideo(video)}
    >
      <Image
        source={video.thumbUrl ? { uri: video.thumbUrl } : { uri: PLACEHOLDER_IMAGE }}
        style={styles.thumbnail}
      />

      {video.completedByUser && (
        <View style={styles.completedBadge}>
          <MaterialCommunityIcons name="check" size={14} color="#000" />
        </View>
      )}

      {renderTags(video.tags)}

      <Text style={styles.videoTitle} numberOfLines={1}>
        {video.title}
      </Text>
      <Text style={styles.videoSubtitle}>
        {video.duration || ''}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER FIXO COM BUSCA */}
      <View style={styles.headerContainer}>
        {!showSearch ? (
            <Text style={styles.header}>PA <Text style={{ color: '#CCFF00' }}>FLIX</Text></Text>
        ) : (
            <TextInput 
                style={styles.headerSearchInput}
                placeholder="Buscar treino, aula..."
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
            />
        )}
        
        <TouchableOpacity onPress={() => {
            setShowSearch(!showSearch);
            if(showSearch) setSearchText(''); // Limpa ao fechar
        }}>
            <MaterialCommunityIcons name={showSearch ? "close" : "magnify"} size={28} color="#CCFF00" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CCFF00"/>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        
        {/* HERO (Só aparece se não estiver buscando) */}
        {!searchText && heroVideo && (
          <TouchableOpacity
            style={styles.hero}
            onPress={() => openVideo(heroVideo)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: heroVideo.thumbUrl || PLACEHOLDER_IMAGE }}
              style={styles.heroImg}
            />
            
            {/* 🔥 VISUAL PREMIUM COM GRADIENTE */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.2)', '#000']}
                style={styles.heroGradient}
            >
                <Text style={styles.heroTitle}>{heroVideo.title}</Text>
                <Text style={styles.heroSub}>{heroVideo.subtitle}</Text>

                {/* BOTÃO PLAY */}
                <View style={styles.heroPlayBtn}>
                    <MaterialCommunityIcons name="play" size={20} color="#000" />
                    <Text style={styles.heroPlayText}>ASSISTIR AGORA</Text>
                </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* CATEGORIES LIST */}
        {displayedCategories.length === 0 ? (
           <Text style={styles.emptyText}>Nenhum vídeo encontrado.</Text>
        ) : (
           displayedCategories.map(cat => (
              <View key={cat.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{cat.title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {cat.videos.map(renderVideoItem)}
                </ScrollView>
              </View>
           ))
        )}

      </ScrollView>

      {/* MODAL PLAYER (Mantido Igual) */}
      <Modal visible={!!selectedVideo} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelectedVideo(null)}
          >
            <MaterialCommunityIcons name="chevron-down" size={32} color="#FFF" />
          </TouchableOpacity>

          {selectedVideo && (
            <ScrollView>
              <Video
                style={{ width, height: width * 0.56 }}
                source={{ uri: selectedVideo.videoUrl }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                shouldPlay
              />

              <View style={{ padding: 20 }}>
                <Text style={styles.modalTitle}>{selectedVideo.title}</Text>
                <Text style={styles.modalDesc}>{selectedVideo.description}</Text>

                {nextVideo && (
                  <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => openVideo(nextVideo)}
                  >
                    <Text style={styles.nextBtnText}>
                      ▶ Próximo vídeo recomendado
                    </Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.commentsHeader}>COMENTÁRIOS</Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputComment}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Comente…"
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={handlePostComment}
                  >
                    <MaterialCommunityIcons name="send" size={18} color="#000" />
                  </TouchableOpacity>
                </View>

                {loadingComments
                  ? <ActivityIndicator color="#CCFF00" style={{marginTop: 20}} />
                  : comments.map(c => (
                    <View key={c.id} style={styles.commentItem}>
                      <Text style={styles.commentUser}>{c.user?.name}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // HEADER ESTILIZADO
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 10,
    backgroundColor: '#000'
  },
  header: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  headerSearchInput: {
    flex: 1,
    color: '#FFF',
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
    fontSize: 14
  },

  // HERO REFORMULADO
  hero: { height: 450, marginBottom: 20 },
  heroImg: { ...StyleSheet.absoluteFillObject },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 250, // Altura do degradê
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  heroSub: { color: '#EEE', marginTop: 4, fontSize: 14, fontWeight: '600', marginBottom: 15 },
  
  heroPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFF00',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  heroPlayText: {
    color: '#000',
    fontWeight: '900',
    marginLeft: 8,
    fontSize: 14
  },

  section: { marginBottom: 30 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 10 },

  videoCard: { width: 150, marginLeft: 15 },
  thumbnail: { width: 150, height: 220, borderRadius: 8, backgroundColor: '#1A1A1A' },
  videoTitle: { color: '#FFF', fontSize: 13, marginTop: 6 },
  videoSubtitle: { color: '#666', fontSize: 11 },

  completedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#CCFF00',
    borderRadius: 12,
    padding: 4,
    zIndex: 2
  },

  tagsRow: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', flexWrap: 'wrap' },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2
  },
  tagText: { color: '#FFF', fontSize: 9 },

  closeBtn: { padding: 15 },

  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  modalDesc: { color: '#CCC', marginTop: 10, lineHeight: 20 },

  nextBtn: {
    backgroundColor: '#CCFF00',
    padding: 14,
    borderRadius: 10,
    marginTop: 20
  },
  nextBtnText: { color: '#000', fontWeight: '900', textAlign: 'center' },

  commentsHeader: { color: '#FFF', fontSize: 16, marginTop: 30 },

  inputRow: { flexDirection: 'row', marginTop: 10 },
  inputComment: {
    flex: 1,
    backgroundColor: '#222',
    color: '#FFF',
    padding: 12,
    borderRadius: 8
  },
  sendBtn: {
    backgroundColor: '#CCFF00',
    marginLeft: 8,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center'
  },

  commentItem: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  commentUser: { color: '#CCFF00', fontWeight: 'bold' },
  commentText: { color: '#DDD', marginTop: 4 },
  
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50, fontStyle: 'italic' }
});