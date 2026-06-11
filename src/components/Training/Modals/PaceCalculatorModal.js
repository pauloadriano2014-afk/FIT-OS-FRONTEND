// src/components/Training/Modals/PaceCalculatorModal.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PaceCalculatorModal({ visible, onClose, theme }) {
  // O que o usuário quer descobrir? 'pace', 'time', ou 'distance'
  const [calcTarget, setCalcTarget] = useState('pace'); 
  
  const [distance, setDistance] = useState('');
  const [time, setTime] = useState(''); // Formato MM:SS ou HH:MM:SS
  const [pace, setPace] = useState(''); // Formato MM:SS
  const [result, setResult] = useState(null);

  // Converte string "MM:SS" ou "HH:MM:SS" para segundos totais
  const timeToSeconds = (str) => {
    if (!str) return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  // Converte segundos totais para string "MM:SS" ou "HH:MM:SS"
  const secondsToTime = (secs, forceHours = false) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.round(secs % 60);
    
    const pad = (num) => num.toString().padStart(2, '0');
    
    if (h > 0 || forceHours) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const handleCalculate = () => {
    const distNum = parseFloat(distance.replace(',', '.'));
    
    if (calcTarget === 'pace') {
      if (!distNum || !time) return;
      const totalSecs = timeToSeconds(time);
      const paceSecs = totalSecs / distNum;
      setResult(`Seu pace será de ${secondsToTime(paceSecs)} /km`);
    } 
    else if (calcTarget === 'time') {
      if (!distNum || !pace) return;
      const paceSecs = timeToSeconds(pace);
      const totalSecs = paceSecs * distNum;
      setResult(`Seu tempo final será de ${secondsToTime(totalSecs, true)}`);
    } 
    else if (calcTarget === 'distance') {
      if (!time || !pace) return;
      const totalSecs = timeToSeconds(time);
      const paceSecs = timeToSeconds(pace);
      const dist = totalSecs / paceSecs;
      setResult(`Você vai percorrer ${dist.toFixed(2)} km`);
    }
  };

  const reset = () => {
    setDistance(''); setTime(''); setPace(''); setResult(null);
  };

  const closeModal = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeModal}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconBox, { backgroundColor: '#22c55e22' }]}>
                <MaterialCommunityIcons name="calculator" size={20} color="#22c55e" />
              </View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>CALCULADORA DE PACE</Text>
            </View>
            <TouchableOpacity onPress={closeModal} style={{ padding: 6 }}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.label, { color: theme.textSecondary, textAlign: 'center', marginBottom: 12 }]}>O QUE VOCÊ QUER DESCOBRIR?</Text>
            <View style={styles.tabRow}>
              {[
                { id: 'pace', label: 'PACE', icon: 'speedometer' },
                { id: 'time', label: 'TEMPO', icon: 'timer-outline' },
                { id: 'distance', label: 'DISTÂNCIA', icon: 'map-marker-distance' }
              ].map(tab => (
                <TouchableOpacity 
                  key={tab.id} 
                  style={[styles.tabBtn, { borderColor: calcTarget === tab.id ? '#22c55e' : theme.border, backgroundColor: calcTarget === tab.id ? '#22c55e22' : theme.bg }]}
                  onPress={() => { setCalcTarget(tab.id); reset(); }}
                >
                  <MaterialCommunityIcons name={tab.icon} size={16} color={calcTarget === tab.id ? '#22c55e' : theme.textSecondary} />
                  <Text style={[styles.tabText, { color: calcTarget === tab.id ? '#22c55e' : theme.textSecondary }]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ gap: 16, marginTop: 20 }}>
              {calcTarget !== 'distance' && (
                <View>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>DISTÂNCIA (KM)</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 5 ou 10.5" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" value={distance} onChangeText={setDistance} outlineStyle="none" />
                </View>
              )}
              
              {calcTarget !== 'time' && (
                <View>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>TEMPO TOTAL (HH:MM:SS ou MM:SS)</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 25:00 ou 01:45:00" placeholderTextColor={theme.textSecondary} value={time} onChangeText={setTime} outlineStyle="none" />
                </View>
              )}

              {calcTarget !== 'pace' && (
                <View>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>PACE (MM:SS /km)</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 5:30" placeholderTextColor={theme.textSecondary} value={pace} onChangeText={setPace} outlineStyle="none" />
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate}>
              <Text style={styles.calcBtnText}>CALCULAR</Text>
            </TouchableOpacity>

            {result && (
              <View style={[styles.resultBox, { backgroundColor: '#22c55e11', borderColor: '#22c55e' }]}>
                <MaterialCommunityIcons name="flag-checkered" size={24} color="#22c55e" />
                <Text style={[styles.resultText, { color: '#22c55e' }]}>{result}</Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  iconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  tabText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 16, fontWeight: '700' },
  calcBtn: { backgroundColor: '#22c55e', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  calcBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  resultBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20, padding: 16, borderRadius: 14, borderWidth: 1 },
  resultText: { fontSize: 15, fontWeight: '900' }
});