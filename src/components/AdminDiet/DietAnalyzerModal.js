// src/components/AdminDiet/DietAnalyzerModal.js
// Analisador de dieta com IA — por refeição individual e por aba completa
// Fluxo: analisa → mostra diagnóstico + refeição reescrita → aprova ou ignora
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    ScrollView, ActivityIndicator, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'https://fitos-final.onrender.com';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function buildMealSummary(meal, toGrams) {
    if (!meal?.items?.length) return 'Refeição vazia.';
    return meal.items.map(item => {
        const g = toGrams ? toGrams(item) : item.amount;
        return `${item.name} (${g}g)`;
    }).join(', ');
}

function buildDaySummary(meals, toGrams) {
    return meals.map((meal, i) =>
        `${i + 1}. ${meal.time} — ${meal.name}: ${buildMealSummary(meal, toGrams)}`
    ).join('\n');
}

function buildAnamneseSummary(anamnese) {
    if (!anamnese) return 'Sem anamnese.';
    const cond   = (anamnese.healthConditions ?? []).filter(c => c !== 'Nenhuma').join(', ') || 'Nenhuma';
    const dig    = (anamnese.digestiveIssues  ?? []).filter(d => d !== 'Nenhum').join(', ')  || 'Nenhum';
    const alergs = anamnese.allergies || 'Nenhuma';
    const avers  = anamnese.foodAversions || 'Nenhuma';
    const prefs  = anamnese.foodPreferences || 'Não informado';
    return [
        `Objetivo: ${anamnese.objetivo ?? '?'} | Peso: ${anamnese.peso ?? '?'}kg | Altura: ${anamnese.altura ?? '?'}cm`,
        `Treino: ${anamnese.frequencia ?? '?'}x/sem às ${anamnese.trainTime ?? '?'} | Jejum: ${anamnese.trainFasted ? 'Sim' : 'Não'}`,
        `Acorda: ${anamnese.wakeUpTime ?? '?'} | Dorme: ${anamnese.sleepTime ?? '?'}`,
        `Condições: ${cond} | Digestivo: ${dig}`,
        `Alergias: ${alergs} | Aversões: ${avers}`,
        `Preferências: ${prefs}`,
        `Orçamento: ${anamnese.budget ?? 'não informado'}`,
        `Bariátrica: ${anamnese.bariatric ? `Sim (${anamnese.bariatricType}, ${anamnese.bariatricTime})` : 'Não'}`,
    ].join('\n');
}

// ─── PROMPT: ANÁLISE DE REFEIÇÃO INDIVIDUAL ───────────────────────────────────
function buildMealPrompt(meal, anamnese, macroTargets, dayType) {
    const mealSummary = buildMealSummary(meal, null);
    const anamneseSummary = buildAnamneseSummary(anamnese);
    const metaStr = macroTargets
        ? `Metas do dia: ${macroTargets.kcal}kcal | Prot ${macroTargets.prot}g | Carbo ${macroTargets.carb}g | Gord ${macroTargets.fat}g`
        : 'Metas não disponíveis.';

    return `Você é o nutricionista assistente do Coach Paulo Adriano (PA TEAM ELITE).

ANAMNESE DA ALUNA:
${anamneseSummary}

${metaStr}
Tipo de dia: ${dayType}

REFEIÇÃO A ANALISAR:
Horário: ${meal.time} — ${meal.name}
Itens: ${mealSummary}

Analise esta refeição considerando:
1. Se os alimentos são adequados para o horário (ex: arroz no café da manhã é inadequado)
2. Se respeita as restrições clínicas da aluna
3. Se a combinação faz sentido nutricional para o objetivo e o slot do dia
4. Se há alimentos que a aluna não gosta ou é alérgica

Retorne APENAS este JSON, sem markdown:
{
  "score": 85,
  "status": "bom",
  "diagnostico": "Texto curto explicando o que está certo e o que precisa melhorar (máx 2 frases)",
  "alertas": ["alerta 1 se houver", "alerta 2 se houver"],
  "refeicao_reescrita": {
    "name": "${meal.name}",
    "time": "${meal.time}",
    "notes": "Observação prática e motivadora para o aluno",
    "itens_texto": ["Frango grelhado 150g", "Batata doce cozida 120g", "Brócolis à vontade"]
  }
}

"status" deve ser: "otimo" (score 90+), "bom" (70-89), "atencao" (50-69), "problema" (abaixo de 50).
Se a refeição estiver boa, mantenha os itens_texto similares com pequenos ajustes de quantidade.
Se precisar mudar, sugira alimentos reais e práticos para o contexto brasileiro.`;
}

