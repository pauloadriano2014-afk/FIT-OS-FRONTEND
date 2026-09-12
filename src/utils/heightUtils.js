// src/utils/heightUtils.js
// 🔥 FIX (12/set/2026): corrige o erro comum de digitar a altura em metros
// (ex.: "1.74") em vez de centímetros (ex.: "174") no campo ALTURA (CM) da
// anamnese. Sem essa correção, a fórmula de TMB/TDEE (Mifflin-St Jeor, em
// macroPlanner.js) usa a altura errada e a meta de dieta do aluno sai
// completamente furada (TDEE e kcal muito abaixo do real).
//
// Ninguém tem menos de 10cm de altura, então um valor nessa faixa quase
// certamente foi digitado em metros — nesse caso convertemos automaticamente
// pra centímetros. O backend (app/api/anamnese/route.ts) faz a MESMA correção
// no momento de gravar, então isso aqui é só pra avisar o coach/aluno na hora
// (nenhum dado é perdido em nenhum dos dois pontos — só corrigido).
export function normalizeAlturaCm(rawValue) {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
        return { value: rawValue, corrected: false, original: rawValue };
    }
    const parsed = parseFloat(String(rawValue).replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
        return { value: rawValue, corrected: false, original: rawValue };
    }
    if (parsed < 10) {
        const corrected = Math.round(parsed * 100 * 10) / 10; // 1 casa decimal
        return { value: String(corrected), corrected: true, original: String(parsed) };
    }
    return { value: String(parsed), corrected: false, original: String(parsed) };
}
