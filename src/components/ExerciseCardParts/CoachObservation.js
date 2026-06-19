// src/components/ExerciseCard/CoachObservation.js
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CoachObservation({ realObservation, colors }) {
  if (!realObservation || realObservation.trim() === '') return null;

  return (
    <View style={{ backgroundColor: colors.inputBg, padding: 12, borderRadius: 8, marginTop: 15, borderWidth: 1, borderColor: colors.primary + '55', borderLeftWidth: 4, borderLeftColor: colors.primary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <MaterialCommunityIcons name="bullhorn-outline" size={14} color={colors.primary} />
        <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>COACH AVISA:</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 13, fontStyle: 'italic', lineHeight: 18 }}>{realObservation}</Text>
    </View>
  );
}