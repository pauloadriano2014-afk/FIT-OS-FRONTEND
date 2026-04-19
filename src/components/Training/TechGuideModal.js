// src/components/Training/TechGuideModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TechGuideModal({ visible, onClose, theme, selectedTech, TECH_GUIDE, isPlayingTechVoice, handlePlayTechVoice, isWeb }) {
    const techData = selectedTech && TECH_GUIDE[selectedTech] ? TECH_GUIDE[selectedTech] : null;
    const accentColor = techData?.color === theme.accent && !theme.isDark ? theme.accent : techData?.color;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.contentCard, { backgroundColor: theme.surface, borderColor: accentColor || theme.border, maxWidth: isWeb ? 440 : '100%' }]}>
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                        <View style={styles.header}>
                            <MaterialCommunityIcons name={techData ? techData.icon : 'dumbbell'} size={28} color={accentColor || theme.text} />
                            <Text style={[styles.title, { color: accentColor || theme.text }]}>{techData ? techData.title : ''}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <Text style={[styles.desc, { color: theme.text }]}>{techData ? techData.desc : ''}</Text>
                        
                        {techData?.audio && (
                            <TouchableOpacity onPress={() => handlePlayTechVoice(selectedTech)} style={[styles.audioBtn, { borderColor: isPlayingTechVoice ? '#FF3B30' : theme.textSecondary, backgroundColor: isPlayingTechVoice ? 'rgba(255,59,48,0.1)' : 'transparent' }]}>
                                <MaterialCommunityIcons name={isPlayingTechVoice ? "stop-circle-outline" : "play-circle-outline"} size={20} color={isPlayingTechVoice ? '#FF3B30' : theme.text} />
                                <Text style={[styles.audioBtnText, { color: isPlayingTechVoice ? '#FF3B30' : theme.text }]}>{isPlayingTechVoice ? 'PARAR AULA' : 'OUVIR O COACH'}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={[styles.closeBtn, { backgroundColor: accentColor || theme.accent }]} onPress={onClose}>
                        <Text style={[styles.closeBtnText, { color: (techData && (techData.color === theme.accent || techData.color === '#00FF7F')) ? '#000' : '#FFF' }]}>ENTENDI, BORA MOER!</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20, zIndex: 1000 },
    contentCard: { width: '100%', alignSelf: 'center', padding: 25, borderRadius: 25, borderWidth: 1, maxHeight: '80%' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    title: { fontSize: 16, fontWeight: '900', marginBottom: 0, flex: 1, flexWrap: 'wrap' },
    divider: { height: 1, width: '100%', marginBottom: 10 },
    desc: { fontSize: 14, lineHeight: 22 },
    audioBtn: { marginTop: 15, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    audioBtnText: { fontWeight: 'bold', fontSize: 12 },
    closeBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    closeBtnText: { fontWeight: '900', fontSize: 14 }
});