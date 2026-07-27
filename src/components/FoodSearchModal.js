// src/components/FoodSearchModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, FlatList, KeyboardAvoidingView, Platform,
    useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BASE_URL = 'https://fitos-final.onrender.com';

const CATEGORIES = [
    'Carboidratos','Carnes e Proteínas','Frios e Laticínios',
    'Vegetais e Legumes','Frutas','Gorduras e Oleaginosas',
    'Suplementos','Bebidas','Refeições Prontas','Outros',
];

const CATEGORY_UI_INFO = {
    'Carboidratos':           { icon:'grain',             desc:'Arroz, massas, batatas, pães...', p:2,  c:28, f:0,  kcal:130 },
    'Carnes e Proteínas':     { icon:'food-steak',        desc:'Frango, carnes, peixes, ovos...',  p:31, c:0,  f:3,  kcal:165 },
    'Vegetais e Legumes':     { icon:'leaf',              desc:'Brócolis, couve, cenoura...',      p:2,  c:4,  f:0,  kcal:25  },
    'Frutas':                 { icon:'fruit-watermelon',  desc:'Banana, maçã, mamão...',           p:1,  c:23, f:0,  kcal:89  },
    'Gorduras e Oleaginosas': { icon:'bottle-tonic',      desc:'Azeite, pasta de amendoim...',     p:25, c:20, f:50, kcal:588 },
    'Suplementos':            { icon:'flask',             desc:'Whey protein, creatina...',        p:75, c:10, f:5,  kcal:400 },
    'Frios e Laticínios':     { icon:'cheese',            desc:'Queijos, iogurtes, leites...',     p:11, c:3,  f:4,  kcal:98  },
    'Bebidas':                { icon:'cup-water',         desc:'Café, chás, sucos zero...',        p:0,  c:0,  f:0,  kcal:0   },
    'Refeições Prontas':      { icon:'silverware-fork-knife', desc:'Pratos preparados...',         p:8,  c:20, f:8,  kcal:180 },
    'Outros':                 { icon:'dots-horizontal',   desc:'Outros alimentos...',              p:2,  c:10, f:2,  kcal:80  },
};

const MACRO_COLOR = { p:'#32ADE6', c:'#FFCC00', f:'#FF9500' };

