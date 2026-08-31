// src/utils/groupTechniques.js
// 🔗 TÉCNICAS QUE AGRUPAM EXERCÍCIOS (BI-SET, TRI-SET, ...)
//
// Única fonte de verdade de "quais técnicas formam grupo, e de que tamanho".
// Usado tanto na tela do aluno (DayWorkoutScreen -- pra montar os grupos
// visuais) quanto na tela do admin (MontarTreinoAdmin -- pra mostrar o
// indicador ao vivo de "grupo formado/incompleto" enquanto o coach monta o
// treino). Adicionar uma nova técnica de agrupamento (ex: QUAD-SET) é só
// acrescentar uma linha aqui.
export const GROUP_SIZES = {
  BISET: 2,
  TRISET: 3,
};

export function isGroupTechnique(tech) {
  return !!GROUP_SIZES[tech];
}

export function groupSizeOf(tech) {
  return GROUP_SIZES[tech] || 0;
}
