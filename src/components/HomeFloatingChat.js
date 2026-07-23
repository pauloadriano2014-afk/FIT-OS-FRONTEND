// src/components/HomeFloatingChat.js
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeFloatingChat({ theme, userPlan, onOpenChat, onOpenUpsell }) {
    const isPremium = userPlan === 'PREMIUM';

    return (
        <TouchableOpacity
            style={[styles.fabChat, { shadowColor: isPremium ? theme.accent : '#000' }]}
            onPress={() => isPremium ? onOpenChat() : onOpenUpsell('Chat Direto com o Coach')}
        >
            <LinearGradient
                colors={isPremium ? [theme.accent, theme.accent] : [theme.surface, theme.surface]}
                style={[styles.fabGradient, !isPremium && { borderWidth: 1, borderColor: theme.border }]}
            >
                {isPremium
                    ? <MaterialCommunityIcons name="robot" size={32} color={theme.isDark ? '#000' : '#FFF'} />
                    : <MaterialCommunityIcons name="lock"  size={28} color={theme.textSecondary} />}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fabChat:    { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, zIndex: 999, elevation: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    fabGradient:{ width: '100%', height: '100%', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
});