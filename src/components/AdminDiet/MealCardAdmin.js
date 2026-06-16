// src/components/AdminDiet/MealCardAdmin.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getMacro } from '../../utils/dietUtils';
import AlternativeMealManager from './AlternativeMealManager';

export default function MealCardAdmin({ 
    meal, index, totalMeals, theme, toGrams,
    handleOpenNameSelect, handleOpenTimeSelect, 
    handleDeleteMeal, handleMoveMeal, handleUpdateFoodAmount, handleToggleUnit, 
    handleDeleteFood, handleOpenSearch, handleMealOptions, handleSwapBaseFood,
    handleUpdateMeal,
    onAnalyzeMeal,
    // 🔥 versões alternativas
    mealTemplatesList,
    allMeals,
    onApplyAsAlternative,
}) {
    const [isExpanded, setIsExpanded] = useState(meal.items.length === 0);

    const toggleExpand = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsExpanded(!isExpanded);
    };

    const grouped = meal.items.reduce((acc, item) => {
        if (!acc[item.groupId]) acc[item.groupId] = [];
        acc[item.groupId].push(item);
        return acc;
    }, {});

    const mealKcal = Object.values(grouped).reduce((sum, grp) => {
        const item = grp[0];
        if (!item) return sum;
        return sum + (getMacro(item, 'kcal') * toGrams(item.amount, item.unit, item)) / 100;
    }, 0);

    const softBg  = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const hasItems = meal.items.length > 0;

    // Versão alternativa: borda laranja tracejada para distinguir da principal
    const isAlt = meal.isMainVersion === false || meal.isMainVersion === 0;

    return (
        <View style={[
            styles.mealCard,
            { backgroundColor: theme.surface },
            isAlt && { borderWidth: 1.5, borderColor: '#FF9500', borderStyle: 'dashed' },
        ]}>

            {/* Badge de versão alternativa */}
            {isAlt && (
                <View style={[styles.altBadge, { backgroundColor: '#FF9500' }]}>
                    <MaterialCommunityIcons name="swap-vertical" size={10} color="#000" />
                    <Text style={styles.altBadgeText}>{meal.alternativeLabel || 'VERSÃO ALTERNATIVA'}</Text>
                </View>
            )}

            <View style={[styles.mealHeader, { backgroundColor: theme.surface }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <TouchableOpacity 
                        style={{ flex: 1, paddingRight: 10 }} 
                        onPress={() => { Haptics.selectionAsync(); handleOpenNameSelect(meal.id); }}
                        activeOpacity={0.7}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.mealName, { color: theme.text }]}>{meal.name?.toUpperCase()}</Text>
                            <MaterialCommunityIcons name="pencil-circle" size={18} color={theme.textSecondary} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <MaterialCommunityIcons name="fire" size={14} color={theme.accent} />
                            <Text style={[styles.mealKcal, { color: theme.accent }]}>{Math.round(mealKcal)} kcal total na refeição</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.accordionBtn, { backgroundColor: softBg }]} onPress={toggleExpand}>
                        <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                    <TouchableOpacity
                        style={[styles.timePill, { backgroundColor: theme.accent + '15' }]}
                        onPress={() => { Haptics.selectionAsync(); handleOpenTimeSelect(meal.id); }}
                    >
                        <MaterialCommunityIcons name="clock-outline" size={16} color={theme.accent} />
                        <Text style={[styles.timePillText, { color: theme.accent }]}>{meal.time || '--:--'}</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>

                        {/* Botão analisar */}
                        {hasItems && onAnalyzeMeal && (
                            <TouchableOpacity
                                onPress={() => { Haptics.selectionAsync(); onAnalyzeMeal(meal); }}
                                style={[styles.analyzeBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]}
                            >
                                <MaterialCommunityIcons name="robot-outline" size={14} color={theme.accent} />
                                <Text style={[styles.analyzeBtnText, { color: theme.accent }]}>Analisar</Text>
                            </TouchableOpacity>
                        )}

                        {/* 🔥 Botão versão alternativa — só na refeição principal */}
                        {!isAlt && onApplyAsAlternative && (
                            <AlternativeMealManager
                                meal={meal}
                                theme={theme}
                                mealTemplatesList={mealTemplatesList}
                                allMeals={allMeals}
                                onApplyAsAlternative={onApplyAsAlternative}
                            />
                        )}

                        <View style={{ flexDirection: 'row', backgroundColor: softBg, borderRadius: 14, overflow: 'hidden' }}>
                            <TouchableOpacity 
                                style={[styles.moveBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleMoveMeal && handleMoveMeal(meal.id, 'up'); }}
                                disabled={index === 0}
                            >
                                <MaterialCommunityIcons name="arrow-up" size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                            <View style={{ width: 1, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
                            <TouchableOpacity 
                                style={[styles.moveBtn, { opacity: index === totalMeals - 1 ? 0.3 : 1 }]}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleMoveMeal && handleMoveMeal(meal.id, 'down'); }}
                                disabled={index === totalMeals - 1}
                            >
                                <MaterialCommunityIcons name="arrow-down" size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); handleMealOptions(meal.id, meal.name); }} style={[styles.actionIconBtn, { backgroundColor: softBg }]}>
                            <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); handleDeleteMeal(meal.id); }} style={[styles.actionIconBtn, { backgroundColor: '#FF3B3015' }]}>
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {isExpanded && (
                <View style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : '#F9F9F9', paddingTop: 16 }}>
                    {Object.values(grouped).map((group, index) => {
                        const principal = group[0];
                        const pAmt  = toGrams(principal.amount, principal.unit, principal);
                        const pKcal = (getMacro(principal, 'kcal') * pAmt) / 100;
                        const pProt = (getMacro(principal, 'p')    * pAmt) / 100;
                        const pCarb = (getMacro(principal, 'c')    * pAmt) / 100;
                        const pFat  = (getMacro(principal, 'f')    * pAmt) / 100;

                        return (
                            <View key={principal.groupId} style={[styles.groupBox, index > 0 && { borderTopWidth: 1, borderTopColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', paddingTop: 20 }]}>
                                {group.map((food, fIdx) => {
                                    const isSub  = fIdx > 0;
                                    const fAmt   = toGrams(food.amount, food.unit, food);
                                    const fKcal  = (getMacro(food, 'kcal') * fAmt) / 100;
                                    const fProt  = (getMacro(food, 'p')    * fAmt) / 100;
                                    const fCarb  = (getMacro(food, 'c')    * fAmt) / 100;
                                    const fFat   = (getMacro(food, 'f')    * fAmt) / 100;
                                    const dKcal  = isSub ? Math.round(fKcal - pKcal) : 0;
                                    const dProt  = isSub ? Math.round(fProt - pProt) : 0;
                                    const dCarb  = isSub ? Math.round(fCarb - pCarb) : 0;
                                    const dFat   = isSub ? Math.round(fFat  - pFat)  : 0;
                                    const isPerf = isSub && dKcal === 0 && dProt === 0 && dCarb === 0 && dFat === 0;

                                    return (
                                        <React.Fragment key={food.uniqueId}>
                                            {isSub && (
                                                <View style={styles.ouRow}>
                                                    <View style={[styles.ouLine, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                                                    <View style={[styles.ouBadge, { backgroundColor: theme.accent + '20' }]}>
                                                        <Text style={[styles.ouText, { color: theme.accent }]}>SUBSTITUTO (OU)</Text>
                                                    </View>
                                                    <View style={[styles.ouLine, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                                                </View>
                                            )}

                                            <View style={[
                                                styles.foodRow,
                                                isSub
                                                    ? { backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderStyle: 'dashed' }
                                                    : { backgroundColor: theme.surface, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }
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
                                                            {dFat  !== 0 && <Text style={[styles.diffChip, { color: dFat  > 0 ? '#FF3B30' : '#32ADE6' }]}>{dFat  > 0 ? '▲' : '▼'} {Math.abs(dFat)}G</Text>}
                                                        </View>
                                                    )}
                                                    {isPerf && <Text style={{ fontSize: 10, color: '#34C759', fontWeight: '700', marginTop: 4 }}>✓ Equivalente Perfeito</Text>}
                                                </View>

                                                <View style={styles.amountBox}>
                                                    <TextInput
                                                        style={[styles.amountInput, { backgroundColor: softBg, color: theme.text }, !isSub && { height: 44, width: 64, fontSize: 16 }]}
                                                        value={food.amount.toString()}
                                                        onChangeText={val => handleUpdateFoodAmount(meal.id, food.uniqueId, val)}
                                                        keyboardType="numeric"
                                                        maxLength={5}
                                                    />
                                                    <TouchableOpacity
                                                        onPress={() => { Haptics.selectionAsync(); handleToggleUnit(meal.id, food.uniqueId); }}
                                                        style={[styles.unitBtn, { backgroundColor: softBg }, !isSub && { height: 44, justifyContent: 'center' }]}
                                                    >
                                                        <Text style={[styles.unitText, { color: theme.textSecondary }, !isSub && { fontSize: 11 }]}>{food.unit}</Text>
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                                                    {!isSub && (
                                                        <TouchableOpacity onPress={() => handleSwapBaseFood && handleSwapBaseFood(meal.id, food)} style={[styles.actionIconBtn, { backgroundColor: softBg }]}>
                                                            <MaterialCommunityIcons name="swap-horizontal" size={20} color={theme.text} />
                                                        </TouchableOpacity>
                                                    )}
                                                    <TouchableOpacity onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); handleDeleteFood(meal.id, food.uniqueId); }} style={[styles.actionIconBtn, { backgroundColor: '#FF3B3015' }]}>
                                                        <MaterialCommunityIcons name={isSub ? "close" : "trash-can-outline"} size={isSub ? 18 : 20} color="#FF3B30" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </React.Fragment>
                                    );
                                })}

                                <TouchableOpacity style={[styles.subBtn, { backgroundColor: theme.accent + '15' }]} onPress={() => handleOpenSearch(meal.id, principal.groupId)}>
                                    <MaterialCommunityIcons name="plus-circle" size={16} color={theme.accent} />
                                    <Text style={[styles.subBtnText, { color: theme.accent }]}>Adicionar Substituto</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    <TouchableOpacity style={[styles.addFoodBtn, { backgroundColor: softBg }]} onPress={() => handleOpenSearch(meal.id, null)}>
                        <MaterialCommunityIcons name="plus" size={20} color={theme.textSecondary} />
                        <Text style={[styles.addFoodText, { color: theme.textSecondary }]}>NOVO ALIMENTO BASE</Text>
                    </TouchableOpacity>

                    <View style={styles.notesContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <MaterialCommunityIcons name="text-box-outline" size={16} color={theme.textSecondary} />
                            <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>OBSERVAÇÕES DESTA REFEIÇÃO</Text>
                        </View>
                        <TextInput
                            style={[styles.notesInput, { backgroundColor: softBg, color: theme.text }]}
                            placeholder="Ex: Bater tudo no liquidificador com gelo."
                            placeholderTextColor={theme.textSecondary + '80'}
                            value={meal.notes ?? meal.observacoes ?? meal.generalNotes ?? ''}
                            onChangeText={val => handleUpdateMeal(meal.id, 'notes', val)}
                            multiline numberOfLines={2}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mealCard:       { borderRadius:24, marginBottom:24, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.06, shadowRadius:16, elevation:4 },
    altBadge:       { flexDirection:'row', alignItems:'center', gap:5, alignSelf:'flex-start', margin:12, marginBottom:0, paddingHorizontal:10, paddingVertical:4, borderRadius:8 },
    altBadgeText:   { fontSize:9, fontWeight:'900', color:'#000', letterSpacing:0.5 },
    mealHeader:     { padding:20 },
    accordionBtn:   { padding:8, borderRadius:14, justifyContent:'center', alignItems:'center' },
    mealName:       { fontSize:18, fontWeight:'900', letterSpacing:-0.5 },
    mealKcal:       { fontSize:12, fontWeight:'800' },
    timePill:       { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:10, borderRadius:14 },
    timePillText:   { fontSize:14, fontWeight:'900' },
    moveBtn:        { paddingHorizontal:14, paddingVertical:10, justifyContent:'center', alignItems:'center' },
    actionIconBtn:  { width:40, height:40, borderRadius:14, alignItems:'center', justifyContent:'center' },
    analyzeBtn:     { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:8, borderRadius:12, borderWidth:1 },
    analyzeBtnText: { fontSize:11, fontWeight:'900', letterSpacing:0.3 },
    groupBox:       { marginHorizontal:16, paddingBottom:20 },
    foodRow:        { flexDirection:'row', alignItems:'center', marginVertical:8, position:'relative' },
    baseBadge:      { position:'absolute', top:-10, left:16, paddingHorizontal:10, paddingVertical:4, borderRadius:8, zIndex:10 },
    baseBadgeText:  { fontSize:8, fontWeight:'900', color:'#000', letterSpacing:0.5 },
    foodName:       { fontSize:13, fontWeight:'700', marginBottom:2, lineHeight:18 },
    foodKcal:       { fontSize:11, fontWeight:'800' },
    diffRow:        { flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:6 },
    diffChip:       { fontSize:10, fontWeight:'800' },
    amountBox:      { flexDirection:'row', alignItems:'center', marginLeft:4 },
    amountInput:    { width:60, paddingVertical:10, paddingHorizontal:4, borderRadius:12, textAlign:'center', fontSize:14, fontWeight:'800', outlineStyle:'none' },
    unitBtn:        { paddingHorizontal:10, paddingVertical:10, borderRadius:12, marginLeft:6, alignItems:'center' },
    unitText:       { fontSize:11, fontWeight:'800' },
    ouRow:          { flexDirection:'row', alignItems:'center', marginVertical:14 },
    ouLine:         { flex:1, height:1 },
    ouBadge:        { paddingHorizontal:14, paddingVertical:6, borderRadius:14, marginHorizontal:12 },
    ouText:         { fontSize:10, fontWeight:'900', letterSpacing:1 },
    subBtn:         { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:14, borderRadius:16, marginTop:16 },
    subBtnText:     { fontSize:12, fontWeight:'800', letterSpacing:0.5 },
    addFoodBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, marginHorizontal:16, marginBottom:20, padding:18, borderRadius:16 },
    addFoodText:    { fontSize:12, fontWeight:'900', letterSpacing:1 },
    notesContainer: { paddingHorizontal:16, paddingBottom:24 },
    notesLabel:     { fontSize:11, fontWeight:'900', letterSpacing:1 },
    notesInput:     { padding:16, borderRadius:16, fontSize:14, minHeight:80, textAlignVertical:'top', outlineStyle:'none' },
});