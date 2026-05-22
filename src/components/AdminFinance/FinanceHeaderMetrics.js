// src/components/AdminFinance/FinanceHeaderMetrics.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MONTHS, formatCurrency } from '../../utils/financeUtils';

export default function FinanceHeaderMetrics({ theme, selectedMonth, currentYear, metrics, setIsAddModalVisible, isWebPC }) {
    return (
        <View>
            <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                     <View style={[styles.iconBox, {backgroundColor: theme.accent + '22', width: 44, height: 44, borderRadius: 22}]}>
                        <MaterialCommunityIcons name="cash-multiple" size={22} color={theme.accent} />
                    </View>
                    <View>
                        <Text style={[styles.mainLabel, { color: theme.text }]}>GESTÃO FINANCEIRA</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }}>{MONTHS[selectedMonth]} {currentYear}</Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.addBtnModern, { backgroundColor: theme.accent }]} onPress={() => setIsAddModalVisible(true)}>
                    <MaterialCommunityIcons name="account-plus" size={18} color="#FFF" />
                    <Text style={[styles.addBtnText, { color: '#FFF' }]}>NOVO ALUNO OFFLINE</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15, marginBottom: 30 }}>
                <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }]}>
                    <View style={styles.metricHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#34C75922' }]}><MaterialCommunityIcons name="cash-check" size={18} color="#34C759" /></View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>ENTRADA DO MÊS</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#34C759' }]}>{formatCurrency(metrics.entrada)}</Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }]}>
                    <View style={styles.metricHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#FF3B3022' }]}><MaterialCommunityIcons name="cash-remove" size={18} color="#FF3B30" /></View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>PENDENTE (ATIVOS)</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#FF3B30' }]}>{formatCurrency(metrics.pendente)}</Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }]}>
                    <View style={styles.metricHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#007AFF22' }]}><MaterialCommunityIcons name="cash-multiple" size={18} color="#007AFF" /></View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>PREVISÃO TOTAL</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#007AFF' }]}>{formatCurrency(metrics.previsao)}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20, elevation: 2, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, flexWrap: 'wrap', gap: 10 },
    mainLabel: { fontWeight: '900', fontSize: 18, letterSpacing: -0.5, marginBottom: 0 },
    addBtnModern: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, height: 40, borderRadius: 10, elevation: 3 },
    addBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    metricCard: { padding: 20, borderRadius: 16, borderWidth: 1, elevation: 2, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4 },
    metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    iconBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    metricLabel: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    metricValue: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
});