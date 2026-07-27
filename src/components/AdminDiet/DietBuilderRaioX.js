// src/components/AdminDiet/DietBuilderRaioX.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DietBuilderRaioX({ anamnese, macros, theme, onClose }) {
    const sections = [
        {
            title: '🎯 Objetivo e Perfil',
            items: [
                `Objetivo: ${anamnese.objetivo ?? '—'}`,
                `Peso: ${anamnese.peso ?? '—'}kg | Altura: ${anamnese.altura ?? '—'}cm`,
                `Gênero: ${anamnese.gender ?? anamnese.sexo ?? '—'}`,
                `Frequência: ${anamnese.frequencia ?? '—'}x/sem`,
            ],
        },
        {
            title: '⏰ Rotina',
            items: [
                `Acorda: ${anamnese.wakeUpTime ?? '—'} | Dorme: ${anamnese.sleepTime ?? '—'}`,
                `Treino: ${anamnese.trainTime ?? '—'}`,
                `Refeições/dia: ${anamnese.mealsPerDay ?? '—'}`,
                `Trabalho: ${anamnese.workTimeStart ?? '—'} às ${anamnese.workTimeEnd ?? '—'}`,
            ],
        },
        {
            title: '🎯 Metas do Dia',
            items: [`KCAL: ${macros.kcal} | PROT: ${macros.prot}g | CARBO: ${macros.carb}g | GORD: ${macros.fat}g`],
        },
        {
            title: '⚠️ Restrições e Saúde',
            items: [
                `Alergias: ${anamnese.allergies ?? 'Nenhuma'}`,
                `Aversões: ${anamnese.foodAversions ?? 'Nenhuma'}`,
                `Preferências: ${anamnese.foodPreferences ?? '—'}`,
                `Condições: ${(anamnese.healthConditions ?? []).join(', ') || 'Nenhuma'}`,
                `Digestivo: ${(anamnese.digestiveIssues ?? []).join(', ') || 'Nenhum'}`,
                anamnese.bariatric ? `🔴 Bariátrico: ${anamnese.bariatricType} (${anamnese.bariatricTime})` : null,
            ].filter(Boolean),
        },
        {
            title: '💊 Suplementos',
            items: [anamnese.supplements ?? 'Não informado'],
        },
        {
            title: '📝 Observações',
            items: [anamnese.extraNotes ?? anamnese.observacoes ?? 'Nenhuma'],
        },
    ];

    return (
        <View style={[s.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <Text style={{ color:theme.text, fontWeight:'900', fontSize:13, letterSpacing:0.5 }}>
                    ☢️ RAIO-X DO ALUNO
                </Text>
                <TouchableOpacity onPress={onClose}>
                    <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {sections.map((sec, si) => (
                    <View key={si} style={{ marginBottom:12 }}>
                        <Text style={{ color:theme.accent, fontWeight:'900', fontSize:11, marginBottom:4, letterSpacing:0.5 }}>
                            {sec.title}
                        </Text>
                        {sec.items.map((item, ii) => (
                            <Text key={ii} style={{ color:theme.textSecondary, fontSize:11, lineHeight:18 }}>• {item}</Text>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    panel: { borderRadius:18, borderWidth:1, padding:16, marginBottom:12, maxHeight:400 },
});