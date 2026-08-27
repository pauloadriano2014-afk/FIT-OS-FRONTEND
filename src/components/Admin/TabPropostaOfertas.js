// src/components/Admin/TabPropostaOfertas.js
//
// Aba "VENDAS" — versão MASTER (Paulo/Adri). Mesmo slot de tela que os
// coaches parceiros usam pra TabSaaS, mas aqui gerenciamos as "Ofertas de
// Proposta": conjuntos de preços/planos customizados que a PropostaScreen
// renderiza dinamicamente via ?oferta=slug na URL (ex: High-Ticket).
//
// Cada período (mensal/trimestral/semestral/anual) tem um VALOR base e um
// DESCONTO % manual — mesmo padrão usado em CoachPlan/TabSaaS: o preço
// final é sempre calculado na hora (valor * (1 - desconto/100)), nunca
// guardado separadamente.

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, Platform, ActivityIndicator, Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authHeaders } from '../../utils/authToken';

const API_BASE = 'https://fitos-final.onrender.com';

const PERIODOS = ['mensal', 'trimestral', 'semestral', 'anual'];
const PERIOD_LABELS_PT = { mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual' };

// ─── Card vazio padrão ao adicionar um novo plano dentro de uma oferta ─────
const emptyPeriodoPreco = () => ({ valor: '', descontoPerc: '0' });

const emptyCard = () => ({
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    nome: '',
    descricao: '',
    destaque: false,
    badgeTexto: '',
    itensInclusos: [''],
    itensExcluidos: [],
    itemDestaque: '',
    bonusTitulo: '',
    bonusItens: [],
    precos: {
        mensal: emptyPeriodoPreco(),
        trimestral: emptyPeriodoPreco(),
        semestral: emptyPeriodoPreco(),
        anual: emptyPeriodoPreco(),
    },
    ctaTexto: '',
});

const emptyOferta = () => ({
    id: null,
    slug: '',
    nome: '',
    ativa: true,
    cards: [emptyCard()],
});

// ─── Planos padrão de hoje (Performance + Elite VIP) usados como ponto de
// partida ao criar uma oferta nova — evita começar do zero. Mantenha em
// sincronia com DEFAULT_CARDS em PropostaScreen.js se os textos mudarem lá. ─
const defaultCardsForPrefill = () => ([
    {
        id: `card_${Date.now()}_perf`,
        nome: 'PERFORMANCE',
        descricao: "O motor de arranque para mudar o seu shape.\n\nSe você já treina, mas sente que está fazendo tudo 'meio no escuro', esse é o ponto de virada.",
        destaque: false,
        badgeTexto: '',
        itensInclusos: [
            'Você sabe exatamente o que fazer em cada treino — sem dúvida, sem improviso',
            'Cada repetição passa a ter direção, corrigindo falhas e extraindo resultado real',
            'O resultado não para — toda vez que estagnar, ajustamos a rota antes',
            'O acompanhamento garante o seu próximo passo, para você nunca mais ficar perdido',
            'A carga certa destrava a hipertrofia, obrigando o seu músculo a crescer (sem achismos)',
            'Acesso ao PA Flix Básico (Dicas Ocultas)',
        ],
        itensExcluidos: ['Estratégia Alimentar Específica'],
        itemDestaque: '',
        bonusTitulo: '🎁 BÔNUS DE ACORDO COM O PLANO:',
        bonusItens: [
            'Mensal: E-books 5 Dicas + Receitas (Whey e Salgadas)',
            'Trimestral: Tudo acima + Shape Natural + Pernas',
            'Semestral/Anual: Tudo acima + Todos os Audiobooks',
        ],
        precos: {
            mensal: { valor: '197', descontoPerc: '0' },
            trimestral: { valor: '397', descontoPerc: '0' },
            semestral: { valor: '697', descontoPerc: '0' },
            anual: { valor: '1197', descontoPerc: '0' },
        },
        ctaTexto: 'QUERO PARAR DE TREINAR NO ESCURO',
    },
    {
        id: `card_${Date.now()}_elite`,
        nome: 'ELITE VIP',
        descricao: 'Para quem cansou de tentar, errar e continuar no mesmo corpo.\n\nO acompanhamento definitivo para você parar de perder tempo e acelerar o seu resultado.',
        destaque: true,
        badgeTexto: 'EXPERIÊNCIA COMPLETA',
        itensInclusos: [
            'A direção exata do que fazer em cada treino — sem dúvida, sem improviso',
            'Cada repetição passa a ter correção biomecânica, extraindo o máximo do músculo',
            'Seu corpo não trava — toda vez que estagnar, ajustamos a rota antes',
            'O suporte lado a lado garante que você nunca mais se sinta sozinho no processo',
            'A intensidade certa para mudar o corpo, usando a ciência ao invés de adivinhar a carga',
            'Acesso livre ao PA Flix VIP (Todo o Arsenal)',
        ],
        itensExcluidos: [],
        itemDestaque: '🔥 O espelho começa a refletir a mudança, porque a alimentação e o treino finalmente estão alinhados',
        bonusTitulo: '🎁 BÔNUS DE ACORDO COM O PLANO:',
        bonusItens: [
            'Mensal: E-books 5 Dicas + Receitas (Whey e Salgadas)',
            'Trimestral: Tudo acima + Shape Natural + Pernas',
            'Semestral/Anual: Tudo acima + Todos os Audiobooks',
        ],
        precos: {
            mensal: { valor: '297', descontoPerc: '0' },
            trimestral: { valor: '597', descontoPerc: '0' },
            semestral: { valor: '1097', descontoPerc: '0' },
            anual: { valor: '1890', descontoPerc: '0' },
        },
        ctaTexto: 'QUERO VER RESULTADO DE VERDADE',
    },
]);

function slugifyLocal(input) {
    return (input || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Normaliza o preço de um período vindo do banco — aceita tanto o formato
// novo ({valor, descontoPerc}) quanto um número solto (ofertas antigas
// criadas antes do desconto existir), sempre devolvendo strings pro form.
function normalizePeriodoPreco(raw) {
    if (raw == null) return emptyPeriodoPreco();
    if (typeof raw === 'object') {
        return {
            valor: raw.valor != null ? String(raw.valor) : '',
            descontoPerc: raw.descontoPerc != null ? String(raw.descontoPerc) : '0',
        };
    }
    return { valor: String(raw), descontoPerc: '0' };
}

function calcPrecoFinal(valorStr, descontoStr) {
    const valor = parseFloat((valorStr || '0').replace(',', '.')) || 0;
    const desconto = parseInt(descontoStr) || 0;
    return desconto > 0 ? valor * (1 - desconto / 100) : valor;
}

export default function TabPropostaOfertas({ theme, currentUserId, navigation }) {
    const [ofertas, setOfertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // view: 'lista' | 'form'
    const [view, setView] = useState('lista');
    const [editingOferta, setEditingOferta] = useState(null);
    const [expandedCardId, setExpandedCardId] = useState(null);

    const fetchOfertas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/proposta-ofertas`, {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) {
                const data = await res.json();
                setOfertas(data.ofertas || []);
            }
        } catch (e) {
            console.log('Erro ao buscar ofertas', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOfertas(); }, [fetchOfertas]);

    // ── Preview da página de vendas ──────────────────────────────────────
    // Usa navegação INTERNA (navigation.navigate) em vez de Linking.openURL.
    // Isso empilha a Proposta por cima da tela de admin na mesma stack do
    // app — essencial no PWA instalado, onde window.open/Linking abre na
    // MESMA janela (sem abas) e deixa o usuário sem como voltar.
    // O parâmetro preview=true faz a PropostaScreen mostrar um botão
    // flutuante de "Voltar" que nunca aparece pra alunos reais.
    const openPreviewPadrao = () => {
        const previewId = `preview_${Date.now().toString(36)}`;
        navigation?.navigate('Proposta', { preview: true, id: previewId });
    };

    const openPreviewOferta = (oferta) => {
        const previewId = `preview_${Date.now().toString(36)}`;
        navigation?.navigate('Proposta', { oferta: oferta.slug, preview: true, id: previewId });
    };

    // ── Abrir formulário (novo em branco, novo a partir do padrão, ou edição) ─
    const openNewOferta = () => {
        setEditingOferta(emptyOferta());
        setExpandedCardId(null);
        setView('form');
    };

    const openNewOfertaFromDefaults = () => {
        const cards = defaultCardsForPrefill();
        setEditingOferta({ id: null, slug: '', nome: '', ativa: true, cards });
        setExpandedCardId(cards[0].id);
        setView('form');
    };

    const openEditOferta = (oferta) => {
        const cardsNormalizados = (oferta.cards || []).map(c => ({
            ...emptyCard(),
            ...c,
            itensInclusos: c.itensInclusos?.length ? c.itensInclusos : [''],
            itensExcluidos: c.itensExcluidos || [],
            bonusItens: c.bonusItens || [],
            precos: {
                mensal: normalizePeriodoPreco(c.precos?.mensal),
                trimestral: normalizePeriodoPreco(c.precos?.trimestral),
                semestral: normalizePeriodoPreco(c.precos?.semestral),
                anual: normalizePeriodoPreco(c.precos?.anual),
            },
        }));
        setEditingOferta({ ...oferta, cards: cardsNormalizados });
        setExpandedCardId(cardsNormalizados[0]?.id || null);
        setView('form');
    };

    const backToList = () => {
        setEditingOferta(null);
        setView('lista');
    };

    // ── Helpers de edição do formulário ──────────────────────────────────
    const updateOfertaField = (field, value) => {
        setEditingOferta(prev => ({ ...prev, [field]: value }));
    };

    const updateCardField = (cardId, field, value) => {
        setEditingOferta(prev => ({
            ...prev,
            cards: prev.cards.map(c => c.id === cardId ? { ...c, [field]: value } : c),
        }));
    };

    // Atualiza 'valor' ou 'descontoPerc' de um período específico dentro de um card
    const updateCardPrecoField = (cardId, periodo, field, value) => {
        setEditingOferta(prev => ({
            ...prev,
            cards: prev.cards.map(c =>
                c.id === cardId
                    ? { ...c, precos: { ...c.precos, [periodo]: { ...c.precos[periodo], [field]: value } } }
                    : c
            ),
        }));
    };

    const addCard = () => {
        const novo = emptyCard();
        setEditingOferta(prev => ({ ...prev, cards: [...prev.cards, novo] }));
        setExpandedCardId(novo.id);
    };

    const removeCard = (cardId) => {
        setEditingOferta(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== cardId) }));
    };

    const toggleDestaque = (cardId) => {
        setEditingOferta(prev => ({
            ...prev,
            cards: prev.cards.map(c => ({
                ...c,
                destaque: c.id === cardId ? !c.destaque : false,
            })),
        }));
    };

    // ── Listas dinâmicas dentro de um card ───────────────────────────────
    const addListItem = (cardId, listField) => {
        setEditingOferta(prev => ({
            ...prev,
            cards: prev.cards.map(c =>
                c.id === cardId ? { ...c, [listField]: [...c[listField], ''] } : c
            ),
        }));
    };

    const updateListItem = (cardId, listField, index, value) => {
        setEditingOferta(prev => ({
            ...prev,
            cards: prev.cards.map(c => {
                if (c.id !== cardId) return c;
                const novaLista = [...c[listField]];
                novaLista[index] = value;
                return { ...c, [listField]: novaLista };
            }),
        }));
    };

    const removeListItem = (cardId, listField, index) => {
        setEditingOferta(prev => ({
            ...prev,
            cards: prev.cards.map(c => {
                if (c.id !== cardId) return c;
                const novaLista = c[listField].filter((_, i) => i !== index);
                return { ...c, [listField]: novaLista };
            }),
        }));
    };

    // ── Salvar (criar ou atualizar) ──────────────────────────────────────
    const buildPeriodoPayload = (p) => {
        if (!p.valor) return null;
        return {
            valor: parseFloat(p.valor.replace(',', '.')),
            descontoPerc: parseInt(p.descontoPerc) || 0,
        };
    };

    const handleSave = async () => {
        if (!editingOferta.nome.trim()) {
            return Platform.OS === 'web'
                ? window.alert('Dê um nome pra essa oferta.')
                : Alert.alert('Aviso', 'Dê um nome pra essa oferta.');
        }
        if (!editingOferta.cards.length) {
            return Platform.OS === 'web'
                ? window.alert('Adicione pelo menos 1 plano (card).')
                : Alert.alert('Aviso', 'Adicione pelo menos 1 plano (card).');
        }

        const cardsParaSalvar = editingOferta.cards.map(c => ({
            ...c,
            itensInclusos: c.itensInclusos.filter(i => i.trim() !== ''),
            itensExcluidos: c.itensExcluidos.filter(i => i.trim() !== ''),
            bonusItens: c.bonusItens.filter(i => i.trim() !== ''),
            precos: {
                mensal: buildPeriodoPayload(c.precos.mensal),
                trimestral: buildPeriodoPayload(c.precos.trimestral),
                semestral: buildPeriodoPayload(c.precos.semestral),
                anual: buildPeriodoPayload(c.precos.anual),
            },
        }));

        setSaving(true);
        try {
            const isEditing = !!editingOferta.id;
            const url = isEditing
                ? `${API_BASE}/api/admin/proposta-ofertas/${editingOferta.id}`
                : `${API_BASE}/api/admin/proposta-ofertas`;
            const method = isEditing ? 'PATCH' : 'POST';

            const body = isEditing
                ? { nome: editingOferta.nome, cards: cardsParaSalvar, ativa: editingOferta.ativa }
                : {
                    nome: editingOferta.nome,
                    slug: editingOferta.slug || slugifyLocal(editingOferta.nome),
                    cards: cardsParaSalvar,
                    criadoPorId: currentUserId,
                };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = data?.error || 'Erro ao salvar oferta.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
                return;
            }

            Platform.OS === 'web'
                ? window.alert('Oferta salva com sucesso!')
                : Alert.alert('Sucesso', 'Oferta salva com sucesso!');

            await fetchOfertas();
            backToList();
        } catch (e) {
            console.log('Erro ao salvar oferta', e);
            Platform.OS === 'web' ? window.alert('Falha ao salvar.') : Alert.alert('Erro', 'Falha ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    // ── Deletar / ativar-desativar ───────────────────────────────────────
    const handleDelete = async (oferta) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`Deletar a oferta "${oferta.nome}"? Links que usam essa oferta vão cair no preço padrão.`)) {
                await doDelete(oferta.id);
            }
            return;
        }
        Alert.alert(
            'Deletar oferta',
            `Deletar "${oferta.nome}"? Links que usam essa oferta vão cair no preço padrão.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Deletar', style: 'destructive', onPress: () => doDelete(oferta.id) },
            ]
        );
    };

    const doDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/proposta-ofertas/${id}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
            if (res.ok) fetchOfertas();
        } catch (e) {
            console.log('Erro ao deletar', e);
        }
    };

    const toggleAtiva = async (oferta) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/proposta-ofertas/${oferta.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ ativa: !oferta.ativa }),
            });
            if (res.ok) fetchOfertas();
        } catch (e) {
            console.log('Erro ao alternar ativa', e);
        }
    };

    // ────────────────────────────────────────────────────────────────────
    // RENDER: LISTA
    // ────────────────────────────────────────────────────────────────────
    if (view === 'lista') {
        return (
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>OFERTAS DE PROPOSTA</Text>
                <Text style={[styles.pageDesc, { color: theme.textSecondary }]}>
                    Crie conjuntos de preços diferentes (ex: Padrão, High-Ticket) e use o slug de cada um
                    no link de proposta (?oferta=slug) pra mostrar valores diferentes sem mexer no código.
                </Text>

                <TouchableOpacity style={styles.previewLink} onPress={openPreviewPadrao}>
                    <MaterialCommunityIcons name="eye-outline" size={14} color={theme.accent} />
                    <Text style={[styles.previewLinkText, { color: theme.accent }]}>VER PÁGINA DE VENDAS PADRÃO ATUAL</Text>
                </TouchableOpacity>

                <View style={styles.newBtnRow}>
                    <TouchableOpacity style={[styles.newBtn, { backgroundColor: theme.accent }]} onPress={openNewOferta}>
                        <MaterialCommunityIcons name="plus" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                        <Text style={[styles.newBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>OFERTA EM BRANCO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.newBtn, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.accent }]} onPress={openNewOfertaFromDefaults}>
                        <MaterialCommunityIcons name="content-copy" size={18} color={theme.accent} />
                        <Text style={[styles.newBtnText, { color: theme.accent }]}>A PARTIR DO PADRÃO</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 30, alignSelf: 'center', width: '100%' }} />
                ) : ofertas.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        Nenhuma oferta criada ainda. A página de proposta usa os preços padrão do código
                        até você criar a primeira.
                    </Text>
                ) : (
                    <View style={{ width: '100%' }}>
                        {ofertas.map((oferta) => (
                            <View key={oferta.id} style={[styles.ofertaCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={[styles.ofertaNome, { color: theme.text }]}>{oferta.nome}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: oferta.ativa ? '#4DE38F20' : '#66666620', borderColor: oferta.ativa ? '#4DE38F' : '#666' }]}>
                                            <Text style={{ color: oferta.ativa ? '#4DE38F' : '#888', fontSize: 9, fontWeight: '900' }}>
                                                {oferta.ativa ? 'ATIVA' : 'INATIVA'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.ofertaSlug, { color: theme.textSecondary }]}>?oferta={oferta.slug}</Text>
                                    <Text style={[styles.ofertaMeta, { color: theme.textSecondary }]}>
                                        {(oferta.cards || []).length} plano(s)
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                    <TouchableOpacity onPress={() => openPreviewOferta(oferta)}>
                                        <MaterialCommunityIcons name="eye-outline" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                    <Switch
                                        value={oferta.ativa}
                                        onValueChange={() => toggleAtiva(oferta)}
                                        trackColor={{ false: '#444', true: `${theme.accent}80` }}
                                        thumbColor={oferta.ativa ? theme.accent : '#888'}
                                    />
                                    <TouchableOpacity onPress={() => openEditOferta(oferta)}>
                                        <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(oferta)}>
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
    return (
        <View style={{ gap: 15 }}>
            <View style={styles.formHeaderRow}>
                <TouchableOpacity style={styles.backRow} onPress={backToList}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900' }}>VOLTAR PARA A LISTA</Text>
                </TouchableOpacity>
            </View>

            {/* Dados gerais da oferta */}
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>
                    {editingOferta.id ? 'EDITAR OFERTA' : 'NOVA OFERTA'}
                </Text>

                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Nome interno</Text>
                <TextInput
                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    value={editingOferta.nome}
                    onChangeText={(v) => updateOfertaField('nome', v)}
                    placeholder="Ex: High-Ticket"
                    placeholderTextColor="#666"
                />

                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>
                    Slug (usado no link: ?oferta=slug)
                </Text>
                <TextInput
                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    value={editingOferta.slug}
                    onChangeText={(v) => updateOfertaField('slug', slugifyLocal(v))}
                    placeholder={slugifyLocal(editingOferta.nome) || 'gerado a partir do nome'}
                    placeholderTextColor="#666"
                    editable={!editingOferta.id}
                />
                {editingOferta.id && (
                    <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                        O slug não pode ser alterado após a criação (links já enviados usam ele).
                    </Text>
                )}
            </View>

            {/* Cards de plano */}
            <Text style={[styles.sectionLabel, { color: theme.text }]}>PLANOS DESSA OFERTA</Text>
            {editingOferta.cards.map((card, cardIndex) => {
                const expanded = expandedCardId === card.id;
                return (
                    <View key={card.id} style={[styles.cardEditor, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TouchableOpacity
                            style={styles.cardEditorHeader}
                            onPress={() => setExpandedCardId(expanded ? null : card.id)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                <MaterialCommunityIcons
                                    name={card.destaque ? 'crown' : 'weight-lifter'}
                                    size={18}
                                    color={card.destaque ? theme.accent : theme.textSecondary}
                                />
                                <Text style={[styles.cardEditorTitle, { color: theme.text }]}>
                                    {card.nome || `Plano ${cardIndex + 1}`}
                                </Text>
                            </View>
                            <MaterialCommunityIcons
                                name={expanded ? 'chevron-up' : 'chevron-down'}
                                size={22}
                                color={theme.textSecondary}
                            />
                        </TouchableOpacity>

                        {expanded && (
                            <View style={styles.cardEditorBody}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nome do plano</Text>
                                <TextInput
                                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                    value={card.nome}
                                    onChangeText={(v) => updateCardField(card.id, 'nome', v)}
                                    placeholder="Ex: Performance, Elite VIP, Ouro..."
                                    placeholderTextColor="#666"
                                />

                                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>Descrição / subtítulo</Text>
                                <TextInput
                                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 70 }]}
                                    multiline
                                    value={card.descricao}
                                    onChangeText={(v) => updateCardField(card.id, 'descricao', v)}
                                    placeholder="Texto curto abaixo do nome do plano"
                                    placeholderTextColor="#666"
                                />

                                <TouchableOpacity
                                    style={styles.destaqueRow}
                                    onPress={() => toggleDestaque(card.id)}
                                >
                                    <MaterialCommunityIcons
                                        name={card.destaque ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                        size={20}
                                        color={card.destaque ? theme.accent : theme.textSecondary}
                                    />
                                    <Text style={{ color: theme.text, fontSize: 13 }}>
                                        Este é o plano em destaque (borda colorida, botão gradiente, badge)
                                    </Text>
                                </TouchableOpacity>

                                {card.destaque && (
                                    <>
                                        <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Texto do badge</Text>
                                        <TextInput
                                            style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                            value={card.badgeTexto}
                                            onChangeText={(v) => updateCardField(card.id, 'badgeTexto', v)}
                                            placeholder="Ex: EXPERIÊNCIA COMPLETA"
                                            placeholderTextColor="#666"
                                        />
                                    </>
                                )}

                                {/* Itens inclusos */}
                                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 16 }]}>Itens inclusos (✓)</Text>
                                {card.itensInclusos.map((item, i) => (
                                    <View key={i} style={styles.listItemRow}>
                                        <TextInput
                                            style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                            value={item}
                                            onChangeText={(v) => updateListItem(card.id, 'itensInclusos', i, v)}
                                            placeholder="Ex: Suporte direto no WhatsApp"
                                            placeholderTextColor="#666"
                                        />
                                        <TouchableOpacity onPress={() => removeListItem(card.id, 'itensInclusos', i)}>
                                            <MaterialCommunityIcons name="close-circle-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addItemBtn} onPress={() => addListItem(card.id, 'itensInclusos')}>
                                    <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
                                    <Text style={[styles.addItemText, { color: theme.accent }]}>ADICIONAR ITEM INCLUSO</Text>
                                </TouchableOpacity>

                                {/* Itens excluídos */}
                                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 16 }]}>Itens NÃO inclusos (✗, riscado)</Text>
                                {card.itensExcluidos.map((item, i) => (
                                    <View key={i} style={styles.listItemRow}>
                                        <TextInput
                                            style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                            value={item}
                                            onChangeText={(v) => updateListItem(card.id, 'itensExcluidos', i, v)}
                                            placeholder="Ex: Estratégia Alimentar Específica"
                                            placeholderTextColor="#666"
                                        />
                                        <TouchableOpacity onPress={() => removeListItem(card.id, 'itensExcluidos', i)}>
                                            <MaterialCommunityIcons name="close-circle-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addItemBtn} onPress={() => addListItem(card.id, 'itensExcluidos')}>
                                    <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
                                    <Text style={[styles.addItemText, { color: theme.accent }]}>ADICIONAR ITEM NÃO INCLUSO</Text>
                                </TouchableOpacity>

                                {/* Item destaque */}
                                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 16 }]}>Linha de destaque (opcional, aparece colorida no fim da lista)</Text>
                                <TextInput
                                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                    value={card.itemDestaque}
                                    onChangeText={(v) => updateCardField(card.id, 'itemDestaque', v)}
                                    placeholder="Ex: 🔥 Estratégia de dieta alinhada ao treino"
                                    placeholderTextColor="#666"
                                />

                                {/* Bônus */}
                                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 16 }]}>Título da caixa de bônus (opcional)</Text>
                                <TextInput
                                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                    value={card.bonusTitulo}
                                    onChangeText={(v) => updateCardField(card.id, 'bonusTitulo', v)}
                                    placeholder="Ex: 🎁 BÔNUS DE ACORDO COM O PLANO:"
                                    placeholderTextColor="#666"
                                />
                                {card.bonusTitulo?.trim() !== '' && (
                                    <>
                                        {card.bonusItens.map((item, i) => (
                                            <View key={i} style={styles.listItemRow}>
                                                <TextInput
                                                    style={[styles.saasInput, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                                    value={item}
                                                    onChangeText={(v) => updateListItem(card.id, 'bonusItens', i, v)}
                                                    placeholder="Ex: Mensal: E-books inclusos"
                                                    placeholderTextColor="#666"
                                                />
                                                <TouchableOpacity onPress={() => removeListItem(card.id, 'bonusItens', i)}>
                                                    <MaterialCommunityIcons name="close-circle-outline" size={20} color="#FF3B30" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                        <TouchableOpacity style={styles.addItemBtn} onPress={() => addListItem(card.id, 'bonusItens')}>
                                            <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
                                            <Text style={[styles.addItemText, { color: theme.accent }]}>ADICIONAR LINHA DE BÔNUS</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {/* Preços — valor + desconto % por período */}
                                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 16 }]}>
                                    Preços (deixe o valor em branco pra não mostrar aquele período)
                                </Text>
                                <View style={styles.pricesGrid}>
                                    {PERIODOS.map((periodo) => {
                                        const p = card.precos[periodo];
                                        const desconto = parseInt(p.descontoPerc) || 0;
                                        const precoFinal = calcPrecoFinal(p.valor, p.descontoPerc);
                                        return (
                                            <View key={periodo} style={[styles.priceBlock, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                                                <Text style={[styles.priceBlockLabel, { color: theme.text }]}>{PERIOD_LABELS_PT[periodo]}</Text>

                                                <Text style={[styles.priceFieldLabel, { color: theme.textSecondary }]}>Valor (R$)</Text>
                                                <TextInput
                                                    style={[styles.saasInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, textAlign: 'center' }]}
                                                    keyboardType="numeric"
                                                    value={p.valor}
                                                    onChangeText={(v) => updateCardPrecoField(card.id, periodo, 'valor', v)}
                                                    placeholder="0"
                                                    placeholderTextColor="#666"
                                                />

                                                <Text style={[styles.priceFieldLabel, { color: theme.textSecondary, marginTop: 8 }]}>Desconto (%)</Text>
                                                <TextInput
                                                    style={[styles.saasInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, textAlign: 'center' }]}
                                                    keyboardType="numeric"
                                                    value={p.descontoPerc}
                                                    onChangeText={(v) => updateCardPrecoField(card.id, periodo, 'descontoPerc', v)}
                                                    placeholder="0"
                                                    placeholderTextColor="#666"
                                                />

                                                {p.valor !== '' && (
                                                    <Text style={[styles.priceFinalPreview, { color: desconto > 0 ? theme.accent : theme.textSecondary }]}>
                                                        {desconto > 0
                                                            ? `Fica: R$ ${precoFinal.toFixed(2)} (${desconto}% OFF)`
                                                            : `Sem desconto: R$ ${precoFinal.toFixed(2)}`}
                                                    </Text>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* CTA */}
                                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 16 }]}>Texto do botão (CTA)</Text>
                                <TextInput
                                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                    value={card.ctaTexto}
                                    onChangeText={(v) => updateCardField(card.id, 'ctaTexto', v)}
                                    placeholder="Ex: QUERO VER RESULTADO DE VERDADE"
                                    placeholderTextColor="#666"
                                />

                                {editingOferta.cards.length > 1 && (
                                    <TouchableOpacity style={styles.removeCardBtn} onPress={() => removeCard(card.id)}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                                        <Text style={styles.removeCardBtnText}>REMOVER ESTE PLANO</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                );
            })}

            <TouchableOpacity style={[styles.addCardBtn, { borderColor: theme.accent }]} onPress={addCard}>
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.accent} />
                <Text style={[styles.addCardBtnText, { color: theme.accent }]}>ADICIONAR OUTRO PLANO</Text>
            </TouchableOpacity>

            {/* Ações finais */}
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
                        : <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13 }}>SALVAR OFERTA</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bigCard: { padding: 24, borderRadius: 20, borderWidth: 1, width: '100%' },
    bigCardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    pageDesc: { fontSize: 12, lineHeight: 18, marginBottom: 14 },

    previewLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
    previewLinkText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },

    newBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' },
    newBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14 },
    newBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.3, textAlign: 'center' },

    emptyText: { fontSize: 13, textAlign: 'center', marginTop: 20, lineHeight: 20, width: '100%' },

    ofertaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, width: '100%' },
    ofertaNome: { fontSize: 15, fontWeight: '900' },
    ofertaSlug: { fontSize: 11, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    ofertaMeta: { fontSize: 11, marginTop: 4 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },

    formHeaderRow: { flexDirection: 'row', alignItems: 'center' },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },

    sectionLabel: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4, marginTop: 4 },

    inputLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
    saasInput: { width: '100%', padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 13 },
    helperText: { fontSize: 10, fontStyle: 'italic', marginTop: 6 },

    cardEditor: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    cardEditorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    cardEditorTitle: { fontSize: 13, fontWeight: '900' },
    cardEditorBody: { paddingHorizontal: 16, paddingBottom: 20 },

    destaqueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },

    listItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    addItemText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },

    // ── Grade de preços (2 colunas x 2 linhas, valor + desconto por período)
    pricesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    priceBlock: { width: '47%', borderWidth: 1, borderRadius: 12, padding: 12 },
    priceBlockLabel: { fontSize: 12, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
    priceFieldLabel: { fontSize: 9, fontWeight: '700', marginBottom: 4 },
    priceFinalPreview: { fontSize: 10, fontWeight: '900', textAlign: 'center', marginTop: 8 },

    removeCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, paddingVertical: 10 },
    removeCardBtnText: { color: '#FF3B30', fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },

    addCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed' },
    addCardBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },

    formActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    saveBtn: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});