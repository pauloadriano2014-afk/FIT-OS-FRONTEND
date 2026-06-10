// src/components/Training/RunningTab.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, ActivityIndicator, Platform, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Shadow } from 'react-native-shadow-2';

// ─── Dados do protocolo 5K ────────────────────────────────────────────────────
const PROTOCOL_DATA = {
  1: {
    label: 'Bloco 1 — Adaptação',
    weeks: '1 e 2',
    objective: 'Adaptação, pulmão, articulações e coordenação da corrida.',
    sessions: {
      QUARTA: {
        title: 'Caminhada + Corrida Leve',
        phases: [
          { fase: 'Caminhada', tempo: '5 min', esteira: '5.5–6.0 km/h', rua: '10:00 /km' },
          { fase: 'Corrida leve', tempo: '2 min', esteira: '7.5 km/h', rua: '7:45–8:00 /km' },
          { fase: 'Caminhada', tempo: '2 min', esteira: '5.5 km/h', rua: '10:00 /km' },
          { fase: 'Repetir', tempo: '× 6', esteira: '—', rua: '—' },
          { fase: 'Total', tempo: '30 min', esteira: '—', rua: '—' },
        ],
      },
      SEXTA: {
        title: 'Intervalado Leve',
        phases: [
          { fase: 'Aquecimento', tempo: '5 min', esteira: '6.0–7.0 km/h', rua: '9:30 /km' },
          { fase: 'Corrida moderada', tempo: '1 min', esteira: '8.0–8.5 km/h', rua: '6:50–7:10 /km' },
          { fase: 'Caminhada', tempo: '1 min', esteira: '5.5–6.0 km/h', rua: '10:00 /km' },
          { fase: 'Repetir', tempo: '× 10', esteira: '—', rua: '—' },
          { fase: 'Total', tempo: '25 min', esteira: '—', rua: '—' },
        ],
      },
      DOMINGO: {
        title: 'Longão Leve',
        phases: [
          { fase: 'Corrida leve', tempo: '30 min', esteira: '7.5–7.8 km/h', rua: '7:45–8:15 /km' },
        ],
      },
    },
  },
  2: {
    label: 'Bloco 2 — Resistência Base',
    weeks: '3 e 4',
    objective: 'Correr mais tempo sem parar (base sólida de resistência).',
    sessions: {
      QUARTA: {
        title: 'Corrida Contínua',
        phases: [
          { fase: 'Leve', tempo: '5 min', esteira: '7.5 km/h', rua: '8:20 /km' },
          { fase: 'Corrida contínua', tempo: '15–20 min', esteira: '7.8–8.0 km/h', rua: '7:30–8:00 /km' },
          { fase: 'Leve', tempo: '5 min', esteira: '7.0 km/h', rua: '8:40 /km' },
        ],
      },
      SEXTA: {
        title: 'Intervalado Moderado',
        phases: [
          { fase: 'Aquecimento', tempo: '5 min', esteira: '7.0 km/h', rua: '9:00 /km' },
          { fase: 'Forte', tempo: '2 min', esteira: '9.0 km/h', rua: '6:20–6:50 /km' },
          { fase: 'Caminhada', tempo: '1 min', esteira: '5.5 km/h', rua: '10:00 /km' },
          { fase: 'Repetir', tempo: '× 8', esteira: '—', rua: '—' },
          { fase: 'Leve', tempo: '3–4 min', esteira: '7.0 km/h', rua: '9:00 /km' },
        ],
      },
      DOMINGO: {
        title: 'Longão Aumentado',
        phases: [
          { fase: 'Corrida leve', tempo: '35–40 min', esteira: '7.5–7.8 km/h', rua: '7:50–8:20 /km' },
        ],
      },
    },
  },
  3: {
    label: 'Bloco 3 — Sustentar Ritmo',
    weeks: '5 e 6',
    objective: 'Aprender a sustentar ritmo e correr 25+ min direto.',
    sessions: {
      QUARTA: {
        title: 'Ritmo Leve',
        phases: [
          { fase: 'Leve', tempo: '5 min', esteira: '7.5 km/h', rua: '8:30 /km' },
          { fase: 'Corrida contínua', tempo: '25 min', esteira: '8.0–8.2 km/h', rua: '7:20–7:45 /km' },
          { fase: 'Leve', tempo: '3 min', esteira: '7.0 km/h', rua: '9:00 /km' },
        ],
      },
      SEXTA: {
        title: 'Intervalado Forte',
        phases: [
          { fase: 'Aquecimento', tempo: '5 min', esteira: '7.0 km/h', rua: '9:00 /km' },
          { fase: 'Forte', tempo: '2 min', esteira: '9.5–10.0 km/h', rua: '6:00–6:30 /km' },
          { fase: 'Leve', tempo: '1 min', esteira: '6.0 km/h', rua: '9:20 /km' },
          { fase: 'Repetir', tempo: '× 10', esteira: '—', rua: '—' },
        ],
      },
      DOMINGO: {
        title: 'Treino Mental + Ritmo',
        phases: [
          { fase: 'Leve', tempo: '10 min', esteira: '7.5 km/h', rua: '8:40 /km' },
          { fase: 'Ritmo moderado', tempo: '15 min', esteira: '8.3–8.6 km/h', rua: '7:00–7:20 /km' },
          { fase: 'Leve', tempo: '10 min', esteira: '7.0 km/h', rua: '9:10 /km' },
        ],
      },
    },
  },
  4: {
    label: 'Bloco 4 — Pré-Performance',
    weeks: '7',
    objective: 'Ficar muito perto dos 5 km (entre 3,5 e 4,5 km).',
    sessions: {
      QUARTA: {
        title: 'Ritmo Contínuo',
        phases: [
          { fase: 'Corrida contínua', tempo: '30 min', esteira: '8.0–8.4 km/h', rua: '7:00–7:30 /km' },
        ],
      },
      SEXTA: {
        title: 'Intervalado Limiar',
        phases: [
          { fase: 'Aquecimento', tempo: '5 min', esteira: '7.0 km/h', rua: '9:00 /km' },
          { fase: 'Forte', tempo: '3 min', esteira: '9.5–10.0 km/h', rua: '6:00–6:40 /km' },
          { fase: 'Leve', tempo: '1 min', esteira: '6.0 km/h', rua: '9:20 /km' },
          { fase: 'Repetir', tempo: '× 6', esteira: '—', rua: '—' },
        ],
      },
      DOMINGO: {
        title: 'Treino Mental + Ritmo',
        phases: [
          { fase: 'Corrida contínua', tempo: '4 km', esteira: '7.8–8.4 km/h', rua: '7:10–7:40 /km' },
        ],
      },
    },
  },
  5: {
    label: 'Bloco 5 — O 5KM',
    weeks: '8',
    objective: 'Alcançar a distância completa.',
    sessions: {
      QUARTA: {
        title: 'Corrida Leve',
        phases: [
          { fase: 'Corrida leve', tempo: '20 min', esteira: '7.5–7.8 km/h', rua: '8:00–8:30 /km' },
        ],
      },
      SEXTA: {
        title: 'Ativação',
        phases: [
          { fase: 'Forte', tempo: '1 min', esteira: '10.0–11.0 km/h', rua: '5:20–6:00 /km' },
          { fase: 'Leve', tempo: '1 min', esteira: '6.0 km/h', rua: '9:30 /km' },
          { fase: 'Repetir', tempo: '× 6', esteira: '—', rua: '—' },
        ],
      },
      DOMINGO: {
        title: '🏁 O 5KM',
        phases: [
          { fase: 'Corrida contínua', tempo: '5 KM', esteira: '8.0–8.3 km/h', rua: '7:10–7:45 /km' },
        ],
      },
    },
  },
};