// ─── PROMPT: ANÁLISE DA ABA COMPLETA ─────────────────────────────────────────
function buildDayPrompt(meals, anamnese, macroTargets, currentMacros, dayType) {
    const daySummary      = buildDaySummary(meals, null);
    const anamneseSummary = buildAnamneseSummary(anamnese);
    const metaStr = macroTargets
        ? `Metas: ${macroTargets.kcal}kcal | Prot ${macroTargets.prot}g | Carbo ${macroTargets.carb}g | Gord ${macroTargets.fat}g`
        : '';
    const atualStr = currentMacros
        ? `Atual: ${currentMacros.kcal}kcal | Prot ${currentMacros.prot}g | Carbo ${currentMacros.carb}g | Gord ${currentMacros.fat}g`
        : '';

    return `Você é o nutricionista assistente do Coach Paulo Adriano (PA TEAM ELITE).

ANAMNESE DA ALUNA:
${anamneseSummary}

${metaStr}
${atualStr}
Tipo de dia: ${dayType}

DIETA MONTADA (${meals.length} refeições):
${daySummary}

Analise o plano do dia completo considerando:
1. Distribuição de macros ao longo do dia (carbo maior pós-treino, menor à noite)
2. Adequação dos alimentos ao horário de cada refeição
3. Respeito às restrições clínicas e preferências da aluna
4. Distribuição calórica entre as refeições
5. Presença de proteína em cada refeição
6. Adequação de fibras e vegetais

Retorne APENAS este JSON, sem markdown:
{
  "score_geral": 82,
  "status_geral": "bom",
  "resumo": "Texto curto do diagnóstico geral (máx 2 frases)",
  "pontos_positivos": ["ponto 1", "ponto 2"],
  "alertas_gerais": ["alerta 1 se houver"],
  "analise_por_refeicao": [
    {
      "index": 0,
      "name": "nome da refeição",
      "time": "HH:MM",
      "status": "otimo",
      "comentario": "Comentário específico desta refeição (1 frase)"
    }
  ]
}

"status_geral" e "status" de cada refeição: "otimo" (90+), "bom" (70-89), "atencao" (50-69), "problema" (<50).`;
}

