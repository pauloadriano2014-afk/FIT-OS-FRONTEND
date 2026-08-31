// src/screens/ForgotPasswordScreen.js
// 🔑 ESQUECI MINHA SENHA — Passo 1 (pede o e-mail e dispara o link)
//
// 🔥 CORRIGIDO (31/ago): o botão "Esqueci minha senha" da LoginScreen ia
// direto pra RedefinirSenha (a tela que CONSOME o token do e-mail), sem
// token nenhum -- por isso sempre caía direto no estado "LINK INVÁLIDO",
// mesmo sem o usuário nunca ter recebido e-mail nenhum. Essa tela aqui é o
// passo que faltava: pede o e-mail e chama POST /api/auth/forgot-password
// (rota que já existia no backend, mas nunca era chamada por nenhuma tela).
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, SafeAreaView, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const BASE_URL = 'https://fitos-final.onrender.com';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  const handleSend = async () => {
    setErrorMsg('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Digite um e-mail válido.');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // 🔒 A rota sempre responde a mesma mensagem genérica (exista o e-mail
      // ou não) -- de propósito, pra não denunciar quem tem conta. Então a
      // gente sempre mostra a tela de "enviado", nunca um erro de "não achei
      // esse e-mail".
      setSent(true);
    } catch (e) {
      setErrorMsg('Erro de conexão. Verifique sua internet e tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => navigation.goBack();

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {sent ? (
            /* ─── E-MAIL ENVIADO ─── */
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: '#34C75922' }]}>
                <MaterialCommunityIcons name="email-check-outline" size={44} color="#34C759" />
              </View>
              <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>VERIFIQUE SEU E-MAIL ✅</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center', marginBottom: 30 }]}>
                Se {email.trim()} estiver cadastrado, você vai receber um link pra criar uma nova senha em instantes. O link vale por 1 hora.
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
                  <MaterialCommunityIcons name="lock-question" size={44} color={theme.accent} />
                </View>
                <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>ESQUECEU SUA <Text style={{ color: theme.accent }}>SENHA</Text>?</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
                  Digite seu e-mail cadastrado. A gente manda um link pra você criar uma nova senha.
                </Text>
              </View>

              <Text style={[styles.label, { color: theme.textSecondary }]}>E-MAIL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="seu@email.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(v) => { setEmail(v); setErrorMsg(''); }}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />

              {errorMsg ? (
                <Text style={{ color: '#FF3B30', fontSize: 13, textAlign: 'center', marginBottom: 15, fontWeight: 'bold' }}>
                  {errorMsg}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accent }, loading && { opacity: 0.7 }]}
                onPress={handleSend}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} />
                  : <Text style={[styles.buttonText, { color: theme.isDark ? '#000' : '#FFF' }]}>ENVIAR LINK</Text>
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
