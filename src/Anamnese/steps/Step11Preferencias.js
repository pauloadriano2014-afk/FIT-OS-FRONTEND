// src/screens/Anamnese/steps/Step11Preferencias.js
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Q, Label, Chip, FreeText, ChipWrap } from '../components/AnamnesePrimitives';
import { SUPLEMENTOS_LIST } from '../constants';

export default function Step11Preferencias({ form, setField, toggleMulti, theme }) {
  return (
    <View>
      <Q theme={theme}>Preferências e Restrições</Q>

      <Label mt={0} theme={theme}>ALERGIAS OU INTOLERÂNCIAS *</Label>
      <FreeText field="allergies" placeholder="Ex: Intolerância à lactose, alergia a amendoim..." multiline hint="* Se não houver, escreva 'Nenhuma'." form={form} setField={setField} theme={theme} />

      <Label theme={theme}>O QUE VOCÊ ODEIA COMER? *</Label>
      <FreeText field="foodAversions" placeholder="Ex: Fígado, batata doce, brócolis..." multiline hint="* Se comer de tudo, escreva 'Nada'." form={form} setField={setField} theme={theme} />

      <Label theme={theme}>PREFERÊNCIAS ALIMENTARES *</Label>
      <FreeText field="foodPreferences" placeholder="Ex: Amo frango com batata doce, adoro omelete..." multiline hint="* O que não pode faltar na dieta." form={form} setField={setField} theme={theme} />

      <Label theme={theme}>SUPLEMENTOS QUE JÁ UTILIZA *</Label>
      <ChipWrap>
        {SUPLEMENTOS_LIST.map(i => (
          <Chip key={i} val={i} label={i} field="supplements" noneVals={['Nenhum']} form={form} toggleMulti={toggleMulti} theme={theme} />
        ))}
      </ChipWrap>

      <Label theme={theme}>OBSERVAÇÕES FINAIS PARA O COACH</Label>
      <FreeText field="extraNotes" placeholder="Qualquer informação importante..." multiline hint="Opcional." form={form} setField={setField} theme={theme} />

      <View style={[confirmCard, { backgroundColor: theme.accent + '12', borderColor: theme.accent + '40' }]}>
        <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />
        <Text style={{ flex:1, fontSize:13, lineHeight:20, color: theme.textSecondary }}>
          Ao finalizar, o Coach receberá todas as informações e montará sua estratégia personalizada.
        </Text>
      </View>
    </View>
  );
}

const confirmCard = {
  flexDirection:'row', alignItems:'flex-start', gap:12,
  padding:16, borderRadius:16, borderWidth:1, marginTop:24,
};