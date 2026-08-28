// src/components/StudentReportModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ADRI_COACH_ID = 'b7c0c181-41fd-4156-b8fe-963a267759a3';

export default function StudentReportModal({ visible, onClose, pendingFeedback, userName, markFeedbackAsRead, isMarkingAsRead, coachId }) {
    const currentCoachId = coachId || pendingFeedback?.coachId || pendingFeedback?.user?.coachId;
    const coachEmail     = pendingFeedback?.coach?.email || '';
    const isAdri = currentCoachId === ADRI_COACH_ID ||
                   coachEmail.toLowerCase() === 'adri.personal@hotmail.com' ||
                   pendingFeedback?.coachFeedback?.includes('Coach Adri Kern');

    const accentColor = isAdri ? '#AF52DE' : '#4DE38F';

    // ── Decodifica o tipo de marcação ─────────────────────────────────────────
    let rawFeedback      = pendingFeedback?.coachFeedback || '';
    let displayFeedback  = rawFeedback;
    let compareOldPhotos = [];
    let compareImgUrl    = null;   // ✅ Nova tag: imagem composta lado a lado

    // Tag nova: [COMPARE_IMG:url] → imagem composta gerada pelo editor
    if (rawFeedback.includes('[COMPARE_IMG:')) {
        const m = rawFeedback.match(/\[COMPARE_IMG:(.*?)\]/);
        if (m) {
            compareImgUrl   = m[1];
            displayFeedback = rawFeedback.replace(m[0], '').trim();
        }
    }
    // Tag antiga: [COMPARE:url1|url2|url3] → pares antes/depois separados
    else if (rawFeedback.includes('[COMPARE:')) {
        const m = rawFeedback.match(/\[COMPARE:(.*?)\]/);
        if (m) {
            compareOldPhotos = m[1].split('|');
            displayFeedback  = rawFeedback.replace(m[0], '').trim();
        }
    }

    const photoKeys = ['photoFront', 'photoSide', 'photoBack'];

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor:'#333' }]}>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={28} color="#AAA" />
                        </TouchableOpacity>
                        <View style={{ alignItems:'center', marginTop:10 }}>
                            <Text style={styles.title}>RELATÓRIO TÉCNICO</Text>
                            <Text style={[styles.subtitle, { color: accentColor }]}>ALUNO(A): {userName.toUpperCase()}</Text>
                        </View>
                        <View style={[styles.dateBadge, { backgroundColor: accentColor + '22' }]}>
                            <Text style={[styles.dateText, { color: accentColor }]}>
                                DATA: {pendingFeedback?.date
                                    ? new Date(pendingFeedback.date).toLocaleDateString('pt-BR',{ day:'2-digit', month:'long', year:'numeric' }).toUpperCase()
                                    : new Date().toLocaleDateString('pt-BR',{ day:'2-digit', month:'long', year:'numeric' }).toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:25, paddingBottom:80 }} showsVerticalScrollIndicator={false}>

                        {/* ── Imagem composta (nova tag COMPARE_IMG) ── */}
                        {compareImgUrl ? (
                            <View style={{ marginBottom:30 }}>
                                <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
                                    <MaterialCommunityIcons name="compare" size={16} color={accentColor} />
                                    <Text style={{ color: accentColor, fontSize:11, fontWeight:'900', letterSpacing:1 }}>COMPARAÇÃO DE SHAPE</Text>
                                </View>
                                <Image
                                    source={{ uri: compareImgUrl }}
                                    style={{ width:'100%', aspectRatio: 2, borderRadius:16, backgroundColor:'#111' }}
                                    resizeMode="contain"
                                />
                            </View>
                        ) : compareOldPhotos.length > 0 ? (
                            /* ── Pares antes/depois (tag antiga COMPARE) ── */
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap:20, marginBottom:30 }}>
                                {photoKeys.map((key, i) => {
                                    const current = pendingFeedback?.[key];
                                    const old     = compareOldPhotos[i];
                                    if (!current && (!old || old === 'null' || old === '')) return null;
                                    const label = i === 0 ? 'FRONTAL' : i === 1 ? 'LATERAL' : 'POSTERIOR';
                                    return (
                                        <View key={i} style={{ flexDirection:'row', gap:2, backgroundColor:'#1A1A1A', padding:8, borderRadius:16, borderWidth:1, borderColor:'#333' }}>
                                            {old && old !== 'null' && old !== '' && (
                                                <View style={styles.compPhoto}>
                                                    <Image source={{ uri: old }} style={styles.compPhotoImg} resizeMode="cover" />
                                                    <View style={styles.compBadgeDark}><Text style={styles.compBadgeTxt}>ANTES ({label})</Text></View>
                                                </View>
                                            )}
                                            {current && (
                                                <View style={styles.compPhoto}>
                                                    <Image source={{ uri: current }} style={styles.compPhotoImg} resizeMode="cover" />
                                                    <View style={[styles.compBadgeAccent, { backgroundColor: accentColor }]}>
                                                        <Text style={[styles.compBadgeTxt, { color: isAdri ? '#FFF' : '#000' }]}>DEPOIS ({label})</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            /* ── Fotos individuais ── */
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap:15, marginBottom:30 }}>
                                {photoKeys.map((key, i) => pendingFeedback?.[key] && (
                                    <View key={i} style={styles.soloPhoto}>
                                        <Image source={{ uri: pendingFeedback[key] }} style={styles.soloPhotoImg} resizeMode="cover" />
                                        <View style={[styles.soloBadge, { backgroundColor: accentColor }]}>
                                            <Text style={[styles.soloBadgeTxt, { color: isAdri ? '#FFF' : '#000' }]}>
                                                {key === 'photoFront' ? 'VISTA FRONTAL' : key === 'photoSide' ? 'VISTA LATERAL' : 'VISTA POSTERIOR'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        {/* Análise */}
                        <View style={styles.divider} />
                        <Text style={[styles.sectionTitle, { color: accentColor }]}>ANÁLISE DETALHADA</Text>
                        <View style={{ marginTop:10, marginBottom:10 }}>
                            {displayFeedback.split('\n').map((para, i) => (
                                <Text key={i} style={styles.reportText}>
                                    {para.split(/(\*[^*]+\*)/g).map((part, j) =>
                                        part.startsWith('*') && part.endsWith('*')
                                            ? <Text key={j} style={{ fontWeight:'900', color:'#FFF' }}>{part.slice(1,-1)}</Text>
                                            : part
                                    )}
                                </Text>
                            ))}
                        </View>

                        {/* Assinatura */}
                        <View style={[styles.footer, { borderColor: accentColor }]}>
                            {isAdri ? (
                                <Image source={require('../../assets/paelite.jpg')} style={[styles.footerAvatar, { borderColor: accentColor }]} />
                            ) : (
                                <Image source={require('../../assets/paulo-foto-perfil.png')} style={[styles.footerAvatar, { borderColor: accentColor }]} />
                            )}
                            <View style={{ flex:1 }}>
                                <Text style={styles.coachName}>{isAdri ? 'ADRI KERN' : 'PAULO ADRIANO'}</Text>
                                <Text style={[styles.coachTitle, { color: accentColor }]}>
                                    {isAdri ? 'POSING COACH | ELITE FIT' : 'HEAD COACH | ELITE FIT'}
                                </Text>
                            </View>
                            {isAdri
                                ? <MaterialCommunityIcons name="star-check" size={32} color={accentColor} />
                                : <Image source={require('../../assets/logo-pa.png')} style={{ width:45, height:45 }} resizeMode="contain" />
                            }
                        </View>

                        <TouchableOpacity
                            style={[styles.readBtn, { backgroundColor: accentColor }]}
                            onPress={markFeedbackAsRead}
                            disabled={isMarkingAsRead}>
                            {isMarkingAsRead
                                ? <ActivityIndicator color="#000" />
                                : <Text style={[styles.readBtnTxt, { color: isAdri ? '#FFF' : '#000' }]}>
                                    {isAdri ? 'COMPREENDIDO! 👊' : 'COMPREENDIDO, COACH! 👊'}
                                  </Text>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay:        { flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center' },
    content:        { width:'100%', height:'100%', maxWidth:500, alignSelf:'center', backgroundColor:'#111', overflow:'hidden' },
    header:         { alignItems:'center', paddingHorizontal:25, paddingTop: Platform.OS==='android' ? StatusBar.currentHeight + 20 : 40, paddingBottom:25, borderBottomWidth:1, position:'relative' },
    closeBtn:       { position:'absolute', right:20, top: Platform.OS==='android' ? (StatusBar.currentHeight ?? 20) + 15 : 30, zIndex:10 },
    title:          { color:'#FFF', fontSize:22, fontWeight:'900', letterSpacing:1, textAlign:'center' },
    subtitle:       { fontWeight:'bold', letterSpacing:1, textAlign:'center', marginTop:4, fontSize:13 },
    dateBadge:      { marginTop:15, paddingHorizontal:15, paddingVertical:6, borderRadius:10 },
    dateText:       { fontSize:11, fontWeight:'900' },
    compPhoto:      { width:130, height:200, borderRadius:12, overflow:'hidden', position:'relative' },
    compPhotoImg:   { width:'100%', height:'100%' },
    compBadgeDark:  { position:'absolute', bottom:8, alignSelf:'center', backgroundColor:'#333', paddingHorizontal:10, paddingVertical:4, borderRadius:12 },
    compBadgeAccent:{ position:'absolute', bottom:8, alignSelf:'center', paddingHorizontal:10, paddingVertical:4, borderRadius:12 },
    compBadgeTxt:   { color:'#FFF', fontSize:8, fontWeight:'900' },
    soloPhoto:      { width:220, height:320, borderRadius:20, overflow:'hidden', backgroundColor:'#0a0a0a', borderWidth:1, borderColor:'#333', position:'relative' },
    soloPhotoImg:   { width:'100%', height:'100%' },
    soloBadge:      { position:'absolute', bottom:15, alignSelf:'center', paddingHorizontal:15, paddingVertical:6, borderRadius:20 },
    soloBadgeTxt:   { fontWeight:'900', fontSize:10, letterSpacing:1 },
    divider:        { height:1, backgroundColor:'#333', marginBottom:30 },
    sectionTitle:   { fontSize:18, fontWeight:'900', letterSpacing:1 },
    reportText:     { fontSize:16, lineHeight:28, marginBottom:15, color:'#DDD' },
    footer:         { flexDirection:'row', alignItems:'center', padding:20, borderRadius:20, borderWidth:1, marginTop:30, backgroundColor:'#1A1A1A' },
    footerAvatar:   { width:60, height:60, borderRadius:30, marginRight:15, borderWidth:2 },
    coachName:      { color:'#FFF', fontSize:16, fontWeight:'900', letterSpacing:0.5 },
    coachTitle:     { fontSize:10, fontWeight:'900', letterSpacing:1, marginTop:2 },
    readBtn:        { width:'100%', padding:18, borderRadius:12, alignItems:'center', marginTop:30, marginBottom:20 },
    readBtnTxt:     { fontWeight:'900', fontSize:14, letterSpacing:1 },
});