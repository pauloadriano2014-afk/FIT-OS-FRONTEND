// src/components/MontarTreino/RaioxCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RaioxCard({ anamneseData, isExpanded, onToggle, theme }) {
    if (!anamneseData) return null;
    return (
        <View style={[S.card, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
                style={[S.header, { backgroundColor: isExpanded ? theme.accent + '12' : 'transparent', borderRadius: isExpanded ? 10 : 0 }]}
                onPress={onToggle}
            >
                <View style={S.headerLeft}>
                    <View style={[S.iconBox, { backgroundColor: theme.accent }]}>
                        <MaterialCommunityIcons name="clipboard-pulse-outline" size={16} color={theme.isDark ? '#000' : '#FFF'} />
                    </View>
                    <View>
                        <Text style={[S.title, { color: theme.text }]}>Raio-X do Aluno</Text>
                        {anamneseData.isSetupTreino && <Text style={[S.subtitle, { color: theme.textSecondary }]}>Dados básicos</Text>}
                    </View>
                </View>
                <View style={[S.chevron, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                    <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={S.body}>
                    <View style={S.row}>
                        <View style={S.col}>
                            <Text style={[S.label, { color: theme.textSecondary }]}>OBJETIVO</Text>
                            <Text style={[S.value, { color: theme.text }]}>{anamneseData.objetivo}</Text>
                        </View>
                        <View style={S.col}>
                            <Text style={[S.label, { color: theme.textSecondary }]}>NÍVEL</Text>
                            <Text style={[S.value, { color: theme.text }]}>{anamneseData.nivel}</Text>
                        </View>
                    </View>

                    {anamneseData.isSetupTreino && anamneseData.foco && (
                        <View style={[S.row, { marginBottom: 0 }]}>
                            <View style={S.col}>
                                <Text style={[S.label, { color: theme.textSecondary }]}>FOCO PRINCIPAL</Text>
                                <Text style={[S.value, { color: theme.accent }]}>{anamneseData.foco}</Text>
                            </View>
                        </View>
                    )}

                    {!anamneseData.isSetupTreino && (
                        <>
                            <View style={S.row}>
                                <View style={S.col}>
                                    <Text style={[S.label, { color: theme.textSecondary }]}>ROTINA</Text>
                                    <Text style={[S.value, { color: theme.text }]}>
                                        {anamneseData.frequencia ? `${anamneseData.frequencia}x sem` : '-'} | {anamneseData.tempoDisponivel ? `${anamneseData.tempoDisponivel}min` : '-'}
                                    </Text>
                                </View>
                                <View style={S.col}>
                                    <Text style={[S.label, { color: theme.textSecondary }]}>CORPO</Text>
                                    <Text style={[S.value, { color: theme.text }]}>
                                        {anamneseData.peso ? `${anamneseData.peso}kg` : '-'} | {anamneseData.altura ? `${anamneseData.altura}cm` : '-'}
                                    </Text>
                                </View>
                            </View>
                            {anamneseData.limitacoes?.length > 0 && !anamneseData.limitacoes.includes('Nenhuma') && (
                                <View style={S.alertBox}>
                                    <Text style={S.alertTitle}>⚠️ LIMITAÇÕES / DORES</Text>
                                    <Text style={[S.alertText, { color: theme.text }]}>{anamneseData.limitacoes.join(', ')}</Text>
                                </View>
                            )}
                            {anamneseData.cirurgias?.length > 0 && !anamneseData.cirurgias.includes('Nenhuma') && (
                                <View style={[S.alertBox, { backgroundColor: 'rgba(255,149,0,0.1)', borderColor: '#FF9500', marginTop: 8 }]}>
                                    <Text style={[S.alertTitle, { color: '#FF9500' }]}>⚠️ CIRURGIAS</Text>
                                    <Text style={[S.alertText, { color: theme.text }]}>{anamneseData.cirurgias.join(', ')}</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

const S = StyleSheet.create({
    card:      { borderRadius: 18, marginBottom: 16, overflow: 'hidden', padding: 14 },
    header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 4 },
    headerLeft:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox:   { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    title:     { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    subtitle:  { fontSize: 11 },
    chevron:   { borderRadius: 8, padding: 4 },
    body:      { marginTop: 16 },
    row:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    col:       { flex: 1 },
    label:     { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 3 },
    value:     { fontSize: 14, fontWeight: '700' },
    alertBox:  { marginTop: 10, padding: 12, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 10, borderWidth: 1, borderColor: '#FF3B3050' },
    alertTitle:{ color: '#FF3B30', fontSize: 10, fontWeight: '900', marginBottom: 4 },
    alertText: { fontSize: 13, fontWeight: '700' },
});
