import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function SmartThumbnail({ url, style, theme, onPress }) {
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadThumbnail = async () => {
            if (!url) { if (isMounted) setLoading(false); return; }
            
            // YouTube
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            const ytId = (match && match[2].length === 11) ? match[2] : null;
            if (ytId) {
                if (isMounted) { setImageUri(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`); setLoading(false); }
                return;
            }

            // Cloudinary
            if (url.includes('cloudinary.com')) {
                if (isMounted) { setImageUri(url.replace(/\.(mp4|mov|avi|mkv)$/i, '.jpg')); setLoading(false); }
                return;
            }

            // Native
            if (Platform.OS !== 'web') {
                try {
                    const { uri } = await VideoThumbnails.getThumbnailAsync(url, { time: 1000, quality: 0.6 });
                    if (uri && isMounted) setImageUri(uri);
                } catch (e) { }
            }
            if (isMounted) setLoading(false);
        };
        loadThumbnail();
        return () => { isMounted = false; };
    }, [url]);

    return (
        <TouchableOpacity style={[style, { backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', borderColor: theme.border, borderWidth: 1, overflow: 'hidden' }]} onPress={onPress}>
            {loading ? (
                <ActivityIndicator size="small" color={theme.accent} />
            ) : imageUri ? (
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
                <MaterialCommunityIcons name="play-circle-outline" size={28} color={theme.accent} />
            )}
        </TouchableOpacity>
    );
}