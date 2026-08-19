// src/utils/muscleMap.js
// 🔥 MAPA MUSCULAR — corpo vetorial (silhueta contínua + regiões musculares
// "pintadas" por cima), usado tanto pelo componente <MapaMuscular /> quanto
// pelo gerador de PDF (mesma silhueta embutida direto no HTML). Um único
// ponto de verdade pras coordenadas, então o resultado é idêntico nos dois
// lugares.
//
// v2 (19/ago/2026): redesenhado do zero depois do feedback de que a versão
// anterior (retângulos/elipses soltos, cada um com borda preta) parecia um
// "quebra-cabeça de caixas" em vez de um corpo. A solução: 1 silhueta única,
// contínua, sempre cinza-neutra e sem bordas internas (então SEMPRE parece um
// corpo coerente, mesmo sem nenhum destaque) + regiões musculares desenhadas
// POR CIMA dela só quando estão realmente ativas (sem borda, encaixadas na
// silhueta) — é assim que apps de treino (Fitbod, Strong, MuscleWiki) fazem.
//
// Cada exercício já guarda `muscPrincipal`/`muscSecundario` como texto livre
// (ex: "Glúteo Máximo", "Deltoide anterior, médio e posterior"). A função
// `normalizarMusculo` traduz esse texto pros ids fixos das regiões abaixo —
// por palavra-chave, sem depender de nenhum PDF/fonte externa, priorizando
// sempre a correspondência anatômica correta.

export const COR_PRINCIPAL = '#8B5CF6';
export const COR_SECUNDARIO = '#4DE38F';
export const COR_BASE = '#3a3a3a';

export const VIEW_BOX = { w: 220, h: 600 };

const CX = 110;

// ---------------------------------------------------------------------------
// Gera uma "cápsula" (forma de membro/músculo) com topo e base arredondados
// e uma "barriga" no meio pra simular volume muscular real — em vez de um
// retângulo cru. Só curvas (bezier + arco), sem cantos duros.
// ---------------------------------------------------------------------------
function capsula({ topX, topW, botX, botW, topY, botY, bulge = 0, bulgeAt = 0.42 }) {
    const topR = topW / 2, botR = botW / 2;
    const topL = topX - topR, topRx = topX + topR;
    const botL = botX - botR, botRx = botX + botR;
    const midY = topY + (botY - topY) * bulgeAt;
    const midW = Math.max(topW, botW) + bulge;
    const midX = topX + (botX - topX) * bulgeAt;
    const midR = midW / 2;
    const midL = midX - midR, midRx = midX + midR;
    const n = (v) => Math.round(v * 10) / 10;

    return [
        `M ${n(topL)},${n(topY + topR * 0.5)}`,
        `C ${n(topL - topR * 0.15)},${n(topY + (midY - topY) * 0.55)} ${n(midL)},${n(midY - (midY - topY) * 0.35)} ${n(midL)},${n(midY)}`,
        `C ${n(midL)},${n(midY + (botY - midY) * 0.45)} ${n(botL - (midL - botL) * 0.1)},${n(botY - (botY - midY) * 0.4)} ${n(botL)},${n(botY - botR * 0.5)}`,
        `A ${n(botR)},${n(botR)} 0 0 0 ${n(botRx)},${n(botY - botR * 0.5)}`,
        `C ${n(botRx + (midRx - botRx) * 0.1)},${n(botY - (botY - midY) * 0.4)} ${n(midRx)},${n(midY + (botY - midY) * 0.45)} ${n(midRx)},${n(midY)}`,
        `C ${n(midRx)},${n(midY - (midY - topY) * 0.35)} ${n(topRx + topR * 0.15)},${n(topY + (midY - topY) * 0.55)} ${n(topRx)},${n(topY + topR * 0.5)}`,
        `A ${n(topR)},${n(topR)} 0 0 0 ${n(topL)},${n(topY + topR * 0.5)}`,
        'Z',
    ].join(' ');
}

function path(d) { return { tipo: 'path', attrs: { d } }; }
function ell(cx, cy, rx, ry) { return { tipo: 'ellipse', attrs: { cx, cy, rx, ry } }; }
function circ(cx, cy, r) { return { tipo: 'circle', attrs: { cx, cy, r } }; }

