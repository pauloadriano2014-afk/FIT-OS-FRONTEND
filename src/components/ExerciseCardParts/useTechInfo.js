// src/components/ExerciseCard/useTechInfo.js
import { identifyTechnique } from '../../utils/workoutUtils';

// Resolve as informações de exibição de uma técnica a partir de um bloco.
// Não é um hook React de fato (não usa useState/useEffect), mas fica nesta
// pasta porque é específico do ExerciseCard e usado em vários pontos do
// componente e dos inputs de técnica. Mantido como função pura, chamada
// diretamente (sem useCallback) — replica o comportamento original onde
// getTechInfo era recriada a cada render, sem efeito colateral relevante.
export function getTechInfo(blk, { TECH_GUIDE, colors }) {
  if (!blk) return { key: 'NORMAL', label: 'Normal', color: colors.border };
  const rawTech = blk.technique || "";
  let info = identifyTechnique(rawTech);

  if (blk.customTechniqueId && TECH_GUIDE && TECH_GUIDE[blk.customTechniqueId]) {
    const cTech = TECH_GUIDE[blk.customTechniqueId];
    return {
      ...info,
      key: 'CUSTOM_TECH',
      actualTechId: blk.customTechniqueId,
      label: cTech.title || cTech.name || rawTech,
      color: cTech.color || colors.primary,
      steps: Array.isArray(cTech.steps) ? cTech.steps : []
    };
  }
  return { ...info, actualTechId: info.key };
}

// Normaliza a cor de "neon padrão" (#CCFF00) para a cor de tema quando o fundo
// não é o preto absoluto que o neon foi desenhado para contrastar. Extraído porque
// essa mesma checagem aparecia repetida em 3 pontos do arquivo original
// (renderInputArea, no .forEach de blocks, e no topTechInfo).
export function normalizeNeonColor(techInfo, colors) {
  if (techInfo.color === '#CCFF00' && colors.bg !== '#000000') {
    return { ...techInfo, color: colors.primary };
  }
  return techInfo;
}