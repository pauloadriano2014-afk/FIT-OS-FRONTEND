// src/components/MontarTreino/WorkoutSettingsCard.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, LayoutAnimation, UIManager, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Permite a animação de sanfona no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatDateToString = (date) => { 
    if (!date) return ''; 
    const d = new Date(date); 
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; 
};

export default function WorkoutSettingsCard({ state, setters, actions, theme }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* 🔥 CABEÇALHO DO ACCORDION 🔥 */}
            <TouchableOpacity style={styles.header} onPress={toggleExpand}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ backgroundColor: theme.accent + '20', padding: 6, borderRadius: 8 }}>
                        <MaterialCommunityIcons name="tune-variant" size={20} color={theme.accent} />
                    </View>
                    <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>
                        CONFIGURAÇÕES E FERRAMENTAS
                    </Text>
                </View>
                <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* 🔥 ÁREA ESCONDIDA (BUROCRACIA) 🔥 */}
            {isExpanded && (
                <View style={styles.content}>
                    
                    {/* NOME DA ROTINA */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NOME DA ROTINA</Text>
                    <TextInput 
                        style={[styles.nameInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                        placeholder="Ex: HIPERTROFIA A" 
                        placeholderTextColor={theme.textSecondary} 
                        value={state.customWorkoutName} 
                        onChangeText={setters.setCustomWorkoutName} 
                    />
                    
                    {/* DATAS COMPACTAS (INÍCIO E FIM NA MESMA CAIXA) */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PERÍODO DE VALIDADE</Text>
                    <View style={[styles.compactDateBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <TouchableOpacity style={styles.compactDateBtn} onPress={() => setters.setShowCalendarStart(true)}>
                            <MaterialCommunityIcons name="calendar-arrow-right" size={18} color={theme.accent} />
                            <View>
                                <Text style={[styles.compactDateLabel, { color: theme.textSecondary }]}>Início</Text>
                                <Text style={[styles.compactDateValue, { color: theme.text }]}>{formatDateToString(state.startDate)}</Text>
                            </View>
                        </TouchableOpacity>
                        
                        <View style={[styles.dateDivider, { backgroundColor: theme.border }]} />
                        
                        <TouchableOpacity style={[styles.compactDateBtn, state.isArchived && { opacity: 0.4 }]} onPress={() => setters.setShowCalendarEnd(true)}>
                            <MaterialCommunityIcons name="calendar-remove" size={18} color={theme.accent} />
                            <View>
                                <Text style={[styles.compactDateLabel, { color: theme.textSecondary }]}>Fim</Text>
                                <Text style={[styles.compactDateValue, { color: theme.text }]}>{formatDateToString(state.endDate)}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    
                    {/* STATUS (ATIVO/ARQUIVADO) */}
                    <View style={[styles.archiveRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons name={state.isArchived ? "archive-lock" : "check-decagram"} size={18} color={state.isArchived ? '#FF3B30' : theme.accent} />
                            <Text style={[styles.archiveLabel, state.isArchived ? {color:'#FF3B30'} : {color: theme.accent}]}>
                                {state.isArchived ? "TREINO ARQUIVADO" : "TREINO ATIVO"}
                            </Text>
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
                            trackColor={{false: theme.border, true: theme.isDark ? '#330000' : '#FFE5E5'}} 
                            thumbColor={state.isArchived ? '#FF3B30' : theme.accent} 
                        />
                    </View>

                    <View style={styles.separator} />

                    {/* 🔥 MODELO DO TREINO */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ESTRUTURA DO TREINO</Text>
                    <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                        <TouchableOpacity 
                            style={[styles.modelBtn, state.workoutModel === 'BASE' ? {backgroundColor: theme.accent, borderColor: theme.accent} : {backgroundColor: theme.bg, borderColor: theme.border}]}
                            onPress={() => { 
                                setters.setWorkoutModel('BASE'); 
                                setters.setIntensityMultiplier(1.0); 
                                setters.setIntensityEndDate(null); 
                            }}
                        >
                            <MaterialCommunityIcons name="weight-lifter" size={20} color={state.workoutModel === 'BASE' ? '#000' : theme.textSecondary} />
                            <Text style={[styles.modelBtnText, state.workoutModel === 'BASE' ? {color: '#000'} : {color: theme.textSecondary}]}>SEM CARGA</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.modelBtn, state.workoutModel === 'CARGA' ? {backgroundColor: theme.accent, borderColor: theme.accent} : {backgroundColor: theme.bg, borderColor: theme.border}]}
                            onPress={() => setters.setWorkoutModel('CARGA')}
                        >
                            <MaterialCommunityIcons name="dumbbell" size={20} color={state.workoutModel === 'CARGA' ? '#000' : theme.textSecondary} />
                            <Text style={[styles.modelBtnText, state.workoutModel === 'CARGA' ? {color: '#000'} : {color: theme.textSecondary}]}>COM CARGA</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 🔥 O MOTOR DE PERIODIZAÇÃO 🔥 */}
                    {state.workoutModel === 'CARGA' && (
                        <View style={[styles.intensityBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={16} color={theme.text} />
                                    <Text style={{color: theme.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.5}}>PERIODIZAÇÃO</Text>
                                </View>
                                <Text style={{color: theme.textSecondary, fontSize: 9, fontWeight: 'bold'}}>MÁSCARA DE CARGA</Text>
                            </View>

                            <View style={{flexDirection: 'row', justifyContent: 'space-between', gap: 8}}>
                                <TouchableOpacity 
                                    style={[styles.intensityBtn, state.intensityMultiplier === 0.8 ? { backgroundColor: '#32ADE6', borderColor: '#32ADE6' } : { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={() => { setters.setIntensityMultiplier(0.8); if (!state.intensityEndDate) setters.setShowCalendarIntensity(true); }}
                                >
                                    <MaterialCommunityIcons name="snowflake-alert" size={18} color={state.intensityMultiplier === 0.8 ? '#FFF' : theme.textSecondary} />
                                    <Text style={[styles.intensityText, state.intensityMultiplier === 0.8 ? {color: '#FFF'} : {color: theme.textSecondary}]}>DELOAD</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.intensityBtn, state.intensityMultiplier === 1.0 ? { backgroundColor: theme.text, borderColor: theme.text } : { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={() => { setters.setIntensityMultiplier(1.0); setters.setIntensityEndDate(null); }}
                                >
                                    <MaterialCommunityIcons name="bullseye-arrow" size={18} color={state.intensityMultiplier === 1.0 ? theme.bg : theme.textSecondary} />
                                    <Text style={[styles.intensityText, state.intensityMultiplier === 1.0 ? {color: theme.bg} : {color: theme.textSecondary}]}>NORMAL</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.intensityBtn, state.intensityMultiplier === 1.15 ? { backgroundColor: '#FF3B30', borderColor: '#FF3B30' } : { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={() => { setters.setIntensityMultiplier(1.15); if (!state.intensityEndDate) setters.setShowCalendarIntensity(true); }}
                                >
                                    <MaterialCommunityIcons name="fire-alert" size={18} color={state.intensityMultiplier === 1.15 ? '#FFF' : theme.textSecondary} />
                                    <Text style={[styles.intensityText, state.intensityMultiplier === 1.15 ? {color: '#FFF'} : {color: theme.textSecondary}]}>CHOQUE</Text>
                                </TouchableOpacity>
                            </View>

                            {state.intensityMultiplier !== 1.0 && (
                                <TouchableOpacity 
                                    style={[styles.calendarBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                                    onPress={() => setters.setShowCalendarIntensity(true)}
                                >
                                    <MaterialCommunityIcons name="calendar-clock" size={16} color={theme.accent} style={{marginRight: 6}} />
                                    <View>
                                        <Text style={{color: theme.textSecondary, fontSize: 9, fontWeight: 'bold'}}>FIM DA MÁSCARA AUTOMÁTICA</Text>
                                        <Text style={{color: theme.text, fontSize: 12, fontWeight: '900'}}>
                                            {state.intensityEndDate ? formatDateToString(state.intensityEndDate) : `Selecione uma data...`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.separator} />

                    {/* 🔥 FERRAMENTAS EXTRAS EMBUTIDAS (MFIT, CLONAR, BIBLIOTECA) 🔥 */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>FERRAMENTAS DE IMPORTAÇÃO</Text>
                    
                    <TouchableOpacity 
                        style={[styles.toolBtnPrimary, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]} 
                        onPress={actions?.handleImportPDF}
                        disabled={state.isImportingAI}
                    >
                        <MaterialCommunityIcons name="magic-staff" size={20} color={theme.accent} />
                        <Text style={[styles.toolBtnPrimaryText, { color: theme.accent }]}>IMPORTAR TREINO DA MFIT (PDF)</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <TouchableOpacity style={[styles.toolBtnSecondary, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => { actions?.fetchStudentsForClone(); setters?.setModalCloneVisible(true); }}>
                            <MaterialCommunityIcons name="account-switch-outline" size={18} color={theme.text} />
                            <Text style={[styles.toolBtnSecondaryText, { color: theme.text }]}>CLONAR ALUNO</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.toolBtnSecondary, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => { actions?.fetchTemplates(); setters?.setModalTemplatesVisible(true); }}>
                            <MaterialCommunityIcons name="folder-download-outline" size={18} color={theme.text} />
                            <Text style={[styles.toolBtnSecondaryText, { color: theme.text }]}>BIBLIOTECA</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { borderRadius: 15, borderWidth: 1, marginBottom: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    header: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    content: { padding: 15, paddingTop: 5 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, marginTop: 5 },
    nameInput: { padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, fontSize: 15, fontWeight: 'bold', outlineStyle: 'none' },
    
    compactDateBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, marginBottom: 20 },
    compactDateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 10 },
    dateDivider: { width: 1, height: '60%' },
    compactDateLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
    compactDateValue: { fontSize: 13, fontWeight: '900' },
    
    archiveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1 },
    archiveLabel: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    
    separator: { height: 1, backgroundColor: 'rgba(150,150,150,0.2)', marginVertical: 20 },
    
    modelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, gap: 6 },
    modelBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    
    intensityBox: { marginTop: 5, padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
    intensityBtn: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, gap: 6 },
    intensityText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    calendarBtn: { marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1 },
    
    toolBtnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, borderWidth: 1, gap: 8 },
    toolBtnPrimaryText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    toolBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1, gap: 6 },
    toolBtnSecondaryText: { fontSize: 11, fontWeight: 'bold' }
});