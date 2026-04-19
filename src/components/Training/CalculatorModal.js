// src/components/Training/CalculatorModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CalculatorModal({ visible, onClose, theme, calcWeight, setCalcWeight, calcReps, setCalcReps, oneRM, isWeb }) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.contentCard, { backgroundColor: theme.surface, borderColor: theme.border, maxWidth: isWeb ? 440 : '100%' }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>ESTIMATIVA DE CARGA (1RM)</Text>
                        <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={24} color={theme.text}/></TouchableOpacity>
                    </View>
                    <Text style={[styles.desc, { color: theme.textSecondary }]}>Insira um peso e repetições que você já fez para descobrir a carga ideal.</Text>
                    
                    <View style={styles.row}>
                        <View style={{flex:1}}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>CARGA JÁ FEITA (KG)</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={calcWeight} onChangeText={setCalcWeight} placeholder="Ex: 50" placeholderTextColor={theme.textSecondary}/>
                        </View>
                        <View style={{flex:1}}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>REPS FEITAS</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={calcReps} onChangeText={setCalcReps} placeholder="Ex: 10" placeholderTextColor={theme.textSecondary}/>
                        </View>
                    </View>

                    {oneRM > 0 && 
                        <View style={[styles.resultBox, { backgroundColor: theme.bg, borderColor: theme.accent }]}>
                            <Text style={[styles.resultTitle, { color: theme.text }]}>{oneRM} KG <Text style={{fontSize:12, color: theme.textSecondary}}>MÁXIMO TEÓRICO</Text></Text>
                            <View style={{width:'100%', gap:12, marginTop:10}}>
                                <View style={styles.resultRow}><Text style={{ color: theme.textSecondary, fontSize:12 }}>Para Hipertrofia (8-12 reps)</Text><Text style={{ color: theme.accent, fontSize: 14, fontWeight: 'bold' }}>{Math.round(oneRM*0.75)} kg</Text></View>
                                <View style={styles.resultRow}><Text style={{ color: theme.textSecondary, fontSize:12 }}>Para Força (1-5 reps)</Text><Text style={{ color: theme.accent, fontSize: 14, fontWeight: 'bold' }}>{Math.round(oneRM*0.90)} kg</Text></View>
                            </View>
                        </View>
                    }
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20, zIndex: 1000 },
    contentCard: { width: '100%', alignSelf: 'center', padding: 25, borderRadius: 25, borderWidth: 1, maxHeight: '80%' },
    header: { flexDirection:'row', justifyContent:'space-between', marginBottom:15, alignItems:'center' },
    title: { fontSize: 16, fontWeight: '900', marginBottom: 5, letterSpacing: 1 },
    desc: { marginBottom:20, fontSize:13 },
    row: { flexDirection:'row', gap:15, marginBottom:20 },
    label: { fontSize:10, fontWeight:'bold', marginBottom:8 },
    input: { fontSize: 16, fontWeight: 'bold', padding: 15, borderRadius: 10, borderWidth: 1, textAlign: 'center', outlineStyle: 'none' },
    resultBox: { padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1 },
    resultTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' }
});