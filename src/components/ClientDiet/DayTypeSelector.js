// src/components/ClientDiet/DayTypeSelector.js
import React, { useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── CONFIG POR TIPO DE DIA ───────────────────────────────────────────────────
const DAY_CONFIG = {
    TREINO: {
        label:    'Treino de Força',
        shortLabel:'TREINO',
        icon:     'dumbbell',
        color:    '#32ADE6',
        desc:     'Musculação',
    },
    TREINO_CARDIO: {
        label:    'Treino + Cardio',
        shortLabel:'T + CARDIO',
        icon:     'run-fast',
        color:    '#FF9500',
        desc:     'Dupla sessão',
    },
    CARDIO: {
        label:    'Só Cardio',
        shortLabel:'CARDIO',
        icon:     'heart-pulse',
        color:    '#FF3B30',
        desc:     'Aeróbico',
    },
    DESCANSO: {
        label:    'Descanso',
        shortLabel:'DESCANSO',
        icon:     'sleep',
        color:    '#34C759',
        desc:     'Recuperação',
    },
};

// Calcula kcal total de um conjunto de refeições
function calcKcal(meals) {
    let total = 0;
    meals.forEach(meal => {
        const grouped = (meal.items ?? []).reduce((acc, item) => {
            const key = item.substitutionGroupId ?? item.groupId ?? item.id ?? '';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
        Object.values(grouped).forEach(group => {
            const item = group[0];
            if (!item) return;
            const amt   = parseFloat(item.amount) || 0;
            const kcal  = parseFloat(item.calories_per_100 ?? item.calories ?? item.kcal ?? 0);
            // Converte unidade para gramas (simplificado)
            const unit  = (item.unit ?? 'g').toLowerCase();
            const grams = unit === 'ml' ? amt : unit === 'g' ? amt : amt * 50; // fallback unid
            total += (kcal * grams) / 100;
        });
    });
    return Math.round(total);
}

export default function DayTypeSelector({ theme, allMeals, activeType, onChange }) {
    const scrollRef = useRef(null);

    // Tipos disponíveis na dieta (na ordem correta)
    const ORDER  = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'];
    const types  = ORDER.filter(t =>
        (allMeals ?? []).some(m => (m.dayType ?? 'TREINO') === t)
    );

    // Scroll automático para o card ativo
    useEffect(() => {
        const idx = types.indexOf(activeType);
        if (idx >= 0 && scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({ x: idx * 172, animated: true });
            }, 100);
        }
    }, [activeType]);

    if (types.length <= 1) return null; // Com 1 tipo não precisa seletor

    return (
        <View style={styles.wrapper}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={172}
                snapToAlignment="start"
            >
                {types.map(t => {
                    const cfg      = DAY_CONFIG[t] ?? { label: t, shortLabel: t, icon: 'calendar', color: theme.accent, desc: '' };
                    const isActive = activeType === t;
                    const meals    = (allMeals ?? []).filter(m => (m.dayType ?? 'TREINO') === t);
                    const kcal     = calcKcal(meals);
                    const numMeals = meals.length;

                    return (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.card,
                                {
                                    backgroundColor: isActive ? cfg.color + '18' : theme.surface,
                                    borderColor:     isActive ? cfg.color         : theme.border,
                                    borderWidth:     isActive ? 2                 : 1,
                                },
                            ]}
                            onPress={() => onChange(t)}
                            activeOpacity={0.8}
                        >
                            {/* Ícone */}
                            <View style={[styles.iconBox, { backgroundColor: cfg.color + '20' }]}>
                                <MaterialCommunityIcons
                                    name={cfg.icon}
                                    size={22}
                                    color={cfg.color}
                                />
                            </View>

                            {/* Textos */}
                            <Text style={[styles.cardLabel, { color: isActive ? cfg.color : theme.text }]}>
                                {cfg.shortLabel}
                            </Text>
                            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                                {cfg.desc}
                            </Text>

                            {/* Stats */}
                            <View style={styles.statsRow}>
                                <View style={styles.stat}>
                                    <MaterialCommunityIcons name="fire" size={10} color={cfg.color} />
                                    <Text style={[styles.statText, { color: theme.textSecondary }]}>
                                        {kcal > 0 ? `${kcal} kcal` : '— kcal'}
                                    </Text>
                                </View>
                                <View style={styles.stat}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={10} color={cfg.color} />
                                    <Text style={[styles.statText, { color: theme.textSecondary }]}>
                                        {numMeals} ref.
                                    </Text>
                                </View>
                            </View>

                            {/* Indicador de ativo */}
                            {isActive && (
                                <View style={[styles.activeDot, { backgroundColor: cfg.color }]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { marginBottom: 20 },
    scrollContent: { paddingHorizontal: 0, gap: 12, paddingRight: 16 },

    card: {
        width: 160,
        borderRadius: 20,
        padding: 16,
        position: 'relative',
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
    },
    cardLabel: {
        fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2,
    },
    cardDesc: {
        fontSize: 10, fontWeight: '700', marginBottom: 12,
    },
    statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    stat:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
    statText: { fontSize: 9, fontWeight: '800' },

    activeDot: {
        position: 'absolute', top: 12, right: 12,
        width: 8, height: 8, borderRadius: 4,
    },
});