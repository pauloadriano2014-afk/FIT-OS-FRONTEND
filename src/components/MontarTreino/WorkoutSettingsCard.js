// src/components/MontarTreino/WorkoutSettingsCard.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, LayoutAnimation, UIManager, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatDateToString = (date) => {
    if (!date) return 'Não definido';
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
        <View style={[
            styles.container,
            { backgroundColor: theme.surface },
            Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOpacity: theme.isDark ? 0.35 : 0.08,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 6 },
                },
                android: { elevation: 4 },
                web: {
                    boxShadow: theme.isDark
                        ? '0 4px 24px rgba(0,0,0,0.4)'
                        : '0 4px 24px rgba(0,0,0,0.08)',
                },
            }),
        ]}>

            {/* CABEÇALHO */}
            <TouchableOpacity style={[
                styles.header,
                {
                    borderBottomWidth: isExpanded ? 1 : 0,
                    borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }
            ]} onPress={toggleExpand} activeOpacity={0.7}>
                <View style={styles.headerLeft}>
                    <View style={[
                        styles.headerIcon,
                        { backgroundColor: theme.accent },
                        Platform.select({
                            ios: {
                                shadowColor: theme.accent,
                                shadowOpacity: 0.4,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 3 },
                            },
                        }),
                    ]}>
                        <MaterialCommunityIcons name="tune-variant" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Configurações</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                            {isExpanded ? 'Toque para recolher' : 'Período, modelo e ferramentas'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.chevronBox, {
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                }]}>
                    <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.textSecondary}
                    />
                </View>
            </TouchableOpacity>

            {/* CONTEÚDO EXPANSÍVEL */}
            {isExpanded && (
                <View style={styles.content}>

                    {/* NOME DA ROTINA */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>NOME DA ROTINA</Text>
                    <TextInput
                        style={[styles.nameInput, {
                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            color: theme.text,
                            borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        }]}
                        placeholder="Ex: HIPERTROFIA A"
                        placeholderTextColor={theme.textSecondary}
                        value={state.customWorkoutName}
                        onChangeText={setters.setCustomWorkoutName}
                    />

                    {/* PERÍODO */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PERÍODO DE VALIDADE</Text>
                    <View style={[styles.dateRow, {
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    }]}>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setters.setShowCalendarStart(true)}>
                            <View style={[styles.dateIconBox, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="calendar-arrow-right" size={16} color={theme.accent} />
                            </View>
                            <View>
                                <Text style={[styles.dateBtnLabel, { color: theme.textSecondary }]}>Início</Text>
                                <Text style={[styles.dateBtnValue, { color: theme.text }]}>
                                    {formatDateToString(state.startDate)}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.dateSeparator, {
                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        }]} />

                        <TouchableOpacity
                            style={[styles.dateBtn, state.isArchived && { opacity: 0.4 }]}
                            onPress={() => setters.setShowCalendarEnd(true)}
                        >
                            <View style={[styles.dateIconBox, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="calendar-remove" size={16} color={theme.accent} />
                            </View>
                            <View>
                                <Text style={[styles.dateBtnLabel, { color: theme.textSecondary }]}>Fim</Text>
                                <Text style={[styles.dateBtnValue, { color: theme.text }]}>
                                    {formatDateToString(state.endDate)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* STATUS ATIVO / ARQUIVADO */}
                    <View style={[styles.archiveRow, {
                        backgroundColor: state.isArchived
                            ? 'rgba(255,59,48,0.08)'
                            : theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        borderColor: state.isArchived ? '#FF3B3044' : theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    }]}>
                        <View style={styles.archiveLeft}>
                            <View style={[styles.archiveIconBox, {
                                backgroundColor: state.isArchived ? '#FF3B3020' : theme.accent + '20',
                            }]}>
                                <MaterialCommunityIcons
                                    name={state.isArchived ? 'archive-lock' : 'check-decagram'}
                                    size={16}
                                    color={state.isArchived ? '#FF3B30' : theme.accent}
                                />
                            </View>
                            <View>
                                <Text style={[styles.archiveTitle, {
                                    color: state.isArchived ? '#FF3B30' : theme.accent,
                                }]}>
                                    {state.isArchived ? 'Treino Arquivado' : 'Treino Ativo'}
                                </Text>
                                <Text style={[styles.archiveSubtitle, { color: theme.textSecondary }]}>
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

                    <View style={[styles.separator, {
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }]} />

                    {/* ESTRUTURA DO TREINO */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ESTRUTURA DO TREINO</Text>
                    <View style={styles.modelRow}>
                        <TouchableOpacity
                            style={[
                                styles.modelBtn,
                                state.workoutModel === 'BASE'
                                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                                    : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                                state.workoutModel === 'BASE' && Platform.OS === 'ios' && {
                                    shadowColor: theme.accent,
                                    shadowOpacity: 0.4,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                },
                            ]}
                            onPress={() => {
                                setters.setWorkoutModel('BASE');
                                setters.setIntensityMultiplier(1.0);
                                setters.setIntensityEndDate(null);
                            }}
                        >
                            <MaterialCommunityIcons
                                name="weight-lifter"
                                size={20}
                                color={state.workoutModel === 'BASE' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary}
                            />
                            <Text style={[styles.modelBtnText, {
                                color: state.workoutModel === 'BASE' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary,
                            }]}>Sem Carga</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.modelBtn,
                                state.workoutModel === 'CARGA'
                                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                                    : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                                state.workoutModel === 'CARGA' && Platform.OS === 'ios' && {
                                    shadowColor: theme.accent,
                                    shadowOpacity: 0.4,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                },
                            ]}
                            onPress={() => setters.setWorkoutModel('CARGA')}
                        >
                            <MaterialCommunityIcons
                                name="dumbbell"
                                size={20}
                                color={state.workoutModel === 'CARGA' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary}
                            />
                            <Text style={[styles.modelBtnText, {
                                color: state.workoutModel === 'CARGA' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary,
                            }]}>Com Carga</Text>
                        </TouchableOpacity>
                    </View>

                    {/* PERIODIZAÇÃO */}
                    {state.workoutModel === 'CARGA' && (
                        <View style={[styles.intensityBox, {
                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        }]}>
                            <View style={styles.intensityHeader}>
                                <View style={styles.intensityHeaderLeft}>
                                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={15} color={theme.textSecondary} />
                                    <Text style={[styles.intensityTitle, { color: theme.textSecondary }]}>Periodização</Text>
                                </View>
                                <Text style={[styles.intensitySubtitle, { color: theme.textSecondary }]}>Máscara de carga</Text>
                            </View>

                            <View style={styles.intensityBtns}>
                                <TouchableOpacity
                                    style={[
                                        styles.intensityBtn,
                                        state.intensityMultiplier === 0.8
                                            ? { backgroundColor: '#32ADE6', borderColor: '#32ADE6' }
                                            : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                                    ]}
                                    onPress={() => {
                                        setters.setIntensityMultiplier(0.8);
                                        if (!state.intensityEndDate) setters.setShowCalendarIntensity(true);
                                    }}
                                >
                                    <MaterialCommunityIcons name="snowflake-alert" size={18} color={state.intensityMultiplier === 0.8 ? '#FFF' : theme.textSecondary} />
                                    <Text style={[styles.intensityBtnText, { color: state.intensityMultiplier === 0.8 ? '#FFF' : theme.textSecondary }]}>Deload</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.intensityBtn,
                                        state.intensityMultiplier === 1.0
                                            ? { backgroundColor: theme.text, borderColor: theme.text }
                                            : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                                    ]}
                                    onPress={() => {
                                        setters.setIntensityMultiplier(1.0);
                                        setters.setIntensityEndDate(null);
                                    }}
                                >
                                    <MaterialCommunityIcons name="bullseye-arrow" size={18} color={state.intensityMultiplier === 1.0 ? theme.bg : theme.textSecondary} />
                                    <Text style={[styles.intensityBtnText, { color: state.intensityMultiplier === 1.0 ? theme.bg : theme.textSecondary }]}>Normal</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.intensityBtn,
                                        state.intensityMultiplier === 1.15
                                            ? { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }
                                            : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                                    ]}
                                    onPress={() => {
                                        setters.setIntensityMultiplier(1.15);
                                        if (!state.intensityEndDate) setters.setShowCalendarIntensity(true);
                                    }}
                                >
                                    <MaterialCommunityIcons name="fire-alert" size={18} color={state.intensityMultiplier === 1.15 ? '#FFF' : theme.textSecondary} />
                                    <Text style={[styles.intensityBtnText, { color: state.intensityMultiplier === 1.15 ? '#FFF' : theme.textSecondary }]}>Choque</Text>
                                </TouchableOpacity>
                            </View>

                            {state.intensityMultiplier !== 1.0 && (
                                <TouchableOpacity
                                    style={[styles.calendarBtn, {
                                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                        borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                    }]}
                                    onPress={() => setters.setShowCalendarIntensity(true)}
                                >
                                    <View style={[styles.dateIconBox, { backgroundColor: theme.accent + '20' }]}>
                                        <MaterialCommunityIcons name="calendar-clock" size={15} color={theme.accent} />
                                    </View>
                                    <View>
                                        <Text style={[styles.dateBtnLabel, { color: theme.textSecondary }]}>Fim da máscara automática</Text>
                                        <Text style={[styles.dateBtnValue, { color: theme.text }]}>
                                            {state.intensityEndDate ? formatDateToString(state.intensityEndDate) : 'Selecione uma data...'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={[styles.separator, {
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }]} />

                    {/* FERRAMENTAS DE IMPORTAÇÃO */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>FERRAMENTAS DE IMPORTAÇÃO</Text>

                    <TouchableOpacity
                        style={[styles.toolBtnPrimary, {
                            backgroundColor: theme.accent + '12',
                            borderColor: theme.accent + '40',
                        }]}
                        onPress={actions?.handleImportPDF}
                        disabled={state.isImportingAI}
                    >
                        {state.isImportingAI ? (
                            <>
                                <ActivityIndicator color={theme.accent} size="small" />
                                <Text style={[styles.toolBtnPrimaryText, { color: theme.accent }]}>Extraindo cargas do PDF...</Text>
                            </>
                        ) : (
                            <>
                                <View style={[styles.toolIconBox, { backgroundColor: theme.accent + '20' }]}>
                                    <MaterialCommunityIcons name="magic-staff" size={17} color={theme.accent} />
                                </View>
                                <Text style={[styles.toolBtnPrimaryText, { color: theme.accent }]}>Importar treino da Mfit (PDF)</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.toolRow}>
                        <TouchableOpacity
                            style={[styles.toolBtnSecondary, {
                                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            }]}
                            onPress={() => { actions?.fetchStudentsForClone(); setters?.setModalCloneVisible(true); }}
                        >
                            <MaterialCommunityIcons name="account-switch-outline" size={17} color={theme.text} />
                            <Text style={[styles.toolBtnSecondaryText, { color: theme.text }]}>Clonar Aluno</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.toolBtnSecondary, {
                                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            }]}
                            onPress={() => { actions?.fetchTemplates(); setters?.setModalTemplatesVisible(true); }}
                        >
                            <MaterialCommunityIcons name="folder-download-outline" size={17} color={theme.text} />
                            <Text style={[styles.toolBtnSecondaryText, { color: theme.text }]}>Biblioteca</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
    },
    header: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 11,
    },
    chevronBox: {
        borderRadius: 8,
        padding: 5,
    },
    content: {
        padding: 16,
        paddingTop: 8,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.2,
        marginBottom: 10,
        marginTop: 6,
    },
    
    // 🔥 BLINDAGEM DE FONT SIZE (EVITA ZOOM NO IOS) 🔥
    nameInput: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        fontSize: 16, // CRAVADO EM 16PX PRA BLINDAR O IOS
        fontWeight: '700',
        outlineStyle: 'none',
    },
    
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    dateBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        gap: 10,
    },
    dateIconBox: {
        width: 30,
        height: 30,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateBtnLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 2,
    },
    dateBtnValue: {
        fontSize: 13,
        fontWeight: '800',
    },
    dateSeparator: {
        width: 1,
        height: 36,
    },
    archiveRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 4,
    },
    archiveLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    archiveIconBox: {
        width: 30,
        height: 30,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    archiveTitle: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 2,
    },
    archiveSubtitle: {
        fontSize: 10,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        marginVertical: 20,
    },
    modelRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    modelBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        gap: 7,
    },
    modelBtnText: {
        fontSize: 12,
        fontWeight: '800',
    },
    intensityBox: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 4,
    },
    intensityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    intensityHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    intensityTitle: {
        fontSize: 11,
        fontWeight: '700',
    },
    intensitySubtitle: {
        fontSize: 9,
        fontWeight: '600',
        opacity: 0.7,
    },
    intensityBtns: {
        flexDirection: 'row',
        gap: 8,
    },
    intensityBtn: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 5,
    },
    intensityBtnText: {
        fontSize: 10,
        fontWeight: '800',
    },
    calendarBtn: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 10,
    },
    toolBtnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
        marginBottom: 10,
    },
    toolIconBox: {
        width: 28,
        height: 28,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolBtnPrimaryText: {
        fontSize: 13,
        fontWeight: '800',
    },
    toolRow: {
        flexDirection: 'row',
        gap: 10,
    },
    toolBtnSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 13,
        borderRadius: 12,
        borderWidth: 1,
        gap: 7,
    },
    toolBtnSecondaryText: {
        fontSize: 12,
        fontWeight: '700',
    },
});