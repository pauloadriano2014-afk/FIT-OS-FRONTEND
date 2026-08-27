// src/hooks/useHomeData.js
import { useState, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinanceLock } from './useFinanceLock';
import { PAULO_ID, ADRI_ID, MASTER_IDS as MASTER_TEAM } from '../constants/masterIds';
import { authHeaders } from '../utils/authToken';

const QUICK_QUESTIONS = [
    "🤖 Como funciona a IA de Vídeo?",
    "🏋️‍♂️ Como marco as séries no treino?",
    "📈 Onde vejo minha Evolução?",
    "📸 Como fazer o Check-in?",
    "🚨 Estou com dor na articulação!",
    "🎬 O que é o PA FLIX?",
    "🍽️ Como troco de refeição na dieta?",
    "🩸 Como funciona o Deload Menstrual?",
    "🎨 Como mudo o tema do app?",
    "💳 Como faço o pagamento?",
    "📅 Onde vejo o vencimento do meu plano?",
    "🔑 Esqueci minha senha, e agora?",
];

const getAssistantName = (coachId) => MASTER_TEAM.includes(coachId) ? 'PA ELITE COACH' : 'ASSISTENTE ELITE';

export function useHomeData() {
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);

    const [userName, setUserName]         = useState('');
    const [userData, setUserData]         = useState(null);
    const [userPlan, setUserPlan]         = useState('PREMIUM');
    const [xp, setXp]                     = useState(0);

    // Ficha / planos temporários
    const [fichaDaysElapsed, setFichaDaysElapsed] = useState(0);
    const [daysToStart, setDaysToStart]           = useState(0);
    const [isFichaPlaceholder, setIsFichaPlaceholder] = useState(false);

    // Fotos iniciais
    const [hasSentInitialPhotos, setHasSentInitialPhotos] = useState(true);

    // Menstrual
    const [isMenstruating, setIsMenstruating]   = useState(false);
    const [togglingMenstrual, setTogglingMenstrual] = useState(false);

    // Check-in
    const [isCheckinPending, setIsCheckinPending]         = useState(false);
    const [isCheckinLate, setIsCheckinLate]               = useState(false);
    const [scheduledCheckInDate, setScheduledCheckInDate] = useState(null);
    const [isEliteAwaitingCoach, setIsEliteAwaitingCoach] = useState(false);
    const [disableCheckIn, setDisableCheckIn]             = useState(false);

    // 🔥 WHITE-LABEL (LOGO DO COACH) 🔥
    const [brandLogoUrl, setBrandLogoUrl] = useState(null);
    const [brandLogoSize, setBrandLogoSize] = useState(220);

    // 🔥 FINANCEIRO + CLAIM DE PAGAMENTO
    const finance = useFinanceLock();

    // Feedback do coach
    const [pendingFeedback, setPendingFeedback]   = useState(null);
    const [isMarkingAsRead, setIsMarkingAsRead]   = useState(false);

    // Aviso/Notice
    const [activeNotice, setActiveNotice] = useState(null);

    // Vídeo novo
    const [newVideoContent, setNewVideoContent] = useState(null);
    const [showVideoAlert, setShowVideoAlert]   = useState(false);

    // NPS
    const [isSurveyVisible, setIsSurveyVisible] = useState(false);

    // Chat AI
    const [messages, setMessages]   = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping]   = useState(false);
    const [assistantName, setAssistantName] = useState('PA ELITE COACH'); 
    const flatListRef               = useRef(null);

    // ─── Derivações de nível ───────────────────────────────────────────────
    const currentLevel        = Math.floor(xp / 1000) + 1;
    const nextLevelXP         = 1000;
    const currentLevelProgress = xp % 1000;

    const getLevelData = (level) => {
        if (level <= 5)  return { title: "Inimigo do Sofá 🛋️",    desc: "Saiu da inércia. O começo é o mais difícil!" };
        if (level <= 10) return { title: "Em Obras 🚧",             desc: "Está construindo o shape, tijolo por tijolo." };
        if (level <= 20) return { title: "Shape Carregando... ⏳",  desc: "Já tem resultado visível. O download tá vindo!" };
        if (level <= 40) return { title: "Projeto Mutante 🧬",       desc: "Ficou sério. Você já não é mais o mesmo." };
        return              { title: "Dono da Academia 🔑",          desc: "Você praticamente mora lá. Cadê sua chave?" };
    };
    const levelData = getLevelData(currentLevel);

    // ─── Coach helpers ─────────────────────────────────────────────────────
    const getCoachInfo = (user) => {
        const isAdri = user?.coachId === ADRI_ID;
        return {
            isAdri,
            coachNameLabel:      isAdri ? 'A ADRI' : 'O PAULO',
            coachWhatsappNumber: isAdri ? '554198465582' : '5541997991346',
        };
    };

    // ─── Detecção de gênero ────────────────────────────────────────────────
    const detectIsFemale = (user) => {
        const femaleKeywords = ['FEMININO', 'F', 'FEMALE', 'MULHER'];
        const g1 = String(user?.gender).toUpperCase().trim();
        const g2 = String(user?.anamneses?.[0]?.genero).toUpperCase().trim();
        const g3 = String(user?.anamneses?.[0]?.gender).toUpperCase().trim();
        const g4 = String(user?.anamneses?.[0]?.sexo).toUpperCase().trim();
        return femaleKeywords.includes(g1) || femaleKeywords.includes(g2)
            || femaleKeywords.includes(g3) || femaleKeywords.includes(g4);
    };

    // ─── Conteúdo do modal de foto inicial ────────────────────────────────
    const getPhotoModalContent = (plan) => {
        switch (plan) {
            case 'PREMIUM':      return { title: 'REGISTRE SEU PONTO DE PARTIDA 📸', desc: 'Para mapear sua evolução na Consultoria Elite, faça o seu primeiro registro. É rápido e 100% sigiloso.', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'FAZER DEPOIS', showEscape: true };
            case 'LOW_COST':     return { title: 'FOTOS DE EVOLUÇÃO PENDENTES 📸', desc: 'Para acompanharmos sua progressão no plano, precisamos do seu registro inicial. Sem ele, a evolução não existe!', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'IR PARA O TREINO', showEscape: false };
            case 'FICHA_8S':     return { title: 'FOTOS DO DIA 1 PENDENTES ⚠️', desc: 'Suas fotos de ponto de partida são essenciais para a avaliação de encerramento do Projeto. O envio é obrigatório para começar!', btnText: 'ENVIAR FOTOS DO DIA 1', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
            case 'CHALLENGE_21': return { title: 'FOTOS DO DIA 1 — OBRIGATÓRIAS ⚠️', desc: 'O Desafio de 21 Dias depende das fotos iniciais para medir o seu resultado final. Sem o "antes", não existe "depois".', btnText: 'ENVIAR FOTOS E COMEÇAR', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
            default:             return { title: 'FOTOS PENDENTES 📸', desc: 'Envie suas fotos iniciais para mapearmos sua evolução.', btnText: 'ENVIAR FOTOS', escapeText: 'TREINAR MESMO ASSIM', showEscape: true };
        }
    };

    // ─── LOAD PRINCIPAL ────────────────────────────────────────────────────
    const loadHomeData = useCallback(async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');

            if (!storedUser) {
                setLoading(false);
                return;
            }

            const user = JSON.parse(storedUser);
            setUserData(user);

            // Só ativa tela de load inteira se não houver dados pre-carregados
            if (!user || Object.keys(user).length === 0) {
                setLoading(true);
            }

            const dbPlan     = user.plan || 'PREMIUM';
            const resolvedPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(dbPlan) ? dbPlan : 'PREMIUM';
            setUserPlan(resolvedPlan);

            const firstName = user.name?.split(' ')[0] || 'Atleta';
            setUserName(firstName);

            const resolvedAssistantName = getAssistantName(user.coachId);
            setAssistantName(resolvedAssistantName);

            if (messages.length === 0) {
                setMessages([{
                    id: 1,
                    text: `Fala, ${firstName}! 👊 Sou o ${resolvedAssistantName}. Use os botões abaixo se tiver alguma dúvida sobre o app ou treino.`,
                    sender: 'ai'
                }]);
            }

            if (user.currentXP) setXp(user.currentXP);

            try {
                const t = Date.now(); 
                
                // 🔥 FALLBACK DE COACH: Se o aluno não tiver Coach amarrado, puxa o do Paulo!
                let fetchCoachId = user.coachId || user.nutritionistId || PAULO_ID;

                // CHEAT CODE DE TESTE: Puxa a logo de quem está usando o botão "Visualizar App"
                const originalAdminStr = await AsyncStorage.getItem('original_admin_user');
                let cachedAdminLogo = null;
                let cachedAdminLogoSize = 220; // Cache do tamanho
                if (originalAdminStr) {
                    const adminObj = JSON.parse(originalAdminStr);
                    fetchCoachId = adminObj.id; // Força buscar a logo de quem tá testando
                    if (adminObj.brandLogoUrl) cachedAdminLogo = adminObj.brandLogoUrl;
                    if (adminObj.brandLogoSize) cachedAdminLogoSize = Number(adminObj.brandLogoSize);
                }

                // 🔥 CACHE LOCAL DA LOGO DO COACH: evita bater na API a cada home carregada
                // (a logo quase nunca muda) — só busca de novo se o cache expirar
                const LOGO_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
                let skipCoachFetch = !!cachedAdminLogo;
                if (!skipCoachFetch) {
                    try {
                        const cachedLogoStr = await AsyncStorage.getItem(`@coach_logo_${fetchCoachId}`);
                        if (cachedLogoStr) {
                            const cachedLogo = JSON.parse(cachedLogoStr);
                            if (cachedLogo && (Date.now() - cachedLogo.ts) < LOGO_CACHE_TTL_MS) {
                                setBrandLogoUrl(cachedLogo.brandLogoUrl || null);
                                setBrandLogoSize(cachedLogo.brandLogoSize || 220);
                                skipCoachFetch = true;
                            }
                        }
                    } catch (e) { /* cache falhou, segue e busca normal */ }
                }

                const authHdrs = await authHeaders();
                const [homeRes, checkinRes, noticeRes, resUserDirect, resContents, resCoach] = await Promise.all([
                    fetch(`https://fitos-final.onrender.com/api/user/home?userId=${user.id}&t=${t}`, { headers: { ...authHdrs } }),
                    fetch(`https://fitos-final.onrender.com/api/checkin?userId=${user.id}&t=${t}`, { headers: { ...authHdrs } }),
                    fetch(`https://fitos-final.onrender.com/api/notices?userId=${user.id}&t=${t}`, { headers: { ...authHdrs } }),
                    fetch(`https://fitos-final.onrender.com/api/admin/user/${user.id}?t=${t}&omit=diets,anamneses`, { headers: { ...authHdrs } }),
                    fetch(`https://fitos-final.onrender.com/api/contents?adminId=${fetchCoachId}&global=true&t=${t}`, { headers: { ...authHdrs } }),
                    skipCoachFetch
                        ? Promise.resolve(null)
                        : fetch(`https://fitos-final.onrender.com/api/admin/user/${fetchCoachId}?t=${t}&omit=diets,workouts,anamneses`, { headers: { ...authHdrs } })
                ]);

                let fetchedUser     = { ...user };
                let hasPhotosInDb   = false;
                let unreadFeedback  = null;

                // 🔥 A SUA LÓGICA DE MARCA (WHITE-LABEL) ABSOLUTA RESTAURADA 100% 🔥
                if (cachedAdminLogo) {
                    setBrandLogoUrl(cachedAdminLogo);
                    setBrandLogoSize(cachedAdminLogoSize);
                } else if (skipCoachFetch) {
                    // já setado a partir do cache local (@coach_logo_*) acima, nada a fazer
                } else if (resCoach && resCoach.ok) {
                    const coachData = await resCoach.json();
                    let finalLogoUrl  = null;
                    let finalLogoSize = 220;
                    if (coachData && coachData.brandLogoUrl) {
                        finalLogoUrl  = coachData.brandLogoUrl;
                        finalLogoSize = coachData.brandLogoSize ? Number(coachData.brandLogoSize) : 220;
                    }
                    setBrandLogoUrl(finalLogoUrl);
                    setBrandLogoSize(finalLogoSize);
                    try {
                        await AsyncStorage.setItem(`@coach_logo_${fetchCoachId}`, JSON.stringify({
                            brandLogoUrl:  finalLogoUrl,
                            brandLogoSize: finalLogoSize,
                            ts: Date.now()
                        }));
                    } catch (e) { /* cache falhou, sem problema */ }
                }

                // ── Conteúdos / vídeos novos ──────────────────────────────
                if (resContents.ok) {
                    const dataContents = await resContents.json();
                    if (Array.isArray(dataContents) && dataContents.length > 0) {
                        const now = new Date();
                        const recentContents = dataContents
                            .filter(c => {
                                if (c.isVIP) return false;
                                const diffDays = Math.ceil(Math.abs(now - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
                                return diffDays <= 7;
                            })
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                        for (let content of recentContents) {
                            const hasRead = await AsyncStorage.getItem(`video_lido_${user.id}_${content.id}`);
                            if (!hasRead) {
                                setNewVideoContent(content);
                                setShowVideoAlert(true);
                                break;
                            }
                        }
                    }
                }

                // ── Check-ins / feedback ──────────────────────────────────
                if (checkinRes.ok) {
                    const checkinsData = await checkinRes.json();
                    if (Array.isArray(checkinsData) && checkinsData.length > 0) {
                        hasPhotosInDb = true;
                        const evaluated = checkinsData.filter(c => c.coachFeedback);
                        for (let c of evaluated) {
                            const isRead = await AsyncStorage.getItem(`read_feedback_${c.id}`);
                            if (!isRead) { unreadFeedback = c; break; }
                        }
                        if (unreadFeedback) {
                            setPendingFeedback(unreadFeedback);
                        } else {
                            setPendingFeedback(null);
                        }
                    }
                }

                // ── Home principal ────────────────────────────────────────
                if (homeRes.ok) {
                    const homeData = await homeRes.json();
                    let directUserData = {};
                    if (resUserDirect.ok) directUserData = await resUserDirect.json();

                    if (homeData.user) {
                        const serverXP = homeData.user.currentXP || 0;
                        setXp(serverXP);

                        // 🔥 EXTRATOR BLINDADO DA ANAMNESE PENDENTE 🔥
                        let isAnamnesePendente = !!user.anamnesePendente;

                        // Vasculha todas as camadas possíveis da resposta do servidor
                        const camadas = [directUserData, directUserData?.user, homeData, homeData?.user];
                        
                        for (let camada of camadas) {
                            if (camada && typeof camada.anamnesePendente !== 'undefined') {
                                isAnamnesePendente = !!camada.anamnesePendente;
                                break;
                            }
                        }

                        fetchedUser = { 
                            ...user, 
                            ...(homeData?.user || {}), 
                            ...directUserData,
                            currentXP: serverXP, 
                            anamnesePendente: isAnamnesePendente 
                        };

                        const financeState = finance.computeFinanceState(homeData.user);
                        finance.applyFinanceState(financeState);
                        finance.setFinanceUserId(user.id);

                        // Menstrual
                        const isAtiva = directUserData.isMenstruating !== undefined
                            ? directUserData.isMenstruating
                            : homeData.user?.isMenstruating;
                        setIsMenstruating(!!isAtiva);

                        // Plano
                        const serverPlan = fetchedUser.plan || 'PREMIUM';
                        const finalPlan  = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(serverPlan) ? serverPlan : 'PREMIUM';
                        setUserPlan(finalPlan);
                        setDisableCheckIn(!!fetchedUser.disableCheckIn);

                        // NPS
                        const snoozedDate = await AsyncStorage.getItem(`@nps_snooze_${fetchedUser.id}`);
                        const todayStr    = new Date().toISOString().split('T')[0];
                        if (fetchedUser.npsRequested && !unreadFeedback && snoozedDate !== todayStr) {
                            setTimeout(() => setIsSurveyVisible(true), 1000);
                        }

                        // Ficha / planos temporários
                        if (['FICHA_8S', 'CHALLENGE_21', 'LOW_COST'].includes(finalPlan)) {
                            let startD = new Date(fetchedUser.createdAt || new Date());
                            const activeWorkouts = (fetchedUser.workouts || [])
                                .filter(w => !w.archived)
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                            if (activeWorkouts.length > 0) {
                                const currentWorkout = activeWorkouts[0];
                                startD = new Date(currentWorkout.startDate);
                                setIsFichaPlaceholder(
                                    currentWorkout.name.includes("CONSTRUÇÃO") ||
                                    !currentWorkout.routine ||
                                    currentWorkout.routine.length === 0
                                );
                            } else {
                                setIsFichaPlaceholder(true);
                            }

                            startD.setHours(0, 0, 0, 0);
                            const todayD   = new Date(); todayD.setHours(0, 0, 0, 0);
                            const diffTime = todayD.getTime() - startD.getTime();
                            const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

                            if (diffDays < 0) {
                                setDaysToStart(Math.abs(diffDays));
                                setFichaDaysElapsed(0);
                            } else {
                                setDaysToStart(0);
                                setFichaDaysElapsed(diffDays);
                            }
                        }

                        // Nome do assistente caso o coachId real seja diferente
                        setAssistantName(getAssistantName(fetchedUser.coachId));

                        // 🔥 LIPOASPIRAÇÃO ANTI-EXPLOSÃO DE MEMÓRIA (Salvando a Vida) 🔥
                        const { diets, workouts, anamneses, ...leanFetchedUser } = fetchedUser;
                        await AsyncStorage.setItem('user', JSON.stringify(leanFetchedUser));
                        setUserData(leanFetchedUser);
                    }
                }

                // ── Notices ───────────────────────────────────────────────
                if (noticeRes.ok) {
                    const notices = await noticeRes.json();
                    if (Array.isArray(notices) && notices.length > 0) {
                        const latestNotice = notices[0];
                        const hasRead = await AsyncStorage.getItem(`read_notice_${latestNotice.id}`);
                        if (!hasRead) setActiveNotice(latestNotice);
                    }
                }

                // ── Estado de check-in ────────────────────────────────────
                setHasSentInitialPhotos(hasPhotosInDb);

                let checkinPending = false;
                let checkinLate    = false;
                let futureDateStr  = null;
                let eliteAwaiting  = false;

                if (!fetchedUser.disableCheckIn && !unreadFeedback) {
                    const today = new Date(); today.setHours(0, 0, 0, 0);

                    if (!hasPhotosInDb) {
                        checkinPending = true;
                    } else if (fetchedUser.nextCheckInDate) {
                        const targetDate = new Date(fetchedUser.nextCheckInDate);
                        targetDate.setHours(0, 0, 0, 0);

                        if (today.getTime() >= targetDate.getTime()) {
                            checkinPending = true;
                            const daysPast = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 3600 * 24));
                            if (daysPast >= 3) checkinLate = true;
                        } else {
                            const dd   = String(targetDate.getDate()).padStart(2, '0');
                            const mm   = String(targetDate.getMonth() + 1).padStart(2, '0');
                            const yyyy = targetDate.getFullYear();
                            futureDateStr = `${dd}/${mm}/${yyyy}`;
                        }
                    } else {
                        const resolvedPlanFinal = fetchedUser.plan || 'PREMIUM';
                        if (['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(resolvedPlanFinal) === false) {
                            eliteAwaiting = true;
                        }
                    }
                }

                setIsCheckinPending(checkinPending);
                setIsCheckinLate(checkinLate);
                setScheduledCheckInDate(futureDateStr);
                setIsEliteAwaitingCoach(eliteAwaiting);

            } catch (err) {
                console.log("Erro ao carregar dados críticos:", err);
            }
        } catch (e) {
            console.log("Erro geral loadHome:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [messages.length, finance]);

    // ─── Toggle menstrual ──────────────────────────────────────────────────
    const toggleMenstrualCycle = async () => {
        if (!userData?.id || togglingMenstrual) return;
        setTogglingMenstrual(true);

        const newValue  = !isMenstruating;
        
        // 1. Atualiza a UI imediatamente (Otimista e Offline-First)
        setIsMenstruating(newValue);
        const cachedUser = {
            ...userData,
            isMenstruating: newValue,
            menstruationStartDate: newValue ? new Date().toISOString() : null
        };
        await AsyncStorage.setItem('user', JSON.stringify(cachedUser));
        setUserData(cachedUser);

        // 2. Tira o Loading na mesma hora para não travar a tela
        setTogglingMenstrual(false);

        if (newValue) {
            const title = "Sinalização Ativa 🩸";
            const msg   = "Seu Coach foi notificado. Pegue leve, beba água e se cuide nesses dias!";
            if (Platform.OS === 'web') window.setTimeout(() => window.alert(title + "\n\n" + msg), 50);
            else Alert.alert(title, msg);
        }

        // 3. Manda para o servidor em Background (Fire and Forget)
        (async () => {
            try {
                let res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${userData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                    body: JSON.stringify({
                        isMenstruating: newValue,
                        menstruationStartDate: newValue ? new Date().toISOString() : null
                    })
                });

                if (!res.ok) {
                    res = await fetch('https://fitos-final.onrender.com/api/admin/user', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                        body: JSON.stringify({
                            id: userData.id,
                            isMenstruating: newValue,
                            menstruationStartDate: newValue ? new Date().toISOString() : null
                        })
                    });
                }

                if (res.ok) {
                    try {
                        const fetchCoachId = userData.coachId || '';
                        if (fetchCoachId) {
                            const adminRes = await fetch(`https://fitos-final.onrender.com/api/admin/user/${fetchCoachId}?omit=diets,workouts,anamneses`, {
                                headers: { ...(await authHeaders()) },
                            });
                            if (adminRes.ok) {
                                const adminData = await adminRes.json();
                                if (adminData.pushToken) {
                                    await fetch('https://exp.host/--/api/v2/push/send', {
                                        method: 'POST',
                                        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            to:    adminData.pushToken,
                                            sound: 'default',
                                            title: newValue ? '🩸 Alerta Menstrual!' : '✅ Fim do Protocolo Menstrual',
                                            body:  newValue
                                                ? `A aluna ${userData.name} sinalizou o protocolo. Reajuste ou ative o Deload se necessário.`
                                                : `A aluna ${userData.name} encerrou o período.`,
                                        }),
                                    });
                                }
                            }
                        }
                    } catch (e) { console.log("Erro na notificação Push:", e); }
                }
            } catch (e) {
                console.log("Sinalização Menstrual salva localmente. Sincronizará com o banco depois.");
            }
        })();
    };

    // ─── Marcar feedback como lido ────────────────────────────────────────
    const markFeedbackAsRead = async (onDone) => {
        if (!pendingFeedback) return;
        setIsMarkingAsRead(true);
        try {
            await AsyncStorage.setItem(`read_feedback_${pendingFeedback.id}`, 'true');
            setPendingFeedback(null);
            if (onDone) onDone();
            loadHomeData();
        } catch (error) {
            console.error("Erro ao salvar leitura:", error);
            if (onDone) onDone();
        } finally {
            setIsMarkingAsRead(false);
        }
    };

    // ─── Marcar notice como lido ──────────────────────────────────────────
    const handleReadNotice = async (onDone) => {
        if (activeNotice) {
            try { await AsyncStorage.setItem(`read_notice_${activeNotice.id}`, 'true'); } catch (e) {}
        }
        if (onDone) onDone();
    };

    // ─── Dispensar alerta de vídeo ────────────────────────────────────────
    const handleDismissVideoAlert = async () => {
        if (newVideoContent && userData?.id) {
            try {
                await AsyncStorage.setItem(`video_lido_${userData.id}_${newVideoContent.id}`, 'true');
                setShowVideoAlert(false);
            } catch (e) { console.log("Erro ao esconder banner de vídeo", e); }
        }
    };

    // ─── Enviar mensagem ao chat AI ───────────────────────────────────────
    const handleSendChat = async (quickMessage = null) => {
        const textToSend = typeof quickMessage === 'string' ? quickMessage : chatInput;
        if (!textToSend.trim()) return;

        const userMsg = { id: Date.now(), text: textToSend, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsTyping(true);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

        try {
            const gender = userData?.anamneses?.[0]?.genero || userData?.gender || 'Não informado';
            const goal   = userData?.anamneses?.[0]?.objetivo || userData?.goal || 'Melhorar o shape';

            const res = await fetch('https://fitos-final.onrender.com/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({
                    message:    userMsg.text,
                    userId:     userData.id,
                    userName,
                    userGender: gender,
                    userGoal:   goal,
                    userLevel:  levelData.title,
                    userPlan,                          
                    coachId:    userData?.coachId || '' 
                })
            });
            const data = await res.json();

            if (data.reply) {
                if (data.assistantName) setAssistantName(data.assistantName); 
                setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply, sender: 'ai' }]);
            } else {
                throw new Error("Sem resposta");
            }
        } catch {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Falha na comunicação com a base. Você pode estar sem internet.", sender: 'ai' }]);
        } finally {
            setIsTyping(false);
            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        }
    };

    return {
        loading, setLoading,
        refreshing, setRefreshing,
        userName, userData, userPlan,
        xp, currentLevel, nextLevelXP, currentLevelProgress, levelData,
        fichaDaysElapsed, daysToStart, isFichaPlaceholder,
        hasSentInitialPhotos,
        isMenstruating, togglingMenstrual, toggleMenstrualCycle,
        isCheckinPending, isCheckinLate, scheduledCheckInDate,
        isEliteAwaitingCoach, disableCheckIn,

        brandLogoUrl,
        brandLogoSize, 

        daysToPay: finance.daysToPay,
        isFinanceLocked: finance.isFinanceLocked,
        paymentClaimStatus: finance.paymentClaimStatus,
        isPaymentClaimActive: finance.isPaymentClaimActive,
        paymentClaimExpired: finance.paymentClaimExpired,
        paymentClaimDaysLeft: finance.paymentClaimDaysLeft,
        canClaimPayment: finance.canClaimPayment,
        isClaimingPayment: finance.isClaimingPayment,
        handleClaimPayment: finance.confirmAndClaimPayment,

        pendingFeedback, isMarkingAsRead, markFeedbackAsRead,
        activeNotice, handleReadNotice,
        newVideoContent, showVideoAlert, handleDismissVideoAlert,
        isSurveyVisible, setIsSurveyVisible,
        messages, chatInput, setChatInput, isTyping, flatListRef, handleSendChat,
        assistantName, 
        getCoachInfo, detectIsFemale, getPhotoModalContent,
        QUICK_QUESTIONS,
        loadHomeData,
    };
}