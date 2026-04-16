// src/components/AdminDiet/MealCardAdmin.js
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MealCardAdmin({ 
    meal, theme, toGrams, handleOpenNameSelect, handleOpenTimeSelect, 
    handleDeleteMeal, handleUpdateFoodAmount, handleToggleUnit, 
    handleDeleteFood, handleOpenSearch, handleMealOptions 
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
            <View style={styles.mealHeader}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => handleOpenNameSelect(meal.id)}>
                    <Text style={[styles.mealName, { color: theme.text }]}>{meal.name}</Text>
                    <Text style={[styles.mealKcal, { color: theme.accent }]}>{Math.round(mealKcal)} kcal total</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.timePill, { backgroundColor: theme.bg, borderColor: theme.border }]}
                    onPress={() => handleOpenTimeSelect(meal.id)}
                >
                    <MaterialCommunityIcons name="clock-outline" size={13} color={theme.textSecondary} />
                    <Text style={[styles.timePillText, { color: theme.text }]}>{meal.time}</Text>
                </TouchableOpacity>

                {/* 🔥 ATUALIZADO: Botão de Ações da Refeição */}
                <TouchableOpacity onPress={() => handleMealOptions(meal.id, meal.name)} style={styles.moreBtn}>
                    <MaterialCommunityIcons name="dots-vertical" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDeleteMeal(meal.id)} style={styles.deleteMealBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                </TouchableOpacity>
            </View>

            <View style={[styles.mealDivider, { backgroundColor: theme.border }]} />

            {Object.values(grouped).map(group => {
                const principal = group[0];
                const pAmt = toGrams(principal.amount, principal.unit, principal);
                const pKcal = ((principal.calories_per_100 || 0) * pAmt) / 100;
                const pProt = ((principal.p || 0) * pAmt) / 100;
                const pCarb = ((principal.c || 0) * pAmt) / 100;
                const pFat = ((principal.f || 0) * pAmt) / 100;

                return (
                    <View key={principal.groupId} style={[styles.groupBox, { borderColor: theme.border + '80' }]}>
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
                                                <Text style={[styles.ouText, { color: theme.accent }]}>OU</Text>
                                            </View>
                                            <View style={[styles.ouLine, { backgroundColor: theme.border }]} />
                                        </View>
                                    )}

                                    <View style={[styles.foodRow, isSub && { backgroundColor: theme.bg, borderRadius: 10, padding: 8 }]}>
                                        <View style={{ flex: 1, paddingRight: 8 }}>
                                            <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={2}>
                                                {food.name}
                                            </Text>
                                            <Text style={[styles.foodKcal, { color: theme.accent }]}>
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
                                                <Text style={{ fontSize: 10, color: '#34C759', fontWeight: '700', marginTop: 3 }}>✓ Equivalente Perfeito</Text>
                                            )}
                                        </View>

                                        <View style={styles.amountBox}>
                                            <TextInput
                                                style={[styles.amountInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                                value={food.amount.toString()}
                                                onChangeText={val => handleUpdateFoodAmount(meal.id, food.uniqueId, val)}
                                                keyboardType="numeric"
                                                maxLength={5}
                                            />
                                            <TouchableOpacity
                                                onPress={() => handleToggleUnit(meal.id, food.uniqueId)}
                                                style={[styles.unitBtn, { borderColor: theme.border }]}
                                            >
                                                <Text style={[styles.unitText, { color: theme.textSecondary }]}>{food.unit}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity onPress={() => handleDeleteFood(meal.id, food.uniqueId)} style={styles.deleteBtn}>
                                            <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </React.Fragment>
                            );
                        })}

                        <TouchableOpacity
                            style={[styles.subBtn, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '08' }]}
                            onPress={() => handleOpenSearch(meal.id, principal.groupId)}
                        >
                            <MaterialCommunityIcons name="swap-horizontal" size={14} color={theme.accent} />
                            <Text style={[styles.subBtnText, { color: theme.accent }]}>Adicionar Substituição (OU)</Text>
                        </TouchableOpacity>
                    </View>
                );
            })}

            <TouchableOpacity
                style={[styles.addFoodBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                onPress={() => handleOpenSearch(meal.id, null)}
            >
                <MaterialCommunityIcons name="plus" size={15} color={theme.textSecondary} />
                <Text style={[styles.addFoodText, { color: theme.textSecondary }]}>ADICIONAR ALIMENTO</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    mealCard: { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    mealHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    mealName: { fontSize: 16, fontWeight: '900', marginBottom: 2 },
    mealKcal: { fontSize: 11, fontWeight: '600' },
    timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, marginLeft: 10 },
    timePillText: { fontSize: 12, fontWeight: '800' },
    moreBtn: { padding: 8, marginLeft: 6 },
    deleteMealBtn: { padding: 8, marginLeft: 2 },
    mealDivider: { height: 1, marginHorizontal: 16 },
    groupBox: { marginHorizontal: 12, marginTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderStyle: 'dashed' },
    foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    foodName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    foodKcal: { fontSize: 11, fontWeight: '700' },
    diffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 3 },
    diffChip: { fontSize: 9, fontWeight: '800' },
    amountBox: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
    amountInput: { width: 52, paddingVertical: 7, paddingHorizontal: 4, borderRadius: 9, borderWidth: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', outlineStyle: 'none' },
    unitBtn: { paddingHorizontal: 6, paddingVertical: 7, borderRadius: 9, borderWidth: 1, marginLeft: 4, alignItems: 'center' },
    unitText: { fontSize: 9, fontWeight: '800' },
    deleteBtn: { padding: 8, marginLeft: 2 },
    ouRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    ouLine: { flex: 1, height: 1 },
    ouBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 1, marginHorizontal: 8 },
    ouText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    subBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, marginTop: 8, alignSelf: 'flex-start' },
    subBtnText: { fontSize: 11, fontWeight: '700' },
    addFoodBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 12, marginTop: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
    addFoodText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }
});