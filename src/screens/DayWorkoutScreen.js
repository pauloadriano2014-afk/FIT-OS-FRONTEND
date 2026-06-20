// src/screens/DayWorkoutScreen.js
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, Platform, Dimensions,
  LayoutAnimation, UIManager
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { formatTime, calculate1RM } from '../utils/workoutUtils';
import { useTheme } from '../contexts/ThemeContext';

import ExpandableExerciseBlock from '../components/Training/ExpandableExerciseBlock';
import InitialPhotosModal from '../components/InitialPhotosModal';
import UpsellModal from '../components/Training/UpsellModal';
import TechGuideModal from '../components/Training/TechGuideModal';
import FinishWorkoutModal from '../components/Training/FinishWorkoutModal';
import CalculatorModal from '../components/Training/CalculatorModal';

import useDayWorkoutTimer from '../components/DayWorkout/useDayWorkoutTimer';
import useDayWorkoutData from '../components/DayWorkout/useDayWorkoutData';
import useTechVoice from '../components/DayWorkout/useTechVoice';
import DayWorkoutHeader from '../components/DayWorkout/DayWorkoutHeader';
import WorkoutStatusBanners from '../components/DayWorkout/WorkoutStatusBanners';
import VideoPlayerModal from '../components/DayWorkout/VideoPlayerModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const RPE_OPTIONS = [
  { val: 10, label: 'FALHA TOTAL', desc: 'Não subia mais nada', color: '#BF5AF2' },
  { val: 9, label: 'MUITO INTENSO', desc: 'Sobrou 1 repetição', color: '#FF3B30' },
  { val: 8, label: 'DIFÍCIL', desc: 'Sobraram 2 repetições', color: '#FF9500' },
  { val: 6, label: 'MODERADO', desc: 'Sobraram 3 a 4 repetições', color: '#FFCC00' },
  { val: 4, label: 'LEVE', desc: 'Aquecimento', color: '#32ADE6' },
];

