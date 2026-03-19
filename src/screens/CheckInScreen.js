// src/screens/CheckInScreen.js
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Platform, SafeAreaView, TouchableOpacity, 
  TextInput, Image, ScrollView, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';

// INSIRA ESTE BLOCO NO TOPO DOS ARQUIVOS, LOGO APÓS OS IMPORTS

// 🔥 CURA MÁGICA DO PWA: Impede o navegador de dar zoom e mover a tela ao abrir o teclado
if (Platform.OS === 'web' && typeof window !== 'undefined' && window.visualViewport) {
  const handler = () => {
    // Detecta a altura visível do viewport (o espaço que sobrou acima do teclado)
    const viewportHeight = window.visualViewport.height;
    // Força o contêiner principal a usar essa altura, sem se mover
    document.documentElement.style.height = `${viewportHeight}px`;
    document.body.style.height = `${viewportHeight}px`;
    // Garante que o input focado permaneça visível, mas sem zoom
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      document.activeElement.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  };
  // Escuta os eventos de mudança de redimensionamento e de rolagem do viewport
  window.visualViewport.addEventListener('resize', handler);
  window.visualViewport.addEventListener('scroll', handler);
}

export default function CheckInScreen({ navigation }) {
  const [weight, setWeight] = useState('');
  const [feedback, setFeedback] = useState('');
  const [photos, setPhotos] = useState({ front: null, back: null, side: null });
  const [sending, setSending] = useState(false);

  // 🔥 PUXA AS CORES DO CONTEXTO
  const { theme } = useTheme();

  // --- LÓGICA DE FOTOS ---
  const handleSelectPhoto = (position) => {
    if (Platform.OS === 'web') {
        window.alert("Escolha a origem da imagem:\n1. Tirar Foto\n2. Escolher da Galeria");
        openGallery(position); // Web costuma puxar melhor o input de arquivo direto pela galeria
        return;
    }

    Alert.alert(
        "Enviar Foto",
        "Escolha a origem da imagem:",
        [
            { text: "📷 Tirar Foto Agora", onPress: () => openCamera(position) },
            { text: "🖼️ Escolher da Galeria", onPress: () => openGallery(position) },
            { text: "Cancelar", style: "cancel" }
        ]
    );
  };

  const openCamera = async (position) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
        Alert.alert("Permissão Negada", "Precisamos de acesso à câmera.");
        return;
    }
    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1, // 🔥 CURA DA TEKPIX: Força 100% de qualidade da câmera
        base64: true,
        allowsEditing: false,
    });
    if (!result.canceled && result.assets[0].base64) {
        setPhotos(prev => ({ ...prev, [position]: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const openGallery = async (position) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        Alert.alert("Permissão", "Precisamos acessar a galeria.");
        return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1, // 🔥 CURA DA TEKPIX: Força 100% de qualidade da galeria
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setPhotos(prev => ({ ...prev, [position]: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const handleSend = async () => {
    // 🔥 CURA DO BOTÃO FANTASMA: Bloqueia e avisa o aluno se faltar alguma coisa!
    if (!weight) {
        if (Platform.OS === 'web') window.alert("Atenção: O campo de peso é obrigatório.");
        else Alert.alert("Atenção", "O campo de peso é obrigatório.");
        return;
    }
    if (!photos.front || !photos.side || !photos.back) {
        if (Platform.OS === 'web') window.alert("Atenção: Você precisa anexar as 3 fotos (Frente, Lado e Costas).");
        else Alert.alert("Faltam Fotos", "Você precisa anexar as 3 fotos (Frente, Lado e Costas) para concluir o check-in.");
        return;
    }
    
    setSending(true);
    try {
        const stored = await AsyncStorage.getItem('user');
        const user = JSON.parse(stored);

        const res = await fetch('https://fitos-final.onrender.com/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                weight: weight.replace(',', '.'), // Proteção de vírgula para não quebrar banco
                feedback,
                photoFront: photos.front,
                photoBack: photos.back,
                photoSide: photos.side
            })
        });

        if (res.ok) {
            if (Platform.OS === 'web') window.alert("Recebido! 🔥\nSeu treinador analisará suas fotos em breve.");
            else Alert.alert("Recebido! 🔥", "Seu treinador analisará suas fotos em breve.");
            navigation.goBack();
        } else {
            const errorJson = await res.json();
            if (Platform.OS === 'web') window.alert("Erro ao enviar: " + (errorJson.error || "Falha desconhecida"));
            else Alert.alert("Erro", errorJson.error || "Falha ao enviar check-in.");
        }
    } catch (e) {
        if (Platform.OS === 'web') window.alert("Erro de Conexão. Tente novamente.");
        else Alert.alert("Erro", "Verifique sua conexão.");
    } finally {
        setSending(false);
    }
  };

  const renderPhotoBox = (label, position, icon) => (
    <TouchableOpacity style={[styles.photoBox, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => handleSelectPhoto(position)}>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>NOVO CHECK-IN</Text>
        <View style={{width: 40}}/> 
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
            <Text style={[styles.subtitle, { color: theme.accent }]}>Acompanhamento Semanal</Text>
            <Text style={[styles.desc, { color: theme.textSecondary }]}>Envie suas medidas e fotos para atualização do protocolo.</Text>

            <Text style={[styles.label, { color: theme.text }]}>PESO ATUAL (KG)</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                keyboardType="decimal-pad" // 🔥 CURA DO TECLADO: Sempre mostra vírgula
                placeholder="Ex: 80.5" 
                placeholderTextColor={theme.textSecondary}
                value={weight}
                onChangeText={setWeight}
            />

            <Text style={[styles.label, { color: theme.text }]}>FOTOS DO FÍSICO</Text>
            <View style={styles.photosRow}>
                {renderPhotoBox("FRENTE", "front", "account")}
                {renderPhotoBox("LADO", "side", "account-box-outline")}
                {renderPhotoBox("COSTAS", "back", "account-convert")}
            </View>

            <Text style={[styles.label, { color: theme.text }]}>FEEDBACK (Como foi a semana?)</Text>
            <TextInput 
                style={[styles.input, styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                multiline 
                placeholder="Ex: Senti mais força no treino de pernas, dieta 100%..." 
                placeholderTextColor={theme.textSecondary}
                value={feedback}
                onChangeText={setFeedback}
            />

            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.accent }]} onPress={handleSend} disabled={sending}>
                {sending ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <Text style={[styles.sendBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>ENVIAR PARA O COACH</Text>}
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 10
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: '900',
    letterSpacing: 1
  },
  scrollContent: {
      paddingBottom: 40
  },
  content: {
      padding: 20
  },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  desc: { fontSize: 12, marginBottom: 25 },
  
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 15, letterSpacing: 0.5 },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, fontWeight:'bold' },
  textArea: { height: 100, textAlignVertical: 'top' },

  photosRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  photoBox: { width: '31%', aspectRatio: 0.8, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoText: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  checkBadge: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex:10 },

  sendBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 40 },
  sendBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});