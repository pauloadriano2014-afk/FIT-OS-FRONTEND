// src/components/AdminDiet/ModelSelectorModal.js — VERSÃO 3.1
// Modal completo: seleção de modelo + tabela semanal + RAIO-X COMPLETO
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
    const [activeTab, setActiveTab]           = useState('plan');  // 'plan' | 'model' | 'xray'
    const [weekDist, setWeekDist]             = useState(null);    // editado pelo coach

    const softBg = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

    const plan = useMemo(() => {
        if (!anamnese || !visible) return null;
        return calcWeeklyPlan(anamnese, aluno?.birthDate, aluno?.gender, weekDist);
    }, [anamnese, aluno, visible, weekDist]);

    useEffect(() => {
        if (visible && anamnese && !weekDist) {
            setWeekDist(suggestWeekDistribution(anamnese.frequencia, anamnese.objetivo));
        }
        if (!visible) {
            setWeekDist(null);
            setActiveTab('plan'); // Reseta a aba ao fechar
        }
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
            const activeDayTypes = DAY_TYPES.filter(d => (weekDist?.[d] || 0) > 0);
            onGenerate(selectedModel, activeDayTypes, weekDist);
        }
    };

    // Helper para o Raio-X
    const XRayItem = ({ icon, title, value }) => (
        <View style={[styles.xrayItem, { borderBottomColor: theme.border }]}>
            <View style={[styles.xrayIcon, { backgroundColor: softBg }]}>
                <MaterialCommunityIcons name={icon} size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.xrayTitle, { color: theme.textSecondary }]}>{title}</Text>
                <Text style={[styles.xrayValue, { color: theme.text }]}>{value || 'Não informado'}</Text>
            </View>
        </View>
    );

    if (!plan) return null;

    const { weekly, macrosByDay } = plan;
    const isDeficit = weekly.deficitSemanal >= 0;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={[styles.handle, { backgroundColor: theme.border }]} />

                    {/* CABEÇALHO */}
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={[styles.title, { color: theme.text }]}>ESTRATÉGIA IA</Text>
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
                            { id: 'plan',  label: 'PLANO',   icon: 'calendar-week' },
                            { id: 'model', label: 'IA',      icon: 'robot' },
                            { id: 'xray',  label: 'RAIO-X',  icon: 'file-find' },
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
                                            <View style={styles.dayCardTop}>
                                                <View style={[styles.dayIconBox, { backgroundColor: color + '20' }]}>
                                                    <MaterialCommunityIcons name={DAY_ICONS[dayType]} size={18} color={color} />
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text style={[styles.dayCardName, { color: theme.text }]}>{DAY_TYPE_LABELS[dayType]}</Text>
                                                    <Text style={[styles.dayCardKcal, { color: color }]}>{macros.kcal} kcal</Text>
                                                </View>
                                                <View style={styles.stepper}>
                                                    <TouchableOpacity style={[styles.stepBtn, { backgroundColor: softBg }]} onPress={() => adjustDay(dayType, -1)}>
                                                        <MaterialCommunityIcons name="minus" size={14} color={theme.text} />
                                                    </TouchableOpacity>
                                                    <Text style={[styles.stepValue, { color: theme.text }]}>{days}x</Text>
                                                    <TouchableOpacity style={[styles.stepBtn, { backgroundColor: softBg }]} onPress={() => adjustDay(dayType, +1)}>
                                                        <MaterialCommunityIcons name="plus" size={14} color={theme.text} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

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
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {/* ── ABA: RAIO-X DO PROMPT ────────────────────────── */}
                        {activeTab === 'xray' && (
                            <View style={[styles.xrayContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.xrayHeaderDesc, { color: theme.textSecondary }]}>
                                    Dossiê Completo: Estes são todos os dados que a IA lerá na ficha do aluno antes de calcular a dieta.
                                </Text>
                                
                                <XRayItem icon="account-details" title="Perfil & Objetivo" value={`${anamnese.objetivo} (${anamnese.nivel}) | ${anamnese.peso}kg | ${anamnese.altura}cm`} />
                                
                                <XRayItem icon="dumbbell" title="Rotina de Treino" value={`${anamnese.frequencia}x/sem (${anamnese.tempoDisponivel}min) | Treina em Jejum: ${anamnese.trainFasted ? 'Sim' : 'Não'}`} />

                                <XRayItem icon="hospital-box" title="Saúde & Patologias" value={`Condições: ${Array.isArray(anamnese.healthConditions) && anamnese.healthConditions.length ? anamnese.healthConditions.join(', ') : 'Nenhuma'} | Remédios: ${Array.isArray(anamnese.medications) && anamnese.medications.length ? anamnese.medications.join(', ') : 'Nenhum'}`} />

                                <XRayItem icon="stomach" title="Digestivo, Sono & Stress" value={`Digestão: ${Array.isArray(anamnese.digestiveIssues) && anamnese.digestiveIssues.length ? anamnese.digestiveIssues.join(', ') : 'Ok'} | Sono: ${anamnese.sleepHours} (${anamnese.sleepQuality}) | Stress: ${anamnese.stressLevel}/5`} />

                                <XRayItem icon="clock-outline" title="Horários & Refeições" value={`Acorda: ${anamnese.wakeUpTime || '?'} | Treina: ${anamnese.trainTime || '?'} | Dorme: ${anamnese.sleepTime || '?'} | Trabalho: ${anamnese.workTime || 'Livre'} | Refeições/dia: ${anamnese.mealsPerDay || '?'}`} />

                                <XRayItem icon="silverware-fork-knife" title="Hábitos & Comportamento" value={`Água: ${anamnese.waterIntake || '?'} | Álcool: ${anamnese.alcoholFreq || 'Não'} | Compulsão: ${anamnese.nightBinge || 'Não'} | Come fora: ${anamnese.eatsOutPerWeek || '?'}`} />

                                <XRayItem icon="history" title="Histórico de Dietas" value={`Maior Desafio: ${anamnese.biggestChallenge || 'Nenhum'} | Estratégia Pré-treino: ${anamnese.preworkoutStrategy || 'Padrão'}`} />

                                <XRayItem icon="alert-octagon" title="Alergias / Intolerâncias" value={anamnese.allergies || 'Nenhuma'} />

                                <XRayItem icon="cancel" title="Aversões (Não come)" value={anamnese.foodAversions || 'Nenhuma'} />

                                <XRayItem icon="thumb-up" title="Preferências Alimentares" value={anamnese.foodPreferences || 'Nenhuma'} />

                                <XRayItem icon="pill" title="Suplementos Atuais" value={Array.isArray(anamnese.supplements) ? anamnese.supplements.join(', ') : (anamnese.supplements || 'Nenhum')} />

                                <XRayItem icon="cash" title="Orçamento Alimentar" value={anamnese.budget || 'Não informado'} />
                            </View>
                        )}
                    </ScrollView>

                    {/* STATUS DE GERAÇÃO COM PORCENTAGEM */}
                    {isGenerating && generateProgress ? (
                        <View style={[styles.progressBox, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                            <ActivityIndicator size="small" color={theme.accent} />
                            <Text style={[styles.progressText, { color: theme.text }]}>{generateProgress}</Text>
                        </View>
                    ) : null}

                    {/* BOTÃO GERAR */}
                    <TouchableOpacity
                        style={[
                            styles.generateBtn,
                            { backgroundColor: (isGenerating || totalDays !== 7) ? theme.border : theme.accent },
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
        borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
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

    modelsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 20 },
    modelCard: { width: '47%', borderRadius: 20, borderWidth: 1.5, padding: 14, position: 'relative' },
    badge: { position: 'absolute', top: -8, right: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 8, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
    modelIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    modelLabel:   { fontSize: 13, fontWeight: '900', marginBottom: 2 },
    modelCompany: { fontSize: 10, fontWeight: '700', marginBottom: 8 },
    speedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
    speedText: { fontSize: 9, fontWeight: '800' },

    xrayContainer: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 20 },
    xrayHeaderDesc: { fontSize: 12, fontWeight: '600', marginBottom: 16, lineHeight: 18 },
    xrayItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    xrayIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    xrayTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
    xrayValue: { fontSize: 13, fontWeight: '600' },

    progressBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 12 },
    progressText: { fontSize: 13, fontWeight: '800', flex: 1 },

    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 20, marginTop: 8 },
    generateBtnText: { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
    costNote: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 10 },
});