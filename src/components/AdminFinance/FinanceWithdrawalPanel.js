// src/components/AdminFinance/FinanceWithdrawalPanel.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authHeaders } from '../../utils/authToken';

export default function FinanceWithdrawalPanel({ theme, isWebPC, isMaster }) {
    const [balance, setBalance] = useState(0);
    const [pendingBalance, setPendingBalance] = useState(0); // 🔥 NOVO: Saldo a Receber
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [pixKey, setPixKey] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    const fetchBalance = async () => {
        setLoading(true);
        try {
            // Chama nossa API real que vai consultar o Asaas
            // 🔐 precisa do token de login — sem ele o servidor não sabe de quem é o saldo
            const res = await fetch('https://fitos-final.onrender.com/api/finance/withdraw', {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) {
                const data = await res.json();
                setBalance(data.balance || 0);
                setPendingBalance(data.pendingBalance || 0); // 🔥 Recebe o saldo bloqueado/futuro
            }
        } catch (error) {
            console.error('Erro ao buscar saldo:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, []);

    const notify = (title, msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert(title, msg);
    };

    const handleWithdraw = async () => {
        if (!pixKey.trim()) return notify('Erro', 'Informe a chave PIX para transferência.');
        if (balance < 5) return notify('Erro', 'O valor mínimo para transferência é de R$ 5,00.');

        setWithdrawing(true);
        try {
            const res = await fetch('https://fitos-final.onrender.com/api/finance/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ pixKey: pixKey.trim(), value: balance })
            });
            const data = await res.json();

            if (res.ok) {
                notify('Sucesso', 'Transferência PIX solicitada com sucesso! O valor cairá em breve na sua conta.');
                setModalVisible(false);
                setPixKey('');
                fetchBalance(); // Atualiza os saldos
            } else {
                notify('Erro', data.error || 'Não foi possível realizar o saque.');
            }
        } catch (error) {
            notify('Erro', 'Falha na conexão com o banco.');
        } finally {
            setWithdrawing(false);
        }
    };

    // Se for o Master, não precisa ver o próprio painel de saque de comissões aqui nesta aba
    if (isMaster) return null; 

    return (
        <View style={[styles.card, { backgroundColor: '#111', borderColor: '#222' }]}>
            <View style={{ flexDirection: isWebPC ? 'row' : 'column', justifyContent: 'space-between', alignItems: isWebPC ? 'center' : 'flex-start', gap: 16 }}>
                
                {/* Lado Esquerdo: Saldos */}
                <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: isWebPC ? 40 : 16 }}>
                    {/* Saldo Disponível */}
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <MaterialCommunityIcons name="wallet-outline" size={20} color={theme.accent} />
                            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>SALDO DISPONÍVEL</Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color={theme.accent} style={{ alignSelf: 'flex-start' }} />
                        ) : (
                            <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>
                                R$ {balance.toFixed(2).replace('.', ',')}
                            </Text>
                        )}
                    </View>

                    {/* Saldo a Receber (Cartão/Boleto) */}
                    <View style={{ justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <MaterialCommunityIcons name="clock-outline" size={16} color="#888" />
                            <Text style={{ color: '#888', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>A RECEBER (CARTÃO/BOLETO)</Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color="#888" size="small" style={{ alignSelf: 'flex-start' }} />
                        ) : (
                            <Text style={{ color: '#aaa', fontSize: 18, fontWeight: '700' }}>
                                R$ {pendingBalance.toFixed(2).replace('.', ',')}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Lado Direito: Botão */}
                <TouchableOpacity 
                    style={[styles.withdrawBtn, { backgroundColor: theme.accent, opacity: balance < 5 ? 0.5 : 1 }]}
                    onPress={() => setModalVisible(true)}
                    disabled={balance < 5 || loading}
                >
                    <MaterialCommunityIcons name="bank-transfer" size={20} color="#000" />
                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>SACAR DINHEIRO</Text>
                </TouchableOpacity>
            </View>

            {/* Modal de Confirmação de Saque PIX */}
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', marginBottom: 8 }}>Sacar via PIX</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 20 }}>
                            O valor de <Text style={{ color: theme.accent, fontWeight: 'bold' }}>R$ {balance.toFixed(2).replace('.', ',')}</Text> será transferido diretamente para a sua conta bancária.
                        </Text>

                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>SUA CHAVE PIX (CPF, E-mail, Celular ou Aleatória)</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                            placeholder="Digite sua chave PIX"
                            placeholderTextColor={theme.textSecondary}
                            value={pixKey}
                            onChangeText={setPixKey}
                            autoCapitalize="none"
                        />

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }]} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent, borderWidth: 1, borderColor: theme.accent }]} onPress={handleWithdraw} disabled={withdrawing}>
                                {withdrawing ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: '900' }}>TRANSFERIR</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
    withdrawBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 400, padding: 24, borderRadius: 20, borderWidth: 1 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, outlineStyle: 'none', marginBottom: 16 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});