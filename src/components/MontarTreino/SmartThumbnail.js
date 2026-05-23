// src/components/MontarTreino/SmartThumbnail.js
import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function SmartThumbnail({ url, style, theme, onPress }) {
    const safeTheme = theme ?? {
        surface: '#1c1c1e',
        border: 'rgba(255,255,255,0.1)',
        accent: '#007AFF',
    };

    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadThumbnail = async () => {
            if (!url) {
                if (isMounted) setLoading(false);
                return;
            }

            // 1. YouTube
            const ytRegex = /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*)/;
            const ytMatch = url.match(ytRegex);
            const ytId = ytMatch && ytMatch[1] && ytMatch[1].length === 11 ? ytMatch[1] : null;
            if (ytId) {
                if (isMounted) {
                    setImageUri(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
                    setLoading(false);
                }
                return;
            }

            // 2. Cloudinary video → thumbnail automática
            if (url.includes('cloudinary.com') && (url.includes('/video/') || url.match(/\.(mp4|mov|avi|webm)$/i))) {
                const thumbUrl = url
                    .replace('/video/upload/', '/video/upload/so_1,f_jpg,q_80,w_400/')
                    .replace(/\.(mp4|mov|avi|webm)$/i, '.jpg');
                if (isMounted) {
                    setImageUri(thumbUrl);
                    setLoading(false);
                }
                return;
            }

            // 3. URL de imagem direta
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                if (isMounted) {
                    setImageUri(url);
                    setLoading(false);
                }
                return;
            }

            // 4. Vídeo nativo (mobile) → expo-video-thumbnails
            if (Platform.OS !== 'web' && url.match(/\.(mp4|mov|avi|webm)$/i)) {
                try {
                    const { uri } = await VideoThumbnails.getThumbnailAsync(url, { time: 1000 });
                    if (isMounted) {
                        setImageUri(uri);
                        setLoading(false);
                    }
                } catch {
                    if (isMounted) setLoading(false);
                }
                return;
            }

            // 5. Fallback: sem thumbnail
            if (isMounted) setLoading(false);
        };

        loadThumbnail();
        return () => { isMounted = false; };
    }, [url]);

    const handleImageError = () => {
        setImageFailed(true);
    };

    const hasMedia = !!url;
    const showImage = imageUri && !imageFailed;
    const showWebVideoFrame =
        Platform.OS === 'web' &&
        !showImage &&
        url &&
        url.match(/\.(mp4|mov|avi|webm)$/i);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={[
                styles.container,
                {
                    backgroundColor: safeTheme.surface,
                    borderColor: safeTheme.border,
                },
                style,
            ]}
        >
            {loading && (
                <ActivityIndicator size="small" color={safeTheme.accent} />
            )}

            {!loading && hasMedia ? (
                <View style={StyleSheet.absoluteFillObject}>
                    {showImage && (
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.content}
                            resizeMode="cover"
                            onError={handleImageError}
                        />
                    )}
                    {showWebVideoFrame && (
                        <video
                            src={`${url}#t=1.0`}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                pointerEvents: 'none',
                            }}
                            preload="metadata"
                            muted
                            playsInline
                        />
                    )}
                    <View style={styles.iconOverlay}>
                        <MaterialCommunityIcons
                            name="play-circle-outline"
                            size={28}
                            color="rgba(255,255,255,0.8)"
                        />
                    </View>
                </View>
            ) : !loading ? (
                <MaterialCommunityIcons
                    name="play-circle-outline"
                    size={28}
                    color={safeTheme.accent}
                />
            ) : null}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    content: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    iconOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
});