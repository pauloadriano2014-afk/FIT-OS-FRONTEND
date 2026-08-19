// src/utils/muscleMap.js
// 🔥 MAPA MUSCULAR — dados vetoriais (não depende de nenhuma imagem externa)
// usados tanto pelo componente <MapaMuscular /> (tela interativa) quanto pelo
// gerador de PDF (mesma silhueta embutida direto no HTML). Um único ponto de
// verdade pras coordenadas, então o resultado é idêntico nos dois lugares.
//
// Cada exercício já guarda `muscPrincipal`/`muscSecundario` como texto livre
// (ex: "Glúteo Máximo", "Deltoide anterior, médio e posterior"). A função
// `normalizarMusculo` traduz esse texto pros ids fixos das regiões abaixo —
// por palavra-chave, sem depender de nenhum PDF/fonte externa, priorizando
// sempre a correspondência anatômica correta (é o que foi pedido: fidelidade
// em qual músculo é realmente trabalhado).

const NEUTRO = '#2a2a2a';
const BASE = '#3a3a3a';
export const COR_PRINCIPAL = '#8B5CF6';
export const COR_SECUNDARIO = '#4DE38F';

export const VIEW_BOX = { w: 200, h: 460 };

// Cada região: { id, tipo, attrs, base? } — base=true nunca é destacada
// (cabeça, mãos, pés, canela/tornozelo) porque não são "músculo trabalhado".
export const REGIOES_FRENTE = [
    { id: 'cabeca', tipo: 'circle', attrs: { cx: 100, cy: 32, r: 28 }, base: true },
    { id: 'pescoco', tipo: 'rect', attrs: { x: 84, y: 56, width: 32, height: 18, rx: 8 }, base: true },
    { id: 'deltoide_frente', tipo: 'ellipse', attrs: { cx: 58, cy: 94, rx: 26, ry: 22 } },
    { id: 'deltoide_frente', tipo: 'ellipse', attrs: { cx: 142, cy: 94, rx: 26, ry: 22 } },
    { id: 'peitoral', tipo: 'ellipse', attrs: { cx: 83, cy: 118, rx: 28, ry: 32 } },
    { id: 'peitoral', tipo: 'ellipse', attrs: { cx: 117, cy: 118, rx: 28, ry: 32 } },
    { id: 'biceps', tipo: 'rect', attrs: { x: 32, y: 102, width: 30, height: 78, rx: 15 } },
    { id: 'biceps', tipo: 'rect', attrs: { x: 138, y: 102, width: 30, height: 78, rx: 15 } },
    { id: 'antebraco', tipo: 'rect', attrs: { x: 28, y: 178, width: 27, height: 68, rx: 13 } },
    { id: 'antebraco', tipo: 'rect', attrs: { x: 145, y: 178, width: 27, height: 68, rx: 13 } },
    { id: 'mao', tipo: 'circle', attrs: { cx: 41, cy: 256, r: 15 }, base: true },
    { id: 'mao', tipo: 'circle', attrs: { cx: 159, cy: 256, r: 15 }, base: true },
    { id: 'abdomen', tipo: 'rect', attrs: { x: 76, y: 150, width: 48, height: 68, rx: 14 } },
    { id: 'obliquos', tipo: 'rect', attrs: { x: 62, y: 152, width: 15, height: 64, rx: 7 } },
    { id: 'obliquos', tipo: 'rect', attrs: { x: 123, y: 152, width: 15, height: 64, rx: 7 } },
    { id: 'quadriceps', tipo: 'rect', attrs: { x: 56, y: 218, width: 36, height: 112, rx: 17 } },
    { id: 'quadriceps', tipo: 'rect', attrs: { x: 108, y: 218, width: 36, height: 112, rx: 17 } },
    { id: 'adutores', tipo: 'rect', attrs: { x: 90, y: 226, width: 20, height: 96, rx: 9 } },
    { id: 'canela', tipo: 'rect', attrs: { x: 64, y: 330, width: 26, height: 90, rx: 12 }, base: true },
    { id: 'canela', tipo: 'rect', attrs: { x: 110, y: 330, width: 26, height: 90, rx: 12 }, base: true },
    { id: 'pe', tipo: 'ellipse', attrs: { cx: 77, cy: 430, rx: 19, ry: 11 }, base: true },
    { id: 'pe', tipo: 'ellipse', attrs: { cx: 123, cy: 430, rx: 19, ry: 11 }, base: true },
];

