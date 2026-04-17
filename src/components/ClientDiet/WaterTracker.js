// src/components/ClientDiet/WaterTracker.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function WaterTracker({ theme, studentId, weight }) {
    const [consumed, setConsumed] = useState(0);
    const [showInfo, setShowInfo] = useState(false);
    const [loading, setLoading] = useState(true);

    // Usa o peso do aluno para calcular a meta (35ml por kg). Se não tiver peso, joga o padrão de 70kg.
    const baseWeight = weight ? parseFloat(weight.toString()) : 70;
    const minGoal = baseWeight * 35;
    const progress = Math.min((consumed / minGoal) * 100, 100);

    // Carrega a água ingerida hoje
    useEffect(() => {
        const loadWater = async () => {
            if (!studentId) return;
            try {
                const today = new Date().toISOString().split('T')[0];
                const res = await fetch(`https://fitos-final.onrender.com/api/checkins?studentId=${studentId}&date=${today}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.water_ml) {
                        setConsumed(data.water_ml);
                    }
                }
            } catch (err) {
                console.log("Erro ao carregar água:", err);
            } finally {
                setLoading(false);
            }
        };
        loadWater();
    }, [studentId]);

    // Atualiza a água na tela e no banco de dados
    const updateWater = async (newAmount) => {
        setConsumed(newAmount);
        try {
            const today = new Date().toISOString().split('T')[0];
            await fetch('https://fitos-final.onrender.com/api/checkins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    date: today,
                    water_ml: newAmount
                })
            });
        } catch (err) {
            console.log("Erro ao salvar água:", err);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ActivityIndicator size="small" color="#32ADE6" />
                <Text style={[styles.loadingText, { color: '#32ADE6' }]}>Sincronizando Hidratação...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            {/* Header do Card */}
            <View style={styles.headerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 173, 230, 0.15)' }]}>
                        <MaterialCommunityIcons name="water" size={24} color="#32ADE6" />
                    </View>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>HIDRATAÇÃO</Text>
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                            META MÍNIMA: {(minGoal / 1000).toFixed(2)}L
                        </Text>
                    </View>
                </View>
                
                <TouchableOpacity 
                    style={[styles.infoBtn, { backgroundColor: theme.bg }]} 
                    onPress={() => setShowInfo(!showInfo)}
                >
                    <MaterialCommunityIcons name="information-variant" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Balão de Informação (Expansível) */}
            {showInfo && (
                <View style={[styles.infoBox, { backgroundColor: 'rgba(50, 173, 230, 0.08)', borderColor: 'rgba(50, 173, 230, 0.2)' }]}>
                    <Text style={[styles.infoBoxText, { color: theme.textSecondary }]}>
                        Sua meta base é <Text style={{ color: '#32ADE6', fontWeight: 'bold' }}>35ml/kg</Text>. 
                        Em dias de treino intenso ou muito calor, suba o consumo para <Text style={{ color: '#32ADE6', fontWeight: 'bold' }}>50ml/kg</Text>.
                    </Text>
                </View>
            )}

            {/* Números e Barra de Progresso */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTextRow}>
                    <Text style={styles.valueBig}>{(consumed / 1000).toFixed(2)}L</Text>
                    <Text style={[styles.valueSmall, { color: theme.textSecondary }]}>/ {(minGoal / 1000).toFixed(2)}L</Text>
                </View>
                
                <View style={[styles.progressBarBg, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
            </View>

            {/* Botões de Ação (+250, +500, Reset) */}
            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} 
                    onPress={() => updateWater(consumed + 250)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.actionBtnText}>+ 250ml</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} 
                    onPress={() => updateWater(consumed + 500)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.actionBtnText}>+ 500ml</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.resetBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} 
                    onPress={() => {
                        Alert.alert(
                            "Zerar Hidratação?",
                            "Tem certeza que deseja zerar a contagem de água de hoje?",
                            [
                                { text: "Cancelar", style: "cancel" },
                                { text: "Zerar", style: "destructive", onPress: () => updateWater(0) }
                            ]
                        );
                    }}
                >
                    <MaterialCommunityIcons name="refresh" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    loadingCard: { height: 120, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
    loadingText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },

    card: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 15, fontWeight: '900', letterSpacing: -0.5, marginBottom: 2 },
    metaText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    infoBtn: { padding: 8, borderRadius: 20 },

    infoBox: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
    infoBoxText: { fontSize: 11, lineHeight: 18 },

    progressContainer: { marginBottom: 24 },
    progressTextRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8, paddingHorizontal: 5 },
    valueBig: { fontSize: 32, fontWeight: '900', color: '#32ADE6', fontStyle: 'italic', letterSpacing: -1 },
    valueSmall: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginLeft: 8 },
    
    progressBarBg: { height: 12, borderRadius: 6, borderWidth: 1, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#32ADE6', borderRadius: 6 },

    actionRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { color: '#32ADE6', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    resetBtn: { width: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }
});