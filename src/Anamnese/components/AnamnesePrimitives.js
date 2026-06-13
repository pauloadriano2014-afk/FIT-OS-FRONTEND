// src/screens/Anamnese/components/AnamnesePrimitives.js
import React, { memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── OPTION — card de seleção única grande ────────────────────────────────────
export const Option = memo(({ val, label, desc, field, form = {}, setField, theme }) => {
  const active = form[field] === val;
  return (
    <TouchableOpacity
      style={[p.optionCard, { backgroundColor: theme.surface, borderColor: theme.border },
        active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
      onPress={() => setField(field, val)}
      activeOpacity={0.8}
    >
      <Text style={[p.optionLabel, { color: theme.text }, active && { color: theme.isDark ? '#000':'#FFF' }]}>{label}</Text>
      {desc && <Text style={[p.optionDesc, { color: theme.textSecondary }, active && { color: theme.isDark ? '#00000099':'#FFFFFF99' }]}>{desc}</Text>}
    </TouchableOpacity>
  );
});

// ─── CHIP SINGLE — seleção única, usa setField ────────────────────────────────
export const ChipSingle = memo(({ val, label, field, form = {}, setField, theme }) => {
  const active = form[field] === val;
  return (
    <TouchableOpacity
      style={[p.chip, { backgroundColor: theme.surface, borderColor: theme.border },
        active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
      onPress={() => setField(field, active ? '' : val)}
    >
      <Text style={[p.chipText, { color: theme.textSecondary }, active && { color: theme.isDark ? '#000':'#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
});

// ─── CHIP — seleção múltipla, usa toggleMulti ────────────────────────────────
export const Chip = memo(({ val, label, field, noneVals, form = {}, toggleMulti, theme }) => {
  const active = (form[field] || []).includes(val);
  return (
    <TouchableOpacity
      style={[p.chip, { backgroundColor: theme.surface, borderColor: theme.border },
        active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
      onPress={() => toggleMulti(field, val, noneVals)}
    >
      <Text style={[p.chipText, { color: theme.textSecondary }, active && { color: theme.isDark ? '#000':'#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
});

// ─── BOOL PAIR — botões Sim/Não ───────────────────────────────────────────────
export const BoolPair = memo(({ field, labelYes = 'Sim', labelNo = 'Não', form = {}, setField, theme }) => (
  <View style={p.boolRow}>
    {[{ v:'yes', l:labelYes }, { v:'no', l:labelNo }].map(({ v, l }) => {
      const active = form[field] === v;
      return (
        <TouchableOpacity key={v}
          style={[p.boolBtn, { backgroundColor: theme.surface, borderColor: theme.border },
            active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
          onPress={() => setField(field, v)}
        >
          <Text style={[p.boolText, { color: theme.text }, active && { color: theme.isDark ? '#000':'#FFF' }]}>{l}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
));

// ─── TIME BTN — botão que abre o seletor de hora ─────────────────────────────
export const TimeBtn = memo(({ field, label, form = {}, openTimePicker, theme }) => (
  <TouchableOpacity
    style={[p.timeBtn, { backgroundColor: theme.surface, borderColor: form[field] ? theme.accent : theme.border }]}
    onPress={() => openTimePicker(field)}
  >
    <MaterialCommunityIcons name="clock-outline" size={16} color={theme.accent} />
    <Text style={[p.timeBtnText, { color: form[field] ? theme.text : theme.textSecondary }]}>
      {form[field] || label}
    </Text>
    {form[field] && <MaterialCommunityIcons name="check-circle" size={14} color={theme.accent} />}
  </TouchableOpacity>
));

// ─── SCALE ROW — linha de botões 1..5 ────────────────────────────────────────
export const ScaleRow = memo(({ field, min = 1, max = 5, form = {}, setField, theme }) => (
  <View style={p.scaleRow}>
    {Array.from({ length: max - min + 1 }, (_, i) => String(i + min)).map(v => {
      const active = form[field] === v;
      return (
        <TouchableOpacity key={v}
          style={[p.scaleBtn, { backgroundColor: theme.surface, borderColor: theme.border },
            active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
          onPress={() => setField(field, v)}
        >
          <Text style={[p.scaleBtnText, { color: theme.text }, active && { color: theme.isDark ? '#000':'#FFF' }]}>{v}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
));

// ─── LABEL ────────────────────────────────────────────────────────────────────
export const Label = memo(({ children, mt = 20, theme }) => (
  <Text style={[p.label, { color: theme.textSecondary, marginTop: mt }]}>{children}</Text>
));

// ─── Q (pergunta/título de seção) ────────────────────────────────────────────
export const Q = memo(({ children, mt = 0, theme }) => (
  <Text style={[p.question, { color: theme.text, marginTop: mt }]}>{children}</Text>
));

// ─── FREE TEXT — input ou textarea ───────────────────────────────────────────
export const FreeText = memo(({ field, placeholder, multiline = false, hint, form = {}, setField, theme }) => (
  <>
    <TextInput
      style={[multiline ? p.textArea : p.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      value={form[field]}
      onChangeText={v => setField(field, v)}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
    />
    {hint && <Text style={[p.hint, { color: theme.textSecondary }]}>{hint}</Text>}
  </>
));

// ─── CHIP WRAP — container padrão para linha de chips ────────────────────────
export const ChipWrap = ({ children }) => <View style={p.chipWrap}>{children}</View>;

// ─── STYLES ───────────────────────────────────────────────────────────────────
export const p = StyleSheet.create({
  optionCard:  { padding:16, borderRadius:16, borderWidth:1, marginBottom:10 },
  optionLabel: { fontSize:14, fontWeight:'800' },
  optionDesc:  { fontSize:11, marginTop:3 },
  chip:        { paddingVertical:10, paddingHorizontal:16, borderRadius:20, borderWidth:1 },
  chipText:    { fontWeight:'700', fontSize:13 },
  chipWrap:    { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:8 },
  boolRow:     { flexDirection:'row', gap:12, marginBottom:8 },
  boolBtn:     { flex:1, padding:14, borderRadius:16, borderWidth:1, alignItems:'center' },
  boolText:    { fontWeight:'900', fontSize:13 },
  scaleRow:    { flexDirection:'row', gap:10, marginBottom:8 },
  scaleBtn:    { flex:1, paddingVertical:14, borderRadius:14, borderWidth:1, alignItems:'center' },
  scaleBtnText:{ fontWeight:'900', fontSize:16 },
  timeBtn:     { flexDirection:'row', alignItems:'center', gap:8, padding:16, borderRadius:16, borderWidth:1, marginBottom:16 },
  timeBtnText: { fontSize:15, fontWeight:'700', flex:1 },
  label:       { fontSize:10, fontWeight:'900', marginBottom:8, letterSpacing:0.8 },
  question:    { fontSize:20, fontWeight:'900', marginBottom:16, lineHeight:26 },
  hint:        { fontSize:11, fontStyle:'italic', marginTop:4, marginBottom:4, lineHeight:16 },
  input:       { padding:16, borderRadius:16, borderWidth:1, fontSize:15, marginBottom:8 },
  textArea:    { padding:16, borderRadius:16, borderWidth:1, fontSize:14, minHeight:80, textAlignVertical:'top', marginBottom:8 },
});