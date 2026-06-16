// src/screens/PropostaFamiliaScreen.js
import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Linking, Platform, SafeAreaView, Animated, Image, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { linksAlunos } from '../utils/linksAlunos';
import ModernResultCard from '../components/ModernResultCard';
import AthleteCard from '../components/AthleteCard';
import FaqAccordion from '../components/FaqAccordion';
import BonusCard from '../components/BonusCard';

const isWeb = Platform.OS === 'web';
const RootComponent = isWeb ? View : SafeAreaView;
const { width } = Dimensions.get('window');

// 🌿💜 PALETA TEMÁTICA: Verde (saúde/família) + Roxo (premium)
const GREEN = '#34D399';
const PURPLE = '#A78BFA';
const PURPLE_DARK = '#7C3AED';

// ─── Regras de negócio (sem data de expiração, sem limite de vagas) ────────
const MIN_MEMBROS = 3;
const MAX_MEMBROS = 8;

// Desconto escalonado por posição de adesão (modelo "streaming")
// 1ª pessoa: preço cheio | 2ª: -15% | 3ª: -20% | 4ª+: -25%
const getDiscountForPosition = (position) => {
    if (position === 1) return 0;
    if (position === 2) return 0.15;
    if (position === 3) return 0.20;
    return 0.25; // 4ª pessoa em diante
};

// Preços base mensais (iguais aos das outras propostas, plano ELITE/PERFORMANCE)
const PLAN_PRICES = {
    PERFORMANCE: 197,
    ELITE: 297,
};

