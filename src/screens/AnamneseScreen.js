// src/screens/AnamneseScreen.js
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

import useAnamneseForm   from '../Anamnese/useAnamneseForm';
import AnamneseLayout    from '../Anamnese/components/AnamneseLayout';
import TimePicker        from '../Anamnese/components/TimePicker';

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

  const renderStep = () => {
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

  // 🔥 MÁGICA: Removido o '|| !f.form' que travava a tela se o export falhasse
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