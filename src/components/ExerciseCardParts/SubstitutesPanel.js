// src/components/ExerciseCard/SubstitutesPanel.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SubstitutesPanel({ onSwap, substitutes, colors }) {
  if (!(onSwap && substitutes && substitutes.length > 0)) return null;

  return (
    <View style={{ marginTop: 20, backgroundColor: colors.inputBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <MaterialCommunityIcons name="swap-horizontal" size={14} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>
          MÁQUINA OCUPADA? TROQUE POR:
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        {substitutes.map((sub, idx) => (
          <TouchableOpacity
            key={sub.id || idx}
            onPress={() => onSwap(null, sub)}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: '#FF950022', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#FF9500', fontSize: 10, fontWeight: 'bold' }}>{idx + 1}</Text>
              </View>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13, flex: 1 }} numberOfLines={1}>
                {sub.name || sub.title}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}