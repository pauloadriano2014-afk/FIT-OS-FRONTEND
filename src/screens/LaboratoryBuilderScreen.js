// src/screens/LaboratoryBuilderScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
    StyleSheet, StatusBar, Platform, TextInput, Modal 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const MUSCLE_GROUPS = [
    { category: "PEITORAL", items: [{ id: 'Superior', label: 'Superior', time: 10 }, { id: 'Medial', label: 'Medial', time: 10 }, { id: 'Inferior', label: 'Inferior', time: 10 }] },
    { category: "COSTAS E LOMBAR", items: [{ id: 'Puxadas', label: 'Puxadas', time: 12 }, { id: 'Remadas', label: 'Remadas', time: 12 }, { id: 'Lombar', label: 'Lombar', time: 8 }] },
    { category: "PERNAS", items: [{ id: 'Quadríceps e Adutores', label: 'Quadríceps / Adutores', time: 15 }, { id: 'Posteriores', label: 'Posteriores', time: 15 }, { id: 'Glúteos', label: 'Glúteos', time: 12 }, { id: 'Panturrilha', label: 'Panturrilhas', time: 8 }, { id: 'Multiarticular', label: 'Agachamentos / Legs', time: 15 }] },
    { category: "OMBROS E TRAPÉZIO", items: [{ id: 'Frontal', label: 'Frontal', time: 8 }, { id: 'Lateral', label: 'Lateral', time: 8 }, { id: 'Posterior', label: 'Posterior de Ombro', time: 8 }, { id: 'Trapézio', label: 'Trapézio', time: 8 }, { id: 'Ombro Multiarticular', label: 'Desenvolvimentos', time: 10 }] },
    { category: "BRAÇOS", items: [{ id: 'Bíceps', label: 'Bíceps', time: 10 }, { id: 'Tríceps', label: 'Tríceps', time: 10 }, { id: 'Antebraço', label: 'Antebraço', time: 6 }] },
    { category: "CORE E ABDÔMEN", items: [{ id: 'Supra', label: 'Supra', time: 8 }, { id: 'Infra', label: 'Infra', time: 8 }, { id: 'Completo', label: 'Completo / Remador', time: 8 }, { id: 'Core', label: 'Pranchas / Core', time: 6 }] },
    { category: "OUTROS", items: [{ id: 'Cardio Pós', label: 'Cardio Pós-Treino', time: 20 }] }
];

const SectionCard = ({ children, title, theme }) => (
    <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {title && <Text style={[styles.groupTitle, { color: theme.text }]}>{title}</Text>}
        {children}
    </View>
);

