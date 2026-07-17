// src/screens/AdminFoodManagerScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, FlatList, ActivityIndicator, Modal, ScrollView,
    Platform, useWindowDimensions, Alert, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const BASE_URL = 'https://fitos-final.onrender.com';

const CATEGORIES = [
    'Todas','Carboidratos','Carnes e Proteínas','Frios e Laticínios',
    'Vegetais e Legumes','Frutas','Gorduras e Oleaginosas',
    'Suplementos','Bebidas','Refeições Prontas','Outros',
];

const SOURCE_FILTERS = [
    {
        key:   'all',
        label: 'Todos',
        icon:  'database',
        tip:   'Mostra todos os alimentos disponíveis para você.',
    },
    {
        key:   'favorites',
        label: 'Favoritos ⭐',
        icon:  'star',
        tip:   'Alimentos marcados com ★. São esses que aparecem primeiro quando você monta uma dieta.',
    },
    {
        key:   'custom',
        label: 'Meus',
        icon:  'account-star',
        tip:   'Alimentos que você criou. Visíveis só para você e seus alunos.',
    },
    {
        key:   'taco',
        label: 'TACO',
        icon:  'leaf',
        tip:   'Tabela Brasileira de Composição de Alimentos (NEPA/UNICAMP). Base científica com ~590 alimentos reais.',
    },
];

