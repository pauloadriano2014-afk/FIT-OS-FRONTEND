// src/components/AdminDiet/DietBuilderModal.js — v2
// Assistente de montagem manual de dietas
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, FlatList, TextInput, ActivityIndicator,
    Platform, useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calcWeeklyPlan } from '../../utils/macroPlanner';

const BASE_URL = 'https://fitos-final.onrender.com';

const MC = { kcal:'#FFCC00', p:'#32ADE6', c:'#FF9500', f:'#AF52DE' };

const SLOT_ICONS = {
    'Café da Manhã':'coffee', 'Lanche da Manhã':'food-apple', 'Almoço':'silverware-fork-knife',
    'Lanche da Tarde':'food-croissant', 'Pré-Treino':'lightning-bolt',
    'Pré-Treino Rápido':'lightning-bolt', 'Pós-Treino':'arm-flex',
    'Jantar':'weather-night', 'Ceia':'moon-waning-crescent',
    'Ceia Pré-Treino':'moon-waning-crescent',
    'Quebra do Jejum (Pós-Treino)':'arm-flex',
};

const CATEGORIES = [
    'Todas','Carboidratos','Carnes e Proteínas','Frios e Laticínios',
    'Vegetais e Legumes','Frutas','Gorduras e Oleaginosas',
    'Suplementos','Bebidas','Outros',
];

// Unidades disponíveis por alimento
const UNIT_OPTIONS = [
    { label:'g',        value:'g'   },
    { label:'ml',       value:'ml'  },
    { label:'unid.',    value:'un'  },
    { label:'col. sopa',value:'col_sopa'  },
    { label:'col. chá', value:'col_cha'   },
    { label:'fatia',    value:'fatia'     },
    { label:'xícara',   value:'xicara'   },
    { label:'punhado',  value:'punhado'  },
];

// Fatores de conversão para gramas/ml
const UNIT_FACTORS = {
    g: 1, ml: 1, un: 100,
    col_sopa: 15, col_cha: 5,
    fatia: 30, xicara: 240, punhado: 30,
};

