// src/screens/AdminAddContent.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, FlatList, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker'; 

// 🔥 COMPONENTES MODULARIZADOS 🔥
import VideoCommentsModal from '../components/MontarTreino/Modals/VideoCommentsModal';
import VideoAccessModal from '../components/MontarTreino/Modals/VideoAccessModal';
import VideoUploadForm from '../components/MontarTreino/VideoUploadForm';
import VideoListCard from '../components/MontarTreino/VideoListCard';

const sendPushNotification = async (title, body, adminId) => {
    try {
        const res = await fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${adminId}&t=${Date.now()}`);
        const data = await res.json();
        const tokens = (data.activeUsers || []).map(u => u.pushToken).filter(t => typeof t === 'string' && t.startsWith('ExponentPushToken'));

        if (tokens.length === 0) return;

        const messages = tokens.map(token => ({
            to: token, sound: 'default', title: title, body: body, data: { screen: 'Biblioteca' }, 
        }));

        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
        });
    } catch (error) { console.error('Erro Push Notification:', error); }
};

export default function AdminAddContent({ navigation }) {
    const { theme } = useTheme();

    const [viewMode, setViewMode] = useState('list'); 
    const [contents, setContents] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Estados do Formulário
    const [editingId, setEditingId] = useState(null); 
    const [contentType, setContentType] = useState('video'); 
    const [audioChapters, setAudioChapters] = useState([{ title: '', url: '' }]);
    const [form, setForm] = useState({ title: '', subtitle: '', category: 'GERAL', contentUrl: '', thumbUrl: '', duration: '', isVIP: false, valor: '' });
    const [loadingAction, setLoadingAction] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false); 
    const [uploadingIndex, setUploadingIndex] = useState(null);
    const [uploadingThumb, setUploadingThumb] = useState(false); 

    // Estados do Modal de Acesso VIP
    const [accessModalVisible, setAccessModalVisible] = useState(false);
    const [selectedContentForAccess, setSelectedContentForAccess] = useState(null);
    const [allStudents, setAllStudents] = useState([]);
    const [contentAccessList, setContentAccessList] = useState([]);
    const [loadingAccess, setLoadingAccess] = useState(false);

    // Estados do Modal de Comentários
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [activeComments, setActiveComments] = useState([]);
    const [adminNewComment, setAdminNewComment] = useState('');
    const [activeVideoId, setActiveVideoId] = useState(null);
    const [activeVideoTitle, setActiveVideoTitle] = useState('');
    const [sendingAdminComment, setSendingAdminComment] = useState(false);
    const [loadingAdminComments, setLoadingAdminComments] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyingName, setReplyingName] = useState('');

    useEffect(() => {
        if (viewMode === 'list') fetchContents();
    }, [viewMode]);

    const fetchContents = async () => {
        setLoadingData(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            const adminId = userJson ? JSON.parse(userJson).id : '';
            const res = await fetch(`https://fitos-final.onrender.com/api/contents?adminId=${adminId}&t=${Date.now()}`);
            const data = await res.json();
            if (Array.isArray(data)) setContents(data);
        } catch (e) { console.log(e); } finally { setLoadingData(false); }
    };

    // FUNÇÕES DO ACESSO VIP
    const handleOpenAccessModal = async (content) => {
        setSelectedContentForAccess(content);
        setAccessModalVisible(true);
        setLoadingAccess(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            const adminId = userJson ? JSON.parse(userJson).id : '';
            const resStudents = await fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${adminId}&t=${Date.now()}`);
            const dataStudents = await resStudents.json();
            if (dataStudents.users) setAllStudents(dataStudents.users);

            const resAccess = await fetch(`https://fitos-final.onrender.com/api/contents/${content.id}/access`);
            const dataAccess = await resAccess.json();
            if (Array.isArray(dataAccess)) setContentAccessList(dataAccess);
        } catch (e) { Alert.alert("Erro", "Falha ao carregar alunos."); } finally { setLoadingAccess(false); }
    };

    const toggleStudentAccess = async (userId, currentValue) => {
        const newValue = !currentValue;
        if (newValue) setContentAccessList(prev => [...prev, userId]);
        else setContentAccessList(prev => prev.filter(id => id !== userId));

        try {
            await fetch(`https://fitos-final.onrender.com/api/contents/${selectedContentForAccess.id}/access`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, hasAccess: newValue })
            });
        } catch (error) {
            if (currentValue) setContentAccessList(prev => [...prev, userId]);
            else setContentAccessList(prev => prev.filter(id => id !== userId));
        }
    };

    // FUNÇÕES DE COMENTÁRIOS
    const openAdminComments = async (item) => {
        setActiveVideoId(item.id);
        setActiveVideoTitle(item.title);
        setCommentsModalVisible(true);
        fetchAdminComments(item.id);
    };

    const fetchAdminComments = async (id) => {
        setLoadingAdminComments(true);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/contents/${id}/comments`);
            if (res.ok) setActiveComments(await res.json());
        } catch (e) {} finally { setLoadingAdminComments(false); }
    };

    const handleSendAdminComment = async () => {
        if (!adminNewComment.trim() || !activeVideoId) return;
        setSendingAdminComment(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            const adminId = userJson ? JSON.parse(userJson).id : '';

            const payload = { userId: adminId, contentId: activeVideoId, text: adminNewComment };
            if (replyingTo) payload.parentId = replyingTo;

            const res = await fetch('https://fitos-final.onrender.com/api/contents/comments', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });

            if (res.ok) {
                setAdminNewComment('');
                setReplyingTo(null);
                setReplyingName('');
                fetchAdminComments(activeVideoId);
            }
        } catch (e) {} finally { setSendingAdminComment(false); }
    };

    const handleDeleteAdminComment = async (commentId) => {
        const confirmDelete = async () => {
            try {
                const res = await fetch(`https://fitos-final.onrender.com/api/contents/comments/${commentId}`, { method: 'DELETE' });
                if (res.ok) fetchAdminComments(activeVideoId);
            } catch (error) {}
        };
        if (Platform.OS === 'web') { if (window.confirm("Apagar comentário?")) confirmDelete(); } 
        else Alert.alert("Excluir", "Apagar comentário?", [{ text: "Cancelar", style: "cancel" }, { text: "Sim", style: "destructive", onPress: confirmDelete }]);
    };

    const startReply = (commentId, userName) => { setReplyingTo(commentId); setReplyingName(userName); };
    const cancelReply = () => { setReplyingTo(null); setReplyingName(''); setAdminNewComment(''); };

    // FUNÇÕES DO FORMULÁRIO (CRUD)
    const handleAddNew = () => {
        setEditingId(null); setContentType('video'); setAudioChapters([{ title: '', url: '' }]);
        setForm({ title: '', subtitle: '', category: 'GERAL', contentUrl: '', thumbUrl: '', duration: '', isVIP: false, valor: '' });
        setViewMode('form');
    };

    const handleEdit = (item) => {
        setEditingId(item.id); setContentType(item.type || 'video');
        if (item.type === 'audio' && item.audioUrl) {
            try { setAudioChapters(JSON.parse(item.audioUrl)); } catch (e) { setAudioChapters([{ title: '', url: item.audioUrl }]); }
        } else setAudioChapters([{ title: '', url: '' }]);
        setForm({ title: item.title || '', subtitle: item.subtitle || '', category: item.category || 'GERAL', contentUrl: item.pdfUrl || item.videoUrl || '', thumbUrl: item.thumbUrl || '', duration: item.duration || '', isVIP: item.isVIP || false, valor: item.valor != null ? String(item.valor) : '' });
        setViewMode('form');
    };

    const handleDelete = (id, title) => {
        const confirmDelete = async () => {
            try {
                const res = await fetch(`https://fitos-final.onrender.com/api/contents/${id}`, { method: 'DELETE' });
                if (res.ok) { if (isWeb) window.alert("Excluído."); else Alert.alert("Excluído."); fetchContents(); }
            } catch (e) {}
        };
        if (isWeb) { if (window.confirm(`Apagar "${title}"?`)) confirmDelete(); } 
        else Alert.alert("Excluir Conteúdo", `Apagar "${title}"?`, [{ text: "Cancelar", style: "cancel" }, { text: "Sim", style: 'destructive', onPress: confirmDelete }]);
    };

    const addChapter = () => setAudioChapters([...audioChapters, { title: '', url: '' }]);
    const removeChapter = (index) => {
        if (audioChapters.length > 1) { const newChapters = [...audioChapters]; newChapters.splice(index, 1); setAudioChapters(newChapters); }
    };
    const updateChapter = (index, field, value) => {
        const newChapters = [...audioChapters]; newChapters[index][field] = value; setAudioChapters(newChapters);
    };

    const handleUploadThumb = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
            if (result.canceled) return;
            const fileToUpload = result.assets[0];
            if (!fileToUpload.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/i)) return Alert.alert("Inválido", "Use JPG, PNG ou WEBP.");
            
            setUploadingThumb(true);
            const formData = new FormData();
            if (Platform.OS === 'web') {
                const res = await fetch(fileToUpload.uri);
                const blob = await res.blob();
                formData.append('file', blob, fileToUpload.name);
            } else formData.append('file', { uri: fileToUpload.uri, name: fileToUpload.name || 'capa.jpg', type: fileToUpload.mimeType || 'image/jpeg' });

            const response = await fetch('https://fitos-final.onrender.com/api/upload-image', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' }});
            const data = await response.json();
            if (response.ok && data.imageUrl) setForm({ ...form, thumbUrl: data.imageUrl });
            else throw new Error(data.error);
        } catch (error) {} finally { setUploadingThumb(false); }
    };

    const handleUploadMedia = async (chapterIndex = null) => {
        try {
            const isAudioUpload = contentType === 'audio' && chapterIndex !== null;
            const result = await DocumentPicker.getDocumentAsync({ type: isAudioUpload ? 'audio/*' : 'video/*', copyToCacheDirectory: true });
            if (result.canceled) return;
            const fileToUpload = result.assets[0];
            const fileName = fileToUpload.name.toLowerCase();
            let isValidFormat = isAudioUpload ? fileName.match(/\.(mp3|wav|m4a|aac)$/i) : fileName.match(/\.(mp4|mov|avi)$/i);
            if (!isValidFormat) return Alert.alert("Inválido", isAudioUpload ? "Envie áudios." : "Envie vídeos.");
  
            setUploadingMedia(true); setUploadingIndex(chapterIndex);
            const formData = new FormData();
            if (Platform.OS === 'web') {
                const res = await fetch(fileToUpload.uri);
                const blob = await res.blob();
                formData.append('file', blob, fileToUpload.name);
            } else formData.append('file', { uri: fileToUpload.uri, name: fileToUpload.name || (isAudioUpload ? 'audio.mp3' : 'video.mp4'), type: fileToUpload.mimeType || (isAudioUpload ? 'audio/mpeg' : 'video/mp4') });
            
            let mediaTitle = form.title || 'Nova Aula';
            if (isAudioUpload && audioChapters[chapterIndex].title) mediaTitle = audioChapters[chapterIndex].title;
            formData.append('title', mediaTitle);
  
            const response = await fetch('https://fitos-final.onrender.com/api/upload', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' }});
            const data = await response.json();
            
            if (response.ok && data.videoUrl) {
                if (isAudioUpload) {
                    const newChapters = [...audioChapters]; newChapters[chapterIndex].url = data.videoUrl; setAudioChapters(newChapters);
                } else setForm({ ...form, contentUrl: data.videoUrl }); 
                if(isWeb) window.alert("Sucesso!"); else Alert.alert("Sucesso", "Enviado.");
            } else throw new Error(data.error);
        } catch (error) {} finally { setUploadingMedia(false); setUploadingIndex(null); }
    };

    const handleSave = async () => {
        if (!form.title || !form.thumbUrl) return Alert.alert("Erro", "Preencha Título e Capa.");
        if (contentType !== 'audio' && !form.contentUrl) return Alert.alert("Erro", "Preencha Link.");
        if (contentType === 'audio' && audioChapters.some(c => !c.url.trim())) return Alert.alert("Erro", "Preencha capítulos.");

        setLoadingAction(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            const adminId = userJson ? JSON.parse(userJson).id : '';

            const payload = {
                title: form.title, subtitle: form.subtitle, category: form.category, thumbUrl: form.thumbUrl, duration: form.duration, type: contentType, isVIP: form.isVIP,
                valor: form.valor ? parseFloat(String(form.valor).replace(',', '.')) : null,
                videoUrl: contentType === 'video' ? form.contentUrl : null,
                pdfUrl: contentType === 'ebook' ? form.contentUrl : null,
                audioUrl: contentType === 'audio' ? JSON.stringify(audioChapters) : null,
                adminId: adminId
            };

            const url = editingId ? `https://fitos-final.onrender.com/api/contents/${editingId}` : 'https://fitos-final.onrender.com/api/contents'; 
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, { method: method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });

            if (res.ok) {
                Alert.alert("Sucesso", "Salvo."); setViewMode('list'); 
                if (!editingId && !form.isVIP) await sendPushNotification("Novo Conteúdo!", form.title, adminId);
            } else Alert.alert("Erro", "Falha ao salvar.");
        } catch (error) {} finally { setLoadingAction(false); }
    };

    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const RootComponent = isWeb ? View : SafeAreaView;

    return (
        <RootComponent style={isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg }}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}><MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/></TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>GERENCIAR <Text style={{color: theme.accent}}>PA FLIX</Text></Text><View style={{width: 24}}/>
                </View>

                <View style={[styles.tabsRow, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity style={[styles.mainTab, { backgroundColor: theme.surface, borderColor: theme.border }, viewMode === 'list' && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={() => setViewMode('list')}><MaterialCommunityIcons name="format-list-bulleted" size={18} color={viewMode === 'list' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} /><Text style={[styles.mainTabText, { color: theme.textSecondary }, viewMode === 'list' && { color: theme.isDark ? '#000' : '#FFF' }]}>CONTEÚDOS</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.mainTab, { backgroundColor: theme.surface, borderColor: theme.border }, viewMode === 'form' && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={handleAddNew}><MaterialCommunityIcons name="plus-circle" size={18} color={viewMode === 'form' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} /><Text style={[styles.mainTabText, { color: theme.textSecondary }, viewMode === 'form' && { color: theme.isDark ? '#000' : '#FFF' }]}>NOVO</Text></TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                    {viewMode === 'list' && (
                        loadingData ? <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 50 }} /> : (
                            <FlatList 
                                data={contents} 
                                keyExtractor={item => item.id} 
                                contentContainerStyle={{ padding: 20, paddingBottom: 150 }} 
                                showsVerticalScrollIndicator={false} 
                                renderItem={({ item }) => <VideoListCard item={item} theme={theme} openAdminComments={openAdminComments} handleOpenAccessModal={handleOpenAccessModal} handleEdit={handleEdit} handleDelete={handleDelete} />} 
                                ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 50 }}>Nenhum conteúdo.</Text>} 
                            />
                        )
                    )}

                    {viewMode === 'form' && (
                        <VideoUploadForm 
                            theme={theme} contentType={contentType} setContentType={setContentType} form={form} setForm={setForm}
                            handleUploadThumb={handleUploadThumb} uploadingThumb={uploadingThumb} handleUploadMedia={handleUploadMedia}
                            uploadingMedia={uploadingMedia} uploadingIndex={uploadingIndex} audioChapters={audioChapters}
                            addChapter={addChapter} removeChapter={removeChapter} updateChapter={updateChapter} handleSave={handleSave}
                            loadingAction={loadingAction} editingId={editingId}
                        />
                    )}
                </View>
            </View>

            <VideoAccessModal visible={accessModalVisible} onClose={() => setAccessModalVisible(false)} theme={theme} selectedContent={selectedContentForAccess} loadingAccess={loadingAccess} allStudents={allStudents} contentAccessList={contentAccessList} toggleStudentAccess={toggleStudentAccess} />
            
            <VideoCommentsModal visible={commentsModalVisible} onClose={() => setCommentsModalVisible(false)} theme={theme} activeVideoTitle={activeVideoTitle} loadingAdminComments={loadingAdminComments} activeComments={activeComments} handleDeleteAdminComment={handleDeleteAdminComment} adminNewComment={adminNewComment} setAdminNewComment={setAdminNewComment} handleSendAdminComment={handleSendAdminComment} sendingAdminComment={sendingAdminComment} replyingTo={replyingTo} replyingName={replyingName} cancelReply={cancelReply} startReply={startReply} />

        </RootComponent>
    );
}

const styles = StyleSheet.create({
    header: { paddingTop: Platform.OS === 'android' ? 10 : 0, paddingHorizontal: 20, paddingBottom: 20, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    title: { fontSize: 20, fontWeight: '900' },
    tabsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, gap: 10, borderBottomWidth: 1 },
    mainTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8, borderWidth: 1 },
    mainTabText: { fontWeight: '900', fontSize: 12 }
});