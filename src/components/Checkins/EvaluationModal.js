import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ComparePhotosGrid from './ComparePhotosGrid';

export default function EvaluationModal({ theme, hookData }) {
    const {
        evaluationModalVisible, setEvaluationModalVisible, evaluationType, handleTabChange,
        compareSource, setCompareSource, showDatePicker, setShowDatePicker, getOldCheckin,
        safeDate, savedCompareUrls, checkins, currentCheckinForEval, setSelectedOldCheckinId,
        setSavedCompareUrls, selectedOldCheckinId, pickCustomOldImage, removeCustomOldImage,
        oldFront, oldSide, oldBack, customOldDate, setCustomOldDate, customOldWeight,
        setCustomOldWeight, contextText, setContextText, generateAIFeedback, isGeneratingAI,
        feedbackText, setFeedbackText, submitEvaluation, sendingEvaluation
    } = hookData;

    if (!evaluationModalVisible) return null;

    return (
        <View style={styles.modalBgAbsolute}>
            <View style={[styles.evalModalContent, { backgroundColor: theme.bg }]}>
                
                <View style={[styles.evalHeader, { borderBottomColor: 'rgba(128,128,128,0.2)' }]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                        <MaterialCommunityIcons name="bullseye-arrow" size={24} color={theme.accent} />
                        <Text style={[styles.evalTitle, { color: theme.text }]}>PAINEL DE ANÁLISE</Text>
                    </View>
                    <TouchableOpacity onPress={() => setEvaluationModalVisible(false)} style={{padding: 5}}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.evalScrollView}
                    contentContainerStyle={{ padding: 25, paddingBottom: 80 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                >
                    <View style={{flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, padding: 4, marginBottom: 25, borderWidth: 1, borderColor: theme.border}}>
                        <TouchableOpacity 
                            style={[styles.tabBtn, { backgroundColor: evaluationType === 'initial' ? theme.accent : 'transparent' }]}
                            onPress={() => handleTabChange('initial')}
                        >
                            <Text style={[styles.tabBtnText, { color: evaluationType === 'initial' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>ANÁLISE ÚNICA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tabBtn, { backgroundColor: evaluationType === 'comparison' ? theme.accent : 'transparent' }]}
                            onPress={() => handleTabChange('comparison')}
                        >
                            <Text style={[styles.tabBtnText, { color: evaluationType === 'comparison' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>COMPARATIVO</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {evaluationType === 'comparison' && (
                        <View style={{marginBottom: 25, padding: 15, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border}}>
                            
                            <View style={{flexDirection: 'row', backgroundColor: theme.bg, borderRadius: 8, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: theme.border}}>
                                <TouchableOpacity 
                                    style={[styles.sourceBtn, { backgroundColor: compareSource === 'system' ? theme.accent + '22' : 'transparent' }]}
                                    onPress={() => setCompareSource('system')}
                                >
                                    <Text style={[styles.sourceBtnText, { color: compareSource === 'system' ? theme.accent : theme.textSecondary }]}>SISTEMA</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.sourceBtn, { backgroundColor: compareSource === 'gallery' ? theme.accent + '22' : 'transparent' }]}
                                    onPress={() => setCompareSource('gallery')}
                                >
                                    <Text style={[styles.sourceBtnText, { color: compareSource === 'gallery' ? theme.accent : theme.textSecondary }]}>GALERIA</Text>
                                </TouchableOpacity>
                            </View>

                            {compareSource === 'system' ? (
                                <>
                                    <Text style={{fontSize: 10, fontWeight: '900', color: theme.accent, marginBottom: 10, letterSpacing: 0.5}}>SELECIONE A FOTO BASE DO APLICATIVO</Text>
                                    <TouchableOpacity 
                                        style={[styles.dateDropdown, {backgroundColor: theme.bg, borderColor: theme.border}]} 
                                        onPress={() => setShowDatePicker(!showDatePicker)}
                                    >
                                        <MaterialCommunityIcons name="calendar-clock" size={18} color={theme.textSecondary} />
                                        <Text style={{flex: 1, color: theme.text, fontWeight: 'bold', fontSize: 13, marginLeft: 10}}>
                                            {getOldCheckin() ? safeDate(getOldCheckin().date || getOldCheckin().createdAt).toLocaleDateString('pt-BR') : (savedCompareUrls ? 'Fotos da base anterior' : 'Escolha uma data...')}
                                        </Text>
                                        <MaterialCommunityIcons name={showDatePicker ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <View style={[styles.dateList, {backgroundColor: theme.bg, borderColor: theme.border}]}>
                                            {checkins.filter(c => c.id !== currentCheckinForEval?.id).map((c) => (
                                                <TouchableOpacity 
                                                    key={c.id} 
                                                    style={[styles.dateListItem, {borderBottomColor: theme.border}]}
                                                    onPress={() => { setSelectedOldCheckinId(c.id); setSavedCompareUrls(null); setShowDatePicker(false); }}
                                                >
                                                    <Text style={{color: theme.text, fontSize: 13, fontWeight: '600'}}>
                                                        {safeDate(c.date || c.createdAt).toLocaleDateString('pt-BR')} 
                                                    </Text>
                                                    {selectedOldCheckinId === c.id && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Text style={{fontSize: 10, fontWeight: '900', color: theme.accent, marginBottom: 10, letterSpacing: 0.5}}>SELECIONE FOTOS EXTERNAS</Text>
                                    
                                    <View style={styles.specificSlotsContainer}>
                                        <TouchableOpacity style={styles.slotBox} onPress={() => pickCustomOldImage('front')}>
                                            {oldFront ? (
                                                <>
                                                    <Image source={{ uri: oldFront.uri }} style={styles.slotImg} />
                                                    <TouchableOpacity style={styles.slotRemove} onPress={() => removeCustomOldImage('front')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity>
                                                </>
                                            ) : (
                                                <View style={styles.slotEmpty}>
                                                    <MaterialCommunityIcons name="account" size={24} color={theme.textSecondary} />
                                                    <Text style={[styles.slotText, { color: theme.textSecondary }]}>FRENTE</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.slotBox} onPress={() => pickCustomOldImage('side')}>
                                            {oldSide ? (
                                                <>
                                                    <Image source={{ uri: oldSide.uri }} style={styles.slotImg} />
                                                    <TouchableOpacity style={styles.slotRemove} onPress={() => removeCustomOldImage('side')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity>
                                                </>
                                            ) : (
                                                <View style={styles.slotEmpty}>
                                                    <MaterialCommunityIcons name="human-male-height" size={24} color={theme.textSecondary} />
                                                    <Text style={[styles.slotText, { color: theme.textSecondary }]}>LADO</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.slotBox} onPress={() => pickCustomOldImage('back')}>
                                            {oldBack ? (
                                                <>
                                                    <Image source={{ uri: oldBack.uri }} style={styles.slotImg} />
                                                    <TouchableOpacity style={styles.slotRemove} onPress={() => removeCustomOldImage('back')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity>
                                                </>
                                            ) : (
                                                <View style={styles.slotEmpty}>
                                                    <MaterialCommunityIcons name="account-arrow-left" size={24} color={theme.textSecondary} />
                                                    <Text style={[styles.slotText, { color: theme.textSecondary }]}>COSTAS</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{fontSize: 10, fontWeight: '900', color: theme.textSecondary, marginBottom: 5, letterSpacing: 0.5}}>DATA (OPCIONAL)</Text>
                                            <TextInput 
                                                style={[styles.customWeightInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                                placeholder="Ex: 10/01/26"
                                                placeholderTextColor={theme.textSecondary}
                                                value={customOldDate}
                                                onChangeText={setCustomOldDate}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{fontSize: 10, fontWeight: '900', color: theme.textSecondary, marginBottom: 5, letterSpacing: 0.5}}>PESO (OPCIONAL)</Text>
                                            <TextInput 
                                                style={[styles.customWeightInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                                placeholder="Ex: 85.5"
                                                placeholderTextColor={theme.textSecondary}
                                                keyboardType="numeric"
                                                value={customOldWeight}
                                                onChangeText={setCustomOldWeight}
                                            />
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    <ComparePhotosGrid theme={theme} hookData={hookData} />

                    <Text style={[styles.sectionLabel, { color: theme.text }]}>DIRECIONAMENTO (OPCIONAL)</Text>
                    <TextInput 
                        style={[styles.inputContext, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                        placeholder="Ex: Aluno relatou dor no ombro; foque nisso e evite falar do abdômen..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        value={contextText}
                        onChangeText={setContextText}
                    />

                    <TouchableOpacity 
                        style={[styles.generateAIBtn, {backgroundColor: theme.accent + '15', borderColor: theme.accent}]}
                        onPress={generateAIFeedback}
                        disabled={isGeneratingAI}
                    >
                        {isGeneratingAI ? <ActivityIndicator color={theme.accent} size="small" /> : (
                            <>
                                <MaterialCommunityIcons name="robot-outline" size={22} color={theme.accent} />
                                <Text style={{color: theme.accent, fontWeight: '900', fontSize: 13, marginLeft: 10, letterSpacing: 0.5}}>GERAR FEEDBACK COM IA</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={{fontSize: 11, fontWeight: '900', color: theme.textSecondary, marginBottom: 10, marginTop: 30, letterSpacing: 0.5}}>
                        TEXTO DA AVALIAÇÃO (Enviado ao Aluno)
                    </Text>
                    <View style={[styles.evalInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="format-quote-open" size={20} color={theme.accent} style={{marginBottom: 8}} />
                        <TextInput 
                            style={[styles.evalInput, { color: theme.text }]} 
                            multiline 
                            placeholder="Digite a avaliação ou deixe a IA fazer o trabalho pesado..." 
                            placeholderTextColor={theme.textSecondary}
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.submitEvalBtn, {backgroundColor: currentCheckinForEval?.coachFeedback ? theme.surface : theme.accent, borderColor: currentCheckinForEval?.coachFeedback ? theme.border : theme.accent, borderWidth: 1}]}
                        onPress={submitEvaluation}
                        disabled={sendingEvaluation}
                    >
                        {sendingEvaluation ? <ActivityIndicator color={currentCheckinForEval?.coachFeedback ? theme.text : (theme.isDark ? '#000' : '#FFF')} /> : (
                            <Text style={{color: currentCheckinForEval?.coachFeedback ? theme.text : (theme.isDark ? '#000' : '#FFF'), fontWeight: '900', fontSize: 14, letterSpacing: 1}}>
                                {currentCheckinForEval?.coachFeedback ? 'SALVAR ALTERAÇÕES' : 'APROVAR E NOTIFICAR ALUNO'}
                            </Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </View>
        </View>
    );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  modalBgAbsolute: { 
      position: isWeb ? 'fixed' : 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  evalModalContent: { width: '100%', maxWidth: 960, maxHeight: '90vh', borderRadius: 30, borderWidth: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  evalScrollView: { flex: 1, minHeight: 0, ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}) },
  evalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, flexShrink: 0 },
  evalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  tabBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  tabBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  sourceBtn: { flex: 1, padding: 8, borderRadius: 6, alignItems: 'center' },
  sourceBtnText: { fontWeight: 'bold', fontSize: 10, letterSpacing: 0.5 },
  specificSlotsContainer: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  slotBox: { flex: 1, height: 120, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  slotEmpty: { alignItems: 'center', justifyContent: 'center' },
  slotText: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  slotImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  slotRemove: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFF', borderRadius: 10 },
  customWeightInput: { padding: 10, borderRadius: 8, borderWidth: 1, outlineStyle: 'none', fontSize: 13 },
  dateDropdown: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
  dateList: { borderWidth: 1, borderRadius: 12, marginTop: 5, maxHeight: 150, overflow: 'hidden' },
  dateListItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1 },
  inputContext: { padding: 15, borderRadius: 12, borderWidth: 1, minHeight: 80, textAlignVertical: 'top', outlineStyle: 'none', marginBottom: 25, fontSize: 14, marginTop: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '900', marginTop: 10, marginBottom: 5 },
  generateAIBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  evalInputContainer: { padding: 20, borderRadius: 20, borderWidth: 1 },
  evalInput: { minHeight: 120, fontSize: 15, lineHeight: 24, textAlignVertical: 'top', outlineStyle: 'none' },
  submitEvalBtn: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 30, elevation: 4 },
});