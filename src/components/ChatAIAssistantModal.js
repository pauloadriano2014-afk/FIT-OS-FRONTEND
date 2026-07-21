// src/modals/ChatAIAssistantModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, FlatList, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ChatAIAssistantModal({ 
    visible, onClose, theme, isWeb, messages, flatListRef, 
    chatInput, setChatInput, handleSendChat, isTyping, QUICK_QUESTIONS,
    assistantName // 🔥 novo
}) {
    const renderChatMessage = ({ item }) => {
        const isAi = item.sender === 'ai';
        return (
            <View style={[styles.chatBubble, isAi ? [styles.chatBubbleAi, { backgroundColor: theme.surface, borderColor: theme.border }] : [styles.chatBubbleUser, { backgroundColor: theme.accent }]]}>
                {isAi && <Text style={[styles.chatSenderName, { color: theme.accent }]}>{assistantName}</Text>}
                <Text style={[styles.chatText, isAi ? {color: theme.text} : {color: theme.isDark ? '#000' : '#FFF'}]}>{item.text}</Text>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.chatModalOverlay}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.chatModalContainer, isWeb && { width: '100%', maxWidth: 480, alignSelf: 'center' }]} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                    <View style={[styles.chatContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={[styles.chatHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                <View style={[styles.chatAvatar, { backgroundColor: theme.accent }]}>
                                    <MaterialCommunityIcons name="robot" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                                </View>
                                <View>
                                    <Text style={[styles.chatTitle, { color: theme.text }]}>{assistantName}</Text>
                                    <Text style={[styles.chatStatus, { color: theme.accent }]}>Online agora</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} style={{padding:5}}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={item => item.id.toString()}
                            renderItem={renderChatMessage}
                            contentContainerStyle={{padding: 20}}
                            style={{flex: 1}}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                            showsVerticalScrollIndicator={false}
                        />

                        <View style={{ borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.surface, paddingTop: 10 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, gap: 10 }} style={{ maxHeight: 50 }}>
                                {QUICK_QUESTIONS.map((question, index) => (
                                    <TouchableOpacity key={index} style={[styles.quickActionBtn, { borderColor: theme.accent, backgroundColor: theme.bg }]} onPress={() => handleSendChat(question)} disabled={isTyping}>
                                        <Text style={[styles.quickActionText, { color: theme.text }]}>{question}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <View style={styles.chatInputArea}>
                                <TextInput style={[styles.chatInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Ou digite sua dúvida..." placeholderTextColor={theme.textSecondary} value={chatInput} onChangeText={setChatInput} onSubmitEditing={() => handleSendChat()} outlineStyle="none" />
                                <TouchableOpacity style={[styles.chatSendBtn, { backgroundColor: theme.accent }]} onPress={() => handleSendChat()} disabled={isTyping}>
                                    {isTyping ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" /> : <MaterialCommunityIcons name="send" size={20} color={theme.isDark ? '#000' : '#FFF'} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    chatModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
    chatModalContainer: { flex: 1, justifyContent: 'flex-end' },
    chatContent: { height: '85%', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', borderWidth: 1, borderBottomWidth: 0 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    chatAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    chatTitle: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
    chatStatus: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    quickActionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, height: 40, justifyContent: 'center' },
    quickActionText: { fontSize: 12, fontWeight: '600' },
    chatInputArea: { flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'android' ? 40 : 25, alignItems: 'center' },
    chatInput: { flex: 1, borderRadius: 25, paddingHorizontal: 20, paddingVertical: 14, marginRight: 10, borderWidth: 1, fontSize: 15 },
    chatSendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    chatBubble: { padding: 16, borderRadius: 20, marginBottom: 12, maxWidth: '85%' },
    chatBubbleAi: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
    chatBubbleUser: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    chatSenderName: { fontSize: 11, fontWeight: '900', marginBottom: 6, letterSpacing: 0.5 },
    chatText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
});