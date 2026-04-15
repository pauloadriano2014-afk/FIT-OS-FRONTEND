// src/screens/DietScreen.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, ActivityIndicator, Platform, Linking,
    Animated, useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calcItemMacros = (item) => {
    const g = item.gram_amount || item.gramAmount || 0;
    return {
        kcal: Math.round(((item.calories_per_100 || item.calories || 0) * g) / 100),
        prot: Math.round(((item.p || item.protein || 0) * g) / 100),
        carb: Math.round(((item.c || item.carbs || 0) * g) / 100),
        fat:  Math.round(((item.f || item.fats || 0) * g) / 100),
    };
};

const calcMealMacros = (meal) => {
    const groups = meal.items.reduce((acc, item) => {
        const key = item.substitutionGroupId || item.id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    return Object.values(groups).reduce((sum, group) => {
        const m = calcItemMacros(group[0]);
        return { kcal: sum.kcal + m.kcal, prot: sum.prot + m.prot, carb: sum.carb + m.carb, fat: sum.fat + m.fat };
    }, { kcal: 0, prot: 0, carb: 0, fat: 0 });
};

const parseWaterMl = (str) => {
    if (!str) return 2500;
    const s = String(str).toLowerCase();
    const num = parseFloat(s);
    if (s.includes('litro') || (s.includes('l') && !s.includes('ml'))) return Math.round(num * 1000);
    if (s.includes('ml')) return Math.round(num);
    if (num > 0 && num < 20) return Math.round(num * 1000);
    return Math.round(num) || 2500;
};

// ─── AnimatedProgressBar ─────────────────────────────────────────────────────
function AnimatedBar({ pct, color, height = 4 }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(anim, { toValue: pct, useNativeDriver: false, tension: 40, friction: 8 }).start();
    }, [pct]);
    return (
        <View style={{ height, borderRadius: height / 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <Animated.View style={{
                height: '100%', borderRadius: height / 2, backgroundColor: color,
                width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })
            }} />
        </View>
    );
}

// ─── MacroPill ───────────────────────────────────────────────────────────────
function MacroPill({ label, value, unit, color, pct }) {
    return (
        <View style={[pill.wrap, { borderColor: color + '25' }]}>
            <View style={[pill.dot, { backgroundColor: color }]} />
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={[pill.label, { color: 'rgba(255,255,255,0.5)' }]}>{label}</Text>
                    <Text style={[pill.value, { color }]}>{value}<Text style={pill.unit}>{unit}</Text></Text>
                </View>
                <AnimatedBar pct={pct} color={color} height={3} />
            </View>
        </View>
    );
}
const pill = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
    dot: { width: 8, height: 8, borderRadius: 4 },
    label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
    value: { fontSize: 14, fontWeight: '900' },
    unit: { fontSize: 9, fontWeight: '600' },
});

