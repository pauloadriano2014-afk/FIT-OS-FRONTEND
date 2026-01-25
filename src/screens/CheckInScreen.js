import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, Image, ScrollView, Alert, ActivityIndicator, StatusBar, Modal 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckInScreen({ navigation }) {
  const [weight, setWeight] = useState('');
  const [feedback, setFeedback] = useState('');
  const [photos, setPhotos] = useState({ front: null, back: null, side: null });
  const [sending, setSending] = useState(false);

  // 🔥 NOVA FUNÇÃO: PERGUNTA SE QUER CÂMERA OU GALERIA
  const handleSelectPhoto = (position) => {
    Alert.alert(
        "Enviar Foto",
        "Escolha a origem da imagem:",
        [
            { 
                text: "📷 Tirar Foto Agora", 
                onPress: () => openCamera(position) 
            },
            { 
                text: "🖼️ Escolher da Galeria", 
                onPress: () => openGallery(position) 
            },
            { text: "Cancelar", style: "cancel" }
        ]
    );
  };

  const openCamera = async (position) => {
    // 1. Pede permissão de CÂMERA
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
        Alert.alert("Permissão Negada", "Precisamos de acesso à câmera para o Check-in.");
        return;
    }

    // 2. Abre a Câmera
    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5, // Leve para upload rápido
        base64: true,
        allowsEditing: false,
    });

    if (!result.canceled && result.assets[0].base64) {
        setPhotos(prev => ({ ...prev, [position]: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const openGallery = async (position) => {
    // 1. Pede permissão de GALERIA
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        Alert.alert("Permissão", "Precisamos acessar a galeria.");
        return;
    }

    // 2. Abre a Galeria
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
    // 🔥 MUDOU AQUI: CHAMA handleSelectPhoto AO INVÉS DE pickImage DIRETO
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>NOVO CHECK-IN</Text>
        <View style={{width:24}}/>
      </View>

      <ScrollView contentContainerStyle={{padding: 20}}>
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
            style={[styles.input, {height: 100, textAlignVertical: 'top'}]} 
            multiline 
            placeholder="Ex: Senti mais força no treino de pernas, dieta 100%..." 
            placeholderTextColor="#555"
            value={feedback}
            onChangeText={setFeedback}
        />

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
            {sending ? <ActivityIndicator color="#000" /> : <Text style={styles.sendBtnText}>ENVIAR PARA O COACH</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, flexDirection: 'row', justifyContent:'space-between', alignItems:'center' },
  title: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  subtitle: { color: '#CCFF00', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  desc: { color: '#888', fontSize: 12, marginBottom: 20 },
  
  label: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  input: { backgroundColor: '#111', color: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', fontSize: 14 },
  
  photosRow: { flexDirection: 'row', justifyContent: 'space-between' },
  photoBox: { width: '31%', aspectRatio: 0.8, backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoText: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  photoPreview: { width: '100%', height: '100%' },
  checkBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#CCFF00', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },

  sendBtn: { backgroundColor: '#CCFF00', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  sendBtnText: { color: '#000', fontWeight: '900', fontSize: 14 }
});