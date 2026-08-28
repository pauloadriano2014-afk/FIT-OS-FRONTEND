// src/components/AdminDiet/DietContextPanel.js
// Painel lateral direito (web/PC) com contexto clínico em tempo real
// Aparece apenas quando isWebPC = isWeb && windowWidth > 768
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calcWeeklyPlan } from '../../utils/macroPlanner';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ProgressBar({ current, target, color, theme }) {
    const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
    const over = current > target * 1.05;
    const barColor = over ? '#FF3B30' : pct >= 90 ? '#34C759' : color;
    return (
        <View style={[pb.track, { backgroundColor: theme.border }]}>
            <View style={[pb.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>
    );
}

function MacroRow({ label, current, target, unit, color, theme }) {
    const pct  = target > 0 ? Math.round((current / target) * 100) : 0;
    const over = current > target * 1.05;
    return (
        <View style={{ marginBottom: 12 }}>
            <View style={p.rowBetween}>
                <Text style={[p.macroLabel, { color: theme.textSecondary }]}>{label}</Text>
                <Text style={[p.macroValue, { color: over ? '#FF3B30' : theme.text }]}>
                    {current}<Text style={{ fontSize: 10, color: theme.textSecondary }}>{unit}</Text>
                    {' '}<Text style={[p.macroPct, { color: over ? '#FF3B30' : color }]}>({pct}%)</Text>
                </Text>
            </View>
            <ProgressBar current={current} target={target} color={color} theme={theme} />
            <Text style={[p.macroTarget, { color: theme.textSecondary }]}>Meta: {target}{unit}</Text>
        </View>
    );
}

function AlertCard({ icon, color, title, body, theme }) {
    return (
        <View style={[p.alertCard, { backgroundColor: color + '12', borderColor: color + '40' }]}>
            <MaterialCommunityIcons name={icon} size={14} color={color} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
                <Text style={[p.alertTitle, { color }]}>{title}</Text>
                {body ? <Text style={[p.alertBody, { color: theme.textSecondary }]}>{body}</Text> : null}
            </View>
        </View>
    );
}

function SectionTitle({ icon, label, theme }) {
    return (
        <View style={[p.sectionTitle, { borderBottomColor: theme.border }]}>
            <MaterialCommunityIcons name={icon} size={13} color={theme.accent} />
            <Text style={[p.sectionTitleText, { color: theme.textSecondary }]}>{label}</Text>
        </View>
    );
}

// ─── GERAR ALERTAS CLÍNICOS ────────────────────────────────────────────────────
function buildClinicalAlerts(anamnese, visibleMeals) {
    if (!anamnese) return [];
    const alerts = [];

    // Bariátrica
    if (anamnese.bariatric) {
        const early = ['Menos de 6 meses', '6 meses a 1 ano'].includes(anamnese.bariatricTime ?? '');
        alerts.push({
            icon: 'alert-octagon', color: '#FF3B30',
            title: 'BARIÁTRICA',
            body: `Vol máx ${early ? 150 : 200}ml/refeição · Prot mín ${early ? 80 : 90}g · Sem líquido junto`,
        });
    }

    // Condições metabólicas
    const cond = anamnese.healthConditions ?? [];
    if (cond.some(c => ['Diabetes Tipo 2', 'Pré-diabetes', 'Resistência à Insulina'].includes(c)))
        alerts.push({ icon: 'water-alert', color: '#FF9500', title: 'DM2 / RI', body: 'Carbos complexos · Sem fruta isolada · Distribuição uniforme de carbo' });
    if (cond.some(c => c.includes('Hipotireoidismo')))
        alerts.push({ icon: 'thermometer-low', color: '#FF9500', title: 'HIPOTIREOIDISMO', body: 'Meta kcal -10% · Castanha do Pará 1-2 unid/dia' });
    if (cond.includes('SOP'))
        alerts.push({ icon: 'gender-female', color: '#FF9500', title: 'SOP', body: 'Baixo IG · Gordura boa em cada refeição' });
    if (cond.includes('Hipertensão'))
        alerts.push({ icon: 'heart-pulse', color: '#FF9500', title: 'HIPERTENSÃO', body: 'Sem embutidos · Evite ultraprocessados com sódio' });

    // Digestivo
    const dig = anamnese.digestiveIssues ?? [];
    if (dig.some(d => ['Gastrite', 'Refluxo / DRGE'].includes(d)))
        alerts.push({ icon: 'stomach', color: '#32ADE6', title: 'GASTRITE / REFLUXO', body: 'Sem café em jejum · Refeições menores · Pouca gordura no pré-treino' });
    if (dig.some(d => d.includes('Intestino Preso')))
        alerts.push({ icon: 'leaf', color: '#32ADE6', title: 'CONSTIPAÇÃO', body: 'Aumentar fibras: aveia, chia, vegetais' });
    if (dig.some(d => d.includes('Intestino Solto')))
        alerts.push({ icon: 'water', color: '#32ADE6', title: 'SII', body: 'Fibras solúveis: aveia, cenoura, banana · Cuidado com lactose' });

    // Comportamento
    if (anamnese.nightBinge && !['never', 'rarely'].includes(anamnese.nightBinge))
        alerts.push({ icon: 'moon-waning-crescent', color: '#AF52DE', title: 'COMPULSÃO NOTURNA', body: 'Incluir ceia: proteína + gordura boa (cottage + pasta amendoim)' });
    if ((anamnese.stressLevel ?? 0) >= 4 || anamnese.stressEating)
        alerts.push({ icon: 'lightning-bolt', color: '#AF52DE', title: 'STRESS ALIMENTAR', body: '1 doce controlado no jantar (chocolate 70% ou paçoca)' });

    // TPM
    const pms = anamnese.pmsSymptoms ?? [];
    if (pms.includes('Compulsão Alimentar Forte') || pms.includes('Vontade de Doce'))
        alerts.push({ icon: 'calendar-heart', color: '#FF2D55', title: 'TPM', body: '+20g carbo na fase pré-menstrual · 1 doce planejado' });

    return alerts;
}

// ─── HORÁRIOS DA ROTINA ────────────────────────────────────────────────────────
function buildScheduleItems(anamnese) {
    if (!anamnese) return [];
    const items = [];
    if (anamnese.wakeUpTime)  items.push({ icon: 'weather-sunny',    label: 'Acorda',         value: anamnese.wakeUpTime });
    if (anamnese.trainTime)   items.push({ icon: 'dumbbell',         label: 'Treino',          value: anamnese.trainTime });
    if (anamnese.workTimeStart && anamnese.workTimeEnd)
        items.push({ icon: 'briefcase-outline', label: 'Trabalho', value: `${anamnese.workTimeStart} às ${anamnese.workTimeEnd}` });
    if (anamnese.sleepTime)   items.push({ icon: 'weather-night',    label: 'Dorme',           value: anamnese.sleepTime });
    if (anamnese.mealsPerDay) items.push({ icon: 'silverware-fork-knife', label: 'Refeições/dia', value: `${anamnese.mealsPerDay}x` });
    return items;
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function DietContextPanel({
    theme,
    anamnese,
    aluno,
    activeDayType,
    currentMacros,   // { kcal, prot, carb, fat } — calculado em tempo real pelo useDietActions
    macroTargets,    // { kcal, prot, carb, fat } — vindos do macroPlanner para o dayType ativo
    visibleMeals,
}) {
    const softBg  = theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    const cardBg  = theme.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF';

    const objetivo  = anamnese?.objetivo ?? '—';
    const frequencia = anamnese?.frequencia ?? '?';
    const isHomem   = (aluno?.gender ?? anamnese?.gender ?? '').toLowerCase().includes('masc');

    // Calcula estimativa de déficit/superávit semanal
    const plan = useMemo(() => {
        if (!anamnese) return null;
        try { return calcWeeklyPlan(anamnese, aluno?.birthDate, aluno?.gender); }
        catch { return null; }
    }, [anamnese, aluno]);

    const tdee           = plan?.tdee ?? 0;
    const kcalMeta       = macroTargets?.kcal ?? 0;
    const deltaKcal      = kcalMeta - tdee;
    const isDeficit      = deltaKcal <= 0;
    const kgSemana       = tdee > 0 ? Math.abs(deltaKcal * 7 / 7700).toFixed(2) : '—';

    const clinicalAlerts = useMemo(() => buildClinicalAlerts(anamnese, visibleMeals), [anamnese, visibleMeals]);
    const scheduleItems  = useMemo(() => buildScheduleItems(anamnese), [anamnese]);

    const DAY_LABEL = {
        TREINO: 'Treino de Força', TREINO_CARDIO: 'Treino + Cardio',
        CARDIO: 'Só Cardio',       DESCANSO: 'Descanso',
    };
    const DAY_COLOR = {
        TREINO: '#32ADE6', TREINO_CARDIO: '#FF9500',
        CARDIO: '#FF3B30', DESCANSO: '#34C759',
    };
    const dayColor = DAY_COLOR[activeDayType] ?? theme.accent;

    return (
        <View style={[p.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* ── CABEÇALHO DO DIA ─────────────────────────────────────── */}
                <View style={[p.dayBadge, { backgroundColor: dayColor + '18', borderColor: dayColor + '50' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[p.dayLabel, { color: dayColor }]}>{DAY_LABEL[activeDayType]}</Text>
                        <Text style={[p.alunoName, { color: theme.textSecondary }]}>{aluno?.name?.split(' ')[0] ?? '—'}</Text>
                    </View>
                    <View style={[p.objetivoPill, { backgroundColor: dayColor + '30' }]}>
                        <Text style={[p.objetivoText, { color: dayColor }]}>{objetivo}</Text>
                    </View>
                </View>

                {/* ── RESUMO RÁPIDO ─────────────────────────────────────────── */}
                <View style={[p.resumoRow, { backgroundColor: softBg, borderColor: theme.border }]}>
                    <View style={p.resumoItem}>
                        <Text style={[p.resumoVal, { color: theme.text }]}>{frequencia}x</Text>
                        <Text style={[p.resumoLbl, { color: theme.textSecondary }]}>TREINOS/SEM</Text>
                    </View>
                    <View style={[p.resumoDivider, { backgroundColor: theme.border }]} />
                    <View style={p.resumoItem}>
                        <Text style={[p.resumoVal, { color: theme.text }]}>{tdee}</Text>
                        <Text style={[p.resumoLbl, { color: theme.textSecondary }]}>TDEE</Text>
                    </View>
                    <View style={[p.resumoDivider, { backgroundColor: theme.border }]} />
                    <View style={p.resumoItem}>
                        <Text style={[p.resumoVal, { color: isDeficit ? '#34C759' : '#FF9500' }]}>
                            {isDeficit ? '-' : '+'}{kgSemana}kg
                        </Text>
                        <Text style={[p.resumoLbl, { color: theme.textSecondary }]}>
                            {isDeficit ? 'PERDA/SEM' : 'GANHO/SEM'}
                        </Text>
                    </View>
                </View>

                {/* ── MACROS EM TEMPO REAL ──────────────────────────────────── */}
                <SectionTitle icon="chart-bar" label="MACROS DO DIA" theme={theme} />
                <View style={[p.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
                    <MacroRow label="KCAL"  current={currentMacros?.kcal ?? 0} target={macroTargets?.kcal ?? 0} unit=" kcal" color="#FFCC00" theme={theme} />
                    <MacroRow label="PROT"  current={currentMacros?.prot ?? 0} target={macroTargets?.prot ?? 0} unit="g"     color="#32ADE6" theme={theme} />
                    <MacroRow label="CARBO" current={currentMacros?.carb ?? 0} target={macroTargets?.carb ?? 0} unit="g"     color="#FF9500" theme={theme} />
                    <MacroRow label="GORD"  current={currentMacros?.fat  ?? 0} target={macroTargets?.fat  ?? 0} unit="g"     color="#AF52DE" theme={theme} />
                </View>

                {/* ── HORÁRIOS ──────────────────────────────────────────────── */}
                {scheduleItems.length > 0 && <>
                    <SectionTitle icon="clock-outline" label="ROTINA DO ALUNO" theme={theme} />
                    <View style={[p.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
                        {scheduleItems.map((item, i) => (
                            <View key={i} style={[p.scheduleRow,
                                i < scheduleItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
                            ]}>
                                <MaterialCommunityIcons name={item.icon} size={14} color={theme.accent} />
                                <Text style={[p.scheduleLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                                <Text style={[p.scheduleValue, { color: theme.text }]}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                </>}

                {/* ── ALERTAS CLÍNICOS ──────────────────────────────────────── */}
                {clinicalAlerts.length > 0 && <>
                    <SectionTitle icon="alert-circle-outline" label="ALERTAS CLÍNICOS" theme={theme} />
                    {clinicalAlerts.map((alert, i) => (
                        <AlertCard key={i} {...alert} theme={theme} />
                    ))}
                </>}

                {/* ── SEM ALERTAS ───────────────────────────────────────────── */}
                {clinicalAlerts.length === 0 && (
                    <View style={[p.alertCard, { backgroundColor: '#34C75912', borderColor: '#34C75940' }]}>
                        <MaterialCommunityIcons name="check-circle" size={14} color="#34C759" />
                        <Text style={[p.alertTitle, { color: '#34C759' }]}>SEM RESTRIÇÕES CLÍNICAS</Text>
                    </View>
                )}

                {/* ── PREFERÊNCIAS ──────────────────────────────────────────── */}
                {(anamnese?.allergies || anamnese?.foodAversions || anamnese?.foodPreferences) && <>
                    <SectionTitle icon="food-apple-outline" label="PREFERÊNCIAS" theme={theme} />
                    <View style={[p.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
                        {anamnese?.allergies?.trim() && anamnese.allergies !== 'Nenhuma' && (
                            <View style={p.prefRow}>
                                <MaterialCommunityIcons name="close-circle-outline" size={13} color="#FF3B30" />
                                <Text style={[p.prefLabel, { color: theme.textSecondary }]}>Alergias:</Text>
                                <Text style={[p.prefValue, { color: theme.text }]} numberOfLines={2}>{anamnese.allergies}</Text>
                            </View>
                        )}
                        {anamnese?.foodAversions?.trim() && anamnese.foodAversions !== 'Nada' && (
                            <View style={p.prefRow}>
                                <MaterialCommunityIcons name="thumb-down-outline" size={13} color="#FF9500" />
                                <Text style={[p.prefLabel, { color: theme.textSecondary }]}>Odeia:</Text>
                                <Text style={[p.prefValue, { color: theme.text }]} numberOfLines={2}>{anamnese.foodAversions}</Text>
                            </View>
                        )}
                        {anamnese?.foodPreferences?.trim() && (
                            <View style={p.prefRow}>
                                <MaterialCommunityIcons name="thumb-up-outline" size={13} color="#34C759" />
                                <Text style={[p.prefLabel, { color: theme.textSecondary }]}>Prefere:</Text>
                                <Text style={[p.prefValue, { color: theme.text }]} numberOfLines={2}>{anamnese.foodPreferences}</Text>
                            </View>
                        )}
                    </View>
                </>}

            </ScrollView>
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const p = StyleSheet.create({
    panel:         { width: 260, borderLeftWidth: 1, paddingHorizontal: 14, paddingTop: 16 },
    dayBadge:      { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },
    dayLabel:      { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    alunoName:     { fontSize: 11, fontWeight: '700', marginTop: 2 },
    objetivoPill:  { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    objetivoText:  { fontSize: 10, fontWeight: '900' },
    resumoRow:     { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 14 },
    resumoItem:    { flex: 1, alignItems: 'center' },
    resumoVal:     { fontSize: 13, fontWeight: '900' },
    resumoLbl:     { fontSize: 8, fontWeight: '800', marginTop: 2, letterSpacing: 0.3 },
    resumoDivider: { width: 1, marginHorizontal: 4 },
    sectionTitle:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 8, marginBottom: 8, borderBottomWidth: 1 },
    sectionTitleText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
    card:          { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 14 },
    rowBetween:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    macroLabel:    { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    macroValue:    { fontSize: 12, fontWeight: '900' },
    macroPct:      { fontSize: 10, fontWeight: '700' },
    macroTarget:   { fontSize: 9, fontWeight: '600', marginTop: 2 },
    alertCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    alertTitle:    { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
    alertBody:     { fontSize: 10, fontWeight: '600', lineHeight: 14 },
    scheduleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
    scheduleLabel: { fontSize: 10, fontWeight: '800', flex: 1 },
    scheduleValue: { fontSize: 12, fontWeight: '900' },
    prefRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingVertical: 6, flexWrap: 'wrap' },
    prefLabel:     { fontSize: 10, fontWeight: '800' },
    prefValue:     { fontSize: 10, fontWeight: '600', flex: 1 },
});

const pb = StyleSheet.create({
    track: { height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
    fill:  { height: 5, borderRadius: 3 },
});