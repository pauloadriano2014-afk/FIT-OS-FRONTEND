// src/screens/Anamnese/steps/Step06Sono.js
import React from 'react';
import { View, Text } from 'react-native';
import { Q, Label, Chip, ChipSingle, BoolPair, FreeText, ScaleRow, ChipWrap, p } from '../components/AnamnesePrimitives';

const DIGEST_LIST  = ['Gastrite','Refluxo / DRGE','Intestino Preso','Intestino Solto / SII','Doença de Crohn / Colite','Intolerância à Lactose','Intolerância ao Glúten','Nenhum'];
const SLEEP_H_LIST = ['Menos de 5h','5 a 6h','6 a 7h','7 a 8h','Mais de 8h'];
const SLEEP_Q_LIST = ['Ótimo','Bom','Regular','Ruim','Péssimo'];

export default function Step06Sono({ form, setField, toggleMulti, theme }) {
  return (
    <View>
      <Q theme={theme}>Saúde Digestiva</Q>
      <ChipWrap>
        {DIGEST_LIST.map(i => (
          <Chip key={i} val={i} label={i} field="digestiveIssues" noneVals={['Nenhum']} form={form} toggleMulti={toggleMulti} theme={theme} />
        ))}
      </ChipWrap>
      <FreeText field="digestiveObs" placeholder="Detalhes (opcional)..." form={form} setField={setField} theme={theme} />

      <Q mt={28} theme={theme}>Qualidade do Sono</Q>
      <Label mt={8} theme={theme}>HORAS DE SONO POR NOITE</Label>
      <ChipWrap>
        {SLEEP_H_LIST.map(i => (
          <ChipSingle key={i} val={i} label={i} field="sleepHours" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>
      <Label theme={theme}>COMO AVALIA SEU SONO?</Label>
      <ChipWrap>
        {SLEEP_Q_LIST.map(i => (
          <ChipSingle key={i} val={i} label={i} field="sleepQuality" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>
      <Label theme={theme}>ACORDA COM FOME DURANTE A NOITE?</Label>
      <BoolPair field="wakeHungry" form={form} setField={setField} theme={theme} />

      <Q mt={28} theme={theme}>Nível de Stress no Dia a Dia</Q>
      <Text style={[p.hint, { color: theme.textSecondary, marginBottom:8 }]}>1 = Muito tranquilo · 5 = Extremamente estressado</Text>
      <ScaleRow field="stressLevel" form={form} setField={setField} theme={theme} />
      <Label theme={theme}>COME MAIS QUANDO ESTÁ ESTRESSADO(A)?</Label>
      <BoolPair field="stressEating" form={form} setField={setField} theme={theme} />
    </View>
  );
}