// src/components/ExerciseCardParts/techInputs/CustomTechInput.js
import React from 'react';
import { View, Text, TextInput, Pressable, Platform } from 'react-native';
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
    <View style={{ width: '100%', paddingVertical: 4 }}>
      
      {/* Header com o Nome da Técnica Customizada */}
      {techInfo.label && techInfo.label !== 'NORMAL' && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
            <MaterialCommunityIcons name="lightning-bolt" size={10} color={techInfo.color || colors.primary} />
            <Text style={{ color: techInfo.color || colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', textTransform: 'uppercase', marginLeft: 4 }}>
              {techInfo.label}
            </Text>
        </View>
      )}

      {/* Container das Caixas de Carga (Forçado a 100% de largura para o Android não engolir) */}
      <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
            <View key={idx} style={{ flex: 1, marginHorizontal: 2 }}>
              {hasPrescribedLoad && isMain ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                  <MaterialCommunityIcons name="target" size={9} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '900', textAlign: 'center', marginLeft: 2 }} numberOfLines={1}>
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
                    style={[
                      { 
                        backgroundColor: colors.inputBg, color: colors.text, height: 40, width: '100%', 
                        borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: colors.border, 
                        fontSize: Platform.OS === 'android' ? 12 : 14, fontWeight: 'bold', 
                        paddingHorizontal: 0 // Força o Android a não colocar margens invisíveis no input
                      }, 
                      isDone && { borderColor: techInfo.color, color: techInfo.color }, 
                      !isTimerRunning && { opacity: 0.5 }, 
                      hasPrescribedLoad && isMain && { borderColor: colors.primary }
                    ]}
                    placeholder="KG" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
                    value={val !== undefined ? String(val) : ''}
                    onChangeText={(text) => handleSaveWeight(item.id, text.replace(',', '.'), `${currentSetNum}_${suffix}`)}
                    onSubmitEditing={(e) => {
                      const finalVal = e.nativeEvent.text.replace(',', '.');
                      handleSaveWeight(item.id, finalVal, `${currentSetNum}_${suffix}`);

                      if (idx === stepsToRender.length - 1) {
                        handleSmartCheck(currentSetNum, finalVal, block.restTime, techInfo.key);
                      } else {
                        const nextStep = stepsToRender[idx + 1];
                        const nextType = typeof nextStep === 'string' ? nextStep : (nextStep.type || '');
                        if (nextType === 'REST' || nextType.toUpperCase().includes('REST')) {
                          startRestTimer(currentSetNum, 'NORMAL', 20, 'RESTPAUSE', false);
                        }
                      }
                    }}
                    editable={isTimerRunning} returnKeyType="done"
                    adjustsFontSizeToFit={true}
                    numberOfLines={1}
                  />
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}