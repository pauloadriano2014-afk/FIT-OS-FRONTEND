// src/components/ClientDiet/DayTypeSelector.js
import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Animated, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toGrams, getMacro } from '../../utils/dietUtils';

// Habilita animação no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── CONFIG POR TIPO DE DIA ───────────────────────────────────────────────────
const DAY_CONFIG = {
    TREINO: {
        label:     'Treino de Força',
        shortLabel:'TREINO',
        icon:      'dumbbell',
        color:     '#32ADE6',
        desc:      'Musculação',
    },
    TREINO_CARDIO: {
        label:     'Treino + Cardio',
        shortLabel:'Treino e Cardio',
        icon:      'run-fast',
        color:     '#FF9500',
        desc:      'Dupla sessão',
    },
    CARDIO: {
        label:     'Só Cardio',
        shortLabel:'CARDIO',
        icon:      'heart-pulse',
        color:     '#FF3B30',
        desc:      'Aeróbico',
    },
    DESCANSO: {
        label:     'Descanso',
        shortLabel:'DESCANSO',
        icon:      'sleep',
        color:     '#34C759',
        desc:      'Recuperação',
    },
};

// ─── TEXTOS EXPLICATIVOS POR OBJETIVO + DIA ───────────────────────────────────
const BANNERS = {
    Hipertrofia: {
        TREINO: {
            titulo: '🏋️ Por que mais calorias hoje?',
            texto: 'No dia de treino de força, seu corpo precisa de energia extra para sustentar a intensidade e iniciar a reconstrução muscular. O superávit calórico é o que transforma o esforço na academia em músculo de verdade. Siga a dieta à risca — cada grama conta.',
        },
        TREINO_CARDIO: {
            titulo: '🔥 Dia mais exigente, mais combustível',
            texto: 'Treino duplo = maior gasto calórico. Essa aba tem mais calorias exatamente para isso: sustentar as duas sessões sem catabolismo e ainda garantir recuperação muscular adequada. Não pule nenhuma refeição hoje.',
        },
        CARDIO: {
            titulo: '❤️ Cardio sem perder músculo',
            texto: 'No dia de cardio, as calorias são ajustadas para manter o músculo enquanto o coração trabalha. Proteína em alta para proteger a massa magra. Siga a ordem das refeições — o timing importa.',
        },
        DESCANSO: {
            titulo: '💤 Descansando também se cresce',
            texto: 'O músculo cresce no repouso, não na academia. Por isso as calorias estão um pouco abaixo — menos gasto, menos comida — mas a proteína continua alta para continuar o processo de hipertrofia enquanto você dorme. Não burle esse dia.',
        },
    },
    Emagrecimento: {
        TREINO: {
            titulo: '🏋️ Treino pede mais energia',
            texto: 'No dia de treino, as calorias sobem um pouco para preservar sua massa muscular durante o déficit. Isso é estratégico: perder gordura sem perder músculo é o que garante um corpo definido. Cumpra cada refeição.',
        },
        TREINO_CARDIO: {
            titulo: '🔥 Dia de maior gasto — não corte calorias',
            texto: 'Hoje você vai gastar mais. Por isso a dieta tem mais calorias que os outros dias — para evitar que seu corpo entre em modo de sobrevivência e pare de queimar gordura. Confie no processo e siga o plano.',
        },
        CARDIO: {
            titulo: '❤️ Cardio potencializa a queima',
            texto: 'Dia aeróbico com calorias controladas — essa combinação acelera a perda de gordura. Mas atenção: pular refeições hoje pode canibalizar músculo. Siga todos os horários para manter o metabolismo ativo.',
        },
        DESCANSO: {
            titulo: '💤 Menos gasto, menos comida — simples assim',
            texto: 'Você não treinou, então o corpo precisa de menos energia. O déficit está maior hoje — e é isso que faz a balança andar. Resista à tentação de comer fora do plano. A disciplina nos dias de descanso é o que separa quem transforma de quem fica no mesmo lugar.',
        },
    },
    Definição: {
        TREINO: {
            titulo: '🏋️ Treino: preservar músculo e queimar gordura',
            texto: 'Na fase de definição, o treino de força é essencial para manter o músculo enquanto o déficit queima gordura. As calorias estão calibradas para esse equilíbrio fino. Não improvise — siga exatamente o que está aqui.',
        },
        TREINO_CARDIO: {
            titulo: '🔥 Dupla sessão exige mais combustível',
            texto: 'Mais gasto = mais calorias hoje. Esse ajuste é intencional para que você não perca rendimento nem músculo na sessão dupla. Cumpra todas as refeições, especialmente o pré e pós-treino.',
        },
        CARDIO: {
            titulo: '❤️ Cardio acelera a definição',
            texto: 'O cardio potencializa a queima sem sacrificar músculo — mas só se você comer certo. As refeições deste dia foram montadas especificamente para esse objetivo. Pular qualquer uma pode comprometer o resultado.',
        },
        DESCANSO: {
            titulo: '💤 Recuperação faz parte da definição',
            texto: 'No descanso, o corpo reorganiza, repara e define. As calorias estão em déficit controlado — suficiente para queimar gordura sem perder massa magra. Respeite o plano nesses dias: é aqui que grande parte da mágica acontece.',
        },
    },
};

