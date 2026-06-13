// src/screens/AnamneseScreen.js — VERSÃO 4.1
// Correções:
//   BUG 1 — list.filter is not a function: campos de seleção única usam setField, não toggleMulti
//   BUG 2 — Scroll mobile travado: paddingBottom correto no ScrollView
//   BUG 3 — PC cortando: height: '100vh' no web
//   BUG 4 — Sem botão voltar: botão X no step 1 para fechar/voltar
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StatusBar, Modal, useWindowDimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

// ─── COMPONENTES MEMOIZADOS ───────────────────────────────────────────────────

// Opção de seleção única (radio button estilo card)
const Option = memo(({ val, label, desc, field, form, setField, theme }) => {
  const active = form[field] === val;
  return (
    <TouchableOpacity
      style={[s.optionCard, { backgroundColor: theme.surface, borderColor: theme.border },
        active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
      onPress={() => setField(field, val)}
      activeOpacity={0.8}
    >
      <Text style={[s.optionLabel, { color: theme.text }, active && { color: theme.isDark ? '#000' : '#FFF' }]}>{label}</Text>
      {desc && <Text style={[s.optionDesc, { color: theme.textSecondary }, active && { color: theme.isDark ? '#00000099' : '#FFFFFF99' }]}>{desc}</Text>}
    </TouchableOpacity>
  );
});

// BUG 1 FIX: ChipSingle para seleção única (usa setField, não toggleMulti)
const ChipSingle = memo(({ val, label, field, form, setField, theme }) => {
  const active = form[field] === val;
  return (
    <TouchableOpacity
      style={[s.chip, { backgroundColor: theme.surface, borderColor: theme.border },
        active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
      onPress={() => setField(field, active ? '' : val)}
    >
      <Text style={[s.chipText, { color: theme.textSecondary }, active && { color: theme.isDark ? '#000' : '#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
});

// Chip para seleção múltipla (usa toggleMulti, field DEVE ser array)
const Chip = memo(({ val, label, field, noneVals, form, toggleMulti, theme }) => {
  const active = (form[field] || []).includes(val);
  return (
    <TouchableOpacity
      style={[s.chip, { backgroundColor: theme.surface, borderColor: theme.border },
        active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
      onPress={() => toggleMulti(field, val, noneVals)}
    >
      <Text style={[s.chipText, { color: theme.textSecondary }, active && { color: theme.isDark ? '#000' : '#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
});

const BoolPair = memo(({ field, labelYes = 'Sim', labelNo = 'Não', form, setField, theme }) => (
  <View style={s.boolRow}>
    {[{ v: 'yes', l: labelYes }, { v: 'no', l: labelNo }].map(({ v, l }) => {
      const active = form[field] === v;
      return (
        <TouchableOpacity key={v}
          style={[s.boolBtn, { backgroundColor: theme.surface, borderColor: theme.border },
            active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
          onPress={() => setField(field, v)}
        >
          <Text style={[s.boolText, { color: theme.text }, active && { color: theme.isDark ? '#000' : '#FFF' }]}>{l}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
));

const TimeBtn = memo(({ field, label, form, openTimePicker, theme }) => (
  <TouchableOpacity
    style={[s.timeBtn, { backgroundColor: theme.surface, borderColor: form[field] ? theme.accent : theme.border }]}
    onPress={() => openTimePicker(field)}
  >
    <MaterialCommunityIcons name="clock-outline" size={16} color={theme.accent} />
    <Text style={[s.timeBtnText, { color: form[field] ? theme.text : theme.textSecondary }]}>
      {form[field] || label}
    </Text>
    {form[field] && (
      <MaterialCommunityIcons name="check-circle" size={14} color={theme.accent} />
    )}
  </TouchableOpacity>
));

const Label = memo(({ children, mt = 20, theme }) => (
  <Text style={[s.label, { color: theme.textSecondary, marginTop: mt }]}>{children}</Text>
));

const Q = memo(({ children, mt = 0, theme }) => (
  <Text style={[s.question, { color: theme.text, marginTop: mt }]}>{children}</Text>
));

const FreeText = memo(({ field, placeholder, multiline = false, hint, form, setField, theme }) => (
  <>
    <TextInput
      style={[multiline ? s.textArea : s.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      value={form[field]}
      onChangeText={v => setField(field, v)}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
    />
    {hint && <Text style={[s.hint, { color: theme.textSecondary }]}>{hint}</Text>}
  </>
));

const ScaleRow = memo(({ field, min = 1, max = 5, form, setField, theme }) => (
  <View style={s.scaleRow}>
    {Array.from({ length: max - min + 1 }, (_, i) => String(i + min)).map(v => {
      const active = form[field] === v;
      return (
        <TouchableOpacity key={v}
          style={[s.scaleBtn, { backgroundColor: theme.surface, borderColor: theme.border },
            active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
          onPress={() => setField(field, v)}
        >
          <Text style={[s.scaleBtnText, { color: theme.text }, active && { color: theme.isDark ? '#000' : '#FFF' }]}>{v}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
));

// ─── LISTAS ESTÁTICAS ─────────────────────────────────────────────────────────
const LIMITACOES_LIST   = ['Joelho', 'Lombar', 'Ombro', 'Punho', 'Quadril', 'Tornozelo', 'Cervical', 'Cotovelos', 'Nenhuma'];
const CIRURGIAS_LIST    = ['Abdominoplastia', 'Prótese de Silicone', 'Cesárea', 'LCA/Menisco', 'Hérnia', 'Coluna', 'Manguito', 'Nenhuma'];
const EQUIPAMENTOS_LIST = ['Academia Completa', 'Academia de Condomínio', 'Em Casa (Com Pesos/Elásticos)', 'Em Casa (Apenas peso do corpo)', 'Estúdio de Crossfit', 'Parque / Ar Livre'];
const SUPLEMENTOS_LIST  = ['Whey Protein', 'Creatina', 'Pré-Treino', 'BCAA', 'Multivitamínico', 'Ômega 3', 'Hipercalórico', 'Nenhum'];
const OBJETIVOS         = ['Hipertrofia', 'Emagrecimento', 'Definição'];
const NIVEIS            = ['Iniciante', 'Intermediário', 'Avançado'];

// ─── ESTADO INICIAL ───────────────────────────────────────────────────────────
// BUG 1 FIX: campos de seleção única são string (''), arrays são []
const INITIAL_FORM = {
  peso: '', altura: '',
  objetivo: '', nivel: '',
  // BUG 1 FIX: frequencia e tempoDisponivel são strings (seleção única)
  frequencia: '', tempoDisponivel: '',
  limitacoes: [], cirurgias: [], equipamentos: [],
  trainFasted: '',

  healthConditions: [], healthConditionsObs: '',
  bariatric: '',
  bariatricType: '', bariatricTime: '',
  bariatricIntolerances: [],
  medications: [], medicationsObs: '',

  digestiveIssues: [], digestiveObs: '',
  // BUG 1 FIX: todos os campos de seleção única como string
  sleepHours: '', sleepQuality: '',
  wakeHungry: '', stressLevel: '', stressEating: '',

  cycleRegular: '', pmsSymptoms: [], pmsObs: '',

  // BUG 1 FIX: mealsPerDay, waterIntake, alcoholFreq, etc. como string
  mealsPerDay: '',
  wakeUpTime: '', sleepTime: '', workTimeStart: '', workTimeEnd: '', trainTime: '',
  eatsOutPerWeek: '', budget: '',

  waterIntake: '', alcoholFreq: '', coffeePerDay: '',
  smoker: '', eatSpeed: '', nightBinge: '',

  triedDiets: [], dietWorked: '', dietHated: '', biggestChallenge: '',

  allergies: '', foodPreferences: '', foodAversions: '',
  supplements: [], extraNotes: '',
};

export default function AnamneseScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [currentUser, setCurrentUser]             = useState(route.params?.userData || null);
  const [loading, setLoading]                     = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [step, setStep]                           = useState(1);
  const [form, setForm]                           = useState(INITIAL_FORM);
  const [timeModal, setTimeModal]                 = useState({ visible: false, target: '', step: 'hour', tempHour: '' });

  // Detecta se veio da home (pode fechar) ou do onboarding (não pode)
  const canGoBack = navigation.canGoBack();

  const isFeminino = currentUser?.gender === 'Feminino';
  const hasDiet    = !!currentUser?.dietModule;

  const totalSteps = useMemo(() => {
    if (!hasDiet) return 4;
    return isFeminino ? 11 : 10;
  }, [hasDiet, isFeminino]);

  const getActualStep = (visualStep) => {
    if (!hasDiet || isFeminino) return visualStep;
    return visualStep >= 7 ? visualStep + 1 : visualStep;
  };

  useEffect(() => {
    const init = async () => {
      let user = currentUser;
      if (!user) {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const p = JSON.parse(stored);
          if (p?.id) { user = p; setCurrentUser(p); }
        }
      }
      if (user?.id) await fetchAnamneseExistente(user.id);
      else setLoadingInitialData(false);
    };
    init();
  }, []);

  const fetchAnamneseExistente = async (userId) => {
    try {
      const res = await fetch(`https://fitos-final.onrender.com/api/anamnese?userId=${userId}`);
      if (res.ok) {
        const d = await res.json();
        if (d?.id) {
          setForm(prev => ({
            ...prev,
            peso:    d.peso    ? String(d.peso)    : '',
            altura:  d.altura  ? String(d.altura)  : '',
            objetivo:  d.objetivo  || '',
            nivel:     d.nivel     || '',
            // BUG 1 FIX: carrega como string
            frequencia:      d.frequencia      ? String(d.frequencia)      : '',
            tempoDisponivel: d.tempoDisponivel  ? String(d.tempoDisponivel) : '',
            trainFasted: d.trainFasted === true ? 'yes' : d.trainFasted === false ? 'no' : '',
            limitacoes:   Array.isArray(d.limitacoes)   ? d.limitacoes   : [],
            cirurgias:    Array.isArray(d.cirurgias)    ? d.cirurgias    : [],
            equipamentos: Array.isArray(d.equipamentos) ? d.equipamentos
              : (d.equipamentos ? d.equipamentos.split(',').map(i => i.trim()) : []),

            healthConditions:     Array.isArray(d.healthConditions) ? d.healthConditions : [],
            healthConditionsObs:  d.healthConditionsObs || '',
            bariatric:            d.bariatric === true ? 'yes' : d.bariatric === false ? 'no' : '',
            bariatricType:        d.bariatricType || '',
            bariatricTime:        d.bariatricTime || '',
            bariatricIntolerances:Array.isArray(d.bariatricIntolerances) ? d.bariatricIntolerances : [],
            medications:          Array.isArray(d.medications) ? d.medications : [],
            medicationsObs:       d.medicationsObs || '',

            digestiveIssues: Array.isArray(d.digestiveIssues) ? d.digestiveIssues : [],
            digestiveObs:    d.digestiveObs   || '',
            sleepHours:      d.sleepHours     || '',
            sleepQuality:    d.sleepQuality   || '',
            wakeHungry:      d.wakeHungry   === true ? 'yes' : d.wakeHungry   === false ? 'no' : '',
            stressLevel:     d.stressLevel    ? String(d.stressLevel) : '',
            stressEating:    d.stressEating === true ? 'yes' : d.stressEating === false ? 'no' : '',

            cycleRegular: d.cycleRegular || '',
            pmsSymptoms:  Array.isArray(d.pmsSymptoms) ? d.pmsSymptoms : [],
            pmsObs:       d.pmsObs || '',

            mealsPerDay:   d.mealsPerDay ? String(d.mealsPerDay) : '',
            wakeUpTime:    d.wakeUpTime  || '',
            sleepTime:     d.sleepTime   || '',
            workTimeStart: d.workTime    ? d.workTime.split(' às ')[0] : '',
            workTimeEnd:   d.workTime    ? d.workTime.split(' às ')[1] : '',
            trainTime:     d.trainTime   || '',
            eatsOutPerWeek:d.eatsOutPerWeek || '',
            budget:        d.budget || '',

            waterIntake:  d.waterIntake  || '',
            alcoholFreq:  d.alcoholFreq  || '',
            coffeePerDay: d.coffeePerDay || '',
            smoker:       d.smoker === true ? 'yes' : d.smoker === false ? 'no' : '',
            eatSpeed:     d.eatSpeed     || '',
            // BUG 1 FIX: nightBinge é string (never/rarely/sometimes/often), não boolean
            nightBinge:   d.nightBinge   || '',

            triedDiets:       Array.isArray(d.triedDiets) ? d.triedDiets : [],
            dietWorked:       d.dietWorked       || '',
            dietHated:        d.dietHated        || '',
            biggestChallenge: d.biggestChallenge || '',

            allergies:       d.allergies       || '',
            foodPreferences: d.foodPreferences || '',
            foodAversions:   d.foodAversions   || '',
            supplements:     d.supplements
              ? (Array.isArray(d.supplements) ? d.supplements : d.supplements.split(', ').filter(Boolean))
              : [],
            extraNotes: d.extraNotes || '',
          }));
        }
      }
    } catch (e) {
      console.log('Erro ao pré-preencher anamnese:', e);
    } finally {
      setLoadingInitialData(false);
    }
  };

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // toggleMulti só para campos que são arrays
  const toggleMulti = useCallback((field, item, noneValues = ['Nenhuma', 'Nenhum']) => {
    setForm(prev => {
      const list = Array.isArray(prev[field]) ? prev[field] : [];
      const isNone = noneValues.includes(item);
      if (list.includes(item)) return { ...prev, [field]: list.filter(i => i !== item) };
      if (isNone) return { ...prev, [field]: [item] };
      return { ...prev, [field]: [...list.filter(i => !noneValues.includes(i)), item] };
    });
  }, []);

  const openTimePicker = useCallback((target) => {
    setTimeModal({ visible: true, target, step: 'hour', tempHour: '' });
  }, []);

  const handleSelectHour = (h) =>
    setTimeModal(prev => ({ ...prev, step: 'minute', tempHour: h }));

  const handleSelectMinute = (m) => {
    setField(timeModal.target, `${timeModal.tempHour}:${m}`);
    setTimeModal({ visible: false, target: '', step: 'hour', tempHour: '' });
  };

  // ─── VALIDAÇÃO POR ETAPA ───────────────────────────────────────────────────
  const validateStep = () => {
    const actual = getActualStep(step);
    switch (actual) {
      case 1:
        if (!form.peso || !form.altura) { Alert.alert('Faltam Dados', 'Preencha peso e altura.'); return false; }
        break;
      case 2:
        if (!form.objetivo || !form.nivel) { Alert.alert('Faltam Dados', 'Selecione objetivo e nível.'); return false; }
        break;
      case 3:
        if (!form.limitacoes.length)   { Alert.alert('Atenção', "Selecione limitações ou 'Nenhuma'."); return false; }
        if (!form.cirurgias.length)    { Alert.alert('Atenção', "Selecione cirurgias ou 'Nenhuma'."); return false; }
        if (!form.equipamentos.length) { Alert.alert('Faltam Dados', 'Selecione o local de treino.'); return false; }
        break;
      case 4:
        if (!form.frequencia || !form.tempoDisponivel) { Alert.alert('Faltam Dados', 'Selecione frequência e tempo.'); return false; }
        if (hasDiet && !form.trainFasted) { Alert.alert('Faltam Dados', 'Informe se treina em jejum.'); return false; }
        break;
      case 5:
        if (!form.healthConditions.length) { Alert.alert('Atenção', "Selecione condições ou 'Nenhuma'."); return false; }
        if (form.bariatric === 'yes' && !form.bariatricType) { Alert.alert('Faltam Dados', 'Informe o tipo de bariátrica.'); return false; }
        if (form.bariatric === 'yes' && !form.bariatricTime) { Alert.alert('Faltam Dados', 'Informe há quanto tempo foi a cirurgia.'); return false; }
        if (!form.medications.length) { Alert.alert('Atenção', "Informe seus medicamentos ou 'Nenhum'."); return false; }
        break;
      case 6:
        if (!form.digestiveIssues.length) { Alert.alert('Atenção', "Selecione ou marque 'Nenhum'."); return false; }
        if (!form.sleepHours || !form.sleepQuality) { Alert.alert('Faltam Dados', 'Informe horas e qualidade do sono.'); return false; }
        if (!form.stressLevel) { Alert.alert('Faltam Dados', 'Informe seu nível de stress.'); return false; }
        break;
      case 7:
        if (!form.cycleRegular) { Alert.alert('Faltam Dados', 'Informe sobre seu ciclo.'); return false; }
        if (!form.pmsSymptoms.length) { Alert.alert('Atenção', 'Informe sintomas da TPM.'); return false; }
        break;
      case 8:
        if (!form.mealsPerDay) { Alert.alert('Faltam Dados', 'Selecione número de refeições.'); return false; }
        if (!form.wakeUpTime || !form.sleepTime || !form.trainTime) {
          Alert.alert('Faltam Dados', 'Preencha pelo menos os horários de acordar, dormir e treino.'); return false;
        }
        if (!form.eatsOutPerWeek || !form.budget) { Alert.alert('Faltam Dados', 'Informe refeições fora e orçamento.'); return false; }
        break;
      case 9:
        if (!form.waterIntake || !form.alcoholFreq || !form.eatSpeed || !form.nightBinge) {
          Alert.alert('Faltam Dados', 'Preencha todos os hábitos.'); return false;
        }
        break;
      case 10:
        if (!form.biggestChallenge) { Alert.alert('Faltam Dados', 'Selecione seu maior desafio.'); return false; }
        break;
      case 11:
        if (!form.allergies.trim() || !form.foodPreferences.trim() || !form.foodAversions.trim() || !form.supplements.length) {
          Alert.alert('Faltam Dados', "Preencha todos os campos. Use 'Nenhum/Nenhuma' se não houver."); return false;
        }
        break;
      default: break;
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(st => st + 1); };

  // ─── SALVAR ────────────────────────────────────────────────────────────────
  const salvarAnamnese = async () => {
    if (!validateStep()) return;
    if (!currentUser?.id) { Alert.alert('Sessão Expirada', 'Faça login novamente.'); navigation.replace('Login'); return; }

    setLoading(true);
    try {
      const p    = parseFloat(form.peso.replace(',', '.'));
      const a    = parseFloat(form.altura.replace(',', '.'));
      const altM = a / 100;

      const payload = {
        userId:          currentUser.id,
        peso:            p,
        altura:          a,
        imc:             altM > 0 ? parseFloat((p / (altM * altM)).toFixed(2)) : 0,
        aguaIdeal:       parseFloat((p * 35).toFixed(0)),
        objetivo:        form.objetivo,
        nivel:           form.nivel,
        frequencia:      parseInt(form.frequencia) || 3,
        tempoDisponivel: parseInt(form.tempoDisponivel) || 60,
        limitacoes:      form.limitacoes,
        cirurgias:       form.cirurgias,
        equipamentos:    form.equipamentos,

        ...(hasDiet && {
          trainFasted:       form.trainFasted === 'yes',
          healthConditions:  form.healthConditions,
          healthConditionsObs: form.healthConditionsObs.trim(),
          bariatric:         form.bariatric === 'yes',
          bariatricType:     form.bariatric === 'yes' ? form.bariatricType : null,
          bariatricTime:     form.bariatric === 'yes' ? form.bariatricTime : null,
          bariatricIntolerances: form.bariatric === 'yes' ? form.bariatricIntolerances : [],
          medications:       form.medications,
          medicationsObs:    form.medicationsObs.trim(),
          digestiveIssues:   form.digestiveIssues,
          digestiveObs:      form.digestiveObs.trim(),
          sleepHours:        form.sleepHours,
          sleepQuality:      form.sleepQuality,
          wakeHungry:        form.wakeHungry === 'yes',
          stressLevel:       parseInt(form.stressLevel) || 0,
          stressEating:      form.stressEating === 'yes',
          ...(isFeminino && {
            cycleRegular: form.cycleRegular,
            pmsSymptoms:  form.pmsSymptoms,
            pmsObs:       form.pmsObs.trim(),
          }),
          mealsPerDay:    parseInt(form.mealsPerDay) || null,
          wakeUpTime:     form.wakeUpTime,
          sleepTime:      form.sleepTime,
          workTime:       form.workTimeStart && form.workTimeEnd
            ? `${form.workTimeStart} às ${form.workTimeEnd}` : '',
          trainTime:      form.trainTime,
          eatsOutPerWeek: form.eatsOutPerWeek,
          budget:         form.budget,
          waterIntake:    form.waterIntake,
          alcoholFreq:    form.alcoholFreq,
          coffeePerDay:   form.coffeePerDay,
          smoker:         form.smoker === 'yes',
          eatSpeed:       form.eatSpeed,
          // BUG 1 FIX: nightBinge é string, salva direto
          nightBinge:     form.nightBinge,
          triedDiets:     form.triedDiets,
          dietWorked:     form.dietWorked.trim(),
          dietHated:      form.dietHated.trim(),
          biggestChallenge: form.biggestChallenge,
          allergies:       form.allergies.trim(),
          foodPreferences: form.foodPreferences.trim(),
          foodAversions:   form.foodAversions.trim(),
          supplements:     form.supplements.join(', '),
          extraNotes:      form.extraNotes.trim(),
        }),
      };

      const res  = await fetch('https://fitos-final.onrender.com/api/anamnese', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar.');

      const updatedUser = { ...currentUser, anamneses: [data], anamnesePendente: false };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      const msg = 'Perfil atualizado! Aguarde a montagem da sua nova estratégia.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Sucesso! 🚀', msg);

      navigation.reset({ index: 0, routes: [{ name: 'Main', params: { userData: updatedUser } }] });
    } catch (e) {
      if (Platform.OS === 'web') window.alert(e.message);
      else Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  // BUG 4 FIX: Fechar/voltar no step 1
  const handleClose = () => {
    if (canGoBack) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const isWeb       = Platform.OS === 'web';
  const RootComp    = isWeb ? View : SafeAreaView;
  const actualStep  = getActualStep(step);

  if (loadingInitialData) {
    return (
      <View style={[s.safe, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={{ color: theme.textSecondary, marginTop: 15, fontWeight: 'bold' }}>
          Sincronizando seus dados...
        </Text>
      </View>
    );
  }

  // ─── RENDER DE CADA ETAPA ──────────────────────────────────────────────────
  const renderStep = () => {
    switch (actualStep) {

      case 1: return (
        <View>
          <Q theme={theme}>Suas Medidas</Q>
          <View style={s.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Label mt={0} theme={theme}>PESO (KG) *</Label>
              <FreeText field="peso" placeholder="Ex: 72.5" form={form} setField={setField} theme={theme} />
            </View>
            <View style={{ flex: 1 }}>
              <Label mt={0} theme={theme}>ALTURA (CM) *</Label>
              <FreeText field="altura" placeholder="Ex: 168" form={form} setField={setField} theme={theme} />
            </View>
          </View>
        </View>
      );

      case 2: return (
        <View>
          <Q theme={theme}>Objetivo Principal</Q>
          {OBJETIVOS.map(obj => (
            <Option key={obj} val={obj} label={obj} field="objetivo" form={form} setField={setField} theme={theme} />
          ))}
          <Q mt={30} theme={theme}>Nível de Experiência</Q>
          {/* BUG 1 FIX: nível é seleção única → ChipSingle */}
          <View style={s.chipWrap}>
            {NIVEIS.map(n => (
              <ChipSingle key={n} val={n} label={n} field="nivel" form={form} setField={setField} theme={theme} />
            ))}
          </View>
        </View>
      );

      case 3: return (
        <View>
          <Q theme={theme}>Mapeamento de Dores</Q>
          <View style={s.chipWrap}>
            {LIMITACOES_LIST.map(i => (
              <Chip key={i} val={i} label={i} field="limitacoes" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
            ))}
          </View>
          <Q mt={30} theme={theme}>Cirurgias Prévias</Q>
          <View style={s.chipWrap}>
            {CIRURGIAS_LIST.map(i => (
              <Chip key={i} val={i} label={i} field="cirurgias" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
            ))}
          </View>
          <Q mt={30} theme={theme}>Local de Treino / Equipamentos *</Q>
          <View style={s.chipWrap}>
            {EQUIPAMENTOS_LIST.map(i => (
              <Chip key={i} val={i} label={i} field="equipamentos" noneVals={[]} form={form} toggleMulti={toggleMulti} theme={theme} />
            ))}
          </View>
        </View>
      );

      case 4: return (
        <View>
          <Q theme={theme}>Frequência de Treino</Q>
          {/* BUG 1 FIX: frequência é seleção única → ChipSingle */}
          <View style={s.chipWrap}>
            {[1,2,3,4,5,6,7].map(d => (
              <ChipSingle key={d} val={String(d)} label={`${d}x`} field="frequencia" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          <Q mt={30} theme={theme}>Tempo Disponível por Sessão</Q>
          {/* BUG 1 FIX: tempoDisponivel é seleção única → ChipSingle */}
          <View style={s.chipWrap}>
            {['30','45','60','90','120'].map(t => (
              <ChipSingle key={t} val={t} label={`${t} min`} field="tempoDisponivel" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          {hasDiet && <>
            <Q mt={30} theme={theme}>Você treina em JEJUM?</Q>
            <BoolPair field="trainFasted" labelYes="✅ Sim, em jejum" labelNo="🍳 Não, me alimento antes" form={form} setField={setField} theme={theme} />
          </>}
        </View>
      );

      case 5: return (
        <View>
          <Q theme={theme}>Condições de Saúde</Q>
          <Text style={[s.hint, { color: theme.textSecondary, marginBottom: 10 }]}>
            Selecione todas que se aplicam.
          </Text>
          <View style={s.chipWrap}>
            {['Diabetes Tipo 1','Diabetes Tipo 2','Pré-diabetes','Hipotireoidismo',
              'Hipertireoidismo','Hipertensão','SOP','Resistência à Insulina','Nenhuma'].map(i => (
              <Chip key={i} val={i} label={i} field="healthConditions" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
            ))}
          </View>
          <FreeText field="healthConditionsObs" placeholder="Observação adicional (opcional)..." multiline form={form} setField={setField} theme={theme} />

          <Q mt={28} theme={theme}>Já fez cirurgia bariátrica?</Q>
          <BoolPair field="bariatric" form={form} setField={setField} theme={theme} />

          {form.bariatric === 'yes' && <>
            <Label theme={theme}>TIPO DE CIRURGIA *</Label>
            <View style={s.chipWrap}>
              {['Sleeve (Gastrectomia)','Bypass Gástrico (Roux-en-Y)','Banda Gástrica','Balão Intragástrico','Outro'].map(i => (
                <ChipSingle key={i} val={i} label={i} field="bariatricType" form={form} setField={setField} theme={theme} />
              ))}
            </View>
            <Label theme={theme}>HÁ QUANTO TEMPO? *</Label>
            <View style={s.chipWrap}>
              {['Menos de 6 meses','6 meses a 1 ano','1 a 2 anos','2 a 3 anos','Mais de 3 anos'].map(i => (
                <ChipSingle key={i} val={i} label={i} field="bariatricTime" form={form} setField={setField} theme={theme} />
              ))}
            </View>
            <Label theme={theme}>INTOLERÂNCIAS PÓS-CIRURGIA</Label>
            <View style={s.chipWrap}>
              {['Açúcar / Síndrome de Dumping','Gordura','Lactose','Glúten','Carne Vermelha','Alimentos Fibrosos','Nenhuma'].map(i => (
                <Chip key={i} val={i} label={i} field="bariatricIntolerances" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
              ))}
            </View>
          </>}

          <Q mt={28} theme={theme}>Usa algum medicamento contínuo?</Q>
          <View style={s.chipWrap}>
            {['Metformina','Levotiroxina','Anticoncepcional','Anti-hipertensivo',
              'Antidepressivo','Corticoide','Nenhum'].map(i => (
              <Chip key={i} val={i} label={i} field="medications" noneVals={['Nenhum']} form={form} toggleMulti={toggleMulti} theme={theme} />
            ))}
          </View>
          <FreeText field="medicationsObs" placeholder="Outros medicamentos (opcional)..." form={form} setField={setField} theme={theme} />
        </View>
      );

      case 6: return (
        <View>
          <Q theme={theme}>Saúde Digestiva</Q>
          <View style={s.chipWrap}>
            {['Gastrite','Refluxo / DRGE','Intestino Preso','Intestino Solto / SII',
              'Doença de Crohn / Colite','Intolerância à Lactose','Intolerância ao Glúten','Nenhum'].map(i => (
              <Chip key={i} val={i} label={i} field="digestiveIssues" noneVals={['Nenhum']} form={form} toggleMulti={toggleMulti} theme={theme} />
            ))}
          </View>
          <FreeText field="digestiveObs" placeholder="Detalhes (opcional)..." form={form} setField={setField} theme={theme} />

          <Q mt={28} theme={theme}>Qualidade do Sono</Q>
          <Label mt={8} theme={theme}>HORAS DE SONO POR NOITE</Label>
          {/* BUG 1 FIX: seleção única → ChipSingle */}
          <View style={s.chipWrap}>
            {['Menos de 5h','5 a 6h','6 a 7h','7 a 8h','Mais de 8h'].map(i => (
              <ChipSingle key={i} val={i} label={i} field="sleepHours" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>COMO AVALIA SEU SONO?</Label>
          <View style={s.chipWrap}>
            {['Ótimo','Bom','Regular','Ruim','Péssimo'].map(i => (
              <ChipSingle key={i} val={i} label={i} field="sleepQuality" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>ACORDA COM FOME DURANTE A NOITE?</Label>
          <BoolPair field="wakeHungry" form={form} setField={setField} theme={theme} />

          <Q mt={28} theme={theme}>Nível de Stress no Dia a Dia</Q>
          <Text style={[s.hint, { color: theme.textSecondary, marginBottom: 8 }]}>1 = Muito tranquilo · 5 = Extremamente estressado</Text>
          <ScaleRow field="stressLevel" form={form} setField={setField} theme={theme} />
          <Label theme={theme}>COME MAIS QUANDO ESTÁ ESTRESSADO(A)?</Label>
          <BoolPair field="stressEating" form={form} setField={setField} theme={theme} />
        </View>
      );

      case 7: return (
        <View>
          <Q theme={theme}>Ciclo Menstrual</Q>
          <Label mt={0} theme={theme}>SEU CICLO É REGULAR?</Label>
          <View style={s.chipWrap}>
            {[
              { v: 'regular',   l: '✅ Regular (28-32 dias)' },
              { v: 'irregular', l: '⚠️ Irregular' },
              { v: 'menopause', l: '🔄 Menopausa / Pós-menopausa' },
              { v: 'hormonal',  l: '💊 Uso anticoncepcional hormonal' },
            ].map(({ v, l }) => (
              <ChipSingle key={v} val={v} label={l} field="cycleRegular" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>SINTOMAS DE TPM QUE VOCÊ SENTE</Label>
          <View style={s.chipWrap}>
            {['Compulsão Alimentar Forte','Vontade de Doce','Inchaço / Retenção',
              'Irritabilidade','Cólica Intensa','Fadiga Extrema','Sem Sintomas Significativos'].map(i => (
              <Chip key={i} val={i} label={i} field="pmsSymptoms" noneVals={['Sem Sintomas Significativos']} form={form} toggleMulti={toggleMulti} theme={theme} />
            ))}
          </View>
          <FreeText field="pmsObs" placeholder="Observações adicionais (opcional)..." multiline form={form} setField={setField} theme={theme} />
        </View>
      );

      case 8: return (
        <View>
          <Q theme={theme}>Rotina Alimentar</Q>
          <Label mt={0} theme={theme}>REFEIÇÕES PREFERIDAS POR DIA</Label>
          {/* BUG 1 FIX: mealsPerDay é seleção única → ChipSingle */}
          <View style={s.chipWrap}>
            {[2,3,4,5,6,7,8].map(d => (
              <ChipSingle key={d} val={String(d)} label={`${d}x`} field="mealsPerDay" form={form} setField={setField} theme={theme} />
            ))}
          </View>

          <Q mt={28} theme={theme}>Horários da Rotina</Q>
          <View style={s.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Label mt={0} theme={theme}>ACORDA ÀS *</Label>
              <TimeBtn field="wakeUpTime" label="Selecionar" form={form} openTimePicker={openTimePicker} theme={theme} />
            </View>
            <View style={{ flex: 1 }}>
              <Label mt={0} theme={theme}>DORME ÀS *</Label>
              <TimeBtn field="sleepTime" label="Selecionar" form={form} openTimePicker={openTimePicker} theme={theme} />
            </View>
          </View>
          <Label theme={theme}>HORÁRIO DE TRABALHO (opcional)</Label>
          <View style={s.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <TimeBtn field="workTimeStart" label="Início" form={form} openTimePicker={openTimePicker} theme={theme} />
            </View>
            <View style={{ flex: 1 }}>
              <TimeBtn field="workTimeEnd" label="Fim" form={form} openTimePicker={openTimePicker} theme={theme} />
            </View>
          </View>
          <Label theme={theme}>TREINO ÀS *</Label>
          <TimeBtn field="trainTime" label="Selecionar" form={form} openTimePicker={openTimePicker} theme={theme} />

          <Q mt={28} theme={theme}>Contexto de Refeições</Q>
          <Label mt={8} theme={theme}>QUANTAS VEZES COME FORA POR SEMANA?</Label>
          <View style={s.chipWrap}>
            {['Nunca / Raramente','1 a 2x','3 a 4x','Quase sempre'].map(i => (
              <ChipSingle key={i} val={i} label={i} field="eatsOutPerWeek" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>ORÇAMENTO PARA ALIMENTAÇÃO</Label>
          {[
            { v: 'econômico',     l: '💰 Econômico',     d: 'Frango, ovos, atum, batata doce, aveia' },
            { v: 'moderado',      l: '💳 Moderado',      d: 'Inclui whey, iogurte grego, salmão ocasional' },
            { v: 'sem restrição', l: '💎 Sem restrição', d: 'Qualquer alimento, suplementos premium' },
          ].map(({ v, l, d }) => (
            <Option key={v} val={v} label={l} desc={d} field="budget" form={form} setField={setField} theme={theme} />
          ))}
        </View>
      );

      case 9: return (
        <View>
          <Q theme={theme}>Hábitos e Hidratação</Q>
          <Label mt={0} theme={theme}>ÁGUA POR DIA</Label>
          {/* BUG 1 FIX: todos os hábitos de seleção única → ChipSingle */}
          <View style={s.chipWrap}>
            {['Menos de 1L','1 a 1,5L','1,5 a 2L','2 a 2,5L','Mais de 2,5L'].map(i => (
              <ChipSingle key={i} val={i} label={i} field="waterIntake" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>CONSUMO DE ÁLCOOL</Label>
          <View style={s.chipWrap}>
            {['Nunca','Raramente (ocasional)','1 a 2x por semana','Frequente (3x+)'].map(i => (
              <ChipSingle key={i} val={i} label={i} field="alcoholFreq" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>CAFÉS POR DIA</Label>
          <View style={s.chipWrap}>
            {['Nenhum','1 a 2 cafés','3 a 4 cafés','5 ou mais'].map(i => (
              <ChipSingle key={i} val={i} label={i} field="coffeePerDay" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>FUMANTE?</Label>
          <BoolPair field="smoker" form={form} setField={setField} theme={theme} />
          <Label theme={theme}>VELOCIDADE AO COMER</Label>
          <View style={s.chipWrap}>
            {['Muito Rápido','Rápido','Normal','Devagar','Muito Devagar'].map(i => (
              <ChipSingle key={i} val={i} label={i} field="eatSpeed" form={form} setField={setField} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>TEM COMPULSÃO ALIMENTAR NOTURNA?</Label>
          <View style={s.chipWrap}>
            {[
              { v: 'never',     l: '🟢 Nunca' },
              { v: 'rarely',    l: '🟡 Raramente' },
              { v: 'sometimes', l: '🟠 Às vezes' },
              { v: 'often',     l: '🔴 Com frequência' },
            ].map(({ v, l }) => (
              <ChipSingle key={v} val={v} label={l} field="nightBinge" form={form} setField={setField} theme={theme} />
            ))}
          </View>
        </View>
      );

      case 10: return (
        <View>
          <Q theme={theme}>Histórico de Dietas</Q>
          <Label mt={0} theme={theme}>JÁ TENTOU ALGUMA DESSAS DIETAS?</Label>
          <View style={s.chipWrap}>
            {['Low Carb','Cetogênica / Keto','Jejum Intermitente','Dieta do Índice Glicêmico',
              'Vegana / Vegetariana','Dieta dos Pontos','Dieta Detox','Nenhuma'].map(i => (
              <Chip key={i} val={i} label={i} field="triedDiets" noneVals={['Nenhuma']} form={form} toggleMulti={toggleMulti} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>O QUE JÁ FUNCIONOU PARA VOCÊ?</Label>
          <FreeText field="dietWorked" placeholder="Ex: jejum intermitente me ajudou a controlar a fome..." multiline hint="Deixe em branco se nunca fez dieta." form={form} setField={setField} theme={theme} />
          <Label theme={theme}>O QUE VOCÊ ODEIA OU NÃO CONSEGUE SEGUIR?</Label>
          <FreeText field="dietHated" placeholder="Ex: não consigo ficar sem carboidrato à noite..." multiline form={form} setField={setField} theme={theme} />
          <Label theme={theme}>SEU MAIOR DESAFIO NA DIETA *</Label>
          <View style={s.chipWrap}>
            {['Ansiedade / Fome Constante','Falta de Tempo para Preparar','Comer Fora de Casa',
              'Consistência e Disciplina','Custo dos Alimentos','Falta de Variedade',
              'Comer na Empresa / Restaurante','Família não Apoia','Outro'].map(i => (
              <ChipSingle key={i} val={i} label={i} field="biggestChallenge" form={form} setField={setField} theme={theme} />
            ))}
          </View>
        </View>
      );

      case 11: return (
        <View>
          <Q theme={theme}>Preferências e Restrições</Q>
          <Label mt={0} theme={theme}>ALERGIAS OU INTOLERÂNCIAS *</Label>
          <FreeText field="allergies" placeholder="Ex: Intolerância à lactose..." multiline hint="* Se não houver, escreva 'Nenhuma'." form={form} setField={setField} theme={theme} />
          <Label theme={theme}>O QUE VOCÊ ODEIA COMER? *</Label>
          <FreeText field="foodAversions" placeholder="Ex: Fígado, batata doce..." multiline hint="* Se comer de tudo, escreva 'Nada'." form={form} setField={setField} theme={theme} />
          <Label theme={theme}>PREFERÊNCIAS ALIMENTARES *</Label>
          <FreeText field="foodPreferences" placeholder="Ex: Amo frango com batata doce..." multiline hint="* O que não pode faltar na dieta." form={form} setField={setField} theme={theme} />
          <Label theme={theme}>SUPLEMENTOS QUE JÁ UTILIZA *</Label>
          <View style={s.chipWrap}>
            {SUPLEMENTOS_LIST.map(i => (
              <Chip key={i} val={i} label={i} field="supplements" noneVals={['Nenhum']} form={form} toggleMulti={toggleMulti} theme={theme} />
            ))}
          </View>
          <Label theme={theme}>OBSERVAÇÕES FINAIS PARA O COACH</Label>
          <FreeText field="extraNotes" placeholder="Qualquer informação importante..." multiline hint="Opcional." form={form} setField={setField} theme={theme} />
          <View style={[s.confirmCard, { backgroundColor: theme.accent + '12', borderColor: theme.accent + '40' }]}>
            <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />
            <Text style={[s.confirmText, { color: theme.textSecondary }]}>
              Ao finalizar, o Coach receberá todas as informações e montará sua estratégia personalizada.
            </Text>
          </View>
        </View>
      );

      default: return null;
    }
  };

  // ─── JSX PRINCIPAL ──────────────────────────────────────────────────────────
  // Alturas fixas para calcular o espaço do scroll
  const HEADER_H = 90;  // header com título + barra de progresso + contador
  const FOOTER_H = Platform.OS === 'ios' ? 100 : 80;  // footer com botões

  return (
    <RootComp style={[
      s.safe,
      { backgroundColor: isWeb ? (theme.isDark ? '#0a0a0a' : '#E5E5EA') : theme.bg },
    ]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <View style={[s.inner, {
        backgroundColor: theme.bg,
        height: windowHeight,
        ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}),
      }]}>
        {/* HEADER */}
        <View style={[s.header, { backgroundColor: theme.bg }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[s.headerTitle, { color: theme.accent }]}>ANAMNESE</Text>
            {step === 1 && (
              <TouchableOpacity
                onPress={handleClose}
                style={[s.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[s.progressBg, { backgroundColor: theme.border }]}>
            <View style={[s.progressFill, { backgroundColor: theme.accent, width: `${(step / totalSteps) * 100}%` }]} />
          </View>
          <Text style={[s.stepCounter, { color: theme.textSecondary }]}>
            Etapa {step} de {totalSteps}
          </Text>
        </View>

        {/* SCROLL — altura explícita em pixels = janela - header - footer */}
        <ScrollView
          style={{ height: windowHeight - HEADER_H - FOOTER_H }}
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* FOOTER */}
        <View style={[s.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          {step > 1
            ? (
              <TouchableOpacity
                onPress={() => setStep(st => st - 1)}
                style={[s.backBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>VOLTAR</Text>
              </TouchableOpacity>
            )
            : <View style={{ flex: 1 }} />
          }
          {step < totalSteps
            ? (
              <TouchableOpacity onPress={nextStep} style={[s.nextBtn, { backgroundColor: theme.accent }]}>
                <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }}>PRÓXIMO</Text>
              </TouchableOpacity>
            )
            : (
              <TouchableOpacity onPress={salvarAnamnese} disabled={loading} style={[s.nextBtn, { backgroundColor: theme.accent }]}>
                {loading
                  ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} />
                  : <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }}>FINALIZAR 🚀</Text>
                }
              </TouchableOpacity>
            )
          }
        </View>
      </View>

      {/* TIME PICKER MODAL */}
      <Modal visible={timeModal.visible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.timeModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>
              {timeModal.step === 'hour' ? 'SELECIONE A HORA' : 'SELECIONE OS MINUTOS'}
            </Text>
            <View style={s.timeGrid}>
              {timeModal.step === 'hour'
                ? Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                    <TouchableOpacity key={h}
                      style={[s.timeOpt, { borderColor: theme.border, backgroundColor: theme.bg }]}
                      onPress={() => handleSelectHour(h)}
                    >
                      <Text style={[s.timeOptText, { color: theme.text }]}>{h}h</Text>
                    </TouchableOpacity>
                  ))
                : ['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                    <TouchableOpacity key={m}
                      style={[s.timeOpt, { borderColor: theme.border, backgroundColor: theme.bg }]}
                      onPress={() => handleSelectMinute(m)}
                    >
                      <Text style={[s.timeOptText, { color: theme.text }]}>{m}m</Text>
                    </TouchableOpacity>
                  ))
              }
            </View>
            <TouchableOpacity
              style={{ marginTop: 20, padding: 12, alignItems: 'center' }}
              onPress={() => setTimeModal({ visible: false, target: '', step: 'hour', tempHour: '' })}
            >
              <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </RootComp>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:        { flex: 1 },
  inner:       { flex: 1, minHeight: 0, width: '100%', maxWidth: 480, alignSelf: 'center', flexDirection: 'column' },
  header:      { padding: 20, paddingTop: Platform.OS === 'android' ? 20 : 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  stepCounter: { fontSize: 11, fontWeight: 'bold', marginTop: 8, alignSelf: 'flex-end' },
  progressBg:  { height: 6, marginTop: 15, borderRadius: 3 },
  progressFill:{ height: 6, borderRadius: 3 },
  // BUG 4 FIX: botão fechar
  closeBtn:    { padding: 8, borderRadius: 20, borderWidth: 1 },
  container:   { padding: 20, paddingBottom: 32 },
  question:    { fontSize: 20, fontWeight: '900', marginBottom: 16, lineHeight: 26 },
  label:       { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 0.8 },
  hint:        { fontSize: 11, fontStyle: 'italic', marginTop: 4, marginBottom: 4, lineHeight: 16 },
  row:         { flexDirection: 'row', justifyContent: 'space-between' },
  input:       { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 15, marginBottom: 8 },
  textArea:    { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 8 },
  optionCard:  { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  optionLabel: { fontSize: 14, fontWeight: '800' },
  optionDesc:  { fontSize: 11, marginTop: 3 },
  chipWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  chip:        { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  chipText:    { fontWeight: '700', fontSize: 13 },
  boolRow:     { flexDirection: 'row', gap: 12, marginBottom: 8 },
  boolBtn:     { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  boolText:    { fontWeight: '900', fontSize: 13 },
  scaleRow:    { flexDirection: 'row', gap: 10, marginBottom: 8 },
  scaleBtn:    { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  scaleBtnText:{ fontWeight: '900', fontSize: 16 },
  timeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  timeBtnText: { fontSize: 15, fontWeight: '700', flex: 1 },
  footer:      { flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1, gap: 15 },
  backBtn:     { flex: 1, padding: 16, alignItems: 'center', borderRadius: 16, borderWidth: 1 },
  nextBtn:     { flex: 2, padding: 16, alignItems: 'center', borderRadius: 16, elevation: 2 },
  modalOverlay:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  timeModal:   { width: '100%', maxWidth: 360, padding: 24, borderRadius: 24, borderWidth: 1 },
  modalTitle:  { fontSize: 14, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 16 },
  timeGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  timeOpt:     { width: '20%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  timeOptText: { fontWeight: 'bold', fontSize: 15 },
  confirmCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 24 },
  confirmText: { flex: 1, fontSize: 13, lineHeight: 20 },
});