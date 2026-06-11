// src/components/GerarTreino/CycleConfigPanel.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CYCLE_PHASES, TECHNIQUES, TRAINING_ENVIRONMENTS } from './_constants';

export default function CycleConfigPanel({ g, theme }) {
  return (
    <View>
      {/* 🔥 SELETOR DE INTELIGÊNCIA ARTIFICIAL 🔥 */}
      <Text style={[S.sectionTitle, { color: theme.textSecondary }]}>CÉREBRO DA IA</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'GEMINI', label: 'Gemini 2.5', icon: 'google-circles-extended', color: '#8A2BE2' }, // Roxo/Azul do Google
          { id: 'GPT', label: 'GPT-4o', icon: 'robot-outline', color: '#10A37F' }, // Verde da OpenAI
          { id: 'CLAUDE', label: 'Claude 3.5', icon: 'brain', color: '#D97757' } // Laranja da Anthropic
        ].map(ai => {
          const isSel = g.selectedAI === ai.id;
          return (
            <TouchableOpacity 
              key={ai.id} 
              style={[S.aiBtn, { backgroundColor: isSel ? ai.color + '20' : theme.surface, borderColor: isSel ? ai.color : theme.border }]} 
              onPress={() => g.setSelectedAI(ai.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={ai.icon} size={16} color={isSel ? ai.color : theme.textSecondary} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: isSel ? ai.color : theme.textSecondary }}>{ai.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* AMBIENTE DE TREINO */}
      <Text style={[S.sectionTitle, { color: theme.textSecondary }]}>AMBIENTE DE TREINO</Text>
      <TouchableOpacity style={[S.envDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => g.setShowEnvPicker(true)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {(() => {
            const env = TRAINING_ENVIRONMENTS.find(e => e.id === g.trainingEnvironment);
            return (
              <>
                <View style={[S.envIcon, { backgroundColor: (env?.color || theme.accent) + '20' }]}>
                  <MaterialCommunityIcons name={env?.icon || 'earth'} size={16} color={env?.color || theme.accent} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{env?.label || 'Selecionar'}</Text>
              </>
            );
          })()}
        </View>
        <MaterialCommunityIcons name="chevron-down" size={18} color={theme.textSecondary} />
      </TouchableOpacity>

      {/* MODAL AMBIENTE */}
      <Modal visible={g.showEnvPicker} transparent animationType="slide" onRequestClose={() => g.setShowEnvPicker(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={S.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[S.modalTitle, { color: theme.text }]}>Ambiente de Treino</Text>
              <TouchableOpacity onPress={() => g.setShowEnvPicker(false)}>
                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 460 }}>
              {TRAINING_ENVIRONMENTS.map(env => {
                const isSel = g.trainingEnvironment === env.id;
                return (
                  <TouchableOpacity key={env.id} style={[S.pickerRow, { borderBottomColor: theme.border, backgroundColor: isSel ? env.color + '10' : 'transparent' }]}
                    onPress={() => { g.setTrainingEnvironment(env.id); g.setShowEnvPicker(false); }}>
                    <View style={[S.envIcon, { backgroundColor: env.color + '20' }]}>
                      <MaterialCommunityIcons name={env.icon} size={16} color={env.color} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: isSel ? '900' : '700', color: isSel ? env.color : theme.text, flex: 1 }}>{env.label}</Text>
                    {isSel && <MaterialCommunityIcons name="check-circle" size={18} color={env.color} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FASE DO CICLO */}
      <Text style={[S.sectionTitle, { color: theme.textSecondary }]}>FASE DO CICLO</Text>
      <View style={{ gap: 8, marginBottom: 20 }}>
        {[CYCLE_PHASES.slice(0, 3), CYCLE_PHASES.slice(3)].map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map(phase => {
              const isSel = g.cyclePhase === phase.id;
              return (
                <TouchableOpacity key={phase.id} style={[S.phaseCard, { flex: 1, backgroundColor: isSel ? phase.color + '20' : theme.surface, borderColor: isSel ? phase.color : theme.border }]}
                  onPress={() => g.setCyclePhase(phase.id)}>
                  <MaterialCommunityIcons name={phase.icon} size={18} color={isSel ? phase.color : theme.textSecondary} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isSel ? phase.color : theme.text }}>{phase.label}</Text>
                  <Text style={{ fontSize: 10, lineHeight: 14, color: theme.textSecondary }} numberOfLines={2}>{phase.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {['EMAGRECIMENTO', 'DEFINICAO'].includes(g.cyclePhase) && (
        <View style={[S.infoRow, { backgroundColor: '#FF9500' + '15', borderColor: '#FF9500' + '30', marginBottom: 16 }]}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#FF9500" />
          <Text style={{ fontSize: 12, color: '#FF9500', flex: 1 }}>Cardio de 300kcal será adicionado automaticamente nos dias de superiores e abdômen.</Text>
        </View>
      )}

      {/* TÉCNICAS */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={[S.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>TÉCNICAS</Text>
        <View style={[S.segmented, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          {['CYCLE', 'DAY'].map(scope => (
            <TouchableOpacity key={scope} style={[S.segmentBtn, g.techniqueScope === scope && { backgroundColor: theme.accent }]} onPress={() => g.setTechniqueScope(scope)}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: g.techniqueScope === scope ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }}>
                {scope === 'CYCLE' ? 'Ciclo' : 'Por Dia'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
        {TECHNIQUES.map(tech => {
          const isSel = g.selectedTechniques.includes(tech.id);
          return (
            <TouchableOpacity key={tech.id} style={[S.techChip, { backgroundColor: isSel ? theme.accent + '20' : theme.surface, borderColor: isSel ? theme.accent : theme.border }]}
              onPress={() => g.toggleTechnique(tech.id)}>
              {isSel && <MaterialCommunityIcons name="check" size={11} color={theme.accent} />}
              <Text style={{ fontSize: 12, fontWeight: '700', color: isSel ? theme.accent : theme.textSecondary }}>{tech.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 },
  aiBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 }, // 🔥 Estilo novo do Botão IA
  envDropdown:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 13, borderWidth: 1, marginBottom: 20 },
  envIcon:      { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet:   { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 36 },
  modalHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 14 },
  modalTitle:   { fontSize: 16, fontWeight: '900' },
  pickerRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
  phaseCard:    { borderRadius: 12, padding: 12, borderWidth: 1, gap: 4 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 9, borderRadius: 9, borderWidth: 1 },
  segmented:    { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', padding: 2, gap: 2 },
  segmentBtn:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  techChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
});