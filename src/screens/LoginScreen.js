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
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RENDER_URL = 'https://fitos-final.onrender.com/api/auth/login';
const ADMIN_EMAIL = 'paulo_adriano2014@live.com';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
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
        Alert.alert('Erro', data.error || 'E-mail ou senha incorretos.');
        return;
      }

      const emailLogado = data.user.email.toLowerCase().trim();
      const isAdmin = emailLogado === ADMIN_EMAIL.toLowerCase();
      const role = isAdmin ? 'admin' : 'student';

      // 🔥 LIMPA QUALQUER SESSÃO ANTIGA
      await AsyncStorage.multiRemove(['user', 'role']);

      // 🔥 SALVA SESSÃO NOVA (EXPLÍCITA)
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(data.user)],
        ['role', role]
      ]);

      console.log('✅ Login OK:', role, emailLogado);

      // 🔥 ADMIN: FLUXO ISOLADO
      if (isAdmin) {
        navigation.replace('AdminDashboard');
        return;
      }

      // 🔥 ALUNO: FLUXO NORMAL
      const temAnamnese =
        data.user.anamneses && data.user.anamneses.length > 0;

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
      Alert.alert('Erro de Conexão', 'Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#666"
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#666"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: 20 }}
          >
            <Text style={styles.linkText}>
              Ainda não tem conta?{' '}
              <Text style={{ color: '#CCFF00' }}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoImage: { width: 220, height: 220 },
  formContainer: { width: '100%' },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222',
    fontSize: 16
  },
  button: {
    backgroundColor: '#CCFF00',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1
  },
  linkText: { color: '#666', textAlign: 'center', fontWeight: 'bold' }
});
