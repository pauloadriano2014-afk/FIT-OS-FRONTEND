import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CheckinDetailsModal({ visible, onClose, theme, selectedCheckin }) {
    if (!selectedCheckin) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.detailsOverlay}>
                <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.detailsTitle, { color: theme.accent }]}>CHECK-IN DETALHES</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>DATA:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{new Date(selectedCheckin.date).toLocaleDateString('pt-BR')}</Text></View>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={styles.detailLabel}>PESO:</Text><Text style={[styles.detailValue, {color:'#32ADE6', fontSize:20}]}>{selectedCheckin.weight} kg</Text></View>
                        
                        {selectedCheckin.feedback && (
                            <View style={[styles.feedbackContainer, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                                <Text style={[styles.feedbackText, { color: theme.text }]}>"{selectedCheckin.feedback}"</Text>
                            </View>
                        )}

                        <Text style={{color: theme.textSecondary, marginTop:15, marginBottom:10, fontWeight:'bold', fontSize:12}}>FOTOS ENVIADAS:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10, paddingBottom:10}}>
                            {selectedCheckin.photoFront && (
                                <View style={{alignItems:'center'}}>
                                    <Image source={{uri: selectedCheckin.photoFront}} style={[styles.photo, { borderColor: theme.border }]} />
                                    <Text style={{color: theme.textSecondary, fontSize:10, marginTop:5, fontWeight:'bold'}}>FRENTE</Text>
                                </View>
                            )}
                            {selectedCheckin.photoSide && (
                                <View style={{alignItems:'center'}}>
                                    <Image source={{uri: selectedCheckin.photoSide}} style={[styles.photo, { borderColor: theme.border }]} />
                                    <Text style={{color: theme.textSecondary, fontSize:10, marginTop:5, fontWeight:'bold'}}>LADO</Text>
                                </View>
                            )}
                            {selectedCheckin.photoBack && (
                                <View style={{alignItems:'center'}}>
                                    <Image source={{uri: selectedCheckin.photoBack}} style={[styles.photo, { borderColor: theme.border }]} />
                                    <Text style={{color: theme.textSecondary, fontSize:10, marginTop:5, fontWeight:'bold'}}>COSTAS</Text>
                                </View>
                            )}
                        </ScrollView>
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
    feedbackContainer: { padding:12, borderRadius:8, marginTop:5 },
    feedbackText: { fontSize:13, fontStyle:'italic', lineHeight: 18 },
    photo: { width: 120, height: 180, borderRadius: 8, borderWidth: 1 },
});