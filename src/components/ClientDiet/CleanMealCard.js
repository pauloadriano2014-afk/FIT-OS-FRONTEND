// src/components/ClientDiet/CleanMealCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MealVersionSwitcher from './MealVersionSwitcher';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getMacroCategory = (food) => {
    const name = String(food.name || '').toLowerCase();

    if (name.includes('queijo') || name.includes('leite') || name.includes('iogurte') ||
        name.includes('mussarela') || name.includes('requeijão') || name.includes('cottage'))
        return 'LATICÍNIOS';

    if (name.includes('alface') || name.includes('tomate') || name.includes('brócolis') ||
        name.includes('cenoura') || name.includes('abóbora') || name.includes('salada') ||
        name.includes('vegetais') || name.includes('pepino') || name.includes('rúcula') ||
        name.includes('espinafre') || name.includes('couve') || name.includes('cebola'))
        return 'VEGETAIS E VERDURAS';

    if (name.includes('banana') || name.includes('maçã') || name.includes('morango') ||
        name.includes('uva') || name.includes('abacaxi') || name.includes('mamão') ||
        name.includes('melão') || name.includes('melancia') || name.includes('laranja') ||
        name.includes('pera') || name.includes('kiwi'))
        return 'FRUTAS';

    if (name.includes('whey') || name.includes('albumina') || name.includes('creatina'))
        return 'FONTE DE PROTEÍNA';

    const p   = parseFloat(food.protein  ?? food.p ?? 0);
    const c   = parseFloat(food.carbs    ?? food.c ?? 0);
    const fat = parseFloat(food.fats     ?? food.f ?? 0);
    const max = Math.max(p, c, fat);
    if (max === 0) return 'ACOMPANHAMENTO / LIVRE';
    if (max === p) return 'FONTE DE PROTEÍNA';
    if (max === c) return 'FONTE DE CARBOIDRATO';
    return 'FONTE DE GORDURA';
};

