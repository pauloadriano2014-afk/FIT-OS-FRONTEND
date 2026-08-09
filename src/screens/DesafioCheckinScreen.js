// src/screens/DesafioCheckinScreen.js
//
// Página pública de check-in diário pras participantes de um Desafio
// (ex: Projeto 90 Dias). Fluxo:
// 1. Busca os dados do desafio pelo slug (?desafio=slug na URL)
// 2. Primeira vez: pede o telefone (o mesmo do cadastro) pra identificar
//    quem é — depois disso o celular lembra, sem precisar digitar de novo
// 3. Mostra o check-in do dia: Treino, Cardio, Alimentação, Água, Foto na
//    academia — e, se for SÁBADO, mais 3 campos (frente/lado/costas)
// 4. Reabrir no mesmo dia carrega o que já foi marcado (upsert no backend)

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Platform, SafeAreaView, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import FaqAccordion from '../components/FaqAccordion';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;

const API_BASE = 'https://fitos-final.onrender.com';
const MAIN_COLOR = '#8B5CF6';
const LIGHT_COLOR = '#C4B5FD';
const DARK_COLOR = '#6D28D9';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_ABREV = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// ── FAQ do check-in — dúvidas comuns de quem nunca usou o formulário ─────
const faqListCheckin = [
    { q: 'O que conta como "Treino"?', a: 'Qualquer treino que você fizer no dia — na academia, em casa, o que estiver combinado com você. O importante é marcar quando cumprir.' },
    { q: 'Preciso mandar foto todo dia?', a: 'A foto na academia é diária — é o que mostra que você foi treinar. Já as 3 fotos de frente/lado/costas são só aos sábados.' },
    { q: 'Esqueci de fazer o check-in de ontem, posso fazer agora?', a: 'Não dá — o link sempre registra o check-in do dia de HOJE. Se perder um dia, sem problema, é só continuar a partir de hoje.' },
    { q: 'Posso editar o check-in depois de enviar?', a: 'Sim! Reabra o link no mesmo dia e ajuste o que quiser — ele atualiza automaticamente, não duplica nem cria um novo.' },
    { q: 'Pra que servem as fotos de sábado (frente/lado/costas)?', a: 'São pra Adri acompanhar sua evolução física real ao longo dos 90 dias — sem elas, fica difícil enxergar o progresso.' },
    { q: 'Meus dados e fotos ficam visíveis pras outras participantes?', a: 'Não. Só você e a equipe (Adri/Paulo) têm acesso ao que você envia.' },
    { q: 'A pontuação muda em algum dia?', a: 'Sim! Fim de semana já vale mais pontos por padrão. Além disso, em feriados ou datas especiais a pontuação pode aumentar ainda mais — sempre avisamos aqui na página com antecedência, então fica de olho nos avisos.' },
];

// ── Helpers ──────────────────────────────────────────────────────────────
function onlyDigits(v) { return (v || '').replace(/\D/g, ''); }

