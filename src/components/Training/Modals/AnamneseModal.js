// src/components/Training/Modals/AnamneseModal.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AnamneseModal({ visible, onClose, theme, submitting, onSubmit }) {
  const [step, setStep] = useState(1);
  const TOTAL = 6;

  const [runningExperience, setRunningExperience] = useState('');
  const [timeStopped, setTimeStopped] = useState('');
  const [maxDistanceBefore, setMaxDistanceBefore] = useState('');
  const [weeklyFrequencyNow, setWeeklyFrequencyNow] = useState('');
  const [completedRaces, setCompletedRaces] = useState(false);
  const [racesDescription, setRacesDescription] = useState('');
  const [canWalk30min, setCanWalk30min] = useState(null);
  const [canJog5min, setCanJog5min] = useState(null);
  const [breathingDifficulty, setBreathingDifficulty] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState(null);
  const [injuries, setInjuries] = useState([]);
  const [heartCondition, setHeartCondition] = useState(null);
  const [jointIssues, setJointIssues] = useState(null);
  const [medications, setMedications] = useState('');
  const [medicalClearance, setMedicalClearance] = useState('');
  const [runningGoal, setRunningGoal] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [previousFailures, setPreviousFailures] = useState('');
  const [availableDays, setAvailableDays] = useState([]);
  const [preferredTime, setPreferredTime] = useState('');
  const [trainingLocation, setTrainingLocation] = useState('');
  const [hasProperShoes, setHasProperShoes] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyPainDuringWalk, setBodyPainDuringWalk] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');

  const toggleInjury = (val) => {
    if (val === 'Nenhuma') { setInjuries(['Nenhuma']); return; }
    setInjuries(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev.filter(x => x !== 'Nenhuma'), val]);
  };

  const toggleDay = (val) => {
    setAvailableDays(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const canAdvance = () => {
    if (step === 1) return !!runningExperience;
    if (step === 2) return canWalk30min !== null && canJog5min !== null && !!breathingDifficulty && fitnessLevel !== null;
    if (step === 3) return injuries.length > 0 && heartCondition !== null && jointIssues !== null && !!medicalClearance;
    if (step === 4) return !!runningGoal;
    if (step === 5) return availableDays.length >= 3 && !!preferredTime && !!trainingLocation && !!hasProperShoes;
    if (step === 6) return !!sleepQuality;
    return false;
  };

  const handleSubmit = () => {
    onSubmit({
      runningExperience, timeStopped, maxDistanceBefore, weeklyFrequencyNow,
      completedRaces, racesDescription,
      canWalk30min, canJog5min, breathingDifficulty, fitnessLevel,
      injuries, heartCondition, jointIssues, medications, medicalClearance,
      runningGoal, goalDeadline, previousFailures,
      availableDays, preferredTime, trainingLocation, hasProperShoes,
      weight: weight ? parseFloat(weight.replace(',', '.')) : null,
      height: height ? parseFloat(height.replace(',', '.')) : null,
      bodyPainDuringWalk, sleepQuality,
    });
  };

  const pct = ((step - 1) / TOTAL) * 100;

  const Chip = ({ label, active, onPress, full = false }) => (
    <TouchableOpacity
      style={[full ? aStyles.chipFull : aStyles.chip, { borderColor: active ? '#22c55e' : theme.border, backgroundColor: active ? '#22c55e' : theme.bg }]}
      onPress={onPress}
    >
      <Text style={[aStyles.chipText, { color: active ? '#000' : theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const BoolBtn = ({ label, active, onPress, danger = false }) => (
    <TouchableOpacity
      style={[aStyles.boolBtn, { flex: 1, borderColor: active ? (danger ? '#ef4444' : '#22c55e') : theme.border, backgroundColor: active ? (danger ? '#ef4444' : '#22c55e') : theme.bg }]}
      onPress={onPress}
    >
      <Text style={[aStyles.boolBtnText, { color: active ? '#000' : theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const Circle = ({ label, active, onPress, size = 44 }) => (
    <TouchableOpacity
      style={[aStyles.circle, { width: size, height: size, borderRadius: size / 2, borderColor: active ? '#22c55e' : theme.border, backgroundColor: active ? '#22c55e' : theme.bg }]}
      onPress={onPress}
    >
      <Text style={[aStyles.circleText, { color: active ? '#000' : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          {/* Header */}
          <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[modalStyles.iconBox, { backgroundColor: '#22c55e22' }]}>
                <MaterialCommunityIcons name="clipboard-list" size={20} color="#22c55e" />
              </View>
              <View>
                <Text style={[modalStyles.headerTitle, { color: theme.text }]}>ANAMNESE DE CORRIDA</Text>
                <Text style={[modalStyles.headerSub, { color: theme.textSecondary }]}>Etapa {step} de {TOTAL}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Barra de progresso */}
          <View style={[aStyles.progressBg, { backgroundColor: theme.border }]}>
            <View style={[aStyles.progressFill, { width: `${pct}%` }]} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

            {/* ETAPA 1 */}
            {step === 1 && (
              <>
                <Text style={[aStyles.stepTitle, { color: theme.text }]}>👟 Experiência com corrida</Text>
                <Text style={[aStyles.label, { color: theme.textSecondary }]}>VOCÊ JÁ CORREU ANTES? *</Text>
                <View style={{ gap: 10 }}>
                  {[
                    { val: 'never', label: 'Nunca corri', desc: 'Sou completamente iniciante' },
                    { val: 'stopped', label: 'Já corri mas parei', desc: 'Tive uma experiência anterior' },
                    { val: 'active', label: 'Corro atualmente', desc: 'Já tenho alguma frequência' },
                  ].map(opt => (
                    <TouchableOpacity key={opt.val} style={[aStyles.chipFull, { borderColor: runningExperience === opt.val ? '#22c55e' : theme.border, backgroundColor: runningExperience === opt.val ? '#22c55e22' : theme.bg }]} onPress={() => setRunningExperience(opt.val)}>
                      <Text style={[aStyles.chipFullTitle, { color: runningExperience === opt.val ? '#22c55e' : theme.text }]}>{opt.label}</Text>
                      <Text style={[aStyles.chipFullDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {runningExperience === 'stopped' && (
                  <>
                    <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 20 }]}>HÁ QUANTO TEMPO PAROU?</Text>
                    <View style={aStyles.chipRow}>
                      {['Menos de 3 meses', '3 a 6 meses', '6 meses a 1 ano', 'Mais de 1 ano'].map(v => (
                        <Chip key={v} label={v} active={timeStopped === v} onPress={() => setTimeStopped(v)} />
                      ))}
                    </View>
                    <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>DISTÂNCIA MÁXIMA ANTERIOR?</Text>
                    <View style={aStyles.chipRow}>
                      {['Menos de 1km', '1 a 2km', '2 a 3km', '3 a 5km', 'Mais de 5km'].map(v => (
                        <Chip key={v} label={v} active={maxDistanceBefore === v} onPress={() => setMaxDistanceBefore(v)} />
                      ))}
                    </View>
                  </>
                )}

                {runningExperience === 'active' && (
                  <>
                    <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 20 }]}>FREQUÊNCIA ATUAL?</Text>
                    <View style={aStyles.chipRow}>
                      {['1x por semana', '2x por semana', '3x por semana', '4x ou mais'].map(v => (
                        <Chip key={v} label={v} active={weeklyFrequencyNow === v} onPress={() => setWeeklyFrequencyNow(v)} />
                      ))}
                    </View>
                  </>
                )}

                {(runningExperience === 'stopped' || runningExperience === 'active') && (
                  <>
                    <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>JÁ COMPLETOU ALGUMA PROVA?</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <BoolBtn label="SIM" active={completedRaces === true} onPress={() => setCompletedRaces(true)} />
                      <BoolBtn label="NÃO" active={completedRaces === false} onPress={() => setCompletedRaces(false)} />
                    </View>
                    {completedRaces && (
                      <>
                        <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 12 }]}>QUAL(IS)?</Text>
                        <TextInput style={[aStyles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 5k em 2023" placeholderTextColor={theme.textSecondary} value={racesDescription} onChangeText={setRacesDescription} outlineStyle="none" />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* ETAPA 2 */}
            {step === 2 && (
              <>
                <Text style={[aStyles.stepTitle, { color: theme.text }]}>💪 Condicionamento atual</Text>
                <Text style={[aStyles.label, { color: theme.textSecondary }]}>CONSEGUE CAMINHAR 30 MIN SEM DESCONFORTO? *</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <BoolBtn label="SIM" active={canWalk30min === true} onPress={() => setCanWalk30min(true)} />
                  <BoolBtn label="NÃO" active={canWalk30min === false} onPress={() => setCanWalk30min(false)} />
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>CONSEGUE TROTAR 5 MIN SEM PARAR? *</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <BoolBtn label="SIM" active={canJog5min === true} onPress={() => setCanJog5min(true)} />
                  <BoolBtn label="NÃO / NUNCA TENTEI" active={canJog5min === false} onPress={() => setCanJog5min(false)} />
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>QUANDO SENTE FALTA DE AR? *</Text>
                <View style={{ gap: 10 }}>
                  {[
                    { val: 'light', label: 'Em esforços leves', desc: 'Caminhada já cansa' },
                    { val: 'moderate', label: 'Em esforços moderados', desc: 'Trote já complica' },
                    { val: 'intense', label: 'Só em esforços intensos', desc: 'Consigo trotar bem' },
                    { val: 'never', label: 'Quase nunca', desc: 'Boa capacidade respiratória' },
                  ].map(opt => (
                    <TouchableOpacity key={opt.val} style={[aStyles.chipFull, { borderColor: breathingDifficulty === opt.val ? '#22c55e' : theme.border, backgroundColor: breathingDifficulty === opt.val ? '#22c55e22' : theme.bg }]} onPress={() => setBreathingDifficulty(opt.val)}>
                      <Text style={[aStyles.chipFullTitle, { color: breathingDifficulty === opt.val ? '#22c55e' : theme.text }]}>{opt.label}</Text>
                      <Text style={[aStyles.chipFullDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>CONDICIONAMENTO ATUAL (1 = FRACO · 5 = BOM) *</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[1,2,3,4,5].map(n => <Circle key={n} label={String(n)} active={fitnessLevel === n} onPress={() => setFitnessLevel(n)} />)}
                </View>
              </>
            )}

            {/* ETAPA 3 */}
            {step === 3 && (
              <>
                <Text style={[aStyles.stepTitle, { color: theme.text }]}>🏥 Saúde e lesões</Text>
                <Text style={[aStyles.label, { color: theme.textSecondary }]}>LESÕES OU DORES *</Text>
                <View style={aStyles.chipRow}>
                  {['Joelho', 'Tornozelo', 'Quadril', 'Lombar', 'Plantar/Pé', 'Canela', 'Nenhuma'].map(v => (
                    <Chip key={v} label={v} active={injuries.includes(v)} onPress={() => toggleInjury(v)} />
                  ))}
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>TEM CONDIÇÃO CARDÍACA DIAGNOSTICADA? *</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <BoolBtn label="SIM" active={heartCondition === true} onPress={() => setHeartCondition(true)} danger />
                  <BoolBtn label="NÃO" active={heartCondition === false} onPress={() => setHeartCondition(false)} />
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>PROBLEMA ARTICULAR ATIVO? *</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <BoolBtn label="SIM" active={jointIssues === true} onPress={() => setJointIssues(true)} danger />
                  <BoolBtn label="NÃO" active={jointIssues === false} onPress={() => setJointIssues(false)} />
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>MEDICAMENTO CONTÍNUO?</Text>
                <TextInput style={[aStyles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Deixe em branco se não usa" placeholderTextColor={theme.textSecondary} value={medications} onChangeText={setMedications} outlineStyle="none" />
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>LIBERAÇÃO MÉDICA? *</Text>
                <View style={{ gap: 10 }}>
                  {[{ val: 'yes', label: 'Sim, tenho liberação' }, { val: 'no', label: 'Não tenho liberação' }, { val: 'not_consulted', label: 'Não consultei médico recentemente' }].map(opt => (
                    <Chip key={opt.val} label={opt.label} active={medicalClearance === opt.val} onPress={() => setMedicalClearance(opt.val)} full />
                  ))}
                </View>
              </>
            )}

            {/* ETAPA 4 */}
            {step === 4 && (
              <>
                <Text style={[aStyles.stepTitle, { color: theme.text }]}>🎯 Objetivo e motivação</Text>
                <Text style={[aStyles.label, { color: theme.textSecondary }]}>OBJETIVO PRINCIPAL *</Text>
                <View style={{ gap: 10 }}>
                  {[
                    { val: 'complete_5k', label: 'Completar os 5km', desc: 'Quero cruzar a linha de chegada' },
                    { val: 'weight_loss', label: 'Emagrecer', desc: 'Usar a corrida para queimar gordura' },
                    { val: 'fitness', label: 'Condicionamento geral', desc: 'Melhorar saúde e disposição' },
                    { val: 'race', label: 'Preparar para uma prova', desc: 'Tenho uma corrida oficial em mente' },
                    { val: 'other', label: 'Outro objetivo', desc: 'Vou descrever abaixo' },
                  ].map(opt => (
                    <TouchableOpacity key={opt.val} style={[aStyles.chipFull, { borderColor: runningGoal === opt.val ? '#22c55e' : theme.border, backgroundColor: runningGoal === opt.val ? '#22c55e22' : theme.bg }]} onPress={() => setRunningGoal(opt.val)}>
                      <Text style={[aStyles.chipFullTitle, { color: runningGoal === opt.val ? '#22c55e' : theme.text }]}>{opt.label}</Text>
                      <Text style={[aStyles.chipFullDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>PRAZO PESSOAL?</Text>
                <View style={aStyles.chipRow}>
                  {['1 mês', '2 meses', '3 meses', '6 meses', 'Sem prazo'].map(v => (
                    <Chip key={v} label={v} active={goalDeadline === v} onPress={() => setGoalDeadline(v)} />
                  ))}
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>O QUE JÁ TENTOU E NÃO FUNCIONOU?</Text>
                <TextInput style={[aStyles.textarea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Opcional..." placeholderTextColor={theme.textSecondary} value={previousFailures} onChangeText={setPreviousFailures} multiline outlineStyle="none" />
              </>
            )}

            {/* ETAPA 5 */}
            {step === 5 && (
              <>
                <Text style={[aStyles.stepTitle, { color: theme.text }]}>📅 Rotina e disponibilidade</Text>
                <Text style={[aStyles.label, { color: theme.textSecondary }]}>DIAS DISPONÍVEIS (MÍNIMO 3) *</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map(v => (
                    <Circle key={v} label={v} active={availableDays.includes(v)} onPress={() => toggleDay(v)} size={48} />
                  ))}
                </View>
                {availableDays.length > 0 && availableDays.length < 3 && (
                  <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '700', marginTop: 8 }}>⚠️ Selecione pelo menos 3 dias.</Text>
                )}
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>HORÁRIO PREFERIDO *</Text>
                <View style={aStyles.chipRow}>
                  {[{ val: 'morning', label: '🌅 Manhã' }, { val: 'afternoon', label: '☀️ Tarde' }, { val: 'evening', label: '🌙 Noite' }].map(opt => (
                    <Chip key={opt.val} label={opt.label} active={preferredTime === opt.val} onPress={() => setPreferredTime(opt.val)} />
                  ))}
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>LOCAL DE TREINO *</Text>
                <View style={{ gap: 10 }}>
                  {[{ val: 'treadmill', label: '🏋️ Esteira', desc: 'Academia ou esteira em casa' }, { val: 'street', label: '🏙️ Rua / Pista', desc: 'Área aberta, parque ou calçada' }, { val: 'both', label: '🔄 Ambos', desc: 'Alternarei conforme o dia' }].map(opt => (
                    <TouchableOpacity key={opt.val} style={[aStyles.chipFull, { borderColor: trainingLocation === opt.val ? '#22c55e' : theme.border, backgroundColor: trainingLocation === opt.val ? '#22c55e22' : theme.bg }]} onPress={() => setTrainingLocation(opt.val)}>
                      <Text style={[aStyles.chipFullTitle, { color: trainingLocation === opt.val ? '#22c55e' : theme.text }]}>{opt.label}</Text>
                      <Text style={[aStyles.chipFullDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary, marginTop: 16 }]}>TEM TÊNIS ADEQUADO? *</Text>
                <View style={{ gap: 10 }}>
                  {[{ val: 'yes', label: '✅ Sim, tenho tênis de corrida' }, { val: 'no', label: '❌ Não, uso tênis comum' }, { val: 'not_sure', label: '🤔 Não sei se é adequado' }].map(opt => (
                    <Chip key={opt.val} label={opt.label} active={hasProperShoes === opt.val} onPress={() => setHasProperShoes(opt.val)} full />
                  ))}
                </View>
              </>
            )}

            {/* ETAPA 6 */}
            {step === 6 && (
              <>
                <Text style={[aStyles.stepTitle, { color: theme.text }]}>📊 Informações físicas</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[aStyles.label, { color: theme.textSecondary }]}>PESO (KG)</Text>
                    <TextInput style={[aStyles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 68.5" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" value={weight} onChangeText={setWeight} outlineStyle="none" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[aStyles.label, { color: theme.textSecondary }]}>ALTURA (CM)</Text>
                    <TextInput style={[aStyles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 165" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" value={height} onChangeText={setHeight} outlineStyle="none" />
                  </View>
                </View>
                <Text style={[aStyles.label, { color: theme.textSecondary }]}>DORES AO CAMINHAR OU CORRER?</Text>
                <TextInput style={[aStyles.textarea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Onde e quando aparece a dor. Deixe em branco se não." placeholderTextColor={theme.textSecondary} multiline value={bodyPainDuringWalk} onChangeText={setBodyPainDuringWalk} outlineStyle="none" />
                <Text style={[aStyles.label, { color: theme.textSecondary }]}>QUALIDADE DO SONO *</Text>
                <View style={{ gap: 10 }}>
                  {[{ val: 'good', label: '😴 Boa', desc: 'Durmo bem, acordo descansado(a)' }, { val: 'regular', label: '😐 Regular', desc: 'Às vezes durmo mal' }, { val: 'bad', label: '😩 Ruim', desc: 'Tenho dificuldade para dormir' }].map(opt => (
                    <TouchableOpacity key={opt.val} style={[aStyles.chipFull, { borderColor: sleepQuality === opt.val ? '#22c55e' : theme.border, backgroundColor: sleepQuality === opt.val ? '#22c55e22' : theme.bg }]} onPress={() => setSleepQuality(opt.val)}>
                      <Text style={[aStyles.chipFullTitle, { color: sleepQuality === opt.val ? '#22c55e' : theme.text }]}>{opt.label}</Text>
                      <Text style={[aStyles.chipFullDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={[aStyles.confirmCard, { backgroundColor: '#22c55e0d', borderColor: '#22c55e44' }]}>
                  <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>✅ TUDO CERTO!</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>
                    Ao enviar, o Coach Paulo receberá suas informações e montará o protocolo personalizado para você.
                  </Text>
                </View>
              </>
            )}

            {/* Navegação */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
              {step > 1 && (
                <TouchableOpacity style={[aStyles.btnBack, { borderColor: theme.border }]} onPress={() => setStep(s => s - 1)}>
                  <Text style={[aStyles.btnBackText, { color: theme.textSecondary }]}>← VOLTAR</Text>
                </TouchableOpacity>
              )}
              {step < TOTAL ? (
                <TouchableOpacity
                  style={[aStyles.btnNext, { flex: 2, backgroundColor: canAdvance() ? '#22c55e' : theme.border }]}
                  onPress={() => { if (canAdvance()) setStep(s => s + 1); }}
                  disabled={!canAdvance()}
                >
                  <Text style={[aStyles.btnNextText, { color: canAdvance() ? '#000' : theme.textSecondary }]}>PRÓXIMO →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[aStyles.btnNext, { flex: 2, backgroundColor: canAdvance() && !submitting ? '#22c55e' : theme.border, opacity: submitting ? 0.7 : 1 }]}
                  onPress={() => { if (canAdvance() && !submitting) handleSubmit(); }}
                  disabled={!canAdvance() || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={[aStyles.btnNextText, { color: canAdvance() ? '#000' : theme.textSecondary }]}>ENVIAR ANAMNESE 🏃</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const aStyles = StyleSheet.create({
  progressBg: { height: 4, marginHorizontal: 0 },
  progressFill: { height: '100%', backgroundColor: '#22c55e' },
  stepTitle: { fontSize: 16, fontWeight: '900', marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  chipText: { fontWeight: '700', fontSize: 13 },
  chipFull: { padding: 14, borderRadius: 16, borderWidth: 1 },
  chipFullTitle: { fontSize: 14, fontWeight: '900' },
  chipFullDesc: { fontSize: 12, marginTop: 2 },
  boolBtn: { padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  boolBtnText: { fontWeight: '900', fontSize: 13 },
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  circleText: { fontWeight: '900', fontSize: 12 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 15, fontWeight: '600', marginBottom: 4, outlineStyle: 'none' },
  textarea: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 14, minHeight: 80, textAlignVertical: 'top', lineHeight: 22, marginBottom: 4, outlineStyle: 'none' },
  btnBack: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  btnBackText: { fontWeight: '900', fontSize: 13 },
  btnNext: { padding: 16, borderRadius: 16, alignItems: 'center' },
  btnNextText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  confirmCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 20 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { height: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});