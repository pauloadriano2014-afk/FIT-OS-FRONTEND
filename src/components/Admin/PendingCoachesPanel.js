// src/components/Admin/PendingCoachesPanel.js — v2
// v2: mostra coachPlan do coach e permite Paulo alterar antes de aprovar
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, ActivityIndicator,
    Platform, Alert, Linking, Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'https://fitos-final.onrender.com';

const PLAN_OPTIONS = [
    { value: 'PERSONAL',     label: 'PERSONAL',  icon: 'dumbbell',    color: '#32ADE6' },
    { value: 'NUTRICIONISTA',label: 'NUTRI',      icon: 'food-apple',  color: '#34C759' },
    { value: 'ELITE',        label: 'ELITE',      icon: 'trophy',      color: '#FFCC00' },
];

function PlanBadge({ plan, theme }) {
    const opt = PLAN_OPTIONS.find(p => p.value === plan) ?? PLAN_OPTIONS[0];
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: opt.color + '20', borderWidth: 1, borderColor: opt.color + '50' }}>
            <MaterialCommunityIcons name={opt.icon} size={11} color={opt.color} />
            <Text style={{ fontSize: 10, fontWeight: '900', color: opt.color }}>{opt.label}</Text>
        </View>
    );
}

export default function PendingCoachesPanel({ theme, refreshTrigger }) {
    const isDark = !!theme?.isDark;
    const c = {
        bg:      isDark ? '#1E1E1E' : '#F9F9F9',
        bg2:     isDark ? '#2A2A2A' : '#FFF',
        text:    isDark ? '#FFF'    : '#333',
        sub:     '#888',
        border:  isDark ? '#444'    : '#DDD',
        primary: '#8BC34A',
        blue:    '#32ADE6',
        danger:  '#F44336',
    };

    const [loading,      setLoading]      = useState(true);
    const [requests,     setRequests]     = useState([]);
    const [processingId, setProcessingId] = useState(null);

    // Modal de aprovação
    const [approvingCoach, setApprovingCoach] = useState(null);
    const [customCode,     setCustomCode]     = useState('');
    const [selectedPlan,   setSelectedPlan]   = useState('PERSONAL'); // ← v2

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
        } catch (e) { console.error('Erro coaches pendentes:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests, refreshTrigger]);

    const resolveRequest = async (coachId, action, inviteCode = '', coachPlan = 'PERSONAL') => {
        setProcessingId(coachId);
        try {
            const res = await fetch(`${API_URL}/api/admin/coach-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachId, action, inviteCode, coachPlan }), // ← v2
            });
            const data = await res.json();

            if (!res.ok) { notify(data.error || 'Erro ao processar.'); return; }

            if (action === 'APPROVE') {
                const coach = requests.find(r => r.id === coachId);
                const planLabel = PLAN_OPTIONS.find(p => p.value === coachPlan)?.label ?? coachPlan;
                notify(`✅ ${coach?.name || 'Coach'} aprovado como ${planLabel}!\n\nCódigo de convite: ${data.inviteCode}`);
                if (coach?.phone) {
                    const msg = `Fala, ${coach.name}! 🎉 Seu acesso ao ELITE FIT foi APROVADO como ${planLabel}!\n\nSeu código de convite para alunos: ${data.inviteCode}\n\nFaça login com e-mail e senha que você cadastrou. Bora! 💪`;
                    const url = `whatsapp://send?phone=+55${coach.phone.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`;
                    Linking.openURL(url).catch(() => {});
                }
            } else {
                notify('Cadastro recusado.');
            }

            setApprovingCoach(null);
            setCustomCode('');
            setSelectedPlan('PERSONAL');
            await fetchRequests();
        } catch (e) { console.error('Erro:', e); notify('Erro de conexão.'); }
        finally { setProcessingId(null); }
    };

    const confirmReject = (coach) => {
        const run = () => resolveRequest(coach.id, 'REJECT');
        const msg = `Recusar o cadastro de ${coach.name}?`;
        if (Platform.OS === 'web') { if (window.confirm(msg)) run(); }
        else Alert.alert('Recusar Coach', msg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Recusar', style: 'destructive', onPress: run },
        ]);
    };

    const openApprovalModal = (coach) => {
        setApprovingCoach(coach);
        setCustomCode('');
        // Pré-seleciona o plano que o coach escolheu no cadastro
        setSelectedPlan(coach.coachPlan ?? 'PERSONAL');
    };

    const pending  = requests.filter(r => r.accountStatus === 'PENDING_APPROVAL');
    const rejected = requests.filter(r => r.accountStatus === 'REJECTED');

    const formatDate = (iso) => {
        try { const d = new Date(iso); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }
        catch { return ''; }
    };
    const formatCpf = (cpf) => {
        if (!cpf || cpf.length !== 11) return cpf || '—';
        return `${cpf.substring(0,3)}.${cpf.substring(3,6)}.${cpf.substring(6,9)}-${cpf.substring(9)}`;
    };

    if (!loading && pending.length === 0 && rejected.length === 0) return null;

    return (
        <View style={{ backgroundColor: c.bg, borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: pending.length > 0 ? c.blue : c.border }}>

            {/* Cabeçalho */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ backgroundColor: '#E3F2FD', padding: 8, borderRadius: 20, marginRight: 10 }}>
                    <Ionicons name="people-outline" size={20} color={c.blue} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text }}>Coaches Aguardando Aprovação</Text>
                    <Text style={{ fontSize: 12, color: c.sub }}>{pending.length} pendente{pending.length === 1 ? '' : 's'}</Text>
                </View>
                <TouchableOpacity onPress={fetchRequests} style={{ padding: 5 }}>
                    <Ionicons name="refresh" size={20} color={c.sub} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={c.blue} style={{ paddingVertical: 20 }} />
            ) : (
                <>
                    {pending.map(coach => {
                        const info = coach.coachRequestInfo || {};
                        return (
                            <View key={coach.id} style={{ backgroundColor: c.bg2, borderRadius: 10, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: c.border }}>
                                {/* Nome + badge do plano solicitado */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: c.text, flex: 1 }}>{coach.name}</Text>
                                    <PlanBadge plan={coach.coachPlan ?? 'PERSONAL'} theme={theme} />
                                </View>
                                <Text style={{ fontSize: 12, color: c.sub }}>
                                    📧 {coach.email}{'\n'}
                                    📱 {coach.phone || '—'}   |   🪪 {formatCpf(coach.cpf)}{'\n'}
                                    {info.instagram ? `📸 ${info.instagram}\n` : ''}
                                    📅 Solicitado em {formatDate(coach.createdAt)}
                                </Text>

                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, backgroundColor: c.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                                        onPress={() => openApprovalModal(coach)}
                                        disabled={processingId === coach.id}
                                    >
                                        {processingId === coach.id
                                            ? <ActivityIndicator color="#FFF" size="small" />
                                            : (<><Ionicons name="checkmark-circle-outline" size={16} color="#FFF" style={{ marginRight: 5 }} /><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>APROVAR</Text></>)
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

                    {rejected.length > 0 && (
                        <Text style={{ fontSize: 11, color: c.sub, marginTop: 5 }}>
                            🗂 {rejected.length} cadastro{rejected.length === 1 ? '' : 's'} recusado{rejected.length === 1 ? '' : 's'} (guardado{rejected.length === 1 ? '' : 's'} como lead{rejected.length === 1 ? '' : 's'})
                        </Text>
                    )}
                </>
            )}

            {/* Modal de aprovação — v2: seletor de plano */}
            <Modal visible={!!approvingCoach} transparent animationType="fade" onRequestClose={() => setApprovingCoach(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ width: '100%', maxWidth: 420, backgroundColor: c.bg, borderRadius: 18, padding: 22, gap: 14 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text }}>
                            Aprovar {approvingCoach?.name}
                        </Text>

                        {/* Seletor de plano ← v2 */}
                        <View>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: c.sub, letterSpacing: 0.5, marginBottom: 8 }}>
                                PLANO DO COACH
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {PLAN_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={{
                                            flex: 1, alignItems: 'center', gap: 5, padding: 10, borderRadius: 12,
                                            borderWidth: 2,
                                            borderColor:     selectedPlan === opt.value ? opt.color : c.border,
                                            backgroundColor: selectedPlan === opt.value ? opt.color + '18' : c.bg2,
                                        }}
                                        onPress={() => setSelectedPlan(opt.value)}
                                    >
                                        <MaterialCommunityIcons name={opt.icon} size={20} color={selectedPlan === opt.value ? opt.color : c.sub} />
                                        <Text style={{ fontSize: 10, fontWeight: '900', color: selectedPlan === opt.value ? opt.color : c.sub }}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ fontSize: 11, color: c.sub, marginTop: 6 }}>
                                {selectedPlan === 'PERSONAL'     ? 'Acesso apenas ao módulo de treinos.'                  : ''}
                                {selectedPlan === 'NUTRICIONISTA'? 'Acesso apenas ao módulo de dietas.'                   : ''}
                                {selectedPlan === 'ELITE'        ? 'Acesso completo: treinos + dietas.'                   : ''}
                            </Text>
                        </View>

                        {/* Código de convite */}
                        <View>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: c.sub, letterSpacing: 0.5, marginBottom: 6 }}>
                                CÓDIGO DE CONVITE (deixe em branco para gerar automático)
                            </Text>
                            <TextInput
                                style={{ backgroundColor: c.bg2, color: c.text, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.border, fontSize: 16, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2 }}
                                value={customCode}
                                onChangeText={(v) => setCustomCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                placeholder="AUTOMÁTICO"
                                placeholderTextColor={c.sub}
                                autoCapitalize="characters"
                                maxLength={12}
                            />
                        </View>

                        <TouchableOpacity
                            style={{ backgroundColor: c.primary, padding: 14, borderRadius: 12, alignItems: 'center' }}
                            onPress={() => resolveRequest(approvingCoach.id, 'APPROVE', customCode, selectedPlan)}
                            disabled={processingId === approvingCoach?.id}
                        >
                            {processingId === approvingCoach?.id
                                ? <ActivityIndicator color="#FFF" />
                                : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>✅ CONFIRMAR APROVAÇÃO</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => setApprovingCoach(null)}>
                            <Text style={{ color: c.sub, fontSize: 13 }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}