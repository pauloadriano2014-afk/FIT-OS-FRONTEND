// src/components/Admin/AdminUserSystem.js — v2
// v2: card de MÓDULOS DO ALUNO — coach parceiro define treino/dieta/ambos
import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Switch,
    TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── OPÇÕES DE MÓDULO ────────────────────────────────────────────────────────
const MODULE_OPTIONS = [
    {
        value: 'TREINO',
        label: 'Treino',
        icon:  'dumbbell',
        color: '#32ADE6',
        desc:  'Acesso às fichas de treino e exercícios',
    },
    {
        value: 'DIETA',
        label: 'Dieta',
        icon:  'food-apple',
        color: '#34C759',
        desc:  'Acesso ao plano alimentar e substituições',
    },
    {
        value: 'AMBOS',
        label: 'Treino + Dieta',
        icon:  'trophy',
        color: '#FFCC00',
        desc:  'Acesso completo a treino e dieta',
    },
];

// Quais módulos cada coachPlan pode oferecer
const ALLOWED_BY_PLAN = {
    PERSONAL:      ['TREINO'],
    NUTRICIONISTA: ['DIETA'],
    ELITE:         ['TREINO', 'DIETA', 'AMBOS'],
};

export default function AdminUserSystem({
    theme, aluno, freshAluno,
    isDietTabVisible, handleToggleDietTab,
    isRunningModule, handleToggleRunningModule,
    setIsRunningModalVisible,
    nextCheckInDate, handleCheckInDateChange, handleSaveCheckInDate,
    disableCheckIn, handleToggleDisableCheckIn,
    evaluationUrl, setEvaluationUrl, handleSaveEvaluation,
    handleRequestAnamneseUpdate,
    vipContents, userAccess, loadingPaflix, handleToggleAccess,
    handleDeleteUser, handleToggleStatus, isActiveUser,
    // ← v2
    studentModules, savingModules, coachPlan, handleSaveStudentModules,
    isMaster,
}) {
    const allowedModules = ALLOWED_BY_PLAN[coachPlan] ?? ['TREINO'];

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

            {/* ── MÓDULOS DO ALUNO — só para coaches parceiros ← v2 ─── */}
            {!isMaster && (
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.accent + '40' }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: theme.accent + '18' }]}>
                            <MaterialCommunityIcons name="puzzle-outline" size={20} color={theme.accent} />
                        </View>
                        <View style={{ flex: 1, paddingLeft: 12 }}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>MÓDULOS DO ALUNO</Text>
                            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                                O que este aluno tem acesso no app
                            </Text>
                        </View>
                        {savingModules && <ActivityIndicator size="small" color={theme.accent} />}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        {MODULE_OPTIONS.map(opt => {
                            const isAllowed  = allowedModules.includes(opt.value);
                            const isSelected = studentModules === opt.value;
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[
                                        styles.moduleBtn,
                                        {
                                            borderColor:     isSelected ? opt.color : theme.border,
                                            backgroundColor: isSelected ? opt.color + '15' : theme.bg,
                                            opacity:         isAllowed ? 1 : 0.35,
                                        },
                                    ]}
                                    onPress={() => isAllowed && !savingModules && handleSaveStudentModules(opt.value)}
                                    disabled={!isAllowed || savingModules}
                                    activeOpacity={0.7}
                                >
                                    <MaterialCommunityIcons
                                        name={opt.icon}
                                        size={20}
                                        color={isSelected ? opt.color : theme.textSecondary}
                                    />
                                    <Text style={{
                                        fontSize:   11,
                                        fontWeight: '900',
                                        color:      isSelected ? opt.color : theme.textSecondary,
                                        marginTop:  4,
                                        textAlign:  'center',
                                    }}>
                                        {opt.label}
                                    </Text>
                                    {isSelected && (
                                        <View style={[styles.selectedDot, { backgroundColor: opt.color }]} />
                                    )}
                                    {!isAllowed && (
                                        <MaterialCommunityIcons name="lock-outline" size={10} color={theme.textSecondary} style={{ marginTop: 2 }} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {coachPlan === 'PERSONAL' && (
                        <View style={[styles.planNote, { backgroundColor: '#32ADE610', borderColor: '#32ADE630' }]}>
                            <MaterialCommunityIcons name="information-outline" size={12} color="#32ADE6" />
                            <Text style={{ color: '#32ADE6', fontSize: 11, flex: 1 }}>
                                Seu plano Personal só permite módulo de treino. Para liberar dieta, entre em contato com a PA ELITE TEAM.
                            </Text>
                        </View>
                    )}
                    {coachPlan === 'NUTRICIONISTA' && (
                        <View style={[styles.planNote, { backgroundColor: '#34C75910', borderColor: '#34C75930' }]}>
                            <MaterialCommunityIcons name="information-outline" size={12} color="#34C759" />
                            <Text style={{ color: '#34C759', fontSize: 11, flex: 1 }}>
                                Seu plano Nutricionista só permite módulo de dieta.
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* ── CHECK-IN ──────────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: '#FF950018' }]}>
                        <MaterialCommunityIcons name="camera-timer" size={20} color="#FF9500" />
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text, paddingLeft: 12 }]}>CHECK-IN DE FOTOS</Text>
                </View>
                <View style={{ marginTop: 12, gap: 10 }}>
                    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Bloquear check-in</Text>
                        <Switch
                            value={disableCheckIn}
                            onValueChange={handleToggleDisableCheckIn}
                            trackColor={{ false: theme.border, true: '#FF3B3060' }}
                            thumbColor={disableCheckIn ? '#FF3B30' : theme.textSecondary}
                        />
                    </View>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>PRÓXIMA DATA</Text>
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, { flex: 1, backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                            placeholder="DD/MM/AAAA"
                            placeholderTextColor={theme.textSecondary}
                            value={nextCheckInDate}
                            onChangeText={handleCheckInDateChange}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                            onPress={handleSaveCheckInDate}
                        >
                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>SALVAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ── MÓDULOS MASTER (dietModule, runningModule) ───────────── */}
            {isMaster && (
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: theme.accent + '18' }]}>
                            <MaterialCommunityIcons name="puzzle-outline" size={20} color={theme.accent} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text, paddingLeft: 12 }]}>MÓDULOS EXTRAS</Text>
                    </View>
                    <View style={{ marginTop: 12, gap: 12 }}>
                        <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                            <View>
                                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Aba de Dieta</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>Exibe a aba de dieta no app do aluno</Text>
                            </View>
                            <Switch
                                value={isDietTabVisible}
                                onValueChange={handleToggleDietTab}
                                trackColor={{ false: theme.border, true: theme.accent + '60' }}
                                thumbColor={isDietTabVisible ? theme.accent : theme.textSecondary}
                            />
                        </View>
                        <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                            <View>
                                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Módulo de Corrida</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>Libera protocolo de corrida personalizado</Text>
                            </View>
                            <Switch
                                value={isRunningModule}
                                onValueChange={handleToggleRunningModule}
                                trackColor={{ false: theme.border, true: theme.accent + '60' }}
                                thumbColor={isRunningModule ? theme.accent : theme.textSecondary}
                            />
                        </View>
                        {isRunningModule && (
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.accent, alignSelf: 'flex-start', paddingHorizontal: 16 }]}
                                onPress={() => setIsRunningModalVisible(true)}
                            >
                                <MaterialCommunityIcons name="run-fast" size={14} color="#000" />
                                <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>CONFIGURAR PROTOCOLO</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* ── ANAMNESE ─────────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: '#BF5AF218' }]}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#BF5AF2" />
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text, paddingLeft: 12 }]}>ANAMNESE</Text>
                </View>
                <View style={{ marginTop: 12, gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: theme.accent, alignSelf: 'flex-start', paddingHorizontal: 16 }]}
                        onPress={() => handleRequestAnamneseUpdate('SIMPLE')}
                    >
                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>SOLICITAR (SÓ TREINO)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: '#BF5AF2', alignSelf: 'flex-start', paddingHorizontal: 16 }]}
                        onPress={() => handleRequestAnamneseUpdate('FULL')}
                    >
                        <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>SOLICITAR (TREINO + DIETA)</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── LINK DE AVALIAÇÃO ─────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: '#FF3B3018' }]}>
                        <MaterialCommunityIcons name="link-variant" size={20} color="#FF3B30" />
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text, paddingLeft: 12 }]}>LINK DE AVALIAÇÃO</Text>
                </View>
                <View style={{ marginTop: 12, gap: 8 }}>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                        placeholder="https://..."
                        placeholderTextColor={theme.textSecondary}
                        value={evaluationUrl}
                        onChangeText={setEvaluationUrl}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: theme.accent, alignSelf: 'flex-start', paddingHorizontal: 16 }]}
                        onPress={handleSaveEvaluation}
                    >
                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>SALVAR LINK</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── ACESSO VIP ────────────────────────────────────────────── */}
            {vipContents.length > 0 && (
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFCC0018' }]}>
                            <MaterialCommunityIcons name="star-outline" size={20} color="#FFCC00" />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text, paddingLeft: 12 }]}>CONTEÚDO VIP</Text>
                    </View>
                    {loadingPaflix ? (
                        <ActivityIndicator color={theme.accent} style={{ marginTop: 12 }} />
                    ) : (
                        <View style={{ marginTop: 12, gap: 8 }}>
                            {vipContents.map(content => {
                                const hasAccess = userAccess.includes(content.id);
                                return (
                                    <View key={content.id} style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                                        <Text style={{ color: theme.text, fontSize: 13, flex: 1 }} numberOfLines={1}>{content.title}</Text>
                                        <Switch
                                            value={hasAccess}
                                            onValueChange={() => handleToggleAccess(content.id, hasAccess)}
                                            trackColor={{ false: theme.border, true: theme.accent + '60' }}
                                            thumbColor={hasAccess ? theme.accent : theme.textSecondary}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            )}

            {/* ── ZONA DE RISCO ─────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: '#FF3B3010', borderColor: '#FF3B3040' }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: '#FF3B3020' }]}>
                        <MaterialCommunityIcons name="alert-outline" size={20} color="#FF3B30" />
                    </View>
                    <Text style={[styles.cardTitle, { color: '#FF3B30', paddingLeft: 12 }]}>ZONA DE RISCO</Text>
                </View>
                <View style={{ marginTop: 12, gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: isActiveUser ? '#FF950020' : '#34C75920', borderWidth: 1, borderColor: isActiveUser ? '#FF9500' : '#34C759', alignSelf: 'flex-start', paddingHorizontal: 16 }]}
                        onPress={handleToggleStatus}
                    >
                        <MaterialCommunityIcons name={isActiveUser ? 'account-off-outline' : 'account-check-outline'} size={14} color={isActiveUser ? '#FF9500' : '#34C759'} />
                        <Text style={{ color: isActiveUser ? '#FF9500' : '#34C759', fontWeight: '900', fontSize: 12 }}>
                            {isActiveUser ? 'INATIVAR ALUNO' : 'REATIVAR ALUNO'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: '#FF3B3020', borderWidth: 1, borderColor: '#FF3B30', alignSelf: 'flex-start', paddingHorizontal: 16 }]}
                        onPress={handleDeleteUser}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={14} color="#FF3B30" />
                        <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 12 }}>EXCLUIR PERMANENTEMENTE</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    card:       { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cardTitle:  { fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
    cardSub:    { fontSize: 11, marginTop: 2 },
    label:      { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
    row:        { flexDirection: 'row', gap: 8 },
    input:      { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13 },
    saveBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
    // v2: módulos
    moduleBtn:  { flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 2, gap: 4, position: 'relative' },
    selectedDot:{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
    planNote:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 8 },
});
