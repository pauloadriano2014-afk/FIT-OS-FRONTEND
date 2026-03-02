import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
  SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';

const LIMITACOES_LIST = ['Joelho', 'Lombar', 'Ombro', 'Punho', 'Quadril', 'Tornozelo', 'Cervical', 'Cotovelos', 'Nenhuma'];
const CIRURGIAS_LIST = ['Abdominoplastia', 'Prótese de Silicone', 'Cesárea', 'LCA/Menisco', 'Hérnia', 'Coluna', 'Manguito', 'Nenhuma'];

export default function AnamneseScreen({ route, navigation }) {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState(route.params?.userData || null);

  const OBJETIVOS = ['Hipertrofia', 'Emagrecimento', 'Definição'];
  const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];

  const [loading, setLoading] = useState(false);
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
  }, [currentUser]);

  const toggleSelection = (field, item) => {
    setForm(prev => {
      const list = prev[field];
      if (list.includes(item)) return { ...prev, [field]: list.filter(i => i !== item) };
      if (item === 'Nenhuma') return { ...prev, [field]: ['Nenhuma'] };
      return { ...prev, [field]: [...list.filter(i => i !== 'Nenhuma'), item] };
    });
  };

  const salvarAnamnese = async () => {
    if (!form.frequencia || !form.tempoDisponivel) {
        return Alert.alert("Falta dados", "Selecione a frequência e o tempo disponível.");
    }

    if (!currentUser || !currentUser.id) {
        Alert.alert("Sessão Expirada", "Faça login novamente.");
        navigation.replace('Login');
        return;
    }

    setLoading(true);
    
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

      const response = await fetch('https://fitos-final.onrender.com/api/anamnese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.error || "Falha ao salvar Anamnese.");
      }

      const updatedUser = { ...currentUser, anamneses: [data] };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      if(Platform.OS === 'web') window.alert("Perfil configurado! Aguarde a montagem do seu treino.");
      else Alert.alert("Sucesso! 🚀", "Perfil configurado! Aguarde a montagem do seu treino.");
      
      navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { userData: updatedUser } }],
      });

    } catch (e) {
      if(Platform.OS === 'web') window.alert(e.message);
      else Alert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!form.peso || !form.altura)) return Alert.alert("Falta dados", "Preencha peso e altura.");
    if (step === 2 && (!form.objetivo || !form.nivel)) return Alert.alert("Falta dados", "Selecione objetivo e nível.");
    if (step === 3 && (form.limitacoes.length === 0 || form.cirurgias.length === 0)) return Alert.alert("Atenção", "Selecione as opções ou marque 'Nenhuma'.");
    setStep(step + 1);
  };

  // 🔥 Lógica da "Gaiola" do PC (PWA)
  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={[styles.safe, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
            
            {/* HEADER COM BARRA DE PROGRESSO */}
            <View style={[styles.header, { backgroundColor: theme.bg }]}>
              <Text style={[styles.headerTitle, { color: theme.accent }]}>ANAMNESE</Text>
              <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: theme.accent, width: `${step * 25}%`}]} />
              </View>
              <Text style={[styles.stepCounter, { color: theme.textSecondary }]}>Etapa {step} de 4</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
              
              {/* ETAPA 1 */}
              {step === 1 && (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>Bioimpedância Estimada</Text>
                  <View style={styles.row}>
                    <View style={{flex:1, marginRight:10}}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>PESO (KG)</Text>
                      <TextInput 
                          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                          keyboardType="numeric" placeholder="Ex: 80" placeholderTextColor={theme.textSecondary} 
                          onChangeText={v => setForm({...form, peso: v})} value={form.peso} 
                      />
                    </View>
                    <View style={{flex:1}}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>ALTURA (CM)</Text>
                      <TextInput 
                          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                          keyboardType="numeric" placeholder="Ex: 175" placeholderTextColor={theme.textSecondary} 
                          onChangeText={v => setForm({...form, altura: v})} value={form.altura} 
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* ETAPA 2 */}
              {step === 2 && (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>Objetivo Principal</Text>
                  <View style={styles.grid}>
                    {OBJETIVOS.map(obj => (
                      <TouchableOpacity 
                          key={obj} 
                          style={[styles.option, { backgroundColor: theme.surface, borderColor: theme.border }, form.objetivo === obj && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                          onPress={() => setForm({...form, objetivo: obj})}
                      >
                        <Text style={[styles.optionText, { color: theme.text }, form.objetivo === obj && {color: theme.isDark ? '#000' : '#FFF'}]}>{obj}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.question, { marginTop: 30, color: theme.text }]}>Nível de Experiência</Text>
                  <View style={styles.grid}>
                    {NIVEIS.map(niv => (
                      <TouchableOpacity 
                          key={niv} 
                          style={[styles.option, { backgroundColor: theme.surface, borderColor: theme.border }, form.nivel === niv && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                          onPress={() => setForm({...form, nivel: niv})}
                      >
                        <Text style={[styles.optionText, { color: theme.text }, form.nivel === niv && {color: theme.isDark ? '#000' : '#FFF'}]}>{niv}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* ETAPA 3 */}
              {step === 3 && (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>Mapeamento de Dores</Text>
                  <View style={styles.wrapGrid}>
                    {LIMITACOES_LIST.map(item => (
                      <TouchableOpacity 
                          key={item} 
                          style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, form.limitacoes.includes(item) && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                          onPress={() => toggleSelection('limitacoes', item)}
                      >
                        <Text style={[styles.chipText, { color: theme.textSecondary }, form.limitacoes.includes(item) && {color: theme.isDark ? '#000' : '#FFF'}]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.question, { marginTop: 30, color: theme.text }]}>Cirurgias Prévias</Text>
                  <View style={styles.wrapGrid}>
                    {CIRURGIAS_LIST.map(item => (
                      <TouchableOpacity 
                          key={item} 
                          style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, form.cirurgias.includes(item) && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                          onPress={() => toggleSelection('cirurgias', item)}
                      >
                        <Text style={[styles.chipText, { color: theme.textSecondary }, form.cirurgias.includes(item) && {color: theme.isDark ? '#000' : '#FFF'}]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* ETAPA 4 */}
              {step === 4 && (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>Frequência Semanal</Text>
                  <View style={styles.wrapGrid}>
                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                      <TouchableOpacity 
                          key={d} 
                          style={[styles.circle, { backgroundColor: theme.surface, borderColor: theme.border }, form.frequencia === d.toString() && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                          onPress={() => setForm({...form, frequencia: d.toString()})}
                      >
                        <Text style={[styles.circleText, { color: theme.text }, form.frequencia === d.toString() && {color: theme.isDark ? '#000' : '#FFF'}]}>{d}x</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.question, { marginTop: 30, color: theme.text }]}>Tempo Disponível (min)</Text>
                  <View style={styles.grid}>
                     {[30, 45, 60, 90, 120].map(t => (
                        <TouchableOpacity 
                            key={t} 
                            style={[styles.option, { backgroundColor: theme.surface, borderColor: theme.border }, form.tempoDisponivel === t.toString() && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                            onPress={() => setForm({...form, tempoDisponivel: t.toString()})}
                        >
                            <Text style={[styles.optionText, { color: theme.text }, form.tempoDisponivel === t.toString() && {color: theme.isDark ? '#000' : '#FFF'}]}>{t} min</Text>
                        </TouchableOpacity>
                     ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* 🔥 RODAPÉ FIXO (COM VOLTAR MESMO NA ÚLTIMA ETAPA) */}
            <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
               {step > 1 ? (
                 <TouchableOpacity onPress={() => setStep(step-1)} style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <Text style={{color: theme.text, fontWeight:'bold'}}>VOLTAR</Text>
                 </TouchableOpacity>
               ) : <View style={{flex:1}} />}
               
               {step < 4 ? (
                 <TouchableOpacity onPress={nextStep} style={[styles.nextBtn, { backgroundColor: theme.accent }]}>
                    <Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight:'bold'}}>PRÓXIMO</Text>
                 </TouchableOpacity>
               ) : (
                 <TouchableOpacity onPress={salvarAnamnese} disabled={loading} style={[styles.nextBtn, { backgroundColor: theme.accent }]}>
                    {loading ? <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} /> : <Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight:'900'}}>FINALIZAR</Text>}
                 </TouchableOpacity>
               )}
            </View>
            
          </KeyboardAvoidingView>
      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingTop: Platform.OS === 'android' ? 20 : 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  stepCounter: { fontSize: 11, fontWeight: 'bold', marginTop: 8, alignSelf: 'flex-end' },
  progressBarBg: { height: 6, marginTop: 15, borderRadius: 3 },
  progressBarFill: { height: 6, borderRadius: 3 },
  
  container: { padding: 20, paddingBottom: 120 },
  question: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.5 },
  
  input: { padding: 18, borderRadius: 16, borderWidth: 1, fontSize: 16, outlineStyle: 'none' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  option: { padding: 16, borderRadius: 16, borderWidth: 1, minWidth: '45%', flex: 1, alignItems: 'center' },
  optionText: { fontWeight: 'bold', fontSize: 13 },
  
  wrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1 },
  chipText: { fontWeight: 'bold', fontSize: 13 },
  
  circle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  circleText: { fontWeight: 'bold', fontSize: 16 },
  
  footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', padding: 20, borderTopWidth: 1, gap: 15 },
  backBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 16, borderWidth: 1 },
  nextBtn: { flex: 2, padding: 16, alignItems: 'center', borderRadius: 16, elevation: 2 },
});