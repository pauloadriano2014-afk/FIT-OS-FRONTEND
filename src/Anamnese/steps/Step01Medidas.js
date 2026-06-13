// src/screens/Anamnese/steps/Step01Medidas.js
import React from 'react';
import { View } from 'react-native';
import { Q, Label, FreeText } from '../components/AnamnesePrimitives';

export default function Step01Medidas({ form, setField, theme }) {
  return (
    <View>
      <Q theme={theme}>Suas Medidas</Q>
      <View style={{ flexDirection:'row', gap:12 }}>
        <View style={{ flex:1 }}>
          <Label mt={0} theme={theme}>PESO (KG) *</Label>
          <FreeText field="peso" placeholder="Ex: 72.5" keyboardType="decimal-pad" form={form} setField={setField} theme={theme} />
        </View>
        <View style={{ flex:1 }}>
          <Label mt={0} theme={theme}>ALTURA (CM) *</Label>
          <FreeText field="altura" placeholder="Ex: 168" keyboardType="decimal-pad" form={form} setField={setField} theme={theme} />
        </View>
      </View>
    </View>
  );
}