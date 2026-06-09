// src/components/GerarTreino/PresetsModal.js
import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function SavePresetModal({ visible, onClose, onSave, presetName, setPresetName, theme }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[S.overlay, { justifyContent: 'center', padding: 24 }]}>
        <View style={[S.box, { backgroundColor: theme.surface }]}>
          <Text style={[S.title, { color: theme.text, marginBottom: 14 }]}>Salvar Configuração</Text>
          <TextInput
            style={[S.input, { color: theme.text, borderColor: theme.accent + '50', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}
            placeholder="Nome do preset..." placeholderTextColor={theme.textSecondary}
            value={presetName} onChangeText={setPresetName} autoFocus
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity style={[S.btn, { backgroundColor: theme.border, flex: 1 }]} onPress={onClose}>
              <Text style={{ color: theme.text, fontWeight: '700', textAlign: 'center' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, { backgroundColor: theme.accent, flex: 1 }]} onPress={onSave}>
              <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', textAlign: 'center' }}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function LoadPresetModal({ visible, onClose, savedPresets, onLoad, onDelete, theme }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.overlay}>
        <View style={[S.sheet, { backgroundColor: theme.surface }]}>
          <View style={S.handle} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={[S.title, { color: theme.text }]}>Meus Presets</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          {savedPresets.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="bookmark-outline" size={36} color={theme.textSecondary} style={{ opacity: 0.4 }} />
              <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Nenhum preset salvo ainda</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 400 }}>
              {savedPresets.map(p => (
                <View key={p.id} style={[S.row, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => onLoad(p)}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>{p.name}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{p.phase} · {p.days.length} dias</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(p.id)} style={{ padding: 6 }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:   { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 36 },
  handle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 14 },
  box:     { borderRadius: 18, padding: 20 },
  title:   { fontSize: 16, fontWeight: '900' },
  input:   { padding: 12, borderRadius: 11, borderWidth: 1, fontSize: 15, outlineStyle: 'none' },
  btn:     { padding: 13, borderRadius: 11 },
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
});