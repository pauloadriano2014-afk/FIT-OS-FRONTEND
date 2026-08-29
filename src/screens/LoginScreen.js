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
  Platform,
  SafeAreaView,
  ScrollView,
  Animated,
  Alert,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { saveAuthToken, authHeaders } from '../utils/authToken';

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
  // 🔥 CORREÇÃO: Recuperamos a altura dinâmica da tela (windowHeight)
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,   { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim,  { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 6,   useNativeDriver: true }),
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
      await saveAuthToken(data.token); // 🔐 guarda o token pras rotas que agora exigem login verificado

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
            // 🔥 BUG CORRIGIDO: usava /api/admin/user/[id] (exige que o CALLER
            // seja dono do alvo — o inverso do que é preciso aqui, aluno lendo
            // o próprio coach), então desde a migração JWT voltava 403 sempre
            // e esse bloqueio de coach inadimplente ficou desativado sem
            // avisar. /api/coach-brand/[id] já permite explicitamente essa
            // direção (aluno → próprio coach).
            const coachRes = await fetch(`${BASE_URL}/api/coach-brand/${user.coachId}`, { headers: { ...(await authHeaders()) } });
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

  const BG_IMAGE = 'https://i.postimg.cc/pLbCQ1GT/AB61F751-5B87-45B5-B142-0DDC109AAAFC.png';

  const containerStyle = isWebPC
    // 🔥 CORREÇÃO: sem "width" explícito, esse container encolhia para caber
    // no conteúdo (o form de 420px), e o fundo (que é absoluteFill DELE)
    // ficava preso nessa coluna estreita — daí o efeito de "colagem" com
    // faixas pretas nas laterais em qualquer largura de janela.
    ? { width: '100%', height: windowHeight, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }
    : isWeb
      ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg, overflow: 'hidden' }
      : { flex: 1, backgroundColor: theme.bg };

  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={containerStyle}>
      
      {/* FUNDO CHUMBADO */}
      {isWebPC ? (
        // 🔥 PC: gradiente de cor gerado por código — cobre a janela inteira
        // (meia tela ou tela cheia, sem "colagem"), com a logo desenhada
        // separadamente por cima, sempre centralizada. Usamos position:
        // 'absolute' (não 'fixed') porque agora é o próprio RootComponent
        // quem define a área da tela — assim não dependemos do viewport
        // "fixed" do navegador, que pode quebrar se algum ancestral (ex.:
        // animação de transição do React Navigation na web) criar um novo
        // "containing block" pro position:fixed.
        <View style={StyleSheet.absoluteFill}>
          {/* 🔥 Correção 2: as cores agora são extraídas de verdade do
              login_bg_elitefit.png (verde #126C33 à esquerda → roxo #4C2181
              à direita), e a logo embaixo é um recorte real da própria arte
              (login_wordmark_elitefit.png, fundo transparente) — não é mais
              um texto digitado por mim. */}
          <LinearGradient
            colors={['#126C33', '#243645', '#4C2181']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.pcLogoWrap} pointerEvents="none">
            {/* 🔥 Correção 3: glow escuro atrás do badge, pra dar contraste.
                🔥 Correção 4: elitefit_splash.png tem o hexágono TODO com
                opacidade parcial (~50%, não só as bordas) — por isso o preto
                do hexágono deixava o gradiente vazar por trás. Criei
                login_badge_elitefit.png: mesma arte, mas com o interior do
                hexágono (borda preta + fundo preto) 100% opaco, e só a área
                de fora dele (fora do hexágono) transparente. */}
            <Image
              source={require('../../assets/login_glow_vignette.png')}
              style={styles.pcGlow}
              resizeMode="stretch"
            />
            <Image
              source={require('../../assets/login_badge_elitefit.png')}
              style={styles.pcLogoImg}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/login_wordmark_elitefit.png')}
              style={styles.pcWordmarkImg}
              resizeMode="contain"
            />
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.97)']}
            locations={[0.25, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : (
        // 📱 Mobile e web em janela estreita: 100% como já era, intocado.
        <View style={[StyleSheet.absoluteFill, isWeb && { position: 'fixed' }]}>
          <Image
            source={{ uri: BG_IMAGE }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.97)']}
            locations={[0.25, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* GESTÃO DO TECLADO */}
      <KeyboardAvoidingView 
        style={{ flex: 1, alignItems: isWebPC ? 'center' : 'stretch', justifyContent: 'center' }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', width: isWebPC ? 420 : '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false} 
          alwaysBounceVertical={false}
          overScrollMode="never" 
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity:   fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* 🔥 CORREÇÃO: O espaço superior agora exige no mínimo 50% da tela dinamicamente, liberando a logo! 🔥 */}
            {!isWebPC && <View style={{ flex: 1, minHeight: windowHeight * 0.50 }} />}

            {/* Botão voltar ao admin (impersonation) */}
            {hasOriginalAdmin && (
              <TouchableOpacity
                style={[styles.restoreAdminBtn, { backgroundColor: '#FF3B3040', borderColor: '#FF3B3080' }]}
                onPress={handleRestoreOriginalAdmin}
              >
                <MaterialCommunityIcons name="shield-account" size={18} color="#FF3B30" />
                <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 13 }}>
                  VOLTAR AO PAINEL ADMIN
                </Text>
              </TouchableOpacity>
            )}

            {/* Card do formulário */}
            <View style={[styles.formCard, { backgroundColor: 'rgba(10,10,10,0.92)', borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={[styles.formTitle, { color: '#fff' }]}>BEM-VINDO DE VOLTA 👋</Text>
              <Text style={[styles.formSubtitle, { color: '#888' }]}>
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
              <Text style={[styles.label, { color: '#888' }]}>E-MAIL</Text>
              <View style={[styles.inputBox, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }]}>
                <MaterialCommunityIcons name="email-outline" size={18} color="#888" />
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="seu@email.com"
                  placeholderTextColor="#555"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  onSubmitEditing={handleLogin}
                  returnKeyType="next"
                />
              </View>

              {/* Senha */}
              <Text style={[styles.label, { color: '#888' }]}>SENHA</Text>
              <View style={[styles.inputBox, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }]}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#888" />
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
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
                    color="#888"
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
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="login" size={20} color="#000" />
                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>
                      ENTRAR
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Cadastro */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={{ marginTop: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#aaa', fontSize: 14 }}>
                Não tem conta?{' '}
                <Text style={{ color: theme.accent, fontWeight: '900' }}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>

            {/* Seja Coach */}
            <TouchableOpacity
              onPress={() => navigation.navigate('CoachProposta')}
              style={{ marginTop: 10, alignItems: 'center', paddingBottom: 20 }}
            >
              <Text style={{ color: '#777', fontSize: 13 }}>
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
  // 🔥 Logo do fundo no PC — centralizada, tamanho fixo (não estica),
  // independente da largura da janela.
  pcLogoWrap:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 64 },
  pcGlow:            { position: 'absolute', top: -40, left: '50%', width: 900, height: 620, marginLeft: -450 },
  pcLogoImg:         { width: 180, height: 180 },
  pcWordmarkImg:     { width: 320, height: 320 / (1080 / 174), marginTop: 8 },
  content:          { padding: 24, paddingBottom: 20, flex: 1, justifyContent: 'flex-end' },
  restoreAdminBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  formCard:         { borderRadius: 20, borderWidth: 1, padding: 20, gap: 4 },
  formTitle:        { fontSize: 20, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  formSubtitle:     { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  errorBox:         { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  label:            { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6, marginTop: 8 },
  inputBox:         { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginBottom: 4 },
  input:            { flex: 1, padding: 14, fontSize: 16, outlineStyle: 'none' },
  loginBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18, borderRadius: 16, marginTop: 4 },
});
