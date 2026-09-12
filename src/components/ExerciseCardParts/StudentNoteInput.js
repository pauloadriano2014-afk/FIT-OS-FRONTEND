// src/components/ExerciseCardParts/StudentNoteInput.js
// 🔥 NOVO: observação do aluno por exercício (ex: "não consegui fazer o
// agachamento"), pro coach ver depois no histórico de treinos do admin.
// Fica fechado (só um botão discreto) até o aluno tocar pra escrever, ou
// já abre direto se já tiver algo digitado (ex: aluno saiu e voltou).
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StudentNoteInput({ value, onChangeText, colors }) {
  const [expanded, setExpanded] = useState(!!value && value.trim() !== '');

  if (!expanded) {
    return (
      <TouchableOpacity
        onPress={() => setExpanded(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, alignSelf: 'flex-start', padding: 4 }}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialCommunityIcons name="comment-plus-outline" size={14} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>Deixar observação pro coach</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ backgroundColor: colors.inputBg, padding: 12, borderRadius: 8, marginTop: 15, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="comment-text-outline" size={14} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>SUA OBSERVAÇÃO PRO COACH:</Text>
        </View>
        {(!value || value.trim() === '') && (
          <TouchableOpacity onPress={() => setExpanded(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Ex: Não consegui fazer o agachamento hoje..."
        placeholderTextColor={colors.textMuted}
        multiline
        style={{ color: colors.text, fontSize: 13, minHeight: 40, textAlignVertical: 'top', padding: 0 }}
      />
    </View>
  );
}