function useDebounce(value, delay) {
    const [dv, setDv] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDv(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return dv;
}

export default function FoodSearchModal({
    visible, onClose, onSelectFood, targetGroup,
    theme, initialCategoryFilter = 'Todas', coachId = '',
}) {
    const [search,           setSearch]           = useState('');
    const [selectedCategory, setSelectedCategory] = useState(initialCategoryFilter);
    const [activeTab,        setActiveTab]        = useState('favorites');
    const [foods,            setFoods]            = useState([]);
    const [loading,          setLoading]          = useState(false);
    const [total,            setTotal]            = useState(0);
    const [page,             setPage]             = useState(1);
    const [hasMore,          setHasMore]          = useState(false);
    const abortRef = useRef(null);

    const isWeb = Platform.OS === 'web';
    const { height: windowHeight } = useWindowDimensions();
    const sheetHeight = Math.round(windowHeight * 0.88);
    const debouncedSearch = useDebounce(search, 350);

    useEffect(() => {
        if (visible) {
            setSelectedCategory(initialCategoryFilter);
            setSearch('');
            setActiveTab('favorites');
            setFoods([]);
            setPage(1);
        }
    }, [visible, initialCategoryFilter]);

    const fetchFoods = useCallback(async (pageNum = 1, append = false) => {
        if (!visible) return;
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                coachId,
                page:      String(pageNum),
                limit:     '200',
                favorites: activeTab === 'favorites' ? 'true' : 'false',
            });
            if (debouncedSearch.length >= 2) params.set('q', debouncedSearch);
            if (selectedCategory !== 'Todas') params.set('category', selectedCategory);

            const res  = await fetch(`${BASE_URL}/api/food/search?${params}`, { signal: ctrl.signal });
            const data = await res.json();
            const newFoods = data.foods ?? [];
            setFoods(prev => append ? [...prev, ...newFoods] : newFoods);
            setTotal(data.total ?? 0);
            const totalPages = data.pages ?? 1;
            setHasMore(pageNum < totalPages);
            setPage(pageNum);

            // 🔥 Se ainda há mais páginas, carrega automaticamente
            if (pageNum < totalPages) {
                setTimeout(() => fetchFoods(pageNum + 1, true), 100);
            }
        } catch (e) {
            if (e.name !== 'AbortError') console.error('[FoodSearch]', e);
        } finally {
            setLoading(false);
        }
    }, [visible, coachId, debouncedSearch, selectedCategory, activeTab]);

    useEffect(() => {
        if (visible) { setFoods([]); fetchFoods(1, false); }
    }, [debouncedSearch, selectedCategory, activeTab, visible]);

    const switchTab = (tab) => { setActiveTab(tab); setSelectedCategory('Todas'); setFoods([]); };
    const isViewingCategories = selectedCategory === 'Todas' && debouncedSearch.length === 0;

    const SourceBadge = ({ source }) => (
        <View style={[styles.srcBadge, {
            backgroundColor: source === 'TACO' ? '#34C75918' : theme.accent + '18',
            borderColor:     source === 'TACO' ? '#34C75950' : theme.accent + '50',
        }]}>
            <Text style={[styles.srcText, { color: source === 'TACO' ? '#34C759' : theme.accent }]}>
                {source === 'TACO' ? 'TACO' : '★'}
            </Text>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={[styles.backdrop, isWeb && { height: windowHeight }]} activeOpacity={1} onPress={onClose}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={!isWeb}
                    style={{ flex:1, width:'100%', justifyContent:'flex-end', alignItems:'center' }}>
                    <TouchableOpacity activeOpacity={1}
                        style={[styles.sheet, { backgroundColor:theme.bg, borderColor:theme.border, height:sheetHeight }]}>

                        <View style={[styles.handle, { backgroundColor:theme.border }]} />

                        {/* HEADER */}
                        <View style={styles.header}>
                            <View style={{ flex:1 }}>
                                <Text style={[styles.title, { color:theme.text }]}>
                                    {isViewingCategories ? 'SELECIONE A CATEGORIA' : 'TABELA DE ALIMENTOS'}
                                </Text>
                                {targetGroup && (
                                    <View style={[styles.subBadge, { backgroundColor:theme.accent+'20', borderColor:theme.accent+'50' }]}>
                                        <MaterialCommunityIcons name="swap-horizontal" size={11} color={theme.accent} />
                                        <Text style={[styles.subBadgeText, { color:theme.accent }]}>Buscando substituto</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                                <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* ABAS */}
                        <View style={[styles.tabRow, { borderColor:theme.border }]}>
                            <TouchableOpacity style={[styles.tab, activeTab==='favorites' && { borderBottomColor:theme.accent, borderBottomWidth:2 }]}
                                onPress={() => switchTab('favorites')}>
                                <MaterialCommunityIcons name="star" size={13} color={activeTab==='favorites' ? theme.accent : theme.textSecondary} />
                                <Text style={[styles.tabText, { color:activeTab==='favorites' ? theme.accent : theme.textSecondary }]}>Favoritos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, activeTab==='taco' && { borderBottomColor:'#34C759', borderBottomWidth:2 }]}
                                onPress={() => switchTab('taco')}>
                                <MaterialCommunityIcons name="database" size={13} color={activeTab==='taco' ? '#34C759' : theme.textSecondary} />
                                <Text style={[styles.tabText, { color:activeTab==='taco' ? '#34C759' : theme.textSecondary }]}>TACO Completa</Text>
                                <View style={[styles.tabBadge, { backgroundColor:'#34C75920' }]}>
                                    <Text style={{ fontSize:9, fontWeight:'900', color:'#34C759' }}>589</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* BUSCA */}
                        <View style={[styles.searchBox, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                            <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                            <TextInput style={[styles.searchInput, { color:theme.text }]}
                                placeholder="Buscar alimento..." placeholderTextColor={theme.textSecondary}
                                value={search} onChangeText={t => { setSearch(t); setFoods([]); }} />
                            {loading && <ActivityIndicator size="small" color={theme.accent} style={{ marginRight:4 }} />}
                            {search.length > 0 && !loading && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* VOLTAR */}
                        {!isViewingCategories && debouncedSearch.length === 0 && (
                            <TouchableOpacity style={[styles.backBtn, { backgroundColor:theme.accent+'15', borderColor:theme.accent+'40' }]}
                                onPress={() => setSelectedCategory('Todas')}>
                                <MaterialCommunityIcons name="arrow-left" size={16} color={theme.accent} />
                                <Text style={[styles.backText, { color:theme.accent }]}>Voltar ({selectedCategory})</Text>
                            </TouchableOpacity>
                        )}

                        {/* CONTADOR */}
                        {!isViewingCategories && (
                            <Text style={[styles.resultCount, { color:theme.textSecondary }]}>
                                {loading && foods.length === 0 ? 'Buscando...' : `${total} alimentos encontrados`}
                            </Text>
                        )}

                        {/* LISTA */}
                        {isViewingCategories ? (
                            <FlatList data={CATEGORIES} keyExtractor={i => i}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom:40 }}
                                renderItem={({ item }) => {
                                    const info = CATEGORY_UI_INFO[item] ?? { icon:'dots-horizontal', desc:'', p:0, c:0, f:0, kcal:0 };
                                    return (
                                        <TouchableOpacity style={[styles.catCard, { backgroundColor:theme.surface, borderColor:theme.border }]}
                                            activeOpacity={0.8} onPress={() => setSelectedCategory(item)}>
                                            <View style={[styles.catIconBox, { backgroundColor:theme.accent+'15' }]}>
                                                <MaterialCommunityIcons name={info.icon} size={24} color={theme.accent} />
                                            </View>
                                            <View style={styles.catInfo}>
                                                <Text style={[styles.catName, { color:theme.text }]}>{item}</Text>
                                                <Text style={[styles.catDesc, { color:theme.textSecondary }]}>{info.desc}</Text>
                                                <View style={styles.macroRow}>
                                                    <Text style={[styles.macroChip, { color:theme.textSecondary }]}>{info.kcal} kcal</Text>
                                                    <Text style={[styles.macroChip, { color:MACRO_COLOR.p }]}>P {info.p}g</Text>
                                                    <Text style={[styles.macroChip, { color:MACRO_COLOR.c }]}>C {info.c}g</Text>
                                                    <Text style={[styles.macroChip, { color:MACRO_COLOR.f }]}>G {info.f}g</Text>
                                                </View>
                                            </View>
                                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        ) : (
                            <FlatList data={foods} keyExtractor={(item, i) => `${item.id}-${i}`}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom:40 }}
                                keyboardShouldPersistTaps="handled"
                                onEndReached={() => { if (!loading && hasMore) fetchFoods(page + 1, true); }}
                                onEndReachedThreshold={0.3}
                                ListFooterComponent={loading && foods.length > 0
                                    ? <ActivityIndicator color={theme.accent} style={{ marginVertical:16 }} />
                                    : null}
                                renderItem={({ item }) => {
                                    const kcal = item.calories_per_100 ?? item.kcal ?? 0;
                                    return (
                                        <TouchableOpacity style={[styles.foodItem, { backgroundColor:theme.surface, borderColor:theme.border }]}
                                            onPress={() => onSelectFood(item)} activeOpacity={0.7}>
                                            <View style={{ flex:1, paddingRight:10 }}>
                                                <Text style={[styles.foodName, { color:theme.text }]} numberOfLines={2}>{item.name}</Text>
                                                <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:5 }}>
                                                    <Text style={[styles.foodCat, { color:theme.textSecondary }]}>{item.subcategory || item.category}</Text>
                                                    <SourceBadge source={item.source} />
                                                </View>
                                                <View style={styles.macroRow}>
                                                    {[['P',item.p,MACRO_COLOR.p],['C',item.c,MACRO_COLOR.c],['G',item.f,MACRO_COLOR.f]].map(([l,v,c]) =>
                                                        v != null ? <Text key={l} style={[styles.macroChip,{color:c}]}>{l} {v}g</Text> : null
                                                    )}
                                                </View>
                                            </View>
                                            <View style={styles.kcalBlock}>
                                                <Text style={[styles.kcalValue, { color:theme.text }]}>{Math.round(kcal)}</Text>
                                                <Text style={[styles.kcalUnit, { color:theme.textSecondary }]}>kcal/100{item.base_unit??'g'}</Text>
                                            </View>
                                            <View style={[styles.addBtn, { backgroundColor:theme.accent }]}>
                                                <MaterialCommunityIcons name="plus" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={() => !loading ? (
                                    <View style={styles.emptyBox}>
                                        <MaterialCommunityIcons name="food-off" size={40} color={theme.textSecondary} />
                                        <Text style={[styles.emptyText, { color:theme.textSecondary }]}>Nenhum alimento encontrado</Text>
                                        {activeTab === 'favorites' && (
                                            <Text style={[styles.emptyHint, { color:theme.textSecondary }]}>
                                                Tente a aba TACO Completa
                                            </Text>
                                        )}
                                    </View>
                                ) : null}
                            />
                        )}
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop:    { flex:1, backgroundColor:'rgba(0,0,0,0.65)', justifyContent:'flex-end', alignItems:'center' },
    sheet:       { width:'100%', maxWidth:480, borderTopLeftRadius:28, borderTopRightRadius:28, borderWidth:1, borderBottomWidth:0, paddingHorizontal:20, paddingTop:12, paddingBottom:0, shadowColor:'#000', shadowOffset:{width:0,height:-5}, shadowOpacity:0.1, shadowRadius:10, elevation:5 },
    handle:      { width:36, height:4, borderRadius:2, alignSelf:'center', marginBottom:16 },
    header:      { flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 },
    title:       { fontSize:18, fontWeight:'900', letterSpacing:-0.3, marginBottom:6 },
    subBadge:    { flexDirection:'row', alignItems:'center', gap:4, alignSelf:'flex-start', paddingHorizontal:9, paddingVertical:4, borderRadius:20, borderWidth:1 },
    subBadgeText:{ fontSize:10, fontWeight:'700' },
    closeBtn:    { padding:7, borderRadius:10, borderWidth:1, marginTop:2 },
    tabRow:      { flexDirection:'row', borderBottomWidth:1, marginBottom:12 },
    tab:         { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10 },
    tabText:     { fontSize:13, fontWeight:'800' },
    tabBadge:    { paddingHorizontal:6, paddingVertical:2, borderRadius:8 },
    searchBox:   { flexDirection:'row', alignItems:'center', gap:10, padding:14, borderRadius:16, borderWidth:1, marginBottom:12 },
    searchInput: { flex:1, fontSize:14, outlineStyle:'none' },
    backBtn:     { flexDirection:'row', alignItems:'center', gap:6, paddingVertical:8, paddingHorizontal:12, borderRadius:10, alignSelf:'flex-start', marginBottom:10, borderWidth:1 },
    backText:    { fontSize:12, fontWeight:'800' },
    resultCount: { fontSize:11, fontWeight:'700', marginBottom:10, letterSpacing:0.3 },
    catCard:     { flexDirection:'row', alignItems:'center', padding:16, borderRadius:20, borderWidth:1, marginBottom:12, shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:0.04, shadowRadius:5, elevation:2 },
    catIconBox:  { width:54, height:54, borderRadius:16, alignItems:'center', justifyContent:'center' },
    catInfo:     { flex:1, paddingHorizontal:14 },
    catName:     { fontSize:15, fontWeight:'900', marginBottom:2 },
    catDesc:     { fontSize:11, fontWeight:'600', marginBottom:8, lineHeight:15 },
    foodItem:    { flexDirection:'row', alignItems:'center', padding:14, borderRadius:18, borderWidth:1, marginBottom:10 },
    foodName:    { fontSize:13, fontWeight:'800', marginBottom:3 },
    foodCat:     { fontSize:10, fontWeight:'600' },
    srcBadge:    { paddingHorizontal:5, paddingVertical:2, borderRadius:5, borderWidth:1 },
    srcText:     { fontSize:8, fontWeight:'900', letterSpacing:0.5 },
    macroRow:    { flexDirection:'row', gap:8, flexWrap:'wrap' },
    macroChip:   { fontSize:11, fontWeight:'800' },
    kcalBlock:   { alignItems:'flex-end', marginRight:12 },
    kcalValue:   { fontSize:18, fontWeight:'900' },
    kcalUnit:    { fontSize:9, fontWeight:'700' },
    addBtn:      { width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
    emptyBox:    { padding:48, alignItems:'center' },
    emptyText:   { fontSize:14, fontWeight:'800', marginTop:12 },
    emptyHint:   { fontSize:12, marginTop:6, textAlign:'center', lineHeight:18 },
});
