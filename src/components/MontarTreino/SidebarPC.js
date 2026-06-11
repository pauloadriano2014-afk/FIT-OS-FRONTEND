// src/components/MontarTreino/SidebarPC.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal, LayoutAnimation, UIManager, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RaioXCard from './RaioXCard';
import MenstrualAlertCard from './MenstrualAlertCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ENVIRONMENTS = [
    { id: 'UNIVERSAL',       label: 'Todos',         icon: 'earth',           color: '#4ECDC4' },
    { id: 'SMARTFIT',        label: 'SmartFit',       icon: 'lightning-bolt',  color: '#FF6B35' },
    { id: 'GETGYM',          label: 'GetGym',         icon: 'dumbbell',        color: '#9B59B6' },
    { id: 'OVERALL',         label: 'Overall',        icon: 'dumbbell',        color: '#2ECC71' },
    { id: 'BRAVES',          label: 'Braves',         icon: 'dumbbell',        color: '#E74C3C' },
    { id: 'SEVENPLAY',       label: 'SevenPlay',      icon: 'dumbbell',        color: '#F39C12' },
    { id: 'ACADEMIA_PADRAO', label: 'Ac. Padrão',     icon: 'weight-lifter',   color: '#3498DB' },
    { id: 'CONDOMINIO',      label: 'Condomínio',     icon: 'office-building', color: '#95A5A6' },
    { id: 'EM_CASA',         label: 'Em Casa',        icon: 'home-outline',    color: '#82E0AA' },
];

