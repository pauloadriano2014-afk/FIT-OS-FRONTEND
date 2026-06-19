// src/components/DayWorkout/WorkoutStatusBanners.js
import React from 'react';
import { View, Text } from 'react-native';

export default function WorkoutStatusBanners({ isPreviewMode, isIntensityMaskActive, activeIntensityMultiplier }) {
  return (
    <>
      {/* 🔥 AVISO DE MODO ESPIÃO 🔥 */}
      {isPreviewMode && (
        <View style={{ width: '100%', backgroundColor: '#FF9500', padding: 8, alignItems: 'center' }}>
          <Text style={{ color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>🕵️ MODO ESPIÃO ATIVO (APENAS VISUALIZAÇÃO)</Text>
        </View>
      )}

      {isIntensityMaskActive && activeIntensityMultiplier === 0.8 && (
        <View style={{ width: '100%', backgroundColor: '#32ADE6', padding: 8, alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>🧊 SEMANA DE DELOAD ATIVADA (CARGAS REDUZIDAS)</Text>
        </View>
      )}
      {isIntensityMaskActive && activeIntensityMultiplier > 1.0 && (
        <View style={{ width: '100%', backgroundColor: '#FF3B30', padding: 8, alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>🔥 SEMANA DE CHOQUE (DESCANSO AUMENTADO E +CARGA)</Text>
        </View>
      )}
    </>
  );
}