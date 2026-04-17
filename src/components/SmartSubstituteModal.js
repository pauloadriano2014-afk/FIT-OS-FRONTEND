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

// 🔥 Converte a medida do visor em peso real para o cálculo
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

// Define qual o "Macro Rei" de acordo com a Categoria Geral
const getTargetMacro = (category) => {
    if (category === 'Carnes e Proteínas' || category === 'Frios e Laticínios' || category === 'Suplementos') return 'p';
    if (category === 'Gorduras e Oleaginosas') return 'f';
    return 'c'; 
};

// 🔥 Formatação Visual Avançada (A Magia do Coach)
const formatVisualUnit = (foodName, rawGrams, subcategory) => {
    const grams = Math.round(rawGrams);

    // Regra da Crepioca (+ Ovos adicionados visualmente)
    if (foodName === 'Massa de Crepioca') {
        const ovos = grams > 60 ? 2 : 1;
        return { displayVal: grams.toString(), labelUnit: `g Tapioca\n+ ${ovos} Ovo`, realUnit: 'g' };
    }

    // Regras de Pães
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

    // Regras de Suplementos
    if (subcategory === 'Suplementos em Pó') {
        let scoops = Math.round((grams / 30) * 2) / 2;
        if (scoops === 0) scoops = 0.5;
        return { displayVal: scoops.toString(), labelUnit: 'Scoop (30g)', realUnit: 'scoop' };
    }

    // Regras de Frios e Queijos Pastosos
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

    // Padrão Geral
    return { displayVal: grams.toString(), labelUnit: 'g', realUnit: 'g' };
};

