import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminSurveyCard from './AdminSurveyCard';

export default function TabCheckins({
    theme, subTabCheckins, setSubTabCheckins, filteredCheckins, filteredDiet, filteredSurveys,
    visibleCountCheckins, setVisibleCountCheckins, visibleCountDiet, setVisibleCountDiet,
    visibleCountSurveys, setVisibleCountSurveys, coachFilter, isAdriLogged,
    setSelectedCheckin, setCheckinModalVisible, handleMarkFeedbackRead, handleDeleteFeedback, handleMarkSurveyRead
}) {
    const unreadFeedbacksCount = filteredDiet.filter(f => !f.read).length;
    const unreadSurveysCount = filteredSurveys.filter(s => !s.readByAdmin).length;

    const renderDietFeedbackItem = (item) => (
        <View key={item.id} style={[styles.feedCard, { flexDirection: 'column', alignItems: 'stretch', backgroundColor: theme.surface, borderColor: item.read ? theme.border : theme.accent, opacity: item.read ? 0.7 : 1 }]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems: 'center', width: '100%', marginBottom: 12}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10}}>
                    <View style={[styles.iconBox, { backgroundColor: item.read ? theme.bg : theme.accent + '22' }]}>
                        <MaterialCommunityIcons name="food-apple" size={20} color={item.read ? theme.textSecondary : theme.accent} />
                    </View>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={[styles.feedUser, { color: theme.text }]} numberOfLines={1}>{item.user?.name || "Aluno"}</Text>
                        <Text style={styles.feedTime}>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</Text>
                    </View>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                    {!item.read && ( 
                        <TouchableOpacity onPress={() => handleMarkFeedbackRead(item.id)} style={{padding: 8, backgroundColor: theme.accent, borderRadius: 8}}>
                            <MaterialCommunityIcons name="check-bold" size={16} color="#000" />
                        </TouchableOpacity> 
                    )}
                    <TouchableOpacity onPress={() => handleDeleteFeedback(item.id)} style={{padding: 8, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border}}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{backgroundColor: theme.bg, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border, gap: 12}}>
                <View><Text style={{color: theme.accent, fontSize: 9, fontWeight: '900'}}>1. SACIEDADE</Text><Text style={{color: theme.text, fontSize: 13}}>{item.satiety || 'Não informou'}</Text></View>
                {item.difficulty && <View><Text style={{color: theme.accent, fontSize: 9, fontWeight: '900'}}>2. DIFICULDADE</Text><Text style={{color: theme.text, fontSize: 13, fontStyle: 'italic'}}>"{(item.difficulty)}"</Text></View>}
                {item.requestedChanges && <View><Text style={{color: theme.accent, fontSize: 9, fontWeight: '900'}}>3. MUDANÇAS</Text><Text style={{color: theme.text, fontSize: 13, fontStyle: 'italic'}}>"{(item.requestedChanges)}"</Text></View>}
            </View>
        </View>
    );

    const renderCheckinItem = (item) => (
        <TouchableOpacity key={item.id} style={[styles.feedCard, { backgroundColor: theme.surface, borderColor: item.coachFeedback ? theme.border : '#FF3B30' }]} onPress={() => { setSelectedCheckin(item); setCheckinModalVisible(true); }}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 173, 230, 0.15)' }]}><MaterialCommunityIcons name="camera-account" size={20} color="#32ADE6" /></View>
            <View style={{flex: 1}}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <Text style={[styles.feedUser, { color: theme.text }]} numberOfLines={1}>{item.user?.name || "Aluno"}</Text>
                    <Text style={styles.feedTime}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                </View>
                <Text style={styles.feedAction}>Check-in: <Text style={{color: theme.text, fontWeight:'bold'}}>{item.weight ? `${item.weight}kg` : 'Fotos'}</Text></Text>
                {!item.coachFeedback && <View style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#FF3B3022', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}><Text style={{ color: '#FF3B30', fontSize: 9, fontWeight: 'bold' }}>AGUARDANDO AVALIAÇÃO</Text></View>}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <>
            <View style={styles.subTabsContainer}>
                <TouchableOpacity style={[styles.subTab, subTabCheckins === 'AVALIACOES' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabCheckins('AVALIACOES')}>
                    <Text style={[styles.subTabText, { color: subTabCheckins === 'AVALIACOES' ? theme.text : theme.textSecondary }]}>FOTOS ({filteredCheckins.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.subTab, subTabCheckins === 'AJUSTES' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabCheckins('AJUSTES')}>
                    <Text style={[styles.subTabText, { color: subTabCheckins === 'AJUSTES' ? theme.text : theme.textSecondary }]}>DIETA ({unreadFeedbacksCount})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.subTab, subTabCheckins === 'NPS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabCheckins('NPS')}>
                    <Text style={[styles.subTabText, { color: subTabCheckins === 'NPS' ? theme.text : theme.textSecondary }]}>NPS ({unreadSurveysCount})</Text>
                </TouchableOpacity>
            </View>

            {subTabCheckins === 'AVALIACOES' && ((coachFilter === 'ADRI' && !isAdriLogged) || (coachFilter === 'PAULO' && isAdriLogged)) ? (
                <View style={{ marginTop: 50, alignItems: 'center', paddingHorizontal: 40, paddingBottom: 50 }}>
                    <MaterialCommunityIcons name="lock" size={48} color={theme.border} />
                    <Text style={[styles.empty, { marginTop: 15 }]}>Fotos restritas apenas para a Coach responsável pelo plano.</Text>
                </View>
            ) : (
                <>
                    {subTabCheckins === 'AVALIACOES' && (filteredCheckins.length === 0 ? <Text style={styles.empty}>Nenhum check-in pendente.</Text> : filteredCheckins.slice(0, visibleCountCheckins).map(renderCheckinItem))}
                    {subTabCheckins === 'AJUSTES' && (filteredDiet.length === 0 ? <Text style={styles.empty}>Nenhuma solicitação de ajuste.</Text> : filteredDiet.slice(0, visibleCountDiet).map(renderDietFeedbackItem))}
                    {subTabCheckins === 'NPS' && (filteredSurveys.length === 0 ? <Text style={styles.empty}>Nenhuma pesquisa recebida.</Text> : filteredSurveys.slice(0, visibleCountSurveys).map(item => <View key={item.id} style={{ marginBottom: 15 }}><AdminSurveyCard item={item} theme={theme} onMarkRead={handleMarkSurveyRead} /></View>))}

                    {subTabCheckins === 'AVALIACOES' && visibleCountCheckins < filteredCheckins.length && <TouchableOpacity style={[styles.loadMoreBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} onPress={() => setVisibleCountCheckins(p => p + 5)}><Text style={[styles.loadMoreText, { color: theme.accent }]}>CARREGAR MAIS</Text></TouchableOpacity>}
                    {subTabCheckins === 'AJUSTES' && visibleCountDiet < filteredDiet.length && <TouchableOpacity style={[styles.loadMoreBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} onPress={() => setVisibleCountDiet(p => p + 5)}><Text style={[styles.loadMoreText, { color: theme.accent }]}>CARREGAR MAIS</Text></TouchableOpacity>}
                    {subTabCheckins === 'NPS' && visibleCountSurveys < filteredSurveys.length && <TouchableOpacity style={[styles.loadMoreBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} onPress={() => setVisibleCountSurveys(p => p + 5)}><Text style={[styles.loadMoreText, { color: theme.accent }]}>CARREGAR MAIS</Text></TouchableOpacity>}
                </>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    subTabsContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
    subTab: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' }, 
    subTabText: { fontSize: 11, fontWeight: '800' },
    empty: { color: '#888', textAlign: 'center', marginTop: 50, fontWeight: '600' },
    feedCard: { padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1 },
    iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    feedUser: { fontWeight: '900', fontSize: 14 }, feedTime: { color: '#888', fontSize: 10, fontWeight:'700' }, feedAction: { color: '#888', fontSize: 13, marginTop: 4 },
    loadMoreBtn: { padding: 16, marginVertical: 20, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    loadMoreText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});