// src/screens/AdminAnamneseBuilderScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminAnamneseBuilderScreen({ navigation }) {
    const { theme } = useTheme();
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
            const res = await fetch(`https://fitos-final.onrender.com/api/form-template/active?coachId=${cId}&type=${type}`);
            if (res.ok) {
                const data = await res.json();
                setTemplateId(data.id);
                setSchema(data.schema || { steps: [] });
            } else {
                // Se não existir, começa do zero
                setTemplateId(null);
                setSchema({ steps: [] });
            }
        } catch (e) {
            console.log("Erro ao buscar template:", e);
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
                headers: { 'Content-Type': 'application/json' },
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
        const newSteps = schema.steps.filter((_, i) => i !== stepIndex);
        setSchema({ ...schema, steps: newSteps });
    };

    const addQuestion = (stepIndex) => {
        const newQuestion = {
            id: `q_${Date.now()}`,
            type: 'TEXT', // TEXT, TEXTAREA, BOOLEAN, SELECT
            label: 'Nova Pergunta',
            required: false,
            options: [] // Usado apenas se for SELECT
        };
        const newSteps = [...schema.steps];
        newSteps[stepIndex].questions.push(newQuestion);
        setSchema({ ...schema, steps: newSteps });
    };

    const updateQuestion = (stepIndex, qIndex, field, value) => {
        const newSteps = [...schema.steps];
        newSteps[stepIndex].questions[qIndex][field] = value;
        setSchema({ ...schema, steps: newSteps });
    };

    const removeQuestion = (stepIndex, qIndex) => {
        const newSteps = [...schema.steps];
        newSteps[stepIndex].questions.splice(qIndex, 1);
        setSchema({ ...schema, steps: newSteps });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
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

                    {schema.steps.map((step, sIndex) => (
                        <View key={step.id} style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            {/* CABEÇALHO DA SEÇÃO */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <TextInput 
                                    style={[styles.inputTitle, { color: theme.text }]}
                                    value={step.title}
                                    onChangeText={(val) => updateStep(sIndex, 'title', val)}
                                    placeholder="Ex: Dados Pessoais"
                                    placeholderTextColor={theme.textSecondary}
                                />
                                <TouchableOpacity onPress={() => removeStep(sIndex)}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
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
                                {step.questions.map((q, qIndex) => (
                                    <View key={q.id} style={[styles.questionCard, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <TextInput 
                                                style={[styles.inputQuestion, { color: theme.text, flex: 1 }]}
                                                value={q.label}
                                                onChangeText={(val) => updateQuestion(sIndex, qIndex, 'label', val)}
                                                placeholder="Sua pergunta..."
                                                placeholderTextColor={theme.textSecondary}
                                            />
                                            <TouchableOpacity onPress={() => removeQuestion(sIndex, qIndex)} style={{ paddingLeft: 10 }}>
                                                <MaterialCommunityIcons name="close-circle-outline" size={20} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                            {/* SELETOR DE TIPO */}
                                            <View style={[styles.pickerFalso, { borderColor: theme.border }]}>
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
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={[styles.addBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '11', marginTop: 15 }]} onPress={() => addQuestion(sIndex)}>
                                <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                                <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 12 }}>ADICIONAR PERGUNTA</Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity style={[styles.addBtn, { borderColor: theme.text, backgroundColor: theme.surface, paddingVertical: 16 }]} onPress={addStep}>
                        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.text} />
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>ADICIONAR NOVA SEÇÃO</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
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
    
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' }
});