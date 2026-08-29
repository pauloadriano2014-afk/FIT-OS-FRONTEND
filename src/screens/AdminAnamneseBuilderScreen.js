// src/screens/AdminAnamneseBuilderScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Platform, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { authHeaders } from '../utils/authToken';
import { getDefaultAnamneseSchema } from '../Anamnese/defaultAnamneseSchema';

export default function AdminAnamneseBuilderScreen({ navigation }) {
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const isWebPC = isWeb && windowWidth > 768;
    const containerMaxWidth = isWebPC ? 960 : '100%';
    const containerBorders = isWebPC
        ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }
        : {};
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const RootComponent = isWeb ? View : SafeAreaView;
    const rootStyle = isWeb
        ? { height: '100vh', width: '100%', backgroundColor: isWebPC ? webOuterBg : theme.bg }
        : { flex: 1, backgroundColor: theme.bg };
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [coachId, setCoachId] = useState(null);
    const [formType, setFormType] = useState('TRAINING'); // 'TRAINING' | 'FULL'
    
    // O Schema (JSON) que vamos manipular e enviar pro banco
    const [schema, setSchema] = useState({ steps: [] });
    const [templateId, setTemplateId] = useState(null);

    useEffect(() => {
        const init = async () => {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCoachId(user.id);
                fetchTemplate(user.id, formType);
            }
        };
        init();
    }, [formType]);

    const fetchTemplate = async (cId, type) => {
        setLoading(true);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/form-template/active?coachId=${cId}&type=${type}`, {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) {
                const data = await res.json();
                setTemplateId(data.id);
                setSchema(data.schema || { steps: [] });
            } else if (res.status === 404) {
                // Coach ainda não tem um formulário customizado deste tipo — mostra a anamnese
                // ATUAL (a mesma que já roda hoje pros alunos) pronta pra ele customizar,
                // em vez de uma tela vazia.
                setTemplateId(null);
                setSchema(getDefaultAnamneseSchema(type));
            } else {
                // 401/403/500 etc: falha ao CARREGAR, não é "formulário vazio" — não mexe no
                // schema atual (pra não fazer parecer que um formulário já existente sumiu).
                const isAuthError = res.status === 401 || res.status === 403;
                Alert.alert(
                    "Erro ao carregar formulário",
                    isAuthError
                        ? "Sua sessão pode ter expirado. Saia e entre novamente antes de editar o formulário."
                        : `Não foi possível carregar o formulário atual (erro ${res.status}). Tente novamente.`
                );
            }
        } catch (e) {
            console.log("Erro ao buscar template:", e);
            Alert.alert("Erro de conexão", "Não foi possível carregar o formulário atual. Verifique sua internet e tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!schema.steps || schema.steps.length === 0) {
            Alert.alert("Aviso", "Adicione pelo menos uma seção ao formulário.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                id: templateId, // Se for null, o backend deve criar um novo
                coachId,
                type: formType,
                name: formType === 'TRAINING' ? 'Anamnese de Treino' : 'Anamnese Completa',
                schema: schema,
                isActive: true
            };

            const res = await fetch('https://fitos-final.onrender.com/api/form-template', {
                method: templateId ? 'PUT' : 'POST', // Precisaremos garantir que a rota suporte UPSERT ou separe POST/PUT
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setTemplateId(data.id);
                if (Platform.OS === 'web') window.alert("Formulário salvo com sucesso!");
                else Alert.alert("Sucesso", "Formulário salvo com sucesso!");
            } else {
                throw new Error("Falha ao salvar");
            }
        } catch (error) {
            if (Platform.OS === 'web') window.alert("Erro ao salvar.");
            else Alert.alert("Erro", "Falha ao salvar o formulário.");
        } finally {
            setSaving(false);
        }
    };

    const addStep = () => {
        const newStep = {
            id: `step_${Date.now()}`,
            title: 'Nova Seção',
            description: '',
            questions: []
        };
        setSchema({ ...schema, steps: [...schema.steps, newStep] });
    };

    const updateStep = (stepIndex, field, value) => {
        const newSteps = [...schema.steps];
        newSteps[stepIndex][field] = value;
        setSchema({ ...schema, steps: newSteps });
    };

    const removeStep = (stepIndex) => {
        const step = schema.steps[stepIndex];
        if (step.questions.some((q) => q.locked)) {
            Alert.alert(
                "Seção protegida",
                "Essa seção tem pelo menos um campo que alimenta o cálculo de dieta ou os alertas de segurança do aluno, por isso não pode ser removida inteira. Você pode remover as perguntas não-protegidas dela, editar os textos, ou adicionar novas perguntas à vontade."
            );
            return;
        }
        const newSteps = schema.steps.filter((_, i) => i !== stepIndex);
        setSchema({ ...schema, steps: newSteps });
    };

    const addQuestion = (stepIndex) => {
        const newQuestion = {
            id: `q_${Date.now()}`,
            type: 'TEXT', // TEXT, TEXTAREA, BOOLEAN, SELECT, MULTI_SELECT
            label: 'Nova Pergunta',
            required: false,
            locked: false,
            options: [] // Usado se for SELECT ou MULTI_SELECT
        };
        const newSteps = [...schema.steps];
        newSteps[stepIndex].questions.push(newQuestion);
        setSchema({ ...schema, steps: newSteps });
    };

    const updateQuestion = (stepIndex, qIndex, field, value) => {
        const target = schema.steps[stepIndex].questions[qIndex];
        if (target.locked && field === 'type') {
            Alert.alert(
                "Campo protegido",
                "O tipo desse campo não pode ser alterado porque ele alimenta o cálculo de dieta ou os alertas de segurança do aluno. Você pode editar o texto da pergunta normalmente."
            );
            return;
        }
        const newSteps = [...schema.steps];
        newSteps[stepIndex].questions[qIndex][field] = value;
        setSchema({ ...schema, steps: newSteps });
    };

    const removeQuestion = (stepIndex, qIndex) => {
        const target = schema.steps[stepIndex].questions[qIndex];
        if (target.locked) {
            Alert.alert(
                "Campo protegido",
                "Esse campo alimenta diretamente o cálculo de macros da dieta ou os alertas de segurança do aluno, por isso não pode ser removido. Você pode editar o texto da pergunta à vontade."
            );
            return;
        }
        const newSteps = [...schema.steps];
        newSteps[stepIndex].questions.splice(qIndex, 1);
        setSchema({ ...schema, steps: newSteps });
    };

    const addOption = (stepIndex, qIndex) => {
        const newSteps = [...schema.steps];
        const q = newSteps[stepIndex].questions[qIndex];
        q.options = [...(q.options || []), 'Nova opção'];
        setSchema({ ...schema, steps: newSteps });
    };

    const updateOption = (stepIndex, qIndex, oIndex, value) => {
        const newSteps = [...schema.steps];
        const q = newSteps[stepIndex].questions[qIndex];
        const newOptions = [...(q.options || [])];
        newOptions[oIndex] = value;
        q.options = newOptions;
        setSchema({ ...schema, steps: newSteps });
    };

    const removeOption = (stepIndex, qIndex, oIndex) => {
        const newSteps = [...schema.steps];
        const q = newSteps[stepIndex].questions[qIndex];
        q.options = (q.options || []).filter((_, i) => i !== oIndex);
        setSchema({ ...schema, steps: newSteps });
    };

    return (
        <RootComponent style={rootStyle}>
          <View style={{ flex: 1, width: '100%', maxWidth: containerMaxWidth, alignSelf: 'center', backgroundColor: theme.bg, ...containerBorders }}>
            {/* CABEÇALHO */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Editor de Anamnese</Text>
                <TouchableOpacity 
                    onPress={handleSave} 
                    style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: saving ? 0.7 : 1 }]}
                    disabled={saving}
                >
                    <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: 'bold' }}>{saving ? 'Salvando...' : 'SALVAR'}</Text>
                </TouchableOpacity>
            </View>

            {/* SELETOR DE TIPO (TREINO vs COMPLETO) */}
            <View style={{ padding: 20, paddingBottom: 0 }}>
                <View style={[styles.segmentedControl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity 
                        style={[styles.segmentBtn, formType === 'TRAINING' && { backgroundColor: theme.accent }]}
                        onPress={() => setFormType('TRAINING')}
                    >
                        <Text style={[styles.segmentText, { color: formType === 'TRAINING' ? '#000' : theme.textSecondary }]}>SÓ TREINO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.segmentBtn, formType === 'FULL' && { backgroundColor: theme.accent }]}
                        onPress={() => setFormType('FULL')}
                    >
                        <Text style={[styles.segmentText, { color: formType === 'FULL' ? '#000' : theme.textSecondary }]}>TREINO + DIETA</Text>
                    </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 10 }}>
                    {formType === 'TRAINING' 
                        ? 'Este formulário será enviado aos alunos que comprarem planos que incluem APENAS Treino.'
                        : 'Este formulário será enviado aos alunos que comprarem planos com Dieta inclusa.'}
                </Text>
            </View>

            {/* EDITOR DO JSON VISUAL */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                    
                    {schema.steps.length === 0 && (
                        <View style={{ padding: 30, alignItems: 'center', opacity: 0.5 }}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={theme.text} />
                            <Text style={{ color: theme.text, marginTop: 10, fontWeight: 'bold' }}>Nenhuma seção criada.</Text>
                        </View>
                    )}

                    {schema.steps.map((step, sIndex) => {
                        const stepHasLocked = step.questions.some((q) => q.locked);
                        return (
                        <View key={step.id} style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            {/* CABEÇALHO DA SEÇÃO */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    {stepHasLocked && (
                                        <MaterialCommunityIcons name="lock" size={16} color={theme.accent} />
                                    )}
                                    <TextInput
                                        style={[styles.inputTitle, { color: theme.text, flex: 1 }]}
                                        value={step.title}
                                        onChangeText={(val) => updateStep(sIndex, 'title', val)}
                                        placeholder="Ex: Dados Pessoais"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>
                                <TouchableOpacity onPress={() => removeStep(sIndex)}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={stepHasLocked ? theme.textSecondary : '#FF3B30'} />
                                </TouchableOpacity>
                            </View>

                            <TextInput 
                                style={[styles.inputDesc, { color: theme.textSecondary }]}
                                value={step.description}
                                onChangeText={(val) => updateStep(sIndex, 'description', val)}
                                placeholder="Descrição opcional desta etapa..."
                                placeholderTextColor={theme.textSecondary}
                            />

                            {/* PERGUNTAS DESTA SEÇÃO */}
                            <View style={{ marginTop: 20, gap: 15 }}>
                                {step.questions.map((q, qIndex) => {
                                    const isOptionsType = q.type === 'SELECT' || q.type === 'MULTI_SELECT';
                                    return (
                                    <View key={q.id} style={[styles.questionCard, { borderColor: q.locked ? theme.accent + '55' : theme.border, backgroundColor: theme.bg }]}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                {q.locked && (
                                                    <MaterialCommunityIcons name="lock" size={14} color={theme.accent} />
                                                )}
                                                <TextInput
                                                    style={[styles.inputQuestion, { color: theme.text, flex: 1 }]}
                                                    value={q.label}
                                                    onChangeText={(val) => updateQuestion(sIndex, qIndex, 'label', val)}
                                                    placeholder="Sua pergunta..."
                                                    placeholderTextColor={theme.textSecondary}
                                                />
                                            </View>
                                            <TouchableOpacity onPress={() => removeQuestion(sIndex, qIndex)} style={{ paddingLeft: 10 }}>
                                                <MaterialCommunityIcons name="close-circle-outline" size={20} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                        </View>

                                        {q.locked && (
                                            <Text style={{ color: theme.accent, fontSize: 10, fontWeight: 'bold', marginBottom: 10 }}>
                                                CAMPO PROTEGIDO — alimenta o cálculo de dieta / alertas de segurança. Pode editar o texto, mas não remover ou mudar o tipo.
                                            </Text>
                                        )}

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                            {/* SELETOR DE TIPO */}
                                            <View style={[styles.pickerFalso, { borderColor: theme.border, opacity: q.locked ? 0.5 : 1, flexWrap: 'wrap' }]}>
                                                <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>TIPO:</Text>
                                                <TouchableOpacity onPress={() => updateQuestion(sIndex, qIndex, 'type', 'TEXT')} style={[styles.miniBtn, q.type === 'TEXT' && { backgroundColor: theme.accent }]}>
                                                    <Text style={{ color: q.type === 'TEXT' ? '#000' : theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>CURTA</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => updateQuestion(sIndex, qIndex, 'type', 'TEXTAREA')} style={[styles.miniBtn, q.type === 'TEXTAREA' && { backgroundColor: theme.accent }]}>
                                                    <Text style={{ color: q.type === 'TEXTAREA' ? '#000' : theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>LONGA</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => updateQuestion(sIndex, qIndex, 'type', 'BOOLEAN')} style={[styles.miniBtn, q.type === 'BOOLEAN' && { backgroundColor: theme.accent }]}>
                                                    <Text style={{ color: q.type === 'BOOLEAN' ? '#000' : theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>SIM/NÃO</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => updateQuestion(sIndex, qIndex, 'type', 'SELECT')} style={[styles.miniBtn, q.type === 'SELECT' && { backgroundColor: theme.accent }]}>
                                                    <Text style={{ color: q.type === 'SELECT' ? '#000' : theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>ÚNICA ESCOLHA</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => updateQuestion(sIndex, qIndex, 'type', 'MULTI_SELECT')} style={[styles.miniBtn, q.type === 'MULTI_SELECT' && { backgroundColor: theme.accent }]}>
                                                    <Text style={{ color: q.type === 'MULTI_SELECT' ? '#000' : theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>MÚLTIPLA ESCOLHA</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {/* OBRIGATÓRIO */}
                                            <TouchableOpacity
                                                style={[styles.miniBtn, { borderWidth: 1, borderColor: q.required ? theme.accent : theme.border, backgroundColor: q.required ? theme.accent + '22' : 'transparent' }]}
                                                onPress={() => updateQuestion(sIndex, qIndex, 'required', !q.required)}
                                            >
                                                <Text style={{ color: q.required ? theme.accent : theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>
                                                    {q.required ? 'OBRIGATÓRIO' : 'OPCIONAL'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {isOptionsType && (
                                            <View style={{ marginTop: 12, gap: 8 }}>
                                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 }}>OPÇÕES</Text>
                                                {(q.options || []).map((opt, oIndex) => (
                                                    <View key={oIndex} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <TextInput
                                                            style={[styles.inputOption, { color: theme.text, borderColor: theme.border, flex: 1 }]}
                                                            value={opt}
                                                            onChangeText={(val) => updateOption(sIndex, qIndex, oIndex, val)}
                                                            placeholder="Opção..."
                                                            placeholderTextColor={theme.textSecondary}
                                                        />
                                                        <TouchableOpacity onPress={() => removeOption(sIndex, qIndex, oIndex)}>
                                                            <MaterialCommunityIcons name="minus-circle-outline" size={18} color={theme.textSecondary} />
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                                <TouchableOpacity style={[styles.addOptionBtn, { borderColor: theme.border }]} onPress={() => addOption(sIndex, qIndex)}>
                                                    <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
                                                    <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 11 }}>ADICIONAR OPÇÃO</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                    );
                                })}
                            </View>

                            <TouchableOpacity style={[styles.addBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '11', marginTop: 15 }]} onPress={() => addQuestion(sIndex)}>
                                <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                                <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 12 }}>ADICIONAR PERGUNTA</Text>
                            </TouchableOpacity>
                        </View>
                        );
                    })}

                    <TouchableOpacity style={[styles.addBtn, { borderColor: theme.text, backgroundColor: theme.surface, paddingVertical: 16 }]} onPress={addStep}>
                        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.text} />
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>ADICIONAR NOVA SEÇÃO</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
          </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1 },
    backBtn: { padding: 5 },
    title: { fontSize: 16, fontWeight: '900' },
    saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    
    segmentedControl: { flexDirection: 'row', borderRadius: 12, padding: 4, borderWidth: 1 },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    segmentText: { fontWeight: '900', fontSize: 12 },

    stepCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
    inputTitle: { fontSize: 18, fontWeight: '900', flex: 1, outlineStyle: 'none' },
    inputDesc: { fontSize: 13, outlineStyle: 'none', marginTop: 5 },
    
    questionCard: { padding: 15, borderRadius: 12, borderWidth: 1 },
    inputQuestion: { fontSize: 14, fontWeight: 'bold', outlineStyle: 'none' },

    pickerFalso: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, padding: 5, borderRadius: 8 },
    miniBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },

    inputOption: { fontSize: 13, outlineStyle: 'none', borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
    addOptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', alignSelf: 'flex-start', paddingHorizontal: 12 },
    
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' }
});