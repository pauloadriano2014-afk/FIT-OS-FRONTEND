// src/screens/GerarTreinoIA.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, Platform, StatusBar, TextInput, Modal, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = 'https://fitos-final.onrender.com';
const STORAGE_PRESETS_KEY = '@gerar_treino_presets';

const STEP_SELECT_STUDENT = 'SELECT_STUDENT';
const STEP_CYCLE_CONFIG   = 'CYCLE_CONFIG';
const STEP_GENERATING     = 'GENERATING';

// ─── GRUPOS MUSCULARES ───
const MUSCLE_GROUPS = [
  { id: 'QUADRICEPS',    label: 'Quadríceps',       color: '#FF6B6B', defaultRest: 60, restType: 'MULTI',   genderFilter: null    },
  { id: 'POSTERIORES',   label: 'Posteriores',      color: '#FF8E53', defaultRest: 60, restType: 'MULTI',   genderFilter: null    },
  { id: 'GLUTEOS',       label: 'Glúteos',          color: '#FF6B9D', defaultRest: 60, restType: 'MULTI',   genderFilter: null    },
  { id: 'PANTURRILHA',   label: 'Panturrilha',      color: '#C77DFF', defaultRest: 15, restType: 'PANT',    genderFilter: null    },
  { id: 'ADUTOR',        label: 'Adutor',           color: '#E8A0BF', defaultRest: 30, restType: 'ISOLADO', genderFilter: null    },
  { id: 'ABDUTOR',       label: 'Abdutor',          color: '#DDA0DD', defaultRest: 30, restType: 'ISOLADO', genderFilter: null    },
  { id: 'COSTAS_PUXADA', label: 'Costas — Puxada',  color: '#4ECDC4', defaultRest: 60, restType: 'MULTI',   genderFilter: null    },
  { id: 'COSTAS_REMADA', label: 'Costas — Remada',  color: '#45B7D1', defaultRest: 60, restType: 'MULTI',   genderFilter: null    },
  { id: 'OMBRO_MULTI',   label: 'Ombro — Multi.',   color: '#96CEB4', defaultRest: 60, restType: 'MULTI',   genderFilter: null    },
  { id: 'OMBRO_FRONTAL', label: 'Ombro — Frontal',  color: '#88D8B0', defaultRest: 30, restType: 'ISOLADO', genderFilter: null    },
  { id: 'OMBRO_LATERAL', label: 'Ombro — Lateral',  color: '#F0E68C', defaultRest: 30, restType: 'ISOLADO', genderFilter: null    },
  { id: 'OMBRO_POST',    label: 'Ombro — Post.',    color: '#DDA0DD', defaultRest: 30, restType: 'ISOLADO', genderFilter: null    },
  { id: 'TRAPEZIO',      label: 'Trapézio',         color: '#98D8C8', defaultRest: 30, restType: 'ISOLADO', genderFilter: null    },
  { id: 'PEITO',         label: 'Peito',            color: '#F7DC6F', defaultRest: 60, restType: 'MULTI',   genderFilter: null    },
  { id: 'BICEPS',        label: 'Bíceps',           color: '#82E0AA', defaultRest: 30, restType: 'ISOLADO', genderFilter: null    },
  { id: 'TRICEPS',       label: 'Tríceps',          color: '#85C1E9', defaultRest: 30, restType: 'ISOLADO', genderFilter: null    },
  { id: 'ABDOMEN',       label: 'Abdômen',          color: '#F1948A', defaultRest: 30, restType: 'ISOLADO', genderFilter: null    },
  { id: 'CARDIO',        label: 'Cardio',           color: '#FF6B6B', defaultRest: 0,  restType: 'CARDIO',  genderFilter: null    },
];

const REST_OPTIONS_BY_TYPE = {
  MULTI:   [{ id: '45', label: '45s' }, { id: '60', label: '60s' }, { id: '90', label: '90s' }, { id: '120', label: '2min' }, { id: '180', label: '3min' }],
  ISOLADO: [{ id: '15', label: '15s' }, { id: '30', label: '30s' }, { id: '45', label: '45s' }, { id: '60', label: '60s' }],
  PANT:    [{ id: '0',  label: '0s'  }, { id: '15', label: '15s' }, { id: '30', label: '30s' }],
  CARDIO:  [{ id: '0',  label: '0s'  }],
};

// ─── AMBIENTES DE TREINO ───
const TRAINING_ENVIRONMENTS = [
  { id: 'UNIVERSAL',       label: 'Todos',            icon: 'earth',           color: '#4ECDC4' },
  { id: 'SMARTFIT',        label: 'SmartFit',          icon: 'lightning-bolt',  color: '#FF6B35' },
  { id: 'GETGYM',          label: 'GetGym',            icon: 'dumbbell',        color: '#9B59B6' },
  { id: 'OVERALL',         label: 'Overall',           icon: 'dumbbell',        color: '#2ECC71' },
  { id: 'BRAVES',          label: 'Braves',            icon: 'dumbbell',        color: '#E74C3C' },
  { id: 'SEVENPLAY',       label: 'SevenPlay',         icon: 'dumbbell',        color: '#F39C12' },
  { id: 'ACADEMIA_PADRAO', label: 'Academia Padrão',   icon: 'weight-lifter',   color: '#3498DB' },
  { id: 'CONDOMINIO',      label: 'Condomínio',        icon: 'office-building', color: '#95A5A6' },
  { id: 'EM_CASA',         label: 'Em Casa',           icon: 'home-outline',    color: '#82E0AA' },
];

// ─── FASES DO CICLO (inclui Emagrecimento e Definição) ───
const CYCLE_PHASES = [
  { id: 'HIPERTROFIA',   label: 'Hipertrofia',    desc: 'Volume moderado, 8–15 reps',        icon: 'trending-up',     color: '#4ECDC4' },
  { id: 'FORCA',         label: 'Força',          desc: 'Cargas pesadas, 3–6 reps',          icon: 'arm-flex',        color: '#FF8E53' },
  { id: 'CHOQUE',        label: 'Choque',         desc: 'Volume alto, técnicas pesadas',     icon: 'lightning-bolt',  color: '#FF6B6B' },
  { id: 'DELOAD',        label: 'Deload',         desc: 'Volume leve, 15–20 reps, 60–70%',   icon: 'battery-low',     color: '#85C1E9' },
  { id: 'EMAGRECIMENTO', label: 'Emagrecimento',  desc: 'Circuito + cardio obrigatório',     icon: 'fire',            color: '#FF9500' },
  { id: 'DEFINICAO',     label: 'Definição',      desc: 'Preservar massa + cardio final',    icon: 'scissors-cutting',color: '#C77DFF' },
];

