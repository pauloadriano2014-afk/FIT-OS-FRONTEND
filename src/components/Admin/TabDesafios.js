// src/components/Admin/TabDesafios.js
//
// Aba MASTER-ONLY (Paulo/Adri) pra gerenciar Desafios/Projetos por
// WhatsApp (ex: Desafio 90 Dias). Cria/edita o desafio (nome, valor, link
// do grupo), e permite ver a lista de inscritas de cada um — separada do
// CRM/Alunos principal, como decidido.

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, Platform, ActivityIndicator, Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_BASE = 'https://fitos-final.onrender.com';

const MASTER_OPTIONS = [
    { id: '3c82f763-66b4-48da-836e-16817d4f57c0', label: 'Paulo' },
    { id: 'b7c0c181-41fd-4156-b8fe-963a267759a3', label: 'Adri' },
];

const emptyDesafio = (defaultCoachId) => ({
    id: null,
    slug: '',
    nome: '',
    descricao: '',
    beneficios: [''],
    valor: '',
    linkGrupoWhats: '',
    coachId: defaultCoachId,
    ativo: true,
});

function slugifyLocal(input) {
    return (input || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function formatBRL(v) {
    return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function formatDataBR(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR');
}

export default function TabDesafios({ theme, currentUserId, navigation }) {
    const [desafios, setDesafios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // view: 'lista' | 'form' | 'inscritas'
    const [view, setView] = useState('lista');
    const [editingDesafio, setEditingDesafio] = useState(null);

    const [inscritasDesafio, setInscritasDesafio] = useState(null); // desafio selecionado
    const [inscricoes, setInscricoes] = useState([]);
    const [loadingInscricoes, setLoadingInscricoes] = useState(false);

    const fetchDesafios = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/desafios`);
            if (res.ok) {
                const data = await res.json();
                setDesafios(data.desafios || []);
            }
        } catch (e) {
            console.log('Erro ao buscar desafios', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDesafios(); }, [fetchDesafios]);

    // ── Preview (navegação interna — evita o problema do PWA sem "voltar") ──
    const openPreview = (desafio) => {
        navigation?.navigate('DesafioInscricao', { desafio: desafio.slug, preview: true });
    };

    // ── Form: abrir novo / editar ─────────────────────────────────────────
    const openNewDesafio = () => {
        setEditingDesafio(emptyDesafio(currentUserId || MASTER_OPTIONS[0].id));
        setView('form');
    };

    const openEditDesafio = (desafio) => {
        setEditingDesafio({
            ...desafio,
            valor: String(desafio.valor),
            beneficios: desafio.beneficios?.length ? desafio.beneficios : [''],
        });
        setView('form');
    };

    const backToList = () => {
        setEditingDesafio(null);
        setInscritasDesafio(null);
        setView('lista');
    };

    const updateField = (field, value) => {
        setEditingDesafio(prev => ({ ...prev, [field]: value }));
    };

    // ── Lista dinâmica de benefícios ("o que você vai receber") ──────────
    const addBeneficio = () => {
        setEditingDesafio(prev => ({ ...prev, beneficios: [...prev.beneficios, ''] }));
    };

    const updateBeneficio = (index, value) => {
        setEditingDesafio(prev => {
            const nova = [...prev.beneficios];
            nova[index] = value;
            return { ...prev, beneficios: nova };
        });
    };

    const removeBeneficio = (index) => {
        setEditingDesafio(prev => ({ ...prev, beneficios: prev.beneficios.filter((_, i) => i !== index) }));
    };

    // ── Salvar (criar ou atualizar) ────────────────────────────────────────
    const handleSave = async () => {
        if (!editingDesafio.nome.trim()) {
            return Platform.OS === 'web' ? window.alert('Dê um nome pro desafio.') : Alert.alert('Aviso', 'Dê um nome pro desafio.');
        }
        if (!editingDesafio.valor || parseFloat(editingDesafio.valor.replace(',', '.')) <= 0) {
            return Platform.OS === 'web' ? window.alert('Informe um valor válido.') : Alert.alert('Aviso', 'Informe um valor válido.');
        }
        if (!editingDesafio.linkGrupoWhats.trim()) {
            return Platform.OS === 'web' ? window.alert('Cole o link de convite do grupo do WhatsApp.') : Alert.alert('Aviso', 'Cole o link de convite do grupo do WhatsApp.');
        }

        setSaving(true);
        try {
            const isEditing = !!editingDesafio.id;
            const url = isEditing
                ? `${API_BASE}/api/admin/desafios/${editingDesafio.id}`
                : `${API_BASE}/api/admin/desafios`;
            const method = isEditing ? 'PATCH' : 'POST';

            const body = {
                nome: editingDesafio.nome,
                descricao: editingDesafio.descricao,
                beneficios: editingDesafio.beneficios.filter(b => b.trim() !== ''),
                valor: parseFloat(editingDesafio.valor.replace(',', '.')),
                linkGrupoWhats: editingDesafio.linkGrupoWhats,
                ativo: editingDesafio.ativo,
                ...(!isEditing && { slug: editingDesafio.slug, coachId: editingDesafio.coachId }),
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                const msg = data?.error || 'Erro ao salvar desafio.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
                return;
            }

            Platform.OS === 'web' ? window.alert('Desafio salvo com sucesso!') : Alert.alert('Sucesso', 'Desafio salvo com sucesso!');
            await fetchDesafios();
            backToList();
        } catch (e) {
            console.log('Erro ao salvar desafio', e);
        } finally {
            setSaving(false);
        }
    };

    // ── Deletar / ativar-desativar ─────────────────────────────────────────
    const handleDelete = async (desafio) => {
        const confirmMsg = `Deletar "${desafio.nome}"? As inscrições ligadas a ele também serão apagadas.`;
        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) await doDelete(desafio.id);
            return;
        }
        Alert.alert('Deletar desafio', confirmMsg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Deletar', style: 'destructive', onPress: () => doDelete(desafio.id) },
        ]);
    };

    const doDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/desafios/${id}`, { method: 'DELETE' });
            if (res.ok) fetchDesafios();
        } catch (e) {
            console.log('Erro ao deletar', e);
        }
    };

    const toggleAtivo = async (desafio) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/desafios/${desafio.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ativo: !desafio.ativo }),
            });
            if (res.ok) fetchDesafios();
        } catch (e) {
            console.log('Erro ao alternar ativo', e);
        }
    };

    // ── Ver inscritas ───────────────────────────────────────────────────────
    const openInscritas = async (desafio) => {
        setInscritasDesafio(desafio);
        setView('inscritas');
        setLoadingInscricoes(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/desafios/${desafio.id}/inscricoes`);
            if (res.ok) {
                const data = await res.json();
                setInscricoes(data.inscricoes || []);
            }
        } catch (e) {
            console.log('Erro ao buscar inscrições', e);
        } finally {
            setLoadingInscricoes(false);
        }
    };

    // ────────────────────────────────────────────────────────────────────
    // RENDER: LISTA
    // ────────────────────────────────────────────────────────────────────
    if (view === 'lista') {
        return (
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>DESAFIOS / PROJETOS POR WHATSAPP</Text>
                <Text style={[styles.pageDesc, { color: theme.textSecondary }]}>
                    Crie desafios com cadastro + pagamento PIX automatizados. Assim que o pagamento é
                    confirmado, o link do grupo é liberado pra aluna direto na página — sem nenhuma ação manual sua.
                </Text>

                <TouchableOpacity style={[styles.newBtn, { backgroundColor: theme.accent }]} onPress={openNewDesafio}>
                    <MaterialCommunityIcons name="plus" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                    <Text style={[styles.newBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>NOVO DESAFIO</Text>
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 30, alignSelf: 'center', width: '100%' }} />
                ) : desafios.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        Nenhum desafio criado ainda.
                    </Text>
                ) : (
                    <View style={{ width: '100%' }}>
                        {desafios.map((desafio) => (
                            <View key={desafio.id} style={[styles.itemCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <TouchableOpacity style={{ flex: 1 }} onPress={() => openInscritas(desafio)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={[styles.itemNome, { color: theme.text }]}>{desafio.nome}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: desafio.ativo ? '#4DE38F20' : '#66666620', borderColor: desafio.ativo ? '#4DE38F' : '#666' }]}>
                                            <Text style={{ color: desafio.ativo ? '#4DE38F' : '#888', fontSize: 9, fontWeight: '900' }}>
                                                {desafio.ativo ? 'ATIVO' : 'INATIVO'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.itemSlug, { color: theme.textSecondary }]}>?desafio={desafio.slug} · R$ {formatBRL(desafio.valor)}</Text>
                                    <Text style={[styles.itemMeta, { color: theme.accent }]}>
                                        {desafio._count?.inscricoes || 0} inscrição(ões) — toque pra ver
                                    </Text>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                    <TouchableOpacity onPress={() => openPreview(desafio)}>
                                        <MaterialCommunityIcons name="eye-outline" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                    <Switch
                                        value={desafio.ativo}
                                        onValueChange={() => toggleAtivo(desafio)}
                                        trackColor={{ false: '#444', true: `${theme.accent}80` }}
                                        thumbColor={desafio.ativo ? theme.accent : '#888'}
                                    />
                                    <TouchableOpacity onPress={() => openEditDesafio(desafio)}>
                                        <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(desafio)}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    }

    // ────────────────────────────────────────────────────────────────────
    // RENDER: FORMULÁRIO
    // ────────────────────────────────────────────────────────────────────
    if (view === 'form') {
        return (
            <View style={{ gap: 15 }}>
                <TouchableOpacity style={styles.backRow} onPress={backToList}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900' }}>VOLTAR PARA A LISTA</Text>
                </TouchableOpacity>

                <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                    <Text style={[styles.bigCardTitle, { color: theme.text }]}>
                        {editingDesafio.id ? 'EDITAR DESAFIO' : 'NOVO DESAFIO'}
                    </Text>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Nome</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        value={editingDesafio.nome}
                        onChangeText={(v) => updateField('nome', v)}
                        placeholder="Ex: Desafio 90 Dias"
                        placeholderTextColor="#666"
                    />

                    {!editingDesafio.id && (
                        <>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Slug (usado no link: ?desafio=slug)</Text>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                value={editingDesafio.slug}
                                onChangeText={(v) => updateField('slug', slugifyLocal(v))}
                                placeholder={slugifyLocal(editingDesafio.nome) || 'gerado a partir do nome'}
                                placeholderTextColor="#666"
                            />
                        </>
                    )}

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Descrição (aparece na página pública)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 80 }]}
                        multiline
                        value={editingDesafio.descricao}
                        onChangeText={(v) => updateField('descricao', v)}
                        placeholder="Ex: 90 dias de motivação, dicas e rotina direto no seu WhatsApp."
                        placeholderTextColor="#666"
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>O que a aluna vai receber (aparece como lista na página)</Text>
                    {editingDesafio.beneficios.map((item, i) => (
                        <View key={i} style={styles.beneficioRow}>
                            <TextInput
                                style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                value={item}
                                onChangeText={(v) => updateBeneficio(i, v)}
                                placeholder="Ex: Mensagem diária de motivação no grupo"
                                placeholderTextColor="#666"
                            />
                            <TouchableOpacity onPress={() => removeBeneficio(i)}>
                                <MaterialCommunityIcons name="close-circle-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addBeneficioBtn} onPress={addBeneficio}>
                        <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.3 }}>ADICIONAR ITEM</Text>
                    </TouchableOpacity>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Valor (R$)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        keyboardType="numeric"
                        value={editingDesafio.valor}
                        onChangeText={(v) => updateField('valor', v)}
                        placeholder="97"
                        placeholderTextColor="#666"
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Link de convite do grupo do WhatsApp</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        value={editingDesafio.linkGrupoWhats}
                        onChangeText={(v) => updateField('linkGrupoWhats', v)}
                        placeholder="https://chat.whatsapp.com/XXXXXXXXXX"
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                    />
                    <Text style={styles.helperText}>
                        Esse link só é revelado pra aluna DEPOIS que o pagamento é confirmado — nunca aparece antes.
                    </Text>

                    {!editingDesafio.id && (
                        <>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Dono do desafio (conta de cobrança)</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                                {MASTER_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.coachOption,
                                            { borderColor: theme.border },
                                            editingDesafio.coachId === opt.id && { backgroundColor: `${theme.accent}20`, borderColor: theme.accent },
                                        ]}
                                        onPress={() => updateField('coachId', opt.id)}
                                    >
                                        <Text style={{ color: editingDesafio.coachId === opt.id ? theme.accent : theme.textSecondary, fontWeight: '900', fontSize: 12 }}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    <View style={styles.formActions}>
                        <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={backToList}>
                            <Text style={{ color: theme.textSecondary, fontWeight: '900', fontSize: 13 }}>CANCELAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" />
                                : <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13 }}>SALVAR</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // ────────────────────────────────────────────────────────────────────
    // RENDER: INSCRITAS (lista de leads de um desafio específico)
    // ────────────────────────────────────────────────────────────────────
    return (
        <View style={{ gap: 15 }}>
            <TouchableOpacity style={styles.backRow} onPress={backToList}>
                <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900' }}>VOLTAR PARA A LISTA</Text>
            </TouchableOpacity>

            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>INSCRITAS — {inscritasDesafio?.nome}</Text>
                <Text style={[styles.pageDesc, { color: theme.textSecondary }]}>
                    Lista separada do CRM principal. Marcadas como lead futuro por padrão.
                </Text>

                {loadingInscricoes ? (
                    <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 20, alignSelf: 'center', width: '100%' }} />
                ) : inscricoes.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhuma inscrição ainda.</Text>
                ) : (
                    <View style={{ width: '100%' }}>
                        {inscricoes.map((insc) => (
                            <View key={insc.id} style={[styles.inscricaoRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={[styles.itemNome, { color: theme.text, fontSize: 13 }]}>{insc.nome}</Text>
                                        <View style={[
                                            styles.statusBadge,
                                            insc.status === 'PAGO'
                                                ? { backgroundColor: '#4DE38F20', borderColor: '#4DE38F' }
                                                : { backgroundColor: '#FFCC0020', borderColor: '#FFCC00' },
                                        ]}>
                                            <Text style={{ color: insc.status === 'PAGO' ? '#4DE38F' : '#FFCC00', fontSize: 9, fontWeight: '900' }}>
                                                {insc.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.itemSlug, { color: theme.textSecondary }]}>{insc.email} · {insc.telefone}</Text>
                                    <Text style={[styles.itemSlug, { color: theme.textSecondary }]}>
                                        Nasc: {formatDataBR(insc.dataNascimento)} · Cadastro: {formatDataBR(insc.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bigCard: { padding: 24, borderRadius: 20, borderWidth: 1, width: '100%' },
    bigCardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    pageDesc: { fontSize: 12, lineHeight: 18, marginBottom: 16 },

    newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 20, width: '100%' },
    newBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },

    emptyText: { fontSize: 13, textAlign: 'center', marginTop: 20, lineHeight: 20, width: '100%' },

    itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, width: '100%' },
    itemNome: { fontSize: 15, fontWeight: '900' },
    itemSlug: { fontSize: 11, marginTop: 2 },
    itemMeta: { fontSize: 11, marginTop: 4, fontWeight: '700' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },

    backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },

    inputLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
    saasInput: { width: '100%', padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 13 },
    helperText: { fontSize: 10, fontStyle: 'italic', color: '#888', marginTop: 6 },

    coachOption: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
    beneficioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    addBeneficioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },

    formActions: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
    cancelBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    saveBtn: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    inscricaoRow: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, width: '100%' },
});