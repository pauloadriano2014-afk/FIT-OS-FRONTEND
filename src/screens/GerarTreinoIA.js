// src/screens/GerarTreinoIA.js
import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, Platform, StatusBar, TextInput, Modal, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

import useGerarTreino from '../hooks/useGerarTreino';
import DayGroupCard from '../components/GerarTreino/DayGroupCard';
import ComparisonModal from '../components/GerarTreino/ComparisonModal';
import TemplatePickerModal from '../components/GerarTreino/TemplatePickerModal';
import { SavePresetModal, LoadPresetModal } from '../components/GerarTreino/PresetsModal';
import { StudentCard, StudentListItem } from '../components/GerarTreino/StudentCard';
import {
  STEP_SELECT_STUDENT, STEP_CYCLE_CONFIG, STEP_GENERATING,
  MUSCLE_GROUPS, CYCLE_PHASES, TECHNIQUES, TRAINING_ENVIRONMENTS,
} from '../components/GerarTreino/_constants';
import { getGroupInfo, getLevelColor, dayNeedsCardio } from '../components/GerarTreino/_helpers';

export default function GerarTreinoIA({ navigation, route }) {
  const { theme } = useTheme();
  const isWeb = Platform.OS === 'web';
  const windowWidth = Dimensions.get('window').width;
  const isWebPC = isWeb && windowWidth > 768;
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  const g = useGerarTreino(navigation, route);

  // ─── HEADER ───
  const stepInfo = {
    [STEP_SELECT_STUDENT]: { title: 'Protocolo ELITE', sub: 'Selecione o aluno' },
    [STEP_CYCLE_CONFIG]:   { title: g.selectedStudent?.name?.split(' ')[0] || 'Configurar', sub: 'Monte a estrutura do treino' },
    [STEP_GENERATING]:     { title: 'Protocolo ELITE', sub: 'Gerando rotina...' },
  };

  const renderHeader = () => (
    <View style={[S.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
      {g.step !== STEP_GENERATING && (
        <TouchableOpacity onPress={g.handleBack} style={[S.iconBtn, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1, marginHorizontal: g.step !== STEP_GENERATING ? 12 : 0 }}>
        <Text style={[S.headerTitle, { color: theme.text }]} numberOfLines={1}>{stepInfo[g.step]?.title}</Text>
        <Text style={[S.headerSub, { color: theme.textSecondary }]}>{stepInfo[g.step]?.sub}</Text>
      </View>
      <View style={[S.eliteBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
        <Text style={[S.eliteBadgeText, { color: theme.accent }]}>ELITE</Text>
      </View>
    </View>
  );

  // ─── STEP 1: SELECIONAR ALUNO ───
  const renderSelectStudent = () => (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <View style={[S.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="magnify" size={17} color={theme.textSecondary} />
          <TextInput style={[S.searchInput, { color: theme.text }]} placeholder="Buscar aluno..." placeholderTextColor={theme.textSecondary} value={g.search} onChangeText={g.setSearch} />
          {g.search.length > 0 && (
            <TouchableOpacity onPress={() => g.setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={15} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {g.loadingStudents ? (
        <View style={S.center}><ActivityIndicator color={theme.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {g.filteredStudents.map(s => (
            <StudentListItem key={s.id} student={s} onPress={g.handleSelectStudent} theme={theme} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  // ─── STEP 2: CONFIGURADOR ───
  const renderCycleConfig = () => {
    const anamnese = g.anamnese;
    const gender = g.studentDetail?.gender || '';

    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>

        {/* CARD DO ALUNO */}
        <StudentCard
          selectedStudent={g.selectedStudent}
          studentDetail={g.studentDetail}
          anamnese={g.anamnese}
          activeRules={g.activeRules}
          theme={theme}
        />

        {/* AÇÕES RÁPIDAS */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TouchableOpacity style={[S.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, flex: 1 }]} onPress={() => g.setShowPresetsLoader(true)}>
            <MaterialCommunityIcons name="bookmark-outline" size={15} color={theme.accent} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.accent }}>Carregar Preset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, flex: 1 }]} onPress={() => g.setShowPresetSaver(true)}>
            <MaterialCommunityIcons name="content-save-outline" size={15} color={theme.textSecondary} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>Salvar Preset</Text>
          </TouchableOpacity>
        </View>

        {/* AMBIENTE DE TREINO */}
        <Text style={[S.sectionTitle, { color: theme.textSecondary }]}>AMBIENTE DE TREINO</Text>
        <TouchableOpacity style={[S.envDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => g.setShowEnvPicker(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {(() => {
              const env = TRAINING_ENVIRONMENTS.find(e => e.id === g.trainingEnvironment);
              return (
                <>
                  <View style={[S.envIcon, { backgroundColor: (env?.color || theme.accent) + '20' }]}>
                    <MaterialCommunityIcons name={env?.icon || 'earth'} size={16} color={env?.color || theme.accent} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{env?.label || 'Selecionar'}</Text>
                </>
              );
            })()}
          </View>
          <MaterialCommunityIcons name="chevron-down" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* MODAL AMBIENTE */}
        <Modal visible={g.showEnvPicker} transparent animationType="slide" onRequestClose={() => g.setShowEnvPicker(false)}>
          <View style={S.modalOverlay}>
            <View style={[S.modalSheet, { backgroundColor: theme.surface }]}>
              <View style={S.modalHandle} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={[S.modalTitle, { color: theme.text }]}>Ambiente de Treino</Text>
                <TouchableOpacity onPress={() => g.setShowEnvPicker(false)}>
                  <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 460 }}>
                {TRAINING_ENVIRONMENTS.map(env => {
                  const isSel = g.trainingEnvironment === env.id;
                  return (
                    <TouchableOpacity key={env.id} style={[S.pickerRow, { borderBottomColor: theme.border, backgroundColor: isSel ? env.color + '10' : 'transparent' }]}
                      onPress={() => { g.setTrainingEnvironment(env.id); g.setShowEnvPicker(false); }}>
                      <View style={[S.envIcon, { backgroundColor: env.color + '20' }]}>
                        <MaterialCommunityIcons name={env.icon} size={16} color={env.color} />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: isSel ? '900' : '700', color: isSel ? env.color : theme.text, flex: 1 }}>{env.label}</Text>
                      {isSel && <MaterialCommunityIcons name="check-circle" size={18} color={env.color} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* FASE DO CICLO */}
        <Text style={[S.sectionTitle, { color: theme.textSecondary }]}>FASE DO CICLO</Text>
        <View style={{ gap: 8, marginBottom: 20 }}>
          {[CYCLE_PHASES.slice(0, 3), CYCLE_PHASES.slice(3)].map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
              {row.map(phase => {
                const isSel = g.cyclePhase === phase.id;
                return (
                  <TouchableOpacity key={phase.id} style={[S.phaseCard, { flex: 1, backgroundColor: isSel ? phase.color + '20' : theme.surface, borderColor: isSel ? phase.color : theme.border }]}
                    onPress={() => g.setCyclePhase(phase.id)}>
                    <MaterialCommunityIcons name={phase.icon} size={18} color={isSel ? phase.color : theme.textSecondary} />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: isSel ? phase.color : theme.text }}>{phase.label}</Text>
                    <Text style={{ fontSize: 10, lineHeight: 14, color: theme.textSecondary }} numberOfLines={2}>{phase.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {['EMAGRECIMENTO', 'DEFINICAO'].includes(g.cyclePhase) && (
          <View style={[S.infoRow, { backgroundColor: '#FF9500' + '15', borderColor: '#FF9500' + '30', marginBottom: 16 }]}>
            <MaterialCommunityIcons name="information-outline" size={14} color="#FF9500" />
            <Text style={{ fontSize: 12, color: '#FF9500', flex: 1 }}>Cardio de 300kcal será adicionado automaticamente nos dias de superiores e abdômen.</Text>
          </View>
        )}

        {/* TÉCNICAS */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={[S.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>TÉCNICAS</Text>
          <View style={[S.segmented, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            {['CYCLE', 'DAY'].map(scope => (
              <TouchableOpacity key={scope} style={[S.segmentBtn, g.techniqueScope === scope && { backgroundColor: theme.accent }]} onPress={() => g.setTechniqueScope(scope)}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: g.techniqueScope === scope ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }}>
                  {scope === 'CYCLE' ? 'Ciclo' : 'Por Dia'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
          {TECHNIQUES.map(tech => {
            const isSel = g.selectedTechniques.includes(tech.id);
            return (
              <TouchableOpacity key={tech.id} style={[S.techChip, { backgroundColor: isSel ? theme.accent + '20' : theme.surface, borderColor: isSel ? theme.accent : theme.border }]}
                onPress={() => g.toggleTechnique(tech.id)}>
                {isSel && <MaterialCommunityIcons name="check" size={11} color={theme.accent} />}
                <Text style={{ fontSize: 12, fontWeight: '700', color: isSel ? theme.accent : theme.textSecondary }}>{tech.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DIAS DE TREINO */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={[S.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>DIAS DE TREINO</Text>
          <TouchableOpacity onPress={g.addDay} style={[S.addDayBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
            <MaterialCommunityIcons name="plus" size={13} color={theme.accent} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.accent }}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {g.days.map(day => {
              const isAct = day.id === g.activeDayId;
              const filled = day.groups.length > 0;
              return (
                <TouchableOpacity key={day.id} style={[S.dayTab, { backgroundColor: isAct ? theme.accent : theme.surface, borderColor: isAct ? theme.accent : filled ? theme.accent + '50' : theme.border }]}
                  onPress={() => g.setActiveDayId(day.id)}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isAct ? (theme.isDark ? '#000' : '#FFF') : theme.text }}>{day.name || '?'}</Text>
                  {filled && !isAct && <View style={[S.dayDot, { backgroundColor: theme.accent }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* EDITOR DO DIA */}
        {g.activeDay && (
          <View style={[S.dayEditor, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TextInput style={[S.dayNameInput, { color: theme.accent, borderColor: theme.accent + '30', backgroundColor: theme.accent + '08', flex: 1 }]}
                value={g.activeDay.name} onChangeText={v => g.updateDayName(g.activeDay.id, v)} placeholder="Nome" placeholderTextColor={theme.textSecondary} />
              <TouchableOpacity style={[S.smallBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}
                onPress={() => g.setShowTemplatePicker(true)}>
                <MaterialCommunityIcons name="lightning-bolt" size={13} color={theme.textSecondary} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary }}>Template</Text>
              </TouchableOpacity>
              {g.days.length > 1 && (
                <TouchableOpacity onPress={() => g.removeDay(g.activeDay.id)} style={{ padding: 6 }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>

            {dayNeedsCardio(g.activeDay.groups, g.cyclePhase) && (
              <View style={[S.infoRow, { backgroundColor: '#FF9500' + '12', borderColor: '#FF9500' + '30', marginBottom: 10 }]}>
                <MaterialCommunityIcons name="heart-pulse" size={13} color="#FF9500" />
                <Text style={{ fontSize: 11, color: '#FF9500', flex: 1 }}>Cardio 300kcal será adicionado automaticamente</Text>
              </View>
            )}

            {g.activeDay.groups.length === 0 ? (
              <View style={[S.emptyState, { borderColor: theme.border }]}>
                <MaterialCommunityIcons name="dumbbell" size={26} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6 }}>Nenhum grupo adicionado</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {g.activeDay.groups.map((group, idx) => {
                  const info = getGroupInfo(group.id);
                  if (!info) return null;
                  return (
                    <DayGroupCard
                      key={group.id}
                      group={group} info={info} theme={theme}
                      isFirst={idx === 0}
                      isLast={idx === g.activeDay.groups.length - 1}
                      onMoveUp={() => g.moveGroupUp(g.activeDay.id, group.id)}
                      onMoveDown={() => g.moveGroupDown(g.activeDay.id, group.id)}
                      onRemove={() => g.removeGroupFromDay(g.activeDay.id, group.id)}
                      onUpdateQty={(qty) => g.updateGroupQty(g.activeDay.id, group.id, qty)}
                      onUpdateSets={(sets) => g.updateGroupSets(g.activeDay.id, group.id, sets)}
                      onUpdateRest={(rest) => g.updateGroupRest(g.activeDay.id, group.id, rest)}
                    />
                  );
                })}
              </View>
            )}

            <TouchableOpacity onPress={() => g.setShowGroupPicker(true)} style={[S.addGroupBtn, { borderColor: theme.accent + '40' }]}>
              <MaterialCommunityIcons name="plus" size={15} color={theme.accent} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.accent }}>Adicionar Grupo Muscular</Text>
            </TouchableOpacity>
          </View>
        )}

        {g.error ? (
          <View style={[S.errorBox, { backgroundColor: 'rgba(255,59,48,0.08)', borderColor: '#FF3B3040' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#FF3B30" />
            <Text style={{ fontSize: 13, color: '#FF3B30', flex: 1 }}>{g.error}</Text>
          </View>
        ) : null}

        {/* MODAL: GROUP PICKER */}
        <Modal visible={g.showGroupPicker} transparent animationType="slide" onRequestClose={() => g.setShowGroupPicker(false)}>
          <View style={S.modalOverlay}>
            <View style={[S.modalSheet, { backgroundColor: theme.surface }]}>
              <View style={S.modalHandle} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={[S.modalTitle, { color: theme.text }]}>Grupos Musculares</Text>
                <TouchableOpacity onPress={() => g.setShowGroupPicker(false)}>
                  <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 420 }}>
                {MUSCLE_GROUPS.map(mg => {
                  const added = g.activeDay?.groups.some(ag => ag.id === mg.id);
                  return (
                    <TouchableOpacity key={mg.id} style={[S.pickerRow, { borderBottomColor: theme.border, opacity: added ? 0.4 : 1 }]}
                      onPress={() => { if (!added) { g.addGroupToDay(mg.id); g.setShowGroupPicker(false); } }}>
                      <View style={[S.groupDot, { backgroundColor: mg.color }]} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, flex: 1 }}>{mg.label}</Text>
                      {added && <MaterialCommunityIcons name="check" size={15} color={theme.accent} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </ScrollView>
    );
  };

  // ─── STEP 3: GERANDO ───
  const renderGenerating = () => (
    <View style={[S.center, { paddingHorizontal: 32 }]}>
      <View style={[S.generatingBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
        <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: 2, color: theme.accent }}>ELITE</Text>
      </View>
      <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 24 }} />
      <Text style={{ fontSize: 19, fontWeight: '900', marginTop: 18, textAlign: 'center', color: theme.text }}>Montando protocolo...</Text>
      <Text style={{ fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, color: theme.textSecondary }}>{g.generatingMsg}</Text>
      <Text style={{ fontSize: 11, color: theme.textSecondary + '60', marginTop: 14, textAlign: 'center' }}>Isso pode levar até 30 segundos</Text>
    </View>
  );

  // ─── ROOT ───
  const Wrapper = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100dvh', width: '100%', backgroundColor: webOuterBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : { flex: 1, backgroundColor: theme.bg };

  return (
    <Wrapper style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <View style={isWeb ? { flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center', backgroundColor: theme.bg, borderLeftWidth: isWebPC ? 1 : 0, borderRightWidth: isWebPC ? 1 : 0, borderColor: theme.border, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : { flex: 1 }}>
        {renderHeader()}
        <View style={{ flex: 1 }}>
          {g.step === STEP_SELECT_STUDENT && renderSelectStudent()}
          {g.step === STEP_CYCLE_CONFIG   && renderCycleConfig()}
          {g.step === STEP_GENERATING     && renderGenerating()}
        </View>
        {g.step === STEP_CYCLE_CONFIG && (
          <View style={[S.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
            <TouchableOpacity style={[S.generateBtn, { backgroundColor: theme.accent }]} onPress={g.handleGenerate}>
              <Text style={{ fontSize: 15, fontWeight: '900', letterSpacing: 0.4, color: theme.isDark ? '#000' : '#FFF' }}>GERAR PROTOCOLO ELITE</Text>
            </TouchableOpacity>
            <Text style={{ textAlign: 'center', fontSize: 11, color: theme.textSecondary, marginTop: 8 }}>O protocolo será aberto no editor para revisão</Text>
          </View>
        )}
      </View>

      {/* MODAIS EXTERNOS */}
      <TemplatePickerModal
        visible={g.showTemplatePicker} onClose={() => g.setShowTemplatePicker(false)}
        onSelect={g.applyTemplate} gender={g.studentDetail?.gender || ''} theme={theme}
      />
      <SavePresetModal
        visible={g.showPresetSaver} onClose={() => g.setShowPresetSaver(false)}
        onSave={g.savePreset} presetName={g.presetName} setPresetName={g.setPresetName} theme={theme}
      />
      <LoadPresetModal
        visible={g.showPresetsLoader} onClose={() => g.setShowPresetsLoader(false)}
        savedPresets={g.savedPresets} onLoad={g.loadPreset} onDelete={g.deletePreset} theme={theme}
      />
      <ComparisonModal
        visible={g.showComparison} onClose={() => g.setShowComparison(false)}
        onConfirm={g.handleConfirmAndOpen} onRegenerate={() => { g.setShowComparison(false); g.generatedData && (g.setGeneratedData ? g.setGeneratedData(null) : null); }}
        generatedData={g.generatedData} studentDetail={g.studentDetail} theme={theme}
      />
    </Wrapper>
  );
}

const S = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle:  { fontSize: 16, fontWeight: '900' },
  headerSub:    { fontSize: 11, marginTop: 1 },
  iconBtn:      { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  eliteBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  eliteBadgeText:{ fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, borderWidth: 1 },
  searchInput:  { flex: 1, fontSize: 14, outlineStyle: 'none' },
  studentRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 13, borderWidth: 1, marginBottom: 9 },
  avatar:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  studentName:  { fontSize: 14, fontWeight: '800' },
  badge:        { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText:    { fontSize: 10, fontWeight: '800' },
  card:         { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  alertRow:     { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 8, borderRadius: 8, borderWidth: 1 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 11, borderWidth: 1 },
  envDropdown:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 13, borderWidth: 1, marginBottom: 20 },
  envIcon:      { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 },
  phaseCard:    { borderRadius: 12, padding: 12, borderWidth: 1, gap: 4 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 9, borderRadius: 9, borderWidth: 1 },
  segmented:    { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', padding: 2, gap: 2 },
  segmentBtn:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  techChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  addDayBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 9, borderWidth: 1 },
  dayTab:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  dayDot:       { width: 5, height: 5, borderRadius: 2.5 },
  dayEditor:    { borderRadius: 15, padding: 13, borderWidth: 1, marginBottom: 14 },
  dayNameInput: { padding: 9, borderRadius: 9, borderWidth: 1, fontSize: 14, fontWeight: '800', outlineStyle: 'none' },
  smallBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  emptyState:   { alignItems: 'center', paddingVertical: 22, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 11 },
  addGroupBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, borderRadius: 9, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 10 },
  groupDot:     { width: 8, height: 8, borderRadius: 4 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 11, borderWidth: 1, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet:   { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 36 },
  modalHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 14 },
  modalTitle:   { fontSize: 16, fontWeight: '900' },
  pickerRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
  generatingBox:{ width: 90, height: 90, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  footer:       { padding: 14, paddingBottom: 24, borderTopWidth: 1 },
  generateBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 17, borderRadius: 15 },
});