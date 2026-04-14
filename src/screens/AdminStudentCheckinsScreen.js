// src/screens/AdminStudentCheckinsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Platform, StatusBar, Image, Modal, Linking, TextInput, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '../contexts/ThemeContext';

const ThumbnailImage = ({ originalUri, onPress, theme }) => {
    const thumbUri = originalUri && originalUri.includes('.jpg') 
        ? originalUri.replace('.jpg', '-thumb.jpg') 
        : originalUri;

    const [imageUri, setImageUri] = useState(thumbUri);

    return (
        <TouchableOpacity onPress={() => onPress(originalUri)} style={{ width: '100%', alignItems: 'center' }}>
            <Image 
                source={{ uri: imageUri }} 
                style={[styles.photo, { borderColor: theme.border }]} 
                onError={() => {
                    if (imageUri !== originalUri) setImageUri(originalUri);
                }}
            />
        </TouchableOpacity>
    );
};

export default function AdminStudentCheckinsScreen({ route, navigation }) {
  const { theme } = useTheme();

  const rawId = route.params?.alunoId || route.params?.aluno?.id || '';
  const rawName = route.params?.alunoName || route.params?.aluno?.name || 'ALUNO';
  const aluno = { id: rawId, name: rawName };

  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState([]);
  
  const [visibleCount, setVisibleCount] = useState(3);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [evaluationModalVisible, setEvaluationModalVisible] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [evaluationType, setEvaluationType] = useState('initial');
  const [currentCheckinForEval, setCurrentCheckinForEval] = useState(null);
  
  const [selectedOldCheckinId, setSelectedOldCheckinId] = useState(null);
  const [savedCompareUrls, setSavedCompareUrls] = useState(null); 
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingEvaluation, setSendingEvaluation] = useState(false);
  const [isResolving, setIsResolving] = useState(false); 
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 🔥 ESTADOS PARA UPLOAD DE FOTO ANTIGA (GALERIA) COM SLOTS ESPECÍFICOS 🔥
  const [compareSource, setCompareSource] = useState('system'); 
  const [oldFront, setOldFront] = useState(null);
  const [oldSide, setOldSide] = useState(null);
  const [oldBack, setOldBack] = useState(null);
  const [customOldWeight, setCustomOldWeight] = useState('');
  const [customOldDate, setCustomOldDate] = useState('');
  
  // 🔥 ESTADO DO DIRECIONAMENTO DA IA 🔥
  const [contextText, setContextText] = useState('');

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

  const safeDate = (dateStr) => {
      if (!dateStr) return new Date();
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? new Date() : d;
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

  const optimizeImage = async (uri) => {
      try {
          const result = await ImageManipulator.manipulateAsync(
              uri,
              [{ resize: { width: 1080 } }], 
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          return { uri: result.uri, base64: result.base64 };
      } catch (error) {
          console.error("Erro ao otimizar imagem:", error);
          return null;
      }
  };

  const pickCustomOldImage = async (slot) => {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
          Alert.alert("Permissão necessária", "Precisamos de acesso à galeria.");
          return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1, 
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const optimized = await optimizeImage(asset.uri);
          if (optimized) {
              if (slot === 'front') setOldFront(optimized);
              if (slot === 'side') setOldSide(optimized);
              if (slot === 'back') setOldBack(optimized);
          }
      }
  };

  const removeCustomOldImage = (slot) => {
      if (slot === 'front') setOldFront(null);
      if (slot === 'side') setOldSide(null);
      if (slot === 'back') setOldBack(null);
  };

  const openEvaluationPanel = (checkin, initialTypeSugestion) => {
      let rawFb = checkin.coachFeedback || '';
      let extractedOldUrls = null;

      if (rawFb.includes('[COMPARE:')) {
          const match = rawFb.match(/\[COMPARE:(.*?)\]/);
          if (match) {
              extractedOldUrls = match[1];
              rawFb = rawFb.replace(match[0], '').trim();
              initialTypeSugestion = 'comparison';
          }
      }

      setCurrentCheckinForEval(checkin);
      setEvaluationType(initialTypeSugestion);
      setFeedbackText(rawFb); 
      setCompareSource('system');
      
      // Reseta os estados adicionais
      setOldFront(null);
      setOldSide(null);
      setOldBack(null);
      setCustomOldWeight('');
      setCustomOldDate('');
      setContextText('');

      if (initialTypeSugestion === 'comparison') {
          if (extractedOldUrls) {
              setSavedCompareUrls(extractedOldUrls);
          } else {
              const currentIdx = checkins.findIndex(c => c.id === checkin.id);
              const olderCheckins = checkins.slice(currentIdx + 1);
              if (olderCheckins.length > 0) {
                  setSelectedOldCheckinId(olderCheckins[olderCheckins.length - 1].id);
              }
          }
      } else {
          setSelectedOldCheckinId(null);
          setSavedCompareUrls(null);
      }
      
      setEvaluationModalVisible(true);
  };

  const handleTabChange = (type) => {
      setEvaluationType(type);
      if (type === 'comparison' && compareSource === 'system' && !selectedOldCheckinId && !savedCompareUrls) {
          const currentIdx = checkins.findIndex(c => c.id === currentCheckinForEval.id);
          const olderCheckins = checkins.slice(currentIdx + 1);
          if (olderCheckins.length > 0) {
              setSelectedOldCheckinId(olderCheckins[olderCheckins.length - 1].id);
          }
      }
  };

  const getOldCheckin = () => {
      if (!selectedOldCheckinId) return null;
      return checkins.find(c => c.id === selectedOldCheckinId);
  };

  const generateAIFeedback = async () => {
      if (evaluationType === 'comparison' && compareSource === 'gallery' && (!oldFront && !oldSide && !oldBack)) {
          Alert.alert("Atenção", "Adicione pelo menos uma foto antiga da galeria para comparar.");
          return;
      }

      setIsGeneratingAI(true);
      try {
          const customPhotosArray = compareSource === 'gallery' ? [
              oldFront ? `data:image/jpeg;base64,${oldFront.base64}` : '',
              oldSide ? `data:image/jpeg;base64,${oldSide.base64}` : '',
              oldBack ? `data:image/jpeg;base64,${oldBack.base64}` : ''
          ] : [];

          // 🔥 ADICIONA O CONTEXT TEXT NO PAYLOAD 🔥
          const payload = { 
              checkInId: currentCheckinForEval.id,
              oldCheckInId: (evaluationType === 'comparison' && compareSource === 'system') ? selectedOldCheckinId : null,
              customOldPhotos: customPhotosArray,
              customOldWeight: (evaluationType === 'comparison' && compareSource === 'gallery') ? customOldWeight : null,
              contextText: contextText 
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

      let finalFeedback = feedbackText;
      let payloadPhotosBase64 = []; 

      if (evaluationType === 'comparison') {
          if (compareSource === 'system') {
              if (selectedOldCheckinId) {
                  const oldCheckin = getOldCheckin();
                  if (oldCheckin) {
                      const oldUrls = [oldCheckin.photoFront || '', oldCheckin.photoSide || '', oldCheckin.photoBack || ''].join('|');
                      finalFeedback = `[COMPARE:${oldUrls}]\n` + finalFeedback;
                  }
              } else if (savedCompareUrls) {
                  finalFeedback = `[COMPARE:${savedCompareUrls}]\n` + finalFeedback;
              }
          } else if (compareSource === 'gallery') {
              payloadPhotosBase64 = [
                  oldFront ? `data:image/jpeg;base64,${oldFront.base64}` : '',
                  oldSide ? `data:image/jpeg;base64,${oldSide.base64}` : '',
                  oldBack ? `data:image/jpeg;base64,${oldBack.base64}` : ''
              ];
              if (customOldDate || customOldWeight) {
                  finalFeedback = `*(Base da Comparação: ${customOldDate ? customOldDate : 'Galeria'} | ${customOldWeight ? customOldWeight+'kg' : ''})*\n\n` + finalFeedback;
              }
          }
      }

      setSendingEvaluation(true);
      try {
          const res = await fetch('https://fitos-final.onrender.com/api/checkin/evaluate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  checkinId: currentCheckinForEval.id,
                  coachFeedback: finalFeedback,
                  customOldPhotos: payloadPhotosBase64 
              })
          });

          if (res.ok) {
              const data = await res.json();
              const feedbackSalvo = data.updatedFeedback || finalFeedback;

              setCheckins(prev => prev.map(c => 
                  c.id === currentCheckinForEval.id ? { ...c, coachFeedback: feedbackSalvo } : c
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

  const handleResolveSilently = (checkinId) => {
      const confirmAction = async () => {
          setIsResolving(true);
          try {
              const res = await fetch('https://fitos-final.onrender.com/api/checkin/evaluate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      checkinId: checkinId,
                      silent: true, 
                      coachFeedback: "*Avaliação Finalizada!* 🎯\n\nSeu laudo completo foi gerado com sucesso. Vá até a sua tela de **Evolução** no aplicativo para conferir a análise e o seu planejamento."
                  })
              });
              if (res.ok) {
                  setCheckins(prev => prev.map(c => 
                      c.id === checkinId ? { ...c, coachFeedback: "Avaliação Silenciosa" } : c
                  ));
                  if (Platform.OS === 'web') window.alert("Baixa realizada e alerta removido!");
              } else {
                  if (Platform.OS === 'web') window.alert("Erro ao dar baixa."); else Alert.alert("Erro", "Não foi possível atualizar o check-in.");
              }
          } catch (e) {
              if (Platform.OS === 'web') window.alert("Erro de conexão."); else Alert.alert("Erro", "Erro de conexão.");
          } finally {
              setIsResolving(false);
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm("Marcar como 'Avaliado' para remover o aviso vermelho (O aluno não será notificado)?")) {
              confirmAction();
          }
      } else {
          Alert.alert(
              "Baixa Silenciosa",
              "Marcar este check-in como avaliado para remover o alerta (sem enviar Push para o aluno)?",
              [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Sim, remover alerta", onPress: confirmAction }
              ]
          );
      }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg, ...(isWeb ? { height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}) }]}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        <View style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, overflow: 'hidden', ...(isWeb ? { display: 'flex', flexDirection: 'column', borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}>
            
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border, flexShrink: 0 }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 15 }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>CHECK-INS DE</Text>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>{aluno.name.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={fetchCheckins} style={{ padding: 8, flexShrink: 0 }}>
                    <MaterialCommunityIcons name="refresh" size={24} color={theme.accent}/>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1, position: 'relative' }}>
            <ScrollView style={isWeb ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' } : { flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
                {loading ? <ActivityIndicator color={theme.accent} size="large" style={{marginTop: 50}} /> : (
                    checkins.length === 0 ? (
                        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="camera-off" size={48} color={theme.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Este aluno ainda não enviou nenhum check-in pelo aplicativo.</Text>
                        </View>
                    ) : (
                        <>
                            {checkins.slice(0, visibleCount).map((item) => {
                                const globalIndex = checkins.findIndex(c => c.id === item.id);
                                const isOldest = globalIndex === checkins.length - 1;
                                const isEvaluated = !!item.coachFeedback;
                                const itemDate = safeDate(item.date || item.createdAt);

                                return (
                                    <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: isEvaluated ? theme.border : '#FF3B30', borderWidth: isEvaluated ? 1 : 2 }]}>
                                        
                                        <View style={styles.cardHeader}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                                <MaterialCommunityIcons name="calendar-check" size={16} color={theme.accent} />
                                                <Text style={[styles.dateText, { color: theme.text }]}>
                                                    {itemDate.toLocaleDateString('pt-BR')} às {itemDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                </Text>
                                            </View>
                                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{padding: 5}}>
                                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, flexWrap: 'wrap', gap: 10}}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
                                                <View style={[styles.badge, { backgroundColor: isOldest ? '#FF950022' : theme.accent + '22', borderColor: isOldest ? '#FF9500' : theme.accent }]}>
                                                    <Text style={[styles.badgeText, { color: isOldest ? '#FF9500' : theme.accent }]}>
                                                        {isOldest ? 'PONTO DE PARTIDA' : 'CHECK-IN'}
                                                    </Text>
                                                </View>
                                                
                                                {isEvaluated ? (
                                                    <View style={[styles.badge, { backgroundColor: '#34C75922', borderColor: '#34C759' }]}>
                                                        <MaterialCommunityIcons name="check" size={10} color="#34C759" style={{marginRight: 2}} />
                                                        <Text style={[styles.badgeText, { color: '#34C759' }]}>AVALIADO</Text>
                                                    </View>
                                                ) : (
                                                    <View style={[styles.badge, { backgroundColor: '#FF3B3022', borderColor: '#FF3B30' }]}>
                                                        <MaterialCommunityIcons name="alert-circle" size={10} color="#FF3B30" style={{marginRight: 2}} />
                                                        <Text style={[styles.badgeText, { color: '#FF3B30' }]}>AGUARDANDO AVALIAÇÃO</Text>
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
                                                    <ThumbnailImage originalUri={item.photoFront} onPress={openPhoto} theme={theme} />
                                                    <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>FRENTE</Text>
                                                </View>
                                            ) : null}
                                            
                                            {item.photoSide ? (
                                                <View style={styles.photoThumb}>
                                                    <ThumbnailImage originalUri={item.photoSide} onPress={openPhoto} theme={theme} />
                                                    <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>LADO</Text>
                                                </View>
                                            ) : null}
                                            
                                            {item.photoBack ? (
                                                <View style={styles.photoThumb}>
                                                    <ThumbnailImage originalUri={item.photoBack} onPress={openPhoto} theme={theme} />
                                                    <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>COSTA</Text>
                                                </View>
                                            ) : null}
                                        </View>

                                        <View style={{marginTop: 15}}>
                                            <TouchableOpacity 
                                                style={[styles.aiButton, { backgroundColor: isEvaluated ? theme.surface : theme.accent, borderColor: isEvaluated ? theme.border : theme.accent, width: '100%' }]} 
                                                onPress={() => openEvaluationPanel(item, isOldest ? 'initial' : 'comparison')}
                                            >
                                                <MaterialCommunityIcons name={isEvaluated ? "pencil" : "robot-outline"} size={18} color={isEvaluated ? theme.text : (theme.isDark ? '#000' : '#FFF')} />
                                                <Text style={[styles.aiButtonText, { color: isEvaluated ? theme.text : (theme.isDark ? '#000' : '#FFF') }]}>
                                                    {isEvaluated ? "EDITAR AVALIAÇÃO COM IA" : "AVALIAR COM LABORATÓRIO IA"}
                                                </Text>
                                            </TouchableOpacity>

                                            {!isEvaluated && (
                                                <TouchableOpacity 
                                                    style={[styles.silentResolveBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                                                    onPress={() => handleResolveSilently(item.id)}
                                                    disabled={isResolving}
                                                >
                                                    {isResolving ? <ActivityIndicator size="small" color={theme.text} /> : (
                                                        <>
                                                            <MaterialCommunityIcons name="check-all" size={18} color={theme.text} />
                                                            <Text style={[styles.silentResolveText, { color: theme.text }]}>MARCAR COMO AVALIADO (REMOVER ALERTA)</Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                    </View>
                                )
                            })}

                            {visibleCount < checkins.length && (
                                <TouchableOpacity 
                                    style={[styles.loadMoreBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={() => setVisibleCount(prev => prev + 3)}
                                >
                                    <MaterialCommunityIcons name="history" size={20} color={theme.text} />
                                    <Text style={[styles.loadMoreText, { color: theme.text }]}>Carregar Mais Antigos</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )
                )}
            </ScrollView>
            </View>
        </View>

        {evaluationModalVisible && (
            <View style={styles.modalBgAbsolute}>
                <View style={[styles.evalModalContent, { backgroundColor: theme.bg }]}>
                    
                    <View style={[styles.evalHeader, { borderBottomColor: 'rgba(128,128,128,0.2)' }]}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <MaterialCommunityIcons name="bullseye-arrow" size={24} color={theme.accent} />
                            <Text style={[styles.evalTitle, { color: theme.text }]}>PAINEL DE ANÁLISE</Text>
                        </View>
                        <TouchableOpacity onPress={() => setEvaluationModalVisible(false)} style={{padding: 5}}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        style={styles.evalScrollView}
                        contentContainerStyle={{ padding: 25, paddingBottom: 80 }}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                    >
                        <View style={{flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, padding: 4, marginBottom: 25, borderWidth: 1, borderColor: theme.border}}>
                            <TouchableOpacity 
                                style={[styles.tabBtn, { backgroundColor: evaluationType === 'initial' ? theme.accent : 'transparent' }]}
                                onPress={() => handleTabChange('initial')}
                            >
                                <Text style={[styles.tabBtnText, { color: evaluationType === 'initial' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>ANÁLISE ÚNICA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.tabBtn, { backgroundColor: evaluationType === 'comparison' ? theme.accent : 'transparent' }]}
                                onPress={() => handleTabChange('comparison')}
                            >
                                <Text style={[styles.tabBtnText, { color: evaluationType === 'comparison' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>COMPARATIVO</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {evaluationType === 'comparison' && (
                            <View style={{marginBottom: 25, padding: 15, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border}}>
                                
                                <View style={{flexDirection: 'row', backgroundColor: theme.bg, borderRadius: 8, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: theme.border}}>
                                    <TouchableOpacity 
                                        style={[styles.sourceBtn, { backgroundColor: compareSource === 'system' ? theme.accent + '22' : 'transparent' }]}
                                        onPress={() => setCompareSource('system')}
                                    >
                                        <Text style={[styles.sourceBtnText, { color: compareSource === 'system' ? theme.accent : theme.textSecondary }]}>SISTEMA</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.sourceBtn, { backgroundColor: compareSource === 'gallery' ? theme.accent + '22' : 'transparent' }]}
                                        onPress={() => setCompareSource('gallery')}
                                    >
                                        <Text style={[styles.sourceBtnText, { color: compareSource === 'gallery' ? theme.accent : theme.textSecondary }]}>GALERIA</Text>
                                    </TouchableOpacity>
                                </View>

                                {compareSource === 'system' ? (
                                    <>
                                        <Text style={{fontSize: 10, fontWeight: '900', color: theme.accent, marginBottom: 10, letterSpacing: 0.5}}>SELECIONE A FOTO BASE DO APLICATIVO</Text>
                                        <TouchableOpacity 
                                            style={[styles.dateDropdown, {backgroundColor: theme.bg, borderColor: theme.border}]} 
                                            onPress={() => setShowDatePicker(!showDatePicker)}
                                        >
                                            <MaterialCommunityIcons name="calendar-clock" size={18} color={theme.textSecondary} />
                                            <Text style={{flex: 1, color: theme.text, fontWeight: 'bold', fontSize: 13, marginLeft: 10}}>
                                                {getOldCheckin() ? safeDate(getOldCheckin().date || getOldCheckin().createdAt).toLocaleDateString('pt-BR') : (savedCompareUrls ? 'Fotos da base anterior' : 'Escolha uma data...')}
                                            </Text>
                                            <MaterialCommunityIcons name={showDatePicker ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                                        </TouchableOpacity>

                                        {showDatePicker && (
                                            <View style={[styles.dateList, {backgroundColor: theme.bg, borderColor: theme.border}]}>
                                                {checkins.filter(c => c.id !== currentCheckinForEval?.id).map((c) => (
                                                    <TouchableOpacity 
                                                        key={c.id} 
                                                        style={[styles.dateListItem, {borderBottomColor: theme.border}]}
                                                        onPress={() => { setSelectedOldCheckinId(c.id); setSavedCompareUrls(null); setShowDatePicker(false); }}
                                                    >
                                                        <Text style={{color: theme.text, fontSize: 13, fontWeight: '600'}}>
                                                            {safeDate(c.date || c.createdAt).toLocaleDateString('pt-BR')} 
                                                        </Text>
                                                        {selectedOldCheckinId === c.id && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Text style={{fontSize: 10, fontWeight: '900', color: theme.accent, marginBottom: 10, letterSpacing: 0.5}}>SELECIONE FOTOS EXTERNAS</Text>
                                        
                                        <View style={styles.specificSlotsContainer}>
                                            <TouchableOpacity style={styles.slotBox} onPress={() => pickCustomOldImage('front')}>
                                                {oldFront ? (
                                                    <>
                                                        <Image source={{ uri: oldFront.uri }} style={styles.slotImg} />
                                                        <TouchableOpacity style={styles.slotRemove} onPress={() => removeCustomOldImage('front')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity>
                                                    </>
                                                ) : (
                                                    <View style={styles.slotEmpty}>
                                                        <MaterialCommunityIcons name="account" size={24} color={theme.textSecondary} />
                                                        <Text style={[styles.slotText, { color: theme.textSecondary }]}>FRENTE</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.slotBox} onPress={() => pickCustomOldImage('side')}>
                                                {oldSide ? (
                                                    <>
                                                        <Image source={{ uri: oldSide.uri }} style={styles.slotImg} />
                                                        <TouchableOpacity style={styles.slotRemove} onPress={() => removeCustomOldImage('side')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity>
                                                    </>
                                                ) : (
                                                    <View style={styles.slotEmpty}>
                                                        <MaterialCommunityIcons name="human-male-height" size={24} color={theme.textSecondary} />
                                                        <Text style={[styles.slotText, { color: theme.textSecondary }]}>LADO</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.slotBox} onPress={() => pickCustomOldImage('back')}>
                                                {oldBack ? (
                                                    <>
                                                        <Image source={{ uri: oldBack.uri }} style={styles.slotImg} />
                                                        <TouchableOpacity style={styles.slotRemove} onPress={() => removeCustomOldImage('back')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity>
                                                    </>
                                                ) : (
                                                    <View style={styles.slotEmpty}>
                                                        <MaterialCommunityIcons name="account-arrow-left" size={24} color={theme.textSecondary} />
                                                        <Text style={[styles.slotText, { color: theme.textSecondary }]}>COSTAS</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        </View>

                                        <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{fontSize: 10, fontWeight: '900', color: theme.textSecondary, marginBottom: 5, letterSpacing: 0.5}}>DATA (OPCIONAL)</Text>
                                                <TextInput 
                                                    style={[styles.customWeightInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                                    placeholder="Ex: 10/01/26"
                                                    placeholderTextColor={theme.textSecondary}
                                                    value={customOldDate}
                                                    onChangeText={setCustomOldDate}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{fontSize: 10, fontWeight: '900', color: theme.textSecondary, marginBottom: 5, letterSpacing: 0.5}}>PESO (OPCIONAL)</Text>
                                                <TextInput 
                                                    style={[styles.customWeightInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                                    placeholder="Ex: 85.5"
                                                    placeholderTextColor={theme.textSecondary}
                                                    keyboardType="numeric"
                                                    value={customOldWeight}
                                                    onChangeText={setCustomOldWeight}
                                                />
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}

                        <View style={styles.comparePhotosContainer}>
                            {evaluationType === 'comparison' && compareSource === 'system' && (getOldCheckin() || savedCompareUrls) && (
                                <View style={styles.comparePhotoCol}>
                                    <View style={[styles.compareBadge, {backgroundColor: theme.surface, borderColor: theme.border}]}>
                                        <Text style={[styles.compareLabel, {color: theme.textSecondary}]}>ANTES: {getOldCheckin()?.weight ? `${getOldCheckin().weight}kg` : '--'}</Text>
                                    </View>
                                    <Image source={{uri: getOldCheckin()?.photoFront || (savedCompareUrls ? savedCompareUrls.split('|')[0] : null)}} style={[styles.comparePhotoImg, {borderColor: theme.border}]} resizeMode="contain" />
                                </View>
                            )}
                            
                            <View style={styles.comparePhotoCol}>
                                <View style={[styles.compareBadge, {backgroundColor: theme.accent + '15', borderColor: theme.accent}]}>
                                    <Text style={[styles.compareLabel, {color: theme.accent}]}>ATUAL: {currentCheckinForEval?.weight || '--'}kg</Text>
                                </View>
                                <Image source={{uri: currentCheckinForEval?.photoFront}} style={[styles.comparePhotoImg, {borderColor: theme.accent}]} resizeMode="contain" />
                            </View>
                        </View>

                        {/* 🔥 NOVO CAMPO: DIRECIONAMENTO (OPCIONAL) 🔥 */}
                        <Text style={[styles.sectionLabel, { color: theme.text }]}>DIRECIONAMENTO (OPCIONAL)</Text>
                        <TextInput 
                            style={[styles.inputContext, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                            placeholder="Ex: Aluno relatou dor no ombro; foque nisso e evite falar do abdômen..."
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            value={contextText}
                            onChangeText={setContextText}
                        />

                        <TouchableOpacity 
                            style={[styles.generateAIBtn, {backgroundColor: theme.accent + '15', borderColor: theme.accent}]}
                            onPress={generateAIFeedback}
                            disabled={isGeneratingAI}
                        >
                            {isGeneratingAI ? <ActivityIndicator color={theme.accent} size="small" /> : (
                                <>
                                    <MaterialCommunityIcons name="robot-outline" size={22} color={theme.accent} />
                                    <Text style={{color: theme.accent, fontWeight: '900', fontSize: 13, marginLeft: 10, letterSpacing: 0.5}}>GERAR FEEDBACK COM IA</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={{fontSize: 11, fontWeight: '900', color: theme.textSecondary, marginBottom: 10, marginTop: 30, letterSpacing: 0.5}}>
                            TEXTO DA AVALIAÇÃO (Enviado ao Aluno)
                        </Text>
                        <View style={[styles.evalInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="format-quote-open" size={20} color={theme.accent} style={{marginBottom: 8}} />
                            <TextInput 
                                style={[styles.evalInput, { color: theme.text }]} 
                                multiline 
                                placeholder="Digite a avaliação ou deixe a IA fazer o trabalho pesado..." 
                                placeholderTextColor={theme.textSecondary}
                                value={feedbackText}
                                onChangeText={setFeedbackText}
                            />
                        </View>

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

  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  aiButtonText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  
  silentResolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8, marginTop: 10 },
  silentResolveText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  loadMoreBtn: { flexDirection: 'row', padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10, marginBottom: 20 },
  loadMoreText: { fontWeight: 'bold', fontSize: 13 },

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
      maxWidth: 550, 
      height: Dimensions.get('window').height * 0.85,
      borderRadius: 30, 
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
  
  evalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, flexShrink: 0 },
  evalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  
  tabBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  tabBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

  sourceBtn: { flex: 1, padding: 8, borderRadius: 6, alignItems: 'center' },
  sourceBtnText: { fontWeight: 'bold', fontSize: 10, letterSpacing: 0.5 },

  specificSlotsContainer: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  slotBox: { flex: 1, height: 120, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  slotEmpty: { alignItems: 'center', justifyContent: 'center' },
  slotText: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  slotImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  slotRemove: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFF', borderRadius: 10 },
  
  customWeightInput: { padding: 10, borderRadius: 8, borderWidth: 1, outlineStyle: 'none', fontSize: 13 },

  dateDropdown: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
  dateList: { borderWidth: 1, borderRadius: 12, marginTop: 5, maxHeight: 150, overflow: 'hidden' },
  dateListItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1 },
  
  comparePhotosContainer: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  comparePhotoCol: { flex: 1, alignItems: 'center' },
  compareBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 10, alignSelf: 'center' },
  compareLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  comparePhotoImg: { width: '100%', height: 250, borderRadius: 16, borderWidth: 2, backgroundColor: '#000' },
  
  inputContext: { padding: 15, borderRadius: 12, borderWidth: 1, minHeight: 80, textAlignVertical: 'top', outlineStyle: 'none', marginBottom: 25, fontSize: 14 },
  
  generateAIBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  evalInputContainer: { padding: 20, borderRadius: 20, borderWidth: 1 },
  evalInput: { minHeight: 120, fontSize: 15, lineHeight: 24, textAlignVertical: 'top', outlineStyle: 'none' },
  submitEvalBtn: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 30, elevation: 4 },

  modalClose: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: '100%', height: '80%' }
});