// Fallback se objetivo não mapeado
const BANNER_FALLBACK = {
    TREINO:        { titulo: '🏋️ Dia de treino',   texto: 'Suas calorias estão ajustadas para o treino de hoje. Siga cada refeição no horário indicado para máximo resultado.' },
    TREINO_CARDIO: { titulo: '🔥 Dupla sessão',    texto: 'Hoje é o dia de maior gasto calórico. Não pule nenhuma refeição — seu corpo vai precisar de cada nutriente.' },
    CARDIO:        { titulo: '❤️ Dia de cardio',   texto: 'Refeições ajustadas para o aeróbico. Proteína em alta para proteger o músculo durante a atividade.' },
    DESCANSO:      { titulo: '💤 Dia de descanso', texto: 'Menos gasto, menos calorias. Mas não deixe de comer — a recuperação e os resultados acontecem aqui.' },
};

function getBanner(objetivo, dayType) {
    const mapa = BANNERS[objetivo] ?? null;
    return (mapa?.[dayType]) ?? BANNER_FALLBACK[dayType] ?? null;
}

// ─── CÁLCULO DE KCAL ─────────────────────────────────────────────────────────
// 🔥 Usa o mesmo toGrams/getMacro de utils/dietUtils.js que o admin usa
// (calculateCurrentMacros) — antes esse cálculo era feito na mão aqui com uma
// conversão de unidade fixa (amt * 50 pra tudo que não fosse g/ml), diferente
// da tabela real (fatia=25g, unid=50g, colher=15g, xícara=200g, + porções
// customizadas por alimento). Isso fazia os cards de TREINO/DESCANSO mostrarem
// mais kcal do que a "Mesa de Operações" do admin pro mesmo dia.
function calcKcal(meals) {
    let total = 0;
    meals.forEach(meal => {
        const grouped = (meal.items ?? []).reduce((acc, item) => {
            const key = item.substitutionGroupId ?? item.groupId ?? item.id ?? '';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
        Object.values(grouped).forEach(group => {
            const item = group[0];
            if (!item) return;
            const grams = toGrams(item.amount, item.unit, item);
            total += (getMacro(item, 'kcal') * grams) / 100;
        });
    });
    return Math.round(total);
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function DayTypeSelector({ theme, allMeals, activeType, onChange, objetivo }) {
    const scrollRef    = useRef(null);
    const [expanded, setExpanded] = useState(false);

    const ORDER = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'];
    const types = ORDER.filter(t =>
        (allMeals ?? []).some(m => (m.dayType ?? 'TREINO') === t)
    );

    // Reseta expanded ao trocar de aba
    useEffect(() => { setExpanded(false); }, [activeType]);

    useEffect(() => {
        const idx = types.indexOf(activeType);
        if (idx >= 0 && scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({ x: idx * 172, animated: true });
            }, 100);
        }
    }, [activeType]);

    if (types.length <= 1) return null;

    const cfg    = DAY_CONFIG[activeType] ?? { color: theme.accent };
    const banner = getBanner(objetivo, activeType);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => !prev);
    };

    return (
        <View style={styles.wrapper}>
            {/* CARROSSEL DE ABAS */}
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={172}
                snapToAlignment="start"
            >
                {types.map(t => {
                    const c        = DAY_CONFIG[t] ?? { label: t, shortLabel: t, icon: 'calendar', color: theme.accent, desc: '' };
                    const isActive = activeType === t;
                    const meals    = (allMeals ?? []).filter(m => (m.dayType ?? 'TREINO') === t);
                    const kcal     = calcKcal(meals);
                    const numMeals = meals.length;

                    return (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.card,
                                {
                                    backgroundColor: isActive ? c.color + '18' : theme.surface,
                                    borderColor:     isActive ? c.color         : theme.border,
                                    borderWidth:     isActive ? 2               : 1,
                                },
                            ]}
                            onPress={() => onChange(t)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconBox, { backgroundColor: c.color + '20' }]}>
                                <MaterialCommunityIcons name={c.icon} size={22} color={c.color} />
                            </View>
                            <Text style={[styles.cardLabel, { color: isActive ? c.color : theme.text }]}>
                                {c.shortLabel}
                            </Text>
                            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                                {c.desc}
                            </Text>
                            <View style={styles.statsRow}>
                                <View style={styles.stat}>
                                    <MaterialCommunityIcons name="fire" size={10} color={c.color} />
                                    <Text style={[styles.statText, { color: theme.textSecondary }]}>
                                        {kcal > 0 ? `${kcal} kcal` : '— kcal'}
                                    </Text>
                                </View>
                                <View style={styles.stat}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={10} color={c.color} />
                                    <Text style={[styles.statText, { color: theme.textSecondary }]}>
                                        {numMeals} ref.
                                    </Text>
                                </View>
                            </View>
                            {isActive && (
                                <View style={[styles.activeDot, { backgroundColor: c.color }]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* BANNER EXPLICATIVO */}
            {banner && (
                <TouchableOpacity
                    style={[styles.banner, {
                        backgroundColor: cfg.color + '12',
                        borderColor:     cfg.color + '40',
                    }]}
                    onPress={toggleExpand}
                    activeOpacity={0.85}
                >
                    <View style={styles.bannerHeader}>
                        <Text style={[styles.bannerTitle, { color: cfg.color }]}>
                            {banner.titulo}
                        </Text>
                        <MaterialCommunityIcons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={cfg.color}
                        />
                    </View>
                    {expanded && (
                        <Text style={[styles.bannerText, { color: theme.textSecondary }]}>
                            {banner.texto}
                        </Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper:       { marginBottom: 20 },
    scrollContent: { paddingHorizontal: 0, gap: 12, paddingRight: 16, paddingBottom: 2 },

    card: {
        width: 160, borderRadius: 20, padding: 16, position: 'relative',
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    cardLabel:  { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
    cardDesc:   { fontSize: 10, fontWeight: '700', marginBottom: 12 },
    statsRow:   { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    stat:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
    statText:   { fontSize: 9, fontWeight: '800' },
    activeDot:  { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4 },

    // Banner
    banner: {
        marginTop: 12, borderRadius: 16, borderWidth: 1, padding: 14,
    },
    bannerHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    bannerTitle: { fontSize: 13, fontWeight: '900', flex: 1, paddingRight: 8 },
    bannerText:  { fontSize: 13, lineHeight: 20, fontWeight: '600', marginTop: 10 },
});