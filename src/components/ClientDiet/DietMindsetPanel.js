// src/components/ClientDiet/DietMindsetPanel.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ID hardcoded por enquanto (a resolver em iteração futura)
const TARGET_STUDENT_ID = '675a4acd-a4af-41c3-8caf-be1e03107ae8';

function PersonalizedAlerts({ theme, userId }) {
    if (userId !== TARGET_STUDENT_ID) return null;
    return (
        <View style={[s.siboCard, { backgroundColor: theme.surface, borderColor: '#FF9500' }]}>
            <View style={s.siboHeader}>
                <MaterialCommunityIcons name="alert-decagram" size={20} color="#FF9500" />
                <Text style={[s.siboTitle, { color: '#FF9500' }]}>REGRAS DE OURO (PROTOCOLO SIBO)</Text>
            </View>
            <View style={s.siboContent}>
                {[
                    ['Macarrão',      'Apenas de Arroz ou Milho (Sem Glúten).'],
                    ['Iogurte',       'Apenas Zero Lactose e SEM Xilitol/Sorbitol.'],
                    ['Suplementação', 'Whey Isolado sem Xilitol (Atenção ao rótulo).'],
                    ['Frutas',        'Banana mais firme (verde); Mamão pesado à risca.'],
                ].map(([bold, rest]) => (
                    <Text key={bold} style={[s.siboText, { color: theme.text }]}>
                        <Text style={{ fontWeight: '900' }}>• {bold}: </Text>{rest}
                    </Text>
                ))}
                <View style={[s.siboRule, { backgroundColor: theme.accent + '20' }]}>
                    <Text style={[s.siboRuleText, { color: theme.accent }]}>
                        ⚠️ ÁGUA: Nunca com a comida. Beba 30min antes ou 30min depois.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const MINDSET_CARDS = {
    EMAGRECIMENTO: [
        {
            icon:  'clock-fast',
            color: null, // usa theme.accent
            title: 'Horários Flexíveis',
            desc:  'Os horários são uma base. O mais importante é manter intervalos de ~3 horas entre as refeições e garantir energia perto do treino.',
        },
        {
            icon:  'glass-wine',
            color: '#FF6B35',
            title: 'O "Pecado" do Álcool',
            desc:  'Álcool é caloria vazia e paralisa a queima de gordura. Se for beber no final de semana, não exagere e sempre alterne com MUITA água.',
        },
        {
            icon:  'target',
            color: null,
            title: 'Cuidado com os Beliscos',
            desc:  'Aquela "beliscada" inocente fora do plano pode destruir o seu déficit calórico. Se a fome bater muito forte, beba água ou solicite um ajuste.',
        },
    ],
    HIPERTROFIA: [
        {
            icon:  'clock-fast',
            color: null,
            title: 'Horários Flexíveis',
            desc:  'Os horários são uma base. O mais importante é manter intervalos de ~3 horas entre as refeições e garantir energia perto do treino.',
        },
        {
            icon:  'glass-wine',
            color: '#FF6B35',
            title: 'O "Pecado" do Álcool',
            desc:  'O álcool prejudica severamente a recuperação e a síntese proteica. Se for beber, modere, não fique horas sem comer e alterne com água.',
        },
        {
            icon:  'target',
            color: null,
            title: 'Não Pule Refeições',
            desc:  'Para hipertrofiar você precisa de superávit calórico. Pular refeições porque "está sem fome" joga seus ganhos no lixo. Cumpra o volume prescrito!',
        },
    ],
};

export default function DietMindsetPanel({ theme, userId, goalType }) {
    const cards = MINDSET_CARDS[goalType] ?? MINDSET_CARDS.HIPERTROFIA;

    return (
        <View>
            <PersonalizedAlerts theme={theme} userId={userId} />

            <View style={[s.sectionHeader]}>
                <View style={[s.strip, { backgroundColor: theme.accent }]} />
                <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>MENTALIDADE DA DIETA</Text>
            </View>

            {cards.map((card, i) => (
                <View key={i} style={[s.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}>
                        <MaterialCommunityIcons
                            name={card.icon}
                            size={20}
                            color={card.color ?? theme.accent}
                        />
                        <Text style={[s.cardTitle, { color: theme.text }]}>{card.title}</Text>
                    </View>
                    <Text style={[s.cardDesc, { color: theme.textSecondary }]}>{card.desc}</Text>
                </View>
            ))}
        </View>
    );
}

const s = StyleSheet.create({
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 10 },
    strip:         { width: 4, height: 16, borderRadius: 2 },
    sectionTitle:  { fontSize: 12, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },

    infoCard:   { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    cardTitle:  { fontSize: 14, fontWeight: '900' },
    cardDesc:   { fontSize: 12, lineHeight: 18 },

    siboCard:    { borderRadius: 20, padding: 18, marginBottom: 25, borderWidth: 1.5, borderStyle: 'dashed' },
    siboHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
    siboTitle:   { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    siboContent: { gap: 10 },
    siboText:    { fontSize: 13, lineHeight: 20 },
    siboRule:    { padding: 12, borderRadius: 10, marginTop: 5 },
    siboRuleText:{ fontSize: 11, fontWeight: '900', textAlign: 'center' },
});