const SESSION_ICONS = {
  QUARTA: 'run',
  SEXTA: 'lightning-bolt',
  DOMINGO: 'flag-checkered',
};

const SESSION_COLORS = {
  QUARTA: '#22c55e',
  SEXTA: '#f59e0b',
  DOMINGO: '#3b82f6',
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function RunningTab({ theme, useRunningHook }) {
  const {
    loading, protocol, currentWeek, currentBlock,
    logs, lastLog, progressPct,
    BLOCK_LABELS, SESSION_DAYS,
    sessionModalVisible, setSessionModalVisible,
    selectedSession, setSelectedSession,
    protocolModalVisible, setProtocolModalVisible,
    saving,
    handleOpenSession, handleSaveLog, isSessionDone,
  } = useRunningHook;

  const shadowOpt = {
    distance: 12,
    startColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.04)',
    offset: [0, 6],
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!protocol) {
    return (
      <View style={styles.sectionContainer}>
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="run-fast" size={48} color={theme.border} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            Nenhum protocolo de corrida ativo.
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
            Entre em contato com o Coach Paulo para iniciar.
          </Text>
        </View>
      </View>
    );
  }

  const blockData = PROTOCOL_DATA[currentBlock];

  return (
    <>
      {/* ── Card de Progresso ── */}
      <View style={styles.sectionContainer}>
        <Shadow {...shadowOpt} containerStyle={{ width: '100%' }} style={{ width: '100%' }}>
          <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>

            <View style={styles.progressHeader}>
              <View style={[styles.progressIconBox, { backgroundColor: '#22c55e22' }]}>
                <MaterialCommunityIcons name="run-fast" size={20} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.progressTitle, { color: theme.text }]}>PROTOCOLO 5K</Text>
                <Text style={[styles.progressSub, { color: theme.textSecondary }]}>
                  {BLOCK_LABELS[currentBlock]} · Semana {currentWeek}/8
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.infoBtn, { borderColor: theme.border }]}
                onPress={() => setProtocolModalVisible(true)}
              >
                <MaterialCommunityIcons name="book-open-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.infoBtnText, { color: theme.textSecondary }]}>VER PROTOCOLO</Text>
              </TouchableOpacity>
            </View>

            {/* Barra de progresso */}
            <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={[styles.progressPct, { color: theme.textSecondary }]}>
              {Math.round(progressPct)}% concluído
            </Text>

            {/* Último registro */}
            {lastLog && (
              <View style={[styles.lastLogRow, { borderTopColor: theme.border }]}>
                <MaterialCommunityIcons name="history" size={14} color={theme.textSecondary} />
                <Text style={[styles.lastLogText, { color: theme.textSecondary }]}>
                  Último treino: {new Date(lastLog.date).toLocaleDateString('pt-BR')}
                  {lastLog.distanceKm ? ` · ${lastLog.distanceKm}km` : ''}
                  {lastLog.avgPace ? ` · ${lastLog.avgPace}/km` : ''}
                </Text>
              </View>
            )}
          </View>
        </Shadow>
      </View>

      {/* ── Objetivo do bloco ── */}
      {blockData && (
        <View style={styles.sectionContainer}>
          <View style={[styles.objectiveCard, { backgroundColor: '#22c55e0d', borderColor: '#22c55e33' }]}>
            <MaterialCommunityIcons name="target" size={16} color="#22c55e" />
            <Text style={[styles.objectiveText, { color: '#22c55e' }]}>
              {blockData.objective}
            </Text>
          </View>
        </View>
      )}

      {/* ── Sessões da semana ── */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          TREINOS DESTA SEMANA
        </Text>

        {SESSION_DAYS.map((day) => {
          const done = isSessionDone(day);
          const sessionData = blockData?.sessions?.[day];
          const color = SESSION_COLORS[day];

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.sessionCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: done ? color + '66' : theme.border,
                  opacity: done ? 0.75 : 1,
                },
              ]}
              onPress={() => handleOpenSession(day)}
              activeOpacity={0.8}
            >
              <View style={[styles.sessionIconBox, { backgroundColor: color + '22' }]}>
                <MaterialCommunityIcons
                  name={done ? 'check-circle' : SESSION_ICONS[day]}
                  size={22}
                  color={done ? color : color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sessionDay, { color: done ? color : theme.text }]}>
                  {day}
                  {done ? ' ✓' : ''}
                </Text>
                <Text style={[styles.sessionTitle, { color: theme.textSecondary }]}>
                  {sessionData?.title || '—'}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={done ? 'check' : 'chevron-right'}
                size={20}
                color={done ? color : theme.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Histórico recente ── */}
      {logs.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            ÚLTIMOS REGISTROS
          </Text>
          {logs.slice(0, 3).map((log, idx) => (
            <View
              key={log.id || idx}
              style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={[styles.logBadge, { backgroundColor: SESSION_COLORS[log.sessionDay] + '22' }]}>
                <Text style={[styles.logBadgeText, { color: SESSION_COLORS[log.sessionDay] }]}>
                  {log.sessionDay}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.logDate, { color: theme.textSecondary }]}>
                  {new Date(log.date).toLocaleDateString('pt-BR')} · Sem. {log.week}
                </Text>
                <View style={styles.logStats}>
                  {log.durationMinutes && (
                    <Text style={[styles.logStat, { color: theme.text }]}>⏱ {log.durationMinutes}min</Text>
                  )}
                  {log.distanceKm && (
                    <Text style={[styles.logStat, { color: theme.text }]}>📍 {log.distanceKm}km</Text>
                  )}
                  {log.avgPace && (
                    <Text style={[styles.logStat, { color: theme.text }]}>⚡ {log.avgPace}/km</Text>
                  )}
                  {log.rpe && (
                    <Text style={[styles.logStat, { color: theme.text }]}>💪 RPE {log.rpe}/10</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ════════════════════════════════════════
          MODAL DE SESSÃO (detalhe + registro)
      ════════════════════════════════════════ */}
      <SessionModal
        visible={sessionModalVisible}
        onClose={() => { setSessionModalVisible(false); setSelectedSession(null); }}
        session={selectedSession}
        blockData={blockData}
        theme={theme}
        saving={saving}
        onSave={handleSaveLog}
        customSpeeds={protocol?.customSpeeds}
        customNotes={protocol?.customNotes}
        adaptations={protocol?.adaptations}
      />

      {/* ════════════════════════════════════════
          MODAL PROTOCOLO COMPLETO (leitura)
      ════════════════════════════════════════ */}
      <FullProtocolModal
        visible={protocolModalVisible}
        onClose={() => setProtocolModalVisible(false)}
        theme={theme}
      />
    </>
  );
}

// ─── Modal de Sessão ──────────────────────────────────────────────────────────
function SessionModal({ visible, onClose, session, blockData, theme, saving, onSave, customSpeeds, customNotes, adaptations }) {
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [notes, setNotes] = useState('');
  const [rpe, setRpe] = useState(null);

  const reset = () => { setDuration(''); setDistance(''); setPace(''); setNotes(''); setRpe(null); };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = () => {
    onSave({ durationMinutes: duration, distanceKm: distance, avgPace: pace, notes, rpe });
    reset();
  };

  if (!session) return null;

  const sessionData = blockData?.sessions?.[session.day];
  const color = SESSION_COLORS[session.day];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          {/* Header */}
          <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[modalStyles.iconBox, { backgroundColor: color + '22' }]}>
                <MaterialCommunityIcons name={SESSION_ICONS[session.day]} size={20} color={color} />
              </View>
              <View>
                <Text style={[modalStyles.headerTitle, { color: theme.text }]}>{session.day}</Text>
                <Text style={[modalStyles.headerSub, { color: theme.textSecondary }]}>
                  {sessionData?.title || ''} · Sem. {session.week}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 6 }}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Tabela de fases */}
            {sessionData?.phases && (
              <View style={[modalStyles.phaseTable, { borderColor: theme.border }]}>
                <View style={[modalStyles.phaseHeaderRow, { backgroundColor: color + '22' }]}>
                  <Text style={[modalStyles.phaseHeaderCell, { color: color, flex: 1.5 }]}>FASE</Text>
                  <Text style={[modalStyles.phaseHeaderCell, { color: color }]}>TEMPO</Text>
                  <Text style={[modalStyles.phaseHeaderCell, { color: color }]}>ESTEIRA</Text>
                  <Text style={[modalStyles.phaseHeaderCell, { color: color }]}>RUA</Text>
                </View>
                {sessionData.phases.map((p, idx) => (
                  <View
                    key={idx}
                    style={[
                      modalStyles.phaseRow,
                      { borderBottomColor: theme.border },
                      idx % 2 === 0 && { backgroundColor: theme.bg },
                    ]}
                  >
                    <Text style={[modalStyles.phaseCell, { color: theme.text, flex: 1.5 }]}>{p.fase}</Text>
                    <Text style={[modalStyles.phaseCell, { color: theme.textSecondary }]}>{p.tempo}</Text>
                    <Text style={[modalStyles.phaseCell, { color: theme.textSecondary }]}>{p.esteira}</Text>
                    <Text style={[modalStyles.phaseCell, { color: theme.textSecondary }]}>{p.rua}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Velocidades personalizadas */}
            {customSpeeds && (
              <View style={[modalStyles.customSpeedsCard, { backgroundColor: theme.bg, borderColor: color + '44' }]}>
                <Text style={[modalStyles.customSpeedsTitle, { color: color }]}>
                  ⚡ SUAS VELOCIDADES PERSONALIZADAS
                </Text>
                <View style={modalStyles.speedsRow}>
                  {Object.entries(customSpeeds).map(([zone, speed]) => (
                    <View key={zone} style={[modalStyles.speedChip, { backgroundColor: color + '22' }]}>
                      <Text style={[modalStyles.speedChipZone, { color: color }]}>{zone.toUpperCase()}</Text>
                      <Text style={[modalStyles.speedChipVal, { color: theme.text }]}>{speed} km/h</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Adaptações */}
            {adaptations && (
              <View style={[modalStyles.notesBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[modalStyles.notesLabel, { color: theme.textSecondary }]}>ADAPTAÇÕES DO COACH</Text>
                <Text style={[modalStyles.notesText, { color: theme.text }]}>{adaptations}</Text>
              </View>
            )}

            {/* Observações */}
            {customNotes && (
              <View style={[modalStyles.notesBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[modalStyles.notesLabel, { color: theme.textSecondary }]}>OBSERVAÇÕES</Text>
                <Text style={[modalStyles.notesText, { color: theme.text }]}>{customNotes}</Text>
              </View>
            )}

            {/* Divisor */}
            <View style={[modalStyles.divider, { borderColor: theme.border }]}>
              <Text style={[modalStyles.dividerText, { color: theme.textSecondary }]}>REGISTRAR TREINO</Text>
            </View>

            {/* Form de registro */}
            <View style={modalStyles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={[modalStyles.fieldLabel, { color: theme.textSecondary }]}>DURAÇÃO (MIN)</Text>
                <TextInput
                  style={[modalStyles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                  placeholder="Ex: 30"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                  outlineStyle="none"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[modalStyles.fieldLabel, { color: theme.textSecondary }]}>DISTÂNCIA (KM)</Text>
                <TextInput
                  style={[modalStyles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                  placeholder="Ex: 3.2"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  value={distance}
                  onChangeText={setDistance}
                  outlineStyle="none"
                />
              </View>
            </View>

            <Text style={[modalStyles.fieldLabel, { color: theme.textSecondary }]}>PACE MÉDIO (MIN/KM)</Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              placeholder="Ex: 7:30"
              placeholderTextColor={theme.textSecondary}
              value={pace}
              onChangeText={setPace}
              outlineStyle="none"
            />

            <Text style={[modalStyles.fieldLabel, { color: theme.textSecondary }]}>ESFORÇO PERCEBIDO (RPE 1–10)</Text>
            <View style={modalStyles.rpeRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[
                    modalStyles.rpeBtn,
                    { borderColor: rpe === n ? color : theme.border, backgroundColor: rpe === n ? color : theme.bg },
                  ]}
                  onPress={() => setRpe(n)}
                >
                  <Text style={[modalStyles.rpeBtnText, { color: rpe === n ? '#000' : theme.textSecondary }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[modalStyles.fieldLabel, { color: theme.textSecondary }]}>OBSERVAÇÕES (OPCIONAL)</Text>
            <TextInput
              style={[modalStyles.textarea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              placeholder="Como foi o treino? Alguma dificuldade?"
              placeholderTextColor={theme.textSecondary}
              multiline
              value={notes}
              onChangeText={setNotes}
              outlineStyle="none"
            />

            {/* Botão salvar */}
            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: color, opacity: saving ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-bold" size={20} color="#000" />
                  <Text style={modalStyles.saveBtnText}>REGISTRAR TREINO</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal Protocolo Completo ─────────────────────────────────────────────────
function FullProtocolModal({ visible, onClose, theme }) {
  const ZONES = [
    { zone: 'Z2 – Leve', feeling: 'Respiração estável, dá pra conversar', esteira: '7.5–7.8 km/h', rua: '7:45–8:20 /km' },
    { zone: 'Z3 – Moderado', feeling: 'Respiração acelerada, frases curtas', esteira: '8.0–8.5 km/h', rua: '7:00–7:30 /km' },
    { zone: 'Z4 – Forte', feeling: 'Difícil falar, respiração pesada', esteira: '9.0–10.0 km/h', rua: '6:00–6:40 /km' },
    { zone: 'Z5 – Tiros', feeling: 'Máxima intensidade, não fala', esteira: '10.5–11.5 km/h', rua: '5:20–6:00 /km' },
  ];

  const TIPS = [
    { cat: 'Técnica', tip: 'Mantenha a passada curta — reduz impacto e protege o joelho.' },
    { cat: 'Técnica', tip: 'Ombros relaxados e tronco levemente inclinado.' },
    { cat: 'Respiração', tip: 'Use nariz + boca ao mesmo tempo. Ritmo 2:2 (2 passos inspira / 2 expira).' },
    { cat: 'Ritmo', tip: 'Se cansar: diminua a velocidade, não pare.' },
    { cat: 'Ritmo', tip: 'Comece devagar e aumente aos poucos.' },
    { cat: 'Hidratação', tip: 'Hidrate ao longo do dia, não apenas antes do treino.' },
    { cat: 'Mentalidade', tip: '"É você contra você." A disciplina vence a motivação.' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[modalStyles.iconBox, { backgroundColor: '#22c55e22' }]}>
                <MaterialCommunityIcons name="book-open-outline" size={20} color="#22c55e" />
              </View>
              <Text style={[modalStyles.headerTitle, { color: theme.text }]}>PROTOCOLO 5K COMPLETO</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Estrutura */}
            <Text style={[fullStyles.sectionTitle, { color: theme.text }]}>COMO FUNCIONA</Text>
            <View style={[fullStyles.infoCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[fullStyles.infoText, { color: theme.textSecondary }]}>
                Você treina <Text style={{ color: '#22c55e', fontWeight: '900' }}>3x por semana</Text> por 8 semanas:{'\n'}
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>Quarta</Text> — corrida leve / técnica{'\n'}
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>Sexta</Text> — intervalados{'\n'}
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>Domingo</Text> — resistência / performance
              </Text>
            </View>

            {/* Zonas */}
            <Text style={[fullStyles.sectionTitle, { color: theme.text, marginTop: 20 }]}>ZONAS DE ESFORÇO</Text>
            {ZONES.map((z, idx) => (
              <View key={idx} style={[fullStyles.zoneRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[fullStyles.zoneLabel, { color: '#22c55e' }]}>{z.zone}</Text>
                <Text style={[fullStyles.zoneFeeling, { color: theme.textSecondary }]}>{z.feeling}</Text>
                <View style={fullStyles.zoneSpeeds}>
                  <Text style={[fullStyles.zoneSpeed, { color: theme.text }]}>🏋️ {z.esteira}</Text>
                  <Text style={[fullStyles.zoneSpeed, { color: theme.text }]}>🏃 {z.rua}</Text>
                </View>
              </View>
            ))}

            {/* Blocos */}
            <Text style={[fullStyles.sectionTitle, { color: theme.text, marginTop: 20 }]}>OS 5 BLOCOS</Text>
            {Object.entries(PROTOCOL_DATA).map(([block, data]) => (
              <View key={block} style={[fullStyles.blockRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={[fullStyles.blockBadge, { backgroundColor: '#22c55e22' }]}>
                  <Text style={[fullStyles.blockBadgeText, { color: '#22c55e' }]}>B{block}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[fullStyles.blockLabel, { color: theme.text }]}>{data.label}</Text>
                  <Text style={[fullStyles.blockWeeks, { color: theme.textSecondary }]}>Semanas {data.weeks}</Text>
                  <Text style={[fullStyles.blockObj, { color: theme.textSecondary }]}>{data.objective}</Text>
                </View>
              </View>
            ))}

            {/* Dicas */}
            <Text style={[fullStyles.sectionTitle, { color: theme.text, marginTop: 20 }]}>DICAS IMPORTANTES</Text>
            {TIPS.map((t, idx) => (
              <View key={idx} style={[fullStyles.tipRow, { borderBottomColor: theme.border }]}>
                <View style={[fullStyles.tipCatBadge, { backgroundColor: '#22c55e22' }]}>
                  <Text style={[fullStyles.tipCat, { color: '#22c55e' }]}>{t.cat}</Text>
                </View>
                <Text style={[fullStyles.tipText, { color: theme.textSecondary }]}>{t.tip}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  sectionContainer: { marginHorizontal: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },

  progressCard: { width: '100%', padding: 20, borderRadius: 24, borderWidth: 1 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  progressIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  progressTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  progressSub: { fontSize: 12, marginTop: 2 },
  infoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  infoBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  progressPct: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  lastLogRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  lastLogText: { fontSize: 11, fontWeight: '600' },

  objectiveCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  objectiveText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 20 },

  sessionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  sessionIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sessionDay: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  sessionTitle: { fontSize: 12, marginTop: 2 },

  emptyCard: { padding: 50, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  emptyTitle: { fontWeight: 'bold', fontSize: 15, marginTop: 20, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 12, textAlign: 'center' },

  logCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  logBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' },
  logBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  logDate: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  logStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logStat: { fontSize: 12, fontWeight: '700' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { height: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

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

  notesBox: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  notesLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  notesText: { fontSize: 13, lineHeight: 20 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, borderTopWidth: 1, paddingTop: 16 },
  dividerText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  formRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 15, fontWeight: '600' },
  textarea: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 14, minHeight: 80, textAlignVertical: 'top', lineHeight: 22 },

  rpeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  rpeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rpeBtnText: { fontSize: 13, fontWeight: '900' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 16, marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 1, color: '#000' },
});

const fullStyles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  infoCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 4 },
  infoText: { fontSize: 13, lineHeight: 22 },

  zoneRow: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  zoneLabel: { fontSize: 13, fontWeight: '900', marginBottom: 4 },
  zoneFeeling: { fontSize: 12, marginBottom: 6 },
  zoneSpeeds: { flexDirection: 'row', gap: 16 },
  zoneSpeed: { fontSize: 12, fontWeight: '700' },

  blockRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  blockBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  blockBadgeText: { fontSize: 13, fontWeight: '900' },
  blockLabel: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
  blockWeeks: { fontSize: 11, marginBottom: 4 },
  blockObj: { fontSize: 12, lineHeight: 18 },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  tipCatBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  tipCat: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
});