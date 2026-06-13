// src/screens/Anamnese/steps/Step08Rotina.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Q, Label, ChipSingle, TimeBtn, Option, ChipWrap } from '../components/AnamnesePrimitives';

const EATS_OUT_LIST = ['Nunca / Raramente','1 a 2x','3 a 4x','Quase sempre'];
const BUDGET_LIST   = [
  { v:'econômico',     l:'💰 Econômico',     d:'Frango, ovos, atum, batata doce, aveia' },
  { v:'moderado',      l:'💳 Moderado',      d:'Inclui whey, iogurte grego, salmão ocasional' },
  { v:'sem restrição', l:'💎 Sem restrição', d:'Qualquer alimento, suplementos premium' },
];

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Nenhum'];

export default function Step08Rotina({ form, setField, toggleMulti, openTimePicker, theme }) {
  // Garante que seja um array para evitar erros no map
  const activeFreeDays = Array.isArray(form.freeDays) ? form.freeDays : [];

  return (
    <View>
      <Q theme={theme}>Rotina Alimentar</Q>
      <Label mt={0} theme={theme}>REFEIÇÕES PREFERIDAS POR DIA *</Label>
      <ChipWrap>
        {[2,3,4,5,6,7,8].map(d => (
          <ChipSingle key={d} val={String(d)} label={`${d}x`} field="mealsPerDay" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>

      <Q mt={28} theme={theme}>Dias de Rotina Padrão (Trabalho/Estudo)</Q>
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

      <Q mt={28} theme={theme}>Dias Livres ou Folgas (Finais de semana / Escala)</Q>
      <Label mt={8} theme={theme}>QUAIS DIAS VOCÊ NORMALMENTE TEM FOLGA? *</Label>
      <ChipWrap>
        {DAYS_OF_WEEK.map(day => {
          const isActive = activeFreeDays.includes(day);
          return (
            <TouchableOpacity
              key={day}
              onPress={() => toggleMulti('freeDays', day, ['Nenhum'])}
              style={{
                paddingVertical: 10, paddingHorizontal: 16,
                borderRadius: 20, borderWidth: 1,
                backgroundColor: isActive ? theme.accent : theme.bg,
                borderColor: isActive ? theme.accent : theme.border,
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '700',
                color: isActive ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary
              }}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ChipWrap>

      {/* Só mostra os horários de folga se o aluno escolheu algum dia que não seja 'Nenhum' */}
      {activeFreeDays.length > 0 && !activeFreeDays.includes('Nenhum') && (
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection:'row', gap:12 }}>
            <View style={{ flex:1 }}>
              <Label mt={0} theme={theme}>ACORDA ÀS (Folga) *</Label>
              <TimeBtn field="freeWakeUpTime" label="Selecionar" form={form} openTimePicker={openTimePicker} theme={theme} />
            </View>
            <View style={{ flex:1 }}>
              <Label mt={0} theme={theme}>DORME ÀS (Folga) *</Label>
              <TimeBtn field="freeSleepTime" label="Selecionar" form={form} openTimePicker={openTimePicker} theme={theme} />
            </View>
          </View>
          <Label theme={theme}>TREINO / CARDIO ÀS (Na Folga) *</Label>
          <TimeBtn field="freeTrainTime" label="Selecionar" form={form} openTimePicker={openTimePicker} theme={theme} />
        </View>
      )}

      <Q mt={28} theme={theme}>Contexto de Refeições</Q>
      <Label mt={8} theme={theme}>QUANTAS VEZES COME FORA POR SEMANA? *</Label>
      <ChipWrap>
        {EATS_OUT_LIST.map(i => (
          <ChipSingle key={i} val={i} label={i} field="eatsOutPerWeek" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>
      <Label theme={theme}>ORÇAMENTO PARA ALIMENTAÇÃO *</Label>
      {BUDGET_LIST.map(({ v, l, d }) => (
        <Option key={v} val={v} label={l} desc={d} field="budget" form={form} setField={setField} theme={theme} />
      ))}
    </View>
  );
}