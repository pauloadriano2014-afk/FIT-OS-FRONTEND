// src/modals/CompareReportModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { generateAutoFeedback } from '../utils/feedbackGenerator';

export default function CompareReportModal({ visible, onClose, selectedData, onGeneratePDF, theme, isAdmin = false }) {
    const [feedbackText, setFeedbackText] = useState('');

    useEffect(() => {
        if (visible && selectedData && selectedData.length >= 2) {
            const sorted = [...selectedData].sort((a, b) => new Date(a.date) - new Date(b.date));
            const autoFeedback = generateAutoFeedback(sorted);
            setFeedbackText(autoFeedback);
        }
    }, [visible, selectedData]);

    if (!visible || !selectedData || selectedData.length < 2) return null;

    const sortedData = [...selectedData].sort((a, b) => new Date(a.date) - new Date(b.date));

    const getVal = (ass, key) => {
        if (key === 'leanMass') return ass.weight && ass.bodyFat ? (ass.weight * (1 - ass.bodyFat/100)).toFixed(1) : null;
        if (key === 'foldSum') return ass.foldChest ? (ass.foldChest + ass.foldAxillary + ass.foldTriceps + ass.foldSubscapular + ass.foldAbdominal + ass.foldSuprailiac + ass.foldThigh).toFixed(1) : null;
        return ass[key];
    };

    const renderCompareRow = (label, key, isInvertedLogic = false, isPercentage = false) => {
        const hasAnyData = sortedData.some(ass => getVal(ass, key) != null);
        if (!hasAnyData) return null;

        const oldestVal = parseFloat(getVal(sortedData[0], key));
        const newestVal = parseFloat(getVal(sortedData[sortedData.length - 1], key));
        let deltaStr = '-';
        let deltaColor = theme.textSecondary;
        let iconName = 'minus';

        if (!isNaN(oldestVal) && !isNaN(newestVal) && sortedData.length > 1) {
            const diff = (newestVal - oldestVal).toFixed(1);
            if (diff > 0) {
                deltaStr = `+${diff}`;
                deltaColor = isInvertedLogic ? '#4DE38F' : '#FF3B30'; 
                iconName = 'arrow-up';
            } else if (diff < 0) {
                deltaStr = `${diff}`;
                deltaColor = isInvertedLogic ? '#FF3B30' : '#4DE38F'; 
                iconName = 'arrow-down';
            }
        }

        return (
            <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 12, alignItems: 'center'}}>
                <Text style={{flex: 2, color: theme.text, fontSize: 11, fontWeight: 'bold'}}>{label}</Text>
                {sortedData.map((ass, i) => (
                    <Text key={i} style={{flex: 1.5, color: theme.textSecondary, fontSize: 12, textAlign: 'center', fontWeight: '600'}}>
                        {getVal(ass, key) != null ? `${getVal(ass, key)}${isPercentage ? '%' : ''}` : '-'}
                    </Text>
                ))}
                <View style={{flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2}}>
                    {deltaStr !== '-' && <MaterialCommunityIcons name={iconName} size={12} color={deltaColor} />}
                    <Text style={{color: deltaColor, fontSize: 12, fontWeight: '900'}}>{deltaStr}</Text>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.detailsOverlay}>
                <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border, width: '100%', maxWidth: 500, paddingHorizontal: 15 }]}>
                    
                    <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.detailsTitle, { color: '#4DE38F' }]}>RELATÓRIO DE PROGRESSO</Text>
                        <View style={{flexDirection: 'row', gap: 15, alignItems: 'center'}}>
                            <TouchableOpacity onPress={() => onGeneratePDF(feedbackText)}>
                                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#4DE38F" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never" contentContainerStyle={{ paddingBottom: 20 }}>
                        
                        <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10, marginBottom: 5}}>
                            <Text style={{flex: 2, color: theme.textSecondary, fontSize: 10, fontWeight: 'bold'}}></Text>
                            {sortedData.map((ass, i) => (
                                <Text key={i} style={{flex: 1.5, color: theme.textSecondary, fontSize: 10, fontWeight: '900', textAlign: 'center'}}>
                                    {new Date(ass.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}
                                </Text>
                            ))}
                            <Text style={{flex: 1.5, color: theme.textSecondary, fontSize: 10, fontWeight: '900', textAlign: 'center'}}>EVOLUÇÃO</Text>
                        </View>

                        {renderCompareRow('PESO', 'weight')}
                        {renderCompareRow('GORDURA BF', 'bodyFat', false, true)}
                        {renderCompareRow('MASSA MAGRA', 'leanMass', true)}
                        
                        <Text style={[styles.detailSection, { color: '#4DE38F', marginTop: 25 }]}>DOBRAS (mm)</Text>
                        {renderCompareRow('SOMA (7)', 'foldSum')}
                        {renderCompareRow('Peitoral', 'foldChest')}
                        {renderCompareRow('Axilar', 'foldAxillary')}
                        {renderCompareRow('Tríceps', 'foldTriceps')}
                        {renderCompareRow('Subescapular', 'foldSubscapular')}
                        {renderCompareRow('Abdominal', 'foldAbdominal')}
                        {renderCompareRow('Supra-ilíaca', 'foldSuprailiac')}
                        {renderCompareRow('Coxa', 'foldThigh')}

                        {/* 🔥 VARIÁVEIS CORRIGIDAS DE ACORDO COM O PRISMA 🔥 */}
                        <Text style={[styles.detailSection, { color: '#4DE38F', marginTop: 25 }]}>PERIMETRIA (cm)</Text>
                        {renderCompareRow('Tórax', 'chest')}
                        {renderCompareRow('Ombros', 'shoulders')}
                        {renderCompareRow('Cintura', 'waist')}
                        {renderCompareRow('Abdômen', 'abdomen')}
                        {renderCompareRow('Glúteos', 'hips')}
                        {renderCompareRow('Braço Dir.', 'arms')}
                        {renderCompareRow('Braço Esq.', 'armLeft')}
                        {renderCompareRow('Antebraço Dir.', 'forearms')}
                        {renderCompareRow('Antebraço Esq.', 'forearmLeft')}
                        {renderCompareRow('Coxa Dir.', 'thighs')}
                        {renderCompareRow('Coxa Esq.', 'thighLeft')}
                        {renderCompareRow('Pant. Dir.', 'calves')}
                        {renderCompareRow('Pant. Esq.', 'calfLeft')}

                        <Text style={[styles.detailSection, { color: '#4DE38F', marginTop: 30 }]}>PARECER TÉCNICO</Text>
                        
                        {isAdmin ? (
                            <TextInput
                                style={[styles.feedbackInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                multiline
                                value={feedbackText}
                                onChangeText={setFeedbackText}
                                placeholder="O laudo automático será gerado aqui..."
                                placeholderTextColor={theme.textSecondary}
                            />
                        ) : (
                            <View style={[styles.feedbackInput, { backgroundColor: theme.bg, borderColor: theme.border, justifyContent: 'center' }]}>
                                <Text style={{ color: theme.text, fontSize: 13, lineHeight: 20, fontWeight: '500' }}>
                                    {feedbackText || "Relatório não disponível."}
                                </Text>
                            </View>
                        )}

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    detailsCard: { borderRadius: 24, padding: 25, maxHeight: '85%', borderWidth: 1, width: '100%', maxWidth: 500, alignSelf: 'center' },
    detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 15 },
    detailsTitle: { fontSize: 16, fontWeight: '900' },
    detailSection: { fontWeight: 'bold', fontSize: 13, marginTop: 15, marginBottom: 15, letterSpacing: 0.5 },
    feedbackInput: { minHeight: 120, borderRadius: 16, borderWidth: 1, padding: 15, fontSize: 13, lineHeight: 20, textAlignVertical: 'top' }
});