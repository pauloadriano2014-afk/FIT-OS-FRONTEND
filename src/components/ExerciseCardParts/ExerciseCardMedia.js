// src/components/ExerciseCardParts/ExerciseCardMedia.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import HowToExecuteModal from './HowToExecuteModal';

export default function ExerciseCardMedia({
  thumbLink, videoLink, videoRef, handleOpenVideo,
  topTechInfo, colors, setSelectedTech, setTechModalVisible,
  showTools, hasPremiumFeatures, onOpenCalc, setModalVisible,
  exerciseTitle, topVideoText,
  howToExecute, commonMistakes, maleFocus, femaleFocus, studentGender, // 🔥 NOVO: conteúdo de execução do exercício
}) {
  // 🔥 NOVO: estado local do modal "Como Executar" — fica contido aqui
  // porque é específico da mídia deste exercício, sem precisar subir
  // para o ExerciseCard.js (igual ao padrão de outros modais locais do app).
  const [howToModalVisible, setHowToModalVisible] = useState(false);
  const hasHowTo = !!(howToExecute || commonMistakes || maleFocus || femaleFocus);

  return (
    <>
    <TouchableOpacity activeOpacity={0.9} onPress={() => handleOpenVideo(videoLink)} style={{ height: 180, width: '100%', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
      {thumbLink ? (
        <Image source={{ uri: thumbLink }} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, width: '100%', height: '100%', opacity: 0.5, resizeMode: 'cover' }} />
      ) : videoLink ? (
        <>
          {Platform.OS === 'web' ? (
            <video src={`${videoLink}#t=0.1`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', opacity: 0.5, pointerEvents: 'none' }} preload="metadata" muted playsInline />
          ) : (
            <Video ref={videoRef} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, width: '100%', height: '100%', opacity: 0.5 }} source={{ uri: videoLink }} resizeMode={ResizeMode.COVER} isMuted={true} shouldPlay={false} positionMillis={100} isLooping={false} />
          )}
        </>
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { opacity: 0.7, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialCommunityIcons name="dumbbell" size={40} color="#444" />
        </View>
      )}
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'space-between', padding: 15 }} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }} pointerEvents="box-none">
          <View pointerEvents="auto">
            {topTechInfo.actualTechId && topTechInfo.actualTechId !== 'NORMAL' && (
              <TouchableOpacity style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, elevation: 3, backgroundColor: topTechInfo.color }} onPress={() => { if (setSelectedTech && setTechModalVisible) { setSelectedTech(topTechInfo.actualTechId); setTechModalVisible(true); } }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="information-outline" size={12} color={colors.bg === '#000000' && (topTechInfo.actualTechId === 'BISET' || topTechInfo.actualTechId === '21') ? '#000' : '#FFF'} />
                  <Text style={{ fontSize: 10, fontWeight: '900', color: colors.bg === '#000000' && (topTechInfo.actualTechId === 'BISET' || topTechInfo.actualTechId === '21') ? '#000' : '#FFF' }}>{topTechInfo.label}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {showTools && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignSelf: 'flex-start' }} pointerEvents="auto">
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} onPress={onOpenCalc}>
              <MaterialCommunityIcons name={hasPremiumFeatures ? "calculator" : "lock"} size={14} color={hasPremiumFeatures ? "#FFF" : colors.textMuted} />
              <Text style={{ color: hasPremiumFeatures ? '#FFF' : colors.textMuted, fontSize: 10, fontWeight: 'bold' }}>CALCULAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} onPress={setModalVisible}>
              <MaterialCommunityIcons name={hasPremiumFeatures ? "camera-metering-spot" : "lock"} size={14} color={hasPremiumFeatures ? "#FFF" : colors.textMuted} />
              <Text style={{ color: hasPremiumFeatures ? '#FFF' : colors.textMuted, fontSize: 10, fontWeight: 'bold' }}>ANÁLISE IA</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ marginTop: 'auto', gap: 10 }} pointerEvents="box-none">
          <View pointerEvents="none">
            <Text numberOfLines={2} ellipsizeMode="tail" style={{ color: '#FFF', fontSize: 20, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 }}>{exerciseTitle}</Text>
            <Text numberOfLines={1} style={{ color: '#DDD', fontSize: 12, fontWeight: 'bold' }}>{topVideoText}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} pointerEvents="auto">
            {hasHowTo && (
              <TouchableOpacity
                onPress={() => setHowToModalVisible(true)}
                style={{ backgroundColor: 'rgba(0,0,0,0.75)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
              >
                <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 }}>COMO EXECUTAR</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleOpenVideo(videoLink)}
              style={{ backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 5 }}
            >
              <MaterialCommunityIcons name="play" size={18} color={colors.primaryText} />
              <Text style={{ color: colors.primaryText, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 }}>VER EXECUÇÃO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>

    {hasHowTo && (
      <HowToExecuteModal
        visible={howToModalVisible}
        onClose={() => setHowToModalVisible(false)}
        colors={colors}
        exerciseTitle={exerciseTitle}
        howToExecute={howToExecute}
        commonMistakes={commonMistakes}
        maleFocus={maleFocus}
        femaleFocus={femaleFocus}
        studentGender={studentGender}
      />
    )}
    </>
  );
}