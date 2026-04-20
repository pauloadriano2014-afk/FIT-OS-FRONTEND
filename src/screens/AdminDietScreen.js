// src/screens/AdminDietScreen.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
    Platform, Alert, KeyboardAvoidingView, useWindowDimensions, ActivityIndicator,
    Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

import DietHeaderWidgets from '../components/AdminDiet/DietHeaderWidgets';
import MealCardAdmin from '../components/AdminDiet/MealCardAdmin';
import DietModalsAdmin from '../components/AdminDiet/DietModalsAdmin';
import DietActionModals from '../components/AdminDiet/DietActionModals'; 

import FoodSearchModal from '../components/FoodSearchModal';
import SmartSubstituteModal from '../components/SmartSubstituteModal';
import ImportDietModal from '../components/ImportDietModal'; 

import { FOOD_DATABASE } from '../data/foodDatabase';
import { FOOD_PORTIONS } from '../data/foodPortions';

const UNITS = ['g', 'ml', 'unid', 'colher', 'fatia', 'xícara'];
const UNIT_GRAM_FACTOR = { 'g': 1, 'ml': 1, 'fatia': 25, 'unid': 50, 'colher': 15, 'xícara': 200 };

const toGrams = (amount, unit, food) => {
    const portions = food ? FOOD_PORTIONS[food.id] : null;
    const factor = portions?.[unit] ?? UNIT_GRAM_FACTOR[unit] ?? 1;
    return (parseFloat(amount) || 0) * factor;
};