const TECHNIQUES = [
  { id: 'DROPSET',    label: 'Drop-set'    },
  { id: 'RESTPAUSE',  label: 'Rest-Pause'  },
  { id: 'BISET',      label: 'Bi-set'      },
  { id: '21',         label: 'Método 21'   },
  { id: 'CLUSTERSET', label: 'Cluster'     },
  { id: '1_5_REPS',   label: '1.5 Reps'   },
  { id: 'TUT',        label: 'TUT'         },
  { id: 'GVT',        label: 'GVT 10×10'  },
];

// ─── PRESETS POR GÊNERO ───
const buildPresets = (gender) => {
  const isFem = gender === 'Feminino';
  const base = [
    // PERNAS
    {
      category: 'Pernas',
      label: 'Pernas Completo',
      groups: [
        { id: 'QUADRICEPS', qty: 3 }, { id: 'POSTERIORES', qty: 2 },
        { id: 'GLUTEOS', qty: 2 }, { id: 'PANTURRILHA', qty: 2 },
        { id: 'ADUTOR', qty: 1 }, { id: 'ABDUTOR', qty: 1 },
      ],
    },
    { category: 'Pernas', label: 'Quadríceps Isolado',  groups: [{ id: 'QUADRICEPS', qty: 5 }, { id: 'PANTURRILHA', qty: 2 }] },
    { category: 'Pernas', label: 'Posteriores Isolado', groups: [{ id: 'POSTERIORES', qty: 4 }, { id: 'PANTURRILHA', qty: 2 }] },
    ...(isFem ? [
      { category: 'Pernas', label: 'Glúteos Foco',      groups: [{ id: 'GLUTEOS', qty: 5 }, { id: 'ABDUTOR', qty: 2 }, { id: 'PANTURRILHA', qty: 1 }] },
      { category: 'Pernas', label: 'Glúteos + Post.',   groups: [{ id: 'GLUTEOS', qty: 4 }, { id: 'POSTERIORES', qty: 3 }, { id: 'PANTURRILHA', qty: 1 }] },
    ] : []),
    // SUPERIORES
    { category: 'Superiores', label: 'Costas Completa',    groups: [{ id: 'COSTAS_PUXADA', qty: 3 }, { id: 'COSTAS_REMADA', qty: 3 }, { id: 'TRAPEZIO', qty: 1 }] },
    { category: 'Superiores', label: 'Peito Isolado',      groups: [{ id: 'PEITO', qty: 4 }, { id: 'TRICEPS', qty: 2 }] },
    { category: 'Superiores', label: 'Ombros Completo',    groups: [{ id: 'OMBRO_MULTI', qty: 2 }, { id: 'OMBRO_FRONTAL', qty: 1 }, { id: 'OMBRO_LATERAL', qty: 2 }, { id: 'OMBRO_POST', qty: 1 }, { id: 'TRAPEZIO', qty: 1 }] },
    { category: 'Superiores', label: 'Braços Isolado',     groups: [{ id: 'BICEPS', qty: 3 }, { id: 'TRICEPS', qty: 3 }, { id: 'ABDOMEN', qty: 2 }] },
    { category: 'Superiores', label: 'Costas + Ombros',    groups: [{ id: 'COSTAS_PUXADA', qty: 3 }, { id: 'COSTAS_REMADA', qty: 2 }, { id: 'OMBRO_MULTI', qty: 2 }, { id: 'TRAPEZIO', qty: 1 }] },
    ...(isFem ? [] : [
      { category: 'Superiores', label: 'Peito + Tríceps',  groups: [{ id: 'PEITO', qty: 3 }, { id: 'TRICEPS', qty: 3 }, { id: 'ABDOMEN', qty: 2 }] },
      { category: 'Superiores', label: 'Costas + Bíceps',  groups: [{ id: 'COSTAS_PUXADA', qty: 3 }, { id: 'COSTAS_REMADA', qty: 2 }, { id: 'BICEPS', qty: 3 }] },
    ]),
    // COMBINADOS
    { category: 'Combinados', label: 'Superior Geral',    groups: [{ id: 'PEITO', qty: 2 }, { id: 'COSTAS_PUXADA', qty: 2 }, { id: 'OMBRO_LATERAL', qty: 2 }, { id: 'BICEPS', qty: 2 }, { id: 'TRICEPS', qty: 2 }] },
    { category: 'Combinados', label: 'Full Body',         groups: [{ id: 'QUADRICEPS', qty: 2 }, { id: isFem ? 'GLUTEOS' : 'POSTERIORES', qty: 2 }, { id: 'COSTAS_REMADA', qty: 2 }, { id: 'PEITO', qty: 2 }, { id: 'ABDOMEN', qty: 1 }] },
    // ISOLADOS SIMPLES
    { category: 'Isolados',   label: 'Abdômen Isolado',   groups: [{ id: 'ABDOMEN', qty: 5 }] },
    { category: 'Isolados',   label: 'Cardio',            groups: [{ id: 'CARDIO', qty: 1 }] },
  ];
  return base;
};

