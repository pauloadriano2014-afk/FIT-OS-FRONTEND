// src/screens/AdminDietScreen.js — VERSÃO 4.0
import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    Platform, KeyboardAvoidingView, useWindowDimensions,
    ActivityIndicator, Animated, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

// Componentes
import DietHeaderWidgets from '../components/AdminDiet/DietHeaderWidgets';
import MealCardAdmin from '../components/AdminDiet/MealCardAdmin';
import DietModalsAdmin from '../components/AdminDiet/DietModalsAdmin';
import DietActionModals from '../components/AdminDiet/DietActionModals';
import FoodSearchModal from '../components/FoodSearchModal';
import SmartSubstituteModal from '../components/SmartSubstituteModal';
import ImportDietModal from '../components/ImportDietModal';
import ModelSelectorModal from '../components/AdminDiet/ModelSelectorModal';

// Hooks e Utils
import { useDietModals } from '../hooks/useDietModals';
import { useDietData } from '../hooks/useDietData';
import { useDietActions } from '../hooks/useDietActions';
import * as DietService from '../services/adminDietService';
import { toGrams, enrichMealsWithDatabase, generateDietPDF } from '../utils/dietUtils';
import { calcWeeklyPlan } from '../utils/macroPlanner';

// 🔥 4 ABAS
const DAY_TABS = [
    { key: 'TREINO',        label: 'TREINO',        icon: 'dumbbell'    },
    { key: 'TREINO_CARDIO', label: 'T+CARDIO',      icon: 'run-fast'    },
    { key: 'CARDIO',        label: 'CARDIO',        icon: 'heart-pulse' },
    { key: 'DESCANSO',      label: 'DESCANSO',      icon: 'sleep'       },
];

const DAY_ACCENT = {
    TREINO:        '#32ADE6',
    TREINO_CARDIO: '#FF9500',
    CARDIO:        '#FF3B30',
    DESCANSO:      '#34C759',
};

