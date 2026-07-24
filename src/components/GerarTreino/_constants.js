// src/components/GerarTreino/_constants.js

export const API_URL = 'https://fitos-final.onrender.com';
export const STORAGE_PRESETS_KEY = '@gerar_treino_presets';

export const STEP_SELECT_STUDENT = 'SELECT_STUDENT';
export const STEP_CYCLE_CONFIG   = 'CYCLE_CONFIG';
export const STEP_GENERATING     = 'GENERATING';

export const MUSCLE_GROUPS = [
  { id: 'QUADRICEPS',    label: 'Quadríceps',       color: '#FF6B6B', defaultRest: 60, defaultSets: 4, restType: 'MULTI'   },
  { id: 'POSTERIORES',   label: 'Posteriores',      color: '#FF8E53', defaultRest: 60, defaultSets: 4, restType: 'MULTI'   },
  { id: 'GLUTEOS',       label: 'Glúteos',          color: '#FF6B9D', defaultRest: 60, defaultSets: 4, restType: 'MULTI'   },
  { id: 'PANTURRILHA',   label: 'Panturrilha',      color: '#C77DFF', defaultRest: 15, defaultSets: 3, restType: 'PANT'    },
  { id: 'ADUTOR',        label: 'Adutor',           color: '#E8A0BF', defaultRest: 30, defaultSets: 3, restType: 'ISOLADO' },
  { id: 'ABDUTOR',       label: 'Abdutor',          color: '#DDA0DD', defaultRest: 30, defaultSets: 3, restType: 'ISOLADO' },
  { id: 'COSTAS_PUXADA', label: 'Costas — Puxada',  color: '#4ECDC4', defaultRest: 60, defaultSets: 4, restType: 'MULTI'   },
  { id: 'COSTAS_REMADA', label: 'Costas — Remada',  color: '#45B7D1', defaultRest: 60, defaultSets: 4, restType: 'MULTI'   },
  { id: 'OMBRO_MULTI',   label: 'Ombro — Multi.',   color: '#96CEB4', defaultRest: 60, defaultSets: 4, restType: 'MULTI'   },
  { id: 'OMBRO_FRONTAL', label: 'Ombro — Frontal',  color: '#88D8B0', defaultRest: 30, defaultSets: 3, restType: 'ISOLADO' },
  { id: 'OMBRO_LATERAL', label: 'Ombro — Lateral',  color: '#F0E68C', defaultRest: 30, defaultSets: 3, restType: 'ISOLADO' },
  { id: 'OMBRO_POST',    label: 'Ombro — Post.',    color: '#DDA0DD', defaultRest: 30, defaultSets: 3, restType: 'ISOLADO' },
  { id: 'TRAPEZIO',      label: 'Trapézio',         color: '#98D8C8', defaultRest: 30, defaultSets: 3, restType: 'ISOLADO' },
  { id: 'PEITO',         label: 'Peito',            color: '#F7DC6F', defaultRest: 60, defaultSets: 4, restType: 'MULTI'   },
  { id: 'BICEPS',        label: 'Bíceps',           color: '#82E0AA', defaultRest: 30, defaultSets: 3, restType: 'ISOLADO' },
  { id: 'TRICEPS',       label: 'Tríceps',          color: '#85C1E9', defaultRest: 30, defaultSets: 3, restType: 'ISOLADO' },
  { id: 'ABDOMEN',       label: 'Abdômen',          color: '#F1948A', defaultRest: 30, defaultSets: 3, restType: 'ISOLADO' },
  { id: 'CARDIO',        label: 'Cardio',           color: '#FF6B6B', defaultRest: 0,  defaultSets: 1, restType: 'CARDIO'  },
  // 🔥 NOVO: Mobilidade — seleção manual, não passa pela IA
  { id: 'MOBILIDADE',    label: 'Mobilidade',       color: '#5AC8FA', defaultRest: 30, defaultSets: 2, restType: 'ISOLADO', manualPick: true },
];

export const REST_OPTIONS_BY_TYPE = {
  MULTI:   [{ id: '45', label: '45s' }, { id: '60', label: '60s' }, { id: '90', label: '90s' }, { id: '120', label: '2min' }, { id: '180', label: '3min' }],
  ISOLADO: [{ id: '15', label: '15s' }, { id: '30', label: '30s' }, { id: '45', label: '45s' }, { id: '60', label: '60s' }],
  PANT:    [{ id: '0',  label: '0s'  }, { id: '15', label: '15s' }, { id: '30', label: '30s' }],
  CARDIO:  [{ id: '0',  label: '0s'  }],
};

