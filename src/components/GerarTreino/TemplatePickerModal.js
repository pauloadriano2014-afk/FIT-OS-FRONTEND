// src/components/GerarTreino/TemplatePickerModal.js
import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { buildPresets, MUSCLE_GROUPS } from './_constants';

export default function TemplatePickerModal({ visible, onClose, onSelect, gender, theme }) {
  const presets = buildPresets(gender);
  const categories = [...new Set(presets.map(p => p.category))];
  const getGroupInfo = (id) => MUSCLE_GROUPS.find(g => g.id === id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.overlay}>
        <View style={[S.sheet, { backgroundColor: theme.surface }]}>
          <View style={S.handle} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={[S.title, { color: theme.text }]}>Templates{gender ? ` — ${gender}` : ''}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 460 }}>
            {categories.map(cat => (
              <View key={cat}>
                <Text style={[S.category, { color: theme.textSecondary }]}>{cat.toUpperCase()}</Text>
                {presets.filter(p => p.category === cat).map((tmpl, i) => (
                  <TouchableOpacity key={i} style={[S.row, { borderBottomColor: theme.border }]} onPress={() => onSelect(tmpl)}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>{tmpl.label}</Text>
                      <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                        {tmpl.groups.map(g => `${getGroupInfo(g.id)?.label} (${g.qty})`).join(' · ')}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:    { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 36 },
  handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 14 },
  title:    { fontSize: 16, fontWeight: '900' },
  category: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, paddingVertical: 8 },
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
});