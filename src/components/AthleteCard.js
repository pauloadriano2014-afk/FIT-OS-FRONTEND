// src/components/AthleteCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function AthleteCard({ uri, title, desc }) {
    // 🔥 TRAVA DE SEGURANÇA: Se não tiver link da foto, o card desaparece da tela 🔥
    if (!uri) return null;

    return (
        <View style={styles.athleteCard}>
            <View style={styles.athleteImageContainer}>
                <Image source={{ uri: uri }} style={styles.athleteImage} />
            </View>
            <Text style={styles.athleteTitle}>{title}</Text>
            <Text style={styles.athleteDesc}>{desc}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    athleteCard: { width: 280, backgroundColor: '#161616', borderRadius: 24, padding: 15, borderWidth: 1, borderColor: '#333', marginRight: 15 },
    
    // CAIXA COM PROPORÇÃO EXATA 9x16
    athleteImageContainer: { 
        width: '100%', 
        aspectRatio: 9 / 16, 
        backgroundColor: '#0a0a0a', 
        borderRadius: 14, 
        overflow: 'hidden', 
        marginBottom: 15, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    
    // MODO COVER
    athleteImage: { 
        width: '100%', 
        height: '100%', 
        resizeMode: 'cover', 
        borderRadius: 14 
    }, 
    
    athleteTitle: { color: '#4DE38F', fontWeight: '900', fontSize: 14, letterSpacing: 0.5, marginBottom: 5 },
    athleteDesc: { color: '#888', fontSize: 12, lineHeight: 18 },
});