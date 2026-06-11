// src/components/Training/Modals/SessionModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SESSION_ICONS, SESSION_COLORS } from '../../../utils/runningConstants';

export default function SessionModal({ visible, onClose, session, blockData, theme, saving, onSave, customSpeeds, customNotes, onStartRun, initialDuration }) {
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [notes, setNotes] = useState('');
  const [rpe, setRpe] = useState(null);

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

  const handleClose = () => { onClose(); };
  
  const handleSave = () => { 
    if (!duration || !distance) {
      if (Platform.OS === 'web') window.alert("Preencha pelo menos a duração e a distância.");
      else alert("Preencha pelo menos a duração e a distância.");
      return;
    }
    onSave({ durationMinutes: duration, distanceKm: distance, avgPace: pace, notes, rpe }); 
  };

  if (!session) return null;
  const sessionData = blockData?.sessions?.[session.day];
  const color = SESSION_COLORS[session.day];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
                <MaterialCommunityIcons name={SESSION_ICONS[session.day]} size={20} color={color} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{session.day}</Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{sessionData?.title || ''} · Sem. {session.week}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 6 }}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity style={[styles.startBtn, { backgroundColor: color }]} onPress={() => { onClose(); onStartRun(session.day); }}>
              <MaterialCommunityIcons name="play-circle" size={24} color="#000" />
              <Text style={styles.startBtnText}>INICIAR CRONÔMETRO</Text>
            </TouchableOpacity>

            {sessionData?.phases && (
              <View style={[styles.phaseTable, { borderColor: theme.border }]}>
                <View style={[styles.phaseHeaderRow, { backgroundColor: color + '22' }]}>
                  {['FASE', 'TEMPO', 'ESTEIRA', 'RUA'].map((h, i) => (
                    <Text key={i} style={[styles.phaseHeaderCell, { color: color, flex: i === 0 ? 1.5 : 1 }]}>{h}</Text>
                  ))}
                </View>
                {sessionData.phases.map((p, idx) => (
                  <View key={idx} style={[styles.phaseRow, { borderBottomColor: theme.border }, idx % 2 === 0 && { backgroundColor: theme.bg }]}>
                    <Text style={[styles.phaseCell, { color: theme.text, flex: 1.5 }]}>{p.fase}</Text>
                    <Text style={[styles.phaseCell, { color: theme.textSecondary }]}>{p.tempo}</Text>
                    <Text style={[styles.phaseCell, { color: theme.textSecondary }]}>{p.esteira}</Text>
                    <Text style={[styles.phaseCell, { color: theme.textSecondary }]}>{p.rua}</Text>
                  </View>
                ))}
              </View>
            )}

            {customSpeeds && (
              <View style={[styles.customSpeedsCard, { backgroundColor: theme.bg, borderColor: color + '44' }]}>
                <Text style={[styles.customSpeedsTitle, { color: color }]}>⚡ VELOCIDADES SUGERIDAS</Text>
                <View style={styles.speedsRow}>
                  {Object.entries(customSpeeds).map(([zone, speed]) => (
                    <View key={zone} style={[styles.speedChip, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.speedChipZone, { color: color }]}>{zone.toUpperCase()}</Text>
                      <Text style={[styles.speedChipVal, { color: theme.text }]}>{speed} km/h</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.divider, { borderColor: theme.border }]}>
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>REGISTRAR TREINO</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DURAÇÃO (MIN) *</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 30" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={duration} onChangeText={setDuration} outlineStyle="none" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DISTÂNCIA (KM) *</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 3.2" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" value={distance} onChangeText={setDistance} outlineStyle="none" />
              </View>
            </View>
            
            <TextInput style={[styles.input, { marginTop: 14, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Pace Médio (Ex: 7:30)" placeholderTextColor={theme.textSecondary} value={pace} onChangeText={setPace} outlineStyle="none" />
            
            <View style={styles.rpeRow}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <TouchableOpacity key={n} style={[styles.rpeBtn, { borderColor: rpe === n ? color : theme.border, backgroundColor: rpe === n ? color : theme.bg }]} onPress={() => setRpe(n)}>
                  <Text style={[styles.rpeBtnText, { color: rpe === n ? '#000' : theme.textSecondary }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput style={[styles.textarea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Como foi o treino?" placeholderTextColor={theme.textSecondary} multiline value={notes} onChangeText={setNotes} outlineStyle="none" />
            
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: color, opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveBtnText}>REGISTRAR TREINO</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { height: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 16, marginBottom: 20 },
  startBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  phaseTable: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  phaseHeaderRow: { flexDirection: 'row', padding: 10 },
  phaseHeaderCell: { flex: 1, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  phaseRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1 },
  phaseCell: { flex: 1, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  customSpeedsCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  customSpeedsTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginBottom: 10 },
  speedsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speedChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  speedChipZone: { fontSize: 10, fontWeight: '900' },
  speedChipVal: { fontSize: 14, fontWeight: '900' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, borderTopWidth: 1, paddingTop: 16 },
  dividerText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 15, fontWeight: '600', outlineStyle: 'none' },
  textarea: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 14, minHeight: 80, textAlignVertical: 'top', lineHeight: 22, outlineStyle: 'none' },
  rpeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  rpeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rpeBtnText: { fontSize: 13, fontWeight: '900' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 16, marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 1, color: '#000' },
});