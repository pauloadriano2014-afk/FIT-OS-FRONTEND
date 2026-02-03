import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Platform, SafeAreaView, TouchableOpacity, 
  TextInput, Image, ScrollView, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckInScreen({ navigation }) {
  const [weight, setWeight] = useState('');
  const [feedback, setFeedback] = useState('');
  const [photos, setPhotos] = useState({ front: null, back: null, side: null });
  const [sending, setSending] = useState(false);

  // --- LÓGICA DE FOTOS ---
  const handleSelectPhoto = (position) => {
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
        quality: 0.5,
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
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setPhotos(prev => ({ ...prev, [position]: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const handleSend = async () => {
    if (!weight) return Alert.alert("Erro", "Informe seu peso atual.");
    
    setSending(true);
    try {
        const stored = await AsyncStorage.getItem('user');
        const user = JSON.parse(stored);

        // Ajuste no endpoint se necessário, mantive o original
        const res = await fetch('https://fitos-final.onrender.com/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                weight: weight.replace(',', '.'),
                feedback,
                photoFront: photos.front,
                photoBack: photos.back,
                photoSide: photos.side
            })
        });

        if (res.ok) {
            Alert.alert("Recebido! 🔥", "Seu treinador analisará suas fotos em breve.");
            navigation.goBack();
        } else {
            Alert.alert("Erro", "Falha ao enviar check-in.");
        }
    } catch (e) {
        Alert.alert("Erro", "Verifique sua conexão.");
    } finally {
        setSending(false);
    }
  };

  const renderPhotoBox = (label, position, icon) => (
    <TouchableOpacity style={styles.photoBox} onPress={() => handleSelectPhoto(position)}>
        {photos[position] ? (
            <Image source={{ uri: photos[position] }} style={styles.photoPreview} />
        ) : (
            <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name={icon} size={30} color="#666" />
                <Text style={styles.photoText}>{label}</Text>
            </View>
        )}
        {photos[position] && <View style={styles.checkBadge}><MaterialCommunityIcons name="check" size={12} color="#000"/></View>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER COM AJUSTE DE STATUS BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOVO CHECK-IN</Text>
        <View style={{width: 40}}/> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
            <Text style={styles.subtitle}>Acompanhamento Semanal</Text>
            <Text style={styles.desc}>Envie suas medidas e fotos para atualização do protocolo.</Text>

            <Text style={styles.label}>PESO ATUAL (KG)</Text>
            <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="Ex: 80.5" 
                placeholderTextColor="#555"
                value={weight}
                onChangeText={setWeight}
            />

            <Text style={styles.label}>FOTOS DO FÍSICO</Text>
            <View style={styles.photosRow}>
                {renderPhotoBox("FRENTE", "front", "account")}
                {renderPhotoBox("LADO", "side", "account-box-outline")}
                {renderPhotoBox("COSTAS", "back", "account-convert")}
            </View>

            <Text style={styles.label}>FEEDBACK (Como foi a semana?)</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline 
                placeholder="Ex: Senti mais força no treino de pernas, dieta 100%..." 
                placeholderTextColor="#555"
                value={feedback}
                onChangeText={setFeedback}
            />

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
                {sending ? <ActivityIndicator color="#000" /> : <Text style={styles.sendBtnText}>ENVIAR PARA O COACH</Text>}
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    // 🔥 CORREÇÃO PRINCIPAL: Empurra o conteúdo para baixo da StatusBar no Android
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 15,
    // borderBottomWidth: 1, 
    // borderBottomColor: '#111' 
  },
  backButton: {
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 10
  },
  headerTitle: { 
    color: '#FFF', 
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
  subtitle: { color: '#CCFF00', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  desc: { color: '#888', fontSize: 12, marginBottom: 25 },
  
  label: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 15, letterSpacing: 0.5 },
  input: { backgroundColor: '#111', color: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#222', fontSize: 14, fontWeight:'bold' },
  textArea: { height: 100, textAlignVertical: 'top' },

  photosRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  photoBox: { width: '31%', aspectRatio: 0.8, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#222', overflow: 'hidden' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoText: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  photoPreview: { width: '100%', height: '100%' },
  checkBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#CCFF00', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex:10 },

  sendBtn: { backgroundColor: '#CCFF00', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 40 },
  sendBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});