function useDebounce(value, delay) {
    const [dv, setDv] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDv(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return dv;
}

// ─── DROPDOWN DE CATEGORIA ────────────────────────────────────────────────────
function CategoryDropdown({ value, onChange, theme, onOpen }) {
    const [open, setOpen] = useState(false);
    const label = value === 'Todas' ? 'Todas as categorias' : value;

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next && onOpen) onOpen();
    };

    return (
        <View>
            <TouchableOpacity
                style={[styles.dropdownBtn, { backgroundColor: theme.surface, borderColor: open ? theme.accent : theme.border }]}
                onPress={toggle}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="tag-outline" size={16} color={theme.accent} />
                <Text style={{ flex: 1, color: theme.text, fontWeight: '800', fontSize: 13 }}>{label}</Text>
                <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            {open && (
                <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {CATEGORIES.map((cat, idx) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.dropdownItem, {
                                backgroundColor: value === cat ? theme.accent + '18' : 'transparent',
                                borderBottomColor: idx < CATEGORIES.length - 1 ? theme.border : 'transparent',
                            }]}
                            onPress={() => { onChange(cat); setOpen(false); }}
                        >
                            <MaterialCommunityIcons
                                name={value === cat ? 'radiobox-marked' : 'radiobox-blank'}
                                size={16}
                                color={value === cat ? theme.accent : theme.textSecondary}
                            />
                            <Text style={{
                                color:      value === cat ? theme.accent : theme.text,
                                fontWeight: value === cat ? '900' : '600',
                                fontSize:   13,
                                marginLeft: 10,
                            }}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

// ─── CARD DE EXPLICAÇÃO ───────────────────────────────────────────────────────
function InfoCard({ theme, activeFilter }) {
    const filter = SOURCE_FILTERS.find(f => f.key === activeFilter);
    if (!filter?.tip) return null;
    return (
        <View style={[styles.infoCard, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
            <MaterialCommunityIcons name="information-outline" size={15} color={theme.accent} />
            <Text style={{ flex: 1, color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>
                {filter.tip}
            </Text>
        </View>
    );
}

// ─── FORMULÁRIO DE CRIAÇÃO ────────────────────────────────────────────────────
function CreateFoodModal({ visible, onClose, onCreated, coachId, theme }) {
    const EMPTY = { name:'', category:'Carnes e Proteínas', subcategory:'', baseUnit:'g', kcal:'', protein:'', carbs:'', fat:'', fiber:'' };
    const [form,   setForm]   = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const field = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

    const validate = () => {
        const e = {};
        if (!form.name.trim())   e.name    = 'Obrigatório';
        if (form.kcal === '')    e.kcal    = 'Obrigatório';
        if (form.protein === '') e.protein = 'Obrigatório';
        if (form.carbs === '')   e.carbs   = 'Obrigatório';
        if (form.fat === '')     e.fat     = 'Obrigatório';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/api/food`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId,
                    name:        form.name,
                    category:    form.category,
                    subcategory: form.subcategory || null,
                    baseUnit:    form.baseUnit,
                    kcal:        parseFloat(form.kcal),
                    protein:     parseFloat(form.protein),
                    carbs:       parseFloat(form.carbs),
                    fat:         parseFloat(form.fat),
                    fiber:       form.fiber ? parseFloat(form.fiber) : null,
                }),
            });
            if (!res.ok) throw new Error('Erro ao criar');
            const created = await res.json();
            onCreated(created);
            setForm(EMPTY);
            setErrors({});
            onClose();
        } catch (e) {
            Alert.alert('Erro', e.message);
        } finally {
            setSaving(false);
        }
    };

    const MacroInput = ({ label, fieldKey, color }) => (
        <View style={{ flex: 1 }}>
            <Text style={{ color, fontSize: 9, fontWeight: '900', marginBottom: 4, letterSpacing: 0.5 }}>
                {label}{errors[fieldKey] ? ' *' : ''}
            </Text>
            <TextInput
                style={[styles.macroInput, {
                    backgroundColor: theme.bg,
                    borderColor: errors[fieldKey] ? '#FF3B30' : theme.border,
                    color: theme.text,
                }]}
                value={form[fieldKey]}
                onChangeText={field(fieldKey)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
            />
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={[styles.formSheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={styles.formHeader}>
                        <View>
                            <Text style={[styles.formTitle, { color: theme.text }]}>NOVO ALIMENTO</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                Fica visível só para você e seus alunos
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                            NOME *{errors.name ? ` — ${errors.name}` : ''}
                        </Text>
                        <TextInput
                            style={[styles.formInput, {
                                backgroundColor: theme.bg,
                                borderColor: errors.name ? '#FF3B30' : theme.border,
                                color: theme.text,
                            }]}
                            value={form.name}
                            onChangeText={field('name')}
                            placeholder="Ex: Frango Grelhado Temperado"
                            placeholderTextColor={theme.textSecondary}
                        />

                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CATEGORIA</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {CATEGORIES.filter(c => c !== 'Todas').map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.catPill, {
                                            borderColor:     form.category === cat ? theme.accent : theme.border,
                                            backgroundColor: form.category === cat ? theme.accent + '20' : theme.surface,
                                        }]}
                                        onPress={() => field('category')(cat)}
                                    >
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: form.category === cat ? theme.accent : theme.textSecondary }}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>SUBCATEGORIA</Text>
                        <TextInput
                            style={[styles.formInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                            value={form.subcategory}
                            onChangeText={field('subcategory')}
                            placeholder="Ex: Proteínas Gerais"
                            placeholderTextColor={theme.textSecondary}
                        />

                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>UNIDADE BASE</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                            {['g', 'ml', 'un'].map(u => (
                                <TouchableOpacity
                                    key={u}
                                    style={[styles.unitPill, {
                                        borderColor:     form.baseUnit === u ? theme.accent : theme.border,
                                        backgroundColor: form.baseUnit === u ? theme.accent + '20' : theme.surface,
                                    }]}
                                    onPress={() => field('baseUnit')(u)}
                                >
                                    <Text style={{ fontWeight: '900', color: form.baseUnit === u ? theme.accent : theme.textSecondary }}>
                                        {u}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                            MACROS POR 100{form.baseUnit} *
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <MacroInput label="KCAL"  fieldKey="kcal"    color="#FFCC00" />
                            <MacroInput label="PROT"  fieldKey="protein" color="#32ADE6" />
                            <MacroInput label="CARBO" fieldKey="carbs"   color="#FF9500" />
                            <MacroInput label="GORD"  fieldKey="fat"     color="#AF52DE" />
                        </View>
                        <View style={{ marginTop: 10 }}>
                            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>FIBRA (opcional)</Text>
                            <TextInput
                                style={[styles.macroInput, {
                                    backgroundColor: theme.bg,
                                    borderColor: theme.border,
                                    color: theme.text,
                                    width: '25%',
                                }]}
                                value={form.fiber}
                                onChangeText={field('fiber')}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={[styles.infoCard, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30', marginTop: 16 }]}>
                            <MaterialCommunityIcons name="information-outline" size={15} color={theme.accent} />
                            <Text style={{ flex: 1, color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>
                                Alimentos criados por você entram automaticamente como Favoritos e ficam visíveis quando você monta dietas.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: theme.accent, marginTop: 16 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#000" />
                                : <Text style={{ fontWeight: '900', fontSize: 14, color: '#000' }}>SALVAR ALIMENTO</Text>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function AdminFoodManagerScreen({ navigation }) {
    const { theme } = useTheme();
    const { height: windowHeight } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';

    const [coachId,         setCoachId]         = useState('');
    const [search,          setSearch]          = useState('');
    const [sourceFilter,    setSourceFilter]    = useState('all');
    const [category,        setCategory]        = useState('Todas');
    const [foods,           setFoods]           = useState([]);
    const [loading,         setLoading]         = useState(false);
    const [total,           setTotal]           = useState(0);
    const [page,            setPage]            = useState(1);
    const [hasMore,         setHasMore]         = useState(false);
    const [createVisible,   setCreateVisible]   = useState(false);
    const [dropdownOpen,    setDropdownOpen]    = useState(false);
    const [toggling,        setToggling]        = useState(new Set());
    const abortRef = useRef(null);

    const debouncedSearch = useDebounce(search, 350);

    useEffect(() => {
        AsyncStorage.getItem('user').then(json => {
            if (json) {
                try { const u = JSON.parse(json); setCoachId(u.id ?? ''); } catch {}
            }
        });
    }, []);

    const fetchFoods = useCallback(async (pageNum, append) => {
        if (!coachId) return;
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        try {
            const params = new URLSearchParams({ coachId, page: String(pageNum), limit: '40' });
            if (debouncedSearch.length >= 2) params.set('q', debouncedSearch);
            if (category !== 'Todas')         params.set('category', category);
            if (sourceFilter === 'favorites') params.set('favorites', 'true');
            if (sourceFilter === 'taco')      params.set('source', 'TACO');
            if (sourceFilter === 'custom')    params.set('source', 'CUSTOM');

            const res  = await fetch(`${BASE_URL}/api/food/search?${params}`, { signal: ctrl.signal });
            const data = await res.json();
            const newFoods = data.foods ?? [];
            setFoods(prev => append ? [...prev, ...newFoods] : newFoods);
            setTotal(data.total ?? 0);
            setHasMore(pageNum < (data.pages ?? 1));
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
                headers: { 'Content-Type': 'application/json' },
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
                const res = await fetch(`${BASE_URL}/api/food/${food.id}?coachId=${coachId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Erro');
                setFoods(prev => prev.filter(f => f.id !== food.id));
                setTotal(prev => prev - 1);
            } catch { Alert.alert('Erro', 'Não foi possível excluir.'); }
        };
        if (Platform.OS === 'web') {
            if (window.confirm(msg)) doDelete();
        } else {
            Alert.alert('Excluir', msg, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', style: 'destructive', onPress: doDelete },
            ]);
        }
    };

    const handleFoodCreated = (newFood) => {
        const formatted = {
            ...newFood,
            calories_per_100: newFood.kcal,
            p: newFood.protein,
            c: newFood.carbs,
            f: newFood.fat,
            base_unit: newFood.baseUnit,
        };
        setFoods(prev => [formatted, ...prev]);
        setTotal(prev => prev + 1);
    };

    const renderFood = ({ item }) => {
        const isFav     = item.isFavorite;
        const isCustom  = item.source === 'CUSTOM';
        const isLoading = toggling.has(item.id);
        const kcal      = item.calories_per_100 ?? item.kcal ?? 0;

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => setDropdownOpen(false)}
            >
                <View style={[styles.foodRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity onPress={() => handleToggleFavorite(item)} disabled={isLoading} style={styles.favBtn}>
                        {isLoading
                            ? <ActivityIndicator size="small" color={theme.accent} />
                            : <MaterialCommunityIcons
                                name={isFav ? 'star' : 'star-outline'}
                                size={22}
                                color={isFav ? '#FFCC00' : theme.textSecondary}
                              />
                        }
                    </TouchableOpacity>

                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                            <View style={[styles.srcBadge, {
                                backgroundColor: isCustom ? theme.accent + '20' : '#34C75920',
                                borderColor:     isCustom ? theme.accent + '50' : '#34C75950',
                            }]}>
                                <Text style={{ fontSize: 8, fontWeight: '900', color: isCustom ? theme.accent : '#34C759' }}>
                                    {isCustom ? '★ MEU' : 'TACO'}
                                </Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: '600', marginBottom: 4 }}>
                            {item.subcategory || item.category}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFCC00' }}>{Math.round(kcal)} kcal</Text>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#32ADE6' }}>P {item.p ?? item.protein ?? 0}g</Text>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#FF9500' }}>C {item.c ?? item.carbs ?? 0}g</Text>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#AF52DE' }}>G {item.f ?? item.fat ?? 0}g</Text>
                        </View>
                    </View>

                    {isCustom && (
                        <TouchableOpacity onPress={() => handleDeleteFood(item)} style={styles.deleteBtn}>
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const RootView = isWeb ? View : SafeAreaView;
    const rootStyle = isWeb
        ? { height: windowHeight, backgroundColor: theme.bg, display: 'flex', flexDirection: 'column' }
        : { flex: 1, backgroundColor: theme.bg };

    // Altura estimada dos filtros para o dropdown não sobrepor
    const dropdownListHeight = Math.min(CATEGORIES.length * 46, 300);

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
                    <Text style={[styles.headerTitle, { color: theme.text }]}>GERENCIAR ALIMENTOS</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                        {total} alimentos encontrados
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setCreateVisible(true)}
                    style={[styles.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                >
                    <MaterialCommunityIcons name="plus" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            {/* FILTROS — ficam acima da lista com zIndex alto */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, zIndex: 50 }}>

                {/* Busca */}
                <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 10 }]}>
                    <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Buscar por nome..."
                        placeholderTextColor={theme.textSecondary}
                        value={search}
                        onChangeText={(t) => { setSearch(t); setDropdownOpen(false); }}
                    />
                    {loading && <ActivityIndicator size="small" color={theme.accent} style={{ marginRight: 4 }} />}
                    {search.length > 0 && !loading && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Pills de source */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {SOURCE_FILTERS.map(f => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filterPill, {
                                backgroundColor: sourceFilter === f.key ? theme.accent + '20' : theme.surface,
                                borderColor:     sourceFilter === f.key ? theme.accent         : theme.border,
                            }]}
                            onPress={() => { setSourceFilter(f.key); setFoods([]); setDropdownOpen(false); }}
                        >
                            <MaterialCommunityIcons
                                name={f.icon}
                                size={13}
                                color={sourceFilter === f.key ? theme.accent : theme.textSecondary}
                            />
                            <Text style={{ fontSize: 11, fontWeight: '900', color: sourceFilter === f.key ? theme.accent : theme.textSecondary }}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info do filtro ativo */}
                <InfoCard theme={theme} activeFilter={sourceFilter} />

                {/* Dropdown de categoria — zIndex ainda maior */}
                <View style={{ zIndex: 100, marginTop: 8 }}>
                    {/* Botão */}
                    <TouchableOpacity
                        style={[styles.dropdownBtn, {
                            backgroundColor: theme.surface,
                            borderColor: dropdownOpen ? theme.accent : theme.border,
                        }]}
                        onPress={() => setDropdownOpen(prev => !prev)}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="tag-outline" size={16} color={theme.accent} />
                        <Text style={{ flex: 1, color: theme.text, fontWeight: '800', fontSize: 13 }}>
                            {category === 'Todas' ? 'Todas as categorias' : category}
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginRight: 6 }}>
                            Filtrar por categoria
                        </Text>
                        <MaterialCommunityIcons
                            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={theme.textSecondary}
                        />
                    </TouchableOpacity>

                    {/* Lista do dropdown — absolutamente posicionada */}
                    {dropdownOpen && (
                        <View style={[styles.dropdownList, {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            maxHeight: dropdownListHeight,
                        }]}>
                            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                                {CATEGORIES.map((cat, idx) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.dropdownItem, {
                                            backgroundColor: category === cat ? theme.accent + '18' : 'transparent',
                                            borderBottomColor: idx < CATEGORIES.length - 1 ? theme.border : 'transparent',
                                        }]}
                                        onPress={() => {
                                            setCategory(cat);
                                            setFoods([]);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={category === cat ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={16}
                                            color={category === cat ? theme.accent : theme.textSecondary}
                                        />
                                        <Text style={{
                                            color:      category === cat ? theme.accent : theme.text,
                                            fontWeight: category === cat ? '900' : '600',
                                            fontSize:   13,
                                            marginLeft: 10,
                                        }}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>

            {/* Espaço para o dropdown quando aberto */}
            {dropdownOpen && (
                <View style={{ height: dropdownListHeight }} />
            )}

            {/* ACESSO AOS GRUPOS DE SUBSTITUIÇÃO */}
            <TouchableOpacity
                style={[styles.groupsAccessBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => navigation.navigate('AdminSubstitutionGroupsScreen', { coachId })}
                activeOpacity={0.8}
            >
                <View style={[styles.groupsIconBox, { backgroundColor: theme.accent + '18' }]}>
                    <MaterialCommunityIcons name="swap-horizontal" size={20} color={theme.accent} />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13 }}>
                        Grupos de Substituição
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                        Defina quais alimentos se substituem automaticamente nas dietas
                    </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* LISTA */}
            {!dropdownOpen && (
                <View style={{ flex: 1, marginTop: 10 }}>
                    <FlatList
                        data={foods}
                        keyExtractor={(item, i) => `${item.id}-${i}`}
                        renderItem={renderFood}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                        onEndReached={() => { if (!loading && hasMore) fetchFoods(page + 1, true); }}
                        onEndReachedThreshold={0.3}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        ListFooterComponent={loading && foods.length > 0
                            ? <ActivityIndicator color={theme.accent} style={{ marginVertical: 16 }} />
                            : null
                        }
                        ListEmptyComponent={() => !loading ? (
                            <View style={{ alignItems: 'center', padding: 48 }}>
                                <MaterialCommunityIcons name="food-off" size={48} color={theme.textSecondary} />
                                <Text style={{ color: theme.textSecondary, fontWeight: '800', marginTop: 12, fontSize: 14 }}>
                                    Nenhum alimento encontrado
                                </Text>
                                <TouchableOpacity
                                    style={[styles.saveBtn, { backgroundColor: theme.accent, marginTop: 20 }]}
                                    onPress={() => setCreateVisible(true)}
                                >
                                    <Text style={{ fontWeight: '900', color: '#000' }}>+ CRIAR ALIMENTO</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    />
                </View>
            )}

            {/* MODAL DE CRIAÇÃO */}
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

const styles = StyleSheet.create({
    header:       { flexDirection:'row', justifyContent:'space-between', padding:16, alignItems:'center', borderBottomWidth:1 },
    iconBtn:      { padding:9, borderRadius:14, borderWidth:1 },
    headerTitle:  { fontWeight:'900', fontSize:13, letterSpacing:1.5 },
    searchBox:    { flexDirection:'row', alignItems:'center', gap:10, padding:14, borderRadius:16, borderWidth:1 },
    searchInput:  { flex:1, fontSize:14, outlineStyle:'none' },
    filterPill:   { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:7, borderRadius:20, borderWidth:1 },
    infoCard:     { flexDirection:'row', alignItems:'flex-start', gap:8, padding:10, borderRadius:12, borderWidth:1, marginBottom:4 },
    dropdownBtn:  { flexDirection:'row', alignItems:'center', gap:10, padding:14, borderRadius:16, borderWidth:1 },
    dropdownList: { position:'absolute', top:54, left:0, right:0, borderRadius:16, borderWidth:1, zIndex:999, shadowColor:'#000', shadowOffset:{width:0,height:6}, shadowOpacity:0.2, shadowRadius:16, elevation:20, overflow:'hidden' },
    dropdownItem: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:13, borderBottomWidth:1 },
    foodRow:      { flexDirection:'row', alignItems:'center', padding:12, borderRadius:16, borderWidth:1, marginBottom:8 },
    favBtn:       { width:36, height:36, alignItems:'center', justifyContent:'center' },
    foodName:     { fontSize:13, fontWeight:'800', flex:1 },
    srcBadge:     { paddingHorizontal:5, paddingVertical:2, borderRadius:5, borderWidth:1 },
    deleteBtn:    { width:36, height:36, alignItems:'center', justifyContent:'center' },
    fieldLabel:   { fontSize:11, fontWeight:'800', marginBottom:5, letterSpacing:0.5 },
    formInput:    { borderWidth:1, borderRadius:12, padding:14, fontSize:14, marginBottom:14 },
    macroInput:   { borderWidth:1, borderRadius:12, padding:12, fontSize:16, fontWeight:'900', textAlign:'center' },
    catPill:      { paddingHorizontal:12, paddingVertical:7, borderRadius:20, borderWidth:1 },
    unitPill:     { flex:1, paddingVertical:10, borderRadius:12, borderWidth:1, alignItems:'center', justifyContent:'center' },
    saveBtn:      { padding:16, borderRadius:16, alignItems:'center', justifyContent:'center' },
    modalBackdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
    formSheet:    { borderTopLeftRadius:28, borderTopRightRadius:28, borderWidth:1, padding:24, maxHeight:'90%' },
    formHeader:   { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
    formTitle:    { fontSize:16, fontWeight:'900', letterSpacing:1 },
    groupsAccessBtn: { flexDirection:'row', alignItems:'center', marginHorizontal:16, marginBottom:10, padding:14, borderRadius:16, borderWidth:1 },
    groupsIconBox:   { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
});