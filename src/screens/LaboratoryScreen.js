// src/screens/LaboratoryScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
    StyleSheet, StatusBar, Platform, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const LEVELS = ['INICIANTE', 'INTERMEDIÁRIO', 'AVANÇADO'];
const OBJECTIVES = ['EMAGRECIMENTO', 'HIPERTROFIA'];
const TIMES = [30, 45, 60, 90, 120];
const DAYS = [2, 3, 4, 5, 6];

// Componente auxiliar para agrupar seções com um card visual
const SectionCard = ({ children, title, theme, isDisabled }) => (
    <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }, isDisabled && { opacity: 0.5 }]} pointerEvents={isDisabled ? 'none' : 'auto'}>
        {title && <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>}
        {children}
    </View>
);

export default function LaboratoryScreen({ navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    const [mode, setMode] = useState('MATRIZ'); 
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    const [level, setLevel] = useState('INTERMEDIÁRIO');
    const [objective, setObjective] = useState('HIPERTROFIA');
    const [time, setTime] = useState(60);
    const [days, setDays] = useState(4);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const userJson = await AsyncStorage.getItem('user');
                if (!userJson) return;
                const adminObj = JSON.parse(userJson);

                const cached = await AsyncStorage.getItem('@dashboard_cache');
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    if (parsedCache.cacheAtivos) setStudents(parsedCache.cacheAtivos);
                }

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

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setIsDropdownOpen(false); 
        
        let foundObjective = 'HIPERTROFIA'; 
        let foundLevel = 'INTERMEDIÁRIO';   
        let foundTime = 60;               
        let foundDays = 4;                

        const userGoal = (student.goal || student.dietGoal || '').toUpperCase();
        if (userGoal.includes('EMAGRECIMENTO') || userGoal.includes('PERDA') || userGoal.includes('SECAR')) foundObjective = 'EMAGRECIMENTO';
        
        const userLevel = (student.level || '').toUpperCase();
        if (userLevel.includes('INICIANTE')) foundLevel = 'INICIANTE';
        if (userLevel.includes('AVANÇADO') || userLevel.includes('AVANCADO')) foundLevel = 'AVANÇADO';

        if (student.anamneses && student.anamneses.length > 0) {
            const anamnese = student.anamneses[0]; 
            const anamGoal = (anamnese.objetivo || '').toUpperCase();
            if (anamGoal.includes('EMAGRECIMENTO') || anamGoal.includes('PERDA')) foundObjective = 'EMAGRECIMENTO';
            else if (anamGoal.includes('HIPERTROFIA') || anamGoal.includes('GANHO')) foundObjective = 'HIPERTROFIA';

            const anamLevel = (anamnese.nivel || '').toUpperCase();
            if (anamLevel.includes('INICIANTE')) foundLevel = 'INICIANTE';
            else if (anamLevel.includes('AVANÇADO')) foundLevel = 'AVANÇADO';
            else if (anamLevel.includes('INTERMEDI')) foundLevel = 'INTERMEDIÁRIO';

            if (anamnese.tempoDisponivel) {
                if (TIMES.includes(anamnese.tempoDisponivel)) foundTime = anamnese.tempoDisponivel;
                else foundTime = TIMES.reduce((prev, curr) => Math.abs(curr - anamnese.tempoDisponivel) < Math.abs(prev - anamnese.tempoDisponivel) ? curr : prev);
            }

            if (anamnese.frequencia && DAYS.includes(anamnese.frequencia)) foundDays = anamnese.frequencia;
        }

        setObjective(foundObjective); setLevel(foundLevel); setTime(foundTime); setDays(foundDays);
        setSearchQuery(''); 
    };

    const handleGenerateStructure = () => {
        const config = { mode, student: selectedStudent, level, objective, time, days };
        navigation.navigate('LaboratoryBuilderScreen', { config });
    };

    const filteredStudents = students.filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

    // 🔥 AQUI ESTÁ A BLINDAGEM DO SCROLL (100vh para WEB) 🔥
    const rootStyle = isWeb 
        ? { height: '100vh', width: '100%', backgroundColor: webOuterBg, overflow: 'hidden', display: 'flex', flexDirection: 'column' } 
        : { flex: 1, backgroundColor: theme.bg };

    return (
        <SafeAreaView style={rootStyle}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            
            <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                    
                    {/* CABEÇALHO */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>LABORATÓRIO</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>MOTOR DE PRESCRIÇÃO</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* SELETOR DE MODO (FLAT DESIGN) */}
                    <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TouchableOpacity style={[styles.tab, mode === 'MATRIZ' && { backgroundColor: theme.accent, elevation: 1 }]} onPress={() => setMode('MATRIZ')}>
                            <Text style={[styles.tabText, { color: mode === 'MATRIZ' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>CRIAR MATRIZ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, mode === 'ALUNO' && { backgroundColor: theme.accent, elevation: 1 }]} onPress={() => setMode('ALUNO')}>
                            <Text style={[styles.tabText, { color: mode === 'ALUNO' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>PUXAR ANAMNESE</Text>
                        </TouchableOpacity>
                    </View>

                    {/* SCROLL PRINCIPAL BLINDADO */}
                    <ScrollView 
                        style={{ flex: 1, width: '100%' }} 
                        contentContainerStyle={styles.scrollContent} 
                        showsVerticalScrollIndicator={false}
                    >
                        
                        {/* MODO ALUNO: DROPDOWN DE SELEÇÃO */}
                        {mode === 'ALUNO' && (
                            <SectionCard title="ATLETA SELECIONADO" theme={theme}>
                                {!selectedStudent ? (
                                    <TouchableOpacity style={[styles.dropdownButton, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setIsDropdownOpen(true)}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Toque para selecionar um aluno...</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.selectedStudentCard, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                                        <View>
                                            <Text style={[styles.studentName, { color: theme.text }]}>{selectedStudent.name}</Text>
                                            <Text style={[styles.studentDetail, { color: theme.accent }]}>Anamnese importada com sucesso.</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.clearButton}>
                                            <MaterialCommunityIcons name="close" size={18} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </SectionCard>
                        )}

                        {/* FILTROS MACRO */}
                        <SectionCard title="OBJETIVO PRINCIPAL" theme={theme} isDisabled={mode === 'ALUNO' && !selectedStudent}>
                            <View style={styles.rowGrid}>
                                {OBJECTIVES.map(obj => (
                                    <TouchableOpacity key={obj} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }, objective === obj && { backgroundColor: theme.accent, borderWidth: 0 }]} onPress={() => setObjective(obj)}>
                                        <Text style={[styles.chipText, { color: objective === obj ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{obj}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </SectionCard>

                        <SectionCard title="NÍVEL DE TREINAMENTO" theme={theme} isDisabled={mode === 'ALUNO' && !selectedStudent}>
                            <View style={styles.rowGrid}>
                                {LEVELS.map(lvl => (
                                    <TouchableOpacity key={lvl} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }, level === lvl && { backgroundColor: theme.accent, borderWidth: 0 }]} onPress={() => setLevel(lvl)}>
                                        <Text style={[styles.chipText, { color: level === lvl ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{lvl}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </SectionCard>

                        <SectionCard title="TEMPO POR SESSÃO (MIN)" theme={theme} isDisabled={mode === 'ALUNO' && !selectedStudent}>
                            <View style={styles.rowGrid}>
                                {TIMES.map(t => (
                                    <TouchableOpacity key={t} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }, time === t && { backgroundColor: theme.accent, borderWidth: 0 }]} onPress={() => setTime(t)}>
                                        <Text style={[styles.chipText, { color: time === t ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{t}'</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </SectionCard>

                        <SectionCard title="DIAS NA SEMANA" theme={theme} isDisabled={mode === 'ALUNO' && !selectedStudent}>
                            <View style={styles.rowGrid}>
                                {DAYS.map(d => (
                                    <TouchableOpacity key={d} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }, days === d && { backgroundColor: theme.accent, borderWidth: 0 }]} onPress={() => setDays(d)}>
                                        <Text style={[styles.chipText, { color: days === d ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{d}X</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </SectionCard>

                        <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                            <MaterialCommunityIcons name="information-outline" size={20} color={theme.accent} />
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                {objective === 'EMAGRECIMENTO' && time >= 60 
                                    ? `200 kcal de Cardio Pós (Dias sem perna). Musculação: ~${time - 20} min.` 
                                    : objective === 'HIPERTROFIA' 
                                    ? 'Cardio Pós-Treino (200 kcal) distribuído em 3x na semana.'
                                    : `Tempo curto (${time} min). Método Bi-set será priorizado.`}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* BOTÃO DE AÇÃO FIXO NO FLUXO (Sempre Visível) */}
                    <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: theme.accent }, (mode === 'ALUNO' && !selectedStudent) && { backgroundColor: theme.surface, opacity: 0.5 }]}
                            onPress={handleGenerateStructure}
                            disabled={mode === 'ALUNO' && !selectedStudent}
                        >
                            <Text style={[styles.actionButtonText, { color: (mode === 'ALUNO' && !selectedStudent) ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF') }]}>AVANÇAR PARA MONTAGEM</Text>
                            <MaterialCommunityIcons name="arrow-right" size={22} color={(mode === 'ALUNO' && !selectedStudent) ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF')} />
                        </TouchableOpacity>
                    </View>

                </View>
            </View>

            {/* MODAL DE DROPDOWN PARA ALUNOS */}
            <Modal visible={isDropdownOpen} transparent animationType="fade" onRequestClose={() => setIsDropdownOpen(false)}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsDropdownOpen(false)}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Buscar Aluno</Text>
                        
                        <View style={[styles.searchBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                            <TextInput 
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="Digite o nome..."
                                placeholderTextColor={theme.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>

                        {loading ? (
                            <ActivityIndicator size="small" color={theme.accent} style={{ marginVertical: 20 }} />
                        ) : (
                            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                                {filteredStudents.map(student => (
                                    <TouchableOpacity 
                                        key={student.id} 
                                        style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                                        onPress={() => handleSelectStudent(student)}
                                    >
                                        <Text style={[styles.studentName, { color: theme.text }]}>{student.name}</Text>
                                        <MaterialCommunityIcons name="check-circle-outline" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                                {filteredStudents.length === 0 && <Text style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: 20 }}>Nenhum aluno encontrado.</Text>}
                            </ScrollView>
                        )}
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
    
    tabContainer: { 
        flexDirection: 'row', marginHorizontal: 20, marginTop: 20, borderRadius: 12, 
        padding: 4, borderWidth: 1, marginBottom: 20 
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
    tabText: { fontSize: 12, fontWeight: 'bold' },
    
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 0, flexGrow: 1 },
    
    sectionCard: { 
        borderRadius: 12, padding: 15, marginBottom: 20, 
        borderWidth: 1 
    },
    sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 12, opacity: 0.8 },
    rowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, 
    chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
    chipText: { fontSize: 12, fontWeight: 'bold' },
    dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
    selectedStudentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, borderWidth: 1 },
    studentName: { fontSize: 14, fontWeight: 'bold' },
    studentDetail: { fontSize: 11, marginTop: 4 },
    clearButton: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
    infoBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    
    footer: { width: '100%', paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
    actionButtonText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: 20 },
    modalContent: { width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 24, padding: 20, borderWidth: 1 },
    modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 15, height: 45, borderWidth: 1, marginBottom: 15 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, outlineStyle: 'none' },
    dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 }
});
