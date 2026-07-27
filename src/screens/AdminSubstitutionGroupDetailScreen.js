// src/screens/AdminSubstitutionGroupDetailScreen.js
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    ActivityIndicator, Modal, Alert, Platform,
    SafeAreaView, useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import FoodSearchPanel from '../components/shared/FoodSearchPanel';
import { BASE_URL } from '../constants/foodManagerConstants';

// ─── MODAL DE ADICIONAR ALIMENTO (usa FoodSearchPanel) ───────────────────────
function AddFoodModal({ visible, onClose, onAdd, groupFoodIds, coachId, theme }) {
    const handleSelect = async (food) => {
        if (groupFoodIds.has(food.id)) return; // já está no grupo
        await onAdd(food);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.backdrop}>
                <View style={[s.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    {/* Header */}
                    <View style={s.sheetHeader}>
                        <View>
                            <Text style={[s.sheetTitle, { color: theme.text }]}>ADICIONAR ALIMENTO</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                Busque e toque no + para adicionar ao grupo
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* FoodSearchPanel com overlay de "já no grupo" */}
                    <View style={{ flex: 1 }}>
                        <FoodSearchPanel
                            coachId={coachId}
                            theme={theme}
                            onSelect={handleSelect}
                            groupFoodIds={groupFoodIds}
                        />
                    </View>
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
    const [members,    setMembers]    = useState(initialGroup.foods ?? []);
    const [addVisible, setAddVisible] = useState(false);
    const [removing,   setRemoving]   = useState(new Set());

    const memberIds = new Set(members.map(f => f.id));

    const handleAddFood = async (food) => {
        try {
            const res = await fetch(`${BASE_URL}/api/food/substitution-groups/${initialGroup.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachId, foodId: food.id }),
            });
            if (!res.ok) throw new Error('Erro');
            const data = await res.json();
            if (data.food) {
                setMembers(prev => [...prev, {
                    ...data.food,
                    calories_per_100: data.food.kcal,
                    p: data.food.protein,
                    c: data.food.carbs,
                    f: data.food.fat,
                    base_unit: data.food.baseUnit,
                }]);
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
                    `${BASE_URL}/api/food/substitution-groups/${initialGroup.id}/members?coachId=${coachId}&foodId=${food.id}`,
                    { method: 'DELETE' }
                );
                if (!res.ok) throw new Error('Erro');
                setMembers(prev => prev.filter(m => m.id !== food.id));
            } catch {
                Alert.alert('Erro', 'Não foi possível remover.');
            } finally {
                setRemoving(prev => { const ns = new Set(prev); ns.delete(food.id); return ns; });
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
            <View style={[s.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[s.orderBadge, { backgroundColor: theme.accent + '18' }]}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: theme.accent }}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={[s.foodName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                        {isCustom && (
                            <View style={[s.srcBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
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
                    style={[s.removeBtn, { backgroundColor: '#FF3B3010', borderColor: '#FF3B3030' }]}
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
            <View style={[s.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[s.iconBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[s.headerTitle, { color: theme.text }]} numberOfLines={1}>
                        {initialGroup.name.toUpperCase()}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                        {members.length} {members.length === 1 ? 'alimento' : 'alimentos'} no grupo
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setAddVisible(true)}
                    style={[s.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                >
                    <MaterialCommunityIcons name="plus" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            {/* INFO */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                {initialGroup.description ? (
                    <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 10 }}>
                        {initialGroup.description}
                    </Text>
                ) : null}
                <View style={[s.infoCard, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
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
                                style={[s.saveBtn, { backgroundColor: theme.accent, marginTop: 20, paddingHorizontal: 28 }]}
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

const s = StyleSheet.create({
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
    backdrop:    { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
    sheet:       { borderTopLeftRadius:28, borderTopRightRadius:28, borderWidth:1, padding:20, maxHeight:'90%', height:'80%' },
    sheetHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
    sheetTitle:  { fontSize:16, fontWeight:'900', letterSpacing:1 },
});