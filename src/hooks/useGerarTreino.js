// src/hooks/useGerarTreino.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_URL, STORAGE_PRESETS_KEY,
  STEP_SELECT_STUDENT, STEP_CYCLE_CONFIG, STEP_GENERATING,
  DEFAULT_LIMITATION_RULES, LOADING_MSGS, MUSCLE_GROUPS,
} from '../components/GerarTreino/_constants';
import { buildDefaultDays, suggestPhase, dayNeedsCardio } from '../components/GerarTreino/_helpers';

export default function useGerarTreino(navigation, route) {
  const cameFromAluno = !!(route.params?.aluno?.id);

  const [step, setStep] = useState(STEP_SELECT_STUDENT);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [generatingMsg, setGeneratingMsg] = useState('');
  const [error, setError] = useState('');
  const [generatedData, setGeneratedData] = useState(null);

  const [selectedAI, setSelectedAI] = useState('GEMINI');

  const [cyclePhase, setCyclePhase] = useState('HIPERTROFIA');
  const [selectedTechniques, setSelectedTechniques] = useState(['DROPSET', 'BISET']);
  const [techniqueScope, setTechniqueScope] = useState('CYCLE');
  const [trainingEnvironment, setTrainingEnvironment] = useState('ACADEMIA_PADRAO');
  const [days, setDays] = useState(buildDefaultDays(3));
  const [activeDayId, setActiveDayId] = useState('1');
  const [limitationRules] = useState(DEFAULT_LIMITATION_RULES);

  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');

  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showEnvPicker, setShowEnvPicker] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showPresetSaver, setShowPresetSaver] = useState(false);
  const [showPresetsLoader, setShowPresetsLoader] = useState(false);

  useEffect(() => {
    loadSavedPresets();
    if (cameFromAluno) {
      setStep(STEP_CYCLE_CONFIG);
      setLoadingStudents(false);
      handleSelectStudent(route.params.aluno);
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
      id: String(i + 1), name: d.name, editingName: false,
      groups: d.groups.map(g => ({
        ...g,
        rest: g.rest ?? MUSCLE_GROUPS.find(mg => mg.id === g.id)?.defaultRest ?? 60,
        sets: g.sets ?? MUSCLE_GROUPS.find(mg => mg.id === g.id)?.defaultSets ?? 4,
      })),
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
    if (!cameFromAluno) setStep(STEP_CYCLE_CONFIG);
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
      const anamnese = userData.anamneses?.[0];
      if (anamnese) {
        setDays(buildDefaultDays(anamnese.frequencia || 3));
        setActiveDayId('1');
        setCyclePhase(suggestPhase(anamnese.objetivo));
      }
    } catch (_) { setError('Falha ao carregar dados.'); }
    finally { setLoadingDetail(false); }
  };

  const handleGenerate = async () => {
    if (!selectedStudent) return;
    if (!days.some(d => d.groups.length > 0)) {
      setError('Configure pelo menos um grupo muscular.');
      return;
    }
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

      const daysWithCardio = days
        .filter(d => d.groups.length > 0)
        .map(d => {
          const groups = [...d.groups];
          if (dayNeedsCardio(groups, cyclePhase)) groups.push({ id: 'CARDIO', qty: 1, rest: 0, autoAdded: true });
          return {
            name: d.name,
            groups: groups.map(g => ({
              id: g.id, qty: g.qty,
              sets: g.sets ?? MUSCLE_GROUPS.find(mg => mg.id === g.id)?.defaultSets ?? 4,
              rest: g.rest ?? MUSCLE_GROUPS.find(mg => mg.id === g.id)?.defaultRest ?? 60,
            })),
          };
        });

      // 🔥 CORREÇÃO CIRÚRGICA: Enviando o selectedAI para a API
      const cycleConfig = {
        selectedAI, 
        phase: cyclePhase,
        techniques: selectedTechniques,
        techniqueScope,
        gender: studentDetail?.gender || 'Não informado',
        trainingEnvironment,
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

      setGeneratedData(data);
      setStep(STEP_CYCLE_CONFIG);
      setShowComparison(true);
    } catch (e) {
      clearInterval(iv);
      setError(e.message || 'Falha ao gerar treino.');
      setStep(STEP_CYCLE_CONFIG);
    }
  };

  const handleConfirmAndOpen = () => {
    if (!generatedData) return;
    setShowComparison(false);
    navigation.replace('MontarTreinoAdmin', {
      aluno: selectedStudent, isEditing: false,
      prefillData: {
        workoutName: generatedData.workoutName,
        workoutModel: generatedData.workoutModel || 'CARGA',
        exercisesByDay: generatedData.exercisesByDay,
        workoutTabs: generatedData.workoutTabs,
      },
    });
  };

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
      return { ...d, groups: [...d.groups, { id: groupId, qty: 3, sets: info?.defaultSets ?? 4, rest: info?.defaultRest ?? 60 }] };
    }));
  };

  const removeGroupFromDay = (dayId, groupId) => setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.filter(g => g.id !== groupId) } : d));
  const updateGroupQty = (dayId, groupId, qty) => setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.map(g => g.id === groupId ? { ...g, qty } : g) } : d));
  const updateGroupSets = (dayId, groupId, sets) => setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.map(g => g.id === groupId ? { ...g, sets } : g) } : d));
  const updateGroupRest = (dayId, groupId, rest) => setDays(days.map(d => d.id === dayId ? { ...d, groups: d.groups.map(g => g.id === groupId ? { ...g, rest } : g) } : d));

  const applyTemplate = (tmpl) => {
    setDays(days.map(d => d.id !== activeDayId ? d : {
      ...d, name: tmpl.label,
      groups: tmpl.groups.map(g => {
        const info = MUSCLE_GROUPS.find(mg => mg.id === g.id);
        return { ...g, sets: g.sets ?? info?.defaultSets ?? 4, rest: info?.defaultRest ?? 60 };
      }),
    }));
    setShowTemplatePicker(false);
  };

  const moveGroupUp = (dayId, groupId) => {
    setDays(days.map(d => {
      if (d.id !== dayId) return d;
      const idx = d.groups.findIndex(g => g.id === groupId);
      if (idx <= 0) return d;
      const ng = [...d.groups];
      [ng[idx - 1], ng[idx]] = [ng[idx], ng[idx - 1]];
      return { ...d, groups: ng };
    }));
  };

  const moveGroupDown = (dayId, groupId) => {
    setDays(days.map(d => {
      if (d.id !== dayId) return d;
      const idx = d.groups.findIndex(g => g.id === groupId);
      if (idx >= d.groups.length - 1) return d;
      const ng = [...d.groups];
      [ng[idx], ng[idx + 1]] = [ng[idx + 1], ng[idx]];
      return { ...d, groups: ng };
    }));
  };

  const toggleTechnique = (id) => setSelectedTechniques(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const handleBack = () => {
    if (step === STEP_GENERATING) return;
    if (step === STEP_CYCLE_CONFIG) {
      if (cameFromAluno) { navigation.goBack(); return; }
      setStep(STEP_SELECT_STUDENT);
      setSelectedStudent(null);
      setStudentDetail(null);
      return;
    }
    navigation.goBack();
  };

  const activeDay = days.find(d => d.id === activeDayId);
  const anamnese = studentDetail?.anamneses?.[0];
  const allLimitations = [...(anamnese?.limitacoes || []), ...(anamnese?.cirurgias || [])];
  const activeRules = limitationRules.filter(rule => allLimitations.some(l => l.toLowerCase().includes(rule.trigger.toLowerCase())));
  const filteredStudents = students.filter(s => (s.name?.toLowerCase() || '').includes(search.toLowerCase()) || (s.email?.toLowerCase() || '').includes(search.toLowerCase()));

  return {
    step, search, setSearch, students, loadingStudents, selectedStudent,
    studentDetail, loadingDetail, generatingMsg, error, setError,
    generatedData, cyclePhase, setCyclePhase, selectedTechniques,
    techniqueScope, setTechniqueScope, trainingEnvironment, setTrainingEnvironment,
    days, activeDayId, setActiveDayId, savedPresets, presetName, setPresetName,
    selectedAI, setSelectedAI, 
    showGroupPicker, setShowGroupPicker, showTemplatePicker, setShowTemplatePicker,
    showEnvPicker, setShowEnvPicker, showComparison, setShowComparison,
    showPresetSaver, setShowPresetSaver, showPresetsLoader, setShowPresetsLoader,
    activeDay, anamnese, activeRules, filteredStudents,
    handleBack, handleGenerate, handleConfirmAndOpen, handleSelectStudent, fetchStudents,
    savePreset, loadPreset, deletePreset, addDay, removeDay, updateDayName,
    addGroupToDay, removeGroupFromDay, updateGroupQty, updateGroupSets, updateGroupRest,
    applyTemplate, moveGroupUp, moveGroupDown, toggleTechnique,
  };
}