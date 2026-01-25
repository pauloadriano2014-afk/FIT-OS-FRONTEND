import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const RENDER_URL = 'https://fitos-final.onrender.com/api/auth/login';
  const ADMIN_EMAIL = 'paulo_adriano2014@live.com';

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Atenção", "Preencha e-mail e senha.");
    }

    setLoading(true);
    try {
      const response = await fetch(RENDER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email.toLowerCase().trim(),
            password: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        const emailLogado = data.user.email.toLowerCase().trim();
        const emailAdminAlvo = ADMIN_EMAIL.toLowerCase().trim();

        if (emailLogado === emailAdminAlvo) {
          navigation.replace('AdminDashboard', { userData: data.user });
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

      } else {
        Alert.alert("Erro", data.error || "E-mail ou senha incorretos.");
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Erro de Conexão", "Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* 👇 SÓ A LOGO GRANDE AGORA */}
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
            
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>ENTRAR</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{marginTop: 20}}>
                <Text style={styles.linkText}>Ainda não tem conta? <Text style={{color: '#CCFF00'}}>Cadastre-se</Text></Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  
  // ÁREA DA MARCA (LOGO AUMENTADA)
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoImage: { width: 220, height: 220 }, // Aumentado para 220

  // FORMULÁRIO
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
    marginTop: 10,
    shadowColor: "#CCFF00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  linkText: { color: '#666', textAlign: 'center', fontWeight: 'bold' },
});