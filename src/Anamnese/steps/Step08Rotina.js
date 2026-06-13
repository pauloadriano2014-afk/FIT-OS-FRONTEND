// src/screens/Anamnese/steps/Step08Rotina.js
import React from 'react';
import { View } from 'react-native';
import { Q, Label, ChipSingle, TimeBtn, Option, ChipWrap } from '../components/AnamnesePrimitives';

const EATS_OUT_LIST = ['Nunca / Raramente','1 a 2x','3 a 4x','Quase sempre'];
const BUDGET_LIST   = [
  { v:'econômico',     l:'💰 Econômico',     d:'Frango, ovos, atum, batata doce, aveia' },
  { v:'moderado',      l:'💳 Moderado',      d:'Inclui whey, iogurte grego, salmão ocasional' },
  { v:'sem restrição', l:'💎 Sem restrição', d:'Qualquer alimento, suplementos premium' },
];

export default function Step08Rotina({ form, setField, openTimePicker, theme }) {
  return (
    <View>
      <Q theme={theme}>Rotina Alimentar</Q>
      <Label mt={0} theme={theme}>REFEIÇÕES PREFERIDAS POR DIA</Label>
      <ChipWrap>
        {[2,3,4,5,6,7,8].map(d => (
          <ChipSingle key={d} val={String(d)} label={`${d}x`} field="mealsPerDay" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>

      <Q mt={28} theme={theme}>Horários da Rotina</Q>
      <View style={{ flexDirection:'row', gap:12 }}>
        <View style={{ flex:1 }}>
          <Label mt={0} theme={theme}>ACORDA ÀS *</Label>
          <TimeBtn field="wakeUpTime" label="Selecionar" form={form} openTimePicker={openTimePicker} theme={theme} />
        </View>
        <View style={{ flex:1 }}>
          <Label mt={0} theme={theme}>DORME ÀS *</Label>
          <TimeBtn field="sleepTime" label="Selecionar" form={form} openTimePicker={openTimePicker} theme={theme} />
        </View>
      </View>
      <Label theme={theme}>HORÁRIO DE TRABALHO (opcional)</Label>
      <View style={{ flexDirection:'row', gap:12 }}>
        <View style={{ flex:1 }}>
          <TimeBtn field="workTimeStart" label="Início" form={form} openTimePicker={openTimePicker} theme={theme} />
        </View>
        <View style={{ flex:1 }}>
          <TimeBtn field="workTimeEnd" label="Fim" form={form} openTimePicker={openTimePicker} theme={theme} />
        </View>
      </View>
      <Label theme={theme}>TREINO ÀS *</Label>
      <TimeBtn field="trainTime" label="Selecionar" form={form} openTimePicker={openTimePicker} theme={theme} />

      <Q mt={28} theme={theme}>Contexto de Refeições</Q>
      <Label mt={8} theme={theme}>QUANTAS VEZES COME FORA POR SEMANA?</Label>
      <ChipWrap>
        {EATS_OUT_LIST.map(i => (
          <ChipSingle key={i} val={i} label={i} field="eatsOutPerWeek" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>
      <Label theme={theme}>ORÇAMENTO PARA ALIMENTAÇÃO</Label>
      {BUDGET_LIST.map(({ v, l, d }) => (
        <Option key={v} val={v} label={l} desc={d} field="budget" form={form} setField={setField} theme={theme} />
      ))}
    </View>
  );
}