// src/components/Admin/TabDesafios.js
//
// Aba MASTER-ONLY (Paulo/Adri) pra gerenciar Desafios/Projetos por
// WhatsApp (ex: Desafio 90 Dias). Cria/edita o desafio (nome, valor, link
// do grupo), e permite ver a lista de inscritas de cada um — separada do
// CRM/Alunos principal, como decidido.

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, Platform, ActivityIndicator, Switch, Image, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';

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
    logoUrl: '',
    beneficios: [''],
    valor: '',
    duracaoDias: '90',
    linkGrupoWhats: '',
    coachId: defaultCoachId,
    ativo: true,
    mentorNome: '',
    mentorFotoUrl: '',
    mentorTexto: '',
    paraQuemE: [''],
    importante: '',
    compromissoTexto: '',
    bonusTexto: '',
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
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingGallerySlot, setUploadingGallerySlot] = useState(null);
    const [galleryPairs, setGalleryPairs] = useState([
        { id: 0, before: '', after: '', text: '' }, { id: 1, before: '', after: '', text: '' },
        { id: 2, before: '', after: '', text: '' }, { id: 3, before: '', after: '', text: '' },
    ]);

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

    // ── Link público real (esse sim vai pro interessado, fora do app) ──────
    // 🔑 Link de compartilhamento é pra um cliente de verdade — nunca deve
    // depender de onde VOCÊ está testando o admin (localhost, preview, etc.).
    // Por isso sempre usa o domínio de produção, sem checar Platform.OS.
    const getBaseUrl = () => 'https://www.pauloadrianoteam.com.br';

    const getDesafioLink = (desafio) => `${getBaseUrl()}/Desafio?desafio=${encodeURIComponent(desafio.slug)}`;

    const [copiedId, setCopiedId] = useState(null);

    const handleCopyLink = async (desafio) => {
        const link = getDesafioLink(desafio);
        await Clipboard.setStringAsync(link);
        setCopiedId(desafio.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShareWhatsApp = (desafio) => {
        const link = getDesafioLink(desafio);
        const texto = `Oi! 💜 Quero te convidar pro *${desafio.nome}* — ${desafio.duracaoDias || 90} dias de disciplina, constância e evolução, junto com uma comunidade que compartilha o mesmo objetivo.\n\nDá uma olhada nos detalhes e nas vagas:\n${link}`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
        Linking.openURL(url).catch(() => {
            if (Platform.OS === 'web') window.open(url, '_blank');
        });
    };

    // ── Form: abrir novo / editar ─────────────────────────────────────────
    const emptyGalleryPairs = () => ([
        { id: 0, before: '', after: '', text: '' }, { id: 1, before: '', after: '', text: '' },
        { id: 2, before: '', after: '', text: '' }, { id: 3, before: '', after: '', text: '' },
    ]);

    const openNewDesafio = () => {
        setEditingDesafio(emptyDesafio(currentUserId || MASTER_OPTIONS[0].id));
        setGalleryPairs(emptyGalleryPairs());
        setView('form');
    };

    const openEditDesafio = (desafio) => {
        setEditingDesafio({
            ...desafio,
            valor: String(desafio.valor),
            duracaoDias: String(desafio.duracaoDias || 90),
            logoUrl: desafio.logoUrl || '',
            beneficios: desafio.beneficios?.length ? desafio.beneficios : [''],
            mentorNome: desafio.mentorNome || '',
            mentorFotoUrl: desafio.mentorFotoUrl || '',
            mentorTexto: desafio.mentorTexto || '',
            paraQuemE: desafio.paraQuemE?.length ? desafio.paraQuemE : [''],
            importante: desafio.importante || '',
            compromissoTexto: desafio.compromissoTexto || '',
            bonusTexto: desafio.bonusTexto || '',
        });

        // Reconstrói os pares antes/depois a partir dos arrays flat (mesmo padrão do TabSaaS)
        const loadedPhotos = desafio.galleryPhotos || [];
        const loadedTexts = desafio.galleryTexts || [];
        setGalleryPairs([
            { id: 0, before: loadedPhotos[0] || '', after: loadedPhotos[1] || '', text: loadedTexts[0] || '' },
            { id: 1, before: loadedPhotos[2] || '', after: loadedPhotos[3] || '', text: loadedTexts[1] || '' },
            { id: 2, before: loadedPhotos[4] || '', after: loadedPhotos[5] || '', text: loadedTexts[2] || '' },
            { id: 3, before: loadedPhotos[6] || '', after: loadedPhotos[7] || '', text: loadedTexts[3] || '' },
        ]);

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

    // ── Upload de foto (mesmo endpoint R2 usado no TabSaaS) ──────────────
    const uploadImageToR2 = async (uri) => {
        let formData = new FormData();
        if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            const fileType = blob.type || 'image/jpeg';
            const file = new File([blob], `upload_${Date.now()}.jpg`, { type: fileType });
            formData.append('file', file);
        } else {
            const uriParts = uri.split('.');
            const fileType = uriParts[uriParts.length - 1] || 'jpg';
            formData.append('file', { uri, name: `upload_${Date.now()}.${fileType}`, type: `image/${fileType}` });
        }
        const res = await fetch(`${API_BASE}/api/upload-image`, { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no upload');
        return data.url;
    };

    const handlePickMentorPhoto = async () => {
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled) {
                setUploadingPhoto(true);
                const url = await uploadImageToR2(result.assets[0].uri);
                updateField('mentorFotoUrl', url);
            }
        } catch (e) {
            console.log('Erro ao enviar foto', e);
            Platform.OS === 'web' ? window.alert('Falha ao enviar a foto.') : Alert.alert('Erro', 'Falha ao enviar a foto.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    // ── Logo/banner horizontal do topo da página (recomendado 1200x400, proporção 3:1) ──
    const handlePickLogo = async () => {
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 1],
                quality: 0.9,
            });
            if (!result.canceled) {
                setUploadingLogo(true);
                const url = await uploadImageToR2(result.assets[0].uri);
                updateField('logoUrl', url);
            }
        } catch (e) {
            console.log('Erro ao enviar logo', e);
            Platform.OS === 'web' ? window.alert('Falha ao enviar a logo.') : Alert.alert('Erro', 'Falha ao enviar a logo.');
        } finally {
            setUploadingLogo(false);
        }
    };

    // ── Galeria de antes/depois (4 pares, mesmo padrão do TabSaaS) ───────
    const handlePickGalleryPhoto = async (index, type) => {
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled) {
                setUploadingGallerySlot(`${index}-${type}`);
                const url = await uploadImageToR2(result.assets[0].uri);
                setGalleryPairs(prev => prev.map((pair, i) => i === index ? { ...pair, [type]: url } : pair));
            }
        } catch (e) {
            console.log('Erro ao enviar foto da galeria', e);
            Platform.OS === 'web' ? window.alert('Falha ao enviar a foto.') : Alert.alert('Erro', 'Falha ao enviar a foto.');
        } finally {
            setUploadingGallerySlot(null);
        }
    };

    const removeGalleryPhoto = (index, type) => {
        setGalleryPairs(prev => prev.map((pair, i) => i === index ? { ...pair, [type]: '' } : pair));
    };

    const handleGalleryTextChange = (index, text) => {
        setGalleryPairs(prev => prev.map((pair, i) => i === index ? { ...pair, text } : pair));
    };

    // ── Listas dinâmicas de texto (benefícios, "para quem é") ────────────
    // Genérico: funciona pra qualquer campo do tipo string[] no editingDesafio.
    const addListItem = (field) => {
        setEditingDesafio(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const updateListItem = (field, index, value) => {
        setEditingDesafio(prev => {
            const nova = [...prev[field]];
            nova[index] = value;
            return { ...prev, [field]: nova };
        });
    };

    const removeListItem = (field, index) => {
        setEditingDesafio(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
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

            const galleryPhotos = [];
            const galleryTexts = [];
            galleryPairs.forEach(p => { galleryPhotos.push(p.before); galleryPhotos.push(p.after); galleryTexts.push(p.text); });

            const body = {
                nome: editingDesafio.nome,
                descricao: editingDesafio.descricao,
                logoUrl: editingDesafio.logoUrl,
                beneficios: editingDesafio.beneficios.filter(b => b.trim() !== ''),
                valor: parseFloat(editingDesafio.valor.replace(',', '.')),
                duracaoDias: parseInt(editingDesafio.duracaoDias) || 90,
                linkGrupoWhats: editingDesafio.linkGrupoWhats,
                ativo: editingDesafio.ativo,
                coachId: editingDesafio.coachId,
                mentorNome: editingDesafio.mentorNome,
                mentorFotoUrl: editingDesafio.mentorFotoUrl,
                mentorTexto: editingDesafio.mentorTexto,
                paraQuemE: editingDesafio.paraQuemE.filter(p => p.trim() !== ''),
                importante: editingDesafio.importante,
                compromissoTexto: editingDesafio.compromissoTexto,
                bonusTexto: editingDesafio.bonusTexto,
                galleryPhotos,
                galleryTexts,
                ...(!isEditing && { slug: editingDesafio.slug }),
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
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
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

                                {/* ── Ações de compartilhamento — o link de verdade pro interessado ── */}
                                <View style={styles.shareRow}>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: theme.border }]} onPress={() => handleCopyLink(desafio)}>
                                        <MaterialCommunityIcons name={copiedId === desafio.id ? 'check' : 'content-copy'} size={14} color={theme.textSecondary} />
                                        <Text style={[styles.shareBtnText, { color: theme.textSecondary }]}>
                                            {copiedId === desafio.id ? 'LINK COPIADO!' : 'COPIAR LINK'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: '#25D366' }]} onPress={() => handleShareWhatsApp(desafio)}>
                                        <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
                                        <Text style={[styles.shareBtnText, { color: '#25D366' }]}>ENVIAR NO WHATSAPP</Text>
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

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>
                        Logo/banner horizontal do topo (opcional — substitui o ícone padrão)
                    </Text>
                    <Text style={styles.helperText}>Recomendado: 1200 x 400px (proporção 3:1) pra ficar nítida em qualquer tela.</Text>

                    <View style={[styles.logoPreviewBox, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                        {editingDesafio.logoUrl
                            ? <Image source={{ uri: editingDesafio.logoUrl }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                            : <MaterialCommunityIcons name="image-outline" size={26} color={theme.textSecondary} />
                        }
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                        <TouchableOpacity
                            style={{ backgroundColor: theme.bg, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.accent }}
                            onPress={handlePickLogo}
                            disabled={uploadingLogo}
                        >
                            {uploadingLogo
                                ? <ActivityIndicator size="small" color={theme.accent} />
                                : <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900' }}>{editingDesafio.logoUrl ? 'TROCAR LOGO' : 'ADICIONAR LOGO'}</Text>
                            }
                        </TouchableOpacity>
                        {editingDesafio.logoUrl ? (
                            <TouchableOpacity
                                style={{ justifyContent: 'center' }}
                                onPress={() => updateField('logoUrl', '')}
                            >
                                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>💜 O que a aluna vai receber (aparece como lista na página)</Text>
                    {editingDesafio.beneficios.map((item, i) => (
                        <View key={i} style={styles.beneficioRow}>
                            <TextInput
                                style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                value={item}
                                onChangeText={(v) => updateListItem('beneficios', i, v)}
                                placeholder="Ex: Mensagem diária de motivação no grupo"
                                placeholderTextColor="#666"
                            />
                            <TouchableOpacity onPress={() => removeListItem('beneficios', i)}>
                                <MaterialCommunityIcons name="close-circle-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addBeneficioBtn} onPress={() => addListItem('beneficios')}>
                        <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.3 }}>ADICIONAR ITEM</Text>
                    </TouchableOpacity>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 20 }]}>🎯 Esse projeto é para você que... (opcional)</Text>
                    {editingDesafio.paraQuemE.map((item, i) => (
                        <View key={i} style={styles.beneficioRow}>
                            <TextInput
                                style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                value={item}
                                onChangeText={(v) => updateListItem('paraQuemE', i, v)}
                                placeholder="Ex: Quer criar constância"
                                placeholderTextColor="#666"
                            />
                            <TouchableOpacity onPress={() => removeListItem('paraQuemE', i)}>
                                <MaterialCommunityIcons name="close-circle-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addBeneficioBtn} onPress={() => addListItem('paraQuemE')}>
                        <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.3 }}>ADICIONAR ITEM</Text>
                    </TouchableOpacity>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 20 }]}>⚠️ Importante (opcional — aviso de que não substitui a consultoria individual)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 90 }]}
                        multiline
                        value={editingDesafio.importante}
                        onChangeText={(v) => updateField('importante', v)}
                        placeholder="Ex: O Projeto 90 Dias não substitui a Consultoria PA Elite..."
                        placeholderTextColor="#666"
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>💬 Meu compromisso (opcional)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 110 }]}
                        multiline
                        value={editingDesafio.compromissoTexto}
                        onChangeText={(v) => updateField('compromissoTexto', v)}
                        placeholder="Ex: Durante esses 90 dias vou mostrar a realidade..."
                        placeholderTextColor="#666"
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>🎁 Bônus Exclusivo (opcional — aparece no fim da página)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 80 }]}
                        multiline
                        value={editingDesafio.bonusTexto}
                        onChangeText={(v) => updateField('bonusTexto', v)}
                        placeholder="Ex: Quem participar receberá uma condição especial pra entrar na Consultoria PA Elite..."
                        placeholderTextColor="#666"
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 20 }]}>Valor (R$)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        keyboardType="numeric"
                        value={editingDesafio.valor}
                        onChangeText={(v) => updateField('valor', v)}
                        placeholder="97"
                        placeholderTextColor="#666"
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Duração (em dias)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        keyboardType="numeric"
                        value={editingDesafio.duracaoDias}
                        onChangeText={(v) => updateField('duracaoDias', v)}
                        placeholder="90"
                        placeholderTextColor="#666"
                    />
                    <Text style={styles.helperText}>Usado pra calcular e mostrar "R$ X por dia" na página pública.</Text>

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
                    <Text style={styles.helperText}>
                        Define de qual conta Asaas o PIX é gerado a partir de agora. Se já existirem inscrições
                        pagas com o dono anterior, elas não são afetadas — só as novas cobranças usam o dono atual.
                    </Text>

                    {/* ── Perfil de quem conduz o desafio (opcional) ────────────── */}
                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>QUEM CONDUZ ESSE DESAFIO</Text>
                    <Text style={styles.helperText}>
                        Opcional — se preenchido, aparece uma seção de apresentação na página pública. Deixe em branco pra não mostrar essa seção.
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10, marginBottom: 6 }}>
                        <View style={[styles.mentorPhotoPreview, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                            {editingDesafio.mentorFotoUrl
                                ? <Image source={{ uri: editingDesafio.mentorFotoUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                : <MaterialCommunityIcons name="account" size={30} color={theme.textSecondary} />
                            }
                        </View>
                        <TouchableOpacity
                            style={{ backgroundColor: theme.bg, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.accent }}
                            onPress={handlePickMentorPhoto}
                            disabled={uploadingPhoto}
                        >
                            {uploadingPhoto
                                ? <ActivityIndicator size="small" color={theme.accent} />
                                : <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900' }}>{editingDesafio.mentorFotoUrl ? 'TROCAR FOTO' : 'ADICIONAR FOTO'}</Text>
                            }
                        </TouchableOpacity>
                        {editingDesafio.mentorFotoUrl ? (
                            <TouchableOpacity onPress={() => updateField('mentorFotoUrl', '')}>
                                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nome</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        value={editingDesafio.mentorNome}
                        onChangeText={(v) => updateField('mentorNome', v)}
                        placeholder="Ex: Adri"
                        placeholderTextColor="#666"
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>Descrição — quem é e por que criou esse desafio</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 100 }]}
                        multiline
                        value={editingDesafio.mentorTexto}
                        onChangeText={(v) => updateField('mentorTexto', v)}
                        placeholder="Conte a sua história e o motivo de ter criado esse desafio..."
                        placeholderTextColor="#666"
                    />

                    {/* ── Galeria de antes/depois (opcional) ─────────────────────── */}
                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>ANTES E DEPOIS</Text>
                    <Text style={styles.helperText}>
                        Opcional — mostra até 4 comparações de alunas que a Adri já ajudou. Deixe os pares vazios que não for usar.
                    </Text>

                    <View style={{ width: '100%', gap: 16, marginTop: 10 }}>
                        {galleryPairs.map((pair, index) => (
                            <View key={pair.id} style={[styles.galleryPairCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                    {/* Antes */}
                                    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.galleryPhotoLabel}>Antes</Text>
                                        {pair.before ? (
                                            <View style={styles.galleryPhotoFilled}>
                                                <Image source={{ uri: pair.before }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                                <TouchableOpacity style={styles.galleryCloseBtn} onPress={() => removeGalleryPhoto(index, 'before')}>
                                                    <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.galleryPhotoEmpty, { borderColor: theme.accent }]}
                                                onPress={() => handlePickGalleryPhoto(index, 'before')}
                                                disabled={uploadingGallerySlot === `${index}-before`}
                                            >
                                                {uploadingGallerySlot === `${index}-before`
                                                    ? <ActivityIndicator size="small" color={theme.accent} />
                                                    : <MaterialCommunityIcons name="camera-plus" size={22} color={theme.accent} />
                                                }
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Depois */}
                                    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.galleryPhotoLabel}>Depois</Text>
                                        {pair.after ? (
                                            <View style={[styles.galleryPhotoFilled, { borderWidth: 2, borderColor: theme.accent }]}>
                                                <Image source={{ uri: pair.after }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                                <TouchableOpacity style={styles.galleryCloseBtn} onPress={() => removeGalleryPhoto(index, 'after')}>
                                                    <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.galleryPhotoEmpty, { borderColor: theme.accent }]}
                                                onPress={() => handlePickGalleryPhoto(index, 'after')}
                                                disabled={uploadingGallerySlot === `${index}-after`}
                                            >
                                                {uploadingGallerySlot === `${index}-after`
                                                    ? <ActivityIndicator size="small" color={theme.accent} />
                                                    : <MaterialCommunityIcons name="camera-plus" size={22} color={theme.accent} />
                                                }
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                <TextInput
                                    style={[styles.saasInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    placeholder="Ex: Ana perdeu 12kg em 90 dias..."
                                    placeholderTextColor="#666"
                                    value={pair.text}
                                    onChangeText={(val) => handleGalleryTextChange(index, val)}
                                />
                            </View>
                        ))}
                    </View>

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

    itemCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, width: '100%' },
    shareRow: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
    shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    shareBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
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
    subsectionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 24, marginBottom: 16 },
    mentorPhotoPreview: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    logoPreviewBox: { width: '100%', height: 90, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginTop: 8, overflow: 'hidden' },
    galleryPairCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
    galleryPhotoLabel: { fontSize: 10, fontWeight: '900', color: '#888', letterSpacing: 0.3 },
    galleryPhotoFilled: { width: '100%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden' },
    galleryPhotoEmpty: { width: '100%', aspectRatio: 1, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    galleryCloseBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2 },
    addBeneficioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },

    formActions: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
    cancelBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    saveBtn: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    inscricaoRow: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, width: '100%' },
});