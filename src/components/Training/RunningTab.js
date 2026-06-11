// src/components/Training/RunningTab.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Shadow } from 'react-native-shadow-2';

import { PROTOCOL_DATA, SESSION_ICONS, SESSION_COLORS } from '../../utils/runningConstants';

import AnamneseModal from './Modals/AnamneseModal';
import SessionModal from './Modals/SessionModal';
import FullProtocolModal from './Modals/FullProtocolModal';
import FreeRunModal from './Modals/FreeRunModal';
import PaceCalculatorModal from './Modals/PaceCalculatorModal';
import ActiveRunModal from './Modals/ActiveRunModal';
import CustomRunPlannerModal from './Modals/CustomRunPlannerModal';

import PersonalRecordsCard from './PersonalRecordsCard';
import RunningProgressCard from './RunningProgressCard';

// Habilita animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RunningTab({ theme, useRunningHook }) {
  const {
    loading, protocol, currentWeek, currentBlock,
    logs, progressPct, hasRunningModule,
    BLOCK_LABELS, SESSION_DAYS,
    
    anamnese, anamnesePending,
    anamneseModalVisible, setAnamneseModalVisible,
    submittingAnamnese, handleSubmitAnamnese,
    
    sessionModalVisible, setSessionModalVisible,
    protocolModalVisible, setProtocolModalVisible,
    freeRunModalVisible, setFreeRunModalVisible,
    paceCalculatorModalVisible, setPaceCalculatorModalVisible,
    activeRunModalVisible, setActiveRunModalVisible,
    
    customRunPlannerModalVisible, setCustomRunPlannerModalVisible,
    customPhases, customWorkouts, handleDeleteCustomWorkout,
    
    selectedSession, setSelectedSession,
    saving, activeRunMode, finishedRunDuration,
    
    handleOpenSession, handleSaveLog, handleDeleteLog, isSessionDone,
    handleStartActiveRun, handleStartCustomRun, handleFinishActiveRun
  } = useRunningHook;

  // 🔥 Estados para as "Sanfonas" (Collapsibles)
  const [showPlans, setShowPlans] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const toggleSection = (setter) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(prev => !prev);
  };

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

  const blockData = PROTOCOL_DATA[currentBlock];

  return (
    <>
      {/* ══════════════════════════════════════════
          MÓDULO PRO (PROTOCOLO DO COACH)
      ══════════════════════════════════════════ */}
      {hasRunningModule && (
        <>
          {anamnesePending && (
            <View style={styles.sectionContainer}>
              <TouchableOpacity style={[styles.anamneseBanner, { borderColor: '#22c55e66' }]} onPress={() => setAnamneseModalVisible(true)} activeOpacity={0.85}>
                <View style={[styles.anamneseBannerIcon, { backgroundColor: '#22c55e22' }]}>
                  <MaterialCommunityIcons name="clipboard-list" size={28} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.anamneseBannerTitle, { color: '#22c55e' }]}>ANAMNESE PENDENTE</Text>
                  <Text style={[styles.anamneseBannerDesc, { color: theme.textSecondary }]}>Responda para o Coach montar seu protocolo.</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#22c55e" />
              </TouchableOpacity>
            </View>
          )}

          {anamnese?.filled && !protocol && (
            <View style={styles.sectionContainer}>
              <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="timer-sand" size={48} color="#22c55e" />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Anamnese recebida! ✅</Text>
                <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>O Coach Paulo está montando o seu protocolo personalizado.</Text>
              </View>
            </View>
          )}

          {protocol && (
            <>
              <View style={styles.sectionContainer}>
                <Shadow {...shadowOpt} containerStyle={{ width: '100%' }} style={{ width: '100%' }}>
                  <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.progressHeader}>
                      <View style={[styles.progressIconBox, { backgroundColor: '#22c55e22' }]}>
                        <MaterialCommunityIcons name="run-fast" size={20} color="#22c55e" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.progressTitle, { color: theme.text }]}>PROTOCOLO {protocol.protocolType || '5K'}</Text>
                        <Text style={[styles.progressSub, { color: theme.textSecondary }]}>{BLOCK_LABELS[currentBlock]} · Sem. {currentWeek}/8</Text>
                      </View>
                      <TouchableOpacity style={[styles.infoBtn, { borderColor: theme.border }]} onPress={() => setProtocolModalVisible(true)}>
                        <MaterialCommunityIcons name="book-open-outline" size={16} color={theme.textSecondary} />
                        <Text style={[styles.infoBtnText, { color: theme.textSecondary }]}>GUIA</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                      <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                    </View>
                    <Text style={[styles.progressPct, { color: theme.textSecondary }]}>{Math.round(progressPct)}% concluído</Text>
                  </View>
                </Shadow>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TREINOS DA SEMANA</Text>
                {SESSION_DAYS.map((day) => {
                  const done = isSessionDone(day);
                  const sessionData = blockData?.sessions?.[day];
                  const color = SESSION_COLORS[day];

                  return (
                    <View key={day} style={[styles.sessionCard, { backgroundColor: theme.surface, borderColor: done ? color + '66' : theme.border, opacity: done ? 0.75 : 1 }]}>
                      <TouchableOpacity style={styles.sessionCardClickable} onPress={() => handleOpenSession(day)} activeOpacity={0.8}>
                        <View style={[styles.sessionIconBox, { backgroundColor: color + '22' }]}>
                          <MaterialCommunityIcons name={done ? 'check-circle' : SESSION_ICONS[day]} size={22} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sessionDay, { color: done ? color : theme.text }]}>{day}{done ? ' ✓' : ''}</Text>
                          <Text style={[styles.sessionTitle, { color: theme.textSecondary }]}>{sessionData?.title || '—'}</Text>
                        </View>
                      </TouchableOpacity>

                      {!done ? (
                        <TouchableOpacity style={styles.playBtn} onPress={() => handleStartActiveRun(day)}>
                          <MaterialCommunityIcons name="play-circle" size={36} color={color} />
                        </TouchableOpacity>
                      ) : (
                        <MaterialCommunityIcons name="check" size={24} color={color} style={{ marginRight: 16 }} />
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          FERRAMENTAS GLOBAIS
      ══════════════════════════════════════════ */}
      <View style={styles.sectionContainer}>
        <View style={styles.toolsRow}>
          <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setFreeRunModalVisible(true)}>
            <View style={[styles.toolIcon, { backgroundColor: '#3b82f622' }]}>
              <MaterialCommunityIcons name="playlist-edit" size={20} color="#3b82f6" />
            </View>
            <Text style={[styles.toolText, { color: theme.text }]}>Reg. Manual</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setCustomRunPlannerModalVisible(true)}>
            <View style={[styles.toolIcon, { backgroundColor: '#AF52DE22' }]}>
              <MaterialCommunityIcons name="hammer-wrench" size={20} color="#AF52DE" />
            </View>
            <Text style={[styles.toolText, { color: theme.text }]}>Criar Treino</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => handleStartActiveRun(null)}>
            <View style={[styles.toolIcon, { backgroundColor: '#f59e0b22' }]}>
              <MaterialCommunityIcons name="timer-play-outline" size={20} color="#f59e0b" />
            </View>
            <Text style={[styles.toolText, { color: theme.text }]}>Cronômetro</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setPaceCalculatorModalVisible(true)}>
            <View style={[styles.toolIcon, { backgroundColor: '#22c55e22' }]}>
              <MaterialCommunityIcons name="calculator" size={20} color="#22c55e" />
            </View>
            <Text style={[styles.toolText, { color: theme.text }]}>Calc. Pace</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══════════════════════════════════════════
          🔥 SANFONA: MEUS PLANEJAMENTOS 🔥
      ══════════════════════════════════════════ */}
      {customWorkouts.length > 0 && (
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={[styles.accordionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => toggleSection(setShowPlans)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="format-list-checks" size={18} color="#AF52DE" />
            <Text style={[styles.accordionText, { color: theme.text }]}>MEUS PLANEJAMENTOS ({customWorkouts.length})</Text>
            <MaterialCommunityIcons name={showPlans ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {showPlans && (
            <View style={styles.accordionContent}>
              {customWorkouts.map((workout) => (
                <View key={workout.id} style={[styles.customCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.customCardInfo}>
                    <Text style={[styles.customCardTitle, { color: theme.text }]}>{workout.title.toUpperCase()}</Text>
                    <Text style={[styles.customCardSub, { color: theme.textSecondary }]}>{workout.phases.length} etapas · {workout.totalMinutes} min</Text>
                  </View>
                  <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleDeleteCustomWorkout(workout.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.playBtn} onPress={() => handleStartCustomRun(workout)}>
                    <MaterialCommunityIcons name="play-circle" size={32} color="#AF52DE" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* INSIGHTS VISUAIS */}
      {logs && logs.length > 0 && (
        <>
          <View style={styles.sectionContainer}>
            <RunningProgressCard theme={theme} logs={logs} />
          </View>

          <View style={styles.sectionContainer}>
            <PersonalRecordsCard theme={theme} logs={logs} />
          </View>
        </>
      )}

      {/* ══════════════════════════════════════════
          🔥 SANFONA: HISTÓRICO DE CORRIDAS 🔥
      ══════════════════════════════════════════ */}
      {logs && logs.length > 0 && (
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={[styles.accordionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => toggleSection(setShowHistory)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="history" size={18} color="#3b82f6" />
            <Text style={[styles.accordionText, { color: theme.text }]}>HISTÓRICO DE CORRIDAS</Text>
            <MaterialCommunityIcons name={showHistory ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {showHistory && (
            <View style={styles.accordionContent}>
              {logs.map((log, idx) => {
                const badgeColor = SESSION_COLORS[log.sessionDay] || '#3b82f6';
                return (
                  <View key={log.id || idx} style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
                      <View style={[styles.logBadge, { backgroundColor: badgeColor + '22' }]}>
                        <Text style={[styles.logBadgeText, { color: badgeColor }]}>{log.sessionDay || 'AVULSO'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.logDate, { color: theme.textSecondary }]}>
                          {new Date(log.date).toLocaleDateString('pt-BR')} {log.week ? `· Sem. ${log.week}` : ''}
                        </Text>
                        <View style={styles.logStats}>
                          {log.durationMinutes && <Text style={[styles.logStat, { color: theme.text }]}>⏱ {log.durationMinutes}m</Text>}
                          {log.distanceKm && <Text style={[styles.logStat, { color: theme.text }]}>📍 {log.distanceKm}k</Text>}
                          {log.avgPace && <Text style={[styles.logStat, { color: theme.text }]}>⚡ {log.avgPace}</Text>}
                        </View>
                      </View>
                    </View>
                    
                    {/* Botão de Excluir Log */}
                    <TouchableOpacity style={styles.deleteLogBtn} onPress={() => handleDeleteLog(log.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* INJEÇÃO DOS MODAIS */}
      <AnamneseModal visible={anamneseModalVisible} onClose={() => setAnamneseModalVisible(false)} theme={theme} submitting={submittingAnamnese} onSubmit={handleSubmitAnamnese} />
      <SessionModal visible={sessionModalVisible} onClose={() => { setSessionModalVisible(false); setSelectedSession(null); }} session={selectedSession} blockData={blockData} theme={theme} saving={saving} onSave={handleSaveLog} customSpeeds={protocol?.customSpeeds} customNotes={protocol?.customNotes} onStartRun={handleStartActiveRun} initialDuration={finishedRunDuration} />
      <FullProtocolModal visible={protocolModalVisible} onClose={() => setProtocolModalVisible(false)} theme={theme} />
      <FreeRunModal visible={freeRunModalVisible} onClose={() => setFreeRunModalVisible(false)} theme={theme} saving={saving} onSave={handleSaveLog} initialDuration={finishedRunDuration} />
      <PaceCalculatorModal visible={paceCalculatorModalVisible} onClose={() => setPaceCalculatorModalVisible(false)} theme={theme} />
      <CustomRunPlannerModal visible={customRunPlannerModalVisible} onClose={() => setCustomRunPlannerModalVisible(false)} theme={theme} onSaveCustomWorkout={useRunningHook.handleSaveCustomWorkout} />
      <ActiveRunModal visible={activeRunModalVisible} onClose={() => setActiveRunModalVisible(false)} session={selectedSession} blockData={blockData} customPhases={customPhases} theme={theme} mode={activeRunMode} onFinishRun={handleFinishActiveRun} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  sectionContainer: { marginHorizontal: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  
  anamneseBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, borderWidth: 1.5, backgroundColor: '#22c55e0a' },
  anamneseBannerIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  anamneseBannerTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
  anamneseBannerDesc: { fontSize: 12, lineHeight: 18 },
  
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

  toolsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  toolBtn: { flex: 1, minWidth: '22%', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 4, borderRadius: 16, borderWidth: 1 },
  toolIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toolText: { fontSize: 10, fontWeight: '900', textAlign: 'center' },

  sessionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  sessionCardClickable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  sessionIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sessionDay: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  sessionTitle: { fontSize: 12, marginTop: 2 },
  playBtn: { paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },

  emptyCard: { padding: 50, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  emptyTitle: { fontWeight: 'bold', fontSize: 15, marginTop: 20, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 12, textAlign: 'center' },

  // 🔥 Estilos da Sanfona
  accordionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  accordionText: { flex: 1, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  accordionContent: { marginTop: 10 },

  customCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  customCardInfo: { flex: 1, marginLeft: 6 },
  customCardTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  customCardSub: { fontSize: 11, marginTop: 2 },
  actionIconBtn: { padding: 10 },

  logCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  logBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start' },
  logBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  logDate: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  logStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logStat: { fontSize: 11, fontWeight: '700' },
  deleteLogBtn: { padding: 10, alignSelf: 'flex-start' }
});