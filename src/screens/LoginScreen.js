import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';

const RENDER_URL = 'https://fitos-final.onrender.com/api/auth/login';
const ADMIN_EMAIL = 'paulo_adriano2014@live.com';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme(); // 🔥 Conectado ao tema dinâmico
  
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

      const emailLogado = data.user.email.toLowerCase().trim();
      const isAdmin = emailLogado === ADMIN_EMAIL.toLowerCase();
      const role = isAdmin ? 'admin' : 'student';

      await AsyncStorage.multiRemove(['user', 'role']);
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(data.user)],
        ['role', role]
      ]);

      console.log('✅ Login OK:', role, emailLogado);

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

  // 🔥 Lógica da "Gaiola" do PC (PWA)
  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      {/* GAIOLA CENTRALIZADA */}
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
              source={require('../../assets/icon.png')}
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
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Senha"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />

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