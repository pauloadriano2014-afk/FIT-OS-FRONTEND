// src/components/MontarTreino/ExerciseCard/_constants.js

export const QUICK_OBS = [
    "Focar na cadência (movimento lento)",
    "Amplitude máxima",
    "Pico de contração (segurar 2s)",
    "Carga progressiva",
    "Cuidado com a postura",
    "Execute com as 2 pernas e depois descanse",
    "Execute com os 2 braços e depois descanse",
    "1 passada com a perna direita +1 passada com a pernas esquerda +1 agachamento = 1 repetição.",
    "1 pra frente +1 pro lado = 1 repetição."
];

export const getLoadCategoryKey = (name) => {
    const n = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (n.includes('caneleira') || n.includes('gluteo 4')) return 'caneleira';
    if (n.includes('halter') || n.includes('desenvolvimento') || n.includes('crucifixo') || n.includes('elevacao') || n.includes('rosca') || n.includes('triceps testa')) return 'halter';
    if (n.includes('leg') || n.includes('hack') || n.includes('agachamento') || n.includes('supino') || n.includes('terra') || n.includes('remada curvada') || n.includes('articulad')) return 'barra_pesada';
    if (n.includes('maquina') || n.includes('polia') || n.includes('cabo') || n.includes('cross') || n.includes('puxada') || n.includes('extensora') || n.includes('flexora') || n.includes('voador') || n.includes('peck') || n.includes('gluteo')) return 'maquina';
    if (n.includes('prancha') || n.includes('abdominal') || n.includes('livre') || n.includes('flexao') || n.includes('barra fixa')) return 'peso_corporal';
    return 'geral';
};

export const getDefaultLoads = (key) => {
    switch (key) {
        case 'caneleira':    return ['2kg', '4kg', '6kg', '8kg', '10kg', '12kg'];
        case 'halter':       return ['2kg', '4kg', '6kg', '8kg', '10kg', '12kg', '14kg', '16kg', '18kg', '20kg'];
        case 'barra_pesada': return ['10kg', '20kg', '30kg', '40kg', '50kg', '60kg', '80kg', '100kg'];
        case 'maquina':      return ['1 Placa', '2 Placas', '3 Placas', '4 Placas', '5 Placas', '6 Placas', '7 Placas', '8 Placas', '9 Placas', '10 Placas'];
        case 'peso_corporal':return ['Peso do Corpo', '+2kg', '+4kg', '+6kg', '+8kg', '+10kg'];
        default:             return ['5kg', '10kg', '15kg', '20kg', '25kg', '30kg', '35kg', '40kg'];
    }
};

export const OPTIONS_SETS_CARDIO = [
    { label: '10 min', val: '10' }, { label: '15 min', val: '15' },
    { label: '20 min', val: '20' }, { label: '30 min', val: '30' },
    { label: '45 min', val: '45' }, { label: '60 min', val: '60' },
];

export const OPTIONS_SETS_NORMAL = [
    { label: '1', val: '1' }, { label: '2', val: '2' }, { label: '3', val: '3' },
    { label: '4', val: '4' }, { label: '5', val: '5' }, { label: '6', val: '6' },
];

export const OPTIONS_REPS_CARDIO = [
    { label: '100 kcal', val: '100' }, { label: '150 kcal', val: '150' },
    { label: '200 kcal', val: '200' }, { label: '250 kcal', val: '250' },
    { label: '300 kcal', val: '300' }, { label: '400 kcal', val: '400' },
    { label: '500 kcal', val: '500' },
];

export const OPTIONS_REPS_NORMAL = [
    { label: 'Até a falha', val: 'Falha' }, { label: 'Máx', val: 'Máx' },
    { label: '6', val: '6' },   { label: '8', val: '8' },
    { label: '10', val: '10' }, { label: '12', val: '12' },
    { label: '15', val: '15' }, { label: '20', val: '20' },
    { label: '6 a 8', val: '6-8' },   { label: '8 a 10', val: '8-10' },
    { label: '10 a 12', val: '10-12' },{ label: '12 a 15', val: '12-15' },
    { label: '15 a 20', val: '15-20' },
];

export const OPTIONS_REST = [
    { label: 'Sem pausa', val: '0' },        { label: '30s', val: '30' },
    { label: '45s', val: '45' },             { label: '60s (1 min)', val: '60' },
    { label: '90s (1.5 min)', val: '90' },   { label: '120s (2 min)', val: '120' },
    { label: '3 min', val: '180' },
];

export const PYRAMID_PRESETS = [
    '15-12-10-8', '15-12-10-10', '15-12-12-10', '15-15-12-10',
    '15-12-10', '12-12-10', '12-10-10', '12-10-8'
];