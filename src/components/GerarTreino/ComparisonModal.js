// src/components/GerarTreino/ComparisonModal.js
import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ComparisonModal({ visible, onClose, onConfirm, onRegenerate, generatedData, studentDetail, theme }) {
  if (!generatedData) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[S.overlay, { justifyContent: 'flex-end' }]}>
        <View style={[S.sheet, { backgroundColor: theme.bg }]}>
          <View style={S.handle} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
            <View>
              <Text style={[S.title, { color: theme.text }]}>Comparar Treinos</Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>Novo vs Atual — verifique antes de abrir</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[S.closeBtn, { backgroundColor: theme.surface }]}>
              <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            {Object.entries(generatedData.exercisesByDay).map(([day, exercises]) => {
              const currentWorkout = studentDetail?.last3Workouts?.[0];
              const currentForDay = currentWorkout?.exercises?.filter(e => e.day === day) || [];
              const newExIds = new Set(exercises.map(e => e.exerciseId));
              const oldExIds = new Set(currentForDay.map(e => e.exerciseId));
              const changedCount = [...newExIds].filter(id => !oldExIds.has(id)).length;
              const changePercent = exercises.length > 0 ? Math.round((changedCount / exercises.length) * 100) : 0;

              return (
                <View key={day} style={[S.dayCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <View style={[S.dayBadge, { backgroundColor: theme.accent }]}>
                      <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13 }}>{day}</Text>
                    </View>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13, flex: 1, marginLeft: 10 }}>
                      {exercises.length} exercícios
                    </Text>
                    <View style={[S.changeBadge, {
                      backgroundColor: changePercent >= 40 ? '#4ECDC415' : '#FF950015',
                      borderColor: changePercent >= 40 ? '#4ECDC440' : '#FF950040',
                    }]}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: changePercent >= 40 ? '#4ECDC4' : '#FF9500' }}>
                        {changePercent}% novo
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    {exercises.map((ex, idx) => {
                      const isNew = !oldExIds.has(ex.exerciseId);
                      const technique = ex.blocks?.find(b => b.technique && b.technique !== '')?.technique;
                      return (
                        <View key={ex.exerciseId} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 10, color: theme.textSecondary, width: 16 }}>{idx + 1}.</Text>
                          <View style={[S.exRow, {
                            backgroundColor: isNew ? '#4ECDC410' : theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            borderColor: isNew ? '#4ECDC430' : 'transparent',
                            flex: 1,
                          }]}>
                            {isNew && <View style={S.newDot} />}
                            <Text style={{ fontSize: 12, color: theme.text, fontWeight: isNew ? '700' : '500', flex: 1 }} numberOfLines={1}>
                              {ex.title}
                            </Text>
                            {technique && (
                              <View style={[S.techTag, { backgroundColor: theme.accent + '20' }]}>
                                <Text style={{ fontSize: 9, fontWeight: '900', color: theme.accent }}>{technique}</Text>
                              </View>
                            )}
                            <Text style={{ fontSize: 10, color: theme.textSecondary }}>{ex.blocks?.length}x</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={{ padding: 16, gap: 10 }}>
            <TouchableOpacity style={[S.btn, { backgroundColor: theme.accent }]} onPress={onConfirm}>
              <Text style={[S.btnText, { color: theme.isDark ? '#000' : '#FFF' }]}>ABRIR NO EDITOR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]} onPress={onRegenerate}>
              <Text style={[S.btnText, { color: theme.textSecondary }]}>GERAR NOVAMENTE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, height: '85%' },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 14 },
  title:       { fontSize: 16, fontWeight: '900' },
  closeBtn:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayCard:     { borderRadius: 14, padding: 12, borderWidth: 1, marginBottom: 12 },
  dayBadge:    { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  exRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 7, borderRadius: 8, borderWidth: 1 },
  newDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ECDC4' },
  techTag:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 17, borderRadius: 15 },
  btnText:     { fontSize: 15, fontWeight: '900', letterSpacing: 0.4 },
});