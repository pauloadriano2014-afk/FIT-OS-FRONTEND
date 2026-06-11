// src/components/Training/Modals/FreeRunModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function FreeRunModal({ visible, onClose, theme, onSave, saving, initialDuration }) {
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [rpe, setRpe] = useState(null);
  const [notes, setNotes] = useState('');

  // 🔥 BLINDAGEM MÁXIMA: Zera e injeta os dados exatamente no milissegundo que abre
  useEffect(() => {
    if (visible) {
      setDuration(initialDuration ? String(initialDuration) : '');
      setDistance('');
      setPace('');
      setNotes('');
      setRpe(null);
    }
  }, [visible, initialDuration]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    if (!duration || !distance) {
      if (Platform.OS === 'web') {
        window.alert("Por favor, preencha pelo menos a duração e a distância.");
      } else {
        alert("Por favor, preencha pelo menos a duração e a distância.");
      }
      return;
    }

    const runData = {
      isFreeRun: true,
      durationMinutes: duration,
      distanceKm: distance,
      avgPace: pace,
      rpe: rpe,
      notes: notes,
      date: new Date().toISOString()
    };

    onSave(runData);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconBox, { backgroundColor: '#3b82f622' }]}>
                <MaterialCommunityIcons name="run" size={24} color="#3b82f6" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>REGISTRAR CORRIDA</Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Guarde os dados do seu treino no diário</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 6 }}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DURAÇÃO (MIN) *</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                  placeholder="Ex: 45" 
                  placeholderTextColor={theme.textSecondary} 
                  keyboardType="numeric" 
                  value={duration} 
                  onChangeText={setDuration} 
                  outlineStyle="none" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DISTÂNCIA (KM) *</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                  placeholder="Ex: 6.5" 
                  placeholderTextColor={theme.textSecondary} 
                  keyboardType="decimal-pad" 
                  value={distance} 
                  onChangeText={setDistance} 
                  outlineStyle="none" 
                />
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PACE MÉDIO (MM:SS) Opcional</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                placeholder="Ex: 5:45" 
                placeholderTextColor={theme.textSecondary} 
                value={pace} 
                onChangeText={setPace} 
                outlineStyle="none" 
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>ESFORÇO PERCEBIDO (RPE 1–10)</Text>
              <View style={styles.rpeRow}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <TouchableOpacity 
                    key={n} 
                    style={[styles.rpeBtn, { borderColor: rpe === n ? '#3b82f6' : theme.border, backgroundColor: rpe === n ? '#3b82f6' : theme.bg }]} 
                    onPress={() => setRpe(n)}
                  >
                    <Text style={[styles.rpeBtnText, { color: rpe === n ? '#000' : theme.textSecondary }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>OBSERVAÇÕES (OPCIONAL)</Text>
              <TextInput 
                style={[styles.textarea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                placeholder="Como se sentiu hoje?" 
                placeholderTextColor={theme.textSecondary} 
                multiline 
                value={notes} 
                onChangeText={setNotes} 
                outlineStyle="none" 
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: '#3b82f6', opacity: saving ? 0.7 : 1 }]} 
              onPress={handleSave} 
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="#000" /> : (
                <>
                  <MaterialCommunityIcons name="content-save" size={20} color="#000" />
                  <Text style={styles.saveBtnText}>SALVAR CORRIDA</Text>
                </>
              )}
            </TouchableOpacity>
            
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: { height: '85%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 16, fontWeight: '700' },
  textarea: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 14, minHeight: 80, textAlignVertical: 'top', lineHeight: 22 },
  rpeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rpeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rpeBtnText: { fontSize: 13, fontWeight: '900' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 16 },
  saveBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 1, color: '#000' },
});