// src/screens/DayWorkoutScreen.js
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, Platform, Dimensions,
  UIManager, FlatList, Modal
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
import useWorkoutAssets from '../components/DayWorkout/useWorkoutAssets';
import DayWorkoutHeader from '../components/DayWorkout/DayWorkoutHeader';
import WorkoutStatusBanners from '../components/DayWorkout/WorkoutStatusBanners';
import VideoPlayerModal from '../components/DayWorkout/VideoPlayerModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const MASTER_IDS = [
  '3c82f763-66b4-48da-836e-16817d4f57c0',
  'b7c0c181-41fd-4156-b8fe-963a267759a3'
];

// 🔥 Feature flag — ATIVADA PARA PWA!
const OFFLINE_DOWNLOAD_ENABLED = true;

const RPE_OPTIONS = [
  { val: 10, label: 'FALHA TOTAL', desc: 'Não subia mais nada', color: '#BF5AF2' },
  { val: 9, label: 'MUITO INTENSO', desc: 'Sobrou 1 repetição', color: '#FF3B30' },
  { val: 8, label: 'DIFÍCIL', desc: 'Sobraram 2 repetições', color: '#FF9500' },
  { val: 6, label: 'MODERADO', desc: 'Sobraram 3 a 4 repetições', color: '#FFCC00' },
  { val: 4, label: 'LEVE', desc: 'Aquecimento', color: '#32ADE6' },
];

