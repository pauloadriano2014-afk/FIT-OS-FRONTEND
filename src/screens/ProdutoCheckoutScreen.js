// src/screens/ProdutoCheckoutScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Platform, SafeAreaView, ActivityIndicator, Linking, useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

const API_BASE = 'https://fitos-final.onrender.com';

const MAIN_COLOR = '#8B5CF6';   
const LIGHT_COLOR = '#C4B5FD';  
const DARK_COLOR = '#6D28D9';   

function onlyDigits(v) { return (v || '').replace(/\D/g, ''); }

function formatCPF(v) {
    const d = onlyDigits(v).slice(0, 11);
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatTelefone(v) {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

function formatBRL(v) {
    return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProdutoCheckoutScreen({ route }) {
    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = isWeb && windowWidth > 850;
    
    // Pega o slug da URL (?id=slug)
    const slug = route?.params?.id?.trim() || '';

    const [produto, setProduto] = useState(null);
    const [loadingProduto, setLoadingProduto] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [step, setStep] = useState('form');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [cpf, setCpf] = useState('');

    // 🔥 Controle do Order Bump
    const [incluirBump, setIncluirBump] = useState(false);

    const [vendaId, setVendaId] = useState(null);
    const [pixQrCode, setPixQrCode] = useState(null);
    const [pixCopyPaste, setPixCopyPaste] = useState(null);
    const [copiado, setCopiado] = useState(false);
    const [linkEntrega, setLinkEntrega] = useState(null);

    const pollingRef = useRef(null);
    const scrollViewRef = useRef(null);

    // 1. Busca os dados públicos do produto
    useEffect(() => {
        if (!slug) { setNotFound(true); setLoadingProduto(false); return; }
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/produtos?slug=${encodeURIComponent(slug)}`);
                if (!res.ok) { setNotFound(true); return; }
                const data = await res.json();
                if (!data?.produto) { setNotFound(true); return; }
                setProduto(data.produto);
            } catch (e) {
                console.log('Erro ao buscar produto', e);
                setNotFound(true);
            } finally {
                setLoadingProduto(false);
            }
        })();
    }, [slug]);

    // 2. Monitora o pagamento
    useEffect(() => {
        if (step !== 'pagamento' || !vendaId) return;
        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/api/produtos/vendas/${vendaId}/status`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.status === 'PAGO') {
                    clearInterval(pollingRef.current);
                    setLinkEntrega(data.linkEntrega);
                    setStep('sucesso');
                    if (isWeb) window.scrollTo({ top: 0, behavior: 'smooth' });
                    else scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                }
            } catch (e) { console.log('Erro polling status', e); }
        }, 5000);
        return () => clearInterval(pollingRef.current);
    }, [step, vendaId]);

    // 3. Gera a cobrança
    const handleSubmit = async () => {
        setFormError('');
        if (!nome.trim() || !email.includes('@') || onlyDigits(telefone).length < 10 || onlyDigits(cpf).length !== 11) {
            return setFormError('Preencha corretamente todos os campos obrigatórios.');
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/produtos/comprar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    produtoId: produto.id,
                    nome: nome.trim(),
                    email: email.trim(),
                    telefone: onlyDigits(telefone),
                    cpf: onlyDigits(cpf),
                    incluiuBump: incluirBump
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setFormError(data?.error || 'Erro ao gerar o pagamento.');
                return;
            }
            setVendaId(data.vendaId);
            setPixQrCode(data.pixQrCode);
            setPixCopyPaste(data.pixCopyPaste);
            setStep('pagamento');
            if (isWeb) window.scrollTo({ top: 0, behavior: 'smooth' });
            else scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } catch (e) {
            setFormError('Erro de conexão. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyPix = async () => {
        if (!pixCopyPaste) return;
        await Clipboard.setStringAsync(pixCopyPaste);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
    };

    const handleAcessarMaterial = () => {
        if (linkEntrega) Linking.openURL(linkEntrega);
    };

    if (loadingProduto) {
        return (
            <RootComponent style={styles.container}>
                <View style={styles.centerBox}><ActivityIndicator size="large" color={MAIN_COLOR} /></View>
            </RootComponent>
        );
    }

    if (notFound || !produto) {
        return (
            <RootComponent style={styles.container}>
                <View style={styles.centerBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#FF3B30" />
                    <Text style={styles.notFoundTitle}>PRODUTO NÃO ENCONTRADO</Text>
                </View>
            </RootComponent>
        );
    }

    const valorTotal = produto.valor + (incluirBump && produto.orderBumpValor ? produto.orderBumpValor : 0);

    return (
        <RootComponent style={styles.container}>
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
                    
                    {/* COLUNA ESQUERDA: VITRINE DO PRODUTO */}
                    <View style={[styles.infoColumn, isDesktop && { flex: 1.2 }]}>
                        <View style={styles.heroCompact}>
                            <View style={styles.coverBox}>
                                {produto.capaUrl ? (
                                    <Image source={{ uri: produto.capaUrl }} style={styles.coverImg} />
                                ) : (
                                    <MaterialCommunityIcons name="book-open-variant" size={48} color={MAIN_COLOR} />
                                )}
                            </View>
                            <Text style={styles.heroTitle}>{produto.nome}</Text>
                            {produto.descricao ? <Text style={styles.heroDesc}>{produto.descricao}</Text> : null}
                        </View>
                        
                        <View style={styles.securitySealBox}>
                            <MaterialCommunityIcons name="shield-check" size={24} color="#4DE38F" />
                            <View>
                                <Text style={styles.securityTitle}>Compra 100% Segura</Text>
                                <Text style={styles.securityDesc}>Acesso imediato enviado após a confirmação do PIX.</Text>
                            </View>
                        </View>
                    </View>

                    {/* COLUNA DIREITA: CHECKOUT E ORDER BUMP */}
                    <View style={[styles.formColumn, isDesktop && styles.desktopStickyColumn]}>
                        <View style={styles.modernFormCard}>
                            
                            {step === 'form' && (
                                <>
                                    {/* 🔥 ORDER BUMP */}
                                    {produto.orderBumpTitulo && produto.orderBumpValor ? (
                                        <TouchableOpacity 
                                            activeOpacity={0.8}
                                            onPress={() => setIncluirBump(!incluirBump)}
                                            style={[styles.bumpCard, incluirBump && styles.bumpCardActive]}
                                        >
                                            <View style={styles.bumpHeader}>
                                                <MaterialCommunityIcons name="star-shooting" size={16} color="#FFD700" />
                                                <Text style={styles.bumpHeaderTitle}>OFERTA ESPECIAL</Text>
                                            </View>
                                            <View style={styles.bumpContentRow}>
                                                <MaterialCommunityIcons 
                                                    name={incluirBump ? "checkbox-marked" : "checkbox-blank-outline"} 
                                                    size={24} 
                                                    color={incluirBump ? MAIN_COLOR : '#555'} 
                                                    style={{ marginTop: 2 }}
                                                />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.bumpTitle}>
                                                        Sim! Quero adicionar o {produto.orderBumpTitulo} por apenas <Text style={{ color: MAIN_COLOR }}>R$ {formatBRL(produto.orderBumpValor)}</Text>
                                                    </Text>
                                                    {produto.orderBumpTexto ? <Text style={styles.bumpDesc}>{produto.orderBumpTexto}</Text> : null}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ) : null}

                                    <View style={styles.investimentoHeader}>
                                        <Text style={styles.investimentoLabel}>TOTAL A PAGAR</Text>
                                        <Text style={styles.investimentoValor}>R$ {formatBRL(valorTotal)}</Text>
                                    </View>
                                    
                                    <Text style={styles.formSectionSubtitle}>Preencha seus dados de acesso:</Text>

                                    <Text style={styles.inputLabel}>Nome completo</Text>
                                    <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor="#555" />

                                    <Text style={styles.inputLabel}>E-mail (Para onde enviaremos o acesso)</Text>
                                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" />

                                    <Text style={styles.inputLabel}>WhatsApp</Text>
                                    <TextInput style={styles.input} value={telefone} onChangeText={(v) => setTelefone(formatTelefone(v))} placeholder="(41) 99999-9999" placeholderTextColor="#555" keyboardType="phone-pad" maxLength={15} />

                                    <Text style={styles.inputLabel}>CPF (Para emissão da nota/PIX)</Text>
                                    <TextInput style={styles.input} value={cpf} onChangeText={(v) => setCpf(formatCPF(v))} placeholder="000.000.000-00" placeholderTextColor="#555" keyboardType="numeric" maxLength={14} />

                                    {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

                                    <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                                        <LinearGradient colors={[MAIN_COLOR, DARK_COLOR]} style={[styles.submitBtn, submitting && { opacity: 0.6 }]}>
                                            {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.submitBtnText}>GERAR PIX DE R$ {formatBRL(valorTotal)}</Text>}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* PAGAMENTO */}
                            {step === 'pagamento' && (
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.modernFormTitle}>COPIE O CÓDIGO PIX</Text>
                                    <Text style={styles.modernPixHelper}>Escaneie ou copie o código. O link do seu material é liberado automaticamente após o pagamento.</Text>

                                    {pixQrCode ? <Image source={{ uri: pixQrCode.startsWith('data:') ? pixQrCode : `data:image/png;base64,${pixQrCode}` }} style={styles.pixImage} /> : null}

                                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopyPix}>
                                        <MaterialCommunityIcons name={copiado ? 'check' : 'content-copy'} size={16} color={MAIN_COLOR} />
                                        <Text style={styles.copyBtnText}>{copiado ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}</Text>
                                    </TouchableOpacity>

                                    <View style={styles.waitingRow}>
                                        <ActivityIndicator size="small" color={MAIN_COLOR} />
                                        <Text style={styles.waitingText}>Aguardando banco confirmar o pagamento...</Text>
                                    </View>
                                </View>
                            )}

                            {/* SUCESSO */}
                            {step === 'sucesso' && (
                                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                                    <MaterialCommunityIcons name="check-circle" size={48} color="#4DE38F" style={{ marginBottom: 12 }} />
                                    <Text style={styles.modernFormTitle}>PAGAMENTO CONFIRMADO!</Text>
                                    <Text style={styles.modernPixHelper}>Tudo certo com a sua compra. Toque no botão abaixo para aceder imediatamente ao seu material.</Text>

                                    <TouchableOpacity onPress={handleAcessarMaterial} activeOpacity={0.85} style={{ width: '100%', marginTop: 10 }}>
                                        <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.entrarGrupoBtn}>
                                            <MaterialCommunityIcons name="download" size={20} color="#FFF" />
                                            <Text style={styles.submitBtnText}>ACESSAR MEU MATERIAL</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}

                        </View>
                    </View>
                </View>
            </ScrollView>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { height: isWeb ? '100vh' : '100%', backgroundColor: '#060608' },
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    mainLayout: { width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 20, gap: 30 },
    desktopLayout: { flexDirection: 'row', paddingTop: 60 },
    infoColumn: { gap: 20 },
    formColumn: { width: '100%', maxWidth: 440, alignSelf: 'flex-start' },
    desktopStickyColumn: { position: 'sticky', top: 60, zIndex: 90 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    notFoundTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 16 },

    heroCompact: { alignItems: 'center', marginBottom: 10 },
    coverBox: { width: 160, height: 210, backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 12, borderWidth: 1, borderColor: '#1c1922', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width:0, height:10}, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
    coverImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    heroDesc: { color: '#AAA', fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10 },

    securitySealBox: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(77,227,143,0.05)', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(77,227,143,0.2)' },
    securityTitle: { color: '#4DE38F', fontSize: 13, fontWeight: '900', marginBottom: 2 },
    securityDesc: { color: '#888', fontSize: 11, paddingRight: 20 },

    modernFormCard: { backgroundColor: '#111015', borderRadius: 24, borderWidth: 1, borderColor: '#1c1922', padding: 24 },
    investimentoHeader: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1c1922', paddingBottom: 16, marginBottom: 16, marginTop: 10 },
    investimentoLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    investimentoValor: { color: '#FFF', fontSize: 34, fontWeight: '900', marginTop: 4 },
    formSectionSubtitle: { color: '#AAA', fontSize: 13, fontWeight: '700', marginBottom: 5 },

    // Order Bump Estilos
    bumpCard: { backgroundColor: 'rgba(139,92,246,0.05)', borderRadius: 16, borderWidth: 2, borderColor: '#2A2633', padding: 16, marginBottom: 24, borderStyle: 'dashed' },
    bumpCardActive: { borderColor: MAIN_COLOR, backgroundColor: 'rgba(139,92,246,0.12)', borderStyle: 'solid' },
    bumpHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2A2633', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12, marginLeft: -4, marginTop: -24 },
    bumpHeaderTitle: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    bumpContentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    bumpTitle: { color: '#FFF', fontSize: 13, fontWeight: '800', lineHeight: 18, marginBottom: 4 },
    bumpDesc: { color: '#999', fontSize: 11, lineHeight: 16 },

    modernFormTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    modernPixHelper: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    inputLabel: { color: '#666', fontSize: 11, fontWeight: '900', marginBottom: 5, marginTop: 14 },
    input: { backgroundColor: '#060608', color: '#FFF', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 14, fontSize: 16 },
    formErrorText: { color: '#FF3B30', fontSize: 12, fontWeight: '700', marginTop: 14, textAlign: 'center' },
    submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    pixImage: { width: 200, height: 200, alignSelf: 'center', borderRadius: 12, backgroundColor: '#FFF', marginBottom: 16 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: MAIN_COLOR, borderRadius: 12, paddingVertical: 14, width: '100%', marginBottom: 16 },
    copyBtnText: { color: LIGHT_COLOR, fontWeight: '900', fontSize: 12 },
    waitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    waitingText: { color: '#666', fontSize: 12, fontStyle: 'italic' },
    entrarGrupoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16 },
});