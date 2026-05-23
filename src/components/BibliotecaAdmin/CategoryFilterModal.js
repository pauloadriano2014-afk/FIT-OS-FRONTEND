import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { categories } from '../../data/bibliotecaData';

export default function CategoryFilterModal({ visible, onClose, selectedCat, onSelect, theme }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
                <View style={[styles.catModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>FILTRAR CATEGORIA</Text>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {categories.map(cat => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[styles.catOption, selectedCat === cat && { backgroundColor: theme.accent + '22' }]}
                                onPress={() => { onSelect(cat); onClose(); }}
                            >
                                <Text style={[styles.catOptionText, { color: theme.text }, selectedCat === cat && { color: theme.accent, fontWeight: '800' }]}>
                                    {cat}
                                </Text>
                                {selectedCat === cat && <MaterialCommunityIcons name="check-decagram" size={20} color={theme.accent} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    catModalContent: { width: '100%', maxWidth: 360, borderRadius: 24, padding: 20, borderWidth: 1, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
    catOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12 },
    catOptionText: { fontSize: 16, fontWeight: '600' }
});