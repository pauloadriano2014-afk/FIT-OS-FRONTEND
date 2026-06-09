// src/components/GerarTreino/_helpers.js
import { MUSCLE_GROUPS } from './_constants';

export const buildDefaultDays = (freq) => {
  const letters = 'ABCDEFGHIJKLMNOP';
  const count = Math.min(Math.max(freq || 3, 1), 7);
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1), name: letters[i], groups: [], editingName: false,
  }));
};

export const suggestPhase = (objetivo) => {
  if (!objetivo) return 'HIPERTROFIA';
  const o = objetivo.toLowerCase();
  if (o.includes('emagrec')) return 'EMAGRECIMENTO';
  if (o.includes('defin'))   return 'DEFINICAO';
  if (o.includes('força') || o.includes('forca')) return 'FORCA';
  return 'HIPERTROFIA';
};

export const dayNeedsCardio = (groups, phase) => {
  if (!['EMAGRECIMENTO', 'DEFINICAO'].includes(phase)) return false;
  if (groups.some(g => g.id === 'CARDIO')) return false;
  return groups.some(g =>
    ['PEITO','COSTAS_PUXADA','COSTAS_REMADA','OMBRO_MULTI','OMBRO_FRONTAL',
     'OMBRO_LATERAL','OMBRO_POST','TRAPEZIO','BICEPS','TRICEPS','ABDOMEN'].includes(g.id)
  );
};

export const getGroupInfo = (id) => MUSCLE_GROUPS.find(g => g.id === id);

export const getLevelColor = (level, fallback = '#888') => {
  if (!level) return fallback;
  const l = level.toLowerCase();
  if (l.includes('iniciante')) return '#32ADE6';
  if (l.includes('interm'))    return '#FF9500';
  return '#FF3B30';
};