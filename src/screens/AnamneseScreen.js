import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
  SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIMITACOES_LIST = ['Joelho', 'Lombar', 'Ombro', 'Punho', 'Quadril', 'Tornozelo', 'Cervical', 'Cotovelos', 'Nenhuma'];
const CIRURGIAS_LIST = ['Abdominoplastia', 'Prótese de Silicone', 'Cesárea', 'LCA/Menisco', 'Hérnia', 'Coluna', 'Manguito', 'Nenhuma'];

export default function AnamneseScreen({ route, navigation }) {
  const [currentUser, setCurrentUser] = useState(route.params?.userData || null);

  const OBJETIVOS = ['Hipertrofia', 'Emagrecimento', 'Definição'];
  const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("FINALIZAR CADASTRO");
  const [step, setStep] = useState(1);
  
  const [form, setForm] = useState({
    peso: '', altura: '', objetivo: '', nivel: '',
    limitacoes: [], cirurgias: [], frequencia: '', tempoDisponivel: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      if (!currentUser) {
        try {
          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.id) setCurrentUser(parsed);
          }
        } catch (e) { console.log(e); }
      }
    };
    loadUser();
  }, []);

  const toggleSelection = (field, item) => {
    setForm(prev => {
      const list = prev[field];
      if (list.includes(item)) return { ...prev, [field]: list.filter(i => i !== item) };
      if (item === 'Nenhuma') return { ...prev, [field]: ['Nenhuma'] };
      return { ...prev, [field]: [...list.filter(i => i !== 'Nenhuma'), item] };
    });
  };

  const salvarAnamnese = async () => {
    if (!currentUser || !currentUser.id) {
        Alert.alert("Sessão Expirada", "Faça login novamente.");
        navigation.replace('Login');
        return;
    }

    setLoading(true);
    setLoadingText("Salvando ficha...");
    
    try {
      const p = parseFloat(form.peso.replace(',', '.'));
      const a = parseFloat(form.altura.replace(',', '.'));
      
      const alturaMetros = a / 100;
      const imcCalc = (alturaMetros > 0) ? (p / (alturaMetros * alturaMetros)).toFixed(2) : 0;
      const aguaCalc = (p * 35).toFixed(0);

      const payload = {
        userId: currentUser.id,
        peso: p,
        altura: a,
        imc: parseFloat(imcCalc),
        aguaIdeal: parseFloat(aguaCalc),
        objetivo: form.objetivo,
        nivel: form.nivel,
        frequencia: parseInt(form.frequencia) || 3,
        tempoDisponivel: parseInt(form.tempoDisponivel) || 60,
        limitacoes: form.limitacoes,
        cirurgias: form.cirurgias,
        equipamentos: []
      };

      console.log("Enviando Payload:", JSON.stringify(payload));
      
      const response = await fetch('https://fitos-final.onrender.com/api/anamnese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.error || "Falha ao salvar Anamnese.");
      }

      // 🛑 REMOVIDO: CHAMADA PARA GERAR TREINO AUTOMÁTICO (IA)
      // O aluno agora vai para a fila de espera do treinador.

      const updatedUser = { ...currentUser, anamneses: [data] };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      Alert.alert("Sucesso! 🚀", "Perfil configurado! Aguarde a montagem do seu treino.");
      navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { userData: updatedUser } }],
      });

    } catch (e) {
      console.error(e);
      Alert.alert("Erro", e.message);
    } finally {
      setLoading(false);
      setLoadingText("FINALIZAR CADASTRO");
    }
  };

  const nextStep = () => {
    if (step === 1 && (!form.peso || !form.altura)) return Alert.alert("Falta dados", "Preencha peso e altura.");
    if (step === 2 && (!form.objetivo || !form.nivel)) return Alert.alert("Falta dados", "Selecione objetivo e nível.");
    if (step === 3 && (form.limitacoes.length === 0 || form.cirurgias.length === 0)) return Alert.alert("Atenção", "Selecione as opções ou marque 'Nenhuma'.");
    setStep(step + 1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ANAMNESE</Text>
          <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: `${step * 25}%`}]} /></View>
          <Text style={styles.stepCounter}>Etapa {step} de 4</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {step === 1 && (
            <View>
              <Text style={styles.question}>Bioimpedância Estimada</Text>
              <View style={styles.row}>
                <View style={{flex:1, marginRight:10}}>
                  <Text style={styles.label}>PESO (KG)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 80" placeholderTextColor="#555" onChangeText={v => setForm({...form, peso: v})} value={form.peso} />
                </View>
                <View style={{flex:1}}>
                  <Text style={styles.label}>ALTURA (CM)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 175" placeholderTextColor="#555" onChangeText={v => setForm({...form, altura: v})} value={form.altura} />
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.question}>Objetivo Principal</Text>
              <View style={styles.grid}>
                {OBJETIVOS.map(obj => (
                  <TouchableOpacity key={obj} style={[styles.option, form.objetivo === obj && styles.optionActive]} onPress={() => setForm({...form, objetivo: obj})}>
                    <Text style={[styles.optionText, form.objetivo === obj && {color:'#000'}]}>{obj}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.question, {marginTop: 30}]}>Nível de Experiência</Text>
              <View style={styles.grid}>
                {NIVEIS.map(niv => (
                  <TouchableOpacity key={niv} style={[styles.option, form.nivel === niv && styles.optionActive]} onPress={() => setForm({...form, nivel: niv})}>
                    <Text style={[styles.optionText, form.nivel === niv && {color:'#000'}]}>{niv}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.question}>Mapeamento de Dores</Text>
              <View style={styles.wrapGrid}>
                {LIMITACOES_LIST.map(item => (
                  <TouchableOpacity key={item} style={[styles.chip, form.limitacoes.includes(item) && styles.chipActive]} onPress={() => toggleSelection('limitacoes', item)}>
                    <Text style={[styles.chipText, form.limitacoes.includes(item) && {color:'#000'}]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.question, {marginTop: 30}]}>Cirurgias Prévias</Text>
              <View style={styles.wrapGrid}>
                {CIRURGIAS_LIST.map(item => (
                  <TouchableOpacity key={item} style={[styles.chip, form.cirurgias.includes(item) && styles.chipActive]} onPress={() => toggleSelection('cirurgias', item)}>
                    <Text style={[styles.chipText, form.cirurgias.includes(item) && {color:'#000'}]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.question}>Frequência Semanal</Text>
              <View style={styles.row}>
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <TouchableOpacity key={d} style={[styles.circle, form.frequencia === d.toString() && styles.circleActive]} onPress={() => setForm({...form, frequencia: d.toString()})}>
                    <Text style={[styles.circleText, form.frequencia === d.toString() && {color:'#000'}]}>{d}x</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.question, {marginTop: 30}]}>Tempo Disponível (min)</Text>
              <View style={styles.grid}>
                 {[30, 45, 60, 90, 120].map(t => (
                    <TouchableOpacity key={t} style={[styles.option, form.tempoDisponivel === t.toString() && styles.optionActive]} onPress={() => setForm({...form, tempoDisponivel: t.toString()})}>
                        <Text style={[styles.optionText, form.tempoDisponivel === t.toString() && {color:'#000'}]}>{t} min</Text>
                    </TouchableOpacity>
                 ))}
              </View>
              <TouchableOpacity style={styles.finishBtn} onPress={salvarAnamnese} disabled={loading}>
                 {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.finishText}>FINALIZAR CADASTRO</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {step < 4 && (
          <View style={styles.footer}>
             {step > 1 ? <TouchableOpacity onPress={() => setStep(step-1)} style={styles.backBtn}><Text style={{color:'#FFF', fontWeight:'bold'}}>VOLTAR</Text></TouchableOpacity> : <View style={{flex:1}} />}
             <TouchableOpacity onPress={nextStep} style={styles.nextBtn}><Text style={{color:'#000', fontWeight:'bold'}}>PRÓXIMO</Text></TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#000' },
  headerTitle: { color: '#CCFF00', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  stepCounter: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 5, alignSelf: 'flex-end' },
  progressBarBg: { height: 4, backgroundColor: '#222', marginTop: 15, borderRadius: 2 },
  progressBarFill: { height: 4, backgroundColor: '#CCFF00', borderRadius: 2 },
  container: { padding: 20, paddingBottom: 100 },
  question: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  label: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  input: { backgroundColor: '#111', color: '#FFF', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', backgroundColor: '#111', minWidth: '45%', flex: 1, alignItems: 'center' },
  optionActive: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  optionText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  wrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#333', backgroundColor: '#111' },
  chipActive: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  chipText: { color: '#AAA', fontWeight: 'bold', fontSize: 12 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
  circleActive: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  circleText: { color: '#FFF', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', padding: 20, backgroundColor: '#000', borderTopWidth: 1, borderColor: '#222' },
  backBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#333', marginRight: 10 },
  nextBtn: { flex: 2, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#CCFF00' },
  finishBtn: { marginTop: 40, backgroundColor: '#CCFF00', padding: 20, borderRadius: 15, alignItems: 'center' },
  finishText: { color: '#000', fontWeight: '900', fontSize: 16 }
});