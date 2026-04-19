// src/components/Training/FinishWorkoutModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function FinishWorkoutModal({ visible, onClose, theme, RPE_OPTIONS, rpe, setRpe, feedbackText, setFeedbackText, submitFinish, isWeb }) {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.contentCard, { backgroundColor: theme.surface, borderColor: theme.border, maxWidth: isWeb ? 440 : '100%' }]}>
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                        <Text style={[styles.title, { color: theme.text }]}>FIM DE TREINO</Text>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>INTENSIDADE (RPE)</Text>
                        
                        <View style={{marginBottom: 20}}>
                            {RPE_OPTIONS.map((opt) => (
                                <TouchableOpacity key={opt.val} style={[styles.rpeOption, { backgroundColor: theme.bg, borderColor: theme.border }, rpe === opt.val && { borderColor: opt.color, backgroundColor: `${opt.color}1A` }]} onPress={() => setRpe(opt.val)}>
                                    <View style={[styles.rpeCheckbox, { borderColor: theme.border, backgroundColor: rpe === opt.val ? opt.color : theme.bg }]}>
                                        {rpe === opt.val && <MaterialCommunityIcons name="check" size={14} color="#000" />}
                                    </View>
                                    <View style={{flex:1}}>
                                        <Text style={[styles.rpeLabel, { color: rpe === opt.val ? opt.color : theme.text }]}>{opt.label}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{opt.desc}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { color: theme.textSecondary }]}>OBSERVAÇÕES (OPCIONAL)</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} multiline placeholder="Anotações..." placeholderTextColor={theme.textSecondary} value={feedbackText} onChangeText={setFeedbackText} />
                        
                        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.accent }]} onPress={submitFinish}>
                            <Text style={[styles.submitBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR E FINALIZAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>CANCELAR (VOLTAR)</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20, zIndex: 1000 },
    contentCard: { width: '100%', alignSelf: 'center', padding: 25, borderRadius: 25, borderWidth: 1, maxHeight: '80%' },
    title: { fontSize: 16, fontWeight: '900', marginBottom: 5, letterSpacing: 1 },
    label: { fontSize: 10, fontWeight:'bold', marginBottom:10, marginTop:10 },
    rpeOption: { flexDirection: 'row', alignItems:'center', padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1 },
    rpeCheckbox: { width: 20, height: 20, borderRadius: 10, marginRight: 15, justifyContent:'center', alignItems:'center', borderWidth:1 },
    rpeLabel: { fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
    input: { padding: 15, borderRadius: 10, height: 80, textAlignVertical: 'top', borderWidth: 1 },
    submitBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    submitBtnText: { fontWeight: '900', fontSize: 14 },
    cancelBtn: { marginTop:15, marginBottom:20 },
    cancelBtnText: { textAlign:'center', fontWeight:'bold' }
});