// src/components/MontarTreino/VideoUploadForm.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
    ActivityIndicator, Switch, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔥 LISTA DE CATEGORIAS PADRÃO 🔥
const DEFAULT_CATEGORIES = [
    "Biomecânica e Execução",
    "Treinos na Prática",
    "Mentalidade",
    "E-books de Treino",
    "E-books de Dieta",
    "Receitas Fit",
    "Audiobooks"
];

export default function VideoUploadForm({
    theme, contentType, setContentType, form, setForm, 
    handleUploadThumb, uploadingThumb, handleUploadMedia, uploadingMedia,
    uploadingIndex, audioChapters, addChapter, removeChapter, updateChapter,
    handleSave, loadingAction, editingId
}) {
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (categories.length > 0 && (!form.category || form.category === 'GERAL')) {
            setForm(prev => ({ ...prev, category: categories[0] }));
        }
    }, [categories]);

    const loadCategories = async () => {
        try {
            const saved = await AsyncStorage.getItem('custom_categories_pa_flix');
            if (saved) {
                setCategories(JSON.parse(saved));
            }
        } catch (e) {}
    };

    const saveCategories = async (newCats) => {
        setCategories(newCats);
        try {
            await AsyncStorage.setItem('custom_categories_pa_flix', JSON.stringify(newCats));
        } catch (e) {}
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const updated = [...categories, newCategoryName.trim()];
        saveCategories(updated);
        setForm({ ...form, category: newCategoryName.trim() });
        setNewCategoryName('');
        setIsAddingCategory(false);
    };

    const handleRemoveCategory = () => {
        if (categories.length <= 1) {
            if (Platform.OS === 'web') window.alert("Você precisa de pelo menos uma categoria.");
            else Alert.alert("Aviso", "Você precisa de pelo menos uma categoria.");
            return;
        }

        const confirmRemove = () => {
            const updated = categories.filter(c => c !== form.category);
            saveCategories(updated);
            setForm({ ...form, category: updated[0] });
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Deseja remover a categoria "${form.category}"?`)) confirmRemove();
        } else {
            Alert.alert("Excluir", `Deseja remover a categoria "${form.category}"?`, [
                { text: "Cancelar", style: "cancel" },
                { text: "Sim", style: "destructive", onPress: confirmRemove }
            ]);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={[styles.typeSelector, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity style={[styles.typeTab, contentType === 'video' && { backgroundColor: theme.accent }]} onPress={() => setContentType('video')}>
                    <MaterialCommunityIcons name="video" size={16} color={contentType === 'video' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                    <Text style={[styles.typeText, { color: theme.textSecondary }, contentType === 'video' && { color: theme.isDark ? '#000' : '#FFF' }]}>VÍDEO</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeTab, contentType === 'ebook' && { backgroundColor: theme.accent }]} onPress={() => setContentType('ebook')}>
                    <MaterialCommunityIcons name="book-open-variant" size={16} color={contentType === 'ebook' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                    <Text style={[styles.typeText, { color: theme.textSecondary }, contentType === 'ebook' && { color: theme.isDark ? '#000' : '#FFF' }]}>E-BOOK</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeTab, contentType === 'audio' && { backgroundColor: theme.accent }]} onPress={() => setContentType('audio')}>
                    <MaterialCommunityIcons name="headphones" size={16} color={contentType === 'audio' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                    <Text style={[styles.typeText, { color: theme.textSecondary }, contentType === 'audio' && { color: theme.isDark ? '#000' : '#FFF' }]}>ÁUDIO</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 150, paddingHorizontal: 20 }} 
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.formContainer}>
                    <Text style={[styles.label, { color: theme.accent }]}>TÍTULO DO {contentType.toUpperCase()}</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={form.title} onChangeText={t=>setForm({...form, title:t})} placeholderTextColor={theme.textSecondary}/>

                    <Text style={[styles.label, { color: theme.accent }]}>SUBTÍTULO</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={form.subtitle} onChangeText={t=>setForm({...form, subtitle:t})} placeholderTextColor={theme.textSecondary}/>

                    {/* 🔥 CONTROLE DE CATEGORIAS DINÂMICO 🔥 */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 15, marginBottom: 5 }}>
                        <Text style={[styles.label, { color: theme.accent, marginTop: 0, marginBottom: 0 }]}>CATEGORIA</Text>
                    </View>

                    {isAddingCategory ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <TextInput 
                                style={[styles.input, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginRight: 10 }]} 
                                value={newCategoryName} 
                                onChangeText={setNewCategoryName} 
                                placeholder="Nome da nova categoria..." 
                                placeholderTextColor={theme.textSecondary}
                            />
                            <TouchableOpacity onPress={handleAddCategory} style={{ backgroundColor: theme.accent, padding: 12, borderRadius: 8, marginRight: 5 }}>
                                <MaterialCommunityIcons name="check" size={24} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsAddingCategory(false)} style={{ backgroundColor: theme.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <View style={[styles.pickerContainer, { backgroundColor: theme.surface, borderColor: theme.border, flex: 1, marginBottom: 0 }]}>
                                {Platform.OS === 'web' ? (
                                    <select 
                                        value={form.category} 
                                        onChange={(e) => setForm({...form, category: e.target.value})} 
                                        style={{ width: '100%', padding: 15, backgroundColor: 'transparent', color: theme.text, border: 'none', outline: 'none', fontSize: 14, fontWeight: 'bold' }}
                                    >
                                        {categories.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
                                    </select>
                                ) : (
                                    <Picker 
                                        selectedValue={form.category} 
                                        onValueChange={(val) => setForm({...form, category: val})} 
                                        style={{ color: theme.text }} 
                                        dropdownIconColor={theme.accent}
                                    >
                                        {categories.map(c => <Picker.Item key={c} label={c} value={c} />)}
                                    </Picker>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setIsAddingCategory(true)} style={{ backgroundColor: theme.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.border, marginLeft: 10 }}>
                                <MaterialCommunityIcons name="plus" size={24} color={theme.accent} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRemoveCategory} style={{ backgroundColor: theme.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.border, marginLeft: 10 }}>
                                <MaterialCommunityIcons name="trash-can" size={24} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={[styles.label, { color: theme.accent }]}>CAPA DO CONTEÚDO (Thumbnail)</Text>
                    <TouchableOpacity 
                        style={[styles.uploadBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15', padding: 12 }]} 
                        onPress={handleUploadThumb}
                        disabled={uploadingThumb}
                    >
                        {uploadingThumb ? (
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <ActivityIndicator color={theme.accent} size="small" />
                                <Text style={{color: theme.accent, marginLeft: 10, fontWeight: '800'}}>ENVIANDO IMAGEM...</Text>
                            </View>
                        ) : (
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <MaterialCommunityIcons name="image-plus" size={24} color={theme.accent} />
                                <Text style={{color: theme.accent, marginLeft: 10, fontWeight: '800'}}>FAZER UPLOAD DA CAPA (JPG/PNG)</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, marginTop: 10 }]} value={form.thumbUrl} onChangeText={t=>setForm({...form, thumbUrl:t})} placeholder="Ou cole o link da imagem..." placeholderTextColor={theme.textSecondary} autoCapitalize='none'/>

                    {contentType !== 'audio' && (
                        <>
                            {contentType === 'video' && (
                                <>
                                    <Text style={[styles.label, { color: theme.accent, marginTop: 15 }]}>VÍDEO DA AULA</Text>
                                    <TouchableOpacity 
                                        style={[styles.uploadBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} 
                                        onPress={() => handleUploadMedia(null)}
                                        disabled={uploadingMedia}
                                    >
                                        {uploadingMedia ? (
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
                                </>
                            )}

                            <Text style={[styles.label, { color: theme.accent }]}>
                                {contentType === 'ebook' ? "LINK DO ARQUIVO PDF" : "OU COLE O LINK DO YOUTUBE/VÍDEO (.mp4)"}
                            </Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={form.contentUrl} onChangeText={t=>setForm({...form, contentUrl:t})} placeholderTextColor={theme.textSecondary} autoCapitalize='none'/>
                            
                            {contentType === 'video' && (
                                <>
                                    <Text style={[styles.label, { color: theme.accent }]}>DURAÇÃO (Ex: 12 min)</Text>
                                    <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={form.duration} onChangeText={t=>setForm({...form, duration:t})} placeholderTextColor={theme.textSecondary}/>
                                </>
                            )}
                        </>
                    )}

                    {contentType === 'audio' && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={[styles.label, { color: theme.accent, fontSize: 14 }]}>CAPÍTULOS DO AUDIOBOOK</Text>
                            
                            {audioChapters.map((chapter, index) => (
                                <View key={index} style={[styles.chapterBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <View style={styles.chapterHeader}>
                                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>Faixa {index + 1}</Text>
                                        {audioChapters.length > 1 && (
                                            <TouchableOpacity onPress={() => removeChapter(index)}>
                                                <MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    
                                    <TextInput 
                                        style={[styles.inputChapter, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                                        value={chapter.title} 
                                        onChangeText={(t) => updateChapter(index, 'title', t)} 
                                        placeholder="Ex: 01 - Introdução" placeholderTextColor={theme.textSecondary}
                                    />

                                    <TouchableOpacity 
                                        style={[styles.uploadBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15', marginTop: 15, padding: 12 }]} 
                                        onPress={() => handleUploadMedia(index)}
                                        disabled={uploadingMedia}
                                    >
                                        {uploadingMedia && uploadingIndex === index ? (
                                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                <ActivityIndicator color={theme.accent} size="small" />
                                                <Text style={{color: theme.accent, marginLeft: 10, fontWeight: '800'}}>ENVIANDO ÁUDIO...</Text>
                                            </View>
                                        ) : (
                                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                <MaterialCommunityIcons name="cloud-upload" size={20} color={theme.accent} />
                                                <Text style={{color: theme.accent, marginLeft: 10, fontWeight: '800'}}>UPLOAD DE ÁUDIO (.MP3)</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <TextInput 
                                        style={[styles.inputChapter, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginTop: 10 }]} 
                                        value={chapter.url} 
                                        onChangeText={(t) => updateChapter(index, 'url', t)} 
                                        placeholder="Ou cole o link do áudio..." placeholderTextColor={theme.textSecondary} autoCapitalize='none'
                                    />
                                </View>
                            ))}

                            <TouchableOpacity onPress={addChapter} style={[styles.addChapterBtn, { borderColor: theme.accent }]}>
                                <MaterialCommunityIcons name="plus" size={20} color={theme.accent} />
                                <Text style={{ color: theme.accent, fontWeight: 'bold', marginLeft: 5 }}>ADICIONAR CAPÍTULO</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[styles.vipContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={{flex:1, marginRight:10}}>
                            <Text style={[styles.label, { marginTop: 0, fontSize: 12, color: form.isVIP ? theme.accent : theme.textSecondary }]}>ACESSO VIP? 🔒</Text>
                            <Text style={[styles.vipDesc, { color: theme.textSecondary }]}>Se ativado, apenas alunos com permissão VIP verão este conteúdo.</Text>
                        </View>
                        <Switch
                            trackColor={{ false: theme.border, true: theme.accent }}
                            thumbColor={Platform.OS === 'ios' ? '#FFF' : (form.isVIP ? (theme.isDark ? '#000' : '#FFF') : '#f4f3f4')}
                            onValueChange={(val) => setForm({...form, isVIP: val})}
                            value={form.isVIP}
                        />
                    </View>

                    <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={handleSave} disabled={loadingAction || uploadingMedia || uploadingThumb}>
                        {loadingAction ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'}/> : <Text style={[styles.btnText, { color: theme.isDark ? '#000' : '#FFF' }]}>{editingId ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR CONTEÚDO'}</Text>}
                    </TouchableOpacity>
                    <View style={{height: 60}}/>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    typeSelector: { flexDirection: 'row', padding: 10, borderBottomWidth: 1 },
    typeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 6 },
    typeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    formContainer: { width: '100%', paddingTop: 5 },
    label: { fontSize: 10, fontWeight: 'bold', marginTop: 15, marginBottom: 5, letterSpacing: 1, textTransform: 'uppercase' },
    input: { padding: 15, borderRadius: 8, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    chapterBox: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
    chapterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    inputChapter: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    addChapterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginBottom: 10 },
    vipContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginTop: 20, borderWidth: 1 },
    vipDesc: { fontSize: 10, marginTop: 2 },
    btn: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 35, elevation: 3 },
    btnText: { fontWeight: '900', fontSize: 15, letterSpacing: 1 },
    uploadBtn: { padding: 18, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    pickerContainer: { borderRadius: 8, borderWidth: 1, overflow: 'hidden', marginBottom: 10 }
});