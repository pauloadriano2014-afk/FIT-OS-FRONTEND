// src/components/Admin/EliteAssistant.js
// Chatbot de suporte para coaches — ELITE Assistant
// Botão flutuante no canto inferior direito do AdminDashboard
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, ActivityIndicator, Animated, Platform,
    KeyboardAvoidingView, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://fitos-final.onrender.com';

// Sugestões de perguntas rápidas
const QUICK_QUESTIONS = [
    'Como o aluno envia as fotos de check-in?',
    'Como criar um template de treino?',
    'Como personalizar a avaliação da IA?',
    'Como enviar um aviso para todos os alunos?',
    'Como funciona o deload menstrual?',
    'Como criar minha página de vendas?',
    'Como funciona o código de convite?',
    'Como visualizar o app como aluno?',
];

function MessageBubble({ msg, theme }) {
    const isUser = msg.role === 'user';
    return (
        <View style={[
            styles.bubble,
            isUser
                ? [styles.bubbleUser, { backgroundColor: theme.accent }]
                : [styles.bubbleAssistant, { backgroundColor: theme.surface, borderColor: theme.border }],
        ]}>
            {!isUser && (
                <View style={styles.assistantLabel}>
                    <MaterialCommunityIcons name="robot-outline" size={11} color={theme.accent} />
                    <Text style={{ fontSize: 9, fontWeight: '900', color: theme.accent, letterSpacing: 0.5 }}>ELITE ASSISTANT</Text>
                </View>
            )}
            <Text style={[
                styles.bubbleText,
                { color: isUser ? '#000' : theme.text },
            ]}>
                {msg.content}
            </Text>
        </View>
    );
}

