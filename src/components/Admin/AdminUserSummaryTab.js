// src/components/Admin/AdminUserSummaryTab.js
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const formatToBRDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function AdminUserSummaryTab({
    theme,
    aluno,
    freshAluno,
    isWebPC,
    // Perfil
    handlePickImage, uploadingPhoto, photoUrl, isActiveUser,
    // Alertas IA
    studentAlerts, isAlertsExpanded, setIsAlertsExpanded, handleDismissAlert,
    // CRM
    isContactDelayed, lastContactDate, daysSinceContact, handleRegisterContactToday,
    weeklyChecks, handleToggleCheck, handleRemoveCheck, newCheckText, setNewCheckText, handleAddCheck,
    strategyNotes, setStrategyNotes, handleSaveStrategy, savingNotes,
    // Dashboard
    activeWorkouts, setActiveTab, navigation, handleAbrirRaioxCargas,
    isDietTabVisible, dietGoal, DIET_OPTIONS
}) {
    return (
        <View style={styles.tabContent}>
            {/* CABEÇALHO DO PERFIL */}
            <View style={[styles.profileHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer} activeOpacity={0.8}>
                    {uploadingPhoto ? (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border }]}><ActivityIndicator color={theme.accent} /></View>
                    ) : photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={[styles.avatarImage, { borderColor: theme.border }]} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <Text style={[styles.avatarText, { color: theme.accent }]}>{(aluno?.name || 'A').charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={[styles.editBadge, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="camera-plus" size={14} color="#000" /></View>
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: theme.text }]}>{aluno?.name || 'Aluno'}</Text>
                    <Text style={styles.profileEmail}>{aluno?.email || ''}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                        <View style={[styles.miniBadge, { backgroundColor: isActiveUser ? '#34C75922' : '#FF3B3022', borderColor: isActiveUser ? '#34C759' : '#FF3B30' }]}>
                            <Text style={{ color: isActiveUser ? '#34C759' : '#FF3B30', fontSize: 10, fontWeight: 'bold' }}>{isActiveUser ? 'ATIVO' : 'BLOQUEADO'}</Text>
                        </View>
                        <View style={[styles.miniBadge, { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}>
                            <Text style={{ color: theme.accent, fontSize: 10, fontWeight: 'bold' }}>{freshAluno?.currentXP || 0} XP</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ALERTAS DA IA */}
            {studentAlerts.length > 0 && (
                <View style={{ marginBottom: 25 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: isAlertsExpanded ? '#FF9500' : theme.border, borderRadius: 12, padding: 15, marginBottom: isAlertsExpanded ? 10 : 0 }} onPress={() => setIsAlertsExpanded(!isAlertsExpanded)} activeOpacity={0.8}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ backgroundColor: '#FF9500' + '20', padding: 8, borderRadius: 8 }}><MaterialCommunityIcons name="brain" size={20} color="#FF9500" /></View>
                            <View>
                                <Text style={{ color: '#FF9500', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>LABORATÓRIO DE IA</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{studentAlerts.length} aviso(s) de estagnação pendente(s)</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name={isAlertsExpanded ? "chevron-up" : "chevron-down"} size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {isAlertsExpanded && (
                        <View style={{ gap: 10 }}>
                            {studentAlerts.map(alert => (
                                <View key={alert.id} style={{ backgroundColor: theme.isDark ? '#2c1e0a' : '#fff5e6', borderWidth: 1, borderColor: '#FF9500', borderRadius: 12, padding: 15 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}><MaterialCommunityIcons name="alert-circle" size={16} color="#FF9500" /><Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>{alert.title}</Text></View>
                                        <TouchableOpacity onPress={() => handleDismissAlert(alert.id)} style={{ padding: 4, backgroundColor: theme.surface, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}><MaterialCommunityIcons name="check-bold" size={16} color={theme.accent} /></TouchableOpacity>
                                    </View>
                                    <Text style={{ color: theme.text, fontSize: 13, marginBottom: 12 }}>Foi detectada estagnação no exercício <Text style={{ fontWeight: 'bold' }}>{alert.exerciseName}</Text>.</Text>
                                    <View style={{ backgroundColor: theme.surface, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>SUGESTÃO DA IA:</Text>
                                        <Text style={{ color: theme.text, fontSize: 12, fontStyle: 'italic' }}>"{alert.message}"</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* 🔥 CRM DE ALINHAMENTO SEMANAL 🔥 */}
            <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: isContactDelayed ? '#FF3B30' : theme.accent, marginBottom: 20, borderWidth: 2 }]}>
                <View style={styles.dashCardHeader}>
                    <View style={[styles.iconBoxSmall, { backgroundColor: isContactDelayed ? '#FF3B3022' : theme.accent + '22' }]}>
                        <MaterialCommunityIcons name={isContactDelayed ? "alert" : "forum"} size={16} color={isContactDelayed ? '#FF3B30' : theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.dashCardTitle, { color: theme.text }]}>ALINHAMENTO SEMANAL</Text>
                        <Text style={{ color: isContactDelayed ? '#FF3B30' : theme.textSecondary, fontSize: 11, marginTop: 2, fontWeight: 'bold' }}>
                            {lastContactDate
                                ? (isContactDelayed ? `🚨 Atrasado! Sem contato há ${daysSinceContact} dias.` : `✅ Em dia. Último papo há ${daysSinceContact} dias.`)
                                : '🚨 Nunca conversaram!'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={{ backgroundColor: theme.bg, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
                        onPress={handleRegisterContactToday}
                    >
                        <Text style={{ color: theme.text, fontSize: 10, fontWeight: 'bold' }}>+ REGISTRAR HOJE</Text>
                    </TouchableOpacity>
                </View>

                {/* Seção de Checks Semanais */}
                <View style={{ marginTop: 15, marginBottom: 15 }}>
                    <Text style={[styles.dashCardSub, { color: theme.textSecondary, marginBottom: 10 }]}>PONTOS DE ALINHAMENTO:</Text>
                    {weeklyChecks.map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                            <TouchableOpacity onPress={() => handleToggleCheck(index)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <MaterialCommunityIcons
                                    name={item.resolved ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                                    size={20}
                                    color={item.resolved ? theme.accent : theme.textSecondary}
                                    style={{ marginRight: 10 }}
                                />
                                <Text style={{ color: theme.text, fontSize: 14, textDecorationLine: item.resolved ? 'line-through' : 'none' }}>
                                    {item.text}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveCheck(index)} style={{ padding: 5 }}>
                                <MaterialCommunityIcons name="close-circle-outline" size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <TextInput
                            style={[styles.inputArea, { flex: 1, minHeight: 40, paddingVertical: 8, paddingHorizontal: 10, marginRight: 10, color: theme.text, borderColor: theme.border }]}
                            placeholder="Adicionar novo ponto de alinhamento..."
                            placeholderTextColor={theme.textSecondary}
                            value={newCheckText}
                            onChangeText={setNewCheckText}
                            onSubmitEditing={handleAddCheck} 
                        />
                        <TouchableOpacity
                            style={[styles.saveBtnLg, { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.accent + '22', borderColor: theme.accent, borderWidth: 1 }]}
                            onPress={handleAddCheck}
                        >
                            <MaterialCommunityIcons name="plus" size={20} color={theme.accent} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TextInput
                    style={[styles.inputArea, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, minHeight: 100, padding: 15 }]}
                    multiline={true}
                    numberOfLines={4}
                    placeholder="Anotações de estratégia, dores, metas da semana..."
                    placeholderTextColor={theme.textSecondary}
                    value={strategyNotes}
                    onChangeText={setStrategyNotes}
                />

                <TouchableOpacity
                    style={[styles.saveBtnLg, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, marginTop: 10, flexDirection: 'row', gap: 8, height: 44 }]}
                    onPress={() => handleSaveStrategy()}
                    disabled={savingNotes}
                >
                    {savingNotes ? <ActivityIndicator color={theme.accent} /> : (
                        <>
                            <MaterialCommunityIcons name="content-save" size={16} color={theme.accent} />
                            <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 }}>SALVAR ESTRATÉGIA</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* DASHBOARD DO ALUNO */}
            <Text style={[styles.sectionLabel, { marginTop: 10, color: theme.textSecondary }]}>DASHBOARD DO ALUNO</Text>
            <View style={{ flexDirection: isWebPC ? 'row' : 'column', flexWrap: isWebPC ? 'wrap' : 'nowrap', gap: 15, width: '100%' }}>

                {/* TREINO ATUAL */}
                <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: theme.border, width: isWebPC ? '48%' : '100%' }]}>
                    <View style={styles.dashCardHeader}>
                        <View style={[styles.iconBoxSmall, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="weight-lifter" size={16} color={theme.accent} /></View>
                        <Text style={[styles.dashCardTitle, { color: theme.text }]}>TREINO ATUAL</Text>
                    </View>
                    {activeWorkouts.length > 0 ? (
                        <View style={{ marginBottom: 15 }}>
                            <Text style={[styles.dashCardValue, { color: theme.accent }]} numberOfLines={1}>{activeWorkouts[0].name}</Text>
                            <Text style={styles.dashCardSub}>Início: {activeWorkouts[0].startDate ? formatToBRDate(activeWorkouts[0].startDate) : 'Não definido'}</Text>
                        </View>
                    ) : (
                        <Text style={[styles.dashCardSub, { marginBottom: 15 }]}>Nenhum treino ativo no momento.</Text>
                    )}
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={[styles.dashBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setActiveTab('TREINOS')}>
                        <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>ACESSAR TREINOS</Text>
                    </TouchableOpacity>
                </View>

                {/* AVALIAÇÕES E RAIO-X */}
                <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: theme.border, width: isWebPC ? '48%' : '100%' }]}>
                    <View style={styles.dashCardHeader}>
                        <View style={[styles.iconBoxSmall, { backgroundColor: '#34C75922' }]}><MaterialCommunityIcons name="camera-front-variant" size={16} color="#34C759" /></View>
                        <Text style={[styles.dashCardTitle, { color: theme.text }]}>AVALIAÇÕES</Text>
                    </View>
                    <View style={{ gap: 10 }}>
                        <TouchableOpacity style={[styles.dashActionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminStudentCheckins', { alunoId: String((freshAluno || aluno).id), alunoName: String((freshAluno || aluno).name), alunoGender: String((freshAluno || aluno).gender || ''), aluno: freshAluno || aluno })}>
                            <MaterialCommunityIcons name="camera-account" size={16} color="#34C759" />
                            <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>Ver Check-ins</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dashActionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={handleAbrirRaioxCargas}>
                            <MaterialCommunityIcons name="weight-lifter" size={16} color={theme.accent} />
                            <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>Raio-X de Cargas</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }} />
                </View>

                {/* NUTRIÇÃO */}
                <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: theme.border, width: isWebPC ? '48%' : '100%' }]}>
                    <View style={styles.dashCardHeader}>
                        <View style={[styles.iconBoxSmall, { backgroundColor: '#FF3B3022' }]}><MaterialCommunityIcons name="food-apple" size={16} color="#FF3B30" /></View>
                        <Text style={[styles.dashCardTitle, { color: theme.text }]}>NUTRIÇÃO</Text>
                    </View>
                    <View style={{ marginBottom: 15 }}>
                        <Text style={[styles.dashCardValue, { color: theme.text }]}>{isDietTabVisible ? 'Aba Liberada' : 'Aba Oculta'}</Text>
                        <Text style={styles.dashCardSub} numberOfLines={1}>Base: {DIET_OPTIONS.find(o => o.id === dietGoal)?.label || 'Personalizada'}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={[styles.dashBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setActiveTab('DIETA_IA')}>
                        <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>GERENCIAR DIETA</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tabContent: { width: '100%', paddingBottom: 20 },
    profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
    avatarContainer: { position: 'relative', marginRight: 15 },
    avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    avatarImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 1 },
    avatarText: { fontWeight: '900', fontSize: 28 },
    editBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 20, fontWeight: '900' },
    profileEmail: { color: '#888', fontSize: 12, marginTop: 2 },
    miniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    dashCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 15 },
    dashCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    dashCardTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    dashCardValue: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
    dashCardSub: { color: '#888', fontSize: 11, fontWeight: 'bold' },
    dashBtn: { padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', marginTop: 15 },
    dashActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 10 },
    iconBoxSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    saveBtnLg: { borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    inputArea: { borderRadius: 12, borderWidth: 1, fontSize: 13, textAlignVertical: 'top' },
    sectionLabel: { fontWeight: '900', marginBottom: 15, fontSize: 12, letterSpacing: 1 }
});