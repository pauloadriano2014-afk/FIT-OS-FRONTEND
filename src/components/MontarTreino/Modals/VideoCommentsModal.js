// src/components/MontarTreino/Modals/VideoCommentsModal.js
import React from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, 
    TextInput, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function VideoCommentsModal({
    visible, onClose, theme, activeVideoTitle, loadingAdminComments,
    activeComments, handleDeleteAdminComment, adminNewComment,
    setAdminNewComment, handleSendAdminComment, sendingAdminComment,
    replyingTo, replyingName, cancelReply, startReply
}) {

    const renderComment = (item, isReply = false) => {
        const isAdminComment = item.user?.role === 'ADMIN';

        return (
            <View style={[styles.commentCard, { 
                backgroundColor: isAdminComment ? theme.accent + '11' : theme.surface, 
                borderColor: isAdminComment ? theme.accent : theme.border,
                marginLeft: isReply ? 30 : 0,
                marginTop: isReply ? 5 : 15
            }]}>
                <View style={styles.commentHeader}>
                    <View style={styles.commentUserBox}>
                        <MaterialCommunityIcons name={isAdminComment ? "shield-star" : "account-circle"} size={16} color={isAdminComment ? '#FFCC00' : theme.textSecondary} style={{marginRight: 4}} />
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 12 }}>
                            {item.user?.name || 'Aluno'} 
                            {isAdminComment && <Text style={{color: '#FFCC00', fontSize: 10}}> [COACH]</Text>}
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 8 }}>
                            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </Text>
                    </View>
                    
                    <View style={styles.commentActionsBox}>
                        {!isReply && (
                            <TouchableOpacity onPress={() => startReply(item.id, item.user?.name || 'Aluno')}>
                                <MaterialCommunityIcons name="reply" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDeleteAdminComment(item.id)}>
                            <MaterialCommunityIcons name="trash-can" size={16} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 }}>{item.text}</Text>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
                        <View style={{flex: 1}}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Moderar Comentários</Text>
                            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>{activeVideoTitle}</Text>
                        </View>
                        <TouchableOpacity onPress={() => { onClose(); cancelReply(); }} style={{ padding: 5 }}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary}/>
                        </TouchableOpacity>
                    </View>
                    
                    {loadingAdminComments ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.accent} />
                        </View>
                    ) : (
                        <FlatList 
                            data={activeComments}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ padding: 20 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View>
                                    {renderComment(item, false)}
                                    {item.replies && item.replies.map(reply => (
                                        <View key={reply.id}>{renderComment(reply, true)}</View>
                                    ))}
                                </View>
                            )}
                            ListEmptyComponent={
                                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>Esta aula ainda não possui comentários.</Text>
                            }
                        />
                    )}

                    <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
                        {replyingTo && (
                            <View style={styles.replyingBox}>
                                <Text style={{ color: theme.accent, fontSize: 11, fontWeight: 'bold' }}>
                                    Respondendo a {replyingName}...
                                </Text>
                                <TouchableOpacity onPress={cancelReply}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                            <TextInput 
                                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} 
                                placeholder={replyingTo ? "Escreva sua resposta..." : "Responder como COACH..."}
                                placeholderTextColor={theme.textSecondary}
                                value={adminNewComment}
                                onChangeText={setAdminNewComment}
                                multiline
                            />
                            <TouchableOpacity 
                                style={[styles.sendBtn, { backgroundColor: theme.accent, opacity: adminNewComment.trim() ? 1 : 0.5 }]}
                                onPress={handleSendAdminComment}
                                disabled={!adminNewComment.trim() || sendingAdminComment}
                            >
                                {sendingAdminComment ? <ActivityIndicator size="small" color={theme.isDark ? '#000' : '#FFF'} /> : <MaterialCommunityIcons name="send" size={18} color={theme.isDark ? '#000' : '#FFF'} />}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '85%', borderWidth: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalTitle: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    commentCard: { padding: 12, borderRadius: 12, borderWidth: 1 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    commentUserBox: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    commentActionsBox: { flexDirection: 'row', gap: 10 },
    inputContainer: { padding: 15, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 25 : 15 },
    replyingBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    input: { flex: 1, borderRadius: 20, borderWidth: 1, minHeight: 45, maxHeight: 100, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, fontSize: 14 },
    sendBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});