// src/screens/SetupTreinoScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { authHeaders } from '../utils/authToken';

export default function SetupTreinoScreen({ navigation, route }) {
  const { theme } = useTheme();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState('LOW_COST'); 
  const [userGender, setUserGender] = useState('M'); 
  
  // Respostas
  const [goal, setGoal] = useState('');
  const [focus, setFocus] = useState('');
  const [level, setLevel] = useState('');

  const isWeb = Platform.OS === 'web';
  const RootComponent = isWeb ? View : SafeAreaView;
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  useEffect(() => {
      const loadUser = async () => {
          let user = route.params?.userData;
          
          if (!user) {
              const userJson = await AsyncStorage.getItem('user');
              if (userJson) user = JSON.parse(userJson);
          }

          if (user) {
              setUserPlan(user.plan || 'LOW_COST');
              const isFemale = user.gender === 'Feminino' || user.gender === 'F';
              setUserGender(isFemale ? 'F' : 'M');
              
              await AsyncStorage.setItem('user', JSON.stringify(user));
              if (user.role || user.type) {
                  await AsyncStorage.setItem('role', user.role || user.type || 'USER');
              }
              
              // 🔥 SE FOR DESAFIO, JÁ DEIXA AS RESPOSTAS NO GATILHO
              if (user.plan === 'CHALLENGE_21') {
                  setGoal('Emagrecimento');
                  setFocus('Queima Total');
                  setLevel('Desafio 21D');
              }
          }
      };
      
      loadUser();
  }, [route.params]);

  const handleLogout = async () => {
      await AsyncStorage.multiRemove(['user', 'role', '@dashboard_cache', '@global_exercises']);
      if (Platform.OS === 'web') {
          window.location.replace('/');
      } else {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
  };

  const handleBack = () => {
      if (step > 1) {
          setStep(step - 1);
          setFocus(''); 
      } else {
          if (Platform.OS === 'web') {
              const confirmLogout = window.confirm("Deseja sair da conta e voltar ao início?");
              if (confirmLogout) handleLogout();
          } else {
              Alert.alert("Sair da Conta", "Deseja fazer logout e voltar para a tela inicial?", [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Sair", style: "destructive", onPress: handleLogout }
              ]);
          }
      }
  };

  const handleNext = () => {
      if (userPlan === 'CHALLENGE_21') return finalizeSetup();

      if (step === 1 && !goal) return showAlert("Selecione seu objetivo principal.");
      if (step === 2 && !focus) return showAlert("Selecione o foco do treino.");
      if (step === 3 && !level) return showAlert("Selecione seu nível de experiência.");

      if (step < 3) {
          setStep(step + 1);
      } else {
          finalizeSetup();
      }
  };

  const showAlert = (msg) => {
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Atenção", msg);
  };

  const getFocusOptions = () => {
      if (goal === 'Emagrecimento') {
          return [
              { value: 'Queima Global', label: 'Queima Global', desc: 'Secar gordura no corpo todo', icon: 'fire' },
              userGender === 'F' 
                  ? { value: 'Abdômen e Cintura', label: 'Abdômen e Cintura', desc: 'Foco na região abdominal', icon: 'human-female' }
                  : { value: 'Perder Barriga', label: 'Perder Barriga', desc: 'Secar a região abdominal', icon: 'human-male' },
              { value: 'Definição Muscular', label: 'Definição Muscular', desc: 'Emagrecer mantendo tônus', icon: 'dumbbell' }
          ];
      } else if (goal === 'Hipertrofia') {
          return userGender === 'F' ? [
              { value: 'Glúteos e Pernas', label: 'Glúteos e Pernas', desc: 'Volume em membros inferiores', icon: 'human-female' },
              { value: 'Costas e Curvas', label: 'Costas e Curvas', desc: 'Foco em membros superiores', icon: 'hanger' },
              { value: 'Corpo Todo', label: 'Corpo Todo', desc: 'Crescimento equilibrado', icon: 'human-handsup' }
          ] : [
              { value: 'Peitoral e Braços', label: 'Peitoral e Braços', desc: 'Volume em membros superiores', icon: 'human-male' },
              { value: 'Pernas Fortes', label: 'Pernas Fortes', desc: 'Foco em membros inferiores', icon: 'run' },
              { value: 'Corpo Todo', label: 'Corpo Todo', desc: 'Crescimento equilibrado', icon: 'human-handsup' }
          ];
      } else {
          return [
              { value: 'Fortalecimento Geral', label: 'Fortalecimento Geral', desc: 'Mais saúde e vigor físico', icon: 'shield-check' },
              { value: 'Mobilidade e Postura', label: 'Mobilidade e Postura', desc: 'Foco em aliviar dores', icon: 'yoga' },
              { value: 'Condicionamento', label: 'Condicionamento', desc: 'Melhorar fôlego e resistência', icon: 'heart-pulse' }
          ];
      }
  };

  const finalizeSetup = async () => {
      setLoading(true);
      try {
          // 🔥 CIRURGIA: Blindagem contra o bug do [object Object] e string corrompida
          let userRaw = route.params?.userData;
          let user = typeof userRaw === 'string' ? JSON.parse(userRaw) : userRaw;

          if (!user) {
              const userJson = await AsyncStorage.getItem('user');
              if (userJson) user = JSON.parse(userJson);
          }

          // Verifica se o ID é legítimo e não é um "lixo" de memória
          if (!user?.id || String(user.id).includes("object")) {
              console.error("ID inválido detectado no Setup:", user?.id);
              throw new Error("Sessão corrompida. Por favor, faça logout e entre novamente.");
          }

          const finalGoal = userPlan === 'CHALLENGE_21' ? 'Emagrecimento Acelerado' : `${goal} (Foco: ${focus})`;
          const finalLevel = userPlan === 'CHALLENGE_21' ? 'Desafio Único' : level;

          // 🔥 AGORA ESTÁ ALINHADO: Bate em /api/user e manda o userId no body
          await fetch(`https://fitos-final.onrender.com/api/user`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
              body: JSON.stringify({
                  userId: user.id, // O segredo está aqui
                  goal: finalGoal,
                  level: finalLevel
              })
          });

          if (userPlan !== 'LOW_COST') {
              const placeholderName = userPlan === 'FICHA_8S' ? 'FICHA EM CONSTRUÇÃO 🚧' : 'DESAFIO EM CONSTRUÇÃO 🚧';
              const durationDays = userPlan === 'CHALLENGE_21' ? 21 : 56;

              const res = await fetch('https://fitos-final.onrender.com/api/workout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                  body: JSON.stringify({
                      userId: user.id,
                      name: placeholderName,
                      goal: finalGoal,
                      level: finalLevel,
                      startDate: new Date().toISOString(),
                      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
                      routine: [] 
                  })
              });

              if (!res.ok) {
                  const errTxt = await res.text();
                  console.error("Falha no servidor:", errTxt);
                  throw new Error("O servidor rejeitou a ficha.");
              }

              const savedWorkout = await res.json();
              user.workouts = [savedWorkout];
          } else {
              user.workouts = [];
          }
          
          await AsyncStorage.setItem('user', JSON.stringify(user));

          setLoading(false);
          const successMsg = userPlan === 'CHALLENGE_21' 
            ? "Seu perfil foi configurado para o Desafio 21 Dias! Prepare-se para a transformação."
            : "O Coach Paulo Adriano recebeu suas informações e está preparando seu protocolo. Vamos entrar no app!";
          
          if (Platform.OS === 'web') {
              window.alert(`Tudo Certo! 🚀\n\n${successMsg}`);
              navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          } else {
              Alert.alert("Tudo Certo! 🚀", successMsg, [
                  { text: "Entrar no App", onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }) }
              ]);
          }

      } catch (e) {
          setLoading(false);
          console.error("Erro ao finalizar setup:", e);
          showAlert("Não conseguimos enviar seus dados agora. Verifique sua conexão e tente novamente.");
      }
  };

  const renderProgress = () => {
      if (userPlan === 'CHALLENGE_21') return null;
      return (
        <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${(step / 3) * 100}%`, backgroundColor: theme.accent }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>PASSO {step} DE 3</Text>
        </View>
      );
  };

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

  const loadingTitle = "ENVIANDO DADOS...";
  const loadingDesc = "Nossa plataforma está repassando o seu perfil diretamente para a prancheta do Coach.";
  const finalBtnText = userPlan === 'CHALLENGE_21' ? 'INICIAR DESAFIO 21D 🔥' : 'FINALIZAR CONFIGURAÇÃO 🔥';

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          {loading ? (
              <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.accent} />
                  <Text style={[styles.loadingTitle, { color: theme.text }]}>{loadingTitle}</Text>
                  <Text style={[styles.loadingDesc, { color: theme.textSecondary }]}>{loadingDesc}</Text>
              </View>
          ) : (
              <>
                  <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                      <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                  </TouchableOpacity>

                  {renderProgress()}

                  {userPlan === 'CHALLENGE_21' ? (
                      <View style={styles.stepContent}>
                          <View style={{alignItems: 'center', marginVertical: 40}}>
                              <View style={{backgroundColor: theme.accent + '22', width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20}}>
                                  <MaterialCommunityIcons name="fire" size={60} color={theme.accent} />
                              </View>
                              <Text style={[styles.stepTitle, { color: theme.text, textAlign: 'center' }]}>PRONTO PARA O{"\n"}DESAFIO 21 DIAS?</Text>
                              <Text style={{color: theme.textSecondary, textAlign: 'center', fontSize: 16, lineHeight: 24, paddingHorizontal: 20}}>
                                  Prepare-se para uma jornada intensa de emagrecimento. O Coach Paulo Adriano está no comando!
                              </Text>
                          </View>
                      </View>
                  ) : (
                      <>
                        {step === 1 && (
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, { color: theme.text }]}>Qual seu objetivo principal?</Text>
                                {renderOptions([
                                    { value: 'Emagrecimento', label: 'Emagrecimento', desc: 'Perder gordura e definir', icon: 'fire' },
                                    { value: 'Hipertrofia', label: 'Hipertrofia', desc: 'Ganhar massa muscular', icon: 'arm-flex' },
                                    { value: 'Qualidade de Vida', label: 'Qualidade de Vida', desc: 'Saúde e fortalecimento', icon: 'heart-pulse' }
                                ], goal, setGoal)}
                            </View>
                        )}

                        {step === 2 && (
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, { color: theme.text }]}>Qual área deseja focar?</Text>
                                {renderOptions(getFocusOptions(), focus, setFocus)}
                            </View>
                        )}

                        {step === 3 && (
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, { color: theme.text }]}>Qual o seu nível de treino?</Text>
                                {renderOptions([
                                    { value: 'Iniciante', label: 'Iniciante', desc: 'Começando agora ou parado há tempo', icon: 'battery-10' },
                                    { value: 'Intermediário', label: 'Intermediário', desc: 'Treina há mais de 6 meses', icon: 'battery-50' },
                                    { value: 'Avançado', label: 'Avançado', desc: 'Treina pesado há mais de 2 anos', icon: 'battery-high' }
                                ], level, setLevel)}
                            </View>
                        )}
                      </>
                  )}

                  <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.accent }]} onPress={handleNext}>
                      <Text style={[styles.nextBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>
                          {userPlan === 'CHALLENGE_21' || step === 3 ? finalBtnText : 'PRÓXIMO PASSO'}
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
  loadingTitle: { fontSize: 20, fontWeight: '900', marginTop: 25, marginBottom: 10, textAlign: 'center' },
  loadingDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 }
});