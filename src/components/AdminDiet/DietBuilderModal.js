// src/components/AdminDiet/DietBuilderModal.js — v3 modularizado
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, Platform, useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calcWeeklyPlan } from '../../utils/macroPlanner';
import {
    MC, SLOT_ICONS, UNIT_FACTORS,
    buildSchedule, distributeMacros, calcSlotMacros, suggestAmount,
} from '../../utils/dietBuilderUtils';

import FoodSearchPanel      from '../shared/FoodSearchPanel';
import DietBuilderSlotPanel from './DietBuilderSlotPanel';
import DietBuilderRaioX     from './DietBuilderRaioX';

function MacroBar({ label, current, target, color }) {
    const pct  = Math.min((current / Math.max(target, 1)) * 100, 100);
    const over = current > target * 1.1;
    return (
        <View style={{ flex:1 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:2 }}>
                <Text style={{ fontSize:9, fontWeight:'900', color, letterSpacing:0.5 }}>{label}</Text>
                <Text style={{ fontSize:9, fontWeight:'800', color: over ? '#FF3B30' : color }}>{current}/{target}</Text>
            </View>
            <View style={{ height:4, backgroundColor:color+'25', borderRadius:2 }}>
                <View style={{ width:`${pct}%`, height:4, backgroundColor: over ? '#FF3B30' : color, borderRadius:2 }} />
            </View>
        </View>
    );
}

const DAY_LABELS = {
    TREINO:'Treino de Força', TREINO_CARDIO:'Treino + Cardio',
    CARDIO:'Cardio', DESCANSO:'Descanso',
};

