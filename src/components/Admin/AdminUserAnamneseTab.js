// src/components/Admin/AdminUserAnamneseTab.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const OBJETIVOS_LIST = ['Hipertrofia', 'Emagrecimento', 'Definição'];
const NIVEIS_LIST = ['Iniciante', 'Intermediário', 'Avançado'];
const FREQUENCIAS_LIST = ['1', '2', '3', '4', '5', '6', '7'];
const TEMPOS_LIST = ['30', '45', '60', '90', '120'];
const LIMITACOES_LIST = ['Joelho', 'Lombar', 'Ombro', 'Punho', 'Quadril', 'Tornozelo', 'Cervical', 'Cotovelos', 'Nenhuma'];
const CIRURGIAS_LIST = ['Abdominoplastia', 'Prótese de Silicone', 'Cesárea', 'LCA/Menisco', 'Hérnia', 'Coluna', 'Manguito', 'Nenhuma'];
const MEALS_LIST = ['2', '3', '4', '5', '6', '7', '8'];

export default function AdminUserAnamneseTab({ theme, aluno, userPlan }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 🔥 DADOS DO REGISTRO (Tabela User)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [birthDate, setBirthDate] = useState('');

    // 🔥 DADOS DA ANAMNESE PADRÃO (Tabela Anamnese)
    const [peso, setPeso] = useState('');
    const [altura, setAltura] = useState('');
    const [objetivo, setObjetivo] = useState('');
    const [nivel, setNivel] = useState('');
    const [frequencia, setFrequencia] = useState('');
    const [tempoDisponivel, setTempoDisponivel] = useState('');
    const [limitacoes, setLimitacoes] = useState([]);
    const [cirurgias, setCirurgias] = useState([]);
    const [equipamentos, setEquipamentos] = useState('');

    // 🔥 DADOS NUTRICIONAIS (VIP/ELITE)
    const [mealsPerDay, setMealsPerDay] = useState('');
    const [wakeUpTime, setWakeUpTime] = useState('');
    const [sleepTime, setSleepTime] = useState('');
    const [workTime, setWorkTime] = useState('');
    const [trainTime, setTrainTime] = useState('');
    const [allergies, setAllergies] = useState('');
    const [foodPreferences, setFoodPreferences] = useState('');
    const [foodAversions, setFoodAversions] = useState('');
    const [supplements, setSupplements] = useState('');

    useEffect(() => {
        fetchData();
    }, [aluno.id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 1. Busca os dados de Registro do Usuário
            const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user?userId=${aluno.id}&t=${Date.now()}`);
            if (resUser.ok) {
                const userData = await resUser.json();
                setName(userData?.name || '');
                setEmail(userData?.email || '');
                setPhone(userData?.phone || '');
                setGender(userData?.gender || '');
                setBirthDate(userData?.birthDate || userData?.dataNascimento || userData?.user?.birthDate || '');
            }

            // 2. Busca o histórico clínico da Anamnese
            const resAnamnese = await fetch(`https://fitos-final.onrender.com/api/anamnese?userId=${aluno.id}`);
            if (resAnamnese.ok) {
                const data = await resAnamnese.json();
                if (data && data.id) {
                    setPeso(data.peso ? String(data.peso) : '');
                    setAltura(data.altura ? String(data.altura) : '');
                    setObjetivo(data.objetivo || '');
                    setNivel(data.nivel || '');
                    setFrequencia(data.frequencia ? String(data.frequencia) : '');
                    setTempoDisponivel(data.tempoDisponivel ? String(data.tempoDisponivel) : '');
                    
                    setLimitacoes(Array.isArray(data.limitacoes) ? data.limitacoes : []);
                    setCirurgias(Array.isArray(data.cirurgias) ? data.cirurgias : []);
                    setEquipamentos(Array.isArray(data.equipamentos) ? data.equipamentos.join(', ') : '');

                    setMealsPerDay(data.mealsPerDay ? String(data.mealsPerDay) : '');
                    setWakeUpTime(data.wakeUpTime || '');
                    setSleepTime(data.sleepTime || '');
                    setWorkTime(data.workTime || '');
                    setTrainTime(data.trainTime || '');
                    setAllergies(data.allergies || '');
                    setFoodPreferences(data.foodPreferences || '');
                    setFoodAversions(data.foodAversions || '');
                    setSupplements(data.supplements || '');
                }
            }
        } catch (error) {
            console.log("Erro ao carregar anamnese:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (val) => {
        let formatted = val.replace(/\D/g, ''); 
        if (formatted.length > 2) formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
        if (formatted.length > 5) formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
        setBirthDate(formatted);
    };

    const handlePhoneChange = (val) => {
        let formatted = val.replace(/\D/g, '');
        if (formatted.length > 2) formatted = '(' + formatted.substring(0, 2) + ') ' + formatted.substring(2);
        if (formatted.length > 9) formatted = formatted.substring(0, 10) + '-' + formatted.substring(10, 14);
        setPhone(formatted);
    };

    const toggleSelection = (field, item, stateSetter, currentState) => {
        if (currentState.includes(item)) {
            stateSetter(currentState.filter(i => i !== item));
        } else if (item === 'Nenhuma') {
            stateSetter(['Nenhuma']);
        } else {
            stateSetter([...currentState.filter(i => i !== 'Nenhuma'), item]);
        }
    };

    const handleSave = async () => {
        if (!name || !email) {
            const msg = "Nome e E-mail de cadastro são obrigatórios.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Atenção", msg);
            return;
        }

        if (!peso || !altura) {
            const msg = "Peso e Altura são obrigatórios na Anamnese.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Atenção", msg);
            return;
        }

        try {
            setSaving(true);

            // 1. ATUALIZA O CADASTRO BASE NO PERFIL
            await fetch(`https://fitos-final.onrender.com/api/admin/user`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: aluno.id, 
                    birthDate: birthDate && birthDate.length === 10 ? birthDate : undefined,
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    phone,
                    gender
                })
            });

            // 2. CRIA UM NOVO REGISTRO DE ANAMNESE COM OS DADOS ATUALIZADOS
            const payload = {
                userId: aluno.id,
                peso: peso.replace(',', '.'),
                altura: altura.replace(',', '.'),
                objetivo,
                nivel,
                frequencia: parseInt(frequencia) || 3,
                tempoDisponivel: parseInt(tempoDisponivel) || 60,
                limitacoes: limitacoes,
                cirurgias: cirurgias,
                equipamentos: equipamentos ? equipamentos.split(',').map(i => i.trim()).filter(i => i) : [],
                mealsPerDay: mealsPerDay ? parseInt(mealsPerDay) : null,
                wakeUpTime,
                sleepTime,
                workTime,
                trainTime,
                allergies,
                foodPreferences,
                foodAversions,
                supplements
            };

            const res = await fetch(`https://fitos-final.onrender.com/api/anamnese`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const msg = "Cadastro e Anamnese atualizados com sucesso!";
                if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Sucesso", msg);
            } else {
                throw new Error("Falha ao salvar Anamnese no banco de dados.");
            }

        } catch (error) {
            console.error(error);
            const msg = "Ocorreu um erro ao salvar os dados.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Erro", msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 }}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{ color: theme.textSecondary, marginTop: 15, fontWeight: 'bold' }}>Carregando ficha clínica e de cadastro...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            
            {/* SESSÃO: DADOS DE REGISTRO E ACESSO */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="account-details" size={20} color={theme.accent} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>REGISTRO DO ALUNO (ACESSO E CONTATO)</Text>
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>NOME COMPLETO *</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                        value={name} onChangeText={setName} placeholder="Como quer ser chamado?" placeholderTextColor={theme.textSecondary} outlineStyle="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>E-MAIL DE ACESSO *</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                        value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="exemplo@email.com" placeholderTextColor={theme.textSecondary} outlineStyle="none"
                    />
                </View>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>NASCIMENTO</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                            value={birthDate} onChangeText={handleDateChange} keyboardType="numeric" maxLength={10} placeholder="DD/MM/AAAA" placeholderTextColor={theme.textSecondary} outlineStyle="none"
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>WHATSAPP</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                            value={phone} onChangeText={handlePhoneChange} keyboardType="phone-pad" maxLength={15} placeholder="(00) 00000-0000" placeholderTextColor={theme.textSecondary} outlineStyle="none"
                        />
                    </View>
                </View>

                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 10 }]}>GÊNERO BIOLÓGICO</Text>
                <View style={styles.wrapGrid}>
                    {['Masculino', 'Feminino'].map((g) => (
                        <TouchableOpacity 
                            key={g} 
                            style={[styles.chip, { flex: 1, backgroundColor: theme.bg, borderColor: theme.border }, gender === g && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                            onPress={() => setGender(g)}
                        >
                            <Text style={[styles.chipText, { textAlign: 'center', color: theme.text }, gender === g && {color: theme.isDark ? '#000' : '#FFF'}]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* SESSÃO: ESTRUTURA FÍSICA E ROTINA */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="clipboard-pulse" size={20} color={theme.accent} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>ESTRUTURA FÍSICA E ROTINA DE TREINO</Text>
                </View>
                
                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>PESO (KG) *</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={peso} onChangeText={setPeso} keyboardType="decimal-pad" placeholder="Ex: 80.5" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>ALTURA (CM) *</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={altura} onChangeText={setAltura} keyboardType="decimal-pad" placeholder="Ex: 175" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                    </View>
                </View>

                {/* 🔥 CONVERTIDO PARA OPÇÕES (CHIPS) 🔥 */}
                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 5, marginBottom: 10 }]}>OBJETIVO PRINCIPAL</Text>
                <View style={[styles.wrapGrid, { marginBottom: 20 }]}>
                    {OBJETIVOS_LIST.map(obj => (
                        <TouchableOpacity 
                            key={obj} 
                            style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, objetivo === obj && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                            onPress={() => setObjetivo(obj)}
                        >
                            <Text style={[styles.chipText, { color: theme.textSecondary }, objetivo === obj && {color: theme.isDark ? '#000' : '#FFF'}]}>{obj}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 10 }]}>NÍVEL DE EXPERIÊNCIA</Text>
                <View style={[styles.wrapGrid, { marginBottom: 20 }]}>
                    {NIVEIS_LIST.map(niv => (
                        <TouchableOpacity 
                            key={niv} 
                            style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, nivel === niv && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                            onPress={() => setNivel(niv)}
                        >
                            <Text style={[styles.chipText, { color: theme.textSecondary }, nivel === niv && {color: theme.isDark ? '#000' : '#FFF'}]}>{niv}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 10 }]}>FREQUÊNCIA (DIAS/SEMANA)</Text>
                <View style={[styles.wrapGrid, { marginBottom: 20 }]}>
                    {FREQUENCIAS_LIST.map(d => (
                        <TouchableOpacity 
                            key={d} 
                            style={[styles.circle, { backgroundColor: theme.bg, borderColor: theme.border }, frequencia === d && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                            onPress={() => setFrequencia(d)}
                        >
                            <Text style={[styles.circleText, { color: theme.text }, frequencia === d && {color: theme.isDark ? '#000' : '#FFF'}]}>{d}x</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 10 }]}>TEMPO DISPONÍVEL (MINUTOS)</Text>
                <View style={styles.wrapGrid}>
                    {TEMPOS_LIST.map(t => (
                        <TouchableOpacity 
                            key={t} 
                            style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, tempoDisponivel === t && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                            onPress={() => setTempoDisponivel(t)}
                        >
                            <Text style={[styles.chipText, { color: theme.textSecondary }, tempoDisponivel === t && {color: theme.isDark ? '#000' : '#FFF'}]}>{t} min</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* SESSÃO: HISTÓRICO CLÍNICO E DORES */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="hospital-box" size={20} color={theme.accent} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>MAPEAMENTO DE DORES E HISTÓRICO</Text>
                </View>
                
                <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 10 }]}>LIMITAÇÕES FÍSICAS / DORES</Text>
                <View style={styles.wrapGrid}>
                    {LIMITACOES_LIST.map(item => (
                        <TouchableOpacity 
                            key={item} 
                            style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, limitacoes.includes(item) && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                            onPress={() => toggleSelection('limitacoes', item, setLimitacoes, limitacoes)}
                        >
                            <Text style={[styles.chipText, { color: theme.textSecondary }, limitacoes.includes(item) && {color: theme.isDark ? '#000' : '#FFF'}]}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 25, marginBottom: 10 }]}>CIRURGIAS PRÉVIAS</Text>
                <View style={styles.wrapGrid}>
                    {CIRURGIAS_LIST.map(item => (
                        <TouchableOpacity 
                            key={item} 
                            style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, cirurgias.includes(item) && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                            onPress={() => toggleSelection('cirurgias', item, setCirurgias, cirurgias)}
                        >
                            <Text style={[styles.chipText, { color: theme.textSecondary }, cirurgias.includes(item) && {color: theme.isDark ? '#000' : '#FFF'}]}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.inputGroup, { marginTop: 25 }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>LOCAL DE TREINO / EQUIPAMENTOS (Separe por vírgula)</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={equipamentos} onChangeText={setEquipamentos} placeholder="Ex: Academia, Apenas Halteres em casa" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                </View>
            </View>

            {/* SESSÃO: RAIO-X NUTRICIONAL */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="food-apple" size={20} color={theme.accent} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>RAIO-X NUTRICIONAL (VIP/ELITE)</Text>
                </View>
                
                {/* 🔥 CONVERTIDO PARA OPÇÕES (CIRCLES) 🔥 */}
                <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 10 }]}>REFEIÇÕES POR DIA</Text>
                <View style={[styles.wrapGrid, { marginBottom: 20 }]}>
                    {MEALS_LIST.map(d => (
                        <TouchableOpacity 
                            key={d} 
                            style={[styles.circle, { backgroundColor: theme.bg, borderColor: theme.border }, mealsPerDay === d && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                            onPress={() => setMealsPerDay(d)}
                        >
                            <Text style={[styles.circleText, { color: theme.text }, mealsPerDay === d && {color: theme.isDark ? '#000' : '#FFF'}]}>{d}x</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>HORA QUE ACORDA</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={wakeUpTime} onChangeText={setWakeUpTime} placeholder="Ex: 06:30" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>HORA QUE DORME</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={sleepTime} onChangeText={setSleepTime} placeholder="Ex: 23:00" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                    </View>
                </View>
                
                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>HORÁRIO DE TRABALHO</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={workTime} onChangeText={setWorkTime} placeholder="Ex: 08h às 18h" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>HORÁRIO DO TREINO</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={trainTime} onChangeText={setTrainTime} placeholder="Ex: 19:00" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>ALERGIAS / INTOLERÂNCIAS</Text>
                    <TextInput style={[styles.textArea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={allergies} onChangeText={setAllergies} placeholder="Ex: Intolerância à lactose, Alergia a amendoim" placeholderTextColor={theme.textSecondary} multiline outlineStyle="none" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>PREFERÊNCIAS ALIMENTARES</Text>
                    <TextInput style={[styles.textArea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={foodPreferences} onChangeText={setFoodPreferences} placeholder="Ex: Gosto muito de frango com batata doce e ovos" placeholderTextColor={theme.textSecondary} multiline outlineStyle="none" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>AVERSÕES ALIMENTARES (O que não come)</Text>
                    <TextInput style={[styles.textArea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={foodAversions} onChangeText={setFoodAversions} placeholder="Ex: Não gosto de peixe, não como salada" placeholderTextColor={theme.textSecondary} multiline outlineStyle="none" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>SUPLEMENTOS UTILIZADOS</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={supplements} onChangeText={setSupplements} placeholder="Ex: Whey, Creatina, Pré-treino" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: saving ? 0.7 : 1 }]} 
                onPress={handleSave} 
                disabled={saving}
            >
                {saving ? (
                    <ActivityIndicator size="small" color="#000" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="content-save-check" size={24} color="#000" />
                        <Text style={[styles.saveBtnText, { color: '#000' }]}>SALVAR REGISTRO E ANAMNESE</Text>
                    </>
                )}
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 40,
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 15,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
    },
    halfInput: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    textArea: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        fontSize: 15,
        minHeight: 90,
        textAlignVertical: 'top',
    },
    wrapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    chipText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    circle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    circleText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 20,
        borderRadius: 16,
        marginTop: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 1,
    }
});