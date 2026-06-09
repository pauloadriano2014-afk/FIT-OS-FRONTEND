// src/components/GerarTreino/DayGroupCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { REST_OPTIONS_BY_TYPE } from './_constants';

export default function DayGroupCard({
  group, info, isFirst, isLast, theme,
  onMoveUp, onMoveDown, onRemove,
  onUpdateQty, onUpdateSets, onUpdateRest,
}) {
  const restOpts = REST_OPTIONS_BY_TYPE[info.restType] || REST_OPTIONS_BY_TYPE['ISOLADO'];
  const curRest = group.rest ?? info.defaultRest;
  const curSets = group.sets ?? info.defaultSets ?? 4;

  return (
    <View style={[S.card, { backgroundColor: info.color + '10', borderColor: info.color + '25' }]}>
      {/* Linha 1: setas + nome + remover */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flexDirection: 'column', gap: 2, marginRight: 8 }}>
          <TouchableOpacity onPress={onMoveUp} style={[S.orderBtn, { opacity: isFirst ? 0.2 : 1 }]}>
            <MaterialCommunityIcons name="chevron-up" size={13} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onMoveDown} style={[S.orderBtn, { opacity: isLast ? 0.2 : 1 }]}>
            <MaterialCommunityIcons name="chevron-down" size={13} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={[S.dot, { backgroundColor: info.color }]} />
        <Text style={[S.label, { color: theme.text, flex: 1 }]}>{info.label}</Text>
        <TouchableOpacity onPress={onRemove}>
          <MaterialCommunityIcons name="close-circle" size={17} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Linha 2: exercícios + séries */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <MaterialCommunityIcons name="dumbbell" size={12} color={theme.textSecondary} />
        <Text style={[S.controlLabel, { color: theme.textSecondary }]}>Ex.:</Text>
        <TouchableOpacity onPress={() => onUpdateQty(Math.max(1, group.qty - 1))} style={[S.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
          <MaterialCommunityIcons name="minus" size={13} color={theme.text} />
        </TouchableOpacity>
        <Text style={[S.qtyNum, { color: theme.text }]}>{group.qty}</Text>
        <TouchableOpacity onPress={() => onUpdateQty(Math.min(10, group.qty + 1))} style={[S.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
          <MaterialCommunityIcons name="plus" size={13} color={theme.text} />
        </TouchableOpacity>

        <View style={{ width: 1, height: 16, backgroundColor: theme.border, marginHorizontal: 4 }} />

        <MaterialCommunityIcons name="repeat" size={12} color={theme.textSecondary} />
        <Text style={[S.controlLabel, { color: theme.textSecondary }]}>Sér.:</Text>
        <TouchableOpacity onPress={() => onUpdateSets(Math.max(1, curSets - 1))} style={[S.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
          <MaterialCommunityIcons name="minus" size={13} color={theme.text} />
        </TouchableOpacity>
        <Text style={[S.qtyNum, { color: info.color }]}>{curSets}</Text>
        <TouchableOpacity onPress={() => onUpdateSets(Math.min(6, curSets + 1))} style={[S.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
          <MaterialCommunityIcons name="plus" size={13} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Linha 3: descanso */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <MaterialCommunityIcons name="timer-outline" size={12} color={theme.textSecondary} />
        <Text style={[S.controlLabel, { color: theme.textSecondary }]}>Descanso:</Text>
        {restOpts.map(opt => {
          const isSel = String(curRest) === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onUpdateRest(parseInt(opt.id))}
              style={[S.restChip, {
                backgroundColor: isSel ? info.color + '25' : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderColor: isSel ? info.color + '80' : 'transparent',
              }]}
            >
              <Text style={{ fontSize: 11, color: isSel ? info.color : theme.textSecondary, fontWeight: isSel ? '900' : '600' }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  card:        { padding: 10, borderRadius: 10, borderWidth: 1 },
  dot:         { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  label:       { fontSize: 13, fontWeight: '700' },
  controlLabel:{ fontSize: 10, fontWeight: '700' },
  orderBtn:    { width: 18, height: 18, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(128,128,128,0.12)' },
  qtyBtn:      { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  qtyNum:      { fontSize: 14, fontWeight: '900', minWidth: 18, textAlign: 'center' },
  restChip:    { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, borderWidth: 1 },
});