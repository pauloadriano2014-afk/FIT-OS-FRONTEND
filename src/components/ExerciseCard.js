// src/components/ExerciseCard.js
import React, { useRef } from 'react';
import { View, Platform, Alert, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCategoryType } from '../utils/workoutUtils';

import useRestTimer from './ExerciseCardParts/useRestTimer';
import useVoiceAlert from './ExerciseCardParts/useVoiceAlert';
import { getTechInfo, normalizeNeonColor } from './ExerciseCardParts/useTechInfo';

import ExerciseCardMedia from './ExerciseCardParts/ExerciseCardMedia';
import BlockDivider from './ExerciseCardParts/BlockDivider';
import SetRow from './ExerciseCardParts/SetRow';
import RestIntervalLabel from './ExerciseCardParts/RestIntervalLabel';
import CoachObservation from './ExerciseCardParts/CoachObservation';
import SubstitutesPanel from './ExerciseCardParts/SubstitutesPanel';
import RestTimerModal from './ExerciseCardParts/RestTimerModal';

export const ExerciseCard = ({
  item, totalSets, lastWeights, historyWeights,
  handleSaveWeight, handleOpenVideo, setModalVisible,
  setSelectedTech, setTechModalVisible, TECH_GUIDE,
  isLastExercise, biSetType, onSwap, onOpenCalc, isTimerRunning,
  isVoiceEnabled, colors,
  checkedSets, handleCheckSet,
  hasPremiumFeatures,
  workoutModel,
  substitutes = [],
  studentGender,
}) => {

  const exerciseTitle = item.exercise?.name || item.name || "Exercício";
  const videoLink = item.exercise?.videoUrl || item.videoUrl;
  const thumbLink = item.exercise?.thumbUrl || item.thumbUrl || item.exercise?.imageUrl || item.imageUrl || item.exercise?.image || item.image;
  const howToExecute = item.exercise?.howToExecute || null;
  const commonMistakes = item.exercise?.commonMistakes || null;
  const maleFocus = item.exercise?.maleFocus || null;
  const femaleFocus = item.exercise?.femaleFocus || null;

  const standardRestTime = item.restTime || 60;

  const blocks = item.blocks && item.blocks.length > 0
    ? item.blocks
    : [{ sets: item.sets || totalSets, reps: item.reps, restTime: item.restTime, technique: item.technique || item.notes }];

  const categoryType = getCategoryType(item);
  const showTools = categoryType === 'STRENGTH';

  const videoRef = useRef(null);

  const calculateTotalSets = () => blocks.reduce((acc, block) => acc + (parseInt(block.sets) || 1), 0);

  const voice = useVoiceAlert(isVoiceEnabled);
  const timer = useRestTimer({
    standardRestTime, biSetType, isLastExercise, isVoiceEnabled,
    calculateTotalSets,
    playVoiceAlert: voice.playVoiceAlert,
    safeStopVoice: voice.safeStopVoice,
  });

  let realObservation = item.observation;
  if (!realObservation && item.technique && typeof item.technique === 'string' && item.technique.startsWith('{')) {
    try {
      const parsedTech = JSON.parse(item.technique);
      if (parsedTech.o) realObservation = parsedTech.o;
    } catch (e) {}
  }

  const getPreviousWeight = (key) => {
    if (historyWeights && historyWeights[item.exerciseId]) {
      const val = historyWeights[item.exerciseId][key];
      if (val) return `${val}`;
    }
    return '-';
  };

  const handleSmartCheck = (setKey, currentVal, blockRestTime, blockTechKey) => {
    if (!isTimerRunning) {
      if (Platform.OS === 'web') window.alert("Atenção: Aperte o PLAY lá em cima para começar a registrar!");
      else Alert.alert("Atenção", "Aperte o PLAY lá em cima para começar a registrar!");
      return;
    }
    Keyboard.dismiss();
    if (categoryType !== 'CARDIO' && (currentVal === undefined || currentVal === '' || currentVal === null)) {
      handleSaveWeight(item.id, '0', setKey);
    }
    handleCheckSet(item.id, setKey);
    if (categoryType === 'CARDIO') return;
    const totalSets = calculateTotalSets();
    const isLastSet = (typeof setKey === 'number' ? setKey : parseInt(setKey)) === totalSets;
    timer.startRestTimer(typeof setKey === 'number' ? setKey : parseInt(setKey), 'NORMAL', blockRestTime, blockTechKey, isLastSet);
  };

  const handleInputFocus = () => {
    if (!isTimerRunning) {
      Keyboard.dismiss();
      if (Platform.OS === 'web') window.alert("Treino Pausado: Clique em INICIAR TREINO no topo da tela para liberar os campos.");
      else Alert.alert("Treino Pausado", "Clique em INICIAR TREINO no topo da tela para liberar os campos.");
    }
  };

  const getTechInfoFn = (blk) => getTechInfo(blk, { TECH_GUIDE, colors });

  let currentSetGlobalTracker = 1;
  const renderedLines = [];

  blocks.forEach((block, blockIndex) => {
    const setsInBlock = parseInt(block.sets) || 1;
    let techInfo = getTechInfoFn(block);
    techInfo = normalizeNeonColor(techInfo, colors);

    if (blockIndex > 0 && techInfo.actualTechId && techInfo.actualTechId !== 'BISET' && techInfo.actualTechId !== 'NORMAL') {
      renderedLines.push(
        <BlockDivider
          key={`divider_${item.id}_${blockIndex}`}
          techInfo={techInfo} colors={colors}
          setSelectedTech={setSelectedTech} setTechModalVisible={setTechModalVisible}
        />
      );
    }

    const maxRenderSets = categoryType === 'CARDIO' ? 1 : setsInBlock;
    for (let i = 0; i < maxRenderSets; i++) {
      const currentSetNum = currentSetGlobalTracker;
      const isActive = timer.activeSetIndex === currentSetNum && timer.isResting;

      renderedLines.push(
        <SetRow
          key={`set_${item.id}_${currentSetNum}`}
          currentSetNum={currentSetNum} isActive={isActive} block={block}
          categoryType={categoryType} workoutModel={workoutModel} colors={colors}
          getTechInfoFn={getTechInfoFn} techInfoForRow={techInfo}
          item={item} lastWeights={lastWeights} checkedSets={checkedSets}
          handleSaveWeight={handleSaveWeight} handleSmartCheck={handleSmartCheck} handleInputFocus={handleInputFocus}
          isTimerRunning={isTimerRunning} getPreviousWeight={getPreviousWeight}
          startRestTimer={timer.startRestTimer}
        />
      );
      currentSetGlobalTracker++;
    }
  });

  let topTechInfo = getTechInfoFn(blocks[0] || item);
  topTechInfo = normalizeNeonColor(topTechInfo, colors);
  let topVideoText = '';
  if (categoryType === 'CARDIO') topVideoText = `${blocks[0]?.sets} Minutos | ${blocks[0]?.reps} Kcal`;
  else topVideoText = `${calculateTotalSets()} Séries Totais`;

  return (
    <View style={{ marginBottom: biSetType === 'start' ? 0 : 20 }}>
      <View style={[
        { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
        biSetType === 'start' && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
        biSetType === 'end' && { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 },
        (biSetType) && { borderColor: colors.primary, borderWidth: 2 }
      ]}>

        <ExerciseCardMedia
          thumbLink={thumbLink} videoLink={videoLink} videoRef={videoRef} handleOpenVideo={handleOpenVideo}
          topTechInfo={topTechInfo} colors={colors} setSelectedTech={setSelectedTech} setTechModalVisible={setTechModalVisible}
          showTools={showTools} hasPremiumFeatures={hasPremiumFeatures} onOpenCalc={onOpenCalc} 
          
          // 🔥 TRAVA INJETADA AQUI!
          setModalVisible={setModalVisible}
          
          exerciseTitle={exerciseTitle} topVideoText={topVideoText}
          howToExecute={howToExecute} commonMistakes={commonMistakes}
          maleFocus={maleFocus} femaleFocus={femaleFocus} studentGender={studentGender}
        />

        <View style={{ padding: 15 }}>
          {renderedLines}

          <RestIntervalLabel
            categoryType={categoryType} biSetType={biSetType} blocks={blocks}
            standardRestTime={standardRestTime} colors={colors}
          />

          <CoachObservation realObservation={realObservation} colors={colors} />

          <SubstitutesPanel onSwap={onSwap} substitutes={substitutes} colors={colors} />
        </View>

        <RestTimerModal
          isResting={timer.isResting} timerMessage={timer.timerMessage} seconds={timer.seconds}
          biSetType={biSetType} colors={colors} skipRest={timer.skipRest}
        />
      </View>

      {biSetType === 'start' &&
        <View style={{ alignSelf: 'center', height: 34, width: 54, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderRadius: 17, marginTop: -17, marginBottom: -17, zIndex: 10, borderWidth: 4, borderColor: colors.bg }}>
          <MaterialCommunityIcons name="link-variant" size={20} color={colors.primaryText} />
        </View>
      }
    </View>
  );
};