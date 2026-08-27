// src/components/ClientDiet/WaterTracker.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authHeaders } from '../../utils/authToken';

export default function WaterTracker({ theme, studentId, weight: initialWeight }) {
    const [consumed, setConsumed] = useState(0);
    const [showInfo, setShowInfo] = useState(false);
    const [loading, setLoading] = useState(true);

    const [currentWeight, setCurrentWeight] = useState(initialWeight ? parseFloat(initialWeight.toString()) : 70);
    const [isEditingWeight, setIsEditingWeight] = useState(false);
    const [tempWeight, setTempWeight] = useState('');

    // 🔥 CÁLCULO DE ALTA PERFORMANCE: 50ml por kg corporal
    const minGoal = currentWeight * 50;
    const progress = Math.min((consumed / minGoal) * 100, 100);
    const isGoalMet = consumed >= minGoal;

    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        const loadData = async () => {
            if (!studentId) return;
            try {
                // 1. Busca peso salvo localmente
                const savedWeight = await AsyncStorage.getItem(`@water_weight_${studentId}`);
                if (savedWeight) setCurrentWeight(parseFloat(savedWeight));

                // 2. Busca progresso do dia no servidor
                const today = new Date().toISOString().split('T')[0];
                const res = await fetch(`https://fitos-final.onrender.com/api/user/daily-progress?studentId=${studentId}&date=${today}`, {
                    headers: { ...(await authHeaders()) },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.water_ml) setConsumed(data.water_ml);
                }
            } catch (err) {
                console.log("Erro ao carregar hidratação:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [studentId]);

    useEffect(() => {
        if (isGoalMet) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [isGoalMet]);

    const updateWater = async (newAmount) => {
        const finalAmount = Math.max(0, newAmount);
        setConsumed(finalAmount);
        try {
            const today = new Date().toISOString().split('T')[0];
            await fetch('https://fitos-final.onrender.com/api/user/daily-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ studentId, date: today, water_ml: finalAmount })
            });
        } catch (err) { console.log("Erro ao salvar água:", err); }
    };

    const saveNewWeight = async () => {
        if (tempWeight && !isNaN(tempWeight.replace(',', '.'))) {
            const nw = parseFloat(tempWeight.replace(',', '.'));
            setCurrentWeight(nw);
            await AsyncStorage.setItem(`@water_weight_${studentId}`, nw.toString());
        }
        setIsEditingWeight(false);
    };

    if (loading) {
        return (
            <View style={[styles.loadingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ActivityIndicator size="small" color="#4DE38F" />
                <Text style={[styles.loadingText, { color: '#4DE38F' }]}>Sincronizando...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: isGoalMet ? '#4DE38F' : theme.border }]}>
            
            <View style={styles.headerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.iconBox, { backgroundColor: isGoalMet ? '#4DE38F20' : 'rgba(50, 173, 230, 0.15)' }]}>
                        <MaterialCommunityIcons name={isGoalMet ? "trophy-variant" : "water"} size={24} color={isGoalMet ? '#4DE38F' : "#32ADE6"} />
                    </View>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>HIDRATAÇÃO</Text>
                        
                        {isEditingWeight ? (
                            <View style={styles.editWeightRow}>
                                <TextInput 
                                    style={[styles.weightInput, { color: theme.text, borderColor: '#4DE38F', backgroundColor: theme.bg }]} 
                                    value={tempWeight} onChangeText={setTempWeight} keyboardType="numeric" maxLength={5} autoFocus placeholder="00.0" placeholderTextColor={theme.textSecondary}
                                />
                                <TouchableOpacity onPress={saveNewWeight} style={styles.saveWeightBtn}>
                                    <MaterialCommunityIcons name="check-bold" size={14} color="#000" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.weightBadge, { borderColor: isGoalMet ? '#4DE38F' : theme.border }]} 
                                onPress={() => { setTempWeight(currentWeight.toString()); setIsEditingWeight(true); }}
                            >
                                <Text style={[styles.metaText, { color: isGoalMet ? '#4DE38F' : theme.textSecondary }]}>
                                    {isGoalMet ? 'META BATIDA!' : `${(minGoal / 1000).toFixed(2)}L (50ml/kg)`}
                                </Text>
                                <MaterialCommunityIcons name="pencil" size={12} color="#4DE38F" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                
                <TouchableOpacity style={[styles.infoBtn, { backgroundColor: theme.bg }]} onPress={() => setShowInfo(!showInfo)}>
                    <MaterialCommunityIcons name="information-variant" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {showInfo && (
                <View style={[styles.infoBox, { backgroundColor: 'rgba(77, 227, 143, 0.05)', borderColor: '#4DE38F44' }]}>
                    <Text style={[styles.infoBoxText, { color: theme.textSecondary }]}>
                        A água potencializa a síntese proteica e evita a retenção. Para quem treina pesado como você, o padrão é <Text style={{ color: '#4DE38F', fontWeight: 'bold' }}>50ml/kg</Text>.
                    </Text>
                </View>
            )}

            <View style={styles.progressContainer}>
                <View style={styles.progressTextRow}>
                    <Text style={[styles.valueBig, isGoalMet && { color: '#4DE38F' }]}>{(consumed / 1000).toFixed(2)}L</Text>
                    <Text style={[styles.valueSmall, { color: theme.textSecondary }]}>/ {(minGoal / 1000).toFixed(2)}L</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isGoalMet ? '#4DE38F' : '#32ADE6' }]} />
                </View>
            </View>

            {isGoalMet && (
                <Animated.View style={[styles.successBanner, { opacity: fadeAnim, backgroundColor: '#4DE38F15', borderColor: '#4DE38F40' }]}>
                    <MaterialCommunityIcons name="star-face" size={20} color="#4DE38F" />
                    <View style={{flex: 1}}>
                        <Text style={[styles.successTitle, { color: '#4DE38F' }]}>META ALCANÇADA!</Text>
                        <Text style={[styles.successDesc, { color: theme.textSecondary }]}>
                            Seu metabolismo está blindado e pronto para queimar gordura e construir massa hoje.
                        </Text>
                    </View>
                </Animated.View>
            )}

            <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => updateWater(consumed + 250)} activeOpacity={0.7}>
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>+ 250ml</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => updateWater(consumed + 500)} activeOpacity={0.7}>
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>+ 500ml</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingCard: { height: 120, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
    loadingText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    card: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 14, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
    
    // 🔥 Destaque no Peso (Lápis)
    weightBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6, 
        paddingHorizontal: 8, 
        paddingVertical: 3, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderStyle: 'dashed' 
    },
    metaText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    
    editWeightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    weightInput: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, fontSize: 11, fontWeight: 'bold', width: 55, textAlign: 'center' },
    saveWeightBtn: { backgroundColor: '#4DE38F', padding: 5, borderRadius: 6 },

    infoBtn: { padding: 8, borderRadius: 20 },
    infoBox: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
    infoBoxText: { fontSize: 11, lineHeight: 18, fontStyle: 'italic' },
    
    progressContainer: { marginBottom: 20 },
    progressTextRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8, paddingHorizontal: 5 },
    valueBig: { fontSize: 32, fontWeight: '900', color: '#32ADE6', fontStyle: 'italic', letterSpacing: -1 },
    valueSmall: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginLeft: 8 },
    progressBarBg: { height: 10, borderRadius: 5, borderWidth: 1, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 5 },
    
    successBanner: { flexDirection: 'row', gap: 12, padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 20, alignItems: 'flex-start' },
    successTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    successDesc: { fontSize: 10, lineHeight: 16 },
    
    actionRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, paddingVertical: 15, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});