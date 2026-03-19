// src/components/SmartThumbnail.js
import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function SmartThumbnail({ url, style, theme, onPress }) {
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageFailed, setImageFailed] = useState(false);
    const [fallbackQueue, setFallbackQueue] = useState([]);

    useEffect(() => {
        let isMounted = true;
        const loadThumbnail = async () => {
            if (!url) { if (isMounted) setLoading(false); return; }
            
            // 1. YouTube
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            const ytId = (match && match[2].length === 11) ? match[2] : null;
            if (ytId) {
                if (isMounted) { setImageUri(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`); setLoading(false); }
                return;
            }

            // 2. Cloudinary
            if (url.includes('cloudinary.com')) {
                if (isMounted) { setImageUri(url.replace(/\.(mp4|mov|avi|mkv)$/i, '.jpg')); setLoading(false); }
                return;
            }

            // 3. Celular (APK/iOS) - Força Bruta Nativa para MP4 (Qualquer Servidor)
            if (Platform.OS !== 'web') {
                try {
                    const { uri } = await VideoThumbnails.getThumbnailAsync(url, { time: 1000, quality: 0.6 });
                    if (uri && isMounted) setImageUri(uri);
                } catch (e) { 
                    if (url.includes('cloudfront.net')) loadMfitUrls();
                }
            } else {
                // 4. WEB (PC ou PWA)
                if (url.includes('cloudfront.net')) loadMfitUrls();
            }
            
            if (isMounted) setLoading(false);

            function loadMfitUrls() {
                const extRemoved = url.replace(/\.(mp4|mov|avi|mkv)$/i, '.jpg');
                const queue = [
                    url.replace('/mp4/', '/img/').replace(/\.(mp4|mov|avi|mkv)$/i, '.jpg'),
                    extRemoved,
                    url.replace('/mp4/', '/thumbnails/').replace(/\.(mp4|mov|avi|mkv)$/i, '.jpg')
                ];
                if (isMounted) {
                    setFallbackQueue(queue);
                    setImageUri(queue[0]);
                }
            }
        };
        
        loadThumbnail();
        return () => { isMounted = false; };
    }, [url]);

    const handleImageError = () => {
        if (fallbackQueue.length > 1) {
            const newQueue = [...fallbackQueue];
            newQueue.shift();
            setFallbackQueue(newQueue);
            setImageUri(newQueue[0]);
        } else {
            setImageFailed(true);
        }
    };

    const isWeb = Platform.OS === 'web';
    const isDirectVideo = url && !url.includes('youtube.com') && !url.includes('youtu.be');
    
    const showImage = imageUri && !imageFailed;
    const showWebVideoFrame = isWeb && !showImage && isDirectVideo;
    const hasVisualContent = showImage || showWebVideoFrame;

    return (
        <TouchableOpacity style={[style, styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={onPress}>
            {loading ? (
                <ActivityIndicator size="small" color={theme.accent} />
            ) : hasVisualContent ? (
                <View style={StyleSheet.absoluteFillObject}>
                    {showImage && (
                        <Image source={{ uri: imageUri }} style={styles.content} resizeMode="cover" onError={handleImageError} />
                    )}
                    {showWebVideoFrame && (
                        <video 
                            src={`${url}#t=1.0`} 
                            style={{ ...styles.content, objectFit: 'cover', pointerEvents: 'none' }} 
                            preload="metadata" muted playsInline
                        />
                    )}
                    <View style={styles.iconOverlay}>
                        <MaterialCommunityIcons name="play-circle-outline" size={28} color="rgba(255,255,255,0.8)" />
                    </View>
                </View>
            ) : (
                <MaterialCommunityIcons name="play-circle-outline" size={28} color={theme.accent} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
    content: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
    iconOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.1)' }
});