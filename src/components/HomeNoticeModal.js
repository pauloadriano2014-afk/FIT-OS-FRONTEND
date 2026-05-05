// src/components/HomeNoticeModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeNoticeModal({ visible, onClose, theme, activeNotice }) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.chatModalOverlay}>
                <View style={[styles.noticeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    {/* CABEÇALHO FIXO */}
                    <View style={[styles.noticeHeader, { backgroundColor: theme.accent }]}>
                        <MaterialCommunityIcons name="bullhorn" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                        <Text style={[styles.noticeTitle, { color: theme.isDark ? '#000' : '#FFF' }]}>MENSAGEM DO SEU COACH</Text>
                    </View>
                    
                    {/* 🔥 O SEGREDO: SCROLLVIEW COM FLEX SHRINK 🔥 */}
                    <ScrollView 
                        style={styles.scrollArea} 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                        bounces={false}
                    >
                        <Text style={[styles.noticeSubject, { color: theme.text }]}>{activeNotice?.title}</Text>
                        <Text style={[styles.noticeBody, { color: theme.textSecondary }]}>{activeNotice?.content}</Text>
                    </ScrollView>

                    {/* BOTÃO FIXO NO RODAPÉ */}
                    <View style={styles.footerArea}>
                        <TouchableOpacity style={[styles.noticeBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={onClose}>
                            <Text style={[styles.noticeBtnText, { color: theme.text }]}>VALEU, COACH! 👊</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    chatModalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    noticeCard: { 
        width: '85%', 
        maxWidth: 400, 
        maxHeight: '80%', // 🔥 Impede que o card vaze da tela
        borderRadius: 24, 
        overflow: 'hidden', 
        borderWidth: 1 
    },
    noticeHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 15, 
        gap: 10 
    },
    scrollArea: { 
        flexShrink: 1 // 🔥 Faz o ScrollView encolher e ativar a rolagem se faltar espaço
    },
    scrollContent: {
        padding: 25,
        paddingBottom: 10
    },
    noticeSubject: { 
        fontSize: 20, 
        fontWeight: '900', 
        marginBottom: 15, 
        textAlign: 'center' 
    },
    noticeBody: { 
        fontSize: 14, 
        lineHeight: 22, 
        textAlign: 'center' 
    },
    footerArea: {
        paddingHorizontal: 25,
        paddingBottom: 25,
        paddingTop: 15
    },
    noticeBtn: { 
        padding: 15, 
        borderRadius: 12, 
        borderWidth: 1, 
        alignItems: 'center' 
    },
    noticeBtnText: { 
        fontWeight: '900', 
        fontSize: 14, 
        letterSpacing: 1 
    },
});