export default function SidebarPC({
    theme, isTemplateMode,
    anamneseData, isRaioxExpanded, onToggleRaiox,
    state, setters, alunoIsMenstruating, dbDeloadSynced,
    isCancelingDeload, handleCancelDeload, forceDeload,
    renderSettings,
    workoutTabs, selectedWorkoutTab, exercisesByDay,
    onSelectTab, onMoveTab, onAddTab, onRenameTab, onDuplicateTab, onDeleteTab,
    currentExercisesLength,
    isSyncingCargas, onMagicSync,
    alunoId, onViewWorkout,
    onAutoFill,
}) {
    const [envModalVisible, setEnvModalVisible] = useState(false);
    const [daysExpanded, setDaysExpanded] = useState(true);
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [renamingTab, setRenamingTab] = useState('');
    const [renameValue, setRenameValue] = useState('');

    const currentEnv = state.workoutEnvironment || 'UNIVERSAL';
    const currentEnvObj = ENVIRONMENTS.find(e => e.id === currentEnv) || ENVIRONMENTS[0];

    const toggleDays = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDaysExpanded(!daysExpanded);
    };

    return (
        <>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {!isTemplateMode && (
                    <RaioXCard
                        anamneseData={anamneseData}
                        isRaioxExpanded={isRaioxExpanded}
                        setIsRaioxExpanded={onToggleRaiox}
                        theme={theme}
                    />
                )}

                {!isTemplateMode && (
                    <MenstrualAlertCard
                        theme={theme} state={state} setters={setters}
                        alunoIsMenstruating={alunoIsMenstruating} dbDeloadSynced={dbDeloadSynced}
                        intensityMultiplier={state.intensityMultiplier}
                        isCancelingDeload={isCancelingDeload}
                        handleCancelDeload={handleCancelDeload}
                        forceDeload={forceDeload}
                    />
                )}

                {renderSettings()}

                {/* ─── DIAS DE TREINO — card expansível no estilo dos outros cards ─── */}
                <View style={[S.card, { backgroundColor: theme.surface },
                    Platform.select({
                        web: { boxShadow: theme.isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.07)' },
                        ios: { shadowColor: '#000', shadowOpacity: theme.isDark ? 0.3 : 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 5 } },
                        android: { elevation: 3 },
                    })
                ]}>
                    {/* Header clicável */}
                    <TouchableOpacity
                        style={[S.cardHeader, {
                            borderBottomWidth: daysExpanded ? 1 : 0,
                            borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        }]}
                        onPress={toggleDays}
                        activeOpacity={0.7}
                    >
                        <View style={S.cardHeaderLeft}>
                            <View style={[S.cardIconBox, { backgroundColor: theme.accent }]}>
                                <MaterialCommunityIcons name="calendar-multiselect" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                            </View>
                            <View>
                                <Text style={[S.cardTitle, { color: theme.text }]}>Dias de Treino</Text>
                                <Text style={[S.cardSubtitle, { color: theme.textSecondary }]}>
                                    {daysExpanded ? 'Toque para recolher' : `${workoutTabs.length} dia(s) · ${selectedWorkoutTab} ativo`}
                                </Text>
                            </View>
                        </View>
                        <View style={[S.chevronBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                            <MaterialCommunityIcons name={daysExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    {/* Lista de dias */}
                    {daysExpanded && (
                        <View>
                            {workoutTabs.map((tab, tabIndex) => {
                                const isSelected = selectedWorkoutTab === tab;
                                const exCount = (exercisesByDay[tab] || []).length;
                                return (
                                    <View key={tab} style={[S.tabRow, {
                                        backgroundColor: isSelected ? (theme.isDark ? 'rgba(255,255,255,0.06)' : theme.accent + '08') : 'transparent',
                                        borderLeftColor: isSelected ? theme.accent : 'transparent',
                                        borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                                        borderBottomWidth: tabIndex < workoutTabs.length - 1 ? 1 : 0,
                                    }]}>
                                        {/* Nome + contagem */}
                                        <TouchableOpacity style={{ flex: 1, paddingVertical: 4 }} onPress={() => onSelectTab(tab)}>
                                            <Text style={{ fontWeight: isSelected ? '900' : '600', color: isSelected ? theme.accent : theme.text, fontSize: 14 }}>{tab}</Text>
                                            <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>{exCount} ex.</Text>
                                        </TouchableOpacity>

                                        {/* Ícones de ação */}
                                        <View style={S.tabActions}>
                                            {/* Setas */}
                                            <View style={[S.arrowBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                                                <TouchableOpacity style={S.arrowBtn} onPress={() => onMoveTab(tab, 'up')} disabled={tabIndex === 0}>
                                                    <MaterialCommunityIcons name="arrow-up" size={13} color={tabIndex === 0 ? theme.textSecondary + '30' : theme.textSecondary} />
                                                </TouchableOpacity>
                                                <View style={{ width: 1, height: 14, backgroundColor: theme.border }} />
                                                <TouchableOpacity style={S.arrowBtn} onPress={() => onMoveTab(tab, 'down')} disabled={tabIndex === workoutTabs.length - 1}>
                                                    <MaterialCommunityIcons name="arrow-down" size={13} color={tabIndex === workoutTabs.length - 1 ? theme.textSecondary + '30' : theme.textSecondary} />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Renomear */}
                                            <TouchableOpacity style={[S.iconBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
                                                onPress={() => {
                                                setRenamingTab(tab);
                                                setRenameValue(tab);
                                                setRenameModalVisible(true);
                                            }}>
                                                <MaterialCommunityIcons name="pencil" size={13} color={theme.textSecondary} />
                                            </TouchableOpacity>

                                            {/* Duplicar */}
                                            <TouchableOpacity style={[S.iconBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
                                                onPress={() => onDuplicateTab(tab)}>
                                                <MaterialCommunityIcons name="content-copy" size={13} color={theme.textSecondary} />
                                            </TouchableOpacity>

                                            {/* Excluir */}
                                            <TouchableOpacity style={[S.iconBtn, { backgroundColor: 'rgba(255,59,48,0.08)', opacity: workoutTabs.length <= 1 ? 0.3 : 1 }]}
                                                onPress={() => onDeleteTab(tab)} disabled={workoutTabs.length <= 1}>
                                                <MaterialCommunityIcons name="trash-can" size={13} color="#FF3B30" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                            <TouchableOpacity
                                style={[S.addTab, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}
                                onPress={onAddTab}
                            >
                                <View style={[S.addTabIcon, { backgroundColor: theme.accent + '20' }]}>
                                    <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
                                </View>
                                <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700' }}>Adicionar Dia</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ─── AÇÕES RÁPIDAS ─── */}
                {!isTemplateMode && (
                    <View style={[S.card, { backgroundColor: theme.surface, marginTop: 0 },
                        Platform.select({
                            web: { boxShadow: theme.isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.07)' },
                            ios: { shadowColor: '#000', shadowOpacity: theme.isDark ? 0.3 : 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 5 } },
                            android: { elevation: 3 },
                        })
                    ]}>
                        {/* Header fixo */}
                        <View style={[S.cardHeader, { borderBottomWidth: 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                            <View style={S.cardHeaderLeft}>
                                <View style={[S.cardIconBox, { backgroundColor: theme.accent }]}>
                                    <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                                </View>
                                <View>
                                    <Text style={[S.cardTitle, { color: theme.text }]}>Ações Rápidas</Text>
                                    <Text style={[S.cardSubtitle, { color: theme.textSecondary }]}>Ferramentas do treino</Text>
                                </View>
                            </View>
                        </View>

                        {/* Ambiente */}
                        <TouchableOpacity
                            style={[S.actionRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderBottomWidth: 1 }]}
                            onPress={() => setEnvModalVisible(true)}
                        >
                            <View style={[S.actionIcon, { backgroundColor: currentEnvObj.color + '20' }]}>
                                <MaterialCommunityIcons name={currentEnvObj.icon} size={18} color={currentEnvObj.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[S.actionTitle, { color: theme.text }]}>Ambiente do Treino</Text>
                                <Text style={[S.actionDesc, { color: currentEnvObj.color, fontWeight: '700' }]}>{currentEnvObj.label}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary + '60'} />
                        </TouchableOpacity>

                        {/* Magic Sync */}
                        {currentExercisesLength > 0 && (
                            <TouchableOpacity
                                style={[S.actionRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderBottomWidth: 1 }]}
                                onPress={onMagicSync}
                                disabled={isSyncingCargas}
                            >
                                {isSyncingCargas ? (
                                    <View style={[S.actionIcon, { backgroundColor: theme.accent + '15' }]}>
                                        <ActivityIndicator size="small" color={theme.accent} />
                                    </View>
                                ) : (
                                    <View style={[S.actionIcon, { backgroundColor: theme.accent + '15' }]}>
                                        <MaterialCommunityIcons name="magic-staff" size={18} color={theme.accent} />
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={[S.actionTitle, { color: theme.accent }]}>Puxar Cargas</Text>
                                    <Text style={[S.actionDesc, { color: theme.textSecondary }]}>Preenche do histórico do aluno</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary + '60'} />
                            </TouchableOpacity>
                        )}

                        {/* Auto Substitutos */}
                        {currentExercisesLength > 0 && (
                            <TouchableOpacity
                                style={[S.actionRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderBottomWidth: 1 }]}
                                onPress={onAutoFill}
                            >
                                <View style={[S.actionIcon, { backgroundColor: theme.accent + '15' }]}>
                                    <MaterialCommunityIcons name="swap-horizontal" size={18} color={theme.accent} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[S.actionTitle, { color: theme.accent }]}>Auto Substitutos</Text>
                                    <Text style={[S.actionDesc, { color: theme.textSecondary }]}>Filtra por: {currentEnvObj.label}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary + '60'} />
                            </TouchableOpacity>
                        )}

                        {/* Ver treino */}
                        {alunoId && (
                            <TouchableOpacity style={S.actionRow} onPress={onViewWorkout}>
                                <View style={[S.actionIcon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                    <MaterialCommunityIcons name="eye-outline" size={18} color={theme.textSecondary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[S.actionTitle, { color: theme.text }]}>Ver Treino do Aluno</Text>
                                    <Text style={[S.actionDesc, { color: theme.textSecondary }]}>Prévia de como o aluno vê</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary + '60'} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* ─── MODAL RENAME DIA ─── */}
            <Modal visible={renameModalVisible} transparent animationType="fade" onRequestClose={() => setRenameModalVisible(false)}>
                <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setRenameModalVisible(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
                        <View style={[S.modalBox, { backgroundColor: theme.surface, padding: 24, width: 300 }]}>
                            <Text style={[S.modalTitle, { color: theme.text, marginBottom: 16 }]}>Renomear Dia</Text>
                            <TextInput
                                style={[{
                                    padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontWeight: '700',
                                    color: theme.text,
                                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    borderColor: theme.accent,
                                    outlineStyle: 'none',
                                    marginBottom: 16,
                                }]}
                                value={renameValue}
                                onChangeText={setRenameValue}
                                autoFocus
                                selectTextOnFocus
                                onSubmitEditing={() => {
                                    if (renameValue.trim()) { onRenameTab(renamingTab, renameValue.trim()); }
                                    setRenameModalVisible(false);
                                }}
                            />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}
                                    onPress={() => setRenameModalVisible(false)}>
                                    <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: theme.accent, alignItems: 'center' }}
                                    onPress={() => {
                                        if (renameValue.trim()) { onRenameTab(renamingTab, renameValue.trim()); }
                                        setRenameModalVisible(false);
                                    }}>
                                    <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }}>Salvar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ─── MODAL AMBIENTE ─── */}
            <Modal visible={envModalVisible} transparent animationType="fade" onRequestClose={() => setEnvModalVisible(false)}>
                <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setEnvModalVisible(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
                        <View style={[S.modalBox, { backgroundColor: theme.surface }]}>
                            <View style={[S.modalHeader, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}>
                                <Text style={[S.modalTitle, { color: theme.text }]}>Ambiente do Treino</Text>
                                <Text style={[S.modalSubtitle, { color: theme.textSecondary }]}>
                                    Filtra substitutos compatíveis com a academia
                                </Text>
                            </View>
                            {ENVIRONMENTS.map((env, idx) => {
                                const isSelected = currentEnv === env.id;
                                return (
                                    <TouchableOpacity
                                        key={env.id}
                                        style={[S.envRow, {
                                            backgroundColor: isSelected ? env.color + '12' : 'transparent',
                                            borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                            borderBottomWidth: idx < ENVIRONMENTS.length - 1 ? 1 : 0,
                                        }]}
                                        onPress={() => { setters.setWorkoutEnvironment(env.id); setEnvModalVisible(false); }}
                                    >
                                        <View style={[S.envIconBox, { backgroundColor: env.color + '20' }]}>
                                            <MaterialCommunityIcons name={env.icon} size={18} color={env.color} />
                                        </View>
                                        <Text style={[S.envLabel, { color: isSelected ? env.color : theme.text, fontWeight: isSelected ? '800' : '600' }]}>
                                            {env.label}
                                        </Text>
                                        {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color={env.color} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const S = StyleSheet.create({
    // Card base — mesmo estilo do RaioXCard
    card:          { borderRadius: 18, marginBottom: 16, overflow: 'hidden' },
    cardHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    cardHeaderLeft:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardIconBox:   { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardTitle:     { fontSize: 15, fontWeight: '800', marginBottom: 2 },
    cardSubtitle:  { fontSize: 11 },
    chevronBox:    { borderRadius: 8, padding: 5 },

    // Tabs
    tabRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderLeftWidth: 3, gap: 6 },
    tabActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    arrowBox:   { flexDirection: 'row', alignItems: 'center', borderRadius: 8, overflow: 'hidden' },
    arrowBtn:   { padding: 7 },
    iconBtn:    { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    addTab:   { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
    addTabIcon:{ width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

    // Ações
    actionRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    actionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    actionTitle:{ fontSize: 13, fontWeight: '700', marginBottom: 2 },
    actionDesc: { fontSize: 11, lineHeight: 14 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalBox:     { borderRadius: 20, width: 320, overflow: 'hidden' },
    modalHeader:  { padding: 20, paddingBottom: 14, borderBottomWidth: 1 },
    modalTitle:   { fontSize: 16, fontWeight: '900', marginBottom: 4 },
    modalSubtitle:{ fontSize: 12, lineHeight: 17 },
    envRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
    envIconBox:   { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    envLabel:     { flex: 1, fontSize: 14 },
});