function formatTelefone(v) {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

function hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dataParaISO(dataISOString) {
    // Compara datas ignorando fuso/hora — a data vem em UTC do backend
    const d = new Date(dataISOString);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export default function DesafioCheckinScreen({ route, navigation }) {
    const slug = route?.params?.desafio?.trim() || '';
    const isPreview = ['true', true].includes(route?.params?.preview);

    const handlePreviewBack = () => {
        if (navigation?.canGoBack?.()) {
            navigation.goBack();
        } else if (navigation?.navigate) {
            navigation.navigate('AdminDashboard');
        }
    };

    const [desafio, setDesafio] = useState(null);
    const [loadingDesafio, setLoadingDesafio] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // step: 'carregando' | 'identificar' | 'checkin'
    const [step, setStep] = useState('carregando');
    const [telefone, setTelefone] = useState('');
    const [identifying, setIdentifying] = useState(false);
    const [identifyError, setIdentifyError] = useState('');

    const [inscricaoId, setInscricaoId] = useState(null);
    const [participanteNome, setParticipanteNome] = useState('');

    const [treino, setTreino] = useState(false);
    const [cardio, setCardio] = useState(false);
    const [alimentacao, setAlimentacao] = useState(false);
    const [agua, setAgua] = useState(false);
    const [fotoAcademiaUrl, setFotoAcademiaUrl] = useState('');
    const [fotoFrenteUrl, setFotoFrenteUrl] = useState('');
    const [fotoLadoUrl, setFotoLadoUrl] = useState('');
    const [fotoCostasUrl, setFotoCostasUrl] = useState('');

    const [uploadingSlot, setUploadingSlot] = useState(null);
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [historico, setHistorico] = useState([]);
    const [mostrarFaq, setMostrarFaq] = useState(false);

    const hoje = new Date();
    const isSabado = hoje.getDay() === 6;
    const diaLabel = DIAS_SEMANA[hoje.getDay()];
    const storageKey = `@desafio_checkin_${slug}`;

    // ── Busca os dados do desafio pelo slug ──────────────────────────────
    useEffect(() => {
        if (!slug) { setNotFound(true); setLoadingDesafio(false); return; }
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/desafios?slug=${encodeURIComponent(slug)}`);
                if (!res.ok) { setNotFound(true); return; }
                const data = await res.json();
                if (!data?.desafio) { setNotFound(true); return; }
                setDesafio(data.desafio);
            } catch (e) {
                console.log('Erro ao buscar desafio', e);
                setNotFound(true);
            } finally {
                setLoadingDesafio(false);
            }
        })();
    }, [slug]);

    // ── Verifica se já tem identidade salva nesse celular ────────────────
    useEffect(() => {
        if (!desafio) return;
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(storageKey);
                if (saved) {
                    const { inscricaoId: savedId, nome } = JSON.parse(saved);
                    setInscricaoId(savedId);
                    setParticipanteNome(nome);
                    setStep('checkin');
                } else {
                    setStep('identificar');
                }
            } catch (e) {
                setStep('identificar');
            }
        })();
    }, [desafio]);

    // ── Busca histórico e pré-preenche o check-in de hoje, se já existir ──
    useEffect(() => {
        if (step !== 'checkin' || !inscricaoId) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/desafios/checkin?inscricaoId=${inscricaoId}`);
                if (!res.ok) return;
                const data = await res.json();
                setHistorico(data.checkins || []);

                const hojeStr = hojeISO();
                const checkinHoje = (data.checkins || []).find(c => dataParaISO(c.data) === hojeStr);
                if (checkinHoje) {
                    setTreino(checkinHoje.treino);
                    setCardio(checkinHoje.cardio);
                    setAlimentacao(checkinHoje.alimentacao);
                    setAgua(checkinHoje.agua);
                    setFotoAcademiaUrl(checkinHoje.fotoAcademiaUrl || '');
                    setFotoFrenteUrl(checkinHoje.fotoFrenteUrl || '');
                    setFotoLadoUrl(checkinHoje.fotoLadoUrl || '');
                    setFotoCostasUrl(checkinHoje.fotoCostasUrl || '');
                }
            } catch (e) {
                console.log('Erro ao buscar histórico', e);
            }
        })();
    }, [step, inscricaoId]);

    // ── Identificação por telefone ────────────────────────────────────────
    const handleIdentificar = async () => {
        setIdentifyError('');
        if (onlyDigits(telefone).length < 10) {
            setIdentifyError('Digite um telefone válido.');
            return;
        }
        setIdentifying(true);
        try {
            const res = await fetch(`${API_BASE}/api/desafios/checkin/identificar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ desafioId: desafio.id, telefone: onlyDigits(telefone) }),
            });
            const data = await res.json();
            if (!res.ok) {
                setIdentifyError(data?.error || 'Não conseguimos te identificar.');
                return;
            }
            setInscricaoId(data.inscricaoId);
            setParticipanteNome(data.nome);
            await AsyncStorage.setItem(storageKey, JSON.stringify({ inscricaoId: data.inscricaoId, nome: data.nome }));
            setStep('checkin');
        } catch (e) {
            setIdentifyError('Erro de conexão. Tente novamente.');
        } finally {
            setIdentifying(false);
        }
    };

    const handleTrocarConta = async () => {
        await AsyncStorage.removeItem(storageKey);
        setInscricaoId(null);
        setParticipanteNome('');
        setTelefone('');
        setTreino(false); setCardio(false); setAlimentacao(false); setAgua(false);
        setFotoAcademiaUrl(''); setFotoFrenteUrl(''); setFotoLadoUrl(''); setFotoCostasUrl('');
        setHistorico([]);
        setStep('identificar');
    };

    // ── Upload de foto (mesmo endpoint R2 usado no resto do app) ─────────
    const uploadFoto = async (slotName, setter) => {
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.7,
            });
            if (result.canceled) return;

            setUploadingSlot(slotName);
            const uri = result.assets[0].uri;
            let formData = new FormData();
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                const file = new File([blob], `checkin_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
                formData.append('file', file);
            } else {
                const uriParts = uri.split('.');
                const fileType = uriParts[uriParts.length - 1] || 'jpg';
                formData.append('file', { uri, name: `checkin_${Date.now()}.${fileType}`, type: `image/${fileType}` });
            }
            const res = await fetch(`${API_BASE}/api/upload-image`, { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) setter(data.url);
        } catch (e) {
            console.log('Erro ao enviar foto', e);
        } finally {
            setUploadingSlot(null);
        }
    };

    // ── Salvar check-in do dia (upsert no backend) ────────────────────────
    const handleSubmitCheckin = async () => {
        setSaving(true);
        setSavedSuccess(false);
        try {
            const res = await fetch(`${API_BASE}/api/desafios/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inscricaoId,
                    data: hojeISO(),
                    treino, cardio, alimentacao, agua,
                    fotoAcademiaUrl: fotoAcademiaUrl || null,
                    fotoFrenteUrl: isSabado ? (fotoFrenteUrl || null) : null,
                    fotoLadoUrl: isSabado ? (fotoLadoUrl || null) : null,
                    fotoCostasUrl: isSabado ? (fotoCostasUrl || null) : null,
                }),
            });
            if (res.ok) {
                setSavedSuccess(true);
                // Atualiza o histórico local pra refletir na tirinha da semana
                const res2 = await fetch(`${API_BASE}/api/desafios/checkin?inscricaoId=${inscricaoId}`);
                if (res2.ok) {
                    const data2 = await res2.json();
                    setHistorico(data2.checkins || []);
                }
                setTimeout(() => setSavedSuccess(false), 4000);
            }
        } catch (e) {
            console.log('Erro ao salvar check-in', e);
        } finally {
            setSaving(false);
        }
    };

    // ── Botão flutuante de voltar (só em modo preview) ────────────────────
    const previewBackButton = isPreview ? (
        <TouchableOpacity style={styles.previewBackBtn} onPress={handlePreviewBack} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#FFF" />
            <Text style={styles.previewBackBtnText}>VOLTAR AO ADMIN</Text>
        </TouchableOpacity>
    ) : null;

    // ── Estados de carregamento / erro ────────────────────────────────────
    if (loadingDesafio || step === 'carregando') {
        return (
            <RootComponent style={styles.container}>
                {previewBackButton}
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={MAIN_COLOR} />
                </View>
            </RootComponent>
        );
    }

    if (notFound || !desafio) {
        return (
            <RootComponent style={styles.container}>
                {previewBackButton}
                <View style={styles.centerBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#FF3B30" />
                    <Text style={styles.notFoundTitle}>DESAFIO NÃO ENCONTRADO</Text>
                    <Text style={styles.notFoundDesc}>Esse link pode ter expirado ou não existe mais.</Text>
                </View>
            </RootComponent>
        );
    }

    // ── Datas especiais (feriados etc.) — hoje e próximas, com aviso prévio ──
    const datasEspeciais = desafio.datasEspeciais || [];
    const hojeStrLocal = hojeISO();
    const dataEspecialHoje = datasEspeciais.find(d => dataParaISO(d.data) === hojeStrLocal);
    const datasEspeciaisFuturas = datasEspeciais.filter(d => dataParaISO(d.data) !== hojeStrLocal);

    // ── Dia X do desafio (opcional — só calcula se dataInicio estiver configurada) ──
    const duracaoDesafio = desafio.duracaoDias || 90;
    const dataInicioStr = desafio.dataInicio ? dataParaISO(desafio.dataInicio) : null;

    let diaAtual = null;
    let desafioAindaNaoComecou = false;
    let desafioJaEncerrou = false;
    let dataInicioFormatada = '';
    let dataFimFormatada = '';

    if (dataInicioStr) {
        const dIni = new Date(`${dataInicioStr}T00:00:00Z`);
        const dHoje = new Date(`${hojeStrLocal}T00:00:00Z`);
        const diffDias = Math.round((dHoje - dIni) / (1000 * 60 * 60 * 24));

        diaAtual = diffDias + 1; // dia 1 = data de início
        desafioAindaNaoComecou = diffDias < 0;
        desafioJaEncerrou = diffDias >= duracaoDesafio;

        const [ano, mes, dia] = dataInicioStr.split('-');
        dataInicioFormatada = `${dia}/${mes}/${ano}`;

        const dFim = new Date(dIni);
        dFim.setUTCDate(dIni.getUTCDate() + duracaoDesafio - 1);
        dataFimFormatada = `${String(dFim.getUTCDate()).padStart(2, '0')}/${String(dFim.getUTCMonth() + 1).padStart(2, '0')}/${dFim.getUTCFullYear()}`;
    }

    if (desafioAindaNaoComecou) {
        return (
            <RootComponent style={styles.container}>
                {previewBackButton}
                <View style={styles.centerBox}>
                    <MaterialCommunityIcons name="clock-outline" size={56} color={MAIN_COLOR} />
                    <Text style={styles.notFoundTitle}>AINDA NÃO COMEÇOU</Text>
                    <Text style={styles.notFoundDesc}>
                        O {desafio.nome} começa no dia {dataInicioFormatada}. Volta aqui a partir dessa data pra fazer seu primeiro check-in!
                    </Text>
                </View>
            </RootComponent>
        );
    }

    if (desafioJaEncerrou) {
        return (
            <RootComponent style={styles.container}>
                {previewBackButton}
                <View style={styles.centerBox}>
                    <MaterialCommunityIcons name="flag-checkered" size={56} color={MAIN_COLOR} />
                    <Text style={styles.notFoundTitle}>DESAFIO ENCERRADO</Text>
                    <Text style={styles.notFoundDesc}>
                        O {desafio.nome} terminou no dia {dataFimFormatada}. Obrigada por ter participado! 💜
                    </Text>
                </View>
            </RootComponent>
        );
    }

    // ── Mini tirinha da semana (últimos 7 dias com pelo menos 1 check) ────
    const renderTirinhaSemana = () => {
        const dias = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const entry = historico.find(c => dataParaISO(c.data) === dISO);
            const feito = entry && (entry.treino || entry.cardio || entry.alimentacao || entry.agua);
            dias.push({ label: DIAS_ABREV[d.getDay()], feito: !!feito, isHoje: i === 0 });
        }
        return (
            <View style={styles.tirinhaRow}>
                {dias.map((d, i) => (
                    <View key={i} style={styles.tirinhaItem}>
                        <View style={[
                            styles.tirinhaCircle,
                            d.feito && { backgroundColor: MAIN_COLOR, borderColor: MAIN_COLOR },
                            d.isHoje && !d.feito && { borderColor: MAIN_COLOR, borderWidth: 2 },
                        ]}>
                            {d.feito ? <MaterialCommunityIcons name="check" size={14} color="#FFF" /> : null}
                        </View>
                        <Text style={styles.tirinhaLabel}>{d.label}</Text>
                    </View>
                ))}
            </View>
        );
    };

    // ── Um item de checkbox (Treino, Cardio, Alimentação, Água) ───────────
    const renderCheckboxItem = (label, icon, value, setValue) => (
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setValue(!value)} activeOpacity={0.7}>
            <MaterialCommunityIcons name={icon} size={20} color={value ? MAIN_COLOR : '#666'} />
            <Text style={[styles.checkboxLabel, value && { color: '#FFF' }]}>{label}</Text>
            <MaterialCommunityIcons
                name={value ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={value ? MAIN_COLOR : '#555'}
            />
        </TouchableOpacity>
    );

    // ── Um slot de upload de foto ──────────────────────────────────────────
    const renderFotoSlot = (label, slotName, url, setter) => (
        <View style={styles.fotoSlotBox}>
            <Text style={styles.fotoSlotLabel}>{label}</Text>
            {url ? (
                <View style={styles.fotoSlotPreview}>
                    <Image source={{ uri: url }} style={styles.fotoSlotImg} />
                    <TouchableOpacity style={styles.fotoSlotRemove} onPress={() => setter('')}>
                        <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.fotoSlotEmpty}
                    onPress={() => uploadFoto(slotName, setter)}
                    disabled={uploadingSlot === slotName}
                >
                    {uploadingSlot === slotName
                        ? <ActivityIndicator size="small" color={MAIN_COLOR} />
                        : <MaterialCommunityIcons name="camera-plus" size={24} color={MAIN_COLOR} />
                    }
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <RootComponent style={styles.container}>
            {previewBackButton}
            <View style={styles.webWrapper}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* ── Cabeçalho ────────────────────────────────────────── */}
                    <View style={styles.headerSection}>
                        <MaterialCommunityIcons name="calendar-check" size={32} color={MAIN_COLOR} />
                        <Text style={styles.headerTitle}>{desafio.nome}</Text>
                        <Text style={styles.headerSub}>Check-in diário</Text>
                        {diaAtual !== null && (
                            <View style={styles.diaAtualBadge}>
                                <Text style={styles.diaAtualBadgeText}>DIA {diaAtual} DE {duracaoDesafio}</Text>
                            </View>
                        )}
                        <Text style={styles.headerIntro}>
                            É aqui que você registra o seu dia — leva menos de 1 minuto. Guarda esse link,
                            porque você vai usar ele todo dia até o fim do desafio.
                        </Text>
                    </View>

                    {/* ── Banner: hoje vale mais pontos ─────────────────────── */}
                    {dataEspecialHoje && (
                        <View style={styles.hojeEspecialBanner}>
                            <Text style={styles.hojeEspecialTitulo}>🎉 HOJE VALE MAIS!</Text>
                            <Text style={styles.hojeEspecialTexto}>
                                {dataEspecialHoje.motivo} — cada item do check-in vale {dataEspecialHoje.pontosPorItem} pontos hoje.
                            </Text>
                        </View>
                    )}

                    {/* ── Aviso prévio de datas especiais futuras ───────────── */}
                    {datasEspeciaisFuturas.length > 0 && (
                        <View style={styles.avisoFuturoBox}>
                            <View style={styles.avisoFuturoHeaderRow}>
                                <MaterialCommunityIcons name="bell-outline" size={16} color={MAIN_COLOR} />
                                <Text style={styles.avisoFuturoTitulo}>PONTUAÇÃO ESPECIAL CHEGANDO</Text>
                            </View>
                            {datasEspeciaisFuturas.map((d, i) => (
                                <Text key={i} style={styles.avisoFuturoItem}>
                                    • {new Date(d.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} — {d.motivo} (cada item vale {d.pontosPorItem} pontos)
                                </Text>
                            ))}
                        </View>
                    )}

                    {/* ── STEP: IDENTIFICAR ───────────────────────────────────── */}
                    {step === 'identificar' && (
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>QUEM É VOCÊ?</Text>
                            <Text style={styles.formHelper}>
                                Digite o mesmo telefone que você usou na inscrição — a gente lembra de você
                                nos próximos dias, sem precisar digitar de novo.
                            </Text>

                            <Text style={styles.inputLabel}>Telefone (WhatsApp)</Text>
                            <TextInput
                                style={styles.input}
                                value={telefone}
                                onChangeText={(v) => setTelefone(formatTelefone(v))}
                                placeholder="(41) 99999-9999"
                                placeholderTextColor="#666"
                                keyboardType="phone-pad"
                                maxLength={15}
                            />

                            {identifyError ? <Text style={styles.errorText}>{identifyError}</Text> : null}

                            <TouchableOpacity onPress={handleIdentificar} disabled={identifying} activeOpacity={0.85}>
                                <LinearGradient colors={[MAIN_COLOR, DARK_COLOR]} style={[styles.submitBtn, identifying && { opacity: 0.6 }]}>
                                    {identifying
                                        ? <ActivityIndicator color="#FFF" size="small" />
                                        : <Text style={styles.submitBtnText}>CONTINUAR</Text>
                                    }
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── STEP: CHECK-IN DO DIA ───────────────────────────────── */}
                    {step === 'checkin' && (
                        <>
                            <View style={styles.greetingBox}>
                                <Text style={styles.greetingText}>Olá, {participanteNome.split(' ')[0]}! 💜</Text>
                                <Text style={styles.diaBadge}>{diaLabel}-feira · {new Date().toLocaleDateString('pt-BR')}</Text>
                            </View>

                            {renderTirinhaSemana()}

                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>CHECK-IN DE HOJE</Text>

                                {renderCheckboxItem('Treino', 'dumbbell', treino, setTreino)}
                                {renderCheckboxItem('Cardio', 'run', cardio, setCardio)}
                                {renderCheckboxItem('Alimentação', 'food-apple', alimentacao, setAlimentacao)}
                                {renderCheckboxItem('Água', 'cup-water', agua, setAgua)}

                                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Foto na academia</Text>
                                {renderFotoSlot('Hoje', 'academia', fotoAcademiaUrl, setFotoAcademiaUrl)}

                                {isSabado && (
                                    <>
                                        <View style={styles.sabadoDivider} />
                                        <View style={styles.sabadoHeaderRow}>
                                            <MaterialCommunityIcons name="camera-outline" size={18} color={MAIN_COLOR} />
                                            <Text style={styles.sabadoTitle}>AVALIAÇÃO DA SEMANA — SÁBADO</Text>
                                        </View>
                                        <Text style={styles.formHelper}>Manda as 3 fotos do shape pra gente acompanhar sua evolução.</Text>

                                        <View style={styles.fotosSabadoRow}>
                                            {renderFotoSlot('Frente', 'frente', fotoFrenteUrl, setFotoFrenteUrl)}
                                            {renderFotoSlot('Lado', 'lado', fotoLadoUrl, setFotoLadoUrl)}
                                            {renderFotoSlot('Costas', 'costas', fotoCostasUrl, setFotoCostasUrl)}
                                        </View>
                                    </>
                                )}

                                {savedSuccess && (
                                    <View style={styles.successBox}>
                                        <MaterialCommunityIcons name="check-circle" size={16} color={MAIN_COLOR} />
                                        <Text style={styles.successText}>Check-in salvo!</Text>
                                    </View>
                                )}

                                <TouchableOpacity onPress={handleSubmitCheckin} disabled={saving} activeOpacity={0.85}>
                                    <LinearGradient colors={[MAIN_COLOR, DARK_COLOR]} style={[styles.submitBtn, saving && { opacity: 0.6 }]}>
                                        {saving
                                            ? <ActivityIndicator color="#FFF" size="small" />
                                            : <Text style={styles.submitBtnText}>SALVAR CHECK-IN</Text>
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={handleTrocarConta} style={styles.trocarContaBtn}>
                                <Text style={styles.trocarContaText}>Não é você? Trocar de conta</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    <View style={styles.faqSection}>
                        <TouchableOpacity
                            style={styles.faqToggleBtn}
                            onPress={() => setMostrarFaq(!mostrarFaq)}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons name="help-circle-outline" size={18} color={MAIN_COLOR} />
                            <Text style={styles.faqToggleBtnText}>TEM DÚVIDAS SOBRE O CHECK-IN?</Text>
                            <MaterialCommunityIcons name={mostrarFaq ? 'chevron-up' : 'chevron-down'} size={20} color={MAIN_COLOR} />
                        </TouchableOpacity>
                        {mostrarFaq && (
                            <View style={{ marginTop: 16 }}>
                                <FaqAccordion faqs={faqListCheckin} accentColor={MAIN_COLOR} />
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>PAULO ADRIANO TEAM © 2026</Text>
                    </View>
                </ScrollView>
            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { height: isWeb ? '100vh' : '100%', backgroundColor: '#0a0a0a' },
    previewBackBtn: {
        position: 'absolute', top: isWeb ? 16 : 55, left: 16, zIndex: 999,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 10, paddingHorizontal: 16,
        borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    previewBackBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    webWrapper: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
    scrollContent: { flexGrow: 1, padding: 25, paddingBottom: 60 },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    notFoundTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 16, letterSpacing: 0.5 },
    notFoundDesc: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8 },

    headerSection: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 10 },
    headerSub: { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },
    headerIntro: { color: '#999', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14, paddingHorizontal: 10 },
    diaAtualBadge: { backgroundColor: `${MAIN_COLOR}20`, borderWidth: 1, borderColor: MAIN_COLOR, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 10 },
    diaAtualBadgeText: { color: LIGHT_COLOR, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

    hojeEspecialBanner: { backgroundColor: `${MAIN_COLOR}20`, borderWidth: 1, borderColor: MAIN_COLOR, borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
    hojeEspecialTitulo: { color: LIGHT_COLOR, fontSize: 14, fontWeight: '900', marginBottom: 4 },
    hojeEspecialTexto: { color: '#EEE', fontSize: 12, textAlign: 'center', lineHeight: 18 },

    avisoFuturoBox: { backgroundColor: '#141118', borderWidth: 1, borderColor: `${MAIN_COLOR}25`, borderRadius: 14, padding: 14, marginBottom: 16 },
    avisoFuturoHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    avisoFuturoTitulo: { color: MAIN_COLOR, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    avisoFuturoItem: { color: '#AAA', fontSize: 12, lineHeight: 19 },

    faqSection: { marginTop: 40 },
    faqToggleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#141118', borderWidth: 1, borderColor: `${MAIN_COLOR}40`,
        borderRadius: 14, paddingVertical: 16,
    },
    faqToggleBtnText: { color: LIGHT_COLOR, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },

    formCard: { backgroundColor: '#161616', borderRadius: 24, borderWidth: 1, borderColor: '#2A2A2A', padding: 22 },
    formTitle: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', marginBottom: 14 },
    formHelper: { color: '#999', fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 16 },

    inputLabel: { color: '#888', fontSize: 11, fontWeight: '900', letterSpacing: 0.3, marginBottom: 6 },
    input: { backgroundColor: '#0a0a0a', color: '#FFF', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 14, fontSize: 14 },
    errorText: { color: '#FF3B30', fontSize: 12, fontWeight: '700', marginTop: 12, textAlign: 'center' },

    submitBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

    greetingBox: { alignItems: 'center', marginBottom: 20 },
    greetingText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
    diaBadge: { color: LIGHT_COLOR, fontSize: 12, fontWeight: '700', marginTop: 4, textTransform: 'capitalize' },

    tirinhaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 4 },
    tirinhaItem: { alignItems: 'center', gap: 6 },
    tirinhaCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
    tirinhaLabel: { color: '#666', fontSize: 10, fontWeight: '700' },

    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
    checkboxLabel: { flex: 1, color: '#AAA', fontSize: 14, fontWeight: '600' },

    fotoSlotBox: { marginBottom: 4 },
    fotoSlotLabel: { color: '#777', fontSize: 10, fontWeight: '700', marginBottom: 6 },
    fotoSlotEmpty: { width: '100%', aspectRatio: 1.6, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: MAIN_COLOR, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(139,92,246,0.05)' },
    fotoSlotPreview: { width: '100%', aspectRatio: 1.6, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    fotoSlotImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    fotoSlotRemove: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: 3 },

    sabadoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 18, marginBottom: 16 },
    sabadoHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 6 },
    sabadoTitle: { color: MAIN_COLOR, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    fotosSabadoRow: { flexDirection: 'row', gap: 10, marginTop: 4 },

    successBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: `${MAIN_COLOR}15`, borderRadius: 10, paddingVertical: 10, marginTop: 16 },
    successText: { color: MAIN_COLOR, fontSize: 12, fontWeight: '900' },

    trocarContaBtn: { alignItems: 'center', marginTop: 18 },
    trocarContaText: { color: '#666', fontSize: 12, textDecorationLine: 'underline' },

    footer: { marginTop: 40, alignItems: 'center' },
    footerText: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});