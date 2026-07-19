// src/screens/Anamnese/useAnamneseForm.js
import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔥 MÁGICA: O formulário base agora mora aqui. Sem depender do constants.js (fim do form undefined)
const DEFAULT_FORM = {
  peso: '', altura: '', objetivo: '', nivel: '', frequencia: '', tempoDisponivel: '', trainFasted: '',
  limitacoes: [], cirurgias: [], equipamentos: [], healthConditions: [], healthConditionsObs: '',
  bariatric: '', bariatricType: '', bariatricTime: '', bariatricIntolerances: [], medications: [],
  medicationsObs: '', digestiveIssues: [], digestiveObs: '', sleepHours: '', sleepQuality: '',
  wakeHungry: '', stressLevel: '', stressEating: '', cycleRegular: '', pmsSymptoms: [], pmsObs: '',
  mealsPerDay: '', wakeUpTime: '', sleepTime: '', workTimeStart: '', workTimeEnd: '', trainTime: '',
  freeDays: [], freeWakeUpTime: '', freeSleepTime: '', freeTrainTime: '',
  eatsOutPerWeek: '', budget: '', waterIntake: '', alcoholFreq: '', coffeePerDay: '', smoker: '',
  eatSpeed: '', nightBinge: '', triedDiets: [], dietWorked: '', dietHated: '', biggestChallenge: '',
  allergies: '', foodPreferences: '', foodAversions: '', supplements: [], extraNotes: ''
};

