// src/components/MontarTreino/Modals/TecnicaModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function TecnicaModal({
    visible, onClose, theme,
    modalTitle, options,
    onSelectOption, getCurrentTechnique,
    listaTecnicas = [],
}) {
    const isCardio = modalTitle === 'Intensidade';

    // 1. Garante que as suas opções antigas NUNCA sumam
    const opcoesAntigas = Array.isArray(options) ? options : [];

    // 2. Transforma as técnicas do laboratório no formato do botão
    const opcoesLaboratorio = listaTecnicas.map(t => ({
        id: t.id,
        title: `🧪 ${t.name}`, // Ícone para você saber que é a sua técnica inteligente
        isCustomId: true
    }));

    // 3. Junta tudo (se for cardio, mantém só as de intensidade)
    const listaParaRenderizar = isCardio 
        ? opcoesAntigas 
        : [...opcoesAntigas, ...opcoesLaboratorio];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={S.overlay}>
                <View style={[S.box, { backgroundColor: theme.surface }]}>
                    <Text style={[S.title, { color: theme.text }]}>{modalTitle}</Text>
                    
                    <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                        {listaParaRenderizar.map((t, index) => (
                            <TouchableOpacity
                                key={t.id || `fallback_${index}`}
                                style={[S.option, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                                onPress={() => onSelectOption(t.id, t.isCustomId)}
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
                    </ScrollView>

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