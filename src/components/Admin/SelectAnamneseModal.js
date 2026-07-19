// src/components/Admin/SelectAnamneseModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SelectAnamneseModal({ visible, onClose, onSelect, theme }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={styles.header}>
                        <View style={[styles.iconBox, { backgroundColor: theme.accent + '22' }]}>
                            <MaterialCommunityIcons name="clipboard-text-search-outline" size={24} color={theme.accent} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.title, { color: theme.text }]}>Solicitar Anamnese</Text>
                            <Text style={[styles.desc, { color: theme.textSecondary }]}>
                                Qual formulário você deseja enviar para o aluno?
                            </Text>
                        </View>
                    </View>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity 
                            style={[styles.btn, { borderColor: theme.border, backgroundColor: theme.bg }]}
                            onPress={() => onSelect('TRAINING')}
                        >
                            <MaterialCommunityIcons name="weight-lifter" size={24} color={theme.text} />
                            <View style={styles.btnTextContainer}>
                                <Text style={[styles.btnTitle, { color: theme.text }]}>Apenas Treino</Text>
                                <Text style={[styles.btnDesc, { color: theme.textSecondary }]}>Formulário focado em exercícios e rotina física.</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.btn, { borderColor: theme.border, backgroundColor: theme.bg }]}
                            onPress={() => onSelect('FULL')}
                        >
                            <MaterialCommunityIcons name="food-apple" size={24} color="#4DE38F" />
                            <View style={styles.btnTextContainer}>
                                <Text style={[styles.btnTitle, { color: theme.text }]}>Treino + Dieta (Completo)</Text>
                                <Text style={[styles.btnDesc, { color: theme.textSecondary }]}>Formulário completo com hábitos alimentares.</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>CANCELAR</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: { width: '100%', maxWidth: 400, borderRadius: 20, padding: 20, borderWidth: 1 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    desc: { fontSize: 12, marginTop: 2 },
    optionsContainer: { gap: 12 },
    btn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
    btnTextContainer: { flex: 1, marginLeft: 12 },
    btnTitle: { fontSize: 14, fontWeight: 'bold' },
    btnDesc: { fontSize: 11, marginTop: 2 },
    cancelBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 10 },
    cancelBtnText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }
});