// ---- Silhueta base — sempre desenhada, idêntica pra frente/costas ----
const TORSO = capsula({ topX: CX, topW: 104, botX: CX, botW: 58, topY: 84, botY: 226, bulge: 6, bulgeAt: 0.34 });
const QUADRIL = capsula({ topX: CX, topW: 60, botX: CX, botW: 92, topY: 216, botY: 274, bulge: 0, bulgeAt: 0.5 });
const BRACO_ESQ = capsula({ topX: 44, topW: 40, botX: 40, botW: 30, topY: 92, botY: 208, bulge: 8, bulgeAt: 0.45 });
const BRACO_DIR = capsula({ topX: 176, topW: 40, botX: 180, botW: 30, topY: 92, botY: 208, bulge: 8, bulgeAt: 0.45 });
const ANTEBRACO_ESQ = capsula({ topX: 38, topW: 28, botX: 34, botW: 18, topY: 200, botY: 318, bulge: 3, bulgeAt: 0.3 });
const ANTEBRACO_DIR = capsula({ topX: 182, topW: 28, botX: 186, botW: 18, topY: 200, botY: 318, bulge: 3, bulgeAt: 0.3 });
const COXA_ESQ = capsula({ topX: 84, topW: 54, botX: 88, botW: 36, topY: 262, botY: 418, bulge: 6, bulgeAt: 0.72 });
const COXA_DIR = capsula({ topX: 136, topW: 54, botX: 132, botW: 36, topY: 262, botY: 418, bulge: 6, bulgeAt: 0.72 });
const PANTURRILHA_ESQ = capsula({ topX: 88, topW: 30, botX: 92, botW: 18, topY: 410, botY: 538, bulge: 9, bulgeAt: 0.32 });
const PANTURRILHA_DIR = capsula({ topX: 132, topW: 30, botX: 128, botW: 18, topY: 410, botY: 538, bulge: 9, bulgeAt: 0.32 });

export const BASE_SHAPES = [
    path(BRACO_ESQ), path(BRACO_DIR),
    path(ANTEBRACO_ESQ), path(ANTEBRACO_DIR),
    ell(38, 328, 13, 15), ell(182, 328, 13, 15), // mãos
    path(QUADRIL),
    path(COXA_ESQ), path(COXA_DIR),
    path(PANTURRILHA_ESQ), path(PANTURRILHA_DIR),
    ell(90, 552, 17, 10), ell(130, 552, 17, 10), // pés
    path(TORSO),
    circ(CX, 44, 30), // cabeça
    ell(CX, 78, 15, 13), // pescoço
];

const TRAPEZIO_PATH = 'M 110,80 C 96,88 78,98 68,112 L 86,168 C 96,178 104,184 110,188 C 116,184 124,178 134,168 L 152,112 C 142,98 124,88 110,80 Z';

// ---- Regiões musculares — só desenhadas quando ativas (principal/secundário) ----
export const OVERLAYS_FRENTE = {
    deltoide_frente: [ell(44, 100, 22, 20), ell(176, 100, 22, 20)],
    peitoral: [ell(88, 128, 27, 30), ell(132, 128, 27, 30)],
    biceps: [
        path(capsula({ topX: 44, topW: 34, botX: 42, botW: 25, topY: 100, botY: 175, bulge: 7, bulgeAt: 0.5 })),
        path(capsula({ topX: 176, topW: 34, botX: 178, botW: 25, topY: 100, botY: 175, bulge: 7, bulgeAt: 0.5 })),
    ],
    antebraco: [path(ANTEBRACO_ESQ), path(ANTEBRACO_DIR)],
    abdomen: [path(capsula({ topX: CX, topW: 44, botX: CX, botW: 38, topY: 148, botY: 216, bulge: 2, bulgeAt: 0.5 }))],
    obliquos: [
        path(capsula({ topX: 74, topW: 15, botX: 78, botW: 12, topY: 152, botY: 212, bulge: 1, bulgeAt: 0.5 })),
        path(capsula({ topX: 146, topW: 15, botX: 142, botW: 12, topY: 152, botY: 212, bulge: 1, bulgeAt: 0.5 })),
    ],
    quadriceps: [path(COXA_ESQ), path(COXA_DIR)],
    adutores: [path(capsula({ topX: CX, topW: 20, botX: CX, botW: 16, topY: 270, botY: 380, bulge: 2, bulgeAt: 0.4 }))],
    canela: [path(PANTURRILHA_ESQ), path(PANTURRILHA_DIR)],
};

