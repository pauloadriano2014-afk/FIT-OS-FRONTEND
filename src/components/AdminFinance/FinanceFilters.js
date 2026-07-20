// src/components/AdminFinance/FinanceFilters.js

import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MONTHS, CATEGORIAS_OFFLINE } from '../../utils/financeUtils';

export default function FinanceFilters({ 
    theme, isWebPC, viewMode, 
    searchQuery, setSearchQuery, 
    selectedMonth, setSelectedMonth, 
    filterStatus, setFilterStatus, 
    filterPrazo, setFilterPrazo, 
    filterCategory, setFilterCategory 
}) {

    const renderWebSelect = (value, onChange, options) => (
        <View style={styles.webSelectWrapper(theme)}>
            <select value={value} onChange={onChange} style={styles.webSelectInput(theme)}>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} style={styles.webSelectIcon} />
        </View>
    );

    // Opções de categorias dinâmicas com base no viewMode
    const categoryOptions = viewMode === 'COACHES' 
        ? [
            { value: 'TODOS', label: 'TODAS' },
            { value: 'PERSONAL', label: 'Personal Trainer' },
            { value: 'NUTRICIONISTA', label: 'Nutricionista' },
            { value: 'ELITE', label: 'Elite (Completo)' }
        ] 
        : [
            { value: 'TODOS', label: 'TODAS' },
            ...CATEGORIAS_OFFLINE.map(c => ({ value: c, label: c }))
        ];

    return (
        <View>
            <TextInput 
                style={[styles.searchBar, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                placeholder={viewMode === 'COACHES' ? "Buscar coach parceiro..." : "Buscar aluno pelo nome..."} 
                placeholderTextColor={theme.textSecondary} 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
            />

            <View style={[styles.filterBar, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', flexDirection: isWebPC ? 'row' : 'column', padding: isWebPC ? 0 : 15 }]}>
                <View style={[{ padding: isWebPC ? 15 : 0 }, isWebPC ? { flex: 1, borderRightWidth: 1, borderRightColor: theme.border } : { marginBottom: 15 }]}>
                    <Text style={styles.inputLabel}>MÊS</Text>
                    {Platform.OS === 'web' ? renderWebSelect(selectedMonth, (e) => setSelectedMonth(Number(e.target.value)), MONTHS.map((m, i) => ({ value: i, label: m }))) : (
                        <View style={styles.pickerWrapper}><Picker selectedValue={selectedMonth} onValueChange={setSelectedMonth} style={{ color: theme.text }} dropdownIconColor={theme.accent}>{MONTHS.map((m, i) => <Picker.Item key={i} label={m} value={i} />)}</Picker></View>
                    )}
                </View>

                <View style={[{ padding: isWebPC ? 15 : 0 }, isWebPC ? { flex: 1, borderRightWidth: 1, borderRightColor: theme.border } : { marginBottom: 15 }]}>
                    <Text style={styles.inputLabel}>{viewMode === 'COACHES' ? "STATUS DO COACH" : "STATUS DO ALUNO"}</Text>
                    {Platform.OS === 'web' ? renderWebSelect(filterStatus, (e) => setFilterStatus(e.target.value), [{ value: 'ATIVOS', label: 'TODOS ATIVOS' }, { value: 'INATIVOS', label: 'INATIVOS' }, { value: 'PAGOS', label: 'PAGOS' }, { value: 'PENDENTES', label: 'PENDENTES' }]) : (
                        <View style={styles.pickerWrapper}><Picker selectedValue={filterStatus} onValueChange={setFilterStatus} style={{ color: theme.text }} dropdownIconColor={theme.accent}><Picker.Item label="TODOS ATIVOS" value="ATIVOS" /><Picker.Item label="INATIVOS" value="INATIVOS" /><Picker.Item label="PAGOS" value="PAGOS" /><Picker.Item label="PENDENTES" value="PENDENTES" /></Picker></View>
                    )}
                </View>

                <View style={[{ padding: isWebPC ? 15 : 0 }, isWebPC ? { flex: 1, borderRightWidth: 1, borderRightColor: theme.border } : { marginBottom: 15 }]}>
                    <Text style={styles.inputLabel}>VENCIMENTO</Text>
                    {Platform.OS === 'web' ? renderWebSelect(filterPrazo, (e) => setFilterPrazo(e.target.value), [{ value: 'TODOS', label: 'QUALQUER DATA' }, { value: 'VENCIDOS', label: 'VENCIDO OU BLOQUEADO (0 dias)' }, { value: 'ALERTA_3D', label: 'URGENTE (1 a 3 dias)' }, { value: 'ATENCAO_7D', label: 'RENOVAÇÃO (4 a 7 dias)' }, { value: 'NO_PRAZO', label: 'NO PRAZO (> 7 dias)' }]) : (
                        <View style={styles.pickerWrapper}><Picker selectedValue={filterPrazo} onValueChange={setFilterPrazo} style={{ color: theme.text }} dropdownIconColor={theme.accent}><Picker.Item label="QUALQUER DATA" value="TODOS" /><Picker.Item label="VENCIDO OU BLOQUEADO (0 dias)" value="VENCIDOS" /><Picker.Item label="URGENTE (1 a 3 dias)" value="ALERTA_3D" /><Picker.Item label="RENOVAÇÃO (4 a 7 dias)" value="ATENCAO_7D" /><Picker.Item label="NO PRAZO (> 7 dias)" value="NO_PRAZO" /></Picker></View>
                    )}
                </View>

                <View style={[{ padding: isWebPC ? 15 : 0 }, isWebPC ? { flex: 1 } : {}]}>
                    <Text style={styles.inputLabel}>PLANO / CATEGORIA</Text>
                    {Platform.OS === 'web' ? renderWebSelect(filterCategory, (e) => setFilterCategory(e.target.value), categoryOptions) : (
                        <View style={styles.pickerWrapper}>
                            <Picker selectedValue={filterCategory} onValueChange={setFilterCategory} style={{ color: theme.text }} dropdownIconColor={theme.accent}>
                                {categoryOptions.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                            </Picker>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    searchBar: { padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, outlineStyle: 'none', fontSize: 14, fontWeight: 'bold' },
    filterBar: { borderRadius: 16, borderWidth: 1, marginBottom: 25, elevation: 1, overflow: 'hidden' },
    inputLabel: { color: '#888', fontSize: 10, fontWeight: '900', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' },
    webSelectWrapper: (theme) => ({ position: 'relative', width: '100%', borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }),
    webSelectInput: (theme) => ({ width: '100%', padding: '12px 35px 12px 12px', backgroundColor: 'transparent', color: theme.text, border: 'none', outline: 'none', fontWeight: 'bold', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '13px', appearance: 'none', '-webkit-appearance': 'none', '-moz-appearance': 'none', cursor: 'pointer' }),
    webSelectIcon: { position: 'absolute', right: 10, top: '50%', marginTop: -10, pointerEvents: 'none' },
    pickerWrapper: { borderRadius: 10, borderWidth: 1, borderColor: '#333', backgroundColor: '#1A1A1A', overflow: 'hidden' },
});