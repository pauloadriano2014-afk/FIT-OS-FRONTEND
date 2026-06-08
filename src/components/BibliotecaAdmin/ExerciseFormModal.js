import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, TextInput, 
    Modal, ActivityIndicator, Alert, KeyboardAvoidingView, 
    Platform, ScrollView, SafeAreaView 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { categories, subCategoriesMap } from '../../data/bibliotecaData';

const ENVIRONMENTS = [
  { id: 'UNIVERSAL',       label: 'Universal',        icon: 'earth',           desc: 'Disponível em todos os ambientes' },
  { id: 'SMARTFIT',        label: 'SmartFit',          icon: 'lightning-bolt',  desc: 'Equipamentos exclusivos SmartFit' },
  { id: 'GETGYM',          label: 'GetGym',            icon: 'dumbbell',        desc: 'Equipamentos exclusivos GetGym' },
  { id: 'OVERALL',         label: 'Overall',           icon: 'dumbbell',        desc: 'Equipamentos exclusivos Overall' },
  { id: 'BRAVES',          label: 'Braves',            icon: 'dumbbell',        desc: 'Equipamentos exclusivos Braves' },
  { id: 'SEVENPLAY',       label: 'SevenPlay',         icon: 'dumbbell',        desc: 'Equipamentos exclusivos SevenPlay' },
  { id: 'ACADEMIA_PADRAO', label: 'Academia Padrão',   icon: 'weight-lifter',   desc: 'Academia genérica com equipamentos comuns' },
  { id: 'CONDOMINIO',      label: 'Condomínio',        icon: 'office-building', desc: 'Equipamentos limitados de condomínio' },
  { id: 'EM_CASA',         label: 'Em Casa',           icon: 'home-outline',    desc: 'Poucos equipamentos ou peso do corpo' },
];

const ENV_COLORS = {
  UNIVERSAL: '#4ECDC4', SMARTFIT: '#FF6B35', GETGYM: '#9B59B6',
  OVERALL: '#2ECC71', BRAVES: '#E74C3C', SEVENPLAY: '#F39C12',
  ACADEMIA_PADRAO: '#3498DB', CONDOMINIO: '#95A5A6', EM_CASA: '#82E0AA',
};

const migrateEnvs = (envs) => {
  if (!envs || envs.length === 0) return ['ACADEMIA_PADRAO'];
  return envs.map(e => {
    if (e === 'ACADEMIA') return 'ACADEMIA_PADRAO';
    if (e === 'CONDOMÍNIO' || e === 'CONDOMINIO') return 'CONDOMINIO';
    if (e === 'CASA') return 'EM_CASA';
    return e;
  });
};