export const OVERLAYS_COSTAS = {
    trapezio: [path(TRAPEZIO_PATH)],
    deltoide_posterior: [ell(44, 100, 19, 20), ell(176, 100, 19, 20)],
    triceps: [
        path(capsula({ topX: 44, topW: 32, botX: 40, botW: 24, topY: 108, botY: 202, bulge: 5, bulgeAt: 0.5 })),
        path(capsula({ topX: 176, topW: 32, botX: 180, botW: 24, topY: 108, botY: 202, bulge: 5, bulgeAt: 0.5 })),
    ],
    antebraco: [path(ANTEBRACO_ESQ), path(ANTEBRACO_DIR)],
    costas: [
        path(capsula({ topX: 78, topW: 30, botX: 84, botW: 22, topY: 142, botY: 216, bulge: 4, bulgeAt: 0.45 })),
        path(capsula({ topX: 142, topW: 30, botX: 136, botW: 22, topY: 142, botY: 216, bulge: 4, bulgeAt: 0.45 })),
    ],
    romboides: [ell(110, 128, 20, 17)],
    lombar: [path(capsula({ topX: CX, topW: 38, botX: CX, botW: 30, topY: 202, botY: 250, bulge: 2, bulgeAt: 0.5 }))],
    gluteos: [ell(86, 250, 27, 27), ell(134, 250, 27, 27)],
    isquiotibiais: [path(COXA_ESQ), path(COXA_DIR)],
    panturrilha: [path(PANTURRILHA_ESQ), path(PANTURRILHA_DIR)],
};

// Ordem de empilhamento: músculos "de base" (grandes) primeiro, músculos finos
// ou de detalhe por último — assim um músculo fino (ex: adutores) nunca fica
// escondido atrás de um vizinho maior (ex: quadríceps), não importa se é
// principal ou secundário.
const Z_FRENTE = ['quadriceps', 'peitoral', 'biceps', 'antebraco', 'abdomen', 'deltoide_frente', 'obliquos', 'adutores', 'canela'];
const Z_COSTAS = ['costas', 'isquiotibiais', 'panturrilha', 'triceps', 'antebraco', 'trapezio', 'gluteos', 'deltoide_posterior', 'romboides', 'lombar'];

