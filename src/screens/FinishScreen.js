import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Alert, StatusBar, Image, ImageBackground, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

// Função cirúrgica para extrair o link real da imagem na Web
const getLogoWebUri = () => {
  const asset = require('../../assets/paelite.jpg');
  if (typeof asset === 'string') return asset;
  if (asset.uri) return asset.uri;
  if (Image.resolveAssetSource) {
      const source = Image.resolveAssetSource(asset);
      return source ? source.uri : asset;
  }
  return asset;
};

export default function FinishScreen({ route, navigation }) {
  const { workoutName, day, xp, duration, rpeLabel } = route.params || {};
  
  const viewShotRef = useRef();
  const [loading, setLoading] = useState(false);
  const [preloadedFile, setPreloadedFile] = useState(null);

  // 🔥 PRÉ-GERAÇÃO DO CARD PARA O PWA 🔥
  useEffect(() => {
    if (Platform.OS === 'web') {
      setTimeout(async () => {
        try {
          const html2canvas = require('html2canvas');
          const html2canvasFunc = html2canvas.default || html2canvas;
          
          const element = document.getElementById('share-card-web');
          if (element) {
            const canvas = await html2canvasFunc(element, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#000',
                scale: 3 // Escala 3x é o ponto doce perfeito para telas Retina
            });

            // 🔥 MUDANÇA PARA PNG PARA SALVAR AS CORES NEON 🔥
            const dataUrl = canvas.toDataURL('image/png'); 
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            
            const blob = new Blob([ab], { type: mimeString });
            const file = new File([blob], 'treino_concluido.png', { type: 'image/png' });
            
            setPreloadedFile(file);
          }
        } catch (e) {
          console.log("Preload do canvas falhou silenciosamente", e);
        }
      }, 2500); 
    }
  }, []);

  const handleShare = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        if (preloadedFile && navigator.canShare && navigator.canShare({ files: [preloadedFile] })) {
            try {
                await navigator.share({
                    files: [preloadedFile],
                    title: 'Treino Pago!',
                    text: `🔥 Treino ${workoutName || 'do dia'} pago na consultoria PA Elite Team!\n💪 Intensidade: ${rpeLabel || 'MÁXIMA'}\n\nFaça parte da Elite!`
                });
            } catch (shareError) {
                // Usuário apenas fechou o painel de share nativo do iOS/Android
            }
        } else {
            // FALLBACK SE O DISPOSITIVO FOR ANTIGO
            if (navigator.share) {
                await navigator.share({
                    title: 'Treino Pago!',
                    text: `🔥 Treino ${workoutName || 'do dia'} pago na consultoria PA Elite Team!\n💪 Intensidade: ${rpeLabel || 'MÁXIMA'}\n\nTire um print do seu card para postar e nos marcar!`
                });
            } else {
                window.alert("📸 Tire um print (screenshot) do seu card para postar e marque o PA Elite Team!");
            }
        }
      } else {
        // 🔥 FLUXO DO APLICATIVO NATIVO NAS LOJAS 🔥
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert("Erro", "Compartilhamento não disponível no seu dispositivo.");
          return;
        }
        const uri = await viewShotRef.current.capture();
        await Sharing.shareAsync(uri, { 
            dialogTitle: 'Compartilhar Treino Pago',
            mimeType: 'image/png' // Atualizado para PNG também no nativo para máxima qualidade
        });
      }
    } catch (error) {
       // Silenciado para não gerar popups chatos
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const safeDay = day || '';
  const dayText = safeDay.length <= 2 
    ? `DIA ${safeDay.toUpperCase()} FINALIZADO` 
    : `${safeDay.toUpperCase()} FINALIZADO`;

  const CardContent = () => (
    <View nativeID="share-card-web" style={styles.shareCard}>
      <View style={styles.cardInnerBg} />
      
      {/* 🔥 TRUQUE DE MESTRE PARA LER OS 1080p REAIS NA WEB 🔥 */}
      {Platform.OS === 'web' ? (
        <img 
          src={getLogoWebUri()} 
          alt="Logo Elite"
          style={{ width: 150, height: 150, objectFit: 'contain', marginBottom: 20, zIndex: 1, position: 'relative' }} 
        />
      ) : (
        <Image 
          source={require('../../assets/paelite.jpg')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      )}

      <Text style={styles.workoutTitle}>{workoutName || "TREINO DO DIA"}</Text>
      <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>{dayText}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>+{xp || 0}</Text>
          <Text style={styles.statLab}>XP GANHO</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{duration || '0'}m</Text>
          <Text style={styles.statLab}>MINUTOS</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={[styles.statVal, {fontSize: 14, color: '#4DE38F'}]}>{rpeLabel || 'MÁXIMA'}</Text>
          <Text style={styles.statLab}>INTENSIDADE</Text>
        </View>
      </View>
      <Text style={styles.brandFooter}>PA Elite Team</Text>
    </View>
  );

  return (
    <View style={[styles.container, Platform.OS === 'web' && styles.pwaFix]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ImageBackground 
        source={{uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop'}} 
        style={styles.bg} 
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            
            <ScrollView 
              style={{ flex: 1, width: '100%' }} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              
              <MaterialCommunityIcons name="lightning-bolt" size={60} color="#4DE38F" style={styles.glowIcon} />
              <Text style={styles.title}>TREINO PAGO! 🔥</Text>
              <Text style={styles.subtitle}>Sua consistência é o que gera resultados.</Text>

              {Platform.OS === 'web' ? (
                  <View>
                    <CardContent />
                  </View>
              ) : (
                  <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }}>
                    <CardContent />
                  </ViewShot>
              )}

              <View style={styles.footer}>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={loading}>
                  <MaterialCommunityIcons name={Platform.OS === 'web' ? "share-variant" : "instagram"} size={24} color="#000" />
                  <Text style={styles.shareBtnText}>{loading ? "ABRINDO..." : (Platform.OS === 'web' ? "COMPARTILHAR NO INSTAGRAM" : "COMPARTILHAR TREINO")}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.backBtn} onPress={handleFinish}>
                  <Text style={styles.backBtnText}>VOLTAR PARA O INÍCIO</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  pwaFix: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }, 
  
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  safeArea: { flex: 1 },
  
  scrollContent: { 
    flexGrow: 1, 
    alignItems: 'center', 
    paddingHorizontal: 25,
    paddingTop: 50, 
    paddingBottom: 80 
  },
  
  glowIcon: {
    shadowColor: '#4DE38F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  title: { color: '#4DE38F', fontSize: 32, fontWeight: '900', marginTop: 10, letterSpacing: 1 },
  subtitle: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', marginBottom: 30, fontWeight: '500' },

  shareCard: { 
    width: width > 400 ? 360 : width * 0.85, 
    borderRadius: 24, 
    padding: 30, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#4DE38F40',
    overflow: 'hidden', 
    position: 'relative'
  },
  cardInnerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.95)', 
  },
  logo: { width: 150, height: 150, marginBottom: 20, zIndex: 1 },
  workoutTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center', zIndex: 1, letterSpacing: 0.5 },
  
  dayBadge: { backgroundColor: '#4DE38F', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, marginTop: 15, marginBottom: 25, zIndex: 1 },
  dayBadgeText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  statsRow: { 
    flexDirection: 'row', 
    width: '100%', 
    justifyContent: 'space-between', 
    backgroundColor: '#141414', 
    paddingVertical: 18, 
    paddingHorizontal: 10,
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#222',
    zIndex: 1 
  },
  statBox: { alignItems: 'center', flex: 1 },
  statVal: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  statLab: { color: '#666', fontSize: 9, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  divider: { width: 1, height: 35, backgroundColor: '#333', alignSelf: 'center' },
  
  brandFooter: { color: '#444', fontSize: 11, fontWeight: '900', letterSpacing: 5, marginTop: 30, zIndex: 1 },

  footer: { width: '100%', maxWidth: 400, marginTop: 40 },
  shareBtn: { backgroundColor: '#4DE38F', flexDirection: 'row', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 12 },
  shareBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  backBtn: { marginTop: 25, padding: 10 },
  backBtnText: { color: '#888', textAlign: 'center', fontWeight: '800', fontSize: 13, letterSpacing: 1 }
});
