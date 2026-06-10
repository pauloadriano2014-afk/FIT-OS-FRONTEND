// src/components/MontarTreino/Modals/TecnicaModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

export default function TecnicaModal({
    visible, onClose, theme,
    modalTitle, options,
    onSelectOption, getCurrentTechnique,
}) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={S.overlay}>
                <View style={[S.box, { backgroundColor: theme.surface }]}>
                    <Text style={[S.title, { color: theme.text }]}>{modalTitle}</Text>
                    {options.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            style={[S.option, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                            onPress={() => onSelectOption(t.id)}
                        >
                            <Text style={[
                                S.optionText,
                                { color: theme.text },
                                getCurrentTechnique() === t.id && { color: theme.accent, fontWeight: '900' }
                            ]}>
                                {t.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={[S.cancelBtn, { marginTop: 10 }]} onPress={onClose}>
                        <Text style={[S.cancelText, { color: theme.textSecondary }]}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const S = StyleSheet.create({
    overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    box:        { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignSelf: 'center' },
    title:      { fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
    option:     { paddingVertical: 14, borderBottomWidth: 1 },
    optionText: { fontWeight: '600', textAlign: 'center', fontSize: 14 },
    cancelBtn:  { padding: 12, alignItems: 'center' },
    cancelText: { fontWeight: '600' },
});
