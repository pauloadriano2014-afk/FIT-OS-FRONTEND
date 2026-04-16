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
    return (
        <>
            <Modal visible={timeModalVisible} transparent animationType="fade" onRequestClose={() => setTimeModalVisible(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setTimeModalVisible(false)}>
                    <View style={[styles.listModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={[styles.listModalHandle, { backgroundColor: theme.border }]} />
                        <Text style={[styles.listModalTitle, { color: theme.text }]}>HORÁRIO</Text>
                        <FlatList data={TIME_OPTIONS} keyExtractor={i => i} showsVerticalScrollIndicator={false} renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.listOption, { borderBottomColor: theme.border }]} onPress={() => handleSelectTime(item)}>
                                <Text style={{ color: theme.text, fontSize: 15, textAlign: 'center' }}>{item}</Text>
                            </TouchableOpacity>
                        )} />
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={nameModalVisible} transparent animationType="fade" onRequestClose={() => setNameModalVisible(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setNameModalVisible(false)}>
                    <View style={[styles.listModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={[styles.listModalHandle, { backgroundColor: theme.border }]} />
                        <Text style={[styles.listModalTitle, { color: theme.text }]}>TIPO DE REFEIÇÃO</Text>
                        <FlatList data={MEAL_NAME_OPTIONS} keyExtractor={i => i} showsVerticalScrollIndicator={false} renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.listOption, { borderBottomColor: theme.border }]} onPress={() => handleSelectName(item)}>
                                <Text style={{ color: item === 'Personalizado' ? theme.accent : theme.text, fontSize: 15, textAlign: 'center', fontWeight: item === 'Personalizado' ? '800' : 'normal' }}>{item}</Text>
                            </TouchableOpacity>
                        )} />
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={customNameModalVisible} transparent animationType="fade" onRequestClose={() => setCustomNameModalVisible(false)}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center', padding: 20 }}>
                        <View style={[styles.customBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.listModalTitle, { color: theme.text, marginBottom: 16 }]}>NOME PERSONALIZADO</Text>
                            <TextInput style={[styles.customInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={customNameInput} onChangeText={setCustomNameInput} placeholder="Ex: Pós-Treino Líquido" placeholderTextColor={theme.textSecondary} autoFocus />
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                                <TouchableOpacity style={[styles.customBtn, { borderColor: theme.border }]} onPress={() => setCustomNameModalVisible(false)}><Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancelar</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.customBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={handleSaveCustomName}><Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '800' }}>Salvar</Text></TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    listModal: { width: '100%', maxWidth: 360, maxHeight: '65%', borderRadius: 20, borderWidth: 1, paddingVertical: 16 },
    listModalHandle: { width: 36, height: 3, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
    listModalTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center', marginBottom: 8 },
    listOption: { paddingVertical: 14, borderBottomWidth: 1 },
    customBox: { width: '100%', maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 20 },
    customInput: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    customBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' }
});