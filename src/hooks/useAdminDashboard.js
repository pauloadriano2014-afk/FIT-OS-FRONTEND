// src/hooks/useAdminDashboard.js
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PAULO_ID, ADRI_ID } from '../constants/masterIds';

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
    
    // 🔥 TRAVA DE SEGURANÇA SAAS 🔥
    const [isMaster, setIsMaster] = useState(false); 

    const isFirstLoadRef = useRef(true);

    const fetchData = async (isManualRefresh = false) => {
        try {
            const t = Date.now();
            const userJson = await AsyncStorage.getItem('user');
            let localAdminId = '';

            if (userJson) {
                const userObj = JSON.parse(userJson);
                const email = userObj.email.toLowerCase();
                setAdminEmail(email);
                setAdminId(userObj.id);
                localAdminId = userObj.id;

                // 🔥 VERIFICA SE É VOCÊ OU A ADRI 🔥
                const isMasterUser = localAdminId === PAULO_ID || localAdminId === ADRI_ID;
                setIsMaster(isMasterUser);

                if (isFirstLoadRef.current) {
                    if (isMasterUser) {
                        // Se for Master, mantém a lógica de vocês
                        setCoachFilter(localAdminId === ADRI_ID ? 'ADRI' : 'PAULO');
                    } else {
                        // Se for um treinador convidado, CRAVA O FILTRO no ID dele.
                        setCoachFilter(localAdminId); 
                    }
                    isFirstLoadRef.current = false;
                }
            }

            if (!localAdminId) { setLoading(false); setRefreshing(false); return; }

            // 🔒 CACHE ISOLADO POR CONTA
            // Antes a chave era única ('@dashboard_cache') — se um coach logasse no
            // mesmo navegador depois do master, ele via o cache do master.
            const CACHE_KEY = `@dashboard_cache_${localAdminId}`;

            if (isManualRefresh) setRefreshing(true);
            else {
                const cachedData = await AsyncStorage.getItem(CACHE_KEY);
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

                    const currentCache = JSON.parse(await AsyncStorage.getItem(CACHE_KEY) || '{}');
                    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                        ...currentCache, cacheAtivos: processadosAtivos, cacheInativos: processadosInativos, cacheFeed: data.recentLogs || []
                    }));
                    if (data.exercises) await AsyncStorage.setItem('@global_exercises', JSON.stringify(data.exercises));
                }).catch(e => console.log(e)).finally(() => { setLoading(false); setRefreshing(false); });

            // Busca Checkins (🔒 adminId para o backend filtrar por coach)
            fetch(`https://fitos-final.onrender.com/api/checkin?adminId=${localAdminId}&t=${t}`)
                .then(res => res.json())
                .then(async dataCheckins => {
                    if (Array.isArray(dataCheckins)) {
                        setCheckins(dataCheckins);
                        const currentCache = JSON.parse(await AsyncStorage.getItem(CACHE_KEY) || '{}');
                        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ...currentCache, cacheCheckins: dataCheckins }));
                    }
                }).catch(e => console.log(e));

            // Busca Feedbacks de Dieta (🔒 agora envia adminId)
            fetch(`https://fitos-final.onrender.com/api/admin/diet-feedbacks?adminId=${localAdminId}&t=${t}`)
                .then(res => res.json())
                .then(async dataFeedbacks => {
                    if (Array.isArray(dataFeedbacks)) {
                        setDietFeedbacks(dataFeedbacks);
                        const currentCache = JSON.parse(await AsyncStorage.getItem(CACHE_KEY) || '{}');
                        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ...currentCache, cacheFeedbacks: dataFeedbacks }));
                    }
                }).catch(e => console.log(e));

            // Busca NPS (🔒 agora envia adminId)
            fetch(`https://fitos-final.onrender.com/api/admin/surveys?adminId=${localAdminId}&t=${t}`)
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

    // 🔥 DEIXOU DE USAR EMAIL: Agora a trava mestre garante a Adri pela ID
    const isAdriLogged = adminId === ADRI_ID; 

    const userCoachMap = useMemo(() => {
        const map = {};
        [...alunosAtivos, ...alunosInativos].forEach(u => {
            map[u.id] = u.coachId || (isAdriLogged ? adminId : PAULO_ID);
        });
        return map;
    }, [alunosAtivos, alunosInativos, isAdriLogged, adminId]);

    const getLogCoach = useCallback((item) => {
        let uId = item.userId || (item.user && item.user.id) || item.id;
        const cIdMapped = userCoachMap[uId] || item.coachId || (item.user && item.user.coachId);
        
        // 🔒 REGRA SAAS CORRIGIDA:
        // Antes: retornava adminId para QUALQUER item → todo item passava no filtro
        // (getLogCoach(item) === coachFilter era sempre verdadeiro para o coach).
        // Agora: só retorna o adminId se o item realmente PERTENCE ao coach;
        // itens de outros coaches retornam 'OUTRO' e são filtrados fora.
        if (!isMaster) {
            const belongsToCoach = cIdMapped === adminId
                || item.nutritionistId === adminId
                || (item.user && item.user.nutritionistId === adminId);
            return belongsToCoach ? adminId : 'OUTRO';
        }

        // Regra original para você e a Adri alternarem
        if (isAdriLogged) return (cIdMapped === adminId) ? 'ADRI' : 'PAULO';
        return (cIdMapped && cIdMapped !== PAULO_ID) ? 'ADRI' : 'PAULO';
    }, [userCoachMap, adminId, isAdriLogged, isMaster]);

    return {
        alunosAtivos, alunosInativos, feed, checkins, dietFeedbacks, surveys,
        loading, refreshing, adminEmail, adminId, coachFilter, setCoachFilter,
        isAdriLogged, isMaster, fetchData, handleMarkFeedbackRead, handleMarkSurveyRead, // 🔥 isMaster EXPORTADO AQUI
        handleDeleteFeedback, handleDeleteLog, getLogCoach
    };
}