// src/components/ExerciseCard/TechInputRouter.js
import React from 'react';
import { normalizeNeonColor } from './useTechInfo';

import MobilityInput from './techInputs/MobilityInput';
import CardioInput from './techInputs/CardioInput';
import CustomTechInput from './techInputs/CustomTechInput';
import ClusterSetInput from './techInputs/ClusterSetInput';
import PyramidInput from './techInputs/PyramidInput';
import DropSetInput from './techInputs/DropSetInput';
import DefaultLoadInput from './techInputs/DefaultLoadInput';

// Substitui o antigo renderInputArea: decide qual layout de input renderizar
// com base na categoria do exercício e na técnica do bloco. A ORDEM DE PRIORIDADE
// abaixo é a mesma do código original — MOBILITY > CARDIO > CUSTOM_TECH >
// CLUSTERSET > '21' > DROPSET > padrão (carga única) — e não deve ser alterada,
// pois algumas condições poderiam tecnicamente colidir (ex: nada impede uma
// técnica customizada de também estar marcada como CARDIO).
export default function TechInputRouter({
  currentSetNum, isActive, block, categoryType, workoutModel, colors, getTechInfoFn,
  item, lastWeights, checkedSets, handleSaveWeight, handleSmartCheck, handleInputFocus,
  isTimerRunning, getPreviousWeight, startRestTimer,
}) {
  let techInfo = getTechInfoFn(block);
  techInfo = normalizeNeonColor(techInfo, colors);
  const hasPrescribedLoad = workoutModel === 'CARGA' && block.load && block.load.trim() !== '';

  const sharedProps = {
    item, currentSetNum, lastWeights, checkedSets,
    handleSaveWeight, handleSmartCheck, handleInputFocus,
    isTimerRunning, colors, getPreviousWeight, techInfo, block, hasPrescribedLoad,
    startRestTimer,
  };

  if (categoryType === 'MOBILITY') {
    return <MobilityInput block={block} colors={colors} />;
  }

  if (categoryType === 'CARDIO') {
    return <CardioInput {...sharedProps} />;
  }

  if (techInfo.key === 'CUSTOM_TECH') {
    return <CustomTechInput {...sharedProps} />;
  }

  if (techInfo.key === 'CLUSTERSET') {
    return <ClusterSetInput {...sharedProps} />;
  }

  if (techInfo.key === '21') {
    return <PyramidInput {...sharedProps} />;
  }

  if (techInfo.key === 'DROPSET') {
    return <DropSetInput {...sharedProps} />;
  }

  return <DefaultLoadInput {...sharedProps} />;
}