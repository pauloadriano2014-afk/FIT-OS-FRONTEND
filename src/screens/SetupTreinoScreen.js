// src/screens/SetupTreinoScreen.js
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

export default function SetupTreinoScreen({ navigation }) {
  const { theme } = useTheme();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Respostas do Aluno
  const [gender, setGender] = useState('');
  const [goal, setGoal] = useState('');
  const [focus, setFocus] = useState('');
  const [level, setLevel] = useState('');

  const isWeb = Platform.OS === 'web';
  const RootComponent = isWeb ? View : SafeAreaView;
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  const handleNext = () => {
      if (step === 1 && !gender) return showAlert("Selecione seu gênero.");
      if (step === 2 && !goal) return showAlert("Selecione seu objetivo.");
      if (step === 3 && !focus) return showAlert("Selecione o foco do treino.");
      if (step === 4 && !level) return showAlert("Selecione seu nível.");

      if (step < 4) {
          setStep(step + 1);
      } else {
          generateWorkout();
      }
  };

  const showAlert = (msg) => {
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Atenção", msg);
  };

  const generateWorkout = async () => {
      setLoading(true);
      try {
          const userJson = await AsyncStorage.getItem('user');
          const user = JSON.parse(userJson);

          // 🔥 ROTA DO PILOTO AUTOMÁTICO QUE VAMOS CRIAR NO BACKEND DEPOIS
          const res = await fetch('https://fitos-final.onrender.com/api/workout/auto-setup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  userId: user.id,
                  gender,
                  goal,
                  focus,
                  level
              })
          });

          if (!res.ok) throw new Error("Falha ao gerar treino");

          // Tudo certo, volta pra Home para ver o treino!
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

      } catch (e) {
          setLoading(false);
          showAlert("Não conseguimos gerar seu treino agora. Tente novamente.");
      }
  };

  const renderProgress = () => (
      <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${(step / 4) * 100}%`, backgroundColor: theme.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>PASSO {step} DE 4</Text>
      </View>
  );

  const renderOptions = (options, stateValue, setStateFunction) => (
      <View style={styles.optionsContainer}>
          {options.map((opt, i) => {
              const isSelected = stateValue === opt.value;
              return (
                  <TouchableOpacity 
                      key={i} 
                      style={[styles.optionCard, { backgroundColor: theme.surface, borderColor: isSelected ? theme.accent : theme.border }]}
                      onPress={() => setStateFunction(opt.value)}
                  >
                      <View style={[styles.iconBox, { backgroundColor: isSelected ? theme.accent + '22' : theme.bg }]}>
                          <MaterialCommunityIcons name={opt.icon} size={28} color={isSelected ? theme.accent : theme.textSecondary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 15 }}>
                          <Text style={[styles.optionTitle, { color: theme.text }]}>{opt.label}</Text>
                          {opt.desc && <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>}
                      </View>
                      <View style={[styles.radio, { borderColor: isSelected ? theme.accent : theme.border }]}>
                          {isSelected && <View style={[styles.radioFill, { backgroundColor: theme.accent }]} />}
                      </View>
                  </TouchableOpacity>
              )
          })}
      </View>
  );

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          {loading ? (
              <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.accent} />
                  <Text style={[styles.loadingTitle, { color: theme.text }]}>MONTANDO SEU TREINO...</Text>
                  <Text style={[styles.loadingDesc, { color: theme.textSecondary }]}>
                      Nossa inteligência está buscando o melhor protocolo para o seu perfil na biblioteca do PA Team.
                  </Text>
              </View>
          ) : (
              <>
                  <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
                      <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                  </TouchableOpacity>

                  {renderProgress()}

                  {step === 1 && (
                      <View style={styles.stepContent}>
                          <Text style={[styles.stepTitle, { color: theme.text }]}>Qual o seu gênero?</Text>
                          {renderOptions([
                              { value: 'M', label: 'Masculino', icon: 'gender-male' },
                              { value: 'F', label: 'Feminino', icon: 'gender-female' }
                          ], gender, setGender)}
                      </View>
                  )}

                  {step === 2 && (
                      <View style={styles.stepContent}>
                          <Text style={[styles.stepTitle, { color: theme.text }]}>Qual seu objetivo principal?</Text>
                          {renderOptions([
                              { value: 'Emagrecimento', label: 'Emagrecimento', desc: 'Perder gordura e definir', icon: 'fire' },
                              { value: 'Hipertrofia', label: 'Hipertrofia', desc: 'Ganhar massa muscular', icon: 'arm-flex' },
                              { value: 'Qualidade de Vida', label: 'Qualidade de Vida', desc: 'Saúde e fortalecimento', icon: 'heart-pulse' }
                          ], goal, setGoal)}
                      </View>
                  )}

                  {step === 3 && (
                      <View style={styles.stepContent}>
                          <Text style={[styles.stepTitle, { color: theme.text }]}>Qual área deseja focar?</Text>
                          {gender === 'F' ? renderOptions([
                              { value: 'Glúteos e Pernas', label: 'Glúteos e Pernas', icon: 'human-female' },
                              { value: 'Costas e Curvas', label: 'Costas e Curvas (Superiores)', icon: 'hanger' },
                              { value: 'Corpo Todo', label: 'Corpo Todo (Equilibrado)', icon: 'human-handsup' }
                          ], focus, setFocus) : renderOptions([
                              { value: 'Peitoral e Braços', label: 'Peitoral e Braços', icon: 'human-male' },
                              { value: 'Pernas', label: 'Pernas Fortes', icon: 'run' },
                              { value: 'Corpo Todo', label: 'Corpo Todo (Equilibrado)', icon: 'human-handsup' }
                          ], focus, setFocus)}
                      </View>
                  )}

                  {step === 4 && (
                      <View style={styles.stepContent}>
                          <Text style={[styles.stepTitle, { color: theme.text }]}>Qual o seu nível de treino?</Text>
                          {renderOptions([
                              { value: 'Iniciante', label: 'Iniciante', desc: 'Começando agora ou parado há tempo', icon: 'battery-10' },
                              { value: 'Intermediário', label: 'Intermediário', desc: 'Treina há mais de 6 meses', icon: 'battery-50' },
                              { value: 'Avançado', label: 'Avançado', desc: 'Treina pesado há mais de 2 anos', icon: 'battery-high' }
                          ], level, setLevel)}
                      </View>
                  )}

                  <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.accent }]} onPress={handleNext}>
                      <Text style={[styles.nextBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>
                          {step === 4 ? 'GERAR MEU TREINO 🔥' : 'PRÓXIMO PASSO'}
                      </Text>
                  </TouchableOpacity>
              </>
          )}
      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  backBtn: { paddingVertical: 10, alignSelf: 'flex-start', paddingTop: Platform.OS === 'android' ? 20 : 10 },
  progressContainer: { marginVertical: 20 },
  progressBar: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, fontWeight: 'bold', marginTop: 8, letterSpacing: 1 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
  optionsContainer: { gap: 15 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '900' },
  optionDesc: { fontSize: 12, marginTop: 4 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  nextBtn: { padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20, elevation: 2 },
  nextBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  loadingTitle: { fontSize: 20, fontWeight: '900', marginTop: 25, marginBottom: 10 },
  loadingDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 }
});