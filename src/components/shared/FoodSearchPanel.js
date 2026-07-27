// src/components/shared/FoodSearchPanel.js
// Componente reutilizável de busca de alimentos
// Usado no DietBuilderModal e pode ser usado em outros contextos

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, FlatList, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL, MC, CATEGORIES } from '../../utils/dietBuilderUtils';

function useDebounce(value, delay) {
    const [dv, setDv] = useState(value);
    useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
    return dv;
}

export default function FoodSearchPanel({ coachId, onSelect, theme, groupFoodIds }) {
    const [search,   setSearch]   = useState('');
    const [results,  setResults]  = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [tab,      setTab]      = useState('favorites');
    const [category, setCategory] = useState('Todas');
    const [catOpen,  setCatOpen]  = useState(false);
    const abortRef = useRef(null);
    const debouncedSearch = useDebounce(search, 350);

    useEffect(() => {
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);

        const params = new URLSearchParams({
            coachId, limit:'500', page:'1',
            favorites: tab === 'favorites' ? 'true' : 'false',
        });
        if (debouncedSearch.length >= 2) params.set('q', debouncedSearch);
        if (category !== 'Todas') params.set('category', category);

        fetch(`${BASE_URL}/api/food/search?${params}`, { signal: ctrl.signal })
            .then(r => r.json())
            .then(async d => {
                const foods = d.foods ?? [];
                setResults(foods);
                // Carrega páginas restantes se houver
                const totalPages = d.pages ?? 1;
                if (totalPages > 1) {
                    let all = [...foods];
                    for (let p = 2; p <= totalPages; p++) {
                        try {
                            const p2 = new URLSearchParams({ coachId, limit:'500', page:String(p), favorites: tab==='favorites' ? 'true' : 'false' });
                            if (debouncedSearch.length >= 2) p2.set('q', debouncedSearch);
                            if (category !== 'Todas') p2.set('category', category);
                            const r2 = await fetch(`${BASE_URL}/api/food/search?${p2}`);
                            const d2 = await r2.json();
                            all = [...all, ...(d2.foods ?? [])];
                            setResults([...all]);
                        } catch {}
                    }
                }
            })
            .catch(e => { if (e.name !== 'AbortError') console.error('[FoodSearchPanel]', e); })
            .finally(() => setLoading(false));
    }, [debouncedSearch, tab, coachId, category]);

    return (
        <View style={{ flex:1 }}>
            {/* Abas Favoritos / TACO */}
            <View style={[s.tabRow, { borderColor:theme.border }]}>
                {[
                    ['favorites','star','Favoritos',theme.accent],
                    ['taco','database','TACO Completa','#34C759'],
                ].map(([k, icon, label, color]) => (
                    <TouchableOpacity key={k}
                        style={[s.tab, tab===k && { borderBottomColor:color, borderBottomWidth:2 }]}
                        onPress={() => { setTab(k); setCatOpen(false); setResults([]); }}
                    >
                        <MaterialCommunityIcons name={icon} size={13} color={tab===k ? color : theme.textSecondary} />
                        <Text style={{ fontSize:11, fontWeight:'900', color: tab===k ? color : theme.textSecondary }}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Busca */}
            <View style={{ paddingHorizontal:10, paddingTop:8, gap:6 }}>
                <View style={[s.searchBox, { backgroundColor:theme.bg, borderColor:theme.border }]}>
                    <MaterialCommunityIcons name="magnify" size={16} color={theme.textSecondary} />
                    <TextInput
                        style={[s.searchInput, { color:theme.text }]}
                        placeholder="Buscar alimento..."
                        placeholderTextColor={theme.textSecondary}
                        value={search}
                        onChangeText={t => { setSearch(t); setCatOpen(false); }}
                    />
                    {loading && <ActivityIndicator size="small" color={theme.accent} />}
                    {search.length > 0 && !loading && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Dropdown categoria */}
                <TouchableOpacity
                    style={[s.catBtn, { backgroundColor:theme.bg, borderColor: catOpen ? theme.accent : theme.border }]}
                    onPress={() => setCatOpen(p => !p)}
                >
                    <MaterialCommunityIcons name="tag-outline" size={13} color={theme.accent} />
                    <Text style={{ flex:1, color:theme.text, fontSize:12, fontWeight:'700' }}>
                        {category === 'Todas' ? 'Todas as categorias' : category}
                    </Text>
                    <Text style={{ color:theme.textSecondary, fontSize:10, marginRight:4 }}>
                        {results.length > 0 ? `${results.length} alimentos` : ''}
                    </Text>
                    <MaterialCommunityIcons name={catOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Lista de categorias OU lista de alimentos */}
            {catOpen ? (
                <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:20 }}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity key={cat}
                            style={[s.catItem, { backgroundColor: category===cat ? theme.accent+'18' : 'transparent', borderBottomColor:theme.border }]}
                            onPress={() => { setCategory(cat); setCatOpen(false); setResults([]); }}
                        >
                            <MaterialCommunityIcons
                                name={category===cat ? 'radiobox-marked' : 'radiobox-blank'}
                                size={16}
                                color={category===cat ? theme.accent : theme.textSecondary}
                            />
                            <Text style={{ color: category===cat ? theme.accent : theme.text, fontWeight: category===cat ? '900' : '600', fontSize:13, marginLeft:10 }}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, i) => `${item.id}-${i}`}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingHorizontal:10, paddingTop:8, paddingBottom:20 }}
                    renderItem={({ item }) => {
                        const kcal      = item.calories_per_100 ?? item.kcal ?? 0;
                        const alreadyIn = groupFoodIds?.has(item.id) ?? false;
                        return (
                            <TouchableOpacity
                                style={[s.foodRow, { backgroundColor:theme.surface, borderColor: alreadyIn ? theme.accent+'50' : theme.border }]}
                                onPress={() => !alreadyIn && onSelect(item)}
                                activeOpacity={alreadyIn ? 1 : 0.7}
                            >
                                <View style={{ flex:1 }}>
                                    <Text style={{ color:theme.text, fontWeight:'800', fontSize:12 }} numberOfLines={1}>{item.name}</Text>
                                    <View style={{ flexDirection:'row', gap:8, marginTop:3 }}>
                                        <Text style={{ fontSize:10, fontWeight:'900', color:MC.kcal }}>{Math.round(kcal)} kcal</Text>
                                        <Text style={{ fontSize:10, fontWeight:'800', color:MC.p }}>P {item.p??item.protein??0}g</Text>
                                        <Text style={{ fontSize:10, fontWeight:'800', color:MC.c }}>C {item.c??item.carbs??0}g</Text>
                                        <Text style={{ fontSize:10, fontWeight:'800', color:MC.f }}>G {item.f??item.fat??0}g</Text>
                                    </View>
                                </View>
                                {alreadyIn ? (
                                    <View style={[s.inGroupBadge, { backgroundColor: theme.accent+'20', borderColor: theme.accent+'50' }]}>
                                        <MaterialCommunityIcons name="check" size={12} color={theme.accent} />
                                        <Text style={{ fontSize:9, fontWeight:'900', color:theme.accent }}>no grupo</Text>
                                    </View>
                                ) : (
                                    <View style={[s.addBtn, { backgroundColor:theme.accent }]}>
                                        <MaterialCommunityIcons name="plus" size={16} color="#000" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={() => !loading ? (
                        <View style={{ alignItems:'center', padding:24 }}>
                            <MaterialCommunityIcons name="food-off" size={32} color={theme.textSecondary} />
                            <Text style={{ color:theme.textSecondary, fontSize:12, marginTop:8, textAlign:'center' }}>
                                {debouncedSearch.length < 2 && category === 'Todas'
                                    ? 'Selecione uma categoria ou busque por nome'
                                    : 'Nenhum alimento encontrado'}
                            </Text>
                        </View>
                    ) : null}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    tabRow:    { flexDirection:'row', borderBottomWidth:1 },
    tab:       { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:10 },
    searchBox: { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:12, borderWidth:1 },
    searchInput:{ flex:1, outlineStyle:'none' },
    catBtn:    { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:12, borderWidth:1 },
    catItem:   { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:13, borderBottomWidth:1 },
    foodRow:   { flexDirection:'row', alignItems:'center', padding:10, borderRadius:12, borderWidth:1, marginBottom:6 },
    addBtn:     { width:32, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
    inGroupBadge: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:6, borderRadius:10, borderWidth:1 },
});