// ─── WaterTracker ─────────────────────────────────────────────────────────────
function WaterTracker({ targetMl, theme }) {
    const [cups, setCups] = useState(0);
    const ML = 250;
    const total = Math.ceil(targetMl / ML);
    const consumed = cups * ML;
    const pct = Math.min((consumed / (targetMl || 1)) * 100, 100);
    const done = consumed >= targetMl;

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulse = () => {
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.12, useNativeDriver: true, tension: 200 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }),
        ]).start();
    };

    return (
        <View style={[wt.card, { backgroundColor: theme.surface, borderColor: done ? '#32ADE6' : theme.border }]}>
            <View style={wt.top}>
                <View style={[wt.iconBox, { backgroundColor: '#32ADE6' + '18' }]}>
                    <MaterialCommunityIcons name="water" size={20} color="#32ADE6" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[wt.title, { color: theme.text }]}>HIDRATAÇÃO</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 1 }}>
                        <Text style={{ color: '#32ADE6', fontWeight: '800' }}>{consumed}ml</Text> / {targetMl}ml
                    </Text>
                </View>
                {done ? (
                    <View style={wt.doneBadge}>
                        <MaterialCommunityIcons name="check-circle" size={14} color="#32ADE6" />
                        <Text style={{ color: '#32ADE6', fontSize: 10, fontWeight: '900' }}>META!</Text>
                    </View>
                ) : (
                    <Text style={[wt.pctText, { color: theme.textSecondary }]}>{Math.round(pct)}%</Text>
                )}
            </View>

            <AnimatedBar pct={pct} color="#32ADE6" height={5} />

            <View style={[wt.cupsRow, { marginTop: 14 }]}>
                {Array.from({ length: Math.min(total, 12) }).map((_, i) => {
                    const filled = i < cups;
                    return (
                        <TouchableOpacity
                            key={i}
                            onPress={() => { setCups(i < cups ? i : i + 1); pulse(); }}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons
                                name={filled ? 'cup-water' : 'cup-outline'}
                                size={26}
                                color={filled ? '#32ADE6' : theme.border}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={wt.controls}>
                <TouchableOpacity
                    style={[wt.ctrlBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                    onPress={() => setCups(c => Math.max(0, c - 1))}
                >
                    <MaterialCommunityIcons name="minus" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                <Animated.Text style={[wt.cupsLabel, { color: theme.text, transform: [{ scale: scaleAnim }] }]}>
                    {cups} <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '400' }}>× {ML}ml</Text>
                </Animated.Text>
                <TouchableOpacity
                    style={[wt.ctrlBtn, { backgroundColor: '#32ADE6', borderColor: '#32ADE6' }]}
                    onPress={() => { setCups(c => Math.min(total + 2, c + 1)); pulse(); }}
                >
                    <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
const wt = StyleSheet.create({
    card: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16 },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#32ADE618', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    pctText: { fontSize: 13, fontWeight: '800' },
    cupsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ctrlBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    cupsLabel: { fontSize: 18, fontWeight: '900' },
});

// ─── MealCard ─────────────────────────────────────────────────────────────────
function MealCard({ meal, theme, accent }) {
    const [done, setDone] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const checkAnim = useRef(new Animated.Value(0)).current;

    const toggleDone = () => {
        Animated.spring(checkAnim, { toValue: done ? 0 : 1, useNativeDriver: true, tension: 200 }).start();
        setDone(!done);
    };

    const mealMacros = calcMealMacros(meal);

    const grouped = meal.items.reduce((acc, item) => {
        const key = item.substitutionGroupId || item.id || Math.random().toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const groups = Object.values(grouped);

    return (
        <View style={[mc.card, {
            backgroundColor: theme.surface,
            borderColor: done ? accent + '60' : theme.border,
        }]}>
            {/* Done stripe */}
            {done && <View style={[mc.doneStripe, { backgroundColor: accent }]} />}

            {/* Header */}
            <TouchableOpacity style={mc.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
                <View style={[mc.timeBadge, { backgroundColor: done ? accent + '20' : accent }]}>
                    <Text style={[mc.timeText, { color: done ? accent : (theme.isDark ? '#000' : '#fff') }]}>
                        {meal.time || '--:--'}
                    </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[mc.mealName, { color: done ? theme.textSecondary : theme.text }]} numberOfLines={1}>
                        {done ? '✓ ' : ''}{meal.name}
                    </Text>
                    <View style={mc.macroRow}>
                        <Text style={[mc.macro, { color: accent }]}>{mealMacros.kcal} kcal</Text>
                        <Text style={[mc.macroDot, { color: theme.border }]}>·</Text>
                        <Text style={[mc.macro, { color: '#32ADE6' }]}>P {mealMacros.prot}g</Text>
                        <Text style={[mc.macroDot, { color: theme.border }]}>·</Text>
                        <Text style={[mc.macro, { color: '#FFCC00' }]}>C {mealMacros.carb}g</Text>
                        <Text style={[mc.macroDot, { color: theme.border }]}>·</Text>
                        <Text style={[mc.macro, { color: '#FF6B35' }]}>G {mealMacros.fat}g</Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                        style={[mc.checkBtn, { backgroundColor: done ? accent : theme.bg, borderColor: done ? accent : theme.border }]}
                        onPress={toggleDone}
                        activeOpacity={0.8}
                    >
                        <Animated.View style={{ transform: [{ scale: checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] }) }] }}>
                            <MaterialCommunityIcons
                                name={done ? 'check' : 'circle-outline'}
                                size={16}
                                color={done ? (theme.isDark ? '#000' : '#fff') : theme.textSecondary}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                    <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.textSecondary}
                    />
                </View>
            </TouchableOpacity>

            {/* Food list */}
            {expanded && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                    <View style={[mc.divider, { backgroundColor: theme.border }]} />

                    {groups.map((group, gIdx) => (
                        <View key={gIdx} style={[mc.group, {
                            borderColor: theme.border + '50',
                            marginBottom: gIdx < groups.length - 1 ? 10 : 0,
                            paddingBottom: gIdx < groups.length - 1 ? 10 : 0,
                            borderBottomWidth: gIdx < groups.length - 1 ? 1 : 0,
                            borderStyle: 'dashed',
                        }]}>
                            {group.map((food, fIdx) => (
                                <React.Fragment key={food.id || fIdx}>
                                    {fIdx > 0 && (
                                        <View style={mc.ouRow}>
                                            <View style={[mc.ouLine, { backgroundColor: theme.border }]} />
                                            <View style={[mc.ouBadge, { backgroundColor: accent + '15', borderColor: accent + '35' }]}>
                                                <Text style={[mc.ouText, { color: accent }]}>OU</Text>
                                            </View>
                                            <View style={[mc.ouLine, { backgroundColor: theme.border }]} />
                                        </View>
                                    )}
                                    <View style={mc.foodRow}>
                                        <View style={[mc.foodDot, { backgroundColor: fIdx === 0 ? accent : theme.border }]} />
                                        <Text style={[mc.foodName, { color: fIdx === 0 ? theme.text : theme.textSecondary }]} numberOfLines={2}>
                                            {food.name}
                                        </Text>
                                        <View style={[mc.amtBadge, {
                                            backgroundColor: fIdx === 0 ? accent + '15' : theme.bg,
                                            borderColor: fIdx === 0 ? accent + '40' : theme.border,
                                        }]}>
                                            <Text style={[mc.amtText, { color: fIdx === 0 ? accent : theme.textSecondary }]}>
                                                {food.amount} {food.unit}
                                            </Text>
                                        </View>
                                    </View>
                                </React.Fragment>
                            ))}
                        </View>
                    ))}

                    {!!meal.notes && (
                        <View style={[mc.noteBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="chef-hat" size={13} color={theme.textSecondary} />
                            <Text style={[mc.noteText, { color: theme.textSecondary }]}>{meal.notes}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const mc = StyleSheet.create({
    card: { borderRadius: 20, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
    doneStripe: { height: 3, width: '100%' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    timeBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, minWidth: 52, alignItems: 'center' },
    timeText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    mealName: { fontSize: 14, fontWeight: '900', marginBottom: 3 },
    macroRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
    macro: { fontSize: 10, fontWeight: '700' },
    macroDot: { fontSize: 10 },
    checkBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, marginBottom: 12 },
    group: {},
    foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8 },
    foodDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
    foodName: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
    amtBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
    amtText: { fontSize: 12, fontWeight: '800' },
    ouRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
    ouLine: { flex: 1, height: 1 },
    ouBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, marginHorizontal: 8 },
    ouText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    noteBox: { flexDirection: 'row', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 10, alignItems: 'flex-start' },
    noteText: { flex: 1, fontSize: 11, lineHeight: 16, fontStyle: 'italic' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DietScreen({ route, navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const { height: windowHeight } = useWindowDimensions();
    const RootComponent = isWeb ? View : SafeAreaView;

    const [diet, setDiet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const initialize = async () => {
            try {
                let u = route.params?.userData;
                if (typeof u === 'string') u = JSON.parse(u);
                if (!u || !u.id) {
                    const stored = await AsyncStorage.getItem('user');
                    if (stored) u = JSON.parse(stored);
                }
                if (!u || !u.id) { setLoading(false); return; }
                setUser(u);
                const isElite = u.plan === 'ELITE' || u.plan === 'VIP';
                if (!u.dietModule && !isElite) { setAccessDenied(true); setLoading(false); return; }
                fetchDiet(u.id);
            } catch (e) {
                console.error('Erro na inicialização da Dieta:', e);
                setLoading(false);
            }
        };
        initialize();
    }, []);

    const fetchDiet = async (userId) => {
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/diet/${userId}?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.meals && data.meals.length > 0) {
                    setDiet(data);
                    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
                } else {
                    setDiet(null);
                }
            } else {
                setDiet(null);
            }
        } catch (e) {
            console.error('Erro ao carregar dieta:', e);
            setDiet(null);
        } finally {
            setLoading(false);
        }
    };

    const waterMl = useMemo(() => parseWaterMl(diet?.waterIntake), [diet]);

    const dailyMacros = useMemo(() => {
        if (!diet) return { kcal: 0, prot: 0, carb: 0, fat: 0 };
        return diet.meals.reduce((sum, meal) => {
            const m = calcMealMacros(meal);
            return { kcal: sum.kcal + m.kcal, prot: sum.prot + m.prot, carb: sum.carb + m.carb, fat: sum.fat + m.fat };
        }, { kcal: 0, prot: 0, carb: 0, fat: 0 });
    }, [diet]);

    const handleUpsell = () => {
        const msg = 'Fala, Coach! Gostaria de saber como faço o upgrade do meu plano para ter acesso ao Módulo de Nutrição e Dieta no aplicativo.';
        Linking.openURL(`https://wa.me/5541999999999?text=${encodeURIComponent(msg)}`);
    };

    // ── Upsell ───────────────────────────────────────────────────────────────
    if (!loading && accessDenied) {
        return (
            <RootComponent style={[s.centered, { backgroundColor: theme.bg }]}>
                <View style={[s.stateIconWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="lock-outline" size={40} color={theme.textSecondary} />
                </View>
                <Text style={[s.stateTitle, { color: theme.text }]}>ÁREA RESTRITA</Text>
                <Text style={[s.stateDesc, { color: theme.textSecondary }]}>
                    O módulo de nutrição integrado é exclusivo para alunos do plano completo.
                </Text>
                <TouchableOpacity style={s.whatsBtn} onPress={handleUpsell} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" />
                    <Text style={s.whatsBtnText}>DESBLOQUEAR ACESSO</Text>
                </TouchableOpacity>
            </RootComponent>
        );
    }

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[s.centered, { backgroundColor: theme.bg }]}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{ color: theme.textSecondary, marginTop: 16, fontWeight: '700', letterSpacing: 0.5 }}>
                    Carregando seu plano...
                </Text>
            </View>
        );
    }

    // ── Aguardando ───────────────────────────────────────────────────────────
    if (!diet) {
        return (
            <RootComponent style={[s.centered, { backgroundColor: theme.bg }]}>
                <View style={[s.stateIconWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="chef-hat" size={40} color={theme.accent} />
                </View>
                <Text style={[s.stateTitle, { color: theme.text }]}>QUASE LÁ!</Text>
                <Text style={[s.stateDesc, { color: theme.textSecondary }]}>
                    O Coach está calculando seus macros e finalizando o plano. Volte em breve!
                </Text>
                <TouchableOpacity
                    style={[s.refreshBtn, { borderColor: theme.border }]}
                    onPress={() => user?.id && fetchDiet(user.id)}
                >
                    <MaterialCommunityIcons name="refresh" size={15} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, fontWeight: '700', fontSize: 13 }}>Verificar novamente</Text>
                </TouchableOpacity>
            </RootComponent>
        );
    }

    // ── Dieta completa ────────────────────────────────────────────────────────
    const targetKcal = diet.totalKcal || dailyMacros.kcal || 1;
    const targetProt = diet.totalProtein || dailyMacros.prot || 1;
    const targetCarb = diet.totalCarbs || dailyMacros.carb || 1;
    const targetFat  = diet.totalFats || dailyMacros.fat || 1;

    return (
        <RootComponent style={{
            height: isWeb ? windowHeight : undefined,
            flex: isWeb ? undefined : 1,
            overflow: 'hidden',
            backgroundColor: theme.bg,
        }}>
            <View style={{
                flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%',
                alignSelf: 'center', backgroundColor: theme.bg,
                ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {})
            }}>

                {/* ── CABEÇALHO ── */}
                <View style={[s.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.headerEyebrow, { color: theme.accent }]}>PLANO ALIMENTAR</Text>
                        <Text style={[s.headerTitle, { color: theme.text }]}>{diet.goal || 'Meu Plano'}</Text>
                    </View>
                    <View style={[s.mealsBadge, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40' }]}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={13} color={theme.accent} />
                        <Text style={[s.mealsBadgeText, { color: theme.accent }]}>{diet.meals.length} refeições</Text>
                    </View>
                </View>

                <Animated.ScrollView
                    style={{ flex: 1, opacity: fadeAnim }}
                    contentContainerStyle={{ paddingBottom: 110 }}
                >
                    {/* ── MACROS DIÁRIOS ── */}
                    <View style={[s.macroSection, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                        <View style={s.macroTopRow}>
                            <View>
                                <Text style={[s.macroKcal, { color: theme.text }]}>{targetKcal}</Text>
                                <Text style={[s.macroKcalLabel, { color: theme.textSecondary }]}>kcal / dia</Text>
                            </View>
                            <View style={[s.waterPill, { backgroundColor: '#32ADE6' + '15', borderColor: '#32ADE6' + '35' }]}>
                                <MaterialCommunityIcons name="water" size={13} color="#32ADE6" />
                                <Text style={{ color: '#32ADE6', fontSize: 11, fontWeight: '800' }}>{diet.waterIntake}</Text>
                            </View>
                        </View>
                        <View style={s.macroGrid}>
                            <MacroPill label="PROTEÍNA" value={targetProt} unit="g" color="#32ADE6" pct={Math.min((dailyMacros.prot / targetProt) * 100, 100)} />
                            <MacroPill label="CARBOIDRATO" value={targetCarb} unit="g" color="#FFCC00" pct={Math.min((dailyMacros.carb / targetCarb) * 100, 100)} />
                            <MacroPill label="GORDURA" value={targetFat} unit="g" color="#FF6B35" pct={Math.min((dailyMacros.fat / targetFat) * 100, 100)} />
                        </View>
                    </View>

                    <View style={{ padding: 16 }}>

                        {/* ── WATER TRACKER ── */}
                        <WaterTracker targetMl={waterMl} theme={theme} />

                        {/* ── OBSERVAÇÕES DO COACH ── */}
                        {!!diet.generalNotes && (
                            <View style={[s.notesBox, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '35' }]}>
                                <View style={[s.notesIconWrap, { backgroundColor: theme.accent + '20' }]}>
                                    <MaterialCommunityIcons name="bullhorn-outline" size={16} color={theme.accent} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[s.notesLabel, { color: theme.accent }]}>RECADO DO COACH</Text>
                                    <Text style={[s.notesText, { color: theme.text }]}>{diet.generalNotes}</Text>
                                </View>
                            </View>
                        )}

                        {/* ── REFEIÇÕES ── */}
                        <View style={s.sectionRow}>
                            <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>REFEIÇÕES DIÁRIAS</Text>
                            <Text style={[s.sectionHint, { color: theme.textSecondary }]}>toque para expandir</Text>
                        </View>

                        {diet.meals.map((meal) => (
                            <MealCard key={meal.id} meal={meal} theme={theme} accent={theme.accent} />
                        ))}

                    </View>
                </Animated.ScrollView>
            </View>
        </RootComponent>
    );
}

const s = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    stateIconWrap: { width: 84, height: 84, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
    stateTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, textAlign: 'center' },
    stateDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 16 },
    whatsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#25D366', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 16 },
    whatsBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1, marginTop: 4 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1 },
    headerEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 3 },
    headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    mealsBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    mealsBadgeText: { fontSize: 11, fontWeight: '800' },

    macroSection: { paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1 },
    macroTopRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
    macroKcal: { fontSize: 36, fontWeight: '900', letterSpacing: -1.5 },
    macroKcalLabel: { fontSize: 11, fontWeight: '700', marginTop: -4 },
    waterPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    macroGrid: { flexDirection: 'row', gap: 8 },

    notesBox: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16, alignItems: 'flex-start' },
    notesIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    notesLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    notesText: { fontSize: 13, lineHeight: 20 },

    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    sectionHint: { fontSize: 10 },
});