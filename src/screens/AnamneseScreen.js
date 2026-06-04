// src/screens/AnamneseScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
  SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, Modal 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';

const LIMITACOES_LIST = ['Joelho', 'Lombar', 'Ombro', 'Punho', 'Quadril', 'Tornozelo', 'Cervical', 'Cotovelos', 'Nenhuma'];
const CIRURGIAS_LIST = ['Abdominoplastia', 'Prótese de Silicone', 'Cesárea', 'LCA/Menisco', 'Hérnia', 'Coluna', 'Manguito', 'Nenhuma'];
const SUPLEMENTOS_LIST = ['Whey Protein', 'Creatina', 'Pré-Treino', 'BCAA', 'Multivitamínico', 'Ômega 3', 'Hipercalórico', 'Nenhum'];

export default function AnamneseScreen({ route, navigation }) {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState(route.params?.userData || null);

  const OBJETIVOS = ['Hipertrofia', 'Emagrecimento', 'Definição'];
  const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // 🔥 TRILHO INTELIGENTE: 7 etapas se tiver módulo de dieta, 4 se for só treino
  const totalSteps = currentUser?.dietModule ? 7 : 4;
  
  const [form, setForm] = useState({
    peso: '', altura: '', objetivo: '', nivel: '',
    limitacoes: [], cirurgias: [], equipamentos: '', frequencia: '', tempoDisponivel: '',
    // 🔥 NOVOS CAMPOS NUTRICIONAIS (Suplementos agora é Array, Horários refeitos)
    mealsPerDay: '', wakeUpTime: '', sleepTime: '', workTimeStart: '', workTimeEnd: '', trainTime: '',
    allergies: '', foodPreferences: '', foodAversions: '', supplements: []
  });

  // 🔥 CONTROLE DO MODAL DE HORÁRIOS
  const [timeModal, setTimeModal] = useState({ visible: false, target: '', step: 'hour', tempHour: '' });

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

  // Função Universal de Múltipla Escolha (Agora entende "Nenhuma" e "Nenhum")
  const toggleSelection = (field, item) => {
    setForm(prev => {
      const list = prev[field];
      const isNone = item === 'Nenhuma' || item === 'Nenhum';
      
      if (list.includes(item)) return { ...prev, [field]: list.filter(i => i !== item) };
      if (isNone) return { ...prev, [field]: [item] };
      return { ...prev, [field]: [...list.filter(i => i !== 'Nenhuma' && i !== 'Nenhum'), item] };
    });
  };

  // 🔥 FUNÇÕES DO RELÓGIO (TimePicker Modal)
  const openTimePicker = (targetField) => {
      setTimeModal({ visible: true, target: targetField, step: 'hour', tempHour: '' });
  };

  const handleSelectHour = (h) => {
      setTimeModal(prev => ({ ...prev, step: 'minute', tempHour: h }));
  };

  const handleSelectMinute = (m) => {
      const finalTime = `${timeModal.tempHour}:${m}`;
      setForm(prev => ({ ...prev, [timeModal.target]: finalTime }));
      setTimeModal({ visible: false, target: '', step: 'hour', tempHour: '' });
  };

  const salvarAnamnese = async () => {
    // 🔥 TRAVA FINAL DE SEGURANÇA (Antes de enviar pro banco)
    if (currentUser?.dietModule) {
        if (!form.allergies.trim() || !form.foodPreferences.trim() || !form.foodAversions.trim() || form.supplements.length === 0) {
            return Alert.alert("Faltam Dados", "Por favor, preencha todas as caixas. Use as opções 'Nenhum/Nenhuma' caso não possua restrições ou suplementos.");
        }
    } else {
        if (!form.frequencia || !form.tempoDisponivel) {
            return Alert.alert("Faltam Dados", "Selecione a frequência e o tempo disponível.");
        }
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
        equipamentos: form.equipamentos.trim() ? form.equipamentos.split(',').map(i => i.trim()).filter(i => i) : [],
        
        // 🔥 MAGIA: Formata os dados para o padrão antigo do Banco de Dados não quebrar!
        ...(currentUser?.dietModule && {
            mealsPerDay: parseInt(form.mealsPerDay) || null,
            wakeUpTime: form.wakeUpTime,
            sleepTime: form.sleepTime,
            workTime: `${form.workTimeStart} às ${form.workTimeEnd}`, // Junta os 2 horários numa string
            trainTime: form.trainTime,
            allergies: form.allergies.trim(),
            foodPreferences: form.foodPreferences.trim(),
            foodAversions: form.foodAversions.trim(),
            supplements: form.supplements.join(', ') // Junta o Array de chips numa string
        })
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

      if(Platform.OS === 'web') window.alert("Perfil configurado! Aguarde a montagem do seu planejamento.");
      else Alert.alert("Sucesso! 🚀", "Perfil configurado! Aguarde a montagem do seu planejamento.");
      
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
    // 🔥 TRAVAS DE SEGURANÇA POR ETAPA
    if (step === 1 && (!form.peso || !form.altura)) return Alert.alert("Faltam Dados", "Preencha o seu peso e altura para continuarmos.");
    if (step === 2 && (!form.objetivo || !form.nivel)) return Alert.alert("Faltam Dados", "Selecione o seu objetivo e nível de experiência.");
    
    if (step === 3) {
        if (form.limitacoes.length === 0) return Alert.alert("Atenção", "Selecione suas limitações físicas ou marque 'Nenhuma'.");
        if (form.cirurgias.length === 0) return Alert.alert("Atenção", "Selecione cirurgias prévias ou marque 'Nenhuma'.");
        if (!form.equipamentos.trim()) return Alert.alert("Faltam Dados", "Informe o seu local de treino e equipamentos disponíveis.");
    }
    
    if (step === 4 && (!form.frequencia || !form.tempoDisponivel)) return Alert.alert("Faltam Dados", "Selecione a frequência semanal e o tempo disponível para os treinos.");
    
    if (step === 5 && !form.mealsPerDay) return Alert.alert("Faltam Dados", "Selecione a quantidade de refeições que prefere fazer.");
    
    if (step === 6) {
        if (!form.wakeUpTime || !form.sleepTime || !form.workTimeStart || !form.workTimeEnd || !form.trainTime) {
            return Alert.alert("Faltam Dados", "Preencha todos os horários da sua rotina (Acordar, Dormir, Trabalho e Treino).");
        }
    }

    setStep(step + 1);
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={[styles.safe, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
            
            {/* HEADER COM BARRA DE PROGRESSO DINÂMICA */}
            <View style={[styles.header, { backgroundColor: theme.bg }]}>
              <Text style={[styles.headerTitle, { color: theme.accent }]}>ANAMNESE</Text>
              <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: theme.accent, width: `${(step / totalSteps) * 100}%`}]} />
              </View>
              <Text style={[styles.stepCounter, { color: theme.textSecondary }]}>Etapa {step} de {totalSteps}</Text>
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

                  <Text style={[styles.question, { marginTop: 30, color: theme.text }]}>Local de Treino / Equipamentos</Text>
                  <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 10 }]}>SEPARE POR VÍRGULA</Text>
                  <TextInput 
                      style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                      placeholder="Ex: SmartFit, Academia Completa, Halteres em casa" 
                      placeholderTextColor={theme.textSecondary} 
                      onChangeText={v => setForm({...form, equipamentos: v})} 
                      value={form.equipamentos} 
                  />
                </View>
              )}

              {/* ETAPA 4 */}
              {step === 4 && (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>Frequência de Treino</Text>
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

              {/* ETAPA 5 */}
              {step === 5 && currentUser?.dietModule && (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>Planejamento Alimentar</Text>
                  <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 15 }]}>QUANTAS REFEIÇÕES VOCÊ PREFERE FAZER NO DIA?</Text>
                  <View style={styles.wrapGrid}>
                    {[2, 3, 4, 5, 6, 7, 8].map(d => (
                      <TouchableOpacity 
                          key={d} 
                          style={[styles.circle, { backgroundColor: theme.surface, borderColor: theme.border }, form.mealsPerDay === d.toString() && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                          onPress={() => setForm({...form, mealsPerDay: d.toString()})}
                      >
                        <Text style={[styles.circleText, { color: theme.text }, form.mealsPerDay === d.toString() && {color: theme.isDark ? '#000' : '#FFF'}]}>{d}x</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* 🔥 ETAPA 6: ROTINA COM SELETORES AUTOMÁTICOS 🔥 */}
              {step === 6 && currentUser?.dietModule && (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>Como é a sua rotina?</Text>
                  
                  <View style={styles.row}>
                    <View style={{flex:1, marginRight:10, marginBottom: 20}}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>HORA QUE ACORDA *</Text>
                      <TouchableOpacity style={[styles.inputButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => openTimePicker('wakeUpTime')}>
                          <Text style={{ color: form.wakeUpTime ? theme.text : theme.textSecondary, fontSize: 16, fontWeight: 'bold' }}>
                              {form.wakeUpTime || 'Selecionar'}
                          </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{flex:1, marginBottom: 20}}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>HORA QUE DORME *</Text>
                      <TouchableOpacity style={[styles.inputButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => openTimePicker('sleepTime')}>
                          <Text style={{ color: form.sleepTime ? theme.text : theme.textSecondary, fontSize: 16, fontWeight: 'bold' }}>
                              {form.sleepTime || 'Selecionar'}
                          </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 5 }]}>HORÁRIO DE TRABALHO *</Text>
                  <View style={styles.row}>
                    <View style={{flex:1, marginRight:10, marginBottom: 20}}>
                      <TouchableOpacity style={[styles.inputButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => openTimePicker('workTimeStart')}>
                          <Text style={{ color: form.workTimeStart ? theme.text : theme.textSecondary, fontSize: 16, fontWeight: 'bold' }}>
                              {form.workTimeStart ? `Início: ${form.workTimeStart}` : 'Início'}
                          </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{flex:1, marginBottom: 20}}>
                      <TouchableOpacity style={[styles.inputButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => openTimePicker('workTimeEnd')}>
                          <Text style={{ color: form.workTimeEnd ? theme.text : theme.textSecondary, fontSize: 16, fontWeight: 'bold' }}>
                              {form.workTimeEnd ? `Fim: ${form.workTimeEnd}` : 'Fim'}
                          </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 5 }]}>HORÁRIO DO TREINO *</Text>
                  <TouchableOpacity style={[styles.inputButton, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 20 }]} onPress={() => openTimePicker('trainTime')}>
                      <Text style={{ color: form.trainTime ? theme.text : theme.textSecondary, fontSize: 16, fontWeight: 'bold' }}>
                          {form.trainTime || 'Selecionar'}
                      </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 🔥 ETAPA 7: NUTRIÇÃO - CHIPS DE SUPLEMENTOS 🔥 */}
              {step === 7 && currentUser?.dietModule && (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>Preferências e Restrições</Text>
                  
                  <Text style={[styles.label, { color: theme.textSecondary, marginTop: 10 }]}>ALERGIAS OU INTOLERÂNCIAS *</Text>
                  <TextInput 
                      style={[styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                      placeholder="Ex: Intolerância à lactose, alergia a camarão..." placeholderTextColor={theme.textSecondary} 
                      multiline
                      onChangeText={v => setForm({...form, allergies: v})} value={form.allergies} 
                  />
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>* Se não houver, digite "Nenhuma".</Text>

                  <Text style={[styles.label, { color: theme.textSecondary, marginTop: 20 }]}>O QUE VOCÊ ODEIA COMER? *</Text>
                  <TextInput 
                      style={[styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                      placeholder="Ex: Fígado, batata doce, brócolis..." placeholderTextColor={theme.textSecondary} 
                      multiline
                      onChangeText={v => setForm({...form, foodAversions: v})} value={form.foodAversions} 
                  />
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>* Se comer de tudo, digite "Nada".</Text>

                  <Text style={[styles.label, { color: theme.textSecondary, marginTop: 20 }]}>PREFERÊNCIAS ALIMENTARES *</Text>
                  <TextInput 
                      style={[styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                      placeholder="Ex: Gosto muito de frango com batata doce e ovos..." placeholderTextColor={theme.textSecondary} 
                      multiline
                      onChangeText={v => setForm({...form, foodPreferences: v})} value={form.foodPreferences} 
                  />
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>* O que não pode faltar na sua dieta.</Text>

                  {/* SUPLEMENTOS AGORA COM BOTÕES CHIPS */}
                  <Text style={[styles.label, { color: theme.textSecondary, marginTop: 25, marginBottom: 10 }]}>SUPLEMENTOS QUE JÁ UTILIZA *</Text>
                  <View style={styles.wrapGrid}>
                    {SUPLEMENTOS_LIST.map(item => (
                      <TouchableOpacity 
                          key={item} 
                          style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, form.supplements.includes(item) && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                          onPress={() => toggleSelection('supplements', item)}
                      >
                        <Text style={[styles.chipText, { color: theme.textSecondary }, form.supplements.includes(item) && {color: theme.isDark ? '#000' : '#FFF'}]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                </View>
              )}

            </ScrollView>

            {/* 🔥 RODAPÉ FIXO */}
            <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
               {step > 1 ? (
                 <TouchableOpacity onPress={() => setStep(step-1)} style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <Text style={{color: theme.text, fontWeight:'bold'}}>VOLTAR</Text>
                 </TouchableOpacity>
               ) : <View style={{flex:1}} />}
               
               {step < totalSteps ? (
                 <TouchableOpacity onPress={nextStep} style={[styles.nextBtn, { backgroundColor: theme.accent }]}>
                    <Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight:'bold'}}>PRÓXIMO</Text>
                 </TouchableOpacity>
               ) : (
                 <TouchableOpacity onPress={salvarAnamnese} disabled={loading} style={[styles.nextBtn, { backgroundColor: theme.accent }]}>
                    {loading ? <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} /> : <Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight:'900'}}>FINALIZAR</Text>}
                 </TouchableOpacity>
               )}
            </View>

            {/* 🔥 MODAL DE SELEÇÃO DE HORÁRIO 🔥 */}
            <Modal visible={timeModal.visible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.timeModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 20 }]}>
                            {timeModal.step === 'hour' ? 'SELECIONE A HORA' : 'SELECIONE OS MINUTOS'}
                        </Text>
                        
                        <View style={styles.timeGrid}>
                            {timeModal.step === 'hour' ? (
                                Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                    <TouchableOpacity key={h} style={[styles.timeOption, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => handleSelectHour(h)}>
                                        <Text style={[styles.timeOptionText, { color: theme.text }]}>{h}h</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                                    <TouchableOpacity key={m} style={[styles.timeOption, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => handleSelectMinute(m)}>
                                        <Text style={[styles.timeOptionText, { color: theme.text }]}>{m}m</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        <TouchableOpacity style={{ marginTop: 25, padding: 15, alignItems: 'center' }} onPress={() => setTimeModal({ visible: false, target: '', step: 'hour', tempHour: '' })}>
                            <Text style={{ color: theme.textSecondary, fontWeight: 'bold', fontSize: 16 }}>CANCELAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
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
  hintText: { fontSize: 11, fontStyle: 'italic', marginTop: 4, marginLeft: 5 },
  
  input: { padding: 18, borderRadius: 16, borderWidth: 1, fontSize: 16, outlineStyle: 'none' },
  inputButton: { padding: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  textArea: { padding: 18, borderRadius: 16, borderWidth: 1, fontSize: 15, outlineStyle: 'none', minHeight: 90, textAlignVertical: 'top' },
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

  // Estilos do Modal de Relógio
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  timeModalContent: { width: '100%', maxWidth: 350, padding: 25, borderRadius: 24, borderWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  timeOption: { width: '21%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  timeOptionText: { fontWeight: 'bold', fontSize: 16 }
});