// src/utils/macroPlanner.js
// ─────────────────────────────────────────────────────────────────────────────
// Calcula macros por aba (TREINO, TREINO_CARDIO, CARDIO, DESCANSO)
// levando em conta objetivo, gênero, frequência e dados físicos do aluno.
// Também sugere distribuição semanal de dias por aba.
// ─────────────────────────────────────────────────────────────────────────────

export const DAY_TYPES = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'];

export const DAY_TYPE_LABELS = {
    TREINO:        'Treino de Força',
    TREINO_CARDIO: 'Treino + Cardio',
    CARDIO:        'Só Cardio',
    DESCANSO:      'Descanso',
};

// ─── TDEE BASE ────────────────────────────────────────────────────────────────
function calcTDEE(peso, altura, idade, isHomem, frequencia) {
    let tmb = 10 * peso + 6.25 * altura - 5 * idade;
    tmb = isHomem ? tmb + 5 : tmb - 161;

    const fatAt =
        frequencia <= 1 ? 1.2   :
        frequencia <= 3 ? 1.375 :
        frequencia <= 5 ? 1.55  :
        frequencia <= 6 ? 1.725 : 1.9;

    return { tmb: Math.round(tmb), tdee: Math.round(tmb * fatAt) };
}

// ─── MULTIPLICADORES POR OBJETIVO E ABA ──────────────────────────────────────
// kcalDelta  = kcal a somar/subtrair do TDEE
// carbMult   = multiplicador sobre o carbo base
// fatMult    = multiplicador sobre a gordura base
const OBJECTIVE_MATRIX = {
    Emagrecimento: {
        TREINO:        { kcalDelta: -300, carbMult: 1.00, fatMult: 1.00 },
        TREINO_CARDIO: { kcalDelta: -100, carbMult: 1.15, fatMult: 1.00 },
        CARDIO:        { kcalDelta: -500, carbMult: 0.65, fatMult: 0.90 },
        DESCANSO:      { kcalDelta: -700, carbMult: 0.40, fatMult: 0.85 },
    },
    Definição: {
        TREINO:        { kcalDelta: -150, carbMult: 1.00, fatMult: 1.00 },
        TREINO_CARDIO: { kcalDelta:  -50, carbMult: 1.10, fatMult: 1.00 },
        CARDIO:        { kcalDelta: -300, carbMult: 0.75, fatMult: 0.90 },
        DESCANSO:      { kcalDelta: -400, carbMult: 0.55, fatMult: 0.85 },
    },
    Hipertrofia: {
        TREINO:        { kcalDelta: +300, carbMult: 1.10, fatMult: 1.00 },
        TREINO_CARDIO: { kcalDelta: +400, carbMult: 1.25, fatMult: 1.00 },
        CARDIO:        { kcalDelta:    0, carbMult: 0.85, fatMult: 1.00 },
        DESCANSO:      { kcalDelta: -200, carbMult: 0.60, fatMult: 0.90 },
    },
};

// ─── PROTEÍNA POR GÊNERO E ABA ────────────────────────────────────────────────
function getProtMult(isHomem, dayType) {
    if (isHomem) return 2.2; // fixo em todas as abas
    // Mulher: 1.5g nos dias de estímulo, 1.2g nos outros
    return ['TREINO', 'TREINO_CARDIO'].includes(dayType) ? 1.5 : 1.2;
}

// ─── CÁLCULO DE MACROS PARA UMA ABA ──────────────────────────────────────────
function calcMacrosForDayType(peso, tdee, objetivo, isHomem, dayType) {
    const matrix = (OBJECTIVE_MATRIX[objetivo] ?? OBJECTIVE_MATRIX['Emagrecimento'])[dayType];

    const protMult = getProtMult(isHomem, dayType);
    const protAlvo = Math.round(peso * protMult);
    const fatBase  = Math.round(peso * 1.0);
    const fatAlvo  = Math.max(30, Math.round(fatBase * matrix.fatMult));

    const kcalAlvo  = Math.max(1200, Math.round(tdee + matrix.kcalDelta));
    const calRest   = kcalAlvo - (protAlvo * 4) - (fatAlvo * 9);
    const carbBase  = Math.max(0, Math.round(calRest / 4));
    const carbAlvo  = Math.max(20, Math.round(carbBase * matrix.carbMult));

    // Recalcula kcal real após ajuste de carbo
    const kcalReal = Math.round(protAlvo * 4 + carbAlvo * 4 + fatAlvo * 9);

    return { kcal: kcalReal, prot: protAlvo, carb: carbAlvo, fat: fatAlvo };
}

// ─── DISTRIBUIÇÃO SEMANAL SUGERIDA ───────────────────────────────────────────
// Retorna quantos dias de cada aba por semana
export function suggestWeekDistribution(frequencia, objetivo) {
    const freq = Math.min(7, Math.max(1, Number(frequencia) || 3));

    // Tabela base de distribuição
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

    // Ajuste por objetivo: hipertrofia prioriza força, emagrecimento prioriza cardio
    if (objetivo === 'Hipertrofia' && freq >= 4) {
        // Converte 1 cardio em treino
        if (dist.CARDIO > 0) { dist.CARDIO -= 1; dist.TREINO += 1; }
    }
    if (['Emagrecimento', 'Definição'].includes(objetivo) && freq >= 5) {
        // Converte 1 treino em cardio
        if (dist.TREINO > 1) { dist.TREINO -= 1; dist.CARDIO += 1; }
    }

    return dist;
}

// ─── CÁLCULO COMPLETO DO PLANO SEMANAL ───────────────────────────────────────
/**
 * Retorna macros de cada aba + resumo semanal + perda/ganho estimado.
 *
 * @param {Object} anamnese  - dados da anamnese
 * @param {string} birthDate - do cadastro do aluno (DD/MM/AAAA ou YYYY-MM-DD)
 * @param {string} gender    - do cadastro ('Masculino' | 'Feminino')
 * @param {Object} weekDist  - distribuição editada pelo coach (opcional)
 */
export function calcWeeklyPlan(anamnese, birthDate, gender, weekDist = null) {
    const peso      = Number(anamnese?.peso)    || 70;
    const altura    = Number(anamnese?.altura)  || 170;
    const frequencia= Number(anamnese?.frequencia) || 3;
    const objetivo  = anamnese?.objetivo || 'Emagrecimento';
    const isHomem   = (anamnese?.gender ?? gender ?? '').toLowerCase().includes('masc');

    // Calcular idade real
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
        const days  = distribution[dayType] || 0;
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
    const deficitSemanal    = Math.round(tdee * 7 - totalKcal);
    const kgEstimadoSemana  = parseFloat((deficitSemanal / 7700).toFixed(2));
    // Positivo = perde gordura (déficit), Negativo = ganha peso (superávit)

    return {
        tmb,
        tdee,
        objetivo,
        isHomem,
        macrosByDay,      // macros de cada aba
        distribution,     // dias de cada aba na semana
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
    if (String(birthDate).includes('/')) {
        const [day, month, year] = birthDate.split('/');
        d = new Date(`${year}-${month}-${day}`);
    } else {
        d = new Date(birthDate);
    }
    if (isNaN(d.getTime())) return 30;
    const hoje = new Date();
    let age = hoje.getFullYear() - d.getFullYear();
    const m = hoje.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) age--;
    return age > 0 && age < 120 ? age : 30;
}