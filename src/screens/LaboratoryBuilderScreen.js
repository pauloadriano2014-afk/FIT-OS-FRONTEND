// src/screens/LaboratoryBuilderScreen.js
import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function LaboratoryBuilderScreen({ route, navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    // Recebe as configurações da tela anterior (ou valores padrão de segurança)
    const config = route.params?.config || { days: 4, objective: 'HIPERTROFIA', level: 'INTERMEDIÁRIO', time: 60 };
    
    const daysArray = Array.from({ length: config.days }, (_, i) => String.fromCharCode(65 + i)); // Gera ['A', 'B', 'C', 'D']
    const [activeDay, setActiveDay] = useState(daysArray[0]);

    // Estrutura de estado: { 'A': ['Peitoral', 'Tríceps'], 'B': ['Costas', 'Bíceps'] }
    const [structure, setStructure] = useState(
        daysArray.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
    );

    const MUSCLE_GROUPS = [
        { id: 'Quadríceps e Adutores', label: 'Quadríceps' },
        { id: 'Posteriores', label: 'Posteriores' },
        { id: 'Glúteos', label: 'Glúteos' },
        { id: 'Panturrilha', label: 'Panturrilha' },
        { id: 'Peitoral', label: 'Peitoral' },
        { id: 'Costas', label: 'Costas' },
        { id: 'Ombros', label: 'Ombros' },
        { id: 'Trapézio', label: 'Trapézio' },
        { id: 'Bíceps', label: 'Bíceps' },
        { id: 'Tríceps', label: 'Tríceps' },
        { id: 'Abdômen', label: 'Abdômen' },
        { id: 'Cardio', label: 'Cardio Pós' }
    ];

    const toggleMuscle = (muscleId) => {
        setStructure(prev => {
            const currentDayMuscles = prev[activeDay];
            if (currentDayMuscles.includes(muscleId)) {
                return { ...prev, [activeDay]: currentDayMuscles.filter(m => m !== muscleId) };
            } else {
                return { ...prev, [activeDay]: [...currentDayMuscles, muscleId] };
            }
        });
    };

    const handleNextStep = () => {
        console.log("ESTRUTURA MONTADA PELO COACH:", structure);
        alert("Matriz pronta! O próximo e último passo é buscar no banco os exercícios exatos dessas tags.");
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                    
                    {/* CABEÇALHO */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>MONTAGEM</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>{config.days} DIAS • {config.time} MIN</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* TABS DOS DIAS DA SEMANA */}
                    <View style={[styles.daysContainer, { borderBottomColor: theme.border }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                            {daysArray.map(day => {
                                const isActive = activeDay === day;
                                const hasMuscles = structure[day].length > 0;
                                return (
                                    <TouchableOpacity 
                                        key={day} 
                                        style={[styles.dayTab, { backgroundColor: theme.surface, borderColor: theme.border }, isActive && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                                        onPress={() => setActiveDay(day)}
                                    >
                                        <Text style={[styles.dayTabText, { color: theme.textSecondary }, isActive && { color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }]}>DIA {day}</Text>
                                        {hasMuscles && (
                                            <View style={[styles.badge, isActive ? { backgroundColor: theme.isDark ? '#000' : '#FFF' } : { backgroundColor: theme.accent }]}>
                                                <Text style={[styles.badgeText, isActive ? { color: theme.accent } : { color: theme.isDark ? '#000' : '#FFF' }]}>{structure[day].length}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.infoBox}>
                            <MaterialCommunityIcons name="information-outline" size={20} color={theme.textSecondary} />
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>Selecione os grupos musculares que farão parte do <Text style={{color: theme.accent, fontWeight: 'bold'}}>TREINO {activeDay}</Text>.</Text>
                        </View>

                        {/* GRID DE MÚSCULOS */}
                        <View style={styles.grid}>
                            {MUSCLE_GROUPS.map(muscle => {
                                const isSelected = structure[activeDay].includes(muscle.id);
                                return (
                                    <TouchableOpacity 
                                        key={muscle.id}
                                        style={[styles.muscleCard, { backgroundColor: theme.surface, borderColor: theme.border }, isSelected && { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}
                                        onPress={() => toggleMuscle(muscle.id)}
                                    >
                                        <View style={[styles.checkbox, { borderColor: theme.border }, isSelected && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                                            {isSelected && <MaterialCommunityIcons name="check" size={14} color={theme.isDark ? '#000' : '#FFF'} />}
                                        </View>
                                        <Text style={[styles.muscleText, { color: theme.text }, isSelected && { color: theme.accent, fontWeight: 'bold' }]} numberOfLines={1} adjustsFontSizeToFit>{muscle.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* BOTÃO DE AVANÇAR */}
                    <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: theme.accent }]}
                            onPress={handleNextStep}
                        >
                            <Text style={[styles.actionButtonText, { color: theme.isDark ? '#000' : '#FFF' }]}>AVANÇAR PARA EXERCÍCIOS</Text>
                            <MaterialCommunityIcons name="arrow-right" size={22} color={theme.isDark ? '#000' : '#FFF'} />
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
    backButton: { padding: 8, borderRadius: 8, borderWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
    headerSubtitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: 2 },
    daysContainer: { paddingVertical: 15, borderBottomWidth: 1 },
    dayTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, gap: 8 },
    dayTabText: { fontSize: 13, fontWeight: 'bold' },
    badge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    badgeText: { fontSize: 10, fontWeight: '900' },
    scrollContent: { padding: 20, paddingBottom: 150 },
    infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
    muscleCard: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, gap: 10 },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    muscleText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 12, gap: 10 },
    actionButtonText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});