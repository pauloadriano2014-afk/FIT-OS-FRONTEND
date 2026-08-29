// src/screens/LaboratoryFinalScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
    StyleSheet, StatusBar, Platform, TextInput, Modal, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

// 🔥 BANCO EXPANDIDO COM OS SEUS EXERCÍCIOS REAIS 🔥
const EXERCISE_DB = {
    'Superior': ['Supino Inclinado c/ Halteres', 'Supino Inclinado no Smith', 'Crucifixo Inclinado na Polia', 'Supino Inclinado c/ Barra'],
    'Medial': ['Supino Reto c/ Barra', 'Supino Reto c/ Halteres', 'Voador Frontal', 'Supino Máquina', 'Crucifixo Reto c/ Halteres'],
    'Inferior': ['Cross-over Polia Alta', 'Supino Declinado', 'Mergulho nas Paralelas'],
    'Puxadas': ['Puxada Frente Aberta', 'Puxada Articulada Aberta', 'Puxada c/ Triângulo', 'Barra Livre Pegada Neutra', 'Pulldown no Cross Barra Reta'],
    'Remadas': ['Remada Curvada c/ Barra', 'Serrote', 'Remada Articulada Neutra', 'Remada Cavalinho', 'Remada Baixa com Triângulo'],
    'Lombar': ['Terra Sumô', 'Levantamento Terra com Barra', 'Lombar no Banco Romano', 'Good Morning'],
    'Quadríceps e Adutores': ['Cadeira Extensora', 'Agachamento Hack', 'Cadeira Adutora', 'Sissy Squat', 'Agachamento Frontal Máquina'],
    'Posteriores': ['Mesa Flexora', 'Cadeira Flexora', 'Stiff c/ Halter', 'Flexora Unilateral', 'Stiff com Barra'],
    'Glúteos': ['Elevação Pélvica na Máquina', 'Búlgaro com Halteres', 'Cadeira Abdutora Tronco Inclinado', 'Elevação Pélvica com Barra'],
    'Panturrilha': ['Panturrilha no Smith', 'Máquina de Panturrilha em Pé', 'Panturrilha no Degrau', 'Panturrilha Sentado'],
    'Multiarticular': ['Agachamento Livre com Barra', 'Leg Press 45°', 'Agachamento Sumô c/ Halter', 'Passada com Halteres', 'Leg Press Horizontal'],
    'Frontal': ['Elevação Frontal com Halteres', 'Elevação Frontal c/ Anilha', 'Elevação Frontal no Cross'],
    'Lateral': ['Elevação Lateral com Halteres', 'Elevação Lateral no Cross', 'Elevação Lateral Sentado'],
    'Posterior': ['Voador Invertido', 'Posterior de Ombros no Cross', 'Posterior de Ombros c/ Halteres em Pé'],
    'Trapézio': ['Encolhimento com Halteres', 'Encolhimento no Smith', 'Remada Alta no Cross'],
    'Ombro Multiarticular': ['Desenvolvimento com Halteres', 'Desenvolvimento Arnold', 'Desenvolvimento no Smith', 'Desenvolvimento Articulado'],
    'Bíceps': ['Rosca Direta na Polia', 'Rosca Simultânea com Halteres', 'Máquina de Bíceps Scott', 'Rosca Alternada c/ Halteres'],
    'Tríceps': ['Tríceps Corda na Polia', 'Tríceps Testa no Cross', 'Tríceps Francês', 'Tríceps Banco Máquina'],
    'Antebraço': ['Rosca Martelo', 'Rosca Inversa com Barra Curvada'],
    'Supra': ['Abdominal Máquina Smartfit', 'Abdominal Supra no Banco Declinado', 'Abdominal Crunch'],
    'Infra': ['Abdominal Infra na Paralela', 'Abdominal Infra no Colchonete'],
    'Completo': ['Rodinha Abdominal', 'Abdominal Canivete', 'Abdominal Ball-Pass'],
    'Core': ['Prancha com Variação', 'Prancha Isométrica', 'Vacuum Abdominal'],
    'Cardio Pós': ['Escada Ergométrica (20-30 min)', 'Esteira HIT', 'Elíptico (300 calorias)']
};

