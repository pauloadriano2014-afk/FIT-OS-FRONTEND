import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Alert, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function FinishScreen({ route, navigation }) {
  // Recebe os dados vindos do DayWorkoutScreen
  const { workoutName, day, xp, duration, volume } = route.params || {};
  
  const viewShotRef = useRef();
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Erro", "Compartilhamento não disponível neste dispositivo.");
        return;
      }
      
      // Captura a imagem do Card
      const uri = await viewShotRef.current.capture();
      
      // Abre o menu de compartilhamento nativo
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível gerar a imagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.content}>
        
        <Text style={styles.title}>TREINO CONCLUÍDO! 🔥</Text>
        <Text style={styles.subtitle}>Confira seu desempenho:</Text>

        {/* --- ÁREA QUE SERÁ TRANSFORMADA EM IMAGEM --- */}
        <ViewShot ref={viewShotRef} style={styles.shareCard} options={{ format: "jpg", quality: 0.9 }}>
            
            <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="check-decagram" size={40} color="#000" />
                <View>
                    <Text style={styles.brandName}>FITOS TEAM</Text>
                    <Text style={styles.date}>{new Date().toLocaleDateString('pt-BR')}</Text>
                </View>
            </View>

            <Text style={styles.workoutName}>{workoutName || "TREINO"}</Text>
            <Text style={styles.workoutDay}>DIA {day} FINALIZADO</Text>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>+{xp || 0}</Text>
                    <Text style={styles.statLabel}>XP GANHO</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{duration || '60m'}</Text>
                    <Text style={styles.statLabel}>TEMPO</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{Math.round((volume || 0)/1000)}k</Text>
                    <Text style={styles.statLabel}>KG TOTAL</Text>
                </View>
            </View>

            <View style={styles.footerBrand}>
                <Text style={styles.footerText}>Treino registrado via App Fitos</Text>
            </View>

        </ViewShot>
        {/* --------------------------------------------- */}

        <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={loading}>
                <MaterialCommunityIcons name="share-variant" size={24} color="#000" />
                <Text style={styles.shareBtnText}>{loading ? "GERANDO..." : "COMPARTILHAR CARD"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.navigate('Main')}>
                <Text style={styles.closeBtnText}>VOLTAR PARA O INÍCIO</Text>
            </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  
  title: { color: '#CCFF00', fontSize: 24, fontWeight: '900', marginBottom: 5 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 30 },

  // CARD AMARELO
  shareCard: { width: width * 0.85, backgroundColor: '#CCFF00', borderRadius: 20, padding: 30, alignItems: 'center' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, width: '100%' },
  brandName: { fontSize: 18, fontWeight: '900', color: '#000' },
  date: { fontSize: 10, fontWeight: 'bold', color: '#444' },
  
  workoutName: { color: '#000', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 5 },
  workoutDay: { color: '#000', fontSize: 12, fontWeight: 'bold', marginBottom: 25, backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', backgroundColor: '#FFF', padding: 15, borderRadius: 15 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#000' },
  statLabel: { fontSize: 9, fontWeight: 'bold', color: '#666' },
  divider: { width: 1, height: '100%', backgroundColor: '#EEE' },

  footerBrand: { marginTop: 15 },
  footerText: { fontSize: 8, fontWeight: 'bold', color: 'rgba(0,0,0,0.4)' },

  // BOTOES
  buttonsContainer: { width: '100%', marginTop: 40, gap: 15 },
  shareBtn: { flexDirection: 'row', backgroundColor: '#FFF', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10 },
  shareBtnText: { color: '#000', fontWeight: '900', fontSize: 14 },
  
  closeBtn: { padding: 15, alignItems: 'center' },
  closeBtnText: { color: '#666', fontWeight: 'bold' }
});