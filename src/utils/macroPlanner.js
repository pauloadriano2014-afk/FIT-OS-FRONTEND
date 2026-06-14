// src/utils/macroPlanner.js — VERSÃO 2.0
// Correções vs v1:
//   FIX 1 — Gordura base: 1.0g/kg → 0.8g/kg manutenção, 0.6g/kg em déficit
//   FIX 2 — Proteína feminina: 1.2g/kg mínimo → 1.6g/kg em todos os dias (déficit)
//   FIX 3 — Carbo nunca negativo: recalcula kcal real se carbo zerar
//   FIX 4 — Fator atividade: usa frequência da anamnese corretamente
//   FIX 5 — isHomem: check explícito, não depende de substring silencioso
// ─────────────────────────────────────────────────────────────────────────────

export const DAY_TYPES = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'];

export const DAY_TYPE_LABELS = {
    TREINO:        'Treino de Força',
    TREINO_CARDIO: 'Treino + Cardio',
    CARDIO:        'Só Cardio',
    DESCANSO:      'Descanso',
};

// ─── FIX 5: isHomem explícito ────────────────────────────────────────────────
export function resolveGender(anamnese, genderParam) {
    const g = (anamnese?.gender ?? genderParam ?? '').trim().toLowerCase();
    return g === 'masculino' || g === 'male' || g === 'm';
}

// ─── FIX 4: TDEE com fator atividade correto ─────────────────────────────────
// Fórmula Mifflin-St Jeor (mais precisa que Harris-Benedict)
function calcTDEE(peso, altura, idade, isHomem, frequencia) {
    // TMB Mifflin-St Jeor
    const tmb = isHomem
        ? Math.round(10 * peso + 6.25 * altura - 5 * idade + 5)
        : Math.round(10 * peso + 6.25 * altura - 5 * idade - 161);

    // Fator de atividade baseado em frequência semanal de TREINO
    // (não conta cardio leve — usa frequência informada na anamnese)
    const fatAt =
        frequencia <= 1 ? 1.20 :   // Sedentário / 1x
        frequencia <= 2 ? 1.30 :   // Leve / 2x
        frequencia <= 3 ? 1.375:   // Moderado / 3x
        frequencia <= 4 ? 1.475:   // Moderado+ / 4x
        frequencia <= 5 ? 1.55 :   // Ativo / 5x
        frequencia <= 6 ? 1.65 :   // Muito ativo / 6x
                          1.725;   // Atleta / 7x

    return { tmb, tdee: Math.round(tmb * fatAt) };
}

// ─── FIX 1 + FIX 2: Multiplicadores por objetivo e aba ──────────────────────
// kcalDelta  = delta sobre TDEE (positivo = superávit, negativo = déficit)
// fatBase_gkg = gordura em g/kg de peso corporal
// carbMult   = multiplicador aplicado sobre o carbo calculado
const OBJECTIVE_MATRIX = {
    Emagrecimento: {
        //                    kcalDelta  fatBase_gkg  carbMult
        TREINO:        { kcalDelta: -300, fatGkg: 0.70, carbMult: 1.00 },
        TREINO_CARDIO: { kcalDelta: -100, fatGkg: 0.70, carbMult: 1.15 },
        CARDIO:        { kcalDelta: -500, fatGkg: 0.65, carbMult: 0.65 },
        DESCANSO:      { kcalDelta: -600, fatGkg: 0.60, carbMult: 0.40 },
    },
    Definição: {
        TREINO:        { kcalDelta: -150, fatGkg: 0.75, carbMult: 1.00 },
        TREINO_CARDIO: { kcalDelta:  -50, fatGkg: 0.75, carbMult: 1.10 },
        CARDIO:        { kcalDelta: -300, fatGkg: 0.70, carbMult: 0.75 },
        DESCANSO:      { kcalDelta: -400, fatGkg: 0.65, carbMult: 0.55 },
    },
    Hipertrofia: {
        TREINO:        { kcalDelta: +300, fatGkg: 0.90, carbMult: 1.10 },
        TREINO_CARDIO: { kcalDelta: +400, fatGkg: 0.90, carbMult: 1.25 },
        CARDIO:        { kcalDelta:    0, fatGkg: 0.80, carbMult: 0.85 },
        DESCANSO:      { kcalDelta: -150, fatGkg: 0.75, carbMult: 0.60 },
    },
};

