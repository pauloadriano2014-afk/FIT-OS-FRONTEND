// src/components/AdminDiet/DietBuilderModal.js — v5
// Assistente de montagem manual de dietas
// v3: edição inline de nome e horário dos slots
// v4: substitutos automáticos por grupo de substituição
// v5: dropdown de unidades com detecção automática de direção (cima/baixo)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, FlatList, TextInput, ActivityIndicator,
    Platform, useWindowDimensions, Pressable,
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

const UNIT_OPTIONS = [
    { label:'g',        value:'g'        },
    { label:'ml',       value:'ml'       },
    { label:'unid.',    value:'un'       },
    { label:'col. sopa',value:'col_sopa' },
    { label:'col. chá', value:'col_cha'  },
    { label:'fatia',    value:'fatia'    },
    { label:'xícara',   value:'xicara'  },
    { label:'punhado',  value:'punhado'  },
];

const UNIT_FACTORS = {
    g: 1, ml: 1, un: 100,
    col_sopa: 15, col_cha: 5,
    fatia: 30, xicara: 240, punhado: 30,
};

// ─── DROPDOWN DE UNIDADES — v5 ────────────────────────────────────────────────
// Abre para cima ou para baixo dependendo do espaço disponível na tela.
// Usa um Modal transparente para sobrepor qualquer ScrollView pai.
function UnitDropdown({ value, onChange, theme }) {
    const [open,    setOpen]    = useState(false);
    const [dropUp,  setDropUp]  = useState(false);
    const [anchor,  setAnchor]  = useState({ x:0, y:0, width:0, height:0 });
    const btnRef = useRef(null);
    const { height: screenH } = useWindowDimensions();

    const ITEM_H   = 36; // altura de cada opção
    const LIST_H   = UNIT_OPTIONS.length * ITEM_H; // altura total da lista
    const MARGIN   = 8;

    const currentLabel = UNIT_OPTIONS.find(u => u.value === value)?.label ?? value;

    const openDropdown = () => {
        btnRef.current?.measureInWindow((x, y, width, height) => {
            const spaceBelow = screenH - (y + height) - MARGIN;
            const goUp = spaceBelow < LIST_H;
            setAnchor({ x, y, width, height });
            setDropUp(goUp);
            setOpen(true);
        });
    };

    const dropY = dropUp
        ? anchor.y - LIST_H - MARGIN
        : anchor.y + anchor.height + MARGIN;

    return (
        <>
            {/* Botão trigger */}
            <TouchableOpacity
                ref={btnRef}
                onPress={openDropdown}
                style={[styles.unitDropBtn, { backgroundColor: theme.surface, borderColor: theme.accent }]}
                activeOpacity={0.7}
            >
                <Text style={{ fontSize:10, fontWeight:'900', color:theme.accent }}>{currentLabel}</Text>
                <MaterialCommunityIcons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={11} color={theme.accent}
                />
            </TouchableOpacity>

            {/* Overlay + lista — renderizado num Modal para sair de qualquer ScrollView */}
            {open && (
                <Modal transparent visible animationType="none" onRequestClose={() => setOpen(false)}>
                    {/* Toque fora fecha */}
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />

                    <View style={[
                        styles.unitDropList,
                        {
                            position:        'absolute',
                            left:            anchor.x,
                            top:             dropY,
                            width:           Math.max(anchor.width, 110),
                            backgroundColor: theme.surface,
                            borderColor:     theme.border,
                            // sombra leve
                            shadowColor:     '#000',
                            shadowOpacity:   0.18,
                            shadowRadius:    8,
                            shadowOffset:    { width:0, height:4 },
                            elevation:       12,
                        },
                    ]}>
                        {UNIT_OPTIONS.map((u, i) => {
                            const selected = u.value === value;
                            return (
                                <TouchableOpacity
                                    key={u.value}
                                    style={[
                                        styles.unitDropItem,
                                        selected && { backgroundColor: theme.accent+'20' },
                                        i < UNIT_OPTIONS.length - 1 && { borderBottomWidth:1, borderBottomColor: theme.border },
                                    ]}
                                    onPress={() => { onChange(u.value); setOpen(false); }}
                                >
                                    <Text style={{
                                        fontSize:   12,
                                        fontWeight: selected ? '900' : '600',
                                        color:      selected ? theme.accent : theme.text,
                                    }}>
                                        {u.label}
                                    </Text>
                                    {selected && (
                                        <MaterialCommunityIcons name="check" size={13} color={theme.accent} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Modal>
            )}
        </>
    );
}

// ─── UTILITÁRIOS DE TEMPO ─────────────────────────────────────────────────────
const toMin  = (t) => { if (!t || !t.includes(':')) return 0; const [h,m] = t.split(':').map(Number); return h*60+m; };
const toTime = (m) => { const total=((m%1440)+1440)%1440; return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`; };
const roundQ = (m) => toTime(Math.round(m/15)*15);

function normalizeTime(raw) {
    const clean = raw.replace(/[^0-9:]/g, '');
    const parts = clean.split(':');
    if (parts.length !== 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

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

    if (minsTillTrain >= 60 && !anamnese.trainFasted) {
        const t = roundQ(trainMin - 70);
        slots.push({ name:'Pré-Treino', time:t, carbPriority:'high', protPriority:'medium', role:'preworkout' });
        used.add(t);
    } else if (!anamnese.trainFasted) {
        const t = roundQ(trainMin - 20);
        slots.push({ name:'Pré-Treino Rápido', time:t, carbPriority:'high', protPriority:'low', role:'preworkout' });
        used.add(t);
    }

    const posTime = roundQ(trainMin + 45);
    slots.push({ name:'Pós-Treino', time:posTime, carbPriority:'high', protPriority:'high', role:'postworkout' });
    used.add(posTime);

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

// ─── v4: CALCULA QUANTIDADE EQUIVALENTE EM KCAL ───────────────────────────────
// Dado que o alimento principal foi adicionado com `primaryAmount` gramas,
// retorna quantas gramas do alimento substituto entregam as mesmas kcal.
function calcEquivalentAmount(primaryFood, primaryAmount, primaryUnit, substituteFood) {
    const factor       = (UNIT_FACTORS[primaryUnit] ?? 1) * parseFloat(primaryAmount) / 100;
    const primaryKcal  = (primaryFood.calories_per_100 ?? primaryFood.kcal ?? 0) * factor;
    const subKcalP100  = substituteFood.calories_per_100 ?? substituteFood.kcal ?? 0;
    if (!subKcalP100 || !primaryKcal) return 100;
    return Math.max(10, Math.min(Math.round((primaryKcal / subKcalP100) * 100), 800));
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
        const params = new URLSearchParams({ coachId, limit:'30', favorites: tab==='favorites' ? 'true' : 'false' });
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
            <View style={[styles.tabRow, { borderColor:theme.border }]}>
                {[['favorites','star','Favoritos',theme.accent],['taco','database','TACO Completa','#34C759']].map(([k,icon,label,color]) => (
                    <TouchableOpacity key={k} style={[styles.tab, tab===k && { borderBottomColor:color, borderBottomWidth:2 }]}
                        onPress={() => { setTab(k); setCatOpen(false); }}>
                        <MaterialCommunityIcons name={icon} size={13} color={tab===k ? color : theme.textSecondary} />
                        <Text style={{ fontSize:11, fontWeight:'900', color: tab===k ? color : theme.textSecondary }}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

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

            {catOpen ? (
                <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:20 }}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity key={cat}
                            style={[styles.catDropItem, {
                                backgroundColor: category === cat ? theme.accent+'18' : 'transparent',
                                borderBottomColor: theme.border,
                            }]}
                            onPress={() => { setCategory(cat); setCatOpen(false); setResults([]); }}
                        >
                            <MaterialCommunityIcons
                                name={category === cat ? 'radiobox-marked' : 'radiobox-blank'}
                                size={16} color={category === cat ? theme.accent : theme.textSecondary}
                            />
                            <Text style={{
                                color:      category === cat ? theme.accent : theme.text,
                                fontWeight: category === cat ? '900' : '600',
                                fontSize:   13, marginLeft: 10,
                            }}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
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
function SlotPanel({ slot, slotIndex, items, onAddItem, onRemoveItem, onAmountChange, onUnitChange,
                     onRenameSlot, onRetimeSlot, theme }) {
    const [editingName, setEditingName] = useState(false);
    const [editingTime, setEditingTime] = useState(false);
    const [draftName,   setDraftName]   = useState('');
    const [draftTime,   setDraftTime]   = useState('');
    const [timeError,   setTimeError]   = useState(false);
    const nameInputRef = useRef(null);
    const timeInputRef = useRef(null);

    const current       = calcSlotMacros(items);
    const target        = slot.target;
    const remainingKcal = Math.max(target.kcal - current.kcal, 0);
    const done          = items.length > 0 && current.kcal >= target.kcal * 0.85;

    const startEditName = () => {
        setDraftName(slot.name);
        setEditingName(true);
        setTimeout(() => nameInputRef.current?.focus(), 50);
    };
    const commitName = () => {
        const trimmed = draftName.trim();
        if (trimmed.length > 0) onRenameSlot(slotIndex, trimmed);
        setEditingName(false);
    };
    const startEditTime = () => {
        setDraftTime(slot.time);
        setTimeError(false);
        setEditingTime(true);
        setTimeout(() => timeInputRef.current?.focus(), 50);
    };
    const commitTime = () => {
        const normalized = normalizeTime(draftTime);
        if (normalized) {
            onRetimeSlot(slotIndex, normalized);
            setTimeError(false);
            setEditingTime(false);
        } else {
            setTimeError(true);
            timeInputRef.current?.focus();
        }
    };
    const cancelTime = () => { setTimeError(false); setEditingTime(false); };

    return (
        <View style={[styles.slotPanel, { backgroundColor:theme.surface, borderColor: done ? '#34C759' : theme.border }]}>
            <View style={styles.slotHeader}>
                <View style={[styles.slotIconBox, { backgroundColor: done ? '#34C75918' : theme.accent+'18' }]}>
                    <MaterialCommunityIcons name={SLOT_ICONS[slot.name] ?? 'food'} size={18} color={done ? '#34C759' : theme.accent} />
                </View>

                <View style={{ flex:1, paddingLeft:10 }}>
                    {editingName ? (
                        <View style={styles.inlineEditRow}>
                            <TextInput
                                ref={nameInputRef}
                                style={[styles.inlineInput, { color:theme.text, borderColor:theme.accent, backgroundColor:theme.accent+'10' }]}
                                value={draftName}
                                onChangeText={setDraftName}
                                onSubmitEditing={commitName}
                                onBlur={commitName}
                                returnKeyType="done"
                                maxLength={32}
                                selectTextOnFocus
                            />
                        </View>
                    ) : (
                        <TouchableOpacity onPress={startEditName} style={styles.editableLabelRow} activeOpacity={0.6}>
                            <Text style={{ color:theme.text, fontWeight:'900', fontSize:14 }}>{slot.name}</Text>
                            <MaterialCommunityIcons name="pencil-outline" size={12} color={theme.textSecondary} style={{ marginLeft:4, marginTop:2 }} />
                        </TouchableOpacity>
                    )}

                    {editingTime ? (
                        <View style={[styles.inlineEditRow, { marginTop:3 }]}>
                            <TextInput
                                ref={timeInputRef}
                                style={[
                                    styles.inlineInputSmall,
                                    { color: timeError ? '#FF3B30' : theme.text,
                                      borderColor: timeError ? '#FF3B30' : theme.accent,
                                      backgroundColor: timeError ? '#FF3B3010' : theme.accent+'10' },
                                ]}
                                value={draftTime}
                                onChangeText={v => { setDraftTime(v); setTimeError(false); }}
                                onSubmitEditing={commitTime}
                                keyboardType="numbers-and-punctuation"
                                placeholder="HH:MM"
                                placeholderTextColor={theme.textSecondary}
                                maxLength={5}
                                selectTextOnFocus
                            />
                            <TouchableOpacity onPress={commitTime} style={[styles.timeConfirmBtn, { backgroundColor:theme.accent }]}>
                                <MaterialCommunityIcons name="check" size={12} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={cancelTime} style={[styles.timeCancelBtn, { borderColor:theme.border }]}>
                                <MaterialCommunityIcons name="close" size={12} color={theme.textSecondary} />
                            </TouchableOpacity>
                            {timeError && (
                                <Text style={{ color:'#FF3B30', fontSize:9, fontWeight:'800', marginLeft:4 }}>HH:MM</Text>
                            )}
                        </View>
                    ) : (
                        <TouchableOpacity onPress={startEditTime} style={[styles.editableLabelRow, { marginTop:1 }]} activeOpacity={0.6}>
                            <MaterialCommunityIcons name="clock-outline" size={11} color={theme.textSecondary} />
                            <Text style={{ color:theme.textSecondary, fontSize:11, marginLeft:3 }}>{slot.time}</Text>
                            <MaterialCommunityIcons name="pencil-outline" size={10} color={theme.textSecondary} style={{ marginLeft:3 }} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ alignItems:'flex-end' }}>
                    <Text style={{ color: done ? '#34C759' : MC.kcal, fontWeight:'900', fontSize:13 }}>{current.kcal}</Text>
                    <Text style={{ color:theme.textSecondary, fontSize:10 }}>/{target.kcal} kcal</Text>
                </View>
            </View>

            <View style={{ flexDirection:'row', gap:8, marginVertical:10 }}>
                <MacroBar label="PROT"  current={current.p} target={target.p} color={MC.p} />
                <MacroBar label="CARBO" current={current.c} target={target.c} color={MC.c} />
                <MacroBar label="GORD"  current={current.f} target={target.f} color={MC.f} />
            </View>

            {items.map((item, idx) => {
                const factor   = (UNIT_FACTORS[item.unit] ?? 1) * parseFloat(item.amount) / 100;
                const kcalItem = Math.round((item.food.calories_per_100 ?? item.food.kcal ?? 0) * factor);

                return (
                    <View key={idx}>
                        {/* Item principal */}
                        <View style={[styles.addedItem, { backgroundColor:theme.bg, borderColor:theme.border }]}>
                            <View style={{ flex:1 }}>
                                <Text style={{ color:theme.text, fontWeight:'800', fontSize:12 }} numberOfLines={1}>{item.food.name}</Text>
                                <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginTop:1 }}>
                                    <Text style={{ color:theme.textSecondary, fontSize:10 }}>{kcalItem} kcal</Text>
                                    {/* Badge de grupo — v4 */}
                                    {item.groupName ? (
                                        <View style={[styles.groupBadge, { backgroundColor:theme.accent+'18', borderColor:theme.accent+'40' }]}>
                                            <MaterialCommunityIcons name="swap-horizontal" size={9} color={theme.accent} />
                                            <Text style={{ fontSize:8, fontWeight:'900', color:theme.accent }}>{item.groupName}</Text>
                                        </View>
                                    ) : null}
                                </View>
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
                            <UnitDropdown
                                value={item.unit}
                                onChange={unit => onUnitChange(slotIndex, idx, unit)}
                                theme={theme}
                            />
                            <TouchableOpacity onPress={() => onRemoveItem(slotIndex, idx)} style={styles.removeItemBtn}>
                                <MaterialCommunityIcons name="close" size={14} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>

                        {/* Substitutos do item — v4 */}
                        {item.substitutes && item.substitutes.length > 0 && (
                            <View style={[styles.substitutesBlock, { borderColor:theme.accent+'30', backgroundColor:theme.accent+'06' }]}>
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginBottom:5 }}>
                                    <MaterialCommunityIcons name="swap-horizontal" size={11} color={theme.accent} />
                                    <Text style={{ fontSize:9, fontWeight:'900', color:theme.accent, letterSpacing:0.5 }}>
                                        SUBSTITUTOS — mesmas calorias
                                    </Text>
                                </View>
                                {item.substitutes.map((sub, si) => {
                                    const subFactor   = (UNIT_FACTORS[sub.unit] ?? 1) * parseFloat(sub.amount) / 100;
                                    const subKcal     = Math.round((sub.food.calories_per_100 ?? 0) * subFactor);
                                    return (
                                        <View key={si} style={[styles.substituteRow, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                                            <MaterialCommunityIcons name="arrow-right-thin" size={12} color={theme.accent} />
                                            <View style={{ flex:1, paddingLeft:6 }}>
                                                <Text style={{ color:theme.text, fontWeight:'700', fontSize:11 }} numberOfLines={1}>{sub.food.name}</Text>
                                                <Text style={{ color:theme.textSecondary, fontSize:9 }}>{sub.amount}g · {subKcal} kcal</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => onRemoveItem(slotIndex, idx, si)} style={styles.removeSubBtn}>
                                                <MaterialCommunityIcons name="close" size={11} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                );
            })}

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

    const [slots,      setSlots]      = useState([]);
    const [slotItems,  setSlotItems]  = useState([]);
    const [activeSlot, setActiveSlot] = useState(0);
    const [showRaioX,  setShowRaioX]  = useState(false);

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

    // ── v4: busca grupos e injeta substitutos ─────────────────────────────────
    const fetchAndInjectSubstitutes = useCallback(async (food, amount, unit, slotIndex) => {
        try {
            const res  = await fetch(`${BASE_URL}/api/food/substitution-groups/by-foods`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ foodIds: [food.id], coachId }),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (!data.groups || !data.groups.length) return;

            // Para cada grupo encontrado, adiciona os outros membros como substitutos
            // no item que acabou de ser adicionado (dentro de slotItems[slotIndex])
            setSlotItems(prev => {
                const next = prev.map(arr => [...arr]);
                // O item recém-adicionado é o último do slot
                const itemIdx = next[slotIndex].length - 1;
                if (itemIdx < 0) return prev;

                const item = next[slotIndex][itemIdx];

                // Junta todos os substitutos de todos os grupos (excluindo o próprio alimento)
                const substitutes = [];
                for (const group of data.groups) {
                    for (const member of group.members) {
                        if (member.foodId === food.id) continue; // pula o próprio alimento
                        // Evita duplicar se o mesmo alimento aparecer em mais de um grupo
                        if (substitutes.some(s => s.food.id === member.foodId)) continue;
                        const equivAmount = calcEquivalentAmount(food, amount, unit, member);
                        substitutes.push({
                            food:   member,
                            amount: String(equivAmount),
                            unit:   member.base_unit ?? 'g',
                        });
                    }
                }

                if (!substitutes.length) return prev;

                // Pega o nome do primeiro grupo para exibir no badge
                const groupName = data.groups[0].groupName;

                next[slotIndex][itemIdx] = {
                    ...item,
                    groupName,
                    substitutes,
                };

                return next;
            });
        } catch (e) {
            // Silencioso — substitutos são bônus, não bloqueantes
            console.warn('[DietBuilder] substituição:', e.message);
        }
    }, [coachId]);

    // ── handleSelectFood atualizado ───────────────────────────────────────────
    const handleSelectFood = useCallback((food) => {
        const currentItems  = slotItems[activeSlot] ?? [];
        const currentMacros = calcSlotMacros(currentItems);
        const remaining     = Math.max((slots[activeSlot]?.target?.kcal ?? 0) - currentMacros.kcal, 50);
        const amount        = suggestAmount(food, remaining);
        const unit          = food.base_unit ?? 'g';

        setSlotItems(prev => {
            const next = [...prev];
            next[activeSlot] = [
                ...(next[activeSlot] ?? []),
                { food, amount: String(amount), unit, substitutes: [] }, // v4: substitutes começa vazio
            ];
            return next;
        });

        // Dispara busca de substitutos em background — não bloqueia a UI
        fetchAndInjectSubstitutes(food, amount, unit, activeSlot);
    }, [activeSlot, slotItems, slots, fetchAndInjectSubstitutes]);

    const handleRemoveItem = useCallback((si, ii, subIdx) => {
        setSlotItems(prev => {
            const next = prev.map(arr => [...arr]);
            if (subIdx !== undefined) {
                // Remove só o substituto
                next[si][ii] = {
                    ...next[si][ii],
                    substitutes: next[si][ii].substitutes.filter((_, i) => i !== subIdx),
                };
            } else {
                // Remove o item principal (e seus substitutos junto)
                next[si] = next[si].filter((_, i) => i !== ii);
            }
            return next;
        });
    }, []);

    const handleAmountChange = useCallback((si, ii, val) => {
        setSlotItems(prev => {
            const next = prev.map(arr => [...arr]);
            next[si][ii] = { ...next[si][ii], amount: String(Math.round(val)) };
            return next;
        });
    }, []);

    const handleUnitChange = useCallback((si, ii, unit) => {
        setSlotItems(prev => {
            const next = prev.map(arr => [...arr]);
            next[si][ii] = { ...next[si][ii], unit };
            return next;
        });
    }, []);

    const handleRenameSlot = useCallback((si, newName) => {
        setSlots(prev => prev.map((s, i) => i === si ? { ...s, name: newName } : s));
    }, []);

    const handleRetimeSlot = useCallback((si, newTime) => {
        setSlots(prev => {
            const next = prev.map((s, i) => i === si ? { ...s, time: newTime } : s);
            return [...next].sort((a, b) => toMin(a.time) - toMin(b.time));
        });
        setSlots(current => {
            const newIdx = current.findIndex((s, i) => i !== si ? false : s.time === newTime);
            if (newIdx !== -1) setActiveSlot(newIdx);
            return current;
        });
    }, []);

    const totalCurrent = slotItems.reduce((acc, items) => {
        const m = calcSlotMacros(items); acc.kcal+=m.kcal; acc.p+=m.p; acc.c+=m.c; acc.f+=m.f; return acc;
    }, { kcal:0, p:0, c:0, f:0 });

    const handleAddSlot = () => {
        const newSlot = {
            name: 'Refeição Extra', time: '12:00',
            carbPriority: 'low', protPriority: 'medium',
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

    // ── v4: handleConfirm inclui substitutos nos FoodItems ───────────────────
    const handleConfirm = () => {
        const meals = slots.map((slot, idx) => {
            const items = slotItems[idx] ?? [];
            const foodItems = [];

            items.forEach((item, iIdx) => {
                const factor = UNIT_FACTORS[item.unit] ?? 1;
                const base = {
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
                    substitutionGroupId: item.groupName ? item.groupName : undefined,
                };
                foodItems.push(base);

                // Substitutos entram como FoodItems com o mesmo substitutionGroupId
                (item.substitutes ?? []).forEach((sub, sIdx) => {
                    const subFactor = UNIT_FACTORS[sub.unit] ?? 1;
                    foodItems.push({
                        uniqueId:         `${Date.now()}-${idx}-${iIdx}-sub-${sIdx}`,
                        groupId:          base.groupId, // mesmo groupId = são substitutos entre si
                        id:               sub.food.id ?? sub.food.foodId,
                        name:             sub.food.name,
                        category:         sub.food.category,
                        subcategory:      sub.food.subcategory,
                        calories_per_100: sub.food.calories_per_100 ?? 0,
                        p:                sub.food.p ?? 0,
                        c:                sub.food.c ?? 0,
                        f:                sub.food.f ?? 0,
                        base_unit:        sub.food.base_unit ?? 'g',
                        amount:           String(Math.round(parseFloat(sub.amount) * subFactor)),
                        unit:             'g',
                        isSubstitute:     true,
                        substitutionGroupId: item.groupName ?? undefined,
                    });
                });
            });

            return {
                id:      `builder-${Date.now()}-${idx}`,
                name:    slot.name,
                time:    slot.time,
                dayType,
                notes:   '',
                items:   foodItems,
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
                        <View style={[styles.slotsCol, isWide && { borderRightWidth:1, borderColor:theme.border }]}>
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
                                <TouchableOpacity
                                    style={[styles.addSlotBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={handleAddSlot}
                                >
                                    <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                                    <Text style={{ fontSize:9, fontWeight:'900', color:theme.accent }}>NOVA</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:12 }} showsVerticalScrollIndicator={false}>
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
                                        onRenameSlot={handleRenameSlot}
                                        onRetimeSlot={handleRetimeSlot}
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
    backdrop:         { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end', alignItems:'center' },
    container:        { borderTopLeftRadius:24, borderTopRightRadius:24, borderWidth:1, overflow:'hidden' },
    header:           { flexDirection:'row', alignItems:'center', padding:12, borderBottomWidth:1, gap:8 },
    headerTitle:      { fontWeight:'900', fontSize:14, letterSpacing:1 },
    closeBtn:         { padding:8, borderRadius:12, borderWidth:1 },
    raioXBtn:         { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:8, borderRadius:12, borderWidth:1 },
    confirmBtn:       { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:9, borderRadius:12 },
    macrosBar:        { padding:12, borderBottomWidth:1 },
    slotsCol:         { flex:1, overflow:'hidden' },
    slotTabs:         { borderBottomWidth:1, flexGrow:0 },
    slotTab:          { alignItems:'center', gap:2, paddingHorizontal:10, paddingVertical:7, borderRadius:12, borderWidth:1, minWidth:65 },
    searchCol:        { width:340 },
    sectionTitle:     { fontSize:11, fontWeight:'900', letterSpacing:1, marginBottom:4 },
    slotPanel:        { borderRadius:18, borderWidth:1, padding:14 },
    slotHeader:       { flexDirection:'row', alignItems:'center' },
    slotIconBox:      { width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
    addedItem:        { flexDirection:'row', alignItems:'center', padding:10, borderRadius:12, borderWidth:1, marginTop:8, gap:6, flexWrap:'wrap' },
    amountBox:        { flexDirection:'row', alignItems:'center', gap:3 },
    amountBtn:        { width:24, height:24, borderRadius:7, borderWidth:1, alignItems:'center', justifyContent:'center' },
    amountInput:      { width:40, height:26, borderBottomWidth:1, textAlign:'center', fontWeight:'900', fontSize:13 },
    // unitPill removido na v5 — substituído pelo UnitDropdown
    unitDropBtn:      { flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:8, paddingVertical:5,
                        borderRadius:8, borderWidth:1 },
    unitDropList:     { borderRadius:12, borderWidth:1, overflow:'hidden' },
    unitDropItem:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                        paddingHorizontal:14, height:36 },
    removeItemBtn:    { width:24, height:24, alignItems:'center', justifyContent:'center' },
    hint:             { flexDirection:'row', alignItems:'center', gap:6, padding:8, borderRadius:10, borderWidth:1, marginTop:8 },
    tabRow:           { flexDirection:'row', borderBottomWidth:1 },
    tab:              { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:10 },
    searchBox:        { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:12, borderWidth:1 },
    searchInput:      { flex:1, outlineStyle:'none' },
    foodResult:       { flexDirection:'row', alignItems:'center', padding:10, borderRadius:12, borderWidth:1, marginBottom:6 },
    addBtn:           { width:32, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
    removeSlotBtn:    { position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:8, borderWidth:1, alignItems:'center', justifyContent:'center', zIndex:10 },
    addSlotBtn:       { alignItems:'center', justifyContent:'center', gap:2, paddingHorizontal:10, paddingVertical:7, borderRadius:12, borderWidth:1, borderStyle:'dashed', minWidth:55 },
    catDropBtn:       { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:12, borderWidth:1 },
    catDropItem:      { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:13, borderBottomWidth:1 },
    raioXPanel:       { borderRadius:18, borderWidth:1, padding:16, marginBottom:12, maxHeight:400 },
    // edição inline (v3)
    editableLabelRow: { flexDirection:'row', alignItems:'center' },
    inlineEditRow:    { flexDirection:'row', alignItems:'center', gap:4 },
    inlineInput:      { flex:1, height:28, borderWidth:1, borderRadius:8, paddingHorizontal:8, fontWeight:'900', fontSize:13, outlineStyle:'none' },
    inlineInputSmall: { width:60, height:24, borderWidth:1, borderRadius:7, paddingHorizontal:6, fontWeight:'800', fontSize:12, textAlign:'center', outlineStyle:'none' },
    timeConfirmBtn:   { width:24, height:24, borderRadius:7, alignItems:'center', justifyContent:'center' },
    timeCancelBtn:    { width:24, height:24, borderRadius:7, borderWidth:1, alignItems:'center', justifyContent:'center' },
    // substitutos (v4)
    groupBadge:       { flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:5, paddingVertical:2, borderRadius:5, borderWidth:1 },
    substitutesBlock: { marginTop:4, marginLeft:12, borderLeftWidth:2, paddingLeft:10, paddingVertical:8, borderRadius:4 },
    substituteRow:    { flexDirection:'row', alignItems:'center', padding:7, borderRadius:9, borderWidth:1, marginBottom:4 },
    removeSubBtn:     { width:20, height:20, alignItems:'center', justifyContent:'center' },
});