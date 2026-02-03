import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, 
  Image, TextInput, Alert, ActivityIndicator, StatusBar, RefreshControl, Linking, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ route }) {
  const { userData: paramsUser = {} } = route?.params || {};
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [userName, setUserName] = useState("Atleta");
  const [email, setEmail] = useState(""); 
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [userData, setUserData] = useState(paramsUser); 
  const [userXP, setUserXP] = useState(0);

  // --- LÓGICA DE NÍVEL (Gamification) ---
  const currentLevel = Math.floor(userXP / 1000) + 1;
  const xpToNextLevel = 1000 - (userXP % 1000);
  const progressPercent = (userXP % 1000) / 10; 

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const getSafeId = async () => {
    if (userData?.id) return userData.id;
    try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) return JSON.parse(stored).id;
    } catch (e) { return null; }
    return null;
  };

  const loadProfileData = async () => {
    setRefreshing(true);
    try {
      const userId = await getSafeId();
      if (!userId) { setRefreshing(false); return; }

      let userObj = paramsUser;
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) userObj = JSON.parse(storedUser);

      setUserData(userObj);
      setUserName(userObj.name || "Atleta");
      setEmail(userObj.email || ""); 
      setPhone(userObj.phone || "");

      // Carrega XP e Foto do Storage Local
      const [xp, savedImage] = await Promise.all([
        AsyncStorage.getItem(`@user_xp_${userId}`),
        AsyncStorage.getItem(`@user_profile_image_${userId}`)
      ]);

      if (xp) setUserXP(parseInt(xp));
      else if (userObj.currentXP) setUserXP(userObj.currentXP);

      if (savedImage) setProfileImage(savedImage);

    } catch (e) {
      console.log("Erro Load:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        return Alert.alert("Permissão", "Precisamos de acesso à galeria.");
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2, 
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProfileImage(imageBase64);
        
        const userId = await getSafeId();
        if (userId) {
              try {
                await AsyncStorage.setItem(`@user_profile_image_${userId}`, imageBase64);
              } catch (error) {
                Alert.alert("Erro", "Imagem muito grande.");
              }
        }
      }
    } catch (e) { console.log("Erro Foto:", e); }
  };

  const saveContactInfo = async () => {
    const userId = await getSafeId();
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch('https://fitos-final.onrender.com/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, name: userName, phone: phone })
      });

      if (response.ok) {
        const updatedUser = { ...userData, name: userName, phone: phone };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        Alert.alert("Sucesso", "Perfil atualizado!");
      } else {
        Alert.alert("Erro", "Não foi possível atualizar.");
      }
    } catch (e) { Alert.alert("Erro", "Verifique sua conexão."); } 
    finally { setLoading(false); }
  };

  // 🔥 FUNÇÃO DO WHATSAPP CORRIGIDA (LINK UNIVERSAL)
  const openWhatsApp = async () => {
      // Seu número: 55 41 99799-1346
      const phoneNumber = '5541997991346'; 
      const message = `Olá Coach! Preciso de um suporte.`;
      
      // O link universal funciona melhor no Android 11+
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      try {
          await Linking.openURL(url);
      } catch (error) {
          Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
      }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sair",
      "Deseja desconectar sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: 'destructive',
          onPress: async () => {
            try {
                await AsyncStorage.multiRemove(['user', 'token']); 
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
            } catch (e) {
                Alert.alert("Erro", "Falha ao sair.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProfileData} tintColor="#CCFF00"/>}
      >
        
        {/* HEADER DE PERFIL */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
                <View style={styles.camIcon}><MaterialCommunityIcons name="camera" size={14} color="#000" /></View>
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.userName}>{userName}</Text>

          {/* BARRA DE XP / NÍVEL */}
          <View style={styles.xpContainer}>
              <View style={styles.xpHeader}>
                  <Text style={styles.xpLabel}>NÍVEL {currentLevel}</Text>
                  <Text style={styles.xpValue}>{userXP} XP</Text>
              </View>
              <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, {width: `${progressPercent}%`}]} />
              </View>
              <Text style={styles.xpNext}>Faltam {xpToNextLevel} XP para o próximo nível</Text>
          </View>
        </View>

        {/* STATUS DA ASSINATURA */}
        <View style={[styles.card, {borderColor: userData?.plan === 'ELITE' ? '#CCFF00' : '#333'}]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                <Text style={styles.cardTitle}>PLANO ATUAL</Text>
                {userData?.plan === 'ELITE' && <MaterialCommunityIcons name="crown" size={20} color="#CCFF00" />}
            </View>
            <Text style={styles.planName}>{userData?.plan || "GRATUITO"}</Text>
            <Text style={styles.planDesc}>
                {userData?.plan === 'ELITE' ? 'Acesso total a treinos e dieta.' : 'Funcionalidades básicas.'}
            </Text>
        </View>

        {/* 🔥 BOTÃO WHATSAPP (NOVO) */}
        <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
            <MaterialCommunityIcons name="whatsapp" size={28} color="#FFF" />
            <View style={{flex:1}}>
                <Text style={styles.wppTitle}>FALAR COM O COACH</Text>
                <Text style={styles.wppSubtitle}>Tire dúvidas ou ajuste seu treino</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        {/* DADOS DE CONTATO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MEUS DADOS</Text>
          
          <Text style={styles.label}>Nome</Text>
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="account-outline" size={20} color="#555" />
            <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Seu Nome" placeholderTextColor="#333" />
          </View>

          <Text style={styles.label}>E-mail</Text>
          <View style={[styles.inputGroup, {opacity: 0.6, backgroundColor: '#111'}]}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#555" />
            <TextInput 
                style={[styles.input, {color: '#888'}]} 
                value={email} 
                editable={false} 
                placeholder="E-mail" 
                placeholderTextColor="#333" 
            />
            <MaterialCommunityIcons name="lock" size={16} color="#444" />
          </View>

          <Text style={styles.label}>WhatsApp</Text>
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="whatsapp" size={20} color="#555" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Telefone" placeholderTextColor="#333" />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveContactInfo} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>SALVAR ALTERAÇÕES</Text>}
          </TouchableOpacity>
        </View>

        {/* BOTÃO LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#FF4444" />
          <Text style={styles.logoutBtnText}>SAIR DA CONTA</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Versão 2.1.0 • FIT OS App</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    // 🔥 CORREÇÃO TOPO SEGURO
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  header: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#CCFF00' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  avatarInitial: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  camIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#CCFF00', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  
  userName: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 10 },
  
  xpContainer: { width: '100%', marginTop: 10, paddingHorizontal: 10 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { color: '#CCFF00', fontWeight: 'bold', fontSize: 12 },
  xpValue: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  xpBarBg: { height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#CCFF00' },
  xpNext: { color: '#444', fontSize: 10, marginTop: 5, textAlign: 'center', fontStyle: 'italic' },

  card: { backgroundColor: '#111', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  cardTitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
  
  planName: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 2 },
  planDesc: { color: '#888', fontSize: 12 },

  // Estilo do Botão WhatsApp
  whatsappBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#25D366', padding: 20, borderRadius: 16, gap: 15, marginBottom: 20, elevation: 5 },
  wppTitle: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  wppSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },

  label: { color: '#CCFF00', fontSize: 11, fontWeight: 'bold', marginBottom: 6, marginLeft: 2 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080808', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, height: 50, borderWidth: 1, borderColor: '#222' },
  input: { flex: 1, color: '#FFF', marginLeft: 10, fontSize: 14, fontWeight: '500' },
  
  saveBtn: { backgroundColor: '#CCFF00', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  saveBtnText: { color: '#000', fontSize: 13, fontWeight: '900' },
  
  logoutBtn: { flexDirection: 'row', backgroundColor: '#1a0505', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#330000' },
  logoutBtnText: { color: '#FF4444', fontSize: 12, fontWeight: '900', marginLeft: 10 },
  
  version: { textAlign: 'center', color: '#333', fontSize: 10 }
});