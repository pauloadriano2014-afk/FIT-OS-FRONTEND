// src/screens/Anamnese/steps/Step03Limitacoes.js
import React from 'react';
import { View } from 'react-native';
import { Q, Chip, ChipWrap } from '../components/AnamnesePrimitives';
import { LIMITACOES_LIST, CIRURGIAS_LIST, EQUIPAMENTOS_LIST } from '../constants';

export default function Step03Limitacoes({ form, toggleMulti, theme }) {
  return (
    <View>
      <Q theme={theme}>Mapeamento de Dores</Q>
      <ChipWrap>
        {LIMITACOES_LIST.map(i => (
          <Chip key={i} val={i} label={i} field="limitacoes" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
        ))}
      </ChipWrap>

      <Q mt={30} theme={theme}>Cirurgias Prévias</Q>
      <ChipWrap>
        {CIRURGIAS_LIST.map(i => (
          <Chip key={i} val={i} label={i} field="cirurgias" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
        ))}
      </ChipWrap>

      <Q mt={30} theme={theme}>Local de Treino / Equipamentos *</Q>
      <ChipWrap>
        {EQUIPAMENTOS_LIST.map(i => (
          <Chip key={i} val={i} label={i} field="equipamentos" noneVals={[]} form={form} toggleMulti={toggleMulti} theme={theme} />
        ))}
      </ChipWrap>
    </View>
  );
}