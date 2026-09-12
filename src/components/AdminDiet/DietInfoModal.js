// src/components/AdminDiet/DietInfoModal.js
// Modal genérica de explicação pro coach, reaproveitada em vários pontos da
// montagem de dieta (TMB/TDEE, déficit/superávit, ajuste fino, modelo de IA
// + Raio-X). Mesmo estilo visual (cabeçalho de ícone colorido + texto com
// headers em CAIXA-ALTA:) usado na TechGuideModal.js dos treinos.
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DIET_GUIDE_TOPICS } from './coachDietGuideData';

const HEADER_REGEX = /^[A-ZÀ-Ü0-9][A-ZÀ-Ü0-9\s\.\/\-]{1,50}:$/;

function renderBody(text, textColor) {
    if (!text) return null;
    const clean = text.replace(/\n{3,}/g, '\n\n');
    return clean.split('\n').map((p, idx) => {
        if (p.trim() === '') return <View key={idx} style={{ height: 10 }} />;
        const isHeader = HEADER_REGEX.test(p.trim());
        return (
            <Text key={idx} style={[styles.desc, { color: textColor }, isHeader && styles.descHeader]}>{p}</Text>
        );
    });
}

export default function DietInfoModal({ visible, onClose, theme, topicKey }) {
    const topic = topicKey ? DIET_GUIDE_TOPICS[topicKey] : null;
    if (!topic) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View style={[styles.iconBox, { backgroundColor: topic.color + '20' }]}>
                                <MaterialCommunityIcons name={topic.icon} size={22} color={topic.color} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>{topic.title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ padding: 5 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                        {renderBody(topic.description, theme.text)}
                    </ScrollView>

                    <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.accent }]} onPress={onClose}>
                        <Text style={styles.closeBtnText}>ENTENDI</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: { width: '100%', maxWidth: 440, borderRadius: 24, borderWidth: 1, padding: 20 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 14, fontWeight: '900', flex: 1, letterSpacing: 0.3 },
    desc: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
    descHeader: { fontWeight: '900', letterSpacing: 0.5 },
    closeBtn: { marginTop: 14, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    closeBtnText: { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
});
