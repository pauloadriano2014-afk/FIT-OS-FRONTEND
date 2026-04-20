// src/components/AdminDiet/MealCardAdmin.js
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MealCardAdmin({ 
    meal, theme, toGrams, handleOpenNameSelect, handleOpenTimeSelect, 
    handleDeleteMeal, handleUpdateFoodAmount, handleToggleUnit, 
    handleDeleteFood, handleOpenSearch, handleMealOptions, handleSwapBaseFood
}) {
    const grouped = meal.items.reduce((acc, item) => {
        if (!acc[item.groupId]) acc[item.groupId] = [];
        acc[item.groupId].push(item);
        return acc;
    }, {});

    const mealKcal = Object.values(grouped).reduce((sum, grp) => {
        const item = grp[0];
        return sum + ((item.calories_per_100 || 0) * toGrams(item.amount, item.unit, item)) / 100;
    }, 0);

    return (
        <View style={[styles.mealCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            {/* 🔥 CABEÇALHO REESTRUTURADO E DESTACADO 🔥 */}
            <View style={[styles.mealHeader, { backgroundColor: theme.bg }]}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => handleOpenNameSelect(meal.id)}>
                    <Text style={[styles.mealName, { color: theme.text }]}>{meal.name?.toUpperCase()}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4}}>
                        <MaterialCommunityIcons name="fire" size={14} color={theme.accent} />
                        <Text style={[styles.mealKcal, { color: theme.accent }]}>{Math.round(mealKcal)} kcal total na refeição</Text>
                    </View>
                </TouchableOpacity>

                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <TouchableOpacity
                        style={[styles.timePill, { backgroundColor: theme.surface, borderColor: theme.accent }]}
                        onPress={() => handleOpenTimeSelect(meal.id)}
                    >
                        <MaterialCommunityIcons name="clock-outline" size={14} color={theme.accent} />
                        <Text style={[styles.timePillText, { color: theme.text }]}>{meal.time || '--:--'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleMealOptions(meal.id, meal.name)} style={[styles.actionIconBtn, {backgroundColor: theme.surface, borderColor: theme.border}]}>
                        <MaterialCommunityIcons name="dots-horizontal" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDeleteMeal(meal.id)} style={[styles.actionIconBtn, {backgroundColor: '#FF3B3015', borderColor: '#FF3B3050'}]}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.mealDivider, { backgroundColor: theme.border }]} />

            {Object.values(grouped).map((group, index) => {
                const principal = group[0];
                const pAmt = toGrams(principal.amount, principal.unit, principal);
                const pKcal = ((principal.calories_per_100 || 0) * pAmt) / 100;
                const pProt = ((principal.p || 0) * pAmt) / 100;
                const pCarb = ((principal.c || 0) * pAmt) / 100;
                const pFat = ((principal.f || 0) * pAmt) / 100;

                return (
                    <View key={principal.groupId} style={[styles.groupBox, { borderColor: theme.border + '80' }, index > 0 && { borderTopWidth: 1, paddingTop: 15 }]}>
                        {group.map((food, fIdx) => {
                            const isSub = fIdx > 0;
                            const fAmt = toGrams(food.amount, food.unit, food);
                            const fKcal = ((food.calories_per_100 || 0) * fAmt) / 100;
                            const fProt = ((food.p || 0) * fAmt) / 100;
                            const fCarb = ((food.c || 0) * fAmt) / 100;
                            const fFat = ((food.f || 0) * fAmt) / 100;

                            const dKcal = isSub ? Math.round(fKcal - pKcal) : 0;
                            const dProt = isSub ? Math.round(fProt - pProt) : 0;
                            const dCarb = isSub ? Math.round(fCarb - pCarb) : 0;
                            const dFat = isSub ? Math.round(fFat - pFat) : 0;
                            const isPerf = isSub && dKcal === 0 && dProt === 0 && dCarb === 0 && dFat === 0;

                            return (
                                <React.Fragment key={food.uniqueId}>
                                    {isSub && (
                                        <View style={styles.ouRow}>
                                            <View style={[styles.ouLine, { backgroundColor: theme.border }]} />
                                            <View style={[styles.ouBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
                                                <Text style={[styles.ouText, { color: theme.accent }]}>SUBSTITUTO (OU)</Text>
                                            </View>
                                            <View style={[styles.ouLine, { backgroundColor: theme.border }]} />
                                        </View>
                                    )}

                                    {/* 🔥 DESIGN PREMIUM: CARD DO ALIMENTO PRINCIPAL x SUBSTITUTO 🔥 */}
                                    <View style={[
                                        styles.foodRow, 
                                        isSub 
                                            ? { backgroundColor: theme.bg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' } 
                                            : { backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: theme.accent, shadowColor: theme.accent, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }
                                    ]}>
                                        
                                        {!isSub && (
                                            <View style={[styles.baseBadge, { backgroundColor: theme.accent }]}>
                                                <Text style={styles.baseBadgeText}>ALIMENTO BASE</Text>
                                            </View>
                                        )}

                                        <View style={{ flex: 1, paddingRight: 10 }}>
                                            <Text style={[styles.foodName, { color: theme.text }, !isSub && { fontSize: 15, fontWeight: '900' }]} numberOfLines={2}>
                                                {food.name}
                                            </Text>
                                            <Text style={[styles.foodKcal, { color: theme.accent }, !isSub && { fontSize: 12, marginTop: 4 }]}>
                                                {Math.round(fKcal)} kcal
                                            </Text>
                                            {isSub && !isPerf && (
                                                <View style={styles.diffRow}>
                                                    {dKcal !== 0 && <Text style={[styles.diffChip, { color: dKcal > 0 ? '#FF3B30' : '#32ADE6' }]}>{dKcal > 0 ? '▲' : '▼'} {Math.abs(dKcal)} kcal</Text>}
                                                    {dProt !== 0 && <Text style={[styles.diffChip, { color: dProt > 0 ? '#FF3B30' : '#32ADE6' }]}>{dProt > 0 ? '▲' : '▼'} {Math.abs(dProt)}P</Text>}
                                                    {dCarb !== 0 && <Text style={[styles.diffChip, { color: dCarb > 0 ? '#FF3B30' : '#32ADE6' }]}>{dCarb > 0 ? '▲' : '▼'} {Math.abs(dCarb)}C</Text>}
                                                    {dFat !== 0 && <Text style={[styles.diffChip, { color: dFat > 0 ? '#FF3B30' : '#32ADE6' }]}>{dFat > 0 ? '▲' : '▼'} {Math.abs(dFat)}G</Text>}
                                                </View>
                                            )}
                                            {isPerf && (
                                                <Text style={{ fontSize: 10, color: '#34C759', fontWeight: '700', marginTop: 4 }}>✓ Equivalente Perfeito</Text>
                                            )}
                                        </View>

                                        <View style={styles.amountBox}>
                                            <TextInput
                                                style={[styles.amountInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }, !isSub && { height: 40, width: 60, fontSize: 16 }]}
                                                value={food.amount.toString()}
                                                onChangeText={val => handleUpdateFoodAmount(meal.id, food.uniqueId, val)}
                                                keyboardType="numeric"
                                                maxLength={5}
                                            />
                                            <TouchableOpacity
                                                onPress={() => handleToggleUnit(meal.id, food.uniqueId)}
                                                style={[styles.unitBtn, { borderColor: theme.border }, !isSub && { height: 40, justifyContent: 'center' }]}
                                            >
                                                <Text style={[styles.unitText, { color: theme.textSecondary }, !isSub && { fontSize: 11 }]}>{food.unit}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* 🔥 BOTÃO DE TROCAR A BASE (Apenas no alimento principal) */}
                                        {!isSub ? (
                                            <TouchableOpacity onPress={() => handleSwapBaseFood && handleSwapBaseFood(meal.id, food)} style={[styles.actionIconBtn, { marginLeft: 8, backgroundColor: theme.bg, borderColor: theme.border }]}>
                                                <MaterialCommunityIcons name="swap-horizontal" size={18} color={theme.text} />
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity onPress={() => handleDeleteFood(meal.id, food.uniqueId)} style={[styles.actionIconBtn, { marginLeft: 8, backgroundColor: '#FF3B3015', borderColor: 'transparent' }]}>
                                                <MaterialCommunityIcons name="close" size={16} color="#FF3B30" />
                                            </TouchableOpacity>
                                        )}
                                        
                                    </View>
                                </React.Fragment>
                            );
                        })}

                        <TouchableOpacity
                            style={[styles.subBtn, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '08' }]}
                            onPress={() => handleOpenSearch(meal.id, principal.groupId)}
                        >
                            <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
                            <Text style={[styles.subBtnText, { color: theme.accent }]}>Adicionar Substituto a este grupo</Text>
                        </TouchableOpacity>
                    </View>
                );
            })}

            <TouchableOpacity
                style={[styles.addFoodBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                onPress={() => handleOpenSearch(meal.id, null)}
            >
                <MaterialCommunityIcons name="plus" size={16} color={theme.textSecondary} />
                <Text style={[styles.addFoodText, { color: theme.textSecondary }]}>NOVO ALIMENTO BASE</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    mealCard: { borderRadius: 20, borderWidth: 1, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
    mealHeader: { padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    mealName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    mealKcal: { fontSize: 12, fontWeight: '800' },
    timePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
    timePillText: { fontSize: 13, fontWeight: '900' },
    actionIconBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    mealDivider: { height: 1, width: '100%' },
    
    groupBox: { marginHorizontal: 16, paddingBottom: 16 },
    
    foodRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, position: 'relative' },
    baseBadge: { position: 'absolute', top: -10, left: 16, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, zIndex: 10 },
    baseBadgeText: { fontSize: 8, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
    
    foodName: { fontSize: 13, fontWeight: '700', marginBottom: 2, lineHeight: 18 },
    foodKcal: { fontSize: 11, fontWeight: '800' },
    diffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    diffChip: { fontSize: 10, fontWeight: '800' },
    
    amountBox: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
    amountInput: { width: 56, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, borderWidth: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', outlineStyle: 'none' },
    unitBtn: { paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginLeft: 4, alignItems: 'center' },
    unitText: { fontSize: 10, fontWeight: '800' },
    
    ouRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
    ouLine: { flex: 1, height: 1 },
    ouBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginHorizontal: 10 },
    ouText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    
    subBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 12 },
    subBtnText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    
    addFoodBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 16, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed' },
    addFoodText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});