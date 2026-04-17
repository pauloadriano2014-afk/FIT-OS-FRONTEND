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
    'Carboidratos',
    'Carnes e Proteínas',
    'Frios e Laticínios',
    'Vegetais e Legumes',
    'Frutas',
    'Gorduras e Oleaginosas',
    'Suplementos',
    'Bebidas',
];

const CATEGORY_UI_INFO = {
    'Carboidratos': { icon: 'grain', desc: 'Arroz, massas, batatas, pães...', p: 2, c: 28, f: 0, kcal: 130 },
    'Carnes e Proteínas': { icon: 'food-steak', desc: 'Frango, carnes, peixes, ovos...', p: 31, c: 0, f: 3, kcal: 165 },
    'Vegetais e Legumes': { icon: 'leaf', desc: 'Brócolis, couve, cenoura...', p: 2, c: 4, f: 0, kcal: 25 },
    'Frutas': { icon: 'fruit-watermelon', desc: 'Banana, maçã, mamão...', p: 1, c: 23, f: 0, kcal: 89 },
    'Gorduras e Oleaginosas': { icon: 'bottle-tonic', desc: 'Azeite, pasta de amendoim...', p: 25, c: 20, f: 50, kcal: 588 },
    'Suplementos': { icon: 'flask', desc: 'Whey protein, creatina...', p: 75, c: 10, f: 5, kcal: 400 },
    'Frios e Laticínios': { icon: 'cheese', desc: 'Queijos, iogurtes, leites...', p: 11, c: 3, f: 4, kcal: 98 },
    'Bebidas': { icon: 'cup-water', desc: 'Café, chás, sucos zero...', p: 0, c: 0, f: 0, kcal: 0 },
};

const MACRO_COLOR = { p: '#32ADE6', c: '#FFCC00', f: '#FF9500' };

export default function FoodSearchModal({ visible, onClose, onSelectFood, targetGroup, theme }) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');

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
        onSelectFood(food);
    };

    const handleClose = () => {
        setSearch('');
        setSelectedCategory('Todas');
        onClose();
    };

    const isViewingCategories = selectedCategory === 'Todas' && search.length === 0;

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
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.border, height: sheetHeight }]}
                    >
                        <View style={[styles.handle, { backgroundColor: theme.border }]} />

                        {/* Título e Badge */}
                        <View style={styles.header}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.title, { color: theme.text }]}>
                                    {isViewingCategories ? 'SELECIONE A CATEGORIA' : 'TABELA DE ALIMENTOS'}
                                </Text>
                                {targetGroup && (
                                    <View style={[styles.subBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
                                        <MaterialCommunityIcons name="swap-horizontal" size={11} color={theme.accent} />
                                        <Text style={[styles.subBadgeText, { color: theme.accent }]}>Buscando substituto</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Barra de Pesquisa Fixa */}
                        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="Buscar alimento... (ex: Frango, Aveia)"
                                placeholderTextColor={theme.textSecondary}
                                value={search}
                                onChangeText={setSearch}
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Botão de Voltar (se estiver dentro de uma categoria) */}
                        {!isViewingCategories && search.length === 0 && (
                            <TouchableOpacity 
                                style={[styles.backFilterBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]} 
                                onPress={() => setSelectedCategory('Todas')}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={16} color={theme.accent} />
                                <Text style={[styles.backFilterText, { color: theme.accent }]}>
                                    Voltar para categorias ({selectedCategory})
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Indicador de resultados */}
                        {!isViewingCategories && (
                            <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
                                {filteredFoods.length} alimentos encontrados
                            </Text>
                        )}

                        {/* RENDERIZAÇÃO CONDICIONAL */}
                        {isViewingCategories ? (
                            <FlatList
                                data={CATEGORIES}
                                keyExtractor={item => item}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 40 }}
                                renderItem={({ item }) => {
                                    const info = CATEGORY_UI_INFO[item];
                                    return (
                                        <TouchableOpacity 
                                            style={[styles.catCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                            activeOpacity={0.8}
                                            onPress={() => setSelectedCategory(item)}
                                        >
                                            <View style={[styles.catIconBox, { backgroundColor: theme.accent + '15' }]}>
                                                <MaterialCommunityIcons name={info.icon} size={24} color={theme.accent} />
                                            </View>
                                            <View style={styles.catInfo}>
                                                <Text style={[styles.catName, { color: theme.text }]}>{item}</Text>
                                                <Text style={[styles.catDesc, { color: theme.textSecondary }]}>{info.desc}</Text>
                                                <View style={styles.macroRow}>
                                                    <Text style={[styles.macroChip, { color: theme.textSecondary }]}>{info.kcal} kcal</Text>
                                                    <Text style={[styles.macroChip, { color: MACRO_COLOR.p }]}>P {info.p}g</Text>
                                                    <Text style={[styles.macroChip, { color: MACRO_COLOR.c }]}>C {info.c}g</Text>
                                                    <Text style={[styles.macroChip, { color: MACRO_COLOR.f }]}>G {info.f}g</Text>
                                                </View>
                                            </View>
                                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        ) : (
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
                                            style={[styles.foodItemModern, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                            onPress={() => handleSelect(item)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{ flex: 1, paddingRight: 10 }}>
                                                <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={2}>
                                                    {item.name}
                                                </Text>
                                                <Text style={[styles.foodCat, { color: theme.textSecondary }]}>
                                                    {item.subcategory || item.category}
                                                </Text>
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
                                    </View>
                                )}
                            />
                        )}
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
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0,
        shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
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

    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12
    },
    searchInput: { flex: 1, fontSize: 14, outlineStyle: 'none' },

    backFilterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1 },
    backFilterText: { fontSize: 12, fontWeight: '800' },

    resultCount: { fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 0.3 },

    catCard: { 
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 2
    },
    catIconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    catInfo: { flex: 1, paddingHorizontal: 14 },
    catName: { fontSize: 15, fontWeight: '900', marginBottom: 2 },
    catDesc: { fontSize: 11, fontWeight: '600', marginBottom: 8, lineHeight: 15 },

    foodItemModern: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
    },
    foodName: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
    foodCat: { fontSize: 11, marginBottom: 6, fontWeight: '600' },
    
    macroRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    macroChip: { fontSize: 11, fontWeight: '800' },

    kcalBlock: { alignItems: 'flex-end', marginRight: 15 },
    kcalValue: { fontSize: 18, fontWeight: '900' },
    kcalUnit: { fontSize: 9, fontWeight: '700' },

    addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

    emptyBox: { padding: 48, alignItems: 'center' },
    emptyText: { fontSize: 14, fontWeight: '800', marginTop: 12 },
    emptyHint: { fontSize: 12, marginTop: 4, textAlign: 'center', lineHeight: 18 },
});