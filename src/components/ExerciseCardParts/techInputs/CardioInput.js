// src/components/ExerciseCard/techInputs/CardioInput.js
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

export default function CardioInput({
  item, currentSetNum, lastWeights, checkedSets,
  handleSaveWeight, handleSmartCheck, handleInputFocus,
  isTimerRunning, colors, getPreviousWeight, techInfo, block,
}) {
  const val = lastWeights[item.id]?.[currentSetNum];
  const isConfirmed = checkedSets[item.id]?.[currentSetNum] === true;

  return (
    <View style={{ flex: 1.5, alignItems: 'center' }}>
      <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3 }}>TEMPO / KM</Text>
      <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{ width: '100%' }}>
        <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
          <TextInput
            style={[{ backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold' }, isConfirmed && { color: colors.primary, borderColor: colors.primary }, !isTimerRunning && { opacity: 0.5 }]}
            placeholder="Min/Km" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
            value={val !== undefined ? String(val) : ''}
            onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), currentSetNum)}
            onSubmitEditing={(e) => { handleSaveWeight(item.id, e.nativeEvent.text.replace(',', '.'), currentSetNum); handleSmartCheck(currentSetNum, e.nativeEvent.text.replace(',', '.'), block.restTime, techInfo.key); }}
            editable={isTimerRunning} returnKeyType="done"
          />
        </View>
      </Pressable>
      <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>Ant: {getPreviousWeight(currentSetNum)}</Text>
    </View>
  );
}