export const TRAINING_ENVIRONMENTS = [
  { id: 'UNIVERSAL',       label: 'Todos',           icon: 'earth',           color: '#4ECDC4' },
  { id: 'SMARTFIT',        label: 'SmartFit',         icon: 'lightning-bolt',  color: '#FF6B35' },
  { id: 'GETGYM',          label: 'GetGym',           icon: 'dumbbell',        color: '#9B59B6' },
  { id: 'OVERALL',         label: 'Overall',          icon: 'dumbbell',        color: '#2ECC71' },
  { id: 'BRAVES',          label: 'Braves',           icon: 'dumbbell',        color: '#E74C3C' },
  { id: 'SEVENPLAY',       label: 'SevenPlay',        icon: 'dumbbell',        color: '#F39C12' },
  { id: 'ACADEMIA_PADRAO', label: 'Academia Padrão',  icon: 'weight-lifter',   color: '#3498DB' },
  { id: 'CONDOMINIO',      label: 'Condomínio',       icon: 'office-building', color: '#95A5A6' },
  { id: 'EM_CASA',         label: 'Em Casa',          icon: 'home-outline',    color: '#82E0AA' },
];

export const CYCLE_PHASES = [
  { id: 'HIPERTROFIA',   label: 'Hipertrofia',   desc: 'Volume moderado, 8–15 reps',      icon: 'trending-up',      color: '#4ECDC4' },
  { id: 'FORCA',         label: 'Força',         desc: 'Cargas pesadas, 3–6 reps',        icon: 'arm-flex',         color: '#FF8E53' },
  { id: 'CHOQUE',        label: 'Choque',        desc: 'Volume alto, técnicas pesadas',   icon: 'lightning-bolt',   color: '#FF6B6B' },
  { id: 'DELOAD',        label: 'Deload',        desc: 'Volume leve, 15–20 reps, 60–70%', icon: 'battery-low',      color: '#85C1E9' },
  { id: 'EMAGRECIMENTO', label: 'Emagrecimento', desc: 'Circuito + cardio obrigatório',   icon: 'fire',             color: '#FF9500' },
  { id: 'DEFINICAO',     label: 'Definição',     desc: 'Preservar massa + cardio final',  icon: 'scissors-cutting', color: '#C77DFF' },
];

export const TECHNIQUES = [
  { id: 'DROPSET',    label: 'Drop-set'   },
  { id: 'RESTPAUSE',  label: 'Rest-Pause' },
  { id: 'BISET',      label: 'Bi-set'     },
  { id: '21',         label: 'Método 21'  },
  { id: 'CLUSTERSET', label: 'Cluster'    },
  { id: '1_5_REPS',   label: '1.5 Reps'  },
  { id: 'TUT',        label: 'TUT'        },
  { id: 'GVT',        label: 'GVT 10×10' },
];

export const DEFAULT_LIMITATION_RULES = [
  {
    id: 'SILICONE', trigger: 'Prótese de Silicone', label: 'Prótese de Silicone', color: '#FF9500',
    rules: [{ group: 'PEITO', maxExercises: 2, forceLight: true, note: 'Amplitude reduzida, carga leve. Qualquer desconforto me avise imediatamente.' }],
  },
  {
    id: 'CESARÉA', trigger: 'Cesaréa', label: 'Cesaréa / Abdominoplastia', color: '#FF3B30',
    rules: [{ group: 'ABDOMEN', staticOnly: true, note: 'Apenas exercícios estáticos (prancha, isometria). Sem impacto abdominal.' }],
  },
  {
    id: 'JOELHO', trigger: 'Joelho', label: 'Problema no Joelho', color: '#FF6B6B',
    rules: [
      { group: 'QUADRICEPS', addNote: true, note: 'Execução controlada. Qualquer desconforto no joelho, entre em contato.' },
      { group: 'POSTERIORES', addNote: true, note: 'Amplitude reduzida. Avise se sentir qualquer dor.' },
    ],
  },
  {
    id: 'LOMBAR', trigger: 'Lombar', label: 'Problema na Lombar', color: '#FF8E53',
    rules: [
      { group: 'COSTAS_REMADA', addNote: true, note: 'Mantenha a lombar neutra. Qualquer dor me avise.' },
      { group: 'POSTERIORES', addNote: true, note: 'Sem flexão excessiva do tronco. Execução lenta e controlada.' },
    ],
  },
  {
    id: 'CERVICAL', trigger: 'Cervical', label: 'Problema Cervical', color: '#C77DFF',
    rules: [
      { group: 'OMBRO_MULTI', addNote: true, note: 'Prefira movimentos com apoio. Evite sobrecarregar a cervical.' },
      { group: 'TRAPEZIO', addNote: true, note: 'Amplitude reduzida. Avise se sentir irradiação para os braços.' },
    ],
  },
];

