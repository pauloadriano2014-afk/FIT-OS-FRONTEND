// src/components/ExerciseCard/SetRow.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TechInputRouter from './TechInputRouter';

export default function SetRow({
  currentSetNum, isActive, block, categoryType, workoutModel, colors, getTechInfoFn,
  item, lastWeights, checkedSets, handleSaveWeight, handleSmartCheck, handleInputFocus,
  isTimerRunning, getPreviousWeight, startRestTimer, techInfoForRow,
}) {
  const val = lastWeights[item.id]?.[currentSetNum];
  const isConfirmed = checkedSets[item.id]?.[currentSetNum] === true;
  const checkColor = isConfirmed ? colors.primary : colors.border;
  const checkIcon = isConfirmed ? "check-circle" : "checkbox-blank-circle-outline";

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 5, paddingHorizontal: 5, borderRadius: 8 }, isActive && { backgroundColor: `${colors.primary}1A`, borderColor: techInfoForRow.color || colors.primary, borderWidth: 1 }]}>
      <View style={{ width: 30, alignItems: 'center', marginRight: 10 }}>
        {categoryType === 'CARDIO' ? (
          <MaterialCommunityIcons name="heart-pulse" size={24} color={colors.primary} />
        ) : (
          <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: 'bold' }}>{currentSetNum}</Text>
          </View>
        )}
      </View>
      {categoryType === 'CARDIO' ? (
        <View style={{ width: 60, alignItems: 'center', marginRight: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3 }}>META</Text>
          <View style={{ height: 40, justifyContent: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>{block.sets}m / {block.reps}kcal</Text>
          </View>
        </View>
      ) : (
        <View style={{ width: 50, alignItems: 'center', marginRight: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 3 }}>REPS</Text>
          <View style={{ height: 40, justifyContent: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{block.reps}</Text>
          </View>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <TechInputRouter
          currentSetNum={currentSetNum} isActive={isActive} block={block}
          categoryType={categoryType} workoutModel={workoutModel} colors={colors} getTechInfoFn={getTechInfoFn}
          item={item} lastWeights={lastWeights} checkedSets={checkedSets}
          handleSaveWeight={handleSaveWeight} handleSmartCheck={handleSmartCheck} handleInputFocus={handleInputFocus}
          isTimerRunning={isTimerRunning} getPreviousWeight={getPreviousWeight} startRestTimer={startRestTimer}
        />
      </View>
      <View style={{ width: 44, alignItems: 'flex-end', marginLeft: 5, justifyContent: 'center' }}>
        <TouchableOpacity style={{ padding: 8 }} onPress={() => handleSmartCheck(currentSetNum, val, block.restTime, techInfoForRow.key)}>
          <MaterialCommunityIcons name={checkIcon} size={34} color={checkColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}