// src/components/SmartSubstituteModal.js
import React, { useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Platform, Modal, FlatList, KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FOOD_DATABASE } from '../data/foodDatabase';

const BREAD_NAMES = [
    'Pão de Forma Tradicional', 'Pão Francês', 'Pão Integral',
    'Tapioca (Goma)', 'Rap10', 'Torrada Integral', 'Biscoito de Arroz'
];
const BREAD_KEYWORDS = ['Pão', 'Tapioca', 'Rap10', 'Torrada'];

const isBreadFood = (food) =>
    food && (BREAD_NAMES.includes(food.name) || BREAD_KEYWORDS.some(k => food.name.includes(k)));

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

export default function SmartSubstituteModal({ visible, onClose, onSelectFood, onManualSearch, principalFood, principalAmount, theme }) {
    const principalKcal = principalFood
        ? ((principalFood.calories_per_100 || 0) * (parseFloat(principalAmount) || 100)) / 100
        : 0;

    const substitutes = useMemo(() => {
        if (!principalFood) return [];

        let candidates;
        if (isBreadFood(principalFood)) {
            candidates = FOOD_DATABASE.filter(f =>
                BREAD_NAMES.includes(f.name) && f.id !== principalFood.id
            );
        } else {
            candidates = FOOD_DATABASE.filter(f =>
                f.category === principalFood.category && f.id !== principalFood.id
            );
        }

        return candidates.map(food => {
            const kcalPer100 = food.calories_per_100 || 1;
            const suggestedAmount = Math.max(5, Math.round((principalKcal * 100) / kcalPer100));
            const subKcal = Math.round((kcalPer100 * suggestedAmount) / 100);
            const dKcal = subKcal - Math.round(principalKcal);
            const subProt = Math.round(((food.p || 0) * suggestedAmount) / 100);
            const subCarb = Math.round(((food.c || 0) * suggestedAmount) / 100);
            const subFat = Math.round(((food.f || 0) * suggestedAmount) / 100);
            return { ...food, suggestedAmount, subKcal, dKcal, subProt, subCarb, subFat };
        })
            .sort((a, b) => Math.abs(a.dKcal) - Math.abs(b.dKcal))
            .slice(0, 12);
    }, [principalFood, principalAmount]);

    if (!principalFood) return null;

    const isBread = isBreadFood(principalFood);
    const catIcon = getCategoryIcon(principalFood.category);

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
                                    {isBread ? 'Pães & Similares' : principalFood.category}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={[ss.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[ss.sheetTitle, { color: theme.text }]}>Substituir por</Text>
                        <Text style={[ss.sheetSub, { color: theme.textSecondary }]} numberOfLines={1}>
                            {principalFood.name} · {parseFloat(principalAmount) || 100}{principalFood.base_unit} · {Math.round(principalKcal)} kcal
                        </Text>

                        <View style={[ss.divider, { backgroundColor: theme.border }]} />

                        <FlatList
                            data={substitutes}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}
                            ListEmptyComponent={() => (
                                <View style={{ padding: 32, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="food-off" size={36} color={theme.textSecondary} />
                                    <Text style={{ color: theme.textSecondary, marginTop: 10, fontSize: 13 }}>Nenhuma opção encontrada.</Text>
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
                                        onPress={() => onSelectFood({ ...item, suggestedAmount: item.suggestedAmount.toString() })}
                                        activeOpacity={0.75}
                                    >
                                        <View style={[ss.amtBadge, { backgroundColor: theme.accent }]}>
                                            <Text style={ss.amtValue}>{item.suggestedAmount}</Text>
                                            <Text style={ss.amtUnit}>{item.base_unit}</Text>
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
                            <Text style={[ss.manualText, { color: theme.textSecondary }]}>Buscar Manualmente</Text>
                        </TouchableOpacity>

                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const ss = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { width: '100%', maxWidth: 480, alignSelf: 'center', maxHeight: '82%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 },
    handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    catPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    closeBtn: { padding: 7, borderRadius: 10, borderWidth: 1 },
    sheetTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
    sheetSub: { fontSize: 12, marginBottom: 16 },
    divider: { height: 1, marginBottom: 14 },
    subCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
    amtBadge: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    amtValue: { fontSize: 16, fontWeight: '900', color: '#000' },
    amtUnit: { fontSize: 9, fontWeight: '700', color: '#000', opacity: 0.7 },
    subName: { fontSize: 13, fontWeight: '700', marginBottom: 5 },
    macroRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    macroChip: { fontSize: 10, fontWeight: '600' },
    diffPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    diffText: { fontSize: 11, fontWeight: '800' },
    manualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, marginHorizontal: -20, borderTopWidth: 1 },
    manualText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
});