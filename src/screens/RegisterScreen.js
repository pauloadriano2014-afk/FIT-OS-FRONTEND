// src/screens/RegisterScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, SafeAreaView, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { useTheme } from '../contexts/ThemeContext';

export default function RegisterScreen({ navigation, route }) {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  
  // 🔥 BLINDAGEM CONTRA O VAZAMENTO DE URL NA WEB
  let initCode = route.params?.coach || '';
  let initPlan = route.params?.plan || 'PREMIUM';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('coach')) initCode = urlParams.get('coach');
      if (urlParams.get('plan')) initPlan = urlParams.get('plan');
  }

  const [form, setForm] = useState({
    accessCode: initCode, 
    name: '',
    birthDate: '',
    phone: '',
    gender: '',
    email: '',
    password: ''
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

  const handleRegister = async () => {
    if (!form.accessCode) {
        return Alert.alert("Acesso Negado 🔒", "O Código de Convite é obrigatório. Solicite ao seu treinador.");
    }

    if (!form.email || !form.password || !form.name) {
      Alert.alert("Campos Obrigatórios", "Por favor, preencha pelo menos Nome, E-mail e Senha.");
      return;
    }

    // 🔥 TRAVA DE SEGURANÇA
    if (!acceptedTerms) {
        const msg = "Você precisa ler e aceitar os Termos de Uso e Responsabilidade Técnica para criar sua conta.";
        if (Platform.OS === 'web') return window.alert(msg);
        return Alert.alert("Aceite Obrigatório", msg);
    }

    setLoading(true);
    try {
      const response = await fetch('https://fitos-final.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          birthDate: form.birthDate || "",
          phone: form.phone || "",
          gender: form.gender || "Não informado",
          inviteCode: form.accessCode.trim(),
          plan: initPlan // 🔥 GARANTIDO QUE VAI ENVIAR O PLANO CERTO
        })
      });

      const data = await response.json();

      if (response.ok) {
        if(Platform.OS === 'web') window.alert("Bem-vindo ao Time! Vamos configurar seu perfil agora.");
        else Alert.alert("Sucesso! 🦁", "Bem-vindo ao Time! Vamos configurar seu perfil agora.");
        
        // 🔥 LÓGICA DE ROTEAMENTO (Agora ciente da sua tela unificada) 🔥
        const isAutoPlan = ['LOW_COST', 'FICHA_8S', 'CHALLENGE_21'].includes(initPlan);

        // Se for plano "Self-Service", vai direto pro setup de treino e pula a Anamnese
        if (isAutoPlan) {
            navigation.navigate('SetupTreino', { userData: data.user });
        } else {
            // 🔥 PERFORMANCE e ELITE caem na MESMA TELA.
            // O que manda se aparecem ou não as perguntas de nutrição
            // é o campo 'dietModule' ou se o initPlan for 'ELITE'
            
            // Força a injeção do dietModule no objeto userData se o plano for ELITE
            const isElite = ['ELITE', 'VIP'].includes(initPlan);
            if (isElite) {
                data.user.dietModule = true; 
            }

            // Manda para a Anamnese comum, que agora sabe se deve exibir as 7 etapas
            navigation.navigate('Anamnese', { userData: data.user });
        } 
      } else {
        const errorMsg = data.error || "Não foi possível realizar o cadastro.";
        if(Platform.OS === 'web') window.alert(errorMsg);
        else Alert.alert("Atenção", errorMsg);
      }
    } catch (error) {
      if(Platform.OS === 'web') window.alert("Erro de Conexão. Verifique sua internet.");
      else Alert.alert("Erro de Conexão", "Verifique sua internet ou tente novamente.");
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
            
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>

            <View style={{marginBottom: 30}}>
                <Text style={[styles.title, { color: theme.text }]}>NOVO <Text style={{color: theme.accent}}>MEMBRO</Text></Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Seu primeiro passo rumo ao resultado</Text>
            </View>

            <View style={styles.inputGroup}>
              
              <View style={[styles.vipCard, { borderColor: theme.accent, backgroundColor: theme.accent + '11' }]}>
                  <Text style={[styles.labelHighlight, { color: theme.accent }]}>CÓDIGO DE CONVITE *</Text>
                  <View style={styles.codeContainer}>
                    <MaterialCommunityIcons name="shield-key" size={20} color={theme.accent} style={{marginRight: 10}} />
                    <TextInput 
                        style={[styles.codeInput, { color: theme.text }]} 
                        placeholder="Ex: PATEAM ou CURVAS" 
                        placeholderTextColor={theme.textSecondary}
                        autoCapitalize="characters"
                        value={form.accessCode}
                        onChangeText={(val) => setForm({...form, accessCode: val})}
                    />
                  </View>
              </View>

              <Text style={[styles.label, { color: theme.textSecondary }]}>NOME COMPLETO *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                placeholder="Como quer ser chamado?" 
                placeholderTextColor={theme.textSecondary}
                value={form.name}
                onChangeText={(val) => setForm({...form, name: val})}
              />

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
                    <Text style={{color: theme.textSecondary, fontSize: 12, lineHeight: 18}}>.</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.accent }, (loading || !acceptedTerms) && {opacity: 0.7}]} 
              onPress={handleRegister}
              disabled={loading || !acceptedTerms}
            >
              {loading ? <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} /> : <Text style={[styles.buttonText, { color: theme.isDark ? '#000' : '#FFF' }]}>CRIAR CONTA</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 30}}>
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
                              O aplicativo PAULO ADRIANO TEAM é uma plataforma de fornecimento de conteúdo de bem-estar, treinos e protocolos físicos online.
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