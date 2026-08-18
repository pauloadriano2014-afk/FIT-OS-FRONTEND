// src/screens/ProfileScreen.js
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
import InstallAppButton from '../components/InstallAppButton';

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

  const [selectedColor, setSelectedColor] = useState('verde');

  // 🔥 RECORRÊNCIA (pagamento automático com cartão salvo via Asaas Checkout)
  const [recurrence, setRecurrence] = useState(null); // null = ainda carregando
  const [recurrenceBusy, setRecurrenceBusy] = useState(false);
  const [recurrenceNeedsCpf, setRecurrenceNeedsCpf] = useState(false);
  const [recurrenceCpf, setRecurrenceCpf] = useState('');

  const currentLevel = Math.floor(userXP / 1000) + 1;
  const xpToNextLevel = 1000 - (userXP % 1000);
  const progressPercent = (userXP % 1000) / 10; 

  useFocusEffect(
    useCallback(() => { loadProfileData(); }, [])
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

      fetchRecurrenceStatus(userId);

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
      if (permissionResult.granted === false) return Alert.alert("Permissão", "Precisamos de acesso à galeria.");

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
              try { await AsyncStorage.setItem(`@user_profile_image_${userId}`, imageBase64); } 
              catch (error) { Alert.alert("Erro", "Imagem muito grande."); }
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
        if(Platform.OS === 'web') window.alert("Perfil atualizado!");
        else Alert.alert("Sucesso", "Perfil atualizado!");
      } else {
        if(Platform.OS === 'web') window.alert("Não foi possível atualizar.");
        else Alert.alert("Erro", "Não foi possível atualizar.");
      }
    } catch (e) { 
        if(Platform.OS === 'web') window.alert("Verifique sua conexão.");
        else Alert.alert("Erro", "Verifique sua conexão."); 
    } 
    finally { setLoading(false); }
  };

  // 🔥 RECORRÊNCIA ────────────────────────────────────────────────────────
  const fetchRecurrenceStatus = async (userId) => {
    try {
      const res = await fetch(`https://fitos-final.onrender.com/api/payments/recurrence/status?userId=${userId}`);
      const data = await res.json();
      setRecurrence(data);
    } catch (e) {
      console.log('Erro ao consultar recorrência:', e);
      setRecurrence({ active: false, status: null });
    }
  };

  const openCheckoutUrl = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir a página de pagamento.');
      });
    }
  };

  const activateRecurrence = async (cpfToSend = null) => {
    const userId = await getSafeId();
    if (!userId) return;
    setRecurrenceBusy(true);
    try {
      const res = await fetch('https://fitos-final.onrender.com/api/payments/recurrence/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...(cpfToSend ? { cpf: cpfToSend } : {}) }),
      });
      const data = await res.json();

      if (data.needsCpf) {
        setRecurrenceNeedsCpf(true);
        return;
      }
      if (data.alreadyActive) {
        await fetchRecurrenceStatus(userId);
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível preparar a recorrência.');
      }

      setRecurrenceNeedsCpf(false);
      setRecurrenceCpf('');
      openCheckoutUrl(data.checkoutUrl);
      await fetchRecurrenceStatus(userId); // vira PENDING_CHECKOUT
    } catch (e) {
      const msg = e.message || 'Erro de conexão. Tente novamente.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
    } finally {
      setRecurrenceBusy(false);
    }
  };

  const confirmRecurrenceCpf = () => {
    const digits = recurrenceCpf.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 14) {
      const msg = 'CPF inválido. Verifique os números.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
      return;
    }
    activateRecurrence(digits);
  };

  const doCancelRecurrence = async () => {
    const userId = await getSafeId();
    if (!userId) return;
    setRecurrenceBusy(true);
    try {
      await fetch('https://fitos-final.onrender.com/api/payments/recurrence/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      await fetchRecurrenceStatus(userId);
    } catch (e) {
      const msg = 'Erro de conexão. Tente novamente.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
    } finally {
      setRecurrenceBusy(false);
    }
  };

  const cancelRecurrence = () => {
    const msg = 'Desativar o pagamento automático? Você vai voltar a pagar manualmente (PIX/cartão/boleto) todo ciclo.';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doCancelRecurrence();
    } else {
      Alert.alert('Desativar recorrência', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desativar', style: 'destructive', onPress: doCancelRecurrence },
      ]);
    }
  };

  const openWhatsApp = async () => {
      const phoneNumber = '5541997991346';
      const message = `Olá Coach! Preciso de um suporte.`;
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      try { await Linking.openURL(url); } 
      catch (error) { Alert.alert("Erro", "Não foi possível abrir o WhatsApp."); }
  };

  const executeLogout = async () => {
      try {
          // 🔥 LÓGICA ANTI-BUG FANTASMA ADICIONADA AQUI 🔥
          // Ao deslogar, garante que apagará QUALQUER rastro de impersonation (Modo Aluno Fantasma)
          await AsyncStorage.multiRemove([
              'user', 'token', 'app_theme', 'role', 
              'original_admin_user', 'original_admin_role'
          ]); 
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } catch (e) { 
          Alert.alert("Erro", "Falha ao sair."); 
      }
  };

  const handleLogout = () => {
      if (Platform.OS === 'web') {
          const confirmLogout = window.confirm("Deseja desconectar sua conta?");
          if (confirmLogout) executeLogout();
      } else {
          Alert.alert("Sair", "Deseja desconectar sua conta?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Sair", style: 'destructive', onPress: executeLogout }
          ]);
      }
  };

  const toggleDarkMode = (newValue) => {
      if (newValue) {
          setSelectedColor('verde');
          changeTheme(true, 'verde');
      } else {
          changeTheme(false, selectedColor);
      }
  };

  const selectThemeColor = (colorKey) => {
      setSelectedColor(colorKey);
      changeTheme(theme.isDark, colorKey);
  };

  // 🔥 Tradutor Visual de Planos (ATUALIZADO COM PERFORMANCE) 🔥
  const getDisplayPlan = () => {
      const dbPlan = String(userData?.plan || 'PREMIUM').toUpperCase();
      switch(dbPlan) {
          case 'LOW_COST': return { name: 'PLANO BÁSICO', icon: 'rocket-launch', desc: 'Funcionalidades básicas.' };
          case 'CHALLENGE_21': return { name: 'DESAFIO 21 DIAS', icon: 'fire', desc: 'Protocolo de 21 dias.' };
          case 'FICHA_8S': return { name: 'FICHA 8 SEMANAS', icon: 'lightning-bolt', desc: 'Protocolo de 8 semanas.' };
          case 'PERFORMANCE': return { name: 'PERFORMANCE', icon: 'arm-flex', desc: 'Foco exclusivo em treinamentos.' };
          case 'ELITE':
          case 'VIP':
          case 'PREMIUM':
               return { name: 'ELITE', icon: 'crown', desc: 'Acesso total a treinos e suporte.' };
          default: return { name: dbPlan, icon: 'star', desc: 'Plano Personalizado.' };
      }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  const displayPlan = getDisplayPlan();

  return (
    <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProfileData} tintColor={theme.accent}/>}
          >
            
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

            {/* 🔥 BOTÃO DE INSTALAR O APP (some sozinho se já estiver instalado) */}
            <InstallAppButton theme={theme} />

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={styles.cardTitle}>APARÊNCIA DO APP</Text>
                
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

            {/* 🔥 CARD DE PLANO COM DATA DE VENCIMENTO 🔥 */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: displayPlan.name === 'ELITE' ? theme.accent : theme.border }]}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                    <Text style={styles.cardTitle}>PLANO ATUAL</Text>
                    <MaterialCommunityIcons name={displayPlan.icon} size={20} color={displayPlan.name === 'ELITE' ? theme.accent : theme.textSecondary} />
                </View>
                <Text style={[styles.planName, { color: theme.text }]}>{displayPlan.name}</Text>
                <Text style={styles.planDesc}>{displayPlan.desc}</Text>

                <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>PRÓXIMO VENCIMENTO:</Text>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '900' }}>
                        {userData?.paymentDueDate ? new Date(userData.paymentDueDate).toLocaleDateString('pt-BR') : 'A DEFINIR'}
                    </Text>
                </View>
            </View>

            {/* 🔥 CARD DE RECORRÊNCIA (pagamento automático com cartão) 🔥 */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={styles.cardTitle}>PAGAMENTO AUTOMÁTICO</Text>
                    <MaterialCommunityIcons
                        name={recurrence?.active ? 'credit-card-check' : 'credit-card-outline'}
                        size={20}
                        color={recurrence?.active ? theme.accent : theme.textSecondary}
                    />
                </View>

                {recurrence === null ? (
                    <ActivityIndicator color={theme.accent} style={{ marginVertical: 10 }} />
                ) : recurrence.active ? (
                    <View>
                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
                            Recorrência ativa ✅
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 15 }}>
                            {recurrence.nextDueDate
                                ? `Próxima cobrança automática: ${new Date(recurrence.nextDueDate).toLocaleDateString('pt-BR')}`
                                : 'Seu cartão está salvo e será cobrado automaticamente a cada ciclo.'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.recurrenceCancelBtn, { borderColor: theme.border }]}
                            onPress={cancelRecurrence}
                            disabled={recurrenceBusy}
                        >
                            {recurrenceBusy
                                ? <ActivityIndicator color={theme.textSecondary} />
                                : <Text style={{ color: '#FF4444', fontWeight: '900', fontSize: 12 }}>DESATIVAR RECORRÊNCIA</Text>}
                        </TouchableOpacity>
                    </View>
                ) : recurrence.status === 'PENDING_CHECKOUT' ? (
                    <View>
                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
                            Aguardando confirmação do cartão…
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 15 }}>
                            Se você já cadastrou o cartão na página da Asaas, arraste a tela pra baixo pra atualizar.
                        </Text>
                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                            onPress={() => activateRecurrence()}
                            disabled={recurrenceBusy}
                        >
                            {recurrenceBusy
                                ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} />
                                : <Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>GERAR NOVO LINK</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 15 }}>
                            Ative pra nunca mais se preocupar em pagar manualmente — seu cartão fica salvo com
                            segurança direto na Asaas (nós nunca vemos o número do seu cartão) e a cobrança
                            acontece sozinha todo ciclo.
                        </Text>

                        {recurrenceNeedsCpf ? (
                            <View>
                                <Text style={[styles.label, { color: theme.accent }]}>Confirme seu CPF</Text>
                                <View style={[styles.inputGroup, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="card-account-details-outline" size={20} color={theme.textSecondary} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        value={recurrenceCpf}
                                        onChangeText={setRecurrenceCpf}
                                        keyboardType="numeric"
                                        maxLength={14}
                                        placeholder="Somente números"
                                        placeholderTextColor={theme.textSecondary}
                                        outlineStyle="none"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                                    onPress={confirmRecurrenceCpf}
                                    disabled={recurrenceBusy}
                                >
                                    {recurrenceBusy
                                        ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} />
                                        : <Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>CONFIRMAR CPF</Text>}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                                onPress={() => activateRecurrence()}
                                disabled={recurrenceBusy}
                            >
                                {recurrenceBusy
                                    ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} />
                                    : <Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>ATIVAR RECORRÊNCIA</Text>}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
                <MaterialCommunityIcons name="whatsapp" size={28} color="#FFF" />
                <View style={{flex:1}}>
                    <Text style={styles.wppTitle}>FALAR COM O COACH</Text>
                    <Text style={styles.wppSubtitle}>Tire dúvidas ou ajuste seu treino</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.cardTitle}>MEUS DADOS</Text>
              
              <Text style={[styles.label, { color: theme.accent }]}>Nome</Text>
              <View style={[styles.inputGroup, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={theme.textSecondary} />
                <TextInput style={[styles.input, { color: theme.text }]} value={userName} onChangeText={setUserName} placeholder="Seu Nome" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
              </View>

              <Text style={[styles.label, { color: theme.accent }]}>E-mail</Text>
              <View style={[styles.inputGroup, { opacity: 0.6, backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={theme.textSecondary} />
                <TextInput style={[styles.input, { color: theme.textSecondary }]} value={email} editable={false} outlineStyle="none" />
                <MaterialCommunityIcons name="lock" size={16} color={theme.textSecondary} />
              </View>

              <Text style={[styles.label, { color: theme.accent }]}>WhatsApp</Text>
              <View style={[styles.inputGroup, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="whatsapp" size={20} color={theme.textSecondary} />
                <TextInput style={[styles.input, { color: theme.text }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Telefone" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={saveContactInfo} disabled={loading}>
                {loading ? <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} /> : <Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR ALTERAÇÕES</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={20} color="#FF4444" />
              <Text style={styles.logoutBtnText}>SAIR DA CONTA</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Versão 2.1.0 • PA TEAM App</Text>

          </ScrollView>
      </View>
    </RootComponent>
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

  card: { padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1 },
  cardTitle: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
  
  colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },

  planName: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  planDesc: { color: '#888', fontSize: 12 },

  whatsappBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#25D366', padding: 20, borderRadius: 24, gap: 15, marginBottom: 20, elevation: 5 },
  wppTitle: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  wppSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },

  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, marginLeft: 2 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 15, marginBottom: 15, height: 55, borderWidth: 1 },
  input: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500' },
  
  saveBtn: { height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontSize: 14, fontWeight: '900' },

  recurrenceCancelBtn: { height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  
  logoutBtn: { flexDirection: 'row', backgroundColor: '#FFE5E5', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FFB2B2' },
  logoutBtnText: { color: '#FF4444', fontSize: 13, fontWeight: '900', marginLeft: 10 },
  
  version: { textAlign: 'center', color: '#888', fontSize: 10 }
});