// ---------------------------------------------------------------------------
// Normalizador: texto livre (como já está salvo em muscPrincipal/muscSecundario)
// -> lista de { id, vista } anatomicamente corretos. Baseado em palavra-chave,
// checa TODAS as ocorrências no texto (não para na primeira), então um campo
// como "Deltoide anterior, médio e posterior" acende as duas vistas.
// ---------------------------------------------------------------------------
function semAcento(s) {
    return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

const REGRAS = [
    { test: (t) => /deltoide.*(anterior|frontal)/.test(t) || /(anterior|frontal).*deltoide/.test(t), r: [{ id: 'deltoide_frente', vista: 'frente' }] },
    { test: (t) => /deltoide.*posterior/.test(t) || /posterior.*deltoide/.test(t), r: [{ id: 'deltoide_posterior', vista: 'costas' }] },
    { test: (t) => /deltoide/.test(t), r: [{ id: 'deltoide_frente', vista: 'frente' }, { id: 'deltoide_posterior', vista: 'costas' }] },
    { test: (t) => /peitoral|peito\b/.test(t), r: [{ id: 'peitoral', vista: 'frente' }] },
    { test: (t) => /triceps/.test(t), r: [{ id: 'triceps', vista: 'costas' }] },
    { test: (t) => /biceps/.test(t), r: [{ id: 'biceps', vista: 'frente' }] },
    { test: (t) => /antebraco|punho|preensao/.test(t), r: [{ id: 'antebraco', vista: 'frente' }, { id: 'antebraco', vista: 'costas' }] },
    { test: (t) => /trapezio/.test(t), r: [{ id: 'trapezio', vista: 'costas' }] },
    { test: (t) => /rombóide|romboide/.test(t), r: [{ id: 'romboides', vista: 'costas' }] },
    { test: (t) => /dorsal|latissimo|grande dorso|costas\b/.test(t), r: [{ id: 'costas', vista: 'costas' }] },
    { test: (t) => /lombar|eretor|paravertebral|espinhais/.test(t), r: [{ id: 'lombar', vista: 'costas' }] },
    { test: (t) => /reto abdominal|abdomen|abdominais|abdominal\b/.test(t), r: [{ id: 'abdomen', vista: 'frente' }] },
    { test: (t) => /obliquo/.test(t), r: [{ id: 'obliquos', vista: 'frente' }] },
    { test: (t) => /\bcore\b/.test(t), r: [{ id: 'abdomen', vista: 'frente' }, { id: 'obliquos', vista: 'frente' }] },
    { test: (t) => /serratil/.test(t), r: [{ id: 'obliquos', vista: 'frente' }] },
    { test: (t) => /quadriceps|vasto|reto femoral/.test(t), r: [{ id: 'quadriceps', vista: 'frente' }] },
    { test: (t) => /flexor.*quadril|iliopsoas|psoas|quadril\b/.test(t), r: [{ id: 'quadriceps', vista: 'frente' }] },
    { test: (t) => /\btfl\b|tensor da fascia lata/.test(t), r: [{ id: 'quadriceps', vista: 'frente' }] },
    { test: (t) => /adutor/.test(t), r: [{ id: 'adutores', vista: 'frente' }] },
    { test: (t) => /abdutor/.test(t), r: [{ id: 'gluteos', vista: 'costas' }] },
    { test: (t) => /gluteo/.test(t), r: [{ id: 'gluteos', vista: 'costas' }] },
    { test: (t) => /isquiotibial|posterior de coxa|femoral\b/.test(t), r: [{ id: 'isquiotibiais', vista: 'costas' }] },
    { test: (t) => /panturrilha|gastrocnemio|soleo/.test(t), r: [{ id: 'panturrilha', vista: 'costas' }] },
    { test: (t) => /canela|tibial anterior|tornozelo/.test(t), r: [{ id: 'canela', vista: 'frente' }] },
];

export function normalizarMusculo(nome) {
    const t = semAcento(nome);
    if (!t.trim()) return [];
    const encontrados = [];
    for (const regra of REGRAS) {
        if (regra.test(t)) encontrados.push(...regra.r);
    }
    const vistos = new Set();
    return encontrados.filter((r) => {
        const k = `${r.id}|${r.vista}`;
        if (vistos.has(k)) return false;
        vistos.add(k);
        return true;
    });
}

// Recebe os arrays (ou strings) muscPrincipal/muscSecundario de um exercício
// e devolve os sets já separados por vista, prontos pra colorir o diagrama.
export function calcularRegioesAtivas(muscPrincipal, muscSecundario) {
    const listaPrincipal = Array.isArray(muscPrincipal) ? muscPrincipal : (muscPrincipal ? [muscPrincipal] : []);
    const listaSecundario = Array.isArray(muscSecundario) ? muscSecundario : (muscSecundario ? [muscSecundario] : []);

    const principalFrente = new Set(), principalCostas = new Set();
    const secundarioFrente = new Set(), secundarioCostas = new Set();

    for (const nome of listaPrincipal) {
        for (const { id, vista } of normalizarMusculo(nome)) {
            (vista === 'frente' ? principalFrente : principalCostas).add(id);
        }
    }
    for (const nome of listaSecundario) {
        for (const { id, vista } of normalizarMusculo(nome)) {
            const jaPrincipal = vista === 'frente' ? principalFrente.has(id) : principalCostas.has(id);
            if (!jaPrincipal) (vista === 'frente' ? secundarioFrente : secundarioCostas).add(id);
        }
    }

    return { principalFrente, principalCostas, secundarioFrente, secundarioCostas };
}

// Monta a lista ordenada (z-index correto) de formas de destaque pra uma
// vista, prontas pra virar <Path>/<Ellipse>/<Circle> (RN) ou string SVG (PDF).
export function overlaysAtivos(view, principalSet, secundarioSet) {
    const map = view === 'frente' ? OVERLAYS_FRENTE : OVERLAYS_COSTAS;
    const ordem = view === 'frente' ? Z_FRENTE : Z_COSTAS;
    const itens = [
        ...[...principalSet].map((id) => ({ id, cor: COR_PRINCIPAL })),
        ...[...secundarioSet].map((id) => ({ id, cor: COR_SECUNDARIO })),
    ];
    itens.sort((a, b) => ordem.indexOf(a.id) - ordem.indexOf(b.id));

    const formas = [];
    for (const { id, cor } of itens) {
        for (const forma of (map[id] || [])) {
            formas.push({ ...forma, cor });
        }
    }
    return formas;
}

// ---------------------------------------------------------------------------
// Gera o markup <svg>...</svg> cru (string), usado no HTML do PDF — mesma
// silhueta do componente React Native, só que como string estática.
// ---------------------------------------------------------------------------
function attrsToStr(attrs) {
    return Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
}
function formaToSvgString(forma, fill) {
    const tag = forma.tipo === 'circle' ? 'circle' : forma.tipo === 'ellipse' ? 'ellipse' : 'path';
    return `<${tag} ${attrsToStr(forma.attrs)} fill="${fill}" />`;
}

export function gerarSvgMarkup(view, principalSet, secundarioSet, { width = 130, height = Math.round(130 * VIEW_BOX.h / VIEW_BOX.w), fundo = '#141414' } = {}) {
    const base = BASE_SHAPES.map((f) => formaToSvgString(f, COR_BASE)).join('');
    const overlays = overlaysAtivos(view, principalSet, secundarioSet).map((f) => formaToSvgString(f, f.cor)).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_BOX.w} ${VIEW_BOX.h}" width="${width}" height="${height}">` +
        `<rect x="0" y="0" width="${VIEW_BOX.w}" height="${VIEW_BOX.h}" fill="${fundo}" rx="10"/>` +
        base + overlays +
        `</svg>`;
}
