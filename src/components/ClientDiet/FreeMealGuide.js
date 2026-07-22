// src/components/ClientDiet/FreeMealGuide.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WPP_NUMBER = '5541997991346';

const OPTIONS = [
    {
        icon: '🍕',
        title: 'Pizza Proteica (A controlada)',
        desc: '2 a 3 fatias. Foque em Frango com Catupiry, Marguerita ou Carne Seca.',
        avoid: 'Calabresa, Bacon e bordas recheadas.',
    },
    {
        icon: '🍔',
        title: 'Hambúrguer Artesanal (O monstro limpo)',
        desc: '1 hambúrguer duplo completo (pão, 2 carnes, queijo, salada).',
        avoid: 'Batata frita e refrigerante com açúcar.',
    },
    {
        icon: '🍣',
        title: 'Sushi (O volume limpo)',
        desc: '15 a 20 peças: Sashimi, Nigiri, Uramaki. Não é rodízio liberado!',
        avoid: 'Excesso de frituras (Hot Rolls) e molho Tarê.',
    },
    {
        icon: '🍝',
        title: 'Massa / Macarronada (Carbo load)',
        desc: '1 prato fundo com molho à base de proteína (Bolonhesa de patinho, frango ou camarão).',
        avoid: 'Molhos brancos pesados (quatro queijos, bacon).',
    },
    {
        icon: '🍦',
        title: 'Foco no Doce (A sobremesa tática)',
        desc: 'Faça a sua refeição normal e troque a caloria livre por uma sobremesa: 1 fatia de cheesecake, 1 brownie artesanal ou açaí com frutas.',
        avoid: null,
    },
];

