// src/utils/macroPlanner.js — VERSÃO 3.0
// Correções vs v2.0:
//   - SINCRONIZAÇÃO BACKEND: Aplicada mesma lógica Mifflin-St Jeor do route.ts.
//   - FATOR DE ATIVIDADE: Alinhado aos multiplicadores exatos do servidor (1.375 a 1.9).
//   - OBJETIVOS DINÂMICOS: Substituída a matriz fixa de delta calórico por percentuais (+10%, -20%) ajustados ao TDEE.
//   - MACROS BLINDADOS: Gordura fixa em 1.0g/kg, Proteína cravada em 2.2g/kg (Déficit) ou 2.0g/kg (Hipertrofia).
//   - VARIAÇÃO DIÁRIA: Aplicado multiplicador de dia (Treino vs Descanso) direto no Kcal Alvo para manter o Ciclo de Carboidratos visual.

export const DAY_TYPES = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'];

export const DAY_TYPE_LABELS = {
    TREINO:        'Treino de Força',
    TREINO_CARDIO: 'Treino + Cardio',
    CARDIO:        'Só Cardio',
    DESCANSO:      'Descanso',
};

export function resolveGender(anamnese, genderParam) {
    const g = (anamnese?.gender ?? genderParam ?? '').trim().toLowerCase();
    return g === 'masculino' || g === 'male' || g === 'm';
}

function calcTDEE(peso, altura, idade, isHomem, frequencia) {
    // TMB Mifflin-St Jeor (Sincronizado com backend v6.7)
    const tmb = isHomem
        ? Math.round(10 * peso + 6.25 * altura - 5 * idade + 5)
        : Math.round(10 * peso + 6.25 * altura - 5 * idade - 161);

    const freq = frequencia ?? 4;
    let fatAt = 1.2; // Sedentário
    if (freq >= 1 && freq <= 2) fatAt = 1.375;
    else if (freq >= 3 && freq <= 4) fatAt = 1.55;
    else if (freq >= 5 && freq <= 6) fatAt = 1.725;
    else if (freq >= 7) fatAt = 1.9;

    return { tmb, tdee: Math.round(tmb * fatAt) };
}

function calcMacrosForDayType(peso, tdee, objetivo, isHomem, dayType) {
    const obj = (objetivo || '').toLowerCase();
    let targetKcal, protPerKg;

    // Base do Objetivo (Sincronizado com backend v6.7)
    if (obj.includes('hipertrofia') || obj.includes('ganho')) {
        targetKcal = tdee * 1.1; // +10% Superávit
        protPerKg = 2.0;
    } else if (obj.includes('emagrecimento') || obj.includes('perda') || obj.includes('defini')) {
        targetKcal = tdee * 0.8; // -20% Déficit
        protPerKg = 2.2;
    } else {
        targetKcal = tdee; // Manutenção / Saúde
        protPerKg = 1.8;
    }

    // Variação Diária (Ciclo de Carboidratos Inteligente)
    // Mantém a proteína e gordura constantes, mas flutua o Kcal (e consequentemente os carbos)
    let dayMult = 1.0;
    if (dayType === 'TREINO_CARDIO') dayMult = 1.05; // Gasta mais, come um pouco mais
    else if (dayType === 'TREINO')   dayMult = 1.00; // Base do cálculo
    else if (dayType === 'CARDIO')   dayMult = 0.95; // Leve redução
    else if (dayType === 'DESCANSO') dayMult = 0.90; // Maior redução nos dias off

    const pisoKcal = isHomem ? 1400 : 1200;
    const kcalAlvo = Math.max(pisoKcal, Math.round(targetKcal * dayMult));

    const protAlvo = Math.round(peso * protPerKg);
    const fatAlvo  = Math.max(30, Math.round(peso * 1.0)); // Gordura travada em 1.0g/kg (mínimo 30g)
    
    const calRest = kcalAlvo - (protAlvo * 4) - (fatAlvo * 9);
    let carbAlvo = Math.max(20, Math.round(calRest / 4)); // Mínimo de 20g de carbo

    // Recalcula o Kcal real baseado nos macros finais arredondados
    const kcalReal = Math.round(protAlvo * 4 + carbAlvo * 4 + fatAlvo * 9);

    return { kcal: kcalReal, prot: protAlvo, carb: carbAlvo, fat: fatAlvo };
}

