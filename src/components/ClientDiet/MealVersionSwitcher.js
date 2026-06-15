// src/components/ClientDiet/MealVersionSwitcher.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MealVersionSwitcher({ meal, theme, onVersionChange }) {
    const [modalVisible, setModalVisible] = useState(false);

    if (!meal.alternatives || meal.alternatives.length === 0) return null;

    const softBg = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    const allVersions = [
        { ...meal, alternativeLabel: 'Refeição Principal', isMainVersion: true },
        ...meal.alternatives,
    ];

    return (
        <>
            <TouchableOpacity
                style={[s.pill, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="swap-horizontal" size={13} color={theme.accent} />
                <Text style={[s.pillText, { color: theme.accent }]}>
                    {meal.alternatives.length} versão(ões) alternativa(s)
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={13} color={theme.accent} />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={s.backdrop}>
                    <View style={[s.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={[s.handle, { backgroundColor: theme.border }]} />
                        <Text style={[s.title, { color: theme.text }]}>ESCOLHA UMA VERSÃO</Text>
                        <Text style={[s.subtitle, { color: theme.textSecondary }]}>
                            {meal.time} — {meal.name}
                        </Text>

                        <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false}>
                            {allVersions.map((version, i) => {
                                const isMain = version.isMainVersion === true;
                                const kcal   = calcVersionKcal(version.items);
                                const prot   = calcVersionProt(version.items);

                                return (
                                    <TouchableOpacity
                                        key={version.id ?? i}
                                        style={[s.versionCard, {
                                            backgroundColor: isMain ? theme.accent + '10' : softBg,
                                            borderColor:     isMain ? theme.accent + '60' : theme.border,
                                        }]}
                                        onPress={() => { onVersionChange(version); setModalVisible(false); }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={s.versionHeader}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                                                    <Text style={[s.versionLabel, { color: isMain ? theme.accent : theme.text }]}>
                                                        {version.alternativeLabel || (isMain ? 'Refeição Principal' : `Versão ${i}`)}
                                                    </Text>
                                                    {isMain && (
                                                        <View style={[s.mainBadge, { backgroundColor: theme.accent }]}>
                                                            <Text style={s.mainBadgeText}>PRINCIPAL</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={[s.versionMacros, { color: theme.textSecondary }]}>
                                                    {Math.round(kcal)} kcal · {Math.round(prot)}g prot
                                                </Text>
                                            </View>
                                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                                        </View>

                                        <View style={s.itemsList}>
                                            {(version.items ?? []).filter((_, idx) => idx < 4).map((item, idx) => (
                                                <Text key={idx} style={[s.itemLine, { color: theme.textSecondary }]}>
                                                    · {item.name} ({item.amount}{item.unit})
                                                </Text>
                                            ))}
                                            {(version.items ?? []).length > 4 && (
                                                <Text style={[s.itemLine, { color: theme.textSecondary }]}>
                                                    + {(version.items ?? []).length - 4} item(s)...
                                                </Text>
                                            )}
                                        </View>

                                        {version.notes ? (
                                            <Text style={[s.versionNotes, { color: theme.textSecondary, borderTopColor: theme.border }]}>
                                                💬 {version.notes}
                                            </Text>
                                        ) : null}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity style={[s.cancelBtn, { backgroundColor: softBg }]} onPress={() => setModalVisible(false)}>
                            <Text style={[s.cancelText, { color: theme.textSecondary }]}>FECHAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

function calcVersionKcal(items) {
    return (items ?? []).reduce((sum, item) => {
        const kcalPer100 = item.calories_per_100 ?? item.calories ?? 0;
        return sum + (kcalPer100 * (item.amount ?? 0)) / 100;
    }, 0);
}

function calcVersionProt(items) {
    return (items ?? []).reduce((sum, item) => {
        const protPer100 = item.p ?? item.protein ?? 0;
        return sum + (protPer100 * (item.amount ?? 0)) / 100;
    }, 0);
}

const s = StyleSheet.create({
    pill:         { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:12, borderWidth:1, alignSelf:'flex-start', marginTop:10 },
    pillText:     { fontSize:11, fontWeight:'800' },
    backdrop:     { flex:1, backgroundColor:'rgba(0,0,0,0.65)', justifyContent:'flex-end' },
    sheet:        { maxHeight:'88%', borderTopLeftRadius:28, borderTopRightRadius:28, borderWidth:1, borderBottomWidth:0, paddingHorizontal:20, paddingTop:12, paddingBottom:36 },
    handle:       { width:40, height:5, borderRadius:3, alignSelf:'center', marginBottom:16 },
    title:        { fontSize:18, fontWeight:'900', letterSpacing:-0.3 },
    subtitle:     { fontSize:12, fontWeight:'700', marginTop:4 },
    versionCard:  { borderRadius:20, borderWidth:1.5, padding:16, marginBottom:12 },
    versionHeader:{ flexDirection:'row', alignItems:'center', marginBottom:10 },
    versionLabel: { fontSize:14, fontWeight:'900' },
    mainBadge:    { paddingHorizontal:7, paddingVertical:3, borderRadius:7 },
    mainBadgeText:{ fontSize:8, fontWeight:'900', color:'#000', letterSpacing:0.5 },
    versionMacros:{ fontSize:11, fontWeight:'700', marginTop:3 },
    itemsList:    { gap:3 },
    itemLine:     { fontSize:12, fontWeight:'600', lineHeight:18 },
    versionNotes: { fontSize:11, fontStyle:'italic', marginTop:10, paddingTop:10, borderTopWidth:1, lineHeight:16 },
    cancelBtn:    { padding:16, borderRadius:16, alignItems:'center', marginTop:8 },
    cancelText:   { fontSize:13, fontWeight:'900' },
});