import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Dimensions, Platform, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadAsync } from 'expo-file-system/legacy';
import { Video } from 'react-native-compressor'; // 🔥 IMPORTAÇÃO DO COMPRESSOR

const { height } = Dimensions.get('window');

const getInstruction = (exercise) => {
  const name = exercise?.toLowerCase() || "";
  if (name.includes("elevação lateral") || name.includes("frontal") || name.includes("abdução")) return "📸 POSIÇÃO: FRENTE. Celular apoiado na altura do peito.";
  if (name.includes("remada") || name.includes("puxada") || name.includes("costas") || name.includes("inverso") || name.includes("dorsal")) return "📸 POSIÇÃO: COSTAS ou LADO. Mostre as escápulas.";
  if (name.includes("agachamento") || name.includes("terra") || name.includes("stiff") || name.includes("afundo") || name.includes("leg") || name.includes("búlgaro")) return "📸 POSIÇÃO: LADO/DIAGONAL. Afaste 3m para ver quadril e joelho.";
  if (name.includes("supino") || name.includes("fly") || name.includes("peitoral") || name.includes("crossover")) return "📸 POSIÇÃO: DIAGONAL (45°). De cima para baixo se possível.";
  if (name.includes("rosca") || name.includes("tríceps") || name.includes("bíceps") || name.includes("coice") || name.includes("testa")) return "📸 POSIÇÃO: LADO ou FRENTE. Foque no cotovelo.";
  return "📸 POSIÇÃO: DIAGONAL. Corpo inteiro na tela.";
};

// 🔥 REGRA DE ELITE: INJETOR DE PROMPT OCULTO
const getElitePrompt = (exerciseName) => {
  const cleanName = exerciseName?.toLowerCase() || "";
  let eliteInjection = "";

  if (cleanName.includes("stiff") || cleanName.includes("terra") || cleanName.includes("deadlift") || cleanName.includes("rdl")) {
      eliteInjection = " | REGRAS DO COACH: Seja extremamente rigoroso com o ângulo do joelho. O joelho deve ter apenas uma leve semi-flexão (destravado). Se o aluno flexionar muito os joelhos na descida, alerte o erro dizendo que ele está agachando em vez de fazer dobradiça de quadril. DICA RÁPIDA (HACK): 'Pense que você quer empurrar a parede atrás de você com o seu glúteo.'";
  }
  
  if (cleanName.includes("agachamento") || cleanName.includes("squat") || cleanName.includes("hack") || cleanName.includes("leg")) {
      eliteInjection = " | REGRAS DO COACH: Verifique a profundidade e o valgo dinâmico (joelho entrando). DICA RÁPIDA (HACK): 'Force os joelhos para fora como se fosse rasgar o chão ao meio.'";
  }

  return `${exerciseName}${eliteInjection}`;
};