const getMealBgImage = (mealName) => {
    const n = String(mealName).toLowerCase();
    if (n.includes('café') || n.includes('cafe') || n.includes('desjejum'))
        return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=500';
    if (n.includes('almoço') || n.includes('almoco'))
        return 'https://images.unsplash.com/photo-1544025162-811114cd3543?auto=format&fit=crop&q=80&w=500';
    if (n.includes('janta'))
        return 'https://images.unsplash.com/photo-1551326844-4fd41d15db7f?auto=format&fit=crop&q=80&w=500';
    if (n.includes('pré') || n.includes('pre'))
        return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=500';
    if (n.includes('pós') || n.includes('pos'))
        return 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80&w=500';
    if (n.includes('ceia'))
        return 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&q=80&w=500';
    return 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=500';
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function CleanMealCard({ meal, theme, isChecked, onToggleCheck }) {
    const [showSubs, setShowSubs]           = useState({});
    const [activeMeal, setActiveMeal]       = useState(meal); // 🔥 versão ativa (principal ou alternativa)

    const bgImage = getMealBgImage(activeMeal.name);

    const grouped = activeMeal.items.reduce((acc, item) => {
        const key = item.substitutionGroupId || item.groupId || item.id || Math.random().toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    const groups = Object.values(grouped);

    const toggleSubs = (idx) =>
        setShowSubs(prev => ({ ...prev, [idx]: !prev[idx] }));

    const isAlt = activeMeal.id !== meal.id;

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: theme.surface,
                borderColor: isChecked ? theme.accent : isAlt ? '#FF9500' : theme.border,
                opacity: isChecked ? 0.6 : 1,
            },
        ]}>
            <Image source={{ uri: bgImage }} style={styles.bgImage} resizeMode="cover" />
            <View style={[styles.bgOverlay, { backgroundColor: theme.surface }]} />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <View style={[styles.timeBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                            {activeMeal.time || '--:--'}
                        </Text>
                    </View>
                    <Text style={[styles.mealTitle, { color: theme.text }]}>
                        {activeMeal.name?.toUpperCase()}
                    </Text>

                    {/* 🔥 Badge de versão alternativa ativa */}
                    {isAlt && (
                        <View style={[styles.altBadge, { backgroundColor: '#FF950020', borderColor: '#FF950060' }]}>
                            <MaterialCommunityIcons name="swap-horizontal" size={11} color="#FF9500" />
                            <Text style={[styles.altBadgeText, { color: '#FF9500' }]}>
                                {activeMeal.alternativeLabel?.toUpperCase() ?? 'VERSÃO ALTERNATIVA'}
                            </Text>
                            {/* Voltar para a principal */}
                            <TouchableOpacity onPress={() => setActiveMeal(meal)} style={styles.resetBtn}>
                                <Text style={{ fontSize: 9, fontWeight: '900', color: '#FF9500' }}>VOLTAR</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={[
                        styles.checkBtn,
                        isChecked
                            ? { backgroundColor: theme.accent, borderColor: theme.accent }
                            : { backgroundColor: theme.bg,     borderColor: theme.border  },
                    ]}
                    onPress={() => onToggleCheck(meal.id)}
                >
                    <MaterialCommunityIcons
                        name="check"
                        size={24}
                        color={isChecked ? '#000' : theme.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* 🔥 SELETOR DE VERSÃO ALTERNATIVA */}
            <MealVersionSwitcher
                meal={meal}
                theme={theme}
                onVersionChange={(version) => {
                    setActiveMeal(version);
                    setShowSubs({});
                }}
            />

            {/* GRUPOS DE ALIMENTOS */}
            <View style={[styles.foodList, { marginTop: meal.alternatives?.length > 0 ? 12 : 0 }]}>
                {groups.map((group, gIdx) => {
                    const macroCategory = getMacroCategory(group[0]);
                    const mainFood      = group[0];
                    const substitutes   = group.slice(1);
                    const isShowingSubs = !!showSubs[gIdx];

                    return (
                        <View key={gIdx} style={styles.foodGroup}>
                            <Text style={[styles.macroTag, { color: theme.accent }]}>
                                🎯 {macroCategory}
                            </Text>

                            <View style={[styles.mainFoodCard, { backgroundColor: 'rgba(77,227,143,0.10)', borderColor: '#4DE38F' }]}>
                                <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={2}>
                                    {mainFood.amount} {mainFood.unit} de {mainFood.name?.toUpperCase()}
                                </Text>
                            </View>

                            {substitutes.length > 0 && (
                                <>
                                    <TouchableOpacity
                                        style={styles.showSubsBtn}
                                        onPress={() => toggleSubs(gIdx)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.showSubsText, { color: theme.textSecondary }]}>
                                            {isShowingSubs
                                                ? 'Ocultar opções de troca'
                                                : `Substituir este alimento? (+${substitutes.length})`}
                                        </Text>
                                        <MaterialCommunityIcons
                                            name={isShowingSubs ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color={theme.textSecondary}
                                        />
                                    </TouchableOpacity>

                                    {isShowingSubs && substitutes.map((sub, sIdx) => (
                                        <View
                                            key={sIdx}
                                            style={[styles.subCard, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                        >
                                            <Text style={[styles.subName, { color: theme.textSecondary }]} numberOfLines={2}>
                                                {sub.amount} {sub.unit} de {sub.name?.toUpperCase()}
                                            </Text>
                                            <MaterialCommunityIcons name="swap-horizontal" size={16} color={theme.textSecondary} />
                                        </View>
                                    ))}
                                </>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* OBSERVAÇÃO DO COACH */}
            {!!activeMeal.notes && (
                <View style={[styles.noteBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]}>
                    <MaterialCommunityIcons name="bullhorn-outline" size={16} color={theme.accent} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 }}>
                            O COACH AVISA:
                        </Text>
                        <Text style={[styles.noteText, { color: theme.text }]}>{activeMeal.notes}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24, padding: 20, marginBottom: 20,
        borderWidth: 1, position: 'relative', overflow: 'hidden',
    },
    bgImage: {
        position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
        width: '100%', height: '100%', opacity: 0.15,
    },
    bgOverlay: {
        position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
        width: '100%', height: '100%', opacity: 0.6,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 8, zIndex: 2,
    },
    timeBadge: {
        alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
        gap: 5, paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 10, borderWidth: 1, marginBottom: 10,
    },
    timeText:     { fontSize: 11, fontWeight: 'bold' },
    mealTitle:    { fontSize: 22, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
    altBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    altBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    resetBtn:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FF950030', marginLeft: 4 },
    checkBtn: {
        width: 46, height: 46, borderRadius: 23,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center', elevation: 3,
    },
    foodList:  { gap: 20, zIndex: 2 },
    foodGroup: { gap: 8 },
    macroTag:  { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    mainFoodCard: { padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 4 },
    foodName:  { fontSize: 14, fontWeight: '900', fontStyle: 'italic', lineHeight: 20 },
    showSubsBtn: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4,
    },
    showSubsText: { fontSize: 11, fontWeight: '700' },
    subCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginTop: 6,
    },
    subName:  { fontSize: 13, fontWeight: '600', flex: 1 },
    noteBox: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginTop: 25, padding: 16, borderRadius: 16, borderWidth: 1, zIndex: 2,
    },
    noteText: { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
});