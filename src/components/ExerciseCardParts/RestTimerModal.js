// src/components/ExerciseCard/RestTimerModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RestTimerModal({ isResting, timerMessage, seconds, biSetType, colors, skipRest }) {
  return (
    <Modal visible={isResting} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: colors.glass, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '85%', padding: 40, backgroundColor: colors.surface, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>{timerMessage.title}</Text>
          {biSetType !== 'start' && biSetType !== 'middle' && <Text style={{ color: colors.text, fontSize: 90, fontWeight: '900', marginVertical: 10 }}>{seconds}s</Text>}
          <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', lineHeight: 22 }}>{timerMessage.desc}</Text>
          <TouchableOpacity style={{ marginTop: 10, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }} onPress={skipRest}>
            <Text style={{ color: colors.primaryText, fontWeight: '900', fontSize: 14 }}>{(biSetType === 'start' || biSetType === 'middle') ? 'FECHAR' : 'PULAR'}</Text>
            <MaterialCommunityIcons name={(biSetType === 'start' || biSetType === 'middle') ? 'close' : 'skip-next'} size={16} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}