// src/screens/ResetPasswordScreen.js
// 🔑 TELA DE REDEFINIÇÃO DE SENHA
// Aberta pelo link do e-mail: https://www.pauloadrianoteam.com.br/redefinir-senha?token=...
// (🔥 TEMPORÁRIO: elitefitapp.com.br ainda não tem DNS configurado)

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, SafeAreaView, KeyboardAvoidingView, ScrollView, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function ResetPasswordScreen({ navigation, route }) {
  const { theme } = useTheme();

  // 🔥 BLINDAGEM: pega o token dos params OU direto da URL (padrão dos seus links)
  let initToken = route.params?.token || '';
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) initToken = urlParams.get('token');
  }

  const [token] = useState(initToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const notify = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('', msg);
  };

  const handleReset = async () => {
    setErrorMsg('');

    if (!password || password.length < 6) {
      return setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
    }
    if (password !== confirm) {
      return setErrorMsg('As senhas não coincidem. Digite igual nos dois campos.');
    }

    setLoading(true);
    try {
      const res = await fetch('https://fitos-final.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Não foi possível redefinir. Tente novamente.');
        return;
      }

      setDone(true);
    } catch (e) {
      setErrorMsg('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Limpa o token da URL e volta pra raiz (login)
      window.location.replace('/');
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  // ─── Link inválido (sem token na URL) ───
  const invalidLink = !token;

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {done ? (
            /* ─── SUCESSO ─── */
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: '#34C75922' }]}>
                <MaterialCommunityIcons name="check-circle" size={44} color="#34C759" />
              </View>
              <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>SENHA REDEFINIDA! ✅</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center', marginBottom: 30 }]}>
                Sua nova senha já está valendo. Faça login para continuar seus treinos.
              </Text>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent, width: '100%' }]} onPress={goToLogin}>
                <Text style={[styles.buttonText, { color: theme.isDark ? '#000' : '#FFF' }]}>IR PARA O LOGIN</Text>
              </TouchableOpacity>
            </View>
          ) : invalidLink ? (
            /* ─── LINK INVÁLIDO ─── */
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: '#FF950022' }]}>
                <MaterialCommunityIcons name="link-off" size={44} color="#FF9500" />
              </View>
              <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>LINK INVÁLIDO</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center', marginBottom: 30 }]}>
                Este link de redefinição está incompleto ou expirou. Volte ao login e toque em "Esqueci minha senha" para receber um novo.
              </Text>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent, width: '100%' }]} onPress={goToLogin}>
                <Text style={[styles.buttonText, { color: theme.isDark ? '#000' : '#FFF' }]}>VOLTAR AO LOGIN</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ─── FORMULÁRIO ─── */
            <>
              <View style={{ alignItems: 'center', marginBottom: 30 }}>
                <View style={[styles.iconBox, { backgroundColor: theme.accent + '22' }]}>
                  <MaterialCommunityIcons name="lock-reset" size={44} color={theme.accent} />
                </View>
                <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>NOVA <Text style={{ color: theme.accent }}>SENHA</Text></Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
                  Crie sua nova senha de acesso abaixo
                </Text>
              </View>

              <Text style={[styles.label, { color: theme.textSecondary }]}>NOVA SENHA *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Mínimo de 6 caracteres"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>CONFIRME A NOVA SENHA *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Digite a senha novamente"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />

              {errorMsg ? (
                <Text style={{ color: '#FF3B30', fontSize: 13, textAlign: 'center', marginBottom: 15, fontWeight: 'bold' }}>
                  {errorMsg}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accent }, loading && { opacity: 0.7 }]}
                onPress={handleReset}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} />
                  : <Text style={[styles.buttonText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR NOVA SENHA</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={goToLogin} style={{ marginTop: 25 }}>
                <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 13 }}>
                  Lembrou a senha? <Text style={{ color: theme.accent, fontWeight: 'bold' }}>Voltar ao Login</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  iconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '500', lineHeight: 21 },
  label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1, marginLeft: 5 },
  input: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20, fontSize: 15, outlineStyle: 'none' },
  button: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 5 },
  buttonText: { fontWeight: '900', fontSize: 15, letterSpacing: 1 },
});