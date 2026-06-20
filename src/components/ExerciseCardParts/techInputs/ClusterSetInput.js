// src/components/ExerciseCard/techInputs/ClusterSetInput.js
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ClusterSetInput({
  item, currentSetNum, lastWeights,
  handleSaveWeight, handleSmartCheck, handleInputFocus, startRestTimer,
  isTimerRunning, colors, techInfo, block, hasPrescribedLoad,
}) {
  return (
    <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
      {['BLOCO 1', 'BLOCO 2', 'BLOCO 3'].map((label, idx) => {
        const suffix = `CL${idx + 1}`;
        const val = lastWeights[item.id]?.[`${currentSetNum}_${suffix}`];
        const isDone = val !== undefined && val !== '';
        return (
          <View key={idx} style={{ flex: 1, paddingHorizontal: 2 }}>
            {hasPrescribedLoad ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 3 }}>
                <MaterialCommunityIcons name="target" size={10} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', textAlign: 'center' }} numberOfLines={1}>
                  {String(block.load).toUpperCase()}
                </Text>
              </View>
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '900', marginBottom: 3, textAlign: 'center' }} numberOfLines={1}>
                {label}
              </Text>
            )}
            <Pressable onPress={!isTimerRunning ? handleInputFocus : null} style={{ width: '100%' }}>
              <View pointerEvents={isTimerRunning ? 'auto' : 'none'}>
                <TextInput
                  style={[{ backgroundColor: colors.inputBg, color: colors.text, height: 36, width: '100%', borderRadius: 6, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 13, fontWeight: 'bold' }, isDone && { borderColor: techInfo.color, color: techInfo.color }, !isTimerRunning && { opacity: 0.5 }, hasPrescribedLoad && { borderColor: colors.primary }]}
                  placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
                  value={val !== undefined ? String(val) : ''}
                  onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), `${currentSetNum}_${suffix}`)}
                  onSubmitEditing={(e) => {
                    const finalVal = e.nativeEvent.text.replace(',', '.');
                    handleSaveWeight(item.id, finalVal, `${currentSetNum}_${suffix}`);
                    if (idx === 2) handleSmartCheck(currentSetNum, finalVal, block.restTime, techInfo.key);
                    else startRestTimer(currentSetNum, 'CLUSTER_INTRA', block.restTime, techInfo.key);
                  }}
                  editable={isTimerRunning} returnKeyType="done"
                />
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}