// src/components/AdminUserSystem.js

import React, { createElement, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, TextInput, Linking, Platform, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const PLAN_AUTO_DAYS = { PREMIUM: 14, PERFORMANCE: 30, standard: 30, LOW_COST: 30, FICHA_8S: 56, FICHAS: 56, CHALLENGE_21: 21 };
const DIET_OPTIONS = [
    { id: 'NONE', label: '🚫 Ocultar Botão', desc: 'Aluno não verá a sugestão alimentar.' },
    { id: 'WEIGHT_LOSS', label: '📉 Definição / Emagrecimento', desc: 'Foco em secar (1200 a 1500 kcal)' },
    { id: 'HYPERTROPHY_M', label: '💪 Volume Muscular (Homem)', desc: 'Foco em crescer (2000 a 2500 kcal)' },
    { id: 'HYPERTROPHY_F', label: '🍑 Volume Muscular (Mulher)', desc: 'Foco em perna/glúteo (1500 a 2000 kcal)' }
];

const formatToBRDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

export default function AdminUserSystem({
    currentTab, theme, navigation, aluno, userPlan, isActiveUser, handleToggleStatus,
    disableCheckIn, handleToggleDisableCheckIn,
    nextCheckInDate, handleCheckInDateChange, handleSaveCheckInDate,
    evaluationUrl, setEvaluationUrl, handleSaveEvaluation, handleDeleteUser,
    activeWorkouts, setActiveTab, handleAbrirRaioxCargas,
    dietGoal, setDietGoal, handleSaveDietGoal, isDietTabVisible, handleToggleDietTab, savingDiet
}) {

    const autoDays = PLAN_AUTO_DAYS[userPlan] || 14;
    const isCyclePlan = ['FICHA_8S', 'FICHAS', 'CHALLENGE_21'].includes(userPlan);

    const [semaforoConfig, setSemaforoConfig] = useState({ color: theme.border, icon: 'clock-outline', text: 'Calculando status...', bg: theme.bg });

    useEffect(() => {
        if (!nextCheckInDate || disableCheckIn) {
            setSemaforoConfig({ color: '#888', icon: disableCheckIn ? 'bell-off-outline' : 'calendar-remove', text: disableCheckIn ? 'Cobrança desativada para este aluno.' : 'Sem data definida.', bg: theme.surface });
            return;
        }

        const parts = nextCheckInDate.split('/');
        if (parts.length !== 3) return;
        const targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
        targetDate.setHours(0,0,0,0);
        const today = new Date(); today.setHours(0,0,0,0);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

        if (diffDays < 0) setSemaforoConfig({ color: theme.isDark ? '#FFF' : '#000', icon: 'alert-decagram', text: `Atrasado há ${Math.abs(diffDays)} dia(s)`, bg: theme.isDark ? '#222' : '#E5E5E5' });
        else if (diffDays === 0) setSemaforoConfig({ color: '#FF3B30', icon: 'bell-ring', text: 'É HOJE! Cobrança ativa no app do aluno.', bg: '#FF3B3022' });
        else if (diffDays <= 3) setSemaforoConfig({ color: '#FF3B30', icon: 'timer-sand', text: `Atenção: Faltam apenas ${diffDays} dias!`, bg: '#FF3B3022' });
        else if (diffDays <= 7) setSemaforoConfig({ color: '#FF9500', icon: 'calendar-clock', text: `Faltam ${diffDays} dias para o envio.`, bg: '#FF950022' });
        else setSemaforoConfig({ color: '#32ADE6', icon: 'shield-check', text: `Faltam ${diffDays} dias. Aluno no prazo.`, bg: '#32ADE622' });
    }, [nextCheckInDate, disableCheckIn]);

    // ==========================================
    // ABA: RESUMO (DASHBOARD)
    // ==========================================
    if (currentTab === 'RESUMO') {
        const isWebPC = Platform.OS === 'web' && window.innerWidth > 768;
        return (
            <View>
                <Text style={[styles.sectionLabel, { marginTop: 10 }]}>DASHBOARD DO ALUNO</Text>
                <View style={{ flexDirection: isWebPC ? 'row' : 'column', flexWrap: 'wrap', gap: 15 }}>
                    
                    {/* TREINO ATUAL */}
                    <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.dashCardHeader}>
                            <View style={[styles.iconBoxSmall, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="weight-lifter" size={16} color={theme.accent}/></View>
                            <Text style={[styles.dashCardTitle, { color: theme.text }]}>TREINO ATUAL</Text>
                        </View>
                        {activeWorkouts && activeWorkouts.length > 0 ? (
                            <View>
                                <Text style={[styles.dashCardValue, { color: theme.accent }]} numberOfLines={1}>{activeWorkouts[0].name}</Text>
                                <Text style={styles.dashCardSub}>Início: {activeWorkouts[0].startDate ? formatToBRDate(activeWorkouts[0].startDate) : 'Não definido'}</Text>
                            </View>
                        ) : (
                            <Text style={styles.dashCardSub}>Nenhum treino ativo no momento.</Text>
                        )}
                        <TouchableOpacity style={[styles.dashBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setActiveTab('TREINOS')}>
                            <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>ACESSAR TREINOS</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ATALHOS RÁPIDOS */}
                    <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.dashCardHeader}>
                            <View style={[styles.iconBoxSmall, { backgroundColor: '#34C75922' }]}><MaterialCommunityIcons name="lightning-bolt" size={16} color="#34C759"/></View>
                            <Text style={[styles.dashCardTitle, { color: theme.text }]}>ATALHOS RÁPIDOS</Text>
                        </View>
                        <View style={{ gap: 10, marginTop: 'auto' }}>
                            <TouchableOpacity style={[styles.dashActionBtn, { backgroundColor: theme.bg, borderColor: theme.border, justifyContent: 'center' }]} onPress={() => navigation.navigate('AdminStudentCheckins', { alunoId: String(aluno.id), alunoName: String(aluno.name) })}>
                                <MaterialCommunityIcons name="camera-account" size={16} color="#34C759" />
                                <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>Gerenciar Check-ins</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* NUTRIÇÃO */}
                    <View style={[styles.dashCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.dashCardHeader}>
                            <View style={[styles.iconBoxSmall, { backgroundColor: '#FF3B3022' }]}><MaterialCommunityIcons name="food-apple" size={16} color="#FF3B30"/></View>
                            <Text style={[styles.dashCardTitle, { color: theme.text }]}>NUTRIÇÃO</Text>
                        </View>
                        <Text style={[styles.dashCardValue, { color: theme.text }]}>{isDietTabVisible ? 'Aba Liberada' : 'Aba Oculta'}</Text>
                        <Text style={styles.dashCardSub} numberOfLines={1}>Base: {DIET_OPTIONS.find(o => o.id === dietGoal)?.label || 'Personalizada'}</Text>
                        <TouchableOpacity style={[styles.dashBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setActiveTab('DIETA_IA')}>
                            <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>GERENCIAR DIETA</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // ==========================================
    // ABA: AVALIACOES (FOTOS E CANVA)
    // ==========================================
    if (currentTab === 'AVALIACOES') {
        return (
            <View style={{ paddingBottom: 100 }}> {/* 🔥 AQUI FICA A CORREÇÃO DO SCROLL DA TELA AVALIAÇÃO 🔥 */}
                <Text style={[styles.sectionLabel, {marginTop: 20}]}>FERRAMENTAS DE ACOMPANHAMENTO</Text>
                
                <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminStudentCheckins', { alunoId: String(aluno.id), alunoName: String(aluno.name) })}>
                    <View style={[styles.iconBox, {backgroundColor: 'rgba(52, 199, 89, 0.15)'}]}><MaterialCommunityIcons name="camera-front-variant" size={20} color="#34C759" /></View>
                    <Text style={[styles.actionText, { color: theme.text }]}>Gerenciar Check-ins do Aluno</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminEvolution', { alunoId: String(aluno.id), alunoName: String(aluno.name), alunoBirthDate: String(aluno.birthDate || ''), alunoGender: String(aluno.gender || '') })}>
                    <View style={[styles.iconBox, {backgroundColor: 'rgba(50, 173, 230, 0.15)'}]}><MaterialCommunityIcons name="chart-line" size={20} color="#32ADE6" /></View>
                    <Text style={[styles.actionText, { color: theme.text }]}>Ver Gráficos de Evolução</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <Text style={[styles.sectionLabel, {marginTop: 30, color: theme.accent}]}>CONFIGURAÇÃO DE FOTOS (CHECK-IN)</Text>
                
                <View style={[styles.premiumCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
                        <View style={{flex: 1, paddingRight: 15}}>
                            <Text style={{color: theme.text, fontWeight: '900', fontSize: 13, marginBottom: 4}}>Bloquear Cobrança de Fotos</Text>
                            <Text style={{color: theme.textSecondary, fontSize: 11, lineHeight: 16}}>Oculta os avisos no app do aluno e desativa a pulsação do botão.</Text>
                        </View>
                        <Switch value={disableCheckIn} onValueChange={handleToggleDisableCheckIn} trackColor={{ false: theme.border, true: '#FF3B30' }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (disableCheckIn ? '#FFF' : '#888')} />
                    </View>

                    <View style={{ padding: 20 }}>
                        <View style={[styles.statusBadge, { backgroundColor: semaforoConfig.bg, borderColor: semaforoConfig.color }]}>
                            <MaterialCommunityIcons name={semaforoConfig.icon} size={24} color={semaforoConfig.color} />
                            <View style={{flex: 1, marginLeft: 12}}>
                                <Text style={{color: semaforoConfig.color, fontSize: 9, fontWeight: '900', letterSpacing: 1}}>STATUS DA AVALIAÇÃO FÍSICA</Text>
                                <Text style={{color: semaforoConfig.color, fontSize: 14, fontWeight: 'bold', marginTop: 2}}>{semaforoConfig.text}</Text>
                            </View>
                        </View>

                        <Text style={{color: theme.text, fontSize: 11, fontWeight: '900', marginBottom: 8, marginTop: 20}}>DATA OBRIGATÓRIA DA FOTO:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {Platform.OS === 'web' ? createElement('input', { type: 'date', value: nextCheckInDate && nextCheckInDate.length === 10 ? nextCheckInDate.split('/').reverse().join('-') : '', onChange: (e) => { const val = e.target.value; if(val) { const [y, m, d] = val.split('-'); handleCheckInDateChange(`${d}/${m}/${y}`); } else handleCheckInDateChange(''); }, style: { flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, outline: 'none', fontSize: '14px', fontFamily: 'inherit', fontWeight: 'bold' } }) : (
                                <TextInput style={[styles.inputLarge, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="DD/MM/AAAA" placeholderTextColor={theme.textSecondary} value={nextCheckInDate} onChangeText={handleCheckInDateChange} keyboardType="numeric" maxLength={10} />
                            )}
                            <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: theme.accent, width: 54 }]} onPress={handleSaveCheckInDate}><MaterialCommunityIcons name="check-bold" size={24} color={theme.isDark ? '#000' : '#FFF'} /></TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[styles.quickReleaseBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => { const today = new Date(); handleCheckInDateChange(`${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`); const msg = "Data definida para HOJE. Clique no botão Verde para salvar."; Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Atenção", msg); }}>
                            <MaterialCommunityIcons name="flash" size={18} color={theme.accent} />
                            <Text style={{color: theme.text, fontWeight: '900', fontSize: 11, letterSpacing: 0.5}}>PREENCHER DATA COM HOJE</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={[styles.sectionLabel, {marginTop: 30, color: theme.accent}]}>AVALIAÇÃO EM PDF (GOOGLE DRIVE)</Text>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 15 }]}>
                    <Text style={[styles.sectionSubDesc, { marginBottom: 10 }]}>Cole o link público do Google Drive com a avaliação do Canva.</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TextInput style={[styles.inputPdf, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, flex: 1 }]} placeholder="https://drive.google.com/..." placeholderTextColor={theme.textSecondary} value={evaluationUrl} onChangeText={setEvaluationUrl} autoCapitalize="none" />
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSaveEvaluation}><MaterialCommunityIcons name="content-save" size={20} color={theme.isDark ? '#000' : '#FFF'} /></TouchableOpacity>
                    </View>

                    {evaluationUrl ? (
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 8, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }} onPress={() => Linking.openURL(evaluationUrl)}>
                                <MaterialCommunityIcons name="eye" size={16} color={theme.text} /><Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>VER PDF ATUAL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,59,48,0.1)', borderWidth: 1, borderColor: '#FF3B30' }} onPress={() => { setEvaluationUrl(''); const msg = "Link removido da caixa. Clique em Salvar para confirmar no banco."; Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Aviso", msg); }}>
                                <MaterialCommunityIcons name="trash-can" size={16} color="#FF3B30" /><Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: 'bold' }}>LIMPAR</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            </View>
        );
    }

    // ==========================================
    // ABA: DIETA E IA
    // ==========================================
    if (currentTab === 'DIETA_IA') {
        return (
            <View style={{ paddingBottom: 100 }}>
                <Text style={[styles.sectionLabel, {color: theme.accent, marginTop: 20}]}>LABORATÓRIO NUTRICIONAL (IA)</Text>
                <Text style={[styles.sectionSubDesc, {marginBottom: 15}]}>Gerencie a visibilidade e a montagem do plano alimentar deste aluno.</Text>

                <View style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 15 }]}>
                    <View style={[styles.iconBox, { backgroundColor: theme.bg }]}><MaterialCommunityIcons name="food-apple" size={24} color={isDietTabVisible ? theme.accent : theme.textSecondary} /></View>
                    <View style={{ flex: 1, marginLeft: 15, paddingRight: 10 }}>
                        <Text style={[styles.accessTitle, { color: theme.text }]}>Liberar Aba "Dieta" no App</Text>
                        <Text style={styles.accessCategory}>Se ativado, a maçã ficará visível no celular do aluno.</Text>
                    </View>
                    <Switch value={isDietTabVisible} onValueChange={handleToggleDietTab} trackColor={{ false: '#333', true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (isDietTabVisible ? '#000' : '#888')} />
                </View>

                <TouchableOpacity style={[styles.aiDietBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]} onPress={() => navigation.navigate('AdminDietScreen', { aluno: aluno, alunoId: aluno.id })}>
                    <View style={[styles.iconBox, {backgroundColor: theme.accent + '22'}]}><MaterialCommunityIcons name="view-dashboard-edit-outline" size={22} color={theme.accent} /></View>
                    <View style={{flex: 1, marginLeft: 15}}>
                        <Text style={{color: theme.accent, fontWeight: '900', fontSize: 14, letterSpacing: 0.5}}>ABRIR MESA DE OPERAÇÕES</Text>
                        <Text style={{color: theme.textSecondary, fontSize: 11, marginTop: 2}}>Montar dieta com Tabela TACO e Macros</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
                </TouchableOpacity>

                <View style={[styles.premiumCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 15 }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                        <View style={[styles.iconBox, {backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, width: 36, height: 36, borderRadius: 18}]}><MaterialCommunityIcons name="clipboard-text-outline" size={18} color={theme.textSecondary} /></View>
                        <View style={{flex: 1}}>
                            <Text style={[styles.cardTitle, {color: theme.text}]}>Estratégia Básica (Fallback)</Text>
                            <Text style={{color: theme.textSecondary, fontSize: 11}}>Sugestão genérica em PDF para alunos que não possuem a dieta prescrita na Mesa de Operações.</Text>
                        </View>
                    </View>
                    <View style={{ padding: 20 }}>
                        {DIET_OPTIONS.map(opt => (
                            <TouchableOpacity key={opt.id} style={{flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: dietGoal === opt.id ? theme.accent : theme.border, backgroundColor: dietGoal === opt.id ? theme.accent + '15' : theme.bg, marginBottom: 10}} onPress={() => setDietGoal(opt.id)} disabled={userPlan === 'CHALLENGE_21'} >
                                <MaterialCommunityIcons name={dietGoal === opt.id ? "radiobox-marked" : "radiobox-blank"} size={20} color={dietGoal === opt.id ? theme.accent : theme.textSecondary} />
                                <View style={{flex: 1, marginLeft: 10}}>
                                    <Text style={{color: dietGoal === opt.id ? theme.accent : theme.text, fontWeight: 'bold', fontSize: 13}}>{opt.label}</Text>
                                    <Text style={{color: theme.textSecondary, fontSize: 11, marginTop: 2}}>{opt.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {userPlan !== 'CHALLENGE_21' && (
                            <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, width: '100%', marginTop: 10, flexDirection: 'row', gap: 8, height: 48 }]} onPress={handleSaveDietGoal} disabled={savingDiet}>
                                {savingDiet ? <ActivityIndicator color={theme.text} /> : (<><MaterialCommunityIcons name="content-save" size={18} color={theme.text} /><Text style={{color: theme.text, fontWeight: '900', fontSize: 12, letterSpacing: 0.5}}>SALVAR ESTRATÉGIA BÁSICA</Text></>)}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    // ==========================================
    // ABA: SISTEMA E RISCO
    // ==========================================
    if (currentTab === 'SISTEMA') {
        return (
            <View style={{ paddingBottom: 100 }}> {/* 🔥 Correção de Scroll aqui também 🔥 */}
                <Text style={[styles.sectionLabel, {marginTop: 20, color: '#FF3B30'}]}>ZONA DE RISCO E SISTEMA</Text>
                
                <View style={[styles.riskCard, { backgroundColor: theme.surface, borderColor: '#FF3B30' }]}>
                    <View style={[styles.switchRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={{flex: 1, paddingRight: 15}}>
                            <Text style={{color: isActiveUser ? theme.text : '#FF3B30', fontWeight: '900', fontSize: 13, marginBottom: 4}}>
                                Status de Acesso: {isActiveUser ? "ATIVO" : "BLOQUEADO"}
                            </Text>
                            <Text style={{color: theme.textSecondary, fontSize: 11, lineHeight: 16}}>
                                {isActiveUser ? "O aluno consegue logar e usar o app normalmente." : "O aluno será deslogado e impedido de acessar o app."}
                            </Text>
                        </View>
                        <Switch value={isActiveUser} onValueChange={handleToggleStatus} trackColor={{ false: theme.border, true: '#34C759' }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (isActiveUser ? '#FFF' : '#888')} />
                    </View>

                    <View style={{ padding: 20 }}>
                        <Text style={{color: theme.textSecondary, fontSize: 11, marginBottom: 15, fontWeight: '600', textAlign: 'center'}}>
                            ⚠️ ATENÇÃO: A exclusão é irreversível e apaga todos os treinos, fotos, histórico e dados do aluno permanentemente.
                        </Text>
                        <TouchableOpacity style={styles.deleteUserBtn} onPress={handleDeleteUser}>
                            <MaterialCommunityIcons name="account-remove" size={18} color="#FFF" />
                            <Text style={styles.deleteUserBtnText}>EXCLUIR ALUNO PERMANENTEMENTE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    sectionLabel: { color:'#888', fontWeight:'900', marginBottom:15, fontSize:12, letterSpacing:1 },
    actionRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 12, gap: 15, borderWidth:1, elevation: 2, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent:'center', alignItems:'center' },
    iconBoxSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    actionText: { fontWeight: '900', fontSize: 14, flex:1, letterSpacing: 0.5 },
    
    premiumCard: { borderRadius: 24, marginBottom: 20, borderWidth: 1, overflow: 'hidden', elevation: 4, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderBottomWidth: 1 },
    cardTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1 },
    
    inputLarge: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 15, fontWeight: 'bold' },
    saveBtnLg: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    quickReleaseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15, padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
    
    card: { borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1 },
    sectionSubDesc: { color: '#888', fontSize: 12, marginBottom: 15, lineHeight: 18 },
    inputPdf: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    saveBtn: { padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', height: 50, width: 50 },
    
    riskCard: { borderRadius: 24, marginBottom: 30, borderWidth: 2, overflow: 'hidden', elevation: 6, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.15, shadowRadius: 10 },
    deleteUserBtn: { flexDirection: 'row', alignItems: 'center', justifyContent:'center', backgroundColor: '#FF3B30', padding: 16, borderRadius: 12, gap: 10, elevation: 3 },
    deleteUserBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

    accessCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
    accessTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
    accessCategory: { fontSize: 10, color: '#888', fontWeight: 'bold' },
    aiDietBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 15 },
    
    dashCard: { flexGrow: 1, flexBasis: '48%', minWidth: 280, padding: 20, borderRadius: 16, borderWidth: 1, justifyContent: 'space-between' },
    dashCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    dashCardTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    dashCardValue: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
    dashCardSub: { color: '#888', fontSize: 11, fontWeight: 'bold', marginBottom: 15 },
    dashBtn: { padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', marginTop: 'auto' },
    dashActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 10 },
});