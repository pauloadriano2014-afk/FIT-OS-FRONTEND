// src/screens/AudioPlayerScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
    Platform, StatusBar, ScrollView, ActivityIndicator, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// 🔥 TRADUTOR BLINDADO DO GOOGLE DRIVE PARA IMAGENS
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

// 🔥 NOVO: TRADUTOR BLINDADO DO GOOGLE DRIVE PARA ÁUDIO (Extrai o mp3 direto)
const getDirectAudioUrl = (url) => {
    if (!url) return null;
    if (url.includes('drive.google.com')) {
        const match = url.match(/[-\w]{25,}/);
        if (match && match[0]) {
            return `https://docs.google.com/uc?export=download&id=${match[0]}`;
        }
    }
    return url;
};

export default function AudioPlayerScreen({ route, navigation }) {
    const { chapters, title, thumbUrl } = route.params;
    const { theme } = useTheme();
    
    const [sound, setSound] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);

    const isWeb = Platform.OS === 'web';
    const RootComponent = isWeb ? View : SafeAreaView;
    const coverImage = getDirectImageUrl(thumbUrl) || 'https://via.placeholder.com/400';

    useEffect(() => {
        return sound ? () => { sound.unloadAsync(); } : undefined;
    }, [sound]);

    useEffect(() => {
        loadChapter(currentIndex);
    }, [currentIndex]);

    const loadChapter = async (index) => {
        if (!chapters || chapters.length === 0 || !chapters[index]?.url) return;
        
        setIsBuffering(true);
        if (sound) {
            await sound.unloadAsync();
        }

        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            // Usa o tradutor para garantir que o Drive entregue o MP3
            const directAudioLink = getDirectAudioUrl(chapters[index].url);

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: directAudioLink },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );
            
            setSound(newSound);
            setIsPlaying(true);
        } catch (error) {
            console.log('Erro ao carregar áudio', error);
        } finally {
            setIsBuffering(false);
        }
    };

    const onPlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis);
            setIsBuffering(status.isBuffering);
            setIsPlaying(status.isPlaying);

            if (status.didJustFinish) {
                handleNext();
            }
        }
    };

    const handlePlayPause = async () => {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }
    };

    const handleNext = () => {
        if (currentIndex < chapters.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const formatTime = (millis) => {
        if (!millis) return "00:00";
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
    };

    return (
        <RootComponent style={[styles.container, { backgroundColor: '#0a0a0a' }]}>
            <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
            
            <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#0a0a0a' }}>
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="chevron-down" size={28} color="#FFF"/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                    <View style={{ width: 40 }} /> 
                </View>

                <View style={styles.coverContainer}>
                    <Image 
                        source={coverImage}
                        style={styles.coverImage}
                        contentFit="cover"
                        cachePolicy="disk"
                    />
                </View>

                <View style={styles.playerSection}>
                    <View style={styles.titleRow}>
                        <Text style={styles.chapterTitle} numberOfLines={1}>
                            {chapters[currentIndex]?.title || 'Sem Título'}
                        </Text>
                        <Text style={styles.authorTitle}>PAULO ADRIANO TEAM</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: duration > 0 ? `${(position / duration) * 100}%` : '0%', backgroundColor: theme.accent }]} />
                        </View>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{formatTime(position)}</Text>
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>
                    </View>

                    <View style={styles.controlsRow}>
                        <TouchableOpacity onPress={handlePrev} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}>
                            <MaterialCommunityIcons name="skip-previous" size={40} color="#FFF" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={handlePlayPause} style={[styles.playBtn, { backgroundColor: theme.accent }]}>
                            {isBuffering ? (
                                <ActivityIndicator color="#000" size="small" />
                            ) : (
                                <MaterialCommunityIcons name={isPlaying ? "pause" : "play"} size={32} color="#000" />
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={handleNext} disabled={currentIndex === chapters.length - 1} style={{ opacity: currentIndex === chapters.length - 1 ? 0.3 : 1 }}>
                            <MaterialCommunityIcons name="skip-next" size={40} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.listSection}>
                    <Text style={styles.listHeader}>Capítulos ({chapters.length})</Text>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                        {chapters.map((chap, index) => (
                            <TouchableOpacity 
                                key={index.toString()} 
                                style={styles.chapterItem}
                                onPress={() => setCurrentIndex(index)}
                            >
                                <Text style={[styles.chapterNumber, { color: currentIndex === index ? theme.accent : '#555' }]}>
                                    {index + 1}
                                </Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.chapterItemTitle, { color: currentIndex === index ? theme.accent : '#FFF' }]}>
                                        {chap.title || `Faixa ${index + 1}`}
                                    </Text>
                                </View>
                                {currentIndex === index && isPlaying && (
                                    <MaterialCommunityIcons name="volume-high" size={16} color={theme.accent} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10 },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', flex: 1 },
    coverContainer: { alignItems: 'center', marginVertical: 20 },
    coverImage: { width: width * 0.7, height: width * 0.7, borderRadius: 12, backgroundColor: '#111' },
    playerSection: { paddingHorizontal: 30, marginBottom: 20 },
    titleRow: { marginBottom: 20 },
    chapterTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
    authorTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
    progressContainer: { marginBottom: 20 },
    progressBarBg: { height: 4, backgroundColor: '#333', borderRadius: 2, marginBottom: 10 },
    progressBarFill: { height: '100%', borderRadius: 2 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
    timeText: { color: '#888', fontSize: 11, fontWeight: 'bold' },
    controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30 },
    playBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    listSection: { flex: 1, backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    listHeader: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
    chapterItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
    chapterNumber: { fontSize: 14, fontWeight: '900', width: 30 },
    chapterItemTitle: { fontSize: 14, fontWeight: 'bold' },
});