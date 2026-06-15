// src/hooks/useDietActions.js
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { FOOD_PORTIONS } from '../data/foodPortions';
import { calculateMacros, calculateCurrentMacros, toGrams, UNIT_GRAM_FACTOR, UNITS } from '../utils/dietUtils';

export const useDietActions = (aluno, anamnese, initialMeals) => {
    const [meals, setMeals] = useState([]);
    const [activeDayType, setActiveDayType] = useState('TREINO');
    const activeDayTypeRef = useRef(activeDayType);

    const [activeMealId,          setActiveMealId]          = useState(null);
    const [activeGroupId,         setActiveGroupId]         = useState(null);
    const [foodToSwapId,          setFoodToSwapId]          = useState(null);
    const [smartPrincipalFood,    setSmartPrincipalFood]    = useState(null);
    const [smartPrincipalAmount,  setSmartPrincipalAmount]  = useState('100');
    const [customNameInput,       setCustomNameInput]       = useState('');
    const [selectedMealForAction, setSelectedMealForAction] = useState(null);

    useEffect(() => { activeDayTypeRef.current = activeDayType; }, [activeDayType]);
    useEffect(() => { if (initialMeals && initialMeals.length > 0) setMeals(initialMeals); }, [initialMeals]);

    // visibleMeals inclui tanto as refeições principais quanto as versões alternativas do dia ativo
    const visibleMeals  = useMemo(() => meals.filter(m => m.dayType === activeDayType), [meals, activeDayType]);
    const macros        = useMemo(() => calculateMacros(anamnese, aluno), [anamnese, aluno]);
    // currentMacros considera apenas refeições principais para não duplicar calorias
    const currentMacros = useMemo(() => calculateCurrentMacros(
        visibleMeals.filter(m => m.isMainVersion !== false)
    ), [visibleMeals]);

    // ─── REFEIÇÕES ────────────────────────────────────────────────────────────
    const handleAddMeal = () => setMeals(prev => [...prev, {
        id: Date.now().toString(),
        name: 'Selecione a Refeição',
        time: '07:00',
        notes: '',
        items: [],
        dayType: activeDayTypeRef.current,
        isMainVersion: true,
        alternativeGroupId: null,
        alternativeLabel: null,
    }]);

    const handleDeleteMeal = (mealId) => setMeals(prev => prev.filter(m => m.id !== mealId));

    const handleUpdateMeal = (mealId, field, value) =>
        setMeals(prev => prev.map(m => m.id === mealId ? { ...m, [field]: value } : m));

    const handleMoveMeal = (mealId, direction) => {
        setMeals(prev => {
            const currentDay       = activeDayTypeRef.current;
            const currentDayMeals  = prev.filter(m => m.dayType === currentDay);
            const otherMeals       = prev.filter(m => m.dayType !== currentDay);
            const index            = currentDayMeals.findIndex(m => m.id === mealId);
            if (index === -1) return prev;
            const newList = [...currentDayMeals];
            if (direction === 'up'   && index > 0)
                [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
            else if (direction === 'down' && index < newList.length - 1)
                [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
            else return prev;
            return [...otherMeals, ...newList];
        });
    };

    const handleClearDay = () => {
        const currentDay = activeDayTypeRef.current;
        const msg = `ATENÇÃO: Você quer apagar todas as refeições do DIA DE ${currentDay}?`;
        if (Platform.OS === 'web') {
            if (window.confirm(msg)) setMeals(prev => prev.filter(m => m.dayType !== currentDay));
        } else {
            Alert.alert('Limpar Dia', `ATENÇÃO: Deseja apagar as refeições de ${currentDay}?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Apagar Tudo', style: 'destructive', onPress: () => setMeals(prev => prev.filter(m => m.dayType !== currentDay)) }
            ]);
        }
    };

    // ─── 🔥 VERSÕES ALTERNATIVAS ──────────────────────────────────────────────

    // Aplica um modelo guardado como versão alternativa de uma refeição principal
    const handleApplyAsAlternative = useCallback((mainMeal, template) => {
        const parsedItems = typeof template.items === 'string'
            ? JSON.parse(template.items)
            : (template.items || []);

        const groupId = mainMeal.alternativeGroupId || `alt-${mainMeal.id}`;

        setMeals(prev => {
            // Garante que a principal tem o groupId
            const updated = prev.map(m =>
                m.id === mainMeal.id
                    ? { ...m, alternativeGroupId: groupId, isMainVersion: true }
                    : m
            );

            // Cria a versão alternativa com os itens do modelo
            const newAlt = {
                id:                 `meal-alt-${Date.now()}`,
                name:               mainMeal.name,
                time:               mainMeal.time,
                notes:              template.notes || '',
                dayType:            mainMeal.dayType,
                alternativeGroupId: groupId,
                isMainVersion:      false,
                alternativeLabel:   template.name || 'Versão Alternativa',
                items: parsedItems.map(item => ({
                    ...item,
                    uniqueId: Math.random().toString(),
                    groupId:  item.groupId || item.substitutionGroupId || Math.random().toString(),
                })),
            };

            return [...updated, newAlt];
        });
    }, []);

    // Remove uma versão alternativa; se era a última, limpa o groupId da principal
    const handleRemoveAlternativeVersion = useCallback((altMealId) => {
        setMeals(prev => {
            const removedMeal = prev.find(m => m.id === altMealId);
            const filtered    = prev.filter(m => m.id !== altMealId);
            if (!removedMeal?.alternativeGroupId) return filtered;
            const remainingAlts = filtered.filter(
                m => m.alternativeGroupId === removedMeal.alternativeGroupId && m.isMainVersion === false
            );
            if (remainingAlts.length === 0) {
                return filtered.map(m =>
                    m.alternativeGroupId === removedMeal.alternativeGroupId
                        ? { ...m, alternativeGroupId: null }
                        : m
                );
            }
            return filtered;
        });
    }, []);

    // ─── ALIMENTOS ────────────────────────────────────────────────────────────
    const handleAddFoodToMeal = (food) => {
        const portions = FOOD_PORTIONS[food.id] || {};
        let initialAmount = food.suggestedAmount
            ? food.suggestedAmount.toString()
            : (portions?.default_amount?.toString() || '100');
        let initialUnit = food.suggestedAmount
            ? (food.base_unit || 'g')
            : (portions?.default_unit || food.base_unit || 'g');

        setMeals(prev => prev.map(meal => {
            if (meal.id !== activeMealId) return meal;

            const newGroupId = activeGroupId || Math.random().toString();

            if (!food.suggestedAmount && activeGroupId) {
                const baseFood = meal.items.find(i => i.groupId === activeGroupId);
                if (baseFood) {
                    const rawAmount      = parseFloat(baseFood.amount) || 100;
                    const gramsBase      = toGrams(rawAmount, baseFood.unit, baseFood);
                    const kcalPer100Base = parseFloat(baseFood.calories_per_100 ?? baseFood.calories ?? 0);
                    const targetKcal     = (kcalPer100Base * gramsBase) / 100;
                    const itemKcal       = parseFloat(food.calories_per_100 ?? food.calories ?? 1);
                    let neededGrams      = (targetKcal * 100) / itemKcal;
                    if (neededGrams === Infinity || isNaN(neededGrams) || neededGrams === 0) neededGrams = 100;
                    const factor    = (portions?.[initialUnit]) ?? UNIT_GRAM_FACTOR[initialUnit] ?? 1;
                    initialAmount   = Math.max(0.5, Math.round((neededGrams / factor) * 2) / 2).toString();
                }
            }

            const newItem = { ...food, uniqueId: Math.random().toString(), groupId: newGroupId, amount: initialAmount, unit: initialUnit };

            if (foodToSwapId) return { ...meal, items: meal.items.map(i => i.uniqueId === foodToSwapId ? newItem : i) };
            return { ...meal, items: [...meal.items, newItem] };
        }));

        if (foodToSwapId) {
            setActiveMealId(null);
            setActiveGroupId(null);
            setFoodToSwapId(null);
        }
    };

    const handleUpdateFoodAmount = (mealId, foodUniqueId, newAmount) => {
        setMeals(prev => prev.map(meal => {
            if (meal.id !== mealId) return meal;
            const targetFood = meal.items.find(i => i.uniqueId === foodUniqueId);
            if (!targetFood) return meal;
            const isBase        = meal.items.findIndex(i => i.groupId === targetFood.groupId) === meal.items.indexOf(targetFood);
            const newAmountNum  = parseFloat(newAmount) || 0;

            if (isBase) {
                const targetGrams    = toGrams(newAmountNum, targetFood.unit, targetFood);
                const targetKcal     = (parseFloat(targetFood.calories_per_100 ?? targetFood.calories ?? 0) * targetGrams) / 100;
                return {
                    ...meal,
                    items: meal.items.map(item => {
                        if (item.uniqueId === foodUniqueId) return { ...item, amount: newAmount };
                        if (item.groupId === targetFood.groupId) {
                            const itemKcal    = parseFloat(item.calories_per_100 ?? item.calories ?? 1);
                            const neededGrams = (targetKcal * 100) / itemKcal;
                            const factor      = (FOOD_PORTIONS[item.id]?.[item.unit]) ?? UNIT_GRAM_FACTOR[item.unit] ?? 1;
                            return { ...item, amount: Math.round(neededGrams / factor).toString() };
                        }
                        return item;
                    })
                };
            }
            return { ...meal, items: meal.items.map(i => i.uniqueId === foodUniqueId ? { ...i, amount: newAmount } : i) };
        }));
    };

    const handleToggleUnit = (mealId, foodUniqueId) => setMeals(prev => prev.map(meal => {
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

    const handleDeleteFood = (mealId, foodUniqueId) => setMeals(prev => prev.map(meal => {
        if (meal.id !== mealId) return meal;
        return { ...meal, items: meal.items.filter(i => i.uniqueId !== foodUniqueId) };
    }));

    return {
        meals, setMeals, activeDayType, setActiveDayType, activeDayTypeRef,
        activeMealId, setActiveMealId, activeGroupId, setActiveGroupId,
        foodToSwapId, setFoodToSwapId, smartPrincipalFood, setSmartPrincipalFood,
        smartPrincipalAmount, setSmartPrincipalAmount, customNameInput, setCustomNameInput,
        selectedMealForAction, setSelectedMealForAction,
        visibleMeals, macros, currentMacros,
        handleAddMeal, handleDeleteMeal, handleUpdateMeal, handleMoveMeal, handleClearDay,
        handleAddFoodToMeal, handleUpdateFoodAmount, handleToggleUnit, handleDeleteFood,
        // 🔥 Versões alternativas
        handleApplyAsAlternative,
        handleRemoveAlternativeVersion,
    };
};