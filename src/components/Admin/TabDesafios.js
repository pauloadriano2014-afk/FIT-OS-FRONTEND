// src/components/Admin/TabDesafios.js
//
// Aba MASTER-ONLY (Paulo/Adri) pra gerenciar Desafios/Projetos por
// WhatsApp (ex: Desafio 90 Dias). Cria/edita o desafio (nome, valor, link
// do grupo), e permite ver a lista de inscritas de cada um — separada do
// CRM/Alunos principal, como decidido.

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, Platform, ActivityIndicator, Switch, Image, Linking, Modal
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
    dataInicio: '',
    pontosPorItem: '1',
    pontosPorItemFimDeSemana: '1',
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

const DIAS_ABREV = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function dataParaISOSimples(dataISOString) {
    // Compara ignorando fuso/hora — a data vem em UTC do backend
    const d = new Date(dataISOString);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function formatDataDigitada(v) {
    const d = (v || '').replace(/\D/g, '').slice(0, 8);
    return d.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
}

function dataDigitadaParaISO(ddmmaaaa) {
    const [dia, mes, ano] = (ddmmaaaa || '').split('/');
    if (!dia || !mes || !ano || ano.length !== 4) return null;
    return `${ano}-${mes}-${dia}`;
}

function isoParaDataDigitada(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    // Usa componentes UTC — a data já vem normalizada pra meia-noite UTC,
    // então usar o fuso local aqui poderia "voltar" um dia (ex: Brasília).
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const ano = d.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
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

    // view: 'lista' | 'form' | 'inscritas' | 'checkins' | 'ranking' | 'datas-especiais'
    const [view, setView] = useState('lista');
    const [editingDesafio, setEditingDesafio] = useState(null);

    const [inscritasDesafio, setInscritasDesafio] = useState(null); // desafio selecionado
    const [inscricoes, setInscricoes] = useState([]);
    const [loadingInscricoes, setLoadingInscricoes] = useState(false);

    const [novoTesteNome, setNovoTesteNome] = useState('');
    const [novoTesteTelefone, setNovoTesteTelefone] = useState('');
    const [criandoTeste, setCriandoTeste] = useState(false);

    const [checkinsDesafio, setCheckinsDesafio] = useState(null);
    const [checkinsInscricoes, setCheckinsInscricoes] = useState([]);
    const [loadingCheckins, setLoadingCheckins] = useState(false);
    const [checkinDetalhe, setCheckinDetalhe] = useState(null); // { nome, entry } do dia selecionado
    const [togglingMissao, setTogglingMissao] = useState(false);
    const [deletingCheckin, setDeletingCheckin] = useState(false);

    const [rankingDesafio, setRankingDesafio] = useState(null);
    const [ranking, setRanking] = useState([]);
    const [rankingPeriodo, setRankingPeriodo] = useState({ inicioSemana: null, fimSemana: null });
    const [rankingOffset, setRankingOffset] = useState(0); // 0 = semana atual, -1 = semana passada, etc.
    const [loadingRanking, setLoadingRanking] = useState(false);
    const [rankingCopiado, setRankingCopiado] = useState(false);

    const [datasEspeciaisDesafio, setDatasEspeciaisDesafio] = useState(null);
    const [datasEspeciais, setDatasEspeciais] = useState([]);
    const [loadingDatasEspeciais, setLoadingDatasEspeciais] = useState(false);
    const [novaDataEspecial, setNovaDataEspecial] = useState('');
    const [novaDataPontos, setNovaDataPontos] = useState('2');
    const [novaDataMotivo, setNovaDataMotivo] = useState('');
    const [savingDataEspecial, setSavingDataEspecial] = useState(false);

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

    const openPreviewCheckin = (desafio) => {
        navigation?.navigate('DesafioCheckin', { desafio: desafio.slug, preview: true });
    };

    // ── Link público real (esse sim vai pro interessado, fora do app) ──────
    // 🔑 Link de compartilhamento é pra um cliente de verdade — nunca deve
    // depender de onde VOCÊ está testando o admin (localhost, preview, etc.).
    // Por isso sempre usa o domínio de produção, sem checar Platform.OS.
    const getBaseUrl = () => 'https://www.pauloadrianoteam.com.br';

    const getDesafioLink = (desafio) => `${getBaseUrl()}/Desafio?desafio=${encodeURIComponent(desafio.slug)}`;
    const getCheckinLink = (desafio) => `${getBaseUrl()}/CheckinDesafio?desafio=${encodeURIComponent(desafio.slug)}`;

    const [copiedId, setCopiedId] = useState(null);
    const [copiedCheckinId, setCopiedCheckinId] = useState(null);

    const handleCopyLink = async (desafio) => {
        const link = getDesafioLink(desafio);
        await Clipboard.setStringAsync(link);
        setCopiedId(desafio.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCopyLinkCheckin = async (desafio) => {
        const link = getCheckinLink(desafio);
        await Clipboard.setStringAsync(link);
        setCopiedCheckinId(desafio.id);
        setTimeout(() => setCopiedCheckinId(null), 2000);
    };

    const handleShareWhatsApp = (desafio) => {
        const link = getDesafioLink(desafio);
        const texto = `Oi! 💜 Quero te convidar pro *${desafio.nome}* — ${desafio.duracaoDias || 90} dias de disciplina, constância e evolução, junto com uma comunidade que compartilha o mesmo objetivo.\n\nDá uma olhada nos detalhes e nas vagas:\n${link}`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
        Linking.openURL(url).catch(() => {
            if (Platform.OS === 'web') window.open(url, '_blank');
        });
    };

    const handleShareWhatsAppCheckin = (desafio) => {
        const link = getCheckinLink(desafio);
        const texto = `📅 Meninas, esse é o link do check-in diário do *${desafio.nome}*!\n\nGuardem esse link — vocês vão usar ele TODO DIA até o fim do desafio pra registrar treino, cardio, alimentação, água e a foto do dia.\n\n${link}`;
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
            dataInicio: isoParaDataDigitada(desafio.dataInicio),
            pontosPorItem: String(desafio.pontosPorItem ?? 1),
            pontosPorItemFimDeSemana: String(desafio.pontosPorItemFimDeSemana ?? 1),
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
        setCheckinsDesafio(null);
        setRankingDesafio(null);
        setDatasEspeciaisDesafio(null);
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
                dataInicio: dataDigitadaParaISO(editingDesafio.dataInicio),
                pontosPorItem: parseInt(editingDesafio.pontosPorItem) || 1,
                pontosPorItemFimDeSemana: parseInt(editingDesafio.pontosPorItemFimDeSemana) || 2,
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

    // ── Inscrição de teste — testar check-in/fotos sem afetar o ranking ────
    const handleCriarTeste = async () => {
        if (!novoTesteNome.trim() || !novoTesteTelefone.trim()) {
            return Platform.OS === 'web' ? window.alert('Preencha nome e telefone.') : Alert.alert('Aviso', 'Preencha nome e telefone.');
        }
        setCriandoTeste(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/desafios/${inscritasDesafio.id}/criar-teste`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: novoTesteNome.trim(), telefone: novoTesteTelefone.trim() }),
            });
            if (res.ok) {
                setNovoTesteNome('');
                setNovoTesteTelefone('');
                await openInscritas(inscritasDesafio);
                const msg = `Inscrição de teste criada! Use o telefone ${novoTesteTelefone.trim()} pra se identificar na página de check-in.`;
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Pronto', msg);
            } else {
                const data = await res.json();
                Platform.OS === 'web' ? window.alert(data?.error || 'Erro ao criar teste.') : Alert.alert('Erro', data?.error || 'Erro ao criar teste.');
            }
        } catch (e) {
            console.log('Erro ao criar inscrição de teste', e);
        } finally {
            setCriandoTeste(false);
        }
    };

    // ── Excluir inscrição (ex: alguém que se inscreveu por engano, ou o
    // próprio admin que testou o pagamento de verdade em vez de usar o
    // "criar teste") — remove a inscrição e os check-ins dela junto ──────
    const handleDeleteInscricao = (inscricao) => {
        const confirmMsg = `Excluir a inscrição de "${inscricao.nome}"? Isso apaga também todos os check-ins dela. Não dá pra desfazer.`;
        const doDeleteInscricao = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/admin/desafios/${inscritasDesafio.id}/inscricoes/${inscricao.id}`, { method: 'DELETE' });
                if (res.ok) {
                    await openInscritas(inscritasDesafio);
                } else {
                    const data = await res.json();
                    Platform.OS === 'web' ? window.alert(data?.error || 'Erro ao excluir.') : Alert.alert('Erro', data?.error || 'Erro ao excluir.');
                }
            } catch (e) {
                console.log('Erro ao excluir inscrição', e);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) doDeleteInscricao();
            return;
        }
        Alert.alert('Excluir inscrição', confirmMsg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: doDeleteInscricao },
        ]);
    };

    // ── Ver check-ins (acompanhamento diário das participantes) ──────────────
    // ── Marcar/desmarcar missão cumprida (só admin, geralmente aos domingos) ──
    const handleSetMissaoPercentual = async (detalhe, percentual) => {
        setTogglingMissao(true);
        try {
            const dataISO = `${detalhe.data.getFullYear()}-${String(detalhe.data.getMonth() + 1).padStart(2, '0')}-${String(detalhe.data.getDate()).padStart(2, '0')}`;
            const res = await fetch(`${API_BASE}/api/admin/desafios/checkin-missao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inscricaoId: detalhe.inscricaoId, data: dataISO, missaoPercentual: percentual }),
            });
            if (res.ok) {
                const data = await res.json();
                setCheckinDetalhe((prev) => (prev ? { ...prev, entry: data.checkin } : prev));
                // Atualiza a lista principal também, pra tirinha refletir na hora
                if (checkinsDesafio) await openCheckins(checkinsDesafio);
            } else {
                const data = await res.json();
                Platform.OS === 'web' ? window.alert(data?.error || 'Erro ao marcar missão.') : Alert.alert('Erro', data?.error || 'Erro ao marcar missão.');
            }
        } catch (e) {
            console.log('Erro ao marcar missão', e);
        } finally {
            setTogglingMissao(false);
        }
    };

    // ── Excluir/invalidar um check-in específico (ex: registrado antes da
    // data de início real ser corrigida) ──────────────────────────────────
    const handleDeleteCheckin = (entry) => {
        const dataFormatada = new Date(entry.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const confirmMsg = `Excluir o check-in de ${dataFormatada}? Isso apaga o registro (fotos, itens marcados, pontos) desse dia específico. Não dá pra desfazer.`;

        const doDelete = async () => {
            setDeletingCheckin(true);
            try {
                const res = await fetch(`${API_BASE}/api/admin/desafios/checkin/${entry.id}`, { method: 'DELETE' });
                if (res.ok) {
                    setCheckinDetalhe(null);
                    if (checkinsDesafio) await openCheckins(checkinsDesafio);
                } else {
                    const data = await res.json();
                    Platform.OS === 'web' ? window.alert(data?.error || 'Erro ao excluir.') : Alert.alert('Erro', data?.error || 'Erro ao excluir.');
                }
            } catch (e) {
                console.log('Erro ao excluir check-in', e);
            } finally {
                setDeletingCheckin(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) doDelete();
            return;
        }
        Alert.alert('Excluir check-in', confirmMsg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: doDelete },
        ]);
    };

    const openCheckins = async (desafio) => {
        setCheckinsDesafio(desafio);
        setView('checkins');
        setLoadingCheckins(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/desafios/${desafio.id}/checkins`);
            if (res.ok) {
                const data = await res.json();
                setCheckinsInscricoes(data.inscricoes || []);
            }
        } catch (e) {
            console.log('Erro ao buscar check-ins', e);
        } finally {
            setLoadingCheckins(false);
        }
    };

    // ── Ranking semanal (só admin — a Adri copia e cola no grupo manualmente) ──
    const fetchRanking = async (desafio, offset) => {
        setLoadingRanking(true);
        try {
            // Calcula a segunda-feira da semana desejada a partir do offset
            // (0 = semana atual, -1 = semana passada...) em relação a hoje.
            const hoje = new Date();
            const diaSemana = hoje.getDay(); // 0=domingo
            const diffSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
            const segundaAtual = new Date(hoje);
            segundaAtual.setDate(hoje.getDate() - diffSegunda + offset * 7);
            const segundaISO = `${segundaAtual.getFullYear()}-${String(segundaAtual.getMonth() + 1).padStart(2, '0')}-${String(segundaAtual.getDate()).padStart(2, '0')}`;

            const res = await fetch(`${API_BASE}/api/admin/desafios/${desafio.id}/ranking?semana=${segundaISO}`);
            if (res.ok) {
                const data = await res.json();
                setRanking(data.ranking || []);
                setRankingPeriodo({ inicioSemana: data.inicioSemana, fimSemana: data.fimSemana });
            }
        } catch (e) {
            console.log('Erro ao buscar ranking', e);
        } finally {
            setLoadingRanking(false);
        }
    };

    const openRanking = async (desafio) => {
        setRankingDesafio(desafio);
        setView('ranking');
        setRankingOffset(0);
        await fetchRanking(desafio, 0);
    };

    const mudarSemanaRanking = async (novoOffset) => {
        setRankingOffset(novoOffset);
        await fetchRanking(rankingDesafio, novoOffset);
    };

    const MEDALHAS = ['🥇', '🥈', '🥉'];

    const gerarTextoRanking = () => {
        const formatarData = (iso) => {
            const d = new Date(iso);
            return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        };
        const periodo = rankingPeriodo.inicioSemana && rankingPeriodo.fimSemana
            ? `${formatarData(rankingPeriodo.inicioSemana)} a ${formatarData(rankingPeriodo.fimSemana)}`
            : '';

        let texto = `🏆 RANKING DA SEMANA — ${rankingDesafio?.nome}\n📅 ${periodo}\n\n`;
        ranking.forEach((r, i) => {
            const posicao = MEDALHAS[i] || `${i + 1}º`;
            texto += `${posicao} ${r.nome} — ${r.pontos} pts\n`;
        });
        texto += `\n💜 Constância é tudo! Continuem assim.`;
        return texto;
    };

    const handleCopiarRanking = async () => {
        await Clipboard.setStringAsync(gerarTextoRanking());
        setRankingCopiado(true);
        setTimeout(() => setRankingCopiado(false), 2500);
    };

    // ── Datas especiais (feriados etc. — pontuação com aviso prévio) ─────────
    const fetchDatasEspeciais = async (desafio) => {
        setLoadingDatasEspeciais(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/desafios/${desafio.id}/datas-especiais`);
            if (res.ok) {
                const data = await res.json();
                setDatasEspeciais(data.datas || []);
            }
        } catch (e) {
            console.log('Erro ao buscar datas especiais', e);
        } finally {
            setLoadingDatasEspeciais(false);
        }
    };

    const openDatasEspeciais = async (desafio) => {
        setDatasEspeciaisDesafio(desafio);
        setView('datas-especiais');
        setNovaDataEspecial('');
        setNovaDataPontos('2');
        setNovaDataMotivo('');
        await fetchDatasEspeciais(desafio);
    };

    const handleAddDataEspecial = async () => {
        const dataISO = dataDigitadaParaISO(novaDataEspecial);
        if (!dataISO) {
            return Platform.OS === 'web' ? window.alert('Digite a data no formato DD/MM/AAAA.') : Alert.alert('Aviso', 'Digite a data no formato DD/MM/AAAA.');
        }
        if (!novaDataPontos || parseInt(novaDataPontos) <= 0) {
            return Platform.OS === 'web' ? window.alert('Informe quantos pontos por item nesse dia.') : Alert.alert('Aviso', 'Informe quantos pontos por item nesse dia.');
        }
        if (!novaDataMotivo.trim()) {
            return Platform.OS === 'web' ? window.alert('Descreva o motivo (aparece no aviso pras participantes).') : Alert.alert('Aviso', 'Descreva o motivo.');
        }

        setSavingDataEspecial(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/desafios/${datasEspeciaisDesafio.id}/datas-especiais`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: dataISO, pontosPorItem: parseInt(novaDataPontos), motivo: novaDataMotivo.trim() }),
            });
            if (res.ok) {
                setNovaDataEspecial('');
                setNovaDataPontos('2');
                setNovaDataMotivo('');
                await fetchDatasEspeciais(datasEspeciaisDesafio);
            } else {
                const data = await res.json();
                Platform.OS === 'web' ? window.alert(data?.error || 'Erro ao salvar.') : Alert.alert('Erro', data?.error || 'Erro ao salvar.');
            }
        } catch (e) {
            console.log('Erro ao criar data especial', e);
        } finally {
            setSavingDataEspecial(false);
        }
    };

    const handleRemoveDataEspecial = async (dataId) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/desafios/${datasEspeciaisDesafio.id}/datas-especiais/${dataId}`, { method: 'DELETE' });
            if (res.ok) await fetchDatasEspeciais(datasEspeciaisDesafio);
        } catch (e) {
            console.log('Erro ao remover data especial', e);
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
                                <TouchableOpacity onPress={() => openInscritas(desafio)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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

                                {/* ── Gerenciar — ícones sempre com texto do lado, quebra linha no celular ── */}
                                <Text style={[styles.linkSectionLabel, { marginTop: 14 }]}>⚙️ GERENCIAR</Text>
                                <View style={styles.manageBtnRow}>
                                    <TouchableOpacity style={[styles.manageBtn, { borderColor: theme.border }]} onPress={() => openDatasEspeciais(desafio)}>
                                        <MaterialCommunityIcons name="calendar-star" size={15} color={theme.textSecondary} />
                                        <Text style={[styles.manageBtnText, { color: theme.textSecondary }]}>DATAS ESPECIAIS</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.manageBtn, { borderColor: theme.border }]} onPress={() => openRanking(desafio)}>
                                        <MaterialCommunityIcons name="trophy-outline" size={15} color={theme.textSecondary} />
                                        <Text style={[styles.manageBtnText, { color: theme.textSecondary }]}>RANKING</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.manageBtn, { borderColor: theme.border }]} onPress={() => openCheckins(desafio)}>
                                        <MaterialCommunityIcons name="calendar-check-outline" size={15} color={theme.textSecondary} />
                                        <Text style={[styles.manageBtnText, { color: theme.textSecondary }]}>VER CHECK-INS</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.manageBtn, { borderColor: theme.accent }]} onPress={() => openEditDesafio(desafio)}>
                                        <MaterialCommunityIcons name="pencil-outline" size={15} color={theme.accent} />
                                        <Text style={[styles.manageBtnText, { color: theme.accent }]}>EDITAR</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* ── Ativo/Inativo (com texto) + Excluir (separado, destrutivo) ── */}
                                <View style={styles.toggleDeleteRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Switch
                                            value={desafio.ativo}
                                            onValueChange={() => toggleAtivo(desafio)}
                                            trackColor={{ false: '#444', true: `${theme.accent}80` }}
                                            thumbColor={desafio.ativo ? theme.accent : '#888'}
                                        />
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>
                                            {desafio.ativo ? 'Desafio ativo' : 'Desafio inativo'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={styles.deleteBtnLabeled} onPress={() => handleDelete(desafio)}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={15} color="#FF3B30" />
                                        <Text style={{ color: '#FF3B30', fontSize: 10, fontWeight: '900', letterSpacing: 0.3 }}>EXCLUIR</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* ── Link de INSCRIÇÃO — pra divulgar e captar novas participantes ── */}
                                <Text style={[styles.linkSectionLabel, { marginTop: 14 }]}>📋 PÁGINA DE INSCRIÇÃO</Text>
                                <View style={styles.shareRow}>
                                    <TouchableOpacity style={[styles.shareBtnIcon, { borderColor: theme.border }]} onPress={() => openPreview(desafio)}>
                                        <MaterialCommunityIcons name="eye-outline" size={16} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: theme.border }]} onPress={() => handleCopyLink(desafio)}>
                                        <MaterialCommunityIcons name={copiedId === desafio.id ? 'check' : 'content-copy'} size={14} color={theme.textSecondary} />
                                        <Text style={[styles.shareBtnText, { color: theme.textSecondary }]}>
                                            {copiedId === desafio.id ? 'COPIADO!' : 'COPIAR LINK'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: '#25D366' }]} onPress={() => handleShareWhatsApp(desafio)}>
                                        <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
                                        <Text style={[styles.shareBtnText, { color: '#25D366' }]}>WHATSAPP</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* ── Link de CHECK-IN — o que a Adri manda UMA vez e fica fixo no grupo ── */}
                                <Text style={[styles.linkSectionLabel, { marginTop: 10 }]}>✅ PÁGINA DE CHECK-IN DIÁRIO</Text>
                                <View style={styles.shareRow}>
                                    <TouchableOpacity style={[styles.shareBtnIcon, { borderColor: theme.border }]} onPress={() => openPreviewCheckin(desafio)}>
                                        <MaterialCommunityIcons name="eye-outline" size={16} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: theme.border }]} onPress={() => handleCopyLinkCheckin(desafio)}>
                                        <MaterialCommunityIcons name={copiedCheckinId === desafio.id ? 'check' : 'content-copy'} size={14} color={theme.textSecondary} />
                                        <Text style={[styles.shareBtnText, { color: theme.textSecondary }]}>
                                            {copiedCheckinId === desafio.id ? 'COPIADO!' : 'COPIAR LINK'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: '#25D366' }]} onPress={() => handleShareWhatsAppCheckin(desafio)}>
                                        <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
                                        <Text style={[styles.shareBtnText, { color: '#25D366' }]}>WHATSAPP</Text>
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

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Data de início (Dia 1 do desafio)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        value={editingDesafio.dataInicio}
                        onChangeText={(v) => updateField('dataInicio', formatDataDigitada(v))}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                    <Text style={styles.helperText}>
                        Opcional. Preenchida, a página de check-in passa a mostrar "Dia X de {editingDesafio.duracaoDias || 90}" e só
                        aceita check-in dentro do período (início até início + duração). Deixe em branco pra não ter essa trava.
                    </Text>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 20 }]}>🏆 Multiplicador de pontuação por dia</Text>
                    <Text style={styles.helperText}>
                        Cada item já vale um valor fixo (Treino=10, Cardio=10, Água=5, Alimentação=10, Missão=15, Check-in=5).
                        O multiplicador abaixo aumenta ou diminui isso conforme o dia — 1 = sem alteração, 2 = dobra tudo.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.pontosFieldLabel}>Segunda a sexta</Text>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, textAlign: 'center' }]}
                                keyboardType="decimal-pad"
                                value={editingDesafio.pontosPorItem}
                                onChangeText={(v) => updateField('pontosPorItem', v)}
                                placeholder="1"
                                placeholderTextColor="#666"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.pontosFieldLabel}>Sábado e domingo</Text>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, textAlign: 'center' }]}
                                keyboardType="decimal-pad"
                                value={editingDesafio.pontosPorItemFimDeSemana}
                                onChangeText={(v) => updateField('pontosPorItemFimDeSemana', v)}
                                placeholder="1"
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>
                    <Text style={styles.helperText}>
                        Por padrão, todo dia vale 1x (sem bônus). Se quiser que o fim de semana valha mais — já que é
                        mais difícil manter a rotina — é só aumentar esse número (aceita decimal, ex: 1.5).
                    </Text>

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
    if (view === 'inscritas') {
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

                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>🧪 CRIAR INSCRIÇÃO DE TESTE</Text>
                    <Text style={styles.helperText}>
                        Cria uma participante fake (sem pagar de verdade) pra você testar o check-in e o upload de fotos.
                        Nunca aparece no ranking, mas fica marcada aqui como TESTE.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, width: '100%' }}>
                        <TextInput
                            style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                            value={novoTesteNome}
                            onChangeText={setNovoTesteNome}
                            placeholder="Seu nome"
                            placeholderTextColor="#666"
                        />
                        <TextInput
                            style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                            value={novoTesteTelefone}
                            onChangeText={setNovoTesteTelefone}
                            placeholder="Seu telefone"
                            placeholderTextColor="#666"
                            keyboardType="phone-pad"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.newBtn, { backgroundColor: theme.accent, marginTop: 10, marginBottom: 0, opacity: criandoTeste ? 0.6 : 1 }]}
                        onPress={handleCriarTeste}
                        disabled={criandoTeste}
                    >
                        {criandoTeste
                            ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" />
                            : <>
                                <MaterialCommunityIcons name="flask-outline" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                                <Text style={[styles.newBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>CRIAR TESTE</Text>
                            </>
                        }
                    </TouchableOpacity>
                    <View style={styles.subsectionDivider} />

                    {loadingInscricoes ? (
                        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 20, alignSelf: 'center', width: '100%' }} />
                    ) : inscricoes.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhuma inscrição ainda.</Text>
                    ) : (
                        <View style={{ width: '100%' }}>
                            {inscricoes.map((insc) => (
                                <View key={insc.id} style={[styles.inscricaoRow, { backgroundColor: theme.bg, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }]}>
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
                                            {insc.isTeste && (
                                                <View style={[styles.statusBadge, { backgroundColor: '#8B5CF620', borderColor: '#8B5CF6' }]}>
                                                    <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900' }}>TESTE</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.itemSlug, { color: theme.textSecondary }]}>{insc.email} · {insc.telefone}</Text>
                                        <Text style={[styles.itemSlug, { color: theme.textSecondary }]}>
                                            Nasc: {formatDataBR(insc.dataNascimento)} · Cadastro: {formatDataBR(insc.createdAt)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteInscricao(insc)} style={{ paddingLeft: 10 }}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        );
    }

    // ────────────────────────────────────────────────────────────────────
    // RENDER: CHECK-INS (acompanhamento diário — quem está em dia)
    // ────────────────────────────────────────────────────────────────────
    const renderComplianceStrip = (checkins) => {
        const dias = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const entry = checkins.find(c => dataParaISOSimples(c.data) === dISO);
            const feito = entry && (entry.treino || entry.cardio || entry.alimentacao || entry.agua || entry.missaoPercentual > 0);
            dias.push({ feito: !!feito, isHoje: i === 0, label: DIAS_ABREV[d.getDay()], entry: entry || null, data: new Date(d) });
        }
        const totalFeito = dias.filter(d => d.feito).length;
        return { dias, totalFeito };
    };

    // ── Quantos dias desde o último check-in feito (null = nenhum nos últimos
    // 14 dias que temos aqui) — usado pra identificar quem está sumindo ──────
    const diasSemCheckin = (checkins) => {
        const feitos = checkins.filter(c => c.treino || c.cardio || c.alimentacao || c.agua || c.missaoPercentual > 0);
        if (feitos.length === 0) return null;
        const maisRecente = feitos.reduce((max, c) => new Date(c.data) > new Date(max.data) ? c : max);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataUltimo = new Date(maisRecente.data);
        dataUltimo.setUTCHours(0, 0, 0, 0);
        return Math.floor((hoje - dataUltimo) / (1000 * 60 * 60 * 24));
    };

    const handleContatoWhatsApp = (insc) => {
        const numero = `55${(insc.telefone || '').replace(/\D/g, '')}`;
        const texto = `Oi, ${insc.nome.split(' ')[0]}! Tudo bem? Reparei que você não fez o check-in do desafio nos últimos dias — tá tudo certo aí? 💜`;
        const url = `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(texto)}`;
        Linking.openURL(url).catch(() => {
            if (Platform.OS === 'web') window.open(url, '_blank');
        });
    };

    if (view === 'checkins') {
        return (
            <View style={{ gap: 15 }}>
                <TouchableOpacity style={styles.backRow} onPress={backToList}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900' }}>VOLTAR PARA A LISTA</Text>
                </TouchableOpacity>

                <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                    <Text style={[styles.bigCardTitle, { color: theme.text }]}>CHECK-INS — {checkinsDesafio?.nome}</Text>
                    <Text style={[styles.pageDesc, { color: theme.textSecondary }]}>
                        Últimos 7 dias de cada participante paga. Bolinha preenchida = fez pelo menos um item do check-in naquele dia. Toque numa bolinha com dado pra ver fotos, peso e detalhes.
                    </Text>

                    {!loadingCheckins && checkinsInscricoes.length > 0 && (() => {
                        const sumindo = checkinsInscricoes
                            .map((insc) => ({ insc, dias: diasSemCheckin(insc.checkins || []) }))
                            .filter(({ dias }) => dias === null || dias >= 3)
                            .sort((a, b) => (b.dias ?? 999) - (a.dias ?? 999));

                        if (sumindo.length === 0) return null;

                        return (
                            <View style={styles.alertaBox}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FFB800" />
                                    <Text style={styles.alertaTitulo}>PRECISAM DE ATENÇÃO (3+ dias sem check-in)</Text>
                                </View>
                                {sumindo.map(({ insc, dias }) => (
                                    <View key={insc.id} style={styles.alertaRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.itemNome, { color: theme.text, fontSize: 13 }]}>{insc.nome}</Text>
                                            <Text style={{ color: '#FFB800', fontSize: 11, fontWeight: '700' }}>
                                                {dias === null ? 'Sem check-ins registrados' : `${dias} dias sem check-in`}
                                            </Text>
                                        </View>
                                        <TouchableOpacity style={styles.alertaWhatsBtn} onPress={() => handleContatoWhatsApp(insc)}>
                                            <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        );
                    })()}

                    {loadingCheckins ? (
                        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 20, alignSelf: 'center', width: '100%' }} />
                    ) : checkinsInscricoes.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhuma participante paga ainda.</Text>
                    ) : (
                        <View style={{ width: '100%' }}>
                            {checkinsInscricoes.map((insc) => {
                                const { dias, totalFeito } = renderComplianceStrip(insc.checkins || []);
                                return (
                                    <View key={insc.id} style={[styles.inscricaoRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={[styles.itemNome, { color: theme.text, fontSize: 13 }]}>{insc.nome}</Text>
                                                {insc.isTeste && (
                                                    <View style={[styles.statusBadge, { backgroundColor: '#8B5CF620', borderColor: '#8B5CF6' }]}>
                                                        <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900' }}>TESTE</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={{ color: totalFeito >= 5 ? '#4DE38F' : totalFeito >= 3 ? '#FFCC00' : '#FF3B30', fontSize: 11, fontWeight: '900' }}>
                                                {totalFeito}/7 dias
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                            {dias.map((d, i) => (
                                                <TouchableOpacity
                                                    key={i}
                                                    style={{ alignItems: 'center', gap: 4 }}
                                                    disabled={!d.entry && d.label !== 'D'}
                                                    onPress={() => setCheckinDetalhe({ nome: insc.nome, inscricaoId: insc.id, label: d.label, data: d.data, entry: d.entry })}
                                                >
                                                    <View style={[
                                                        styles.checkinDot,
                                                        { borderColor: theme.border },
                                                        d.feito && { backgroundColor: theme.accent, borderColor: theme.accent },
                                                        d.isHoje && !d.feito && { borderColor: theme.accent, borderWidth: 2 },
                                                        !d.entry && d.label === 'D' && { borderColor: '#8B5CF680', borderStyle: 'dashed' },
                                                    ]}>
                                                        {d.feito ? <MaterialCommunityIcons name="check" size={11} color={theme.isDark ? '#000' : '#FFF'} /> : null}
                                                    </View>
                                                    <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: '700' }}>{d.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* ── Modal de detalhe: fotos, peso e itens de um dia específico ── */}
                <Modal visible={!!checkinDetalhe} transparent animationType="fade" onRequestClose={() => setCheckinDetalhe(null)}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <View>
                                        <Text style={[styles.itemNome, { color: theme.text, fontSize: 15 }]}>{checkinDetalhe?.nome}</Text>
                                        {checkinDetalhe?.data && (
                                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                                {checkinDetalhe.data.toLocaleDateString('pt-BR')}
                                                {checkinDetalhe.entry ? ` · ${checkinDetalhe.entry.pontos} pts` : ''}
                                            </Text>
                                        )}
                                    </View>
                                    <TouchableOpacity onPress={() => setCheckinDetalhe(null)}>
                                        <MaterialCommunityIcons name="close-circle" size={26} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {checkinDetalhe?.entry ? (
                                    <View style={styles.detalheItensGrid}>
                                        {[
                                            { label: 'Treino', ok: checkinDetalhe.entry.treino },
                                            { label: 'Cardio', ok: checkinDetalhe.entry.cardio },
                                            { label: 'Alimentação', ok: checkinDetalhe.entry.alimentacao },
                                            { label: 'Água', ok: checkinDetalhe.entry.agua },
                                        ].map((item, i) => (
                                            <View key={i} style={styles.detalheItemChip}>
                                                <MaterialCommunityIcons
                                                    name={item.ok ? 'check-circle' : 'close-circle-outline'}
                                                    size={14}
                                                    color={item.ok ? '#4DE38F' : '#666'}
                                                />
                                                <Text style={{ color: item.ok ? theme.text : theme.textSecondary, fontSize: 11 }}>{item.label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        Ela não enviou check-in nesse dia.
                                    </Text>
                                )}

                                {/* 🎯 Missão — só a Adri marca, e só faz sentido aos domingos. Aparece
                                    MESMO SEM check-in, pra dar pra pontuar quem sumiu no domingo mas
                                    ainda assim fez a missão (ou parte dela) por fora. */}
                                {checkinDetalhe?.label === 'D' && (
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                            🎯 Quanto da missão semanal ela cumpriu?
                                        </Text>
                                        <View style={styles.missaoPercentRow}>
                                            {[0, 25, 50, 75, 100].map((p) => {
                                                const ativo = (checkinDetalhe.entry?.missaoPercentual || 0) === p;
                                                const ptsDessaOpcao = Math.round(15 * (p / 100));
                                                return (
                                                    <TouchableOpacity
                                                        key={p}
                                                        style={[
                                                            styles.missaoPercentBtn,
                                                            { borderColor: ativo ? '#4DE38F' : theme.border },
                                                            ativo && { backgroundColor: '#4DE38F15' },
                                                        ]}
                                                        onPress={() => handleSetMissaoPercentual(checkinDetalhe, p)}
                                                        disabled={togglingMissao}
                                                    >
                                                        <Text style={{ color: ativo ? '#4DE38F' : theme.text, fontSize: 12, fontWeight: '900' }}>{p}%</Text>
                                                        <Text style={{ color: ativo ? '#4DE38F' : theme.textSecondary, fontSize: 9 }}>{ptsDessaOpcao} pts</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                        {togglingMissao && <ActivityIndicator size="small" color={theme.accent} style={{ marginTop: 8 }} />}
                                    </View>
                                )}

                                {checkinDetalhe?.entry && (
                                    <>
                                        {checkinDetalhe.entry.pesoKg != null && (
                                            <Text style={[styles.helperText, { fontSize: 13, color: theme.text, marginTop: 12, fontWeight: '900' }]}>
                                                ⚖️ Peso registrado: {checkinDetalhe.entry.pesoKg} kg
                                            </Text>
                                        )}

                                        <View style={styles.detalheFotosGrid}>
                                            {checkinDetalhe.entry.fotoAcademiaUrl && (
                                                <View style={styles.detalheFotoBox}>
                                                    <Text style={styles.fotoSlotLabel}>Treino</Text>
                                                    <Image source={{ uri: checkinDetalhe.entry.fotoAcademiaUrl }} style={styles.detalheFotoImg} />
                                                </View>
                                            )}
                                            {checkinDetalhe.entry.fotoFrenteUrl && (
                                                <View style={styles.detalheFotoBox}>
                                                    <Text style={styles.fotoSlotLabel}>Frente</Text>
                                                    <Image source={{ uri: checkinDetalhe.entry.fotoFrenteUrl }} style={styles.detalheFotoImg} />
                                                </View>
                                            )}
                                            {checkinDetalhe.entry.fotoLadoUrl && (
                                                <View style={styles.detalheFotoBox}>
                                                    <Text style={styles.fotoSlotLabel}>Lado</Text>
                                                    <Image source={{ uri: checkinDetalhe.entry.fotoLadoUrl }} style={styles.detalheFotoImg} />
                                                </View>
                                            )}
                                            {checkinDetalhe.entry.fotoCostasUrl && (
                                                <View style={styles.detalheFotoBox}>
                                                    <Text style={styles.fotoSlotLabel}>Costas</Text>
                                                    <Image source={{ uri: checkinDetalhe.entry.fotoCostasUrl }} style={styles.detalheFotoImg} />
                                                </View>
                                            )}
                                        </View>

                                        {!checkinDetalhe.entry.fotoAcademiaUrl && !checkinDetalhe.entry.fotoFrenteUrl && (
                                            <Text style={[styles.emptyText, { color: theme.textSecondary, marginTop: 10 }]}>Nenhuma foto enviada nesse dia.</Text>
                                        )}

                                        <View style={styles.subsectionDivider} />
                                        <TouchableOpacity
                                            style={styles.excluirCheckinBtn}
                                            onPress={() => handleDeleteCheckin(checkinDetalhe.entry)}
                                            disabled={deletingCheckin}
                                        >
                                            {deletingCheckin ? (
                                                <ActivityIndicator size="small" color="#FF3B30" />
                                            ) : (
                                                <>
                                                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                                                    <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: '900', letterSpacing: 0.3 }}>EXCLUIR ESTE CHECK-IN</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <Text style={styles.helperText}>
                                            Use isso pra invalidar um check-in feito por engano (ex: antes da data de início real ser corrigida). Não dá pra desfazer.
                                        </Text>
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    // ────────────────────────────────────────────────────────────────────
    // RENDER: RANKING (só admin — vira texto pra Adri colar no grupo)
    // ────────────────────────────────────────────────────────────────────
    const formatarPeriodoRanking = () => {
        if (!rankingPeriodo.inicioSemana) return '';
        const formatarData = (iso) => {
            const d = new Date(iso);
            return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        };
        return `${formatarData(rankingPeriodo.inicioSemana)} a ${formatarData(rankingPeriodo.fimSemana)}`;
    };

    if (view === 'ranking') {
        return (
            <View style={{ gap: 15 }}>
                <TouchableOpacity style={styles.backRow} onPress={backToList}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900' }}>VOLTAR PARA A LISTA</Text>
                </TouchableOpacity>

                <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                    <Text style={[styles.bigCardTitle, { color: theme.text }]}>🏆 RANKING — {rankingDesafio?.nome}</Text>
                    <Text style={[styles.pageDesc, { color: theme.textSecondary }]}>
                        Visível só pra vocês dois. Copie o texto formatado e cole no grupo quando quiser divulgar.
                    </Text>

                    <View style={styles.weekNavRow}>
                        <TouchableOpacity onPress={() => mudarSemanaRanking(rankingOffset - 1)} style={styles.weekNavBtn}>
                            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.weekNavLabel, { color: theme.text }]}>
                            {formatarPeriodoRanking()}{rankingOffset === 0 ? ' (essa semana)' : ''}
                        </Text>
                        <TouchableOpacity
                            onPress={() => mudarSemanaRanking(rankingOffset + 1)}
                            style={styles.weekNavBtn}
                            disabled={rankingOffset >= 0}
                        >
                            <MaterialCommunityIcons name="chevron-right" size={22} color={rankingOffset >= 0 ? theme.border : theme.text} />
                        </TouchableOpacity>
                    </View>

                    {loadingRanking ? (
                        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 20, alignSelf: 'center', width: '100%' }} />
                    ) : ranking.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhuma participante paga ainda.</Text>
                    ) : (
                        <>
                            <View style={{ width: '100%', marginTop: 10 }}>
                                {ranking.map((r, i) => (
                                    <View key={r.inscricaoId} style={[styles.rankingRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={styles.rankingPos}>{MEDALHAS[i] || `${i + 1}º`}</Text>
                                        <Text style={[styles.itemNome, { color: theme.text, fontSize: 13, flex: 1 }]}>{r.nome}</Text>
                                        <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '900' }}>{r.pontos} pts</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={[styles.copyRankingBtn, { backgroundColor: theme.accent }]} onPress={handleCopiarRanking}>
                                <MaterialCommunityIcons name={rankingCopiado ? 'check' : 'content-copy'} size={16} color={theme.isDark ? '#000' : '#FFF'} />
                                <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 12 }}>
                                    {rankingCopiado ? 'COPIADO!' : 'COPIAR RANKING PRO WHATSAPP'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    }

    // ────────────────────────────────────────────────────────────────────
    // RENDER: DATAS ESPECIAIS (feriados — pontuação com aviso prévio)
    // ────────────────────────────────────────────────────────────────────
    return (
        <View style={{ gap: 15 }}>
            <TouchableOpacity style={styles.backRow} onPress={backToList}>
                <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900' }}>VOLTAR PARA A LISTA</Text>
            </TouchableOpacity>

            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>📅 DATAS ESPECIAIS — {datasEspeciaisDesafio?.nome}</Text>
                <Text style={[styles.pageDesc, { color: theme.textSecondary }]}>
                    Feriados ou datas comemorativas com pontuação diferente. Assim que cadastrar, a página de
                    check-in já avisa as participantes com antecedência — não precisa avisar por fora.
                </Text>

                <View style={styles.subsectionDivider} />
                <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>NOVA DATA ESPECIAL</Text>

                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Data</Text>
                <TextInput
                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    value={novaDataEspecial}
                    onChangeText={(v) => setNovaDataEspecial(formatDataDigitada(v))}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={10}
                />

                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>Multiplicador nesse dia</Text>
                <TextInput
                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    value={novaDataPontos}
                    onChangeText={setNovaDataPontos}
                    placeholder="2"
                    placeholderTextColor="#666"
                    keyboardType="decimal-pad"
                />
                <Text style={styles.helperText}>1 = sem alteração, 2 = dobra a pontuação de cada item nesse dia. Aceita decimal.</Text>

                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>Motivo (aparece no aviso pras participantes)</Text>
                <TextInput
                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    value={novaDataMotivo}
                    onChangeText={setNovaDataMotivo}
                    placeholder="Ex: Feriado de 7 de setembro"
                    placeholderTextColor="#666"
                />

                <TouchableOpacity
                    style={[styles.newBtn, { backgroundColor: theme.accent, marginTop: 16, opacity: savingDataEspecial ? 0.6 : 1 }]}
                    onPress={handleAddDataEspecial}
                    disabled={savingDataEspecial}
                >
                    {savingDataEspecial
                        ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" />
                        : <>
                            <MaterialCommunityIcons name="plus" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.newBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>ADICIONAR DATA</Text>
                        </>
                    }
                </TouchableOpacity>

                <View style={styles.subsectionDivider} />
                <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13, marginBottom: 10 }]}>DATAS CADASTRADAS</Text>

                {loadingDatasEspeciais ? (
                    <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 10, alignSelf: 'center', width: '100%' }} />
                ) : datasEspeciais.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhuma data especial cadastrada ainda.</Text>
                ) : (
                    <View style={{ width: '100%' }}>
                        {datasEspeciais.map((d) => {
                            const dISO = dataParaISOSimples(d.data);
                            const jaPassou = dISO < dataParaISOSimples(new Date().toISOString());
                            return (
                                <View key={d.id} style={[styles.inscricaoRow, { backgroundColor: theme.bg, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', opacity: jaPassou ? 0.5 : 1 }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.itemNome, { color: theme.text, fontSize: 13 }]}>
                                            {new Date(d.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} — {d.pontosPorItem} pts/item
                                        </Text>
                                        <Text style={[styles.itemSlug, { color: theme.textSecondary }]}>{d.motivo}{jaPassou ? ' (já passou)' : ''}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleRemoveDataEspecial(d.id)}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
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
    linkSectionLabel: { fontSize: 10, fontWeight: '900', color: '#888', letterSpacing: 0.5, marginBottom: 6 },
    manageBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
    manageBtnText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.2 },
    toggleDeleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
    deleteBtnLabeled: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#FF3B3040' },
    shareRow: { flexDirection: 'row', gap: 8 },
    shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    shareBtnIcon: { width: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1 },
    shareBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
    itemNome: { fontSize: 15, fontWeight: '900' },
    itemSlug: { fontSize: 11, marginTop: 2 },
    itemMeta: { fontSize: 11, marginTop: 4, fontWeight: '700' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },

    backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },

    inputLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
    saasInput: { width: '100%', padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 13 },
    helperText: { fontSize: 10, fontStyle: 'italic', color: '#888', marginTop: 6 },
    pontosFieldLabel: { fontSize: 10, fontWeight: '700', color: '#888', marginBottom: 4, textAlign: 'center' },

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
    checkinDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

    alertaBox: { width: '100%', backgroundColor: '#FFB80012', borderWidth: 1, borderColor: '#FFB80050', borderRadius: 16, padding: 16, marginBottom: 16 },
    alertaTitulo: { color: '#FFB800', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    alertaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#FFB80025' },
    alertaWhatsBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#25D36650', justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { width: '100%', maxWidth: 420, maxHeight: '85%', borderRadius: 20, borderWidth: 1, padding: 20 },
    detalheItensGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    detalheItemChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    missaoPercentRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    missaoPercentBtn: { flex: 1, alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
    excluirCheckinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#FF3B3040', borderRadius: 12, paddingVertical: 12, marginBottom: 6 },
    detalheFotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
    detalheFotoBox: { width: '47%' },
    detalheFotoImg: { width: '100%', aspectRatio: 9 / 16, borderRadius: 10, marginTop: 4, backgroundColor: '#000' },
    fotoSlotLabel: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },

    weekNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 12 },
    weekNavBtn: { padding: 6 },
    weekNavLabel: { fontSize: 13, fontWeight: '900' },

    rankingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8, width: '100%' },
    rankingPos: { fontSize: 16, fontWeight: '900', width: 32, textAlign: 'center' },
    copyRankingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 16, width: '100%' },
});