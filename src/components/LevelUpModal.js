// src/modals/LevelUpModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LevelUpModal({ visible, onClose, theme, levelData, currentLevel, currentLevelProgress, nextLevelXP }) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity style={styles.chatModalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.levelModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.levelIconBox, { backgroundColor: theme.accent + '22' }]}>
                        <MaterialCommunityIcons name="lightning-bolt" size={32} color={theme.accent} />
                    </View>
                    <Text style={[styles.levelModalTitle, { color: theme.text }]}>{levelData.title}</Text>
                    <Text style={[styles.levelModalDesc, { color: theme.textSecondary }]}>{levelData.desc}</Text>
                    <View style={{ width: '100%', marginTop: 25, marginBottom: 15 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 12 }}>Nível {currentLevel}</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>{currentLevelProgress} / {nextLevelXP} XP</Text>
                        </View>
                        <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                            <View style={[styles.xpBarFill, { width: `${(currentLevelProgress/nextLevelXP)*100}%`, backgroundColor: theme.accent }]} />
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.levelModalBtn, { backgroundColor: theme.accent }]} onPress={onClose}>
                        <Text style={[styles.levelModalBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>CONTINUAR EVOLUINDO 🚀</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    chatModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
    levelModalContent: { width: '85%', maxWidth: 400, alignSelf: 'center', padding: 25, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
    levelIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    levelModalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
    levelModalDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, fontWeight: '500' },
    levelModalBtn: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
    levelModalBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    xpBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    xpBarFill: { height: '100%', borderRadius: 4 },
});