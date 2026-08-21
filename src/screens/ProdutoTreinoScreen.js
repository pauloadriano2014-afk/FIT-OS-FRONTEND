// src/screens/ProdutoTreinoScreen.js
// 🔥 TREINO INTERATIVO — tela pública, sem login, acessada por link mágico
// (?token=) enviado por e-mail assim que a compra de um Produto Digital com
// `treinoPrograma` configurado é confirmada. Mostra o programa de treino
// estruturado (dias, exercícios, séries/reps, vídeos), deixa a aluna marcar
// cada sessão como concluída e registrar a carga usada — sem precisar criar
// conta nem senha. Standalone: não depende de AsyncStorage/ThemeContext, só
// do token da URL.
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Platform, Linking, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { generateTreinoPDF } from '../utils/treinoPdfUtils';

const API_BASE = 'https://fitos-final.onrender.com';

const COR_FUNDO = '#0a0a0a';
const COR_CARD = '#1a1a1a';
const COR_CARD_BORDA = '#2a2a2a';
const COR_ROXO = '#8B5CF6';
const COR_VERDE = '#4DE38F';
const COR_TEXTO = '#FFFFFF';
const COR_TEXTO_SEC = '#999999';

const METODOS = [
    { nome: 'REST-PAUSE', desc: 'Faça uma pausa curta (15 a 20s) e continue até a falha.' },
    { nome: 'FALHA', desc: 'Execute o exercício até não conseguir mais completar uma repetição.' },
    { nome: 'T.U.T.', desc: 'Tempo sob tensão — execute o movimento com controle e cadência adequada.' },
    { nome: 'BI-SET', desc: 'Execute dois exercícios em sequência pro mesmo grupo muscular, sem pausa.' },
    { nome: 'DROP-SET', desc: 'Reduza a carga e continue o exercício até a falha.' },
];

function formatData(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
        return '';
    }
}

