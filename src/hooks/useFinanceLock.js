// src/hooks/useFinanceLock.js
//
// 🔥 HOOK CENTRAL DE BLOQUEIO FINANCEIRO + CLAIM DE PAGAMENTO ("Já paguei") 🔥
//
// Usado por: useHomeData.js, TrainingScreen.js, DietScreen.js
//
// Antes, cada tela tinha sua própria cópia da regra de bloqueio financeiro
// (lendo paymentDueDate do AsyncStorage local). Isso causava telas
// dessincronizadas: uma tela podia já saber de um pagamento reivindicado
// ("Já paguei") enquanto outra continuava bloqueada, porque cada uma lia
// uma fonte de dados diferente.
//
// Este hook busca SEMPRE os dados mais atuais direto do backend
// (api/user/home), que é a única rota hoje que devolve paymentDueDate,
// isFinanceActive e os campos de claim juntos. Assim todas as telas que
// usam este hook enxergam exatamente o mesmo estado financeiro.
import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PAYMENT_CLAIM_GRACE_DAYS = 2;

export function useFinanceLock() {
    const [financeLoading, setFinanceLoading] = useState(true);

    const [daysToPay, setDaysToPay] = useState(null);
    const [isFinanceLocked, setIsFinanceLocked] = useState(false);

    const [paymentClaimStatus, setPaymentClaimStatus] = useState(null); // null | "PENDING" | "REJECTED"
    const [isPaymentClaimActive, setIsPaymentClaimActive] = useState(false);
    const [paymentClaimExpired, setPaymentClaimExpired] = useState(false);
    const [paymentClaimDaysLeft, setPaymentClaimDaysLeft] = useState(null);
    const [canClaimPayment, setCanClaimPayment] = useState(false);
    const [isClaimingPayment, setIsClaimingPayment] = useState(false);

    const [financeUserId, setFinanceUserId] = useState(null);

    // ─── Calcula todos os estados financeiros a partir de um objeto user ──
    const computeFinanceState = useCallback((userLike) => {
        let financeDiffDays = null;
        let financeIsOverdue = false;

        if (userLike?.paymentDueDate && userLike?.isFinanceActive !== false) {
            const pDate = new Date(userLike.paymentDueDate);
            pDate.setHours(0, 0, 0, 0);
            const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
            financeDiffDays = Math.ceil((pDate.getTime() - todayD.getTime()) / (1000 * 3600 * 24));
            financeIsOverdue = financeDiffDays <= 0;
        }

        const claimStatus = userLike?.paymentClaimStatus || null;

        let claimActive = false;
        let claimExpired = false;
        let claimDaysLeft = null;

        if (claimStatus === 'PENDING' && userLike?.paymentClaimedAt) {
            const claimedAt = new Date(userLike.paymentClaimedAt);
            const now = new Date();
            const daysElapsed = (now.getTime() - claimedAt.getTime()) / (1000 * 3600 * 24);

            if (daysElapsed < PAYMENT_CLAIM_GRACE_DAYS) {
                claimActive = true;
                claimDaysLeft = Math.max(0, Math.ceil(PAYMENT_CLAIM_GRACE_DAYS - daysElapsed));
            } else {
                claimExpired = true;
            }
        }

        const sameCycleAsRejected = claimStatus === 'REJECTED'
            && userLike?.paymentClaimCycleDueDate
            && userLike?.paymentDueDate
            && new Date(userLike.paymentClaimCycleDueDate).getTime() === new Date(userLike.paymentDueDate).getTime();

        const canClaim = financeIsOverdue && !claimActive && !claimExpired && !sameCycleAsRejected;

        return {
            daysToPay: financeDiffDays,
            isFinanceLocked: financeIsOverdue && !claimActive,
            paymentClaimStatus: claimStatus,
            isPaymentClaimActive: claimActive,
            paymentClaimExpired: claimExpired,
            paymentClaimDaysLeft: claimDaysLeft,
            canClaimPayment: canClaim,
        };
    }, []);

    // ─── Aplica o resultado do computeFinanceState aos estados do hook ────
    const applyFinanceState = useCallback((state) => {
        setDaysToPay(state.daysToPay);
        setIsFinanceLocked(state.isFinanceLocked);
        setPaymentClaimStatus(state.paymentClaimStatus);
        setIsPaymentClaimActive(state.isPaymentClaimActive);
        setPaymentClaimExpired(state.paymentClaimExpired);
        setPaymentClaimDaysLeft(state.paymentClaimDaysLeft);
        setCanClaimPayment(state.canClaimPayment);
    }, []);

    // ─── Busca o estado financeiro mais atual direto do backend ───────────
    // Aceita um userId opcional; se não vier, tenta ler do AsyncStorage.
    const fetchFinanceStatus = useCallback(async (userIdParam) => {
        setFinanceLoading(true);
        try {
            let uid = userIdParam;
            if (!uid) {
                const stored = await AsyncStorage.getItem('user');
                if (stored) uid = JSON.parse(stored)?.id;
            }
            if (!uid) { setFinanceLoading(false); return null; }

            setFinanceUserId(uid);

            const res = await fetch(`https://fitos-final.onrender.com/api/user/home?userId=${uid}&t=${Date.now()}`);
            if (!res.ok) { setFinanceLoading(false); return null; }

            const data = await res.json();
            const userLike = data?.user || {};
            const state = computeFinanceState(userLike);
            applyFinanceState(state);
            return { ...state, rawUser: userLike };
        } catch (e) {
            console.log("Erro ao buscar status financeiro:", e);
            return null;
        } finally {
            setFinanceLoading(false);
        }
    }, [computeFinanceState, applyFinanceState]);

    // ─── Registrar claim de pagamento ("Já paguei") ────────────────────────
    const handleClaimPayment = useCallback(async () => {
        if (!financeUserId || isClaimingPayment) return false;
        setIsClaimingPayment(true);
        try {
            const res = await fetch('https://fitos-final.onrender.com/api/user/claim-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: financeUserId })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = data?.error || "Não foi possível registrar seu pagamento agora.";
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert("Atenção", msg);
                return false;
            }

            // Otimista: libera na hora, depois resincroniza com o servidor.
            setPaymentClaimStatus('PENDING');
            setIsPaymentClaimActive(true);
            setPaymentClaimExpired(false);
            setPaymentClaimDaysLeft(PAYMENT_CLAIM_GRACE_DAYS);
            setCanClaimPayment(false);
            setIsFinanceLocked(false);

            await fetchFinanceStatus(financeUserId);
            return true;
        } catch (e) {
            console.log("Erro ao registrar claim de pagamento:", e);
            if (Platform.OS === 'web') window.alert("Erro de conexão. Tente novamente.");
            else Alert.alert("Erro", "Erro de conexão. Tente novamente.");
            return false;
        } finally {
            setIsClaimingPayment(false);
        }
    }, [financeUserId, isClaimingPayment, fetchFinanceStatus]);

    // ─── Confirmação amigável antes de registrar o claim ───────────────────
    const confirmAndClaimPayment = useCallback(async () => {
        return new Promise((resolve) => {
            const msg = "Confirma que você JÁ EFETUOU o pagamento? Seu coach será avisado para conferir e seu acesso será liberado enquanto isso.";

            const run = async () => {
                const ok = await handleClaimPayment();
                if (ok) {
                    const successMsg = "Seu acesso já está liberado enquanto seu coach confere o pagamento.";
                    if (Platform.OS === 'web') window.alert(successMsg);
                    else Alert.alert("Registrado!", successMsg);
                }
                resolve(ok);
            };

            if (Platform.OS === 'web') {
                if (window.confirm(msg)) run(); else resolve(false);
            } else {
                Alert.alert("Confirmar Pagamento", msg, [
                    { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
                    { text: "Sim, já paguei", onPress: run }
                ]);
            }
        });
    }, [handleClaimPayment]);

    return {
        financeLoading,
        daysToPay,
        isFinanceLocked,
        paymentClaimStatus,
        isPaymentClaimActive,
        paymentClaimExpired,
        paymentClaimDaysLeft,
        canClaimPayment,
        isClaimingPayment,

        fetchFinanceStatus,
        handleClaimPayment,
        confirmAndClaimPayment,
        computeFinanceState, // exposto para quem já tem o user em mãos (ex: useHomeData)
        applyFinanceState,
        setFinanceUserId, // exposto para quem precisa sincronizar o userId sem passar por fetchFinanceStatus
    };
}