// src/utils/muscleMap.js
// 🔥 MAPA MUSCULAR — v3 (19/ago/2026). Depois do feedback de que a v1 (formas
// geométricas com borda) e a v2 (silhueta vetorial própria) ainda pareciam
// "desenho feito à mão" e não anatomicamente convincentes, esta versão troca
// a arte por um atlas muscular REAL: a ilustração "Muscular system" (autoria
// e licença: ver ATRIBUIÇÃO no fim deste arquivo), a mesma usada pelo app
// open-source wger (wger.de) pra exatamente esse fim — destacar o(s)
// músculo(s) trabalhado(s) num exercício. Corpo inteiro + 16 grupos
// musculares individualmente recortados (frente e costas), prontos pra
// colorir por cima da silhueta neutra.
//
// Não é o render 3D "glossy" que foi pedido como referência (esse estilo
// exige uma ferramenta de geração de imagem que não está disponível aqui) —
// mas é uma ilustração anatômica real, com a forma de cada músculo
// desenhada por um ilustrador médico, não aproximada por mim. Prioriza
// fidelidade sobre estilo, que foi o pedido original.
//
// `src/utils/muscleAtlas.json` guarda os dados brutos (paths + transform de
// cada peça, extraídos e limpos dos SVGs originais). Este arquivo só tem a
// lógica: normalização de texto → ids de músculo, cálculo de regiões ativas,
// montagem do SVG (both pro componente React Native e pro PDF).
import atlas from './muscleAtlas.json';

export const COR_PRINCIPAL = '#8B5CF6';
export const COR_SECUNDARIO = '#4DE38F';
export const COR_BASE = '#4a4a4a';

export const VIEW_BOX = { w: 200, h: 369 };

// ---- Os 16 grupos musculares do atlas (mesmo conjunto usado pelo wger) ----
export const MUSCLE_INFO = {
    1: { nome: 'Bíceps', frente: true },
    2: { nome: 'Deltoide', frente: true },
    3: { nome: 'Serrátil anterior', frente: true },
    4: { nome: 'Peitoral', frente: true },
    5: { nome: 'Tríceps', frente: false },
    6: { nome: 'Abdômen', frente: true },
    7: { nome: 'Panturrilha', frente: false },
    8: { nome: 'Glúteos', frente: false },
    9: { nome: 'Trapézio', frente: false },
    10: { nome: 'Quadríceps', frente: true },
    11: { nome: 'Isquiotibiais', frente: false },
    12: { nome: 'Dorsais', frente: false },
    13: { nome: 'Braquial', frente: true },
    14: { nome: 'Oblíquos', frente: true },
    15: { nome: 'Panturrilha (sóleo)', frente: false },
    16: { nome: 'Lombar', frente: false },
};