const DEFAULT_LIMITATION_RULES = [
  {
    id: 'SILICONE', trigger: 'Prótese de Silicone', label: 'Prótese de Silicone',
    color: '#FF9500',
    rules: [{ group: 'PEITO', maxExercises: 2, forceLight: true, note: 'Amplitude reduzida, carga leve. Qualquer desconforto me avise imediatamente.' }],
  },
  {
    id: 'CESARÉA', trigger: 'Cesaréa', label: 'Cesaréa / Abdominoplastia',
    color: '#FF3B30',
    rules: [{ group: 'ABDOMEN', staticOnly: true, note: 'Apenas exercícios estáticos (prancha, isometria). Sem impacto abdominal.' }],
  },
  {
    id: 'JOELHO', trigger: 'Joelho', label: 'Problema no Joelho',
    color: '#FF6B6B',
    rules: [
      { group: 'QUADRICEPS', addNote: true, note: 'Execução controlada. Qualquer desconforto no joelho, entre em contato.' },
      { group: 'POSTERIORES', addNote: true, note: 'Amplitude reduzida. Avise se sentir qualquer dor.' },
    ],
  },
  {
    id: 'LOMBAR', trigger: 'Lombar', label: 'Problema na Lombar',
    color: '#FF8E53',
    rules: [
      { group: 'COSTAS_REMADA', addNote: true, note: 'Mantenha a lombar neutra. Qualquer dor me avise.' },
      { group: 'POSTERIORES', addNote: true, note: 'Sem flexão excessiva do tronco. Execução lenta e controlada.' },
    ],
  },
  {
    id: 'CERVICAL', trigger: 'Cervical', label: 'Problema Cervical',
    color: '#C77DFF',
    rules: [
      { group: 'OMBRO_MULTI', addNote: true, note: 'Prefira movimentos com apoio. Evite sobrecarregar a cervical.' },
      { group: 'TRAPEZIO', addNote: true, note: 'Amplitude reduzida. Avise se sentir irradiação para os braços.' },
    ],
  },
];

const LOADING_MSGS = [
  '🔍 Analisando histórico de treinos...',
  '📊 Aplicando sua configuração de ciclo...',
  '🧠 Respeitando limitações do aluno...',
  '⚡ Montando a nova rotina...',
  '✅ Validando exercícios do banco...',
];

// ─── HELPER: gera dias padrão baseado na frequência ───
const buildDefaultDays = (freq) => {
  const letters = 'ABCDEFGHIJKLMNOP';
  const count = Math.min(Math.max(freq || 3, 1), 7);
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1), name: letters[i], groups: [], editingName: false,
  }));
};

// ─── HELPER: fase sugerida pelo objetivo ───
const suggestPhase = (objetivo) => {
  if (!objetivo) return 'HIPERTROFIA';
  const o = objetivo.toLowerCase();
  if (o.includes('emagrec')) return 'EMAGRECIMENTO';
  if (o.includes('defin')) return 'DEFINICAO';
  if (o.includes('força') || o.includes('forca')) return 'FORCA';
  return 'HIPERTROFIA';
};

// ─── HELPER: cardio automático para emagrecimento/definição ───
const dayNeedsCardio = (groups, phase) => {
  if (!['EMAGRECIMENTO', 'DEFINICAO'].includes(phase)) return false;
  const hasCardio = groups.some(g => g.id === 'CARDIO');
  if (hasCardio) return false;
  const hasSuperiorOrAbs = groups.some(g =>
    ['PEITO','COSTAS_PUXADA','COSTAS_REMADA','OMBRO_MULTI','OMBRO_FRONTAL',
     'OMBRO_LATERAL','OMBRO_POST','TRAPEZIO','BICEPS','TRICEPS','ABDOMEN'].includes(g.id)
  );
  return hasSuperiorOrAbs;
};

