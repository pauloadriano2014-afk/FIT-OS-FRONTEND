// src/screens/GerarTreinoIA.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, Platform, StatusBar, TextInput, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = 'https://fitos-final.onrender.com';

// ─── STEPS ───
const STEP_SELECT_STUDENT  = 'SELECT_STUDENT';
const STEP_CYCLE_CONFIG    = 'CYCLE_CONFIG';
const STEP_REVIEW_HISTORY  = 'REVIEW_HISTORY';
const STEP_GENERATING      = 'GENERATING';

// ─── GRUPOS MUSCULARES COM ÍCONES E DESCANSO DEFAULT ───
const MUSCLE_GROUPS = [
  { id: 'QUADRICEPS',    label: 'Quadríceps',      icon: 'human-male',    color: '#FF6B6B', defaultRest: 60,  restType: 'MULTI'    },
  { id: 'POSTERIORES',   label: 'Posteriores',     icon: 'human-male',    color: '#FF8E53', defaultRest: 60,  restType: 'MULTI'    },
  { id: 'GLUTEOS',       label: 'Glúteos',         icon: 'human-male',    color: '#FF6B9D', defaultRest: 60,  restType: 'MULTI'    },
  { id: 'PANTURRILHA',   label: 'Panturrilha',     icon: 'human-male',    color: '#C77DFF', defaultRest: 15,  restType: 'PANT'     },
  { id: 'COSTAS_PUXADA', label: 'Costas (Puxada)', icon: 'weight-lifter', color: '#4ECDC4', defaultRest: 60,  restType: 'MULTI'    },
  { id: 'COSTAS_REMADA', label: 'Costas (Remada)', icon: 'weight-lifter', color: '#45B7D1', defaultRest: 60,  restType: 'MULTI'    },
  { id: 'OMBRO_MULTI',   label: 'Ombro Multi.',    icon: 'dumbbell',      color: '#96CEB4', defaultRest: 60,  restType: 'MULTI'    },
  { id: 'OMBRO_FRONTAL', label: 'Ombro Frontal',   icon: 'dumbbell',      color: '#88D8B0', defaultRest: 30,  restType: 'ISOLADO'  },
  { id: 'OMBRO_LATERAL', label: 'Ombro Lateral',   icon: 'dumbbell',      color: '#FFEAA7', defaultRest: 30,  restType: 'ISOLADO'  },
  { id: 'OMBRO_POST',    label: 'Ombro Post.',     icon: 'dumbbell',      color: '#DDA0DD', defaultRest: 30,  restType: 'ISOLADO'  },
  { id: 'TRAPEZIO',      label: 'Trapézio',        icon: 'dumbbell',      color: '#98D8C8', defaultRest: 30,  restType: 'ISOLADO'  },
  { id: 'PEITO',         label: 'Peito',           icon: 'weight-lifter', color: '#F7DC6F', defaultRest: 60,  restType: 'MULTI'    },
  { id: 'BICEPS',        label: 'Bíceps',          icon: 'dumbbell',      color: '#82E0AA', defaultRest: 30,  restType: 'ISOLADO'  },
  { id: 'TRICEPS',       label: 'Tríceps',         icon: 'dumbbell',      color: '#85C1E9', defaultRest: 30,  restType: 'ISOLADO'  },
  { id: 'ABDOMEN',       label: 'Abdômen',         icon: 'human-male',    color: '#F1948A', defaultRest: 30,  restType: 'ISOLADO'  },
  { id: 'CARDIO',        label: 'Cardio',          icon: 'heart-pulse',   color: '#FF6B6B', defaultRest: 0,   restType: 'CARDIO'   },
];

// Labels para cada tipo de descanso
const REST_TYPE_LABELS = {
  MULTI:   'Multiarticular (60s)',
  ISOLADO: 'Isolado (30s)',
  PANT:    'Panturrilha (15s)',
  CARDIO:  'Cardio (0s)',
};

// Opções de descanso disponíveis por grupo
const REST_OPTIONS_BY_TYPE = {
  MULTI:   [{ id: '45', label: '45s' }, { id: '60', label: '60s' }, { id: '90', label: '90s' }, { id: '120', label: '2min' }, { id: '180', label: '3min' }],
  ISOLADO: [{ id: '15', label: '15s' }, { id: '30', label: '30s' }, { id: '45', label: '45s' }, { id: '60', label: '60s' }],
  PANT:    [{ id: '0', label: '0s' }, { id: '15', label: '15s' }, { id: '30', label: '30s' }],
  CARDIO:  [{ id: '0', label: '0s' }],
};

