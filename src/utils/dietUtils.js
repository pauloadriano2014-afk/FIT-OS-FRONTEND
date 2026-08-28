// src/utils/dietUtils.js
import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { FOOD_DATABASE } from '../data/foodDatabase';
import { FOOD_PORTIONS } from '../data/foodPortions';

export const UNITS = ['g', 'ml', 'unid', 'colher', 'fatia', 'xícara'];
export const UNIT_GRAM_FACTOR = { 'g': 1, 'ml': 1, 'fatia': 25, 'unid': 50, 'colher': 15, 'xícara': 200 };

export const toGrams = (amount, unit, food) => {
    const portions = food ? FOOD_PORTIONS[food.id] : null;
    const factor = portions?.[unit] ?? UNIT_GRAM_FACTOR[unit] ?? 1;
    return (parseFloat(amount) || 0) * factor;
};

// 🔥 NOVA FUNÇÃO ROBUSTA: Pega o macro independente do nome que vier do banco
export const getMacro = (item, type) => {
    if (!item) return 0;
    if (type === 'kcal') return parseFloat(item.calories_per_100 ?? item.calories ?? item.kcal ?? item.energia ?? 0) || 0;
    if (type === 'p') return parseFloat(item.p ?? item.protein ?? item.proteina ?? 0) || 0;
    if (type === 'c') return parseFloat(item.c ?? item.carbs ?? item.carboidrato ?? 0) || 0;
    if (type === 'f') return parseFloat(item.f ?? item.fats ?? item.gordura ?? item.lipideos ?? 0) || 0;
    return 0;
};

export const enrichMealsWithDatabase = (mealsArray) => {
    return mealsArray.map(meal => ({
        ...meal,
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

            let unitClean = (item.unit || 'g').toLowerCase();
            if (unitClean.endsWith('s')) unitClean = unitClean.slice(0, -1);
            if (unitClean.includes('unid')) unitClean = 'unid';
            else if (unitClean.includes('fatia')) unitClean = 'fatia';
            else if (unitClean.includes('colher')) unitClean = 'colher';
            else if (unitClean.includes('xic') || unitClean.includes('xíc')) unitClean = 'xícara';

            return {
                ...item,
                id: dbFood ? dbFood.id : item.id, // 🔥 SALVA O ID
                category: dbFood ? dbFood.category : item.category, // 🔥 SALVA A CATEGORIA
                subcategory: dbFood ? dbFood.subcategory : item.subcategory, // 🔥 SALVA A SUBCATEGORIA
                p: dbFood ? getMacro(dbFood, 'p') : getMacro(item, 'p'),
                c: dbFood ? getMacro(dbFood, 'c') : getMacro(item, 'c'),
                f: dbFood ? getMacro(dbFood, 'f') : getMacro(item, 'f'),
                calories_per_100: dbFood ? getMacro(dbFood, 'kcal') : getMacro(item, 'kcal'),
                name: dbFood ? dbFood.name : item.name,
                unit: unitClean
            };
        })
    }));
};

export const calculateMacros = (anamnese, aluno) => {
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
};

export const calculateCurrentMacros = (visibleMeals) => {
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
            kcal += (getMacro(item, 'kcal') * amt) / 100;
            prot += (getMacro(item, 'p') * amt) / 100;
            carb += (getMacro(item, 'c') * amt) / 100;
            fatG += (getMacro(item, 'f') * amt) / 100;
        });
    });
    return { kcal: Math.round(kcal), prot: Math.round(prot), carb: Math.round(carb), fat: Math.round(fatG) };
};

export const generateDietPDF = async ({ visibleMeals, dietConfig, currentMacros, activeDayType, aluno }) => {
    if (visibleMeals.length === 0) {
        const msg = "Adicione refeições na aba atual antes de gerar o PDF.";
        return Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Atenção", msg);
    }

    try {
        let htmlContent = `
            <html>
            <head>
                <meta charset="utf-8">
                <title>Plano Alimentar - ELITE FIT</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #222; padding: 40px; line-height: 1.5; background: #fff; }
                    .header { text-align: center; border-bottom: 3px solid #CCFF00; padding-bottom: 20px; margin-bottom: 30px; }
                    h1 { color: #111; margin: 0 0 5px 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
                    .subtitle { font-size: 14px; color: #555; font-weight: bold; letter-spacing: 1px; }
                    .macros-box { background-color: #f8f9fa; border-radius: 8px; padding: 15px; text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 14px; border: 1px solid #ddd; }
                    .meal-card { border: 2px solid #CCFF00; border-radius: 12px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
                    .meal-header { font-size: 18px; font-weight: 800; color: #111; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
                    .food-group { margin-bottom: 15px; }
                    .food-item { font-size: 16px; color: #333; margin-bottom: 6px; }
                    .or-text { color: #888; font-size: 14px; font-style: italic; margin-left: 20px; font-weight: bold; margin-top: 4px; margin-bottom: 4px; }
                    .meal-notes { background-color: #f9f9f9; padding: 12px; border-radius: 8px; font-size: 14px; font-style: italic; margin-top: 15px; color: #444; border-left: 4px solid #CCFF00; }
                    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 13px; color: #777; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>PLANO ALIMENTAR</h1>
                    <div class="subtitle">ALUNO(A): ${aluno?.name?.toUpperCase() || 'NÃO INFORMADO'} &nbsp;|&nbsp; TIPO: DIA DE ${activeDayType}</div>
                </div>

                <div class="macros-box">
                    OBJETIVO: ${dietConfig.goal.toUpperCase()} &nbsp;|&nbsp;
                    KCAL: ${currentMacros.kcal} &nbsp;|&nbsp;
                    PROT: ${currentMacros.prot}g &nbsp;|&nbsp;
                    CARB: ${currentMacros.carb}g &nbsp;|&nbsp;
                    GORD: ${currentMacros.fat}g
                </div>
        `;

        visibleMeals.forEach(meal => {
            htmlContent += `
                <div class="meal-card">
                    <div class="meal-header">⏰ ${meal.time} - ${meal.name.toUpperCase()}</div>
            `;

            const grouped = meal.items.reduce((acc, item) => {
                if (!acc[item.groupId]) acc[item.groupId] = [];
                acc[item.groupId].push(item);
                return acc;
            }, {});

            Object.values(grouped).forEach(group => {
                htmlContent += `<div class="food-group">`;
                group.forEach((item, index) => {
                    if (index > 0) {
                        htmlContent += `<div class="or-text">↳ Ou substitua por:</div>`;
                    }
                    htmlContent += `
                        <div class="food-item">
                            • <strong>${item.amount} ${item.unit}</strong> de ${item.name}
                        </div>
                    `;
                });
                htmlContent += `</div>`;
            });

            if (meal.notes && meal.notes.trim() !== '') {
                htmlContent += `<div class="meal-notes">⚠️ Obs: ${meal.notes}</div>`;
            }

            htmlContent += `</div>`;
        });

        htmlContent += `
                <div class="footer">
                    <p><strong>Meta Diária de Água:</strong> ${dietConfig.water}</p>
                    <p><strong>Anotações Gerais:</strong> ${dietConfig.notes}</p>
                    <p style="margin-top: 20px; font-weight: bold;">Gerado pelo ELITE FIT</p>
                </div>
            </body>
            </html>
        `;

        if (Platform.OS === 'web') {
            await Print.printAsync({ html: htmlContent });
        } else {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert("Sucesso", "PDF gerado: " + uri);
            }
        }

    } catch (error) {
        console.error(error);
        const msg = "Erro inesperado ao gerar o PDF da dieta.";
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Erro", msg);
    }
};