export default function GerarTreinoIA({ navigation, route }) {
  const { theme } = useTheme();
  const isWeb = Platform.OS === 'web';
  const windowWidth = Dimensions.get('window').width;
  const isWebPC = isWeb && windowWidth > 768;
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  // ─── STATE ───
  const [step, setStep] = useState(STEP_SELECT_STUDENT);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState('');
  const [error, setError] = useState('');

  // Cycle config
  const [cyclePhase, setCyclePhase] = useState('HIPERTROFIA');
  const [selectedTechniques, setSelectedTechniques] = useState(['DROPSET', 'BISET']);
  const [techniqueScope, setTechniqueScope] = useState('CYCLE');
  const [trainingEnvironment, setTrainingEnvironment] = useState('ACADEMIA_PADRAO');
  const [days, setDays] = useState(buildDefaultDays(3));
  const [activeDayId, setActiveDayId] = useState('1');
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');

  // Modals
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showEnvPicker, setShowEnvPicker] = useState(false);
  const [showPresetSaver, setShowPresetSaver] = useState(false);
  const [showPresetsLoader, setShowPresetsLoader] = useState(false);
  const [limitationRules] = useState(DEFAULT_LIMITATION_RULES);

  // ─── EFFECTS ───
  useEffect(() => {
    loadSavedPresets();
    const alunoParam = route.params?.aluno;
    if (alunoParam?.id) {
      setStep(STEP_CYCLE_CONFIG);
      handleSelectStudent(alunoParam);
    } else {
      fetchStudents();
    }
  }, []);

  const loadSavedPresets = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_PRESETS_KEY);
      if (raw) setSavedPresets(JSON.parse(raw));
    } catch (_) {}
  };

  const savePreset = async () => {
    if (!presetName.trim()) return;
    const preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      phase: cyclePhase,
      techniques: selectedTechniques,
      techniqueScope,
      days: days.map(d => ({ name: d.name, groups: d.groups })),
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    await AsyncStorage.setItem(STORAGE_PRESETS_KEY, JSON.stringify(updated));
    setPresetName('');
    setShowPresetSaver(false);
  };

  const loadPreset = (preset) => {
    setCyclePhase(preset.phase);
    setSelectedTechniques(preset.techniques);
    setTechniqueScope(preset.techniqueScope);
    const loadedDays = preset.days.map((d, i) => ({
      id: String(i + 1),
      name: d.name,
      groups: d.groups.map(g => ({
        ...g,
        rest: g.rest ?? MUSCLE_GROUPS.find(mg => mg.id === g.id)?.defaultRest ?? 60,
      })),
      editingName: false,
    }));
    setDays(loadedDays);
    setActiveDayId('1');
    setShowPresetsLoader(false);
  };

  const deletePreset = async (id) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    await AsyncStorage.setItem(STORAGE_PRESETS_KEY, JSON.stringify(updated));
  };

  // ─── FETCH ───
  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/user?t=${Date.now()}`);
      if (res.ok) setStudents((await res.json()).filter(u => u.role !== 'ADMIN'));
    } catch (_) { setError('Falha ao carregar alunos.'); }
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
      setStudentDetail({
        ...userData,
        last3Workouts: (userData.workouts || []).slice(0, 3),
        totalSessions: Array.isArray(historyData) ? historyData.length : 0,
      });

      // Auto-configurar baseado na anamnese
      const anamnese = userData.anamneses?.[0];
      if (anamnese) {
        const freq = anamnese.frequencia || 3;
        setDays(buildDefaultDays(freq));
        setActiveDayId('1');
        setCyclePhase(suggestPhase(anamnese.objetivo));
      }
    } catch (_) { setError('Falha ao carregar dados.'); }
    finally { setLoadingDetail(false); }
  };

  // ─── GERAR ───
  const handleGenerate = async () => {
    if (!selectedStudent) return;
    const hasGroups = days.some(d => d.groups.length > 0);
    if (!hasGroups) { setError('Configure pelo menos um grupo muscular.'); return; }

    setStep(STEP_GENERATING);
    setError('');
    let msgIdx = 0;
    setGeneratingMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MSGS.length;
      setGeneratingMsg(LOADING_MSGS[msgIdx]);
    }, 2800);

    try {
      const userJson = await AsyncStorage.getItem('user');
      const adminUser = userJson ? JSON.parse(userJson) : {};
      const anamnese = studentDetail?.anamneses?.[0];
      const allLimits = [...(anamnese?.limitacoes || []), ...(anamnese?.cirurgias || [])].map(l => l.toLowerCase());

      // Adicionar cardio automático se fase de emagrecimento/definição
      const daysWithCardio = days
        .filter(d => d.groups.length > 0)
        .map(d => {
          const groups = [...d.groups];
          if (dayNeedsCardio(groups, cyclePhase)) {
            groups.push({ id: 'CARDIO', qty: 1, rest: 0, autoAdded: true });
          }
          return { name: d.name, groups: groups.map(g => ({
            id: g.id, qty: g.qty,
            rest: g.rest ?? MUSCLE_GROUPS.find(mg => mg.id === g.id)?.defaultRest ?? 60,
          })) };
        });

      const cycleConfig = {
        phase: cyclePhase,
        techniques: selectedTechniques,
        techniqueScope,
        gender: studentDetail?.gender || 'Não informado',
        trainingEnvironment: trainingEnvironment,
        days: daysWithCardio,
        limitationRules: limitationRules.filter(rule =>
          allLimits.some(l => l.includes(rule.trigger.toLowerCase()))
        ),
        cardioTarget: ['EMAGRECIMENTO', 'DEFINICAO'].includes(cyclePhase) ? 300 : null,
      };

      const res = await fetch(`${API_URL}/api/ai/gerar-treino`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedStudent.id, adminId: adminUser.id, cycleConfig }),
      });

      clearInterval(iv);
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao gerar');
      const data = await res.json();
      if (!data.exercisesByDay || !Object.keys(data.exercisesByDay).length)
        throw new Error('A IA não retornou exercícios. Tente novamente.');

      navigation.replace('MontarTreinoAdmin', {
        aluno: selectedStudent, isEditing: false,
        prefillData: {
          workoutName: data.workoutName, workoutModel: data.workoutModel || 'CARGA',
          exercisesByDay: data.exercisesByDay, workoutTabs: data.workoutTabs,
        },
      });
    } catch (e) {
      clearInterval(iv);
      setError(e.message || 'Falha ao gerar treino.');
      setStep(STEP_CYCLE_CONFIG);
    }
  };

  // ─── HELPERS DE DIAS ───
  const addDay = () => {
    const letters = 'ABCDEFGHIJKLMNOP';
    const name = letters[days.length] || `D${days.length + 1}`;
    const newDay = { id: Date.now().toString(), name, groups: [], editingName: false };
    setDays([...days, newDay]);
    setActiveDayId(newDay.id);
  };

  const removeDay = (id) => {
    if (days.length <= 1) return;
    const filtered = days.filter(d => d.id !== id);
    setDays(filtered);
    if (activeDayId === id) setActiveDayId(filtered[0].id);
  };

  const updateDayName = (id, name) => setDays(days.map(d => d.id === id ? { ...d, name } : d));

  const addGroupToDay = (groupId) => {
    const info = MUSCLE_GROUPS.find(g => g.id === groupId);
    setDays(days.map(d => {
      if (d.id !== activeDayId || d.groups.some(g => g.id === groupId)) return d;
      return { ...d, groups: [...d.groups, { id: groupId, qty: 3, rest: info?.defaultRest ?? 60 }] };
    }));
  };

  const removeGroupFromDay = (dayId, groupId) =>
    setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.filter(g => g.id !== groupId) } : d));

  const updateGroupQty = (dayId, groupId, qty) =>
    setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.map(g => g.id === groupId ? { ...g, qty } : g) } : d));

  const updateGroupRest = (dayId, groupId, rest) =>
    setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.map(g => g.id === groupId ? { ...g, rest } : g) } : d));

  const applyTemplate = (tmpl) => {
    setDays(days.map(d => d.id !== activeDayId ? d : {
      ...d, name: tmpl.label,
      groups: tmpl.groups.map(g => ({
        ...g, rest: MUSCLE_GROUPS.find(mg => mg.id === g.id)?.defaultRest ?? 60,
      })),
    }));
    setShowTemplatePicker(false);
  };

  const toggleTechnique = (id) =>
    setSelectedTechniques(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  // ─── COMPUTED ───
  const getGroupInfo = (id) => MUSCLE_GROUPS.find(g => g.id === id);
  const activeDay = days.find(d => d.id === activeDayId);
  const anamnese = studentDetail?.anamneses?.[0];
  const allLimitations = [...(anamnese?.limitacoes || []), ...(anamnese?.cirurgias || [])];
  const activeRules = limitationRules.filter(rule =>
    allLimitations.some(l => l.toLowerCase().includes(rule.trigger.toLowerCase()))
  );
  const gender = studentDetail?.gender || '';
  const presets = buildPresets(gender);
  const presetCategories = [...new Set(presets.map(p => p.category))];

  const getLevelColor = (level) => {
    if (!level) return theme.textSecondary;
    const l = level.toLowerCase();
    if (l.includes('iniciante')) return '#32ADE6';
    if (l.includes('interm')) return '#FF9500';
    return '#FF3B30';
  };

  const filteredStudents = students.filter(s =>
    (s.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (s.email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────
  // RENDER: HEADER
  // ─────────────────────────────────────────────
  const stepInfo = {
    [STEP_SELECT_STUDENT]: { title: 'Protocolo ELITE', sub: 'Selecione o aluno' },
    [STEP_CYCLE_CONFIG]:   { title: selectedStudent?.name?.split(' ')[0] || 'Configurar', sub: 'Monte a estrutura do treino' },
    [STEP_GENERATING]:     { title: 'Protocolo ELITE', sub: 'Gerando rotina...' },
  };

  const handleBack = () => {
    if (step === STEP_GENERATING) return; // bloqueia voltar durante geração
    if (step === STEP_CYCLE_CONFIG) {
      setStep(STEP_SELECT_STUDENT);
      setSelectedStudent(null);
      setStudentDetail(null);
      return;
    }
    navigation.goBack();
  };

  const renderHeader = () => (
    <View style={[S.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
      {step !== STEP_GENERATING && (
        <TouchableOpacity onPress={handleBack} style={[S.iconBtn, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
      )}

      <View style={{ flex: 1, marginHorizontal: step !== STEP_GENERATING ? 12 : 0 }}>
        <Text style={[S.headerTitle, { color: theme.text }]} numberOfLines={1}>{stepInfo[step]?.title}</Text>
        <Text style={[S.headerSub, { color: theme.textSecondary }]}>{stepInfo[step]?.sub}</Text>
      </View>

      <View style={[S.eliteBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
        <Text style={[S.eliteBadgeText, { color: theme.accent }]}>ELITE</Text>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────
  // RENDER: STEP 1 — SELECIONAR ALUNO
  // ─────────────────────────────────────────────
  const renderSelectStudent = () => (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <View style={[S.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="magnify" size={17} color={theme.textSecondary} />
          <TextInput
            style={[S.searchInput, { color: theme.text }]}
            placeholder="Buscar aluno..." placeholderTextColor={theme.textSecondary}
            value={search} onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={15} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loadingStudents ? (
        <View style={S.center}><ActivityIndicator color={theme.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {filteredStudents.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[S.studentRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => { setStep(STEP_CYCLE_CONFIG); handleSelectStudent(s); }}
            >
              <View style={[S.avatarCircle, { backgroundColor: theme.accent + '25' }]}>
                <Text style={[S.avatarLetter, { color: theme.accent }]}>{(s.name || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.studentName, { color: theme.text }]} numberOfLines={1}>{s.name}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }} numberOfLines={1}>
                  {s.goal?.split('(')[0]?.trim() || '—'}
                </Text>
              </View>
              {s.level && (
                <View style={[S.badge, { borderColor: getLevelColor(s.level) + '50', backgroundColor: getLevelColor(s.level) + '15' }]}>
                  <Text style={[S.badgeText, { color: getLevelColor(s.level) }]}>{s.level}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // ─────────────────────────────────────────────
  // RENDER: STEP 2 — CONFIGURADOR
  // ─────────────────────────────────────────────
  const renderCycleConfig = () => (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── CARD DO ALUNO ── */}
      {loadingDetail ? (
        <View style={[S.card, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', padding: 20 }]}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : studentDetail && (
        <View style={[S.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[S.avatarCircle, { backgroundColor: theme.accent + '25' }]}>
              <Text style={[S.avatarLetter, { color: theme.accent }]}>{(selectedStudent?.name || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.studentName, { color: theme.text }]} numberOfLines={1}>{selectedStudent?.name}</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                {anamnese?.objetivo || '—'} · {anamnese?.nivel || '—'} · {gender || '—'}
              </Text>
            </View>
            {anamnese?.frequencia && (
              <View style={[S.badge, { borderColor: theme.accent + '40', backgroundColor: theme.accent + '15' }]}>
                <Text style={[S.badgeText, { color: theme.accent }]}>{anamnese.frequencia}x/sem</Text>
              </View>
            )}
          </View>

          {/* Alertas de limitação */}
          {activeRules.length > 0 && (
            <View style={{ marginTop: 10, gap: 6 }}>
              {activeRules.map(rule => (
                <View key={rule.id} style={[S.alertRow, { backgroundColor: rule.color + '15', borderColor: rule.color + '30' }]}>
                  <MaterialCommunityIcons name="alert-circle" size={13} color={rule.color} />
                  <Text style={[S.alertText, { color: rule.color }]}>{rule.label} — regras aplicadas</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── AÇÕES RÁPIDAS ── */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          style={[S.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, flex: 1 }]}
          onPress={() => setShowPresetsLoader(true)}
        >
          <MaterialCommunityIcons name="bookmark-outline" size={15} color={theme.accent} />
          <Text style={[S.actionBtnText, { color: theme.accent }]}>Carregar Preset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, flex: 1 }]}
          onPress={() => setShowPresetSaver(true)}
        >
          <MaterialCommunityIcons name="content-save-outline" size={15} color={theme.textSecondary} />
          <Text style={[S.actionBtnText, { color: theme.textSecondary }]}>Salvar Preset</Text>
        </TouchableOpacity>
      </View>

      {/* ── AMBIENTE DE TREINO ── */}
      <Text style={[S.sectionTitle, { color: theme.textSecondary }]}>AMBIENTE DE TREINO</Text>
      <TouchableOpacity
        style={[S.envDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setShowEnvPicker(true)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {(() => {
            const env = TRAINING_ENVIRONMENTS.find(e => e.id === trainingEnvironment);
            return (
              <>
                <View style={[S.envIconSmall, { backgroundColor: (env?.color || theme.accent) + '20' }]}>
                  <MaterialCommunityIcons name={env?.icon || 'earth'} size={16} color={env?.color || theme.accent} />
                </View>
                <Text style={[S.envDropdownText, { color: theme.text }]}>{env?.label || 'Selecionar'}</Text>
              </>
            );
          })()}
        </View>
        <MaterialCommunityIcons name="chevron-down" size={18} color={theme.textSecondary} />
      </TouchableOpacity>

      {/* Modal picker de ambiente */}
      <Modal visible={showEnvPicker} transparent animationType="slide" onRequestClose={() => setShowEnvPicker(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={S.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[S.modalTitle, { color: theme.text }]}>Ambiente de Treino</Text>
              <TouchableOpacity onPress={() => setShowEnvPicker(false)}>
                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 460 }}>
              {TRAINING_ENVIRONMENTS.map(env => {
                const isSel = trainingEnvironment === env.id;
                return (
                  <TouchableOpacity
                    key={env.id}
                    style={[S.pickerRow, { borderBottomColor: theme.border, backgroundColor: isSel ? env.color + '10' : 'transparent' }]}
                    onPress={() => { setTrainingEnvironment(env.id); setShowEnvPicker(false); }}
                  >
                    <View style={[S.envIconSmall, { backgroundColor: env.color + '20' }]}>
                      <MaterialCommunityIcons name={env.icon} size={16} color={env.color} />
                    </View>
                    <Text style={[S.groupLabel, { color: isSel ? env.color : theme.text, flex: 1, fontWeight: isSel ? '900' : '700' }]}>{env.label}</Text>
                    {isSel && <MaterialCommunityIcons name="check-circle" size={18} color={env.color} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── FASE DO CICLO ── */}
      <Text style={[S.sectionTitle, { color: theme.textSecondary }]}>FASE DO CICLO</Text>
      <View style={{ gap: 8, marginBottom: 20 }}>
        {[CYCLE_PHASES.slice(0, 3), CYCLE_PHASES.slice(3)].map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map(phase => {
              const isSel = cyclePhase === phase.id;
              return (
                <TouchableOpacity
                  key={phase.id}
                  style={[S.phaseCard, {
                    flex: 1,
                    backgroundColor: isSel ? phase.color + '20' : theme.surface,
                    borderColor: isSel ? phase.color : theme.border,
                  }]}
                  onPress={() => setCyclePhase(phase.id)}
                >
                  <MaterialCommunityIcons name={phase.icon} size={18} color={isSel ? phase.color : theme.textSecondary} />
                  <Text style={[S.phaseLabel, { color: isSel ? phase.color : theme.text }]}>{phase.label}</Text>
                  <Text style={[S.phaseDesc, { color: theme.textSecondary }]} numberOfLines={2}>{phase.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Aviso cardio automático */}
      {['EMAGRECIMENTO', 'DEFINICAO'].includes(cyclePhase) && (
        <View style={[S.infoRow, { backgroundColor: '#FF9500' + '15', borderColor: '#FF9500' + '30', marginBottom: 16 }]}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#FF9500" />
          <Text style={{ fontSize: 12, color: '#FF9500', flex: 1 }}>
            Cardio de 300kcal será adicionado automaticamente nos dias de superiores e abdômen.
          </Text>
        </View>
      )}

      {/* ── TÉCNICAS ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={[S.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>TÉCNICAS</Text>
        <View style={[S.segmentedControl, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          {['CYCLE', 'DAY'].map(scope => (
            <TouchableOpacity
              key={scope}
              style={[S.segmentBtn, techniqueScope === scope && { backgroundColor: theme.accent }]}
              onPress={() => setTechniqueScope(scope)}
            >
              <Text style={[S.segmentBtnText, { color: techniqueScope === scope ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>
                {scope === 'CYCLE' ? 'Ciclo' : 'Por Dia'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
        {TECHNIQUES.map(tech => {
          const isSel = selectedTechniques.includes(tech.id);
          return (
            <TouchableOpacity
              key={tech.id}
              style={[S.techChip, {
                backgroundColor: isSel ? theme.accent + '20' : theme.surface,
                borderColor: isSel ? theme.accent : theme.border,
              }]}
              onPress={() => toggleTechnique(tech.id)}
            >
              {isSel && <MaterialCommunityIcons name="check" size={11} color={theme.accent} />}
              <Text style={[S.techChipText, { color: isSel ? theme.accent : theme.textSecondary }]}>{tech.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── DIAS DE TREINO ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={[S.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>DIAS DE TREINO</Text>
        <TouchableOpacity onPress={addDay} style={[S.addDayBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
          <MaterialCommunityIcons name="plus" size={13} color={theme.accent} />
          <Text style={[S.addDayBtnText, { color: theme.accent }]}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {days.map(day => {
            const isAct = day.id === activeDayId;
            const filled = day.groups.length > 0;
            return (
              <TouchableOpacity
                key={day.id}
                style={[S.dayTab, {
                  backgroundColor: isAct ? theme.accent : theme.surface,
                  borderColor: isAct ? theme.accent : filled ? theme.accent + '50' : theme.border,
                }]}
                onPress={() => setActiveDayId(day.id)}
              >
                <Text style={[S.dayTabText, { color: isAct ? (theme.isDark ? '#000' : '#FFF') : theme.text }]}>
                  {day.name || '?'}
                </Text>
                {filled && !isAct && (
                  <View style={[S.dayDot, { backgroundColor: theme.accent }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Editor do dia ativo */}
      {activeDay && (
        <View style={[S.dayEditor, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header do dia */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TextInput
              style={[S.dayNameInput, { color: theme.accent, borderColor: theme.accent + '30', backgroundColor: theme.accent + '08', flex: 1 }]}
              value={activeDay.name}
              onChangeText={v => updateDayName(activeDay.id, v)}
              placeholder="Nome" placeholderTextColor={theme.textSecondary}
            />
            <TouchableOpacity
              style={[S.smallBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}
              onPress={() => setShowTemplatePicker(true)}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={13} color={theme.textSecondary} />
              <Text style={[S.smallBtnText, { color: theme.textSecondary }]}>Template</Text>
            </TouchableOpacity>
            {days.length > 1 && (
              <TouchableOpacity onPress={() => removeDay(activeDay.id)} style={{ padding: 6 }}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>

          {/* Cardio aviso */}
          {dayNeedsCardio(activeDay.groups, cyclePhase) && (
            <View style={[S.infoRow, { backgroundColor: '#FF9500' + '12', borderColor: '#FF9500' + '30', marginBottom: 10 }]}>
              <MaterialCommunityIcons name="heart-pulse" size={13} color="#FF9500" />
              <Text style={{ fontSize: 11, color: '#FF9500', flex: 1 }}>Cardio 300kcal será adicionado automaticamente</Text>
            </View>
          )}

          {/* Grupos */}
          {activeDay.groups.length === 0 ? (
            <View style={[S.emptyState, { borderColor: theme.border }]}>
              <MaterialCommunityIcons name="dumbbell" size={26} color={theme.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6 }}>Nenhum grupo adicionado</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {activeDay.groups.map(group => {
                const info = getGroupInfo(group.id);
                if (!info) return null;
                const restOpts = REST_OPTIONS_BY_TYPE[info.restType] || REST_OPTIONS_BY_TYPE['ISOLADO'];
                const curRest = group.rest ?? info.defaultRest;
                return (
                  <View key={group.id} style={[S.groupCard, { backgroundColor: info.color + '10', borderColor: info.color + '25' }]}>
                    {/* Linha 1: nome + qty + remover */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[S.groupDot, { backgroundColor: info.color }]} />
                      <Text style={[S.groupLabel, { color: theme.text, flex: 1 }]}>{info.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity onPress={() => updateGroupQty(activeDay.id, group.id, Math.max(1, group.qty - 1))} style={[S.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                          <MaterialCommunityIcons name="minus" size={13} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[S.qtyNum, { color: theme.text }]}>{group.qty}</Text>
                        <TouchableOpacity onPress={() => updateGroupQty(activeDay.id, group.id, Math.min(10, group.qty + 1))} style={[S.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                          <MaterialCommunityIcons name="plus" size={13} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 10, color: theme.textSecondary }}>ex.</Text>
                        <TouchableOpacity onPress={() => removeGroupFromDay(activeDay.id, group.id)}>
                          <MaterialCommunityIcons name="close-circle" size={17} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* Linha 2: descanso */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <MaterialCommunityIcons name="timer-outline" size={12} color={theme.textSecondary} />
                      <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: '700' }}>Descanso:</Text>
                      {restOpts.map(opt => {
                        const isSel = String(curRest) === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            onPress={() => updateGroupRest(activeDay.id, group.id, parseInt(opt.id))}
                            style={[S.restChip, {
                              backgroundColor: isSel ? info.color + '25' : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                              borderColor: isSel ? info.color + '80' : 'transparent',
                            }]}
                          >
                            <Text style={[S.restChipText, { color: isSel ? info.color : theme.textSecondary, fontWeight: isSel ? '900' : '600' }]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            onPress={() => setShowGroupPicker(true)}
            style={[S.addGroupBtn, { borderColor: theme.accent + '40' }]}
          >
            <MaterialCommunityIcons name="plus" size={15} color={theme.accent} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.accent }}>Adicionar Grupo Muscular</Text>
          </TouchableOpacity>
        </View>
      )}

      {error ? (
        <View style={[S.errorBox, { backgroundColor: 'rgba(255,59,48,0.08)', borderColor: '#FF3B3040' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#FF3B30" />
          <Text style={{ fontSize: 13, color: '#FF3B30', flex: 1 }}>{error}</Text>
        </View>
      ) : null}

      {/* ── MODAIS ── */}

      {/* GROUP PICKER */}
      <Modal visible={showGroupPicker} transparent animationType="slide" onRequestClose={() => setShowGroupPicker(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={S.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[S.modalTitle, { color: theme.text }]}>Grupos Musculares</Text>
              <TouchableOpacity onPress={() => setShowGroupPicker(false)}>
                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {MUSCLE_GROUPS.map(g => {
                const added = activeDay?.groups.some(ag => ag.id === g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[S.pickerRow, { borderBottomColor: theme.border, opacity: added ? 0.4 : 1 }]}
                    onPress={() => { if (!added) { addGroupToDay(g.id); setShowGroupPicker(false); } }}
                  >
                    <View style={[S.groupDot, { backgroundColor: g.color }]} />
                    <Text style={[S.groupLabel, { color: theme.text, flex: 1 }]}>{g.label}</Text>
                    {added && <MaterialCommunityIcons name="check" size={15} color={theme.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* TEMPLATE PICKER */}
      <Modal visible={showTemplatePicker} transparent animationType="slide" onRequestClose={() => setShowTemplatePicker(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={S.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[S.modalTitle, { color: theme.text }]}>Templates{gender ? ` — ${gender}` : ''}</Text>
              <TouchableOpacity onPress={() => setShowTemplatePicker(false)}>
                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 460 }}>
              {presetCategories.map(cat => (
                <View key={cat}>
                  <Text style={[S.pickerCategory, { color: theme.textSecondary }]}>{cat.toUpperCase()}</Text>
                  {presets.filter(p => p.category === cat).map((tmpl, i) => (
                    <TouchableOpacity key={i} style={[S.pickerRow, { borderBottomColor: theme.border }]} onPress={() => applyTemplate(tmpl)}>
                      <View style={{ flex: 1 }}>
                        <Text style={[S.groupLabel, { color: theme.text }]}>{tmpl.label}</Text>
                        <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                          {tmpl.groups.map(g => `${getGroupInfo(g.id)?.label} (${g.qty})`).join(' · ')}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SALVAR PRESET */}
      <Modal visible={showPresetSaver} transparent animationType="fade" onRequestClose={() => setShowPresetSaver(false)}>
        <View style={[S.modalOverlay, { justifyContent: 'center', padding: 24 }]}>
          <View style={[S.modalBox, { backgroundColor: theme.surface }]}>
            <Text style={[S.modalTitle, { color: theme.text, marginBottom: 14 }]}>Salvar Configuração</Text>
            <TextInput
              style={[S.nameInput, { color: theme.text, borderColor: theme.accent + '50', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}
              placeholder="Nome do preset..." placeholderTextColor={theme.textSecondary}
              value={presetName} onChangeText={setPresetName} autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[S.modalBtn, { backgroundColor: theme.border, flex: 1 }]} onPress={() => setShowPresetSaver(false)}>
                <Text style={{ color: theme.text, fontWeight: '700', textAlign: 'center' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.modalBtn, { backgroundColor: theme.accent, flex: 1 }]} onPress={savePreset}>
                <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', textAlign: 'center' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CARREGAR PRESET */}
      <Modal visible={showPresetsLoader} transparent animationType="slide" onRequestClose={() => setShowPresetsLoader(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={S.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[S.modalTitle, { color: theme.text }]}>Meus Presets</Text>
              <TouchableOpacity onPress={() => setShowPresetsLoader(false)}>
                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {savedPresets.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="bookmark-outline" size={36} color={theme.textSecondary} style={{ opacity: 0.4 }} />
                <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Nenhum preset salvo ainda</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {savedPresets.map(p => (
                  <View key={p.id} style={[S.pickerRow, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => loadPreset(p)}>
                      <Text style={[S.groupLabel, { color: theme.text }]}>{p.name}</Text>
                      <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                        {p.phase} · {p.days.length} dias
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deletePreset(p.id)} style={{ padding: 6 }}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );

  // ─────────────────────────────────────────────
  // RENDER: GERANDO
  // ─────────────────────────────────────────────
  const renderGenerating = () => (
    <View style={[S.center, { paddingHorizontal: 32 }]}>
      <View style={[S.generatingBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
        <Text style={[S.eliteGeneratingText, { color: theme.accent }]}>ELITE</Text>
      </View>
      <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 24 }} />
      <Text style={[S.generatingTitle, { color: theme.text }]}>Montando protocolo...</Text>
      <Text style={[S.generatingMsg, { color: theme.textSecondary }]}>{generatingMsg}</Text>
      <Text style={{ fontSize: 11, color: theme.textSecondary + '60', marginTop: 14, textAlign: 'center' }}>
        Isso pode levar até 30 segundos
      </Text>
    </View>
  );

  // ─────────────────────────────────────────────
  // ROOT
  // ─────────────────────────────────────────────
  const Wrapper = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100dvh', width: '100%', backgroundColor: webOuterBg, display: 'flex', flexDirection: 'column' }
    : { flex: 1, backgroundColor: theme.bg };

  return (
    <Wrapper style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <View style={isWeb ? { flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center', backgroundColor: theme.bg, borderLeftWidth: isWebPC ? 1 : 0, borderRightWidth: isWebPC ? 1 : 0, borderColor: theme.border, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : { flex: 1 }}>
        {renderHeader()}
        <View style={{ flex: 1 }}>
          {step === STEP_SELECT_STUDENT && renderSelectStudent()}
          {step === STEP_CYCLE_CONFIG   && renderCycleConfig()}
          {step === STEP_GENERATING     && renderGenerating()}
        </View>
        {step === STEP_CYCLE_CONFIG && (
          <View style={[S.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
            <TouchableOpacity style={[S.generateBtn, { backgroundColor: theme.accent }]} onPress={handleGenerate}>
              <Text style={[S.generateBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>GERAR PROTOCOLO ELITE</Text>
            </TouchableOpacity>
            <Text style={{ textAlign: 'center', fontSize: 11, color: theme.textSecondary, marginTop: 8 }}>
              O protocolo será aberto no editor para revisão
            </Text>
          </View>
        )}
      </View>
    </Wrapper>
  );
}

// Helper para acessar valores do tema nos estilos inline
const S_theme = (theme) => ({ surface: theme.surface, border: theme.border });

// ─── ESTILOS ───
const S = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 11, marginTop: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  eliteBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  eliteBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  eliteGeneratingText: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  envBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  envBtnText: { fontSize: 12, fontWeight: '700' },
  envDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 13, borderWidth: 1, marginBottom: 20 },
  envDropdownText: { fontSize: 14, fontWeight: '800' },
  envIconSmall: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, outlineStyle: 'none' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 13, borderWidth: 1, marginBottom: 9 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 17, fontWeight: '900' },
  studentName: { fontSize: 14, fontWeight: '800' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  card: { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 8, borderRadius: 8, borderWidth: 1 },
  alertText: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 9, borderRadius: 9, borderWidth: 1 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 },
  phaseCard: { borderRadius: 12, padding: 12, borderWidth: 1, gap: 4 },
  phaseLabel: { fontSize: 13, fontWeight: '800' },
  phaseDesc: { fontSize: 10, lineHeight: 14 },
  segmentedControl: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', padding: 2, gap: 2 },
  segmentBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  segmentBtnText: { fontSize: 11, fontWeight: '700' },
  techChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  techChipText: { fontSize: 12, fontWeight: '700' },
  addDayBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 9, borderWidth: 1 },
  addDayBtnText: { fontSize: 12, fontWeight: '700' },
  dayTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  dayTabText: { fontSize: 13, fontWeight: '800' },
  dayDot: { width: 5, height: 5, borderRadius: 2.5 },
  dayEditor: { borderRadius: 15, padding: 13, borderWidth: 1, marginBottom: 14 },
  dayNameInput: { padding: 9, borderRadius: 9, borderWidth: 1, fontSize: 14, fontWeight: '800', outlineStyle: 'none' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  smallBtnText: { fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 22, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 11 },
  groupCard: { padding: 10, borderRadius: 10, borderWidth: 1 },
  groupDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  groupLabel: { fontSize: 13, fontWeight: '700' },
  qtyBtn: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 14, fontWeight: '900', minWidth: 18, textAlign: 'center' },
  restChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, borderWidth: 1 },
  restChipText: { fontSize: 11 },
  addGroupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, borderRadius: 9, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 11, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 11, borderWidth: 1, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 36 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '900' },
  modalBox: { borderRadius: 18, padding: 20 },
  modalBtn: { padding: 13, borderRadius: 11 },
  nameInput: { padding: 12, borderRadius: 11, borderWidth: 1, fontSize: 15, outlineStyle: 'none' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
  pickerCategory: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, paddingVertical: 8 },
  generatingBox: { width: 90, height: 90, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  generatingTitle: { fontSize: 19, fontWeight: '900', marginTop: 18, textAlign: 'center' },
  generatingMsg: { fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  footer: { padding: 14, paddingBottom: 24, borderTopWidth: 1 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 17, borderRadius: 15 },
  generateBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 0.4 },
});