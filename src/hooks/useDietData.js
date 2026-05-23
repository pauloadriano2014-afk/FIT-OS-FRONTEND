// src/hooks/useDietData.js
import { useState, useEffect } from 'react';
import * as DietService from '../services/adminDietService';

export const useDietData = (userId) => {
    const [anamnese, setAnamnese] = useState({});
    const [dietConfig, setDietConfig] = useState({ goal: 'Indefinido', water: '3 Litros', notes: 'Siga os horários descritos.' });
    const [isLoadingDiet, setIsLoadingDiet] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const [studentsList, setStudentsList] = useState([]);
    const [templatesList, setTemplatesList] = useState([]);
    const [mealTemplatesList, setMealTemplatesList] = useState([]);
    const [initialMeals, setInitialMeals] = useState([]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!userId || String(userId).includes("object")) return;
            try {
                setIsLoadingDiet(true);

                try {
                    const userData = await DietService.fetchUserData(userId);
                    const lastAnamnese = userData.anamneses?.length > 0 ? userData.anamneses[userData.anamneses.length - 1] : {};
                    setAnamnese(lastAnamnese);
                    if (lastAnamnese.objetivo) setDietConfig(prev => ({ ...prev, goal: lastAnamnese.objetivo }));
                } catch (e) { console.error(e); }

                try {
                    const savedDiet = await DietService.fetchDietData(userId);
                    if (savedDiet && savedDiet.meals) {
                        setDietConfig({
                            goal: savedDiet.goal || 'Indefinido',
                            water: savedDiet.waterIntake || '3 Litros',
                            notes: savedDiet.generalNotes || ''
                        });
                        const loadedMeals = savedDiet.meals.map(meal => ({
                            ...meal,
                            id: meal.id.toString(),
                            dayType: (meal.dayType === 'PADRÃO' || !meal.dayType) ? 'TREINO' : meal.dayType,
                            items: (meal.items || []).map(item => ({
                                ...item, uniqueId: item.id.toString(), groupId: item.substitutionGroupId || item.id.toString(), amount: item.amount.toString()
                            }))
                        }));
                        setInitialMeals(loadedMeals);
                    }
                } catch (e) { console.error(e); }

                try {
                    const [sData, tData, mData] = await Promise.all([
                        DietService.fetchStudentsList(), DietService.fetchDietTemplates(), DietService.fetchMealTemplates()
                    ]);
                    setStudentsList(sData.users || sData || []);
                    setTemplatesList(tData.templates || tData || []);
                    setMealTemplatesList(mData.templates || []);
                } catch (e) { console.error(e); }

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
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
        mealTemplatesList, setMealTemplatesList, initialMeals
    };
};