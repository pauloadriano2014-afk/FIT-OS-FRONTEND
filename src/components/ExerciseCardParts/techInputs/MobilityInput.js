// src/components/ExerciseCard/techInputs/MobilityInput.js
import React from 'react';
import { View, Text } from 'react-native';

export default function MobilityInput({ block, colors }) {
  return (
    <View style={{ flex: 1.5, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>EXECUÇÃO</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }}>{block.reps || "Fazer"} Reps</Text>
    </View>
  );
}