// src/screens/AdminUserOptions.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Platform, Dimensions, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useTheme } from '../contexts/ThemeContext';

import useAdminUserOptions from '../hooks/useAdminUserOptions';

import AdminUserSummaryTab from '../components/Admin/AdminUserSummaryTab';
import AdminUserDietTab from '../components/Admin/AdminUserDietTab';
import AdminUserAccessTab from '../components/Admin/AdminUserAccessTab';
import AdminUserTreinosTab from '../components/Admin/AdminUserTreinosTab';
import AdminUserSystem from '../components/AdminUserSystem';
import RaioxCargasModal from '../components/RaioxCargasModal';
import AdminUserAnamneseTab from '../components/Admin/AdminUserAnamneseTab';
import RunningProtocolModal from '../components/Admin/RunningProtocolModal';
import SelectAnamneseModal from '../components/Admin/SelectAnamneseModal';
import { MASTER_IDS } from '../constants/masterIds';

const DIET_OPTIONS = [
    { id: 'NONE', label: '🚫 Ocultar Botão', desc: 'Aluno não verá a sugestão alimentar.' },
    { id: 'WEIGHT_LOSS', label: '📉 Definição / Emagrecimento', desc: 'Foco em secar (1200 a 1500 kcal)' },
    { id: 'HYPERTROPHY_M', label: '💪 Volume Muscular (Homem)', desc: 'Foco em crescer (2000 a 2500 kcal)' },
    { id: 'HYPERTROPHY_F', label: '🍑 Volume Muscular (Mulher)', desc: 'Foco em perna/glúteo (1500 a 2000 kcal)' }
];

const MENU_TABS = [
    { id: 'RESUMO',    label: 'VISÃO GERAL',       icon: 'view-dashboard' },
    { id: 'ANAMNESE',  label: 'PERFIL & ANAMNESE',  icon: 'clipboard-text' },
    { id: 'TREINOS',   label: 'TREINOS',            icon: 'weight-lifter' },
    { id: 'AVALIACOES',label: 'AVALIAÇÕES',         icon: 'camera-front-variant' },
    { id: 'DIETA_IA',  label: 'NUTRIÇÃO & IA',       icon: 'food-apple' },
    { id: 'ACESSOS',   label: 'PLANOS E BÔNUS',      icon: 'key-star' },
    { id: 'SISTEMA',   label: 'SISTEMA & RISCO',     icon: 'cog' }
];

