import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, 
  Dimensions, StatusBar, Modal, SafeAreaView, ActivityIndicator, 
  RefreshControl, TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x225/000000/FFFFFF?text=PA+TEAM';

export default function PAFlixScreen({ navigation }) {
  const [categories, setCategories] = useState([]); 
  const [heroVideo, setHeroVideo] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Estados para Comentários
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchContents = async () => {
     try {
        const storedUser = await AsyncStorage.getItem('user');
        let userId = null;
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUserData(parsed);
            userId = parsed.id;
        }

        const url = `https://fitos-final.onrender.com/api/contents?userId=${userId || ''}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (Array.isArray(data)) {
            setCategories(data);
            if (data.length > 0 && data[0].videos.length > 0) {
                setHeroVideo(data[0].videos[0]);
            }
        }
     } catch (error) {
        console.log("Erro PA Flix:", error);
     } finally {
        setLoading(false);
        setRefreshing(false);
     }
  };

  useFocusEffect(useCallback(() => { fetchContents(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchContents(); };

  // 🔥 LÓGICA DE ABRIR VÍDEO + CARREGAR COMENTÁRIOS
  const openVideo = (video) => {
      setSelectedVideo(video);
      fetchComments(video.id);
  };

  const fetchComments = async (videoId) => {
      setLoadingComments(true);
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/contents/${videoId}/comments`);
          const data = await res.json();
          if(Array.isArray(data)) setComments(data);
      } catch (error) {
          console.log("Erro comments");
      } finally {
          setLoadingComments(false);
      }
  };

  const handlePostComment = async () => {
      if (!newComment.trim() || !userData) return;
      
      const tempComment = {
          id: Date.now().toString(),
          text: newComment,
          user: { name: userData.name || "Eu" },
          createdAt: new Date().toISOString()
      };
      
      // Otimista
      setComments([tempComment, ...comments]);
      setNewComment('');

      try {
          await fetch('https://fitos-final.onrender.com/api/contents/comment', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ userId: userData.id, contentId: selectedVideo.id, text: tempComment.text })
          });
      } catch (error) {
          Alert.alert("Erro", "Não foi possível enviar o comentário.");
      }
  };

  // 🔥 LIKE COM UI OTIMISTA CORRIGIDA
  const handleLike = async (video) => {
    if (!userData) return;

    const isLikedNow = !video.likedByMe;
    const newCount = isLikedNow ? (video.likesCount || 0) + 1 : (video.likesCount || 0) - 1;

    // 1. Atualiza o Modal Aberto (Feedback Instantâneo)
    setSelectedVideo(prev => ({ ...prev, likedByMe: isLikedNow, likesCount: newCount }));

    // 2. Atualiza a Lista de Fundo (Para não bugar ao fechar)
    setCategories(prevCats => prevCats.map(cat => ({
        ...cat,
        videos: cat.videos.map(v => v.id === video.id ? { ...v, likedByMe: isLikedNow, likesCount: newCount } : v)
    })));

    try {
        await fetch('https://fitos-final.onrender.com/api/contents/like', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: userData.id, contentId: video.id })
        });
    } catch (e) { console.log("Erro like"); }
  };

  // 🔥 NOVA LÓGICA DE XP AO TERMINAR VÍDEO
  const handlePlaybackStatusUpdate = async (status) => {
      // Verifica se o vídeo carregou e se acabou de terminar
      if (status.isLoaded && status.didJustFinish && userData && selectedVideo) {
          try {
              const res = await fetch('https://fitos-final.onrender.com/api/contents/complete', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ userId: userData.id, contentId: selectedVideo.id })
              });
              const json = await res.json();
              
              // Se xpEarned > 0, significa que é a primeira vez que assiste
              if (json.xpEarned > 0) {
                  Alert.alert("🎉 AULA CONCLUÍDA!", `Você ganhou +${json.xpEarned} XP! Continue evoluindo.`);
                  
                  // Atualiza XP localmente para refletir na Home imediatamente
                  const updatedUser = { ...userData, currentXP: (userData.currentXP || 0) + json.xpEarned };
                  setUserData(updatedUser);
                  await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
              }
          } catch (e) {
              console.log("Erro ao dar XP de video");
          }
      }
  };

  const renderVideoItem = (video) => (
    <TouchableOpacity key={video.id} style={styles.videoCard} onPress={() => openVideo(video)}>
      <Image source={video.thumbUrl ? { uri: video.thumbUrl } : { uri: PLACEHOLDER_IMAGE }} style={styles.thumbnail} resizeMode="cover" />
      <View style={styles.playIconOverlay}><MaterialCommunityIcons name="play-circle" size={40} color="rgba(255,255,255,0.8)" /></View>
      <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
      <Text style={styles.videoSubtitle} numberOfLines={1}>{video.subtitle || video.duration}</Text>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#CCFF00" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CCFF00"/>}>
        <View style={styles.header}><Text style={styles.logoText}>PA <Text style={{color:'#CCFF00'}}>FLIX</Text></Text></View>

        {heroVideo && (
            <TouchableOpacity style={styles.heroContainer} onPress={() => openVideo(heroVideo)}>
                <Image source={heroVideo.thumbUrl ? { uri: heroVideo.thumbUrl } : { uri: PLACEHOLDER_IMAGE }} style={styles.heroImage} resizeMode="cover" />
                <Video source={{ uri: heroVideo.videoUrl }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted />
                <View style={styles.heroGradient} />
                <View style={styles.heroOverlay}>
                    <View style={styles.heroTag}><Text style={styles.heroTagText}>EM DESTAQUE</Text></View>
                    <Text style={styles.heroTitle}>{heroVideo.title.toUpperCase()}</Text>
                    <Text style={styles.heroSubtitle}>{heroVideo.subtitle}</Text>
                    <TouchableOpacity style={styles.heroBtnPlay} onPress={() => openVideo(heroVideo)}>
                        <MaterialCommunityIcons name="play" size={24} color="#000" /><Text style={styles.heroBtnText}>ASSISTIR</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )}

        {categories.map((cat) => (
          <View key={cat.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{cat.title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}>
              {cat.videos.map(renderVideoItem)}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* MODAL PLAYER */}
      <Modal visible={!!selectedVideo} animationType="slide" transparent={false} onRequestClose={() => setSelectedVideo(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <SafeAreaView style={{flex:1}}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedVideo(null)}>
                    <MaterialCommunityIcons name="chevron-down" size={36} color="#FFF" />
                </TouchableOpacity>
                
                {selectedVideo && (
                    <ScrollView contentContainerStyle={{paddingBottom: 40}}>
                        <Video
                            style={{ width: width, height: width * 0.5625 }} 
                            source={{ uri: selectedVideo.videoUrl }}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
                            // 🔥 AQUI ESTÁ A MÁGICA
                            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                        />
                        
                        <View style={{padding:20}}>
                            <Text style={styles.modalTitle}>{selectedVideo.title}</Text>
                            <Text style={styles.modalSubtitle}>{selectedVideo.subtitle} • {selectedVideo.duration}</Text>
                            <Text style={styles.modalDesc}>{selectedVideo.description || "Conteúdo exclusivo PA Team."}</Text>

                            {/* BOTOES DE AÇÃO */}
                            <View style={styles.interactionRow}>
                                 <TouchableOpacity style={styles.actionItem} onPress={() => handleLike(selectedVideo)}>
                                    <MaterialCommunityIcons name={selectedVideo.likedByMe ? "thumb-up" : "thumb-up-outline"} size={26} color={selectedVideo.likedByMe ? "#CCFF00" : "#FFF"} />
                                    <Text style={[styles.actionText, selectedVideo.likedByMe && {color:'#CCFF00'}]}>{selectedVideo.likesCount || 0}</Text>
                                 </TouchableOpacity>
                                 
                                 <View style={styles.actionItem}>
                                    <MaterialCommunityIcons name="comment-text-outline" size={26} color="#FFF" />
                                    <Text style={styles.actionText}>{comments.length}</Text>
                                 </View>
                            </View>

                            {/* SEÇÃO DE COMENTÁRIOS */}
                            <Text style={styles.commentsHeader}>COMENTÁRIOS</Text>
                            
                            <View style={styles.inputRow}>
                                <TextInput 
                                    style={styles.inputComment} 
                                    placeholder="Deixe seu comentário..." 
                                    placeholderTextColor="#666" 
                                    value={newComment}
                                    onChangeText={setNewComment}
                                />
                                <TouchableOpacity style={styles.sendBtn} onPress={handlePostComment}>
                                    <MaterialCommunityIcons name="send" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>

                            {loadingComments ? <ActivityIndicator color="#CCFF00" style={{marginTop:20}} /> : (
                                comments.map((c) => (
                                    <View key={c.id} style={styles.commentItem}>
                                        <Text style={styles.commentUser}>{c.user?.name || "Aluno"}</Text>
                                        <Text style={styles.commentText}>{c.text}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' },
  header: { padding: 20, paddingTop: 40, backgroundColor:'rgba(0,0,0,0.8)', position:'absolute', top:0, width:'100%', zIndex:10 },
  logoText: { color: '#FFF', fontSize: 24, fontWeight: '900', fontStyle:'italic' },
  heroContainer: { width: width, height: 450, marginBottom: 20, justifyContent: 'flex-end' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', backgroundColor:'#111' },
  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroOverlay: { padding: 20, paddingBottom: 40 }, 
  heroTag: { backgroundColor:'#CCFF00', paddingHorizontal:8, paddingVertical:4, borderRadius:4, alignSelf:'flex-start', marginBottom:10 },
  heroTagText: { color:'#000', fontSize:10, fontWeight:'900' },
  heroTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 5 },
  heroSubtitle: { color: '#CCC', fontSize: 14, marginBottom: 20, fontWeight:'bold' },
  heroBtnPlay: { backgroundColor: '#CCFF00', flexDirection:'row', padding: 12, borderRadius: 6, gap:8, alignSelf:'flex-start' },
  heroBtnText: { color: '#000', fontWeight: 'bold' },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },
  videoCard: { marginRight: 15, width: 150 },
  thumbnail: { width: 150, height: 220, borderRadius: 8, backgroundColor: '#222' },
  playIconOverlay: { position: 'absolute', top: 90, left: 55, opacity: 0.8 },
  videoTitle: { color: '#FFF', fontSize: 13, marginTop: 8, fontWeight:'bold' },
  videoSubtitle: { color: '#666', fontSize: 11 },
  
  modalContainer: { flex: 1, backgroundColor: '#111' },
  closeBtn: { padding: 15, alignSelf: 'flex-start', zIndex:10 },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 10 },
  modalSubtitle: { color: '#888', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  modalDesc: { color: '#CCC', fontSize: 14, marginTop: 10, lineHeight: 22 },
  interactionRow: { flexDirection: 'row', marginTop: 20, gap: 30, borderBottomWidth:1, borderBottomColor:'#222', paddingBottom:20 },
  actionItem: { flexDirection:'row', alignItems: 'center', gap: 8 },
  actionText: { color: '#FFF', fontSize: 14, fontWeight:'bold' },
  
  commentsHeader: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 15 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  inputComment: { flex: 1, backgroundColor: '#222', color: '#FFF', padding: 12, borderRadius: 8, borderWidth:1, borderColor:'#333' },
  sendBtn: { backgroundColor: '#CCFF00', width: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  commentItem: { marginBottom: 15, backgroundColor: '#1A1A1A', padding: 12, borderRadius: 8 },
  commentUser: { color: '#CCFF00', fontWeight: 'bold', fontSize: 12, marginBottom: 4 },
  commentText: { color: '#DDD', fontSize: 13 }
});