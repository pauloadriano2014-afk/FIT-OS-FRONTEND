// src/components/AdminDiet/DietHeaderWidgets.js — VERSÃO FINAL
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function DietHeaderWidgets({
    theme,
    currentMacros,
    macros,
    pct,
    showRaioX,
    setShowRaioX,
    anamnese,
    handleGenerateAI,   // abre o ModelSelectorModal
    isGenerating,
    generateProgress,   // 🔥 texto de progresso
    setImportModalVisible,
}) {
    const handlePressAI = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        handleGenerateAI();
    };

    const handlePressImport = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setImportModalVisible(true);
    };

    return (
        <View style={styles.container}>

            {/* DASHBOARD DE MACROS */}
            <View style={[styles.dashboardCard, { backgroundColor: theme.surface }]}>
                <View style={[styles.dashboardHeader, { borderBottomColor: theme.border }]}>
                    <MaterialCommunityIcons name="chart-donut-variant" size={18} color={theme.textSecondary} />
                    <Text style={[styles.dashboardTitle, { color: theme.textSecondary }]}>
                        RESUMO DE MACRONUTRIENTES
                    </Text>
                </View>

                <View style={styles.macroList}>
                    {[
                        { label: 'KCAL',  cur: currentMacros.kcal, target: macros.alvo,        unit: 'kcal', color: theme.accent },
                        { label: 'PROT',  cur: currentMacros.prot, target: macros.proteinaAlvo, unit: 'g',    color: '#32ADE6'   },
                        { label: 'CARBO', cur: currentMacros.carb, target: macros.carboAlvo,    unit: 'g',    color: '#FFCC00'   },
                        { label: 'GORD',  cur: currentMacros.fat,  target: macros.fatAlvo,      unit: 'g',    color: '#FF6B35'   },
                    ].map(({ label, cur, target, unit, color }) => (
                        <View key={label} style={styles.hMacroRow}>
                            <Text style={[styles.hMacroLabel, { color: theme.textSecondary }]}>{label}</Text>
                            <View style={styles.hBarContainer}>
                                <View style={[styles.hBarBg, {
                                    backgroundColor: theme.isDark
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(0,0,0,0.04)',
                                }]}>
                                    <View style={[styles.hBarFill, {
                                        backgroundColor: color,
                                        width: `${pct(cur, target)}%`,
                                    }]} />
                                </View>
                            </View>
                            <View style={styles.hMacroValues}>
                                <Text style={[styles.hMacroCur, {
                                    color: cur >= target && target > 0 ? color : theme.text,
                                }]}>
                                    {cur}
                                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>{unit}</Text>
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* BOTÕES */}
            <View style={styles.assistantRow}>

                {/* MONTAR DIETA */}
                <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={handlePressAI}
                    disabled={isGenerating}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={theme.isDark ? ['#2C2C2E', '#1C1C1E'] : ['#FFFFFF', '#F2F2F7']}
                        style={styles.pillBtn}
                    >
                        {isGenerating ? (
                            <ActivityIndicator size="small" color={theme.accent} />
                        ) : (
                            <>
                                <LinearGradient
                                    colors={[theme.accent, theme.accent + '80']}
                                    style={styles.iconCircle}
                                >
                                    <MaterialCommunityIcons name="pencil-ruler" size={18} color="#000" />
                                </LinearGradient>
                                <Text style={[styles.pillBtnText, { color: theme.text }]}>MONTAGEM RÁPIDA</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* IMPORTAR PDF */}
                <TouchableOpacity style={{ flex: 1 }} onPress={handlePressImport} activeOpacity={0.8}>
                    <LinearGradient
                        colors={theme.isDark ? ['#2C2C2E', '#1C1C1E'] : ['#FFFFFF', '#F2F2F7']}
                        style={styles.pillBtn}
                    >
                        <LinearGradient colors={['#32ADE6', '#007AFF']} style={styles.iconCircle}>
                            <MaterialCommunityIcons name="file-pdf-box" size={18} color="#FFF" />
                        </LinearGradient>
                        <Text style={[styles.pillBtnText, { color: theme.text }]}>IMPORTAR PDF</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* 🔥 TEXTO DE PROGRESSO DA GERAÇÃO */}
            {isGenerating && generateProgress ? (
                <View style={[styles.progressBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <ActivityIndicator size="small" color={theme.accent} />
                    <Text style={[styles.progressText, { color: theme.accent }]}>
                        {generateProgress}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, paddingBottom: 0 },

    dashboardCard: {
        borderRadius: 24, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    },
    dashboardHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1,
    },
    dashboardTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },

    macroList:    { gap: 14 },
    hMacroRow:    { flexDirection: 'row', alignItems: 'center' },
    hMacroLabel:  { width: 50, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    hBarContainer:{ flex: 1, paddingHorizontal: 12 },
    hBarBg:       { height: 12, borderRadius: 6, overflow: 'hidden' },
    hBarFill:     { height: '100%', borderRadius: 6 },
    hMacroValues: { width: 65, alignItems: 'flex-end' },
    hMacroCur:    { fontSize: 14, fontWeight: '900' },

    assistantRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    pillBtn: {
        flexDirection: 'row', alignItems: 'center',
        padding: 8, paddingRight: 16, borderRadius: 30,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    iconCircle: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    pillBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    progressBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8,
    },
    progressText: { fontSize: 11, fontWeight: '700', flex: 1 },
});