export default function EliteAssistant({ theme }) {
    const [open,        setOpen]        = useState(false);
    const [input,       setInput]       = useState('');
    const [history,     setHistory]     = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [coachPlan,   setCoachPlan]   = useState('ELITE');
    const [showSuggest, setShowSuggest] = useState(true);
    const scrollRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulso no botão quando fechado
    useEffect(() => {
        if (!open) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
        pulseAnim.setValue(1);
    }, [open]);

    // Carrega coachPlan do storage
    useEffect(() => {
        AsyncStorage.getItem('user').then(json => {
            if (json) {
                try {
                    const u = JSON.parse(json);
                    setCoachPlan(u.coachPlan ?? 'ELITE');
                } catch {}
            }
        });
    }, []);

    // Scroll para o final quando chega nova mensagem
    useEffect(() => {
        if (history.length > 0) {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [history]);

    const sendMessage = async (text) => {
        const msg = (text ?? input).trim();
        if (!msg || loading) return;

        setInput('');
        setShowSuggest(false);

        const newHistory = [...history, { role: 'user', content: msg }];
        setHistory(newHistory);
        setLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/api/ai/elite-assistant`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    message: msg,
                    history: newHistory.slice(-10).map(h => ({
                        role:    h.role,
                        content: h.content,
                    })),
                    coachPlan,
                }),
            });

            const data = await res.json();

            if (data.reply) {
                setHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setHistory(prev => [...prev, { role: 'assistant', content: 'Desculpe, não consegui processar sua pergunta. Tente novamente.' }]);
            }
        } catch {
            setHistory(prev => [...prev, { role: 'assistant', content: '❌ Sem conexão com o assistente. Verifique sua internet e tente novamente.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setHistory([]);
        setShowSuggest(true);
        setInput('');
    };

    const isWeb = Platform.OS === 'web';

    return (
        <>
            {/* ── BOTÃO FLUTUANTE ─────────────────────────────────────── */}
            <Animated.View style={[
                styles.fab,
                { transform: [{ scale: pulseAnim }] },
            ]}>
                <TouchableOpacity
                    style={[styles.fabBtn, { backgroundColor: theme.accent }]}
                    onPress={() => setOpen(true)}
                    activeOpacity={0.85}
                >
                    <MaterialCommunityIcons name="robot-outline" size={26} color="#000" />
                </TouchableOpacity>
            </Animated.View>

            {/* ── CHAT MODAL ──────────────────────────────────────────── */}
            <Modal
                visible={open}
                transparent
                animationType="slide"
                onRequestClose={() => setOpen(false)}
            >
                <View style={styles.modalBackdrop}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={[
                            styles.chatContainer,
                            {
                                backgroundColor: theme.bg,
                                borderColor:     theme.border,
                                maxWidth:        isWeb ? 420 : '100%',
                            },
                        ]}
                    >
                        {/* Header */}
                        <View style={[styles.chatHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                            <View style={[styles.assistantAvatar, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="robot-outline" size={22} color={theme.accent} />
                            </View>
                            <View style={{ flex: 1, paddingLeft: 10 }}>
                                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 14 }}>ELITE Assistant</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 1 }}>
                                    Suporte sobre as funcionalidades
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                {history.length > 0 && (
                                    <TouchableOpacity
                                        onPress={handleClear}
                                        style={[styles.headerBtn, { borderColor: theme.border }]}
                                    >
                                        <MaterialCommunityIcons name="delete-outline" size={16} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setOpen(false)}
                                    style={[styles.headerBtn, { borderColor: theme.border }]}
                                >
                                    <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Mensagens */}
                        <ScrollView
                            ref={scrollRef}
                            style={{ flex: 1 }}
                            contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 8 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Boas-vindas */}
                            {history.length === 0 && (
                                <View style={[styles.welcomeCard, { backgroundColor: theme.surface, borderColor: theme.accent + '40' }]}>
                                    <Text style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>👋</Text>
                                    <Text style={{ color: theme.text, fontWeight: '900', fontSize: 14, textAlign: 'center', marginBottom: 6 }}>
                                        Olá! Sou o ELITE Assistant
                                    </Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                                        Estou aqui para tirar suas dúvidas sobre as funcionalidades da plataforma. Como posso te ajudar?
                                    </Text>
                                </View>
                            )}

                            {/* Sugestões rápidas */}
                            {showSuggest && history.length === 0 && (
                                <View style={{ gap: 6 }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 }}>
                                        PERGUNTAS FREQUENTES
                                    </Text>
                                    {QUICK_QUESTIONS.map((q, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={[styles.quickBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                            onPress={() => sendMessage(q)}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons name="chevron-right" size={14} color={theme.accent} />
                                            <Text style={{ color: theme.text, fontSize: 12, flex: 1 }}>{q}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Histórico */}
                            {history.map((msg, i) => (
                                <MessageBubble key={i} msg={msg} theme={theme} />
                            ))}

                            {/* Typing indicator */}
                            {loading && (
                                <View style={[styles.bubbleAssistant, styles.bubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <View style={styles.assistantLabel}>
                                        <MaterialCommunityIcons name="robot-outline" size={11} color={theme.accent} />
                                        <Text style={{ fontSize: 9, fontWeight: '900', color: theme.accent }}>ELITE ASSISTANT</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 4 }}>
                                        <ActivityIndicator size="small" color={theme.accent} />
                                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Digitando...</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Input */}
                        <View style={[styles.inputRow, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
                            <TextInput
                                style={[styles.textInput, { color: theme.text, backgroundColor: theme.bg, borderColor: theme.border }]}
                                placeholder="Digite sua dúvida..."
                                placeholderTextColor={theme.textSecondary}
                                value={input}
                                onChangeText={setInput}
                                onSubmitEditing={() => sendMessage()}
                                returnKeyType="send"
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, { backgroundColor: input.trim() ? theme.accent : theme.border }]}
                                onPress={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="send" size={18} color={input.trim() ? '#000' : theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // FAB
    fab: {
        position: 'absolute',
        bottom:   90,
        right:    20,
        zIndex:   999,
    },
    fabBtn: {
        width:          56,
        height:         56,
        borderRadius:   28,
        alignItems:     'center',
        justifyContent: 'center',
        shadowColor:    '#000',
        shadowOpacity:  0.3,
        shadowRadius:   8,
        shadowOffset:   { width: 0, height: 4 },
        elevation:      8,
    },
    // Modal
    modalBackdrop: {
        flex:            1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent:  'flex-end',
        alignItems:      'center',
    },
    chatContainer: {
        width:                '100%',
        height:               '85%',
        borderTopLeftRadius:  24,
        borderTopRightRadius: 24,
        borderWidth:          1,
        borderBottomWidth:    0,
        overflow:             'hidden',
    },
    // Header
    chatHeader: {
        flexDirection:  'row',
        alignItems:     'center',
        padding:        14,
        borderBottomWidth: 1,
    },
    assistantAvatar: {
        width:          40,
        height:         40,
        borderRadius:   12,
        alignItems:     'center',
        justifyContent: 'center',
    },
    headerBtn: {
        width:          32,
        height:         32,
        borderRadius:   10,
        borderWidth:    1,
        alignItems:     'center',
        justifyContent: 'center',
    },
    // Mensagens
    welcomeCard: {
        borderRadius: 16,
        borderWidth:  1,
        padding:      16,
        marginBottom: 8,
    },
    bubble: {
        maxWidth:     '85%',
        padding:      12,
        borderRadius: 16,
        gap:          4,
    },
    bubbleUser: {
        alignSelf:          'flex-end',
        borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
        alignSelf:         'flex-start',
        borderWidth:       1,
        borderBottomLeftRadius: 4,
    },
    assistantLabel: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:           4,
        marginBottom:  2,
    },
    bubbleText: {
        fontSize:   13,
        lineHeight: 20,
    },
    // Sugestões
    quickBtn: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:           8,
        padding:       10,
        borderRadius:  12,
        borderWidth:   1,
    },
    // Input
    inputRow: {
        flexDirection: 'row',
        alignItems:    'flex-end',
        gap:           8,
        padding:       12,
        borderTopWidth: 1,
    },
    textInput: {
        flex:         1,
        borderWidth:  1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical:   10,
        fontSize:     16, // ← mínimo 16px evita zoom automático no iOS/web
        maxHeight:    80,
        outlineStyle: 'none',
    },
    sendBtn: {
        width:          42,
        height:         42,
        borderRadius:   12,
        alignItems:     'center',
        justifyContent: 'center',
    },
});
