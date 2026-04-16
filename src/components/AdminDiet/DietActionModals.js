// src/components/AdminDiet/DietActionModals.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DietActionModals({ 
    theme, isWeb,
    // Props para Clonar de Aluno
    modalCloneVisible, setModalCloneVisible, studentsList, handleCloneFromStudent,
    // Props para Templates de Dieta
    modalTemplatesVisible, setModalTemplatesVisible, templatesList, handleApplyTemplate,
    // Props para Salvar Template Dieta
    modalSaveTemplateVisible, setModalSaveTemplateVisible, handleSaveAsTemplate,
    // Props para Ações de Refeição
    modalMealOptionsVisible, setModalMealOptionsVisible, 
    modalSaveMealVisible, setModalSaveMealVisible, handleSaveMealTemplate,
    modalImportMealVisible, setModalImportMealVisible, mealTemplatesList, handleApplyMealTemplate
}) {
    const [searchStudent, setSearchStudent] = useState('');
    const [templateNameInput, setTemplateNameInput] = useState('');
    const [mealTemplateNameInput, setMealTemplateNameInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const filteredStudents = (studentsList || []).filter(s => 
        s.name.toLowerCase().includes(searchStudent.toLowerCase())
    );

    const onSaveTemplate = async () => {
        if (!templateNameInput.trim()) return;
        setIsProcessing(true);
        await handleSaveAsTemplate(templateNameInput);
        setIsProcessing(false);
        setTemplateNameInput('');
        setModalSaveTemplateVisible(false);
    };

    const onSaveMealTemplate = async () => {
        if (!mealTemplateNameInput.trim()) return;
        setIsProcessing(true);
        await handleSaveMealTemplate(mealTemplateNameInput);
        setIsProcessing(false);
        setMealTemplateNameInput('');
        setModalSaveMealVisible(false);
    };

    return (
        <>
            {/* ── DIETA: CLONAR DE ALUNO ── */}
            <Modal visible={modalCloneVisible} transparent animationType="fade" onRequestClose={() => setModalCloneVisible(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.header}>
                            <MaterialCommunityIcons name="account-switch-outline" size={24} color={theme.accent} />
                            <Text style={[styles.title, { color: theme.text }]}>CLONAR DE ALUNO</Text>
                            <TouchableOpacity onPress={() => setModalCloneVisible(false)} style={styles.closeBtn}>
                                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TextInput style={[styles.searchInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Buscar aluno..." placeholderTextColor={theme.textSecondary} value={searchStudent} onChangeText={setSearchStudent} />
                        <FlatList data={filteredStudents} keyExtractor={item => item.id} style={{ maxHeight: 300 }} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listItem, { borderBottomColor: theme.border }]} onPress={() => { handleCloneFromStudent(item.id); setModalCloneVisible(false); }}>
                                    <MaterialCommunityIcons name="account-circle" size={30} color={theme.textSecondary} />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.name}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="content-copy" size={18} color={theme.accent} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum aluno encontrado.</Text>}
                        />
                    </View>
                </View>
            </Modal>

            {/* ── DIETA: APLICAR TEMPLATE ── */}
            <Modal visible={modalTemplatesVisible} transparent animationType="fade" onRequestClose={() => setModalTemplatesVisible(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.header}>
                            <MaterialCommunityIcons name="folder-star-outline" size={24} color={theme.accent} />
                            <Text style={[styles.title, { color: theme.text }]}>MEUS TEMPLATES</Text>
                            <TouchableOpacity onPress={() => setModalTemplatesVisible(false)} style={styles.closeBtn}>
                                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList data={templatesList || []} keyExtractor={item => item.id} style={{ maxHeight: 300 }} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listItem, { borderBottomColor: theme.border }]} onPress={() => { handleApplyTemplate(item); setModalTemplatesVisible(false); }}>
                                    <MaterialCommunityIcons name="food-apple" size={24} color={theme.accent} />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.name}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{item.totalKcal ? `${Math.round(item.totalKcal)} kcal` : 'Macros variados'}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="download" size={18} color={theme.accent} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum template salvo ainda.</Text>}
                        />
                    </View>
                </View>
            </Modal>

            {/* ── DIETA: SALVAR TEMPLATE ── */}
            <Modal visible={modalSaveTemplateVisible} transparent animationType="fade" onRequestClose={() => setModalSaveTemplateVisible(false)}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center' }}>
                        <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.title, { color: theme.text, textAlign: 'center', marginBottom: 20 }]}>SALVAR MODELO DE DIETA</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 5, fontWeight: 'bold' }}>NOME DO TEMPLATE</Text>
                            <TextInput style={[styles.searchInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginBottom: 20 }]} placeholder="Ex: Hipertrofia 3000kcal" placeholderTextColor={theme.textSecondary} value={templateNameInput} onChangeText={setTemplateNameInput} autoFocus />
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity style={[styles.btn, { borderColor: theme.border }]} onPress={() => setModalSaveTemplateVisible(false)}><Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Cancelar</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={onSaveTemplate} disabled={isProcessing}>
                                    {isProcessing ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: 'bold' }}>Guardar Dieta</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* 🔥 REFEIÇÃO: MENU DE OPÇÕES (3 Pontinhos) 🔥 */}
            <Modal visible={modalMealOptionsVisible} transparent animationType="fade" onRequestClose={() => setModalMealOptionsVisible(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setModalMealOptionsVisible(false)}>
                    <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border, padding: 0, overflow: 'hidden' }]}>
                        <View style={[styles.header, { padding: 20, marginBottom: 0, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                            <Text style={[styles.title, { color: theme.text }]}>AÇÕES DA REFEIÇÃO</Text>
                        </View>
                        <TouchableOpacity style={[styles.actionOptionRow, { borderBottomColor: theme.border }]} onPress={() => { setModalMealOptionsVisible(false); setTimeout(() => setModalImportMealVisible(true), 300); }}>
                            <MaterialCommunityIcons name="folder-download-outline" size={22} color={theme.text} />
                            <Text style={[styles.actionOptionText, { color: theme.text }]}>Substituir por um Modelo Guardado</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionOptionRow} onPress={() => { setModalMealOptionsVisible(false); setTimeout(() => setModalSaveMealVisible(true), 300); }}>
                            <MaterialCommunityIcons name="content-save-outline" size={22} color={theme.accent} />
                            <Text style={[styles.actionOptionText, { color: theme.accent }]}>Guardar como Novo Modelo</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 🔥 REFEIÇÃO: SALVAR MODELO 🔥 */}
            <Modal visible={modalSaveMealVisible} transparent animationType="fade" onRequestClose={() => setModalSaveMealVisible(false)}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center' }}>
                        <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.title, { color: theme.text, textAlign: 'center', marginBottom: 20 }]}>GUARDAR REFEIÇÃO</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 5, fontWeight: 'bold' }}>NOME DO MODELO</Text>
                            <TextInput style={[styles.searchInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginBottom: 20 }]} placeholder="Ex: Pré-Treino Monstro" placeholderTextColor={theme.textSecondary} value={mealTemplateNameInput} onChangeText={setMealTemplateNameInput} autoFocus />
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity style={[styles.btn, { borderColor: theme.border }]} onPress={() => setModalSaveMealVisible(false)}><Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Cancelar</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={onSaveMealTemplate} disabled={isProcessing}>
                                    {isProcessing ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: 'bold' }}>Guardar</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* 🔥 REFEIÇÃO: IMPORTAR MODELO 🔥 */}
            <Modal visible={modalImportMealVisible} transparent animationType="fade" onRequestClose={() => setModalImportMealVisible(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.header}>
                            <MaterialCommunityIcons name="food-fork-drink" size={24} color={theme.accent} />
                            <Text style={[styles.title, { color: theme.text }]}>MODELOS DE REFEIÇÃO</Text>
                            <TouchableOpacity onPress={() => setModalImportMealVisible(false)} style={styles.closeBtn}>
                                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList data={mealTemplatesList || []} keyExtractor={item => item.id} style={{ maxHeight: 300 }} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listItem, { borderBottomColor: theme.border }]} onPress={() => { handleApplyMealTemplate(item); setModalImportMealVisible(false); }}>
                                    <MaterialCommunityIcons name="food-variant" size={24} color={theme.accent} />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.name}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Categoria: {item.category}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="download" size={18} color={theme.accent} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum modelo de refeição guardado.</Text>}
                        />
                    </View>
                </View>
            </Modal>

        </>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalBox: { width: '100%', maxWidth: 400, borderRadius: 20, padding: 20, borderWidth: 1 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    title: { fontSize: 16, fontWeight: '900', letterSpacing: 1, flex: 1 },
    closeBtn: { padding: 5 },
    searchInput: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, marginBottom: 15, outlineStyle: 'none' },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    emptyText: { textAlign: 'center', padding: 20, fontStyle: 'italic', fontSize: 12 },
    btn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    actionOptionRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, gap: 15 },
    actionOptionText: { fontSize: 14, fontWeight: '700' }
});