// src/components/AdminDiet/ModelSelectorModal.js — VERSÃO 2.0
// Modal completo: seleção de modelo + tabela semanal editável + resumo calórico
import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, Modal, StyleSheet,
    ActivityIndicator, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    calcWeeklyPlan, suggestWeekDistribution,
    DAY_TYPES, DAY_TYPE_LABELS
} from '../../utils/macroPlanner';

// ─── MODELOS DISPONÍVEIS ──────────────────────────────────────────────────────
export const AI_MODELS = [
    {
        id: 'anthropic', label: 'Claude Sonnet 4', company: 'Anthropic',
        icon: 'robot', color: '#D97706', speed: '~20s', stars: 5, badge: 'RECOMENDADO',
    },
    {
        id: 'openai', label: 'GPT-4o', company: 'OpenAI',
        icon: 'star-four-points', color: '#10A37F', speed: '~15s', stars: 5, badge: null,
    },
    {
        id: 'google', label: 'Gemini 2.5 Pro', company: 'Google',
        icon: 'google', color: '#4285F4', speed: '~25s', stars: 4, badge: null,
    },
    {
        id: 'openai-mini', label: 'GPT-4o mini', company: 'OpenAI',
        icon: 'lightning-bolt', color: '#6B7280', speed: '~8s', stars: 3, badge: 'ECONÔMICO',
    },
];

const DAY_ICONS = {
    TREINO:        'dumbbell',
    TREINO_CARDIO: 'run-fast',
    CARDIO:        'heart-pulse',
    DESCANSO:      'sleep',
};

