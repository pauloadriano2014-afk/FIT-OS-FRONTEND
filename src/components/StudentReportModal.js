// src/components/StudentReportModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 🔥 CONSTANTE PARA O ID DA ADRI (Mesmo usado no AdminDashboard)
const ADRI_COACH_ID = 'adri_coach_id_placeholder'; 

export default function StudentReportModal({ visible, onClose, pendingFeedback, userName, markFeedbackAsRead, isMarkingAsRead, coachId }) {
    
    // 🔥 IDENTIFICAÇÃO DE ASSINATURA (Paulo vs Adri) 🔥
    const currentCoachId = coachId || pendingFeedback?.coachId || pendingFeedback?.user?.coachId;
    const isAdri = currentCoachId === ADRI_COACH_ID;

    // 🔥 DECODIFICADOR DO CÓDIGO OCULTO DE COMPARAÇÃO 🔥
    let rawFeedbackText = pendingFeedback?.coachFeedback || '';
    let displayFeedbackText = rawFeedbackText;
    let compareOldPhotos = [];
    
    if (rawFeedbackText.includes('[COMPARE:')) {
        const match = rawFeedbackText.match(/\[COMPARE:(.*?)\]/);
        if (match) {
            compareOldPhotos = match[1].split('|');
            displayFeedbackText = rawFeedbackText.replace(match[0], '').trim();
        }
    }
    const currentPhotosKeys = ['photoFront', 'photoSide', 'photoBack'];

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.chatModalOverlay}>
                <View style={[styles.reportModalContent, { backgroundColor: '#111' }]}>
                    <View style={[styles.reportHeader, { flexDirection: 'column', alignItems: 'center', paddingBottom: 25, position: 'relative', borderBottomColor: '#333' }]}>
                        <TouchableOpacity style={{position: 'absolute', right: 20, top: 20, zIndex: 10}} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={28} color="#AAA" />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center', marginTop: 10 }}>
                            <Text style={[styles.reportTitle, { color: '#FFF', fontSize: 22, textAlign: 'center' }]}>RELATÓRIO TÉCNICO</Text>
                            <Text style={[styles.reportSubtitle, { color: '#4DE38F', fontWeight: 'bold', letterSpacing: 1, textAlign: 'center', marginTop: 4 }]}>ALUNO(A): {userName.toUpperCase()}</Text>
                        </View>
                        <View style={{ marginTop: 15, backgroundColor: '#4DE38F22', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 10 }}>
                            <Text style={{ color: '#4DE38F', fontSize: 11, fontWeight: '900' }}>
                                DATA: {pendingFeedback?.date ? new Date(pendingFeedback.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase() : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <ScrollView style={{flex: 1}} contentContainerStyle={{ padding: 25, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
                        {compareOldPhotos.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20, marginBottom: 30 }}>
                                {currentPhotosKeys.map((key, i) => {
                                    const currentPic = pendingFeedback?.[key];
                                    const oldPic = compareOldPhotos[i];
                                    if (!currentPic && (!oldPic || oldPic === 'null' || oldPic === '')) return null;

                                    const label = i === 0 ? 'FRONTAL' : (i === 1 ? 'LATERAL' : 'POSTERIOR');

                                    return (
                                        <View key={i} style={{ flexDirection: 'row', gap: 2, backgroundColor: '#1A1A1A', padding: 8, borderRadius: 16, borderWidth: 1, borderColor: '#333' }}>
                                            {oldPic && oldPic !== 'null' && oldPic !== '' && (
                                                <View style={{ width: 130, height: 200, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                                                    <Image source={{ uri: oldPic }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                                    <View style={{ position: 'absolute', bottom: 8, alignSelf: 'center', backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                        <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>ANTES ({label})</Text>
                                                    </View>
                                                </View>
                                            )}
                                            {currentPic && (
                                                <View style={{ width: 130, height: 200, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                                                    <Image source={{ uri: currentPic }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                                    <View style={{ position: 'absolute', bottom: 8, alignSelf: 'center', backgroundColor: '#4DE38F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                        <Text style={{ color: '#000', fontSize: 8, fontWeight: '900' }}>DEPOIS ({label})</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, marginBottom: 30 }}>
                                {currentPhotosKeys.map((key, i) => (
                                    pendingFeedback?.[key] && (
                                        <View key={i} style={styles.reportPhotoContainer}>
                                            <Image source={{ uri: pendingFeedback[key] }} style={styles.reportPhotoImg} resizeMode="cover" />
                                            <View style={[styles.reportPhotoBadge, { backgroundColor: '#4DE38F' }]}><Text style={[styles.reportPhotoBadgeText, {color:'#000'}]}>{key === 'photoFront' ? 'VISTA FRONTAL' : key === 'photoSide' ? 'VISTA LATERAL' : 'VISTA POSTERIOR'}</Text></View>
                                        </View>
                                    )
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.reportDivider} />
                        <Text style={[styles.reportSectionTitle, { color: '#4DE38F' }]}>ANÁLISE DETALHADA</Text>
                        <View style={{ marginTop: 10, marginBottom: 10 }}>
                            {displayFeedbackText.split('\n').map((paragraph, index) => {
                                const parts = paragraph.split(/(\*[^*]+\*)/g);
                                return (
                                    <Text key={index} style={[styles.reportText, { color: '#DDD' }]}>{parts.map((part, i) => {
                                            if (part.startsWith('*') && part.endsWith('*')) return <Text key={i} style={{ fontWeight: '900', color: '#FFF' }}>{part.slice(1, -1)}</Text>;
                                            return part;
                                        })}
                                    </Text>
                                );
                            })}
                        </View>
                        
                        {/* 🔥 ASSINATURA DINÂMICA (PAULO vs ADRI) 🔥 */}
                        {isAdri ? (
                            <View style={[styles.reportFooter, { backgroundColor: '#1A1A1A', borderColor: '#333', marginTop: 30, padding: 20, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}>
                                <View style={{ flex: 1 }}>
                                    {/* 🔥 Nome dela, sem subtítulo de equipe 🔥 */}
                                    <Text style={[styles.coachName, { color: '#FFF', fontWeight: '900', fontSize: 16 }]}>ADRI KERN</Text>
                                </View>
                                {/* 🔥 Logo exclusiva dela "TEAM KERN" 🔥 */}
                                <Image source={require('../../assets/TEAMKERN.jpg')} style={{ width: 60, height: 60 }} resizeMode="contain" />
                            </View>
                        ) : (
                            <View style={[styles.reportFooter, { backgroundColor: '#1A1A1A', borderColor: '#333', marginTop: 30, padding: 20, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}>
                                <Image source={require('../../assets/paulo-foto-perfil.png')} style={{ width: 60, height: 60, borderRadius: 30, marginRight: 15, borderWidth: 2, borderColor: '#4DE38F' }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.coachName, { color: '#FFF', fontWeight: '900', fontSize: 16 }]}>PAULO ADRIANO</Text>
                                    <Text style={[styles.coachTitle, { color: '#AAA', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }]}>COACH & TREINADOR ELITE</Text>
                                </View>
                                <Image source={require('../../assets/logo-pa.png')} style={{ width: 45, height: 45 }} resizeMode="contain" />
                            </View>
                        )}

                        <TouchableOpacity style={[styles.upsellBtn, {backgroundColor: '#4DE38F', marginTop: 30, marginBottom: 20}]} onPress={markFeedbackAsRead} disabled={isMarkingAsRead}>
                            {isMarkingAsRead ? <ActivityIndicator color="#000" /> : <Text style={[styles.upsellBtnText, {color: '#000'}]}>{isAdri ? 'COMPREENDIDO! 👊' : 'COMPREENDIDO, COACH! 👊'}</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    chatModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    reportModalContent: { width: '100%', height: '100%', maxWidth: 500, alignSelf: 'center', overflow: 'hidden' },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 40, borderBottomWidth: 1 },
    reportTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
    reportSubtitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
    reportPhotoContainer: { width: 220, height: 320, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', position: 'relative' },
    reportPhotoImg: { width: '100%', height: '100%' },
    reportPhotoBadge: { position: 'absolute', bottom: 15, alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
    reportPhotoBadgeText: { fontWeight: '900', fontSize: 10, letterSpacing: 1 },
    reportDivider: { height: 1, backgroundColor: '#333', width: '100%', marginBottom: 30 },
    reportSectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    reportText: { fontSize: 16, lineHeight: 28, marginBottom: 15, opacity: 0.9 },
    reportFooter: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1, marginTop: 10 },
    coachName: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    coachTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
    upsellBtn: { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    upsellBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});