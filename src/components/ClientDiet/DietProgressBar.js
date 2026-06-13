// src/components/ClientDiet/DietProgressBar.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DietProgressBar({ theme, meals, checkedMeals }) {
    const total   = meals.length;
    const checked = meals.filter(m => !!checkedMeals[m.id]).length;
    const pct     = total > 0 ? (checked / total) * 100 : 0;

    const { label, color } = useMemo(() => {
        if (pct === 0)   return { label: 'Bora começar! 💪',           color: theme.textSecondary };
        if (pct < 50)    return { label: 'No caminho certo!',           color: '#FF9500'           };
        if (pct < 100)   return { label: 'Reta final, não para agora!', color: '#32ADE6'           };
        return           { label: 'Dia fechado! 🔥 Missão cumprida.',   color: theme.accent        };
    }, [pct, theme]);

    if (total === 0) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.topRow}>
                <View style={styles.iconLabel}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={color} />
                    <Text style={[styles.label, { color }]}>{label}</Text>
                </View>
                <Text style={[styles.counter, { color: theme.text }]}>
                    <Text style={{ color }}>{checked}</Text>/{total} refeições
                </Text>
            </View>

            {/* Barra */}
            <View style={[styles.trackBg, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[styles.trackFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>

            {/* Bolinhas por refeição */}
            <View style={styles.dotsRow}>
                {meals.map(m => {
                    const done = !!checkedMeals[m.id];
                    return (
                        <View
                            key={m.id}
                            style={[
                                styles.dot,
                                { backgroundColor: done ? color : (theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)') },
                            ]}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 14,
        marginBottom: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
    },
    counter: {
        fontSize: 11,
        fontWeight: '900',
    },
    trackBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    trackFill: {
        height: '100%',
        borderRadius: 4,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});