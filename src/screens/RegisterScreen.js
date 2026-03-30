// src/screens/RegisterScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, SafeAreaView, ActivityIndicator, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { useTheme } from '../contexts/ThemeContext';

export default function RegisterScreen({ navigation, route }) {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  
  // Pega o código direto do link de convite se ele existir
  const initialCode = route.params?.coach || '';

  const [form, setForm] = useState({
    accessCode: initialCode, 
    name: '',
    birthDate: '',
    phone: '',
    gender: '',
    email: '',
    password: ''
  });

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
          inviteCode: form.accessCode.trim() 
        })
      });

      const data = await response.json();

      if (response.ok) {
        if(Platform.OS === 'web') window.alert("Bem-vindo ao Time! Vamos configurar seu perfil agora.");
        else Alert.alert("Sucesso! 🦁", "Bem-vindo ao Time! Vamos configurar seu perfil agora.");
        
        navigation.replace('Anamnese', { userData: data.user }); 
      } else {
        if(Platform.OS === 'web') window.alert(data.error || "Não foi possível realizar o cadastro.");
        else Alert.alert("Atenção", data.error || "Não foi possível realizar o cadastro.");
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

  return (
    <RootComponent style={[styles.safe, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
      {/* 🔥 MÁGICA APLICADA: KeyboardAvoidingView protege a tela do teclado */}
      <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}
      >
          {/* 🔥 keyboardShouldPersistTaps="handled" garante que o scroll não trave com o teclado aberto */}
          <ScrollView 
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

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.accent }, loading && {opacity: 0.7}]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} /> : <Text style={[styles.buttonText, { color: theme.isDark ? '#000' : '#FFF' }]}>CRIAR CONTA</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 30}}>
              <Text style={{color: theme.textSecondary, textAlign: 'center', fontSize: 13}}>
                  Já tem conta? <Text style={{color: theme.accent, fontWeight: 'bold'}}>Faça Login</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
      </KeyboardAvoidingView>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
  button: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  buttonText: { fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});