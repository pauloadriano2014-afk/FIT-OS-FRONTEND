// src/components/Admin/EditCoachProfileModal.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Modal, 
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authHeaders } from '../../utils/authToken';

export default function EditCoachProfileModal({ visible, onClose, coach, theme, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        instagram: '',
        contractValue: '0,00'
    });

    useEffect(() => {
        if (coach) {
            setForm({
                name: coach.name || '',
                email: coach.email || '',
                cpf: coach.cpf || '',
                phone: coach.phone || '',
                instagram: coach.instagram || '',
                contractValue: coach.contractValue ? coach.contractValue.toFixed(2).replace('.', ',') : '0,00'
            });
        }
    }, [coach]);

    const handleCpfChange = (val) => {
        let f = val.replace(/\D/g, '').substring(0, 11);
        if (f.length > 9) f = `${f.substring(0,3)}.${f.substring(3,6)}.${f.substring(6,9)}-${f.substring(9)}`;
        else if (f.length > 6) f = `${f.substring(0,3)}.${f.substring(3,6)}.${f.substring(6)}`;
        else if (f.length > 3) f = `${f.substring(0,3)}.${f.substring(3)}`;
        setForm({...form, cpf: f});
    };

    const handlePhoneChange = (val) => {
        let f = val.replace(/\D/g, '');
        if (f.length > 2) f = '(' + f.substring(0, 2) + ') ' + f.substring(2);
        if (f.length > 9) f = f.substring(0, 10) + '-' + f.substring(10, 14);
        setForm({...form, phone: f});
    };

    const handleMoneyChange = (val) => {
        const onlyNumbers = val.replace(/\D/g, '');
        const floatValue = (Number(onlyNumbers) / 100).toFixed(2);
        setForm({...form, contractValue: floatValue.replace('.', ',')});
    };

    const notify = (title, msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert(title, msg);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const numericContractValue = parseFloat(form.contractValue.replace(',', '.'));
            
            const response = await fetch('https://fitos-final.onrender.com/api/admin/coaches', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({
                    coachId: coach.id,
                    action: 'UPDATE_PROFILE', // 🔥 CHAMA A NOVA AÇÃO
                    name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    cpf: form.cpf.replace(/\D/g, ''),
                    phone: form.phone,
                    instagram: form.instagram.trim(),
                    contractValue: numericContractValue
                })
            });

            if (response.ok) {
                notify("Sucesso", "Perfil atualizado com sucesso!");
                onSuccess(); // Recarrega a lista na tela principal
                onClose();
            } else {
                const errorData = await response.json();
                notify("Erro", errorData.error || "Não foi possível atualizar.");
            }
        } catch (error) {
            console.error("Erro ao atualizar perfil do coach:", error);
            notify("Erro", "Erro de conexão ao salvar.");
        } finally {
            setLoading(false);
        }
    };

    if (!visible || !coach) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <MaterialCommunityIcons name="card-account-details-outline" size={24} color={theme.accent} />
                            <Text style={[styles.title, { color: theme.text }]}>Editar Perfil</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Formulário */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>NOME COMPLETO</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                            value={form.name} onChangeText={v => setForm({...form, name: v})}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>CPF</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                                    value={form.cpf} onChangeText={handleCpfChange} keyboardType="numeric" maxLength={14}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>WHATSAPP</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                                    value={form.phone} onChangeText={handlePhoneChange} keyboardType="phone-pad" maxLength={15}
                                />
                            </View>
                        </View>

                        <Text style={[styles.label, { color: theme.textSecondary }]}>E-MAIL DE ACESSO</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                            value={form.email} onChangeText={v => setForm({...form, email: v})} autoCapitalize="none"
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>INSTAGRAM</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} 
                                    value={form.instagram} onChangeText={v => setForm({...form, instagram: v})} autoCapitalize="none"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>VALOR DA MENSALIDADE</Text>
                                <View style={[styles.moneyInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <Text style={{ color: theme.textSecondary, fontWeight: 'bold', marginRight: 5 }}>R$</Text>
                                    <TextInput 
                                        style={[styles.moneyInput, { color: theme.accent }]} 
                                        value={form.contractValue} onChangeText={handleMoneyChange} keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer / Salvar */}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>SALVAR DADOS</Text>}
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContainer: { width: '100%', maxWidth: 500, borderRadius: 24, borderWidth: 1, overflow: 'hidden', maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    title: { fontSize: 18, fontWeight: '900' },
    closeBtn: { padding: 5 },
    formContent: { padding: 20 },
    label: { fontSize: 10, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5, marginLeft: 4 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 14, outlineStyle: 'none' },
    row: { flexDirection: 'row' },
    moneyInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 16 },
    moneyInput: { flex: 1, fontSize: 16, fontWeight: '900', outlineStyle: 'none' },
    footer: { padding: 20, borderTopWidth: 1 },
    saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});