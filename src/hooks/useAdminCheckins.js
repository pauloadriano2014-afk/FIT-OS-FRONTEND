// src/hooks/useAdminCheckins.js
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export const useAdminCheckins = (aluno) => {
  const [loading, setLoading]           = useState(true);
  const [checkins, setCheckins]         = useState([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  const [modalVisible, setModalVisible]   = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedCheckinId, setSelectedCheckinId]   = useState(null);
  const [selectedPhotoField, setSelectedPhotoField] = useState(null);

  const [evaluationModalVisible, setEvaluationModalVisible] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI]   = useState(false);
  const [evaluationType, setEvaluationType]   = useState('initial');
  const [currentCheckinForEval, setCurrentCheckinForEval] = useState(null);

  const [selectedOldCheckinId, setSelectedOldCheckinId] = useState(null);
  const [savedCompareUrls, setSavedCompareUrls] = useState(null);
  const [feedbackText, setFeedbackText]         = useState('');
  const [sendingEvaluation, setSendingEvaluation] = useState(false);
  const [isResolving, setIsResolving]           = useState(false);
  const [showDatePicker, setShowDatePicker]     = useState(false);

  const [compareSource, setCompareSource]   = useState('system');
  const [oldFront, setOldFront] = useState(null);
  const [oldSide,  setOldSide]  = useState(null);
  const [oldBack,  setOldBack]  = useState(null);
  const [customOldWeight, setCustomOldWeight] = useState('');
  const [customOldDate,   setCustomOldDate]   = useState('');
  const [contextText, setContextText]         = useState('');

  useEffect(() => { checkPermissionAndFetch(); }, [aluno.id]);

  const checkPermissionAndFetch = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const userObj    = JSON.parse(userJson);
        const adminEmail = userObj.email.toLowerCase();
        const adminId    = userObj.id;
        const isAdri     = adminEmail === 'adri.personal@hotmail.com';

        let realCoachId = aluno.coachId;
        const cachedData = await AsyncStorage.getItem('@dashboard_cache');
        if (cachedData) {
          const { cacheAtivos, cacheInativos } = JSON.parse(cachedData);
          const found = [...(cacheAtivos||[]), ...(cacheInativos||[])].find(u => u.id === aluno.id);
          if (found?.coachId) realCoachId = found.coachId;
        }

        const isMyStudent = isAdri
          ? realCoachId === adminId
          : (realCoachId === adminId || !realCoachId);

        setHasPermission(isMyStudent);
        if (isMyStudent && aluno.id) await fetchCheckins();
        else setLoading(false);
      }
    } catch { setLoading(false); }
  };

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://fitos-final.onrender.com/api/checkin?userId=${aluno.id}&t=${Date.now()}`);
      if (res.ok) {
        const data   = await res.json();
        const sorted = data.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setCheckins(sorted);
      }
    } catch (e) { console.log('Erro checkins:', e); }
    finally { setLoading(false); }
  };

  const safeDate = (d) => { const dt = new Date(d); return isNaN(dt) ? new Date() : dt; };

  const handleDelete = (id) => {
    const run = async () => {
      try {
        const res = await fetch(`https://fitos-final.onrender.com/api/checkin?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setCheckins(prev => prev.filter(c => c.id !== id));
          if (Platform.OS === 'web') window.alert('Check-in excluído!');
        } else {
          if (Platform.OS === 'web') window.alert('Erro ao excluir.'); else Alert.alert('Erro','Falha ao excluir.');
        }
      } catch {
        if (Platform.OS === 'web') window.alert('Erro de conexão.'); else Alert.alert('Erro','Falha na conexão.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Apagar este check-in permanentemente?')) run();
    } else {
      Alert.alert('Excluir','Apagar este check-in permanentemente?',[
        { text:'Cancelar', style:'cancel' },
        { text:'Excluir',  style:'destructive', onPress: run },
      ]);
    }
  };

  // ✅ openPhoto agora recebe checkinId e field
  const openPhoto = (uri, checkinId = null, field = null) => {
    if (!uri) return;
    setSelectedPhoto(uri);
    setSelectedCheckinId(checkinId);
    setSelectedPhotoField(field);
    setModalVisible(true);
  };

  // ✅ Atualiza URL de uma foto no estado local
  const updateCheckinPhoto = (checkinId, field, newUrl) => {
    setCheckins(prev => prev.map(c => c.id === checkinId ? { ...c, [field]: newUrl } : c));
  };

  // ✅ Atualiza coachFeedback no estado local (para comparação composta)
  const updateCheckinFeedback = (checkinId, newFeedback) => {
    setCheckins(prev => prev.map(c => c.id === checkinId ? { ...c, coachFeedback: newFeedback } : c));
  };

  const optimizeImage = async (uri) => {
    try {
      const r = await ImageManipulator.manipulateAsync(uri, [{ resize:{ width:1080 } }], { compress:0.7, format: ImageManipulator.SaveFormat.JPEG, base64:true });
      return { uri: r.uri, base64: r.base64 };
    } catch { return null; }
  };

  const pickCustomOldImage = async (slot) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permissão necessária','Precisamos de acesso à galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing:true, quality:1 });
    if (!result.canceled && result.assets?.length) {
      const opt = await optimizeImage(result.assets[0].uri);
      if (opt) {
        if (slot==='front') setOldFront(opt);
        if (slot==='side')  setOldSide(opt);
        if (slot==='back')  setOldBack(opt);
      }
    }
  };

  const removeCustomOldImage = (slot) => {
    if (slot==='front') setOldFront(null);
    if (slot==='side')  setOldSide(null);
    if (slot==='back')  setOldBack(null);
  };

  const openEvaluationPanel = (checkin, initialType) => {
    let rawFb = checkin.coachFeedback || '';
    let extractedOldUrls = null;

    // Suporte às duas tags: antiga [COMPARE:] e nova [COMPARE_IMG:]
    if (rawFb.includes('[COMPARE_IMG:')) {
      const m = rawFb.match(/\[COMPARE_IMG:(.*?)\]/);
      if (m) { rawFb = rawFb.replace(m[0],'').trim(); initialType = 'comparison'; }
    } else if (rawFb.includes('[COMPARE:')) {
      const m = rawFb.match(/\[COMPARE:(.*?)\]/);
      if (m) { extractedOldUrls = m[1]; rawFb = rawFb.replace(m[0],'').trim(); initialType = 'comparison'; }
    }

    setCurrentCheckinForEval(checkin);
    setEvaluationType(initialType);
    setFeedbackText(rawFb);
    setCompareSource('system');
    setOldFront(null); setOldSide(null); setOldBack(null);
    setCustomOldWeight(''); setCustomOldDate(''); setContextText('');

    if (initialType === 'comparison') {
      if (extractedOldUrls) {
        setSavedCompareUrls(extractedOldUrls);
      } else {
        const idx    = checkins.findIndex(c => c.id === checkin.id);
        const older  = checkins.slice(idx + 1);
        if (older.length > 0) setSelectedOldCheckinId(older[older.length - 1].id);
      }
    } else {
      setSelectedOldCheckinId(null);
      setSavedCompareUrls(null);
    }

    setEvaluationModalVisible(true);
  };

  const handleTabChange = (type) => {
    setEvaluationType(type);
    if (type === 'comparison' && compareSource === 'system' && !selectedOldCheckinId && !savedCompareUrls) {
      const idx   = checkins.findIndex(c => c.id === currentCheckinForEval?.id);
      const older = checkins.slice(idx + 1);
      if (older.length > 0) setSelectedOldCheckinId(older[older.length - 1].id);
    }
  };

  const getOldCheckin = () => checkins.find(c => c.id === selectedOldCheckinId) ?? null;

  const generateAIFeedback = async () => {
    if (evaluationType === 'comparison' && compareSource === 'gallery' && !oldFront && !oldSide && !oldBack) {
      Alert.alert('Atenção','Adicione pelo menos uma foto antiga da galeria.'); return;
    }
    setIsGeneratingAI(true);
    try {
      const customPhotos = compareSource === 'gallery' ? [
        oldFront ? `data:image/jpeg;base64,${oldFront.base64}` : '',
        oldSide  ? `data:image/jpeg;base64,${oldSide.base64}`  : '',
        oldBack  ? `data:image/jpeg;base64,${oldBack.base64}`  : '',
      ] : [];
      const res = await fetch('https://fitos-final.onrender.com/api/ai/evaluate-checkin', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ checkInId: currentCheckinForEval.id, oldCheckInId: (evaluationType==='comparison'&&compareSource==='system') ? selectedOldCheckinId : null, customOldPhotos: customPhotos, customOldWeight: (evaluationType==='comparison'&&compareSource==='gallery') ? customOldWeight : null, contextText }),
      });
      if (!res.ok) throw new Error('Falha na IA');
      const data = await res.json();
      if (data.analysis) setFeedbackText(data.analysis); else throw new Error('Feedback vazio');
    } catch (e) {
      const msg = 'O motor de IA falhou. Tente novamente.';
      if (Platform.OS==='web') window.alert(msg); else Alert.alert('Erro',msg);
    } finally { setIsGeneratingAI(false); }
  };

  const submitEvaluation = async () => {
    if (!feedbackText.trim()) {
      const msg = 'O texto não pode estar vazio.';
      if (Platform.OS==='web') window.alert(msg); else Alert.alert('Atenção',msg); return;
    }
    let finalFeedback = feedbackText;
    let payloadPhotos = [];

    if (evaluationType === 'comparison') {
      if (compareSource === 'system') {
        if (selectedOldCheckinId) {
          const old = getOldCheckin();
          if (old) finalFeedback = `[COMPARE:${[old.photoFront||'',old.photoSide||'',old.photoBack||''].join('|')}]\n` + finalFeedback;
        } else if (savedCompareUrls) {
          finalFeedback = `[COMPARE:${savedCompareUrls}]\n` + finalFeedback;
        }
      } else {
        payloadPhotos = [
          oldFront ? `data:image/jpeg;base64,${oldFront.base64}` : '',
          oldSide  ? `data:image/jpeg;base64,${oldSide.base64}`  : '',
          oldBack  ? `data:image/jpeg;base64,${oldBack.base64}`  : '',
        ];
        if (customOldDate || customOldWeight) finalFeedback = `*(Base: ${customOldDate||'Galeria'} | ${customOldWeight?customOldWeight+'kg':''})*\n\n` + finalFeedback;
      }
    }

    setSendingEvaluation(true);
    try {
      const res = await fetch('https://fitos-final.onrender.com/api/checkin/evaluate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ checkinId: currentCheckinForEval.id, coachFeedback: finalFeedback, customOldPhotos: payloadPhotos }),
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.updatedFeedback || finalFeedback;
        setCheckins(prev => prev.map(c => c.id === currentCheckinForEval.id ? { ...c, coachFeedback: saved } : c));
        const msg = currentCheckinForEval.coachFeedback ? 'Avaliação editada!' : 'Avaliação enviada! Aluno notificado.';
        if (Platform.OS==='web') window.alert(msg); else Alert.alert('Sucesso!',msg);
        setEvaluationModalVisible(false);
      } else throw new Error('Erro ao salvar.');
    } catch {
      if (Platform.OS==='web') window.alert('Erro ao salvar avaliação.'); else Alert.alert('Erro','Falha ao salvar.');
    } finally { setSendingEvaluation(false); }
  };

  const handleResolveSilently = (checkinId) => {
    const run = async () => {
      setIsResolving(true);
      try {
        const res = await fetch('https://fitos-final.onrender.com/api/checkin/evaluate', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ checkinId, silent:true, coachFeedback: '*Avaliação Finalizada!* 🎯\n\nSeu laudo completo foi gerado. Vá até a tela de **Evolução** para conferir.' }),
        });
        if (res.ok) {
          setCheckins(prev => prev.map(c => c.id === checkinId ? { ...c, coachFeedback:'Avaliação Silenciosa' } : c));
          if (Platform.OS==='web') window.alert('Baixa realizada!');
        } else {
          if (Platform.OS==='web') window.alert('Erro ao dar baixa.'); else Alert.alert('Erro','Não foi possível atualizar.');
        }
      } catch {
        if (Platform.OS==='web') window.alert('Erro de conexão.'); else Alert.alert('Erro','Erro de conexão.');
      } finally { setIsResolving(false); }
    };
    if (Platform.OS==='web') {
      if (window.confirm('Marcar como avaliado (sem notificar o aluno)?')) run();
    } else {
      Alert.alert('Baixa Silenciosa','Remover alerta sem enviar Push?',[
        { text:'Cancelar', style:'cancel' },
        { text:'Sim', onPress: run },
      ]);
    }
  };

  return {
    loading, checkins, hasPermission, visibleCount, setVisibleCount,
    modalVisible, setModalVisible, selectedPhoto, openPhoto,
    selectedCheckinId, selectedPhotoField,
    updateCheckinPhoto, updateCheckinFeedback,           // ✅ novo
    evaluationModalVisible, setEvaluationModalVisible, isGeneratingAI,
    evaluationType, currentCheckinForEval,
    selectedOldCheckinId, setSelectedOldCheckinId,
    savedCompareUrls, setSavedCompareUrls,
    feedbackText, setFeedbackText, sendingEvaluation, isResolving,
    showDatePicker, setShowDatePicker,
    compareSource, setCompareSource,
    oldFront, oldSide, oldBack,
    customOldWeight, setCustomOldWeight,
    customOldDate,   setCustomOldDate,
    contextText, setContextText,
    fetchCheckins, safeDate, handleDelete,
    pickCustomOldImage, removeCustomOldImage,
    openEvaluationPanel, handleTabChange, getOldCheckin,
    generateAIFeedback, submitEvaluation, handleResolveSilently,
    setCheckins,
  };
};