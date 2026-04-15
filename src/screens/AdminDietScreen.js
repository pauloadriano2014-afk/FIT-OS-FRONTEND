// src/screens/AdminDietScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
    TextInput, Platform, Alert, KeyboardAvoidingView, Modal, FlatList,
    useWindowDimensions, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

import FoodSearchModal from '../components/FoodSearchModal';
import SmartSubstituteModal from '../components/SmartSubstituteModal';
// 🔥 NOVO: Modal isolado que vamos criar para ler o PDF
import ImportDietModal from '../components/ImportDietModal'; 

import { FOOD_DATABASE } from '../data/foodDatabase';
import { FOOD_PORTIONS } from '../data/foodPortions';

const UNITS = ['g', 'ml', 'unid', 'colher', 'fatia', 'xícara'];

const UNIT_GRAM_FACTOR = {
    'g': 1, 'ml': 1,
    'fatia': 25,    
    'unid': 50,     
    'colher': 15,   
    'xícara': 200,  
};

const toGrams = (amount, unit, food) => {
    const portions = food ? FOOD_PORTIONS[food.id] : null;
    const factor = portions?.[unit] ?? UNIT_GRAM_FACTOR[unit] ?? 1;
    return (parseFloat(amount) || 0) * factor;
};

const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
});

const MEAL_NAME_OPTIONS = [
    'Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde',
    'Pré-Treino', 'Pós-Treino', 'Jantar', 'Ceia', 'Personalizado'
];

