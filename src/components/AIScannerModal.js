import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, Dimensions, Platform, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native'; // 🔥 IMPORTANTE: Hook para saber se a tela está ativa

// Importação da API Legada (Necessária para funcionar o uploadType: 1)
import { uploadAsync } from 'expo-file-system/legacy'; 

const { height } = Dimensions.get('window');

const getInstruction = (exercise) => {
  const name = exercise?.toLowerCase() || "";

  // 1. ELEVAÇÃO LATERAL e FRONTAL (Melhor de FRENTE)
  if (name.includes("elevação lateral") || name.includes("frontal") || name.includes("abdução")) {
    return "📸 POSIÇÃO: FRENTE. Celular apoiado na altura do peito.";
  }

  // 2. COSTAS/POSTERIOR (Melhor de COSTAS)
  if (name.includes("remada") || name.includes("puxada") || name.includes("costas") || name.includes("inverso") || name.includes("dorsal")) {
    return "📸 POSIÇÃO: COSTAS ou LADO. Mostre as escápulas.";
  }

  // 3. AGACHAMENTOS/PERNAS (Melhor de LADO)
  if (name.includes("agachamento") || name.includes("terra") || name.includes("stiff") || name.includes("afundo") || name.includes("leg") || name.includes("búlgaro")) {
    return "📸 POSIÇÃO: LADO/DIAGONAL. Afaste 3m para ver quadril e joelho.";
  }

  // 4. PEITORAL/SUPINOS (Melhor na DIAGONAL)
  if (name.includes("supino") || name.includes("fly") || name.includes("peitoral") || name.includes("crossover")) {
    return "📸 POSIÇÃO: DIAGONAL (45°). De cima para baixo se possível.";
  }

  // 5. BRAÇOS/BÍCEPS/TRÍCEPS (FRENTE ou LADO)
  if (name.includes("rosca") || name.includes("tríceps") || name.includes("bíceps") || name.includes("coice") || name.includes("testa")) {
    return "📸 POSIÇÃO: LADO ou FRENTE. Foque no cotovelo.";
  }

  // Padrão genérico
  return "📸 POSIÇÃO: DIAGONAL. Corpo inteiro na tela.";
};

