// src/components/DayWorkout/DayWorkoutHeader.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DayWorkoutHeader({
  theme,
  workoutName,
  day,
  isVoiceEnabled,
  toggleVoice,
  isTimerRunning,
  isPreviewMode,
  onGoBack,
}) {
  return (
    <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, justifyContent: 'space-between' }}>
      <TouchableOpacity onPress={onGoBack} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 }} numberOfLines={1}>{workoutName?.toUpperCase()}</Text>
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{day.length <= 2 ? `TREINO ${day}` : day.toUpperCase()}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TouchableOpacity onPress={toggleVoice} style={{ padding: 6, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
          <MaterialCommunityIcons name={isVoiceEnabled ? "volume-high" : "volume-mute"} size={18} color={isVoiceEnabled ? theme.accent : theme.textSecondary} />
        </TouchableOpacity>
        {isTimerRunning && !isPreviewMode ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.accent, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 }}>
            <MaterialCommunityIcons name="fire" size={14} color={theme.isDark ? '#000' : '#FFF'} />
            <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: 'bold', fontSize: 9 }}>EM TREINO</Text>
          </View>
        ) : <View style={{ width: 32 }} />}
      </View>
    </View>
  );
}