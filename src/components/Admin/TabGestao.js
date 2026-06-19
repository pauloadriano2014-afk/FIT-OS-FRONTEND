// src/components/Admin/TabGestao.js
import React from 'react';
import { View, Text, TouchableOpacity, Switch, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabGestao({ 
    theme, subTabGestao, setSubTabGestao, navigation, alunosAtivos, 
    setIsNpsModalOpen, setIsNoticeModalOpen, toggleDarkMode, selectThemeColor, selectedColor 
}) {
    return (
        <View style={styles.gridGestao}>
            <View style={styles.subTabsContainer}>
                <TouchableOpacity style={[styles.subTab, subTabGestao === 'FERRAMENTAS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabGestao('FERRAMENTAS')}>
                    <Text style={[styles.subTabText, { color: subTabGestao === 'FERRAMENTAS' ? theme.text : theme.textSecondary }]}>TREINO E DIETA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.subTab, subTabGestao === 'CONFIG' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabGestao('CONFIG')}>
                    <Text style={[styles.subTabText, { color: subTabGestao === 'CONFIG' ? theme.text : theme.textSecondary }]}>SISTEMA E AVISOS</Text>
                </TouchableOpacity>
            </View>

            {subTabGestao === 'FERRAMENTAS' && (
                <>
                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.accent, borderWidth: 2 }]} onPress={() => navigation.navigate('LaboratoryScreen')}>
                        <View style={[styles.iconCircle, {backgroundColor: theme.accent + '22'}]}><MaterialCommunityIcons name="flask-outline" size={32} color={theme.accent} /></View>
                        <Text style={[styles.bigCardTitle, { color: theme.accent }]}>PRESCRIÇÃO IA</Text>
                        <Text style={styles.bigCardDesc}>Laboratório inteligente para montagem de treinos com algoritmos.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('BibliotecaAdmin')}>
                        <View style={[styles.iconCircle, {backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border}]}><MaterialCommunityIcons name="database-edit" size={32} color={theme.accent} /></View>
                        <Text style={[styles.bigCardTitle, { color: theme.text }]}>EXERCÍCIOS</Text>
                        <Text style={styles.bigCardDesc}>Gerencie a biblioteca.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('GerenciarTemplates')}>
                        <View style={[styles.iconCircle, {backgroundColor: theme.accent}]}><MaterialCommunityIcons name="folder-multiple" size={32} color={theme.isDark ? '#000' : '#FFF'} /></View>
                        <Text style={[styles.bigCardTitle, { color: theme.text }]}>MEUS TEMPLATES</Text>
                        <Text style={styles.bigCardDesc}>Crie fichas de treino padrão.</Text>
                    </TouchableOpacity>

                    {/* 🔥 NOVO: GERENCIADOR DE TÉCNICAS E COMBOS 🔥 */}
                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminTechniquesScreen')}>
                        <View style={[styles.iconCircle, {backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border}]}><MaterialCommunityIcons name="puzzle-outline" size={32} color={theme.accent} /></View>
                        <Text style={[styles.bigCardTitle, { color: theme.text }]}>TÉCNICAS AVANÇADAS</Text>
                        <Text style={styles.bigCardDesc}>Crie combos e sequências de execução (Drops, Rest, etc).</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminDietLibraryScreen')}>
                        <View style={[styles.iconCircle, {backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border}]}><MaterialCommunityIcons name="food-apple" size={32} color={theme.accent} /></View>
                        <Text style={[styles.bigCardTitle, { color: theme.text }]}>COFRE DE DIETAS</Text>
                        <Text style={styles.bigCardDesc}>Gerencie templates alimentares.</Text>
                    </TouchableOpacity>

                    {/* 🔥 LABORATÓRIO IA DE VOLTA 🔥 */}
                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#4DE38F', borderWidth: 2 }]} onPress={() => navigation.navigate('AdminIALabScreen')}>
                        <View style={[styles.iconCircle, {backgroundColor: '#4DE38F22'}]}>
                            <MaterialCommunityIcons name="brain" size={32} color="#4DE38F" />
                        </View>
                        <Text style={[styles.bigCardTitle, { color: '#4DE38F' }]}>LABORATÓRIO IA</Text>
                        <Text style={styles.bigCardDesc}>Análise avulsa de fotos e shape.</Text>
                    </TouchableOpacity>

                    {/* 🔥 RANKING DE XP DE VOLTA 🔥 */}
                    <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:15}}>
                            <Text style={styles.cardHeaderSmall}>RANKING DE XP</Text>
                            <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                        </View>
                        {[...alunosAtivos].sort((a,b) => (b.currentXP||0) - (a.currentXP||0)).slice(0, 3).map((a, i) => (
                            <View key={a.id} style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:8, borderBottomWidth:1, borderBottomColor: theme.border, paddingBottom:5}}>
                                <Text style={{color: theme.text, fontWeight:'bold'}}>{i+1}. {a.name || 'Aluno'}</Text>
                                <Text style={{color: theme.accent, fontWeight:'900'}}>{a.currentXP || 0} XP</Text>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {subTabGestao === 'CONFIG' && (
                <>
                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#BF5AF2' }]} onPress={() => navigation.navigate('AdminAddContent')}>
                        <View style={[styles.iconCircle, {backgroundColor: '#BF5AF2'}]}><MaterialCommunityIcons name="video-plus" size={32} color="#FFF" /></View>
                        <Text style={[styles.bigCardTitle, {color: '#BF5AF2'}]}>PA FLIX ADMIN</Text>
                        <Text style={styles.bigCardDesc}>Adicionar novos conteúdos e vídeos.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#4DE38F', borderWidth: 2 }]} onPress={() => setIsNpsModalOpen(true)}>
                        <View style={{flexDirection:'row', alignItems:'center', gap:10}}><MaterialCommunityIcons name="star-face" size={24} color="#4DE38F" /><Text style={[styles.bigCardTitle, {marginBottom:0, color:'#4DE38F'}]}>PESQUISA NPS</Text></View>
                        <Text style={[styles.bigCardDesc, {marginTop:5}]}>Selecione alunos e dispare a pesquisa de satisfação no aplicativo deles.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#32ADE6' }]} onPress={() => setIsNoticeModalOpen(true)}>
                        <View style={{flexDirection:'row', alignItems:'center', gap:10}}><MaterialCommunityIcons name="bullhorn" size={24} color="#32ADE6" /><Text style={[styles.bigCardTitle, {marginBottom:0, color:'#32ADE6'}]}>ENVIAR AVISO</Text></View>
                        <Text style={[styles.bigCardDesc, {marginTop:5}]}>Notifique todos ou um aluno específico.</Text>
                    </TouchableOpacity>

                    <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: 20 }]}>
                        <Text style={styles.cardHeaderSmall}>APARÊNCIA DO PAINEL</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, width: '100%' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name={theme.isDark ? "moon-waning-crescent" : "white-balance-sunny"} size={24} color={theme.text} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Modo Escuro</Text></View>
                            <Switch value={theme.isDark} onValueChange={toggleDarkMode} trackColor={{ false: '#ccc', true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (theme.isDark ? '#FFF' : '#f4f3f4')} />
                        </View>

                        {/* 🔥 BOLINHAS DE COR DE VOLTA (Apenas no modo claro) 🔥 */}
                        {!theme.isDark && (
                            <View style={{ width: '100%' }}>
                                <Text style={[styles.cardHeaderSmall, { marginBottom: 10, marginTop: 5 }]}>COR DE DESTAQUE</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                                    <TouchableOpacity onPress={() => selectThemeColor('verde')} style={[styles.colorCircle, { backgroundColor: '#99CC00', borderColor: selectedColor === 'verde' ? theme.text : 'transparent' }]} />
                                    <TouchableOpacity onPress={() => selectThemeColor('rosa')} style={[styles.colorCircle, { backgroundColor: '#FF2D55', borderColor: selectedColor === 'rosa' ? theme.text : 'transparent' }]} />
                                    <TouchableOpacity onPress={() => selectThemeColor('roxo')} style={[styles.colorCircle, { backgroundColor: '#AF52DE', borderColor: selectedColor === 'roxo' ? theme.text : 'transparent' }]} />
                                    <TouchableOpacity onPress={() => selectThemeColor('azul')} style={[styles.colorCircle, { backgroundColor: '#007AFF', borderColor: selectedColor === 'azul' ? theme.text : 'transparent' }]} />
                                    <TouchableOpacity onPress={() => selectThemeColor('vermelho')} style={[styles.colorCircle, { backgroundColor: '#FF3B30', borderColor: selectedColor === 'vermelho' ? theme.text : 'transparent' }]} />
                                </View>
                            </View>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    gridGestao: { gap: 15 },
    subTabsContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
    subTab: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' }, 
    subTabText: { fontSize: 11, fontWeight: '800' },
    bigCard: { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center', cursor: 'pointer' }, 
    iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    bigCardTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6, letterSpacing: 0.5 },
    bigCardDesc: { color: '#888', fontSize: 12, textAlign: 'center', paddingHorizontal: 10, lineHeight: 18 },
    cardHeaderSmall: { color:'#888', fontWeight:'900', fontSize:11, letterSpacing: 1 },
    colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 }
});