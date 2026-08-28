// src/screens/ProdutoCursoScreen.js
// 🔥 CURSO / ÁREA DE MEMBROS — tela pública, sem login, acessada por link
// mágico (?token=) enviado por e-mail assim que a compra de um Produto
// Digital com `cursoPrograma` configurado é confirmada. Mostra os módulos do
// curso — alguns já liberados, outros ainda bloqueados (liberam alguns dias
// depois da compra, pra proteger contra reembolso abusivo durante os 7 dias
// de garantia) — deixa o aluno assistir as aulas liberadas, marcar cada uma
// como concluída, e baixar um certificado quando terminar tudo. Standalone:
// não depende de AsyncStorage/ThemeContext, só do token da URL — mesmo
// padrão do ProdutoTreinoScreen.js.
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Platform, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getVideoEmbedUrl } from '../utils/videoEmbedUtils';
import { generateCursoCertificadoPDF } from '../utils/cursoCertificadoUtils';

const API_BASE = 'https://fitos-final.onrender.com';

const COR_FUNDO = '#0a0a0a';
const COR_CARD = '#1a1a1a';
const COR_CARD_BORDA = '#2a2a2a';
const COR_ROXO = '#8B5CF6';
const COR_ROXO_CLARO = '#C4B5FD';
const COR_VERDE = '#4DE38F';
const COR_TEXTO = '#FFFFFF';
const COR_TEXTO_SEC = '#999999';

