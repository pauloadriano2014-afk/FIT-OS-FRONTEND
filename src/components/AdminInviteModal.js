// src/components/AdminInviteModal.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    ScrollView, TextInput, Linking, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authHeaders } from '../utils/authToken';

// IDs que pertencem ao time Master (Você e a Adri)
const MASTER_IDS = [
    '3c82f763-66b4-48da-836e-16817d4f57c0', // Paulo
    'b7c0c181-41fd-4156-b8fe-963a267759a3'  // Adri
];

// ─── Promoções ativas ────────────────────────────────────────────────────────
const PROMO_MAES_ATIVA       = false; // já encerrou
const PROMO_NAMORADOS_ATIVA  = true;  // 💘 ativa agora

export default function AdminInviteModal({ visible, onClose, adminEmail, theme }) {
    const [activeTab, setActiveTab]       = useState('PROPOSTA');
    const [leadName, setLeadName]         = useState('');
    // 'ELITE' | 'START' | 'FAMILIA'
    const [propostaType, setPropostaType] = useState('ELITE');

    // Flags de promoção — mutuamente exclusivas (só fazem sentido em ELITE)
    const [isPromoMaes,       setIsPromoMaes]       = useState(false);
    const [isPromoNavegantes, setIsPromoNavegantes] = useState(false);

    // 💎 Ofertas dinâmicas de preço (criadas em TabPropostaOfertas) — só
    // fazem sentido pro MASTER, no tipo ELITE, sem campanha Mães/Namorados
    // ativa (essas campanhas usam suas próprias telas fixas).
    const [ofertas, setOfertas]               = useState([]);
    const [selectedOferta, setSelectedOferta] = useState(''); // '' = preço padrão

    // 🔥 Estados do SAAS / White-Label 🔥
    const [isMasterCoach, setIsMasterCoach] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [coachPlans, setCoachPlans] = useState([]);
    const [selectedSaaSPlan, setSelectedSaaSPlan] = useState(null);
    const [loadingSaaS, setLoadingSaaS] = useState(false);

    // 🔑 NOVO: código de convite do coach parceiro (usado no link /registro)
    // Sem isso, o cadastro direto tentava usar o UUID do coach como código
    // e a rota de registro (que busca por inviteCode) sempre recusava.
    const [coachInviteCode, setCoachInviteCode] = useState(null);

    // Identifica e carrega os planos SaaS (ou as Ofertas, se for master) ao abrir o modal
    useEffect(() => {
        if (visible) {
            const loadUserAndPlans = async () => {
                try {
                    const userStr = await AsyncStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        setCurrentUserId(user.id);
                        
                        const isMaster = MASTER_IDS.includes(user.id);
                        setIsMasterCoach(isMaster);

                        if (!isMaster) {
                            setLoadingSaaS(true);

                            // 🔑 Busca o inviteCode atual do coach (pode ter sido
                            // definido na aprovação ou editado depois) junto com os planos
                            const authHdrs = await authHeaders();
                            const [planRes, userRes] = await Promise.all([
                                fetch(`https://fitos-final.onrender.com/api/admin/saas-meta?coachId=${user.id}`, { headers: { ...authHdrs } }),
                                fetch(`https://fitos-final.onrender.com/api/admin/user/${user.id}`, { headers: { ...authHdrs } }),
                            ]);

                            if (planRes.ok) {
                                const data = await planRes.json();
                                setCoachPlans(data.plans || []);
                                if (data.plans && data.plans.length > 0) {
                                    setSelectedSaaSPlan(data.plans[0].id);
                                }
                            }

                            if (userRes.ok) {
                                const freshUser = await userRes.json();
                                setCoachInviteCode(freshUser.inviteCode || null);
                            }

                            setLoadingSaaS(false);
                        } else {
                            // 💎 Master: busca as Ofertas de Proposta ativas para o seletor
                            try {
                                const ofertasRes = await fetch('https://fitos-final.onrender.com/api/admin/proposta-ofertas');
                                if (ofertasRes.ok) {
                                    const data = await ofertasRes.json();
                                    setOfertas((data.ofertas || []).filter(o => o.ativa));
                                }
                            } catch (e) {
                                console.log('Erro ao buscar ofertas de proposta', e);
                            }
                        }
                    }
                } catch (e) {
                    console.log("Erro ao carregar dados do usuário no Modal:", e);
                }
            };
            loadUserAndPlans();
        }
    }, [visible]);

    // ── Identifica QUEM está logado (Paulo ou Adri) ──────────────────────────
    const getCoachInfo = () => {
        let coachCode = 'PATEAM';   // padrão Paulo
        let coachSlug = 'paulo';    // usado na query string ?coach=
        let teamName  = 'à nossa equipe';

        if (adminEmail && adminEmail.toLowerCase().includes('adri.personal@hotmail.com')) {
            coachCode = 'CURVAS';
            coachSlug = 'adri';
            teamName  = 'ao projeto Costas & Curvas';
        }
        return { coachCode, coachSlug, teamName };
    };

    const resetAndClose = () => {
        setLeadName('');
        setIsPromoMaes(false);
        setIsPromoNavegantes(false);
        setSelectedOferta('');
        onClose();
    };

    const openWhatsApp = (message) => {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        resetAndClose();
        Linking.canOpenURL(whatsappUrl).then(supported => {
            if (supported) Linking.openURL(whatsappUrl);
            else {
                if (Platform.OS === 'web') window.open(whatsappUrl, '_blank');
                else Alert.alert('Aviso', 'Não foi possível abrir o WhatsApp.');
            }
        }).catch(err => console.error('Erro ao abrir WhatsApp', err));
    };

    const getBaseUrl = () => {
        if (Platform.OS === 'web') return window.location.origin;
        return 'https://www.elitefitapp.com.br';
    };

    // ── Ativa uma promo e desativa a outra (e limpa a oferta, mutuamente exclusivas) ──
    const togglePromoMaes = () => {
        setIsPromoMaes(prev => !prev);
        setIsPromoNavegantes(false);
        setSelectedOferta('');
    };

    const togglePromoNavegantes = () => {
        setIsPromoNavegantes(prev => !prev);
        setIsPromoMaes(false);
        setSelectedOferta('');
    };

    // ── Qual promo está ativa? ───────────────────────────────────────────────
    const promoAtiva = isPromoMaes
        ? 'MAES'
        : isPromoNavegantes
            ? 'NAMORADOS'
            : null;

    // ── Cores dinâmicas conforme promo ───────────────────────────────────────
    const promoConfig = {
        MAES: {
            color:      '#E91E63',
            icon:       'gift',
            label:      'ENVIAR OFERTA MÃES',
            routeName:  'PropostaMaes',
            msgIntro:   (nome) =>
                `Fala, ${nome}! Tudo bem?\n\nNeste mês das mães, eu resolvi liberar uma condição inédita e super especial nos meus planos de acompanhamento (com opções de Apenas Treino ou Treino + Dieta).\n\nSeja para você dar esse presente a si mesma, presentear a sua mãe, ou até mesmo pegar carona nessa oportunidade para conquistar a melhor forma da sua vida.\n\nAcesse o link abaixo para ver todos os detalhes dessa oferta única e os bônus que preparei:`,
            msgOutro:   `\n\nDá uma olhada e me chama aqui para tirarmos qualquer dúvida e darmos o start. A promoção fica no ar por pouquíssimo tempo! 💖🔥`,
        },
        NAMORADOS: {
            color:      '#E8003D',
            icon:       'cards-heart',
            label:      'ENVIAR OFERTA NAMORADOS',
            routeName:  'PropostaNavegantes',
            msgIntro:   (nome) =>
                `Fala, ${nome}! Tudo bem?\n\nNo Dia dos Namorados resolvi liberar uma condição inédita: uma vaga para os DOIS — com planos individuais e desconto exclusivo de casal.\n\nSeja para presentear quem você ama ou para vocês investirem juntos na melhor versão de cada um.\n\nAcesse o link abaixo para ver todos os detalhes e os bônus que preparei:`,
            msgOutro:   `\n\nDá uma olhada e me chama aqui para garantirmos a vaga de vocês. São apenas 3 casais — quando acabar, acabou! ❤️‍🔥`,
        },
    };

    // ── Gera link + mensagem de proposta (MASTER) ─────────────────────────────────────
    const generatePropostaLink = () => {
        const finalName = leadName.trim() || 'Atleta';
        const baseUrl   = getBaseUrl();
        const { coachSlug } = getCoachInfo();

        let routeName = 'Proposta';
        if (propostaType === 'START') {
            routeName = 'PropostaStart';
        } else if (propostaType === 'FAMILIA') {
            routeName = 'PropostaFamilia';
        } else if (propostaType === 'ELITE' && promoAtiva) {
            routeName = promoConfig[promoAtiva].routeName;
        }

        const uniqueId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

        // 💎 Oferta de preço customizada — só entra na URL quando a rota é a
        // "Proposta" padrão (ELITE, sem campanha ativa) e uma oferta foi escolhida.
        const ofertaParam = (routeName === 'Proposta' && selectedOferta)
            ? `&oferta=${encodeURIComponent(selectedOferta)}`
            : '';

        const inviteLink = `${baseUrl}/${routeName}?nome=${encodeURIComponent(finalName)}&plan=${propostaType}&coach=${coachSlug}&id=${uniqueId}${ofertaParam}`;

        let message = '';
        if (propostaType === 'ELITE' && promoAtiva) {
            const cfg = promoConfig[promoAtiva];
            message = `${cfg.msgIntro(finalName)}\n\n🔗 ${inviteLink}${cfg.msgOutro}`;
        } else if (propostaType === 'FAMILIA') {
            message = `Fala, ${finalName}! Tudo bem?\n\nCriei uma condição especial pra famílias que querem treinar juntas: o Plano Família. 👨‍👩‍👧‍👦\n\nCada pessoa escolhe o plano que faz sentido pra ela (só treino ou treino + dieta), e o desconto cresce conforme mais gente da família entra — sem data pra acabar, sem pegadinha.\n\nAcesse o link abaixo, monte a simulação com o número de pessoas de vocês e veja o valor exato:\n\n🔗 ${inviteLink}\n\nQualquer dúvida, me chama aqui! 💪🌿`;
        } else {
            message = `Fala, ${finalName}! Tudo bem?\n\nConforme conversamos, preparei um material completo para você entender exatamente como funciona a nossa metodologia e como vamos trabalhar juntos para transformar o seu corpo, sem perder tempo com treinos e dietas que não dão resultado.\n\nAcesse o link abaixo para ver todos os detalhes da consultoria, os bônus que você tem direito e os valores:\n\n🔗 ${inviteLink}\n\nDá uma olhada e me chama aqui para tirarmos qualquer dúvida e darmos o start, se fizer sentido pra você. 💪🔥`;
        }

        openWhatsApp(message);
    };

    // ── Gera link de cadastro direto (MASTER) ─────────────────────────────────────────
    const generateCadastroLink = (planType) => {
        const { coachCode, teamName } = getCoachInfo();
        const baseUrl    = getBaseUrl();
        const finalName  = leadName.trim() || 'Atleta';
        const inviteLink = `${baseUrl}/registro?coach=${coachCode}&plan=${planType}`;

        const planNames = {
            ELITE:       'Consultoria Elite (Treino + Dieta)',
            PERFORMANCE: 'Consultoria Performance (Só Treino)',
            LOW_COST:    'Plano Start',
            FICHA_8S:    'Projeto de 8 Semanas',
            CHALLENGE_21:'Desafio 21 Dias',
        };
        const planNameStr = planNames[planType] || planType;

        const message = `Opa, ${finalName}! Chegou a hora de iniciarmos a sua ${planNameStr}.\n\nPara darmos o start oficial, acesse o link abaixo para criar a sua conta:\n\n🔗 ${inviteLink}\n\n📲 Após finalizar o cadastro, a própria página vai te mostrar o passo a passo bem simples para você instalar o aplicativo oficial direto no seu celular.\n\n🔑 Importante: Se o aplicativo pedir um Código de Convite no seu primeiro acesso, digite exatamente assim: *${coachCode}*\n\nFaça o seu cadastro por lá e me avise aqui para eu liberar o seu plano. Seja bem-vindo(a) ${teamName}! 💪🔥`;

        openWhatsApp(message);
    };

    // ── Gera link de proposta (COACH PARCEIRO / SAAS) ──────────────────────────────
    const generateSaaSProposta = () => {
        if (!selectedSaaSPlan) {
            Alert.alert('Aviso', 'Selecione um plano para gerar a proposta.');
            return;
        }

        const finalName = leadName.trim() || 'Atleta';
        const baseUrl   = getBaseUrl();
        const plan = coachPlans.find(p => p.id === selectedSaaSPlan);
        const planName = plan ? plan.name : 'Consultoria';
        
        // Rota oficial da página de vendas branca do parceiro (por ID — página, não cadastro)
        const uniqueId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
        const inviteLink = `${baseUrl}/invite/${currentUserId}?planId=${selectedSaaSPlan}&id=${uniqueId}&nome=${encodeURIComponent(finalName)}`;

        const message = `Fala, ${finalName}! Tudo bem?\n\nConforme conversamos, preparei todos os detalhes sobre a nossa metodologia e o plano *${planName}*.\n\nAcesse o link abaixo para ver como vamos trabalhar juntos para atingir os seus objetivos e os valores:\n\n🔗 ${inviteLink}\n\nDá uma olhada e me chama aqui para tirarmos qualquer dúvida e darmos o start! 💪🔥`;
        
        openWhatsApp(message);
    };

    // ── Gera link de cadastro (COACH PARCEIRO / SAAS) ──────────────────────────────
    const generateSaaSCadastro = (plan) => {
        // 🔑 CORREÇÃO: a rota /registro busca o coach pelo campo inviteCode
        // (ex: "CARLOS742"), não pelo UUID. Sem o código, o cadastro do
        // aluno sempre falhava com "Código de convite inválido".
        if (!coachInviteCode) {
            const msg = 'Seu código de convite ainda não foi definido. Fale com o suporte para gerar um.';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Código não encontrado', msg);
            return;
        }

        const finalName = leadName.trim() || 'Atleta';
        const baseUrl   = getBaseUrl();
        
        const inviteLink = `${baseUrl}/registro?coach=${coachInviteCode}&plan=${plan.id}`;
        
        const message = `Opa, ${finalName}! Chegou a hora de iniciarmos o seu *${plan.name}*.\n\nPara darmos o start oficial, acesse o link abaixo para criar a sua conta:\n\n🔗 ${inviteLink}\n\n📲 Após finalizar o cadastro, a própria página vai te mostrar o passo a passo bem simples para instalar o meu aplicativo oficial direto no seu celular.\n\n🔑 Importante: Se o aplicativo pedir um Código de Convite no seu primeiro acesso, digite exatamente assim: *${coachInviteCode}*\n\nFaça o seu cadastro por lá e me avise aqui para eu liberar o seu acesso. Seja bem-vindo(a) ao time! 💪🔥`;
        
        openWhatsApp(message);
    };


    // ── Cor, ícone e label do botão de envio (Master) ──────────────────
    const activeBtnColor = propostaType === 'FAMILIA'
        ? '#34D399'
        : promoAtiva
            ? promoConfig[promoAtiva].color
            : propostaType === 'ELITE'
                ? '#FFCC00'
                : '#32ADE6';

    const activeBtnIcon = propostaType === 'FAMILIA'
        ? 'account-group'
        : promoAtiva
            ? promoConfig[promoAtiva].icon
            : propostaType === 'ELITE'
                ? 'crown'
                : 'rocket-launch';

    const activeBtnLabel = propostaType === 'FAMILIA'
        ? 'ENVIAR PROPOSTA FAMÍLIA'
        : promoAtiva
            ? promoConfig[promoAtiva].label
            : `ENVIAR PROPOSTA ${propostaType}`;

    const { coachSlug: loggedCoachSlug } = getCoachInfo();
    const loggedCoachLabel = isMasterCoach ? (loggedCoachSlug === 'adri' ? 'Adri' : 'Paulo') : 'Treinador Parceiro';

    // ────────────────────────────────────────────────────────────────────────
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={resetAndClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>

                    {/* Header */}
                    <View style={styles.headerRow}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>GERAR LINK</Text>
                        <TouchableOpacity onPress={resetAndClose}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Indicador de quem está logado */}
                    <View style={[styles.loggedAsBadge, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                        <MaterialCommunityIcons name="account-check" size={14} color={theme.textSecondary} />
                        <Text style={[styles.loggedAsText, { color: theme.textSecondary }]}>
                            Links gerados como <Text style={{ fontWeight: '900', color: theme.text }}>{loggedCoachLabel}</Text> — o WhatsApp da página abrirá no seu número.
                        </Text>
                    </View>

                    {/* Tabs */}
                    <View style={[styles.tabsContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'PROPOSTA' && { backgroundColor: theme.accent }]}
                            onPress={() => setActiveTab('PROPOSTA')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'PROPOSTA' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>
                                PÁGINA DE VENDAS
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'CADASTRO' && { backgroundColor: theme.accent }]}
                            onPress={() => setActiveTab('CADASTRO')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'CADASTRO' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>
                                CADASTRO DIRETO
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

                        {/* ── ABA PROPOSTA ─────────────────────────────────────── */}
                        {activeTab === 'PROPOSTA' && (
                            <View style={styles.tabSection}>
                                <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                                    Gera um link para a página de vendas. O cronômetro (quando houver) inicia no primeiro clique do aluno.
                                </Text>

                                {/* Nome do lead */}
                                <Text style={[styles.inputLabel, { color: theme.text }]}>NOME DO LEAD (Opcional):</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                    placeholder="Ex: João Silva"
                                    placeholderTextColor={theme.textSecondary}
                                    value={leadName}
                                    onChangeText={setLeadName}
                                />

                                {/* Lógica Master (PA TEAM) */}
                                {isMasterCoach ? (
                                    <>
                                        <Text style={[styles.inputLabel, { color: theme.text, marginTop: 20 }]}>TIPO DE OFERTA:</Text>
                                        <View style={[styles.propostaTypeContainer, { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: 10 }]}>
                                            <TouchableOpacity
                                                style={[styles.propostaTypeBtn, propostaType === 'ELITE' && { backgroundColor: '#FFCC00' }]}
                                                onPress={() => { setPropostaType('ELITE'); setIsPromoMaes(false); setIsPromoNavegantes(false); }}
                                            >
                                                <Text style={[styles.propostaTypeText, { color: propostaType === 'ELITE' ? '#000' : theme.textSecondary }]}>ELITE / PERF.</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.propostaTypeBtn, propostaType === 'START' && { backgroundColor: '#32ADE6' }]}
                                                onPress={() => { setPropostaType('START'); setIsPromoMaes(false); setIsPromoNavegantes(false); setSelectedOferta(''); }}
                                            >
                                                <Text style={[styles.propostaTypeText, { color: propostaType === 'START' ? '#FFF' : theme.textSecondary }]}>START</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.propostaTypeBtn, propostaType === 'FAMILIA' && { backgroundColor: '#34D399' }]}
                                                onPress={() => { setPropostaType('FAMILIA'); setIsPromoMaes(false); setIsPromoNavegantes(false); setSelectedOferta(''); }}
                                            >
                                                <Text style={[styles.propostaTypeText, { color: propostaType === 'FAMILIA' ? '#000' : theme.textSecondary }]}>FAMÍLIA</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {propostaType === 'ELITE' && (
                                            <View style={styles.promosWrapper}>
                                                <Text style={[styles.promosLabel, { color: theme.textSecondary }]}>CAMPANHAS ATIVAS:</Text>

                                                {PROMO_MAES_ATIVA && (
                                                    <TouchableOpacity
                                                        style={[styles.promoToggle, isPromoMaes && { backgroundColor: '#E91E6315', borderColor: '#E91E6340', borderWidth: 1 }]}
                                                        onPress={togglePromoMaes}
                                                    >
                                                        <MaterialCommunityIcons name={isPromoMaes ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={isPromoMaes ? '#E91E63' : theme.textSecondary} />
                                                        <Text style={[styles.promoToggleText, { color: isPromoMaes ? '#E91E63' : theme.textSecondary }]}>
                                                            {isPromoMaes ? '💖 PROMOÇÃO DIA DAS MÃES ATIVADA' : 'ATIVAR PROMOÇÃO DIA DAS MÃES'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}

                                                {PROMO_NAMORADOS_ATIVA && (
                                                    <TouchableOpacity
                                                        style={[styles.promoToggle, isPromoNavegantes && { backgroundColor: '#E8003D15', borderColor: '#E8003D40', borderWidth: 1 }]}
                                                        onPress={togglePromoNavegantes}
                                                    >
                                                        <MaterialCommunityIcons name={isPromoNavegantes ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={isPromoNavegantes ? '#E8003D' : theme.textSecondary} />
                                                        <Text style={[styles.promoToggleText, { color: isPromoNavegantes ? '#E8003D' : theme.textSecondary }]}>
                                                            {isPromoNavegantes ? '❤️‍🔥 PROMOÇÃO DIA DOS NAMORADOS ATIVADA' : 'ATIVAR PROMOÇÃO DIA DOS NAMORADOS'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}

                                                {!PROMO_MAES_ATIVA && !PROMO_NAMORADOS_ATIVA && (
                                                    <Text style={[styles.promoToggleText, { color: theme.textSecondary, paddingLeft: 4 }]}>Nenhuma campanha ativa no momento.</Text>
                                                )}
                                            </View>
                                        )}

                                        {/* 💎 Seletor de Oferta de preço (só ELITE, sem campanha ativa) */}
                                        {propostaType === 'ELITE' && !isPromoMaes && !isPromoNavegantes && ofertas.length > 0 && (
                                            <View style={styles.promosWrapper}>
                                                <Text style={[styles.promosLabel, { color: theme.textSecondary }]}>OFERTA DE PREÇO:</Text>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.ofertaPill,
                                                            { borderColor: theme.border },
                                                            selectedOferta === '' && { backgroundColor: `${theme.accent}20`, borderColor: theme.accent },
                                                        ]}
                                                        onPress={() => setSelectedOferta('')}
                                                    >
                                                        <Text style={[styles.ofertaPillText, { color: selectedOferta === '' ? theme.accent : theme.textSecondary }]}>
                                                            Padrão
                                                        </Text>
                                                    </TouchableOpacity>

                                                    {ofertas.map((oferta) => (
                                                        <TouchableOpacity
                                                            key={oferta.id}
                                                            style={[
                                                                styles.ofertaPill,
                                                                { borderColor: theme.border },
                                                                selectedOferta === oferta.slug && { backgroundColor: `${theme.accent}20`, borderColor: theme.accent },
                                                            ]}
                                                            onPress={() => setSelectedOferta(oferta.slug)}
                                                        >
                                                            <Text style={[styles.ofertaPillText, { color: selectedOferta === oferta.slug ? theme.accent : theme.textSecondary }]}>
                                                                {oferta.nome}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}

                                        <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 15, textAlign: 'center' }}>
                                            {propostaType === 'ELITE'
                                                ? 'Página Principal (Treino + Dieta)'
                                                : propostaType === 'START'
                                                    ? 'Plano de Entrada (Ficha de Treino)'
                                                    : 'Plano Família — condição fixa, sem data para expirar'}
                                        </Text>

                                        <TouchableOpacity
                                            style={[styles.optionCard, { borderColor: activeBtnColor, backgroundColor: `${activeBtnColor}11` }]}
                                            onPress={generatePropostaLink}
                                        >
                                            <View style={styles.optionLeft}>
                                                <MaterialCommunityIcons name={activeBtnIcon} size={24} color={activeBtnColor} />
                                                <Text style={[styles.optionText, { color: activeBtnColor, fontWeight: '900' }]}>{activeBtnLabel}</Text>
                                            </View>
                                            <MaterialCommunityIcons name="whatsapp" size={20} color={activeBtnColor} />
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    /* Lógica SaaS Parceiro */
                                    <View style={{ marginTop: 20 }}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>SELECIONE O PLANO DA PÁGINA:</Text>
                                        {loadingSaaS ? (
                                            <ActivityIndicator size="small" color={theme.accent} style={{ marginVertical: 20 }} />
                                        ) : coachPlans.length === 0 ? (
                                            <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 10, marginBottom: 20 }}>
                                                Você ainda não criou nenhum plano. Acesse "Sistema {'>'} Vendas" para cadastrar seus planos.
                                            </Text>
                                        ) : (
                                            <View style={{ gap: 10, marginBottom: 20 }}>
                                                {coachPlans.map(plan => (
                                                    <TouchableOpacity 
                                                        key={plan.id}
                                                        style={[styles.propostaTypeBtn, { borderWidth: 1, borderColor: selectedSaaSPlan === plan.id ? theme.accent : theme.border, backgroundColor: selectedSaaSPlan === plan.id ? theme.accent + '22' : theme.surface }]}
                                                        onPress={() => setSelectedSaaSPlan(plan.id)}
                                                    >
                                                        <Text style={[styles.propostaTypeText, { color: selectedSaaSPlan === plan.id ? theme.accent : theme.textSecondary, fontSize: 12 }]}>
                                                            {plan.name} - R$ {plan.value.toFixed(2)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}

                                        <TouchableOpacity
                                            style={[styles.optionCard, { borderColor: theme.accent, backgroundColor: `${theme.accent}11`, opacity: coachPlans.length === 0 ? 0.5 : 1 }]}
                                            onPress={generateSaaSProposta}
                                            disabled={coachPlans.length === 0}
                                        >
                                            <View style={styles.optionLeft}>
                                                <MaterialCommunityIcons name="link-variant" size={24} color={theme.accent} />
                                                <Text style={[styles.optionText, { color: theme.accent, fontWeight: '900' }]}>GERAR LINK DA PÁGINA</Text>
                                            </View>
                                            <MaterialCommunityIcons name="whatsapp" size={20} color={theme.accent} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ── ABA CADASTRO ──────────────────────────────────────── */}
                        {activeTab === 'CADASTRO' && (
                            <View style={styles.tabSection}>
                                <Text style={[styles.sectionDesc, { color: theme.textSecondary, marginBottom: 15 }]}>
                                    Gera o link direto de cadastro no app. O aluno já entra com a conta configurada pro plano correto.
                                </Text>

                                <Text style={[styles.inputLabel, { color: theme.text, marginBottom: 10 }]}>NOME DO NOVO ALUNO (Opcional):</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginBottom: 20 }]}
                                    placeholder="Ex: João Silva"
                                    placeholderTextColor={theme.textSecondary}
                                    value={leadName}
                                    onChangeText={setLeadName}
                                />

                                {isMasterCoach ? (
                                    <View style={{ gap: 10 }}>
                                        <TouchableOpacity style={[styles.optionCard, { borderColor: '#FFCC00', backgroundColor: '#FFCC0011' }]} onPress={() => generateCadastroLink('ELITE')}>
                                            <View style={styles.optionLeft}>
                                                <MaterialCommunityIcons name="crown" size={24} color="#FFCC00" />
                                                <View>
                                                    <Text style={[styles.optionText, { color: '#FFCC00' }]}>ELITE</Text>
                                                    <Text style={{ fontSize: 9, color: '#FFCC00', fontWeight: 'bold' }}>TREINO + DIETA</Text>
                                                </View>
                                            </View>
                                            <MaterialCommunityIcons name="whatsapp" size={20} color="#FFCC00" />
                                        </TouchableOpacity>

                                        <TouchableOpacity style={[styles.optionCard, { borderColor: '#FF3B30', backgroundColor: '#FF3B3011' }]} onPress={() => generateCadastroLink('PERFORMANCE')}>
                                            <View style={styles.optionLeft}>
                                                <MaterialCommunityIcons name="weight-lifter" size={24} color="#FF3B30" />
                                                <View>
                                                    <Text style={[styles.optionText, { color: '#FF3B30' }]}>PERFORMANCE</Text>
                                                    <Text style={{ fontSize: 9, color: '#FF3B30', fontWeight: 'bold' }}>APENAS TREINO</Text>
                                                </View>
                                            </View>
                                            <MaterialCommunityIcons name="whatsapp" size={20} color="#FF3B30" />
                                        </TouchableOpacity>

                                        <TouchableOpacity style={[styles.optionCard, { borderColor: '#32ADE6', backgroundColor: '#32ADE611' }]} onPress={() => generateCadastroLink('LOW_COST')}>
                                            <View style={styles.optionLeft}>
                                                <MaterialCommunityIcons name="rocket-launch" size={24} color="#32ADE6" />
                                                <Text style={[styles.optionText, { color: '#32ADE6' }]}>PLANO START</Text>
                                            </View>
                                            <MaterialCommunityIcons name="whatsapp" size={20} color="#32ADE6" />
                                        </TouchableOpacity>

                                        <TouchableOpacity style={[styles.optionCard, { borderColor: '#AF52DE', backgroundColor: '#AF52DE11' }]} onPress={() => generateCadastroLink('FICHA_8S')}>
                                            <View style={styles.optionLeft}>
                                                <MaterialCommunityIcons name="lightning-bolt" size={24} color="#AF52DE" />
                                                <Text style={[styles.optionText, { color: '#AF52DE' }]}>FICHA 8 SEMANAS</Text>
                                            </View>
                                            <MaterialCommunityIcons name="whatsapp" size={20} color="#AF52DE" />
                                        </TouchableOpacity>

                                        <TouchableOpacity style={[styles.optionCard, { borderColor: '#FF9500', backgroundColor: '#FF950011' }]} onPress={() => generateCadastroLink('CHALLENGE_21')}>
                                            <View style={styles.optionLeft}>
                                                <MaterialCommunityIcons name="fire" size={24} color="#FF9500" />
                                                <Text style={[styles.optionText, { color: '#FF9500' }]}>DESAFIO 21 DIAS</Text>
                                            </View>
                                            <MaterialCommunityIcons name="whatsapp" size={20} color="#FF9500" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    /* Cadastro Direto SaaS Parceiro */
                                    <View style={{ gap: 10 }}>
                                        {/* 🔑 Aviso do código de convite do coach parceiro */}
                                        {!loadingSaaS && (
                                            <View style={[styles.loggedAsBadge, { borderColor: coachInviteCode ? theme.border : '#FF9500', backgroundColor: coachInviteCode ? theme.bg : '#FF950011', marginBottom: 4 }]}>
                                                <MaterialCommunityIcons
                                                    name={coachInviteCode ? 'shield-key' : 'alert-circle-outline'}
                                                    size={14}
                                                    color={coachInviteCode ? theme.textSecondary : '#FF9500'}
                                                />
                                                <Text style={[styles.loggedAsText, { color: coachInviteCode ? theme.textSecondary : '#FF9500' }]}>
                                                    {coachInviteCode
                                                        ? <>Seu código de convite: <Text style={{ fontWeight: '900', color: theme.text }}>{coachInviteCode}</Text></>
                                                        : 'Código de convite não definido — fale com o suporte antes de enviar links de cadastro.'}
                                                </Text>
                                            </View>
                                        )}

                                        {loadingSaaS ? (
                                            <ActivityIndicator size="small" color={theme.accent} />
                                        ) : coachPlans.length === 0 ? (
                                            <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 10 }}>Nenhum plano cadastrado.</Text>
                                        ) : (
                                            coachPlans.map(plan => (
                                                <TouchableOpacity 
                                                    key={plan.id} 
                                                    style={[styles.optionCard, { borderColor: theme.border, backgroundColor: theme.surface, opacity: coachInviteCode ? 1 : 0.5 }]} 
                                                    onPress={() => generateSaaSCadastro(plan)}
                                                >
                                                    <View style={styles.optionLeft}>
                                                        <MaterialCommunityIcons name="rocket-launch-outline" size={24} color={theme.text} />
                                                        <View>
                                                            <Text style={[styles.optionText, { color: theme.text }]}>{plan.name}</Text>
                                                            <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: 'bold' }}>{plan.durationInMonths} Meses</Text>
                                                        </View>
                                                    </View>
                                                    <MaterialCommunityIcons name="whatsapp" size={20} color={theme.text} />
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 20, borderWidth: 1, maxHeight: '85%', marginTop: 'auto', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    modalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    loggedAsBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
    loggedAsText: { flex: 1, fontSize: 11, lineHeight: 16 },

    tabsContainer: { flexDirection: 'row', borderRadius: 12, padding: 5, marginBottom: 20, borderWidth: 1 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    tabText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

    propostaTypeContainer: { flexDirection: 'row', borderRadius: 12, padding: 5, borderWidth: 1 },
    propostaTypeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    propostaTypeText: { fontWeight: '900', fontSize: 10, letterSpacing: 0.3 },

    promosWrapper: { marginBottom: 10, gap: 8 },
    promosLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
    promoToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: 'transparent' },
    promoToggleText: { fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5 },

    // ── Pills de seleção de oferta
    ofertaPill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
    ofertaPillText: { fontSize: 11, fontWeight: '900' },

    tabSection: { paddingTop: 5 },
    sectionDesc: { fontSize: 13, lineHeight: 18, marginBottom: 20 },

    inputLabel: { fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
    input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },

    optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    optionText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});