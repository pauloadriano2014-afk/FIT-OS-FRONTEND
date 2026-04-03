// src/screens/AdminStudentCheckinsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Platform, StatusBar, Image, Modal, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminStudentCheckinsScreen({ route, navigation }) {
  const { aluno } = route.params;
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
      fetchCheckins();
  }, []);

  const fetchCheckins = async () => {
      setLoading(true);
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/checkin?userId=${aluno.id}`);
          if (res.ok) {
              const data = await res.json();
              setCheckins(data);
          }
      } catch (e) {
          console.log("Erro ao buscar checkins:", e);
      } finally {
          setLoading(false);
      }
  };

  const handleDelete = (id) => {
      const confirmDelete = async () => {
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/checkin?id=${id}`, { method: 'DELETE' });
              if (res.ok) {
                  setCheckins(prev => prev.filter(c => c.id !== id));
                  if (Platform.OS === 'web') window.alert("Check-in excluído com sucesso!");
              } else {
                  if (Platform.OS === 'web') window.alert("Erro ao excluir.");
                  else Alert.alert("Erro", "Falha ao excluir.");
              }
          } catch (e) {
              if (Platform.OS === 'web') window.alert("Erro de conexão.");
              else Alert.alert("Erro", "Falha na conexão.");
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm("Atenção: Isso apagará este check-in permanentemente. Confirmar?")) confirmDelete();
      } else {
          Alert.alert("Excluir", "Isso apagará este check-in e as fotos dele permanentemente. Confirmar?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Excluir", style: "destructive", onPress: confirmDelete }
          ]);
      }
  };

  const openPhoto = (uri) => {
      if (!uri) return;
      setSelectedPhoto(uri);
      setModalVisible(true);
  };

  const handleDownloadPhoto = async (url, photoType) => {
      if (!url) return;
      const alunoNome = aluno?.name ? aluno.name.replace(/\s+/g, '_') : 'aluno';
      const fileName = `Checkin_${alunoNome}_${photoType}.jpg`;
      
      if (Platform.OS === 'web') {
          try {
              const response = await fetch(url);
              const blob = await response.blob();
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          } catch (e) {
              window.open(url, '_blank'); 
          }
      } else {
          Linking.openURL(url); 
      }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
            
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>CHECK-INS DE</Text>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }}>{aluno.name.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={fetchCheckins} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name="refresh" size={24} color={theme.accent}/>
                </TouchableOpacity>
            </View>

            {/* 🔥 CORREÇÃO DO SCROLL: Adicionado style={{ flex: 1 }} aqui */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{padding: 20, paddingBottom: 100}} showsVerticalScrollIndicator={false}>
                {loading ? <ActivityIndicator color={theme.accent} size="large" style={{marginTop: 50}} /> : (
                    checkins.length === 0 ? (
                        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="camera-off" size={48} color={theme.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Este aluno ainda não enviou nenhum check-in pelo aplicativo.</Text>
                        </View>
                    ) : (
                        checkins.map(item => (
                            <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.cardHeader}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                        <MaterialCommunityIcons name="calendar-check" size={16} color={theme.accent} />
                                        <Text style={[styles.dateText, { color: theme.text }]}>
                                            {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={{padding: 5}}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>

                                {item.weight ? (
                                    <View style={styles.dataRow}>
                                        <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Peso Relatado:</Text>
                                        <Text style={[styles.dataValue, { color: theme.text }]}>{item.weight} kg</Text>
                                    </View>
                                ) : null}

                                {item.feedback ? (
                                    <View style={styles.feedbackBox}>
                                        <Text style={[styles.dataLabel, { color: theme.textSecondary, marginBottom: 5 }]}>Feedback do Aluno:</Text>
                                        <Text style={[styles.feedbackText, { color: theme.text }]}>"{item.feedback}"</Text>
                                    </View>
                                ) : null}

                                <Text style={[styles.dataLabel, { color: theme.textSecondary, marginTop: 15, marginBottom: 10 }]}>Fotos Obrigatórias:</Text>
                                <View style={styles.photoGrid}>
                                    {item.photoFront ? (
                                        <View style={styles.photoThumb}>
                                            <TouchableOpacity onPress={() => openPhoto(item.photoFront)} style={{ width: '100%', alignItems: 'center' }}>
                                                <Image source={{uri: item.photoFront}} style={[styles.photo, { borderColor: theme.border }]} />
                                            </TouchableOpacity>
                                            <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>FRENTE</Text>
                                            <TouchableOpacity style={[styles.downloadBtn, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => handleDownloadPhoto(item.photoFront, 'FRENTE')}>
                                                <MaterialCommunityIcons name="download" size={14} color={theme.text} />
                                                <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}
                                    
                                    {item.photoSide ? (
                                        <View style={styles.photoThumb}>
                                            <TouchableOpacity onPress={() => openPhoto(item.photoSide)} style={{ width: '100%', alignItems: 'center' }}>
                                                <Image source={{uri: item.photoSide}} style={[styles.photo, { borderColor: theme.border }]} />
                                            </TouchableOpacity>
                                            <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>LADO</Text>
                                            <TouchableOpacity style={[styles.downloadBtn, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => handleDownloadPhoto(item.photoSide, 'LADO')}>
                                                <MaterialCommunityIcons name="download" size={14} color={theme.text} />
                                                <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}
                                    
                                    {item.photoBack ? (
                                        <View style={styles.photoThumb}>
                                            <TouchableOpacity onPress={() => openPhoto(item.photoBack)} style={{ width: '100%', alignItems: 'center' }}>
                                                <Image source={{uri: item.photoBack}} style={[styles.photo, { borderColor: theme.border }]} />
                                            </TouchableOpacity>
                                            <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>COSTA</Text>
                                            <TouchableOpacity style={[styles.downloadBtn, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => handleDownloadPhoto(item.photoBack, 'COSTAS')}>
                                                <MaterialCommunityIcons name="download" size={14} color={theme.text} />
                                                <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}
                                    
                                    {!item.photoFront && !item.photoSide && !item.photoBack && (
                                        <Text style={{color: theme.textSecondary, fontSize: 12, fontStyle: 'italic'}}>Nenhuma foto base enviada.</Text>
                                    )}
                                </View>

                                {item.extraPhotos && item.extraPhotos.length > 0 && (
                                    <View style={{marginTop: 15}}>
                                        <Text style={[styles.dataLabel, { color: theme.textSecondary, marginBottom: 10 }]}>Fotos Extras (Poses Livres):</Text>
                                        <View style={[styles.photoGrid, { flexWrap: 'wrap' }]}>
                                            {item.extraPhotos.map((uri, index) => (
                                                <View key={index} style={[styles.photoThumb, { width: '31%', marginBottom: 15, flex: 'none' }]}>
                                                    <TouchableOpacity onPress={() => openPhoto(uri)} style={{ width: '100%', alignItems: 'center' }}>
                                                        <Image source={{uri}} style={[styles.photo, { borderColor: theme.border }]} />
                                                    </TouchableOpacity>
                                                    <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>EXTRA {index + 1}</Text>
                                                    <TouchableOpacity style={[styles.downloadBtn, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => handleDownloadPhoto(uri, `EXTRA_${index + 1}`)}>
                                                        <MaterialCommunityIcons name="download" size={14} color={theme.text} />
                                                        <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                            </View>
                        ))
                    )
                )}
            </ScrollView>
        </View>

        <Modal visible={modalVisible} transparent animationType="fade">
            <View style={styles.modalBg}>
                <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                {selectedPhoto && (
                    <Image source={{ uri: selectedPhoto }} style={styles.fullImage} resizeMode="contain" />
                )}
            </View>
        </Modal>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems:'center', borderBottomWidth:1 },
  headerTitle: { fontWeight:'900', fontSize:14, letterSpacing: 1 },
  
  emptyBox: { alignItems:'center', padding: 40, borderStyle:'dashed', borderWidth:1, borderRadius:16, marginVertical: 20 },
  emptyText: { textAlign: 'center', marginTop: 15, fontWeight: 'bold' },

  card: { padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)', paddingBottom: 10 },
  dateText: { fontWeight: 'bold', fontSize: 13 },
  
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dataLabel: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  dataValue: { fontSize: 16, fontWeight: '900' },
  
  feedbackBox: { marginTop: 10, padding: 15, borderRadius: 12, backgroundColor: 'rgba(128,128,128,0.05)' },
  feedbackText: { fontStyle: 'italic', fontSize: 14, lineHeight: 20 },

  photoGrid: { flexDirection: 'row', gap: 10 },
  photoThumb: { flex: 1, alignItems: 'center' },
  photo: { width: '100%', height: 120, borderRadius: 8, borderWidth: 1, backgroundColor: '#000' },
  photoLabel: { fontSize: 9, fontWeight: 'bold', marginTop: 8 },

  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, gap: 4, width: '100%' },
  downloadText: { fontSize: 9, fontWeight: '900' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: '100%', height: '80%' }
});