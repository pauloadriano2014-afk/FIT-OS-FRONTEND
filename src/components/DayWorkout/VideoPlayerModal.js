// src/components/DayWorkout/VideoPlayerModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

export default function VideoPlayerModal({
  visible,
  onClose,
  currentVideoUrl,
  videoRef,
  isWeb,
  isIOSWeb,
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.videoCard}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }} style={styles.closeVideoBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.fullScreenOverlay} pointerEvents="box-none">
            <TouchableOpacity
              onPress={() => {
                if (isWeb && videoRef.current) {
                  const videoEl = videoRef.current;
                  if (videoEl.requestFullscreen) videoEl.requestFullscreen();
                  else if (videoEl.webkitEnterFullscreen) videoEl.webkitEnterFullscreen();
                } else if (videoRef.current) videoRef.current.presentFullscreenPlayer();
              }}
              style={styles.fullScreenBtn}
            >
              <MaterialCommunityIcons name="fullscreen" size={20} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11 }}>TELA COMPLETA</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }} pointerEvents={isIOSWeb ? "none" : "auto"}>
            {visible && currentVideoUrl ? (
              <>
                {isWeb ? (
                  <video ref={videoRef} src={currentVideoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', outline: 'none' }} controls={!isIOSWeb} autoPlay loop muted playsInline />
                ) : (
                  <Video ref={videoRef} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 1 }} source={{ uri: currentVideoUrl }} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={true} useNativeControls={true} />
                )}
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 20 },
  videoCard: { width: '90%', maxWidth: 400, height: '75%', maxHeight: 700, backgroundColor: '#000', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#333', elevation: 20 },
  closeVideoBtn: { position: 'absolute', top: 15, right: 15, zIndex: 100, backgroundColor: 'rgba(255,59,48,0.9)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  fullScreenOverlay: { position: 'absolute', zIndex: 10, top: 15, left: 15, width: '100%', height: '100%' },
  fullScreenBtn: { backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', elevation: 5 }
});