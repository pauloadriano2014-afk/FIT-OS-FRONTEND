// src/components/ExerciseCard/RestIntervalLabel.js
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RestIntervalLabel({ categoryType, biSetType, blocks, standardRestTime, colors }) {
  const label = categoryType === 'MOBILITY' ? 'Execução contínua' :
    biSetType === 'start' ? 'Sem descanso' :
      `${blocks[0].restTime || standardRestTime}s intervalo`;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MaterialCommunityIcons name="timer-sand" size={14} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: 'bold' }}>
          {label}
        </Text>
      </View>
    </View>
  );
}