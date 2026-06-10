// src/components/BibliotecaAdmin/TemplateCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const countWorkoutDays = (workoutData) => {
  if (!workoutData) return 0;
  try {
    const parsed = typeof workoutData === 'string' ? JSON.parse(workoutData) : workoutData;
    return Object.keys(parsed).length;
  } catch {
    return 0;
  }
};

export default function TemplateCard({
  item,
  isOwner,
  selectedCollection,
  onPress,
  onEdit,
  onMove,
  onDelete,
}) {
  const { theme } = useTheme();
  const daysCount = countWorkoutDays(item.data);

  return (
    <View style={[styles.card, {
      backgroundColor: theme.surface,
      borderLeftColor: selectedCollection ? selectedCollection.color : theme.border,
    }]}>
      <TouchableOpacity style={{ flex: 1, paddingVertical: 5 }} onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <View style={{ backgroundColor: theme.accent + '25', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: theme.accent }}>
              🗓️ {daysCount} DIA{daysCount !== 1 ? 'S' : ''}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 'bold' }}>
            {item.goal} • {item.level}
          </Text>
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>

      {isOwner ? (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onMove} style={styles.actionBtn}>
            <MaterialCommunityIcons name="folder-move-outline" size={22} color={theme.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.actions} onPress={onPress}>
          <View style={{
            backgroundColor: theme.bg, padding: 8, paddingHorizontal: 12,
            borderRadius: 8, borderWidth: 1, borderColor: theme.border,
            flexDirection: 'row', alignItems: 'center', gap: 5,
          }}>
            <MaterialCommunityIcons name="eye-outline" size={16} color={theme.textSecondary} />
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.textSecondary }}>VER</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18, borderRadius: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderLeftWidth: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardTitle: { fontWeight: '900', fontSize: 15 },
  actions: { flexDirection: 'row', gap: 15, paddingLeft: 10 },
  actionBtn: { padding: 5 },
});