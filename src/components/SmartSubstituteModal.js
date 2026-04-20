// src/components/SmartSubstituteModal.js
import React, { useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Platform, Modal, FlatList, KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FOOD_DATABASE } from '../data/foodDatabase';
import { FOOD_PORTIONS } from '../data/foodPortions'; 

const UNIT_GRAM_FACTOR = { 
    'g': 1, 'ml': 1, 
    'fatia': 25, 'fatias': 25, 
    'unid': 50, 'unidade': 50, 'unidades': 50, 'un': 50, 
    'colher': 15, 'colheres': 15, 
    'xícara': 200, 'xicara': 200, 'xícaras': 200,
    'scoop': 30, 'scoops': 30 
};

const toGramsLocal = (amount, unit, foodId) => {
    const portions = FOOD_PORTIONS ? FOOD_PORTIONS[foodId] : null;
    let cleanUnit = String(unit).toLowerCase().trim();
    if (cleanUnit === 'fatias') cleanUnit = 'fatia';
    if (cleanUnit === 'colheres') cleanUnit = 'colher';
    if (cleanUnit === 'unidades' || cleanUnit === 'unidade' || cleanUnit === 'un') cleanUnit = 'unid';
    if (cleanUnit === 'xícaras' || cleanUnit === 'xicaras' || cleanUnit === 'xicara') cleanUnit = 'xícara';
    if (cleanUnit === 'scoops') cleanUnit = 'scoop';

    const factor = portions?.[cleanUnit] ?? UNIT_GRAM_FACTOR[cleanUnit] ?? UNIT_GRAM_FACTOR[String(unit).toLowerCase().trim()] ?? 1;
    return (parseFloat(amount) || 0) * factor;
};

const getCategoryIcon = (category) => {
    const icons = {
        'Carnes e Proteínas': 'food-steak',
        'Frios e Laticínios': 'cheese',
        'Carboidratos': 'grain',
        'Vegetais e Legumes': 'leaf',
        'Frutas': 'fruit-watermelon',
        'Gorduras e Oleaginosas': 'bottle-tonic',
        'Suplementos': 'flask',
        'Bebidas': 'cup-water',
    };
    return icons[category] || 'food';
};

const getTargetMacro = (category) => {
    if (category === 'Carnes e Proteínas' || category === 'Frios e Laticínios' || category === 'Suplementos') return 'p';
    if (category === 'Gorduras e Oleaginosas') return 'f';
    return 'c'; 
};

const formatVisualUnit = (foodName, rawGrams, subcategory) => {
    const grams = Math.round(rawGrams);

    if (foodName === 'Massa de Crepioca') {
        const ovos = grams > 60 ? 2 : 1;
        return { displayVal: grams.toString(), labelUnit: `g Tapioca\n+ ${ovos} Ovo`, realUnit: 'g' };
    }

    if (foodName === 'Pão Francês') {
        let unids = Math.round((grams / 50) * 2) / 2;
        if (unids === 0) unids = 0.5;
        return { displayVal: unids.toString(), labelUnit: 'Unid (50g)', realUnit: 'unid' };
    }
    if (foodName === 'Pão de Forma Tradicional' || foodName === 'Pão Integral') {
        let fatias = Math.round((grams / 25) * 2) / 2;
        if (fatias === 0) fatias = 0.5;
        return { displayVal: fatias.toString(), labelUnit: 'Fatia (25g)', realUnit: 'fatia' };
    }
    if (foodName === 'Rap10' || foodName === 'Tapioca (Goma)') {
        let unids = Math.round((grams / 30) * 2) / 2;
        if (unids === 0) unids = 0.5;
        return { displayVal: unids.toString(), labelUnit: 'Unid (30g)', realUnit: 'unid' };
    }

    if (subcategory === 'Suplementos em Pó') {
        let scoops = Math.round((grams / 30) * 2) / 2;
        if (scoops === 0) scoops = 0.5;
        return { displayVal: scoops.toString(), labelUnit: 'Scoop (30g)', realUnit: 'scoop' };
    }

    if (subcategory === 'Queijos e Pastas' && (foodName.includes('Requeijão') || foodName.includes('Cream Cheese'))) {
        let colheres = Math.round((grams / 20) * 2) / 2;
        if (colheres === 0) colheres = 0.5;
        return { displayVal: colheres.toString(), labelUnit: 'Colher (20g)', realUnit: 'colher' };
    }
    if (subcategory === 'Queijos e Pastas' && foodName.includes('Mussarela')) {
        let fatias = Math.round((grams / 20) * 2) / 2;
        if (fatias === 0) fatias = 0.5;
        return { displayVal: fatias.toString(), labelUnit: 'Fatia (20g)', realUnit: 'fatia' };
    }
    if (subcategory === 'Frios e Embutidos') {
        let fatias = Math.round((grams / 20) * 2) / 2;
        if (fatias === 0) fatias = 0.5;
        return { displayVal: fatias.toString(), labelUnit: 'Fatia (20g)', realUnit: 'fatia' };
    }

    return { displayVal: grams.toString(), labelUnit: 'g', realUnit: 'g' };
};

