// src/components/Training/CycleInfoModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CycleInfoModal({ visible, onClose, theme }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <View style={[styles.iconWrap, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="book-open-page-variant" size={20} color={theme.accent} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>MANUAL DO TREINO</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 20 }}>
                        
                        <View style={styles.infoBlock}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6}}>
                                <MaterialCommunityIcons name="calendar-sync" size={18} color={theme.accent} />
                                <Text style={[styles.blockTitle, { color: theme.text }]}>A Ordem da Semana</Text>
                            </View>
                            <Text style={[styles.blockDesc, { color: theme.textSecondary }]}>
                                O seu treino está periodizado em uma ordem lógica para respeitar o tempo de recuperação dos músculos. Siga a sequência proposta na pastinha.
                            </Text>
                        </View>

                        <View style={styles.infoBlock}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6}}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF9500" />
                                <Text style={[styles.blockTitle, { color: theme.text }]}>Faltou no Treino?</Text>
                            </View>
                            <Text style={[styles.blockDesc, { color: theme.textSecondary }]}>
                                Se você não conseguiu treinar na Segunda-feira, não pule o treino! Comece na Terça fazendo o treino de Segunda. Se a semana bagunçar demais, chame o Coach no suporte para reajustar a rotina.
                            </Text>
                        </View>

                        <View style={styles.infoBlock}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6}}>
                                <MaterialCommunityIcons name="refresh" size={18} color="#32ADE6" />
                                <Text style={[styles.blockTitle, { color: theme.text }]}>Reiniciar o Ciclo</Text>
                            </View>
                            <Text style={[styles.blockDesc, { color: theme.textSecondary }]}>
                                O botão de "Atualizar" na sua pastinha de treinos serve para limpar os checks (✅) da semana atual. Clique nele apenas no Domingo à noite ou Segunda de manhã para iniciar uma nova semana de combates.
                            </Text>
                        </View>

                        <View style={styles.infoBlock}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6}}>
                                <MaterialCommunityIcons name="brain" size={18} color="#AF52DE" />
                                <Text style={[styles.blockTitle, { color: theme.text }]}>Dúvidas na Técnica?</Text>
                            </View>
                            <Text style={[styles.blockDesc, { color: theme.textSecondary }]}>
                                Dentro da tela de treino, se algum exercício tiver uma técnica avançada (Rest-Pause, Drop-Set, etc.), basta clicar no nome da técnica que um manual aparecerá explicando exatamente como executar.
                            </Text>
                        </View>

                    </ScrollView>
                    
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity style={[styles.gotItBtn, { backgroundColor: theme.accent }]} onPress={onClose}>
                            <Text style={[styles.gotItText, { color: theme.isDark ? '#000' : '#FFF' }]}>ENTENDIDO, COACH!</Text>
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
    infoBlock: { backgroundColor: 'rgba(0,0,0,0.02)', padding: 15, borderRadius: 16, borderWidth: Platform.OS==='web'? 1 : 0, borderColor: 'rgba(255,255,255,0.05)' },
    blockTitle: { fontSize: 13, fontWeight: 'bold' },
    blockDesc: { fontSize: 12, lineHeight: 18 },
    footer: { padding: 20, borderTopWidth: 1 },
    gotItBtn: { width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    gotItText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});