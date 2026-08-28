// src/components/SendNoticeModal.js
import React, { useState, useMemo } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, 
    FlatList, Switch, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authHeaders } from '../utils/authToken';

export default function SendNoticeModal({ visible, onClose, alunos, adminId, theme }) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sendToAll, setSendToAll] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [sending, setSending] = useState(false);

    // Filtra a lista de alunos caso a opção "Todos" esteja desligada
    const filteredAlunos = useMemo(() => {
        if (!search) return alunos;
        return alunos.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    }, [alunos, search]);

    const toggleStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(prev => prev.filter(studentId => studentId !== id));
        } else {
            setSelectedStudents(prev => [...prev, id]);
        }
    };

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            return Alert.alert("Campos Obrigatórios", "Preencha o título e a mensagem do aviso.");
        }
        
        if (!sendToAll && selectedStudents.length === 0) {
            return Alert.alert("Nenhum Aluno", "Selecione pelo menos um aluno ou marque 'Enviar para Todos'.");
        }

        setSending(true);
        try {
            const payload = {
                title: title.trim(),
                content: message.trim(),
                adminId: adminId,
                targetUsers: sendToAll ? 'ALL' : selectedStudents
            };

            // Certifique-se de que sua API de notices esteja preparada para receber targetUsers se for usar o envio segmentado!
            const response = await fetch('https://fitos-final.onrender.com/api/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                if (Platform.OS === 'web') window.alert("Aviso enviado com sucesso!");
                else Alert.alert("Sucesso", "Aviso enviado com sucesso!");
                handleClose();
            } else {
                throw new Error("Erro ao salvar no servidor.");
            }
        } catch (error) {
            if (Platform.OS === 'web') window.alert("Falha ao enviar o aviso.");
            else Alert.alert("Erro", "Falha ao enviar o aviso.");
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setMessage('');
        setSendToAll(true);
        setSelectedStudents([]);
        setSearch('');
        onClose();
    };

    const renderStudent = ({ item }) => {
        const isSelected = selectedStudents.includes(item.id);
        return (
            <TouchableOpacity 
                style={[styles.studentCard, { backgroundColor: theme.bg, borderColor: isSelected ? theme.accent : theme.border }]} 
                onPress={() => toggleStudent(item.id)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.avatar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={{ color: theme.text, fontWeight: 'bold', marginLeft: 10 }}>{item.name}</Text>
                </View>
                <MaterialCommunityIcons 
                    name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                    size={24} 
                    color={isSelected ? theme.accent : theme.textSecondary} 
                />
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>DISPARAR AVISO</Text>
                        <TouchableOpacity onPress={handleClose}><MaterialCommunityIcons name="close" size={24} color={theme.text}/></TouchableOpacity>
                    </View>

                    <View style={{ padding: 20, flexShrink: 1 }}>
                        
                        <Text style={styles.infoLabel}>TÍTULO DO AVISO</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]} 
                            placeholder="Ex: Feliz Páscoa! 🐰" 
                            placeholderTextColor={theme.textSecondary} 
                            value={title} 
                            onChangeText={setTitle} 
                        />

                        <Text style={[styles.infoLabel, { marginTop: 15 }]}>MENSAGEM (O aluno precisará dar OK para fechar)</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, height: 80, textAlignVertical: 'top' }]} 
                            multiline 
                            placeholder="Escreva seu recado..." 
                            placeholderTextColor={theme.textSecondary} 
                            value={message} 
                            onChangeText={setMessage} 
                        />

                        <View style={[styles.targetBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>Disparar para Todos</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Atinge todos os alunos ativos.</Text>
                                </View>
                                <Switch 
                                    value={sendToAll} 
                                    onValueChange={setSendToAll} 
                                    trackColor={{ false: '#333', true: theme.accent }} 
                                    thumbColor={Platform.OS === 'ios' ? '#FFF' : (sendToAll ? '#000' : '#888')}
                                />
                            </View>
                        </View>

                        {!sendToAll && (
                            <View style={{ flexShrink: 1, marginTop: 10 }}>
                                <TextInput 
                                    style={[styles.searchBar, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]} 
                                    placeholder="Buscar aluno específico..." 
                                    placeholderTextColor={theme.textSecondary} 
                                    value={search} 
                                    onChangeText={setSearch} 
                                />
                                <FlatList 
                                    data={filteredAlunos}
                                    keyExtractor={item => item.id}
                                    renderItem={renderStudent}
                                    style={{ maxHeight: 200, marginTop: 10 }}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10 }}>Nenhum aluno encontrado.</Text>}
                                />
                            </View>
                        )}

                        <TouchableOpacity 
                            style={[styles.sendBtn, { backgroundColor: theme.accent }]} 
                            onPress={handleSend} 
                            disabled={sending}
                        >
                            {sending ? (
                                <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <MaterialCommunityIcons name="send" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                                    <Text style={[styles.sendBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>
                                        {sendToAll ? "DISPARAR PARA TODOS" : `ENVIAR PARA (${selectedStudents.length}) ALUNO(S)`}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 20, maxHeight: '90%', borderWidth: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontWeight: 'bold', fontSize: 16 },
    infoLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.5 },
    input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    targetBox: { padding: 15, borderRadius: 12, borderWidth: 1, marginTop: 20 },
    searchBar: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 13, outlineStyle: 'none' },
    studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
    avatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    sendBtn: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20, justifyContent: 'center' },
    sendBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});