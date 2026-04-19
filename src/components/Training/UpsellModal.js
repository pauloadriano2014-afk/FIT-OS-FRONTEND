// src/components/Training/UpsellModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UpsellModal({ visible, onClose, theme, upsellType }) {
    const handleContactCoach = () => {
        onClose();
        const msg = upsellType === 'ia' 
            ? "Coach, quero desbloquear a Inteligência Artificial e a Consultoria Premium!"
            : "Coach, quero desbloquear a Calculadora Exata de Cargas e a Consultoria Premium!";
        Linking.openURL(`https://wa.me/5597991346?text=${encodeURIComponent(msg)}`);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.upsellCard, { backgroundColor: theme.surface, borderColor: upsellType === 'ia' ? '#CCFF00' : '#32ADE6' }]}>
                    <TouchableOpacity style={styles.upsellClose} onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View style={[styles.upsellIconBox, { backgroundColor: upsellType === 'ia' ? '#CCFF0022' : '#32ADE622' }]}>
                        <MaterialCommunityIcons name={upsellType === 'ia' ? "camera-metering-spot" : "calculator"} size={36} color={upsellType === 'ia' ? '#CCFF00' : '#32ADE6'} />
                    </View>
                    
                    <Text style={[styles.upsellTitle, { color: theme.text }]}>FERRAMENTA DE ELITE</Text>
                    
                    <Text style={[styles.upsellDesc, { color: theme.textSecondary }]}>
                        {upsellType === 'ia' 
                            ? "A Inteligência Artificial que corrige sua postura em tempo real" 
                            : "A calculadora exata de cargas" 
                        } é uma ferramenta restrita para atletas Premium.
                    </Text>

                    <TouchableOpacity 
                        style={[styles.upsellBtn, { backgroundColor: upsellType === 'ia' ? '#CCFF00' : '#32ADE6', shadowColor: upsellType === 'ia' ? '#CCFF00' : '#32ADE6' }]} 
                        onPress={handleContactCoach}
                    >
                        <Text style={[styles.upsellBtnText, { color: upsellType === 'ia' ? '#000' : '#FFF' }]}>DESBLOQUEAR AGORA</Text>
                        <MaterialCommunityIcons name="whatsapp" size={20} color={upsellType === 'ia' ? '#000' : '#FFF'} style={{marginLeft: 8}}/>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    upsellCard: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 25, borderRadius: 24, borderWidth: 2, alignItems: 'center' },
    upsellClose: { position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 10 },
    upsellIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    upsellTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, letterSpacing: 1, textAlign: 'center' },
    upsellDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    upsellBtn: { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    upsellBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});