const DAY_COLORS = {
    TREINO:        '#32ADE6',
    TREINO_CARDIO: '#FF9500',
    CARDIO:        '#FF3B30',
    DESCANSO:      '#34C759',
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function ModelSelectorModal({
    visible, theme, onClose, onGenerate,
    isGenerating, generateProgress,
    anamnese, aluno,
}) {
    const [selectedModel, setSelectedModel]   = useState('anthropic');
    const [activeTab, setActiveTab]           = useState('plan');  // 'plan' | 'model'
    const [weekDist, setWeekDist]             = useState(null);    // editado pelo coach

    const softBg = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

    // Calcula o plano semanal toda vez que a anamnese muda ou o modal abre
    const plan = useMemo(() => {
        if (!anamnese || !visible) return null;
        return calcWeeklyPlan(anamnese, aluno?.birthDate, aluno?.gender, weekDist);
    }, [anamnese, aluno, visible, weekDist]);

    // Inicializa weekDist com a sugestão automática
    useEffect(() => {
        if (visible && anamnese && !weekDist) {
            setWeekDist(suggestWeekDistribution(anamnese.frequencia, anamnese.objetivo));
        }
        if (!visible) setWeekDist(null);
    }, [visible, anamnese]);

    const adjustDay = (dayType, delta) => {
        setWeekDist(prev => {
            const current = prev[dayType] || 0;
            const next = Math.max(0, Math.min(7, current + delta));
            const total = Object.values({ ...prev, [dayType]: next }).reduce((a, b) => a + b, 0);
            if (total > 7) return prev;
            return { ...prev, [dayType]: next };
        });
    };

    const totalDays = weekDist
        ? Object.values(weekDist).reduce((a, b) => a + b, 0)
        : 0;

    const handleGenerate = () => {
        if (!isGenerating) {
            // Passa quais abas têm dias > 0
            const activeDayTypes = DAY_TYPES.filter(d => (weekDist?.[d] || 0) > 0);
            onGenerate(selectedModel, activeDayTypes, weekDist);
        }
    };

    if (!plan) return null;

    const { weekly, macrosByDay, objetivo } = plan;
    const isDeficit = weekly.deficitSemanal >= 0;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={[styles.handle, { backgroundColor: theme.border }]} />

                    {/* CABEÇALHO */}
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={[styles.title, { color: theme.text }]}>ESTRATÉGIA SEMANAL</Text>
                            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                                {anamnese?.objetivo} · {aluno?.name?.split(' ')[0]}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose} disabled={isGenerating}
                            style={[styles.closeBtn, { backgroundColor: softBg }]}
                        >
                            <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* ABAS INTERNAS */}
                    <View style={[styles.tabRow, { backgroundColor: softBg, borderColor: theme.border }]}>
                        {[
                            { id: 'plan',  label: 'PLANO SEMANAL', icon: 'calendar-week' },
                            { id: 'model', label: 'MODELO DE IA',  icon: 'robot' },
                        ].map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabBtn, activeTab === tab.id && { backgroundColor: theme.accent }]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <MaterialCommunityIcons
                                    name={tab.icon} size={14}
                                    color={activeTab === tab.id ? '#000' : theme.textSecondary}
                                />
                                <Text style={[
                                    styles.tabBtnText,
                                    { color: activeTab === tab.id ? '#000' : theme.textSecondary },
                                ]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

                        {/* ── ABA: PLANO SEMANAL ──────────────────────────────── */}
                        {activeTab === 'plan' && weekDist && (
                            <View style={{ paddingBottom: 20 }}>

                                {/* RESUMO TDEE */}
                                <View style={[styles.tdeeRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <View style={styles.tdeeItem}>
                                        <Text style={[styles.tdeeValue, { color: theme.text }]}>{plan.tmb}</Text>
                                        <Text style={[styles.tdeeLabel, { color: theme.textSecondary }]}>TMB</Text>
                                    </View>
                                    <View style={[styles.tdeeDivider, { backgroundColor: theme.border }]} />
                                    <View style={styles.tdeeItem}>
                                        <Text style={[styles.tdeeValue, { color: theme.text }]}>{plan.tdee}</Text>
                                        <Text style={[styles.tdeeLabel, { color: theme.textSecondary }]}>TDEE</Text>
                                    </View>
                                    <View style={[styles.tdeeDivider, { backgroundColor: theme.border }]} />
                                    <View style={styles.tdeeItem}>
                                        <Text style={[styles.tdeeValue, { color: theme.accent }]}>{weekly.avg.kcal}</Text>
                                        <Text style={[styles.tdeeLabel, { color: theme.textSecondary }]}>MÉDIA/DIA</Text>
                                    </View>
                                    <View style={[styles.tdeeDivider, { backgroundColor: theme.border }]} />
                                    <View style={styles.tdeeItem}>
                                        <Text style={[
                                            styles.tdeeValue,
                                            { color: isDeficit ? '#34C759' : '#FF9500' },
                                        ]}>
                                            {isDeficit ? '-' : '+'}{Math.abs(weekly.kgEstimadoSemana)}kg
                                        </Text>
                                        <Text style={[styles.tdeeLabel, { color: theme.textSecondary }]}>
                                            {isDeficit ? 'PERDA/SEM' : 'GANHO/SEM'}
                                        </Text>
                                    </View>
                                </View>

                                {/* CONTADOR DE DIAS */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                        Distribuição da Semana
                                    </Text>
                                    <View style={[
                                        styles.dayCountPill,
                                        { backgroundColor: totalDays === 7 ? '#34C75920' : '#FF3B3020' },
                                    ]}>
                                        <Text style={[
                                            styles.dayCountText,
                                            { color: totalDays === 7 ? '#34C759' : '#FF3B30' },
                                        ]}>
                                            {totalDays}/7 dias
                                        </Text>
                                    </View>
                                </View>

                                {/* CARDS DE CADA ABA */}
                                {DAY_TYPES.map(dayType => {
                                    const macros  = macrosByDay[dayType];
                                    const days    = weekDist[dayType] || 0;
                                    const color   = DAY_COLORS[dayType];
                                    const isActive = days > 0;

                                    return (
                                        <View
                                            key={dayType}
                                            style={[
                                                styles.dayCard,
                                                {
                                                    backgroundColor: isActive ? color + '12' : theme.surface,
                                                    borderColor: isActive ? color + '50' : theme.border,
                                                },
                                            ]}
                                        >
                                            {/* Linha superior: ícone + nome + stepper */}
                                            <View style={styles.dayCardTop}>
                                                <View style={[styles.dayIconBox, { backgroundColor: color + '20' }]}>
                                                    <MaterialCommunityIcons
                                                        name={DAY_ICONS[dayType]} size={18} color={color}
                                                    />
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text style={[styles.dayCardName, { color: theme.text }]}>
                                                        {DAY_TYPE_LABELS[dayType]}
                                                    </Text>
                                                    <Text style={[styles.dayCardKcal, { color: color }]}>
                                                        {macros.kcal} kcal
                                                    </Text>
                                                </View>
                                                {/* Stepper de dias */}
                                                <View style={styles.stepper}>
                                                    <TouchableOpacity
                                                        style={[styles.stepBtn, { backgroundColor: softBg }]}
                                                        onPress={() => adjustDay(dayType, -1)}
                                                    >
                                                        <MaterialCommunityIcons name="minus" size={14} color={theme.text} />
                                                    </TouchableOpacity>
                                                    <Text style={[styles.stepValue, { color: theme.text }]}>
                                                        {days}x
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={[styles.stepBtn, { backgroundColor: softBg }]}
                                                        onPress={() => adjustDay(dayType, +1)}
                                                    >
                                                        <MaterialCommunityIcons name="plus" size={14} color={theme.text} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            {/* Linha inferior: macros */}
                                            {isActive && (
                                                <View style={[styles.macroRow, { borderTopColor: color + '30' }]}>
                                                    {[
                                                        { l: 'PROT', v: macros.prot, u: 'g', c: '#32ADE6' },
                                                        { l: 'CARB', v: macros.carb, u: 'g', c: '#FFCC00' },
                                                        { l: 'GORD', v: macros.fat,  u: 'g', c: '#FF9500' },
                                                    ].map(({ l, v, u, c }) => (
                                                        <View key={l} style={styles.macroItem}>
                                                            <Text style={[styles.macroVal, { color: theme.text }]}>
                                                                {v}<Text style={{ fontSize: 9, color: theme.textSecondary }}>{u}</Text>
                                                            </Text>
                                                            <Text style={[styles.macroLbl, { color: c }]}>{l}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}

                                {/* RESUMO SEMANAL */}
                                <View style={[styles.weekSummary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>
                                        Média Semanal
                                    </Text>
                                    <View style={styles.summaryRow}>
                                        {[
                                            { l: 'KCAL', v: weekly.avg.kcal, u: '',  c: theme.accent },
                                            { l: 'PROT', v: weekly.avg.prot, u: 'g', c: '#32ADE6'    },
                                            { l: 'CARB', v: weekly.avg.carb, u: 'g', c: '#FFCC00'    },
                                            { l: 'GORD', v: weekly.avg.fat,  u: 'g', c: '#FF9500'    },
                                        ].map(({ l, v, u, c }) => (
                                            <View key={l} style={styles.summaryItem}>
                                                <Text style={[styles.summaryVal, { color: c }]}>
                                                    {v}<Text style={{ fontSize: 10, color: theme.textSecondary }}>{u}</Text>
                                                </Text>
                                                <Text style={[styles.summaryLbl, { color: theme.textSecondary }]}>{l}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={[styles.resultPill, {
                                        backgroundColor: isDeficit ? '#34C75915' : '#FF950015',
                                        borderColor:     isDeficit ? '#34C75940' : '#FF950040',
                                    }]}>
                                        <MaterialCommunityIcons
                                            name={isDeficit ? 'trending-down' : 'trending-up'}
                                            size={16}
                                            color={isDeficit ? '#34C759' : '#FF9500'}
                                        />
                                        <Text style={[styles.resultText, { color: isDeficit ? '#34C759' : '#FF9500' }]}>
                                            {isDeficit
                                                ? `Déficit de ${weekly.deficitSemanal} kcal/semana → estimativa de ${Math.abs(weekly.kgEstimadoSemana)}kg de gordura/semana`
                                                : `Superávit de ${Math.abs(weekly.deficitSemanal)} kcal/semana → estimativa de +${Math.abs(weekly.kgEstimadoSemana)}kg/semana`
                                            }
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* ── ABA: SELEÇÃO DE MODELO ───────────────────────── */}
                        {activeTab === 'model' && (
                            <View style={styles.modelsGrid}>
                                {AI_MODELS.map(model => {
                                    const isActive = selectedModel === model.id;
                                    return (
                                        <TouchableOpacity
                                            key={model.id}
                                            style={[
                                                styles.modelCard,
                                                {
                                                    backgroundColor: isActive ? model.color + '18' : theme.surface,
                                                    borderColor:     isActive ? model.color        : theme.border,
                                                },
                                            ]}
                                            onPress={() => setSelectedModel(model.id)}
                                            activeOpacity={0.8}
                                        >
                                            {model.badge && (
                                                <View style={[styles.badge, { backgroundColor: model.color }]}>
                                                    <Text style={styles.badgeText}>{model.badge}</Text>
                                                </View>
                                            )}
                                            <View style={[styles.modelIconBox, { backgroundColor: model.color + '20' }]}>
                                                <MaterialCommunityIcons name={model.icon} size={20} color={model.color} />
                                            </View>
                                            <Text style={[styles.modelLabel, { color: theme.text }]}>{model.label}</Text>
                                            <Text style={[styles.modelCompany, { color: theme.textSecondary }]}>{model.company}</Text>
                                            <View style={[styles.speedPill, { backgroundColor: softBg }]}>
                                                <MaterialCommunityIcons name="timer-outline" size={10} color={theme.textSecondary} />
                                                <Text style={[styles.speedText, { color: theme.textSecondary }]}>{model.speed}</Text>
                                            </View>
                                            <View style={styles.starsRow}>
                                                {[1,2,3,4,5].map(s => (
                                                    <MaterialCommunityIcons
                                                        key={s}
                                                        name={s <= model.stars ? 'star' : 'star-outline'}
                                                        size={10}
                                                        color={s <= model.stars ? model.color : theme.border}
                                                    />
                                                ))}
                                            </View>
                                            {isActive && (
                                                <View style={[styles.checkDot, { backgroundColor: model.color }]}>
                                                    <MaterialCommunityIcons name="check" size={10} color="#000" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>

                    {/* STATUS DE GERAÇÃO */}
                    {isGenerating && generateProgress ? (
                        <View style={[styles.progressBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <ActivityIndicator size="small" color={theme.accent} />
                            <Text style={[styles.progressText, { color: theme.accent }]}>{generateProgress}</Text>
                        </View>
                    ) : null}

                    {/* BOTÃO GERAR */}
                    <TouchableOpacity
                        style={[
                            styles.generateBtn,
                            {
                                backgroundColor: (isGenerating || totalDays !== 7)
                                    ? theme.border
                                    : theme.accent,
                            },
                        ]}
                        onPress={handleGenerate}
                        disabled={isGenerating || totalDays !== 7}
                        activeOpacity={0.85}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="robot-outline" size={20} color="#000" />
                                <Text style={styles.generateBtnText}>
                                    {totalDays !== 7
                                        ? `DISTRIBUIR ${7 - totalDays} DIA(S) RESTANTE(S)`
                                        : `GERAR COM ${AI_MODELS.find(m => m.id === selectedModel)?.label.toUpperCase()}`
                                    }
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={[styles.costNote, { color: theme.textSecondary }]}>
                        {`⚡ ${DAY_TYPES.filter(d => (weekDist?.[d] || 0) > 0).length} aba(s) ativa(s) → ${DAY_TYPES.filter(d => (weekDist?.[d] || 0) > 0).length} chamada(s) à IA`}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    sheet: {
        maxHeight: '92%', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        borderWidth: 1, borderBottomWidth: 0,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
    },
    handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    title:    { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { fontSize: 12, fontWeight: '700', marginTop: 2 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    tabRow: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, padding: 4, marginBottom: 16, gap: 4 },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 16 },
    tabBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },

    tdeeRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
    tdeeItem: { flex: 1, alignItems: 'center' },
    tdeeValue:{ fontSize: 15, fontWeight: '900' },
    tdeeLabel:{ fontSize: 9,  fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
    tdeeDivider: { width: 1, marginHorizontal: 4 },

    sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    dayCountPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    dayCountText: { fontSize: 11, fontWeight: '900' },

    dayCard: { borderRadius: 20, borderWidth: 1.5, marginBottom: 12, overflow: 'hidden' },
    dayCardTop: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    dayIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    dayCardName: { fontSize: 13, fontWeight: '900' },
    dayCardKcal: { fontSize: 11, fontWeight: '800', marginTop: 2 },

    stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stepBtn:  { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    stepValue:{ fontSize: 16, fontWeight: '900', minWidth: 28, textAlign: 'center' },

    macroRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 10, paddingHorizontal: 14 },
    macroItem:{ flex: 1, alignItems: 'center' },
    macroVal: { fontSize: 13, fontWeight: '900' },
    macroLbl: { fontSize: 9, fontWeight: '800', marginTop: 1 },

    weekSummary: { borderRadius: 20, borderWidth: 1, padding: 16, marginTop: 4 },
    summaryRow:  { flexDirection: 'row', marginBottom: 14 },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryVal:  { fontSize: 18, fontWeight: '900' },
    summaryLbl:  { fontSize: 10, fontWeight: '800', marginTop: 2 },

    resultPill: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
    resultText: { fontSize: 11, fontWeight: '700', flex: 1, lineHeight: 16 },

    modelsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 20 },
    modelCard: { width: '47%', borderRadius: 20, borderWidth: 1.5, padding: 14, position: 'relative' },
    badge: { position: 'absolute', top: -8, right: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 8, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
    modelIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    modelLabel:   { fontSize: 13, fontWeight: '900', marginBottom: 2 },
    modelCompany: { fontSize: 10, fontWeight: '700', marginBottom: 8 },
    speedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
    speedText: { fontSize: 9, fontWeight: '800' },
    starsRow:  { flexDirection: 'row', gap: 2 },
    checkDot:  { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    progressBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    progressText: { fontSize: 12, fontWeight: '700', flex: 1 },

    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 20, marginTop: 8 },
    generateBtnText: { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
    costNote: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 10 },
});