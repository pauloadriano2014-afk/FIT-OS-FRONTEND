// src/screens/LaboratoryScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
    StyleSheet, StatusBar, Platform, TextInput, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const LEVELS = ['INICIANTE', 'INTERMEDIÁRIO', 'AVANÇADO'];
const OBJECTIVES = ['EMAGRECIMENTO', 'HIPERTROFIA'];
const TIMES = [30, 45, 60, 90, 120];
const DAYS = [2, 3, 4, 5, 6];

export default function LaboratoryScreen({ navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    const [mode, setMode] = useState('MATRIZ'); // 'MATRIZ' ou 'ALUNO'
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filtros Ativos
    const [level, setLevel] = useState('INTERMEDIÁRIO');
    const [objective, setObjective] = useState('HIPERTROFIA');
    const [time, setTime] = useState(60);
    const [days, setDays] = useState(4);

    // 🔥 BUSCANDO ALUNOS REAIS DO BANCO 🔥
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const userJson = await AsyncStorage.getItem('user');
                if (!userJson) return;
                const adminObj = JSON.parse(userJson);

                // Tenta puxar do cache do Dashboard primeiro (para ser instantâneo)
                const cached = await AsyncStorage.getItem('@dashboard_cache');
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    if (parsedCache.cacheAtivos) setStudents(parsedCache.cacheAtivos);
                }

                // Busca fresco da API
                const res = await fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${adminObj.id}&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    const ativos = data.activeUsers || data.users || [];
                    setStudents(ativos);
                }
            } catch (e) {
                console.log("Erro ao buscar alunos:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    // 🔥 O EXTRATOR INTELIGENTE DA ANAMNESE 🔥
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        
        let foundObjective = 'HIPERTROFIA'; // Default
        let foundLevel = 'INTERMEDIÁRIO';   // Default
        let foundTime = 60;               // Default
        let foundDays = 4;                // Default

        // 1. Tenta pegar os dados básicos do Cadastro do Aluno (Tabela User)
        const userGoal = (student.goal || student.dietGoal || '').toUpperCase();
        if (userGoal.includes('EMAGRECIMENTO') || userGoal.includes('PERDA') || userGoal.includes('SECAR') || userGoal.includes('DEFINI')) foundObjective = 'EMAGRECIMENTO';
        
        const userLevel = (student.level || '').toUpperCase();
        if (userLevel.includes('INICIANTE')) foundLevel = 'INICIANTE';
        if (userLevel.includes('AVANÇADO') || userLevel.includes('AVANCADO')) foundLevel = 'AVANÇADO';

        // 2. Se tiver Anamnese salva, ela é a nossa Fonte da Verdade Suprema!
        if (student.anamneses && student.anamneses.length > 0) {
            // Pega a primeira/última anamnese da lista
            const anamnese = student.anamneses[0]; 
            
            // Analisa o Objetivo
            const anamGoal = (anamnese.objetivo || '').toUpperCase();
            if (anamGoal.includes('EMAGRECIMENTO') || anamGoal.includes('PERDA') || anamGoal.includes('DEFINIÇÃO')) {
                foundObjective = 'EMAGRECIMENTO';
            } else if (anamGoal.includes('HIPERTROFIA') || anamGoal.includes('GANHO') || anamGoal.includes('MASSA')) {
                foundObjective = 'HIPERTROFIA';
            }

            // Analisa o Nível
            const anamLevel = (anamnese.nivel || '').toUpperCase();
            if (anamLevel.includes('INICIANTE')) foundLevel = 'INICIANTE';
            else if (anamLevel.includes('AVANÇADO') || anamLevel.includes('AVANCADO')) foundLevel = 'AVANÇADO';
            else if (anamLevel.includes('INTERMEDI')) foundLevel = 'INTERMEDIÁRIO';

            // Analisa o Tempo Disponível (E ajusta pro valor mais próximo)
            if (anamnese.tempoDisponivel) {
                if (TIMES.includes(anamnese.tempoDisponivel)) {
                    foundTime = anamnese.tempoDisponivel;
                } else {
                    // Ex: Se o aluno marcou 50, arredonda pra 45 ou 60
                    foundTime = TIMES.reduce((prev, curr) => Math.abs(curr - anamnese.tempoDisponivel) < Math.abs(prev - anamnese.tempoDisponivel) ? curr : prev);
                }
            }

            // Analisa Frequência (Dias na Semana)
            if (anamnese.frequencia && DAYS.includes(anamnese.frequencia)) {
                foundDays = anamnese.frequencia;
            }
        }

        // Aplica todos os dados resgatados nos botões da tela
        setObjective(foundObjective);
        setLevel(foundLevel);
        setTime(foundTime);
        setDays(foundDays);
        setSearchQuery(''); // Limpa a barra de pesquisa
    };

    const handleGenerateStructure = () => {
        const config = { mode, student: selectedStudent, level, objective, time, days };
        console.log("🔥 GERANDO ESTRUTURA COM BASE EM:", config);
        // 🔥 A MÁGICA DA NAVEGAÇÃO ACONTECE AQUI 🔥
        navigation.navigate('LaboratoryBuilderScreen', { config });
    };

    const filteredStudents = students.filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            
            <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                    
                    {/* CABEÇALHO */}
                    <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.bg, zIndex: 10 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>LABORATÓRIO</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>MOTOR DE PRESCRIÇÃO</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* SELETOR DE MODO (TABS) */}
                    <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TouchableOpacity 
                            style={[styles.tab, mode === 'MATRIZ' && { backgroundColor: theme.accent, shadowColor: theme.accent, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 }]} 
                            onPress={() => setMode('MATRIZ')}
                        >
                            <MaterialCommunityIcons name="database" size={18} color={mode === 'MATRIZ' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                            <Text style={[styles.tabText, { color: theme.textSecondary }, mode === 'MATRIZ' && { color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }]}>CRIAR MATRIZ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, mode === 'ALUNO' && { backgroundColor: theme.accent, shadowColor: theme.accent, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 }]} 
                            onPress={() => setMode('ALUNO')}
                        >
                            <MaterialCommunityIcons name="account-search" size={18} color={mode === 'ALUNO' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                            <Text style={[styles.tabText, { color: theme.textSecondary }, mode === 'ALUNO' && { color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }]}>PUXAR ANAMNESE</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 🔥 SCROLL VIEW BLINDADO PARA WEB 🔥 */}
                    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        
                        {/* MODO ALUNO: BUSCA E SELEÇÃO */}
                        {mode === 'ALUNO' && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>SELECIONE O ATLETA</Text>
                                <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }]}>
                                    <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                                    <TextInput 
                                        style={[styles.searchInput, { color: theme.text }]}
                                        placeholder="Buscar aluno..."
                                        placeholderTextColor={theme.textSecondary}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>
                                
                                {loading && !selectedStudent && <ActivityIndicator size="small" color={theme.accent} style={{ marginTop: 20 }} />}

                                {!selectedStudent && !loading && (
                                    <View style={styles.studentList}>
                                        {filteredStudents.slice(0, 8).map(student => (
                                            <TouchableOpacity 
                                                key={student.id} 
                                                style={[styles.studentCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }]}
                                                onPress={() => handleSelectStudent(student)}
                                            >
                                                <Text style={[styles.studentName, { color: theme.text }]}>{student.name}</Text>
                                                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.accent} />
                                            </TouchableOpacity>
                                        ))}
                                        {filteredStudents.length === 0 && <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10 }}>Nenhum aluno encontrado.</Text>}
                                    </View>
                                )}

                                {selectedStudent && (
                                    <View style={[styles.selectedStudentCard, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                                        <View>
                                            <Text style={[styles.studentName, { color: theme.text }]}>{selectedStudent.name}</Text>
                                            <Text style={[styles.studentDetail, { color: theme.accent }]}>Anamnese carregada e analisada.</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.clearButton}>
                                            <MaterialCommunityIcons name="close" size={18} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* FILTROS MACRO */}
                        <View style={[styles.section, (mode === 'ALUNO' && !selectedStudent) && { opacity: 0.3 }]} pointerEvents={(mode === 'ALUNO' && !selectedStudent) ? 'none' : 'auto'}>
                            
                            {/* OBJETIVO */}
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>OBJETIVO PRINCIPAL</Text>
                            <View style={styles.rowGrid}>
                                {OBJECTIVES.map(obj => (
                                    <TouchableOpacity 
                                        key={obj} 
                                        style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, objective === obj && { backgroundColor: theme.accent + '22', borderColor: theme.accent, borderWidth: 1.5 }]}
                                        onPress={() => setObjective(obj)}
                                    >
                                        <Text style={[styles.chipText, { color: theme.textSecondary }, objective === obj && { color: theme.accent, fontWeight: '900' }]}>{obj}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* NÍVEL */}
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>NÍVEL DE TREINAMENTO</Text>
                            <View style={styles.rowGrid}>
                                {LEVELS.map(lvl => (
                                    <TouchableOpacity 
                                        key={lvl} 
                                        style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, level === lvl && { backgroundColor: theme.accent + '22', borderColor: theme.accent, borderWidth: 1.5 }]}
                                        onPress={() => setLevel(lvl)}
                                    >
                                        <Text style={[styles.chipText, { color: theme.textSecondary }, level === lvl && { color: theme.accent, fontWeight: '900' }]}>{lvl}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* TEMPO DISPONÍVEL */}
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>TEMPO POR SESSÃO (MIN)</Text>
                            <View style={styles.rowGrid}>
                                {TIMES.map(t => (
                                    <TouchableOpacity 
                                        key={t} 
                                        style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, time === t && { backgroundColor: theme.accent + '22', borderColor: theme.accent, borderWidth: 1.5 }]}
                                        onPress={() => setTime(t)}
                                    >
                                        <Text style={[styles.chipText, { color: theme.textSecondary }, time === t && { color: theme.accent, fontWeight: '900' }]}>{t}'</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* DIAS NA SEMANA */}
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>DIAS NA SEMANA</Text>
                            <View style={styles.rowGrid}>
                                {DAYS.map(d => (
                                    <TouchableOpacity 
                                        key={d} 
                                        style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, days === d && { backgroundColor: theme.accent + '22', borderColor: theme.accent, borderWidth: 1.5 }]}
                                        onPress={() => setDays(d)}
                                    >
                                        <Text style={[styles.chipText, { color: theme.textSecondary }, days === d && { color: theme.accent, fontWeight: '900' }]}>{d}X</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                        </View>

                        {/* INFORMAÇÕES DE REGRA (PREVIEW DA SUA INTELIGÊNCIA) */}
                        <View style={[styles.infoBox, { backgroundColor: theme.accent + '11', borderColor: theme.accent + '44' }]}>
                            <MaterialCommunityIcons name="brain" size={24} color={theme.accent} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.infoTitle, { color: theme.accent }]}>ALGORITMO ATIVADO</Text>
                                <Text style={[styles.infoText, { color: theme.text }]}>
                                    {objective === 'EMAGRECIMENTO' && time >= 60 
                                        ? `200 kcal de Cardio Pós adicionado (Dias sem perna). Musculação: ~${time - 20} min.` 
                                        : objective === 'HIPERTROFIA' 
                                        ? 'Cardio Pós-Treino (200 kcal) distribuído em 3x na semana.'
                                        : `Tempo curto (${time} min). Método Bi-set será priorizado para densidade.`}
                                </Text>
                            </View>
                        </View>

                    </ScrollView>

                    {/* BOTÃO DE AÇÃO PRINCIPAL */}
                    <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: theme.accent, shadowColor: theme.accent, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }, (mode === 'ALUNO' && !selectedStudent) && { backgroundColor: theme.border, shadowOpacity: 0, opacity: 0.5 }]}
                            onPress={handleGenerateStructure}
                            disabled={mode === 'ALUNO' && !selectedStudent}
                        >
                            <Text style={[styles.actionButtonText, { color: theme.isDark ? '#000' : '#FFF' }]}>AVANÇAR ESTRUTURA</Text>
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
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, borderRadius: 12, padding: 4, borderWidth: 1 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8 },
    tabText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 150, paddingTop: 20 }, // 🔥 AQUI ESTÁ O SEGREDO DO SCROLL (150px)
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
    rowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: { borderWidth: 1, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    chipText: { fontSize: 13, fontWeight: 'bold' },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 15, height: 50, borderWidth: 1, marginBottom: 10 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, outlineStyle: 'none' },
    studentList: { marginTop: 10, gap: 8 },
    studentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 10, borderWidth: 1 },
    selectedStudentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 10, borderWidth: 1 },
    studentName: { fontSize: 15, fontWeight: 'bold' },
    studentDetail: { fontSize: 11, marginTop: 4 },
    clearButton: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
    infoBox: { flexDirection: 'row', padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
    infoTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    infoText: { fontSize: 12, lineHeight: 18 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 12, gap: 10 },
    actionButtonText: { fontSize: 15, fontWeight: '900', letterSpacing: 1 }
});