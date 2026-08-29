// src/screens/BibliotecaScreen.js
import React, { useState, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  StatusBar, Platform, Alert, ActivityIndicator, Linking, Modal, Animated, Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { Image } from 'expo-image';
import { Picker } from '@react-native-picker/picker';
import ContentPurchaseModal from '../components/ContentPurchaseModal';
import { authHeaders } from '../utils/authToken';

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

// 🔥 EXTRATOR DE ID DO YOUTUBE PARA PUXAR A CAPA AUTOMÁTICA 🔥
const getYouTubeId = (str) => {
    if (!str) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = str.match(regExp);
    return match ? match[1] : null;
};

// 🔥 COMPONENTE DO CARD ANIMADO (EFEITO ZOOM) 🔥
const AnimatedCard = ({ item, isLarge, isTop10, index, onPress, theme }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    const cardWidth = isLarge ? 160 : 140;
    const cardHeight = isLarge ? 220 : 180;
    let vipLabel = item.type === 'ebook' ? "E-BOOK VIP" : (item.type === 'audio' ? "AUDIOBOOK VIP" : "AULA VIP");

    return (
        <Pressable 
            onPress={() => onPress(item)} 
            onPressIn={handlePressIn} 
            onPressOut={handlePressOut}
            style={{ marginRight: 15, flexDirection: 'row', alignItems: 'flex-end', position: 'relative' }}
        >
            {/* NÚMERO GIGANTE PARA A SEÇÃO TOP 10 - Fica atrás do card e à esquerda */}
            {isTop10 && (
                <Text style={[styles.top10Number, { color: theme.bg, textShadowColor: theme.accent }]}>
                    {index + 1}
                </Text>
            )}

            <Animated.View style={[
                styles.cardImageWrapper, 
                { 
                    width: cardWidth, height: cardHeight, 
                    borderColor: item.locked ? theme.border : theme.accent, 
                    borderWidth: item.locked ? 1 : 1.5, 
                    transform: [{ scale: scaleAnim }], 
                    marginLeft: isTop10 ? 40 : 0, 
                    zIndex: 2 
                }
            ]}>
                <Image source={item.image} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} cachePolicy="disk" priority="high" />
                
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={[styles.cardGradient, { opacity: item.locked ? 0.9 : 1 }]}>
                    {item.type === 'audio' && !item.locked && (
                        <View style={styles.audioIconWrapper}><MaterialCommunityIcons name="headphones" size={20} color="#FFF" /></View>
                    )}
                    {item.type === 'video' && !item.locked && (
                        <View style={styles.audioIconWrapper}><MaterialCommunityIcons name="play-circle" size={24} color="#FFF" /></View>
                    )}

                    {item.locked ? (
                        <View style={styles.lockedCenter}>
                            <MaterialCommunityIcons name="lock" size={32} color="#FFCC00" />
                            {item.type === 'video' && <Text style={styles.lockedTitle} numberOfLines={2}>{item.title}</Text>}
                            <Text style={[styles.lockedSub, { color: '#FFCC00', fontWeight: 'bold' }]}>{vipLabel}</Text>
                        </View>
                    ) : (
                        <View style={styles.unlockedBottom}>
                            {item.type === 'video' && (
                                <View style={{ width: '100%', alignItems: 'center', zIndex: 10 }}>
                                    <Text style={[styles.cardTitle, { color: theme.accent }]} numberOfLines={2}>{item.title}</Text>
                                    {item.subtitle ? <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text> : null}
                                </View>
                            )}
                            {item.type === 'ebook' ? (
                                <View style={[styles.actionBtn, { backgroundColor: '#FFF' }]}><Text style={[styles.actionBtnText, { color: '#000' }]}>Ler Agora</Text></View>
                            ) : item.type === 'video' ? (
                                <View style={styles.invisibleSpacer} />
                            ) : (
                                <View style={[styles.actionBtn, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="headphones" size={14} color="#000" /><Text style={[styles.actionBtnText, { color: '#000', marginLeft: 4 }]}>Ouvir</Text></View>
                            )}
                        </View>
                    )}
                </LinearGradient>
                {item.progress > 0 && !item.locked && item.type === 'ebook' && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                            <View style={[styles.progressBarFill, { width: `${item.progress}%`, backgroundColor: theme.accent }]} />
                        </View>
                        <Text style={[styles.progressText, { color: theme.textSecondary }]}>{item.progress}%</Text>
                    </View>
                )}
            </Animated.View>
        </Pressable>
    );
};

export default function BibliotecaScreen({ navigation, route }) {
  const { theme } = useTheme();
  
  const [contents, setContents] = useState([]);
  const [accessIds, setAccessIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState(null);
  const [userPlan, setUserPlan] = useState('PREMIUM');

  const [upsellModalVisible, setUpsellModalVisible] = useState(false);
  const [upsellContent, setUpsellContent] = useState(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);

  const [activeFilter, setActiveFilter] = useState('Tudo');

  const isWeb = Platform.OS === 'web';
  const RootComponent = isWeb ? View : SafeAreaView;
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  // 🔥 Compliance App Store: venda avulsa de conteúdo digital (PIX/cartão)
  // dentro do app só é permitida fora do iOS (Guideline 3.1.1). No iOS,
  // some o botão "COMPRAR AGORA" e sobra só o "CHAMAR NO WHATSAPP" — que não
  // processa pagamento nenhum dentro do app, então não tem restrição.
  const canBuyInApp = Platform.OS !== 'ios';

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

          setUserId(user.id);

          const dbPlan = user.plan || 'PREMIUM';
          const resolvedPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(dbPlan) ? dbPlan : 'PREMIUM';
          setUserPlan(resolvedPlan);

          // 🔥 CORREÇÃO (2ª rodada): não adivinhamos mais o coachId no
          // frontend. O valor salvo no AsyncStorage pode estar desatualizado
          // (cache do celular), e um fallback local para PAULO_ID vazava
          // conteúdo do master para alunos de coaches parceiros que, por
          // qualquer motivo, tinham o campo coachId vazio no objeto em cache.
          // Mandamos só o userId — a API já resolve o coachId direto no
          // banco (fonte da verdade), o que é seguro tanto para alunos
          // legados (sem coach = cai no fallback permissivo do master)
          // quanto para alunos de coaches parceiros (coachId real deles).
          const authHdrs = await authHeaders();
          const [resContents, resAccess] = await Promise.all([
              fetch(`https://fitos-final.onrender.com/api/contents?userId=${user.id}&t=${Date.now()}`, { headers: authHdrs }),
              fetch(`https://fitos-final.onrender.com/api/admin/access?userId=${user.id}&t=${Date.now()}`, { headers: authHdrs })
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
      // 🔥 AGRUPAMENTO 100% DINÂMICO (Baseado no BD) 🔥
      const grouped = {};
      const bloqueados = [];
      const allVideos = [];

      contents.forEach(c => {
          let isLocked = false;
          
          // 🔒 LÓGICA DE BLOQUEIO VIP CORRIGIDA:
          // - Vídeos (isVIP: false) → sempre liberados, não entram aqui
          // - E-books / Áudios VIP (isVIP: true) → bloqueados por padrão;
          //   só desbloqueiam se a chavinha estiver ligada (ContentAccess).
          //   O plano do aluno NÃO influencia — a chavinha é a única fonte
          //   da verdade, porque você usa ela pra controlar quem comprou
          //   o bônus avulso ou foi contemplado no plano.
          if (c.isVIP) {
              isLocked = !accessIds.includes(c.id);
          }
          
          // CAPAS INTELIGENTES DO YOUTUBE
          let finalThumb = getDirectImageUrl(c.thumbUrl);
          const rawVideoUrl = c.type === 'video' ? c.videoUrl : '';
          
          if (!finalThumb && rawVideoUrl && (rawVideoUrl.includes('youtube') || rawVideoUrl.includes('youtu.be'))) {
              const ytId = getYouTubeId(rawVideoUrl);
              if (ytId) {
                  finalThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
              }
          }
          
          if (!finalThumb) {
              finalThumb = 'https://via.placeholder.com/400x600/111111/CCFF00?text=PA+TEAM';
          }

          const mappedItem = {
              ...c,
              id: c.id,
              title: c.title,
              subtitle: c.subtitle, 
              type: c.type || 'video',
              category: c.category || 'Outros',
              locked: isLocked,
              image: finalThumb,
              url: c.type === 'ebook' ? c.pdfUrl : (c.type === 'audio' ? c.audioUrl : c.videoUrl),
              progress: 0,
              thumbUrlOriginal: c.thumbUrl 
          };

          if (isLocked) {
              bloqueados.push(mappedItem);
          } else {
              const catName = mappedItem.category;
              if (!grouped[catName]) {
                  grouped[catName] = [];
              }
              grouped[catName].push(mappedItem);
              
              if (mappedItem.type === 'video') {
                  allVideos.push(mappedItem);
              }
          }
      });

      // Top 10 mais engajados
      const top10Items = [...allVideos]
          .sort((a, b) => {
              const aScore = (a._count?.likes || 0) + (a._count?.comments || 0);
              const bScore = (b._count?.likes || 0) + (b._count?.comments || 0);
              return bScore - aScore;
          })
          .slice(0, 10);

      const heroItem = top10Items.length > 0 ? top10Items[0] : (allVideos.length > 0 ? allVideos[0] : null);

      return { grouped, bloqueados, top10Items, heroItem };
  };

  const { grouped, bloqueados, top10Items, heroItem } = processContents();
  
  // 🔥 FILTROS DINÂMICOS BASEADOS NO QUE EXISTE NO BD 🔥
  const availableFilters = ['Tudo', ...Object.keys(grouped)];

  const handlePressItem = (item) => {
      if (item.locked) {
          setUpsellContent(item);
          setUpsellModalVisible(true);
          return;
      }
      
      if (item.url) {
          if (item.type === 'ebook') {
              navigation.navigate('PDFViewer', { url: item.url, title: item.title });
          } else if (item.type === 'video') {
              navigation.navigate('VideoPlayer', { url: item.url, title: item.title, contentId: item.id });
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

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
        
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>PA</Text>
                <Text style={[styles.headerTitle, { color: theme.text }]}>TEAM</Text>
            </View>
            <MaterialCommunityIcons name="play-box-multiple" size={28} color={theme.textSecondary} />
        </View>

        {/* 🔥 DROPDOWN MODERNO E EM CAIXA ALTA 🔥 */}
        {availableFilters.length > 1 && (
            <View style={{ paddingHorizontal: 20, paddingTop: 15 }}>
                {Platform.OS === 'web' ? (
                    <View style={[styles.pickerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <select 
                            value={activeFilter} 
                            onChange={(e) => setActiveFilter(e.target.value)} 
                            style={{ width: '100%', padding: 12, backgroundColor: 'transparent', color: theme.text, border: 'none', outline: 'none', fontSize: 13, fontWeight: 'bold' }}
                        >
                            {availableFilters.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c.toUpperCase()}</option>)}
                        </select>
                    </View>
                ) : (
                    <View style={[styles.pickerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Picker 
                            selectedValue={activeFilter} 
                            onValueChange={(val) => setActiveFilter(val)} 
                            style={{ color: theme.text }} 
                            dropdownIconColor={theme.accent}
                        >
                            {availableFilters.map(c => <Picker.Item key={c} label={c.toUpperCase()} value={c} />)}
                        </Picker>
                    </View>
                )}
            </View>
        )}

        {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{ color: theme.textSecondary, marginTop: 10, fontWeight: 'bold' }}>Carregando PA FLIX...</Text>
            </View>
        ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* 🔥 HERO BANNER GIGANTE 🔥 */}
                {heroItem && activeFilter === 'Tudo' && (
                    <View style={styles.heroContainer}>
                        <Image source={heroItem.image} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={300} priority="high" />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', theme.bg]} style={styles.heroGradient}>
                            <View style={styles.heroContentBox}>
                                <Text style={[styles.heroTag, { backgroundColor: theme.accent }]}>EM DESTAQUE</Text>
                                <Text style={styles.heroTitle} numberOfLines={2}>{heroItem.title}</Text>
                                {heroItem.subtitle ? <Text style={styles.heroSubtitle} numberOfLines={2}>{heroItem.subtitle}</Text> : null}
                                
                                <TouchableOpacity style={[styles.heroBtnMain, { backgroundColor: theme.accent }]} onPress={() => handlePressItem(heroItem)}>
                                    <MaterialCommunityIcons name="play" size={24} color="#000" />
                                    <Text style={[styles.heroBtnMainText, { color: '#000' }]}>Assistir</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* 🔥 SEÇÃO TOP 10 EM ALTA 🔥 */}
                {top10Items.length > 0 && activeFilter === 'Tudo' && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionMainTitle, { color: theme.text }]}>TOP 10 NO PA FLIX</Text>
                        <Text style={[styles.sectionSubTitle, { color: theme.textSecondary }]}>OS VÍDEOS MAIS ASSISTIDOS E COMENTADOS</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                            {top10Items.map((item, index) => <AnimatedCard key={`top-${item.id}`} item={item} isLarge={false} isTop10={true} index={index} onPress={handlePressItem} theme={theme} />)}
                        </ScrollView>
                    </View>
                )}

                {/* 🔥 PRATELEIRAS DINÂMICAS DO BANCO DE DADOS 🔥 */}
                {Object.keys(grouped).filter(cat => activeFilter === 'Tudo' || activeFilter === cat).map((categoriaName) => {
                    const groupItems = grouped[categoriaName];
                    const isLargeFormat = groupItems[0]?.type === 'ebook' || groupItems[0]?.type === 'audio';
                    
                    return (
                        <View key={categoriaName} style={styles.section}>
                            <Text style={[styles.sectionMainTitle, { color: theme.text, textTransform: 'uppercase' }]}>{categoriaName.toUpperCase()}</Text>
                            
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                                {groupItems.map(item => <AnimatedCard key={item.id} item={item} isLarge={isLargeFormat} isTop10={false} onPress={handlePressItem} theme={theme} />)}
                            </ScrollView>
                        </View>
                    );
                })}

                {/* 🔥 A VITRINE DE VIDRO (OS MATERIAIS TRANCADOS) */}
                {bloqueados.length > 0 && activeFilter === 'Tudo' && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>CONTEÚDO VIP (BLOQUEADO)</Text>
                        <Text style={[styles.sectionSubTitle, { color: theme.textSecondary, marginBottom: 15, marginTop: -5 }]}>Apenas Consultoria Premium ou Venda Avulsa</Text>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                            {bloqueados.map(item => <AnimatedCard key={item.id} item={item} isLarge={item.type === 'ebook'} isTop10={false} onPress={handlePressItem} theme={theme} />)}
                        </ScrollView>
                    </View>
                )}

                {contents.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="bookshelf" size={48} color={theme.textSecondary} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum conteúdo na biblioteca ainda.</Text>
                    </View>
                )}

            </ScrollView>
        )}

        <Modal visible={upsellModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: '#FFCC00' }]}>
                    <TouchableOpacity style={styles.upsellClose} onPress={() => setUpsellModalVisible(false)}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View style={[styles.upsellIconBox, { backgroundColor: '#FFCC0022', marginBottom: 20 }]}>
                        <MaterialCommunityIcons name="lock" size={36} color="#FFCC00" />
                    </View>
                    
                    <Text style={[styles.upsellTitle, { color: theme.text }]}>MATERIAL VIP</Text>
                    
                    <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>
                        O material <Text style={{color: '#FFCC00', fontWeight: 'bold'}}>{upsellContent?.title}</Text> faz parte do cofre exclusivo do <Text style={{fontWeight:'bold'}}>PA FLIX</Text>.
                    </Text>

                    <View style={[styles.upsellBenefits, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        {canBuyInApp && (
                            <View style={styles.upsellBenefitRow}>
                                <MaterialCommunityIcons name="check-circle" size={18} color="#FFCC00" />
                                <Text style={[styles.upsellBenefitText, { color: theme.text }]}>Acesso Imediato via PIX (Avulso)</Text>
                            </View>
                        )}
                        <View style={styles.upsellBenefitRow}>
                            <MaterialCommunityIcons name="check-circle" size={18} color="#FFCC00" />
                            <Text style={[styles.upsellBenefitText, { color: theme.text }]}>Ou Liberado no Plano Premium</Text>
                        </View>
                    </View>

                    {upsellContent?.valor > 0 && canBuyInApp && (
                        <TouchableOpacity
                            style={[styles.upsellBtn, { backgroundColor: theme.accent, shadowColor: theme.accent, marginBottom: 12 }]}
                            onPress={() => {
                                setUpsellModalVisible(false);
                                setPurchaseModalVisible(true);
                            }}
                        >
                            <Text style={[styles.upsellBtnText, { color: '#000' }]}>
                                COMPRAR AGORA — R$ {Number(upsellContent.valor).toFixed(2).replace('.', ',')}
                            </Text>
                            <MaterialCommunityIcons name="lock-open-variant" size={20} color="#000" style={{marginLeft: 8}}/>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.upsellBtn, { backgroundColor: '#25D366', shadowColor: '#25D366' }]}
                        onPress={() => {
                            setUpsellModalVisible(false);
                            const msg = `Coach, tenho interesse em acessar o material VIP "${upsellContent?.title}" lá no PA FLIX. Como faço?`;
                            Linking.openURL(`https://wa.me/5541997991346?text=${encodeURIComponent(msg)}`);
                        }}
                    >
                        <Text style={[styles.upsellBtnText, { color: '#FFF' }]}>CHAMAR NO WHATSAPP</Text>
                        <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" style={{marginLeft: 8}}/>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        <ContentPurchaseModal
            visible={purchaseModalVisible}
            onClose={() => setPurchaseModalVisible(false)}
            theme={theme}
            userId={userId}
            content={upsellContent}
            onPurchased={fetchBibliotecaData}
        />

      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15 },
  headerSubtitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 5 },
  
  heroContainer: { width: '100%', height: 450, position: 'relative', marginTop: 15 },
  heroGradient: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  heroContentBox: { alignItems: 'center', paddingBottom: 10 },
  heroTag: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 10, marginBottom: 5 },
  heroSubtitle: { color: '#CCC', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 10 },
  heroBtnMain: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 35, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.3, shadowRadius: 5 },
  heroBtnMainText: { fontWeight: '900', fontSize: 15, marginLeft: 6 },

  section: { marginTop: 25 },
  sectionMainTitle: { fontSize: 22, fontWeight: '900', paddingHorizontal: 20, marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '900', paddingHorizontal: 20, marginBottom: 15 },
  sectionSubTitle: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 15, textTransform: 'uppercase' },
  carouselContainer: { paddingHorizontal: 15, paddingBottom: 10, gap: 15 },
  
  cardImageWrapper: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', position: 'relative' },
  cardGradient: { flex: 1, justifyContent: 'space-between', padding: 12 },
  audioIconWrapper: { alignSelf: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 12 },
  unlockedBottom: { marginTop: 'auto', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 2, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  cardSub: { fontSize: 10, color: '#CCC', fontWeight: 'bold', textAlign: 'center', marginBottom: 5, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  actionBtnText: { fontSize: 12, fontWeight: '900' },
  invisibleSpacer: { height: 10 },
  lockedCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lockedTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 10, marginBottom: 5, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  lockedSub: { fontSize: 10, textAlign: 'center', marginTop: 2 },
  
  top10Number: { position: 'absolute', left: -5, bottom: -15, fontSize: 90, fontWeight: '900', zIndex: 1, textShadowRadius: 2, textShadowOffset: {width: 1, height: 1} },

  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 5 },
  progressBarBg: { flex: 1, height: 4, borderRadius: 2 },
  progressBarFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10, fontWeight: 'bold', marginLeft: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
  emptyText: { textAlign: 'center', marginTop: 15, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  upsellCard: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 25, borderRadius: 24, borderWidth: 2, alignItems: 'center' },
  upsellClose: { position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 10 },
  upsellIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  upsellTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, letterSpacing: 1, textAlign: 'center' },
  upsellDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  upsellBenefits: { width: '100%', padding: 15, borderRadius: 16, borderWidth: 1, gap: 12, marginBottom: 25 },
  upsellBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  upsellBenefitText: { fontSize: 13, fontWeight: 'bold' },
  upsellBtn: { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  upsellBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});