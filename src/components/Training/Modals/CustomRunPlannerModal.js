// src/components/Training/Modals/CustomRunPlannerModal.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomRunPlannerModal({ visible, onClose, theme, onSaveCustomWorkout }) {
  const [title, setTitle] = useState('');
  const [phases, setPhases] = useState([]);

  // Adiciona uma nova fase (peça de Lego) à estrutura do treino
  const addPhase = (type, defaultMinutes) => {
    const newPhase = {
      id: Date.now().toString() + Math.random().toString(),
      fase: type,
      tempo: `${defaultMinutes} min`, // O motor ActiveRunModal já sabe interpretar este formato
      minutes: defaultMinutes,
      esteira: '--',
      rua: '--'
    };
    setPhases([...phases, newPhase]);
  };

  // Remove uma fase específica da lista
  const removePhase = (id) => {
    setPhases(phases.filter(p => p.id !== id));
  };

  // Ajusta o tempo da fase adicionando ou subtraindo minutos
  const adjustTime = (id, amount) => {
    setPhases(phases.map(p => {
      if (p.id === id) {
        const newMin = Math.max(1, p.minutes + amount);
        return { ...p, minutes: newMin, tempo: `${newMin} min` };
      }
      return p;
    }));
  };

  const totalMinutes = phases.reduce((acc, p) => acc + p.minutes, 0);

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, dê um nome ao seu planejamento.');
      return;
    }
    if (phases.length === 0) {
      alert('Adicione pelo menos uma fase ao seu treino.');
      return;
    }
    
    // Passa o objeto completo estruturado para o Hook gerenciar o salvamento permanente
    onSaveCustomWorkout({
      id: Date.now().toString(),
      title: title.trim(),
      phases,
      totalMinutes
    });
    
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setPhases([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconBox, { backgroundColor: '#AF52DE22' }]}>
                <MaterialCommunityIcons name="hammer-wrench" size={20} color="#AF52DE" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>PLANEJAR CORRIDA</Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Monte e salve seus treinos estruturados</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 6 }}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            
            {/* INPUT DE NOME DO TREINO */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>NOME DO PLANEJAMENTO *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              placeholder="Ex: Meus Tiros de Terça, Longão de Domingo..."
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              outlineStyle="none"
            />

            <View style={{ height: 24 }} />

            {/* SELETOR DE FASES */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>ADICIONAR FASE AO TREINO</Text>
            <View style={styles.toolsRow}>
              <TouchableOpacity style={[styles.toolBtn, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => addPhase('Aquecimento', 5)}>
                <MaterialCommunityIcons name="fire" size={18} color="#f59e0b" />
                <Text style={[styles.toolText, { color: theme.text }]}>Aquecer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => addPhase('Trote', 10)}>
                <MaterialCommunityIcons name="run" size={18} color="#3b82f6" />
                <Text style={[styles.toolText, { color: theme.text }]}>Trote</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => addPhase('Corrida', 5)}>
                <MaterialCommunityIcons name="run-fast" size={18} color="#22c55e" />
                <Text style={[styles.toolText, { color: theme.text }]}>Corrida</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={() => addPhase('Caminhada', 2)}>
                <MaterialCommunityIcons name="walk" size={18} color={theme.textSecondary} />
                <Text style={[styles.toolText, { color: theme.text }]}>Caminhar</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 0 }]}>ESTRUTURA DO TREINO</Text>
              <Text style={[styles.totalText, { color: theme.text }]}>Total: <Text style={{ color: '#AF52DE', fontWeight: '900' }}>{totalMinutes} min</Text></Text>
            </View>

            {/* PREVIEW DAS FASES MONTADAS */}
            {phases.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                <MaterialCommunityIcons name="puzzle-outline" size={32} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Toque nos botões de fase para montar a estrutura do seu treino.</Text>
              </View>
            ) : (
              phases.map((p, index) => (
                <View key={p.id} style={[styles.phaseRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={[styles.phaseNumberBadge, { backgroundColor: theme.border }]}>
                    <Text style={[styles.phaseNumberText, { color: theme.textSecondary }]}>{index + 1}</Text>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.phaseName, { color: theme.text }]}>{p.fase.toUpperCase()}</Text>
                  </View>

                  <View style={styles.timeControl}>
                    <TouchableOpacity onPress={() => adjustTime(p.id, -1)} style={[styles.timeBtn, { borderColor: theme.border }]}>
                      <MaterialCommunityIcons name="minus" size={14} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.timeText, { color: theme.text }]}>{p.minutes}m</Text>
                    <TouchableOpacity onPress={() => adjustTime(p.id, 1)} style={[styles.timeBtn, { borderColor: theme.border }]}>
                      <MaterialCommunityIcons name="plus" size={14} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={() => removePhase(p.id)} style={styles.deleteBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}

          </ScrollView>

          {/* RODAPÉ COM AÇÃO DE SALVAR */}
          {phases.length > 0 && (
            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              <TouchableOpacity style={styles.startBtn} onPress={handleSave}>
                <MaterialCommunityIcons name="content-save-outline" size={22} color="#FFF" />
                <Text style={styles.startBtnText}>SALVAR PLANEJAMENTO</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { height: '90%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 15, fontWeight: '600', outlineStyle: 'none' },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  toolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  toolText: { fontSize: 12, fontWeight: '800' },
  divider: { height: 1, width: '100%', marginVertical: 24 },
  totalText: { fontSize: 14, fontWeight: '800' },
  emptyBox: { padding: 40, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  emptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  phaseNumberBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  phaseNumberText: { fontSize: 10, fontWeight: '900' },
  phaseName: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  timeControl: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 12 },
  timeBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 13, fontWeight: '900', minWidth: 28, textAlign: 'center' },
  deleteBtn: { padding: 6 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
  startBtn: { backgroundColor: '#AF52DE', flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', padding: 18, borderRadius: 16 },
  startBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});