// ─── TÉCNICAS DISPONÍVEIS ───
const TECHNIQUES = [
  { id: 'DROPSET',    label: 'Drop-set',      desc: 'Reduz carga e continua' },
  { id: 'RESTPAUSE',  label: 'Rest-Pause',    desc: '10-15s pausa e repete' },
  { id: 'BISET',      label: 'Bi-set',        desc: 'Dois exercícios sem pausa' },
  { id: '21',         label: 'Método 21',     desc: '7+7+7 repetições' },
  { id: 'CLUSTERSET', label: 'Cluster',       desc: 'Mini-séries de 3 reps' },
  { id: '1_5_REPS',   label: '1.5 Reps',      desc: 'Movimento completo + meio' },
  { id: 'TUT',        label: 'TUT',           desc: 'Cadência controlada' },
  { id: 'GVT',        label: 'GVT 10x10',     desc: '10 séries de 10 reps' },
];

// ─── FASES DO CICLO ───
const CYCLE_PHASES = [
  { id: 'HIPERTROFIA', label: 'Hipertrofia',  desc: 'Volume moderado, técnicas variadas', icon: 'trending-up' },
  { id: 'FORCA',       label: 'Força',        desc: 'Cargas pesadas, menos reps',         icon: 'arm-flex' },
  { id: 'CHOQUE',      label: 'Choque',       desc: 'Volume alto, técnicas pesadas',      icon: 'lightning-bolt' },
  { id: 'DELOAD',      label: 'Deload',       desc: 'Volume leve, sem técnicas avançadas',icon: 'battery-low' },
];

// ─── TEMPLATES DE DIAS PRÉ-DEFINIDOS ───
const DAY_TEMPLATES = [
  { label: 'Quad + Post',       groups: [{ id: 'QUADRICEPS', qty: 4 }, { id: 'POSTERIORES', qty: 3 }] },
  { label: 'Glúteos + Pant.',   groups: [{ id: 'GLUTEOS', qty: 5 }, { id: 'PANTURRILHA', qty: 2 }] },
  { label: 'Costas + Ombros',   groups: [{ id: 'COSTAS_PUXADA', qty: 3 }, { id: 'COSTAS_REMADA', qty: 2 }, { id: 'OMBRO_MULTI', qty: 2 }, { id: 'TRAPEZIO', qty: 1 }] },
  { label: 'Peito + Tríceps',   groups: [{ id: 'PEITO', qty: 3 }, { id: 'TRICEPS', qty: 3 }, { id: 'ABDOMEN', qty: 2 }] },
  { label: 'Braços + Abs',      groups: [{ id: 'BICEPS', qty: 3 }, { id: 'TRICEPS', qty: 3 }, { id: 'ABDOMEN', qty: 3 }] },
  { label: 'Full Body',         groups: [{ id: 'QUADRICEPS', qty: 2 }, { id: 'GLUTEOS', qty: 2 }, { id: 'COSTAS_REMADA', qty: 2 }, { id: 'PEITO', qty: 2 }, { id: 'ABDOMEN', qty: 1 }] },
  { label: 'Superior',          groups: [{ id: 'PEITO', qty: 3 }, { id: 'COSTAS_PUXADA', qty: 2 }, { id: 'OMBRO_LATERAL', qty: 2 }, { id: 'BICEPS', qty: 2 }, { id: 'TRICEPS', qty: 2 }] },
  { label: 'Cardio',            groups: [{ id: 'CARDIO', qty: 1 }] },
];

