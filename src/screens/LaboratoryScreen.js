// src/screens/LaboratoryScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, SafeAreaView, ScrollView, TouchableOpacity, 
    StyleSheet, StatusBar, Platform, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { authHeaders } from '../utils/authToken';

const LEVELS = ['INICIANTE', 'INTERMEDIÁRIO', 'AVANÇADO'];
const OBJECTIVES = ['EMAGRECIMENTO', 'HIPERTROFIA'];
const GENDERS = ['MASCULINO', 'FEMININO']; 
const TIMES = [30, 45, 60, 90, 120];
const DAYS = [2, 3, 4, 5, 6];

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
    const [fetchingDetails, setFetchingDetails] = useState(false);

    const [gender, setGender] = useState('MASCULINO'); 
    const [level, setLevel] = useState('INTERMEDIÁRIO');
    const [objective, setObjective] = useState('HIPERTROFIA');
    const [time, setTime] = useState(60);
    const [days, setDays] = useState(5); 
    const [studentLimitations, setStudentLimitations] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

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

                const res = await fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${adminObj.id}&t=${Date.now()}`, { headers: { ...(await authHeaders()) } });
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

    const handleSelectStudent = async (student) => {
        setIsDropdownOpen(false); 
        setFetchingDetails(true);
        setSelectedStudent(student);
        setSelectedTemplate(null); 
        
        let foundObjective = 'HIPERTROFIA'; 
        let foundLevel = 'INTERMEDIÁRIO';   
        let foundTime = 60;               
        let foundDays = 4;   
        let foundGender = 'MASCULINO';             
        let foundLimitations = []; 

        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${student.id}?t=${Date.now()}`, { headers: { ...(await authHeaders()) } });
            if (res.ok) {
                const fullStudent = await res.json();
                
                // 🔥 EXTRATOR DE GÊNERO BLINDADO 🔥
                let g = (fullStudent.gender || fullStudent.sexo || student.gender || student.sexo || '').toUpperCase();
                if (!g && fullStudent.anamneses && fullStudent.anamneses.length > 0) {
                    g = (fullStudent.anamneses[0].sexo || fullStudent.anamneses[0].genero || '').toUpperCase();
                }
                
                if (g.includes('FEM') || g.includes('MULHER')) {
                    foundGender = 'FEMININO';
                } else if (g.includes('MASC') || g.includes('HOMEM')) {
                    foundGender = 'MASCULINO';
                } else {
                    // Fallback pelo nome (Garante que a Ana seja Feminino)
                    const firstName = (student.name || '').split(' ')[0].toLowerCase();
                    if(firstName.endsWith('a') && !['lucas', 'nicolas', 'matias'].includes(firstName)) {
                        foundGender = 'FEMININO';
                    }
                }
                
                const userGoal = (fullStudent.goal || fullStudent.dietGoal || '').toUpperCase();
                if (userGoal.includes('EMAGRECIMENTO') || userGoal.includes('PERDA') || userGoal.includes('SECAR')) foundObjective = 'EMAGRECIMENTO';
                
                const userLevel = (fullStudent.level || '').toUpperCase();
                if (userLevel.includes('INICIANTE')) foundLevel = 'INICIANTE';
                if (userLevel.includes('AVANÇADO') || userLevel.includes('AVANCADO')) foundLevel = 'AVANÇADO';

                const parseLimitation = (lim) => {
                    if (!lim) return;
                    if (Array.isArray(lim)) lim.forEach(l => foundLimitations.push(l));
                    else if (typeof lim === 'string') {
                        try {
                            const parsed = JSON.parse(lim);
                            if (Array.isArray(parsed)) parsed.forEach(l => foundLimitations.push(l));
                            else foundLimitations.push(lim);
                        } catch (e) { foundLimitations.push(lim); }
                    }
                };

                if (fullStudent.anamneses && fullStudent.anamneses.length > 0) {
                    const anamnese = fullStudent.anamneses[0]; 
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

                    parseLimitation(anamnese.limitacoes);
                    parseLimitation(anamnese.cirurgias);
                }
            }
        } catch (error) {
            console.log("Erro ao puxar dados", error);
        }

        // 🔥 FILTRO DE "NENHUMA" E "NADA" 🔥
        const cleanLimitations = foundLimitations.filter(l => {
            const low = String(l).toLowerCase().trim();
            return low !== 'nenhuma' && low !== 'nenhum' && low !== 'não' && low !== 'nao' && low !== 'nada';
        });

        setGender(foundGender);
        setObjective(foundObjective); 
        setLevel(foundLevel); 
        setTime(foundTime); 
        setDays(foundDays);
        setStudentLimitations([...new Set(cleanLimitations)]); 
        setSearchQuery(''); 
        setFetchingDetails(false);
    };

    const applyShortcut = (gnd, obj, lvl, t, d, templateCode) => {
        setGender(gnd); 
        setObjective(obj); 
        setLevel(lvl); 
        setTime(t); 
        setDays(d);
        setSelectedTemplate(templateCode); 
    };

    // 🔥 ATALHOS COM NOMES AJUSTADOS 🔥
    const renderShortcuts = () => {
        if (gender === 'MASCULINO') {
            return (
                <>
                    <TouchableOpacity style={[styles.shortcutBtn, { backgroundColor: theme.bg, borderColor: selectedTemplate === 'MASC_EMAG_6X' ? theme.accent : theme.border, borderWidth: selectedTemplate === 'MASC_EMAG_6X' ? 2 : 1 }]} onPress={() => applyShortcut('MASCULINO', 'EMAGRECIMENTO', 'AVANÇADO', 90, 6, 'MASC_EMAG_6X')}>
                        <MaterialCommunityIcons name="fire" size={16} color="#FF3B30" />
                        <Text style={[styles.shortcutText, { color: theme.text }]}>Emagrecimento 6x (Avançado)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shortcutBtn, { backgroundColor: theme.bg, borderColor: selectedTemplate === 'MASC_HIPER_5X' ? theme.accent : theme.border, borderWidth: selectedTemplate === 'MASC_HIPER_5X' ? 2 : 1 }]} onPress={() => applyShortcut('MASCULINO', 'HIPERTROFIA', 'INTERMEDIÁRIO', 60, 5, 'MASC_HIPER_5X')}>
                        <MaterialCommunityIcons name="lightning-bolt" size={16} color={theme.accent} />
                        <Text style={[styles.shortcutText, { color: theme.text }]}>Hipertrofia 5x (Intermediário)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shortcutBtn, { backgroundColor: theme.bg, borderColor: selectedTemplate === 'MASC_HIPER_4X' ? theme.accent : theme.border, borderWidth: selectedTemplate === 'MASC_HIPER_4X' ? 2 : 1 }]} onPress={() => applyShortcut('MASCULINO', 'HIPERTROFIA', 'AVANÇADO', 60, 4, 'MASC_HIPER_4X')}>
                        <MaterialCommunityIcons name="weight-lifter" size={16} color="#FFD700" />
                        <Text style={[styles.shortcutText, { color: theme.text }]}>Hipertrofia 4x (Avançado)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shortcutBtn, { backgroundColor: theme.bg, borderColor: selectedTemplate === 'MASC_CASA_3X' ? theme.accent : theme.border, borderWidth: selectedTemplate === 'MASC_CASA_3X' ? 2 : 1 }]} onPress={() => applyShortcut('MASCULINO', 'HIPERTROFIA', 'INTERMEDIÁRIO', 45, 3, 'MASC_CASA_3X')}>
                        <MaterialCommunityIcons name="home" size={16} color="#32ADE6" />
                        <Text style={[styles.shortcutText, { color: theme.text }]}>Em Casa 3x (Intermediário)</Text>
                    </TouchableOpacity>
                </>
            );
        } else {
            return (
                <>
                    <TouchableOpacity style={[styles.shortcutBtn, { backgroundColor: theme.bg, borderColor: selectedTemplate === 'FEM_EMAG_6X' ? theme.accent : theme.border, borderWidth: selectedTemplate === 'FEM_EMAG_6X' ? 2 : 1 }]} onPress={() => applyShortcut('FEMININO', 'EMAGRECIMENTO', 'AVANÇADO', 90, 6, 'FEM_EMAG_6X')}>
                        <MaterialCommunityIcons name="fire" size={16} color="#FF3B30" />
                        <Text style={[styles.shortcutText, { color: theme.text }]}>Emagrecimento 6x (Avançado)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shortcutBtn, { backgroundColor: theme.bg, borderColor: selectedTemplate === 'FEM_HIPER_5X' ? theme.accent : theme.border, borderWidth: selectedTemplate === 'FEM_HIPER_5X' ? 2 : 1 }]} onPress={() => applyShortcut('FEMININO', 'HIPERTROFIA', 'AVANÇADO', 60, 5, 'FEM_HIPER_5X')}>
                        <MaterialCommunityIcons name="shoe-heel" size={16} color="#FF2D55" />
                        <Text style={[styles.shortcutText, { color: theme.text }]}>Hipertrofia 5x (Avançada)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shortcutBtn, { backgroundColor: theme.bg, borderColor: selectedTemplate === 'FEM_EMAG_4X' ? theme.accent : theme.border, borderWidth: selectedTemplate === 'FEM_EMAG_4X' ? 2 : 1 }]} onPress={() => applyShortcut('FEMININO', 'EMAGRECIMENTO', 'INTERMEDIÁRIO', 60, 4, 'FEM_EMAG_4X')}>
                        <MaterialCommunityIcons name="fire" size={16} color="#FFD700" />
                        <Text style={[styles.shortcutText, { color: theme.text }]}>Emagrecimento 4x (Intermediária)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shortcutBtn, { backgroundColor: theme.bg, borderColor: selectedTemplate === 'FEM_CASA_3X' ? theme.accent : theme.border, borderWidth: selectedTemplate === 'FEM_CASA_3X' ? 2 : 1 }]} onPress={() => applyShortcut('FEMININO', 'HIPERTROFIA', 'INICIANTE', 45, 3, 'FEM_CASA_3X')}>
                        <MaterialCommunityIcons name="home" size={16} color="#AF52DE" />
                        <Text style={[styles.shortcutText, { color: theme.text }]}>Iniciante Casa 3x</Text>
                    </TouchableOpacity>
                </>
            );
        }
    };

    const handleGenerateStructure = () => {
        const config = { mode, student: selectedStudent, gender, level, objective, time, days, limitations: studentLimitations, template: selectedTemplate };
        navigation.navigate('LaboratoryBuilderScreen', { config });
    };

    const filteredStudents = students.filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

    const rootStyle = isWeb 
        ? { height: '100vh', width: '100%', backgroundColor: webOuterBg, overflow: 'hidden', display: 'flex', flexDirection: 'column' } 
        : { flex: 1, backgroundColor: theme.bg };

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
                            <Text style={[styles.headerTitle, { color: theme.text }]}>LABORATÓRIO</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>MOTOR DE PRESCRIÇÃO</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TouchableOpacity style={[styles.tab, mode === 'MATRIZ' && { backgroundColor: theme.accent, elevation: 1 }]} onPress={() => { setMode('MATRIZ'); setSelectedStudent(null); setStudentLimitations([]); setSelectedTemplate(null); }}>
                            <Text style={[styles.tabText, { color: mode === 'MATRIZ' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>CRIAR MATRIZ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, mode === 'ALUNO' && { backgroundColor: theme.accent, elevation: 1 }]} onPress={() => setMode('ALUNO')}>
                            <Text style={[styles.tabText, { color: mode === 'ALUNO' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>PUXAR ANAMNESE</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        
                        <SectionCard title="GÊNERO DA MATRIZ" theme={theme} isDisabled={(mode === 'ALUNO' && !selectedStudent) || fetchingDetails}>
                            <View style={styles.rowGrid}>
                                {GENDERS.map(gnd => (
                                    <TouchableOpacity key={gnd} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }, gender === gnd && { backgroundColor: theme.accent, borderWidth: 0 }]} onPress={() => { setGender(gnd); setSelectedTemplate(null); }}>
                                        <Text style={[styles.chipText, { color: gender === gnd ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{gnd}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </SectionCard>

                        {mode === 'MATRIZ' && (
                            <SectionCard title="TEMPLATES PRONTOS" theme={theme}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                    {renderShortcuts()}
                                </ScrollView>
                            </SectionCard>
                        )}

                        {mode === 'ALUNO' && (
                            <SectionCard title="ATLETA SELECIONADO" theme={theme}>
                                {!selectedStudent ? (
                                    <TouchableOpacity style={[styles.dropdownButton, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setIsDropdownOpen(true)}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Toque para selecionar um aluno...</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                ) : (
                                    <View>
                                        <View style={[styles.selectedStudentCard, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.studentName, { color: theme.text }]}>{selectedStudent.name}</Text>
                                                {fetchingDetails ? (
                                                    <Text style={[styles.studentDetail, { color: theme.accent }]}>Extraindo dados do atleta...</Text>
                                                ) : (
                                                    <Text style={[styles.studentDetail, { color: theme.accent }]} numberOfLines={1}>
                                                        {gender} • {objective} • {days}X • {time}MIN
                                                    </Text>
                                                )}
                                            </View>
                                            <TouchableOpacity onPress={() => { setSelectedStudent(null); setStudentLimitations([]); }} style={styles.clearButton}>
                                                <MaterialCommunityIcons name="close" size={18} color={theme.text} />
                                            </TouchableOpacity>
                                        </View>

                                        {studentLimitations.length > 0 && (
                                            <View style={styles.limitationBox}>
                                                <MaterialCommunityIcons name="alert-octagon" size={24} color="#FF3B30" />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.limitationTitle}>ATENÇÃO ÀS LIMITAÇÕES:</Text>
                                                    <Text style={styles.limitationText}>{studentLimitations.join(' • ')}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </SectionCard>
                        )}

                        <SectionCard title="OBJETIVO PRINCIPAL" theme={theme} isDisabled={(mode === 'ALUNO' && !selectedStudent) || fetchingDetails}>
                            <View style={styles.rowGrid}>
                                {OBJECTIVES.map(obj => (
                                    <TouchableOpacity key={obj} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }, objective === obj && { backgroundColor: theme.accent, borderWidth: 0 }]} onPress={() => {setObjective(obj); setSelectedTemplate(null);}}>
                                        <Text style={[styles.chipText, { color: objective === obj ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{obj}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </SectionCard>

                        <SectionCard title="NÍVEL DE TREINAMENTO" theme={theme} isDisabled={(mode === 'ALUNO' && !selectedStudent) || fetchingDetails}>
                            <View style={styles.rowGrid}>
                                {LEVELS.map(lvl => (
                                    <TouchableOpacity key={lvl} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }, level === lvl && { backgroundColor: theme.accent, borderWidth: 0 }]} onPress={() => {setLevel(lvl); setSelectedTemplate(null);}}>
                                        <Text style={[styles.chipText, { color: level === lvl ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{lvl}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </SectionCard>

                        <SectionCard title="TEMPO POR SESSÃO (MIN)" theme={theme} isDisabled={(mode === 'ALUNO' && !selectedStudent) || fetchingDetails}>
                            <View style={styles.rowGrid}>
                                {TIMES.map(t => (
                                    <TouchableOpacity key={t} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }, time === t && { backgroundColor: theme.accent, borderWidth: 0 }]} onPress={() => {setTime(t); setSelectedTemplate(null);}}>
                                        <Text style={[styles.chipText, { color: time === t ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{t}'</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </SectionCard>

                        <SectionCard title="DIAS NA SEMANA" theme={theme} isDisabled={(mode === 'ALUNO' && !selectedStudent) || fetchingDetails}>
                            <View style={styles.rowGrid}>
                                {DAYS.map(d => (
                                    <TouchableOpacity key={d} style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }, days === d && { backgroundColor: theme.accent, borderWidth: 0 }]} onPress={() => {setDays(d); setSelectedTemplate(null);}}>
                                        <Text style={[styles.chipText, { color: days === d ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>{d}X</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </SectionCard>

                    </ScrollView>

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
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, borderRadius: 12, padding: 4, borderWidth: 1, marginBottom: 20 },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
    tabText: { fontSize: 12, fontWeight: 'bold' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 0, flexGrow: 1 },
    sectionCard: { borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1 },
    sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 12, opacity: 0.8 },
    rowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, 
    chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
    chipText: { fontSize: 12, fontWeight: 'bold' },
    shortcutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, gap: 8 },
    shortcutText: { fontSize: 12, fontWeight: 'bold' },
    dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
    selectedStudentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, borderWidth: 1 },
    studentName: { fontSize: 14, fontWeight: 'bold' },
    studentDetail: { fontSize: 11, marginTop: 4, fontWeight: 'bold' },
    clearButton: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, marginLeft: 10 },
    limitationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B3015', padding: 12, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#FF3B30' },
    limitationTitle: { color: '#FF3B30', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    limitationText: { color: '#FF3B30', fontSize: 12, fontWeight: 'bold' },
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