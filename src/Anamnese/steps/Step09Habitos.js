// src/screens/Anamnese/steps/Step09Habitos.js
import React from 'react';
import { View } from 'react-native';
import { Label, ChipSingle, BoolPair, ChipWrap } from '../components/AnamnesePrimitives';

const WATER_LIST   = ['Menos de 1L','1 a 1,5L','1,5 a 2L','2 a 2,5L','Mais de 2,5L'];
const ALCOHOL_LIST = ['Nunca','Raramente (ocasional)','1 a 2x por semana','Frequente (3x+)'];
const COFFEE_LIST  = ['Nenhum','1 a 2 cafés','3 a 4 cafés','5 ou mais'];
const EAT_SPD_LIST = ['Muito Rápido','Rápido','Normal','Devagar','Muito Devagar'];
const BINGE_LIST   = [
  { v:'never',     l:'🟢 Nunca' },
  { v:'rarely',    l:'🟡 Raramente' },
  { v:'sometimes', l:'🟠 Às vezes' },
  { v:'often',     l:'🔴 Com frequência' },
];

export default function Step09Habitos({ form, setField, theme }) {
  return (
    <View>
      <Label mt={0} theme={theme}>ÁGUA POR DIA</Label>
      <ChipWrap>
        {WATER_LIST.map(i => <ChipSingle key={i} val={i} label={i} field="waterIntake" form={form} setField={setField} theme={theme} />)}
      </ChipWrap>

      <Label theme={theme}>CONSUMO DE ÁLCOOL</Label>
      <ChipWrap>
        {ALCOHOL_LIST.map(i => <ChipSingle key={i} val={i} label={i} field="alcoholFreq" form={form} setField={setField} theme={theme} />)}
      </ChipWrap>

      <Label theme={theme}>CAFÉS POR DIA</Label>
      <ChipWrap>
        {COFFEE_LIST.map(i => <ChipSingle key={i} val={i} label={i} field="coffeePerDay" form={form} setField={setField} theme={theme} />)}
      </ChipWrap>

      <Label theme={theme}>FUMANTE?</Label>
      <BoolPair field="smoker" form={form} setField={setField} theme={theme} />

      <Label theme={theme}>VELOCIDADE AO COMER</Label>
      <ChipWrap>
        {EAT_SPD_LIST.map(i => <ChipSingle key={i} val={i} label={i} field="eatSpeed" form={form} setField={setField} theme={theme} />)}
      </ChipWrap>

      <Label theme={theme}>TEM COMPULSÃO ALIMENTAR NOTURNA?</Label>
      <ChipWrap>
        {BINGE_LIST.map(({ v, l }) => <ChipSingle key={v} val={v} label={l} field="nightBinge" form={form} setField={setField} theme={theme} />)}
      </ChipWrap>
    </View>
  );
}