// src/screens/LaboratoryBuilderScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import { 
    View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
    StyleSheet, StatusBar, Platform, TextInput, Modal 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authHeaders } from '../utils/authToken';

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
    
    // 🔥 ESTADO DO AMBIENTE 🔥
    const [activeEnvironment, setActiveEnvironment] = useState(
        config.template?.includes('CASA') ? 'CASA' : 'ACADEMIA'
    );

    const daysArray = Array.from({ length: config.days }, (_, i) => String.fromCharCode(65 + i)); 
    const [activeDay, setActiveDay] = useState(daysArray[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [dayModalVisible, setDayModalVisible] = useState(false);
    const [drawerMuscle, setDrawerMuscle] = useState(null);

    const [structure, setStructure] = useState(daysArray.reduce((acc, day) => ({ ...acc, [day]: [] }), {}));
    const [fetchedExercises, setFetchedExercises] = useState([]);

    // 🔥 BUSCA OS EXERCÍCIOS DIRETOS DA BIBLIOTECA REAL 🔥
    useEffect(() => {
        const fetchRealExercises = async () => {
            const cached = await AsyncStorage.getItem('@global_exercises');
            if (cached) setFetchedExercises(JSON.parse(cached));
            
            try {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const adminId = JSON.parse(userJson).id;
                    const res = await fetch(`https://fitos-final.onrender.com/api/exercise?adminId=${adminId}&t=${Date.now()}`, { headers: { ...(await authHeaders()) } });
                    if (res.ok) {
                        const data = await res.json();
                        setFetchedExercises(data);
                        AsyncStorage.setItem('@global_exercises', JSON.stringify(data));
                    }
                }
            } catch(e) { console.log('Erro cache lab:', e); }
        };
        fetchRealExercises();
    }, []);

    // 🔥 O CÉREBRO: Constrói a lista dinamicamente filtrando pelas TAGS REAIS do BD 🔥
    const dynamicExerciseDB = useMemo(() => {
        const db = {};
        MUSCLE_GROUPS.forEach(g => g.items.forEach(i => db[i.id] = []));

        fetchedExercises.forEach(ex => {
            // Filtro absoluto pela raiz!
            const envs = ex.environments || ['ACADEMIA'];
            if (!envs.includes(activeEnvironment)) return;

            let targetId = null;
            if (ex.category === 'Cardio') targetId = 'Cardio Pós';
            else if (ex.category === 'Bíceps') targetId = 'Bíceps';
            else if (ex.category === 'Tríceps') targetId = 'Tríceps';
            else if (ex.category === 'Antebraço') targetId = 'Antebraço';
            else if (ex.category === 'Peito') targetId = (ex.subCategory && ex.subCategory !== 'Geral' && ex.subCategory !== 'Todos') ? ex.subCategory : 'Medial';
            else if (ex.category === 'Costas') targetId = (ex.subCategory && ex.subCategory !== 'Geral' && ex.subCategory !== 'Todos') ? ex.subCategory : 'Remadas';
            else if (ex.category === 'Pernas') targetId = (ex.subCategory && ex.subCategory !== 'Geral' && ex.subCategory !== 'Todos') ? ex.subCategory : 'Multiarticular';
            else if (ex.category === 'Abdômen') targetId = (ex.subCategory && ex.subCategory !== 'Geral' && ex.subCategory !== 'Todos') ? ex.subCategory : 'Supra';
            else if (ex.category === 'Ombros') {
                const sub = (ex.subCategory && ex.subCategory !== 'Geral' && ex.subCategory !== 'Todos') ? ex.subCategory : 'Multiarticular';
                targetId = sub === 'Multiarticular' ? 'Ombro Multiarticular' : sub;
            }

            if (targetId && db[targetId]) {
                db[targetId].push(ex.name);
            }
        });

        return db;
    }, [fetchedExercises, activeEnvironment]);

    // 🔥 MOTOR DE INJEÇÃO 🔥
    useEffect(() => {
        if (fetchedExercises.length === 0) return; // Aguarda o banco carregar

        const generateAutoFill = () => {
            let autoStruct = daysArray.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
            const t = config.template;
            const dCount = config.days;
            const isFem = config.gender === 'FEMININO';

            const getExercisesForDay = (musclesArray) => {
                let used = new Set();
                return musclesArray.map(m => {
                    const opts = dynamicExerciseDB[m] || [];
                    const avail = opts.filter(o => !used.has(o));
                    // Se não tiver exercício liberado pro ambiente (ex: Puxada em Casa e a base estiver vazia), coloca um Placeholder avisando
                    const chosen = avail.length > 0 ? avail[0] : (opts[0] || `[Vazio] Ex. de ${m}`);
                    used.add(chosen);
                    return { tempId: Math.random().toString(), muscle: m, name: chosen };
                });
            };

            // ======= MATRIZES MASCULINAS =======
            if (t === 'MASC_EMAG_6X' && dCount >= 6) {
                autoStruct['A'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Quadríceps e Adutores', 'Panturrilha']); 
                autoStruct['B'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Ombro Multiarticular', 'Frontal', 'Lateral', 'Tríceps']); 
                autoStruct['C'] = getExercisesForDay(['Puxadas', 'Remadas', 'Puxadas', 'Remadas', 'Bíceps', 'Bíceps', 'Supra', 'Infra']); 
                autoStruct['D'] = getExercisesForDay(['Posteriores', 'Posteriores', 'Glúteos', 'Multiarticular', 'Panturrilha']); 
                autoStruct['E'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Tríceps', 'Tríceps', 'Supra', 'Infra']); 
                autoStruct['F'] = getExercisesForDay(['Puxadas', 'Remadas', 'Posterior', 'Trapézio', 'Lateral', 'Bíceps', 'Antebraço']); 
            } 
            else if (t === 'MASC_HIPER_5X' && dCount === 5) {
                autoStruct['A'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Supra', 'Infra', 'Completo']);
                autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Puxadas', 'Remadas', 'Lombar', 'Antebraço']);
                autoStruct['C'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos', 'Panturrilha']);
                autoStruct['D'] = getExercisesForDay(['Ombro Multiarticular', 'Frontal', 'Lateral', 'Posterior', 'Trapézio']);
                autoStruct['E'] = getExercisesForDay(['Bíceps', 'Tríceps', 'Bíceps', 'Tríceps', 'Antebraço']); 
            }
            else if (t === 'MASC_HIPER_4X' && dCount === 4) {
                autoStruct['A'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Ombro Multiarticular', 'Lateral', 'Bíceps', 'Bíceps']);
                autoStruct['B'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos', 'Panturrilha']);
                autoStruct['C'] = getExercisesForDay(['Puxadas', 'Remadas', 'Puxadas', 'Lombar', 'Posterior', 'Trapézio']);
                autoStruct['D'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Tríceps', 'Tríceps', 'Supra', 'Infra']);
            }
            else if (t === 'MASC_CASA_3X' && dCount === 3) {
                autoStruct['A'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Posteriores', 'Glúteos', 'Panturrilha']); 
                autoStruct['B'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Bíceps', 'Bíceps', 'Supra', 'Infra']); 
                autoStruct['C'] = getExercisesForDay(['Puxadas', 'Remadas', 'Lombar', 'Ombro Multiarticular', 'Frontal', 'Lateral', 'Tríceps', 'Tríceps']); 
            }
            // ======= MATRIZES FEMININAS =======
            else if (t === 'FEM_EMAG_6X' && dCount >= 6) {
                autoStruct['A'] = getExercisesForDay(['Multiarticular', 'Multiarticular', 'Quadríceps e Adutores', 'Quadríceps e Adutores', 'Glúteos']); 
                autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Bíceps']); 
                autoStruct['C'] = getExercisesForDay(['Posteriores', 'Posteriores', 'Glúteos', 'Panturrilha', 'Panturrilha']); 
                autoStruct['D'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Tríceps', 'Tríceps', 'Supra', 'Infra']); 
                autoStruct['E'] = getExercisesForDay(['Multiarticular', 'Multiarticular', 'Quadríceps e Adutores', 'Glúteos']); 
                autoStruct['F'] = getExercisesForDay(['Cardio Pós', 'Supra', 'Infra', 'Completo', 'Core']); 
            }
            else if (t === 'FEM_HIPER_5X' && dCount === 5) {
                autoStruct['A'] = getExercisesForDay(['Glúteos', 'Glúteos', 'Posteriores', 'Posteriores', 'Panturrilha']); 
                autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Supra', 'Infra']); 
                autoStruct['C'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Panturrilha']); 
                autoStruct['D'] = getExercisesForDay(['Puxadas', 'Remadas', 'Superior', 'Tríceps', 'Tríceps']); 
                autoStruct['E'] = getExercisesForDay(['Glúteos', 'Glúteos', 'Supra', 'Infra', 'Cardio Pós']); 
            }
            else if (t === 'FEM_EMAG_4X' && dCount === 4) {
                autoStruct['A'] = getExercisesForDay(['Glúteos', 'Glúteos', 'Posteriores', 'Posteriores', 'Panturrilha']);
                autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Supra', 'Infra']);
                autoStruct['C'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Panturrilha']);
                autoStruct['D'] = getExercisesForDay(['Bíceps', 'Bíceps', 'Tríceps', 'Tríceps', 'Cardio Pós', 'Core']);
            }
            else if (t === 'FEM_CASA_3X' && dCount === 3) {
                autoStruct['A'] = getExercisesForDay(['Multiarticular', 'Multiarticular', 'Quadríceps e Adutores', 'Posteriores', 'Glúteos', 'Panturrilha']); 
                autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Ombro Multiarticular', 'Bíceps', 'Supra', 'Infra']); 
                autoStruct['C'] = getExercisesForDay(['Multiarticular', 'Quadríceps e Adutores', 'Posteriores', 'Glúteos', 'Glúteos']); 
            }
            // ======= FALLBACK GENÉRICO =======
            else {
                if (isFem) {
                    if (dCount === 3) {
                        autoStruct['A'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Glúteos', 'Glúteos', 'Panturrilha']);
                        autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Tríceps', 'Bíceps', 'Supra', 'Infra']);
                        autoStruct['C'] = getExercisesForDay(['Posteriores', 'Posteriores', 'Glúteos', 'Panturrilha']);
                    } else if (dCount === 4) {
                        autoStruct['A'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos', 'Panturrilha']);
                        autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Supra', 'Infra']);
                        autoStruct['C'] = getExercisesForDay(['Posteriores', 'Posteriores', 'Glúteos', 'Glúteos', 'Panturrilha']);
                        autoStruct['D'] = getExercisesForDay(['Superior', 'Tríceps', 'Tríceps', 'Bíceps', 'Cardio Pós']);
                    } else if (dCount >= 5) {
                        autoStruct['A'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos']);
                        autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Remadas', 'Ombro Multiarticular', 'Lateral', 'Supra', 'Infra']);
                        autoStruct['C'] = getExercisesForDay(['Posteriores', 'Posteriores', 'Glúteos', 'Glúteos', 'Panturrilha']);
                        autoStruct['D'] = getExercisesForDay(['Superior', 'Tríceps', 'Tríceps', 'Bíceps', 'Bíceps', 'Cardio Pós']);
                        autoStruct['E'] = getExercisesForDay(['Multiarticular', 'Quadríceps e Adutores', 'Glúteos', 'Panturrilha']);
                        if(dCount >= 6) autoStruct['F'] = getExercisesForDay(['Cardio Pós', 'Supra', 'Infra', 'Core', 'Completo']); 
                    }
                } else {
                    if (dCount === 3) {
                        autoStruct['A'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Ombro Multiarticular', 'Tríceps', 'Tríceps', 'Supra']);
                        autoStruct['B'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Posteriores', 'Glúteos', 'Panturrilha']);
                        autoStruct['C'] = getExercisesForDay(['Puxadas', 'Remadas', 'Remadas', 'Trapézio', 'Bíceps', 'Bíceps', 'Lombar']);
                    } else if (dCount === 4) {
                        autoStruct['A'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Tríceps', 'Tríceps', 'Supra', 'Infra']); 
                        autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Remadas', 'Trapézio', 'Bíceps', 'Bíceps', 'Lombar']); 
                        autoStruct['C'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Glúteos', 'Panturrilha']); 
                        autoStruct['D'] = getExercisesForDay(['Ombro Multiarticular', 'Frontal', 'Lateral', 'Posterior', 'Cardio Pós']); 
                    } else if (dCount >= 5) {
                        autoStruct['A'] = getExercisesForDay(['Superior', 'Medial', 'Inferior', 'Supra', 'Infra', 'Completo']); 
                        autoStruct['B'] = getExercisesForDay(['Puxadas', 'Remadas', 'Remadas', 'Bíceps', 'Bíceps', 'Lombar']); 
                        autoStruct['C'] = getExercisesForDay(['Quadríceps e Adutores', 'Multiarticular', 'Multiarticular', 'Panturrilha']); 
                        autoStruct['D'] = getExercisesForDay(['Ombro Multiarticular', 'Frontal', 'Lateral', 'Posterior', 'Trapézio', 'Tríceps', 'Tríceps']); 
                        autoStruct['E'] = getExercisesForDay(['Posteriores', 'Posteriores', 'Glúteos', 'Panturrilha']); 
                        if(dCount >= 6) autoStruct['F'] = getExercisesForDay(['Cardio Pós', 'Supra', 'Infra', 'Completo', 'Core']); 
                    }
                }
            }
            setStructure(autoStruct);
        };
        generateAutoFill();
    }, [config.days, config.gender, config.template, activeEnvironment, dynamicExerciseDB]);

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

    const calculateTime = (dayExercises) => {
        let total = 0;
        dayExercises.forEach(ex => {
            MUSCLE_GROUPS.forEach(g => {
                const found = g.items.find(i => i.id === ex.muscle);
                if (found) total += found.time;
            });
        });
        return total;
    };

    const toggleExerciseInDrawer = (exerciseName) => {
        setStructure(prev => {
            const dayExs = prev[activeDay];
            const exists = dayExs.some(ex => ex.muscle === drawerMuscle && ex.name === exerciseName);
            if (exists) {
                return { ...prev, [activeDay]: dayExs.filter(ex => !(ex.muscle === drawerMuscle && ex.name === exerciseName)) };
            } else {
                return { ...prev, [activeDay]: [...dayExs, { tempId: Math.random().toString(), muscle: drawerMuscle, name: exerciseName }] };
            }
        });
    };

    const moveExerciseInBuilder = (index, direction) => {
        setStructure(prev => {
            const dayExs = [...prev[activeDay]];
            if (direction === 'up' && index > 0) {
                [dayExs[index - 1], dayExs[index]] = [dayExs[index], dayExs[index - 1]];
            } else if (direction === 'down' && index < dayExs.length - 1) {
                [dayExs[index], dayExs[index + 1]] = [dayExs[index + 1], dayExs[index]];
            }
            return { ...prev, [activeDay]: dayExs };
        });
    };

    const removeExerciseFromBuilder = (tempId) => {
        setStructure(prev => ({
            ...prev,
            [activeDay]: prev[activeDay].filter(ex => ex.tempId !== tempId)
        }));
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
                <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 960 : '100%', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                    
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

                    <View style={[styles.envTabsContainer, { borderBottomColor: theme.border }]}>
                        {['ACADEMIA', 'CONDOMÍNIO', 'CASA'].map(env => (
                            <TouchableOpacity 
                                key={env} 
                                style={[
                                    styles.envTab, 
                                    activeEnvironment === env 
                                        ? { backgroundColor: theme.accent, borderColor: theme.accent } 
                                        : { backgroundColor: theme.surface, borderColor: theme.border }
                                ]} 
                                onPress={() => setActiveEnvironment(env)}
                            >
                                <MaterialCommunityIcons 
                                    name={env === 'CASA' ? 'home-outline' : env === 'CONDOMÍNIO' ? 'office-building' : 'dumbbell'} 
                                    size={14} 
                                    color={activeEnvironment === env ? '#000' : theme.textSecondary} 
                                />
                                <Text style={{color: activeEnvironment === env ? '#000' : theme.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>
                                    {env}
                                </Text>
                            </TouchableOpacity>
                        ))}
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
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>{structure[activeDay]?.length || 0} Exercícios</Text>
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
                                placeholder="Procurar grupo muscular..."
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
                                            const selectedCount = structure[activeDay].filter(ex => ex.muscle === muscle.id).length;
                                            const hasLimitation = checkLimitation(muscle.id);

                                            return (
                                                <TouchableOpacity 
                                                    key={muscle.id}
                                                    style={[
                                                        styles.muscleCard, 
                                                        { backgroundColor: theme.bg, borderColor: hasLimitation ? '#FF3B30' : theme.border, borderWidth: hasLimitation ? 1.5 : 1 }, 
                                                        selectedCount > 0 && { backgroundColor: theme.accent + '15', borderColor: theme.accent }
                                                    ]}
                                                    onPress={() => setDrawerMuscle(muscle.id)} 
                                                >
                                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={[styles.muscleText, { color: theme.text }, selectedCount > 0 && { color: theme.accent, fontWeight: '900' }]} numberOfLines={2}>
                                                            {muscle.label}
                                                        </Text>
                                                        {hasLimitation && <MaterialCommunityIcons name="alert" size={14} color="#FF3B30" />}
                                                    </View>
                                                    {selectedCount > 0 && (
                                                        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                                                            <Text style={[styles.badgeText, { color: theme.isDark ? '#000' : '#FFF' }]}>{selectedCount}</Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </SectionCard>
                            );
                        })}

                        {structure[activeDay].length > 0 && (
                            <View style={{ marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.border }}>
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 15 }]}>ORDEM DO TREINO</Text>
                                {structure[activeDay].map((ex, index) => (
                                    <View key={ex.tempId} style={[styles.selectedExRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <View style={styles.selectedExInfo}>
                                            <Text style={[styles.selectedExNumber, { color: theme.accent }]}>{index + 1}.</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.selectedExName, { color: theme.text }]} numberOfLines={1}>{ex.name}</Text>
                                                <Text style={[styles.selectedExMuscle, { color: theme.textSecondary }]}>{ex.muscle}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{ flexDirection: 'row', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 10, overflow: 'hidden' }}>
                                                <TouchableOpacity style={[styles.moveBtnInline, { opacity: index === 0 ? 0.3 : 1 }]} onPress={() => moveExerciseInBuilder(index, 'up')} disabled={index === 0}>
                                                    <MaterialCommunityIcons name="arrow-up" size={16} color={theme.textSecondary} />
                                                </TouchableOpacity>
                                                <View style={{ width: 1, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                                <TouchableOpacity style={[styles.moveBtnInline, { opacity: index === structure[activeDay].length - 1 ? 0.3 : 1 }]} onPress={() => moveExerciseInBuilder(index, 'down')} disabled={index === structure[activeDay].length - 1}>
                                                    <MaterialCommunityIcons name="arrow-down" size={16} color={theme.textSecondary} />
                                                </TouchableOpacity>
                                            </View>

                                            <TouchableOpacity style={styles.deleteBtnInline} onPress={() => removeExerciseFromBuilder(ex.tempId)}>
                                                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                    </ScrollView>

                    <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.accent }]} onPress={handleNextStep}>
                            <Text style={[styles.actionButtonText, { color: theme.isDark ? '#000' : '#FFF' }]}>GERAR ESTRUTURA FINAL</Text>
                            <MaterialCommunityIcons name="arrow-right" size={22} color={theme.isDark ? '#000' : '#FFF'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Modal visible={!!drawerMuscle} transparent animationType="slide" onRequestClose={() => setDrawerMuscle(null)}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDrawerMuscle(null)}>
                    <View style={[styles.drawerContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        
                        <View style={styles.drawerHeader}>
                            <Text style={[styles.drawerTitle, { color: theme.text }]}>EXERCÍCIOS: <Text style={{color: theme.accent}}>{drawerMuscle?.toUpperCase()}</Text></Text>
                            <TouchableOpacity onPress={() => setDrawerMuscle(null)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                            {(dynamicExerciseDB[drawerMuscle] || []).map((exName, i) => {
                                const isOptSelected = structure[activeDay].some(ex => ex.muscle === drawerMuscle && ex.name === exName);
                                return (
                                    <TouchableOpacity 
                                        key={i} 
                                        style={[
                                            styles.drawerOption, 
                                            { borderBottomColor: theme.border },
                                            isOptSelected && { backgroundColor: theme.accent + '15', borderRadius: 10, borderBottomWidth: 0, marginBottom: 5 }
                                        ]}
                                        onPress={() => toggleExerciseInDrawer(exName)}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.drawerOptionText, { color: isOptSelected ? theme.accent : theme.text, fontWeight: isOptSelected ? 'bold' : 'normal' }]}>
                                                {exName}
                                            </Text>
                                        </View>
                                        <View style={[styles.checkboxDrawer, { borderColor: theme.border }, isOptSelected && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                                            {isOptSelected && <MaterialCommunityIcons name="check" size={14} color={theme.isDark ? '#000' : '#FFF'} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            
                            {/* 🔥 AVISO SE A LISTA FICAR VAZIA PARA O AMBIENTE ATUAL 🔥 */}
                            {(dynamicExerciseDB[drawerMuscle] || []).length === 0 && (
                                <Text style={{textAlign: 'center', marginTop: 40, color: theme.textSecondary}}>Nenhum exercício encontrado com a tag "{activeEnvironment}" para esse músculo.</Text>
                            )}
                        </ScrollView>
                        
                        <View style={[styles.drawerFooter, { borderTopColor: theme.border }]}>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.accent }]} onPress={() => setDrawerMuscle(null)}>
                                <Text style={[styles.actionButtonText, { color: theme.isDark ? '#000' : '#FFF' }]}>CONCLUIR SELEÇÃO</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </TouchableOpacity>
            </Modal>

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
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>{structure[day].length} Exercícios</Text>
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
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>Atualmente com {structure[targetDay].length} exercícios</Text>
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
    
    envTabsContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, borderBottomWidth: 1 },
    envTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },

    dayDropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 14, borderWidth: 1.5 },
    dayDropdownTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, flexGrow: 1 },
    radarBox: { padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1 },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 15, height: 45, borderWidth: 1, marginBottom: 20 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, outlineStyle: 'none' },
    infoText: { fontSize: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    sectionCard: { borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1 },
    groupTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 12, opacity: 0.8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }, 
    muscleCard: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, minHeight: 50, gap: 10 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '900' },
    muscleText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
    
    selectedExRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
    selectedExInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 },
    selectedExNumber: { fontSize: 16, fontWeight: '900' },
    selectedExName: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
    selectedExMuscle: { fontSize: 9, fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' },
    moveBtnInline: { paddingHorizontal: 12, paddingVertical: 6, justifyContent: 'center', alignItems: 'center' },
    deleteBtnInline: { padding: 6, marginLeft: 4 },

    footer: { width: '100%', paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
    actionButtonText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20, marginHorizontal: 20 },
    modalTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 15, textAlign: 'center' },
    dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
    studentName: { fontSize: 14, fontWeight: 'bold' },

    drawerContent: { width: '100%', maxWidth: 480, alignSelf: 'center', height: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, overflow: 'hidden' },
    drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    drawerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    drawerOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    drawerOptionText: { fontSize: 13 },
    checkboxDrawer: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    drawerFooter: { padding: 20, borderTopWidth: 1 }
});
