import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAdminDashboard() {
    const [alunosAtivos, setAlunosAtivos] = useState([]);
    const [alunosInativos, setAlunosInativos] = useState([]);
    const [feed, setFeed] = useState([]);
    const [checkins, setCheckins] = useState([]);
    const [dietFeedbacks, setDietFeedbacks] = useState([]);
    const [surveys, setSurveys] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [adminEmail, setAdminEmail] = useState('');
    const [adminId, setAdminId] = useState('');
    const [coachFilter, setCoachFilter] = useState('PAULO');

    const isFirstLoadRef = useRef(true);

    const fetchData = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else {
                const cachedData = await AsyncStorage.getItem('@dashboard_cache');
                if (cachedData) {
                    const { cacheAtivos, cacheInativos, cacheFeed, cacheCheckins, cacheFeedbacks } = JSON.parse(cachedData);
                    if (cacheAtivos) setAlunosAtivos(cacheAtivos);
                    if (cacheInativos) setAlunosInativos(cacheInativos);
                    if (cacheFeed) setFeed(cacheFeed);
                    if (cacheCheckins) setCheckins(cacheCheckins);
                    if (cacheFeedbacks) setDietFeedbacks(cacheFeedbacks);
                    setLoading(false);
                } else setLoading(true);
            }

            const t = Date.now();
            const userJson = await AsyncStorage.getItem('user');
            let localAdminId = '';

            if (userJson) {
                const userObj = JSON.parse(userJson);
                const email = userObj.email.toLowerCase();
                setAdminEmail(email);
                setAdminId(userObj.id);
                localAdminId = userObj.id;

                if (isFirstLoadRef.current) {
                    setCoachFilter(email === 'adri.personal@hotmail.com' ? 'ADRI' : 'PAULO');
                    isFirstLoadRef.current = false;
                }
            }

            // Busca Dados Principais
            fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${localAdminId}&t=${t}`)
                .then(res => res.json())
                .then(async data => {
                    const rawAtivos = data.activeUsers || data.users || [];
                    const rawInativos = data.inactiveUsers || [];
                    const processadosAtivos = rawAtivos.map(u => ({ ...u, isMyNutritionClient: u.nutritionistId === localAdminId }));
                    const processadosInativos = rawInativos.map(u => ({ ...u, isMyNutritionClient: u.nutritionistId === localAdminId }));

                    setAlunosAtivos(processadosAtivos);
                    setAlunosInativos(processadosInativos);
                    if (data.recentLogs) setFeed(data.recentLogs);

                    const currentCache = JSON.parse(await AsyncStorage.getItem('@dashboard_cache') || '{}');
                    await AsyncStorage.setItem('@dashboard_cache', JSON.stringify({
                        ...currentCache, cacheAtivos: processadosAtivos, cacheInativos: processadosInativos, cacheFeed: data.recentLogs || []
                    }));
                    if (data.exercises) await AsyncStorage.setItem('@global_exercises', JSON.stringify(data.exercises));
                }).catch(e => console.log(e)).finally(() => { setLoading(false); setRefreshing(false); });

            // Busca Checkins
            fetch(`https://fitos-final.onrender.com/api/checkin?adminId=${localAdminId}&t=${t}`)
                .then(res => res.json())
                .then(async dataCheckins => {
                    if (Array.isArray(dataCheckins)) {
                        setCheckins(dataCheckins);
                        const currentCache = JSON.parse(await AsyncStorage.getItem('@dashboard_cache') || '{}');
                        await AsyncStorage.setItem('@dashboard_cache', JSON.stringify({ ...currentCache, cacheCheckins: dataCheckins }));
                    }
                }).catch(e => console.log(e));

            // Busca Feedbacks de Dieta
            fetch(`https://fitos-final.onrender.com/api/admin/diet-feedbacks?t=${t}`)
                .then(res => res.json())
                .then(async dataFeedbacks => {
                    if (Array.isArray(dataFeedbacks)) {
                        setDietFeedbacks(dataFeedbacks);
                        const currentCache = JSON.parse(await AsyncStorage.getItem('@dashboard_cache') || '{}');
                        await AsyncStorage.setItem('@dashboard_cache', JSON.stringify({ ...currentCache, cacheFeedbacks: dataFeedbacks }));
                    }
                }).catch(e => console.log(e));

            // Busca NPS
            fetch(`https://fitos-final.onrender.com/api/admin/surveys?t=${t}`)
                .then(res => res.json())
                .then(async dataSurveys => {
                    if (Array.isArray(dataSurveys)) setSurveys(dataSurveys);
                }).catch(e => console.log("Erro NPS:", e));

        } catch (e) { setLoading(false); setRefreshing(false); }
    };

    const handleMarkFeedbackRead = async (id) => {
        try {
            await fetch('https://fitos-final.onrender.com/api/admin/diet-feedbacks', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, read: true })
            });
            setDietFeedbacks(prev => prev.map(f => f.id === id ? { ...f, read: true } : f));
        } catch (e) { console.log(e); }
    };

    const handleMarkSurveyRead = async (id) => {
        try {
            await fetch('https://fitos-final.onrender.com/api/admin/surveys', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
            });
            setSurveys(prev => prev.map(s => s.id === id ? { ...s, readByAdmin: true } : s));
        } catch (e) { console.log(e); }
    };

    const handleDeleteFeedback = (id) => {
        const confirmAction = async () => {
            try {
                await fetch(`https://fitos-final.onrender.com/api/admin/diet-feedbacks?id=${id}`, { method: 'DELETE' });
                setDietFeedbacks(prev => prev.filter(f => f.id !== id));
            } catch (e) { console.log(e); }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Deseja remover este aviso permanentemente?")) confirmAction();
        } else {
            Alert.alert("Excluir", "Deseja remover este aviso permanentemente?", [
                { text: "Cancelar" }, { text: "Sim", style: 'destructive', onPress: confirmAction }
            ]);
        }
    };

    const handleDeleteLog = (logId) => {
        const confirmAction = () => setFeed(current => current.filter(item => item.id !== logId));
        if (Platform.OS === 'web') {
            if (window.confirm("Deseja ocultar este item do feed?")) confirmAction();
        } else {
            Alert.alert("Remover", "Deseja ocultar este item do feed?", [
                { text: "Cancelar", style: "cancel" }, { text: "Sim", style: 'destructive', onPress: confirmAction }
            ]);
        }
    };

    const isAdriLogged = adminEmail.toLowerCase() === 'adri.personal@hotmail.com';

    const userCoachMap = useMemo(() => {
        const map = {};
        [...alunosAtivos, ...alunosInativos].forEach(u => {
            map[u.id] = u.coachId || (isAdriLogged ? adminId : null);
        });
        return map;
    }, [alunosAtivos, alunosInativos, isAdriLogged, adminId]);

    const getLogCoach = useCallback((item) => {
        let uId = item.userId || (item.user && item.user.id) || item.id;
        const cIdMapped = userCoachMap[uId] || item.coachId || (item.user && item.user.coachId);
        if (isAdriLogged) return (cIdMapped === adminId) ? 'ADRI' : 'PAULO';
        return (cIdMapped && cIdMapped !== adminId) ? 'ADRI' : 'PAULO';
    }, [userCoachMap, adminId, isAdriLogged]);

    return {
        alunosAtivos, alunosInativos, feed, checkins, dietFeedbacks, surveys,
        loading, refreshing, adminEmail, adminId, coachFilter, setCoachFilter,
        isAdriLogged, fetchData, handleMarkFeedbackRead, handleMarkSurveyRead,
        handleDeleteFeedback, handleDeleteLog, getLogCoach
    };
}