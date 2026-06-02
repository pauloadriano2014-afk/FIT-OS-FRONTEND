// src/hooks/useAdminEvolution.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { getAgeFromDate, calculateBodyFat } from '../utils/calculations';

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
    const [currentAge, setCurrentAge] = useState(aluno?.birthDate ? getAgeFromDate(aluno.birthDate) : '');
    
    // Configura o gênero inicial vindo da lista, caso exista
    const [currentGender, setCurrentGender] = useState(aluno?.gender ? aluno.gender.toUpperCase() : 'MASCULINO');
    
    const [measures, setMeasures] = useState({ 
        waist: '', abdomen: '', chestMeasure: '', shoulders: '', hips: '', 
        armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', 
        legRight: '', legLeft: '', calfRight: '', calfLeft: '' 
    });
    const [folds, setFolds] = useState({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });
    
    const [photos, setPhotos] = useState({ front: null, back: null, side: null });

    useEffect(() => { 
        if (aluno?.id) loadData(); 
    }, [aluno?.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [resAssess, resLogs, resCheckins] = await Promise.all([
                fetch(`https://fitos-final.onrender.com/api/assessment?userId=${aluno.id}`),
                fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}/history`),
                fetch(`https://fitos-final.onrender.com/api/checkin?userId=${aluno.id}`) 
            ]);

            const dataAssess = await resAssess.json();
            const dataLogs = await resLogs.json();
            const dataCheckins = await resCheckins.json();

            if (Array.isArray(dataAssess)) {
                setAssessmentHistory(dataAssess);
                
                // 🔥 CAPTURA DE GÊNERO EM TEMPO REAL DO BACKEND VIA PRISMA (include: user) 🔥
                if (dataAssess.length > 0 && dataAssess[0]?.user) {
                    const dbGender = dataAssess[0].user.gender || dataAssess[0].user.sexo || '';
                    if (dbGender) {
                        setCurrentGender(dbGender.toUpperCase().trim());
                    }
                }
            }
            if (dataLogs.workoutLogs) setWorkoutLogs(dataLogs.workoutLogs);
            if (Array.isArray(dataCheckins)) setCheckinHistory(dataCheckins); 

        } catch (e) { 
            console.log("Erro ao carregar dados:", e); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleDelete = (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm("Tem certeza que deseja apagar esta avaliação?")) {
                fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE' })
                .then(() => { setDetailsVisible(false); loadData(); })
                .catch(e => window.alert("Erro ao excluir: " + e.message));
            }
        } else {
            Alert.alert("Excluir", "Apagar esta avaliação?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Apagar", style: 'destructive', onPress: async () => {
                    try {
                        await fetch(`https://fitos-final.onrender.com/api/assessment?id=${id}`, { method: 'DELETE' });
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
    };

    const resetForm = () => {
        setEditingId(null); setWeight(''); setCustomDate(''); setMethod('BASICO');
        setMeasures({ waist:'', abdomen:'', chestMeasure: '', shoulders: '', hips: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', legRight: '', legLeft: '', calfRight: '', calfLeft: '' });
        setFolds({ foldChest:'', foldAxillary:'', foldTriceps:'', foldSubscapular:'', foldAbdominal:'', foldSuprailiac:'', foldThigh:'' });
        setPhotos({ front: null, back: null, side: null }); 
    };

    const handleEdit = (item) => {
        setDetailsVisible(false);
        setEditingId(item.id);
        setMethod(item.method || 'BASICO');
        setWeight(String(item.weight));
        const d = new Date(item.date);
        setCustomDate(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`);

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

        if (method === 'POLLOCK') {
            if (!currentAge) return Alert.alert("Atenção", "Informe a IDADE para calcular o % de Gordura.");
            Object.keys(folds).forEach(k => cleanFolds[k] = folds[k].replace(',', '.'));
            calculatedBF = calculateBodyFat(currentGender, currentAge, cleanFolds);
            Object.keys(measures).forEach(k => cleanMeasures[k] = measures[k] ? measures[k].replace(',', '.') : null);
        } else {
            cleanMeasures.waist = measures.waist ? measures.waist.replace(',', '.') : null;
            cleanMeasures.abdomen = measures.abdomen ? measures.abdomen.replace(',', '.') : null;
        }

        const payload = {
            userId: aluno.id, 
            date: isoDate, 
            weight: weight.replace(',', '.'), 
            method, 
            bodyFat: calculatedBF,
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
            thighLeft: method === 'POLLOCK' ? cleanMeasures.thighLeft : null, 
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

        try {
            const res = await fetch('https://fitos-final.onrender.com/api/assessment', { 
                method: editingId ? 'PUT' : 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(payload) 
            });
            const json = await res.json(); 

            if (res.ok) {
                const msg = method === 'POLLOCK' ? `Salvo!\nBF Estimado: ${calculatedBF}%` : `Peso registrado!`;
                if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Sucesso", msg);
                setModalVisible(false); 
                resetForm(); 
                loadData(); 
            } else {
                Alert.alert("Erro ao Salvar", json.error || "Verifique os dados.");
            }
        } catch (e) { 
            Alert.alert("Erro de Conexão", e.message); 
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
        loadData, handleDelete, openDetails, handleDateChange, resetForm,
        handleEdit, handleSaveAssessment
    };
}