export default function SmartSubstituteModal({ visible, onClose, onSelectFood, onManualSearch, principalFood, principalAmount, theme }) {
    
    const { amountInGrams, truePrincipal, principalMacroValue, principalKcal } = useMemo(() => {
        if (!principalFood) return { amountInGrams: 0, truePrincipal: null, principalMacroValue: 0, principalKcal: 0 };
        
        const rawAmount = parseFloat(principalAmount) || 100;
        const currentUnit = principalFood.unit || principalFood.base_unit || 'g';
        
        const grams = toGramsLocal(rawAmount, currentUnit, principalFood.id);
        const pureDbFood = FOOD_DATABASE.find(f => f.id === principalFood.id) || principalFood;
        const targetMacroKey = getTargetMacro(pureDbFood.category);
        
        const macroVal = ((pureDbFood[targetMacroKey] || 0) * grams) / 100;
        const kcalVal = ((pureDbFood.calories_per_100 || 0) * grams) / 100;

        return { amountInGrams: grams, truePrincipal: pureDbFood, principalMacroValue: macroVal, principalKcal: kcalVal };
    }, [principalFood, principalAmount]);

    const substitutes = useMemo(() => {
        if (!truePrincipal) return [];

        // Proteção para itens bloqueados
        if (truePrincipal.subcategory === 'Creatina Isolada' || truePrincipal.subcategory === 'Doces Isolados') {
            return [];
        }

        const targetMacroKey = getTargetMacro(truePrincipal.category);

        const candidates = FOOD_DATABASE.filter(f =>
            f.subcategory === truePrincipal.subcategory && f.id !== truePrincipal.id
        );

        return candidates.map(food => {
            const macroPer100 = food[targetMacroKey] || 1; 
            
            let calculatedGrams = (principalMacroValue * 100) / macroPer100;
            if (calculatedGrams === Infinity || calculatedGrams === 0) calculatedGrams = 100;
            
            const suggestedAmount = Math.max(5, Math.round(calculatedGrams));

            let subKcal = Math.round(((food.calories_per_100 || 0) * suggestedAmount) / 100);
            let subProt = Math.round(((food.p || 0) * suggestedAmount) / 100);
            let subCarb = Math.round(((food.c || 0) * suggestedAmount) / 100);
            let subFat = Math.round(((food.f || 0) * suggestedAmount) / 100);

            // 🔥 Adiciona os macros do ovo à Crepioca para o Coach e o Aluno não perderem as contas!
            if (food.name === 'Massa de Crepioca') {
                const ovos = suggestedAmount > 60 ? 2 : 1;
                subKcal += ovos * 70; // 1 ovo = ~70 kcal
                subProt += ovos * 6;  // 1 ovo = ~6g prot
                subFat += ovos * 5;   // 1 ovo = ~5g gord
            }
            
            const dKcal = subKcal - Math.round(principalKcal);
            const formatted = formatVisualUnit(food.name, suggestedAmount, food.subcategory);

            return { 
                ...food, 
                suggestedAmount, 
                displayVal: formatted.displayVal,      
                labelUnit: formatted.labelUnit,       
                realUnit: formatted.realUnit,        
                subKcal, dKcal, subProt, subCarb, subFat 
            };
        })
        .sort((a, b) => Math.abs(a.dKcal) - Math.abs(b.dKcal));

    }, [truePrincipal, principalMacroValue, principalKcal]);

    if (!principalFood || !truePrincipal) return null;

    const catIcon = getCategoryIcon(truePrincipal.category);
    const rawAmount = parseFloat(principalAmount) || 100;
    const currentUnit = principalFood.unit || principalFood.base_unit || 'g';
    const targetMacroLabel = getTargetMacro(truePrincipal.category).toUpperCase();

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
                            <TouchableOpacity onPress={onClose} style={[ss.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[ss.sheetTitle, { color: theme.text }]}>Substituir por</Text>
                        <Text style={[ss.sheetSub, { color: theme.textSecondary }]} numberOfLines={1}>
                            {truePrincipal.name} · {rawAmount} {currentUnit} · {Math.round(principalKcal)} kcal
                        </Text>
                        
                        <View style={[ss.logicAlert, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="scale-balance" size={14} color={theme.textSecondary} />
                            <Text style={[ss.logicAlertText, { color: theme.textSecondary }]}>
                                Cálculo pareado pelo <Text style={{fontWeight: '900', color: theme.text}}>Macro Dominante ({targetMacroLabel})</Text>. As calorias e gorduras extras podem variar e ficam a seu critério.
                            </Text>
                        </View>

                        <View style={[ss.divider, { backgroundColor: theme.border }]} />

                        <FlatList
                            data={substitutes}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}
                            ListEmptyComponent={() => (
                                <View style={{ padding: 32, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="food-off" size={36} color={theme.textSecondary} />
                                    <Text style={{ color: theme.textSecondary, marginTop: 10, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                                        Nenhuma opção de substituição direta autorizada pelo sistema.
                                    </Text>
                                </View>
                            )}
                            renderItem={({ item }) => {
                                const isEquiv = item.dKcal === 0;
                                const isLower = item.dKcal < 0;
                                const diffColor = isEquiv ? '#34C759' : isLower ? '#32ADE6' : '#FF3B30';
                                const diffLabel = isEquiv ? '≈ Equiv.' : `${item.dKcal > 0 ? '+' : ''}${item.dKcal} kcal`;

                                return (
                                    <TouchableOpacity
                                        style={[ss.subCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                        onPress={() => onSelectFood({ ...item, suggestedAmount: item.displayVal, base_unit: item.realUnit })}
                                        activeOpacity={0.75}
                                    >
                                        <View style={[ss.amtBadge, { backgroundColor: theme.accent }]}>
                                            <Text style={ss.amtValue} adjustsFontSizeToFit numberOfLines={1}>{item.displayVal}</Text>
                                            <Text style={ss.amtUnit}>{item.labelUnit}</Text>
                                        </View>
                                        <View style={{ flex: 1, paddingHorizontal: 12 }}>
                                            <Text style={[ss.subName, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                                            <View style={ss.macroRow}>
                                                <Text style={[ss.macroChip, { color: theme.textSecondary }]}>{item.subKcal} kcal</Text>
                                                <Text style={[ss.macroChip, { color: '#32ADE6' }]}>P {item.subProt}g</Text>
                                                <Text style={[ss.macroChip, { color: '#FFCC00' }]}>C {item.subCarb}g</Text>
                                                <Text style={[ss.macroChip, { color: '#FF9500' }]}>G {item.subFat}g</Text>
                                            </View>
                                        </View>
                                        <View style={[ss.diffPill, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
                                            <Text style={[ss.diffText, { color: diffColor }]}>{diffLabel}</Text>
                                        </View>
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
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { width: '100%', maxWidth: 480, alignSelf: 'center', maxHeight: '85%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 },
    handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    catPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
    closeBtn: { padding: 7, borderRadius: 10, borderWidth: 1 },
    sheetTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
    sheetSub: { fontSize: 13, marginBottom: 10, fontWeight: '700' },
    
    logicAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
    logicAlertText: { fontSize: 10, lineHeight: 14, flex: 1 },

    divider: { height: 1, marginBottom: 14 },
    subCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
    amtBadge: { width: 62, height: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    amtValue: { fontSize: 16, fontWeight: '900', color: '#000' },
    amtUnit: { fontSize: 8, fontWeight: '800', color: '#000', opacity: 0.8, marginTop: -2, textAlign: 'center' },
    subName: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
    macroRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    macroChip: { fontSize: 11, fontWeight: '800' },
    diffPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    diffText: { fontSize: 11, fontWeight: '900' },
    manualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, marginHorizontal: -20, borderTopWidth: 1 },
    manualText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
});