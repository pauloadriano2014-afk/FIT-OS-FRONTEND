// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image, KeyboardAvoidingView,
  Platform, ScrollView, SafeAreaView, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const RENDER_URL = 'https://fitos-final.onrender.com/api/auth/login';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme(); 
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

      // 🔥 A CIRURGIA: Lê a patente direto do banco de dados em vez de checar o e-mail
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
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoImage: { width: 220, height: 220 }, 
  formContainer: { width: '100%' },
  
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