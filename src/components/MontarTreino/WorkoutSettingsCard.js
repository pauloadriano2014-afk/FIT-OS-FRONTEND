import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, LayoutAnimation, UIManager, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatDateToString = (date) => {
    if (!date) return 'Não definido';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function WorkoutSettingsCard({ state, setters, theme }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={[
            S.container,
            { backgroundColor: theme.surface },
            Platform.select({
                ios: { shadowColor: '#000', shadowOpacity: theme.isDark ? 0.35 : 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
                android: { elevation: 4 },
                web: { boxShadow: theme.isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)' },
            }),
        ]}>
            {/* CABEÇALHO */}
            <TouchableOpacity
                style={[S.header, { borderBottomWidth: isExpanded ? 1 : 0, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                onPress={toggleExpand}
                activeOpacity={0.7}
            >
                <View style={S.headerLeft}>
                    <View style={[S.headerIcon, { backgroundColor: theme.accent }]}>
                        <MaterialCommunityIcons name="text-box-outline" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                    </View>
                    <View>
                        <Text style={[S.headerTitle, { color: theme.text }]}>Detalhes da Rotina</Text>
                        <Text style={[S.headerSubtitle, { color: theme.textSecondary }]}>
                            {isExpanded ? 'Toque para recolher' : 'Nome, período e estrutura'}
                        </Text>
                    </View>
                </View>
                <View style={[S.chevronBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                    <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={S.content}>
                    {/* NOME */}
                    <Text style={[S.label, { color: theme.textSecondary }]}>NOME DA ROTINA</Text>
                    <TextInput
                        style={[S.nameInput, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: theme.text, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
                        placeholder="Ex: HIPERTROFIA A"
                        placeholderTextColor={theme.textSecondary}
                        value={state.customWorkoutName}
                        onChangeText={setters.setCustomWorkoutName}
                    />

                    {/* PERÍODO */}
                    <Text style={[S.label, { color: theme.textSecondary }]}>PERÍODO DE VALIDADE</Text>
                    <View style={S.group}>
                        <TouchableOpacity
                            style={[S.dateBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
                            onPress={() => setters.setShowCalendarStart(true)}
                        >
                            <View style={[S.dateIcon, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="calendar-arrow-right" size={16} color={theme.accent} />
                            </View>
                            <View>
                                <Text style={[S.dateLbl, { color: theme.textSecondary }]}>Início</Text>
                                <Text style={[S.dateVal, { color: theme.text }]}>{formatDateToString(state.startDate)}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[S.dateBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }, state.isArchived && { opacity: 0.4 }]}
                            onPress={() => setters.setShowCalendarEnd(true)}
                        >
                            <View style={[S.dateIcon, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="calendar-remove" size={16} color={theme.accent} />
                            </View>
                            <View>
                                <Text style={[S.dateLbl, { color: theme.textSecondary }]}>Fim</Text>
                                <Text style={[S.dateVal, { color: theme.text }]}>{formatDateToString(state.endDate)}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* STATUS */}
                    <View style={[S.archiveRow, {
                        backgroundColor: state.isArchived ? 'rgba(255,59,48,0.08)' : theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        borderColor: state.isArchived ? '#FF3B3044' : theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    }]}>
                        <View style={S.archiveLeft}>
                            <View style={[S.archiveIcon, { backgroundColor: state.isArchived ? '#FF3B3020' : theme.accent + '20' }]}>
                                <MaterialCommunityIcons name={state.isArchived ? 'archive-lock' : 'check-decagram'} size={16} color={state.isArchived ? '#FF3B30' : theme.accent} />
                            </View>
                            <View>
                                <Text style={[S.archiveTitle, { color: state.isArchived ? '#FF3B30' : theme.accent }]}>
                                    {state.isArchived ? 'Treino Arquivado' : 'Treino Ativo'}
                                </Text>
                                <Text style={[S.archiveSub, { color: theme.textSecondary }]}>
                                    {state.isArchived ? 'Não aparece para o aluno' : 'Visível para o aluno'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={state.isArchived}
                            onValueChange={(val) => {
                                setters.setIsArchived(val);
                                if (!val && state.endDate < new Date()) {
                                    const futureDate = new Date();
                                    futureDate.setDate(futureDate.getDate() + 30);
                                    setters.setEndDate(futureDate);
                                }
                            }}
                            trackColor={{ false: theme.border, true: theme.isDark ? '#330000' : '#FFE5E5' }}
                            thumbColor={state.isArchived ? '#FF3B30' : theme.accent}
                        />
                    </View>

                    <View style={[S.separator, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

                    {/* ESTRUTURA */}
                    <Text style={[S.label, { color: theme.textSecondary }]}>ESTRUTURA DO TREINO</Text>
                    <View style={S.group}>
                        <TouchableOpacity
                            style={[S.modelBtn,
                                state.workoutModel === 'BASE'
                                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                                    : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }
                            ]}
                            onPress={() => { setters.setWorkoutModel('BASE'); setters.setIntensityMultiplier(1.0); setters.setIntensityEndDate(null); }}
                        >
                            <MaterialCommunityIcons name="weight-lifter" size={20} color={state.workoutModel === 'BASE' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                            <Text style={[S.modelText, { color: state.workoutModel === 'BASE' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>Sem Carga</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[S.modelBtn,
                                state.workoutModel === 'CARGA'
                                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                                    : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }
                            ]}
                            onPress={() => setters.setWorkoutModel('CARGA')}
                        >
                            <MaterialCommunityIcons name="dumbbell" size={20} color={state.workoutModel === 'CARGA' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary} />
                            <Text style={[S.modelText, { color: state.workoutModel === 'CARGA' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>Com Carga</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const S = StyleSheet.create({
    container:     { borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
    header:        { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon:    { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle:   { fontSize: 15, fontWeight: '800', marginBottom: 2 },
    headerSubtitle:{ fontSize: 11 },
    chevronBox:    { borderRadius: 8, padding: 5 },
    content:       { padding: 16, paddingTop: 8 },
    label:         { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8, marginTop: 6 },
    nameInput:     { padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, fontSize: 16, fontWeight: '700', outlineStyle: 'none' },
    group:         { flexDirection: 'column', gap: 8, marginBottom: 12 },
    dateBtn:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderRadius: 12, borderWidth: 1 },
    dateIcon:      { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    dateLbl:       { fontSize: 10, fontWeight: '600', marginBottom: 2 },
    dateVal:       { fontSize: 13, fontWeight: '800' },
    archiveRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
    archiveLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
    archiveIcon:   { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    archiveTitle:  { fontSize: 13, fontWeight: '800', marginBottom: 2 },
    archiveSub:    { fontSize: 10, fontWeight: '500' },
    separator:     { height: 1, marginVertical: 20 },
    modelBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 1, gap: 7 },
    modelText:     { fontSize: 12, fontWeight: '800' },
});