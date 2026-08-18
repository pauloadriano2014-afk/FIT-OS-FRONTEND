// src/components/Admin/AdminUserDietTab.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MASTER_IDS } from '../../constants/masterIds';

export default function AdminUserDietTab({
    theme,
    aluno,
    freshAluno,
    userPlan,
    dietGoal,
    setDietGoal,
    savingDiet,
    handleSaveDietGoal,
    isDietTabVisible,
    handleToggleDietTab,
    navigation,
    DIET_OPTIONS,
    isMasterCoach
}) {
    const [safeIsMaster, setSafeIsMaster] = useState(false);
    const [isCheckingSecurity, setIsCheckingSecurity] = useState(true);

    // 🔥 VERIFICAÇÃO NATIVA (Roda direto no celular do usuário antes de mostrar a tela)
    useEffect(() => {
        const verifyMasterAccess = async () => {
            try {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const userObj = JSON.parse(userJson);
                    setSafeIsMaster(MASTER_IDS.includes(userObj.id));
                }
            } catch (e) {
                console.log("Erro na verificação de segurança:", e);
            } finally {
                setIsCheckingSecurity(false);
            }
        };
        verifyMasterAccess();
    }, []);

    if (isCheckingSecurity) {
        return (
            <View style={[styles.tabContent, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    return (
        <View style={styles.tabContent}>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>LABORATÓRIO NUTRICIONAL</Text>
            <Text style={[styles.sectionSubDesc, { marginBottom: 15 }]}>Gerencie a visibilidade e a sugestão do plano alimentar deste aluno.</Text>

            {/* 🔥 BLOCO 1 E 2: A MAÇÃ E A MESA DE OPERAÇÕES SÓ APARECEM PARA MASTER 🔥 */}
            {safeIsMaster && (
                <>
                    <View style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 15 }]}>
                        <View style={[styles.iconBox, { backgroundColor: theme.bg }]}><MaterialCommunityIcons name="food-apple" size={24} color={isDietTabVisible ? theme.accent : theme.textSecondary} /></View>
                        <View style={{ flex: 1, marginLeft: 15, paddingRight: 10 }}>
                            <Text style={[styles.accessTitle, { color: theme.text }]}>Liberar Aba "Dieta" no App</Text>
                            <Text style={styles.accessCategory}>Se ativado, a maçã ficará visível no celular do aluno.</Text>
                        </View>
                        <Switch 
                            value={isDietTabVisible} 
                            onValueChange={handleToggleDietTab} 
                            trackColor={{ false: '#333', true: theme.accent }} 
                            thumbColor={Platform.OS === 'ios' ? '#FFF' : (isDietTabVisible ? '#000' : '#888')} 
                        />
                    </View>

                    <TouchableOpacity style={[styles.aiDietBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent, marginBottom: 10 }]} onPress={() => navigation.navigate('AdminDietScreen', { aluno: freshAluno || aluno, alunoId: (freshAluno || aluno).id })}>
                        <View style={[styles.iconBox, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="view-dashboard-edit-outline" size={22} color={theme.accent} /></View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>ABRIR MESA DE OPERAÇÕES</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>Montar dieta com Tabela TACO e Macros</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
                    </TouchableOpacity>

                    {/* 🔥 NOVO BOTÃO DE ESTRATÉGIAS ADICIONADO AQUI 🔥 */}
                    <TouchableOpacity style={[styles.aiDietBtn, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 15 }]} onPress={() => navigation.navigate('AdminStrategiesScreen', { aluno: freshAluno || aluno, alunoId: (freshAluno || aluno).id })}>
                        <View style={[styles.iconBox, { backgroundColor: theme.bg }]}><MaterialCommunityIcons name="lightning-bolt-outline" size={22} color={theme.text} /></View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>GERENCIAR ESTRATÉGIAS</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>Crie fases, ciclos e protocolos com datas</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </>
            )}

            {/* 🔥 BLOCO 3: ESTRATÉGIA GENÉRICA (PDF) - LIBERADA PARA TODO MUNDO 🔥 */}
            <View style={[styles.premiumCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: safeIsMaster ? 5 : 0 }]}>
                <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                    <View style={[styles.iconBoxSmall, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}><MaterialCommunityIcons name="clipboard-text-outline" size={18} color={theme.textSecondary} /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Estratégia e Sugestão Alimentar</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Libera um PDF de sugestão pré-montado baseado no objetivo do aluno.</Text>
                    </View>
                </View>
                <View style={{ padding: 20 }}>
                    {DIET_OPTIONS.map(opt => (
                        <TouchableOpacity 
                            key={opt.id} 
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: dietGoal === opt.id ? theme.accent : theme.border, backgroundColor: dietGoal === opt.id ? theme.accent + '15' : theme.bg, marginBottom: 10 }} 
                            onPress={() => setDietGoal(opt.id)} 
                            disabled={userPlan === 'CHALLENGE_21' || userPlan === 'CHALLENGE21'} 
                        >
                            <MaterialCommunityIcons name={dietGoal === opt.id ? "radiobox-marked" : "radiobox-blank"} size={20} color={dietGoal === opt.id ? theme.accent : theme.textSecondary} />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={{ color: dietGoal === opt.id ? theme.accent : theme.text, fontWeight: 'bold', fontSize: 13 }}>{opt.label}</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{opt.desc}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {(userPlan !== 'CHALLENGE_21' && userPlan !== 'CHALLENGE21') && (
                        <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, width: '100%', marginTop: 10, flexDirection: 'row', gap: 8, height: 48 }]} onPress={handleSaveDietGoal} disabled={savingDiet}>
                            {savingDiet ? <ActivityIndicator color={theme.text} /> : (<><MaterialCommunityIcons name="content-save" size={18} color={theme.text} /><Text style={{ color: theme.text, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }}>SALVAR ESTRATÉGIA</Text></>)}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            
        </View>
    );
}

const styles = StyleSheet.create({
    tabContent: { width: '100%', paddingBottom: 20 },
    sectionLabel: { fontWeight: '900', marginBottom: 15, fontSize: 12, letterSpacing: 1 },
    sectionSubDesc: { color: '#888', fontSize: 11, marginBottom: 15 },
    accessCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    iconBoxSmall: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    accessTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
    accessCategory: { fontSize: 10, color: '#888', fontWeight: 'bold' },
    aiDietBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1 },
    premiumCard: { borderRadius: 20, marginBottom: 20, borderWidth: 1, overflow: 'hidden', elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15, borderBottomWidth: 1 },
    cardTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
    saveBtnLg: { borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 }
});