export default function FreeMealGuide({ theme, diet }) {
    const [expanded, setExpanded] = useState(false);

    // 🔥 Identifica se é uma estratégia restritiva
    const isRestricted = diet?.isStrategy && /finaliza|cutting|low carb|detox|secagem/i.test(diet?.strategyName || '');
    const activeColor = isRestricted ? '#FF3B30' : theme.accent;

    return (
        <View style={{ marginTop: 10, marginBottom: 20 }}>
            <TouchableOpacity
                style={[
                    styles.header,
                    {
                        backgroundColor: theme.surface,
                        borderColor: activeColor,
                        borderBottomLeftRadius:  expanded ? 0 : 16,
                        borderBottomRightRadius: expanded ? 0 : 16,
                        borderBottomWidth: expanded ? 0 : 2,
                    },
                ]}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.8}
            >
                <View style={[styles.iconBox, { backgroundColor: activeColor }]}>
                    <MaterialCommunityIcons name={isRestricted ? "lock" : "pizza"} size={24} color={isRestricted ? "#FFF" : "#000"} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text, fontStyle: 'italic' }}>
                        REFEIÇÃO LIVRE
                    </Text>
                    <Text style={{ fontSize: 11, color: isRestricted ? '#FF3B30' : theme.textSecondary, fontWeight: 'bold', marginTop: 2 }}>
                        {isRestricted ? 'BLOQUEADA NESTA FASE' : 'TOQUE PARA VER REGRAS E OPÇÕES'}
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={26}
                    color={activeColor}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={[styles.body, { backgroundColor: theme.surface, borderColor: activeColor }]}>

                    {/* 🔥 TELA DE BLOQUEIO SE A ESTRATÉGIA FOR RESTRITA 🔥 */}
                    {isRestricted ? (
                        <View style={{ padding: 30, alignItems: 'center' }}>
                            <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#FF3B30" />
                            <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 16, marginTop: 15, letterSpacing: 0.5 }}>
                                FOCO TOTAL EXIGIDO
                            </Text>
                            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10, fontSize: 13, lineHeight: 22 }}>
                                Como você está na estratégia <Text style={{ fontWeight: 'bold', color: theme.text }}>"{diet?.strategyName}"</Text>, a refeição livre está suspensa para maximizar a sua resposta metabólica. Não fure o plano!
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* REGRAS NORMAIS */}
                            <View style={[styles.section, { borderBottomColor: theme.border }]}>
                                <View style={styles.sectionTitle}>
                                    <MaterialCommunityIcons name="gavel" size={18} color={theme.accent} />
                                    <Text style={[styles.sectionTitleText, { color: theme.text }]}>AS REGRAS DO JOGO</Text>
                                </View>
                                <Text style={[styles.intro, { color: theme.textSecondary }]}>
                                    A refeição livre é uma estratégia mental e metabólica. Ela ajuda a acelerar um
                                    metabolismo estagnado e dar alívio psicológico, mas{' '}
                                    <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                                        não é desculpa para chutar o balde e estragar a semana inteira
                                    </Text>.
                                </Text>
                                {[
                                    ['A Regra do Merecimento', 'Só está liberada se você seguiu a dieta 100% à risca nos outros dias. Furou? Perdeu o direito.'],
                                    ['É UMA Refeição',         'Escolha apenas uma refeição do dia (ex: jantar). As outras continuam na balança.'],
                                    ['Até a Saciedade',        'O objetivo é matar a vontade, não passar mal. Sentiu o estômago encher? Pare.'],
                                    ['Retorno Imediato',       'Na refeição seguinte, volte ao plano imediatamente. Aumente a água para limpar a retenção.'],
                                ].map(([title, desc], i) => (
                                    <View key={i} style={styles.ruleRow}>
                                        <Text style={[styles.ruleNum, { color: theme.accent }]}>{i + 1}.</Text>
                                        <Text style={[styles.ruleText, { color: theme.text }]}>
                                            <Text style={{ fontWeight: 'bold' }}>{title}: </Text>{desc}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* OPÇÕES */}
                            <View style={{ padding: 20 }}>
                                <View style={styles.sectionTitle}>
                                    <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={theme.accent} />
                                    <Text style={[styles.sectionTitleText, { color: theme.text }]}>OPÇÕES INTELIGENTES</Text>
                                </View>
                                <View style={{ gap: 12 }}>
                                    {OPTIONS.map((opt, i) => (
                                        <View
                                            key={i}
                                            style={[styles.optionCard, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                        >
                                            <Text style={[styles.optionTitle, { color: theme.text }]}>
                                                {opt.icon} {opt.title}
                                            </Text>
                                            <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                                                {opt.desc}
                                            </Text>
                                            {opt.avoid && (
                                                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                                                    <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Evite: </Text>
                                                    {opt.avoid}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.wppBtn, { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}
                                    onPress={() => Linking.openURL(
                                        `https://wa.me/${WPP_NUMBER}?text=Fala%20Coach!%20Estou%20vendo%20as%20op%C3%A7%C3%B5es%20da%20refei%C3%A7%C3%A3o%20livre%20e%20queria%20tirar%20uma%20d%C3%BAvida.`
                                    )}
                                >
                                    <MaterialCommunityIcons name="whatsapp" size={20} color={theme.accent} />
                                    <Text style={[styles.wppText, { color: theme.accent }]}>
                                        QUER OUTRA OPÇÃO? FALE COM O COACH
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center',
        padding: 18, borderTopLeftRadius: 16, borderTopRightRadius: 16,
        borderWidth: 2,
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center', marginRight: 15,
    },
    body: {
        borderWidth: 2, borderTopWidth: 0,
        borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        paddingBottom: 20,
    },
    section:      { padding: 20, paddingTop: 10, borderBottomWidth: 1 },
    sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitleText: { fontSize: 14, fontWeight: '900' },
    intro:        { fontSize: 13, lineHeight: 20, marginBottom: 15 },
    ruleRow:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
    ruleNum:      { fontWeight: '900' },
    ruleText:     { flex: 1, fontSize: 13, lineHeight: 18 },
    optionCard:   { padding: 15, borderRadius: 12, borderWidth: 1, gap: 4 },
    optionTitle:  { fontSize: 13, fontWeight: '900' },
    optionDesc:   { fontSize: 12, lineHeight: 18 },
    wppBtn: {
        marginTop: 20, padding: 15, borderRadius: 12, borderWidth: 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    wppText: { fontWeight: 'bold', fontSize: 12 },
});