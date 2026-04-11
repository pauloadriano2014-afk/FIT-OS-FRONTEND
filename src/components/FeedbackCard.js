// src/components/FeedbackCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function FeedbackCard({ uri, legend }) {
    if (!uri) return null;

    return (
        <View style={styles.card}>
            <View style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
            </View>
            <Text style={styles.legend}>{legend}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { width: 300, backgroundColor: '#111', borderRadius: 24, padding: 15, borderWidth: 1, borderColor: '#333', marginRight: 18, alignItems: 'center' },
    imageContainer: { width: '100%', height: 350, backgroundColor: '#0a0a0a', borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
    image: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 16 },
    legend: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5, marginTop: 15, textAlign: 'center' }
});