// ─── FIX 2: Proteína adequada por objetivo e gênero ──────────────────────────
// Referências: ISSN, ACSM, ESPEN
// Em déficit: proteína ALTA para preservar massa magra
// Em superávit (hipertrofia): proteína moderada-alta
function getProtGkg(isHomem, dayType, objetivo) {
    if (isHomem) {
        // Homem: 2.0-2.4g/kg dependendo do estímulo
        if (objetivo === 'Hipertrofia') {
            return ['TREINO', 'TREINO_CARDIO'].includes(dayType) ? 2.2 : 1.8;
        }
        // Emagrecimento / Definição: proteína alta em todos os dias
        return ['TREINO', 'TREINO_CARDIO'].includes(dayType) ? 2.4 : 2.0;
    } else {
        // Mulher: FIX 2 — mínimo 1.6g/kg em todos os dias (não mais 1.2g/kg)
        if (objetivo === 'Hipertrofia') {
            return ['TREINO', 'TREINO_CARDIO'].includes(dayType) ? 1.8 : 1.6;
        }
        // Emagrecimento / Definição: alta para preservar músculo
        return ['TREINO', 'TREINO_CARDIO'].includes(dayType) ? 2.0 : 1.6;
    }
}

// ─── CÁLCULO DE MACROS PARA UMA ABA ──────────────────────────────────────────
function calcMacrosForDayType(peso, tdee, objetivo, isHomem, dayType) {
    const matrix  = (OBJECTIVE_MATRIX[objetivo] ?? OBJECTIVE_MATRIX['Emagrecimento'])[dayType];

    // Proteína
    const protGkg  = getProtGkg(isHomem, dayType, objetivo);
    const protAlvo = Math.round(peso * protGkg);

    // FIX 1: Gordura base em g/kg (não mais peso * 1.0 fixo)
    const fatAlvo = Math.max(30, Math.round(peso * matrix.fatGkg));

    // Kcal alvo com piso mínimo de 1200 (mulher) ou 1400 (homem)
    const pisoKcal  = isHomem ? 1400 : 1200;
    const kcalAlvo  = Math.max(pisoKcal, Math.round(tdee + matrix.kcalDelta));

    // Calorias restantes para carbo após proteína e gordura
    const calRest = kcalAlvo - (protAlvo * 4) - (fatAlvo * 9);

    // FIX 3: Carbo nunca negativo
    // Se calRest < 0, significa que prot+fat já excedem kcal alvo.
    // Nesse caso, reduz gordura para abrir espaço (mas mantém mínimo de 30g)
    let carbAlvo: number;
    let fatFinal = fatAlvo;

    if (calRest < 80) { // Menos de 20g de carbo disponível
        // Reduz gordura gradualmente até liberar espaço para no mínimo 20g carbo
        const calNecessaria = 80; // 20g carbo mínimo = 80 kcal
        const calFaltando   = calNecessaria - calRest;
        const fatReducao    = Math.ceil(calFaltando / 9);
        fatFinal = Math.max(30, fatAlvo - fatReducao);
        const calRestCorrigida = kcalAlvo - (protAlvo * 4) - (fatFinal * 9);
        carbAlvo = Math.max(20, Math.round(calRestCorrigida / 4));
    } else {
        const carbBase = Math.round(calRest / 4);
        carbAlvo = Math.max(20, Math.round(carbBase * matrix.carbMult));
    }

    // Kcal real após todos os ajustes
    const kcalReal = Math.round(protAlvo * 4 + carbAlvo * 4 + fatFinal * 9);

    return { kcal: kcalReal, prot: protAlvo, carb: carbAlvo, fat: fatFinal };
}

// ─── DISTRIBUIÇÃO SEMANAL SUGERIDA ───────────────────────────────────────────
export function suggestWeekDistribution(frequencia, objetivo) {
    const freq = Math.min(7, Math.max(1, Number(frequencia) || 3));

    const base: Record<number, Record<string, number>> = {
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

    // FIX 5: resolução explícita de gênero
    const isHomem = resolveGender(anamnese, gender);

    // Idade real
    const idade = calcAge(birthDate || anamnese?.birthDate);

    const { tmb, tdee } = calcTDEE(peso, altura, idade, isHomem, frequencia);

    // Macros por aba
    const macrosByDay: Record<string, ReturnType<typeof calcMacrosForDayType>> = {};
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
export function calcAge(birthDate: string | undefined): number {
    if (!birthDate) return 30;
    let d: Date;
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
