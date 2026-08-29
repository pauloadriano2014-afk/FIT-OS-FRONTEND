// src/hooks/useAdminEvolution.js
import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
// 🔥 Importamos a nossa nova função matemática getAgeAtDate!
import { getAgeFromDate, getAgeAtDate, calculateBodyFat } from '../utils/calculations';
import { authHeaders } from '../utils/authToken';

export default function useAdminEvolution(aluno) {
    const [loading, setLoading] = useState(true);
    const [assessmentHistory, setAssessmentHistory] = useState([]);
    const [workoutLogs, setWorkoutLogs] = useState([]); 
    const [checkinHistory, setCheckinHistory] = useState([]); 

    const [modalVisible, setModalVisible] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false); 
    const [selectedAssessment, setSelectedAssessment] = useState(null); 

    const [checkinModalVisible, setCheckinModalVisible] = useState(false);
    const [selectedCheckin, setSelectedCheckin] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [method, setMethod] = useState('BASICO');
    const [customDate, setCustomDate] = useState('');
    const [weight, setWeight] = useState('');
    
    // 🔥 Salvamos a data de nascimento como estado para a Máquina do Tempo poder consultar!
    const [studentBirthDate, setStudentBirthDate] = useState('');
    const [currentAge, setCurrentAge] = useState('');
    const [currentGender, setCurrentGender] = useState(aluno?.gender ? aluno.gender.toUpperCase().trim() : '');
    
    const [measures, setMeasures] = useState({
        waist: '', abdomen: '', chestMeasure: '', shoulders: '', hips: '',
        armRight: '', armLeft: '', forearmRight: '', forearmLeft: '',
        legRight: '', legLeft: '', calfRight: '', calfLeft: ''
    });
    const [folds, setFolds] = useState({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });

    // 🔥 NOVO: objetivo/contexto que o coach escreve pra orientar o laudo de IA
    // (ex.: "foco em definição e pernas/glúteos, não busca superior musculoso").
    // Salvo no campo "notes" da avaliação, que já existia no banco mas nunca era usado.
    const [goalNote, setGoalNote] = useState('');

    const [photos, setPhotos] = useState({ front: null, back: null, side: null });

    // 🔥 NOVO: estado de loading da geração do diagnóstico por IA 🔥
    const [generatingAI, setGeneratingAI] = useState(false);

    // 🔥 NOVO: estado de loading da edição manual do diagnóstico 🔥
    const [savingAIReport, setSavingAIReport] = useState(false);

    useEffect(() => {
        if (aluno?.birthDate || aluno?.dataNascimento) {
            setStudentBirthDate(aluno.birthDate || aluno.dataNascimento);
        }
        if (aluno?.birthDate || aluno?.idade || aluno?.age) {
            if (aluno.idade || aluno.age) {
                setCurrentAge(String(aluno.idade || aluno.age).replace(/[^0-9]/g, ''));
            } else {
                const calc = getAgeFromDate(aluno.birthDate);
                if (calc) setCurrentAge(calc);
            }
        }
    }, [aluno?.birthDate, aluno?.idade, aluno?.age, aluno?.dataNascimento]);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const safeFetchJSON = async (url) => {
                try {
                    const res = await fetch(url, { headers: { ...(await authHeaders()) } });
                    if (!res.ok) return null;
                    return await res.json();
                } catch (e) {
                    return null; 
                }
            };

            const [dataAssess, dataLogs, dataCheckins] = await Promise.all([
                safeFetchJSON(`https://fitos-final.onrender.com/api/assessment?userId=${aluno.id}`),
                safeFetchJSON(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}/history`),
                safeFetchJSON(`https://fitos-final.onrender.com/api/checkin?userId=${aluno.id}`) 
            ]);

            // 🔥 VARREDURA PROFUNDA DO GÊNERO 🔥
            let realGender = aluno?.gender || aluno?.sexo || '';

            if (!realGender && dataLogs?.user) {
                realGender = dataLogs.user.gender || dataLogs.user.sexo || '';
            }

            if (!realGender && Array.isArray(dataAssess) && dataAssess.length > 0 && dataAssess[0]?.user) {
                realGender = dataAssess[0].user.gender || dataAssess[0].user.sexo || '';
            }

            // 🔥 O NOVO ARRASTÃO DA IDADE 🔥
            let realBirth = aluno?.birthDate || aluno?.dataNascimento || '';
            let literalAge = aluno?.idade || aluno?.age || '';

            if (!realBirth && !literalAge && dataLogs?.user) {
                realBirth = dataLogs.user.birthDate || dataLogs.user.dataNascimento || '';
                literalAge = dataLogs.user.idade || dataLogs.user.age || '';
            }

            if (!realBirth && !literalAge && Array.isArray(dataAssess) && dataAssess.length > 0 && dataAssess[0]?.user) {
                realBirth = dataAssess[0].user.birthDate || dataAssess[0].user.dataNascimento || '';
                literalAge = dataAssess[0].user.idade || dataAssess[0].user.age || '';
            }

            // 🔥 A CORREÇÃO: Usando ?userId= para buscar o usuário corretamente no novo backend
            const userDetails = await safeFetchJSON(`https://fitos-final.onrender.com/api/admin/user?userId=${aluno.id}&t=${Date.now()}`);
            
            if (userDetails) {
                if (!realGender) {
                    realGender = userDetails.gender || userDetails.sexo || userDetails.user?.gender || '';
                }

                if (!realBirth && !literalAge) {
                    realBirth = userDetails.birthDate || userDetails.user?.birthDate || userDetails.dataNascimento || '';
                    literalAge = userDetails.idade || userDetails.age || userDetails.user?.idade || userDetails.user?.age || '';
                }
            }

            if (realBirth) setStudentBirthDate(realBirth); // Guarda a raiz do nascimento para cálculos!

            // 🟢 APLICA O GÊNERO
            if (realGender) {
                setCurrentGender(realGender.toUpperCase().trim());
            } else {
                setCurrentGender('MASCULINO'); 
            }

            // 🟢 APLICA A IDADE AUTOMÁTICA APENAS SE A TELA ESTIVER VAZIA
            if (!currentAge) {
                if (literalAge && String(literalAge).trim() !== '') {
                    setCurrentAge(String(literalAge).replace(/[^0-9]/g, ''));
                } else if (realBirth) {
                    const calcAge = getAgeFromDate(realBirth);
                    if (calcAge) setCurrentAge(calcAge);
                }
            }

            if (dataAssess && Array.isArray(dataAssess)) {
                setAssessmentHistory(dataAssess);
            } else if (dataAssess && dataAssess.data && Array.isArray(dataAssess.data)) {
                setAssessmentHistory(dataAssess.data);
            } else if (dataAssess && dataAssess.assessments && Array.isArray(dataAssess.assessments)) {
                setAssessmentHistory(dataAssess.assessments);
            }

            if (dataLogs && dataLogs.workoutLogs) setWorkoutLogs(dataLogs.workoutLogs);
            
            if (dataCheckins && Array.isArray(dataCheckins)) {
                setCheckinHistory(dataCheckins);
            } else if (dataCheckins && Array.isArray(dataCheckins.data)) {
                setCheckinHistory(dataCheckins.data);
            }

        } catch (e) { 
            console.log("Erro crítico ao carregar dados:", e); 
        } finally { 
            setLoading(false); 
        }
    }, [aluno.id, aluno.gender, aluno.sexo, aluno.birthDate, aluno.idade, aluno.age, currentAge]);

    useEffect(() => { 
        if (aluno?.id) loadData(); 
    }, [aluno?.id, loadData]);

    const handleDelete = async (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm("Tem certeza que deseja apagar esta avaliação?")) {
                fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE', headers: { ...(await authHeaders()) } })
                .then(() => { setDetailsVisible(false); loadData(); })
                .catch(e => window.alert("Erro ao excluir: " + e.message));
            }
        } else {
            Alert.alert("Excluir", "Apagar esta avaliação?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Apagar", style: 'destructive', onPress: async () => {
                    try {
                        await fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
                        setDetailsVisible(false); 
                        loadData();
                    } catch(e) { 
                        Alert.alert("Erro", "Não foi possível excluir."); 
                    }
                }}
            ]);
        }
    };

    const openDetails = (item) => {
        setSelectedAssessment(item);
        setDetailsVisible(true);
    };

    const handleDateChange = (text) => {
        let cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
        if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
        setCustomDate(cleaned);

        // 🔥 A MÁQUINA DO TEMPO EM AÇÃO!
        if (studentBirthDate) {
            // Se preencheu uma data inteira, calcula a idade no passado/futuro
            if (cleaned.length === 10) {
                const retroAge = getAgeAtDate(studentBirthDate, cleaned);
                if (retroAge) setCurrentAge(retroAge);
            } 
            // Se o professor apagar a data retroativa, volta para a idade de Hoje
            else if (cleaned === '') {
                const currentAgeNow = getAgeFromDate(studentBirthDate);
                if (currentAgeNow) setCurrentAge(currentAgeNow);
            }
        }
    };

    const resetForm = () => {
        setEditingId(null); setWeight(''); setCustomDate(''); setMethod('BASICO');
        setMeasures({ waist:'', abdomen:'', chestMeasure: '', shoulders: '', hips: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', legRight: '', legLeft: '', calfRight: '', calfLeft: '' });
        setFolds({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });
        setPhotos({ front: null, back: null, side: null });
        setGoalNote('');
        
        // Retorna a idade para Hoje ao fechar
        if (studentBirthDate) {
            const currentAgeNow = getAgeFromDate(studentBirthDate);
            if (currentAgeNow) setCurrentAge(currentAgeNow);
        }
    };

    const handleEdit = (item) => {
        setDetailsVisible(false);
        setEditingId(item.id);
        setMethod(item.method || 'BASICO');
        setWeight(String(item.weight));
        setGoalNote(item.notes || '');

        const d = new Date(item.date);
        const formattedDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        setCustomDate(formattedDate);

        // 🔥 O RESGATE DO PASSADO: Busca a idade congelada no banco, ou calcula por aproximação!
        if (item.age) {
            setCurrentAge(String(item.age));
        } else if (studentBirthDate) {
            // Suporte para avaliações muito antigas que não tinham idade salva no banco ainda
            const retroAge = getAgeAtDate(studentBirthDate, formattedDate);
            if (retroAge) setCurrentAge(retroAge);
        }

        const itemPhotos = Array.isArray(item.photos) ? item.photos : [];
        setPhotos({
            front: itemPhotos[0] || null,
            side: itemPhotos[1] || null,
            back: itemPhotos[2] || null
        });

        if (item.method === 'POLLOCK') {
            setFolds({
                foldChest: item.foldChest ? String(item.foldChest) : '',
                foldAxillary: item.foldAxillary ? String(item.foldAxillary) : '',
                foldTriceps: item.foldTriceps ? String(item.foldTriceps) : '',
                foldSubscapular: item.foldSubscapular ? String(item.foldSubscapular) : '',
                foldAbdominal: item.foldAbdominal ? String(item.foldAbdominal) : '',
                foldSuprailiac: item.foldSuprailiac ? String(item.foldSuprailiac) : '',
                foldThigh: item.foldThigh ? String(item.foldThigh) : ''
            });
            setMeasures({ 
                waist: item.waist ? String(item.waist) : '', 
                abdomen: item.abdomen ? String(item.abdomen) : '',
                chestMeasure: item.chest ? String(item.chest) : '',
                shoulders: item.shoulders ? String(item.shoulders) : '',
                hips: item.hips ? String(item.hips) : '',
                armRight: item.arms ? String(item.arms) : '',
                armLeft: item.armLeft ? String(item.armLeft) : '',
                forearmRight: item.forearms ? String(item.forearms) : '',
                forearmLeft: item.forearmLeft ? String(item.forearmLeft) : '',
                legRight: item.thighs ? String(item.thighs) : '',
                legLeft: item.thighLeft ? String(item.thighLeft) : '',
                calfRight: item.calves ? String(item.calves) : '',
                calfLeft: item.calfLeft ? String(item.calfLeft) : ''
            });
        } else {
            setMeasures({ waist: item.waist ? String(item.waist) : '', abdomen: item.abdomen ? String(item.abdomen) : '', chestMeasure: '', shoulders: '', hips: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', legRight: '', legLeft: '', calfRight: '', calfLeft: '' });
        }
        setModalVisible(true);
    };

    const handleSaveAssessment = async () => {
        try {
            if (!weight) return Alert.alert("Erro", "O campo Peso é obrigatório.");
            if (customDate && customDate.length !== 10) return Alert.alert("Erro", "Data inválida (DD/MM/AAAA).");

            let isoDate = new Date().toISOString();
            if (customDate) {
                const [day, month, year] = customDate.split('/');
                isoDate = new Date(`${year}-${month}-${day}T12:00:00`).toISOString();
            }

            let calculatedBF = null;
            let cleanFolds = {};
            let cleanMeasures = {};

            const safeReplace = (val) => {
                if (val === null || val === undefined || val === '') return null;
                return String(val).replace(',', '.');
            };

            if (method === 'POLLOCK') {
                if (!currentAge || currentAge === '') {
                    return Alert.alert("Atenção", "Informe a IDADE do aluno para calcular o % de Gordura. Verifique no cadastro.");
                }
                
                Object.keys(folds).forEach(k => cleanFolds[k] = safeReplace(folds[k]));
                
                try {
                    calculatedBF = calculateBodyFat(currentGender, currentAge, cleanFolds);
                } catch (e) {
                    console.log("Falha no cálculo BF:", e);
                }
                
                Object.keys(measures).forEach(k => cleanMeasures[k] = safeReplace(measures[k]));
            } else {
                cleanMeasures.waist = safeReplace(measures.waist);
                cleanMeasures.abdomen = safeReplace(measures.abdomen);
            }

            const payload = {
                userId: aluno.id, 
                date: isoDate,
                age: currentAge ? parseInt(currentAge, 10) : null, // 🔥 O GRANDE PASSO: A Idade agora vai pro Banco de Dados!
                weight: safeReplace(weight),
                method,
                bodyFat: calculatedBF,
                notes: goalNote || null, // 🔥 objetivo do aluno, usado pelo laudo de IA
                waist: cleanMeasures.waist, 
                abdomen: cleanMeasures.abdomen,
                chest: method === 'POLLOCK' ? cleanMeasures.chestMeasure : null, 
                shoulders: method === 'POLLOCK' ? cleanMeasures.shoulders : null, 
                hips: method === 'POLLOCK' ? cleanMeasures.hips : null, 
                arms: method === 'POLLOCK' ? cleanMeasures.armRight : null, 
                armLeft: method === 'POLLOCK' ? cleanMeasures.armLeft : null, 
                forearms: method === 'POLLOCK' ? cleanMeasures.forearmRight : null, 
                forearmLeft: method === 'POLLOCK' ? cleanMeasures.forearmLeft : null, 
                thighs: method === 'POLLOCK' ? cleanMeasures.legRight : null, 
                thighLeft: method === 'POLLOCK' ? cleanMeasures.legLeft : null,
                calves: method === 'POLLOCK' ? cleanMeasures.calfRight : null, 
                calfLeft: method === 'POLLOCK' ? cleanMeasures.calfLeft : null,
                foldChest: method === 'POLLOCK' ? cleanFolds.foldChest : null, 
                foldAxillary: method === 'POLLOCK' ? cleanFolds.foldAxillary : null, 
                foldTriceps: method === 'POLLOCK' ? cleanFolds.foldTriceps : null, 
                foldSubscapular: method === 'POLLOCK' ? cleanFolds.foldSubscapular : null, 
                foldAbdominal: method === 'POLLOCK' ? cleanFolds.foldAbdominal : null, 
                foldSuprailiac: method === 'POLLOCK' ? cleanFolds.foldSuprailiac : null, 
                foldThigh: method === 'POLLOCK' ? cleanFolds.foldThigh : null,

                photoFront: photos.front || null,
                photoSide: photos.side || null,
                photoBack: photos.back || null
            };

            if (editingId) payload.id = editingId;

            const endpointUrl = editingId 
                ? `https://fitos-final.onrender.com/api/assessment?id=${editingId}` 
                : 'https://fitos-final.onrender.com/api/assessment';

            const res = await fetch(endpointUrl, {
                method: editingId ? 'PUT' : 'POST',
                headers: {'Content-Type': 'application/json', ...(await authHeaders())},
                body: JSON.stringify(payload)
            });
            
            const textResponse = await res.text();
            let json = {};
            if (textResponse) {
                try { json = JSON.parse(textResponse); } catch (e) {}
            }

            if (res.ok) {
                const msg = method === 'POLLOCK' ? `Salvo!\nBF Estimado: ${calculatedBF}%` : `Avaliação salva com sucesso!`;
                if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Sucesso", msg);
                setModalVisible(false); 
                resetForm(); 
                loadData(); 
            } else {
                Alert.alert("Erro ao Salvar", json.error || "Verifique os dados informados.");
            }
        } catch (e) { 
            console.error("Erro CRÍTICO na submissão:", e);
            Alert.alert("Erro", "Ocorreu uma falha no sistema. Revise os campos numéricos e tente novamente."); 
        }
    };

    // 🔥 dispara a geração do diagnóstico por IA para uma avaliação específica 🔥
    const generateAIReport = async (assessmentId) => {
        if (!assessmentId) return false;
        try {
            setGeneratingAI(true);
            const res = await fetch(`https://fitos-final.onrender.com/api/assessment/${assessmentId}/generate-ai-report`, {
                method: 'POST',
                headers: { ...(await authHeaders()) }
            });
            const json = await res.json();

            if (!res.ok) {
                const msg = json.error || "Não foi possível gerar o diagnóstico com IA.";
                if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Erro", msg);
                return false;
            }

            // Atualiza a avaliação aberta no modal com os novos campos de IA, sem fechar a tela
            setSelectedAssessment(prev => (prev && prev.id === assessmentId) ? { ...prev, ...json.assessment } : prev);
            await loadData();
            return true;
        } catch (e) {
            const msg = "Falha de conexão ao gerar diagnóstico com IA.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Erro", msg);
            return false;
        } finally {
            setGeneratingAI(false);
        }
    };

    // 🔥 salva edição manual dos campos de IA (sem chamar o Claude de novo) 🔥
    const updateAIReport = async (assessmentId, payload) => {
        if (!assessmentId) return false;
        try {
            setSavingAIReport(true);
            const res = await fetch(`https://fitos-final.onrender.com/api/assessment/${assessmentId}/generate-ai-report`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (!res.ok) {
                const msg = json.error || "Não foi possível salvar a edição.";
                if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Erro", msg);
                return false;
            }

            setSelectedAssessment(prev => (prev && prev.id === assessmentId) ? { ...prev, ...json.assessment } : prev);
            await loadData();
            return true;
        } catch (e) {
            const msg = "Falha de conexão ao salvar edição.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Erro", msg);
            return false;
        } finally {
            setSavingAIReport(false);
        }
    };

    return {
        loading, assessmentHistory, workoutLogs, checkinHistory,
        modalVisible, setModalVisible, detailsVisible, setDetailsVisible,
        selectedAssessment, setSelectedAssessment, checkinModalVisible, setCheckinModalVisible,
        selectedCheckin, setSelectedCheckin, editingId, setEditingId,
        method, setMethod, customDate, setCustomDate, weight, setWeight,
        currentAge, setCurrentAge, currentGender, setCurrentGender,
        measures, setMeasures, folds, setFolds, photos, setPhotos,
        goalNote, setGoalNote,
        loadData, handleDelete, openDetails, handleDateChange, resetForm,
        handleEdit, handleSaveAssessment,
        generatingAI, generateAIReport,
        savingAIReport, updateAIReport
    };
}