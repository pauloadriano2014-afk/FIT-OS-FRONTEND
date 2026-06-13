// src/screens/Anamnese/constants.js
// Listas estáticas e estado inicial do formulário

export const LIMITACOES_LIST   = ['Joelho','Lombar','Ombro','Punho','Quadril','Tornozelo','Cervical','Cotovelos','Nenhuma'];
export const CIRURGIAS_LIST    = ['Abdominoplastia','Prótese de Silicone','Cesárea','LCA/Menisco','Hérnia','Coluna','Manguito','Nenhuma'];
export const EQUIPAMENTOS_LIST = ['Academia Completa','Academia de Condomínio','Em Casa (Com Pesos/Elásticos)','Em Casa (Apenas peso do corpo)','Estúdio de Crossfit','Parque / Ar Livre'];
export const SUPLEMENTOS_LIST  = ['Whey Protein','Creatina','Pré-Treino','BCAA','Multivitamínico','Ômega 3','Hipercalórico','Nenhum'];
export const OBJETIVOS         = ['Hipertrofia','Emagrecimento','Definição'];
export const NIVEIS            = ['Iniciante','Intermediário','Avançado'];

export const INITIAL_FORM = {
  // Step 1
  peso: '', altura: '',
  // Step 2
  objetivo: '', nivel: '',
  // Step 3
  limitacoes: [], cirurgias: [], equipamentos: [],
  // Step 4
  frequencia: '', tempoDisponivel: '', trainFasted: '',
  // Step 5
  healthConditions: [], healthConditionsObs: '',
  bariatric: '', bariatricType: '', bariatricTime: '', bariatricIntolerances: [],
  medications: [], medicationsObs: '',
  // Step 6
  digestiveIssues: [], digestiveObs: '',
  sleepHours: '', sleepQuality: '', wakeHungry: '', stressLevel: '', stressEating: '',
  // Step 7 (só feminino)
  cycleRegular: '', pmsSymptoms: [], pmsObs: '',
  // Step 8
  mealsPerDay: '',
  wakeUpTime: '', sleepTime: '', workTimeStart: '', workTimeEnd: '', trainTime: '',
  eatsOutPerWeek: '', budget: '',
  // Step 9
  waterIntake: '', alcoholFreq: '', coffeePerDay: '', smoker: '', eatSpeed: '', nightBinge: '',
  // Step 10
  triedDiets: [], dietWorked: '', dietHated: '', biggestChallenge: '',
  // Step 11
  allergies: '', foodPreferences: '', foodAversions: '', supplements: [], extraNotes: '',
};