export default function useAnamneseForm({ routeParams, navigation }) {
  // Blinda a leitura do usuário caso ele venha como string do React Navigation no Web
  const incomingUser = routeParams?.userData || routeParams?.user || routeParams?.aluno || null;
  const initialUser = typeof incomingUser === 'string' && incomingUser.startsWith('{') ? JSON.parse(incomingUser) : incomingUser;

  const [currentUser, setCurrentUser]               = useState(initialUser);
  const [form, setForm]                             = useState(DEFAULT_FORM);
  const [loading, setLoading]                       = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [timeModal, setTimeModal]                   = useState({ visible: false, target: '', step: 'hour', tempHour: '' });

  // 🔥 NOVO ESTADO SAAS: TEMPLATE DINÂMICO 🔥
  const [dynamicSchema, setDynamicSchema]           = useState(null);
  const [dynamicTemplateId, setDynamicTemplateId]   = useState(null);

  // ─── DERIVADOS E REGRA DO PLANO ────────────────────────────────────────────
  const isFeminino = currentUser?.gender === 'Feminino';
  
  // Regra Blindada: 11 passos apenas para Elite ou Premium.
  const plan = (currentUser?.plan || currentUser?.userPlan || '').toUpperCase();
  const hasDiet = plan === 'ELITE' || plan === 'PREMIUM';

  const getActualStep = (visualStep) => {
    // Se for um formulário dinâmico, o fluxo é linear, não pula passos hardcoded
    if (dynamicSchema) return visualStep;

    if (!hasDiet || isFeminino) return visualStep;
    return visualStep >= 7 ? visualStep + 1 : visualStep;
  };

  // Se houver schema dinâmico, usa os passos dele, caso contrário usa a regra legada
  const totalSteps = dynamicSchema ? dynamicSchema.steps.length : (!hasDiet ? 4 : isFeminino ? 11 : 10);

  // ─── INIT E FIM DO LOADING INFINITO ────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    // Timeout de segurança absoluta: libera a tela forçadamente após 4s
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setLoadingInitialData(false);
    }, 4000);

    const init = async () => {
      try {
        let user = currentUser;
        if (!user) {
          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            const p = JSON.parse(stored);
            if (p?.id) { user = p; setCurrentUser(p); }
          }
        }
        if (user?.id) {
          // 🔥 TENTATIVA 1: MOTOR DINÂMICO (SAAS) 🔥
          try {
            const coachId = user.coachId || 'MASTER';
            const formType = hasDiet ? 'FULL' : 'TRAINING'; // Avalia qual módulo o aluno precisa
            
            const resTemplate = await fetch(`https://fitos-final.onrender.com/api/form-template/active?coachId=${coachId}&type=${formType}`);
            if (resTemplate.ok) {
              const templateData = await resTemplate.json();
              if (templateData && templateData.schema && Array.isArray(templateData.schema.steps)) {
                if (isMounted) {
                  setDynamicSchema(templateData.schema);
                  setDynamicTemplateId(templateData.id);
                }
                await fetchDynamicExisting(templateData.id, user.id);
                return; // 🛑 Se achou o dinâmico, interrompe e não roda o legado
              }
            }
          } catch (dynamicError) {
            console.log('Sem template dinâmico customizado, caindo para Motor Legado.', dynamicError);
          }

          // 🔥 TENTATIVA 2: MOTOR LEGADO (PA ELITE TEAM) 🔥
          await fetchExisting(user.id);
        }
      } catch (error) {
        console.log('Erro no init da anamnese', error);
      } finally {
        if (isMounted) {
          setLoadingInitialData(false);
          clearTimeout(safetyTimeout);
        }
      }
    };
    init();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  // ─── FETCH ANAMNESE DINÂMICA EXISTENTE (SAAS) ──────────────────────────────
  const fetchDynamicExisting = async (templateId, userId) => {
    try {
      const res = await fetch(`https://fitos-final.onrender.com/api/form-response?userId=${userId}&templateId=${templateId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.answers) {
          // Mescla as respostas dinâmicas com o form vazio para evitar campos undefined
          setForm(prev => ({ ...prev, ...data.answers }));
        }
      }
    } catch (e) {
      console.log('Erro ao buscar anamnese dinâmica:', e);
    }
  };

  // ─── FETCH ANAMNESE EXISTENTE (LEGADO) ─────────────────────────────────────
  const fetchExisting = async (userId) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://fitos-final.onrender.com/api/anamnese?userId=${userId}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      
      if (res.ok) {
        const d = await res.json();
        if (d?.id) {
          setForm(prev => ({
            ...prev,
            peso:    d.peso   ? String(d.peso)   : '',
            altura:  d.altura ? String(d.altura) : '',
            objetivo: d.objetivo || '',
            nivel:    d.nivel    || '',
            frequencia:      d.frequencia     ? String(d.frequencia)     : '',
            tempoDisponivel: d.tempoDisponivel ? String(d.tempoDisponivel): '',
            trainFasted: d.trainFasted === true ? 'yes' : d.trainFasted === false ? 'no' : '',
            limitacoes:   Array.isArray(d.limitacoes)   ? d.limitacoes   : [],
            cirurgias:    Array.isArray(d.cirurgias)    ? d.cirurgias    : [],
            equipamentos: Array.isArray(d.equipamentos) ? d.equipamentos
              : (d.equipamentos ? d.equipamentos.split(',').map(i => i.trim()) : []),
            healthConditions:      Array.isArray(d.healthConditions) ? d.healthConditions : [],
            healthConditionsObs:   d.healthConditionsObs || '',
            bariatric:             d.bariatric === true ? 'yes' : d.bariatric === false ? 'no' : '',
            bariatricType:         d.bariatricType || '',
            bariatricTime:         d.bariatricTime || '',
            bariatricIntolerances: Array.isArray(d.bariatricIntolerances) ? d.bariatricIntolerances : [],
            medications:           Array.isArray(d.medications) ? d.medications : [],
            medicationsObs:        d.medicationsObs || '',
            digestiveIssues: Array.isArray(d.digestiveIssues) ? d.digestiveIssues : [],
            digestiveObs:    d.digestiveObs || '',
            sleepHours:      d.sleepHours   || '',
            sleepQuality:    d.sleepQuality || '',
            wakeHungry:      d.wakeHungry   === true ? 'yes' : d.wakeHungry === false ? 'no' : '',
            stressLevel:     d.stressLevel  ? String(d.stressLevel) : '',
            stressEating:    d.stressEating === true ? 'yes' : d.stressEating === false ? 'no' : '',
            cycleRegular: d.cycleRegular || '',
            pmsSymptoms:  Array.isArray(d.pmsSymptoms) ? d.pmsSymptoms : [],
            pmsObs:       d.pmsObs || '',
            mealsPerDay:   d.mealsPerDay ? String(d.mealsPerDay) : '',
            wakeUpTime:    d.wakeUpTime  || '',
            sleepTime:     d.sleepTime   || '',
            workTimeStart: d.workTime ? d.workTime.split(' às ')[0] : '',
            workTimeEnd:   d.workTime ? d.workTime.split(' às ')[1] : '',
            trainTime:     d.trainTime      || '',
            freeDays:       Array.isArray(d.freeDays) ? d.freeDays : [],
            freeWakeUpTime: d.freeWakeUpTime || '',
            freeSleepTime:  d.freeSleepTime  || '',
            freeTrainTime:  d.freeTrainTime  || '',
            eatsOutPerWeek:d.eatsOutPerWeek || '',
            budget:        d.budget         || '',
            waterIntake:  d.waterIntake  || '',
            alcoholFreq:  d.alcoholFreq  || '',
            coffeePerDay: d.coffeePerDay || '',
            smoker:       d.smoker === true ? 'yes' : d.smoker === false ? 'no' : '',
            eatSpeed:     d.eatSpeed     || '',
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
    }
  };

  // ─── HELPERS DE ESTADO ─────────────────────────────────────────────────────
  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleMulti = useCallback((field, item, noneValues = ['Nenhuma','Nenhum']) => {
    setForm(prev => {
      const list   = Array.isArray(prev[field]) ? prev[field] : [];
      const isNone = noneValues.includes(item);
      if (list.includes(item)) return { ...prev, [field]: list.filter(i => i !== item) };
      if (isNone)              return { ...prev, [field]: [item] };
      return { ...prev, [field]: [...list.filter(i => !noneValues.includes(i)), item] };
    });
  }, []);

  const openTimePicker = useCallback((target) => {
    setTimeModal({ visible: true, target, step: 'hour', tempHour: '' });
  }, []);

  const handleSelectHour = useCallback((h) => {
    setTimeModal(prev => ({ ...prev, step: 'minute', tempHour: h }));
  }, []);

  const handleSelectMinute = useCallback((m) => {
    setForm(prev => ({ ...prev, [timeModal.target]: `${timeModal.tempHour}:${m}` }));
    setTimeModal({ visible: false, target: '', step: 'hour', tempHour: '' });
  }, [timeModal]);

  const closeTimePicker = useCallback(() => {
    setTimeModal({ visible: false, target: '', step: 'hour', tempHour: '' });
  }, []);

  // ─── VALIDAÇÃO CIRÚRGICA ───────────────────────────────────────────────────
  const validateStep = (step) => {
    // 🔥 MOTOR DINÂMICO DE VALIDAÇÃO SAAS 🔥
    if (dynamicSchema && dynamicSchema.steps) {
      const currentStepData = dynamicSchema.steps[step - 1];
      if (!currentStepData || !currentStepData.questions) return true;
      
      const errs = [];
      currentStepData.questions.forEach(q => {
        if (q.required) {
          const val = form[q.id];
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
            errs.push(q.label || q.question);
          }
        }
      });
      
      if (errs.length > 0) {
        const msg = `Por favor, preencha os seguintes campos:\n\n• ${errs.join('\n• ')}`;
        if (Platform.OS === 'web') window.alert(`Faltam Dados!\n\n${msg}`);
        else Alert.alert('Faltam Dados', msg);
        return false;
      }
      return true;
    }

    // 🔥 MOTOR LEGADO DE VALIDAÇÃO PA ELITE TEAM 🔥
    const actual = getActualStep(step);
    const errs = [];

    switch (actual) {
      case 1:
        if (!form.peso) errs.push('Peso');
        if (!form.altura) errs.push('Altura');
        break;
      case 2:
        if (!form.objetivo) errs.push('Objetivo Principal');
        if (!form.nivel) errs.push('Nível de Experiência');
        break;
      case 3:
        if (!form.limitacoes || !form.limitacoes.length) errs.push('Limitações ou Dores');
        if (!form.cirurgias || !form.cirurgias.length) errs.push('Cirurgias Prévias');
        if (!form.equipamentos || !form.equipamentos.length) errs.push('Local/Equipamentos de Treino');
        break;
      case 4:
        if (!form.frequencia) errs.push('Frequência de Treino');
        if (!form.tempoDisponivel) errs.push('Tempo Disponível');
        if (hasDiet && !form.trainFasted) errs.push('Treina em Jejum?');
        break;
      case 5:
        if (!form.healthConditions || !form.healthConditions.length) errs.push('Condições de Saúde');
        if (form.bariatric === 'yes' && !form.bariatricType) errs.push('Tipo de Bariátrica');
        if (form.bariatric === 'yes' && !form.bariatricTime) errs.push('Há quanto tempo foi a cirurgia');
        if (!form.medications || !form.medications.length) errs.push('Usa Medicamentos?');
        break;
      case 6:
        if (!form.digestiveIssues || !form.digestiveIssues.length) errs.push('Saúde Digestiva');
        if (!form.sleepHours) errs.push('Horas de Sono por noite');
        if (!form.sleepQuality) errs.push('Qualidade do Sono');
        if (!form.stressLevel) errs.push('Nível de Stress no Dia a Dia');
        break;
      case 7:
        if (!form.cycleRegular) errs.push('Regularidade do Ciclo Menstrual');
        if (!form.pmsSymptoms || !form.pmsSymptoms.length) errs.push('Sintomas de TPM');
        break;
      case 8:
        if (!form.mealsPerDay) errs.push('Refeições Preferidas por Dia');
        if (!form.wakeUpTime) errs.push('Horário que Acorda (Rotina)');
        if (!form.sleepTime) errs.push('Horário que Dorme (Rotina)');
        if (!form.trainTime) errs.push('Horário do Treino (Rotina)');
        if (!form.freeDays || !form.freeDays.length) errs.push('Dias de Folga (ou marque Nenhum)');
        if (form.freeDays && form.freeDays.length > 0 && !form.freeDays.includes('Nenhum')) {
            if (!form.freeWakeUpTime) errs.push('Horário que Acorda (Folga)');
            if (!form.freeSleepTime) errs.push('Horário que Dorme (Folga)');
            if (!form.freeTrainTime) errs.push('Horário do Treino / Cardio (Folga)');
        }
        if (!form.eatsOutPerWeek) errs.push('Refeições Fora de Casa (por semana)');
        if (!form.budget) errs.push('Orçamento para Alimentação');
        break;
      case 9:
        if (!form.waterIntake) errs.push('Consumo de Água Estimado');
        if (!form.alcoholFreq) errs.push('Consumo de Álcool');
        if (!form.eatSpeed) errs.push('Velocidade ao Comer');
        if (!form.nightBinge) errs.push('Compulsão Alimentar Noturna');
        break;
      case 10:
        if (!form.biggestChallenge) errs.push('Seu Maior Desafio na Dieta');
        break;
      case 11:
        if (!form.allergies.trim()) errs.push('Alergias ou Intolerâncias');
        if (!form.foodAversions.trim()) errs.push('Aversões (O que odeia comer)');
        if (!form.foodPreferences.trim()) errs.push('Preferências Alimentares');
        if (!form.supplements || !form.supplements.length) errs.push('Suplementos que Utiliza');
        break;
      default: break;
    }

    if (errs.length > 0) {
      const msg = `Por favor, preencha os seguintes campos:\n\n• ${errs.join('\n• ')}`;
      if (Platform.OS === 'web') window.alert(`Faltam Dados!\n\n${msg}`);
      else Alert.alert('Faltam Dados', msg);
      return false;
    }
    return true;
  };

  // ─── SUBMIT ────────────────────────────────────────────────────────────────
  const salvar = async () => {
    if (!currentUser?.id) {
      Alert.alert('Sessão Expirada', 'Faça login novamente.');
      navigation.replace('Login');
      return;
    }
    setLoading(true);
    
    // 🔥 MOTOR DINÂMICO DE SUBMIT SAAS 🔥
    if (dynamicSchema && dynamicTemplateId) {
      try {
        const payload = {
          templateId: dynamicTemplateId,
          userId: currentUser.id,
          answers: form
        };
        const res = await fetch('https://fitos-final.onrender.com/api/form-response', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao salvar questionário dinâmico.');
        
        // Atualiza status do usuário localmente
        const updatedUser = { ...currentUser, anamnesePendente: false };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

        const msg = 'Questionário finalizado! Aguarde o contato do seu treinador.';
        if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Sucesso! 🚀', msg);
        navigation.reset({ index: 0, routes: [{ name: 'Main', params: { userData: updatedUser } }] });
      } catch (e) {
        if (Platform.OS === 'web') window.alert(e.message); else Alert.alert('Erro', e.message);
      } finally {
        setLoading(false);
      }
      return; // Interrompe para não disparar o motor legado
    }

    // 🔥 MOTOR LEGADO DE SUBMIT PA ELITE TEAM 🔥
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
          freeDays:       form.freeDays,
          freeWakeUpTime: form.freeWakeUpTime,
          freeSleepTime:  form.freeSleepTime,
          freeTrainTime:  form.freeTrainTime,
          eatsOutPerWeek: form.eatsOutPerWeek,
          budget:         form.budget,
          waterIntake:    form.waterIntake,
          alcoholFreq:    form.alcoholFreq,
          coffeePerDay:   form.coffeePerDay,
          smoker:         form.smoker === 'yes',
          eatSpeed:       form.eatSpeed,
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

  return {
    form, setField, toggleMulti,
    currentUser, loading, loadingInitialData,
    isFeminino, hasDiet, totalSteps, getActualStep,
    validateStep, salvar,
    timeModal, openTimePicker, handleSelectHour, handleSelectMinute, closeTimePicker,
    // Exportando o schema dinâmico para a tela poder se desenhar sozinha
    dynamicSchema 
  };
}