// ---------------------------------------------------------------------------
// Normalizador: texto livre (como já está salvo em muscPrincipal/muscSecundario)
// -> lista de ids do atlas (1-16). Por palavra-chave, checa TODAS as
// ocorrências no texto. Alguns músculos do seu conteúdo não têm uma peça
// exata no atlas (ex: adutores, antebraço isolado, panturrilha/tibial da
// frente) — nesses casos NÃO aproximo pra um músculo errado (preferi deixar
// sem destaque a mostrar o músculo errado); só aproximo quando a região é
// realmente vizinha/sobreposta (romboides→trapézio, abdutor/TFL→glúteo ou
// quadríceps), o que está marcado abaixo.
// ---------------------------------------------------------------------------
function semAcento(s) {
    return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

const REGRAS = [
    { test: (t) => /biceps/.test(t), ids: [1] },
    { test: (t) => /deltoide|ombro/.test(t), ids: [2] }, // atlas só tem deltoide (vista frontal); usado também pra menções a "posterior/médio"
    { test: (t) => /serratil/.test(t), ids: [3] },
    { test: (t) => /peitoral|peito\b/.test(t), ids: [4] },
    { test: (t) => /triceps/.test(t), ids: [5] },
    { test: (t) => /reto abdominal|abdomen|abdominais|abdominal\b/.test(t), ids: [6] },
    { test: (t) => /\bcore\b/.test(t), ids: [6, 14] },
    { test: (t) => /soleo/.test(t), ids: [15] },
    { test: (t) => /panturrilha|gastrocnemio/.test(t), ids: [7] },
    { test: (t) => /gluteo/.test(t), ids: [8] },
    { test: (t) => /abdutor/.test(t), ids: [8] }, // aproximação: abdutor de quadril é vizinho do glúteo médio
    { test: (t) => /trapezio/.test(t), ids: [9] },
    { test: (t) => /rombóide|romboide/.test(t), ids: [9] }, // aproximação: sem peça própria, fica logo abaixo do trapézio
    { test: (t) => /quadriceps|vasto|reto femoral/.test(t), ids: [10] },
    { test: (t) => /flexor.*quadril|iliopsoas|psoas|quadril\b/.test(t), ids: [10] }, // aproximação: região frontal do quadril
    { test: (t) => /\btfl\b|tensor da fascia lata/.test(t), ids: [10] }, // aproximação: lateral da coxa
    { test: (t) => /isquiotibia|posterior de coxa|femoral\b/.test(t), ids: [11] },
    { test: (t) => /dorsal|latissimo|grande dorso|costas\b/.test(t), ids: [12] },
    // "braquial" sozinho = músculo Braquial; mas "bíceps braquial" é só o
    // nome completo do próprio bíceps (não deve também acender o Braquial)
    { test: (t) => /braquial/.test(t) && !/biceps\s*braquial/.test(t), ids: [13] },
    { test: (t) => /obliquo/.test(t), ids: [14] },
    { test: (t) => /lombar|eretor|paravertebral|espinhais/.test(t), ids: [16] },
    // sem peça no atlas — não aproximo (evita destacar o músculo errado):
    // adutores, antebraço isolado, canela/tibial anterior
];

export function normalizarMusculo(nome) {
    const t = semAcento(nome);
    if (!t.trim()) return [];
    const ids = new Set();
    for (const regra of REGRAS) {
        if (regra.test(t)) regra.ids.forEach((id) => ids.add(id));
    }
    return [...ids];
}

// Recebe os arrays (ou strings) muscPrincipal/muscSecundario de um exercício
// e devolve os sets já separados por vista (frente/costas, definido pelo
// próprio músculo no atlas), prontos pra colorir o diagrama.
export function calcularRegioesAtivas(muscPrincipal, muscSecundario) {
    const listaPrincipal = Array.isArray(muscPrincipal) ? muscPrincipal : (muscPrincipal ? [muscPrincipal] : []);
    const listaSecundario = Array.isArray(muscSecundario) ? muscSecundario : (muscSecundario ? [muscSecundario] : []);

    const principalFrente = new Set(), principalCostas = new Set();
    const secundarioFrente = new Set(), secundarioCostas = new Set();

    for (const nome of listaPrincipal) {
        for (const id of normalizarMusculo(nome)) {
            (MUSCLE_INFO[id].frente ? principalFrente : principalCostas).add(id);
        }
    }
    for (const nome of listaSecundario) {
        for (const id of normalizarMusculo(nome)) {
            const jaPrincipal = MUSCLE_INFO[id].frente ? principalFrente.has(id) : principalCostas.has(id);
            if (!jaPrincipal) (MUSCLE_INFO[id].frente ? secundarioFrente : secundarioCostas).add(id);
        }
    }

    return { principalFrente, principalCostas, secundarioFrente, secundarioCostas };
}

// Ordem de empilhamento: grupos grandes primeiro, grupos menores/vizinhos
// por último — assim um destaque pequeno nunca fica escondido atrás de um
// vizinho maior quando os dois estão ativos ao mesmo tempo.
const Z_ORDEM = [12, 10, 8, 4, 9, 11, 7, 5, 2, 1, 13, 14, 3, 16, 6, 15];

// Monta a lista ordenada de "grupos" (cada um = {transform, paths, cor}) pra
// uma vista, prontos pra virar <G><Path/></G> (RN) ou string SVG (PDF).
export function overlaysAtivos(view, principalSet, secundarioSet) {
    const itens = [
        ...[...principalSet].map((id) => ({ id, cor: COR_PRINCIPAL, tipo: 'main' })),
        ...[...secundarioSet].map((id) => ({ id, cor: COR_SECUNDARIO, tipo: 'secondary' })),
    ];
    itens.sort((a, b) => Z_ORDEM.indexOf(a.id) - Z_ORDEM.indexOf(b.id));

    return itens
        .map(({ id, cor, tipo }) => {
            const grupo = atlas.muscles[id]?.[tipo];
            if (!grupo || !grupo.paths?.length) return null;
            return { transform: grupo.transform, paths: grupo.paths, cor };
        })
        .filter(Boolean);
}

export function corpoBase(view) {
    const grupo = view === 'frente' ? atlas.baseFrente : atlas.baseCostas;
    return { transform: grupo.transform, paths: grupo.paths };
}

// ---------------------------------------------------------------------------
// Gera o markup <svg>...</svg> cru (string), usado no HTML do PDF — mesmo
// atlas do componente React Native, só que como string estática.
// ---------------------------------------------------------------------------
function grupoToSvgString(grupo, fill) {
    if (!grupo || !grupo.paths?.length) return '';
    const inner = grupo.paths.map((p) => `<path d="${p.d}" fill="${fill}"/>`).join('');
    return grupo.transform ? `<g transform="${grupo.transform}">${inner}</g>` : inner;
}

export function gerarSvgMarkup(view, principalSet, secundarioSet, { width = 130, height = Math.round(130 * VIEW_BOX.h / VIEW_BOX.w), fundo = '#141414' } = {}) {
    const base = grupoToSvgString(corpoBase(view), COR_BASE);
    const overlays = overlaysAtivos(view, principalSet, secundarioSet)
        .map((g) => grupoToSvgString(g, g.cor))
        .join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_BOX.w} ${VIEW_BOX.h}" width="${width}" height="${height}">` +
        `<rect x="0" y="0" width="${VIEW_BOX.w}" height="${VIEW_BOX.h}" fill="${fundo}" rx="10"/>` +
        base + overlays +
        `</svg>`;
}

// ---------------------------------------------------------------------------
// ATRIBUIÇÃO: a ilustração base ("Muscular system" / "Muscular system-back",
// Wikimedia Commons) é reaproveitada tal como usada pelo projeto open-source
// wger (wger.de, licença AGPL) para o mesmo propósito — destacar músculos
// trabalhados por exercício. Não foi possível confirmar o texto exato da
// licença original a partir deste ambiente (sem acesso à página do Commons);
// pelo padrão desse tipo de arquivo (Creative Commons, uso comercial
// permitido com atribuição), recomendo manter um crédito discreto em algum
// lugar do app (ex: rodapé/configurações) — "Ilustração anatômica: Wikimedia
// Commons" — até confirmar os termos exatos.
// ---------------------------------------------------------------------------
