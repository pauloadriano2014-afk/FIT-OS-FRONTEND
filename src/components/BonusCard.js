// src/components/BonusCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BonusCard({ uri, title, subtitle, isAudio, price, unlockText, themeColor }) {
    if (!uri) return null;

    // 🔥 Puxa a cor dinâmica ou usa o Verde Padrão como fallback 🔥
    const activeColor = themeColor || '#4DE38F';

    return (
        <View style={styles.card}>
            <View style={[styles.unlockBadge, { borderColor: activeColor + '50' }]}>
                <Text style={[styles.unlockText, { color: activeColor }]}>{unlockText}</Text>
            </View>
            <View style={styles.imageBox}>
                <Image source={{ uri }} style={styles.image} />
                {isAudio && (
                    <View style={styles.audioOverlay}>
                        <MaterialCommunityIcons name="headphones" size={40} color={activeColor} />
                        <Text style={[styles.audioText, { color: activeColor }]}>AUDIOBOOK</Text>
                    </View>
                )}
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.valCortado}>De R$ {price}</Text>
                <Text style={[styles.valGratis, { color: activeColor }]}>Por R$ 0,00</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { width: 220, backgroundColor: '#111', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#333', marginRight: 15, alignItems: 'center' },
    unlockBadge: { backgroundColor: '#222', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 12, borderWidth: 1, width: '100%', alignItems: 'center' },
    unlockText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    imageBox: { width: '100%', aspectRatio: 3/4, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0a0a0a', marginBottom: 15, position: 'relative' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    audioOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' },
    audioText: { fontWeight: '900', fontSize: 12, marginTop: 5, letterSpacing: 1 },
    textContainer: { alignItems: 'center', width: '100%' },
    valCortado: { color: '#666', fontSize: 12, textDecorationLine: 'line-through', marginBottom: 2 },
    valGratis: { fontSize: 15, fontWeight: '900', marginBottom: 8 },
    title: { color: '#FFF', fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
    subtitle: { color: '#888', fontSize: 11, textAlign: 'center' }
});