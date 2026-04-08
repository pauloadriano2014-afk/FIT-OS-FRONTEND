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

let globalPrompt = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalPrompt = e;
    window.dispatchEvent(new Event('show_pwa_button'));
  });
}

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme(); 
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [deferredPrompt, setDeferredPrompt] = useState(globalPrompt);
  const [isIOS, setIsIOS] = useState(false);
  const [isChromeIOS, setIsChromeIOS] = useState(false); 
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const checkInstallBanner = async () => {
      if (Platform.OS === 'web') {
        try {
          // 🔥 Usamos o AsyncStorage em vez do localStorage para maior estabilidade
          const dismissed = await AsyncStorage.getItem('@pwa_dismissed');
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
          
          // Se já está a correr como app instalada (Standalone), gravamos logo na memória
          if (isStandalone) {
              await AsyncStorage.setItem('@pwa_dismissed', 'true');
              return;
          }

          // Se o Coach já clicou alguma vez em "Já instalei", abortamos e não mostramos nada
          if (dismissed === 'true') {
              return;
          }

          const ua = window.navigator.userAgent.toLowerCase();
          const isIosDevice = /iphone|ipad|ipod/.test(ua);
          const isAndroidDevice = /android/.test(ua);
          const isChromeOnIos = ua.includes('crios'); 
          
          setIsIOS(isIosDevice);
          setIsChromeIOS(isChromeOnIos);

          if (isIosDevice || isAndroidDevice) {
              setShowInstallBanner(true);
          }

          if (isAndroidDevice) {
              const promptListener = () => {
                  setDeferredPrompt(globalPrompt);
              };
              window.addEventListener('show_pwa_button', promptListener);
              
              if (globalPrompt) setDeferredPrompt(globalPrompt);

              return () => window.removeEventListener('show_pwa_button', promptListener);
          }
        } catch(e) {}
      }
    };
    
    checkInstallBanner();
  }, []);

  const hideInstallForever = async () => {
      try {
          await AsyncStorage.setItem('@pwa_dismissed', 'true');
          setShowInstallBanner(false);
      } catch(e) {}
  };

  const handleInstallClick = async () => {
      if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
              setDeferredPrompt(null);
              globalPrompt = null;
              hideInstallForever();
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
      } else {
        navigation.replace('Main', { userData: data.user });
      }

    } catch (e) {
      console.log(e);
      if (Platform.OS === 'web') window.alert('Erro de Conexão. Verifique a sua internet.');
      else Alert.alert('Erro de Conexão', 'Verifique a sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email || email.trim() === '') {
        const msg = "Digite o seu E-MAIL no campo acima antes de pedir a troca de senha.";
        if (Platform.OS === 'web') return window.alert(msg);
        return Alert.alert('E-mail necessário', msg);
    }

    const myPhone = "5541997991346";
    const wppMessage = `Fala, Paulo! Esqueci-me da senha da app. O meu e-mail de acesso é: ${email.toLowerCase().trim()}`;
    const wppLink = `https://wa.me/${myPhone}?text=${encodeURIComponent(wppMessage)}`;

    Linking.canOpenURL(wppLink)
        .then(supported => {
            if (!supported) {
                if (Platform.OS === 'web') window.alert('Não foi possível abrir o WhatsApp.');
                else Alert.alert('Erro', 'WhatsApp não encontrado no telemóvel.');
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

          {/* 🔥 VISUAL URGENTE DE INSTALAÇÃO */}
          {showInstallBanner && Platform.OS === 'web' && (
              <View style={styles.installWrapper}>
                  {isIOS || (!isIOS && !deferredPrompt) ? (
                      <View style={[styles.urgentBox, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                              <MaterialCommunityIcons name="alert-circle" size={18} color={theme.accent} />
                              <Text style={[styles.urgentTitle, {color: theme.accent}]}>
                                  PASSO IMPORTANTE: INSTALE A APP
                              </Text>
                          </View>
                          
                          {isIOS ? (
                              isChromeIOS ? (
                                  <Text style={[styles.urgentText, {color: theme.text}]}>
                                      No Chrome, toque em Compartilhar <MaterialCommunityIcons name="export-variant" size={16} color={theme.textSecondary} /> no topo, vá a "Ver mais" <MaterialCommunityIcons name="dots-horizontal" size={16} color={theme.textSecondary} /> e "Adicionar ao Ecrã Principal" <MaterialCommunityIcons name="plus-box-outline" size={16} color={theme.textSecondary} />.
                                  </Text>
                              ) : (
                                  <Text style={[styles.urgentText, {color: theme.text}]}>
                                      No Safari, toque nos 3 pontinhos <MaterialCommunityIcons name="dots-horizontal" size={16} color={theme.textSecondary} /> na parte inferior, Compartilhar <MaterialCommunityIcons name="export-variant" size={16} color={theme.textSecondary} />, "Ver mais" e "Adicionar ao Ecrã Principal" <MaterialCommunityIcons name="plus-box-outline" size={16} color={theme.textSecondary} />.
                                  </Text>
                              )
                          ) : (
                              <Text style={[styles.urgentText, {color: theme.text}]}>
                                  Clique nos 3 pontinhos <MaterialCommunityIcons name="dots-vertical" size={16} color={theme.textSecondary} /> do navegador e selecione "Instalar Aplicação" <MaterialCommunityIcons name="cellphone-arrow-down" size={16} color={theme.textSecondary} />.
                              </Text>
                          )}

                          {/* 🔥 BOTAO DE JÁ INSTALEI / FECHAR */}
                          <TouchableOpacity onPress={hideInstallForever} style={styles.closeUrgentBtn}>
                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                                <Text style={{fontSize: 10, fontWeight: 'bold', color: theme.textSecondary}}>JÁ INSTALEI</Text>
                                <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                              </View>
                          </TouchableOpacity>
                      </View>
                  ) : (
                      <View style={{gap: 10}}>
                        <TouchableOpacity style={[styles.premiumInstallBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} onPress={handleInstallClick}>
                            <MaterialCommunityIcons name="cellphone-arrow-down" size={24} color={theme.accent} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={[styles.premiumInstallText, { color: theme.text }]}>BAIXAR APP OFICIAL</Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: '500' }}>Instalação rápida e segura</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={hideInstallForever} style={{alignSelf: 'center'}}>
                            <Text style={{fontSize: 11, fontWeight: 'bold', color: theme.textSecondary, textDecorationLine: 'underline'}}>JÁ TENHO A APP INSTALADA</Text>
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
                <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: 'bold' }}>Esqueci-me da senha</Text>
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
                <Text style={{ color: theme.accent, fontWeight: '900' }}>Registe-se</Text>
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
  
  installWrapper: { marginBottom: 25, width: '100%' },
  
  premiumInstallBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  premiumInstallText: { fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  
  urgentBox: { padding: 16, borderRadius: 12, borderWidth: 2, position: 'relative' },
  urgentTitle: { fontSize: 11, fontWeight: '900', marginLeft: 6, letterSpacing: 1 },
  urgentText: { fontSize: 14, lineHeight: 22, fontWeight: '600' }, 
  closeUrgentBtn: { position: 'absolute', top: 12, right: 12, padding: 4 },

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