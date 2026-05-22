// src/components/AdminFinance/FinanceAddModal.js

import React, { createElement } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { CATEGORIAS_OFFLINE } from '../../utils/financeUtils';

export default function FinanceAddModal({ 
    theme, isWebPC, isAddModalVisible, setIsAddModalVisible, 
    newName, setNewName, newCategory, setNewCategory, 
    newPhone, setNewPhone, newDuration, setNewDuration, 
    newValue, setNewValue, newStartDate, setNewStartDate, 
    newDueDate, setNewDueDate, uploadingPhoto, newPhotoUrl, 
    handlePickImage, handleSaveNewOfflineClient, isSavingNew 
}) {

    const renderWebSelect = (value, onChange, options) => (
        <View style={styles.webSelectWrapper(theme)}>
            <select value={value} onChange={onChange} style={styles.webSelectInput(theme)}>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} style={styles.webSelectIcon} />
        </View>
    );

    return (
        <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
            <View style={styles.modalBackdrop}>
                <ScrollView contentContainerStyle={{ paddingVertical: 40, alignItems: 'center' }} showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
                    <View style={[styles.addModalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                        <View style={styles.modernModalHeader(theme)}>
                            <Text style={[styles.modalTitle, {color: theme.text}]}>Cadastrar Aluno Offline</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}><MaterialCommunityIcons name="close" size={26} color={theme.textSecondary} /></TouchableOpacity>
                        </View>

                        <View style={{ gap: 20 }}>
                            <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>NOME COMPLETO</Text><TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="Ex: Abner Kristopher" placeholderTextColor={theme.textSecondary} value={newName} onChangeText={setNewName} /></View>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>CATEGORIA NO FINANCEIRO</Text>{Platform.OS === 'web' ? renderWebSelect(newCategory, (e) => setNewCategory(e.target.value), CATEGORIAS_OFFLINE.map(c => ({ value: c, label: c }))) : <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}><Picker selectedValue={newCategory} onValueChange={setNewCategory} style={{ color: theme.text }} dropdownIconColor={theme.accent}>{CATEGORIAS_OFFLINE.map(c => <Picker.Item key={c} label={c} value={c} />)}</Picker></View>}</View>
                            </View>

                            <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>TELEFONE</Text><TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="41 9999-9999" placeholderTextColor={theme.textSecondary} value={newPhone} onChangeText={setNewPhone} keyboardType="numeric" /></View>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>DURAÇÃO DO CONTRATO</Text>{Platform.OS === 'web' ? renderWebSelect(newDuration, (e) => setNewDuration(e.target.value), [ { value: 'Mensal', label: 'Mensal' }, { value: 'Trimestral', label: 'Trimestral' }, { value: 'Semestral', label: 'Semestral' }, { value: 'Anual', label: 'Anual' } ]) : <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}><Picker selectedValue={newDuration} onValueChange={setNewDuration} style={{ color: theme.text }} dropdownIconColor={theme.accent}><Picker.Item label="Mensal" value="Mensal" /><Picker.Item label="Trimestral" value="Trimestral" /><Picker.Item label="Semestral" value="Semestral" /><Picker.Item label="Anual" value="Anual" /></Picker></View>}</View>
                            </View>

                            <View><Text style={styles.inputLabel}>VALOR TOTAL (R$)</Text><TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 149,90" placeholderTextColor={theme.textSecondary} value={newValue} onChangeText={setNewValue} keyboardType="numeric" /></View>

                            <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>DATA INÍCIO</Text>{Platform.OS === 'web' ? createElement('input', { type: 'date', value: newStartDate, onChange: (e) => setNewStartDate(e.target.value), style: { ...styles.webDate(theme), flex: 1 } }) : <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="AAAA-MM-DD" value={newStartDate} onChangeText={setNewStartDate} />}</View>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>VENCIMENTO</Text>{Platform.OS === 'web' ? createElement('input', { type: 'date', value: newDueDate, onChange: (e) => setNewDueDate(e.target.value), style: { ...styles.webDate(theme), flex: 1 } }) : <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="AAAA-MM-DD" value={newDueDate} onChangeText={setNewDueDate} />}</View>
                            </View>

                            <View style={{ marginTop: 10 }}>
                                <Text style={[styles.inputLabel, { fontStyle: 'italic', color: theme.textSecondary }]}>MÍDIA / FOTO DE PERFIL</Text>
                                <View style={[styles.mediaBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                    {uploadingPhoto ? <ActivityIndicator color={theme.accent} size="small" /> : newPhotoUrl ? <View style={styles.mediaPreviewAvatar}>{Platform.OS === 'web' ? <img src={newPhotoUrl} onError={(e) => { e.target.onerror = null; e.target.src = ''; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : <Image source={{ uri: newPhotoUrl }} onError={(e) => { e.target.onerror = null; e.target.src = ''; }} style={{ width: '100%', height: '100%' }} />}</View> : <View style={styles.mediaPlaceholder}><MaterialCommunityIcons name="account-circle" size={32} color={theme.textSecondary} /></View>}
                                    <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#1C1C1E' }]} onPress={handlePickImage}>
                                        <MaterialCommunityIcons name="upload" size={16} color="#FFF" />
                                        <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5}}>SELECIONAR DA GALERIA</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: theme.accent, marginTop: 10, flexDirection: 'row', gap: 8, height: 54 }]} onPress={handleSaveNewOfflineClient} disabled={isSavingNew}>
                                {isSavingNew ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <><MaterialCommunityIcons name="content-save" size={20} color={theme.isDark ? '#000' : '#FFF'} /><Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5}}>SALVAR DADOS CADASTRAIS</Text></>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Platform.OS === 'web' ? 20 : 10 },
    addModalContent: { width: '100%', maxWidth: 800, alignSelf: 'center', borderRadius: 24, padding: Platform.OS === 'web' ? 30 : 20, borderWidth: 1 },
    modernModalHeader: (theme) => ({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 15 }),
    modalTitle: { fontWeight: '900', fontSize: 18, letterSpacing: -0.5 },
    inputLabel: { color: '#888', fontSize: 10, fontWeight: '900', marginBottom: 6, letterSpacing: 1 },
    inputLarge: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, fontWeight: 'bold' },
    pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    webSelectWrapper: (theme) => ({ position: 'relative', width: '100%', borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }),
    webSelectInput: (theme) => ({ width: '100%', padding: '12px 35px 12px 12px', backgroundColor: 'transparent', color: theme.text, border: 'none', outline: 'none', fontWeight: 'bold', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '13px', appearance: 'none', '-webkit-appearance': 'none', '-moz-appearance': 'none', cursor: 'pointer' }),
    webSelectIcon: { position: 'absolute', right: 10, top: '50%', marginTop: -10, pointerEvents: 'none' },
    webDate: (theme) => ({ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.surface, color: theme.text, outline: 'none', fontSize: '14px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 'bold', boxSizing: 'border-box', flex: 1 }),
    saveBtnLg: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    mediaBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', gap: 15 },
    mediaPreviewAvatar: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden' },
    mediaPlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, elevation: 2 },
});