export default function AdminDietScreen({ route, navigation }) {
    const { theme } = useTheme();

    const rawAluno = route.params?.aluno;
    const aluno = (typeof rawAluno === 'string' && rawAluno.startsWith('{')) 
        ? JSON.parse(rawAluno) 
        : rawAluno;

    const userId = (aluno?.id && aluno.id !== "[object Object]") 
        ? aluno.id 
        : route.params?.alunoId;

    const [anamnese, setAnamnese] = useState(null);
    const [showRaioX, setShowRaioX] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingDiet, setIsLoadingDiet] = useState(true);

    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [customNameModalVisible, setCustomNameModalVisible] = useState(false);
    const [smartModalVisible, setSmartModalVisible] = useState(false);
    
    // 🔥 NOVO: Estado para a Modal de Importação de PDF
    const [importModalVisible, setImportModalVisible] = useState(false);

    const [activeMealId, setActiveMealId] = useState(null);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [smartPrincipalFood, setSmartPrincipalFood] = useState(null);
    const [smartPrincipalAmount, setSmartPrincipalAmount] = useState('100');
    const [customNameInput, setCustomNameInput] = useState('');

    const [dietConfig, setDietConfig] = useState({ goal: 'Indefinido', water: '3 Litros', notes: 'Siga os horários descritos.' });
    const [meals, setMeals] = useState([]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!userId || String(userId).includes("object")) return;

            try {
                setIsLoadingDiet(true);
                
                const userRes = await fetch(`https://fitos-final.onrender.com/api/admin/user/${userId}?t=${Date.now()}`);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    const lastAnamnese = userData.anamneses?.length > 0 
                        ? userData.anamneses[userData.anamneses.length - 1] 
                        : null;
                    
                    setAnamnese(lastAnamnese); 
                    if (lastAnamnese) {
                        setDietConfig(prev => ({ ...prev, goal: lastAnamnese.objetivo || 'Hipertrofia' }));
                    }
                }

                const dietRes = await fetch(`https://fitos-final.onrender.com/api/admin/diet/${userId}?t=${Date.now()}`);
                
                if (dietRes.ok) {
                    const savedDiet = await dietRes.json();
                    if (savedDiet && savedDiet.meals) {
                        setDietConfig(prev => ({
                            goal: savedDiet.goal || prev.goal,
                            water: savedDiet.waterIntake || '3 Litros',
                            notes: savedDiet.generalNotes || 'Siga os horários descritos.'
                        }));

                        const loadedMeals = savedDiet.meals.map(meal => ({
                            id: meal.id?.toString(),
                            name: meal.name,
                            time: meal.time,
                            notes: meal.notes || '',
                            items: (meal.items || []).map(item => {
                                const originalFood = FOOD_DATABASE.find(f => f.name === item.name) || {};
                                return {
                                    ...originalFood,
                                    uniqueId: item.id?.toString(),
                                    groupId: item.substitutionGroupId || item.id?.toString(),
                                    name: item.name,
                                    amount: item.amount.toString(),
                                    unit: item.unit,
                                    p: item.protein ?? originalFood.p ?? 0,
                                    c: item.carbs ?? originalFood.c ?? 0,
                                    f: item.fats ?? originalFood.f ?? 0,
                                    calories_per_100: item.calories ?? originalFood.calories_per_100 ?? 0,
                                    base_unit: item.unit || originalFood.base_unit || 'g'
                                };
                            })
                        }));
                        setMeals(loadedMeals);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setIsLoadingDiet(false);
            }
        };

        fetchAllData();
    }, [userId]);

    const macros = useMemo(() => {
        if (!anamnese?.peso || !anamnese?.altura)
            return { tmb: 0, gastoTotal: 0, alvo: 0, proteinaAlvo: 0, carboAlvo: 0, fatAlvo: 0 };

        const peso = anamnese.peso;
        const altura = anamnese.altura;
        const idade = 30;
        const isHomem = aluno?.gender === 'M' || aluno?.gender === 'Masculino';

        let tmb = 10 * peso + 6.25 * altura - 5 * idade;
        tmb = isHomem ? tmb + 5 : tmb - 161;

        let fat = 1.2;
        if (anamnese.frequencia >= 1 && anamnese.frequencia <= 3) fat = 1.375;
        if (anamnese.frequencia >= 4 && anamnese.frequencia <= 5) fat = 1.55;
        if (anamnese.frequencia >= 6) fat = 1.725;

        const gastoTotal = tmb * fat;
        let alvo = gastoTotal;
        if (['Emagrecimento', 'Definição'].includes(anamnese.objetivo)) alvo -= 500;
        if (anamnese.objetivo === 'Hipertrofia') alvo += 300;

        const proteinaAlvo = Math.round(peso * 2.2);
        const fatAlvo = Math.round(peso * 1.0);
        const calRest = alvo - (proteinaAlvo * 4 + fatAlvo * 9);
        const carboAlvo = Math.max(0, Math.round(calRest / 4));

        return { tmb: Math.round(tmb), gastoTotal: Math.round(gastoTotal), alvo: Math.round(alvo), proteinaAlvo, carboAlvo, fatAlvo };
    }, [anamnese]);

    const currentMacros = useMemo(() => {
        let kcal = 0, prot = 0, carb = 0, fatG = 0;
        meals.forEach(meal => {
            const grouped = meal.items.reduce((acc, item) => {
                if (!acc[item.groupId]) acc[item.groupId] = [];
                acc[item.groupId].push(item);
                return acc;
            }, {});
            Object.values(grouped).forEach(group => {
                const item = group[0];
                const amt = toGrams(item.amount, item.unit, item); 
                kcal += ((item.calories_per_100 || 0) * amt) / 100;
                prot += ((item.p || 0) * amt) / 100;
                carb += ((item.c || 0) * amt) / 100;
                fatG += ((item.f || 0) * amt) / 100;
            });
        });
        return {
            kcal: Math.round(kcal), prot: Math.round(prot),
            carb: Math.round(carb), fat: Math.round(fatG)
        };
    }, [meals]);

    const handleAddMeal = () => setMeals(prev => [...prev, { id: Date.now().toString(), name: 'Selecione a Refeição', time: '07:00', notes: '', items: [] }]);
    const handleDeleteMeal = (mealId) => setMeals(prev => prev.filter(m => m.id !== mealId));
    const handleUpdateMeal = (mealId, field, value) => setMeals(prev => prev.map(m => m.id === mealId ? { ...m, [field]: value } : m));
    const handleOpenTimeSelect = (mealId) => { setActiveMealId(mealId); setTimeModalVisible(true); };
    const handleOpenNameSelect = (mealId) => { setActiveMealId(mealId); setNameModalVisible(true); };
    const handleSelectTime = (time) => { handleUpdateMeal(activeMealId, 'time', time); setTimeModalVisible(false); };

    const handleSelectName = (name) => {
        if (name === 'Personalizado') {
            setNameModalVisible(false);
            setCustomNameInput('');
            setCustomNameModalVisible(true);
        } else {
            handleUpdateMeal(activeMealId, 'name', name);
            setNameModalVisible(false);
        }
    };

    const handleSaveCustomName = () => {
        if (customNameInput.trim()) handleUpdateMeal(activeMealId, 'name', customNameInput.trim());
        setCustomNameModalVisible(false);
    };

    const handleOpenSearch = (mealId, groupId = null) => {
        setActiveMealId(mealId);
        setActiveGroupId(groupId);

        if (groupId !== null) {
            const meal = meals.find(m => m.id === mealId);
            const groupItems = meal?.items.filter(i => i.groupId === groupId) || [];
            if (groupItems.length > 0) {
                setSmartPrincipalFood(groupItems[0]);
                setSmartPrincipalAmount(groupItems[0].amount || '100');
                setSmartModalVisible(true);
                return;
            }
        }
        setSearchModalVisible(true);
    };

    const handleSmartToManual = () => {
        setSmartModalVisible(false);
        setSearchModalVisible(true);
    };

    const handleAddFoodToMeal = (food) => {
        setSearchModalVisible(false);
        setSmartModalVisible(false);
        const portions = FOOD_PORTIONS[food.id];
        const initialAmount = food.suggestedAmount ? food.suggestedAmount.toString() : (portions?.default_amount?.toString() || '100');
        const initialUnit = food.suggestedAmount ? (food.base_unit || 'g') : (portions?.default_unit || food.base_unit || 'g');

        setMeals(prev => prev.map(meal => {
            if (meal.id !== activeMealId) return meal;
            const newGroupId = activeGroupId || Date.now().toString();
            return {
                ...meal,
                items: [...meal.items, {
                    ...food,
                    uniqueId: Date.now().toString(),
                    groupId: newGroupId,
                    amount: initialAmount,
                    unit: initialUnit,
                }]
            };
        }));
        setActiveMealId(null);
        setActiveGroupId(null);
    };

    const handleUpdateFoodAmount = (mealId, foodUniqueId, newAmount) =>
        setMeals(prev => prev.map(meal => {
            if (meal.id !== mealId) return meal;
            return { ...meal, items: meal.items.map(item => item.uniqueId === foodUniqueId ? { ...item, amount: newAmount } : item) };
        }));

    const handleToggleUnit = (mealId, foodUniqueId) =>
        setMeals(prev => prev.map(meal => {
            if (meal.id !== mealId) return meal;
            return {
                ...meal,
                items: meal.items.map(item => {
                    if (item.uniqueId !== foodUniqueId) return item;
                    const next = (UNITS.indexOf(item.unit) + 1) % UNITS.length;
                    return { ...item, unit: UNITS[next] };
                })
            };
        }));

    const handleDeleteFood = (mealId, foodUniqueId) =>
        setMeals(prev => prev.map(meal => {
            if (meal.id !== mealId) return meal;
            return { ...meal, items: meal.items.filter(item => item.uniqueId !== foodUniqueId) };
        }));

    const handleGenerateAI = () => {
        // 🔥 GATILHO DA IA AQUI (Em breve conectamos com a API)
        Alert.alert('PA Coach AI', 'O módulo de geração inteligente será conectado na próxima etapa!');
    };

    const handleImportSuccess = (importedMeals) => {
        setMeals(importedMeals);
        setImportModalVisible(false);
        if (Platform.OS === 'web') window.alert("Dieta importada com sucesso!");
        else Alert.alert("Sucesso", "Dieta importada com sucesso!");
    };

    const handleSaveDiet = async () => {
        const userId = (aluno?.id && aluno.id !== "[object Object]") ? aluno.id : route.params?.alunoId;
        
        if (!userId || String(userId).includes("object")) {
            Alert.alert("Erro de Sincronização", "O ID do aluno se perdeu.");
            return;
        }
        if (meals.length === 0) return Alert.alert("Atenção", "Adicione pelo menos uma refeição.");

        setIsSaving(true);
        try {
            const payload = {
                userId: userId,
                name: `Plano Alimentar - ${dietConfig.goal}`,
                goal: dietConfig.goal,
                totalKcal: currentMacros.kcal,
                totalProtein: currentMacros.prot,
                totalCarbs: currentMacros.carb,
                totalFats: currentMacros.fat,
                waterIntake: dietConfig.water,
                generalNotes: dietConfig.notes,
                meals: meals 
            };

            const response = await fetch('https://fitos-final.onrender.com/api/admin/diet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.details || errData.error || "Falha na API ao salvar dieta");
            }

            if (Platform.OS === 'web') window.alert("🚀 Sucesso!\nDieta salva e liberada!");
            else Alert.alert("Sucesso! 🚀", "Dieta salva e liberada!");
            navigation.goBack(); 

        } catch (error) {
            console.error("Erro ao salvar:", error);
            Alert.alert("🚨 Erro Técnico no Banco", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const pct = (cur, target) => Math.min((cur / (target || 1)) * 100, 100);

    const isWeb = Platform.OS === 'web';
    const { height: windowHeight } = useWindowDimensions();
    const RootComponent = isWeb ? View : SafeAreaView;

    if (isLoadingDiet) {
        return (
            <RootComponent style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{color: theme.textSecondary, marginTop: 10}}>Carregando Mesa de Operações...</Text>
            </RootComponent>
        );
    }

    return (
        <RootComponent style={{ height: isWeb ? windowHeight : undefined, flex: isWeb ? undefined : 1, overflow: 'hidden', backgroundColor: isWeb ? (theme.isDark ? '#0a0a0a' : '#E5E5EA') : theme.bg }}>
            <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}>

                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>MESA DE OPERAÇÕES</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 1 }}>{aluno?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={handleSaveDiet} disabled={isSaving} style={[styles.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                        {isSaving ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" /> : <MaterialCommunityIcons name="content-save-check" size={22} color={theme.isDark ? '#000' : '#FFF'} />}
                    </TouchableOpacity>
                </View>

                <View style={[styles.dashboard, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    {[
                        { label: 'KCAL', cur: currentMacros.kcal, target: macros.alvo, unit: 'kcal', color: theme.accent },
                        { label: 'PROT', cur: currentMacros.prot, target: macros.proteinaAlvo, unit: 'g', color: '#32ADE6' },
                        { label: 'CARBO', cur: currentMacros.carb, target: macros.carboAlvo, unit: 'g', color: '#FFCC00' },
                        { label: 'GORD', cur: currentMacros.fat, target: macros.fatAlvo, unit: 'g', color: '#FF6B35' },
                    ].map(({ label, cur, target, unit, color }) => (
                        <View key={label} style={styles.macroCol}>
                            <Text style={[styles.macroLabel, { color: theme.textSecondary }]}>{label}</Text>
                            <Text style={[styles.macroVal, { color: cur >= target && target > 0 ? color : theme.text }]}>
                                {cur}<Text style={{ fontSize: 10, color: theme.textSecondary }}>{unit}</Text>
                            </Text>
                            <Text style={[styles.macroTarget, { color: theme.textSecondary }]}>/ {target}{unit}</Text>
                            <View style={[styles.progBg, { backgroundColor: theme.border }]}>
                                <View style={[styles.progFill, { backgroundColor: color, width: `${pct(cur, target)}%` }]} />
                            </View>
                        </View>
                    ))}
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, ...(isWeb ? { display: 'flex', flexDirection: 'column' } : {}) }} enabled={!isWeb}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }} scrollEnabled={true} nestedScrollEnabled={true}>

                        <TouchableOpacity
                            style={[styles.raioXHeader, { backgroundColor: theme.surface, borderColor: theme.border, borderBottomLeftRadius: showRaioX ? 0 : 14, borderBottomRightRadius: showRaioX ? 0 : 14 }]}
                            onPress={() => setShowRaioX(!showRaioX)}
                            activeOpacity={0.8}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.raioXIcon, { backgroundColor: theme.accent + '20' }]}>
                                    <MaterialCommunityIcons name="clipboard-pulse" size={16} color={theme.accent} />
                                </View>
                                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>RAIO-X DO ALUNO</Text>
                            </View>
                            <MaterialCommunityIcons name={showRaioX ? 'chevron-up' : 'chevron-down'} size={22} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {showRaioX && (
                            <View style={[styles.raioXBody, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                {anamnese ? (
                                    <>
                                        <View style={styles.rxGrid}>
                                            {[
                                                { l: 'OBJETIVO', v: anamnese.objetivo },
                                                { l: 'TMB', v: `${macros.tmb} kcal` },
                                                { l: 'GASTO TOTAL', v: `${macros.gastoTotal} kcal` },
                                                { l: 'REFEIÇÕES', v: `${anamnese.mealsPerDay || '?'}x / dia` },
                                            ].map(({ l, v }) => (
                                                <View key={l} style={styles.rxItem}>
                                                    <Text style={[styles.rxLabel, { color: theme.textSecondary }]}>{l}</Text>
                                                    <Text style={[styles.rxVal, { color: theme.text }]}>{v}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        <View style={[styles.rxTimeRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                            <MaterialCommunityIcons name="clock-outline" size={14} color={theme.accent} />
                                            {[
                                                { l: 'Acorda', v: anamnese.wakeUpTime || '--' },
                                                { l: 'Treina', v: anamnese.trainTime || '--' },
                                                { l: 'Dorme', v: anamnese.sleepTime || '--' },
                                            ].map(({ l, v }, i) => (
                                                <React.Fragment key={l}>
                                                    {i > 0 && <Text style={{ color: theme.border }}>·</Text>}
                                                    <Text style={[styles.rxTimeText, { color: theme.textSecondary }]}>
                                                        {l}: <Text style={{ color: theme.text, fontWeight: '700' }}>{v}</Text>
                                                    </Text>
                                                </React.Fragment>
                                            ))}
                                        </View>
                                        <View style={{ gap: 6, marginTop: 12 }}>
                                            {[
                                                { label: 'ALERGIAS', value: anamnese.allergies || 'Nenhuma', color: '#FF3B30' },
                                                { label: 'RESTRIÇÕES', value: anamnese.foodAversions || 'Nenhuma', color: '#FF9500' },
                                                { label: 'SUPLEMENTOS', value: anamnese.supplements || 'Nenhum', color: theme.accent },
                                            ].map(({ label, value, color }) => (
                                                <View key={label} style={[styles.rxAlertRow, { borderLeftColor: color, backgroundColor: color + '10' }]}>
                                                    <Text style={[styles.rxAlertLabel, { color }]}>{label}</Text>
                                                    <Text style={[styles.rxAlertVal, { color: theme.text }]}>{value}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </>
                                ) : (
                                    <Text style={{ color: theme.textSecondary, fontSize: 13, fontStyle: 'italic' }}>Nenhuma anamnese preenchida.</Text>
                                )}
                            </View>
                        )}

                        {/* 🔥 NOVOS BOTÕES DE ASSISTENTES (IA E PDF) 🔥 */}
                        <View style={styles.assistantRow}>
                            <TouchableOpacity style={[styles.assistantBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]} onPress={handleGenerateAI}>
                                <MaterialCommunityIcons name="robot-outline" size={20} color={theme.accent} />
                                <Text style={[styles.assistantBtnText, { color: theme.accent }]}>GERAR COM IA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.assistantBtn, { backgroundColor: '#32ADE6' + '15', borderColor: '#32ADE6' + '40' }]} onPress={() => setImportModalVisible(true)}>
                                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#32ADE6" />
                                <Text style={[styles.assistantBtnText, { color: '#32ADE6' }]}>IMPORTAR PDF</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 24 }}>
                            <View style={styles.sectionRow}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>PRESCRIÇÃO</Text>
                                <View style={[styles.tacoBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
                                    <Text style={[styles.tacoBadgeText, { color: theme.accent }]}>BASE TACO</Text>
                                </View>
                            </View>

                            {meals.length === 0 ? (
                                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={38} color={theme.textSecondary} />
                                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma refeição</Text>
                                    <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Clique em "Adicionar Refeição" ou importe um PDF.</Text>
                                </View>
                            ) : (
                                meals.map(meal => {
                                    const grouped = meal.items.reduce((acc, item) => {
                                        if (!acc[item.groupId]) acc[item.groupId] = [];
                                        acc[item.groupId].push(item);
                                        return acc;
                                    }, {});

                                    const mealKcal = Object.values(grouped).reduce((sum, grp) => {
                                        const item = grp[0];
                                        return sum + ((item.calories_per_100 || 0) * toGrams(item.amount, item.unit, item)) / 100;
                                    }, 0);

                                    return (
                                        <View key={meal.id} style={[styles.mealCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={styles.mealHeader}>
                                                <TouchableOpacity style={{ flex: 1 }} onPress={() => handleOpenNameSelect(meal.id)}>
                                                    <Text style={[styles.mealName, { color: theme.text }]}>{meal.name}</Text>
                                                    <Text style={[styles.mealKcal, { color: theme.accent }]}>{Math.round(mealKcal)} kcal total</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.timePill, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                                    onPress={() => handleOpenTimeSelect(meal.id)}
                                                >
                                                    <MaterialCommunityIcons name="clock-outline" size={13} color={theme.textSecondary} />
                                                    <Text style={[styles.timePillText, { color: theme.text }]}>{meal.time}</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity onPress={() => handleDeleteMeal(meal.id)} style={styles.deleteMealBtn}>
                                                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                                                </TouchableOpacity>
                                            </View>

                                            <View style={[styles.mealDivider, { backgroundColor: theme.border }]} />

                                            {Object.values(grouped).map(group => {
                                                const principal = group[0];
                                                const pAmt = toGrams(principal.amount, principal.unit, principal);
                                                const pKcal = ((principal.calories_per_100 || 0) * pAmt) / 100;
                                                const pProt = ((principal.p || 0) * pAmt) / 100;
                                                const pCarb = ((principal.c || 0) * pAmt) / 100;
                                                const pFat = ((principal.f || 0) * pAmt) / 100;

                                                return (
                                                    <View key={principal.groupId} style={[styles.groupBox, { borderColor: theme.border + '80' }]}>
                                                        {group.map((food, fIdx) => {
                                                            const isSub = fIdx > 0;
                                                            const fAmt = toGrams(food.amount, food.unit, food);
                                                            const fKcal = ((food.calories_per_100 || 0) * fAmt) / 100;
                                                            const fProt = ((food.p || 0) * fAmt) / 100;
                                                            const fCarb = ((food.c || 0) * fAmt) / 100;
                                                            const fFat = ((food.f || 0) * fAmt) / 100;

                                                            const dKcal = isSub ? Math.round(fKcal - pKcal) : 0;
                                                            const dProt = isSub ? Math.round(fProt - pProt) : 0;
                                                            const dCarb = isSub ? Math.round(fCarb - pCarb) : 0;
                                                            const dFat = isSub ? Math.round(fFat - pFat) : 0;
                                                            const isPerf = isSub && dKcal === 0 && dProt === 0 && dCarb === 0 && dFat === 0;

                                                            return (
                                                                <React.Fragment key={food.uniqueId}>
                                                                    {isSub && (
                                                                        <View style={styles.ouRow}>
                                                                            <View style={[styles.ouLine, { backgroundColor: theme.border }]} />
                                                                            <View style={[styles.ouBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
                                                                                <Text style={[styles.ouText, { color: theme.accent }]}>OU</Text>
                                                                            </View>
                                                                            <View style={[styles.ouLine, { backgroundColor: theme.border }]} />
                                                                        </View>
                                                                    )}

                                                                    <View style={[styles.foodRow, isSub && { backgroundColor: theme.bg, borderRadius: 10, padding: 8 }]}>
                                                                        <View style={{ flex: 1, paddingRight: 8 }}>
                                                                            <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={2}>
                                                                                {food.name}
                                                                            </Text>
                                                                            <Text style={[styles.foodKcal, { color: theme.accent }]}>
                                                                                {Math.round(fKcal)} kcal
                                                                            </Text>
                                                                            {isSub && !isPerf && (
                                                                                <View style={styles.diffRow}>
                                                                                    {dKcal !== 0 && <Text style={[styles.diffChip, { color: dKcal > 0 ? '#FF3B30' : '#32ADE6' }]}>{dKcal > 0 ? '▲' : '▼'} {Math.abs(dKcal)} kcal</Text>}
                                                                                    {dProt !== 0 && <Text style={[styles.diffChip, { color: dProt > 0 ? '#FF3B30' : '#32ADE6' }]}>{dProt > 0 ? '▲' : '▼'} {Math.abs(dProt)}P</Text>}
                                                                                    {dCarb !== 0 && <Text style={[styles.diffChip, { color: dCarb > 0 ? '#FF3B30' : '#32ADE6' }]}>{dCarb > 0 ? '▲' : '▼'} {Math.abs(dCarb)}C</Text>}
                                                                                    {dFat !== 0 && <Text style={[styles.diffChip, { color: dFat > 0 ? '#FF3B30' : '#32ADE6' }]}>{dFat > 0 ? '▲' : '▼'} {Math.abs(dFat)}G</Text>}
                                                                                </View>
                                                                            )}
                                                                            {isPerf && (
                                                                                <Text style={{ fontSize: 10, color: '#34C759', fontWeight: '700', marginTop: 3 }}>✓ Equivalente Perfeito</Text>
                                                                            )}
                                                                        </View>

                                                                        <View style={styles.amountBox}>
                                                                            <TextInput
                                                                                style={[styles.amountInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                                                                value={food.amount.toString()}
                                                                                onChangeText={val => handleUpdateFoodAmount(meal.id, food.uniqueId, val)}
                                                                                keyboardType="numeric"
                                                                                maxLength={5}
                                                                            />
                                                                            <TouchableOpacity
                                                                                onPress={() => handleToggleUnit(meal.id, food.uniqueId)}
                                                                                style={[styles.unitBtn, { borderColor: theme.border }]}
                                                                            >
                                                                                <Text style={[styles.unitText, { color: theme.textSecondary }]}>{food.unit}</Text>
                                                                            </TouchableOpacity>
                                                                        </View>

                                                                        <TouchableOpacity onPress={() => handleDeleteFood(meal.id, food.uniqueId)} style={styles.deleteBtn}>
                                                                            <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </React.Fragment>
                                                            );
                                                        })}

                                                        <TouchableOpacity
                                                            style={[styles.subBtn, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '08' }]}
                                                            onPress={() => handleOpenSearch(meal.id, principal.groupId)}
                                                        >
                                                            <MaterialCommunityIcons name="swap-horizontal" size={14} color={theme.accent} />
                                                            <Text style={[styles.subBtnText, { color: theme.accent }]}>Adicionar Substituição (OU)</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                );
                                            })}

                                            <TouchableOpacity
                                                style={[styles.addFoodBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                                onPress={() => handleOpenSearch(meal.id, null)}
                                            >
                                                <MaterialCommunityIcons name="plus" size={15} color={theme.textSecondary} />
                                                <Text style={[styles.addFoodText, { color: theme.textSecondary }]}>ADICIONAR ALIMENTO</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })
                            )}

                            <TouchableOpacity
                                style={[styles.addMealBtn, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '08' }]}
                                onPress={handleAddMeal}
                                activeOpacity={0.75}
                            >
                                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.accent} />
                                <Text style={[styles.addMealText, { color: theme.accent }]}>ADICIONAR REFEIÇÃO</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* ── MODAIS EXTERNOS ── */}
                <FoodSearchModal visible={searchModalVisible} onClose={() => setSearchModalVisible(false)} onSelectFood={handleAddFoodToMeal} targetGroup={activeGroupId} theme={theme} />
                <SmartSubstituteModal visible={smartModalVisible} onClose={() => setSmartModalVisible(false)} onSelectFood={handleAddFoodToMeal} onManualSearch={handleSmartToManual} principalFood={smartPrincipalFood} principalAmount={smartPrincipalAmount} theme={theme} />
                
                {/* 🔥 NOVO: Modal de Importação conectada aqui! */}
                {importModalVisible && (
                    <ImportDietModal 
                        visible={importModalVisible} 
                        onClose={() => setImportModalVisible(false)} 
                        theme={theme} 
                        onImportSuccess={handleImportSuccess} 
                    />
                )}

                {/* ── MODAIS INTERNOS SIMPLES ── */}
                <Modal visible={timeModalVisible} transparent animationType="fade" onRequestClose={() => setTimeModalVisible(false)}>
                    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setTimeModalVisible(false)}>
                        <View style={[styles.listModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={[styles.listModalHandle, { backgroundColor: theme.border }]} />
                            <Text style={[styles.listModalTitle, { color: theme.text }]}>HORÁRIO</Text>
                            <FlatList data={TIME_OPTIONS} keyExtractor={i => i} showsVerticalScrollIndicator={false} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listOption, { borderBottomColor: theme.border }]} onPress={() => handleSelectTime(item)}>
                                    <Text style={{ color: theme.text, fontSize: 15, textAlign: 'center' }}>{item}</Text>
                                </TouchableOpacity>
                            )} />
                        </View>
                    </TouchableOpacity>
                </Modal>

                <Modal visible={nameModalVisible} transparent animationType="fade" onRequestClose={() => setNameModalVisible(false)}>
                    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setNameModalVisible(false)}>
                        <View style={[styles.listModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={[styles.listModalHandle, { backgroundColor: theme.border }]} />
                            <Text style={[styles.listModalTitle, { color: theme.text }]}>TIPO DE REFEIÇÃO</Text>
                            <FlatList data={MEAL_NAME_OPTIONS} keyExtractor={i => i} showsVerticalScrollIndicator={false} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listOption, { borderBottomColor: theme.border }]} onPress={() => handleSelectName(item)}>
                                    <Text style={{ color: item === 'Personalizado' ? theme.accent : theme.text, fontSize: 15, textAlign: 'center', fontWeight: item === 'Personalizado' ? '800' : 'normal' }}>{item}</Text>
                                </TouchableOpacity>
                            )} />
                        </View>
                    </TouchableOpacity>
                </Modal>

                <Modal visible={customNameModalVisible} transparent animationType="fade" onRequestClose={() => setCustomNameModalVisible(false)}>
                    <View style={styles.overlay}>
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center', padding: 20 }}>
                            <View style={[styles.customBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.listModalTitle, { color: theme.text, marginBottom: 16 }]}>NOME PERSONALIZADO</Text>
                                <TextInput style={[styles.customInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} value={customNameInput} onChangeText={setCustomNameInput} placeholder="Ex: Pós-Treino Líquido" placeholderTextColor={theme.textSecondary} autoFocus />
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                                    <TouchableOpacity style={[styles.customBtn, { borderColor: theme.border }]} onPress={() => setCustomNameModalVisible(false)}><Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancelar</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.customBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={handleSaveCustomName}><Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '800' }}>Salvar</Text></TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', borderBottomWidth: 1 },
    iconBtn: { padding: 9, borderRadius: 12, borderWidth: 1 },
    headerTitle: { fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
    dashboard: { flexDirection: 'row', padding: 16, gap: 8, borderBottomWidth: 1 },
    macroCol: { flex: 1 },
    macroLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginBottom: 3 },
    macroVal: { fontSize: 15, fontWeight: '900', marginBottom: 1 },
    macroTarget: { fontSize: 9, marginBottom: 5 },
    progBg: { height: 3, borderRadius: 2, overflow: 'hidden' },
    progFill: { height: '100%', borderRadius: 2 },
    raioXHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderWidth: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
    raioXIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 14 },
    raioXBody: { padding: 14, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
    rxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    rxItem: { width: '47%' },
    rxLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
    rxVal: { fontSize: 13, fontWeight: '800' },
    rxTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, flexWrap: 'wrap' },
    rxTimeText: { fontSize: 11 },
    rxAlertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 8, borderLeftWidth: 3 },
    rxAlertLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, width: 90 },
    rxAlertVal: { fontSize: 12, flex: 1 },
    
    assistantRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    assistantBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
    assistantBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    btnIA: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 14 },
    btnIALeft: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    btnIATitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    btnIASub: { fontSize: 11, marginTop: 2 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    tacoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    tacoBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    emptyBox: { alignItems: 'center', padding: 36, borderStyle: 'dashed', borderWidth: 1, borderRadius: 16 },
    emptyTitle: { fontSize: 15, fontWeight: '800', marginTop: 12 },
    emptyDesc: { fontSize: 12, marginTop: 4, textAlign: 'center' },
    mealCard: { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    mealHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    mealName: { fontSize: 16, fontWeight: '900', marginBottom: 2 },
    mealKcal: { fontSize: 11, fontWeight: '600' },
    timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, marginLeft: 10 },
    timePillText: { fontSize: 12, fontWeight: '800' },
    deleteMealBtn: { padding: 8, marginLeft: 6 },
    mealDivider: { height: 1, marginHorizontal: 16 },
    groupBox: { marginHorizontal: 12, marginTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderStyle: 'dashed' },
    foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    foodName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    foodKcal: { fontSize: 11, fontWeight: '700' },
    diffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 3 },
    diffChip: { fontSize: 9, fontWeight: '800' },
    amountBox: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
    amountInput: { width: 52, paddingVertical: 7, paddingHorizontal: 4, borderRadius: 9, borderWidth: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', outlineStyle: 'none' },
    unitBtn: { paddingHorizontal: 6, paddingVertical: 7, borderRadius: 9, borderWidth: 1, marginLeft: 4, alignItems: 'center' },
    unitText: { fontSize: 9, fontWeight: '800' },
    deleteBtn: { padding: 8, marginLeft: 2 },
    ouRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    ouLine: { flex: 1, height: 1 },
    ouBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 1, marginHorizontal: 8 },
    ouText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    subBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, marginTop: 8, alignSelf: 'flex-start' },
    subBtnText: { fontSize: 11, fontWeight: '700' },
    addFoodBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 12, marginTop: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
    addFoodText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    addMealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 4 },
    addMealText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    listModal: { width: '100%', maxWidth: 360, maxHeight: '65%', borderRadius: 20, borderWidth: 1, paddingVertical: 16 },
    listModalHandle: { width: 36, height: 3, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
    listModalTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center', marginBottom: 8 },
    listOption: { paddingVertical: 14, borderBottomWidth: 1 },
    customBox: { width: '100%', maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 20 },
    customInput: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    customBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});