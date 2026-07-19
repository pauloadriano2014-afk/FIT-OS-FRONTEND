// src/screens/LoginScreen.js — v2
// v2: bloqueia coach inadimplente redirecionando para CoachBlockedScreen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Animated,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const BASE_URL = 'https://fitos-final.onrender.com';

const MASTER_IDS = [
  '3c82f763-66b4-48da-836e-16817d4f57c0',
  'b7c0c181-41fd-4156-b8fe-963a267759a3',
];

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    if (!Device.isDevice) return null;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (e) {
    console.log('Erro push token:', e);
    return null;
  }
}

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWebPC = isWeb && windowWidth > 768;

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [hasOriginalAdmin, setHasOriginalAdmin] = useState(false);

  // Animações
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const bounceAnim = useRef(new Animated.Value(0.8)).current;
  const scaleAnim  = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,   { toValue: 1,    duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim,  { toValue: 0,    duration: 700, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1,    friction: 6,   useNativeDriver: true }),
      Animated.timing(scaleAnim,  { toValue: 1,    duration: 500, useNativeDriver: true }),
    ]).start();
    checkOriginalAdmin();
  }, []);

  const checkOriginalAdmin = async () => {
    try {
      const originalAdmin = await AsyncStorage.getItem('original_admin_user');
      setHasOriginalAdmin(!!originalAdmin);
    } catch {}
  };

  const handleRestoreOriginalAdmin = async () => {
    try {
      const originalAdminStr  = await AsyncStorage.getItem('original_admin_user');
      const originalAdminRole = await AsyncStorage.getItem('original_admin_role');
      if (!originalAdminStr) return;
      await AsyncStorage.setItem('user', originalAdminStr);
      await AsyncStorage.setItem('role', originalAdminRole || 'ADMIN');
      await AsyncStorage.removeItem('original_admin_user');
      await AsyncStorage.removeItem('original_admin_role');
      if (Platform.OS === 'web') {
        window.location.replace('/');
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
      }
    } catch (e) {
      console.log('Erro ao restaurar admin:', e);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'E-mail ou senha incorretos.');
        setLoading(false);
        return;
      }

      const user = data.user;
      const role = user.role || user.type || 'ALUNO';

      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('role', role);

      // Push token
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        fetch(`${BASE_URL}/api/user/push-token`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ userId: user.id, pushToken }),
        }).catch(() => {});
      }

      const isCoach = role.toLowerCase() === 'coach' || role.toLowerCase() === 'admin';

      // ── v2: BLOQUEIO DE COACH INADIMPLENTE ─────────────────────────────
      if (isCoach) {
        const isMaster = MASTER_IDS.includes(user.id);
        if (!isMaster) {
          const billingStatus = user.coachBillingStatus;
          if (billingStatus === 'OVERDUE' || billingStatus === 'CANCELLED') {
            setLoading(false);
            navigation.replace('CoachBlockedScreen', {
              invoiceUrl:  user.coachInvoiceUrl  ?? null,
              coachName:   user.name,
              billingPlan: user.coachBillingPlan ?? '',
              billingEnd:  user.coachBillingEnd  ?? null,
            });
            return;
          }
        }
        navigation.replace('AdminDashboard');
        return;
      }

      // ── ALUNO: verifica se coach está inadimplente ──────────────────────
      if (user.coachId) {
        const isMasterCoach = MASTER_IDS.includes(user.coachId);
        if (!isMasterCoach) {
          try {
            const coachRes = await fetch(`${BASE_URL}/api/admin/user/${user.coachId}`);
            if (coachRes.ok) {
              const coachData   = await coachRes.json();
              const coachStatus = coachData.coachBillingStatus;
              if (coachStatus === 'OVERDUE' || coachStatus === 'CANCELLED') {
                await AsyncStorage.setItem('@coach_paused', JSON.stringify({
                  coachName:  coachData.name,
                  coachPhone: coachData.phone ?? null,
                }));
              } else {
                await AsyncStorage.removeItem('@coach_paused');
              }
            }
          } catch {} // não-crítico
        }
      }

      navigation.replace('Main', { userData: user });

    } catch (e) {
      console.log('Erro login:', e);
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  // Layout
  const isWeb2 = Platform.OS === 'web';
  const containerStyle = isWebPC
    ? { height: windowHeight, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }
    : { flex: 1, backgroundColor: theme.bg };

  const innerStyle = isWebPC
    ? {
        width: 420,
        backgroundColor: theme.bg,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
      }
    : { flex: 1 };

  const RootComponent = isWeb2 ? View : SafeAreaView;

  return (
    <RootComponent style={containerStyle}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={innerStyle}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, !isWebPC && { minHeight: windowHeight }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity:   fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Banner / Logo */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: bounceAnim }] }]}>
              <Image
                source={{ uri: 'https://i.postimg.cc/DZb2WxSn/Design-sem-nome-(1).png' }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </Animated.View>

            {/* Botão voltar ao admin (impersonation) */}
            {hasOriginalAdmin && (
              <TouchableOpacity
                style={[styles.restoreAdminBtn, { backgroundColor: '#FF3B3020', borderColor: '#FF3B3060' }]}
                onPress={handleRestoreOriginalAdmin}
              >
                <MaterialCommunityIcons name="shield-account" size={18} color="#FF3B30" />
                <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 13 }}>
                  VOLTAR AO PAINEL ADMIN
                </Text>
              </TouchableOpacity>
            )}

            {/* Card do formulário */}
            <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>BEM-VINDO DE VOLTA 👋</Text>
              <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                Entre com seu e-mail e senha
              </Text>

              {/* Erro */}
              {!!error && (
                <View style={[styles.errorBox, { backgroundColor: '#FF3B3012', borderColor: '#FF3B3040' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#FF3B30" />
                  <Text style={{ color: '#FF3B30', fontSize: 13, flex: 1 }}>{error}</Text>
                </View>
              )}

              {/* E-mail */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>E-MAIL</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="email-outline" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="seu@email.com"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  onSubmitEditing={handleLogin}
                  returnKeyType="next"
                />
              </View>

              {/* Senha */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>SENHA</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Esqueci senha */}
              <TouchableOpacity
                onPress={() => navigation.navigate('RedefinirSenha')}
                style={{ alignSelf: 'flex-end', marginBottom: 20, marginTop: 4 }}
              >
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>
                  Esqueci minha senha
                </Text>
              </TouchableOpacity>

              {/* Botão entrar */}
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: theme.accent }, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="login" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                    <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>
                      ENTRAR
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Cadastro */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={{ marginTop: 20, alignItems: 'center' }}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                Não tem conta?{' '}
                <Text style={{ color: theme.accent, fontWeight: '900' }}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>

            {/* Seja Coach */}
            <TouchableOpacity
              onPress={() => navigation.navigate('CoachProposta')}
              style={{ marginTop: 12, alignItems: 'center' }}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                É personal ou nutricionista?{' '}
                <Text style={{ color: theme.accent, fontWeight: '900' }}>Seja um coach parceiro</Text>
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  scroll:           { flexGrow: 1, justifyContent: 'center' },
  content:          { padding: 24, paddingBottom: 40 },
  logoContainer:    { alignItems: 'center', marginBottom: 24 },
  bannerImage:      { width: '100%', height: 160, borderRadius: 20 },
  restoreAdminBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  formCard:         { borderRadius: 20, borderWidth: 1, padding: 20, gap: 4 },
  formTitle:        { fontSize: 20, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  formSubtitle:     { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  errorBox:         { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  label:            { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6, marginTop: 8 },
  inputBox:         { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginBottom: 4 },
  input:            { flex: 1, padding: 14, fontSize: 15, outlineStyle: 'none' },
  loginBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18, borderRadius: 16, marginTop: 4 },
});
