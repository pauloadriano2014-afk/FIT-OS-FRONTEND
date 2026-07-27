// src/components/AdminDiet/DietBuilderSlotPanel.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MC, SLOT_ICONS, UNIT_OPTIONS, UNIT_FACTORS, calcSlotMacros } from '../../utils/dietBuilderUtils';

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

export default function DietBuilderSlotPanel({ slot, slotIndex, items, onRemoveItem, onAmountChange, onUnitChange, theme }) {
    const current       = calcSlotMacros(items);
    const target        = slot.target;
    const remainingKcal = Math.max(target.kcal - current.kcal, 0);
    const done          = items.length > 0 && current.kcal >= target.kcal * 0.85;

    return (
        <View style={[s.panel, { backgroundColor:theme.surface, borderColor: done ? '#34C759' : theme.border }]}>
            {/* Header */}
            <View style={s.header}>
                <View style={[s.iconBox, { backgroundColor: done ? '#34C75918' : theme.accent+'18' }]}>
                    <MaterialCommunityIcons name={SLOT_ICONS[slot.name] ?? 'food'} size={18} color={done ? '#34C759' : theme.accent} />
                </View>
                <View style={{ flex:1, paddingLeft:10 }}>
                    <Text style={{ color:theme.text, fontWeight:'900', fontSize:14 }}>{slot.name}</Text>
                    <Text style={{ color:theme.textSecondary, fontSize:11, marginTop:1 }}>{slot.time}</Text>
                </View>
                <View style={{ alignItems:'flex-end' }}>
                    <Text style={{ color: done ? '#34C759' : MC.kcal, fontWeight:'900', fontSize:13 }}>{current.kcal}</Text>
                    <Text style={{ color:theme.textSecondary, fontSize:10 }}>/{target.kcal} kcal</Text>
                </View>
            </View>

            {/* Barras de macros */}
            <View style={{ flexDirection:'row', gap:8, marginVertical:10 }}>
                <MacroBar label="PROT"  current={current.p} target={target.p} color={MC.p} />
                <MacroBar label="CARBO" current={current.c} target={target.c} color={MC.c} />
                <MacroBar label="GORD"  current={current.f} target={target.f} color={MC.f} />
            </View>

            {/* Alimentos adicionados */}
            {items.map((item, idx) => {
                const factor   = (UNIT_FACTORS[item.unit] ?? 1) * parseFloat(item.amount) / 100;
                const kcalItem = Math.round((item.food.calories_per_100 ?? item.food.kcal ?? 0) * factor);
                return (
                    <View key={idx} style={[s.addedItem, { backgroundColor:theme.bg, borderColor:theme.border }]}>
                        <View style={{ flex:1 }}>
                            <Text style={{ color:theme.text, fontWeight:'800', fontSize:12 }} numberOfLines={1}>{item.food.name}</Text>
                            <Text style={{ color:theme.textSecondary, fontSize:10, marginTop:1 }}>{kcalItem} kcal</Text>
                        </View>
                        {/* Quantidade */}
                        <View style={s.amountBox}>
                            <TouchableOpacity
                                style={[s.amountBtn, { backgroundColor:theme.surface, borderColor:theme.border }]}
                                onPress={() => onAmountChange(slotIndex, idx, Math.max(1, parseFloat(item.amount) - 5))}
                            >
                                <MaterialCommunityIcons name="minus" size={12} color={theme.text} />
                            </TouchableOpacity>
                            <TextInput
                                style={[s.amountInput, { color:theme.text, borderColor:theme.border }]}
                                value={String(Math.round(parseFloat(item.amount)))}
                                onChangeText={v => { const n=parseFloat(v); if (!isNaN(n) && n>0) onAmountChange(slotIndex, idx, n); }}
                                keyboardType="decimal-pad"
                                selectTextOnFocus
                            />
                            <TouchableOpacity
                                style={[s.amountBtn, { backgroundColor:theme.surface, borderColor:theme.border }]}
                                onPress={() => onAmountChange(slotIndex, idx, parseFloat(item.amount) + 5)}
                            >
                                <MaterialCommunityIcons name="plus" size={12} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        {/* Unidades */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth:120 }}>
                            <View style={{ flexDirection:'row', gap:4 }}>
                                {UNIT_OPTIONS.map(u => (
                                    <TouchableOpacity key={u.value}
                                        style={[s.unitPill, {
                                            backgroundColor: item.unit===u.value ? theme.accent+'20' : theme.surface,
                                            borderColor:     item.unit===u.value ? theme.accent       : theme.border,
                                        }]}
                                        onPress={() => onUnitChange(slotIndex, idx, u.value)}
                                    >
                                        <Text style={{ fontSize:9, fontWeight:'900', color: item.unit===u.value ? theme.accent : theme.textSecondary }}>
                                            {u.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                        <TouchableOpacity onPress={() => onRemoveItem(slotIndex, idx)} style={s.removeBtn}>
                            <MaterialCommunityIcons name="close" size={14} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                );
            })}

            {/* Dicas */}
            {!done && remainingKcal > 30 && (
                <View style={[s.hint, { backgroundColor:theme.accent+'10', borderColor:theme.accent+'30' }]}>
                    <MaterialCommunityIcons name="lightning-bolt" size={12} color={theme.accent} />
                    <Text style={{ color:theme.accent, fontSize:11, fontWeight:'700' }}>{remainingKcal} kcal restantes para bater a meta</Text>
                </View>
            )}
            {done && (
                <View style={[s.hint, { backgroundColor:'#34C75915', borderColor:'#34C75940' }]}>
                    <MaterialCommunityIcons name="check-circle" size={12} color="#34C759" />
                    <Text style={{ color:'#34C759', fontSize:11, fontWeight:'700' }}>Meta atingida!</Text>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    panel:      { borderRadius:18, borderWidth:1, padding:14 },
    header:     { flexDirection:'row', alignItems:'center' },
    iconBox:    { width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
    addedItem:  { flexDirection:'row', alignItems:'center', padding:10, borderRadius:12, borderWidth:1, marginTop:8, gap:6, flexWrap:'wrap' },
    amountBox:  { flexDirection:'row', alignItems:'center', gap:3 },
    amountBtn:  { width:24, height:24, borderRadius:7, borderWidth:1, alignItems:'center', justifyContent:'center' },
    amountInput:{ width:40, height:26, borderBottomWidth:1, textAlign:'center', fontWeight:'900', fontSize:13 },
    unitPill:   { paddingHorizontal:6, paddingVertical:3, borderRadius:6, borderWidth:1 },
    removeBtn:  { width:24, height:24, alignItems:'center', justifyContent:'center' },
    hint:       { flexDirection:'row', alignItems:'center', gap:6, padding:8, borderRadius:10, borderWidth:1, marginTop:8 },
});