// ─── REGRAS DE LIMITAÇÃO PADRÃO ───
const DEFAULT_LIMITATION_RULES = [
  {
    id: 'SILICONE',
    trigger: 'Prótese de Silicone',
    label: 'Prótese de Silicone',
    icon: 'alert-circle',
    color: '#FF9500',
    rules: [
      { group: 'PEITO', maxExercises: 2, forceLight: true, note: 'Amplitude reduzida, carga leve. Qualquer desconforto, me avise.' },
    ],
  },
  {
    id: 'CESARÉA',
    trigger: 'Cesaréa',
    label: 'Cesaréa / Abdominoplastia',
    icon: 'alert-circle',
    color: '#FF3B30',
    rules: [
      { group: 'ABDOMEN', staticOnly: true, note: 'Apenas exercícios estáticos (prancha, isometria). Evite impacto abdominal.' },
    ],
  },
  {
    id: 'JOELHO',
    trigger: 'Joelho',
    label: 'Problema no Joelho',
    icon: 'alert-circle',
    color: '#FF6B6B',
    rules: [
      { group: 'QUADRICEPS', addNote: true, note: 'Execução controlada. Qualquer desconforto no joelho, entre em contato que ajusto.' },
      { group: 'POSTERIORES', addNote: true, note: 'Amplitude reduzida. Avise se sentir qualquer dor.' },
    ],
  },
  {
    id: 'LOMBAR',
    trigger: 'Lombar',
    label: 'Problema na Lombar',
    icon: 'alert-circle',
    color: '#FF8E53',
    rules: [
      { group: 'COSTAS_REMADA', addNote: true, note: 'Mantenha a lombar neutra. Qualquer dor, me avise imediatamente.' },
      { group: 'POSTERIORES', addNote: true, note: 'Evite flexão excessiva do tronco. Execução lenta e controlada.' },
    ],
  },
  {
    id: 'CERVICAL',
    trigger: 'Cervical',
    label: 'Problema Cervical',
    icon: 'alert-circle',
    color: '#C77DFF',
    rules: [
      { group: 'OMBRO_MULTI', addNote: true, note: 'Prefira movimentos com apoio. Evite sobrecarregar a cervical.' },
      { group: 'TRAPEZIO', addNote: true, note: 'Amplitude reduzida. Avise se sentir irradiação para os braços.' },
    ],
  },
];

const LOADING_MESSAGES = [
  '🔍 Analisando histórico de treinos...',
  '📊 Aplicando sua configuração de ciclo...',
  '🧠 Respeitando limitações do aluno...',
  '⚡ Montando sua nova rotina...',
  '✅ Validando exercícios do banco...',
];

