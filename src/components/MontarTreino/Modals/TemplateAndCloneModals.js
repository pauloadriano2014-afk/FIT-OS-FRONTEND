// src/components/MontarTreino/Modals/TemplateAndCloneModals.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function TemplateAndCloneModals({
    theme, isWeb, webOuterBg,
    modalCloneVisible, setModalCloneVisible, cloneStudentsList, selectedCloneStudent, setSelectedCloneStudent, cloneWorkoutsList, applyClone, fetchWorkoutsOfStudent,
    modalTemplatesVisible, setModalTemplatesVisible, templatesList, goals, levels, templateGoal, setTemplateGoal, templateLevel, setTemplateLevel, fetchTemplates, applyTemplate,
    modalSaveTemplateVisible, setModalSaveTemplateVisible, saveTemplateName, setSaveTemplateName, templateGoalInput, setTemplateGoalInput, templateLevelInput, setTemplateLevelInput, saveAsTemplate,
    collections, saveTemplateCollectionId, setSaveTemplateCollectionId,
    selectedLibraryCollection, setSelectedLibraryCollection,
    selectedPillar, setSelectedPillar,
    selectedLevelTab, setSelectedLevelTab
}) {

    const displayedTemplatesToImport = selectedLibraryCollection 
        ? templatesList.filter(t => t.collectionId === selectedLibraryCollection.id)
        : selectedPillar 
            ? templatesList.filter(t => t.goal === selectedPillar && t.level === selectedLevelTab && !t.collectionId)
            : []; 

    return (
        <>
            {/* MODAL DE CLONAR ALUNO */}
            <Modal visible={modalCloneVisible} animationType="slide">
                <View style={{ flex: 1, backgroundColor: webOuterBg }}>
                    <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 10, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
                        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: isWeb ? 20 : 10, paddingHorizontal: 20, paddingBottom: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => { if (selectedCloneStudent) setSelectedCloneStudent(null); else setModalCloneVisible(false); }}>
                                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                                </TouchableOpacity>
                                <Text style={[styles.headerTitle, { color: theme.text }]}>{selectedCloneStudent ? "ESCOLHA O TREINO" : "ESCOLHA O ALUNO"}</Text>
                                <View style={{width: 24}}/>
                            </View>
                        </View>
                    </View>
                    <FlatList 
                        style={[{ flex: 1, width: '100%' }, isWeb && { overflowY: 'auto' }]}
                        contentContainerStyle={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, paddingBottom: 100, flexGrow: 1, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
                        data={selectedCloneStudent ? cloneWorkoutsList : cloneStudentsList} 
                        keyExtractor={item => item.id} 
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.templateCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => selectedCloneStudent ? applyClone(item) : fetchWorkoutsOfStudent(item.id)}>
                                <View>
                                    <Text style={[styles.templateName, { color: theme.text }]}>{item.name}</Text>
                                    {item.email && <Text style={[styles.templateTags, { color: theme.textSecondary }]}>{item.email}</Text>}
                                    {item.goal && <Text style={[styles.templateTags, { color: theme.textSecondary }]}>{item.goal} • {item.level}</Text>}
                                </View>
                                <MaterialCommunityIcons name={selectedCloneStudent ? "content-copy" : "chevron-right"} size={24} color={theme.accent} />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={{textAlign:'center', color: theme.textSecondary, marginTop: 20}}>{selectedCloneStudent ? "Este aluno não tem treinos montados." : "Nenhum aluno encontrado."}</Text>}
                    />
                </View>
            </Modal>

            {/* MODAL DA BIBLIOTECA - NOVA ARQUITETURA */}
            <Modal visible={modalTemplatesVisible} animationType="slide">
                <View style={{ flex: 1, backgroundColor: webOuterBg }}>
                    <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 10, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
                        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: isWeb ? 20 : 10, paddingHorizontal: 20, paddingBottom: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => {
                                    if(selectedLibraryCollection) setSelectedLibraryCollection(null);
                                    else if(selectedPillar) setSelectedPillar(null);
                                    else setModalTemplatesVisible(false);
                                }}>
                                    <MaterialCommunityIcons name={(selectedLibraryCollection || selectedPillar) ? "arrow-left" : "close"} size={24} color={theme.text} />
                                </TouchableOpacity>
                                
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                                        {selectedLibraryCollection ? selectedLibraryCollection.name.toUpperCase() 
                                          : selectedPillar ? selectedPillar.toUpperCase() 
                                          : "IMPORTAR TREINO"}
                                    </Text>
                                    {selectedLibraryCollection && <Text style={{ color: selectedLibraryCollection.color, fontSize: 10, fontWeight: 'bold' }}>COLEÇÃO ESPECIAL</Text>}
                                    {selectedPillar && <Text style={{ color: theme.accent, fontSize: 10, fontWeight: 'bold' }}>METODOLOGIA</Text>}
                                </View>
                                <View style={{width: 24}}/>
                            </View>

                            {selectedPillar && (
                                <View style={{ flexDirection: 'row', marginTop: 20, backgroundColor: theme.surface, borderRadius: 10, padding: 4 }}>
                                    {levels.map(l => (
                                        <TouchableOpacity 
                                            key={l} 
                                            style={[styles.levelTab, selectedLevelTab === l && { backgroundColor: theme.bg, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }]}
                                            onPress={() => setSelectedLevelTab(l)}
                                        >
                                            <Text style={[styles.levelTabText, { color: selectedLevelTab === l ? theme.text : theme.textSecondary }]}>{l}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    <FlatList 
                        style={[{ flex: 1, width: '100%' }, isWeb && { overflowY: 'auto' }]}
                        contentContainerStyle={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, paddingBottom: 100, flexGrow: 1, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
                        data={displayedTemplatesToImport} 
                        keyExtractor={item => item.id} 
                        ListHeaderComponent={
                            (!selectedLibraryCollection && !selectedPillar) ? (
                                <View style={{marginBottom: 20}}>
                                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PILARES DE TREINAMENTO</Text>
                                    <View style={{ gap: 10, marginBottom: 30 }}>
                                        {goals.map(goal => (
                                            <TouchableOpacity 
                                                key={goal} 
                                                style={[styles.pillarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                                onPress={() => setSelectedPillar(goal)}
                                            >
                                                <Text style={[styles.pillarTitle, { color: theme.text }]}>{goal}</Text>
                                                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PROJETOS E DESAFIOS (COLEÇÕES)</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
                                        {collections?.length === 0 ? (
                                            <Text style={{color: theme.textSecondary, fontStyle:'italic'}}>Nenhuma coleção criada.</Text>
                                        ) : (
                                            collections?.map(col => (
                                                <TouchableOpacity 
                                                    key={col.id} 
                                                    style={[styles.collectionCard, { backgroundColor: col.color + '15', borderColor: col.color }]}
                                                    onPress={() => setSelectedLibraryCollection(col)}
                                                >
                                                    <MaterialCommunityIcons name="folder-star" size={24} color={col.color} style={{ marginBottom: 5 }} />
                                                    <Text style={[styles.collectionTitle, { color: col.color }]} numberOfLines={2}>{col.name}</Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                </View>
                            ) : null
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.templateCard, { backgroundColor: theme.surface, borderLeftColor: selectedLibraryCollection ? selectedLibraryCollection.color : theme.accent, borderLeftWidth: 4 }]} onPress={() => applyTemplate(item)}>
                                <View style={{flex: 1, paddingRight: 10}}>
                                    <Text style={[styles.templateName, { color: theme.text }]}>{item.name}</Text>
                                    <Text style={{fontSize: 10, fontWeight: 'bold', color: theme.textSecondary, marginTop: 4}}>
                                        {Object.keys(JSON.parse(item.data || '{}')).length} Dia(s) de Treino
                                    </Text>
                                </View>
                                <View style={{padding: 8, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border}}>
                                    <MaterialCommunityIcons name="download" size={20} color={selectedLibraryCollection ? selectedLibraryCollection.color : theme.accent} />
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={(selectedLibraryCollection || selectedPillar) ? <Text style={{textAlign:'center', color: theme.textSecondary, marginTop: 20}}>Nenhum treino encontrado nesta categoria.</Text> : null}
                    />
                </View>
            </Modal>

            {/* 🔥 MODAL PREMIUM DE SALVAR TEMPLATE NA BIBLIOTECA */}
            <Modal visible={modalSaveTemplateVisible} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                          <Text style={[styles.modalTitle, { color: theme.accent }]}>SALVAR NA BIBLIOTECA</Text>
                          <TouchableOpacity onPress={() => setModalSaveTemplateVisible(false)}>
                              <MaterialCommunityIcons name="close" size={24} color={theme.text}/>
                          </TouchableOpacity>
                      </View>

                      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                          
                          <View>
                              <Text style={styles.label}>NOME DO TREINO</Text>
                              <TextInput 
                                  style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]} 
                                  placeholder="Ex: Costas e Bíceps - Foco Expansão" 
                                  placeholderTextColor={theme.textSecondary}
                                  value={saveTemplateName}
                                  onChangeText={setSaveTemplateName}
                              />
                          </View>

                          <View style={{ backgroundColor: theme.bg, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
                              
                              {/* OPÇÃO 1: SALVAR EM COLEÇÃO FECHADA */}
                              <Text style={[styles.label, {color: theme.accent, marginTop: 0}]}>OPÇÃO 1: SALVAR EM PROJETO/COLEÇÃO</Text>
                              <View style={[styles.rowWrap, { marginBottom: 25, marginTop: 10 }]}>
                                  <TouchableOpacity 
                                      style={[styles.modernChip, !saveTemplateCollectionId ? styles.modernChipSelected : { backgroundColor: theme.surface, shadowColor: theme.isDark ? '#000' : '#888' }]}
                                      onPress={() => setSaveTemplateCollectionId(null)}
                                  >
                                      <Text style={[styles.modernChipText, { color: !saveTemplateCollectionId ? theme.accent : theme.textSecondary }]}>Não usar Coleção</Text>
                                  </TouchableOpacity>

                                  {collections?.map(col => (
                                      <TouchableOpacity 
                                          key={col.id}
                                          style={[styles.modernChip, saveTemplateCollectionId === col.id ? { borderColor: col.color, backgroundColor: col.color + '15', shadowColor: col.color, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 } : { backgroundColor: theme.surface, shadowColor: theme.isDark ? '#000' : '#888' }]}
                                          onPress={() => setSaveTemplateCollectionId(col.id)}
                                      >
                                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: col.color, marginRight: 8 }} />
                                          <Text style={[styles.modernChipText, { color: saveTemplateCollectionId === col.id ? col.color : theme.textSecondary }]}>{col.name}</Text>
                                      </TouchableOpacity>
                                  ))}
                              </View>

                              {/* OPÇÃO 2: SALVAR NOS PILARES PADRÕES */}
                              {!saveTemplateCollectionId && (
                                  <View style={{ opacity: saveTemplateCollectionId ? 0.3 : 1 }}>
                                      <Text style={[styles.label, {color: theme.text}]}>OPÇÃO 2: METODOLOGIA PADRÃO</Text>
                                      
                                      <Text style={[styles.label, {marginTop: 15}]}>QUAL PILAR?</Text>
                                      <View style={styles.rowWrap}>
                                          {goals.map(g => (
                                              <TouchableOpacity 
                                                  key={g} 
                                                  onPress={() => setTemplateGoalInput(g)} 
                                                  style={[styles.modernChip, templateGoalInput === g ? { backgroundColor: theme.text, borderColor: theme.text, shadowColor: theme.text, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 } : { backgroundColor: theme.surface, shadowColor: theme.isDark ? '#000' : '#888' }]}
                                              >
                                                  <Text style={[styles.modernChipText, templateGoalInput === g ? { color: theme.bg } : { color: theme.textSecondary }]}>{g}</Text>
                                              </TouchableOpacity>
                                          ))}
                                      </View>

                                      <Text style={[styles.label, {marginTop: 20}]}>QUAL NÍVEL?</Text>
                                      <View style={styles.rowWrap}>
                                          {levels.map(l => (
                                              <TouchableOpacity 
                                                  key={l} 
                                                  onPress={() => setTemplateLevelInput(l)} 
                                                  style={[styles.modernChip, templateLevelInput === l ? { backgroundColor: theme.text, borderColor: theme.text, shadowColor: theme.text, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 } : { backgroundColor: theme.surface, shadowColor: theme.isDark ? '#000' : '#888' }]}
                                              >
                                                  <Text style={[styles.modernChipText, templateLevelInput === l ? { color: theme.bg } : { color: theme.textSecondary }]}>{l}</Text>
                                              </TouchableOpacity>
                                          ))}
                                      </View>
                                  </View>
                              )}
                          </View>

                          <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.accent, marginTop: 10 }]} onPress={saveAsTemplate}>
                              <Text style={[styles.createBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR TREINO</Text>
                          </TouchableOpacity>
                      </ScrollView>
                  </View>
              </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
    
    pillarCard: { padding: 18, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pillarTitle: { fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },

    levelTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    levelTabText: { fontWeight: 'bold', fontSize: 12 },
    
    collectionCard: { width: '48%', padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 10, alignItems: 'flex-start' },
    collectionTitle: { fontWeight: '900', fontSize: 13, marginTop: 5 },

    templateCard: { padding:18, borderRadius:12, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1 },
    templateName: { fontWeight:'900', fontSize:15 },
    templateTags: { fontSize:11, marginTop:4, fontWeight: 'bold' },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 24, padding: 25, borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center', maxHeight: '85%' },
    modalTitle: { fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },
    label: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
    input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 15, fontWeight: 'bold', outlineStyle: 'none' },
    rowWrap: { flexDirection:'row', flexWrap:'wrap', gap: 10 },
    
    // 🔥 OS NOVOS CARDS PREMIUM NO LUGAR DOS "CHIPS" VELHOS
    modernChip: { 
        paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, 
        borderWidth: 1, borderColor: 'transparent',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 
    },
    modernChipSelected: {
        borderColor: '#32ADE6', backgroundColor: '#32ADE622',
        shadowColor: '#32ADE6', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4
    },
    modernChipText: { fontSize: 12, fontWeight: 'bold' },

    createBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
    createBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});