// src/screens/LaboratoryBuilderScreen.js
import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function LaboratoryBuilderScreen({ route, navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    const config = route.params?.config || { days: 4, objective: 'HIPERTROFIA', level: 'INTERMEDIÁRIO', time: 60 };
    
    const daysArray = Array.from({ length: config.days }, (_, i) => String.fromCharCode(65 + i)); 
    const [activeDay, setActiveDay] = useState(daysArray[0]);

    const [structure, setStructure] = useState(
        daysArray.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
    );

    const MUSCLE_GROUPS = [
        { 
            category: "PEITORAL", 
            items: [{ id: 'Superior', label: 'Superior' }, { id: 'Medial', label: 'Medial' }, { id: 'Inferior', label: 'Inferior' }] 
        },
        { 
            category: "COSTAS E LOMBAR", 
            items: [{ id: 'Puxadas', label: 'Puxadas' }, { id: 'Remadas', label: 'Remadas' }, { id: 'Lombar', label: 'Lombar' }] 
        },
        { 
            category: "PERNAS", 
            items: [{ id: 'Quadríceps e Adutores', label: 'Quadríceps / Adutores' }, { id: 'Posteriores', label: 'Posteriores' }, { id: 'Glúteos', label: 'Glúteos' }, { id: 'Panturrilha', label: 'Panturrilhas' }, { id: 'Multiarticular', label: 'Agachamentos / Legs' }] 
        },
        { 
            category: "OMBROS E TRAPÉZIO", 
            items: [{ id: 'Frontal', label: 'Frontal' }, { id: 'Lateral', label: 'Lateral' }, { id: 'Posterior', label: 'Posterior de Ombro' }, { id: 'Trapézio', label: 'Trapézio' }, { id: 'Ombro Multiarticular', label: 'Desenvolvimentos' }] 
        },
        { 
            category: "BRAÇOS", 
            items: [{ id: 'Bíceps', label: 'Bíceps' }, { id: 'Tríceps', label: 'Tríceps' }, { id: 'Antebraço', label: 'Antebraço' }] 
        },
        { 
            category: "CORE E ABDÔMEN", 
            items: [{ id: 'Supra', label: 'Supra' }, { id: 'Infra', label: 'Infra' }, { id: 'Completo', label: 'Completo / Remador' }, { id: 'Core', label: 'Pranchas / Core' }] 
        },
        { 
            category: "OUTROS", 
            items: [{ id: 'Cardio Pós', label: 'Cardio Pós-Treino' }] 
        }
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
        navigation.navigate('LaboratoryFinalScreen', { config, structure });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                    
                    {/* CABEÇALHO */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>ESQUELETO</Text>
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
                                        style={[styles.dayTab, { backgroundColor: theme.surface }, isActive && { backgroundColor: theme.accent }]}
                                        onPress={() => setActiveDay(day)}
                                    >
                                        <Text style={[styles.dayTabText, { color: isActive ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }, isActive && { fontWeight: '900' }]}>DIA {day}</Text>
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

                    {/* 🔥 SCROLL BLINDADO COM FLEX 1 🔥 */}
                    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={[styles.infoBox, { backgroundColor: theme.surface }]}>
                            <MaterialCommunityIcons name="information-outline" size={20} color={theme.textSecondary} />
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>O que vamos treinar no <Text style={{color: theme.accent, fontWeight: 'bold'}}>DIA {activeDay}</Text>?</Text>
                        </View>

                        {/* CATEGORIAS E GRID DE MÚSCULOS */}
                        {MUSCLE_GROUPS.map((group, index) => (
                            <View key={index} style={styles.groupSection}>
                                <Text style={[styles.groupTitle, { color: theme.text }]}>{group.category}</Text>
                                <View style={styles.grid}>
                                    {group.items.map(muscle => {
                                        const isSelected = structure[activeDay].includes(muscle.id);
                                        return (
                                            <TouchableOpacity 
                                                key={muscle.id}
                                                style={[styles.muscleCard, { backgroundColor: theme.bg, borderColor: theme.border }, isSelected && { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}
                                                onPress={() => toggleMuscle(muscle.id)}
                                            >
                                                <View style={[styles.checkbox, { borderColor: theme.border }, isSelected && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                                                    {isSelected && <MaterialCommunityIcons name="check" size={12} color={theme.isDark ? '#000' : '#FFF'} />}
                                                </View>
                                                <Text style={[styles.muscleText, { color: theme.text }, isSelected && { color: theme.accent, fontWeight: 'bold' }]} numberOfLines={2}>{muscle.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* 🔥 BOTÃO DE AÇÃO FIXO NO FLUXO (SEM ABSOLUTE) 🔥 */}
                    <View style={[styles.footer, { backgroundColor: theme.bg }]}>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: theme.accent }]}
                            onPress={handleNextStep}
                        >
                            <Text style={[styles.actionButtonText, { color: theme.isDark ? '#000' : '#FFF' }]}>BUSCAR EXERCÍCIOS</Text>
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
    backButton: { padding: 8, borderRadius: 12 },
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
    headerSubtitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: 2 },
    daysContainer: { paddingVertical: 15, borderBottomWidth: 1 },
    dayTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, gap: 8 },
    dayTabText: { fontSize: 12, fontWeight: 'bold' },
    badge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    badgeText: { fontSize: 9, fontWeight: '900' },
    
    // SCROLL COM ESPAÇAMENTO RESPIRÁVEL
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, flexGrow: 1 },
    
    infoBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    groupSection: { marginBottom: 30 }, // Margem aumentada para separar bem os grupos
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }, // Gap aumentado
    muscleCard: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, gap: 10 },
    checkbox: { width: 18, height: 18, borderRadius: 6, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    muscleText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
    
    // FOOTER FIXO (SEM POSITION ABSOLUTE)
    footer: { width: '100%', paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
    actionButtonText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});
