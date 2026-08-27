// src/screens/VideoPlayerScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
    View, StyleSheet, SafeAreaView, TouchableOpacity, Text, 
    ActivityIndicator, Platform, StatusBar, TextInput, FlatList, KeyboardAvoidingView, Dimensions, Alert, Modal 
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as ScreenOrientation from 'expo-screen-orientation';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authHeaders } from '../utils/authToken';

export default function VideoPlayerScreen({ route, navigation }) {
    const { url, title, contentId } = route.params;
    const { theme } = useTheme();
    const videoRef = useRef(null);
    
    const [isReady, setIsReady] = useState(false);
    const [videoLayout, setVideoLayout] = useState({ width: 16, height: 9 });

    // 🔥 ESTADOS DE INTERAÇÃO SOCIAL 🔥
    const [userData, setUserData] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [sendingComment, setSendingComment] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    
    // 🔥 NOVO MODAL PARA COMENTÁRIOS 🔥
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);

    const isWeb = Platform.OS === 'web';
    const RootComponent = isWeb ? View : SafeAreaView;
    const windowHeight = Dimensions.get('window').height;

    const safeUrl = url ? decodeURIComponent(url) : '';
    
    const isYouTube = safeUrl.includes('youtube.com') || safeUrl.includes('youtu.be');
    const isYouTubeShort = safeUrl.includes('/shorts/');
    
    const getYouTubeId = (str) => {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
        const match = str.match(regExp);
        return match ? match[1] : null;
    };

    const ytId = isYouTube ? getYouTubeId(safeUrl) : null;
    const ytEmbedUrl = ytId ? `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1&playsinline=1` : safeUrl;

    useEffect(() => {
        const loadSocialData = async () => {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserData(user);
                if (contentId) {
                    fetchComments();
                    fetchLikeStatus(user.id);
                }
            }
        };
        loadSocialData();

        return () => {
            if (!isWeb) ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

    const handleFullscreenUpdate = async ({ fullscreenUpdate }) => {
        if (isWeb) return;
        if (fullscreenUpdate === 1) await ScreenOrientation.unlockAsync();
        else if (fullscreenUpdate === 3) await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };

    const handleReadyForDisplay = (e) => {
        setIsReady(true);
        const { naturalSize } = e;
        if (naturalSize && (naturalSize.orientation === 'portrait' || naturalSize.width < naturalSize.height)) {
            setVideoLayout({ width: 9, height: 16 });
        } else {
            setVideoLayout({ width: 16, height: 9 });
        }
    };

    const triggerFullscreen = () => {
        if (isWeb) {
            const elem = document.getElementById('pa-web-video');
            if (elem) {
                if (elem.requestFullscreen) elem.requestFullscreen();
                else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
                else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
            }
        } else {
            if (videoRef.current) videoRef.current.presentFullscreenPlayer();
        }
    };

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/contents/${contentId}/comments`, {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) setComments(await res.json());
        } catch (e) {
            console.log("Erro comentários", e);
        } finally {
            setLoadingComments(false);
        }
    };

    const fetchLikeStatus = async (userId) => {
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/contents?userId=${userId}&format=grouped`, {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) {
                const data = await res.json();
                let curtiu = false;
                let count = 0;
                for (let group of data) {
                    const videoAchado = group.videos?.find(v => v.id === contentId);
                    if (videoAchado) {
                        curtiu = videoAchado.likedByMe;
                        count = videoAchado.likesCount || 0;
                        break;
                    }
                }
                setHasLiked(curtiu);
                setLikesCount(count);
            }
        } catch (e) {}
    };

    const handleLike = async () => {
        if (!contentId || !userData?.id) return;
        const prevLiked = hasLiked;
        setHasLiked(!prevLiked);
        setLikesCount(prev => prevLiked ? prev - 1 : prev + 1);
        try {
            await fetch('https://fitos-final.onrender.com/api/contents/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ userId: userData.id, contentId: contentId })
            });
        } catch (e) {
            setHasLiked(prevLiked);
            setLikesCount(prev => prevLiked ? prev + 1 : prev - 1);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim() || !contentId || !userData?.id) return;
        setSendingComment(true);
        try {
            const isEditing = !!editingCommentId;
            const url = isEditing 
                ? `https://fitos-final.onrender.com/api/contents/comments/${editingCommentId}` 
                : 'https://fitos-final.onrender.com/api/contents/comments';
            
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ userId: userData.id, contentId: contentId, text: newComment })
            });
            
            if (res.ok) {
                setNewComment('');
                setEditingCommentId(null);
                fetchComments(); 
            } else {
                const errData = await res.json();
                if (isWeb) window.alert("Erro: " + errData.error);
                else Alert.alert("Erro", errData.error);
            }
        } catch (e) {
            console.log("Erro ao comentar", e);
        } finally {
            setSendingComment(false);
        }
    };

    const handleEditClick = (comment) => {
        setNewComment(comment.text);
        setEditingCommentId(comment.id);
    };

    const handleDeleteComment = async (commentId) => {
        const confirmDelete = async () => {
            try {
                const res = await fetch(`https://fitos-final.onrender.com/api/contents/comments/${commentId}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
                if (res.ok) fetchComments();
            } catch (error) { console.log(error); }
        };

        if (isWeb) {
            if (window.confirm("Certeza que deseja apagar este comentário?")) confirmDelete();
        } else {
            Alert.alert("Excluir", "Deseja apagar este comentário?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Sim", style: "destructive", onPress: confirmDelete }
            ]);
        }
    };

    const cancelEditing = () => {
        setNewComment('');
        setEditingCommentId(null);
    };

    const isVerticalVideo = videoLayout.width < videoLayout.height;

    return (
        <RootComponent style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" hidden={!isWeb} />
            
            <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: '#000' }}>
                
                <View style={[styles.playerWrapper, (isVerticalVideo || isYouTubeShort) ? { height: isWeb ? '70vh' : windowHeight * 0.7 } : { aspectRatio: 16/9 }]}>
                    <View style={styles.overlayHeader}>
                        {!isYouTube ? (
                            <TouchableOpacity style={styles.fullScreenBtn} onPress={triggerFullscreen}>
                                <MaterialCommunityIcons name="fullscreen" size={20} color="#FFF" />
                                <Text style={styles.fullScreenText}>TELA COMPLETA</Text>
                            </TouchableOpacity>
                        ) : <View />}

                        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                            <MaterialCommunityIcons name="close" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {isYouTube ? (
                        <View style={{ flex: 1, width: '100%', backgroundColor: '#000' }}>
                            {isWeb ? (
                                <iframe width="100%" height="100%" src={ytEmbedUrl} title={title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen style={{ border: 'none', zIndex: 1 }} />
                            ) : (
                                <WebView style={{ flex: 1, backgroundColor: '#000', zIndex: 1 }} javaScriptEnabled={true} domStorageEnabled={true} allowsFullscreenVideo={true} allowsInlineMediaPlayback={true} mediaPlaybackRequiresUserAction={false} source={{ uri: ytEmbedUrl }} />
                            )}
                        </View>
                    ) : (
                        <>
                            {!isReady && !isWeb && (
                                <View style={styles.loaderContainer}>
                                    <ActivityIndicator size="large" color={theme.accent} />
                                    <Text style={styles.loadingText}>A processar vídeo...</Text>
                                </View>
                            )}
                            
                            {isWeb ? (
                                <video id="pa-web-video" src={safeUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000', zIndex: 1 }} controls={true} autoPlay={false} preload="metadata" playsInline={true} onCanPlay={() => setIsReady(true)} />
                            ) : (
                                <Video ref={videoRef} style={[ styles.video, isVerticalVideo ? styles.videoVertical : styles.videoHorizontal, { zIndex: 1 } ]} source={{ uri: safeUrl }} useNativeControls resizeMode={ResizeMode.CONTAIN} onReadyForDisplay={handleReadyForDisplay} onFullscreenUpdate={handleFullscreenUpdate} />
                            )}
                        </>
                    )}
                </View>

                {/* 🔥 INFORMAÇÕES DO VÍDEO NO RODAPÉ DA TELA 🔥 */}
                {contentId && (
                    <View style={{ flex: 1, backgroundColor: theme.bg, padding: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 20 }}>
                            <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: theme.text, marginRight: 15 }}>{title}</Text>
                            
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: theme.surface, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border }} onPress={handleLike}>
                                    <MaterialCommunityIcons name={hasLiked ? "heart" : "heart-outline"} size={22} color={hasLiked ? "#FF3B30" : theme.textSecondary} />
                                    <Text style={{ color: hasLiked ? "#FF3B30" : theme.textSecondary, fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>{likesCount}</Text>
                                </TouchableOpacity>

                                {/* 🔥 BOTÃO QUE ABRE O MODAL DE COMENTÁRIOS 🔥 */}
                                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: theme.surface, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border }} onPress={() => setCommentsModalVisible(true)}>
                                    <MaterialCommunityIcons name="comment-multiple-outline" size={22} color={theme.textSecondary} />
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>Comentar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* 🔥 MODAL SEGURO DE COMENTÁRIOS PARA O ALUNO 🔥 */}
            <Modal visible={commentsModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
                    <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', borderWidth: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.surface, borderColor: theme.border }}>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                            <View>
                                <Text style={{ fontWeight: '900', fontSize: 16, letterSpacing: 1, color: theme.text }}>Comentários</Text>
                                <Text style={{ color: theme.accent, fontSize: 11, fontWeight: 'bold' }} numberOfLines={1}>{title}</Text>
                            </View>
                            <TouchableOpacity onPress={() => { setCommentsModalVisible(false); cancelEditing(); }} style={{ padding: 5 }}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary}/>
                            </TouchableOpacity>
                        </View>
                        
                        {loadingComments ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={theme.accent} />
                            </View>
                        ) : (
                            <FlatList 
                                data={comments}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ padding: 20 }}
                                renderItem={({ item }) => {
                                    const isMyComment = item.userId === userData?.id;
                                    const isAdminComment = item.user?.role === 'ADMIN';

                                    return (
                                        <View style={{ marginBottom: 15, backgroundColor: isAdminComment ? theme.accent + '11' : theme.bg, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: isAdminComment ? theme.accent : theme.border }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                    <MaterialCommunityIcons name={isAdminComment ? "shield-star" : "account-circle"} size={18} color={isAdminComment ? '#FFCC00' : theme.textSecondary} style={{marginRight: 6}} />
                                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>
                                                        {item.user?.name || 'Aluno'} 
                                                        {isAdminComment && <Text style={{color: '#FFCC00', fontSize: 11}}> [COACH]</Text>}
                                                    </Text>
                                                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginLeft: 8 }}>
                                                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                                    </Text>
                                                </View>
                                                
                                                {/* Ferramentas de Edição e Exclusão pro Aluno */}
                                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                                    {isMyComment && (
                                                        <TouchableOpacity onPress={() => handleEditClick(item)}>
                                                            <MaterialCommunityIcons name="pencil" size={16} color={theme.textSecondary} />
                                                        </TouchableOpacity>
                                                    )}
                                                    {isMyComment && (
                                                        <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                                                            <MaterialCommunityIcons name="trash-can" size={16} color="#FF3B30" />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                            <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20 }}>{item.text}</Text>
                                        </View>
                                    );
                                }}
                                ListEmptyComponent={
                                    <View style={{ alignItems: 'center', marginTop: 30 }}>
                                        <MaterialCommunityIcons name="comment-text-multiple-outline" size={40} color={theme.border} />
                                        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10, fontWeight: 'bold' }}>Nenhum comentário ainda.</Text>
                                    </View>
                                }
                            />
                        )}

                        <View style={{ backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border, padding: 15, paddingBottom: Platform.OS === 'ios' ? 25 : 15 }}>
                            {editingCommentId && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={{ color: theme.accent, fontSize: 11, fontWeight: 'bold' }}>Editando comentário...</Text>
                                    <TouchableOpacity onPress={cancelEditing}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                                <TextInput
                                    style={{ flex: 1, minHeight: 45, maxHeight: 100, borderWidth: 1, borderColor: theme.border, borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, fontSize: 14, color: theme.text, backgroundColor: theme.bg }}
                                    placeholder={editingCommentId ? "Edite seu comentário..." : "Adicione um comentário..."}
                                    placeholderTextColor={theme.textSecondary}
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    multiline
                                />
                                <TouchableOpacity
                                    style={{ width: 45, height: 45, borderRadius: 22.5, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center', marginLeft: 10, opacity: newComment.trim() ? 1 : 0.5 }}
                                    onPress={handleSendComment}
                                    disabled={!newComment.trim() || sendingComment}
                                >
                                    {sendingComment ? <ActivityIndicator size="small" color={theme.isDark ? '#000' : '#FFF'} /> : <MaterialCommunityIcons name={editingCommentId ? "check" : "send"} size={18} color={theme.isDark ? '#000' : '#FFF'} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    playerWrapper: { width: '100%', backgroundColor: '#000', position: 'relative' },
    
    overlayHeader: { position: 'absolute', top: Platform.OS === 'android' ? 10 : 20, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 9999 },
    fullScreenBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', gap: 8 },
    fullScreenText: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 },
    
    loaderContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 2, top: '50%', left: 0, right: 0 },
    loadingText: { color: '#888', marginTop: 10, fontWeight: 'bold' },
    video: { width: '100%' },
    videoHorizontal: { aspectRatio: 16 / 9 },
    videoVertical: { flex: 1 } 
});