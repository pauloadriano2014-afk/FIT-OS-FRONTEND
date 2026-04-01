// src/components/AssessmentFormModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, SafeAreaView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AssessmentFormModal({
    visible, onClose, editingId, customDate, handleDateChange, method, setMethod,
    weight, setWeight, currentAge, setCurrentAge, currentGender, setCurrentGender,
    folds, setFolds, measures, setMeasures, onSave, theme, isWeb, webOuterBg
}) {
    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalFull, { width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }]}>
                    <SafeAreaView style={{flex:1}}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingId ? "EDITAR AVALIAÇÃO" : "NOVA AVALIAÇÃO"}</Text>
                            <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={24} color={theme.text} /></TouchableOpacity>
                        </View>
                        
                        <ScrollView 
                            style={[styles.scrollArea, isWeb && { overflowY: 'auto' }]} 
                            contentContainerStyle={{padding: 20}} 
                            showsVerticalScrollIndicator={false}
                            bounces={false} 
                            overScrollMode="never"
                        >
                            <Text style={[styles.label, { color: '#32ADE6' }]}>DATA (Opcional - Para Backdate)</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={customDate} onChangeText={handleDateChange} placeholder="DD/MM/AAAA (Deixe vazio para Hoje)" placeholderTextColor={theme.textSecondary} maxLength={10} outlineStyle="none" />
                            
                            <View style={[styles.switchRow, { backgroundColor: theme.surface }]}>
                                <TouchableOpacity style={[styles.switchBtn, method==='BASICO' && { backgroundColor: '#32ADE6' }]} onPress={()=>setMethod('BASICO')}><Text style={[styles.switchText, method==='BASICO' ? {color: theme.isDark ? '#000' : '#FFF'} : {color: theme.textSecondary}]}>BÁSICO</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.switchBtn, method==='POLLOCK' && { backgroundColor: '#32ADE6' }]} onPress={()=>setMethod('POLLOCK')}><Text style={[styles.switchText, method==='POLLOCK' ? {color: theme.isDark ? '#000' : '#FFF'} : {color: theme.textSecondary}]}>POLLOCK 7</Text></TouchableOpacity>
                            </View>
                            
                            <Text style={[styles.label, { color: '#32ADE6' }]}>PESO (KG)</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder="Ex: 80.5" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                            
                            {method === 'POLLOCK' ? (
                                <>
                                <View style={styles.configRow}>
                                    <View style={{flex:1}}><Text style={[styles.label, { color: '#32ADE6' }]}>IDADE</Text><TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={currentAge} onChangeText={setCurrentAge} placeholder="Anos" placeholderTextColor={theme.textSecondary} outlineStyle="none" /></View>
                                    <View style={{flex:1, marginLeft:10}}><Text style={[styles.label, { color: '#32ADE6' }]}>SEXO</Text><TouchableOpacity style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: 'center' }]} onPress={() => setCurrentGender(currentGender==='MASCULINO'?'FEMININO':'MASCULINO')}><Text style={{color: theme.text}}>{currentGender}</Text></TouchableOpacity></View>
                                </View>
                                <Text style={[styles.sectionHeader, { color: theme.text, borderBottomColor: theme.border }]}>DOBRAS CUTÂNEAS (MM)</Text>
                                <View style={styles.grid}>
                                    <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PEITORAL</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldChest} onChangeText={t=>setFolds({...folds, foldChest:t})} outlineStyle="none"/></View>
                                    <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>AXILAR</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldAxillary} onChangeText={t=>setFolds({...folds, foldAxillary:t})} outlineStyle="none"/></View>
                                    <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>TRÍCEPS</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldTriceps} onChangeText={t=>setFolds({...folds, foldTriceps:t})} outlineStyle="none"/></View>
                                    <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>SUBESCAP.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldSubscapular} onChangeText={t=>setFolds({...folds, foldSubscapular:t})} outlineStyle="none"/></View>
                                    <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ABDOMINAL</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldAbdominal} onChangeText={t=>setFolds({...folds, foldAbdominal:t})} outlineStyle="none"/></View>
                                    <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>SUPRA-IL.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldSuprailiac} onChangeText={t=>setFolds({...folds, foldSuprailiac:t})} outlineStyle="none"/></View>
                                    <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>COXA</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldThigh} onChangeText={t=>setFolds({...folds, foldThigh:t})} outlineStyle="none"/></View>
                                </View>
                                <Text style={[styles.hint, { color: theme.textSecondary }]}>O app usará idade e sexo para calcular o BF.</Text>
                                </>
                            ) : (
                                <>
                                <Text style={[styles.label, { color: '#32ADE6' }]}>CINTURA (CM) - Opcional</Text><TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.waist} onChangeText={t=>setMeasures({...measures, waist:t})} outlineStyle="none" />
                                <Text style={[styles.label, { color: '#32ADE6' }]}>ABDÔMEN (CM) - Opcional</Text><TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.abdomen} onChangeText={t=>setMeasures({...measures, abdomen:t})} outlineStyle="none" />
                                </>
                            )}
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#32ADE6' }]} onPress={onSave}><Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>{editingId ? "ATUALIZAR DADOS" : "SALVAR RESULTADOS"}</Text></TouchableOpacity>
                            <View style={{height: 100}} /> 
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalFull: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, marginTop: Platform.OS === 'android' ? 20 : 0 },
    modalTitle: { fontSize: 18, fontWeight: '900' },
    scrollArea: { flex: 1, width: '100%' },
    switchRow: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
    switchBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    switchText: { fontWeight: 'bold', fontSize: 12 },
    label: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
    input: { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 16 }, 
    configRow: { flexDirection:'row', marginBottom:15, marginTop: 10 },
    sectionHeader: { fontWeight: 'bold', marginTop: 25, marginBottom: 15, borderBottomWidth: 1, paddingBottom: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '31%', marginBottom: 15 },
    miniLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
    miniInput: { padding: 12, borderRadius: 12, borderWidth: 1, textAlign: 'center', fontSize: 16 }, 
    hint: { fontSize: 11, fontStyle: 'italic', marginTop: 15, textAlign: 'center' },
    saveBtn: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 35, marginBottom: 50 },
    saveBtnText: { fontWeight: '900', fontSize: 16 }
});