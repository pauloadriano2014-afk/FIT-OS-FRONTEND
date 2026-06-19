// src/components/ExerciseCard/techInputs/DefaultLoadInput.js
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

export default function DefaultLoadInput({
  item, currentSetNum, lastWeights, checkedSets,
  handleSaveWeight, handleSmartCheck, handleInputFocus,
  isTimerRunning, colors, getPreviousWeight, techInfo, block, hasPrescribedLoad,
}) {
  const val = lastWeights[item.id]?.[currentSetNum];
  const isConfirmed = checkedSets[item.id]?.[currentSetNum] === true;

  return (
    <View style={{ flex: 1.5, alignItems: 'center' }}>
      <Text style={{ color: hasPrescribedLoad ? colors.primary : colors.textMuted, fontSize: hasPrescribedLoad ? 11 : 8, fontWeight: '900', marginBottom: 4, letterSpacing: hasPrescribedLoad ? 0.5 : 0 }}>
        {hasPrescribedLoad ? ` CARGA TOTAL: ${String(block.load).toUpperCase()}` : 'CARGA TOTAL (KG)'}
      </Text>
      <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{ width: '100%' }}>
        <View pointerEvents={isTimerRunning ? 'auto' : 'none'} style={[{ backgroundColor: colors.inputBg, height: 40, width: '100%', borderRadius: 8, borderWidth: 1, borderColor: hasPrescribedLoad ? colors.primary : colors.border, justifyContent: 'center' }, isConfirmed && { borderColor: colors.primary }, !isTimerRunning && { opacity: 0.5 }]}>
          <TextInput
            style={[{ color: colors.text, width: '100%', height: '100%', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }, isConfirmed && { color: colors.primary }]}
            placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
            value={val !== undefined ? String(val) : ''}
            onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), currentSetNum)}
            onSubmitEditing={(e) => {
              const finalVal = e.nativeEvent.text.replace(',', '.');
              handleSaveWeight(item.id, finalVal, currentSetNum);
              handleSmartCheck(currentSetNum, finalVal, block.restTime, techInfo.key);
            }}
            editable={isTimerRunning} returnKeyType="done"
          />
        </View>
      </Pressable>
      <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>Ant: {getPreviousWeight(currentSetNum)}</Text>
    </View>
  );
}