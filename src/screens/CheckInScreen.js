// src/screens/CheckInScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Platform, TouchableOpacity, 
  TextInput, Image, ScrollView, Alert, ActivityIndicator, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../contexts/ThemeContext';

export default function CheckInScreen({ navigation }) {
  const [weight, setWeight] = useState('');
  const [feedback, setFeedback] = useState('');
  const [photos, setPhotos] = useState({ front: null, back: null, side: null });
  const [extraPhotos, setExtraPhotos] = useState([]); 
  const [sending, setSending] = useState(false);
  const [userGender, setUserGender] = useState('');
  const [userPlan, setUserPlan] = useState('PREMIUM'); 
  const [showGuide, setShowGuide] = useState(false);
  const [allowMarketing, setAllowMarketing] = useState(false);

  const [checkingLock, setCheckingLock] = useState(true); 
  const [isLocked, setIsLocked] = useState(false);
  const [lockTitle, setLockTitle] = useState(''); 
  const [lockMessage, setLockMessage] = useState('');
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false); 

  const { theme } = useTheme();

  useEffect(() => {
      const loadUserAndCheckLock = async () => {
          try {
              const stored = await AsyncStorage.getItem('user');
              if (!stored) return;
              
              const userObj = JSON.parse(stored);
              setUserGender(userObj.gender || ''); 
              const dbPlan = userObj.plan || 'PREMIUM';
              const resolvedPlan = ['LOW_COST', 'PERFORMANCE', 'standard', 'CHALLENGE_21', 'FICHA_8S', 'FICHAS'].includes(dbPlan) ? dbPlan : 'PREMIUM';
              setUserPlan(resolvedPlan);

              const [statusRes, historyRes] = await Promise.all([
                  fetch(`https://fitos-final.onrender.com/api/checkin/status?userId=${userObj.id}`),
                  fetch(`https://fitos-final.onrender.com/api/checkin?userId=${userObj.id}&t=${Date.now()}`)
              ]);

              if (statusRes.ok && historyRes.ok) {
                  const data = await statusRes.json();
                  const history = await historyRes.json();
                  const hasPhotosInDb = Array.isArray(history) && history.length > 0;
                  
                  if (data.disableCheckIn) {
                      setIsDisabled(true);
                      setIsLocked(false); 
                      return;
                  }

                  if (resolvedPlan === 'PREMIUM') {
                      setIsLocked(false);
                      return;
                  }

                  // 🔥 AQUI ESTÁ A CORREÇÃO DA PORTA OBRIGATÓRIA 🔥
                  if (!hasPhotosInDb) {
                      setIsLocked(false); // DESTRAVADO para a foto obrigatória
                      return;
                  }

                  if (data.cycleCompleted) {
                      setIsLocked(true);
                      setLockTitle('PROJETO CONCLUÍDO 🏆');
                      setLockMessage('Você finalizou todos os registros do seu plano atual. Excelente constância! Fale com o Coach.');
                      return;
                  }

                  if (!data.nextCheckInDate) {
                      setIsLocked(true);
                      setLockTitle('AVALIAÇÃO EM ANDAMENTO 🔒');
                      setLockMessage('O Coach está analisando sua última avaliação. Fique tranquilo, logo a próxima data será liberada!');
                      return;
                  }

                  const nextDate = new Date(data.nextCheckInDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  nextDate.setHours(0, 0, 0, 0);

                  if (today < nextDate) {
                      const diffTime = nextDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      setDaysRemaining(diffDays);
                      setIsLocked(true);
                      setLockTitle('TEMPO DE EVOLUÇÃO ⏳');
                      setLockMessage('O seu corpo precisa de tempo para responder aos estímulos da rotina.');
                  } else {
                      setIsLocked(false); 
                  }
              }
          } catch (e) {
              console.log("Erro ao verificar trava:", e);
              setIsLocked(false); 
          } finally {
              setCheckingLock(false);
          }
      };
      loadUserAndCheckLock();
  }, []);

  const isPremium = userPlan === 'PREMIUM';

  const handleSelectPhoto = (position, isExtra = false) => {
    if (isLocked) return; 
    if (Platform.OS === 'web') {
        window.alert("Escolha a origem da imagem:\n1. Tirar Foto\n2. Escolher da Galeria");
        openGallery(position, isExtra); 
        return;
    }

    Alert.alert(
        "Enviar Foto",
        "Escolha a origem da imagem:",
        [
            { text: "📷 Tirar Foto Agora", onPress: () => openCamera(position, isExtra) },
            { text: "🖼️ Escolher da Galeria", onPress: () => openGallery(position, isExtra) },
            { text: "Cancelar", style: "cancel" }
        ]
    );
  };

  const openCamera = async (position, isExtra) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
        Alert.alert("Permissão Negada", "Precisamos de acesso à câmera.");
        return;
    }
    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5, 
        base64: true,
        allowsEditing: false,
    });
    if (!result.canceled && result.assets[0].base64) {
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (isExtra) {
            setExtraPhotos(prev => [...prev, base64Img]);
        } else {
            setPhotos(prev => ({ ...prev, [position]: base64Img }));
        }
    }
  };

  const openGallery = async (position, isExtra) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        Alert.alert("Permissão", "Precisamos acessar a galeria.");
        return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5, 
      base64: true,
      allowsMultipleSelection: isExtra, 
    });
    
    if (!result.canceled) {
        if (isExtra) {
            const newPhotos = result.assets.map(a => `data:image/jpeg;base64,${a.base64}`);
            setExtraPhotos(prev => [...prev, ...newPhotos]);
        } else if (result.assets[0].base64) {
            setPhotos(prev => ({ ...prev, [position]: `data:image/jpeg;base64,${result.assets[0].base64}` }));
        }
    }
  };

  const removeExtraPhoto = (index) => {
      if (isLocked) return;
      setExtraPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (isLocked) return;
    if (!weight) {
        if (Platform.OS === 'web') window.alert("Atenção: O campo de peso é obrigatório.");
        else Alert.alert("Atenção", "O campo de peso é obrigatório.");
        return;
    }
    if (!photos.front || !photos.side || !photos.back) {
        if (Platform.OS === 'web') window.alert("Atenção: Você precisa anexar as 3 fotos base (Frente, Lado e Costas).");
        else Alert.alert("Faltam Fotos", "Você precisa anexar as 3 fotos base (Frente, Lado e Costas) para concluir o envio.");
        return;
    }
    
    setSending(true);
    try {
        const stored = await AsyncStorage.getItem('user');
        const user = JSON.parse(stored);

        const payload = {
            userId: user.id,
            weight: weight.replace(',', '.'), 
            photoFront: photos.front,
            photoBack: photos.back,
            photoSide: photos.side,
            allowMarketing: allowMarketing
        };

        if (isPremium) {
            payload.feedback = feedback;
            payload.extraPhotos = extraPhotos;
        }

        const res = await fetch('https://fitos-final.onrender.com/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            if (Platform.OS === 'web') window.alert("Recebido! 🔥\nSuas fotos foram enviadas com sucesso para a base.");
            else Alert.alert("Recebido! 🔥", "Fotos enviadas com sucesso para a base.");
            navigation.goBack();
        } else {
            const errorJson = await res.json();
            if (Platform.OS === 'web') window.alert("Erro ao enviar: " + (errorJson.error || "Falha desconhecida"));
            else Alert.alert("Erro", errorJson.error || "Falha ao enviar.");
        }
    } catch (e) {
        if (Platform.OS === 'web') window.alert("Erro de Conexão. Tente novamente.");
        else Alert.alert("Erro", "Verifique sua conexão.");
    } finally {
        setSending(false);
    }
  };

  const renderPhotoBox = (label, position, icon) => (
    <TouchableOpacity style={[styles.photoBox, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => handleSelectPhoto(position)} activeOpacity={isLocked ? 1 : 0.7}>
        {photos[position] ? (
            <Image source={{ uri: photos[position] }} style={styles.photoPreview} />
        ) : (
            <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name={icon} size={30} color={theme.textSecondary} />
                <Text style={[styles.photoText, { color: theme.textSecondary }]}>{label}</Text>
            </View>
        )}
        {photos[position] && <View style={[styles.checkBadge, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="check" size={12} color={theme.isDark ? '#000' : '#FFF'}/></View>}
    </TouchableOpacity>
  );

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg };

  if (checkingLock) {
    return (
      <RootComponent style={rootStyle}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
          <ActivityIndicator color={theme.accent} size="large" />
          <Text style={{ color: theme.textSecondary, marginTop: 15, fontSize: 12 }}>Verificando disponibilidade...</Text>
        </View>
      </RootComponent>
    );
  }

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, position: 'relative', ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          <View style={[styles.header, { borderBottomColor: theme.border, zIndex: 10 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{isPremium ? "NOVO CHECK-IN" : "FOTOS DE EVOLUÇÃO"}</Text>
            <View style={{width: 40}}/> 
          </View>

          <View style={{ flex: 1, position: 'relative' }}>
          <ScrollView 
            style={isWeb ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' } : { flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 150 }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isLocked} 
          >
            <View style={[styles.trustBox, { backgroundColor: theme.isDark ? '#1a221f' : '#f0fdf4', borderColor: theme.accent }]}>
                <MaterialCommunityIcons name="shield-check" size={20} color={theme.accent} style={{marginTop: 2}} />
                <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={{color: theme.accent, fontWeight: 'bold', fontSize: 13, marginBottom: 2}}>Sigilo Absoluto</Text>
                    <Text style={{color: theme.text, fontSize: 11, lineHeight: 16}}>
                        Suas fotos são de uso técnico exclusivo para análise de progressão. <Text style={{fontWeight: 'bold'}}>Nenhuma foto será divulgada ou postada sem sua autorização prévia.</Text>
                    </Text>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.guideBox, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                onPress={() => { if(!isLocked) setShowGuide(!showGuide) }}
                activeOpacity={isLocked ? 1 : 0.7}
            >
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <MaterialCommunityIcons name="camera-metering-center" size={22} color={theme.text} />
                        <Text style={{color: theme.text, fontWeight: '900', fontSize: 13}}>COMO TIRAR SUAS FOTOS</Text>
                    </View>
                    <MaterialCommunityIcons name={showGuide ? "chevron-up" : "chevron-down"} size={24} color={theme.textSecondary} />
                </View>
                
                {showGuide && !isLocked && (
                    <View style={{marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.border}}>
                        <View style={styles.guideRow}>
                            <MaterialCommunityIcons name="white-balance-sunny" size={16} color={theme.accent} />
                            <Text style={[styles.guideText, {color: theme.text}]}>Tire as fotos com <Text style={{fontWeight: 'bold'}}>boa iluminação</Text>.</Text>
                        </View>
                        <View style={styles.guideRow}>
                            <MaterialCommunityIcons name="account-details" size={16} color={theme.accent} />
                            <Text style={[styles.guideText, {color: theme.text}]}>
                                Mantenha sempre a <Text style={{fontWeight: 'bold'}}>mesma postura e distância</Text> em todas as avaliações.
                            </Text>
                        </View>
                        <View style={styles.guideRow}>
                            <MaterialCommunityIcons name="hanger" size={16} color={theme.accent} />
                            <Text style={[styles.guideText, {color: theme.text}]}>
                                {userGender === 'Feminino' || userGender === 'F' 
                                    ? "Use biquíni (recomendado) ou top e short curto." 
                                    : "Use sunga ou cueca, e sem camisa."}
                            </Text>
                        </View>
                        <View style={styles.guideRow}>
                            <MaterialCommunityIcons name="human-handsdown" size={16} color={theme.accent} />
                            <Text style={[styles.guideText, {color: theme.text}]}>
                                Braços relaxados ao lado do corpo nas fotos de Frente e Costas.
                            </Text>
                        </View>
                    </View>
                )}
            </TouchableOpacity>

            <Text style={[styles.label, { color: theme.text, marginTop: 5 }]}>PESO ATUAL (KG)</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                keyboardType="decimal-pad" 
                placeholder="Ex: 80.5" 
                placeholderTextColor={theme.textSecondary}
                value={weight}
                onChangeText={setWeight}
                editable={!isLocked}
            />

            <Text style={[styles.label, { color: theme.text }]}>FOTOS OBRIGATÓRIAS</Text>
            <View style={styles.photosRow}>
                {renderPhotoBox("FRENTE", "front", "account")}
                {renderPhotoBox("LADO", "side", "account-box-outline")}
                {renderPhotoBox("COSTAS", "back", "account-convert")}
            </View>

            {isPremium && (
                <>
                    <Text style={[styles.label, { color: theme.text, marginTop: 25 }]}>FOTOS EXTRAS / POSES (Opcional)</Text>
                    <Text style={{color: theme.textSecondary, fontSize: 11, marginBottom: 10, marginTop: -5}}>Envie fotos de poses específicas (duplo bíceps, expansão, etc).</Text>
                    
                    <View style={styles.extraPhotosContainer}>
                        {extraPhotos.map((uri, index) => (
                            <View key={index} style={[styles.photoBox, { width: 80, height: 100, marginRight: 10, backgroundColor: theme.surface, borderColor: theme.accent }]}>
                                <Image source={{ uri }} style={styles.photoPreview} />
                                <TouchableOpacity style={styles.deleteExtraBtn} onPress={() => removeExtraPhoto(index)}>
                                    <MaterialCommunityIcons name="close" size={12} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        
                        <TouchableOpacity 
                            style={[styles.photoBox, { width: 80, height: 100, backgroundColor: theme.surface, borderColor: theme.border, borderStyle: 'dashed' }]} 
                            onPress={() => handleSelectPhoto(null, true)}
                            activeOpacity={isLocked ? 1 : 0.7}
                        >
                            <View style={styles.photoPlaceholder}>
                                <MaterialCommunityIcons name="plus" size={24} color={theme.textSecondary} />
                                <Text style={[styles.photoText, { color: theme.textSecondary, textAlign:'center' }]}>Adicionar</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: theme.text, marginTop: 25 }]}>FEEDBACK (Como foi a semana?)</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                        multiline 
                        placeholder="Ex: Senti mais força no treino de pernas, dieta 100%..." 
                        placeholderTextColor={theme.textSecondary}
                        value={feedback}
                        onChangeText={setFeedback}
                        editable={!isLocked}
                    />
                </>
            )}

            <TouchableOpacity 
                style={styles.marketingContainer} 
                onPress={() => { if(!isLocked) setAllowMarketing(!allowMarketing) }}
                activeOpacity={isLocked ? 1 : 0.8}
            >
                <View style={[styles.checkbox, allowMarketing ? { borderColor: theme.accent, backgroundColor: theme.accent } : { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    {allowMarketing && <MaterialCommunityIcons name="check" size={16} color={theme.isDark ? '#000' : '#FFF'} />}
                </View>
                <Text style={{flex: 1, color: theme.textSecondary, fontSize: 12, lineHeight: 18}}>
                    Autorizo o Coach a usar meu Antes/Depois <Text style={{fontWeight: 'bold', color: theme.text}}>anonimamente</Text> no Instagram para inspirar outras pessoas.
                </Text>
            </TouchableOpacity>

            {!isLocked && (
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.accent }]} onPress={handleSend} disabled={sending}>
                    {sending ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <Text style={[styles.sendBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>{isPremium ? "ENVIAR PARA O COACH" : "ENVIAR FOTOS DE EVOLUÇÃO"}</Text>}
                </TouchableOpacity>
            )}
          </ScrollView>

          {isLocked && !checkingLock && (
              <View style={[StyleSheet.absoluteFillObject, { zIndex: 20, justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)' }]} />
                  <View style={[styles.lockedModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={[styles.lockedIconBox, { backgroundColor: isDisabled ? 'rgba(255,59,48,0.15)' : theme.accent + '15' }]}>
                          <MaterialCommunityIcons name={isDisabled ? "lock" : "calendar-clock"} size={36} color={isDisabled ? '#FF3B30' : theme.accent} />
                      </View>
                      <Text style={[styles.lockedTitle, { color: theme.text }]}>{lockTitle}</Text>
                      <Text style={[styles.lockedMessage, { color: theme.textSecondary }]}>{lockMessage}</Text>
                      {daysRemaining > 0 && !isDisabled && (
                          <View style={[styles.daysBox, { borderColor: theme.border }]}>
                              <Text style={[styles.daysNumber, { color: theme.text }]}>{daysRemaining}</Text>
                              <Text style={[styles.daysLabel, { color: theme.textSecondary }]}>{daysRemaining === 1 ? 'DIA' : 'DIAS'}</Text>
                          </View>
                      )}
                  </View>
              </View>
          )}
          
          </View>

      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'android' ? 10 : 0, paddingHorizontal: 20, paddingBottom: 15, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomWidth: 1, flexShrink: 0 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  trustBox: { flexDirection: 'row', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  guideBox: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  guideText: { fontSize: 12, lineHeight: 18, flex: 1 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 15, letterSpacing: 0.5 },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, fontWeight:'bold' }, 
  textArea: { height: 100, textAlignVertical: 'top' },
  photosRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  photoBox: { width: '31%', aspectRatio: 0.8, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoText: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  checkBadge: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex:10 },
  extraPhotosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  deleteExtraBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255, 59, 48, 0.8)', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex:10 },
  marketingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 25, marginBottom: -10, paddingHorizontal: 5 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  sendBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 40 },
  sendBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  lockedModal: { width: '85%', maxWidth: 350, padding: 30, borderRadius: 24, borderWidth: 1, alignItems: 'center', elevation: 10, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20 },
  lockedIconBox: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  lockedTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5, marginBottom: 10, textAlign: 'center' },
  lockedMessage: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  daysBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 25, paddingVertical: 15, borderRadius: 16, borderWidth: 1 },
  daysNumber: { fontSize: 32, fontWeight: '900', lineHeight: 36 },
  daysLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 }
});