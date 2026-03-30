// src/screens/AdminAddContent.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
    Alert, ActivityIndicator, Switch, Platform, FlatList, StatusBar, Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🔥 OBRIGATÓRIO PARA LER O CRACHÁ

const getDirectImageUrl = (url) => {
    if (!url) return null;
    if (url.includes('drive.google.com')) {
        const match = url.match(/[-\w]{25,}/);
        if (match && match[0]) {
            return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w1000`;
        }
    }
    return url;
};

export default function AdminAddContent({ navigation }) {
    const { theme } = useTheme();

    const [viewMode, setViewMode] = useState('list'); 
    const [contents, setContents] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    const [editingId, setEditingId] = useState(null); 
    const [contentType, setContentType] = useState('video'); 
    
    const [audioChapters, setAudioChapters] = useState([{ title: '', url: '' }]);

    const [form, setForm] = useState({ 
        title: '', subtitle: '', category: 'GERAL', contentUrl: '', thumbUrl: '', duration: '', isVIP: false 
    });
    
    const [loadingAction, setLoadingAction] = useState(false);

    const [accessModalVisible, setAccessModalVisible] = useState(false);
    const [selectedContentForAccess, setSelectedContentForAccess] = useState(null);
    const [allStudents, setAllStudents] = useState([]);
    const [contentAccessList, setContentAccessList] = useState([]);
    const [loadingAccess, setLoadingAccess] = useState(false);

    useEffect(() => {
        if (viewMode === 'list') {
            fetchContents();
        }
    }, [viewMode]);

    // 🔥 A MÁGICA: Manda o crachá do Admin na busca
    const fetchContents = async () => {
        setLoadingData(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            let adminId = '';
            if (userJson) {
                const userObj = JSON.parse(userJson);
                adminId = userObj.id; // Pegou o crachá!
            }

            const res = await fetch(`https://fitos-final.onrender.com/api/contents?adminId=${adminId}&t=${Date.now()}`);
            const data = await res.json();
            if (Array.isArray(data)) setContents(data);
        } catch (e) {
            console.log("Erro ao buscar conteúdos", e);
        } finally {
            setLoadingData(false);
        }
    };

    const handleOpenAccessModal = async (content) => {
        setSelectedContentForAccess(content);
        setAccessModalVisible(true);
        setLoadingAccess(true);

        try {
            const userJson = await AsyncStorage.getItem('user');
            let adminId = '';
            if (userJson) {
                const userObj = JSON.parse(userJson);
                adminId = userObj.id; 
            }

            const resStudents = await fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${adminId}&t=${Date.now()}`);
            const dataStudents = await resStudents.json();
            if (dataStudents.users) setAllStudents(dataStudents.users);

            const resAccess = await fetch(`https://fitos-final.onrender.com/api/contents/${content.id}/access`);
            const dataAccess = await resAccess.json();
            if (Array.isArray(dataAccess)) setContentAccessList(dataAccess);
            
        } catch (e) {
            Alert.alert("Erro", "Não foi possível carregar a lista de alunos.");
        } finally {
            setLoadingAccess(false);
        }
    };

    const toggleStudentAccess = async (userId, currentValue) => {
        const newValue = !currentValue;
        
        if (newValue) {
            setContentAccessList(prev => [...prev, userId]);
        } else {
            setContentAccessList(prev => prev.filter(id => id !== userId));
        }

        try {
            await fetch(`https://fitos-final.onrender.com/api/contents/${selectedContentForAccess.id}/access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, hasAccess: newValue })
            });
        } catch (error) {
            if (currentValue) setContentAccessList(prev => [...prev, userId]);
            else setContentAccessList(prev => prev.filter(id => id !== userId));
            Alert.alert("Erro", "Falha de conexão com o servidor.");
        }
    };

    const handleAddNew = () => {
        setEditingId(null);
        setContentType('video');
        setAudioChapters([{ title: '', url: '' }]);
        setForm({ title: '', subtitle: '', category: 'GERAL', contentUrl: '', thumbUrl: '', duration: '', isVIP: false });
        setViewMode('form');
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setContentType(item.type || 'video');
        
        if (item.type === 'audio' && item.audioUrl) {
            try {
                const parsedChapters = JSON.parse(item.audioUrl);
                setAudioChapters(Array.isArray(parsedChapters) ? parsedChapters : [{ title: '', url: item.audioUrl }]);
            } catch (e) {
                setAudioChapters([{ title: '', url: item.audioUrl }]);
            }
        } else {
            setAudioChapters([{ title: '', url: '' }]);
        }

        setForm({
            title: item.title || '',
            subtitle: item.subtitle || '',
            category: item.category || 'GERAL',
            contentUrl: item.pdfUrl || item.videoUrl || '', 
            thumbUrl: item.thumbUrl || '',
            duration: item.duration || '',
            isVIP: item.isVIP || false
        });
        setViewMode('form');
    };

    const handleDelete = (id, title) => {
        const confirmDelete = async () => {
            try {
                const res = await fetch(`https://fitos-final.onrender.com/api/contents/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    if (isWeb) window.alert("Conteúdo excluído com sucesso.");
                    else Alert.alert("Excluído", "Conteúdo removido.");
                    fetchContents(); 
                }
            } catch (e) {
                if (isWeb) window.alert("Erro ao excluir.");
                else Alert.alert("Erro", "Falha ao excluir o conteúdo.");
            }
        };

        if (isWeb) {
            if (window.confirm(`Tem certeza que deseja apagar "${title}"? Isso removerá o conteúdo do aplicativo de todos os alunos.`)) confirmDelete();
        } else {
            Alert.alert("Excluir Conteúdo", `Tem certeza que deseja apagar "${title}"?`, [
                { text: "Cancelar", style: "cancel" },
                { text: "Sim, Excluir", style: 'destructive', onPress: confirmDelete }
            ]);
        }
    };

    const addChapter = () => {
        setAudioChapters([...audioChapters, { title: '', url: '' }]);
    };

    const removeChapter = (index) => {
        if (audioChapters.length > 1) {
            const newChapters = [...audioChapters];
            newChapters.splice(index, 1);
            setAudioChapters(newChapters);
        }
    };

    const updateChapter = (index, field, value) => {
        const newChapters = [...audioChapters];
        newChapters[index][field] = value;
        setAudioChapters(newChapters);
    };

    // 🔥 A MÁGICA: Manda o crachá do Admin na hora de SALVAR
    const handleSave = async () => {
        if (!form.title || !form.thumbUrl) {
            return Alert.alert("Erro", "Preencha Título e Capa.");
        }

        if (contentType !== 'audio' && !form.contentUrl) {
            return Alert.alert("Erro", "Preencha o Link do Conteúdo.");
        }

        if (contentType === 'audio') {
            const hasEmptyChapter = audioChapters.some(c => !c.url.trim());
            if (hasEmptyChapter) return Alert.alert("Erro", "Preencha o link de todos os capítulos de áudio.");
        }

        setLoadingAction(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            let adminId = '';
            if (userJson) {
                const userObj = JSON.parse(userJson);
                adminId = userObj.id; // Pegou o crachá!
            }

            const payload = {
                title: form.title, subtitle: form.subtitle, category: form.category,
                thumbUrl: form.thumbUrl, duration: form.duration, type: contentType, isVIP: form.isVIP,
                videoUrl: contentType === 'video' ? form.contentUrl : null,
                pdfUrl: contentType === 'ebook' ? form.contentUrl : null,
                audioUrl: contentType === 'audio' ? JSON.stringify(audioChapters) : null,
                adminId: adminId // 🔥 CARIMBA O DONO
            };

            const url = editingId 
                ? `https://fitos-final.onrender.com/api/contents/${editingId}` 
                : 'https://fitos-final.onrender.com/api/contents'; 

            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                Alert.alert("Sucesso", `Conteúdo ${editingId ? 'atualizado' : 'publicado'} com sucesso!`);
                setViewMode('list'); 
            } else {
                Alert.alert("Erro", "Falha ao processar os dados.");
            }
        } catch (error) {
            Alert.alert("Erro", "Verifique sua conexão de internet.");
        } finally {
            setLoadingAction(false);
        }
    };

    const getContentLabel = () => {
        if (contentType === 'ebook') return "LINK DO ARQUIVO PDF (Google Drive, Dropbox, etc)";
        if (contentType === 'audio') return "LINK DO ÁUDIO MP3";
        return "LINK DO VÍDEO (.mp4 ou .m3u8)";
    };

    const renderContentItem = ({ item }) => {
        const iconName = item.type === 'ebook' ? 'book-open-variant' : (item.type === 'audio' ? 'headphones' : 'video');
        
        return (
            <View style={[styles.listItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                
                <Image 
                    source={getDirectImageUrl(item.thumbUrl) || 'https://via.placeholder.com/100'}
                    style={[styles.listThumb, { borderColor: theme.border, borderWidth: 1 }]} 
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk" 
                />
                
                <View style={styles.listInfo}>
                    <Text style={[styles.listTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.listTagsRow}>
                        <View style={[styles.listTag, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name={iconName} size={10} color={theme.isDark ? '#000' : '#FFF'} /><Text style={[styles.listTagText, { color: theme.isDark ? '#000' : '#FFF' }]}>{item.type?.toUpperCase() || 'VIDEO'}</Text></View>
                        {item.isVIP && <View style={[styles.listTag, { backgroundColor: '#FFCC00' }]}><MaterialCommunityIcons name="lock" size={10} color="#000" /><Text style={[styles.listTagText, { color: '#000' }]}>VIP</Text></View>}
                    </View>
                </View>

                <View style={styles.listActions}>
                    {item.isVIP && (
                        <TouchableOpacity onPress={() => handleOpenAccessModal(item)} style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: '#FFCC00', borderWidth: 1 }]}>
                            <MaterialCommunityIcons name="key-variant" size={20} color="#FFCC00" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                        <MaterialCommunityIcons name="pencil" size={20} color="#32ADE6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                        <MaterialCommunityIcons name="trash-can" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderStudentAccessItem = ({ item }) => {
        const hasAccess = contentAccessList.includes(item.id);
        
        return (
            <View style={[styles.studentAccessRow, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.studentAvatar, { backgroundColor: theme.border }]}>
                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={[styles.studentName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={styles.studentEmail}>{item.email}</Text>
                    </View>
                </View>
                <Switch 
                    value={hasAccess} 
                    onValueChange={() => toggleStudentAccess(item.id, hasAccess)} 
                    trackColor={{ false: theme.border, true: theme.accent }}
                    thumbColor={Platform.OS === 'ios' ? '#FFF' : (hasAccess ? (theme.isDark ? '#000' : '#FFF') : '#f4f3f4')}
                />
            </View>
        );
    };

    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    const RootComponent = isWeb ? View : SafeAreaView;
    const rootStyle = isWeb
      ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
      : { flex: 1, backgroundColor: theme.bg };

    return (
        <RootComponent style={rootStyle}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            
            <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>GERENCIAR <Text style={{color: theme.accent}}>PA FLIX</Text></Text>
                    <View style={{width: 24}}/>
                </View>

                <View style={[styles.tabsRow, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity style={[styles.mainTab, { backgroundColor: theme.surface, borderColor: theme.border }, viewMode === 'list' && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={() => setViewMode('list')}>
                        <MaterialCommunityIcons name="format-list-bulleted" size={18} color={viewMode === 'list' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                        <Text style={[styles.mainTabText, { color: theme.textSecondary }, viewMode === 'list' && { color: theme.isDark ? '#000' : '#FFF' }]}>CONTEÚDOS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.mainTab, { backgroundColor: theme.surface, borderColor: theme.border }, viewMode === 'form' && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={handleAddNew}>
                        <MaterialCommunityIcons name="plus-circle" size={18} color={viewMode === 'form' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                        <Text style={[styles.mainTabText, { color: theme.textSecondary }, viewMode === 'form' && { color: theme.isDark ? '#000' : '#FFF' }]}>NOVO</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                    {viewMode === 'list' && (
                        <>
                            {loadingData ? (
                                <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 50 }} />
                            ) : (
                                <FlatList 
                                    data={contents}
                                    keyExtractor={item => item.id}
                                    contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
                                    showsVerticalScrollIndicator={false}
                                    renderItem={renderContentItem}
                                    ListEmptyComponent={
                                        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 50 }}>Nenhum conteúdo cadastrado.</Text>
                                    }
                                />
                            )}
                        </>
                    )}

                    {viewMode === 'form' && (
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

                                    <Text style={[styles.label, { color: theme.accent }]}>CATEGORIA</Text>
                                    <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={form.category} onChangeText={t=>setForm({...form, category:t.toUpperCase()})} placeholderTextColor={theme.textSecondary}/>

                                    <Text style={[styles.label, { color: theme.accent }]}>LINK DA CAPA (Imagem Thumbnail)</Text>
                                    <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={form.thumbUrl} onChangeText={t=>setForm({...form, thumbUrl:t})} placeholderTextColor={theme.textSecondary} autoCapitalize='none'/>

                                    {contentType !== 'audio' && (
                                        <>
                                            <Text style={[styles.label, { color: theme.accent }]}>
                                                {contentType === 'ebook' ? "LINK DO ARQUIVO PDF" : "LINK DO VÍDEO (.mp4)"}
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
                                                    <TextInput 
                                                        style={[styles.inputChapter, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginTop: 10 }]} 
                                                        value={chapter.url} 
                                                        onChangeText={(t) => updateChapter(index, 'url', t)} 
                                                        placeholder="Link do Áudio do Google Drive" placeholderTextColor={theme.textSecondary} autoCapitalize='none'
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

                                    <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={handleSave} disabled={loadingAction}>
                                        {loadingAction ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'}/> : <Text style={[styles.btnText, { color: theme.isDark ? '#000' : '#FFF' }]}>{editingId ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR CONTEÚDO'}</Text>}
                                    </TouchableOpacity>
                                    <View style={{height: 60}}/>
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>

            <Modal visible={accessModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <View>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>LIBERAR ACESSO VIP</Text>
                                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>{selectedContentForAccess?.title}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setAccessModalVisible(false)} style={{ padding: 5 }}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.text}/>
                            </TouchableOpacity>
                        </View>
                        
                        {loadingAccess ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={theme.accent} />
                            </View>
                        ) : (
                            <FlatList 
                                data={allStudents}
                                keyExtractor={item => item.id}
                                renderItem={renderStudentAccessItem}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                ListEmptyComponent={
                                    <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>Nenhum aluno encontrado no sistema.</Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    header: { paddingTop: Platform.OS === 'android' ? 10 : 0, paddingHorizontal: 20, paddingBottom: 20, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    title: { fontSize: 20, fontWeight: '900' },
    
    tabsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, gap: 10, borderBottomWidth: 1 },
    mainTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8, borderWidth: 1 },
    mainTabText: { fontWeight: '900', fontSize: 12 },

    listItemCard: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, alignItems: 'center' },
    listThumb: { width: 50, height: 70, borderRadius: 8 },
    listInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    listTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
    listTagsRow: { flexDirection: 'row', gap: 6 },
    listTag: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, alignItems: 'center', gap: 4 },
    listTagText: { fontSize: 9, fontWeight: '900' },
    listActions: { flexDirection: 'row', gap: 10, marginLeft: 10 },
    actionBtn: { padding: 8, borderRadius: 8 },

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

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', borderWidth: 1, width: '100%', maxWidth: 480, alignSelf: 'center', flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    studentAccessRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    studentAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    studentName: { fontWeight: 'bold', fontSize: 14 },
    studentEmail: { color: '#888', fontSize: 12 }
});