// ─── CHAMAR API CLAUDE ────────────────────────────────────────────────────────
async function callAnalyzer(prompt) {
    const res = await fetch(`${API_URL}/api/ai/analyzer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const data = await res.json();
    return data.result;
}

// ─── BADGE DE STATUS ──────────────────────────────────────────────────────────
function StatusBadge({ status, score, theme }) {
    const map = {
        otimo:    { color: '#34C759', icon: 'check-circle',      label: 'ÓTIMO'    },
        bom:      { color: '#32ADE6', icon: 'thumb-up',          label: 'BOM'      },
        atencao:  { color: '#FF9500', icon: 'alert-circle',      label: 'ATENÇÃO'  },
        problema: { color: '#FF3B30', icon: 'close-circle',      label: 'PROBLEMA' },
    };
    const cfg = map[status] ?? map['bom'];
    return (
        <View style={[sb.badge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '50' }]}>
            <MaterialCommunityIcons name={cfg.icon} size={16} color={cfg.color} />
            <Text style={[sb.label, { color: cfg.color }]}>{cfg.label}</Text>
            {score != null && <Text style={[sb.score, { color: cfg.color }]}>{score}/100</Text>}
        </View>
    );
}

// ─── MODAL ANÁLISE REFEIÇÃO INDIVIDUAL ───────────────────────────────────────
export function MealAnalyzerModal({
    visible, onClose, onApprove,
    meal, anamnese, macroTargets, dayType,
    theme,
}) {
    const [loading,  setLoading]  = useState(false);
    const [result,   setResult]   = useState(null);
    const [error,    setError]    = useState('');

    const analyze = useCallback(async () => {
        if (!meal) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const prompt = buildMealPrompt(meal, anamnese, macroTargets, dayType);
            const raw    = await callAnalyzer(prompt);
            const clean  = raw.replace(/```json\n?|\n?```/g, '').trim();
            setResult(JSON.parse(clean));
        } catch (e) {
            setError('Erro ao analisar. Verifique a conexão e tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [meal, anamnese, macroTargets, dayType]);

    // Dispara análise ao abrir
    React.useEffect(() => {
        if (visible && meal) analyze();
    }, [visible, meal]);

    const softBg = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={m.backdrop}>
                <View style={[m.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={[m.handle, { backgroundColor: theme.border }]} />

                    {/* HEADER */}
                    <View style={m.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[m.title, { color: theme.text }]}>ANÁLISE DE REFEIÇÃO</Text>
                            <Text style={[m.subtitle, { color: theme.textSecondary }]}>
                                {meal?.time} — {meal?.name}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[m.closeBtn, { backgroundColor: softBg }]}>
                            <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

                        {/* LOADING */}
                        {loading && (
                            <View style={m.loadingBox}>
                                <ActivityIndicator size="large" color={theme.accent} />
                                <Text style={[m.loadingText, { color: theme.textSecondary }]}>
                                    Analisando com IA...
                                </Text>
                            </View>
                        )}

                        {/* ERRO */}
                        {!!error && (
                            <View style={[m.errorBox, { backgroundColor: '#FF3B3012', borderColor: '#FF3B3040' }]}>
                                <MaterialCommunityIcons name="alert-circle" size={20} color="#FF3B30" />
                                <Text style={{ color: '#FF3B30', fontSize: 13, flex: 1 }}>{error}</Text>
                            </View>
                        )}

                        {/* RESULTADO */}
                        {result && !loading && (
                            <View style={{ paddingBottom: 24 }}>
                                {/* STATUS GERAL */}
                                <StatusBadge status={result.status} score={result.score} theme={theme} />

                                {/* DIAGNÓSTICO */}
                                <View style={[m.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <Text style={[m.cardTitle, { color: theme.textSecondary }]}>DIAGNÓSTICO</Text>
                                    <Text style={[m.cardBody, { color: theme.text }]}>{result.diagnostico}</Text>
                                </View>

                                {/* ALERTAS */}
                                {result.alertas?.length > 0 && (
                                    <View style={[m.card, { backgroundColor: '#FF950012', borderColor: '#FF950040' }]}>
                                        <Text style={[m.cardTitle, { color: '#FF9500' }]}>⚠️ ALERTAS</Text>
                                        {result.alertas.map((a, i) => (
                                            <View key={i} style={m.bulletRow}>
                                                <MaterialCommunityIcons name="circle-small" size={18} color="#FF9500" />
                                                <Text style={[m.bulletText, { color: theme.text }]}>{a}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* REFEIÇÃO REESCRITA */}
                                {result.refeicao_reescrita && (
                                    <View style={[m.card, { backgroundColor: theme.surface, borderColor: theme.accent + '60' }]}>
                                        <Text style={[m.cardTitle, { color: theme.accent }]}>
                                            🍽️ REFEIÇÃO SUGERIDA PELA IA
                                        </Text>
                                        {result.refeicao_reescrita.itens_texto?.map((item, i) => (
                                            <View key={i} style={m.bulletRow}>
                                                <MaterialCommunityIcons name="check" size={14} color={theme.accent} />
                                                <Text style={[m.bulletText, { color: theme.text }]}>{item}</Text>
                                            </View>
                                        ))}
                                        {result.refeicao_reescrita.notes && (
                                            <Text style={[m.notesText, { color: theme.textSecondary, borderTopColor: theme.border }]}>
                                                💬 {result.refeicao_reescrita.notes}
                                            </Text>
                                        )}
                                    </View>
                                )}

                                {/* AVISO SOBRE APLICAR */}
                                <View style={[m.infoBox, { backgroundColor: softBg, borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="information-outline" size={14} color={theme.textSecondary} />
                                    <Text style={[m.infoText, { color: theme.textSecondary }]}>
                                        Ao aprovar, a observação da refeição será atualizada com a sugestão da IA. Os alimentos você ajusta manualmente no catálogo.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* BOTÕES */}
                    {result && !loading && (
                        <View style={m.footerBtns}>
                            <TouchableOpacity
                                style={[m.btn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                                onPress={onClose}
                            >
                                <Text style={[m.btnText, { color: theme.text }]}>IGNORAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[m.btn, { backgroundColor: theme.accent, flex: 2 }]}
                                onPress={() => {
                                    if (result.refeicao_reescrita) onApprove(result.refeicao_reescrita);
                                    onClose();
                                }}
                            >
                                <MaterialCommunityIcons name="check-circle" size={18} color="#000" />
                                <Text style={[m.btnText, { color: '#000' }]}>APROVAR SUGESTÃO</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* RE-ANALISAR */}
                    {!loading && (
                        <TouchableOpacity style={m.reanalyzeBtn} onPress={analyze}>
                            <MaterialCommunityIcons name="refresh" size={14} color={theme.textSecondary} />
                            <Text style={[m.reanalyzeText, { color: theme.textSecondary }]}>Re-analisar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

// ─── MODAL ANÁLISE DA ABA COMPLETA ───────────────────────────────────────────
export function DayAnalyzerModal({
    visible, onClose, onAnalyzeMeal,
    meals, anamnese, macroTargets, currentMacros, dayType,
    theme,
}) {
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [error,   setError]   = useState('');

    const analyze = useCallback(async () => {
        if (!meals?.length) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const prompt = buildDayPrompt(meals, anamnese, macroTargets, currentMacros, dayType);
            const raw    = await callAnalyzer(prompt);
            const clean  = raw.replace(/```json\n?|\n?```/g, '').trim();
            setResult(JSON.parse(clean));
        } catch (e) {
            setError('Erro ao analisar. Verifique a conexão e tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [meals, anamnese, macroTargets, currentMacros, dayType]);

    React.useEffect(() => {
        if (visible && meals?.length) analyze();
    }, [visible]);

    const softBg = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

    const STATUS_COLOR = {
        otimo: '#34C759', bom: '#32ADE6', atencao: '#FF9500', problema: '#FF3B30',
    };
    const STATUS_ICON = {
        otimo: 'check-circle', bom: 'thumb-up', atencao: 'alert-circle', problema: 'close-circle',
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={m.backdrop}>
                <View style={[m.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={[m.handle, { backgroundColor: theme.border }]} />

                    {/* HEADER */}
                    <View style={m.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[m.title, { color: theme.text }]}>ANÁLISE DO DIA</Text>
                            <Text style={[m.subtitle, { color: theme.textSecondary }]}>
                                {dayType} · {meals?.length} refeições
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[m.closeBtn, { backgroundColor: softBg }]}>
                            <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

                        {loading && (
                            <View style={m.loadingBox}>
                                <ActivityIndicator size="large" color={theme.accent} />
                                <Text style={[m.loadingText, { color: theme.textSecondary }]}>
                                    Analisando o dia completo...
                                </Text>
                            </View>
                        )}

                        {!!error && (
                            <View style={[m.errorBox, { backgroundColor: '#FF3B3012', borderColor: '#FF3B3040' }]}>
                                <MaterialCommunityIcons name="alert-circle" size={20} color="#FF3B30" />
                                <Text style={{ color: '#FF3B30', fontSize: 13, flex: 1 }}>{error}</Text>
                            </View>
                        )}

                        {result && !loading && (
                            <View style={{ paddingBottom: 24 }}>
                                {/* SCORE GERAL */}
                                <StatusBadge status={result.status_geral} score={result.score_geral} theme={theme} />

                                {/* RESUMO */}
                                <View style={[m.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <Text style={[m.cardTitle, { color: theme.textSecondary }]}>DIAGNÓSTICO GERAL</Text>
                                    <Text style={[m.cardBody, { color: theme.text }]}>{result.resumo}</Text>
                                </View>

                                {/* PONTOS POSITIVOS */}
                                {result.pontos_positivos?.length > 0 && (
                                    <View style={[m.card, { backgroundColor: '#34C75912', borderColor: '#34C75940' }]}>
                                        <Text style={[m.cardTitle, { color: '#34C759' }]}>✅ PONTOS POSITIVOS</Text>
                                        {result.pontos_positivos.map((p, i) => (
                                            <View key={i} style={m.bulletRow}>
                                                <MaterialCommunityIcons name="check-circle" size={14} color="#34C759" />
                                                <Text style={[m.bulletText, { color: theme.text }]}>{p}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* ALERTAS GERAIS */}
                                {result.alertas_gerais?.length > 0 && (
                                    <View style={[m.card, { backgroundColor: '#FF950012', borderColor: '#FF950040' }]}>
                                        <Text style={[m.cardTitle, { color: '#FF9500' }]}>⚠️ ALERTAS</Text>
                                        {result.alertas_gerais.map((a, i) => (
                                            <View key={i} style={m.bulletRow}>
                                                <MaterialCommunityIcons name="circle-small" size={18} color="#FF9500" />
                                                <Text style={[m.bulletText, { color: theme.text }]}>{a}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* ANÁLISE POR REFEIÇÃO */}
                                <Text style={[m.sectionLabel, { color: theme.textSecondary, marginTop: 8 }]}>
                                    ANÁLISE POR REFEIÇÃO
                                </Text>
                                {result.analise_por_refeicao?.map((item, i) => {
                                    const color = STATUS_COLOR[item.status] ?? '#32ADE6';
                                    const icon  = STATUS_ICON[item.status]  ?? 'information';
                                    const meal  = meals[item.index] ?? meals[i];
                                    return (
                                        <View key={i} style={[m.mealRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={[m.mealStatusDot, { backgroundColor: color }]} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[m.mealRowName, { color: theme.text }]}>
                                                    {item.time} — {item.name}
                                                </Text>
                                                <Text style={[m.mealRowComment, { color: theme.textSecondary }]}>
                                                    {item.comentario}
                                                </Text>
                                            </View>
                                            {/* Botão reescrever refeição individual */}
                                            {(item.status === 'atencao' || item.status === 'problema') && meal && (
                                                <TouchableOpacity
                                                    style={[m.rewriteBtn, { backgroundColor: color + '20', borderColor: color + '60' }]}
                                                    onPress={() => { onClose(); onAnalyzeMeal(meal); }}
                                                >
                                                    <MaterialCommunityIcons name="pencil-outline" size={14} color={color} />
                                                    <Text style={[m.rewriteBtnText, { color }]}>Reescrever</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>

                    {!loading && (
                        <TouchableOpacity style={m.reanalyzeBtn} onPress={analyze}>
                            <MaterialCommunityIcons name="refresh" size={14} color={theme.textSecondary} />
                            <Text style={[m.reanalyzeText, { color: theme.textSecondary }]}>Re-analisar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const sb = StyleSheet.create({
    badge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    score: { fontSize: 11, fontWeight: '700' },
});

const m = StyleSheet.create({
    backdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    sheet:         { maxHeight: '90%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    handle:        { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
    headerRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    title:         { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
    subtitle:      { fontSize: 12, fontWeight: '700', marginTop: 3 },
    closeBtn:      { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    loadingBox:    { alignItems: 'center', padding: 48, gap: 16 },
    loadingText:   { fontSize: 14, fontWeight: '700' },
    errorBox:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
    card:          { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
    cardTitle:     { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 8 },
    cardBody:      { fontSize: 13, fontWeight: '600', lineHeight: 20 },
    bulletRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
    bulletText:    { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
    notesText:     { fontSize: 12, fontStyle: 'italic', marginTop: 10, paddingTop: 10, borderTopWidth: 1, lineHeight: 18 },
    infoBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    infoText:      { fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 16 },
    footerBtns:    { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 4 },
    btn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16 },
    btnText:       { fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
    reanalyzeBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
    reanalyzeText: { fontSize: 11, fontWeight: '700' },
    sectionLabel:  { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 10 },
    mealRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
    mealStatusDot: { width: 8, height: 8, borderRadius: 4 },
    mealRowName:   { fontSize: 12, fontWeight: '900' },
    mealRowComment:{ fontSize: 11, fontWeight: '600', marginTop: 2, lineHeight: 16 },
    rewriteBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    rewriteBtnText:{ fontSize: 10, fontWeight: '900' },
});