// src/components/ModernResultCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function ModernResultCard({ goal, weight, antesUri, depoisUri, badgeAntes = 'ANTES', badgeDepois = 'DEPOIS' }) {
    return (
        <View style={styles.modernResultCard}>
            <View style={styles.modernImagesRow}>
                <View style={[styles.modernImageContainer, { filter: 'grayscale(100%)' }]}>
                    <Image source={{ uri: antesUri }} style={styles.resultImage} />
                    <View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>{badgeAntes}</Text></View>
                </View>
                <View style={styles.modernImageContainer}>
                    <Image source={{ uri: depoisUri }} style={styles.resultImage} />
                    <View style={[styles.floatingBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.floatingBadgeText, { color: '#000' }]}>{badgeDepois}</Text></View>
                </View>
            </View>
            <View style={styles.modernResultFooter}>
                <Text style={styles.modernResultGoal}>{goal}</Text>
                {weight && <Text style={styles.modernResultWeight}>{weight}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    modernResultCard: { width: 340, backgroundColor: '#111', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#333', marginRight: 15 },
    modernImagesRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, height: 300 }, // 🔥 Altura fixa ideal para fotos verticais
    modernImageContainer: { flex: 1, backgroundColor: '#111', borderRadius: 14, overflow: 'hidden', position: 'relative' }, // 🔥 Fundo da cor do card, sem aspect ratio forçado
    floatingBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 10 },
    floatingBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    resultImage: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 14 }, // 🔥 CONTAIN = NUNCA MAIS CORTA
    modernResultFooter: { marginTop: 15, alignItems: 'center' },
    modernResultGoal: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5, marginBottom: 4, textAlign: 'center' },
    modernResultWeight: { color: '#4DE38F', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
});