export default function ScannerIA({ navigation, route }) {
  const exerciseName = route?.params?.exName || "Exercício";
  
  // 🔥 PEGANDO O NOME DO ALUNO 🔥
  const alunoName = route?.params?.alunoName || "Aluno"; 

  const currentInstruction = getInstruction(exerciseName);
  
  const [loadingIA, setLoadingIA] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null); 
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loadingIA) {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(scanAnim, { toValue: 0, duration: 1200, useNativeDriver: true })
            ])
        ).start();
    } else {
        scanAnim.stopAnimation();
        scanAnim.setValue(0);
    }
  }, [loadingIA]);

  const openNativeCameraAndRecord = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  allowsEditing: true, 
  videoMaxDuration: 7, 
  quality: 0.1, // 🔥 Baixamos pro mínimo
  videoExportPreset: ImagePicker.VideoExportPreset.H264_640x480, // 🔥 Força 480p
});

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadVideoForAnalysis(result.assets[0]);
      }
    } catch (error) {
      console.error("Erro câmera:", error);
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  allowsEditing: true, 
  videoMaxDuration: 7, 
  quality: 0.1, // 🔥 Baixamos pro mínimo
  videoExportPreset: ImagePicker.VideoExportPreset.H264_640x480, // 🔥 Força 480p (Super leve)
});

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadVideoForAnalysis(result.assets[0]);
      }
    } catch (error) {
      console.error("Erro galeria:", error);
    }
  };

  const uploadVideoForAnalysis = async (asset) => {
    try {
      setLoadingIA(true);
      setFeedbackData(null); 

      let uploadResultStatus;
      let responseBody;
      let finalVideoUri = asset.uri;

      const enhancedExerciseName = getElitePrompt(exerciseName);

      // 🔥 COMPRESSÃO PESADA (APENAS PARA DISPOSITIVOS MÓVEIS)
      if (Platform.OS !== 'web') {
        try {
          console.log('Iniciando compressão do vídeo...');
          const compressedUri = await Video.compress(
            asset.uri,
            {
              compressionMethod: 'auto',
              minimumFileSizeForCompress: 2, // Comprime apenas se passar de 2MB
            },
            (progress) => {
              console.log('Progresso compressão: ', progress);
            }
          );
          finalVideoUri = compressedUri;
          console.log('Vídeo comprimido com sucesso. URI final: ', finalVideoUri);
        } catch (compressError) {
          console.error("Erro ao comprimir, enviando vídeo original: ", compressError);
          finalVideoUri = asset.uri; // Fallback de segurança
        }
      }

      if (Platform.OS === 'web') {
        const formData = new FormData();
        
        let videoBlob;
        if (asset.file) {
            videoBlob = asset.file; 
        } else {
            const res = await fetch(asset.uri);
            videoBlob = await res.blob();
        }

        formData.append('video', videoBlob, 'video.mov');
        formData.append('exerciseName', enhancedExerciseName);
        formData.append('userLevel', 'Geral');
        formData.append('alunoName', alunoName);

        const response = await fetch('https://fitos-final.onrender.com/api/analyze', {
          method: 'POST',
          body: formData,
        });

        uploadResultStatus = response.status;
        responseBody = await response.text();

      } else {
        // 🔥 UPLOAD NATIVO USANDO O VÍDEO COMPRIMIDO (finalVideoUri)
        const uploadResult = await uploadAsync('https://fitos-final.onrender.com/api/analyze', finalVideoUri, {
          fieldName: 'video',
          httpMethod: 'POST',
          uploadType: 1, 
          parameters: { 
            'exerciseName': enhancedExerciseName, 
            'userLevel': 'Geral',
            'alunoName': alunoName 
          },
        });

        uploadResultStatus = uploadResult.status;
        responseBody = uploadResult.body;
      }

      setLoadingIA(false);

      if (uploadResultStatus === 200) {
        let cleanMessage = "";
        try {
             const data = JSON.parse(responseBody);
             if (typeof data === 'object') {
                const feedbackPart = data.feedback || "Análise concluída.";
                const correctionPart = data.correction ? `\n\n💡 DICA: ${data.correction}` : "";
                cleanMessage = `${feedbackPart}${correctionPart}`;
             } else {
                cleanMessage = String(data);
             }
        } catch (e) {
             cleanMessage = responseBody.replace(/["{}]/g, ""); 
        }
        
        cleanMessage = cleanMessage.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        setFeedbackData(cleanMessage);
      } else {
        const errorData = JSON.parse(responseBody || "{}");
        setFeedbackData(`Erro do Servidor: ${errorData.error || "Tente novamente."}`);
      }
    } catch (error) {
      setLoadingIA(false);
      setFeedbackData(`Falha de Conexão: ${error.message}`);
    }
  };

  const translateY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.5] });
  const isWeb = Platform.OS === 'web';
  const RootComponent = isWeb ? View : SafeAreaView;
  
  const rootStyle = isWeb
    ? { flex: 1, height: '100vh', width: '100%', backgroundColor: '#0a0a0a', alignItems: 'center' }
    : { flex: 1, backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 };

  const mobileVirtualStyle = {
    flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', backgroundColor: '#000',
    ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#222' } : {})
  };

  return (
    <RootComponent style={rootStyle}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={mobileVirtualStyle}>
            <View style={styles.container}>
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} disabled={loadingIA}>
                        <Text style={styles.backText}>VOLTAR</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>SCANNER BIOMECÂNICO</Text>
                    <View style={{width: 50}} /> 
                </View>

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    
                    {loadingIA && (
                        <View style={styles.processingContainer}>
                            <Animated.View style={[styles.laserLine, { transform: [{ translateY }] }]} />
                            <ActivityIndicator size="large" color="#CCFF00" style={{ marginBottom: 20 }} />
                            <Text style={{ color: '#CCFF00', fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>ANALISANDO MOVIMENTO...</Text>
                            <Text style={{ color: '#FFF', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                                A IA do Coach está processando seus ângulos e alavancas biomecânicas.
                            </Text>
                        </View>
                    )}

                    {!loadingIA && feedbackData && (
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <Text style={{ color: '#CCFF00', fontSize: 22, fontWeight: '900', marginBottom: 20 }}>VEREDITO DA IA</Text>
                            <View style={{ backgroundColor: '#111', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#333', width: '100%', marginBottom: 30 }}>
                                <Text style={{ color: '#FFF', fontSize: 16, lineHeight: 24, textAlign: 'center' }}>{feedbackData}</Text>
                            </View>
                            <TouchableOpacity style={styles.recordBtn} onPress={() => setFeedbackData(null)}>
                                <Text style={styles.recordText}>NOVA ANÁLISE</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!loadingIA && !feedbackData && (
                        <>
                            <Text style={styles.exerciseNameText}>{exerciseName}</Text>
                            <View style={styles.instructionBox}>
                                <Text style={styles.instructionText}>{currentInstruction}</Text>
                            </View>
                            
                            <TouchableOpacity style={styles.recordBtn} onPress={openNativeCameraAndRecord}>
                                <Text style={styles.recordText}>📹 GRAVAR AGORA</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
                                <Text style={styles.galleryText}>📂 ESCOLHER DA GALERIA</Text>
                            </TouchableOpacity>
                            
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>
                                    ⚠️ ATENÇÃO: Envie no MÁXIMO 10 segundos! Use a ferramenta de corte para isolar apenas 1 ou 2 repetições perfeitas do seu exercício.
                                </Text>
                            </View>
                        </>
                    )}

                </View>
            </View>
        </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  backBtn: { padding: 10 },
  backText: { color: '#666', fontWeight: 'bold' },
  title: { color: '#CCFF00', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  exerciseNameText: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  instructionBox: { backgroundColor: '#111', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#333', width: '100%' },
  instructionText: { color: '#CCFF00', fontSize: 14, fontWeight: 'bold', textAlign: 'center', lineHeight: 22 },
  recordBtn: { backgroundColor: '#CCFF00', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 16, width: '100%', alignItems: 'center', elevation: 5, marginBottom: 15 },
  recordText: { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  galleryBtn: { backgroundColor: '#1A1A1A', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  galleryText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  processingContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  laserLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#CCFF00', shadowColor: '#CCFF00', shadowOpacity: 1, shadowRadius: 15 },
  warningBox: { backgroundColor: 'rgba(255, 59, 48, 0.1)', padding: 15, borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)', width: '100%' },
  warningText: { color: '#FF3B30', fontSize: 12, textAlign: 'center', fontWeight: 'bold', lineHeight: 18 }
});