// src/components/ClientDiet/DietHeader.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const DAYS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

function timeToMinutes(t) {
    if (!t || !t.includes(':')) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Encontra a próxima refeição do dia com base no horário atual.
 * Se todas já passaram, retorna a primeira do dia seguinte.
 */
function getNextMeal(meals) {
    if (!meals?.length) return null;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    // Ordena refeições pelo horário
    const sorted = [...meals]
        .filter(m => m.time)
        .sort((a, b) => (timeToMinutes(a.time) ?? 0) - (timeToMinutes(b.time) ?? 0));

    if (!sorted.length) return null;

    // Próxima refeição que ainda não passou
    const next = sorted.find(m => (timeToMinutes(m.time) ?? 0) > nowMin);
    if (next) return next;

    // Todas passaram — retorna a primeira (amanhã)
    return { ...sorted[0], isNextDay: true };
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function DietHeader({
    theme,
    user,
    visibleMeals,
    activeDayType,
    diet,
    onDownloadPdf,
}) {
    const greeting   = getGreeting();
    const firstName  = (user?.name ?? '').split(' ')[0] || 'Atleta';
    const dayOfWeek  = DAYS_PT[new Date().getDay()];

    const nextMeal = useMemo(() => getNextMeal(visibleMeals), [visibleMeals]);

    const DAY_LABELS = {
        TREINO:        'Dia de Treino de Força 💪',
        TREINO_CARDIO: 'Dia de Treino + Cardio 🔥',
        CARDIO:        'Dia de Cardio 🏃',
        DESCANSO:      'Dia de Descanso 😴',
    };

    const DAY_COLORS = {
        TREINO:        '#32ADE6',
        TREINO_CARDIO: '#FF9500',
        CARDIO:        '#FF3B30',
        DESCANSO:      '#34C759',
    };

    const dayColor = DAY_COLORS[activeDayType] ?? theme.accent;
    const dayLabel = DAY_LABELS[activeDayType] ?? activeDayType;

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>

            {/* Linha superior: saudação + PDF */}
            <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                        {greeting}, {firstName} 👋
                    </Text>
                    <Text style={[styles.dayOfWeek, { color: theme.text }]}>
                        {dayOfWeek}
                    </Text>
                </View>
                {diet?.pdfUrl && (
                    <TouchableOpacity
                        style={[styles.pdfBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                        onPress={() => Linking.openURL(diet.pdfUrl)}
                    >
                        <MaterialCommunityIcons name="file-download-outline" size={14} color={theme.text} />
                        <Text style={[styles.pdfText, { color: theme.text }]}>PDF</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Divisor */}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Tipo do dia + próxima refeição */}
            <View style={styles.bottomRow}>

                {/* Tipo do dia */}
                <View style={[styles.dayTypePill, { backgroundColor: dayColor + '15', borderColor: dayColor + '40' }]}>
                    <View style={[styles.dayTypeDot, { backgroundColor: dayColor }]} />
                    <Text style={[styles.dayTypeText, { color: dayColor }]}>{dayLabel}</Text>
                </View>

                {/* Próxima refeição */}
                {nextMeal && (
                    <View style={[styles.nextMealRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <MaterialCommunityIcons
                            name="clock-outline"
                            size={12}
                            color={theme.textSecondary}
                        />
                        <Text style={[styles.nextMealLabel, { color: theme.textSecondary }]}>
                            {nextMeal.isNextDay ? 'Amanhã, 1ª: ' : 'Próxima: '}
                        </Text>
                        <Text style={[styles.nextMealName, { color: theme.text }]}>
                            {nextMeal.name}
                        </Text>
                        <Text style={[styles.nextMealTime, { color: theme.accent }]}>
                            {nextMeal.time}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20, borderWidth: 1,
        padding: 16, marginBottom: 16,
    },
    topRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 14,
    },
    greeting: {
        fontSize: 13, fontWeight: '700',
    },
    dayOfWeek: {
        fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginTop: 2,
    },
    pdfBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 12, borderWidth: 1,
    },
    pdfText: { fontSize: 10, fontWeight: '900' },

    divider: { height: 1, marginBottom: 14 },

    bottomRow: { gap: 10 },

    dayTypePill: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1,
    },
    dayTypeDot:  { width: 6, height: 6, borderRadius: 3 },
    dayTypeText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },

    nextMealRow: {
        flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
        gap: 4, paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 14, borderWidth: 1,
    },
    nextMealLabel: { fontSize: 11, fontWeight: '700' },
    nextMealName:  { fontSize: 11, fontWeight: '900', flex: 1 },
    nextMealTime:  { fontSize: 11, fontWeight: '900' },
});