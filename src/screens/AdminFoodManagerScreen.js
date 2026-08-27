// src/screens/AdminFoodManagerScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, FlatList, ActivityIndicator, ScrollView,
    Platform, useWindowDimensions, Alert, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { BASE_URL, CATEGORIES, SOURCE_FILTERS } from '../constants/foodManagerConstants';
import CreateFoodModal from '../components/AdminDiet/CreateFoodModal';
import { authHeaders } from '../utils/authToken';

function useDebounce(value, delay) {
    const [dv, setDv] = useState(value);
    useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
    return dv;
}

export default function AdminFoodManagerScreen({ navigation }) {
    const { theme } = useTheme();
    const { height: windowHeight } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';

    const [coachId,       setCoachId]       = useState('');
    const [search,        setSearch]        = useState('');
    const [sourceFilter,  setSourceFilter]  = useState('all');
    const [category,      setCategory]      = useState('Todas');
    const [foods,         setFoods]         = useState([]);
    const [loading,       setLoading]       = useState(false);
    const [total,         setTotal]         = useState(0);
    const [page,          setPage]          = useState(1);
    const [hasMore,       setHasMore]       = useState(false);
    const [createVisible, setCreateVisible] = useState(false);
    const [dropdownOpen,  setDropdownOpen]  = useState(false);
    const [toggling,      setToggling]      = useState(new Set());
    const abortRef = useRef(null);
    const debouncedSearch = useDebounce(search, 350);

    useEffect(() => {
        AsyncStorage.getItem('user').then(json => {
            if (json) { try { const u = JSON.parse(json); setCoachId(u.id ?? ''); } catch {} }
        });
    }, []);

    const fetchFoods = useCallback(async (pageNum, append) => {
        if (!coachId) return;
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        try {
            const params = new URLSearchParams({ coachId, page: String(pageNum), limit: '50' });
            if (debouncedSearch.length >= 2) params.set('q', debouncedSearch);
            if (category !== 'Todas')        params.set('category', category);
            if (sourceFilter === 'favorites') params.set('favorites', 'true');
            if (sourceFilter === 'taco')      params.set('source', 'TACO');
            if (sourceFilter === 'custom')    params.set('source', 'CUSTOM');

            params.set('t', Date.now().toString());

            const res  = await fetch(`${BASE_URL}/api/food/search?${params}`, { signal: ctrl.signal, headers: { ...(await authHeaders()) } });
            const data = await res.json();
            const newFoods = data.foods ?? [];

            setFoods(prev => {
                const merged = append ? [...prev, ...newFoods] : newFoods;
                return merged;
            });
            
            setTotal(data.total ?? 0);
            const totalPages = data.totalPages || data.pages || 1;
            setHasMore(pageNum < totalPages);
            setPage(pageNum);
        } catch (e) {
            if (e.name !== 'AbortError') console.error('[FoodManager]', e);
        } finally {
            setLoading(false);
        }
    }, [coachId, debouncedSearch, category, sourceFilter]);

    useEffect(() => {
        if (coachId) { setFoods([]); fetchFoods(1, false); }
    }, [coachId, debouncedSearch, category, sourceFilter]);

    const handleToggleFavorite = async (food) => {
        if (toggling.has(food.id)) return;
        setToggling(prev => { const s = new Set(prev); s.add(food.id); return s; });
        const newVal = !food.isFavorite;
        setFoods(prev => prev.map(f => f.id === food.id ? { ...f, isFavorite: newVal } : f));
        try {
            const res = await fetch(`${BASE_URL}/api/food/${food.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ coachId, isFavorite: newVal }),
            });
            if (!res.ok) throw new Error('Erro');
        } catch {
            setFoods(prev => prev.map(f => f.id === food.id ? { ...f, isFavorite: !newVal } : f));
            Alert.alert('Erro', 'Não foi possível atualizar o favorito.');
        } finally {
            setToggling(prev => { const s = new Set(prev); s.delete(food.id); return s; });
        }
    };

    const handleDeleteFood = (food) => {
        if (food.source !== 'CUSTOM') return;
        const msg = `Excluir "${food.name}"?`;
        const doDelete = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/food/${food.id}?coachId=${coachId}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
                if (!res.ok) throw new Error('Erro');
                setFoods(prev => prev.filter(f => f.id !== food.id));
                setTotal(prev => prev - 1);
            } catch { Alert.alert('Erro', 'Não foi possível excluir.'); }
        };
        if (Platform.OS === 'web') { if (window.confirm(msg)) doDelete(); }
        else Alert.alert('Excluir', msg, [{ text:'Cancelar', style:'cancel' }, { text:'Excluir', style:'destructive', onPress:doDelete }]);
    };

    const handleFoodCreated = (newFood) => {
        setFoods(prev => [{ ...newFood, calories_per_100:newFood.kcal, p:newFood.protein, c:newFood.carbs, f:newFood.fat, base_unit:newFood.baseUnit }, ...prev]);
        setTotal(prev => prev + 1);
    };

    const renderFood = ({ item }) => {
        const isFav     = item.isFavorite;
        const isCustom  = item.source === 'CUSTOM';
        const isLoading = toggling.has(item.id);
        const kcal      = item.calories_per_100 ?? item.kcal ?? 0;
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => setDropdownOpen(false)}>
                <View style={[s.foodRow, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <TouchableOpacity onPress={() => handleToggleFavorite(item)} disabled={isLoading} style={s.favBtn}>
                        {isLoading
                            ? <ActivityIndicator size="small" color={theme.accent} />
                            : <MaterialCommunityIcons name={isFav ? 'star' : 'star-outline'} size={22} color={isFav ? '#FFCC00' : theme.textSecondary} />
                        }
                    </TouchableOpacity>
                    <View style={{ flex:1, paddingHorizontal:10 }}>
                        <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:2 }}>
                            <Text style={[s.foodName, { color:theme.text }]} numberOfLines={1}>{item.name}</Text>
                            <View style={[s.srcBadge, { backgroundColor: isCustom ? theme.accent+'20' : '#34C75920', borderColor: isCustom ? theme.accent+'50' : '#34C75950' }]}>
                                <Text style={{ fontSize:8, fontWeight:'900', color: isCustom ? theme.accent : '#34C759' }}>{isCustom ? '★ MEU' : 'TACO'}</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize:10, color:theme.textSecondary, fontWeight:'600', marginBottom:4 }}>{item.subcategory || item.category}</Text>
                        <View style={{ flexDirection:'row', gap:10 }}>
                            <Text style={{ fontSize:10, fontWeight:'900', color:'#FFCC00' }}>{Math.round(kcal)} kcal</Text>
                            <Text style={{ fontSize:10, fontWeight:'800', color:'#32ADE6' }}>P {item.p??item.protein??0}g</Text>
                            <Text style={{ fontSize:10, fontWeight:'800', color:'#FF9500' }}>C {item.c??item.carbs??0}g</Text>
                            <Text style={{ fontSize:10, fontWeight:'800', color:'#AF52DE' }}>G {item.f??item.fat??0}g</Text>
                        </View>
                    </View>
                    {isCustom && (
                        <TouchableOpacity onPress={() => handleDeleteFood(item)} style={s.deleteBtn}>
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const activeSourceFilter = SOURCE_FILTERS.find(f => f.key === sourceFilter);
    const dropdownListHeight = Math.min(CATEGORIES.length * 46, 300);
    const RootView = isWeb ? View : SafeAreaView;
    const rootStyle = isWeb
        ? { height:windowHeight, backgroundColor:theme.bg, display:'flex', flexDirection:'column' }
        : { flex:1, backgroundColor:theme.bg };

    return (
        <RootView style={rootStyle}>
            {/* HEADER */}
            <View style={[s.header, { backgroundColor:theme.surface, borderBottomColor:theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[s.iconBtn, { backgroundColor:theme.bg, borderColor:theme.border }]}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex:1, alignItems:'center' }}>
                    <Text style={[s.headerTitle, { color:theme.text }]}>GERENCIAR ALIMENTOS</Text>
                    <Text style={{ color:theme.textSecondary, fontSize:11, fontWeight:'700', marginTop:2 }}>{total} alimentos encontrados</Text>
                </View>
                <TouchableOpacity onPress={() => setCreateVisible(true)} style={[s.iconBtn, { backgroundColor:theme.accent, borderColor:theme.accent }]}>
                    <MaterialCommunityIcons name="plus" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            {/* FILTROS */}
            <View style={{ paddingHorizontal:16, paddingTop:12, zIndex:50 }}>
                <View style={[s.searchBox, { backgroundColor:theme.surface, borderColor:theme.border, marginBottom:10 }]}>
                    <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                    <TextInput
                        style={[s.searchInput, { color:theme.text }]}
                        placeholder="Buscar por nome..."
                        placeholderTextColor={theme.textSecondary}
                        value={search}
                        onChangeText={t => { setSearch(t); setDropdownOpen(false); }}
                    />
                    {loading && <ActivityIndicator size="small" color={theme.accent} style={{ marginRight:4 }} />}
                    {search.length > 0 && !loading && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Source pills */}
                <View style={{ flexDirection:'row', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                    {SOURCE_FILTERS.map(f => (
                        <TouchableOpacity key={f.key}
                            style={[s.filterPill, { backgroundColor: sourceFilter===f.key ? theme.accent+'20' : theme.surface, borderColor: sourceFilter===f.key ? theme.accent : theme.border }]}
                            onPress={() => { setSourceFilter(f.key); setFoods([]); setDropdownOpen(false); }}
                        >
                            <MaterialCommunityIcons name={f.icon} size={13} color={sourceFilter===f.key ? theme.accent : theme.textSecondary} />
                            <Text style={{ fontSize:11, fontWeight:'900', color: sourceFilter===f.key ? theme.accent : theme.textSecondary }}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeSourceFilter?.tip && (
                    <View style={[s.infoCard, { backgroundColor:theme.accent+'10', borderColor:theme.accent+'30' }]}>
                        <MaterialCommunityIcons name="information-outline" size={15} color={theme.accent} />
                        <Text style={{ flex:1, color:theme.textSecondary, fontSize:12, lineHeight:18 }}>{activeSourceFilter.tip}</Text>
                    </View>
                )}

                <View style={{ zIndex:100, marginTop:8 }}>
                    <TouchableOpacity
                        style={[s.dropdownBtn, { backgroundColor:theme.surface, borderColor: dropdownOpen ? theme.accent : theme.border }]}
                        onPress={() => setDropdownOpen(prev => !prev)}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="tag-outline" size={16} color={theme.accent} />
                        <Text style={{ flex:1, color:theme.text, fontWeight:'800', fontSize:13 }}>
                            {category === 'Todas' ? 'Todas as categorias' : category}
                        </Text>
                        <Text style={{ color:theme.textSecondary, fontSize:11, marginRight:6 }}>Filtrar por categoria</Text>
                        <MaterialCommunityIcons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {dropdownOpen && (
                        <View style={[s.dropdownList, { backgroundColor:theme.surface, borderColor:theme.border, maxHeight:dropdownListHeight }]}>
                            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                                {CATEGORIES.map((cat, idx) => (
                                    <TouchableOpacity key={cat}
                                        style={[s.dropdownItem, { backgroundColor: category===cat ? theme.accent+'18' : 'transparent', borderBottomColor: idx < CATEGORIES.length-1 ? theme.border : 'transparent' }]}
                                        onPress={() => { setCategory(cat); setFoods([]); setDropdownOpen(false); }}
                                    >
                                        <MaterialCommunityIcons name={category===cat ? 'radiobox-marked' : 'radiobox-blank'} size={16} color={category===cat ? theme.accent : theme.textSecondary} />
                                        <Text style={{ color: category===cat ? theme.accent : theme.text, fontWeight: category===cat ? '900' : '600', fontSize:13, marginLeft:10 }}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>

            {dropdownOpen && <View style={{ height:dropdownListHeight }} />}

            {/* LISTA DE ALIMENTOS: SOLUÇÃO NUCLEAR DO FLATLIST */}
            {!dropdownOpen && (
                <View style={{ flex:1, marginTop:10, width: '100%', overflow: 'hidden' }}>
                    <FlatList
                        data={foods}
                        extraData={{ page, loading, hasMore, length: foods.length }}
                        keyExtractor={(item, i) => `${item.id}-${i}`}
                        style={{ flex: 1 }}
                        // 🔥 A OPÇÃO NUCLEAR: Força a renderização imediata de mil itens se necessário!
                        initialNumToRender={1000}
                        maxToRenderPerBatch={1000}
                        windowSize={21}
                        removeClippedSubviews={false}
                        renderItem={renderFood}
                        contentContainerStyle={{ paddingHorizontal:16, paddingBottom:40 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        ListHeaderComponent={() => (
                            <TouchableOpacity
                                style={[s.groupsBtn, { backgroundColor:theme.surface, borderColor:theme.border }]}
                                onPress={() => navigation.navigate('AdminSubstitutionGroupsScreen', { coachId })}
                                activeOpacity={0.8}
                            >
                                <View style={[s.groupsIcon, { backgroundColor:theme.accent+'18' }]}>
                                    <MaterialCommunityIcons name="swap-horizontal" size={20} color={theme.accent} />
                                </View>
                                <View style={{ flex:1, paddingHorizontal:12 }}>
                                    <Text style={{ color:theme.text, fontWeight:'900', fontSize:13 }}>Grupos de Substituição</Text>
                                    <Text style={{ color:theme.textSecondary, fontSize:11, marginTop:2 }}>Defina quais alimentos se substituem automaticamente nas dietas</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                        ListFooterComponent={() => {
                            if (loading && foods.length > 0) {
                                return <ActivityIndicator color={theme.accent} style={{ marginVertical: 16 }} />;
                            }
                            if (!loading && hasMore) {
                                return (
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, marginVertical: 16 }}
                                        onPress={() => fetchFoods(page + 1, true)}
                                    >
                                        <MaterialCommunityIcons name="reload" size={20} color={theme.text} />
                                        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13, marginLeft: 8 }}>CARREGAR PÁGINA {page + 1}</Text>
                                    </TouchableOpacity>
                                );
                            }
                            return <View style={{ height: 40 }} />;
                        }}
                        ListEmptyComponent={() => !loading ? (
                            <View style={{ alignItems:'center', padding:48 }}>
                                <MaterialCommunityIcons name="food-off" size={48} color={theme.textSecondary} />
                                <Text style={{ color:theme.textSecondary, fontWeight:'800', marginTop:12, fontSize:14 }}>Nenhum alimento encontrado</Text>
                                <TouchableOpacity style={[s.saveBtn, { backgroundColor:theme.accent, marginTop:20 }]} onPress={() => setCreateVisible(true)}>
                                    <Text style={{ fontWeight:'900', color:'#000' }}>+ CRIAR ALIMENTO</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    />
                </View>
            )}

            <CreateFoodModal
                visible={createVisible}
                onClose={() => setCreateVisible(false)}
                onCreated={handleFoodCreated}
                coachId={coachId}
                theme={theme}
            />
        </RootView>
    );
}

const s = StyleSheet.create({
    header:      { flexDirection:'row', justifyContent:'space-between', padding:16, alignItems:'center', borderBottomWidth:1 },
    iconBtn:     { padding:9, borderRadius:14, borderWidth:1 },
    headerTitle: { fontWeight:'900', fontSize:13, letterSpacing:1.5 },
    searchBox:   { flexDirection:'row', alignItems:'center', gap:10, padding:14, borderRadius:16, borderWidth:1 },
    searchInput: { flex:1, fontSize:14, outlineStyle:'none' },
    filterPill:  { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:7, borderRadius:20, borderWidth:1 },
    infoCard:    { flexDirection:'row', alignItems:'flex-start', gap:8, padding:10, borderRadius:12, borderWidth:1, marginBottom:4 },
    dropdownBtn: { flexDirection:'row', alignItems:'center', gap:10, padding:14, borderRadius:16, borderWidth:1 },
    dropdownList:{ position:'absolute', top:54, left:0, right:0, borderRadius:16, borderWidth:1, zIndex:999, shadowColor:'#000', shadowOffset:{width:0,height:6}, shadowOpacity:0.2, shadowRadius:16, elevation:20, overflow:'hidden' },
    dropdownItem:{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:13, borderBottomWidth:1 },
    foodRow:     { flexDirection:'row', alignItems:'center', padding:12, borderRadius:16, borderWidth:1, marginBottom:8 },
    favBtn:      { width:36, height:36, alignItems:'center', justifyContent:'center' },
    foodName:    { fontSize:13, fontWeight:'800', flex:1 },
    srcBadge:    { paddingHorizontal:5, paddingVertical:2, borderRadius:5, borderWidth:1 },
    deleteBtn:   { width:36, height:36, alignItems:'center', justifyContent:'center' },
    groupsBtn:   { flexDirection:'row', alignItems:'center', marginBottom:12, padding:14, borderRadius:16, borderWidth:1 },
    groupsIcon:  { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
    saveBtn:     { padding:16, borderRadius:16, alignItems:'center', justifyContent:'center' },
});