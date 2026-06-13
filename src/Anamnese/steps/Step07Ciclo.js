// src/screens/Anamnese/steps/Step07Ciclo.js
import React from 'react';
import { View } from 'react-native';
import { Q, Label, Chip, ChipSingle, FreeText, ChipWrap } from '../components/AnamnesePrimitives';

const CYCLE_OPTS = [
  { v:'regular',   l:'✅ Regular (28-32 dias)' },
  { v:'irregular', l:'⚠️ Irregular' },
  { v:'menopause', l:'🔄 Menopausa / Pós-menopausa' },
  { v:'hormonal',  l:'💊 Uso anticoncepcional hormonal' },
];
const PMS_LIST = ['Compulsão Alimentar Forte','Vontade de Doce','Inchaço / Retenção','Irritabilidade','Cólica Intensa','Fadiga Extrema','Sem Sintomas Significativos'];

export default function Step07Ciclo({ form, setField, toggleMulti, theme }) {
  return (
    <View>
      <Q theme={theme}>Ciclo Menstrual</Q>
      <Label mt={0} theme={theme}>SEU CICLO É REGULAR?</Label>
      <ChipWrap>
        {CYCLE_OPTS.map(({ v, l }) => (
          <ChipSingle key={v} val={v} label={l} field="cycleRegular" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>

      <Label theme={theme}>SINTOMAS DE TPM QUE VOCÊ SENTE</Label>
      <ChipWrap>
        {PMS_LIST.map(i => (
          <Chip key={i} val={i} label={i} field="pmsSymptoms" noneVals={['Sem Sintomas Significativos']} form={form} toggleMulti={toggleMulti} theme={theme} />
        ))}
      </ChipWrap>
      <FreeText field="pmsObs" placeholder="Observações adicionais (opcional)..." multiline form={form} setField={setField} theme={theme} />
    </View>
  );
}