export default function ScannerIA({ navigation, route }) {
  const exerciseName = route?.params?.exName || "Exercício";
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 🔥 Hook para controlar o foco da tela e evitar tela branca
  const isFocused = useIsFocused();

  const cameraRef = useRef(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const currentInstruction = getInstruction(exerciseName);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
        requestPermission();
    }
  }, [permission]);

  // Animação do Laser
  useEffect(() => {
    if (isScanning) {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
                Animated.timing(scanAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
            ])
        ).start();
    } else {
        scanAnim.stopAnimation();
        scanAnim.setValue(0);
    }
  }, [isScanning]);

  const executeRecording = async () => {
    if (!cameraRef.current) return;
    try {
      Vibration.vibrate(500);
      setIsScanning(true);
      
      const video = await cameraRef.current.recordAsync({ 
          quality: '480p', 
          maxDuration: 6, // 6 segundos é o ideal para o peso do arquivo
          mute: true 
      });

      setIsScanning(false);
      setLoadingIA(true);

      console.log("Iniciando Upload (Legacy API)...", video.uri);

      // 🚀 UPLOAD BLINDADO
      const uploadResult = await uploadAsync('https://fitos-final.onrender.com/api/analyze', video.uri, {
        fieldName: 'video',
        httpMethod: 'POST',
        uploadType: 1, // 1 = MULTIPART (O segredo para funcionar no Android)
        parameters: {
            'exerciseName': exerciseName,
            'userLevel': 'Geral'
        },
      });

      console.log("Status Upload:", uploadResult.status);

      setLoadingIA(false);

      if (uploadResult.status === 200) {
        let cleanMessage = "";
        
        try {
             // 🔥 TRATAMENTO DE RESPOSTA PARA REMOVER O JSON FEIO
             const data = JSON.parse(uploadResult.body);
             
             // Monta uma mensagem bonita se for objeto
             if (typeof data === 'object') {
                const feedbackPart = data.feedback || "Análise concluída.";
                const correctionPart = data.correction ? `\n\n💡 DICA: ${data.correction}` : "";
                cleanMessage = `${feedbackPart}${correctionPart}`;
             } else {
                cleanMessage = String(data);
             }

        } catch (e) {
             // Se falhar o parse, usa o texto puro mas tenta limpar aspas extras
             cleanMessage = uploadResult.body.replace(/["{}]/g, ""); 
        }

        // 🤖 ALERTA LIMPO
        Alert.alert("💀 COACH PAULO TEAM", cleanMessage, [
            { text: "ENTENDI", onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorData = JSON.parse(uploadResult.body || "{}");
        throw new Error(errorData.error || errorData.details || "Erro no servidor.");
      }

    } catch (error) {
      console.error("Erro Scanner:", error);
      setIsScanning(false);
      setLoadingIA(false);
      Alert.alert("Erro", "Falha no envio: " + error.message);
    }
  };

  const startCountdown = () => {
    if (isScanning || countdown > 0) return;
    setCountdown(7);
    Vibration.vibrate(100); 

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          executeRecording();
          return 0;
        }
        Vibration.vibrate(100); 
        return prev - 1;
      });
    }, 1000);
  };

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.45],
  });

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator color="#CCFF00" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
         <Text style={{color:'#FFF', marginBottom:20, textAlign:'center'}}>Precisamos da câmera para analisar sua execução.</Text>
         <TouchableOpacity style={styles.recordBtn} onPress={requestPermission}><Text style={styles.recordText}>ATIVAR CÂMERA</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>VOLTAR</Text>
            </TouchableOpacity>
            <Text style={styles.title}>SCANNER BIOMECÂNICO</Text>
            <View style={{width: 50}} /> 
        </View>

        <Text style={styles.exerciseNameText}>{exerciseName}</Text>

        <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>{currentInstruction}</Text>
        </View>

        <View style={styles.cameraContainer}>
            {/* 🔥 CORREÇÃO TELA BRANCA: Só renderiza a câmera se a tela estiver focada */}
            {isFocused && (
                <CameraView 
                    style={styles.camera} 
                    facing="back" 
                    ref={cameraRef} 
                    mode="video"
                    mute={true} 
                />
            )}
            
            {countdown > 0 && (
                <View style={styles.countdownOverlay}>
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={{color:'#CCFF00', fontWeight:'bold', marginTop:10}}>PREPARE-SE...</Text>
                </View>
            )}
            
            {isScanning && <Animated.View style={[styles.laserLine, { transform: [{ translateY }] }]} />}
            
            {loadingIA && (
                <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#CCFF00" />
                <Text style={styles.loadingText}>ENVIANDO PARA O COACH...</Text>
                </View>
            )}
        </View>

        {!loadingIA && (
            <TouchableOpacity 
                style={[styles.recordBtn, isScanning && { backgroundColor: '#FF3B30' }]} 
                onPress={() => isScanning ? cameraRef.current?.stopRecording() : startCountdown()}
                disabled={countdown > 0}
            >
                <Text style={styles.recordText}>
                    {isScanning ? "PARAR AGORA" : countdown > 0 ? "POSICIONE O CELULAR" : "INICIAR ANÁLISE (6s)"}
                </Text>
            </TouchableOpacity>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 30 },
  backBtn: { padding: 10 },
  backText: { color: '#666', fontWeight: 'bold' },
  title: { color: '#CCFF00', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  exerciseNameText: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  instructionBox: { backgroundColor: '#111', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  instructionText: { color: '#CCFF00', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  cameraContainer: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#111', marginBottom: 20 },
  camera: { flex: 1 },
  laserLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#CCFF00', zIndex: 10, shadowColor: '#CCFF00', shadowOpacity: 0.8, shadowRadius: 10 },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  countdownText: { color: '#CCFF00', fontSize: 80, fontWeight: '900' },
  recordBtn: { backgroundColor: '#CCFF00', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 10 },
  recordText: { color: '#000', fontWeight: '900', fontSize: 16 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#CCFF00', marginTop: 15, fontWeight: 'bold', letterSpacing: 1 }
});