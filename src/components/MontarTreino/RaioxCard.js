import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RaioXCard({ theme, anamneseData, isRaioxExpanded, setIsRaioxExpanded }) {
    if (!anamneseData) return null;

    return (
        <View style={[styles.raioxCard, { backgroundColor: theme.surface },
            Platform.select({
                ios: { shadowColor: '#000', shadowOpacity: theme.isDark ? 0.3 : 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 5 } },
                android: { elevation: 3 },
                web: { boxShadow: theme.isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.07)' },
            }),
        ]}>
            <TouchableOpacity
                style={[styles.raioxHeader, { backgroundColor: isRaioxExpanded ? theme.accent + '12' : 'transparent', borderRadius: isRaioxExpanded ? 10 : 0 }]}
                onPress={() => setIsRaioxExpanded(!isRaioxExpanded)}
            >
                <View style={styles.raioxHeaderLeft}>
                    <View style={[styles.raioxIconBox, { backgroundColor: theme.accent }]}>
                        <MaterialCommunityIcons name="clipboard-pulse-outline" size={16} color={theme.isDark ? '#000' : '#FFF'} />
                    </View>
                    <View>
                        <Text style={[styles.raioxTitle, { color: theme.text }]}>Raio-X do Aluno</Text>
                        {anamneseData.isSetupTreino && (
                            <Text style={[styles.raioxSubtitle, { color: theme.textSecondary }]}>Dados básicos</Text>
                        )}
                    </View>
                </View>
                <View style={[styles.chevronBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                    <MaterialCommunityIcons name={isRaioxExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
                </View>
            </TouchableOpacity>

            {isRaioxExpanded && (
                <View style={styles.raioxBody}>
                    <View style={styles.raioxRow}>
                        <View style={styles.raioxCol}>
                            <Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>OBJETIVO</Text>
                            <Text style={[styles.raioxValue, { color: theme.text }]}>{anamneseData.objetivo}</Text>
                        </View>
                        <View style={styles.raioxCol}>
                            <Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>NÍVEL</Text>
                            <Text style={[styles.raioxValue, { color: theme.text }]}>{anamneseData.nivel}</Text>
                        </View>
                    </View>

                    {anamneseData.isSetupTreino && anamneseData.foco && (
                        <View style={[styles.raioxRow, { marginBottom: 0 }]}>
                            <View style={styles.raioxCol}>
                                <Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>FOCO PRINCIPAL</Text>
                                <Text style={[styles.raioxValue, { color: theme.accent }]}>{anamneseData.foco}</Text>
                            </View>
                        </View>
                    )}

                    {!anamneseData.isSetupTreino && (
                        <>
                            <View style={styles.raioxRow}>
                                <View style={styles.raioxCol}>
                                    <Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>ROTINA</Text>
                                    <Text style={[styles.raioxValue, { color: theme.text }]}>
                                        {anamneseData.frequencia ? `${anamneseData.frequencia}x sem` : '-'} | {anamneseData.tempoDisponivel ? `${anamneseData.tempoDisponivel}min` : '-'}
                                    </Text>
                                </View>
                                <View style={styles.raioxCol}>
                                    <Text style={[styles.raioxLabel, { color: theme.textSecondary }]}>CORPO</Text>
                                    <Text style={[styles.raioxValue, { color: theme.text }]}>
                                        {anamneseData.peso ? `${anamneseData.peso}kg` : '-'} | {anamneseData.altura ? `${anamneseData.altura}cm` : '-'}
                                    </Text>
                                </View>
                            </View>

                            {anamneseData.limitacoes?.length > 0 && !anamneseData.limitacoes.includes('Nenhuma') && (
                                <View style={styles.alertBox}>
                                    <Text style={styles.alertBoxTitle}>⚠️ LIMITAÇÕES / DORES</Text>
                                    <Text style={[styles.alertBoxText, { color: theme.text }]}>{anamneseData.limitacoes.join(', ')}</Text>
                                </View>
                            )}

                            {anamneseData.cirurgias?.length > 0 && !anamneseData.cirurgias.includes('Nenhuma') && (
                                <View style={[styles.alertBox, { backgroundColor: 'rgba(255,149,0,0.1)', borderColor: '#FF9500', marginTop: 8 }]}>
                                    <Text style={[styles.alertBoxTitle, { color: '#FF9500' }]}>⚠️ CIRURGIAS</Text>
                                    <Text style={[styles.alertBoxText, { color: theme.text }]}>{anamneseData.cirurgias.join(', ')}</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    raioxCard: { borderRadius: 18, marginBottom: 16, overflow: 'hidden', padding: 14 },
    raioxHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 4 },
    raioxHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    raioxIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    raioxTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    raioxSubtitle: { fontSize: 11 },
    chevronBox: { borderRadius: 8, padding: 4 },
    raioxBody: { marginTop: 16 },
    raioxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    raioxCol: { flex: 1 },
    raioxLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 3 },
    raioxValue: { fontSize: 14, fontWeight: '700' },
    alertBox: { marginTop: 10, padding: 12, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 10, borderWidth: 1, borderColor: '#FF3B3050' },
    alertBoxTitle: { color: '#FF3B30', fontSize: 10, fontWeight: '900', marginBottom: 4 },
    alertBoxText: { fontSize: 13, fontWeight: '700' },
});