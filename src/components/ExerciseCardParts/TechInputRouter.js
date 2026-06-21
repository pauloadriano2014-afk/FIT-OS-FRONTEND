// src/components/ExerciseCardParts/TechInputRouter.js
import React from 'react';
import { normalizeNeonColor } from './useTechInfo';

import MobilityInput from './techInputs/MobilityInput';
import CardioInput from './techInputs/CardioInput';
import CustomTechInput from './techInputs/CustomTechInput';
import ClusterSetInput from './techInputs/ClusterSetInput';
import PyramidInput from './techInputs/PyramidInput';
import DropSetInput from './techInputs/DropSetInput';
import DefaultLoadInput from './techInputs/DefaultLoadInput';

export default function TechInputRouter({
  currentSetNum, isActive, block, categoryType, workoutModel, colors, getTechInfoFn,
  item, lastWeights, checkedSets, handleSaveWeight, handleSmartCheck, handleInputFocus,
  isTimerRunning, getPreviousWeight, startRestTimer,
}) {
  if (!block) return <DefaultLoadInput item={item} currentSetNum={currentSetNum} lastWeights={lastWeights} handleSaveWeight={handleSaveWeight} handleSmartCheck={handleSmartCheck} isTimerRunning={isTimerRunning} colors={colors} getPreviousWeight={getPreviousWeight} block={{}} hasPrescribedLoad={false} startRestTimer={startRestTimer} checkedSets={checkedSets} handleInputFocus={handleInputFocus} />;

  let techInfo = typeof getTechInfoFn === 'function' ? getTechInfoFn(block) : {};
  techInfo = normalizeNeonColor(techInfo || {}, colors);
  
  const hasPrescribedLoad = workoutModel === 'CARGA' && !!block.load && String(block.load).trim() !== '';

  const sharedProps = {
    item, 
    currentSetNum, 
    lastWeights, 
    checkedSets,
    handleSaveWeight, 
    handleSmartCheck, 
    handleInputFocus,
    isTimerRunning, 
    colors, 
    getPreviousWeight, 
    techInfo, 
    block, 
    hasPrescribedLoad,
    startRestTimer,
  };

  if (categoryType === 'MOBILITY') {
    return <MobilityInput block={block} colors={colors} />;
  }

  if (categoryType === 'CARDIO') {
    return <CardioInput {...sharedProps} />;
  }

  // Verificações robustas para evitar o bypass do Android
  const techKey = techInfo.key || '';

  if (techKey === 'CUSTOM_TECH') {
    return <CustomTechInput {...sharedProps} />;
  }

  if (techKey === 'CLUSTERSET') {
    return <ClusterSetInput {...sharedProps} />;
  }

  if (techKey === '21') {
    return <PyramidInput {...sharedProps} />;
  }

  if (techKey === 'DROPSET') {
    return <DropSetInput {...sharedProps} />;
  }

  return <DefaultLoadInput {...sharedProps} />;
}