export const LOADING_MSGS = [
  '🔍 Analisando histórico de treinos...',
  '📊 Aplicando sua configuração de ciclo...',
  '🧠 Respeitando limitações do aluno...',
  '⚡ Montando a nova rotina...',
  '✅ Validando exercícios do banco...',
];

export const buildPresets = (gender) => {
  const isFem = gender === 'Feminino';
  return [
    { category: 'Pernas', label: 'Pernas Completo', groups: [{ id: 'QUADRICEPS', qty: 3 }, { id: 'POSTERIORES', qty: 2 }, { id: 'GLUTEOS', qty: 2 }, { id: 'PANTURRILHA', qty: 2 }, { id: 'ADUTOR', qty: 1 }, { id: 'ABDUTOR', qty: 1 }] },
    { category: 'Pernas', label: 'Quadríceps Isolado', groups: [{ id: 'QUADRICEPS', qty: 5 }, { id: 'PANTURRILHA', qty: 2 }] },
    { category: 'Pernas', label: 'Posteriores Isolado', groups: [{ id: 'POSTERIORES', qty: 4 }, { id: 'PANTURRILHA', qty: 2 }] },
    ...(isFem ? [
      { category: 'Pernas', label: 'Glúteos Foco', groups: [{ id: 'GLUTEOS', qty: 5 }, { id: 'ABDUTOR', qty: 2 }, { id: 'PANTURRILHA', qty: 1 }] },
      { category: 'Pernas', label: 'Glúteos + Post.', groups: [{ id: 'GLUTEOS', qty: 4 }, { id: 'POSTERIORES', qty: 3 }, { id: 'PANTURRILHA', qty: 1 }] },
    ] : []),
    { category: 'Superiores', label: 'Costas Completa', groups: [{ id: 'COSTAS_PUXADA', qty: 3 }, { id: 'COSTAS_REMADA', qty: 3 }, { id: 'TRAPEZIO', qty: 1 }] },
    { category: 'Superiores', label: 'Peito Isolado', groups: [{ id: 'PEITO', qty: 4 }, { id: 'TRICEPS', qty: 2 }] },
    { category: 'Superiores', label: 'Ombros Completo', groups: [{ id: 'OMBRO_MULTI', qty: 2 }, { id: 'OMBRO_FRONTAL', qty: 1 }, { id: 'OMBRO_LATERAL', qty: 2 }, { id: 'OMBRO_POST', qty: 1 }, { id: 'TRAPEZIO', qty: 1 }] },
    { category: 'Superiores', label: 'Braços Isolado', groups: [{ id: 'BICEPS', qty: 3 }, { id: 'TRICEPS', qty: 3 }, { id: 'ABDOMEN', qty: 2 }] },
    { category: 'Superiores', label: 'Costas + Ombros', groups: [{ id: 'COSTAS_PUXADA', qty: 3 }, { id: 'COSTAS_REMADA', qty: 2 }, { id: 'OMBRO_MULTI', qty: 2 }, { id: 'TRAPEZIO', qty: 1 }] },
    ...(isFem ? [] : [
      { category: 'Superiores', label: 'Peito + Tríceps', groups: [{ id: 'PEITO', qty: 3 }, { id: 'TRICEPS', qty: 3 }, { id: 'ABDOMEN', qty: 2 }] },
      { category: 'Superiores', label: 'Costas + Bíceps', groups: [{ id: 'COSTAS_PUXADA', qty: 3 }, { id: 'COSTAS_REMADA', qty: 2 }, { id: 'BICEPS', qty: 3 }] },
    ]),
    { category: 'Combinados', label: 'Superior Geral', groups: [{ id: 'PEITO', qty: 2 }, { id: 'COSTAS_PUXADA', qty: 2 }, { id: 'OMBRO_LATERAL', qty: 2 }, { id: 'BICEPS', qty: 2 }, { id: 'TRICEPS', qty: 2 }] },
    { category: 'Combinados', label: 'Full Body', groups: [{ id: 'QUADRICEPS', qty: 2 }, { id: isFem ? 'GLUTEOS' : 'POSTERIORES', qty: 2 }, { id: 'COSTAS_REMADA', qty: 2 }, { id: 'PEITO', qty: 2 }, { id: 'ABDOMEN', qty: 1 }] },
    { category: 'Isolados', label: 'Abdômen Isolado', groups: [{ id: 'ABDOMEN', qty: 5 }] },
    { category: 'Isolados', label: 'Cardio', groups: [{ id: 'CARDIO', qty: 1 }] },
  ];
};