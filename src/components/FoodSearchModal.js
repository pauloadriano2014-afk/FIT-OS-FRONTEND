// src/components/FoodSearchModal.js
import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, FlatList, KeyboardAvoidingView, Platform,
    useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FOOD_DATABASE } from '../data/foodDatabase';

const CATEGORIES = [
    'Todas',
    'Frios e Laticínios',
    'Carnes e Proteínas',
    'Carboidratos',
    'Vegetais e Legumes',
    'Frutas',
    'Gorduras e Oleaginosas',
    'Suplementos',
    'Bebidas',
];

const CAT_ICONS = {
    'Todas': 'view-grid',
    'Frios e Laticínios': 'cheese',
    'Carnes e Proteínas': 'food-steak',
    'Carboidratos': 'grain',
    'Vegetais e Legumes': 'leaf',
    'Frutas': 'fruit-watermelon',
    'Gorduras e Oleaginosas': 'bottle-tonic',
    'Suplementos': 'flask',
    'Bebidas': 'cup-water',
};

const MACRO_COLOR = { p: '#32ADE6', c: '#FFCC00', f: '#FF9500' };

export default function FoodSearchModal({ visible, onClose, onSelectFood, targetGroup, theme }) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [showCategories, setShowCategories] = useState(false);

    const isWeb = Platform.OS === 'web';
    const { height: windowHeight } = useWindowDimensions();
    const sheetHeight = Math.round(windowHeight * 0.88);

    const filteredFoods = useMemo(() => {
        return FOOD_DATABASE.filter(food => {
            const matchSearch = food.name.toLowerCase().includes(search.toLowerCase());
            const matchCat = selectedCategory === 'Todas' || food.category === selectedCategory;
            return matchSearch && matchCat;
        });
    }, [search, selectedCategory]);

    const handleSelect = (food) => {
        setSearch('');
        setSelectedCategory('Todas');
        setShowCategories(false);
        onSelectFood(food);
    };

    const handleClose = () => {
        setSearch('');
        setSelectedCategory('Todas');
        setShowCategories(false);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <TouchableOpacity
                style={[styles.backdrop, isWeb ? { height: windowHeight } : {}]}
                activeOpacity={1}
                onPress={handleClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    enabled={!isWeb}
                    style={{ flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}
                >
                    {/* Stop propagation so inner touches don't close modal */}
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.border, height: sheetHeight }]}
                    >
                        {/* Handle */}
                        <View style={[styles.handle, { backgroundColor: theme.border }]} />

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.title, { color: theme.text }]}>TABELA DE ALIMENTOS</Text>
                                {targetGroup && (
                                    <View style={[styles.subBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
                                        <MaterialCommunityIcons name="swap-horizontal" size={11} color={theme.accent} />
                                        <Text style={[styles.subBadgeText, { color: theme.accent }]}>Buscando substituto</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            >
                                <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Category selector */}
                        <TouchableOpacity
                            style={[styles.catSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => setShowCategories(!showCategories)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MaterialCommunityIcons
                                    name={CAT_ICONS[selectedCategory] || 'filter-variant'}
                                    size={17}
                                    color={theme.accent}
                                />
                                <Text style={[styles.catSelectorText, { color: theme.text }]}>
                                    {selectedCategory}
                                </Text>
                            </View>
                            <MaterialCommunityIcons
                                name={showCategories ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color={theme.textSecondary}
                            />
                        </TouchableOpacity>

                        {/* Category dropdown */}
                        {showCategories && (
                            <View style={[styles.catDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.catOption,
                                            { borderBottomColor: theme.border },
                                            selectedCategory === cat && { backgroundColor: theme.accent + '12' }
                                        ]}
                                        onPress={() => { setSelectedCategory(cat); setShowCategories(false); }}
                                    >
                                        <MaterialCommunityIcons
                                            name={CAT_ICONS[cat] || 'food'}
                                            size={15}
                                            color={selectedCategory === cat ? theme.accent : theme.textSecondary}
                                        />
                                        <Text style={[
                                            styles.catOptionText,
                                            { color: selectedCategory === cat ? theme.accent : theme.text },
                                        ]}>
                                            {cat}
                                        </Text>
                                        {selectedCategory === cat && (
                                            <MaterialCommunityIcons name="check" size={15} color={theme.accent} style={{ marginLeft: 'auto' }} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Search input */}
                        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="magnify" size={18} color={theme.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="Buscar alimento... (ex: Frango, Aveia)"
                                placeholderTextColor={theme.textSecondary}
                                value={search}
                                onChangeText={setSearch}
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Results count */}
                        <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
                            {filteredFoods.length} alimentos encontrados
                        </Text>

                        {/* Food list */}
                        <FlatList
                            data={filteredFoods}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => {
                                const kcal = item.calories_per_100 || 0;
                                return (
                                    <TouchableOpacity
                                        style={[styles.foodItem, { borderBottomColor: theme.border }]}
                                        onPress={() => handleSelect(item)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={{ flex: 1, paddingRight: 10 }}>
                                            <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            <Text style={[styles.foodCat, { color: theme.textSecondary }]}>
                                                {item.category}
                                            </Text>
                                            {/* Macros inline */}
                                            <View style={styles.macroRow}>
                                                {[['P', item.p, MACRO_COLOR.p], ['C', item.c, MACRO_COLOR.c], ['G', item.f, MACRO_COLOR.f]].map(([l, v, c]) => (
                                                    v !== undefined && v !== null ? (
                                                        <Text key={l} style={[styles.macroChip, { color: c }]}>
                                                            {l} {v}g
                                                        </Text>
                                                    ) : null
                                                ))}
                                            </View>
                                        </View>

                                        <View style={styles.kcalBlock}>
                                            <Text style={[styles.kcalValue, { color: theme.text }]}>{kcal}</Text>
                                            <Text style={[styles.kcalUnit, { color: theme.textSecondary }]}>
                                                kcal/100{item.base_unit}
                                            </Text>
                                        </View>

                                        <View style={[styles.addBtn, { backgroundColor: theme.accent }]}>
                                            <MaterialCommunityIcons name="plus" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyBox}>
                                    <MaterialCommunityIcons name="food-off" size={40} color={theme.textSecondary} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        Nenhum alimento encontrado
                                    </Text>
                                    <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
                                        Tente outra categoria ou termo
                                    </Text>
                                </View>
                            )}
                        />
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end', alignItems: 'center' },
    sheet: {
        width: '100%', maxWidth: 480,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderWidth: 1, borderBottomWidth: 0,
        paddingHorizontal: 18, paddingTop: 12, paddingBottom: 0
    },
    handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },

    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, marginBottom: 6 },
    subBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1
    },
    subBadgeText: { fontSize: 10, fontWeight: '700' },
    closeBtn: { padding: 7, borderRadius: 10, borderWidth: 1, marginTop: 2 },

    catSelector: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 13, borderRadius: 13, borderWidth: 1, marginBottom: 10
    },
    catSelectorText: { fontSize: 13, fontWeight: '700' },

    catDropdown: {
        position: 'absolute', top: 150, left: 18, right: 18,
        zIndex: 100, borderRadius: 16, borderWidth: 1,
        maxHeight: 320, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 16, elevation: 10
    },
    catOption: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 13, borderBottomWidth: 1
    },
    catOptionText: { fontSize: 13, fontWeight: '600' },

    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 12, borderRadius: 13, borderWidth: 1, marginBottom: 8, zIndex: 1
    },
    searchInput: { flex: 1, fontSize: 13, outlineStyle: 'none' },

    resultCount: { fontSize: 10, fontWeight: '600', marginBottom: 8, letterSpacing: 0.3 },

    foodItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 13, borderBottomWidth: 1
    },
    foodName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    foodCat: { fontSize: 10, marginBottom: 4 },
    macroRow: { flexDirection: 'row', gap: 8 },
    macroChip: { fontSize: 10, fontWeight: '700' },

    kcalBlock: { alignItems: 'flex-end', marginRight: 12 },
    kcalValue: { fontSize: 16, fontWeight: '900' },
    kcalUnit: { fontSize: 9 },

    addBtn: {
        width: 34, height: 34, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center'
    },

    emptyBox: { padding: 48, alignItems: 'center' },
    emptyText: { fontSize: 14, fontWeight: '700', marginTop: 12 },
    emptyHint: { fontSize: 12, marginTop: 4 },
});