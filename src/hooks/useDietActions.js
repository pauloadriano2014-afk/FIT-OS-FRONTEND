// src/hooks/useDietActions.js
import { useState, useEffect, useMemo, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { FOOD_PORTIONS } from '../data/foodPortions';
import { calculateMacros, calculateCurrentMacros, toGrams, UNIT_GRAM_FACTOR, UNITS } from '../utils/dietUtils';

export const useDietActions = (aluno, anamnese, initialMeals) => {
    const [meals, setMeals] = useState([]);
    const [activeDayType, setActiveDayType] = useState('TREINO');
    const activeDayTypeRef = useRef(activeDayType);

    const [activeMealId, setActiveMealId] = useState(null);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [foodToSwapId, setFoodToSwapId] = useState(null);
    const [smartPrincipalFood, setSmartPrincipalFood] = useState(null);
    const [smartPrincipalAmount, setSmartPrincipalAmount] = useState('100');
    const [customNameInput, setCustomNameInput] = useState('');
    const [selectedMealForAction, setSelectedMealForAction] = useState(null);

    useEffect(() => { activeDayTypeRef.current = activeDayType; }, [activeDayType]);
    useEffect(() => { if (initialMeals && initialMeals.length > 0) setMeals(initialMeals); }, [initialMeals]);

    const visibleMeals = useMemo(() => meals.filter(m => m.dayType === activeDayType), [meals, activeDayType]);
    const macros = useMemo(() => calculateMacros(anamnese, aluno), [anamnese, aluno]);
    const currentMacros = useMemo(() => calculateCurrentMacros(visibleMeals), [visibleMeals]);

    const handleAddMeal = () => setMeals(prev => [...prev, { id: Date.now().toString(), name: 'Selecione a Refeição', time: '07:00', notes: '', items: [], dayType: activeDayTypeRef.current }]);
    const handleDeleteMeal = (mealId) => setMeals(prev => prev.filter(m => m.id !== mealId));
    const handleUpdateMeal = (mealId, field, value) => setMeals(prev => prev.map(m => m.id === mealId ? { ...m, [field]: value } : m));

    const handleMoveMeal = (mealId, direction) => {
        setMeals(prev => {
            const currentDay = activeDayTypeRef.current;
            const currentDayMeals = prev.filter(m => m.dayType === currentDay);
            const otherMeals = prev.filter(m => m.dayType !== currentDay);
            const index = currentDayMeals.findIndex(m => m.id === mealId);
            if (index === -1) return prev;
            const newCurrentDayMeals = [...currentDayMeals];
            if (direction === 'up' && index > 0) [newCurrentDayMeals[index - 1], newCurrentDayMeals[index]] = [newCurrentDayMeals[index], newCurrentDayMeals[index - 1]];
            else if (direction === 'down' && index < newCurrentDayMeals.length - 1) [newCurrentDayMeals[index], newCurrentDayMeals[index + 1]] = [newCurrentDayMeals[index + 1], newCurrentDayMeals[index]];
            else return prev;
            return [...otherMeals, ...newCurrentDayMeals];
        });
    };

    const handleClearDay = () => {
        const currentDay = activeDayTypeRef.current;
        if (Platform.OS === 'web') {
            if (window.confirm(`ATENÇÃO: Você quer apagar todas as refeições do DIA DE ${currentDay}?`)) setMeals(prev => prev.filter(m => m.dayType !== currentDay));
        } else {
            Alert.alert("Limpar Dia", `ATENÇÃO: Deseja apagar as refeições de ${currentDay}?`, [
                { text: "Cancelar", style: "cancel" }, { text: "Apagar Tudo", style: "destructive", onPress: () => setMeals(prev => prev.filter(m => m.dayType !== currentDay)) }
            ]);
        }
    };

    const handleAddFoodToMeal = (food) => {
        const portions = FOOD_PORTIONS[food.id] || {};
        let initialAmount = food.suggestedAmount ? food.suggestedAmount.toString() : (portions?.default_amount?.toString() || '100');
        let initialUnit = food.suggestedAmount ? (food.base_unit || 'g') : (portions?.default_unit || food.base_unit || 'g');

        setMeals(prev => prev.map(meal => {
            if (meal.id !== activeMealId) return meal;
            
            const newGroupId = activeGroupId || Math.random().toString();
            
            // 🔥 CÁLCULO DIRETO BLINDADO 🔥
            if (!food.suggestedAmount && activeGroupId) {
                const baseFood = meal.items.find(i => i.groupId === activeGroupId);
                
                if (baseFood) {
                    const rawAmount = parseFloat(baseFood.amount) || 100;
                    const currentUnit = baseFood.unit || 'g';
                    
                    const gramsBase = toGrams(rawAmount, currentUnit, baseFood);
                    const kcalPer100Base = parseFloat(baseFood.calories_per_100 ?? baseFood.calories ?? 0);
                    const targetTotalKcal = (kcalPer100Base * gramsBase) / 100;

                    const itemKcalPer100 = parseFloat(food.calories_per_100 ?? food.calories ?? 1);
                    let neededGrams = (targetTotalKcal * 100) / itemKcalPer100;
                    
                    if (neededGrams === Infinity || isNaN(neededGrams) || neededGrams === 0) neededGrams = 100;
                    
                    const factor = (portions?.[initialUnit]) ?? UNIT_GRAM_FACTOR[initialUnit] ?? 1;
                    const finalAmount = Math.max(0.5, Math.round((neededGrams / factor) * 2) / 2);
                    
                    initialAmount = finalAmount.toString();
                }
            }

            const newItem = { ...food, uniqueId: Math.random().toString(), groupId: newGroupId, amount: initialAmount, unit: initialUnit };
            
            if (foodToSwapId) return { ...meal, items: meal.items.map(i => i.uniqueId === foodToSwapId ? newItem : i) };
            return { ...meal, items: [...meal.items, newItem] };
        }));
        
        // 🔥 A CORREÇÃO ESTÁ AQUI 🔥
        // Nós só limpamos a memória se for uma Troca Direta (Swap).
        // Se for adição de substituto, deixamos a memória intacta para a multi-seleção funcionar!
        if (foodToSwapId) {
            setActiveMealId(null); 
            setActiveGroupId(null); 
            setFoodToSwapId(null);
        }
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
                const targetTotalKcal = ((parseFloat(targetFood.calories_per_100 ?? targetFood.calories ?? 0)) * targetGrams) / 100;
                return {
                    ...meal,
                    items: meal.items.map(item => {
                        if (item.uniqueId === foodUniqueId) return { ...item, amount: newAmount };
                        if (item.groupId === targetFood.groupId) {
                            const itemKcalPer100 = parseFloat(item.calories_per_100 ?? item.calories ?? 1);
                            const neededGrams = (targetTotalKcal * 100) / itemKcalPer100;
                            const factor = (FOOD_PORTIONS[item.id]?.[item.unit]) ?? UNIT_GRAM_FACTOR[item.unit] ?? 1;
                            return { ...item, amount: Math.round(neededGrams / factor).toString() };
                        }
                        return item;
                    })
                };
            }
            return { ...meal, items: meal.items.map(item => item.uniqueId === foodUniqueId ? { ...item, amount: newAmount } : item) };
        }));
    };

    const handleToggleUnit = (mealId, foodUniqueId) => setMeals(prev => prev.map(meal => {
        if (meal.id !== mealId) return meal;
        return { ...meal, items: meal.items.map(item => {
            if (item.uniqueId !== foodUniqueId) return item;
            const next = (UNITS.indexOf(item.unit) + 1) % UNITS.length;
            return { ...item, unit: UNITS[next] };
        })};
    }));

    const handleDeleteFood = (mealId, foodUniqueId) => setMeals(prev => prev.map(meal => {
        if (meal.id !== mealId) return meal;
        return { ...meal, items: meal.items.filter(item => item.uniqueId !== foodUniqueId) };
    }));

    return {
        meals, setMeals, activeDayType, setActiveDayType, activeDayTypeRef,
        activeMealId, setActiveMealId, activeGroupId, setActiveGroupId,
        foodToSwapId, setFoodToSwapId, smartPrincipalFood, setSmartPrincipalFood,
        smartPrincipalAmount, setSmartPrincipalAmount, customNameInput, setCustomNameInput,
        selectedMealForAction, setSelectedMealForAction,
        visibleMeals, macros, currentMacros,
        handleAddMeal, handleDeleteMeal, handleUpdateMeal, handleMoveMeal, handleClearDay,
        handleAddFoodToMeal, handleUpdateFoodAmount, handleToggleUnit, handleDeleteFood
    };
};