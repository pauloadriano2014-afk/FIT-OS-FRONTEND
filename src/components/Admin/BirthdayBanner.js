// src/components/Admin/BirthdayBanner.js
// Banner de aniversariantes dos próximos 7 dias no topo do AdminDashboard

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Platform, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function dayLabel(daysUntil) {
    if (daysUntil === 0) return '🎂 HOJE!';
    if (daysUntil === 1) return 'Amanhã';
    return `Em ${daysUntil} dias`;
}

function BirthdayCard({ item, theme }) {
    const isToday = item.daysUntil === 0;
    const accentColor = isToday ? '#FF9500' : theme.accent;

    const handleWhatsApp = () => {
        let phone = item.phone || '';
        phone = phone.replace(/\D/g, '');
        if (!phone || phone.length < 10) {
            const msg = 'Aluno sem número cadastrado.';
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Ops', msg);
            return;
        }
        if (!phone.startsWith('55')) phone = `55${phone}`;
        const nome = item.name?.split(' ')[0] || 'Aluno';
        const msg  = `Feliz aniversário, ${nome}! 🎂🎉\n\nQue este novo ciclo seja cheio de conquistas, saúde e muito resultado!\n\nConte comigo em cada etapa! 💪`;
        Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
    };

    return (
        <View style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: accentColor },
            isToday && { borderWidth: 2 },
        ]}>
            {/* Avatar */}
            {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, { backgroundColor: accentColor + '22', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: accentColor }}>
                        {item.name?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                </View>
            )}

            {/* Info */}
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <MaterialCommunityIcons name="cake-variant" size={11} color={accentColor} />
                    <Text style={[styles.date, { color: accentColor }]}>
                        {item.day} de {MONTH_NAMES[(item.month ?? 1) - 1]} · {dayLabel(item.daysUntil)}
                    </Text>
                </View>
            </View>

            {/* Botão WhatsApp */}
            {item.phone ? (
                <TouchableOpacity onPress={handleWhatsApp} style={styles.zapBtn}>
                    <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

export default function BirthdayBanner({ birthdays, theme, onDismiss }) {
    if (!birthdays || birthdays.length === 0) return null;

    const hasToday = birthdays.some(b => b.daysUntil === 0);

    return (
        <View style={[styles.banner, { backgroundColor: hasToday ? '#FF950010' : theme.surface + 'CC', borderColor: hasToday ? '#FF9500' : theme.border }]}>
            {/* Cabeçalho */}
            <View style={styles.bannerHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>🎂</Text>
                    <Text style={[styles.bannerTitle, { color: theme.text }]}>
                        {hasToday ? 'ANIVERSÁRIO HOJE!' : 'ANIVERSÁRIOS PRÓXIMOS'}
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: hasToday ? '#FF9500' : theme.accent }]}>
                        <Text style={styles.countText}>{birthdays.length}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={onDismiss} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Cards dos aniversariantes */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 4 }}
            >
                {birthdays.map(b => (
                    <BirthdayCard key={b.id} item={b} theme={theme} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    banner:       { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16, gap: 12 },
    bannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bannerTitle:  { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    countBadge:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
    countText:    { color: '#000', fontSize: 10, fontWeight: '900' },

    card:    { width: 160, borderRadius: 12, borderWidth: 1, padding: 12, gap: 0 },
    avatar:  { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
    name:    { fontSize: 13, fontWeight: '900' },
    date:    { fontSize: 10, fontWeight: '700' },
    zapBtn:  { padding: 6, backgroundColor: '#25D36615', borderRadius: 8, borderWidth: 1, borderColor: '#25D36640' },
});