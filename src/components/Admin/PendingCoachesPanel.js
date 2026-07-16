// src/components/Admin/PendingCoachesPanel.js
// 🧑‍🏫 PAINEL DE COACHES PENDENTES (aprovar / recusar cadastros)
//
// Uso no seu dashboard admin (visível só pro master/Paulo):
//   import PendingCoachesPanel from '../components/Admin/PendingCoachesPanel';
//   ...
//   <PendingCoachesPanel theme={theme} refreshTrigger={coachCheckTrigger} />
//
// 🔥 O check de coaches pendentes só roda:
//   1) quando o componente é montado (ou seja, quando você entra na aba ALUNOS,
//      já que o AdminDashboard só renderiza este painel nessa aba)
//   2) quando `refreshTrigger` muda (disparado pelo botão de recarregar do header)
//
// theme é o objeto vindo do ThemeContext (theme.isDark, theme.text, etc).

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, ActivityIndicator,
    Platform, Alert, Linking, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'https://fitos-final.onrender.com';

export default function PendingCoachesPanel({ theme, refreshTrigger }) {
    const isDark = !!theme?.isDark;
    const c = {
        bg: isDark ? '#1E1E1E' : '#F9F9F9',
        bg2: isDark ? '#2A2A2A' : '#FFF',
        text: isDark ? '#FFF' : '#333',
        sub: '#888',
        border: isDark ? '#444' : '#DDD',
        primary: '#8BC34A',
        blue: '#32ADE6',
        danger: '#F44336',
    };

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [processingId, setProcessingId] = useState(null);

    // Modal de aprovação (permite customizar o código de convite)
    const [approvingCoach, setApprovingCoach] = useState(null);
    const [customCode, setCustomCode] = useState('');

    const notify = (msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('', msg);
    };

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/admin/coach-requests?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Erro ao buscar coaches pendentes:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔥 Só roda ao montar (entrada na aba ALUNOS) e quando refreshTrigger mudar
    // (clique no botão de recarregar do header). NÃO roda a cada re-render/troca de aba.
    useEffect(() => { fetchRequests(); }, [fetchRequests, refreshTrigger]);

    const resolveRequest = async (coachId, action, inviteCode = '') => {
        setProcessingId(coachId);
        try {
            const res = await fetch(`${API_URL}/api/admin/coach-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachId, action, inviteCode }),
            });
            const data = await res.json();

            if (!res.ok) {
                notify(data.error || 'Erro ao processar.');
                return;
            }

            if (action === 'APPROVE') {
                const coach = requests.find(r => r.id === coachId);
                notify(`✅ ${coach?.name || 'Coach'} aprovado!\n\nCódigo de convite dele: ${data.inviteCode}`);
                // Oferece avisar no WhatsApp
                if (coach?.phone) {
                    const msg = `Fala, ${coach.name}! 🎉 Seu acesso ao ELITE FIT foi APROVADO!\n\nSeu código de convite para cadastrar alunos é: ${data.inviteCode}\n\nJá pode fazer login com o e-mail e senha que você cadastrou. Bora pra cima! 💪`;
                    const url = `whatsapp://send?phone=+55${coach.phone.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`;
                    Linking.openURL(url).catch(() => {});
                }
            } else {
                notify('Cadastro recusado.');
            }

            setApprovingCoach(null);
            setCustomCode('');
            await fetchRequests();
        } catch (e) {
            console.error('Erro:', e);
            notify('Erro de conexão.');
        } finally {
            setProcessingId(null);
        }
    };

    const confirmReject = (coach) => {
        const run = () => resolveRequest(coach.id, 'REJECT');
        const msg = `Recusar o cadastro de ${coach.name}? Ele não terá acesso à plataforma.`;
        if (Platform.OS === 'web') { if (window.confirm(msg)) run(); }
        else Alert.alert('Recusar Coach', msg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Recusar', style: 'destructive', onPress: run },
        ]);
    };

    const pending = requests.filter(r => r.accountStatus === 'PENDING_APPROVAL');
    const rejected = requests.filter(r => r.accountStatus === 'REJECTED');

    const formatDate = (iso) => {
        try {
            const d = new Date(iso);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } catch { return ''; }
    };

    const formatCpf = (cpf) => {
        if (!cpf || cpf.length !== 11) return cpf || '—';
        return `${cpf.substring(0,3)}.${cpf.substring(3,6)}.${cpf.substring(6,9)}-${cpf.substring(9)}`;
    };

    // Não renderiza nada se não houver pendências (não polui o dashboard)
    if (!loading && pending.length === 0 && rejected.length === 0) return null;

    return (
        <View style={{ backgroundColor: c.bg, borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: pending.length > 0 ? c.blue : c.border }}>

            {/* CABEÇALHO */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ backgroundColor: '#E3F2FD', padding: 8, borderRadius: 20, marginRight: 10 }}>
                    <Ionicons name="people-outline" size={20} color={c.blue} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text }}>
                        Coaches Aguardando Aprovação
                    </Text>
                    <Text style={{ fontSize: 12, color: c.sub }}>
                        {pending.length} pendente{pending.length === 1 ? '' : 's'}
                    </Text>
                </View>
                <TouchableOpacity onPress={fetchRequests} style={{ padding: 5 }}>
                    <Ionicons name="refresh" size={20} color={c.sub} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={c.blue} style={{ paddingVertical: 20 }} />
            ) : (
                <>
                    {/* LISTA DE PENDENTES */}
                    {pending.map(coach => {
                        const info = coach.coachRequestInfo || {};
                        return (
                            <View key={coach.id} style={{ backgroundColor: c.bg2, borderRadius: 10, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: c.border }}>
                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: c.text }}>{coach.name}</Text>
                                <Text style={{ fontSize: 12, color: c.sub, marginTop: 3 }}>
                                    📧 {coach.email}{'\n'}
                                    📱 {coach.phone || '—'}   |   🪪 {formatCpf(coach.cpf)}{'\n'}
                                    {info.instagram ? `📸 ${info.instagram}\n` : ''}
                                    📅 Solicitado em {formatDate(coach.createdAt)}
                                </Text>

                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, backgroundColor: c.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                                        onPress={() => { setApprovingCoach(coach); setCustomCode(''); }}
                                        disabled={processingId === coach.id}
                                    >
                                        {processingId === coach.id
                                            ? <ActivityIndicator color="#FFF" size="small" />
                                            : (<>
                                                <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" style={{ marginRight: 5 }} />
                                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>APROVAR</Text>
                                            </>)
                                        }
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flex: 1, borderWidth: 1, borderColor: c.danger, paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                                        onPress={() => confirmReject(coach)}
                                        disabled={processingId === coach.id}
                                    >
                                        <Ionicons name="close-circle-outline" size={16} color={c.danger} style={{ marginRight: 5 }} />
                                        <Text style={{ color: c.danger, fontWeight: 'bold', fontSize: 12 }}>RECUSAR</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}

                    {/* RECUSADOS (colapsado num resuminho — vira lista de leads) */}
                    {rejected.length > 0 && (
                        <Text style={{ fontSize: 11, color: c.sub, marginTop: 5 }}>
                            🗂 {rejected.length} cadastro{rejected.length === 1 ? '' : 's'} recusado{rejected.length === 1 ? '' : 's'} (guardado{rejected.length === 1 ? '' : 's'} como lead{rejected.length === 1 ? '' : 's'})
                        </Text>
                    )}
                </>
            )}

            {/* MODAL DE APROVAÇÃO (definir código de convite) */}
            <Modal visible={!!approvingCoach} transparent animationType="fade" onRequestClose={() => setApprovingCoach(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ width: '100%', maxWidth: 400, backgroundColor: c.bg, borderRadius: 15, padding: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 5 }}>
                            Aprovar {approvingCoach?.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: c.sub, marginBottom: 15, lineHeight: 18 }}>
                            Defina o código de convite que os alunos dele vão usar no cadastro (ex: PATEAM). Deixe em branco para gerar automaticamente.
                        </Text>
                        <TextInput
                            style={{ backgroundColor: c.bg2, color: c.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: c.border, fontSize: 16, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2, marginBottom: 15 }}
                            value={customCode}
                            onChangeText={(v) => setCustomCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            placeholder="AUTOMÁTICO"
                            placeholderTextColor={c.sub}
                            autoCapitalize="characters"
                            maxLength={12}
                        />
                        <TouchableOpacity
                            style={{ backgroundColor: c.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 8 }}
                            onPress={() => resolveRequest(approvingCoach.id, 'APPROVE', customCode)}
                            disabled={processingId === approvingCoach?.id}
                        >
                            {processingId === approvingCoach?.id
                                ? <ActivityIndicator color="#FFF" />
                                : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>✅ CONFIRMAR APROVAÇÃO</Text>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity style={{ padding: 10, alignItems: 'center' }} onPress={() => setApprovingCoach(null)}>
                            <Text style={{ color: c.sub, fontSize: 13 }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}