// src/components/AdminDiet/DietModalsAdmin.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
});

const MEAL_NAME_OPTIONS = [
    'Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde',
    'Pré-Treino', 'Pós-Treino', 'Jantar', 'Ceia', 'Personalizado'
];

export default function DietModalsAdmin({ 
    theme, timeModalVisible, setTimeModalVisible, handleSelectTime,
    nameModalVisible, setNameModalVisible, handleSelectName,
    customNameModalVisible, setCustomNameModalVisible, customNameInput, setCustomNameInput, handleSaveCustomName 
}) {
    const softBg = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    const dividerColor = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    return (
        <>
            <Modal visible={timeModalVisible} transparent animationType="fade" onRequestClose={() => setTimeModalVisible(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setTimeModalVisible(false)}>
                    <View style={[styles.listModal, { backgroundColor: theme.surface }]}>
                        <View style={[styles.listModalHandle, { backgroundColor: softBg }]} />
                        <Text style={[styles.listModalTitle, { color: theme.textSecondary }]}>SELECIONE O HORÁRIO</Text>
                        <FlatList data={TIME_OPTIONS} keyExtractor={i => i} showsVerticalScrollIndicator={false} renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.listOption, { borderBottomColor: dividerColor }]} onPress={() => handleSelectTime(item)}>
                                <Text style={{ color: theme.text, fontSize: 16, textAlign: 'center', fontWeight: '600' }}>{item}</Text>
                            </TouchableOpacity>
                        )} />
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={nameModalVisible} transparent animationType="fade" onRequestClose={() => setNameModalVisible(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setNameModalVisible(false)}>
                    <View style={[styles.listModal, { backgroundColor: theme.surface }]}>
                        <View style={[styles.listModalHandle, { backgroundColor: softBg }]} />
                        <Text style={[styles.listModalTitle, { color: theme.textSecondary }]}>TIPO DE REFEIÇÃO</Text>
                        <FlatList data={MEAL_NAME_OPTIONS} keyExtractor={i => i} showsVerticalScrollIndicator={false} renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.listOption, { borderBottomColor: dividerColor }]} onPress={() => handleSelectName(item)}>
                                <Text style={{ color: item === 'Personalizado' ? theme.accent : theme.text, fontSize: 16, textAlign: 'center', fontWeight: item === 'Personalizado' ? '900' : '600' }}>{item}</Text>
                            </TouchableOpacity>
                        )} />
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={customNameModalVisible} transparent animationType="fade" onRequestClose={() => setCustomNameModalVisible(false)}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center', padding: 20 }}>
                        <View style={[styles.customBox, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.listModalTitle, { color: theme.text, marginBottom: 20, fontSize: 14, color: theme.text }]}>NOME PERSONALIZADO</Text>
                            <TextInput style={[styles.customInput, { backgroundColor: softBg, color: theme.text }]} value={customNameInput} onChangeText={setCustomNameInput} placeholder="Ex: Pós-Treino Líquido" placeholderTextColor={theme.textSecondary} autoFocus />
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                                <TouchableOpacity style={[styles.customBtn, { backgroundColor: softBg }]} onPress={() => setCustomNameModalVisible(false)}><Text style={{ color: theme.textSecondary, fontWeight: '800' }}>Cancelar</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.customBtn, { backgroundColor: theme.accent }]} onPress={handleSaveCustomName}><Text style={{ color: '#000', fontWeight: '900' }}>Salvar</Text></TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    listModal: { width: '100%', maxWidth: 380, maxHeight: '70%', borderRadius: 28, paddingVertical: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
    listModalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    listModalTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center', marginBottom: 12 },
    listOption: { paddingVertical: 16, borderBottomWidth: 1 },
    customBox: { width: '100%', maxWidth: 380, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
    customInput: { padding: 16, borderRadius: 16, fontSize: 15, outlineStyle: 'none' },
    customBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' }
});