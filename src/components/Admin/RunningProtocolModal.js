// src/components/Admin/RunningProtocolModal.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform, Linking, TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API = 'https://fitos-final.onrender.com';

// ─── Helpers ────────────────────────────────────────────────────────────────
const BLOCK_LABELS = {
  1: 'Bloco 1 — Adaptação (Sem. 1-2)',
  2: 'Bloco 2 — Resistência Base (Sem. 3-4)',
  3: 'Bloco 3 — Sustentar Ritmo (Sem. 5-6)',
  4: 'Bloco 4 — Pré-Performance (Sem. 7)',
  5: 'Bloco 5 — Específico (Sem. 8)',
};

const confirm = (title, msg, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: onConfirm },
    ]);
  }
};

const notify = (title, msg) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

// ─── Componente Principal ────────────────────────────────────────────────────
export default function RunningProtocolModal({ visible, onClose, aluno, theme }) {
  // Estados gerais
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Dados da anamnese
  const [anamnese, setAnamnese] = useState(null);
  const [anamneseLink, setAnamneseLink] = useState('');

  // Protocolo ativo
  const [activeProtocol, setActiveProtocol] = useState(null);

  // Sugestão da IA (antes de confirmar)
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [promptSnapshot, setPromptSnapshot] = useState('');

  // 🔥 NOVO: Tipo de Protocolo (5K, 10K, 21K, 42K)
  const [protocolType, setProtocolType] = useState('5K');

  // Campos editáveis do protocolo
  const [startBlock, setStartBlock] = useState(1);
  const [startWeek, setStartWeek] = useState(1);
  const [customNotes, setCustomNotes] = useState('');
  const [adaptations, setAdaptations] = useState('');
  const [customSpeeds, setCustomSpeeds] = useState({ z2: 7.5, z3: 8.0, z4: 9.5, z5: 10.5 });

  // Etapa interna do modal: 'overview' | 'review_ai' | 'logs'
  const [innerStep, setInnerStep] = useState('overview');

  // ── Fetch dados ao abrir ──
  const fetchData = useCallback(async () => {
    if (!aluno?.id) return;
    setLoading(true);
    try {
      // Busca anamnese de corrida
      const resToken = await fetch(`${API}/api/running/anamnese/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: aluno.id }),
      });
      const tokenData = await resToken.json();
      if (tokenData.link) {
        setAnamneseLink(tokenData.link);
        // Busca os dados preenchidos pelo token
        const resAnamnese = await fetch(`${API}/api/running/anamnese/${tokenData.token}`);
        const aData = await resAnamnese.json();
        if (!aData.error) setAnamnese(aData);
      }

      // Busca protocolo ativo
      const resProtocol = await fetch(`${API}/api/running/${aluno.id}`);
      const pData = await resProtocol.json();
      if (pData.protocol) {
        setActiveProtocol(pData);
        setProtocolType(pData.protocol.protocolType || '5K'); // 🔥 Puxa o tipo do banco
        setStartBlock(pData.protocol.startBlock || 1);
        setStartWeek(pData.protocol.startWeek || 1);
        setCustomNotes(pData.protocol.customNotes || '');
        setAdaptations(pData.protocol.adaptations || '');
        if (pData.protocol.customSpeeds) setCustomSpeeds(pData.protocol.customSpeeds);
      }
    } catch (e) {
      console.log('[RunningProtocolModal] fetchData error:', e);
    } finally {
      setLoading(false);
    }
  }, [aluno?.id]);

  useEffect(() => {
    if (visible) {
      setInnerStep('overview');
      setAiSuggestion(null);
      fetchData();
    }
  }, [visible, fetchData]);

  // ── Gerar / Copiar link ──
  const handleCopyLink = () => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(anamneseLink);
      notify('✅ Copiado!', 'Link copiado para a área de transferência.');
    } else {
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(`Olá! Preencha sua anamnese de corrida pelo link: ${anamneseLink}`)}`);
    }
  };

  const handleWhatsApp = () => {
    const msg = `Olá ${aluno?.name?.split(' ')[0] || ''}! 🏃‍♀️\n\nPara montar o seu protocolo de corrida personalizado, preciso que você preencha essa anamnese rapidinho:\n\n${anamneseLink}\n\nAté breve! 💪`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  // ── Gerar protocolo com IA ──
  const handleGenerateAI = async () => {
    if (!anamnese?.filled) {
      notify('Atenção', 'A anamnese ainda não foi preenchida pelo aluno.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/running/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: aluno.id }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
        setPromptSnapshot(data.promptSnapshot || '');
        // Pré-preenche os campos com a sugestão da IA
        setProtocolType(data.suggestion.protocolType || '5K'); // 🔥 IA sugere o tipo
        setStartBlock(data.suggestion.startBlock || 1);
        setStartWeek(data.suggestion.startWeek || 1);
        setCustomNotes(data.suggestion.customNotes || '');
        setAdaptations(data.suggestion.adaptations || '');
        if (data.suggestion.customSpeeds) setCustomSpeeds(data.suggestion.customSpeeds);
        setInnerStep('review_ai');
      } else {
        notify('Erro', 'A IA não retornou uma sugestão. Tente novamente.');
      }
    } catch {
      notify('Erro', 'Falha ao comunicar com a IA. Verifique a conexão.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Confirmar e salvar protocolo ──
  const handleSaveProtocol = async (generatedByAI = false) => {
    confirm(
      activeProtocol ? 'Substituir Protocolo' : 'Confirmar Protocolo',
      activeProtocol
        ? 'Isso vai desativar o protocolo atual e criar um novo. Confirmar?'
        : 'Confirmar e ativar este protocolo de corrida para o aluno?',
      async () => {
        setSaving(true);
        try {
          const res = await fetch(`${API}/api/running/protocol`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: aluno.id,
              protocolType, // 🔥 Salva o tipo no banco de dados agnóstico
              startBlock,
              startWeek,
              customNotes: customNotes || null,
              adaptations: adaptations || null,
              customSpeeds,
              generatedByAI,
              aiPromptSnapshot: generatedByAI ? promptSnapshot : null,
            }),
          });
          if (res.ok) {
            notify('✅ Sucesso!', 'Protocolo de corrida ativado! O aluno já pode visualizar no app.');
            setInnerStep('overview');
            setAiSuggestion(null);
            fetchData();
          } else {
            notify('Erro', 'Não foi possível salvar o protocolo.');
          }
        } catch {
          notify('Erro', 'Falha na conexão. Tente novamente.');
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const anamneseStatus = !anamnese
    ? { label: 'NÃO INICIADA', color: theme.textSecondary, icon: 'clock-outline' }
    : anamnese.filled
    ? { label: `PREENCHIDA EM ${new Date(anamnese.filledAt).toLocaleDateString('pt-BR')}`, color: '#22c55e', icon: 'check-circle' }
    : { label: 'LINK ENVIADO — AGUARDANDO', color: '#f59e0b', icon: 'timer-sand' };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          {/* ── Header ── */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconBox, { backgroundColor: '#22c55e22' }]}>
                <MaterialCommunityIcons name="run-fast" size={22} color="#22c55e" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>PROTOCOLO DE CORRIDA</Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                  {aluno?.name?.split(' ')[0] || 'Aluno'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Conteúdo ── */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Carregando dados...</Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
            >

              {/* ════════════════════════════════════════
                 ETAPA: OVERVIEW
              ════════════════════════════════════════ */}
              {innerStep === 'overview' && (
                <>
                  <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="clipboard-list" size={18} color={theme.accent} />
                      <Text style={[styles.cardTitle, { color: theme.text }]}>ETAPA 1 — ANAMNESE DE CORRIDA</Text>
                    </View>

                    <View style={[styles.statusRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <MaterialCommunityIcons name={anamneseStatus.icon} size={16} color={anamneseStatus.color} />
                      <Text style={[styles.statusText, { color: anamneseStatus.color }]}>{anamneseStatus.label}</Text>
                    </View>

                    {anamnese?.filled && (
                      <View style={[styles.anamnesePreview, { borderColor: theme.border }]}>
                        <PreviewRow icon="run" label="Experiência" value={
                          anamnese.runningExperience === 'never' ? 'Nunca correu' :
                          anamnese.runningExperience === 'stopped' ? 'Já correu, parou' : 'Corre atualmente'
                        } theme={theme} />
                        <PreviewRow icon="heart-pulse" label="Condicionamento" value={`${anamnese.fitnessLevel}/5`} theme={theme} />
                        <PreviewRow icon="map-marker" label="Local" value={
                          anamnese.trainingLocation === 'treadmill' ? 'Esteira' :
                          anamnese.trainingLocation === 'street' ? 'Rua' : 'Esteira e Rua'
                        } theme={theme} />
                        <PreviewRow icon="flag-checkered" label="Objetivo" value={
                          anamnese.runningGoal === 'complete_5k' ? 'Completar 5km' :
                          anamnese.runningGoal === 'weight_loss' ? 'Emagrecer' :
                          anamnese.runningGoal === 'fitness' ? 'Condicionamento' :
                          anamnese.runningGoal === 'race' ? 'Prova oficial' : 'Outro'
                        } theme={theme} />
                        {anamnese.injuries?.length > 0 && anamnese.injuries[0] !== 'Nenhuma' && (
                          <PreviewRow icon="alert-circle" label="Lesões" value={anamnese.injuries.join(', ')} theme={theme} color="#f59e0b" />
                        )}
                      </View>
                    )}

                    <View style={{ gap: 10, marginTop: 14 }}>
                      <TouchableOpacity
                        style={[styles.linkBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        onPress={handleCopyLink}
                      >
                        <MaterialCommunityIcons name="content-copy" size={16} color={theme.accent} />
                        <Text style={[styles.linkBtnText, { color: theme.text }]}>COPIAR LINK DA ANAMNESE</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.linkBtn, { borderColor: '#25D36644', backgroundColor: '#25D36611' }]}
                        onPress={handleWhatsApp}
                      >
                        <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
                        <Text style={[styles.linkBtnText, { color: '#25D366' }]}>ENVIAR PELO WHATSAPP</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border, marginTop: 16 }]}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.accent} />
                      <Text style={[styles.cardTitle, { color: theme.text }]}>ETAPA 2 — PROTOCOLO</Text>
                    </View>

                    {activeProtocol ? (
                      <>
                        <View style={[styles.activeProtocolCard, { borderColor: '#22c55e44', backgroundColor: '#22c55e0d' }]}>
                          <Text style={[styles.activeProtocolLabel, { color: '#22c55e' }]}>✅ PROTOCOLO ATIVO</Text>
                          {/* 🔥 O nome agora é dinâmico com o tipo selecionado 🔥 */}
                          <Text style={[styles.activeProtocolName, { color: theme.text }]}>
                            Protocolo {activeProtocol.protocol.protocolType || '5K'}
                          </Text>
                          <Text style={[styles.activeProtocolSub, { color: theme.textSecondary }]}>
                            Iniciado em {new Date(activeProtocol.protocol.startDate).toLocaleDateString('pt-BR')}
                            {' · '}Semana {activeProtocol.currentWeek}/8
                            {' · '}{BLOCK_LABELS[activeProtocol.currentBlock]}
                          </Text>
                          {activeProtocol.protocol.generatedByAI && (
                            <View style={styles.aiBadge}>
                              <MaterialCommunityIcons name="robot" size={12} color={theme.accent} />
                              <Text style={[styles.aiBadgeText, { color: theme.accent }]}>Gerado com IA</Text>
                            </View>
                          )}
                        </View>

                        {activeProtocol.protocol.logs?.length > 0 && (
                          <TouchableOpacity
                            style={[styles.logsBtn, { borderColor: theme.border }]}
                            onPress={() => setInnerStep('logs')}
                          >
                            <MaterialCommunityIcons name="chart-line" size={16} color={theme.accent} />
                            <Text style={[styles.logsBtnText, { color: theme.text }]}>
                              VER {activeProtocol.protocol.logs.length} REGISTRO{activeProtocol.protocol.logs.length > 1 ? 'S' : ''} DE TREINO
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary} />
                          </TouchableOpacity>
                        )}

                        {activeProtocol.protocol.customNotes ? (
                          <View style={[styles.notesBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>OBSERVAÇÕES DO COACH</Text>
                            <Text style={[styles.notesText, { color: theme.text }]}>{activeProtocol.protocol.customNotes}</Text>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <View style={[styles.emptyProtocol, { borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="run-fast" size={36} color={theme.border} />
                        <Text style={[styles.emptyProtocolText, { color: theme.textSecondary }]}>
                          Nenhum protocolo ativo.{'\n'}Gere um abaixo.
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.aiBtn,
                        {
                          backgroundColor: anamnese?.filled ? theme.accent : theme.border,
                          opacity: generating ? 0.7 : 1,
                        },
                      ]}
                      onPress={handleGenerateAI}
                      disabled={generating || !anamnese?.filled}
                    >
                      {generating ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="robot" size={20} color={anamnese?.filled ? '#000' : theme.textSecondary} />
                          <Text style={[styles.aiBtnText, { color: anamnese?.filled ? '#000' : theme.textSecondary }]}>
                            {activeProtocol ? 'REGERAR COM IA' : 'GERAR PROTOCOLO COM IA'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {!anamnese?.filled && (
                      <Text style={[styles.aiHint, { color: theme.textSecondary }]}>
                        ⚠️ O botão libera após a anamnese ser preenchida.
                      </Text>
                    )}

                    <TouchableOpacity
                      style={[styles.manualBtn, { borderColor: theme.border }]}
                      onPress={() => setInnerStep('review_ai')}
                    >
                      <MaterialCommunityIcons name="pencil" size={16} color={theme.textSecondary} />
                      <Text style={[styles.manualBtnText, { color: theme.textSecondary }]}>
                        {activeProtocol ? 'EDITAR MANUALMENTE' : 'CONFIGURAR MANUALMENTE'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* ════════════════════════════════════════
                 ETAPA: REVIEW / EDIÇÃO DO PROTOCOLO
              ════════════════════════════════════════ */}
              {innerStep === 'review_ai' && (
                <>
                  <TouchableOpacity style={styles.backRow} onPress={() => setInnerStep('overview')}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                    <Text style={[styles.backText, { color: theme.textSecondary }]}>VOLTAR</Text>
                  </TouchableOpacity>

                  {aiSuggestion && (
                    <View style={[styles.aiBanner, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '44' }]}>
                      <MaterialCommunityIcons name="robot" size={18} color={theme.accent} />
                      <Text style={[styles.aiBannerText, { color: theme.accent }]}>
                        Sugestão gerada pela IA. Revise e ajuste antes de confirmar.
                      </Text>
                    </View>
                  )}

                  {/* 🔥 NOVO: SELETOR DE TIPO DE PROTOCOLO (DISTÂNCIA ALVO) 🔥 */}
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>TIPO DE PROTOCOLO (DISTÂNCIA ALVO)</Text>
                  <View style={styles.chipRow}>
                    {['5K', '10K', '21K', '42K'].map(pt => (
                      <TouchableOpacity
                        key={pt}
                        style={[
                          styles.blockChip, 
                          { 
                            borderColor: protocolType === pt ? theme.accent : theme.border, 
                            backgroundColor: protocolType === pt ? theme.accent : theme.bg 
                          }
                        ]}
                        onPress={() => setProtocolType(pt)}
                      >
                        <Text style={[styles.blockChipText, { color: protocolType === pt ? '#000' : theme.textSecondary }]}>
                          {pt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 20 }]}>BLOCO DE ENTRADA</Text>
                  <View style={styles.chipRow}>
                    {[1, 2, 3, 4, 5].map(b => (
                      <TouchableOpacity
                        key={b}
                        style={[styles.blockChip, { borderColor: startBlock === b ? theme.accent : theme.border, backgroundColor: startBlock === b ? theme.accent : theme.bg }]}
                        onPress={() => setStartBlock(b)}
                      >
                        <Text style={[styles.blockChipText, { color: startBlock === b ? '#000' : theme.textSecondary }]}>B{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[styles.blockDesc, { color: theme.textSecondary }]}>
                    {BLOCK_LABELS[startBlock]}
                  </Text>

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 20 }]}>SEMANA DE ENTRADA</Text>
                  <View style={styles.chipRow}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                      <TouchableOpacity
                        key={w}
                        style={[styles.weekChip, { borderColor: startWeek === w ? theme.accent : theme.border, backgroundColor: startWeek === w ? theme.accent : theme.bg }]}
                        onPress={() => setStartWeek(w)}
                      >
                        <Text style={[styles.weekChipText, { color: startWeek === w ? '#000' : theme.textSecondary }]}>{w}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 20 }]}>VELOCIDADES PERSONALIZADAS (KM/H — ESTEIRA)</Text>
                  <View style={styles.speedGrid}>
                    {[
                      { key: 'z2', label: 'Z2 Leve' },
                      { key: 'z3', label: 'Z3 Moderado' },
                      { key: 'z4', label: 'Z4 Forte' },
                      { key: 'z5', label: 'Z5 Tiro' },
                    ].map(({ key, label }) => (
                      <View key={key} style={[styles.speedItem, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <Text style={[styles.speedLabel, { color: theme.textSecondary }]}>{label}</Text>
                        <TextInput
                          style={[styles.speedInput, { color: theme.text, borderColor: theme.border }]}
                          value={String(customSpeeds[key] || '')}
                          onChangeText={v => setCustomSpeeds(s => ({ ...s, [key]: parseFloat(v) || 0 }))}
                          keyboardType="decimal-pad"
                          placeholderTextColor={theme.textSecondary}
                        />
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 20 }]}>ADAPTAÇÕES ESPECÍFICAS</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    value={adaptations}
                    onChangeText={setAdaptations}
                    placeholder="Ex: Substituir intervalado por contínuo na sexta por conta do joelho..."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    outlineStyle="none"
                  />

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>OBSERVAÇÕES PARA O ALUNO (VISÍVEL NO APP)</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    value={customNotes}
                    onChangeText={setCustomNotes}
                    placeholder="Ex: Comece sempre pelo aquecimento. Respeite os dias de descanso..."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    outlineStyle="none"
                  />

                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: theme.accent, opacity: saving ? 0.7 : 1 }]}
                    onPress={() => handleSaveProtocol(!!aiSuggestion)}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-bold" size={20} color="#000" />
                        <Text style={styles.confirmBtnText}>
                          {activeProtocol ? 'SUBSTITUIR PROTOCOLO' : 'ATIVAR PROTOCOLO'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* ════════════════════════════════════════
                 ETAPA: LOGS DE TREINO
              ════════════════════════════════════════ */}
              {innerStep === 'logs' && (
                <>
                  <TouchableOpacity style={styles.backRow} onPress={() => setInnerStep('overview')}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                    <Text style={[styles.backText, { color: theme.textSecondary }]}>VOLTAR</Text>
                  </TouchableOpacity>

                  <Text style={[styles.logsTitle, { color: theme.text }]}>REGISTROS DE TREINO</Text>

                  {activeProtocol?.protocol?.logs?.length > 0 ? (
                    activeProtocol.protocol.logs.map((log, idx) => (
                      <View key={log.id || idx} style={[styles.logCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={styles.logHeader}>
                          <View style={[styles.logDayBadge, { backgroundColor: theme.accent + '22' }]}>
                            <Text style={[styles.logDayText, { color: theme.accent }]}>{log.sessionDay}</Text>
                          </View>
                          <Text style={[styles.logDate, { color: theme.textSecondary }]}>
                            {new Date(log.date).toLocaleDateString('pt-BR')}
                          </Text>
                          <Text style={[styles.logWeek, { color: theme.textSecondary }]}>
                            Sem. {log.week} · Bloco {log.block}
                          </Text>
                        </View>
                        <View style={styles.logStats}>
                          {log.durationMinutes && (
                            <LogStat icon="timer-outline" value={`${log.durationMinutes} min`} theme={theme} />
                          )}
                          {log.distanceKm && (
                            <LogStat icon="map-marker-distance" value={`${log.distanceKm} km`} theme={theme} />
                          )}
                          {log.avgPace && (
                            <LogStat icon="speedometer" value={`${log.avgPace} /km`} theme={theme} />
                          )}
                          {log.rpe && (
                            <LogStat icon="heart-pulse" value={`RPE ${log.rpe}/10`} theme={theme} />
                          )}
                        </View>
                        {log.notes && (
                          <Text style={[styles.logNotes, { color: theme.textSecondary }]}>{log.notes}</Text>
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={[styles.emptyProtocol, { borderColor: theme.border }]}>
                      <Text style={[styles.emptyProtocolText, { color: theme.textSecondary }]}>
                        Nenhum treino registrado ainda.
                      </Text>
                    </View>
                  )}
                </>
              )}

            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────
function PreviewRow({ icon, label, value, theme, color }) {
  return (
    <View style={previewStyles.row}>
      <MaterialCommunityIcons name={icon} size={14} color={color || theme.textSecondary} style={{ marginTop: 1 }} />
      <Text style={[previewStyles.label, { color: theme.textSecondary }]}>{label}:</Text>
      <Text style={[previewStyles.value, { color: color || theme.text }]}>{value}</Text>
    </View>
  );
}

function LogStat({ icon, value, theme }) {
  return (
    <View style={logStyles.stat}>
      <MaterialCommunityIcons name={icon} size={14} color={theme.accent} />
      <Text style={[logStyles.statText, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  value: { fontSize: 12, fontWeight: '600', flex: 1 },
});

const logStyles = StyleSheet.create({
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '700' },
});

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { height: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  headerSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { padding: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontWeight: '600', fontSize: 13 },

  card: { borderRadius: 20, borderWidth: 1, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  cardTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  statusText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  anamnesePreview: { borderTopWidth: 1, paddingTop: 14, marginBottom: 14 },

  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  linkBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  activeProtocolCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  activeProtocolLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  activeProtocolName: { fontSize: 16, fontWeight: '900' },
  activeProtocolSub: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  aiBadgeText: { fontSize: 11, fontWeight: '700' },

  logsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  logsBtnText: { flex: 1, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  notesBox: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  notesLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  notesText: { fontSize: 13, lineHeight: 20 },

  emptyProtocol: { alignItems: 'center', padding: 30, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', marginBottom: 14 },
  emptyProtocolText: { fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20 },

  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 14, marginBottom: 10 },
  aiBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  aiHint: { fontSize: 11, textAlign: 'center', marginBottom: 10 },

  manualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  manualBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  aiBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  aiBannerText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 20 },

  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },

  blockChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  blockChipText: { fontWeight: '900', fontSize: 13 },
  blockDesc: { fontSize: 12, fontWeight: '600', marginBottom: 6 },

  weekChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekChipText: { fontWeight: '900', fontSize: 13 },

  speedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  speedItem: { flex: 1, minWidth: '45%', padding: 14, borderRadius: 14, borderWidth: 1 },
  speedLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  speedInput: { fontSize: 18, fontWeight: '900', borderBottomWidth: 1, paddingBottom: 4, outlineStyle: 'none' },

  textArea: { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 14, minHeight: 90, textAlignVertical: 'top', lineHeight: 22, marginBottom: 4, outlineStyle: 'none' },

  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 16, marginTop: 20 },
  confirmBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 1, color: '#000' },

  logsTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5, marginBottom: 16 },
  logCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  logDayBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  logDayText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  logDate: { fontSize: 12, fontWeight: '600' },
  logWeek: { fontSize: 11, fontWeight: '600', marginLeft: 'auto' },
  logStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 8 },
  logNotes: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
});