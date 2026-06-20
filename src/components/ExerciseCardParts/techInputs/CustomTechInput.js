// src/components/ExerciseCard/techInputs/CustomTechInput.js
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomTechInput({
  item, currentSetNum, lastWeights,
  handleSaveWeight, handleSmartCheck, handleInputFocus, startRestTimer,
  isTimerRunning, colors, techInfo, block, hasPrescribedLoad,
}) {
  const stepsToRender = techInfo.steps && techInfo.steps.length > 0
    ? techInfo.steps
    : [{ type: 'NORMAL' }];

  return (
    <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
      {stepsToRender.map((step, idx) => {
        const isMain = idx === 0;
        const suffix = `CUSTOM_${idx}`;
        const val = lastWeights[item.id]?.[`${currentSetNum}_${suffix}`];
        const isDone = val !== undefined && val !== '';

        let label = isMain ? 'CARGA' : `DROP ${idx}`;
        let stepName = typeof step === 'string' ? step : (step.type || step.name || step.action || '');

        if (stepName && typeof stepName === 'string') {
          const normalizedStep = stepName.toLowerCase();
          if (normalizedStep.includes('drop')) label = `DROP ${idx}`;
          else if (normalizedStep.includes('rest') || normalizedStep.includes('pausa')) label = `PAUSA`;
          else if (normalizedStep.includes('iso')) label = `ISO`;
          else if (!isMain) label = `PASSO ${idx + 1}`;
        }

        return (
          <View key={idx} style={{ flex: 1, minWidth: stepsToRender.length > 3 ? '22%' : 'auto', paddingHorizontal: 2 }}>
            {hasPrescribedLoad && isMain ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 3 }}>
                <MaterialCommunityIcons name="target" size={9} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '900', textAlign: 'center' }} numberOfLines={1}>
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
                  style={[{ backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, fontSize: 14, fontWeight: 'bold' }, isDone && { borderColor: techInfo.color, color: techInfo.color }, !isTimerRunning && { opacity: 0.5 }, hasPrescribedLoad && isMain && { borderColor: colors.primary }]}
                  placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
                  value={val !== undefined ? String(val) : ''}
                  onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), `${currentSetNum}_${suffix}`)}
                  onSubmitEditing={(e) => {
                    const finalVal = e.nativeEvent.text.replace(',', '.');
                    handleSaveWeight(item.id, finalVal, `${currentSetNum}_${suffix}`);

                    // 🔥 INTELIGÊNCIA DO TIMER INTERMEDIÁRIO
                    if (idx === stepsToRender.length - 1) {
                      // É a última caixa, encerra a série
                      handleSmartCheck(currentSetNum, finalVal, block.restTime, techInfo.key);
                    } else {
                      // Se não for a última, verifica o que vem a seguir
                      const nextStep = stepsToRender[idx + 1];
                      const nextType = typeof nextStep === 'string' ? nextStep : (nextStep.type || '');

                      // Se o próximo passo for um REST-PAUSE, dispara o cronômetro
                      if (nextType === 'REST' || nextType.toUpperCase().includes('REST')) {
                        startRestTimer(currentSetNum, 'NORMAL', 20, 'RESTPAUSE', false);
                      }
                    }
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