const faqList = [
    {
        q: "O desconto funciona como? Por que a 1ª pessoa paga cheio?",
        a: "Funciona em camadas, parecido com plano família de streaming: a primeira pessoa que entra paga o valor integral do plano dela. A partir da segunda pessoa, cada novo membro entra com desconto crescente — 15% a partir do 2º, 20% no 3º, e 25% do 4º membro em diante. Quanto maior a família, maior a economia por pessoa."
    },
    {
        q: "Cada pessoa pode escolher um plano diferente?",
        a: "Sim! Esse é o grande diferencial do Plano Família: cada membro escolhe Performance (só treino) ou Elite VIP (treino + dieta) de acordo com o objetivo dele. O desconto é aplicado sobre o valor do plano que cada um escolheu, na ordem de adesão."
    },
    {
        q: "Existe um número máximo de pessoas?",
        a: "Não tem limite rígido — você pode adicionar quantos membros da família quiser. Calculamos exemplos até 8 pessoas, mas se a sua família for maior, é só nos chamar no WhatsApp que ajustamos juntos."
    },
    {
        q: "Essa promoção tem data para acabar?",
        a: "Não. O Plano Família é uma condição estrutural e fixa do nosso negócio — não uma promoção relâmpago. Você pode montar o seu grupo familiar quando quiser, sem pressa e sem prazo."
    },
    {
        q: "Os membros precisam morar na mesma casa?",
        a: "Não exigimos comprovação de endereço. O espírito do plano é para grupos familiares e parentes próximos (pais, filhos, irmãos, cônjuges) que querem treinar com acompanhamento profissional e dividir o benefício do desconto."
    },
    {
        q: "Como funciona o suporte para um grupo grande?",
        a: "Cada membro tem o seu próprio acesso individual ao app — com treino, dieta (se for Elite) e evolução próprios. O suporte via WhatsApp e PA Coach AI funciona normalmente para cada pessoa, sem fila compartilhada."
    }
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatBRL(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PropostaFamiliaScreen({ route }) {
    const rawName = route?.params?.nome?.trim() || '';
    const genericNames = ['novo aluno', 'nova aluna', 'aluno', 'aluna', 'teste', 'atleta', 'lead', 'cliente', 'familia', 'família'];
    const isGeneric = !rawName || genericNames.includes(rawName.toLowerCase());
    const displayName = isGeneric ? 'FAMÍLIA' : rawName.toUpperCase();

    // Roteamento de WhatsApp (mesmo padrão das outras propostas)
    const coachParam = route?.params?.coach?.trim()?.toLowerCase() || '';
    const telefoneParam = route?.params?.telefone?.trim() || '';
    let waNumber = '5541997991346';
    if (telefoneParam) {
        waNumber = telefoneParam.replace(/\D/g, '');
    } else if (['adri', 'adriele', 'japinha'].includes(coachParam)) {
        waNumber = '5541998465582';
    }

    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // ── Estado do calculador interativo ──────────────────────────────────────
    // Cada membro tem um plano: 'PERFORMANCE' ou 'ELITE'
    const [membros, setMembros] = useState([
        { id: 1, plan: 'ELITE' },
        { id: 2, plan: 'ELITE' },
        { id: 3, plan: 'PERFORMANCE' },
    ]);

    const addMembro = () => {
        if (membros.length >= MAX_MEMBROS) return;
        setMembros(prev => [...prev, { id: Date.now(), plan: 'PERFORMANCE' }]);
    };

    const removeMembro = (id) => {
        if (membros.length <= MIN_MEMBROS) return;
        setMembros(prev => prev.filter(m => m.id !== id));
    };

    const togglePlan = (id) => {
        setMembros(prev => prev.map(m =>
            m.id === id ? { ...m, plan: m.plan === 'ELITE' ? 'PERFORMANCE' : 'ELITE' } : m
        ));
    };

    // ── Cálculo do total com desconto escalonado ────────────────────────────
    const calculo = useMemo(() => {
        let totalOriginal = 0;
        let totalComDesconto = 0;

        const linhas = membros.map((membro, index) => {
            const position = index + 1;
            const discount = getDiscountForPosition(position);
            const basePrice = PLAN_PRICES[membro.plan];
            const finalPrice = basePrice * (1 - discount);

            totalOriginal += basePrice;
            totalComDesconto += finalPrice;

            return {
                ...membro,
                position,
                discount,
                basePrice,
                finalPrice,
            };
        });

        const economiaTotal = totalOriginal - totalComDesconto;
        const economiaPercent = totalOriginal > 0 ? (economiaTotal / totalOriginal) * 100 : 0;

        return { linhas, totalOriginal, totalComDesconto, economiaTotal, economiaPercent };
    }, [membros]);

    const handleWhatsAppCTA = () => {
        const resumoMembros = calculo.linhas
            .map(l => `${l.position}º membro: ${l.plan === 'ELITE' ? 'Elite VIP' : 'Performance'} — R$ ${formatBRL(l.finalPrice)}`)
            .join('\n');

        const text = `Oi! Quero montar o Plano Família com ${membros.length} pessoas. 👨‍👩‍👧‍👦💪\n\nSimulação que fiz no app:\n${resumoMembros}\n\nTotal mensal: R$ ${formatBRL(calculo.totalComDesconto)}\nEconomia: R$ ${formatBRL(calculo.economiaTotal)} (${calculo.economiaPercent.toFixed(0)}%)\n\nVamos fechar?`;
        Linking.openURL(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`);
    };

    const renderYouTubeVideo = (videoId, isAutoPlay = false) => {
        const autoPlayParams = isAutoPlay ? `&autoplay=1&mute=1&loop=1&playlist=${videoId}` : '';
        if (isWeb) {
            return React.createElement('iframe', {
                src: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${autoPlayParams}`,
                style: { width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 },
                allowFullScreen: true,
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            });
        }
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="youtube" size={40} color="#FF0000" />
                <Text style={{ color: '#FFF', marginTop: 10 }}>Vídeo disponível na versão Web</Text>
            </View>
        );
    };

    // ────────────────────────────────────────────────────────────────────────
    return (
        <RootComponent style={styles.container}>
            <Image source={{ uri: linksAlunos.background }} style={styles.backgroundImage} blurRadius={2} />

            <View style={styles.webWrapper}>
                <ScrollView
                    style={{ flex: 1, width: '100%' }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── HERO ──────────────────────────────────────────────────────── */}
                    <View style={styles.heroSection}>
                        <View style={styles.permanentBadge}>
                            <MaterialCommunityIcons name="infinity" size={16} color={GREEN} />
                            <Text style={styles.permanentText}>CONDIÇÃO FIXA — SEM DATA PARA ACABAR</Text>
                        </View>

                        <Text style={styles.heroGreeting}>FALA, {displayName}! 👨‍👩‍👧‍👦</Text>
                        <Text style={styles.heroTitle}>
                            QUANTO MAIS GENTE DA FAMÍLIA,{' '}
                            <Text style={{ color: GREEN }}>MENOS CADA UM PAGA</Text>
                        </Text>
                        <Text style={styles.heroSub}>
                            Criamos o Plano Família para quem quer levar a transformação pra dentro de casa.
                            Cada pessoa escolhe o plano que faz sentido pra ela — <Text style={{ color: PURPLE, fontWeight: 'bold' }}>Performance ou Elite VIP</Text> —
                            e o desconto cresce conforme a família cresce.
                        </Text>
                    </View>

                    {/* ── COMO FUNCIONA O DESCONTO ─────────────────────────────────── */}
                    <Text style={styles.sectionTitle}>COMO FUNCIONA O DESCONTO</Text>
                    <Text style={styles.sectionSub}>
                        O primeiro membro entra no valor cheio. A partir do segundo, o desconto aumenta a cada novo nome adicionado.
                    </Text>

                    <View style={styles.discountStepsRow}>
                        <View style={styles.discountStep}>
                            <Text style={[styles.discountStepNumber, { color: '#888' }]}>1º</Text>
                            <Text style={styles.discountStepLabel}>Preço cheio</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#444" />
                        <View style={styles.discountStep}>
                            <Text style={[styles.discountStepNumber, { color: GREEN }]}>2º</Text>
                            <Text style={styles.discountStepLabel}>-15%</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#444" />
                        <View style={styles.discountStep}>
                            <Text style={[styles.discountStepNumber, { color: GREEN }]}>3º</Text>
                            <Text style={styles.discountStepLabel}>-20%</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#444" />
                        <View style={styles.discountStep}>
                            <Text style={[styles.discountStepNumber, { color: PURPLE }]}>4º+</Text>
                            <Text style={styles.discountStepLabel}>-25%</Text>
                        </View>
                    </View>

                    {/* ── CALCULADORA INTERATIVA ───────────────────────────────────── */}
                    <View style={styles.calcSection}>
                        <Text style={styles.sectionTitle}>MONTE A SUA FAMÍLIA</Text>
                        <Text style={styles.sectionSub}>
                            Adicione os membros e escolha o plano de cada um. O cálculo atualiza na hora.
                        </Text>

                        {/* Lista de membros */}
                        <View style={styles.membrosList}>
                            {calculo.linhas.map((linha) => (
                                <View key={linha.id} style={styles.membroRow}>
                                    <View style={styles.membroLeft}>
                                        <View style={[styles.membroPositionBadge, linha.position === 1 ? { backgroundColor: '#333' } : { backgroundColor: `${GREEN}20`, borderColor: GREEN, borderWidth: 1 }]}>
                                            <Text style={[styles.membroPositionText, linha.position !== 1 && { color: GREEN }]}>{linha.position}º</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.planToggleBtn,
                                                linha.plan === 'ELITE'
                                                    ? { backgroundColor: `${PURPLE}20`, borderColor: PURPLE }
                                                    : { backgroundColor: `${GREEN}15`, borderColor: GREEN },
                                            ]}
                                            onPress={() => togglePlan(linha.id)}
                                        >
                                            <MaterialCommunityIcons
                                                name={linha.plan === 'ELITE' ? 'crown' : 'weight-lifter'}
                                                size={14}
                                                color={linha.plan === 'ELITE' ? PURPLE : GREEN}
                                            />
                                            <Text style={[styles.planToggleText, { color: linha.plan === 'ELITE' ? PURPLE : GREEN }]}>
                                                {linha.plan === 'ELITE' ? 'ELITE VIP' : 'PERFORMANCE'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.membroRight}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            {linha.discount > 0 && (
                                                <Text style={styles.membroPriceOriginal}>R$ {formatBRL(linha.basePrice)}</Text>
                                            )}
                                            <Text style={styles.membroPriceFinal}>R$ {formatBRL(linha.finalPrice)}</Text>
                                        </View>

                                        {membros.length > MIN_MEMBROS && (
                                            <TouchableOpacity onPress={() => removeMembro(linha.id)} style={styles.removeBtn}>
                                                <MaterialCommunityIcons name="close" size={16} color="#666" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Botão adicionar membro */}
                        {membros.length < MAX_MEMBROS && (
                            <TouchableOpacity style={styles.addMembroBtn} onPress={addMembro}>
                                <MaterialCommunityIcons name="account-plus" size={20} color={PURPLE} />
                                <Text style={styles.addMembroText}>ADICIONAR MEMBRO DA FAMÍLIA</Text>
                            </TouchableOpacity>
                        )}
                        {membros.length >= MAX_MEMBROS && (
                            <Text style={styles.maxMembrosText}>
                                Família grande! Acima de {MAX_MEMBROS} pessoas, fala com a gente no WhatsApp pra um plano sob medida.
                            </Text>
                        )}

                        {/* Resumo do total */}
                        <View style={styles.totalBox}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total sem desconto</Text>
                                <Text style={styles.totalValueStriked}>R$ {formatBRL(calculo.totalOriginal)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: GREEN }]}>Economia da família</Text>
                                <Text style={[styles.totalValueStriked, { color: GREEN, textDecorationLine: 'none', fontWeight: '900' }]}>
                                    -R$ {formatBRL(calculo.economiaTotal)} ({calculo.economiaPercent.toFixed(0)}%)
                                </Text>
                            </View>
                            <View style={[styles.totalRow, styles.totalRowFinal]}>
                                <Text style={styles.totalLabelFinal}>TOTAL MENSAL DA FAMÍLIA</Text>
                                <Text style={styles.totalValueFinal}>R$ {formatBRL(calculo.totalComDesconto)}</Text>
                            </View>
                        </View>

                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity onPress={handleWhatsAppCTA}>
                                <LinearGradient colors={[GREEN, PURPLE_DARK]} style={styles.buyBtnGradient}>
                                    <MaterialCommunityIcons name="whatsapp" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.buyBtnText}>QUERO ESSE PLANO PRA MINHA FAMÍLIA</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        <Text style={styles.calcDisclaimer}>
                            * Simulação mensal. Valores trimestrais, semestrais e anuais com desconto adicional são calculados pelo coach no fechamento.
                        </Text>
                    </View>

                    {/* ── VÍDEO PRINCIPAL ───────────────────────────────────────────── */}
                    <View style={styles.videoSection}>
                        <Text style={styles.sectionTitle}>NÃO ACREDITE SÓ EM MIM</Text>
                        <Text style={styles.sectionSub}>
                            Veja quem já transformou o corpo e a rotina porque decidiu parar de tentar sozinho.
                        </Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo('tvYMAVQpt8I', false)}
                        </View>
                    </View>

                    {/* ── ARSENAL DE SOLUÇÕES ───────────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 40 }]}>A RESPOSTA PARA TODA A FAMÍLIA</Text>
                    <Text style={styles.sectionSub}>
                        Cada pessoa com o seu plano, mas todos dentro do mesmo método validado.
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}>
                                <MaterialCommunityIcons name="account-multiple-check" size={32} color={GREEN} />
                            </View>
                            <Text style={styles.arsenalTitle}>Plano Individual Por Pessoa</Text>
                            <Text style={styles.arsenalDesc}>Cada membro tem treino, progresso e (se for Elite) dieta totalmente próprios — sem genérico, sem ficha compartilhada.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}>
                                <MaterialCommunityIcons name="trending-up" size={32} color={GREEN} />
                            </View>
                            <Text style={styles.arsenalTitle}>O Fim da Estagnação</Text>
                            <Text style={styles.arsenalDesc}>Toda vez que o peso ou os músculos de alguém pararem de responder, ajustamos a estratégia daquela pessoa especificamente.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}>
                                <MaterialCommunityIcons name="heart-multiple" size={32} color={PURPLE} />
                            </View>
                            <Text style={styles.arsenalTitle}>Motivação Dentro de Casa</Text>
                            <Text style={styles.arsenalDesc}>Quando a família toda está no mesmo método, a adesão e a consistência aumentam — ninguém treina sozinho na jornada.</Text>
                        </View>
                        <View style={styles.arsenalCard}>
                            <View style={styles.featureIconBox}>
                                <MaterialCommunityIcons name="account-group" size={32} color={PURPLE} />
                            </View>
                            <Text style={styles.arsenalTitle}>Suporte Para Cada Um</Text>
                            <Text style={styles.arsenalDesc}>Cada membro tem acesso ao PA Coach AI 24h e suporte individual — sem depender de quem "entendeu mais" do plano.</Text>
                        </View>
                    </ScrollView>

                    {/* ── MENTOR ────────────────────────────────────────────────────── */}
                    <View style={styles.mentorSection}>
                        <LinearGradient colors={['rgba(26,26,26,0)', 'rgba(26,26,26,1)']} style={styles.mentorGradientBg} />
                        <View style={styles.mentorContent}>
                            <View style={styles.mentorBadgeRow}>
                                <View style={styles.featureIconBox}>
                                    <MaterialCommunityIcons name="card-account-details-star-outline" size={28} color={GREEN} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mentorSub}>EU JÁ ESTIVE DO OUTRO LADO</Text>
                                    <Text style={styles.mentorLabelHeader}>CONHEÇA SEU MENTOR:</Text>
                                    <Text style={styles.mentorNameStrong}>PAULO ADRIANO</Text>
                                </View>
                            </View>

                            <Text style={styles.mentorDesc}>
                                "Eu já fui um 'ex-gordo' com 97kg. Usei a ciência e a disciplina para me transformar em um Campeão Natural com 77kg.{"\n\n"}
                                Hoje, eu e a Adri vivemos isso em casa, juntos. E sei o quanto é mais fácil manter a consistência quando a família inteira está no mesmo propósito. <Text style={{ color: GREEN, fontWeight: 'bold' }}>Foi por isso que criei o Plano Família.</Text>"
                            </Text>

                            <View style={styles.swipeHintContainer}>
                                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={24} color={GREEN} />
                                <Text style={styles.swipeHintText}>ARRASTE PARA O LADO E VEJA A TRANSFORMAÇÃO</Text>
                            </View>

                            <ScrollView
                                horizontal
                                snapToInterval={340}
                                snapToAlignment="center"
                                decelerationRate="fast"
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.carouselContainerMentor}
                            >
                                <View style={styles.imageColMentor}>
                                    <View style={[styles.imagePlaceholderMentor, { filter: 'grayscale(100%)' }]}>
                                        <Image source={{ uri: linksAlunos.mentor_desafio_9x16 }} style={styles.resultImageMentorContain} />
                                    </View>
                                </View>
                                <View style={styles.imageColMentor}>
                                    <View style={styles.imagePlaceholderMentor}>
                                        <Image source={{ uri: linksAlunos.mentor_vitoria_9x16 }} style={styles.resultImageMentorContain} />
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>

                    {/* ── IA HIGHLIGHT ──────────────────────────────────────────────── */}
                    <View style={styles.aiHighlightSection}>
                        <Text style={styles.sectionTitle}>NUNCA MAIS DESPERDICEM TEMPO FAZENDO ERRADO</Text>
                        <Text style={styles.sectionSub}>
                            A maioria das pessoas treina errado e nem percebe. Aqui, cada repetição de cada membro da família é ajustada para realmente gerar resultado.
                        </Text>
                        <View style={styles.videoContainer9x16}>
                            {renderYouTubeVideo(linksAlunos.ai_video_id, true)}
                        </View>
                    </View>

                    {/* ── PROVA SOCIAL ──────────────────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 10 }]}>NÃO SOMOS TREINADORES DE TEORIA</Text>
                    <Text style={styles.sectionSub}>
                        Eu e a Adri vivemos a transformação na pele e validamos esse método em dezenas de alunos — incluindo famílias inteiras.
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <ModernResultCard goal="🔥 QUASE 20KG ELIMINADOS: DE 97KG PARA 77KG COM SAÚDE E CURVAS RECUPERADAS (Letícia - Aluna da Adri)" montageUri={linksAlunos.leticia_montagem} />
                        <ModernResultCard goal="🏆 VENCENDO O SOBREPESO: A VIRADA DE CHAVE QUE DERRETEU A GORDURA (Paulo)" montageUri={linksAlunos.paulo_montagem} />
                        <ModernResultCard goal="🍑 CORPO DESENHADO E GLÚTEO NA NUCA: HIPERTROFIA E DEFINIÇÃO REAL (Jéssica - Aluna da Adri)" montageUri={linksAlunos.jessica_montagem} />
                        <ModernResultCard goal="⏳ O FIM DA GORDURINHA NAS COSTAS: CINTURA FINA E CONFIANÇA PARA VESTIR QUALQUER ROUPA (Evelyn)" montageUri={linksAlunos.evelyn_montagem} />
                        <ModernResultCard goal="💪 DA OBESIDADE À PERFORMANCE: O CORPO QUE ELE ACHOU QUE NUNCA TERIA (Pedro)" montageUri={linksAlunos.pedro_montagem} />
                        <ModernResultCard goal="🏆 QUEBRANDO PLATÔS: DO TREINO COMUM AO PADRÃO DE PALCO (Adri)" montageUri={linksAlunos.adri_montagem} />
                    </ScrollView>

                    {/* ── PADRÃO ELITE ──────────────────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 40 }]}>PADRÃO ELITE</Text>
                    <Text style={styles.sectionSub}>Vivendo a alta performance e guiando famílias e atletas aos pódios.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <AthleteCard uri={linksAlunos.equipe_adri} title="LIDERANDO PELO EXEMPLO" desc="Eu e minha esposa Adri dividindo os palcos. Ela garante suporte e motivação constante para que ninguém fique para trás no processo." />
                        <AthleteCard uri={linksAlunos.aluna_medalha} title="O RESULTADO DO TRABALHO" desc="Aluna de 39 anos de idade, que conseguimos colocar um shape competitivo ao perder 32kgs." />
                        <AthleteCard uri={linksAlunos.felipe_podio} title="MÉTODO VALIDADO" desc="Nosso atleta Felipe comemorando sua vitória após um trabalho impecável de preparação." />
                    </ScrollView>

                    {/* ── BÔNUS ─────────────────────────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 40 }]}>ARSENAL DE BÔNUS</Text>
                    <Text style={styles.sectionSub}>Material extra desbloqueado de acordo com o plano de assinatura de cada membro.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                        <BonusCard themeColor={GREEN} uri={linksAlunos.ebook_5dicas} title="E-book: 5 Dicas de Emagrecimento" subtitle="O pontapé inicial para a queima." isAudio={false} price="14,90" unlockText="TODOS OS PLANOS" />
                        <BonusCard themeColor={GREEN} uri={linksAlunos.ebook_receitas_whey} title="Receitas Fit com Whey" subtitle="Sobremesas anabólicas." isAudio={false} price="19,90" unlockText="TODOS OS PLANOS" />
                        <BonusCard themeColor={PURPLE} uri={linksAlunos.ebook_shape} title="E-book: Shape Natural" subtitle="Guia completo de hipertrofia." isAudio={false} price="34,90" unlockText="A PARTIR DO ELITE VIP" />
                        <BonusCard themeColor={PURPLE} uri={linksAlunos.ebook_pernas} title="E-book: Pernas Grandes" subtitle="Foco em membros inferiores." isAudio={false} price="29,90" unlockText="A PARTIR DO ELITE VIP" />
                        <BonusCard themeColor={PURPLE} uri={linksAlunos.audio_shape} title="Audiobook: Shape Natural" subtitle="Para ouvir a caminho do treino." isAudio={true} price="34,90" unlockText="A PARTIR DO ELITE VIP" />
                    </ScrollView>

                    {/* ── FAQ ───────────────────────────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { marginTop: 40, marginBottom: 20 }]}>AINDA TEM DÚVIDAS?</Text>
                    <FaqAccordion faqs={faqList} />

                    {/* ── FECHAMENTO ────────────────────────────────────────────────── */}
                    <Text style={styles.finalClosingText}>
                        "A transformação fica mais fácil quando toda a casa caminha junto. Comece pela sua família — sem pressa, sem prazo, no seu tempo."
                    </Text>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>PAULO ADRIANO TEAM © 2026</Text>
                        <Text style={styles.footerSubText}>Plano Família — condição fixa, sem data para expirar.</Text>
                    </View>
                </ScrollView>
            </View>
        </RootComponent>
    );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { height: isWeb ? '100vh' : '100%', backgroundColor: '#0a0a0a', position: 'relative' },
    backgroundImage: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute', top: 0, left: 0, opacity: 0.15 },
    webWrapper: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#1A2E22', backgroundColor: 'rgba(17,17,17,0.92)' },
    scrollContent: { flexGrow: 1, padding: 25, paddingBottom: 120 },

    // ── Hero
    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
    permanentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${GREEN}15`, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: `${GREEN}50`, marginBottom: 20, gap: 8 },
    permanentText: { color: GREEN, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    heroGreeting: { color: '#888', fontWeight: '900', fontSize: 14, letterSpacing: 2, marginBottom: 10 },
    heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', lineHeight: 34, letterSpacing: -1, marginBottom: 15 },
    heroSub: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 5 },

    // ── Seções genéricas
    sectionTitle: { color: '#FFF', fontSize: 21, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, marginBottom: 5 },
    sectionSub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
    carouselContainer: { paddingLeft: 0, paddingRight: 20, paddingBottom: 20 },

    // ── Steps de desconto
    discountStepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 4 },
    discountStep: { alignItems: 'center', backgroundColor: '#161616', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2A2A2A', minWidth: 56 },
    discountStepNumber: { fontSize: 16, fontWeight: '900' },
    discountStepLabel: { color: '#888', fontSize: 10, fontWeight: '700', marginTop: 2 },

    // ── Calculadora
    calcSection: { marginTop: 10, marginBottom: 40, backgroundColor: '#131313', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#262626' },
    membrosList: { gap: 10, marginBottom: 16 },
    membroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#2A2A2A' },
    membroLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    membroPositionBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    membroPositionText: { color: '#AAA', fontWeight: '900', fontSize: 12 },
    planToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
    planToggleText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
    membroRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    membroPriceOriginal: { color: '#666', fontSize: 11, textDecorationLine: 'line-through', fontWeight: 'bold' },
    membroPriceFinal: { color: '#FFF', fontSize: 15, fontWeight: '900' },
    removeBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },

    addMembroBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: PURPLE, borderStyle: 'dashed', marginBottom: 20 },
    addMembroText: { color: PURPLE, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
    maxMembrosText: { color: '#888', fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginBottom: 20, paddingHorizontal: 10, lineHeight: 18 },

    totalBox: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 16, marginBottom: 20, gap: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalRowFinal: { borderTopWidth: 1, borderTopColor: '#262626', paddingTop: 12, marginTop: 4 },
    totalLabel: { color: '#888', fontSize: 12, fontWeight: '700' },
    totalValueStriked: { color: '#666', fontSize: 13, textDecorationLine: 'line-through', fontWeight: 'bold' },
    totalLabelFinal: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    totalValueFinal: { color: GREEN, fontSize: 24, fontWeight: '900' },

    buyBtnGradient: { padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    buyBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    calcDisclaimer: { color: '#555', fontSize: 10, textAlign: 'center', marginTop: 14, paddingHorizontal: 10, lineHeight: 16 },

    // ── Vídeo
    videoSection: { marginTop: 10, marginBottom: 50 },
    videoContainer9x16: { width: '100%', maxWidth: 280, aspectRatio: 9 / 16, backgroundColor: '#222', borderRadius: 16, overflow: 'hidden', alignSelf: 'center', marginTop: 20, borderWidth: 1, borderColor: '#333', position: 'relative' },

    // ── Arsenal
    arsenalCard: { width: width > 600 ? 250 : width * 0.7, backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A', marginRight: 15, alignItems: 'flex-start' },
    featureIconBox: { width: 54, height: 54, borderRadius: 27, backgroundColor: `${GREEN}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: `${GREEN}30` },
    arsenalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    arsenalDesc: { color: '#888', fontSize: 13, lineHeight: 20 },

    // ── IA Highlight
    aiHighlightSection: { marginTop: 20, marginBottom: 40, paddingHorizontal: 15, paddingVertical: 30, backgroundColor: '#111', borderRadius: 24, borderWidth: 1, borderColor: `${PURPLE}30` },

    // ── Mentor
    mentorSection: { marginBottom: 40, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', marginTop: 40 },
    mentorGradientBg: { ...StyleSheet.absoluteFillObject },
    mentorContent: { padding: 20, flexDirection: 'column' },
    mentorBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 5, width: '100%' },
    mentorSub: { color: '#888', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
    mentorLabelHeader: { color: GREEN, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    mentorNameStrong: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 2 },
    mentorDesc: { color: '#BBB', fontSize: 15, lineHeight: 24, fontStyle: 'italic', textAlign: 'left', marginTop: 15, marginBottom: 20, paddingHorizontal: 5, width: '100%' },
    swipeHintContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 8, backgroundColor: `${GREEN}15`, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, alignSelf: 'center', borderWidth: 1, borderColor: `${GREEN}30` },
    swipeHintText: { color: GREEN, fontSize: 12, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
    carouselContainerMentor: { paddingHorizontal: 10, paddingBottom: 20 },
    imageColMentor: { width: 330, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    imagePlaceholderMentor: { width: '100%', aspectRatio: 9 / 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'transparent' },
    resultImageMentorContain: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 14 },

    // ── Fechamento e rodapé
    finalClosingText: { color: GREEN, fontSize: 16, fontWeight: '900', textAlign: 'center', marginTop: 40, marginBottom: 10, paddingHorizontal: 20, lineHeight: 26, fontStyle: 'italic' },
    footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
    footerText: { color: '#666', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    footerSubText: { color: '#444', fontSize: 10, marginTop: 5 },
});
