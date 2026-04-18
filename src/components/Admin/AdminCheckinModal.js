// src/components/Admin/AdminCheckinModal.js
import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Platform, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminCheckinModal({ visible, onClose, selectedCheckin, theme, isResolving, onResolve }) {
    
    const handleDownloadPhoto = async (url, photoType) => {
        if (!url) return;
        const alunoNome = selectedCheckin?.user?.name ? selectedCheckin.user.name.replace(/\s+/g, '_') : 'aluno';
        const fileName = `Checkin_${alunoNome}_${photoType}.jpg`;
        if (Platform.OS === 'web') {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) { window.open(url, '_blank'); }
        } else Linking.openURL(url); 
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>CHECK-IN: <Text style={{ color: theme.accent }}>{selectedCheckin?.user?.name || 'Aluno'}</Text></Text>
                        <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={24} color={theme.text}/></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{padding: 20}}>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoBox, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={styles.infoLabel}>DATA</Text><Text style={[styles.infoValue, { color: theme.text }]}>{new Date(selectedCheckin?.date).toLocaleDateString()}</Text></View>
                            <View style={[styles.infoBox, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={styles.infoLabel}>PESO</Text><Text style={[styles.infoValue, { color: theme.text }]}>{selectedCheckin?.weight} kg</Text></View>
                        </View>
                        {selectedCheckin?.feedback && (
                            <View style={[styles.feedbackBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <Text style={styles.infoLabel}>FEEDBACK DO ALUNO</Text>
                                <Text style={[styles.feedbackText, { color: theme.text }]}>"{selectedCheckin.feedback}"</Text>
                            </View>
                        )}
                        <Text style={[styles.infoLabel, {marginTop:20, marginBottom:10}]}>FOTOS</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {selectedCheckin?.photoFront && (
                                <View style={styles.photoContainer}>
                                    <Image source={{uri: selectedCheckin.photoFront}} style={[styles.photo, { borderColor: theme.border }]} />
                                    <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => handleDownloadPhoto(selectedCheckin.photoFront, 'FRENTE')}>
                                        <MaterialCommunityIcons name="download" size={16} color={theme.text} />
                                        <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {selectedCheckin?.photoSide && (
                                <View style={styles.photoContainer}>
                                    <Image source={{uri: selectedCheckin.photoSide}} style={[styles.photo, { borderColor: theme.border }]} />
                                    <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => handleDownloadPhoto(selectedCheckin.photoSide, 'LADO')}>
                                        <MaterialCommunityIcons name="download" size={16} color={theme.text} />
                                        <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {selectedCheckin?.photoBack && (
                                <View style={styles.photoContainer}>
                                    <Image source={{uri: selectedCheckin.photoBack}} style={[styles.photo, { borderColor: theme.border }]} />
                                    <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => handleDownloadPhoto(selectedCheckin.photoBack, 'COSTAS')}>
                                        <MaterialCommunityIcons name="download" size={16} color={theme.text} />
                                        <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>

                        {!selectedCheckin?.coachFeedback && (
                            <TouchableOpacity 
                                style={styles.inviteBtn}
                                onPress={onResolve}
                                disabled={isResolving}
                            >
                                {isResolving ? <ActivityIndicator color="#FFF" /> : (
                                    <>
                                        <MaterialCommunityIcons name="check-all" size={22} color="#FFF" />
                                        <Text style={styles.inviteBtnText}>MARCAR COMO AVALIADO (REMOVER ALERTA)</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 20, maxHeight: '80%', borderWidth:1, width: '100%', maxWidth: 440, alignSelf: 'center' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth:1 },
    modalTitle: { fontWeight: 'bold', fontSize: 16 },
    infoRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    infoBox: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
    infoLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
    infoValue: { fontSize: 16, fontWeight: 'bold' },
    feedbackBox: { padding: 15, borderRadius: 8, borderWidth: 1 },
    feedbackText: { fontStyle: 'italic', marginTop: 5 },
    photoContainer: { marginRight: 15, alignItems: 'center' },
    photo: { width: 120, height: 180, borderRadius: 8, borderWidth: 1 },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, gap: 5, width: '100%' },
    downloadText: { fontSize: 10, fontWeight: '900' },
    inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#34C759', marginTop: 30, padding: 15, borderRadius: 12, gap: 8 },
    inviteBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 1, color: '#FFF' }
});