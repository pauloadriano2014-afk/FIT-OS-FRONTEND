// src/components/Training/ExpandableExerciseBlock.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image'; // 🔥 Trocado de react-native → expo-image (cache em disco automático)
import { Video, ResizeMode } from 'expo-av';
import { ExerciseCard } from '../ExerciseCard';

// 🔥 IDs MASTER PARA BLINDAGEM DO BOTÃO DE IA
const MASTER_IDS = [
  '3c82f763-66b4-48da-836e-16817d4f57c0', // Paulo
  'b7c0c181-41fd-4156-b8fe-963a267759a3',  // Adri
];

export default function ExpandableExerciseBlock({
  block, isExpanded, onToggle, theme,
  lastWeights, historyWeights, handleSaveWeight, checkedSets, handleCheckSet,
  handleOpenVideo, handleOpenIA, handleOpenCalc, hasPremiumFeatures, workoutModel,
  TECH_GUIDE, setTechModalVisible, setSelectedTech, handleSwap, isTimerRunning,
  isVoiceEnabled, colors, userData,
  resolveAsset, // 🔥 NOVO: função de resolução de asset (local ou remoto)
}) {
  const isBiSet = block.type === 'BISET';
  const mainItem = block.items[0];

  const exerciseNumber = (mainItem?.originalIndex || 0) + 1;

  // 🔥 VERIFICA SE É ALUNO MASTER (Para exibir a IA)
  const isMasterStudent = !userData?.coachId || MASTER_IDS.includes(userData?.coachId);

  const exName = (mainItem?.exercise?.name || mainItem?.name || '').toLowerCase();
  const exCat = (mainItem?.exercise?.category || '').toUpperCase();
  const isCardio =
    exCat === 'CARDIO' || exCat === 'AERÓBICO' || exCat === 'AEROBICO' ||
    /elíptico|eliptico|esteira|bike|bicicleta|escada|caminhada|corrida/.test(exName);

  const isBlockDone = block.items.every(item => {
    let totalItemSets = 0;
    if (item.blocks && Array.isArray(item.blocks)) {
      totalItemSets = item.blocks.reduce((acc, b) => acc + (parseInt(b.sets) || 1), 0);
    } else {
      totalItemSets = parseInt(item.sets) || 1;
    }
    let done = true;
    for (let i = 1; i <= totalItemSets; i++) {
      if (!checkedSets[item.id]?.[i]) done = false;
    }
    return totalItemSets > 0 && done;
  });

  let totalSets = 0;
  let firstRep = '';
  let hasVaryingReps = false;
  let techAlertTexts = [];
  let topBadgeTech = isBiSet ? 'BISET' : 'NORMAL';

  if (mainItem?.blocks && Array.isArray(mainItem.blocks)) {
    const totalExerciseSets = mainItem.blocks.reduce((a, blk) => a + (parseInt(blk.sets) || 1), 0);

    const techSegments = [];
    let cumulativeSets = 0;
    mainItem.blocks.forEach((b) => {
      const setsInBlock = parseInt(b.sets || 1) || 1;
      const bTech = b.technique ? b.technique.toUpperCase() : 'NORMAL';
      const startSet = cumulativeSets + 1;
      const endSet = cumulativeSets + setsInBlock;
      const lastSegment = techSegments[techSegments.length - 1];
      if (lastSegment && lastSegment.tech === bTech) {
        lastSegment.endSet = endSet;
      } else {
        techSegments.push({ tech: bTech, startSet, endSet });
      }
      cumulativeSets += setsInBlock;
    });

    techSegments.forEach((seg) => {
      if (seg.tech === 'NORMAL' || isBiSet) return;
      const techTitle = TECH_GUIDE[seg.tech]?.title || seg.tech;
      const segSets = seg.endSet - seg.startSet + 1;
      if (isCardio) {
        if (!techAlertTexts.includes(techTitle)) techAlertTexts.push(techTitle);
        return;
      }
      let alertMsg = '';
      if (segSets === totalExerciseSets) alertMsg = `${techTitle} em todas as séries`;
      else if (seg.endSet === totalExerciseSets && segSets === 1) alertMsg = `${techTitle} na última série`;
      else if (seg.endSet === totalExerciseSets) alertMsg = `${techTitle} nas últimas séries`;
      else if (segSets === 1) alertMsg = `${techTitle} na ${seg.startSet}ª série`;
      else alertMsg = `${techTitle} da ${seg.startSet}ª à ${seg.endSet}ª série`;
      if (!techAlertTexts.includes(alertMsg)) techAlertTexts.push(alertMsg);
    });

    mainItem.blocks.forEach((b, idx) => {
      const setsInBlock = parseInt(b.sets || 1) || 1;
      totalSets += setsInBlock;
      if (idx === 0) firstRep = b.reps;
      else if (b.reps !== firstRep) hasVaryingReps = true;
    });
  } else {
    totalSets = parseInt(mainItem?.sets || 1) || 1;
    firstRep = mainItem?.reps || '';
    const safeTech = mainItem?.safeTechnique || 'NORMAL';
    if (safeTech !== 'NORMAL' && !isBiSet) {
      const techTitle = TECH_GUIDE[safeTech]?.title || safeTech;
      techAlertTexts.push(isCardio ? techTitle : `${techTitle} em todas as séries`);
    }
  }

  if (!TECH_GUIDE[topBadgeTech]) topBadgeTech = 'NORMAL';

  let subtitleText = '';
  if (isCardio) subtitleText = `${totalSets} Minutos | ${firstRep} Kcal`;
  else subtitleText = hasVaryingReps ? `${totalSets} Séries Totais` : `${totalSets} Séries x ${firstRep || '?'} Reps`;

  // 🔥 RESOLUÇÃO DE ASSETS: tenta local primeiro, cai no remoto se não tiver
  const rawImageUrl =
    mainItem?.exercise?.thumbUrl || mainItem?.thumbUrl ||
    mainItem?.exercise?.imageUrl || mainItem?.imageUrl ||
    mainItem?.exercise?.image || mainItem?.image ||
    mainItem?.exercise?.gifUrl || mainItem?.gifUrl ||
    mainItem?.exercise?.thumbnailUrl;

  const rawVideoUrl = mainItem?.exercise?.videoUrl || mainItem?.videoUrl;

  // resolveAsset vem do useWorkoutAssets — devolve path local/blob ou URI original
  const imageUrl = resolveAsset ? resolveAsset(rawImageUrl) : rawImageUrl;
  const videoUrl = resolveAsset ? resolveAsset(rawVideoUrl) : rawVideoUrl;

  // Geração de thumbnail via Cloudflare Stream (fallback quando não há thumb)
  let derivedThumbUrl = imageUrl;
  if (!derivedThumbUrl && rawVideoUrl && rawVideoUrl.includes('cloudflarestream.com')) {
    const match = rawVideoUrl.match(/cloudflare\.com\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const customerPrefix = rawVideoUrl.split('.cloudflare')[0];
      derivedThumbUrl = `${customerPrefix}.cloudflarestream.com/${match[1]}/thumbnails/thumbnail.jpg`;
    }
  }

  return (
    <View style={{ width: '100%', marginBottom: 15 }}>
      <TouchableOpacity
        style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: isBlockDone ? theme.accent : theme.border }]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={[styles.thumbnailContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            {derivedThumbUrl ? (
              // 🔥 expo-image: cache automático em disco, sem flash branco, suporta path local/blob
              <Image
                source={{ uri: derivedThumbUrl }}
                style={styles.thumbnailImage}
                contentFit="cover"
                cachePolicy="disk"
                placeholder={null}
                transition={150}
              />
            ) : videoUrl && !rawVideoUrl?.includes('youtube') && !rawVideoUrl?.includes('youtu.be') ? (
              // Fallback de vídeo quando não há thumb (e não é YouTube)
              Platform.OS === 'web' ? (
                <video
                  src={`${videoUrl}#t=0.1`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', outline: 'none' }}
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : (
                <Video
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  source={{ uri: videoUrl }}
                  resizeMode={ResizeMode.COVER}
                  isMuted
                  shouldPlay={false}
                  positionMillis={100}
                />
              )
            ) : null}
            <View style={[styles.thumbnailOverlay, { backgroundColor: (derivedThumbUrl || videoUrl) ? 'rgba(0,0,0,0.55)' : 'transparent' }]}>
              <Text style={[styles.thumbnailNumber, { color: (derivedThumbUrl || videoUrl) ? '#FFF' : theme.textSecondary }]}>
                {exerciseNumber}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 15 }}>
            {isBiSet ? (
              <>
                <Text style={[styles.techBadge, { color: theme.accent }]}>BI-SET</Text>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                  {block.items[0]?.exercise?.name || block.items[0]?.name}
                </Text>
                <Text style={[styles.title, { color: theme.textSecondary }]} numberOfLines={1}>
                  + {block.items[1]?.exercise?.name || block.items[1]?.name}
                </Text>
              </>
            ) : (
              <>
                {topBadgeTech !== 'NORMAL' && (
                  <Text style={[styles.techBadge, { color: TECH_GUIDE[topBadgeTech]?.color || theme.accent }]}>
                    {TECH_GUIDE[topBadgeTech]?.title || topBadgeTech}
                  </Text>
                )}
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                  {mainItem?.exercise?.name || mainItem?.name}
                </Text>
                <Text style={[styles.subTitle, { color: theme.textSecondary }]}>{subtitleText}</Text>
                {techAlertTexts.map((alertTxt, i) => (
                  <Text key={i} style={{ color: '#FF9500', fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>
                    ⚠️ {alertTxt}
                  </Text>
                ))}
              </>
            )}
          </View>

          <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
            {isBlockDone && (
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} style={{ marginBottom: 5 }} />
            )}
            <View style={[styles.expandIconBox, { backgroundColor: isExpanded ? theme.accent : theme.bg }]}>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={isExpanded ? '#000' : theme.textSecondary}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[
          styles.expandedContainer,
          isBiSet && { borderLeftWidth: 3, borderLeftColor: theme.accent, paddingLeft: 12, marginLeft: 5 },
        ]}>
          {block.items.map((item, idx) => {
            let biSetType = null;
            if (isBiSet) biSetType = idx === 0 ? 'start' : 'end';

            const substitutesList = [];
            if (item.substitutes && Array.isArray(item.substitutes)) substitutesList.push(...item.substitutes);
            else if (item.substitute) substitutesList.push(item.substitute);

            // 🔥 Resolve o vídeo do item expandido também (para passar para o modal)
            const itemVideoUrl = resolveAsset
              ? resolveAsset(item.exercise?.videoUrl || item.videoUrl)
              : (item.exercise?.videoUrl || item.videoUrl);

            return (
              <View key={item.id} style={{ marginBottom: isBiSet && idx === 0 ? 15 : 0 }}>
                <ExerciseCard
                  item={{ ...item, technique: item.safeTechnique, videoUrl: itemVideoUrl }}
                  totalSets={item.sets}
                  lastWeights={lastWeights}
                  historyWeights={historyWeights}
                  handleSaveWeight={handleSaveWeight}
                  checkedSets={checkedSets}
                  handleCheckSet={handleCheckSet}
                  handleOpenVideo={() => handleOpenVideo(itemVideoUrl)}
                  // 🔥 TRAVA DA IA: passa nulo se for aluno de parceiro
                  setModalVisible={
                    isMasterStudent && typeof handleOpenIA === 'function'
                      ? () => handleOpenIA(item)
                      : null
                  }
                  onOpenCalc={handleOpenCalc}
                  hasPremiumFeatures={hasPremiumFeatures}
                  workoutModel={workoutModel}
                  TECH_GUIDE={TECH_GUIDE}
                  setTechModalVisible={setTechModalVisible}
                  setSelectedTech={setSelectedTech}
                  biSetType={biSetType}
                  isLastExercise={false}
                  onSwap={substitutesList.length > 0 ? (_, selectedSub) => handleSwap(item.originalIndex, selectedSub) : null}
                  substitutes={substitutesList}
                  isTimerRunning={isTimerRunning}
                  isVoiceEnabled={isVoiceEnabled}
                  colors={colors}
                  studentGender={userData?.gender}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 14, borderRadius: 16, borderWidth: 1,
    elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  thumbnailContainer: {
    width: 55, height: 55, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1,
  },
  thumbnailImage: { width: '100%', height: '100%' }, // resizeMode via contentFit no expo-image
  thumbnailOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  thumbnailNumber: { fontSize: 22, fontWeight: '900' },
  techBadge: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
  title: { fontSize: 14, fontWeight: 'bold' },
  subTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  expandIconBox: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  expandedContainer: { marginTop: 15 },
});