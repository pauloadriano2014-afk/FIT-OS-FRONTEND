// src/components/GerarTreino/StudentCard.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getLevelColor } from './_helpers';

export function StudentCard({ selectedStudent, studentDetail, anamnese, activeRules, theme }) {
  if (!studentDetail) return (
    <View style={[S.card, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', padding: 20 }]}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );

  const gender = studentDetail?.gender || '';

  return (
    <View style={[S.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[S.avatar, { backgroundColor: theme.accent + '25' }]}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: theme.accent }}>
            {(selectedStudent?.name || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[S.name, { color: theme.text }]} numberOfLines={1}>{selectedStudent?.name}</Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
            {anamnese?.objetivo || '—'} · {anamnese?.nivel || '—'} · {gender || '—'}
          </Text>
        </View>
        {anamnese?.frequencia && (
          <View style={[S.badge, { borderColor: theme.accent + '40', backgroundColor: theme.accent + '15' }]}>
            <Text style={[S.badgeText, { color: theme.accent }]}>{anamnese.frequencia}x/sem</Text>
          </View>
        )}
      </View>

      {activeRules.length > 0 && (
        <View style={{ marginTop: 10, gap: 6 }}>
          {activeRules.map(rule => (
            <View key={rule.id} style={[S.alertRow, { backgroundColor: rule.color + '15', borderColor: rule.color + '30' }]}>
              <MaterialCommunityIcons name="alert-circle" size={13} color={rule.color} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: rule.color }}>{rule.label} — regras aplicadas</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function StudentListItem({ student, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[S.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => onPress(student)}
    >
      <View style={[S.avatar, { backgroundColor: theme.accent + '25' }]}>
        <Text style={{ fontSize: 17, fontWeight: '900', color: theme.accent }}>
          {(student.name || '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[S.name, { color: theme.text }]} numberOfLines={1}>{student.name}</Text>
        <Text style={{ fontSize: 12, color: theme.textSecondary }} numberOfLines={1}>
          {student.goal?.split('(')[0]?.trim() || '—'}
        </Text>
      </View>
      {student.level && (
        <View style={[S.badge, { borderColor: getLevelColor(student.level) + '50', backgroundColor: getLevelColor(student.level) + '15' }]}>
          <Text style={[S.badgeText, { color: getLevelColor(student.level) }]}>{student.level}</Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  card:     { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 13, borderWidth: 1, marginBottom: 9 },
  avatar:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name:     { fontSize: 14, fontWeight: '800' },
  badge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText:{ fontSize: 10, fontWeight: '800' },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 8, borderRadius: 8, borderWidth: 1 },
});