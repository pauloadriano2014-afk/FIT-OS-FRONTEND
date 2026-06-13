// src/screens/Anamnese/steps/Step02Objetivo.js
import React from 'react';
import { View } from 'react-native';
import { Q, Option, ChipSingle, ChipWrap } from '../components/AnamnesePrimitives';
import { OBJETIVOS, NIVEIS } from '../constants';

export default function Step02Objetivo({ form, setField, theme }) {
  return (
    <View>
      <Q theme={theme}>Objetivo Principal</Q>
      {OBJETIVOS.map(obj => (
        <Option key={obj} val={obj} label={obj} field="objetivo" form={form} setField={setField} theme={theme} />
      ))}
      <Q mt={30} theme={theme}>Nível de Experiência</Q>
      <ChipWrap>
        {NIVEIS.map(n => (
          <ChipSingle key={n} val={n} label={n} field="nivel" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>
    </View>
  );
}