// src/components/AdminDiet/DietActionModals.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DietActionModals({ 
    theme, isWeb,
    modalCloneVisible, setModalCloneVisible, studentsList, handleCloneFromStudent,
    modalTemplatesVisible, setModalTemplatesVisible, templatesList, handleApplyTemplate,
    modalSaveTemplateVisible, setModalSaveTemplateVisible, handleSaveAsTemplate,
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

    const softBg = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

    return (
        <>
            {/* ── DIETA: CLONAR DE ALUNO ── */}
            <Modal visible={modalCloneVisible} transparent animationType="fade" onRequestClose={() => setModalCloneVisible(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                        <View style={styles.header}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="account-switch-outline" size={24} color={theme.accent} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>CLONAR DE ALUNO</Text>
                            <TouchableOpacity onPress={() => setModalCloneVisible(false)} style={[styles.closeBtn, { backgroundColor: softBg }]}>
                                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TextInput style={[styles.searchInput, { backgroundColor: softBg, color: theme.text }]} placeholder="Buscar aluno..." placeholderTextColor={theme.textSecondary} value={searchStudent} onChangeText={setSearchStudent} />
                        <FlatList data={filteredStudents} keyExtractor={item => item.id} style={{ maxHeight: 300 }} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listItem, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => { handleCloneFromStudent(item.id); setModalCloneVisible(false); }}>
                                    <MaterialCommunityIcons name="account-circle" size={36} color={theme.textSecondary} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                                    </View>
                                    <View style={[styles.actionPill, { backgroundColor: theme.accent + '15' }]}>
                                        <MaterialCommunityIcons name="content-copy" size={16} color={theme.accent} />
                                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>CLONAR</Text>
                                    </View>
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
                    <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                        <View style={styles.header}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="folder-star-outline" size={24} color={theme.accent} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>MEUS TEMPLATES</Text>
                            <TouchableOpacity onPress={() => setModalTemplatesVisible(false)} style={[styles.closeBtn, { backgroundColor: softBg }]}>
                                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList data={templatesList || []} keyExtractor={item => item.id} style={{ maxHeight: 300 }} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listItem, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => { handleApplyTemplate(item); setModalTemplatesVisible(false); }}>
                                    <View style={[styles.iconCircle, { backgroundColor: softBg, width: 40, height: 40 }]}>
                                        <MaterialCommunityIcons name="food-apple" size={20} color={theme.accent} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{item.totalKcal ? `${Math.round(item.totalKcal)} kcal` : 'Macros variados'}</Text>
                                    </View>
                                    <View style={[styles.actionPill, { backgroundColor: theme.accent + '15' }]}>
                                        <MaterialCommunityIcons name="download" size={16} color={theme.accent} />
                                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>USAR</Text>
                                    </View>
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
                        <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '20', alignSelf: 'center', marginBottom: 16, width: 56, height: 56, borderRadius: 28 }]}>
                                <MaterialCommunityIcons name="content-save-all" size={28} color={theme.accent} />
                            </View>
                            <Text style={[styles.title, { color: theme.text, textAlign: 'center', marginBottom: 24 }]}>SALVAR MODELO DE DIETA</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 8, fontWeight: '800', letterSpacing: 0.5 }}>NOME DO TEMPLATE</Text>
                            <TextInput style={[styles.searchInput, { backgroundColor: softBg, color: theme.text, marginBottom: 24 }]} placeholder="Ex: Hipertrofia 3000kcal" placeholderTextColor={theme.textSecondary} value={templateNameInput} onChangeText={setTemplateNameInput} autoFocus />
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: softBg }]} onPress={() => setModalSaveTemplateVisible(false)}><Text style={{ color: theme.textSecondary, fontWeight: '800' }}>Cancelar</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={onSaveTemplate} disabled={isProcessing}>
                                    {isProcessing ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: '900' }}>Guardar Dieta</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* 🔥 REFEIÇÃO: MENU DE OPÇÕES (3 Pontinhos) 🔥 */}
            <Modal visible={modalMealOptionsVisible} transparent animationType="fade" onRequestClose={() => setModalMealOptionsVisible(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setModalMealOptionsVisible(false)}>
                    <View style={[styles.modalBox, { backgroundColor: theme.surface, padding: 0, overflow: 'hidden' }]}>
                        <View style={[styles.header, { padding: 24, marginBottom: 0, borderBottomWidth: 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                            <Text style={[styles.title, { color: theme.text }]}>AÇÕES DA REFEIÇÃO</Text>
                        </View>
                        <TouchableOpacity style={[styles.actionOptionRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => { setModalMealOptionsVisible(false); setTimeout(() => setModalImportMealVisible(true), 300); }}>
                            <View style={[styles.iconCircle, { backgroundColor: softBg, width: 40, height: 40 }]}>
                                <MaterialCommunityIcons name="folder-download-outline" size={20} color={theme.text} />
                            </View>
                            <Text style={[styles.actionOptionText, { color: theme.text }]}>Substituir por um Modelo Guardado</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionOptionRow} onPress={() => { setModalMealOptionsVisible(false); setTimeout(() => setModalSaveMealVisible(true), 300); }}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '20', width: 40, height: 40 }]}>
                                <MaterialCommunityIcons name="content-save-outline" size={20} color={theme.accent} />
                            </View>
                            <Text style={[styles.actionOptionText, { color: theme.accent }]}>Guardar como Novo Modelo</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 🔥 REFEIÇÃO: SALVAR MODELO 🔥 */}
            <Modal visible={modalSaveMealVisible} transparent animationType="fade" onRequestClose={() => setModalSaveMealVisible(false)}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center' }}>
                        <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '20', alignSelf: 'center', marginBottom: 16, width: 56, height: 56, borderRadius: 28 }]}>
                                <MaterialCommunityIcons name="content-save-outline" size={28} color={theme.accent} />
                            </View>
                            <Text style={[styles.title, { color: theme.text, textAlign: 'center', marginBottom: 24 }]}>GUARDAR REFEIÇÃO</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 8, fontWeight: '800', letterSpacing: 0.5 }}>NOME DO MODELO</Text>
                            <TextInput style={[styles.searchInput, { backgroundColor: softBg, color: theme.text, marginBottom: 24 }]} placeholder="Ex: Pré-Treino Monstro" placeholderTextColor={theme.textSecondary} value={mealTemplateNameInput} onChangeText={setMealTemplateNameInput} autoFocus />
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: softBg }]} onPress={() => setModalSaveMealVisible(false)}><Text style={{ color: theme.textSecondary, fontWeight: '800' }}>Cancelar</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={onSaveMealTemplate} disabled={isProcessing}>
                                    {isProcessing ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: '900' }}>Guardar</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* 🔥 REFEIÇÃO: IMPORTAR MODELO 🔥 */}
            <Modal visible={modalImportMealVisible} transparent animationType="fade" onRequestClose={() => setModalImportMealVisible(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                        <View style={styles.header}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="food-fork-drink" size={24} color={theme.accent} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>MODELOS DE REFEIÇÃO</Text>
                            <TouchableOpacity onPress={() => setModalImportMealVisible(false)} style={[styles.closeBtn, { backgroundColor: softBg }]}>
                                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList data={mealTemplatesList || []} keyExtractor={item => item.id} style={{ maxHeight: 300 }} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listItem, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => { handleApplyMealTemplate(item); setModalImportMealVisible(false); }}>
                                    <View style={[styles.iconCircle, { backgroundColor: softBg, width: 40, height: 40 }]}>
                                        <MaterialCommunityIcons name="food-variant" size={20} color={theme.accent} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>Categoria: {item.category}</Text>
                                    </View>
                                    <View style={[styles.actionPill, { backgroundColor: theme.accent + '15' }]}>
                                        <MaterialCommunityIcons name="download" size={16} color={theme.accent} />
                                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>USAR</Text>
                                    </View>
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalBox: { width: '100%', maxWidth: 420, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 15, fontWeight: '900', letterSpacing: 1, flex: 1 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    searchInput: { padding: 16, borderRadius: 16, fontSize: 15, marginBottom: 16, outlineStyle: 'none' },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    actionPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    emptyText: { textAlign: 'center', padding: 24, fontStyle: 'italic', fontSize: 13 },
    btn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    actionOptionRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, gap: 16 },
    actionOptionText: { fontSize: 15, fontWeight: '800' }
});