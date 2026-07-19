// src/screens/AnamneseScreen.js
import React, { useState } from 'react';
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

import useAnamneseForm   from '../Anamnese/useAnamneseForm';
import AnamneseLayout    from '../Anamnese/components/AnamneseLayout';
import TimePicker        from '../Anamnese/components/TimePicker';

// Passos Legados (PA ELITE TEAM)
import Step01Medidas      from '../Anamnese/steps/Step01Medidas';
import Step02Objetivo     from '../Anamnese/steps/Step02Objetivo';
import Step03Limitacoes   from '../Anamnese/steps/Step03Limitacoes';
import Step04Treino       from '../Anamnese/steps/Step04Treino';
import Step05Saude        from '../Anamnese/steps/Step05Saude';
import Step06Sono         from '../Anamnese/steps/Step06Sono';
import Step07Ciclo        from '../Anamnese/steps/Step07Ciclo';
import Step08Rotina       from '../Anamnese/steps/Step08Rotina';
import Step09Habitos      from '../Anamnese/steps/Step09Habitos';
import Step10Dietas       from '../Anamnese/steps/Step10Dietas';
import Step11Preferencias from '../Anamnese/steps/Step11Preferencias';

export default function AnamneseScreen({ route, navigation }) {
  const { theme } = useTheme();

  const f = useAnamneseForm({ routeParams: route.params, navigation });
  const [step, setStep] = useState(1);

  const canGoBack = navigation.canGoBack();

  const handleClose = () => {
    if (canGoBack) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleNext = () => {
    if (!f.validateStep(step)) return;
    if (step < f.totalSteps) setStep(s => s + 1);
    else f.salvar();
  };

  const handleBack = () => setStep(s => s - 1);

  const actualStep = f.getActualStep(step);

  const props = {
    form: f.form,
    setField: f.setField,
    toggleMulti: f.toggleMulti,
    openTimePicker: f.openTimePicker,
    hasDiet: f.hasDiet,
    isFeminino: f.isFeminino,
    theme,
  };

  // 🔥 RENDERIZADOR DINÂMICO SAAS 🔥
  const renderDynamicStep = () => {
    const stepData = f.dynamicSchema.steps[step - 1];
    if (!stepData) return null;

    return (
      <View style={{ gap: 24 }}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>{stepData.title}</Text>
        {stepData.description && (
            <Text style={{ color: theme.textSecondary, marginBottom: 10 }}>{stepData.description}</Text>
        )}
        
        {stepData.questions.map(q => {
          const val = f.form[q.id];

          return (
            <View key={q.id}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {q.label || q.question} {q.required ? '*' : ''}
              </Text>

              {/* TIPO: TEXTO CURTO */}
              {q.type === 'TEXT' && (
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder={q.placeholder || 'Sua resposta...'}
                  placeholderTextColor={theme.textSecondary}
                  value={val || ''}
                  onChangeText={text => f.setField(q.id, text)}
                />
              )}

              {/* TIPO: TEXTO LONGO */}
              {q.type === 'TEXTAREA' && (
                <TextInput
                  style={[styles.textarea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder={q.placeholder || 'Sua resposta detalhada...'}
                  placeholderTextColor={theme.textSecondary}
                  value={val || ''}
                  onChangeText={text => f.setField(q.id, text)}
                  multiline
                />
              )}

              {/* TIPO: ESCOLHA ÚNICA (SELECT) */}
              {q.type === 'SELECT' && (
                <View style={styles.chipRow}>
                  {q.options?.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, { 
                        borderColor: val === opt ? '#22c55e' : theme.border, 
                        backgroundColor: val === opt ? '#22c55e22' : theme.surface 
                      }]}
                      onPress={() => f.setField(q.id, opt)}
                    >
                      <Text style={{ color: val === opt ? '#22c55e' : theme.text, fontWeight: '700', fontSize: 13 }}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* TIPO: ESCOLHA MÚLTIPLA (MULTI_SELECT) */}
              {q.type === 'MULTI_SELECT' && (
                <View style={styles.chipRow}>
                  {q.options?.map(opt => {
                    const isSelected = Array.isArray(val) && val.includes(opt);
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.chip, { 
                          borderColor: isSelected ? '#22c55e' : theme.border, 
                          backgroundColor: isSelected ? '#22c55e22' : theme.surface 
                        }]}
                        onPress={() => f.toggleMulti(q.id, opt, q.noneValues || ['Nenhuma', 'Nenhum'])}
                      >
                        <Text style={{ color: isSelected ? '#22c55e' : theme.text, fontWeight: '700', fontSize: 13 }}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* TIPO: BOOLEANO (SIM / NÃO) */}
              {q.type === 'BOOLEAN' && (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.boolBtn, { borderColor: val === 'yes' ? '#22c55e' : theme.border, backgroundColor: val === 'yes' ? '#22c55e22' : theme.surface }]}
                    onPress={() => f.setField(q.id, 'yes')}
                  >
                    <Text style={{ color: val === 'yes' ? '#22c55e' : theme.textSecondary, fontWeight: '900' }}>SIM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.boolBtn, { borderColor: val === 'no' ? '#ef4444' : theme.border, backgroundColor: val === 'no' ? '#ef444422' : theme.surface }]}
                    onPress={() => f.setField(q.id, 'no')}
                  >
                    <Text style={{ color: val === 'no' ? '#ef4444' : theme.textSecondary, fontWeight: '900' }}>NÃO</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderStep = () => {
    // Se o Hook detectou um formulário dinâmico, roda o novo renderizador
    if (f.dynamicSchema) {
      return renderDynamicStep();
    }

    // Se não tiver, cai pro fluxo legado de 11 passos fixos do PA ELITE TEAM
    switch (actualStep) {
      case 1:  return <Step01Medidas      {...props} />;
      case 2:  return <Step02Objetivo     {...props} />;
      case 3:  return <Step03Limitacoes   {...props} />;
      case 4:  return <Step04Treino       {...props} />;
      case 5:  return <Step05Saude        {...props} />;
      case 6:  return <Step06Sono         {...props} />;
      case 7:  return <Step07Ciclo        {...props} />;
      case 8:  return <Step08Rotina       {...props} />;
      case 9:  return <Step09Habitos      {...props} />;
      case 10: return <Step10Dietas       {...props} />;
      case 11: return <Step11Preferencias {...props} />;
      default: return null;
    }
  };

  if (f.loadingInitialData) return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: theme.bg }}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );

  return (
    <>
      <AnamneseLayout
        theme={theme}
        step={step}
        totalSteps={f.totalSteps}
        onBack={handleBack}
        onNext={handleNext}
        onClose={step === 1 ? handleClose : null}
        nextLabel={step < f.totalSteps ? 'PRÓXIMO' : f.loading ? '...' : 'FINALIZAR 🚀'}
        nextDisabled={f.loading}
      >
        {renderStep()}
      </AnamneseLayout>

      <TimePicker
        timeModal={f.timeModal}
        onSelectHour={f.handleSelectHour}
        onSelectMinute={f.handleSelectMinute}
        onClose={f.closeTimePicker}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stepTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  input: { padding: 16, borderRadius: 14, borderWidth: 1, fontSize: 15, fontWeight: '600', outlineStyle: 'none' },
  textarea: { padding: 16, borderRadius: 14, borderWidth: 1, fontSize: 15, minHeight: 100, textAlignVertical: 'top', outlineStyle: 'none' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  boolBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' }
});