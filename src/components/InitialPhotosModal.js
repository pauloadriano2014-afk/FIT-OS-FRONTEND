// src/components/InitialPhotosModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function InitialPhotosModal({ visible, onClose, theme, photoModal, userPlan, onNavigate }) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.chatModalOverlay}>
                <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: (userPlan === 'CHALLENGE_21' || userPlan === 'FICHA_8S') ? '#FF9500' : theme.accent }]}>
                    {photoModal.showEscape && (
                        <TouchableOpacity style={styles.upsellClose} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                    <View style={[styles.levelIconBox, { backgroundColor: (userPlan === 'CHALLENGE_21' || userPlan === 'FICHA_8S') ? '#FF950022' : theme.accent + '22', marginBottom: 20 }]}>
                        <MaterialCommunityIcons name="camera-timer" size={36} color={(userPlan === 'CHALLENGE_21' || userPlan === 'FICHA_8S') ? '#FF9500' : theme.accent} />
                    </View>
                    <Text style={[styles.upsellTitle, { color: theme.text }]}>{photoModal.title}</Text>
                    <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>{photoModal.desc}</Text>
                    
                    <TouchableOpacity style={[styles.upsellBtn, {backgroundColor: theme.accent, marginBottom: 10}]} onPress={onNavigate}>
                        <MaterialCommunityIcons name="camera" size={20} color={theme.isDark ? '#000' : '#FFF'} style={{marginRight: 8}}/>
                        <Text style={[styles.upsellBtnText, {color: theme.isDark ? '#000' : '#FFF'}]}>{photoModal.btnText}</Text>
                    </TouchableOpacity>
                    
                    {photoModal.showEscape && (
                        <TouchableOpacity style={{padding: 15, alignItems: 'center'}} onPress={onClose}>
                            <Text style={{color: theme.textSecondary, fontWeight: 'bold', fontSize: 12, textDecorationLine: 'underline'}}>{photoModal.escapeText}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    chatModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    upsellCard: { width: '90%', maxWidth: 420, alignSelf: 'center', padding: 25, borderRadius: 24, borderWidth: 2, alignItems: 'center' },
    upsellClose: { position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 10 },
    levelIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    upsellTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, letterSpacing: 1, textAlign: 'center' },
    upsellDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    upsellBtn: { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    upsellBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});