export default function LaboratoryBuilderScreen({ route, navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    const config = route.params?.config || { days: 5, objective: 'HIPERTROFIA', level: 'AVANÇADO', time: 60, gender: 'MASCULINO', limitations: [], template: null };
    
    const daysArray = Array.from({ length: config.days }, (_, i) => String.fromCharCode(65 + i)); 
    const [activeDay, setActiveDay] = useState(daysArray[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [dayModalVisible, setDayModalVisible] = useState(false);

    const [structure, setStructure] = useState(
        daysArray.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
    );

    // 🔥 O VERDADEIRO MOTOR DO PAULO ADRIANO TEAM COM VOLUME REAL 🔥
    useEffect(() => {
        const generateAutoFill = () => {
            let autoStruct = daysArray.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
            const t = config.template;
            const dCount = config.days;
            const isFem = config.gender === 'FEMININO';

            // ======= MATRIZES MASCULINAS REAIS (INJETANDO VOLUME MASSIVO) =======
            if (t === 'MASC_EMAG_6X' && dCount >= 6) {
                autoStruct['A'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Quadríceps e Adutores', 'Panturrilha']; 
                autoStruct['B'] = ['Superior', 'Medial', 'Inferior', 'Ombro Multiarticular', 'Frontal', 'Lateral', 'Tríceps']; 
                autoStruct['C'] = ['Puxadas', 'Remadas', 'Puxadas', 'Remadas', 'Bíceps', 'Bíceps', 'Supra', 'Infra']; 
                autoStruct['D'] = ['Posteriores', 'Posteriores', 'Glúteos', 'Multiarticular', 'Panturrilha']; 
                autoStruct['E'] = ['Superior', 'Medial', 'Inferior', 'Tríceps', 'Tríceps', 'Supra', 'Infra']; 
                autoStruct['F'] = ['Puxadas', 'Remadas', 'Posterior', 'Trapézio', 'Lateral', 'Bíceps', 'Antebraço']; 
            } 
            else if (t === 'MASC_HIPER_5X' && dCount === 5) {
                autoStruct['A'] = ['Superior', 'Medial', 'Inferior', 'Supra', 'Infra', 'Completo'];
                autoStruct['B'] = ['Puxadas', 'Remadas', 'Puxadas', 'Remadas', 'Lombar', 'Antebraço'];
                autoStruct['C'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos', 'Panturrilha'];
                autoStruct['D'] = ['Ombro Multiarticular', 'Frontal', 'Lateral', 'Posterior', 'Trapézio'];
                autoStruct['E'] = ['Bíceps', 'Tríceps', 'Bíceps', 'Tríceps', 'Antebraço']; 
            }
            else if (t === 'MASC_HIPER_4X' && dCount === 4) {
                autoStruct['A'] = ['Superior', 'Medial', 'Inferior', 'Ombro Multiarticular', 'Lateral', 'Bíceps', 'Bíceps'];
                autoStruct['B'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos', 'Panturrilha'];
                autoStruct['C'] = ['Puxadas', 'Remadas', 'Puxadas', 'Lombar', 'Posterior', 'Trapézio'];
                autoStruct['D'] = ['Superior', 'Medial', 'Inferior', 'Tríceps', 'Tríceps', 'Supra', 'Infra'];
            }
            else if (t === 'MASC_CASA_3X' && dCount === 3) {
                autoStruct['A'] = ['Quadríceps e Adutores', 'Multiarticular', 'Posteriores', 'Glúteos', 'Panturrilha']; 
                autoStruct['B'] = ['Superior', 'Medial', 'Inferior', 'Bíceps', 'Bíceps', 'Supra', 'Infra']; 
                autoStruct['C'] = ['Puxadas', 'Remadas', 'Lombar', 'Ombro Multiarticular', 'Frontal', 'Lateral', 'Tríceps', 'Tríceps']; 
            }

            // ======= MATRIZES FEMININAS REAIS (INJETANDO VOLUME MASSIVO) =======
            else if (t === 'FEM_EMAG_6X' && dCount >= 6) {
                autoStruct['A'] = ['Multiarticular', 'Multiarticular', 'Quadríceps e Adutores', 'Quadríceps e Adutores', 'Glúteos']; 
                autoStruct['B'] = ['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Bíceps']; 
                autoStruct['C'] = ['Posteriores', 'Posteriores', 'Glúteos', 'Panturrilha', 'Panturrilha']; 
                autoStruct['D'] = ['Superior', 'Medial', 'Inferior', 'Tríceps', 'Tríceps', 'Supra', 'Infra']; 
                autoStruct['E'] = ['Multiarticular', 'Multiarticular', 'Quadríceps e Adutores', 'Glúteos']; 
                autoStruct['F'] = ['Cardio Pós', 'Supra', 'Infra', 'Completo', 'Core']; 
            }
            else if (t === 'FEM_HIPER_5X' && dCount === 5) {
                autoStruct['A'] = ['Glúteos', 'Glúteos', 'Posteriores', 'Posteriores', 'Panturrilha']; 
                autoStruct['B'] = ['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Supra', 'Infra']; 
                autoStruct['C'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Panturrilha']; 
                autoStruct['D'] = ['Puxadas', 'Remadas', 'Superior', 'Tríceps', 'Tríceps']; 
                autoStruct['E'] = ['Glúteos', 'Glúteos', 'Supra', 'Infra', 'Cardio Pós']; 
            }
            else if (t === 'FEM_EMAG_4X' && dCount === 4) {
                autoStruct['A'] = ['Glúteos', 'Glúteos', 'Posteriores', 'Posteriores', 'Panturrilha'];
                autoStruct['B'] = ['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Supra', 'Infra'];
                autoStruct['C'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Panturrilha'];
                autoStruct['D'] = ['Bíceps', 'Bíceps', 'Tríceps', 'Tríceps', 'Cardio Pós', 'Core'];
            }
            else if (t === 'FEM_CASA_3X' && dCount === 3) {
                autoStruct['A'] = ['Multiarticular', 'Multiarticular', 'Quadríceps e Adutores', 'Posteriores', 'Glúteos', 'Panturrilha']; 
                autoStruct['B'] = ['Puxadas', 'Remadas', 'Ombro Multiarticular', 'Bíceps', 'Supra', 'Infra']; 
                autoStruct['C'] = ['Multiarticular', 'Quadríceps e Adutores', 'Posteriores', 'Glúteos', 'Glúteos']; 
            }
            
            // ======= FALLBACK GENÉRICO SEGURO (SE VOCÊ PUXAR DA ANAMNESE E NÃO ESCOLHER ATALHO) =======
            else {
                if (isFem) {
                    if (dCount === 3) {
                        autoStruct['A'] = ['Quadríceps e Adutores', 'Multiarticular', 'Glúteos', 'Glúteos', 'Panturrilha'];
                        autoStruct['B'] = ['Puxadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Tríceps', 'Bíceps', 'Supra', 'Infra'];
                        autoStruct['C'] = ['Posteriores', 'Posteriores', 'Glúteos', 'Panturrilha'];
                    } else if (dCount === 4) {
                        autoStruct['A'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos', 'Panturrilha'];
                        autoStruct['B'] = ['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Supra', 'Infra'];
                        autoStruct['C'] = ['Posteriores', 'Posteriores', 'Glúteos', 'Glúteos', 'Panturrilha'];
                        autoStruct['D'] = ['Superior', 'Tríceps', 'Tríceps', 'Bíceps', 'Cardio Pós'];
                    } else if (dCount >= 5) {
                        autoStruct['A'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos'];
                        autoStruct['B'] = ['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Supra', 'Infra'];
                        autoStruct['C'] = ['Posteriores', 'Posteriores', 'Glúteos', 'Glúteos', 'Panturrilha'];
                        autoStruct['D'] = ['Superior', 'Tríceps', 'Tríceps', 'Bíceps', 'Bíceps', 'Cardio Pós'];
                        autoStruct['E'] = ['Multiarticular', 'Quadríceps e Adutores', 'Glúteos', 'Panturrilha'];
                        if(dCount >= 6) autoStruct['F'] = ['Cardio Pós', 'Supra', 'Infra', 'Core', 'Completo']; 
                    }
                } else {
                    // 🔥 MASCULINO GENÉRICO CORRIGIDO (ZERO MISTURA DE MEMBROS SUPERIORES COM INFERIORES) 🔥
                    if (dCount === 3) {
                        autoStruct['A'] = ['Superior', 'Medial', 'Inferior', 'Ombro Multiarticular', 'Tríceps', 'Tríceps', 'Supra'];
                        autoStruct['B'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Posteriores', 'Glúteos', 'Panturrilha'];
                        autoStruct['C'] = ['Puxadas', 'Remadas', 'Remadas', 'Trapézio', 'Bíceps', 'Bíceps', 'Lombar'];
                    } else if (dCount === 4) {
                        autoStruct['A'] = ['Superior', 'Medial', 'Inferior', 'Tríceps', 'Tríceps', 'Supra', 'Infra']; 
                        autoStruct['B'] = ['Puxadas', 'Remadas', 'Remadas', 'Trapézio', 'Bíceps', 'Bíceps', 'Lombar']; 
                        autoStruct['C'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos', 'Panturrilha']; 
                        autoStruct['D'] = ['Ombro Multiarticular', 'Frontal', 'Lateral', 'Posterior', 'Cardio Pós']; 
                    } else if (dCount >= 5) {
                        autoStruct['A'] = ['Superior', 'Medial', 'Inferior', 'Supra', 'Infra', 'Completo']; 
                        autoStruct['B'] = ['Puxadas', 'Remadas', 'Remadas', 'Bíceps', 'Bíceps', 'Lombar']; 
                        autoStruct['C'] = ['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Panturrilha']; 
                        
                        // 🔥 OMBROS E TRÍCEPS JUNTOS AQUI, LONGE DA PERNA! 🔥
                        autoStruct['D'] = ['Ombro Multiarticular', 'Frontal', 'Lateral', 'Posterior', 'Trapézio', 'Tríceps', 'Tríceps']; 
                        
                        // 🔥 APENAS PERNAS (POSTERIOR) NO DIA E 🔥
                        autoStruct['E'] = ['Posteriores', 'Posteriores', 'Glúteos', 'Panturrilha']; 
                        if(dCount >= 6) autoStruct['F'] = ['Cardio Pós', 'Supra', 'Infra', 'Completo', 'Core']; 
                    }
                }
            }
            setStructure(autoStruct);
        };
        generateAutoFill();
    }, [config.days, config.gender, config.template]);

    const checkLimitation = (muscleId) => {
        const lims = config.limitations?.join(' ').toLowerCase() || '';
        if (!lims) return false;
        if ((lims.includes('joelho') || lims.includes('patel') || lims.includes('lca') || lims.includes('menisco')) && 
            (muscleId === 'Quadríceps e Adutores' || muscleId === 'Multiarticular' || muscleId === 'Posteriores' || muscleId === 'Panturrilha')) return true;
        if ((lims.includes('ombro') || lims.includes('bursite') || lims.includes('manguito')) && 
            (muscleId === 'Superior' || muscleId === 'Medial' || muscleId === 'Inferior' || muscleId === 'Ombro Multiarticular' || muscleId === 'Frontal' || muscleId === 'Lateral')) return true;
        if ((lims.includes('lombar') || lims.includes('hernia') || lims.includes('ciático')) && 
            (muscleId === 'Lombar' || muscleId === 'Remadas' || muscleId === 'Multiarticular')) return true;
        if ((lims.includes('silicone') || lims.includes('prótese')) && 
            (muscleId === 'Superior' || muscleId === 'Medial' || muscleId === 'Inferior')) return true;
        return false;
    };

    const calculateTime = (dayMuscles) => {
        let total = 0;
        dayMuscles.forEach(mId => {
            MUSCLE_GROUPS.forEach(g => {
                const found = g.items.find(i => i.id === mId);
                if (found) total += found.time;
            });
        });
        return total;
    };

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

    const handleCopyDay = () => {
        const currentIndex = daysArray.indexOf(activeDay);
        if (currentIndex > 0) {
            const prevDay = daysArray[currentIndex - 1];
            setStructure(prev => ({ ...prev, [activeDay]: [...prev[prevDay]] }));
        }
        setOptionsModalVisible(false);
    };

    const handleClearDay = () => {
        setStructure(prev => ({ ...prev, [activeDay]: [] }));
        setOptionsModalVisible(false);
    };

    const handleSwapDay = (targetDay) => {
        setStructure(prev => {
            const newStruct = { ...prev };
            const temp = newStruct[activeDay];
            newStruct[activeDay] = newStruct[targetDay];
            newStruct[targetDay] = temp;
            return newStruct;
        });
        setOptionsModalVisible(false);
    };

    const handleNextStep = () => {
        navigation.navigate('MontarTreinoAdmin', { 
            aluno: config.student,
            laboratoryConfig: config, 
            laboratoryStructure: structure,
            isTemplateMode: config.mode === 'MATRIZ' 
        });
    };

    const currentVolumeTime = calculateTime(structure[activeDay]);
    const isOverVolume = currentVolumeTime > (config.time + 10); 

    const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg, overflow: 'hidden', display: 'flex', flexDirection: 'column' } : { flex: 1, backgroundColor: theme.bg };

    return (
        <SafeAreaView style={rootStyle}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                    
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>ESQUELETO</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>{config.days} DIAS • {config.gender}</Text>
                        </View>
                        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surface }]} onPress={() => setOptionsModalVisible(true)}>
                            <MaterialCommunityIcons name="dots-vertical" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                        <TouchableOpacity 
                            style={[styles.dayDropdownButton, { backgroundColor: theme.surface, borderColor: theme.accent }]}
                            onPress={() => setDayModalVisible(true)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <MaterialCommunityIcons name="calendar-month" size={22} color={theme.accent} />
                                <View>
                                    <Text style={[styles.dayDropdownTitle, { color: theme.text }]}>TREINO DO DIA {activeDay}</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>{structure[activeDay]?.length || 0} Músculos Selecionados</Text>
                                </View>
                            </View>
                            <MaterialCommunityIcons name="chevron-down" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={[styles.radarBox, { backgroundColor: isOverVolume ? '#FF3B3015' : theme.surface, borderColor: isOverVolume ? '#FF3B30' : theme.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <MaterialCommunityIcons name="clock-outline" size={20} color={isOverVolume ? '#FF3B30' : theme.accent} />
                                <Text style={[styles.infoText, { color: isOverVolume ? '#FF3B30' : theme.text, fontWeight: 'bold' }]}>
                                    Estimativa Volume: {currentVolumeTime} min
                                </Text>
                            </View>
                            {isOverVolume && <Text style={{ color: '#FF3B30', fontSize: 10, marginTop: 4, fontWeight: 'bold' }}>Risco de treino longo. Alvo: {config.time}min</Text>}
                        </View>

                        <View style={[styles.searchBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                            <TextInput 
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="Procurar músculo..."
                                placeholderTextColor={theme.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {MUSCLE_GROUPS.map((group, index) => {
                            const filteredItems = group.items.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase()));
                            if (filteredItems.length === 0) return null;

                            return (
                                <SectionCard key={index} title={group.category} theme={theme}>
                                    <View style={styles.grid}>
                                        {filteredItems.map(muscle => {
                                            const isSelected = structure[activeDay].includes(muscle.id);
                                            const hasLimitation = checkLimitation(muscle.id);

                                            return (
                                                <TouchableOpacity 
                                                    key={muscle.id}
                                                    style={[styles.muscleCard, { backgroundColor: theme.bg, borderColor: hasLimitation ? '#FF3B30' : theme.border, borderWidth: hasLimitation ? 1.5 : 1 }, isSelected && { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}
                                                    onPress={() => toggleMuscle(muscle.id)}
                                                >
                                                    <View style={[styles.checkbox, { borderColor: theme.border }, isSelected && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                                                        {isSelected && <MaterialCommunityIcons name="check" size={12} color={theme.isDark ? '#000' : '#FFF'} />}
                                                    </View>
                                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                        <Text style={[styles.muscleText, { color: theme.text }, isSelected && { color: theme.accent, fontWeight: 'bold' }]} numberOfLines={2}>{muscle.label}</Text>
                                                        {hasLimitation && <MaterialCommunityIcons name="alert" size={14} color="#FF3B30" />}
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </SectionCard>
                            );
                        })}
                    </ScrollView>

                    <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.accent }]} onPress={handleNextStep}>
                            <Text style={[styles.actionButtonText, { color: theme.isDark ? '#000' : '#FFF' }]}>GERAR ESTRUTURA FINAL</Text>
                            <MaterialCommunityIcons name="arrow-right" size={22} color={theme.isDark ? '#000' : '#FFF'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Modal visible={dayModalVisible} transparent animationType="fade" onRequestClose={() => setDayModalVisible(false)}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDayModalVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>ESCOLHA O DIA</Text>
                        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                            {daysArray.map(day => (
                                <TouchableOpacity 
                                    key={day} 
                                    style={[styles.dropdownItem, { borderBottomColor: theme.border }, activeDay === day && { backgroundColor: theme.accent + '22' }]}
                                    onPress={() => { setActiveDay(day); setDayModalVisible(false); }}
                                >
                                    <View>
                                        <Text style={[styles.studentName, { color: activeDay === day ? theme.accent : theme.text }]}>Treino do DIA {day}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>{structure[day].length} Músculos</Text>
                                    </View>
                                    {activeDay === day && <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={optionsModalVisible} transparent animationType="fade" onRequestClose={() => setOptionsModalVisible(false)}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOptionsModalVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        
                        <Text style={[styles.modalTitle, { color: theme.text }]}>OPÇÕES (DIA {activeDay})</Text>
                        <TouchableOpacity style={[styles.dropdownItem, { borderBottomColor: theme.border }]} onPress={handleClearDay}>
                            <Text style={[styles.studentName, { color: '#FF3B30' }]}>Limpar Dia (Remover todos)</Text>
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>

                        <Text style={[styles.modalTitle, { color: theme.text, marginTop: 25, fontSize: 12 }]}>REORGANIZAR TREINO</Text>
                        <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                            {daysArray.filter(d => d !== activeDay).map(targetDay => (
                                <TouchableOpacity 
                                    key={targetDay} 
                                    style={[styles.dropdownItem, { borderBottomColor: theme.border }]} 
                                    onPress={() => handleSwapDay(targetDay)}
                                >
                                    <View>
                                        <Text style={[styles.studentName, { color: theme.text }]}>Trocar com o DIA {targetDay}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>Atualmente com {structure[targetDay].length} músculos</Text>
                                    </View>
                                    <MaterialCommunityIcons name="swap-horizontal" size={20} color={theme.accent} />
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
    dayDropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 14, borderWidth: 1.5 },
    dayDropdownTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, flexGrow: 1 },
    radarBox: { padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1 },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 15, height: 45, borderWidth: 1, marginBottom: 20 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, outlineStyle: 'none' },
    infoText: { fontSize: 12 },
    sectionCard: { borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1 },
    groupTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 12, opacity: 0.8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }, 
    muscleCard: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, minHeight: 50, gap: 10 },
    checkbox: { width: 18, height: 18, borderRadius: 6, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    muscleText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
    footer: { width: '100%', paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
    actionButtonText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: 20 },
    modalContent: { width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 24, padding: 20, borderWidth: 1 },
    modalTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 15, textAlign: 'center' },
    dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
    studentName: { fontSize: 14, fontWeight: 'bold' },
});