// src/screens/Anamnese/steps/Step04Treino.js
import React from 'react';
import { View } from 'react-native';
import { Q, ChipSingle, BoolPair, ChipWrap } from '../components/AnamnesePrimitives';

export default function Step04Treino({ form, setField, hasDiet, theme }) {
  return (
    <View>
      <Q theme={theme}>Frequência de Treino</Q>
      <ChipWrap>
        {[1,2,3,4,5,6,7].map(d => (
          <ChipSingle key={d} val={String(d)} label={`${d}x`} field="frequencia" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>

      <Q mt={30} theme={theme}>Tempo Disponível por Sessão</Q>
      <ChipWrap>
        {['30','45','60','90','120'].map(t => (
          <ChipSingle key={t} val={t} label={`${t} min`} field="tempoDisponivel" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>

      {hasDiet && <>
        <Q mt={30} theme={theme}>Você treina em JEJUM?</Q>
        <BoolPair field="trainFasted" labelYes="✅ Sim, em jejum" labelNo="🍳 Não, me alimento antes" form={form} setField={setField} theme={theme} />
      </>}
    </View>
  );
}