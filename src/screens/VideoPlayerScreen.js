// src/screens/VideoPlayerScreen.js

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as ScreenOrientation from 'expo-screen-orientation';
import { WebView } from 'react-native-webview';

export default function VideoPlayerScreen({ route, navigation }) {
    const { url, title } = route.params;
    const { theme } = useTheme();
    const videoRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [videoLayout, setVideoLayout] = useState({ width: 16, height: 9 });

    const isWeb = Platform.OS === 'web';
    const RootComponent = isWeb ? View : SafeAreaView;

    // 🔥 BLINDAGEM DE URL (Descodifica links que vêm sujos da Web) 🔥
    const safeUrl = url ? decodeURIComponent(url) : '';

    // 🔥 DETECTOR DE YOUTUBE TURBINADO (Cobre Shorts, Embeds e Links Sujos) 🔥
    const isYouTube = safeUrl.includes('youtube.com') || safeUrl.includes('youtu.be');
    
    const getYouTubeId = (str) => {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
        const match = str.match(regExp);
        return match ? match[1] : null;
    };

    const ytId = isYouTube ? getYouTubeId(safeUrl) : null;
    // O playsinline=1 é obrigatório para o iOS não surtar com WebViews
    const ytEmbedUrl = ytId ? `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1&playsinline=1` : safeUrl;

    useEffect(() => {
        return () => {
            if (!isWeb) {
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            }
        };
    }, [isWeb]);

    const handleFullscreenUpdate = async ({ fullscreenUpdate }) => {
        if (isWeb) return;
        if (fullscreenUpdate === 1) { 
            await ScreenOrientation.unlockAsync();
        } else if (fullscreenUpdate === 3) { 
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
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

    // 🔥 MOTOR UNIFICADO DE TELA COMPLETA (WEB E MOBILE) 🔥
    const triggerFullscreen = () => {
        if (isWeb) {
            // Chama a API de Fullscreen do Navegador (Chrome/Safari)
            const elem = document.getElementById('pa-web-video');
            if (elem) {
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) { /* Safari */
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { /* IE11 */
                    elem.msRequestFullscreen();
                }
            }
        } else {
            // Chama a API do Expo AV no Celular
            if (videoRef.current) {
                videoRef.current.presentFullscreenPlayer();
            }
        }
    };

    return (
        <RootComponent style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" hidden={!isWeb} />
            
            <View style={styles.playerWrapper}>
                
                {/* 🔥 OVERLAY HEADER (BOTÃO TELA COMPLETA E X VERMELHO) 🔥 */}
                <View style={styles.overlayHeader}>
                    {/* Botão de Tela Completa: Aparece para Cloudflare em TODAS as plataformas */}
                    {!isYouTube ? (
                        <TouchableOpacity style={styles.fullScreenBtn} onPress={triggerFullscreen}>
                            <MaterialCommunityIcons name="fullscreen" size={20} color="#FFF" />
                            <Text style={styles.fullScreenText}>TELA COMPLETA</Text>
                        </TouchableOpacity>
                    ) : (
                        <View /> 
                    )}

                    <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="close" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {isYouTube ? (
                    // 🎥 SE FOR YOUTUBE (AGORA COM FLEX: 1 PARA PREENCHER TELA VERTICAL)
                    <View style={{ flex: 1, width: '100%', backgroundColor: '#000' }}>
                        {isWeb ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={ytEmbedUrl}
                                title={title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                style={{ border: 'none', zIndex: 1 }}
                            />
                        ) : (
                            <WebView
                                style={{ flex: 1, backgroundColor: '#000', zIndex: 1 }}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                allowsFullscreenVideo={true} 
                                allowsInlineMediaPlayback={true} 
                                mediaPlaybackRequiresUserAction={false} 
                                source={{ uri: ytEmbedUrl }}
                            />
                        )}
                    </View>
                ) : (
                    // ☁️ SE FOR CLOUDFLARE R2 OU OUTRO MP4 (NATIVO)
                    <>
                        {!isReady && !isWeb && (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color={theme.accent} />
                                <Text style={styles.loadingText}>A processar vídeo...</Text>
                            </View>
                        )}
                        
                        {isWeb ? (
                            <video
                                id="pa-web-video"
                                src={safeUrl}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000', zIndex: 1 }}
                                controls={true}
                                autoPlay={false}
                                preload="metadata"
                                playsInline={true}
                                onCanPlay={() => setIsReady(true)}
                            />
                        ) : (
                            <Video
                                ref={videoRef}
                                style={[
                                    styles.video, 
                                    videoLayout.width < videoLayout.height ? styles.videoVertical : styles.videoHorizontal,
                                    { zIndex: 1 }
                                ]}
                                source={{ uri: safeUrl }}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                onReadyForDisplay={handleReadyForDisplay}
                                onFullscreenUpdate={handleFullscreenUpdate}
                            />
                        )}
                    </>
                )}
            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    playerWrapper: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 480 : '100%', alignSelf: 'center', backgroundColor: '#000', justifyContent: 'center', position: 'relative' },
    
    // Overlay Flutuante com zIndex altíssimo para sobrepor iframes e vídeos
    overlayHeader: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 9999 },
    fullScreenBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', gap: 8 },
    fullScreenText: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 },
    
    loaderContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 2, top: '50%', left: 0, right: 0 },
    loadingText: { color: '#888', marginTop: 10, fontWeight: 'bold' },
    video: { width: '100%' },
    videoHorizontal: { aspectRatio: 16 / 9 },
    videoVertical: { flex: 1 } 
});