export const REGIOES_COSTAS = [
    { id: 'cabeca', tipo: 'circle', attrs: { cx: 100, cy: 32, r: 28 }, base: true },
    { id: 'pescoco', tipo: 'rect', attrs: { x: 84, y: 56, width: 32, height: 18, rx: 8 }, base: true },
    { id: 'trapezio', tipo: 'path', attrs: { d: 'M100,54 L58,96 L75,152 L100,172 L125,152 L142,96 Z' } },
    { id: 'deltoide_posterior', tipo: 'ellipse', attrs: { cx: 48, cy: 96, rx: 17, ry: 21 } },
    { id: 'deltoide_posterior', tipo: 'ellipse', attrs: { cx: 152, cy: 96, rx: 17, ry: 21 } },
    { id: 'triceps', tipo: 'rect', attrs: { x: 30, y: 102, width: 28, height: 78, rx: 14 } },
    { id: 'triceps', tipo: 'rect', attrs: { x: 142, y: 102, width: 28, height: 78, rx: 14 } },
    { id: 'antebraco', tipo: 'rect', attrs: { x: 27, y: 178, width: 27, height: 68, rx: 13 } },
    { id: 'antebraco', tipo: 'rect', attrs: { x: 146, y: 178, width: 27, height: 68, rx: 13 } },
    { id: 'mao', tipo: 'circle', attrs: { cx: 40, cy: 256, r: 15 }, base: true },
    { id: 'mao', tipo: 'circle', attrs: { cx: 160, cy: 256, r: 15 }, base: true },
    { id: 'costas', tipo: 'rect', attrs: { x: 58, y: 132, width: 37, height: 78, rx: 18 } },
    { id: 'costas', tipo: 'rect', attrs: { x: 105, y: 132, width: 37, height: 78, rx: 18 } },
    { id: 'romboides', tipo: 'rect', attrs: { x: 86, y: 108, width: 28, height: 34, rx: 8 } },
    { id: 'lombar', tipo: 'rect', attrs: { x: 80, y: 208, width: 40, height: 34, rx: 14 } },
    { id: 'gluteos', tipo: 'ellipse', attrs: { cx: 78, cy: 260, rx: 27, ry: 29 } },
    { id: 'gluteos', tipo: 'ellipse', attrs: { cx: 122, cy: 260, rx: 27, ry: 29 } },
    { id: 'isquiotibiais', tipo: 'rect', attrs: { x: 60, y: 288, width: 34, height: 96, rx: 16 } },
    { id: 'isquiotibiais', tipo: 'rect', attrs: { x: 106, y: 288, width: 34, height: 96, rx: 16 } },
    { id: 'panturrilha', tipo: 'ellipse', attrs: { cx: 77, cy: 400, rx: 21, ry: 36 } },
    { id: 'panturrilha', tipo: 'ellipse', attrs: { cx: 123, cy: 400, rx: 21, ry: 36 } },
    { id: 'pe', tipo: 'ellipse', attrs: { cx: 77, cy: 430, rx: 19, ry: 11 }, base: true },
    { id: 'pe', tipo: 'ellipse', attrs: { cx: 123, cy: 430, rx: 19, ry: 11 }, base: true },
];

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

// Ordem importa pouco (todas são testadas), mas regras mais específicas
// (ex: "deltoide anterior") ficam antes da genérica ("deltoide").
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
    // dedup por id+vista
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
            // se já é principal naquela vista, não rebaixa pra secundário
            const jaPrincipal = vista === 'frente' ? principalFrente.has(id) : principalCostas.has(id);
            if (!jaPrincipal) (vista === 'frente' ? secundarioFrente : secundarioCostas).add(id);
        }
    }

    return { principalFrente, principalCostas, secundarioFrente, secundarioCostas };
}

// Cor de preenchimento de uma região dada os sets ativos daquela vista.
export function corDaRegiao(shape, principalSet, secundarioSet) {
    if (shape.base) return BASE;
    if (principalSet.has(shape.id)) return COR_PRINCIPAL;
    if (secundarioSet.has(shape.id)) return COR_SECUNDARIO;
    return NEUTRO;
}

// Gera o markup <svg>...</svg> cru (string), usado no HTML do PDF — mesma
// silhueta do componente React Native, só que como string estática.
function attrsToStr(attrs) {
    return Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
}
function shapeToSvgString(shape, fill) {
    const tag = shape.tipo === 'circle' ? 'circle' : shape.tipo === 'ellipse' ? 'ellipse' : shape.tipo === 'path' ? 'path' : 'rect';
    return `<${tag} ${attrsToStr(shape.attrs)} fill="${fill}" stroke="#0a0a0a" stroke-width="1.5" />`;
}

export function gerarSvgMarkup(regioes, principalSet, secundarioSet, { width = 130, height = 300, fundo = '#141414' } = {}) {
    const corpo = regioes.map((shape) => shapeToSvgString(shape, corDaRegiao(shape, principalSet, secundarioSet))).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_BOX.w} ${VIEW_BOX.h}" width="${width}" height="${height}">` +
        `<rect x="0" y="0" width="${VIEW_BOX.w}" height="${VIEW_BOX.h}" fill="${fundo}" rx="10"/>` +
        corpo +
        `</svg>`;
}
