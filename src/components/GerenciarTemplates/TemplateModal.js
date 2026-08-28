// src/components/BibliotecaAdmin/TemplateModal.js
import React from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export default function TemplateModal({
  visible,
  onClose,
  selectedCollection,
  newTempName, setNewTempName,
  newTempGoal, setNewTempGoal,
  newTempLevel, setNewTempLevel,
  isImportingAI,
  onImportPDF,
  onCreateManual,
}) {
  const { theme } = useTheme();
  const accent = selectedCollection ? selectedCollection.color : theme.accent;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          <View style={styles.header}>
            <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
              NOVO TREINO {selectedCollection ? `EM ${selectedCollection.name.toUpperCase()}` : ''}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {isImportingAI ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={accent} />
              <Text style={{ color: theme.text, marginTop: 10, fontWeight: 'bold' }}>IA PROCESSANDO PDF...</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <TouchableOpacity style={[styles.btnSolid, { backgroundColor: accent }]} onPress={() => onImportPDF('FULL')}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFF" />
                <Text style={[styles.btnSolidText, { color: '#FFF' }]}>IMPORTAR ROTINA INTEIRA (PDF)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.btnOutline, { borderColor: accent }]} onPress={() => onImportPDF('SINGLE')}>
                <MaterialCommunityIcons name="magic-staff" size={20} color={accent} />
                <Text style={[styles.btnOutlineText, { color: accent }]}>IMPORTAR 1 TREINO AVULSO (PDF)</Text>
              </TouchableOpacity>

            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>NOME DO MODELO (OPCIONAL)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newTempName}
              onChangeText={setNewTempName}
              placeholder="Ex: Treino A - Quadríceps"
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={styles.label}>OBJETIVO PRINCIPAL</Text>
            <View style={styles.chipRow}>
              {['Hipertrofia', 'Emagrecimento', 'Força'].map(g => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setNewTempGoal(g)}
                  style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border },
                    newTempGoal === g && { backgroundColor: accent, borderColor: accent }]}
                >
                  <Text style={[styles.chipText, { color: theme.textSecondary },
                    newTempGoal === g && { color: theme.isDark ? '#000' : '#FFF' }]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>NÍVEL DO ALUNO</Text>
            <View style={styles.chipRow}>
              {['Iniciante', 'Intermediário', 'Avançado'].map(l => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setNewTempLevel(l)}
                  style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border },
                    newTempLevel === l && { backgroundColor: accent, borderColor: accent }]}
                >
                  <Text style={[styles.chipText, { color: theme.textSecondary },
                    newTempLevel === l && { color: theme.isDark ? '#000' : '#FFF' }]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.btnManual, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={onCreateManual}
            >
              <Text style={[styles.btnManualText, { color: theme.text }]}>MONTAR MANUALMENTE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  content: { padding: 25, borderRadius: 24, borderWidth: 1, maxWidth: 440, alignSelf: 'center', width: '100%', maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5, flex: 1 },
  btnSolid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, gap: 8 },
  btnSolidText: { fontWeight: '900', fontSize: 13 },
  btnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  btnOutlineText: { fontWeight: 'bold', fontSize: 12 },
  divider: { height: 1, width: '100%', marginVertical: 20 },
  label: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, fontWeight: 'bold', outlineStyle: 'none' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: 'bold' },
  btnManual: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10, borderWidth: 1 },
  btnManualText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});