export default function AdminUserOptions({ route, navigation }) {
    let { aluno, alunoId, alunoName, alunoGender } = route.params || {};
    if (!aluno || typeof aluno === 'string' || !aluno.id) {
        aluno = { id: alunoId || route.params?.id || '', name: alunoName || route.params?.name || 'Aluno', gender: alunoGender || route.params?.gender || '' };
    }

    const { theme } = useTheme();
    const [windowWidth] = useState(Dimensions.get('window').width);
    const isWebPC = Platform.OS === 'web' && windowWidth > 768;

    const ops = useAdminUserOptions(aluno, navigation);
    const targetStudent = ops.freshAluno || aluno; 

    const [currentUserId, setCurrentUserId] = useState(null);
    const [isSelectAnamneseVisible, setIsSelectAnamneseVisible] = useState(false); 

    useEffect(() => {
        const loadAdminData = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const userObj = JSON.parse(userStr);
                    setCurrentUserId(userObj.id);
                }
            } catch (e) { console.log("Erro ao carregar sessão admin:", e); }
        };
        loadAdminData();
    }, []);

    const isMasterCoach = MASTER_IDS.includes(currentUserId);

    // 🔥 FUNÇÃO BLINDADA PARA O BOTÃO VOLTAR
    const handleGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // Se o histórico foi apagado pelo F5, força a navegação de volta para a lista
            navigation.replace('AdminDashboard'); 
        }
    };

    const handleImpersonateRealStudent = async () => {
        try {
            const currentAdminStr = await AsyncStorage.getItem('user');
            const currentRole = await AsyncStorage.getItem('role');
            
            if (!currentAdminStr) {
                if (Platform.OS === 'web') window.alert("Erro: Sessão de admin não encontrada.");
                else Alert.alert("Erro", "Sessão de admin não encontrada.");
                return;
            }

            const executeImpersonation = async () => {
                try {
                    await AsyncStorage.setItem('original_admin_user', currentAdminStr);
                    await AsyncStorage.setItem('original_admin_role', currentRole || 'ADMIN');
                    
                    const { diets, workouts, anamneses, ...leanStudentData } = targetStudent;

                    await AsyncStorage.setItem('user', JSON.stringify(leanStudentData));
                    await AsyncStorage.setItem('role', 'USER');
                    
                    if (Platform.OS === 'web') {
                        window.location.replace('/');
                    } else {
                        navigation.reset({ index: 0, routes: [{ name: 'Main' }] }); 
                    }
                } catch (err) {
                    console.log("Erro na troca de dados:", err);
                    
                    await AsyncStorage.removeItem('original_admin_user');
                    await AsyncStorage.removeItem('original_admin_role');
                    await AsyncStorage.setItem('user', currentAdminStr);
                    if (currentRole) await AsyncStorage.setItem('role', currentRole);

                    if (Platform.OS === 'web') window.alert("Falha ao efetuar o login na conta do aluno.");
                    else Alert.alert("Erro", "Falha ao efetuar o login na conta do aluno.");
                }
            };

            const confirmMessage = `Você entrará na conta de ${targetStudent.name.split(' ')[0]}. Para voltar, use o botão vermelho na tela inicial. Deseja prosseguir?`;

            if (Platform.OS === 'web') {
                if (window.confirm(confirmMessage)) executeImpersonation();
            } else {
                Alert.alert("Visualizar App", confirmMessage, [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Entrar", onPress: executeImpersonation }
                ]);
            }
        } catch (error) {
            console.log("Erro ao tentar visualizar como aluno real:", error);
        }
    };

    const renderContent = () => {
        switch (ops.activeTab) {
            case 'RESUMO':
                return (
                    <AdminUserSummaryTab
                        // 🔥 PASSANDO targetStudent AQUI PARA PREVENIR O BUG DO F5
                        theme={theme} aluno={targetStudent} freshAluno={ops.freshAluno} isWebPC={isWebPC}
                        handlePickImage={ops.handlePickImage} uploadingPhoto={ops.uploadingPhoto}
                        photoUrl={ops.photoUrl} isActiveUser={ops.isActiveUser}
                        studentAlerts={ops.studentAlerts} isAlertsExpanded={ops.isAlertsExpanded}
                        setIsAlertsExpanded={ops.setIsAlertsExpanded} handleDismissAlert={ops.handleDismissAlert}
                        isContactDelayed={ops.isContactDelayed} lastContactDate={ops.lastContactDate}
                        daysSinceContact={ops.daysSinceContact} handleRegisterContactToday={ops.handleRegisterContactToday}
                        weeklyChecks={ops.weeklyChecks} handleToggleCheck={ops.handleToggleCheck}
                        handleRemoveCheck={ops.handleRemoveCheck} newCheckText={ops.newCheckText}
                        setNewCheckText={ops.setNewCheckText} handleAddCheck={ops.handleAddCheck}
                        strategyNotes={ops.strategyNotes} setStrategyNotes={ops.setStrategyNotes}
                        handleSaveStrategy={ops.handleSaveStrategy} savingNotes={ops.savingNotes}
                        activeWorkouts={ops.activeWorkouts} setActiveTab={ops.setActiveTab}
                        navigation={navigation} handleAbrirRaioxCargas={ops.handleAbrirRaioxCargas}
                        isDietTabVisible={ops.isDietTabVisible} dietGoal={ops.dietGoal}
                        DIET_OPTIONS={DIET_OPTIONS}
                    />
                );
            case 'ANAMNESE':
                return (
                    <AdminUserAnamneseTab theme={theme} aluno={targetStudent} userPlan={ops.userPlan} />
                );
            case 'TREINOS':
                return (
                    <AdminUserTreinosTab
                        theme={theme} handleAbrirRaioxCargas={ops.handleAbrirRaioxCargas} workoutTab={ops.workoutTab}
                        setWorkoutTab={ops.setWorkoutTab} userPlan={ops.userPlan} loading={ops.loading}
                        activeWorkouts={ops.activeWorkouts} archivedWorkouts={ops.archivedWorkouts}
                        handleNewWorkout={ops.handleNewWorkout} handleEditWorkout={ops.handleEditWorkout}
                        handleToggleArchiveWorkout={ops.handleToggleArchiveWorkout} handleDeleteWorkout={ops.handleDeleteWorkout}
                        hasActiveFicha={ops.hasActiveFicha} fichaDaysElapsed={ops.fichaDaysElapsed}
                        isRunningModule={ops.isRunningModule} handleToggleRunningModule={ops.handleToggleRunningModule}
                        onOpenRunningModal={() => ops.setIsRunningModalVisible(true)}
                        onOpenEliteProtocol={() => navigation.navigate('GerarTreinoIA', { aluno: targetStudent })}
                    />
                );
            case 'AVALIACOES':
                return (
                    <View style={{ width: '100%', paddingBottom: 20 }}>
                        <AdminUserSystem
                            currentTab="AVALIACOES" theme={theme} navigation={navigation} aluno={targetStudent} userPlan={ops.userPlan}
                            isActiveUser={ops.isActiveUser} handleToggleStatus={ops.handleToggleStatus}
                            disableCheckIn={ops.disableCheckIn} handleToggleDisableCheckIn={ops.handleToggleDisableCheckIn}
                            nextCheckInDate={ops.nextCheckInDate} handleCheckInDateChange={ops.handleCheckInDateChange}
                            handleSaveCheckInDate={ops.handleSaveCheckInDate} evaluationUrl={ops.evaluationUrl}
                            setEvaluationUrl={ops.setEvaluationUrl} handleSaveEvaluation={ops.handleSaveEvaluation}
                            handleDeleteUser={ops.handleDeleteUser} runningModule={ops.isRunningModule}
                            handleToggleRunningModule={ops.handleToggleRunningModule}
                        />
                    </View>
                );
            case 'DIETA_IA':
                return (
                    <AdminUserDietTab
                        // 🔥 PASSANDO targetStudent AQUI PARA PREVENIR O BUG DO F5
                        theme={theme} aluno={targetStudent} freshAluno={ops.freshAluno} userPlan={ops.userPlan} dietGoal={ops.dietGoal} 
                        setDietGoal={ops.setDietGoal} savingDiet={ops.savingDiet} handleSaveDietGoal={ops.handleSaveDietGoal} 
                        isDietTabVisible={ops.isDietTabVisible} handleToggleDietTab={ops.handleToggleDietTab} navigation={navigation}
                        DIET_OPTIONS={DIET_OPTIONS}
                    />
                );
            case 'ACESSOS':
                return (
                    <AdminUserAccessTab
                        theme={theme} userPlan={ops.userPlan} confirmChangePlan={ops.confirmChangePlan}
                        loadingPaflix={ops.loadingPaflix} vipContents={ops.vipContents} userAccess={ops.userAccess} 
                        handleToggleAccess={ops.handleToggleAccess}
                    />
                );
            case 'SISTEMA':
                return (
                    <View style={{ width: '100%', paddingBottom: 20 }}>
                        <AdminUserSystem
                            currentTab="SISTEMA" theme={theme} navigation={navigation} aluno={targetStudent} userPlan={ops.userPlan}
                            isActiveUser={ops.isActiveUser} handleToggleStatus={ops.handleToggleStatus}
                            disableCheckIn={ops.disableCheckIn} handleToggleDisableCheckIn={ops.handleToggleDisableCheckIn}
                            nextCheckInDate={ops.nextCheckInDate} handleCheckInDateChange={ops.handleCheckInDateChange}
                            handleSaveCheckInDate={ops.handleSaveCheckInDate} evaluationUrl={ops.evaluationUrl}
                            setEvaluationUrl={ops.setEvaluationUrl} handleSaveEvaluation={ops.handleSaveEvaluation}
                            handleDeleteUser={ops.handleDeleteUser} runningModule={ops.isRunningModule}
                            handleToggleRunningModule={ops.handleToggleRunningModule}
                        />
                    </View>
                );
            default: return null;
        }
    };

    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const currentTabObj = MENU_TABS.find(t => t.id === ops.activeTab) || MENU_TABS[0];

    if (isWebPC) {
        return (
            <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: webOuterBg, overflow: 'hidden' }}>
                <View style={{ width: 280, backgroundColor: theme.surface, borderRightWidth: 1, borderColor: theme.border, padding: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {/* 🔥 ADICIONADO O handleGoBack AQUI */}
                            <TouchableOpacity onPress={handleGoBack} style={{ padding: 8, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                                <MaterialCommunityIcons name="arrow-left" size={20} color={theme.text} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text }}>ALUNO ELITE</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setIsSelectAnamneseVisible(true)} 
                            style={{ padding: 8, backgroundColor: 'rgba(255, 149, 0, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 149, 0, 0.3)' }}
                            title="Solicitar Nova Anamnese"
                        >
                            <MaterialCommunityIcons name="clipboard-edit-outline" size={20} color="#FF9500" />
                        </TouchableOpacity>
                    </View>

                    {isMasterCoach && (
                        <TouchableOpacity
                            style={[styles.impersonateBtnWeb, { backgroundColor: theme.accent, borderColor: theme.border }]}
                            onPress={handleImpersonateRealStudent}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons name="account-eye" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.impersonateBtnTextWeb, { color: theme.isDark ? '#000' : '#FFF' }]}>
                                VISUALIZAR APP DO ALUNO
                            </Text>
                        </TouchableOpacity>
                    )}

                    <View style={{ gap: 10 }}>
                        {MENU_TABS.map(tabObj => {
                            const isActive = ops.activeTab === tabObj.id;
                            return (
                                <TouchableOpacity
                                    key={tabObj.id}
                                    style={[styles.sidebarBtn, isActive && { backgroundColor: theme.accent + '22', borderColor: theme.accent, borderWidth: 1 }]}
                                    onPress={() => ops.setActiveTab(tabObj.id)}
                                >
                                    <MaterialCommunityIcons name={tabObj.icon} size={20} color={isActive ? theme.accent : theme.textSecondary} />
                                    <Text style={[styles.sidebarBtnText, { color: isActive ? theme.accent : theme.textSecondary }]}>{tabObj.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={{ flex: 1, backgroundColor: theme.bg }}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 40, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                        <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center' }}>
                            {renderContent()}
                        </View>
                    </ScrollView>
                </View>

                <RaioxCargasModal visible={ops.isCargasModalVisible} onClose={() => ops.setIsCargasModalVisible(false)} historicoDeCargasList={ops.historicoDeCargasList} theme={theme} />
                <RunningProtocolModal visible={ops.isRunningModalVisible} onClose={() => ops.setIsRunningModalVisible(false)} aluno={targetStudent} theme={theme} />
                
                <SelectAnamneseModal 
                    visible={isSelectAnamneseVisible} 
                    onClose={() => setIsSelectAnamneseVisible(false)} 
                    theme={theme} 
                    onSelect={(type) => {
                        setIsSelectAnamneseVisible(false);
                        ops.handleRequestAnamneseUpdate(type);
                    }} 
                />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ height: Platform.OS === 'web' ? '100vh' : '100%', width: '100%', backgroundColor: theme.bg }}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                {/* 🔥 ADICIONADO O handleGoBack AQUI NO MOBILE TAMBÉM */}
                <TouchableOpacity onPress={handleGoBack} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>GERENCIAR ALUNO</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setIsSelectAnamneseVisible(true)} style={{ padding: 8, marginRight: 4 }}>
                        <MaterialCommunityIcons name="clipboard-edit-outline" size={24} color="#FF9500" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={ops.fetchAllData} style={{ padding: 8 }}>
                        <MaterialCommunityIcons name="refresh" size={24} color={theme.accent} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                {isMasterCoach && (
                    <TouchableOpacity
                        style={[styles.impersonateBtnMobile, { backgroundColor: theme.accent, borderColor: theme.border }]}
                        onPress={handleImpersonateRealStudent}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="account-eye" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                        <Text style={[styles.impersonateBtnTextMobile, { color: theme.isDark ? '#000' : '#FFF' }]}>
                            VISUALIZAR APP DO ALUNO
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.menuSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => ops.setIsMenuVisible(true)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.menuIconBox, { backgroundColor: theme.accent + '22' }]}>
                            <MaterialCommunityIcons name={currentTabObj.icon} size={20} color={theme.accent} />
                        </View>
                        <Text style={[styles.menuSelectorText, { color: theme.text }]}>{currentTabObj.label}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                {renderContent()}
            </ScrollView>

            <Modal visible={ops.isMenuVisible} transparent animationType="fade" onRequestClose={() => ops.setIsMenuVisible(false)}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => ops.setIsMenuVisible(false)}>
                    <View style={[styles.menuModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {MENU_TABS.map((t, index) => (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    styles.menuOptionBtn,
                                    { borderBottomColor: index === MENU_TABS.length - 1 ? 'transparent' : theme.border },
                                    ops.activeTab === t.id && { backgroundColor: theme.accent + '15' }
                                ]}
                                onPress={() => { ops.setActiveTab(t.id); ops.setIsMenuVisible(false); }}
                            >
                                <MaterialCommunityIcons name={t.icon} size={22} color={ops.activeTab === t.id ? theme.accent : theme.textSecondary} />
                                <Text style={[styles.menuOptionText, { color: ops.activeTab === t.id ? theme.accent : theme.text }]}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <RaioxCargasModal visible={ops.isCargasModalVisible} onClose={() => ops.setIsCargasModalVisible(false)} historicoDeCargasList={ops.historicoDeCargasList} theme={theme} />
            <RunningProtocolModal visible={ops.isRunningModalVisible} onClose={() => ops.setIsRunningModalVisible(false)} aluno={targetStudent} theme={theme} />
            
            <SelectAnamneseModal 
                visible={isSelectAnamneseVisible} 
                onClose={() => setIsSelectAnamneseVisible(false)} 
                theme={theme} 
                onSelect={(type) => {
                    setIsSelectAnamneseVisible(false);
                    ops.handleRequestAnamneseUpdate(type);
                }} 
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems: 'center', borderBottomWidth: 1 },
    headerTitle: { fontWeight: '900', fontSize: 16 },
    menuSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingRight: 15, borderRadius: 16, borderWidth: 1 },
    menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    menuSelectorText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    menuModalContent: { width: '90%', maxWidth: 400, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    menuOptionBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, gap: 15 },
    menuOptionText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    sidebarBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
    sidebarBtnText: { fontSize: 14, fontWeight: 'bold' },
    impersonateBtnWeb: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
    impersonateBtnTextWeb: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    impersonateBtnMobile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
    impersonateBtnTextMobile: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }
});