export default function DayWorkoutScreen({ route, navigation }) {
  const params = route?.params || {};
  const workoutId = params.workoutId || '';
  const day = params.day || 'A';
  const rawName = params.workoutName || 'Treino';
  const focus = params.focus || 'GERAL'; // Enviado ao FinishScreen
  const workoutName = rawName.replace(' |#BASE#', '');

  // 🔥 TRAVA DE SEGURANÇA (MODO ESPIÃO) 🔥
  const isPreviewMode = params.isPreview || false;

  const { theme } = useTheme();

  const [expandedBlockId, setExpandedBlockId] = useState(null);

  const [techModalVisible, setTechModalVisible] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const videoRef = useRef(null);

  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const oneRM = calculate1RM(parseFloat(calcWeight), parseFloat(calcReps));

  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [rpe, setRpe] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const [upsellModalVisible, setUpsellModalVisible] = useState(false);
  const [upsellType, setUpsellType] = useState('ia');
  const [initialPhotosModalVisible, setInitialPhotosModalVisible] = useState(false);

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const isIOSWeb = Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const timer = useDayWorkoutTimer({ workoutId, day, isPreviewMode, navigation });
  const data = useDayWorkoutData({
    workoutId, day, isPreviewMode, theme, navigation, workoutName, focus,
    onBeforeNavigateAway: timer.markFinishing,
  });

  const voice = useTechVoice(data.techGuide);

  useFocusEffect(useCallback(() => { data.fetchWorkoutData(); }, []));

  // Único ponto de conexão entre os dois hooks independentes: quando os dados do
  // treino terminam de carregar, avisa o timer (que decide sincronizar com o horário
  // salvo, ou iniciar automático se for modo espião).
  useEffect(() => {
    timer.syncWithWorkoutData(data.loading, data.exercisesToShow);
  }, [data.loading, data.exercisesToShow]);

  const groupedExercises = useMemo(() => {
    const groups = [];
    let tempGroup = [];

    data.exercisesToShow.forEach((item, index) => {
      // 🔥 CIRURGIA 2: o 'rawTech' agora sempre terá o ID customizado ou a técnica antiga
      let rawTech = item.blocks?.[0]?.technique || item.technique || 'NORMAL';
      let safeTechnique = 'NORMAL';

      if (data.techGuide[rawTech]) {
        safeTechnique = rawTech; // Achou a técnica do laboratório
      } else {
        let normalized = typeof rawTech === 'string' ? rawTech.trim().toUpperCase() : 'NORMAL';
        if (data.techGuide[normalized]) {
          safeTechnique = normalized; // Achou a técnica estática antiga
        }
      }

      let isBiSet = safeTechnique.includes('BISET');
      const itemWithMeta = { ...item, safeTechnique, originalIndex: index };

      if (isBiSet) {
        tempGroup.push(itemWithMeta);
        if (tempGroup.length === 2) {
          groups.push({ id: `group_${index}`, type: 'BISET', items: tempGroup });
          tempGroup = [];
        }
      } else {
        if (tempGroup.length > 0) {
          groups.push({ id: `group_hanging_${index}`, type: 'BISET', items: tempGroup });
          tempGroup = [];
        }
        groups.push({ id: `group_${index}`, type: 'NORMAL', items: [itemWithMeta] });
      }
    });
    if (tempGroup.length > 0) {
      groups.push({ id: `group_end`, type: 'BISET', items: tempGroup });
    }
    return groups;
  }, [data.exercisesToShow, data.techGuide]);

  const toggleBlock = (blockId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBlockId(prev => prev === blockId ? null : blockId);
  };

  const closeTechModal = () => {
    voice.closeTechModalAudio();
    setTechModalVisible(false);
  };

  const handleOpenVideo = (url) => {
    if (url && url.length > 5) { setCurrentVideoUrl(url); setVideoModalVisible(true); }
    else {
      if (Platform.OS === 'web') window.alert("Sem vídeo cadastrado.");
      else Alert.alert("Indisponível", "Sem vídeo cadastrado.");
    }
  };

  const handleOpenIA = (item) => {
    if (data.userPlan === 'PREMIUM') {
      try {
        const refVideo = item.exercise?.videoUrl || item.videoUrl || '';
        navigation.navigate('ScannerIA', {
          exName: item.exercise?.name || item.title || 'Exercício',
          alunoName: data.userData?.name,
          videoUrl: refVideo
        });
      } catch (e) {}
    } else {
      openDynamicUpsell('ia');
    }
  };

  const handleOpenCalc = () => {
    if (data.userPlan === 'PREMIUM') setCalcModalVisible(true);
    else openDynamicUpsell('calc');
  };

  const validateAndFinish = () => {
    if (!timer.isTimerRunning && timer.elapsedSeconds === 0) {
      if (Platform.OS === 'web') window.alert("Para registrar cargas, clique primeiro em INICIAR TREINO.");
      else Alert.alert("Atenção", "Para registrar cargas, clique primeiro em INICIAR TREINO.");
      return;
    }
    setFinishModalVisible(true);
  };

  const submitFinish = async () => {
    if (!rpe) {
      if (Platform.OS === 'web') window.alert("Selecione o RPE.");
      else Alert.alert("Atenção", "Selecione o RPE.");
      return;
    }
    const rpeOption = RPE_OPTIONS.find(opt => opt.val === rpe);
    const selectedRpeLabel = rpeOption ? rpeOption.label : 'MÁXIMA';

    const result = await data.submitFinish({
      rpe,
      feedbackText,
      rpeLabel: selectedRpeLabel,
      elapsedSeconds: timer.elapsedSeconds,
    });
    if (result.success) {
      timer.stopTimerAfterFinish();
      setFinishModalVisible(false);
    }
  };

  const handleStartTimerRequest = () => {
    if (!data.hasSentInitialPhotos && data.userPlan !== 'PREMIUM') setInitialPhotosModalVisible(true);
    else timer.executeStartTimer();
  };

  const openDynamicUpsell = (type) => { setUpsellType(type); setUpsellModalVisible(true); };

  const getPhotoModalContent = () => {
    switch (data.userPlan) {
      case 'PREMIUM': return { title: 'REGISTRE SEU PONTO DE PARTIDA 📸', desc: 'Para mapear sua evolução na Consultoria Elite, faça o seu primeiro registro. É rápido e 100% sigiloso.', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'FAZER DEPOIS', showEscape: true };
      case 'LOW_COST': return { title: 'FOTOS DE EVOLUÇÃO PENDENTES 📸', desc: 'Para acompanharmos sua progressão no plano, precisamos do seu registro inicial. Sem ele, a evolução não existe!', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'IR PARA O TREINO', showEscape: false };
      case 'FICHA_8S': return { title: 'FOTOS DO DIA 1 PENDENTES ⚠️', desc: 'Suas fotos de ponto de partida são essenciais para a avaliação de encerramento do Projeto. O envio é obrigatório para começar!', btnText: 'ENVIAR FOTOS DO DIA 1', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
      case 'CHALLENGE_21': return { title: 'FOTOS DO DIA 1 — OBRIGATÓRIAS ⚠️', desc: 'O Desafio de 21 Dias depende das fotos iniciais para medir o seu resultado final. Sem o "antes", não existe "depois".', btnText: 'ENVIAR FOTOS E COMEÇAR', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
      default: return { title: 'FOTOS PENDENTES 📸', desc: 'Envie suas fotos iniciais para mapearmos sua evolução.', btnText: 'ENVIAR FOTOS', escapeText: 'TREINAR MESMO ASSIM', showEscape: true };
    }
  };
  const photoModal = getPhotoModalContent();

  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 };

  if (!workoutId && !data.loading && data.exercisesToShow.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Você está sem internet para carregar o treino pela primeira vez.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={{ marginTop: 30, padding: 15, backgroundColor: theme.accent, borderRadius: 10, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 16 }}>VOLTAR PARA O INÍCIO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (data.loading && data.exercisesToShow.length === 0) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <View style={{ width: '100%', alignItems: 'center', backgroundColor: theme.bg, borderBottomWidth: isWeb ? 1 : 0, borderBottomColor: theme.border }}>
        <WorkoutStatusBanners
          isPreviewMode={isPreviewMode}
          isIntensityMaskActive={data.isIntensityMaskActive}
          activeIntensityMultiplier={data.activeIntensityMultiplier}
        />
        <DayWorkoutHeader
          theme={theme}
          workoutName={workoutName}
          day={day}
          isVoiceEnabled={voice.isVoiceEnabled}
          toggleVoice={voice.toggleVoice}
          isTimerRunning={timer.isTimerRunning}
          isPreviewMode={isPreviewMode}
          onGoBack={() => navigation.goBack()}
        />
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false} overScrollMode="never">
          <View style={{ width: isWeb ? '100%' : width, maxWidth: isWeb ? 480 : width, flexGrow: 1, backgroundColor: theme.bg, paddingHorizontal: 20, paddingBottom: 150, paddingTop: 15, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}>

            <View style={{ marginBottom: 20 }}>
              {!timer.isTimerRunning && timer.elapsedSeconds === 0 && !isPreviewMode ? (
                <TouchableOpacity style={{ backgroundColor: theme.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 16, gap: 10, elevation: 5 }} onPress={handleStartTimerRequest}>
                  <MaterialCommunityIcons name="play" size={30} color={theme.isDark ? '#000' : '#FFF'} />
                  <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>INICIAR TREINO</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 }}>{isPreviewMode ? "CRONÔMETRO (ESPIÃO)" : "TEMPO DECORRIDO"}</Text>
                  <Text style={{ color: theme.text, fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatTime(timer.elapsedSeconds)}</Text>
                </View>
              )}
            </View>

            {groupedExercises.map((block) => (
              <ExpandableExerciseBlock
                key={block.id} block={block} isExpanded={expandedBlockId === block.id} onToggle={() => toggleBlock(block.id)} theme={theme}
                lastWeights={data.lastWeights} historyWeights={data.historyWeights} handleSaveWeight={data.handleSaveWeight} checkedSets={data.checkedSets} handleCheckSet={data.handleCheckSet}
                handleOpenVideo={handleOpenVideo} handleOpenIA={handleOpenIA} handleOpenCalc={handleOpenCalc}
                hasPremiumFeatures={data.userPlan === 'PREMIUM'} workoutModel={data.workoutModel} TECH_GUIDE={data.techGuide} setTechModalVisible={setTechModalVisible} setSelectedTech={setSelectedTech}
                handleSwap={data.handleSwap} isTimerRunning={timer.isTimerRunning} isVoiceEnabled={voice.isVoiceEnabled}
                colors={{ bg: theme.bg, surface: theme.surface, border: theme.border, text: theme.text, textMuted: theme.textSecondary, primary: theme.accent, primaryText: theme.isDark ? '#000' : '#FFF', inputBg: theme.isDark ? '#1C1C1E' : '#F5F5F5', glass: theme.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)' }}
                userData={data.userData}
              />
            ))}

            {/* 🔥 ESCONDE O BOTÃO DE FINALIZAR SE FOR MODO ESPIÃO 🔥 */}
            {!isPreviewMode && (
              <TouchableOpacity style={{ backgroundColor: theme.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 20, gap: 10 }} onPress={validateAndFinish}>
                <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>FINALIZAR TREINO</Text><MaterialCommunityIcons name="check-all" size={24} color={theme.isDark ? '#000' : '#FFF'} />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      <InitialPhotosModal
        visible={initialPhotosModalVisible}
        onClose={() => { setInitialPhotosModalVisible(false); timer.executeStartTimer(); }}
        theme={theme}
        photoModal={photoModal}
        userPlan={data.userPlan}
        onNavigate={() => { setInitialPhotosModalVisible(false); navigation.navigate('CheckIn'); }}
      />
      <UpsellModal visible={upsellModalVisible} onClose={() => setUpsellModalVisible(false)} theme={theme} upsellType={upsellType} />
      <TechGuideModal visible={techModalVisible} onClose={closeTechModal} theme={theme} selectedTech={selectedTech} TECH_GUIDE={data.techGuide} isPlayingTechVoice={voice.isPlayingTechVoice} handlePlayTechVoice={voice.handlePlayTechVoice} isWeb={isWeb} />
      <FinishWorkoutModal visible={finishModalVisible} onClose={() => setFinishModalVisible(false)} theme={theme} RPE_OPTIONS={RPE_OPTIONS} rpe={rpe} setRpe={setRpe} feedbackText={feedbackText} setFeedbackText={setFeedbackText} submitFinish={submitFinish} isWeb={isWeb} />
      <CalculatorModal visible={calcModalVisible} onClose={() => setCalcModalVisible(false)} theme={theme} calcWeight={calcWeight} setCalcWeight={setCalcWeight} calcReps={calcReps} setCalcReps={setCalcReps} oneRM={oneRM} isWeb={isWeb} />

      <VideoPlayerModal
        visible={videoModalVisible}
        onClose={() => { setVideoModalVisible(false); setCurrentVideoUrl(null); }}
        currentVideoUrl={currentVideoUrl}
        videoRef={videoRef}
        isWeb={isWeb}
        isIOSWeb={isIOSWeb}
      />

    </RootComponent>
  );
}