export default function GerarTreinoIA({ navigation, route }) {
  const { theme } = useTheme();
  const isWeb = Platform.OS === 'web';

  const [step, setStep] = useState(STEP_SELECT_STUDENT);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState('');
  const [error, setError] = useState('');

  // ─── CYCLE CONFIG STATE ───
  const [cyclePhase, setCyclePhase] = useState('HIPERTROFIA');
  const [defaultRest, setDefaultRest] = useState('60');
  const [selectedTechniques, setSelectedTechniques] = useState(['DROPSET', 'BISET']);
  const [techniqueScope, setTechniqueScope] = useState('CYCLE'); // CYCLE | DAY
  const [days, setDays] = useState([
    { id: '1', name: 'A', groups: [], editingName: false },
    { id: '2', name: 'B', groups: [], editingName: false },
    { id: '3', name: 'C', groups: [], editingName: false },
    { id: '4', name: 'D', groups: [], editingName: false },
  ]);
  const [activeDayId, setActiveDayId] = useState('1');
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [limitationRules, setLimitationRules] = useState(DEFAULT_LIMITATION_RULES);
  const [editingRuleId, setEditingRuleId] = useState(null);

  useEffect(() => {
    const alunoParam = route.params?.aluno;
    if (alunoParam && alunoParam.id) {
      setStep(STEP_CYCLE_CONFIG);
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
    } catch (e) { setError('Falha ao carregar alunos.'); }
    finally { setLoadingStudents(false); }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setLoadingDetail(true);
    setError('');
    try {
      const [resUser, resHistory] = await Promise.all([
        fetch(`${API_URL}/api/admin/user/${student.id}?t=${Date.now()}`),
        fetch(`${API_URL}/api/user/history?userId=${student.id}&t=${Date.now()}`),
      ]);
      const userData = resUser.ok ? await resUser.json() : student;
      const historyData = resHistory.ok ? await resHistory.json() : [];
      const workouts = userData.workouts || [];
      setStudentDetail({ ...userData, last3Workouts: workouts.slice(0, 3), totalSessions: Array.isArray(historyData) ? historyData.length : 0 });

      // Auto-detectar limitações e pré-configurar regras
      const anamnese = userData.anamneses?.[0];
      if (anamnese) {
        const allLimits = [...(anamnese.limitacoes || []), ...(anamnese.cirurgias || [])];
        // As regras já estão no estado, apenas marcamos as ativas
      }
    } catch (e) { setError('Falha ao carregar dados.'); }
    finally { setLoadingDetail(false); }
  };

  const handleGenerate = async () => {
    if (!selectedStudent) return;

    // Validar configuração
    const hasGroups = days.some(d => d.groups.length > 0);
    if (!hasGroups) {
      setError('Configure pelo menos um grupo muscular em algum dia.');
      return;
    }

    setStep(STEP_GENERATING);
    setError('');
    let msgIdx = 0;
    setGeneratingMsg(LOADING_MESSAGES[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setGeneratingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2800);

    try {
      const userJson = await AsyncStorage.getItem('user');
      const adminUser = userJson ? JSON.parse(userJson) : {};

      // Montar configuração do ciclo
      const cycleConfig = {
        phase: cyclePhase,
        defaultRest,
        techniques: selectedTechniques,
        techniqueScope,
        days: days
          .filter(d => d.groups.length > 0)
          .map(d => ({
            name: d.name,
            groups: d.groups.map(g => ({
              id: g.id,
              qty: g.qty,
              rest: g.rest ?? MUSCLE_GROUPS.find(mg => mg.id === g.id)?.defaultRest ?? 60,
            })),
          })),
        limitationRules: limitationRules.filter(rule => {
          const anamnese = studentDetail?.anamneses?.[0];
          if (!anamnese) return false;
          const allLimits = [...(anamnese.limitacoes || []), ...(anamnese.cirurgias || [])].map(l => l.toLowerCase());
          return allLimits.some(l => l.includes(rule.trigger.toLowerCase()));
        }),
      };

      const res = await fetch(`${API_URL}/api/ai/gerar-treino`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedStudent.id,
          adminId: adminUser.id,
          cycleConfig,
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

      navigation.replace('MontarTreinoAdmin', {
        aluno: selectedStudent,
        isEditing: false,
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
      setError(e.message || 'Falha ao gerar treino.');
      setStep(STEP_CYCLE_CONFIG);
    }
  };

  // ─── HELPERS DE DIAS ───
  const addDay = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextLetter = letters[days.length] || `D${days.length}`;
    setDays([...days, { id: Date.now().toString(), name: nextLetter, groups: [], editingName: false }]);
  };

  const removeDay = (id) => {
    if (days.length <= 1) return;
    setDays(days.filter(d => d.id !== id));
    if (activeDayId === id) setActiveDayId(days[0].id);
  };

  const updateDayName = (id, name) => {
    setDays(days.map(d => d.id === id ? { ...d, name } : d));
  };

  const applyTemplate = (template) => {
    setDays(days.map(d => {
      if (d.id !== activeDayId) return d;
      return {
        ...d,
        name: template.label,
        groups: template.groups.map(g => {
          const info = MUSCLE_GROUPS.find(mg => mg.id === g.id);
          return { ...g, rest: info?.defaultRest ?? 60 };
        }),
      };
    }));
    setShowTemplatePicker(false);
  };

  const addGroupToDay = (groupId) => {
    const groupInfo = MUSCLE_GROUPS.find(g => g.id === groupId);
    setDays(days.map(d => {
      if (d.id !== activeDayId) return d;
      const existing = d.groups.find(g => g.id === groupId);
      if (existing) return d;
      return { ...d, groups: [...d.groups, { id: groupId, qty: 3, rest: groupInfo?.defaultRest ?? 60 }] };
    }));
  };

  const updateGroupRest = (dayId, groupId, rest) => {
    setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.map(g => g.id === groupId ? { ...g, rest } : g) } : d));
  };

  const removeGroupFromDay = (dayId, groupId) => {
    setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.filter(g => g.id !== groupId) } : d));
  };

  const updateGroupQty = (dayId, groupId, qty) => {
    setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.map(g => g.id === groupId ? { ...g, qty } : g) } : d));
  };

  const toggleTechnique = (techId) => {
    setSelectedTechniques(prev =>
      prev.includes(techId) ? prev.filter(t => t !== techId) : [...prev, techId]
    );
  };

  const getGroupInfo = (id) => MUSCLE_GROUPS.find(g => g.id === id);

  const getLevelColor = (level) => {
    if (!level) return theme.textSecondary;
    const l = level.toLowerCase();
    if (l.includes('iniciante')) return '#32ADE6';
    if (l.includes('interm')) return '#FF9500';
    if (l.includes('avan')) return '#FF3B30';
    return theme.textSecondary;
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeDay = days.find(d => d.id === activeDayId);
  const anamnese = studentDetail?.anamneses?.[0];
  const allLimitations = [...(anamnese?.limitacoes || []), ...(anamnese?.cirurgias || [])];
  const activeRules = limitationRules.filter(rule =>
    allLimitations.some(l => l.toLowerCase().includes(rule.trigger.toLowerCase()))
  );

  // ─────────────────────────────────────────────
  // RENDER: HEADER
  // ─────────────────────────────────────────────
  const stepTitles = {
    [STEP_SELECT_STUDENT]: { title: 'Gerar Treino com IA', sub: 'Escolha o aluno' },
    [STEP_CYCLE_CONFIG]:   { title: selectedStudent?.name || 'Configurar Ciclo', sub: 'Monte a estrutura do treino' },
    [STEP_GENERATING]:     { title: 'Gerando...', sub: 'Aguarde um momento' },
  };
  const currentStepInfo = stepTitles[step] || stepTitles[STEP_SELECT_STUDENT];

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
      <TouchableOpacity
        onPress={() => {
          if (step === STEP_CYCLE_CONFIG) { setStep(STEP_SELECT_STUDENT); setSelectedStudent(null); setStudentDetail(null); }
          else navigation.goBack();
        }}
        style={[styles.backBtn, { backgroundColor: theme.surface }]}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
      </TouchableOpacity>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{currentStepInfo.title}</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{currentStepInfo.sub}</Text>
      </View>
      <View style={[styles.iaBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
        <MaterialCommunityIcons name="robot-outline" size={14} color={theme.accent} />
        <Text style={[styles.iaBadgeText, { color: theme.accent }]}>IA</Text>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────
  // RENDER: STEP 1 — SELECIONAR ALUNO
  // ─────────────────────────────────────────────
  const renderSelectStudent = () => (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.textSecondary} />
          <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Buscar aluno..." placeholderTextColor={theme.textSecondary} value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} /></TouchableOpacity>}
        </View>
      </View>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary, paddingHorizontal: 16, marginBottom: 8 }]}>{filteredStudents.length} ALUNOS</Text>
      {loadingStudents ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.accent} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {filteredStudents.map(student => (
            <TouchableOpacity key={student.id} style={[styles.studentCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { setStep(STEP_CYCLE_CONFIG); handleSelectStudent(student); }} activeOpacity={0.75}>
              <View style={[styles.avatar, { backgroundColor: theme.accent + '25' }]}>
                <Text style={[styles.avatarText, { color: theme.accent }]}>{(student.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>{student.name || 'Sem nome'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>{student.goal?.split('(Foco:')[0]?.trim() || 'Sem objetivo'}</Text>
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
        </ScrollView>
      )}
    </View>
  );

  // ─────────────────────────────────────────────
  // RENDER: STEP 2 — CONFIGURADOR DO CICLO
  // ─────────────────────────────────────────────
  const renderCycleConfig = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>

      {/* ── PERFIL DO ALUNO (compacto) ── */}
      {loadingDetail ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 20, alignItems: 'center' }]}>
          <ActivityIndicator size="small" color={theme.accent} />
        </View>
      ) : studentDetail && (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.avatar, { backgroundColor: theme.accent + '25' }]}>
              <Text style={[styles.avatarText, { color: theme.accent }]}>{(selectedStudent?.name || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.studentName, { color: theme.text }]}>{selectedStudent?.name}</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>{anamnese?.objetivo || 'Sem objetivo'} · {anamnese?.nivel || ''}</Text>
            </View>
            {anamnese?.frequencia && (
              <View style={[styles.levelBadge, { borderColor: theme.accent + '40', backgroundColor: theme.accent + '15' }]}>
                <Text style={[styles.levelBadgeText, { color: theme.accent }]}>{anamnese.frequencia}x/sem</Text>
              </View>
            )}
          </View>

          {/* Limitações ativas */}
          {activeRules.length > 0 && (
            <View style={{ marginTop: 12, gap: 6 }}>
              {activeRules.map(rule => (
                <View key={rule.id} style={[styles.alertBox, { backgroundColor: rule.color + '15', borderColor: rule.color + '40' }]}>
                  <MaterialCommunityIcons name={rule.icon} size={14} color={rule.color} />
                  <Text style={{ fontSize: 12, color: rule.color, fontWeight: '700', flex: 1 }}>{rule.label} detectado — regras aplicadas automaticamente</Text>
                  <TouchableOpacity onPress={() => setEditingRuleId(rule.id)}>
                    <MaterialCommunityIcons name="pencil" size={14} color={rule.color} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── FASE DO CICLO ── */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Fase do Ciclo</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {CYCLE_PHASES.map(phase => {
          const isSelected = cyclePhase === phase.id;
          return (
            <TouchableOpacity key={phase.id} style={[styles.phaseBtn, { backgroundColor: isSelected ? theme.accent : theme.surface, borderColor: isSelected ? theme.accent : theme.border }]} onPress={() => setCyclePhase(phase.id)}>
              <MaterialCommunityIcons name={phase.icon} size={16} color={isSelected ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
              <View>
                <Text style={[styles.phaseBtnLabel, { color: isSelected ? (theme.isDark ? '#000' : '#FFF') : theme.text }]}>{phase.label}</Text>
                <Text style={[styles.phaseBtnDesc, { color: isSelected ? (theme.isDark ? '#00000080' : '#FFFFFF80') : theme.textSecondary }]}>{phase.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── TÉCNICAS ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Técnicas Permitidas</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={[styles.scopeBtn, { backgroundColor: techniqueScope === 'CYCLE' ? theme.accent + '20' : 'transparent', borderColor: techniqueScope === 'CYCLE' ? theme.accent : theme.border }]} onPress={() => setTechniqueScope('CYCLE')}>
            <Text style={[styles.scopeBtnText, { color: techniqueScope === 'CYCLE' ? theme.accent : theme.textSecondary }]}>Ciclo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.scopeBtn, { backgroundColor: techniqueScope === 'DAY' ? theme.accent + '20' : 'transparent', borderColor: techniqueScope === 'DAY' ? theme.accent : theme.border }]} onPress={() => setTechniqueScope('DAY')}>
            <Text style={[styles.scopeBtnText, { color: techniqueScope === 'DAY' ? theme.accent : theme.textSecondary }]}>Por Dia</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {TECHNIQUES.map(tech => {
          const isSelected = selectedTechniques.includes(tech.id);
          return (
            <TouchableOpacity key={tech.id} style={[styles.techChip, { backgroundColor: isSelected ? theme.accent + '20' : theme.surface, borderColor: isSelected ? theme.accent : theme.border }]} onPress={() => toggleTechnique(tech.id)}>
              {isSelected && <MaterialCommunityIcons name="check" size={12} color={theme.accent} />}
              <Text style={[styles.techChipText, { color: isSelected ? theme.accent : theme.textSecondary }]}>{tech.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── DIAS DE TREINO ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Dias de Treino</Text>
        <TouchableOpacity onPress={addDay} style={[styles.addDayBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
          <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
          <Text style={[styles.addDayBtnText, { color: theme.accent }]}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs dos dias */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {days.map(day => {
            const isActive = day.id === activeDayId;
            const hasGroups = day.groups.length > 0;
            return (
              <TouchableOpacity key={day.id} style={[styles.dayTab, { backgroundColor: isActive ? theme.accent : theme.surface, borderColor: isActive ? theme.accent : (hasGroups ? theme.accent + '40' : theme.border) }]} onPress={() => setActiveDayId(day.id)}>
                <Text style={[styles.dayTabText, { color: isActive ? (theme.isDark ? '#000' : '#FFF') : theme.text }]}>{day.name}</Text>
                {hasGroups && <View style={[styles.dayTabDot, { backgroundColor: isActive ? (theme.isDark ? '#000' : '#FFF') : theme.accent }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Editor do dia ativo */}
      {activeDay && (
        <View style={[styles.dayEditor, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Nome do dia */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <TextInput
              style={[styles.dayNameInput, { color: theme.accent, borderColor: theme.accent + '40', backgroundColor: theme.accent + '08' }]}
              value={activeDay.name}
              onChangeText={v => updateDayName(activeDay.id, v)}
              placeholder="Nome do dia"
              placeholderTextColor={theme.textSecondary}
            />
            <TouchableOpacity onPress={() => setShowTemplatePicker(true)} style={[styles.templateBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.textSecondary} />
              <Text style={[styles.templateBtnText, { color: theme.textSecondary }]}>Template</Text>
            </TouchableOpacity>
            {days.length > 1 && (
              <TouchableOpacity onPress={() => removeDay(activeDay.id)} style={[styles.removeDayBtn]}>
                <MaterialCommunityIcons name="trash-can" size={16} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>

          {/* Grupos do dia */}
          {activeDay.groups.length === 0 ? (
            <View style={[styles.emptyDay, { borderColor: theme.border }]}>
              <MaterialCommunityIcons name="dumbbell" size={28} color={theme.textSecondary} style={{ opacity: 0.4 }} />
              <Text style={[styles.emptyDayText, { color: theme.textSecondary }]}>Nenhum grupo muscular</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {activeDay.groups.map(group => {
                const info = getGroupInfo(group.id);
                if (!info) return null;
                const restOptions = REST_OPTIONS_BY_TYPE[info.restType] || REST_OPTIONS_BY_TYPE['ISOLADO'];
                const currentRest = group.rest ?? info.defaultRest;
                return (
                  <View key={group.id} style={[styles.groupRow, { backgroundColor: info.color + '12', borderColor: info.color + '30' }]}>
                    {/* Linha principal: cor + nome + qty + remover */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.groupColorDot, { backgroundColor: info.color }]} />
                      <Text style={[styles.groupRowLabel, { color: theme.text }]}>{info.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                        <TouchableOpacity onPress={() => updateGroupQty(activeDay.id, group.id, Math.max(1, group.qty - 1))} style={[styles.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                          <MaterialCommunityIcons name="minus" size={14} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyText, { color: theme.text }]}>{group.qty}</Text>
                        <TouchableOpacity onPress={() => updateGroupQty(activeDay.id, group.id, Math.min(10, group.qty + 1))} style={[styles.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                          <MaterialCommunityIcons name="plus" size={14} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyLabel, { color: theme.textSecondary }]}>ex.</Text>
                        <TouchableOpacity onPress={() => removeGroupFromDay(activeDay.id, group.id)}>
                          <MaterialCommunityIcons name="close-circle" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* Linha de descanso */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <MaterialCommunityIcons name="timer-outline" size={13} color={theme.textSecondary} />
                      <Text style={[styles.restLabel, { color: theme.textSecondary }]}>Descanso:</Text>
                      {restOptions.map(opt => {
                        const isSelected = String(currentRest) === opt.id;
                        return (
                          <TouchableOpacity key={opt.id} onPress={() => updateGroupRest(activeDay.id, group.id, parseInt(opt.id))} style={[styles.restChip, { backgroundColor: isSelected ? info.color + '30' : theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isSelected ? info.color : 'transparent' }]}>
                            <Text style={[styles.restChipText, { color: isSelected ? info.color : theme.textSecondary, fontWeight: isSelected ? '900' : '600' }]}>{opt.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Botão adicionar grupo */}
          <TouchableOpacity onPress={() => setShowGroupPicker(true)} style={[styles.addGroupBtn, { borderColor: theme.accent + '40' }]}>
            <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
            <Text style={[styles.addGroupBtnText, { color: theme.accent }]}>Adicionar Grupo Muscular</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Erro */}
      {error ? (
        <View style={[styles.errorBox, { borderColor: '#FF3B3050', backgroundColor: 'rgba(255,59,48,0.08)' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* ── MODAL: GROUP PICKER ── */}
      <Modal visible={showGroupPicker} transparent animationType="slide" onRequestClose={() => setShowGroupPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Grupos Musculares</Text>
              <TouchableOpacity onPress={() => setShowGroupPicker(false)}>
                <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {MUSCLE_GROUPS.map(group => {
                const alreadyAdded = activeDay?.groups.some(g => g.id === group.id);
                return (
                  <TouchableOpacity key={group.id} style={[styles.groupPickerItem, { borderBottomColor: theme.border, opacity: alreadyAdded ? 0.4 : 1 }]} onPress={() => { if (!alreadyAdded) { addGroupToDay(group.id); setShowGroupPicker(false); } }}>
                    <View style={[styles.groupColorDot, { backgroundColor: group.color }]} />
                    <Text style={[styles.groupPickerLabel, { color: theme.text }]}>{group.label}</Text>
                    {alreadyAdded && <MaterialCommunityIcons name="check" size={16} color={theme.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: TEMPLATE PICKER ── */}
      <Modal visible={showTemplatePicker} transparent animationType="slide" onRequestClose={() => setShowTemplatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Templates de Dia</Text>
              <TouchableOpacity onPress={() => setShowTemplatePicker(false)}>
                <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {DAY_TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity key={idx} style={[styles.templatePickerItem, { borderBottomColor: theme.border }]} onPress={() => applyTemplate(tmpl)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.templatePickerLabel, { color: theme.text }]}>{tmpl.label}</Text>
                    <Text style={[styles.templatePickerDesc, { color: theme.textSecondary }]}>
                      {tmpl.groups.map(g => `${getGroupInfo(g.id)?.label} (${g.qty})`).join(' + ')}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );

  // ─────────────────────────────────────────────
  // RENDER: STEP 3 — GERANDO
  // ─────────────────────────────────────────────
  const renderGenerating = () => (
    <View style={[styles.center, { paddingHorizontal: 32 }]}>
      <View style={[styles.generatingIconBox, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
        <MaterialCommunityIcons name="robot-outline" size={52} color={theme.accent} />
      </View>
      <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 28 }} />
      <Text style={[styles.generatingTitle, { color: theme.text }]}>Gerando rotina...</Text>
      <Text style={[styles.generatingMsg, { color: theme.textSecondary }]}>{generatingMsg}</Text>
      <Text style={[styles.generatingNote, { color: theme.textSecondary + '80' }]}>Isso pode levar até 30 segundos</Text>
    </View>
  );

  // ─────────────────────────────────────────────
  // ROOT
  // ─────────────────────────────────────────────
  const rootStyle = isWeb
    ? { height: '100dvh', width: '100%', backgroundColor: theme.bg, display: 'flex', flexDirection: 'column' }
    : { flex: 1, backgroundColor: theme.bg };
  const Wrapper = isWeb ? View : SafeAreaView;

  return (
    <Wrapper style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      {renderHeader()}
      <View style={{ flex: 1, maxWidth: 700, width: '100%', alignSelf: 'center' }}>
        {step === STEP_SELECT_STUDENT && renderSelectStudent()}
        {step === STEP_CYCLE_CONFIG   && renderCycleConfig()}
        {step === STEP_GENERATING     && renderGenerating()}
      </View>

      {step === STEP_CYCLE_CONFIG && (
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <TouchableOpacity style={[styles.generateBtn, { backgroundColor: theme.accent }]} onPress={handleGenerate} activeOpacity={0.85}>
            <MaterialCommunityIcons name="robot-outline" size={22} color={theme.isDark ? '#000' : '#FFF'} />
            <Text style={[styles.generateBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>GERAR TREINO COM IA</Text>
          </TouchableOpacity>
          <Text style={[styles.footerNote, { color: theme.textSecondary }]}>O treino será aberto no editor para revisão</Text>
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  headerSub: { fontSize: 11, marginTop: 1 },
  iaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  iaBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', outlineStyle: 'none' },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900' },
  studentName: { fontSize: 15, fontWeight: '800' },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  levelBadgeText: { fontSize: 10, fontWeight: '800' },
  card: { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  alertBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  phaseBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, minWidth: '47%', flex: 1 },
  phaseBtnLabel: { fontSize: 13, fontWeight: '800' },
  phaseBtnDesc: { fontSize: 10, marginTop: 1 },
  chipBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipBtnText: { fontSize: 13, fontWeight: '700' },
  scopeBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  scopeBtnText: { fontSize: 11, fontWeight: '700' },
  techChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  techChipText: { fontSize: 12, fontWeight: '700' },
  addDayBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  addDayBtnText: { fontSize: 12, fontWeight: '700' },
  dayTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayTabText: { fontSize: 13, fontWeight: '800' },
  dayTabDot: { width: 6, height: 6, borderRadius: 3 },
  dayEditor: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 14 },
  dayNameInput: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, fontSize: 15, fontWeight: '800', outlineStyle: 'none' },
  templateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  templateBtnText: { fontSize: 11, fontWeight: '700' },
  removeDayBtn: { padding: 8 },
  emptyDay: { alignItems: 'center', paddingVertical: 24, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, gap: 8 },
  emptyDayText: { fontSize: 13 },
  groupRow: { padding: 10, borderRadius: 10, borderWidth: 1 },
  groupColorDot: { width: 10, height: 10, borderRadius: 5 },
  groupRowLabel: { flex: 1, fontSize: 13, fontWeight: '700' },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 15, fontWeight: '900', minWidth: 20, textAlign: 'center' },
  qtyLabel: { fontSize: 11 },
  addGroupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 10 },
  addGroupBtnText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 16, fontWeight: '900' },
  groupPickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  groupPickerLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  templatePickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  templatePickerLabel: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  templatePickerDesc: { fontSize: 11 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  errorText: { color: '#FF3B30', fontSize: 13, flex: 1, lineHeight: 18 },
  generatingIconBox: { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  generatingTitle: { fontSize: 20, fontWeight: '900', marginTop: 20, textAlign: 'center' },
  generatingMsg: { fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22 },
  generatingNote: { fontSize: 11, marginTop: 16, textAlign: 'center' },
  footer: { padding: 16, paddingBottom: 28, borderTopWidth: 1 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 16 },
  generateBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  footerNote: { textAlign: 'center', fontSize: 11, marginTop: 10 },
  restLabel: { fontSize: 11, fontWeight: '700' },
  restChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  restChipText: { fontSize: 11 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});