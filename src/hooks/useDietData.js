// src/hooks/useDietData.js
import { useState, useEffect } from 'react';
import * as DietService from '../services/adminDietService';

export const useDietData = (userId) => {
    const [anamnese,        setAnamnese]        = useState({});
    const [dietConfig,      setDietConfig]      = useState({ goal: 'Indefinido', water: '3 Litros', notes: 'Siga os horários descritos.' });
    const [isLoadingDiet,   setIsLoadingDiet]   = useState(true);
    const [isSaving,        setIsSaving]        = useState(false);
    const [isGenerating,    setIsGenerating]    = useState(false);
    const [studentsList,    setStudentsList]    = useState([]);
    const [templatesList,   setTemplatesList]   = useState([]);
    const [mealTemplatesList, setMealTemplatesList] = useState([]);
    const [initialMeals,    setInitialMeals]    = useState([]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!userId || String(userId).includes('object')) return;
            try {
                setIsLoadingDiet(true);

                // ── Anamnese ────────────────────────────────────────────────
                try {
                    const userData    = await DietService.fetchUserData(userId);
                    const lastAnamnese = userData.anamneses?.length > 0
                        ? userData.anamneses[userData.anamneses.length - 1]
                        : {};
                    setAnamnese(lastAnamnese);
                    if (lastAnamnese.objetivo)
                        setDietConfig(prev => ({ ...prev, goal: lastAnamnese.objetivo }));
                } catch (e) { console.error('Anamnese:', e); }

                // ── Dieta salva ─────────────────────────────────────────────
                try {
                    const savedDiet = await DietService.fetchDietData(userId);
                    if (savedDiet?.meals) {
                        setDietConfig({
                            goal:  savedDiet.goal        || 'Indefinido',
                            water: savedDiet.waterIntake || '3 Litros',
                            notes: savedDiet.generalNotes || '',
                        });

                        const loadedMeals = [];

                        savedDiet.meals.forEach(meal => {
                            // Monta refeição principal
                            const mainMeal = {
                                ...meal,
                                id:                 meal.id.toString(),
                                dayType:            (meal.dayType === 'PADRÃO' || !meal.dayType) ? 'TREINO' : meal.dayType,
                                alternativeGroupId: meal.alternativeGroupId ?? null,
                                isMainVersion:      true,
                                alternativeLabel:   meal.alternativeLabel ?? null,
                                items: (meal.items || []).map(item => ({
                                    ...item,
                                    uniqueId: item.id?.toString() ?? Math.random().toString(),
                                    groupId:  item.substitutionGroupId || item.groupId || item.id?.toString(),
                                    amount:   item.amount?.toString() ?? '0',
                                })),
                            };
                            loadedMeals.push(mainMeal);

                            // 🔥 Desagrupa as alternativas embutidas de volta para refeições independentes
                            if (meal.alternatives?.length > 0) {
                                meal.alternatives.forEach(alt => {
                                    loadedMeals.push({
                                        ...alt,
                                        id:                 alt.id?.toString() ?? `alt-${Math.random()}`,
                                        dayType:            mainMeal.dayType,
                                        alternativeGroupId: mainMeal.alternativeGroupId,
                                        isMainVersion:      false,
                                        alternativeLabel:   alt.alternativeLabel ?? 'Versão Alternativa',
                                        items: (alt.items || []).map(item => ({
                                            ...item,
                                            uniqueId: item.id?.toString() ?? Math.random().toString(),
                                            groupId:  item.substitutionGroupId || item.groupId || item.id?.toString(),
                                            amount:   item.amount?.toString() ?? '0',
                                        })),
                                    });
                                });
                            }
                        });

                        setInitialMeals(loadedMeals);
                    }
                } catch (e) { console.error('Dieta:', e); }

                // ── Listas auxiliares ───────────────────────────────────────
                try {
                    const [sData, tData, mData] = await Promise.all([
                        DietService.fetchStudentsList(),
                        DietService.fetchDietTemplates(),
                        DietService.fetchMealTemplates(),
                    ]);
                    setStudentsList(sData.users   || sData || []);
                    setTemplatesList(tData.templates || tData || []);
                    setMealTemplatesList(mData.templates || []);
                } catch (e) { console.error('Listas:', e); }

            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setIsLoadingDiet(false);
            }
        };

        fetchAllData();
    }, [userId]);

    return {
        anamnese, dietConfig, setDietConfig, isLoadingDiet,
        isSaving, setIsSaving, isGenerating, setIsGenerating,
        studentsList, templatesList, setTemplatesList,
        mealTemplatesList, setMealTemplatesList, initialMeals,
    };
};