export default function AdminDietScreen({ route, navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const { height: windowHeight } = useWindowDimensions();
    const RootComponent = isWeb ? View : SafeAreaView;

    const rawAluno = route.params?.aluno;
    const aluno = (typeof rawAluno === 'string' && rawAluno.startsWith('{')) ? JSON.parse(rawAluno) : rawAluno;
    const userId = (aluno?.id && aluno.id !== "[object Object]") ? aluno.id : route.params?.alunoId;

    const [anamnese, setAnamnese] = useState({}); 
    const [showRaioX, setShowRaioX] = useState(false); 
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingDiet, setIsLoadingDiet] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false); 

    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [customNameModalVisible, setCustomNameModalVisible] = useState(false);
    const [smartModalVisible, setSmartModalVisible] = useState(false);
    const [importModalVisible, setImportModalVisible] = useState(false);

    const [modalCloneVisible, setModalCloneVisible] = useState(false);
    const [modalTemplatesVisible, setModalTemplatesVisible] = useState(false);
    const [modalSaveTemplateVisible, setModalSaveTemplateVisible] = useState(false);
    
    const [modalMealOptionsVisible, setModalMealOptionsVisible] = useState(false);
    const [modalSaveMealVisible, setModalSaveMealVisible] = useState(false);
    const [modalImportMealVisible, setModalImportMealVisible] = useState(false);
    const [selectedMealForAction, setSelectedMealForAction] = useState(null);

    const [studentsList, setStudentsList] = useState([]);
    const [templatesList, setTemplatesList] = useState([]);
    const [mealTemplatesList, setMealTemplatesList] = useState([]);

    const [activeMealId, setActiveMealId] = useState(null);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [smartPrincipalFood, setSmartPrincipalFood] = useState(null);
    const [smartPrincipalAmount, setSmartPrincipalAmount] = useState('100');
    const [customNameInput, setCustomNameInput] = useState('');

    const [dietConfig, setDietConfig] = useState({ goal: 'Indefinido', water: '3 Litros', notes: 'Siga os horários descritos.' });
    const [meals, setMeals] = useState([]);
    
    // 🔥 ABAS SIMPLIFICADAS: Remove o 'PADRÃO' redundante
    const [activeDayType, setActiveDayType] = useState('TREINO'); 

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const enrichMealsWithDatabase = (mealsArray) => {
        return mealsArray.map(meal => ({
            ...meal,
            // 🔥 REMOVIDA a conversão forçada aqui. Deixamos o dia que vier ou vazio.
            items: meal.items.map(item => {
                let query = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                if (query.endsWith('s')) query = query.slice(0, -1);
                let dbFood = FOOD_DATABASE.find(f => {
                    const dbName = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    return dbName === query || dbName.includes(query) || query.includes(dbName);
                });
                if (!dbFood) {
                    const firstWord = query.split(' ')[0];
                    if (firstWord.length > 2) {
                        dbFood = FOOD_DATABASE.find(f => f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(firstWord));
                    }
                }
                let unitClean = (item.unit || 'g').toLowerCase().replace(/s$/, '');
                if (unitClean.includes('unid')) unitClean = 'unid';
                else if (unitClean.includes('fatia')) unitClean = 'fatia';
                else if (unitClean.includes('colher')) unitClean = 'colher';
                else if (unitClean.includes('xic') || unitClean.includes('xíc')) unitClean = 'xícara';

                return {
                    ...item,
                    p: dbFood ? (dbFood.p ?? dbFood.protein ?? 0) : (item.p ?? item.protein ?? 0),
                    c: dbFood ? (dbFood.c ?? dbFood.carbs ?? 0) : (item.c ?? item.carbs ?? 0),
                    f: dbFood ? (dbFood.f ?? dbFood.fats ?? 0) : (item.f ?? item.fats ?? 0),
                    calories_per_100: dbFood ? (dbFood.calories_per_100 ?? dbFood.calories ?? 0) : (item.calories_per_100 ?? item.calories ?? 0),
                    name: dbFood ? dbFood.name : item.name, 
                    unit: unitClean
                };
            })
        }));
    };

    useEffect(() => {
        const fetchAllData = async () => {
            if (!userId || String(userId).includes("object")) return;
            try {
                setIsLoadingDiet(true);
                
                const userRes = await fetch(`https://fitos-final.onrender.com/api/admin/user/${userId}?t=${Date.now()}`);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    const lastAnamnese = userData.anamneses?.length > 0 ? userData.anamneses[userData.anamneses.length - 1] : {};
                    setAnamnese(lastAnamnese); 
                    if (lastAnamnese.objetivo) setDietConfig(prev => ({ ...prev, goal: lastAnamnese.objetivo }));
                }

                const dietRes = await fetch(`https://fitos-final.onrender.com/api/admin/diet/${userId}?t=${Date.now()}`);
                if (dietRes.ok) {
                    const savedDiet = await dietRes.json();
                    if (savedDiet && savedDiet.meals) {
                        setDietConfig({ 
                            goal: savedDiet.goal || 'Indefinido', 
                            water: savedDiet.waterIntake || '3 Litros', 
                            notes: savedDiet.generalNotes || '' 
                        });

                        const loadedMeals = savedDiet.meals.map(meal => ({
                            ...meal,
                            id: meal.id.toString(),
                            // Carrega a aba exata (ou corrige o fantasma do PADRÃO se houver)
                            dayType: (meal.dayType === 'PADRÃO' || !meal.dayType) ? 'TREINO' : meal.dayType,
                            items: (meal.items || []).map(item => ({
                                ...item,
                                uniqueId: item.id.toString(),
                                groupId: item.substitutionGroupId || item.id.toString(),
                                amount: item.amount.toString()
                            }))
                        }));
                        setMeals(loadedMeals);
                    }
                }

                const [studentsRes, templatesRes, mealTempRes] = await Promise.all([
                    fetch('https://fitos-final.onrender.com/api/admin/user'),
                    fetch('https://fitos-final.onrender.com/api/admin/diet-templates'),
                    fetch('https://fitos-final.onrender.com/api/admin/meal-templates')
                ]);
                
                if (studentsRes.ok) {
                    const sData = await studentsRes.json();
                    setStudentsList(sData.users || sData || []);
                }
                if (templatesRes.ok) {
                    const tData = await templatesRes.json();
                    setTemplatesList(tData.templates || tData || []);
                }
                if (mealTempRes.ok) {
                    const mData = await mealTempRes.json();
                    setMealTemplatesList(mData.templates || []);
                }

                Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setIsLoadingDiet(false);
            }
        };
        fetchAllData();
    }, [userId]);

    const handleCloneFromStudent = async (sourceStudentId) => {
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/diet/${sourceStudentId}?t=${Date.now()}`);
            if (!res.ok) throw new Error("Dieta não encontrada");
            const data = await res.json();
            if (data && data.meals) {
                const enriched = enrichMealsWithDatabase(data.meals);
                setMeals(enriched);
                if (Platform.OS === 'web') window.alert("Dieta clonada com sucesso!");
                else Alert.alert("Sucesso", "Dieta clonada com sucesso!");
            }
        } catch (e) {
            Alert.alert("Erro", "Não foi possível clonar a dieta desse aluno.");
        }
    };

    const handleApplyTemplate = (template) => {
        try {
            const parsedMeals = typeof template.meals === 'string' ? JSON.parse(template.meals) : template.meals;
            
            // 🔥 REGRA DO COACH: O que você importar, vai pra aba que você está olhando.
            const mapped = parsedMeals.map(m => ({
                ...m,
                id: Math.random().toString(),
                dayType: activeDayType 
            }));

            const enriched = enrichMealsWithDatabase(mapped);
            
            // 🔥 LIMPEZA CIRÚRGICA: Apaga as refeições velhas DAQUELA ABA e injeta as novas.
            setMeals(prev => {
                const outrasAbas = prev.filter(m => m.dayType !== activeDayType);
                return [...outrasAbas, ...enriched];
            });

            if (Platform.OS === 'web') window.alert(`Base aplicada com sucesso no DIA DE ${activeDayType}!`);
            else Alert.alert("Sucesso", `Base aplicada no ${activeDayType}!`);
        } catch(e) {
            Alert.alert("Erro", "Falha ao aplicar modelo.");
        }
    };

    const handleSaveAsTemplate = async (templateName) => {
        try {
            const payload = {
                name: templateName, goal: dietConfig.goal, totalKcal: currentMacros.kcal, meals: meals
            };
            const res = await fetch('https://fitos-final.onrender.com/api/admin/diet-templates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Falha ao guardar modelo");
            
            const newTemplate = await res.json();
            setTemplatesList(prev => [newTemplate, ...prev]);

            if (Platform.OS === 'web') window.alert("Modelo guardado com sucesso!");
            else Alert.alert("Sucesso", "Modelo guardado no seu cofre!");
        } catch(e) {
            Alert.alert("Erro", "Falha ao guardar modelo.");
        }
    };

    const handleMealOptions = (mealId, mealName) => {
        setSelectedMealForAction({ id: mealId, name: mealName });
        setModalMealOptionsVisible(true);
    };

    const handleSaveMealTemplate = async (templateName) => {
        const mealToSave = meals.find(m => m.id === selectedMealForAction.id);
        if (!mealToSave) return;
        try {
            const payload = { name: templateName, category: mealToSave.name, items: mealToSave.items };
            const res = await fetch('https://fitos-final.onrender.com/api/admin/meal-templates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Falha ao guardar modelo de refeição");
            
            const newTemp = await res.json();
            setMealTemplatesList(prev => [newTemp, ...prev]);

            if (Platform.OS === 'web') window.alert("Refeição guardada como modelo!");
            else Alert.alert("Sucesso", "Refeição guardada como modelo!");
        } catch(e) {
            Alert.alert("Erro", "Falha ao guardar modelo de refeição.");
        }
    };

    const handleApplyMealTemplate = (template) => {
        try {
            const parsedItems = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            setMeals(prev => prev.map(m => {
                if (m.id === selectedMealForAction.id) {
                    return { ...m, name: template.category || m.name, items: parsedItems };
                }
                return m;
            }));
            
            if (Platform.OS === 'web') window.alert("Modelo aplicado com sucesso!");
            else Alert.alert("Sucesso", "Modelo aplicado com sucesso!");
        } catch(e) {
            Alert.alert("Erro", "Falha ao importar o modelo de refeição.");
        }
    };

    const visibleMeals = useMemo(() => {
        return meals.filter(m => m.dayType === activeDayType);
    }, [meals, activeDayType]);

    const macros = useMemo(() => {
        if (!anamnese?.peso || !anamnese?.altura) return { tmb: 0, gastoTotal: 0, alvo: 0, proteinaAlvo: 0, carboAlvo: 0, fatAlvo: 0 };
        const peso = anamnese.peso, altura = anamnese.altura, idade = 30, isHomem = aluno?.gender === 'M' || aluno?.gender === 'Masculino';
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
    }, [anamnese, aluno]);

    const currentMacros = useMemo(() => {
        let kcal = 0, prot = 0, carb = 0, fatG = 0;
        visibleMeals.forEach(meal => {
            const grouped = meal.items.reduce((acc, item) => {
                if (!acc[item.groupId]) acc[item.groupId] = [];
                acc[item.groupId].push(item);
                return acc;
            }, {});
            Object.values(grouped).forEach(group => {
                const item = group[0];
                if(!item) return;
                const amt = toGrams(item.amount, item.unit, item); 
                kcal += ((item.calories_per_100 || 0) * amt) / 100;
                prot += ((item.p || 0) * amt) / 100;
                carb += ((item.c || 0) * amt) / 100;
                fatG += ((item.f || 0) * amt) / 100;
            });
        });
        return { kcal: Math.round(kcal), prot: Math.round(prot), carb: Math.round(carb), fat: Math.round(fatG) };
    }, [visibleMeals]);

    const handleAddMeal = () => setMeals(prev => [...prev, { id: Date.now().toString(), name: 'Selecione a Refeição', time: '07:00', notes: '', items: [], dayType: activeDayType }]);
    const handleDeleteMeal = (mealId) => setMeals(prev => prev.filter(m => m.id !== mealId));
    
    // 🔥 Função nova para você limpar os "fantasmas" que se acumularam nos testes passados
    const handleClearDay = () => {
        if (Platform.OS === 'web') {
            if (window.confirm(`ATENÇÃO: Você quer apagar todas as refeições do DIA DE ${activeDayType}? Isso vai zerar as macros dessa aba.`)) {
                setMeals(prev => prev.filter(m => m.dayType !== activeDayType));
            }
        } else {
            Alert.alert("Limpar Dia", `ATENÇÃO: Deseja apagar as refeições de ${activeDayType}?`, [
                { text: "Cancelar", style: "cancel" },
                { text: "Apagar Tudo", style: "destructive", onPress: () => {
                    setMeals(prev => prev.filter(m => m.dayType !== activeDayType));
                }}
            ]);
        }
    };

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
                items: [...meal.items, { ...food, uniqueId: Date.now().toString(), groupId: newGroupId, amount: initialAmount, unit: initialUnit }]
            };
        }));
        setActiveMealId(null);
        setActiveGroupId(null);
    };

    const handleUpdateFoodAmount = (mealId, foodUniqueId, newAmount) => {
        setMeals(prev => prev.map(meal => {
            if (meal.id !== mealId) return meal;

            const targetFood = meal.items.find(item => item.uniqueId === foodUniqueId);
            if (!targetFood) return meal;

            const isBase = meal.items.findIndex(i => i.groupId === targetFood.groupId) === meal.items.indexOf(targetFood);
            const newAmountNum = parseFloat(newAmount) || 0;

            if (isBase) {
                const targetGrams = toGrams(newAmountNum, targetFood.unit, targetFood);
                const targetTotalKcal = ((parseFloat(targetFood.calories_per_100) || 0) * targetGrams) / 100;

                return { 
                    ...meal, 
                    items: meal.items.map(item => {
                        if (item.uniqueId === foodUniqueId) return { ...item, amount: newAmount };
                        
                        if (item.groupId === targetFood.groupId) {
                            const itemKcalPer100 = parseFloat(item.calories_per_100) || 1;
                            const neededGrams = (targetTotalKcal * 100) / itemKcalPer100;
                            const factor = (FOOD_PORTIONS[item.id]?.[item.unit]) ?? UNIT_GRAM_FACTOR[item.unit] ?? 1;
                            
                            return { ...item, amount: Math.round(neededGrams / factor).toString() };
                        }
                        return item;
                    }) 
                };
            }

            return { 
                ...meal, 
                items: meal.items.map(item => 
                    item.uniqueId === foodUniqueId ? { ...item, amount: newAmount } : item
                ) 
            };
        }));
    };

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

    const handleSwapBaseFood = (mealId, oldBaseFood) => {
        setActiveMealId(mealId);
        setActiveGroupId(oldBaseFood.groupId);
        setMeals(prev => prev.map(m => m.id === mealId ? { ...m, items: m.items.filter(i => i.uniqueId !== oldBaseFood.uniqueId) } : m));
        setSearchModalVisible(true);
    };

    const handleGenerateAI = async () => {
        if (!anamnese || Object.keys(anamnese).length === 0) {
            const msg = "O aluno precisa preencher a anamnese primeiro para a IA gerar o plano.";
            return Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Atenção", msg);
        }
        setIsGenerating(true);
        try {
            const response = await fetch('https://fitos-final.onrender.com/api/admin/generate-diet', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ anamnese })
            });
            if (!response.ok) throw new Error("Falha ao comunicar com a IA.");
            const data = await response.json();
            if (data.meals && data.meals.length > 0) {
                const newMeals = enrichMealsWithDatabase(data.meals).map(m => ({...m, dayType: 'TREINO'}));
                setMeals(newMeals);
                setActiveDayType('TREINO'); 
                const succMsg = "O PA Coach AI estruturou a dieta na Mesa de Operações. Revise e guarde!";
                if (Platform.OS === 'web') window.alert("Estratégia Pronta!\n" + succMsg);
                else Alert.alert("Estratégia Pronta!", succMsg);
            } else {
                const warnMsg = "A IA não conseguiu gerar a dieta neste momento.";
                if (Platform.OS === 'web') window.alert("Aviso: " + warnMsg);
                else Alert.alert("Aviso", warnMsg);
            }
        } catch (error) {
            const errMsg = "Falha na comunicação com o Cérebro da IA.";
            if (Platform.OS === 'web') window.alert("🚨 Erro Técnico:\n" + errMsg);
            else Alert.alert("🚨 Erro Técnico", errMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImportSuccess = (importedMeals) => {
        // 🔥 Mesma regra para quando você importa dieta de outro aluno
        const mapped = importedMeals.map(m => ({
            ...m,
            id: Math.random().toString(),
            dayType: activeDayType 
        }));

        const enriched = enrichMealsWithDatabase(mapped);
        
        setMeals(prev => {
            const outrasAbas = prev.filter(m => m.dayType !== activeDayType);
            return [...outrasAbas, ...enriched];
        });

        setImportModalVisible(false);
        if (Platform.OS === 'web') window.alert(`Dieta importada para o DIA DE ${activeDayType}!`);
    };

    const handleSaveDiet = async () => {
        if (!userId) return Alert.alert("Erro", "ID não encontrado.");
        setIsSaving(true);
        
        try {
            const safeMeals = meals.map(m => ({
                ...m,
                dayType: (m.dayType === 'PADRÃO' || !m.dayType) ? 'TREINO' : m.dayType
            }));

            const payload = {
                userId, 
                name: `Plano Alimentar - ${dietConfig.goal}`, 
                goal: dietConfig.goal,
                totalKcal: currentMacros.kcal, 
                totalProtein: currentMacros.prot,
                totalCarbs: currentMacros.carb, 
                totalFats: currentMacros.fat,
                waterIntake: dietConfig.water, 
                generalNotes: dietConfig.notes, 
                meals: safeMeals 
            };
            
            const response = await fetch('https://fitos-final.onrender.com/api/admin/diet', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error("Erro no servidor ao salvar.");

            if (Platform.OS === 'web') window.alert("🚀 Dieta blindada no banco de dados!");
            else Alert.alert("Sucesso", "Dieta salva!");

        } catch (error) {
            Alert.alert("Erro Técnico", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const pct = (cur, target) => Math.min((cur / (target || 1)) * 100, 100);

    if (isLoadingDiet) {
        return (
            <RootComponent style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{color: theme.textSecondary, marginTop: 10, fontWeight: 'bold'}}>Preparando Mesa de Operações...</Text>
            </RootComponent>
        );
    }

    return (
        <RootComponent style={{ height: isWeb ? windowHeight : undefined, flex: isWeb ? undefined : 1, overflow: 'hidden', backgroundColor: isWeb ? (theme.isDark ? '#0a0a0a' : '#E5E5EA') : theme.bg }}>
            <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}>

                <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>MESA DE OPERAÇÕES</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2}}>
                            <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent}} />
                            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>{aluno?.name}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleSaveDiet} disabled={isSaving} style={[styles.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                        {isSaving ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" /> : <MaterialCommunityIcons name="content-save-check" size={22} color={theme.isDark ? '#000' : '#FFF'} />}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, ...(isWeb ? { display: 'flex', flexDirection: 'column' } : {}) }} enabled={!isWeb}>
                    
                    <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim }} contentContainerStyle={{ paddingBottom: 110 }}>
                        
                        <DietHeaderWidgets theme={theme} currentMacros={currentMacros} macros={macros} pct={pct} showRaioX={showRaioX} setShowRaioX={setShowRaioX} anamnese={anamnese} handleGenerateAI={handleGenerateAI} isGenerating={isGenerating} setImportModalVisible={setImportModalVisible} />

                        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                            
                            <View style={styles.actionToolsContainer}>
                                <TouchableOpacity style={[styles.actionToolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setModalCloneVisible(true)}>
                                    <View style={[styles.actionIconBox, { backgroundColor: theme.accent + '20' }]}>
                                        <MaterialCommunityIcons name="account-switch-outline" size={18} color={theme.accent} />
                                    </View>
                                    <Text style={[styles.actionToolText, { color: theme.text }]}>CLONAR</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.actionToolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setModalTemplatesVisible(true)}>
                                    <View style={[styles.actionIconBox, { backgroundColor: theme.accent + '20' }]}>
                                        <MaterialCommunityIcons name="folder-star-outline" size={18} color={theme.accent} />
                                    </View>
                                    <Text style={[styles.actionToolText, { color: theme.text }]}>TEMPLATES</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.actionToolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setModalSaveTemplateVisible(true)}>
                                    <View style={[styles.actionIconBox, { backgroundColor: theme.accent + '20' }]}>
                                        <MaterialCommunityIcons name="content-save-all" size={18} color={theme.accent} />
                                    </View>
                                    <Text style={[styles.actionToolText, { color: theme.text }]}>SALVAR</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.daysTabsContainer}>
                                {['TREINO', 'CARDIO', 'DESCANSO'].map(type => (
                                    <TouchableOpacity 
                                        key={type} 
                                        style={[
                                            styles.dayTab, 
                                            activeDayType === type 
                                                ? { backgroundColor: theme.accent, borderColor: theme.accent, elevation: 4 } 
                                                : { backgroundColor: theme.surface, borderColor: theme.border }
                                        ]} 
                                        onPress={() => setActiveDayType(type)}
                                    >
                                        <Text style={{
                                            color: activeDayType === type ? '#000' : theme.textSecondary, 
                                            fontWeight: '900', letterSpacing: 0.5, fontSize: 10
                                        }}>
                                            DIA DE {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.sectionRow}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>PRESCRIÇÃO <Text style={{ color: theme.accent }}>({activeDayType})</Text></Text>
                                <View style={[styles.tacoBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
                                    <Text style={[styles.tacoBadgeText, { color: theme.accent }]}>BASE TACO</Text>
                                </View>
                            </View>

                            {visibleMeals.length === 0 ? (
                                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                    <View style={[styles.emptyIconBg, { backgroundColor: theme.surface }]}>
                                        <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={theme.textSecondary} />
                                    </View>
                                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Dieta em branco</Text>
                                    <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Adicione refeições para o dia de "{activeDayType}".</Text>
                                </View>
                            ) : (
                                visibleMeals.map(meal => (
                                    <MealCardAdmin 
                                        key={meal.id} 
                                        meal={meal} 
                                        theme={theme} 
                                        toGrams={toGrams} 
                                        handleOpenNameSelect={handleOpenNameSelect} 
                                        handleOpenTimeSelect={handleOpenTimeSelect} 
                                        handleDeleteMeal={handleDeleteMeal} 
                                        handleUpdateFoodAmount={handleUpdateFoodAmount} 
                                        handleToggleUnit={handleToggleUnit} 
                                        handleDeleteFood={handleDeleteFood} 
                                        handleOpenSearch={handleOpenSearch} 
                                        handleMealOptions={handleMealOptions}
                                        handleSwapBaseFood={handleSwapBaseFood} 
                                    />
                                ))
                            )}

                            {/* 🔥 ADICIONADO: Os dois botões lado a lado para você se salvar da bagunça */}
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                <TouchableOpacity style={[styles.addMealBtn, { flex: 1, borderColor: theme.accent + '50', backgroundColor: theme.accent + '08' }]} onPress={handleAddMeal} activeOpacity={0.75}>
                                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.accent} />
                                    <Text style={[styles.addMealText, { color: theme.accent }]}>ADICIONAR REFEIÇÃO</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.addMealBtn, { flex: 1, borderColor: '#FF3B3050', backgroundColor: '#FF3B3008' }]} onPress={handleClearDay} activeOpacity={0.75}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                    <Text style={[styles.addMealText, { color: '#FF3B30' }]}>LIMPAR ABA</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </Animated.ScrollView>
                </KeyboardAvoidingView>

                <DietModalsAdmin theme={theme} timeModalVisible={timeModalVisible} setTimeModalVisible={setTimeModalVisible} handleSelectTime={handleSelectTime} nameModalVisible={nameModalVisible} setNameModalVisible={setNameModalVisible} handleSelectName={handleSelectName} customNameModalVisible={customNameModalVisible} setCustomNameModalVisible={setCustomNameModalVisible} customNameInput={customNameInput} setCustomNameInput={setCustomNameInput} handleSaveCustomName={handleSaveCustomName} />

                <DietActionModals theme={theme} isWeb={isWeb} modalCloneVisible={modalCloneVisible} setModalCloneVisible={setModalCloneVisible} studentsList={studentsList} handleCloneFromStudent={handleCloneFromStudent} modalTemplatesVisible={modalTemplatesVisible} setModalTemplatesVisible={setModalTemplatesVisible} templatesList={templatesList} handleApplyTemplate={handleApplyTemplate} modalSaveTemplateVisible={modalSaveTemplateVisible} setModalSaveTemplateVisible={setModalSaveTemplateVisible} handleSaveAsTemplate={handleSaveAsTemplate} modalMealOptionsVisible={modalMealOptionsVisible} setModalMealOptionsVisible={setModalMealOptionsVisible} modalSaveMealVisible={modalSaveMealVisible} setModalSaveMealVisible={setModalSaveMealVisible} handleSaveMealTemplate={handleSaveMealTemplate} modalImportMealVisible={modalImportMealVisible} setModalImportMealVisible={setModalImportMealVisible} mealTemplatesList={mealTemplatesList} handleApplyMealTemplate={handleApplyMealTemplate} />

                <FoodSearchModal visible={searchModalVisible} onClose={() => setSearchModalVisible(false)} onSelectFood={handleAddFoodToMeal} targetGroup={activeGroupId} theme={theme} />
                
                <SmartSubstituteModal 
                    visible={smartModalVisible} 
                    onClose={() => setSmartModalVisible(false)} 
                    onSelectFood={handleAddFoodToMeal} 
                    onManualSearch={handleSmartToManual} 
                    principalFood={smartPrincipalFood} 
                    principalAmount={smartPrincipalAmount} 
                    theme={theme}
                    existingGroupItems={meals.find(m => m.id === activeMealId)?.items.filter(i => i.groupId === activeGroupId) || []} 
                />
                
                {importModalVisible && <ImportDietModal visible={importModalVisible} onClose={() => setImportModalVisible(false)} theme={theme} onImportSuccess={handleImportSuccess} />}
            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', borderBottomWidth: 1, elevation: 5, zIndex: 10 },
    iconBtn: { padding: 9, borderRadius: 14, borderWidth: 1 },
    headerTitle: { fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 10 },
    tacoBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    tacoBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    
    actionToolsContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    actionToolBtn: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    actionIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionToolText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

    daysTabsContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    dayTab: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

    emptyBox: { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 1, borderRadius: 24 },
    emptyIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    emptyTitle: { fontSize: 16, fontWeight: '900' },
    emptyDesc: { fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 },
    
    addMealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, borderWidth: 1 },
    addMealText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});