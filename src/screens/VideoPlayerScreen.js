// src/screens/VideoPlayerScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function VideoPlayerScreen({ route, navigation }) {
    const { url, title } = route.params;
    const { theme } = useTheme();
    const videoRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [videoLayout, setVideoLayout] = useState({ width: 16, height: 9 });

    const isWeb = Platform.OS === 'web';
    const RootComponent = isWeb ? View : SafeAreaView;

    // Garante que o telemóvel volta ao modo retrato ao fechar o vídeo
    useEffect(() => {
        return () => {
            if (!isWeb) {
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            }
        };
    }, [isWeb]);

    // Inteligência de Rotação Automática ao entrar/sair de Ecrã Inteiro
    const handleFullscreenUpdate = async ({ fullscreenUpdate }) => {
        if (isWeb) return;
        if (fullscreenUpdate === 1) { // PLAYER_DID_PRESENT
            await ScreenOrientation.unlockAsync();
        } else if (fullscreenUpdate === 3) { // PLAYER_DID_DISMISS
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
    };

    // Deteta se é 9:16 (Reels) ou 16:9 (Masterclass)
    const handleReadyForDisplay = (e) => {
        setIsReady(true);
        const { naturalSize } = e;
        if (naturalSize.orientation === 'portrait' || naturalSize.width < naturalSize.height) {
            setVideoLayout({ width: 9, height: 16 });
        } else {
            setVideoLayout({ width: 16, height: 9 });
        }
    };

    return (
        <RootComponent style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            
            <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: '#000' }}>
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF"/>
                    </TouchableOpacity>
                    <Text style={styles.title} numberOfLines={1}>{title || 'PA FLIX'}</Text>
                    <View style={{ width: 40 }} /> 
                </View>

                <View style={styles.playerContainer}>
                    {!isReady && (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={theme.accent} />
                            <Text style={styles.loadingText}>A processar vídeo...</Text>
                        </View>
                    )}
                    
                    <Video
                        ref={videoRef}
                        style={[
                            styles.video, 
                            videoLayout.width < videoLayout.height ? styles.videoVertical : styles.videoHorizontal
                        ]}
                        source={{ uri: url }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        onReadyForDisplay={handleReadyForDisplay}
                        onFullscreenUpdate={handleFullscreenUpdate}
                    />
                </View>
            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15, backgroundColor: '#000', zIndex: 10 },
    backBtn: { padding: 8, borderRadius: 8, borderWidth: 1, backgroundColor: '#111', borderColor: '#333' },
    title: { fontSize: 16, fontWeight: '900', flex: 1, textAlign: 'center', marginHorizontal: 10, color: '#FFF' },
    playerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    loaderContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    loadingText: { color: '#888', marginTop: 10, fontWeight: 'bold' },
    video: { width: '100%' },
    videoHorizontal: { aspectRatio: 16 / 9 },
    videoVertical: { flex: 1 } 
});