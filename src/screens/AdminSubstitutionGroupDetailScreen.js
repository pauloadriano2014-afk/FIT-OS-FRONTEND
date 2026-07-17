// src/screens/AdminSubstitutionGroupDetailScreen.js
// Tela 2 — membros de um grupo + busca para adicionar alimentos
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    ActivityIndicator, Modal, TextInput, Alert, Platform,
    SafeAreaView, useWindowDimensions, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const BASE_URL = 'https://fitos-final.onrender.com';

function useDebounce(value, delay) {
    const [dv, setDv] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDv(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return dv;
}

// ─── MODAL DE BUSCA PARA ADICIONAR ALIMENTO ───────────────────────────────────
function AddFoodModal({ visible, onClose, onAdd, groupFoodIds, coachId, theme }) {
    const [search,  setSearch]  = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding,  setAdding]  = useState(new Set());
    const abortRef = useRef(null);
    const debouncedSearch = useDebounce(search, 350);

    useEffect(() => {
        if (!visible) { setSearch(''); setResults([]); return; }
    }, [visible]);

    useEffect(() => {
        if (!visible || debouncedSearch.length < 2) { setResults([]); return; }
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        fetch(`${BASE_URL}/api/food/search?coachId=${coachId}&q=${encodeURIComponent(debouncedSearch)}&limit=30`, { signal: ctrl.signal })
            .then(r => r.json())
            .then(d => setResults(d.foods ?? []))
            .catch(e => { if (e.name !== 'AbortError') console.error(e); })
            .finally(() => setLoading(false));
    }, [debouncedSearch, visible, coachId]);

    const handleAdd = async (food) => {
        if (adding.has(food.id)) return;
        setAdding(prev => { const s = new Set(prev); s.add(food.id); return s; });
        await onAdd(food);
        setAdding(prev => { const s = new Set(prev); s.delete(food.id); return s; });
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={[styles.searchSheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={styles.formHeader}>
                        <View>
                            <Text style={[styles.formTitle, { color: theme.text }]}>ADICIONAR ALIMENTO</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                Busque e adicione ao grupo
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Digite o nome do alimento..."
                            placeholderTextColor={theme.textSecondary}
                            autoFocus
                        />
                        {loading && <ActivityIndicator size="small" color={theme.accent} />}
                        {search.length > 0 && !loading && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {debouncedSearch.length < 2 && (
                        <View style={{ alignItems: 'center', padding: 32 }}>
                            <MaterialCommunityIcons name="magnify" size={40} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 13, textAlign: 'center' }}>
                                Digite pelo menos 2 letras para buscar
                            </Text>
                        </View>
                    )}

                    <FlatList
                        data={results}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => {
                            const alreadyIn  = groupFoodIds.has(item.id);
                            const isAdding   = adding.has(item.id);
                            const kcal       = item.calories_per_100 ?? item.kcal ?? 0;
                            const isCustom   = item.source === 'CUSTOM';
                            return (
                                <View style={[styles.resultRow, { backgroundColor: theme.surface, borderColor: alreadyIn ? theme.accent + '50' : theme.border }]}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                            <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                                            {isCustom && (
                                                <View style={[styles.srcBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
                                                    <Text style={{ fontSize: 8, fontWeight: '900', color: theme.accent }}>★ MEU</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ color: theme.textSecondary, fontSize: 10, marginBottom: 4 }}>{item.subcategory || item.category}</Text>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFCC00' }}>{Math.round(kcal)} kcal</Text>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#32ADE6' }}>P {item.p ?? item.protein ?? 0}g</Text>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#FF9500' }}>C {item.c ?? item.carbs ?? 0}g</Text>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#AF52DE' }}>G {item.f ?? item.fat ?? 0}g</Text>
                                        </View>
                                    </View>
                                    {alreadyIn ? (
                                        <View style={[styles.addedBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
                                            <MaterialCommunityIcons name="check" size={14} color={theme.accent} />
                                            <Text style={{ fontSize: 10, fontWeight: '900', color: theme.accent }}>no grupo</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.addBtn, { backgroundColor: theme.accent }]}
                                            onPress={() => handleAdd(item)}
                                            disabled={isAdding}
                                        >
                                            {isAdding
                                                ? <ActivityIndicator size="small" color="#000" />
                                                : <MaterialCommunityIcons name="plus" size={18} color="#000" />
                                            }
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function AdminSubstitutionGroupDetailScreen({ route, navigation }) {
    const { theme } = useTheme();
    const { height: windowHeight } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';

    const { group: initialGroup, coachId } = route.params;
    const [group,      setGroup]      = useState(initialGroup);
    const [members,    setMembers]    = useState(initialGroup.foods ?? []);
    const [addVisible, setAddVisible] = useState(false);
    const [removing,   setRemoving]   = useState(new Set());

    const memberIds = new Set(members.map(f => f.id));

    const handleAddFood = async (food) => {
        try {
            const res = await fetch(`${BASE_URL}/api/food/substitution-groups/${group.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachId, foodId: food.id }),
            });
            if (!res.ok) throw new Error('Erro');
            const data = await res.json();
            if (data.food) {
                // formata igual ao formato local
                const formatted = {
                    ...data.food,
                    calories_per_100: data.food.kcal,
                    p: data.food.protein,
                    c: data.food.carbs,
                    f: data.food.fat,
                    base_unit: data.food.baseUnit,
                };
                setMembers(prev => [...prev, formatted]);
            }
        } catch {
            Alert.alert('Erro', 'Não foi possível adicionar o alimento.');
        }
    };

    const handleRemove = async (food) => {
        if (removing.has(food.id)) return;
        const msg = `Remover "${food.name}" do grupo?`;
        const doRemove = async () => {
            setRemoving(prev => { const s = new Set(prev); s.add(food.id); return s; });
            try {
                const res = await fetch(
                    `${BASE_URL}/api/food/substitution-groups/${group.id}/members?coachId=${coachId}&foodId=${food.id}`,
                    { method: 'DELETE' }
                );
                if (!res.ok) throw new Error('Erro');
                setMembers(prev => prev.filter(m => m.id !== food.id));
            } catch {
                Alert.alert('Erro', 'Não foi possível remover.');
            } finally {
                setRemoving(prev => { const s = new Set(prev); s.delete(food.id); return s; });
            }
        };
        if (Platform.OS === 'web') { if (window.confirm(msg)) doRemove(); }
        else Alert.alert('Remover', msg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: doRemove },
        ]);
    };

    const renderMember = ({ item, index }) => {
        const isRemoving = removing.has(item.id);
        const kcal = item.calories_per_100 ?? item.kcal ?? 0;
        const isCustom = item.source === 'CUSTOM';

        return (
            <View style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {/* Número de ordem */}
                <View style={[styles.orderBadge, { backgroundColor: theme.accent + '18' }]}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: theme.accent }}>{index + 1}</Text>
                </View>

                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                        {isCustom && (
                            <View style={[styles.srcBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
                                <Text style={{ fontSize: 8, fontWeight: '900', color: theme.accent }}>★ MEU</Text>
                            </View>
                        )}
                    </View>
                    <Text style={{ color: theme.textSecondary, fontSize: 10, marginBottom: 4 }}>
                        {item.subcategory || item.category}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFCC00' }}>{Math.round(kcal)} kcal/100g</Text>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#32ADE6' }}>P {item.p ?? item.protein ?? 0}g</Text>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#FF9500' }}>C {item.c ?? item.carbs ?? 0}g</Text>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#AF52DE' }}>G {item.f ?? item.fat ?? 0}g</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: '#FF3B3010', borderColor: '#FF3B3030' }]}
                    onPress={() => handleRemove(item)}
                    disabled={isRemoving}
                >
                    {isRemoving
                        ? <ActivityIndicator size="small" color="#FF3B30" />
                        : <MaterialCommunityIcons name="minus" size={16} color="#FF3B30" />
                    }
                </TouchableOpacity>
            </View>
        );
    };

    const RootView = isWeb ? View : SafeAreaView;
    const rootStyle = isWeb
        ? { height: windowHeight, backgroundColor: theme.bg, display: 'flex', flexDirection: 'column' }
        : { flex: 1, backgroundColor: theme.bg };

    return (
        <RootView style={rootStyle}>
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.iconBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                        {group.name.toUpperCase()}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                        {members.length} {members.length === 1 ? 'alimento' : 'alimentos'} no grupo
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setAddVisible(true)}
                    style={[styles.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                >
                    <MaterialCommunityIcons name="plus" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            {/* COMO FUNCIONA */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                {group.description ? (
                    <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 10 }}>
                        {group.description}
                    </Text>
                ) : null}
                <View style={[styles.infoCard, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
                    <MaterialCommunityIcons name="information-outline" size={15} color={theme.accent} />
                    <Text style={{ flex: 1, color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>
                        Quando você usar qualquer alimento deste grupo ao montar uma dieta, os outros membros entrarão automaticamente como opções substitutas — com quantidade ajustada para ter as mesmas calorias que o alimento principal.
                    </Text>
                </View>
            </View>

            {/* LISTA DE MEMBROS */}
            <View style={{ flex: 1 }}>
                <FlatList
                    data={members}
                    keyExtractor={item => item.id}
                    renderItem={renderMember}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={{ alignItems: 'center', padding: 48 }}>
                            <MaterialCommunityIcons name="food-off" size={48} color={theme.textSecondary} />
                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15, marginTop: 16 }}>
                                Grupo vazio
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                                Adicione alimentos usando o botão + no canto superior direito.
                            </Text>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.accent, marginTop: 20, paddingHorizontal: 28 }]}
                                onPress={() => setAddVisible(true)}
                            >
                                <Text style={{ fontWeight: '900', color: '#000' }}>+ ADICIONAR ALIMENTO</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>

            <AddFoodModal
                visible={addVisible}
                onClose={() => setAddVisible(false)}
                onAdd={handleAddFood}
                groupFoodIds={memberIds}
                coachId={coachId}
                theme={theme}
            />
        </RootView>
    );
}

const styles = StyleSheet.create({
    header:      { flexDirection:'row', justifyContent:'space-between', padding:16, alignItems:'center', borderBottomWidth:1 },
    iconBtn:     { padding:9, borderRadius:14, borderWidth:1 },
    headerTitle: { fontWeight:'900', fontSize:13, letterSpacing:1.5 },
    infoCard:    { flexDirection:'row', alignItems:'flex-start', gap:8, padding:12, borderRadius:12, borderWidth:1 },
    memberCard:  { flexDirection:'row', alignItems:'center', padding:14, borderRadius:16, borderWidth:1, marginBottom:10 },
    orderBadge:  { width:32, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
    foodName:    { fontSize:13, fontWeight:'800', flex:1 },
    srcBadge:    { paddingHorizontal:5, paddingVertical:2, borderRadius:5, borderWidth:1 },
    removeBtn:   { width:34, height:34, borderRadius:10, borderWidth:1, alignItems:'center', justifyContent:'center' },
    saveBtn:     { padding:16, borderRadius:16, alignItems:'center', justifyContent:'center' },
    // Modal busca
    modalBackdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
    searchSheet:  { borderTopLeftRadius:28, borderTopRightRadius:28, borderWidth:1, padding:20, maxHeight:'85%' },
    formHeader:   { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
    formTitle:    { fontSize:16, fontWeight:'900', letterSpacing:1 },
    searchBox:    { flexDirection:'row', alignItems:'center', gap:10, padding:14, borderRadius:16, borderWidth:1, marginBottom:12 },
    searchInput:  { flex:1, fontSize:14, outlineStyle:'none' },
    resultRow:    { flexDirection:'row', alignItems:'center', padding:12, borderRadius:14, borderWidth:1, marginBottom:8 },
    addedBadge:   { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:6, borderRadius:10, borderWidth:1 },
    addBtn:       { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
    // Form grupo
    fieldLabel:   { fontSize:11, fontWeight:'800', marginBottom:5, letterSpacing:0.5 },
    formInput:    { borderWidth:1, borderRadius:12, padding:14, fontSize:14, marginBottom:14 },
    textArea:     { height:80, textAlignVertical:'top' },
    formSheet:    { borderTopLeftRadius:28, borderTopRightRadius:28, borderWidth:1, padding:24, maxHeight:'90%' },
});