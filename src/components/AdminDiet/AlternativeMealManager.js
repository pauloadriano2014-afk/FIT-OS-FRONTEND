// src/components/AdminDiet/AlternativeMealManager.js
// Botão "Versão alternativa" no card de refeição.
// Abre o modal de modelos de refeição já existente e aplica o modelo escolhido
// como versão alternativa da refeição principal — sem criar card separado.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function AlternativeMealManager({
    meal,             // refeição principal
    theme,
    mealTemplatesList, // lista de modelos salvos (vem do useDietData)
    allMeals,          // 🔥 lista completa para contar alternativas em tempo real
    onApplyAsAlternative, // (meal, template) => void
}) {
    const [visible, setVisible] = useState(false);

    // 🔥 Conta a partir do allMeals — atualiza em tempo real após aplicar
    const altCount = allMeals
        ? allMeals.filter(m =>
            m.alternativeGroupId &&
            m.alternativeGroupId === meal.alternativeGroupId &&
            (m.isMainVersion === false || m.isMainVersion === 0)
          ).length
        : (meal.alternatives?.length ?? 0);

    const softBg = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

    const handleUse = (template) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onApplyAsAlternative(meal, template);
        setVisible(false);
    };

    return (
        <>
            {/* ── BOTÃO NO HEADER DO CARD ──────────────────────────────────── */}
            <TouchableOpacity
                style={[styles.triggerBtn, {
                    backgroundColor: altCount > 0 ? theme.accent + '15' : softBg,
                    borderColor:     altCount > 0 ? theme.accent + '40' : theme.border,
                }]}
                onPress={() => { Haptics.selectionAsync(); setVisible(true); }}
            >
                <MaterialCommunityIcons
                    name="swap-vertical-circle-outline"
                    size={14}
                    color={altCount > 0 ? theme.accent : theme.textSecondary}
                />
                <Text style={[styles.triggerText, {
                    color: altCount > 0 ? theme.accent : theme.textSecondary,
                }]}>
                    {altCount > 0 ? `${altCount} alt.` : 'Versão alt.'}
                </Text>
            </TouchableOpacity>

            {/* ── MODAL DE SELEÇÃO DE MODELO ────────────────────────────────── */}
            <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.box, { backgroundColor: theme.surface }]}>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="swap-vertical-circle-outline" size={22} color={theme.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.title, { color: theme.text }]}>VERSÃO ALTERNATIVA</Text>
                                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                                    {meal.time} — {meal.name}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setVisible(false)} style={[styles.closeBtn, { backgroundColor: softBg }]}>
                                <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Alternativas já aplicadas */}
                        {altCount > 0 && (
                            <View style={[styles.altInfo, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
                                <MaterialCommunityIcons name="check-circle" size={14} color={theme.accent} />
                                <Text style={[styles.altInfoText, { color: theme.textSecondary }]}>
                                    Esta refeição já tem {altCount} versão(ões) alternativa(s). Selecione um modelo abaixo para adicionar mais.
                                </Text>
                            </View>
                        )}

                        {/* Instrução */}
                        <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                            Escolha um modelo guardado para usar como versão alternativa:
                        </Text>

                        {/* Lista de modelos */}
                        <FlatList
                            data={mealTemplatesList || []}
                            keyExtractor={item => item.id}
                            style={{ maxHeight: 320 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.listItem, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                                    onPress={() => handleUse(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: softBg, width: 40, height: 40 }]}>
                                        <MaterialCommunityIcons name="food-variant" size={20} color={theme.accent} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                                        <Text style={[styles.itemCat, { color: theme.textSecondary }]}>
                                            {item.category || 'Modelo de refeição'}
                                        </Text>
                                    </View>
                                    <View style={[styles.usePill, { backgroundColor: theme.accent + '15' }]}>
                                        <MaterialCommunityIcons name="download" size={14} color={theme.accent} />
                                        <Text style={[styles.useText, { color: theme.accent }]}>USAR</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyBox}>
                                    <MaterialCommunityIcons name="food-off" size={32} color={theme.textSecondary} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        Nenhum modelo guardado ainda.{'\n'}
                                        Use o menu (...) de uma refeição para guardar modelos.
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    triggerBtn:   { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:7, borderRadius:10, borderWidth:1 },
    triggerText:  { fontSize:10, fontWeight:'900', letterSpacing:0.3 },
    overlay:      { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center', padding:20 },
    box:          { width:'100%', maxWidth:420, borderRadius:28, padding:24, shadowColor:'#000', shadowOffset:{width:0,height:12}, shadowOpacity:0.15, shadowRadius:24, elevation:10 },
    header:       { flexDirection:'row', alignItems:'center', gap:12, marginBottom:16 },
    iconCircle:   { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center' },
    title:        { fontSize:14, fontWeight:'900', letterSpacing:0.5 },
    subtitle:     { fontSize:11, fontWeight:'700', marginTop:2 },
    closeBtn:     { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center' },
    altInfo:      { flexDirection:'row', alignItems:'flex-start', gap:8, padding:12, borderRadius:12, borderWidth:1, marginBottom:12 },
    altInfoText:  { fontSize:12, fontWeight:'600', flex:1, lineHeight:17 },
    instruction:  { fontSize:12, fontWeight:'600', marginBottom:12 },
    listItem:     { flexDirection:'row', alignItems:'center', paddingVertical:14, borderBottomWidth:1 },
    itemName:     { fontSize:14, fontWeight:'800' },
    itemCat:      { fontSize:11, marginTop:2 },
    usePill:      { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:6, borderRadius:12 },
    useText:      { fontSize:10, fontWeight:'900' },
    emptyBox:     { alignItems:'center', padding:32, gap:12 },
    emptyText:    { fontSize:13, textAlign:'center', lineHeight:20 },
});