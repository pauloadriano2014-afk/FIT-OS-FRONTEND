// src/components/BonusCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BonusCard({ uri, title, subtitle, isAudio, price, unlockText }) {
    if (!uri) return null;

    return (
        <View style={styles.card}>
            <View style={styles.unlockBadge}>
                <Text style={styles.unlockText}>{unlockText}</Text>
            </View>
            <View style={styles.imageBox}>
                <Image source={{ uri }} style={styles.image} />
                {isAudio && (
                    <View style={styles.audioOverlay}>
                        <MaterialCommunityIcons name="headphones" size={40} color="#4DE38F" />
                        <Text style={styles.audioText}>AUDIOBOOK</Text>
                    </View>
                )}
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.valCortado}>De R$ {price}</Text>
                <Text style={styles.valGratis}>Por R$ 0,00</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { width: 220, backgroundColor: '#111', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#333', marginRight: 15, alignItems: 'center' },
    unlockBadge: { backgroundColor: '#222', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#4DE38F50', width: '100%', alignItems: 'center' },
    unlockText: { color: '#4DE38F', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    imageBox: { width: '100%', aspectRatio: 3/4, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0a0a0a', marginBottom: 15, position: 'relative' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    audioOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' },
    audioText: { color: '#4DE38F', fontWeight: '900', fontSize: 12, marginTop: 5, letterSpacing: 1 },
    textContainer: { alignItems: 'center', width: '100%' },
    valCortado: { color: '#666', fontSize: 12, textDecorationLine: 'line-through', marginBottom: 2 },
    valGratis: { color: '#4DE38F', fontSize: 15, fontWeight: '900', marginBottom: 8 },
    title: { color: '#FFF', fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
    subtitle: { color: '#888', fontSize: 11, textAlign: 'center' }
});