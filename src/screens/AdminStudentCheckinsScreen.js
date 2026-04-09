// src/screens/AdminStudentCheckinsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Platform, StatusBar, Image, Modal, Linking, TextInput, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminStudentCheckinsScreen({ route, navigation }) {
  const { theme } = useTheme();

  // 🔥 BLINDAGEM MÁXIMA: Lê os parâmetros soltos da URL para evitar [object Object]
  const rawId = route.params?.alunoId || route.params?.aluno?.id || '';
  const rawName = route.params?.alunoName || route.params?.aluno?.name || 'ALUNO';
  const aluno = { id: rawId, name: rawName };

  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [evaluationModalVisible, setEvaluationModalVisible] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [evaluationType, setEvaluationType] = useState('initial');
  const [currentCheckinForEval, setCurrentCheckinForEval] = useState(null);
  
  const [selectedOldCheckinId, setSelectedOldCheckinId] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingEvaluation, setSendingEvaluation] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
      if (aluno.id) {
          fetchCheckins();
      } else {
          setLoading(false);
      }
  }, [aluno.id]);

  const fetchCheckins = async () => {
      setLoading(true);
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/checkin?userId=${aluno.id}&t=${Date.now()}`);
          if (res.ok) {
              const data = await res.json();
              const sorted = data.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
              setCheckins(sorted);
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

  const openEvaluationPanel = (checkin, type) => {
      setCurrentCheckinForEval(checkin);
      setEvaluationType(type);
      setFeedbackText(checkin.coachFeedback || ''); 

      if (type === 'comparison') {
          const currentIdx = checkins.findIndex(c => c.id === checkin.id);
          const olderCheckins = checkins.slice(currentIdx + 1);
          
          if (olderCheckins.length > 0) {
              setSelectedOldCheckinId(olderCheckins[olderCheckins.length - 1].id);
          }
      } else {
          setSelectedOldCheckinId(null);
      }
      
      setEvaluationModalVisible(true);
  };

  const getOldCheckin = () => {
      if (!selectedOldCheckinId) return null;
      return checkins.find(c => c.id === selectedOldCheckinId);
  };

  const generateAIFeedback = async () => {
      setIsGeneratingAI(true);
      try {
          const payload = { 
              checkInId: currentCheckinForEval.id,
              oldCheckInId: evaluationType === 'comparison' ? selectedOldCheckinId : null 
          };

          const res = await fetch('https://fitos-final.onrender.com/api/ai/evaluate-checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error("Falha na geração do Motor");

          const data = await res.json();

          if (data.analysis) {
              setFeedbackText(data.analysis);
          } else {
              throw new Error("Feedback veio vazio.");
          }

      } catch (error) {
          console.error("Erro IA:", error);
          const msgErro = "O motor de IA falhou. Verifique o console ou tente novamente.";
          if (Platform.OS === 'web') window.alert(msgErro);
          else Alert.alert("Erro", msgErro);
      } finally {
          setIsGeneratingAI(false);
      }
  };

  const submitEvaluation = async () => {
      if (!feedbackText.trim()) {
          const msg = "O texto da avaliação não pode estar vazio.";
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert("Atenção", msg);
          return;
      }

      setSendingEvaluation(true);
      try {
          const res = await fetch('https://fitos-final.onrender.com/api/checkin/evaluate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  checkinId: currentCheckinForEval.id,
                  coachFeedback: feedbackText
              })
          });

          if (res.ok) {
              setCheckins(prev => prev.map(c => 
                  c.id === currentCheckinForEval.id ? { ...c, coachFeedback: feedbackText } : c
              ));
              
              if (Platform.OS === 'web') window.alert(currentCheckinForEval.coachFeedback ? "Avaliação editada e salva com sucesso!" : "Avaliação enviada com sucesso! O aluno foi notificado.");
              else Alert.alert("Sucesso!", currentCheckinForEval.coachFeedback ? "Avaliação editada com sucesso." : "Avaliação enviada com sucesso! O aluno foi notificado.");
              
              setEvaluationModalVisible(false);
          } else {
              throw new Error("Erro ao salvar no banco.");
          }
      } catch (error) {
          console.error("Erro salvar eval:", error);
          if (Platform.OS === 'web') window.alert("Erro ao salvar avaliação.");
          else Alert.alert("Erro", "Falha ao salvar avaliação.");
      } finally {
          setSendingEvaluation(false);
      }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={[
      styles.container, 
      { 
        backgroundColor: isWeb ? webOuterBg : theme.bg,
        ...(isWeb ? { height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}) 
      }
    ]}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        <View style={{ 
          flex: 1, 
          minHeight: 0,
          width: '100%', 
          maxWidth: isWeb ? 480 : '100%', 
          alignSelf: 'center', 
          backgroundColor: theme.bg, 
          overflow: 'hidden',
          ...(isWeb ? { display: 'flex', flexDirection: 'column', borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) 
        }}>
            
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

            <View style={{ flex: 1, position: 'relative' }}>
            <ScrollView 
              style={isWeb ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' } : { flex: 1 }} 
              contentContainerStyle={{ padding: 20 }}
            >
                {loading ? <ActivityIndicator color={theme.accent} size="large" style={{marginTop: 50}} /> : (
                    checkins.length === 0 ? (
                        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="camera-off" size={48} color={theme.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Este aluno ainda não enviou nenhum check-in pelo aplicativo.</Text>
                        </View>
                    ) : (
                        checkins.map((item, index) => {
                            const isOldest = index === checkins.length - 1;
                            const isEvaluated = !!item.coachFeedback;

                            return (
                                <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    
                                    <View style={styles.cardHeader}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                            <MaterialCommunityIcons name="calendar-check" size={16} color={theme.accent} />
                                            <Text style={[styles.dateText, { color: theme.text }]}>
                                                {new Date(item.date || item.createdAt).toLocaleDateString('pt-BR')} às {new Date(item.date || item.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{padding: 5}}>
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15}}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                            <View style={[styles.badge, { backgroundColor: isOldest ? '#FF950022' : theme.accent + '22', borderColor: isOldest ? '#FF9500' : theme.accent }]}>
                                                <Text style={[styles.badgeText, { color: isOldest ? '#FF9500' : theme.accent }]}>
                                                    {isOldest ? 'PONTO DE PARTIDA' : 'AVALIAÇÃO'}
                                                </Text>
                                            </View>
                                            {isEvaluated && (
                                                <View style={[styles.badge, { backgroundColor: '#34C75922', borderColor: '#34C759' }]}>
                                                    <MaterialCommunityIcons name="check" size={10} color="#34C759" style={{marginRight: 2}} />
                                                    <Text style={[styles.badgeText, { color: '#34C759' }]}>AVALIADO</Text>
                                                </View>
                                            )}
                                        </View>

                                        {item.allowMarketing && (
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                                                <MaterialCommunityIcons name="instagram" size={14} color="#BF5AF2" />
                                                <Text style={{fontSize: 9, fontWeight: 'bold', color: '#BF5AF2'}}>AUTORIZADO</Text>
                                            </View>
                                        )}
                                    </View>

                                    {item.weight ? (
                                        <View style={styles.dataRow}>
                                            <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Peso Relatado:</Text>
                                            <Text style={[styles.dataValue, { color: theme.text }]}>{item.weight} kg</Text>
                                        </View>
                                    ) : null}

                                    <Text style={[styles.dataLabel, { color: theme.textSecondary, marginTop: 10, marginBottom: 10 }]}>Fotos Base:</Text>
                                    <View style={styles.photoGrid}>
                                        {item.photoFront ? (
                                            <View style={styles.photoThumb}>
                                                <TouchableOpacity onPress={() => openPhoto(item.photoFront)} style={{ width: '100%', alignItems: 'center' }}>
                                                    <Image source={{uri: item.photoFront}} style={[styles.photo, { borderColor: theme.border }]} />
                                                </TouchableOpacity>
                                                <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>FRENTE</Text>
                                            </View>
                                        ) : null}
                                        
                                        {item.photoSide ? (
                                            <View style={styles.photoThumb}>
                                                <TouchableOpacity onPress={() => openPhoto(item.photoSide)} style={{ width: '100%', alignItems: 'center' }}>
                                                    <Image source={{uri: item.photoSide}} style={[styles.photo, { borderColor: theme.border }]} />
                                                </TouchableOpacity>
                                                <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>LADO</Text>
                                            </View>
                                        ) : null}
                                        
                                        {item.photoBack ? (
                                            <View style={styles.photoThumb}>
                                                <TouchableOpacity onPress={() => openPhoto(item.photoBack)} style={{ width: '100%', alignItems: 'center' }}>
                                                    <Image source={{uri: item.photoBack}} style={[styles.photo, { borderColor: theme.border }]} />
                                                </TouchableOpacity>
                                                <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>COSTA</Text>
                                            </View>
                                        ) : null}
                                        
                                        {!item.photoFront && !item.photoSide && !item.photoBack && (
                                            <Text style={{color: theme.textSecondary, fontSize: 12, fontStyle: 'italic'}}>Nenhuma foto base enviada.</Text>
                                        )}
                                    </View>

                                    <TouchableOpacity 
                                        style={[styles.aiButton, { backgroundColor: isEvaluated ? theme.surface : theme.accent, borderColor: isEvaluated ? theme.border : theme.accent }]} 
                                        onPress={() => openEvaluationPanel(item, isOldest ? 'initial' : 'comparison')}
                                    >
                                        <MaterialCommunityIcons name={isEvaluated ? "pencil" : "robot-outline"} size={18} color={isEvaluated ? theme.text : (theme.isDark ? '#000' : '#FFF')} />
                                        <Text style={[styles.aiButtonText, { color: isEvaluated ? theme.text : (theme.isDark ? '#000' : '#FFF') }]}>
                                            {isEvaluated ? "EDITAR AVALIAÇÃO" : (isOldest ? "AVALIAR PONTO DE PARTIDA" : "COMPARAR EVOLUÇÃO")}
                                        </Text>
                                    </TouchableOpacity>

                                </View>
                            )
                        })
                    )
                )}
            </ScrollView>
            </View>
        </View>

        {/* Modal de Avaliação */}
        {evaluationModalVisible && (
            <View style={styles.modalBgAbsolute}>
                <View style={[styles.evalModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={[styles.evalHeader, { borderBottomColor: 'rgba(128,128,128,0.2)' }]}>
                        <Text style={[styles.evalTitle, { color: theme.accent }]}>
                            {evaluationType === 'initial' ? 'AVALIAÇÃO INICIAL' : 'COMPARATIVO DE EVOLUÇÃO'}
                        </Text>
                        <TouchableOpacity onPress={() => setEvaluationModalVisible(false)} style={{padding: 5}}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        style={styles.evalScrollView}
                        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                    >
                        
                        {evaluationType === 'comparison' && (
                            <View style={{marginBottom: 20}}>
                                <Text style={{fontSize: 10, fontWeight: 'bold', color: theme.textSecondary, marginBottom: 8}}>SELECIONE A DATA ANTERIOR PARA COMPARAR (O "ANTES"):</Text>
                                
                                <TouchableOpacity 
                                    style={[styles.dateDropdown, {backgroundColor: theme.bg, borderColor: theme.border}]} 
                                    onPress={() => setShowDatePicker(!showDatePicker)}
                                >
                                    <MaterialCommunityIcons name="calendar" size={16} color={theme.accent} />
                                    <Text style={{flex: 1, color: theme.text, fontWeight: 'bold', fontSize: 13, marginLeft: 8}}>
                                        {getOldCheckin() ? new Date(getOldCheckin().date || getOldCheckin().createdAt).toLocaleDateString('pt-BR') : 'Selecione uma data...'}
                                    </Text>
                                    <MaterialCommunityIcons name={showDatePicker ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <View style={[styles.dateList, {backgroundColor: theme.bg, borderColor: theme.border}]}>
                                        {checkins.filter(c => c.id !== currentCheckinForEval?.id).map((c, idx, arr) => (
                                            <TouchableOpacity 
                                                key={c.id} 
                                                style={[styles.dateListItem, {borderBottomColor: theme.border}]}
                                                onPress={() => { setSelectedOldCheckinId(c.id); setShowDatePicker(false); }}
                                            >
                                                <Text style={{color: theme.text, fontSize: 13}}>
                                                    {new Date(c.date || c.createdAt).toLocaleDateString('pt-BR')} 
                                                    {idx === arr.length - 1 ? ' (Ponto de Partida)' : ''}
                                                </Text>
                                                {selectedOldCheckinId === c.id && <MaterialCommunityIcons name="check" size={16} color={theme.accent} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.comparePhotosContainer}>
                            {evaluationType === 'comparison' && getOldCheckin() && (
                                <View style={styles.comparePhotoCol}>
                                    <Text style={[styles.compareLabel, {color: theme.textSecondary}]}>ANTES ({getOldCheckin().weight || '--'} kg)</Text>
                                    <Image source={{uri: getOldCheckin().photoFront}} style={[styles.comparePhotoImg, {borderColor: theme.border}]} resizeMode="cover" />
                                </View>
                            )}
                            
                            <View style={styles.comparePhotoCol}>
                                <Text style={[styles.compareLabel, {color: theme.accent}]}>ATUAL ({currentCheckinForEval?.weight || '--'} kg)</Text>
                                <Image source={{uri: currentCheckinForEval?.photoFront}} style={[styles.comparePhotoImg, {borderColor: theme.accent}]} resizeMode="cover" />
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.generateAIBtn, {backgroundColor: theme.accent + '22', borderColor: theme.accent}]}
                            onPress={generateAIFeedback}
                            disabled={isGeneratingAI}
                        >
                            {isGeneratingAI ? <ActivityIndicator color={theme.accent} size="small" /> : (
                                <>
                                    <MaterialCommunityIcons name="robot-outline" size={20} color={theme.accent} />
                                    <Text style={{color: theme.accent, fontWeight: '900', fontSize: 12, marginLeft: 8}}>GERAR FEEDBACK COM IA</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={{fontSize: 10, fontWeight: 'bold', color: theme.textSecondary, marginBottom: 8, marginTop: 25}}>TEXTO DA AVALIAÇÃO (Enviado ao Aluno):</Text>
                        <TextInput 
                            style={[styles.evalInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                            multiline 
                            placeholder="Digite ou gere o feedback..." 
                            placeholderTextColor={theme.textSecondary}
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                        />

                        {/* 🔥 O BOTÃO INTELIGENTE: Muda texto se já tiver avaliação */}
                        <TouchableOpacity 
                            style={[styles.submitEvalBtn, {backgroundColor: currentCheckinForEval?.coachFeedback ? theme.surface : theme.accent, borderColor: currentCheckinForEval?.coachFeedback ? theme.border : theme.accent, borderWidth: 1}]}
                            onPress={submitEvaluation}
                            disabled={sendingEvaluation}
                        >
                            {sendingEvaluation ? <ActivityIndicator color={currentCheckinForEval?.coachFeedback ? theme.text : (theme.isDark ? '#000' : '#FFF')} /> : (
                                <Text style={{color: currentCheckinForEval?.coachFeedback ? theme.text : (theme.isDark ? '#000' : '#FFF'), fontWeight: '900', fontSize: 14, letterSpacing: 1}}>
                                    {currentCheckinForEval?.coachFeedback ? 'SALVAR ALTERAÇÕES' : 'APROVAR E NOTIFICAR ALUNO'}
                                </Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </View>
        )}

        {/* Modal de Foto */}
        {modalVisible && (
            <View style={styles.modalBgAbsolute}>
                <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                {selectedPhoto && (
                    <Image source={{ uri: selectedPhoto }} style={styles.fullImage} resizeMode="contain" />
                )}
            </View>
        )}
    </RootComponent>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems:'center', borderBottomWidth:1, flexShrink: 0 },
  headerTitle: { fontWeight:'900', fontSize:14, letterSpacing: 1 },
  
  emptyBox: { alignItems:'center', padding: 40, borderStyle:'dashed', borderWidth:1, borderRadius:16, marginVertical: 20 },
  emptyText: { textAlign: 'center', marginTop: 15, fontWeight: 'bold', lineHeight: 22 },

  card: { padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)', paddingBottom: 10 },
  dateText: { fontWeight: 'bold', fontSize: 13 },
  
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  dataLabel: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  dataValue: { fontSize: 16, fontWeight: '900' },
  
  photoGrid: { flexDirection: 'row', gap: 10 },
  photoThumb: { flex: 1, alignItems: 'center' },
  photo: { width: '100%', height: 140, borderRadius: 12, borderWidth: 1, backgroundColor: '#000' },
  photoLabel: { fontSize: 9, fontWeight: 'bold', marginTop: 8 },

  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  aiButtonText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  modalBgAbsolute: { 
    position: isWeb ? 'fixed' : 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
  },
  
  evalModalContent: { 
      width: '100%', 
      maxWidth: 500, 
      height: Dimensions.get('window').height * 0.85,
      borderRadius: 24, 
      borderWidth: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
  },
  
  evalScrollView: {
      flex: 1,
      minHeight: 0,
      ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  
  evalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, flexShrink: 0 },
  evalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  
  dateDropdown: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
  dateList: { borderWidth: 1, borderRadius: 12, marginTop: 5, maxHeight: 150, overflow: 'hidden' },
  dateListItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1 },
  
  comparePhotosContainer: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  comparePhotoCol: { flex: 1, alignItems: 'center' },
  compareLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
  comparePhotoImg: { width: '100%', height: 200, borderRadius: 16, borderWidth: 2, backgroundColor: '#000' },
  
  generateAIBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
  evalInput: { height: 150, padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, textAlignVertical: 'top', outlineStyle: 'none' },
  submitEvalBtn: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20, elevation: 3 },

  modalClose: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: '100%', height: '80%' }
});
