// src/components/HomeMainAction.js
import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Botão principal de ação (INICIAR TREINO / bloqueios variados)
 * e botão secundário de Sugestão Alimentar (quando aplicável).
 */
export default function HomeMainAction({
    theme,
    navigation,

    // Estado de bloqueio
    isBlockedTotal,
    isFinanceLocked,
    isFichaExpired,
    isWaitingStart,
    needsInitialPhoto,
    daysToStart,

    // Feedback pendente
    pendingFeedback,
    pulseAnim,
    onOpenFeedback,

    // Ações
    onOpenFinanceModal,
    onOpenFichaExpiredModal,
    onOpenInitialPhotos,

    // Dieta
    userPlan,
    userData,
    onOpenDiet,
}) {
    const actionColor = isBlockedTotal
        ? (isFinanceLocked ? '#FF3B30' : theme.text)
        : (theme.isDark ? '#000' : '#FFF');

    const actionBg = isBlockedTotal ? theme.surface : theme.accent;

    const actionLabel = isFinanceLocked   ? 'ASSINATURA VENCIDA'
        : isFichaExpired  ? 'CICLO ENCERRADO'
        : isWaitingStart  ? 'STATUS ATUAL'
        : needsInitialPhoto ? 'FOTOS PENDENTES'
        : 'SEU OBJETIVO DE HOJE';

    const actionTitle = isFinanceLocked   ? 'ACESSO BLOQUEADO'
        : isFichaExpired  ? 'PRÓXIMOS PASSOS'
        : isWaitingStart  ? 'AGUARDANDO DATA'
        : needsInitialPhoto ? 'ENVIO OBRIGATÓRIO'
        : 'INICIAR TREINO';

    const actionIcon = isFinanceLocked   ? 'lock'
        : isWaitingStart  ? 'clock-outline'
        : isFichaExpired  ? 'whatsapp'
        : needsInitialPhoto ? 'camera-timer'
        : 'dumbbell';

    const handlePress = () => {
        if (isFinanceLocked)   return onOpenFinanceModal();
        if (isFichaExpired)    return onOpenFichaExpiredModal();
        if (isWaitingStart)    return Alert.alert("Aguarde", `Seu treino será liberado em ${daysToStart} dias.`);
        if (needsInitialPhoto) return onOpenInitialPhotos();
        navigation.navigate('Treinos');
    };

    const showDietBtn = userPlan === 'CHALLENGE_21' || (userData?.dietGoal && userData.dietGoal !== 'NONE');

    return (
        <>
            {/* ── Botão principal ─────────────────────────────────────────── */}
            {pendingFeedback ? (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity
                        style={[styles.mainBtn, { backgroundColor: theme.accent, shadowColor: theme.accent, borderWidth: 0 }]}
                        onPress={onOpenFeedback}
                        activeOpacity={0.9}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: '#000' }]}>O COACH ANALISOU SUAS FOTOS</Text>
                            <Text style={[styles.title, { color: '#000', fontSize: 20 }]}>VER RELATÓRIO TÉCNICO</Text>
                        </View>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
                            <MaterialCommunityIcons name="clipboard-text-search" size={28} color="#000" />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.mainBtn,
                        {
                            backgroundColor: actionBg,
                            shadowColor:     isBlockedTotal ? '#000' : theme.accent,
                            borderWidth:     isBlockedTotal ? 1 : 0,
                            borderColor:     isBlockedTotal ? (isFinanceLocked ? '#FF3B30' : theme.border) : 'transparent',
                        }
                    ]}
                    onPress={handlePress}
                    activeOpacity={0.9}
                >
                    <View>
                        <Text style={[styles.label, { color: isBlockedTotal ? theme.textSecondary : actionColor }]}>
                            {actionLabel}
                        </Text>
                        <Text style={[styles.title, { color: actionColor }]}>
                            {actionTitle}
                        </Text>
                    </View>
                    <View style={[styles.iconCircle, isBlockedTotal && { backgroundColor: isFinanceLocked ? '#FF3B3015' : theme.bg }]}>
                        <MaterialCommunityIcons
                            name={actionIcon}
                            size={28}
                            color={isBlockedTotal ? (isFinanceLocked ? '#FF3B30' : theme.accent) : actionColor}
                        />
                    </View>
                </TouchableOpacity>
            )}

            {/* ── Botão de dieta ──────────────────────────────────────────── */}
            {showDietBtn && (
                <TouchableOpacity
                    style={[styles.mainBtn, {
                        backgroundColor: theme.surface, borderColor: theme.border,
                        borderWidth: 1, padding: 20, marginBottom: 15, elevation: 0,
                    }]}
                    onPress={onOpenDiet}
                    activeOpacity={0.9}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: theme.accent }]}>ESTRATÉGIA DO COACH</Text>
                        <Text style={[styles.title, { color: theme.text, fontSize: 18 }]}>SUGESTÃO ALIMENTAR 🥗</Text>
                    </View>
                    <View style={[styles.iconCircle, { backgroundColor: theme.accent + '22' }]}>
                        <MaterialCommunityIcons name="food-apple" size={28} color={theme.accent} />
                    </View>
                </TouchableOpacity>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    mainBtn: {
        padding: 25, borderRadius: 28, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 25,
        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
    },
    label: { fontSize: 11, fontWeight: '900', opacity: 0.8, marginBottom: 4, letterSpacing: 0.5 },
    title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    iconCircle: {
        width: 54, height: 54, backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 27, justifyContent: 'center', alignItems: 'center',
    },
});