import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, LayoutAnimation, UIManager, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatDateToString = (date) => {
    if (!date) return 'Não definido';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function MenstrualAlertCard({ 
    theme, 
    state, 
    setters, 
    alunoIsMenstruating, 
    dbDeloadSynced, 
    intensityMultiplier, 
    isCancelingDeload, 
    handleCancelDeload, 
    forceDeload 
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (alunoIsMenstruating) {
            setIsExpanded(true);
        }
    }, [alunoIsMenstruating]);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const isDeloadActive = dbDeloadSynced || intensityMultiplier < 1;
    const hasMenstrualAlert = alunoIsMenstruating;

    return (
        <View style={[
            styles.container, 
            { 
                backgroundColor: theme.surface, 
                borderColor: hasMenstrualAlert ? '#FF3B30' : theme.border,
                borderWidth: hasMenstrualAlert ? 2 : 1
            },
            Platform.select({
                ios: { shadowColor: '#000', shadowOpacity: theme.isDark ? 0.35 : 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
                android: { elevation: 4 },
                web: { boxShadow: theme.isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)' },
            }),
        ]}>
            {/* CABEÇALHO DO DROPDOWN */}
            <TouchableOpacity 
                style={[styles.header, { borderBottomWidth: isExpanded ? 1 : 0, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} 
                onPress={toggleExpand} 
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <View style={[styles.headerIcon, { backgroundColor: hasMenstrualAlert ? '#FF3B30' : theme.accent }]}>
                        <MaterialCommunityIcons name={hasMenstrualAlert ? "water-alert" : "chart-bell-curve-cumulative"} size={18} color={theme.isDark ? '#000' : '#FFF'} />
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: hasMenstrualAlert ? '#FF3B30' : theme.text }]}>
                            Periodização e Deload
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: hasMenstrualAlert ? '#FF3B30' : theme.textSecondary, fontWeight: hasMenstrualAlert ? 'bold' : 'normal' }]}>
                            {hasMenstrualAlert ? '⚠️ ALERTA MENSTRUAL ATIVO' : (isExpanded ? 'Toque para recolher' : 'Ajuste de cargas e choque')}
                        </Text>
                    </View>
                </View>
                <View style={[styles.chevronBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                    <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
                </View>
            </TouchableOpacity>

            {/* CONTEÚDO EXPANSÍVEL */}
            {isExpanded && (
                <View style={styles.content}>

                    {/* BLOCO 1: ALERTA MENSTRUAL (Só aparece se a aluna ativou) */}
                    {hasMenstrualAlert && (
                        <View style={[
                            styles.menstrualBox, 
                            { 
                                backgroundColor: isDeloadActive ? 'rgba(77, 227, 143, 0.1)' : 'rgba(255, 59, 48, 0.1)', 
                                borderColor: isDeloadActive ? '#4DE38F' : '#FF3B30' 
                            }
                        ]}>
                            <View style={styles.menstrualHeaderRow}>
                                <MaterialCommunityIcons 
                                    name={isDeloadActive ? "shield-check" : "water-alert"} 
                                    size={20} 
                                    color={isDeloadActive ? "#4DE38F" : "#FF3B30"} 
                                />
                                <Text style={[styles.menstrualTitle, { color: isDeloadActive ? "#4DE38F" : "#FF3B30" }]}>
                                    {isDeloadActive ? 'DELOAD MENSTRUAL ATIVADO' : 'ALUNA EM PROTOCOLO MENSTRUAL'}
                                </Text>
                            </View>

                            <Text style={[styles.menstrualDescription, { color: theme.text, marginBottom: isDeloadActive ? 8 : 14 }]}>
                                {isDeloadActive 
                                    ? 'O sistema detectou o ciclo e ativou o Deload de proteção (80%) automaticamente.' 
                                    : 'A aluna sinalizou o ciclo. Para evitar lesões articulares, aplique o Deload.'}
                            </Text>

                            <TouchableOpacity 
                                style={[styles.cancelBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                                onPress={handleCancelDeload}
                                disabled={isCancelingDeload}
                                activeOpacity={0.8}
                            >
                                {isCancelingDeload ? (
                                    <ActivityIndicator size="small" color={theme.textSecondary} />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="close-circle-outline" size={18} color={theme.textSecondary} style={{ marginRight: 6 }} />
                                        <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>DESATIVAR / CANCELAR DELOAD</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {!isDeloadActive && (
                                <TouchableOpacity style={styles.forceBtn} onPress={forceDeload} activeOpacity={0.8}>
                                    <MaterialCommunityIcons name="shield-alert" size={18} color="#FFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.forceBtnText}>FORÇAR DELOAD DE PROTEÇÃO (-20%)</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* BLOCO 2: CONTROLES MANUAIS DE PERIODIZAÇÃO (Aparece para TODOS) */}
                    <View style={styles.manualBox}>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CONTROLE MANUAL DE CARGAS</Text>
                        <View style={styles.verticalGroup}>
                            <TouchableOpacity
                                style={[styles.intensityBtn, state.intensityMultiplier === 0.8 ? { backgroundColor: '#32ADE6', borderColor: '#32ADE6' } : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
                                onPress={() => { setters.setIntensityMultiplier(0.8); if (!state.intensityEndDate) setters.setShowCalendarIntensity(true); }}
                            >
                                <MaterialCommunityIcons name="snowflake-alert" size={18} color={state.intensityMultiplier === 0.8 ? '#FFF' : theme.textSecondary} />
                                <Text style={[styles.intensityBtnText, { color: state.intensityMultiplier === 0.8 ? '#FFF' : theme.textSecondary }]}>Deload (80%)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.intensityBtn, state.intensityMultiplier === 1.0 ? { backgroundColor: theme.text, borderColor: theme.text } : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
                                onPress={() => { setters.setIntensityMultiplier(1.0); setters.setIntensityEndDate(null); }}
                            >
                                <MaterialCommunityIcons name="bullseye-arrow" size={18} color={state.intensityMultiplier === 1.0 ? theme.bg : theme.textSecondary} />
                                <Text style={[styles.intensityBtnText, { color: state.intensityMultiplier === 1.0 ? theme.bg : theme.textSecondary }]}>Normal (100%)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.intensityBtn, state.intensityMultiplier === 1.15 ? { backgroundColor: '#FF3B30', borderColor: '#FF3B30' } : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
                                onPress={() => { setters.setIntensityMultiplier(1.15); if (!state.intensityEndDate) setters.setShowCalendarIntensity(true); }}
                            >
                                <MaterialCommunityIcons name="fire-alert" size={18} color={state.intensityMultiplier === 1.15 ? '#FFF' : theme.textSecondary} />
                                <Text style={[styles.intensityBtnText, { color: state.intensityMultiplier === 1.15 ? '#FFF' : theme.textSecondary }]}>Choque (115%)</Text>
                            </TouchableOpacity>
                        </View>

                        {state.intensityMultiplier !== 1.0 && (
                            <TouchableOpacity style={[styles.calendarBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} onPress={() => setters.setShowCalendarIntensity(true)}>
                                <View style={[styles.dateIconBox, { backgroundColor: theme.accent + '20' }]}><MaterialCommunityIcons name="calendar-clock" size={15} color={theme.accent} /></View>
                                <View>
                                    <Text style={[styles.dateBtnLabel, { color: theme.textSecondary }]}>Fim da máscara automática</Text>
                                    <Text style={[styles.dateBtnValue, { color: theme.text }]}>{state.intensityEndDate ? formatDateToString(state.intensityEndDate) : 'Selecione uma data...'}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
    header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
    headerSubtitle: { fontSize: 11 },
    chevronBox: { borderRadius: 8, padding: 5 },
    content: { padding: 16, paddingTop: 8 },

    menstrualBox: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
    menstrualHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    menstrualTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginLeft: 6 },
    menstrualDescription: { fontSize: 13, lineHeight: 18 },
    cancelBtn: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    cancelBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    forceBtn: { backgroundColor: '#FF3B30', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    forceBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

    manualBox: { marginTop: 4 },
    sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 },
    verticalGroup: { flexDirection: 'column', gap: 8 },
    intensityBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, gap: 8 },
    intensityBtnText: { fontSize: 12, fontWeight: '800' },
    calendarBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, gap: 10 },
    dateIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    dateBtnLabel: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
    dateBtnValue: { fontSize: 13, fontWeight: '800' },
});