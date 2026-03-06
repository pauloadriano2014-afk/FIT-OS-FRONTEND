// src/components/MontarTreino/Modals/TemplateAndCloneModals.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TemplateAndCloneModals({
    theme, isWeb, webOuterBg,
    modalCloneVisible, setModalCloneVisible, cloneStudentsList, selectedCloneStudent, setSelectedCloneStudent, cloneWorkoutsList, applyClone, fetchWorkoutsOfStudent,
    modalTemplatesVisible, setModalTemplatesVisible, templatesList, goals, levels, templateGoal, setTemplateGoal, templateLevel, setTemplateLevel, fetchTemplates, applyTemplate,
    modalSaveTemplateVisible, setModalSaveTemplateVisible, saveTemplateName, setSaveTemplateName, templateGoalInput, setTemplateGoalInput, templateLevelInput, setTemplateLevelInput, saveAsTemplate
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

            {/* MODAL DE SALVAR TEMPLATE (MODELO NOVO) */}
            <Modal visible={modalSaveTemplateVisible} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.accent }]}>SALVAR COMO MODELO</Text>
                        <Text style={{color: theme.textSecondary, fontSize: 12, marginBottom: 15, textAlign: 'center'}}>Salve esta rotina para aplicar em outros alunos futuramente.</Text>
                        
                        <TextInput style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Nome do Template" placeholderTextColor={theme.textSecondary} value={saveTemplateName} onChangeText={setSaveTemplateName} />
                        
                        <Text style={[styles.miniLabelLeft, { color: theme.textSecondary }]}>OBJETIVO (PASTA)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15, maxHeight: 40}}>
                            {goals.filter(g => g !== 'TODOS').map(g => (
                                <TouchableOpacity key={g} style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.bg }, templateGoalInput===g && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>setTemplateGoalInput(g)}>
                                    <Text style={[styles.tagText, { color: theme.textSecondary }, templateGoalInput===g && {color: theme.isDark ? '#000' : '#FFF'}]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.miniLabelLeft, { color: theme.textSecondary }]}>NÍVEL (PASTA)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20, maxHeight: 40}}>
                                {['Iniciante','Intermediário','Avançado'].map(l => (
                                    <TouchableOpacity key={l} style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.bg }, templateLevelInput===l && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={()=>setTemplateLevelInput(l)}>
                                        <Text style={[styles.tagText, { color: theme.textSecondary }, templateLevelInput===l && {color: theme.isDark ? '#000' : '#FFF'}]}>{l}</Text>
                                    </TouchableOpacity>
                                ))}
                        </ScrollView>

                        <TouchableOpacity style={[styles.saveBtnModal, { backgroundColor: theme.accent }]} onPress={saveAsTemplate}>
                            <Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight:'900'}}>SALVAR NA BIBLIOTECA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginTop:15}} onPress={() => setModalSaveTemplateVisible(false)}>
                            <Text style={{color: theme.textSecondary, textAlign:'center'}}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    headerTitle: { fontSize: 18, fontWeight: '900' },
    templateCard: { padding:15, borderRadius:12, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1 },
    templateName: { fontWeight:'bold', fontSize:16 },
    templateTags: { fontSize:12, marginTop:4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 30 },
    modalContent: { borderRadius: 15, padding: 20, borderWidth: 1, width: '100%', maxWidth: 400, alignSelf: 'center' },
    modalTitle: { fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    modalInput: { padding:12, borderRadius:8, borderWidth:1, marginBottom:15, fontSize: 16, outlineStyle: 'none' },
    saveBtnModal: { padding:15, borderRadius:10, alignItems:'center', width:'100%' },
    tag: { paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, marginRight:5, height: 30, justifyContent: 'center' },
    tagText: { fontSize:10, fontWeight:'bold' },
    miniLabelLeft: { fontSize:10, fontWeight:'bold', marginBottom:8 },
    catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, height:32, justifyContent:'center', borderWidth:1 },
    catText: { fontSize: 11, fontWeight: 'bold' }
});