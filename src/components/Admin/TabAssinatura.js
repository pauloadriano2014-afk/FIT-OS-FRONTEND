// src/components/Admin/TabAssinatura.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabAssinatura({ theme, currentUserId }) {
    const [loading, setLoading] = useState(true);
    const [coachData, setCoachData] = useState(null);
    const [loadingCharge, setLoadingCharge] = useState(false);

    useEffect(() => {
        const fetchCoachData = async () => {
            try {
                const res = await fetch(`https://fitos-final.onrender.com/api/admin/user?userId=${currentUserId}&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setCoachData(data);
                }
            } catch (error) {
                console.log("Erro ao buscar dados da assinatura:", error);
            } finally {
                setLoading(false);
            }
        };
        if (currentUserId) fetchCoachData();
    }, [currentUserId]);

    // Tradução do plano
    const getPlanName = (plan) => {
        if (plan === 'PERSONAL') return 'Personal Trainer';
        if (plan === 'NUTRICIONISTA') return 'Nutricionista';
        if (plan === 'ELITE') return 'Elite (Completo)';
        return 'Padrão';
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'Não definida';
        const [y, m, d] = isoString.split('T')[0].split('-');
        return `${d}/${m}/${y}`;
    };

    const handleGenerateCharge = async () => {
        setLoadingCharge(true);
        try {
            let planToCharge = coachData?.coachBillingPlan;
            
            // Se o plano estiver vazio ou incompleto (ex: apenas "PERSONAL")
            if (!planToCharge || !planToCharge.includes('_')) {
                const basePlan = coachData?.coachPlan || 'PERSONAL';
                if (basePlan === 'PERSONAL') planToCharge = 'PERSONAL_MONTHLY';
                else if (basePlan === 'NUTRICIONISTA') planToCharge = 'NUTRI_MONTHLY';
                else if (basePlan === 'ELITE') planToCharge = 'ELITE_MONTHLY';
                else planToCharge = 'PERSONAL_MONTHLY';
            }

            // 🔥 A MÁGICA AQUI: Pega o valor do contrato personalizado, se existir e for maior que zero
            const customValuePayload = coachData?.contractValue > 0 ? coachData.contractValue : undefined;

            const res = await fetch('https://fitos-final.onrender.com/api/admin/coach-billing/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminId: currentUserId,
                    coachId: currentUserId,
                    billingPlan: planToCharge,
                    paymentMethod: 'UNDEFINED',
                    customValue: customValuePayload // Envia para a API o valor exato de R$ 5,00
                })
            });

            const data = await res.json();

            if (res.ok && data.invoiceUrl) {
                // Abre o link da fatura do Asaas no navegador do celular ou PC
                Linking.openURL(data.invoiceUrl).catch(() => {
                    if (Platform.OS === 'web') window.alert("Não foi possível abrir a página de pagamento.");
                    else Alert.alert("Erro", "Não foi possível abrir a página de pagamento.");
                });
            } else {
                const errorMsg = data.error || "Falha ao gerar cobrança.";
                if (Platform.OS === 'web') window.alert(`Erro: ${errorMsg}`);
                else Alert.alert("Erro", errorMsg);
            }
        } catch (error) {
            console.log("Erro na integração Asaas:", error);
            if (Platform.OS === 'web') window.alert("Erro de conexão ao gerar fatura.");
            else Alert.alert("Erro", "Erro de conexão ao gerar fatura.");
        } finally {
            setLoadingCharge(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', padding: 40 }]}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    const planName = getPlanName(coachData?.coachPlan);
    const contractValue = coachData?.contractValue || 0;
    const dueDate = formatDate(coachData?.paymentDueDate || coachData?.coachBillingEnd);

    return (
        <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.accent + '22' }]}>
                    <MaterialCommunityIcons name="shield-star" size={32} color={theme.accent} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Sua Assinatura ELITE</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Gerencie seu plano e pagamentos do sistema.</Text>
            </View>

            <View style={styles.cardsRow}>
                <View style={[styles.infoCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="trophy-outline" size={20} color={theme.textSecondary} />
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Plano Atual</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>{planName}</Text>
                </View>

                <View style={[styles.infoCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="cash" size={20} color={theme.textSecondary} />
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Mensalidade</Text>
                    <Text style={[styles.infoValue, { color: '#8BC34A' }]}>R$ {contractValue.toFixed(2).replace('.', ',')}</Text>
                </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.bg, borderColor: theme.border, width: '100%', marginBottom: 20 }]}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.textSecondary} />
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Próximo Vencimento</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{dueDate}</Text>
            </View>

            <TouchableOpacity 
                style={[styles.payButton, { backgroundColor: theme.accent }]}
                onPress={handleGenerateCharge}
                disabled={loadingCharge}
            >
                {loadingCharge ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="barcode-scan" size={20} color="#000" />
                        <Text style={styles.payButtonText}>PAGAR / RENOVAR ASSINATURA</Text>
                    </>
                )}
            </TouchableOpacity>

            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                O pagamento é processado de forma segura via Asaas. A liberação do seu acesso é imediata após a confirmação via PIX ou Cartão de Crédito.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 10,
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    cardsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    infoCard: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 5,
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '900',
        marginTop: 4,
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 12,
        marginBottom: 15,
    },
    payButtonText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    footerText: {
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 14,
        paddingHorizontal: 10,
    }
});