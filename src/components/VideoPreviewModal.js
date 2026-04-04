// src/components/VideoPreviewModal.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, TouchableOpacity, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

export default function VideoPreviewModal({ visible, videoUrl, onClose, theme }) {
    const { width } = useWindowDimensions();
    const videoRef = useRef(null);
    const [isVideoLoading, setIsVideoLoading] = useState(true);

    const isWeb = Platform.OS === 'web';

    useEffect(() => {
        if (visible) {
            setIsVideoLoading(true);
        }
    }, [visible, videoUrl]);

    if (!visible || !videoUrl) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                <View style={{ 
                    width: isWeb && width > 600 ? 400 : '85%', 
                    height: isWeb && width > 600 ? 700 : '65%', 
                    backgroundColor: '#000', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#333', elevation: 20,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    
                    <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 12, right: 12, zIndex: 100, backgroundColor: 'rgba(255,59,48,0.9)', borderRadius: 15, padding: 4 }}>
                        <MaterialCommunityIcons name="close" size={18} color="#FFF" />
                    </TouchableOpacity>

                    {/* 🔥 A SOLUÇÃO DA BOLINHA DUPLA: O spinner verde agora SÓ renderiza no Celular! */}
                    {!isWeb && isVideoLoading && (
                        <View style={{ position: 'absolute', zIndex: 50 }}>
                            <ActivityIndicator size="large" color={theme.accent} />
                        </View>
                    )}
                    
                    <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#000' }}>
                        {isWeb ? (
                            <video
                                src={videoUrl}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                controls={true}
                                autoPlay={true}
                                muted={true}
                                loop={true}
                                playsInline={true}
                                onCanPlay={() => setIsVideoLoading(false)}
                                onLoadedMetadata={(e) => {
                                    e.target.muted = true; 
                                    e.target.play();       
                                }}
                            />
                        ) : (
                            <Video 
                                ref={videoRef} 
                                style={{ flex: 1, width: '100%', height: '100%' }}
                                source={{ uri: videoUrl }} 
                                resizeMode={ResizeMode.COVER} 
                                shouldPlay={true} 
                                isMuted={true}
                                isLooping={true} 
                                useNativeControls={true}
                                onLoad={() => setIsVideoLoading(false)}
                            />
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}