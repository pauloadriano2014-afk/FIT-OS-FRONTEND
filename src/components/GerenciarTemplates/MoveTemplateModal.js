// src/components/BibliotecaAdmin/MoveTemplateModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export default function MoveTemplateModal({
  visible,
  onClose,
  collections,
  onMove,
}) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>MOVER PARA...</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 300 }}>
            <TouchableOpacity style={[styles.option, { borderBottomColor: theme.border }]} onPress={() => onMove(null)}>
              <MaterialCommunityIcons name="folder-outline" size={20} color={theme.textSecondary} />
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>Remover da pasta (Avulso)</Text>
            </TouchableOpacity>

            {collections.map(col => (
              <TouchableOpacity
                key={col.id}
                style={[styles.option, { borderBottomColor: theme.border }]}
                onPress={() => onMove(col.id)}
              >
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: col.color }} />
                <Text style={{ color: col.color, fontWeight: 'bold' }}>{col.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18, borderBottomWidth: 1 },
});