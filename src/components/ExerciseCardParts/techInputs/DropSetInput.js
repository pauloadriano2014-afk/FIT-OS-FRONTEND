// src/components/ExerciseCard/techInputs/DropSetInput.js
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DropSetInput({
  item, currentSetNum, lastWeights,
  handleSaveWeight, handleSmartCheck, handleInputFocus,
  isTimerRunning, colors, techInfo, block, hasPrescribedLoad,
}) {
  return (
    <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
      <View style={{ flex: 1, paddingRight: 5 }}>
        <Text style={{ color: hasPrescribedLoad ? colors.primary : colors.textMuted, fontSize: hasPrescribedLoad ? 10 : 8, fontWeight: '900', marginBottom: 3, textAlign: 'center' }}>
          {hasPrescribedLoad ? `🎯 CARGA TOTAL: ${String(block.load).toUpperCase()}` : 'CARGA TOTAL'}
        </Text>
        <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{ width: '100%' }}>
          <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
            <TextInput
              style={[{ backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold' }, lastWeights[item.id]?.[`${currentSetNum}_MAIN`] && { borderColor: techInfo.color, color: techInfo.color }, !isTimerRunning && { opacity: 0.5 }, hasPrescribedLoad && { borderColor: colors.primary }]}
              placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
              value={lastWeights[item.id]?.[`${currentSetNum}_MAIN`] !== undefined ? String(lastWeights[item.id]?.[`${currentSetNum}_MAIN`]) : ''}
              onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), `${currentSetNum}_MAIN`)}
              editable={isTimerRunning} returnKeyType="done"
            />
          </View>
        </Pressable>
      </View>
      <View style={{ justifyContent: 'center', paddingBottom: 15 }}><MaterialCommunityIcons name="arrow-right" size={16} color={colors.textMuted} /></View>
      <View style={{ flex: 1, paddingLeft: 5 }}>
        <Text style={[{ fontSize: 8, fontWeight: 'bold', marginBottom: 3, textAlign: 'center' }, { color: techInfo.color }]}>DROP TOTAL</Text>
        <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{ width: '100%' }}>
          <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
            <TextInput
              style={[{ backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold' }, lastWeights[item.id]?.[`${currentSetNum}_DROP`] && { borderColor: techInfo.color, color: techInfo.color }, !isTimerRunning && { opacity: 0.5 }]}
              placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
              value={lastWeights[item.id]?.[`${currentSetNum}_DROP`] !== undefined ? String(lastWeights[item.id]?.[`${currentSetNum}_DROP`]) : ''}
              onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), `${currentSetNum}_DROP`)}
              onSubmitEditing={(e) => {
                const finalVal = e.nativeEvent.text.replace(',', '.');
                handleSaveWeight(item.id, finalVal, `${currentSetNum}_DROP`);
                handleSmartCheck(currentSetNum, finalVal, block.restTime, techInfo.key);
              }}
              editable={isTimerRunning} returnKeyType="done"
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}