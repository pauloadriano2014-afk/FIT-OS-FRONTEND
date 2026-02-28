import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, 
  Image, TextInput, Alert, ActivityIndicator, StatusBar, RefreshControl, Linking, Platform, Switch 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

/* 🔥 IMPORTAÇÃO DO TEMA */
import { useTheme } from '../contexts/ThemeContext';

export default function ProfileScreen({ route }) {
  const { userData: paramsUser = {} } = route?.params || {};
  const navigation = useNavigation();
  
  // 🔥 PUXA O TEMA E A FUNÇÃO DE TROCAR
  const { theme, changeTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [userName, setUserName] = useState("Atleta");
  const [email, setEmail] = useState(""); 
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [userData, setUserData] = useState(paramsUser); 
  const [userXP, setUserXP] = useState(0);

  // States para o controle do tema visual na tela
  const [selectedColor, setSelectedColor] = useState('verde');

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

      const [xp, savedImage, savedThemeObj] = await Promise.all([
        AsyncStorage.getItem(`@user_xp_${userId}`),
        AsyncStorage.getItem(`@user_profile_image_${userId}`),
        AsyncStorage.getItem('app_theme')
      ]);

      if (xp) setUserXP(parseInt(xp));
      else if (userObj.currentXP) setUserXP(userObj.currentXP);

      if (savedImage) setProfileImage(savedImage);
      
      // Descobre qual a cor ativa para pintar a bolinha certa
      if (savedThemeObj) {
          const parsedTheme = JSON.parse(savedThemeObj);
          if (parsedTheme.accent === '#FF2D55') setSelectedColor('rosa');
          else if (parsedTheme.accent === '#AF52DE') setSelectedColor('roxo');
          else if (parsedTheme.accent === '#007AFF') setSelectedColor('azul');
          else if (parsedTheme.accent === '#FF3B30') setSelectedColor('vermelho');
          else setSelectedColor('verde');
      }

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

  const openWhatsApp = async () => {
      const phoneNumber = '5541997991346'; 
      const message = `Olá Coach! Preciso de um suporte.`;
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      try {
          await Linking.openURL(url);
      } catch (error) {
          Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
      }
  };

  // 🔥 SOLUÇÃO DEFINITIVA DO LOGOUT NO PWA
  const executeLogout = async () => {
      try {
          await AsyncStorage.multiRemove(['user', 'token', 'app_theme']); 
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
      } catch (e) {
          Alert.alert("Erro", "Falha ao sair.");
      }
  };

  const handleLogout = () => {
      if (Platform.OS === 'web') {
          // O navegador bloqueia os botões customizados do React Native, então usamos o nativo do Browser
          const confirmLogout = window.confirm("Deseja desconectar sua conta?");
          if (confirmLogout) {
              executeLogout();
          }
      } else {
          // No app nativo (iOS/Android), funciona perfeitamente com estilo
          Alert.alert(
            "Sair",
            "Deseja desconectar sua conta?",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Sair", style: 'destructive', onPress: executeLogout }
            ]
          );
      }
  };

  // 🔥 FUNÇÕES DE CONTROLE DE TEMA
  const toggleDarkMode = (newValue) => {
      if (newValue) {
          // Se for ligar o modo escuro, força a cor verde
          setSelectedColor('verde');
          changeTheme(true, 'verde');
      } else {
          // Se for ligar o modo claro, mantém a cor que estava ou vai pro verde
          changeTheme(false, selectedColor);
      }
  };

  const selectThemeColor = (colorKey) => {
      setSelectedColor(colorKey);
      changeTheme(theme.isDark, colorKey);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProfileData} tintColor={theme.accent}/>}
      >
        
        {/* HEADER DE PERFIL */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={[styles.avatar, { borderColor: theme.accent }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.avatarInitial, { color: theme.text }]}>{userName.charAt(0).toUpperCase()}</Text>
                <View style={[styles.camIcon, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="camera" size={14} color={theme.isDark ? "#000" : "#FFF"} /></View>
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>

          {/* BARRA DE XP / NÍVEL */}
          <View style={styles.xpContainer}>
              <View style={styles.xpHeader}>
                  <Text style={[styles.xpLabel, { color: theme.accent }]}>NÍVEL {currentLevel}</Text>
                  <Text style={[styles.xpValue, { color: theme.text }]}>{userXP} XP</Text>
              </View>
              <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                  <View style={[styles.xpBarFill, { width: `${progressPercent}%`, backgroundColor: theme.accent }]} />
              </View>
              <Text style={styles.xpNext}>Faltam {xpToNextLevel} XP para o próximo nível</Text>
          </View>
        </View>

        {/* 🔥 OPÇÕES DE APARÊNCIA E TEMA */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.cardTitle}>APARÊNCIA DO APP</Text>
            
            {/* Chave de Modo Escuro/Claro */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialCommunityIcons name={theme.isDark ? "moon-waning-crescent" : "white-balance-sunny"} size={24} color={theme.text} />
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Modo Escuro</Text>
                </View>
                <Switch 
                    value={theme.isDark}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: '#ccc', true: theme.accent }}
                    thumbColor={Platform.OS === 'ios' ? '#FFF' : (theme.isDark ? '#FFF' : '#f4f3f4')}
                />
            </View>

            {/* Bolinhas de Cores (Só aparecem se o modo Claro estiver ativado) */}
            {!theme.isDark && (
                <View>
                    <Text style={[styles.cardTitle, { marginBottom: 10, marginTop: 10 }]}>COR DE DESTAQUE</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                        <TouchableOpacity onPress={() => selectThemeColor('verde')} style={[styles.colorCircle, { backgroundColor: '#99CC00', borderColor: selectedColor === 'verde' ? theme.text : 'transparent' }]} />
                        <TouchableOpacity onPress={() => selectThemeColor('rosa')} style={[styles.colorCircle, { backgroundColor: '#FF2D55', borderColor: selectedColor === 'rosa' ? theme.text : 'transparent' }]} />
                        <TouchableOpacity onPress={() => selectThemeColor('roxo')} style={[styles.colorCircle, { backgroundColor: '#AF52DE', borderColor: selectedColor === 'roxo' ? theme.text : 'transparent' }]} />
                        <TouchableOpacity onPress={() => selectThemeColor('azul')} style={[styles.colorCircle, { backgroundColor: '#007AFF', borderColor: selectedColor === 'azul' ? theme.text : 'transparent' }]} />
                        <TouchableOpacity onPress={() => selectThemeColor('vermelho')} style={[styles.colorCircle, { backgroundColor: '#FF3B30', borderColor: selectedColor === 'vermelho' ? theme.text : 'transparent' }]} />
                    </View>
                </View>
            )}
        </View>

        {/* STATUS DA ASSINATURA */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: userData?.plan === 'ELITE' ? theme.accent : theme.border }]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                <Text style={styles.cardTitle}>PLANO ATUAL</Text>
                {userData?.plan === 'ELITE' && <MaterialCommunityIcons name="crown" size={20} color={theme.accent} />}
            </View>
            <Text style={[styles.planName, { color: theme.text }]}>{userData?.plan || "GRATUITO"}</Text>
            <Text style={styles.planDesc}>
                {userData?.plan === 'ELITE' ? 'Acesso total a treinos e dieta.' : 'Funcionalidades básicas.'}
            </Text>
        </View>

        {/* BOTÃO WHATSAPP */}
        <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
            <MaterialCommunityIcons name="whatsapp" size={28} color="#FFF" />
            <View style={{flex:1}}>
                <Text style={styles.wppTitle}>FALAR COM O COACH</Text>
                <Text style={styles.wppSubtitle}>Tire dúvidas ou ajuste seu treino</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        {/* DADOS DE CONTATO */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.cardTitle}>MEUS DADOS</Text>
          
          <Text style={[styles.label, { color: theme.accent }]}>Nome</Text>
          <View style={[styles.inputGroup, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="account-outline" size={20} color={theme.textSecondary} />
            <TextInput style={[styles.input, { color: theme.text }]} value={userName} onChangeText={setUserName} placeholder="Seu Nome" placeholderTextColor={theme.textSecondary} />
          </View>

          <Text style={[styles.label, { color: theme.accent }]}>E-mail</Text>
          <View style={[styles.inputGroup, { opacity: 0.6, backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="email-outline" size={20} color={theme.textSecondary} />
            <TextInput style={[styles.input, { color: theme.textSecondary }]} value={email} editable={false} />
            <MaterialCommunityIcons name="lock" size={16} color={theme.textSecondary} />
          </View>

          <Text style={[styles.label, { color: theme.accent }]}>WhatsApp</Text>
          <View style={[styles.inputGroup, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="whatsapp" size={20} color={theme.textSecondary} />
            <TextInput style={[styles.input, { color: theme.text }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Telefone" placeholderTextColor={theme.textSecondary} />
          </View>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={saveContactInfo} disabled={loading}>
            {loading ? <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} /> : <Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR ALTERAÇÕES</Text>}
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
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  header: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  avatarInitial: { fontSize: 36, fontWeight: 'bold' },
  camIcon: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  
  userName: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  
  xpContainer: { width: '100%', marginTop: 10, paddingHorizontal: 10 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { fontWeight: 'bold', fontSize: 12 },
  xpValue: { fontWeight: 'bold', fontSize: 12 },
  xpBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%' },
  xpNext: { color: '#888', fontSize: 10, marginTop: 5, textAlign: 'center', fontStyle: 'italic' },

  card: { padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  cardTitle: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
  
  colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },

  planName: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  planDesc: { color: '#888', fontSize: 12 },

  whatsappBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#25D366', padding: 20, borderRadius: 16, gap: 15, marginBottom: 20, elevation: 5 },
  wppTitle: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  wppSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },

  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, marginLeft: 2 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, height: 50, borderWidth: 1 },
  input: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '500' },
  
  saveBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  saveBtnText: { fontSize: 13, fontWeight: '900' },
  
  logoutBtn: { flexDirection: 'row', backgroundColor: '#FFE5E5', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FFB2B2' },
  logoutBtnText: { color: '#FF4444', fontSize: 12, fontWeight: '900', marginLeft: 10 },
  
  version: { textAlign: 'center', color: '#888', fontSize: 10 }
});