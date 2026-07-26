// src/modals/AssessmentDetailsModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AssessmentDetailsModal({ visible, assessment, onClose, onGeneratePDF, onGenerateAI, generatingAI, onEdit, onDelete, theme }) {
    if (!visible || !assessment) return null;

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
    const hasPhotos = !!(assessment.photos && assessment.photos.length > 0 && assessment.photos.some(p => p && p !== ''));

    // 🔥 NOVO: estado do diagnóstico por IA para essa avaliação 🔥
    const hasAIReport = !!assessment.aiGeneratedAt;
    const aiGeneratedLabel = hasAIReport ? new Date(assessment.aiGeneratedAt).toLocaleDateString('pt-BR') : null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.detailsOverlay}>
                <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    {/* CABEÇALHO DO MODAL */}
                    <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.detailsTitle, { color: '#4DE38F' }]}>DETALHES DA AVALIAÇÃO</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                            {onEdit && (
                                <TouchableOpacity onPress={onEdit}>
                                    <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.text} />
                                </TouchableOpacity>
                            )}
                            {onDelete && (
                                <TouchableOpacity onPress={onDelete}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF3B30" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                        
                        {/* 🔥 BOTÃO GERAR LAUDO PA ELITE TEAM 🔥 */}
                        {onGeneratePDF && (
                            <TouchableOpacity 
                                onPress={onGeneratePDF} 
                                style={[styles.pdfButton, { borderColor: '#4DE38F' }]}
                            >
                                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#4DE38F" />
                                <Text style={styles.pdfButtonText}>GERAR LAUDO PA ELITE</Text>
                            </TouchableOpacity>
                        )}

                        {/* 🔥 BOTÃO GERAR DIAGNÓSTICO COM IA — só admin, só se tiver foto 🔥 */}
                        {onGenerateAI && hasPhotos && (
                            <>
                                <TouchableOpacity 
                                    onPress={onGenerateAI} 
                                    disabled={generatingAI}
                                    style={[styles.aiButton, { borderColor: '#9D00FF', opacity: generatingAI ? 0.6 : 1 }]}
                                >
                                    {generatingAI ? (
                                        <ActivityIndicator color="#9D00FF" size="small" />
                                    ) : (
                                        <MaterialCommunityIcons name="robot-outline" size={22} color="#9D00FF" />
                                    )}
                                    <Text style={styles.aiButtonText}>
                                        {generatingAI ? 'ANALISANDO FOTOS...' : (hasAIReport ? 'REGENERAR DIAGNÓSTICO COM IA' : 'GERAR DIAGNÓSTICO COM IA')}
                                    </Text>
                                </TouchableOpacity>
                                {hasAIReport && !generatingAI && (
                                    <Text style={[styles.aiGeneratedNote, { color: theme.textSecondary }]}>
                                        Diagnóstico gerado por IA em {aiGeneratedLabel}. As seções de análise do laudo PDF usam esse conteúdo.
                                    </Text>
                                )}
                            </>
                        )}

                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>DATA:</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{new Date(assessment.date).toLocaleDateString('pt-BR')}</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>PESO:</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{assessment.weight} kg</Text>
                        </View>

                        {assessment.bodyFat && (
                            <View style={[styles.resultBox, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                                <View style={{alignItems:'center'}}>
                                    <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>GORDURA</Text>
                                    <Text style={[styles.resultValue, { color: '#4DE38F' }]}>{assessment.bodyFat}%</Text>
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
                                <Text style={[styles.detailSection, { color: '#9D00FF' }]}>DOBRAS POLLOCK 7 (mm)</Text>
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
                                <Text style={[styles.detailSection, { color: '#9D00FF', marginTop: 25 }]}>PERIMETRIA (cm)</Text>
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
                                    {renderMeasureCard('COXA DIR.', assessment.thighs)}
                                    {renderMeasureCard('COXA ESQ.', assessment.thighLeft)}
                                    {renderMeasureCard('PANTU. DIR.', assessment.calves)}
                                    {renderMeasureCard('PANTU. ESQ.', assessment.calfLeft)}
                                </View>
                            </>
                        ) : (
                            (assessment.waist || assessment.abdomen) && (
                                <>
                                    <Text style={[styles.detailSection, { color: '#9D00FF' }]}>MEDIDAS BÁSICAS (cm)</Text>
                                    { assessment.waist && <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Cintura:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{assessment.waist} cm</Text></View> }
                                    { assessment.abdomen && <View style={[styles.detailRow, { borderBottomColor: theme.border }]}><Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Abdômen:</Text><Text style={[styles.detailValue, { color: theme.text }]}>{assessment.abdomen} cm</Text></View> }
                                </>
                            )
                        )}

                        {hasPhotos && (
                            <>
                                <Text style={[styles.detailSection, { color: '#4DE38F', marginTop: 20 }]}>REGISTRO FOTOGRÁFICO</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 15 }}>
                                    {assessment.photos[0] && assessment.photos[0] !== '' && (
                                        <View style={[styles.photoBox, { borderColor: theme.border }]}>
                                            <Image source={{ uri: assessment.photos[0] }} style={styles.photoImg} resizeMode="cover" />
                                            <View style={styles.photoBadge}><Text style={styles.photoBadgeText}>FRENTE</Text></View>
                                        </View>
                                    )}
                                    {assessment.photos[1] && assessment.photos[1] !== '' && (
                                        <View style={[styles.photoBox, { borderColor: theme.border }]}>
                                            <Image source={{ uri: assessment.photos[1] }} style={styles.photoImg} resizeMode="cover" />
                                            <View style={styles.photoBadge}><Text style={styles.photoBadgeText}>LADO</Text></View>
                                        </View>
                                    )}
                                    {assessment.photos[2] && assessment.photos[2] !== '' && (
                                        <View style={[styles.photoBox, { borderColor: theme.border }]}>
                                            <Image source={{ uri: assessment.photos[2] }} style={styles.photoImg} resizeMode="cover" />
                                            <View style={styles.photoBadge}><Text style={styles.photoBadgeText}>COSTAS</Text></View>
                                        </View>
                                    )}
                                </ScrollView>
                            </>
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
    detailsTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    
    // Novo estilo do botão de PDF
    pdfButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderWidth: 1, borderRadius: 12, paddingVertical: 15, marginBottom: 25, gap: 10 },
    pdfButtonText: { color: '#4DE38F', fontWeight: '900', fontSize: 13, letterSpacing: 1 },

    // 🔥 NOVO: estilo do botão de diagnóstico por IA 🔥
    aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderWidth: 1, borderRadius: 12, paddingVertical: 15, marginBottom: 8, gap: 10 },
    aiButtonText: { color: '#9D00FF', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    aiGeneratedNote: { fontSize: 10, marginBottom: 25, lineHeight: 14 },

    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 8 },
    detailLabel: { fontWeight: 'bold', fontSize: 13 },
    detailValue: { fontWeight: '900', fontSize: 15 },
    resultBox: { flexDirection: 'row', borderRadius: 16, padding: 20, justifyContent: 'space-around', marginVertical: 20 },
    resultLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
    resultValue: { fontSize: 22, fontWeight: '900' },
    detailSection: { fontWeight: '900', fontSize: 13, marginTop: 15, marginBottom: 15, letterSpacing: 0.5 },
    foldsCardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    foldCard: { width: '31%', paddingVertical: 15, paddingHorizontal: 5, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 15 },
    foldCardTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
    foldCardValue: { fontSize: 16, fontWeight: '900' },
    measuresCardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    measureCard: { width: '48%', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 15 },
    photoBox: { width: 120, height: 160, borderRadius: 12, overflow: 'hidden', borderWidth: 1, position: 'relative' },
    photoImg: { width: '100%', height: '100%' },
    photoBadge: { position: 'absolute', bottom: 8, alignSelf: 'center', backgroundColor: '#4DE38F', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
    photoBadgeText: { fontSize: 9, fontWeight: '900', color: '#000', letterSpacing: 0.5 }
});