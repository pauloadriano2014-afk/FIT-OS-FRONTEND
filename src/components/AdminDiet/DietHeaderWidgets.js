// src/components/AdminDiet/DietHeaderWidgets.js
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DietHeaderWidgets({ 
    theme, currentMacros, macros, pct, showRaioX, setShowRaioX, 
    anamnese, handleGenerateAI, isGenerating, setImportModalVisible 
}) {
    return (
        <View style={styles.container}>
            
            {/* 🔥 DASHBOARD DE MACROS HORIZONTAL (Modernizado) */}
            <View style={[styles.dashboardCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.dashboardHeader, { borderBottomColor: theme.border }]}>
                    <MaterialCommunityIcons name="chart-donut-variant" size={16} color={theme.textSecondary} />
                    <Text style={[styles.dashboardTitle, { color: theme.textSecondary }]}>RESUMO DE MACRONUTRIENTES</Text>
                </View>
                
                <View style={styles.macroList}>
                    {[
                        { label: 'KCAL', cur: currentMacros.kcal, target: macros.alvo, unit: 'kcal', color: theme.accent },
                        { label: 'PROT', cur: currentMacros.prot, target: macros.proteinaAlvo, unit: 'g', color: '#32ADE6' },
                        { label: 'CARBO', cur: currentMacros.carb, target: macros.carboAlvo, unit: 'g', color: '#FFCC00' },
                        { label: 'GORD', cur: currentMacros.fat, target: macros.fatAlvo, unit: 'g', color: '#FF6B35' },
                    ].map(({ label, cur, target, unit, color }) => (
                        <View key={label} style={styles.hMacroRow}>
                            <Text style={[styles.hMacroLabel, { color: theme.textSecondary }]}>{label}</Text>
                            
                            {/* Barra Horizontal Grossa e Arredondada */}
                            <View style={styles.hBarContainer}>
                                <View style={[styles.hBarBg, { backgroundColor: theme.border }]}>
                                    <View style={[styles.hBarFill, { backgroundColor: color, width: `${pct(cur, target)}%` }]} />
                                </View>
                            </View>
                            
                            <View style={styles.hMacroValues}>
                                <Text style={[styles.hMacroCur, { color: cur >= target && target > 0 ? color : theme.text }]}>
                                    {cur}<Text style={{ fontSize: 9, color: theme.textSecondary }}>{unit}</Text>
                                </Text>
                                <Text style={[styles.hMacroTarget, { color: theme.textSecondary }]}>/ {target}{unit}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* 🔥 RAIO-X DO ALUNO (Modernizado com Cards) */}
            <TouchableOpacity
                style={[styles.raioXHeader, { 
                    backgroundColor: theme.surface, 
                    borderColor: theme.border, 
                    borderBottomLeftRadius: showRaioX ? 0 : 16, 
                    borderBottomRightRadius: showRaioX ? 0 : 16 
                }]}
                onPress={() => setShowRaioX(!showRaioX)}
                activeOpacity={0.8}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.raioXIcon, { backgroundColor: theme.accent + '15' }]}>
                        <MaterialCommunityIcons name="clipboard-pulse-outline" size={18} color={theme.accent} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>RAIO-X DO ALUNO</Text>
                </View>
                <MaterialCommunityIcons name={showRaioX ? 'chevron-up' : 'chevron-down'} size={24} color={theme.textSecondary} />
            </TouchableOpacity>

            {showRaioX && (
                <View style={[styles.raioXBody, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {anamnese ? (
                        <>
                            {/* Grid em formato de Mini Cards */}
                            <View style={styles.rxGrid}>
                                {[
                                    { l: 'OBJETIVO', v: anamnese.objetivo },
                                    { l: 'TMB', v: `${macros.tmb} kcal` },
                                    { l: 'GASTO TOTAL', v: `${macros.gastoTotal} kcal` },
                                    { l: 'REFEIÇÕES', v: `${anamnese.mealsPerDay || '?'}x / dia` },
                                ].map(({ l, v }) => (
                                    <View key={l} style={[styles.rxItemCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={[styles.rxLabel, { color: theme.textSecondary }]}>{l}</Text>
                                        <Text style={[styles.rxVal, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{v}</Text>
                                    </View>
                                ))}
                            </View>
                            
                            <View style={[styles.rxTimeRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="clock-outline" size={16} color={theme.accent} />
                                {[
                                    { l: 'Acorda', v: anamnese.wakeUpTime || '--' },
                                    { l: 'Treina', v: anamnese.trainTime || '--' },
                                    { l: 'Dorme', v: anamnese.sleepTime || '--' },
                                ].map(({ l, v }, i) => (
                                    <React.Fragment key={l}>
                                        {i > 0 && <Text style={{ color: theme.border, marginHorizontal: 2 }}>|</Text>}
                                        <Text style={[styles.rxTimeText, { color: theme.textSecondary }]}>
                                            {l}: <Text style={{ color: theme.text, fontWeight: '800' }}>{v}</Text>
                                        </Text>
                                    </React.Fragment>
                                ))}
                            </View>

                            <View style={{ gap: 8, marginTop: 15 }}>
                                {[
                                    { label: 'ALERGIAS', value: anamnese.allergies || 'Nenhuma', color: '#FF3B30' },
                                    { label: 'RESTRIÇÕES', value: anamnese.foodAversions || 'Nenhuma', color: '#FF9500' },
                                    { label: 'SUPLEMENTOS', value: anamnese.supplements || 'Nenhum', color: theme.accent },
                                ].map(({ label, value, color }) => (
                                    <View key={label} style={[styles.rxAlertRow, { borderLeftColor: color, backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <Text style={[styles.rxAlertLabel, { color }]}>{label}</Text>
                                        <Text style={[styles.rxAlertVal, { color: theme.text }]} numberOfLines={2}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <MaterialCommunityIcons name="clipboard-text-off-outline" size={32} color={theme.border} />
                            <Text style={{ color: theme.textSecondary, fontSize: 13, fontStyle: 'italic', marginTop: 10 }}>Nenhuma anamnese preenchida pelo aluno.</Text>
                        </View>
                    )}
                </View>
            )}

            {/* 🔥 BOTÕES ASSISTENTES (IA / PDF) BLINDADOS */}
            <View style={styles.assistantRow}>
                <TouchableOpacity 
                    style={[styles.assistantBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                    onPress={handleGenerateAI}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                        <>
                            <View style={[styles.iconGlow, { backgroundColor: theme.accent + '15' }]}>
                                <MaterialCommunityIcons name="robot-outline" size={18} color={theme.accent} />
                            </View>
                            <Text style={[styles.assistantBtnText, { color: theme.text }]}>GERAR COM IA</Text>
                        </>
                    )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.assistantBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                    onPress={() => setImportModalVisible(true)}
                >
                    <View style={[styles.iconGlow, { backgroundColor: '#32ADE6' + '15' }]}>
                        <MaterialCommunityIcons name="file-pdf-box" size={18} color="#32ADE6" />
                    </View>
                    <Text style={[styles.assistantBtnText, { color: theme.text }]}>IMPORTAR PDF</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    
    // Dashboard Horizontal
    dashboardCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    dashboardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1 },
    dashboardTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    macroList: { gap: 12 },
    
    hMacroRow: { flexDirection: 'row', alignItems: 'center' },
    hMacroLabel: { width: 45, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    hBarContainer: { flex: 1, paddingHorizontal: 10 },
    hBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' }, // Barra grossa
    hBarFill: { height: '100%', borderRadius: 4 },
    hMacroValues: { width: 70, alignItems: 'flex-end' },
    hMacroCur: { fontSize: 13, fontWeight: '900' },
    hMacroTarget: { fontSize: 9, marginTop: 2 },

    // Raio X Modernizado
    raioXHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    raioXIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    raioXBody: { padding: 16, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
    
    rxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    rxItemCard: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1 },
    rxLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
    rxVal: { fontSize: 13, fontWeight: '900' },
    
    rxTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1 },
    rxTimeText: { fontSize: 11 },
    
    rxAlertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4 },
    rxAlertLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, width: 85, marginTop: 2 },
    rxAlertVal: { fontSize: 12, flex: 1, fontWeight: '600' },

    // Botões Assistentes
    assistantRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    assistantBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, gap: 10 },
    iconGlow: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    assistantBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }
});