// 🔥 ADICIONADA PROP existingGroupItems para rastrear o que já foi selecionado
export default function SmartSubstituteModal({ visible, onClose, onSelectFood, onManualSearch, principalFood, principalAmount, theme, existingGroupItems = [] }) {
    
    const { truePrincipal, principalKcal } = useMemo(() => {
        if (!principalFood) return { truePrincipal: null, principalKcal: 0 };
        
        const rawAmount = parseFloat(principalAmount) || 100;
        const currentUnit = principalFood.unit || principalFood.base_unit || 'g';
        
        const grams = toGramsLocal(rawAmount, currentUnit, principalFood.id);
        const pureDbFood = FOOD_DATABASE.find(f => f.id === principalFood.id) || principalFood;
        
        const kcalPer100 = parseFloat(pureDbFood.calories_per_100 ?? pureDbFood.calories ?? 0);
        const kcalVal = (kcalPer100 * grams) / 100;

        return { truePrincipal: pureDbFood, principalKcal: kcalVal };
    }, [principalFood, principalAmount]);

    const substitutes = useMemo(() => {
        if (!truePrincipal) return [];

        if (truePrincipal.subcategory === 'Creatina Isolada' || truePrincipal.subcategory === 'Doces Isolados') {
            return [];
        }

        const candidates = FOOD_DATABASE.filter(f =>
            f.subcategory === truePrincipal.subcategory && f.id !== truePrincipal.id
        );

        return candidates.map(food => {
            const itemKcalPer100 = parseFloat(food.calories_per_100 ?? food.calories ?? 1);
            let calculatedGrams = (principalKcal * 100) / itemKcalPer100;
            
            if (calculatedGrams === Infinity || calculatedGrams === 0) calculatedGrams = 100;
            
            const suggestedAmount = Math.max(5, Math.round(calculatedGrams));

            let subKcal = Math.round((itemKcalPer100 * suggestedAmount) / 100);
            let subProt = Math.round(((parseFloat(food.p ?? food.protein ?? 0)) * suggestedAmount) / 100);
            let subCarb = Math.round(((parseFloat(food.c ?? food.carbs ?? 0)) * suggestedAmount) / 100);
            let subFat = Math.round(((parseFloat(food.f ?? food.fats ?? 0)) * suggestedAmount) / 100);

            if (food.name === 'Massa de Crepioca') {
                const ovos = suggestedAmount > 60 ? 2 : 1;
                subKcal += ovos * 70;
                subProt += ovos * 6;  
                subFat += ovos * 5;   
            }
            
            const dKcal = subKcal - Math.round(principalKcal);
            const formatted = formatVisualUnit(food.name, suggestedAmount, food.subcategory);
            
            // 🔥 Verifica se o item já está na dieta para desabilitar visualmente
            const isAlreadyAdded = existingGroupItems.some(item => item.name === food.name);

            return { 
                ...food, 
                suggestedAmount, 
                displayVal: formatted.displayVal,      
                labelUnit: formatted.labelUnit,       
                realUnit: formatted.realUnit,        
                subKcal, dKcal, subProt, subCarb, subFat,
                isAlreadyAdded
            };
        })
        .sort((a, b) => {
            // Ordena primeiro por não adicionados, depois por proximidade de kcal
            if (a.isAlreadyAdded !== b.isAlreadyAdded) return a.isAlreadyAdded ? 1 : -1;
            return Math.abs(a.dKcal) - Math.abs(b.dKcal);
        });

    }, [truePrincipal, principalKcal, existingGroupItems]);

    if (!principalFood || !truePrincipal) return null;

    const catIcon = getCategoryIcon(truePrincipal.category);
    const rawAmount = parseFloat(principalAmount) || 100;
    const currentUnit = principalFood.unit || principalFood.base_unit || 'g';

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={ss.backdrop}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
                    <View style={[ss.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                        <View style={[ss.handle, { backgroundColor: theme.border }]} />

                        <View style={ss.headerRow}>
                            <View style={[ss.catPill, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
                                <MaterialCommunityIcons name={catIcon} size={12} color={theme.accent} />
                                <Text style={[ss.catPillText, { color: theme.accent }]}>
                                    {truePrincipal.subcategory || truePrincipal.category}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={[ss.closeBtn, { backgroundColor: theme.accent }]}>
                                <Text style={{color: '#000', fontWeight: '900', fontSize: 12}}>CONCLUIR</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[ss.sheetTitle, { color: theme.text }]}>Lista de Substitutos</Text>
                        <Text style={[ss.sheetSub, { color: theme.textSecondary }]} numberOfLines={1}>
                            Base: {truePrincipal.name} ({rawAmount}{currentUnit})
                        </Text>
                        
                        <View style={[ss.logicAlert, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="information-outline" size={14} color={theme.accent} />
                            <Text style={[ss.logicAlertText, { color: theme.textSecondary }]}>
                                Toque nos alimentos para adicionar. O modal ficará aberto para multi-seleção.
                            </Text>
                        </View>

                        <View style={[ss.divider, { backgroundColor: theme.border }]} />

                        <FlatList
                            data={substitutes}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item }) => {
                                const isEquiv = item.dKcal === 0;
                                const isLower = item.dKcal < 0;
                                const diffColor = isEquiv ? '#34C759' : isLower ? '#32ADE6' : '#FF3B30';
                                const diffLabel = isEquiv ? 'Equiv.' : `${item.dKcal > 0 ? '+' : ''}${item.dKcal} kcal`;

                                return (
                                    <TouchableOpacity
                                        style={[
                                            ss.subCard, 
                                            { backgroundColor: theme.surface, borderColor: theme.border },
                                            item.isAlreadyAdded && { opacity: 0.4, borderColor: theme.accent + '40' }
                                        ]}
                                        onPress={() => !item.isAlreadyAdded && onSelectFood({ ...item, suggestedAmount: item.displayVal, base_unit: item.realUnit })}
                                        activeOpacity={0.75}
                                        disabled={item.isAlreadyAdded}
                                    >
                                        <View style={[ss.amtBadge, { backgroundColor: item.isAlreadyAdded ? theme.border : theme.accent }]}>
                                            {item.isAlreadyAdded ? (
                                                <MaterialCommunityIcons name="check-bold" size={24} color={theme.textSecondary} />
                                            ) : (
                                                <>
                                                    <Text style={ss.amtValue} adjustsFontSizeToFit numberOfLines={1}>{item.displayVal}</Text>
                                                    <Text style={ss.amtUnit}>{item.labelUnit}</Text>
                                                </>
                                            )}
                                        </View>
                                        <View style={{ flex: 1, paddingHorizontal: 12 }}>
                                            <Text style={[ss.subName, { color: theme.text }, item.isAlreadyAdded && { textDecorationLine: 'line-through' }]} numberOfLines={2}>{item.name}</Text>
                                            <View style={ss.macroRow}>
                                                <Text style={[ss.macroChip, { color: theme.textSecondary }]}>{item.subKcal} kcal</Text>
                                                <Text style={[ss.macroChip, { color: '#32ADE6' }]}>P {item.subProt}g</Text>
                                                <Text style={[ss.macroChip, { color: '#FFCC00' }]}>C {item.subCarb}g</Text>
                                            </View>
                                        </View>
                                        {!item.isAlreadyAdded && (
                                            <View style={[ss.diffPill, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
                                                <Text style={[ss.diffText, { color: diffColor }]}>{diffLabel}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <TouchableOpacity style={[ss.manualBtn, { borderTopColor: theme.border, backgroundColor: theme.surface }]} onPress={onManualSearch}>
                            <MaterialCommunityIcons name="magnify" size={18} color={theme.textSecondary} />
                            <Text style={[ss.manualText, { color: theme.textSecondary }]}>Buscar Fora da Categoria (Manual)</Text>
                        </TouchableOpacity>

                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const ss = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet: { width: '100%', maxWidth: 480, alignSelf: 'center', maxHeight: '85%', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 },
    handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    catPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
    closeBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
    sheetTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
    sheetSub: { fontSize: 14, marginBottom: 12, fontWeight: '700' },
    logicAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 15 },
    logicAlertText: { fontSize: 11, fontWeight: '700', flex: 1 },
    divider: { height: 1, marginBottom: 15 },
    subCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
    amtBadge: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    amtValue: { fontSize: 18, fontWeight: '900', color: '#000' },
    amtUnit: { fontSize: 9, fontWeight: '800', color: '#000', opacity: 0.8, marginTop: -2, textAlign: 'center' },
    subName: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
    macroRow: { flexDirection: 'row', gap: 10 },
    macroChip: { fontSize: 11, fontWeight: '900' },
    diffPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
    diffText: { fontSize: 10, fontWeight: '900' },
    manualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, marginHorizontal: -20, borderTopWidth: 1 },
    manualText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});