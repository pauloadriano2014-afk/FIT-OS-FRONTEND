// src/screens/RegisterScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Modal, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { saveAuthToken } from '../utils/authToken';

export default function RegisterScreen({ navigation, route }) {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  
  // 🔥 BLINDAGEM CONTRA O VAZAMENTO DE URL NA WEB E RECEPÇÃO DOS DADOS DA PROPOSTA
  let initCode = route.params?.coach || '';
  let routePlan = route.params?.plan || route.params?.coachPlan || null;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('coach')) initCode = urlParams.get('coach');
      if (urlParams.get('plan')) routePlan = urlParams.get('plan');
  }

  // 🔥 BIFURCAÇÃO AUTOMÁTICA: Pula a escolha se já veio da página de propostas como COACH
  const initialProfile = route.params?.accountType === 'COACH' ? 'COACH' : (initCode ? 'STUDENT' : null);
  const [profileType, setProfileType] = useState(initialProfile);

  // 🔥 GERENCIAMENTO DO PLANO DO COACH (Força o ELITE se não tiver escolhido)
  const [selectedCoachPlan, setSelectedCoachPlan] = useState(
      ['PERSONAL', 'ELITE', 'NUTRICIONISTA'].includes(routePlan) ? routePlan : 'ELITE'
  );

  // 🔥 Tela de "aguardando aprovação" (pós-cadastro de coach)
  const [coachPendingScreen, setCoachPendingScreen] = useState(false);

  const [form, setForm] = useState({
    accessCode: initCode, 
    name: '',
    birthDate: '',
    phone: '',
    gender: '',
    email: '',
    password: '',
    // 🔥 Campos do fluxo COACH
    cpf: '',
    instagram: '',
  });

  // 🔥 ESTADOS DOS TERMOS JURÍDICOS
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const handleDateChange = (val) => {
    let formatted = val.replace(/\D/g, ''); 
    if (formatted.length > 2) formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
    if (formatted.length > 5) formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
    setForm({...form, birthDate: formatted});
  };

  const handlePhoneChange = (val) => {
      let formatted = val.replace(/\D/g, '');
      if (formatted.length > 2) formatted = '(' + formatted.substring(0, 2) + ') ' + formatted.substring(2);
      if (formatted.length > 9) formatted = formatted.substring(0, 10) + '-' + formatted.substring(10, 14);
      setForm({...form, phone: formatted});
  };

  const handleCpfChange = (val) => {
      let f = val.replace(/\D/g, '').substring(0, 11);
      if (f.length > 9) f = `${f.substring(0,3)}.${f.substring(3,6)}.${f.substring(6,9)}-${f.substring(9)}`;
      else if (f.length > 6) f = `${f.substring(0,3)}.${f.substring(3,6)}.${f.substring(6)}`;
      else if (f.length > 3) f = `${f.substring(0,3)}.${f.substring(3)}`;
      setForm({...form, cpf: f});
  };

  const notify = (title, msg) => {
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert(title, msg);
  };

  // ═══════════════════════════════════════════════════════════
  // REGISTRO DE ALUNO (fluxo original, intacto)
  // ═══════════════════════════════════════════════════════════
  const handleRegister = async () => {
    if (!form.accessCode) {
        return notify("Acesso Negado 🔒", "O Código de Convite é obrigatório. Solicite ao seu treinador.");
    }

    if (!form.email || !form.password || !form.name) {
      return notify("Campos Obrigatórios", "Por favor, preencha pelo menos Nome, E-mail e Senha.");
    }

    // 🔥 CPF OBRIGATÓRIO (facilita a cobrança automática depois)
    const studentCpfDigits = form.cpf.replace(/\D/g, '');
    if (studentCpfDigits.length !== 11) {
        return notify("CPF Inválido", "Digite os 11 números do seu CPF. Ele é necessário para a emissão das suas cobranças.");
    }

    // 🔥 TRAVA DE SEGURANÇA
    if (!acceptedTerms) {
        return notify("Aceite Obrigatório", "Você precisa ler e aceitar os Termos de Uso e Responsabilidade Técnica para criar sua conta.");
    }

    setLoading(true);
    try {
      const studentPlan = routePlan || 'PREMIUM';

      const response = await fetch('https://fitos-final.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          accountType: 'STUDENT',
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          birthDate: form.birthDate || "",
          phone: form.phone || "",
          gender: form.gender || "Não informado",
          cpf: studentCpfDigits, // 🔥 CPF JÁ COLETADO NO CADASTRO
          inviteCode: form.accessCode.trim(),
          plan: studentPlan // 🔥 GARANTIDO QUE VAI ENVIAR O PLANO CERTO
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 BUG CRÍTICO CORRIGIDO: essa tela nunca salvava a sessão do aluno
        // recém-cadastrado (token/user/role) — igual o LoginScreen.js já faz.
        // Resultado: o aluno entrava direto na Anamnese/SetupTreino sem token
        // válido, e a chamada final de "concluir" (que agora exige login
        // verificado no servidor) caía com "Não autenticado", perdendo a
        // anamnese preenchida sem avisar direito (o alerta deixava fechar e
        // seguir usando o app, escondendo que os dados não foram salvos).
        const role = data.user?.role || 'USER';
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('role', role);
        await saveAuthToken(data.token);

        if(Platform.OS === 'web') window.alert("Bem-vindo ao Time! Vamos configurar seu perfil agora.");
        else Alert.alert("Sucesso! 🦁", "Bem-vindo ao Time! Vamos configurar seu perfil agora.");

        // 🔥 LÓGICA DE ROTEAMENTO (Agora ciente da sua tela unificada) 🔥
        const isAutoPlan = ['LOW_COST', 'FICHA_8S', 'CHALLENGE_21'].includes(studentPlan);

        // Se for plano "Self-Service", vai direto pro setup de treino e pula a Anamnese
        if (isAutoPlan) {
            navigation.navigate('SetupTreino', { userData: data.user });
        } else {
            // Força a injeção do dietModule no objeto userData se o plano for ELITE
            const isElite = ['ELITE', 'VIP'].includes(studentPlan);
            if (isElite) {
                data.user.dietModule = true; 
            }

            // Manda para a Anamnese comum, que agora sabe se deve exibir as 7 etapas
            navigation.navigate('Anamnese', { userData: data.user });
        } 
      } else {
        notify("Atenção", data.error || "Não foi possível realizar o cadastro.");
      }
    } catch (error) {
      notify("Erro de Conexão", "Verifique sua internet ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 REGISTRO DE COACH (novo fluxo com aprovação e plano)
  // ═══════════════════════════════════════════════════════════
  const handleRegisterCoach = async () => {
    if (!form.name || !form.email || !form.password) {
      return notify("Campos Obrigatórios", "Preencha pelo menos Nome, E-mail e Senha.");
    }
    const cpfDigits = form.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      return notify("CPF Inválido", "Digite os 11 números do seu CPF.");
    }
    if (!form.phone) {
      return notify("WhatsApp Obrigatório", "Precisamos do seu WhatsApp para entrar em contato na aprovação.");
    }
    if (!acceptedTerms) {
        return notify("Aceite Obrigatório", "Você precisa ler e aceitar os Termos de Uso para criar sua conta.");
    }

    setLoading(true);
    try {
      const response = await fetch('https://fitos-final.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          accountType: 'COACH',
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone,
          cpf: cpfDigits,
          instagram: form.instagram.trim(),
          plan: selectedCoachPlan // 🔥 ENVIA O PLANO ESCOLHIDO VISUALMENTE
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCoachPendingScreen(true); // 🔥 mostra a tela de "aguardando aprovação"
      } else {
        notify("Atenção", data.error || "Não foi possível realizar o cadastro.");
      }
    } catch (error) {
      notify("Erro de Conexão", "Verifique sua internet ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;
  
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg };

  // ═══════════════════════════════════════════════════════════
  // 🎉 TELA: CADASTRO DE COACH RECEBIDO (aguardando aprovação)
  // ═══════════════════════════════════════════════════════════
  if (coachPendingScreen) {
    return (
      <RootComponent style={rootStyle}>
        <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, justifyContent: 'center', padding: 30, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
            <View style={{ alignItems: 'center' }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.accent + '22', marginBottom: 25 }}>
                    <MaterialCommunityIcons name="clock-check-outline" size={44} color={theme.accent} />
                </View>
                <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', marginBottom: 12 }}>
                    CADASTRO RECEBIDO! 🎉
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 30 }}>
                    Sua solicitação de acesso como <Text style={{ color: theme.accent, fontWeight: 'bold' }}>Coach</Text> foi enviada para análise.
                    {'\n\n'}Nossa equipe vai revisar seu perfil e liberar seu acesso em até <Text style={{ color: theme.text, fontWeight: 'bold' }}>24 horas</Text>. Você será avisado pelo WhatsApp cadastrado.
                </Text>
                <TouchableOpacity 
                    style={{ width: '100%', padding: 20, borderRadius: 16, backgroundColor: theme.accent, alignItems: 'center' }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 }}>VOLTAR AO LOGIN</Text>
                </TouchableOpacity>
            </View>
        </View>
      </RootComponent>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🔀 TELA: ESCOLHA DE PERFIL (bifurcação)
  // ═══════════════════════════════════════════════════════════
  if (!profileType) {
    return (
      <RootComponent style={rootStyle}>
        <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, padding: 25, justifyContent: 'center', ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
            
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border, position: 'absolute', top: 25, left: 25 }]}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>

            <View style={{ marginBottom: 35 }}>
                <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>CRIAR <Text style={{color: theme.accent}}>CONTA</Text></Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center' }]}>Como você quer usar o app?</Text>
            </View>

            {/* SOU ALUNO */}
            <TouchableOpacity 
                style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.accent }]}
                onPress={() => setProfileType('STUDENT')}
                activeOpacity={0.8}
            >
                <View style={[styles.profileIcon, { backgroundColor: theme.accent + '22' }]}>
                    <MaterialCommunityIcons name="dumbbell" size={30} color={theme.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>SOU ALUNO(A)</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
                        Tenho um código de convite do meu treinador e quero começar meus treinos.
                    </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={26} color={theme.accent} />
            </TouchableOpacity>

            {/* SOU COACH */}
            <TouchableOpacity 
                style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 15 }]}
                onPress={() => setProfileType('COACH')}
                activeOpacity={0.8}
            >
                <View style={[styles.profileIcon, { backgroundColor: '#32ADE622' }]}>
                    <MaterialCommunityIcons name="clipboard-account-outline" size={30} color="#32ADE6" />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>SOU COACH / PERSONAL</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
                        Quero usar a plataforma para gerenciar e cobrar meus próprios alunos.
                    </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={26} color="#32ADE6" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 35}}>
              <Text style={{color: theme.textSecondary, textAlign: 'center', fontSize: 13}}>
                  Já tem conta? <Text style={{color: theme.accent, fontWeight: 'bold'}}>Faça Login</Text>
              </Text>
            </TouchableOpacity>
        </View>
      </RootComponent>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 📝 FORMULÁRIOS (aluno = original | coach = novo)
  // ═══════════════════════════════════════════════════════════
  const isCoachFlow = profileType === 'COACH';

  return (
    <RootComponent style={rootStyle}>
      <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}
      >
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.container} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            
            <TouchableOpacity onPress={() => {
                // Se veio direto da landing page, voltar manda para o login. Senão, volta para a bifurcação.
                if (route.params?.accountType === 'COACH') {
                    navigation.goBack();
                } else {
                    setProfileType(null);
                }
            }} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>

            <View style={{marginBottom: 20}}>
                {isCoachFlow ? (
                    <>
                        <Text style={[styles.title, { color: theme.text }]}>NOVO <Text style={{color: '#32ADE6'}}>COACH</Text></Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Cadastre-se para análise e liberação do acesso</Text>
                    </>
                ) : (
                    <>
                        <Text style={[styles.title, { color: theme.text }]}>NOVO <Text style={{color: theme.accent}}>MEMBRO</Text></Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Seu primeiro passo rumo ao resultado</Text>
                    </>
                )}
            </View>

            <View style={styles.inputGroup}>

              {/* 🔥 SELETOR DE PLANOS (EXCLUSIVO PARA COACHES) 🔥 */}
              {isCoachFlow && (
                  <View style={{ marginBottom: 25 }}>
                      <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 12 }]}>PLANO ESCOLHIDO *</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          {[
                              { id: 'PERSONAL', label: 'Personal', color: '#32ADE6' },
                              { id: 'ELITE', label: 'Elite', color: '#FFCC00', badge: 'MAIS COMPLETO' },
                              { id: 'NUTRICIONISTA', label: 'Nutri', color: '#8BC34A' }
                          ].map((p, index) => (
                              <TouchableOpacity 
                                  key={p.id}
                                  activeOpacity={0.8}
                                  style={[
                                      { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
                                      index === 1 ? { marginHorizontal: 8 } : {}, // margem apenas no botão central
                                      selectedCoachPlan === p.id 
                                          ? { backgroundColor: p.color + '22', borderColor: p.color }
                                          : { backgroundColor: theme.surface, borderColor: theme.border }
                                  ]}
                                  onPress={() => setSelectedCoachPlan(p.id)}
                              >
                                  {p.badge && (
                                      <View style={{ position: 'absolute', top: -10, backgroundColor: p.color, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, zIndex: 10 }}>
                                          <Text style={{ fontSize: 9, fontWeight: '900', color: '#000', letterSpacing: 0.5 }}>{p.badge}</Text>
                                      </View>
                                  )}
                                  <Text style={[
                                      { fontSize: 13, fontWeight: 'bold' },
                                      selectedCoachPlan === p.id ? { color: p.color } : { color: theme.textSecondary }
                                  ]}>
                                      {p.label}
                                  </Text>
                              </TouchableOpacity>
                          ))}
                      </View>
                  </View>
              )}
              
              {/* CÓDIGO DE CONVITE — só no fluxo de aluno */}
              {!isCoachFlow && (
                <View style={[styles.vipCard, { borderColor: theme.accent, backgroundColor: theme.accent + '11' }]}>
                    <Text style={[styles.labelHighlight, { color: theme.accent }]}>CÓDIGO DE CONVITE *</Text>
                    <View style={styles.codeContainer}>
                      <MaterialCommunityIcons name="shield-key" size={20} color={theme.accent} style={{marginRight: 10}} />
                      <TextInput 
                          style={[
                              styles.codeInput, 
                              { color: theme.text },
                              initCode ? { opacity: 0.6 } : {} // Reduz opacidade visual se estiver bloqueado
                          ]} 
                          placeholder="Código do seu treinador" 
                          placeholderTextColor={theme.textSecondary}
                          autoCapitalize="characters"
                          value={form.accessCode}
                          editable={!initCode} // 🔥 BLOQUEIO DE SEGURANÇA AQUI
                          onChangeText={(val) => setForm({...form, accessCode: val})}
                      />
                    </View>
                </View>
              )}

              <Text style={[styles.label, { color: theme.textSecondary }]}>NOME COMPLETO *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                placeholder={isCoachFlow ? "Seu nome profissional" : "Como quer ser chamado?"} 
                placeholderTextColor={theme.textSecondary}
                value={form.name}
                onChangeText={(val) => setForm({...form, name: val})}
              />

              {isCoachFlow ? (
                <>
                  {/* 🔥 FLUXO COACH: CPF + WhatsApp + Instagram */}
                  <View style={styles.row}>
                    <View style={{flex: 1, marginRight: 10}}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>CPF *</Text>
                      <TextInput 
                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                        placeholder="000.000.000-00" 
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        maxLength={14}
                        value={form.cpf}
                        onChangeText={handleCpfChange}
                      />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>WHATSAPP *</Text>
                      <TextInput 
                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                        placeholder="(00) 00000-0000" 
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="phone-pad"
                        maxLength={15}
                        value={form.phone}
                        onChangeText={handlePhoneChange}
                      />
                    </View>
                  </View>

                  <Text style={[styles.label, { color: theme.textSecondary }]}>INSTAGRAM PROFISSIONAL</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                    placeholder="@seu_perfil" 
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    value={form.instagram}
                    onChangeText={(val) => setForm({...form, instagram: val})}
                  />
                </>
              ) : (
                <>
                  {/* FLUXO ALUNO: original */}
                  <View style={styles.row}>
                    <View style={{flex: 1, marginRight: 10}}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>NASCIMENTO</Text>
                      <TextInput 
                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                        placeholder="DD/MM/AAAA" 
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        maxLength={10}
                        value={form.birthDate}
                        onChangeText={handleDateChange}
                      />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>WHATSAPP</Text>
                      <TextInput 
                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                        placeholder="(00) 00000-0000" 
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="phone-pad"
                        maxLength={15}
                        value={form.phone}
                        onChangeText={handlePhoneChange}
                      />
                    </View>
                  </View>

                  {/* 🔥 CPF DO ALUNO (usado nas cobranças automáticas) */}
                  <Text style={[styles.label, { color: theme.textSecondary }]}>CPF *</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                    placeholder="000.000.000-00" 
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={14}
                    value={form.cpf}
                    onChangeText={handleCpfChange}
                  />

                  <Text style={[styles.label, { color: theme.textSecondary }]}>GÊNERO BIOLÓGICO</Text>
                  <View style={styles.genderRow}>
                    {['Masculino', 'Feminino'].map((g) => (
                      <TouchableOpacity 
                        key={g} 
                        style={[
                            styles.genderBtn, 
                            { backgroundColor: theme.surface, borderColor: theme.border },
                            form.gender === g && { backgroundColor: theme.accent, borderColor: theme.accent }
                        ]}
                        onPress={() => setForm({...form, gender: g})}
                      >
                        <Text style={[styles.genderText, { color: theme.text }, form.gender === g && {color: theme.isDark ? '#000' : '#FFF', fontWeight: 'bold'}]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={[styles.label, { color: theme.textSecondary }]}>E-MAIL DE ACESSO *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                placeholder="exemplo@email.com" 
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(val) => setForm({...form, email: val})}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>SENHA *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                placeholder="Crie uma senha forte" 
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={form.password}
                onChangeText={(val) => setForm({...form, password: val})}
              />
            </View>

            {/* 🔥 CAIXA OBRIGATÓRIA DE TERMOS E RESPONSABILIDADE */}
            <TouchableOpacity 
                style={styles.termsContainer} 
                activeOpacity={0.8} 
                onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
                <View style={[styles.checkbox, { borderColor: acceptedTerms ? theme.accent : theme.border, backgroundColor: acceptedTerms ? theme.accent : theme.surface }]}>
                    {acceptedTerms && <MaterialCommunityIcons name="check" size={14} color={theme.isDark ? '#000' : '#FFF'} />}
                </View>
                <View style={{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                    <Text style={{color: theme.textSecondary, fontSize: 12, lineHeight: 18}}>Li e concordo com a </Text>
                    <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
                        <Text style={{color: theme.accent, fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline', lineHeight: 18}}>Responsabilidade Técnica e Termos de Uso</Text>
                    </TouchableOpacity>
                    <Text style={{color: theme.textSecondary, fontSize: 12, lineHeight: 18}}> e a </Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://fitos-final.onrender.com/privacidade')}>
                        <Text style={{color: theme.accent, fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline', lineHeight: 18}}>Política de Privacidade</Text>
                    </TouchableOpacity>
                    <Text style={{color: theme.textSecondary, fontSize: 12, lineHeight: 18}}>.</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: isCoachFlow ? '#32ADE6' : theme.accent }, (loading || !acceptedTerms) && {opacity: 0.7}]} 
              onPress={isCoachFlow ? handleRegisterCoach : handleRegister}
              disabled={loading || !acceptedTerms}
            >
              {loading 
                ? <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} /> 
                : <Text style={[styles.buttonText, { color: isCoachFlow ? '#FFF' : (theme.isDark ? '#000' : '#FFF') }]}>
                    {isCoachFlow ? 'ENVIAR PARA ANÁLISE' : 'CRIAR CONTA'}
                  </Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{marginTop: 30}}>
              <Text style={{color: theme.textSecondary, textAlign: 'center', fontSize: 13}}>
                  Já tem conta? <Text style={{color: theme.accent, fontWeight: 'bold'}}>Faça Login</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* 🔥 MODAL DE CONTRATO JURÍDICO ATUALIZADO 🔥 */}
          <Modal visible={termsModalVisible} animationType="slide" transparent onRequestClose={() => setTermsModalVisible(false)}>
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      
                      <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                          <Text style={[styles.modalTitle, { color: theme.text }]}>TERMOS E RESPONSABILIDADE</Text>
                          <TouchableOpacity onPress={() => setTermsModalVisible(false)} style={{padding: 5}}>
                              <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                          </TouchableOpacity>
                      </View>

                      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25 }}>
                          <Text style={[styles.legalText, { color: theme.text, marginBottom: 20 }]}>
                              O aplicativo ELITE FIT é uma plataforma de fornecimento de conteúdo de bem-estar, treinos e protocolos físicos online.
                          </Text>

                          <Text style={[styles.legalHeading, { color: theme.accent }]}>Responsabilidade Técnica</Text>
                          <Text style={[styles.legalText, { color: theme.textSecondary }]}>
                              O usuário declara estar ciente que o profissional <Text style={{fontWeight: 'bold', color: theme.text}}>Paulo Adriano</Text> atua como Responsável Técnico da plataforma. Todas as rotinas e periodizações de treinamento físico são elaboradas e/ou supervisionadas diretamente por ele.
                          </Text>

                          <Text style={[styles.legalHeading, { color: theme.accent }]}>Natureza das Sugestões Alimentares</Text>
                          <Text style={[styles.legalText, { color: theme.textSecondary }]}>
                              A plataforma poderá disponibilizar <Text style={{fontWeight: 'bold', color: theme.text}}>Guias de Sugestão Alimentar</Text>. O usuário declara compreender que tais guias possuem caráter estritamente <Text style={{fontWeight: 'bold', color: theme.text}}>INFORMATIVO E EDUCATIVO</Text>, servindo como referência de bons hábitos. Estas sugestões NÃO substituem uma consulta individualizada com um nutricionista. O usuário possui total autonomia para seguir ou não as sugestões apresentadas.
                          </Text>

                          <Text style={[styles.legalHeading, { color: theme.accent }]}>Condição de Saúde e Resultados</Text>
                          <Text style={[styles.legalText, { color: theme.textSecondary }]}>
                              O usuário declara estar em plenas condições de saúde para a prática de exercícios e protocolos de déficit calórico. Qualquer patologia prévia deve ser comunicada. O usuário reconhece que as estimativas de resultados (como a perda de 3 a 5kg no desafio de 21 dias) são médias baseadas em aderência total e podem variar de acordo com o metabolismo individual.
                          </Text>

                          <Text style={[styles.legalHeading, { color: theme.accent }]}>Equipe Multidisciplinar</Text>
                          <Text style={[styles.legalText, { color: theme.textSecondary }]}>
                              O acompanhamento motivacional, suporte via chat e correção de poses poderão ser realizados pela equipe multidisciplinar sob supervisão direta do Diretor Técnico.
                          </Text>

                          <TouchableOpacity 
                              style={[styles.acceptBtn, { backgroundColor: theme.accent, marginTop: 30, marginBottom: 40 }]} 
                              onPress={() => { setAcceptedTerms(true); setTermsModalVisible(false); }}
                          >
                              <Text style={[styles.acceptBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>CONCORDO E ACEITO OS TERMOS</Text>
                          </TouchableOpacity>
                      </ScrollView>
                  </View>
              </View>
          </Modal>

      </KeyboardAvoidingView>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, paddingBottom: 60, flexGrow: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 5 },
  inputGroup: { marginBottom: 10 },
  row: { flexDirection: 'row' },
  label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1, marginLeft: 5 },
  input: { 
    borderWidth: 1, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 20,
    fontSize: 15,
    outlineStyle: 'none'
  },
  vipCard: { padding: 15, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginBottom: 25 },
  labelHighlight: { fontSize: 10, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
  codeContainer: { flexDirection: 'row', alignItems: 'center' },
  codeInput: { flex: 1, fontWeight: 'bold', fontSize: 18, height: 40, outlineStyle: 'none' },
  genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, gap: 10 },
  genderBtn: { flex: 1, padding: 16, borderWidth: 1, borderRadius: 16, alignItems: 'center' },
  genderText: { fontSize: 14, fontWeight: '500' },

  // 🔥 ESTILOS DA BIFURCAÇÃO
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 2 },
  profileIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  
  // 🔥 ESTILOS DOS TERMOS
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, paddingHorizontal: 5 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', maxWidth: 480, alignSelf: 'center', height: '85%', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  legalHeading: { fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 8, letterSpacing: 0.5 },
  legalText: { fontSize: 14, lineHeight: 22, textAlign: 'justify' },
  acceptBtn: { padding: 18, borderRadius: 16, alignItems: 'center', elevation: 2 },
  acceptBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  button: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  buttonText: { fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});