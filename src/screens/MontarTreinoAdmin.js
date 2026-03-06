// src/screens/MontarTreinoAdmin.js
import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, Switch, StatusBar, Dimensions } from 'react-native'; 
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useMontarTreino } from '../hooks/useMontarTreino';
import ExerciseCardAdmin from '../components/MontarTreino/ExerciseCardAdmin';
import CustomCalendar from '../components/CustomCalendar';
import LibraryModals from '../components/MontarTreino/Modals/LibraryModals';
import TemplateAndCloneModals from '../components/MontarTreino/Modals/TemplateAndCloneModals';

const { width } = Dimensions.get('window');
const formatDateToString = (date) => { if (!date) return ''; const d = new Date(date); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };

export default function MontarTreinoAdmin({ route, navigation }) {
  const { theme } = useTheme(); 
  const previewVideoRef = useRef(null);
  const controller = useMontarTreino(route, navigation);

  const { state, setters, actions } = controller;
  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  const RootComponent = isWeb ? View : SafeAreaViewContext;

  if (state.loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.accent} /></View>;

  const currentExOpened = state.currentExercises[state.indexExercicioAtual];
  const isCurrentCardio = currentExOpened?.category?.toUpperCase() === 'CARDIO';
  const modalOptionsToShow = isCurrentCardio ? state.intensidadesCardio : state.tecnicasDisponiveis;
  const modalTitleToShow = isCurrentCardio ? 'INTENSIDADE' : 'TÉCNICA';

  return (
    <RootComponent style={{ flex: 1, backgroundColor: isWeb ? webOuterBg : theme.bg }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 10, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
          <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: isWeb ? 20 : 10, paddingBottom: 15 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border, width: 45, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900', letterSpacing: 1, flex: 1, textAlign: 'center' }} numberOfLines={1}>
                  {route.params?.isEditing ? "EDITAR ROTINA" : "NOVA ROTINA"}
              </Text>
              <TouchableOpacity onPress={actions.salvarTreinoFinal} disabled={state.sending} style={{ width: 45, alignItems: 'center' }}>
                  {state.sending ? <ActivityIndicator color={theme.accent}/> : <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 12 }}>SALVAR</Text>}
              </TouchableOpacity>
          </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={isWeb ? { height: '100vh', width: '100%' } : { flex: 1 }} enabled={Platform.OS !== 'web'}>
          <ScrollView style={isWeb ? { flex: 1, width: '100%', overflowY: 'auto' } : { flex: 1, width: '100%' }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', width: '100%' }} showsVerticalScrollIndicator={true} bounces={false} overScrollMode="never">
              <View style={{ width: '100%', maxWidth: isWeb ? 480 : '100%', backgroundColor: theme.bg, flex: 1, padding: 20, paddingBottom: 150, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border, minHeight: '100vh' } : {}) }}>
                    
                      {!state.isTemplateMode && (
                          <TouchableOpacity style={[styles.healthBar, { backgroundColor: state.hasInjury ? (theme.isDark ? '#330000' : '#FFE5E5') : theme.surface, borderColor: state.hasInjury ? '#FF3B30' : theme.border }]} onPress={() => setters.setAnamneseModal(true)}>
                              <MaterialCommunityIcons name={state.hasInjury ? "alert-circle" : "check-circle"} size={24} color={state.hasInjury ? '#FF3B30' : theme.textSecondary} />
                              <View style={{flex:1}}>
                                  <Text style={[styles.healthTitle, { color: state.hasInjury ? '#FF3B30' : theme.textSecondary }]}>{state.hasInjury ? "ALUNO COM RESTRIÇÕES" : "FICHA MÉDICA OK"}</Text>
                                  {state.hasInjury && <Text style={styles.healthSubtitle}>Toque para ver detalhes da anamnese</Text>}
                              </View>
                              <MaterialCommunityIcons name="chevron-right" size={20} color={state.hasInjury ? '#FF3B30' : theme.textSecondary} />
                          </TouchableOpacity>
                      )}

                      {!state.isTemplateMode && (
                          <View style={[styles.planningContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                              <TextInput style={[styles.nameInput, { backgroundColor: theme.bg, color: theme.accent, borderColor: theme.border }]} placeholder="NOME DA ROTINA (EX: HIPERTROFIA A)" placeholderTextColor={theme.textSecondary} value={state.customWorkoutName} onChangeText={setters.setCustomWorkoutName} />
                              
                              <View style={styles.dateRow}>
                                  <TouchableOpacity style={styles.dateInputGroup} onPress={() => setters.setShowCalendarStart(true)}>
                                      <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>INÍCIO</Text>
                                      <View style={[styles.dateDisplay, { backgroundColor: theme.bg, borderColor: theme.border }]}><MaterialCommunityIcons name="calendar" size={16} color={theme.accent} /><Text style={[styles.dateText, { color: theme.text }]}>{formatDateToString(state.startDate)}</Text></View>
                                  </TouchableOpacity>
                                  <TouchableOpacity style={styles.dateInputGroup} onPress={() => setters.setShowCalendarEnd(true)}>
                                      <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>FIM</Text>
                                      <View style={[styles.dateDisplay, { backgroundColor: theme.bg, borderColor: theme.border }, state.isArchived && {opacity: 0.5}]}>
                                          <MaterialCommunityIcons name="calendar-check" size={16} color="#32ADE6" /><Text style={[styles.dateText, { color: theme.text }]}>{formatDateToString(state.endDate)}</Text></View>
                                  </TouchableOpacity>
                              </View>
                              <View style={[styles.archiveRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                  <Text style={[styles.archiveLabel, state.isArchived ? {color:'#FF3B30'} : {color: theme.accent}]}>STATUS: {state.isArchived ? "ARQUIVADO" : "ATIVO"}</Text>
                                  <Switch 
                                      value={state.isArchived} 
                                      onValueChange={(val) => { setters.setIsArchived(val); if (!val && state.endDate < new Date()) { const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 30); setters.setEndDate(futureDate); } }} 
                                      trackColor={{false: theme.border, true: theme.isDark ? '#330000' : '#FFE5E5'}} 
                                      thumbColor={state.isArchived ? '#FF3B30' : theme.accent} 
                                  />
                              </View>
                          </View>
                      )}

                      <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
                            {state.isReordering ? (
                                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#28a745', flex:1}]} onPress={() => setters.setIsReordering(false)}>
                                    <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                                    <Text style={[styles.actionBtnText, {color:'#FFF'}]}>FINALIZAR ORDENAÇÃO</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity style={[styles.actionBtn, {borderColor:'#32ADE6', borderWidth:1, flex:1}]} onPress={() => setters.setIsReordering(true)}>
                                        <MaterialCommunityIcons name="sort" size={20} color="#32ADE6" />
                                        <Text style={[styles.actionBtnText, {color:'#32ADE6'}]}>REORDENAR</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor:'#32ADE6', flex:1}]} onPress={() => { setters.setIsSelectingSubstitute(false); setters.setIsSwapping(false); setters.setModalBuscaVisible(true); }}>
                                        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                                        <Text style={[styles.actionBtnText, {color:'#FFF'}]}>ADICIONAR</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                       </View>

                      {state.isTemplateMode && (
                          <View style={[styles.configBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                              <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>NOME DO MODELO</Text>
                              <TextInput style={[styles.nameInput, { backgroundColor: theme.bg, color: theme.accent, borderColor: theme.border, marginTop: 10 }]} placeholder="Ex: Hipertrofia Elite A/B/C" placeholderTextColor={theme.textSecondary} value={state.customWorkoutName} onChangeText={setters.setCustomWorkoutName} />
                              <Text style={[styles.miniLabel, { color: theme.textSecondary, marginTop: 10 }]}>CATEGORIA / PASTA</Text>
                              <View style={{flexDirection:'row', gap:8, marginTop:10, flexWrap:'wrap'}}>
                                  {['Hipertrofia','Emagrecimento','Força'].map(g => (
                                      <TouchableOpacity key={g} style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.bg }, state.templateGoalInput===g && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>setters.setTemplateGoalInput(g)}>
                                          <Text style={[styles.tagText, { color: theme.textSecondary }, state.templateGoalInput===g && {color: theme.isDark ? '#000' : '#FFF'}]}>{g}</Text>
                                      </TouchableOpacity>
                                  ))}
                              </View>
                              <View style={{flexDirection:'row', gap:8, marginTop:10, flexWrap:'wrap'}}>
                                      {['Iniciante','Intermediário','Avançado'].map(l => (
                                          <TouchableOpacity key={l} style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.bg }, state.templateLevelInput===l && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>setters.setTemplateLevelInput(l)}>
                                              <Text style={[styles.tagText, { color: theme.textSecondary }, state.templateLevelInput===l && {color: theme.isDark ? '#000' : '#FFF'}]}>{l}</Text>
                                          </TouchableOpacity>
                                      ))}
                              </View>
                          </View>
                      )}

                      <View style={styles.toolsRow}>
                          <TouchableOpacity style={[styles.toolBtnHighlight, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.accent }]} onPress={actions.handleClearWorkout}>
                              <MaterialCommunityIcons name="delete-sweep" size={18} color={theme.text} />
                              <Text style={[styles.toolBtnTextDark, { color: theme.text }]}>LIMPAR DIA</Text>
                          </TouchableOpacity>

                          {!state.isTemplateMode && (
                              <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { actions.fetchStudentsForClone(); setters.setModalCloneVisible(true); }}>
                                  <MaterialCommunityIcons name="account-switch" size={18} color={theme.text} />
                                  <Text style={[styles.toolBtnText, { color: theme.text }]}>CLONAR ALUNO</Text>
                              </TouchableOpacity>
                          )}

                          <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { actions.fetchTemplates(); setters.setModalTemplatesVisible(true); }}>
                              <MaterialCommunityIcons name="folder-download" size={18} color={theme.text} />
                              <Text style={[styles.toolBtnText, { color: theme.text }]}>BIBLIOTECA</Text>
                          </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity 
                          style={[{ backgroundColor: theme.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 20, gap: 10, elevation: 2 }]} 
                          onPress={actions.handleImportPDF}
                          disabled={state.isImportingAI}
                      >
                          {state.isImportingAI ? <ActivityIndicator color={theme.isDark ? "#000" : "#FFF"} /> : (
                              <>
                                  <MaterialCommunityIcons name="magic-staff" size={22} color={theme.isDark ? "#000" : "#FFF"} />
                                  <Text style={[{ color: theme.isDark ? "#000" : "#FFF", fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }]}>IMPORTAR TREINO DA MFIT (PDF)</Text>
                              </>
                          )}
                      </TouchableOpacity>

                      <View style={{ marginBottom: 15 }}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={isWeb} style={isWeb ? { overflowX: 'auto' } : {}} contentContainerStyle={{ gap: 10, paddingBottom: 5 }}>
                              {state.workoutTabs.map(tab => (
                                  <TouchableOpacity 
                                      key={tab} 
                                      style={[styles.tabBtnDynamic, { backgroundColor: theme.surface, borderColor: theme.border }, state.selectedWorkoutTab === tab && { borderColor: theme.accent, backgroundColor: theme.accent + '11' }]} 
                                      onPress={() => { 
                                          if(state.selectedWorkoutTab === tab) { setters.setNewTabName(tab); setters.setRenameTabModalVisible(true);
                                          } else {
                                              setters.setSelectedWorkoutTab(tab); 
                                              if(!state.exercisesByDay[tab]) { const updated = {...state.exercisesByDay, [tab]: []}; setters.setExercisesByDay(updated); }
                                          }
                                      }}
                                  >
                                      <Text style={[styles.tabBtnTextDynamic, { color: theme.textSecondary }, state.selectedWorkoutTab === tab && { color: theme.accent }]}>{tab}</Text>
                                      {state.selectedWorkoutTab === tab && <MaterialCommunityIcons name="pencil" size={12} color={theme.accent} style={{marginLeft: 5}} />}
                                  </TouchableOpacity>
                              ))}
                              <TouchableOpacity style={[styles.tabBtnDynamic, { backgroundColor: theme.surface, borderColor: theme.border, borderStyle: 'dashed' }]} onPress={actions.addNewTab}>
                                  <MaterialCommunityIcons name="plus" size={18} color={theme.textSecondary} />
                              </TouchableOpacity>
                          </ScrollView>
                      </View>

                      {state.isReordering && <Text style={{color: theme.textSecondary, textAlign:'center', fontStyle:'italic', marginBottom:10}}>Use as setas para mover os itens</Text>}

                      {state.currentExercises.length === 0 ? (
                          <View style={{alignItems:'center', marginTop:30}}>
                              <MaterialCommunityIcons name="dumbbell" size={40} color={theme.border} />
                              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Dia vazio.</Text>
                          </View>
                      ) : (
                          <>
                          {state.currentExercises.map((item, index) => (
                              <ExerciseCardAdmin 
                                  key={item.tempId} item={item} index={index} theme={theme}
                                  isReordering={state.isReordering} moveExercise={actions.moveExercise} removeExercicio={actions.removeExercicio}
                                  setIsSelectingSubstitute={setters.setIsSelectingSubstitute} setTargetIndexForSubstitute={setters.setTargetIndexForSubstitute}
                                  setModalBuscaVisible={setters.setModalBuscaVisible} removeSubstitute={actions.removeSubstitute}
                                  atualizarBloco={actions.atualizarBloco} adicionarBloco={actions.adicionarBloco} removerBloco={actions.removerBloco}
                                  setIndexExercicioAtual={setters.setIndexExercicioAtual} setIndexBlocoAtual={setters.setIndexBlocoAtual}
                                  setModalTecnicaVisible={setters.setModalTecnicaVisible} atualizarObservacao={actions.atualizarObservacao}
                                  openPreview={actions.openPreview} currentExercisesLength={state.currentExercises.length}
                                  setIsSwapping={setters.setIsSwapping} setSwapIndex={setters.setSwapIndex}
                                  setInitialCategoryFilter={(catName) => {
                                      const normalizedCat = catName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                                      const foundCat = state.categories.find(c => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === normalizedCat);
                                      if (foundCat) setters.setSelectedCategory(foundCat);
                                  }}
                              />
                          ))}
                          
                          {!state.isReordering && (
                              <TouchableOpacity style={[styles.addBtnSmall, { borderColor: theme.border }]} onPress={() => { setters.setIsSelectingSubstitute(false); setters.setIsSwapping(false); setters.setModalBuscaVisible(true); }}>
                                  <Text style={[styles.addBtnText, { color: theme.textSecondary }]}>+ ADICIONAR EXERCÍCIO</Text>
                              </TouchableOpacity>
                          )}
                          
                          {!state.isTemplateMode && (
                              <TouchableOpacity style={{ marginTop: 25, padding: 15, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={() => setters.setModalSaveTemplateVisible(true)}>
                                  <MaterialCommunityIcons name="content-save-all" size={18} color={theme.accent} />
                                  <Text style={{color: theme.accent, fontWeight: 'bold', fontSize: 12}}>SALVAR ROTINA COMO TEMPLATE</Text>
                              </TouchableOpacity>
                          )}
                          </>
                      )}
              </View>
          </ScrollView>
      </KeyboardAvoidingView>

      {/* COMPONENTES EXTRAÍDOS (MODAIS) */}
      <LibraryModals 
          theme={theme} isWeb={isWeb} webOuterBg={webOuterBg}
          modalBuscaVisible={state.modalBuscaVisible} setModalBuscaVisible={setters.setModalBuscaVisible}
          searchText={state.searchText} setSearchText={setters.setSearchText}
          selectedCategory={state.selectedCategory} setSelectedCategory={setters.setSelectedCategory}
          showCatDropdown={state.showCatDropdown} setShowCatDropdown={setters.setShowCatDropdown}
          categories={state.categories} exerciciosFiltrados={state.exerciciosFiltrados}
          addExercicioManual={actions.addExercicioManual} isSwapping={state.isSwapping}
          openPreview={actions.openPreview} previewModalVisible={state.previewModalVisible}
          setPreviewModalVisible={setters.setPreviewModalVisible} previewExercise={state.previewExercise}
          setPreviewExercise={setters.setPreviewExercise} previewVideoRef={previewVideoRef}
      />

      <TemplateAndCloneModals 
          theme={theme} isWeb={isWeb} webOuterBg={webOuterBg}
          modalCloneVisible={state.modalCloneVisible} setModalCloneVisible={setters.setModalCloneVisible}
          cloneStudentsList={state.cloneStudentsList} selectedCloneStudent={state.selectedCloneStudent} setSelectedCloneStudent={setters.setSelectedCloneStudent}
          cloneWorkoutsList={state.cloneWorkoutsList} applyClone={actions.applyClone} fetchWorkoutsOfStudent={actions.fetchWorkoutsOfStudent}
          modalTemplatesVisible={state.modalTemplatesVisible} setModalTemplatesVisible={setters.setModalTemplatesVisible}
          templatesList={state.templatesList} goals={state.goals} levels={state.levels}
          templateGoal={state.templateGoal} setTemplateGoal={setters.setTemplateGoal} templateLevel={state.templateLevel} setTemplateLevel={setters.setTemplateLevel}
          fetchTemplates={actions.fetchTemplates} applyTemplate={actions.applyTemplate}
          modalSaveTemplateVisible={state.modalSaveTemplateVisible} setModalSaveTemplateVisible={setters.setModalSaveTemplateVisible}
          saveTemplateName={state.saveTemplateName} setSaveTemplateName={setters.setSaveTemplateName}
          templateGoalInput={state.templateGoalInput} setTemplateGoalInput={setters.setTemplateGoalInput}
          templateLevelInput={state.templateLevelInput} setTemplateLevelInput={setters.setTemplateLevelInput}
          saveAsTemplate={actions.saveAsTemplate}
      />

      {/* MODAL PARA RENOMEAR/EXCLUIR ABA DE TREINO */}
      <Modal visible={state.renameTabModalVisible} transparent animationType="fade" onRequestClose={() => setters.setRenameTabModalVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.accent }]}>GERENCIAR DIA</Text>
                  <Text style={[styles.miniLabelLeft, { color: theme.textSecondary, marginTop: 10 }]}>NOME DO DIA/TREINO:</Text>
                  <TextInput style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginBottom: 20 }]} value={state.newTabName} onChangeText={setters.setNewTabName} autoFocus />
                  <View style={{flexDirection: 'row', gap: 10}}>
                      <TouchableOpacity style={[styles.saveBtnModal, { backgroundColor: theme.accent, flex: 1 }]} onPress={actions.handleRenameTab}>
                          <Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight:'900'}}>SALVAR NOME</Text>
                      </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, gap: 5}} onPress={actions.handleDeleteTab}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                      <Text style={{color: '#FF3B30', fontWeight: 'bold'}}>Excluir este dia inteiro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{marginTop:20, padding: 10}} onPress={() => setters.setRenameTabModalVisible(false)}>
                      <Text style={{color: theme.textSecondary, textAlign:'center'}}>Cancelar</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* MODAIS DE CALENDÁRIO */}
      <Modal visible={state.showCalendarStart} transparent animationType="fade">
          <View style={styles.modalOverlay}><CustomCalendar selectedDate={state.startDate} onSelect={actions.onSelectStartDate} onClose={() => setters.setShowCalendarStart(false)} theme={theme} /></View>
      </Modal>
      <Modal visible={state.showCalendarEnd} transparent animationType="fade">
          <View style={styles.modalOverlay}><CustomCalendar selectedDate={state.endDate} onSelect={actions.onSelectEndDate} onClose={() => setters.setShowCalendarEnd(false)} theme={theme} /></View>
      </Modal>
      
      {/* OUTROS MODAIS (Técnica, Anamnese) */}
      <Modal visible={state.modalTecnicaVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.accent }]}>{modalTitleToShow}</Text>
                  {modalOptionsToShow.map((t) => (
                      <TouchableOpacity key={t.id} style={[styles.techOption, { borderBottomColor: theme.border }]} onPress={() => { actions.atualizarBloco(state.indexExercicioAtual, state.indexBlocoAtual, 'technique', t.id); setters.setModalTecnicaVisible(false); }}>
                          <Text style={[styles.techOptionText, { color: theme.text }, (state.exercisesByDay[state.selectedWorkoutTab]?.[state.indexExercicioAtual]?.blocks?.[state.indexBlocoAtual]?.technique === t.id) && {color: theme.accent}]}>{t.title}</Text>
                      </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={{marginTop:20, padding: 15, backgroundColor: theme.bg, borderRadius: 10, alignItems: 'center'}} onPress={() => setters.setModalTecnicaVisible(false)}>
                      <Text style={{color: theme.text, fontWeight: 'bold'}}>Cancelar</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={state.anamneseModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.accent }]}>PRONTUÁRIO</Text>
                  <ScrollView style={{maxHeight: 400}}>
                      {state.detalhes?.anamnese ? (
                          <>
                          <View style={[styles.infoBlock, { borderBottomColor: theme.border }]}><Text style={[styles.infoLabel, { color: theme.accent }]}>OBJETIVO:</Text><Text style={[styles.infoValue, { color: theme.text }]}>{state.detalhes.anamnese.objetivo || "-"}</Text></View>
                          <View style={[styles.infoBlock, { borderBottomColor: theme.border }]}><Text style={[styles.infoLabel, {color:'#FF3B30'}]}>LIMITAÇÕES:</Text><Text style={[styles.infoValue, { color: theme.text }]}>{state.detalhes.anamnese.limitacoes?.join(', ') || "Nenhuma"}</Text></View>
                          <View style={[styles.infoBlock, { borderBottomColor: theme.border }]}><Text style={[styles.infoLabel, {color:'#FF3B30'}]}>CIRURGIAS:</Text><Text style={[styles.infoValue, { color: theme.text }]}>{state.detalhes.anamnese.cirurgias?.join(', ') || "Nenhuma"}</Text></View>
                          </>
                      ) : <Text style={{color: theme.textSecondary}}>Sem dados.</Text>}
                  </ScrollView>
                  <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]} onPress={() => setters.setAnamneseModal(false)}>
                      <Text style={{color: theme.text, fontWeight:'bold'}}>FECHAR</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

    </RootComponent>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent:'center', alignItems:'center' },
  healthBar: { flexDirection:'row', alignItems:'center', padding:15, borderRadius:12, marginBottom:20, gap:12, borderWidth:1 },
  healthTitle: { fontSize: 13, fontWeight: '900', letterSpacing:0.5 },
  healthSubtitle: { fontSize: 10, color: '#AAA', marginTop: 2 },
  planningContainer: { padding:15, borderRadius:15, borderWidth:1, marginBottom:20 },
  nameInput: { padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, fontSize: 16, fontWeight: 'bold', textAlign: 'center', outlineStyle: 'none' },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom:15 },
  dateInputGroup: { flex: 1 },
  dateLabel: { fontSize: 10, fontWeight: '900', marginBottom: 5 },
  dateDisplay: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, padding:12, borderRadius:8, borderWidth:1 },
  dateText: { fontWeight:'bold', fontSize:14 },
  archiveRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:10, borderRadius:10, borderWidth:1 },
  archiveLabel: { fontWeight:'900', fontSize:12 },
  configBox: { borderRadius:15, padding:15, marginBottom:15, borderWidth:1 },
  actionBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', padding:15, borderRadius:10, gap:8 },
  actionBtnText: { fontWeight:'900', fontSize:12 },
  toolsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  toolBtn: { flex: 1, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth:1 },
  toolBtnHighlight: { flex: 1, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  toolBtnText: { fontWeight: 'bold', fontSize: 11 },
  toolBtnTextDark: { fontWeight: '900', fontSize: 11 },
  tabBtnDynamic: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, flexDirection: 'row' },
  tabBtnTextDynamic: { fontWeight: 'bold', fontSize: 13 },
  addBtnSmall: { padding: 18, alignItems:'center', borderWidth:1, borderRadius:12, marginTop:10, borderStyle: 'dashed' },
  addBtnText: { fontWeight: 'bold', fontSize:13 },
  emptyText: { textAlign: 'center', marginVertical: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 30 },
  modalContent: { borderRadius: 15, padding: 20, borderWidth: 1, width: '100%', maxWidth: 400, alignSelf: 'center' },
  modalTitle: { fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  modalInput: { padding:12, borderRadius:8, borderWidth:1, marginBottom:15, fontSize: 16, outlineStyle: 'none' },
  saveBtnModal: { padding:15, borderRadius:10, alignItems:'center', width:'100%' },
  techOption: { paddingVertical: 12, borderBottomWidth: 1 },
  techOptionText: { fontWeight: 'bold', textAlign: 'center' },
  closeBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', width: '100%', marginTop: 15 },
  infoBlock: { marginBottom: 15, borderBottomWidth:1, paddingBottom:5 },
  infoLabel: { fontSize:10, fontWeight:'900', marginBottom:2 },
  infoValue: { fontSize:14 },
  tag: { paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, marginRight:5, height: 30, justifyContent: 'center' },
  tagText: { fontSize:10, fontWeight:'bold' },
  miniLabelLeft: { fontSize:10, fontWeight:'bold', marginBottom:8 }
});