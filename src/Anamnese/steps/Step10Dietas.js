// src/screens/Anamnese/steps/Step10Dietas.js
import React from 'react';
import { View } from 'react-native';
import { Q, Label, Chip, ChipSingle, FreeText, ChipWrap } from '../components/AnamnesePrimitives';

const TRIED_LIST     = ['Low Carb','Cetogênica / Keto','Jejum Intermitente','Dieta do Índice Glicêmico','Vegana / Vegetariana','Dieta dos Pontos','Dieta Detox','Nenhuma'];
const CHALLENGE_LIST = ['Ansiedade / Fome Constante','Falta de Tempo para Preparar','Comer Fora de Casa','Consistência e Disciplina','Custo dos Alimentos','Falta de Variedade','Comer na Empresa / Restaurante','Família não Apoia','Outro'];

export default function Step10Dietas({ form, setField, toggleMulti, theme }) {
  return (
    <View>
      <Q theme={theme}>Histórico de Dietas</Q>
      <Label mt={0} theme={theme}>JÁ TENTOU ALGUMA DESSAS DIETAS?</Label>
      <ChipWrap>
        {TRIED_LIST.map(i => (
          <Chip key={i} val={i} label={i} field="triedDiets" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
        ))}
      </ChipWrap>

      <Label theme={theme}>O QUE JÁ FUNCIONOU PARA VOCÊ?</Label>
      <FreeText field="dietWorked" placeholder="Ex: jejum intermitente me ajudou a controlar a fome..." multiline hint="Deixe em branco se nunca fez dieta." form={form} setField={setField} theme={theme} />

      <Label theme={theme}>O QUE VOCÊ ODEIA OU NÃO CONSEGUE SEGUIR?</Label>
      <FreeText field="dietHated" placeholder="Ex: não consigo ficar sem carboidrato à noite..." multiline form={form} setField={setField} theme={theme} />

      <Label theme={theme}>SEU MAIOR DESAFIO NA DIETA *</Label>
      <ChipWrap>
        {CHALLENGE_LIST.map(i => (
          <ChipSingle key={i} val={i} label={i} field="biggestChallenge" form={form} setField={setField} theme={theme} />
        ))}
      </ChipWrap>
    </View>
  );
}