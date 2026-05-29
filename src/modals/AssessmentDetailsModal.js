import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AssessmentDetailsModal({ visible, onClose, theme, selectedAssessment }) {
    if (!selectedAssessment) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.detailsOverlay}>
                <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.detailsTitle, { color: theme.accent }]}>DETALHES</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>DATA:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{new Date(selectedAssessment.date).toLocaleDateString('pt-BR')}</Text></View>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>PESO:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{selectedAssessment.weight} kg</Text></View>
                        
                        {selectedAssessment.bodyFat && (
                            <View style={[styles.resultBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                                <View style={{alignItems:'center'}}><Text style={styles.resultLabel}>GORDURA</Text><Text style={[styles.resultValue, { color: theme.accent }]}>{selectedAssessment.bodyFat}%</Text></View>
                                <View style={{height:30, width:1, backgroundColor: theme.border}}/>
                                <View style={{alignItems:'center'}}><Text style={styles.resultLabel}>MASSA MAGRA</Text><Text style={[styles.resultValue, { color: theme.text }]}>{(selectedAssessment.weight * (1 - selectedAssessment.bodyFat/100)).toFixed(1)} kg</Text></View>
                            </View>
                        )}

                        {selectedAssessment.method === 'POLLOCK' && (
                            <>
                                <Text style={[styles.detailSection, { color: theme.accent }]}>DOBRAS (mm)</Text>
                                <View style={styles.detailGrid}>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Peitoral</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldChest || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Axilar</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldAxillary || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Tríceps</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldTriceps || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Subescap.</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldSubscapular || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Abdom.</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldAbdominal || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Supra-il.</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldSuprailiac || '-'}</Text></View>
                                    <View style={[styles.gridBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}><Text style={styles.gridLabel}>Coxa</Text><Text style={[styles.gridVal, { color: theme.text }]}>{selectedAssessment.foldThigh || '-'}</Text></View>
                                </View>
                            </>
                        )}
                        {(selectedAssessment.waist || selectedAssessment.abdomen) && (
                            <>
                                <Text style={[styles.detailSection, { color: theme.accent }]}>MEDIDAS (cm)</Text>
                                <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>Cintura:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{selectedAssessment.waist || '-'} cm</Text></View>
                                <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>Abdômen:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{selectedAssessment.abdomen || '-'} cm</Text></View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    detailsCard: { borderRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
    detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 15 },
    detailsTitle: { fontSize: 16, fontWeight: '900' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 5 },
    detailLabel: { color: '#888', fontWeight: 'bold', fontSize: 12 },
    detailValue: { fontWeight: 'bold', fontSize: 14 },
    resultBox: { flexDirection: 'row', borderRadius: 10, padding: 15, justifyContent: 'space-around', marginVertical: 15 },
    resultLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
    resultValue: { fontSize: 18, fontWeight: '900' },
    detailSection: { fontWeight: 'bold', fontSize: 12, marginTop: 10, marginBottom: 10 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridBox: { width: '30%', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 5 },
    gridLabel: { color: '#888', fontSize: 10, marginBottom: 2 },
    gridVal: { fontWeight: 'bold' },
});