// src/components/MontarTreino/Modals/TemplateAndCloneModals.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TemplateAndCloneModals({
    theme, isWeb, webOuterBg,
    modalCloneVisible, setModalCloneVisible, cloneStudentsList, selectedCloneStudent, setSelectedCloneStudent, cloneWorkoutsList, applyClone, fetchWorkoutsOfStudent,
    modalTemplatesVisible, setModalTemplatesVisible, templatesList, goals, levels, templateGoal, setTemplateGoal, templateLevel, setTemplateLevel, fetchTemplates, applyTemplate,
    modalSaveTemplateVisible, setModalSaveTemplateVisible, saveTemplateName, setSaveTemplateName, templateGoalInput, setTemplateGoalInput, templateLevelInput, setTemplateLevelInput, saveAsTemplate,
    collections, saveTemplateCollectionId, setSaveTemplateCollectionId // 🔥 NOVO: Props para receber as pastas do Hook
}) {
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

            {/* MODAL DE TEMPLATES VISUAIS COM PASTAS */}
            <Modal visible={modalTemplatesVisible} animationType="slide">
                <View style={{ flex: 1, backgroundColor: webOuterBg }}>
                    <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 10, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
                        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: isWeb ? 20 : 10, paddingHorizontal: 20, paddingBottom: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[styles.headerTitle, { color: theme.text }]}>BIBLIOTECA DE MODELOS</Text>
                                <TouchableOpacity onPress={() => setModalTemplatesVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <FlatList 
                        style={[{ flex: 1, width: '100%' }, isWeb && { overflowY: 'auto' }]}
                        contentContainerStyle={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, paddingBottom: 100, flexGrow: 1, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
                        data={templatesList} 
                        keyExtractor={item => item.id} 
                        ListHeaderComponent={
                            <View style={{marginBottom: 20}}>
                                <Text style={{color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 10}}>FILTRAR POR OBJETIVO</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                                    {goals.map(g => (
                                        <TouchableOpacity key={g} style={[styles.catChip, { backgroundColor: theme.surface, borderColor: theme.border }, templateGoal===g && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>{setTemplateGoal(g); fetchTemplates();}}>
                                            <Text style={[styles.catText, { color: theme.textSecondary }, templateGoal===g && {color: theme.isDark ? '#000' : '#FFF'}]}>{g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <Text style={{color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 10}}>FILTRAR POR NÍVEL</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {levels.map(l => (
                                        <TouchableOpacity key={l} style={[styles.catChip, { backgroundColor: theme.surface, borderColor: theme.border }, templateLevel===l && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>{setTemplateLevel(l); fetchTemplates();}}>
                                            <Text style={[styles.catText, { color: theme.textSecondary }, templateLevel===l && {color: theme.isDark ? '#000' : '#FFF'}]}>{l}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.templateCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => applyTemplate(item)}>
                                <View>
                                    <Text style={[styles.templateName, { color: theme.text }]}>{item.name}</Text>
                                    <Text style={[styles.templateTags, { color: theme.textSecondary }]}>{item.goal} • {item.level}</Text>
                                </View>
                                <MaterialCommunityIcons name="download" size={24} color={theme.accent} />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={{textAlign:'center', color: theme.textSecondary, marginTop: 20}}>Nenhum modelo encontrado nesta pasta.</Text>}
                    />
                </View>
            </Modal>

            {/* 📁 MODAL DE SALVAR TEMPLATE NA BIBLIOTECA (ATUALIZADO) */}
            <Modal visible={modalSaveTemplateVisible} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
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

                          {/* 🔥 A NOVA SELEÇÃO DE PASTAS */}
                          <View>
                              <Text style={styles.label}>SALVAR EM QUAL PASTA?</Text>
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                  <TouchableOpacity 
                                      style={[styles.chip, !saveTemplateCollectionId ? { borderColor: theme.accent, backgroundColor: theme.accent + '22' } : { backgroundColor: theme.bg, borderColor: theme.border }]}
                                      onPress={() => setSaveTemplateCollectionId(null)}
                                  >
                                      <Text style={[styles.chipText, { color: !saveTemplateCollectionId ? theme.accent : theme.textSecondary }]}>Nenhuma (Avulso)</Text>
                                  </TouchableOpacity>

                                  {collections?.map(col => (
                                      <TouchableOpacity 
                                          key={col.id}
                                          style={[styles.chip, { flexDirection: 'row', alignItems: 'center', gap: 6 }, saveTemplateCollectionId === col.id ? { borderColor: col.color, backgroundColor: col.color + '22' } : { backgroundColor: theme.bg, borderColor: theme.border }]}
                                          onPress={() => setSaveTemplateCollectionId(col.id)}
                                      >
                                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: col.color }} />
                                          <Text style={[styles.chipText, { color: saveTemplateCollectionId === col.id ? col.color : theme.textSecondary }]}>{col.name}</Text>
                                      </TouchableOpacity>
                                  ))}
                              </ScrollView>
                          </View>

                          {/* 🔥 TAGS COM WRAP (FIM DA ROLAGEM HORIZONTAL) */}
                          <View>
                              <Text style={styles.label}>OBJETIVO (TAG)</Text>
                              <View style={styles.rowWrap}>
                                  {['Hipertrofia', 'Emagrecimento', 'Força', 'Definição', 'Qualidade de Vida'].map(g => (
                                      <TouchableOpacity 
                                          key={g} 
                                          onPress={() => setTemplateGoalInput(g)} 
                                          style={[styles.chip, templateGoalInput === g ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.bg, borderColor: theme.border }]}
                                      >
                                          <Text style={[styles.chipText, templateGoalInput === g ? { color: theme.isDark ? '#000' : '#FFF' } : { color: theme.textSecondary }]}>{g}</Text>
                                      </TouchableOpacity>
                                  ))}
                              </View>
                          </View>

                          <View>
                              <Text style={styles.label}>NÍVEL (TAG)</Text>
                              <View style={styles.rowWrap}>
                                  {['Iniciante', 'Intermediário', 'Avançado'].map(l => (
                                      <TouchableOpacity 
                                          key={l} 
                                          onPress={() => setTemplateLevelInput(l)} 
                                          style={[styles.chip, templateLevelInput === l ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.bg, borderColor: theme.border }]}
                                      >
                                          <Text style={[styles.chipText, templateLevelInput === l ? { color: theme.isDark ? '#000' : '#FFF' } : { color: theme.textSecondary }]}>{l}</Text>
                                      </TouchableOpacity>
                                  ))}
                              </View>
                          </View>

                          <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.accent, marginTop: 10 }]} onPress={saveAsTemplate}>
                              <Text style={[styles.createBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR NA BIBLIOTECA</Text>
                          </TouchableOpacity>
                      </ScrollView>
                  </View>
              </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    headerTitle: { fontSize: 18, fontWeight: '900' },
    templateCard: { padding:15, borderRadius:12, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1 },
    templateName: { fontWeight:'bold', fontSize:16 },
    templateTags: { fontSize:12, marginTop:4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 24, padding: 25, borderWidth: 1, width: '100%', maxWidth: 440, alignSelf: 'center', maxHeight: '85%' },
    modalTitle: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
    label: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
    input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    rowWrap: { flexDirection:'row', flexWrap:'wrap', gap:8 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
    chipText: { fontSize: 11, fontWeight: 'bold' },
    catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, height:32, justifyContent:'center', borderWidth:1 },
    catText: { fontSize: 11, fontWeight: 'bold' },
    createBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
    createBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});