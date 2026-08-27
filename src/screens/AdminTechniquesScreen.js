// src/screens/AdminTechniquesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, 
    TextInput, ActivityIndicator, Alert, Modal, Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { authHeaders } from '../utils/authToken';

const API_URL = 'https://fitos-final.onrender.com/api/admin/techniques';
const SYSTEM_VIDEOS_API_URL = 'https://fitos-final.onrender.com/api/admin/system-technique-videos';

const STEP_TYPES = {
    EXECUTION: { label: 'Execução Normal', icon: 'dumbbell', color: '#32ADE6', hasParam: true, paramLabel: 'Reps/Tempo' },
    DROP:      { label: 'Drop-Set', icon: 'arrow-down-bold', color: '#FF3B30', hasParam: true, paramLabel: 'Reps no Drop' },
    REST:      { label: 'Rest-Pause', icon: 'timer-sand', color: '#FF9500', hasParam: true, paramLabel: 'Segundos' },
    ISOMETRY:  { label: 'Isometria', icon: 'stop-circle-outline', color: '#AF52DE', hasParam: true, paramLabel: 'Segundos' },
    FAILURE:   { label: 'Até a Falha', icon: 'skull-crossbones', color: '#FF2D55', hasParam: false },
};

// 🔥 As 9 técnicas FIXAS do sistema (mesmas keys de techGuideData.js).
// Aqui só precisamos do label e ícone para exibição — texto/áudio continuam
// vivendo no código do app, não duplicamos isso aqui.
const SYSTEM_TECHNIQUES = [
    { key: 'DROPSET', label: 'DROP-SET', icon: 'arrow-down-bold', color: '#FF3B30' },
    { key: 'RESTPAUSE', label: 'REST-PAUSE', icon: 'timer-sand', color: '#FF9500' },
    { key: 'BISET', label: 'BI-SET', icon: 'link-variant', color: '#32ADE6' },
    { key: '21', label: 'MÉTODO 21', icon: 'numeric-7-box-multiple-outline', color: '#32ADE6' },
    { key: 'CLUSTERSET', label: 'CLUSTER SET', icon: 'chart-bar', color: '#BF5AF2' },
    { key: 'GVT', label: 'GVT (10x10)', icon: 'numeric-10-box-multiple', color: '#00FF7F' },
    { key: '1_5_REPS', label: '1 E MEIO (1.5 REPS)', icon: 'debug-step-over', color: '#FF2D55' },
    { key: 'TUT', label: 'T.U.T. (TEMPO SOB TENSÃO)', icon: 'timer-outline', color: '#00C7BE' },
    { key: 'NORMAL', label: 'EXECUÇÃO PADRÃO', icon: 'dumbbell', color: '#888' },
];

