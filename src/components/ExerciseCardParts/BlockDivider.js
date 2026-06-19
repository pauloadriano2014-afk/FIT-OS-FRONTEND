// src/components/ExerciseCard/BlockDivider.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BlockDivider({ techInfo, colors, setSelectedTech, setTechModalVisible }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, gap: 6, backgroundColor: techInfo.color + '1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: techInfo.color }}
        onPress={() => { if (setSelectedTech && setTechModalVisible) { setSelectedTech(techInfo.actualTechId); setTechModalVisible(true); } }}
      >
        <MaterialCommunityIcons name="information-outline" size={16} color={techInfo.color} />
        <Text style={{ color: techInfo.color, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>{techInfo.label}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}