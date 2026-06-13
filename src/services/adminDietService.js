// src/services/adminDietService.js — VERSÃO 4.2
const BASE_URL = 'https://fitos-final.onrender.com/api/admin';

export const fetchUserData       = async (userId) => {
    const res = await fetch(`${BASE_URL}/user/${userId}?t=${Date.now()}`);
    if (!res.ok) throw new Error('Erro ao buscar usuário');
    return res.json();
};
export const fetchDietData       = async (userId) => {
    const res = await fetch(`https://fitos-final.onrender.com/api/diet/${userId}?t=${Date.now()}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Erro ao buscar dieta');
    return res.json();
};
export const fetchStudentsList   = async () => {
    const res = await fetch(`${BASE_URL}/user`);
    if (!res.ok) throw new Error('Erro ao buscar alunos');
    return res.json();
};
export const fetchDietTemplates  = async () => {
    const res = await fetch(`${BASE_URL}/diet-templates`);
    if (!res.ok) throw new Error('Erro ao buscar templates de dieta');
    return res.json();
};
export const fetchMealTemplates  = async () => {
    const res = await fetch(`${BASE_URL}/meal-templates`);
    if (!res.ok) throw new Error('Erro ao buscar templates de refeição');
    return res.json();
};
export const cloneDietFromStudent = async (sourceStudentId) => {
    const res = await fetch(`${BASE_URL}/diet/${sourceStudentId}?t=${Date.now()}`);
    if (!res.ok) throw new Error('Dieta não encontrada');
    return res.json();
};
export const saveDietTemplate    = async (payload) => {
    const res = await fetch(`${BASE_URL}/diet-templates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao guardar modelo');
    return res.json();
};
export const saveMealTemplate    = async (payload) => {
    const res = await fetch(`${BASE_URL}/meal-templates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Falha ao guardar modelo de refeição');
    return res.json();
};
export const saveDiet            = async (payload) => {
    const res = await fetch(`${BASE_URL}/diet`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Erro no servidor ao salvar.');
    return res.json();
};

// ─── GERAR DIETA PARA UMA ABA ─────────────────────────────────────────────────
/**
 * @param {Object} anamnese   - dados da anamnese
 * @param {string} dayType    - 'TREINO' | 'TREINO_CARDIO' | 'CARDIO' | 'DESCANSO'
 * @param {string} provider   - 'openai' | 'openai-mini' | 'anthropic' | 'google'
 * @param {Object} aluno      - objeto do aluno (birthDate, gender)
 * @param {Object} macros     - macros pré-calculados para este dayType (opcional)
 */
export const generateAIDiet = async (anamnese, dayType = 'TREINO', provider = 'google', aluno = {}, macros = null) => {
    // 🔥 Trava de segurança aumentada para 5 minutos (300000ms)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); 

    try {
        const res = await fetch(`${BASE_URL}/generate-diet`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                anamnese,
                dayType,
                provider,
                birthDate: aluno.birthDate ?? null,
                gender:    aluno.gender    ?? null,
                macrosOverride: macros ?? null,
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Falha na IA (${provider}) para ${dayType}.`);
        }
        return res.json();
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
};

// ─── GERAR ABAS ATIVAS EM PARALELO (AGORA ENFILEIRADAS) ───────────────────────
/**
 * @param {Object}   anamnese      - dados da anamnese
 * @param {string}   provider      - modelo de IA
 * @param {Object}   aluno         - objeto do aluno
 * @param {string[]} activeDayTypes - ex: ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO']
 * @param {Object}   macrosByDay   - macros pré-calculados por aba (do macroPlanner)
 */
export const generateAllDayTypes = async (
    anamnese,
    provider     = 'anthropic',
    aluno        = {},
    activeDayTypes = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'],
    macrosByDay  = {},
    onProgress // 🔥 NOVO: Recebe o callback de progresso da tela
) => {
    const allMeals = [];
    const total = activeDayTypes.length;

    // 🔥 ENFILEIRAMENTO COM PORCENTAGEM
    for (let i = 0; i < total; i++) {
        const dayType = activeDayTypes[i];
        
        // Ex: 0%, 25%, 50%
        const pctStart = Math.round((i / total) * 100);
        if (onProgress) onProgress(`Gerando aba ${dayType.replace('_', '+')} (${i + 1}/${total}) — ${pctStart}% concluído...`);

        const result = await generateAIDiet(anamnese, dayType, provider, aluno, macrosByDay[dayType] ?? null);
        
        const normalized = (result.meals ?? []).map(m => ({ 
            ...m, 
            dayType: dayType 
        }));
        allMeals.push(...normalized);

        const pctEnd = Math.round(((i + 1) / total) * 100);
        if (onProgress) onProgress(`Aba ${dayType.replace('_', '+')} finalizada! — ${pctEnd}% concluído.`);
    }

    return allMeals;
};