// src/screens/ProdutoCheckoutScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Platform, SafeAreaView, ActivityIndicator, Linking, useWindowDimensions, Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

const API_BASE = 'https://fitos-final.onrender.com';
const SITE_URL = 'https://www.pauloadrianoteam.com.br';

const MAIN_COLOR = '#8B5CF6';
const LIGHT_COLOR = '#C4B5FD';
const DARK_COLOR = '#6D28D9';
const TREINO_COLOR = '#4DE38F';

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

// 🔥 Prova social — formata a data real da compra em texto relativo
function tempoRelativo(dataISO) {
    const diffMs = Date.now() - new Date(dataISO).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `há ${diffD}d`;
}

export default function ProdutoCheckoutScreen({ route }) {
    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = isWeb && windowWidth > 850;
    
    // Pega o slug da URL (?id=slug)
    const slug = route?.params?.id?.trim() || '';
    // 🔥 Presente só quando o cliente volta pelo link do e-mail de confirmação
    // (ex: pagou boleto, que só compensa depois) — retoma o status do pedido
    // direto, sem passar pelo formulário de novo.
    const vendaParam = route?.params?.venda?.trim() || '';

    const [produto, setProduto] = useState(null);
    const [loadingProduto, setLoadingProduto] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [resumindoPedido, setResumindoPedido] = useState(!!vendaParam);

    const [step, setStep] = useState('form');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [cpf, setCpf] = useState('');

    // 🔥 Controle do Order Bump — a cliente pode marcar quantos itens quiser
    const [bumpSelecionados, setBumpSelecionados] = useState([]);

    const [vendaId, setVendaId] = useState(null);
    const [pixQrCode, setPixQrCode] = useState(null);
    const [pixCopyPaste, setPixCopyPaste] = useState(null);
    const [invoiceUrl, setInvoiceUrl] = useState(null);
    const [copiado, setCopiado] = useState(false);
    const [itensEntrega, setItensEntrega] = useState([]); // [{ nome, linkEntrega }] — 1 por produto comprado

    // 🔥 FAQ — accordion, uma pergunta aberta por vez
    const [faqAberto, setFaqAberto] = useState(null);

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

    // 1.5 Retoma um pedido existente quando a URL traz ?venda= (link do e-mail
    // de confirmação — essencial pro boleto, que compensa dias depois e o
    // cliente provavelmente não vai deixar a aba aberta esperando)
    useEffect(() => {
        if (!vendaParam) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/produtos/vendas/${vendaParam}/status`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.status === 'PAGO') {
                    setItensEntrega(data.itens || []);
                    setStep('sucesso');
                } else {
                    setVendaId(vendaParam);
                    setStep('pagamento');
                }
            } catch (e) {
                console.log('Erro ao retomar pedido', e);
            } finally {
                setResumindoPedido(false);
            }
        })();
    }, [vendaParam]);

    // 1.6 Prova social dinâmica — busca as últimas vendas REAIS e confirmadas
    // desse produto. Se não houver nenhuma, o array fica vazio e o widget
    // simplesmente não aparece (nunca mostra número inventado).
    const [vendasRecentes, setVendasRecentes] = useState([]);
    const [provaSocialIndex, setProvaSocialIndex] = useState(0);
    const provaSocialOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!slug) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/produtos/vendas-recentes?slug=${encodeURIComponent(slug)}`);
                if (!res.ok) return;
                const data = await res.json();
                setVendasRecentes(data.vendas || []);
            } catch (e) { /* prova social é só um bônus — não afeta o checkout */ }
        })();
    }, [slug]);

    // Faz o toast de prova social entrar, ficar visível uns segundos, sumir e
    // trocar pro próximo item — em loop, enquanto houver vendas pra mostrar.
    useEffect(() => {
        if (vendasRecentes.length === 0) return;
        let ativo = true;
        Animated.timing(provaSocialOpacity, { toValue: 1, duration: 400, useNativeDriver: false }).start();

        const interval = setInterval(() => {
            Animated.timing(provaSocialOpacity, { toValue: 0, duration: 350, useNativeDriver: false }).start(() => {
                if (!ativo) return;
                setProvaSocialIndex((i) => (i + 1) % vendasRecentes.length);
                Animated.timing(provaSocialOpacity, { toValue: 1, duration: 350, useNativeDriver: false }).start();
            });
        }, 5000);

        return () => { ativo = false; clearInterval(interval); };
    }, [vendasRecentes]);

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
                    setItensEntrega(data.itens || []);
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
                    itensBumpIds: bumpSelecionados
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
            setInvoiceUrl(data.invoiceUrl);
            setStep('pagamento');
            // 🔥 Reflete o id do pedido na URL (web) — se o cliente fechar a aba
            // e voltar depois (ex: gerou boleto), o link fica retomável mesmo
            // sem contar só com o e-mail de confirmação.
            if (isWeb && typeof window !== 'undefined' && window.history?.replaceState) {
                try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('venda', data.vendaId);
                    window.history.replaceState({}, '', url.toString());
                } catch (e) { /* URL não disponível — sem problema, segue só em memória */ }
            }
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

    const toggleBump = (id) => {
        setBumpSelecionados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const handleAcessarItem = (link) => {
        if (link) Linking.openURL(link);
    };

    if (loadingProduto || resumindoPedido) {
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

    const provaSocial = vendasRecentes[provaSocialIndex] || null;

    const orderBumpItens = produto.orderBumpItens || [];
    const valorBumps = orderBumpItens
        .filter((item) => bumpSelecionados.includes(item.id))
        .reduce((soma, item) => soma + item.valor, 0);
    const valorTotal = produto.valor + valorBumps;

    const beneficiosList = (produto.beneficios || '').split('\n').map((s) => s.trim()).filter(Boolean);
    let imagensExtra = [];
    try {
        imagensExtra = produto.imagensExtra ? JSON.parse(produto.imagensExtra) : [];
    } catch (e) {
        imagensExtra = [];
    }
    const temDesconto = produto.precoDe && produto.precoDe > produto.valor;
    const percentualOff = temDesconto ? Math.round((1 - produto.valor / produto.precoDe) * 100) : 0;

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
    let faqItens = [];
    try {
        faqItens = produto.faq ? JSON.parse(produto.faq) : [];
    } catch (e) {
        faqItens = [];
    }

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

                            {temDesconto ? (
                                <View style={styles.priceBadgeRow}>
                                    <Text style={styles.precoDeText}>R$ {formatBRL(produto.precoDe)}</Text>
                                    <Text style={styles.precoPorText}>R$ {formatBRL(produto.valor)}</Text>
                                    <View style={styles.descontoBadge}>
                                        <Text style={styles.descontoBadgeText}>-{percentualOff}%</Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.precoSoText}>R$ {formatBRL(produto.valor)}</Text>
                            )}

                            {produto.descricao ? <Text style={styles.heroDesc}>{produto.descricao}</Text> : null}
                        </View>

                        {beneficiosList.length > 0 && (
                            <View style={styles.beneficiosBox}>
                                <Text style={styles.beneficiosTitle}>O QUE VOCÊ VAI RECEBER</Text>
                                {beneficiosList.map((item, index) => (
                                    <View key={index} style={styles.beneficioRow}>
                                        <MaterialCommunityIcons name="check-circle" size={18} color="#4DE38F" style={{ marginTop: 1 }} />
                                        <Text style={styles.beneficioText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {imagensExtra.length > 0 && (
                            <View>
                                <Text style={styles.previaLabel}>PRÉVIA DO CONTEÚDO</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 10 }}>
                                    {imagensExtra.map((url, index) => (
                                        <Image key={index} source={{ uri: url }} style={styles.previaImg} />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {antesDepois.length > 0 && (
                            <View>
                                <Text style={styles.previaLabel}>RESULTADOS REAIS</Text>
                                {antesDepois.map((par, index) => (
                                    <View key={index} style={styles.antesDepoisCard}>
                                        <View style={styles.antesDepoisRow}>
                                            <View style={styles.antesDepoisMetade}>
                                                <Text style={styles.antesDepoisLabel}>ANTES</Text>
                                                {par.antesUrl ? <Image source={{ uri: par.antesUrl }} style={styles.antesDepoisImg} /> : null}
                                            </View>
                                            <View style={styles.antesDepoisMetade}>
                                                <Text style={styles.antesDepoisLabel}>DEPOIS</Text>
                                                {par.depoisUrl ? <Image source={{ uri: par.depoisUrl }} style={styles.antesDepoisImg} /> : null}
                                            </View>
                                        </View>
                                        {par.legenda ? <Text style={styles.antesDepoisLegenda}>{par.legenda}</Text> : null}
                                    </View>
                                ))}
                            </View>
                        )}

                        {depoimentos.length > 0 && (
                            <View style={styles.beneficiosBox}>
                                <Text style={styles.beneficiosTitle}>O QUE ELAS DIZEM</Text>
                                {depoimentos.map((dep, index) => (
                                    <View key={index} style={[styles.depoimentoCard, index > 0 && { borderTopWidth: 1, borderTopColor: '#1c1922', paddingTop: 14 }]}>
                                        <View style={styles.depoimentoHeaderRow}>
                                            <View style={styles.depoimentoAvatar}>
                                                {dep.fotoUrl ? (
                                                    <Image source={{ uri: dep.fotoUrl }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                                                ) : (
                                                    <MaterialCommunityIcons name="account-circle" size={30} color="#555" />
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                {dep.nome ? <Text style={styles.depoimentoNome}>{dep.nome}</Text> : null}
                                                {dep.estrelas ? (
                                                    <View style={{ flexDirection: 'row', gap: 1 }}>
                                                        {[1, 2, 3, 4, 5].map((n) => (
                                                            <MaterialCommunityIcons key={n} name={n <= dep.estrelas ? 'star' : 'star-outline'} size={12} color="#FFD700" />
                                                        ))}
                                                    </View>
                                                ) : null}
                                            </View>
                                        </View>
                                        {dep.texto ? <Text style={styles.depoimentoTexto}>"{dep.texto}"</Text> : null}
                                    </View>
                                ))}
                            </View>
                        )}

                        {faqItens.length > 0 && (
                            <View>
                                <Text style={styles.previaLabel}>PERGUNTAS FREQUENTES</Text>
                                {faqItens.map((item, index) => {
                                    const aberto = faqAberto === index;
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.8}
                                            onPress={() => setFaqAberto(aberto ? null : index)}
                                            style={styles.faqCard}
                                        >
                                            <View style={styles.faqPerguntaRow}>
                                                <Text style={styles.faqPergunta}>{item.pergunta}</Text>
                                                <MaterialCommunityIcons name={aberto ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
                                            </View>
                                            {aberto && item.resposta ? <Text style={styles.faqResposta}>{item.resposta}</Text> : null}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

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
                                    {/* 🔥 ORDER BUMP — a cliente pode marcar quantos itens quiser */}
                                    {orderBumpItens.length > 0 ? (
                                        <View>
                                            <View style={styles.bumpSectionHeader}>
                                                <MaterialCommunityIcons name="star-shooting" size={16} color="#FFD700" />
                                                <Text style={styles.bumpHeaderTitle}>OFERTAS ESPECIAIS</Text>
                                            </View>
                                            {orderBumpItens.map((item) => {
                                                const marcado = bumpSelecionados.includes(item.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={item.id}
                                                        activeOpacity={0.8}
                                                        onPress={() => toggleBump(item.id)}
                                                        style={[styles.bumpCard, marcado && styles.bumpCardActive]}
                                                    >
                                                        <View style={styles.bumpContentRow}>
                                                            <MaterialCommunityIcons
                                                                name={marcado ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                                size={24}
                                                                color={marcado ? MAIN_COLOR : '#555'}
                                                                style={{ marginTop: 2 }}
                                                            />
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={styles.bumpTitle}>
                                                                    Sim! Quero adicionar {item.nome} por apenas <Text style={{ color: MAIN_COLOR }}>R$ {formatBRL(item.valor)}</Text>
                                                                </Text>
                                                                {item.descricao ? <Text style={styles.bumpDesc}>{item.descricao}</Text> : null}
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
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
                                    <Text style={styles.modernFormTitle}>{pixQrCode || pixCopyPaste ? 'COPIE O CÓDIGO PIX' : 'AGUARDANDO PAGAMENTO'}</Text>
                                    <Text style={styles.modernPixHelper}>
                                        {pixQrCode || pixCopyPaste ? 'Escaneie ou copie o código. ' : ''}
                                        Assim que o pagamento for confirmado — na hora pelo PIX ou cartão, ou em até alguns dias úteis pelo boleto — seu material é liberado aqui nesta mesma página e também enviado para o seu e-mail.
                                    </Text>

                                    {pixQrCode || pixCopyPaste ? (
                                        <>
                                            {pixQrCode ? <Image source={{ uri: pixQrCode.startsWith('data:') ? pixQrCode : `data:image/png;base64,${pixQrCode}` }} style={styles.pixImage} /> : null}

                                            {pixCopyPaste ? (
                                                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyPix}>
                                                    <MaterialCommunityIcons name={copiado ? 'check' : 'content-copy'} size={16} color={MAIN_COLOR} />
                                                    <Text style={styles.copyBtnText}>{copiado ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}</Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </>
                                    ) : null}

                                    {invoiceUrl ? (
                                        <>
                                            <View style={styles.pagDividerRow}>
                                                <View style={styles.pagDividerLine} />
                                                <Text style={styles.pagDividerText}>OU</Text>
                                                <View style={styles.pagDividerLine} />
                                            </View>

                                            <TouchableOpacity onPress={() => Linking.openURL(invoiceUrl)} activeOpacity={0.85} style={{ width: '100%' }}>
                                                <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.cardPayBtn}>
                                                    <MaterialCommunityIcons name="credit-card-outline" size={18} color="#FFF" />
                                                    <Text style={styles.cardPayBtnText}>PAGAR COM CARTÃO OU BOLETO</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                            <Text style={styles.cardPayHelper}>Você será direcionado para a página segura de pagamento.</Text>
                                        </>
                                    ) : null}

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
                                    <Text style={styles.modernPixHelper}>
                                        {itensEntrega.length > 1
                                            ? 'Tudo certo com a sua compra. Toque em cada item abaixo pra aceder imediatamente ao material.'
                                            : 'Tudo certo com a sua compra. Toque no botão abaixo para aceder imediatamente ao seu material.'}
                                    </Text>

                                    <View style={{ width: '100%', gap: 10, marginTop: 10 }}>
                                        {itensEntrega.map((item, index) => (
                                            <View key={index} style={{ gap: 10 }}>
                                                {!!item.linkEntrega && (
                                                    <TouchableOpacity onPress={() => handleAcessarItem(item.linkEntrega)} activeOpacity={0.85}>
                                                        <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.entrarGrupoBtn}>
                                                            <MaterialCommunityIcons name="download" size={20} color="#FFF" />
                                                            <Text style={styles.submitBtnText} numberOfLines={1}>
                                                                {itensEntrega.length > 1 ? `ACESSAR: ${item.nome.toUpperCase()}` : 'ACESSAR MEU MATERIAL'}
                                                            </Text>
                                                        </LinearGradient>
                                                    </TouchableOpacity>
                                                )}
                                                {/* 🔥 TREINO INTERATIVO — só aparece quando esse item tem programa configurado */}
                                                {!!item.treinoToken && (
                                                    <TouchableOpacity
                                                        onPress={() => handleAcessarItem(`${SITE_URL}/ProdutoTreino?token=${item.treinoToken}`)}
                                                        activeOpacity={0.85}
                                                        style={[styles.entrarGrupoBtn, { backgroundColor: TREINO_COLOR }]}
                                                    >
                                                        <MaterialCommunityIcons name="dumbbell" size={20} color="#0a0a0a" />
                                                        <Text style={[styles.submitBtnText, { color: '#0a0a0a' }]} numberOfLines={1}>
                                                            COMEÇAR MEU TREINO
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* 🔥 PROVA SOCIAL DINÂMICA — flutua sobre o conteúdo, sempre com
                vendas reais. Some sozinha se não houver nenhuma. */}
            {provaSocial ? (
                <Animated.View style={[styles.provaSocialToast, { opacity: provaSocialOpacity }]} pointerEvents="none">
                    <MaterialCommunityIcons name="check-decagram" size={16} color="#4DE38F" />
                    <Text style={styles.provaSocialText} numberOfLines={1}>
                        <Text style={{ fontWeight: '900', color: '#FFF' }}>{provaSocial.nome}</Text>
                        <Text style={{ color: '#AAA' }}> comprou {tempoRelativo(provaSocial.data)}</Text>
                    </Text>
                </Animated.View>
            ) : null}
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
    heroDesc: { color: '#AAA', fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10, marginTop: 12 },

    priceBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    precoDeText: { color: '#777', fontSize: 15, textDecorationLine: 'line-through' },
    precoPorText: { color: MAIN_COLOR, fontSize: 24, fontWeight: '900' },
    descontoBadge: { backgroundColor: 'rgba(77,227,143,0.15)', borderWidth: 1, borderColor: '#4DE38F', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    descontoBadgeText: { color: '#4DE38F', fontSize: 11, fontWeight: '900' },
    precoSoText: { color: MAIN_COLOR, fontSize: 24, fontWeight: '900', textAlign: 'center' },

    beneficiosBox: { backgroundColor: '#111015', borderRadius: 16, borderWidth: 1, borderColor: '#1c1922', padding: 18, gap: 10 },
    beneficiosTitle: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    beneficioRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    beneficioText: { flex: 1, color: '#CCC', fontSize: 13, lineHeight: 19 },

    previaLabel: { color: '#666', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    previaImg: { width: 130, height: 175, borderRadius: 10, backgroundColor: '#111015', borderWidth: 1, borderColor: '#1c1922' },

    antesDepoisCard: { backgroundColor: '#111015', borderRadius: 16, borderWidth: 1, borderColor: '#1c1922', padding: 14, marginBottom: 12 },
    antesDepoisRow: { flexDirection: 'row', gap: 10 },
    antesDepoisMetade: { flex: 1, alignItems: 'center' },
    antesDepoisLabel: { color: '#888', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
    antesDepoisImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: 10, backgroundColor: '#060608' },
    antesDepoisLegenda: { color: '#AAA', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },

    depoimentoCard: { gap: 8 },
    depoimentoHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    depoimentoAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c1922', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    depoimentoNome: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    depoimentoTexto: { color: '#CCC', fontSize: 13, lineHeight: 19, fontStyle: 'italic' },

    faqCard: { backgroundColor: '#111015', borderRadius: 14, borderWidth: 1, borderColor: '#1c1922', padding: 16, marginBottom: 10 },
    faqPerguntaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    faqPergunta: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '800', lineHeight: 18 },
    faqResposta: { color: '#AAA', fontSize: 13, lineHeight: 19, marginTop: 10 },

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
    bumpSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#2A2633', borderRadius: 8, marginBottom: 12 },
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
    pagDividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 10, marginBottom: 16 },
    pagDividerLine: { flex: 1, height: 1, backgroundColor: '#1c1922' },
    pagDividerText: { color: '#555', fontSize: 11, fontWeight: '700' },
    cardPayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, width: '100%' },
    cardPayBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
    cardPayHelper: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 16 },
    provaSocialToast: {
        position: isWeb ? 'fixed' : 'absolute',
        bottom: 18, left: 18, maxWidth: 280,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333',
        borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
        zIndex: 999,
    },
    provaSocialText: { fontSize: 12, flexShrink: 1 },
    entrarGrupoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16 },
});