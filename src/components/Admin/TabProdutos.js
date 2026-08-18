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
    coachId: defaultCoachId,
    linkEntrega: '',
    ativo: true,
    orderBumpTitulo: '',
    orderBumpTexto: '',
    orderBumpValor: '',
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

    useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

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
        setEditingProduto({
            ...produto,
            valor: String(produto.valor),
            orderBumpValor: produto.orderBumpValor ? String(produto.orderBumpValor) : '',
            descricao: produto.descricao || '',
            capaUrl: produto.capaUrl || '',
            linkEntrega: produto.linkEntrega || '',
            orderBumpTitulo: produto.orderBumpTitulo || '',
            orderBumpTexto: produto.orderBumpTexto || '',
        });
        setView('form');
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

    const handleSave = async () => {
        if (!editingProduto.nome.trim()) {
            return Platform.OS === 'web' ? window.alert('Dê um nome ao produto.') : Alert.alert('Aviso', 'Dê um nome ao produto.');
        }
        if (!editingProduto.valor || parseFloat(editingProduto.valor.replace(',', '.')) <= 0) {
            return Platform.OS === 'web' ? window.alert('Informe um valor válido.') : Alert.alert('Aviso', 'Informe um valor válido.');
        }
        if (!editingProduto.linkEntrega.trim()) {
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
                valor: parseFloat(editingProduto.valor.replace(',', '.')),
                coachId: editingProduto.coachId,
                linkEntrega: editingProduto.linkEntrega,
                ativo: editingProduto.ativo,
                orderBumpTitulo: editingProduto.orderBumpTitulo,
                orderBumpTexto: editingProduto.orderBumpTexto,
                orderBumpValor: editingProduto.orderBumpValor ? parseFloat(editingProduto.orderBumpValor.replace(',', '.')) : null,
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

            Platform.OS === 'web' ? window.alert('Produto guardado com sucesso!') : Alert.alert('Sucesso', 'Produto guardado com sucesso!');
            await fetchProdutos();
            backToList();
        } catch (e) {
            console.log('Erro ao guardar produto', e);
        } finally {
            setSaving(false);
        }
    };

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

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Valor (R$)</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        keyboardType="numeric"
                        value={editingProduto.valor}
                        onChangeText={(v) => updateField('valor', v)}
                        placeholder="47,00"
                        placeholderTextColor="#666"
                    />

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Link de Entrega do Material</Text>
                    <TextInput
                        style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        value={editingProduto.linkEntrega}
                        onChangeText={(v) => updateField('linkEntrega', v)}
                        placeholder="Ex: Link do Google Drive, PDF, Notion..."
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                    />
                    <Text style={styles.helperText}>A aluna receberá este link imediatamente após a confirmação do pagamento via PIX.</Text>

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

                    {/* 🔥 ESTRATÉGIA DE VENDAS: ORDER BUMP */}
                    <View style={styles.subsectionDivider} />
                    <Text style={[styles.inputLabel, { color: theme.accent, fontSize: 13 }]}>🚀 ORDER BUMP (OFERTA EXTRA NO CHECKOUT)</Text>
                    <Text style={styles.helperText}>
                        Permite que a aluna adicione um produto complementar ao carrinho com apenas um clique antes de gerar o PIX, aumentando o seu lucro final.
                    </Text>

                    <View style={[styles.bumpCardConfig, { backgroundColor: 'rgba(139,92,246,0.05)', borderColor: theme.border }]}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Título da Oferta (Ex: Planilha de Glúteos Adicional)</Text>
                        <TextInput
                            style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                            value={editingProduto.orderBumpTitulo}
                            onChangeText={(v) => updateField('orderBumpTitulo', v)}
                            placeholder="Deixe em branco para não usar Order Bump"
                            placeholderTextColor="#666"
                        />

                        {editingProduto.orderBumpTitulo ? (
                            <>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Pequeno Texto Chamativo</Text>
                                <TextInput
                                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                    value={editingProduto.orderBumpTexto}
                                    onChangeText={(v) => updateField('orderBumpTexto', v)}
                                    placeholder="Ex: Acelere os resultados combinando com treinos de alta intensidade."
                                    placeholderTextColor="#666"
                                />

                                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 15 }]}>Valor Adicional (R$)</Text>
                                <TextInput
                                    style={[styles.saasInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                    keyboardType="numeric"
                                    value={editingProduto.orderBumpValor}
                                    onChangeText={(v) => updateField('orderBumpValor', v)}
                                    placeholder="19,90"
                                    placeholderTextColor="#666"
                                />
                            </>
                        ) : null}
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
    
    capaPreviewGrande: { width: 80, height: 106, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    
    bumpCardConfig: { padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 10 },

    formActions: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
    cancelBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    saveBtn: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});