export default function DietBuilderModal({ visible, onClose, onConfirm, anamnese, aluno, dayType, coachId, theme }) {
    const { width:windowWidth, height:windowHeight } = useWindowDimensions();
    const isWeb  = Platform.OS === 'web';
    const isWide = windowWidth > 768;

    const macros = (() => {
        try {
            const plan = calcWeeklyPlan(anamnese, aluno?.birthDate, aluno?.gender);
            return plan.macrosByDay?.[dayType] ?? { kcal:2000, prot:120, carb:220, fat:60 };
        } catch { return { kcal:2000, prot:120, carb:220, fat:60 }; }
    })();

    const [slots,      setSlots]      = useState([]);
    const [slotItems,  setSlotItems]  = useState([]);
    const [activeSlot, setActiveSlot] = useState(0);
    const [showRaioX,  setShowRaioX]  = useState(false);

    useEffect(() => {
        if (visible && anamnese) {
            const s = buildSchedule(anamnese, dayType);
            const d = distributeMacros(s, macros);
            setSlots(d);
            setSlotItems(d.map(() => []));
            setActiveSlot(0);
            setShowRaioX(false);
        }
    }, [visible, anamnese, dayType]);

    const handleSelectFood = useCallback((food) => {
        const currentItems  = slotItems[activeSlot] ?? [];
        const currentMacros = calcSlotMacros(currentItems);
        const remaining     = Math.max((slots[activeSlot]?.target?.kcal ?? 0) - currentMacros.kcal, 50);
        const amount        = suggestAmount(food, remaining);
        setSlotItems(prev => {
            const next = [...prev];
            next[activeSlot] = [...(next[activeSlot] ?? []), { food, amount:String(amount), unit: food.base_unit ?? 'g' }];
            return next;
        });
    }, [activeSlot, slotItems, slots]);

    const handleRemoveItem = useCallback((si, ii) => {
        setSlotItems(prev => { const next=[...prev]; next[si]=next[si].filter((_,i)=>i!==ii); return next; });
    }, []);

    const handleAmountChange = useCallback((si, ii, val) => {
        setSlotItems(prev => { const next=[...prev]; next[si]=next[si].map((item,i)=>i===ii?{...item,amount:String(Math.round(val))}:item); return next; });
    }, []);

    const handleUnitChange = useCallback((si, ii, unit) => {
        setSlotItems(prev => { const next=[...prev]; next[si]=next[si].map((item,i)=>i===ii?{...item,unit}:item); return next; });
    }, []);

    const handleAddSlot = () => {
        const newSlot = { name:'Refeição Extra', time:'12:00', carbPriority:'low', protPriority:'medium', target:{ kcal:200, p:15, c:20, f:7 } };
        setSlots(prev => [...prev, newSlot]);
        setSlotItems(prev => [...prev, []]);
        setActiveSlot(slots.length);
    };

    const handleRemoveSlot = (idx) => {
        if (slots.length <= 1) return;
        setSlots(prev => prev.filter((_, i) => i !== idx));
        setSlotItems(prev => prev.filter((_, i) => i !== idx));
        setActiveSlot(prev => Math.min(prev, slots.length - 2));
    };

    const handleConfirm = () => {
        const meals = slots.map((slot, idx) => ({
            id:      `builder-${Date.now()}-${idx}`,
            name:    slot.name,
            time:    slot.time,
            dayType,
            notes:   '',
            items:   (slotItems[idx] ?? []).map((item, iIdx) => {
                const factor = UNIT_FACTORS[item.unit] ?? 1;
                return {
                    uniqueId:         `${Date.now()}-${idx}-${iIdx}`,
                    groupId:          `grp-${Date.now()}-${idx}-${iIdx}`,
                    id:               item.food.id,
                    name:             item.food.name,
                    category:         item.food.category,
                    subcategory:      item.food.subcategory,
                    calories_per_100: item.food.calories_per_100 ?? item.food.kcal ?? 0,
                    p:                item.food.p ?? item.food.protein ?? 0,
                    c:                item.food.c ?? item.food.carbs   ?? 0,
                    f:                item.food.f ?? item.food.fat     ?? 0,
                    base_unit:        item.food.base_unit ?? 'g',
                    amount:           String(Math.round(parseFloat(item.amount) * factor)),
                    unit:             'g',
                };
            }),
        }));
        onConfirm(meals);
        onClose();
    };

    const totalCurrent = slotItems.reduce((acc, items) => {
        const m = calcSlotMacros(items);
        acc.kcal+=m.kcal; acc.p+=m.p; acc.c+=m.c; acc.f+=m.f; return acc;
    }, { kcal:0, p:0, c:0, f:0 });

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={[s.backdrop, isWeb && { height:windowHeight }]}>
                <View style={[s.container, {
                    backgroundColor:theme.bg, borderColor:theme.border,
                    height: windowHeight * 0.95,
                    maxWidth: isWide ? 980 : '100%', width:'100%',
                }]}>
                    {/* HEADER */}
                    <View style={[s.header, { borderColor:theme.border, backgroundColor:theme.surface }]}>
                        <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor:theme.bg, borderColor:theme.border }]}>
                            <MaterialCommunityIcons name="close" size={18} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ flex:1, alignItems:'center' }}>
                            <Text style={[s.headerTitle, { color:theme.text }]}>MONTAR DIETA</Text>
                            <Text style={{ color:theme.textSecondary, fontSize:11, fontWeight:'700', marginTop:1 }}>
                                {DAY_LABELS[dayType]} • {aluno?.name}
                            </Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:8 }}>
                            <TouchableOpacity
                                onPress={() => setShowRaioX(p => !p)}
                                style={[s.raioXBtn, { backgroundColor: showRaioX ? theme.accent+'20' : theme.bg, borderColor: showRaioX ? theme.accent : theme.border }]}
                            >
                                <MaterialCommunityIcons name="radioactive" size={16} color={showRaioX ? theme.accent : theme.textSecondary} />
                                <Text style={{ fontSize:10, fontWeight:'900', color: showRaioX ? theme.accent : theme.textSecondary }}>RAIO-X</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirm} style={[s.confirmBtn, { backgroundColor:theme.accent }]}>
                                <MaterialCommunityIcons name="check" size={18} color="#000" />
                                <Text style={{ fontWeight:'900', fontSize:12, color:'#000' }}>CONFIRMAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* PROGRESSO DO DIA */}
                    <View style={[s.macrosBar, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                        <Text style={{ color:theme.textSecondary, fontSize:9, fontWeight:'800', marginBottom:4, letterSpacing:0.5 }}>
                            PROGRESSO DO DIA
                        </Text>
                        <View style={{ flexDirection:'row', gap:6 }}>
                            {[
                                { l:'KCAL', cur:totalCurrent.kcal, tgt:macros.kcal, c:MC.kcal },
                                { l:'PROT', cur:totalCurrent.p,    tgt:macros.prot, c:MC.p    },
                                { l:'CARBO',cur:totalCurrent.c,    tgt:macros.carb, c:MC.c    },
                                { l:'GORD', cur:totalCurrent.f,    tgt:macros.fat,  c:MC.f    },
                            ].map(({ l, cur, tgt, c }) => (
                                <MacroBar key={l} label={l} current={cur} target={tgt} color={c} />
                            ))}
                        </View>
                    </View>

                    {/* CORPO */}
                    <View style={{ flex:1, flexDirection: isWide ? 'row' : 'column' }}>

                        {/* COLUNA ESQUERDA — slots */}
                        <View style={[s.slotsCol, isWide && { borderRightWidth:1, borderColor:theme.border }]}>
                            {/* Tabs de slots */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                style={[s.slotTabs, { borderColor:theme.border }]}
                                contentContainerStyle={{ gap:6, paddingHorizontal:10, paddingVertical:8 }}
                            >
                                {slots.map((slot, idx) => {
                                    const items   = slotItems[idx] ?? [];
                                    const current = calcSlotMacros(items);
                                    const done    = items.length > 0 && current.kcal >= slot.target.kcal * 0.85;
                                    return (
                                        <View key={idx} style={{ position:'relative' }}>
                                            <TouchableOpacity
                                                style={[s.slotTab, {
                                                    backgroundColor: activeSlot===idx ? theme.accent+'20' : theme.surface,
                                                    borderColor:     done ? '#34C759' : (activeSlot===idx ? theme.accent : theme.border),
                                                    paddingRight:20,
                                                }]}
                                                onPress={() => setActiveSlot(idx)}
                                            >
                                                <MaterialCommunityIcons
                                                    name={done ? 'check-circle' : (SLOT_ICONS[slot.name] ?? 'food')}
                                                    size={14}
                                                    color={done ? '#34C759' : (activeSlot===idx ? theme.accent : theme.textSecondary)}
                                                />
                                                <Text style={{ fontSize:10, fontWeight:'900', color: activeSlot===idx ? theme.accent : theme.textSecondary }}>
                                                    {slot.name.length > 8 ? slot.name.split(' ')[0] : slot.name}
                                                </Text>
                                                <Text style={{ fontSize:9, color:theme.textSecondary }}>{slot.time}</Text>
                                            </TouchableOpacity>
                                            {slots.length > 1 && (
                                                <TouchableOpacity
                                                    onPress={() => handleRemoveSlot(idx)}
                                                    style={[s.removeSlotBtn, { backgroundColor:theme.bg, borderColor:theme.border }]}
                                                >
                                                    <MaterialCommunityIcons name="close" size={9} color="#FF3B30" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}
                                <TouchableOpacity
                                    style={[s.addSlotBtn, { backgroundColor:theme.surface, borderColor:theme.border }]}
                                    onPress={handleAddSlot}
                                >
                                    <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
                                    <Text style={{ fontSize:9, fontWeight:'900', color:theme.accent }}>NOVA</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            {/* Slot ativo */}
                            <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:12 }} showsVerticalScrollIndicator={false}>
                                {showRaioX && !isWide && (
                                    <DietBuilderRaioX anamnese={anamnese} macros={macros} theme={theme} onClose={() => setShowRaioX(false)} />
                                )}
                                {slots[activeSlot] && (
                                    <DietBuilderSlotPanel
                                        slot={slots[activeSlot]}
                                        slotIndex={activeSlot}
                                        items={slotItems[activeSlot] ?? []}
                                        onRemoveItem={handleRemoveItem}
                                        onAmountChange={handleAmountChange}
                                        onUnitChange={handleUnitChange}
                                        theme={theme}
                                    />
                                )}
                                {!isWide && (
                                    <View style={{ height:400, marginTop:12 }}>
                                        <Text style={[s.sectionTitle, { color:theme.text }]}>ADICIONAR ALIMENTO</Text>
                                        <Text style={{ color:theme.textSecondary, fontSize:11, marginBottom:6 }}>
                                            Adicionando em: <Text style={{ color:theme.accent, fontWeight:'900' }}>{slots[activeSlot]?.name}</Text>
                                        </Text>
                                        <View style={[{ flex:1, borderRadius:16, borderWidth:1, overflow:'hidden' }, { borderColor:theme.border, backgroundColor:theme.surface }]}>
                                            <FoodSearchPanel coachId={coachId} onSelect={handleSelectFood} theme={theme} />
                                        </View>
                                    </View>
                                )}
                            </ScrollView>
                        </View>

                        {/* COLUNA DIREITA — busca/raio-x (web) */}
                        {isWide && (
                            <View style={[s.searchCol, { backgroundColor:theme.surface }]}>
                                {showRaioX ? (
                                    <DietBuilderRaioX anamnese={anamnese} macros={macros} theme={theme} onClose={() => setShowRaioX(false)} />
                                ) : (
                                    <>
                                        <Text style={[s.sectionTitle, { color:theme.text, padding:12, paddingBottom:2 }]}>
                                            ADICIONAR ALIMENTO
                                        </Text>
                                        <Text style={{ color:theme.textSecondary, fontSize:11, paddingHorizontal:12, marginBottom:4 }}>
                                            Adicionando em: <Text style={{ color:theme.accent, fontWeight:'900' }}>{slots[activeSlot]?.name}</Text>
                                        </Text>
                                        <FoodSearchPanel coachId={coachId} onSelect={handleSelectFood} theme={theme} />
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop:      { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end', alignItems:'center' },
    container:     { borderTopLeftRadius:24, borderTopRightRadius:24, borderWidth:1, overflow:'hidden' },
    header:        { flexDirection:'row', alignItems:'center', padding:12, borderBottomWidth:1, gap:8 },
    headerTitle:   { fontWeight:'900', fontSize:14, letterSpacing:1 },
    closeBtn:      { padding:8, borderRadius:12, borderWidth:1 },
    raioXBtn:      { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:8, borderRadius:12, borderWidth:1 },
    confirmBtn:    { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:9, borderRadius:12 },
    macrosBar:     { padding:12, borderBottomWidth:1 },
    slotsCol:      { flex:1, overflow:'hidden' },
    slotTabs:      { borderBottomWidth:1, flexGrow:0 },
    slotTab:       { alignItems:'center', gap:2, paddingHorizontal:10, paddingVertical:7, borderRadius:12, borderWidth:1, minWidth:65 },
    removeSlotBtn: { position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:8, borderWidth:1, alignItems:'center', justifyContent:'center', zIndex:10 },
    addSlotBtn:    { alignItems:'center', justifyContent:'center', gap:2, paddingHorizontal:10, paddingVertical:7, borderRadius:12, borderWidth:1, borderStyle:'dashed', minWidth:55 },
    searchCol:     { width:340 },
    sectionTitle:  { fontSize:11, fontWeight:'900', letterSpacing:1, marginBottom:4 },
});