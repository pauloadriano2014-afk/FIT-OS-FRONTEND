import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Alert, StatusBar, Image, ImageBackground } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function FinishScreen({ route, navigation }) {
  // 🔥 RECEBE OS NOVOS DADOS DO DAYWORKOUT: rpeLabel e focus
  const { workoutName, day, xp, duration, rpeLabel, focus } = route.params || {};
  
  const viewShotRef = useRef();
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Erro", "Compartilhamento não disponível.");
        return;
      }
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar card.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground 
        source={{uri: 'https://img.freepik.com/free-photo/dark-gym-background_23-2150330606.jpg'}} 
        style={styles.bg} 
        blurRadius={15}
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.content}>
            
            <MaterialCommunityIcons name="trophy-variant" size={60} color="#CCFF00" />
            <Text style={styles.title}>TREINO PAGO! 🔥</Text>
            <Text style={styles.subtitle}>Sua consistência é o que gera resultados.</Text>

            {/* CARD PARA COMPARTILHAR */}
            <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
              <View style={styles.shareCard}>
                <Image 
                  source={require('../../assets/pateam_icon.png')} 
                  style={styles.logo} 
                  resizeMode="contain" 
                />
                
                <Text style={styles.workoutTitle}>{workoutName || "TREINO DO DIA"}</Text>
                
                {/* 🔥 NOVO: EXIBE O FOCO DO TREINO */}
                <View style={styles.focusBadge}>
                    <Text style={styles.focusBadgeText}>FOCO: {focus || 'GERAL'}</Text>
                </View>

                <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>DIA {day} FINALIZADO</Text>
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
                  
                  {/* 🔥 TROCADO: SAI VOLUME (NaN), ENTRA INTENSIDADE (RPE) */}
                  <View style={styles.statBox}>
                    <Text style={[styles.statVal, {fontSize: 12, color: '#CCFF00'}]}>{rpeLabel || 'MÁXIMA'}</Text>
                    <Text style={styles.statLab}>INTENSIDADE</Text>
                  </View>
                </View>

                <Text style={styles.brandFooter}>COACH PAULO TEAM</Text>
              </View>
            </ViewShot>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={loading}>
                <MaterialCommunityIcons name="instagram" size={24} color="#000" />
                <Text style={styles.shareBtnText}>{loading ? "PREPARANDO..." : "COMPARTILHAR NO INSTA"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Main')}>
                <Text style={styles.backBtnText}>VOLTAR PARA O INÍCIO</Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 },
  
  title: { color: '#CCFF00', fontSize: 28, fontWeight: '900', marginTop: 15, letterSpacing: 1 },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 40 },

  shareCard: { 
    width: width * 0.88, 
    backgroundColor: '#111', 
    borderRadius: 35, 
    padding: 30, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#222',
    shadowColor: '#CCFF00',
    shadowOpacity: 0.15,
    shadowRadius: 30
  },
  logo: { width: 80, height: 80, marginBottom: 20 },
  workoutTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  
  focusBadge: { marginTop: 5 },
  focusBadgeText: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },

  dayBadge: { backgroundColor: '#CCFF00', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginTop: 15, marginBottom: 25 },
  dayBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },

  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', backgroundColor: '#000', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  statBox: { alignItems: 'center', flex: 1 },
  statVal: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  statLab: { color: '#555', fontSize: 9, fontWeight: 'bold', marginTop: 4 },
  divider: { width: 1, height: 30, backgroundColor: '#222' },
  
  brandFooter: { color: '#333', fontSize: 12, fontWeight: 'bold', letterSpacing: 4, marginTop: 30 },

  footer: { width: '100%', marginTop: 50 },
  shareBtn: { backgroundColor: '#CCFF00', flexDirection: 'row', padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 12 },
  shareBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
  backBtn: { marginTop: 20, padding: 10 },
  backBtnText: { color: '#666', textAlign: 'center', fontWeight: 'bold', fontSize: 14 }
});