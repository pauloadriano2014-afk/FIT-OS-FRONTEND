// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image, KeyboardAvoidingView,
  Platform, ScrollView, SafeAreaView, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const RENDER_URL = 'https://fitos-final.onrender.com/api/auth/login';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme(); 
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🔥 LÓGICA DO PWA INSTALL BANNER
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // 1. Verifica se já está instalado (rodando como standalone)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      
      if (!isStandalone) {
        // 2. Detecta se é iOS (iPhone/iPad) para mostrar as instruções manuais
        const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            setShowInstallBanner(true);
        } else {
            // 3. Ouve o evento nativo do Android/Chrome para instalação
            const handleBeforeInstallPrompt = (e) => {
                e.preventDefault(); // Previne o popup padrão automático do Chrome
                setDeferredPrompt(e);
                setShowInstallBanner(true); // Mostra o nosso banner personalizado
            };
            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }
      }
    }
  }, []);

  const handleInstallClick = async () => {
      if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
              setDeferredPrompt(null);
              setShowInstallBanner(false);
          }
      }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      if (Platform.OS === 'web') return window.alert('Preencha e-mail e senha.');
      return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    }

    setLoading(true);

    try {
      const response = await fetch(RENDER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (Platform.OS === 'web') return window.alert(data.error || 'E-mail ou senha incorretos.');
        Alert.alert('Erro', data.error || 'E-mail ou senha incorretos.');
        return;
      }

      const isAdmin = data.user.role === 'ADMIN';
      const role = isAdmin ? 'admin' : 'student';

      await AsyncStorage.multiRemove(['user', 'role']);
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(data.user)],
        ['role', role]
      ]);

      if (isAdmin) {
        navigation.replace('AdminDashboard');
        return;
      }

      const temAnamnese = data.user.anamneses && data.user.anamneses.length > 0;

      if (temAnamnese) {
        navigation.replace('Main', { userData: data.user });
      } else {
        if (data.user.plan_tier === 'vip') {
          navigation.replace('AnamneseVIP', { userData: data.user });
        } else {
          navigation.replace('Anamnese', { userData: data.user });
        }
      }
    } catch (e) {
      console.log(e);
      if (Platform.OS === 'web') window.alert('Erro de Conexão. Verifique sua internet.');
      else Alert.alert('Erro de Conexão', 'Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email || email.trim() === '') {
        const msg = "Digite seu E-MAIL no campo acima antes de pedir a troca de senha.";
        if (Platform.OS === 'web') return window.alert(msg);
        return Alert.alert('E-mail necessário', msg);
    }

    const myPhone = "5541997991346";
    const wppMessage = `Fala, Paulo! Esqueci a senha do app. Meu e-mail de acesso é o: ${email.toLowerCase().trim()}`;
    const wppLink = `https://wa.me/${myPhone}?text=${encodeURIComponent(wppMessage)}`;

    Linking.canOpenURL(wppLink)
        .then(supported => {
            if (!supported) {
                if (Platform.OS === 'web') window.alert('Não foi possível abrir o WhatsApp.');
                else Alert.alert('Erro', 'WhatsApp não encontrado no celular.');
            } else {
                return Linking.openURL(wppLink);
            }
        })
        .catch(err => console.error('An error occurred', err));
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ 
            flex: 1, 
            width: '100%', 
            maxWidth: isWeb ? 480 : '100%', 
            alignSelf: 'center', 
            backgroundColor: theme.bg, 
            ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) 
        }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.brandContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* 🔥 BANNER INTELIGENTE DE INSTALAÇÃO DO PWA */}
          {showInstallBanner && Platform.OS === 'web' && (
              <View style={[styles.installBanner, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                  {isIOS ? (
                      // Instruções atualizadas para iPhone (Safari e Chrome)
                      <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                          <View style={[styles.iconCircle, {backgroundColor: theme.bg}]}><MaterialCommunityIcons name="apple" size={24} color={theme.text} /></View>
                          <View style={{flex: 1, paddingHorizontal: 10}}>
                              <Text style={[styles.installTitle, {color: theme.text}]}>Instale o App no iPhone</Text>
                              <Text style={[styles.installDesc, {color: theme.textSecondary}]}>1. Toque em Compartilhar <MaterialCommunityIcons name="export-variant" size={14} /> (ou nos 3 pontinhos).</Text>
                              <Text style={[styles.installDesc, {color: theme.textSecondary}]}>2. Vá em "Ver mais" e escolha "Adicionar à Tela de Início".</Text>
                          </View>
                          <TouchableOpacity onPress={() => setShowInstallBanner(false)} style={{padding: 5}}><MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} /></TouchableOpacity>
                      </View>
                  ) : (
                      // Botão Automático para Android/Chrome
                      <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                          <View style={[styles.iconCircle, {backgroundColor: theme.bg}]}><MaterialCommunityIcons name="android" size={24} color={theme.accent} /></View>
                          <View style={{flex: 1, paddingHorizontal: 10}}>
                              <Text style={[styles.installTitle, {color: theme.text}]}>Instale o Aplicativo</Text>
                              <Text style={[styles.installDesc, {color: theme.textSecondary}]}>Acesse rápido direto da sua tela inicial.</Text>
                          </View>
                          <TouchableOpacity style={[styles.installBtn, {backgroundColor: theme.accent}]} onPress={handleInstallClick}>
                              <Text style={[styles.installBtnText, {color: theme.isDark ? '#000' : '#FFF'}]}>INSTALAR</Text>
                          </TouchableOpacity>
                      </View>
                  )}
              </View>
          )}

          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="E-mail"
              placeholderTextColor={theme.textSecondary}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, marginBottom: 5 }]}
              placeholder="Senha"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />
            
            <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: 'bold' }}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.accent }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.isDark ? "#000" : "#FFF" }]}>ENTRAR</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 25 }}>
              <Text style={[styles.linkText, { color: theme.textSecondary }]}>
                Ainda não tem conta?{' '}
                <Text style={{ color: theme.accent, fontWeight: '900' }}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  brandContainer: { alignItems: 'center', marginBottom: 30 },
  logoImage: { width: 220, height: 220 }, 
  formContainer: { width: '100%' },
  
  // Estilos do Banner de Instalação PWA
  installBanner: { padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 25, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  installTitle: { fontWeight: '900', fontSize: 14, marginBottom: 2 },
  installDesc: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
  installBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 },
  installBtnText: { fontWeight: '900', fontSize: 11 },

  input: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    fontSize: 16,
    outlineStyle: 'none'
  },
  
  button: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3
  },
  buttonText: {
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1
  },
  
  linkText: { textAlign: 'center', fontSize: 13 }
});