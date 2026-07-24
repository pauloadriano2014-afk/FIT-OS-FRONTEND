// src/components/GerarTreino/MobilityPickerModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MobilityPickerModal({
  visible, onClose, theme,
  loading, exercises, search, setSearch,
  selection, onToggle, onConfirm,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.overlay}>
        <View style={[S.sheet, { backgroundColor: theme.surface }]}>
          <View style={S.handle} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View>
              <Text style={[S.title, { color: theme.text }]}>Exercícios de Mobilidade</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                {selection.length > 0 ? `${selection.length} selecionado(s)` : 'Escolha manualmente para este dia'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Busca */}
          <View style={[S.searchBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="magnify" size={16} color={theme.textSecondary} />
            <TextInput
              style={[S.searchInput, { color: theme.text }]}
              placeholder="Buscar exercício de mobilidade..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
              outlineStyle="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={15} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista */}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : exercises.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <MaterialCommunityIcons name="yoga" size={28} color={theme.textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center' }}>
                Nenhum exercício de "Mobilidade" encontrado na biblioteca.{'\n'}Cadastre exercícios com essa categoria primeiro.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {exercises.map(ex => {
                const isSel = selection.some(e => e.id === ex.id);
                return (
                  <TouchableOpacity
                    key={ex.id}
                    style={[S.row, { borderBottomColor: theme.border, backgroundColor: isSel ? theme.accent + '10' : 'transparent' }]}
                    onPress={() => onToggle(ex)}
                  >
                    <View style={[S.checkbox, { borderColor: isSel ? theme.accent : theme.border, backgroundColor: isSel ? theme.accent : 'transparent' }]}>
                      {isSel && <MaterialCommunityIcons name="check" size={13} color={theme.isDark ? '#000' : '#FFF'} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: isSel ? '900' : '700', color: isSel ? theme.accent : theme.text }} numberOfLines={1}>
                        {ex.name}
                      </Text>
                      {ex.subCategory ? (
                        <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 1 }}>{ex.subCategory}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Confirmar */}
          <TouchableOpacity
            style={[S.confirmBtn, { backgroundColor: theme.accent, opacity: selection.length === 0 ? 0.5 : 1 }]}
            onPress={onConfirm}
            disabled={selection.length === 0}
          >
            <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 14 }}>
              {selection.length > 0 ? `Confirmar ${selection.length} exercício(s)` : 'Selecione ao menos 1'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 30 },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 14 },
  title:      { fontSize: 16, fontWeight: '900' },
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, borderWidth: 1, marginBottom: 12 },
  searchInput:{ flex: 1, fontSize: 14, outlineStyle: 'none' },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 6, borderBottomWidth: 1, borderRadius: 8 },
  checkbox:   { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { padding: 15, borderRadius: 13, alignItems: 'center', marginTop: 14 },
});