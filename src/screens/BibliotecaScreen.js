// src/screens/BibliotecaScreen.js
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  StatusBar, Platform, Alert, ActivityIndicator, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { Image } from 'expo-image';

const getDirectImageUrl = (url) => {
    if (!url) return null;
    if (url.includes('drive.google.com')) {
        const match = url.match(/[-\w]{25,}/);
        if (match && match[0]) {
            return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w1000`;
        }
    }
    return url;
};

export default function BibliotecaScreen({ navigation, route }) {
  const { theme } = useTheme();
  
  const [contents, setContents] = useState([]);
  const [accessIds, setAccessIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const isWeb = Platform.OS === 'web';
  const RootComponent = isWeb ? View : SafeAreaView;
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  useFocusEffect(
      useCallback(() => {
          fetchBibliotecaData();
      }, [])
  );

  const fetchBibliotecaData = async () => {
      setLoading(true);
      try {
          const storedUser = await AsyncStorage.getItem('user');
          const user = storedUser ? JSON.parse(storedUser) : route.params?.userData;

          if (!user) return;

          // 🔥 A MÁGICA FINAL: O Aluno pede os conteúdos enviando o próprio ID
          const [resContents, resAccess] = await Promise.all([
              fetch(`https://fitos-final.onrender.com/api/contents?userId=${user.id}&t=${Date.now()}`),
              fetch(`https://fitos-final.onrender.com/api/admin/access?userId=${user.id}&t=${Date.now()}`)
          ]);

          const dataContents = await resContents.json();
          const dataAccess = await resAccess.json();

          if (Array.isArray(dataContents)) setContents(dataContents);
          if (Array.isArray(dataAccess)) setAccessIds(dataAccess);

      } catch (error) {
          console.log("Erro ao carregar PA FLIX:", error);
      } finally {
          setLoading(false);
      }
  };

  const processContents = () => {
      const ebooks = [];
      const audios = [];
      const videos = []; 
      const bloqueados = [];

      contents.forEach(c => {
          const isLocked = c.isVIP && !accessIds.includes(c.id);
          
          const mappedItem = {
              id: c.id,
              title: c.title,
              type: c.type || 'video',
              locked: isLocked,
              image: getDirectImageUrl(c.thumbUrl) || 'https://via.placeholder.com/400x600/111111/CCFF00?text=PA+TEAM',
              url: c.type === 'ebook' ? c.pdfUrl : (c.type === 'audio' ? c.audioUrl : c.videoUrl),
              progress: 0,
              thumbUrlOriginal: c.thumbUrl 
          };

          if (isLocked) {
              bloqueados.push(mappedItem);
          } else if (mappedItem.type === 'ebook') {
              ebooks.push(mappedItem);
          } else if (mappedItem.type === 'audio') {
              audios.push(mappedItem);
          } else {
              videos.push(mappedItem); 
          }
      });

      return { ebooks, audios, videos, bloqueados };
  };

  const { ebooks, audios, videos, bloqueados } = processContents();

  const handlePressItem = (item) => {
      if (item.locked) {
          if (isWeb) window.alert("CONTEÚDO VIP\nFaça o upgrade do seu plano com o Coach para acessar este material exclusivo.");
          else Alert.alert("CONTEÚDO VIP 🔒", "Faça o upgrade do seu plano com o Coach para acessar este material exclusivo.");
          return;
      }
      
      if (item.url) {
          if (item.type === 'ebook') {
              navigation.navigate('PDFViewer', { url: item.url, title: item.title });
          } else if (item.type === 'video') {
              navigation.navigate('VideoPlayer', { url: item.url, title: item.title });
          } else if (item.type === 'audio') {
              try {
                  const parsedChapters = JSON.parse(item.url);
                  if (Array.isArray(parsedChapters)) {
                      navigation.navigate('AudioPlayer', { 
                          chapters: parsedChapters, 
                          title: item.title,
                          thumbUrl: item.thumbUrlOriginal 
                      });
                  } else {
                      navigation.navigate('AudioPlayer', { 
                          chapters: [{ title: 'Capítulo Único', url: item.url }], 
                          title: item.title,
                          thumbUrl: item.thumbUrlOriginal 
                      });
                  }
              } catch (e) {
                  navigation.navigate('AudioPlayer', { 
                      chapters: [{ title: 'Audiobook', url: item.url }], 
                      title: item.title,
                      thumbUrl: item.thumbUrlOriginal 
                  });
              }
          }
      } else {
          if (isWeb) window.alert("Aviso: Arquivo ainda não disponível no servidor.");
          else Alert.alert("Aviso", "Arquivo ainda não disponível no servidor.");
      }
  };

  const renderCard = (item, isLarge = false) => {
      const cardWidth = isLarge ? 160 : 130;
      const cardHeight = isLarge ? 220 : 180;

      let vipLabel = "CONTEÚDO VIP";
      if (item.type === 'ebook') vipLabel = "E-BOOK VIP";
      if (item.type === 'audio') vipLabel = "AUDIOBOOK VIP";
      if (item.type === 'video') vipLabel = "AULA VIP";

      return (
          <TouchableOpacity 
              key={item.id} 
              activeOpacity={0.8} 
              onPress={() => handlePressItem(item)}
              style={[styles.cardContainer, { width: cardWidth }]}
          >
              <View style={[styles.cardImageWrapper, { height: cardHeight, borderColor: item.locked ? theme.border : theme.accent, borderWidth: item.locked ? 1 : 2 }]}>
                  
                  <Image 
                    source={item.image}
                    style={StyleSheet.absoluteFillObject} 
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk" 
                    priority="high" 
                  />

                  <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.95)']}
                      style={[styles.cardGradient, { opacity: item.locked ? 0.9 : 1 }]}
                  >
                      {item.type === 'audio' && !item.locked && (
                          <View style={styles.audioIconWrapper}>
                              <MaterialCommunityIcons name="headphones" size={20} color="#FFF" />
                          </View>
                      )}
                      
                      {item.type === 'video' && !item.locked && (
                          <View style={styles.audioIconWrapper}>
                              <MaterialCommunityIcons name="play-circle" size={20} color="#FFF" />
                          </View>
                      )}

                      {item.locked ? (
                          <View style={styles.lockedCenter}>
                              <MaterialCommunityIcons name="lock" size={32} color="#FFCC00" />
                              {item.type === 'video' && (
                                  <Text style={styles.lockedTitle} numberOfLines={2}>{item.title}</Text>
                              )}
                              <Text style={[styles.lockedSub, { color: '#FFCC00', fontWeight: 'bold' }]}>{vipLabel}</Text>
                          </View>
                      ) : (
                          <View style={styles.unlockedBottom}>
                              {item.type === 'video' && (
                                  <Text style={[styles.cardTitle, { color: theme.accent }]} numberOfLines={3}>{item.title}</Text>
                              )}
                              
                              {item.type === 'ebook' ? (
                                  <View style={[styles.actionBtn, { backgroundColor: '#FFF' }]}>
                                      <Text style={[styles.actionBtnText, { color: '#000' }]}>Ler Agora</Text>
                                  </View>
                              ) : item.type === 'video' ? (
                                  <View style={[styles.actionBtn, { backgroundColor: theme.accent }]}>
                                      <MaterialCommunityIcons name="play" size={16} color="#000" />
                                      <Text style={[styles.actionBtnText, { color: '#000', marginLeft: 4 }]}>Assistir</Text>
                                  </View>
                              ) : (
                                  <View style={[styles.actionBtn, { backgroundColor: theme.accent }]}>
                                      <MaterialCommunityIcons name="headphones" size={14} color="#000" />
                                      <Text style={[styles.actionBtnText, { color: '#000', marginLeft: 4 }]}>Ouvir</Text>
                                  </View>
                              )}
                          </View>
                      )}
                  </LinearGradient>
              </View>

              {!item.locked && item.type === 'ebook' && item.progress > 0 && (
                  <View style={styles.progressContainer}>
                      <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                          <View style={[styles.progressBarFill, { width: `${item.progress}%`, backgroundColor: theme.accent }]} />
                      </View>
                      <Text style={[styles.progressText, { color: theme.textSecondary }]}>{item.progress}%</Text>
                  </View>
              )}
          </TouchableOpacity>
      );
  };

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
        
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>TEAM</Text>
                <Text style={[styles.headerTitle, { color: theme.text }]}>PAULO ADRIANO</Text>
            </View>
            <MaterialCommunityIcons name="play-box-multiple" size={28} color={theme.textSecondary} />
        </View>

        {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{ color: theme.textSecondary, marginTop: 10, fontWeight: 'bold' }}>Carregando Biblioteca...</Text>
            </View>
        ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {ebooks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionMainTitle, { color: theme.text }]}>MEU CONTEÚDO LIBERADO</Text>
                        <Text style={[styles.sectionSubTitle, { color: theme.textSecondary }]}>E-BOOKS DE TREINO E DIETA</Text>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                            {ebooks.map(item => renderCard(item, true))}
                        </ScrollView>
                    </View>
                )}

                {videos.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>MASTERCLASSES PA FLIX</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                            {videos.map(item => renderCard(item, false))}
                        </ScrollView>
                    </View>
                )}

                {audios.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>AUDIOBOOKS EXCLUSIVOS</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                            {audios.map(item => renderCard(item, false))}
                        </ScrollView>
                    </View>
                )}

                {bloqueados.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>CONTEÚDO VIP (BLOQUEADO)</Text>
                        <Text style={[styles.sectionSubTitle, { color: theme.textSecondary, marginBottom: 15, marginTop: -5 }]}>Disponível apenas no Plano VIP</Text>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                            {bloqueados.map(item => renderCard(item, false))}
                        </ScrollView>
                    </View>
                )}

                {contents.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="bookshelf" size={48} color={theme.textSecondary} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Sua biblioteca ainda está vazia.</Text>
                    </View>
                )}

            </ScrollView>
        )}
      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15 },
  headerSubtitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  section: { marginTop: 25 },
  sectionMainTitle: { fontSize: 22, fontWeight: '900', paddingHorizontal: 20, marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '900', paddingHorizontal: 20, marginBottom: 15 },
  sectionSubTitle: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 15, textTransform: 'uppercase' },
  carouselContainer: { paddingHorizontal: 15, paddingBottom: 10, gap: 15 },
  cardContainer: { marginRight: 5 },
  cardImageWrapper: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', position: 'relative' },
  cardGradient: { flex: 1, justifyContent: 'space-between', padding: 12 },
  audioIconWrapper: { alignSelf: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 12 },
  unlockedBottom: { marginTop: 'auto', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  actionBtnText: { fontSize: 12, fontWeight: '900' },
  lockedCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lockedTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 10, marginBottom: 5, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  lockedSub: { fontSize: 10, textAlign: 'center', marginTop: 2 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 5 },
  progressBarBg: { flex: 1, height: 4, borderRadius: 2 },
  progressBarFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10, fontWeight: 'bold', marginLeft: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
  emptyText: { textAlign: 'center', marginTop: 15, fontWeight: 'bold' }
});