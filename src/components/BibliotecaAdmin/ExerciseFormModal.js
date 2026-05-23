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

export default function ExerciseFormModal({ visible, onClose, initialData, onSaveSuccess, theme }) {
    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    const defaultExercise = { 
        id: null, name: '', category: 'Peito', subCategory: 'Geral', videoUrl: '', environments: ['ACADEMIA'] 
    };

    const [formExercise, setFormExercise] = useState(defaultExercise);
    const [showFormDropdown, setShowFormDropdown] = useState(false);
    const [showFormSubDropdown, setShowFormSubDropdown] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    // Atualiza o formulário quando o modal abre com dados de edição
    useEffect(() => {
        if (visible) {
            setFormExercise(initialData || defaultExercise);
            setShowFormDropdown(false);
            setShowFormSubDropdown(false);
        }
    }, [visible, initialData]);

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
                formData.append('file', {
                    uri: fileToUpload.uri,
                    name: fileToUpload.name || 'video.mp4',
                    type: fileToUpload.mimeType || 'video/mp4'
                });
            }

            const response = await fetch('https://fitos-final.onrender.com/api/upload', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            const data = await response.json();

            if (response.ok && data.videoUrl) {
                setFormExercise({ ...formExercise, videoUrl: data.videoUrl });
                const msg = "Vídeo enviado para a Cloudflare! Pode salvar o exercício.";
                if(isWeb) window.alert(msg); else Alert.alert("Sucesso", msg);
            } else {
                throw new Error(data.error || 'Erro no envio do vídeo.');
            }
        } catch (error) {
            const errMsg = "Falha ao subir vídeo: " + error.message;
            if(isWeb) window.alert(errMsg); else Alert.alert("Erro de Upload", errMsg);
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleSaveOrUpdate = async () => {
        if (!formExercise.name) return Alert.alert("Campos Incompletos", "O nome do exercício é obrigatório.");
        if (formExercise.environments.length === 0) return Alert.alert("Atenção", "Selecione pelo menos um ambiente de treino.");

        setSaving(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            if (!userJson) return;
            const adminId = JSON.parse(userJson).id;

            const payload = { ...formExercise, adminId: adminId };
            const isEditing = !!formExercise.id;

            const res = await fetch('https://fitos-final.onrender.com/api/exercise', {
                method: isEditing ? 'PUT' : 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const savedExerciseFromServer = await res.json();
                onSaveSuccess(savedExerciseFromServer, isEditing);
                onClose();

                if(isWeb) window.alert("Exercício salvo com sucesso!");
                else Alert.alert("Sucesso", "Exercício salvo com sucesso!");
            } else { 
                const errorData = await res.json();
                if(isWeb) window.alert(errorData.error || "Erro ao salvar.");
                else Alert.alert("Atenção", errorData.error || "Erro ao salvar."); 
            }
        } catch (e) { 
            if(isWeb) window.alert(e.message); else Alert.alert("Erro de Conexão", e.message); 
        } finally { 
            setSaving(false); 
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
                <SafeAreaView style={{ flex:1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border, borderRadius: 24, marginVertical: '2.5%', overflow: 'hidden'} : {}) }}>

                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{formExercise.id ? 'EDITAR EXERCÍCIO' : 'NOVO EXERCÍCIO'}</Text>
                        <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="close" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>NOME DO EXERCÍCIO</Text>
                        <TextInput 
                            style={[styles.modalInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                            value={formExercise.name} 
                            onChangeText={t => setFormExercise({...formExercise, name: t})} 
                            placeholder="Ex: Supino Reto com Halteres" 
                            placeholderTextColor={theme.textSecondary} 
                        />

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>GRUPO MUSCULAR ALVO</Text>
                        <TouchableOpacity 
                            style={[styles.catSelector, { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: showFormDropdown ? 10 : 25 }]}
                            onPress={() => setShowFormDropdown(!showFormDropdown)}
                        >
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                <MaterialCommunityIcons name="format-list-bulleted" size={20} color={theme.textSecondary} />
                                <Text style={[styles.catSelectorVal, { color: theme.text }]}>{formExercise.category.toUpperCase()}</Text>
                            </View>
                            <MaterialCommunityIcons name={showFormDropdown ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {showFormDropdown && (
                            <View style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, marginBottom: 25, padding: 10, maxHeight: 200 }}>
                                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                    {categories.filter(c => c !== 'TODOS').map(cat => (
                                        <TouchableOpacity 
                                            key={cat} 
                                            style={[styles.dropdownItem, formExercise.category === cat && { backgroundColor: theme.accent + '22' }]}
                                            onPress={() => { 
                                                const hasSubs = subCategoriesMap[cat] && subCategoriesMap[cat].length > 1;
                                                setFormExercise({...formExercise, category: cat, subCategory: hasSubs ? 'Geral' : 'Geral'}); 
                                                setShowFormDropdown(false); 
                                            }}
                                        >
                                            <Text style={{ color: formExercise.category === cat ? theme.accent : theme.text, fontWeight: formExercise.category === cat ? 'bold' : '500' }}>{cat}</Text>
                                            {formExercise.category === cat && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {subCategoriesMap[formExercise.category] && (
                            <>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>SUBCATEGORIA (MÁQUINA/MOVIMENTO)</Text>
                                <TouchableOpacity 
                                    style={[styles.catSelector, { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: showFormSubDropdown ? 10 : 25 }]}
                                    onPress={() => setShowFormSubDropdown(!showFormSubDropdown)}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                        <MaterialCommunityIcons name="tag-outline" size={20} color={theme.textSecondary} />
                                        <Text style={[styles.catSelectorVal, { color: theme.text }]}>{(formExercise.subCategory || 'Geral').toUpperCase()}</Text>
                                    </View>
                                    <MaterialCommunityIcons name={showFormSubDropdown ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                                </TouchableOpacity>

                                {showFormSubDropdown && (
                                    <View style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, marginBottom: 25, padding: 10 }}>
                                        {subCategoriesMap[formExercise.category].filter(c => c !== 'Todos').map(sub => (
                                            <TouchableOpacity 
                                                key={sub} 
                                                style={[styles.dropdownItem, formExercise.subCategory === sub && { backgroundColor: theme.accent + '22' }]}
                                                onPress={() => { setFormExercise({...formExercise, subCategory: sub}); setShowFormSubDropdown(false); }}
                                            >
                                                <Text style={{ color: formExercise.subCategory === sub ? theme.accent : theme.text, fontWeight: formExercise.subCategory === sub ? 'bold' : '500' }}>{sub}</Text>
                                                {formExercise.subCategory === sub && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity 
                                            style={[styles.dropdownItem, formExercise.subCategory === 'Geral' && { backgroundColor: theme.accent + '22' }]}
                                            onPress={() => { setFormExercise({...formExercise, subCategory: 'Geral'}); setShowFormSubDropdown(false); }}
                                        >
                                            <Text style={{ color: formExercise.subCategory === 'Geral' ? theme.accent : theme.text, fontWeight: formExercise.subCategory === 'Geral' ? 'bold' : '500' }}>Geral</Text>
                                            {formExercise.subCategory === 'Geral' && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>AMBIENTE DE TREINO</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 }}>
                            {['ACADEMIA', 'CONDOMÍNIO', 'CASA'].map(env => {
                                const isSelected = formExercise.environments.includes(env);
                                return (
                                    <TouchableOpacity
                                        key={env}
                                        style={[
                                            styles.envChip,
                                            { borderColor: theme.border, backgroundColor: theme.bg },
                                            isSelected && { backgroundColor: theme.accent + '20', borderColor: theme.accent }
                                        ]}
                                        onPress={() => {
                                            let newEnvs = [...formExercise.environments];
                                            if (isSelected) newEnvs = newEnvs.filter(e => e !== env);
                                            else newEnvs.push(env);
                                            setFormExercise({ ...formExercise, environments: newEnvs });
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={env === 'CASA' ? 'home-outline' : env === 'CONDOMÍNIO' ? 'office-building' : 'dumbbell'}
                                            size={14}
                                            color={isSelected ? theme.accent : theme.textSecondary}
                                        />
                                        <Text style={{ color: isSelected ? theme.accent : theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>{env}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>VÍDEO DO EXERCÍCIO</Text>
                        <TouchableOpacity 
                            style={[styles.uploadBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} 
                            onPress={handleUploadVideo}
                            disabled={uploadingVideo}
                        >
                            {uploadingVideo ? (
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <ActivityIndicator color={theme.accent} size="small" />
                                    <Text style={{color: theme.accent, marginLeft: 10, fontWeight: '800'}}>ENVIANDO PARA A NUVEM...</Text>
                                </View>
                            ) : (
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <MaterialCommunityIcons name="cloud-upload" size={24} color={theme.accent} />
                                    <Text style={{color: theme.accent, marginLeft: 10, fontWeight: '800'}}>FAZER UPLOAD DE VÍDEO</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>OU COLE O LINK DO VÍDEO (URL)</Text>
                        <TextInput 
                            style={[styles.modalInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                            value={formExercise.videoUrl} 
                            onChangeText={t => setFormExercise({...formExercise, videoUrl: t})} 
                            placeholder="https://..." 
                            placeholderTextColor={theme.textSecondary} 
                            autoCapitalize="none" 
                        />

                        <TouchableOpacity style={[styles.btnSave, { backgroundColor: theme.accent }]} onPress={handleSaveOrUpdate} disabled={saving || uploadingVideo}>
                            {saving ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <Text style={[styles.btnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR NA BIBLIOTECA</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// Substitua apenas o StyleSheet no final do arquivo ExerciseFormModal.js
const styles = StyleSheet.create({
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    backBtn: { padding: 10, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    inputLabel: { fontSize: 12, fontWeight: '800', marginBottom: 12, letterSpacing: 1, marginLeft: 4 },

    // Inputs sem borda, com fundo e padding maior
    modalInput: { borderRadius: 16, padding: 20, fontSize: 16, fontWeight: '600', marginBottom: 25, outlineStyle: 'none' },

    catSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderRadius: 16, marginBottom: 25 },
    catSelectorVal: { fontSize: 15, fontWeight: '800' },
    dropdownItem: { padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    envChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14 },

    uploadBtn: { padding: 20, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },

    btnSave: { padding: 22, borderRadius: 20, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
    btnText: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }
});