// ─────────────────────────────────────────────────────────────
// Modal: confirmar download
// ─────────────────────────────────────────────────────────────
function DownloadConfirmModal({ visible, onConfirm, onCancel, theme }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: theme.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: theme.border }}>
          
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.accent + '20', justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="download-circle-outline" size={32} color={theme.accent} />
            </View>
          </View>

          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, marginBottom: 12 }}>
            SALVAR TREINO OFFLINE
          </Text>

          <View style={{ backgroundColor: theme.accent + '15', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: theme.accent }}>
            <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }}>
              💪 ELITE FIT
            </Text>
            <Text style={{ color: theme.text, fontSize: 13, lineHeight: 20 }}>
              No ELITE FIT ninguém fica sem treino! Se a academia onde você treina tem sinal de internet ruim, baixe o treino antes de sair de casa e tenha acesso completo — incluindo os vídeos de demonstração — mesmo sem conexão.
            </Text>
          </View>

          <View style={{ backgroundColor: '#FF950015', borderRadius: 10, padding: 12, marginBottom: 20, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#FF9500" style={{ marginTop: 1 }} />
            <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18, flex: 1 }}>
              Os vídeos serão salvos no seu celular e podem ocupar alguns MB de armazenamento. Você pode excluir os treinos salvos a qualquer momento.
            </Text>
          </View>

          <TouchableOpacity
            onPress={onConfirm}
            style={{ backgroundColor: theme.accent, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}
          >
            <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>
              BAIXAR AGORA
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={{ padding: 12, alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Agora não</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal: confirmar exclusão
// ─────────────────────────────────────────────────────────────
function DeleteDownloadModal({ visible, onConfirm, onCancel, theme }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: theme.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: theme.border }}>

          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF3B3020', justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="trash-can-outline" size={32} color="#FF3B30" />
            </View>
          </View>

          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, marginBottom: 12 }}>
            EXCLUIR TREINO SALVO
          </Text>

          <View style={{ backgroundColor: '#FF3B3015', borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <MaterialCommunityIcons name="alert-outline" size={16} color="#FF3B30" style={{ marginTop: 1 }} />
            <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 }}>
              Os vídeos e imagens deste treino serão removidos do seu celular. Se o celular estiver pesando, isso pode liberar espaço. Você pode baixar novamente a qualquer momento enquanto tiver internet.
            </Text>
          </View>

          <TouchableOpacity
            onPress={onConfirm}
            style={{ backgroundColor: '#FF3B30', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}
          >
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>
              SIM, EXCLUIR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={{ padding: 12, alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Cancelar</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: banner de download no topo da lista
// ─────────────────────────────────────────────────────────────
function OfflineBanner({ downloadStatus, downloadProgress, onPressDownload, onPressDelete, theme }) {
  // 🔥 Removi o bloqueio falso que impedia a visualização na web/PWA
  
  if (downloadStatus === 'downloading') {
    return (
      <View style={{ backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.accent + '60' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700', flex: 1 }}>
            Baixando treino... {downloadProgress}%
          </Text>
        </View>
        <View style={{ height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden' }}>
          <View style={{ height: 4, width: `${downloadProgress}%`, backgroundColor: theme.accent, borderRadius: 2 }} />
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 8 }}>
          Não feche o app durante o download
        </Text>
      </View>
    );
  }

  if (downloadStatus === 'done') {
    return (
      <View style={{ backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.accent + '40' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialCommunityIcons name="check-circle" size={22} color={theme.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '900' }}>Treino salvo offline ✓</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
              Vídeos e imagens disponíveis sem internet
            </Text>
          </View>
          <TouchableOpacity onPress={onPressDelete} style={{ padding: 6 }}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPressDownload}
      style={{ backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      activeOpacity={0.7}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.accent + '20', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name="download-outline" size={22} color={theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>
          Salvar treino offline
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
          Para academias com sinal fraco ou sem internet
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// Tela principal
// ─────────────────────────────────────────────────────────────
export default function DayWorkoutScreen({ route, navigation }) {
  const params = route?.params || {};
  const workoutId = params.workoutId || '';
  const day = params.day || 'A';
  const rawName = params.workoutName || 'Treino';
  const focus = params.focus || 'GERAL';
  const workoutName = rawName.replace(' |#BASE#', '');
  const isPreviewMode = params.isPreview || false;

  const { theme } = useTheme();

  const [expandedBlocks, setExpandedBlocks] = useState({});
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

  const [downloadConfirmVisible, setDownloadConfirmVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const isIOSWeb = Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const timer = useDayWorkoutTimer({ workoutId, day, isPreviewMode, navigation });
  const data = useDayWorkoutData({
    workoutId, day, isPreviewMode, theme, navigation, workoutName, focus,
    onBeforeNavigateAway: timer.markFinishing,
  });
  const voice = useTechVoice(data.techGuide);

  // 🔥 Hook de assets offline ligado
  const { resolveAsset, downloadStatus, downloadProgress, startDownload, deleteDownload } =
    useWorkoutAssets(data.exercisesToShow, workoutId, day);

  useFocusEffect(useCallback(() => { data.fetchWorkoutData(); }, []));

  useEffect(() => {
    timer.syncWithWorkoutData(data.loading, data.exercisesToShow);
  }, [data.loading, data.exercisesToShow]);

  const groupedExercises = useMemo(() => {
    const groups = [];
    let tempGroup = [];
    data.exercisesToShow.forEach((item, index) => {
      let rawTech = item.blocks?.[0]?.technique || item.technique || 'NORMAL';
      let safeTechnique = 'NORMAL';
      if (data.techGuide[rawTech]) {
        safeTechnique = rawTech;
      } else {
        let normalized = typeof rawTech === 'string' ? rawTech.trim().toUpperCase() : 'NORMAL';
        if (data.techGuide[normalized]) safeTechnique = normalized;
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
    if (tempGroup.length > 0) groups.push({ id: `group_end`, type: 'BISET', items: tempGroup });
    return groups;
  }, [data.exercisesToShow, data.techGuide]);

  const toggleBlock = (blockId) => {
    setExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  const closeTechModal = () => {
    voice.closeTechModalAudio();
    setTechModalVisible(false);
  };

  // 🔥 Aqui é onde a magia acontece. Se a URL estiver no cache offline, o resolveAsset devolve o arquivo do celular!
  const handleOpenVideo = (url) => {
    const finalUrl = resolveAsset(url);
    if (finalUrl && finalUrl.length > 5) { 
        setCurrentVideoUrl(finalUrl); 
        setVideoModalVisible(true); 
    }
    else {
      if (Platform.OS === 'web') window.alert("Sem vídeo cadastrado.");
      else Alert.alert("Indisponível", "Sem vídeo cadastrado.");
    }
  };

  const handleOpenIA = (item) => {
    if (data.userPlan === 'PREMIUM' || data.userPlan === 'ELITE') {
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
    if (data.userPlan === 'PREMIUM' || data.userPlan === 'ELITE') setCalcModalVisible(true);
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
      rpe, feedbackText, rpeLabel: selectedRpeLabel, elapsedSeconds: timer.elapsedSeconds,
    });
    if (result.success) { timer.stopTimerAfterFinish(); setFinishModalVisible(false); }
  };

  const handleStartTimerRequest = () => {
    if (!data.hasSentInitialPhotos && data.userPlan !== 'PREMIUM' && data.userPlan !== 'ELITE') setInitialPhotosModalVisible(true);
    else timer.executeStartTimer();
  };

  const openDynamicUpsell = (type) => { setUpsellType(type); setUpsellModalVisible(true); };

  const handleConfirmDownload = async () => {
    setDownloadConfirmVisible(false);
    await startDownload();
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirmVisible(false);
    await deleteDownload();
  };

  const getPhotoModalContent = () => {
    switch (data.userPlan) {
      case 'PREMIUM':
      case 'ELITE': return { title: 'REGISTRE SEU PONTO DE PARTIDA 📸', desc: 'Para mapear sua evolução na Consultoria Elite, faça o seu primeiro registro. É rápido e 100% sigiloso.', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'FAZER DEPOIS', showEscape: true };
      case 'LOW_COST': return { title: 'FOTOS DE EVOLUÇÃO PENDENTES 📸', desc: 'Para acompanharmos sua progressão no plano, precisamos do seu registro inicial. Sem ele, a evolução não existe!', btnText: 'ENVIAR FOTOS AGORA', escapeText: 'IR PARA O TREINO', showEscape: false };
      case 'FICHA_8S': return { title: 'FOTOS DO DIA 1 PENDENTES ⚠️', desc: 'Suas fotos de ponto de partida são essenciais para a avaliação de encerramento do Projeto. O envio é obrigatório para começar!', btnText: 'ENVIAR FOTOS DO DIA 1', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
      case 'CHALLENGE_21': return { title: 'FOTOS DO DIA 1 — OBRIGATÓRIAS ⚠️', desc: 'O Desafio de 21 Dias depende das fotos iniciais para medir o seu resultado final. Sem o "antes", não existe "depois".', btnText: 'ENVIAR FOTOS E COMEÇAR', escapeText: 'TREINAR MESMO ASSIM', showEscape: false };
      default: return { title: 'FOTOS PENDENTES 📸', desc: 'Envie suas fotos iniciais para mapearmos sua evolução.', btnText: 'ENVIAR FOTOS', escapeText: 'TREINAR MESMO ASSIM', showEscape: true };
    }
  };
  const photoModal = getPhotoModalContent();

  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 };

  if (!workoutId && !data.loading && data.exercisesToShow.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
          Você está sem internet para carregar o treino pela primeira vez.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          style={{ marginTop: 30, padding: 15, backgroundColor: theme.accent, borderRadius: 10, width: '100%', alignItems: 'center' }}
        >
          <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 16 }}>VOLTAR PARA O INÍCIO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (data.loading && data.exercisesToShow.length === 0) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );

  const ListHeader = () => (
    <View style={{ marginBottom: 20 }}>

      {!isPreviewMode && OFFLINE_DOWNLOAD_ENABLED && (
        <OfflineBanner
          downloadStatus={downloadStatus}
          downloadProgress={downloadProgress}
          onPressDownload={() => setDownloadConfirmVisible(true)}
          onPressDelete={() => setDeleteConfirmVisible(true)}
          theme={theme}
        />
      )}

      {!timer.isTimerRunning && timer.elapsedSeconds === 0 && !isPreviewMode ? (
        <TouchableOpacity
          style={{ backgroundColor: theme.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 16, gap: 10, elevation: 5 }}
          onPress={handleStartTimerRequest}
        >
          <MaterialCommunityIcons name="play" size={30} color={theme.isDark ? '#000' : '#FFF'} />
          <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>INICIAR TREINO</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 }}>
            {isPreviewMode ? "CRONÔMETRO (ESPIÃO)" : "TEMPO DECORRIDO"}
          </Text>
          <Text style={{ color: theme.text, fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {formatTime(timer.elapsedSeconds)}
          </Text>
        </View>
      )}
    </View>
  );

  const ListFooter = () => (
    !isPreviewMode ? (
      <TouchableOpacity
        style={{ backgroundColor: theme.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 20, gap: 10 }}
        onPress={validateAndFinish}
      >
        <Text style={{ color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>FINALIZAR TREINO</Text>
        <MaterialCommunityIcons name="check-all" size={24} color={theme.isDark ? '#000' : '#FFF'} />
      </TouchableOpacity>
    ) : null
  );

  const renderExerciseBlock = ({ item }) => {
    const currentCoachId = data.userData?.coachId || data.userData?.nutritionistId;
    const isMasterStudent = currentCoachId ? MASTER_IDS.includes(currentCoachId) : false;

    return (
      <ExpandableExerciseBlock
        block={item}
        isExpanded={!!expandedBlocks[item.id]}
        onToggle={() => toggleBlock(item.id)}
        theme={theme}
        lastWeights={data.lastWeights}
        historyWeights={data.historyWeights}
        handleSaveWeight={data.handleSaveWeight}
        checkedSets={data.checkedSets}
        handleCheckSet={data.handleCheckSet}
        handleOpenVideo={handleOpenVideo}
        handleOpenIA={isMasterStudent ? handleOpenIA : null}
        handleOpenCalc={handleOpenCalc}
        hasPremiumFeatures={data.userPlan === 'PREMIUM' || data.userPlan === 'ELITE'}
        workoutModel={data.workoutModel}
        TECH_GUIDE={data.techGuide}
        setTechModalVisible={setTechModalVisible}
        setSelectedTech={setSelectedTech}
        handleSwap={data.handleSwap}
        resolveAsset={resolveAsset}
        isTimerRunning={timer.isTimerRunning}
        isVoiceEnabled={voice.isVoiceEnabled}
        colors={{
          bg: theme.bg, surface: theme.surface, border: theme.border,
          text: theme.text, textMuted: theme.textSecondary, primary: theme.accent,
          primaryText: theme.isDark ? '#000' : '#FFF', inputBg: theme.isDark ? '#1C1C1E' : '#F5F5F5',
          glass: theme.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)'
        }}
        userData={data.userData}
      />
    );
  };

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

      <View style={{ flex: 1, position: 'relative', alignItems: 'center' }}>
        <View style={{
          width: isWeb ? '100%' : width,
          maxWidth: isWeb ? 480 : width,
          flex: 1,
          backgroundColor: theme.bg,
          ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {})
        }}>
          <FlatList
            data={groupedExercises}
            keyExtractor={(item) => item.id}
            renderItem={renderExerciseBlock}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
            removeClippedSubviews={false}
          />
        </View>
      </View>

      {/* Modais existentes */}
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

      {/* 🔥 Modais offline */}
      <DownloadConfirmModal
        visible={downloadConfirmVisible}
        onConfirm={handleConfirmDownload}
        onCancel={() => setDownloadConfirmVisible(false)}
        theme={theme}
      />
      <DeleteDownloadModal
        visible={deleteConfirmVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        theme={theme}
      />

    </RootComponent>
  );
}