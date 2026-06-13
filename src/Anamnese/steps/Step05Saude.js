// src/screens/Anamnese/steps/Step05Saude.js
import React from 'react';
import { View, Text } from 'react-native';
import { Q, Label, Chip, ChipSingle, BoolPair, FreeText, ChipWrap, p } from '../components/AnamnesePrimitives';

const HEALTH_COND   = ['Diabetes Tipo 1','Diabetes Tipo 2','Pré-diabetes','Hipotireoidismo','Hipertireoidismo','Hipertensão','SOP','Resistência à Insulina','Nenhuma'];
const BARI_TYPES    = ['Sleeve (Gastrectomia)','Bypass Gástrico (Roux-en-Y)','Banda Gástrica','Balão Intragástrico','Outro'];
const BARI_TIMES    = ['Menos de 6 meses','6 meses a 1 ano','1 a 2 anos','2 a 3 anos','Mais de 3 anos'];
const BARI_INT      = ['Açúcar / Síndrome de Dumping','Gordura','Lactose','Glúten','Carne Vermelha','Alimentos Fibrosos','Nenhuma'];
const MEDS_LIST     = ['Metformina','Levotiroxina','Anticoncepcional','Anti-hipertensivo','Antidepressivo','Corticoide','Nenhum'];

export default function Step05Saude({ form, setField, toggleMulti, theme }) {
  return (
    <View>
      <Q theme={theme}>Condições de Saúde</Q>
      <Text style={[p.hint, { color: theme.textSecondary, marginBottom:10 }]}>
        Selecione todas que se aplicam. Essencial para uma dieta segura.
      </Text>
      <ChipWrap>
        {HEALTH_COND.map(i => (
          <Chip key={i} val={i} label={i} field="healthConditions" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
        ))}
      </ChipWrap>
      <FreeText field="healthConditionsObs" placeholder="Observação adicional (opcional)..." multiline form={form} setField={setField} theme={theme} />

      <Q mt={28} theme={theme}>Já fez cirurgia bariátrica?</Q>
      <BoolPair field="bariatric" form={form} setField={setField} theme={theme} />

      {form.bariatric === 'yes' && <>
        <Label theme={theme}>TIPO DE CIRURGIA *</Label>
        <ChipWrap>
          {BARI_TYPES.map(i => (
            <ChipSingle key={i} val={i} label={i} field="bariatricType" form={form} setField={setField} theme={theme} />
          ))}
        </ChipWrap>
        <Label theme={theme}>HÁ QUANTO TEMPO? *</Label>
        <ChipWrap>
          {BARI_TIMES.map(i => (
            <ChipSingle key={i} val={i} label={i} field="bariatricTime" form={form} setField={setField} theme={theme} />
          ))}
        </ChipWrap>
        <Label theme={theme}>INTOLERÂNCIAS PÓS-CIRURGIA</Label>
        <ChipWrap>
          {BARI_INT.map(i => (
            <Chip key={i} val={i} label={i} field="bariatricIntolerances" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
          ))}
        </ChipWrap>
      </>}

      <Q mt={28} theme={theme}>Usa algum medicamento contínuo?</Q>
      <ChipWrap>
        {MEDS_LIST.map(i => (
          <Chip key={i} val={i} label={i} field="medications" noneVals={['Nenhum']} form={form} toggleMulti={toggleMulti} theme={theme} />
        ))}
      </ChipWrap>
      <FreeText field="medicationsObs" placeholder="Outros medicamentos (opcional)..." form={form} setField={setField} theme={theme} />
    </View>
  );
}