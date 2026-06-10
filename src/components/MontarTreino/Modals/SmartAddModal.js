// src/components/MontarTreino/Modals/SmartAddModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SmartAddModal({
    visible, theme,
    smartSubstitutesList,
    onConfirm, onSearchLibrary, onClose,
}) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={S.overlay}>
                <View style={[S.box, { backgroundColor: theme.surface }]}>
                    <Text style={[S.title, { color: theme.text, marginBottom: 5 }]}>Adição Inteligente</Text>
                    <Text style={[S.subtitle, { color: theme.textSecondary }]}>
                        Você já mapeou substitutos oficiais para este exercício.
                    </Text>

                    <View style={{ gap: 8, marginBottom: 20 }}>
                        {smartSubstitutesList?.map((sub, idx) => (
                            <TouchableOpacity
                                key={sub.id || idx}
                                style={[S.subRow, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}
                                onPress={() => onConfirm(sub)}
                            >
                                <View style={[S.subIcon, { backgroundColor: theme.accent + '20' }]}>
                                    <MaterialCommunityIcons name="lightning-bolt" size={16} color={theme.accent} />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                                    {sub.name || sub.title}
                                </Text>
                                <MaterialCommunityIcons name="plus-circle" size={22} color={theme.accent} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[S.searchBtn, { borderColor: theme.border }]} onPress={onSearchLibrary}>
                        <MaterialCommunityIcons name="magnify" size={16} color={theme.textSecondary} />
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Buscar outro na Biblioteca</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={S.cancelBtn} onPress={onClose}>
                        <Text style={[S.cancelText, { color: theme.textSecondary }]}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const S = StyleSheet.create({
    overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    box:       { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignSelf: 'center' },
    title:     { fontSize: 17, fontWeight: '900', textAlign: 'center' },
    subtitle:  { color: '#888', textAlign: 'center', marginBottom: 20, fontSize: 13, lineHeight: 18 },
    subRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
    subIcon:   { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    searchBtn: { backgroundColor: 'transparent', borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    cancelBtn: { padding: 12, alignItems: 'center', marginTop: 10 },
    cancelText:{ fontWeight: '600' },
});