// ─── UTILITÁRIOS DE TEMPO ─────────────────────────────────────────────────────
const toMin  = (t) => { if (!t || !t.includes(':')) return 0; const [h,m] = t.split(':').map(Number); return h*60+m; };
const toTime = (m) => { const total=((m%1440)+1440)%1440; return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`; };
const roundQ = (m) => toTime(Math.round(m/15)*15);

// ─── CONSTRUTOR DE AGENDA ─────────────────────────────────────────────────────
function buildSchedule(anamnese, dayType) {
    const wake  = anamnese.wakeUpTime  || '07:00';
    const sleep = anamnese.sleepTime   || '23:00';
    const train = anamnese.trainTime   || '18:00';
    const num   = Math.min(8, Math.max(2, Number(anamnese.mealsPerDay) || 5));

    const wakeMin  = toMin(wake);
    const sleepMin = toMin(sleep);
    const trainMin = toMin(train);
    const window   = sleepMin > wakeMin ? sleepMin - wakeMin : (1440 - wakeMin + sleepMin);

    if (dayType === 'DESCANSO') {
        const interval = Math.floor(window / Math.max(num - 1, 1));
        const names = ['Café da Manhã','Lanche da Manhã','Almoço','Lanche da Tarde','Jantar','Ceia','Lanche Extra 1','Lanche Extra 2'];
        return names.slice(0, num).map((name, i) => ({
            name, time: roundQ(wakeMin + interval * i),
            carbPriority: name === 'Almoço' ? 'high' : name.includes('Café') ? 'medium' : 'low',
            protPriority: ['Almoço','Jantar'].includes(name) ? 'high' : 'medium',
        }));
    }

    const slots = [];
    const used  = new Set();
    const minsTillTrain = ((trainMin - wakeMin) + 1440) % 1440;

    // Pré-treino
    if (minsTillTrain >= 60 && !anamnese.trainFasted) {
        const t = roundQ(trainMin - 70);
        slots.push({ name:'Pré-Treino', time:t, carbPriority:'high', protPriority:'medium', role:'preworkout' });
        used.add(t);
    } else if (!anamnese.trainFasted) {
        const t = roundQ(trainMin - 20);
        slots.push({ name:'Pré-Treino Rápido', time:t, carbPriority:'high', protPriority:'low', role:'preworkout' });
        used.add(t);
    }

    // Pós-treino
    const posTime = roundQ(trainMin + 45);
    slots.push({ name:'Pós-Treino', time:posTime, carbPriority:'high', protPriority:'high', role:'postworkout' });
    used.add(posTime);

    // Slots restantes distribuídos pela janela do dia
    const mainDefs = [
        { name:'Café da Manhã',   offset:0,    carbP:'medium', protP:'medium' },
        { name:'Lanche da Manhã', offset:0.2,  carbP:'medium', protP:'low'    },
        { name:'Almoço',          offset:0.4,  carbP:'high',   protP:'high'   },
        { name:'Lanche da Tarde', offset:0.6,  carbP:'low',    protP:'medium' },
        { name:'Jantar',          offset:0.8,  carbP:'low',    protP:'high'   },
        { name:'Ceia',            offset:0.95, carbP:'low',    protP:'medium' },
    ];

    const remaining = num - slots.length;
    mainDefs.slice(0, Math.max(remaining, 0)).forEach(def => {
        let ideal = wakeMin + Math.round(window * def.offset);
        let attempts = 0;
        while (attempts < 40) {
            const t       = roundQ(ideal);
            const conflict = [...used].some(u => Math.abs(toMin(u) - toMin(t)) < 75);
            if (!conflict) {
                slots.push({ name:def.name, time:t, carbPriority:def.carbP, protPriority:def.protP });
                used.add(t);
                break;
            }
            ideal += 15; attempts++;
        }
    });

    return slots.sort((a, b) => toMin(a.time) - toMin(b.time));
}

// ─── DISTRIBUI MACROS POR SLOT ────────────────────────────────────────────────
function distributeMacros(slots, totalMacros) {
    if (!slots.length) return [];
    const n = slots.length;
    const highCarbN = Math.max(slots.filter(s => s.carbPriority === 'high').length, 1);
    const medCarbN  = Math.max(slots.filter(s => s.carbPriority === 'medium').length, 1);
    const lowCarbN  = Math.max(slots.filter(s => s.carbPriority === 'low').length, 1);
    const highProtN = Math.max(slots.filter(s => s.protPriority === 'high').length, 1);
    const lowProtN  = Math.max(slots.filter(s => s.protPriority !== 'high').length, 1);

    return slots.map(s => {
        const carbShare = s.carbPriority === 'high'   ? 0.60 / highCarbN :
                          s.carbPriority === 'medium' ? 0.28 / medCarbN  :
                                                        0.12 / lowCarbN;
        const protShare = s.protPriority === 'high' ? 0.50 / highProtN : 0.50 / lowProtN;
        const c    = Math.round(totalMacros.carb * carbShare);
        const p    = Math.round(totalMacros.prot * protShare);
        const f    = Math.round(totalMacros.fat  / n);
        const kcal = Math.round(p * 4 + c * 4 + f * 9);
        return { ...s, target: { kcal, p, c, f } };
    });
}

// ─── CALCULA MACROS DE UM SLOT ────────────────────────────────────────────────
function calcSlotMacros(items) {
    return items.reduce((acc, item) => {
        const factor = (UNIT_FACTORS[item.unit] ?? 1) * parseFloat(item.amount) / 100;
        const base   = item.food;
        acc.kcal += Math.round((base.calories_per_100 ?? base.kcal ?? 0) * factor);
        acc.p    += Math.round((base.p ?? base.protein ?? 0) * factor);
        acc.c    += Math.round((base.c ?? base.carbs   ?? 0) * factor);
        acc.f    += Math.round((base.f ?? base.fat     ?? 0) * factor);
        return acc;
    }, { kcal:0, p:0, c:0, f:0 });
}

function suggestAmount(food, remainingKcal) {
    const kcalP100 = food.calories_per_100 ?? food.kcal ?? 0;
    if (!kcalP100 || remainingKcal <= 0) return 100;
    return Math.max(10, Math.min(Math.round((remainingKcal / kcalP100) * 100), 500));
}

function useDebounce(value, delay) {
    const [dv, setDv] = useState(value);
    useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
    return dv;
}

// ─── MINI BARRA ───────────────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }) {
    const pct  = Math.min((current / Math.max(target, 1)) * 100, 100);
    const over = current > target * 1.1;
    return (
        <View style={{ flex:1 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:2 }}>
                <Text style={{ fontSize:9, fontWeight:'900', color, letterSpacing:0.5 }}>{label}</Text>
                <Text style={{ fontSize:9, fontWeight:'800', color: over ? '#FF3B30' : color }}>{current}/{target}</Text>
            </View>
            <View style={{ height:4, backgroundColor:color+'25', borderRadius:2 }}>
                <View style={{ width:`${pct}%`, height:4, backgroundColor: over ? '#FF3B30' : color, borderRadius:2 }} />
            </View>
        </View>
    );
}

// ─── RAIO-X DA ANAMNESE ───────────────────────────────────────────────────────
function RaioX({ anamnese, macros, theme, onClose }) {
    const sections = [
        {
            title: '🎯 Objetivo e Perfil',
            items: [
                `Objetivo: ${anamnese.objetivo ?? '—'}`,
                `Peso: ${anamnese.peso ?? '—'}kg | Altura: ${anamnese.altura ?? '—'}cm`,
                `Gênero: ${anamnese.gender ?? anamnese.sexo ?? '—'}`,
                `Frequência: ${anamnese.frequencia ?? '—'}x/sem`,
            ],
        },
        {
            title: '⏰ Rotina',
            items: [
                `Acorda: ${anamnese.wakeUpTime ?? '—'} | Dorme: ${anamnese.sleepTime ?? '—'}`,
                `Treino: ${anamnese.trainTime ?? '—'}`,
                `Refeições/dia: ${anamnese.mealsPerDay ?? '—'}`,
                `Trabalho: ${anamnese.workTimeStart ?? '—'} às ${anamnese.workTimeEnd ?? '—'}`,
            ],
        },
        {
            title: '🎯 Metas do Dia',
            items: [
                `KCAL: ${macros.kcal} | PROT: ${macros.prot}g | CARBO: ${macros.carb}g | GORD: ${macros.fat}g`,
            ],
        },
        {
            title: '⚠️ Restrições e Saúde',
            items: [
                `Alergias: ${anamnese.allergies ?? 'Nenhuma'}`,
                `Aversões: ${anamnese.foodAversions ?? 'Nenhuma'}`,
                `Preferências: ${anamnese.foodPreferences ?? '—'}`,
                `Condições: ${(anamnese.healthConditions ?? []).join(', ') || 'Nenhuma'}`,
                `Digestivo: ${(anamnese.digestiveIssues ?? []).join(', ') || 'Nenhum'}`,
                anamnese.bariatric ? `🔴 Bariátrico: ${anamnese.bariatricType} (${anamnese.bariatricTime})` : null,
            ].filter(Boolean),
        },
        {
            title: '💊 Suplementos',
            items: [anamnese.supplements ?? 'Não informado'],
        },
        {
            title: '📝 Observações',
            items: [anamnese.extraNotes ?? anamnese.observacoes ?? 'Nenhuma'],
        },
    ];

    return (
        <View style={[styles.raioXPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <Text style={{ color: theme.text, fontWeight:'900', fontSize:13, letterSpacing:0.5 }}>
                    ☢️ RAIO-X DO ALUNO
                </Text>
                <TouchableOpacity onPress={onClose}>
                    <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {sections.map((sec, si) => (
                    <View key={si} style={{ marginBottom:12 }}>
                        <Text style={{ color: theme.accent, fontWeight:'900', fontSize:11, marginBottom:4, letterSpacing:0.5 }}>
                            {sec.title}
                        </Text>
                        {sec.items.map((item, ii) => (
                            <Text key={ii} style={{ color: theme.textSecondary, fontSize:11, lineHeight:18 }}>• {item}</Text>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

// ─── PAINEL DE BUSCA ─────────────────────────────────────────────────────────
function FoodSearchPanel({ coachId, onSelect, theme }) {
    const [search,   setSearch]   = useState('');
    const [results,  setResults]  = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [tab,      setTab]      = useState('favorites');
    const [category, setCategory] = useState('Todas');
    const [catOpen,  setCatOpen]  = useState(false);
    const abortRef = useRef(null);
    const debouncedSearch = useDebounce(search, 350);

    useEffect(() => {
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        const params = new URLSearchParams({ coachId, limit:'200', page:'1', favorites: tab==='favorites' ? 'true' : 'false' });
        if (debouncedSearch.length >= 2) params.set('q', debouncedSearch);
        if (category !== 'Todas') params.set('category', category);
        fetch(`${BASE_URL}/api/food/search?${params}`, { signal: ctrl.signal })
            .then(r => r.json())
            .then(d => setResults(d.foods ?? []))
            .catch(e => { if (e.name !== 'AbortError') console.error(e); })
            .finally(() => setLoading(false));
    }, [debouncedSearch, tab, coachId, category]);

    return (
        <View style={{ flex:1 }}>
            {/* Abas */}
            <View style={[styles.tabRow, { borderColor:theme.border }]}>
                {[['favorites','star','Favoritos',theme.accent],['taco','database','TACO Completa','#34C759']].map(([k,icon,label,color]) => (
                    <TouchableOpacity key={k} style={[styles.tab, tab===k && { borderBottomColor:color, borderBottomWidth:2 }]}
                        onPress={() => { setTab(k); setCatOpen(false); }}>
                        <MaterialCommunityIcons name={icon} size={13} color={tab===k ? color : theme.textSecondary} />
                        <Text style={{ fontSize:11, fontWeight:'900', color: tab===k ? color : theme.textSecondary }}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Busca */}
            <View style={{ paddingHorizontal:10, paddingTop:8, gap:6 }}>
                <View style={[styles.searchBox, { backgroundColor:theme.bg, borderColor:theme.border }]}>
                    <MaterialCommunityIcons name="magnify" size={16} color={theme.textSecondary} />
                    <TextInput style={[styles.searchInput, { color:theme.text }]}
                        placeholder="Buscar alimento..." placeholderTextColor={theme.textSecondary}
                        value={search} onChangeText={t => { setSearch(t); setCatOpen(false); }} />
                    {loading && <ActivityIndicator size="small" color={theme.accent} />}
                    {search.length > 0 && !loading && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Botão dropdown categoria */}
                <TouchableOpacity
                    style={[styles.catDropBtn, { backgroundColor:theme.bg, borderColor: catOpen ? theme.accent : theme.border }]}
                    onPress={() => setCatOpen(p => !p)}
                >
                    <MaterialCommunityIcons name="tag-outline" size={13} color={theme.accent} />
                    <Text style={{ flex:1, color:theme.text, fontSize:12, fontWeight:'700' }}>
                        {category === 'Todas' ? 'Todas as categorias' : category}
                    </Text>
                    <MaterialCommunityIcons name={catOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* LISTA DE CATEGORIAS — substitui a FlatList quando aberto */}
            {catOpen ? (
                <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:20 }}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.catDropItem, {
                                backgroundColor: category === cat ? theme.accent+'18' : 'transparent',
                                borderBottomColor: theme.border,
                            }]}
                            onPress={() => { setCategory(cat); setCatOpen(false); setResults([]); }}
                        >
                            <MaterialCommunityIcons
                                name={category === cat ? 'radiobox-marked' : 'radiobox-blank'}
                                size={16}
                                color={category === cat ? theme.accent : theme.textSecondary}
                            />
                            <Text style={{
                                color:      category === cat ? theme.accent : theme.text,
                                fontWeight: category === cat ? '900' : '600',
                                fontSize:   13,
                                marginLeft: 10,
                            }}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                /* LISTA DE ALIMENTOS */
                <FlatList
                    data={results}
                    keyExtractor={(item, i) => `${item.id}-${i}`}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingHorizontal:10, paddingTop:8, paddingBottom:20 }}
                    renderItem={({ item }) => {
                        const kcal = item.calories_per_100 ?? item.kcal ?? 0;
                        return (
                            <TouchableOpacity style={[styles.foodResult, { backgroundColor:theme.surface, borderColor:theme.border }]}
                                onPress={() => onSelect(item)} activeOpacity={0.7}>
                                <View style={{ flex:1 }}>
                                    <Text style={{ color:theme.text, fontWeight:'800', fontSize:12 }} numberOfLines={1}>{item.name}</Text>
                                    <View style={{ flexDirection:'row', gap:8, marginTop:3 }}>
                                        <Text style={{ fontSize:10, fontWeight:'900', color:MC.kcal }}>{Math.round(kcal)} kcal</Text>
                                        <Text style={{ fontSize:10, fontWeight:'800', color:MC.p }}>P {item.p??item.protein??0}g</Text>
                                        <Text style={{ fontSize:10, fontWeight:'800', color:MC.c }}>C {item.c??item.carbs??0}g</Text>
                                        <Text style={{ fontSize:10, fontWeight:'800', color:MC.f }}>G {item.f??item.fat??0}g</Text>
                                    </View>
                                </View>
                                <View style={[styles.addBtn, { backgroundColor:theme.accent }]}>
                                    <MaterialCommunityIcons name="plus" size={16} color="#000" />
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={() => !loading ? (
                        <View style={{ alignItems:'center', padding:24 }}>
                            <MaterialCommunityIcons name="food-off" size={32} color={theme.textSecondary} />
                            <Text style={{ color:theme.textSecondary, fontSize:12, marginTop:8, textAlign:'center' }}>
                                {debouncedSearch.length < 2 && category === 'Todas'
                                    ? 'Selecione uma categoria ou busque por nome'
                                    : 'Nenhum alimento encontrado'}
                            </Text>
                        </View>
                    ) : null}
                />
            )}
        </View>
    );
}

// ─── PAINEL DO SLOT ───────────────────────────────────────────────────────────
function SlotPanel({ slot, slotIndex, items, onAddItem, onRemoveItem, onAmountChange, onUnitChange, theme }) {
    const current       = calcSlotMacros(items);
    const target        = slot.target;
    const remainingKcal = Math.max(target.kcal - current.kcal, 0);
    const done          = items.length > 0 && current.kcal >= target.kcal * 0.85;

    return (
        <View style={[styles.slotPanel, { backgroundColor:theme.surface, borderColor: done ? '#34C759' : theme.border }]}>
            <View style={styles.slotHeader}>
                <View style={[styles.slotIconBox, { backgroundColor: done ? '#34C75918' : theme.accent+'18' }]}>
                    <MaterialCommunityIcons name={SLOT_ICONS[slot.name] ?? 'food'} size={18} color={done ? '#34C759' : theme.accent} />
                </View>
                <View style={{ flex:1, paddingLeft:10 }}>
                    <Text style={{ color:theme.text, fontWeight:'900', fontSize:14 }}>{slot.name}</Text>
                    <Text style={{ color:theme.textSecondary, fontSize:11, marginTop:1 }}>{slot.time}</Text>
                </View>
                <View style={{ alignItems:'flex-end' }}>
                    <Text style={{ color: done ? '#34C759' : MC.kcal, fontWeight:'900', fontSize:13 }}>{current.kcal}</Text>
                    <Text style={{ color:theme.textSecondary, fontSize:10 }}>/{target.kcal} kcal</Text>
                </View>
            </View>

            {/* Barras */}
            <View style={{ flexDirection:'row', gap:8, marginVertical:10 }}>
                <MacroBar label="PROT"  current={current.p} target={target.p} color={MC.p} />
                <MacroBar label="CARBO" current={current.c} target={target.c} color={MC.c} />
                <MacroBar label="GORD"  current={current.f} target={target.f} color={MC.f} />
            </View>

            {/* Alimentos */}
            {items.map((item, idx) => {
                const factor = (UNIT_FACTORS[item.unit] ?? 1) * parseFloat(item.amount) / 100;
                const kcalItem = Math.round((item.food.calories_per_100 ?? item.food.kcal ?? 0) * factor);
                return (
                    <View key={idx} style={[styles.addedItem, { backgroundColor:theme.bg, borderColor:theme.border }]}>
                        <View style={{ flex:1 }}>
                            <Text style={{ color:theme.text, fontWeight:'800', fontSize:12 }} numberOfLines={1}>{item.food.name}</Text>
                            <Text style={{ color:theme.textSecondary, fontSize:10, marginTop:1 }}>{kcalItem} kcal</Text>
                        </View>
                        <View style={styles.amountBox}>
                            <TouchableOpacity
                                style={[styles.amountBtn, { backgroundColor:theme.surface, borderColor:theme.border }]}
                                onPress={() => onAmountChange(slotIndex, idx, Math.max(1, parseFloat(item.amount) - 5))}
                            >
                                <MaterialCommunityIcons name="minus" size={12} color={theme.text} />
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.amountInput, { color:theme.text, borderColor:theme.border }]}
                                value={String(Math.round(parseFloat(item.amount)))}
                                onChangeText={v => { const n=parseFloat(v); if (!isNaN(n) && n>0) onAmountChange(slotIndex, idx, n); }}
                                keyboardType="decimal-pad"
                                selectTextOnFocus
                            />
                            <TouchableOpacity
                                style={[styles.amountBtn, { backgroundColor:theme.surface, borderColor:theme.border }]}
                                onPress={() => onAmountChange(slotIndex, idx, parseFloat(item.amount) + 5)}
                            >
                                <MaterialCommunityIcons name="plus" size={12} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        {/* Unidade */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth:120 }}>
                            <View style={{ flexDirection:'row', gap:4 }}>
                                {UNIT_OPTIONS.map(u => (
                                    <TouchableOpacity key={u.value}
                                        style={[styles.unitPill, {
                                            backgroundColor: item.unit===u.value ? theme.accent+'20' : theme.surface,
                                            borderColor:     item.unit===u.value ? theme.accent       : theme.border,
                                        }]}
                                        onPress={() => onUnitChange(slotIndex, idx, u.value)}
                                    >
                                        <Text style={{ fontSize:9, fontWeight:'900', color: item.unit===u.value ? theme.accent : theme.textSecondary }}>
                                            {u.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                        <TouchableOpacity onPress={() => onRemoveItem(slotIndex, idx)} style={styles.removeItemBtn}>
                            <MaterialCommunityIcons name="close" size={14} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                );
            })}

            {/* Hint */}
            {!done && remainingKcal > 30 && (
                <View style={[styles.hint, { backgroundColor:theme.accent+'10', borderColor:theme.accent+'30' }]}>
                    <MaterialCommunityIcons name="lightning-bolt" size={12} color={theme.accent} />
                    <Text style={{ color:theme.accent, fontSize:11, fontWeight:'700' }}>
                        {remainingKcal} kcal restantes para bater a meta
                    </Text>
                </View>
            )}
            {done && (
                <View style={[styles.hint, { backgroundColor:'#34C75915', borderColor:'#34C75940' }]}>
                    <MaterialCommunityIcons name="check-circle" size={12} color="#34C759" />
                    <Text style={{ color:'#34C759', fontSize:11, fontWeight:'700' }}>Meta atingida!</Text>
                </View>
            )}
        </View>
    );
}

// ─── MODAL PRINCIPAL ─────────────────────────────────────────────────────────
export default function DietBuilderModal({ visible, onClose, onConfirm, anamnese, aluno, dayType, coachId, theme }) {
    const { width:windowWidth, height:windowHeight } = useWindowDimensions();
    const isWeb  = Platform.OS === 'web';
    const isWide = windowWidth > 768;

    const macros = (() => {
        try {
            const plan = calcWeeklyPlan(anamnese, aluno?.birthDate, aluno?.gender);
            return plan.macrosByDay?.[dayType] ?? { kcal:2000, prot:120, carb:220, fat:60 };
        } catch { return { kcal:2000, prot:120, carb:220, fat:60 }; }
    })();

    const [slots,       setSlots]       = useState([]);
    const [slotItems,   setSlotItems]   = useState([]);
    const [activeSlot,  setActiveSlot]  = useState(0);
    const [showRaioX,   setShowRaioX]   = useState(false);

    useEffect(() => {
        if (visible && anamnese) {
            const s = buildSchedule(anamnese, dayType);
            const d = distributeMacros(s, macros);
            setSlots(d);
            setSlotItems(d.map(() => []));
            setActiveSlot(0);
            setShowRaioX(false);
        }
    }, [visible, anamnese, dayType]);

    const handleSelectFood = useCallback((food) => {
        const currentItems  = slotItems[activeSlot] ?? [];
        const currentMacros = calcSlotMacros(currentItems);
        const remaining     = Math.max((slots[activeSlot]?.target?.kcal ?? 0) - currentMacros.kcal, 50);
        const amount        = suggestAmount(food, remaining);
        setSlotItems(prev => {
            const next = [...prev];
            next[activeSlot] = [...(next[activeSlot] ?? []), { food, amount:String(amount), unit: food.base_unit ?? 'g' }];
            return next;
        });
    }, [activeSlot, slotItems, slots]);

    const handleRemoveItem = useCallback((si, ii) => {
        setSlotItems(prev => { const next=[...prev]; next[si]=next[si].filter((_,i)=>i!==ii); return next; });
    }, []);

    const handleAmountChange = useCallback((si, ii, val) => {
        setSlotItems(prev => { const next=[...prev]; next[si]=next[si].map((item,i)=>i===ii?{...item,amount:String(Math.round(val))}:item); return next; });
    }, []);

    const handleUnitChange = useCallback((si, ii, unit) => {
        setSlotItems(prev => { const next=[...prev]; next[si]=next[si].map((item,i)=>i===ii?{...item,unit}:item); return next; });
    }, []);

    const totalCurrent = slotItems.reduce((acc, items) => {
        const m=calcSlotMacros(items); acc.kcal+=m.kcal; acc.p+=m.p; acc.c+=m.c; acc.f+=m.f; return acc;
    }, { kcal:0, p:0, c:0, f:0 });

    const handleAddSlot = () => {
        const newSlot = {
            name: 'Refeição Extra',
            time: '12:00',
            carbPriority: 'low',
            protPriority: 'medium',
            target: { kcal: 200, p: 15, c: 20, f: 7 },
        };
        setSlots(prev => [...prev, newSlot]);
        setSlotItems(prev => [...prev, []]);
        setActiveSlot(slots.length);
    };

    const handleRemoveSlot = (idx) => {
        if (slots.length <= 1) return;
        setSlots(prev => prev.filter((_, i) => i !== idx));
        setSlotItems(prev => prev.filter((_, i) => i !== idx));
        setActiveSlot(prev => Math.min(prev, slots.length - 2));
    };

    const handleConfirm = () => {
        const meals = slots.map((slot, idx) => {
            const items = slotItems[idx] ?? [];
            return {
                id:      `builder-${Date.now()}-${idx}`,
                name:    slot.name,
                time:    slot.time,
                dayType,
                notes:   '',
                items:   items.map((item, iIdx) => {
                    const factor = UNIT_FACTORS[item.unit] ?? 1;
                    return {
                        uniqueId:         `${Date.now()}-${idx}-${iIdx}`,
                        groupId:          `grp-${Date.now()}-${idx}-${iIdx}`,
                        id:               item.food.id,
                        name:             item.food.name,
                        category:         item.food.category,
                        subcategory:      item.food.subcategory,
                        calories_per_100: item.food.calories_per_100 ?? item.food.kcal ?? 0,
                        p:                item.food.p ?? item.food.protein ?? 0,
                        c:                item.food.c ?? item.food.carbs   ?? 0,
                        f:                item.food.f ?? item.food.fat     ?? 0,
                        base_unit:        item.food.base_unit ?? 'g',
                        amount:           String(Math.round(parseFloat(item.amount) * factor)),
                        unit:             'g',
                    };
                }),
            };
        });
        onConfirm(meals);
        onClose();
    };

    if (!visible) return null;

    const DAY_LABELS = { TREINO:'Treino de Força', TREINO_CARDIO:'Treino + Cardio', CARDIO:'Cardio', DESCANSO:'Descanso' };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={[styles.backdrop, isWeb && { height:windowHeight }]}>
                <View style={[styles.container, {
                    backgroundColor:theme.bg, borderColor:theme.border,
                    height: windowHeight * 0.95,
                    maxWidth: isWide ? 980 : '100%', width:'100%',
                }]}>
                    {/* HEADER */}
                    <View style={[styles.header, { borderColor:theme.border, backgroundColor:theme.surface }]}>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor:theme.bg, borderColor:theme.border }]}>
                            <MaterialCommunityIcons name="close" size={18} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ flex:1, alignItems:'center' }}>
                            <Text style={[styles.headerTitle, { color:theme.text }]}>MONTAR DIETA</Text>
                            <Text style={{ color:theme.textSecondary, fontSize:11, fontWeight:'700', marginTop:1 }}>
                                {DAY_LABELS[dayType]} • {aluno?.name}
                            </Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:8 }}>
                            <TouchableOpacity
                                onPress={() => setShowRaioX(p => !p)}
                                style={[styles.raioXBtn, { backgroundColor: showRaioX ? theme.accent+'20' : theme.bg, borderColor: showRaioX ? theme.accent : theme.border }]}
                            >
                                <MaterialCommunityIcons name="radioactive" size={16} color={showRaioX ? theme.accent : theme.textSecondary} />
                                <Text style={{ fontSize:10, fontWeight:'900', color: showRaioX ? theme.accent : theme.textSecondary }}>RAIO-X</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirm} style={[styles.confirmBtn, { backgroundColor:theme.accent }]}>
                                <MaterialCommunityIcons name="check" size={18} color="#000" />
                                <Text style={{ fontWeight:'900', fontSize:12, color:'#000' }}>CONFIRMAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* MACROS GERAIS */}
                    <View style={[styles.macrosBar, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                        <Text style={{ color:theme.textSecondary, fontSize:9, fontWeight:'800', marginBottom:4, letterSpacing:0.5 }}>PROGRESSO DO DIA</Text>
                        <View style={{ flexDirection:'row', gap:6 }}>
                            {[
                                { l:'KCAL', cur:totalCurrent.kcal, tgt:macros.kcal, c:MC.kcal },
                                { l:'PROT', cur:totalCurrent.p,    tgt:macros.prot, c:MC.p    },
                                { l:'CARBO',cur:totalCurrent.c,    tgt:macros.carb, c:MC.c    },
                                { l:'GORD', cur:totalCurrent.f,    tgt:macros.fat,  c:MC.f    },
                            ].map(({ l, cur, tgt, c }) => (
                                <MacroBar key={l} label={l} current={cur} target={tgt} color={c} />
                            ))}
                        </View>
                    </View>

                    {/* CORPO */}
                    <View style={{ flex:1, flexDirection: isWide ? 'row' : 'column' }}>

                        {/* COLUNA ESQUERDA — slots */}
                        <View style={[styles.slotsCol, isWide && { borderRightWidth:1, borderColor:theme.border }]}>
                            {/* Tabs de slot + botão adicionar */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                style={[styles.slotTabs, { borderColor:theme.border }]}
                                contentContainerStyle={{ gap:6, paddingHorizontal:10, paddingVertical:8 }}
                            >
                                {slots.map((slot, idx) => {
                                    const items   = slotItems[idx] ?? [];
                                    const current = calcSlotMacros(items);
                                    const done    = items.length > 0 && current.kcal >= slot.target.kcal * 0.85;
                                    return (
                                        <View key={idx} style={{ position:'relative' }}>
                                            <TouchableOpacity
                                                style={[styles.slotTab, {
                                                    backgroundColor: activeSlot===idx ? theme.accent+'20' : theme.surface,
                                                    borderColor:     done ? '#34C759' : (activeSlot===idx ? theme.accent : theme.border),
                                                    paddingRight: 20,
                                                }]}
                                                onPress={() => setActiveSlot(idx)}
                                            >
                                                <MaterialCommunityIcons
                                                    name={done ? 'check-circle' : (SLOT_ICONS[slot.name] ?? 'food')}
                                                    size={14}
                                                    color={done ? '#34C759' : (activeSlot===idx ? theme.accent : theme.textSecondary)}
                                                />
                                                <Text style={{ fontSize:10, fontWeight:'900', color: activeSlot===idx ? theme.accent : theme.textSecondary }}>
                                                    {slot.name.length > 8 ? slot.name.split(' ')[0] : slot.name}
                                                </Text>
                                                <Text style={{ fontSize:9, color:theme.textSecondary }}>{slot.time}</Text>
                                            </TouchableOpacity>
                                            {/* Botão remover slot */}
                                            {slots.length > 1 && (
                                                <TouchableOpacity
                                                    onPress={() => handleRemoveSlot(idx)}
                                                    style={[styles.removeSlotBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                                >
                                                    <MaterialCommunityIcons name="close" size={9} color="#FF3B30" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}

                                {/* Botão adicionar slot */}
                                <TouchableOpacity
                                    style={[styles.addSlotBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={handleAddSlot}
                                >
                                    <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                                    <Text style={{ fontSize:9, fontWeight:'900', color:theme.accent }}>NOVA</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            {/* Slot ativo + Raio-X */}
                            <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:12 }} showsVerticalScrollIndicator={false}>
                                {/* Raio-X inline (mobile) ou painel (web) */}
                                {showRaioX && !isWide && (
                                    <RaioX anamnese={anamnese} macros={macros} theme={theme} onClose={() => setShowRaioX(false)} />
                                )}
                                {slots[activeSlot] && (
                                    <SlotPanel
                                        slot={slots[activeSlot]}
                                        slotIndex={activeSlot}
                                        items={slotItems[activeSlot] ?? []}
                                        onAddItem={handleSelectFood}
                                        onRemoveItem={handleRemoveItem}
                                        onAmountChange={handleAmountChange}
                                        onUnitChange={handleUnitChange}
                                        theme={theme}
                                    />
                                )}
                                {!isWide && (
                                    <View style={{ height:380, marginTop:12 }}>
                                        <Text style={[styles.sectionTitle, { color:theme.text }]}>ADICIONAR ALIMENTO</Text>
                                        <View style={[{ flex:1, borderRadius:16, borderWidth:1, overflow:'hidden' }, { borderColor:theme.border, backgroundColor:theme.surface }]}>
                                            <FoodSearchPanel coachId={coachId} onSelect={handleSelectFood} theme={theme} />
                                        </View>
                                    </View>
                                )}
                            </ScrollView>
                        </View>

                        {/* COLUNA DIREITA — busca + raio-x (web) */}
                        {isWide && (
                            <View style={[styles.searchCol, { backgroundColor:theme.surface }]}>
                                {showRaioX ? (
                                    <RaioX anamnese={anamnese} macros={macros} theme={theme} onClose={() => setShowRaioX(false)} />
                                ) : (
                                    <>
                                        <Text style={[styles.sectionTitle, { color:theme.text, padding:12, paddingBottom:2 }]}>
                                            ADICIONAR ALIMENTO
                                        </Text>
                                        <Text style={{ color:theme.textSecondary, fontSize:11, paddingHorizontal:12, marginBottom:4 }}>
                                            Adicionando em: <Text style={{ color:theme.accent, fontWeight:'900' }}>{slots[activeSlot]?.name}</Text>
                                        </Text>
                                        <FoodSearchPanel coachId={coachId} onSelect={handleSelectFood} theme={theme} />
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop:       { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end', alignItems:'center' },
    container:      { borderTopLeftRadius:24, borderTopRightRadius:24, borderWidth:1, overflow:'hidden' },
    header:         { flexDirection:'row', alignItems:'center', padding:12, borderBottomWidth:1, gap:8 },
    headerTitle:    { fontWeight:'900', fontSize:14, letterSpacing:1 },
    closeBtn:       { padding:8, borderRadius:12, borderWidth:1 },
    raioXBtn:       { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:8, borderRadius:12, borderWidth:1 },
    confirmBtn:     { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:9, borderRadius:12 },
    macrosBar:      { padding:12, borderBottomWidth:1 },
    slotsCol:       { flex:1, overflow:'hidden' },
    slotTabs:       { borderBottomWidth:1, flexGrow:0 },
    slotTab:        { alignItems:'center', gap:2, paddingHorizontal:10, paddingVertical:7, borderRadius:12, borderWidth:1, minWidth:65 },
    searchCol:      { width:340 },
    sectionTitle:   { fontSize:11, fontWeight:'900', letterSpacing:1, marginBottom:4 },
    slotPanel:      { borderRadius:18, borderWidth:1, padding:14 },
    slotHeader:     { flexDirection:'row', alignItems:'center' },
    slotIconBox:    { width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
    addedItem:      { flexDirection:'row', alignItems:'center', padding:10, borderRadius:12, borderWidth:1, marginTop:8, gap:6, flexWrap:'wrap' },
    amountBox:      { flexDirection:'row', alignItems:'center', gap:3 },
    amountBtn:      { width:24, height:24, borderRadius:7, borderWidth:1, alignItems:'center', justifyContent:'center' },
    amountInput:    { width:40, height:26, borderBottomWidth:1, textAlign:'center', fontWeight:'900', fontSize:13 },
    unitPill:       { paddingHorizontal:6, paddingVertical:3, borderRadius:6, borderWidth:1 },
    removeItemBtn:  { width:24, height:24, alignItems:'center', justifyContent:'center' },
    hint:           { flexDirection:'row', alignItems:'center', gap:6, padding:8, borderRadius:10, borderWidth:1, marginTop:8 },
    tabRow:         { flexDirection:'row', borderBottomWidth:1 },
    tab:            { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:10 },
    searchBox:      { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:12, borderWidth:1 },
    searchInput:    { flex:1, outlineStyle:'none' },
    foodResult:     { flexDirection:'row', alignItems:'center', padding:10, borderRadius:12, borderWidth:1, marginBottom:6 },
    addBtn:         { width:32, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
    removeSlotBtn:  { position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:8, borderWidth:1, alignItems:'center', justifyContent:'center', zIndex:10 },
    addSlotBtn:     { alignItems:'center', justifyContent:'center', gap:2, paddingHorizontal:10, paddingVertical:7, borderRadius:12, borderWidth:1, borderStyle:'dashed', minWidth:55 },
    catDropBtn:     { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:12, borderWidth:1 },
    catDropItem:    { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:13, borderBottomWidth:1 },
    raioXPanel:     { borderRadius:18, borderWidth:1, padding:16, marginBottom:12, maxHeight:400 },
});
