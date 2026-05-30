// src/components/AssessmentFormModal.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, SafeAreaView, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AssessmentFormModal({
    visible, onClose, editingId, customDate, handleDateChange, method, setMethod,
    weight, setWeight, currentAge, setCurrentAge, currentGender, setCurrentGender,
    folds, setFolds, measures, setMeasures, onSave, theme, isWeb, webOuterBg
}) {
    const [pollockTab, setPollockTab] = useState('DOBRAS'); 
    
    const { width: windowWidth } = Dimensions.get('window');
    const isWebPC = isWeb && windowWidth > 768;
    const containerMaxWidth = isWebPC ? 960 : '100%';
    const containerBorders = isWebPC ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {};

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: isWebPC ? webOuterBg : theme.bg }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalFull}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={{ flex: 1, width: '100%', maxWidth: containerMaxWidth, alignSelf: 'center', backgroundColor: theme.bg, ...containerBorders }}>
                            
                            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>{editingId ? "EDITAR AVALIAÇÃO" : "NOVA AVALIAÇÃO"}</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView 
                                style={[styles.scrollArea, isWeb && { overflowY: 'auto' }]} 
                                contentContainerStyle={{padding: 24, paddingBottom: 100}} 
                                showsVerticalScrollIndicator={false}
                                bounces={false} 
                                overScrollMode="never"
                            >
                                <Text style={[styles.label, { color: theme.textSecondary }]}>DATA (Opcional - Para Backdate)</Text>
                                <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={customDate} onChangeText={handleDateChange} placeholder="DD/MM/AAAA (Deixe vazio para Hoje)" placeholderTextColor={theme.textSecondary} maxLength={10} outlineStyle="none" />
                                
                                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 25 }]}>MÉTODO DA AVALIAÇÃO</Text>
                                <View style={[styles.switchRow, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                                    <TouchableOpacity 
                                        style={[styles.switchBtn, method === 'BASICO' && { backgroundColor: theme.accent }]} 
                                        onPress={() => setMethod('BASICO')}
                                    >
                                        <Text style={[styles.switchText, { color: method === 'BASICO' ? '#000' : theme.textSecondary, textAlign: 'center' }]}>BÁSICO</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.switchBtn, method === 'POLLOCK' && { backgroundColor: theme.accent }]} 
                                        onPress={() => setMethod('POLLOCK')}
                                    >
                                        {/* 🔥 CORREÇÃO DO VAZAMENTO NO MOBILE 🔥 */}
                                        <Text style={[styles.switchText, { color: method === 'POLLOCK' ? '#000' : theme.textSecondary, textAlign: 'center' }]}>POLLOCK E{'\n'}PERIMETRIA</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <Text style={[styles.label, { color: theme.textSecondary }]}>PESO (KG) <Text style={{color: '#FF3B30'}}>*Obrigatório</Text></Text>
                                <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder="Ex: 80.5" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                                
                                {method === 'POLLOCK' ? (
                                    <>
                                    <View style={styles.configRow}>
                                        <View style={{flex:1}}>
                                            <Text style={[styles.label, { color: theme.textSecondary }]}>IDADE</Text>
                                            <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={currentAge} onChangeText={setCurrentAge} placeholder="Anos" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                                        </View>
                                        <View style={{flex:1, marginLeft:15}}>
                                            <Text style={[styles.label, { color: theme.textSecondary }]}>SEXO</Text>
                                            <TouchableOpacity style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: 'center' }]} onPress={() => setCurrentGender(currentGender==='MASCULINO'?'FEMININO':'MASCULINO')}>
                                                <Text style={{color: theme.text, fontWeight: 'bold'}}>{currentGender}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    
                                    <View style={[styles.innerTabsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <TouchableOpacity 
                                            style={[styles.innerTabBtn, pollockTab === 'DOBRAS' && { backgroundColor: theme.accent }]} 
                                            onPress={() => setPollockTab('DOBRAS')}
                                        >
                                            <Text style={[styles.innerTabText, { color: pollockTab === 'DOBRAS' ? '#000' : theme.textSecondary }]}>DOBRAS (mm)</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.innerTabBtn, pollockTab === 'PERIMETRIA' && { backgroundColor: theme.accent }]} 
                                            onPress={() => setPollockTab('PERIMETRIA')}
                                        >
                                            <Text style={[styles.innerTabText, { color: pollockTab === 'PERIMETRIA' ? '#000' : theme.textSecondary }]}>PERIMETRIA (cm)</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {pollockTab === 'DOBRAS' ? (
                                        <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={styles.grid}>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PEITORAL</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldChest} onChangeText={t=>setFolds({...folds, foldChest:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>AXILAR</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldAxillary} onChangeText={t=>setFolds({...folds, foldAxillary:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>TRÍCEPS</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldTriceps} onChangeText={t=>setFolds({...folds, foldTriceps:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>SUBESCAP.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldSubscapular} onChangeText={t=>setFolds({...folds, foldSubscapular:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ABDOMINAL</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldAbdominal} onChangeText={t=>setFolds({...folds, foldAbdominal:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>SUPRA-IL.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldSuprailiac} onChangeText={t=>setFolds({...folds, foldSuprailiac:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>COXA</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={folds.foldThigh} onChangeText={t=>setFolds({...folds, foldThigh:t})} outlineStyle="none"/></View>
                                            </View>
                                            <Text style={[styles.hint, { color: theme.textSecondary }]}>O app usará a soma das dobras e a idade para calcular o % de Gordura.</Text>
                                        </View>
                                    ) : (
                                        <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <Text style={[styles.hint, { color: theme.textSecondary, marginBottom: 20, marginTop: 0 }]}>Preencha apenas os campos desejados. Campos vazios não aparecerão no laudo de avaliação.</Text>
                                            
                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>TÓRAX</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.chestMeasure} onChangeText={t=>setMeasures({...measures, chestMeasure:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>OMBROS</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.shoulders} onChangeText={t=>setMeasures({...measures, shoulders:t})} outlineStyle="none"/></View>
                                            </View>

                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>CINTURA</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.waist} onChangeText={t=>setMeasures({...measures, waist:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ABDÔMEN</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.abdomen} onChangeText={t=>setMeasures({...measures, abdomen:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>GLÚTEOS</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.hips} onChangeText={t=>setMeasures({...measures, hips:t})} outlineStyle="none"/></View>
                                            </View>

                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>BRAÇO DIR.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.armRight} onChangeText={t=>setMeasures({...measures, armRight:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>BRAÇO ESQ.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.armLeft} onChangeText={t=>setMeasures({...measures, armLeft:t})} outlineStyle="none"/></View>
                                            </View>

                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ANTEB. DIR.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.forearmRight} onChangeText={t=>setMeasures({...measures, forearmRight:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ANTEB. ESQ.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.forearmLeft} onChangeText={t=>setMeasures({...measures, forearmLeft:t})} outlineStyle="none"/></View>
                                            </View>

                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PERNA DIR.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.legRight} onChangeText={t=>setMeasures({...measures, legRight:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PERNA ESQ.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.legLeft} onChangeText={t=>setMeasures({...measures, legLeft:t})} outlineStyle="none"/></View>
                                            </View>

                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 5}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PANTU. DIR.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.calfRight} onChangeText={t=>setMeasures({...measures, calfRight:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PANTU. ESQ.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.calfLeft} onChangeText={t=>setMeasures({...measures, calfLeft:t})} outlineStyle="none"/></View>
                                            </View>
                                        </View>
                                    )}
                                    </>
                                ) : (
                                    <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <Text style={[styles.label, { color: theme.textSecondary, marginTop: 0 }]}>CINTURA (CM) - Opcional</Text>
                                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginBottom: 15 }]} keyboardType="decimal-pad" value={measures.waist} onChangeText={t=>setMeasures({...measures, waist:t})} outlineStyle="none" />
                                        
                                        <Text style={[styles.label, { color: theme.textSecondary }]}>ABDÔMEN (CM) - Opcional</Text>
                                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={measures.abdomen} onChangeText={t=>setMeasures({...measures, abdomen:t})} outlineStyle="none" />
                                    </View>
                                )}
                                
                                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={onSave}>
                                    <MaterialCommunityIcons name="content-save-outline" size={24} color="#000" />
                                    <Text style={[styles.saveBtnText, { color: '#000' }]}>{editingId ? "ATUALIZAR AVALIAÇÃO" : "SALVAR AVALIAÇÃO"}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalFull: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, marginTop: Platform.OS === 'android' ? 20 : 0 },
    modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    closeBtn: { padding: 4 },
    scrollArea: { flex: 1, width: '100%' },
    
    label: { fontSize: 11, fontWeight: '800', marginBottom: 8, marginTop: 20, letterSpacing: 1 },
    input: { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 16, fontWeight: '600' }, 
    
    switchRow: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 10 },
    switchBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    switchText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
    
    configRow: { flexDirection:'row', marginBottom: 5, marginTop: 10 },
    
    innerTabsContainer: { flexDirection: 'row', marginTop: 30, marginBottom: 15, borderRadius: 16, padding: 4, borderWidth: 1 },
    innerTabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    innerTabText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    
    cardContainer: { padding: 20, borderRadius: 20, borderWidth: 1 },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '31%', marginBottom: 10 },
    miniLabel: { fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
    miniInput: { padding: 14, borderRadius: 12, borderWidth: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }, 
    
    hint: { fontSize: 12, fontStyle: 'italic', marginTop: 20, textAlign: 'center', lineHeight: 18 },
    
    saveBtn: { flexDirection: 'row', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 35, elevation: 4 },
    saveBtnText: { fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});