export default function ProdutoTreinoScreen({ route }) {
    const token = route?.params?.token;

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [dados, setDados] = useState(null); // { nomeCliente, produtoNome, treinoPrograma, progresso }
    const [view, setView] = useState('lista'); // 'lista' | 'detalhe'
    const [treinoIndex, setTreinoIndex] = useState(null);
    const [guiaAberto, setGuiaAberto] = useState(false);
    const [cargas, setCargas] = useState({});
    const [salvando, setSalvando] = useState(false);
    const [baixandoPdf, setBaixandoPdf] = useState(false);

    const carregar = useCallback(async () => {
        if (!token) {
            setErro('Link inválido — token não encontrado.');
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/produtos/treino/${encodeURIComponent(token)}`);
            const data = await res.json();
            if (!res.ok) {
                setErro(data.error || 'Não foi possível carregar seu treino.');
            } else if (!data.treinoPrograma || !Array.isArray(data.treinoPrograma.treinos) || data.treinoPrograma.treinos.length === 0) {
                setErro('Esse produto ainda não tem um programa de treino configurado.');
            } else {
                setDados(data);
            }
        } catch (e) {
            console.log('Erro ao carregar treino', e);
            setErro('Não foi possível conectar. Verifique sua internet e tente de novo.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { carregar(); }, [carregar]);

    const sessoes = dados?.progresso?.sessoes || [];
    const treinos = dados?.treinoPrograma?.treinos || [];
    const duracaoSemanas = dados?.treinoPrograma?.duracaoSemanas;

    const sessoesDoTreino = (idx) => sessoes.filter((s) => s.treinoIndex === idx);
    const ultimaSessao = (idx) => {
        const lista = sessoesDoTreino(idx);
        if (lista.length === 0) return null;
        return lista.reduce((a, b) => (new Date(a.data) > new Date(b.data) ? a : b));
    };

    const abrirTreino = (idx) => {
        const ultima = ultimaSessao(idx);
        setCargas(ultima?.cargas || {});
        setTreinoIndex(idx);
        setView('detalhe');
    };

    const voltarLista = () => {
        setView('lista');
        setTreinoIndex(null);
        setCargas({});
    };

    const handleConcluir = async () => {
        if (treinoIndex === null) return;
        setSalvando(true);
        try {
            const res = await fetch(`${API_BASE}/api/produtos/treino/${encodeURIComponent(token)}/progresso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ treinoIndex, cargas }),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = data.error || 'Erro ao salvar seu treino.';
                Platform.OS === 'web' ? window.alert(msg) : null;
                return;
            }
            setDados((prev) => ({ ...prev, progresso: data.progresso }));
            const msg = 'Treino registrado! Bora pra próxima. 💪';
            if (Platform.OS === 'web') window.alert(msg);
            voltarLista();
        } catch (e) {
            console.log('Erro ao salvar progresso', e);
            const msg = 'Não foi possível salvar agora. Tenta de novo em instantes.';
            if (Platform.OS === 'web') window.alert(msg);
        } finally {
            setSalvando(false);
        }
    };

    const abrirVideo = (url) => {
        if (!url) return;
        Linking.openURL(url).catch(() => {
            if (Platform.OS === 'web') window.open(url, '_blank');
        });
    };

    const handleBaixarPdf = async () => {
        if (!dados || baixandoPdf) return;
        setBaixandoPdf(true);
        try {
            await generateTreinoPDF(dados);
        } finally {
            setBaixandoPdf(false);
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
                <Text style={styles.erroTexto}>{erro || 'Não foi possível carregar seu treino.'}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
                {view === 'lista' ? (
                    <>
                        <Text style={styles.marca}>PA ELITE TEAM</Text>
                        <Text style={styles.titulo}>{dados.produtoNome}</Text>
                        <Text style={styles.subtitulo}>
                            Oie, {dados.nomeCliente?.split(' ')[0] || 'atleta'}! Aqui está seu programa completo
                            {duracaoSemanas ? ` — siga por ${duracaoSemanas} semanas` : ''}. Toque num treino pra começar.
                        </Text>

                        <TouchableOpacity
                            style={[styles.pdfBtn, { opacity: baixandoPdf ? 0.6 : 1 }]}
                            onPress={handleBaixarPdf}
                            disabled={baixandoPdf}
                        >
                            {baixandoPdf
                                ? <ActivityIndicator color={COR_ROXO} size="small" />
                                : (
                                    <>
                                        <MaterialCommunityIcons name="file-pdf-box" size={18} color={COR_ROXO} />
                                        <Text style={styles.pdfBtnTexto}>BAIXAR FICHA EM PDF</Text>
                                    </>
                                )
                            }
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.guiaCard} onPress={() => setGuiaAberto(!guiaAberto)} activeOpacity={0.8}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialCommunityIcons name="book-open-variant" size={18} color={COR_ROXO} />
                                    <Text style={styles.guiaTitulo}>GUIA DE INÍCIO — como usar seu treino</Text>
                                </View>
                                <MaterialCommunityIcons name={guiaAberto ? 'chevron-up' : 'chevron-down'} size={22} color={COR_TEXTO_SEC} />
                            </View>
                            {guiaAberto && (
                                <View style={{ marginTop: 14, gap: 12 }}>
                                    <Text style={styles.guiaTexto}>
                                        O número de séries vem antes da barra, as repetições depois. Quando aparece mais de um
                                        número (ex: 12/10/8), são séries progressivas — 1ª série 12 repetições, 2ª série 10, 3ª série 8.
                                        Quando aparecer "+ DROP-SET" ou "+ REST-PAUSE", aplique o método indicado logo após a última série.
                                    </Text>
                                    {METODOS.map((m) => (
                                        <View key={m.nome} style={{ flexDirection: 'row', gap: 8 }}>
                                            <Text style={styles.metodoNome}>{m.nome}:</Text>
                                            <Text style={styles.guiaTexto}>{m.desc}</Text>
                                        </View>
                                    ))}
                                    <Text style={styles.guiaTexto}>
                                        A execução correta e a intensidade importam mais que a carga. Priorize a técnica, conecte-se
                                        com o músculo e progrida o peso aos poucos, sessão após sessão.
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.secaoLabel}>SEUS TREINOS</Text>
                        {treinos.map((treino, idx) => {
                            const qtd = sessoesDoTreino(idx).length;
                            const ultima = ultimaSessao(idx);
                            return (
                                <TouchableOpacity key={idx} style={styles.treinoCard} onPress={() => abrirTreino(idx)} activeOpacity={0.85}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.treinoNumero}>TREINO {idx + 1}</Text>
                                        <Text style={styles.treinoNome}>{treino.nome || treino.foco}</Text>
                                        {!!treino.foco && treino.nome && <Text style={styles.treinoFoco}>{treino.foco}</Text>}
                                        <Text style={styles.treinoMeta}>
                                            {qtd > 0 ? `${qtd} sessão${qtd > 1 ? 'ões' : ''} concluída${qtd > 1 ? 's' : ''}` : 'Ainda não iniciado'}
                                            {ultima ? ` · última em ${formatData(ultima.data)}` : ''}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={26} color={COR_TEXTO_SEC} />
                                </TouchableOpacity>
                            );
                        })}
                    </>
                ) : (
                    <>
                        <TouchableOpacity style={styles.voltarRow} onPress={voltarLista}>
                            <MaterialCommunityIcons name="arrow-left" size={18} color={COR_TEXTO_SEC} />
                            <Text style={styles.voltarTexto}>TODOS OS TREINOS</Text>
                        </TouchableOpacity>

                        {(() => {
                            const treino = treinos[treinoIndex];
                            if (!treino) return null;
                            return (
                                <>
                                    <Text style={styles.treinoNumero}>TREINO {treinoIndex + 1}</Text>
                                    <Text style={styles.titulo}>{treino.nome || treino.foco}</Text>
                                    {!!treino.foco && treino.nome && <Text style={styles.subtitulo}>{treino.foco}</Text>}
                                    {!!treino.descanso && (
                                        <Text style={styles.descansoTag}>⏱ DESCANSO: {treino.descanso}</Text>
                                    )}

                                    {(treino.exercicios || []).map((ex, exIdx) => (
                                        <View key={exIdx} style={styles.exCard}>
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                                                <View style={styles.exNumeroBadge}>
                                                    <Text style={styles.exNumeroTexto}>{ex.ordem ?? exIdx + 1}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.exNome}>{ex.nome}</Text>
                                                    {!!ex.seriesRepeticoes && <Text style={styles.exSeries}>{ex.seriesRepeticoes}</Text>}
                                                    {!!(ex.muscPrincipal?.length) && (
                                                        <Text style={styles.exMusculo}>
                                                            <Text style={{ color: COR_ROXO }}>Principal: </Text>
                                                            {Array.isArray(ex.muscPrincipal) ? ex.muscPrincipal.join(', ') : ex.muscPrincipal}
                                                        </Text>
                                                    )}
                                                    {!!(ex.muscSecundario?.length) && (
                                                        <Text style={styles.exMusculo}>
                                                            <Text style={{ color: COR_VERDE }}>Secundário: </Text>
                                                            {Array.isArray(ex.muscSecundario) ? ex.muscSecundario.join(', ') : ex.muscSecundario}
                                                        </Text>
                                                    )}
                                                    {!!ex.orientacao && <Text style={styles.exOrientacao}>» {ex.orientacao}</Text>}

                                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' }}>
                                                        {!!ex.videoUrl && (
                                                            <TouchableOpacity style={styles.videoBtn} onPress={() => abrirVideo(ex.videoUrl)}>
                                                                <MaterialCommunityIcons name="youtube" size={16} color="#FF3B30" />
                                                                <Text style={styles.videoBtnTexto}>VER VÍDEO</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                        <View style={styles.cargaWrap}>
                                                            <Text style={styles.cargaLabel}>Carga (kg)</Text>
                                                            <TextInput
                                                                style={styles.cargaInput}
                                                                keyboardType="numeric"
                                                                value={cargas[exIdx] !== undefined ? String(cargas[exIdx]) : ''}
                                                                onChangeText={(v) => setCargas((prev) => ({ ...prev, [exIdx]: v }))}
                                                                placeholder="—"
                                                                placeholderTextColor="#555"
                                                            />
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    ))}

                                    <TouchableOpacity
                                        style={[styles.concluirBtn, { opacity: salvando ? 0.6 : 1 }]}
                                        onPress={handleConcluir}
                                        disabled={salvando}
                                    >
                                        {salvando
                                            ? <ActivityIndicator color="#0a0a0a" size="small" />
                                            : (
                                                <>
                                                    <MaterialCommunityIcons name="check-circle" size={18} color="#0a0a0a" />
                                                    <Text style={styles.concluirBtnTexto}>MARCAR TREINO COMO CONCLUÍDO</Text>
                                                </>
                                            )
                                        }
                                    </TouchableOpacity>
                                </>
                            );
                        })()}
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

    pdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: COR_ROXO, borderRadius: 12, paddingVertical: 12, marginBottom: 18 },
    pdfBtnTexto: { color: COR_ROXO, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },

    guiaCard: { backgroundColor: COR_CARD, borderWidth: 1, borderColor: COR_CARD_BORDA, borderRadius: 16, padding: 16, marginBottom: 24 },
    guiaTitulo: { color: COR_TEXTO, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },
    guiaTexto: { color: COR_TEXTO_SEC, fontSize: 12, lineHeight: 19, flex: 1 },
    metodoNome: { color: COR_VERDE, fontSize: 12, fontWeight: '900', minWidth: 84 },

    secaoLabel: { color: COR_TEXTO_SEC, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },

    treinoCard: {
        backgroundColor: COR_CARD, borderWidth: 1, borderColor: COR_CARD_BORDA, borderRadius: 14,
        padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    treinoNumero: { color: COR_ROXO, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    treinoNome: { color: COR_TEXTO, fontSize: 15, fontWeight: '900' },
    treinoFoco: { color: COR_TEXTO_SEC, fontSize: 12, marginTop: 2 },
    treinoMeta: { color: COR_VERDE, fontSize: 11, fontWeight: '700', marginTop: 6 },

    voltarRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    voltarTexto: { color: COR_TEXTO_SEC, fontSize: 11, fontWeight: '900' },

    descansoTag: { color: COR_TEXTO_SEC, fontSize: 11, fontWeight: '700', marginTop: 4, marginBottom: 18 },

    exCard: { backgroundColor: COR_CARD, borderWidth: 1, borderColor: COR_CARD_BORDA, borderRadius: 14, padding: 16, marginBottom: 12, overflow: 'hidden' },
    exNumeroBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: `${COR_ROXO}25`, alignItems: 'center', justifyContent: 'center' },
    exNumeroTexto: { color: COR_ROXO, fontSize: 12, fontWeight: '900' },
    exNome: { color: COR_TEXTO, fontSize: 14, fontWeight: '900', marginBottom: 3 },
    exSeries: { color: COR_VERDE, fontSize: 13, fontWeight: '900', marginBottom: 6 },
    exMusculo: { color: COR_TEXTO_SEC, fontSize: 11, marginBottom: 2 },
    exOrientacao: { color: COR_TEXTO_SEC, fontSize: 12, lineHeight: 18, marginTop: 6, fontStyle: 'italic' },

    videoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 },
    videoBtnTexto: { color: COR_TEXTO_SEC, fontSize: 10, fontWeight: '900' },

    cargaWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
    cargaLabel: { color: COR_TEXTO_SEC, fontSize: 10, fontWeight: '700' },
    cargaInput: { width: 52, borderWidth: 1, borderColor: '#333', borderRadius: 8, color: COR_TEXTO, fontSize: 13, textAlign: 'center', paddingVertical: 6 },

    concluirBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COR_VERDE, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
    concluirBtnTexto: { color: '#0a0a0a', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
});
