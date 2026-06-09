// src/components/Admin/ExerciseFormModal.js
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
  { id: 'SMARTFIT',        label: 'SmartFit',         icon: 'lightning-bolt',  desc: 'Equipamentos exclusivos SmartFit' },
  { id: 'GETGYM',          label: 'GetGym',           icon: 'dumbbell',        desc: 'Equipamentos exclusivos GetGym' },
  { id: 'OVERALL',         label: 'Overall',          icon: 'dumbbell',        desc: 'Equipamentos exclusivos Overall' },
  { id: 'BRAVES',          label: 'Braves',           icon: 'dumbbell',        desc: 'Equipamentos exclusivos Braves' },
  { id: 'SEVENPLAY',       label: 'SevenPlay',        icon: 'dumbbell',        desc: 'Equipamentos exclusivos SevenPlay' },
  { id: 'ACADEMIA_PADRAO', label: 'Academia Padrão',  icon: 'weight-lifter',   desc: 'Academia genérica (equip. comuns)' },
  { id: 'CONDOMINIO',      label: 'Condomínio',       icon: 'office-building', desc: 'Equipamentos limitados' },
  { id: 'EM_CASA',         label: 'Em Casa',          icon: 'home-outline',    desc: 'Poucos equipamentos ou peso livre' },
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
    const defaultExercise = { id: null, name: '', category: 'Peito', subCategory: 'Geral', videoUrl: '', environments: ['ACADEMIA_PADRAO'], defaultSubstitutes: [] };

    const [formExercise, setFormExercise] = useState(defaultExercise);
    const [activeTab, setActiveTab] = useState('GERAL');
    
    const [showFormDropdown, setShowFormDropdown] = useState(false);
    const [showFormSubDropdown, setShowFormSubDropdown] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    const [allAdminExercises, setAllAdminExercises] = useState([]);
    const [loadingExercises, setLoadingExercises] = useState(false);
    const [substituteDetails, setSubstituteDetails] = useState([]); 

    useEffect(() => {
        if (visible) {
            setActiveTab('GERAL');
            setShowFormDropdown(false);
            setShowFormSubDropdown(false);
            
            // Inicia com os dados passados, mas vai corrigir assim que o banco responder
            setFormExercise({ 
                ...(initialData || defaultExercise), 
                environments: migrateEnvs(initialData?.environments), 
                defaultSubstitutes: initialData?.defaultSubstitutes || [] 
            });

            AsyncStorage.getItem('user').then(userJson => {
                if (userJson) {
                    const adminId = JSON.parse(userJson).id;
                    setLoadingExercises(true);
                    
                    fetch(`https://fitos-final.onrender.com/api/exercise?adminId=${adminId}`)
                        .then(res => res.json())
                        .then(data => { 
                            if (Array.isArray(data)) {
                                setAllAdminExercises(data); 

                                // 🔥 A MÁGICA: Buscar a verdade direto do banco fresco!
                                if (initialData?.id) {
                                    const freshDbExercise = data.find(e => e.id === initialData.id);
                                    if (freshDbExercise) {
                                        const savedSubs = freshDbExercise.defaultSubstitutes || [];
                                        
                                        // Atualiza o formulário com os IDs reais do banco
                                        setFormExercise(prev => ({ ...prev, defaultSubstitutes: savedSubs }));
                                        
                                        // Mapeia os IDs para preencher a caixa de selecionados no topo
                                        const details = savedSubs.map(subId => data.find(e => e.id === subId)).filter(Boolean);
                                        setSubstituteDetails(details);
                                    }
                                } else {
                                    setSubstituteDetails([]);
                                }
                            }
                        })
                        .catch(() => {})
                        .finally(() => setLoadingExercises(false));
                }
            });
        }
    }, [visible, initialData]);

    const suggestedSubstitutes = allAdminExercises
        .filter(e => 
            e.category === formExercise.category && 
            e.id !== formExercise.id && 
            !(formExercise.defaultSubstitutes || []).includes(e.id)
        )
        .sort((a, b) => {
            if (a.subCategory === formExercise.subCategory && b.subCategory !== formExercise.subCategory) return -1;
            if (a.subCategory !== formExercise.subCategory && b.subCategory === formExercise.subCategory) return 1;
            return a.name.localeCompare(b.name);
        });

    const addSubstitute = (exercise) => {
        const current = formExercise.defaultSubstitutes || [];
        if (current.length >= 3) return;
        setFormExercise({ ...formExercise, defaultSubstitutes: [...current, exercise.id] });
        setSubstituteDetails([...substituteDetails, exercise]);
    };

    const removeSubstitute = (exerciseId) => {
        setFormExercise({ ...formExercise, defaultSubstitutes: (formExercise.defaultSubstitutes || []).filter(id => id !== exerciseId) });
        setSubstituteDetails(substituteDetails.filter(e => e.id !== exerciseId));
    };

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
                if (isWeb) window.alert("Exercício salvo com sucesso!"); else Alert.alert("Sucesso", "Exercício salvo com sucesso!");
            } else {
                const err = await res.json();
                if (isWeb) window.alert(err.error || "Erro."); else Alert.alert("Erro", err.error || "Erro.");
            }
        } catch (e) {
            if (isWeb) window.alert(e.message); else Alert.alert("Erro", e.message);
        } finally { setSaving(false); }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'GERAL':
                return (
                    <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
                        <Text style={[S.label, { color: theme.textSecondary }]}>NOME DO EXERCÍCIO</Text>
                        <TextInput style={[S.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={formExercise.name} onChangeText={t => setFormExercise({ ...formExercise, name: t })} placeholder="Ex: Supino Reto com Halteres" placeholderTextColor={theme.textSecondary} />

                        <View style={{ flexDirection: isWeb ? 'row' : 'column', gap: 20, marginBottom: 20 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[S.label, { color: theme.textSecondary }]}>GRUPO MUSCULAR</Text>
                                <TouchableOpacity style={[S.selector, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setShowFormDropdown(!showFormDropdown)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <MaterialCommunityIcons name="format-list-bulleted" size={18} color={theme.textSecondary} />
                                        <Text style={[S.selectorText, { color: theme.text }]}>{formExercise.category.toUpperCase()}</Text>
                                    </View>
                                    <MaterialCommunityIcons name={showFormDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                                {showFormDropdown && (
                                    <View style={[S.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }}>
                                            {categories.filter(c => c !== 'TODOS').map(cat => (
                                                <TouchableOpacity key={cat} style={[S.dropItem, formExercise.category === cat && { backgroundColor: theme.accent + '15' }]} onPress={() => { setFormExercise({ ...formExercise, category: cat, subCategory: 'Geral' }); setShowFormDropdown(false); }}>
                                                    <Text style={{ color: formExercise.category === cat ? theme.accent : theme.text, fontWeight: formExercise.category === cat ? '800' : '500' }}>{cat}</Text>
                                                    {formExercise.category === cat && <MaterialCommunityIcons name="check" size={16} color={theme.accent} />}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            <View style={{ flex: 1 }}>
                                {subCategoriesMap[formExercise.category] && (
                                    <>
                                        <Text style={[S.label, { color: theme.textSecondary }]}>SUBCATEGORIA</Text>
                                        <TouchableOpacity style={[S.selector, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setShowFormSubDropdown(!showFormSubDropdown)}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <MaterialCommunityIcons name="tag-outline" size={18} color={theme.textSecondary} />
                                                <Text style={[S.selectorText, { color: theme.text }]}>{(formExercise.subCategory || 'Geral').toUpperCase()}</Text>
                                            </View>
                                            <MaterialCommunityIcons name={showFormSubDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                        {showFormSubDropdown && (
                                            <View style={[S.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                {[...subCategoriesMap[formExercise.category].filter(c => c !== 'Todos'), 'Geral'].map(sub => (
                                                    <TouchableOpacity key={sub} style={[S.dropItem, formExercise.subCategory === sub && { backgroundColor: theme.accent + '15' }]} onPress={() => { setFormExercise({ ...formExercise, subCategory: sub }); setShowFormSubDropdown(false); }}>
                                                        <Text style={{ color: formExercise.subCategory === sub ? theme.accent : theme.text, fontWeight: formExercise.subCategory === sub ? '800' : '500' }}>{sub}</Text>
                                                        {formExercise.subCategory === sub && <MaterialCommunityIcons name="check" size={16} color={theme.accent} />}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        </View>

                        <Text style={[S.label, { color: theme.textSecondary }]}>VÍDEO DO EXERCÍCIO</Text>
                        <TouchableOpacity style={[S.uploadBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '12' }]} onPress={handleUploadVideo} disabled={uploadingVideo}>
                            {uploadingVideo
                                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><ActivityIndicator color={theme.accent} size="small" /><Text style={{ color: theme.accent, fontWeight: '800' }}>ENVIANDO...</Text></View>
                                : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name="cloud-upload" size={20} color={theme.accent} /><Text style={{ color: theme.accent, fontWeight: '800' }}>FAZER UPLOAD DE VÍDEO</Text></View>
                            }
                        </TouchableOpacity>
                        <Text style={[S.label, { color: theme.textSecondary, marginTop: 14 }]}>OU COLE O LINK (URL)</Text>
                        <TextInput style={[S.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={formExercise.videoUrl} onChangeText={t => setFormExercise({ ...formExercise, videoUrl: t })} placeholder="https://..." placeholderTextColor={theme.textSecondary} autoCapitalize="none" />
                    </ScrollView>
                );

            case 'ENVS':
                return (
                    <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
                        <Text style={[S.label, { color: theme.textSecondary }]}>AMBIENTE DE TREINO</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 20, lineHeight: 18 }}>
                            "Universal" aparece em todos. Para máquinas exclusivas, marque só a academia específica.
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {ENVIRONMENTS.map(env => {
                                const isSel = formExercise.environments.includes(env.id);
                                const color = ENV_COLORS[env.id] || theme.accent;
                                return (
                                    <TouchableOpacity key={env.id} style={[S.envRow, { width: isWeb ? '48%' : '100%', backgroundColor: isSel ? color + '12' : theme.surface, borderColor: isSel ? color + '50' : theme.border }]} onPress={() => toggleEnv(env.id)}>
                                        <View style={[S.envIconBox, { backgroundColor: isSel ? color + '20' : theme.bg }]}>
                                            <MaterialCommunityIcons name={env.icon} size={18} color={isSel ? color : theme.textSecondary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '800', color: isSel ? color : theme.text }}>{env.label}</Text>
                                            <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>{env.desc}</Text>
                                        </View>
                                        <View style={[S.checkbox, { backgroundColor: isSel ? color : 'transparent', borderColor: isSel ? color : theme.border }]}>
                                            {isSel && <MaterialCommunityIcons name="check" size={11} color="#FFF" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                );

            case 'SUBS':
                return (
                    <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
                        <Text style={[S.label, { color: theme.textSecondary }]}>SUBSTITUTOS SELECIONADOS ({substituteDetails.length}/3)</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 15, lineHeight: 18 }}>
                            Estes exercícios aparecerão como a primeira opção de troca para o aluno.
                        </Text>

                        {/* 🔥 ÁREA DESTACADA PARA OS SELECIONADOS 🔥 */}
                        {substituteDetails.length > 0 && (
                            <View style={{ gap: 10, marginBottom: 25 }}>
                                {substituteDetails.map((sub, idx) => (
                                    <View key={sub.id} style={[S.subRow, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
                                        <View style={[S.subBadge, { backgroundColor: theme.accent }]}>
                                            <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 11 }}>{idx + 1}º</Text>
                                        </View>
                                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '800', color: theme.text }} numberOfLines={1}>{sub.name}</Text>
                                        <TouchableOpacity onPress={() => removeSubstitute(sub.id)} style={{ padding: 5 }}>
                                            <MaterialCommunityIcons name="close-circle" size={22} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {(formExercise.defaultSubstitutes || []).length < 3 && (
                            <View style={{ marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.accent} />
                                    <Text style={{ fontSize: 12, fontWeight: '900', color: theme.textSecondary, letterSpacing: 0.5 }}>
                                        SUGESTÕES EM "{formExercise.category.toUpperCase()}"
                                    </Text>
                                </View>

                                {loadingExercises ? (
                                    <ActivityIndicator size="small" color={theme.accent} style={{ marginVertical: 20 }} />
                                ) : suggestedSubstitutes.length > 0 ? (
                                    <View style={[S.subResultsBox, { backgroundColor: theme.surface, borderColor: theme.border, maxHeight: 300 }]}>
                                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                            {suggestedSubstitutes.map(ex => (
                                                <TouchableOpacity key={ex.id} style={[S.subResultRow, { borderBottomColor: theme.border }]} onPress={() => addSubstitute(ex)}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{ex.name}</Text>
                                                        <Text style={{ fontSize: 11, color: ex.subCategory === formExercise.subCategory ? theme.accent : theme.textSecondary, fontWeight: ex.subCategory === formExercise.subCategory ? 'bold' : 'normal', marginTop: 2 }}>
                                                            {ex.category} · {ex.subCategory} {ex.subCategory === formExercise.subCategory ? '(Recomendado)' : ''}
                                                        </Text>
                                                    </View>
                                                    <MaterialCommunityIcons name="plus-circle" size={24} color={theme.accent} />
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                ) : (
                                    <View style={{ padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: 'center' }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>Nenhum exercício encontrado nesta categoria para substituir.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                );
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: isWeb ? 'rgba(0,0,0,0.85)' : theme.bg, justifyContent: 'center' }}>
                <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: isWeb ? 960 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border, borderRadius: 24, marginVertical: '2.5%', maxHeight: '90vh', overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 } : {}) }}>

                    <View style={[S.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 11, fontWeight: '900', color: theme.textSecondary, letterSpacing: 1 }}>
                                {formExercise.id ? 'EDITAR EXERCÍCIO' : 'NOVO EXERCÍCIO'}
                            </Text>
                            <Text style={[S.title, { color: theme.text }]} numberOfLines={1}>
                                {formExercise.name ? formExercise.name.toUpperCase() : 'NOME NÃO DEFINIDO'}
                            </Text>
                            {formExercise.category && (
                                <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '700', marginTop: 2 }}>
                                    {formExercise.category} · {formExercise.subCategory}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose} style={[S.closeBtn, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                            <MaterialCommunityIcons name="close" size={22} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[S.tabBar, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
                        {[
                            { id: 'GERAL', label: 'DADOS GERAIS', icon: 'information-outline' },
                            { id: 'ENVS', label: 'AMBIENTES', icon: 'map-marker-outline' },
                            { id: 'SUBS', label: 'SUBSTITUTOS', icon: 'swap-horizontal' }
                        ].map(t => (
                            <TouchableOpacity key={t.id} 
                                style={[S.tabItem, activeTab === t.id && { borderBottomColor: theme.accent, borderBottomWidth: 3 }]} 
                                onPress={() => setActiveTab(t.id)}>
                                <MaterialCommunityIcons name={t.icon} size={18} color={activeTab === t.id ? theme.accent : theme.textSecondary} style={{ marginRight: 6 }} />
                                <Text style={[S.tabText, { color: activeTab === t.id ? theme.text : theme.textSecondary }]}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ flex: 1, backgroundColor: theme.bg }}>
                        {renderTabContent()}
                    </View>

                    <View style={[S.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
                        <TouchableOpacity style={[S.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSaveOrUpdate} disabled={saving || uploadingVideo}>
                            {saving ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <Text style={[S.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR NA BIBLIOTECA</Text>}
                        </TouchableOpacity>
                    </View>

                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const S = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, alignItems: 'center', borderBottomWidth: 1 },
    title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
    closeBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 15 },
    tabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 15, borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    label: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
    input: { borderRadius: 16, padding: 18, fontSize: 15, fontWeight: '600', marginBottom: 20, borderWidth: 1, outlineStyle: 'none' },
    selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
    selectorText: { fontSize: 14, fontWeight: '800' },
    dropdown: { borderRadius: 16, borderWidth: 1, padding: 8, marginTop: -15, marginBottom: 20 },
    dropItem: { padding: 15, borderRadius: 12 },
    envRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
    envIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    subRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
    subBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    subResultsBox: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    subResultRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
    uploadBtn: { padding: 20, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', marginBottom: 8 },
    footer: { padding: 20, borderTopWidth: 1 },
    saveBtn: { padding: 20, borderRadius: 16, alignItems: 'center' },
    saveBtnText: { fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});