// src/components/ClientDiet/DietSurveyModal.js
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authHeaders } from '../../utils/authToken';

export default function DietSurveyModal({ visible, onClose, theme, userId }) {
    const [saciedade,   setSaciedade]   = useState('');
    const [dificuldade, setDificuldade] = useState('');
    const [ajustes,     setAjustes]     = useState('');
    const [enviando,    setEnviando]    = useState(false);

    const enviarFeedback = async () => {
        if (!saciedade && !dificuldade && !ajustes) {
            const msg = 'Preencha pelo menos um campo para enviar o feedback.';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Aviso', msg);
            return;
        }
        setEnviando(true);
        try {
            const res = await fetch('https://fitos-final.onrender.com/api/diet/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({
                    userId,
                    satiety:          saciedade,
                    difficulty:       dificuldade,
                    requestedChanges: ajustes,
                    timestamp:        new Date().toISOString(),
                }),
            });
            if (!res.ok) throw new Error('Falha ao registrar feedback');
            const msg = 'Sua solicitação foi enviada direto para o painel do Coach!';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Sucesso', msg);
            setSaciedade(''); setDificuldade(''); setAjustes('');
            onClose();
        } catch {
            const msg = 'Não foi possível enviar sua solicitação. Tente novamente.';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Erro', msg);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <Text style={[styles.title, { color: theme.text }]}>AJUSTAR PLANO</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 20 }}>
                        Dê seu feedback para que o Coach faça os ajustes cirúrgicos na sua dieta.
                    </Text>

                    <Text style={[styles.label, { color: theme.textSecondary }]}>1. COMO ESTÁ SUA SACIEDADE?</Text>
                    <View style={styles.optRow}>
                        {['Fome', 'Normal', 'Cheio'].map((v, i) => {
                            const labels = ['COM FOME', 'SATISFEITO', 'MUITO CHEIO'];
                            const active = saciedade === v;
                            return (
                                <TouchableOpacity
                                    key={v}
                                    style={[styles.opt, { borderColor: theme.border },
                                        active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                                    onPress={() => setSaciedade(v)}
                                >
                                    <Text style={{ color: active ? '#000' : theme.text, fontSize: 10, fontWeight: 'bold' }}>
                                        {labels[i]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={[styles.label, { color: theme.textSecondary, marginTop: 15 }]}>
                        2. ALGUMA REFEIÇÃO ESTÁ DIFÍCIL?
                    </Text>
                    <TextInput
                        style={[styles.textarea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        placeholder="Ex: O almoço no trabalho está corrido..."
                        placeholderTextColor={theme.textSecondary}
                        multiline value={dificuldade} onChangeText={setDificuldade}
                    />

                    <Text style={[styles.label, { color: theme.textSecondary, marginTop: 15 }]}>
                        3. O QUE VOCÊ QUER ALTERAR?
                    </Text>
                    <TextInput
                        style={[styles.textarea, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        placeholder="Ex: Quero tirar o ovo da tarde e colocar whey..."
                        placeholderTextColor={theme.textSecondary}
                        multiline value={ajustes} onChangeText={setAjustes}
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: theme.accent }]}
                        onPress={enviarFeedback}
                        disabled={enviando}
                    >
                        {enviando
                            ? <ActivityIndicator color="#000" />
                            : <Text style={{ color: '#000', fontWeight: '900', letterSpacing: 1 }}>
                                ENVIAR PARA O COACH
                              </Text>
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    box:       { borderRadius: 24, padding: 25, borderWidth: 1, position: 'relative' },
    closeBtn:  { position: 'absolute', top: 20, right: 20, padding: 5, zIndex: 10 },
    title:     { fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
    label:     { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    optRow:    { flexDirection: 'row', gap: 8 },
    opt:       { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    textarea:  { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, height: 80, textAlignVertical: 'top' },
    submitBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
});