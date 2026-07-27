// src/utils/dietBuilderUtils.js
// Constantes e funções puras do assistente de montagem de dietas

export const BASE_URL = 'https://fitos-final.onrender.com';

export const MC = { kcal:'#FFCC00', p:'#32ADE6', c:'#FF9500', f:'#AF52DE' };

export const SLOT_ICONS = {
    'Café da Manhã':'coffee', 'Lanche da Manhã':'food-apple', 'Almoço':'silverware-fork-knife',
    'Lanche da Tarde':'food-croissant', 'Pré-Treino':'lightning-bolt',
    'Pré-Treino Rápido':'lightning-bolt', 'Pós-Treino':'arm-flex',
    'Jantar':'weather-night', 'Ceia':'moon-waning-crescent',
    'Ceia Pré-Treino':'moon-waning-crescent',
    'Quebra do Jejum (Pós-Treino)':'arm-flex',
};

export const CATEGORIES = [
    'Todas','Carboidratos','Carnes e Proteínas','Frios e Laticínios',
    'Vegetais e Legumes','Frutas','Gorduras e Oleaginosas',
    'Suplementos','Bebidas','Outros',
];

export const UNIT_OPTIONS = [
    { label:'g',         value:'g'        },
    { label:'ml',        value:'ml'       },
    { label:'unid.',     value:'un'       },
    { label:'col. sopa', value:'col_sopa' },
    { label:'col. chá',  value:'col_cha'  },
    { label:'fatia',     value:'fatia'    },
    { label:'xícara',    value:'xicara'   },
    { label:'punhado',   value:'punhado'  },
];

export const UNIT_FACTORS = {
    g:1, ml:1, un:100,
    col_sopa:15, col_cha:5,
    fatia:30, xicara:240, punhado:30,
};

// ─── TEMPO ────────────────────────────────────────────────────────────────────
export const toMin  = (t) => { if (!t||!t.includes(':')) return 0; const [h,m]=t.split(':').map(Number); return h*60+m; };
export const toTime = (m) => { const total=((m%1440)+1440)%1440; return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`; };
export const roundQ = (m) => toTime(Math.round(m/15)*15);

// ─── AGENDA ───────────────────────────────────────────────────────────────────
export function buildSchedule(anamnese, dayType) {
    const wake  = anamnese.wakeUpTime || '07:00';
    const sleep = anamnese.sleepTime  || '23:00';
    const train = anamnese.trainTime  || '18:00';
    const num   = Math.min(8, Math.max(2, Number(anamnese.mealsPerDay) || 5));
    const wakeMin  = toMin(wake);
    const sleepMin = toMin(sleep);
    const trainMin = toMin(train);
    const window   = sleepMin > wakeMin ? sleepMin - wakeMin : (1440 - wakeMin + sleepMin);

    if (dayType === 'DESCANSO') {
        const interval = Math.floor(window / Math.max(num - 1, 1));
        const names = ['Café da Manhã','Lanche da Manhã','Almoço','Lanche da Tarde','Jantar','Ceia','Lanche Extra 1','Lanche Extra 2'];
        return names.slice(0, num).map((name, i) => ({
            name, time: roundQ(wakeMin + interval * i),
            carbPriority: name==='Almoço' ? 'high' : name.includes('Café') ? 'medium' : 'low',
            protPriority: ['Almoço','Jantar'].includes(name) ? 'high' : 'medium',
        }));
    }

    const slots = [];
    const used  = new Set();
    const minsTillTrain = ((trainMin - wakeMin) + 1440) % 1440;

    if (minsTillTrain >= 60 && !anamnese.trainFasted) {
        const t = roundQ(trainMin - 70);
        slots.push({ name:'Pré-Treino', time:t, carbPriority:'high', protPriority:'medium' });
        used.add(t);
    } else if (!anamnese.trainFasted) {
        const t = roundQ(trainMin - 20);
        slots.push({ name:'Pré-Treino Rápido', time:t, carbPriority:'high', protPriority:'low' });
        used.add(t);
    }
    const posTime = roundQ(trainMin + 45);
    slots.push({ name:'Pós-Treino', time:posTime, carbPriority:'high', protPriority:'high' });
    used.add(posTime);

    const mainDefs = [
        { name:'Café da Manhã',   offset:0,    carbP:'medium', protP:'medium' },
        { name:'Lanche da Manhã', offset:0.2,  carbP:'medium', protP:'low'    },
        { name:'Almoço',          offset:0.4,  carbP:'high',   protP:'high'   },
        { name:'Lanche da Tarde', offset:0.6,  carbP:'low',    protP:'medium' },
        { name:'Jantar',          offset:0.8,  carbP:'low',    protP:'high'   },
        { name:'Ceia',            offset:0.95, carbP:'low',    protP:'medium' },
    ];
    const remaining = num - slots.length;
    mainDefs.slice(0, Math.max(remaining, 0)).forEach(def => {
        let ideal = wakeMin + Math.round(window * def.offset);
        let attempts = 0;
        while (attempts < 40) {
            const t = roundQ(ideal);
            const conflict = [...used].some(u => Math.abs(toMin(u) - toMin(t)) < 75);
            if (!conflict) { slots.push({ name:def.name, time:t, carbPriority:def.carbP, protPriority:def.protP }); used.add(t); break; }
            ideal += 15; attempts++;
        }
    });
    return slots.sort((a, b) => toMin(a.time) - toMin(b.time));
}

// ─── MACROS ───────────────────────────────────────────────────────────────────
export function distributeMacros(slots, totalMacros) {
    if (!slots.length) return [];
    const n = slots.length;
    const highCarbN = Math.max(slots.filter(s => s.carbPriority==='high').length, 1);
    const medCarbN  = Math.max(slots.filter(s => s.carbPriority==='medium').length, 1);
    const lowCarbN  = Math.max(slots.filter(s => s.carbPriority==='low').length, 1);
    const highProtN = Math.max(slots.filter(s => s.protPriority==='high').length, 1);
    const lowProtN  = Math.max(slots.filter(s => s.protPriority!=='high').length, 1);
    return slots.map(s => {
        const carbShare = s.carbPriority==='high' ? 0.60/highCarbN : s.carbPriority==='medium' ? 0.28/medCarbN : 0.12/lowCarbN;
        const protShare = s.protPriority==='high' ? 0.50/highProtN : 0.50/lowProtN;
        const c    = Math.round(totalMacros.carb * carbShare);
        const p    = Math.round(totalMacros.prot * protShare);
        const f    = Math.round(totalMacros.fat / n);
        const kcal = Math.round(p*4 + c*4 + f*9);
        return { ...s, target: { kcal, p, c, f } };
    });
}

export function calcSlotMacros(items) {
    return items.reduce((acc, item) => {
        const factor = (UNIT_FACTORS[item.unit] ?? 1) * parseFloat(item.amount) / 100;
        const base = item.food;
        acc.kcal += Math.round((base.calories_per_100 ?? base.kcal ?? 0) * factor);
        acc.p    += Math.round((base.p ?? base.protein ?? 0) * factor);
        acc.c    += Math.round((base.c ?? base.carbs   ?? 0) * factor);
        acc.f    += Math.round((base.f ?? base.fat     ?? 0) * factor);
        return acc;
    }, { kcal:0, p:0, c:0, f:0 });
}

export function suggestAmount(food, remainingKcal) {
    const kcalP100 = food.calories_per_100 ?? food.kcal ?? 0;
    if (!kcalP100 || remainingKcal <= 0) return 100;
    return Math.max(10, Math.min(Math.round((remainingKcal / kcalP100) * 100), 500));
}