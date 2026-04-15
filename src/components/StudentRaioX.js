import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StudentRaioX({ anamnese, macros, show, onToggle, theme }) {
    if (!show) {
        return (
            <TouchableOpacity style={[s.header, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14 }]} onPress={onToggle}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="clipboard-pulse" size={16} color={theme.accent} />
                    <Text style={[s.title, { color: theme.text }]}>RAIO-X DO ALUNO</Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
        );
    }

    return (
        <View style={[s.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity style={s.headerInside} onPress={onToggle}>
                <Text style={[s.title, { color: theme.text }]}>RAIO-X DO ALUNO</Text>
                <MaterialCommunityIcons name="chevron-up" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
            
            {anamnese ? (
                <View style={s.body}>
                    <View style={s.grid}>
                        <View style={s.item}><Text style={s.label}>OBJETIVO</Text><Text style={[s.val, {color: theme.text}]}>{anamnese.objetivo}</Text></View>
                        <View style={s.item}><Text style={s.label}>TMB</Text><Text style={[s.val, {color: theme.text}]}>{macros.tmb} kcal</Text></View>
                        <View style={s.item}><Text style={s.label}>ALVO</Text><Text style={[s.val, {color: theme.text}]}>{macros.alvo} kcal</Text></View>
                        <View style={s.item}><Text style={s.label}>FREQUÊNCIA</Text><Text style={[s.val, {color: theme.text}]}>{anamnese.frequencia}x</Text></View>
                    </View>
                    <View style={[s.alert, { borderLeftColor: '#FF3B30', backgroundColor: '#FF3B3010' }]}>
                        <Text style={s.alertLabel}>RESTRIÇÕES:</Text>
                        <Text style={[s.alertVal, {color: theme.text}]}>{anamnese.allergies || anamnese.foodAversions || 'Nenhuma'}</Text>
                    </View>
                </View>
            ) : <Text style={s.empty}>Nenhuma anamnese disponível.</Text>}
        </View>
    );
}

const s = StyleSheet.create({
    container: { borderRadius: 14, borderWidth: 1, marginBottom: 15 },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderWidth: 1 },
    headerInside: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    title: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    body: { padding: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    item: { width: '47%' },
    label: { fontSize: 9, color: '#888', fontWeight: '700', marginBottom: 2 },
    val: { fontSize: 13, fontWeight: '800' },
    alert: { padding: 10, borderRadius: 8, borderLeftWidth: 3, marginTop: 5 },
    alertLabel: { fontSize: 9, color: '#FF3B30', fontWeight: '900' },
    alertVal: { fontSize: 12 },
    empty: { padding: 20, fontStyle: 'italic', color: '#888' }
});