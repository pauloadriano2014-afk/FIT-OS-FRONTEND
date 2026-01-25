import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, SafeAreaView, ActivityIndicator, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Adicionei para o ícone de cadeado

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  
  // Adicionei o accessCode no seu estado
  const [form, setForm] = useState({
    accessCode: '', 
    name: '',
    birthDate: '',
    phone: '',
    gender: '',
    email: '',
    password: ''
  });

  // 🔒 SENHA DO TIME (Pode mudar aqui se quiser)
  const TEAM_ACCESS_CODE = 'PATEAM';

  const handleRegister = async () => {
    // 1. VERIFICAÇÃO DO CÓDIGO DO TIME (PRIMEIRA COISA)
    if (!form.accessCode || form.accessCode.trim().toUpperCase() !== TEAM_ACCESS_CODE) {
        return Alert.alert("Acesso Negado 🔒", "O Código de Convite está incorreto. Solicite ao seu treinador.");
    }

    // Validação de segurança no Front-end
    if (!form.email || !form.password || !form.name) {
      Alert.alert("Campos Obrigatórios", "Por favor, preencha pelo menos Nome, E-mail e Senha.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://fitos-final.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          birthDate: form.birthDate || "",
          phone: form.phone || "",
          gender: form.gender || "Não informado",
          plan_tier: 'standard' // Adicionei para garantir que o backend receba
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso! 🦁", "Bem-vindo ao Time! Vamos configurar seu perfil agora.");
        
        // Passamos o data.user que contém o ID necessário para salvar a anamnese depois
        navigation.replace('Anamnese', { userData: data.user }); 
        
      } else {
        Alert.alert("Atenção", data.error || "Não foi possível realizar o cadastro.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro de Conexão", "Verifique sua internet ou tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Botão Voltar */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginBottom: 10}}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.title}>NOVO <Text style={{color: '#CCFF00'}}>MEMBRO</Text></Text>
        <Text style={styles.subtitle}>Preencha seus dados para entrar no time</Text>

        <View style={styles.inputGroup}>
          
          {/* 👇 CAMPO DO CÓDIGO (NOVO) 👇 */}
          <Text style={styles.labelHighlight}>CÓDIGO DE CONVITE *</Text>
          <View style={styles.codeContainer}>
             <MaterialCommunityIcons name="lock-outline" size={20} color="#000" style={{marginRight: 10}} />
             <TextInput 
                style={styles.codeInput} 
                placeholder="DIGITE O CÓDIGO (Ex: 123456)" 
                placeholderTextColor="#444"
                autoCapitalize="characters"
                value={form.accessCode}
                onChangeText={(val) => setForm({...form, accessCode: val})}
              />
          </View>
          {/* ------------------------------- */}

          <Text style={styles.label}>NOME COMPLETO *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Como quer ser chamado?" 
            placeholderTextColor="#444"
            value={form.name}
            onChangeText={(val) => setForm({...form, name: val})}
          />

          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={styles.label}>NASCIMENTO</Text>
              <TextInput 
                style={styles.input} 
                placeholder="DD/MM/AAAA" 
                placeholderTextColor="#444"
                value={form.birthDate}
                onChangeText={(val) => setForm({...form, birthDate: val})}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>WHATSAPP</Text>
              <TextInput 
                style={styles.input} 
                placeholder="(00) 00000-0000" 
                placeholderTextColor="#444"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(val) => setForm({...form, phone: val})}
              />
            </View>
          </View>

          <Text style={styles.label}>GÊNERO</Text>
          <View style={styles.genderRow}>
            {['Masculino', 'Feminino', 'Outro'].map((g) => (
              <TouchableOpacity 
                key={g} 
                style={[styles.genderBtn, form.gender === g && styles.activeGender]}
                onPress={() => setForm({...form, gender: g})}
              >
                <Text style={[styles.genderText, form.gender === g && {color: '#000'}]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>E-MAIL DE ACESSO *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="exemplo@email.com" 
            placeholderTextColor="#444"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(val) => setForm({...form, email: val})}
          />

          <Text style={styles.label}>SENHA *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Crie uma senha forte" 
            placeholderTextColor="#444"
            secureTextEntry
            value={form.password}
            onChangeText={(val) => setForm({...form, password: val})}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && {opacity: 0.7}]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>FINALIZAR CADASTRO</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 25}}>
          <Text style={{color: '#666', textAlign: 'center'}}>Já é da equipe? <Text style={{color: '#CCFF00', fontWeight: 'bold'}}>Faça Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { padding: 25, paddingBottom: 60 },
  
  title: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  subtitle: { color: '#666', textAlign: 'center', marginBottom: 35, fontSize: 14, fontWeight: '500' },
  
  inputGroup: { marginBottom: 10 },
  row: { flexDirection: 'row' },
  
  label: { color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1.5, marginLeft: 5 },
  labelHighlight: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1.5, marginLeft: 5 },
  
  input: { 
    backgroundColor: '#0A0A0A', 
    borderWidth: 1, 
    borderColor: '#1A1A1A', 
    borderRadius: 15, 
    padding: 16, 
    color: '#fff', 
    marginBottom: 18,
    fontSize: 15
  },

  // ESTILO DO CAMPO DE CÓDIGO
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFF00', // Fundo amarelo para destacar
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
    height: 55
  },
  codeInput: {
    flex: 1,
    color: '#000', // Texto preto no fundo amarelo
    fontWeight: 'bold',
    fontSize: 16,
    height: '100%'
  },

  genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  genderBtn: { 
    flex: 1, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: '#1A1A1A', 
    borderRadius: 15, 
    alignItems: 'center', 
    marginHorizontal: 4 
  },
  activeGender: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  genderText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  
  button: { 
    backgroundColor: '#CCFF00', 
    padding: 20, 
    borderRadius: 18, 
    alignItems: 'center', 
    marginTop: 15,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});