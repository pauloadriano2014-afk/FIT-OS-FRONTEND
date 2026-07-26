// src/modals/AIReportEditModal.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, LayoutAnimation, Platform, UIManager, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 🔥 Habilita animação de layout suave no Android (iOS já tem nativo) 🔥
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const arrayToText = (arr) => (Array.isArray(arr) ? arr.join('\n') : '');
const textToArray = (text) => String(text || '').split('\n').map(s => s.trim()).filter(Boolean);

export default function AIReportEditModal({ visible, assessment, onClose, onSave, saving, theme }) {
    const [pontosFortes, setPontosFortes] = useState('');
    const [pontosAtencao, setPontosAtencao] = useState('');
    const [prioridades, setPrioridades] = useState('');
    const [analiseFrontal, setAnaliseFrontal] = useState('');
    const [analiseLateral, setAnaliseLateral] = useState('');
    const [analisePosterior, setAnalisePosterior] = useState('');
    const [objetivoPrincipal, setObjetivoPrincipal] = useState('');
    const [objetivosSecundarios, setObjetivosSecundarios] = useState('');
    const [conclusaoTecnica, setConclusaoTecnica] = useState('');
    const [mapaOmbros, setMapaOmbros] = useState('');
    const [mapaCostas, setMapaCostas] = useState('');
    const [mapaBracos, setMapaBracos] = useState('');
    const [mapaGluteos, setMapaGluteos] = useState('');
    const [mapaCoxas, setMapaCoxas] = useState('');
    const [mapaPanturrilhas, setMapaPanturrilhas] = useState('');

    // 🔥 NOVO: controla qual campo está expandido para edição 🔥
    const [focusedField, setFocusedField] = useState(null);
    const inputRefs = useRef({});

    useEffect(() => {
        if (visible && assessment) {
            setPontosFortes(arrayToText(assessment.aiPontosFortes));
            setPontosAtencao(arrayToText(assessment.aiPontosAtencao));
            setPrioridades(arrayToText(assessment.aiPrioridades));
            setAnaliseFrontal(assessment.aiAnaliseFrontal || '');
            setAnaliseLateral(assessment.aiAnaliseLateral || '');
            setAnalisePosterior(assessment.aiAnalisePosterior || '');
            setObjetivoPrincipal(assessment.aiObjetivoPrincipal || '');
            setObjetivosSecundarios(arrayToText(assessment.aiObjetivosSecundarios));
            setConclusaoTecnica(assessment.aiConclusaoTecnica || '');
            setMapaOmbros(assessment.aiMapaOmbros != null ? String(assessment.aiMapaOmbros) : '');
            setMapaCostas(assessment.aiMapaCostas != null ? String(assessment.aiMapaCostas) : '');
            setMapaBracos(assessment.aiMapaBracos != null ? String(assessment.aiMapaBracos) : '');
            setMapaGluteos(assessment.aiMapaGluteos != null ? String(assessment.aiMapaGluteos) : '');
            setMapaCoxas(assessment.aiMapaCoxas != null ? String(assessment.aiMapaCoxas) : '');
            setMapaPanturrilhas(assessment.aiMapaPanturrilhas != null ? String(assessment.aiMapaPanturrilhas) : '');
            setFocusedField(null);
        }
    }, [visible, assessment]);

    if (!visible) return null;

    // 🔥 Expande o campo suavemente ao focar 🔥
    const handleFocus = (key) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFocusedField(key);
    };

    // 🔥 Encolhe de volta ao sair do campo 🔥
    const handleBlur = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFocusedField(null);
    };

    const handleConcluir = (key) => {
        inputRefs.current[key]?.blur();
        Keyboard.dismiss();
        handleBlur();
    };

    const handleSave = () => {
        onSave({
            aiPontosFortes: textToArray(pontosFortes),
            aiPontosAtencao: textToArray(pontosAtencao),
            aiPrioridades: textToArray(prioridades),
            aiAnaliseFrontal: analiseFrontal,
            aiAnaliseLateral: analiseLateral,
            aiAnalisePosterior: analisePosterior,
            aiObjetivoPrincipal: objetivoPrincipal,
            aiObjetivosSecundarios: textToArray(objetivosSecundarios),
            aiConclusaoTecnica: conclusaoTecnica,
            aiMapaOmbros: mapaOmbros,
            aiMapaCostas: mapaCostas,
            aiMapaBracos: mapaBracos,
            aiMapaGluteos: mapaGluteos,
            aiMapaCoxas: mapaCoxas,
            aiMapaPanturrilhas: mapaPanturrilhas
        });
    };

    // 🔥 key identifica o campo — controla o tamanho (pequeno x expandido) e o destaque visual 🔥
    const renderTextArea = (key, label, value, setValue, hint, baseHeight = 70, expandedHeight = 200) => {
        const isFocused = focusedField === key;
        return (
            <View style={{ marginBottom: 18 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
                {hint && <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>{hint}</Text>}
                <TextInput
                    ref={(r) => { inputRefs.current[key] = r; }}
                    value={value}
                    onChangeText={setValue}
                    onFocus={() => handleFocus(key)}
                    onBlur={handleBlur}
                    multiline
                    style={[
                        styles.textArea,
                        {
                            minHeight: isFocused ? expandedHeight : baseHeight,
                            color: theme.text,
                            backgroundColor: theme.bg,
                            borderColor: isFocused ? '#9D00FF' : theme.border,
                            borderWidth: isFocused ? 2 : 1
                        }
                    ]}
                    placeholder="—"
                    placeholderTextColor={theme.textSecondary}
                />
                {isFocused && (
                    <TouchableOpacity onPress={() => handleConcluir(key)} style={styles.concluirButton}>
                        <MaterialCommunityIcons name="check" size={14} color="#000" />
                        <Text style={styles.concluirButtonText}>CONCLUIR</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderNumberField = (label, value, setValue) => (
        <View style={{ width: '31%', marginBottom: 12 }}>
            <Text style={[styles.mapaLabel, { color: theme.textSecondary }]}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={(t) => setValue(t.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="numeric"
                style={[styles.mapaInput, { color: theme.text, backgroundColor: theme.bg, borderColor: theme.border }]}
                placeholder="0-10"
                placeholderTextColor={theme.textSecondary}
            />
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.title, { color: '#9D00FF' }]}>EDITAR DIAGNÓSTICO</Text>
                        <TouchableOpacity onPress={onClose} disabled={saving}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
                        <Text style={[styles.sectionTitle, { color: '#4DE38F' }]}>DIAGNÓSTICO ESTÉTICO</Text>
                        {renderTextArea('pontosFortes', 'Pontos Fortes', pontosFortes, setPontosFortes, 'Um item por linha')}
                        {renderTextArea('pontosAtencao', 'Pontos de Atenção', pontosAtencao, setPontosAtencao, 'Um item por linha')}
                        {renderTextArea('prioridades', 'Prioridades de Treino', prioridades, setPrioridades, 'Um item por linha')}

                        <Text style={[styles.sectionTitle, { color: '#4DE38F' }]}>MAPA DE DESENVOLVIMENTO (0-10)</Text>
                        <View style={styles.mapaGrid}>
                            {renderNumberField('Ombros', mapaOmbros, setMapaOmbros)}
                            {renderNumberField('Costas', mapaCostas, setMapaCostas)}
                            {renderNumberField('Braços', mapaBracos, setMapaBracos)}
                            {renderNumberField('Glúteos', mapaGluteos, setMapaGluteos)}
                            {renderNumberField('Coxas', mapaCoxas, setMapaCoxas)}
                            {renderNumberField('Panturrilhas', mapaPanturrilhas, setMapaPanturrilhas)}
                        </View>

                        <Text style={[styles.sectionTitle, { color: '#4DE38F' }]}>ANÁLISE VISUAL</Text>
                        {renderTextArea('analiseFrontal', 'Vista Frontal', analiseFrontal, setAnaliseFrontal, null)}
                        {renderTextArea('analiseLateral', 'Vista Lateral', analiseLateral, setAnaliseLateral, null)}
                        {renderTextArea('analisePosterior', 'Vista Posterior', analisePosterior, setAnalisePosterior, null)}

                        <Text style={[styles.sectionTitle, { color: '#4DE38F' }]}>OBJETIVOS ESTRATÉGICOS</Text>
                        {renderTextArea('objetivoPrincipal', 'Objetivo Principal', objetivoPrincipal, setObjetivoPrincipal, null)}
                        {renderTextArea('objetivosSecundarios', 'Objetivos Secundários', objetivosSecundarios, setObjetivosSecundarios, 'Um item por linha')}

                        <Text style={[styles.sectionTitle, { color: '#4DE38F' }]}>CONCLUSÃO TÉCNICA</Text>
                        {renderTextArea('conclusaoTecnica', 'Conclusão', conclusaoTecnica, setConclusaoTecnica, null, 100, 240)}

                        <TouchableOpacity 
                            onPress={handleSave} 
                            disabled={saving}
                            style={[styles.saveButton, { opacity: saving ? 0.6 : 1 }]}
                        >
                            {saving ? <ActivityIndicator color="#000" size="small" /> : <MaterialCommunityIcons name="content-save-outline" size={20} color="#000" />}
                            <Text style={styles.saveButtonText}>{saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</Text>
                        </TouchableOpacity>

                        <View style={{ height: 20 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
    card: { borderRadius: 24, padding: 25, maxHeight: '90%', borderWidth: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 15 },
    title: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    sectionTitle: { fontWeight: '900', fontSize: 11, letterSpacing: 1, marginTop: 15, marginBottom: 12, textTransform: 'uppercase' },
    fieldLabel: { fontWeight: 'bold', fontSize: 11, marginBottom: 4, textTransform: 'uppercase' },
    fieldHint: { fontSize: 9, marginBottom: 6, fontStyle: 'italic' },
    textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13, textAlignVertical: 'top' },
    concluirButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#4DE38F', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginTop: 8, gap: 5 },
    concluirButtonText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },
    mapaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    mapaLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
    mapaInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, fontWeight: '900', textAlign: 'center' },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4DE38F', borderRadius: 12, paddingVertical: 15, marginTop: 15, gap: 8 },
    saveButtonText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 }
});