const TECHNIQUES = [
    { id: 'DROP', label: 'Drop-Set', desc: 'Falha, reduz carga, + falha', color: '#FF3B30' },
    { id: 'REST', label: 'Rest-Pause', desc: 'Falha, descansa 15s, + falha', color: '#FF9500' },
    { id: 'BISET', label: 'Bi-Set', desc: 'Combinado sem descanso', color: '#AF52DE' },
    { id: 'GVT', label: 'GVT 10x10', desc: '10 séries de 10 reps', color: '#007AFF' },
    { id: 'TUT', label: 'TUT (Slow)', desc: 'Tempo sob tensão (ex: 4s descida)', color: '#34C759' },
    { id: 'MEIA', label: '1 Rep e 1/2', desc: 'Aumenta o tempo sob tensão', color: '#FF2D55' },
    { id: 'NORMAL', label: 'Padrão', desc: 'Série normal', color: '#8E8E93' }
];

export default function LaboratoryFinalScreen({ route, navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    const config = route.params?.config || {};
    const structure = route.params?.structure || {};
    const daysArray = Object.keys(structure);
    
    const [activeDay, setActiveDay] = useState(daysArray[0] || 'A');
    const [workout, setWorkout] = useState({});
    
    const [techModalVisible, setTechModalVisible] = useState(false);
    const [activeExerciseIdx, setActiveExerciseIdx] = useState(null);

    // 🔥 O ROBÔ DE PREENCHIMENTO INTELIGENTE ANTI-REPETIÇÃO 🔥
    useEffect(() => {
        if (!daysArray || daysArray.length === 0) return;
        
        let initialWorkout = {};
        const defaultSeries = config.level === 'AVANÇADO' ? '4/10-12' : config.level === 'INICIANTE' ? '3/15' : '4/12';

        daysArray.forEach(day => {
            let usedExercises = new Set(); // Reseta os exercícios usados para cada novo dia
            
            if(structure[day]) {
                initialWorkout[day] = structure[day].map(muscleId => {
                    let options = EXERCISE_DB[muscleId] || [];
                    
                    // Filtra para pegar um exercício que AINDA NÃO FOI USADO neste dia
                    let available = options.filter(ex => !usedExercises.has(ex));
                    
                    // Se acabarem as opções únicas, ele repete a primeira (fallback seguro)
                    let suggestedExercise = available.length > 0 ? available[0] : (options[0] || `Exercício para ${muscleId}`);
                    
                    // Marca como usado
                    usedExercises.add(suggestedExercise);

                    return {
                        muscle: muscleId,
                        name: suggestedExercise,
                        series: defaultSeries,
                        technique: 'NORMAL' 
                    };
                });
            }
        });
        setWorkout(initialWorkout);
    }, []);

    const applyTechnique = (techId) => {
        if (activeExerciseIdx !== null) {
            setWorkout(prev => {
                const newWorkout = { ...prev };
                newWorkout[activeDay][activeExerciseIdx].technique = techId;
                if(techId === 'GVT') newWorkout[activeDay][activeExerciseIdx].series = '10/10';
                return newWorkout;
            });
        }
        setTechModalVisible(false);
    };

    const handleSaveWorkout = () => {
        alert("Treino de Elite Finalizado e Pronto para o App do Aluno!\n(Aguardando conexão com banco de dados final)");
    };

    const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg, overflow: 'hidden', display: 'flex', flexDirection: 'column' } : { flex: 1, backgroundColor: theme.bg };

    if (Object.keys(workout).length === 0) return (
        <SafeAreaView style={rootStyle}>
            <ActivityIndicator style={{marginTop: 50}} color={theme.accent} size="large" />
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={rootStyle}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 960 : '100%', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                    
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>PRESCRIÇÃO</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>{config.student?.name || 'ALUNO'} • {config.objective || 'GERAL'}</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={[styles.daysContainer, { borderBottomColor: theme.border }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScrollContent}>
                            {daysArray.map(day => {
                                const isActive = activeDay === day;
                                return (
                                    <TouchableOpacity 
                                        key={day} 
                                        style={[styles.dayTab, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }, isActive && { backgroundColor: theme.accent, borderWidth: 0 }]}
                                        onPress={() => setActiveDay(day)}
                                    >
                                        <Text style={[styles.dayTabText, { color: isActive ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>DIA {day}</Text>
                                        <View style={[styles.badge, isActive ? { backgroundColor: theme.isDark ? '#000' : '#FFF' } : { backgroundColor: theme.surface }]}>
                                            <Text style={[styles.badgeText, isActive ? { color: theme.accent } : { color: theme.text }]}>{workout[day]?.length || 0}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        
                        <View style={[styles.infoBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent, borderWidth: 1 }]}>
                            <MaterialCommunityIcons name="dumbbell" size={20} color={theme.accent} />
                            <Text style={[styles.infoText, { color: theme.text }]}>Ficha gerada com base no volume das suas matrizes reais. Aplique as técnicas avançadas.</Text>
                        </View>

                        {workout[activeDay]?.map((exercise, index) => {
                            const techInfo = TECHNIQUES.find(t => t.id === exercise.technique);
                            const hasTech = exercise.technique !== 'NORMAL';

                            return (
                                <View key={index} style={[styles.exerciseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    
                                    <View style={styles.exerciseHeader}>
                                        <View style={[styles.muscleBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                            <Text style={[styles.muscleBadgeText, { color: theme.textSecondary }]}>{exercise.muscle}</Text>
                                        </View>
                                        <TouchableOpacity 
                                            style={[styles.techBtn, hasTech ? { backgroundColor: techInfo.color } : { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}
                                            onPress={() => { setActiveExerciseIdx(index); setTechModalVisible(true); }}
                                        >
                                            <MaterialCommunityIcons name={hasTech ? "lightning-bolt" : "plus"} size={14} color={hasTech ? "#FFF" : theme.textSecondary} />
                                            <Text style={[styles.techBtnText, { color: hasTech ? "#FFF" : theme.textSecondary }]}>{hasTech ? techInfo.label : 'Técnica'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={[styles.exerciseName, { color: theme.text }]}>{exercise.name}</Text>
                                    
                                    <View style={styles.inputsRow}>
                                        <View style={[styles.inputBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                            <MaterialCommunityIcons name="repeat" size={16} color={theme.textSecondary} />
                                            <TextInput 
                                                style={[styles.input, { color: theme.text }]}
                                                value={exercise.series}
                                                onChangeText={(text) => {
                                                    const newW = {...workout};
                                                    newW[activeDay][index].series = text;
                                                    setWorkout(newW);
                                                }}
                                            />
                                        </View>
                                        <TouchableOpacity style={[styles.swapBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                            <MaterialCommunityIcons name="swap-horizontal" size={18} color={theme.accent} />
                                            <Text style={[styles.swapBtnText, { color: theme.accent }]}>Trocar</Text>
                                        </TouchableOpacity>
                                    </View>

                                </View>
                            );
                        })}
                    </ScrollView>

                    <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#34C759' }]} onPress={handleSaveWorkout}>
                            <Text style={[styles.actionButtonText, { color: '#FFF' }]}>SALVAR TREINO FINAL</Text>
                            <MaterialCommunityIcons name="content-save-check" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                </View>
            </View>

            <Modal visible={techModalVisible} transparent animationType="fade" onRequestClose={() => setTechModalVisible(false)}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setTechModalVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>APLICAR TÉCNICA AVANÇADA</Text>
                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {TECHNIQUES.map(tech => (
                                <TouchableOpacity key={tech.id} style={[styles.techOptionItem, { borderBottomColor: theme.border }]} onPress={() => applyTechnique(tech.id)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={[styles.techDot, { backgroundColor: tech.color }]} />
                                        <View>
                                            <Text style={[styles.studentName, { color: theme.text }]}>{tech.label}</Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>{tech.desc}</Text>
                                        </View>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
    backButton: { padding: 8, borderRadius: 12 },
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
    headerSubtitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: 2 },
    daysContainer: { paddingVertical: 15, borderBottomWidth: 1 },
    daysScrollContent: { paddingHorizontal: 20, gap: 10 }, 
    dayTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, gap: 8 },
    dayTabText: { fontSize: 12, fontWeight: 'bold' },
    badge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    badgeText: { fontSize: 9, fontWeight: '900' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, flexGrow: 1 },
    infoBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    exerciseCard: { borderRadius: 14, padding: 15, marginBottom: 15, borderWidth: 1 },
    exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    muscleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    muscleBadgeText: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
    techBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
    techBtnText: { fontSize: 10, fontWeight: 'bold' },
    exerciseName: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    inputsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 40, borderRadius: 10, borderWidth: 1 },
    input: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: 'bold', outlineStyle: 'none' },
    swapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, gap: 6 },
    swapBtnText: { fontSize: 12, fontWeight: 'bold' },
    footer: { width: '100%', paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
    actionButtonText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: 20 },
    modalContent: { width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 24, padding: 20, borderWidth: 1 },
    modalTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 15, textAlign: 'center' },
    techOptionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
    techDot: { width: 12, height: 12, borderRadius: 6 },
    studentName: { fontSize: 14, fontWeight: 'bold' },
});