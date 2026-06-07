// src/screens/GerarTreinoIA.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, Platform, StatusBar, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = 'https://fitos-final.onrender.com';

// ─── Passos da tela ───
const STEP_SELECT_STUDENT = 'SELECT_STUDENT';
const STEP_REVIEW_HISTORY  = 'REVIEW_HISTORY';
const STEP_GENERATING      = 'GENERATING';

export default function GerarTreinoIA({ navigation, route }) {
  const { theme } = useTheme();

  const [step, setStep] = useState(STEP_SELECT_STUDENT);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState('');
  const [error, setError] = useState('');

  const isWeb = Platform.OS === 'web';

  // ─── Mensagens de loading progressivo ───
  const LOADING_MESSAGES = [
    '🔍 Analisando histórico de treinos...',
    '📊 Identificando padrões de progressão...',
    '🧠 Calculando novas cargas e variações...',
    '⚡ Montando sua nova rotina...',
    '✅ Finalizando e validando exercícios...',
  ];

  useEffect(() => {
  // Se veio com aluno pré-selecionado, pula a lista e vai direto pro histórico
  const alunoParam = route.params?.aluno;
  if (alunoParam && alunoParam.id) {
    setStep(STEP_REVIEW_HISTORY);
    handleSelectStudent(alunoParam);
  } else {
    fetchStudents();
  }
}, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/user?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.filter((u) => u.role !== 'ADMIN'));
      }
    } catch (e) {
      setError('Falha ao carregar alunos.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStep(STEP_REVIEW_HISTORY);
    setLoadingDetail(true);
    setError('');

    try {
      // Buscar detalhes completos: treinos + histórico de execuções
      const [resUser, resHistory] = await Promise.all([
        fetch(`${API_URL}/api/admin/user/${student.id}?t=${Date.now()}`),
        fetch(`${API_URL}/api/user/history?userId=${student.id}&t=${Date.now()}`),
      ]);

      const userData = resUser.ok ? await resUser.json() : student;
      const historyData = resHistory.ok ? await resHistory.json() : [];

      // Pega os últimos 3 treinos (ativos ou arquivados)
      const workouts = userData.workouts || [];
      const last3 = workouts.slice(0, 3);

      // Conta execuções finalizadas
      const totalSessions = Array.isArray(historyData) ? historyData.length : 0;

      setStudentDetail({
        ...userData,
        last3Workouts: last3,
        totalSessions,
      });
    } catch (e) {
      setError('Falha ao carregar dados do aluno. Você pode gerar mesmo assim.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedStudent) return;
    setStep(STEP_GENERATING);
    setError('');

    // Rodar mensagens progressivas enquanto a IA trabalha
    let msgIdx = 0;
    setGeneratingMsg(LOADING_MESSAGES[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setGeneratingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2800);

    try {
      const userJson = await AsyncStorage.getItem('user');
      const adminUser = userJson ? JSON.parse(userJson) : {};

      const res = await fetch(`${API_URL}/api/ai/gerar-treino`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedStudent.id,
          adminId: adminUser.id,
        }),
      });

      clearInterval(msgInterval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao gerar treino');
      }

      const data = await res.json();

      if (!data.exercisesByDay || Object.keys(data.exercisesByDay).length === 0) {
        throw new Error('A IA não retornou exercícios. Tente novamente.');
      }

      // ─── Navegar para MontarTreinoAdmin já preenchido ───
      navigation.replace('MontarTreinoAdmin', {
        aluno: selectedStudent,
        isEditing: false,
        // Injeta o treino gerado como se fosse um draft pré-carregado
        prefillData: {
          workoutName: data.workoutName,
          workoutModel: data.workoutModel || 'CARGA',
          exercisesByDay: data.exercisesByDay,
          workoutTabs: data.workoutTabs,
          reasoning: data.reasoning,
        },
      });
    } catch (e) {
      clearInterval(msgInterval);
      setError(e.message || 'Falha ao gerar treino. Tente novamente.');
      setStep(STEP_REVIEW_HISTORY);
    }
  };

  // ─── Filtro de busca ───
  const filteredStudents = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Helpers de UI ───
  const getGoalEmoji = (goal) => {
    if (!goal) return '🎯';
    const g = goal.toLowerCase();
    if (g.includes('hipertrofia') || g.includes('massa')) return '💪';
    if (g.includes('emagrec') || g.includes('perda')) return '🔥';
    if (g.includes('força') || g.includes('forca')) return '⚡';
    if (g.includes('definição') || g.includes('definicao')) return '✂️';
    return '🎯';
  };

  const getLevelColor = (level) => {
    if (!level) return theme.textSecondary;
    const l = level.toLowerCase();
    if (l.includes('iniciante')) return '#32ADE6';
    if (l.includes('interm')) return '#FF9500';
    if (l.includes('avan')) return '#FF3B30';
    return theme.textSecondary;
  };

  const formatWorkoutSummary = (workout) => {
    const days = [...new Set((workout.exercises || []).map((e) => e.day))];
    const exCount = workout.exercises?.length || 0;
    return `${days.length} dias · ${exCount} exercícios`;
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: HEADER
  // ─────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
      <TouchableOpacity
        onPress={() => {
          if (step === STEP_REVIEW_HISTORY) { setStep(STEP_SELECT_STUDENT); setSelectedStudent(null); setStudentDetail(null); }
          else navigation.goBack();
        }}
        style={[styles.backBtn, { backgroundColor: theme.surface }]}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
      </TouchableOpacity>

      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {step === STEP_SELECT_STUDENT ? 'Gerar Treino com IA' : step === STEP_GENERATING ? 'Gerando...' : selectedStudent?.name || 'Aluno'}
        </Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
          {step === STEP_SELECT_STUDENT ? 'Escolha o aluno' : step === STEP_GENERATING ? 'Aguarde um momento' : 'Histórico + IA'}
        </Text>
      </View>

      {/* Badge IA */}
      <View style={[styles.iaBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
        <MaterialCommunityIcons name="robot-outline" size={14} color={theme.accent} />
        <Text style={[styles.iaBadgeText, { color: theme.accent }]}>IA</Text>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER: STEP 1 — SELECIONAR ALUNO
  // ─────────────────────────────────────────────────────────────
  const renderSelectStudent = () => (
    <View style={{ flex: 1 }}>
      {/* Barra de busca */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Buscar aluno..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contador */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary, paddingHorizontal: 16, marginBottom: 8 }]}>
        {filteredStudents.length} ALUNOS
      </Text>

      {loadingStudents ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {filteredStudents.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={[styles.studentCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => handleSelectStudent(student)}
              activeOpacity={0.75}
            >
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: theme.accent + '25' }]}>
                <Text style={[styles.avatarText, { color: theme.accent }]}>
                  {(student.name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>
                  {student.name || 'Sem nome'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>{getGoalEmoji(student.goal)} {student.goal?.split('(Foco:')[0]?.trim() || 'Sem objetivo'}</Text>
                  {student.level && (
                    <View style={[styles.levelBadge, { borderColor: getLevelColor(student.level) + '50', backgroundColor: getLevelColor(student.level) + '15' }]}>
                      <Text style={[styles.levelBadgeText, { color: getLevelColor(student.level) }]}>{student.level}</Text>
                    </View>
                  )}
                </View>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}

          {filteredStudents.length === 0 && !loadingStudents && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search" size={48} color={theme.textSecondary} style={{ opacity: 0.4 }} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum aluno encontrado</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER: STEP 2 — REVISAR HISTÓRICO E GERAR
  // ─────────────────────────────────────────────────────────────
  const renderReviewHistory = () => {
    if (loadingDetail) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Carregando histórico...</Text>
        </View>
      );
    }

    const detail = studentDetail;
    const anamnese = detail?.anamneses?.[0] || null;
    const last3 = detail?.last3Workouts || [];

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

        {/* Card: Perfil do aluno */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoIconBox, { backgroundColor: theme.accent }]}>
              <MaterialCommunityIcons name="clipboard-pulse-outline" size={16} color={theme.isDark ? '#000' : '#FFF'} />
            </View>
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>Raio-X do Aluno</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>OBJETIVO</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{detail?.goal?.split('(Foco:')[0]?.trim() || detail?.anamneses?.[0]?.objetivo || 'Não informado'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>NÍVEL</Text>
              <Text style={[styles.infoValue, { color: getLevelColor(detail?.level || detail?.anamneses?.[0]?.nivel) }]}>{detail?.level || detail?.anamneses?.[0]?.nivel || 'Não informado'}</Text>
            </View>
          </View>

          {(anamnese?.limitacoes?.length > 0 && !anamnese.limitacoes.includes('Nenhuma')) && (
            <View style={[styles.alertBox, { backgroundColor: 'rgba(255,59,48,0.08)', borderColor: '#FF3B3040' }]}>
              <Text style={styles.alertBoxTitle}>⚠️ LIMITAÇÕES</Text>
              <Text style={[styles.alertBoxText, { color: theme.text }]}>{anamnese.limitacoes.join(', ')}</Text>
            </View>
          )}

          {(anamnese?.cirurgias?.length > 0 && !anamnese.cirurgias.includes('Nenhuma')) && (
            <View style={[styles.alertBox, { backgroundColor: 'rgba(255,149,0,0.08)', borderColor: '#FF950040', marginTop: 8 }]}>
              <Text style={[styles.alertBoxTitle, { color: '#FF9500' }]}>⚠️ CIRURGIAS</Text>
              <Text style={[styles.alertBoxText, { color: theme.text }]}>{anamnese.cirurgias.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Card: Treinos que a IA vai analisar */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoIconBox, { backgroundColor: '#FF9500' }]}>
              <MaterialCommunityIcons name="history" size={16} color="#FFF" />
            </View>
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>
              {last3.length > 0 ? `${last3.length} Treinos para Analisar` : 'Sem treinos anteriores'}
            </Text>
            {detail?.totalSessions > 0 && (
              <View style={[styles.sessionsBadge, { backgroundColor: theme.accent + '20' }]}>
                <Text style={[styles.sessionsBadgeText, { color: theme.accent }]}>{detail.totalSessions} sessões</Text>
              </View>
            )}
          </View>

          {last3.length === 0 ? (
            <View style={[styles.noHistoryBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.noHistoryText, { color: theme.textSecondary }]}>Nenhum treino anterior. A IA criará uma rotina do zero baseada no perfil do aluno.</Text>
            </View>
          ) : (
            last3.map((w, idx) => {
              const days = [...new Set((w.exercises || []).map((e) => e.day))];
              return (
                <View key={w.id || idx} style={[styles.workoutHistoryItem, { borderColor: idx === 0 ? theme.accent + '40' : theme.border, backgroundColor: idx === 0 ? theme.accent + '06' : 'transparent' }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {idx === 0 && (
                        <View style={[styles.currentBadge, { backgroundColor: theme.accent }]}>
                          <Text style={[styles.currentBadgeText, { color: theme.isDark ? '#000' : '#FFF' }]}>ATUAL</Text>
                        </View>
                      )}
                      <Text style={[styles.workoutHistoryName, { color: idx === 0 ? theme.accent : theme.text }]} numberOfLines={1}>{w.name}</Text>
                    </View>
                    <Text style={[styles.workoutHistorySub, { color: theme.textSecondary }]}>
                      {formatWorkoutSummary(w)} · Dias: {days.join(', ')}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name={idx === 0 ? 'star' : 'clock-outline'} size={16} color={idx === 0 ? theme.accent : theme.textSecondary} />
                </View>
              );
            })
          )}
        </View>

        {/* Card: O que a IA vai fazer */}
        <View style={[styles.infoCard, { backgroundColor: theme.accent + '08', borderColor: theme.accent + '30' }]}>
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoIconBox, { backgroundColor: theme.accent }]}>
              <MaterialCommunityIcons name="robot-outline" size={16} color={theme.isDark ? '#000' : '#FFF'} />
            </View>
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>O que a IA vai fazer</Text>
          </View>
          {[
            last3.length > 0 ? '📈 Progressão de carga (+5% a +10% nas cargas anteriores)' : '🎯 Criar rotina do zero para o perfil do aluno',
            '🔄 Sugerir variações de exercícios quando necessário',
            '⚠️ Respeitar limitações e histórico de lesões',
            '🧱 Manter a estrutura de blocos que você já usa',
            '✅ Usar apenas exercícios do seu banco oficial',
          ].map((item, i) => (
            <View key={i} style={styles.iaFeatureRow}>
              <Text style={[styles.iaFeatureText, { color: theme.text }]}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Erro se houver */}
        {error ? (
          <View style={[styles.errorBox, { borderColor: '#FF3B3050', backgroundColor: 'rgba(255,59,48,0.08)' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

      </ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: STEP 3 — GERANDO
  // ─────────────────────────────────────────────────────────────
  const renderGenerating = () => (
    <View style={[styles.center, { paddingHorizontal: 32 }]}>
      <View style={[styles.generatingIconBox, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
        <MaterialCommunityIcons name="robot-outline" size={52} color={theme.accent} />
      </View>
      <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 28 }} />
      <Text style={[styles.generatingTitle, { color: theme.text }]}>Gerando rotina...</Text>
      <Text style={[styles.generatingMsg, { color: theme.textSecondary }]}>{generatingMsg}</Text>
      <Text style={[styles.generatingNote, { color: theme.textSecondary + '80' }]}>
        Isso pode levar até 30 segundos
      </Text>
    </View>
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────
  const rootStyle = isWeb
    ? { height: '100dvh', width: '100%', backgroundColor: theme.bg, display: 'flex', flexDirection: 'column' }
    : { flex: 1, backgroundColor: theme.bg };

  const Wrapper = isWeb ? View : SafeAreaView;

  return (
    <Wrapper style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {renderHeader()}

      <View style={{ flex: 1, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        {step === STEP_SELECT_STUDENT && renderSelectStudent()}
        {step === STEP_REVIEW_HISTORY && renderReviewHistory()}
        {step === STEP_GENERATING    && renderGenerating()}
      </View>

      {/* Footer com botão de Gerar (só no step de revisão) */}
      {step === STEP_REVIEW_HISTORY && !loadingDetail && (
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: theme.accent }]}
            onPress={handleGenerate}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="robot-outline" size={22} color={theme.isDark ? '#000' : '#FFF'} />
            <Text style={[styles.generateBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>
              GERAR TREINO COM IA
            </Text>
          </TouchableOpacity>
          <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
            O treino será aberto no editor para revisão antes de salvar
          </Text>
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  headerSub: { fontSize: 11, marginTop: 1 },
  iaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  iaBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', outlineStyle: 'none' },

  studentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900' },
  studentName: { fontSize: 15, fontWeight: '800' },
  levelBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1,
  },
  levelBadgeText: { fontSize: 10, fontWeight: '800' },

  infoCard: {
    borderRadius: 18, padding: 16, marginBottom: 14,
    borderWidth: 1,
  },
  infoCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  infoIconBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  infoCardTitle: { fontSize: 14, fontWeight: '800', flex: 1 },
  infoRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginBottom: 3 },
  infoValue: { fontSize: 14, fontWeight: '700' },
  alertBox: { padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 10 },
  alertBoxTitle: { color: '#FF3B30', fontSize: 9, fontWeight: '900', marginBottom: 3 },
  alertBoxText: { fontSize: 12, fontWeight: '600' },

  sessionsBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sessionsBadgeText: { fontSize: 10, fontWeight: '800' },

  noHistoryBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  noHistoryText: { flex: 1, fontSize: 12, lineHeight: 18 },

  workoutHistoryItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8,
    gap: 10,
  },
  currentBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  currentBadgeText: { fontSize: 9, fontWeight: '900' },
  workoutHistoryName: { fontSize: 13, fontWeight: '800' },
  workoutHistorySub: { fontSize: 11, marginTop: 2 },

  iaFeatureRow: { paddingVertical: 5 },
  iaFeatureText: { fontSize: 13, lineHeight: 20 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 4,
  },
  errorText: { color: '#FF3B30', fontSize: 13, flex: 1, lineHeight: 18 },

  generatingIconBox: {
    width: 100, height: 100, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  generatingTitle: { fontSize: 20, fontWeight: '900', marginTop: 20, textAlign: 'center' },
  generatingMsg: { fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22 },
  generatingNote: { fontSize: 11, marginTop: 16, textAlign: 'center' },

  footer: {
    padding: 16, paddingBottom: 28,
    borderTopWidth: 1,
  },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 18, borderRadius: 16,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  generateBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  footerNote: { textAlign: 'center', fontSize: 11, marginTop: 10 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 14, fontSize: 13 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});