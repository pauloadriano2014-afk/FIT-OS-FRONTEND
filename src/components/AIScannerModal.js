import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, Dimensions, Platform, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { height } = Dimensions.get('window');

const getInstruction = (exercise) => {
  const name = exercise?.toLowerCase() || "";
  if (name.includes("agachamento") || name.includes("terra") || name.includes("stiff") || name.includes("afundo") || name.includes("leg press")) {
    return "📸 POSIÇÃO: LADO. Afaste 3m na altura do quadril.";
  }
  if (name.includes("supino") || name.includes("fly") || name.includes("peitoral")) {
    return "📸 POSIÇÃO: DIAGONAL (45°). Celular à frente e de lado.";
  }
  if (name.includes("rosca") || name.includes("tríceps") || name.includes("bíceps") || name.includes("desenvolvimento")) {
    return "📸 POSIÇÃO: FRENTE ou LADO. Do quadril até acima da cabeça.";
  }
  if (name.includes("remada") || name.includes("puxada") || name.includes("costas")) {
    return "📸 POSIÇÃO: LADO ou COSTAS. Mostre a escápula.";
  }
  return "📸 POSIÇÃO: LADO. Corpo inteiro na tela.";
};

export default function ScannerIA({ navigation, route }) {
  const exerciseName = route?.params?.exName || "Exercício";
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);
  // Removido estado de userLevel
  const [countdown, setCountdown] = useState(0);

  const cameraRef = useRef(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const currentInstruction = getInstruction(exerciseName);

  // Solicita permissão automaticamente
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
      // 📳 VIBRAR LONGO PARA AVISAR QUE COMEÇOU A GRAVAR
      Vibration.vibrate(500);
      
      setIsScanning(true);
      
      const video = await cameraRef.current.recordAsync({ 
          quality: '480p', // Qualidade leve
          maxDuration: 10, // 🔥 10 SEGUNDOS (Otimizado para o servidor)
          mute: true 
      });

      setIsScanning(false);
      setLoadingIA(true);

      const formData = new FormData();
      
      const uri = Platform.OS === 'android' ? video.uri : video.uri.replace('file://', '');
      const filename = video.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : `video/mp4`;

      formData.append('video', { uri, name: filename, type });
      formData.append('exerciseName', exerciseName);
      // Removido envio de userLevel

      console.log("Enviando vídeo para análise...");

      const response = await fetch('[https://fitos-final.onrender.com/api/analyze](https://fitos-final.onrender.com/api/analyze)', {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json',
        },
      });

      // Tratamento de erro caso venha vazio
      const textResponse = await response.text();
      let data;
      try {
          data = JSON.parse(textResponse);
      } catch (e) {
          // Se não for JSON, cria um objeto fake com o texto
          data = { feedback: textResponse, score: 0 };
      }

      setLoadingIA(false);

      if (response.ok) {
        // Exibe o feedback vindo do JSON ou texto puro
        Alert.alert("🤖 COACH FIT OS", data.feedback || "Análise concluída.", [
            { text: "ENTENDI", onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(data.details || "A IA não conseguiu analisar.");
      }
    } catch (error) {
      console.error("Erro Scanner:", error);
      setIsScanning(false);
      setLoadingIA(false);
      Alert.alert("Erro", "Falha no envio. Tente novamente.");
    }
  };

  const startCountdown = () => {
    if (isScanning || countdown > 0) return;
    
    // 🔥 INICIA CONTAGEM DE 7 SEGUNDOS (Mais dinâmico)
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
        {/* Header */}
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

        {/* Removido o levelContainer daqui */}

        <View style={styles.cameraContainer}>
            <CameraView 
                style={styles.camera} 
                facing="back" 
                ref={cameraRef} 
                mode="video"
                mute={true} 
            />
            
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
                <Text style={styles.loadingText}>ANALISANDO MOVIMENTO...</Text>
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
                    {isScanning ? "PARAR AGORA" : countdown > 0 ? "POSICIONE O CELULAR" : "INICIAR ANÁLISE (10s)"}
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