export default function AdminDietScreen({ route, navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();
    const isWebPC = isWeb && windowWidth > 768;
    const containerMaxWidth = isWebPC ? 960 : '100%';
    const containerBorders = isWebPC
        ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }
        : {};

    const RootComponent = isWeb ? View : SafeAreaView;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [showRaioX, setShowRaioX]                   = useState(false);
    const [initialCategoryFilter, setInitialCategoryFilter] = useState('Todas');
    const [modelSelectorVisible, setModelSelectorVisible]   = useState(false);
    const [generateProgress, setGenerateProgress]           = useState('');

    const rawAluno = route.params?.aluno;
    const aluno = (typeof rawAluno === 'string' && rawAluno.startsWith('{'))
        ? JSON.parse(rawAluno) : rawAluno;
    const userId = (aluno?.id && aluno.id !== '[object Object]')
        ? aluno.id : route.params?.alunoId;

    const modals  = useDietModals();
    const data    = useDietData(userId);
    const actions = useDietActions(aluno, data.anamnese, data.initialMeals);

    const handleActionPress = (action) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    // ─── SALVAR DIETA ─────────────────────────────────────────────────────────
    const handleSaveDiet = async () => {
        if (!userId) return Alert.alert('Erro', 'ID não encontrado.');
        data.setIsSaving(true);
        try {
            const validDayTypes = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'];
            const safeMeals = actions.meals.map(m => ({
                ...m,
                dayType: validDayTypes.includes(m.dayType) ? m.dayType : 'TREINO',
            }));
            const payload = {
                userId,
                name: `Plano Alimentar - ${data.dietConfig.goal}`,
                goal: data.dietConfig.goal,
                totalKcal:    actions.currentMacros.kcal,
                totalProtein: actions.currentMacros.prot,
                totalCarbs:   actions.currentMacros.carb,
                totalFats:    actions.currentMacros.fat,
                waterIntake:  data.dietConfig.water,
                generalNotes: data.dietConfig.notes,
                meals: safeMeals,
            };
            await DietService.saveDiet(payload);
            if (isWeb) window.alert('🚀 Dieta salva com sucesso!');
            else Alert.alert('Sucesso', 'Dieta salva!');
        } catch (error) {
            Alert.alert('Erro Técnico', error.message);
        } finally {
            data.setIsSaving(false);
        }
    };

    // ─── GERAR COM IA ─────────────────────────────────────────────────────────
    // Recebe (provider, activeDayTypes[], weekDist) do ModelSelectorModal
    const handleGenerateAI = async (provider = 'anthropic', activeDayTypes = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'], weekDist = null) => {
        if (!data.anamnese || Object.keys(data.anamnese).length === 0) {
            return isWeb
                ? window.alert('Preencha a anamnese primeiro.')
                : Alert.alert('Atenção', 'Preencha a anamnese primeiro.');
        }

        data.setIsGenerating(true);
        setGenerateProgress('Calculando macros por aba...');

        try {
            // Calcula macros pré-determinados para cada aba ativa
            const plan = calcWeeklyPlan(data.anamnese, aluno?.birthDate, aluno?.gender, weekDist);
            const macrosByDay = plan.macrosByDay;

            // Chama o serviço passando o onProgress
            const allMeals = await DietService.generateAllDayTypes(
                data.anamnese,
                provider,
                aluno,
                activeDayTypes,
                macrosByDay,
                (progressMsg) => setGenerateProgress(progressMsg) // 🔥 INJETADO AQUI
            );

            // Substitui apenas as abas geradas, mantém as demais
            actions.setMeals(prev => {
                const mantidas = prev.filter(m => !activeDayTypes.includes(m.dayType));
                return [...mantidas, ...allMeals];
            });

            // Vai para a primeira aba gerada
            actions.setActiveDayType(activeDayTypes[0]);
            setModelSelectorVisible(false);

            const resumo = activeDayTypes
                .map(d => `${d}: ${allMeals.filter(m => m.dayType === d).length} refeições`)
                .join('\n');
            const msg = `✅ Dieta gerada!\n\n${resumo}\n\nRevise e salve.`;
            if (isWeb) window.alert(msg);
            else Alert.alert('Estratégia Pronta!', msg);

        } catch (error) {
            console.error('[handleGenerateAI]', error);
            const errMsg = 'Falha na IA. Tente novamente.';
            if (isWeb) window.alert(errMsg);
            else Alert.alert('Erro', errMsg);
        } finally {
            data.setIsGenerating(false);
            setGenerateProgress('');
        }
    };

    // ─── CLONE / TEMPLATE / IMPORT ────────────────────────────────────────────
    const handleCloneFromStudent = async (sourceStudentId) => {
        try {
            const res = await DietService.cloneDietFromStudent(sourceStudentId);
            if (res?.meals) {
                const currentDay = actions.activeDayTypeRef.current;
                const mapped = res.meals.map(m => ({ ...m, id: Math.random().toString(), dayType: currentDay }));
                actions.setMeals(prev => [
                    ...prev.filter(m => m.dayType !== currentDay),
                    ...enrichMealsWithDatabase(mapped),
                ]);
                modals.setModalCloneVisible(false);
            }
        } catch { Alert.alert('Erro', 'Falha ao clonar.'); }
    };

    const handleApplyTemplate = (template) => {
        const currentDay = actions.activeDayTypeRef.current;
        const parsedMeals = typeof template.meals === 'string' ? JSON.parse(template.meals) : template.meals;
        const mapped = parsedMeals.map(m => ({ ...m, id: Math.random().toString(), dayType: currentDay }));
        actions.setMeals(prev => [
            ...prev.filter(m => m.dayType !== currentDay),
            ...enrichMealsWithDatabase(mapped),
        ]);
        modals.setModalTemplatesVisible(false);
    };

    const handleSaveAsTemplate = async (templateName) => {
        try {
            const mealsToSave = actions.meals.filter(m => m.dayType === actions.activeDayTypeRef.current);
            const newTemplate = await DietService.saveDietTemplate({
                name: templateName, goal: data.dietConfig.goal,
                totalKcal: actions.currentMacros.kcal, meals: mealsToSave,
            });
            data.setTemplatesList(prev => [newTemplate, ...prev]);
            modals.setModalSaveTemplateVisible(false);
        } catch { Alert.alert('Erro', 'Falha ao salvar.'); }
    };

    const handleSaveMealTemplate = async (templateName) => {
        const mealToSave = actions.meals.find(m => m.id === actions.selectedMealForAction.id);
        if (!mealToSave) return;
        try {
            const newTemp = await DietService.saveMealTemplate({
                name: templateName, category: mealToSave.name, items: mealToSave.items,
            });
            data.setMealTemplatesList(prev => [newTemp, ...prev]);
            modals.setModalSaveMealVisible(false);
        } catch { Alert.alert('Erro', 'Falha ao salvar.'); }
    };

    const handleApplyMealTemplate = (template) => {
        const parsedItems = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
        actions.setMeals(prev => prev.map(m =>
            m.id === actions.selectedMealForAction.id
                ? { ...m, name: template.category || m.name, items: parsedItems } : m
        ));
        modals.setModalImportMealVisible(false);
    };

    const handleImportSuccess = (importedMeals) => {
        const currentDay = actions.activeDayTypeRef.current;
        const mapped = importedMeals.map(m => ({ ...m, id: Math.random().toString(), dayType: currentDay }));
        actions.setMeals(prev => [
            ...prev.filter(m => m.dayType !== currentDay),
            ...enrichMealsWithDatabase(mapped),
        ]);
        modals.setImportModalVisible(false);
    };

    const handleCallGeneratePDF = () => {
        generateDietPDF({
            visibleMeals: actions.visibleMeals,
            dietConfig: data.dietConfig,
            currentMacros: actions.currentMacros,
            activeDayType: actions.activeDayType,
            aluno,
        });
    };

    // ─── MODAIS DE REFEIÇÃO ───────────────────────────────────────────────────
    const handleOpenTimeSelect = (mealId) => { actions.setActiveMealId(mealId); modals.setTimeModalVisible(true); };
    const handleOpenNameSelect = (mealId) => { actions.setActiveMealId(mealId); modals.setNameModalVisible(true); };
    const handleSelectTime = (time) => { actions.handleUpdateMeal(actions.activeMealId, 'time', time); modals.setTimeModalVisible(false); };
    const handleSelectName = (name) => {
        if (name === 'Personalizado') {
            modals.setNameModalVisible(false);
            actions.setCustomNameInput('');
            modals.setCustomNameModalVisible(true);
        } else {
            actions.handleUpdateMeal(actions.activeMealId, 'name', name);
            modals.setNameModalVisible(false);
        }
    };
    const handleSaveCustomName = () => {
        if (actions.customNameInput.trim())
            actions.handleUpdateMeal(actions.activeMealId, 'name', actions.customNameInput.trim());
        modals.setCustomNameModalVisible(false);
    };

    const handleOpenSearch = (mealId, groupId = null) => {
        actions.setActiveMealId(mealId);
        actions.setActiveGroupId(groupId);
        setInitialCategoryFilter('Todas');
        if (groupId !== null) {
            const meal = actions.meals.find(m => m.id === mealId);
            const groupItems = meal?.items.filter(i => i.groupId === groupId) || [];
            if (groupItems.length > 0) {
                actions.setSmartPrincipalFood(groupItems[0]);
                actions.setSmartPrincipalAmount(groupItems[0].amount || '100');
                modals.setSmartModalVisible(true);
                return;
            }
        }
        modals.setSearchModalVisible(true);
    };

    const handleSmartToManual = () => {
        modals.setSmartModalVisible(false);
        setInitialCategoryFilter(actions.smartPrincipalFood?.category ?? 'Todas');
        modals.setSearchModalVisible(true);
    };

    const handleMealOptions = (mealId, mealName) => {
        actions.setSelectedMealForAction({ id: mealId, name: mealName });
        modals.setModalMealOptionsVisible(true);
    };

    const handleSwapBaseFood = (mealId, oldBaseFood) => {
        actions.setActiveMealId(mealId);
        actions.setActiveGroupId(oldBaseFood.groupId);
        actions.setFoodToSwapId(oldBaseFood.uniqueId);
        modals.setSearchModalVisible(true);
    };

    const pct = (cur, target) => Math.min((cur / (target || 1)) * 100, 100);

    const getExistingItemsInGroup = () => {
        if (!actions.activeMealId || !actions.activeGroupId) return [];
        const meal = actions.meals.find(m => m.id === actions.activeMealId);
        return meal?.items.filter(i => i.groupId === actions.activeGroupId) ?? [];
    };

    const activeAccent = DAY_ACCENT[actions.activeDayType] ?? theme.accent;

    if (data.isLoadingDiet) {
        return (
            <RootComponent style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.accent} />
            </RootComponent>
        );
    }

    return (
        <RootComponent style={{
            height: isWeb ? windowHeight : undefined,
            flex: isWeb ? undefined : 1,
            overflow: 'hidden',
            backgroundColor: isWeb ? (theme.isDark ? '#0a0a0a' : '#E5E5EA') : theme.bg,
        }}>
            <View style={{ flex: 1, width: '100%', maxWidth: containerMaxWidth, alignSelf: 'center', backgroundColor: theme.bg, ...containerBorders }}>

                {/* HEADER */}
                <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>MESA DE OPERAÇÕES</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>{aluno?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={handleSaveDiet} disabled={data.isSaving} style={[styles.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                        {data.isSaving
                            ? <ActivityIndicator color="#000" size="small" />
                            : <MaterialCommunityIcons name="content-save-check" size={22} color="#000" />
                        }
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} enabled={!isWeb}>
                    <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim }} contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">

                        <DietHeaderWidgets
                            theme={theme}
                            currentMacros={actions.currentMacros}
                            macros={actions.macros}
                            pct={pct}
                            showRaioX={showRaioX}
                            setShowRaioX={setShowRaioX}
                            anamnese={data.anamnese}
                            handleGenerateAI={() => setModelSelectorVisible(true)}
                            isGenerating={data.isGenerating}
                            generateProgress={generateProgress}
                            setImportModalVisible={modals.setImportModalVisible}
                            activeDayType={actions.activeDayType}
                            activeAccent={activeAccent}
                        />

                        <View style={{ paddingHorizontal: 16 }}>
                            {/* 4 ABAS */}
                            <View style={styles.daysTabsContainer}>
                                {DAY_TABS.map(tab => {
                                    const isActive = actions.activeDayType === tab.key;
                                    const accent   = DAY_ACCENT[tab.key];
                                    const count    = actions.meals.filter(m => m.dayType === tab.key).length;
                                    return (
                                        <TouchableOpacity
                                            key={tab.key}
                                            style={[
                                                styles.dayTab,
                                                isActive
                                                    ? { backgroundColor: accent + '20', borderColor: accent }
                                                    : { backgroundColor: theme.surface, borderColor: theme.border },
                                            ]}
                                            onPress={() => { Haptics.selectionAsync(); actions.setActiveDayType(tab.key); }}
                                        >
                                            <MaterialCommunityIcons
                                                name={tab.icon} size={14}
                                                color={isActive ? accent : theme.textSecondary}
                                            />
                                            <Text style={{ color: isActive ? accent : theme.textSecondary, fontWeight: '900', fontSize: 9, marginTop: 3 }}>
                                                {tab.label}
                                            </Text>
                                            {count > 0 && (
                                                <View style={[styles.tabBadge, { backgroundColor: accent }]}>
                                                    <Text style={styles.tabBadgeText}>{count}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* REFEIÇÕES */}
                            {actions.visibleMeals.length === 0 ? (
                                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                    <View style={[styles.emptyIconBg, { backgroundColor: theme.surface }]}>
                                        <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={theme.textSecondary} />
                                    </View>
                                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Aba sem refeições</Text>
                                    <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                                        Clique em "GERAR COM IA" ou adicione manualmente.
                                    </Text>
                                </View>
                            ) : (
                                actions.visibleMeals.map(meal => (
                                    <MealCardAdmin
                                        key={meal.id}
                                        meal={meal}
                                        index={actions.visibleMeals.indexOf(meal)}
                                        totalMeals={actions.visibleMeals.length}
                                        theme={theme}
                                        toGrams={toGrams}
                                        handleOpenNameSelect={handleOpenNameSelect}
                                        handleOpenTimeSelect={handleOpenTimeSelect}
                                        handleDeleteMeal={actions.handleDeleteMeal}
                                        handleMoveMeal={actions.handleMoveMeal}
                                        handleUpdateFoodAmount={actions.handleUpdateFoodAmount}
                                        handleToggleUnit={actions.handleToggleUnit}
                                        handleDeleteFood={actions.handleDeleteFood}
                                        handleOpenSearch={handleOpenSearch}
                                        handleMealOptions={handleMealOptions}
                                        handleSwapBaseFood={handleSwapBaseFood}
                                        handleUpdateMeal={actions.handleUpdateMeal}
                                    />
                                ))
                            )}

                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                                <TouchableOpacity
                                    style={[styles.addMealBtn, { flex: 1, borderColor: activeAccent + '50', backgroundColor: activeAccent + '08' }]}
                                    onPress={() => handleActionPress(actions.handleAddMeal)}
                                    activeOpacity={0.75}
                                >
                                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color={activeAccent} />
                                    <Text style={[styles.addMealText, { color: activeAccent }]}>ADICIONAR REFEIÇÃO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.addMealBtn, { flex: 1, borderColor: '#FF3B3050', backgroundColor: '#FF3B3008' }]}
                                    onPress={() => handleActionPress(actions.handleClearDay)}
                                    activeOpacity={0.75}
                                >
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                    <Text style={[styles.addMealText, { color: '#FF3B30' }]}>LIMPAR ABA</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.ScrollView>
                </KeyboardAvoidingView>

                {/* FAB */}
                <View style={styles.fabContainer}>
                    <View style={[styles.fabPill, { backgroundColor: theme.isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)' }]}>
                        <TouchableOpacity style={styles.fabBtn} onPress={() => handleActionPress(() => modals.setModalCloneVisible(true))}>
                            <MaterialCommunityIcons name="account-switch-outline" size={22} color={theme.text} />
                            <Text style={[styles.fabText, { color: theme.text }]}>Clonar</Text>
                        </TouchableOpacity>
                        <View style={[styles.fabDivider, { backgroundColor: theme.border }]} />
                        <TouchableOpacity style={styles.fabBtn} onPress={() => handleActionPress(() => modals.setModalTemplatesVisible(true))}>
                            <MaterialCommunityIcons name="folder-star-outline" size={22} color={theme.text} />
                            <Text style={[styles.fabText, { color: theme.text }]}>Bases</Text>
                        </TouchableOpacity>
                        <View style={[styles.fabDivider, { backgroundColor: theme.border }]} />
                        <TouchableOpacity style={styles.fabBtn} onPress={() => handleActionPress(() => modals.setModalSaveTemplateVisible(true))}>
                            <MaterialCommunityIcons name="content-save-all" size={22} color={theme.text} />
                            <Text style={[styles.fabText, { color: theme.text }]}>Salvar</Text>
                        </TouchableOpacity>
                        <View style={[styles.fabDivider, { backgroundColor: theme.border }]} />
                        <TouchableOpacity style={styles.fabBtn} onPress={() => handleActionPress(handleCallGeneratePDF)}>
                            <MaterialCommunityIcons name="file-pdf-box" size={22} color={theme.text} />
                            <Text style={[styles.fabText, { color: theme.text }]}>PDF</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* MODAIS */}
                <DietModalsAdmin theme={theme} timeModalVisible={modals.timeModalVisible} setTimeModalVisible={modals.setTimeModalVisible} handleSelectTime={handleSelectTime} nameModalVisible={modals.nameModalVisible} setNameModalVisible={modals.setNameModalVisible} handleSelectName={handleSelectName} customNameModalVisible={modals.customNameModalVisible} setCustomNameModalVisible={modals.setCustomNameModalVisible} customNameInput={actions.customNameInput} setCustomNameInput={actions.setCustomNameInput} handleSaveCustomName={handleSaveCustomName} />
                <DietActionModals theme={theme} isWeb={isWeb} modalCloneVisible={modals.modalCloneVisible} setModalCloneVisible={modals.setModalCloneVisible} studentsList={data.studentsList} handleCloneFromStudent={handleCloneFromStudent} modalTemplatesVisible={modals.modalTemplatesVisible} setModalTemplatesVisible={modals.setModalTemplatesVisible} templatesList={data.templatesList} handleApplyTemplate={handleApplyTemplate} modalSaveTemplateVisible={modals.modalSaveTemplateVisible} setModalSaveTemplateVisible={modals.setModalSaveTemplateVisible} handleSaveAsTemplate={handleSaveAsTemplate} modalMealOptionsVisible={modals.modalMealOptionsVisible} setModalMealOptionsVisible={modals.setModalMealOptionsVisible} modalSaveMealVisible={modals.modalSaveMealVisible} setModalSaveMealVisible={modals.setModalSaveMealVisible} handleSaveMealTemplate={handleSaveMealTemplate} modalImportMealVisible={modals.modalImportMealVisible} setModalImportMealVisible={modals.setModalImportMealVisible} mealTemplatesList={data.mealTemplatesList} handleApplyMealTemplate={handleApplyMealTemplate} />

                <FoodSearchModal visible={modals.searchModalVisible} onClose={() => { modals.setSearchModalVisible(false); actions.setFoodToSwapId(null); actions.setActiveGroupId(null); }} onSelectFood={actions.handleAddFoodToMeal} targetGroup={actions.activeGroupId} theme={theme} initialCategoryFilter={initialCategoryFilter} />
                <SmartSubstituteModal visible={modals.smartModalVisible} onClose={() => { modals.setSmartModalVisible(false); actions.setFoodToSwapId(null); actions.setActiveGroupId(null); }} onSelectFood={actions.handleAddFoodToMeal} onManualSearch={handleSmartToManual} principalFood={actions.smartPrincipalFood} principalAmount={actions.smartPrincipalAmount} theme={theme} existingGroupItems={getExistingItemsInGroup()} />
                {modals.importModalVisible && <ImportDietModal visible={modals.importModalVisible} onClose={() => modals.setImportModalVisible(false)} theme={theme} onImportSuccess={handleImportSuccess} />}

                <ModelSelectorModal
                    visible={modelSelectorVisible}
                    theme={theme}
                    onClose={() => !data.isGenerating && setModelSelectorVisible(false)}
                    onGenerate={handleGenerateAI}
                    isGenerating={data.isGenerating}
                    generateProgress={generateProgress}
                    anamnese={data.anamnese}
                    aluno={aluno}
                />
            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', borderBottomWidth: 1, elevation: 5, zIndex: 10 },
    iconBtn: { padding: 9, borderRadius: 14, borderWidth: 1 },
    headerTitle: { fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },

    daysTabsContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    dayTab: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, position: 'relative', gap: 2 },
    tabBadge: { position: 'absolute', top: -6, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    tabBadgeText: { fontSize: 8, fontWeight: '900', color: '#000' },

    emptyBox: { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 1, borderRadius: 24 },
    emptyIconBg: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '900' },
    emptyDesc:  { fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 },

    addMealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1 },
    addMealText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },

    fabContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
    fabPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    fabBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    fabText: { fontSize: 9, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
    fabDivider: { width: 1, height: 24, marginHorizontal: 4, opacity: 0.5 },
});