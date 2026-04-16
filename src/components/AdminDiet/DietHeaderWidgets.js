import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DietHeaderWidgets({ 
    theme, currentMacros, macros, pct, showRaioX, setShowRaioX, 
    anamnese, handleGenerateAI, isGenerating, setImportModalVisible 
}) {
    return (
        <>
            {/* DASHBOARD DE MACROS */}
            <View style={[styles.dashboard, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                {[
                    { label: 'KCAL', cur: currentMacros.kcal, target: macros.alvo, unit: 'kcal', color: theme.accent },
                    { label: 'PROT', cur: currentMacros.prot, target: macros.proteinaAlvo, unit: 'g', color: '#32ADE6' },
                    { label: 'CARBO', cur: currentMacros.carb, target: macros.carboAlvo, unit: 'g', color: '#FFCC00' },
                    { label: 'GORD', cur: currentMacros.fat, target: macros.fatAlvo, unit: 'g', color: '#FF6B35' },
                ].map(({ label, cur, target, unit, color }) => (
                    <View key={label} style={styles.macroCol}>
                        <Text style={[styles.macroLabel, { color: theme.textSecondary }]}>{label}</Text>
                        <Text style={[styles.macroVal, { color: cur >= target && target > 0 ? color : theme.text }]}>
                            {cur}<Text style={{ fontSize: 10, color: theme.textSecondary }}>{unit}</Text>
                        </Text>
                        <Text style={[styles.macroTarget, { color: theme.textSecondary }]}>/ {target}{unit}</Text>
                        <View style={[styles.progBg, { backgroundColor: theme.border }]}>
                            <View style={[styles.progFill, { backgroundColor: color, width: `${pct(cur, target)}%` }]} />
                        </View>
                    </View>
                ))}
            </View>

            {/* RAIO-X DO ALUNO */}
            <TouchableOpacity
                style={[styles.raioXHeader, { backgroundColor: theme.surface, borderColor: theme.border, borderBottomLeftRadius: showRaioX ? 0 : 14, borderBottomRightRadius: showRaioX ? 0 : 14 }]}
                onPress={() => setShowRaioX(!showRaioX)}
                activeOpacity={0.8}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.raioXIcon, { backgroundColor: theme.accent + '20' }]}>
                        <MaterialCommunityIcons name="clipboard-pulse" size={16} color={theme.accent} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>RAIO-X DO ALUNO</Text>
                </View>
                <MaterialCommunityIcons name={showRaioX ? 'chevron-up' : 'chevron-down'} size={22} color={theme.textSecondary} />
            </TouchableOpacity>

            {showRaioX && (
                <View style={[styles.raioXBody, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {anamnese ? (
                        <>
                            <View style={styles.rxGrid}>
                                {[
                                    { l: 'OBJETIVO', v: anamnese.objetivo },
                                    { l: 'TMB', v: `${macros.tmb} kcal` },
                                    { l: 'GASTO TOTAL', v: `${macros.gastoTotal} kcal` },
                                    { l: 'REFEIÇÕES', v: `${anamnese.mealsPerDay || '?'}x / dia` },
                                ].map(({ l, v }) => (
                                    <View key={l} style={styles.rxItem}>
                                        <Text style={[styles.rxLabel, { color: theme.textSecondary }]}>{l}</Text>
                                        <Text style={[styles.rxVal, { color: theme.text }]}>{v}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={[styles.rxTimeRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="clock-outline" size={14} color={theme.accent} />
                                {[
                                    { l: 'Acorda', v: anamnese.wakeUpTime || '--' },
                                    { l: 'Treina', v: anamnese.trainTime || '--' },
                                    { l: 'Dorme', v: anamnese.sleepTime || '--' },
                                ].map(({ l, v }, i) => (
                                    <React.Fragment key={l}>
                                        {i > 0 && <Text style={{ color: theme.border }}>·</Text>}
                                        <Text style={[styles.rxTimeText, { color: theme.textSecondary }]}>
                                            {l}: <Text style={{ color: theme.text, fontWeight: '700' }}>{v}</Text>
                                        </Text>
                                    </React.Fragment>
                                ))}
                            </View>
                            <View style={{ gap: 6, marginTop: 12 }}>
                                {[
                                    { label: 'ALERGIAS', value: anamnese.allergies || 'Nenhuma', color: '#FF3B30' },
                                    { label: 'RESTRIÇÕES', value: anamnese.foodAversions || 'Nenhuma', color: '#FF9500' },
                                    { label: 'SUPLEMENTOS', value: anamnese.supplements || 'Nenhum', color: theme.accent },
                                ].map(({ label, value, color }) => (
                                    <View key={label} style={[styles.rxAlertRow, { borderLeftColor: color, backgroundColor: color + '10' }]}>
                                        <Text style={[styles.rxAlertLabel, { color }]}>{label}</Text>
                                        <Text style={[styles.rxAlertVal, { color: theme.text }]}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    ) : (
                        <Text style={{ color: theme.textSecondary, fontSize: 13, fontStyle: 'italic' }}>Nenhuma anamnese preenchida.</Text>
                    )}
                </View>
            )}

            {/* BOTÕES ASSISTENTES */}
            <View style={styles.assistantRow}>
                <TouchableOpacity 
                    style={[styles.assistantBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]} 
                    onPress={handleGenerateAI}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="robot-outline" size={20} color={theme.accent} />
                            <Text style={[styles.assistantBtnText, { color: theme.accent }]}>GERAR COM IA</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.assistantBtn, { backgroundColor: '#32ADE6' + '15', borderColor: '#32ADE6' + '40' }]} onPress={() => setImportModalVisible(true)}>
                    <MaterialCommunityIcons name="file-pdf-box" size={20} color="#32ADE6" />
                    <Text style={[styles.assistantBtnText, { color: '#32ADE6' }]}>IMPORTAR PDF</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    dashboard: { flexDirection: 'row', padding: 16, gap: 8, borderBottomWidth: 1 },
    macroCol: { flex: 1 },
    macroLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginBottom: 3 },
    macroVal: { fontSize: 15, fontWeight: '900', marginBottom: 1 },
    macroTarget: { fontSize: 9, marginBottom: 5 },
    progBg: { height: 3, borderRadius: 2, overflow: 'hidden' },
    progFill: { height: '100%', borderRadius: 2 },
    raioXHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderWidth: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
    raioXIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    raioXBody: { padding: 14, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
    rxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    rxItem: { width: '47%' },
    rxLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
    rxVal: { fontSize: 13, fontWeight: '800' },
    rxTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, flexWrap: 'wrap' },
    rxTimeText: { fontSize: 11 },
    rxAlertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 8, borderLeftWidth: 3 },
    rxAlertLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, width: 90 },
    rxAlertVal: { fontSize: 12, flex: 1 },
    assistantRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    assistantBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
    assistantBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }
});