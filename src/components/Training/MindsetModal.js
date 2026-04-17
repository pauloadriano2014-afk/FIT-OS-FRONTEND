// src/components/Training/MindsetModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TRAINING_RULES = [
    { icon: "timer-sand", title: "Respeite o Descanso", desc: "Para hipertrofia real, descanse de 60 a 120 segundos. O músculo precisa recuperar energia (ATP) para suportar a próxima série pesada.", color: "#32ADE6" },
    { icon: "trending-up", title: "Progressão de Carga", desc: "Tente sempre superar o último treino. Seja com 1kg a mais ou 1 repetição extra. O seu corpo só muda se for desafiado.", color: "#FF9500" },
    { icon: "turtle", title: "Controle a Descida", desc: "Não solte o peso! Controle a fase excêntrica (descida) por 2 a 3 segundos. É nela que ocorre a maior quebra de fibras musculares.", color: "#AF52DE" },
    { icon: "shield-check", title: "A Regra da Consistência", desc: "Um treino mediano feito o ano todo gera mais resultado que um treino perfeito feito por 1 mês. A consistência vence a intensidade.", color: "#34C759" }
];

export default function MindsetModal({ visible, onClose, theme }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <View style={[styles.iconWrap, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="brain" size={20} color={theme.accent} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>MINDSET & EXECUÇÃO</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 15 }}>
                        {TRAINING_RULES.map((rule, idx) => (
                            <View key={idx} style={[styles.ruleCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8}}>
                                    <View style={[styles.ruleIconBox, { backgroundColor: rule.color + '15', borderColor: rule.color + '40' }]}>
                                        <MaterialCommunityIcons name={rule.icon} size={20} color={rule.color} />
                                    </View>
                                    <Text style={[styles.ruleTitle, { color: theme.text }]}>{rule.title}</Text>
                                </View>
                                <Text style={[styles.ruleDesc, { color: theme.textSecondary }]}>
                                    {rule.desc}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                    
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity style={[styles.gotItBtn, { backgroundColor: theme.accent }]} onPress={onClose}>
                            <Text style={[styles.gotItText, { color: theme.isDark ? '#000' : '#FFF' }]}>VAMOS PRA CIMA!</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalBox: { width: '100%', maxWidth: 440, borderRadius: 24, borderWidth: 1, overflow: 'hidden', maxHeight: '85%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    iconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    closeBtn: { padding: 4 },
    ruleCard: { padding: 15, borderRadius: 16, borderWidth: Platform.OS==='web'? 1 : 0 },
    ruleIconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    ruleTitle: { fontSize: 14, fontWeight: '900' },
    ruleDesc: { fontSize: 12, lineHeight: 18 },
    footer: { padding: 20, borderTopWidth: 1 },
    gotItBtn: { width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    gotItText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});