export default function ProdutoCursoScreen({ route }) {
    const token = route?.params?.token;

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [dados, setDados] = useState(null); // { nomeCliente, produtoNome, modulos, cursoCompleto, certificadoEmitidoEm }
    const [view, setView] = useState('lista'); // 'lista' | 'modulo' | 'aula'
    const [moduloIndex, setModuloIndex] = useState(null);
    const [aulaIndex, setAulaIndex] = useState(null);
    const [salvandoAula, setSalvandoAula] = useState(false);
    const [gerandoCertificado, setGerandoCertificado] = useState(false);

    const carregar = useCallback(async () => {
        if (!token) {
            setErro('Link inválido — token não encontrado.');
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/produtos/curso/${encodeURIComponent(token)}`);
            const data = await res.json();
            if (!res.ok) {
                setErro(data.error || 'Não foi possível carregar seu curso.');
            } else if (!Array.isArray(data.modulos) || data.modulos.length === 0) {
                setErro('Esse produto ainda não tem um curso configurado.');
            } else {
                setDados(data);
            }
        } catch (e) {
            console.log('Erro ao carregar curso', e);
            setErro('Não foi possível conectar. Verifique sua internet e tente de novo.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { carregar(); }, [carregar]);

    const modulos = dados?.modulos || [];

    const abrirModulo = (idx) => {
        if (!modulos[idx]?.liberada) return;
        setModuloIndex(idx);
        setView('modulo');
    };

    const abrirAula = (idx) => {
        setAulaIndex(idx);
        setView('aula');
    };

    const voltarLista = () => {
        setView('lista');
        setModuloIndex(null);
        setAulaIndex(null);
    };

    const voltarModulo = () => {
        setView('modulo');
        setAulaIndex(null);
    };

    const handleToggleConcluida = async () => {
        if (moduloIndex === null || aulaIndex === null || salvandoAula) return;
        setSalvandoAula(true);
        try {
            const res = await fetch(`${API_BASE}/api/produtos/curso/${encodeURIComponent(token)}/progresso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduloIdx: moduloIndex, aulaIdx: aulaIndex }),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = data.error || 'Erro ao salvar seu progresso.';
                Platform.OS === 'web' ? window.alert(msg) : null;
                return;
            }
            // Atualiza localmente sem precisar recarregar tudo do servidor.
            setDados((prev) => {
                if (!prev) return prev;
                const novosModulos = prev.modulos.map((m, mIdx) => {
                    if (mIdx !== moduloIndex) return m;
                    const novasAulas = m.aulas.map((a, aIdx) => (aIdx === aulaIndex ? { ...a, concluida: data.concluida } : a));
                    return { ...m, aulas: novasAulas };
                });
                // cursoCompleto só é possível quando TODO módulo já liberou (senão
                // os bloqueados nem mandam a lista de aulas pra gente contar aqui).
                const todosLiberados = novosModulos.every((m) => m.liberada);
                const totalAulas = novosModulos.reduce((acc, m) => acc + m.aulas.length, 0);
                const totalConcluidas = novosModulos.reduce((acc, m) => acc + m.aulas.filter((a) => a.concluida).length, 0);
                const cursoCompleto = todosLiberados && totalAulas > 0 && totalConcluidas === totalAulas;
                return { ...prev, modulos: novosModulos, cursoCompleto };
            });
        } catch (e) {
            console.log('Erro ao salvar progresso da aula', e);
        } finally {
            setSalvandoAula(false);
        }
    };

    const handleBaixarCertificado = async () => {
        if (!dados || gerandoCertificado) return;
        setGerandoCertificado(true);
        try {
            await generateCursoCertificadoPDF({ nomeCliente: dados.nomeCliente, produtoNome: dados.produtoNome });
            if (!dados.certificadoEmitidoEm) {
                fetch(`${API_BASE}/api/produtos/curso/${encodeURIComponent(token)}/progresso`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emitirCertificado: true }),
                }).catch(() => {});
                setDados((prev) => (prev ? { ...prev, certificadoEmitidoEm: new Date().toISOString() } : prev));
            }
        } finally {
            setGerandoCertificado(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COR_ROXO} />
            </SafeAreaView>
        );
    }

    if (erro || !dados) {
        return (
            <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
                <MaterialCommunityIcons name="link-off" size={40} color={COR_TEXTO_SEC} />
                <Text style={styles.erroTitulo}>Ops!</Text>
                <Text style={styles.erroTexto}>{erro || 'Não foi possível carregar seu curso.'}</Text>
            </SafeAreaView>
        );
    }

    const modulo = moduloIndex !== null ? modulos[moduloIndex] : null;
    const aula = modulo && aulaIndex !== null ? modulo.aulas[aulaIndex] : null;

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
                {view === 'lista' && (
                    <>
                        <Text style={styles.marca}>ELITE FIT</Text>
                        <Text style={styles.titulo}>{dados.produtoNome}</Text>
                        <Text style={styles.subtitulo}>
                            Oie, {dados.nomeCliente?.split(' ')[0] || 'atleta'}! Aqui está sua área de membros. O conteúdo libera
                            aos poucos, módulo por módulo — acompanhe o prazo de cada um abaixo.
                        </Text>

                        {dados.cursoCompleto && (
                            <TouchableOpacity
                                style={[styles.certificadoBtn, { opacity: gerandoCertificado ? 0.6 : 1 }]}
                                onPress={handleBaixarCertificado}
                                disabled={gerandoCertificado}
                            >
                                {gerandoCertificado
                                    ? <ActivityIndicator color="#0a0a0a" size="small" />
                                    : (
                                        <>
                                            <MaterialCommunityIcons name="certificate-outline" size={18} color="#0a0a0a" />
                                            <Text style={styles.certificadoBtnTexto}>BAIXAR CERTIFICADO DE CONCLUSÃO</Text>
                                        </>
                                    )
                                }
                            </TouchableOpacity>
                        )}

                        <Text style={styles.secaoLabel}>MÓDULOS</Text>
                        {modulos.map((m, idx) => {
                            const concluidas = m.liberada ? m.aulas.filter((a) => a.concluida).length : 0;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.moduloCard, !m.liberada && styles.moduloCardBloqueado]}
                                    onPress={() => abrirModulo(idx)}
                                    activeOpacity={m.liberada ? 0.85 : 1}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.moduloNumero}>MÓDULO {idx + 1}</Text>
                                        <Text style={styles.moduloNome}>{m.nome}</Text>
                                        {m.liberada ? (
                                            <Text style={styles.moduloMeta}>
                                                {m.aulas.length} aula{m.aulas.length !== 1 ? 's' : ''} · {concluidas} concluída{concluidas !== 1 ? 's' : ''}
                                            </Text>
                                        ) : (
                                            <Text style={styles.moduloBloqueadoTexto}>
                                                🔒 Libera em {m.diasParaLiberar} dia{m.diasParaLiberar !== 1 ? 's' : ''}
                                            </Text>
                                        )}
                                    </View>
                                    <MaterialCommunityIcons
                                        name={m.liberada ? 'chevron-right' : 'lock-outline'}
                                        size={24}
                                        color={COR_TEXTO_SEC}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </>
                )}

                {view === 'modulo' && modulo && (
                    <>
                        <TouchableOpacity style={styles.voltarRow} onPress={voltarLista}>
                            <MaterialCommunityIcons name="arrow-left" size={18} color={COR_TEXTO_SEC} />
                            <Text style={styles.voltarTexto}>TODOS OS MÓDULOS</Text>
                        </TouchableOpacity>

                        <Text style={styles.moduloNumero}>MÓDULO {moduloIndex + 1}</Text>
                        <Text style={styles.titulo}>{modulo.nome}</Text>

                        <Text style={styles.secaoLabel}>AULAS</Text>
                        {modulo.aulas.map((a, idx) => (
                            <TouchableOpacity key={idx} style={styles.aulaCard} onPress={() => abrirAula(idx)} activeOpacity={0.85}>
                                <MaterialCommunityIcons
                                    name={a.concluida ? 'check-circle' : 'play-circle-outline'}
                                    size={22}
                                    color={a.concluida ? COR_VERDE : COR_ROXO}
                                />
                                <Text style={[styles.aulaNome, a.concluida && { color: COR_TEXTO_SEC }]}>{a.nome}</Text>
                                <MaterialCommunityIcons name="chevron-right" size={22} color={COR_TEXTO_SEC} />
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {view === 'aula' && modulo && aula && (
                    <>
                        <TouchableOpacity style={styles.voltarRow} onPress={voltarModulo}>
                            <MaterialCommunityIcons name="arrow-left" size={18} color={COR_TEXTO_SEC} />
                            <Text style={styles.voltarTexto}>{modulo.nome.toUpperCase()}</Text>
                        </TouchableOpacity>

                        <Text style={styles.titulo}>{aula.nome}</Text>

                        {!!aula.videoUrl && (
                            <View style={[
                                styles.videoWrapper,
                                aula.videoOrientacao === 'horizontal' ? styles.videoWrapperHorizontal : styles.videoWrapperVertical,
                            ]}>
                                {Platform.OS === 'web' ? (
                                    <iframe
                                        src={getVideoEmbedUrl(aula.videoUrl)}
                                        style={{ width: '100%', height: '100%', border: 0, borderRadius: 14 }}
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <WebView
                                        source={{ uri: getVideoEmbedUrl(aula.videoUrl) }}
                                        style={{ flex: 1, borderRadius: 14, backgroundColor: '#000' }}
                                        allowsFullscreenVideo
                                        mediaPlaybackRequiresUserAction={false}
                                    />
                                )}
                            </View>
                        )}

                        {!!aula.descricao && <Text style={styles.aulaDescricao}>{aula.descricao}</Text>}

                        {!!aula.anexoUrl && (
                            <TouchableOpacity
                                style={styles.anexoBtn}
                                onPress={() => (Platform.OS === 'web' ? window.open(aula.anexoUrl, '_blank') : null)}
                            >
                                <MaterialCommunityIcons name="paperclip" size={16} color={COR_ROXO_CLARO} />
                                <Text style={styles.anexoBtnTexto}>MATERIAL DE APOIO</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.concluirBtn,
                                aula.concluida && { backgroundColor: COR_CARD, borderWidth: 1, borderColor: COR_VERDE },
                                { opacity: salvandoAula ? 0.6 : 1 },
                            ]}
                            onPress={handleToggleConcluida}
                            disabled={salvandoAula}
                        >
                            {salvandoAula
                                ? <ActivityIndicator color={aula.concluida ? COR_VERDE : '#0a0a0a'} size="small" />
                                : (
                                    <>
                                        <MaterialCommunityIcons
                                            name={aula.concluida ? 'check-circle' : 'check-circle-outline'}
                                            size={18}
                                            color={aula.concluida ? COR_VERDE : '#0a0a0a'}
                                        />
                                        <Text style={[styles.concluirBtnTexto, aula.concluida && { color: COR_VERDE }]}>
                                            {aula.concluida ? 'AULA CONCLUÍDA' : 'MARCAR AULA COMO CONCLUÍDA'}
                                        </Text>
                                    </>
                                )
                            }
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COR_FUNDO },

    erroTitulo: { color: COR_TEXTO, fontSize: 20, fontWeight: '900', marginTop: 14 },
    erroTexto: { color: COR_TEXTO_SEC, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },

    marca: { color: COR_ROXO, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
    titulo: { color: COR_TEXTO, fontSize: 22, fontWeight: '900', marginBottom: 4 },
    subtitulo: { color: COR_TEXTO_SEC, fontSize: 13, lineHeight: 20, marginBottom: 18 },

    certificadoBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: COR_VERDE, borderRadius: 14, paddingVertical: 14, marginBottom: 20,
    },
    certificadoBtnTexto: { color: '#0a0a0a', fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },

    secaoLabel: { color: COR_TEXTO_SEC, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },

    moduloCard: {
        backgroundColor: COR_CARD, borderWidth: 1, borderColor: COR_CARD_BORDA, borderRadius: 14,
        padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    moduloCardBloqueado: { opacity: 0.6 },
    moduloNumero: { color: COR_ROXO, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    moduloNome: { color: COR_TEXTO, fontSize: 15, fontWeight: '900' },
    moduloMeta: { color: COR_VERDE, fontSize: 11, fontWeight: '700', marginTop: 6 },
    moduloBloqueadoTexto: { color: COR_TEXTO_SEC, fontSize: 11, fontWeight: '700', marginTop: 6 },

    voltarRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    voltarTexto: { color: COR_TEXTO_SEC, fontSize: 11, fontWeight: '900' },

    aulaCard: {
        backgroundColor: COR_CARD, borderWidth: 1, borderColor: COR_CARD_BORDA, borderRadius: 14,
        padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    aulaNome: { flex: 1, color: COR_TEXTO, fontSize: 14, fontWeight: '700' },

    videoWrapper: { width: '100%', borderRadius: 14, overflow: 'hidden', backgroundColor: '#000', marginTop: 14, marginBottom: 16 },
    videoWrapperVertical: { aspectRatio: 9 / 16, maxWidth: 360, alignSelf: 'center' },
    videoWrapperHorizontal: { aspectRatio: 16 / 9 },

    aulaDescricao: { color: COR_TEXTO_SEC, fontSize: 13, lineHeight: 20, marginBottom: 16 },

    anexoBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
        borderWidth: 1, borderColor: COR_ROXO_CLARO, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, marginBottom: 18,
    },
    anexoBtnTexto: { color: COR_ROXO_CLARO, fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },

    concluirBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COR_VERDE, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
    concluirBtnTexto: { color: '#0a0a0a', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
});
