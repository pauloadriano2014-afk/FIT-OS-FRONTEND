// src/components/Admin/TabProdutos.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, Platform, ActivityIndicator, Switch, Image, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { PAULO_ID, ADRI_ID } from '../../constants/masterIds';

const API_BASE = 'https://fitos-final.onrender.com';

const MASTER_OPTIONS = [
    { id: PAULO_ID, label: 'Paulo' },
    { id: ADRI_ID, label: 'Adri' },
];

const emptyProduto = (defaultCoachId) => ({
    id: null,
    slug: '',
    nome: '',
    descricao: '',
    capaUrl: '',
    valor: '',
    precoDe: '',
    coachId: defaultCoachId,
    linkEntrega: '',
    ativo: true,
    videoUrl: '',
    videoOrientacao: 'vertical',
    beneficios: '',
    imagensExtra: [],
    orderBumpProdutoIds: [],
    depoimentos: [],
    antesDepois: [],
    faq: [],
    treinoPrograma: { duracaoSemanas: '', treinos: [] },
    cursoPrograma: { modulos: [] },
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

// \ud83d\udd27 Aceita valores digitados de qualquer jeito ("R$ 19,90", "19,90", "19.90",
// "1.234,56") \u2014 remove s\u00edmbolos/espa\u00e7os e normaliza pro formato que o
// parseFloat entende. Sem isso, "R$ 19,90" virava NaN \u2192 JSON.stringify
// transformava em null \u2192 backend recusava o produto como se o valor
// estivesse vazio.
function parseValorInput(v) {
    if (v === null || v === undefined) return NaN;
    let cleaned = String(v).replace(/[^\d.,]/g, '').trim();
    if (!cleaned) return NaN;
    if (cleaned.includes(',')) {
        // Formato BR: pontos s\u00e3o separador de milhar, v\u00edrgula \u00e9 decimal
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(cleaned);
}

function formatBRL(v) {
    return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export default function TabProdutos({ theme, currentUserId, navigation }) {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingCapa, setUploadingCapa] = useState(false);

    // view: 'lista' | 'form'
    const [view, setView] = useState('lista');
    const [editingProduto, setEditingProduto] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const fetchProdutos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/produtos`);
            if (res.ok) {
                const data = await res.json();
                setProdutos(data.produtos || []);
            }
        } catch (e) {
            console.log('Erro ao buscar produtos', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔥 PAINEL DE VENDAS — receita total, vendas confirmadas, taxa de
    // conversão e ranking dos produtos que mais vendem. Puramente informativo,
    // não bloqueia a lista se falhar.
    const [dashboard, setDashboard] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);

    const fetchDashboard = useCallback(async () => {
        setLoadingDashboard(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/produtos/dashboard`);
            if (res.ok) setDashboard(await res.json());
        } catch (e) {
            console.log('Erro ao buscar dashboard de produtos', e);
        } finally {
            setLoadingDashboard(false);
        }
    }, []);

    useEffect(() => { fetchProdutos(); fetchDashboard(); }, [fetchProdutos, fetchDashboard]);

    const getBaseUrl = () => 'https://www.pauloadrianoteam.com.br';
    const getProdutoLink = (produto) => `${getBaseUrl()}/Produto?id=${encodeURIComponent(produto.slug)}`;

    const handleCopyLink = async (produto) => {
        const link = getProdutoLink(produto);
        await Clipboard.setStringAsync(link);
        setCopiedId(produto.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShareWhatsApp = (produto) => {
        const link = getProdutoLink(produto);
        const texto = `Oie! 💜 O meu novo material "${produto.nome}" já está disponível!\n\nDá uma vista de olhos em tudo o que preparei para ti e garante o teu acesso aqui:\n${link}`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
        Linking.openURL(url).catch(() => {
            if (Platform.OS === 'web') window.open(url, '_blank');
        });
    };

    const openNewProduto = () => {
        setEditingProduto(emptyProduto(currentUserId || MASTER_OPTIONS[0].id));
        setView('form');
    };

    const openEditProduto = (produto) => {
        let imagensExtra = [];
        try {
            imagensExtra = produto.imagensExtra ? JSON.parse(produto.imagensExtra) : [];
        } catch (e) {
            imagensExtra = [];
        }
        let orderBumpProdutoIds = [];
        try {
            orderBumpProdutoIds = produto.orderBumpProdutoIds ? JSON.parse(produto.orderBumpProdutoIds) : [];
        } catch (e) {
            orderBumpProdutoIds = [];
        }
        let depoimentos = [];
        try {
            depoimentos = produto.depoimentos ? JSON.parse(produto.depoimentos) : [];
        } catch (e) {
            depoimentos = [];
        }
        let antesDepois = [];
        try {
            antesDepois = produto.antesDepois ? JSON.parse(produto.antesDepois) : [];
        } catch (e) {
            antesDepois = [];
        }
        let faq = [];
        try {
            faq = produto.faq ? JSON.parse(produto.faq) : [];
        } catch (e) {
            faq = [];
        }
        let treinoPrograma = { duracaoSemanas: '', treinos: [] };
        try {
            if (produto.treinoPrograma) {
                const parsed = JSON.parse(produto.treinoPrograma);
                treinoPrograma = {
                    duracaoSemanas: parsed.duracaoSemanas || '',
                    treinos: Array.isArray(parsed.treinos) ? parsed.treinos : [],
                };
            }
        } catch (e) {
            treinoPrograma = { duracaoSemanas: '', treinos: [] };
        }
        let cursoPrograma = { modulos: [] };
        try {
            if (produto.cursoPrograma) {
                const parsed = JSON.parse(produto.cursoPrograma);
                cursoPrograma = { modulos: Array.isArray(parsed.modulos) ? parsed.modulos : [] };
            }
        } catch (e) {
            cursoPrograma = { modulos: [] };
        }
        setEditingProduto({
            ...produto,
            valor: String(produto.valor),
            precoDe: produto.precoDe ? String(produto.precoDe) : '',
            descricao: produto.descricao || '',
            capaUrl: produto.capaUrl || '',
            linkEntrega: produto.linkEntrega || '',
            videoUrl: produto.videoUrl || '',
            videoOrientacao: produto.videoOrientacao || 'vertical',
            beneficios: produto.beneficios || '',
            imagensExtra,
            orderBumpProdutoIds,
            depoimentos,
            antesDepois,
            faq,
            treinoPrograma,
            cursoPrograma,
        });
        setView('form');
    };

    const toggleOrderBumpProduto = (id) => {
        setEditingProduto(prev => {
            const atual = prev.orderBumpProdutoIds || [];
            const jaTem = atual.includes(id);
            return { ...prev, orderBumpProdutoIds: jaTem ? atual.filter(x => x !== id) : [...atual, id] };
        });
    };

    const backToList = () => {
        setEditingProduto(null);
        setView('lista');
    };

    const updateField = (field, value) => {
        setEditingProduto(prev => ({ ...prev, [field]: value }));
    };

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

    const handlePickCapa = async () => {
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4], // Proporção ideal para capas de e-books
                quality: 0.8,
            });
            if (!result.canceled) {
                setUploadingCapa(true);
                const url = await uploadImageToR2(result.assets[0].uri);
                updateField('capaUrl', url);
            }
        } catch (e) {
            console.log('Erro ao enviar capa', e);
            Platform.OS === 'web' ? window.alert('Falha ao enviar a capa.') : Alert.alert('Erro', 'Falha ao enviar a capa.');
        } finally {
            setUploadingCapa(false);
        }
    };

    // 🔥 PRÉVIA VISUAL: imagens extras (prints/páginas do material), além da
    // capa principal — mostradas como carrossel na página de vendas pública.
    const handlePickImagemExtra = async () => {
        try {
            const atual = editingProduto.imagensExtra || [];
            if (atual.length >= 6) {
                return Platform.OS === 'web' ? window.alert('Máximo de 6 imagens de prévia.') : Alert.alert('Aviso', 'Máximo de 6 imagens de prévia.');
            }
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 5],
                quality: 0.8,
            });
            if (!result.canceled) {
                setUploadingCapa(true);
                const url = await uploadImageToR2(result.assets[0].uri);
                updateField('imagensExtra', [...atual, url]);
            }
        } catch (e) {
            console.log('Erro ao enviar imagem de prévia', e);
            Platform.OS === 'web' ? window.alert('Falha ao enviar a imagem.') : Alert.alert('Erro', 'Falha ao enviar a imagem.');
        } finally {
            setUploadingCapa(false);
        }
    };

    const handleRemoveImagemExtra = (index) => {
        const atual = editingProduto.imagensExtra || [];
        updateField('imagensExtra', atual.filter((_, i) => i !== index));
    };

    // 🔥 DEPOIMENTOS: prova social opcional — cada item vira um card com foto,
    // nome, estrelas e o texto. Se a lista ficar vazia, a seção some da página.
    const addDepoimento = () => {
        setEditingProduto(prev => ({ ...prev, depoimentos: [...(prev.depoimentos || []), { nome: '', texto: '', fotoUrl: '', estrelas: 5 }] }));
    };
    const updateDepoimentoField = (index, field, value) => {
        setEditingProduto(prev => {
            const lista = [...(prev.depoimentos || [])];
            lista[index] = { ...lista[index], [field]: value };
            return { ...prev, depoimentos: lista };
        });
    };
    const removeDepoimento = (index) => {
        setEditingProduto(prev => ({ ...prev, depoimentos: (prev.depoimentos || []).filter((_, i) => i !== index) }));
    };
    const handlePickDepoimentoFoto = async (index) => {
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
                setUploadingCapa(true);
                const url = await uploadImageToR2(result.assets[0].uri);
                updateDepoimentoField(index, 'fotoUrl', url);
            }
        } catch (e) {
            console.log('Erro ao enviar foto do depoimento', e);
            Platform.OS === 'web' ? window.alert('Falha ao enviar a foto.') : Alert.alert('Erro', 'Falha ao enviar a foto.');
        } finally {
            setUploadingCapa(false);
        }
    };

    // 🔥 ANTES E DEPOIS: pares de imagem opcionais, com legenda — prova visual
    // de resultado. Se a lista ficar vazia, a seção some da página.
    const addAntesDepois = () => {
        setEditingProduto(prev => ({ ...prev, antesDepois: [...(prev.antesDepois || []), { antesUrl: '', depoisUrl: '', legenda: '' }] }));
    };
    const updateAntesDepoisField = (index, field, value) => {
        setEditingProduto(prev => {
            const lista = [...(prev.antesDepois || [])];
            lista[index] = { ...lista[index], [field]: value };
            return { ...prev, antesDepois: lista };
        });
    };
    const removeAntesDepois = (index) => {
        setEditingProduto(prev => ({ ...prev, antesDepois: (prev.antesDepois || []).filter((_, i) => i !== index) }));
    };
    const handlePickAntesDepoisImagem = async (index, campo) => {
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });
            if (!result.canceled) {
                setUploadingCapa(true);
                const url = await uploadImageToR2(result.assets[0].uri);
                updateAntesDepoisField(index, campo, url);
            }
        } catch (e) {
            console.log('Erro ao enviar imagem de antes/depois', e);
            Platform.OS === 'web' ? window.alert('Falha ao enviar a imagem.') : Alert.alert('Erro', 'Falha ao enviar a imagem.');
        } finally {
            setUploadingCapa(false);
        }
    };

    // 🔥 FAQ: perguntas e respostas opcionais. Se a lista ficar vazia, a seção
    // some da página.
    const addFaqItem = () => {
        setEditingProduto(prev => ({ ...prev, faq: [...(prev.faq || []), { pergunta: '', resposta: '' }] }));
    };
    const updateFaqField = (index, field, value) => {
        setEditingProduto(prev => {
            const lista = [...(prev.faq || [])];
            lista[index] = { ...lista[index], [field]: value };
            return { ...prev, faq: lista };
        });
    };
    const removeFaqItem = (index) => {
        setEditingProduto(prev => ({ ...prev, faq: (prev.faq || []).filter((_, i) => i !== index) }));
    };

    // 🔥 ABAS DO FORMULÁRIO DE PRODUTO — o formulário inteiro (dados básicos +
    // página de vendas + treino + curso) virava um scroll gigante empilhado.
    // Agora é dividido em 4 abas horizontais no topo, cada uma mostrando só a
    // sua parte.
    const [formTab, setFormTab] = useState('basico'); // 'basico' | 'vendas' | 'treino' | 'curso'

    // 🔥 PROGRAMA DE TREINO INTERATIVO: opcional — dias (treinos) com
    // exercícios estruturados. Se ficar vazio, o produto continua entregando
    // só o link/PDF estático de sempre.
    const [jsonImportText, setJsonImportText] = useState('');
    const [jsonImportAberto, setJsonImportAberto] = useState(false);

    const handleImportJson = () => {
        try {
            const parsed = JSON.parse(jsonImportText);
            if (!parsed || !Array.isArray(parsed.treinos)) {
                throw new Error('formato inválido');
            }
            setEditingProduto(prev => ({
                ...prev,
                treinoPrograma: { duracaoSemanas: parsed.duracaoSemanas || '', treinos: parsed.treinos },
            }));
            setJsonImportText('');
            setJsonImportAberto(false);
            const msg = 'Programa importado! Revise os treinos abaixo antes de guardar.';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sucesso', msg);
        } catch (e) {
            const msg = 'JSON inválido. Confira se colou o conteúdo completo, sem cortar nada.';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
        }
    };

    const addTreinoDia = () => {
        setEditingProduto(prev => ({
            ...prev,
            treinoPrograma: {
                ...(prev.treinoPrograma || { duracaoSemanas: '', treinos: [] }),
                treinos: [...((prev.treinoPrograma || {}).treinos || []), { nome: '', foco: '', descanso: '60-90s', exercicios: [] }],
            },
        }));
    };
    const updateTreinoDiaField = (idx, field, value) => {
        setEditingProduto(prev => {
            const treinos = [...(prev.treinoPrograma?.treinos || [])];
            treinos[idx] = { ...treinos[idx], [field]: value };
            return { ...prev, treinoPrograma: { ...prev.treinoPrograma, treinos } };
        });
    };
    const removeTreinoDia = (idx) => {
        setEditingProduto(prev => ({
            ...prev,
            treinoPrograma: { ...prev.treinoPrograma, treinos: (prev.treinoPrograma?.treinos || []).filter((_, i) => i !== idx) },
        }));
    };
    const addExercicio = (treinoIdx) => {
        setEditingProduto(prev => {
            const treinos = [...(prev.treinoPrograma?.treinos || [])];
            const exercicios = [...(treinos[treinoIdx].exercicios || []), { nome: '', seriesRepeticoes: '', muscPrincipal: [], muscSecundario: [], orientacao: '', videoUrl: '' }];
            treinos[treinoIdx] = { ...treinos[treinoIdx], exercicios };
            return { ...prev, treinoPrograma: { ...prev.treinoPrograma, treinos } };
        });
    };
    const updateExercicioField = (treinoIdx, exIdx, field, value) => {
        setEditingProduto(prev => {
            const treinos = [...(prev.treinoPrograma?.treinos || [])];
            const exercicios = [...(treinos[treinoIdx].exercicios || [])];
            exercicios[exIdx] = { ...exercicios[exIdx], [field]: value };
            treinos[treinoIdx] = { ...treinos[treinoIdx], exercicios };
            return { ...prev, treinoPrograma: { ...prev.treinoPrograma, treinos } };
        });
    };
    const removeExercicio = (treinoIdx, exIdx) => {
        setEditingProduto(prev => {
            const treinos = [...(prev.treinoPrograma?.treinos || [])];
            treinos[treinoIdx] = { ...treinos[treinoIdx], exercicios: (treinos[treinoIdx].exercicios || []).filter((_, i) => i !== exIdx) };
            return { ...prev, treinoPrograma: { ...prev.treinoPrograma, treinos } };
        });
    };

    // 🔥 CURSO / ÁREA DE MEMBROS: opcional — módulos com aulas em vídeo. Cada
    // módulo tem `liberacaoDias` (quantos dias após a compra ele libera) — por
    // pedido do Paulo, pra proteger contra reembolso abusivo durante os 7 dias
    // de garantia (o conteúdo libera aos poucos, não tudo de uma vez).
    const [cursoJsonImportText, setCursoJsonImportText] = useState('');
    const [cursoJsonImportAberto, setCursoJsonImportAberto] = useState(false);

    const handleImportCursoJson = () => {
        try {
            const parsed = JSON.parse(cursoJsonImportText);
            if (!parsed || !Array.isArray(parsed.modulos)) {
                throw new Error('formato inválido');
            }
            setEditingProduto(prev => ({ ...prev, cursoPrograma: { modulos: parsed.modulos } }));
            setCursoJsonImportText('');
            setCursoJsonImportAberto(false);
            const msg = 'Curso importado! Revise os módulos abaixo antes de guardar.';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sucesso', msg);
        } catch (e) {
            const msg = 'JSON inválido. Confira se colou o conteúdo completo, sem cortar nada.';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
        }
    };

    const addCursoModulo = () => {
        setEditingProduto(prev => ({
            ...prev,
            cursoPrograma: {
                ...(prev.cursoPrograma || { modulos: [] }),
                modulos: [...((prev.cursoPrograma || {}).modulos || []), { nome: '', liberacaoDias: '0', aulas: [] }],
            },
        }));
    };
    const updateCursoModuloField = (idx, field, value) => {
        setEditingProduto(prev => {
            const modulos = [...(prev.cursoPrograma?.modulos || [])];
            modulos[idx] = { ...modulos[idx], [field]: value };
            return { ...prev, cursoPrograma: { ...prev.cursoPrograma, modulos } };
        });
    };
    const removeCursoModulo = (idx) => {
        setEditingProduto(prev => ({
            ...prev,
            cursoPrograma: { ...prev.cursoPrograma, modulos: (prev.cursoPrograma?.modulos || []).filter((_, i) => i !== idx) },
        }));
    };
    const addCursoAula = (moduloIdx) => {
        setEditingProduto(prev => {
            const modulos = [...(prev.cursoPrograma?.modulos || [])];
            const aulas = [...(modulos[moduloIdx].aulas || []), { nome: '', descricao: '', videoUrl: '', videoOrientacao: 'vertical', anexoUrl: '' }];
            modulos[moduloIdx] = { ...modulos[moduloIdx], aulas };
            return { ...prev, cursoPrograma: { ...prev.cursoPrograma, modulos } };
        });
    };
    const updateCursoAulaField = (moduloIdx, aulaIdx, field, value) => {
        setEditingProduto(prev => {
            const modulos = [...(prev.cursoPrograma?.modulos || [])];
            const aulas = [...(modulos[moduloIdx].aulas || [])];
            aulas[aulaIdx] = { ...aulas[aulaIdx], [field]: value };
            modulos[moduloIdx] = { ...modulos[moduloIdx], aulas };
            return { ...prev, cursoPrograma: { ...prev.cursoPrograma, modulos } };
        });
    };
    const removeCursoAula = (moduloIdx, aulaIdx) => {
        setEditingProduto(prev => {
            const modulos = [...(prev.cursoPrograma?.modulos || [])];
            modulos[moduloIdx] = { ...modulos[moduloIdx], aulas: (modulos[moduloIdx].aulas || []).filter((_, i) => i !== aulaIdx) };
            return { ...prev, cursoPrograma: { ...prev.cursoPrograma, modulos } };
        });
    };

    // 🔥 PRÉ-VISUALIZAR TREINO: gera um link de treino interativo sem custo
    // (sem passar por pagamento nenhum) pra conferir como a página fica
    // enquanto ainda está montando o programa. A pré-visualização lê o
    // treinoPrograma do banco, então salva o produto primeiro.
    const [previewLoading, setPreviewLoading] = useState(false);

    const abrirPreviewTreino = async (produtoId) => {
        setPreviewLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/produtos/${produtoId}/treino-preview`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                const msg = data?.error || 'Erro ao gerar pré-visualização.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
                return;
            }
            if (Platform.OS === 'web') {
                window.open(data.url, '_blank');
            } else {
                Linking.openURL(data.url);
            }
        } catch (e) {
            console.log('Erro ao pré-visualizar treino', e);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSave = async (options = {}) => {
        if (!editingProduto.nome.trim()) {
            return Platform.OS === 'web' ? window.alert('Dê um nome ao produto.') : Alert.alert('Aviso', 'Dê um nome ao produto.');
        }
        const valorNumerico = parseValorInput(editingProduto.valor);
        if (!editingProduto.valor || isNaN(valorNumerico) || valorNumerico <= 0) {
            return Platform.OS === 'web' ? window.alert('Informe um valor válido (ex: 19,90).') : Alert.alert('Aviso', 'Informe um valor válido (ex: 19,90).');
        }
        // 🔥 O link de entrega só é obrigatório se o produto NÃO tiver um
        // programa de treino interativo ou curso configurado — nesses casos a
        // tela interativa/área de membros é a entrega oficial, então não
        // existe (nem faz sentido pedir) um link fixo.
        const temTreinoInterativo = (editingProduto.treinoPrograma?.treinos?.length || 0) > 0;
        const temCurso = (editingProduto.cursoPrograma?.modulos?.length || 0) > 0;
        if (!temTreinoInterativo && !temCurso && !(editingProduto.linkEntrega || '').trim()) {
            return Platform.OS === 'web' ? window.alert('Insira o link de entrega (Google Drive, PDF, etc).') : Alert.alert('Aviso', 'Insira o link de entrega.');
        }

        setSaving(true);
        try {
            const isEditing = !!editingProduto.id;
            const url = isEditing
                ? `${API_BASE}/api/admin/produtos/${editingProduto.id}`
                : `${API_BASE}/api/admin/produtos`;
            const method = isEditing ? 'PATCH' : 'POST';

            const body = {
                nome: editingProduto.nome,
                slug: isEditing ? undefined : (editingProduto.slug || slugifyLocal(editingProduto.nome)),
                descricao: editingProduto.descricao,
                capaUrl: editingProduto.capaUrl,
                valor: valorNumerico,
                precoDe: (() => {
                    const p = parseValorInput(editingProduto.precoDe);
                    return editingProduto.precoDe && !isNaN(p) ? p : null;
                })(),
                coachId: editingProduto.coachId,
                linkEntrega: editingProduto.linkEntrega,
                ativo: editingProduto.ativo,
                videoUrl: (editingProduto.videoUrl || '').trim() || null,
                videoOrientacao: (editingProduto.videoUrl || '').trim() ? (editingProduto.videoOrientacao || 'vertical') : null,
                beneficios: editingProduto.beneficios || null,
                imagensExtra: JSON.stringify(editingProduto.imagensExtra || []),
                orderBumpProdutoIds: JSON.stringify(editingProduto.orderBumpProdutoIds || []),
                depoimentos: JSON.stringify(editingProduto.depoimentos || []),
                antesDepois: JSON.stringify(editingProduto.antesDepois || []),
                faq: JSON.stringify(editingProduto.faq || []),
                treinoPrograma: (editingProduto.treinoPrograma?.treinos?.length > 0)
                    ? JSON.stringify({
                        duracaoSemanas: editingProduto.treinoPrograma.duracaoSemanas || null,
                        treinos: editingProduto.treinoPrograma.treinos,
                    })
                    : null,
                cursoPrograma: (editingProduto.cursoPrograma?.modulos?.length > 0)
                    ? JSON.stringify({
                        modulos: editingProduto.cursoPrograma.modulos.map((m) => ({
                            ...m,
                            liberacaoDias: Number(m.liberacaoDias) || 0,
                        })),
                    })
                    : null,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                const msg = data?.error || 'Erro ao guardar produto.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
                return;
            }

            // 🔥 Pré-visualizar não sai da tela de edição — só salva (pra
            // garantir que a pré-visualização reflete a versão mais recente
            // do programa de treino) e abre o link em seguida.
            if (options.preview) {
                const produtoId = data.produto?.id || editingProduto.id;
                setEditingProduto(prev => ({ ...prev, id: produtoId }));
                await fetchProdutos();
                await abrirPreviewTreino(produtoId);
                return;
            }

            Platform.OS === 'web' ? window.alert('Produto guardado com sucesso!') : Alert.alert('Sucesso', 'Produto guardado com sucesso!');
            await fetchProdutos();
            backToList();
        } catch (e) {
            console.log('Erro ao guardar produto', e);
        } finally {
            setSaving(false);
        }
    };

    const handlePreviewTreino = () => handleSave({ preview: true });

    const handleDelete = async (produto) => {
        const confirmMsg = `Apagar "${produto.nome}"?`;
        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) await doDelete(produto.id);
            return;
        }
        Alert.alert('Apagar produto', confirmMsg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Apagar', style: 'destructive', onPress: () => doDelete(produto.id) },
        ]);
    };

    const doDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/produtos/${id}`, { method: 'DELETE' });
            if (res.ok) fetchProdutos();
        } catch (e) {
            console.log('Erro ao apagar', e);
        }
    };

    const toggleAtivo = async (produto) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/produtos/${produto.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ativo: !produto.ativo }),
            });
            if (res.ok) fetchProdutos();
        } catch (e) {
            console.log('Erro ao alternar ativo', e);
        }
    };

    if (view === 'lista') {
        return (
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>PRODUTOS DIGITAIS E E-BOOKS</Text>
                <Text style={[styles.pageDesc, { color: theme.textSecondary }]}>
                    Crie páginas de vendas exclusivas para e-books, planilhas ou guias com entrega automática via e-mail ou WhatsApp após a confirmação do PIX.
                </Text>

                {/* 🔥 PAINEL DE VENDAS */}
                {loadingDashboard ? (
                    <ActivityIndicator size="small" color={theme.accent} style={{ marginBottom: 20, alignSelf: 'center' }} />
                ) : dashboard ? (
                    <View style={styles.dashboardWrap}>
                        <View style={styles.dashboardGrid}>
                            <View style={[styles.dashboardCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <Text style={[styles.dashboardValue, { color: theme.accent }]} numberOfLines={1}>R$ {formatBRL(dashboard.receitaTotal)}</Text>
                                <Text style={[styles.dashboardLabel, { color: theme.textSecondary }]}>RECEITA TOTAL</Text>
                            </View>
                            <View style={[styles.dashboardCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <Text style={[styles.dashboardValue, { color: theme.text }]}>{dashboard.totalVendas}</Text>
                                <Text style={[styles.dashboardLabel, { color: theme.textSecondary }]}>VENDAS CONFIRMADAS</Text>
                            </View>
                            <View style={[styles.dashboardCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <Text style={[styles.dashboardValue, { color: theme.text }]}>{Math.round(dashboard.taxaConversao)}%</Text>
                                <Text style={[styles.dashboardLabel, { color: theme.textSecondary }]}>TAXA DE CONVERSÃO</Text>
                            </View>
                            <View style={[styles.dashboardCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <Text style={[styles.dashboardValue, { color: theme.text }]} numberOfLines={1}>
                                    {dashboard.produtoMaisVendido?.nome || '—'}
                                </Text>
                                <Text style={[styles.dashboardLabel, { color: theme.textSecondary }]}>MAIS VENDIDO</Text>
                            </View>
                        </View>

                        {dashboard.totalPendentes > 0 ? (
                            <Text style={[styles.dashboardPendentes, { color: theme.textSecondary }]}>
                                + {dashboard.totalPendentes} carrinho{dashboard.totalPendentes > 1 ? 's' : ''} pendente{dashboard.totalPendentes > 1 ? 's' : ''} aguardando pagamento
                            </Text>
                        ) : null}
                    </View>
                ) : null}

                <TouchableOpacity style={[styles.newBtn, { backgroundColor: theme.accent }]} onPress={openNewProduto}>
                    <MaterialCommunityIcons name="plus" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                    <Text style={[styles.newBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>NOVO PRODUTO</Text>
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 30, alignSelf: 'center', width: '100%' }} />
                ) : produtos.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum produto criado ainda.</Text>
                ) : (
                    <View style={{ width: '100%' }}>
                        {produtos.map((produto) => (
                            <View key={produto.id} style={[styles.itemCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={{ flexDirection: 'row', gap: 14 }}>
                                    <View style={[styles.capaPreviewMini, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                        {produto.capaUrl ? (
                                            <Image source={{ uri: produto.capaUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                        ) : (
                                            <MaterialCommunityIcons name="book-open-page-variant" size={24} color={theme.textSecondary} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                            <Text style={[styles.itemNome, { color: theme.text }]} numberOfLines={1}>{produto.nome}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: produto.ativo ? '#4DE38F20' : '#66666620', borderColor: produto.ativo ? '#4DE38F' : '#666' }]}>
                                                <Text style={{ color: produto.ativo ? '#4DE38F' : '#888', fontSize: 9, fontWeight: '900' }}>
                                                    {produto.ativo ? 'ATIVO' : 'INATIVO'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.itemSlug, { color: theme.textSecondary }]} numberOfLines={1}>
                                            ?id={produto.slug} · R$ {formatBRL(produto.valor)}
                                        </Text>
                                        <Text style={[styles.itemMeta, { color: theme.accent }]}>
                                            {produto._count?.vendas || 0} venda(s) efetuada(s)
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.actionIconsRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Switch
                                            value={produto.ativo}
                                            onValueChange={() => toggleAtivo(produto)}
                                            trackColor={{ false: '#444', true: `${theme.accent}80` }}
                                            thumbColor={produto.ativo ? theme.accent : '#888'}
                                            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                                        />
                                        <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '700' }}>Visível</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                                        {/* Futuro: Abrir Preview do Produto */}
                                        <TouchableOpacity onPress={() => openEditProduto(produto)}>
                                            <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(produto)}>
                                            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.shareRow}>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: theme.border }]} onPress={() => handleCopyLink(produto)}>
                                        <MaterialCommunityIcons name={copiedId === produto.id ? 'check' : 'content-copy'} size={14} color={theme.textSecondary} />
                                        <Text style={[styles.shareBtnText, { color: theme.textSecondary }]}>
                                            {copiedId === produto.id ? 'LINK COPIADO!' : 'COPIAR LINK'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: '#25D366' }]} onPress={() => handleShareWhatsApp(produto)}>
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

    if (view === 'form') {
        return (
            <View style={{ gap: 15 }}>
                <TouchableOpacity style={styles.backRow} onPress={backToList}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900' }}>VOLTAR PARA A LISTA</Text>
                </TouchableOpacity>

                <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                    <Text style={[styles.bigCardTitle, { color: theme.text }]}>
                        {editingProduto.id ? 'EDITAR PRODUTO' : 'NOVO PRODUTO DIGITAL'}
                    </Text>

                    {/* 🔥 ABAS DO FORMULÁRIO — horizontal, moderna: cada aba mostra só a sua
                        parte, em vez de empilhar tudo num scroll só. */}
                    <View style={styles.formTabsRow}>
                        {[
                            { id: 'basico', label: 'BÁSICO', icon: 'file-document-edit-outline' },
                            { id: 'vendas', label: 'VENDAS', icon: 'rocket-launch-outline' },
                            { id: 'treino', label: 'TREINO', icon: 'dumbbell', dot: (editingProduto.treinoPrograma?.treinos?.length || 0) > 0 },
                            { id: 'curso', label: 'CURSO', icon: 'school-outline', dot: (editingProduto.cursoPrograma?.modulos?.length || 0) > 0 },
                        ].map((tab) => {
                            const active = formTab === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.formTabBtn, active && { borderBottomColor: theme.accent }]}
                                    onPress={() => setFormTab(tab.id)}
                                    activeOpacity={0.8}
                                >
                                    <MaterialCommunityIcons name={tab.icon} size={17} color={active ? theme.accent : theme.textSecondary} />
                                    <Text style={{ color: active ? theme.accent : theme.textSecondary, fontWeight: '900', fontSize: 11, letterSpacing: 0.3 }}>
                                        {tab.label}
                                    </Text>
                                    {!!tab.dot && <View style={[styles.formTabDot, { backgroundColor: theme.accent }]} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {formTab === 'basico' && (
                    <>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Nome do Produto</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        value={editingProduto.nome}
                        onChangeText={(v) => updateField('nome', v)}
                        placeholder="Ex: Guia Completo de Glúteos"
                        placeholderTextColor="#666"
                    />

                    {!editingProduto.id && (
                        <>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Slug (usado no link: ?id=slug)</Text>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                value={editingProduto.slug}
                                onChangeText={(v) => updateField('slug', slugifyLocal(v))}
                                placeholder={slugifyLocal(editingProduto.nome) || 'gerado a partir do nome'}
                                placeholderTextColor="#666"
                            />
                        </>
                    )}

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Descrição do Produto</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 100 }]}
                        multiline
                        value={editingProduto.descricao}
                        onChangeText={(v) => updateField('descricao', v)}
                        placeholder="O que a aluna vai aprender ou receber ao adquirir este produto..."
                        placeholderTextColor="#666"
                    />

                    <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Preço "De" (opcional)</Text>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                keyboardType="numeric"
                                value={editingProduto.precoDe}
                                onChangeText={(v) => updateField('precoDe', v)}
                                placeholder="47,00"
                                placeholderTextColor="#666"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Valor (R$)</Text>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                keyboardType="numeric"
                                value={editingProduto.valor}
                                onChangeText={(v) => updateField('valor', v)}
                                placeholder="9,90"
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>
                    <Text style={styles.helperText}>Preenchendo o "De", a página mostra esse valor riscado acima do preço final — reforça que é uma oferta.</Text>
                    </>
                    )}

                    {formTab === 'vendas' && (
                    <>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Benefícios (um por linha)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 110 }]}
                        multiline
                        value={editingProduto.beneficios}
                        onChangeText={(v) => updateField('beneficios', v)}
                        placeholder={'Ex:\nGuia completo em PDF de 40 páginas\nTreinos prontos para 4 semanas\nAcesso imediato após o pagamento'}
                        placeholderTextColor="#666"
                    />
                    <Text style={styles.helperText}>Aparece como lista "O que você vai receber" na página de vendas — um item por linha.</Text>

                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>PRÉVIA VISUAL DO CONTEÚDO</Text>
                    <Text style={styles.helperText}>Prints ou páginas do material, mostrados como carrossel abaixo da capa (máx. 6).</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                        {(editingProduto.imagensExtra || []).map((url, index) => (
                            <View key={`${url}-${index}`} style={[styles.previaThumb, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                                <Image source={{ uri: url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                <TouchableOpacity
                                    style={styles.previaRemoveBtn}
                                    onPress={() => handleRemoveImagemExtra(index)}
                                >
                                    <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {(editingProduto.imagensExtra || []).length < 6 && (
                            <TouchableOpacity
                                style={[styles.previaAddBtn, { borderColor: theme.accent }]}
                                onPress={handlePickImagemExtra}
                                disabled={uploadingCapa}
                            >
                                {uploadingCapa
                                    ? <ActivityIndicator size="small" color={theme.accent} />
                                    : <MaterialCommunityIcons name="plus" size={22} color={theme.accent} />
                                }
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>VÍDEO DE APRESENTAÇÃO (OPCIONAL)</Text>
                    <Text style={styles.helperText}>Cole o link do YouTube ou o link de embed do Cloudflare Stream. Aparece logo abaixo da descrição, na página de vendas.</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginTop: 8 }]}
                        value={editingProduto.videoUrl}
                        onChangeText={(v) => updateField('videoUrl', v)}
                        placeholder="Ex: https://youtu.be/... ou https://customer-xxxx.cloudflarestream.com/.../iframe"
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                    />
                    {!!editingProduto.videoUrl && (
                        <>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>Formato do vídeo</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                                {[
                                    { id: 'vertical', label: '9:16 · Vertical' },
                                    { id: 'horizontal', label: '16:9 · Horizontal' },
                                ].map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.coachOption,
                                            { borderColor: theme.border },
                                            editingProduto.videoOrientacao === opt.id && { backgroundColor: `${theme.accent}20`, borderColor: theme.accent },
                                        ]}
                                        onPress={() => updateField('videoOrientacao', opt.id)}
                                    >
                                        <Text style={{ color: editingProduto.videoOrientacao === opt.id ? theme.accent : theme.textSecondary, fontWeight: '900', fontSize: 12 }}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.helperText}>O player se adapta automaticamente à proporção escolhida. A vertical (9:16) é a mais usada — ideal pra gravações feitas no celular.</Text>
                        </>
                    )}
                    </>
                    )}

                    {formTab === 'basico' && (
                    <>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>
                        Link de Entrega do Material{((editingProduto.treinoPrograma?.treinos?.length || 0) > 0 || (editingProduto.cursoPrograma?.modulos?.length || 0) > 0) ? ' (opcional)' : ''}
                    </Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        value={editingProduto.linkEntrega}
                        onChangeText={(v) => updateField('linkEntrega', v)}
                        placeholder="Ex: Link do Google Drive, PDF, Notion..."
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                    />
                    <Text style={styles.helperText}>
                        {(editingProduto.treinoPrograma?.treinos?.length || 0) > 0
                            ? 'Opcional aqui: como o produto já tem um programa de treino interativo, a tela interativa é a entrega oficial e o PDF é gerado automaticamente a partir dela. Preencha este campo só se quiser oferecer um link extra.'
                            : (editingProduto.cursoPrograma?.modulos?.length || 0) > 0
                                ? 'Opcional aqui: como o produto já tem um curso/área de membros configurado, ela é a entrega oficial. Preencha este campo só se quiser oferecer um link extra.'
                                : 'A aluna receberá este link imediatamente após a confirmação do pagamento via PIX.'}
                    </Text>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Dono do Produto (conta de cobrança)</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        {MASTER_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[
                                    styles.coachOption,
                                    { borderColor: theme.border },
                                    editingProduto.coachId === opt.id && { backgroundColor: `${theme.accent}20`, borderColor: theme.accent },
                                ]}
                                onPress={() => updateField('coachId', opt.id)}
                            >
                                <Text style={{ color: editingProduto.coachId === opt.id ? theme.accent : theme.textSecondary, fontWeight: '900', fontSize: 12 }}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>FOTO DE CAPA DO E-BOOK</Text>
                    <Text style={styles.helperText}>Será usada como vitrine do seu produto.</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
                        <View style={[styles.capaPreviewGrande, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                            {editingProduto.capaUrl
                                ? <Image source={{ uri: editingProduto.capaUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                : <MaterialCommunityIcons name="image-plus" size={36} color={theme.textSecondary} />
                            }
                        </View>
                        <View>
                            <TouchableOpacity
                                style={{ backgroundColor: theme.bg, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.accent, marginBottom: 8 }}
                                onPress={handlePickCapa}
                                disabled={uploadingCapa}
                            >
                                {uploadingCapa
                                    ? <ActivityIndicator size="small" color={theme.accent} />
                                    : <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900' }}>{editingProduto.capaUrl ? 'TROCAR CAPA' : 'ADICIONAR CAPA'}</Text>
                                }
                            </TouchableOpacity>
                            {editingProduto.capaUrl ? (
                                <TouchableOpacity onPress={() => updateField('capaUrl', '')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                                    <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: 'bold' }}>Remover Capa</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                    </>
                    )}

                    {formTab === 'vendas' && (
                    <>
                    {/* 🔥 ESTRATÉGIA DE VENDAS: ORDER BUMP MULTI-ITEM */}
                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.accent, fontSize: 13 }]}>🚀 ORDER BUMP (OFERTAS EXTRAS NO CHECKOUT)</Text>
                    <Text style={styles.helperText}>
                        Marque outros produtos já cadastrados pra oferecer no checkout deste. A cliente pode marcar quantos quiser — cada um é entregue automaticamente (o link dele) assim que o PIX for confirmado, junto com o produto principal.
                    </Text>

                    <View style={[styles.bumpCardConfig, { backgroundColor: 'rgba(139,92,246,0.05)', borderColor: theme.border }]}>
                        {produtos.filter(p => p.id !== editingProduto.id).length === 0 ? (
                            <Text style={{ color: theme.textSecondary, fontSize: 12, fontStyle: 'italic' }}>
                                Cadastre outros produtos primeiro pra poder oferecê-los aqui como upsell.
                            </Text>
                        ) : (
                            produtos.filter(p => p.id !== editingProduto.id).map((p) => {
                                const marcado = (editingProduto.orderBumpProdutoIds || []).includes(p.id);
                                return (
                                    <TouchableOpacity
                                        key={p.id}
                                        activeOpacity={0.7}
                                        onPress={() => toggleOrderBumpProduto(p.id)}
                                        style={[
                                            styles.bumpOptionRow,
                                            { borderColor: theme.border },
                                            marcado && { borderColor: theme.accent, backgroundColor: `${theme.accent}15` },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={marcado ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                            size={22}
                                            color={marcado ? theme.accent : theme.textSecondary}
                                        />
                                        <View style={[styles.capaPreviewMini, { width: 34, height: 44, borderColor: theme.border, backgroundColor: theme.bg }]}>
                                            {p.capaUrl ? (
                                                <Image source={{ uri: p.capaUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                            ) : (
                                                <MaterialCommunityIcons name="book-open-page-variant" size={16} color={theme.textSecondary} />
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{p.nome}</Text>
                                            <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900' }}>R$ {formatBRL(p.valor)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>

                    {/* 🔥 DEPOIMENTOS */}
                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>💬 DEPOIMENTOS (PROVA SOCIAL)</Text>
                    <Text style={styles.helperText}>Opcional — se não adicionar nenhum, essa seção some da página.</Text>

                    {(editingProduto.depoimentos || []).map((dep, index) => (
                        <View key={index} style={[styles.itemFormCard, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <TouchableOpacity onPress={() => handlePickDepoimentoFoto(index)} disabled={uploadingCapa} style={[styles.avatarPicker, { borderColor: theme.border }]}>
                                    {dep.fotoUrl
                                        ? <Image source={{ uri: dep.fotoUrl }} style={{ width: '100%', height: '100%', borderRadius: 28 }} />
                                        : <MaterialCommunityIcons name="account-circle-outline" size={28} color={theme.textSecondary} />
                                    }
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.saasInput, { flex: 1, backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    value={dep.nome}
                                    onChangeText={(v) => updateDepoimentoField(index, 'nome', v)}
                                    placeholder="Nome da aluna"
                                    placeholderTextColor="#666"
                                />
                                <TouchableOpacity onPress={() => removeDepoimento(index)}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 4, marginTop: 10 }}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <TouchableOpacity key={n} onPress={() => updateDepoimentoField(index, 'estrelas', n)}>
                                        <MaterialCommunityIcons name={n <= (dep.estrelas || 5) ? 'star' : 'star-outline'} size={20} color="#FFD700" />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, height: 70, marginTop: 10 }]}
                                multiline
                                value={dep.texto}
                                onChangeText={(v) => updateDepoimentoField(index, 'texto', v)}
                                placeholder="O que a aluna disse sobre o produto..."
                                placeholderTextColor="#666"
                            />
                        </View>
                    ))}
                    <TouchableOpacity style={[styles.addItemBtn, { borderColor: theme.accent }]} onPress={addDepoimento}>
                        <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>ADICIONAR DEPOIMENTO</Text>
                    </TouchableOpacity>

                    {/* 🔥 ANTES E DEPOIS */}
                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>📸 ANTES E DEPOIS (RESULTADOS)</Text>
                    <Text style={styles.helperText}>Opcional — se não adicionar nenhum par, essa seção some da página.</Text>

                    {(editingProduto.antesDepois || []).map((par, index) => (
                        <View key={index} style={[styles.itemFormCard, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '900', marginBottom: 6 }}>ANTES</Text>
                                    <TouchableOpacity onPress={() => handlePickAntesDepoisImagem(index, 'antesUrl')} disabled={uploadingCapa} style={[styles.antesDepoisSlot, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                        {par.antesUrl
                                            ? <Image source={{ uri: par.antesUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 8 }} />
                                            : <MaterialCommunityIcons name="image-plus" size={22} color={theme.textSecondary} />
                                        }
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '900', marginBottom: 6 }}>DEPOIS</Text>
                                    <TouchableOpacity onPress={() => handlePickAntesDepoisImagem(index, 'depoisUrl')} disabled={uploadingCapa} style={[styles.antesDepoisSlot, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                        {par.depoisUrl
                                            ? <Image source={{ uri: par.depoisUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 8 }} />
                                            : <MaterialCommunityIcons name="image-plus" size={22} color={theme.textSecondary} />
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, marginTop: 10 }]}
                                value={par.legenda}
                                onChangeText={(v) => updateAntesDepoisField(index, 'legenda', v)}
                                placeholder="Legenda (opcional) — Ex: 8 semanas seguindo o guia"
                                placeholderTextColor="#666"
                            />
                            <TouchableOpacity onPress={() => removeAntesDepois(index)} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={[styles.addItemBtn, { borderColor: theme.accent }]} onPress={addAntesDepois}>
                        <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>ADICIONAR ANTES/DEPOIS</Text>
                    </TouchableOpacity>

                    {/* 🔥 FAQ */}
                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 }]}>❓ PERGUNTAS FREQUENTES (FAQ)</Text>
                    <Text style={styles.helperText}>Opcional — se não adicionar nenhuma pergunta, essa seção some da página.</Text>

                    {(editingProduto.faq || []).map((item, index) => (
                        <View key={index} style={[styles.itemFormCard, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <TextInput
                                    style={[styles.saasInput, { flex: 1, backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    value={item.pergunta}
                                    onChangeText={(v) => updateFaqField(index, 'pergunta', v)}
                                    placeholder="Pergunta (ex: Como recebo o material?)"
                                    placeholderTextColor="#666"
                                />
                                <TouchableOpacity onPress={() => removeFaqItem(index)}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, height: 70, marginTop: 10 }]}
                                multiline
                                value={item.resposta}
                                onChangeText={(v) => updateFaqField(index, 'resposta', v)}
                                placeholder="Resposta"
                                placeholderTextColor="#666"
                            />
                        </View>
                    ))}
                    <TouchableOpacity style={[styles.addItemBtn, { borderColor: theme.accent }]} onPress={addFaqItem}>
                        <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>ADICIONAR PERGUNTA</Text>
                    </TouchableOpacity>
                    </>
                    )}

                    {formTab === 'treino' && (
                    <>
                    <Text style={styles.helperText}>
                        Se preencher, quem comprar ganha acesso a uma página de treino interativa — com os dias estruturados, vídeo por exercício, check-in de sessão e registro de carga — em vez de só o link/PDF estático de cima.
                    </Text>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Duração do protocolo (semanas)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, maxWidth: 120 }]}
                        keyboardType="numeric"
                        value={String(editingProduto.treinoPrograma?.duracaoSemanas || '')}
                        onChangeText={(v) => setEditingProduto(prev => ({ ...prev, treinoPrograma: { ...(prev.treinoPrograma || { treinos: [] }), duracaoSemanas: v } }))}
                        placeholder="8"
                        placeholderTextColor="#666"
                    />

                    <TouchableOpacity style={[styles.jsonImportToggle, { borderColor: theme.border }]} onPress={() => setJsonImportAberto(!jsonImportAberto)}>
                        <MaterialCommunityIcons name={jsonImportAberto ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textSecondary} />
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '900' }}>COLAR PROGRAMA PRONTO (JSON)</Text>
                    </TouchableOpacity>
                    {jsonImportAberto && (
                        <View style={{ width: '100%', marginTop: 8 }}>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 100 }]}
                                multiline
                                value={jsonImportText}
                                onChangeText={setJsonImportText}
                                placeholder="Cole aqui o JSON do programa de treino..."
                                placeholderTextColor="#666"
                                autoCapitalize="none"
                            />
                            <TouchableOpacity style={[styles.addItemBtn, { borderColor: theme.accent, marginTop: 8 }]} onPress={handleImportJson}>
                                <MaterialCommunityIcons name="tray-arrow-down" size={16} color={theme.accent} />
                                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>IMPORTAR</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {(editingProduto.treinoPrograma?.treinos || []).map((treino, tIdx) => (
                        <View key={tIdx} style={[styles.itemFormCard, { borderColor: theme.border, backgroundColor: theme.bg, marginTop: 14 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>TREINO {tIdx + 1}</Text>
                                <TouchableOpacity onPress={() => removeTreinoDia(tIdx)} style={{ marginLeft: 'auto' }}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, marginTop: 10 }]}
                                value={treino.nome}
                                onChangeText={(v) => updateTreinoDiaField(tIdx, 'nome', v)}
                                placeholder="Nome (ex: Glúteos)"
                                placeholderTextColor="#666"
                            />
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                <TextInput
                                    style={[styles.saasInput, { flex: 1, backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    value={treino.foco}
                                    onChangeText={(v) => updateTreinoDiaField(tIdx, 'foco', v)}
                                    placeholder="Foco (ex: Hipertrofia de Glúteos)"
                                    placeholderTextColor="#666"
                                />
                                <TextInput
                                    style={[styles.saasInput, { width: 120, backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    value={treino.descanso}
                                    onChangeText={(v) => updateTreinoDiaField(tIdx, 'descanso', v)}
                                    placeholder="60-90s"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            {(treino.exercicios || []).map((ex, exIdx) => (
                                <View key={exIdx} style={[styles.exercicioFormCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '900' }}>#{exIdx + 1}</Text>
                                        <TouchableOpacity onPress={() => removeExercicio(tIdx, exIdx)} style={{ marginLeft: 'auto' }}>
                                            <MaterialCommunityIcons name="close" size={16} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput
                                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginTop: 8 }]}
                                        value={ex.nome}
                                        onChangeText={(v) => updateExercicioField(tIdx, exIdx, 'nome', v)}
                                        placeholder="Exercício (ex: Sumô Máquina)"
                                        placeholderTextColor="#666"
                                    />
                                    <TextInput
                                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginTop: 8 }]}
                                        value={ex.seriesRepeticoes}
                                        onChangeText={(v) => updateExercicioField(tIdx, exIdx, 'seriesRepeticoes', v)}
                                        placeholder="Séries x Repetições (ex: 15/12/10/8 + DROP)"
                                        placeholderTextColor="#666"
                                    />
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                        <TextInput
                                            style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                            value={(ex.muscPrincipal || []).join(', ')}
                                            onChangeText={(v) => updateExercicioField(tIdx, exIdx, 'muscPrincipal', v.split(',').map(s => s.trim()).filter(Boolean))}
                                            placeholder="Músculo principal (vírgula)"
                                            placeholderTextColor="#666"
                                        />
                                        <TextInput
                                            style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                            value={(ex.muscSecundario || []).join(', ')}
                                            onChangeText={(v) => updateExercicioField(tIdx, exIdx, 'muscSecundario', v.split(',').map(s => s.trim()).filter(Boolean))}
                                            placeholder="Secundário (vírgula)"
                                            placeholderTextColor="#666"
                                        />
                                    </View>
                                    <TextInput
                                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 60, marginTop: 8 }]}
                                        multiline
                                        value={ex.orientacao}
                                        onChangeText={(v) => updateExercicioField(tIdx, exIdx, 'orientacao', v)}
                                        placeholder="Orientação técnica"
                                        placeholderTextColor="#666"
                                    />
                                    <TextInput
                                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginTop: 8 }]}
                                        value={ex.videoUrl}
                                        onChangeText={(v) => updateExercicioField(tIdx, exIdx, 'videoUrl', v)}
                                        placeholder="Link do vídeo no YouTube (opcional)"
                                        placeholderTextColor="#666"
                                        autoCapitalize="none"
                                    />
                                </View>
                            ))}
                            <TouchableOpacity style={[styles.addItemBtn, { borderColor: theme.accent, marginTop: 10 }]} onPress={() => addExercicio(tIdx)}>
                                <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>ADICIONAR EXERCÍCIO</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={[styles.addItemBtn, { borderColor: theme.accent, marginTop: 10 }]} onPress={addTreinoDia}>
                        <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>ADICIONAR TREINO</Text>
                    </TouchableOpacity>

                    {(editingProduto.treinoPrograma?.treinos || []).length > 0 && (
                        <>
                            <TouchableOpacity
                                style={[styles.previewBtn, { borderColor: '#4DE38F', opacity: (saving || previewLoading) ? 0.6 : 1 }]}
                                onPress={handlePreviewTreino}
                                disabled={saving || previewLoading}
                            >
                                {previewLoading
                                    ? <ActivityIndicator size="small" color="#4DE38F" />
                                    : (
                                        <>
                                            <MaterialCommunityIcons name="eye-outline" size={16} color="#4DE38F" />
                                            <Text style={{ color: '#4DE38F', fontSize: 12, fontWeight: '900' }}>SALVAR E PRÉ-VISUALIZAR TREINO</Text>
                                        </>
                                    )
                                }
                            </TouchableOpacity>
                            <Text style={styles.helperText}>
                                Abre a tela exatamente como a aluna vai ver, sem custar nada — não gera cobrança nem aparece nas suas vendas ou no painel.
                            </Text>
                        </>
                    )}
                    </>
                    )}

                    {formTab === 'curso' && (
                    <>
                    <Text style={styles.helperText}>
                        Se preencher, quem comprar ganha acesso a uma área de membros com módulos e aulas em vídeo. Cada módulo libera um número de dias após a compra — o conteúdo não aparece todo de uma vez, o que protege contra pedido de reembolso depois de consumir tudo durante os 7 dias de garantia.
                    </Text>

                    <TouchableOpacity style={[styles.jsonImportToggle, { borderColor: theme.border, marginTop: 15 }]} onPress={() => setCursoJsonImportAberto(!cursoJsonImportAberto)}>
                        <MaterialCommunityIcons name={cursoJsonImportAberto ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textSecondary} />
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '900' }}>COLAR CURSO PRONTO (JSON)</Text>
                    </TouchableOpacity>
                    {cursoJsonImportAberto && (
                        <View style={{ width: '100%', marginTop: 8 }}>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 100 }]}
                                multiline
                                value={cursoJsonImportText}
                                onChangeText={setCursoJsonImportText}
                                placeholder="Cole aqui o JSON do curso..."
                                placeholderTextColor="#666"
                                autoCapitalize="none"
                            />
                            <TouchableOpacity style={[styles.addItemBtn, { borderColor: theme.accent, marginTop: 8 }]} onPress={handleImportCursoJson}>
                                <MaterialCommunityIcons name="tray-arrow-down" size={16} color={theme.accent} />
                                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>IMPORTAR</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {(editingProduto.cursoPrograma?.modulos || []).map((modulo, mIdx) => (
                        <View key={mIdx} style={[styles.itemFormCard, { borderColor: theme.border, backgroundColor: theme.bg, marginTop: 14 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>MÓDULO {mIdx + 1}</Text>
                                <TouchableOpacity onPress={() => removeCursoModulo(mIdx)} style={{ marginLeft: 'auto' }}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[styles.saasInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, marginTop: 10 }]}
                                value={modulo.nome}
                                onChangeText={(v) => updateCursoModuloField(mIdx, 'nome', v)}
                                placeholder="Nome do módulo (ex: Fundamentos)"
                                placeholderTextColor="#666"
                            />
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Libera</Text>
                                <TextInput
                                    style={[styles.saasInput, { width: 80, backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    keyboardType="numeric"
                                    value={String(modulo.liberacaoDias ?? '0')}
                                    onChangeText={(v) => updateCursoModuloField(mIdx, 'liberacaoDias', v)}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                />
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>dia(s) após a compra (0 = liberado na hora)</Text>
                            </View>

                            {(modulo.aulas || []).map((aula, aIdx) => (
                                <View key={aIdx} style={[styles.exercicioFormCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '900' }}>AULA #{aIdx + 1}</Text>
                                        <TouchableOpacity onPress={() => removeCursoAula(mIdx, aIdx)} style={{ marginLeft: 'auto' }}>
                                            <MaterialCommunityIcons name="close" size={16} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput
                                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginTop: 8 }]}
                                        value={aula.nome}
                                        onChangeText={(v) => updateCursoAulaField(mIdx, aIdx, 'nome', v)}
                                        placeholder="Nome da aula"
                                        placeholderTextColor="#666"
                                    />
                                    <TextInput
                                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 60, marginTop: 8 }]}
                                        multiline
                                        value={aula.descricao}
                                        onChangeText={(v) => updateCursoAulaField(mIdx, aIdx, 'descricao', v)}
                                        placeholder="Descrição da aula (opcional)"
                                        placeholderTextColor="#666"
                                    />
                                    <TextInput
                                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginTop: 8 }]}
                                        value={aula.videoUrl}
                                        onChangeText={(v) => updateCursoAulaField(mIdx, aIdx, 'videoUrl', v)}
                                        placeholder="Link do vídeo (YouTube ou embed do Cloudflare Stream)"
                                        placeholderTextColor="#666"
                                        autoCapitalize="none"
                                    />
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                        {[{ id: 'vertical', label: '9:16 VERTICAL' }, { id: 'horizontal', label: '16:9 HORIZONTAL' }].map((opt) => (
                                            <TouchableOpacity
                                                key={opt.id}
                                                style={[
                                                    styles.coachOption,
                                                    { borderColor: theme.border, paddingVertical: 8 },
                                                    (aula.videoOrientacao || 'vertical') === opt.id && { backgroundColor: `${theme.accent}20`, borderColor: theme.accent },
                                                ]}
                                                onPress={() => updateCursoAulaField(mIdx, aIdx, 'videoOrientacao', opt.id)}
                                            >
                                                <Text style={{ color: (aula.videoOrientacao || 'vertical') === opt.id ? theme.accent : theme.textSecondary, fontWeight: '900', fontSize: 11 }}>
                                                    {opt.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginTop: 8 }]}
                                        value={aula.anexoUrl}
                                        onChangeText={(v) => updateCursoAulaField(mIdx, aIdx, 'anexoUrl', v)}
                                        placeholder="Link de material de apoio (PDF, opcional)"
                                        placeholderTextColor="#666"
                                        autoCapitalize="none"
                                    />
                                </View>
                            ))}
                            <TouchableOpacity style={[styles.addItemBtn, { borderColor: theme.accent, marginTop: 10 }]} onPress={() => addCursoAula(mIdx)}>
                                <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>ADICIONAR AULA</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={[styles.addItemBtn, { borderColor: theme.accent, marginTop: 10 }]} onPress={addCursoModulo}>
                        <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>ADICIONAR MÓDULO</Text>
                    </TouchableOpacity>
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
                                : <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13 }}>GUARDAR PRODUTO</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
    return null;
}

const styles = StyleSheet.create({
    bigCard: { padding: 24, borderRadius: 20, borderWidth: 1, width: '100%' },
    bigCardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
    pageDesc: { fontSize: 12, lineHeight: 18, marginBottom: 16 },

    newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 20, width: '100%' },
    newBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },

    dashboardWrap: { width: '100%', marginBottom: 20 },
    dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    dashboardCard: { flexGrow: 1, minWidth: 140, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
    dashboardValue: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
    dashboardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    dashboardPendentes: { fontSize: 11, marginTop: 10, fontStyle: 'italic' },

    emptyText: { fontSize: 13, textAlign: 'center', marginTop: 20, lineHeight: 20, width: '100%' },

    itemCard: { padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 14, width: '100%' },
    capaPreviewMini: { width: 50, height: 66, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    actionIconsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
    
    shareRow: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
    shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    shareBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
    itemNome: { fontSize: 15, fontWeight: '900' },
    itemSlug: { fontSize: 11, marginTop: 2 },
    itemMeta: { fontSize: 11, marginTop: 4, fontWeight: '700' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },

    backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },

    inputLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
    saasInput: { width: '100%', padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 16 }, // Fonte 16 para evitar Zoom iOS
    helperText: { fontSize: 10, fontStyle: 'italic', color: '#888', marginTop: 6 },

    coachOption: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
    subsectionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 24, marginBottom: 16 },

    formTabsRow: { flexDirection: 'row', width: '100%', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginTop: 6, marginBottom: 20 },
    formTabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    formTabDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 2 },
    
    capaPreviewGrande: { width: 80, height: 106, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },

    previaThumb: { width: 66, height: 82, borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
    previaRemoveBtn: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    previaAddBtn: { width: 66, height: 82, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    
    bumpCardConfig: { padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 10, gap: 10 },
    bumpOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1 },

    itemFormCard: { width: '100%', padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 10 },
    exercicioFormCard: { width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 10 },
    jsonImportToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginTop: 12, alignSelf: 'flex-start' },
    previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, marginTop: 14, width: '100%' },
    avatarPicker: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    antesDepoisSlot: { width: '100%', aspectRatio: 3 / 4, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 10, marginTop: 10, width: '100%' },

    formActions: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
    cancelBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    saveBtn: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});