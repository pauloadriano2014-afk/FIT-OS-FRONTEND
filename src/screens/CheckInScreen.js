// src/screens/CheckInScreen.js
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Platform, TouchableOpacity, 
  TextInput, Image, ScrollView, Alert, ActivityIndicator, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // 🔥 A CURA: Usando a mesma biblioteca do AdminDashboard
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

  const { theme } = useTheme();

  const handleSelectPhoto = (position, isExtra = false) => {
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
      setExtraPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!weight) {
        if (Platform.OS === 'web') window.alert("Atenção: O campo de peso é obrigatório.");
        else Alert.alert("Atenção", "O campo de peso é obrigatório.");
        return;
    }
    if (!photos.front || !photos.side || !photos.back) {
        if (Platform.OS === 'web') window.alert("Atenção: Você precisa anexar as 3 fotos base (Frente, Lado e Costas).");
        else Alert.alert("Faltam Fotos", "Você precisa anexar as 3 fotos base (Frente, Lado e Costas) para concluir o check-in.");
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
                weight: weight.replace(',', '.'), 
                feedback,
                photoFront: photos.front,
                photoBack: photos.back,
                photoSide: photos.side,
                extraPhotos: extraPhotos 
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

  // 🔥 ESTRUTURA MILIMETRICAMENTE IGUAL AO ADMIN DASHBOARD
  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg };

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>NOVO CHECK-IN</Text>
            <View style={{width: 40}}/> 
          </View>

          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 150 }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.subtitle, { color: theme.accent }]}>Acompanhamento Quinzenal</Text>
            <Text style={[styles.desc, { color: theme.textSecondary }]}>Envie suas medidas e fotos para atualização do protocolo.</Text>

            <Text style={[styles.label, { color: theme.text }]}>PESO ATUAL (KG)</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                keyboardType="decimal-pad" 
                placeholder="Ex: 80.5" 
                placeholderTextColor={theme.textSecondary}
                value={weight}
                onChangeText={setWeight}
            />

            <Text style={[styles.label, { color: theme.text }]}>FOTOS OBRIGATÓRIAS</Text>
            <View style={styles.photosRow}>
                {renderPhotoBox("FRENTE", "front", "account")}
                {renderPhotoBox("LADO", "side", "account-box-outline")}
                {renderPhotoBox("COSTAS", "back", "account-convert")}
            </View>

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
            />

            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.accent }]} onPress={handleSend} disabled={sending}>
                {sending ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <Text style={[styles.sendBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>ENVIAR PARA O COACH</Text>}
            </TouchableOpacity>
          </ScrollView>

      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  // 🔥 Header usa o mesmo espaçamento seguro do AdminDashboard
  header: { paddingTop: Platform.OS === 'android' ? 10 : 0, paddingHorizontal: 20, paddingBottom: 20, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  desc: { fontSize: 12, marginBottom: 25 },
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

  sendBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 40 },
  sendBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});