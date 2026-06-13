// src/components/ClientDiet/RoutineSelector.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DAY_CONFIG = {
    TREINO:        { label: 'TREINO',    icon: 'dumbbell',   color: '#32ADE6' },
    TREINO_CARDIO: { label: 'T+CARDIO',  icon: 'run-fast',   color: '#FF9500' },
    CARDIO:        { label: 'CARDIO',    icon: 'heart-pulse', color: '#FF3B30' },
    DESCANSO:      { label: 'DESCANSO',  icon: 'sleep',       color: '#34C759' },
};

export default function RoutineSelector({ theme, types, activeType, onChange }) {
    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {types.map(t => {
                const cfg      = DAY_CONFIG[t] ?? { label: t, icon: 'calendar', color: theme.accent };
                const isActive = activeType === t;
                return (
                    <TouchableOpacity
                        key={t}
                        style={[
                            styles.btn,
                            isActive && { backgroundColor: cfg.color + '20', borderColor: cfg.color, borderWidth: 1.5 },
                        ]}
                        onPress={() => onChange(t)}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons
                            name={cfg.icon}
                            size={15}
                            color={isActive ? cfg.color : theme.textSecondary}
                        />
                        <Text style={[
                            styles.label,
                            { color: isActive ? cfg.color : theme.textSecondary },
                        ]}>
                            {cfg.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    btn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 4,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    label: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
});