export default function AdminTechniquesScreen({ navigation }) {
    const { theme } = useTheme();
    const [techniques, setTechniques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [coachId, setCoachId] = useState(null);

    // 🔥 Responsividade PC vs Mobile/PWA — mesmo padrão usado em MontarTreinoAdmin.js
    const { width: windowWidth } = Dimensions.get('window');
    const isWebPC = Platform.OS === 'web' && windowWidth > 768;
    const containerMaxWidth = isWebPC ? 960 : '100%';

    // Modal State - dividido em howTo (Como Executar) e whyTo (Por Que Fazer)
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', howTo: '', whyTo: '', steps: [], videoUrl: '' });

    // 🔥 estado dos vídeos das técnicas fixas do sistema
    const [systemVideos, setSystemVideos] = useState({}); // { DROPSET: 'https://...', ... }
    const [systemVideoInputs, setSystemVideoInputs] = useState({}); // valores em edição, por key
    const [savingSystemKey, setSavingSystemKey] = useState(null); // qual key está salvando agora (mostra loading só nela)

    useEffect(() => {
        loadUserAndData();
    }, []);

    const loadUserAndData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsed = JSON.parse(userData);
                setCoachId(parsed.id);
                fetchTechniques(parsed.id);
                // 🔥 Vídeos do sistema agora são escopados por coachId (time),
                // então só buscamos depois de saber quem está logado.
                fetchSystemVideos(parsed.id);
            }
        } catch (error) {
            console.error("Erro ao carregar usuário:", error);
            setLoading(false);
        }
    };

    const fetchTechniques = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}?coachId=${id}`, {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) {
                const data = await res.json();
                setTechniques(data);
            }
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar as técnicas.");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 busca os overrides de vídeo das técnicas fixas do time do coach logado
    const fetchSystemVideos = async (id) => {
        try {
            const res = await fetch(`${SYSTEM_VIDEOS_API_URL}?coachId=${id}`, {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) {
                const data = await res.json();
                const map = {};
                data.forEach(v => { map[v.key] = v.videoUrl; });
                setSystemVideos(map);
                setSystemVideoInputs(map);
            }
        } catch (error) {
            // Falha silenciosa aqui é aceitável: o admin só não vê vídeos
            // pré-preenchidos, mas a tela continua funcional.
        }
    };

    // 🔥 salva o vídeo de uma técnica fixa específica (escopado ao time do coach)
    const handleSaveSystemVideo = async (key) => {
        const videoUrl = (systemVideoInputs[key] || '').trim();
        if (!videoUrl) {
            return Alert.alert("Aviso", "Cole o link do vídeo antes de salvar.");
        }
        setSavingSystemKey(key);
        try {
            const res = await fetch(SYSTEM_VIDEOS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ key, videoUrl, coachId })
            });
            if (res.ok) {
                setSystemVideos(prev => ({ ...prev, [key]: videoUrl }));
                if (Platform.OS === 'web') window.alert("Vídeo salvo com sucesso!");
                else Alert.alert("Sucesso", "Vídeo salvo com sucesso!");
            } else {
                Alert.alert("Erro", "Falha ao salvar o vídeo.");
            }
        } catch (error) {
            Alert.alert("Erro", "Erro de conexão.");
        } finally {
            setSavingSystemKey(null);
        }
    };

    // 🔥 remove o vídeo de uma técnica fixa (escopado ao time do coach)
    const handleRemoveSystemVideo = async (key) => {
        const doRemove = async () => {
            setSavingSystemKey(key);
            try {
                const res = await fetch(`${SYSTEM_VIDEOS_API_URL}?key=${key}&coachId=${coachId}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
                if (res.ok) {
                    setSystemVideos(prev => { const next = { ...prev }; delete next[key]; return next; });
                    setSystemVideoInputs(prev => ({ ...prev, [key]: '' }));
                }
            } catch (error) {
                Alert.alert("Erro", "Falha ao remover o vídeo.");
            } finally {
                setSavingSystemKey(null);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Remover o vídeo desta técnica?")) doRemove();
        } else {
            Alert.alert("Remover vídeo", "Tem certeza que deseja remover este vídeo?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Remover", style: "destructive", onPress: doRemove }
            ]);
        }
    };

    const openModal = (tech = null) => {
        if (tech) {
            // Inteligência para separar a descrição salva do banco nas duas caixinhas
            let how = '';
            let why = '';
            if (tech.description) {
                const parts = tech.description.split(/POR QUE FAZER:/i);
                how = parts[0].replace(/COMO EXECUTAR:/i, '').trim();
                why = parts[1] ? parts[1].trim() : '';
            }
            setFormData({ id: tech.id, name: tech.name, howTo: how, whyTo: why, steps: tech.steps || [], videoUrl: tech.videoUrl || '' });
        } else {
            setFormData({ id: null, name: '', howTo: '', whyTo: '', steps: [], videoUrl: '' });
        }
        setModalVisible(true);
    };

    const addStep = (typeKey) => {
        const newStep = { id: Math.random().toString(), type: typeKey, paramValue: '' };
        setFormData(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
    };

    const removeStep = (stepId) => {
        setFormData(prev => ({ ...prev, steps: prev.steps.filter(s => s.id !== stepId) }));
    };

    const updateStepParam = (stepId, value) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map(s => s.id === stepId ? { ...s, paramValue: value } : s)
        }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return Alert.alert("Aviso", "A técnica precisa de um nome.");
        if (formData.steps.length === 0) return Alert.alert("Aviso", "Adicione pelo menos um passo na técnica.");
        if (!formData.howTo.trim() || !formData.whyTo.trim()) return Alert.alert("Aviso", "Preencha o 'Como Executar' e o 'Por Que Fazer'.");

        setSaving(true);
        const method = formData.id ? 'PUT' : 'POST';
        const url = API_URL;

        // Monta a string padronizada do PA ELITE TEAM antes de salvar no banco
        const finalDescription = `COMO EXECUTAR:\n${formData.howTo.trim()}\n\nPOR QUE FAZER:\n${formData.whyTo.trim()}`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ 
                    id: formData.id, 
                    name: formData.name, 
                    description: finalDescription, 
                    steps: formData.steps, 
                    coachId, 
                    isGlobal: false,
                    videoUrl: formData.videoUrl.trim() || null,
                })
            });

            if (res.ok) {
                setModalVisible(false);
                fetchTechniques(coachId);
            } else {
                Alert.alert("Erro", "Falha ao salvar a técnica.");
            }
        } catch (error) {
            Alert.alert("Erro", "Erro de conexão.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert("Atenção", "Tem certeza que deseja apagar esta técnica?", [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Apagar", style: "destructive",
                onPress: async () => {
                    try {
                        const res = await fetch(`${API_URL}?id=${id}&coachId=${coachId}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
                        if (res.ok) fetchTechniques(coachId);
                        else {
                            const data = await res.json();
                            Alert.alert("Erro", data.error || "Falha ao apagar.");
                        }
                    } catch (e) {
                        Alert.alert("Erro", "Falha ao apagar.");
                    }
                } 
            }
        ]);
    };

    const rootWebStyle = Platform.OS === 'web' ? { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } : { flex: 1 };

    return (
        <SafeAreaView style={[styles.container, rootWebStyle, { backgroundColor: theme.bg }]}>
            <View style={{ flex: 1, flexShrink: 1, overflow: 'hidden', width: '100%', maxWidth: containerMaxWidth, alignSelf: 'center', backgroundColor: theme.bg }}>
                {/* HEADER */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>TÉCNICAS AVANÇADAS</Text>
                        <Text style={[styles.subtitle, { color: theme.accent }]}>Laboratório de Execução</Text>
                    </View>
                    <TouchableOpacity onPress={() => openModal()} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
                        <MaterialCommunityIcons name="plus" size={20} color="#000" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color={theme.accent} /></View>
                ) : (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={true}>

                        {/* SEÇÃO: vídeos das técnicas fixas do sistema (escopadas por time) */}
                        <Text style={[styles.sectionLabel, { color: theme.accent }]}>VÍDEOS — TÉCNICAS DO SISTEMA</Text>
                        <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
                            Cole o link do YouTube (formato 9:16) de cada técnica fixa. Texto e áudio dessas técnicas já existem no app — aqui você só adiciona o vídeo demonstrativo. Esses vídeos valem só para o seu time.
                        </Text>

                    {SYSTEM_TECHNIQUES.map(tech => {
                        const hasVideo = !!systemVideos[tech.key];
                        const isSavingThis = savingSystemKey === tech.key;
                        return (
                            <View key={tech.key} style={[styles.systemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.systemCardHeader}>
                                    <MaterialCommunityIcons name={tech.icon} size={18} color={tech.color} />
                                    <Text style={[styles.systemCardTitle, { color: theme.text }]}>{tech.label}</Text>
                                    {hasVideo && (
                                        <View style={[styles.videoBadge, { backgroundColor: '#34C75922' }]}>
                                            <MaterialCommunityIcons name="check-circle" size={12} color="#34C759" />
                                            <Text style={{ color: '#34C759', fontSize: 9, fontWeight: '900' }}>COM VÍDEO</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.systemCardRow}>
                                    <TextInput
                                        style={[styles.systemInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                        placeholder="https://youtube.com/shorts/..."
                                        placeholderTextColor={theme.textSecondary}
                                        value={systemVideoInputs[tech.key] || ''}
                                        onChangeText={t => setSystemVideoInputs(prev => ({ ...prev, [tech.key]: t }))}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        style={[styles.systemSaveBtn, { backgroundColor: theme.accent }]}
                                        onPress={() => handleSaveSystemVideo(tech.key)}
                                        disabled={isSavingThis}
                                    >
                                        {isSavingThis ? <ActivityIndicator size="small" color="#000" /> : <MaterialCommunityIcons name="content-save" size={18} color="#000" />}
                                    </TouchableOpacity>
                                    {hasVideo && (
                                        <TouchableOpacity
                                            style={[styles.systemRemoveBtn, { borderColor: theme.border }]}
                                            onPress={() => handleRemoveSystemVideo(tech.key)}
                                            disabled={isSavingThis}
                                        >
                                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    })}

                    <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 25 }]} />

                    {/* LISTAGEM DE TÉCNICAS CUSTOMIZADAS (isoladas por coach) */}
                    <Text style={[styles.sectionLabel, { color: theme.accent }]}>SUAS TÉCNICAS CUSTOMIZADAS</Text>

                    {techniques.length === 0 && (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhuma técnica cadastrada. Crie seu primeiro combo!</Text>
                    )}
                    {techniques.map(tech => (
                        <View key={tech.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={[styles.cardTitle, { color: theme.text }]}>{tech.name}</Text>
                                        {tech.videoUrl && <MaterialCommunityIcons name="play-circle" size={16} color={theme.accent} />}
                                    </View>
                                    {tech.description ? <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>{tech.description}</Text> : null}
                                </View>
                                {(!tech.isGlobal && tech.coachId === coachId) ? (
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity onPress={() => openModal(tech)} style={styles.actionBtn}>
                                            <MaterialCommunityIcons name="pencil" size={20} color={theme.accent} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(tech.id)} style={styles.actionBtn}>
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={[styles.videoBadge, { backgroundColor: theme.border }]}>
                                        <MaterialCommunityIcons name="earth" size={12} color={theme.textSecondary} />
                                        <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: '900' }}>GLOBAL</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.timeline}>
                                {tech.steps.map((step, index) => {
                                    const st = STEP_TYPES[step.type];
                                    if (!st) return null;
                                    return (
                                        <View key={index} style={styles.timelineStep}>
                                            <MaterialCommunityIcons name={st.icon} size={14} color={st.color} />
                                            <Text style={[styles.timelineText, { color: theme.textSecondary }]}>
                                                {st.label} {step.paramValue ? `(${step.paramValue})` : ''}
                                            </Text>
                                            {index < tech.steps.length - 1 && (
                                                <MaterialCommunityIcons name="chevron-right" size={14} color={theme.border} style={{ marginHorizontal: 4 }} />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                    </ScrollView>
                )}
            </View>

            {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={[styles.modalSheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{formData.id ? 'Editar Técnica' : 'Nova Técnica'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
                            <Text style={[styles.label, { color: theme.text }]}>Nome do Combo / Técnica</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: Drop-Pause Brutal"
                                placeholderTextColor={theme.textSecondary}
                                value={formData.name}
                                onChangeText={t => setFormData(prev => ({ ...prev, name: t }))}
                            />

                            {/* SEÇÃO DIVIDIDA E PADRONIZADA */}
                            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>COMO EXECUTAR:</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                                placeholder="Ex: Execute a série até a falha com a carga principal..."
                                placeholderTextColor={theme.textSecondary}
                                value={formData.howTo}
                                onChangeText={t => setFormData(prev => ({ ...prev, howTo: t }))}
                                multiline={true}
                            />

                            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>POR QUE FAZER:</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                                placeholder="Ex: Aumenta o estresse metabólico exaurindo o glicogênio..."
                                placeholderTextColor={theme.textSecondary}
                                value={formData.whyTo}
                                onChangeText={t => setFormData(prev => ({ ...prev, whyTo: t }))}
                                multiline={true}
                            />

                            {/* Link do vídeo demonstrativo */}
                            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>VÍDEO DEMONSTRATIVO (YouTube, opcional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                placeholder="https://youtube.com/shorts/..."
                                placeholderTextColor={theme.textSecondary}
                                value={formData.videoUrl}
                                onChangeText={t => setFormData(prev => ({ ...prev, videoUrl: t }))}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                            <Text style={[styles.label, { color: theme.accent, marginBottom: 15 }]}>LINHA DO TEMPO DA SÉRIE</Text>

                            {/* Renderização dos Passos (Lego) */}
                            {formData.steps.map((step, index) => {
                                const st = STEP_TYPES[step.type];
                                return (
                                    <View key={step.id} style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <View style={styles.stepHeader}>
                                            <View style={[styles.stepBadge, { backgroundColor: st.color + '20' }]}>
                                                <Text style={{ color: st.color, fontSize: 10, fontWeight: '900' }}>PASSO {index + 1}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => removeStep(step.id)}>
                                                <MaterialCommunityIcons name="close-circle" size={20} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.stepBody}>
                                            <MaterialCommunityIcons name={st.icon} size={24} color={st.color} />
                                            <Text style={[styles.stepLabel, { color: theme.text }]}>{st.label}</Text>
                                            {st.hasParam && (
                                                <TextInput
                                                    style={[styles.stepInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                                    placeholder={st.paramLabel}
                                                    placeholderTextColor={theme.textSecondary}
                                                    value={step.paramValue}
                                                    onChangeText={v => updateStepParam(step.id, v)}
                                                />
                                            )}
                                        </View>
                                    </View>
                                );
                            })}

                            {/* Botões para adicionar passos */}
                            <View style={styles.addStepGrid}>
                                {Object.keys(STEP_TYPES).map(key => (
                                    <TouchableOpacity key={key} style={[styles.addStepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => addStep(key)}>
                                        <MaterialCommunityIcons name={STEP_TYPES[key].icon} size={16} color={STEP_TYPES[key].color} />
                                        <Text style={[styles.addStepText, { color: theme.textSecondary }]}>+ {STEP_TYPES[key].label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity 
                                style={[styles.saveBtn, { backgroundColor: saving ? theme.border : theme.accent }]} 
                                onPress={handleSave} disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>SALVAR COMBO</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    backBtn: { marginRight: 15 },
    title: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    subtitle: { fontSize: 11, fontWeight: '700' },
    addBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 'auto' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    list: { padding: 20, paddingBottom: 100, flexGrow: 1 },
    
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 13, fontWeight: '600' },

    sectionLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, marginBottom: 6 },
    sectionHint: { fontSize: 11, lineHeight: 16, marginBottom: 15 },

    systemCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
    systemCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    systemCardTitle: { fontSize: 13, fontWeight: '800', flex: 1 },
    videoBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
    systemCardRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    systemInput: { flex: 1, height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 12, fontWeight: '600' },
    systemSaveBtn: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    systemRemoveBtn: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

    card: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    cardTitle: { fontSize: 15, fontWeight: '900' },
    cardDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
    cardActions: { flexDirection: 'row', gap: 10 },
    actionBtn: { padding: 5 },
    timeline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
    timelineStep: { flexDirection: 'row', alignItems: 'center' },
    timelineText: { fontSize: 11, fontWeight: '800', marginLeft: 4 },

    modalBg: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalSheet: { height: '90%', flexShrink: 1, overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '900' },
    
    label: { fontSize: 11, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
    input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 14, fontWeight: '600' },
    divider: { height: 1, marginVertical: 20 },

    stepCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
    stepHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    stepBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    stepBody: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepLabel: { fontSize: 14, fontWeight: '800', flex: 1 },
    stepInput: { height: 36, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 12, fontWeight: '700', width: 100, textAlign: 'center' },

    addStepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 30 },
    addStepBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    addStepText: { fontSize: 11, fontWeight: '800' },

    saveBtn: { height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});