// src/components/BibliotecaAdmin/CollectionModal.js
import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const FOLDER_COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#a855f7',
  '#f97316', '#ec4899', '#06b6d4', '#eab308', '#6366f1', '#888888',
];

export default function CollectionModal({
  visible,
  onClose,
  colName,
  setColName,
  colColor,
  setColColor,
  editingCollectionId,
  onSave,
}) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colColor }]}>
              {editingCollectionId ? 'EDITAR COLEÇÃO' : 'NOVA COLEÇÃO'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>NOME DO PROGRAMA OU PASTA</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bg, borderColor: colColor, color: theme.text }]}
            value={colName}
            onChangeText={setColName}
            placeholder="Ex: Seca Rápido 30 Dias"
            placeholderTextColor={theme.textSecondary}
          />

          <Text style={styles.label}>COR DE DESTAQUE</Text>
          <View style={styles.colorGrid}>
            {FOLDER_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.colorCircle, { backgroundColor: color }, colColor === color && styles.colorSelected]}
                onPress={() => setColColor(color)}
              >
                {colColor === color && <MaterialCommunityIcons name="check" size={20} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: colColor }]} onPress={onSave}>
            <Text style={[styles.btnText, { color: '#FFF' }]}>
              {editingCollectionId ? 'SALVAR ALTERAÇÕES' : 'CRIAR COLEÇÃO'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  content: { padding: 25, borderRadius: 24, borderWidth: 1, maxWidth: 440, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },
  label: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, fontWeight: 'bold', marginBottom: 25, outlineStyle: 'none' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  colorCircle: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#FFF', elevation: 5 },
  btn: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  btnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});