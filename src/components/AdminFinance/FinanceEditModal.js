// src/components/AdminFinance/FinanceEditModal.js

import React, { createElement } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Switch, ActivityIndicator, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { CATEGORIAS_OFFLINE, calcularProximaData, forceMiddayUTC } from '../../utils/financeUtils';

export default function FinanceEditModal({ 
    theme, isWebPC, editingAluno, closeEditModal, 
    isFinanceActiveEdit, setIsFinanceActiveEdit, 
    financeCategoryEdit, setFinanceCategoryEdit, 
    contractType, setContractType, 
    contractValue, setContractValue, 
    startDateEdit, setStartDateEdit, 
    paymentDueDate, setPaymentDueDate, 
    isUploadingEditPhoto, editPhotoUrl, handlePickEditImage, 
    handleSaveModalContract, isSavingContract, handleReverterPagamento 
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
        <Modal visible={!!editingAluno} transparent animationType="fade" onRequestClose={closeEditModal}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeEditModal}>
                <TouchableOpacity activeOpacity={1} style={[styles.modernModalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                    <View style={styles.modernModalHeader(theme)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={[styles.iconBox, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="pencil-lock" size={18} color={theme.accent} /></View>
                            <View>
                                <Text style={[styles.modalTitle, {color: theme.text}]}>Atualizar Dados</Text>
                                <Text style={{color: theme.textSecondary, fontSize: 11}}>ID: {editingAluno?.id}</Text>
                                <Text style={{color: theme.textSecondary, fontSize: 11}}>{editingAluno?.name}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={closeEditModal} style={styles.closeButton}><MaterialCommunityIcons name="close" size={26} color={theme.textSecondary} /></TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        <View style={{ gap: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: isFinanceActiveEdit ? theme.accent : theme.border, backgroundColor: isFinanceActiveEdit ? theme.accent + '15' : theme.surface }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: isFinanceActiveEdit ? theme.text : '#FF3B30', fontWeight: 'bold', fontSize: 13 }}>
                                        {isFinanceActiveEdit ? "Aluno Ativo no Financeiro" : "Aluno Inativo no Financeiro"}
                                    </Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>
                                        {isFinanceActiveEdit ? "Os valores pendentes entrarão na previsão do mês." : "O valor deste aluno foi congelado e não entrará mais na previsão."}
                                    </Text>
                                </View>
                                <Switch value={isFinanceActiveEdit} onValueChange={setIsFinanceActiveEdit} trackColor={{ false: theme.border, true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : '#FFF'} />
                            </View>

                            <View style={styles.formRow(isWebPC)}>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>CATEGORIA NO FINANCEIRO</Text>
                                    {Platform.OS === 'web' ? renderWebSelect(financeCategoryEdit, (e) => setFinanceCategoryEdit(e.target.value), CATEGORIAS_OFFLINE.map(c => ({ value: c, label: c }))) : (
                                        <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                            <Picker selectedValue={financeCategoryEdit} onValueChange={setFinanceCategoryEdit} style={{ color: theme.text }} dropdownIconColor={theme.accent}>
                                                {CATEGORIAS_OFFLINE.map(c => <Picker.Item key={c} label={c} value={c} />)}
                                            </Picker>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>DURAÇÃO (TIPO DE PLANO)</Text>
                                    {Platform.OS === 'web' ? renderWebSelect(contractType, (e) => setContractType(e.target.value), [ { value: 'Mensal', label: 'Mensal' }, { value: 'Trimestral', label: 'Trimestral' }, { value: 'Semestral', label: 'Semestral' }, { value: 'Anual', label: 'Anual' }, { value: 'Projeto 90 Dias', label: 'Projeto 90 Dias' }, { value: 'Ficha 8 Semanas', label: 'Ficha 8 Semanas' } ]) : (
                                        <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                            <Picker selectedValue={contractType} onValueChange={setContractType} style={{ color: theme.text }} dropdownIconColor={theme.accent}><Picker.Item label="Mensal" value="Mensal" /><Picker.Item label="Trimestral" value="Trimestral" /><Picker.Item label="Semestral" value="Semestral" /><Picker.Item label="Anual" value="Anual" /><Picker.Item label="Projeto 90 Dias" value="Projeto 90 Dias" /><Picker.Item label="Ficha 8 Semanas" value="Ficha 8 Semanas" /></Picker>
                                        </View>
                                    )}
                                </View>

                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>VALOR (R$)</Text>
                                    <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.accent, borderColor: theme.border, textAlign: 'center' }]} placeholder="0.00" placeholderTextColor={theme.textSecondary} value={contractValue} onChangeText={setContractValue} keyboardType="numeric" />
                                </View>
                            </View>

                            <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>DATA DE INÍCIO</Text>
                                    {Platform.OS === 'web' ? createElement('input', { type: 'date', value: startDateEdit, onChange: (e) => setStartDateEdit(e.target.value), style: { ...styles.webDate(theme), flex: 1 } }) : (
                                        <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="AAAA-MM-DD" value={startDateEdit} onChangeText={setStartDateEdit} />
                                    )}
                                </View>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>PRÓXIMO VENCIMENTO</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        {Platform.OS === 'web' ? createElement('input', { type: 'date', value: paymentDueDate, onChange: (e) => setPaymentDueDate(e.target.value), style: { ...styles.webDate(theme), flex: 1 } }) : (
                                            <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, flex: 1 }]} placeholder="AAAA-MM-DD" value={paymentDueDate} onChangeText={setPaymentDueDate} />
                                        )}
                                        <TouchableOpacity style={[styles.modernBtn, { backgroundColor: '#34C759' }]} onPress={() => setPaymentDueDate(calcularProximaData(paymentDueDate ? forceMiddayUTC(paymentDueDate) : new Date().toISOString(), contractType).split('T')[0])}>
                                            <MaterialCommunityIcons name="cash-plus" size={16} color="#FFF" />
                                            <Text style={styles.modernBtnText}>💰 RENOVOU</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {editingAluno?.isOffline && (
                                <View style={{ marginTop: 10 }}>
                                    <Text style={[styles.inputLabel, { fontStyle: 'italic', color: theme.textSecondary }]}>MÍDIA / FOTO DE PERFIL (OFFLINE)</Text>
                                    <View style={[styles.mediaBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                        {isUploadingEditPhoto ? <ActivityIndicator color={theme.accent} size="small" /> : editPhotoUrl ? <View style={styles.mediaPreviewAvatar}>{Platform.OS === 'web' ? <img src={editPhotoUrl} onError={(e) => { e.target.onerror = null; e.target.src = ''; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : <Image source={{ uri: editPhotoUrl }} onError={(e) => { e.target.onerror = null; e.target.src = ''; }} style={{ width: '100%', height: '100%' }} />}</View> : <View style={styles.mediaPlaceholder}><MaterialCommunityIcons name="account-circle" size={32} color={theme.textSecondary} /></View>}
                                        <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#1C1C1E' }]} onPress={handlePickEditImage}>
                                            <MaterialCommunityIcons name="upload" size={16} color="#FFF" />
                                            <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5}}>ALTERAR FOTO</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: theme.accent, marginTop: 15, flexDirection: 'row', gap: 8, height: 54 }]} onPress={handleSaveModalContract} disabled={isSavingContract}>
                                {isSavingContract ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : (
                                    <><MaterialCommunityIcons name="content-save" size={20} color={theme.isDark ? '#000' : '#FFF'} /><Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5}}>SALVAR E FECHAR</Text></>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: 'transparent', borderColor: '#FF3B30', borderWidth: 1, marginTop: 10, flexDirection: 'row', gap: 8, height: 54 }]} onPress={handleReverterPagamento} disabled={isSavingContract}>
                                <MaterialCommunityIcons name="undo-variant" size={20} color="#FF3B30" />
                                <Text style={{color: '#FF3B30', fontWeight: '900', fontSize: 13, letterSpacing: 0.5}}>REVERTER PAGAMENTO</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Platform.OS === 'web' ? 20 : 10 },
    modernModalContent: { width: '100%', maxWidth: 650, borderRadius: 24, padding: Platform.OS === 'web' ? 30 : 20, borderWidth: 1, elevation: 10 },
    modernModalHeader: (theme) => ({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 15 }),
    modalTitle: { fontWeight: '900', fontSize: 18, letterSpacing: -0.5 },
    iconBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    inputLabel: { color: '#888', fontSize: 10, fontWeight: '900', marginBottom: 6, letterSpacing: 1 },
    inputLarge: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, fontWeight: 'bold' },
    pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    formRow: (isDesktop) => ({ flexDirection: isDesktop ? 'row' : 'column', gap: 15 }),
    webSelectWrapper: (theme) => ({ position: 'relative', width: '100%', borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }),
    webSelectInput: (theme) => ({ width: '100%', padding: '12px 35px 12px 12px', backgroundColor: 'transparent', color: theme.text, border: 'none', outline: 'none', fontWeight: 'bold', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '13px', appearance: 'none', '-webkit-appearance': 'none', '-moz-appearance': 'none', cursor: 'pointer' }),
    webSelectIcon: { position: 'absolute', right: 10, top: '50%', marginTop: -10, pointerEvents: 'none' },
    webDate: (theme) => ({ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.surface, color: theme.text, outline: 'none', fontSize: '14px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 'bold', boxSizing: 'border-box', flex: 1 }),
    modernBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, height: 48, borderRadius: 12, elevation: 3 },
    modernBtnText: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    saveBtnLg: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    mediaBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', gap: 15 },
    mediaPreviewAvatar: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden' },
    mediaPlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, elevation: 2 },
});