import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    ScrollView, TextInput, Linking, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Promoções ativas ────────────────────────────────────────────────────────
// Para desativar uma promo, basta setar como false aqui.
const PROMO_MAES_ATIVA       = false; // já encerrou
const PROMO_NAMORADOS_ATIVA  = true;  // 💘 ativa agora

export default function AdminInviteModal({ visible, onClose, adminEmail, theme }) {
    const [activeTab, setActiveTab]       = useState('PROPOSTA');
    const [leadName, setLeadName]         = useState('');
    const [propostaType, setPropostaType] = useState('ELITE');

    // Flags de promoção — mutuamente exclusivas
    const [isPromoMaes,       setIsPromoMaes]       = useState(false);
    const [isPromoNavegantes, setIsPromoNavegantes] = useState(false);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const getCoachInfo = () => {
        let coachCode = 'PATEAM';
        let teamName  = 'à nossa equipe';
        if (adminEmail && adminEmail.toLowerCase().includes('adri.personal@hotmail.com')) {
            coachCode = 'CURVAS';
            teamName  = 'ao projeto Costas & Curvas';
        }
        return { coachCode, teamName };
    };

    const resetAndClose = () => {
        setLeadName('');
        setIsPromoMaes(false);
        setIsPromoNavegantes(false);
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
        return 'https://www.pauloadrianoteam.com.br';
    };

    // ── Ativa uma promo e desativa a outra ───────────────────────────────────
    const togglePromoMaes = () => {
        setIsPromoMaes(prev => !prev);
        setIsPromoNavegantes(false);
    };

    const togglePromoNavegantes = () => {
        setIsPromoNavegantes(prev => !prev);
        setIsPromoMaes(false);
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
            msgOutro:   `\n\nDá uma olhada e me chama aqui para garantirmos a vaga de vocês. São apenas 6 casais — quando acabar, acabou! ❤️‍🔥`,
        },
    };

    // ── Gera link + mensagem de proposta ─────────────────────────────────────
    const generatePropostaLink = () => {
        const finalName = leadName.trim() || 'Atleta';
        const baseUrl   = getBaseUrl();

        let routeName = 'Proposta';
        if (propostaType === 'START') {
            routeName = 'PropostaStart';
        } else if (propostaType === 'ELITE' && promoAtiva) {
            routeName = promoConfig[promoAtiva].routeName;
        }

        const inviteLink = `${baseUrl}/${routeName}?nome=${encodeURIComponent(finalName)}&plan=${propostaType}`;

        let message = '';
        if (propostaType === 'ELITE' && promoAtiva) {
            const cfg = promoConfig[promoAtiva];
            message = `${cfg.msgIntro(finalName)}\n\n🔗 ${inviteLink}${cfg.msgOutro}`;
        } else {
            message = `Fala, ${finalName}! Tudo bem?\n\nConforme conversamos, preparei um material completo para você entender exatamente como funciona a nossa metodologia e como vamos trabalhar juntos para transformar o seu corpo, sem perder tempo com treinos e dietas que não dão resultado.\n\nAcesse o link abaixo para ver todos os detalhes da consultoria, os bônus que você tem direito e os valores:\n\n🔗 ${inviteLink}\n\nDá uma olhada e me chama aqui para tirarmos qualquer dúvida e darmos o start, se fizer sentido pra você. 💪🔥`;
        }

        openWhatsApp(message);
    };

    // ── Gera link de cadastro direto ─────────────────────────────────────────
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

    // ── Cor e ícone do botão de envio (estado atual) ─────────────────────────
    const activeBtnColor = promoAtiva
        ? promoConfig[promoAtiva].color
        : propostaType === 'ELITE'
            ? '#FFCC00'
            : '#32ADE6';

    const activeBtnIcon = promoAtiva
        ? promoConfig[promoAtiva].icon
        : propostaType === 'ELITE'
            ? 'crown'
            : 'rocket-launch';

    const activeBtnLabel = promoAtiva
        ? promoConfig[promoAtiva].label
        : `ENVIAR PROPOSTA ${propostaType}`;

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

                    {/* 🔥 TRAVA 2: ScrollView blindado com width 100% */}
                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={{ paddingBottom: 20 }}
                        style={{ width: '100%' }}
                    >

                        {/* ── ABA PROPOSTA ─────────────────────────────────────── */}
                        {activeTab === 'PROPOSTA' && (
                            <View style={styles.tabSection}>
                                <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                                    Gera um link para a página de vendas expirável. O cronômetro inicia no primeiro clique do aluno.
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

                                {/* Tipo de oferta */}
                                <Text style={[styles.inputLabel, { color: theme.text, marginTop: 20 }]}>TIPO DE OFERTA:</Text>
                                <View style={[styles.propostaTypeContainer, { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: 10 }]}>
                                    <TouchableOpacity
                                        style={[styles.propostaTypeBtn, propostaType === 'ELITE' && { backgroundColor: '#FFCC00' }]}
                                        onPress={() => { setPropostaType('ELITE'); setIsPromoMaes(false); setIsPromoNavegantes(false); }}
                                    >
                                        <Text style={[styles.propostaTypeText, { color: propostaType === 'ELITE' ? '#000' : theme.textSecondary }]}>
                                            ELITE / PERFORMANCE
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.propostaTypeBtn, propostaType === 'START' && { backgroundColor: '#32ADE6' }]}
                                        onPress={() => { setPropostaType('START'); setIsPromoMaes(false); setIsPromoNavegantes(false); }}
                                    >
                                        <Text style={[styles.propostaTypeText, { color: propostaType === 'START' ? '#FFF' : theme.textSecondary }]}>
                                            START (DOWNSELL)
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* ── Toggles de promoção (só aparecem no tipo ELITE) ── */}
                                {propostaType === 'ELITE' && (
                                    <View style={styles.promosWrapper}>
                                        <Text style={[styles.promosLabel, { color: theme.textSecondary }]}>CAMPANHAS ATIVAS:</Text>

                                        {/* Toggle Dia das Mães */}
                                        {PROMO_MAES_ATIVA && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.promoToggle,
                                                    isPromoMaes && { backgroundColor: '#E91E6315', borderColor: '#E91E6340', borderWidth: 1 },
                                                ]}
                                                onPress={togglePromoMaes}
                                            >
                                                <MaterialCommunityIcons
                                                    name={isPromoMaes ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                    size={20}
                                                    color={isPromoMaes ? '#E91E63' : theme.textSecondary}
                                                />
                                                <Text style={[styles.promoToggleText, { color: isPromoMaes ? '#E91E63' : theme.textSecondary }]}>
                                                    {isPromoMaes ? '💖 PROMOÇÃO DIA DAS MÃES ATIVADA' : 'ATIVAR PROMOÇÃO DIA DAS MÃES'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Toggle Dia dos Namorados */}
                                        {PROMO_NAMORADOS_ATIVA && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.promoToggle,
                                                    isPromoNavegantes && { backgroundColor: '#E8003D15', borderColor: '#E8003D40', borderWidth: 1 },
                                                ]}
                                                onPress={togglePromoNavegantes}
                                            >
                                                <MaterialCommunityIcons
                                                    name={isPromoNavegantes ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                    size={20}
                                                    color={isPromoNavegantes ? '#E8003D' : theme.textSecondary}
                                                />
                                                <Text style={[styles.promoToggleText, { color: isPromoNavegantes ? '#E8003D' : theme.textSecondary }]}>
                                                    {isPromoNavegantes ? '❤️‍🔥 PROMOÇÃO DIA DOS NAMORADOS ATIVADA' : 'ATIVAR PROMOÇÃO DIA DOS NAMORADOS'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Nenhuma ativa */}
                                        {!PROMO_MAES_ATIVA && !PROMO_NAMORADOS_ATIVA && (
                                            <Text style={[styles.promoToggleText, { color: theme.textSecondary, paddingLeft: 4 }]}>
                                                Nenhuma campanha ativa no momento.
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 15, textAlign: 'center' }}>
                                    {propostaType === 'ELITE'
                                        ? 'Página Principal (Treino + Dieta)'
                                        : 'Plano de Entrada (Ficha de Treino)'}
                                </Text>

                                {/* Botão de envio */}
                                <TouchableOpacity
                                    style={[styles.optionCard, {
                                        borderColor:     activeBtnColor,
                                        backgroundColor: `${activeBtnColor}11`,
                                    }]}
                                    onPress={generatePropostaLink}
                                >
                                    <View style={styles.optionLeft}>
                                        <MaterialCommunityIcons name={activeBtnIcon} size={24} color={activeBtnColor} />
                                        <Text style={[styles.optionText, { color: activeBtnColor, fontWeight: '900' }]}>
                                            {activeBtnLabel}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="whatsapp" size={20} color={activeBtnColor} />
                                </TouchableOpacity>
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
    // 🔥 TRAVA 1: Adicionado overflow: 'hidden' no modalContent para a tela não vazar
    modalContent: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 20, borderWidth: 1, maxHeight: '85%', marginTop: 'auto', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflow: 'hidden' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    tabsContainer: { flexDirection: 'row', borderRadius: 12, padding: 5, marginBottom: 20, borderWidth: 1 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    tabText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

    propostaTypeContainer: { flexDirection: 'row', borderRadius: 12, padding: 5, borderWidth: 1 },
    propostaTypeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    propostaTypeText: { fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },

    // ── Promoções
    promosWrapper: { marginBottom: 10, gap: 8 },
    promosLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
    promoToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: 'transparent' },
    promoToggleText: { fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5 },

    tabSection: { paddingTop: 5 },
    sectionDesc: { fontSize: 13, lineHeight: 18, marginBottom: 20 },

    inputLabel: { fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
    // 🔥 TRAVA 3: fontSize alterado para 16 para matar o zoom da Apple
    input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, outlineStyle: 'none' },

    optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    optionText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});
