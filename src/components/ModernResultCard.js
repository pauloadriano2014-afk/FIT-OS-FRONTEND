// src/components/ModernResultCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// Recebe agora apenas 'montageUri' em vez de antes/depois separados
export default function ModernResultCard({ goal, weight, montageUri }) {
    if (!montageUri) return null; // Proteção se não houver link

    return (
        <View style={styles.modernResultCard}>
            <View style={styles.modernImageContainer}>
                {/* 🔥 IMAGEM ÚNICA DO CANVA COM RESIZE CONTAIN = FIM DOS CORTES 🔥 */}
                <Image source={{ uri: montageUri }} style={styles.resultImage} />
            </View>
            <View style={styles.modernResultFooter}>
                <Text style={styles.modernResultGoal}>{goal}</Text>
                {weight && <Text style={styles.modernResultWeight}>{weight}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    modernResultCard: { 
        width: 320, // Largura ideal para carrossel no celular
        backgroundColor: '#111', 
        borderRadius: 24, 
        padding: 15, // Padding menor para dar palco à imagem
        borderWidth: 1, 
        borderColor: '#333', 
        marginRight: 18, // Espaçamento entre cards no scroll
        alignItems: 'center'
    },
    modernImageContainer: { 
        width: '100%', 
        height: 400, // Altura fixa generosa para o design vertical do Canva
        backgroundColor: '#0a0a0a', // Fundo preto puro para as bordas invisíveis
        borderRadius: 16, 
        overflow: 'hidden', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222'
    },
    resultImage: { 
        width: '100%', 
        height: '100%', 
        resizeMode: 'contain', // 🔥 GARANTE QUE O DESIGN DO CANVA APAREÇA INTEIRO 🔥
        borderRadius: 16
    }, 
    modernResultFooter: { 
        marginTop: 15, 
        alignItems: 'center',
        width: '100%'
    },
    modernResultGoal: { 
        color: '#FFF', 
        fontWeight: '900', 
        fontSize: 13, 
        letterSpacing: 0.5, 
        marginBottom: 4, 
        textAlign: 'center' 
    },
    modernResultWeight: { 
        color: '#4DE38F', 
        fontWeight: 'bold', 
        fontSize: 12, 
        textAlign: 'center' 
    },
});