export default function ExerciseFormModal({ visible, onClose, initialData, onSaveSuccess, theme }) {
    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const defaultExercise = { id: null, name: '', category: 'Peito', subCategory: 'Geral', videoUrl: '', environments: ['ACADEMIA_PADRAO'] };

    const [formExercise, setFormExercise] = useState(defaultExercise);
    const [showFormDropdown, setShowFormDropdown] = useState(false);
    const [showFormSubDropdown, setShowFormSubDropdown] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    useEffect(() => {
        if (visible) {
            setFormExercise({ ...(initialData || defaultExercise), environments: migrateEnvs(initialData?.environments) });
            setShowFormDropdown(false);
            setShowFormSubDropdown(false);
        }
    }, [visible, initialData]);

    const toggleEnv = (envId) => {
        let newEnvs = [...formExercise.environments];
        if (envId === 'UNIVERSAL') {
            newEnvs = newEnvs.includes('UNIVERSAL') ? [] : ['UNIVERSAL'];
        } else {
            newEnvs = newEnvs.filter(e => e !== 'UNIVERSAL');
            if (newEnvs.includes(envId)) newEnvs = newEnvs.filter(e => e !== envId);
            else newEnvs.push(envId);
        }
        setFormExercise({ ...formExercise, environments: newEnvs });
    };

    const handleUploadVideo = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
            if (result.canceled) return;
            const fileToUpload = result.assets[0];
            setUploadingVideo(true);
            const formData = new FormData();
            if (isWeb) {
                const res = await fetch(fileToUpload.uri);
                const blob = await res.blob();
                formData.append('file', blob, fileToUpload.name);
            } else {
                formData.append('file', { uri: fileToUpload.uri, name: fileToUpload.name || 'video.mp4', type: fileToUpload.mimeType || 'video/mp4' });
            }
            const response = await fetch('https://fitos-final.onrender.com/api/upload', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
            const data = await response.json();
            if (response.ok && data.videoUrl) {
                setFormExercise({ ...formExercise, videoUrl: data.videoUrl });
                if (isWeb) window.alert("Vídeo enviado!"); else Alert.alert("Sucesso", "Vídeo enviado!");
            } else throw new Error(data.error || 'Erro no envio.');
        } catch (error) {
            if (isWeb) window.alert("Erro: " + error.message); else Alert.alert("Erro", error.message);
        } finally { setUploadingVideo(false); }
    };

    const handleSaveOrUpdate = async () => {
        if (!formExercise.name.trim()) return Alert.alert("Atenção", "O nome é obrigatório.");
        if (formExercise.environments.length === 0) return Alert.alert("Atenção", "Selecione pelo menos um ambiente.");
        setSaving(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            if (!userJson) return;
            const adminId = JSON.parse(userJson).id;
            const isEditing = !!formExercise.id;
            const res = await fetch('https://fitos-final.onrender.com/api/exercise', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formExercise, adminId }),
            });
            if (res.ok) {
                const saved = await res.json();
                onSaveSuccess(saved, isEditing);
                onClose();
                if (isWeb) window.alert("Exercício salvo!"); else Alert.alert("Sucesso", "Exercício salvo!");
            } else {
                const err = await res.json();
                if (isWeb) window.alert(err.error || "Erro."); else Alert.alert("Erro", err.error || "Erro.");
            }
        } catch (e) {
            if (isWeb) window.alert(e.message); else Alert.alert("Erro", e.message);
        } finally { setSaving(false); }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
                <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border, borderRadius: 24, marginVertical: '2.5%', overflow: 'hidden' } : {}) }}>

                    <View style={[S.header, { borderBottomColor: theme.border }]}>
                        <Text style={[S.title, { color: theme.text }]}>{formExercise.id ? 'EDITAR EXERCÍCIO' : 'NOVO EXERCÍCIO'}</Text>
                        <TouchableOpacity onPress={onClose} style={[S.closeBtn, { backgroundColor: theme.surface }]}>
                            <MaterialCommunityIcons name="close" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

                        <Text style={[S.label, { color: theme.textSecondary }]}>NOME DO EXERCÍCIO</Text>
                        <TextInput style={[S.input, { backgroundColor: theme.surface, color: theme.text }]} value={formExercise.name} onChangeText={t => setFormExercise({ ...formExercise, name: t })} placeholder="Ex: Supino Reto com Halteres" placeholderTextColor={theme.textSecondary} />

                        <Text style={[S.label, { color: theme.textSecondary }]}>GRUPO MUSCULAR ALVO</Text>
                        <TouchableOpacity style={[S.selector, { backgroundColor: theme.surface, marginBottom: showFormDropdown ? 8 : 20 }]} onPress={() => setShowFormDropdown(!showFormDropdown)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <MaterialCommunityIcons name="format-list-bulleted" size={18} color={theme.textSecondary} />
                                <Text style={[S.selectorText, { color: theme.text }]}>{formExercise.category.toUpperCase()}</Text>
                            </View>
                            <MaterialCommunityIcons name={showFormDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                        {showFormDropdown && (
                            <View style={[S.dropdown, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 20 }]}>
                                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }}>
                                    {categories.filter(c => c !== 'TODOS').map(cat => (
                                        <TouchableOpacity key={cat} style={[S.dropItem, formExercise.category === cat && { backgroundColor: theme.accent + '20' }]} onPress={() => { setFormExercise({ ...formExercise, category: cat, subCategory: 'Geral' }); setShowFormDropdown(false); }}>
                                            <Text style={{ color: formExercise.category === cat ? theme.accent : theme.text, fontWeight: formExercise.category === cat ? '800' : '500' }}>{cat}</Text>
                                            {formExercise.category === cat && <MaterialCommunityIcons name="check" size={16} color={theme.accent} />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {subCategoriesMap[formExercise.category] && (
                            <>
                                <Text style={[S.label, { color: theme.textSecondary }]}>SUBCATEGORIA</Text>
                                <TouchableOpacity style={[S.selector, { backgroundColor: theme.surface, marginBottom: showFormSubDropdown ? 8 : 20 }]} onPress={() => setShowFormSubDropdown(!showFormSubDropdown)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <MaterialCommunityIcons name="tag-outline" size={18} color={theme.textSecondary} />
                                        <Text style={[S.selectorText, { color: theme.text }]}>{(formExercise.subCategory || 'Geral').toUpperCase()}</Text>
                                    </View>
                                    <MaterialCommunityIcons name={showFormSubDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                                {showFormSubDropdown && (
                                    <View style={[S.dropdown, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 20 }]}>
                                        {[...subCategoriesMap[formExercise.category].filter(c => c !== 'Todos'), 'Geral'].map(sub => (
                                            <TouchableOpacity key={sub} style={[S.dropItem, formExercise.subCategory === sub && { backgroundColor: theme.accent + '20' }]} onPress={() => { setFormExercise({ ...formExercise, subCategory: sub }); setShowFormSubDropdown(false); }}>
                                                <Text style={{ color: formExercise.subCategory === sub ? theme.accent : theme.text, fontWeight: formExercise.subCategory === sub ? '800' : '500' }}>{sub}</Text>
                                                {formExercise.subCategory === sub && <MaterialCommunityIcons name="check" size={16} color={theme.accent} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        {/* AMBIENTES */}
                        <Text style={[S.label, { color: theme.textSecondary }]}>AMBIENTE DE TREINO</Text>
                        <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 12 }}>
                            "Universal" aparece em todos. Para máquinas exclusivas, marque só a academia específica.
                        </Text>
                        <View style={{ gap: 8, marginBottom: 24 }}>
                            {ENVIRONMENTS.map(env => {
                                const isSel = formExercise.environments.includes(env.id);
                                const color = ENV_COLORS[env.id] || theme.accent;
                                return (
                                    <TouchableOpacity key={env.id} style={[S.envRow, { backgroundColor: isSel ? color + '12' : theme.surface, borderColor: isSel ? color + '50' : theme.border }]} onPress={() => toggleEnv(env.id)}>
                                        <View style={[S.envIconBox, { backgroundColor: isSel ? color + '20' : theme.bg }]}>
                                            <MaterialCommunityIcons name={env.icon} size={15} color={isSel ? color : theme.textSecondary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '800', color: isSel ? color : theme.text }}>{env.label}</Text>
                                            <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 1 }}>{env.desc}</Text>
                                        </View>
                                        <View style={[S.checkbox, { backgroundColor: isSel ? color : 'transparent', borderColor: isSel ? color : theme.border }]}>
                                            {isSel && <MaterialCommunityIcons name="check" size={11} color="#FFF" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* VÍDEO */}
                        <Text style={[S.label, { color: theme.textSecondary }]}>VÍDEO DO EXERCÍCIO</Text>
                        <TouchableOpacity style={[S.uploadBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '12' }]} onPress={handleUploadVideo} disabled={uploadingVideo}>
                            {uploadingVideo
                                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><ActivityIndicator color={theme.accent} size="small" /><Text style={{ color: theme.accent, fontWeight: '800' }}>ENVIANDO...</Text></View>
                                : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name="cloud-upload" size={20} color={theme.accent} /><Text style={{ color: theme.accent, fontWeight: '800' }}>FAZER UPLOAD DE VÍDEO</Text></View>
                            }
                        </TouchableOpacity>
                        <Text style={[S.label, { color: theme.textSecondary, marginTop: 14 }]}>OU COLE O LINK (URL)</Text>
                        <TextInput style={[S.input, { backgroundColor: theme.surface, color: theme.text }]} value={formExercise.videoUrl} onChangeText={t => setFormExercise({ ...formExercise, videoUrl: t })} placeholder="https://..." placeholderTextColor={theme.textSecondary} autoCapitalize="none" />

                        <TouchableOpacity style={[S.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSaveOrUpdate} disabled={saving || uploadingVideo}>
                            {saving ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <Text style={[S.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR NA BIBLIOTECA</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const S = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1 },
    title: { fontSize: 18, fontWeight: '900' },
    closeBtn: { padding: 8, borderRadius: 12 },
    label: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10, marginLeft: 2 },
    input: { borderRadius: 14, padding: 16, fontSize: 15, fontWeight: '600', marginBottom: 20, outlineStyle: 'none' },
    selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14 },
    selectorText: { fontSize: 14, fontWeight: '800' },
    dropdown: { borderRadius: 14, borderWidth: 1, padding: 8, marginBottom: 20 },
    dropItem: { padding: 13, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    envRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11, borderRadius: 13, borderWidth: 1 },
    envIconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    uploadBtn: { padding: 18, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', marginBottom: 8 },
    saveBtn: { padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 8 },
    saveBtnText: { fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});