// ─── DISTRIBUIÇÃO SEMANAL SUGERIDA ───────────────────────────────────────────
export function suggestWeekDistribution(frequencia, objetivo) {
    const freq = Math.min(7, Math.max(1, Number(frequencia) || 3));

    const base = {
        1: { TREINO: 1, TREINO_CARDIO: 0, CARDIO: 0, DESCANSO: 6 },
        2: { TREINO: 1, TREINO_CARDIO: 0, CARDIO: 1, DESCANSO: 5 },
        3: { TREINO: 2, TREINO_CARDIO: 0, CARDIO: 1, DESCANSO: 4 },
        4: { TREINO: 2, TREINO_CARDIO: 1, CARDIO: 1, DESCANSO: 3 },
        5: { TREINO: 2, TREINO_CARDIO: 2, CARDIO: 1, DESCANSO: 2 },
        6: { TREINO: 3, TREINO_CARDIO: 2, CARDIO: 1, DESCANSO: 1 },
        7: { TREINO: 3, TREINO_CARDIO: 2, CARDIO: 2, DESCANSO: 0 },
    };

    const dist = { ...base[freq] };

    if (objetivo === 'Hipertrofia' && freq >= 4) {
        if (dist.CARDIO > 0) { dist.CARDIO -= 1; dist.TREINO += 1; }
    }
    if (['Emagrecimento', 'Definição'].includes(objetivo) && freq >= 5) {
        if (dist.TREINO > 1) { dist.TREINO -= 1; dist.CARDIO += 1; }
    }

    return dist;
}

// ─── CÁLCULO COMPLETO DO PLANO SEMANAL ───────────────────────────────────────
/**
 * @param {Object} anamnese  - dados da anamnese do aluno
 * @param {string} birthDate - DD/MM/AAAA ou YYYY-MM-DD
 * @param {string} gender    - 'Masculino' | 'Feminino' (do cadastro)
 * @param {Object} weekDist  - distribuição editada pelo coach (opcional)
 */
export function calcWeeklyPlan(anamnese, birthDate, gender, weekDist = null) {
    const peso       = Number(anamnese?.peso)       || 70;
    const altura     = Number(anamnese?.altura)     || 170;
    const frequencia = Number(anamnese?.frequencia) || 3;
    const objetivo   = anamnese?.objetivo || 'Emagrecimento';

    const isHomem = resolveGender(anamnese, gender);

    // Idade real
    const idade = calcAge(birthDate || anamnese?.birthDate);

    const { tmb, tdee } = calcTDEE(peso, altura, idade, isHomem, frequencia);

    // Macros por aba
    const macrosByDay = {};
    for (const dayType of DAY_TYPES) {
        macrosByDay[dayType] = calcMacrosForDayType(peso, tdee, objetivo, isHomem, dayType);
    }

    // Distribuição semanal
    const distribution = weekDist ?? suggestWeekDistribution(frequencia, objetivo);

    // Média semanal ponderada
    let totalKcal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;
    for (const dayType of DAY_TYPES) {
        const days   = distribution[dayType] || 0;
        const macros = macrosByDay[dayType];
        totalKcal += macros.kcal * days;
        totalProt += macros.prot * days;
        totalCarb += macros.carb * days;
        totalFat  += macros.fat  * days;
    }

    const avgKcal = Math.round(totalKcal / 7);
    const avgProt = Math.round(totalProt / 7);
    const avgCarb = Math.round(totalCarb / 7);
    const avgFat  = Math.round(totalFat  / 7);

    // Déficit/superávit semanal e estimativa de resultado
    const deficitSemanal   = Math.round(tdee * 7 - totalKcal);
    const kgEstimadoSemana = parseFloat((deficitSemanal / 7700).toFixed(2));
    // Positivo = perde gordura (déficit), Negativo = ganha peso (superávit)

    return {
        tmb,
        tdee,
        objetivo,
        isHomem,
        macrosByDay,
        distribution,
        weekly: {
            totalKcal: Math.round(totalKcal),
            deficitSemanal,
            kgEstimadoSemana,
            avg: { kcal: avgKcal, prot: avgProt, carb: avgCarb, fat: avgFat },
        },
    };
}

// ─── HELPER: CALCULAR IDADE ───────────────────────────────────────────────────
export function calcAge(birthDate) {
    if (!birthDate) return 30;
    let d;
    const s = String(birthDate);
    if (s.includes('/')) {
        const [day, month, year] = s.split('/');
        d = new Date(`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`);
    } else {
        d = new Date(s);
    }
    if (isNaN(d.getTime())) return 30;
    const hoje = new Date();
    let age = hoje.getFullYear() - d.getFullYear();
    const m = hoje.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) age--;
    return age > 0 && age < 120 ? age : 30;
}