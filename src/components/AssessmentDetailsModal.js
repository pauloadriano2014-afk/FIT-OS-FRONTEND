// src/components/AssessmentDetailsModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AssessmentDetailsModal({ visible, assessment, onClose, onGeneratePDF, onEdit, onDelete, theme }) {
    if (!visible || !assessment) return null;

    // Função auxiliar para não mostrar cards de medidas que estão vazias
    const renderMeasureCard = (label, value) => {
        if (!value) return null;
        return (
            <View style={[styles.measureCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>{label}</Text>
                <Text style={[styles.foldCardValue, {color: theme.text}]}>{value}</Text>
            </View>
        );
    };

    const hasAnyPerimetry = !!(assessment.chest || assessment.shoulders || assessment.waist || assessment.abdomen || assessment.hips || assessment.arms || assessment.armLeft || assessment.forearms || assessment.forearmLeft || assessment.thighs || assessment.thighLeft || assessment.calves || assessment.calfLeft);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.detailsOverlay}>
                <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.detailsTitle, { color: '#32ADE6' }]}>DETALHES</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                            <TouchableOpacity onPress={onGeneratePDF}>
                                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#32ADE6" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onEdit}>
                                <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onDelete}>
                                <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF3B30" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>DATA:</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{new Date(assessment.date).toLocaleDateString('pt-BR')}</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>PESO:</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{assessment.weight} kg</Text>
                        </View>
                        {assessment.bodyFat && (
                            <View style={[styles.resultBox, { backgroundColor: theme.bg }]}>
                                <View style={{alignItems:'center'}}>
                                    <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>GORDURA</Text>
                                    <Text style={[styles.resultValue, { color: '#32ADE6' }]}>{assessment.bodyFat}%</Text>
                                </View>
                                <View style={{height:30, width:1, backgroundColor: theme.border}}/>
                                <View style={{alignItems:'center'}}>
                                    <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>MASSA MAGRA</Text>
                                    <Text style={[styles.resultValue, { color: theme.text }]}>{(assessment.weight * (1 - assessment.bodyFat/100)).toFixed(1)} kg</Text>
                                </View>
                            </View>
                        )}
                        
                        {(assessment.method === 'POLLOCK') && (
                            <>
                                <Text style={[styles.detailSection, { color: '#32ADE6' }]}>DOBRAS POLOCK 7 (mm)</Text>
                                <View style={styles.foldsCardGrid}>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>PEITORAL</Text><Text style={[styles.foldCardValue, {color: theme.text}]}>{assessment.foldChest || '-'}</Text></View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>AXILAR</Text><Text style={[styles.foldCardValue, {color: theme.text}]}>{assessment.foldAxillary || '-'}</Text></View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>TRÍCEPS</Text><Text style={[styles.foldCardValue, {color: theme.text}]}>{assessment.foldTriceps || '-'}</Text></View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>SUBESCAP.</Text><Text style={[styles.foldCardValue, {color: theme.text}]}>{assessment.foldSubscapular || '-'}</Text></View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>ABDOMINAL</Text><Text style={[styles.foldCardValue, {color: theme.text}]}>{assessment.foldAbdominal || '-'}</Text></View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>SUPRA-IL.</Text><Text style={[styles.foldCardValue, {color: theme.text}]}>{assessment.foldSuprailiac || '-'}</Text></View>
                                    <View style={[styles.foldCard, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={[styles.foldCardTitle, {color: theme.textSecondary}]}>COXA</Text><Text style={[styles.foldCardValue, {color: theme.text}]}>{assessment.foldThigh || '-'}</Text></View>
                                </View>
                            </>
                        )}

                        {hasAnyPerimetry ? (
                            <>
                                <Text style={[styles.detailSection, { color: theme.accent, marginTop: 25 }]}>PERIMETRIA (cm)</Text>
                                <View style={styles.measuresCardGrid}>
                                    {renderMeasureCard('TÓRAX', assessment.chest)}
                                    {renderMeasureCard('OMBROS', assessment.shoulders)}
                                    {renderMeasureCard('CINTURA', assessment.waist)}
                                    {renderMeasureCard('ABDÔMEN', assessment.abdomen)}
                                    {renderMeasureCard('GLÚTEOS', assessment.hips)}
                                    {renderMeasureCard('BRAÇO DIR.', assessment.arms)}
                                    {renderMeasureCard('BRAÇO ESQ.', assessment.armLeft)}
                                    {renderMeasureCard('ANTEB. DIR.', assessment.forearms)}
                                    {renderMeasureCard('ANTEB. ESQ.', assessment.forearmLeft)}
                                    {renderMeasureCard('PERNA DIR.', assessment.thighs)}
                                    {renderMeasureCard('PERNA ESQ.', assessment.thighLeft)}
                                    {renderMeasureCard('PANTU. DIR.', assessment.calves)}
                                    {renderMeasureCard('PANTU. ESQ.', assessment.calfLeft)}
                                </View>
                            </>
                        ) : (
                            /* Modo Básico (Só aparece se não houver a perimetria avançada) */
                            (assessment.waist || assessment.abdomen) && (
                                <>
                                    <Text style={[styles.detailSection, { color: theme.accent }]}>MEDIDAS BÁSICAS (cm)</Text>
                                    { assessment.waist && <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Cintura:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{assessment.waist} cm</Text></View> }
                                    { assessment.abdomen && <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Abdômen:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{assessment.abdomen} cm</Text></View> }
                                </>
                            )
                        )}
                        <View style={{height: 30}}/>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    detailsCard: { borderRadius: 24, padding: 25, maxHeight: '85%', borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
    detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 15 },
    detailsTitle: { fontSize: 16, fontWeight: '900' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 8 },
    detailLabel: { fontWeight: 'bold', fontSize: 13 },
    detailValue: { fontWeight: '900', fontSize: 15 },
    resultBox: { flexDirection: 'row', borderRadius: 16, padding: 20, justifyContent: 'space-around', marginVertical: 20 },
    resultLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
    resultValue: { fontSize: 22, fontWeight: '900' },
    detailSection: { fontWeight: '900', fontSize: 14, marginTop: 15, marginBottom: 15, letterSpacing: 0.5 },
    
    // Grid 3 colunas (Dobras)
    foldsCardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    foldCard: { width: '31%', paddingVertical: 15, paddingHorizontal: 5, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 15 },
    foldCardTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
    foldCardValue: { fontSize: 16, fontWeight: '900' },

    // Grid 2 colunas (Perimetria)
    measuresCardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    measureCard: { width: '48%', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 15 }
});